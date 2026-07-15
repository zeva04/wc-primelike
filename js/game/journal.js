/* ============================================================
   game/journal — Diario de Campaña (Game Vision: el calendario
   es la memoria de la run). Todos los sistemas anotan aquí.
   Tonos válidos: gold | good | bad | neutral (ui los colorea).
   ============================================================ */

/**
 * Agrega una entrada al Diario de Campaña. Cada entrada lleva el día en que ocurrió,
 * un ícono, título, descripción y un `tone` visual (gold | good | bad | neutral).
 * El día se toma de run.day salvo que la entrada lo traiga explícito.
 */
export function addJournal(run, entry) {
  run.journal.push({ day: run.day, ...entry });
}
