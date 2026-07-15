/* ============================================================
   game/calendar — el tiempo de la run (Game Vision: el día es
   la unidad principal de planificación).
   ============================================================ */
import { rnd, ri, shuffle } from "../core/rng.js";
import { PREP_EVENTS } from "../content/prep-events.js";
import { RANDOM_EVENTS } from "../content/conflicts.js";
import { addJournal } from "./journal.js";

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
 * Agenda el próximo partido a 5-6 días y pre-sortea el evento de cada día intermedio
 * (75% evento inevitable / 25% conflicto con decisión), sin repetir el mismo evento
 * dentro de la ventana (3 "lluvias" seguidas aburren y castigan de más). El plan guarda
 * el evento completo pero el calendario solo muestra su TEMÁTICA: el detalle se
 * descubre al vivir el día.
 */
export function scheduleNextMatch(run) {
  run.nextMatchDay = run.day + ri(5, 6);
  run.dayPlan = {};
  const pools = { evento: shuffle(PREP_EVENTS), conflicto: shuffle(RANDOM_EVENTS) };
  for (let d = run.day + 1; d < run.nextMatchDay; d++) {
    const kind = rnd() < CONFLICT_CHANCE && pools.conflicto.length ? "conflicto" : "evento";
    const ev = pools[kind].pop();
    run.dayPlan[d] = { kind, id: ev.id, tema: ev.tema };
  }
}

/**
 * Pasa al día siguiente y resuelve lo que trae:
 *  - {type:"match"}      llegó el día de partido (sin evento: los días de partido son sagrados)
 *  - {type:"evento", …}  evento inevitable YA APLICADO, con sus datos para mostrarlo
 *  - {type:"conflicto", …} dilema pendiente: la UI muestra las opciones y aplica el effect elegido
 * Devuelve null si ya es día de partido (no se puede pasar el día sin jugarlo).
 */
export function advanceDay(run) {
  if (run.day >= run.nextMatchDay) return null;
  run.day++;
  if (run.day >= run.nextMatchDay) return { type: "match" };
  const plan = run.dayPlan[run.day];
  if (!plan) return { type: "match" }; // no debería ocurrir: todo día intermedio tiene plan
  if (plan.kind === "evento") {
    const ev = PREP_EVENTS.find(e => e.id === plan.id);
    ev.effect(run);
    addJournal(run, { icon: ev.icon, title: ev.title, desc: ev.desc, tone: ev.tipo === "buff" ? "good" : "bad" });
    return { type: "evento", tema: ev.tema, icon: ev.icon, title: ev.title, tipo: ev.tipo, desc: ev.desc };
  }
  const ev = RANDOM_EVENTS.find(e => e.id === plan.id);
  const text = typeof ev.text === "function" ? ev.text(run) : ev.text;
  return { type: "conflicto", tema: ev.tema, id: ev.id, icon: ev.icon, title: ev.title, text, options: ev.options };
}
