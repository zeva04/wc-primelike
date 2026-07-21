/* ============================================================
   ui/screens/scorers — Tablas del torneo: goleadores y
   asistidores. Un carrusel de 2 pestañas para el hub (card del
   top 5) y la pantalla completa con toggle. Los datos salen de
   game/scorers.tournamentScorers y game/assists.tournamentAssists
   (mi equipo + el resto, sin doble conteo).
   ============================================================ */
import { getTeam } from "../../data/teams-repo.js";
import { tournamentScorers } from "../../game/scorers.js";
import { tournamentAssists } from "../../game/assists.js";
import { S } from "../session.js";
import { register, go } from "../nav.js";
import { screenShell, $, flagImg } from "../components.js";

// Las dos pestañas del carrusel: misma tabla, otra estadística. `table` da las filas
// ordenadas con ranking, `val` extrae el número, `col` es el encabezado corto.
const TABS = {
  goleadores: { icon: "⚽", label: "Goleadores", col: "G", table: tournamentScorers, val: s => s.goles,
    empty: "Aún no se abrió el marcador del torneo — los goles llegarán con las primeras fechas." },
  asistidores: { icon: "🅰️", label: "Asistidores", col: "A", table: tournamentAssists, val: s => s.asistencias,
    empty: "Aún no hay asistencias registradas — llegarán con los primeros goles de jugada." },
};
const TAB_KEYS = Object.keys(TABS);

// Pestaña activa en el hub y en la pantalla completa (persisten mientras dura la sesión).
let hubTab = "goleadores";
let screenTab = "goleadores";

/** Fila de la tabla: puesto, bandera + nombre, país y el valor (goles/asistencias); mi equipo resaltado. */
function row(s, dense, val) {
  const t = getTeam(s.teamId);
  const mine = s.teamId === S.run.teamId;
  return `<tr class="${mine ? "tp-text font-bold" : "text-slate-300"}">
    <td class="text-center text-slate-500 ${dense ? "py-0.5" : "py-1"} w-6">${s.rank}</td>
    <td class="${dense ? "py-0.5" : "py-1"}"><span class="inline-flex items-center gap-1.5">${flagImg(t, "w-4 h-3")}<span class="truncate max-w-[8rem] inline-block align-middle">${s.name}</span></span></td>
    <td class="text-slate-500 text-xs hidden sm:table-cell">${t.name}</td>
    <td class="text-center font-black text-amber-300 w-8">${val(s)}</td>
  </tr>`;
}

/**
 * Card del hub: carrusel con el top 5 de la pestaña activa (Goleadores / Asistidores).
 * Los botones de pestaña llevan la clase `.scard-tab`; el hub los cablea con
 * wireScorersCard (deben cortar la propagación para no navegar a la pantalla completa).
 */
export function renderScorersCard() {
  const tab = TABS[hubTab];
  const top = tab.table(S.run, 5);
  const body = top.length
    ? `<table class="w-full text-sm"><tbody>${top.map(s => row(s, true, tab.val)).join("")}</tbody></table>`
    : `<p class="text-xs text-slate-500 py-1">${tab.empty}</p>`;
  const toggle = TAB_KEYS.map(k => `<button data-tab="${k}" class="scard-tab text-sm px-1.5 py-0.5 rounded ${k === hubTab ? "bg-amber-500/20 text-amber-300" : "text-slate-500 hover:text-slate-300"} cursor-pointer" title="${TABS[k].label} del torneo">${TABS[k].icon}</button>`).join("");
  // `h-full flex flex-col w-full`: la card llena su columna en el hub (sin dejar hueco).
  return `<div class="bg-slate-800/60 border border-slate-700 rounded-2xl p-4 h-full w-full flex flex-col">
    <div class="flex items-center justify-between gap-2 mb-2 shrink-0">
      <h3 class="font-bold">${tab.icon} ${tab.label} del torneo</h3>
      <div class="flex items-center gap-0.5">${toggle}</div>
    </div>
    ${body}
  </div>`;
}

/** Cablea el carrusel de la card del hub: cambiar de pestaña no debe navegar a la pantalla completa. */
export function wireScorersCard(rootEl) {
  if (!rootEl) return;
  rootEl.querySelectorAll(".scard-tab").forEach(b => b.onclick = e => {
    e.stopPropagation();
    hubTab = b.dataset.tab;
    rootEl.innerHTML = renderScorersCard();
    wireScorersCard(rootEl); // los botones se recrearon: recablear
  });
}

/** Pantalla con la tabla completa del torneo, con toggle Goleadores / Asistidores. */
function renderScorers() {
  const tab = TABS[screenTab];
  const all = tab.table(S.run);
  screenShell(`
    <button id="btn-back" class="text-slate-400 hover:text-white mb-4 cursor-pointer">← Volver a la concentración</button>
    <div class="flex items-center gap-3 mb-4 flex-wrap">
      <h1 class="text-2xl font-black">🏆 Tabla del torneo</h1>
      <div class="flex rounded-lg overflow-hidden border border-slate-600 text-sm">
        ${TAB_KEYS.map(k => `<button data-tab="${k}" class="stab px-3 py-1.5 font-semibold cursor-pointer transition-colors ${k === screenTab ? "bg-amber-500 text-slate-900" : "bg-slate-700 hover:bg-slate-600"}">${TABS[k].icon} ${TABS[k].label}</button>`).join("")}
      </div>
    </div>
    ${all.length
      ? `<div class="bg-slate-800/60 border border-slate-700 rounded-2xl p-4 max-w-2xl">
          <table class="w-full text-sm">
            <thead><tr class="text-slate-500 text-xs border-b border-slate-700">
              <th class="text-center font-normal py-1 w-6">#</th>
              <th class="text-left font-normal py-1">Jugador</th>
              <th class="text-left font-normal py-1 hidden sm:table-cell">Selección</th>
              <th class="text-center font-normal py-1 w-8">${tab.col}</th>
            </tr></thead>
            <tbody>${all.map(s => row(s, false, tab.val)).join("")}</tbody>
          </table>
        </div>`
      : `<p class="text-slate-500">${tab.empty}</p>`}
  `, "max-w-2xl");
  $("#btn-back").onclick = () => go("hub");
  document.querySelectorAll(".stab").forEach(b => b.onclick = () => { screenTab = b.dataset.tab; renderScorers(); });
}

register("scorers", renderScorers);
