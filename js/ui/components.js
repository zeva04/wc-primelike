/* ============================================================
   ui/components — piezas visuales reutilizables y helpers de
   pantalla. Sin conocimiento de pantallas específicas.
   ============================================================ */

export const app = () => document.getElementById("app");
export const $ = (sel) => document.querySelector(sel);

/** Fila de 5 estrellas con relleno parcial (rating 0-5 en pasos de 0.5). */
export function starsHtml(rating, size = "text-base") {
  const pct = (rating / 5) * 100;
  return `<span class="relative inline-block ${size} leading-none align-middle">
    <span class="text-slate-600">★★★★★</span>
    <span class="absolute inset-0 overflow-hidden text-amber-400" style="width:${pct}%">★★★★★</span>
  </span>`;
}

import { ENERGY_OK, OXID_THRESHOLD, OXID_FLOOR_AT } from "../game/match/powers.js";

/** Color de texto de la energía: verde = DENTRO de la banda verde (rinde pleno,
 *  match/powers.ENERGY_OK — M1: la UI muestra la banda por definición, no por
 *  coincidencia) · ámbar = paga peaje · rojo = fundido de verdad. */
export function energyCls(en) {
  return en >= ENERGY_OK ? "text-emerald-400" : en > 35 ? "text-amber-400" : "text-red-400";
}

/** Color de texto de la racha de oxidación (R1 — mismo patrón que energyCls: la UI
 *  muestra la mecánica por definición, una sola constante): gris = bajo el umbral
 *  (todavía gratis) · ámbar = oxidado (racha 3-4) · rojo = en el piso (racha 5+). */
export function oxidCls(racha) {
  return racha >= OXID_FLOOR_AT ? "text-red-400" : racha >= OXID_THRESHOLD ? "text-amber-400" : "text-slate-400";
}

/** Barra de energía coloreada según nivel (verde = en banda / ámbar / rojo). */
export function energyBar(en) {
  const color = en >= ENERGY_OK ? "bg-emerald-500" : en > 35 ? "bg-amber-500" : "bg-red-500";
  return `<div class="w-full h-1.5 bg-slate-700 rounded-full overflow-hidden">
    <div class="${color} h-full rounded-full transition-all" style="width:${en}%"></div>
  </div>`;
}

/** Etiqueta de posición con color (POR amarillo, DEF azul, MED verde, DEL rojo). */
export function posBadge(pos) {
  const colors = { POR: "bg-yellow-600", DEF: "bg-blue-600", MED: "bg-emerald-600", DEL: "bg-red-600" };
  return `<span class="${colors[pos]} text-[10px] font-bold px-1.5 py-0.5 rounded text-white">${pos}</span>`;
}

/**
 * Bandera real como imagen local. Los emoji de banderas no se renderizan en Windows;
 * los PNG viven en data/flags para que el juego funcione sin internet.
 */
export function flagImg(team, cls = "w-6 h-4") {
  if (!team || !team.iso) return "";
  return `<img src="data/flags/${team.iso}.png" alt="${team.name}" title="${team.name}" class="flag-img ${cls}">`;
}

/** Bandera + nombre de un equipo en línea. */
export function teamChip(team, extra = "") {
  return `<span class="inline-flex items-center gap-1.5 ${extra}">${flagImg(team, "w-6 h-4")}<span>${team.name}</span></span>`;
}

/** Dorsal del jugador como mini-placa. */
export function numTag(p, extra = "") {
  return `<span class="text-[10px] font-black text-slate-300 bg-slate-700/80 rounded px-1 min-w-[1.3rem] inline-block text-center ${extra}">${p.num || "–"}</span>`;
}

/**
 * Icono del Momento sobre la ficha (game/momentum), por nivel 1..7 (decisión PO 18-jul):
 * arriba el color sube con la distancia al neutro (amarillo = 1 paso, verde = 2); abajo
 * el amarillo avisa (3) y el celeste marca la caída (2); los extremos son 🔥 (7,
 * inspirado) y ❄️ (1, paupérrimo). La forma codifica la dirección (▲/▼). Neutro (4): nada.
 *   7 🔥 · 6 ▲verde · 5 ▲amarillo · 4 — · 3 ▼amarillo · 2 ▼celeste · 1 ❄️
 */
export function momentoChip(p) {
  if (p.momento === undefined) return "";
  const arrow = (dir, color) => ` <span class="${color} font-black leading-none">${dir}</span>`;
  switch (p.momento) {
    case 7: return " 🔥";
    case 6: return arrow("▲", "text-emerald-400");
    case 5: return arrow("▲", "text-yellow-400");
    case 3: return arrow("▼", "text-yellow-400");
    case 2: return arrow("▼", "text-sky-400");
    case 1: return " ❄️";
    default: return "";
  }
}

/* ── EL MAPA DE CALOR (sprint del Territorio) ─────────────────────────────────
   La cancha vertical con sus zonas pintadas por intensidad, como los mapas de
   calor de las transmisiones. Recibe las celdas YA normalizadas por el motor
   (match/field.heatCells): la vista no conoce zonas, alturas ni reglas — solo
   dibuja. MI arco abajo y el rival arriba, siempre: es lo que hace que el mapa
   se lea sin explicación (y lo que permite mostrar el mapa rival en la MISMA
   cancha, sin espejar: su calor pegado a mi área significa "me atacan por acá").

   El degradado es el del fútbol profesional: sin uso → amarillo → naranjo →
   rojo. El desenfoque del contenedor convierte 15 rectángulos en manchas. */
const HEAT_STOPS = [[250, 204, 21], [249, 115, 22], [239, 68, 68]];
function heatColor(i) {
  if (i <= 0.02) return "transparent";
  const t = Math.min(1, i);
  const [a, b] = t < 0.5 ? [HEAT_STOPS[0], HEAT_STOPS[1]] : [HEAT_STOPS[1], HEAT_STOPS[2]];
  const k = t < 0.5 ? t / 0.5 : (t - 0.5) / 0.5;
  const mix = a.map((c, j) => Math.round(c + (b[j] - c) * k));
  return `rgba(${mix.join(",")},${(0.16 + 0.74 * t).toFixed(2)})`;
}

/**
 * La cancha pintada. `cells` = [{h, v, i}] del motor; `lanes`/`rows` la grilla.
 * Devuelve HTML (no toca el DOM): quien lo llama decide dónde vive.
 */
export function heatPitch(cells, { lanes = 3, rows = 5, blur = 9 } = {}) {
  const w = 100 / lanes, hgt = 100 / rows;
  const manchas = cells.map(c => `<span class="absolute" style="left:${(c.h - 1) * w}%;width:${w}%;top:${(rows - c.v) * hgt}%;height:${hgt}%;background:${heatColor(c.i)}"></span>`).join("");
  return `<div class="relative w-full h-full overflow-hidden rounded-lg" style="background:#0b2016">
    <div class="absolute inset-0" style="filter:blur(${blur}px)">${manchas}</div>
    <div class="absolute inset-0 border border-white/15 rounded-lg"></div>
    <div class="absolute left-0 right-0 top-1/2 h-px bg-white/15"></div>
    <div class="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/15" style="width:26%;aspect-ratio:1"></div>
    <div class="absolute left-1/4 w-1/2 border border-white/15 border-t-0" style="top:0;height:16%"></div>
    <div class="absolute left-1/4 w-1/2 border border-white/15 border-b-0" style="bottom:0;height:16%"></div>
  </div>`;
}

/** Notificación flotante que desaparece sola (~4s). */
export function toast(msg) {
  const t = document.createElement("div");
  t.className = "fixed bottom-6 left-1/2 -translate-x-1/2 bg-slate-800 border border-slate-600 text-slate-100 px-5 py-3 rounded-xl shadow-2xl z-[100] max-w-md text-sm animate-fadein";
  t.textContent = msg;
  document.body.appendChild(t);
  setTimeout(() => t.remove(), 4200);
}

/**
 * Abre un modal centrado (cierra el anterior si había). Devuelve el nodo para enganchar handlers.
 * `maxW` por defecto `max-w-lg`; la gestión de plantilla en partido usa uno ancho para la cancha.
 */
export function modal(html, maxW = "max-w-lg") {
  closeModal();
  const wrap = document.createElement("div");
  wrap.id = "modal";
  wrap.className = "fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4";
  wrap.innerHTML = `<div class="bg-slate-800 border border-slate-600 rounded-2xl shadow-2xl ${maxW} w-full p-6 animate-pop max-h-[85vh] overflow-y-auto">${html}</div>`;
  document.body.appendChild(wrap);
  return wrap;
}

/** Cierra el modal activo si existe. */
export function closeModal() { const m = document.getElementById("modal"); if (m) m.remove(); }

/** ¿Hay un modal abierto? Lo usa el hub para no avanzar el día dos veces (ver pasarDia). */
export function modalOpen() { return !!document.getElementById("modal"); }

/** Reemplaza la pantalla completa con el contenido dado (contenedor centrado). */
export function screenShell(inner, maxW = "max-w-5xl") {
  app().innerHTML = `<div class="${maxW} mx-auto px-4 py-6">${inner}</div>`;
}
