/* ============================================================
   game/assists — la tabla de asistidores del torneo.
   Espejo de game/scorers.js (léelo primero): misma mecánica,
   otra estadística.

   El motor solo produce marcadores (quickSim: gA-gB), no autores
   ni pases. Aquí se le pone asistidor a una FRACCIÓN de los goles
   ajenos (ASSIST_CHANCE), repartido entre las figuras del equipo
   ponderando por posición PRO-MEDIOCAMPO (un volante asiste más
   que un delantero; el arquero nunca). Los penales y las jugadas
   individuales no llevan asistencia — de ahí que ASSIST_CHANCE < 1.

   Fuentes que la alimentan (`run.assists`, mapa "teamId|name"→n):
     - tournament/world  → cada gol de un partido simulado ajeno
     - flow.closeMatch    → los goles del rival en MIS partidos
   MI equipo NO entra en run.assists: mis asistencias son EXACTAS
   (las atribuye el partido interactivo, chances.goalMine, a
   run.squad[].asistencias) y se combinan al construir la tabla —
   así no hay doble conteo, igual que con los goleadores.
   ============================================================ */
import { rnd } from "../core/rng.js";
import { getTeam } from "../data/teams-repo.js";

// Qué fracción de los goles de jugada llevan asistencia (decisión PO 20-jul-2026):
// los penales y las individuales quedan sin asistidor.
export const ASSIST_CHANCE = 0.70;
// Peso de cada puesto al repartir asistencias: PRO-MED (el volante habilita), el DEL
// medio, el DEF poco, el arquero nunca. Es lo que hace que el sistema ayude a los MED.
export const POS_ASSIST_WEIGHT = { MED: 3, DEL: 2, DEF: 1, POR: 0 };

const key = (teamId, name) => `${teamId}|${name}`;

/** Suma una asistencia a un jugador concreto en la tabla del torneo. */
export function addTournamentAssist(run, teamId, name) {
  const k = key(teamId, name);
  (run.assists[k] || (run.assists[k] = { teamId, name, asistencias: 0 })).asistencias++;
}

/**
 * Reparte los asistidores de `n` goles ajenos: cada gol tiene ASSIST_CHANCE de llevar
 * asistencia, atribuida a una figura del equipo ponderando por posición (pro-MED).
 * Consume rng → desplaza la secuencia del smoke (documentado, aceptable).
 */
export function assignAssists(run, teamId, n) {
  if (n <= 0) return;
  const t = getTeam(teamId);
  const roster = (t.players || t.figures || []).filter(p => p.name);
  if (!roster.length) return;
  const weights = roster.map(p => POS_ASSIST_WEIGHT[p.pos] ?? 1);
  const total = weights.reduce((s, w) => s + w, 0);
  if (total <= 0) return;
  for (let i = 0; i < n; i++) {
    if (rnd() >= ASSIST_CHANCE) continue; // este gol no tuvo asistencia
    let r = rnd() * total, picked = roster[0];
    for (let j = 0; j < roster.length; j++) { r -= weights[j]; if (r <= 0) { picked = roster[j]; break; } }
    addTournamentAssist(run, teamId, picked.name);
  }
}

/**
 * Tabla de asistidores del torneo: combina MI equipo (asistencias reales de run.squad,
 * que atribuye el partido) con el resto (run.assists). Ordena por asistencias desc
 * (desempate alfabético) y asigna ranking de competición (1·2·2·4…). `limit` corta el top N.
 */
export function tournamentAssists(run, limit = Infinity) {
  const mine = run.squad.filter(p => (p.asistencias || 0) > 0).map(p => ({ teamId: run.teamId, name: p.name, asistencias: p.asistencias }));
  const all = [...mine, ...Object.values(run.assists)].filter(s => s.asistencias > 0);
  all.sort((a, b) => b.asistencias - a.asistencias || a.name.localeCompare(b.name));
  let rank = 0, prev = null, seen = 0;
  for (const s of all) { seen++; if (s.asistencias !== prev) { rank = seen; prev = s.asistencias; } s.rank = rank; }
  return all.slice(0, limit === Infinity ? all.length : limit);
}
