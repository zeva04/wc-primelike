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

// ---------- etiquetas cualitativas ----------
assert(E.MOMENTO_RISE_MAX === 1 && E.MOMENTO_FALL_MAX === 2, "sube máx +1, baja hasta −2 (decisión PO 18-jul)");
const LBL = { 1: "Paupérrimo", 2: "Apagado", 3: "Malo", 4: "Normal", 5: "Bueno", 6: "Encendido", 7: "Inspirado" };
for (const [n, txt] of Object.entries(LBL)) assert(E.momentoLabel({ momento: +n }) === txt, `nivel ${n} = ${txt}`, E.momentoLabel({ momento: +n }));
assert(E.momentoLabel({}) === "Normal", "un jugador sin momento (rival/run vieja) se lee como Normal");

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
const fakeMatch = ({ winner = null, scorers = [], assists = [], pensFallados = [], pensAtajadosPor = [], lastManStops = [], lastManFouls = [], gOpp = 0 } = {}) =>
  ({ result: () => ({ winner }), scorers, assists, pensFallados, pensAtajadosPor, lastManStops, lastManFouls, gOpp });
const jugador = (momento, pos = "DEL") => ({ name: "Tester", pos, momento, stats: {} });
const aplica = (p, played, m) => { E.applyMomentumPostMatch(run, p, played, m); return p.momento; };

// El RESULTADO ya no mueve el momento (eso es Moral del equipo): sin señal INDIVIDUAL decae.
assert(aplica(jugador(4), true, fakeMatch({ winner: "my" })) === 4, "ganar NO mueve el momento (va a la Moral); en el neutro no pasa nada");
assert(aplica(jugador(5), true, fakeMatch({ winner: "my" })) === 4, "ni sostiene: un Bueno sin gol decae aunque el equipo gane");
assert(aplica(jugador(3), true, fakeMatch({ winner: "opp" })) === 4, "perder tampoco lo hunde: un Malo sin fallo sube hacia el neutro");

// Las señales INDIVIDUALES sí mueven (subida topada en +1, bajada hasta −2):
assert(aplica(jugador(4), true, fakeMatch({ scorers: [{ name: "Tester", min: 30 }] })) === 5, "un gol sube +1");
assert(aplica(jugador(4), true, fakeMatch({ scorers: [{ name: "Tester", min: 30 }, { name: "Tester", min: 60 }] })) === 5, "dos goles topan en +1 por partido");
assert(aplica(jugador(7), true, fakeMatch({ scorers: [{ name: "Tester", min: 30 }] })) === 7, "clamp superior en 7");
assert(aplica(jugador(4), true, fakeMatch({ pensFallados: ["Tester"] })) === 3, "fallar un penal baja −1 (el resultado ya no compensa)");
assert(aplica(jugador(4), true, fakeMatch({ gOpp: 3 })) === 4, "los goles en contra no tocan al de campo (y sin señal, se queda en el neutro)");

// ---------- Sprint 1: asistencias y último hombre reparten Momento a MED y DEF ----------
{
  // Asistencia: +1 (la vía de los MED que no hacen goles)
  const p = jugador(4, "MED");
  const r = E.applyMomentumPostMatch(run, p, true, fakeMatch({ assists: [{ name: "Tester", min: 22 }] }));
  assert(p.momento === 5, "una asistencia sube +1", p.momento);
  assert(r.reasons.some(x => /asistencia/i.test(x.text)), "el resumen narra la asistencia", JSON.stringify(r.reasons));
}
assert(aplica(jugador(4, "DEF"), true, fakeMatch({ lastManStops: ["Tester"] })) === 5, "cortar un gol como último hombre sube +1 (la vía de los DEF)");
{
  const p = jugador(4, "DEF");
  const r = E.applyMomentumPostMatch(run, p, true, fakeMatch({ lastManStops: ["Tester"] }));
  assert(r.reasons.some(x => /último hombre/i.test(x.text)), "el corte se narra", JSON.stringify(r.reasons));
}
assert(aplica(jugador(4, "DEF"), true, fakeMatch({ lastManFouls: ["Tester"] })) === 3, "tarjeta/penal como último hombre baja −1");
{
  const p = jugador(4, "DEF");
  const r = E.applyMomentumPostMatch(run, p, true, fakeMatch({ lastManFouls: ["Tester"] }));
  assert(r.reasons.some(x => /tarjeta o penal/i.test(x.text)), "el error del último hombre se narra", JSON.stringify(r.reasons));
}
// El tope +1 acota la suma de señales: gol + asistencia + corte no dan más de +1 en un partido
assert(aplica(jugador(4, "MED"), true, fakeMatch({ scorers: [{ name: "Tester", min: 10 }], assists: [{ name: "Tester", min: 50 }], lastManStops: ["Tester"] })) === 5,
  "gol + asistencia + corte topan en +1 por partido (RISE_MAX)");
// Un corte y un error en el mismo partido se cancelan (raw 0 → decae hacia el neutro)
assert(aplica(jugador(4, "DEF"), true, fakeMatch({ lastManStops: ["Tester"], lastManFouls: ["Tester"] })) === 4,
  "un corte y un error se compensan: sin señal neta, queda en el neutro");

// ---------- decaimiento hacia el neutro (4) ----------
assert(aplica(jugador(6), true, fakeMatch()) === 5, "sin señal: decae hacia el neutro");
assert(aplica(jugador(2), true, fakeMatch()) === 3, "el decaimiento también sube al que está frío");
assert(aplica(jugador(4), true, fakeMatch()) === 4, "en el neutro sin señal no pasa nada");
assert(aplica(jugador(7), false, fakeMatch()) === 6, "el que no jugó decae");
assert(aplica(jugador(1), false, fakeMatch()) === 2, "el que no jugó decae hacia arriba si estaba helado");

// ---------- una lesión resetea el momento (decisión PO 18-jul) ----------
{
  const p = jugador(7); p.lesionadoPartidos = 2;
  const r = E.applyMomentumPostMatch(run, p, true, fakeMatch({ scorers: [{ name: "Tester", min: 30 }] }));
  assert(p.momento === 4, "el lesionado vuelve al neutro sin importar lo que hizo antes de caer", p.momento);
  assert(r.reasons.some(x => /lesión/i.test(x.text)), "el resumen explica que la lesión le cortó la forma");
}

// sustituido cuenta como participante (flow le pasa played=false porque ya no está en el once)
{
  const p = jugador(4);
  p.sustituido = true;
  E.applyMomentumPostMatch(run, p, false, fakeMatch({ scorers: [{ name: "Tester", min: 20 }] }));
  assert(p.momento === 5, "el sustituido también vivió el partido: su gol cuenta (+1)");
}

// ---------- arquero ----------
assert(aplica(jugador(4, "POR"), true, fakeMatch({ gOpp: 0 })) === 5, "arquero: valla invicta +1");
assert(aplica(jugador(4, "POR"), true, fakeMatch({ gOpp: 3 })) === 3, "arquero: 3+ goles en contra −1 (la derrota va a la Moral)");
assert(aplica(jugador(4, "POR"), true, fakeMatch({ gOpp: 1, pensAtajadosPor: ["Tester"] })) === 5, "arquero: penal atajado +1");
assert(aplica(jugador(2, "POR"), true, fakeMatch({ gOpp: 5 })) === 1, "arquero: goleada en contra baja −1 (2→1)");

// ---------- resumen devuelto (análisis del cuerpo técnico) ----------
{
  const p = jugador(4);
  const r = E.applyMomentumPostMatch(run, p, true, fakeMatch({ scorers: [{ name: "Tester", min: 12 }, { name: "Tester", min: 40 }] }));
  assert(r.before === 4 && r.after === 5 && r.delta === 1, "el resumen trae before/after/delta reales", JSON.stringify(r));
  const textos = r.reasons.map(x => x.text);
  assert(textos.some(t => /2 goles/.test(t)), "explica los goles");
  assert(!textos.some(t => /por partido/.test(t)), "ya NO avisa el tope de +1 (borrado a pedido del PO)", textos.join(" | "));
  assert(!textos.some(t => /ganó|perdió|victoria|derrota/i.test(t)), "el resumen del momento no habla del resultado (eso es Moral)");
}
{
  const r1 = E.applyMomentumPostMatch(run, jugador(6), true, fakeMatch());
  assert(r1.after === 5 && r1.reasons.some(x => /vuelve hacia lo normal/.test(x.text)), "el decaimiento se narra", JSON.stringify(r1));
  const r2 = E.applyMomentumPostMatch(run, jugador(6), false, fakeMatch());
  assert(r2.reasons.some(x => /No sumó minutos/.test(x.text)), "el que no jugó tiene su razón", JSON.stringify(r2));
  const r3 = E.applyMomentumPostMatch(run, jugador(4), false, fakeMatch());
  assert(r3.delta === 0 && r3.reasons.length === 0, "neutro sin jugar no genera ni cambio ni ruido");
}

// ---------- compat: runs guardadas antes del sprint ----------
{
  const p = { name: "Viejo", pos: "DEL", stats: {} }; // sin campo momento
  E.applyMomentumPostMatch(run, p, false, fakeMatch());
  assert(p.momento >= 1 && p.momento <= 7, "un jugador sin momento lo adquiere al primer cierre", p.momento);
}

console.log(`momentum.test: ${checks} checks · fallos: ${fails}`);
console.log(fails ? "❌ momentum con fallos" : "✅ momentum OK");
process.exit(fails ? 1 : 0);
