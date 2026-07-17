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
    import("../js/game/run.js"),
    import("../js/game/flow.js"),
    import("../js/game/calendar.js"),
    import("../js/game/daily.js"),
    import("../js/game/day-action.js"),
    import("../js/game/discipline.js"),
    import("../js/game/medical.js"),
    import("../js/game/journal.js"),
    import("../js/game/tournament/sim.js"),
    import("../js/game/tournament/groups.js"),
    import("../js/game/tournament/knockout.js"),
    import("../js/game/tournament/world.js"),
    import("../js/game/match/Match.js"),
    import("../js/game/match/powers.js"),
    import("../js/content/themes.js"),
    import("../js/content/rarities.js"),
    import("../js/content/prep-events.js"),
    import("../js/content/day-actions.js"),
    import("../js/content/daily-flavor.js"),
    import("../js/content/conflicts.js"),
    import("../js/content/injuries.js"),
  ]);
  const Engine = Object.assign({}, ...mods);
  return { Engine, WC_DATA };
}
