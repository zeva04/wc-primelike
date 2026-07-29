/* ============================================================
   Tests del panel de Estadísticas del partido (game/match/stats,
   pedido del PO 28-jul-2026):
   - las 4 estadísticas existen y salen coherentes de un partido real
   - el % de pase respeta a quién juega mejor (no es un número suelto)
   - los córners REALES (balón parado en contra) entran al conteo
   - el volumen simulado NO consume rnd(): el balance queda intacto
   Uso: node tests/stats.test.js
   ============================================================ */
import { loadEngine } from "./load-engine.js";

const { Engine: E } = await loadEngine();

let fails = 0, checks = 0;
const assert = (cond, msg, ctx) => { checks++; if (!cond) { fails++; console.error("FAIL:", msg, ctx ?? ""); } };

/** Un partido real jugado entero, resolviendo las secuencias al azar (como el smoke). */
function jugar(teamId = "BRA", oppId = "MAR") {
  const run = E.newRun(teamId);
  const { lineup } = E.currentLineup(run.squad, null, null);
  const bench = run.squad.filter(p => !lineup.includes(p) && !p.suspendido && p.lesionadoPartidos === 0);
  const m = new E.Match({ team: E.getTeam(teamId), lineup, bench, mentalidad: "normal", buffs: {}, moral: 50 }, E.getTeam(oppId), false, []);
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

// ---------- las 4 estadísticas del panel ----------
{
  const m = jugar();
  const rows = E.matchStats(m);
  assert(rows.length === 4, "el panel sirve 4 estadísticas", rows.length);
  assert(rows.map(r => r.id).join(",") === "pos,tiros,pases,corners",
    "en el orden que pidió el PO: posesión, tiros, pases, córners", rows.map(r => r.id).join(","));
  for (const r of rows) {
    assert(typeof r.mine === "number" && typeof r.opp === "number", `${r.id} sirve números para la barra`);
    assert(Array.isArray(r.txt) && r.txt.length === 2, `${r.id} sirve los dos textos ya formateados`);
  }
  const [pos, tiros, pases, corners] = rows;
  assert(pos.mine + pos.opp === 100, "la posesión reparte exactamente 100", `${pos.mine}/${pos.opp}`);
  assert(tiros.mine === m.stats.misTiros && tiros.opp === m.stats.oppTiros,
    "los tiros son los del motor, no una cuenta paralela");
  assert(pases.mine > 40 && pases.mine < 100, "el % de pase propio cae en un rango de fútbol", pases.mine);
  assert(pases.opp > 40 && pases.opp < 100, "el % de pase rival cae en un rango de fútbol", pases.opp);
  assert(corners.mine + corners.opp > 0, "un partido entero produce córners", `${corners.mine}/${corners.opp}`);
}

// ---------- volumen y rangos sobre muchos partidos ----------
{
  let tiros = 0, corners = 0, pases = 0, n = 30;
  for (let i = 0; i < n; i++) {
    const m = jugar();
    const [, t, p, c] = E.matchStats(m);
    tiros += t.mine + t.opp; corners += c.mine + c.opp; pases += p.mine;
  }
  const porPartido = x => x / n;
  assert(porPartido(corners) > 3 && porPartido(corners) < 14,
    "los córners por partido son de fútbol (3-14)", porPartido(corners).toFixed(1));
  assert(porPartido(pases) > 55 && porPartido(pases) < 95,
    "la precisión de pase media es de fútbol (55-95%)", porPartido(pases).toFixed(1));
  assert(porPartido(tiros) > 2, "hay tiros en el panel", porPartido(tiros).toFixed(1));
}

// ---------- el % de pase LEE a los jugadores (no es un adorno) ----------
{
  const m = jugar();
  const antes = E.matchStats(m)[2].mine;
  // Mismo partido, mismo acumulado: si el pase de los míos fuera irrelevante, tocar la
  // stat no cambiaría nada. Se rehace el acumulado con el once arruinado.
  const m2 = jugar();
  for (const p of m2.my.lineup) p.stats.pase = 20;
  m2.tally = E.newTally();
  for (let i = 0; i < 30; i++) E.tickStats(m2, m2.powers().mine, m2.powers().opp);
  const malos = E.matchStats(m2)[2].mine;
  assert(malos < antes, "un once que no sabe pasar completa menos pases", `${malos} vs ${antes}`);
}

// ---------- el córner REAL del balón parado en contra entra al conteo ----------
{
  const m = jugar();
  const antes = m.tally.corners.opp;
  E.startSequence(m, E.sequenceType("balon_parado_def"));
  assert(m.tally.corners.opp === antes + 1, "el balón parado en contra cuenta como córner rival",
    `${antes} → ${m.tally.corners.opp}`);
}

// ---------- el volumen simulado de PASES no toca el RNG (el balance no se mueve) ----------
{
  const m = jugar();
  m.tally = E.newTally();
  // tickStats sí sortea los córners (2 tiradas); lo que NO puede sortear es el volumen de
  // pases, que es determinista a propósito — si no, el panel le movería diales al motor.
  const a = { ...m.tally.pases.mine };
  E.tickStats(m, m.powers().mine, m.powers().opp);
  const b = { ...m.tally.pases.mine };
  const m2 = jugar();
  m2.tally = E.newTally();
  m2.min = m.min; m2.my = m.my; m2._flow = m._flow;
  E.tickStats(m2, m.powers().mine, m.powers().opp);
  assert(Math.abs(m2.tally.pases.mine.ok - (b.ok - a.ok)) < 1e-9,
    "el mismo estado produce el mismo volumen de pases (determinista, sin rnd)",
    `${m2.tally.pases.mine.ok} vs ${b.ok - a.ok}`);
}

console.log(`stats.test: ${checks} checks · fallos: ${fails}`);
console.log(fails ? "❌ stats con fallos" : "✅ estadísticas del partido OK");
process.exit(fails ? 1 : 0);
