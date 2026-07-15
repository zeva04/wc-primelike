/* ============================================================
   core/math — numérica genérica, sin conocimiento del juego.
   ============================================================ */

/** Acota x al rango [lo, hi]. */
export const clamp = (x, lo, hi) => Math.max(lo, Math.min(hi, x));

/** Trunca a pasos de 0.5 (4.8 → 4.5). */
export const truncHalf = (x) => Math.floor(x * 2) / 2;
