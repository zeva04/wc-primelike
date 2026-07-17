/* ============================================================
   game/tournament/groups — tablas, fechas y clasificación a
   16avos (formato Mundial 2026: 12 grupos de 4).
   ============================================================ */
import { rnd, shuffle } from "../../core/rng.js";

/** Tabla de posiciones de un grupo (pts, DG, GF; empate se resuelve al azar). */
export function computeTable(group) {
  const rows = {};
  for (const id of group.teamIds) rows[id] = { id, pj: 0, pg: 0, pe: 0, pp: 0, gf: 0, gc: 0, pts: 0 };
  for (const r of group.results) {
    const A = rows[r.a], B = rows[r.b];
    A.pj++; B.pj++; A.gf += r.gA; A.gc += r.gB; B.gf += r.gB; B.gc += r.gA;
    if (r.gA > r.gB) { A.pg++; B.pp++; A.pts += 3; }
    else if (r.gA < r.gB) { B.pg++; A.pp++; B.pts += 3; }
    else { A.pe++; B.pe++; A.pts++; B.pts++; }
  }
  return Object.values(rows).sort((x, y) =>
    y.pts - x.pts || (y.gf - y.gc) - (x.gf - x.gc) || y.gf - x.gf || (rnd() - 0.5));
}

// La simulación de la fecha ajena vive en tournament/world.js: el mundo juega
// día a día (playWorldDay) y flow cierra lo pendiente (finishGroupMatchday).

/** Rival del usuario en la fecha actual de la fase de grupos. */
export function myNextGroupRival(run) {
  const g = run.groups[run.myGroupIdx];
  const myIdx = g.teamIds.indexOf(run.teamId);
  for (const [i, j] of run.rounds[run.matchday]) {
    if (i === myIdx) return g.teamIds[j];
    if (j === myIdx) return g.teamIds[i];
  }
  return null;
}

/** Cierra la fase de grupos: 12 ganadores + 12 segundos + 8 mejores terceros → bracket de 16avos. */
export function qualifyRound32(run) {
  const winners = [], runners = [], thirds = [];
  for (const g of run.groups) {
    const t = computeTable(g);
    winners.push(t[0]); runners.push(t[1]); thirds.push(t[2]);
  }
  thirds.sort((x, y) => y.pts - x.pts || (y.gf - y.gc) - (x.gf - x.gc) || y.gf - x.gf || (rnd() - 0.5));
  const bestThirds = thirds.slice(0, 8);
  const qualified = [
    ...winners.map(r => r.id),
    ...runners.map(r => r.id),
    ...bestThirds.map(r => r.id),
  ];
  const meIn = qualified.includes(run.teamId);

  // Bracket: ganadores enfrentan a segundos/terceros; sin cruces del mismo grupo en 16avos si se puede
  const seedW = shuffle(winners.map(r => r.id));
  const seedRest = shuffle([...runners.map(r => r.id), ...bestThirds.map(r => r.id)]);
  const matches = [];
  for (let i = 0; i < 12; i++) matches.push([seedW[i], seedRest[i]]);
  for (let i = 12; i < 20; i += 2) matches.push([seedRest[i], seedRest[i + 1]]);
  return { qualified, meIn, matches: shuffle(matches) };
}
