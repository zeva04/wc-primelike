/* ============================================================
   Tests del Informe del Rival (game/scouting): niveles relativos
   contra rival fuerte y débil, bajas descontadas, forma reciente
   mapeada desde los resultados reales, y PUREZA (no muta la run,
   no consume rng: dos llamadas seguidas dan lo mismo).
   Uso: node tests/scouting.test.js
   ============================================================ */
import { loadEngine } from "./load-engine.js";

const { Engine: E, WC_DATA } = await loadEngine();

let fails = 0, checks = 0;
const assert = (cond, msg, ctx) => { checks++; if (!cond) { fails++; console.error("FAIL:", msg, ctx ?? ""); } };

const qualified = WC_DATA.teams.filter(t => t.qualified !== false);
const byRating = [...qualified].sort((a, b) => E.teamRating(b) - E.teamRating(a));

// ---------- niveles relativos: el más débil del torneo visto por BRA ----------
{
  const run = E.newRun("BRA");
  const weak = [...byRating].reverse().find(t => t.id !== "BRA");
  const rep = E.buildOpponentReport(run, weak.id);
  assert(rep.name === weak.name && rep.oppId === weak.id, "identidad del rival en el informe");
  for (const [k, l] of Object.entries(rep.lineas)) {
    assert(["Alto", "Medio", "Bajo"].includes(l.nivel), "nivel cualitativo válido", `${k}: ${l.nivel}`);
    assert(typeof l.detalle === "string" && l.detalle.length > 10, "detalle legible", k);
  }
  assert(rep.lineas.ataque.nivel === "Bajo" && rep.lineas.defensa.nivel === "Bajo",
    `el rival más débil (${weak.name}, ${E.teamRating(weak)}) es Bajo en ataque y defensa para BRA`,
    JSON.stringify(rep.lineas));
  assert(rep.figura.name && rep.figura.pos && rep.figura.por_que, "figura con nombre, puesto y por qué duele");
  assert(rep.forma.length === 0, "sin partidos jugados no hay forma");
  assert(rep.bajas.length === 0 && rep.enEliminatorias === false, "sin bajas y en grupos");
  // F2: el informe NOMBRA la filosofía rival y su nivel (roadmap del arco)
  assert(rep.filosofia && rep.filosofia.name && rep.filosofia.icon && rep.filosofia.detalle.length > 20,
    "el informe trae la identidad del rival", JSON.stringify(rep.filosofia));
  assert(["Aprendiendo", "En desarrollo", "Consolidada"].includes(rep.filosofia.nivel), "nivel de identidad legible");
  const espRep = E.buildOpponentReport(run, "ESP");
  assert(espRep.filosofia.id === "posesion" && espRep.filosofia.consolidada, "ESP llega como posesión consolidada (curación F2)");
}

// ---------- niveles relativos: el más fuerte del torneo visto por el jugable más débil ----------
{
  const weakest = [...byRating].reverse().find(t => t.playable);
  const run = E.newRun(weakest.id);
  const strong = byRating.find(t => t.id !== weakest.id);
  const rep = E.buildOpponentReport(run, strong.id);
  assert(rep.lineas.ataque.nivel === "Alto" && rep.lineas.defensa.nivel === "Alto",
    `el rival más fuerte (${strong.name}, ${E.teamRating(strong)}) es Alto para ${weakest.name} (${E.teamRating(weakest)})`,
    JSON.stringify(rep.lineas));
}

// ---------- bajas confirmadas: se listan y el informe las descuenta ----------
{
  const run = E.newRun("BRA");
  /* Antes buscaba un clasificado NO jugable, pero ya no queda ninguno: las 48 del
     Mundial 2026 tienen plantel completo. Se toma cualquier rival del torneo y su
     figura sale del plantel (`teamFigure`) o de `figures` si fuera de los que no
     clasificaron. Lo que se prueba —que la baja se lista y no mejora al rival— es
     exactamente lo mismo. */
  const opp = qualified.find(t => t.id !== "BRA");
  const star = opp.players ? E.teamFigure(opp).name : opp.figures[0].name;
  const clean = E.buildOpponentReport(run, opp.id);
  run.rivalBans[opp.id] = [star];
  const banned = E.buildOpponentReport(run, opp.id);
  assert(banned.bajas.length === 1 && banned.bajas[0] === star, "la baja aparece listada");
  assert(clean.bajas.length === 0, "el informe previo no tenía bajas");
  // El once esperado sin su figura no puede ser MEJOR: los niveles no suben
  const orden = { Bajo: 0, Medio: 1, Alto: 2 };
  for (const k of ["ataque", "defensa", "arquero"]) {
    assert(orden[banned.lineas[k].nivel] <= orden[clean.lineas[k].nivel],
      "perder una figura no mejora al rival", `${k}: ${clean.lineas[k].nivel}→${banned.lineas[k].nivel}`);
  }
}

// ---------- forma reciente: mapeo V/E/D desde los resultados reales, más reciente primero ----------
{
  const run = E.newRun("BRA");
  const g = run.groups.find((_, i) => i !== run.myGroupIdx);
  const [oppId, r1, r2] = [g.teamIds[0], g.teamIds[1], g.teamIds[2]];
  g.results.push({ a: oppId, b: r1, gA: 2, gB: 0 });   // victoria 2-0
  g.results.push({ a: r2, b: oppId, gA: 3, gB: 3 });   // empate 3-3 (de visita)
  const rep = E.buildOpponentReport(run, oppId);
  assert(rep.forma.length === 2, "dos partidos jugados, dos entradas de forma");
  assert(rep.forma[0].res === "E" && rep.forma[0].marcador === "3-3" && rep.forma[0].rival === E.getTeam(r2).name,
    "el más reciente primero, desde la perspectiva del rival", JSON.stringify(rep.forma[0]));
  assert(rep.forma[1].res === "V" && rep.forma[1].marcador === "2-0", "la victoria mapeada", JSON.stringify(rep.forma[1]));
}

// ---------- pureza: no muta la run y no consume rng ----------
{
  const run = E.newRun("BRA");
  const oppId = E.nextOpponentId(run);
  const antes = JSON.stringify({ squad: run.squad, buffs: run.buffs, dayPlan: run.dayPlan });
  const a = JSON.stringify(E.buildOpponentReport(run, oppId));
  const b = JSON.stringify(E.buildOpponentReport(run, oppId));
  assert(a === b, "dos llamadas seguidas dan el mismo informe (sin rng)");
  assert(JSON.stringify({ squad: run.squad, buffs: run.buffs, dayPlan: run.dayPlan }) === antes, "el informe no muta la run");
}

// ---------- el hint del Daily (H6 + F3) nombra la identidad rival y cita el informe ----------
{
  const run = E.newRun("BRA");
  run.day = run.nextMatchDay - 1; // previa: a 1 día del partido
  const daily = E.buildDaily(run);
  const rival = daily.items.find(i => i.tag === "RIVAL" && i.text.includes("Juegan al") && i.text.includes("El informe"));
  assert(!!rival, "la previa nombra la identidad rival y cita el informe (F3)", JSON.stringify(daily.items.filter(i => i.tag === "RIVAL").map(i => i.text)));
}


// ---------- CÓMO SE VA A PARAR (sprint del Territorio) ----------
{
  const run = E.newRun("BRA");
  const rep = E.buildOpponentReport(run, run.groups[run.myGroupIdx].teamIds.find(t => t !== "BRA"));
  assert(rep.bloque && rep.bloque.n >= 1 && rep.bloque.n <= 5, "el informe dice con qué altura se va a parar el rival", rep.bloque?.n);
  assert(rep.bloque.label && rep.bloque.icon && rep.bloque.detalle, "con nombre, icono y una lectura accionable");
  assert(!/\d/.test(rep.bloque.detalle), "y esa lectura NO le canta un número al jugador", rep.bloque.detalle);
  // La altura reportada es EXACTAMENTE la que va a jugar (misma fuente que el partido).
  assert(rep.bloque.n === E.baseHeight({ id: rep.filosofia.id, nivel: rep.filosofia.consolidada ? 2 : 1 })
      || rep.bloque.n === E.baseHeight({ id: rep.filosofia.id, nivel: 0 }),
    "y sale de la MISMA fuente que la altura del partido (field.baseHeight)", rep.bloque.n);
  // El que presiona se para arriba; el que se encierra, abajo.
  const alturas = ["press", "posesion", "contra", "bloque"].map(id => E.baseHeight({ id, nivel: 1 }));
  assert(alturas[0] > alturas[3] && alturas[1] > alturas[2],
    "las identidades proactivas se paran más arriba que las que esperan", alturas.join(","));
  assert(E.baseHeight({ id: "press", nivel: 2 }) > E.baseHeight({ id: "press", nivel: 1 }),
    "y la identidad consolidada radicaliza su altura");
  assert(E.baseHeight(null) === E.HEIGHT_DEFAULT, "sin identidad conocida, se asume bloque medio");
}

// ---------- EL CRUCE, ANTICIPADO (sprint del Rival que Decide) ----------
// Gate del PO: *"que el informe lo anticipe SIEMPRE: si no lo veo venir es un impuesto,
// no una decisión"*. El ciclo muerde 4.9pp de win% por partido, así que callarlo sería
// exactamente el impuesto que el PO prohibió.
{
  const run = E.newRun("BRA");
  const oppId = run.groups[run.myGroupIdx].teamIds.find(t => t !== "BRA");

  // Sin identidad elegida no hay cruce del que hablar (el informe del sorteo).
  assert(E.buildOpponentReport(run, oppId).filosofia.cruce === null, "sin identidad elegida el informe no inventa un cruce");

  // Con identidad, el informe lo nombra SIEMPRE y con el signo correcto.
  for (const mia of E.COUNTER_CYCLE) {
    E.choosePhilosophy(run, mia);
    const rep = E.buildOpponentReport(run, oppId);
    const c = rep.filosofia.cruce;
    assert(c, "con identidad elegida el cruce se nombra siempre", `${mia} vs ${rep.filosofia.id}`);
    assert(c.signo === E.counterEdge(mia, rep.filosofia.id), "y el signo es el del ciclo, no una prosa aparte", `${mia}|${rep.filosofia.id}`);
    assert(c.titulo && c.texto, "con titular y una lectura accionable");
    // La regla declarada del módulo: CUALITATIVO, nunca porcentajes. El ciclo se mide en
    // pp de win% y en share, y ninguno de los dos puede filtrarse al informe.
    assert(!/\d/.test(c.texto) && !/\d/.test(c.titulo), "y sin un solo número: el ojeador no es una planilla", c.texto);
  }

  // Las tres lecturas son DISTINTAS: si el cruce malo y el bueno dijeran lo mismo, el
  // informe estaría cumpliendo la forma y no la función. Se fabrican los tres signos
  // contra el MISMO rival, eligiendo yo la identidad que caza / la que es cazada / la
  // neutra — que es exactamente la decisión que el DT toma leyendo esta card.
  {
    const suya = E.rivalFilo(E.getTeam(oppId), 0).id;
    const mias = { 1: E.CAZADOR_DE[suya], [-1]: E.PRESA_DE[suya], 0: suya };
    const vistos = new Map();
    for (const [signo, mia] of Object.entries(mias)) {
      E.choosePhilosophy(run, mia);
      const c = E.buildOpponentReport(run, oppId).filosofia.cruce;
      assert(c.signo === +signo, "el cruce fabricado da el signo esperado", `${mia} vs ${suya} → ${c.signo}`);
      vistos.set(c.titulo + c.texto, signo);
    }
    assert(vistos.size === 3, "las tres lecturas del cruce son textos distintos", vistos.size);
  }
}

console.log(`scouting.test: ${checks} checks`);
console.log(fails ? "❌ scouting con fallos" : "✅ scouting OK");
process.exit(fails ? 1 : 0);
