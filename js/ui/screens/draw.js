/* ============================================================
   ui/screens/draw — inicio de run y pantalla del sorteo de
   grupos (los 12 grupos con el del usuario resaltado).
   ============================================================ */
import { getTeam } from "../../data/teams-repo.js";
import { newRun } from "../../game/run.js";
import { teamRating } from "../../game/ratings.js";
import { S } from "../session.js";
import { register, go } from "../nav.js";
import { screenShell, $, flagImg, teamChip } from "../components.js";
import { applyTeamColors, BALL_SVG } from "../theme.js";

/** Inicia una run con el equipo elegido: crea el estado, aplica sus colores y muestra el sorteo. */
function startRun(teamId) {
  S.run = newRun(teamId);
  applyTeamColors(getTeam(teamId));
  renderDraw();
}

/** Pantalla de sorteo: los 12 grupos con el del usuario resaltado. */
function renderDraw() {
  const run = S.run;
  const me = getTeam(run.teamId);
  screenShell(`
    <div class="text-center mb-6">
      <div class="w-12 h-12 mx-auto mb-2 animate-floaty">${BALL_SVG}</div>
      <h1 class="text-3xl font-black gold-text">SORTEO OFICIAL</h1>
      <div class="tricolor-bar max-w-xs mx-auto mt-2 mb-3"></div>
      <p class="text-slate-400 mt-1">Juegas con ${teamChip(me, "font-bold text-slate-100")} — te tocó el <span class="tp-text font-bold">Grupo ${run.groups[run.myGroupIdx].name}</span></p>
    </div>
    <div class="grid grid-cols-2 md:grid-cols-4 gap-3">
      ${run.groups.map((g, gi) => `
        <div class="rounded-xl border ${gi === run.myGroupIdx ? "tp-border tp-bg-soft tp-ring" : "border-slate-700 bg-slate-800/60"} p-3">
          <div class="font-black text-center mb-2 ${gi === run.myGroupIdx ? "tp-text" : "text-slate-400"}">GRUPO ${g.name}</div>
          ${g.teamIds.map(id => {
            const t = getTeam(id);
            const mine = id === run.teamId;
            return `<div class="flex items-center justify-between gap-1 py-0.5 ${mine ? "font-bold tp-text" : "text-slate-300"} text-sm">
              <span class="truncate flex items-center gap-1.5">${flagImg(t, "w-5 h-3.5 shrink-0")}<span class="truncate">${t.name}</span></span><span class="text-[10px] text-slate-400 font-bold">${teamRating(t)}</span>
            </div>`;
          }).join("")}
        </div>`).join("")}
    </div>
    <div class="text-center mt-6">
      <button id="btn-continue" class="btn-primary">Comenzar la aventura →</button>
    </div>
  `);
  $("#btn-continue").onclick = () => go("hub");
}

register("start-run", startRun);
