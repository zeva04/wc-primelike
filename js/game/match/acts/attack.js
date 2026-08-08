/* ============================================================
   game/match/acts/attack — LOS ACTOS QUE LLEGAN Y DEFINEN:
   la pelota a la espalda, el duelo aéreo, el desborde por
   la banda, el centro y el desenlace.

   Cada familia trae SUS constructores de decisión (`BUILDERS`) y
   SUS resolvers: agregar un acto es tocar un solo archivo. La
   entrada (`../sequence-acts.js`) solo los monta y despacha.

   Ciclo BENIGNO de runtime con la entrada y con `chains.js` (el
   mismo patrón que sequences ↔ sequence-acts): nada se usa en la
   evaluación del módulo, solo dentro de las funciones.
   ============================================================ */
import { rnd, pick } from "../../../core/rng.js";
import { playedPos } from "../../ratings.js";
import { sequenceType } from "../../../content/match/sequences.js";
import { protStatW, noteFiloHit, familyOf } from "../sequences.js";
import { hookOf, rollChain, chainMine, traitMoment, hasTrait } from "../trait-hooks.js";
import * as A from "../actions.js";
import { goalMine, myPenalty } from "../chances.js";
import { noteCorner } from "../stats.js";
import { noteMomentum } from "../match-momentum.js";
import { moveBall, setBall, ADVANCE, BOX_OPP, attackWidth } from "../field.js";
import { buildActDecision, resolveSequenceAct } from "../sequence-acts.js";
import { planOf, dtOk, dtFail, desmarqueW, wingChaser, canFreeze } from "./common.js";
import { escalate, closeSeq, closeSilent, maybeRebound, maybeCounter, chainSetPiece, foulGeography } from "./chains.js";

/** Los constructores de decisión de esta familia (los monta buildActDecision). */
export const BUILDERS = {
  throughball: (m, s) => {
    s.chaser = wingChaser(m);
    return {
      title: `🏹 min ${m.clock()}' — ${s.prot.name} pica al espacio: la zaga rival está adelantadísima`,
      text: "Hay toda una pradera detrás de los centrales rivales. ¿Qué pelota le ponen?",
      options: [
        { label: "🏹 Pelota a la espalda", hint: `Pase largo ${s.prot.stats.pase_largo} + carrera (Velocidad ${s.prot.stats.velocidad} vs ${s.chaser ? s.chaser.stats.velocidad : "la zaga"}) — si gana, queda solo`, key: "espalda", risk: 4 },
        { label: "🎯 Entre líneas al pie", hint: `Pase largo ${s.prot.stats.pase_largo} — llega más seguido, pero sin ventaja de campo`, key: "lineas", risk: 2 },
      ],
    };
  },
  duel: (m, s) => {
    // El pelotazo VUELA: el duelo se disputa arriba, no donde se lanzó la pelota
    // — por eso el balón viaja ANTES de que el DT elija cómo jugarlo (y por eso las
    // opciones de área, como pivotear, existen en un pelotazo lanzado desde el fondo).
    moveBall(m, 2, 0);
    return {
    title: `🌩️ min ${m.clock()}' — Pelotazo a ${s.prot.name}: se viene el duelo aéreo`,
    text: "¿Cómo lo juega?",
    options: [
      { label: "🤜 Ir al choque", hint: `Cabezazo ${s.prot.stats.cabezazo} — ganarla es rematar de cabeza`, key: "choque", risk: 2 },
      { label: "🪶 Peinarla al espacio", hint: "Prolonga para un compañero lanzado: más letal, más difícil", key: "peinar", risk: 3 },
      // HOMBRE OBJETIVO (Bloque, Master): "Pivoteo al Área". El que gana por arriba no
      // remata: la aguanta de espaldas y la BAJA para el mejor rematador, que llega de
      // frente al arco. Tampoco se sortea — es una decisión del DT.
      ...(hookOf(m, "pivot")
        ? [{ label: "🎯 Pivotear al área", hint: "La aguanta de espaldas y la baja al mejor rematador, de frente al arco", key: "pivotear", risk: 2 }]
        : []),
    ],
    };
  },
  // EL BALÓN PARADO TIENE CARRIL (Eje Horizontal): desde la banda ES un córner —el
  // centro es su arma y no hay ángulo para patear al arco—; por el centro es un tiro
  // libre FRONTAL, y ahí aparece la opción más peligrosa del sitio: el disparo directo.
  // El mismo tipo, dos jugadas de fútbol distintas, decididas por dónde quedó la pelota.
  wing: (m, s) => {
    s.chaser = wingChaser(m);
    return {
      title: `🏃 min ${m.clock()}' — Banda: ${s.prot.name} encara a ${s.chaser ? s.chaser.name : "su marca"}`,
      text: "El pasillo de afuera está abierto. ¿Qué hace?",
      options: [
        { label: "🏁 Ir a la línea de fondo", hint: `Velocidad ${s.prot.stats.velocidad} vs ${s.chaser ? s.chaser.stats.velocidad : "el lateral"} — si llega, centra con la zaga de espaldas`, key: "fondo", risk: 3 },
        { label: "📡 Centrar de primera", hint: "No arriesga el desborde, pero la defensa llega acomodada", key: "primera", risk: 1 },
        { label: "✂️ Cortar hacia adentro", hint: `Se perfila y busca el remate él mismo (Tiro ${s.prot.stats.tiro})`, key: "adentro", risk: 3 },
      ],
    };
  },
  // El envío desde la banda: es EL sitio donde el split de pase decide qué jugada se
  // juega — el centro alto es pase largo y termina en cabezazo; el rasante es pase
  // corto y termina en remate de frente.
  // EL EJE HORIZONTAL: el menú depende de DESDE DÓNDE se centra. Solo desde la LÍNEA
  // DE FONDO existe el pase atrás —para pisarla y devolverla hace falta haber llegado
  // hasta el fondo—; sin desbordar, la alternativa es el envío largo al segundo palo,
  // que ataca el espacio que la defensa acomodada deja a su espalda.
  cross: (m, s) => {
    const fondo = (m.field?.v ?? 4) >= BOX_OPP;
    return {
      title: fondo
        ? `📡 min ${m.clock()}' — ${s.prot.name} llega al fondo y levanta la cabeza`
        : `📡 min ${m.clock()}' — ${s.prot.name} arma el envío desde el costado`,
      text: fondo ? "La zaga rival quedó de espaldas a su arco. ¿Qué manda?" : "La defensa está acomodada dentro del área. ¿Qué manda?",
      options: [
        { label: "📡 Centro al área", hint: `Pase largo ${s.prot.stats.pase_largo} — busca la cabeza del mejor rematador${fondo ? "" : ", con la zaga ya parada"}`, key: "centro", risk: 2 },
        fondo
          ? { label: "🎯 Pase atrás rasante", hint: `Pase corto ${s.prot.stats.pase_corto} — al que llega de frente al arco`, key: "atras", risk: 2 }
          : { label: "🌙 Al espacio, segundo palo", hint: `Pase largo ${s.prot.stats.pase_largo} — más difícil, pero lo ataca el que llega LANZADO desde atrás`, key: "segundo", risk: 3 },
      ],
    };
  },
  // ═══ EL CAMBIO DE FRENTE (Eje Horizontal) ═══
  // La primera decisión del motor cuyo eje es el ANCHO y no la profundidad: mandarla
  // cruzada (rápido y letal, pero se puede ir al lateral) o llevarla por dentro (llega
  // siempre, y el bloque rival llega también).
  finish: (m, s) => ({
    title: `🎯 min ${m.clock()}' — ¡Momento de definir! ${s.prot.name}`,
    text: "¿Cómo resuelve la jugada?",
    options: [
      { label: "💥 Rematar", hint: `Tiro ${s.prot.stats.tiro}`, key: "rematar", risk: 2 },
      { label: "🤝 Buscar al mejor ubicado", hint: "Un pase más para una definición mejor", key: "asistir", risk: 3 },
      // FRÍOS (Press, Master): la otra jugada NUEVA del catálogo. Solo en el tramo
      // final y sin ir perdiendo — congelar ganando o empatando es fútbol; hacerlo
      // en el minuto 20 sería renunciar al partido.
      ...(canFreeze(m) ? [{ label: "🧊 Congelar el partido", hint: "Renuncias al remate: a cambio, el rival pierde su próxima llegada", key: "congelar", risk: 1 }] : []),
      // PASE ATRÁS (Contra, avanzada): la jugada de finalización de la contra. Solo en
      // SU familia — es el que llegó al fondo pisándola para el que entra de frente.
      ...(hookOf(m, "squarePass") && familyOf(s.type) === "transicion"
        ? [{ label: "🎯 Pase atrás", hint: `La pisa y la devuelve al que entra de frente (Pase corto ${s.prot.stats.pase_corto})`, key: "pase_atras", risk: 2 }]
        : []),
    ],
  }),
};

// ═══ PELOTA A LA ESPALDA ═══
export function resolveThroughball(m, s, key, f) {
  const espalda = key === "espalda";
  const r = A.actPass(m, s.prot, { hard: true });
  if (!r.ok) return maybeCounter(m, `min ${m.clock()}' — ${espalda ? f.throughFail : f.lineFail}`, espalda);
  if (!espalda) {
    moveBall(m, ADVANCE.filtradoEspalda);
    s.bonus += 0.04;
    m.log("plain", `min ${m.clock()}' — ${f.lineOk(s.prot)}`);
    return escalate(m);
  }
  // La pelota es buena: ahora hay que GANARLE LA CARRERA al que vuelve. Es el mismo
  // duelo de piernas del desborde (actSprint), acá contra la zaga que retrocede.
  const run = A.actSprint(m, s.prot, { chaser: s.chaser, handicap: 0.06 });
  if (!run.ok) return closeSeq(m, "chance", `min ${m.clock()}' — ${s.prot.name} pica pero el central le gana el metro y la deja pasar al arquero.`);
  setBall(m, { v: BOX_OPP, h: 2 });
  s.bonus += 0.08;   // calibrado: con 0.12 la jugada nueva era la mejor ocasión del juego
  s.oneOnOne = true;
  m.log("event", `min ${m.clock()}' — ${f.throughOk(s.prot)}`);
  dtOk(m);
  return escalate(m);
}


export function resolveDuel(m, s, key, f) {
  // Pelotazo: choque = gana y remata ÉL de cabeza; peinar = prolonga a un lanzado (más
  // letal, más difícil de ganar). El Cabezazo por fin decide jugadas.
  const winner = s.prot;
  // El pivoteo es más difícil que el choque frontal (hay que aguantar de espaldas)
  // pero menos que la peinada al espacio: la pelota se baja, no se prolonga.
  const pv = key === "pivotear" ? hookOf(m, "pivot") : null;
  const risky = key === "peinar" || !!pv;   // las dos opciones de riesgo cobran el fallo
  const r = A.actAerial(m, s.prot, { handicap: key === "peinar" ? 0.08 : pv ? 0.05 : 0 });
  if (!r.ok) {
    // La fortaleza castiga: el pelotazo del castigo que la zaga rival despeja
    // apurada, de espaldas a su arco, un % de las veces muere en CÓRNER ganado —
    // balón parado encadenado. La fortaleza casi siempre saca algo.
    if (s.cornerOnDuelFail && rnd() < s.cornerOnDuelFail) {
      if (risky) dtFail(m);
      noteCorner(m, "mine"); noteMomentum(m, "corner");   // córner ganado de verdad
      m.log("chance", `min ${m.clock()}' — ${sequenceType("fortaleza").flavor.cornerText}`);
      return chainSetPiece(m, 0.02, true);
    }
    // Segunda Jugada: el duelo perdido no siempre es pérdida — la segunda
    // pelota puede caer nuestra y el bloque vuelve a lanzar (secuencia reactiva).
    // Plataforma la sube de calidad: posición establecida, con su propia voz.
    const sj = rollChain(m, "chainOnDuelFail");
    if (sj) {
      if (risky) dtFail(m);
      m.log("chance", `min ${m.clock()}' — ${f.duelFail}`);
      const up = hookOf(m, "secondBallUpgrade");
      return chainMine(m, sj.to, { bonus: sj.bonus + (up?.bonus || 0), intro: up?.intro || sj.intro, buildDecision: buildActDecision }) ? false : closeSilent(m);
    }
    const out = closeSeq(m, "chance", `min ${m.clock()}' — ${f.duelFail}`);
    if (risky) dtFail(m);
    return out;
  }
  m.log("event", `min ${m.clock()}' — ${f.duelOk(winner)}`);
  moveBall(m, key === "peinar" ? ADVANCE.peinada : ADVANCE.duelo);   // la pelota ganada por arriba progresa
  if (pv) {
    // La bajada: la pelota cambia de pies hacia el MEJOR rematador de los que llegan
    // (mismo criterio que Superioridad Numérica) y el remate es de frente, no de cabeza.
    const mates = m.activeMine().filter(p => p !== s.prot && p.pos !== "POR");
    if (mates.length) {
      s.assistFrom = winner;
      s.prot = [...mates].sort((a, b) => (b.stats.tiro || 0) - (a.stats.tiro || 0))[0];
    }
    s.finishStat = "tiro";
    s.bonus += pv.bonus;
    traitMoment(m, pv.traitId, [pv.texto]);
    dtOk(m);
  } else if (key === "peinar") {
    const runners = m.activeMine().filter(p => p !== s.prot && p.pos !== "POR");
    if (runners.length) s.prot = m._weightedPick(runners, runners.map(p => playedPos(p) === "DEL" ? 3 : 1));
    s.assistFrom = winner; // la peinada es la asistencia si el lanzado convierte
    s.bonus += 0.10;
    dtOk(m);
  } else {
    s.finishStat = "cabezazo"; // ganó por arriba: define de cabeza
    s.bonus += 0.05;
  }
  return escalate(m);
}


export function resolveWing(m, s, key, f) {
  // CORTAR HACIA ADENTRO: se salta el centro. El extremo se perfila (conducción: aura +
  // velocidad) y va derecho al desenlace con el pie cambiado. Es la opción del que sabe
  // rematar; si la pierde encarando hacia el medio, el equipo queda partido → contra.
  if (key === "adentro") {
    const r = A.actDribble(m, s.prot, { bonus: 0.04 });
    if (r.foul) { moveBall(m, ADVANCE.conduccion); return foulGeography(m, s.prot); }
    if (!r.ok) return maybeCounter(m, `min ${m.clock()}' — ${s.prot.name} se cierra hacia adentro pero lo achican entre dos.`, true);
    setBall(m, { v: BOX_OPP, h: 2 });   // se cierra al medio: la jugada ya no va por afuera
    m.log("plain", `min ${m.clock()}' — ${s.prot.name} se perfila hacia adentro y busca el remate.`);
    dtOk(m);
    s.finishStat = "tiro";
    s.bonus += 0.06;
    s.actIdx = planOf(s).length - 1;   // saltea el centro: la jugada ya no va por afuera
    noteFiloHit(m);
    buildActDecision(m);
    return false;
  }
  // CENTRAR DE PRIMERA: no arriesga el sprint, pero la zaga llega acomodada — el centro
  // sale peor. Es el trade honesto de la opción segura: llega siempre, vale menos.
  if (key === "primera") {
    s.crossBonus = -0.05;
    m.log("plain", `min ${m.clock()}' — ${s.prot.name} no espera el desborde: levanta la cabeza y prepara el envío.`);
    return escalate(m);
  }
  // LA LÍNEA DE FONDO: el sprint puro contra el lateral. Llegar al fondo deja a la zaga
  // rival de espaldas a su arco — el centro que sigue es el mejor del juego.
  const r = A.actSprint(m, s.prot, { chaser: s.chaser, handicap: 0.10, bonus: 0.03 * attackWidth(m) });
  if (!r.ok) return maybeCounter(m, `min ${m.clock()}' — ${f.wingFail}`, false);
  setBall(m, { v: BOX_OPP });        // la línea de fondo: la zaga rival queda de espaldas
  m.log("plain", `min ${m.clock()}' — ${f.wingOk(s.prot)}`);
  dtOk(m);
  s.crossBonus = 0.07;
  s.bonus += 0.04;              // la zaga de espaldas: el remate posterior llega mejor
  return escalate(m);
}


export function resolveCross(m, s, key, f) {
  const rasante = key === "atras";
  const segundo = key === "segundo";
  // LA AMPLITUD (Eje Horizontal): con una línea de tres arriba el área se llena de
  // verdad y el envío encuentra a alguien; atacando solo por el medio, el centro cae
  // donde no hay nadie. Neutro con líneas de dos. El envío al segundo palo es MÁS
  // difícil (hay que pasar a toda la zaga) pero lo ataca un jugador lanzado.
  const ancho = 0.04 * attackWidth(m);
  const r = A.actCross(m, s.prot, { rasante, bonus: (s.crossBonus || 0) + ancho - (segundo ? 0.06 : 0) });
  if (!r.ok) return closeSeq(m, "chance", `min ${m.clock()}' — ${f.crossFail}`);
  // El centro CAMBIA de protagonista: el que remata es el que atacó el área. El alto
  // busca al mejor cabezazo (y define de cabeza); el rasante, al mejor tiro de frente.
  // Quién ataca el área en juego abierto: delanteros y volantes. Los centrales suben
  // al córner, no al centro desde la banda — si se los deja entrar, el mejor cabezazo
  // del plantel (que casi siempre es un central) termina rematando todos los centros.
  const all = m.activeMine().filter(x => x !== s.prot && x.pos !== "POR");
  const mates = all.filter(x => playedPos(x) !== "DEF").length ? all.filter(x => playedPos(x) !== "DEF") : all;
  if (mates.length) {
    s.assistFrom = s.prot;
    // Al segundo palo NO la ataca el mejor cabeceador parado en el área: la ataca EL QUE
    // LLEGA — por eso lo elige la velocidad (el mismo desmarque de la Odisea).
    s.prot = segundo
      ? m._weightedPick(mates, mates.map(p => desmarqueW(p) * (playedPos(p) === "DEL" ? 2 : 3)))
      : mates.sort((a, b) => (b.stats[rasante ? "tiro" : "cabezazo"] || 0) - (a.stats[rasante ? "tiro" : "cabezazo"] || 0))[0];
  }
  setBall(m, { v: BOX_OPP, h: 2 });   // el centro mete la pelota EN el área
  s.finishStat = rasante ? "tiro" : "cabezazo";
  // El rasante llega de frente al arco; el del segundo palo llega LANZADO y sin marca
  // (paga el riesgo extra del envío); el centro normal, con la zaga encima.
  s.bonus += rasante ? 0.05 : segundo ? 0.07 : 0.02;
  m.log("event", `min ${m.clock()}' — ${rasante
    ? `${s.assistFrom.name} la pisa y la devuelve atrás: ${s.prot.name} entra de frente.`
    : segundo
      ? `El envío cruza toda el área al segundo palo… ¡y ahí llega ${s.prot.name} lanzado!`
      : `${f.crossOk} La pelea ${s.prot.name}.`}`);
  return escalate(m);
}


export function resolveFinish(m, s, key, f) {
  // FRÍOS: se cambia MI ocasión por la del rival. La jugada muere sin peligro y el
  // generador le descuenta una llegada al rival (sequences.maybeStartSequence). Es
  // una decisión honesta: resignás atacar para proteger el resultado.
  if (key === "congelar") {
    const ice = hookOf(m, "iceGame");
    if (!ice) return resolveSequenceAct(m, "rematar");
    m._frozen = (m._frozen || 0) + 1;
    traitMoment(m, ice.traitId, [ice.texto]);
    return closeSeq(m, "info", `min ${m.clock()}' — ${s.prot.name} la devuelve al área propia. El equipo se queda con la pelota y el reloj corre.`);
  }
  // La sinfonía: si TODOS los compases sonaron (desesperación llena), un % de las
  // veces el rival ya no llega con las piernas y te baja DENTRO del área — penal.
  // El penal profundo (y el 4º compás) eran el rasgo F2 de Consolidada — desde T2 los
  // compra Sitio al Área (migración al árbol). Si no hay penal, el remate llega limpio.
  if (s.type.advFor === "posesion" && (s.buildOks || 0) >= planOf(s).filter(k => k === "build").length
      && rnd() < (hasTrait(m, "desesperantes") ? s.type.adv.penaltyChanceDeep : s.type.adv.penaltyChance)) {
    setBall(m, { v: BOX_OPP, h: 2 });
    m.log("event", `min ${m.clock()}' — ${f.penaltyText(s.prot)}`);
    closeSilent(m);
    return myPenalty(m);
  }
  // LA MÁQUINA COLECTIVA (Posesión, Master): tras una circulación LARGA en campo
  // rival —todos los compases sonaron, la misma condición de "desesperación llena"
  // que abre el penal de la sinfonía— la pelota puede quedar SERVIDA: al atacante
  // solo le queda empujarla. Acá el premio no es un penal: es el gol hecho.
  const tap = hookOf(m, "tapIn");
  if (tap && familyOf(s.type) === "circulacion"
      && (s.buildOks || 0) >= planOf(s).filter(k => k === "build").length && rnd() < tap.p) {
    s.bonus += tap.bonus;
    s.tapIn = true;
    traitMoment(m, tap.traitId, [tap.texto]);
  }
  // Pausa: en el desenlace de la circulación, la aceleración súbita — el
  // rival dormido por el tempo no llega al cierre (mejor perfil, relato propio).
  // Por FAMILIA: la sinfonía también acelera (hallazgo del gate T1).
  const acc = hookOf(m, "accelFinish", familyOf(s.type));
  if (acc && !s.oneOnOne && rnd() < acc.p) { s.bonus += acc.bonus; s.oneOnOne = true; m.log("event", `min ${m.clock()}' — ${acc.intro(s.prot)}`); }
  // Arco a la Vista: si la jugada nació en su variante profunda (la asfixia
  // sobre el saque de meta), el desenlace llega a quemarropa.
  const df = hookOf(m, "deepFinish", familyOf(s.type));
  if (df && s.deepVariant) { s.bonus += df.bonus; traitMoment(m, df.traitId, [df.texto]); }
  // A Campo Abierto: la avalancha llega al desenlace de toda la familia de la
  // contra — la defensa no sabe a quién marcar.
  const av = hookOf(m, "avalancha");
  if (av && familyOf(s.type) === "transicion") { s.bonus += av.bonus; if (rnd() < 0.5) traitMoment(m, av.traitId, [av.texto]); }
  // El Robo es el Pase (Master): el desenlace de la familia de la recuperación
  // define mejor — el robo YA es creación.
  const mp = hookOf(m, "masterPress");
  if (mp && familyOf(s.type) === "recuperacion") { s.bonus += mp.bonus; if (rnd() < 0.4) traitMoment(m, mp.traitId, [mp.texto]); }
  const stat = s.finishStat || f.finishStat;
  // PASE ATRÁS (Contra): el que llegó no remata — la pisa y la devuelve al que entra
  // de frente al arco. Es un pase de VERDAD (se puede perder, y perderla ahí abre
  // contra); a cambio, el remate que sigue llega servido y de frente.
  if (key === "pase_atras") {
    const sq = hookOf(m, "squarePass");
    if (!sq) return resolveSequenceAct(m, "rematar");
    const mates = m.activeMine().filter(p => p !== s.prot && p.pos !== "POR");
    const mate = mates.length ? [...mates].sort((a, b) => (b.stats.tiro || 0) - (a.stats.tiro || 0))[0] : s.prot;
    const pass = A.actPass(m, s.prot);
    if (!pass.ok) return maybeCounter(m, `min ${m.clock()}' — ${s.prot.name} la pisa y la devuelve atrás, pero la corta un rival que volvió.`, true);
    traitMoment(m, sq.traitId, [sq.texto]);
    const shot = A.actShot(m, mate, { stat: "tiro", bonus: s.bonus + f.finishBonus + sq.bonus });
    if (shot.ok) { goalMine(m, mate, "¡La empujó de frente tras el pase atrás!", s.prot); return closeSilent(m); }
    return maybeRebound(m, `min ${m.clock()}' — ${mate.name} entra de frente pero su remate se va.`);
  }
  if (key === "asistir") {
    const mates = m.activeMine().filter(p => p !== s.prot && p.pos !== "POR");
    // Superioridad Numérica: en la familia de la contra, el pase elige al MEJOR
    // ubicado DE VERDAD (el de mejor Tiro), no a un corredor cualquiera.
    const supUp = hookOf(m, "supportUpgrade");
    const numeric = supUp && familyOf(s.type) === "transicion" && mates.length > 0;
    // ODISEA (costura cerrada): EL DESMARQUE. Sin Superioridad Numérica, el que recibe
    // el pase de gol no es el mejor ubicado: es el que ARRANCÓ. La velocidad pondera el
    // sorteo (mismo cuadrático sobre 70 que protStatW: vel 95 ×1.8, vel 55 ×0.6) sin
    // volverlo determinista — el 9 lento sigue recibiendo, solo deja de recibir igual.
    const mate = !mates.length ? s.prot
      : numeric ? [...mates].sort((a, b) => (b.stats.tiro || 0) - (a.stats.tiro || 0))[0]
      : m._weightedPick(mates, mates.map(p => (playedPos(p) === "DEL" ? 3 : 1) * desmarqueW(p)));
    const pass = A.actPass(m, s.prot);
    if (!pass.ok) return maybeCounter(m, `min ${m.clock()}' — el pase de ${s.prot.name} no encuentra a nadie.`, true);
    // Correr en Manada: en la contra, el "buscar al mejor ubicado" encuentra
    // superioridad de verdad — la definición llega con dos camisetas libres.
    // Por FAMILIA: el contragolpe letal también corre en manada (gate T1).
    const sup = hookOf(m, "finishSupport", familyOf(s.type));
    const supBonus = (sup ? sup.bonus : 0) + (numeric ? supUp.bonus : 0);
    // La voz: Superioridad (si la hay) pisa a la de la Manada — un momento, no dos.
    if (numeric) traitMoment(m, supUp.traitId, [supUp.texto]);
    else if (sup) traitMoment(m, sup.traitId, [sup.texto]);
    const shot = A.actShot(m, mate, { stat: "tiro", bonus: s.bonus + f.finishBonus + 0.04 + supBonus });
    if (shot.ok) { goalMine(m, mate, "¡Definición tras la asistencia!", s.prot); return closeSilent(m); }
    return maybeRebound(m, `min ${m.clock()}' — ${mate.name} no logra conectar el remate.`);
  }
  const shot = A.actShot(m, s.prot, { stat, bonus: s.bonus + f.finishBonus });
  if (shot.ok) { goalMine(m, s.prot, s.tapIn ? "¡Solo tuvo que empujarla!" : stat === "cabezazo" ? "¡Cabezazo imparable!" : "¡Culminó la jugada!", s.assistFrom || "open"); return closeSilent(m); }
  // Cabeza de Playa: el pelotazo que muere sin gol puede fabricar córner —
  // "el equipo YA NO despeja: cada balón largo establece posición" (gate T3: la
  // versión solo-reactiva era invisible en juego real — cadenas demasiado raras).
  const bh = hookOf(m, "beachhead");
  if (bh && s.type.id === "pelotazo" && rnd() < bh.p) {
    m.log("chance", `min ${m.clock()}' — ${s.prot.name} remata pero la defensa rechaza apurada...`);
    traitMoment(m, bh.traitId, [bh.texto]);
    return chainSetPiece(m, 0.02, true);
  }
  return maybeRebound(m, `min ${m.clock()}' — ${s.prot.name} remata pero ${pick(["ataja el arquero", "se va desviado", "la saca la defensa"])}.`);
}


