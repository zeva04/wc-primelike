/* ============================================================
   Tests del MATCH MOMENTUM (game/match/match-momentum.js).

   El test que más importa es el ÚLTIMO: el momentum es una SALIDA
   del simulador y no puede influirlo. Se verifica de tres formas
   que no admiten discusión — contando tiradas de azar (cero),
   fotografiando el estado que el simulador lee (intacto) y
   comprobando que el botón de presión deja marca pero no puntos.

   Uso: node tests/match-momentum.test.js
   ============================================================ */
import { loadEngine } from "./load-engine.js";

const { Engine: E } = await loadEngine();

let fails = 0, checks = 0;
const assert = (cond, msg, ctx) => { checks++; if (!cond) { fails++; console.error("FAIL:", msg, ctx ?? ""); } };

function makeMatch(teamId = "BRA", oppId = "MAR") {
  const run = E.newRun(teamId);
  const { lineup } = E.currentLineup(run.squad, null, null);
  const bench = run.squad.filter(p => !lineup.includes(p) && !p.suspendido && p.lesionadoPartidos === 0);
  return new E.Match({ team: E.getTeam(teamId), lineup, bench, mentalidad: "normal", buffs: {}, moral: 50 }, E.getTeam(oppId), false, []);
}

function jugar(m) {
  let g = 0;
  while (!m.finished && g++ < 400) {
    m.tick();
    if (m.decision) {
      const d = m.decision;
      if (d.id === "sequence") m.resolveSequenceAct(d.options[Math.floor(Math.random() * d.options.length)].key);
      else m.decision = null;
    }
  }
  return m;
}

// ---------- el modelo: rango, signo y decaimiento ----------
{
  const m = makeMatch();
  assert(m.mm.now === 0, "el partido arranca equilibrado (0)");
  assert(m.mm.bars.length === 0, "sin barras antes de jugar");

  E.noteMomentum(m, "gol");
  assert(m.mm.now === E.MM_W.gol, "un gol mío empuja hacia mi lado", m.mm.now);
  E.noteMomentum(m, "gol", "opp");
  assert(m.mm.now === 0, "un gol suyo lo empuja igual y opuesto", m.mm.now);

  // El pase seguro pesa 0 a propósito: diez laterales no son una jugada
  const antes = m.mm.now;
  for (let i = 0; i < 10; i++) E.noteMomentum(m, "paseSeguro");
  assert(m.mm.now === antes, "diez pases laterales no mueven la aguja", m.mm.now);

  // Techo y piso
  for (let i = 0; i < 40; i++) E.noteMomentum(m, "gol");
  assert(m.mm.now === E.MM_MAX, "no se pasa de +100", m.mm.now);
  for (let i = 0; i < 90; i++) E.noteMomentum(m, "gol", "opp");
  assert(m.mm.now === -E.MM_MAX, "no baja de -100", m.mm.now);
}

// ---------- la ventana móvil: un pico se apaga solo ----------
{
  const m = makeMatch();
  m.min = 10;
  E.noteMomentum(m, "gol");
  const pico = m.mm.now;
  for (let i = 0; i < 5; i++) { m.min++; E.closeMinute(m); }
  assert(m.mm.now < pico * 0.4, "cinco minutos después, el pico ya casi no pesa (ventana ~5')",
    `${pico.toFixed(1)} → ${m.mm.now.toFixed(1)}`);
  assert(m.mm.now > 0, "pero no se borra de golpe", m.mm.now);
  // Y sin eventos nuevos tiende a cero, no a un dominio eterno
  for (let i = 0; i < 25; i++) { m.min++; E.closeMinute(m); }
  assert(Math.abs(m.mm.now) < 0.5, "sin juego, el momentum vuelve al equilibrio", m.mm.now);
}

// ---------- la barra guarda el PROMEDIO del minuto, no su último valor ----------
{
  const m = makeMatch();
  m.min = 20;
  E.noteMomentum(m, "remate");        // now = 8
  E.noteMomentum(m, "remate", "opp"); // now = 0  → promedio de (8, 0) = 4
  E.closeMinute(m);
  const b = m.mm.bars.at(-1);
  assert(Math.abs(b.val - 4) < 1e-9, "la barra es el promedio del minuto, no el valor final", b.val);
  assert(b.min === 20, "la barra sabe a qué minuto pertenece", b.min);
}

// ---------- las marcas viajan con su minuto ----------
{
  const m = makeMatch();
  m.min = 33;
  E.markMomentum(m, "⚽");
  E.markMomentum(m, "⚽");   // idempotente: no se duplica la misma marca en un minuto
  E.markMomentum(m, "🟥");
  E.closeMinute(m);
  const b = m.mm.bars.at(-1);
  assert(b.marks.length === 2, "la misma marca no se repite en el minuto", b.marks.join(""));
  assert(b.marks.includes("⚽") && b.marks.includes("🟥"), "las marcas llegan a la barra", b.marks.join(""));
  E.closeMinute(m);
  assert(m.mm.bars.at(-1).marks.length === 0, "y no se arrastran al minuto siguiente");
}

// ---------- partidos enteros producen un gráfico sano ----------
// Se miden VARIOS partidos y se afirma sobre el agregado: medido en 400 partidos, el
// relieve por partido va de 14% a 91% (mediana 53%) y un 4% de los partidos no tiene
// NINGUNA marca (ni gol ni tarjeta ni cambio). Afirmar sobre un solo partido era un
// test flaky — y lo fue: saltó 1 de cada ~30 corridas.
{
  const muestras = [];
  for (let i = 0; i < 8; i++) {
    const m = jugar(makeMatch(i % 2 ? "BRA" : "NZL", i % 2 ? "MAR" : "BRA"));
    const bars = E.momentumBars(m);
    assert(bars.length >= 90, "un partido deja al menos 90 barras (90' + descuento)", bars.length);
    assert(bars.every(b => b.h >= 0 && b.h <= 1), "todas las alturas están normalizadas 0..1");
    muestras.push({
      relieve: bars.filter(b => b.h > 0.02).length / bars.length,
      marcas: bars.reduce((s, b) => s + b.marks.length, 0),
      golesGrafico: bars.reduce((s, b) => s + b.marks.filter(x => x === "⚽").length, 0),
      goles: m.gMy + m.gOpp,
      dosLados: bars.some(b => b.mine) && bars.some(b => !b.mine),
    });
  }
  const media = k => muestras.reduce((s, x) => s + x[k], 0) / muestras.length;
  assert(media("relieve") > 0.3, "el gráfico no queda muerto: la mitad de los minutos tiene relieve",
    (media("relieve") * 100).toFixed(0) + "%");
  // Que el gráfico va para los DOS lados es una propiedad del sistema, no de cada partido:
  // un favorito puede dominar 90 minutos sin que el rival le gane un solo minuto promedio.
  assert(muestras.some(x => x.dosLados), "el gráfico va para los dos lados",
    muestras.map(x => x.dosLados ? "2" : "1").join(""));
  assert(media("marcas") > 1, "aparecen marcas de eventos sobre el gráfico", media("marcas").toFixed(1));
  // Los goles dejan marca. `<=` y no `===` porque las marcas se DEDUPLICAN por minuto:
  // dos goles en el mismo minuto comparten un ⚽ (ver markMomentum).
  for (const x of muestras) {
    assert(x.golesGrafico <= x.goles, "nunca hay más marcas de gol que goles", `${x.golesGrafico}/${x.goles}`);
    if (x.goles > 0) assert(x.golesGrafico > 0, "si hubo goles, hay marca", `${x.golesGrafico}/${x.goles}`);
  }
}

// ---------- un gol ANULADO por el VAR no deja ni puntos ni marca ----------
{
  const m = makeMatch();
  m.min = 30;
  // Se fuerza la anulación pisando el azar: 0.05 entra al VAR (<0.12) y anula (<0.3).
  const real = Math.random;
  Math.random = () => 0.05;
  const antesGol = m.mm.now, antesMarcas = m.mm._marks.length;
  E.goalMine(m, m.my.lineup[4], "test", undefined, true);
  Math.random = real;
  assert(m.gMy === 0, "el VAR anuló el gol (precondición del test)", m.gMy);
  assert(m.mm.now === antesGol, "un gol anulado NO empuja el momentum", m.mm.now);
  assert(m.mm._marks.length === antesMarcas, "un gol anulado NO deja marca ⚽", m.mm._marks.join(""));
}

// ---------- el asistente lee tendencias, no números ----------
{
  const m = makeMatch();
  m.min = 40;
  // Cinco minutos de dominio claro mío
  for (let i = 0; i < 6; i++) { m.min++; E.noteMomentum(m, "gol"); E.closeMinute(m); }
  assert(E.momentumTrend(m, 5) > 22, "la tendencia detecta el dominio", E.momentumTrend(m, 5).toFixed(1));
  const linea = E.assistantLine(m);
  assert(typeof linea === "string" && linea.length > 10, "el asistente dice algo", linea);
  assert(!/\d/.test(linea), "el asistente NUNCA muestra números", linea);
  // Y respeta el silencio mínimo
  m.min++;
  assert(E.assistantLine(m) === null, "no habla dos minutos seguidos");
  m.min += E.MM_TALK_EVERY;
  assert(typeof E.assistantLine(m) === "string", "vuelve a hablar pasado el intervalo");
}

// ---------- 🔒 LA REGLA DE ORO: el momentum NO influye en el simulador ----------
{
  // (1) Ni una sola tirada de azar. `core/rng` es el ÚNICO punto de azar del juego y todo
  // él sale de Math.random (ARQUITECTURA §1.1), así que contar Math.random cuenta TODO —
  // y no depende de poder parchear un namespace de módulo (que es inmutable).
  const real = Math.random;
  let llamadas = 0;
  Math.random = () => { llamadas++; return real(); };

  const m = makeMatch();
  llamadas = 0;
  for (let i = 0; i < 200; i++) {
    E.noteMomentum(m, "gol");
    E.noteMomentum(m, "remate", "opp");
    E.markMomentum(m, "⚽");
    E.closeMinute(m);
    E.momentumTrend(m);
    E.momentumBars(m);
    m.min++;
    E.assistantLine(m);
  }
  Math.random = real;
  assert(llamadas === 0, "el Match Momentum no consume NI UNA tirada de azar", llamadas);

  // (2) No escribe nada que el simulador lea: todo vive en `m.mm`.
  const m2 = makeMatch();
  const foto = JSON.stringify({
    min: m2.min, gMy: m2.gMy, gOpp: m2.gOpp, stats: m2.stats, tally: m2.tally,
    feed: m2.feed.length, decision: m2.decision, seq: m2.seq, press: m2.press, flow: m2._flow.length,
  });
  E.noteMomentum(m2, "gol");
  E.noteMomentum(m2, "contraataque", "opp");
  E.markMomentum(m2, "🟥");
  E.closeMinute(m2);
  const foto2 = JSON.stringify({
    min: m2.min, gMy: m2.gMy, gOpp: m2.gOpp, stats: m2.stats, tally: m2.tally,
    feed: m2.feed.length, decision: m2.decision, seq: m2.seq, press: m2.press, flow: m2._flow.length,
  });
  assert(foto === foto2, "el momentum no toca NADA del estado que lee el simulador");

  // (3) El botón de presión deja MARCA pero no puntos (pedido explícito del PO).
  const m3 = makeMatch();
  m3.min = 20;
  const antes = m3.mm.now;
  assert(E.startPress(m3), "la presión se enciende");
  assert(m3.mm.now === antes, "presionar NO sube el momentum por sí solo", m3.mm.now);
  assert(m3.mm._marks.includes("🔥"), "pero sí deja su marca en el gráfico", m3.mm._marks.join(""));
}

console.log(`match-momentum.test: ${checks} checks · fallos: ${fails}`);
console.log(fails ? "❌ match momentum con fallos" : "✅ match momentum OK");
process.exit(fails ? 1 : 0);
