/* ============================================================
   ui/screens/hub/complex — EL COMPLEJO: la ciudad deportiva
   isométrica donde se toma la Acción del Día.

   Adaptado del diseño "Hub Mundial 2026" (Claude Design). Todo el arte se DIBUJA,
   no se carga: cinco parcelas isométricas en SVG generadas con cuatro primitivas
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
     campo          → entrenar (los 5 focos)        · gasta el día · AL CENTRO
     residencia     → jornada de recuperación       · gasta el día
     video          → plan de partido (4 filosofías) · gasta el día
     asado          → jornada de integración        · gasta el día
     estacionamiento → todavía nada: es el escenario de los eventos especiales

   ── EL REPLANTEO DEL 10-AGO-2026 ─────────────────────────────────────────────
   Eran SEIS edificios en dos filas de tres, y dos de ellos —Enfermería y Sala de
   Scouting— no abrían una decisión: navegaban a la plantilla y al informe, que ya
   viven a un clic en la columna derecha. Un edificio que duplica un botón cuesta
   una parcela y no aporta ninguna elección, así que se fueron.

   Con cinco parcelas el plano cambia de gramática: CUATRO ESQUINAS Y UN CENTRO.
   El campo de entrenamiento pasa al medio (es la acción que más se toma y ahora
   se ve como el corazón del predio) y el resto ocupa las esquinas. El predio
   queda CERCADO por completo y se entra por un solo sitio: la valla roja del
   sureste, que desemboca en el estacionamiento — el micro llega de la calle y
   para ahí, sin cruzar el complejo.
   ============================================================ */
import { pxIcon } from "../../pixicons.js";

/* ── Primitivas isométricas ─────────────────────────────────────────────────── */

/** Proyecta un punto del mundo (x, y, z) al plano. Redondeado: el pixel manda. */
const P = (x, y, z) => `${Math.round((x - y) * 16)},${Math.round((x + y) * 8 - z * 9)}`;

/**
 * LA CAJA DEL SPRITE, y el dato que de ella se deriva: dónde cae el ORIGEN del
 * mundo isométrico dentro de la parcela. El SVG se centra en la caja de la parcela
 * (`.px-sprite` es un flex centrado), pero su viewBox no está centrado en el
 * origen: lo ancla arriba a la izquierda, así que el (0,0,0) del mundo queda
 * `oy - h/2` píxeles POR DEBAJO del centro de la parcela.
 *
 * Ese desfase es la razón de que una calle que apuntaba al borde de la caja
 * terminara colgando en el aire: la caja es el hitbox, no el suelo dibujado. Todo
 * punto del terreno de un edificio se mide desde acá.
 */
const SPRITE = { w: 260, h: 230, ox: 130, oy: 150 };
export const ORIGEN_DY = SPRITE.oy - SPRITE.h / 2;

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
      return `<svg width="${SPRITE.w}" height="${SPRITE.h}" viewBox="${-SPRITE.ox} ${-SPRITE.oy} ${SPRITE.w} ${SPRITE.h}"
        shape-rendering="crispEdges" style="overflow:visible;image-rendering:pixelated">${out.join("")}</svg>`;
    },
  };
  return api;
}

/* ── Las cinco parcelas ─────────────────────────────────────────────────────── */

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
    // La parcela mide 8×8 como la del estacionamiento, su espejo en el plano: los
    // dos brazos de la rotonda mueren en el vértice lateral de una y de otra, y si
    // los terrenos no fueran iguales el plano dejaría de ser simétrico.
    d.slab(-4, -4, 8, 8, "#4a6b3a");
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

  /**
   * ESTACIONAMIENTO — el asfalto, las plazas pintadas y EL MICRO del plantel.
   *
   * Es la única parcela que hoy no abre nada: existe como escenario. El micro es
   * el objeto que la hace legible de un vistazo (un asfalto vacío se lee como un
   * descampado), y es también lo que la conecta con la valla roja del cerco —
   * llega de la calle, entra por el portón y para acá.
   */
  estacionamiento() {
    const d = draw();
    d.slab(-4, -4, 8, 8, "#3a3548");
    // Las plazas: seis rayas cortas contra el fondo y la línea de tope.
    for (let k = 0; k <= 5; k++) {
      const x = -3.4 + k * 1.28;
      d.flat([P(x, -3.4, 0.02), P(x + 0.11, -3.4, 0.02), P(x + 0.11, -1.3, 0.02), P(x, -1.3, 0.02)], "#e8e4d8", null);
    }
    d.flat([P(-3.4, -1.32, 0.02), P(3.4, -1.32, 0.02), P(3.4, -1.21, 0.02), P(-3.4, -1.21, 0.02)], "#e8e4d8", null);

    // Dos autos ocupando plaza: dan escala al micro y dicen "esto es un playón".
    [[-3.2, "#EA002A"], [-0.6, "#7f8aa0"]].forEach(([x, col]) => {
      d.box(x, -3.1, 0, 1.05, 1.75, 0.32, col);
      d.box(x + 0.16, -2.72, 0.32, 0.72, 1.05, 0.3, shade(col, 1.25));
    });

    // EL MICRO, atravesado en la mitad de abajo. Las ruedas van aparte y la
    // carrocería arranca en z=0.28 para que se vean por debajo.
    d.box(-2.5, 1.15, 0, 0.55, 1.5, 0.28, "#14111c");
    d.box(1.4, 1.15, 0, 0.55, 1.5, 0.28, "#14111c");
    d.box(-3, 1, 0.28, 5.8, 1.8, 1.5, "#eef2f4");
    d.onL(-3, 2.8, 0.55, 5.8, 0.26, "#EA002A");          // la franja del costado
    d.gridL(-2.7, 2.8, 1, 6, 1, "#2b3a4d");              // la fila de ventanillas
    d.onR(2.8, 1.3, 0.95, 1.2, 0.62, "#bfe2f5");         // el parabrisas
    d.box(-3.05, 0.95, 1.78, 5.9, 1.9, 0.12, "#cfd8e4"); // el techo

    // La farola del playón, en la esquina que queda libre.
    d.box(3.1, -3.4, 0, 0.28, 0.28, 2.8, "#8f889f");
    d.box(2.85, -3.65, 2.8, 0.78, 0.78, 0.3, "#F0D97D");
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

/*
 * CUATRO ESQUINAS Y UN CENTRO. Las medidas no son libres: el cartel del nombre
 * cuelga 54px por debajo del rombo (de ahí el `+54` del test), la columna del HUD
 * arranca en x=1056 y abajo hay que dejar la calle exterior con su cerco. Lo que
 * queda es una caja de ~1010×610 donde estas cinco cajas entran sin tocarse.
 */
/*
 * `iso` es el semilado del terreno DIBUJADO (el `slab` del sprite), en unidades
 * isométricas. No es lo mismo que `w`/`h`, que son el hitbox: de `iso` sale dónde
 * están de verdad los vértices del rombo, y por lo tanto dónde tiene que morir la
 * calle. `entra` dice por cuál de ellos.
 */
export const PLOTS = [
  { id: "residencia", cx: 175, cy: 112, w: 300, h: 172, iso: 3.6, acento: "#38bdf8" },
  { id: "video", cx: 885, cy: 112, w: 300, h: 172, iso: 3.8, acento: "#D4AF37" },
  { id: "campo", cx: 530, cy: 233, w: 330, h: 188, iso: 4, acento: "#fbbf24" },
  { id: "asado", cx: 175, cy: 440, w: 300, h: 172, iso: 4, acento: "#fb923c", entra: "este" },
  { id: "estacionamiento", cx: 885, cy: 440, w: 300, h: 172, iso: 4, acento: "#cfd8e4", entra: "oeste" },
];

const byId = id => PLOTS.find(p => p.id === id);

/** Lo que mide el tooltip con su margen: por debajo de esto no cabe hacia arriba. */
const TIP_ALTO = 110;

/* ── LA RED DE CALLES ────────────────────────────────────────────────────────
   La red se DERIVA de las parcelas: cada calzada se cuelga del punto por donde se
   entra a un edificio, así que si una parcela se mueve la calle la sigue sola y no
   hay dos verdades.

   ── EL EJE, del 10-ago-2026 ──
   La versión anterior era una U: dos codos por los huecos laterales y una avenida
   por debajo de todo. Funcionaba, pero no tenía centro — se entraba por un costado
   y el predio se recorría de perfil.

   Ahora el plano tiene UN EJE Y UNA ROTONDA. Se entra por el portón de abajo al
   medio, se sube por la avenida hasta la rotonda de la fuente (a un tercio de
   altura) y de ahí salen tres brazos: uno sigue de frente al campo de
   entrenamiento, que subió a dos tercios para dejarle sitio, y uno a cada lado.
   Cada brazo lateral muere en su parcela de abajo entrando POR EL COSTADO (el
   vértice lateral del rombo, no la puerta: la calle llega de flanco y rodear para
   entrar por abajo sería dar una vuelta que nadie da) y ahí mismo vira hacia
   arriba, hasta la parcela del norte de su lado. Los dos brazos son espejo.

     eje       calle exterior → portón → rotonda → puerta del campo
     brazos    rotonda → costado de la parcela de abajo → viraje → parcela de arriba
     accesos   el ramal corto de la calzada a la puerta de las dos del norte
   ── */

/** El origen del mundo isométrico de una parcela: el centro de su terreno. */
const suelo = p => ({ x: p.cx, y: p.cy + ORIGEN_DY });

/**
 * POR DÓNDE SE ENTRA a una parcela: uno de los vértices de su rombo, calculado
 * desde el terreno dibujado (`iso`) y no desde el hitbox. En la proyección 2:1 el
 * vértice de abajo cae a `iso*16` del origen y el lateral a `iso*32`.
 *
 * Casi todas se entran por la puerta (el vértice de abajo); las dos de abajo por
 * su vértice LATERAL, que es donde las deja el brazo de la rotonda. Se exporta el
 * mapa entero (`ENTRADAS`) porque es el invariante que el test cuida: una parcela
 * cuya entrada no coincide con ningún vértice de ninguna calzada quedó aislada, y
 * eso en una captura parece que la calle "casi" llega.
 */
const acceso = p => {
  const o = suelo(p);
  return p.entra === "este" ? { x: o.x + Math.round(p.iso * 32), y: o.y }
    : p.entra === "oeste" ? { x: o.x - Math.round(p.iso * 32), y: o.y }
      : { x: o.x, y: o.y + Math.round(p.iso * 16) };
};

export const ENTRADAS = PLOTS.map(p => ({ id: p.id, ...acceso(p) }));

/* Cuánto por DEBAJO de la puerta pasa la calzada que recoge a las del norte. El
   cartel del nombre cuelga hasta ~18px por debajo de la caja: con menos que eso la
   calle se lo comería. */
const OFF_N = 58;
const Y_NORTE = acceso(byId("residencia")).y + OFF_N;

/* La rotonda va en el eje del campo y a la ALTURA DEL SUELO de las dos parcelas de
   abajo — no a la de sus cajas. Así los dos brazos salen horizontales y mueren
   justo en el vértice lateral de cada una, sobre la misma línea de tierra. */
const ROTONDA = { x: byId("campo").cx, y: suelo(byId("asado")).y };

/** La calle exterior y el portón: el único punto por donde se entra al predio. */
export const CALLE_Y = 658;
const CERCO = { x0: 20, x1: 1040, y0: 30, y1: 640 };
const PORTON = { x: ROTONDA.x, w: 62 };

/** Un brazo lateral: rotonda → costado de la parcela de abajo → viraje → la de arriba. */
const brazo = (abajo, arriba) => {
  const e = acceso(byId(abajo));
  return `M ${ROTONDA.x} ${ROTONDA.y} L ${e.x} ${e.y} L ${e.x} ${Y_NORTE} L ${byId(arriba).cx} ${Y_NORTE}`;
};

const EJE = `M ${PORTON.x} ${CALLE_Y} L ${ROTONDA.x} ${ROTONDA.y} L ${ROTONDA.x} ${acceso(byId("campo")).y}`;
export const CALZADAS = [EJE, brazo("asado", "residencia"), brazo("estacionamiento", "video")];

/**
 * El RAMAL DE ACCESO: de la calzada a la puerta. Solo lo necesitan las dos del
 * norte — a las otras tres la calzada les llega hasta la entrada misma.
 */
export const ACCESOS = ["residencia", "video"].map(id => {
  const f = acceso(byId(id));
  return `M ${f.x} ${Y_NORTE} L ${f.x} ${f.y}`;
});

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

/** Tramo de reja horizontal: dos travesaños y sus postes. */
function rejaH(x0, x1, y) {
  let postes = "";
  for (let x = x0; x <= x1; x += 30) postes += `<rect x="${x - 2}" y="${y - 26}" width="4" height="28" fill="#4a4458" stroke="#14111c" stroke-width="1"/>`;
  return `<g><rect x="${x0}" y="${y - 22}" width="${x1 - x0}" height="3" fill="#3a3548"/>
    <rect x="${x0}" y="${y - 11}" width="${x1 - x0}" height="3" fill="#3a3548"/>${postes}</g>`;
}

/**
 * Tramo de reja vertical, el de los laterales del predio. Es la misma reja vista
 * de canto: los travesaños corren en Y y los postes la cruzan. Sin esto el cerco
 * eran dos rayas sueltas arriba y abajo y el complejo no se leía cerrado.
 */
function rejaV(y0, y1, x) {
  let postes = "";
  for (let y = y0; y <= y1; y += 30) postes += `<rect x="${x - 6}" y="${y - 3}" width="12" height="5" fill="#4a4458" stroke="#14111c" stroke-width="1"/>`;
  return `<g><rect x="${x - 6}" y="${y0}" width="3" height="${y1 - y0}" fill="#3a3548"/>
    <rect x="${x + 3}" y="${y0}" width="3" height="${y1 - y0}" fill="#3a3548"/>${postes}</g>`;
}

/**
 * EL PORTÓN: la garita y la valla roja, lo único que interrumpe el cerco. Es el
 * punto por donde el micro entra al predio, así que se dibuja justo encima del
 * ramal que sube al estacionamiento — la barrera cruza la calle, no el pasto.
 */
const porton = (x, y) => {
  const tramos = [0, 1, 2, 3].map(k => `<rect x="${x - 30 + k * 16}" y="${y - 9}" width="16" height="7"
    fill="${k % 2 ? "#f4f4f0" : "#EA002A"}" stroke="#14111c" stroke-width="1"/>`).join("");
  return `<g>
    <rect x="${x - 66}" y="${y - 34}" width="30" height="34" fill="#e2d6c3" stroke="#14111c" stroke-width="2"/>
    <rect x="${x - 61}" y="${y - 28}" width="20" height="11" fill="#bfe2f5"/>
    <rect x="${x - 62}" y="${y - 38}" width="32" height="5" fill="#c9553d" stroke="#14111c" stroke-width="1"/>
    <rect x="${x - 36}" y="${y - 16}" width="7" height="16" fill="#8f889f" stroke="#14111c" stroke-width="1"/>
    ${tramos}
    <rect x="${x + 34}" y="${y - 20}" width="6" height="20" fill="#8f889f" stroke="#14111c" stroke-width="1"/>
  </g>`;
};

/**
 * LA CALLE EXTERIOR: la franja de asfalto del borde de abajo. No es decoración —
 * es lo que le da sentido al portón: el predio está cercado y el mundo sigue del
 * otro lado. Se dibuja a todo el ancho (1440) aunque el complejo viva en 1010,
 * para que la calle se lea como una calle y no como un rectángulo.
 */
const calleExterior = () => `<g>
  <rect x="0" y="${CALLE_Y - 15}" width="1440" height="30" fill="#2f2b3a" stroke="#14111c" stroke-width="2"/>
  <line x1="0" y1="${CALLE_Y}" x2="1440" y2="${CALLE_Y}" stroke="#F0D97D" stroke-width="2" stroke-dasharray="16 18" opacity=".45"/>
</g>`;

/**
 * LA PELOTA DE ARBUSTOS: el jardín del fondo del predio, recortado con la forma de
 * un balón. Ocupa el hueco de arriba al centro — entre las dos parcelas del norte y
 * por encima del campo, el único trozo de pasto grande que no cruza ninguna calzada.
 *
 * Reemplazó a una cancha auxiliar en miniatura (PO, 10-ago-2026): ahí arriba una
 * segunda cancha competía con la de verdad, que es justo la parcela de debajo. Un
 * cantero decorativo no compite con nada y dice lo mismo — esto es fútbol.
 *
 * Se dibuja aplastado 2:1 como todo lo que va pegado al suelo, así que los cinco
 * pentágonos se calculan en el círculo y se les hunde la Y a la mitad. Alrededor,
 * las matas del borde: son las que lo convierten en seto y no en un dibujo.
 */
const pentagono = (cx, cy, r, rot) => {
  const pts = [];
  for (let k = 0; k < 5; k++) {
    const a = rot + (k * Math.PI * 2) / 5;
    pts.push(`${(cx + r * Math.cos(a)).toFixed(1)},${(cy + r * Math.sin(a) * 0.5).toFixed(1)}`);
  }
  return pts.join(" ");
};

function pelotaArbustos(cx, cy, R) {
  const HOJA = "#3fa855", SOMBRA = "#25733a", CUERO = "#173d22";
  const anillo = (a, r, s) => `<ellipse cx="${(cx + r * Math.cos(a)).toFixed(1)}" cy="${(cy + r * Math.sin(a) * 0.5).toFixed(1)}"
    rx="${s}" ry="${(s * 0.62).toFixed(1)}" fill="${HOJA}" stroke="#14111c" stroke-width="1"/>`;

  let matas = "";
  for (let k = 0; k < 24; k++) matas += anillo((k * Math.PI * 2) / 24, R, k % 2 ? 10 : 12);

  // Los cinco de fuera van HOLGADOS respecto al seto del borde: pegados, el balón
  // se lee como una mancha y no como una pelota.
  let cuero = `<polygon points="${pentagono(cx, cy, R * 0.27, -Math.PI / 2)}" fill="${CUERO}"/>`;
  for (let k = 0; k < 5; k++) {
    const a = -Math.PI / 2 + (k * Math.PI * 2) / 5;
    cuero += `<polygon points="${pentagono(cx + R * 0.57 * Math.cos(a), cy + R * 0.57 * Math.sin(a) * 0.5, R * 0.2, a)}"
      fill="${CUERO}"/>`;
  }

  return `<g>
    <ellipse cx="${cx}" cy="${cy + 7}" rx="${R + 4}" ry="${R * 0.5 + 4}" fill="#0a3318" opacity=".45"/>
    <ellipse cx="${cx}" cy="${cy}" rx="${R}" ry="${R * 0.5}" fill="${SOMBRA}" stroke="#14111c" stroke-width="2"/>
    <ellipse cx="${cx}" cy="${cy - 3}" rx="${R - 8}" ry="${R * 0.5 - 6}" fill="${HOJA}"/>
    ${cuero}
    ${matas}
  </g>`;
}

/**
 * LA FUENTE: el remate del eje de entrada. Es lo primero que se ve al entrar por
 * el portón y lo único que hay en el medio del predio, así que se dibuja grande —
 * pretil de piedra, dos láminas de agua, el plato y el chorro.
 */
const fuente = (x, y) => `<g>
  <ellipse cx="${x}" cy="${y + 4}" rx="41" ry="19" fill="#0a3318" opacity=".4"/>
  <ellipse cx="${x}" cy="${y}" rx="40" ry="19" fill="#a8a2b4" stroke="#14111c" stroke-width="2"/>
  <ellipse cx="${x}" cy="${y - 2}" rx="32" ry="14" fill="#2f6f96" stroke="#14111c" stroke-width="1"/>
  <ellipse cx="${x}" cy="${y - 3}" rx="21" ry="8" fill="#5ba3cc"/>
  <rect x="${x - 5}" y="${y - 22}" width="10" height="19" fill="#cfd8e4" stroke="#14111c" stroke-width="1"/>
  <ellipse cx="${x}" cy="${y - 23}" rx="14" ry="6" fill="#cfd8e4" stroke="#14111c" stroke-width="1"/>
  <rect x="${x - 2}" y="${y - 38}" width="4" height="15" fill="#bfe2f5"/>
  <ellipse cx="${x}" cy="${y - 39}" rx="7" ry="3" fill="#e8f4fb"/>
  <rect x="${x - 11}" y="${y - 32}" width="3" height="7" fill="#bfe2f5" opacity=".8"/>
  <rect x="${x + 8}" y="${y - 32}" width="3" height="7" fill="#bfe2f5" opacity=".8"/>
</g>`;

/**
 * Rotonda: la calzada anular y su isleta con la fuente. Es el corazón del plano —
 * el eje de entrada muere acá y de acá salen los tres brazos.
 */
const rotonda = ({ x, y }) => `<g>
  <ellipse cx="${x}" cy="${y}" rx="58" ry="32" fill="none" stroke="#0f0d16" stroke-width="34"/>
  <ellipse cx="${x}" cy="${y}" rx="58" ry="32" fill="none" stroke="#3a3548" stroke-width="24"/>
  <ellipse cx="${x}" cy="${y}" rx="58" ry="32" fill="none" stroke="#F0D97D" stroke-width="2" stroke-dasharray="10 12" opacity=".40"/>
  <ellipse cx="${x}" cy="${y}" rx="46" ry="20" fill="#1e7a3a" stroke="#114d25" stroke-width="2"/>
  ${fuente(x, y + 2)}
</g>`;

/** La EXPLANADA: el pavimento donde la calzada muere contra la entrada. */
const explanada = p => {
  const f = acceso(p);
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

  // EL PLANO ES SIMÉTRICO, así que la arboleda también: cada árbol de la izquierda
  // tiene su espejo en `1060 - x`. Los pares de abajo flanquean la avenida de
  // entrada y la convierten en un bulevar — es lo que sostiene el medio del predio
  // ahora que el campo subió y ahí abajo solo quedan la calle y la fuente.
  const espejo = filas => filas.flatMap(([x, y, s]) => x === 530 ? [[x, y, s]] : [[x, y, s], [1060 - x, y, s]]);
  const arboles = espejo([
    [408, 84, 0.8], [352, 168], [300, 250], [72, 250], [128, 322], [262, 330],
    [404, 372], [70, 570], [232, 566],
    [408, 492], [462, 566], [408, 620],
  ]).map(t => arbol(t[0], t[1], t[2])).join("");

  // Las farolas alumbran lo que se recorre: el bulevar de entrada (con el brazo de
  // la luz mirando a la calzada) y los dos virajes de los brazos laterales.
  const farolas = [[496, 500], [496, 590], [341, 330], [711, 330], [560, 400]]
    .map(f => farola(f[0], f[1])).join("");

  return `
    <div class="absolute inset-0" style="background:repeating-linear-gradient(90deg,#0f4423 0 32px,#0d3d1e 32px 64px)"></div>
    <div class="absolute" style="left:-140px;top:-60px;width:1520px;height:820px;background:#114d25;clip-path:polygon(50% 0,100% 50%,50% 100%,0 50%)">
      <div class="absolute" style="inset:3px;background:repeating-linear-gradient(90deg,#1e7a3a 0 32px,#1b7035 32px 64px);clip-path:polygon(50% 0,100% 50%,50% 100%,0 50%)"></div>
    </div>
    <svg viewBox="0 0 1440 ${PLANO_H}" width="1440" height="${PLANO_H}" shape-rendering="crispEdges"
      class="absolute" style="left:0;bottom:0;image-rendering:pixelated">
      ${calleExterior()}
      ${pelotaArbustos(byId("campo").cx, 88, 74)}
      ${PLOTS.map(explanada).join("")}
      <g fill="none">${capa(ACCESOS, "#0f0d16", 26)}</g>
      <g fill="none">${capa(ACCESOS, "#4a4558", 18)}</g>
      <g fill="none">${capa(CALZADAS, "#0f0d16", 34)}</g>
      <g fill="none">${capa(CALZADAS, "#3a3548", 24)}</g>
      <g fill="none" opacity="0.45">${capa(CALZADAS, "#F0D97D", 2, 'stroke-dasharray="12 14"')}</g>
      ${rotonda(ROTONDA)}
      ${rejaH(CERCO.x0, CERCO.x1, CERCO.y0)}
      ${rejaH(CERCO.x0, PORTON.x - PORTON.w / 2, CERCO.y1)}
      ${rejaH(PORTON.x + PORTON.w / 2, CERCO.x1, CERCO.y1)}
      ${rejaV(CERCO.y0, CERCO.y1, CERCO.x0)}
      ${rejaV(CERCO.y0, CERCO.y1, CERCO.x1)}
      ${porton(PORTON.x, CERCO.y1)}
      ${farolas}
      ${arboles}
    </svg>`;
}

/**
 * Una PARCELA con su edificio, su cartel y su tooltip.
 *
 * `st` es el estado que decide el color, y sale del juego, no de la UI:
 *   { titulo, tip, free, boost, locked, off, mine, inerte }
 * `off` es "ya decidiste y esto gastaba el día"; `locked` es "hoy no se puede".
 * La diferencia importa: apagado sigue explicándose, bloqueado dice por qué no.
 *
 * `inerte` es un cuarto estado y no se parece a ninguno: la parcela no ofrece
 * NADA que decidir (hoy, solo el estacionamiento). No se apaga ni se bloquea —
 * las dos cosas dirían "acá había algo y no lo podés usar" — se queda encendida,
 * con su tooltip, pero sin levitar al pasarle el mouse ni cambiar el cursor.
 */
export function plotHtml(def, st) {
  // El color del estado ya no pinta una parcela: pinta el CARTEL. Idle lleva el
  // acento del edificio, y los estados lo pisan en el orden en que importan.
  const tinta = st.locked ? "#332e42" : st.mine ? "var(--team-primary)" : st.boost ? "#D4AF37" : st.free ? "#38bdf8" : def.acento;
  const flags = [st.locked ? "data-locked" : "", st.off ? "data-off" : "",
    st.mine ? "data-mine" : "", st.inerte ? "data-inerte" : ""].join(" ");
  // El BLOQUEADO se marca con un velo sobre la parcela entera, no con una cinta al
  // margen: es un estado del sitio ("hoy acá no se puede"), no una etiqueta del sitio.
  // Además así no pelea por el mismo píxel que el cartel del nombre.
  const cintas = [
    st.boost && !st.off && !st.locked ? `<div class="px-tag px-tag-gold absolute" style="top:-6px;right:14px;z-index:22">×2 hoy</div>` : "",
    st.mine ? `<div class="px-tag px-tag-mine absolute" style="top:-6px;left:14px;z-index:22">✓ elegida hoy</div>` : "",
    st.locked ? `<div class="absolute flex flex-col items-center justify-center gap-1.5" style="inset:0;z-index:22">
      ${pxIcon("candado", 24)}<span class="px-tag px-tag-off">No disponible</span></div>` : "",
  ].join("");

  // EL GLOBO SE VOLTEA cuando el edificio está pegado al borde de arriba. La franja
  // del complejo recorta lo que se salga, así que el tooltip de las parcelas del
  // norte quedaba cortado contra el marco (bug PO, 10-ago-2026) — y no es un
  // problema de z-index: lo que se sale, se sale. El umbral es el alto que necesita
  // el globo (unos 105px con su margen); por debajo de eso, cae hacia abajo.
  const arriba = def.cy - def.h / 2 >= TIP_ALTO;
  const tipPos = arriba
    ? "bottom:auto;top:-4px;transform:translate(-50%,-100%)"
    : `bottom:auto;top:${def.h + 62}px;transform:translateX(-50%)`;

  return `<div class="px-plot" data-plot="${def.id}" ${flags}
      style="left:${def.cx - def.w / 2}px;top:${def.cy - def.h / 2}px;width:${def.w}px;height:${def.h + 54}px">
    <div class="px-tip" ${arriba ? "" : "data-abajo"} style="${tipPos}">
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
