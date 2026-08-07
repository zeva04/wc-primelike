/* ============================================================
   core/rng — ÚNICO punto de azar del juego.
   Nadie fuera de este archivo llama a Math.random: esto
   habilita runs con semilla en el futuro.
   ============================================================ */

/** Azar uniforme [0,1). Único punto de aleatoriedad del motor. */
export const rnd = () => Math.random();

/** Entero aleatorio en [a, b] inclusive. */
export const ri = (a, b) => a + Math.floor(rnd() * (b - a + 1));

/** Elemento aleatorio de un array. */
export const pick = (arr) => arr[Math.floor(rnd() * arr.length)];

/** Copia barajada (Fisher-Yates); no muta el original. */
export const shuffle = (arr) => {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};

/** Muestra de una distribución de Poisson (goles de un partido simulado). */
export const poisson = (lambda) => {
  let L = Math.exp(-lambda), k = 0, p = 1;
  do { k++; p *= rnd(); } while (p > L);
  return k - 1;
};
