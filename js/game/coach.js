/* ============================================================
   game/coach — EL DIRECTOR TÉCNICO: la segunda capa de progresión.

   Posee `run.dtXp` y `run.dtNivel` (1..20). El DT NO gana
   experiencia directa: toda su XP viene de que las Filosofías
   suban de nivel — la recompensa crece con el nivel alcanzado
   (llevar una idea de 9 a 10 paga 3× lo que pagó de 2 a 3), así
   que ESPECIALIZAR rinde más que repartirse.

   Cada nivel del DT otorga 1 Punto de Identidad (game/traits los
   gasta en el árbol). El PI inicial no nace acá: nace de elegir
   filosofía (game/philosophy), que ES el nivel 1 del DT.

   Los dos diales del arco viven en este archivo:
   - FILO_LEVEL_REWARD: cuánto paga cada subida de filosofía.
   - DT_STEP: cuánta XP cuesta cada nivel del DT.
   Calibración objetivo del GDD: run promedio 12-15 · muy buena
   16-18 · run perfecta 20 (con la filosofía principal en 10).
   ============================================================ */
import { addJournal } from "./journal.js";

export const DT_MAX = 20;

/* Lo que paga cada subida de Filosofía, INDEXADO POR EL NIVEL ALCANZADO
   (tabla del GDD, valores exactos). Subir la principal de 9→10 vale 650; una
   segunda filosofía de 1→2 vale 200. Total de una filosofía llevada al tope:
   3.370 XP de DT. */
export const FILO_LEVEL_REWARD = [0, 0, 200, 220, 250, 290, 340, 400, 470, 550, 650];
export const filoLevelReward = (nivel) => FILO_LEVEL_REWARD[nivel] ?? 0;

/* La curva del DT: cada nivel cuesta más que el anterior (100 el 2º, +20 por
   nivel, 480 el 20º → 5.320 XP acumuladas para el tope). Con la principal en 10
   (3.370) hacen falta ~2.000 más: ahí entran las secundarias — el GDD pide que
   una run perfecta llegue a las dos cosas a la vez, no a una sola. */
export const DT_STEP = (n) => 100 + 20 * (n - 1);   // costo de n → n+1
export const DT_LEVELS = Array.from({ length: DT_MAX }, (_, i) =>
  Array.from({ length: i }, (_, k) => DT_STEP(k + 1)).reduce((s, x) => s + x, 0));

/** Nivel de DT (1..20) que corresponde a una XP acumulada. */
export function dtLevelOf(xp) {
  let lvl = 1;
  DT_LEVELS.forEach((min, i) => { if ((xp || 0) >= min) lvl = i + 1; });
  return lvl;
}

/** Progreso dentro del nivel actual: {curr, need, pct} (o pct 100 en el tope). */
export function dtProgress(run) {
  const xp = run.dtXp || 0, lvl = run.dtNivel || 1;
  if (lvl >= DT_MAX) return { curr: 0, need: 0, pct: 100 };
  const piso = DT_LEVELS[lvl - 1], techo = DT_LEVELS[lvl];
  return { curr: Math.round(xp - piso), need: techo - piso, pct: Math.min(100, (100 * (xp - piso)) / (techo - piso)) };
}

/**
 * Suma XP al DT y resuelve las subidas de nivel: cada una otorga 1 PI y se
 * narra en el diario. Devuelve {xp, niveles, pi, nivel} para el post-partido
 * (o null si no había nada que sumar).
 */
export function addCoachXp(run, xp, motivo = "") {
  if (!xp) return null;
  run.dtXp = (run.dtXp || 0) + xp;
  const antes = run.dtNivel || 1;
  const ahora = dtLevelOf(run.dtXp);
  const niveles = Math.max(0, ahora - antes);
  if (niveles) {
    run.dtNivel = ahora;
    run.identityPoints = (run.identityPoints || 0) + niveles;
    addJournal(run, {
      icon: "🧠", tone: "gold", title: `El DT sube a nivel ${ahora}${niveles > 1 ? ` (+${niveles})` : ""}`,
      desc: `${motivo ? `${motivo} ` : ""}El oficio crece: +${niveles} Punto${niveles > 1 ? "s" : ""} de Identidad (tienes ${run.identityPoints}) para gastar en el árbol de rasgos.`,
    });
  }
  return { xp, niveles, pi: niveles, nivel: ahora };
}
