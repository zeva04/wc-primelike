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

// ---------- catálogo (A2: los 6 del roadmap + repliegue + la cara defensiva del córner) ----------
assert(E.SEQUENCE_TYPES.length === 8, "A2 completa el catálogo: 8 tipos", E.SEQUENCE_TYPES.length);
const sides = E.SEQUENCE_TYPES.map(t => t.side);
assert(sides.filter(s => s === "mine").length === 5, "5 tipos ofensivos (mine)", sides.join(","));
assert(sides.filter(s => s === "opp").length === 3, "3 tipos con iniciativa rival (opp)", sides.join(","));
for (const id of ["recuperacion", "circulacion", "transicion", "pelotazo", "balon_parado", "salida_fondo"]) {
  assert(E.sequenceType(id), `el tipo del roadmap existe: ${id}`);
}
assert(E.sequenceType("repliegue")?.side === "opp", "el repliegue de A1 sigue en el pool");
assert(E.sequenceType("balon_parado_def")?.side === "opp", "el balón parado tiene su cara defensiva");
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

// ---------- generación: respeta el objetivo 2-6 y el catálogo entero aparece ----------
{
  let sawGen = false, overshoot = false, sawLastMan = false;
  const seen = new Set();
  for (let t = 0; t < 60; t++) {
    const m = makeMatch(t % 2 ? "ARG" : "MAR");
    // Simular todos los ticks del partido resolviendo las secuencias al azar
    let guard = 0;
    while (!m.finished && guard++ < 500) {
      m.tick();
      if (m.seq) seen.add(m.seq.type.id);
      if (m.decision) {
        const d = m.decision;
        if (d.id === "last_man") sawLastMan = true;
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
  for (const t of E.SEQUENCE_TYPES) assert(seen.has(t.id), `el tipo ${t.id} aparece jugando (pesos > 0)`, [...seen].join(","));
  assert(sawLastMan, "el último hombre sigue apareciendo (absorbido en secuencias + pelotazo a la espalda)");
}

// ---------- A2: la salida bajo presión CONVIERTE en transición mía (def→of) ----------
{
  let converted = false, punished = false;
  for (let i = 0; i < 300 && !(converted && punished); i++) {
    const m = makeMatch("ARG");
    m.min = 30;
    E.startSequence(m, E.sequenceType("salida_fondo"));
    assert(m.seq.prot && m.my.lineup.includes(m.seq.prot), "la salida tiene MI protagonista (el que saca la pelota)");
    m.resolveSequenceAct("jugar"); // siempre la opción arriesgada
    if (m.seq && m.seq.type.id === "transicion") converted = true;     // rompió la presión
    else punished = true;                                              // la perdió (o cerró)
  }
  assert(converted, "salir jugando puede CONVERTIR la secuencia en una transición mía");
  assert(punished, "salir jugando también puede costar caro (no es gratis)");
  // Reventarla es siempre segura: cierra sin riesgo
  const m = makeMatch("ARG");
  m.min = 30;
  E.startSequence(m, E.sequenceType("salida_fondo"));
  const golesAntes = m.gOpp;
  m.resolveSequenceAct("despeje");
  assert(m.seq === null && m.gOpp === golesAntes, "reventarla cierra la secuencia sin riesgo");
}

// ---------- A3: contexto dinámico en la generación ----------
// Muestrea la generación bajo un estado dado: fuerza el plan a target infinito (pStart ≥ 1)
// y cuenta lados y tipos. La memoria "no repetir" se resetea por muestra para no sesgar.
function genSample(oppId, mut, n = 4000) {
  const m = makeMatch(oppId);
  m.min = 50;
  E.maybeStartSequence(m); // primera llamada: crea m._seqPlan (target/edge/prof cacheados)
  m._seqPlan.target = 1e9;
  mut?.(m);
  const out = { mine: 0, total: 0, types: {} };
  for (let i = 0; i < n; i++) {
    m.seq = null; m.decision = null; m._lastSeqType = null;
    if (!E.maybeStartSequence(m)) continue;
    out.total++;
    out.types[m._lastSeqType] = (out.types[m._lastSeqType] || 0) + 1;
    if (E.sequenceType(m._lastSeqType).side === "mine") out.mine++;
  }
  out.mineShare = out.mine / out.total;
  out.share = id => (out.types[id] || 0) / out.total;
  return out;
}

{
  const neutral = genSample("ARG");
  // Perder tarde: empuja el reparto (+0.07) y el fútbol se hace directo (transición/pelotazo ×1.5)
  const losing = genSample("ARG", m => { m.min = 80; m.gOpp = 1; });
  assert(losing.mineShare - neutral.mineShare > 0.03, "perder a los 80' vuelca el reparto hacia mí (+0.07)",
    `${neutral.mineShare.toFixed(3)} → ${losing.mineShare.toFixed(3)}`);
  const directo = s => s.share("transicion") + s.share("pelotazo");
  assert(directo(losing) > directo(neutral), "perder tarde sesga hacia el fútbol directo (×1.5)",
    `${directo(neutral).toFixed(3)} → ${directo(losing).toFixed(3)}`);
  // Ganar tarde: el rival empuja (−0.05) y crecen los repliegues (×1.4)
  const winning = genSample("ARG", m => { m.min = 80; m.gMy = 1; });
  assert(winning.mineShare - neutral.mineShare < -0.02, "ganar a los 80' le entrega iniciativa al rival (−0.05)",
    `${neutral.mineShare.toFixed(3)} → ${winning.mineShare.toFixed(3)}`);
  // Expulsados: cada roja inclina la cancha (±0.06)
  const oppDown = genSample("ARG", m => { m.oppLineup.filter(p => p.pos !== "POR").slice(0, 2).forEach(p => p.expulsado = true); });
  assert(oppDown.mineShare - neutral.mineShare > 0.06, "dos rojas rivales inclinan la cancha hacia mí (+0.12)",
    `${neutral.mineShare.toFixed(3)} → ${oppDown.mineShare.toFixed(3)}`);
  // Fatiga: el equipo fundido no presiona (recuperación ×0.6) y revienta (pelotazo ×1.4)
  const tired = genSample("ARG", m => m.my.lineup.forEach(p => p.energia = 30));
  assert(tired.share("pelotazo") > neutral.share("pelotazo"), "la fatiga empuja al pelotazo (×1.4)",
    `${neutral.share("pelotazo").toFixed(3)} → ${tired.share("pelotazo").toFixed(3)}`);
  assert(tired.share("recuperacion") < neutral.share("recuperacion"), "el equipo fundido no presiona (×0.6)",
    `${neutral.share("recuperacion").toFixed(3)} → ${tired.share("recuperacion").toFixed(3)}`);
}

// Memoria de secuencias: el generador nunca repite tipo dos veces seguidas
{
  const m = makeMatch("ARG");
  m.min = 50;
  E.maybeStartSequence(m);
  m._seqPlan.target = 1e9;
  let prev = null, repeats = 0, gen = 0;
  for (let i = 0; i < 800; i++) {
    m.seq = null; m.decision = null;
    if (!E.maybeStartSequence(m)) continue;
    gen++;
    if (m._lastSeqType === prev) repeats++;
    prev = m._lastSeqType;
  }
  assert(gen > 500, "la muestra de generación es real", gen);
  assert(repeats === 0, "nunca sale el mismo tipo dos veces seguidas", `${repeats}/${gen}`);
}

// ---------- A3: [MORAL → OCASIONES] — la Moral sesga el TIPO, no el número ----------
{
  const moralVal = band => { for (let v = 1; v <= 100; v++) if (E.moraleBand(v).id === band) return v; };
  const withMoral = band => genSample("ARG", m => { m.my.moral = moralVal(band); });
  const estable = withMoral("estable"), nubes = withMoral("nubes"), suelo = withMoral("suelo");
  const valiente = s => s.share("recuperacion") + s.share("transicion");
  assert(valiente(nubes) > valiente(estable), "en las nubes el equipo se anima (recuperación/transición ×1.5)",
    `${valiente(estable).toFixed(3)} → ${valiente(nubes).toFixed(3)}`);
  assert(suelo.share("pelotazo") > estable.share("pelotazo"), "por el suelo el equipo revienta (pelotazo ×1.5)",
    `${estable.share("pelotazo").toFixed(3)} → ${suelo.share("pelotazo").toFixed(3)}`);
  assert(suelo.share("recuperacion") < estable.share("recuperacion"), "por el suelo no presiona (recuperación ×0.6)",
    `${estable.share("recuperacion").toFixed(3)} → ${suelo.share("recuperacion").toFixed(3)}`);
}

// ---------- A3: Momento → protagonista (pondera QUIÉN, nunca el éxito) ----------
{
  assert(Math.abs(E.protMomentum({ momento: 7 }) - 1.36) < 1e-9 && Math.abs(E.protMomentum({ momento: 1 }) - 0.64) < 1e-9,
    "protMomentum: 7 → 1.36× · 1 → 0.64×");
  assert(E.protMomentum({}) === 1, "sin Momento (rivales) el factor es neutro");
  const m = makeMatch();
  const cands = m.activeMine().filter(p => p.pos !== "POR");
  const star = cands[0];
  const count = n => { let c = 0; for (let i = 0; i < n; i++) { E.startSequence(m, E.sequenceType("circulacion")); if (m.seq.prot === star) c++; m.seq = null; m.decision = null; } return c; };
  cands.forEach(p => p.momento = 4);
  const base = count(3000);
  star.momento = 7; cands.slice(1).forEach(p => p.momento = 1);
  const hot = count(3000);
  assert(hot > base * 1.2, "el encendido protagoniza más que en la base (y los apagados se esconden)",
    `base=${base} hot=${hot}`);
}

// ---------- A3: posesión y momentum DERIVADOS (flow) + relato ambiente contextual ----------
{
  const m = makeMatch();
  assert(m.flow().pos === 50 && m.flow().net === 0, "sin nada generado, la posesión arranca 50/50 y sin momentum");
  m.min = 20;
  m._flow.push({ min: 10, side: "mine", w: 3 }, { min: 20, side: "mine", w: 3 });
  const f1 = m.flow();
  assert(f1.pos > 50 && f1.net === 6, "lo generado mío empuja posesión y momentum", JSON.stringify(f1));
  m.min = 40; // la ventana de momentum son los últimos 15': lo viejo pesa en posesión, no en net
  const f2 = m.flow();
  assert(f2.pos === f1.pos && f2.net === 0, "el momentum olvida (ventana 15'), la posesión no", JSON.stringify(f2));
  m._flow.push({ min: 40, side: "opp", w: 3 });
  assert(m.flow().net === -3, "lo generado del rival resta momentum", m.flow().net);

  // El pool ambiente: esquema sano y líneas que siempre devuelven texto
  assert(E.AMBIENT_LINES.length >= 15, "el pool ambiente tiene volumen (≥15 líneas)", E.AMBIENT_LINES.length);
  for (const l of E.AMBIENT_LINES) assert(typeof l.when === "function" && l.w > 0 && typeof l.text === "function", "línea ambiente bien formada");
  const states = [m2 => {}, m2 => { m2.min = 80; m2.gOpp = 2; }, m2 => { m2.min = 80; m2.gMy = 1; }, m2 => { m2.my.lineup[3].expulsado = true; }, m2 => m2.my.lineup.forEach(p => p.energia = 20)];
  for (const setup of states) {
    const m2 = makeMatch(); m2.min = 50; setup(m2);
    for (let i = 0; i < 40; i++) {
      const line = m2._ambientLine();
      assert(typeof line === "string" && line.length > 0, "el ambiente siempre narra algo", line);
    }
  }
  // Perdiendo tarde, el relato contextual domina: alguna línea de urgencia tiene que salir
  const m3 = makeMatch(); m3.min = 80; m3.gOpp = 1;
  let urgent = false;
  for (let i = 0; i < 120 && !urgent; i++) {
    const line = m3._ambientLine();
    if (line.includes("vuelca al ataque") || line.includes("ahora o nunca")) urgent = true;
  }
  assert(urgent, "perdiendo a los 80' el relato lee el partido (línea de urgencia)");
}

// ---------- Mejoras 22-jul: el que pasa SE DESPRENDE de la pelota ----------
{
  const m = makeMatch();
  m.min = 20;
  E.startSequence(m, E.sequenceType("circulacion"));
  const p0 = m.seq.prot;
  m.resolveSequenceAct("seguro"); // el pase seguro siempre progresa
  assert(m.seq && m.seq.prot !== p0, "tras un pase la pelota cambia de protagonista", m.seq?.prot?.name);
  assert(m.seq.assistFrom === p0, "el pasador queda como asistidor potencial del que sigue");

  const m2 = makeMatch();
  m2.min = 20;
  E.startSequence(m2, E.sequenceType("transicion"));
  const q0 = m2.seq.prot;
  m2.resolveSequenceAct("pase"); // pase al pie: seguro, también se desprende
  assert(m2.seq && m2.seq.prot !== q0, "el pase al pie también cambia de pies la pelota");
}

console.log(`sequences.test: ${checks} checks · fallos: ${fails}`);
console.log(fails ? "❌ sequences con fallos" : "✅ sequences OK");
process.exit(fails ? 1 : 0);
