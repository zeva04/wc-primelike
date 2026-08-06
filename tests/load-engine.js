/* ============================================================
   Loader del motor para tests en Node (sin navegador).

   Desde F7 no existe fachada en el juego: este loader agrega
   los módulos del motor en un solo objeto `Engine` SOLO por
   comodidad de los tests (los exports tienen nombres únicos).
   El mismo código que corre el navegador corre aquí, sin eval.
   ============================================================ */
import path from "node:path";
import { fileURLToPath } from "node:url";

/** Raíz del proyecto (para tests que leen archivos, ej. banderas). */
export const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");

export async function loadEngine() {
  const { WC_DATA } = await import("../data/teams.js");
  const mods = await Promise.all([
    import("../js/core/rng.js"),
    import("../js/core/math.js"),
    import("../js/data/teams-repo.js"),
    import("../js/game/ratings.js"),
    import("../js/game/lineup.js"),
    import("../js/game/opponents.js"),
    import("../js/game/scouting.js"),
    import("../js/game/run.js"),
    import("../js/game/flow.js"),
    import("../js/game/calendar.js"),
    import("../js/game/daily.js"),
    import("../js/game/day-action.js"),
    import("../js/game/discipline.js"),
    import("../js/game/medical.js"),
    import("../js/game/momentum.js"),
    import("../js/game/morale.js"),
    import("../js/game/philosophy.js"),
    import("../js/game/traits.js"),
    import("../js/game/coach.js"),
    import("../js/game/oxidation.js"),
    import("../js/game/scorers.js"),
    import("../js/game/assists.js"),
    import("../js/game/journal.js"),
    import("../js/game/tournament/sim.js"),
    import("../js/game/tournament/groups.js"),
    import("../js/game/tournament/knockout.js"),
    import("../js/game/tournament/world.js"),
    import("../js/game/match/Match.js"),
    import("../js/game/match/powers.js"),
    import("../js/game/match/actions.js"),
    import("../js/game/match/chances.js"),
    import("../js/game/match/incidents.js"),
    import("../js/game/match/sequences.js"),
    import("../js/game/match/sequence-acts.js"),
    import("../js/game/match/trait-hooks.js"),
    import("../js/game/match/press.js"),
    import("../js/game/match/stats.js"),
    import("../js/game/match/field.js"),
    import("../js/game/match/match-momentum.js"),
    import("../js/content/daily/themes.js"),
    import("../js/content/daily/rarities.js"),
    import("../js/content/daily/prep-events.js"),
    import("../js/content/match/sequences.js"),
    import("../js/content/identity/philosophies.js"),
    import("../js/content/traits/index.js"),
    import("../js/content/identity/team-philosophies.js"),
    import("../js/content/match/ambient.js"),
    import("../js/content/daily/day-actions.js"),
    import("../js/content/daily/daily-flavor.js"),
    import("../js/content/daily/opportunities.js"),
    import("../js/content/daily/conflicts.js"),
    import("../js/content/match/injuries.js"),
  ]);
  const Engine = Object.assign({}, ...mods);
  return { Engine, WC_DATA };
}
