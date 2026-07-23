/* ============================================================
   game/traits — Puntos de Identidad y el árbol de Rasgos
   (arco de Rasgos T1, decisiones PO 23-jul-2026).

   Posee `run.identityPoints`, `run.piCredited` y `run.rasgos`.
   El catálogo vive en content/traits.js (ARQUITECTURA §4).

   Reglas que viven acá:
   - PI: cada subida de nivel de la filosofía ACTIVA otorga 1 PI
     (el nivel 1 incluido: elegir filosofía → 1 PI inmediato).
     ANTI-FARMING (decisión de diseño T1): los niveles heredados
     al cambiar de filosofía se ACREDITAN SIN PREMIO — la arista
     compartida cuenta para el nivel de dos filosofías y premiarla
     dos veces imprimiría PI (precedente: filoNarrado no narra la
     herencia). PI solo se ganan jugando la identidad activa.
   - Compra: 1 PI + las 4 condiciones del GDD §5 (previo en la
     rama · Principios mínimos · nivel de Filosofía · PI).
   - Latencia (decisión PO #3): `run.rasgos` es {filoId: [ids]} —
     al cambiar de filosofía los rasgos comprados se APAGAN, no se
     pierden: si vuelves, reviven. Nada se borra jamás.

   El sync de PI es LAZY por beats (mismo patrón que
   noteFiloMilestones): lo llaman choosePhilosophy/changePhilosophy
   (game/philosophy), la Acción del Día (day-action) y el
   post-partido (flow). Un evento del calendario que suba nivel
   se acredita en el siguiente beat — nada se pierde.
   ============================================================ */
import { traitById, traitsOf } from "../content/traits.js";
import { getPhilosophy, aristaById, filoLevelOf } from "../content/philosophies.js";
import { addJournal } from "./journal.js";

/**
 * Acredita los niveles NUEVOS de la filosofía activa como PI. Idempotente
 * (llamarla dos veces no regala nada) y lazy (el beat que llegue tarde
 * acredita igual). Devuelve {gained, nivel} para el toast/diario o null.
 */
export function syncIdentityPI(run) {
  if (!run.filoId) return null;
  const lvl = filoLevelOf(run);                      // índice 0..9 (nivel 1..10)
  const cred = run.piCredited[run.filoId] ?? -1;     // -1 = jamás acreditada (el nivel 1 premia)
  if (lvl <= cred) return null;
  const gained = lvl - cred;
  run.piCredited[run.filoId] = lvl;
  run.identityPoints = (run.identityPoints || 0) + gained;
  addJournal(run, {
    icon: "🧠", tone: "gold", title: `+${gained} Punto${gained > 1 ? "s" : ""} de Identidad`,
    desc: `La idea se consolida (nivel ${lvl + 1}): hay ${run.identityPoints} PI para gastar en el árbol de rasgos.`,
  });
  return { gained, nivel: lvl + 1 };
}

/**
 * Acredita SIN premio los niveles heredados al adoptar una filosofía
 * (changePhilosophy la llama tras cambiar filoId): la base acreditada
 * arranca en el nivel actual — solo lo que se construya DESDE hoy paga.
 * Si se vuelve a una filosofía ya acreditada más arriba, no baja.
 */
export function creditInheritedPI(run) {
  if (!run.filoId) return;
  const lvl = filoLevelOf(run);
  run.piCredited[run.filoId] = Math.max(run.piCredited[run.filoId] ?? lvl, lvl);
}

/** Ids de los rasgos ACTIVOS (los comprados de la filosofía actual; los demás, latentes). */
export function activeTraitIds(run) {
  return run.filoId ? (run.rasgos[run.filoId] || []) : [];
}

/** Los rasgos activos completos (filas del catálogo) — para el Match y las pantallas. */
export function activeTraits(run) {
  return activeTraitIds(run).map(traitById).filter(Boolean);
}

/**
 * ¿Cumple la run los requisitos de un rasgo? Devuelve {ok, faltas: [textos]} —
 * las faltas en lenguaje de jugador para los candados de la UI (T1.5).
 * Las 4 condiciones del GDD §5. Formas del req (T3 extiende para convergencias):
 *   previo: id            — el rasgo previo de la rama (Intermediate)
 *   todos: [ids]          — TODOS requeridos (Advanced: Int líder + Básico apoyo;
 *                           Master: los 3 básicos — presencia en las tres ramas)
 *   alguno: [ids]         — al menos UNO (Master: cualquiera de los 2 Advanced)
 *   principio: {id, min}  — un Principio mínimo
 *   principios: [{id,min}]— varios (Master: ambos propios a 4)
 *   nivel: n              — nivel de Filosofía mínimo (1-10)
 */
export function traitReqs(run, t) {
  const faltas = [];
  const owned = activeTraitIds(run);
  const nombre = id => traitById(id)?.nombre || id;
  if (t.req.previo && !owned.includes(t.req.previo)) faltas.push(`requiere ${nombre(t.req.previo)}`);
  for (const id of t.req.todos || []) if (!owned.includes(id)) faltas.push(`requiere ${nombre(id)}`);
  if (t.req.alguno && !t.req.alguno.some(id => owned.includes(id)))
    faltas.push(`requiere ${t.req.alguno.map(nombre).join(" o ")}`);
  for (const p of [...(t.req.principio ? [t.req.principio] : []), ...(t.req.principios || [])]) {
    const a = aristaById(p.id);
    if ((run.aristas?.[p.id] || 0) < p.min) faltas.push(`${a.icon} ${a.label} ${p.min} (tienes ${run.aristas?.[p.id] || 0})`);
  }
  if (filoLevelOf(run) + 1 < (t.req.nivel || 1)) faltas.push(`nivel ${t.req.nivel} de filosofía`);
  if ((run.identityPoints || 0) < 1) faltas.push("1 Punto de Identidad");
  return { ok: faltas.length === 0, faltas };
}

/**
 * Compra un rasgo para la filosofía ACTIVA: valida catálogo, pertenencia,
 * duplicado y requisitos; cobra 1 PI y escribe el diario. Devuelve la fila
 * del rasgo o null (la UI no debería permitir ninguno de los null).
 */
export function buyTrait(run, traitId) {
  const t = traitById(traitId);
  if (!t || t.filo !== run.filoId) return null;
  if (activeTraitIds(run).includes(traitId)) return null;
  if (!traitReqs(run, t).ok) return null;
  run.identityPoints--;
  run.rasgos[run.filoId] = [...activeTraitIds(run), traitId];
  const f = getPhilosophy(run.filoId);
  addJournal(run, {
    icon: t.icon, tone: "gold", title: `Nueva idea permanente: ${t.nombre}`,
    desc: `${t.desc} Desde hoy es parte del ${f.name}. Su momento: ${t.momento}`,
  });
  // LA CONSAGRACIÓN (T3, decisión PO #9): desbloquear un Master es un hito de
  // torneo — la prensa consagra el estilo con nombre propio (el enchufe narrativo
  // de F3 "la prensa bautiza tu estilo", ahora en su versión definitiva).
  if (t.tier === "master") addJournal(run, {
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
export function traitTree(run) {
  const owned = activeTraitIds(run);
  return traitsOf(run.filoId).map(t => {
    const reqs = traitReqs(run, t);
    return { ...t, owned: owned.includes(t.id), buyable: !owned.includes(t.id) && reqs.ok, faltas: reqs.faltas };
  });
}
