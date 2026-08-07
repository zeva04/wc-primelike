/* ============================================================
   ui/pixicons — iconos de 16×16 dibujados píxel a píxel.

   Mismo enfoque que ui/sprites.js (una grilla de caracteres → un <rect> por
   píxel), pero para los ICONOS de interfaz en vez de los bustos de jugadores.
   Vienen del diseño "Hub Mundial 2026" y existen por una razón concreta: en una
   pantalla de pixel art, un emoji del sistema se ve como una calcomanía — tiene
   antialias, degradados y una métrica que no es la de la grilla.

   Cada icono es un array de filas; cada letra, una entrada de PAL. El punto es
   transparente. Las filas pueden ser menos de 16: se dibujan desde arriba.
   ============================================================ */

const PAL = {
  K: "#0B0B0E", Y: "#3a3a46", X: "#7a7a86", W: "#f4f4f0",
  G: "#D4AF37", L: "#F0D97D", D: "#8B6914",
  E: "#34d399", A: "#fbbf24", R: "#f87171", B: "#38bdf8",
  S: "#EA002A", N: "#007A33", U: "#0057B8", T: "#75AADB", C: "#1e7a3a",
};

const GRIDS = {
  moral: [
    "................", "...KK.....KK....", "..KEEK...KEEK...", ".KEEEEK.KEEEEK..",
    ".KEEEEEKEEEEEK..", ".KEEEEEEEEEEEK..", ".KEEEEEEEEEEEK..", "..KEEEEEEEEEK...",
    "...KEEEEEEEK....", "....KEEEEEK.....", ".....KEEEK......", "......KEK.......", ".......K........",
  ],
  energia: [
    ".......KK.......", "......KLAK......", ".....KLAAK......", "....KLAAK.......",
    "...KLAAAAAAK....", "....KAAAAAK.....", ".......KAAK.....", "......KAAK......",
    ".....KAAK.......", "....KAK.........", "....KK..........",
  ],
  ritmo: [
    "......K..K......", ".....KXK.KXK....", "...KKXXXXXXKK...", "...KXXXXXXXXK...",
    "..KXXXKKKKXXXK..", "..KXXKY..YKXXK..", "..KXXKY..YKXXK..", "..KXXXKKKKXXXK..",
    "...KXXXXXXXXK...", "...KKXXXXXXKK...", ".....KXK.KXK....", "......K..K......",
  ],
  lesion: [
    "..KKKKKKKKKK....", "..KRRRRWWRRK....", "..KRRRRWWRRK....", "..KWWWWWWWWK....",
    "..KWWWWWWWWK....", "..KRRRRWWRRK....", "..KRRRRWWRRK....", "..KKKKKKKKKK....",
  ],
  roja: [
    "....KKKKKKK.....", "....KSSSSSK.....", "....KSSSSSK.....", "....KSSSSSK.....",
    "....KSSSSSK.....", "....KSSSSSK.....", "....KSSSSSK.....", "....KSSSSSK.....", "....KKKKKKK.....",
  ],
  amarilla: [
    "....KKKKKKK.....", "....KAAAAAK.....", "....KAAAAAK.....", "....KAAAAAK.....",
    "....KAAAAAK.....", "....KAAAAAK.....", "....KAAAAAK.....", "....KAAAAAK.....", "....KKKKKKK.....",
  ],
  racha: [
    ".......K........", "......KAK.......", "......KAK.......", ".....KAAAK......",
    ".....KAAAAK.....", "....KAAAAAK.....", "....KRAAAAAK....", "....KRAAAAAK....",
    "....KRRAAARK....", ".....KRRARK.....", "......KRRK......", ".......KK.......",
  ],
  frio: [
    "......KBK.......", "...K..KBK..K....", "...KB.KBK.BK....", "....KBKBKBK.....",
    "..KKBBBBBBBKK...", "....KBKBKBK.....", "...KB.KBK.BK....", "...K..KBK..K....", "......KBK.......",
  ],
  balon: [
    "....KKKKKK......", "..KKWWWWWWKK....", "..KWWSSWWWWK....", ".KWWSSSSWWWWK...",
    ".KWWWWSSWWWWK...", ".KWWWWWWNNWWK...", ".KWWUUWWNNWWK...", ".KWWUUWWWWWWK...",
    "..KWWWWWWWWK....", "..KKWWWWWWKK....", "....KKKKKK......",
  ],
  trofeo: [
    "..KKKKKKKKKK....", "..KLLLLLLLLK....", ".KKGGGGGGGGKK...", ".KGKGGGGGGKGK...",
    ".KGKGGGGGGKGK...", ".KKGGGGGGGGKK...", "...KGGGGGGK.....", "....KGGGGK......",
    ".....KGGK.......", "....KGGGGK......", "..KKGGGGGGKK....", "..KDDDDDDDDK....",
  ],
  diario: [
    "..KKKKKKKKKK....", "..KWWWWWWWWK....", "..KWKKKKKKWK....", "..KWWWWWWWWK....",
    "..KWKKKWKKWK....", "..KWKKKWKKWK....", "..KWWWWWWWWK....", "..KWKKKWKKWK....",
    "..KWKKKWKKWK....", "..KWWWWWWWWK....", "..KKKKKKKKKK....",
  ],
  escudo: [
    "..KKKKKKKKKK....", "..KTTTWWTTTK....", "..KTTTWWTTTK....", "..KTTTWWTTTK....",
    "..KTTTWWTTTK....", "...KTTWWTTK.....", "...KTTWWTTK.....", "....KTWWTK......",
    ".....KWWK.......", "......KK........",
  ],
  silbato: [
    "....KKKKK.......", "...KXXXXXKK.....", "..KXXWWXXXXK....", "..KXXWWXXXXK....",
    "..KXXXXXXXK.....", "...KKKKKKK......", "......KXK.......", "......KXK.......",
  ],
  cronometro: [
    "......KKK.......", "....KKXXXKK.....", "...KXXXXXXXK....", "..KXWWWKWWWXK...",
    "..KXWWWKWWWXK...", "..KXWWWKKKWXK...", "..KXWWWWWWWXK...", "..KXWWWWWWWXK...",
    "...KXXXXXXXK....", "....KKXXXKK.....", "......KKK.......",
  ],
  luna: [
    "....KKKK........", "...KLLLLK.......", "..KLLKKKKK......", "..KLLK..........",
    "..KLLK..........", "..KLLKKKKK......", "...KLLLLK.......", "....KKKK........",
  ],
  candado: [
    "....KKKKK.......", "...KX...XK......", "...KX...XK......", "..KKKKKKKKK.....",
    "..KAAAAAAAK.....", "..KAAAKAAAK.....", "..KAAAKAAAK.....", "..KAAAAAAAK.....", "..KKKKKKKKK.....",
  ],
  diana: [
    "....KKKKKK......", "..KKRRRRRRKK....", "..KRRWWWWRRK....", ".KRRWWRRWWRRK...",
    ".KRWWRRRRWWRK...", ".KRWWRRRRWWRK...", ".KRRWWRRWWRRK...", "..KRRWWWWRRK....",
    "..KKRRRRRRKK....", "....KKKKKK......",
  ],
  flecha: [
    ".........KK.....", "..........KK....", "..KKKKKKKKKLK...", "..KLLLLLLLLLLK..",
    "..KKKKKKKKKLK...", "..........KK....", ".........KK.....",
  ],
  engranaje: [
    "......K..K......", ".....KYK.KYK....", "...KKYYYYYYKK...", "...KYYYYYYYYK...",
    "..KYYYKKKKYYYK..", "..KYYK....KYYK..", "..KYYK....KYYK..", "..KYYYKKKKYYYK..",
    "...KYYYYYYYYK...", "...KKYYYYYYKK...", ".....KYK.KYK....", "......K..K......",
  ],
};

// Los <rect> de cada icono se calculan UNA vez: son los mismos para cualquier
// tamaño (el <svg> escala por viewBox), y el hub pinta decenas por render.
const RECTS = {};
for (const name in GRIDS) {
  const r = [];
  GRIDS[name].forEach((row, y) => {
    for (let x = 0; x < row.length; x++) {
      const c = row[x];
      if (c !== ".") r.push(`<rect x="${x}" y="${y}" width="1" height="1" fill="${PAL[c] || "#ff00ff"}"/>`);
    }
  });
  RECTS[name] = r.join("");
}

/** Los nombres disponibles (lo usan los tests para no dejar iconos muertos). */
export const PX_ICON_NAMES = Object.keys(GRIDS);

/**
 * Un icono pixelado como string SVG. `px` es el lado en píxeles de pantalla; con
 * múltiplos de 16 (16, 32, 48) cada píxel del arte cae entero y el borde queda
 * limpio. Devuelve "" si el nombre no existe: un icono que falta no rompe una
 * pantalla entera.
 */
export function pxIcon(name, px = 16) {
  if (!RECTS[name]) return "";
  return `<svg viewBox="0 0 16 16" width="${px}" height="${px}" shape-rendering="crispEdges"
    style="image-rendering:pixelated;display:block;flex-shrink:0">${RECTS[name]}</svg>`;
}
