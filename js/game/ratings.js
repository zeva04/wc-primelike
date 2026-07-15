/* ============================================================
   game/ratings — notas 1-99, estrellas y resúmenes de stats.
   Las matemáticas están explicadas en docs/CORE.md §2-3.
   ============================================================ */
import { clamp } from "../core/math.js";

export const STAT_KEYS = ["tiro", "defensa", "cabezazo", "pase", "aura"];        // jugadores de campo
export const GK_STAT_KEYS = ["atajadas", "reflejos", "salidas", "pase", "aura"]; // arqueros

// Nota 1-99 ponderada por posición: a un DEL le pesa el tiro, a un POR las atajadas.
// (Un promedio plano haría que Haaland con defensa 40 pareciera mediocre.)
export const OVR_WEIGHTS = {
  POR: { atajadas: 0.4, reflejos: 0.25, salidas: 0.1, pase: 0.05, aura: 0.2 },
  DEF: { defensa: 0.5, cabezazo: 0.2, pase: 0.15, aura: 0.15 },
  MED: { pase: 0.4, tiro: 0.2, defensa: 0.15, aura: 0.25 },
  DEL: { tiro: 0.5, cabezazo: 0.15, pase: 0.1, aura: 0.25 },
};

/** Nota 1-99 del jugador: promedio de sus stats ponderado por posición. */
export function playerOverall(p) {
  const w = OVR_WEIGHTS[p.pos];
  let sum = 0;
  for (const k in w) sum += p.stats[k] * w[k];
  return Math.round(sum);
}

// Estrellas 0.5–5 con curva futbolera (antes nota/20 comprimía todo: España 92 daba 4.5★).
// 85+ = 5★ (las grandes: Argentina, Brasil, Francia...), y media estrella en todo el rango.
export function starsFromRating(r) {
  const thresholds = [85, 82, 79, 76, 73, 70, 67, 64, 61];
  let stars = 5;
  for (const th of thresholds) {
    if (r >= th) return stars;
    stars -= 0.5;
  }
  return 0.5;
}

/** Estrellas visuales de un jugador (misma curva que los equipos). */
export function playerStars(p) { return starsFromRating(playerOverall(p)); }

// Rating de equipo 1-99. Jugables: promedio de las 5 mejores notas (el once ideal),
// comparable con el rating directo de los rivales.
export function teamRating(team) {
  if (team.players) {
    const top5 = team.players.map(playerOverall).sort((a, b) => b - a).slice(0, 5);
    return Math.round(top5.reduce((a, b) => a + b, 0) / top5.length);
  }
  return team.rating;
}

/** Estrellas visuales de un equipo. */
export function teamStars(team) { return starsFromRating(teamRating(team)); }

/** Resumen compacto de stats para tooltips ("T90 D35 ..." / "AT90 RF88 ..."). */
export function statLine(p) {
  if (p.pos === "POR") return `AT${p.stats.atajadas} RF${p.stats.reflejos} SA${p.stats.salidas} P${p.stats.pase} A${p.stats.aura}`;
  return `T${p.stats.tiro} D${p.stats.defensa} C${p.stats.cabezazo} P${p.stats.pase} A${p.stats.aura}`;
}

/**
 * Aura actual del jugador para los penales: su stat base + el buff de aura activo del equipo,
 * es decir el mismo valor que el motor usa al resolver el penal. Sin buff equivale al aura base.
 */
export function currentAura(p, buffs) {
  return clamp(Math.round(p.stats.aura + ((buffs && buffs.aura) || 0)), 1, 99);
}

/**
 * Dificultad temática de una selección jugable según su media (umbrales 85/78/68).
 * Devuelve `tier` (clave estable para que la UI elija colores), label y descripción.
 */
export function difficultyOf(team) {
  const r = teamRating(team);
  if (r >= 85) return { tier: "favorito", label: "Favorito", desc: "Candidato al título. El mundo espera que levantes la copa." };
  if (r >= 78) return { tier: "aspirante", label: "Aspirante", desc: "Plantel serio que puede pelearle a cualquiera, ¿Lograrás sacarle rendimiento?" };
  if (r >= 68) return { tier: "sorpresa", label: "Sorpresa", desc: "Nadie los tiene en la lista de candidatos. Sorprender partido a partido es tu única arma." };
  return { tier: "leyenda", label: "Campaña legendaria", desc: "Ser campeón con este plantel te convierte en leyenda eterna del fútbol. ¿Te atreves?" };
}
