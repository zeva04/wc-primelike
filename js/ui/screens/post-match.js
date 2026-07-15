/* ============================================================
   ui/screens/post-match — pantalla de resultados y ruteo tras
   un partido. Desde F7 la orquestación vive en el motor
   (game/flow.js: closeMatch + advanceStage); aquí solo se pinta
   y se navega según el desenlace.
   ============================================================ */
import { getTeam } from "../../data/teams-repo.js";
import { closeMatch, advanceStage } from "../../game/flow.js";
import { S } from "../session.js";
import { register, go } from "../nav.js";
import { screenShell, $, flagImg, modal, closeModal } from "../components.js";
import { renderGroupTableCard } from "./worldcup.js";
import { stopTimer } from "./match.js";

/** Cierra el partido en el motor y pinta los resultados (o va directo al desenlace tras la final). */
function finishMatch() {
  closeModal();
  stopTimer();
  const { res, otherResults, advanced } = closeMatch(S.run, S.match);
  // Tras la FINAL no hay más ronda que mostrar: directo al desenlace (campeón o eliminado).
  if (S.run.stage === "final") { routeAdvance(advanced); return; }
  renderPostMatch(res, otherResults, advanced);
}

/**
 * Pantalla post-partido: resultado, goleadores y los otros marcadores. En fase de
 * grupos va a 2 columnas (tabla + resultados); en eliminatorias, a UNA columna
 * centrada — sin celdas vacías ocupando espacio.
 */
function renderPostMatch(res, otherResults, advanced) {
  const run = S.run, match = S.match;
  const me = getTeam(run.teamId), opp = match.oppTeam;
  const won = res.winner === "my";
  const pensTxt = res.pens ? ` (${res.pens.myGoals}-${res.pens.oppGoals} en penales)` : "";
  const headline = won ? "🎉 ¡VICTORIA!" : res.winner === "opp" ? "😞 Derrota" : "🤝 Empate";
  const myScorers = match.scorers.map(s => `⚽ ${s.name} ${s.min}'`).join(" · ") || "Sin goles propios";

  const resultsCard = `<div class="bg-slate-800/60 border border-slate-700 rounded-2xl p-4">
    <h3 class="font-bold mb-2">${run.stage === "groups" ? "Otros resultados del grupo" : "Resultados de la ronda"}</h3>
    ${otherResults.length ? otherResults.map(r => {
      const A = getTeam(r.a), B = getTeam(r.b);
      return `<div class="text-sm py-1 flex justify-between items-center text-slate-300"><span class="inline-flex items-center gap-1.5">${flagImg(A, "w-5 h-3.5")} ${A.name} - ${B.name} ${flagImg(B, "w-5 h-3.5")}</span><span class="font-bold">${r.gA}-${r.gB}${r.pens ? " (p)" : ""}</span></div>`;
    }).join("") : `<p class="text-sm text-slate-500">—</p>`}
  </div>`;

  screenShell(`
    <div class="text-center mb-6 mt-4">
      <h1 class="text-3xl font-black">${headline}</h1>
      <div class="text-5xl font-black mt-3 tabular-nums flex items-center justify-center gap-4">${flagImg(me, "w-14 h-10", true)} <span>${res.gMy} - ${res.gOpp}</span> ${flagImg(opp, "w-14 h-10", true)}</div>
      <div class="text-amber-400 text-sm mt-1">${pensTxt}</div>
      <div class="text-slate-400 text-sm mt-2">${myScorers}</div>
      <div class="text-slate-500 text-xs mt-1">Tiros: ${match.stats.misTiros} vs ${match.stats.oppTiros} · Decisiones tomadas: ${match.stats.decisiones}</div>
    </div>
    ${run.stage === "groups"
      ? `<div class="grid md:grid-cols-2 gap-4 mb-6 md:items-start"><div>${renderGroupTableCard()}</div><div>${resultsCard}</div></div>`
      : `<div class="max-w-md mx-auto mb-6">${resultsCard}</div>`}
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
  go("hub"); // next-matchday | next-round
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
  m.querySelector("#q-next").onclick = () => { closeModal(); go("hub"); };
}

register("finish-match", finishMatch);
