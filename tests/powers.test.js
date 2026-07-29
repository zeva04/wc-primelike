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

// ---------- EL DIAL DE FORMACIÓN (arreglado 28-jul-2026) ----------
// EL BUG que esto impide que vuelva: cada línea entraba solo PROMEDIADA, así que sumarle
// un hombre solo podía BAJAR su promedio. Medido entonces: el dibujo más defensivo daba
// el mayor `def` en 0 de 6 planteles y el más ofensivo el mayor `atk` en 0 de 6 — los
// hint de FORMATIONS decían lo contrario de lo que pasaba. Ahora la fuerza de una línea
// es CALIDAD × BOCAS, con rendimiento decreciente.
{
  const equipos = ["BRA", "ARG", "ESP", "FRA", "POR", "KOR", "MAR", "JPN", "NZL", "CPV"];
  const ids = E.FORMATIONS.map(f => f.id);
  let atkTop = 0, menosDef = 0, defTop2 = 0, defSobreUno = 0;
  const mAtk = {}, mDef = {};
  for (const i of ids) { mAtk[i] = 0; mDef[i] = 0; }
  for (const eq of equipos) {
    const run = E.newRun(eq);
    const { lineup } = E.currentLineup(run.squad, null, null);
    const row = {};
    for (const f of E.FORMATIONS) {
      for (const [p, pos] of E.assignToFormation(lineup, f.id)) p.posJugada = pos;
      row[f.id] = E.teamPowers(lineup, "normal", {});
      mAtk[f.id] += row[f.id].atk / equipos.length;
      mDef[f.id] += row[f.id].def / equipos.length;
    }
    const ordAtk = ids.slice().sort((a, b) => row[b].atk - row[a].atk);
    const ordDef = ids.slice().sort((a, b) => row[b].def - row[a].def);
    if (ordAtk[0] === "1-1-3") atkTop++;
    if (ordDef.at(-1) === "1-1-3") menosDef++;
    if (ordDef.slice(0, 2).includes("3-1-1")) defTop2++;
    if (["1-1-3", "1-2-2", "1-3-1"].every(x => row["3-1-1"].def > row[x].def)) defSobreUno++;
  }
  const n = equipos.length;
  // Decisión PO 28-jul: "delanteros mandan" — amontonar delanteros ES el dibujo más ofensivo.
  assert(atkTop === n, "el 1-1-3 (Todo al ataque) es el de MÁS ataque en todos los planteles", `${atkTop}/${n}`);
  assert(menosDef === n, "y el de MENOS defensa en todos", `${menosDef}/${n}`);
  // El 3-1-1 no siempre gana la defensa a propósito: sin un tercer central de verdad, el
  // 2-2-1 puede defender mejor. Lo que NO puede pasar es que quede fuera del podio.
  assert(defTop2 === n, "el 3-1-1 (Defensiva) está entre los dos que más defienden", `${defTop2}/${n}`);
  assert(defSobreUno >= n - 1, "y defiende más que cualquier dibujo de un solo defensa", `${defSobreUno}/${n}`);
  // NINGÚN dibujo puede estar estrictamente dominado: sería una opción trampa.
  const dominados = ids.filter(a => ids.some(b => b !== a && mAtk[b] > mAtk[a] && mDef[b] > mDef[a]));
  assert(dominados.length === 0, "ningún dibujo queda dominado (peor atk Y peor def que otro)", dominados.join(","));
  // Monotonía: más defensas = más defensa, sin excepción, con el mismo plantel.
  assert(mDef["3-1-1"] > mDef["2-1-2"] && mDef["2-1-2"] > mDef["1-1-3"],
    "más defensas → más defensa", `${mDef["1-1-3"].toFixed(2)} < ${mDef["2-1-2"].toFixed(2)} < ${mDef["3-1-1"].toFixed(2)}`);
  assert(mAtk["1-1-3"] > mAtk["2-1-2"] && mAtk["2-1-2"] > mAtk["3-1-1"],
    "más delanteros → más ataque", `${mAtk["3-1-1"].toFixed(2)} < ${mAtk["2-1-2"].toFixed(2)} < ${mAtk["1-1-3"].toFixed(2)}`);
}

// ---------- el 2-1-2 es la REFERENCIA: su poder no cambió con el arreglo ----------
// Los tres factores de bocas valen exactamente 1 con el dibujo Equilibrada, así que su
// atk/def son los de la fórmula vieja. Es lo que hace auditable el cambio: lo que se movió
// es cómo se DESVÍAN los otros cinco, no el nivel general del juego.
{
  const run = E.newRun("BRA");
  const { lineup } = E.currentLineup(run.squad, null, null);
  for (const [p, pos] of E.assignToFormation(lineup, "2-1-2")) p.posJugada = pos;
  const pos = p => E.playedPos(p);
  const act = lineup;
  const atkP = act.filter(p => pos(p) === "DEL" || pos(p) === "MED");
  const medP = act.filter(p => pos(p) === "MED");
  const defP = act.filter(p => pos(p) === "DEF");
  const por = act.find(p => pos(p) === "POR");
  const avg = (ps, k) => ps.length ? ps.reduce((s, p) => s + E.effStat(p, k, {}), 0) / ps.length : 1;
  const aura = avg(act, "aura");
  // La fórmula VIEJA, sin ningún factor de bocas
  const atkViejo = avg(atkP, "tiro") * 0.4 + avg(medP, "pase") * 0.3 + avg(atkP, "cabezazo") * 0.12 + aura * 0.18;
  const defViejo = avg(defP, "defensa") * 0.52 + E.gkQuality(por, {}) * 0.32 + aura * 0.16;
  const pw = E.teamPowers(lineup, "normal", {});
  assert(Math.abs(pw.atk - atkViejo) < 1e-9, "el 2-1-2 da el MISMO atk que la fórmula sin bocas", `${pw.atk} vs ${atkViejo}`);
  assert(Math.abs(pw.def - defViejo) < 1e-9, "y el mismo def", `${pw.def} vs ${defViejo}`);
}

console.log(`powers.test: ${checks} checks · fallos: ${fails}`);
console.log(fails ? "❌ powers con fallos" : "✅ powers OK");
process.exit(fails ? 1 : 0);
