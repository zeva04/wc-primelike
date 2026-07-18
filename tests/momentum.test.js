/* ============================================================
   Tests del Momento del jugador (game/momentum.js):
   - mapa nivel → % con tope (±2% por paso, máx ±4%)
   - asimetría: un jugador sin `momento` (rival) no se escala
   - integración con ratings (effectiveStat / playerOverall /
     statPenalties no confunde momento con fuera de puesto)
   - reglas post-partido: resultado, goles, penales, arquero,
     tope ±2, decaimiento hacia el neutro y clamps 1..7
   Uso: node tests/momentum.test.js
   ============================================================ */
import { loadEngine } from "./load-engine.js";

const { Engine: E } = await loadEngine();

let fails = 0, checks = 0;
const assert = (cond, msg, ctx) => { checks++; if (!cond) { fails++; console.error("FAIL:", msg, ctx ?? ""); } };

// ---------- nivel → % (con tope) ----------
const ESPERADO = { 1: -4, 2: -4, 3: -2, 4: 0, 5: 2, 6: 4, 7: 4 };
for (const [nivel, pct] of Object.entries(ESPERADO)) {
  assert(E.momentoPct({ momento: +nivel }) === pct, `momento ${nivel} → ${pct}%`, E.momentoPct({ momento: +nivel }));
}
assert(E.momentoPct({}) === 0, "un jugador SIN campo momento (rival) no tiene efecto");
assert(E.momentoMult({ momento: 4 }) === 1, "el neutro multiplica por 1 exacto");
assert(E.momentoMult({ momento: 7 }) === 1.04, "el tope multiplica por 1.04");

// ---------- nacimiento ----------
const run = E.newRun("BRA");
assert(run.squad.every(p => p.momento === 4), "todo el plantel nace con momento neutro (4)");

// ---------- integración con ratings ----------
{
  const p = run.squad.find(x => x.pos === "DEL");
  const raw = p.stats.tiro;
  assert(E.effectiveStat(p, "tiro") === raw, "momento 4 no toca la stat");
  p.momento = 6;
  assert(E.effectiveStat(p, "tiro") === Math.round(raw * 1.04), "momento 6 = +4%", `${raw} → ${E.effectiveStat(p, "tiro")}`);
  assert(E.effectiveStat(p, "aura") === Math.round(p.stats.aura * 1.04), "el aura también se escala (la confianza es aura)");
  p.momento = 2;
  assert(E.effectiveStat(p, "tiro") === Math.round(raw * 0.96), "momento 2 = −4%");
  const overFrio = E.playerOverall(p);
  p.momento = 6;
  assert(E.playerOverall(p) > overFrio, "la nota de la ficha refleja el momento (no puede mentir)");
  const naturalCaliente = E.naturalOverall(p);
  p.momento = 2;
  assert(E.naturalOverall(p) === naturalCaliente, "naturalOverall ignora el momento: es talento, no circunstancia (autoLineup no persigue al 🔥)");
  p.momento = 6;
  // En su puesto natural, el momento NO debe disfrazarse de castigo posicional
  assert(E.statPenalties(p).length === 0, "statPenalties vacío en su puesto aunque el momento escale las stats");
  // Fuera de puesto CON momento: la baja mostrada aísla el castigo posicional (~6 por paso)
  p.posJugada = "MED";
  const bajas = E.statPenalties(p);
  assert(bajas.length > 0, "fuera de puesto sigue mostrando sus bajas");
  for (const b of bajas) {
    assert(b.key !== "aura", "el aura no aparece castigada por posición", b.key);
    assert(Math.abs(b.delta) >= 5 && Math.abs(b.delta) <= 8, "la baja mostrada es el castigo posicional (≈6), no el % del momento", `${b.key}=${b.delta}`);
  }
  p.posJugada = null;
  p.momento = 4;
  // clamp superior: una stat alta con momento máximo no pasa de 99
  const crack = { pos: "DEL", momento: 7, stats: { tiro: 99, aura: 99 } };
  assert(E.effectiveStat(crack, "tiro") === 99, "el % no rompe el techo de 99");
}

// ---------- reglas post-partido ----------
// Match duck-typed: solo los campos que lee applyMomentumPostMatch
const fakeMatch = ({ winner = null, scorers = [], pensFallados = [], pensAtajadosPor = [], gOpp = 0 } = {}) =>
  ({ result: () => ({ winner }), scorers, pensFallados, pensAtajadosPor, gOpp });
const jugador = (momento, pos = "DEL") => ({ name: "Tester", pos, momento, stats: {} });
const aplica = (p, played, m) => { E.applyMomentumPostMatch(run, p, played, m); return p.momento; };

assert(aplica(jugador(4), true, fakeMatch({ winner: "my" })) === 5, "victoria +1");
assert(aplica(jugador(4), true, fakeMatch({ winner: "opp" })) === 3, "derrota −1");
assert(aplica(jugador(4), true, fakeMatch({ winner: "my", scorers: [{ name: "Tester", min: 30 }] })) === 6, "victoria + gol = +2");
assert(aplica(jugador(4), true, fakeMatch({ winner: "my", scorers: [{ name: "Tester", min: 30 }, { name: "Tester", min: 60 }] })) === 6, "el tope por partido es ±2");
assert(aplica(jugador(7), true, fakeMatch({ winner: "my", scorers: [{ name: "Tester", min: 30 }] })) === 7, "clamp superior en 7");
assert(aplica(jugador(4), true, fakeMatch({ winner: "opp", gOpp: 3 })) === 3, "los goles en contra no castigan al de campo");
// victoria (+1) + penal fallado (−1) = 0 de señal neta → aplica el decaimiento (desde 4, queda 4)
assert(aplica(jugador(4), true, fakeMatch({ winner: "my", pensFallados: ["Tester"] })) === 4, "victoria + penal fallado se anulan y decae");
assert(aplica(jugador(7), true, fakeMatch({ winner: "my", pensFallados: ["Tester"] })) === 6, "en llamas + penal fallado: la victoria no lo salva (el resultado no empuja sobre 5)");

// ---------- la banda del resultado (recorte de balance 17-jul): 3..5 ----------
assert(aplica(jugador(5), true, fakeMatch({ winner: "my" })) === 5, "ganar SOSTIENE la buena forma en 5, pero no la sube");
assert(aplica(jugador(6), true, fakeMatch({ winner: "my" })) === 5, "un 6 sin brillo propio decae aunque el equipo gane: la forma alta exige actuaciones");
assert(aplica(jugador(6), true, fakeMatch({ winner: "my", scorers: [{ name: "Tester", min: 10 }] })) === 7, "el gol sí sostiene y sube al que está en racha");
assert(aplica(jugador(3), true, fakeMatch({ winner: "opp" })) === 3, "perder sostiene el bajón en 3");
assert(aplica(jugador(2), true, fakeMatch({ winner: "opp" })) === 3, "el 2 no sigue cayendo por resultados: decae hacia el neutro");
assert(aplica(jugador(2), true, fakeMatch({ winner: "opp", pensFallados: ["Tester"] })) === 1, "el fallo individual sí congela más allá de la banda");
assert(aplica(jugador(2), true, fakeMatch({ winner: "my" })) === 3, "una victoria ayuda a salir del congelador");

// ---------- decaimiento ----------
assert(aplica(jugador(6), true, fakeMatch()) === 5, "empate sin señal: decae hacia el neutro");
assert(aplica(jugador(2), true, fakeMatch()) === 3, "el decaimiento también sube al que está frío");
assert(aplica(jugador(4), true, fakeMatch()) === 4, "en el neutro sin señal no pasa nada");
assert(aplica(jugador(7), false, fakeMatch({ winner: "my" })) === 6, "el que no jugó decae aunque el equipo gane");
assert(aplica(jugador(1), false, fakeMatch({ winner: "opp" })) === 2, "el que no jugó decae hacia arriba si estaba helado");

// sustituido cuenta como participante (flow le pasa played=false porque ya no está en el once)
{
  const p = jugador(4);
  p.sustituido = true;
  E.applyMomentumPostMatch(run, p, false, fakeMatch({ winner: "my" }));
  assert(p.momento === 5, "el sustituido también vivió el partido: victoria +1");
}

// ---------- arquero ----------
assert(aplica(jugador(4, "POR"), true, fakeMatch({ winner: "my", gOpp: 0 })) === 6, "arquero: victoria + valla invicta = +2");
assert(aplica(jugador(4, "POR"), true, fakeMatch({ winner: "opp", gOpp: 3 })) === 2, "arquero: derrota + goleada en contra = −2");
assert(aplica(jugador(4, "POR"), true, fakeMatch({ gOpp: 1, pensAtajadosPor: ["Tester"] })) === 5, "arquero: penal atajado +1");

// ---------- compat: runs guardadas antes del sprint ----------
{
  const p = { name: "Viejo", pos: "DEL", stats: {} }; // sin campo momento
  E.applyMomentumPostMatch(run, p, false, fakeMatch());
  assert(p.momento >= 1 && p.momento <= 7, "un jugador sin momento lo adquiere al primer cierre", p.momento);
}

console.log(`momentum.test: ${checks} checks · fallos: ${fails}`);
console.log(fails ? "❌ momentum con fallos" : "✅ momentum OK");
process.exit(fails ? 1 : 0);
