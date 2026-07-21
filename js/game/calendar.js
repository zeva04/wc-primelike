/* ============================================================
   game/calendar — el tiempo de la run (Game Vision: el día es
   la unidad principal de planificación).
   ============================================================ */
import { rnd, ri, shuffle } from "../core/rng.js";
import { PREP_EVENTS } from "../content/prep-events.js";
import { RANDOM_EVENTS } from "../content/conflicts.js";
import { OPPORTUNITIES } from "../content/opportunities.js";
import { RARITIES } from "../content/rarities.js";
import { addJournal } from "./journal.js";
import { applyDailyRecovery } from "./medical.js";
import { moraleBand, MORAL_INICIAL } from "./morale.js";
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

// Probabilidad BASE de que el evento de un día sea un conflicto con decisión (vs evento
// inevitable). Es el valor de la banda anímica "estable"; la Moral la modula (ver abajo).
export const CONFLICT_CHANCE = 0.25;

// SPRINT 2 — Moral con mordida (decisión PO 20-jul-2026): la Moral del equipo modula la
// FRECUENCIA de conflictos de vestuario de la ventana, simétrica alrededor del 0.25 base —
// un vestuario feliz vive semanas tranquilas (menos incendios), uno hundido se llena de
// dilemas. Es el efecto AUTO-CORRECTIVO elegido por el PO: muerde cuando ya vas mal, no
// premia al favorito con más poder (a diferencia de acoplar la Moral al Momento o la
// energía). Sin tocar el motor del partido: se lee `run.moral` al AGENDAR la ventana, que
// ocurre en postMatchUpdate, cuando la moral ya trae el resultado del último partido.
export const CONFLICT_CHANCE_BY_BAND = { nubes: 0.12, alta: 0.18, estable: 0.25, baja: 0.34, suelo: 0.42 };

/** Probabilidad de conflicto de un día según la banda de moral del equipo (Sprint 2). */
export function conflictChanceFor(moral) { return CONFLICT_CHANCE_BY_BAND[moraleBand(moral ?? MORAL_INICIAL).id]; }
// Probabilidad de que un día libre traiga además una Oportunidad (Bible §4.5);
// el tope de 1 por ventana lo aplica scheduleNextMatch cortando en el primer acierto.
const OPPORTUNITY_CHANCE = 0.20;

/**
 * Sortea del pool por RAREZA: primero el nivel (ponderado por RARITIES.weight,
 * renormalizado entre los niveles que aún tienen entradas sin usar en la
 * ventana) y después una entrada de ese nivel. Los pools llegan ya barajados,
 * así que `pop()` es una entrada al azar del nivel. Lo usan los eventos
 * inevitables y las oportunidades.
 */
function drawByRarity(pools) {
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
 * Además, a lo sumo UN día libre de la ventana esconde una Oportunidad (`opp`):
 * cada día tira OPPORTUNITY_CHANCE y el primero que acierta se la lleva. El
 * calendario no la muestra — se descubre al llegar el día (decisión del PO).
 */
export function scheduleNextMatch(run) {
  // Primer día de esta ventana de preparación: hoy en el arranque (aún no hubo partido),
  // o el día siguiente al partido recién jugado. El calendario lo usa para mantener los
  // días ya vividos a la vista (en gris) en vez de borrarlos al pasar el día.
  run.windowStart = run.nextMatchDay == null ? run.day : run.day + 1;
  run.nextMatchDay = run.day + ri(5, 6);
  run.dayPlan = {};
  const eventPools = {};
  for (const t of Object.keys(RARITIES)) eventPools[t] = shuffle(PREP_EVENTS.filter(e => e.rareza === t));
  const conflictPool = shuffle(RANDOM_EVENTS);
  // La Moral del equipo (post-partido) fija la turbulencia de TODA la ventana (Sprint 2).
  const conflictChance = conflictChanceFor(run.moral);
  for (let d = run.day + 1; d < run.nextMatchDay; d++) {
    const kind = rnd() < conflictChance && conflictPool.length ? "conflicto" : "evento";
    const ev = kind === "conflicto" ? conflictPool.pop() : drawByRarity(eventPools);
    run.dayPlan[d] = { kind, id: ev.id, tema: ev.tema };
  }
  const oppPools = {};
  for (const t of Object.keys(RARITIES)) oppPools[t] = shuffle(OPPORTUNITIES.filter(o => o.rareza === t));
  for (let d = run.day + 1; d < run.nextMatchDay; d++) {
    if (rnd() >= OPPORTUNITY_CHANCE) continue;
    const opp = drawByRarity(oppPools);
    if (opp) run.dayPlan[d].opp = opp.id;
    break; // tope: 1 oportunidad por ventana
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
 * Si el plan del día esconde una Oportunidad, queda viva en `run.dayOpp` — la de
 * ayer expira SIN rastro (rechazo silencioso: el silencio es el costo).
 * Devuelve null si ya es día de partido (no se puede pasar el día sin jugarlo).
 */
export function advanceDay(run) {
  if (run.day >= run.nextMatchDay) return null;
  run.day++;
  run.dayMod = null; // los modificadores duran exactamente un día
  run.dayOpp = null; // la oportunidad no tomada ayer se perdió para siempre
  playWorldDay(run); // "anoche" el resto del Mundial jugó lo suyo (run.lastNight → Daily)
  if (run.day >= run.nextMatchDay) { run.actionPending = false; return { type: "match" }; }
  run.actionPending = true;
  applyDailyRecovery(run); // descanso pasivo del día de preparación (medical)
  const plan = run.dayPlan[run.day];
  if (!plan) { run.actionPending = false; return { type: "match" }; } // no debería ocurrir: todo día intermedio tiene plan
  if (plan.opp) { run.dayOpp = { id: plan.opp }; run.stats.oppOfrecidas++; } // la cuenta final revela las que dejaste pasar
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
