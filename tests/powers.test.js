/* ============================================================
   Tests de las fórmulas de poder del partido (game/match/powers):
   la BANDA VERDE de energía del arco del Meta M1 (decisión PO
   22-jul-2026) — sobre el umbral la energía no pesa, bajo el
   umbral castiga lineal hasta el piso. La curva se testea acá en
   unitario, no solo por smoke (ley del sprint).
   Uso: node tests/powers.test.js
   ============================================================ */
import { loadEngine } from "./load-engine.js";

const { Engine: E } = await loadEngine();

let fails = 0, checks = 0;
const assert = (cond, msg, ctx) => { checks++; if (!cond) { fails++; console.error("FAIL:", msg, ctx ?? ""); } };

// ---------- la banda verde: plana arriba ----------
assert(E.energyMult(100) === 1, "al 100% rinde pleno", E.energyMult(100));
assert(E.energyMult(E.ENERGY_OK) === 1, "en el umbral exacto todavía es banda verde", E.energyMult(E.ENERGY_OK));
assert(E.energyMult(E.ENERGY_OK + 5) === 1, "dentro de la banda la energía NO pesa: 75 juega como 100");
assert(E.energyMult(undefined) === 1, "sin campo energía (rival/duck-typed) no castiga: la asimetría vive en los datos");

// ---------- bajo el umbral: lineal hasta el piso ----------
assert(Math.abs(E.energyMult(5) - E.ENERGY_FLOOR_MULT) < 1e-9, "con el tanque vacío (5) toca el piso", E.energyMult(5));
{
  // punto medio de la rampa: un CUARTO del castigo (la curva es convexa/cuadrática:
  // rozar la banda casi no cuesta, estar fundido de verdad sí — decisión PO M1)
  const mid = (E.ENERGY_OK + 5) / 2;
  const expected = 1 - (1 - E.ENERGY_FLOOR_MULT) * 0.25;
  assert(Math.abs(E.energyMult(mid) - expected) < 1e-9, "a mitad de rampa, un cuarto del castigo (convexa)", E.energyMult(mid));
  assert(E.energyMult(mid) > (1 + E.ENERGY_FLOOR_MULT) / 2, "la convexa castiga MENOS que la lineal en toda la zona alta");
  assert(E.energyMult(E.ENERGY_OK - 5) > 0.995, "rozar la banda es casi gratis", E.energyMult(E.ENERGY_OK - 5));
}
// Monotonía: bajo el umbral, más vacío nunca rinde más. Sin saltos ni escalones.
{
  let ok = true;
  for (let e = 6; e <= 100; e++) if (E.energyMult(e) < E.energyMult(e - 1) - 1e-12) { ok = false; break; }
  assert(ok, "el multiplicador es monótono no-decreciente en energía");
  assert(E.energyMult(40) < E.energyMult(60), "bajo el umbral sí se siente: 40 rinde menos que 60");
}
// El piso no puede dejar a nadie inservible (la tesis: estar fundido no debe ANULAR,
// Recuperar es el seguro — no un multiplicador de pánico).
assert(E.ENERGY_FLOOR_MULT >= 0.7, "el piso castiga pero no anula", E.ENERGY_FLOOR_MULT);
assert(E.ENERGY_OK > E.FATIGUE_INJURY_FROM, "la banda avisa ANTES que el riesgo de lesión: el rendimiento cae primero, la lesión escala después");

// ---------- effStat monta la banda (no un peso lineal propio) ----------
{
  const jug = (energia) => ({ pos: "DEL", stats: { tiro: 80 }, energia });
  const fresco = E.effStat(jug(100), "tiro");
  assert(E.effStat(jug(E.ENERGY_OK), "tiro") === fresco, "effStat dentro de la banda = effStat fresco (75 juega como 100)");
  assert(Math.abs(E.effStat(jug(5), "tiro") - fresco * E.ENERGY_FLOOR_MULT) < 1e-9, "effStat en el piso = fresco × piso");
  assert(E.effStat(jug(40), "tiro") < E.effStat(jug(E.ENERGY_OK), "tiro"), "bajo la banda effStat cae");
}

console.log(`powers.test: ${checks} checks · fallos: ${fails}`);
console.log(fails ? "❌ powers con fallos" : "✅ powers OK");
process.exit(fails ? 1 : 0);
