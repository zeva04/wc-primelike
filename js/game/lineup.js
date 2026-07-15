/* ============================================================
   game/lineup — reglas de alineación del formato 6v6.
   Hasta F7 vivían en la UI y el smoke test debía duplicarlas
   (P2 del diagnóstico); ahora hay una sola fuente.
   ============================================================ */
import { playerOverall } from "./ratings.js";

/** Arma automáticamente la mejor alineación de 6 (1 por posición + los 2 mejores extras de campo). */
export function autoLineup(available) {
  const sorted = pos => available.filter(p => p.pos === pos).sort((a, b) => playerOverall(b) - playerOverall(a));
  const picks = [];
  for (const pos of ["POR", "DEF", "MED", "DEL"]) {
    const best = sorted(pos)[0];
    if (best) picks.push(best);
  }
  const rest = available.filter(p => !picks.includes(p) && p.pos !== "POR")
    .sort((a, b) => playerOverall(b) - playerOverall(a));
  while (picks.length < 6 && rest.length) picks.push(rest.shift());
  return picks;
}

/** Valida una alineación: exactamente 6, 1 arquero y al menos 1 por línea disponible. */
export function validateLineup(available, selected) {
  if (selected.length !== 6) return { ok: false, msg: `Selecciona 6 titulares (llevas ${selected.length}).` };
  const count = pos => selected.filter(p => p.pos === pos).length;
  const avail = pos => available.some(p => p.pos === pos);
  if (avail("POR") && count("POR") !== 1) return { ok: false, msg: "Necesitas exactamente 1 arquero." };
  for (const pos of ["DEF", "MED", "DEL"]) {
    if (avail(pos) && count(pos) < 1) return { ok: false, msg: `Necesitas al menos 1 ${pos}.` };
  }
  return { ok: true };
}

/** Etiqueta de formación a partir del once (ej. "2-1-1"). */
export function formationLabel(selected) {
  const c = { DEF: 0, MED: 0, DEL: 0 };
  selected.forEach(p => { if (c[p.pos] !== undefined) c[p.pos]++; });
  return `${c.DEF}-${c.MED}-${c.DEL}`;
}
