/* ============================================================
   Tests de la OXIDACIÓN (arco del Rebalance R1, decisión PO
   22-jul-2026): la curva comprimida racha 3→5 en unitario (ley
   del arco: no solo por smoke), el PISO COMBINADO banda×óxido
   sobre effStat, y la regla de la racha (qué resetea y qué no)
   corriendo sobre el motor real.
   Uso: node tests/oxidation.test.js
   ============================================================ */
import { loadEngine } from "./load-engine.js";

const { Engine: E } = await loadEngine();

let fails = 0, checks = 0;
const assert = (cond, msg, ctx) => { checks++; if (!cond) { fails++; console.error("FAIL:", msg, ctx ?? ""); } };

// ---------- la curva: plana bajo el umbral, convexa hasta el piso ----------
assert(E.oxidMult(0) === 1, "sin racha no hay óxido");
assert(E.oxidMult(E.OXID_THRESHOLD - 1) === 1, "justo bajo el umbral (2 días) todavía es gratis");
assert(E.oxidMult(undefined) === 1, "sin campo racha (rival/duck-typed) no castiga: la asimetría vive en los datos");
// La tabla pactada con el PO (partido resetea → la curva entera vive entre 3 y 5).
// Derivada del piso, no hardcodeada (lección de medical.test): el rebalance del piso
// (0.85→0.82 en R2) no rompe el test — la FORMA de la curva es lo que se fija acá.
const K = 1 - E.OXID_FLOOR_MULT; // el castigo total del piso
assert(Math.abs(E.oxidMult(3) - (1 - K / 9)) < 1e-9, "racha 3: el primer día oxidado es casi gratis (1/9 del castigo)", E.oxidMult(3));
assert(Math.abs(E.oxidMult(4) - (1 - K * 4 / 9)) < 1e-9, "racha 4: ventana corta completa sin entrenar (4/9 del castigo)", E.oxidMult(4));
assert(Math.abs(E.oxidMult(E.OXID_FLOOR_AT) - E.OXID_FLOOR_MULT) < 1e-9, "racha 5: ventana larga completa toca el piso", E.oxidMult(5));
assert(E.oxidMult(12) === E.OXID_FLOOR_MULT, "más allá del piso no sigue cayendo (clamp)");
// Convexa como la banda: el castigo del primer día oxidado es MENOR que un tercio del total
assert(1 - E.oxidMult(3) < (1 - E.OXID_FLOOR_MULT) / 3, "convexa: rozar el umbral cuesta menos que la rampa lineal");
{
  let ok = true;
  for (let r = 1; r <= 12; r++) if (E.oxidMult(r) > E.oxidMult(r - 1) + 1e-12) { ok = false; break; }
  assert(ok, "el multiplicador es monótono no-creciente en la racha");
}
assert(E.OXID_FLOOR_MULT >= 0.8, "el piso castiga pero no anula (oxidarse no es una sentencia)", E.OXID_FLOOR_MULT);

// ---------- effStat monta el óxido por p.oxid — y el PISO COMBINADO banda×óxido ----------
{
  const jug = (energia, oxid) => ({ pos: "DEL", stats: { tiro: 80 }, energia, ...(oxid !== undefined ? { oxid } : {}) });
  const fresco = E.effStat(jug(100), "tiro");
  assert(Math.abs(E.effStat(jug(100, E.oxidMult(5)), "tiro") - fresco * E.OXID_FLOOR_MULT) < 1e-9, "effStat oxidado en banda = fresco × piso del óxido");
  assert(E.effStat(jug(100, E.oxidMult(3)), "tiro") < fresco, "racha 3 ya se siente en effStat (aunque casi nada)");
  // El riesgo declarado del arco: dos multiplicadores < 1 apilados. El producto mínimo
  // (energía 5 × racha 5+) queda FIJADO acá: 0.75 × 0.85 = ×0.6375 — ni más ni menos.
  const combinado = E.ENERGY_FLOOR_MULT * E.OXID_FLOOR_MULT;
  assert(Math.abs(E.effStat(jug(5, E.oxidMult(9)), "tiro") - fresco * combinado) < 1e-9,
    `piso combinado banda×óxido = ×${combinado} exacto`, E.effStat(jug(5, E.oxidMult(9)), "tiro") / fresco);
  assert(combinado >= 0.6, "el piso combinado no deja a nadie inservible", combinado);
  assert(E.effStat(jug(100), "tiro") === fresco, "sin campo oxid (rival) el óxido no existe");
}

// ---------- la regla de la racha sobre el motor real ----------
{
  const run = E.newRun("BRA");
  assert(run.diasSinEntrenar === 0, "la run nace con la racha en cero");
  const apply = id => { run.actionPending = true; run.dayMod = null; const r = E.applyDayAction(run, id); assert(r, `la acción ${id} debe aplicarse`); };

  apply("recuperar");
  assert(run.diasSinEntrenar === 1, "Recuperar suma un día sin entrenar");
  apply("bonding");
  assert(run.diasSinEntrenar === 2, "Bonding NO resetea: la integración no es fútbol (decisión PO)");
  assert(run.squad.every(p => p.oxid === 1), "bajo el umbral el plantel sigue a ×1");
  const antes = run.journal.length;
  apply("recuperar");
  assert(run.diasSinEntrenar === 3, "tercer día sin entrenar: se enciende el óxido");
  assert(run.squad.every(p => Math.abs(p.oxid - E.oxidMult(3)) < 1e-9), "la racha se estampa en TODO el plantel (banco incluido)");
  assert(run.journal.length === antes + 2 && run.journal[run.journal.length - 1].icon === "⚙️", "el primer episodio se narra en el diario");
  assert(run.oxidNarrada === true, "y queda marcado como narrado");
  apply("recuperar");
  apply("recuperar");
  assert(run.diasSinEntrenar === 5 && run.squad.every(p => p.oxid === E.OXID_FLOOR_MULT), "racha 5: el plantel juega al piso");
  const antes2 = run.journal.length;
  apply("recuperar");
  assert(run.journal.length === antes2 + 1, "el episodio se narra UNA vez por run (solo el diario de la acción)");

  apply("entrenar_ataque");
  assert(run.diasSinEntrenar === 0 && run.squad.every(p => p.oxid === 1), "Entrenar resetea la racha y desestampa el óxido");
  apply("recuperar"); apply("recuperar"); apply("recuperar");
  apply("plan_press");
  assert(run.diasSinEntrenar === 0, "la Sesión Táctica también resetea (trabajo de cancha)");

  // El cambio de identidad consume el día por fuera de applyDayAction — también es trabajo
  run.filoId = null;
  E.choosePhilosophy(run, "press");
  apply("recuperar"); apply("recuperar");
  run.actionPending = true;
  E.changePhilosophy(run, "posesion");
  assert(run.diasSinEntrenar === 0, "cambiar de identidad ES trabajo táctico: resetea la racha");

  // Jugar es ritmo: el reset del partido (flow.resetOxidacion, lo integra el smoke real)
  run.diasSinEntrenar = 4;
  E.resetOxidacion(run);
  assert(run.diasSinEntrenar === 0 && run.squad.every(p => p.oxid === 1), "el partido devuelve el ritmo (reset del cierre)");

  // oxidState: el contrato de la UI (hub/plantilla leen de acá)
  run.diasSinEntrenar = 4; run.squad.forEach(p => p.oxid = E.oxidMult(4));
  const st = E.oxidState(run);
  assert(st.racha === 4 && st.oxidado && Math.abs(st.mult - E.oxidMult(4)) < 1e-9, "oxidState refleja racha/mult/estado", st);
  assert(!E.oxidState({ diasSinEntrenar: 2 }).oxidado, "bajo el umbral oxidState no acusa óxido");
}

console.log(`oxidation.test: ${checks} checks · fallos: ${fails}`);
console.log(fails ? "❌ oxidación con fallos" : "✅ oxidación OK");
process.exit(fails ? 1 : 0);
