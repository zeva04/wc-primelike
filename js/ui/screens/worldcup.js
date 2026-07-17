/* ============================================================
   ui/screens/worldcup — Estado del Mundial: las tablas de los
   12 grupos y los cruces de la ronda en eliminatorias. También
   exporta las tarjetas de posición que reutilizan hub y
   post-partido.
   ============================================================ */
import { getTeam } from "../../data/teams-repo.js";
import { computeTable } from "../../game/tournament/groups.js";
import { STAGE_LABEL } from "../../game/tournament/knockout.js";
import { S } from "../session.js";
import { register, go } from "../nav.js";
import { screenShell, $, flagImg } from "../components.js";

/**
 * Estado del Mundial: historial completo con las tablas de los 12 grupos y,
 * en eliminatorias, los cruces de la ronda actual. Se llega desde el bloque de posición.
 */
function renderWorldCupStatus() {
  const run = S.run;
  const koBlock = run.stage !== "groups" ? `
    <div class="bg-slate-800/60 border border-slate-700 rounded-2xl p-4 mb-5">
      <h3 class="font-bold mb-2">🔥 ${STAGE_LABEL[run.stage]} — cruces</h3>
      <div class="grid sm:grid-cols-2 gap-x-6">
        ${run.koMatches.map(([a, b], idx) => {
          const A = getTeam(a), B = getTeam(b);
          const mine = a === run.teamId || b === run.teamId;
          // El mundo juega día a día: los cruces ajenos ya resueltos muestran su marcador
          const r = run.koPlayed[idx];
          return `<div class="text-sm py-1 flex items-center gap-1.5 ${mine ? "tp-text font-bold" : "text-slate-300"}">
            ${flagImg(A, "w-5 h-3.5")} ${A.name} <span class="text-slate-500">${r ? `<b class="text-slate-300">${r.gA}-${r.gB}${r.pens ? " (p)" : ""}</b>` : "vs"}</span> ${B.name} ${flagImg(B, "w-5 h-3.5")}
          </div>`;
        }).join("")}
      </div>
    </div>` : "";
  screenShell(`
    <button id="btn-back" class="text-slate-400 hover:text-white mb-4 cursor-pointer">← Volver a la concentración</button>
    <h1 class="text-2xl font-black mb-4">🌍 Estado del Mundial</h1>
    ${koBlock}
    <div class="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
      ${run.groups.map(g => {
        const table = computeTable(g);
        const mine = g.teamIds.includes(run.teamId);
        return `<div class="rounded-xl border ${mine ? "tp-border tp-bg-soft" : "border-slate-700 bg-slate-800/60"} p-3">
          <div class="font-black text-center mb-1 ${mine ? "tp-text" : "text-slate-400"}">GRUPO ${g.name}</div>
          <table class="w-full text-xs">
            <thead><tr class="text-slate-500"><th class="text-left font-normal">Equipo</th><th>PJ</th><th>DG</th><th>Pts</th></tr></thead>
            <tbody>${table.map((r, i) => {
              const t = getTeam(r.id);
              const isMe = r.id === run.teamId;
              return `<tr class="${isMe ? "tp-text font-bold" : "text-slate-300"} ${i === 1 ? "border-b border-dashed border-slate-600" : ""} ${i === 2 ? "border-b border-dashed border-slate-700" : ""}">
                <td class="py-0.5"><span class="inline-flex items-center gap-1">${flagImg(t, "w-4 h-3")}<span class="truncate max-w-[7rem] inline-block align-middle">${t.name}</span></span></td>
                <td class="text-center">${r.pj}</td><td class="text-center">${r.gf - r.gc > 0 ? "+" : ""}${r.gf - r.gc}</td><td class="text-center font-bold">${r.pts}</td></tr>`;
            }).join("")}</tbody>
          </table>
        </div>`;
      }).join("")}
    </div>
  `);
  $("#btn-back").onclick = () => go("hub");
}

/** Tarjeta con la tabla de mi grupo (se reutiliza en hub y post-partido). */
export function renderGroupTableCard() {
  const run = S.run;
  const g = run.groups[run.myGroupIdx];
  const table = computeTable(g);
  return `<div class="bg-slate-800/60 border border-slate-700 rounded-2xl p-4">
    <h3 class="font-bold mb-2">📊 Grupo ${g.name}</h3>
    <table class="w-full text-sm">
      <thead><tr class="text-slate-500 text-xs"><th class="text-left font-normal">Equipo</th><th>PJ</th><th>DG</th><th>Pts</th></tr></thead>
      <tbody>${table.map((r, i) => {
        const t = getTeam(r.id);
        const mine = r.id === run.teamId;
        return `<tr class="${mine ? "tp-text font-bold" : "text-slate-300"} ${i === 1 ? "border-b border-dashed border-slate-600" : ""} ${i === 2 ? "border-b border-dashed border-slate-700" : ""}">
          <td class="py-1"><span class="inline-flex items-center gap-1.5">${flagImg(t, "w-5 h-3.5")}<span>${t.name}</span></span></td><td class="text-center">${r.pj}</td><td class="text-center">${r.gf - r.gc > 0 ? "+" : ""}${r.gf - r.gc}</td><td class="text-center font-bold">${r.pts}</td></tr>`;
      }).join("")}</tbody>
    </table>
    <p class="text-[10px] text-slate-500 mt-2">Clasifican los 2 primeros + los 8 mejores terceros de todos los grupos.</p>
  </div>`;
}

/**
 * Tarjeta de eliminación directa (reemplaza a la tabla en fases finales).
 * Compacta y con la ronda como protagonista: antes eran dos líneas sueltas
 * flotando en una card genérica que solo ocupaba el espacio de la tabla.
 */
export function renderKoInfoCard() {
  const run = S.run;
  const vivos = run.koMatches.length * 2;
  return `<div class="bg-slate-800/60 border tp-border rounded-2xl p-4">
    <div class="text-[10px] uppercase tracking-widest text-slate-500 font-bold">Eliminación directa</div>
    <div class="text-2xl font-black tp-text mt-0.5">🔥 ${STAGE_LABEL[run.stage]}</div>
    <div class="flex items-center gap-2 mt-2 flex-wrap text-xs">
      <span class="px-2 py-0.5 rounded-full border border-slate-600 bg-slate-900/60 text-slate-300 font-bold shrink-0">${vivos} equipos vivos</span>
      <span class="text-slate-500">Derrota = fin de la aventura · empate = prórroga y penales.</span>
    </div>
  </div>`;
}

register("worldcup", renderWorldCupStatus);
