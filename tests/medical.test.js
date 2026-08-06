/* ============================================================
   Tests del cuerpo médico y la economía de energía (game/medical.js):
   - cruce Energía → Lesión del Sprint 4 (fatigueInjuryMult)
   - cansancio por minutos (matchFatigue) derivado de la constante
   - EL DESCANSO PASIVO DIARIO SE ELIMINÓ (decisión PO, 2-ago-2026):
     pasar un día ya NO recupera energía por sí solo. La única fuente
     es la acción 🧘 Recuperar o el descanso del banco al no jugar
     (REST_RECOVERY, que sigue vivo — ver el bloque de abajo).
   Uso: node tests/medical.test.js
   ============================================================ */
import { loadEngine } from "./load-engine.js";

const { Engine: E } = await loadEngine();

let fails = 0, checks = 0;
const assert = (cond, msg, ctx) => { checks++; if (!cond) { fails++; console.error("FAIL:", msg, ctx ?? ""); } };

// ---------- cruce Energía → Lesión (Sprint 4) ----------
assert(E.fatigueInjuryMult(100) === 1, "un jugador entero no tiene riesgo extra", E.fatigueInjuryMult(100));
assert(E.fatigueInjuryMult(E.FATIGUE_INJURY_FROM) === 1, "el multiplicador arranca recién bajo el umbral de energía", E.fatigueInjuryMult(E.FATIGUE_INJURY_FROM));
assert(E.fatigueInjuryMult(E.FATIGUE_INJURY_FROM + 20) === 1, "por encima del umbral no escala");
assert(Math.abs(E.fatigueInjuryMult(5) - E.FATIGUE_INJURY_MAX) < 1e-9, "en el piso de energía llega al tope", E.fatigueInjuryMult(5));
assert(E.fatigueInjuryMult(undefined) === 1, "sin campo energía (rival/duck-typed) no escala: la asimetría vive en los datos");
// Monotonía: cuanto más vacío, peor. Ningún escalón puede bajar el riesgo.
{
  let ok = true;
  for (let e = 5; e < 100; e++) if (E.fatigueInjuryMult(e) > E.fatigueInjuryMult(e - 1) + 1e-12) { ok = false; break; }
  assert(ok, "el multiplicador es monótono decreciente en energía (más energía = menos riesgo)");
  assert(E.fatigueInjuryMult(20) > E.fatigueInjuryMult(45), "un jugador al 20% corre más riesgo que uno al 45%");
}
// El cruce no puede convertir un golpe en lesión segura: 0.45 base × tope debe seguir < 1.
assert(0.45 * E.FATIGUE_INJURY_MAX < 1, "ni con las piernas vacías el golpe es lesión garantizada", 0.45 * E.FATIGUE_INJURY_MAX);

// ---------- EL DESCANSO PASIVO NO EXISTE (decisión PO, 2-ago-2026) ----------
{
  assert(E.applyDailyRecovery === undefined, "applyDailyRecovery se borró: no queda ni la función muerta");
  assert(E.DAILY_RECOVERY === undefined && E.MATCHDAY_RECOVERY === undefined, "y tampoco sus constantes");

  // Pasar un día de preparación, jugando o no, no mueve la energía de nadie POR SÍ SOLO.
  // Repetido en vez de un solo trial: `advanceDay` también dispara eventos de preparación
  // al azar (content/prep-events), y varios de ellos SÍ tocan energía por su cuenta — eso
  // es un mecanismo distinto del descanso pasivo que se está probando acá. Un único día
  // podía coincidir con uno de esos eventos y dar un falso rojo. Lo que hay que confirmar
  // es que "nada pasa" sea un resultado POSIBLE (antes era IMPOSIBLE: el pasivo garantizaba
  // +7 siempre) — no que sea el resultado de un día cualquiera.
  let huboDiaSinCambios = false;
  for (let i = 0; i < 60 && !huboDiaSinCambios; i++) {
    const run = E.newRun("BRA");
    run.squad.forEach(p => { p.energia = 40; });
    E.advanceDay(run);
    if (run.squad.every(p => p.energia === 40)) huboDiaSinCambios = true;
  }
  assert(huboDiaSinCambios, "en al menos uno de 60 días de preparación la energía no se mueve — confirma que no queda ningún piso pasivo");

  // Tampoco la víspera del partido (antes recuperaba +2 — ya no). Mismo cuidado con los
  // eventos al azar: se repite hasta ver un caso limpio.
  let huboVisperaSinCambios = false;
  for (let i = 0; i < 60 && !huboVisperaSinCambios; i++) {
    const run = E.newRun("BRA");
    while (run.day < run.nextMatchDay - 1) E.advanceDay(run);
    run.squad.forEach(p => { p.energia = 40; });
    const res = E.advanceDay(run);
    assert(res && res.type === "match", "el día siguiente es el de partido", JSON.stringify(res));
    assert(res.type !== "match" || run.actionPending === false, "el día de partido sigue sin Acción del Día (los días de partido son sagrados)");
    if (run.squad.every(p => p.energia === 40)) huboVisperaSinCambios = true;
  }
  assert(huboVisperaSinCambios, "en al menos una víspera de partido la energía tampoco se mueve por sí sola");

  // La única fuente pasiva que sigue viva: el banco que no jugó (REST_RECOVERY).
  assert(E.REST_RECOVERY > 0, "el que no juega un partido sigue recuperando por rotar");
}

// ---------- cansancio por minutos (derivado de la constante, no hardcodeado) ----------
assert(E.matchFatigue(90) === Math.round(90 / 30 * E.FATIGUE_PER_30), "90' cuestan 3 × FATIGUE_PER_30", E.matchFatigue(90));
assert(E.matchFatigue(0) === 0, "el que no entró no se cansa");
assert(E.matchFatigue(45) < E.matchFatigue(90), "el cansancio es proporcional a los minutos");

console.log(`medical.test: ${checks} checks · fallos: ${fails}`);
console.log(fails ? "❌ medical con fallos" : "✅ medical OK");
process.exit(fails ? 1 : 0);
