/* ============================================================
   game/momentum — el Momento del jugador (Bible cap. 6): la
   mitad DINÁMICA de la progresión. Stat temporal 1..7 por
   jugador (nace en 4 = neutro), que fluctúa por su rendimiento
   en cada partido y decae hacia el neutro cuando no hay señal.

   Efecto mecánico (decisión PO 17-jul-2026): buff/debuff
   porcentual a TODAS las stats — ±2% por paso desde el neutro,
   con tope ±4% (los niveles 1 y 7 rinden igual que 2 y 6: son
   estados narrativos más profundos, no más poder). Entra al
   juego por game/ratings.statAt, la fuente única de stats:
   ficha, partido, penales y tanda lo ven por el mismo caño.

   ⚠️ PODER ASIMÉTRICO: los rivales NO tienen `momento` (sus
   jugadores no llevan el campo → momentoPct devuelve 0). Igual
   que FEAT-003: si el balance deriva, se RECORTA el efecto
   (primero en penales/tanda), no se relaja el gate del smoke.
   ============================================================ */
import { clamp } from "../core/math.js";

export const MOMENTO_MIN = 1;
export const MOMENTO_NEUTRO = 4;
export const MOMENTO_MAX = 7;
// Efecto por paso desde el neutro y tope, en % (decisión PO 17-jul-2026)
export const MOMENTO_PCT_STEP = 2;
export const MOMENTO_PCT_CAP = 4;

/**
 * Efecto porcentual del momento sobre las stats (−4..+4). Un jugador sin el
 * campo (rivales, jugadores de la DB) devuelve 0: la asimetría vive en los
 * DATOS, no en caminos de código separados.
 */
export function momentoPct(p) {
  if (p.momento === undefined) return 0;
  return clamp((p.momento - MOMENTO_NEUTRO) * MOMENTO_PCT_STEP, -MOMENTO_PCT_CAP, MOMENTO_PCT_CAP);
}

/** Multiplicador de stats por momento (1 ± 0.04 como máximo). */
export function momentoMult(p) { return 1 + momentoPct(p) / 100; }

/**
 * Cierre de momento del partido para UN jugador (lo llama flow.postMatchUpdate,
 * como medical/discipline, ANTES de resetear los flags del partido).
 *
 * Señales del partido (suma acotada a ±2 por partido):
 *  - resultado del equipo: acerca y SOSTIENE la forma solo en la banda 3..5
 *    (victoria empuja/sostiene hasta 5, derrota hasta 3, el empate no mueve).
 *    Los extremos 6-7 y 1-2 NO se alcanzan ni se sostienen por resultados:
 *    exigen actuaciones individuales. Recorte de balance medido el 17-jul-2026:
 *    con victoria = +1 plano para todo el que jugaba, una racha plantaba al
 *    equipo entero en 6-7 y BRA derivaba +5pp en el smoke (precedente FEAT-003).
 *  - gol propio: +1 por gol (máx +2 de esta señal)
 *  - penal fallado (en juego o tanda): −1 por fallo
 *  - arquero: valla invicta +1 · 3+ goles en contra −1 · penal atajado +1
 *
 * DECAIMIENTO: sin señal neta (delta 0) y sin resultado que la sostenga — o sin
 * jugar — el momento da un paso hacia el neutro (4): la forma, buena o mala, se
 * enfría sola si no se alimenta.
 */
export function applyMomentumPostMatch(run, p, played, match) {
  if (p.momento === undefined) p.momento = MOMENTO_NEUTRO; // runs guardadas antes del sprint
  // El sustituido también vivió el partido. flow ya lo cuenta en `played`; lo reforzamos
  // aquí para no depender de eso si se llama aislado (tests).
  const participo = played || p.sustituido;
  let delta = 0, sostiene = false;
  if (participo) {
    const res = match.result();
    if (res.winner === "my") {
      if (p.momento < 5) delta += 1;
      else if (p.momento === 5) sostiene = true;
    } else if (res.winner === "opp") {
      if (p.momento > 3) delta -= 1;
      else if (p.momento === 3) sostiene = true;
    }
    delta += Math.min(match.scorers.filter(s => s.name === p.name).length, 2);
    delta -= match.pensFallados.filter(n => n === p.name).length;
    if (p.pos === "POR") {
      if (match.gOpp === 0) delta += 1;
      else if (match.gOpp >= 3) delta -= 1;
      delta += match.pensAtajadosPor.filter(n => n === p.name).length;
    }
    delta = clamp(delta, -2, 2);
  }
  if (delta !== 0) p.momento = clamp(p.momento + delta, MOMENTO_MIN, MOMENTO_MAX);
  else if (!sostiene) p.momento += Math.sign(MOMENTO_NEUTRO - p.momento); // paso hacia el neutro
}
