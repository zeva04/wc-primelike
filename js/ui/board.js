/* ============================================================
   ui/board — LA PIZARRA TÁCTICA: el árbol de rasgos dibujado
   sobre una cancha, como el DT que raya el pizarrón del
   vestuario.

   Reglas del lenguaje visual (las 4 decisiones del sprint):
   1. COLOR = el del principio FIRMA de la filosofía (press rojo ·
      posesión azul · contra ámbar · bloque púrpura). El color de
      principio se reserva para UNA cosa más: anotar un requisito
      de principio AJENO — el color pasa a ser información, no
      decoración.
   2. El marcador solo pinta lo CONQUISTADO y lo DISPONIBLE; lo
      bloqueado queda en tiza gris. La pizarra se va llenando de
      color a medida que la idea crece.
   3. Plana (sin perspectiva) y manuscrita SOLO en anotaciones:
      nombres de rasgos y requisitos siempre en sans.
   4. Nada se borra: los 5 principios viven en la franja de
      cabecera y los counters + el fútbol superior en las notas
      del DT, que se abren desde la chincheta.

   El ataque va de IZQUIERDA a DERECHA: los básicos nacen en
   campo propio, los avanzados cruzan la mitad y el Master se
   firma cerca del área rival.

   Módulo puro: recibe el árbol ya resuelto (game/traits.traitTree)
   y devuelve SVG. No lee estado ni toca el DOM.
   ============================================================ */
import { PHILOSOPHIES, FILO_LEVELS, filoLevelOf, filoPointsOf } from "../content/identity/philosophies.js";

/* ---------- Geometría (viewBox 1200×700) ---------- */
/* Con 19 rasgos el tablero se satura, así que el espacio está peleado: los 5 principios
   viven en una FRANJA horizontal de cabecera (no en una columna lateral) y las notas del
   DT en una chincheta que las abre en el riel. El aire que eso libera se invierte en
   SEPARAR los nodos, nunca en agrandarlos — lo que satura no es el tamaño de cada rasgo,
   es la cercanía entre ramas. */
const VB = { w: 1200, h: 700 };
const PITCH = { x: 40, y: 78, w: 1120, h: 588 };
const RIGHT = PITCH.x + PITCH.w;         // línea de fondo rival
const MIDX = PITCH.x + PITCH.w / 2;
const MIDY = PITCH.y + PITCH.h / 2;      // 372
// La GRILLA de las filosofías todavía sin rediseñar, reencuadrada sobre la cancha nueva.
const LANE_Y = { firma: 190, respuesta: 390, expansion: 590 };
const COL_X = [230, 520, 810];           // básico · intermedio · avanzado
const TIERS = ["basic", "intermediate", "advanced"];
const MASTER = { x: 1050, y: 390, r: 44 };
const R = 30;                            // radio de nodo normal

// La línea base de la cabecera: los 5 principios ocupan la franja de la izquierda y
// los PI se anotan a la derecha. Tiene que quedar POR ENCIMA de la línea de cal
// (PITCH.y = 78) o se funde con el borde de la cancha.
const HEAD_Y = 30;
const BOARD_BG = "#0e2e1f";              // el verde del pizarrón (para tapar líneas bajo los nodos)
const CHALK = "#dff0e5";                 // tiza blanca

/** Color de marcador por principio. El de la filosofía es el de su arista FIRMA. */
export const PRINCIPLE_COLORS = {
  presion: "#ef4444",       // rojo
  elaboracion: "#38bdf8",   // azul
  verticalidad: "#fbbf24",  // ámbar
  solidez: "#a3e635",       // lima
  directo: "#c084fc",       // púrpura
};
export const markerColor = (f) => PRINCIPLE_COLORS[f.firma] || CHALK;

export const TIER_LABEL = { basic: "básico", intermediate: "intermedio", advanced: "avanzado", master: "master" };

/* ---------- Helpers de dibujo ---------- */

const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

/** Parte un nombre en 2 líneas como máximo, para la etiqueta bajo el nodo. */
function wrap(s, max = 15) {
  const out = [];
  let cur = "";
  for (const w of s.split(" ")) {
    if (cur && (cur + " " + w).length > max) { out.push(cur); cur = w; }
    else cur = cur ? cur + " " + w : w;
  }
  if (cur) out.push(cur);
  return out.length > 2 ? [out[0], out.slice(1).join(" ")] : out;
}

/**
 * Flecha táctica curva entre dos nodos: arranca y termina en el BORDE de cada
 * círculo (no en el centro) y se comba con `bend` — la curvatura es lo que la
 * separa de la línea recta de un árbol RPG.
 */
function arrow(a, b, bend, color, on) {
  const dx = b.x - a.x, dy = b.y - a.y, len = Math.hypot(dx, dy) || 1;
  const ux = dx / len, uy = dy / len;
  const s = { x: a.x + ux * (a.r + 8), y: a.y + uy * (a.r + 8) };
  const e = { x: b.x - ux * (b.r + 15), y: b.y - uy * (b.r + 15) };
  const cx = (s.x + e.x) / 2 - uy * bend, cy = (s.y + e.y) / 2 + ux * bend;
  const stroke = on ? color : "#7fa892";
  return `<path d="M${s.x.toFixed(1)} ${s.y.toFixed(1)} Q${cx.toFixed(1)} ${cy.toFixed(1)} ${e.x.toFixed(1)} ${e.y.toFixed(1)}"
    fill="none" stroke="${stroke}" stroke-width="${on ? 3 : 2}" stroke-linecap="round"
    stroke-dasharray="${on ? "11 7" : "5 9"}" opacity="${on ? 0.9 : 0.35}"
    marker-end="url(#${on ? "ah-on" : "ah-off"})"/>`;
}

/* LA FORMA DICE LA RAMA: se eliminaron las etiquetas "Firma /
   Respuesta / Expansión" de la cancha — la silueta del nodo lo revela, y el
   nombre de la rama solo aparece en el riel al enfocarlo.
     ○ círculo   Firma      — el jugador, tu marca propia
     ▢ cuadrado  Respuesta  — el bloque, la zona, lo que se planta
     △ triángulo Expansión  — el cono, la punta que abre el campo
     ★ estrella  Master
   Y EL TRAZO DICE LA PROFUNDIDAD: el marcador engorda por tier, como si el DT
   hubiera repasado la línea. */
const SHAPE_BY_RAMA = { firma: "circle", respuesta: "square", expansion: "triangle", master: "star" };
const TIER_STROKE = { basic: 2.1, intermediate: 3.1, advanced: 4.2, master: 4.4 };
// Desplazamientos propios de cada silueta: dónde cae el ícono y dónde el sello ✓.
const SHAPE_TUNE = {
  circle: { icon: 9, badge: [0.72, -0.72] },
  square: { icon: 9, badge: [0.86, -0.86] },
  triangle: { icon: 14, badge: [0.74, -0.20] },
  star: { icon: 11, badge: [0.60, -0.60] },
};

/** Emite la silueta pedida como un elemento SVG con los atributos dados. */
function shapeEl(kind, x, y, r, attrs) {
  if (kind === "circle") return `<circle cx="${x}" cy="${y}" r="${r}" ${attrs}/>`;
  if (kind === "square") {
    const s = r * 0.88;
    return `<rect x="${(x - s).toFixed(1)}" y="${(y - s).toFixed(1)}" width="${(s * 2).toFixed(1)}" height="${(s * 2).toFixed(1)}" rx="5" ${attrs}/>`;
  }
  if (kind === "star") return `<path d="${starPath(x, y, r, r * 0.62)}" stroke-linejoin="round" ${attrs}/>`;
  // Triángulo equilátero apuntando arriba, bajado un pelo para centrar su masa.
  // El circunradio va holgado (1.34) porque el inradio —lo que de verdad encierra
  // al ícono— es la MITAD: con 1.16 el emoji se salía por los lados de la base.
  const R = r * 1.34, dy = y + r * 0.18;
  const p = [-90, 30, 150].map(a => {
    const rad = (a * Math.PI) / 180;
    return `${(x + Math.cos(rad) * R).toFixed(1)} ${(dy + Math.sin(rad) * R).toFixed(1)}`;
  });
  return `<path d="M${p[0]} L${p[1]} L${p[2]} Z" stroke-linejoin="round" ${attrs}/>`;
}

/** Un nodo del árbol: silueta que tapa las líneas de cancha + trazo según estado + ícono + nombre. */
function node(t, x, y, r, color, isMaster, selected) {
  const st = t.owned ? "owned" : t.buyable ? "open" : "lock";
  const kind = SHAPE_BY_RAMA[t.rama] || "circle";
  const tune = SHAPE_TUNE[kind];
  const ink = isMaster && t.owned ? "#fbbf24" : color;
  const ring = st === "lock" ? "#8fae9c" : ink;
  const nameFill = st === "lock" ? "#8fae9c" : st === "owned" ? CHALK : ink;
  const sw = (TIER_STROKE[t.tier] || 2.1) + (t.owned ? 1 : 0);
  const lines = wrap(t.nombre, isMaster ? 18 : 15);
  const [bx, by] = tune.badge;

  return `<g class="tb-node tb-${st}${selected ? " tb-sel" : ""}" data-node="${t.id}" style="cursor:pointer">
    <circle cx="${x}" cy="${y}" r="${r + 16}" fill="transparent"/>
    ${st === "open" ? shapeEl(kind, x, y, r + 6, `class="tb-pulse" fill="none" stroke="${ink}" stroke-width="2" opacity=".55"`) : ""}
    ${shapeEl(kind, x, y, r, `fill="${BOARD_BG}" opacity=".96"`)}
    ${st === "owned" ? shapeEl(kind, x, y, r, `fill="${ink}" opacity=".2"`) : ""}
    ${shapeEl(kind, x, y, r, `fill="none" stroke="${ring}" stroke-width="${sw}"
      opacity="${st === "lock" ? 0.5 : 0.95}" ${st === "lock" ? 'stroke-dasharray="4 6"' : ""}`)}
    ${st === "owned" ? shapeEl(kind, x, y, r - 7, `fill="none" stroke="${ink}" stroke-width="1.2" opacity=".5"`) : ""}
    <text x="${x}" y="${y + tune.icon}" text-anchor="middle" font-size="${isMaster ? 30 : 26}"
      opacity="${st === "lock" ? 0.42 : 1}">${t.icon}</text>
    ${lines.map((l, i) => `<text x="${x}" y="${y + r + 20 + i * 14}" text-anchor="middle" font-size="${isMaster ? 13 : 11.5}"
      font-weight="700" fill="${nameFill}" opacity="${st === "lock" ? 0.75 : 1}">${esc(l)}</text>`).join("")}
    ${t.owned ? `<g><circle cx="${x + r * bx}" cy="${y + r * by}" r="9" fill="${BOARD_BG}"/>
      <circle cx="${x + r * bx}" cy="${y + r * by}" r="9" fill="none" stroke="${ink}" stroke-width="1.6"/>
      <text x="${x + r * bx}" y="${y + r * by + 4}" text-anchor="middle" font-size="11" font-weight="900" fill="${ink}">✓</text></g>` : ""}
  </g>`;
}

/** Estrella de 5 puntas (solo decora el Master consagrado). */
function starPath(cx, cy, ro, ri) {
  let d = "";
  for (let i = 0; i < 10; i++) {
    const a = (Math.PI / 5) * i - Math.PI / 2;
    const rad = i % 2 ? ri : ro;
    d += `${i ? "L" : "M"}${(cx + Math.cos(a) * rad).toFixed(1)} ${(cy + Math.sin(a) * rad).toFixed(1)} `;
  }
  return d + "Z";
}

/** Marca ambiente: la X del rival, el círculo del compañero. Puro decorado de pizarrón. */
function ambient(m) {
  const o = 0.22;
  if (m.t === "x") return `<g opacity="${o}" stroke="${CHALK}" stroke-width="2.4" stroke-linecap="round">
    <line x1="${m.x - 9}" y1="${m.y - 9}" x2="${m.x + 9}" y2="${m.y + 9}"/>
    <line x1="${m.x + 9}" y1="${m.y - 9}" x2="${m.x - 9}" y2="${m.y + 9}"/></g>`;
  return `<circle cx="${m.x}" cy="${m.y}" r="9" fill="none" stroke="${CHALK}" stroke-width="2.2" opacity="${o}"/>`;
}

const AMBIENT = [
  { t: "x", x: 500, y: 95 }, { t: "x", x: 740, y: 95 }, { t: "o", x: 300, y: 100 },
  { t: "x", x: 500, y: 260 }, { t: "o", x: 740, y: 260 }, { t: "x", x: 990, y: 250 },
  { t: "x", x: 500, y: 440 }, { t: "o", x: 745, y: 445 }, { t: "x", x: 985, y: 452 },
  { t: "x", x: 500, y: 580 }, { t: "x", x: 745, y: 580 }, { t: "o", x: 300, y: 575 },
  { t: "x", x: 1120, y: 350 },
];

/* ---------- La cancha (tiza sobre pizarrón) ---------- */
function pitchLines() {
  const l = (x1, y1, x2, y2) => `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}"/>`;
  const boxH = 326, boxW = 150, gaH = 148, gaW = 52;
  const boxY = MIDY - boxH / 2 + 25, gaY = MIDY - gaH / 2 + 25;
  return `<g fill="none" stroke="${CHALK}" stroke-width="2.2" opacity=".3" stroke-linecap="round" filter="url(#chalk)">
    <rect x="${PITCH.x}" y="${PITCH.y}" width="${PITCH.w}" height="${PITCH.h}" rx="3"/>
    ${l(MIDX, PITCH.y, MIDX, PITCH.y + PITCH.h)}
    <circle cx="${MIDX}" cy="${MIDY + 25}" r="72"/>
    <circle cx="${MIDX}" cy="${MIDY + 25}" r="3.5" fill="${CHALK}" stroke="none"/>
    <rect x="${PITCH.x}" y="${boxY}" width="${boxW}" height="${boxH}"/>
    <rect x="${PITCH.x}" y="${gaY}" width="${gaW}" height="${gaH}"/>
    <rect x="${RIGHT - boxW}" y="${boxY}" width="${boxW}" height="${boxH}"/>
    <rect x="${RIGHT - gaW}" y="${gaY}" width="${gaW}" height="${gaH}"/>
    <circle cx="${RIGHT - 100}" cy="350" r="3.5" fill="${CHALK}" stroke="none"/>
    <path d="M${PITCH.x + 150} 300 A 46 46 0 0 0 ${PITCH.x + 150} 400"/>
    <path d="M${RIGHT - 150} 300 A 46 46 0 0 1 ${RIGHT - 150} 400"/>
    <rect x="${PITCH.x - 16}" y="315" width="16" height="70"/>
    <rect x="${RIGHT}" y="315" width="16" height="70"/>
    <path d="M${PITCH.x} ${PITCH.y + 16} A 16 16 0 0 0 ${PITCH.x + 16} ${PITCH.y}"/>
    <path d="M${RIGHT - 16} ${PITCH.y} A 16 16 0 0 0 ${RIGHT} ${PITCH.y + 16}"/>
    <path d="M${PITCH.x} ${PITCH.y + PITCH.h - 16} A 16 16 0 0 1 ${PITCH.x + 16} ${PITCH.y + PITCH.h}"/>
    <path d="M${RIGHT - 16} ${PITCH.y + PITCH.h} A 16 16 0 0 1 ${RIGHT} ${PITCH.y + PITCH.h - 16}"/>
  </g>`;
}

/* ---------- LOS 5 PRINCIPIOS, en franja de cabecera ----------
   Cinco fichas apaisadas sobre la línea de cal, cada una con icono + valor + una barra
   corta. La barra es chica (46px) y se pierde lectura fina del progreso: con 19 rasgos el
   espacio de cancha vale más que la precisión de una barra que igual se lee mejor en el
   número de al lado. */
// Paso y arranque: la franja va CENTRADA en el pizarrón desde que los Puntos de
// Identidad viven en el HUD: sin ese saldo escrito en tiza a la derecha, apoyar las
// cuatro fichas en el borde izquierdo dejaba la esquina vacía y la cabecera descolgada.
const CHIP_W = 190;          // paso entre fichas
const CHIP_X = 230;          // dónde arranca la franja
function principlesBand(run, f) {
  return `<g>${PHILOSOPHIES.map((p, i) => {
    const x = CHIP_X + i * CHIP_W;
    const lvl = filoLevelOf(run, p.id);
    const xp = filoPointsOf(run, p.id);
    const piso = FILO_LEVELS[lvl].min, techo = FILO_LEVELS[lvl + 1]?.min ?? null;
    const pct = techo ? Math.min(100, (100 * (xp - piso)) / (techo - piso)) : 100;
    const mine = p.id === f.id;
    const col = markerColor(p);
    return `<g class="tb-filo" data-filo="${p.id}" style="cursor:pointer">
      <rect x="${x - 6}" y="${HEAD_Y - 16}" width="${CHIP_W - 8}" height="34" rx="5" fill="${mine ? col : "#000"}" opacity="${mine ? 0.14 : 0.001}"/>
      <text x="${x}" y="${HEAD_Y}" font-size="15">${p.icon}</text>
      <text x="${x + 21}" y="${HEAD_Y}" font-size="11.5" font-weight="${mine ? 800 : 600}"
        fill="${mine ? col : "#8fae9c"}" opacity="${mine ? 1 : 0.75}">${p.name}</text>
      <text x="${x + 21}" y="${HEAD_Y + 16}" font-size="13" font-weight="900"
        fill="${mine ? col : CHALK}">${lvl + 1}</text>
      <rect x="${x + 36}" y="${HEAD_Y + 8}" width="46" height="4" rx="2" fill="#000" opacity=".35"/>
      <rect x="${x + 36}" y="${HEAD_Y + 8}" width="${(46 * pct) / 100}" height="4" rx="2"
        fill="${mine ? col : "#8fae9c"}" opacity="${mine ? 0.95 : 0.5}"/>
      ${p.id === run.filoInicial ? `<text x="${x + 90}" y="${HEAD_Y + 13}" font-size="8.5" font-weight="900"
        fill="${col}" letter-spacing="1.2" opacity=".85">ESCUELA</text>` : ""}
    </g>`;
  }).join("")}</g>`;
}

/* Los PUNTOS DE IDENTIDAD se anotaban acá con tiza, en la esquina superior derecha.
   Salieron del pizarrón en el sprint de UX: el saldo ya vive en la placa
   dorada del HUD, y tenerlo en los dos lados era la misma cifra con dos fuentes. */

/* ---------- EL POST-IT: las notas del DT ----------
   Ya no es una franja de texto al pie: es un papel pegado al pizarrón, al pie de
   la columna de principios. Se comporta como un nodo más (se toca, la cámara le
   hace zoom y queda CENTRADO). Su letra es diminuta a escala 1 — se lee recién
   con el zoom, que es exactamente lo que hace un papel garabateado en una
   pizarra: está ahí, y te acercas cuando lo quieres leer. */
/* ---------- LA CHINCHETA: las notas del DT ----------
   Era un papel de 164×174 clavado al pie de la columna izquierda — bonito, pero
   con 19 rasgos ese cuarto de tablero hace falta para el árbol. Ahora es una
   chincheta de 34px en la esquina, y lo que decía se lee en EL RIEL, el mismo
   panel donde ya se leen las fichas de rasgos. El papel sigue estando: es el gesto de
   "hay una nota acá", no el texto desplegado permanentemente. */
const NOTES = { x: 74, y: 604, r: 21 };
export const NOTES_ID = "__notes";

/** El texto de las notas, en bloques {tono, txt} — lo pinta la pantalla en el riel. */
export function notesBlocks(f, adv, deep, deepOwned, etapa) {
  return [
    { tone: "ok", txt: `Brillas ${f.counters.brilla}.` },
    { tone: "warn", txt: `Lo tuyo se paga: ${f.counters.sufre}.` },
    { tone: "info", txt: etapa >= 1
      ? `${adv.icon} ${adv.name}: tu fútbol superior ya sale en el partido${deepOwned ? `, y ${deep.nombre} lo profundiza.` : `. Lo profundiza ${deep.nombre}, acá en la pizarra.`}`
      : `${adv.icon} ${adv.name}: tu fútbol superior se conquista al llegar a En desarrollo (4 pts).` },
  ];
}

function postIt(selected) {
  const { x, y, r } = NOTES;
  return `<g class="tb-node tb-note${selected ? " tb-sel" : ""}" data-node="${NOTES_ID}" style="cursor:pointer">
    <circle cx="${x}" cy="${y}" r="${r + 14}" fill="transparent"/>
    <rect x="${x - r}" y="${y - r}" width="${r * 2}" height="${r * 2}" rx="3"
      transform="rotate(-6 ${x} ${y})" fill="#f6de84" stroke="#d9c069" stroke-width="1.5"/>
    <text x="${x}" y="${y + 7}" text-anchor="middle" font-size="19">📌</text>
    <text x="${x + r + 10}" y="${y + 5}" class="tb-hand" font-size="15" fill="${CHALK}" opacity=".55">Notas del DT</text>
  </g>`;
}

/* ---------- El ensamblaje ---------- */

/**
 * Dibuja la pizarra completa. `tree` es la salida de game/traits.traitTree
 * (rasgos con owned/buyable/faltas). `selected` resalta un nodo.
 */
export function tacticBoard(run, f, tree, { adv, deep, deepOwned, etapa, selected } = {}) {
  const color = markerColor(f);
  const master = tree.find(t => t.tier === "master");
  const placed = tree.map(t => ({ t, ...layoutOf(tree, t.id) }));
  const graph = isGraph(tree);

  let arrows, nodes;

  if (graph) {
    // MODO GRAFO (rediseño de Press): cada rasgo trae su posición en la cancha y
    // sus padres salen de los propios requisitos — el árbol puede bifurcarse
    // cuantas veces quiera sin tocar geometría acá.
    const byId = Object.fromEntries(placed.map(n => [n.t.id, n]));
    arrows = placed.flatMap(n => parentsOf(n.t).map(pid => {
      const p = byId[pid];
      if (!p) return "";
      // La comba sigue el desvío vertical: los tramos rectos apenas se curvan y
      // las bifurcaciones se abren en abanico, como el trazo de un DT.
      const bend = Math.abs(n.y - p.y) < 12 ? 26 : (n.y > p.y ? 34 : -34);
      return arrow(p, n, bend, color, p.t.owned);
    })).join("");
    nodes = placed.map(n => node(n.t, n.x, n.y, n.r, color, n.t.tier === "master", selected === n.t.id)).join("");
  } else {
    // MODO GRILLA (las 3 filosofías todavía sin rediseñar): 3 carriles que avanzan
    // básico → intermedio → avanzado y convergen en el Master del área rival.
    const lanes = ["firma", "respuesta", "expansion"].map(rama => ({
      rama, nodes: placed.filter(n => n.t.rama === rama && n.t.tier !== "master")
        .sort((a, b) => a.x - b.x),
    }));
    const BEND = { firma: [-38, 34], respuesta: [30, -28], expansion: [40, -36] };
    const CONV = { firma: -52, respuesta: 18, expansion: 52 };

    arrows = lanes.flatMap(ln => {
      const out = [];
      for (let i = 0; i < ln.nodes.length - 1; i++)
        out.push(arrow(ln.nodes[i], ln.nodes[i + 1], BEND[ln.rama][i] ?? 30, color, ln.nodes[i].t.owned));
      const last = ln.nodes[ln.nodes.length - 1];
      if (master && last) out.push(arrow(last, { ...MASTER }, CONV[ln.rama], color, last.t.owned));
      return out;
    }).join("");

    nodes = lanes.flatMap(ln => ln.nodes.map(n => node(n.t, n.x, n.y, n.r, color, false, selected === n.t.id))).join("")
      + (master ? node(master, MASTER.x, MASTER.y, MASTER.r, color, true, selected === master.id) : "");
  }

  // El tablero manda por ALTO: en una pantalla fija sin scroll, el
  // alto es el recurso escaso — el SVG lo llena y deriva su ancho del viewBox.
  return `<svg id="tb-svg" viewBox="0 0 ${VB.w} ${VB.h}" class="h-full w-auto max-w-full block select-none" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="tb-board" x1="0" y1="0" x2="0.4" y2="1">
        <stop offset="0" stop-color="#1a4a32"/><stop offset="55%" stop-color="#10331f"/><stop offset="100%" stop-color="#0a2417"/>
      </linearGradient>
      <radialGradient id="tb-vig" cx="50%" cy="42%" r="72%">
        <stop offset="55%" stop-color="#000" stop-opacity="0"/><stop offset="100%" stop-color="#000" stop-opacity=".55"/>
      </radialGradient>
      <filter id="tb-grain"><feTurbulence type="fractalNoise" baseFrequency=".85" numOctaves="3"/><feColorMatrix type="saturate" values="0"/></filter>
      <filter id="chalk"><feTurbulence type="fractalNoise" baseFrequency=".045" numOctaves="2" result="n"/>
        <feDisplacementMap in="SourceGraphic" in2="n" scale="2.4" xChannelSelector="R" yChannelSelector="G"/></filter>
      <marker id="ah-on" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="5.5" markerHeight="5.5" orient="auto-start-reverse">
        <path d="M0 1 L9 5 L0 9 z" fill="${color}"/></marker>
      <marker id="ah-off" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse">
        <path d="M0 1 L9 5 L0 9 z" fill="#7fa892" opacity=".5"/></marker>
    </defs>

    <rect id="tb-bg" width="${VB.w}" height="${VB.h}" rx="18" fill="url(#tb-board)"/>
    <rect width="${VB.w}" height="${VB.h}" rx="18" filter="url(#tb-grain)" opacity=".07" style="mix-blend-mode:soft-light;pointer-events:none"/>
    <rect width="${VB.w}" height="${VB.h}" rx="18" fill="url(#tb-vig)" style="pointer-events:none"/>

    <g id="tb-cam">
      ${pitchLines()}
      <g filter="url(#chalk)">${AMBIENT.map(ambient).join("")}</g>
      <path d="M${MIDX - 40} ${PITCH.y + 26} q 60 -14 118 0" fill="none" stroke="${CHALK}" stroke-width="1.6" opacity=".22" marker-end="url(#ah-off)"/>
      ${principlesBand(run, f)}
      ${arrows}
      ${nodes}
      ${postIt(selected === NOTES_ID)}
    </g>
  </svg>`;
}

/* ---------- Dónde cae cada nodo ----------
   Un árbol REDISEÑADO trae la posición en el propio catálogo (`pos`): así el
   dibujo puede ser el de una táctica de verdad —la presión alta ocupa la cancha
   de una manera, el bloque bajo de otra— en vez de una grilla igual para todos.
   Un árbol sin `pos` cae en la grilla histórica de 3 carriles × 3 tiers. */

/** ¿Este árbol trae su propio dibujo? Basta con que un nodo declare `pos`. */
const isGraph = (tree) => tree.some(t => t.pos);

/** Los padres de un rasgo, leídos de sus REQUISITOS (no hay tabla de aristas aparte). */
function parentsOf(t) {
  return [...(t.req.previo ? [t.req.previo] : []), ...(t.req.todos || []), ...(t.req.alguno || [])];
}

/** Posición y radio de un nodo. La usa el dibujo y la cámara del zoom. */
function layoutOf(tree, id) {
  const t = tree.find(x => x.id === id);
  if (!t) return null;
  // Los Masters se dibujan un poco más grandes: la hoja de la rama se ve venir.
  if (t.pos) return { x: t.pos.x, y: t.pos.y, r: t.tier === "master" ? R : R - 4 };
  if (t.tier === "master") return { x: MASTER.x, y: MASTER.y, r: MASTER.r };
  return { x: COL_X[TIERS.indexOf(t.tier)], y: LANE_Y[t.rama], r: R };
}

/** Posición y radio de un nodo (la usa la pantalla para apuntar la cámara del zoom). */
export function nodePos(tree, id) {
  if (id === NOTES_ID) return { x: NOTES.x, y: NOTES.y, r: NOTES.r };
  return layoutOf(tree, id);
}

/**
 * Transform de la cámara. Un rasgo se encuadra a la IZQUIERDA (la ficha vive a la
 * derecha); el post-it, que no lleva ficha porque se lee en el propio papel, va
 * CENTRADO y con más zoom.
 *
 * Con la ficha abierta la pizarra queda partida 2:1 — el riel ocupa el tercio
 * derecho (`.tb-rail`, index.html) —, así que el rasgo se centra en los DOS
 * TERCIOS que quedan a la izquierda: 2/3 ÷ 2 = 1/3 del ancho total. El número
 * sale de la proporción, no del ojo: si el riel cambia de ancho, este factor
 * cambia con él.
 */
export function camTransform(pos, zoom = 2.4, center = false) {
  if (!pos) return "translate(0,0) scale(1)";
  const tx = VB.w * (center ? 0.5 : 1 / 3) - zoom * pos.x;
  const ty = VB.h * 0.5 - zoom * pos.y;
  return `translate(${tx.toFixed(1)},${ty.toFixed(1)}) scale(${zoom})`;
}
