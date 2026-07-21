/* ============================================================
   Tests de la tabla de asistidores del torneo (game/assists.js):
   - addTournamentAssist acumula por jugador
   - assignAssists reparte asistencias a una FRACCIÓN de los goles
     (ASSIST_CHANCE) entre figuras del equipo, ponderando PRO-MED
     (el arquero nunca asiste) y respetando bordes
   - tournamentAssists combina mi equipo (run.squad[].asistencias)
     con el resto sin doble conteo, ordena y da ranking de competición
   Uso: node tests/assists.test.js
   ============================================================ */
import { loadEngine } from "./load-engine.js";

const { Engine: E } = await loadEngine();

let fails = 0, checks = 0;
const assert = (cond, msg, ctx) => { checks++; if (!cond) { fails++; console.error("FAIL:", msg, ctx ?? ""); } };

const total = run => Object.values(run.assists).reduce((s, e) => s + e.asistencias, 0);

// ---------- addTournamentAssist ----------
{
  const run = E.newRun("BRA");
  assert(Object.keys(run.assists).length === 0, "la run nace sin asistidores ajenos");
  E.addTournamentAssist(run, "FRA", "Griezmann");
  E.addTournamentAssist(run, "FRA", "Griezmann");
  E.addTournamentAssist(run, "ARG", "De Paul");
  assert(run.assists["FRA|Griezmann"].asistencias === 2, "acumula dos asistencias del mismo jugador");
  assert(run.assists["ARG|De Paul"].asistencias === 1, "cuenta a otro jugador aparte");
  assert(run.assists["FRA|Griezmann"].teamId === "FRA", "guarda el equipo del asistidor");
}

// ---------- assignAssists: solo una fracción de los goles llevan asistencia ----------
{
  const run = E.newRun("BRA");
  E.assignAssists(run, "FRA", 10000);
  const t = total(run);
  // ASSIST_CHANCE ≈ 0.70: con 10.000 goles el total ronda 7.000, NUNCA los 10.000.
  assert(t > 6000 && t < 8000, "reparte ~ASSIST_CHANCE·n asistencias", `${t} de 10000`);
  assert(t < 10000, "no todos los goles llevan asistencia", t);
  const tm = E.getTeam("FRA");
  const roster = new Set((tm.players || tm.figures).map(p => p.name));
  assert(Object.values(run.assists).every(s => roster.has(s.name) && s.teamId === "FRA"), "todos los asistidores son figuras del equipo");

  E.assignAssists(run, "FRA", 0);
  assert(total(run) === t, "asignar 0 goles no cambia nada");
  E.assignAssists(run, "FRA", -3);
  assert(total(run) === t, "un negativo no rompe ni resta");
}

// ---------- reparto ponderado PRO-MED: MED > DEL > DEF, y el arquero NUNCA asiste ----------
{
  const run = E.newRun("BRA");
  E.assignAssists(run, "FRA", 12000);
  const t = E.getTeam("FRA");
  const roster = t.players || t.figures;
  const posDe = name => roster.find(p => p.name === name)?.pos;
  const asisPos = { POR: 0, DEF: 0, MED: 0, DEL: 0 };
  const cuentaPos = { POR: 0, DEF: 0, MED: 0, DEL: 0 };
  for (const p of roster) cuentaPos[p.pos]++;
  for (const s of Object.values(run.assists)) asisPos[posDe(s.name)] += s.asistencias;
  const prom = pos => cuentaPos[pos] ? asisPos[pos] / cuentaPos[pos] : 0;
  assert(asisPos.POR === 0, "el arquero NUNCA asiste (peso 0)", asisPos.POR);
  assert(prom("MED") > prom("DEL"), "un mediocampista asiste más que un delantero (pro-MED)", JSON.stringify({ MED: prom("MED"), DEL: prom("DEL") }));
  assert(prom("DEL") > prom("DEF"), "un delantero asiste más que un defensa", JSON.stringify({ DEL: prom("DEL"), DEF: prom("DEF") }));
}

// ---------- tournamentAssists: combina mi equipo sin doble conteo ----------
{
  const run = E.newRun("BRA");
  const miMed = run.squad.find(p => p.pos === "MED");
  miMed.asistencias = 4; // mis asistencias viven en run.squad, no en run.assists
  E.addTournamentAssist(run, "FRA", "Griezmann"); // 1 ajena
  const tabla = E.tournamentAssists(run);
  const miFila = tabla.find(s => s.name === miMed.name);
  assert(miFila && miFila.asistencias === 4 && miFila.teamId === "BRA", "mi asistidor aparece con sus asistencias reales");
  assert(tabla.reduce((s, x) => s + x.asistencias, 0) === 5, "sin doble conteo: 4 mías + 1 ajena", tabla.map(s => `${s.name}:${s.asistencias}`).join(","));
  assert(tabla[0].name === miMed.name && tabla[0].rank === 1, "el máximo asistidor encabeza con rank 1");
}

// ---------- ranking de competición (1·2·2·4) ----------
{
  const run = E.newRun("BRA");
  E.addTournamentAssist(run, "FRA", "A"); E.addTournamentAssist(run, "FRA", "A"); E.addTournamentAssist(run, "FRA", "A"); // 3
  E.addTournamentAssist(run, "ARG", "B"); E.addTournamentAssist(run, "ARG", "B"); // 2
  E.addTournamentAssist(run, "ENG", "C"); E.addTournamentAssist(run, "ENG", "C"); // 2
  E.addTournamentAssist(run, "ITA", "D"); // 1
  const t = E.tournamentAssists(run);
  assert(t[0].rank === 1 && t[0].asistencias === 3, "1º con 3");
  assert(t[1].rank === 2 && t[2].rank === 2, "dos empatados en 2º");
  assert(t[3].rank === 4, "el siguiente salta a 4º (ranking de competición)", t[3].rank);
  assert(E.tournamentAssists(run, 2).length === 2, "el límite corta el top N");
}

// ---------- una run completa deja una tabla sana ----------
{
  const run = E.newRun("ARG");
  for (let i = 0; i < 4 && run.day < run.nextMatchDay; i++) {
    if (run.actionPending) E.applyDayAction(run, "recuperar");
    E.advanceDay(run);
  }
  assert(total(run) >= 0, "los asistidores del mundo se acumulan sin error");
  for (const s of Object.values(run.assists)) {
    assert(s.teamId !== "ARG", "mi equipo nunca entra en run.assists (se lee de squad)", s.name);
    assert(s.asistencias > 0 && s.name, "cada entrada es un asistidor válido", JSON.stringify(s));
  }
}

console.log(`assists.test: ${checks} checks · fallos: ${fails}`);
console.log(fails ? "❌ assists con fallos" : "✅ assists OK");
process.exit(fails ? 1 : 0);
