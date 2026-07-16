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
const { PREP_EVENTS, RANDOM_EVENTS, RARITIES, EVENT_THEMES, DAY_ACTIONS } = E;

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

// ---------- RANDOM_EVENTS siguen sanos (esquema mínimo) ----------
for (const ev of RANDOM_EVENTS) {
  assert(EVENT_THEMES[ev.tema], "conflicto con tema válido", ev.id);
  assert(Array.isArray(ev.options) && ev.options.length >= 2, "conflicto con ≥2 opciones", ev.id);
}

console.log(`events.validate: ${checks} checks · ${PREP_EVENTS.length} eventos (${tierIds.map(t => `${perTier[t]} ${t}`).join(" · ")})`);
console.log(fails ? "❌ contenido con fallos" : "✅ contenido OK");
process.exit(fails ? 1 : 0);
