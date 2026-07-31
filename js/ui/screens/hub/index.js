/* ============================================================
   ui/screens/hub — Concentración Mundialista (Game Vision):
   pantalla central entre partidos. Rival, calendario por días,
   estado del torneo, plantilla, efectos y el botón del día.
   También muestra los modales de evento/conflicto del día.

   ── LA CARPETA `hub/` (30-jul-2026) ────────────────────────────
   Este archivo llegó a 889 líneas (presupuesto §6: 500) y se partió
   por responsabilidad, sin tocar una sola regla:
     hub/rival.js  el rival: su card, el Informe y la Oportunidad
     hub/team.js   mi equipo: estado, identidad, efectos y la altura
     hub/day.js    el día: calendario, Acción del Día y sus modales
   Acá quedan la COMPOSICIÓN de la pantalla y el paso del día.
   ============================================================ */
import { getTeam } from "../../../data/teams-repo.js";
import { teamRating, teamStars, outOfPosPenalty } from "../../../game/ratings.js";
import { currentLineup, validateLineup, assignPositions, maxLineupSize } from "../../../game/lineup.js";
import { dayLabel, advanceDay } from "../../../game/calendar.js";
import { buildDaily } from "../../../game/daily.js";
import { applyDayAction, multLabel, dayOpportunity } from "../../../game/day-action.js";
import { nextOpponentId, STAGE_LABEL } from "../../../game/tournament/knockout.js";
import { S } from "../../session.js";
import { register, go } from "../../nav.js";
import { screenShell, $, flagImg, starsHtml, modal, closeModal, modalOpen, toast, momentoChip } from "../../components.js";
import { spriteSvg } from "../../sprites.js";
import { mountPitch } from "../../pitch.js";
import { renderGroupTableCard, renderKoInfoCard } from "../worldcup.js";
import { renderScorersCard, wireScorersCard } from "../scorers.js";
import { showScoutReport, showOppChooser, keyPlayers } from "./rival.js";
import { teamStateCard, alturaPicker, wireAlturaPicker, showCanje } from "./team.js";
import { actionCard, renderCalendarCard, showDaily, showDayEvent, showRandomEvent, bajasDelOnce } from "./day.js";

/**
 * Concentración Mundialista: pantalla central entre partidos. Calca el layout de
 * referencia del PO: banda VS a lo ancho; cuerpo en 3 columnas (IZQ estado del
 * equipo con la cancha · CENTRO "¿Qué harás hoy?" + efectos · DER grupo + goleadores);
 * y a lo ancho abajo el calendario y el botón del día. El Diario y el Estado del
 * Mundial viven como iconos en la cabecera.
 */
/**
 * Pasa al día siguiente: lo resuelve el motor (advanceDay), re-pinta el hub y abre la
 * portada del Daily; al cerrarla llega el evento/conflicto (o el toast de día de partido).
 * Lo usan el botón "Pasar al día" y la vuelta del partido (el partido consume su día, así
 * que al volver al hub arranca el día siguiente — no el del partido).
 */
function pasarDia() {
  // Guarda anti doble-día (bug del PO, 21-jul-2026: "a veces doble evento"). Todo camino
  // legítimo hasta acá deja la pantalla SIN modal (el botón del hub, o el post-partido que
  // cierra el suyo antes de navegar); si hay uno abierto es porque la cadena Daily→evento
  // de este día ya está en curso y el disparo es repetido (doble clic).
  if (modalOpen()) return;
  const bajasPre = bajasDelOnce().length; // para detectar si el evento de HOY tumba a un titular
  const res = advanceDay(S.run);
  if (!res) { renderHub(); return; }
  renderHub(); // el hub del día nuevo queda detrás de la portada
  // Bible §4.4: el día arranca con el Daily (informa); el evento llega después (transforma)
  showDaily(buildDaily(S.run), () => {
    if (res.type === "match") { closeModal(); toast(`⚽ ${dayLabel(S.run.day)} — ¡Día de partido!`); }
    else if (res.type === "evento") showDayEvent(res, bajasPre);
    else if (res.type === "conflicto") showRandomEvent(res);
    else closeModal(); // día tranquilo (el de la Oportunidad): sin evento — la oferta espera en el hub
  });
}


export function renderHub(opts = {}) {
  // Al volver de un partido (opts.autoAdvance) el día ya se jugó: se avanza al siguiente
  // en vez de quedarse en el hub del día del partido (evita re-mostrar ese día).
  if (opts.autoAdvance) { pasarDia(); return; }
  const run = S.run;
  const me = getTeam(run.teamId);
  const oppId = nextOpponentId(run);
  const opp = getTeam(oppId);
  const isMatchDay = run.day >= run.nextMatchDay;
  const stageTxt = (run.stage === "groups"
    ? `Fase de grupos · Fecha ${run.matchday + 1} de 3 · Grupo ${run.groups[run.myGroupIdx].name}`
    : STAGE_LABEL[run.stage]) + ` · ${dayLabel(run.day)}`;

  const available = run.squad.filter(p => !p.suspendido && p.lesionadoPartidos === 0);
  // Las BAJAS del once NO se auto-reemplazan (PO 22-jul): el caído queda a la vista (🚑/🟥)
  // y el DT arma el reemplazo a mano en Gestión de Plantilla — la formación tampoco cambia
  // sola. La válvula automática queda SOLO para el plantel diezmado (no llega a 6 en pie:
  // ahí no hay decisión que tomar y sin ella la run moría en softlock).
  const conBaja = (S.selectedLineup || []).some(p => p.suspendido || p.lesionadoPartidos > 0);
  if (conBaja && maxLineupSize(available) >= 6) assignPositions(run.squad, S.selectedLineup, S.formation);
  else ({ lineup: S.selectedLineup, formationId: S.formation } = currentLineup(run.squad, S.selectedLineup, S.formation));
  const bajasOnce = S.selectedLineup.filter(p => p.suspendido || p.lesionadoPartidos > 0);
  const v = validateLineup(available, S.selectedLineup);
  const discipline = { susp: run.squad.filter(p => p.suspendido), aperc: run.squad.filter(p => p.amarillas > 0 && !p.suspendido) };
  const fueraDePuesto = S.selectedLineup.filter(p => outOfPosPenalty(p) > 0);
  const forma = { racha: run.squad.filter(p => (p.momento ?? 4) >= 6), frios: run.squad.filter(p => (p.momento ?? 4) <= 2) };

  screenShell(`
    <div class="flex items-center justify-between flex-wrap gap-3 mb-5">
      <div>
        <div class="text-xs uppercase tracking-widest tp-text font-bold">${stageTxt}</div>
        <h1 class="text-2xl font-black mt-1 flex items-center gap-2">${flagImg(me, "w-8 h-[1.4rem]")} Concentración Mundialista</h1>
      </div>
      <div class="flex items-center gap-2">
        <button id="btn-journal" title="Diario de Campaña (${run.journal.length})" class="relative w-11 h-11 flex items-center justify-center rounded-xl border border-slate-600 bg-slate-800/80 text-xl hover:border-[var(--team-primary)] cursor-pointer transition-all">📖</button>
        <button id="btn-standings" title="Estado del Mundial" class="w-11 h-11 flex items-center justify-center rounded-xl border border-slate-600 bg-slate-800/80 text-xl hover:border-[var(--team-primary)] cursor-pointer transition-all">🏆</button>
        <button id="btn-abandon" class="text-xs text-slate-500 hover:text-red-400 cursor-pointer ml-1 px-3 py-2 rounded-xl border border-slate-700 hover:border-red-400/50">Abandonar torneo</button>
      </div>
    </div>

    <div id="btn-scout" title="Ver el informe del cuerpo técnico" class="bg-slate-800/80 border border-slate-600 tp-topbar rounded-2xl p-5 mb-5 cursor-pointer transition-all hover:scale-[1.005] hover:border-[var(--team-primary)]">
      <div class="flex items-center justify-between flex-wrap gap-4">
        <div class="flex items-center gap-4">
          ${flagImg(me, "w-16 h-11", true)}
          <span class="text-xl font-black text-slate-400">VS</span>
          ${flagImg(opp, "w-16 h-11", true)}
          <div>
            <div class="text-2xl font-bold">${opp.name}</div>
            <div>${starsHtml(teamStars(opp))} <span class="text-amber-300 font-bold text-sm ml-1">Media ${teamRating(opp)}</span></div>
          </div>
        </div>
        <div class="text-right">
          <div class="text-[10px] uppercase tracking-wider text-slate-500 font-bold mb-1">Figuras</div>
          <div class="flex gap-1.5 justify-end">
            ${keyPlayers(opp).map(f => `
              <div class="text-center w-14 shrink-0" title="${f.name}">
                <div class="flex justify-center">${spriteSvg(f, opp, "w-7 h-8")}</div>
                <div class="text-[9px] text-slate-400 truncate">${f.name}</div>
              </div>`).join("")}
          </div>
        </div>
      </div>
      <p class="text-[10px] tp-text font-semibold text-right mt-2">📋 Informe del rival →</p>
    </div>

    <!-- Cuerpo en 3 columnas de IGUAL alto (items-stretch): en cada columna un bloque
         crece (flex-1) para llenar y no dejar hueco — la cancha (izq), la acción del
         día (centro) y la tabla de goleadores (der). -->
    <div class="grid lg:grid-cols-[20rem_minmax(0,1fr)_20rem] gap-5 items-stretch">
      <!-- IZQUIERDA: estado del equipo (la card ya llena su columna) -->
      ${teamStateCard(v, discipline, fueraDePuesto, forma)}

      <!-- CENTRO: la acción del día llena la columna -->
      <div class="flex flex-col min-w-0">
        ${isMatchDay
          ? `<div class="bg-slate-800/60 border tp-border rounded-2xl p-5 text-center flex-1 flex flex-col justify-center">
              <div class="text-4xl mb-2">⚽</div>
              <h3 class="text-xl font-black">¡Hoy se juega!</h3>
              <p class="text-sm text-slate-400 mt-1">${me.name} enfrenta a ${opp.name}. Revisa tu plantilla y cuando estés listo, salta a la cancha.</p>
              <div class="mt-4 pt-4 border-t border-slate-700/70">${alturaPicker()}</div>
            </div>`
          : actionCard()}
      </div>

      <!-- DERECHA: grupo (fijo) + goleadores (llena el resto) -->
      <div class="flex flex-col gap-5 min-w-0">
        <div id="btn-standings2" class="cursor-pointer transition-transform hover:scale-[1.01] shrink-0" title="Ver el estado de todos los grupos">
          ${run.stage === "groups" ? renderGroupTableCard() : renderKoInfoCard()}
        </div>
        <div id="btn-scorers" class="cursor-pointer transition-transform hover:scale-[1.01] flex-1 flex flex-col" title="Ver la tabla completa de goleadores">
          ${renderScorersCard()}
        </div>
      </div>
    </div>

    <div class="mt-5">${renderCalendarCard(opp)}</div>

    <div class="mt-5">
      ${isMatchDay
        ? `<button id="btn-play" class="tp-gradient w-full text-lg font-black py-3.5 rounded-xl shadow-lg cursor-pointer transition-all hover:scale-[1.005] hover:brightness-110">⚽ JUGAR PARTIDO</button>`
        : run.actionPending
          ? `<button id="btn-nextday" disabled class="w-full text-lg font-black py-3.5 rounded-xl border border-slate-700 bg-slate-800/60 text-slate-500 shadow-lg cursor-not-allowed" title="Primero elige la Acción del día">🌙 Pasar al día siguiente →</button>`
          : `<button id="btn-nextday" class="w-full text-lg font-black py-3.5 rounded-xl border border-slate-500 bg-slate-700/70 hover:bg-slate-600 shadow-lg cursor-pointer transition-all hover:scale-[1.005]">🌙 Pasar al día siguiente →</button>`}
    </div>
  `, "max-w-7xl");

  // La cancha del "Estado del equipo": solo lectura, clic (ficha o césped) → Gestión de Plantilla.
  mountPitch({
    pitchEl: $("#hub-pitch"),
    team: me,
    lineup: S.selectedLineup,
    bench: [],
    selected: null,
    sizes: { sprite: "w-7 h-9", bench: "w-7 h-9" },
    draggable: () => false,
    canSwap: () => null,
    onSelect: () => {}, // el clic lo captura el contenedor (abajo): toda la cancha lleva a plantilla
    badge: p => momentoChip(p) + (p.suspendido ? "🟥" : p.lesionadoPartidos > 0 ? "🚑" : p.amarillas > 0 ? "🟨" : ""),
    muted: p => p.suspendido || p.lesionadoPartidos > 0,
  });
  $("#hub-pitch").onclick = () => go("squad");

  $("#btn-abandon").onclick = () => { if (confirm("¿Abandonar el torneo? La partida terminará.")) go("end-run", false, true); };
  $("#btn-scout").onclick = () => showScoutReport(oppId);
  $("#btn-standings").onclick = () => go("worldcup");
  $("#btn-standings2").onclick = () => go("worldcup");
  $("#btn-scorers").onclick = () => go("scorers");
  wireScorersCard($("#btn-scorers")); // carrusel Goleadores↔Asistidores (corta la navegación al togglear)
  $("#btn-journal").onclick = () => go("journal", "hub");
  $("#btn-squad").onclick = () => go("squad");
  const filoBtn2 = $("#btn-filo");
  if (filoBtn2) filoBtn2.onclick = () => go("philosophy");
  // El canje está disponible siempre que un buff llegue al umbral (también el día de
  // partido: renunciar al boost de hoy por crecimiento permanente es una decisión válida).
  document.querySelectorAll(".canje-opt").forEach(b => b.onclick = () => showCanje(b.dataset.key));
  if (isMatchDay) {
    wireAlturaPicker();
    const play = $("#btn-play");
    // validateLineup no mira disponibilidad (eso lo hacía el auto-reemplazo retirado):
    // con una baja en el once no se juega — el DT la resuelve en Gestión de Plantilla.
    const listo = v.ok && !bajasOnce.length;
    play.disabled = !listo;
    play.classList.toggle("opacity-40", !listo);
    play.classList.toggle("cursor-not-allowed", !listo);
    play.onclick = () => {
      if (validateLineup(available, S.selectedLineup).ok && !S.selectedLineup.some(p => p.suspendido || p.lesionadoPartidos > 0)) go("start-match", oppId);
    };
  } else {
    document.querySelectorAll(".da-opt").forEach(b => b.onclick = () => {
      const a = applyDayAction(S.run, b.dataset.action);
      if (!a) return;
      toast(`${a.icon} ${a.title}${a.mult !== 1 ? ` (${multLabel(a.mult)} hoy)` : ""}: ${a.desc}.`);
      renderHub();
    });
    // Payoff de la Sesión Táctica: al pasar por un foco, la línea muestra qué acerca;
    // al salir de la grilla, vuelve a la consigna por defecto. Solo lectura — no decide.
    const payoutEl = $("#tac-payoff");
    if (payoutEl) document.querySelectorAll(".tac-mark[data-payoff]").forEach(b => {
      b.addEventListener("mouseenter", () => { payoutEl.innerHTML = decodeURIComponent(b.dataset.payoff); });
      b.addEventListener("focus", () => { payoutEl.innerHTML = decodeURIComponent(b.dataset.payoff); });
      b.addEventListener("mouseleave", () => { payoutEl.innerHTML = payoutEl.dataset.default; });
    });
    const oppBtn = $("#da-opp");
    if (oppBtn) oppBtn.onclick = () => {
      const o = dayOpportunity(S.run);
      if (!o) return;
      if (o.choose) { showOppChooser(o); return; }
      const res = applyDayAction(S.run, o.id);
      if (!res) return;
      toast(`${res.icon} ${res.title}: ${res.desc}`);
      renderHub();
    };
    if (!S.run.actionPending) $("#btn-nextday").onclick = pasarDia;
  }
}


register("hub", renderHub);
