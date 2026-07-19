/* ============================================================
   Tests de la Moral del equipo (game/morale.js):
   - nacimiento en 50 y bandas 1..100
   - bumpMorale: clamp y diario SOLO al cambiar de banda
   - cierre post-partido: base V/E/D, goles agónicos que deciden
     (a favor y en contra) y el extra de la tanda de penales
   Uso: node tests/morale.test.js
   ============================================================ */
import { loadEngine } from "./load-engine.js";

const { Engine: E } = await loadEngine();

let fails = 0, checks = 0;
const assert = (cond, msg, ctx) => { checks++; if (!cond) { fails++; console.error("FAIL:", msg, ctx ?? ""); } };

// ---------- nacimiento y bandas ----------
const run = E.newRun("BRA");
assert(run.moral === 50, "la run nace con moral 50", run.moral);
const BANDAS = [[1, "suelo"], [20, "suelo"], [21, "baja"], [40, "baja"], [41, "estable"], [60, "estable"], [61, "alta"], [80, "alta"], [81, "nubes"], [100, "nubes"]];
for (const [v, id] of BANDAS) assert(E.moraleBand(v).id === id, `moral ${v} → banda ${id}`, E.moraleBand(v).id);

// ---------- bumpMorale: clamp y diario por cambio de banda ----------
{
  run.moral = 60;
  let antes = run.journal.length;
  E.bumpMorale(run, 5, "prueba"); // 60 → 65: estable → alta
  assert(run.moral === 65, "bump suma");
  assert(run.journal.length === antes + 1, "cruzar de banda escribe en el diario");
  antes = run.journal.length;
  E.bumpMorale(run, 5, "prueba"); // 65 → 70: sigue alta
  assert(run.journal.length === antes, "moverse dentro de la banda es silencioso");
  E.bumpMorale(run, 999, "prueba");
  assert(run.moral === 100, "clamp superior en 100");
  E.bumpMorale(run, -999, "prueba");
  assert(run.moral === 1, "clamp inferior en 1");
}

// ---------- cierre post-partido ----------
// Match duck-typed: solo lo que lee applyMoralePostMatch
const fakeMatch = ({ winner = null, gMy = 0, gOpp = 0, scorers = [], oppGoalMins = [], pens = null } = {}) =>
  ({ result: () => ({ winner, gMy, gOpp, pens }), scorers, oppGoalMins, gMy, gOpp, oppTeam: { name: "Rival FC" } });
const cierra = (m) => { run.moral = 50; E.applyMoralePostMatch(run, m); return run.moral; };

assert(cierra(fakeMatch({ winner: "my", gMy: 2, gOpp: 0, scorers: [{ name: "A", min: 30 }, { name: "A", min: 60 }] })) === 60, "victoria de trámite: +10");
assert(cierra(fakeMatch({ winner: "opp", gMy: 0, gOpp: 2, oppGoalMins: [30, 60] })) === 40, "derrota: −10");
assert(cierra(fakeMatch({ gMy: 0, gOpp: 0 })) === 50, "empate sin historia: 0");
assert(cierra(fakeMatch({ winner: "my", gMy: 1, gOpp: 0, scorers: [{ name: "A", min: 88 }] })) === 65, "gol agónico del triunfo: +10 +5");
assert(cierra(fakeMatch({ winner: "opp", gMy: 0, gOpp: 1, oppGoalMins: [89] })) === 35, "derrota de último minuto: −10 −5");
assert(cierra(fakeMatch({ gMy: 1, gOpp: 1, scorers: [{ name: "A", min: 90 }], oppGoalMins: [40] })) === 54, "empatarlo al final: +4");
assert(cierra(fakeMatch({ gMy: 1, gOpp: 1, scorers: [{ name: "A", min: 20 }], oppGoalMins: [89] })) === 46, "que te empaten al final: −4");
assert(cierra(fakeMatch({ winner: "my", gMy: 1, gOpp: 1, scorers: [{ name: "A", min: 50 }], oppGoalMins: [60], pens: { myGoals: 4, oppGoals: 2 } })) === 63, "ganar la tanda: +10 +3");
assert(cierra(fakeMatch({ winner: "opp", gMy: 0, gOpp: 0, pens: { myGoals: 2, oppGoals: 4 } })) === 37, "perder la tanda: −10 −3");
// un gol agónico que NO decide (goleada) no suma el extra
assert(cierra(fakeMatch({ winner: "my", gMy: 3, gOpp: 0, scorers: [{ name: "A", min: 10 }, { name: "A", min: 40 }, { name: "A", min: 89 }] })) === 60, "el gol del 3-0 en el 89' no es agónico: +10");

// ---------- resumen devuelto (alimenta el análisis del cuerpo técnico) ----------
{
  run.moral = 50;
  const r = E.applyMoralePostMatch(run, fakeMatch({ winner: "my", gMy: 1, gOpp: 0, scorers: [{ name: "A", min: 88 }] }));
  assert(r.before === 50 && r.after === 65 && r.delta === 15, "el resumen trae before/after/delta", JSON.stringify(r));
  assert(r.bandBefore.id === "estable" && r.bandAfter.id === "alta", "trae las bandas antes y después");
  assert(r.reasons.includes("Victoria") && r.reasons.some(t => /sobre la hora/.test(t)), "explica el resultado y el gol agónico", r.reasons.join(" | "));
  run.moral = 50;
  assert(E.applyMoralePostMatch(run, fakeMatch({ gMy: 0, gOpp: 0 })).reasons.includes("Empate"), "el empate se narra");
}

console.log(`morale.test: ${checks} checks · fallos: ${fails}`);
console.log(fails ? "❌ morale con fallos" : "✅ morale OK");
process.exit(fails ? 1 : 0);
