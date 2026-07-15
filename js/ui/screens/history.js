/* ============================================================
   ui/screens/history — historial de runs pasadas (persistencia
   vía storage/history.js).
   ============================================================ */
import { getTeam } from "../../data/teams-repo.js";
import { register, go } from "../nav.js";
import { screenShell, $, flagImg } from "../components.js";
import { getHistory } from "../../storage/history.js";

/** Pantalla de historial: lista de runs pasadas con su resultado. */
function renderHistory() {
  const h = getHistory();
  screenShell(`
    <button id="btn-back" class="text-slate-400 hover:text-white mb-6 cursor-pointer">← Volver al menú</button>
    <h1 class="text-3xl font-black mb-6">📜 Historial de partidas</h1>
    ${h.length === 0 ? `<p class="text-slate-400">Aún no hay partidas jugadas. ¡La historia se escribe en la cancha!</p>` : `
    <div class="space-y-2">
      ${h.map(e => {
        const t = getTeam(e.teamId);
        return `<div class="bg-slate-800/70 border ${e.champion ? "border-amber-400" : "border-slate-700"} rounded-xl px-4 py-3 flex items-center justify-between flex-wrap gap-2">
          <div class="flex items-center gap-3">
            ${t ? flagImg(t, "w-8 h-[1.4rem]") : ""}
            <div>
              <div class="font-bold">${t ? t.name : e.teamId} ${e.champion ? "🏆 ¡CAMPEÓN!" : ""}</div>
              <div class="text-xs text-slate-400">${e.date} · Llegó a: ${e.stageLabel}</div>
            </div>
          </div>
          <div class="text-sm text-slate-300 text-right">
            <div>${e.pg}G ${e.pe}E ${e.pp}P · ${e.gf}:${e.gc}</div>
            <div class="text-xs text-slate-400">Goleador: ${e.topScorer}</div>
          </div>
        </div>`;
      }).join("")}
    </div>`}
  `);
  $("#btn-back").onclick = () => go("menu");
}

register("history", renderHistory);
