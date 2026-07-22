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
// del catálogo (content/sequences.js) que ese fútbol genera.
export const ARISTAS = [
  { id: "presion",      icon: "🦁", label: "Presión",      desc: "cazar arriba",          tipo: "recuperacion" },
  { id: "elaboracion",  icon: "🎼", label: "Elaboración",  desc: "tener y circular",      tipo: "circulacion" },
  { id: "verticalidad", icon: "⚡", label: "Verticalidad", desc: "atacar el espacio",     tipo: "transicion" },
  { id: "solidez",      icon: "🧱", label: "Solidez",      desc: "orden y bloque",        tipo: "repliegue" },
  { id: "directo",      icon: "🌩️", label: "Juego directo", desc: "el pelotazo y el duelo", tipo: "pelotazo" },
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
    rasgo: "La presión roba en zona más letal.",
  },
  {
    id: "posesion", icon: "🎼", name: "Posesión",
    aristas: ["elaboracion", "presion"], firma: "elaboracion",
    lema: "Tener la pelota es atacar y defender a la vez; si se pierde, se caza al toque.",
    fuerte: "Domina los partidos: más circulación, y el contrapressing sostiene el control.",
    advertencia: "Se estrella contra un bloque bajo bien plantado: circular sin morder no gana partidos.",
    rasgo: "Un acto más de circulación: las jugadas largas maduran mejor.",
  },
  {
    id: "contra", icon: "⚡", name: "Contragolpe",
    aristas: ["solidez", "verticalidad"], firma: "verticalidad",
    lema: "Orden atrás, y a la que pierden la pelota: puñalada al espacio.",
    fuerte: "Vive del rival que ataca: cada avance suyo es una contra tuya en potencia.",
    advertencia: "Cede la iniciativa: contra otro que también espera, el partido se muere.",
    rasgo: "Las transiciones salen con mejor perfil de remate.",
  },
  {
    id: "bloque", icon: "🧱", name: "Bloque bajo",
    aristas: ["solidez", "directo"], firma: "directo",
    lema: "Muralla atrás y pelotazo al duelo: fútbol de trinchera.",
    fuerte: "Dificilísimo de romper: invita al rival y lo seca en el bloque.",
    advertencia: "Sufre al que elabora con paciencia, y renuncia a generar volumen ofensivo.",
    rasgo: "El repliegue contiene mejor: la muralla de verdad.",
  },
];

export const getPhilosophy = id => PHILOSOPHIES.find(p => p.id === id) || null;

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
