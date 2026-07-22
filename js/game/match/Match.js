/* ============================================================
   game/match/Match — máquina de estados del partido interactivo.
   La resolución de jugadas vive en módulos hermanos y opera
   sobre esta instancia: chances.js (ocasiones, penales, goles),
   incidents.js (faltas, tarjetas, lesiones), shootout.js (tanda).

   CONTRATO DE DECISIONES (ARQUITECTURA §3.2) — agregar una
   decisión nueva son SIEMPRE 3 pasos:
     1. creador en chances.js/incidents.js (setea m.decision)
     2. resolver aquí o en el módulo hermano
     3. ruteo en ui.js handleDecision()
   | id           | la crea       | la resuelve                          |
   |--------------|---------------|--------------------------------------|
   | sequence     | sequences.js  | resolveSequenceAct                   |
   | penalty_mine | chances.js    | resolvePenaltyMine                   |
   | penalty_opp  | chances.js    | resolvePenaltyOpp                    |
   | last_man     | chances.js    | resolveLastMan                       |
   | injury_sub   | incidents.js  | UI: abre la Gestión en vivo → makeSub |
   | gk_red       | incidents.js  | ruteo UI → makeSub                   |
   (protect y forced_sub se retiraron el 22-jul: la amarilla solo narra
   y el reemplazo del lesionado es manual en la Gestión de plantilla.)
   (`sequence` es multi-acto: resolver un acto puede dejar OTRA
   decisión `sequence` —el acto siguiente—; los loops de UI y smoke
   la reprocesan solos porque tick() corta con decisión pendiente.)

   La UI lo maneja así:
     1. `tick()` cada ~1s → avanza 5 min y devuelve false | true (hay decisión) | "halftime" | "pens" | "end"
     2. Si hay `decision`, la UI muestra el modal y llama al resolve* correspondiente según decision.id
     3. En "pens": startShootout() + shootMyPen()/shootOppPen() hasta shootoutStatus().done
     4. Al final: result()
   ============================================================ */
import { rnd } from "../../core/rng.js";
import { genOpponentLineup } from "../opponents.js";
import { canPlayAt } from "../lineup.js";
import { playedPos } from "../ratings.js";
import { moraleBand } from "../morale.js";
import { AMBIENT_LINES } from "../../content/ambient.js";
import { teamPowers } from "./powers.js";
import * as Chances from "./chances.js";
import * as Sequences from "./sequences.js";
import * as SeqActs from "./sequence-acts.js";
import * as Incidents from "./incidents.js";
import * as Shootout from "./shootout.js";

// Frecuencias por tick de los eventos INDEPENDIENTES de las secuencias (Sprint A1). Penal y
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
const AMBIENT_MINE = 0.85;     // el remate simulado propio cede algo de terreno a las secuencias
const AMBIENT_OPP = 0.70;

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
    this.oppLineup = genOpponentLineup(oppTeam, oppBanned);
    this.knockout = knockout;
    this.min = 0;
    this.gMy = 0; this.gOpp = 0;
    this.feed = [];
    this.decision = null;      // decisión pendiente {id, title, text, options:[{label, hint, key}]}
    this.finished = false;
    this.subsLeft = 3;
    this.phase = "regular";    // regular | extra | pens | done
    this.pens = null;
    this.stats = { misTiros: 0, oppTiros: 0, decisiones: 0, penalesAtajados: 0 };
    this.scorers = [];
    this.assists = [];         // asistencias de MIS goles [{name, min}] (chances.goalMine)
    // Señales por protagonista para el cierre post-partido (momentum/morale):
    this.oppGoalMins = [];     // minutos de los goles rivales (¿nos empataron al final?)
    this.pensFallados = [];    // nombres míos que fallaron un penal (en juego o tanda)
    this.pensAtajadosPor = []; // nombre de MI arquero por cada penal que atajó
    this.lastManStops = [];    // MIS centrales que cortaron un gol como último hombre (+Momento)
    this.lastManFouls = [];    // MIS centrales que se ganaron tarjeta/penal como último hombre (−Momento)
    this.seq = null;           // secuencia en curso {type, prot/shooter, actIdx, bonus} o null (sequences.js)
    this._flow = [];           // todo lo GENERADO {min, side, w}: secuencia 3 · penal/mano a mano 2 · ambiente 1 (A3, #11)
    // Minutos jugados por jugador (para el cansancio post-partido, medical): los titulares
    // entran al minuto 0; un cambio cierra los del que sale y arranca los del que entra.
    this._minutes = new Map();                              // jugador → minutos ya acumulados (los que salieron)
    this._enteredAt = new Map(my.lineup.map(p => [p, 0]));  // jugador en cancha → minuto en que entró
  }

  // ---------- Estado y consultas ----------

  /** Agrega una línea al relato del partido (kind define el estilo visual en la UI). */
  log(kind, text) { this.feed.push({ min: Math.min(this.min, this.phase === "extra" ? 120 : 90), kind, text }); }

  /** Mis jugadores actualmente en cancha (sin expulsados ni lesionados). */
  activeMine() { return this.my.lineup.filter(p => !p.expulsado && !p.lesionado); }

  /** Suplentes que aún pueden entrar (no usados, no sustituidos previamente). */
  availableBench() {
    return this.my.bench.filter(b => !b.usado && !b.sustituido && !b.suspendido && !(b.lesionadoPartidos > 0));
  }

  /**
   * Suplentes elegibles para reemplazar a `outPlayer`. Regla simétrica: el arco solo lo
   * cubre un arquero, y un arquero no sale a la cancha (lineup.canPlayAt) — sus stats son
   * otro juego. Antes solo se vigilaba una dirección y se podía mandar a un jugador de
   * campo al arco: el equipo quedaba sin arquero y con 6 de campo (bug reportado por el PO).
   */
  eligibleFor(outPlayer) {
    return this.availableBench().filter(b => canPlayAt(b, playedPos(outPlayer)));
  }

  /** Poderes actuales de ambos equipos (se recalculan en cada tick: cambios y tarjetas afectan). */
  powers() {
    const mine = teamPowers(this.my.lineup, this.my.mentalidad, this.my.buffs);
    const opp = teamPowers(this.oppLineup, "normal", {});
    return { mine, opp };
  }

  // ---------- Simulación por tick ----------

  /** Avanza ~5 min de juego. Devuelve false (seguir) | true (decisión) | "halftime" | "pens" | "end". */
  tick() {
    if (this.finished || this.decision) return true;
    const end = this.phase === "extra" ? 120 : 90;
    if (this.min >= end) return this._finishRegular();

    this.min += 5;

    const { mine, opp } = this.powers();

    // Entretiempo
    if (this.min === 45) { this.log("info", "⏸️ Entretiempo. Ajusta tu equipo si quieres."); return "halftime"; }
    if (this.phase === "extra" && this.min === 105) { this.log("info", "⏸️ Fin del primer tiempo extra."); return "halftime"; }

    // Key Sequences (Bible §7): la columna interactiva del partido. Reemplazan a las
    // ocasiones sueltas de myChance/oppChance; 2-6 por partido moduladas por la preparación.
    if (Sequences.maybeStartSequence(this)) return true;

    // Eventos interactivos INDEPENDIENTES de las secuencias (penal y último hombre, intactos
    // del calibrado previo; A1 no toca su matemática, solo cada cuánto asoman como evento suelto).
    if (rnd() < PEN_MINE_TICK) { this._flow.push({ min: this.min, side: "mine", w: 2 }); return Chances.myPenaltyChance(this); }
    if (rnd() < BREAKAWAY_TICK && Chances.lastManChance(this)) { this._flow.push({ min: this.min, side: "opp", w: 2 }); return true; }
    if (rnd() < PEN_OPP_TICK) { this._flow.push({ min: this.min, side: "opp", w: 2 }); return Chances.oppPenaltyChance(this); }

    // Ocasiones SIMULADAS (no interactivas): la parte "el resto se simula" del Bible §7.
    const ratioMy = mine.atk / (mine.atk + opp.def);
    if (rnd() < (0.12 + 0.22 * ratioMy) * AMBIENT_MINE) { this._flow.push({ min: this.min, side: "mine", w: 1 }); Chances.ambientShotMine(this); }
    const ratioOpp = opp.atk / (opp.atk + mine.def);
    if (rnd() < (0.09 + 0.24 * ratioOpp) * AMBIENT_OPP) { this._flow.push({ min: this.min, side: "opp", w: 1 }); Chances.ambientShotOpp(this, mine); }

    // Faltas / tarjetas / lesiones
    if (rnd() < 0.10) return this._foulEvent();
    if (rnd() < 0.028) return this._injuryEvent();

    // Relato ambiente contextual (A3): el pool vive en content/ambient.js y LEE el partido.
    if (rnd() < 0.35) this.log("plain", this._ambientLine());
    return false;
  }

  /**
   * Posesión y momentum DERIVADOS de lo generado (A3, decisión #11): quién generó qué, no
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
      // El ambiente lee la FILOSOFÍA (F3): id y nivel de matchCtx.filo, null sin identidad
      filo: this.my.filo?.id ?? null,
      filoLvl: this.my.filo?.nivel ?? 0,
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
    this.log("info", `min ${this.min}' — 🔄 Cambio: entra #${inP.num || "?"} ${inP.name} por #${outPlayer.num || "?"} ${outPlayer.name}.`);
    return true;
  }

  // ---------- Cierre del partido ----------

  /** Al llegar al minuto final: en eliminatorias un empate deriva en prórroga y luego penales. */
  _finishRegular() {
    if (this.phase === "regular" && this.knockout && this.gMy === this.gOpp) {
      this.phase = "extra";
      this.log("info", "🕐 Empate. ¡Vamos a la PRÓRROGA! 30 minutos más.");
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

  /** Resultado final: marcador, ganador ("my"/"opp"/null=empate) y detalle de penales si hubo. */
  result() {
    let winner = null;
    if (this.gMy > this.gOpp) winner = "my";
    else if (this.gOpp > this.gMy) winner = "opp";
    else if (this.pens && this.pens.winner) winner = this.pens.winner;
    return { gMy: this.gMy, gOpp: this.gOpp, winner, pens: this.pens ? this.shootoutStatus() : null };
  }
}
