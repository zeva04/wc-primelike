/* ============================================================
   Validador de data/teams.js — LA LEY EJECUTABLE del esquema.
   (La cabecera de teams.js dice "2 POR/3 DEF/3 MED/2 DEL": quedó
   obsoleta; el PO decidió el 15-jul-2026 que la distribución de
   los planteles es diseño libre. Manda este validador.)

   ERRORES (rompen el juego o son typos):
   - ids únicos (3 letras), confed válida, iso con bandera PNG real
   - exactamente 48 clasificados (formato Mundial 2026; newRun lo exige)
   - jugables: colors + kits completos, ≥6 jugadores y ≥1 por posición
     (mínimo para armar el 6v6), stats correctas por posición (1-99),
     dorsales únicos 1-26 (el 1 solo en arqueros), look válido
   - rivales: rating 1-99, kit, 5 figuras con las 4 posiciones cubiertas

   ADVERTENCIAS (no bloquean, decisión del PO):
   - huella de sprite duplicada en un equipo (dos jugadores idénticos)

   Uso: node tests/teams.validate.js
   ============================================================ */
import fs from "node:fs";
import path from "node:path";
import { loadEngine, ROOT } from "./load-engine.js";

const { WC_DATA } = await loadEngine();
const teams = WC_DATA.teams;

let fails = 0, warns = 0;
const fail = (msg) => { fails++; console.error("  ❌", msg); };
const warn = (msg) => { warns++; console.warn("  ⚠️", msg); };

const CONFEDS = new Set(["UEFA", "CONMEBOL", "CONCACAF", "CAF", "AFC", "OFC"]);
const STYLES = new Set(["short", "buzz", "curly", "long", "bun", "bald"]);
const FIELD_STATS = ["tiro", "defensa", "cabezazo", "pase", "aura"];
const GK_STATS = ["atajadas", "reflejos", "salidas", "pase", "aura"];
const POSITIONS = ["POR", "DEF", "MED", "DEL"];
const HEX = /^#[0-9A-Fa-f]{6}$/;

// ---------- Colección completa ----------
const ids = new Set();
for (const t of teams) {
  if (!/^[A-Z]{3}$/.test(t.id)) fail(`${t.id}: id debe ser 3 letras mayúsculas`);
  if (ids.has(t.id)) fail(`${t.id}: id duplicado`);
  ids.add(t.id);
  if (!t.name) fail(`${t.id}: sin name`);
  if (!CONFEDS.has(t.confed)) fail(`${t.id}: confed inválida "${t.confed}"`);
  if (!t.iso) fail(`${t.id}: sin iso`);
  else if (!fs.existsSync(path.join(ROOT, "data", "flags", `${t.iso}.png`))) {
    fail(`${t.id}: falta la bandera data/flags/${t.iso}.png`);
  }
}

const qualified = teams.filter(t => t.qualified !== false);
if (qualified.length !== 48) {
  fail(`clasificados: hay ${qualified.length}, el Mundial 2026 exige exactamente 48 (newRun lanza error con menos)`);
}

// ---------- Jugables ----------
const playables = teams.filter(t => t.playable);
for (const t of playables) {
  const tag = `${t.id} (jugable)`;
  for (const k of ["primary", "secondary", "text"]) {
    if (!t.colors || !HEX.test(t.colors[k] || "")) fail(`${tag}: colors.${k} inválido`);
  }
  for (const kit of ["field", "gk"]) {
    const K = t.kits && t.kits[kit];
    if (!K || !HEX.test(K.shirt || "") || !HEX.test(K.accent || "")) fail(`${tag}: kits.${kit} incompleto`);
  }
  if (!Array.isArray(t.players)) { fail(`${tag}: sin players`); continue; }

  // Distribución libre (diseño del PO). Mínimo duro: poder armar el 6v6.
  if (t.players.length < 6) fail(`${tag}: ${t.players.length} jugadores (se necesitan ≥6 para alinear)`);
  const byPos = { POR: 0, DEF: 0, MED: 0, DEL: 0 };
  const nums = new Set(), names = new Set(), prints = new Set();
  for (const p of t.players) {
    if (!POSITIONS.includes(p.pos)) { fail(`${tag}: ${p.name} posición inválida "${p.pos}"`); continue; }
    byPos[p.pos]++;
    // nombre y dorsal
    if (names.has(p.name)) fail(`${tag}: nombre duplicado "${p.name}"`);
    names.add(p.name);
    if (!Number.isInteger(p.num) || p.num < 1 || p.num > 26) fail(`${tag}: ${p.name} dorsal ${p.num} fuera de 1-26`);
    if (nums.has(p.num)) fail(`${tag}: dorsal ${p.num} repetido (${p.name})`);
    nums.add(p.num);
    if (p.num === 1 && p.pos !== "POR") fail(`${tag}: el dorsal 1 es solo de arqueros (${p.name} es ${p.pos})`);
    // stats según posición
    const keys = p.pos === "POR" ? GK_STATS : FIELD_STATS;
    for (const k of keys) {
      const v = p.stats && p.stats[k];
      if (!Number.isInteger(v) || v < 1 || v > 99) fail(`${tag}: ${p.name} stat ${k}=${v} fuera de 1-99`);
    }
    const extra = Object.keys(p.stats || {}).filter(k => !keys.includes(k));
    if (extra.length) fail(`${tag}: ${p.name} tiene stats ajenas a su posición: ${extra.join(",")}`);
    // look y huella de sprite
    const L = p.look || {};
    if (!HEX.test(L.skin || "")) fail(`${tag}: ${p.name} look.skin inválido`);
    if (!HEX.test(L.hair || "")) fail(`${tag}: ${p.name} look.hair inválido`);
    if (!STYLES.has(L.style)) fail(`${tag}: ${p.name} look.style inválido "${L.style}"`);
    if (typeof L.beard !== "boolean") fail(`${tag}: ${p.name} look.beard debe ser boolean`);
    const print = `${L.skin}|${L.hair}|${L.style}|${L.beard}|${p.pos === "POR" ? "gk" : "field"}`;
    if (prints.has(print)) warn(`${tag}: huella de sprite duplicada (${p.name}) — se verá idéntico a un compañero`);
    prints.add(print);
  }
  for (const pos of POSITIONS) {
    if (byPos[pos] < 1) fail(`${tag}: sin ningún ${pos} en el plantel (mínimo 1 por posición)`);
  }
}

// ---------- Rivales (incluye no clasificados: son datos igual) ----------
for (const t of teams.filter(x => !x.playable)) {
  const tag = `${t.id} (rival)`;
  if (!Number.isInteger(t.rating) || t.rating < 1 || t.rating > 99) fail(`${tag}: rating ${t.rating} fuera de 1-99`);
  if (!t.kit || !HEX.test(t.kit.shirt || "") || !HEX.test(t.kit.accent || "")) fail(`${tag}: kit incompleto`);
  if (!Array.isArray(t.figures) || t.figures.length !== 5) {
    fail(`${tag}: ${t.figures ? t.figures.length : 0} figuras (deben ser 5)`);
    continue;
  }
  const covered = new Set(t.figures.map(f => f.pos));
  for (const f of t.figures) {
    if (!f.name) fail(`${tag}: figura sin nombre`);
    if (!POSITIONS.includes(f.pos)) fail(`${tag}: figura ${f.name} posición inválida "${f.pos}"`);
  }
  for (const pos of POSITIONS) {
    if (!covered.has(pos)) fail(`${tag}: ninguna figura es ${pos} (el esquema exige ≥1 por posición)`);
  }
}

console.log(`teams.validate: ${teams.length} selecciones · ${playables.length} jugables · ${qualified.length} clasificadas${warns ? ` · ${warns} advertencia(s)` : ""}`);
console.log(fails ? `❌ ${fails} problema(s)` : "✅ datos OK");
process.exit(fails ? 1 : 0);
