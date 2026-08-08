/* ============================================================
   game/match/Match — máquina de estados del partido interactivo.
   La resolución de jugadas vive en módulos hermanos y opera
   sobre esta instancia: chances.js (ocasiones, penales, goles),
   incidents.js (faltas, tarjetas, lesiones), shootout.js (tanda).

   CONTRATO DE DECISIONES — agregar una
   decisión nueva son SIEMPRE 3 pasos:
     1. creador en chances.js/incidents.js (setea m.decision)
     2. resolver aquí o en el módulo hermano
     3. ruteo en ui.js handleDecision
   | id           | la crea       | la resuelve                          |
   |--------------|---------------|--------------------------------------|
   | sequence     | sequences.js  | resolveSequenceAct                   |
   | penalty_mine | chances.js    | resolvePenaltyMine                   |
   | penalty_opp  | chances.js    | resolvePenaltyOpp                    |
   | last_man     | chances.js    | resolveLastMan                       |
   | injury_sub   | incidents.js  | UI: abre la Gestión en vivo → makeSub |
   | gk_red       | incidents.js  | ruteo UI → makeSub                   |
   | gk_emergency | incidents.js  | resolveGkEmergency                   |
   (protect y forced_sub se retiraron el la amarilla solo narra
   y el reemplazo del lesionado es manual en la Gestión de plantilla.)
   (`sequence` es multi-acto: resolver un acto puede dejar OTRA
   decisión `sequence` —el acto siguiente—; los loops de UI y smoke
   la reprocesan solos porque tick corta con decisión pendiente.)

   La UI lo maneja así:
     1. `tick` cada ~2s → avanza 1 min y devuelve false | true (hay decisión) | "halftime" | "pens" | "end"
     2. Si hay `decision`, la UI muestra el modal y llama al resolve* correspondiente según decision.id
     3. En "pens": startShootout + shootMyPen/shootOppPen hasta shootoutStatus.done
     4. Al final: result
   ============================================================ */
import { rnd } from "../../core/rng.js";
import { clamp } from "../../core/math.js";
import { genOpponentLineup } from "../opponents.js";
import { identityGapMult } from "../philosophy.js";
import { canPlayAt } from "../lineup.js";
import { playedPos } from "../ratings.js";
import { moraleBand } from "../morale.js";
import { AMBIENT_LINES } from "../../content/match/ambient.js";
import { teamPowers } from "./powers.js";
import * as Chances from "./chances.js";
import * as Sequences from "./sequences.js";
import * as SeqActs from "./sequence-acts.js";
import * as Incidents from "./incidents.js";
import * as Shootout from "./shootout.js";
import { hookOf, traitMoment } from "./trait-hooks.js";
import { newPressState, pressOn, tickPress, pressExtraMinutes, PRESS_MOD } from "./press.js";
import { newTally, tickStats } from "./stats.js";
import { newField, tickField, startHalfField, backlineRisk } from "./field.js";
import { newMomentum, closeMinute, assistantLine, noteMomentum, markMomentum } from "./match-momentum.js";
import { drainOppEnergy, matchFatigueRaw, LIVE_FATIGUE_SHARE } from "../medical.js";

// Frecuencias por tick de los eventos INDEPENDIENTES de las secuencias. Penal y
// último hombre se calibraron antes y quedan intactos; acá solo se fija cada cuánto asoman
// como evento suelto (antes vivían dentro de myChance/oppChance). Los remates AMBIENTE (la
// parte simulada del Bible §7) se escalan por AMBIENT_* para dejarle sitio al gol interactivo
// de las secuencias — son diales de balance del gate de A1.
const PEN_MINE_TICK = 0.016;   // ≈0.29/partido, como cuando vivía en myChance (0.07)
const PEN_OPP_TICK = 0.010;    // ≈0.18/partido, como cuando vivía en oppChance (0.06)
// El último hombre nace sobre todo de las SECUENCIAS (Sprint A2, absorción — decisión PO
// #7): contención rota o contra tras pérdida (sequences.js). BREAKAWAY_TICK conserva un
// canal ambiente CHICO — el pelotazo a la espalda que no nace de ninguna pérdida mía — y es
// deliberadamente PLANO: es el arma del underdog (medido: sin él, los débiles no le generan
// NINGÚN susto al favorito y BRA derivaba +3.7pp). La resolución del Sprint 1 sigue intacta.
// A3 lo subió 0.018 → 0.025: el contexto dinámico (marcador/rojas/fatiga en la generación)
// derivó +2.3..+2.7pp hacia el favorito —quien mejor explota las secuencias extra— y este
// canal PLANO es el contrapeso pactado (sensibilidad A2: ~−0.2pp por +0.001).
const BREAKAWAY_TICK = 0.025;
const AMBIENT_MINE = 0.28;     // el remate simulado propio cede algo de terreno a las secuencias
const AMBIENT_OPP = 0.40;
// Relato de ambiente: es NARRACIÓN pura (no toca el balance). Subió 0.35 → 0.55 con el
// reloj continuo: el partido dura ahora ~3 minutos de reloj de pared en vez de ~15
// segundos, y con la frecuencia vieja el relato quedaba muerto entre jugada y jugada.
const AMBIENT_LINE = 0.55;

// EL RELOJ CONTINUO: el tick avanza 1 minuto y el reloj CORRE a la vista. Toda la
// calibración del juego (penales, breakaway, faltas, remates ambiente) está expresada
// POR CADA 5 MINUTOS y se reescala en un solo lugar, `_roll`: los diales de arriba se
// leen por partido y no hay que tocarlos si cambia el tamaño del tick.
const MIN_PER_TICK = 1;

// EL DESCUENTO: tope duro de minutos agregados al final de cada tiempo.
const ADDED_MAX = 6;

export class Match {
  /**
   * @param my        { team, lineup: [6 refs al plantel], bench: [refs], mentalidad, buffs, moral }
   * @param oppTeam   equipo rival (jugable o no)
   * @param knockout  true = eliminatoria (empate → prórroga → penales)
   * @param oppBanned nombres del rival suspendidos (rojas del mundo vivo: run.rivalBans)
   */
  constructor(my, oppTeam, knockout, oppBanned = []) {
    this.my = my;
    this.oppTeam = oppTeam;
    // ESCALADA: la profundidad KO viaja en matchCtx (como moral/filo — el Match no
    // conoce la run) y enciende la forma de torneo del once rival (0 en grupos = ×1).
    this.koRound = my.koRound || 0;
    this.oppLineup = genOpponentLineup(oppTeam, oppBanned, this.koRound);
    // LA BRECHA DE IDENTIDAD (R3 + el dial del techo): el rival con más idea que yo
    // amplifica su modo Mundial, y al que le llevo ventaja le juegan la final de su
    // vida — las dos se apilan sobre p.forma (mismo canal, un solo campo en los datos).
    const gapMult = identityGapMult(oppTeam, my.filo?.etapa, this.koRound, my.filo?.nivel);
    if (gapMult !== 1) for (const p of this.oppLineup) p.forma *= gapMult;
    this.knockout = knockout;
    this.min = 0;
    // EL RELOJ: `min` es el minuto que corre; `nominal` el minuto en que termina el tiempo
    // EN CURSO (45 · 90 · 105 · 120) y `added` su descuento (null = todavía no se calculó).
    // Mientras min > nominal se juega el descuento y el reloj se canta 45+2 (ver clock).
    this.halfStart = 0;        // minuto en que arrancó el tiempo en curso (para medir sus momentos)
    this.nominal = 45;
    this.added = null;
    this.gMy = 0; this.gOpp = 0;
    this.feed = [];
    this.decision = null;      // decisión pendiente {id, title, text, options:[{label, hint, key}]}
    this.finished = false;
    this.subsLeft = 3;
    this.phase = "regular";    // regular | extra | pens | done
    this.pens = null;
    this.stats = { misTiros: 0, oppTiros: 0, decisiones: 0, penalesAtajados: 0 };
    // Panel de estadísticas del partido (match/stats.js): pases y córners, que el motor
    // no llevaba. Los tiros siguen en `stats` y la posesión la deriva `flow`.
    this.tally = newTally();
    // MATCH MOMENTUM (match/match-momentum.js): el gráfico de barras de la transmisión.
    // Es una SALIDA del simulador — nada de lo que hay acá abajo lo lee.
    this.mm = newMomentum();
    // EL TERRITORIO (match/field.js): dónde está la pelota, las dos alturas de bloque y
    // el mapa de calor de cada tiempo. A diferencia del momentum, esto SÍ es una entrada
    // del simulador: las jugadas que pueden aparecer dependen de él. El desfase de
    // carriles sale del dorsal del primer rival (dato ya sorteado: no gasta azar nuevo).
    this.field = newField(oppTeam, this.koRound, this.oppLineup[0]?.num || 0);
    this.scorers = [];
    this.assists = [];         // asistencias de MIS goles [{name, min}] (chances.goalMine)
    // Señales por protagonista para el cierre post-partido (momentum/morale):
    this.oppGoalMins = [];     // minutos de los goles rivales (¿nos empataron al final?)
    this.pensFallados = [];    // nombres míos que fallaron un penal (en juego o tanda)
    this.pensAtajadosPor = []; // nombre de MI arquero por cada penal que atajó
    this.lastManStops = [];    // MIS centrales que cortaron un gol como último hombre (+Momento)
    this.lastManFouls = [];    // MIS centrales que se ganaron tarjeta/penal como último hombre (−Momento)
    this.seq = null;           // secuencia en curso {type, prot/shooter, actIdx, bonus} o null (sequences.js)
    this._flow = [];           // todo lo GENERADO {min, side, w}: secuencia 3 · penal/mano a mano 2 · ambiente 1
    // Minutos jugados por jugador (para el cansancio post-partido, medical): los titulares
    // entran al minuto 0; un cambio cierra los del que sale y arranca los del que entra.
    this._minutes = new Map();                              // jugador → minutos ya acumulados (los que salieron)
    this._enteredAt = new Map(my.lineup.map(p => [p, 0]));  // jugador en cancha → minuto en que entró
    // EL BOTÓN DE PRESIÓN (match/press.js): estado del DT, no del simulador. Los minutos
    // presionados se acumulan aparte de los jugados porque cuestan el DOBLE de energía.
    this.press = newPressState();
    this._pressMin = new Map();                             // jugador → minutos presionados
    this._highMin = new Map();                              // jugador → sobrecosto del bloque adelantado
    this._drained = new Map();                              // jugador → energía ya cobrada EN VIVO (ver _drainMine)
    this.enHalftime = false;                                // el equipo está parado: mover el bloque es gratis
  }

  // ---------- Estado y consultas ----------

  /** Agrega una línea al relato del partido (kind define el estilo visual en la UI).
   *  `min` es el minuto CRUDO (91, 92…): lo lee el cálculo del descuento. `clock` es el
   *  mismo instante como lo canta la tele ("45+2"), para que el relato pueda mostrar el
   *  minuto en su propia columna sin tener que sacarlo del texto a fuerza de regex. */
  log(kind, text) { this.feed.push({ min: this.min, clock: this.clock(), kind, text }); }

  /** El minuto como lo canta la tele: "45+2" durante el descuento, "63" en juego corrido.
   *  TODO el relato lo usa (`min ${m.clock}'`); `m.min` sigue siendo el número crudo. */
  clock() { return this.min > this.nominal ? `${this.nominal}+${this.min - this.nominal}` : `${this.min}`; }

  /** Mis jugadores actualmente en cancha (sin expulsados ni lesionados). */
  activeMine() { return this.my.lineup.filter(p => !p.expulsado && !p.lesionado); }

  /** Suplentes que aún pueden entrar (no usados, no sustituidos previamente). */
  availableBench() {
    return this.my.bench.filter(b => !b.usado && !b.sustituido && !b.suspendido && !(b.lesionadoPartidos > 0));
  }

  /**
   * Suplentes elegibles para reemplazar a `outPlayer`. Regla simétrica: el arco solo lo
   * cubre un arquero, y un arquero no sale a la cancha (lineup.canPlayAt) — sus stats son
   * otro juego. La regla se vigila en LAS DOS direcciones: vigilar una sola deja mandar a
   * un jugador de campo al arco, y el equipo termina sin arquero y con 6 de campo.
   */
  eligibleFor(outPlayer) {
    return this.availableBench().filter(b => canPlayAt(b, playedPos(outPlayer)));
  }

  /** Poderes actuales de ambos equipos (se recalculan en cada tick: cambios y tarjetas afectan). */
  powers() {
    const mine = teamPowers(this.my.lineup, this.my.mentalidad, this.my.buffs);
    const opp = teamPowers(this.oppLineup, "normal", {});
    // La presión encendida se suma por el MISMO caño que la mentalidad: ataca mejor y
    // se expone atrás. Es una orden del DT con costo (energía), no un rasgo.
    if (pressOn(this)) { mine.atk = Math.max(0.5, mine.atk + PRESS_MOD.atk); mine.def = Math.max(0.5, mine.def + PRESS_MOD.def); }
    return { mine, opp };
  }

  // ---------- Simulación por tick ----------

  /**
   * Tira una moneda calibrada POR CADA 5 MINUTOS de juego (la unidad en la que están
   * expresados todos los diales del partido desde el Sprint A1) y la reescala al largo
   * real del tick. Un solo lugar para el reloj continuo: los números de balance de arriba
   * no cambian de significado, cambia cuántas veces se los pregunta.
   */
  _roll(p5) { return rnd() < (p5 * MIN_PER_TICK) / 5; }

  /** Avanza 1 min de juego. Devuelve false (seguir) | true (decisión) | "halftime" | "pens" | "end". */
  tick() {
    if (this.finished || this.decision) return true;
    // El partido volvió a rodar: se acabó la ventana gratis para mover el bloque.
    this.enHalftime = false;

    // MATCH MOMENTUM: se cierra la barra del minuto que TERMINA, antes de tocar nada más.
    // Va acá arriba a propósito: los actos de una secuencia se resuelven con el reloj
    // congelado (fuera de tick), así que sus empujones caen en el minuto en que arrancó
    // la jugada — que es donde el jugador los vio pasar.
    closeMinute(this);
    // El consejo del asistente ya NO va al relato: desde el rediseño del partido tiene
    // sitio propio al pie del Centro de mando, donde queda FIJO hasta que haya uno nuevo.
    // En el relato duraba tres segundos y se lo llevaba el scroll. Lo deja en `mm.talk`.
    assistantLine(this);

    // EL DESCUENTO: al pisar el minuto nominal el cuarto árbitro levanta el cartel y se
    // sigue jugando hasta nominal+added. Se calcula UNA vez por tiempo (added === null =
    // aún no se calculó) y ese tick no avanza el reloj: el cartel se lee antes de seguir.
    if (this.added === null && this.min >= this.nominal) {
      this.added = this._stoppage();
      if (this.added > 0) {
        this.log("info", `⏱️ ${this.nominal}' — El cuarto árbitro levanta el cartel: ${this.added} minuto${this.added > 1 ? "s" : ""} de descuento.`);
        return false;
      }
    }
    if (this.min >= this.nominal + (this.added ?? 0)) return this._endOfHalf();

    this.min += MIN_PER_TICK;
    // La ráfaga de presión vence por minutos de partido (no por reloj de pared: una
    // secuencia congela el relato mientras el DT lee). Se resuelve ANTES de calcular
    // poderes para que el tick que la apaga ya no la cobre.
    // Primero se COBRA el minuto recién jugado (si la ráfaga venía encendida) y recién
    // después se la vence: al revés, el último tramo de cada ráfaga salía gratis.
    if (pressOn(this)) for (const p of this.activeMine()) this._pressMin.set(p, (this._pressMin.get(p) || 0) + MIN_PER_TICK);
    tickPress(this);
    // El rival se cansa mientras juega (medical.drainOppEnergy): llega al 90' cerca de
    // 58 de energía. El Rondo (Posesión) acelera el drenaje — el rondo son ELLOS
    // corriendo. Va ANTES de powers para que el tick ya lo cobre en sus duelos.
    drainOppEnergy(this.oppLineup, MIN_PER_TICK, hookOf(this, "oppStamina")?.factor || 1);
    // Y MI equipo también. Va acá, al lado del rival, porque es el mismo hecho: el
    // partido se juega con las piernas y las piernas se vacían mientras corre.
    this._drainMine();

    const { mine, opp } = this.powers();
    // Estadísticas de transmisión (pases y córners ambiente). Va ANTES de las jugadas:
    // el minuto ya jugado cuenta aunque el tick corte con una decisión.
    tickStats(this, mine, opp);
    // EL TERRITORIO: la deriva del minuto (dónde se está jugando) y su calor. Va acá
    // arriba a propósito — las jugadas que nacen más abajo LEEN la zona resultante.
    tickField(this, mine, opp);

    // Key Sequences: la columna interactiva del partido. Reemplazan a las
    // ocasiones sueltas de myChance/oppChance; 5-9 por partido moduladas por la preparación.
    if (Sequences.maybeStartSequence(this)) return true;

    // Eventos interactivos INDEPENDIENTES de las secuencias (penal y último hombre, intactos
    // del calibrado previo; A1 no toca su matemática, solo cada cuánto asoman como evento suelto).
    if (this._roll(PEN_MINE_TICK)) { this._flow.push({ min: this.min, side: "mine", w: 2 }); return Chances.myPenaltyChance(this); }
    // EL ESPACIO A LA ESPALDA: el pelotazo que salta mi línea
    // vale lo que mi bloque le regala. Neutro con el bloque medio; el que juega muy
    // alto multiplica este riesgo — es el precio honesto de robar arriba.
    if (this._roll(BREAKAWAY_TICK * backlineRisk(this))) {
      // Anticipar la Espalda: el central que LEYÓ el pelotazo lo corta antes del
      // mano a mano (el canal ambiente del breakaway — exactamente el fútbol que este
      // rasgo compra: la vacuna contra el balón largo que salta la presión). La
      // calibración del último hombre queda intacta: se corta ANTES de nacer.
      const g = hookOf(this, "breakawayGuard");
      if (g && rnd() < g.p) { traitMoment(this, g.traitId, [g.texto]); }
      else if (Chances.lastManChance(this)) { this._flow.push({ min: this.min, side: "opp", w: 2 }); return true; }
    }
    if (this._roll(PEN_OPP_TICK)) { this._flow.push({ min: this.min, side: "opp", w: 2 }); return Chances.oppPenaltyChance(this); }

    // Ocasiones SIMULADAS (no interactivas): la parte "el resto se simula" del Bible §7.
    const ratioMy = mine.atk / (mine.atk + opp.def);
    if (this._roll((0.12 + 0.22 * ratioMy) * AMBIENT_MINE)) { this._flow.push({ min: this.min, side: "mine", w: 1 }); Chances.ambientShotMine(this); }
    const ratioOpp = opp.atk / (opp.atk + mine.def);
    if (this._roll((0.09 + 0.24 * ratioOpp) * AMBIENT_OPP)) { this._flow.push({ min: this.min, side: "opp", w: 1 }); Chances.ambientShotOpp(this, mine); }

    // Faltas / tarjetas / lesiones
    if (this._roll(0.10)) return this._foulEvent();
    if (this._roll(0.028)) return this._injuryEvent();

    // Relato ambiente contextual: el pool vive en content/match/ambient.js y LEE el partido.
    if (this._roll(AMBIENT_LINE)) this.log("plain", this._ambientLine());
    return false;
  }

  /**
   * EL DESGASTE EN VIVO — mis jugadores se vacían MIENTRAS
   * el partido corre, no de un saque al terminar.
   *
   * Antes, un titular jugaba los 90 minutos con la energía exacta con la que había
   * llegado y el costo entero se le descontaba en el cierre. O sea: el partido tenía un
   * precio pero no se sentía nunca DENTRO del partido — el equipo del minuto 88 rendía
   * igual que el del minuto 3, y el rival (que sí se cansaba, drainOppEnergy) era el
   * único de los dos que se apagaba. Ahora los dos pagan el mismo dial en el mismo sitio.
   *
   * LO QUE NO CAMBIA es cuánto cuesta un partido: se cobra minuto a minuto lo mismo que
   * antes se cobraba de golpe, y el cierre solo cobra la diferencia (`drainedByName` →
   * medical.applyMedicalPostMatch). La economía de energía entre partidos —el dial más
   * sensible del juego, ver powers.ENERGY_OK— queda intacta punto por punto.
   *
   * Se calcula por TOTALES y no por deltas a propósito: leer los acumuladores
   * (`_minutes`/`_enteredAt`, `_pressMin`, `_highMin`) y cobrar lo que falte es idempotente
   * — un tick de más no cobra dos veces, y el que entra desde el banco arranca su cuenta
   * en cero sin que haya que avisarle a nadie. El sobrecosto del bloque adelantado del
   * minuto en curso entra un tick más tarde (lo acumula tickField, más abajo en el tick):
   * es un minuto de retraso sobre 90, y el total del partido igual sale exacto.
   *
   * El golpe de una lesión (−20, incidents) NO se toca: como acá solo se cobra la
   * diferencia, ese descuento sobrevive entero.
   */
  _drainMine() {
    for (const p of this.activeMine()) {
      const jugados = (this._minutes.get(p) || 0) + Math.max(0, this.min - (this._enteredAt.get(p) ?? this.min));
      // Los minutos presionados cuestan el DOBLE: ya están dentro de `jugados` una vez y
      // se suman una segunda, con el descuento de Pulmones de Acero / Anaeróbicos. El
      // sobrecosto del bloque alto va por el mismo caño y sin ese descuento (field.js).
      const extra = pressExtraMinutes(this, this._pressMin.get(p) || 0) + (this._highMin.get(p) || 0);
      const debe = matchFatigueRaw(jugados + extra) * LIVE_FATIGUE_SHARE;
      const cobrado = this._drained.get(p) || 0;
      if (debe <= cobrado) continue;
      p.energia = clamp(p.energia - (debe - cobrado), 5, 100);
      this._drained.set(p, debe);
    }
  }

  /** Energía ya descontada EN VIVO, por NOMBRE (§3.1). La lee el cierre del partido para
   *  cobrar solo lo que falte y no cobrar el partido dos veces (game/flow). */
  drainedByName() {
    const out = {};
    for (const [p, e] of this._drained) out[p.name] = e;
    return out;
  }

  /**
   * EL DESCUENTO del tiempo que termina, en minutos (tope duro ADDED_MAX = 6).
   * Mientras MÁS MOMENTOS tuvo el tramo, más tiempo: pesa todo lo GENERADO (el mismo
   * `_flow` del que salen posesión y momentum — secuencia 3 · penal 2 · ambiente 1) y
   * aparte las paradas largas (goles y tarjetas, que frenan el reloj de verdad).
   * Y el tiempo que CIERRA cada fase (90' / 120') se estira si el partido está empatado
   * o a un gol: el descuento largo es dramaturgia, y ahí es donde vale.
   * Los tiempos de 15' (prórroga) escalan por su largo — nunca cobran un descuento de 45'.
   */
  _stoppage() {
    const cierre = this.nominal === 90 || this.nominal === 120;
    const momentos = this._flow.reduce((s, f) => s + (f.min > this.halfStart ? f.w : 0), 0);
    const paradas = this.feed.filter(f => f.min > this.halfStart
      && (f.kind === "goal" || f.kind === "goal_opp" || f.kind === "card")).length;
    const apretado = cierre && Math.abs(this.gMy - this.gOpp) <= 1 ? 1.2 : 0;
    const largo = (this.nominal - this.halfStart) / 45;  // 1 en los tiempos de 45', ⅓ en los de 15'
    const crudo = ((cierre ? 2.0 : 0.6) + momentos * 0.05 + paradas * 0.7 + apretado) * largo;
    return Math.max(cierre ? 1 : 0, Math.min(ADDED_MAX, Math.round(crudo)));
  }

  /** Se acabó el tiempo en curso (nominal + descuento ya jugados). */
  _endOfHalf() {
    if (this.nominal === 45 || this.nominal === 105) {
      this.log("info", this.nominal === 45 ? "⏸️ Entretiempo. Ajusta tu equipo si quieres." : "⏸️ Fin del primer tiempo extra.");
      this.enHalftime = true;   // con el equipo parado, mover el bloque no cuesta ventana
      this._startHalf(this.nominal, this.nominal === 45 ? 90 : 120);
      return "halftime";
    }
    return this._finishRegular();
  }

  /**
   * Arranca un tiempo nuevo. El reloj VUELVE al minuto nominal: el descuento no se
   * acumula (el segundo tiempo empieza 45', como en la vida real), así los minutos
   * jugados, la energía y las ventanas de contexto (min >= 75) siguen valiendo lo mismo.
   */
  _startHalf(desde, nominal) {
    this.min = desde;
    this.halfStart = desde;
    this.nominal = nominal;
    this.added = null;
    // Cada tiempo tiene su PROPIO mapa de calor (decisión de diseño del sprint del
    // Territorio) y arranca con la pelota al medio, como el saque.
    startHalfField(this, nominal);
    // El que entró DURANTE el descuento entró, para los minutos jugados, en `desde`.
    for (const [p, enter] of this._enteredAt) if (enter > desde) this._enteredAt.set(p, desde);
  }

  /**
   * Posesión y momentum DERIVADOS de lo generado: quién generó qué, no
   * números inventados. `pos` = % mío sobre el peso acumulado (con prior neutral: arranca
   * 50/50 y una sola jugada no lo dispara); `net` = mi peso − el suyo en los últimos 15'
   * (el momentum visible). La UI lo pinta; acá solo se deriva.
   */
  flow() {
    const K = 5;
    let mine = 0, opp = 0, net = 0;
    for (const f of this._flow) {
      if (f.side === "mine") mine += f.w; else opp += f.w;
      if (f.min > this.min - 15) net += f.side === "mine" ? f.w : -f.w;
    }
    return { pos: Math.round(100 * (K + mine) / (2 * K + mine + opp)), net };
  }

  /** Elige la línea de ambiente: arma el ctx del partido y deja que el pool (content) decida el flavor. */
  _ambientLine() {
    const act = this.activeMine();
    const ctx = {
      min: this.min, late: this.min >= 75, diff: this.gMy - this.gOpp,
      myReds: this.my.lineup.filter(p => p.expulsado).length,
      oppReds: this.oppLineup.filter(p => p.expulsado).length,
      tired: act.reduce((s, p) => s + p.energia, 0) / Math.max(1, act.length) < 55,
      band: moraleBand(this.my.moral ?? 50).id,
      net: this.flow().net,
      // El ambiente lee la FILOSOFÍA: id y ETAPA de matchCtx.filo (0..2 — sus
      // líneas comparan contra la escala original de F1), null sin identidad
      filo: this.my.filo?.id ?? null,
      filoLvl: this.my.filo?.etapa ?? 0,
    };
    const pool = AMBIENT_LINES.filter(l => l.when(ctx));
    return this._weightedPick(pool, pool.map(l => l.w)).text(this);
  }

  // ---------- Delegación a los módulos de jugadas ----------

  resolveSequenceAct(key) { return SeqActs.resolveSequenceAct(this, key); }
  resolvePenaltyMine(name) { return Chances.resolvePenaltyMine(this, name); }
  resolvePenaltyOpp(key) { return Chances.resolvePenaltyOpp(this, key); }
  resolveLastMan(key) { return Chances.resolveLastMan(this, key); }
  _foulEvent() { return Incidents.foulEvent(this); }
  _injuryEvent() { return Incidents.injuryEvent(this); }
  startShootout() { return Shootout.startShootout(this); }
  shootoutStatus() { return Shootout.shootoutStatus(this); }
  shootMyPen(takerName, dir) { return Shootout.shootMyPen(this, takerName, dir); }
  shootOppPen(guess) { return Shootout.shootOppPen(this, guess); }

  // ---------- Cambios ----------

  /**
   * Sustitución (out: jugador en cancha, inName: nombre del banco).
   * Reglas: máx. 3 cambios; el sustituido NO reingresa; un POR suplente solo entra por el POR.
   * `force` salta la última regla (se usa al reemplazar de urgencia a un arquero expulsado).
   */
  makeSub(outPlayer, inName, force = false) {
    const inP = this.my.bench.find(b => b.name === inName);
    if (!inP || this.subsLeft <= 0) return false;
    if (inP.usado || inP.sustituido) return false;
    // El que entra tiene que poder ocupar el puesto del que sale. `force` es la excepción
    // de la roja al arquero: ahí el POR suplente entra por un jugador de campo y se va al
    // arco igual (lo resuelve `posJugada`, abajo). No hay excepción a la inversa: al arco
    // no entra un jugador de campo — no tiene atajadas.
    if (!force && !canPlayAt(inP, outPlayer.posJugada || outPlayer.pos)) return false;
    const idx = this.my.lineup.indexOf(outPlayer);
    if (idx === -1) return false;
    inP.usado = true;
    // El que entra ocupa el puesto del que sale, no el suyo natural: si salía un delantero
    // improvisado de defensa, el recambio también juega ahí (y se lo castiga). Excepción
    // obligatoria: el arquero que entra por la roja al arquero sale por un jugador de campo
    // (`force`), y va al arco — no al puesto del que salió.
    const puesto = outPlayer.posJugada || outPlayer.pos;
    inP.posJugada = canPlayAt(inP, puesto) ? puesto : inP.pos;
    this.my.lineup[idx] = inP;
    this.my.bench = this.my.bench.filter(b => b !== inP);
    this._accrueMinutes(outPlayer);          // cierra los minutos del que sale
    this._enteredAt.set(inP, this.min);      // el que entra empieza a contar ahora
    outPlayer.sustituido = true;
    if (!outPlayer.lesionado) this.my.bench.push(outPlayer); // queda visible en banca, en gris
    outPlayer.enCancha = false;
    this.subsLeft--;
    markMomentum(this, "🔄");
    this.log("info", `min ${this.clock()}' — 🔄 Cambio: entra #${inP.num || "?"} ${inP.name} por #${outPlayer.num || "?"} ${outPlayer.name}.`);
    return true;
  }

  /**
   * Resuelve la decisión `gk_emergency` (bug fix,): el equipo se quedó sin
   * arquero real (el suyo salió por lesión/roja y no hay suplente POR en la banca) y el
   * DT elige a qué jugador de campo mandar al arco. NO es una sustitución — no gasta
   * cambio, es una reposición dentro del mismo once (como swapAssignments): el elegido
   * sigue en cancha, solo que ahora juega de arquero (`posJugada`). Sus stats de arco
   * salen de `ratings.EMERGENCY_GK_STATS`, no de las suyas (no existen — `statAt` ya lo
   * resuelve solo). Devuelve false si no hay decisión pendiente o el nombre no es válido.
   */
  resolveGkEmergency(playerName) {
    if (!this.decision || this.decision.id !== "gk_emergency") return false;
    const p = this.activeMine().find(x => x.name === playerName && x.pos !== "POR");
    if (!p) return false;
    p.posJugada = "POR";
    this.decision = null;
    markMomentum(this, "🧤");
    this.log("event", `min ${this.clock()}' — 🧤 ${p.name} se pone los guantes: no queda otra.`);
    return true;
  }

  // ---------- Cierre del partido ----------

  /** Al llegar al minuto final: en eliminatorias un empate deriva en prórroga y luego penales. */
  _finishRegular() {
    if (this.phase === "regular" && this.knockout && this.gMy === this.gOpp) {
      this.phase = "extra";
      this.log("info", "🕐 Empate. ¡Vamos a la PRÓRROGA! 30 minutos más.");
      this._startHalf(90, 105);
      return "halftime";
    }
    if (this.phase === "extra" && this.gMy === this.gOpp) {
      this.phase = "pens";
      this.log("info", "🎯 No lograron sacarse diferencia en 120 minutos. Nos vamos a los... ¡PENALES!");
      return "pens";
    }
    this.finished = true;
    this.phase = "done";
    return "end";
  }

  /** Elección aleatoria ponderada (protagonistas de ocasiones: DEL pesa más que MED, etc.). */
  _weightedPick(arr, weights) {
    const total = weights.reduce((a, b) => a + b, 0);
    let r = rnd() * total;
    for (let i = 0; i < arr.length; i++) { r -= weights[i]; if (r <= 0) return arr[i]; }
    return arr[arr.length - 1];
  }

  /** Cierra los minutos acumulados de un jugador que deja la cancha (cambio) en el minuto actual. */
  _accrueMinutes(p) {
    const enter = this._enteredAt.get(p);
    if (enter === undefined) return;
    this._minutes.set(p, (this._minutes.get(p) || 0) + Math.max(0, this.min - enter));
    this._enteredAt.delete(p);
    // Los minutos presionados ya viven en _pressMin tick a tick: el que sale se los lleva
    // acumulados y el que entra arranca en cero sin hacer nada acá.
  }

  /**
   * Minutos jugados por jugador, por NOMBRE (§3.1): los que salieron ya están cerrados en
   * `_minutes`; los que siguen en cancha se cierran al minuto actual (al llamarla el partido
   * ya terminó, así que `this.min` es el minuto final: 90 o 120). Lo usa medical para el
   * cansancio. No muta el estado — se puede llamar más de una vez.
   */
  minutesByName() {
    const out = {};
    for (const [p, m] of this._minutes) out[p.name] = m;
    for (const [p, enter] of this._enteredAt) out[p.name] = (out[p.name] || 0) + Math.max(0, this.min - enter);
    return out;
  }

  /** Minutos PRESIONADOS por jugador, por NOMBRE: el sobrecosto de energía del botón de
   *  presión (medical los cobra una vez más — presionar sale el doble). Espejo exacto de
   *  minutesByName, pero acumulado tick a tick porque la presión se enciende y se apaga. */
  pressMinutesByName() {
    const out = {};
    for (const [p, m] of this._pressMin) out[p.name] = m;
    return out;
  }

  /** Minutos de SOBRECOSTO por jugar con el bloque adelantado (field.HIGH_FATIGUE), por
   *  NOMBRE. Espejo de los presionados y se cobran por el mismo caño en `flow`: el que
   *  corre veinte metros más arriba llega más gastado al partido siguiente. */
  heightMinutesByName() {
    const out = {};
    for (const [p, m] of this._highMin) out[p.name] = m;
    return out;
  }

  /** Resultado final: marcador, ganador ("my"/"opp"/null=empate) y detalle de penales si hubo. */
  result() {
    let winner = null;
    if (this.gMy > this.gOpp) winner = "my";
    else if (this.gOpp > this.gMy) winner = "opp";
    else if (this.pens && this.pens.winner) winner = this.pens.winner;
    return { gMy: this.gMy, gOpp: this.gOpp, winner, pens: this.pens ? this.shootoutStatus() : null };
  }
}
