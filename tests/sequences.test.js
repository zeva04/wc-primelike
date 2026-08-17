/* ============================================================
   Tests de la capa de secuencias (Sprint A1):
   - catálogo content/match/sequences.js (3 tipos, esquema, sides)
   - Football Actions game/match/actions.js (bien formadas y
     monótonas en la stat que las rige)
   - la máquina game/match/sequences.js: arranca, avanza multi-acto
     y CIERRA sin loops; respeta el objetivo 5-9; protagonista por
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
assert(E.SEQUENCE_TYPES.length === 16, "catálogo: 12 base (Odisea + las 2 del Territorio + el cambio de frente) + 4 avanzadas", E.SEQUENCE_TYPES.length);
const sides = E.SEQUENCE_TYPES.map(t => t.side);
assert(sides.filter(s => s === "mine").length === 12, "12 tipos ofensivos (mine)", sides.join(","));
assert(sides.filter(s => s === "opp").length === 4, "4 tipos con iniciativa rival (opp)", sides.join(","));
// Las 4 AVANZADAS (M2): una por filosofía, con sus datos de desenlace
{
  const advs = E.SEQUENCE_TYPES.filter(t => t.advFor);
  assert(advs.length === 4, "hay exactamente 4 secuencias avanzadas", advs.map(t => t.id).join(","));
  for (const filo of ["press", "posesion", "contra", "bloque"]) {
    assert(E.ADVANCED_BY_FILO[filo], `la filosofía ${filo} tiene su avanzada`);
    assert(E.ADVANCED_BY_FILO[filo].adv, `la avanzada de ${filo} declara sus números en \`adv\` (datos, no lógica)`);
  }
  assert(E.ADVANCED_BY_FILO.bloque.side === "opp", "la fortaleza es la única avanzada DEFENSIVA (castiga desde la trinchera)");
}
for (const id of ["recuperacion", "circulacion", "transicion", "pelotazo", "balon_parado", "salida_fondo"]) {
  assert(E.sequenceType(id), `el tipo del roadmap existe: ${id}`);
}
assert(E.sequenceType("repliegue")?.side === "opp", "el repliegue de A1 sigue en el pool");
assert(E.sequenceType("balon_parado_def")?.side === "opp", "el balón parado tiene su cara defensiva");
for (const t of E.SEQUENCE_TYPES) {
  assert(typeof t.id === "string" && t.name && t.icon, "tipo con id/name/icon", t.id);
  // 1-3 actos para los tipos base (Bible §7); la sinfonía avanzada estira a 4 (M2, y su
  // versión Consolidada monta el 5º por plan propio — mismo mecanismo del viejo rasgo).
  assert(Array.isArray(t.plan) && t.plan.length >= 1 && t.plan.length <= (t.advFor ? 4 : 3), "plan con actos en rango", `${t.id}: ${t.plan}`);
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
  const pase0 = p.stats.pase_corto;
  p.stats.pase_corto = 20; const passLo = rate(() => E.actPass(m, p));
  p.stats.pase_corto = 90; const passHi = rate(() => E.actPass(m, p));
  p.stats.pase_corto = pase0;
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

// ---------- generación: respeta el objetivo 5-9 y el catálogo entero aparece ----------
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
      assert(plan.target >= E.SEQ_MIN && plan.target <= E.SEQ_MAX, `el objetivo cae en [${E.SEQ_MIN},${E.SEQ_MAX}]`, plan.target);
      if ((m._seqCount || 0) > plan.target) overshoot = true;
    }
  }
  assert(sawGen, "el partido genera secuencias por sí solo");
  assert(!overshoot, "nunca se pasa del objetivo de secuencias del partido");
  // Sin filosofía en el ctx, el catálogo BASE aparece entero — y las avanzadas JAMÁS
  // (M2: su peso nace en 0 y solo applyFiloWeights se lo da al dueño con nivel ≥1).
  for (const t of E.SEQUENCE_TYPES.filter(t => !t.advFor)) assert(seen.has(t.id), `el tipo ${t.id} aparece jugando (pesos > 0)`, [...seen].join(","));
  for (const t of E.SEQUENCE_TYPES.filter(t => t.advFor)) assert(!seen.has(t.id), `la avanzada ${t.id} NO juega sin filosofía (gating)`);
  assert(sawLastMan, "el último hombre sigue apareciendo (absorbido en secuencias + pelotazo a la espalda)");
}

// ---------- SIN SEQUÍAS: los momentos del partido están REPARTIDOS (bug PO 28-jul-2026) ----------
// El sorteo memoryless viejo (`faltan / ticksQuedan`) daba el número correcto de secuencias
// pero huecos exponenciales: medido, p90 de 42' y máximos de 77' sin una sola jugada. Con
// ticks de 5' no se veía; con el reloj continuo son 84 segundos de reloj de pared mirando
// correr el minutero. `seqSlots` reparte una ventana por secuencia. Esto FIJA la propiedad:
// el hueco máximo tiene que quedar acotado por el ancho de ventana, no por la suerte.
{
  const gaps = [];
  for (let t = 0; t < 40; t++) {
    const m = makeMatch(t % 2 ? "ARG" : "MAR");
    const mins = [];
    let guard = 0, prevCount = 0;
    while (!m.finished && guard++ < 500) {
      m.tick();
      if ((m._seqCount || 0) > prevCount) { mins.push(m.min); prevCount = m._seqCount; }
      if (m.decision) {
        const d = m.decision;
        if (d.id === "sequence") m.resolveSequenceAct(d.options[Math.floor(Math.random() * d.options.length)].key);
        else m.decision = null;
      }
    }
    let prev = 0;
    for (const mn of mins) { gaps.push(mn - prev); prev = mn; }
    gaps.push(90 - prev);  // y el hueco final, hasta el pitazo
  }
  const max = Math.max(...gaps);
  const largos = gaps.filter(g => g >= 25).length;
  // SPRINT DE LA DENSIDAD: repartir arregló la cola, pero la MEDIA la arregla el número.
  // Con el objetivo en 5-9 la cota se puede apretar de verdad: medido sobre 20.000 partidos
  // en el banco, el peor hueco de todos fue 29' (antes eran 51'). Esta cota es la que
  // defiende el bug original del PO — "17 minutos sin ninguna jugada" ya no puede volver.
  assert(max <= 40, "ningún partido pasa 40 minutos sin una jugada", `max ${max}'`);
  assert(largos / gaps.length < 0.05, "los huecos de 25'+ son raros (<5%)", `${largos}/${gaps.length}`);
}

/* ---------- LA VENTANA TERRITORIAL (sprint de la Densidad) ------------------------------
   Cada secuencia tiene una ventana `abre`…`cierra` y sale en cuanto hay fútbol (la pelota
   fuera del mediocampo); si el partido se queda trabado en el medio toda la ventana, sale
   igual al vencer. Las dos propiedades que hay que blindar son OPUESTAS entre sí y por eso
   se miden juntas:
     1. el territorio NO cambia CUÁNTAS jugadas hay (la ley del sprint del Territorio) —
        todo partido llega EXACTO a su objetivo, se juegue donde se juegue;
     2. el territorio SÍ cambia CUÁNDO — si casi todas salieran por vencimiento, la ventana
        sería decorativa y este sprint no habría hecho nada.
   ------------------------------------------------------------------------------------- */
{
  let porTerritorio = 0, porVencimiento = 0, incompletos = 0, solapadas = 0;
  for (let t = 0; t < 40; t++) {
    const m = makeMatch(t % 2 ? "ARG" : "MAR");
    let guard = 0, prevCount = 0;
    while (!m.finished && guard++ < 500) {
      m.tick();
      if ((m._seqCount || 0) > prevCount) {
        prevCount = m._seqCount;
        // Salió ANTES de vencer su ventana ⇒ la disparó la pelota, no el reloj.
        if (m.min < m._seqPlan.slots[prevCount - 1].cierra) porTerritorio++; else porVencimiento++;
      }
      if (m.decision) {
        const d = m.decision;
        if (d.id === "sequence") m.resolveSequenceAct(d.options[Math.floor(Math.random() * d.options.length)].key);
        else m.decision = null;
      }
    }
    if ((m._seqCount || 0) !== m._seqPlan.target) incompletos++;
    // Dos ventanas nunca se pisan: la siguiente abre después de que venció la anterior
    // (es lo que garantiza el jitter de seqSlots contra ANTICIPO — si alguien toca uno de
    // los dos números sin mirar el otro, dos jugadas podrían dispararse pegadas).
    const s = m._seqPlan.slots;
    for (let i = 1; i < s.length; i++) if (s[i].abre < s[i - 1].cierra) solapadas++;
  }
  assert(incompletos === 0, "el partido siempre llega EXACTO a su objetivo de jugadas", `${incompletos}/40 partidos cortos`);
  assert(solapadas === 0, "las ventanas de dos jugadas nunca se solapan", solapadas);
  const total = porTerritorio + porVencimiento;
  assert(porTerritorio / total > 0.5, "la mayoría de las jugadas las dispara el TERRITORIO, no el vencimiento",
    `${(100 * porTerritorio / total).toFixed(0)}% territorio`);
  // "porVencimiento > 0" sobre 40 partidos era una moneda: el vencimiento es la red, no la
  // regla — puede no tocarle a ningún partido de la muestra y el motor seguir sano (medido:
  // ~1 de cada 3 corridas caía del lado malo, en master, sin tocar nada de acá). El bloque
  // de abajo prueba que el vencimiento EXISTE como camino por MECANISMO, no por conteo.
}

// ---------- EL VENCIMIENTO ES UN CAMINO REAL (no una frecuencia a medir) ----------
{
  const m = makeMatch("MAR");
  // Population lazy de m._seqPlan: la primera llamada arma el plan si todavía no existe.
  m.min = 0;
  E.maybeStartSequence(m);
  const slot = m._seqPlan.slots[0];
  // LA PELOTA CLAVADA EN EL MEDIOCAMPO: zonaViva = field.v !== 3, así que con v=3 fijo
  // la ventana JAMÁS puede abrir por territorio, se juegue el minuto que se juegue.
  m.field.v = 3; m.field.vf = 3;
  m.seq = null; m.decision = null;
  let disparoTemprano = false;
  for (m.min = Math.ceil(slot.abre); m.min < slot.cierra; m.min++) {
    m.field.v = 3; m.field.vf = 3; // por si algún tick lateral lo movió
    if (E.maybeStartSequence(m)) { disparoTemprano = true; break; }
    m.seq = null; m.decision = null;
  }
  assert(!disparoTemprano, "con la pelota clavada en el medio, la ventana NO abre antes de vencer");
  m.min = slot.cierra;
  const disparoAlVencer = E.maybeStartSequence(m);
  assert(disparoAlVencer, "y al llegar `cierra` dispara igual: el vencimiento es la red, no depende del territorio");
}

// ---------- M2: el gating por nivel de las avanzadas, y sus desenlaces nuevos ----------
{
  const withFilo = (filoId, etapa, oppId = "MAR") => {
    const m = makeMatch(oppId);
    // matchCtx dual (T1): el parámetro es la ETAPA (0/1/2, la escala de los gates —
    // avanzada, rasgo); el nivel fino equivalente es el ancla de esa etapa (0/4/9 pts).
    m.my.filo = { id: filoId, nivel: [0, 4, 9][etapa], etapa };
    return m;
  };
  const playAll = (m, seen) => {
    let guard = 0;
    while (!m.finished && guard++ < 500) {
      m.tick();
      if (m.seq) seen.add(m.seq.type.id);
      if (m.decision) {
        const d = m.decision;
        if (d.id === "sequence") m.resolveSequenceAct(d.options[Math.floor(Math.random() * d.options.length)].key);
        else m.decision = null;
      }
    }
  };
  // Nivel 0 (Aprendiendo): la avanzada NO entra. Nivel 1 (En desarrollo): entra la PROPIA
  // — y solo la propia (jugando muchos partidos, la ajena jamás asoma).
  for (const filo of ["press", "posesion", "contra", "bloque"]) {
    const advId = E.ADVANCED_BY_FILO[filo].id;
    const seen0 = new Set();
    for (let i = 0; i < 25; i++) playAll(withFilo(filo, 0), seen0);
    assert(!seen0.has(advId), `${advId} no juega en Aprendiendo (nivel 0)`);
    const seen1 = new Set();
    for (let i = 0; i < 40 && !seen1.has(advId); i++) playAll(withFilo(filo, 1), seen1);
    assert(seen1.has(advId), `${advId} aparece desde En desarrollo (nivel 1)`);
    for (const other of E.SEQUENCE_TYPES.filter(t => t.advFor && t.advFor !== filo)) {
      assert(!seen1.has(other.id), `la avanzada ajena ${other.id} nunca juega con ${filo}`);
    }
  }
  // Desenlaces nuevos, forzando las secuencias directo (mismo patrón del test def→of):
  // la cacería rota con falta deja amarilla rival + tiro libre encadenado (balon_parado)
  {
    let foulChain = false, cardSeen = false;
    for (let i = 0; i < 400 && !foulChain; i++) {
      const m = withFilo("press", 2, "ARG");
      m.min = 30;
      const cardsBefore = m.oppLineup.filter(p => p.amarillaPartido).length;
      E.startSequence(m, E.sequenceType("caceria"));
      let steps = 0;
      while (m.seq && steps++ < 20) {
        if (!m.decision) { m.resolveSequenceAct(null); continue; }
        if (m.decision.id !== "sequence") break;
        const wasCaceria = m.seq.type.id === "caceria";
        m.resolveSequenceAct(m.decision.options[0].key);
        if (wasCaceria && m.seq && m.seq.type.id === "balon_parado") {
          foulChain = true;
          if (m.oppLineup.filter(p => p.amarillaPartido).length > cardsBefore) cardSeen = true;
          break;
        }
      }
    }
    assert(foulChain, "la cacería rota con falta ENCADENA un tiro libre (balon_parado mío)");
    assert(cardSeen, "esa falta deja amarilla real en el once rival");
  }
  // La sinfonía con la desesperación llena puede terminar en PENAL (decisión penalty_mine)
  {
    let penal = false;
    for (let i = 0; i < 400 && !penal; i++) {
      const m = withFilo("posesion", 2, "MAR");
      m.min = 30;
      E.startSequence(m, E.sequenceType("sinfonia"));
      let steps = 0;
      while (m.seq && steps++ < 20) {
        if (!m.decision) { m.resolveSequenceAct(null); continue; }
        if (m.decision.id !== "sequence") break;
        m.resolveSequenceAct(m.decision.options[0].key === "filtrado" ? "seguro" : m.decision.options[0].key);
      }
      if (m.decision?.id === "penalty_mine") penal = true;
    }
    assert(penal, "la sinfonía completa desespera: el penal llega (penalty_mine)");
  }
  // La fortaleza convierte: de contener al castigo (pelotazo mío en la MISMA jugada)
  {
    let converted = false, corner = false;
    for (let i = 0; i < 400 && !(converted && corner); i++) {
      const m = withFilo("bloque", 2, "ARG");
      m.min = 30;
      E.startSequence(m, E.sequenceType("fortaleza"));
      let steps = 0;
      while (m.seq && steps++ < 20) {
        if (!m.decision) { m.resolveSequenceAct(null); continue; }
        if (m.decision.id !== "sequence") break;
        const was = m.seq.type.id;
        m.resolveSequenceAct(m.decision.options[0].key);
        if (was === "fortaleza" && m.seq?.type.id === "pelotazo") converted = true;
        if (was === "pelotazo" && m.seq?.type.id === "balon_parado") corner = true;
      }
    }
    assert(converted, "la fortaleza convierte la contención en pelotazo mío (def→of)");
    assert(corner, "el duelo del castigo perdido puede morir en córner ganado encadenado");
  }
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
// Muestrea la generación bajo un estado dado: fuerza el plan a target infinito Y vacía la
// AGENDA de momentos (28-jul: las secuencias arrancan en el minuto sorteado por seqSlots —
// sin vaciarla, el muestreo se frena en el primer momento aún futuro) y cuenta lados y
// tipos. La memoria "no repetir" se resetea por muestra para no sesgar.
// n=12000 y no 4000: los tipos RAROS del pool (banda ~4%) recibían ~160 muestras por
// lado, y comparar dos shares así contra un umbral de ×1.25 fallaba ~1 de cada 13
// corridas sin que nada estuviera roto. El sesgo que se mide es real; lo que faltaba
// era potencia estadística para verlo siempre.
function genSample(oppId, mut, n = 12000) {
  const m = makeMatch(oppId);
  m.min = 50;
  E.maybeStartSequence(m); // primera llamada: crea m._seqPlan (target/edge/prof cacheados)
  m._seqPlan.target = 1e9; m._seqPlan.slots = [];
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
  m._seqPlan.target = 1e9; m._seqPlan.slots = [];
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


// ══════════ EL DESBORDE POR LA BANDA + la velocidad en la cancha (Odisea, 2ª mitad) ══════════
{
  const t = E.sequenceType("banda");
  assert(t && t.side === "mine", "el desborde existe y es una jugada MÍA");
  assert(JSON.stringify(t.plan) === JSON.stringify(["wing", "cross", "finish"]), "sus tres actos: banda → centro → definición", JSON.stringify(t.plan));
  assert(t.protStat === "velocidad", "declara que la corre el rápido");
  assert(E.FILO_BY_TIPO.banda === "contra", "jugarla enseña Contragolpe (decisión PO)");

  // El protagonista: la jugada elige piernas, no puestos sueltos
  {
    const m = makeMatch();
    const veces = {};
    for (let i = 0; i < 300; i++) {
      m.seq = null; m.decision = null;
      E.startSequence(m, t);
      veces[m.seq.prot.name] = (veces[m.seq.prot.name] || 0) + 1;
    }
    const orden = Object.entries(veces).sort((a, b) => b[1] - a[1]);
    const rapido = [...m.my.lineup].filter(p => p.pos !== "POR").sort((a, b) => b.stats.velocidad - a.stats.velocidad)[0];
    const lento = [...m.my.lineup].filter(p => p.pos !== "POR").sort((a, b) => a.stats.velocidad - b.stats.velocidad)[0];
    assert((veces[rapido.name] || 0) > (veces[lento.name] || 0),
      "el más rápido del once corre la banda más que el más lento", `${rapido.name} ${veces[rapido.name] || 0} vs ${lento.name} ${veces[lento.name] || 0}`);
    assert(orden.length >= 3, "pero no es determinista: varios la corren", orden.length);
  }

  // Los tres caminos del acto de banda
  {
    const m = makeMatch();
    E.startSequence(m, t);
    const d = m.decision;
    assert(d.id === "sequence" && d.options.length === 3, "el acto de banda ofrece los tres caminos", d.options.length);
    assert(d.options.map(o => o.key).join() === "fondo,primera,adentro", "línea de fondo · centro de primera · cortar hacia adentro", d.options.map(o => o.key).join());
    assert(/Velocidad \d+ vs \d+/.test(d.options[0].hint), "el hint enfrenta las dos velocidades", d.options[0].hint);
  }

  // Cortar hacia adentro SALTEA el centro (o cierra); nunca deja la jugada colgada
  {
    let vistoFinish = false, colgadas = 0;
    for (let i = 0; i < 120; i++) {
      const m = makeMatch();
      E.startSequence(m, t);
      m.resolveSequenceAct("adentro");
      if (m.seq && m.decision) {
        const kind = (m.seq.plan || m.seq.type.plan)[m.seq.actIdx];
        if (kind === "finish") vistoFinish = true;
        if (kind === "cross") colgadas++;   // no debería pasar: cortar adentro no centra
      }
    }
    assert(vistoFinish, "cortar hacia adentro lleva DIRECTO al remate");
    assert(colgadas === 0, "cortar hacia adentro nunca pasa por el centro", colgadas);
  }

  // El centro: el alto lo cabecea alguien que ataca el área (no el central), el rasante define de frente
  {
    let altos = 0, defs = 0, rasantes = 0;
    for (let i = 0; i < 200; i++) {
      const m = makeMatch();
      E.startSequence(m, t);
      m.resolveSequenceAct("primera");            // sin riesgo: llega al acto del centro
      if (!m.seq || (m.seq.plan || m.seq.type.plan)[m.seq.actIdx] !== "cross") continue;
      const rasante = i % 2 === 0;
      m.resolveSequenceAct(rasante ? "atras" : "centro");
      if (!m.seq) continue;
      if (m.seq.finishStat === "cabezazo") { altos++; if (E.playedPos(m.seq.prot) === "DEF") defs++; }
      if (m.seq.finishStat === "tiro") rasantes++;
    }
    assert(altos > 0 && rasantes > 0, "los dos envíos ocurren", `${altos}/${rasantes}`);
    assert(defs === 0, "el centro en juego abierto no lo cabecea un central", defs);
  }
}

// La velocidad decide duelos (Football Actions nuevas y las de siempre)
{
  const m = makeMatch();
  const p = m.my.lineup.find(x => x.pos !== "POR");
  const rate = (fn, n = 900) => { let ok = 0; for (let i = 0; i < n; i++) if (fn().ok) ok++; return ok / n; };
  const v0 = p.stats.velocidad;

  p.stats.velocidad = 25; const sprintLento = rate(() => E.actSprint(m, p));
  p.stats.velocidad = 95; const sprintRapido = rate(() => E.actSprint(m, p));
  p.stats.velocidad = v0;
  assert(sprintRapido > sprintLento + 0.15, "el sprint por la banda lo gana el rápido", `${sprintLento.toFixed(2)} → ${sprintRapido.toFixed(2)}`);

  // El perseguidor también cuenta: el mismo extremo contra un lateral rápido llega menos
  const lateral = m.oppLineup.find(x => x.pos === "DEF");
  const vl = lateral.stats.velocidad;
  lateral.stats.velocidad = 20; const vsLento = rate(() => E.actSprint(m, p, { chaser: lateral }));
  lateral.stats.velocidad = 95; const vsRapido = rate(() => E.actSprint(m, p, { chaser: lateral }));
  lateral.stats.velocidad = vl;
  assert(vsLento > vsRapido + 0.15, "contra un lateral veloz el desborde cuesta", `${vsLento.toFixed(2)} vs ${vsRapido.toFixed(2)}`);

  // El centro mide pase LARGO; el rasante, pase CORTO (el split decide qué jugada se juega)
  const pc = p.stats.pase_corto, pl = p.stats.pase_largo;
  p.stats.pase_largo = 20; p.stats.pase_corto = 95;
  const altoMalo = rate(() => E.actCross(m, p)), rasanteBueno = rate(() => E.actCross(m, p, { rasante: true }));
  p.stats.pase_largo = 95; p.stats.pase_corto = 20;
  const altoBueno = rate(() => E.actCross(m, p)), rasanteMalo = rate(() => E.actCross(m, p, { rasante: true }));
  p.stats.pase_corto = pc; p.stats.pase_largo = pl;
  assert(altoBueno > altoMalo + 0.15, "el centro al área lo manda el que tiene pase LARGO", `${altoMalo.toFixed(2)} → ${altoBueno.toFixed(2)}`);
  assert(rasanteBueno > rasanteMalo + 0.15, "el pase atrás rasante lo mide el pase CORTO", `${rasanteMalo.toFixed(2)} → ${rasanteBueno.toFixed(2)}`);

  // La conducción ya no es solo carisma
  const a0 = p.stats.aura;
  p.stats.aura = 60; p.stats.velocidad = 20; const condLento = rate(() => E.actDribble(m, p));
  p.stats.velocidad = 95; const condRapido = rate(() => E.actDribble(m, p));
  p.stats.aura = a0; p.stats.velocidad = v0;
  assert(condRapido > condLento, "a igual aura, el rápido conduce mejor", `${condLento.toFixed(2)} → ${condRapido.toFixed(2)}`);

  // Replegar es llegar: la contención mejora con una zaga rápida
  const { mine } = m.powers();
  const contLenta = rate(() => E.actContain(m, mine, { chase: 1.5 }));
  const contRapida = rate(() => E.actContain(m, mine, { chase: 4.5 }));
  assert(contRapida > contLenta, "una zaga veloz corta más que una lenta", `${contLenta.toFixed(2)} → ${contRapida.toFixed(2)}`);
}

// ══════════ LA COSTURA CERRADA: muere PASE_MIX, despierta prof.vel (Odisea, cierre) ══════════

// El perfil del rival mide pase CORTO: "querer la pelota" es saber tocarla, no saber lanzarla.
{
  assert(E.PASE_MIX === undefined && E.paseMix === undefined, "PASE_MIX/paseMix ya no existen: ningún sitio mezcla los dos pases");
  const perfil = mut => { const m = makeMatch(); mut(m.oppLineup.filter(p => p.pos !== "POR")); m.min = 50; E.maybeStartSequence(m); return m._seqPlan.prof; };
  const base = perfil(() => {});
  const conLargo = perfil(fs => fs.forEach(p => p.stats.pase_largo = 99));
  const conCorto = perfil(fs => fs.forEach(p => p.stats.pase_corto = 99));
  assert(Math.abs(conLargo.pase - base.pase) < 1e-9, "un rival que sabe LANZAR no quiere más la pelota (el largo no entra al perfil)", `${base.pase.toFixed(3)} vs ${conLargo.pase.toFixed(3)}`);
  assert(conCorto.pase > base.pase + 0.05, "un rival que sabe TOCAR sí quiere la pelota", `${base.pase.toFixed(3)} → ${conCorto.pase.toFixed(3)}`);
}

// El desborde va a buscar la espalda LENTA: prof.vel dejó de ser un dial dormido.
{
  const lenta = genSample("ARG", m => { m._seqPlan.prof.vel = 0; });
  const rapida = genSample("ARG", m => { m._seqPlan.prof.vel = 1; });
  assert(lenta.share("banda") > rapida.share("banda") * 1.25,
    "contra una zaga rival LENTA sale más el desborde por la banda", `${rapida.share("banda").toFixed(3)} → ${lenta.share("banda").toFixed(3)}`);
  // Y el término está CENTRADO: con una zaga del montón el desborde aparece como siempre.
  const media = genSample("ARG", m => { m._seqPlan.prof.vel = 0.5; });
  assert(Math.abs(media.share("banda") - (lenta.share("banda") + rapida.share("banda")) / 2) < 0.02,
    "el dial reparte alrededor del peso viejo, no lo sube", media.share("banda").toFixed(3));
}

// EL DESMARQUE: el que recibe el pase de gol es el que arrancó.
{
  // Once clonado: todos idénticos salvo la velocidad de dos de ellos, así lo único que
  // puede explicar la diferencia de goles es quién se soltó (el tiro es el mismo para todos).
  const m = makeMatch();
  const campo = m.my.lineup.filter(p => p.pos !== "POR");
  for (const p of campo) p.stats = { ...p.stats, tiro: 75, cabezazo: 70, defensa: 70, pase_corto: 80, pase_largo: 70, velocidad: 70, aura: 70 };
  const rapido = campo[1], lento = campo[2];
  rapido.stats = { ...rapido.stats, velocidad: 97 };
  lento.stats = { ...lento.stats, velocidad: 30 };
  const goles = {};
  for (let i = 0; i < 1500; i++) {
    m.seq = null; m.decision = null; m.scorers = [];
    E.startSequence(m, E.sequenceType("transicion"));
    while (m.seq && (m.seq.plan || m.seq.type.plan)[m.seq.actIdx] !== "finish") m.resolveSequenceAct("pase");
    if (!m.seq) continue;
    m.resolveSequenceAct("asistir");
    for (const g of m.scorers) goles[g.name] = (goles[g.name] || 0) + 1;
  }
  assert((goles[rapido.name] || 0) > (goles[lento.name] || 0),
    "a igual tiro, el rápido recibe el pase de gol más que el lento", `${goles[rapido.name] || 0} vs ${goles[lento.name] || 0}`);
  assert(Object.keys(goles).length >= 3, "pero no es determinista: el lento también aparece", Object.keys(goles).join(","));
}

// LA PERSECUCIÓN TRAS ROBO: contener es aguantar hasta que los demás vuelven corriendo.
// (Toda contra con un defensor en pie va al mano a mano: LASTMAN_FROM_COUNTER = 1.0.)
{
  const contener = vel => {
    const m = makeMatch();
    m.my.lineup.filter(p => p.pos !== "POR").forEach(p => { p.stats = { ...p.stats, velocidad: vel }; });
    let gol = 0;
    for (let i = 0; i < 1500; i++) {
      m.decision = null; m.gOpp = 0; m.min = 50;
      if (!E.lastManChance(m)) continue;
      m.resolveLastMan("esperar");
      gol += m.gOpp;
    }
    return gol;
  };
  const lenta = contener(20), rapida = contener(95);
  assert(lenta > rapida, "si nadie vuelve corriendo, el que se escapó define mejor", `zaga rápida ${rapida} → zaga lenta ${lenta} goles`);
}

console.log(`sequences.test: ${checks} checks · fallos: ${fails}`);
console.log(fails ? "❌ sequences con fallos" : "✅ sequences OK");
process.exit(fails ? 1 : 0);
