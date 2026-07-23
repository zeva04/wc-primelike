/* ============================================================
   ui/screens/identity — inicio de run y ELECCIÓN DE IDENTIDAD
   (arco de Filosofía F1, decisión PO #1: se elige apenas
   confirmado el equipo, antes de ver el sorteo — el grupo no
   influye en quién decides ser). Las 4 cards muestran fortaleza
   Y vulnerabilidad (Bible §5 regla 4: se elige informado, no hay
   build sin costo).
   ============================================================ */
import { getTeam } from "../../data/teams-repo.js";
import { newRun } from "../../game/run.js";
import { PHILOSOPHIES, aristaById } from "../../content/philosophies.js";
import { ADVANCED_BY_FILO } from "../../content/sequences.js";
import { choosePhilosophy } from "../../game/philosophy.js";
import { S } from "../session.js";
import { register, go } from "../nav.js";
import { screenShell, $, flagImg } from "../components.js";
import { applyTeamColors } from "../theme.js";

/** Inicia una run con el equipo elegido: crea el estado, aplica sus colores y pide la identidad. */
function startRun(teamId) {
  S.run = newRun(teamId);
  applyTeamColors(getTeam(teamId));
  renderChooseIdentity();
}

/** Pantalla previa al sorteo: confirmar el equipo (o volver a elegir) y la identidad, en 2×2. */
function renderChooseIdentity() {
  const run = S.run;
  const me = getTeam(run.teamId);
  screenShell(`
    <div class="text-center mb-6">
      <div class="flex items-center justify-center gap-2.5 mb-1">
        ${flagImg(me, "w-9 h-6")}
        <h1 class="text-2xl font-black">${me.name}</h1>
      </div>
      <div class="tricolor-bar max-w-xs mx-auto mt-2 mb-4"></div>
      <h2 class="text-xl font-black">🧭 Elige tu identidad</h2>
      <p class="text-xs text-slate-400 mt-1 max-w-2xl mx-auto">Tu filosofía decide qué fútbol GENERA cada partido — y se entrena día a día. Toda identidad tiene su contra: no hay elección gratis. Podrás cambiarla a mitad de camino, pero cuesta un día entero.</p>
    </div>
    <div class="grid grid-cols-2 gap-3 max-w-3xl mx-auto">
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
    <div class="flex items-center justify-center gap-4 mt-6">
      <button id="btn-back-team" class="text-slate-400 hover:text-white cursor-pointer">← Volver a elegir equipo</button>
      <button id="btn-continue" disabled class="btn-primary opacity-40 cursor-not-allowed" title="Primero elige tu identidad">Confirmar →</button>
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
  $("#btn-back-team").onclick = () => go("menu");
  $("#btn-continue").onclick = () => {
    if (!elegida) return;
    choosePhilosophy(S.run, elegida);
    // Arco de Rasgos (T1, decisión PO): elegir filosofía acredita el PI del nivel 1
    // y lleva DIRECTO al árbol — el 1-de-3 de rasgos básicos es la segunda decisión
    // de identidad de la run. De ahí, al sorteo.
    go("philosophy", { onboarding: true });
  };
}

register("start-run", startRun);
