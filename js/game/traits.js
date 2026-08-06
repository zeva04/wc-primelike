/* ============================================================
   game/traits — Puntos de Identidad y el árbol de Rasgos
   (arco de Rasgos T1, decisiones PO 23-jul-2026).

   Posee `run.identityPoints` y `run.rasgos`. El catálogo vive en
   content/traits/index.js (ARQUITECTURA §4).

   Reglas que viven acá (arco de Progresión, 28-jul-2026):
   - Los PI ya NO nacen del nivel de filosofía: los imprime el
     DIRECTOR TÉCNICO (game/coach) — 1 por cada nivel suyo, y el
     nivel 1 se cobra al elegir la escuela inicial.
   - Compra: 1 PI + el recorrido de la rama (previo/convergencias)
     + el nivel de LA FILOSOFÍA DEL RASGO. Los "Principios
     mínimos" MURIERON con las aristas: los dos requisitos del GDD
     son nivel y PI; el árbol aporta el tercero, su forma.
   - Sin latencia: `run.rasgos` sigue siendo {filoId: [ids]} para
     saber de qué árbol es cada uno, pero TODOS están activos a la
     vez — la build híbrida juega de verdad.
   ============================================================ */
import { traitById, traitsOf, TRAIT_COST } from "../content/traits/index.js";
import { getPhilosophy, filoLevelOf, filoPointsOf, FILO_LEVELS } from "../content/identity/philosophies.js";
import { addJournal } from "./journal.js";

/** Ids de TODOS los rasgos comprados, de cualquier filosofía (decisión PO
 *  28-jul-2026: se acabó la latencia — si lo compraste, juega; es lo que hace
 *  real la build híbrida del GDD). El orden es el de compra por filosofía. */
export function activeTraitIds(run) {
  return Object.values(run.rasgos || {}).flat();
}

/** Los rasgos activos completos (filas del catálogo) — para el Match y las pantallas. */
export function activeTraits(run) {
  return activeTraitIds(run).map(traitById).filter(Boolean);
}

/**
 * ¿Cumple la run los requisitos de un rasgo? Devuelve {ok, faltas: [textos]} —
 * las faltas en lenguaje de jugador para los candados de la UI (T1.5).
 * Formas del req (los `principio`/`principios` del catálogo ya NO se leen —
 * murieron con las aristas en el arco de Progresión):
 *   previo: id            — el rasgo previo de la rama (Intermediate)
 *   todos: [ids]          — TODOS requeridos (Advanced: Int líder + Básico apoyo;
 *                           Master: los 3 básicos — presencia en las tres ramas)
 *   alguno: [ids]         — al menos UNO (Master: cualquiera de los 2 Advanced)
 *   nivel: n              — nivel mínimo de LA FILOSOFÍA DEL RASGO (1·3·6·10)
 */
/** Lo que cuesta incorporar un rasgo, en Puntos de Identidad: sale del dial de su
 *  tier (content/traits.TRAIT_COST), salvo que el rasgo declare un `costo` propio. */
export const traitCost = (t) => t?.costo ?? TRAIT_COST[t?.tier] ?? 1;

export function traitReqs(run, t) {
  const faltas = [];
  const owned = activeTraitIds(run);
  const nombre = id => traitById(id)?.nombre || id;
  if (t.req.previo && !owned.includes(t.req.previo)) faltas.push(`requiere ${nombre(t.req.previo)}`);
  for (const id of t.req.todos || []) if (!owned.includes(id)) faltas.push(`requiere ${nombre(id)}`);
  if (t.req.alguno && !t.req.alguno.some(id => owned.includes(id)))
    faltas.push(`requiere ${t.req.alguno.map(nombre).join(" o ")}`);
  // El nivel se mide en LA FILOSOFÍA DEL RASGO, no en la que estés jugando: cada
  // idea se desbloquea con lo aprendido de ESA idea (arco de Progresión).
  const nivel = filoLevelOf(run, t.filo) + 1;
  if (nivel < (t.req.nivel || 1)) faltas.push(`${getPhilosophy(t.filo).name} nivel ${t.req.nivel} (vas ${nivel})`);
  const costo = traitCost(t);
  if ((run.identityPoints || 0) < costo) faltas.push(`${costo} Punto${costo > 1 ? "s" : ""} de Identidad`);
  return { ok: faltas.length === 0, faltas };
}

/**
 * Compra un rasgo para la filosofía ACTIVA: valida catálogo, pertenencia,
 * duplicado y requisitos; cobra `traitCost` y escribe el diario. Devuelve la fila
 * del rasgo o null (la UI no debería permitir ninguno de los null).
 */
export function buyTrait(run, traitId) {
  const t = traitById(traitId);
  if (!t) return null;
  if (activeTraitIds(run).includes(traitId)) return null;
  if (!traitReqs(run, t).ok) return null;
  // ¿Es el PRIMER Master de esta filosofía? Se mide ANTES de sumarlo. Desde el
  // rediseño de Press una filosofía puede tener varios Masters (uno por rama):
  // la consagración es un hito de torneo y se narra UNA vez, no siete.
  const primerMaster = t.tier === "master"
    && !activeTraits(run).some(x => x.tier === "master" && x.filo === t.filo);
  run.identityPoints -= traitCost(t);
  run.rasgos[t.filo] = [...(run.rasgos[t.filo] || []), traitId];
  const f = getPhilosophy(t.filo);
  addJournal(run, {
    icon: t.icon, tone: "gold", title: `Nueva idea permanente: ${t.nombre}`,
    desc: `${t.desc} Desde hoy es parte del ${f.name}. Su momento: ${t.momento}`,
  });
  // LA CONSAGRACIÓN (T3, decisión PO #9): desbloquear un Master es un hito de
  // torneo — la prensa consagra el estilo con nombre propio (el enchufe narrativo
  // de F3 "la prensa bautiza tu estilo", ahora en su versión definitiva).
  if (primerMaster) addJournal(run, {
    icon: "📰", tone: "gold", title: `LA PRENSA CONSAGRA: "${t.nombre}"`,
    desc: `Los diarios del mundo entero le ponen nombre al fútbol de ${f.name}: muy pocos DTs en la historia de este Mundial llegaron a jugar así. ${t.momento}`,
  });
  return t;
}

/**
 * El árbol de la filosofía activa para la pantalla (T1.5): las 3 ramas con
 * sus rasgos, el estado de cada uno (owned | buyable | locked) y las faltas
 * legibles del candado. Puro — no muta nada.
 */
export function traitTree(run, filoId = run.filoId) {
  const owned = activeTraitIds(run);
  return traitsOf(filoId).map(t => {
    const reqs = traitReqs(run, t);
    return { ...t, owned: owned.includes(t.id), buyable: !owned.includes(t.id) && reqs.ok, faltas: reqs.faltas };
  });
}

/**
 * El PAYOFF de declarar el Plan de Partido con una filosofía (arco de
 * Progresión): lo que la pizarra del hub muestra al pasar por cada idea — hace
 * visible la cadena jugar → XP → nivel → árbol. Puro; devuelve DATOS (la UI
 * compone la línea de tiza).
 *
 *  - `xp`/`lvl`/`nextAt`: dónde estás y cuánta XP acumulada pide el próximo nivel
 *    (o null si esa idea ya llegó a 10).
 *  - `mult`: el multiplicador de XP que tendría el próximo partido con este plan
 *    (afinidad de tu escuela × el ×1.5 de declararlo).
 *  - `unlocks`: el próximo nodo del árbol de ESA filosofía que abre el nivel
 *    siguiente — el premio concreto de jugar así hoy.
 */
export function planPayoff(run, filoId) {
  const lvl = filoLevelOf(run, filoId);
  const xp = filoPointsOf(run, filoId);
  const nextAt = FILO_LEVELS[lvl + 1]?.min ?? null;
  const unlocks = traitTree(run, filoId)
    .filter(t => !t.owned && (t.req.nivel || 1) > lvl + 1)
    .sort((a, b) => (a.req.nivel || 1) - (b.req.nivel || 1))
    .slice(0, 1)
    .map(t => ({ id: t.id, nombre: t.nombre, icon: t.icon, nivel: t.req.nivel || 1 }));
  return { propia: filoId === run.filoInicial, lvl, xp, nextAt, unlocks };
}
