/* ============================================================
   ui/screens/scorers — Goleadores del Torneo: la card del top 5
   para el hub y la pantalla con la tabla completa. Los datos
   salen de game/scorers.tournamentScorers (mi equipo + el resto).
   ============================================================ */
import { getTeam } from "../../data/teams-repo.js";
import { tournamentScorers } from "../../game/scorers.js";
import { S } from "../session.js";
import { register, go } from "../nav.js";
import { screenShell, $, flagImg } from "../components.js";

/** Fila de la tabla: puesto, bandera + nombre, país y goles; mi equipo resaltado. */
function scorerRow(s, dense) {
  const t = getTeam(s.teamId);
  const mine = s.teamId === S.run.teamId;
  return `<tr class="${mine ? "tp-text font-bold" : "text-slate-300"}">
    <td class="text-center text-slate-500 ${dense ? "py-0.5" : "py-1"} w-6">${s.rank}</td>
    <td class="${dense ? "py-0.5" : "py-1"}"><span class="inline-flex items-center gap-1.5">${flagImg(t, "w-4 h-3")}<span class="truncate max-w-[8rem] inline-block align-middle">${s.name}</span></span></td>
    <td class="text-slate-500 text-xs hidden sm:table-cell">${t.name}</td>
    <td class="text-center font-black text-amber-300 w-8">${s.goles}</td>
  </tr>`;
}

/**
 * Card del hub con el top 5 de goleadores del torneo (o un aviso si aún no hay goles).
 * La envuelve el hub en un contenedor clickeable que lleva a la tabla completa.
 */
export function renderScorersCard() {
  const top = tournamentScorers(S.run, 5);
  const body = top.length
    ? `<table class="w-full text-sm">
        <tbody>${top.map(s => scorerRow(s, true)).join("")}</tbody>
      </table>`
    : `<p class="text-xs text-slate-500 py-1">Aún no se abrió el marcador del torneo — los goles llegarán con las primeras fechas.</p>`;
  // `h-full flex flex-col w-full`: la card llena su columna en el hub (sin dejar hueco).
  return `<div class="bg-slate-800/60 border border-slate-700 rounded-2xl p-4 h-full w-full flex flex-col">
    <h3 class="font-bold mb-2 shrink-0">⚽ Goleadores del torneo</h3>
    ${body}
  </div>`;
}

/** Pantalla con la tabla completa de goleadores del torneo. */
function renderScorers() {
  const all = tournamentScorers(S.run);
  screenShell(`
    <button id="btn-back" class="text-slate-400 hover:text-white mb-4 cursor-pointer">← Volver a la concentración</button>
    <h1 class="text-2xl font-black mb-4">⚽ Goleadores del Torneo</h1>
    ${all.length
      ? `<div class="bg-slate-800/60 border border-slate-700 rounded-2xl p-4 max-w-2xl">
          <table class="w-full text-sm">
            <thead><tr class="text-slate-500 text-xs border-b border-slate-700">
              <th class="text-center font-normal py-1 w-6">#</th>
              <th class="text-left font-normal py-1">Jugador</th>
              <th class="text-left font-normal py-1 hidden sm:table-cell">Selección</th>
              <th class="text-center font-normal py-1 w-8">G</th>
            </tr></thead>
            <tbody>${all.map(s => scorerRow(s, false)).join("")}</tbody>
          </table>
        </div>`
      : `<p class="text-slate-500">Aún no se abrió el marcador del torneo.</p>`}
  `, "max-w-2xl");
  $("#btn-back").onclick = () => go("hub");
}

register("scorers", renderScorers);
