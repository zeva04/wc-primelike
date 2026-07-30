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
