/* ============================================================
   ui/sprites — arte procedural de jugadores (busto pixelado
   12×14 dibujado píxel a píxel en SVG).
   ============================================================ */

// Look procedural determinista para rivales sin `look` propio: hash del nombre
// → mismo jugador, mismo sprite en todas las runs.
const SKIN_POOLS = {
  UEFA: ["#FFDBAC", "#F1C27D", "#E0AC69", "#C68642", "#8D5524"],
  CONMEBOL: ["#F1C27D", "#E0AC69", "#C68642", "#A0663A", "#8D5524"],
  CONCACAF: ["#F1C27D", "#E0AC69", "#C68642", "#A0663A", "#8D5524"],
  CAF: ["#8D5524", "#6B4226", "#A0663A", "#C68642"],
  AFC: ["#FFDBAC", "#F1C27D", "#E0AC69", "#C68642"],
  OFC: ["#F1C27D", "#E0AC69", "#C68642", "#8D5524"],
};
const HAIR_DARK = ["#17130F", "#0E0C0A", "#2A1D12", "#4A331F"];
const HAIR_LIGHT = ["#E8C56A", "#8A6B3F", "#B3823E", "#4A331F"];
const SPRITE_STYLES = ["short", "short", "buzz", "buzz", "curly", "long", "bun", "bald"];

/** Hash FNV-1a de un string → entero estable (misma entrada, mismo sprite siempre). */
export function nameHash(s) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
  return h >>> 0;
}

/** Apariencia procedural determinista para un rival sin `look` propio (deriva del hash del nombre). */
export function rivalLook(name, team) {
  const h = nameHash(name + (team ? team.id : ""));
  const pool = SKIN_POOLS[team && team.confed] || SKIN_POOLS.UEFA;
  const skin = pool[h % pool.length];
  const claro = skin === "#FFDBAC" || skin === "#F1C27D";
  const hairPool = claro ? HAIR_LIGHT : HAIR_DARK;
  return {
    skin,
    hair: hairPool[(h >> 4) % hairPool.length],
    style: SPRITE_STYLES[(h >> 8) % SPRITE_STYLES.length],
    beard: ((h >> 13) & 1) === 1,
  };
}

/* ---------- Choque de camisetas y kit alternativo ----------
   El Mundial real resuelve esto con la designación de colores de FIFA: si los dos
   equipos visten parecido, uno se cambia. Acá pasa lo mismo, con dos reglas:

   1. CHOCAN si sus camisetas están a menos de CLASH_DIST en distancia RGB. El umbral
      es 60 porque a esa distancia el ojo ya no las separa en un busto de 12×14 píxeles
      —el blanco de Inglaterra contra el de Alemania da 0, y el naranja de Costa de
      Marfil contra el de Países Bajos da 21—, mientras que dos rojos de identidad
      distinta (Suiza #FF0000 vs Austria #ED2939) dan 72 y conviven bien.
   2. SE CAMBIA EL RIVAL, nunca vos: tu selección siempre sale con su camiseta titular.
      Es decisión de diseño, no una regla del fútbol: el jugador tiene que reconocer a
      los suyos de un vistazo, siempre, en cualquier cruce.

   Un equipo sin `kits.alt` no se cambia: se queda con la titular (el choque se ve, pero
   nada se rompe). */
export const CLASH_DIST = 60;

const rgb = h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16));

/** Distancia RGB entre dos colores hex. */
export function kitDistance(a, b) {
  const [r1, g1, b1] = rgb(a), [r2, g2, b2] = rgb(b);
  return Math.sqrt((r1 - r2) ** 2 + (g1 - g2) ** 2 + (b1 - b2) ** 2);
}

/** ¿Dos camisetas se confunden a la vista? */
export function kitsClash(a, b) { return kitDistance(a, b) < CLASH_DIST; }

/** Camiseta titular de un equipo (jugable o rival), sin mirar el cruce. */
export function fieldKit(team) {
  return (team.kits && team.kits.field) || team.kit || { shirt: "#64748B", accent: "#334155" };
}

/**
 * Camiseta de campo que le toca a `team` en un partido contra `vs`: la titular, o la
 * alternativa si chocan. `vs` ausente = no hay cruce, siempre la titular.
 */
export function fieldKitVs(team, vs) {
  const field = fieldKit(team);
  const alt = team.kits && team.kits.alt;
  if (!vs || !alt) return field;
  return kitsClash(field.shirt, fieldKit(vs).shirt) ? alt : field;
}

/** Camiseta que viste el jugador: {shirt, accent}. `vs` es el equipo rival, si se lo conoce. */
export function kitOf(player, team, vs) {
  const gk = team.kits ? (team.kits.gk || fieldKit(team)) : { shirt: "#52525B", accent: "#18181B" };
  return player.pos === "POR" ? gk : fieldKitVs(team, vs);
}

/**
 * Sprite pixelado (busto 12×14): piel + pelo (estilo) + barba + camiseta del equipo, dibujado
 * píxel a píxel en SVG. El arquero usa la equipación kits.gk; los rivales usan su `kit` titular.
 * `vs` (opcional) es el equipo que tiene enfrente: si las camisetas chocan, este se cambia a
 * la alternativa. Se lo pasa solo quien dibuja los DOS equipos junto (el informe del rival).
 */
export function spriteSvg(player, team, sizeCls = "w-8 h-9", vs = null) {
  const look = player.look || rivalLook(player.name || "?", team);
  const kit = kitOf(player, team, vs);
  const S = look.skin, H = look.hair, K = kit.shirt, A = kit.accent, E = "#12161C";
  const st = look.style || "short";
  const px = [];
  const put = (x, y, c) => px.push(`<rect x="${x}" y="${y}" width="1" height="1" fill="${c}"/>`);
  const row = (x0, x1, y, c) => { for (let x = x0; x <= x1; x++) put(x, y, c); };

  // Cabeza (piel): filas 2-6, mandíbula más angosta en fila 7
  for (let y = 2; y <= 6; y++) row(3, 8, y, S);
  row(4, 7, 7, S);
  // Ojos
  put(4, 4, E); put(7, 4, E);
  // Barba (usa el color de pelo): mejillas y mentón
  if (look.beard) { put(3, 5, H); put(8, 5, H); row(3, 6, 6, H === S ? "#3a2a1a" : H); row(4, 7, 6, H); row(4, 7, 7, H); put(5, 7, S); put(6, 7, S); }
  // Pelo según estilo
  if (st !== "bald") row(3, 8, 1, H);
  if (st === "short" || st === "curly" || st === "long" || st === "bun") { row(3, 8, 0, H); put(3, 2, H); put(8, 2, H); }
  if (st === "curly") { put(2, 0, H); put(9, 0, H); put(2, 1, H); put(9, 1, H); put(2, 2, H); put(9, 2, H); }
  if (st === "long") { for (let y = 2; y <= 6; y++) { put(2, y, H); put(9, y, H); } }
  if (st === "bun") { put(5, 0, H); put(6, 0, H); row(4, 7, 0, H); }
  // Cuello y hombros
  put(5, 8, S); put(6, 8, S);
  row(1, 3, 8, K); row(8, 10, 8, K);
  // Torso con cuello de la camiseta y vivos en las mangas
  row(1, 10, 9, K); put(4, 9, A); put(7, 9, A); put(5, 9, S); put(6, 9, S);
  for (let y = 10; y <= 13; y++) { row(1, 10, y, K); put(1, y, A); put(10, y, A); }

  return `<svg viewBox="0 0 12 14" class="${sizeCls} shrink-0" shape-rendering="crispEdges" style="image-rendering:pixelated">${px.join("")}</svg>`;
}
