/* ============================================================
   game/match/acts/chains — LOS DESENLACES TRANSVERSALES: lo que le
   puede pasar a CUALQUIER jugada al terminar.

   Escalar al acto siguiente, el rebote, el contragolpe tras mi
   pérdida, el córner y el tiro libre encadenados, la geografía de
   la falta y los dos cierres. Es la regla 7 del Bible ("los errores
   generan nuevos problemas de fútbol en vez de terminar la jugada")
   con un solo dueño.

   Ciclo BENIGNO de runtime con la entrada: `escalate` vuelve a
   `resolveSequenceAct` para los actos automáticos y `chainSetPiece`
   pide `buildActDecision`.
   ============================================================ */
import { rnd, pick } from "../../../core/rng.js";
import { playedPos } from "../../ratings.js";
import { sequenceType } from "../../../content/match/sequences.js";
import { protMomentum, noteFiloHit } from "../sequences.js";
import { hookOf, rollChain, chainMine, traitMoment } from "../trait-hooks.js";
import * as A from "../actions.js";
import { goalOpp, goalMine, myPenalty, lastManChance } from "../chances.js";
import { noteCorner } from "../stats.js";
import { noteMomentum } from "../match-momentum.js";
import { setBall, BOX_OPP, BOX_MINE, inOppBox, wingLane } from "../field.js";
import { buildActDecision, resolveSequenceAct } from "../sequence-acts.js";
import { planOf, dtFail } from "./common.js";
import { AUTO_ACTS, clearChanceGuarded } from "./block.js";

/**
 * El CÓRNER que se regala al reventar el balón: la misma jugada sigue como balón parado
 * EN CONTRA (espejo de chainSetPiece, del otro lado). El cabeceador rival es su mejor
 * cabezazo en cancha, igual que cuando el córner nace del generador.
 */
export function chainOppCorner(m) {
  const t = sequenceType("balon_parado_def");
  const alive = m.oppLineup.filter(p => !p.expulsado && p.pos !== "POR");
  const shooter = alive.sort((a, b) => (b.stats.cabezazo || 0) - (a.stats.cabezazo || 0))[0] || pick(m.oppLineup);
  noteCorner(m, "opp"); noteMomentum(m, "corner", "opp");
  setBall(m, { v: BOX_MINE, h: 2, side: "opp" });
  m.seq = { type: t, shooter, actIdx: 0, bonus: 0 };
  m.log("event", `${t.icon} min ${m.clock()}' — ${t.flavor.intro(m.oppTeam)}`);
  buildActDecision(m);
  return false;
}

/**
 * Pasa al acto siguiente. Si el plan se acabó, cierra. Si el próximo acto es interactivo,
 * crea su decisión. Si es un desenlace automático (AUTO_ACTS), lo resuelve en el acto —
 * sin pedirle nada al DT (p. ej. el remate rival tras una contención fallida).
 */
export function escalate(m) {
  const s = m.seq;
  // Escalar ES acertar el acto (los fallos cierran o encadenan, nunca escalan… salvo la
  // contención rota, que escala al remate rival — pero el repliegue no es tipo firma de
  // nadie: las 4 firmas son del lado mine). Si la secuencia es de MI tipo firma, el
  // acierto alimenta la progresión por ejecución.
  noteFiloHit(m);
  s.actIdx++;
  if (s.actIdx >= planOf(s).length) return closeSilent(m);
  if (AUTO_ACTS.has(planOf(s)[s.actIdx])) return resolveSequenceAct(m, null);
  buildActDecision(m);
  return false;
}

// ---------- El fallo que encadena ----------
// "Los errores deben generar nuevos problemas de fútbol en vez de terminar la jugada."
// BIDIRECCIONAL a propósito: el rebote me regala remates, la pérdida
// arriesgada le regala contras al rival — las dos direcciones se compensan en el balance.
const REBOUND_CHANCE = 0.30;  // mi remate fallado deja la pelota viva
const COUNTER_CHANCE = 0.28;  // mi pérdida ARRIESGADA (filtrado/conducción/presión rota) abre contra
// Absorción del último hombre: ya no asoma como evento suelto del tick —
// nace del FÚTBOL: una contención rota o una contra tras pérdida se vuelven el mano a mano.
export const LASTMAN_FROM_CONTAIN = 0.70; // contención rota → último hombre
const LASTMAN_FROM_COUNTER = 1.0;  // TODA contra con el equipo partido es un mano a mano (si hay DEF en pie)

/**
 * Mi remate falló: a veces la pelota queda viva y alguien la caza en el área (un solo
 * rebote por secuencia — `s.rebounded` corta la cadena geométrica). El remate de rebote
 * es sucio: a quemarropa pero incómodo (bonus negativo), y sin asistidor.
 */
export function maybeRebound(m, failText) {
  const s = m.seq;
  if (s.rebounded || rnd() >= REBOUND_CHANCE) return closeSeq(m, "chance", failText);
  s.rebounded = true;
  m.log("chance", failText);
  const pool = m.activeMine().filter(p => p.pos !== "POR");
  const p2 = m._weightedPick(pool, pool.map(p => playedPos(p) === "DEL" ? 3 : 1));
  const shot = A.actShot(m, p2, { bonus: -0.03 });
  if (shot.ok) { goalMine(m, p2, "¡REBOTE y gol! Cazó la pelota viva en el área."); return closeSilent(m); }
  return closeSeq(m, "chance", `min ${m.clock()}' — ¡el rebote le queda a ${p2.name}! pero su remate ${pick(["lo tapa el arquero", "se va por arriba", "muere en la zaga"])}.`);
}

/**
 * Pérdida ARRIESGADA mía (pase filtrado interceptado, conducción perdida, presión rota):
 * a veces el rival sale de contra con el equipo partido. Elegir la opción de riesgo tiene
 * que poder DOLER — es la mordida que le faltaba al riesgo/recompensa de los actos.
 */
export function maybeCounter(m, failText, risky = false) {
  if (rnd() >= COUNTER_CHANCE) {
    const out = closeSeq(m, "chance", failText);
    if (risky) dtFail(m);
    // Morder Tras Pérdida: si la pérdida NO abrió contra rival, la jauría puede
    // cazarla de vuelta — recuperación REACTIVA en campo rival. El orden importa: el
    // riesgo del contragolpe rival queda EXACTO (0.28, calibración A2); la mordida
    // vive en el 72% restante, donde antes la jugada simplemente moría.
    // El Robo es el Pase afila la mordida (chainPlus sobre la p de Morder).
    const md = rollChain(m, "chainOnMineFail", hookOf(m, "masterPress")?.chainPlus || 0);
    if (md && chainMine(m, md.to, { bonus: md.bonus, intro: md.intro, buildDecision: buildActDecision })) return false;
    return out;
  }
  m.log("chance", failText);
  if (risky) dtFail(m);
  noteMomentum(m, "contraataque", "opp");
  // La pelota cambia de dueño DONDE se perdió y sale disparada hacia mi arco.
  setBall(m, { v: Math.max(BOX_MINE, (m.field?.v ?? 3) - 2), side: "opp" });
  m.log("event", `min ${m.clock()}' — ¡${m.oppTeam.name} sale de CONTRA con el equipo partido!`);
  // LA FRONTERA (Posesión): la línea alta sube junta y la transición muere en offside.
  // Es el espejo exacto de su otro hook, breakawayGuard, que ya mata el pelotazo
  // AMBIENTE a la espalda: el mismo rasgo cubre los DOS canales por los que llega ese
  // fútbol —el balón largo suelto y la contra tras mi pérdida—, que es justo lo que
  // significa sostener una línea adelantada.
  const ot = hookOf(m, "offsideTrap");
  if (ot && rnd() < ot.p) { traitMoment(m, ot.traitId, [ot.texto]); return closeSilent(m); }
  // FORTALEZA INEXPUGNABLE (Bloque): el otro canal de la ocasión clara — la contra que
  // nace de mi pérdida. El espejo defensivo de lo que la trampa del offside hace en
  // Posesión: la jugada más peligrosa del rival muere antes de existir.
  if (clearChanceGuarded(m)) return closeSilent(m);
  // La mitad de las contras terminan en el mano a mano del último hombre (absorción A2,
  // calibración del Sprint 1 intacta); la otra mitad, en remate directo del que se escapó.
  if (rnd() < LASTMAN_FROM_COUNTER && lastManChance(m)) { closeSilent(m); return true; }
  const { mine } = m.powers();
  const alive = m.oppLineup.filter(p => !p.expulsado);
  const fast = alive.filter(p => p.pos === "DEL" || p.pos === "MED");
  const sh = fast.length ? pick(fast) : pick(alive);
  // Rama de EMERGENCIA: con LASTMAN_FROM_COUNTER = 1.0 acá solo se llega sin un defensor
  // en pie (todos expulsados o lesionados). La persecución con velocidad vive donde la
  // contra realmente se juega — `chances.resolveLastMan`, opción "esperar".
  const shot = A.actOppShot(m, sh, mine, { bonus: 0.10 });
  if (shot.ok) { goalOpp(m, sh); return closeSilent(m); }
  return closeSeq(m, "chance", `min ${m.clock()}' — ${sh.name} remata la contra pero ${mine.por ? mine.por.name : "el arquero"} responde enorme.`);
}

// ---------- Desenlaces nuevos de las AVANZADAS ----------

/**
 * El balón parado ENCADENADO: la misma jugada sigue como balón parado mío (el patrón de
 * conversión de la salida bajo presión). El lanzador sale por el protWeight del tipo,
 * como en un balón parado que nace solo.
 */
export function chainSetPiece(m, bonus = 0, corner = false) {
  const t = sequenceType("balon_parado");
  // El carril decide qué balón parado es: el que nace de un CÓRNER se cobra del costado;
  // el que nace de una falta, donde se cometió (o sea, donde está la pelota).
  setBall(m, { v: BOX_OPP, h: corner ? wingLane(m) : (m.field?.h ?? 2), side: "mine" });
  const cands = m.activeMine().filter(p => p.pos !== "POR");
  const prot = m._weightedPick(cands, cands.map(p => (t.protWeight[playedPos(p)] ?? 1) * protMomentum(p)));
  m.seq = { type: t, prot, actIdx: 0, bonus };
  buildActDecision(m);
  return false;
}

/**
 * El rival corta tu fútbol superior CON FALTA (Cacería total / Contragolpe letal): 🟨
 * amarilla al infractor — que ACUMULA: la segunda lo expulsa, y teamPowers ya castiga la
 * inferioridad rival — y tiro libre encadenado. El infractor es un rival de campo al azar
 * (el que llegó tarde). Sin stats de tarjetas mías: es SU falta.
 */
export function advFoulSetPiece(m, foulText, bonus = 0) {
  const alive = m.oppLineup.filter(p => !p.expulsado && p.pos !== "POR");
  if (alive.length) {
    const p = pick(alive);
    p.amarillaPartido = (p.amarillaPartido || 0) + 1;
    m.log("card", `min ${m.clock()}' — 🟨 ${foulText(p)}`);
    if (p.amarillaPartido >= 2) {
      p.expulsado = true;
      m.log("card", `min ${m.clock()}' — 🟥 ¡Segunda amarilla y EXPULSIÓN de ${p.name}! ${m.oppTeam.name} queda con uno menos.`);
    }
  }
  return chainSetPiece(m, bonus);
}

/**
 * LA GEOGRAFÍA DE LA FALTA: a un jugador derribado se le cobra donde LO
 * DERRIBARON. Dentro del área rival, penal; al borde, tiro libre peligroso; lejos,
 * uno modesto. Los dos tiros libres siguen como balón parado encadenado, así que la
 * jugada no muere — cambia de forma, que es la regla 7 del Bible.
 */
export function foulGeography(m, victima) {
  if (inOppBox(m)) {
    m.log("event", `min ${m.clock()}' — ¡Derriban a ${victima.name} DENTRO del área! ¡PENAL!`);
    closeSilent(m);
    return myPenalty(m);
  }
  const cerca = (m.field?.v ?? 3) >= 4;
  m.log("event", `min ${m.clock()}' — ¡Falta sobre ${victima.name}! ${cerca
    ? "Tiro libre peligroso, al borde del área."
    : "Tiro libre lejano: el equipo sube a todos al área."}`);
  return chainSetPiece(m, cerca ? 0.06 : 0.01);
}

/** Cierra la secuencia con una línea de relato. */
export function closeSeq(m, kind, text) {
  m.log(kind, text);
  m.seq = null;
  return false;
}

/** Cierra la secuencia sin relato extra (el desenlace ya se narró: gol, penal, etc.). */
export function closeSilent(m) {
  m.seq = null;
  return false;
}
