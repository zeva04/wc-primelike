/* Las 4 Filosofías y las 5 aristas como datos. La filosofía es un GENERADOR de
   secuencias: sesga qué fútbol sale, nunca es un modificador escondido.

   Cada filosofía se compone de 2 aristas, que se entrenan por separado y
   persisten al cambiar de identidad. Las reglas (nivel, progresión, cambio)
   viven en game/philosophy.js. */

// `tipo` = el tipo de secuencia (content/match/sequences.js) que ese fútbol
// genera. `stat` = la stat que ese fútbol trabaja.
export const ARISTAS = [
  { id: "presion",      icon: "🦁", label: "Presión",      desc: "cazar arriba",          tipo: "recuperacion", stat: "defensa" },
  { id: "elaboracion",  icon: "🎼", label: "Elaboración",  desc: "tener y circular",      tipo: "circulacion",  stat: "pase_corto" },
  { id: "verticalidad", icon: "⚡", label: "Verticalidad", desc: "atacar el espacio",     tipo: "transicion",   stat: "velocidad" },
  { id: "solidez",      icon: "🧱", label: "Solidez",      desc: "orden y bloque",        tipo: "repliegue",    stat: "defensa" },
  { id: "directo",      icon: "🌩️", label: "Juego directo", desc: "el pelotazo y el duelo", tipo: "pelotazo",    stat: "pase_largo" },
];

export const aristaById = id => ARISTAS.find(a => a.id === id);

/* Las 3 etapas de identidad: vista narrativa Y escala técnica del rival (la
   brecha, los gates de la avanzada y el scouting operan etapa vs etapa). */
export const FILO_ETAPAS = [
  { id: "aprendiendo", label: "Aprendiendo",   min: 0, mult: 1.35 },
  { id: "desarrollo",  label: "En desarrollo", min: 4, mult: 1.7 },
  { id: "consolidada", label: "Consolidada",   min: 9, mult: 2.1 },
];

/* LA ESCALERA DE 10 NIVELES. Las 4 filosofías progresan por separado y solo con
   XP ganada en la cancha: se aprende el fútbol que se juega. `min` es XP
   ACUMULADA, `mult` interpola ×1.35→×2.10 y `etapa` indexa FILO_ETAPAS.

   DIAL: el costo de cada nivel. Calibrado para que una run perfecta (8 partidos
   con la misma idea, Plan de Partido puesto y afinidad) llegue a 10 y una run
   promedio deje la principal en 6-8. Si el techo se alcanza fácil, subir acá. */
const FILO_XP_STEPS = [250, 300, 360, 430, 510, 600, 700, 810, 930];
export const FILO_LEVELS = Array.from({ length: 10 }, (_, i) => ({
  min: FILO_XP_STEPS.slice(0, i).reduce((s, x) => s + x, 0),
  mult: +(1.35 + (i * 0.75) / 9).toFixed(2),
  etapa: i >= 9 ? 2 : i >= 4 ? 1 : 0,
}));

/* DIALES de la XP del partido: la INTENCIÓN paga por cada jugada de ese fútbol
   que el equipo propone, el ACIERTO por cada acto que sale bien. Calibrados para
   un reparto 70/30 con ~10 jugadas y ~10 aciertos del tipo propio. */
export const XP_INTENCION = 73;
export const XP_ACIERTO = 32;

/* Qué filosofía APRENDE cada tipo de secuencia. Las avanzadas traen su `advFor`
   y mandan sobre esta tabla; el balón parado no enseña nada. */
export const FILO_BY_TIPO = {
  recuperacion: "press",      // cazar arriba
  circulacion: "posesion",    // tener y circular
  transicion: "contra",       // atacar el espacio tras robar
  banda: "contra",            // desbordar es atacar el espacio (Odisea, decisión PO)
  pelotazo: "bloque",         // el duelo directo
  repliegue: "bloque",        // defender organizado y neutralizar
  salida_corta: "posesion",   // sacarla jugada desde el área propia (Territorio, T4)
  espalda: "contra",          // atacar el espacio detrás del bloque alto (Territorio, T4)
  cambio_frente: "posesion", // mover al rival de lado a lado ES tener la pelota (Eje Horizontal)
};
export const filoOfType = (type) => type?.advFor || FILO_BY_TIPO[type?.id] || null;

/* LA AFINIDAD: la filosofía INICIAL decide a qué velocidad se aprenden las demás.
   Eje proactivo (Press · Posesión) vs reactivo (Contra · Bloque): la vecina de eje
   resulta natural, la cruzada se resiste. Ninguna puerta se cierra: la opuesta
   progresa, solo que más lento. DIAL: los multiplicadores. */
export const AFINIDAD = {
  press:    { press: 2, posesion: 1.25, contra: 1,    bloque: 0.6 },
  posesion: { posesion: 2, press: 1.25, contra: 1,    bloque: 0.6 },
  contra:   { contra: 2, bloque: 1.25,  press: 1,     posesion: 0.6 },
  bloque:   { bloque: 2, contra: 1.25,  posesion: 1,  press: 0.6 },
};
export const AFINIDAD_LABEL = { 2: "tu escuela", 1.25: "afín", 1: "neutral", 0.6: "opuesta" };
export const afinidadMult = (inicial, target) => AFINIDAD[inicial]?.[target] ?? 1;

/* EL CICLO DE COUNTERS. El array ES el ciclo: cada identidad le gana a la
   SIGUIENTE y da la vuelta — Press > Posesión > Bloque > Contra > Press. Los
   neutros caen solos (los que quedan a distancia 2), así que no pueden divergir.
   Se declara UNA vez: de acá lo derivan la matriz de pool, el reparto de pelota,
   el informe del ojeador y el rival que reacciona. */
export const COUNTER_CYCLE = ["press", "posesion", "bloque", "contra"];

/** La PRESA de cada identidad: a quién le gana. Derivado del ciclo. */
export const PRESA_DE = Object.fromEntries(
  COUNTER_CYCLE.map((f, i) => [f, COUNTER_CYCLE[(i + 1) % COUNTER_CYCLE.length]])
);
/** El CAZADOR de cada identidad: quién le gana. El espejo exacto del anterior. */
export const CAZADOR_DE = Object.fromEntries(
  Object.entries(PRESA_DE).map(([cazador, presa]) => [presa, cazador])
);

/**
 * El signo del cruce: +1 si MI identidad le gana a la del rival, −1 si la mía
 * pierde, 0 si el cruce es neutro (distancia 2) o espejo (la misma idea). Es la
 * primitiva que consumen el pool, el share y el informe: nadie más decide quién
 * le gana a quién.
 */
export function counterEdge(myId, oppId) {
  if (!myId || !oppId) return 0;
  if (PRESA_DE[myId] === oppId) return 1;
  if (PRESA_DE[oppId] === myId) return -1;
  return 0;
}

/* Las 4 filosofías: combinación de 2 aristas; `firma` es la que define su fútbol.
   `fuerte` y `advertencia` hacen VISIBLE el matchup desde la elección. */
export const PHILOSOPHIES = [
  {
    id: "press", icon: "🦁", name: "High Press",
    aristas: ["presion", "verticalidad"], firma: "presion",
    lema: "Cazar arriba y atacar el espacio antes de que el rival respire.",
    fuerte: "Brilla contra los que quieren la pelota: más robos en salida rival.",
    advertencia: "Correr arriba los 90' pasa factura física, y el que te espera agazapado te deja cazando sombras.",
    rasgo: "La cacería roba aún más letal, y al rival solo le queda la falta: más amarillas, más tiros libres tuyos.",
    // Mi fila del CICLO en cualitativo (F3, pantalla de identidad — regla 4: visible).
    // Press > Posesión > Bloque > Contra > Press: cazo a uno, me caza otro, y con el
    // tercero (Bloque) el cruce es parejo.
    counters: { brilla: "contra los que quieren la pelota (Posesión): su salida es tu festín", sufre: "contra el Contragolpe: presionar al que no quiere la pelota es correr al vacío, y su espalda queda a tiro. Encima el costo es físico: −6 de energía cada partido" },
    // El relato de MI firma cuando la identidad es mía (F3): el pressing tiene nombre
    firmaIntros: [
      p => `¡El pressing que entrenamos toda la semana! ${p.name} salta a cazar la salida rival.`,
      p => `La jauría otra vez arriba: ${p.name} lidera la presión como pide la idea.`,
      p => `El plan es este: asfixiar. ${p.name} achica sobre la pelota.`,
    ],
  },
  {
    id: "posesion", icon: "🎼", name: "Posesión",
    aristas: ["elaboracion", "presion"], firma: "elaboracion",
    lema: "Tener la pelota es atacar y defender a la vez; si se pierde, se caza al toque.",
    fuerte: "Derriba murallas: contra el que se encierra, la paciencia termina abriendo la lata.",
    advertencia: "Contra el que te salta a la yugular no hay tiempo de pensar: la presión alta te roba en tu propio campo.",
    rasgo: "La sinfonía gana su 4º compás: más desesperación acumulada, más penales.",
    counters: { brilla: "contra el Bloque bajo: mover la pelota hasta que la muralla se parta es exactamente tu fútbol", sufre: "contra el High Press: te cazan la salida y tu circulación se corta antes de empezar" },
    firmaIntros: [
      p => `El fútbol que ensayamos: ${p.name} baja a recibir y la pelota empieza a caminar.`,
      p => `Paciencia de manual: ${p.name} le pone el pie a la pelota y el equipo teje.`,
      p => `La idea en su salsa: toque, toque y ${p.name} pidiéndola siempre.`,
    ],
  },
  {
    id: "contra", icon: "⚡", name: "Contragolpe",
    aristas: ["solidez", "verticalidad"], firma: "verticalidad",
    lema: "Orden atrás, y a la que pierden la pelota: puñalada al espacio.",
    fuerte: "Vive del que se adelanta: cada salto de su presión es una contra tuya en potencia.",
    advertencia: "Cede la iniciativa: contra el que se atrinchera no hay espalda que atacar, y el partido se muere.",
    rasgo: "El primer tramo deja al rival AÚN más partido: el segundo llega lanzado.",
    counters: { brilla: "contra el High Press: el que salta a cazarte deja la espalda abierta, y esa es tu autopista", sufre: "contra el Bloque bajo: no hay espacio detrás del que ya está metido atrás" },
    firmaIntros: [
      p => `¡La puñalada que entrenamos! ${p.name} pica al espacio con el rival partido.`,
      p => `Robo y vértigo, como pide la idea: ${p.name} arranca la contra.`,
      p => `El equipo salta la trampa: ${p.name} corre solo hacia el área rival.`,
    ],
  },
  {
    id: "bloque", icon: "🧱", name: "Bloque bajo",
    aristas: ["solidez", "directo"], firma: "directo",
    lema: "Muralla atrás y pelotazo al duelo: fútbol de trinchera.",
    fuerte: "Seca al que también espera: en un partido de trinchera, el que va al duelo gana.",
    advertencia: "Sufre al que elabora con paciencia, y renuncia a generar volumen ofensivo.",
    rasgo: "La muralla contiene mejor — y castiga casi siempre.",
    counters: { brilla: "contra el Contragolpe: no le regalas la espalda que necesita, y el duelo directo lo ganas tú", sufre: "contra la Posesión: el que elabora con paciencia te sitia. Encima cedes volumen ofensivo por identidad" },
    firmaIntros: [
      p => `El plan de siempre: pelotazo a la guerra y a correr. ${p.name} va al duelo.`,
      p => `Fútbol de trinchera, como lo entrenamos: bombazo largo buscando a ${p.name}.`,
      p => `Sin vueltas: la pelota cruza el cielo y ${p.name} la espera de cabeza.`,
    ],
  },
];

export const getPhilosophy = id => PHILOSOPHIES.find(p => p.id === id) || null;

/**
 * XP y nivel de una filosofía, PUROS y solo sobre datos de este archivo (el
 * contenido también los necesita y content/ no importa game/; y el Match los usa
 * para anunciar la subida EN VIVO sin conocer la run). game/philosophy delega
 * acá: una sola fuente para el umbral, cero divergencia.
 */
/** Índice de nivel (0..9) que corresponde a una XP acumulada. */
export function xpLevelOf(xp) {
  let lvl = 0;
  FILO_LEVELS.forEach((l, i) => { if ((xp || 0) >= l.min) lvl = i; });
  return lvl;
}
/** XP acumulada de una filosofía de la run (la activa si no se pasa id). */
export function filoPointsOf(r, filoId = r.filoId) {
  return filoId ? Math.round(r.filoXp?.[filoId] || 0) : 0;
}
/** Nivel 0..9 de una filosofía de la run (la activa si no se pasa id). */
export function filoLevelOf(r, filoId = r.filoId) {
  return filoId ? xpLevelOf(r.filoXp?.[filoId] || 0) : 0;
}
/** Etapa (0 Aprendiendo · 1 En desarrollo · 2 Consolidada) del nivel actual —
 *  la vista 0-2 que consumen el rival, la brecha R3 y los gates (T1). */
export function filoEtapaOf(r, filoId = r.filoId) {
  return FILO_LEVELS[filoLevelOf(r, filoId)].etapa;
}

// Tipo firma por filosofía ({press: "recuperacion", ...}): lo que el pool sesga
// (match/sequences) y lo que la ejecución cuenta (game/philosophy). Derivado de
// los datos para que no puedan divergir.
export const FIRMA_TYPE = Object.fromEntries(PHILOSOPHIES.map(p => [p.id, aristaById(p.firma).tipo]));

/* La otra fuente de XP que autoriza el GDD: los eventos y oportunidades del
   calendario. Un "punto" de evento vale EVENT_XP: una oportunidad grande (2 pts)
   equivale a media buena tarde de partido — nunca la reemplaza. */
export const EVENT_XP = 80;

/**
 * Progreso de identidad desde CONTENIDO (eventos/oportunidades/conflictos):
 * `pts` puntos de evento se vuelven XP de la filosofía ACTIVA, con la afinidad
 * de tu escuela aplicada igual que en la cancha. Mutación con primitivas, sin
 * importar game/ (ARQUITECTURA §4, mismo patrón que la moral). Devuelve
 * {id, label, icon, xp} para el desc del evento, o null sin filosofía.
 */
export function addFiloProgress(r, pts) {
  const f = getPhilosophy(r.filoId);
  if (!f) return null;
  const xp = Math.round(pts * EVENT_XP * afinidadMult(r.filoInicial, f.id));
  r.filoXp = r.filoXp || {};
  r.filoXp[f.id] = (r.filoXp[f.id] || 0) + xp;
  return { id: f.id, label: f.name, icon: f.icon, xp, stat: aristaById(f.firma).stat };
}

/** Alias histórico (F3): los eventos de "la firma" trabajan la misma identidad. */
export const addFirmaProgress = addFiloProgress;
