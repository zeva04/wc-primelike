/* ============================================================
   game/match/acts/block — LO QUE EL BLOQUE LE HACE AL REMATE RIVAL.
   Cuatro nodos del árbol del Bloque bajo empeoran la SITUACIÓN del
   remate rival (jamás mejoran a mis jugadores: la ley del arco de
   Rasgos) y se suman por el mismo canal. Vive aparte porque lo
   consultan tres familias de actos —el repliegue, el córner en
   contra y la salida asfixiada— y no depende de ninguna.
   ============================================================ */
import { rnd } from "../../../core/rng.js";
import { hookOf, traitMoment } from "../trait-hooks.js";

// Actos que se resuelven SOLOS, sin pedir decisión al DT (desenlaces): el remate rival de una
// secuencia de repliegue. El resto son interactivos (crean una decisión `sequence`).
export const AUTO_ACTS = new Set(["clear"]);

/** T3 — La Fortaleza: malus de frustración al remate rival = f(ataques rivales
 *  MUERTOS en la muralla, con tope). Contador propio (m._frustDead) a propósito:
 *  el diseño pide ataques FRUSTRADOS, no tiros — un avance cortado sin remate
 *  también come moral (stats.oppTiros ya cuenta bien desde el fix del bug T3). */
export function frustMalus(m) {
  const fr = hookOf(m, "frustration");
  return fr ? -Math.min(fr.cap, fr.perShot * (m._frustDead || 0)) : 0;
}

/** El ataque rival MURIÓ en la muralla: alimenta la frustración y a veces la narra
 *  (gate T3: narrarla solo en el acto clear era invisible — la propia fortaleza
 *  convierte la mayoría de las contenciones y el clear casi no ocurre). */
export function noteOppDead(m) {
  m._frustDead = (m._frustDead || 0) + 1;
  const fr = hookOf(m, "frustration");
  if (fr && frustMalus(m) <= -0.05 && rnd() < 0.25) traitMoment(m, fr.traitId, [fr.texto]);
}

/* ---------- LO QUE EL BLOQUE LE HACE AL REMATE RIVAL (rediseño 30-jul-2026) ----------
   Cuatro nodos del árbol nuevo empeoran la SITUACIÓN del remate rival (jamás mejoran a
   mis jugadores: la ley del arco). Se suman por el mismo canal —el bonus de actOppShot—
   y se piden juntos en los tres sitios donde el rival remata contra mi bloque: el
   desenlace del repliegue (clear), el córner en contra (defend_sp) y el regalo de la
   salida asfixiada. `aerial` suma el dominio aéreo solo donde se cabecea. */
export function oppShotBlockMalus(m, { aerial = false } = {}) {
  return frustMalus(m) + wallMalus(m) + boxMalus(m) + firstChanceMalus(m) + (aerial ? aerialMalus(m) : 0);
}

/** MURALLA (avanzada, ESTADO): mientras el marcador no vaya en contra —empatado O
 *  ganando, decisión PO— la zaga no se mueve. Perdiendo no aporta nada: pura identidad. */
export function wallMalus(m) {
  const w = hookOf(m, "wall");
  return w && m.gMy >= m.gOpp ? w.bonus : 0;
}

/** ÁREA BLINDADA (intermedia): el remate rival DENTRO del área sale a destiempo. */
const boxMalus = m => hookOf(m, "boxShield")?.bonus || 0;

/** DOMINIO AÉREO (básica): por arriba no se les gana — el cabezazo rival llega forzado. */
const aerialMalus = m => hookOf(m, "aerialDef")?.bonus || 0;

/**
 * DEFENSA ESCALONADA (avanzada): la PRIMERA ocasión rival del partido —la que llega con
 * el equipo todavía leyendo al rival— se encuentra con la segunda línea ya puesta. Se
 * consume una sola vez por partido: la función es IMPURA a propósito (marca y narra el
 * momento al gastarlo), como el contador de frustración que vive al lado.
 */
export function firstChanceMalus(m) {
  const h = hookOf(m, "firstChanceGuard");
  if (!h || m._escalonadaUsada) return 0;
  m._escalonadaUsada = true;
  traitMoment(m, h.traitId, [h.texto]);
  return h.bonus;
}

/**
 * FORTALEZA INEXPUGNABLE (Master): ¿esta OCASIÓN CLARA rival directamente no ocurre? Los
 * dos canales por los que el rival llega solo frente al arco —el mano a mano tras la
 * contención rota y la contra tras mi pérdida— pueden morir contra el que llegó a cubrir.
 */
export function clearChanceGuarded(m) {
  const cg = hookOf(m, "clearChanceGuard");
  if (!cg || rnd() >= cg.p) return false;
  traitMoment(m, cg.traitId, [cg.texto]);
  return true;
}
