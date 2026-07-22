/* ============================================================
   game/tournament/knockout — rondas eliminatorias y cruces.
   ============================================================ */
import { myNextGroupRival } from "./groups.js";

export const STAGE_ORDER = ["r32", "r16", "qf", "sf", "final"];

/** Profundidad KO de una etapa: 0 en grupos, 1 (16avos) … 5 (final). Es el eje de la
 *  ESCALADA DE RIVALES (R2): la forma de torneo y la madurez de identidad escalan con él. */
export function koRoundOf(stage) {
  const i = STAGE_ORDER.indexOf(stage);
  return i === -1 ? 0 : i + 1;
}
export const STAGE_LABEL = { groups: "Fase de grupos", r32: "16avos de final", r16: "Octavos de final", qf: "Cuartos de final", sf: "Semifinal", final: "FINAL" };

// La simulación de los cruces ajenos vive en tournament/world.js: el mundo los
// juega día a día (playWorldDay) y flow cierra la ronda (finishKnockoutRound).

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
