/* ============================================================
   ui/plays — LAS CUATRO JUGADAS FIRMA dibujadas en mini-pizarra.

   La tesis de la pantalla: el jugador elige entre cuatro FÚTBOLS
   distintos, así que tiene que VERLOS, no leerlos. Cada filosofía
   se dibuja como el DT dibujaría su idea en el pizarrón, con el
   marcador de su principio firma (ui/board.markerColor):

     🦁 High Press   rojo    tres flechas convergen sobre la salida
                             rival, en el área de ELLOS
     🎼 Posesión     azul    el triángulo de pases y el arco de
                             circulación en la medular
     ⚡ Contragolpe  ámbar   bloque compacto y UNA diagonal larga
                             al espacio
     🧱 Bloque bajo  púrpura dos líneas escalonadas y el pelotazo
                             al duelo

   Ataque de IZQUIERDA a DERECHA, igual que la pizarra grande: el
   arco rival está a la derecha en las cuatro.

   Módulo puro: recibe una filosofía (content/philosophies) y
   devuelve SVG. No lee estado ni toca el DOM.

   SIN filtro de tiza (a diferencia de la pizarra grande): cuatro
   feTurbulence/feDisplacementMap en pantalla, y encima un filter
   CSS sobre las no elegidas, congelaban el renderer al rasterizar.
   A 300×190 el temblor de tiza no se apreciaba igual — el trazo
   redondeado y la opacidad bastan.
   ============================================================ */
import { markerColor } from "./board.js";

const VB = { w: 300, h: 190 };
const CHALK = "#dff0e5";

/* ---------- Primitivas de dibujo ---------- */

/** Flecha curva de a→b. `bend` comba perpendicular; `dash` la hace punteada. */
function arw(x1, y1, x2, y2, bend, color, id, dash = true, w = 2.2) {
  const dx = x2 - x1, dy = y2 - y1, len = Math.hypot(dx, dy) || 1;
  const cx = (x1 + x2) / 2 - (dy / len) * bend, cy = (y1 + y2) / 2 + (dx / len) * bend;
  return `<path d="M${x1} ${y1} Q${cx.toFixed(1)} ${cy.toFixed(1)} ${x2} ${y2}" fill="none"
    stroke="${color}" stroke-width="${w}" stroke-linecap="round" opacity=".92"
    ${dash ? 'stroke-dasharray="7 5"' : ""} marker-end="url(#pa-${id})"/>`;
}

/** Mis jugadores: círculo en el color del marcador. */
const o = (x, y, c, r = 6) => `<circle cx="${x}" cy="${y}" r="${r}" fill="none" stroke="${c}" stroke-width="2.2" opacity=".9"/>`;

/** El rival: la X de siempre, en tiza. */
const X = (x, y, s = 6) => `<g stroke="${CHALK}" stroke-width="2.2" stroke-linecap="round" opacity=".45">
  <line x1="${x - s}" y1="${y - s}" x2="${x + s}" y2="${y + s}"/>
  <line x1="${x + s}" y1="${y - s}" x2="${x - s}" y2="${y + s}"/></g>`;

/** La pelota: punto lleno. */
const ball = (x, y, c) => `<circle cx="${x}" cy="${y}" r="3.4" fill="${c}"/>`;

/** La cancha en tiza: lo mínimo para leerla como cancha (el arco rival, a la derecha). */
const pitch = () => `<g fill="none" stroke="${CHALK}" stroke-width="1.6" opacity=".26" stroke-linecap="round">
  <rect x="10" y="10" width="280" height="170" rx="2"/>
  <line x1="150" y1="10" x2="150" y2="180"/>
  <circle cx="150" cy="95" r="26"/>
  <rect x="10" y="55" width="48" height="80"/>
  <rect x="242" y="55" width="48" height="80"/>
</g>`;

/* ---------- Las cuatro jugadas ---------- */
const PLAYS = {
  // Cazar arriba: la salida rival muere en su propia área.
  press: (c, id) => `
    ${X(252, 95)}${ball(244, 95, c)}
    ${X(268, 62)}${X(268, 128)}
    ${o(160, 48, c)}${o(150, 95, c)}${o(160, 142, c)}
    ${arw(170, 52, 232, 82, -14, c, id)}
    ${arw(160, 95, 230, 95, 0, c, id)}
    ${arw(170, 138, 232, 108, 14, c, id)}`,

  // Tener y circular: el triángulo que mueve al rival hasta abrirlo.
  posesion: (c, id) => `
    ${X(150, 40)}${X(150, 150)}${X(215, 95)}
    ${o(100, 58, c)}${o(148, 120, c)}${o(196, 62, c)}${ball(100, 58, c)}
    ${arw(106, 63, 142, 114, -16, c, id)}
    ${arw(154, 115, 190, 68, -16, c, id)}
    ${arw(196, 70, 108, 62, 34, c, id)}
    ${arw(96, 148, 220, 148, 22, c, id, true, 1.6)}`,

  // Orden atrás y puñalada: la contra se JUEGA, no se revienta — salida a la banda
  // y de ahí al que llega al área. Dos pases rápidos, ahí está la diferencia con el
  // pelotazo único del Bloque bajo.
  contra: (c, id) => `
    ${o(58, 62, c)}${o(46, 95, c)}${o(58, 128, c)}
    ${X(120, 60)}${X(136, 134)}${X(212, 122)}
    ${ball(66, 95, c)}
    ${arw(74, 92, 147, 44, -16, c, id, true, 2.6)}
    ${o(155, 38, c, 7)}
    ${arw(162, 46, 254, 88, 16, c, id, true, 2.6)}
    ${o(263, 94, c, 7)}`,

  // Muralla y pelotazo: cuatro atrás aguantando y UN duelo arriba (cinco en cancha).
  bloque: (c, id) => `
    ${o(48, 48, c)}${o(48, 82, c)}${o(48, 112, c)}${o(48, 146, c)}
    ${X(150, 62)}${X(150, 128)}
    ${ball(64, 112, c)}
    ${arw(72, 109, 234, 80, -46, c, id, true, 2.4)}
    ${o(238, 80, c, 7)}${X(252, 88)}`,
};

/** La mini-pizarra de una filosofía: cancha en tiza + su jugada firma en su marcador. */
export function playBoard(f) {
  const c = markerColor(f);
  return `<svg viewBox="0 0 ${VB.w} ${VB.h}" class="w-full h-auto block select-none" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <marker id="pa-${f.id}" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="4.6" markerHeight="4.6" orient="auto-start-reverse">
        <path d="M0 1 L9 5 L0 9 z" fill="${c}"/></marker>
    </defs>
    ${pitch()}
    ${PLAYS[f.id] ? PLAYS[f.id](c, f.id) : ""}
  </svg>`;
}
