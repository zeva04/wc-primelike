/* ============================================================
   ui/screens/draw — inicio de run y pantalla del sorteo de
   grupos (los 12 grupos con el del usuario resaltado), más la
   ELECCIÓN DE IDENTIDAD (arco de Filosofía F1, decisión PO #1:
   se elige tras el sorteo — ves tu grupo y decides quién ser).
   Las 4 cards muestran fortaleza Y vulnerabilidad (Bible §5
   regla 4: se elige informado, no hay build sin costo).
   ============================================================ */
import { getTeam } from "../../data/teams-repo.js";
import { newRun } from "../../game/run.js";
import { teamRating } from "../../game/ratings.js";
import { PHILOSOPHIES, aristaById } from "../../content/philosophies.js";
import { ADVANCED_BY_FILO } from "../../content/sequences.js";
import { choosePhilosophy } from "../../game/philosophy.js";
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
    <div class="text-center mt-8 mb-3">
      <h2 class="text-xl font-black">🧭 Elige tu identidad</h2>
      <p class="text-xs text-slate-400 mt-1 max-w-2xl mx-auto">Tu filosofía decide qué fútbol GENERA cada partido — y se entrena día a día. Toda identidad tiene su contra: no hay elección gratis. Podrás cambiarla a mitad de camino, pero cuesta un día entero.</p>
    </div>
    <div class="grid sm:grid-cols-2 xl:grid-cols-4 gap-3">
      ${PHILOSOPHIES.map(p => `
        <button data-filo="${p.id}" class="filo-card text-left rounded-xl border border-slate-700 bg-slate-800/60 p-3.5 cursor-pointer transition-all hover:border-slate-500 flex flex-col gap-1.5">
          <div class="font-black text-base">${p.icon} ${p.name}</div>
          <div class="text-[10px] text-slate-400 italic leading-snug">${p.lema}</div>
          <div class="flex flex-wrap gap-1 my-0.5">
            ${p.aristas.map(k => { const a = aristaById(k); return `<span class="px-1.5 py-0.5 rounded-full border border-slate-600 bg-slate-900/60 text-[9px] font-bold text-slate-300">${a.icon} ${a.label}</span>`; }).join("")}
          </div>
          <div class="text-[10px] text-emerald-400 leading-snug">✓ ${p.fuerte}</div>
          <div class="text-[10px] text-amber-400 leading-snug">⚠️ ${p.advertencia}</div>
          <div class="text-[10px] text-slate-500 leading-snug mt-auto">🔓 En desarrollo: ${ADVANCED_BY_FILO[p.id].icon} <b>${ADVANCED_BY_FILO[p.id].name}</b>, tu fútbol superior · 🏆 Consolidada lo profundiza</div>
        </button>`).join("")}
    </div>
    <div class="text-center mt-6">
      <button id="btn-continue" disabled class="btn-primary opacity-40 cursor-not-allowed" title="Primero elige tu identidad">Comenzar la aventura →</button>
    </div>
  `);
  let elegida = null;
  document.querySelectorAll(".filo-card").forEach(b => b.onclick = () => {
    elegida = b.dataset.filo;
    document.querySelectorAll(".filo-card").forEach(x => x.classList.remove("tp-border", "tp-ring", "tp-bg-soft"));
    b.classList.add("tp-border", "tp-ring", "tp-bg-soft");
    const btn = $("#btn-continue");
    btn.disabled = false;
    btn.classList.remove("opacity-40", "cursor-not-allowed");
    btn.title = "";
  });
  $("#btn-continue").onclick = () => {
    if (!elegida) return;
    choosePhilosophy(S.run, elegida);
    go("hub");
  };
}

register("start-run", startRun);
