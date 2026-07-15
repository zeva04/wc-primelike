/* ============================================================
   game/tournament/sim — simulación IA de partidos que el
   usuario no juega (Poisson; docs/CORE.md §8).
   ============================================================ */
import { rnd, poisson } from "../../core/rng.js";
import { clamp } from "../../core/math.js";
import { getTeam } from "../../data/teams-repo.js";
import { teamRating } from "../ratings.js";

/** Simula un partido entre dos equipos por Poisson; en eliminatorias resuelve prórroga y penales. */
export function quickSim(idA, idB, knockout = false) {
  // Normalizado a escala ~1-5 (rating/20) para calibrar los lambdas de Poisson
  const rA = teamRating(getTeam(idA)) / 20, rB = teamRating(getTeam(idB)) / 20;
  const lamA = clamp(1.35 + 0.55 * (rA - rB), 0.2, 3.8);
  const lamB = clamp(1.35 + 0.55 * (rB - rA), 0.2, 3.8);
  let gA = poisson(lamA), gB = poisson(lamB);
  let pens = null;
  if (knockout && gA === gB) {
    // prórroga rápida
    if (rnd() < 0.35) { rnd() < 0.5 + 0.1 * (rA - rB) ? gA++ : gB++; }
    if (gA === gB) {
      const pA = 0.5 + 0.08 * (rA - rB);
      pens = rnd() < pA ? "A" : "B";
    }
  }
  return { gA, gB, pens };
}
