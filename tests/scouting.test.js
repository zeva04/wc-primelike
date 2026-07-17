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
  const opp = qualified.find(t => !t.playable && t.id !== "BRA");
  const star = opp.figures[0].name;
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

// ---------- el hint del Daily (H6) cita el informe en la previa ----------
{
  const run = E.newRun("BRA");
  run.day = run.nextMatchDay - 1; // previa: a 1 día del partido
  const daily = E.buildDaily(run);
  const rival = daily.items.find(i => i.tag === "RIVAL" && i.text.includes("informe del cuerpo técnico"));
  assert(!!rival, "la previa cita el informe del cuerpo técnico", JSON.stringify(daily.items.map(i => i.tag)));
}

console.log(`scouting.test: ${checks} checks`);
console.log(fails ? "❌ scouting con fallos" : "✅ scouting OK");
process.exit(fails ? 1 : 0);
