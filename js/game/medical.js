/* ============================================================
   game/medical — reglas del cuerpo médico.
   (La tabla de lesiones vive en content/injuries.js: contenido
   y regla separados, como manda ARQUITECTURA §3.)
   ============================================================ */
import { rnd } from "../core/rng.js";
import { clamp } from "../core/math.js";
import { INJURY_TYPES } from "../content/injuries.js";
import { addJournal } from "./journal.js";

/** Sortea un tipo de lesión ponderado por su probabilidad (`peso`). */
export function rollInjury() {
  const total = INJURY_TYPES.reduce((s, i) => s + i.peso, 0);
  let r = rnd() * total;
  for (const inj of INJURY_TYPES) { r -= inj.peso; if (r <= 0) return inj; }
  return INJURY_TYPES[0];
}

/**
 * Parte médica del cierre de partido para UN jugador: recuperación de energía
 * (30% si descansó, 15% si jugó), descuento de la baja por lesión y registro
 * en el diario si la lesión de este partido lo deja fuera de los próximos.
 */
export function applyMedicalPostMatch(run, p, played) {
  p.energia = clamp(p.energia + (played ? 15 : 30), 5, 100);
  if (p.lesionadoPartidos > 0) p.lesionadoPartidos--;
  // Lesión sufrida en este partido con baja real → queda registrada en el diario
  if (p.lesionado && p.lesionadoPartidos > 0) {
    addJournal(run, { icon: "🚑", tone: "bad", title: `${p.name} lesionado`, desc: `Se pierde ${p.lesionadoPartidos} partido${p.lesionadoPartidos > 1 ? "s" : ""}.` });
  }
  p.lesionado = false;
}
