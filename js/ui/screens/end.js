/* ============================================================
   ui/screens/end — fin de la run (campeón, eliminado o
   abandonado): última página del diario, historial persistido
   y pantalla de desenlace con estadísticas.
   ============================================================ */
import { getTeam } from "../../data/teams-repo.js";
import { addJournal } from "../../game/journal.js";
import { STAGE_LABEL } from "../../game/tournament/knockout.js";
import { S } from "../session.js";
import { register, go } from "../nav.js";
import { screenShell, $, flagImg, closeModal } from "../components.js";
import { TROPHY_SVG } from "../theme.js";
import { saveHistoryEntry } from "../../storage/history.js";
import { stopTimer } from "./match/index.js";

// Datos del desenlace actual (para re-render al volver desde el Diario sin re-guardar)
let lastEnd = null;

/** Cierra la run: diario, historial y pantalla de desenlace. */
function endRun(champion, abandoned = false) {
  stopTimer(); closeModal();
  const run = S.run;
  run.champion = champion;
  const me = getTeam(run.teamId);
  const top = run.squad.slice().sort((a, b) => (b.goles || 0) - (a.goles || 0))[0];
  const topTxt = top && top.goles ? `${top.name} (${top.goles} goles)` : "Nadie marcó";
  const stageLabel = champion ? "🏆 CAMPEÓN DEL MUNDO" : (run.stage === "groups" ? "Fase de grupos" : STAGE_LABEL[run.stage]);

  // Última página del diario: el desenlace de la historia
  addJournal(run, {
    icon: champion ? "🏆" : abandoned ? "🏳️" : "💔",
    tone: champion ? "gold" : "bad",
    title: champion ? `¡${me.name.toUpperCase()} CAMPEÓN DEL MUNDO!` : abandoned ? "Torneo abandonado" : "Fin de la aventura",
    desc: champion ? "La copa vuelve a casa. Leyenda absoluta." : `${me.name} llegó hasta: ${stageLabel}.`,
  });

  saveHistoryEntry({
    date: new Date().toLocaleDateString("es-CL", { day: "2-digit", month: "short", year: "numeric" }),
    teamId: run.teamId, champion, stageLabel,
    pg: run.stats.pg, pe: run.stats.pe, pp: run.stats.pp,
    gf: run.stats.gf, gc: run.stats.gc, topScorer: topTxt,
  });
  lastEnd = { champion, abandoned, me, topTxt, stageLabel };
  renderEndScreen();
}

/** Pantalla de desenlace (separada de endRun para poder volver desde el Diario sin re-guardar). */
function renderEndScreen() {
  const { champion, abandoned, me, topTxt, stageLabel } = lastEnd;
  const run = S.run;
  screenShell(`
    <div class="text-center mt-10">
      ${champion ? `<div class="w-32 h-44 mx-auto mb-4">${TROPHY_SVG}</div>` : `<div class="text-7xl mb-4">${abandoned ? "🏳️" : "💔"}</div>`}
      <h1 class="text-4xl font-black ${champion ? "bg-gradient-to-r from-amber-300 to-yellow-500 bg-clip-text text-transparent" : ""}">${champion ? `¡${me.name.toUpperCase()} CAMPEÓN DEL MUNDO!` : abandoned ? "Torneo abandonado" : "Fin de la aventura"}</h1>
      <p class="text-slate-400 mt-2 flex items-center justify-center gap-2">${champion ? "La copa vuelve a casa. Leyenda absoluta." : `${flagImg(me, "w-6 h-4")} ${me.name} llegó hasta: <b class="text-slate-200">${stageLabel}</b>`}</p>

      <div class="max-w-md mx-auto mt-8 bg-slate-800/70 border border-slate-600 rounded-2xl p-6 text-left">
        <h3 class="font-bold text-center mb-4 uppercase tracking-widest text-xs text-slate-400">Estadísticas de tu equipo</h3>
        <div class="grid grid-cols-3 gap-3 text-center mb-4">
          <div><div class="text-2xl font-black text-emerald-400">${run.stats.pg}</div><div class="text-xs text-slate-400">Ganados</div></div>
          <div><div class="text-2xl font-black text-slate-300">${run.stats.pe}</div><div class="text-xs text-slate-400">Empatados</div></div>
          <div><div class="text-2xl font-black text-red-400">${run.stats.pp}</div><div class="text-xs text-slate-400">Perdidos</div></div>
        </div>
        <div class="space-y-1.5 text-sm text-slate-300">
          <div class="flex justify-between"><span>⚽ Goles a favor / en contra</span><b>${run.stats.gf} / ${run.stats.gc}</b></div>
          <div class="flex justify-between"><span>👑 Goleador</span><b>${topTxt}</b></div>
          <div class="flex justify-between"><span>🧤 Penales atajados</span><b>${run.stats.penalesAtajados}</b></div>
          <div class="flex justify-between"><span>🎲 Eventos enfrentados</span><b>${run.stats.eventos}</b></div>
          <div class="flex justify-between"><span>🎁 Oportunidades únicas</span><b>${run.stats.oppOfrecidas ? `aprovechaste ${run.stats.oppAprovechadas} de ${run.stats.oppOfrecidas}` : "no apareció ninguna"}</b></div>
        </div>
      </div>

      <div class="mt-8 flex gap-3 justify-center flex-wrap">
        <button id="btn-again" class="btn-primary">🔄 Jugar otra vez</button>
        <button id="btn-endjournal" class="px-5 py-2.5 rounded-xl border border-amber-500/60 text-amber-300 hover:bg-amber-500/10 font-semibold cursor-pointer">📖 Revivir la campaña</button>
        <button id="btn-menu" class="px-5 py-2.5 rounded-xl border border-slate-600 hover:bg-slate-700 font-semibold cursor-pointer">Menú principal</button>
      </div>
    </div>
  `);
  $("#btn-again").onclick = () => go("start-run", S.run.teamId);
  $("#btn-endjournal").onclick = () => go("journal", "end-screen");
  $("#btn-menu").onclick = () => go("menu");
}

register("end-run", endRun);
register("end-screen", renderEndScreen);
