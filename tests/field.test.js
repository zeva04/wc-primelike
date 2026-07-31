/* ============================================================
   Tests del TERRITORIO (game/match/field, sprint del Territorio):
   - el marco absoluto: la pelota nunca se sale de la cancha
   - la deriva ambiente NO consume rnd() (el balance no se mueve)
   - la ALTURA DEL BLOQUE mueve de verdad dónde se juega
   - la altura RIVAL sale de su identidad y del marcador
   - el mapa de calor acumula, se reinicia por tiempo y se sirve
     normalizado a la UI
   - lo que la UI recibe son PALABRAS, nunca coordenadas
   Uso: node tests/field.test.js
   ============================================================ */
import { loadEngine } from "./load-engine.js";

const { Engine: E } = await loadEngine();

let fails = 0, checks = 0;
const assert = (cond, msg, ctx) => { checks++; if (!cond) { fails++; console.error("FAIL:", msg, ctx ?? ""); } };

/** Un Match recién nacido, sin jugar (para probar el territorio en aislamiento). */
function nuevo(teamId = "BRA", oppId = "MAR") {
  const run = E.newRun(teamId);
  const { lineup } = E.currentLineup(run.squad, null, null);
  const bench = run.squad.filter(p => !lineup.includes(p) && !p.suspendido && p.lesionadoPartidos === 0);
  return new E.Match({ team: E.getTeam(teamId), lineup, bench, mentalidad: "normal", buffs: {}, moral: 50 }, E.getTeam(oppId), false, []);
}

/** Un partido entero jugado al azar (como el smoke). */
function jugar(teamId = "BRA", oppId = "MAR") {
  const m = nuevo(teamId, oppId);
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

/** Corre `n` minutos de SOLA deriva ambiente (sin tocar el resto del partido). */
function derivar(m, n = 45) {
  const { mine, opp } = m.powers();
  for (let i = 1; i <= n; i++) { m.min = i; E.tickField(m, mine, opp); }
}

/** Centro de masa vertical de un mapa: en qué altura se jugó, en promedio. */
function centroV(map) {
  let peso = 0, suma = 0;
  for (let h = 1; h <= E.LANES; h++)
    for (let v = 1; v <= E.ROWS; v++) { const w = map[E.cellIdx(h, v)]; peso += w; suma += w * v; }
  return peso ? suma / peso : 0;
}

// ---------- el estado nace sano ----------
{
  const m = nuevo();
  assert(m.field, "el Match nace con territorio");
  const z = E.ballZone(m);
  assert(z.v === 3 && z.h === 2, "la pelota arranca en el centro del mediocampo (el saque)", `${z.h},${z.v}`);
  assert(m.field.maps.length === 1 && m.field.maps[0].nominal === 45, "nace el mapa del primer tiempo");
  assert(m.field.oppFilo && m.field.oppFilo.id, "el rival trae su identidad cacheada (para su altura)");
  assert(E.myHeight(m) === E.HEIGHT_DEFAULT, "sin orden del DT, el bloque es MEDIO", E.myHeight(m));
}

// ---------- la pelota nunca se sale de la cancha ----------
{
  const m = jugar();
  const z = E.ballZone(m);
  assert(z.v >= 1 && z.v <= E.ROWS, "la altura vive en 1..5", z.v);
  assert(z.h >= 1 && z.h <= E.LANES, "el carril vive en 1..3", z.h);
  // y en los extremos del dial, tampoco
  for (const alt of [1, 5]) {
    const m2 = nuevo();
    m2.my.altura = alt;
    derivar(m2, 90);
    assert(m2.field.v >= 1 && m2.field.v <= E.ROWS, `con bloque ${alt} la pelota sigue dentro`, m2.field.v);
  }
}

// ---------- LA LEY DEL AZAR: la deriva es determinista ----------
{
  const m = nuevo();
  derivar(m, 12);
  const { mine, opp } = m.powers();
  const foto = JSON.stringify(m.field);
  m.min = 13; E.tickField(m, mine, opp);
  const a = JSON.stringify(m.field);
  m.field = JSON.parse(foto);
  m.min = 13; E.tickField(m, mine, opp);
  assert(a === JSON.stringify(m.field), "el mismo estado produce la misma deriva (sin rnd: el RNG no se corre)");
}

// ---------- LA ALTURA DEL BLOQUE mueve dónde se juega ----------
{
  const centros = [1, 3, 5].map(alt => {
    const m = nuevo();
    m.my.altura = alt;
    derivar(m, 60);
    return centroV(m.field.maps[0].mine);
  });
  assert(centros[2] > centros[1] && centros[1] > centros[0],
    "más altura = mis posesiones se juegan más arriba (monótono)", centros.map(c => c.toFixed(2)).join(" < "));
  assert(centros[2] - centros[0] > 0.8,
    "y la diferencia entre muy bajo y muy alto se SIENTE (más de media zona)", (centros[2] - centros[0]).toFixed(2));
  // El espejo: mi bloque alto empuja al rival contra su propio campo.
  const rival = [1, 5].map(alt => {
    const m = nuevo();
    m.my.altura = alt;
    derivar(m, 60);
    return centroV(m.field.maps[0].opp);
  });
  assert(rival[1] > rival[0], "con mi bloque muy alto, el rival tiene la pelota más lejos de mi arco",
    `${rival[0].toFixed(2)} → ${rival[1].toFixed(2)}`);
}

// ---------- la altura RIVAL sale de su identidad (la IA juega su idea) ----------
{
  const m = nuevo();
  const alturaCon = (id, nivel = 1) => { m.field.oppFilo = { id, nivel }; return E.oppHeight(m); };
  assert(alturaCon("press") > alturaCon("bloque"), "el Press rival adelanta líneas y el Bloque las repliega",
    `${alturaCon("press")} vs ${alturaCon("bloque")}`);
  assert(alturaCon("posesion") > alturaCon("contra"), "la Posesión rival juega más arriba que la Contra");
  assert(alturaCon("press", 2) > alturaCon("press", 0), "la identidad consolidada RADICALIZA su altura");
  // El marcador la mueve igual que a mí: el que pierde tarde sube el bloque.
  m.field.oppFilo = { id: "contra", nivel: 1 };
  m.min = 80; m.gMy = 1; m.gOpp = 0;
  const perdiendo = E.oppHeight(m);
  m.gMy = 0; m.gOpp = 1;
  assert(perdiendo > E.oppHeight(m), "el rival que va perdiendo tarde sube el bloque", `${perdiendo} vs ${E.oppHeight(m)}`);
}

// ---------- el mapa de calor ----------
{
  const m = jugar();
  assert(m.field.maps.length >= 2, "cada tiempo tiene su propio mapa", m.field.maps.length);
  const [primero, segundo] = m.field.maps;
  const total = map => map.mine.reduce((a, b) => a + b, 0) + map.opp.reduce((a, b) => a + b, 0);
  assert(total(primero) > 0 && total(segundo) > 0, "los dos tiempos acumulan calor",
    `${total(primero)} / ${total(segundo)}`);
  assert(primero.nominal === 45 && segundo.nominal === 90, "y cada uno sabe de qué tiempo es");
  // El reinicio es REAL: el mapa del segundo tiempo no arrastra el del primero.
  assert(total(segundo) < total(primero) * 3, "el segundo tiempo no arrastra el acumulado del primero");
  // La jugada pesa más que el relleno: una secuencia deja HEAT_ACT de golpe.
  const m2 = nuevo();
  derivar(m2, 5);
  const antes = m2.field.maps[0].mine.reduce((a, b) => a + b, 0);
  E.startSequence(m2, E.sequenceType("circulacion"));
  const despues = m2.field.maps[0].mine.reduce((a, b) => a + b, 0);
  assert(despues - antes === E.HEAT_ACT, "una jugada real deja más calor que un minuto de relleno",
    `${despues - antes} vs ${E.HEAT_TICK}`);
}

// ---------- LA ALTURA COMO PALANCA: las ventanas tácticas ----------
{
  const m = nuevo();
  // Antes del arranque es gratis y no gasta nada.
  assert(E.heightFree(m), "antes del pitazo inicial mover el bloque es gratis");
  assert(E.setHeight(m, 5) && E.myHeight(m) === 5, "el DT deja el bloque muy alto");
  assert(m.field.windows === 0, "y no gastó ninguna ventana", m.field.windows);
  assert(!E.setHeight(m, 5), "mover el bloque a donde YA está no hace nada");
  // Con el partido en juego cuesta ventana, y se acaban.
  m.min = 20; m.enHalftime = false;
  assert(!E.heightFree(m), "con el partido en juego ya no es gratis");
  for (let i = 1; i <= E.TACTIC_WINDOWS; i++) {
    assert(E.setHeight(m, i % 2 ? 2 : 4), `la ventana ${i} se puede usar`);
    assert(m.field.windows === i, "y queda contada", m.field.windows);
  }
  assert(!E.canChangeHeight(m, 1), "gastadas las 3 ventanas, el bloque queda como está");
  assert(!E.setHeight(m, 1), "y el intento no cambia nada");
  // El entretiempo vuelve a abrir la puerta: el equipo está parado.
  m.enHalftime = true;
  assert(E.canChangeHeight(m, 1) && E.setHeight(m, 1), "en el entretiempo se puede mover aunque no queden ventanas");
  assert(m.field.windows === E.TACTIC_WINDOWS, "y sigue sin gastar ventana", m.field.windows);
  // Los cambios se NARRAN (el jugador se entera por el relato, no por un número).
  assert(m.feed.some(f => /bloque/i.test(f.text)), "cada movimiento del bloque queda en el relato");
  assert(!m.feed.some(f => /\(\d,\d\)|zona [1-5]/i.test(f.text)), "y jamás se le canta una coordenada al jugador");
}

// ---------- LA ALTURA COMO PALANCA: sus efectos ----------
{
  // 1. El pool: arriba se roba arriba; abajo se revienta la pelota.
  const pesos = alt => {
    const m = nuevo();
    m.my.altura = alt;
    m.min = 20;
    return E.typeWeightsFor(m, "mine");
  };
  const alto = pesos(5), bajo = pesos(1);
  assert(alto.recuperacion > bajo.recuperacion, "el bloque alto propone MUCHA más recuperación alta",
    `${alto.recuperacion.toFixed(2)} vs ${bajo.recuperacion.toFixed(2)}`);
  assert(bajo.pelotazo > alto.pelotazo, "el bloque bajo revienta más la pelota",
    `${bajo.pelotazo.toFixed(2)} vs ${alto.pelotazo.toFixed(2)}`);
  assert(bajo.transicion > alto.transicion, "y sale más de contra");
  // 2. El reparto de iniciativa
  const share = alt => { const m = nuevo(); m.my.altura = alt; return E.heightShareShift(m); };
  assert(share(5) > share(3) && share(3) > share(1), "más altura = más iniciativa", `${share(1)} < ${share(3)} < ${share(5)}`);
  // 3. El riesgo a la espalda (el precio honesto de jugar alto)
  const m3 = nuevo();
  m3.my.altura = 3;
  assert(Math.abs(E.backlineRisk(m3) - 1) < 1e-9, "con bloque medio, el riesgo a la espalda es el de siempre (×1)");
  m3.my.altura = 5;
  const arriba = E.backlineRisk(m3);
  m3.my.altura = 1;
  assert(arriba > 1 && E.backlineRisk(m3) < 1, "jugar muy alto multiplica el pelotazo a la espalda; replegarse lo apaga",
    `${arriba.toFixed(2)} vs ${E.backlineRisk(m3).toFixed(2)}`);
  // 4. Las piernas: el bloque adelantado se paga en energía; el replegado no cobra nada.
  const gasto = alt => { const m = nuevo(); m.my.altura = alt; derivar(m, 45); return Object.values(m.heightMinutesByName()).reduce((a, b) => a + b, 0); };
  assert(gasto(5) > gasto(4) && gasto(4) > 0, "cuanto más alto vive el equipo, más piernas cuesta", `${gasto(4).toFixed(1)} → ${gasto(5).toFixed(1)}`);
  assert(gasto(3) === 0 && gasto(1) === 0, "el bloque medio y el bajo no pagan sobrecosto físico");
}

// ---------- EL PUNTO NEUTRO: con bloque medio, nada del territorio toca el balance ----------
{
  const m = nuevo();
  m.min = 20;
  m.my.altura = E.HEIGHT_DEFAULT;
  m.field.oppFilo = { id: "sin_idea", nivel: 0 };   // rival sin identidad conocida → altura media
  assert(Math.abs(E.heightShareShift(m)) < 1e-9, "con los dos bloques medios, el territorio no inclina la iniciativa");
  assert(Math.abs(E.backlineRisk(m) - 1) < 1e-9, "ni toca el riesgo del pelotazo a la espalda");
  // (con ambos escalones en 0, cada multiplicador del pool vale exactamente 1: por eso la
  //  línea base medida del juego no se mueve por el solo hecho de que la palanca exista)
  const base = E.typeWeightsFor(m, "mine");
  m.my.altura = 4;
  const subido = E.typeWeightsFor(m, "mine");
  assert(subido.recuperacion > base.recuperacion && subido.pelotazo < base.pelotazo,
    "y basta UN escalón para que salga otro fútbol");
}

// ---------- T4: LA GEOGRAFÍA DE LAS JUGADAS ----------
{
  // Todo tipo declara desde dónde nace, y con un rango de cancha válido.
  for (const t of E.SEQUENCE_TYPES) {
    const z = t.zone?.from;
    assert(Array.isArray(z) && z.length === 2, `${t.id} declara su cuna territorial`, JSON.stringify(t.zone));
    assert(z[0] >= 1 && z[1] <= E.ROWS && z[0] <= z[1], `${t.id} nace en un rango de cancha válido`, JSON.stringify(z));
  }
  // El fútbol que el catálogo tiene que decir: el penal casi solo nace arriba; la
  // circulación larga no arranca dentro del área rival; el córner en contra, en la mía.
  assert(E.sequenceType("balon_parado").zone.from[0] >= 4, "el balón parado a favor nace cerca del área rival");
  assert(E.sequenceType("circulacion").zone.from[1] < E.ROWS, "la circulación no arranca dentro del área rival");
  assert(E.sequenceType("balon_parado_def").zone.from[1] === 1, "el córner en contra se defiende en mi área");
  assert(E.sequenceType("recuperacion").zone.from[0] >= 4, "presionar la salida rival exige estar arriba");
  assert(E.sequenceType("salida_corta").zone.from[1] <= 2, "la salida desde el área nace en el área propia");

  // El PESO por distancia: máximo en su cuna, y cae cuanto más lejos está la pelota.
  const rec = E.sequenceType("recuperacion");
  assert(E.zoneWeight(rec, 5) === 1 && E.zoneWeight(rec, 4) === 1, "dentro de su cuna, el tipo pesa entero");
  assert(E.zoneWeight(rec, 3) < 1 && E.zoneWeight(rec, 1) < E.zoneWeight(rec, 3),
    "y pesa menos cuanto más lejos está la pelota", `${E.zoneWeight(rec, 3).toFixed(2)} / ${E.zoneWeight(rec, 1).toFixed(2)}`);

  // El ORIGEN: la jugada nace donde está la pelota si puede, y si no, en el borde más cercano.
  const m = nuevo();
  m.field.v = 1;
  assert(E.originOf(m, rec).v === 4, "con la pelota atrás, la presión alta nace en el borde bajo de su cuna");
  m.field.v = 3;
  assert(E.originOf(m, E.sequenceType("circulacion")).v === 3, "y si la pelota ya está en su cuna, la jugada nace ahí");
  assert(E.originOf(m, E.sequenceType("banda")).h !== 2, "el desborde nace ABIERTO, nunca por el centro");
  assert(E.originOf(m, E.sequenceType("balon_parado")).h === 2, "el balón parado se juega por el centro");
}

// ---------- T4: la jugada planta la pelota, y cada acto la mueve ----------
{
  // Arrancar una secuencia deja la pelota dentro de la cuna de ESA jugada.
  for (const id of ["recuperacion", "balon_parado", "salida_corta", "espalda", "repliegue"]) {
    const m = nuevo();
    m.min = 20;
    const t = E.sequenceType(id);
    E.startSequence(m, t);
    const z = t.zone.from;
    assert(m.field.v >= z[0] && m.field.v <= z[1], `${id} planta la pelota en su cuna`, `v=${m.field.v} vs ${JSON.stringify(z)}`);
  }
  // El pelotazo es la excepción que confirma la regla: NACE atrás (donde se lanza) pero
  // la pelota VUELA — el duelo aéreo se disputa arriba, no en el punto de partida.
  {
    const m = nuevo();
    m.min = 20; m.field.v = 2;
    const t = E.sequenceType("pelotazo");
    assert(E.originOf(m, t).v === 2, "el pelotazo se lanza desde donde está la pelota");
    E.startSequence(m, t);
    assert(m.field.v === 4, "y el envío la manda dos zonas arriba: ahí se disputa el duelo", m.field.v);
  }
  // El pase progresa; el filtrado progresa más; el pase de la salida rompe la primera línea.
  const avance = key => {
    const m = nuevo();
    m.min = 20;
    E.startSequence(m, E.sequenceType("circulacion"));
    const antes = m.field.v;
    m.resolveSequenceAct(key);
    return m.seq ? m.field.v - antes : null;   // null = la perdió (la jugada murió)
  };
  let seguros = [], filtrados = [];
  for (let i = 0; i < 60; i++) { const a = avance("seguro"); if (a !== null) seguros.push(a); }
  for (let i = 0; i < 60; i++) { const a = avance("filtrado"); if (a !== null) filtrados.push(a); }
  assert(seguros.length && seguros.every(a => a === 1), "el pase seguro avanza una zona", seguros[0]);
  assert(filtrados.length && filtrados.every(a => a === 2), "el pase filtrado rompe una línea entera (dos zonas)", filtrados[0]);
}

// ---------- T4: LA GEOGRAFÍA DE LA FALTA (el penal deja de nacer en el mediocampo) ----------
{
  let penales = 0, libres = 0, penalFuera = 0;
  for (let i = 0; i < 800; i++) {
    const m = nuevo();
    m.min = 20;
    E.startSequence(m, E.sequenceType("transicion"));
    const antes = m.feed.length;
    if (!m.decision?.options?.some(o => o.key === "conducir")) continue;
    m.resolveSequenceAct("conducir");
    const nuevas = m.feed.slice(antes).map(l => l.text).join(" ");
    if (/PENAL/.test(nuevas)) { penales++; if (m.field.v < E.ROWS) penalFuera++; }
    else if (/Falta sobre/.test(nuevas)) libres++;
  }
  assert(penales + libres > 0, "la conducción produce faltas a favor", `${penales} penales · ${libres} tiros libres`);
  assert(penalFuera === 0, "NINGÚN penal se cobra fuera del área rival (el agujero que cerró el territorio)", penalFuera);
  assert(libres > 0, "y las faltas lejos del área se cobran como tiro libre", libres);
}

// ---------- T4: las dos jugadas nuevas ----------
{
  // La salida desde el área: tres fútbols distintos, y el largo CONVIERTE la jugada.
  const salida = key => {
    const m = nuevo();
    m.min = 20;
    E.startSequence(m, E.sequenceType("salida_corta"));
    const keys = m.decision.options.map(o => o.key);
    m.resolveSequenceAct(key);
    return { m, keys };
  };
  assert(salida("seguro").keys.join(",") === "corto,largo,seguro", "la salida ofrece los tres caminos");
  const largo = salida("largo");
  assert(largo.m.seq && largo.m.seq.type.id === "pelotazo", "buscar al punta CONVIERTE la salida en un pelotazo");
  assert(salida("seguro").m.seq === null, "sacarla afuera cierra la jugada sin drama");
  let sali = false, perdi = false;
  for (let i = 0; i < 120 && !(sali && perdi); i++) {
    const { m } = salida("corto");
    if (m.seq) sali = true; else perdi = true;
  }
  assert(sali && perdi, "salir jugando en corto a veces sale y a veces es un regalo en la puerta del área");
  // La pelota a la espalda: solo se ofrece contra bloque adelantado y deja al punta solo.
  let solo = false;
  for (let i = 0; i < 300 && !solo; i++) {
    const m = nuevo();
    m.min = 20;
    E.startSequence(m, E.sequenceType("espalda"));
    m.resolveSequenceAct("espalda");
    if (m.seq?.oneOnOne && m.field.v === E.ROWS) solo = true;
  }
  assert(solo, "ganar la carrera a la espalda deja al atacante SOLO dentro del área");
  // Y el generador la propone mucho más contra un rival adelantado que contra uno metido atrás.
  const peso = filo => {
    const m = nuevo();
    m.min = 20;
    m.field.oppFilo = { id: filo, nivel: 2 };
    return E.typeWeightsFor(m, "mine").espalda;
  };
  assert(peso("press") > peso("bloque") * 2, "la espalda es la respuesta al bloque ALTO, no al que se mete atrás",
    `${peso("press").toFixed(2)} vs ${peso("bloque").toFixed(2)}`);
}

// ---------- T4: los rasgos con geografía ----------
{
  // Reventar el balón solo se ofrece defendiendo en mi campo; pivotear, solo cerca del área.
  const opcion = (id, rasgo, filo, key, v) => {
    const m = nuevo();
    m.min = 20;
    m.my.filo = { id: filo, nivel: 5, etapa: 1, rasgos: [rasgo], mult: {}, xp: {} };
    E.startSequence(m, E.sequenceType(id));
    m.field.v = v;                       // se fuerza la zona DESPUÉS de plantar la jugada
    m.decision = null;
    E.buildActDecision(m);
    return m.decision.options.some(o => o.key === key);
  };
  assert(opcion("repliegue", "pelotazo_fuera", "bloque", "reventar", 2), "reventar el balón se ofrece defendiendo en mi campo");
  assert(!opcion("repliegue", "pelotazo_fuera", "bloque", "reventar", 5), "y no se ofrece con la pelota en el área rival");
  assert(opcion("pelotazo", "hombre_objetivo", "bloque", "pivotear", 5), "pivotear al área se ofrece dentro del área");
  assert(!opcion("pelotazo", "hombre_objetivo", "bloque", "pivotear", 1), "y no se ofrece cuando el pelotazo sale desde el fondo del área propia");
  // El gate por ALTURA: la trampa del offside necesita la línea alta.
  const conAltura = alt => {
    const m = nuevo();
    m.my.altura = alt;
    m.my.filo = { id: "posesion", nivel: 5, etapa: 1, rasgos: ["la_frontera"], mult: {}, xp: {} };
    return !!E.hookOf(m, "offsideTrap");
  };
  assert(conAltura(5) && !conAltura(2), "la trampa del offside existe con línea alta y no con el bloque metido atrás");
}

// ---------- lo que se le sirve a la UI ----------
{
  const m = jugar();
  const cells = E.heatCells(m, "mine", 0);
  assert(cells.length === E.LANES * E.ROWS, "el mapa se sirve con las 15 celdas", cells.length);
  assert(cells.every(c => c.i >= 0 && c.i <= 1), "las intensidades vienen normalizadas 0..1");
  assert(Math.abs(Math.max(...cells.map(c => c.i)) - 1) < 1e-9, "la celda más caliente del tiempo vale 1");
  const halves = E.heatHalves(m);
  assert(halves.length === m.field.maps.length && halves[0].label === "1er tiempo",
    "los tiempos se ofrecen etiquetados para el post-partido", JSON.stringify(halves.map(h => h.label)));
  const st = E.fieldState(m);
  assert(st.label && st.icon && st.desc, "la UI recibe la altura con nombre, icono y explicación");
  assert(typeof st.rival === "string" && !/\d/.test(st.rival), "la altura rival se comunica con PALABRAS, nunca con un número", st.rival);
  assert(!/\d/.test(st.zona), "y la zona en curso también", st.zona);
}

console.log(`field.test: ${checks} checks · fallos: ${fails}`);
console.log(fails ? "❌ territorio con fallos" : "✅ territorio OK");
process.exit(fails ? 1 : 0);
