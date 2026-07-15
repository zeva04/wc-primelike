/* ============================================================
   ui/screens/journal — Diario de Campaña (Game Vision: "el
   calendario es la memoria de la run"): todas las entradas
   agrupadas por día, en orden cronológico.
   ============================================================ */
import { getTeam } from "../../data/teams-repo.js";
import { dayLabel } from "../../game/calendar.js";
import { S } from "../session.js";
import { register, go } from "../nav.js";
import { screenShell, $, flagImg } from "../components.js";

/**
 * Pantalla del diario. `back` es el NOMBRE de la pantalla a la que vuelve
 * ("hub" durante la run, "end-screen" desde el desenlace).
 */
function renderJournal(back = "hub") {
  const run = S.run;
  const TONE = {
    gold: "border-amber-400/70 bg-amber-500/10",
    good: "border-emerald-500/50 bg-emerald-500/5",
    bad: "border-red-500/50 bg-red-500/5",
    neutral: "border-slate-600 bg-slate-800/40",
  };
  // Agrupa entradas consecutivas del mismo día bajo una sola cabecera de fecha
  const byDay = [];
  for (const e of run.journal) {
    const last = byDay[byDay.length - 1];
    if (last && last.day === e.day) last.entries.push(e);
    else byDay.push({ day: e.day, entries: [e] });
  }
  const me = getTeam(run.teamId);
  screenShell(`
    <button id="btn-back" class="text-slate-400 hover:text-white mb-4 cursor-pointer">← Volver</button>
    <div class="flex items-center justify-between flex-wrap gap-2 mb-1">
      <h1 class="text-2xl font-black flex items-center gap-2">${flagImg(me, "w-8 h-[1.4rem]")} 📖 Diario de Campaña</h1>
      <span class="text-xs text-slate-500">${run.journal.length} momento${run.journal.length !== 1 ? "s" : ""}</span>
    </div>
    <p class="text-xs text-slate-500 mb-5">La historia de tu Mundial, día a día. Cada decisión quedó escrita aquí.</p>
    <div class="space-y-4 max-w-2xl">
      ${byDay.map(g => `
        <div>
          <div class="text-[10px] uppercase tracking-widest font-bold tp-text mb-1.5">${dayLabel(g.day)} · Día ${g.day}</div>
          <div class="space-y-1.5">
            ${g.entries.map(e => `
              <div class="rounded-xl border ${TONE[e.tone] || TONE.neutral} px-3 py-2 flex items-start gap-2.5 text-left">
                <span class="text-xl leading-none mt-0.5 shrink-0">${e.icon}</span>
                <div class="min-w-0">
                  <div class="font-bold text-sm">${e.title}</div>
                  ${e.desc ? `<div class="text-xs text-slate-400">${e.desc}</div>` : ""}
                </div>
              </div>`).join("")}
          </div>
        </div>`).join("")}
    </div>
  `);
  $("#btn-back").onclick = () => go(back);
}

register("journal", renderJournal);
