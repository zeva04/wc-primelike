/* ============================================================
   game/lineup — reglas de alineación del formato 6v6.
   Hasta F7 vivían en la UI y el smoke test debía duplicarlas
   (P2 del diagnóstico); ahora hay una sola fuente.
   ============================================================ */
import { naturalOverall } from "./ratings.js";

// Las 6 formaciones del formato 6v6: 1 arquero fijo + 5 de campo repartidos
// DEF-MED-DEL con mínimo 1 por línea (son todas las combinaciones posibles).
// El reparto NO es cosmético: los DEF alimentan el poder defensivo y MED+DEL el
// ofensivo (match/powers.teamPowers), así que `hint` describe un efecto real.
export const FORMATIONS = [
  { id: "1-1-3", def: 1, med: 1, del: 3, hint: "Todo al ataque" },
  { id: "1-2-2", def: 1, med: 2, del: 2, hint: "Ofensiva" },
  { id: "1-3-1", def: 1, med: 3, del: 1, hint: "Dueños del medio" },
  { id: "2-1-2", def: 2, med: 1, del: 2, hint: "Equilibrada" },
  { id: "2-2-1", def: 2, med: 2, del: 1, hint: "Orden y salida" },
  { id: "3-1-1", def: 3, med: 1, del: 1, hint: "Defensiva" },
];

const LINES = ["POR", "DEF", "MED", "DEL"];
const needsOf = f => ({ POR: 1, DEF: f.def, MED: f.med, DEL: f.del });

/** Formación de la tabla por id (null si el id no es una de las 6). */
export function getFormation(id) { return FORMATIONS.find(f => f.id === id) || null; }

/**
 * Los 6 puestos que exige una formación, en orden POR→DEF→MED→DEL. El once se guarda
 * en este mismo orden: el titular en el índice i juega el puesto slots[i].
 */
export function formationSlots(id) {
  const f = getFormation(id);
  if (!f) return [];
  const need = needsOf(f);
  return LINES.flatMap(pos => Array.from({ length: need[pos] }, () => pos));
}

/**
 * ¿Este jugador puede pararse en este puesto? El arco es exclusivo de los arqueros y
 * los arqueros no salen de él (decisión del PO 15-jul): sus stats son otro juego —
 * un delantero no tiene `atajadas` ni un arquero tiene `defensa`, así que cruzarlos
 * no sería un castigo sino una división por la nada. Entre DEF/MED/DEL, todo vale.
 */
export function canPlayAt(player, slotPos) {
  return (player.pos === "POR") === (slotPos === "POR");
}

/**
 * Fija en qué puesto juega cada titular (`posJugada`) según la formación y se lo borra
 * al resto del plantel. Es la única pluma de ese campo (ARQUITECTURA §3.1) y hay que
 * llamarla cada vez que el once cambia: de ahí salen el castigo por jugar fuera de
 * puesto y la nota que ve el DT.
 */
export function assignPositions(squad, lineup, formationId) {
  const slots = formationSlots(formationId);
  for (const p of squad) p.posJugada = null;
  lineup.forEach((p, i) => { p.posJugada = slots[i] || p.pos; });
}

/**
 * Ordena el once para que el titular del índice i caiga en el slot i de la formación
 * (cada uno en un slot de SU posición natural, mientras alcancen).
 *
 * Sin esto el once automático se rompe: `bestLineup` devuelve POR,DEF,MED,DEL,+extras
 * (ej. POR,DEF,MED,DEL,DEL,DEF) mientras los slots del 2-1-2 son POR,DEF,DEF,MED,DEL,DEL
 * — y assignPositions, que mapea por índice, terminaba castigando a medio equipo en su
 * propia posición. Bug reportado por el PO (Vinícius/Guimarães/Magalhães en Brasil).
 */
function orderBySlots(lineup, formationId) {
  const slots = formationSlots(formationId);
  if (!slots.length) return lineup;
  const pool = lineup.slice();
  const out = [];
  for (const pos of slots) {
    const i = pool.findIndex(p => p.pos === pos);
    out.push(...pool.splice(i >= 0 ? i : 0, 1));
  }
  return out;
}

/**
 * El once vigente, rearmado si dejó de ser válido (una baja nueva), ordenado por slots y
 * con los puestos ya asignados. Puerta de entrada única de las pantallas: hub y squad la
 * llaman antes de pintar para no duplicar la regla en dos lados.
 */
export function currentLineup(squad, prev, formationId) {
  const available = squad.filter(p => !p.suspendido && p.lesionadoPartidos === 0);
  let lineup = prev, id = formationId;
  const vigente = lineup && lineup.length === 6 && lineup.every(p => available.includes(p));
  if (!vigente) {
    lineup = autoLineup(available, id);
    // Si la formación elegida ya no se puede armar, la nueva sale del once que quedó.
    if (!canUseFormation(available, id)) id = getFormation(formationLabel(lineup)) ? formationLabel(lineup) : null;
    lineup = orderBySlots(lineup, id);
  }
  assignPositions(squad, lineup, id);
  return { lineup, formationId: id };
}

/**
 * Mejor once posible para una formación, o null si el plantel disponible no la cubre
 * (p.ej. pedir 3 DEF con 2 sanos). Los jugadores de `keep` mandan por sobre la nota:
 * así cambiar de formación no borra las elecciones manuales del DT.
 */
export function fillFormation(available, id, keep = []) {
  const f = getFormation(id);
  if (!f) return null;
  const need = needsOf(f);
  const picks = [];
  for (const pos of LINES) {
    const pool = available.filter(p => p.pos === pos).sort((a, b) =>
      (Number(keep.includes(b)) - Number(keep.includes(a))) || (naturalOverall(b) - naturalOverall(a)));
    if (pool.length < need[pos]) return null;
    picks.push(...pool.slice(0, need[pos]));
  }
  return picks;
}

/** ¿El plantel disponible alcanza para armar esta formación? */
export function canUseFormation(available, id) { return !!fillFormation(available, id); }

/**
 * Arma automáticamente el mejor once de 6. Con `formationId` respeta esa formación
 * (priorizando a `keep`); sin él usa el algoritmo histórico de abajo.
 */
export function autoLineup(available, formationId = null, keep = []) {
  if (formationId && canUseFormation(available, formationId)) return fillFormation(available, formationId, keep);
  return bestLineup(available);
}

// Mejor once sin formación pedida: 1 por cada línea que exista + los mejores extras
// de campo. Es el algoritmo histórico del juego y NO se toca sin recalcular la línea
// base de balance (docs/CORE.md §10): elige la misma nota total que un barrido por
// las 6 formaciones, pero desempata distinto, y el desempate mueve el reparto
// DEF/MED — que teamPowers convierte en poder defensivo y ofensivo real.
// Con al menos 1 jugador sano por línea su resultado siempre cae en una de las 6
// formaciones; si una línea entera está de baja, improvisa (validateLineup lo acepta).
function bestLineup(available) {
  const sorted = pos => available.filter(p => p.pos === pos).sort((a, b) => naturalOverall(b) - naturalOverall(a));
  const picks = [];
  for (const pos of LINES) {
    const best = sorted(pos)[0];
    if (best) picks.push(best);
  }
  const rest = available.filter(p => !picks.includes(p) && p.pos !== "POR")
    .sort((a, b) => naturalOverall(b) - naturalOverall(a));
  while (picks.length < 6 && rest.length) picks.push(rest.shift());
  return picks;
}

/** Valida una alineación: exactamente 6, 1 arquero y al menos 1 por línea disponible. */
export function validateLineup(available, selected) {
  if (selected.length !== 6) return { ok: false, msg: `Selecciona 6 titulares (llevas ${selected.length}).` };
  const count = pos => selected.filter(p => p.pos === pos).length;
  const avail = pos => available.some(p => p.pos === pos);
  if (avail("POR") && count("POR") !== 1) return { ok: false, msg: "Necesitas exactamente 1 arquero." };
  for (const pos of ["DEF", "MED", "DEL"]) {
    if (avail(pos) && count(pos) < 1) return { ok: false, msg: `Necesitas al menos 1 ${pos}.` };
  }
  return { ok: true };
}

/**
 * Formación que forman estos jugadores según su posición NATURAL (ej. "2-1-2").
 * Sirve para reconocer la formación de un once recién armado; NO es la formación que se
 * está jugando si el DT paró a alguien fuera de puesto — esa es `S.formation` (los slots).
 */
export function formationLabel(selected) {
  const c = { DEF: 0, MED: 0, DEL: 0 };
  selected.forEach(p => { if (c[p.pos] !== undefined) c[p.pos]++; });
  return `${c.DEF}-${c.MED}-${c.DEL}`;
}
