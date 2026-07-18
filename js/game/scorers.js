/* ============================================================
   game/scorers — la tabla de goleadores del torneo.

   El motor solo produce marcadores (quickSim: gA-gB), no autores.
   Aquí se le pone nombre a cada gol: se reparte entre las FIGURAS
   del equipo ponderando por posición (los delanteros anotan más),
   de forma coherente aunque no sea un simulador de goleadores real.

   Fuentes que la alimentan (`run.scorers`, mapa "teamId|name"→n):
     - tournament/world  → cada gol de un partido simulado ajeno
     - flow.closeMatch    → los goles del rival en MIS partidos
   MI equipo NO entra en run.scorers: sus goles ya son exactos en
   run.squad[].goles (fuente de la ficha, el Daily y el cierre), y
   se combinan al construir la tabla — así no hay doble conteo.
   ============================================================ */
import { rnd } from "../core/rng.js";
import { getTeam } from "../data/teams-repo.js";

// Peso de cada puesto al repartir goles: un DEL anota mucho más que un DEF; el arquero, casi nunca.
const POS_GOAL_WEIGHT = { DEL: 3, MED: 2, DEF: 1, POR: 0.05 };

const key = (teamId, name) => `${teamId}|${name}`;

/** Suma un gol a un jugador concreto en la tabla del torneo. */
export function addTournamentGoal(run, teamId, name) {
  const k = key(teamId, name);
  (run.scorers[k] || (run.scorers[k] = { teamId, name, goles: 0 })).goles++;
}

/** Reparte `n` goles de un equipo entre sus figuras, ponderando por posición. */
export function assignScorers(run, teamId, n) {
  if (n <= 0) return;
  const t = getTeam(teamId);
  const roster = (t.players || t.figures || []).filter(p => p.name);
  if (!roster.length) return;
  const weights = roster.map(p => POS_GOAL_WEIGHT[p.pos] ?? 1);
  const total = weights.reduce((s, w) => s + w, 0);
  for (let i = 0; i < n; i++) {
    let r = rnd() * total, picked = roster[0];
    for (let j = 0; j < roster.length; j++) { r -= weights[j]; if (r <= 0) { picked = roster[j]; break; } }
    addTournamentGoal(run, teamId, picked.name);
  }
}

/**
 * Tabla de goleadores del torneo: combina MI equipo (goles reales de run.squad) con el
 * resto (run.scorers). Ordena por goles desc (desempate alfabético) y asigna ranking de
 * competición (mismos goles → misma posición, 1·2·2·4…). `limit` corta el top N.
 */
export function tournamentScorers(run, limit = Infinity) {
  const mine = run.squad.filter(p => p.goles > 0).map(p => ({ teamId: run.teamId, name: p.name, goles: p.goles }));
  const all = [...mine, ...Object.values(run.scorers)].filter(s => s.goles > 0);
  all.sort((a, b) => b.goles - a.goles || a.name.localeCompare(b.name));
  let rank = 0, prev = null, seen = 0;
  for (const s of all) { seen++; if (s.goles !== prev) { rank = seen; prev = s.goles; } s.rank = rank; }
  return all.slice(0, limit === Infinity ? all.length : limit);
}
