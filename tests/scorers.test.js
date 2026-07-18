/* ============================================================
   Tests de la tabla de goleadores del torneo (game/scorers.js):
   - addTournamentGoal acumula por jugador
   - assignScorers reparte exactamente n goles entre figuras del
     equipo (nunca al arco salvo peso ínfimo) y respeta bordes
   - tournamentScorers combina mi equipo (run.squad) con el resto
     sin doble conteo, ordena por goles y da ranking de competición
   Uso: node tests/scorers.test.js
   ============================================================ */
import { loadEngine } from "./load-engine.js";

const { Engine: E } = await loadEngine();

let fails = 0, checks = 0;
const assert = (cond, msg, ctx) => { checks++; if (!cond) { fails++; console.error("FAIL:", msg, ctx ?? ""); } };

const totalGoles = run => Object.values(run.scorers).reduce((s, e) => s + e.goles, 0);

// ---------- addTournamentGoal ----------
{
  const run = E.newRun("BRA");
  assert(Object.keys(run.scorers).length === 0, "la run nace sin goleadores ajenos");
  E.addTournamentGoal(run, "FRA", "Mbappé");
  E.addTournamentGoal(run, "FRA", "Mbappé");
  E.addTournamentGoal(run, "ARG", "Messi");
  assert(run.scorers["FRA|Mbappé"].goles === 2, "acumula dos goles del mismo jugador");
  assert(run.scorers["ARG|Messi"].goles === 1, "cuenta a otro jugador aparte");
  assert(run.scorers["FRA|Mbappé"].teamId === "FRA", "guarda el equipo del goleador");
}

// ---------- assignScorers ----------
{
  const run = E.newRun("BRA");
  E.assignScorers(run, "FRA", 5);
  assert(totalGoles(run) === 5, "reparte exactamente n goles", totalGoles(run));
  const t = E.getTeam("FRA");
  const roster = new Set((t.players || t.figures).map(p => p.name));
  assert(Object.values(run.scorers).every(s => roster.has(s.name) && s.teamId === "FRA"), "todos los goleadores son figuras del equipo");

  E.assignScorers(run, "FRA", 0);
  assert(totalGoles(run) === 5, "asignar 0 goles no cambia nada");
  E.assignScorers(run, "FRA", -3);
  assert(totalGoles(run) === 5, "un negativo no rompe ni resta");
}

// ---------- reparto ponderado: un delantero anota más que un defensa (promedio por jugador,
//            no total por línea: eso depende de cuántos hay de cada puesto) ----------
{
  const run = E.newRun("BRA");
  E.assignScorers(run, "FRA", 6000);
  const t = E.getTeam("FRA");
  const roster = t.players || t.figures;
  const posDe = name => roster.find(p => p.name === name)?.pos;
  const golesPos = { POR: 0, DEF: 0, MED: 0, DEL: 0 };
  const cuentaPos = { POR: 0, DEF: 0, MED: 0, DEL: 0 };
  for (const p of roster) cuentaPos[p.pos]++;
  for (const s of Object.values(run.scorers)) golesPos[posDe(s.name)] += s.goles;
  const prom = pos => cuentaPos[pos] ? golesPos[pos] / cuentaPos[pos] : 0;
  assert(prom("DEL") > prom("MED"), "un delantero anota más que un mediocampista (promedio)", JSON.stringify({ DEL: prom("DEL"), MED: prom("MED") }));
  assert(prom("MED") > prom("DEF"), "un mediocampista anota más que un defensa (promedio)", JSON.stringify({ MED: prom("MED"), DEF: prom("DEF") }));
  assert(prom("DEF") > prom("POR"), "un defensa anota más que el arquero (promedio)", JSON.stringify({ DEF: prom("DEF"), POR: prom("POR") }));
}

// ---------- tournamentScorers: combina mi equipo sin doble conteo ----------
{
  const run = E.newRun("BRA");
  // mis goles viven en run.squad (no en run.scorers)
  const miDel = run.squad.find(p => p.pos === "DEL");
  miDel.goles = 3;
  E.addTournamentGoal(run, "FRA", "Mbappé"); // 1 gol ajeno
  const tabla = E.tournamentScorers(run);
  const miFila = tabla.find(s => s.name === miDel.name);
  assert(miFila && miFila.goles === 3 && miFila.teamId === "BRA", "mi goleador aparece con sus goles reales");
  assert(tabla.reduce((s, x) => s + x.goles, 0) === 4, "sin doble conteo: 3 míos + 1 ajeno", tabla.map(s => `${s.name}:${s.goles}`).join(","));
  assert(tabla[0].name === miDel.name && tabla[0].rank === 1, "el máximo goleador encabeza con rank 1");
}

// ---------- ranking de competición (1·2·2·4) ----------
{
  const run = E.newRun("BRA");
  E.addTournamentGoal(run, "FRA", "A"); E.addTournamentGoal(run, "FRA", "A"); E.addTournamentGoal(run, "FRA", "A"); // 3
  E.addTournamentGoal(run, "ARG", "B"); E.addTournamentGoal(run, "ARG", "B"); // 2
  E.addTournamentGoal(run, "ENG", "C"); E.addTournamentGoal(run, "ENG", "C"); // 2
  E.addTournamentGoal(run, "ITA", "D"); // 1
  const t = E.tournamentScorers(run);
  assert(t[0].rank === 1 && t[0].goles === 3, "1º con 3");
  assert(t[1].rank === 2 && t[2].rank === 2, "dos empatados en 2º");
  assert(t[3].rank === 4, "el siguiente salta a 4º (ranking de competición)", t[3].rank);
  assert(E.tournamentScorers(run, 2).length === 2, "el límite corta el top N");
}

// ---------- una run completa deja una tabla sana ----------
{
  const run = E.newRun("ARG");
  // Simular unos días para que el mundo juegue y asigne goleadores
  for (let i = 0; i < 4 && run.day < run.nextMatchDay; i++) {
    if (run.actionPending) E.applyDayAction(run, "recuperar");
    E.advanceDay(run);
  }
  assert(totalGoles(run) >= 0, "los goleadores del mundo se acumulan sin error");
  for (const s of Object.values(run.scorers)) {
    assert(s.teamId !== "ARG", "mi equipo nunca entra en run.scorers (se lee de squad)", s.name);
    assert(s.goles > 0 && s.name, "cada entrada es un goleador válido", JSON.stringify(s));
  }
}

console.log(`scorers.test: ${checks} checks · fallos: ${fails}`);
console.log(fails ? "❌ scorers con fallos" : "✅ scorers OK");
process.exit(fails ? 1 : 0);
