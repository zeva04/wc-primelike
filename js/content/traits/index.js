/* El catálogo de RASGOS del árbol de identidad, armado desde los 4 archivos por
   filosofía. Un rasgo es una idea futbolística permanente: nunca sube una
   estadística, cambia cómo se genera el partido.

   Los datos de cada rasgo viven en su archivo; acá van las REGLAS DE BALANCE
   comunes (costo y nivel por tier) y los helpers de consulta. Las reglas de
   compra y validación viven en game/traits.js. */
import { TRAITS_PRESS } from "./press.js";
import { TRAITS_POSESION } from "./posesion.js";
import { TRAITS_CONTRA } from "./contra.js";
import { TRAITS_BLOQUE } from "./bloque.js";

/* ── DIALES DE BALANCE ────────────────────────────────────────────────────────
   Se tocan acá y aplican a TODOS los rasgos de ese tier. Un rasgo puede pisar
   su valor declarando `costo` o `req.nivel` propios. */

/** Puntos de Identidad que cuesta incorporar un rasgo, por tier. */
export const TRAIT_COST = {
  basic: 1,
  intermediate: 1,
  advanced: 1,
  master: 1,
};

/** Nivel de SU filosofía que exige cada tier para desbloquearse. */
export const TRAIT_LEVEL = {
  basic: 1,
  intermediate: 3,
  advanced: 6,
  master: 10,
};

/** Etiquetas de rama para la UI. */
export const RAMA_LABELS = {
  firma: { label: "Firma", desc: "profundiza tu fútbol" },
  respuesta: { label: "Respuesta", desc: "cubre tu matchup débil" },
  expansion: { label: "Expansión", desc: "abre un fútbol lateral" },
};

/** Completa cada rasgo con los diales de su tier (sin pisar lo que declare). */
const withBalance = (t) => ({
  ...t,
  costo: t.costo ?? TRAIT_COST[t.tier],
  req: { ...t.req, nivel: t.req.nivel ?? TRAIT_LEVEL[t.tier] },
});

export const TRAITS = [...TRAITS_PRESS, ...TRAITS_POSESION, ...TRAITS_CONTRA, ...TRAITS_BLOQUE]
  .map(withBalance);

/** Un rasgo por id (o undefined). */
export const traitById = id => TRAITS.find(t => t.id === id);

/** Los rasgos de una filosofía, opcionalmente de un tier. */
export const traitsOf = (filoId, tier) =>
  TRAITS.filter(t => t.filo === filoId && (!tier || t.tier === tier));

/** El rasgo que PROFUNDIZA la avanzada de cada filosofía: la vitrina y el diario
 *  apuntan acá. Se deriva de los hooks deep*, así que no puede divergir. */
const DEEP_HOOKS = ["deepPress", "deepPosesion", "deepContra", "deepBloque"];
export const DEEP_TRAIT = Object.fromEntries(
  TRAITS.filter(t => DEEP_HOOKS.some(h => t.hooks[h])).map(t => [t.filo, t]));
