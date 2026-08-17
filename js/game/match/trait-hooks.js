/* ============================================================
   game/match/trait-hooks — el intérprete de RASGOS del Match.

   Los rasgos viajan como ids en matchCtx.filo.rasgos (la
   frontera §3.2: el Match no conoce la run); acá se resuelven a
   sus `hooks` (content/traits) y se ofrecen como primitivas que
   sequences/sequence-acts consultan en los puntos de integración.

   LA CAPACIDAD NUEVA: SECUENCIAS REACTIVAS — encadenar una
   secuencia mía disparada por el RESULTADO de otra (la mordida
   tras pérdida, la trampa que convierte el repliegue, la segunda
   pelota del pelotazo). Generaliza el patrón def→of que ya
   existía ad-hoc (playout→transición, fortaleza→pelotazo,
   chainSetPiece): chainMine es ese patrón con nombre, para que
   los 5+ rasgos que lo consumen (T1 y T3) no lo reinventen.

   Reglas del motor:
   - Una secuencia REACTIVA no cuenta contra el objetivo 5-9 del
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
import { traitById } from "../../content/traits/index.js";
import { sequenceType } from "../../content/match/sequences.js";
import { playedPos } from "../ratings.js";
import { protMomentum } from "./sequences.js"; // ciclo benigno: solo runtime (mismo patrón que sequence-acts)
import { setBall, originOf, myHeight } from "./field.js";

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

/**
 * El hook `name` activo, o null.
 *
 * `family` DESAMBIGUA las builds híbridas: varios
 * hooks son "de una jugada" (`of`/`seq`: skipToFinish de la transición, variantDeep de
 * la recuperación, oppShotMalus del repliegue…) y con las 4 filosofías rediseñadas un
 * DT puede tener dos rasgos que declaran el mismo hook para jugadas DISTINTAS. Sin
 * este filtro ganaba siempre el primero comprado y el otro rasgo quedaba mudo.
 * Pasando la familia se devuelve EL de esa jugada; sin ella, el primero (los hooks
 * que no son de jugada — backPass, iceGame, wall… — siguen igual).
 *
 * Cuando DOS rasgos declaran el mismo hook para la misma jugada (uno superlativo del
 * otro: Directo saltea la recuperación el 30% de las veces y su Master el 50%), esto no
 * alcanza y el sitio tiene que resolver la acumulación a mano con `hooksOf` — la
 * frecuencia la manda el mejor, la calidad se suma. Ver el atajo al desenlace en
 * sequences.startSequence: es el único caso hasta hoy, y devolver "el mejor" a secas
 * dejaba al básico aportando CERO.
 */
export function hookOf(m, name, family) {
  const list = traitHooks(m)[name];
  if (!list?.length) return null;
  if (family === undefined) return list.find(h => zoneOk(m, h)) || null;
  return list.find(h => (h.of ?? h.seq) === family && zoneOk(m, h)) || null;
}

/** Todos los hooks `name` activos (los que se APILAN: transitionPass, pressStamina). */
export function hooksOf(m, name) {
  return (traitHooks(m)[name] || []).filter(h => zoneOk(m, h));
}

/**
 * EL GATE TERRITORIAL DE LOS RASGOS. Un rasgo puede
 * declarar DÓNDE existe su fútbol:
 *   `zone: [vMin, vMax]` — solo con la pelota en esas alturas (reventar el balón es
 *      de zona propia; pivotear al área, del área rival)
 *   `minHeight: n`       — solo con MI bloque en esa altura o más arriba (la trampa
 *      del offside no se puede tender con la línea metida en el área)
 * Sin declaración, el rasgo aplica siempre — solo se gatea lo que el fútbol pide, y
 * a lo gateado se le COMPENSA la frecuencia para no mover el balance
 * del árbol recién calibrado: el rasgo cambia de carácter, no de valor.
 */
function zoneOk(m, h) {
  if (h.zone) {
    const v = m.field?.v ?? 3;
    if (v < h.zone[0] || v > h.zone[1]) return false;
  }
  return !h.minHeight || myHeight(m) >= h.minHeight;
}

/** ¿El DT compró este rasgo? — EL GATE DE LA MIGRACIÓN F2: donde antes
 *  decidía filoRasgo (Consolidada regalaba el efecto profundo), ahora decide
 *  el árbol. Consolidada da su PI y nada más. */
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
  const list = hooksOf(m, name);
  if (!list.length) return null;
  if ((m._chainCount || 0) >= MAX_CHAINS) return null;
  // Se tiran TODOS los rasgos que declaren esta cadena, en orden de compra, hasta que
  // uno enganche (rediseño del Contra): dos filosofías pueden encadenar desde el mismo
  // sitio hacia jugadas distintas —el córner defendido lanza pelotazo en el Bloque y
  // contra en el Contragolpe— y tenerlas las dos debe dar las dos chances, no una.
  for (const h of list) {
    if (rnd() >= h.p + pPlus) continue;   // (la lista ya viene filtrada por zona: hooksOf)
    m._chainCount = (m._chainCount || 0) + 1;
    return h;
  }
  return null;
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
  // El territorio también manda en el fútbol reactivo: la cadena nace donde ESE fútbol
  // nace, no donde quedó la jugada anterior.
  setBall(m, { ...originOf(m, t), side: "mine" });
  m.seq = { type: t, prot, actIdx: 0, bonus, reactive: true };
  m.log("event", `${t.icon} min ${m.clock()}' — ${intro ? intro(prot) : t.flavor.intro(prot)}`);
  buildDecision(m); // lo inyecta sequence-acts (evita el ciclo de imports)
  return true;
}

/** Narración del momento de un rasgo (una voz por llamada, prefijada con su icono). */
export function traitMoment(m, traitId, lines) {
  m.log("event", `min ${m.clock()}' — ${traitById(traitId)?.icon || "✨"} ${pick(lines)}`);
}
