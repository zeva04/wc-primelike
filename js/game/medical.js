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

// Cansancio por jugar: −14 de energía cada 30' disputados. Subió de 10 a 14 en el
// rebalance del PO (20-jul-2026), acoplado a bajar el peso de la energía en el
// rendimiento (match/powers.effStat: 20% en vez de 35%). La idea: el partido vacía más
// rápido (rotar importa) pero estar cansado no te deja inservible — así Entrenar deja de
// ser una trampa sin regalar dificultad. Ver CORE §4 y §Energía.
export const FATIGUE_PER_30 = 14;
// Recuperación del que descansó todo el partido.
export const REST_RECOVERY = 30;
// Recuperación pasiva: cada día de preparación el plantel descansa un poco (sin esto, el
// cansancio de −42/partido entra en espiral y no hay forma de reponer a un titular fijo).
// En M1 se probó 8→9 para cerrar el gate de la banda verde y se REVIRTIÓ (decisión PO):
// la pasiva no discrimina — le devuelve el bache post-partido también al que recupera a
// diario (cerró ~0.4pp de gap por punto) y solo infló el global abriendo el spread. El
// gate se cerró por el umbral de la banda (match/powers.ENERGY_OK), no por acá.
export const DAILY_RECOVERY = 8;
// La VÍSPERA del partido rinde menos (Sprint 4): el día de partido también cobra descanso
// pasivo —antes no cobraba nada, bug reportado por el PO— pero a tasa reducida: viaje al
// estadio, charla técnica y nervios no son una jornada de recuperación. Es además el dial
// FINO de la economía de energía: `DAILY_RECOVERY` mueve ~5pp de título por punto (medido),
// así que el arreglo del bug entra por acá y no subiendo la recuperación de todos.
export const MATCHDAY_RECOVERY = 2;

// SPRINT 4 — interacción cruzada Energía → Lesión (decisión PO 21-jul-2026): las piernas
// cansadas se rompen más. La escala arranca en FATIGUE_INJURY_FROM (energía 50) y crece
// lineal hasta FATIGUE_INJURY_MAX en el piso de energía (5). Multiplica la probabilidad de
// que un golpe en juego sea GRAVE (match/incidents.injuryEvent), no la frecuencia de golpes:
// el cansancio no provoca más choques, hace que los choques terminen peor.
// Refuerza la rotación del Sprint 3 con una consecuencia que se siente, sin sistemas nuevos.
export const FATIGUE_INJURY_FROM = 50;
export const FATIGUE_INJURY_MAX = 1.8;

/** Multiplicador de gravedad de lesión según la energía del jugador (1.0 sano → 1.8 vacío). */
export function fatigueInjuryMult(energia) {
  const e = energia ?? 100;
  if (e >= FATIGUE_INJURY_FROM) return 1;
  return 1 + (FATIGUE_INJURY_MAX - 1) * (FATIGUE_INJURY_FROM - e) / (FATIGUE_INJURY_FROM - 5);
}

/** Energía perdida por disputar `minutos` (proporcional: −14 cada 30'). */
export function matchFatigue(minutos) { return Math.round(minutos / 30 * FATIGUE_PER_30); }

/**
 * Descanso pasivo de un día: +DAILY_RECOVERY a todo el plantel, o +MATCHDAY_RECOVERY si el
 * día que arranca es de partido (la víspera rinde menos). Lo llama calendar.advanceDay en
 * TODO día nuevo — también el de partido (bug del PO, 21-jul-2026).
 */
export function applyDailyRecovery(run, esDiaDePartido = false) {
  const v = esDiaDePartido ? MATCHDAY_RECOVERY : DAILY_RECOVERY;
  for (const p of run.squad) p.energia = clamp(p.energia + v, 5, 100);
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
