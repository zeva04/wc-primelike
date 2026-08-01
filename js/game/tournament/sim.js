/* ============================================================
   game/tournament/sim — simulación IA de partidos que el
   usuario no juega (Poisson; docs/CORE.md §8).
   ============================================================ */
import { rnd, poisson } from "../../core/rng.js";
import { clamp } from "../../core/math.js";
import { getTeam } from "../../data/teams-repo.js";
import { teamRating } from "../ratings.js";

/* CUÁNTO PESA EL RATING en un partido del mundo. Era 0.55 SIEMPRE, y con eso el mundo
   apenas seleccionaba: medido en 3.000 brackets, el rating medio del que llega a la final
   subía solo de 76.1 a 80.3 en cinco rondas, y **el 6% de las finales se jugaban contra un
   rival de rating ≤69**. La dificultad del torneo crecía sin que se VIERA crecer.

   SPRINT DE LA ESCALADA (decisión PO): el mundo se vuelve implacable SOLO en eliminatorias.
   Los grupos conservan su caos a propósito — la cenicienta y el batacazo son el combustible
   del World Cup Daily, y es la única fase donde una sorpresa no le arruina el bracket a
   nadie. En KO, en cambio, el que llega a la final tiene que ser un grande: la dificultad
   que se siente es la que se lee en el escudo del rival, no la que está escondida en un
   multiplicador. */
const SPREAD_GROUPS = 0.55, SPREAD_KO = 0.85;

/** Simula un partido entre dos equipos por Poisson; en eliminatorias resuelve prórroga y penales. */
export function quickSim(idA, idB, knockout = false) {
  // Normalizado a escala ~1-5 (rating/20) para calibrar los lambdas de Poisson
  const rA = teamRating(getTeam(idA)) / 20, rB = teamRating(getTeam(idB)) / 20;
  const k = knockout ? SPREAD_KO : SPREAD_GROUPS;
  const lamA = clamp(1.35 + k * (rA - rB), 0.2, 3.8);
  const lamB = clamp(1.35 + k * (rB - rA), 0.2, 3.8);
  let gA = poisson(lamA), gB = poisson(lamB);
  let pens = null;
  // La prórroga y la tanda NO escalan con la selectividad y es deliberado: si el partido
  // llegó empatado hasta ahí, el grande ya falló en ganarlo — una tanda es una moneda y
  // ese es justo el sitio por donde tiene que colarse la cenicienta que sobrevivió.
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
