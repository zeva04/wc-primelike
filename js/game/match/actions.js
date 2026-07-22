/* ============================================================
   game/match/actions — Football Actions (Bible §7, regla 6): los
   bloques de juego reutilizables con los que se arman las
   secuencias. Cada uno resuelve UN gesto (pase, regate, remate,
   presión, corte, atajada) sobre `effStat` y devuelve un
   resultado ESTRUCTURADO — NO narra ni muta el marcador. La
   narración y el hilo (escalar/cerrar) los maneja sequences.js;
   los goles los anota chances.goalMine/goalOpp. Así una misma
   acción sirve en cualquier tipo de secuencia y se testea sola.

   Las fórmulas están ANCLADAS a las de chances.js (las ocasiones
   sueltas que las secuencias reemplazan): la intención de A1 es
   "menos momentos interactivos y más largos", NO "otra matemática
   de gol". Si el gate deriva, el dial es el número de secuencias
   (sequences.js), no estos números — salvo que la deriva venga de
   acá, medido.
   ============================================================ */
import { rnd } from "../../core/rng.js";
import { clamp } from "../../core/math.js";
import { teamRating } from "../ratings.js";
import { effStat } from "./powers.js";

/** Nota de ataque del rival, escala 0..5 (misma que usaban las ocasiones sueltas). */
function oppR(m) { return teamRating(m.oppTeam) / 20; }

/**
 * Pase entre dos de los míos. `hard` = pase filtrado de riesgo (menos probable, pero en
 * una secuencia habilita un remate mejor). Espejo de la rama "pass" de resolveChance
 * (0.35 + pase·0.11), con el filtrado un poco más exigente.
 */
export function actPass(m, from, { hard = false } = {}) {
  const base = hard ? 0.58 : 0.38;
  const p = clamp(base + effStat(from, "pase", m.my.buffs) * (hard ? 0.06 : 0.11), 0.2, 0.92);
  return { ok: rnd() < p, hard };
}

/**
 * Regate/individual de un mío. Puede salir (ok), terminar en falta a favor → penal
 * (foul), o perderse. Espejo de la rama "solo" de resolveChance (aura·0.075 + 12% penal).
 */
export function actDribble(m, p) {
  const pr = clamp(0.05 + effStat(p, "aura", m.my.buffs) * 0.075, 0.05, 0.5);
  const roll = rnd();
  return { ok: roll < pr, foul: roll >= pr && roll < pr + 0.12 };
}

/**
 * Remate de un mío. `stat` (tiro/cabezazo) y `bonus` (una buena construcción o una
 * transición limpia dejan mejor perfil de remate). Espejo del remate automático de
 * myChance (0.12 + q·0.085 − oppR·0.035), que es el que fija el ritmo de gol del juego.
 * Devuelve solo si fue gol; anotar es cosa de sequences.js (goalMine con su asistidor).
 */
export function actShot(m, p, { stat = "tiro", bonus = 0 } = {}) {
  const q = effStat(p, stat, m.my.buffs);
  // El remate de definición de una secuencia es una ocasión construida: base más alta que el
  // remate ambiente (espejo del antiguo "shoot" interactivo, 0.14 + q·0.09).
  const pg = clamp(0.15 + q * 0.09 + bonus - oppR(m) * 0.035, 0.05, 0.66);
  return { ok: rnd() < pg };
}

/**
 * Remate del rival ante mi defensa (secuencias defensivas). `ok` = gol rival. Espejo
 * del remate automático de oppChance (arquero + zaga pesan). `stat` permite el cabezazo
 * (balón parado en contra) y `bonus` el perfil (un rival mejor parado remata mejor).
 */
export function actOppShot(m, shooter, mine, { stat = "tiro", bonus = 0 } = {}) {
  const q = effStat(shooter, stat);
  const porQ = mine.por ? (effStat(mine.por, "atajadas", m.my.buffs) * 0.65 + effStat(mine.por, "reflejos", m.my.buffs) * 0.35) : 1;
  const pg = clamp(0.12 + q * 0.08 + bonus - porQ * 0.06 - (mine.def - 2.5) * 0.04, 0.05, 0.6);
  return { ok: rnd() < pg };
}

/**
 * Duelo aéreo de un mío (pelotazo largo, balón parado): gana la pelota o la pierde.
 * Pesa el CABEZAZO — la stat que casi no jugaba — contra la zaga rival. `handicap` resta
 * probabilidad (la peinada al espacio es más difícil que ganar el choque frontal).
 */
export function actAerial(m, p, { handicap = 0 } = {}) {
  const q = effStat(p, "cabezazo", m.my.buffs);
  const pw = clamp(0.42 + q * 0.08 - oppR(m) * 0.03 - handicap, 0.15, 0.78);
  return { ok: rnd() < pw };
}

/**
 * Intento de MI equipo de cortar la construcción rival (contener/presionar en un
 * repliegue). `press` = salir a presionar arriba: corta más, pero si falla el rival
 * queda mejor perfilado (lo escala sequences.js). `bonus` suma probabilidad — la
 * recuperación alta (MI iniciativa, con el rival saliendo de su arco) roba más que
 * la contención de emergencia con el rival lanzado. `ok` = corté la jugada.
 */
export function actContain(m, mine, { press = false, bonus = 0 } = {}) {
  const base = press ? 0.30 : 0.42;
  const p = clamp(base + bonus + (mine.def - 2.5) * 0.06, 0.18, 0.78);
  return { ok: rnd() < p, press };
}
