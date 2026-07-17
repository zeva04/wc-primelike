/* ============================================================
   Validador del contenido de eventos y acciones (js/content/):
   la LEY del esquema de PREP_EVENTS, RARITIES y DAY_ACTIONS.
   Además APLICA cada efecto contra una run recién nacida y
   verifica invariantes — un typo en un effect no debe descubrirse
   en medio de una partida.
   Uso: node tests/events.validate.js
   ============================================================ */
import { loadEngine } from "./load-engine.js";

const { Engine: E } = await loadEngine();
const { PREP_EVENTS, RANDOM_EVENTS, RARITIES, EVENT_THEMES, DAY_ACTIONS, DAILY_FLAVOR, OPPORTUNITIES } = E;

let fails = 0, checks = 0;
const assert = (cond, msg, ctx) => { checks++; if (!cond) { fails++; console.error("FAIL:", msg, ctx ?? ""); } };

// ---------- RARITIES ----------
const tierIds = Object.keys(RARITIES);
assert(tierIds.length === 4, "hay 4 niveles de rareza");
for (const [id, t] of Object.entries(RARITIES)) {
  assert(typeof t.weight === "number" && t.weight > 0, "peso positivo", id);
  assert(t.label && t.color && t.border, "rareza con label/color/border", id);
}

// ---------- PREP_EVENTS: esquema ----------
assert(PREP_EVENTS.length === 30, `hay 30 eventos (hay ${PREP_EVENTS.length})`);
const ids = new Set();
const perTier = Object.fromEntries(tierIds.map(t => [t, 0]));
const MOD_KEYS = new Set(["entrenar", "recuperar", "tactica"]);
for (const ev of PREP_EVENTS) {
  assert(!ids.has(ev.id), "id único", ev.id); ids.add(ev.id);
  assert(EVENT_THEMES[ev.tema], "tema válido", `${ev.id}: ${ev.tema}`);
  assert(tierIds.includes(ev.rareza), "rareza válida", `${ev.id}: ${ev.rareza}`);
  assert(ev.tipo === "buff" || ev.tipo === "debuff", "tipo buff|debuff", ev.id);
  assert(ev.icon && ev.title && ev.desc, "icon/title/desc presentes", ev.id);
  assert(typeof ev.teaser === "string" && ev.teaser.length > 10, "teaser presente (el Daily lo anticipa)", ev.id);
  assert(typeof ev.effect === "function", "effect es función", ev.id);
  if (ev.mod) {
    assert(ev.mod.desc, "mod con desc para la UI", ev.id);
    const entries = Object.entries(ev.mod.mods || {});
    assert(entries.length > 0, "mod.mods no vacío", ev.id);
    for (const [k, v] of entries) {
      assert(MOD_KEYS.has(k), "clave de mod válida (entrenar|recuperar|tactica)", `${ev.id}: ${k}`);
      assert(typeof v === "number" && v >= 0, "mult numérico ≥ 0", `${ev.id}: ${k}=${v}`);
    }
  }
  perTier[ev.rareza]++;
}
for (const t of tierIds) assert(perTier[t] > 0, "cada rareza tiene al menos un evento", t);
assert(perTier.comun === 10 && perTier.infrecuente === 8 && perTier.rara === 7 && perTier.legendaria === 5,
  "distribución 10/8/7/5 por rareza", JSON.stringify(perTier));

// ---------- PREP_EVENTS: aplicar cada efecto contra una run fresca ----------
const anyPlayable = "BRA";
for (const ev of PREP_EVENTS) {
  const run = E.newRun(anyPlayable);
  let out;
  try { out = ev.effect(run); } catch (e) { assert(false, "effect no debe lanzar", `${ev.id}: ${e.message}`); continue; }
  assert(out === undefined || typeof out === "string", "effect devuelve string (desc) o nada", ev.id);
  for (const p of run.squad) assert(p.energia >= 5 && p.energia <= 100, "energía en rango tras el efecto", `${ev.id}: ${p.name}=${p.energia}`);
  for (const [k, v] of Object.entries(run.buffs)) assert(Number.isFinite(v), "buff numérico finito", `${ev.id}: ${k}=${v}`);
}
// El golpe en la práctica debe descartar exactamente un jugador (con plantel sano)
{
  const run = E.newRun(anyPlayable);
  const golpe = PREP_EVENTS.find(e => e.id === "golpe_practica");
  const desc = golpe.effect(run);
  assert(typeof desc === "string" && run.squad.filter(p => p.lesionadoPartidos === 1).length === 1,
    "golpe_practica descarta exactamente 1 jugador y devuelve desc con protagonista");
}

// ---------- DAY_ACTIONS ----------
const aids = new Set();
for (const a of DAY_ACTIONS) {
  assert(!aids.has(a.id), "id de acción único", a.id); aids.add(a.id);
  assert(typeof a.effect === "function" && a.icon && a.title && a.desc, "acción completa", a.id);
}

// ---------- OPPORTUNITIES: esquema y efectos ----------
// Sin `tema` ni `teaser` a propósito: ni el calendario ni el Daily las anticipan.
assert(OPPORTUNITIES.length === 19, `hay 19 oportunidades (hay ${OPPORTUNITIES.length})`);
const perTierOpp = Object.fromEntries(tierIds.map(t => [t, 0]));
for (const o of OPPORTUNITIES) {
  assert(!ids.has(o.id), "id de oportunidad único (tampoco choca con eventos)", o.id); ids.add(o.id);
  assert(!aids.has(o.id), "id de oportunidad no choca con DAY_ACTIONS (comparten puerta en applyDayAction)", o.id);
  assert(tierIds.includes(o.rareza), "rareza válida", `${o.id}: ${o.rareza}`);
  assert(o.icon && o.title && o.desc, "icon/title/desc presentes", o.id);
  assert(o.tema === undefined && o.teaser === undefined, "oportunidad sin tema ni teaser (no se anticipa)", o.id);
  assert(typeof o.effect === "function", "effect es función", o.id);
  const run = E.newRun(anyPlayable);
  let out, target = null;
  if (o.choose) {
    assert(typeof o.choose.label === "string" && o.choose.label.length > 5, "choose con label para la UI", o.id);
    assert(typeof o.choose.candidates === "function", "choose.candidates es función", o.id);
    const cands = o.choose.candidates(run);
    assert(Array.isArray(cands) && cands.length > 0, "candidatos no vacíos en una run fresca", o.id);
    assert(cands.every(p => run.squad.includes(p)), "todos los candidatos son del plantel", o.id);
    target = cands[0];
  }
  try { out = o.effect(run, target); } catch (e) { assert(false, "effect no debe lanzar", `${o.id}: ${e.message}`); continue; }
  assert(out === undefined || typeof out === "string", "effect devuelve string (desc) o nada", o.id);
  for (const p of run.squad) {
    assert(p.energia >= 5 && p.energia <= 100, "energía en rango tras la oportunidad", `${o.id}: ${p.name}=${p.energia}`);
    for (const [k, v] of Object.entries(p.stats)) assert(v >= 1 && v <= 99, "stat en rango 1-99 (mejoras permanentes)", `${o.id}: ${p.name}.${k}=${v}`);
  }
  for (const [k, v] of Object.entries(run.buffs)) assert(typeof v === "boolean" || Number.isFinite(v), "buff numérico finito (o flag)", `${o.id}: ${k}=${v}`);
  perTierOpp[o.rareza]++;
}
assert(perTierOpp.comun === 5 && perTierOpp.infrecuente === 7 && perTierOpp.rara === 5 && perTierOpp.legendaria === 2,
  "distribución 5/7/5/2 por rareza (elección del PO)", JSON.stringify(perTierOpp));

// ---------- ciclo de vida de la Oportunidad (H1, decisiones PO 16-jul) ----------
{
  // Tomarla consume la Acción del Día, escribe el diario y NO se escala por el modificador del día
  const run = E.newRun(anyPlayable);
  const o = OPPORTUNITIES[0];
  run.dayOpp = { id: o.id };
  run.dayMod = { icon: "🏋️", title: "Doble turno de trabajo", desc: "Entrenar rinde ×2 hoy", mods: { entrenar: 2, [o.id]: 0 } };
  assert(E.dayOpportunity(run) === o, "dayOpportunity devuelve la fila viva");
  const journalBefore = run.journal.length;
  const res = E.applyDayAction(run, o.id);
  assert(res && res.mult === 1, "la oportunidad se aplica con mult 1 aunque haya modificador del día");
  assert(!run.actionPending, "tomar la oportunidad consume el turno del día");
  assert(run.journal.length === journalBefore + 1 && run.journal.at(-1).desc.startsWith("Oportunidad única:"),
    "tomarla escribe en el diario como oportunidad");
  assert(E.applyDayAction(run, o.id) === null, "no se puede tomar dos veces (turno consumido)");
}
{
  // Sin oportunidad viva, su id no es una acción válida (no se puede invocar de la nada)
  const run = E.newRun(anyPlayable);
  run.dayOpp = null;
  assert(E.dayOpportunity(run) === null, "sin dayOpp no hay oportunidad viva");
  assert(E.applyDayAction(run, OPPORTUNITIES[0].id) === null, "una oportunidad no viva no se puede aplicar");
}
{
  // Oportunidad con elección de jugador: sin objetivo (o con uno inválido) NO se
  // aplica ni consume el turno; con un candidato válido sí, y el desc lo protagoniza
  const run = E.newRun(anyPlayable);
  const o = OPPORTUNITIES.find(x => x.choose);
  run.dayOpp = { id: o.id };
  assert(E.applyDayAction(run, o.id) === null, "con choose y sin objetivo no se aplica");
  assert(E.applyDayAction(run, o.id, "Nadie Con Este Nombre") === null, "un objetivo fuera de los candidatos no se aplica");
  assert(run.actionPending, "los intentos inválidos no consumen el turno");
  const cand = o.choose.candidates(run)[0];
  const res = E.applyDayAction(run, o.id, cand.name);
  assert(res && typeof res.desc === "string" && res.desc.includes(cand.name), "con objetivo válido se aplica y el desc lo protagoniza");
  assert(!run.actionPending, "tomarla consume el turno");
}

// ---------- DAILY_FLAVOR: titulares de color del World Cup Daily ----------
assert(DAILY_FLAVOR.length >= 8, "hay al menos 8 titulares de color", DAILY_FLAVOR.length);
for (const f of DAILY_FLAVOR) {
  assert(typeof f.icon === "string" && f.icon && typeof f.text === "string" && f.text.length > 10, "flavor con icon y texto", JSON.stringify(f));
}

// ---------- RANDOM_EVENTS siguen sanos (esquema mínimo) ----------
for (const ev of RANDOM_EVENTS) {
  assert(EVENT_THEMES[ev.tema], "conflicto con tema válido", ev.id);
  assert(Array.isArray(ev.options) && ev.options.length >= 2, "conflicto con ≥2 opciones", ev.id);
  assert(typeof ev.teaser === "string" && ev.teaser.length > 10, "conflicto con teaser", ev.id);
}

console.log(`events.validate: ${checks} checks · ${PREP_EVENTS.length} eventos (${tierIds.map(t => `${perTier[t]} ${t}`).join(" · ")})`);
console.log(fails ? "❌ contenido con fallos" : "✅ contenido OK");
process.exit(fails ? 1 : 0);
