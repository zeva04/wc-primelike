/* ============================================================
   game/match/trait-hooks — el intérprete de RASGOS del Match
   (arco de Rasgos T1.3: EL trabajo de motor del arco).

   Los rasgos viajan como ids en matchCtx.filo.rasgos (la
   frontera §3.2: el Match no conoce la run); acá se resuelven a
   sus `hooks` (content/traits) y se ofrecen como primitivas que
   sequences/sequence-acts consultan en los puntos de integración.

   LA CAPACIDAD NUEVA: SECUENCIAS REACTIVAS — encadenar una
   secuencia mía disparada por el RESULTADO de otra (la mordida
   tras pérdida, la trampa que convierte el repliegue, la segunda
   pelota del pelotazo). Generaliza el patrón def→of que ya
   existía ad-hoc (playout→transición, fortaleza→pelotazo,
   chainSetPiece): chainMine() es ese patrón con nombre, para que
   los 5+ rasgos que lo consumen (T1 y T3) no lo reinventen.

   Reglas del motor:
   - Una secuencia REACTIVA no cuenta contra el objetivo 2-6 del
     partido (nace del fútbol, no del generador)… pero un partido
     no encadena sin límite: MAX_CHAINS por partido lo acota (el
     mismo espíritu del rebote único por secuencia).
   - Los hooks JAMÁS son modificadores planos de stats o poderes
     (ley del arco: "no +10% presión"). Sus bonus expresan la
     CALIDAD de la situación generada — el mismo canal que
     finishBonus usa desde A1: el robo más arriba remata mejor
     porque la jugada ES otra, no porque el equipo sea mejor.
   ============================================================ */
import { rnd, pick } from "../../core/rng.js";
import { traitById } from "../../content/traits.js";
import { sequenceType } from "../../content/sequences.js";
import { playedPos } from "../ratings.js";
import { protMomentum } from "./sequences.js"; // ciclo benigno: solo runtime (mismo patrón que sequence-acts)

// Tope de encadenamientos reactivos por partido (todos los rasgos suman al mismo
// contador): el fútbol reactivo debe sentirse ocasión especial, no metralleta.
export const MAX_CHAINS = 3;

/**
 * Los hooks activos del Match, cacheados en la instancia: {hookName: [{...cfg,
 * traitId}]} — una lista por nombre porque tiers futuros pueden apilar el mismo
 * hook (T2/T3). Vacío sin filosofía o sin rasgos.
 */
export function traitHooks(m) {
  if (m._traitHooks) return m._traitHooks;
  const out = {};
  for (const id of m.my.filo?.rasgos || []) {
    const t = traitById(id);
    if (!t) continue;
    for (const [k, cfg] of Object.entries(t.hooks)) (out[k] = out[k] || []).push({ ...cfg, traitId: id });
  }
  return (m._traitHooks = out);
}

/** El primer hook `name` (T1: no hay apilados) o null. */
export function hookOf(m, name) {
  return traitHooks(m)[name]?.[0] || null;
}

/** ¿El DT compró este rasgo? — EL GATE DE LA MIGRACIÓN F2 (T2): donde antes
 *  decidía filoRasgo (Consolidada regalaba el efecto profundo), ahora decide
 *  el árbol. Consolidada da su PI y nada más (decisión PO #2). */
export function hasTrait(m, traitId) {
  return (m.my.filo?.rasgos || []).includes(traitId);
}

/**
 * Tira un hook con probabilidad y presupuesto de cadena: devuelve el hook si
 * procede encadenar (y CONSUME presupuesto), null si no. Para hooks sin `p`
 * (pasivos, ej. finishSupport) usar hookOf — esto es solo para reactivas.
 * `pPlus` suma probabilidad externa (T3: el Master que afila la cadena básica —
 * El Robo es el Pase suma chainPlus a la p de Morder).
 */
export function rollChain(m, name, pPlus = 0) {
  const h = hookOf(m, name);
  if (!h) return null;
  if ((m._chainCount || 0) >= MAX_CHAINS) return null;
  if (rnd() >= h.p + pPlus) return null;
  m._chainCount = (m._chainCount || 0) + 1;
  return h;
}

/**
 * LA PRIMITIVA REACTIVA: arranca una secuencia MÍA de tipo `typeId` como
 * continuación del fútbol actual — protagonista por protWeight (como
 * startSequence), bonus heredado del hook, intro propia del rasgo (el MOMENTO
 * nombrable: el relato deja claro que esto lo compró el DT). No pasa por el
 * generador: no cuenta contra el objetivo del partido ni pisa _lastSeqType.
 * Deja la decisión del primer acto creada (mismo contrato §3.2).
 */
export function chainMine(m, typeId, { bonus = 0, intro = null, buildDecision } = {}) {
  const t = sequenceType(typeId);
  const cands = m.activeMine().filter(p => p.pos !== "POR");
  if (!t || !cands.length) return false;
  const prot = m._weightedPick(cands, cands.map(p => (t.protWeight[playedPos(p)] ?? 1) * protMomentum(p)));
  m._flow.push({ min: m.min, side: "mine", w: 3 }); // el fútbol reactivo también pesa en posesión/momentum
  m.seq = { type: t, prot, actIdx: 0, bonus, reactive: true };
  m.log("event", `${t.icon} min ${m.clock()}' — ${intro ? intro(prot) : t.flavor.intro(prot)}`);
  buildDecision(m); // lo inyecta sequence-acts (evita el ciclo de imports)
  return true;
}

/** Narración del momento de un rasgo (una voz por llamada, prefijada con su icono). */
export function traitMoment(m, traitId, lines) {
  m.log("event", `min ${m.clock()}' — ${traitById(traitId)?.icon || "✨"} ${pick(lines)}`);
}
