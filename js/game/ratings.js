/* ============================================================
   game/ratings — notas 1-99, estrellas y resúmenes de stats.
   Las matemáticas están explicadas en docs/CORE.md §2-3.
   ============================================================ */
import { clamp } from "../core/math.js";
import { momentoMult } from "./momentum.js";

export const STAT_KEYS = ["tiro", "defensa", "cabezazo", "pase", "aura"];        // jugadores de campo
export const GK_STAT_KEYS = ["atajadas", "reflejos", "salidas", "pase", "aura"]; // arqueros

// ---------- Jugar fuera de puesto (docs/CORE.md §2b) ----------
// La línea del fútbol: de atrás hacia adelante. La distancia entre dos posiciones
// son los pasos que las separan aquí (DEF→MED = 1, DEF→DEL = 2).
const POS_LINE = ["POR", "DEF", "MED", "DEL"];
// Castigo por paso de distancia, en escala 1-99 (decisión del PO 15-jul: "suave").
export const OUT_OF_POS_STEP = 6;

/**
 * Posición en la que el jugador está parado hoy: la que le asignó el DT (`posJugada`,
 * la escribe game/lineup) o la suya natural. El arco es exclusivo de los POR, así que
 * `playedPos(p) === "POR"` ⟺ `p.pos === "POR"` — el resto del motor puede seguir
 * preguntando por `p.pos` para identificar al arquero.
 */
export function playedPos(p) { return p.posJugada || p.pos; }

/** Pasos de distancia entre dos posiciones en la línea POR–DEF–MED–DEL. */
export function posDistance(a, b) { return Math.abs(POS_LINE.indexOf(a) - POS_LINE.indexOf(b)); }

/** Castigo que sufriría este jugador parado en `pos` (0 si es el suyo). */
export function penaltyAt(p, pos) { return OUT_OF_POS_STEP * posDistance(p.pos, pos); }

/** Castigo que sufre cada stat técnica por jugar fuera de puesto (0 si juega en el suyo). */
export function outOfPosPenalty(p) { return penaltyAt(p, playedPos(p)); }

// Stat castigada según el puesto que se le pase. El **aura no se castiga**: es carisma y
// sangre fría, no depende del puesto en el que lo paren. El Momento (game/momentum) sí
// escala TODAS las stats — incluida el aura: la confianza es exactamente eso. Los rivales
// no tienen `momento`, así que su multiplicador es 1 (poder asimétrico, ver momentum.js).
// `conMomento: false` da la stat SIN la forma del día (naturalOverall la usa: talento puro).
function statAt(p, key, pos, conMomento = true) {
  const v = p.stats[key];
  if (v === undefined) return v;
  const base = key === "aura" ? v : v - penaltyAt(p, pos);
  return clamp(Math.round(base * (conMomento ? momentoMult(p) : 1)), 1, 99);
}

/**
 * Stat del jugador ya castigada si juega fuera de puesto.
 * Única fuente de verdad: la usan playerOverall (lo que ve el DT) y match/powers.effStat
 * (lo que calcula el partido), para que la ficha nunca mienta sobre la cancha.
 */
export function effectiveStat(p, key) { return statAt(p, key, playedPos(p)); }

/**
 * Stat BASE en el puesto que juega, SIN el % del Momento: el valor sobre el que el Momento
 * suma/resta (lo usa la ficha para pintar la barra base y el boost/nerf por separado).
 * Incluye el castigo por fuera de puesto y el crecimiento permanente del canje (`p.stats`).
 */
export function baseStatAt(p, key) { return statAt(p, key, playedPos(p), false); }

/**
 * Stats que le bajan al jugador por estar fuera de puesto: `[{key, base, real, delta}]`
 * (vacío si juega en el suyo). `base` es lo que tendría EN SU PUESTO con su momento
 * actual — así la ficha aísla el castigo posicional sin mezclarlo con el % del Momento.
 */
export function statPenalties(p) {
  if (!outOfPosPenalty(p)) return [];
  const keys = p.pos === "POR" ? GK_STAT_KEYS : STAT_KEYS;
  return keys.map(k => ({ key: k, base: statAt(p, k, p.pos), real: effectiveStat(p, k) }))
    .filter(s => s.real !== s.base)
    .map(s => ({ ...s, delta: s.real - s.base }));
}

// Nota 1-99 ponderada por posición: a un DEL le pesa el tiro, a un POR las atajadas.
// (Un promedio plano haría que Haaland con defensa 40 pareciera mediocre.)
export const OVR_WEIGHTS = {
  POR: { atajadas: 0.4, reflejos: 0.25, salidas: 0.1, pase: 0.05, aura: 0.2 },
  DEF: { defensa: 0.5, cabezazo: 0.2, pase: 0.15, aura: 0.15 },
  MED: { pase: 0.4, tiro: 0.2, defensa: 0.15, aura: 0.25 },
  DEL: { tiro: 0.5, cabezazo: 0.15, pase: 0.1, aura: 0.25 },
};

/**
 * Nota 1-99 que tendría el jugador parado en `pos`: promedio ponderado con los pesos de
 * ESE puesto y sus stats ya castigadas por la distancia. Fuera de puesto cae por partida
 * doble, y es intencional: se lo mide con los pesos del puesto nuevo (a un DEL de DEF le
 * pesa la defensa, su peor stat) y encima sus stats van castigadas.
 */
export function overallAt(p, pos, conMomento = true) {
  const w = OVR_WEIGHTS[pos];
  let sum = 0;
  for (const k in w) sum += statAt(p, k, pos, conMomento) * w[k];
  return Math.round(sum);
}

/** Nota 1-99 real de hoy: la del puesto que está jugando. Vinícius es 88 de DEL y 47 de DEF. */
export function playerOverall(p) { return overallAt(p, playedPos(p)); }

/**
 * La FIGURA de un equipo: el jugador de mayor media (`playerOverall`), **incluido el arquero**
 * (Cabo Verde, p. ej., tiene su mejor media en el arco — antes el menú excluía a los POR y
 * mostraba a otro). Desempate por **mayor aura** (decisión PO 21-jul-2026): a igual media,
 * manda la personalidad. Devuelve la referencia al jugador; `team.players` debe existir.
 */
export function teamFigure(team) {
  return [...team.players].sort((a, b) =>
    playerOverall(b) - playerOverall(a) || (b.stats.aura ?? 0) - (a.stats.aura ?? 0)
  )[0];
}

/**
 * Nota del jugador EN SU PUESTO, ignorando dónde lo hayan parado hoy Y su momento: es su
 * talento, no su circunstancia (el Momento es circunstancia, así que tampoco entra — y de
 * paso el once automático no persigue al que está en racha: recorte de balance 17-jul).
 * Ordena el plantel (`autoLineup`) y sirve de referencia en la ficha.
 * Sin esto, el once automático manda al banco al crack que venías usando fuera de puesto:
 * lo compara castigado contra suplentes intactos.
 */
export function naturalOverall(p) { return overallAt(p, p.pos, false); }

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

/**
 * Media del once elegido (promedio simple de los 6 en cancha). A diferencia de
 * teamRating (las 5 mejores notas del plantel = el techo del equipo), esta baja
 * cuando el DT alinea suplentes o le faltan titulares.
 */
export function lineupRating(selected) {
  if (!selected.length) return 0;
  return Math.round(selected.reduce((s, p) => s + playerOverall(p), 0) / selected.length);
}

/** Resumen compacto de stats para tooltips ("T90 D35 ..." / "AT90 RF88 ..."), ya castigado si juega fuera de puesto. */
export function statLine(p) {
  const s = k => effectiveStat(p, k);
  if (p.pos === "POR") return `AT${s("atajadas")} RF${s("reflejos")} SA${s("salidas")} P${s("pase")} A${s("aura")}`;
  return `T${s("tiro")} D${s("defensa")} C${s("cabezazo")} P${s("pase")} A${s("aura")}`;
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
  if (r >= 81) return { tier: "aspirante", label: "Aspirante", desc: "Plantel serio que puede pelearle a cualquiera, ¿Lograrás sacarle rendimiento?" };
  if (r >= 74) return { tier: "sorpresa", label: "Sorpresa", desc: "Nadie los tiene en la lista de candidatos. Sorprender partido a partido es tu única arma." };
  return { tier: "leyenda", label: "Leyenda", desc: "Ser campeón con este plantel te convierte en leyenda eterna del fútbol. ¿Te atreves?" };
}
