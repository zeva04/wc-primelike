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

// Cansancio por jugar: −10 de energía cada 30' disputados (decisión PO 18-jul).
export const FATIGUE_PER_30 = 10;
// Recuperación del que descansó todo el partido.
export const REST_RECOVERY = 30;
// Recuperación pasiva: cada día de preparación el plantel descansa un poco (sin esto, el
// cansancio de −30/partido entra en espiral y no hay forma de reponer a un titular fijo).
export const DAILY_RECOVERY = 8;

/** Energía perdida por disputar `minutos` (proporcional: −10 cada 30'). */
export function matchFatigue(minutos) { return Math.round(minutos / 30 * FATIGUE_PER_30); }

/** Descanso pasivo de un día de preparación: +DAILY_RECOVERY de energía a todo el plantel. */
export function applyDailyRecovery(run) {
  for (const p of run.squad) p.energia = clamp(p.energia + DAILY_RECOVERY, 5, 100);
}

/**
 * Parte médica del cierre de partido para UN jugador: energía (jugar CANSA −10 cada 30'
 * jugados; descansar recupera +30), descuento de la baja por lesión y registro en el
 * diario si la lesión de este partido lo deja fuera de los próximos. `minutos` = los que
 * disputó (0 si no jugó), lo calcula el Match.
 */
export function applyMedicalPostMatch(run, p, played, minutos = 0) {
  p.energia = clamp(p.energia + (played ? -matchFatigue(minutos) : REST_RECOVERY), 5, 100);
  if (p.lesionadoPartidos > 0) p.lesionadoPartidos--;
  // Lesión sufrida en este partido con baja real → queda registrada en el diario
  if (p.lesionado && p.lesionadoPartidos > 0) {
    addJournal(run, { icon: "🚑", tone: "bad", title: `${p.name} lesionado`, desc: `Se pierde ${p.lesionadoPartidos} partido${p.lesionadoPartidos > 1 ? "s" : ""}.` });
  }
  p.lesionado = false;
}
