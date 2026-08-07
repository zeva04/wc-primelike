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
import { screenShell, $, flagImg, modal, closeModal, heatPitch } from "../components.js";
import { heatCells, heatHalves } from "../../game/match/field.js";
import { renderGroupTableCard } from "./worldcup.js";
import { stopTimer } from "./match/index.js";

// Guardas de UN SOLO DISPARO para el cierre del partido (bug del PO, "los días
// posteriores al juego a veces tenían doble evento"). Tanto `finishMatch` como `routeAdvance`
// son alcanzables por más de un camino —el reloj del partido, el fin de la tanda, el botón
// Continuar, el modal de clasificados— y un doble disparo avanzaba DOS días de una: se
// mostraban dos eventos seguidos y se perdía un día de preparación. Se arman al cerrar el
// partido y se consumen una vez cada uno.
let cerrando = false;   // finishMatch en curso o ya hecho para este partido
let avanzando = false;  // routeAdvance ya disparado para este partido

/** Cierra el partido en el motor y pinta los resultados (o va directo al desenlace tras la final). */
function finishMatch() {
  if (cerrando) return; // el partido ya se está cerrando: ignorar el segundo disparo
  cerrando = true;
  avanzando = false;
  closeModal();
  stopTimer();
  const { res, advanced, momentum, morale, filoExec, filoCost } = closeMatch(S.run, S.match);
  // Tras la FINAL no hay más ronda que mostrar: directo al desenlace (campeón o eliminado).
  if (S.run.stage === "final") { routeAdvance(advanced); return; }
  renderPostMatch(res, advanced, momentum, morale, { filoExec, filoCost });
}

/**
 * Análisis del cuerpo técnico: el resumen anímico del plantel tras el partido (reemplaza a
 * los otros marcadores). Arriba la Moral del EQUIPO (la mueve el resultado) y debajo el
 * Momento de cada jugador que se movió — su nivel antes → después (cualitativo) y las
 * razones que lo explican (`reasons`, las narra el motor).
 *
 * ANTI-SPAM: se listan en detalle solo los MOVIMIENTOS
 * REALES — los que cambiaron por una acción del partido (gol, asistencia, corte, penal,
 * lesión). Los enfriamientos por no sumar minutos se colapsan en UNA línea desplegable:
 * antes ocupaban una fila por jugador y enterraban lo que de verdad importaba.
 * El criterio de corte es la primera razón del jugador (`decay`), no el signo del delta:
 * un enfriamiento y una mala actuación pueden dar el mismo −1 y no son lo mismo.
 */
const esDecaimiento = m => m.reasons.length > 0 && m.reasons.every(r => r.text.startsWith("No sumó minutos"));

/**
 * El bloque de IDENTIDAD del análisis: la progresión por ejecución que reportó el
 * cierre (jugar tu fútbol y que salga te consolida — Bible §5) y el costo físico del
 * Press si lo hubo. Nada que reportar → "" (sin ruido: el bloque solo habla si pasó algo).
 */
function filoBlock(filo) {
  if (!filo || (!filo.filoExec && !filo.filoCost)) return "";
  const x = filo.filoExec;
  // Una línea por filosofía que aprendió algo hoy: cuánta XP, de qué jugadas salió
  // (intención + aciertos) y si cruzó un nivel. Debajo, lo que eso le pagó al DT.
  const lineas = x ? x.filos.map(f => {
    const subio = f.ahora > f.antes;
    return `<div class="text-[11px] ${subio ? "text-amber-300" : "text-slate-300"} flex items-baseline gap-1.5">
      <span>${f.icon}</span>
      <b>${f.name}</b>
      <span class="${subio ? "text-amber-300" : "text-emerald-400"} font-bold">+${f.xp} XP</span>
      <span class="text-slate-500">(${f.intentos} jugada${f.intentos === 1 ? "" : "s"} · ${f.aciertos} acierto${f.aciertos === 1 ? "" : "s"}${f.mult !== 1 ? ` · ×${f.mult}` : ""})</span>
      ${subio ? `<span class="font-black">→ ¡NIVEL ${f.ahora + 1}!</span>` : ""}
    </div>`;
  }).join("") : "";
  const dtLine = x?.dt
    ? `<div class="text-[11px] mt-1.5 ${x.dt.pi ? "text-amber-300 font-bold" : "text-sky-300"}">🧠 El DT sumó <b>${x.dtXp} XP</b>${x.dt.pi ? ` y subió a nivel ${x.dt.nivel}: +${x.dt.pi} Punto${x.dt.pi > 1 ? "s" : ""} de Identidad para el árbol.` : ` de oficio (nivel ${x.dt.nivel}).`}</div>`
    : "";
  const exec = x
    ? `${lineas}${dtLine}`
    : `<div class="text-[11px] text-slate-500">Ninguna idea se ejercitó hoy: sin jugadas de identidad no hay experiencia.</div>`;
  const cost = filo.filoCost
    ? `<div class="text-[11px] text-amber-400/90 mt-0.5">🏃 El pressing pasó factura: −${-filo.filoCost.press} de energía extra a los ${filo.filoCost.jugadores} que corrieron.</div>`
    : "";
  return `<div class="rounded-xl border border-slate-700 bg-slate-900/60 p-3 mb-3">
    <div class="text-sm font-semibold mb-1">🧭 Identidad</div>
    ${exec}${cost}
  </div>`;
}

function analisisCard(momentum, morale, filo) {
  const all = (momentum || []).filter(m => m.delta !== 0 || m.reasons.length);
  const moved = all.filter(m => !esDecaimiento(m));
  const frios = all.filter(esDecaimiento);
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
    ${filoBlock(filo)}
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
    ${friosBlock(frios)}
  </div>`;
}

/**
 * Los que se enfriaron por no jugar, colapsados en una línea con `<details>` (cero JS:
 * el navegador maneja el desplegar). Se despliega y muestra la lista con su nivel nuevo.
 */
function friosBlock(frios) {
  if (!frios.length) return "";
  return `<details class="mt-3 group">
    <summary class="cursor-pointer list-none text-[11px] text-slate-500 hover:text-slate-300 transition-colors flex items-center gap-1.5">
      <span class="text-sky-400">▼</span>
      <span>${frios.length === 1 ? "1 jugador sin minutos enfrió su forma" : `${frios.length} jugadores sin minutos enfriaron su forma`}</span>
      <span class="text-slate-600 group-open:hidden">· ver</span>
    </summary>
    <div class="mt-2 pl-5 space-y-1">${frios.map(m => `
      <div class="text-[11px] text-slate-500 flex items-center gap-2 flex-wrap">
        <b class="text-slate-400">${m.name}</b>
        <span>${MOMENTO_LABELS[m.before]} → <b class="text-sky-400">${MOMENTO_LABELS[m.after]}</b></span>
      </div>`).join("")}</div>
  </details>`;
}

/**
 * DÓNDE SE JUGÓ EL PARTIDO: los mapas de calor del encuentro,
 * uno por tiempo — el motor los guarda separados porque cada tiempo tiene el suyo, y
 * puestos lado a lado cuentan la historia táctica del partido (el equipo que empujó en
 * el primero y se replegó en el segundo se VE, sin un solo número).
 */
function heatCard(match) {
  const halves = heatHalves(match).filter(h => !h.vacio);
  if (!halves.length) return "";
  const me = getTeam(S.run.teamId).name;
  return `<div class="bg-slate-800/60 border border-slate-700 rounded-2xl p-4">
    <div class="flex items-center justify-between gap-2 flex-wrap mb-1">
      <h3 class="font-bold flex items-center gap-2">🔥 Dónde se jugó</h3>
      <div class="flex items-center gap-1">
        <button data-pmheat="mine" class="pm-heat px-2 py-0.5 rounded-md text-[10px] font-black border cursor-pointer">${me}</button>
        <button data-pmheat="opp" class="pm-heat px-2 py-0.5 rounded-md text-[10px] font-black border cursor-pointer">${match.oppTeam.name}</button>
      </div>
    </div>
    <p class="text-[11px] text-slate-500 mb-3">Las zonas donde el equipo tuvo la pelota. Tu arco, abajo.</p>
    <div class="flex gap-3 justify-center">
      ${halves.map(h => `<div class="flex-1 max-w-[9rem]">
        <div class="text-[10px] uppercase tracking-wider text-slate-500 font-bold text-center mb-1">${h.label}</div>
        <div class="w-full" data-pmpitch="${h.idx}" style="aspect-ratio:3/4"></div>
      </div>`).join("")}
    </div>
  </div>`;
}

/** Pinta (o repinta) los mapas del post-partido para el lado elegido. */
function paintHeatCard(match, side) {
  document.querySelectorAll("[data-pmpitch]").forEach(el => {
    el.innerHTML = heatPitch(heatCells(match, side, +el.dataset.pmpitch), { blur: 7 });
  });
  document.querySelectorAll(".pm-heat").forEach(b => {
    const on = b.dataset.pmheat === side;
    b.className = `pm-heat px-2 py-0.5 rounded-md text-[10px] font-black border cursor-pointer transition-colors ${
      on ? "border-amber-400 bg-amber-400/20 text-amber-200" : "border-slate-700 bg-slate-800 text-slate-500 hover:text-slate-300"}`;
    b.onclick = () => paintHeatCard(match, b.dataset.pmheat);
  });
}

/**
 * Pantalla post-partido: resultado, goleadores y el análisis del cuerpo técnico (Moral +
 * Momento). En fase de grupos va a 2 columnas (tabla del grupo + análisis); en
 * eliminatorias, a UNA columna centrada — sin celdas vacías ocupando espacio.
 */
function renderPostMatch(res, advanced, momentum, morale, filo) {
  const run = S.run, match = S.match;
  const me = getTeam(run.teamId), opp = match.oppTeam;
  const won = res.winner === "my";
  const pensTxt = res.pens ? ` (${res.pens.myGoals}-${res.pens.oppGoals} en penales)` : "";
  const headline = won ? "🎉 ¡VICTORIA!" : res.winner === "opp" ? "😞 Derrota" : "🤝 Empate";
  const myScorers = match.scorers.map(s => `⚽ ${s.name} ${s.clock ?? s.min}'`).join(" · ") || "Sin goles propios";
  const analysis = analisisCard(momentum, morale, filo);
  const heat = heatCard(match);

  screenShell(`
    <div class="text-center mb-6 mt-4">
      <h1 class="text-3xl font-black">${headline}</h1>
      <div class="text-5xl font-black mt-3 tabular-nums flex items-center justify-center gap-4">${flagImg(me, "w-14 h-10", true)} <span>${res.gMy} - ${res.gOpp}</span> ${flagImg(opp, "w-14 h-10", true)}</div>
      <div class="text-amber-400 text-sm mt-1">${pensTxt}</div>
      <div class="text-slate-400 text-sm mt-2">${myScorers}</div>
      <div class="text-slate-500 text-xs mt-1">Tiros: ${match.stats.misTiros} vs ${match.stats.oppTiros} · Decisiones tomadas: ${match.stats.decisiones}</div>
    </div>
    ${run.stage === "groups"
      ? `<div class="grid md:grid-cols-2 gap-4 mb-6 md:items-start"><div class="space-y-4">${renderGroupTableCard()}${heat}</div><div>${analysis}</div></div>`
      : `<div class="max-w-lg mx-auto mb-6 space-y-4">${analysis}${heat}</div>`}
    <div class="text-center">
      <button id="btn-next" class="btn-primary text-lg">Continuar →</button>
    </div>
  `);
  paintHeatCard(match, "mine");
  $("#btn-next").onclick = () => routeAdvance(advanced);
}

/** Avanza el torneo en el motor y navega según el desenlace. */
function routeAdvance(advanced) {
  if (avanzando) return; // doble clic en "Continuar →": el torneo ya avanzó
  avanzando = true;
  cerrando = false; // el partido quedó cerrado; el siguiente podrá cerrarse
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
