/* ============================================================
   ui/screens/hub/complex — EL COMPLEJO: la ciudad deportiva
   isométrica donde se toma la Acción del Día.

   Adaptado del diseño "Hub Mundial 2026" (Claude Design). Todo el arte se DIBUJA,
   no se carga: seis edificios isométricos en SVG generados con cuatro primitivas
   (`box`, `slab`, `onL/onR`, `grid*`). Es el mismo principio que ya usa
   ui/sprites.js para los jugadores — el juego no tiene assets binarios y esto no
   los introduce.

   ── LA PROYECCIÓN ────────────────────────────────────────────────────────────
   Isométrica 2:1, la de los 16 bits: un paso en X va 16px a la derecha y 8 abajo;
   uno en Y, 16 a la izquierda y 8 abajo; uno en Z sube 9. Con esa única función
   (`P`) y una caja de tres caras (`box`) se construye todo lo demás. Las caras se
   pintan en tres tonos del MISMO color (techo 100%, izquierda 72%, derecha 55%)
   para que el volumen se lea sin una sola sombra difusa.

   ── QUÉ EDIFICIO ES QUÉ ACCIÓN ───────────────────────────────────────────────
   El mapeo es 1:1 con las acciones reales del juego (content/daily/day-actions):
     campo      → entrenar (los 5 focos)        · gasta el día
     video      → plan de partido (4 filosofías) · gasta el día
     residencia → jornada de recuperación        · gasta el día
     asado      → jornada de integración         · gasta el día
     scouting   → informe del rival              · GRATIS
     enfermeria → parte médico / plantilla       · GRATIS
   ============================================================ */
import { pxIcon } from "../../pixicons.js";

/* ── Primitivas isométricas ─────────────────────────────────────────────────── */

/** Proyecta un punto del mundo (x, y, z) al plano. Redondeado: el pixel manda. */
const P = (x, y, z) => `${Math.round((x - y) * 16)},${Math.round((x + y) * 8 - z * 9)}`;

/** Oscurece un hex por un factor (las caras laterales de una caja). */
function shade(hex, f) {
  const v = parseInt(hex.slice(1), 16);
  return "#" + [(v >> 16) & 255, (v >> 8) & 255, v & 255]
    .map(x => Math.max(0, Math.min(255, Math.round(x * f))).toString(16).padStart(2, "0")).join("");
}

/** Fábrica de un sprite: acumula polígonos y los cierra en un <svg>. */
function draw() {
  const out = [];
  // `stroke = null` quita el contorno: se usa para lo que va PEGADO a una cara
  // (ventanas, líneas de cancha). Con contorno se vería un marco negro flotando.
  const poly = (pts, fill, stroke) =>
    out.push(`<polygon points="${pts.join(" ")}" fill="${fill}"${stroke === null ? "" : ` stroke="${stroke || "#14111c"}" stroke-width="1" stroke-linejoin="miter"`}/>`);

  const api = {
    /** Caja de tres caras visibles. El orden importa: derecha, frente, techo. */
    box(x, y, z, w, d, h, col) {
      poly([P(x + w, y, z), P(x + w, y + d, z), P(x + w, y + d, z + h), P(x + w, y, z + h)], shade(col, 0.72));
      poly([P(x, y + d, z), P(x + w, y + d, z), P(x + w, y + d, z + h), P(x, y + d, z + h)], shade(col, 0.55));
      poly([P(x, y, z + h), P(x + w, y, z + h), P(x + w, y + d, z + h), P(x, y + d, z + h)], col);
      return api;
    },
    /** Losa plana a ras de suelo (el terreno de la parcela). */
    slab(x, y, w, d, col, z = 0) {
      poly([P(x, y, z), P(x + w, y, z), P(x + w, y + d, z), P(x, y + d, z)], col);
      return api;
    },
    /** Rectángulo pegado a la cara izquierda / derecha (ventanas, carteles). */
    onL(x, y, z, du, dv, fill) { poly([P(x, y, z), P(x + du, y, z), P(x + du, y, z + dv), P(x, y, z + dv)], fill, null); return api; },
    onR(x, y, z, du, dv, fill) { poly([P(x, y, z), P(x, y + du, z), P(x, y + du, z + dv), P(x, y, z + dv)], fill, null); return api; },
    /** Grilla de ventanas sobre una cara. */
    gridL(x, y, z, cols, rows, fill) { for (let c = 0; c < cols; c++) for (let r = 0; r < rows; r++) api.onL(x + c * 0.9, y, z + r * 0.9, 0.5, 0.5, fill); return api; },
    gridR(x, y, z, cols, rows, fill) { for (let c = 0; c < cols; c++) for (let r = 0; r < rows; r++) api.onR(x, y + c * 0.9, z + r * 0.9, 0.5, 0.5, fill); return api; },
    /** Polígono suelto, para lo que no es una caja (líneas de cancha, cruces). */
    flat(pts, fill, stroke) { poly(pts, fill, stroke); return api; },
    P,
    done() {
      // Sin `filter` inline: la sombra dura la pone el CSS (.px-sprite svg) para que
      // el hover pueda AÑADIRLE el contorno de oro en vez de tener que pisarla.
      return `<svg width="260" height="230" viewBox="-130 -150 260 230" shape-rendering="crispEdges"
        style="overflow:visible;image-rendering:pixelated">${out.join("")}</svg>`;
    },
  };
  return api;
}

/* ── Los seis edificios ─────────────────────────────────────────────────────── */

const SPRITES = {
  /** CAMPO DE ENTRENAMIENTO — cancha recortada con arcos móviles, torres y conos. */
  campo() {
    const d = draw();
    d.slab(-4, -4, 8, 8, "#1e7a3a");
    d.flat([P(-3.4, -3.4, 0), P(3.4, -3.4, 0), P(3.4, 3.4, 0), P(-3.4, 3.4, 0)], "none", "#eaf3ec");
    d.flat([P(-3.4, 0, 0.02), P(3.4, 0, 0.02), P(3.4, 0.08, 0.02), P(-3.4, 0.08, 0.02)], "#eaf3ec", null);
    d.flat([P(-0.9, -0.9, 0.02), P(0.9, -0.9, 0.02), P(0.9, 0.9, 0.02), P(-0.9, 0.9, 0.02)], "none", "#eaf3ec");
    d.box(-1.1, -3.7, 0, 2.2, 0.25, 0.9, "#f4f4f0");     // los dos arcos
    d.box(-1.1, 3.45, 0, 2.2, 0.25, 0.9, "#f4f4f0");
    [[-4.2, -4.2], [4, -4.2], [-4.2, 4], [4, 4]].forEach(t => {   // torres de luz
      d.box(t[0], t[1], 0, 0.35, 0.35, 3.4, "#8f889f");
      d.box(t[0] - 0.25, t[1] - 0.25, 3.4, 0.85, 0.85, 0.4, "#F0D97D");
    });
    [[-2.6, 3.9], [-1.4, 3.9], [2.4, -4]].forEach(c => d.box(c[0], c[1], 0, 0.28, 0.28, 0.34, "#fb923c")); // conos
    return d.done();
  },

  /** SALA DE VIDEO — módulo de cristal con el proyector encendido en la azotea. */
  video() {
    const d = draw();
    d.slab(-3.8, -3.8, 7.6, 7.6, "#5b5468");
    d.flat([P(-2, 2.2, 0.02), P(2, 2.2, 0.02), P(2, 3.6, 0.02), P(-2, 3.6, 0.02)], "#6f6880", null);
    d.box(-2.2, -2.2, 0, 4.4, 4.4, 4.6, "#3f7fa8");
    d.gridL(-1.8, 2.2, 0.5, 4, 4, "#bfe2f5");
    d.gridR(2.2, -1.8, 0.5, 4, 4, "#8fc6e6");
    d.box(-2.5, -2.5, 4.6, 5, 5, 0.3, "#cfe4f5");
    d.box(-0.5, -0.5, 4.9, 1, 1, 1.2, "#D4AF37");        // el foco del proyector
    d.box(1.2, 2.4, 0, 0.6, 0.6, 0.35, "#75AADB");
    d.box(-1.9, 2.4, 0, 0.6, 0.6, 0.35, "#75AADB");
    return d.done();
  },

  /** RESIDENCIA — bloque de habitaciones con las luces cálidas encendidas. */
  residencia() {
    const d = draw();
    d.slab(-3.6, -3.6, 7.2, 7.2, "#3f7f4d");
    d.box(-2.8, -2.8, 0, 5.6, 5.6, 3.2, "#e2d6c3");
    d.box(-3.1, -3.1, 3.2, 6.2, 6.2, 0.35, "#7a5a44");
    d.gridL(-2.4, 2.8, 0.6, 5, 3, "#F0D97D");
    d.gridR(2.8, -2.4, 0.6, 5, 3, "#ffe9a8");
    d.box(-1, 2.8, 0, 2, 1.2, 0.25, "#c9553d");          // el alero de la entrada
    d.box(-1.1, 2.7, 1.5, 2.2, 1.4, 0.2, "#c9553d");
    d.box(-0.5, 3.6, 0, 1, 0.15, 1.4, "#5c4b3a");
    return d.done();
  },

  /** PATIO / ASADO — pérgola de madera, fuego encendido y la mesa larga. */
  asado() {
    const d = draw();
    d.slab(-3.6, -3.6, 7.2, 7.2, "#4a6b3a");
    d.flat([P(-2.4, -1, 0.02), P(2.4, -1, 0.02), P(2.4, 2.6, 0.02), P(-2.4, 2.6, 0.02)], "#8a7250", null); // el patio de tierra
    [[-2.4, -1], [2.2, -1], [-2.4, 2.4], [2.2, 2.4]].forEach(p => d.box(p[0], p[1], 0, 0.28, 0.28, 2.4, "#7a5a44"));
    d.box(-2.6, -1.2, 2.4, 5.2, 4, 0.25, "#8b6b45");     // el techo de la pérgola
    for (let k = 0; k < 5; k++) d.box(-2.4 + k * 1.05, -1, 2.66, 0.35, 3.6, 0.12, "#6b5236");
    d.box(-0.9, 0.2, 0, 1.8, 1.1, 0.55, "#3a3548");      // la parrilla
    d.box(-0.7, 0.35, 0.55, 1.4, 0.8, 0.18, "#EA002A");  // las brasas
    d.box(-0.35, 0.6, 0.73, 0.7, 0.3, 0.5, "#fbbf24");   // el fuego
    d.box(-0.2, 0.7, 1.23, 0.4, 0.2, 0.4, "#fde68a");
    d.box(-2, 1.6, 0, 3.6, 0.8, 0.5, "#a8894f");         // la mesa larga
    d.box(-2, 1.4, 0.5, 3.6, 1.2, 0.14, "#c9a86a");
    return d.done();
  },

  /** SALA DE SCOUTING — monitores azules y la parabólica apuntando al rival. */
  scouting() {
    const d = draw();
    d.slab(-3.6, -3.6, 7.2, 7.2, "#3a3548");
    d.box(-2.6, -2.6, 0, 5.2, 5.2, 2.8, "#2f3a4d");
    d.box(-2.9, -2.9, 2.8, 5.8, 5.8, 0.3, "#46536b");
    d.gridL(-2.1, 2.6, 0.7, 5, 2, "#38bdf8");            // la pared de monitores
    d.gridR(2.6, -2.1, 0.7, 5, 2, "#1f7fb0");
    d.box(1.4, 1.4, 3.1, 0.3, 0.3, 1.6, "#8f889f");      // el mástil
    d.box(0.7, 0.7, 4.7, 1.7, 1.7, 0.22, "#cfd8e4");     // el plato de la parabólica
    d.box(1.2, 1.2, 4.92, 0.7, 0.7, 0.5, "#e8eef5");
    d.box(1.45, 1.45, 5.42, 0.25, 0.25, 0.35, "#EA002A");
    d.box(-2.2, 3.1, 0, 0.28, 0.28, 2.2, "#8f889f");     // el poste con la antena chica
    d.box(-2.45, 2.85, 2.2, 0.8, 0.8, 0.3, "#0057B8");
    return d.done();
  },

  /** ENFERMERÍA — módulo blanco con la cruz verde en la azotea. */
  enfermeria() {
    const d = draw();
    d.slab(-3.6, -3.6, 7.2, 7.2, "#3f7f4d");
    d.box(-2.7, -2.7, 0, 5.4, 5.4, 2.4, "#eef2f4");
    d.box(-3, -3, 2.4, 6, 6, 0.3, "#c3ccd2");
    d.gridL(-2.2, 2.7, 0.7, 5, 2, "#9fd8e8");
    d.gridR(2.7, -2.2, 0.7, 5, 2, "#7fc4d8");
    d.flat([P(-0.6, -1.6, 2.72), P(0.6, -1.6, 2.72), P(0.6, 1.6, 2.72), P(-0.6, 1.6, 2.72)], "#34d399", null);
    d.flat([P(-1.6, -0.6, 2.72), P(1.6, -0.6, 2.72), P(1.6, 0.6, 2.72), P(-1.6, 0.6, 2.72)], "#34d399", null);
    d.box(-0.8, 2.7, 0, 1.6, 0.4, 1.3, "#9fd8e8");
    return d.done();
  },
};

/* ── El plano del complejo ──────────────────────────────────────────────────── */

/**
 * EL PLANO, en su propio sistema de coordenadas de 1440×672.
 *
 * Ese 672 NO es el alto del lienzo (900): es lo que le queda al complejo después de
 * las franjas de arriba y la barra de abajo. El mockup dibujaba sobre los 900 porque
 * era una foto; acá el mapa convive con el HUD, así que las parcelas se colocan en la
 * caja que de verdad les toca — si no, la fila de abajo queda cortada.
 *
 * En X caben en menos de 1030 a propósito: la columna derecha del HUD arranca en
 * 1056 y así ningún edificio queda nunca debajo de ella.
 */
export const PLANO_H = 672;

export const PLOTS = [
  { id: "campo", cx: 225, cy: 190, w: 330, h: 188, acento: "#fbbf24" },
  { id: "residencia", cx: 562, cy: 162, w: 300, h: 172, acento: "#38bdf8" },
  { id: "video", cx: 868, cy: 200, w: 300, h: 172, acento: "#D4AF37" },
  { id: "asado", cx: 178, cy: 458, w: 300, h: 172, acento: "#fb923c" },
  { id: "enfermeria", cx: 518, cy: 442, w: 300, h: 172, acento: "#34d399" },
  { id: "scouting", cx: 852, cy: 480, w: 300, h: 172, acento: "#0057B8" },
];

/* ── LA RED DE CALLES ────────────────────────────────────────────────────────
   La versión anterior heredaba cinco trazos sueltos del mockup: pasaban CERCA de
   los edificios pero no los tocaban, y el predio se leía como seis islas con
   rayas de asfalto por encima. Ahora la red se DERIVA de las parcelas.

   El frente de un edificio es el vértice de abajo de su rombo — en isométrica,
   la puerta. Cada avenida se traza uniendo los frentes de su fila, así que si
   una parcela se mueve la calle la sigue sola y no hay dos verdades.

   La jerarquía es la de un campus de verdad:
     avenidas    unen los tres edificios de cada fila
     conectores  cruzan de una fila a otra, cada uno con su rotonda
     accesos     el ramal corto de la avenida a la puerta (lo que faltaba)
   ── */

/** El frente de una parcela: dónde está la puerta. */
const frente = p => ({ x: p.cx, y: p.cy + p.h / 2 });

/* Cuánto por DEBAJO del frente pasa la avenida de cada fila. No es el mismo
   número arriba y abajo: la fila de abajo tiene que dejar pasar el cartel del
   nombre Y la chapa de "no gasta el día", que cuelgan 42px por debajo del rombo.
   Con menos de 74 la calle se comería la chapa. */
const OFF_NORTE = 44, OFF_SUR = 74;

/** Une los frentes de una fila y prolonga la calzada hasta salirse del cuadro. */
function avenida(fila, off) {
  const pts = fila.map(p => { const f = frente(p); return [f.x, f.y + off]; });
  return `M 14 ${pts[0][1]} L ${pts.map(p => p.join(" ")).join(" L ")} L 1038 ${pts.at(-1)[1]}`;
}

/** Y de una avenida en un x dado (para colgarle un conector sin descuadrarlo). */
function yEnAvenida(fila, off, x) {
  const pts = fila.map(p => { const f = frente(p); return [f.x, f.y + off]; });
  for (let i = 0; i < pts.length - 1; i++) {
    const [x0, y0] = pts[i], [x1, y1] = pts[i + 1];
    if (x >= x0 && x <= x1) return Math.round(y0 + ((x - x0) / (x1 - x0)) * (y1 - y0));
  }
  return x < pts[0][0] ? pts[0][1] : pts.at(-1)[1];
}

const FILA_N = PLOTS.slice(0, 3), FILA_S = PLOTS.slice(3);
const AVE_N = avenida(FILA_N, OFF_NORTE);
const AVE_S = avenida(FILA_S, OFF_SUR);

/* Los dos conectores caen en los huecos entre edificios, y cada uno lleva su
   rotonda a media altura. Con dos (y no una) el centro del predio queda ENCERRADO
   por la calzada: la Enfermería pasa a estar en una isla, que es exactamente cómo
   se siente un campus. */
const ROT_O = { x: 348, y: 462 }, ROT_E = { x: 694, y: 466 };
const conector = (rot) => {
  const arriba = yEnAvenida(FILA_N, OFF_NORTE, rot.x);
  const abajo = yEnAvenida(FILA_S, OFF_SUR, rot.x);
  return `M ${rot.x} ${arriba} C ${rot.x + 12} ${arriba + 55}, ${rot.x + 8} ${rot.y - 47}, ${rot.x} ${rot.y}`
    + ` C ${rot.x - 8} ${rot.y + 48}, ${rot.x - 4} ${abajo - 52}, ${rot.x} ${abajo}`;
};

/**
 * El RAMAL DE ACCESO: de la avenida a la puerta. Es lo que "conecta" de verdad —
 * sin esto las avenidas pasan cerca y el predio se lee como seis islas. Se exporta
 * para que el test pueda comprobar que cada edificio tiene el suyo y que muere
 * exactamente en su frente: si alguien mueve una parcela y el ramal se despega,
 * eso en una captura no se ve.
 */
export const ACCESOS = [
  ...FILA_N.map(p => { const f = frente(p); return `M ${f.x} ${f.y + OFF_NORTE} L ${f.x} ${f.y - 4}`; }),
  ...FILA_S.map(p => { const f = frente(p); return `M ${f.x} ${f.y + OFF_SUR} L ${f.x} ${f.y - 4}`; }),
];

/** La entrada al predio: sube desde el borde de abajo hasta la avenida sur. */
const ENTRADA_X = 430;
const ENTRADA = `M ${ENTRADA_X} ${PLANO_H} L ${ENTRADA_X} ${yEnAvenida(FILA_S, OFF_SUR, ENTRADA_X)}`;

const CALZADAS = [AVE_N, AVE_S, conector(ROT_O), conector(ROT_E), ENTRADA];

/* ── El mobiliario del predio ────────────────────────────────────────────────
   Un complejo deportivo no es seis edificios y unas calles: es lo que hay ENTRE
   ellos. Todo esto se dibuja en el espacio de pantalla del plano (no en el iso
   local de los sprites) porque va pegado al suelo. ── */

/** Árbol isométrico: dos copas en rombo, tronco y su sombra en el pasto. */
const arbol = (x, y, s = 1) => `<g transform="translate(${x},${y}) scale(${s})">
  <ellipse cx="0" cy="2" rx="17" ry="7" fill="#0a3318" opacity=".45"/>
  <rect x="-3" y="-17" width="6" height="19" fill="#5c4b3a" stroke="#14111c" stroke-width="1"/>
  <polygon points="0,-34 21,-22 0,-10 -21,-22" fill="#25733a" stroke="#14111c" stroke-width="1"/>
  <polygon points="0,-28 21,-22 0,-16 -21,-22" fill="#35934a"/>
  <polygon points="0,-48 16,-36 0,-24 -16,-36" fill="#2b8442" stroke="#14111c" stroke-width="1"/>
  <polygon points="0,-42 16,-36 0,-30 -16,-36" fill="#3fa855"/>
</g>`;

/** Farola: el poste y su luz encendida — el predio se ve de noche. */
const farola = (x, y) => `<g transform="translate(${x},${y})">
  <ellipse cx="0" cy="1" rx="8" ry="3" fill="#0a3318" opacity=".45"/>
  <rect x="-2" y="-40" width="4" height="41" fill="#8f889f" stroke="#14111c" stroke-width="1"/>
  <rect x="-2" y="-44" width="15" height="5" fill="#8f889f" stroke="#14111c" stroke-width="1"/>
  <rect x="8" y="-39" width="8" height="5" fill="#F0D97D" stroke="#14111c" stroke-width="1"/>
  <ellipse cx="12" cy="-28" rx="13" ry="16" fill="#F0D97D" opacity=".10"/>
</g>`;

/** Tramo de reja perimetral: dos travesaños y sus postes. */
function reja(x0, x1, y) {
  let postes = "";
  for (let x = x0; x <= x1; x += 30) postes += `<rect x="${x - 2}" y="${y - 26}" width="4" height="28" fill="#4a4458" stroke="#14111c" stroke-width="1"/>`;
  return `<g><rect x="${x0}" y="${y - 22}" width="${x1 - x0}" height="3" fill="#3a3548"/>
    <rect x="${x0}" y="${y - 11}" width="${x1 - x0}" height="3" fill="#3a3548"/>${postes}</g>`;
}

/** Playa de estacionamiento: asfalto, líneas de las plazas y algún auto. */
function playa(x, y, w, h, autos) {
  const paso = w / 6;
  let lineas = "";
  for (let k = 1; k < 6; k++) lineas += `<rect x="${x + k * paso - 1}" y="${y + 4}" width="2" height="${h - 8}" fill="#e8e4d8" opacity=".65"/>`;
  const coches = autos.map(([k, col]) => `<g transform="translate(${x + k * paso + paso / 2},${y + h / 2})">
    <rect x="-14" y="-10" width="28" height="20" fill="${col}" stroke="#14111c" stroke-width="1"/>
    <rect x="-10" y="-7" width="20" height="8" fill="#bfe2f5"/>
    <rect x="-14" y="4" width="28" height="3" fill="#14111c" opacity=".5"/></g>`).join("");
  return `<g><rect x="${x}" y="${y}" width="${w}" height="${h}" fill="#3a3548" stroke="#14111c" stroke-width="2"/>${lineas}${coches}</g>`;
}

/**
 * La CANCHA AUXILIAR: el rectángulo de entrenamiento chico del fondo del predio.
 * Ocupa el hueco de arriba a la izquierda, que era el único trozo de pasto grande
 * sin usar, y dice "esto es un complejo deportivo" mejor que otro estacionamiento
 * — que además no entraba en ningún lado sin pisar una calle o un cartel.
 */
function canchaAux(cx, cy, w, h) {
  const rombo = (dx, dy) => `${cx},${cy - dy} ${cx + dx},${cy} ${cx},${cy + dy} ${cx - dx},${cy}`;
  return `<g>
    <polygon points="${rombo(w / 2, h / 2)}" fill="#1b7035" stroke="#0d3d1e" stroke-width="2"/>
    <polygon points="${rombo(w / 2 - 12, h / 2 - 7)}" fill="none" stroke="#eaf3ec" stroke-width="2" opacity=".7"/>
    <line x1="${cx - w / 2 + 12}" y1="${cy}" x2="${cx + w / 2 - 12}" y2="${cy}" stroke="#eaf3ec" stroke-width="2" opacity=".7"/>
    <ellipse cx="${cx}" cy="${cy}" rx="15" ry="8" fill="none" stroke="#eaf3ec" stroke-width="2" opacity=".7"/>
    <rect x="${cx - w / 2 + 2}" y="${cy - 9}" width="5" height="18" fill="#f4f4f0" stroke="#14111c" stroke-width="1"/>
    <rect x="${cx + w / 2 - 7}" y="${cy - 9}" width="5" height="18" fill="#f4f4f0" stroke="#14111c" stroke-width="1"/>
  </g>`;
}

/** Rotonda: la calzada anular, su isleta de pasto y el mástil del predio. */
const rotonda = ({ x, y }) => `<g>
  <ellipse cx="${x}" cy="${y}" rx="52" ry="30" fill="none" stroke="#0f0d16" stroke-width="34"/>
  <ellipse cx="${x}" cy="${y}" rx="52" ry="30" fill="none" stroke="#3a3548" stroke-width="24"/>
  <ellipse cx="${x}" cy="${y}" rx="52" ry="30" fill="none" stroke="#F0D97D" stroke-width="2" stroke-dasharray="10 12" opacity=".40"/>
  <ellipse cx="${x}" cy="${y}" rx="34" ry="19" fill="#1e7a3a" stroke="#114d25" stroke-width="2"/>
  <rect x="${x - 4}" y="${y - 26}" width="8" height="24" fill="#8f889f" stroke="#14111c" stroke-width="1"/>
  <polygon points="${x},${y - 38} ${x + 10},${y - 31} ${x},${y - 24} ${x - 10},${y - 31}" fill="#D4AF37" stroke="#14111c" stroke-width="1"/>
</g>`;

/** La EXPLANADA de entrada: el pavimento donde el ramal muere contra la puerta. */
const explanada = p => {
  const f = frente(p);
  return `<polygon points="${f.x},${f.y - 26} ${f.x + 58},${f.y} ${f.x},${f.y + 26} ${f.x - 58},${f.y}"
    fill="#4a4558" stroke="#14111c" stroke-width="2"/>`;
};

/**
 * EL SUELO: el césped, el rombo del predio, la red de calles y el mobiliario.
 * Va en dos partes porque no comparten caja:
 *   · el CÉSPED llena toda la franja (`inset:0`), sea cual sea su alto — el fondo
 *     nunca puede quedar corto;
 *   · el PLANO (calles, rotondas, mobiliario) vive en 1440×PLANO_H anclado ABAJO,
 *     el mismo sistema de coordenadas que las parcelas.
 * Cuando no hay Oportunidad el día regala 28px arriba: se los queda el césped.
 *
 * El orden de pintado ES la profundidad: pavimento → calzada → señalización →
 * rotondas → mobiliario. Los árboles y las farolas van al final para que asomen
 * por delante de la calle, como asoman en el mundo.
 */
export function complexGround() {
  const capa = (vias, stroke, w, extra = "") =>
    vias.map(p => `<path d="${p}" ${extra} stroke="${stroke}" stroke-width="${w}"/>`).join("");

  const arboles = [
    [92, 302], [140, 372], [400, 256], [468, 344], [700, 258], [762, 348], [980, 300], [1022, 372],
    [70, 556], [360, 552], [660, 562], [1004, 596], [232, 62, 0.85], [408, 44, 0.85], [624, 52, 0.85], [1000, 62, 0.85],
  ].map(t => arbol(t[0], t[1], t[2])).join("");

  const farolas = [[300, 348], [640, 306], [1000, 348], [268, 600], [612, 590], [962, 628]]
    .map(f => farola(f[0], f[1])).join("");

  return `
    <div class="absolute inset-0" style="background:repeating-linear-gradient(90deg,#0f4423 0 32px,#0d3d1e 32px 64px)"></div>
    <div class="absolute" style="left:-140px;top:-60px;width:1520px;height:820px;background:#114d25;clip-path:polygon(50% 0,100% 50%,50% 100%,0 50%)">
      <div class="absolute" style="inset:3px;background:repeating-linear-gradient(90deg,#1e7a3a 0 32px,#1b7035 32px 64px);clip-path:polygon(50% 0,100% 50%,50% 100%,0 50%)"></div>
    </div>
    <svg viewBox="0 0 1440 ${PLANO_H}" width="1440" height="${PLANO_H}" shape-rendering="crispEdges"
      class="absolute" style="left:0;bottom:0;image-rendering:pixelated">
      ${reja(14, 1038, 40)}
      ${canchaAux(104, 98, 156, 76)}
      ${PLOTS.map(explanada).join("")}
      ${playa(392, 268, 140, 44, [[0, "#EA002A"], [3, "#cfd8e4"]])}
      <g fill="none">${capa(ACCESOS, "#0f0d16", 26)}</g>
      <g fill="none">${capa(ACCESOS, "#4a4558", 18)}</g>
      <g fill="none">${capa(CALZADAS, "#0f0d16", 34)}</g>
      <g fill="none">${capa(CALZADAS, "#3a3548", 24)}</g>
      <g fill="none" opacity="0.45">${capa(CALZADAS, "#F0D97D", 2, 'stroke-dasharray="12 14"')}</g>
      ${rotonda(ROT_O)}${rotonda(ROT_E)}
      <g transform="translate(${ENTRADA_X},${PLANO_H - 34})">
        <rect x="-46" y="-16" width="26" height="22" fill="#e2d6c3" stroke="#14111c" stroke-width="2"/>
        <rect x="-42" y="-12" width="18" height="8" fill="#bfe2f5"/>
        <rect x="-20" y="-6" width="42" height="5" fill="#EA002A" stroke="#14111c" stroke-width="1"/>
      </g>
      ${farolas}
      ${arboles}
    </svg>`;
}

/**
 * Una PARCELA con su edificio, su cartel y su tooltip.
 *
 * `st` es el estado que decide el color, y sale del juego, no de la UI:
 *   { titulo, tip, free, boost, locked, off, mine }
 * `off` es "ya decidiste y esto gastaba el día"; `locked` es "hoy no se puede".
 * La diferencia importa: apagado sigue explicándose, bloqueado dice por qué no.
 */
export function plotHtml(def, st) {
  // El color del estado ya no pinta una parcela: pinta el CARTEL. Idle lleva el
  // acento del edificio, y los estados lo pisan en el orden en que importan.
  const tinta = st.locked ? "#332e42" : st.mine ? "var(--team-primary)" : st.boost ? "#D4AF37" : st.free ? "#38bdf8" : def.acento;
  const flags = [st.locked ? "data-locked" : "", st.off ? "data-off" : "", st.mine ? "data-mine" : ""].join(" ");
  // El BLOQUEADO se marca con un velo sobre la parcela entera, no con una cinta al
  // margen: es un estado del sitio ("hoy acá no se puede"), no una etiqueta del sitio.
  // Además así no pelea por el mismo píxel que el cartel del nombre.
  const cintas = [
    st.boost && !st.off && !st.locked ? `<div class="px-tag px-tag-gold absolute" style="top:-6px;right:14px;z-index:22">×2 hoy</div>` : "",
    st.mine ? `<div class="px-tag px-tag-mine absolute" style="top:-6px;left:14px;z-index:22">✓ elegida hoy</div>` : "",
    st.locked ? `<div class="absolute flex flex-col items-center justify-center gap-1.5" style="inset:0;z-index:22">
      ${pxIcon("candado", 24)}<span class="px-tag px-tag-off">No disponible</span></div>` : "",
  ].join("");

  return `<div class="px-plot" data-plot="${def.id}" ${flags}
      style="left:${def.cx - def.w / 2}px;top:${def.cy - def.h / 2}px;width:${def.w}px;height:${def.h + 54}px">
    <div class="px-tip" style="bottom:auto;top:-4px;transform:translate(-50%,-100%)">
      <div class="px font-bold" style="font-size:9px;color:${st.locked ? "#f87171" : "#F0D97D"}">${st.titulo}</div>
      <div class="px-body mt-1" style="font-size:12.5px;line-height:1.3;color:#d8d8de">${st.tip}</div>
    </div>
    <div style="position:relative;width:${def.w}px;height:${def.h}px">
      <div class="px-sprite">${SPRITES[def.id]()}</div>
      ${cintas}
    </div>
    <div class="px-sign" style="top:${def.h - 4}px;border-color:${tinta}">${st.titulo}</div>
    ${st.free ? `<div class="px-tag px-tag-free absolute" style="left:50%;transform:translateX(-50%);top:${def.h + 24}px">no gasta el día</div>` : ""}
  </div>`;
}
