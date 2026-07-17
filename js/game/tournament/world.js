/* ============================================================
   game/tournament/world — el mundo que se mueve entre MIS
   partidos (Game Vision, Ley 7: "el Mundial continúa evolucione
   o no el jugador").

   Antes, TODOS los partidos ajenos se simulaban de golpe al
   cerrar mi partido (simMatchday / simKnockoutRound). Ahora los
   partidos pendientes de la fecha/ronda actual se reparten por
   los días del calendario: cada mañana, al llegar a un día
   nuevo, `playWorldDay` simula la tanda "de anoche" y la deja
   en `run.lastNight` — la materia prima del World Cup Daily.

   Sin plan almacenado: lo pendiente se deriva del estado
   (resultados de grupos / run.koPlayed), así que el reparto
   sobrevive a cualquier re-agendado. `finishGroupMatchday` /
   `finishKnockoutRound` cierran lo que el mundo no alcanzó a
   jugar cuando yo juego mi partido (los llama flow).

   Las rojas de estos partidos SUSPENDEN de verdad: el nombre
   queda en `run.rivalBans[teamId]` y se cumple en el PRÓXIMO
   partido de ese equipo — si es contra mí, esa figura no
   aparece en su alineación (genOpponentLineup) y el diario lo
   avisa; si es contra otro simulado, se cumple narrativamente
   al abrir ese partido (quickSim no modela planteles, así que
   el marcador no cambia — la consecuencia real es contra mí).
   ============================================================ */
import { rnd, pick, shuffle } from "../../core/rng.js";
import { getTeam } from "../../data/teams-repo.js";
import { quickSim } from "./sim.js";

// Probabilidad de que un partido ajeno deje una roja para el titular del diario
const RED_CARD_CHANCE = 0.09;

/** Clave de par sin dirección: mi resultado se guarda {yo, rival} aunque el fixture diga lo inverso. */
const pairKey = (a, b) => [a, b].sort().join("|");

/** Partidos de la fecha actual de grupos que los demás aún no jugaron. */
function pendingGroupMatches(run) {
  const round = run.rounds[run.matchday];
  if (!round) return [];
  const out = [];
  run.groups.forEach((g, gi) => {
    const played = new Set(g.results.map(r => pairKey(r.a, r.b)));
    for (const [i, j] of round) {
      const a = g.teamIds[i], b = g.teamIds[j];
      if (a === run.teamId || b === run.teamId) continue;
      if (played.has(pairKey(a, b))) continue;
      out.push({ a, b, groupIdx: gi, groupName: g.name });
    }
  });
  return out;
}

/** Cruces de la ronda eliminatoria actual que los demás aún no jugaron. */
function pendingKoMatches(run) {
  return (run.koMatches || [])
    .map(([a, b], idx) => ({ a, b, idx }))
    .filter(m => m.a !== run.teamId && m.b !== run.teamId && !run.koPlayed[m.idx]);
}

/**
 * Simula UN partido del mundo y lo asienta donde corresponde (resultados del
 * grupo o `run.koPlayed`). Devuelve la entrada para `lastNight`:
 * {a, b, gA, gB, stage, groupName?, myGroup?, pens?, win?, red?: {teamId, name}}.
 */
function simWorldMatch(run, mch) {
  const knockout = run.stage !== "groups";
  // Ambos equipos "cumplen" acá cualquier suspensión pendiente: era para este partido
  delete run.rivalBans[mch.a];
  delete run.rivalBans[mch.b];
  const r = quickSim(mch.a, mch.b, knockout);
  const entry = { a: mch.a, b: mch.b, gA: r.gA, gB: r.gB, stage: run.stage };
  if (knockout) {
    entry.pens = r.pens;
    entry.win = r.gA > r.gB ? mch.a : r.gB > r.gA ? mch.b : (r.pens === "A" ? mch.a : mch.b);
    run.koPlayed[mch.idx] = entry;
  } else {
    entry.groupName = mch.groupName;
    entry.myGroup = mch.groupIdx === run.myGroupIdx;
    run.groups[mch.groupIdx].results.push({ a: mch.a, b: mch.b, gA: r.gA, gB: r.gB });
  }
  if (rnd() < RED_CARD_CHANCE) {
    // La roja cae más seguido en el perdedor (quedarse con 10 suele costar el partido)
    const loserId = entry.gA === entry.gB ? (rnd() < 0.5 ? mch.a : mch.b) : (entry.gA < entry.gB ? mch.a : mch.b);
    const t = getTeam(rnd() < 0.7 ? loserId : (loserId === mch.a ? mch.b : mch.a));
    const src = (t.figures && t.figures.length ? t.figures : t.players) || [];
    entry.red = { teamId: t.id, name: src.length ? pick(src).name : null };
    // La suspensión es real: se cumple en el próximo partido de ese equipo
    if (entry.red.name) run.rivalBans[t.id] = [entry.red.name];
  }
  return entry;
}

/**
 * La tanda "de anoche": reparte lo pendiente en partes iguales entre los días
 * que quedan hasta mi partido y simula la de hoy. Llena `run.lastNight`
 * (vacía si el mundo no tenía nada que jugar — los días quietos existen).
 */
export function playWorldDay(run) {
  run.lastNight = [];
  const pending = run.stage === "groups" ? pendingGroupMatches(run) : pendingKoMatches(run);
  if (!pending.length) return run.lastNight;
  const daysLeft = Math.max(1, run.nextMatchDay - run.day);
  const count = Math.ceil(pending.length / daysLeft);
  for (const mch of shuffle(pending).slice(0, count)) run.lastNight.push(simWorldMatch(run, mch));
  return run.lastNight;
}

/**
 * Cierra la fecha de grupos al jugarse mi partido: simula lo que el mundo no
 * alcanzó a jugar y devuelve los OTROS resultados de mi grupo en esta fecha
 * (jugados durante la ventana o recién), para la pantalla de post-partido.
 */
export function finishGroupMatchday(run) {
  for (const mch of pendingGroupMatches(run)) simWorldMatch(run, mch);
  const g = run.groups[run.myGroupIdx];
  const myKeys = new Set((run.rounds[run.matchday] || []).map(([i, j]) => pairKey(g.teamIds[i], g.teamIds[j])));
  return g.results.filter(r => myKeys.has(pairKey(r.a, r.b)) && r.a !== run.teamId && r.b !== run.teamId);
}

/**
 * Cierra la ronda eliminatoria al jugarse mi partido: simula los cruces que
 * falten y devuelve {winners, results} alineados con `run.koMatches` — mi
 * posición queda en null para que flow la complete con mi resultado real.
 */
export function finishKnockoutRound(run) {
  for (const mch of pendingKoMatches(run)) simWorldMatch(run, mch);
  return {
    winners: run.koMatches.map((m, idx) => run.koPlayed[idx]?.win ?? null),
    results: run.koMatches.map((m, idx) => run.koPlayed[idx] || null),
  };
}
