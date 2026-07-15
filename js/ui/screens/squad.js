/* ============================================================
   ui/screens/squad — Gestión de Plantilla: armar la alineación
   de 6, ver formación y stats.

   Las reglas de alineación viven en game/lineup.js (F7):
   esta pantalla solo pinta y captura clics.
   ============================================================ */
import { getTeam } from "../../data/teams-repo.js";
import { playerOverall, playerStars, teamRating, teamStars, statLine } from "../../game/ratings.js";
import { autoLineup, validateLineup, formationLabel } from "../../game/lineup.js";
import { S } from "../session.js";
import { register, go } from "../nav.js";
import { screenShell, $, flagImg, starsHtml, posBadge, numTag, energyBar, toast } from "../components.js";
import { spriteSvg } from "../sprites.js";

/**
 * Gestión de Plantilla: pantalla propia para armar la alineación (6 titulares),
 * ver la formación y las stats del plantel. Se llega desde la media del equipo en el hub.
 */
function renderSquadScreen() {
  const me = getTeam(S.run.teamId);
  const available = S.run.squad.filter(p => !p.suspendido && p.lesionadoPartidos === 0);
  if (!S.selectedLineup.length || !S.selectedLineup.every(p => available.includes(p))) {
    S.selectedLineup = autoLineup(available);
  }
  screenShell(`
    <button id="btn-back" class="text-slate-400 hover:text-white mb-4 cursor-pointer">← Volver a la concentración</button>
    <div class="flex items-center justify-between flex-wrap gap-3 mb-4">
      <h1 class="text-2xl font-black flex items-center gap-2">${flagImg(me, "w-8 h-[1.4rem]")} Gestión de Plantilla</h1>
      <div class="text-sm">${starsHtml(teamStars(me))} <span class="text-amber-300 font-black ml-1">Media ${teamRating(me)}</span></div>
    </div>
    <div class="bg-slate-800/60 border border-slate-700 rounded-2xl p-4">
      <div class="flex items-center justify-between mb-1">
        <h3 class="font-bold">📋 Titulares <span class="text-slate-500 text-xs">(6 en cancha)</span></h3>
        <button id="btn-auto" class="text-xs tp-text hover:opacity-80 cursor-pointer font-semibold">⚡ Auto</button>
      </div>
      <p class="text-xs text-slate-400 mb-3">1 POR + 1 DEF + 1 MED + 1 DEL + <span class="tp-text">2 extras flexibles</span> (los extras definen tu formación).</p>
      <div id="lineup-status" class="text-sm mb-2"></div>
      <div class="space-y-1.5" id="squad-list"></div>
    </div>
    <button id="btn-confirm" class="btn-primary w-full mt-4">✔ Confirmar y volver</button>
  `);
  $("#btn-back").onclick = () => go("hub");
  $("#btn-confirm").onclick = () => go("hub");
  $("#btn-auto").onclick = () => { S.selectedLineup = autoLineup(available); renderSquadList(available); };
  renderSquadList(available);
}

/** Pinta la lista del plantel (clic = titular/suplente) y actualiza el estado del botón de jugar. */
function renderSquadList(available) {
  const el = $("#squad-list");
  if (!el) return;
  el.innerHTML = S.run.squad.map(p => {
    const sel = S.selectedLineup.includes(p);
    const out = p.suspendido || p.lesionadoPartidos > 0;
    const reason = p.suspendido ? "🟥 Suspendido" : p.lesionadoPartidos > 0 ? `🚑 Lesionado (${p.lesionadoPartidos} partido${p.lesionadoPartidos > 1 ? "s" : ""})` : "";
    return `<div data-player="${p.name}" class="squad-row flex items-center gap-2 px-3 py-1 rounded-lg border transition-all ${out ? "opacity-40 border-slate-800 cursor-not-allowed" : sel ? "tp-border tp-bg-soft cursor-pointer" : "border-slate-700 bg-slate-800/40 hover:border-slate-500 cursor-pointer"}">
      <span class="w-4 text-center">${sel ? "✅" : ""}</span>
      ${spriteSvg(p, getTeam(S.run.teamId))}
      ${numTag(p)}
      ${posBadge(p.pos)}
      <span class="flex-1 font-medium text-sm truncate">${p.name} ${out ? `<span class="text-[10px]">${reason}</span>` : p.amarillas > 0 ? `<span class="text-[10px] text-yellow-400 font-bold" title="Con otra amarilla queda suspendido un partido">🟨 apercibido</span>` : ""}</span>
      <span class="text-amber-300 font-black text-sm w-7 text-right">${playerOverall(p)}</span>
      ${starsHtml(playerStars(p), "text-[10px]")}
      <span class="text-[10px] text-slate-400 w-32 hidden sm:block">${statLine(p)}</span>
      <span class="w-14">${energyBar(p.energia)}</span>
    </div>`;
  }).join("");

  el.querySelectorAll(".squad-row").forEach(row => row.onclick = () => {
    const p = S.run.squad.find(x => x.name === row.dataset.player);
    if (p.suspendido || p.lesionadoPartidos > 0) return;
    if (S.selectedLineup.includes(p)) S.selectedLineup = S.selectedLineup.filter(x => x !== p);
    else if (S.selectedLineup.length < 6) S.selectedLineup.push(p);
    else return toast("Ya tienes 6 titulares. Quita uno primero.");
    renderSquadList(available);
  });

  const v = validateLineup(available, S.selectedLineup);
  const st = $("#lineup-status");
  if (st) st.innerHTML = v.ok
    ? `<span class="tp-text font-semibold">✅ Formación ${formationLabel(S.selectedLineup)}</span>`
    : `<span class="text-amber-400">⚠️ ${v.msg}</span>`;
  // El botón de jugar vive en el hub; si estamos en Gestión de Plantilla no existe
  const play = $("#btn-play");
  if (play) {
    play.disabled = !v.ok;
    play.classList.toggle("opacity-40", !v.ok);
    play.classList.toggle("cursor-not-allowed", !v.ok);
  }
}

register("squad", renderSquadScreen);
