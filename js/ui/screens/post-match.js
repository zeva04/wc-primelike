/* ============================================================
   ui/screens/post-match — pantalla de resultados y ruteo tras
   un partido. Desde F7 la orquestación vive en el motor
   (game/flow.js: closeMatch + advanceStage); aquí solo se pinta
   y se navega según el desenlace.
   ============================================================ */
import { getTeam } from "../../data/teams-repo.js";
import { closeMatch, advanceStage } from "../../game/flow.js";
import { MOMENTO_LABELS } from "../../game/momentum.js";
import { S } from "../session.js";
import { register, go } from "../nav.js";
import { screenShell, $, flagImg, modal, closeModal } from "../components.js";
import { renderGroupTableCard } from "./worldcup.js";
import { stopTimer } from "./match.js";

/** Cierra el partido en el motor y pinta los resultados (o va directo al desenlace tras la final). */
function finishMatch() {
  closeModal();
  stopTimer();
  const { res, advanced, momentum, morale } = closeMatch(S.run, S.match);
  // Tras la FINAL no hay más ronda que mostrar: directo al desenlace (campeón o eliminado).
  if (S.run.stage === "final") { routeAdvance(advanced); return; }
  renderPostMatch(res, advanced, momentum, morale);
}

/**
 * Análisis del cuerpo técnico: el resumen anímico del plantel tras el partido (reemplaza a
 * los otros marcadores). Arriba la Moral del EQUIPO (la mueve el resultado) y debajo el
 * Momento de cada jugador que se movió — su nivel antes → después (cualitativo) y las
 * razones que lo explican (`reasons`, las narra el motor).
 */
function analisisCard(momentum, morale) {
  const moved = (momentum || []).filter(m => m.delta !== 0 || m.reasons.length);
  moved.sort((a, b) => b.delta - a.delta || b.after - a.after);
  const dirIcon = m => m.delta > 0 ? `<span class="text-emerald-400">▲</span>` : m.delta < 0 ? `<span class="text-sky-400">▼</span>` : `<span class="text-slate-500">•</span>`;
  const afterCls = m => m.delta > 0 ? "text-emerald-400" : m.delta < 0 ? "text-sky-400" : "text-slate-300";
  const mCls = morale && morale.delta > 0 ? "text-emerald-400" : morale && morale.delta < 0 ? "text-sky-400" : "text-slate-300";
  const moraleBlock = morale ? `
    <div class="rounded-xl border border-slate-700 bg-slate-900/60 p-3 mb-3">
      <div class="flex items-center justify-between gap-2 flex-wrap">
        <span class="text-sm font-semibold">🫂 Moral del equipo</span>
        <span class="text-sm">${morale.bandBefore.icon} ${morale.bandBefore.label} <span class="text-slate-500">→</span> <b class="${mCls}">${morale.bandAfter.icon} ${morale.bandAfter.label}</b>${morale.delta !== 0 ? ` <b class="${mCls}">(${morale.delta > 0 ? "+" : ""}${morale.delta})</b>` : ""}</span>
      </div>
      <div class="text-[11px] text-slate-500 mt-0.5">${morale.reasons.join(" · ")}</div>
    </div>` : "";
  return `<div class="bg-slate-800/60 border border-slate-700 rounded-2xl p-4">
    <h3 class="font-bold flex items-center gap-2">🧠 Análisis del cuerpo técnico</h3>
    <p class="text-[11px] text-slate-500 mt-0.5 mb-3">Cómo movió el partido el ánimo del plantel.</p>
    ${moraleBlock}
    <div class="text-[10px] uppercase tracking-wider text-slate-500 font-bold mb-1.5">Momento de los jugadores</div>
    ${moved.length ? `<div class="space-y-2.5">${moved.map(m => `
      <div class="flex items-start gap-2.5">
        <span class="text-sm font-black w-4 text-center mt-0.5">${dirIcon(m)}</span>
        <div class="flex-1 min-w-0">
          <div class="text-sm flex items-center gap-2 flex-wrap">
            <b>${m.name}</b>
            <span class="text-[11px] text-slate-400">${MOMENTO_LABELS[m.before]} → <b class="${afterCls(m)}">${MOMENTO_LABELS[m.after]}</b></span>
          </div>
          <div class="text-[11px] text-slate-500">${m.reasons.map(r => r.text).join(" · ") || "—"}</div>
        </div>
      </div>`).join("")}</div>`
      : `<p class="text-sm text-slate-500">El partido no movió el Momento individual.</p>`}
  </div>`;
}

/**
 * Pantalla post-partido: resultado, goleadores y el análisis del cuerpo técnico (Moral +
 * Momento). En fase de grupos va a 2 columnas (tabla del grupo + análisis); en
 * eliminatorias, a UNA columna centrada — sin celdas vacías ocupando espacio.
 */
function renderPostMatch(res, advanced, momentum, morale) {
  const run = S.run, match = S.match;
  const me = getTeam(run.teamId), opp = match.oppTeam;
  const won = res.winner === "my";
  const pensTxt = res.pens ? ` (${res.pens.myGoals}-${res.pens.oppGoals} en penales)` : "";
  const headline = won ? "🎉 ¡VICTORIA!" : res.winner === "opp" ? "😞 Derrota" : "🤝 Empate";
  const myScorers = match.scorers.map(s => `⚽ ${s.name} ${s.min}'`).join(" · ") || "Sin goles propios";
  const analysis = analisisCard(momentum, morale);

  screenShell(`
    <div class="text-center mb-6 mt-4">
      <h1 class="text-3xl font-black">${headline}</h1>
      <div class="text-5xl font-black mt-3 tabular-nums flex items-center justify-center gap-4">${flagImg(me, "w-14 h-10", true)} <span>${res.gMy} - ${res.gOpp}</span> ${flagImg(opp, "w-14 h-10", true)}</div>
      <div class="text-amber-400 text-sm mt-1">${pensTxt}</div>
      <div class="text-slate-400 text-sm mt-2">${myScorers}</div>
      <div class="text-slate-500 text-xs mt-1">Tiros: ${match.stats.misTiros} vs ${match.stats.oppTiros} · Decisiones tomadas: ${match.stats.decisiones}</div>
    </div>
    ${run.stage === "groups"
      ? `<div class="grid md:grid-cols-2 gap-4 mb-6 md:items-start"><div>${renderGroupTableCard()}</div><div>${analysis}</div></div>`
      : `<div class="max-w-lg mx-auto mb-6">${analysis}</div>`}
    <div class="text-center">
      <button id="btn-next" class="btn-primary text-lg">Continuar →</button>
    </div>
  `);
  $("#btn-next").onclick = () => routeAdvance(advanced);
}

/** Avanza el torneo en el motor y navega según el desenlace. */
function routeAdvance(advanced) {
  const out = advanceStage(S.run, advanced);
  if (out.type === "eliminated") return go("end-run", false);
  if (out.type === "champion") return go("end-run", true);
  if (out.type === "qualified") return showQualifiedModal(out.myPos);
  // El partido consumió su día: al volver al hub arranca el DÍA SIGUIENTE (no el del partido).
  go("hub", { autoAdvance: true }); // next-matchday | next-round
}

/** Modal de celebración al clasificar a la fase eliminatoria. */
function showQualifiedModal(myPos) {
  const g = S.run.groups[S.run.myGroupIdx];
  const m = modal(`
    <div class="text-center">
      <div class="text-5xl mb-2">🎊</div>
      <h2 class="text-2xl font-black mb-2">¡CLASIFICADOS!</h2>
      <p class="text-slate-300 text-sm mb-4">Terminaste <b>${myPos}º del Grupo ${g.name}</b> y avanzas a los 16avos de final. Desde aquí, todo es a vida o muerte.</p>
      <button id="q-next" class="btn-primary">Ver el cruce →</button>
    </div>
  `);
  m.querySelector("#q-next").onclick = () => { closeModal(); go("hub", { autoAdvance: true }); };
}

register("finish-match", finishMatch);
