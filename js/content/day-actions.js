/* ============================================================
   content/day-actions — las Acciones Principales del Día
   (Core Gameplay Bible §4.7: cada día sin partido, el DT elige
   exactamente UNA inversión estratégica; elegir es renunciar).

   Trade-offs deliberados:
   - Entrenar sube una stat (+4 hasta el próximo partido) pero
     CANSA (−5 de energía a todo el plantel).
   - Recuperar devuelve energía pero no mejora a nadie.
   - La Sesión Táctica da un bonus de equipo (atk y def) solo
     para el próximo partido — es el gancho donde después se
     enchufa la Filosofía.

   Agregar una acción nueva = agregar una fila con su `effect(run)`.
   `group: "entrenar"` agrupa los focos de entrenamiento en la UI.
   ============================================================ */
import { clamp } from "../core/math.js";

// +4 y no +5: el entrenamiento es elegible (siempre apunta donde quieres),
// los eventos de ±5 no. Elegible > aleatorio a igual magnitud.
export const TRAIN_BUFF = 4;
export const TRAIN_FATIGUE = 5;
const RECOVER_ENERGY = 15;
// Bonus táctico en escala de poder ~0-5 (docs/CORE.md §5): +0.1 a atk y def.
// Comparable a un foco de entrenamiento (+4 de stat ≈ +0.06-0.14 de poder)
// pero repartido en ambas fases y sin costo de energía.
export const TACTICS_BONUS = 0.1;

const tire = r => r.squad.forEach(p => p.energia = clamp(p.energia - TRAIN_FATIGUE, 5, 100));

// Todo effect recibe (run, mult): el multiplicador del modificador del día
// (run.dayMod, ver prep-events.js) escala la RECOMPENSA. El costo de energía
// de entrenar no se escala: un doble turno que rinde ×2 sigue cansando lo
// mismo — el modificador es el premio/castigo, no un rebalance del costo.
export const DAY_ACTIONS = [
  {
    id: "entrenar_ataque", group: "entrenar", icon: "🎯", label: "Ataque",
    title: "Entrenamiento de definición",
    desc: `+${TRAIN_BUFF} de Tiro para el próximo partido · −${TRAIN_FATIGUE} de energía`,
    effect: (r, m = 1) => { r.buffs.tiro = (r.buffs.tiro || 0) + Math.round(TRAIN_BUFF * m); tire(r); },
  },
  {
    id: "entrenar_defensa", group: "entrenar", icon: "🛡️", label: "Defensa",
    title: "Entrenamiento defensivo",
    desc: `+${TRAIN_BUFF} de Defensa y Atajadas para el próximo partido · −${TRAIN_FATIGUE} de energía`,
    effect: (r, m = 1) => { const v = Math.round(TRAIN_BUFF * m); r.buffs.defensa = (r.buffs.defensa || 0) + v; r.buffs.atajadas = (r.buffs.atajadas || 0) + v; tire(r); },
  },
  {
    id: "entrenar_pases", group: "entrenar", icon: "🎩", label: "Pases",
    title: "Entrenamiento de circulación",
    desc: `+${TRAIN_BUFF} de Pase para el próximo partido · −${TRAIN_FATIGUE} de energía`,
    effect: (r, m = 1) => { r.buffs.pase = (r.buffs.pase || 0) + Math.round(TRAIN_BUFF * m); tire(r); },
  },
  {
    id: "recuperar", icon: "🧘", label: "Recuperar",
    title: "Jornada de recuperación",
    desc: `+${RECOVER_ENERGY} de energía para todo el plantel`,
    effect: (r, m = 1) => r.squad.forEach(p => p.energia = clamp(p.energia + Math.round(RECOVER_ENERGY * m), 5, 100)),
  },
  {
    id: "tactica", icon: "📋", label: "Sesión táctica",
    title: "Sesión táctica",
    desc: "El equipo llega mejor plantado al próximo partido (bonus de ataque y defensa)",
    effect: (r, m = 1) => { r.buffs.tactica = +((r.buffs.tactica || 0) + TACTICS_BONUS * m).toFixed(2); },
  },
];
