/* ============================================================
   game/calendar — el tiempo de la run (Game Vision: el día es
   la unidad principal de planificación).
   ============================================================ */
import { rnd, ri, shuffle } from "../core/rng.js";
import { PREP_EVENTS } from "../content/prep-events.js";
import { RANDOM_EVENTS } from "../content/conflicts.js";
import { RARITIES } from "../content/rarities.js";
import { addJournal } from "./journal.js";
import { playWorldDay } from "./tournament/world.js";

// Día 1 = 11 de junio de 2026, arranque real del Mundial. Las fechas son ambientación:
// la run avanza por días propios y dura ~38 días, casi calzando con el torneo real.
const TOURNAMENT_START_UTC = Date.UTC(2026, 5, 11);
const DOW = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];
const MES = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];

/** Etiqueta corta de un día de la run con su fecha real ("Jue 11 jun"). */
export function dayLabel(day) {
  const d = new Date(TOURNAMENT_START_UTC + (day - 1) * 86400000);
  return `${DOW[d.getUTCDay()]} ${d.getUTCDate()} ${MES[d.getUTCMonth()]}`;
}

// Probabilidad de que el evento de un día sea un conflicto con decisión (vs evento inevitable)
const CONFLICT_CHANCE = 0.25;

/**
 * Sortea un evento inevitable por RAREZA: primero el nivel (ponderado por
 * RARITIES.weight, renormalizado entre los niveles que aún tienen eventos sin
 * usar en la ventana) y después un evento de ese nivel. Los pools llegan ya
 * barajados, así que `pop()` es un evento al azar del nivel.
 */
function drawPrepEvent(pools) {
  const tiers = Object.keys(RARITIES).filter(t => pools[t].length);
  let r = rnd() * tiers.reduce((s, t) => s + RARITIES[t].weight, 0);
  for (const t of tiers) { r -= RARITIES[t].weight; if (r <= 0) return pools[t].pop(); }
  return pools[tiers[tiers.length - 1]].pop();
}

/**
 * Agenda el próximo partido a 5-6 días y pre-sortea el evento de cada día intermedio
 * (75% evento inevitable — ponderado por rareza — / 25% conflicto con decisión), sin
 * repetir el mismo evento dentro de la ventana (3 "lluvias" seguidas aburren y castigan
 * de más). El plan guarda el evento completo pero el calendario solo muestra su
 * TEMÁTICA: el detalle (y su rareza) se descubre al vivir el día.
 */
export function scheduleNextMatch(run) {
  run.nextMatchDay = run.day + ri(5, 6);
  run.dayPlan = {};
  const eventPools = {};
  for (const t of Object.keys(RARITIES)) eventPools[t] = shuffle(PREP_EVENTS.filter(e => e.rareza === t));
  const conflictPool = shuffle(RANDOM_EVENTS);
  for (let d = run.day + 1; d < run.nextMatchDay; d++) {
    const kind = rnd() < CONFLICT_CHANCE && conflictPool.length ? "conflicto" : "evento";
    const ev = kind === "conflicto" ? conflictPool.pop() : drawPrepEvent(eventPools);
    run.dayPlan[d] = { kind, id: ev.id, tema: ev.tema };
  }
}

/**
 * Pasa al día siguiente y resuelve lo que trae:
 *  - {type:"match"}      llegó el día de partido (sin evento ni acción: los días de partido son sagrados)
 *  - {type:"evento", …}  evento inevitable YA APLICADO, con sus datos para mostrarlo
 *  - {type:"conflicto", …} dilema pendiente: la UI muestra las opciones y aplica el effect elegido
 * Todo día sin partido deja además una Acción del Día pendiente (Bible §4.7): el evento
 * cambia el contexto, DESPUÉS el DT decide su inversión del día (game/day-action.js).
 * Si el evento trae `mod`, queda en `run.dayMod` y modifica las acciones SOLO hoy
 * (Bible §4.5: los eventos cambian el problema del día, no solo los números).
 * Devuelve null si ya es día de partido (no se puede pasar el día sin jugarlo).
 */
export function advanceDay(run) {
  if (run.day >= run.nextMatchDay) return null;
  run.day++;
  run.dayMod = null; // los modificadores duran exactamente un día
  playWorldDay(run); // "anoche" el resto del Mundial jugó lo suyo (run.lastNight → Daily)
  if (run.day >= run.nextMatchDay) { run.actionPending = false; return { type: "match" }; }
  run.actionPending = true;
  const plan = run.dayPlan[run.day];
  if (!plan) { run.actionPending = false; return { type: "match" }; } // no debería ocurrir: todo día intermedio tiene plan
  if (plan.kind === "evento") {
    const ev = PREP_EVENTS.find(e => e.id === plan.id);
    const desc = ev.effect(run) || ev.desc; // el efecto puede devolver un desc con protagonista
    if (ev.mod) run.dayMod = { icon: ev.icon, title: ev.title, desc: ev.mod.desc, mods: ev.mod.mods };
    const tone = ev.rareza === "legendaria" ? "gold" : ev.tipo === "buff" ? "good" : "bad";
    addJournal(run, { icon: ev.icon, title: ev.title, desc, tone });
    return { type: "evento", tema: ev.tema, icon: ev.icon, title: ev.title, tipo: ev.tipo, rareza: ev.rareza, desc };
  }
  const ev = RANDOM_EVENTS.find(e => e.id === plan.id);
  const text = typeof ev.text === "function" ? ev.text(run) : ev.text;
  return { type: "conflicto", tema: ev.tema, id: ev.id, icon: ev.icon, title: ev.title, text, options: ev.options };
}
