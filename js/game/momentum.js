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
// Cuánto puede moverse en UN partido (decisión PO 18-jul-2026): subir cuesta más que
// caer — como mucho +1 hacia arriba, pero una mala actuación puede restar hasta −2.
// Asimétrico a propósito: reforzar la forma alta es lento; perderla, rápido.
export const MOMENTO_RISE_MAX = 1;
export const MOMENTO_FALL_MAX = 2;
// Etiqueta cualitativa de cada nivel: la UI muestra la palabra, no el número 1..7.
export const MOMENTO_LABELS = { 1: "Paupérrimo", 2: "Apagado", 3: "Malo", 4: "Normal", 5: "Bueno", 6: "Encendido", 7: "Inspirado" };

/** Etiqueta cualitativa del momento de un jugador ("Inspirado", "Normal"…). */
export function momentoLabel(p) { return MOMENTO_LABELS[p.momento === undefined ? MOMENTO_NEUTRO : p.momento]; }

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
 * El Momento es INDIVIDUAL: el resultado del equipo NO lo mueve (decisión PO 18-jul —
 * eso va a la Moral del equipo, game/morale). Señales del partido (subida acotada a
 * +MOMENTO_RISE_MAX, bajada a −MOMENTO_FALL_MAX):
 *  - gol propio: +1 por gol (máx +2 de esta señal)
 *  - penal fallado (en juego o tanda): −1 por fallo
 *  - arquero: valla invicta +1 · 3+ goles en contra −1 · penal atajado +1
 *
 * LESIÓN: si el jugador queda de baja (`lesionadoPartidos > 0`), la lesión le CORTA la
 * forma — vuelve al neutro (decisión PO 18-jul), sin importar lo que hizo antes de caer.
 *
 * DECAIMIENTO: sin señal individual (delta 0) — o sin jugar — el momento da un paso hacia
 * el neutro (4): la forma, buena o mala, se enfría sola si no se alimenta. Como el
 * resultado ya no la sostiene, mantener 6-7 exige rendir partido a partido.
 *
 * Devuelve el RESUMEN del cierre para el post-partido (análisis del cuerpo técnico):
 * `{name, pos, before, after, delta, reasons:[{tone:"up"|"down"|"flat", text}]}` —
 * cada `reason` es una señal que explica el cambio (el motor dueño de la regla también
 * la narra). La UI lo pinta; no lee `p.momento` para adivinar el porqué.
 */
export function applyMomentumPostMatch(run, p, played, match) {
  if (p.momento === undefined) p.momento = MOMENTO_NEUTRO; // runs guardadas antes del sprint
  const before = p.momento;
  // La lesión corta la forma: el que queda de baja vuelve al neutro (decisión PO 18-jul).
  if (p.lesionadoPartidos > 0) {
    p.momento = MOMENTO_NEUTRO;
    return { name: p.name, pos: p.pos, before, after: p.momento, delta: p.momento - before,
      reasons: before !== MOMENTO_NEUTRO ? [{ tone: before > MOMENTO_NEUTRO ? "down" : "up", text: "Una lesión le corta la forma" }] : [] };
  }
  // El sustituido también vivió el partido. flow ya lo cuenta en `played`; lo reforzamos
  // aquí para no depender de eso si se llama aislado (tests).
  const participo = played || p.sustituido;
  let raw = 0;
  const reasons = [];
  if (participo) {
    const goles = Math.min(match.scorers.filter(s => s.name === p.name).length, 2);
    if (goles) { raw += goles; reasons.push({ tone: "up", text: goles === 1 ? "Marcó un gol" : `Marcó ${goles} goles` }); }
    const fallados = match.pensFallados.filter(n => n === p.name).length;
    if (fallados) { raw -= fallados; reasons.push({ tone: "down", text: fallados === 1 ? "Falló un penal" : `Falló ${fallados} penales` }); }
    if (p.pos === "POR") {
      if (match.gOpp === 0) { raw += 1; reasons.push({ tone: "up", text: "Mantuvo la valla invicta" }); }
      else if (match.gOpp >= 3) { raw -= 1; reasons.push({ tone: "down", text: `Le convirtieron ${match.gOpp}` }); }
      const atajados = match.pensAtajadosPor.filter(n => n === p.name).length;
      if (atajados) { raw += atajados; reasons.push({ tone: "up", text: atajados === 1 ? "Atajó un penal" : `Atajó ${atajados} penales` }); }
    }
  }
  const delta = clamp(raw, -MOMENTO_FALL_MAX, MOMENTO_RISE_MAX);
  if (delta !== 0) {
    p.momento = clamp(p.momento + delta, MOMENTO_MIN, MOMENTO_MAX);
  } else {
    const step = Math.sign(MOMENTO_NEUTRO - p.momento);
    if (step !== 0) {
      p.momento += step;
      reasons.push({ tone: step > 0 ? "up" : "down", text: participo ? "Sin acciones decisivas, su forma vuelve hacia lo normal" : "No sumó minutos: su forma se enfría hacia lo normal" });
    }
  }
  return { name: p.name, pos: p.pos, before, after: p.momento, delta: p.momento - before, reasons };
}
