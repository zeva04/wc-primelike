/* ============================================================
   content/philosophies — las 4 Filosofías y las 5 aristas
   COMO DATOS (arco de Filosofía F1, decisiones PO 22-jul-2026).
   Ley: Bible §5 — la filosofía es un GENERADOR de secuencias
   (sesga qué fútbol sale), no un modificador escondido.

   La filosofía se COMPONE de 2 aristas transversales (decisión
   PO #2): se entrenan por separado (focos de la Sesión Táctica)
   y PERSISTEN al cambiar de filosofía — la demolición es
   orgánica: tu inversión no se borra, simplemente la nueva
   identidad combina otras aristas (costo hundido real).

   Cada arista mapea a UN tipo de secuencia del catálogo (mismo
   icono a propósito: la arista ES ese fútbol). El tipo firma de
   una filosofía es el de su arista `firma` — siempre del lado
   "mine" (la progresión por ejecución debe depender de MI
   fútbol, no de cuánto ataque el rival; por eso la firma del
   Bloque bajo es el pelotazo y no el repliegue, cuyo premio
   llega como rasgo consolidado en F2/F3).

   Las reglas (nivel, progresión, cambio) viven en
   game/philosophy.js; aquí solo datos y las primitivas de
   mutación que usa content/ (ARQUITECTURA §4).
   ============================================================ */

// Las 5 aristas transversales (decisión PO #5). `tipo` = el tipo de secuencia
// del catálogo (content/sequences.js) que ese fútbol genera. `stat` = la stat
// que ese fútbol trabaja (la usa el evento "Ensayo de la firma", F3).
export const ARISTAS = [
  { id: "presion",      icon: "🦁", label: "Presión",      desc: "cazar arriba",          tipo: "recuperacion", stat: "defensa" },
  { id: "elaboracion",  icon: "🎼", label: "Elaboración",  desc: "tener y circular",      tipo: "circulacion",  stat: "pase_corto" },
  { id: "verticalidad", icon: "⚡", label: "Verticalidad", desc: "atacar el espacio",     tipo: "transicion",   stat: "velocidad" },
  { id: "solidez",      icon: "🧱", label: "Solidez",      desc: "orden y bloque",        tipo: "repliegue",    stat: "defensa" },
  { id: "directo",      icon: "🌩️", label: "Juego directo", desc: "el pelotazo y el duelo", tipo: "pelotazo",    stat: "pase_largo" },
];

export const aristaById = id => ARISTAS.find(a => a.id === id);

/* Las ETAPAS de identidad (los 3 niveles originales de F1, valores EXACTOS —
   mult ×1.35/×1.7/×2.1 calibrados en F1). Desde el arco de Rasgos (T1) son la
   vista narrativa Y la escala técnica del RIVAL: rivalFiloLevel, la brecha R3
   (identityGapMult), los gates de la avanzada y el scouting siguen operando
   etapa vs etapa — CERO recalibración del Rebalance. */
export const FILO_ETAPAS = [
  { id: "aprendiendo", label: "Aprendiendo",   min: 0, mult: 1.35 },
  { id: "desarrollo",  label: "En desarrollo", min: 4, mult: 1.7 },
  { id: "consolidada", label: "Consolidada",   min: 9, mult: 2.1 },
];

/* ============================================================
   LA ESCALERA DE 10 NIVELES, AHORA POR EXPERIENCIA (arco de
   Progresión, 28-jul-2026). Las 4 filosofías progresan por
   SEPARADO y solo con XP ganada EN LA CANCHA (y en eventos):
   se aprende el fútbol que se juega, como las habilidades de
   Skyrim. `min` es XP ACUMULADA; `mult` interpola ×1.35→×2.10
   y sesga MI tipo firma; `etapa` indexa FILO_ETAPAS (Desarrollo
   nivel 5, Consolidada nivel 10 — las anclas de F1 intactas).

   La curva: costos crecientes 250·300·360·430·510·600·700·810·930.
   Está calibrada para que una run PERFECTA (8 partidos jugando
   siempre la misma idea, con el Plan de Partido puesto y la
   afinidad de la filosofía inicial) llegue al nivel 10 — y una
   run promedio deje a la principal en 6-8. Es el dial declarado
   del arco: si el techo se alcanza demasiado fácil, sube acá. */
const FILO_XP_STEPS = [250, 300, 360, 430, 510, 600, 700, 810, 930];
export const FILO_LEVELS = Array.from({ length: 10 }, (_, i) => ({
  min: FILO_XP_STEPS.slice(0, i).reduce((s, x) => s + x, 0),
  mult: +(1.35 + (i * 0.75) / 9).toFixed(2),
  etapa: i >= 9 ? 2 : i >= 4 ? 1 : 0,
}));

/* La XP del partido (el 70/30 del GDD): la INTENCIÓN paga por cada jugada de ese
   fútbol que el equipo propone; la EFECTIVIDAD paga por cada acto que sale bien
   (y por el gol que la corona). Con ~10 jugadas y ~10 aciertos del tipo propio,
   el reparto queda 140/60 = 70/30 exacto. Los dos son diales del arco. */
export const XP_INTENCION = 125;
export const XP_ACIERTO = 55;

/* Qué filosofía APRENDE cada tipo de secuencia del catálogo (content/sequences):
   la arista ya mapeaba tipo↔fútbol, esto lo lleva a la filosofía dueña. Las
   secuencias AVANZADAS traen su `advFor` y mandan sobre esta tabla. El balón
   parado y la salida de fondo no enseñan nada: no son identidad de nadie. */
export const FILO_BY_TIPO = {
  recuperacion: "press",      // cazar arriba
  circulacion: "posesion",    // tener y circular
  transicion: "contra",       // atacar el espacio tras robar
  banda: "contra",            // desbordar es atacar el espacio (Odisea, decisión PO)
  pelotazo: "bloque",         // el duelo directo
  repliegue: "bloque",        // defender organizado y neutralizar
  salida_corta: "posesion",   // sacarla jugada desde el área propia (Territorio, T4)
  espalda: "contra",          // atacar el espacio detrás del bloque alto (Territorio, T4)
};
export const filoOfType = (type) => type?.advFor || FILO_BY_TIPO[type?.id] || null;

/* LA AFINIDAD (GDD): la filosofía INICIAL de la run decide a qué velocidad se
   aprenden las demás. Eje proactivo (Press · Posesión) vs reactivo (Contra ·
   Bloque): tu vecina de eje te resulta natural, tu cruzada se te resiste.
   Propia ×2 · cercana ×1.25 · neutral ×1 · opuesta ×0.6. Incentiva especializar
   sin cerrar ninguna puerta: la opuesta progresa, solo que más lento. */
export const AFINIDAD = {
  press:    { press: 2, posesion: 1.25, contra: 1,    bloque: 0.6 },
  posesion: { posesion: 2, press: 1.25, contra: 1,    bloque: 0.6 },
  contra:   { contra: 2, bloque: 1.25,  press: 1,     posesion: 0.6 },
  bloque:   { bloque: 2, contra: 1.25,  posesion: 1,  press: 0.6 },
};
export const AFINIDAD_LABEL = { 2: "tu escuela", 1.25: "afín", 1: "neutral", 0.6: "opuesta" };
export const afinidadMult = (inicial, target) => AFINIDAD[inicial]?.[target] ?? 1;

/* Las 4 filosofías (decisión PO #5): combinación de 2 aristas; `firma` es la
   arista que define su fútbol (su `tipo` es el tipo firma del pool). `fuerte` y
   `advertencia` anticipan la matriz de counters de F2 (regla 4 del Bible: toda
   filosofía con fortalezas Y vulnerabilidades VISIBLES desde la elección).
   `rasgo` es el premio de Consolidada — en F1 es promesa visible (dato y UI);
   su efecto mecánico llega con la matriz en F2/F3. */
export const PHILOSOPHIES = [
  {
    id: "press", icon: "🦁", name: "High Press",
    aristas: ["presion", "verticalidad"], firma: "presion",
    lema: "Cazar arriba y atacar el espacio antes de que el rival respire.",
    fuerte: "Brilla contra los que quieren la pelota: más robos en salida rival.",
    advertencia: "Correr arriba los 90' pasa factura física, y un pelotazo sobre la presión te parte.",
    rasgo: "La cacería roba aún más letal, y al rival solo le queda la falta: más amarillas, más tiros libres tuyos.",
    // Mi fila de la matriz en cualitativo (F3, pantalla de identidad — regla 4: visible)
    counters: { brilla: "contra los que quieren la pelota (Posesión): su salida es tu festín", sufre: "el costo es físico: −6 de energía extra cada partido, y el pelotazo por arriba te parte" },
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
    fuerte: "Domina los partidos: más circulación, y el contrapressing sostiene el control.",
    advertencia: "Se estrella contra un bloque bajo bien plantado: circular sin morder no gana partidos.",
    rasgo: "La sinfonía gana su 4º compás: más desesperación acumulada, más penales.",
    counters: { brilla: "cuando el partido se juega con la pelota: tu circulación manda y el control es tuyo", sufre: "contra un Bloque bajo cerrado: la circulación rinde menos y terminas reventando pelotazos" },
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
    fuerte: "Vive del rival que ataca: cada avance suyo es una contra tuya en potencia.",
    advertencia: "Cede la iniciativa: contra otro que también espera, el partido se muere.",
    rasgo: "El primer tramo deja al rival AÚN más partido: el segundo llega lanzado.",
    counters: { brilla: "contra el que toma la iniciativa (Press y Posesión): su espalda es tu autopista", sufre: "cedes posesión por identidad, y contra otro que espera (Contra/Bloque) el partido se muere" },
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
    fuerte: "Dificilísimo de romper: invita al rival y lo seca en el bloque.",
    advertencia: "Sufre al que elabora con paciencia, y renuncia a generar volumen ofensivo.",
    rasgo: "La muralla contiene mejor — y castiga casi siempre.",
    counters: { brilla: "en la trinchera: el balón parado es tu gol (×1.3) y el que se te viene encima se seca", sufre: "cedes volumen ofensivo por identidad, y el que elabora con paciencia (Posesión) te sitia" },
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
