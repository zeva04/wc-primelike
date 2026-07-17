/* ============================================================
   game/day-action — la regla de la Acción Principal del Día
   (Core Gameplay Bible §4.7). El estado `run.actionPending` lo
   levanta calendar al llegar a un día sin partido y lo baja
   este módulo al aplicar la acción elegida. La tabla de
   acciones vive en content/day-actions.js.

   Los eventos pueden MODIFICAR las acciones de hoy vía
   `run.dayMod` (Bible §4.5): `actionMult` resuelve el
   multiplicador de cada acción (0 = bloqueada hoy).

   La Oportunidad del día (run.dayOpp, escribe calendar) se
   consume por esta MISMA puerta: es una acción más que compite
   con las de siempre, con dos diferencias — el modificador del
   día no la toca (decisión PO: es un premio externo, no una
   acción del club) y su rareza colorea el diario.
   ============================================================ */
import { DAY_ACTIONS } from "../content/day-actions.js";
import { OPPORTUNITIES } from "../content/opportunities.js";
import { addJournal } from "./journal.js";

/** La Oportunidad viva HOY (fila completa de content/opportunities) o null. */
export function dayOpportunity(run) {
  return run.dayOpp ? OPPORTUNITIES.find(o => o.id === run.dayOpp.id) || null : null;
}

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
 * Aplica la acción del día elegida por el DT — una de DAY_ACTIONS o la
 * Oportunidad viva hoy: efecto (escalado por el modificador del día; la
 * oportunidad NO se escala), diario y consumo del turno. Si la oportunidad
 * trae `choose`, exige `targetName` (nombre, §3.1: los jugadores cruzan
 * fronteras por nombre) y lo valida contra sus candidatos — sin objetivo
 * válido no se aplica NI se consume el turno. Devuelve la acción más
 * `{mult, desc}` para el toast (`desc` puede traer protagonista), o null
 * si no hay acción pendiente, el id no existe, la acción está bloqueada
 * hoy o faltó el objetivo — la UI no debería permitir ninguno.
 */
export function applyDayAction(run, actionId, targetName) {
  if (!run.actionPending) return null;
  const opp = dayOpportunity(run);
  const isOpp = !!opp && opp.id === actionId;
  const a = isOpp ? opp : DAY_ACTIONS.find(x => x.id === actionId);
  if (!a) return null;
  let target = null;
  if (isOpp && a.choose) {
    target = a.choose.candidates(run).find(p => p.name === targetName) || null;
    if (!target) return null;
  }
  const mult = isOpp ? 1 : actionMult(run, a);
  if (mult === 0) return null;
  const desc = (isOpp ? a.effect(run, target) : a.effect(run, mult)) || a.desc;
  if (isOpp) run.stats.oppAprovechadas++;
  run.actionPending = false;
  run.lastAction = { day: run.day, icon: a.icon, title: a.title };
  addJournal(run, isOpp
    ? { icon: a.icon, tone: a.rareza === "legendaria" ? "gold" : "good", title: a.title, desc: `Oportunidad única: ${desc}` }
    : { icon: a.icon, tone: "neutral", title: a.title, desc: `Acción del día: ${desc}${mult !== 1 ? ` (${multLabel(mult)} por "${run.dayMod.title}")` : ""}.` });
  return { ...a, mult, desc };
}
