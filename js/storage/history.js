/* ============================================================
   storage/history — persistencia del historial de runs en
   localStorage. Único módulo que toca localStorage.
   ============================================================ */

/** Lee el historial de runs guardadas (array; vacío si no hay o está corrupto). */
export function getHistory() {
  try { return JSON.parse(localStorage.getItem("wc26_history") || "[]"); } catch { return []; }
}

/** Guarda una run terminada al inicio del historial (máx. 100 entradas). */
export function saveHistoryEntry(entry) {
  const h = getHistory(); h.unshift(entry);
  localStorage.setItem("wc26_history", JSON.stringify(h.slice(0, 100)));
}
