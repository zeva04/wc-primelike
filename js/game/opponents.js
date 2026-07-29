/* ============================================================
   game/opponents — plantel y alineación efectiva de un equipo
   no jugable.
   ============================================================ */
import { rnd } from "../core/rng.js";
import { clamp } from "../core/math.js";
import { STAT_KEYS, GK_STAT_KEYS, playerOverall, teamRating } from "./ratings.js";
import { TEAM_PHILOSOPHIES, FILO_FORMATION } from "../content/team-philosophies.js";
import { getFormation } from "./lineup.js";

// Desvíos por posición al derivar stats desde el rating del equipo
// ODISEA (sprint 1): el `pase` se partió en corto/largo y entró la `velocidad`. El perfil
// de cada puesto se mantiene y se le suma el criterio nuevo: el lateral/extremo rival corre,
// el central es lento, el arquero no corre y el volante reparte corto mejor que largo.
export const POS_MODS = {
  POR: { atajadas: +8, reflejos: +5, salidas: -3, pase_corto: -14, pase_largo: -10, velocidad: -22, aura: 0 },
  DEF: { tiro: -30, defensa: +10, cabezazo: +10, pase_corto: -10, pase_largo: -12, velocidad: -2, aura: 0 },
  MED: { tiro: -10, defensa: -10, cabezazo: -10, pase_corto: +11, pase_largo: +7, velocidad: -4, aura: 0 },
  DEL: { tiro: +10, defensa: -40, cabezazo: +10, pase_corto: -9, pase_largo: -16, velocidad: +8, aura: +10 },
};

// Los 5 genéricos que completan el plantel rival hasta 10 (Jugador6..Jugador10).
// Cubren todas las líneas — incluido un arquero suplente, porque el arco solo
// puede ocuparlo un POR — y rinden por debajo de las figuras (GENERIC_MALUS):
// perder una figura por suspensión tiene que doler.
// Malus 4 y no 6: el sexto titular rival ES un genérico, así que el malus
// también debilita su once por defecto — con 6 el % de campeón derivaba
// arriba (BRA 32→36.5 en smoke); con 4 vuelve a la banda histórica.
const GENERIC_SLOTS = [["Jugador6", "DEF"], ["Jugador7", "MED"], ["Jugador8", "DEL"], ["Jugador9", "POR"], ["Jugador10", "MED"]];
const GENERIC_MALUS = 4;

/** Stats 1-99 derivadas del rating del equipo con los desvíos del puesto y ruido.
 *  Con noise=false no toca el rng: son las stats ESPERADAS (las usa el Informe del Rival). */
function deriveStats(rating, pos, noise = true) {
  const stats = {};
  for (const k of (pos === "POR" ? GK_STAT_KEYS : STAT_KEYS)) {
    stats[k] = clamp(Math.round(rating + POS_MODS[pos][k] + (noise ? (rnd() - 0.5) * 12 : 0)), 1, 99);
  }
  return stats;
}

/** Plantel de 10 de un rival no jugable: sus 5 figuras + los 5 genéricos. */
export function genOpponentSquad(team, noise = true) {
  const r = teamRating(team);
  return [
    ...team.figures.map(f => ({ name: f.name, pos: f.pos, stats: deriveStats(r, f.pos, noise) })),
    ...GENERIC_SLOTS.map(([name, pos]) => ({ name, pos, stats: deriveStats(r - GENERIC_MALUS, pos, noise) })),
  ];
}

/** Mejor seis de un pool: el mejor POR + el mejor de cada línea + relleno por nota. */
export function bestSix(pool) {
  const byOvr = (a, b) => playerOverall(b) - playerOverall(a);
  const por = pool.filter(p => p.pos === "POR").sort(byOvr)[0];
  const field = pool.filter(p => p.pos !== "POR").sort(byOvr);
  const lineup = por ? [por] : [];
  for (const pos of ["DEF", "MED", "DEL"]) {
    const best = field.find(p => p.pos === pos && !lineup.includes(p));
    if (best) lineup.push(best);
  }
  for (const p of field) { if (lineup.length >= 6) break; if (!lineup.includes(p)) lineup.push(p); }
  return lineup;
}

/**
 * Mejor seis CON FORMA (F2, decisión PO #4 "formación acorde"): mejor POR + los
 * mejores por línea que pide la formación curada; si una línea no alcanza
 * (bajas, plantel sin esa cantidad), completa por nota como bestSix de siempre.
 */
export function bestSixShaped(pool, formation) {
  const byOvr = (a, b) => playerOverall(b) - playerOverall(a);
  const need = { POR: 1, DEF: formation.def, MED: formation.med, DEL: formation.del };
  const lineup = [];
  for (const pos of ["POR", "DEF", "MED", "DEL"]) {
    lineup.push(...pool.filter(p => p.pos === pos).sort(byOvr).slice(0, need[pos]));
  }
  for (const p of pool.filter(p => p.pos !== "POR").sort(byOvr)) {
    if (lineup.length >= 6) break;
    if (!lineup.includes(p)) lineup.push(p);
  }
  return lineup;
}

/** La formación curada de un rival (los 16 con filosofía a mano) o null (bestSix normal). */
function curatedShape(team) {
  const filo = TEAM_PHILOSOPHIES[team.id];
  return filo ? getFormation(FILO_FORMATION[filo]) : null;
}

// FORMA DE TORNEO (arco del Rebalance R2, decisión PO 22-jul-2026): "el Mundial de
// verdad se juega en 5 finales" — el rival de eliminatorias llega en MODO MUNDIAL:
// +3% de rendimiento por ronda KO (16avos ×1.03 … final ×1.15). Entra como `p.forma`
// en el once generado y multiplica effStat (match/powers) — el mismo patrón de
// asimetría en los datos que energía/oxid: MIS jugadores nunca llevan el campo.
// Solo MIS partidos: el mundo simulado (tournament/sim) no cambia. El perfil rival
// (sequences.rivalProfile) lee los stats BASE a propósito: la escalada no cambia QUÉ
// fútbol te genera, cambia lo bien que lo ejecuta.
export const TOURNEY_FORM_PER_ROUND = 0.03;
/** Multiplicador de forma de torneo para una profundidad KO (0 en grupos → ×1). */
export function tourneyFormaMult(koRound) { return 1 + TOURNEY_FORM_PER_ROUND * (koRound || 0); }

/**
 * Alineación de 6 titulares del rival (Game Vision: formato 6v6), excluyendo a
 * los suspendidos (`banned`: nombres en `run.rivalBans`, las rojas del mundo
 * vivo). Jugables usan sus mejores 6 disponibles; el resto arma su mejor seis
 * del plantel de 10 (figuras + genéricos). Los 16 CURADOS (F2) forman con la
 * formación de su filosofía (el bloque de SWE presenta 3 DEF de verdad).
 * `koRound` (R2) estampa la forma de torneo en el once.
 */
export function genOpponentLineup(team, banned = [], koRound = 0) {
  const pool = (team.players || genOpponentSquad(team)).filter(p => !banned.includes(p.name));
  const shape = curatedShape(team);
  const forma = tourneyFormaMult(koRound);
  return (shape ? bestSixShaped(pool, shape) : bestSix(pool)).map(p => ({ name: p.name, pos: p.pos, num: p.num, stats: { ...p.stats }, look: p.look, energia: 100, forma, rival: true, amarilla: false, expulsado: false, lesionado: false }));
}

/**
 * Alineación ESPERADA del rival para el Informe (game/scouting): la misma regla
 * bestSix que usa el partido, pero con stats sin ruido — el informe estima, no
 * adivina la tirada del día. NO consume rng y respeta las bajas confirmadas.
 */
export function expectedOpponentLineup(team, banned = []) {
  const pool = (team.players || genOpponentSquad(team, false)).filter(p => !banned.includes(p.name));
  const shape = curatedShape(team); // el informe estima el once REAL: misma forma curada (F2)
  return (shape ? bestSixShaped(pool, shape) : bestSix(pool)).map(p => ({ name: p.name, pos: p.pos, num: p.num, stats: { ...p.stats }, look: p.look, energia: 100 }));
}
