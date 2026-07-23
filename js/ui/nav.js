/* ============================================================
   ui/nav — registro de navegación entre pantallas.

   Las pantallas se navegan unas a otras (menú→hub→partido→...)
   y eso formaría ciclos de import prohibidos (ARQUITECTURA §4).
   Solución: cada pantalla se REGISTRA aquí al importarse y las
   demás la invocan por nombre con go(). Nadie importa pantallas.

   Nombres registrados hoy: menu · history · start-run · draw ·
   hub · squad · worldcup · journal · start-match · shootout ·
   finish-match · end-run · end-screen
   ============================================================ */

const screens = new Map();

/** Registra una pantalla/acción de navegación por nombre. */
export function register(name, fn) { screens.set(name, fn); }

/** Navega: invoca la pantalla/acción registrada con sus argumentos. */
export function go(name, ...args) {
  const fn = screens.get(name);
  if (!fn) throw new Error(`nav: pantalla no registrada "${name}"`);
  return fn(...args);
}
