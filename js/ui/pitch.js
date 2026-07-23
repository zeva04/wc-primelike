/* ============================================================
   ui/pitch — la cancha 8-bit reutilizable: césped, el once, el
   banco y el arrastre entre ellos.

   NO conoce reglas. Quien la monta decide qué intercambio es
   válido (`canSwap`) y qué significa (`onSwap`): en Gestión de
   Plantilla es mover jugadores; en el partido, un cambio que
   gasta o una reubicación gratis.

   Las filas salen de `playedPos(p)`, NO del índice del slot: así
   también cae bien el arquero que entra por una roja, que ocupa
   el índice del jugador de campo que salió pero juega en el arco.
   ============================================================ */
import { playerOverall, playedPos, outOfPosPenalty } from "../game/ratings.js";
import { posBadge } from "./components.js";
import { spriteSvg, kitOf } from "./sprites.js";

export const POS_NAME = { POR: "Arquero", DEF: "Defensa", MED: "Mediocampista", DEL: "Delantero" };

/** Dorsal centrado sobre la camiseta, en el color secundario del kit (combina con cada plantel). */
export function jerseyNum(p, team, sizeCls = "text-xs") {
  const accent = kitOf(p, team).accent;
  return `<span class="absolute left-1/2 -translate-x-1/2 top-[75%] -translate-y-1/2 font-black leading-none select-none drop-shadow-[0_1px_2px_rgba(0,0,0,0.85)] ${sizeCls}" style="color:${accent}">${p.num || "–"}</span>`;
}

// Filas de la cancha (% desde arriba): el arquero abajo, los delanteros arriba.
// Equiespaciadas a 23%: menos que eso y las fichas se pisan en pantallas chicas.
const ROW_Y = { DEL: 20, MED: 43, DEF: 66, POR: 89 };
// Anillo del destino válido según el tono que pida quien la monta.
const TONE_RING = { sky: "ring-sky-400", emerald: "ring-emerald-400", amber: "ring-amber-400" };

let drag = null; // jugador que se está arrastrando ahora
let view = null; // configuración de la cancha montada (solo hay una a la vez)

/**
 * Monta (o repinta) la cancha y su banco. Config:
 *   pitchEl, benchEl   contenedores (benchEl opcional)
 *   team               equipo, para el kit de los sprites
 *   lineup, bench      jugadores (refs al plantel)
 *   selected           nombre del jugador con la ficha abierta
 *   sizes              { sprite, bench } clases de tamaño (opcional)
 *   canSwap(a, b)      null si no se puede · { tone } si sí
 *   onSwap(a, b)       aplica el intercambio ya validado
 *   onSelect(p)        clic en una ficha
 *   badge(p)           html extra sobre la ficha (🟨 🟥 🚑 🔄)
 *   extra(p)           html bajo la nota, dentro de la placa (el partido pone la energía)
 *   headBar(p)         html de una barra angosta sobre la cabeza (Gestión de Plantilla pone la energía)
 *   muted(p)           pintarlo apagado (expulsado, lesionado, suspendido)
 *   draggable(p)       si se puede arrastrar
 */
export function mountPitch(cfg) {
  view = {
    sizes: { sprite: "w-10 h-12 sm:w-12 sm:h-14", bench: "w-9 h-11" },
    badge: () => "", extra: () => "", headBar: () => "", muted: () => false, draggable: () => true, onSelect: () => {},
    ...cfg,
  };
  paintField();
  paintBench();
}

/** Pinta el once sobre el césped, cada uno en la fila del puesto que JUEGA. */
function paintField() {
  const el = view.pitchEl;
  if (!el) return;
  const rows = { POR: [], DEF: [], MED: [], DEL: [] };
  for (const p of view.lineup) (rows[playedPos(p)] || rows[p.pos]).push(p);
  const tokens = [];
  for (const pos of ["DEL", "MED", "DEF", "POR"]) {
    const xs = spreadX(rows[pos].length);
    rows[pos].forEach((p, i) => tokens.push(token(p, xs[i], ROW_Y[pos])));
  }
  el.innerHTML = lines() + tokens.join("");
  bind(el);
}

/** Pinta el banco (todo el que no es titular; los no disponibles, en gris). */
function paintBench() {
  const el = view.benchEl;
  if (!el) return;
  el.innerHTML = view.bench.map(benchCard).join("");
  bind(el);
}

/** Reparte n fichas a lo ancho (%): 1 al centro, 2 abiertos, 3 en línea. */
function spreadX(n) {
  if (n <= 1) return [50];
  const gap = n === 2 ? 36 : n === 3 ? 30 : 24;
  return Array.from({ length: n }, (_, i) => 50 + (i - (n - 1) / 2) * gap);
}

/** Líneas de la cancha: borde, medio campo, círculo central y las dos áreas. */
function lines() {
  return `
    <div class="pitch-line inset-2 border-2"></div>
    <div class="pitch-line left-2 right-2 top-1/2 border-t-2"></div>
    <div class="pitch-line left-1/2 top-1/2 w-20 h-20 -translate-x-1/2 -translate-y-1/2 border-2 rounded-full"></div>
    <div class="pitch-line left-1/2 -translate-x-1/2 top-2 w-2/5 h-[13%] border-2 border-t-0"></div>
    <div class="pitch-line left-1/2 -translate-x-1/2 bottom-2 w-2/5 h-[13%] border-2 border-b-0"></div>`;
}

/** Ficha de un titular: sprite + dorsal + placa con nombre y nota. */
function token(p, x, y) {
  const sel = p.name === view.selected;
  const fuera = outOfPosPenalty(p) > 0;
  const off = view.muted(p);
  return `<button data-name="${p.name}" ${view.draggable(p) ? 'draggable="true"' : ""}
    title="${p.name}${fuera ? ` — ¡de ${POS_NAME[playedPos(p)].toLowerCase()}! No es su puesto` : ""}"
    class="absolute -translate-x-1/2 -translate-y-1/2 flex flex-col items-center group z-10 ${
      off ? "opacity-40 cursor-not-allowed" : view.draggable(p) ? "cursor-grab active:cursor-grabbing" : "cursor-pointer"}"
    style="left:${x}%;top:${y}%">
    <div class="relative pointer-events-none">
      ${view.headBar(p) ? `<div class="absolute left-1/2 -translate-x-1/2 -top-2">${view.headBar(p)}</div>` : ""}
      <div class="absolute left-1/2 -translate-x-1/2 bottom-0 w-8 h-1.5 bg-black/40 rounded-[50%]"></div>
      <div class="relative rounded border-2 px-0.5 transition-all group-hover:brightness-125 ${
        sel ? "tp-border tp-bg-soft tp-ring" : fuera ? "border-orange-400/70" : "border-transparent"}">
        ${spriteSvg(p, view.team, view.sizes.sprite)}
        ${jerseyNum(p, view.team, "text-[13px]")}
      </div>
      ${fuera ? `<span class="absolute -top-2 -right-2 text-[11px] font-black text-slate-900 bg-orange-400 border border-orange-200 rounded-full w-4 h-4 flex items-center justify-center leading-none">!</span>` : ""}
    </div>
    <span class="mt-0.5 px-1.5 py-0.5 rounded bg-slate-900/85 border text-center leading-tight pointer-events-none ${
      sel ? "tp-border" : fuera ? "border-orange-400/70" : "border-slate-700"}">
      <span class="block text-[10px] font-bold text-slate-100 truncate max-w-[4.5rem] sm:max-w-[6.5rem]">${p.name}${view.badge(p)}</span>
      <b class="block text-[11px] ${fuera ? "text-orange-400" : "text-amber-300"}">${playerOverall(p)}</b>
      ${view.extra(p)}
    </span>
  </button>`;
}

/** Tarjeta de un suplente. */
function benchCard(p) {
  const sel = p.name === view.selected;
  const off = view.muted(p);
  return `<button data-name="${p.name}" ${view.draggable(p) ? 'draggable="true"' : ""} title="${p.name}"
    class="relative flex flex-col items-center gap-0.5 p-1 pt-2 rounded-lg border-2 transition-all ${
      off ? "opacity-40 cursor-not-allowed" : view.draggable(p) ? "cursor-grab active:cursor-grabbing" : "cursor-pointer"} ${
      sel ? "tp-border tp-bg-soft" : "border-slate-700 bg-slate-900/50 hover:border-slate-500"}">
    ${view.headBar(p) ? `<span class="absolute top-0.5 left-1/2 -translate-x-1/2 pointer-events-none">${view.headBar(p)}</span>` : ""}
    <span class="absolute top-0.5 right-0.5 text-[9px] pointer-events-none">${view.badge(p)}</span>
    <span class="relative pointer-events-none">
      ${spriteSvg(p, view.team, view.sizes.bench)}
      ${jerseyNum(p, view.team, "text-[11px]")}
    </span>
    <span class="scale-[0.82] origin-center -my-0.5 pointer-events-none">${posBadge(p.pos)}</span>
    <span class="text-[9px] font-medium text-slate-300 truncate max-w-full leading-tight pointer-events-none">${p.name}</span>
    <b class="text-[11px] text-amber-300 leading-none pointer-events-none">${playerOverall(p)}</b>
    <span class="w-full pointer-events-none">${view.extra(p)}</span>
  </button>`;
}

/* ---------- Arrastre ---------- */

const playerNamed = (name) => view.lineup.find(p => p.name === name) || view.bench.find(p => p.name === name);

/**
 * Enciende (o apaga) el resalte de los destinos válidos SIN repintar: durante un arrastre
 * no se puede tocar el innerHTML, porque destruir el nodo que el mouse está arrastrando
 * cancela el drag. Por eso el resalte va por clases sobre los nodos que ya existen.
 */
function markTargets(on) {
  for (const el of [view.pitchEl, view.benchEl]) {
    if (!el) continue;
    el.querySelectorAll("[data-name]").forEach(n => {
      const p = playerNamed(n.dataset.name);
      const ok = on && drag && p !== drag ? view.canSwap(drag, p) : null;
      n.classList.toggle("ring-2", !!ok);
      n.classList.toggle("ring-offset-1", !!ok);
      n.classList.toggle("ring-offset-slate-900", !!ok);
      for (const ring of Object.values(TONE_RING)) n.classList.remove(ring);
      if (ok) n.classList.add(TONE_RING[ok.tone] || TONE_RING.sky);
    });
  }
}

/** Engancha clic (ver ficha) y arrastre (intercambiar) en las fichas de un contenedor. */
function bind(el) {
  el.querySelectorAll("[data-name]").forEach(node => {
    const p = playerNamed(node.dataset.name);
    if (!p) return;

    node.onclick = () => view.onSelect(p);

    node.addEventListener("dragstart", (e) => {
      if (!view.draggable(p)) return e.preventDefault();
      drag = p;
      e.dataTransfer.effectAllowed = "move";
      e.dataTransfer.setData("text/plain", p.name); // Firefox exige carga útil
      setTimeout(() => markTargets(true), 0);       // tras el tick en que el navegador captura la imagen
    });
    node.addEventListener("dragend", () => { drag = null; markTargets(false); });
    node.addEventListener("dragover", (e) => {
      if (drag && drag !== p && view.canSwap(drag, p)) { e.preventDefault(); e.dataTransfer.dropEffect = "move"; }
    });
    node.addEventListener("drop", (e) => {
      e.preventDefault();
      if (!drag || drag === p || !view.canSwap(drag, p)) return;
      const from = drag;
      drag = null;
      markTargets(false);
      view.onSwap(from, p);
    });
  });
}
