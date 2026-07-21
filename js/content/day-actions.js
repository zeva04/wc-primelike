/* ============================================================
   content/day-actions — las Acciones Principales del Día
   (Core Gameplay Bible §4.7: cada día sin partido, el DT elige
   exactamente UNA inversión estratégica; elegir es renunciar).

   Trade-offs deliberados:
   - Entrenar sube una stat (+1 hasta el próximo partido) pero
     CANSA (−5 de energía a todo el plantel).
   - Recuperar devuelve energía pero no mejora a nadie.
   - La Sesión Táctica da un bonus de equipo (atk y def) solo
     para el próximo partido — es el gancho donde después se
     enchufa la Filosofía.

   El CANJE (regla en game/day-action.js) cierra el círculo: un
   boost de entrenamiento acumulado hasta +CANJE_THRESHOLD en una
   stat puede convertirse en +CANJE_PERMANENT PERMANENTE a esa stat
   para TODO el plantel — renuncias al boost del próximo partido a
   cambio de crecimiento que dura el resto de la run (Bible cap.6
   "Permanent Growth": nace del entrenamiento, es gradual, nunca
   decrece y no se traslada a otras runs).

   Agregar una acción nueva = agregar una fila con su `effect(run)`.
   `group: "entrenar"` agrupa los focos de entrenamiento en la UI.
   ============================================================ */
import { clamp } from "../core/math.js";

// +1 y no +5: el entrenamiento es elegible (siempre apunta donde quieres),
// los eventos de ±5 no. Elegible > aleatorio a igual magnitud. El PO lo bajó
// de +4 a +1 (17-jul): con +4 el buff dominaba y el canje se conseguía en un día.
export const TRAIN_BUFF = 1;
export const TRAIN_FATIGUE = 5;
const RECOVER_ENERGY = 10;
// Team Bonding (Sprint 3, decisión PO 20-jul-2026): sube la Moral del equipo pero CUESTA
// energía — la integración es una jornada más, no un descanso. Es la palanca para gestionar
// la moral a voluntad, que desde el Sprint 2 tiene efecto real (menos conflictos de
// vestuario). Situacional a propósito: con la moral arriba conviene entrenar o recuperar.
export const BONDING_MORAL = 10;
export const BONDING_FATIGUE = 5;

// El canje de entrenamiento (game/day-action.js): un buff de +CANJE_THRESHOLD en una
// stat se convierte en +CANJE_PERMANENT PERMANENTE a esa stat para todo el plantel.
export const CANJE_THRESHOLD = 4;
export const CANJE_PERMANENT = 1;
// Stats reales que admiten canje: las de campo + las de arquero. Los buffs que NO son
// stats (tactica, penales, antiLesion) nunca se canjean.
export const CANJEABLE_STATS = ["tiro", "defensa", "cabezazo", "pase", "aura", "atajadas", "reflejos", "salidas"];
// Etiquetas de stat para la UI y el diario (fuente única; la UI del hub las reusa).
export const STAT_LABELS = { tiro: "Tiro", defensa: "Defensa", cabezazo: "Cabezazo", pase: "Pase", aura: "Aura", atajadas: "Atajadas", reflejos: "Reflejos", salidas: "Salidas" };
// Bonus táctico en escala de poder ~0-5 (docs/CORE.md §5): +0.1 a atk y def.
// Un foco de entrenamiento (+1 de stat) mueve el poder ~+0.02: la táctica pesa más
// por partido, pero se reparte en ambas fases y sin costo de energía — ninguna domina.
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
  {
    // El contenido muta la moral con primitivas + clamp, SIN importar game/ (ARQUITECTURA §4):
    // mismo patrón que los eventos anímicos de prep-events (pais_ilusionado / critica_demoledora).
    id: "bonding", icon: "🤝", label: "Team Bonding",
    title: "Jornada de integración",
    desc: `+${BONDING_MORAL} de Moral del equipo · −${BONDING_FATIGUE} de energía`,
    effect: (r, m = 1) => {
      r.moral = clamp((r.moral ?? 50) + Math.round(BONDING_MORAL * m), 1, 100);
      r.squad.forEach(p => p.energia = clamp(p.energia - BONDING_FATIGUE, 5, 100));
    },
  },
];
