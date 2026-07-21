/* ============================================================
   Tests del cuerpo médico y la economía de energía (game/medical.js
   + el descanso pasivo que dispara game/calendar.js):
   - cruce Energía → Lesión del Sprint 4 (fatigueInjuryMult)
   - descanso pasivo diario y el de la VÍSPERA del partido, que
     antes no se cobraba (bug del PO, 21-jul-2026)
   - cansancio por minutos (matchFatigue) derivado de la constante
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

// ---------- descanso pasivo: día de preparación vs víspera de partido ----------
{
  const squadDe = (energia) => Array.from({ length: 6 }, (_, i) => ({ name: `P${i}`, energia }));
  const prep = { squad: squadDe(50) };
  E.applyDailyRecovery(prep);
  assert(prep.squad.every(p => p.energia === 50 + E.DAILY_RECOVERY), `un día de preparación recupera +${E.DAILY_RECOVERY}`, prep.squad[0].energia);

  const visperaRun = { squad: squadDe(50) };
  E.applyDailyRecovery(visperaRun, true);
  assert(visperaRun.squad.every(p => p.energia === 50 + E.MATCHDAY_RECOVERY), `la víspera del partido recupera +${E.MATCHDAY_RECOVERY}`, visperaRun.squad[0].energia);

  assert(E.MATCHDAY_RECOVERY > 0, "el día de partido SÍ recupera algo (bug del PO: antes era 0)");
  assert(E.MATCHDAY_RECOVERY < E.DAILY_RECOVERY, "pero menos que un día de preparación: viaje, charla y nervios no son descanso");

  const tope = { squad: squadDe(99) };
  E.applyDailyRecovery(tope);
  assert(tope.squad.every(p => p.energia === 100), "la recuperación pasiva no pasa de 100", tope.squad[0].energia);
}

// ---------- el día de partido cobra su descanso pasando el día de verdad ----------
{
  const run = E.newRun("BRA");
  // Llevar la run hasta la víspera: pasar días hasta que el siguiente sea el del partido.
  while (run.day < run.nextMatchDay - 1) E.advanceDay(run);
  run.squad.forEach(p => { p.energia = 40; });
  const res = E.advanceDay(run);
  assert(res && res.type === "match", "el día siguiente es el de partido", JSON.stringify(res));
  assert(run.squad.every(p => p.energia === 40 + E.MATCHDAY_RECOVERY),
    `se llega al partido con +${E.MATCHDAY_RECOVERY} de energía, no con 0`, run.squad[0].energia);
  assert(run.actionPending === false, "el día de partido sigue sin Acción del Día (los días de partido son sagrados)");
}

// ---------- cansancio por minutos (derivado de la constante, no hardcodeado) ----------
assert(E.matchFatigue(90) === Math.round(90 / 30 * E.FATIGUE_PER_30), "90' cuestan 3 × FATIGUE_PER_30", E.matchFatigue(90));
assert(E.matchFatigue(0) === 0, "el que no entró no se cansa");
assert(E.matchFatigue(45) < E.matchFatigue(90), "el cansancio es proporcional a los minutos");

console.log(`medical.test: ${checks} checks · fallos: ${fails}`);
console.log(fails ? "❌ medical con fallos" : "✅ medical OK");
process.exit(fails ? 1 : 0);
