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

/** Barra de energía coloreada según nivel (verde/ámbar/rojo). */
export function energyBar(en) {
  const color = en > 65 ? "bg-emerald-500" : en > 35 ? "bg-amber-500" : "bg-red-500";
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

/** Notificación flotante que desaparece sola (~4s). */
export function toast(msg) {
  const t = document.createElement("div");
  t.className = "fixed bottom-6 left-1/2 -translate-x-1/2 bg-slate-800 border border-slate-600 text-slate-100 px-5 py-3 rounded-xl shadow-2xl z-[100] max-w-md text-sm animate-fadein";
  t.textContent = msg;
  document.body.appendChild(t);
  setTimeout(() => t.remove(), 4200);
}

/** Abre un modal centrado (cierra el anterior si había). Devuelve el nodo para enganchar handlers. */
export function modal(html) {
  closeModal();
  const wrap = document.createElement("div");
  wrap.id = "modal";
  wrap.className = "fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4";
  wrap.innerHTML = `<div class="bg-slate-800 border border-slate-600 rounded-2xl shadow-2xl max-w-lg w-full p-6 animate-pop max-h-[85vh] overflow-y-auto">${html}</div>`;
  document.body.appendChild(wrap);
  return wrap;
}

/** Cierra el modal activo si existe. */
export function closeModal() { const m = document.getElementById("modal"); if (m) m.remove(); }

/** Reemplaza la pantalla completa con el contenido dado (contenedor centrado). */
export function screenShell(inner, maxW = "max-w-5xl") {
  app().innerHTML = `<div class="${maxW} mx-auto px-4 py-6">${inner}</div>`;
}
