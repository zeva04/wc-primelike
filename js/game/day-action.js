/* ============================================================
   game/day-action — la regla de la Acción Principal del Día
   (Core Gameplay Bible §4.7). El estado `run.actionPending` lo
   levanta calendar al llegar a un día sin partido y lo baja
   este módulo al aplicar la acción elegida. La tabla de
   acciones vive en content/day-actions.js.

   Los eventos pueden MODIFICAR las acciones de hoy vía
   `run.dayMod` (Bible §4.5): `actionMult` resuelve el
   multiplicador de cada acción (0 = bloqueada hoy).
   ============================================================ */
import { DAY_ACTIONS } from "../content/day-actions.js";
import { addJournal } from "./journal.js";

/** Multiplicador de una acción HOY según el modificador del día (1 si no hay; 0 = bloqueada). */
export function actionMult(run, action) {
  const m = run.dayMod?.mods?.[action.group || action.id];
  return m === undefined ? 1 : m;
}

/** Etiqueta corta de un multiplicador para la UI ("×2", "×½"); "" si es 1 o bloqueo. */
export function multLabel(mult) {
  if (mult === 1 || mult === 0) return "";
  return mult === 0.5 ? "×½" : `×${mult}`;
}

/**
 * Aplica la acción del día elegida por el DT: efecto (escalado por el
 * modificador del día), diario y consumo del turno. Devuelve la acción
 * más `{mult}` para el toast, o null si no hay acción pendiente, el id
 * no existe o la acción está bloqueada hoy — la UI no debería permitir
 * ninguno de los tres casos.
 */
export function applyDayAction(run, actionId) {
  if (!run.actionPending) return null;
  const a = DAY_ACTIONS.find(x => x.id === actionId);
  if (!a) return null;
  const mult = actionMult(run, a);
  if (mult === 0) return null;
  a.effect(run, mult);
  run.actionPending = false;
  run.lastAction = { day: run.day, icon: a.icon, title: a.title };
  addJournal(run, { icon: a.icon, tone: "neutral", title: a.title, desc: `Acción del día: ${a.desc}${mult !== 1 ? ` (${multLabel(mult)} por "${run.dayMod.title}")` : ""}.` });
  return { ...a, mult };
}
