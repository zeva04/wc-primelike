/* ============================================================
   game/lineup — reglas de alineación del formato 6v6.
   Hasta F7 vivían en la UI y el smoke test debía duplicarlas
   (P2 del diagnóstico); ahora hay una sola fuente.
   ============================================================ */
import { naturalOverall, playedPos } from "./ratings.js";

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
 * los arqueros no salen de él: sus stats son otro juego —
 * un delantero no tiene `atajadas` ni un arquero tiene `defensa`, así que cruzarlos
 * no sería un castigo sino una división por la nada. Entre DEF/MED/DEL, todo vale.
 *
 * `{ emergency: true }` es la ÚNICA excepción (bug fix,): el equipo nunca
 * puede jugar sin nadie en el arco, y si los dos arqueros del plantel quedan fuera a la
 * vez, alguien de campo tiene que ponerse los guantes. Sus stats de arco no salen de
 * `p.stats` (no existen) sino de `ratings.EMERGENCY_GK_STATS` — `statAt` ya lo resuelve
 * solo por tener `posJugada === "POR"`. Quien llama decide CUÁNDO ofrecer la excepción
 * (solo si de verdad no queda un arquero real disponible); acá no se adivina el contexto.
 */
export function canPlayAt(player, slotPos, { emergency = false } = {}) {
  if (emergency && slotPos === "POR" && player.pos !== "POR") return true;
  return (player.pos === "POR") === (slotPos === "POR");
}

/**
 * Reubicación táctica: dos titulares intercambian el puesto que juegan. No gasta cambio
 * y se auto-limita sola — el castigo por jugar fuera de puesto
 * ya la hace cara. Devuelve false si alguno no puede ocupar el puesto del otro (el arco).
 *
 * La usa el PARTIDO, donde no hay formación de la que rederivar: ahí `posJugada` es la
 * única verdad. En Gestión de Plantilla, en cambio, el once se reordena por índice y
 * `assignPositions` rederiva los puestos desde los slots (si no, el próximo repintado
 * desharía el movimiento).
 */
export function swapAssignments(a, b) {
  const pa = a.posJugada || a.pos, pb = b.posJugada || b.pos;
  if (!canPlayAt(a, pb) || !canPlayAt(b, pa)) return false;
  a.posJugada = pb;
  b.posJugada = pa;
  return true;
}

/**
 * Reparte a estos titulares en los puestos de una formación SIN cambiar quiénes juegan:
 * devuelve un Map jugador → puesto. Cada slot se lleva primero a alguien de su posición
 * natural y, cuando no queda, a quien sobre — que jugará fuera de puesto y pagará
 * `ratings.outOfPosPenalty`, exactamente como una reubicación a mano. El arco es
 * innegociable (`canPlayAt`): lo ocupa el arquero.
 *
 * La usa la Gestión de plantilla EN PARTIDO (PO cambiar el dibujo con el
 * partido en juego). Es la hermana de `assignPositions` para el caso donde el once ya
 * está dado y lo único que se mueve es el dibujo — por eso no toca el resto del plantel
 * ni reordena nada: en el partido `posJugada` es la única verdad (ver swapAssignments).
 */
export function assignToFormation(lineup, formationId) {
  const slots = formationSlots(formationId);
  if (slots.length !== lineup.length) return null;
  const pool = lineup.slice();
  const out = new Map();
  const take = pred => { const i = pool.findIndex(pred); return i >= 0 ? pool.splice(i, 1)[0] : null; };
  for (const pos of slots) {
    const p = pos === "POR"
      ? take(x => x.pos === "POR")
      : take(x => x.pos === pos && canPlayAt(x, pos)) || take(x => canPlayAt(x, pos));
    if (p) out.set(p, pos);
  }
  for (const p of pool) out.set(p, p.pos);   // sin arquero en el once: cada uno a lo suyo
  return out;
}

/**
 * Fija en qué puesto juega cada titular (`posJugada`) según la formación y se lo borra
 * al resto del plantel. Es la única pluma de ese campo y hay que
 * llamarla cada vez que el once cambia: de ahí salen el castigo por jugar fuera de
 * puesto y la nota que ve el DT.
 *
 * EL ARCO NUNCA QUEDA VACÍO (bug fix,): es la última red, así que corre
 * DESPUÉS de la asignación normal por slots. Si nadie terminó jugando de POR —ni por
 * slot de formación ni por posición natural— y hay al menos un jugador de campo en el
 * once, el PEOR de campo (naturalOverall) se pone los guantes. Cubre TODOS los caminos
 * que llegan hasta acá sin arquero: el plantel sano sin formación resuelta (`currentLineup`
 * ya intenta algo mejor antes de llegar hasta acá) y, sobre todo, el plantel DIEZMADO sin
 * ningún POR disponible — ahí ninguna de las 6 formaciones de la tabla llega a cerrar
 * (piden 5 de campo + 1 arco; con 5 jugadores en total, reservar el arco solo deja 4), así
 * que es la ÚNICA red que le queda. Si esto no corriera, el equipo saldría a jugar con el
 * área vacía — que es exactamente el bug que esto arregla.
 */
export function assignPositions(squad, lineup, formationId) {
  const slots = formationSlots(formationId);
  for (const p of squad) p.posJugada = null;
  lineup.forEach((p, i) => { p.posJugada = slots[i] || p.pos; });
  if (lineup.length && !lineup.some(p => p.posJugada === "POR")) {
    const emergencyGk = [...lineup].sort((a, b) => naturalOverall(a) - naturalOverall(b))[0];
    emergencyGk.posJugada = "POR";
  }
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
  const vigente = lineup && lineup.every(p => available.includes(p)) && validateLineup(available, lineup).ok;
  if (!vigente) {
    lineup = autoLineup(available, id);
    // Si la formación elegida ya no se puede armar, la nueva sale del once que quedó —
    // pero SOLO si el once la cubre entera. `formationLabel` cuenta DEF/MED/DEL y da por
    // sentado el arquero: un plantel SIN arquero arma 5 de campo cuyo label ("1-1-3")
    // coincide con el de una formación de 6, y orderBySlots terminaba metiendo a un DEF
    // en el arco y corriendo a todos una línea hacia atrás (tres castigos de −6 encima de
    // jugar en inferioridad, que ya es el castigo que corresponde). Pedir las 6 cabezas
    // desambigua el label sin tocar el caso sano.
    if (!canUseFormation(available, id)) {
      const label = formationLabel(lineup);
      id = lineup.length === 6 && getFormation(label) ? label : null;
      // SIN NINGÚN ARQUERO DISPONIBLE (bug fix,): `bestLineup` no reserva el
      // arco de emergencia (no sabe de formaciones), así que sus 6 de campo suman 6 en
      // `formationLabel` — y NINGUNA de las 6 formaciones de la tabla suma 6 (todas suman
      // 5: 5 de campo + 1 arquero). El fallback de arriba SIEMPRE daba `null` en este caso
      // y el arco se perdía en el camino: nadie terminaba jugando ahí y el equipo salía a
      // la cancha sin nadie en el área. Acá se busca la PRIMERA formación de la tabla que
      // SÍ se pueda armar reservando el arco de emergencia (fillFormation ya sabe hacerlo)
      // y se usa SU resultado — bestLineup no sirve porque no reserva ese cupo.
      if (!id && lineup.length === 6 && !available.some(p => p.pos === "POR")) {
        const f = FORMATIONS.find(fm => canUseFormation(available, fm.id));
        if (f) { id = f.id; lineup = fillFormation(available, id); }
        // Si NINGUNA formación alcanza ni reservando el arco de emergencia (plantel
        // brutalmente diezmado, además de sin arquero), `id` queda en null y
        // validateLineup lo va a reportar: no hay forma automática de resolverlo, y es
        // correcto que el DT quede bloqueado — no hay con qué armar un once legal.
      }
    }
    lineup = orderBySlots(lineup, id);
  }
  assignPositions(squad, lineup, id);
  return { lineup, formationId: id };
}

/**
 * Mejor once posible para una formación, o null si el plantel disponible no la cubre
 * (p.ej. pedir 3 DEF con 2 sanos). Los jugadores de `keep` mandan por sobre la nota:
 * así cambiar de formación no borra las elecciones manuales del DT.
 *
 * ARQUERO DE EMERGENCIA (bug fix,): si NINGÚN POR está disponible (los dos
 * lesionados/suspendidos a la vez), el equipo NUNCA sale a jugar sin nadie en el arco —
 * el puesto se cubre con el PEOR jugador de campo libre (su calidad de arco es la misma
 * línea fija sin importar quién sea — ratings.EMERGENCY_GK_STATS —, así que no tiene
 * sentido sacrificar a la figura de su línea). Se procesa PRIMERO
 * para que DEF/MED/DEL, más abajo, ya lo encuentren descartado.
 */
export function fillFormation(available, id, keep = []) {
  const f = getFormation(id);
  if (!f) return null;
  const need = needsOf(f);
  const sinArquero = !available.some(p => p.pos === "POR");
  const picks = [];
  for (const pos of LINES) {
    const pool = (pos === "POR" && sinArquero
      ? available.filter(p => p.pos !== "POR").sort((a, b) => naturalOverall(a) - naturalOverall(b))
      : available.filter(p => p.pos === pos && !picks.includes(p)).sort((a, b) =>
          (Number(keep.includes(b)) - Number(keep.includes(a))) || (naturalOverall(b) - naturalOverall(a))));
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

/**
 * Cuántos titulares puede presentar HOY este plantel: 6, salvo emergencia.
 * Un plantel diezmado (4+ bajas de campo simultáneas) no llega a 6 porque el
 * segundo arquero no puede jugar en cancha (canPlayAt) — y el partido se juega
 * IGUAL: presentar menos de 6 ya lo castiga el motor con la misma pena de
 * inferioridad que una roja (match/powers). Sin esta válvula la run moría en
 * un softlock: el botón de jugar quedaba bloqueado para siempre.
 */
export function maxLineupSize(available) {
  const field = available.filter(p => p.pos !== "POR").length;
  return Math.min(6, field + (available.some(p => p.pos === "POR") ? 1 : 0));
}

/**
 * Valida una alineación: exactamente 6 (o TODOS los presentables, si el plantel
 * diezmado no llega — devuelve `short: true` para que la UI avise), 1 arquero y
 * al menos 1 por línea disponible.
 */
export function validateLineup(available, selected) {
  const size = maxLineupSize(available);
  if (selected.length !== size) {
    return { ok: false, msg: size === 6 ? `Selecciona 6 titulares (llevas ${selected.length}).` : `Plantel diezmado: presenta a los ${size} que quedan en pie (llevas ${selected.length}).` };
  }
  const count = pos => selected.filter(p => p.pos === pos).length;
  const avail = pos => available.some(p => p.pos === pos);
  // EL ARCO NUNCA PUEDE QUEDAR VACÍO. Sin esta regla se saltaba
  // entera cuando ningún POR estaba disponible (los dos lesionados/suspendidos a la vez) y
  // el equipo salía a jugar con seis de campo y nadie en el arco. Ahora cuenta por PUESTO
  // JUGADO (`playedPos`), no por posición natural — eso admite al arquero de emergencia
  // (`canPlayAt(..., {emergency:true})` solo lo habilita cuando `avail("POR")` es false, en
  // la pantalla de Gestión de Plantilla), y sigue exigiendo exactamente 1 arquero real
  // cuando sí hay uno disponible.
  if (selected.filter(p => playedPos(p) === "POR").length !== 1) {
    return {
      ok: false,
      msg: avail("POR")
        ? "Necesitas exactamente 1 arquero."
        : "Sin arquero disponible: designa a un jugador de campo para el arco (Gestión de Plantilla).",
    };
  }
  for (const pos of ["DEF", "MED", "DEL"]) {
    if (avail(pos) && count(pos) < 1) return { ok: false, msg: `Necesitas al menos 1 ${pos}.` };
  }
  return { ok: true, short: size < 6 };
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
