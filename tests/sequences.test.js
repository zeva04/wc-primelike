/* ============================================================
   Tests de la capa de secuencias (Sprint A1):
   - catálogo content/sequences.js (3 tipos, esquema, sides)
   - Football Actions game/match/actions.js (bien formadas y
     monótonas en la stat que las rige)
   - la máquina game/match/sequences.js: arranca, avanza multi-acto
     y CIERRA sin loops; respeta el objetivo 2-6; protagonista por
     lado; el contrato §3.2 de la decisión `sequence`
   Uso: node tests/sequences.test.js
   ============================================================ */
import { loadEngine } from "./load-engine.js";

const { Engine: E } = await loadEngine();

let fails = 0, checks = 0;
const assert = (cond, msg, ctx) => { checks++; if (!cond) { fails++; console.error("FAIL:", msg, ctx ?? ""); } };

/** Un Match real BRA vs un rival, con once automático (como el smoke y las pantallas). */
function makeMatch(oppId = "MAR") {
  const run = E.newRun("BRA");
  const me = E.getTeam("BRA"), opp = E.getTeam(oppId);
  const available = run.squad.filter(p => !p.suspendido && p.lesionadoPartidos === 0);
  const { lineup } = E.currentLineup(run.squad, null, null);
  const bench = available.filter(p => !lineup.includes(p));
  return new E.Match({ team: me, lineup, bench, mentalidad: "normal", buffs: {} }, opp, false, []);
}

// ---------- catálogo ----------
assert(E.SEQUENCE_TYPES.length === 3, "A1 arranca con 3 tipos de secuencia", E.SEQUENCE_TYPES.length);
const sides = E.SEQUENCE_TYPES.map(t => t.side);
assert(sides.filter(s => s === "mine").length === 2, "2 tipos ofensivos (mine)");
assert(sides.filter(s => s === "opp").length === 1, "1 tipo defensivo (opp)");
for (const t of E.SEQUENCE_TYPES) {
  assert(typeof t.id === "string" && t.name && t.icon, "tipo con id/name/icon", t.id);
  assert(Array.isArray(t.plan) && t.plan.length >= 1 && t.plan.length <= 3, "plan de 1 a 3 actos", `${t.id}: ${t.plan}`);
  assert(t.protWeight && typeof t.protWeight === "object", "tipo con protWeight", t.id);
}
assert(E.sequenceType("circulacion")?.side === "mine", "sequenceType encuentra por id");
assert(E.sequenceType("no-existe") === undefined, "sequenceType devuelve undefined para basura");

// ---------- Football Actions: bien formadas y monótonas ----------
{
  const m = makeMatch();
  const p = m.activeMine().find(x => x.pos !== "POR");
  const rate = (fn, n = 4000) => { let ok = 0; for (let i = 0; i < n; i++) if (fn().ok) ok++; return ok / n; };

  // actPass: mejor pase → más completa. Se varía SOLO la stat, el resto constante → monótono.
  const pase0 = p.stats.pase;
  p.stats.pase = 20; const passLo = rate(() => E.actPass(m, p));
  p.stats.pase = 90; const passHi = rate(() => E.actPass(m, p));
  p.stats.pase = pase0;
  assert(passHi > passLo, "actPass es monótona en el Pase", `lo=${passLo.toFixed(2)} hi=${passHi.toFixed(2)}`);
  assert(passLo >= 0 && passHi <= 1, "actPass devuelve una probabilidad válida");

  // actShot: mejor tiro → más gol. El remate de definición supera al ambiente a igual stat.
  const tiro0 = p.stats.tiro;
  p.stats.tiro = 20; const shotLo = rate(() => E.actShot(m, p));
  p.stats.tiro = 90; const shotHi = rate(() => E.actShot(m, p));
  const shotBonus = rate(() => E.actShot(m, p, { bonus: 0.15 }));
  const shotPlain = rate(() => E.actShot(m, p));
  p.stats.tiro = tiro0;
  assert(shotHi > shotLo, "actShot es monótona en el Tiro", `lo=${shotLo.toFixed(2)} hi=${shotHi.toFixed(2)}`);
  assert(shotBonus > shotPlain, "el bonus de construcción mejora el remate");

  // actDribble: devuelve ok/foul; el foul (penal) es una fracción chica
  let foul = 0; for (let i = 0; i < 4000; i++) if (E.actDribble(m, p).foul) foul++;
  assert(foul / 4000 > 0.02 && foul / 4000 < 0.25, "actDribble gana falta a veces (no siempre, no nunca)", (foul / 4000).toFixed(2));

  // actContain: la presión corta MENOS que contener (más riesgo), ambas suben con la defensa
  const { mine } = m.powers();
  const contain = rate(() => E.actContain(m, mine, { press: false }));
  const press = rate(() => E.actContain(m, mine, { press: true }));
  assert(contain > press, "contener corta más que presionar (la presión arriesga)", `contener=${contain.toFixed(2)} presionar=${press.toFixed(2)}`);
}

// ---------- la máquina: arranca, avanza y CIERRA ----------
{
  const m = makeMatch();
  m.min = 20;
  E.startSequence(m, E.sequenceType("circulacion"));
  assert(m.seq && m.seq.type.id === "circulacion", "startSequence deja una secuencia en curso");
  assert(m.decision && m.decision.id === "sequence", "crea la decisión `sequence` (contrato §3.2)", m.decision?.id);
  assert(m.decision.title && m.decision.text && m.decision.options.length >= 2, "la decisión tiene título, texto y opciones");
  assert(m.seq.prot && m.seq.prot.pos !== "POR", "el protagonista ofensivo es un jugador de campo mío");

  // Resolver actos al azar hasta cerrar: debe terminar en pocos pasos (1-3 actos) sin loop.
  let steps = 0;
  while (m.seq && steps++ < 20) {
    if (!m.decision) break; // un acto auto (no debería en circulación)
    assert(m.seq.actIdx < m.seq.type.plan.length, "actIdx nunca excede el plan", `${m.seq.actIdx}/${m.seq.type.plan.length}`);
    const opt = m.decision.options[Math.floor(Math.random() * m.decision.options.length)];
    m.resolveSequenceAct(opt.key);
  }
  assert(m.seq === null, "la secuencia cierra (no queda colgada)", `steps=${steps}`);
  assert(steps <= 4, "una secuencia se resuelve en pocos actos (1-3)", `steps=${steps}`);
}

// Secuencia defensiva: protagonista rival, y el desenlace no explota
{
  const m = makeMatch();
  m.min = 30;
  E.startSequence(m, E.sequenceType("repliegue"));
  assert(m.seq.shooter && m.oppLineup.includes(m.seq.shooter), "el atacante de un repliegue es un rival");
  let steps = 0;
  while (m.seq && steps++ < 20) {
    if (!m.decision) { m.resolveSequenceAct(null); continue; } // acto auto (remate rival)
    const opt = m.decision.options[Math.floor(Math.random() * m.decision.options.length)];
    m.resolveSequenceAct(opt.key);
  }
  assert(m.seq === null, "el repliegue cierra sin quedar colgado");
}

// ---------- generación: respeta el objetivo 2-6 ----------
{
  let sawGen = false, overshoot = false;
  for (let t = 0; t < 40; t++) {
    const m = makeMatch(t % 2 ? "ARG" : "MAR");
    // Simular todos los ticks del partido resolviendo las secuencias al azar
    let guard = 0;
    while (!m.finished && guard++ < 500) {
      m.tick();
      if (m.decision) {
        const d = m.decision;
        if (d.id === "sequence") { sawGen = true; m.resolveSequenceAct(d.options[Math.floor(Math.random() * d.options.length)].key); }
        else m.decision = null; // penales/último hombre/etc: no es el foco de este test
      }
    }
    const plan = m._seqPlan;
    if (plan) {
      assert(plan.target >= E.SEQ_MIN && plan.target <= E.SEQ_MAX, "el objetivo cae en [2,6]", plan.target);
      if ((m._seqCount || 0) > plan.target) overshoot = true;
    }
  }
  assert(sawGen, "el partido genera secuencias por sí solo");
  assert(!overshoot, "nunca se pasa del objetivo de secuencias del partido");
}

console.log(`sequences.test: ${checks} checks · fallos: ${fails}`);
console.log(fails ? "❌ sequences con fallos" : "✅ sequences OK");
process.exit(fails ? 1 : 0);
