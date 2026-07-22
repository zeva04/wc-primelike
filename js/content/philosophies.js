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
  { id: "elaboracion",  icon: "🎼", label: "Elaboración",  desc: "tener y circular",      tipo: "circulacion",  stat: "pase" },
  { id: "verticalidad", icon: "⚡", label: "Verticalidad", desc: "atacar el espacio",     tipo: "transicion",   stat: "tiro" },
  { id: "solidez",      icon: "🧱", label: "Solidez",      desc: "orden y bloque",        tipo: "repliegue",    stat: "defensa" },
  { id: "directo",      icon: "🌩️", label: "Juego directo", desc: "el pelotazo y el duelo", tipo: "pelotazo",    stat: "cabezazo" },
];

export const aristaById = id => ARISTAS.find(a => a.id === id);

// Niveles de identidad (decisión PO #6 + umbrales elegidos en F1): el nivel se
// calcula sobre la SUMA de las 2 aristas propias. `mult` es el sesgo del tipo
// firma en typeWeights — comparable a la mentalidad (×1.5-1.6), que sigue siendo
// el ajuste de corto plazo (Bible §5 regla 5). Umbrales calibrados a la run:
// ~13 acciones hasta cerrar grupos → Desarrollo hacia la fecha 2-3 invirtiendo
// 1 de cada 3 días; Consolidada recién en cuartos (con ejecución encima).
export const FILO_LEVELS = [
  { id: "aprendiendo", label: "Aprendiendo",   min: 0, mult: 1.35 },
  { id: "desarrollo",  label: "En desarrollo", min: 4, mult: 1.7 },
  { id: "consolidada", label: "Consolidada",   min: 9, mult: 2.1 },
];

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
 * Puntos y nivel de la identidad de una run, PUROS y solo sobre datos de este
 * archivo (F3: el contenido también los necesita — "La prensa bautiza tu estilo"
 * lee el nivel — y content/ no importa game/). game/philosophy delega acá:
 * una sola fuente para el umbral, cero divergencia.
 */
export function filoPointsOf(r) {
  const f = getPhilosophy(r.filoId);
  if (!f) return 0;
  return +f.aristas.reduce((s, k) => s + (r.aristas?.[k] || 0), 0).toFixed(2);
}
export function filoLevelOf(r) {
  const pts = filoPointsOf(r);
  let lvl = 0;
  FILO_LEVELS.forEach((l, i) => { if (pts >= l.min) lvl = i; });
  return lvl;
}

// Tipo firma por filosofía ({press: "recuperacion", ...}): lo que el pool sesga
// (match/sequences) y lo que la ejecución cuenta (game/philosophy). Derivado de
// los datos para que no puedan divergir.
export const FIRMA_TYPE = Object.fromEntries(PHILOSOPHIES.map(p => [p.id, aristaById(p.firma).tipo]));

/**
 * Progreso de identidad desde CONTENIDO (eventos/oportunidades/conflictos que
 * antes regalaban `buffs.tactica`): suma `pts` a la arista MÁS BAJA de la
 * filosofía activa (refuerza donde cojea; empate → la firma). Mutación con
 * primitivas, sin importar game/ (ARQUITECTURA §4, mismo patrón que la moral).
 * Devuelve la arista tocada (para el desc del evento) o null sin filosofía.
 */
export function addFiloProgress(r, pts) {
  const f = getPhilosophy(r.filoId);
  if (!f) return null;
  r.aristas = r.aristas || {};
  const [a] = [...f.aristas].sort((x, y) => (r.aristas[x] || 0) - (r.aristas[y] || 0) || (x === f.firma ? -1 : 1));
  r.aristas[a] = +((r.aristas[a] || 0) + pts).toFixed(2);
  return aristaById(a);
}

/**
 * Progreso DIRECTO a la arista firma (F3: los eventos de filosofía trabajan la
 * identidad, no el hueco — "Visita del maestro", "Ensayo de la firma"). Misma
 * primitiva de mutación que addFiloProgress; null sin filosofía.
 */
export function addFirmaProgress(r, pts) {
  const f = getPhilosophy(r.filoId);
  if (!f) return null;
  r.aristas = r.aristas || {};
  r.aristas[f.firma] = +((r.aristas[f.firma] || 0) + pts).toFixed(2);
  return aristaById(f.firma);
}
