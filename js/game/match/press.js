/* ============================================================
   game/match/press — EL BOTÓN DE PRESIÓN.

   La primera palanca del DT que se acciona DURANTE el juego y no
   entre secuencias: apretar arriba a voluntad, a cambio de piernas.
   Hasta ahora el partido solo ofrecía decisiones puntuales (elegir
   una opción de secuencia); esto es un ESTADO que el DT enciende y
   que corre solo hasta que se apaga.

   El trato, en una línea: mientras la presión está encendida el
   equipo roba mucho más arriba y ataca mejor, se expone algo atrás,
   y **los minutos presionados cuestan el doble de energía** — la
   factura no se paga en este partido sino en el siguiente, que es
   exactamente donde duele (la economía de energía es el dial más
   sensible del juego, docs/CORE.md §Energía).

   POR QUÉ SE MIDE EN MINUTOS DE PARTIDO Y NO EN SEGUNDOS DE RELOJ:
   el ritmo del relato NO es uniforme — un tick de crucero dura
   ~600 ms pero una secuencia congela el reloj mientras el DT lee y
   decide. Con un temporizador de pared, la presión se consumiría
   entera detrás de un modal abierto, o se recargaría gratis
   mientras el jugador piensa. Atada a los minutos del partido, la
   ráfaga siempre dura lo mismo EN FÚTBOL. La barra de la UI se
   anima suave (CSS) para que igual SE LEA como una recarga en
   tiempo real: la sensación es la que pidió el PO, sin que el
   estado del juego dependa de cuánto tarda el jugador en leer.
   ============================================================ */
import { hooksOf } from "./trait-hooks.js";
import { markMomentum } from "./match-momentum.js";

/** Cuánto dura una ráfaga, en minutos de partido (2 ticks de simulación). */
export const PRESS_DURATION = 10;
/** Cuánto tarda en recargarse desde que se apaga (2 ticks). */
export const PRESS_COOLDOWN = 10;
/** Tope duro de ráfagas por partido. Con ciclo de 20', el reloj ya limita a ~5:
 *  el tope existe para que la prórroga no regale ráfagas extra. */
export const PRESS_MAX_USES = 5;

/* El efecto mientras está encendida. Es la MISMA moneda que la mentalidad
   (powers.MENT_MOD): press no es un rasgo —que jamás puede ser un buff plano—
   sino una orden del DT con costo explícito, igual que salir a ofensiva.
   Deliberadamente MENOR que un cambio de mentalidad (ofensiva vale +0.6/−0.5):
   dura 10 minutos y ya se paga con energía. */
export const PRESS_MOD = { atk: 0.30, def: -0.20 };
/** Y el pool se inclina: presionar es robar arriba, no reventar la pelota. */
export const PRESS_POOL = { recuperacion: 1.8, pelotazo: 0.7 };

/** El estado inicial que cuelga de cada Match. */
export const newPressState = () => ({ on: false, usos: 0, hasta: 0, listoEn: 0 });

/** ¿Está encendida AHORA? (la leen powers y el pool de secuencias) */
export const pressOn = (m) => !!m.press?.on;

/** ¿Se puede encender en este momento? */
export function canPress(m) {
  const p = m.press;
  if (!p || m.finished || p.on) return false;
  return p.usos < PRESS_MAX_USES && m.min >= p.listoEn;
}

/**
 * Enciende la ráfaga. Devuelve true si prendió (la UI no debería llamarla
 * cuando no corresponde, pero la regla vive acá y no en el botón).
 */
export function startPress(m) {
  if (!canPress(m)) return false;
  m.press.on = true;
  m.press.usos += 1;
  m.press.hasta = m.min + PRESS_DURATION;
  // MARCA en el gráfico, NUNCA puntos: el Match Momentum solo sube si la presión
  // produce mejores secuencias (regla de oro de match-momentum.js).
  markMomentum(m, "🔥");
  m.log("info", `🔥 min ${m.clock()}' — ¡A PRESIONAR! El banco manda salir a apretar arriba: el equipo sube veinte metros de golpe.`);
  return true;
}

/**
 * Un latido del estado, al principio de cada tick (Match.tick lo llama con el
 * minuto YA avanzado). Apaga la ráfaga vencida y abre la recarga.
 */
export function tickPress(m) {
  const p = m.press;
  if (!p?.on || m.min < p.hasta) return;
  p.on = false;
  p.listoEn = m.min + PRESS_COOLDOWN;
  m.log("plain", `😮‍💨 min ${m.clock()}' — La presión afloja: el equipo recupera la línea y toma aire.`);
}

/**
 * Lo que la UI necesita para pintar el botón y su barra, sin saber ninguna regla:
 *   on      — encendida (botón en llamas)
 *   ready   — se puede apretar
 *   pct     — 0..100 de la barra: lo que queda de ráfaga si está on, lo recargado si no
 *   usos    — ráfagas gastadas · restantes
 */
export function pressState(m) {
  const p = m.press || newPressState();
  const agotado = p.usos >= PRESS_MAX_USES;
  if (p.on) {
    const queda = Math.max(0, p.hasta - m.min);
    return { on: true, ready: false, agotado, pct: (100 * queda) / PRESS_DURATION, usos: p.usos, restantes: PRESS_MAX_USES - p.usos };
  }
  const falta = Math.max(0, p.listoEn - m.min);
  const pct = agotado ? 0 : falta ? 100 * (1 - falta / PRESS_COOLDOWN) : 100;
  return { on: false, ready: canPress(m), agotado, pct, usos: p.usos, restantes: PRESS_MAX_USES - p.usos };
}

/**
 * El SOBRECOSTO de energía de un jugador, en minutos equivalentes: cada minuto
 * presionado cuenta doble, así que se cobra una vez más lo presionado. Devuelve
 * minutos, no energía — la conversión sigue siendo de medical.matchFatigue, que
 * es la única que sabe cuánto cuesta un minuto (un solo dueño del dial).
 *
 * Pulmones de Acero (Press) y Anaeróbicos (Contra) entran JUSTO acá: abaratan el
 * acto de presionar y NADA más — nunca la fatiga general del partido. Se APILAN
 * multiplicativos: tener los dos rinde ×0.85 × ×0.85, no el mejor de los dos.
 */
export function pressExtraMinutes(m, minutosPresionados) {
  return hooksOf(m, "pressStamina").reduce((min, h) => min * h.factor, minutosPresionados);
}
