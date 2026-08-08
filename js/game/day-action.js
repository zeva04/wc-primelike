/* ============================================================
   game/day-action — la regla de la Acción Principal del Día
   (Core Gameplay Bible §4.7). El estado `run.actionPending` lo
   levanta calendar al llegar a un día sin partido y lo baja
   este módulo al aplicar la acción elegida. La tabla de
   acciones vive en content/daily/day-actions.js.

   Los eventos pueden MODIFICAR las acciones de hoy vía
   `run.dayMod`: `actionMult` resuelve el
   multiplicador de cada acción (0 = bloqueada hoy).

   La Oportunidad del día (run.dayOpp, escribe calendar) se
   consume por esta MISMA puerta: es una acción más que compite
   con las de siempre, con dos diferencias — el modificador del
   día no la toca y su rareza colorea el diario.
   ============================================================ */
import { clamp } from "../core/math.js";
import { DAY_ACTIONS, CANJE_THRESHOLD, CANJE_PERMANENT, CANJEABLE_STATS, STAT_LABELS } from "../content/daily/day-actions.js";
import { OPPORTUNITIES } from "../content/daily/opportunities.js";
import { addJournal } from "./journal.js";
import { noteFiloMilestones } from "./philosophy.js";
import { trackOxidacion } from "./oxidation.js";

/** La Oportunidad viva HOY (fila completa de content/opportunities) o null. */
export function dayOpportunity(run) {
  return run.dayOpp ? OPPORTUNITIES.find(o => o.id === run.dayOpp.id) || null : null;
}

/**
 * Stats cuyo buff acumulado para el próximo partido ya llega al umbral de canje
 * (CANJE_THRESHOLD): `[{key, buff, label, alcance}]` listas para convertir en
 * crecimiento permanente. `alcance` = cuántos jugadores del plantel tienen esa stat
 * (a quiénes alcanzaría el +CANJE_PERMANENT: atajadas solo a los arqueros, etc.).
 * Vacío si ninguna llegó. Solo stats reales; los buffs de tactica/penales no cuentan.
 */
export function canjeableBuffs(run) {
  return CANJEABLE_STATS
    .filter(k => (run.buffs[k] || 0) >= CANJE_THRESHOLD)
    .map(k => ({ key: k, buff: run.buffs[k], label: STAT_LABELS[k], alcance: run.squad.filter(p => p.stats[k] !== undefined).length }));
}

/**
 * Canjea el boost de entrenamiento de una stat por crecimiento PERMANENTE (Bible cap.6,
 * "Permanent Growth"): descuenta CANJE_THRESHOLD del buff del próximo partido y suma
 * +CANJE_PERMANENT PERMANENTE a esa stat en cada jugador del plantel que la tenga (los de
 * campo no tienen atajadas/reflejos/salidas: no los toca). El crecimiento nunca decrece y
 * respeta el techo de 99. Es GRATIS: no consume la Acción del Día (ya se pagó con los días
 * de Entrenar). Escribe squad[].stats — mismo caño que usan medical y los efectos de
 * content/; si la progresión crece (equipo, cuerpo técnico), se muda a
 * game/progression.js. Devuelve {key, label, permanent, alcance, jugadores} para el toast y
 * el diario, o null si esa stat no llegaba al umbral (la UI no debería ofrecerlo).
 */
export function canjeBuff(run, key) {
  if (!CANJEABLE_STATS.includes(key) || (run.buffs[key] || 0) < CANJE_THRESHOLD) return null;
  run.buffs[key] -= CANJE_THRESHOLD;
  if (run.buffs[key] === 0) delete run.buffs[key];
  const jugadores = run.squad.filter(p => p.stats[key] !== undefined);
  for (const p of jugadores) p.stats[key] = clamp(p.stats[key] + CANJE_PERMANENT, 1, 99);
  const label = STAT_LABELS[key];
  addJournal(run, {
    icon: "✨", tone: "gold", title: "El entrenamiento dio frutos permanentes",
    desc: `El plantel convirtió el trabajo de la cancha en crecimiento: +${CANJE_PERMANENT} de ${label} PERMANENTE para ${jugadores.length} jugador${jugadores.length > 1 ? "es" : ""} (el resto de la run).`,
  });
  return { key, label, permanent: CANJE_PERMANENT, alcance: jugadores.length, jugadores: jugadores.map(p => p.name) };
}

/** Lo que un día de trabajo de cancha resetea (Entrenar y Táctica); ver oxidation.js. */
const esTrabajo = a => a.group === "entrenar" || a.group === "tactica";

/**
 * PROYECTA una Acción del Día sin ejecutarla: devuelve la acción más `sim`, que es
 * el run TAL COMO QUEDARÍA si el DT confirmara. La hoja de confirmación del hub
 * (ui/screens/hub/confirm) pinta el antes/después leyendo `run` y `sim` con las
 * mismas funciones — así la promesa no puede diferir de lo que después pasa.
 *
 * Cómo se calcula: clonando el run y corriendo el EFECTO REAL de la acción encima.
 * Nadie reimplementa la fórmula, así que los clamps (la energía tope 100, la moral
 * 1..100) y el multiplicador del día entran solos. `tests/day-action.test` fija la
 * igualdad preview == aplicar de verdad.
 *
 * `sim` es de SOLO LECTURA y descartable: no se guarda ni se devuelve al juego.
 *
 * OJO — solo para DAY_ACTIONS, y la Oportunidad del día queda AFUERA a propósito.
 * Proyectar exige que el efecto sea determinista: `rng` es un módulo global (core/rng,
 * ÚNICO punto de azar), así que un efecto que sortee algo desplazaría la secuencia de
 * la run de verdad con solo mirarlo. Las acciones del complejo lo son por construcción
 * (suman, restan y clampean). Las oportunidades hoy también, pero nada las obliga: su
 * contrato permite cualquier `effect`, y ningún test lo prohíbe. Si alguna vez la
 * Oportunidad quiere su hoja, primero hay que fijar esa regla.
 *
 * Devuelve null en los mismos casos en que `applyDayAction` no haría nada: sin
 * acción pendiente, id desconocido o acción bloqueada por el día.
 */
export function previewDayAction(run, actionId) {
  if (!run.actionPending) return null;
  const a = DAY_ACTIONS.find(x => x.id === actionId);
  if (!a) return null;
  const mult = actionMult(run, a);
  if (mult === 0) return null;
  const sim = structuredClone(run);
  a.effect(sim, mult);
  trackOxidacion(sim, esTrabajo(a));    // el ritmo también se mueve: es parte de lo que cuesta el día
  return { ...a, mult, sim };
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
  run.lastAction = { day: run.day, id: a.id, group: a.group || null, icon: a.icon, title: a.title };
  addJournal(run, isOpp
    ? { icon: a.icon, tone: a.rareza === "legendaria" ? "gold" : "good", title: a.title, desc: `Oportunidad única: ${desc}` }
    : { icon: a.icon, tone: "neutral", title: a.title, desc: `Acción del día: ${desc}${mult !== 1 ? ` (${multLabel(mult)} por "${run.dayMod.title}")` : ""}.` });
  noteFiloMilestones(run); // un evento pudo cruzar un umbral de identidad: la conquista se narra
  // Oxidación: solo el trabajo de cancha resetea la racha — Entrenar y Táctica.
  // Todo lo demás (Recuperar, Bonding, Oportunidades) es un día sin entrenar.
  trackOxidacion(run, esTrabajo(a));
  return { ...a, mult, desc };
}
