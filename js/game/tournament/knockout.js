/* ============================================================
   game/tournament/knockout — rondas eliminatorias y cruces.
   ============================================================ */
import { quickSim } from "./sim.js";
import { myNextGroupRival } from "./groups.js";

export const STAGE_ORDER = ["r32", "r16", "qf", "sf", "final"];
export const STAGE_LABEL = { groups: "Fase de grupos", r32: "16avos de final", r16: "Octavos de final", qf: "Cuartos de final", sf: "Semifinal", final: "FINAL" };

/** Simula una ronda eliminatoria completa salvo mi partido; devuelve ganadores y resultados. */
export function simKnockoutRound(matches, myTeamId) {
  const winners = [];
  const results = [];
  for (const [a, b] of matches) {
    if (a === myTeamId || b === myTeamId) { winners.push(null); results.push(null); continue; }
    const r = quickSim(a, b, true);
    let win;
    if (r.gA > r.gB) win = a; else if (r.gB > r.gA) win = b; else win = r.pens === "A" ? a : b;
    winners.push(win);
    results.push({ a, b, gA: r.gA, gB: r.gB, pens: r.pens, win });
  }
  return { winners, results };
}

/** Empareja a los ganadores de una ronda para la siguiente (1º vs 2º, 3º vs 4º...). */
export function pairNextRound(winners) {
  const next = [];
  for (let i = 0; i < winners.length; i += 2) next.push([winners[i], winners[i + 1]]);
  return next;
}

/** Id del próximo rival del usuario según la etapa (fecha de grupo o cruce de eliminatoria). */
export function nextOpponentId(run) {
  if (run.stage === "groups") return myNextGroupRival(run);
  const m = run.koMatches.find(([a, b]) => a === run.teamId || b === run.teamId);
  return m[0] === run.teamId ? m[1] : m[0];
}
