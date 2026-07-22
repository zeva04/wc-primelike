/* ============================================================
   game/philosophy — la identidad futbolística de la run
   (arco de Filosofía F1, decisiones PO 22-jul-2026).

   Posee `run.filoId` y lee `run.aristas` (que mutan content/
   day-actions con los focos de la Sesión Táctica y los eventos
   vía addFiloProgress). Reglas que viven acá:
   - nivel = f(suma de las 2 aristas propias)  → FILO_LEVELS
   - elección post-sorteo (gratis, antes del día 1)
   - cambio a mitad de run: cuesta la Acción del Día; las
     aristas PERSISTEN (demolición orgánica, decisión PO #1)
   - progresión por EJECUCIÓN (Bible §5 "successful execution"):
     acertar actos del tipo firma en partido suma progreso chico
     a la arista firma, con tope por partido.

   La filosofía viaja al partido como la moral: matchCtx.filo =
   {id, nivel} (se arma en screens/match.js Y tests/smoke.js);
   el Match no conoce la run (ARQUITECTURA §3.2).
   ============================================================ */
import { getPhilosophy, aristaById, FILO_LEVELS } from "../content/philosophies.js";
import { addJournal } from "./journal.js";

// Progresión por ejecución: cada ACIERTO de acto en una secuencia del tipo firma
// (los cuenta el Match en `match.filoHits`) vale FILO_EXEC_GAIN de la arista
// firma, con tope de FILO_EXEC_CAP aciertos por partido (decisión PO F1:
// +0.25 y tope +0.5 — dos partidos jugando tu fútbol = un día de Sesión
// Táctica; la cancha consolida, el entrenamiento sigue siendo la vía principal).
export const FILO_EXEC_GAIN = 0.25;
export const FILO_EXEC_CAP = 2;

/** Suma de las 2 aristas propias de la filosofía activa (0 sin filosofía). */
export function filoPoints(run) {
  const f = getPhilosophy(run.filoId);
  if (!f) return 0;
  return +f.aristas.reduce((s, k) => s + (run.aristas?.[k] || 0), 0).toFixed(2);
}

/** Índice del nivel actual en FILO_LEVELS (0 Aprendiendo · 1 En desarrollo · 2 Consolidada). */
export function filoLevel(run) {
  const pts = filoPoints(run);
  let lvl = 0;
  FILO_LEVELS.forEach((l, i) => { if (pts >= l.min) lvl = i; });
  return lvl;
}

/** La filosofía para matchCtx: `{id, nivel}` o null — la frontera run→Match, como la moral. */
export function filoCtx(run) {
  return run.filoId ? { id: run.filoId, nivel: filoLevel(run) } : null;
}

/**
 * Elección post-sorteo (decisión PO #1): gratis, antes del día 1. Devuelve la
 * filosofía elegida o null si el id no existe. No valida "ya elegiste" — la
 * pantalla del sorteo solo la llama una vez; re-elegir después pasa por
 * changePhilosophy (con costo).
 */
export function choosePhilosophy(run, filoId) {
  const f = getPhilosophy(filoId);
  if (!f) return null;
  run.filoId = f.id;
  const nombres = f.aristas.map(k => aristaById(k).label);
  addJournal(run, {
    icon: f.icon, tone: "gold", title: `El equipo abraza una identidad: ${f.name}`,
    desc: `${f.lema} El plan: entrenar ${nombres.join(" y ")} hasta que ese fútbol salga solo.`,
  });
  return f;
}

/**
 * Cambio de filosofía a mitad de run: CUESTA la Acción del Día (decisión PO #1)
 * y la demolición es orgánica — `run.aristas` no se toca: lo entrenado persiste,
 * pero la nueva identidad combina otras aristas (costo hundido real, sin castigo
 * arbitrario). Devuelve la filosofía nueva, o null si no hay acción pendiente,
 * el id no existe o es la actual (la UI no debería permitirlo).
 */
export function changePhilosophy(run, filoId) {
  const f = getPhilosophy(filoId);
  if (!f || !run.actionPending || f.id === run.filoId) return null;
  const prev = getPhilosophy(run.filoId);
  run.filoId = f.id;
  run.actionPending = false;
  run.lastAction = { day: run.day, id: `filo_${f.id}`, group: null, icon: f.icon, title: `Cambio de identidad: ${f.name}` };
  addJournal(run, {
    icon: "🔄", tone: "neutral", title: `Golpe de timón: de ${prev ? prev.name : "la nada"} a ${f.name}`,
    desc: `El día entero se fue en reinstalar ideas. Lo entrenado no se borra, pero la nueva identidad vive de ${f.aristas.map(k => aristaById(k).label).join(" y ")}.`,
  });
  return f;
}

/**
 * Progresión por ejecución tras el partido (la llama flow.postMatchUpdate, del
 * lado run de la frontera): convierte `match.filoHits` (aciertos de actos del
 * tipo firma, cuenta el Match) en progreso de la arista firma, con tope.
 * Devuelve `{arista, add, hits}` para el relato del post-partido (F3) o null
 * si no hubo nada que sumar.
 */
export function applyFiloExecution(run, match) {
  const f = getPhilosophy(run.filoId);
  const hits = Math.min(match.filoHits || 0, FILO_EXEC_CAP);
  if (!f || !hits) return null;
  run.aristas = run.aristas || {};
  const add = +(hits * FILO_EXEC_GAIN).toFixed(2);
  run.aristas[f.firma] = +((run.aristas[f.firma] || 0) + add).toFixed(2);
  return { arista: aristaById(f.firma), add, hits };
}
