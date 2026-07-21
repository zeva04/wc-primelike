/* ============================================================
   game/match/powers — fórmulas de poder del partido
   (docs/CORE.md §4-5). Sin estado, sin azar.
   ============================================================ */
import { clamp } from "../../core/math.js";
import { effectiveStat, playedPos } from "../ratings.js";

// Modificadores de la mentalidad táctica (en escala normalizada ~0-5)
export const MENT_MOD = { defensiva: { atk: -0.5, def: +0.6 }, normal: { atk: 0, def: 0 }, ofensiva: { atk: +0.6, def: -0.5 } };

/**
 * Stat efectiva normalizada a ~0-5 (stat 1-99 ÷ 20), con buffs (escala 1-99) y castigo por energía.
 * Parte de `effectiveStat`, así que el castigo por jugar fuera de puesto entra al partido
 * por el mismo caño que ve el DT en la ficha (docs/CORE.md §2b).
 *
 * PESO DE LA ENERGÍA (rebalance del PO, 20-jul-2026): la energía vale **20%** del
 * rendimiento (antes 35%). Iba acoplado a subir el cansancio del partido
 * (`medical.FATIGUE_PER_30`: −14 cada 30'): un jugador cansado ya no queda inservible,
 * pero los partidos vacían más rápido — la rotación sigue importando y Entrenar deja de
 * ser una trampa. Medido: Entrenar pasó de 12.0% a 22.5% de campeón como estrategia fija
 * (−16.9pp → −4.9pp respecto del juego mixto) con la dificultad intacta. Ver CORE §4.
 */
export function effStat(p, key, buffs = {}) {
  let v = effectiveStat(p, key);
  if (buffs[key]) v += buffs[key];
  const en = p.energia !== undefined ? p.energia : 100;
  return clamp(v / 20, 0.05, 5.5) * (0.80 + 0.20 * (en / 100));
}

/** Calidad global del arquero: atajadas manda (60%), reflejos (25%) y salidas (15%) complementan. */
export function gkQuality(por, buffs) {
  if (!por) return 1;
  return effStat(por, "atajadas", buffs) * 0.6 + effStat(por, "reflejos", buffs) * 0.25 + effStat(por, "salidas", buffs) * 0.15;
}

/** Poder ofensivo y defensivo (~0-5) de una alineación, con mentalidad y castigo por expulsados. */
export function teamPowers(lineup, mentalidad, buffs) {
  // Reparto por el puesto que JUEGA cada uno (no el natural): si el DT paró a un
  // delantero de defensa, ese delantero alimenta el poder defensivo — castigado.
  const act = lineup.filter(p => !p.expulsado && !p.lesionado);
  const por = act.find(p => playedPos(p) === "POR");
  const atkP = act.filter(p => playedPos(p) === "DEL" || playedPos(p) === "MED");
  const defP = act.filter(p => playedPos(p) === "DEF");
  const avg = (ps, k) => ps.length ? ps.reduce((s, p) => s + effStat(p, k, buffs), 0) / ps.length : 1;
  const auraAll = avg(act, "aura");
  let atk = avg(atkP, "tiro") * 0.4 + avg(act.filter(p => playedPos(p) === "MED"), "pase") * 0.3 + avg(atkP, "cabezazo") * 0.12 + auraAll * 0.18;
  let def = avg(defP, "defensa") * 0.52 + gkQuality(por, buffs) * 0.32 + auraAll * 0.16;
  const m = MENT_MOD[mentalidad] || MENT_MOD.normal;
  atk += m.atk; def += m.def;
  // Sesión táctica (content/day-actions): bonus parejo de equipo, ya en escala ~0-5.
  // Solo llega por los buffs propios — el rival calcula sus poderes con buffs = {}.
  if (buffs.tactica) { atk += buffs.tactica; def += buffs.tactica; }
  // jugar con menos hombres castiga (formato 6v6)
  const missing = 6 - act.length;
  if (missing > 0) { atk *= (1 - 0.18 * missing); def *= (1 - 0.15 * missing); }
  return { atk: Math.max(0.5, atk), def: Math.max(0.5, def), por };
}
