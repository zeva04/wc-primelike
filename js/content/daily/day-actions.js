/* Las Acciones Principales del Día: cada día sin partido el DT elige exactamente
   UNA inversión. Elegir es renunciar.

   - Entrenar sube una stat hasta el próximo partido, pero CANSA.
   - Recuperar devuelve energía y no mejora a nadie.
   - El PLAN DE PARTIDO no compra nada: fija la identidad activa y multiplica la
     XP que esa idea gane en el próximo partido. Se paga jugando, no eligiendo.

   El CANJE (regla en game/day-action.js) cierra el círculo: un buff acumulado
   hasta CANJE_THRESHOLD se convierte en crecimiento PERMANENTE para todo el
   plantel — se renuncia al boost de hoy a cambio del resto de la run.

   Agregar una acción = agregar una fila con su `effect(run)`.
   `group: "entrenar"` agrupa los focos de entrenamiento en la UI.

   Los export const de arriba son los DIALES de cada acción. */
import { clamp } from "../../core/math.js";
import { PHILOSOPHIES } from "../identity/philosophies.js";

// +1 y no +5: el entrenamiento es ELEGIBLE (siempre apunta donde uno quiere) y
// los eventos de ±5 no. Elegible vale más que aleatorio a igual magnitud.
export const TRAIN_BUFF = 1;
export const TRAIN_FATIGUE = 5;
// El foco de velocidad cansa MÁS: correr piques no es lo mismo que un rondo (Odisea).
export const VELOCIDAD_FATIGUE_EXTRA = 3;
// No hay descanso pasivo diario: Recuperar es la ÚNICA fuente de energía fuera
// del banco, así que este dial gobierna toda la economía física de la run.
const RECOVER_ENERGY = 15;
// Team Bonding: sube la Moral pero CUESTA energía — la integración es una jornada
// más, no un descanso. Situacional a propósito: con la moral arriba conviene
// entrenar o recuperar.
export const BONDING_MORAL = 10;
export const BONDING_FATIGUE = 5;

// El canje de entrenamiento (game/day-action.js): un buff de +CANJE_THRESHOLD en una
// stat se convierte en +CANJE_PERMANENT PERMANENTE a esa stat para todo el plantel.
export const CANJE_THRESHOLD = 4;
export const CANJE_PERMANENT = 1;
// Stats reales que admiten canje: las de campo + las de arquero. Los buffs que NO son
// stats (penales, antiLesion) nunca se canjean.
export const CANJEABLE_STATS = ["tiro", "defensa", "cabezazo", "pase_corto", "pase_largo", "velocidad", "aura", "atajadas", "reflejos", "salidas"];
// Etiquetas de stat para la UI y el diario (fuente única; la UI del hub las reusa).
export const STAT_LABELS = { tiro: "Tiro", defensa: "Defensa", cabezazo: "Cabezazo", pase_corto: "Pase corto", pase_largo: "Pase largo", velocidad: "Velocidad", aura: "Aura", atajadas: "Atajadas", reflejos: "Reflejos", salidas: "Salidas" };
// EL PLAN DE PARTIDO declara qué fútbol va a intentar el equipo: pasa a ser la
// identidad activa (sesga qué jugadas genera el partido) y multiplica la XP que
// ese partido deje para esa idea. Sin costo de energía: su costo es el día.
export const PLAN_XP_MULT = 1.5;

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
  // ODISEA: el viejo foco "Pases" se partió en dos —
  // la circulación corta y el envío largo son dos entrenamientos distintos — y entró el
  // trabajo de VELOCIDAD, que ahora es una stat de primer orden en la media.
  {
    id: "entrenar_pase_corto", group: "entrenar", icon: "🎩", label: "Pase corto",
    title: "Entrenamiento de circulación",
    desc: `+${TRAIN_BUFF} de Pase corto para el próximo partido · −${TRAIN_FATIGUE} de energía`,
    effect: (r, m = 1) => { r.buffs.pase_corto = (r.buffs.pase_corto || 0) + Math.round(TRAIN_BUFF * m); tire(r); },
  },
  {
    id: "entrenar_pase_largo", group: "entrenar", icon: "🏹", label: "Pase largo",
    title: "Entrenamiento de envíos largos",
    desc: `+${TRAIN_BUFF} de Pase largo para el próximo partido · −${TRAIN_FATIGUE} de energía`,
    effect: (r, m = 1) => { r.buffs.pase_largo = (r.buffs.pase_largo || 0) + Math.round(TRAIN_BUFF * m); tire(r); },
  },
  {
    // La velocidad se entrena corriendo: es el foco que MÁS cansa (decisión de diseño —
    // el trabajo de piques es el más exigente del microciclo y el único que sube la stat
    // que más pesa en un delantero).
    id: "entrenar_velocidad", group: "entrenar", icon: "💨", label: "Velocidad",
    title: "Trabajo de piques",
    desc: `+${TRAIN_BUFF} de Velocidad para el próximo partido · −${TRAIN_FATIGUE + VELOCIDAD_FATIGUE_EXTRA} de energía`,
    effect: (r, m = 1) => {
      r.buffs.velocidad = (r.buffs.velocidad || 0) + Math.round(TRAIN_BUFF * m);
      tire(r); r.squad.forEach(p => p.energia = clamp(p.energia - VELOCIDAD_FATIGUE_EXTRA, 5, 100));
    },
  },
  {
    id: "recuperar", icon: "🧘", label: "Recuperar",
    title: "Jornada de recuperación",
    desc: `+${RECOVER_ENERGY} de energía para todo el plantel`,
    effect: (r, m = 1) => r.squad.forEach(p => p.energia = clamp(p.energia + Math.round(RECOVER_ENERGY * m), 5, 100)),
  },
  // Los 4 focos del Plan de Partido: uno por filosofía, generados desde el
  // catálogo de content/philosophies. Muta con primitivas (§4, como la moral):
  // fija la identidad que se juega y deja declarado el plan. El modificador del
  // día NO escala nada acá — declarar una idea no admite medias tintas.
  ...PHILOSOPHIES.map(p => ({
    id: `plan_${p.id}`, group: "tactica", icon: p.icon, label: p.name,
    title: `Plan de partido: ${p.name}`,
    desc: `El equipo sale a jugar ${p.name} — ×${PLAN_XP_MULT} de experiencia de esa idea en el próximo partido`,
    effect: (r) => { r.filoId = p.id; r.planFilo = p.id; },
  })),
  {
    // El contenido muta la moral con primitivas + clamp, SIN importar game/:
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
