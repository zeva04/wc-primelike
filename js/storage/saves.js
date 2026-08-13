/* ============================================================
   storage/saves — LAS TRES RANURAS de partida guardada.

   ── Por qué localStorage y no un archivo ─────────────────────────────────────
   La pregunta del PO era "¿JSON o .js?". En un juego de navegador sin build y sin
   servidor propio la respuesta no es de gusto: **un .js no se puede escribir desde
   la página**. `data/teams.js` es un módulo que el navegador IMPORTA (solo lectura,
   lo edita el PO a mano); lo que el jugador genera tiene que ir a un almacén que el
   navegador sepa escribir, y el único disponible sin backend es `localStorage`, que
   guarda strings. O sea: **JSON serializado en localStorage**, mismo camino que
   `storage/history.js`. Un archivo en disco pediría descargar/subir a mano cada
   partida — eso es la función "exportar", no "guardar".

   Esto es la deuda que ARQUITECTURA §7 tenía anotada como "Guardar run a mitad", y
   es gratis porque §3.1 ya obliga a que `run` sea JSON-izable (nada de funciones,
   nodos DOM ni referencias circulares; los jugadores cruzan fronteras por `name`).

   ── Lo que NO entra ──────────────────────────────────────────────────────────
   La instancia `Match` no es serializable a mitad de partido (limitación declarada
   en ARQUITECTURA §3.1). Como el juego escribe la ranura AL TERMINAR CADA DÍA, el
   último guardado de un día de partido es el instante ANTES de salir a la cancha:
   quien cierra la pestaña al minuto 67 vuelve al hub con su once puesto y el botón
   "Jugar partido". Se re-juega, no se retoma.

   ── Forma del almacén ────────────────────────────────────────────────────────
     wc26_saves = { v: 1, slots: [ranura|null, ranura|null, ranura|null] }
     ranura     = { v: 1, savedAt: <epoch ms>, fin: null|{...}, run: {...} }

   `v` se compara al leer: una ranura de otra versión NO se intenta interpretar (un
   run al que le falta un campo revienta la pantalla que lo pinta). Se devuelve
   marcada como incompatible y la UI solo ofrece borrarla — mentir sobre una partida
   vieja es peor que decir que no se puede abrir.

   Este módulo es tonto a propósito: lee, escribe y valida la FORMA. Quién guarda y
   cuándo lo decide la sesión (ui/save.js) — `game/**` no puede importar `storage/`.
   ============================================================ */

const KEY = "wc26_saves";

/** Cuántas partidas en paralelo caben. Tres, y una copa por ranura. */
export const SLOTS = 3;

/** Versión del formato de ranura. Subirla invalida los guardados viejos a propósito. */
export const SAVE_VERSION = 1;

/** El almacén entero, o null si no hay/está corrupto. */
function leerTodo() {
  try {
    const raw = JSON.parse(localStorage.getItem(KEY));
    return raw && Array.isArray(raw.slots) ? raw : null;
  } catch { return null; }
}

/** Escribe el almacén. Devuelve false si el navegador lo rechazó (cuota llena, modo privado). */
function escribirTodo(slots) {
  try {
    localStorage.setItem(KEY, JSON.stringify({ v: SAVE_VERSION, slots }));
    return true;
  } catch { return false; }
}

/**
 * Valida la FORMA de una ranura leída. Tres salidas posibles:
 *   null                      la ranura está vacía (o traía basura irreconocible)
 *   {incompatible:true, …}    hay algo, pero es de otra versión: solo se puede borrar
 *   {v, savedAt, fin, run}    partida legible
 */
function normalizar(rec) {
  if (!rec || typeof rec !== "object" || !rec.run || typeof rec.run !== "object") return null;
  if (rec.v !== SAVE_VERSION) return { incompatible: true, v: rec.v ?? null, savedAt: rec.savedAt ?? null };
  if (!rec.run.teamId || !Array.isArray(rec.run.squad)) return { incompatible: true, v: rec.v, savedAt: rec.savedAt ?? null };
  return { v: rec.v, savedAt: rec.savedAt ?? null, fin: rec.fin ?? null, run: rec.run };
}

/** Las tres ranuras, siempre en un array de largo SLOTS (posición = número de ranura). */
export function getSlots() {
  const data = leerTodo();
  return Array.from({ length: SLOTS }, (_, i) => normalizar(data?.slots?.[i]));
}

/** Una ranura por índice (0..SLOTS-1). Null si está vacía o el índice no existe. */
export function readSlot(i) {
  return Number.isInteger(i) && i >= 0 && i < SLOTS ? getSlots()[i] : null;
}

/**
 * Guarda una run en una ranura, pisando lo que hubiera. `fin` marca la partida como
 * terminada ({champion, abandoned, stageLabel, date}): la ranura sigue ocupada y
 * mostrando el desenlace hasta que el jugador la reemplace — decisión del PO, el
 * trofeo se ve al abrir el juego.
 * Devuelve false si el navegador no dejó escribir (la UI avisa en vez de perderlo en silencio).
 */
export function writeSlot(i, run, fin = null) {
  if (!Number.isInteger(i) || i < 0 || i >= SLOTS || !run) return false;
  const data = leerTodo();
  const slots = Array.from({ length: SLOTS }, (_, k) => data?.slots?.[k] ?? null);
  slots[i] = { v: SAVE_VERSION, savedAt: Date.now(), fin, run };
  return escribirTodo(slots);
}

/** Vacía una ranura. No hay papelera: el borrado es el borrado (por eso la UI lo confirma). */
export function clearSlot(i) {
  if (!Number.isInteger(i) || i < 0 || i >= SLOTS) return false;
  const data = leerTodo();
  const slots = Array.from({ length: SLOTS }, (_, k) => data?.slots?.[k] ?? null);
  slots[i] = null;
  return escribirTodo(slots);
}
