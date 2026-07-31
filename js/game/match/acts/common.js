/* ============================================================
   game/match/acts/common — los helpers que comparten TODAS las
   familias de actos: el plan en curso, el pase que cambia de pies,
   la voz del DT y los dos ayudantes del desborde.
   ============================================================ */
import { pick } from "../../../core/rng.js";
import { playedPos } from "../../ratings.js";
import { protMomentum } from "../sequences.js";
import { hookOf } from "../trait-hooks.js";

// un acto más de circulación, lo arma startSequence) o el del catálogo.
export const planOf = s => s.plan || s.type.plan;

/** Peso del DESMARQUE (Odisea): el que se suelta para recibir es el que arranca. Mismo
 *  cuadrático sobre 70 que `protStatW` — inclina fuerte sin ser determinista. */
export const desmarqueW = p => ((p.stats.velocidad ?? 70) / 70) ** 2;

/**
 * El lateral que corre la banda con mi extremo (Odisea): un DEF rival en cancha. Se elige
 * el MÁS RÁPIDO de su zaga — el desborde se juega contra el que puede seguirlo, no contra
 * el central lento que quedó del otro lado. Sin defensas en pie (equipo diezmado, rojas)
 * devuelve null y actSprint usa la nota del rival como proxy.
 */
export function wingChaser(m) {
  const defs = m.oppLineup.filter(p => !p.expulsado && p.pos === "DEF");
  const pool = defs.length ? defs : m.oppLineup.filter(p => !p.expulsado && p.pos !== "POR");
  return pool.sort((a, b) => (b.stats.velocidad || 0) - (a.stats.velocidad || 0))[0] || null;
}

/**
 * ¿Se puede congelar? Fríos es un rasgo de ESTADO: pide el tramo final (desde el 70')
 * y NO ir perdiendo — con ventaja o empate (decisión PO: el empate también sirve, y
 * en fase de grupos a veces es justo lo que hace falta).
 */
export const FREEZE_FROM_MIN = 70;
export const canFreeze = m => !!hookOf(m, "iceGame") && m.min >= FREEZE_FROM_MIN && m.gMy >= m.gOpp;

// Feedback del DT (PO 22-jul): solo las decisiones con RIESGO real generan comentario —
// el relato celebra el acierto de la arriesgada y cobra su fallo. La opción segura no
// opina: no hay mérito en lo seguro.
export const dtOk = m => m.log("info", `min ${m.clock()}' — 🎯 ${pick(["La decisión del DT fue la correcta.", "La apuesta del banco sale perfecta.", "El riesgo del DT paga."])}`);
export const dtFail = m => m.log("info", `min ${m.clock()}' — 💢 ${pick(["La apuesta del DT salió cara.", "El riesgo no pagó esta vez.", "Decisión valiente, castigo inmediato."])}`);

/**
 * El que pasa SE DESPRENDE de la pelota (bug PO 22-jul): la recibe un compañero, que pasa a
 * ser el protagonista del acto siguiente (ponderado por el puesto que pide el tipo y su
 * Momento, como en el arranque). El pasador queda como asistidor si el receptor convierte.
 * Devuelve false si no hay a quién pasársela (equipo diezmado): el prot no cambia.
 */
export function passTo(m, s) {
  const cands = m.activeMine().filter(p => p !== s.prot && p.pos !== "POR");
  if (!cands.length) return false;
  s.assistFrom = s.prot;
  s.prot = m._weightedPick(cands, cands.map(p => (s.type.protWeight[playedPos(p)] ?? 1) * protMomentum(p)));
  return true;
}

