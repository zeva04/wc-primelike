/* ============================================================
   ui/screens/match/index — LA PANTALLA del partido en vivo: la
   estructura fija (marcador, controles, relato), el reloj del
   relato y el ruteo de decisiones.

   El resto de la pantalla vive en módulos hermanos, que operan
   sobre el mismo DOM (el presupuesto de líneas de ARQUITECTURA §6:
   este archivo llegó a 900 y se partió sin tocar una sola regla):
     panels.js   → la columna de lectura (estadísticas, XP de
                   identidad, Match Momentum y mapa de calor)
     tactics.js  → las palancas del DT (presión y altura del bloque)
     squad.js    → la Gestión de plantilla en vivo

   Contrato de decisiones: ver game/match/Match.js. Agregar una
   decisión nueva exige su entrada de ruteo en handleDecision().
   ============================================================ */
import { getTeam } from "../../../data/teams-repo.js";
import { statLine } from "../../../game/ratings.js";
import { STAGE_LABEL, koRoundOf } from "../../../game/tournament/knockout.js";
import { Match } from "../../../game/match/Match.js";
import { markMomentum } from "../../../game/match/match-momentum.js";
import { HEIGHT_DEFAULT } from "../../../game/match/field.js";
import { filoCtx } from "../../../game/philosophy.js";
import { S } from "../../session.js";
import { register, go } from "../../nav.js";
import { screenShell, $, flagImg, modal, closeModal } from "../../components.js";
import { paintStats, paintFiloXp, paintMomentum, paintHeat, wireCarousel, resetCarousel } from "./panels.js";
import { wireTactics, paintTactics } from "./tactics.js";
import { openSquadModal } from "./squad.js";

/** Crea la instancia Match con el once elegido y arranca el reloj del relato. */
function startMatch(oppId) {
  const me = getTeam(S.run.teamId);
  const opp = getTeam(oppId);
  const bench = S.run.squad.filter(p => !S.selectedLineup.includes(p) && !p.suspendido && p.lesionadoPartidos === 0);
  // La filosofía cruza la frontera run→Match como la moral: {id, nivel}, nada más (F1).
  // koRound (R2): la profundidad KO enciende la escalada del rival (forma de torneo).
  // La ALTURA DEL BLOQUE viaja como la mentalidad: es una orden del DT, no estado del
  // simulador. Entra con la que el DT dejó puesta en la Concentración (run.altura) y
  // los cambios en vivo valen solo para este partido.
  S.matchCtx = { team: me, lineup: S.selectedLineup.slice(), bench, mentalidad: "normal", altura: S.run.altura ?? HEIGHT_DEFAULT, buffs: { ...S.run.buffs }, moral: S.run.moral, filo: filoCtx(S.run), koRound: koRoundOf(S.run.stage) };
  S.match = new Match(S.matchCtx, opp, S.run.stage !== "groups", S.run.rivalBans[oppId] || []);
  S.feedRendered = 0;
  S.paused = false;
  S.halftime = false;
  resetCarousel();                // el carrusel arranca siempre en el momentum
  renderMatchScreen();
  S.match.log("info", `🏟️ ¡Comienza el partido! ${me.name} vs ${opp.name} — ${S.run.stage === "groups" ? "Grupo " + S.run.groups[S.run.myGroupIdx].name : STAGE_LABEL[S.run.stage]}`);
  updateMatchUI();
  startTimer();
}


/** Pinta la estructura fija del partido: marcador, controles, relato y alineaciones. */
function renderMatchScreen() {
  const me = S.matchCtx.team, opp = S.match.oppTeam;
  screenShell(`
    <div class="bg-slate-800/90 border border-slate-600 tp-topbar rounded-2xl p-3 mb-3 sticky top-2 z-30 backdrop-blur shrink-0">
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-2.5 text-lg font-black">${flagImg(me, "w-10 h-7", true)}<span class="hidden sm:inline tp-text">${me.name}</span></div>
        <div class="text-center">
          <div id="score" class="text-4xl font-black tabular-nums">0 - 0</div>
          <div id="minute" class="text-amber-400 font-bold text-sm">0'</div>
        </div>
        <div class="flex items-center gap-2.5 text-lg font-black"><span class="hidden sm:inline">${opp.name}</span>${flagImg(opp, "w-10 h-7", true)}</div>
      </div>
      <div class="flex items-center justify-center gap-2 mt-3 flex-wrap">
        <div class="flex rounded-lg overflow-hidden border border-slate-600 text-xs">
          ${["defensiva", "normal", "ofensiva"].map(mm => `<button data-ment="${mm}" class="ment-btn px-3 py-1.5 font-semibold cursor-pointer transition-colors ${mm === "normal" ? "bg-amber-500 text-slate-900" : "bg-slate-700 hover:bg-slate-600"}">${mm === "defensiva" ? "🛡️" : mm === "ofensiva" ? "⚔️" : "⚖️"} ${mm[0].toUpperCase() + mm.slice(1)}</button>`).join("")}
        </div>
        <!-- LA ALTURA DEL BLOQUE (sprint del Territorio): la otra orden estructural del
             DT, al lado de la mentalidad. Gratis antes del partido y en el entretiempo;
             con el partido en juego consume una VENTANA TÁCTICA (las reglas viven en
             game/match/field, el botón solo abre la pizarra). -->
        <button id="btn-height" class="px-3 py-1.5 rounded-lg bg-slate-700 hover:bg-slate-600 text-xs font-semibold cursor-pointer whitespace-nowrap">🧱 Bloque</button>
        <!-- EL BOTÓN DE PRESIÓN: la barra ES el fondo del botón (un span absoluto que crece
             o se vacía), así el estado se lee sin mirar ningún número. Vacía mientras la
             ráfaga corre, se llena mientras recarga, y el color vuelve al encenderse. -->
        <button id="btn-press" class="relative overflow-hidden px-3.5 py-1.5 rounded-lg text-xs font-black cursor-pointer bg-transparent">
          <span id="press-bg" class="absolute inset-0 rounded-lg border"></span>
          <span id="press-fill" class="absolute inset-y-0 left-0 transition-[width] duration-700 ease-linear"></span>
          <span id="press-label" class="relative whitespace-nowrap">🔥 PRESIONAR</span>
        </button>
        <button id="btn-pause" class="px-3 py-1.5 rounded-lg bg-slate-700 hover:bg-slate-600 text-xs font-semibold cursor-pointer">⏸️ Pausa</button>
        <button id="btn-subs" class="px-3 py-1.5 rounded-lg bg-slate-700 hover:bg-slate-600 text-xs font-semibold cursor-pointer">🔄 Plantilla (<span id="subs-left">3</span>)</button>
        <button id="btn-speed" class="px-3 py-1.5 rounded-lg bg-slate-700 hover:bg-slate-600 text-xs font-semibold cursor-pointer">⏩ Rápido</button>
      </div>
    </div>
    <!-- FLEX y no GRID a propósito (y sin backticks en este comentario: vive dentro de un
         template literal y lo cortaría). Una fila de grid se dimensiona por su CONTENIDO,
         así que el alto nunca llegaba definido a las columnas y el flex-1 del relato caía a
         la altura de todo el texto: medido, 898 px en una ventana de 698. Con flex-row el
         alto de la fila SÍ es definido —viene del flex-1 de la columna de arriba— y las
         columnas lo heredan al estirarse. La proporción 2:1 la dan flex-[2] / flex-[1]. -->
    <div class="flex flex-col md:flex-row gap-4 md:flex-1 md:min-h-0">
      <div class="flex flex-col min-w-0 md:flex-[2] md:min-h-0">
        <!-- El relato ESTIRA para llenar lo que sobre: es la pieza elástica del partido.
             En móvil vuelve a una altura fija (no hay alto de ventana que repartir). -->
        <div id="feed" class="bg-slate-900/80 border border-slate-700 rounded-2xl p-4 h-[420px] md:h-auto md:flex-1 md:min-h-0 overflow-y-auto space-y-1.5 text-sm"></div>
        <div id="match-footer" class="mt-3 text-center shrink-0"></div>
      </div>
      <!-- COLUMNA DE LECTURA (PO 28-jul): las estadísticas arriba y el Match Momentum
           justo debajo. Las dos responden la misma pregunta —cómo va el partido— y el
           gráfico se lee mejor pegado a los números que lo explican. -->
      <div class="flex flex-col gap-3 min-w-0 md:flex-[1] md:min-h-0">
        <!-- ESTADÍSTICAS DEL PARTIDO: reemplazaron a las dos alineaciones. La posesión se
             mudó acá desde el marcador —con su chip de momentum al lado del título, que es
             lo que ese ▲▼ siempre midió— y la acompañan tiros, precisión de pase y córners.
             El motor las sirve ya masticadas (match/stats.matchStats). -->
        <div class="bg-slate-800/60 border border-slate-700 rounded-2xl p-3 shrink-0">
          <div class="flex items-center justify-between mb-3">
            <h3 class="font-bold text-sm tp-text">📊 Estadísticas del partido</h3>
            <span id="mom-chip" class="font-black text-slate-500 text-xs" title="Momentum: quién está generando en los últimos 15'">·</span>
          </div>
          <div id="match-stats" class="space-y-3"></div>
          <!-- LA IDENTIDAD SE APRENDE EN VIVO (arco de Progresión): la XP que cada idea
               va ganando ESTE partido, con la barra hacia su próximo nivel. El feed grita
               la subida; esto la deja ver venir. -->
          <div id="filo-xp" class="mt-3 pt-3 border-t border-slate-700/70 space-y-1.5"></div>
        </div>
        <!-- EL CARRUSEL DE LECTURA (sprint del Territorio): dos formas de leer el mismo
             partido en el mismo sitio — el Match Momentum (quién genera AHORA) y el mapa
             de calor (dónde se está jugando). Las flechas alternan; ambos se actualizan
             en vivo aunque no se estén viendo, porque los dos los sirve el motor.
             El gráfico ocupa TODO el alto que sobre en la columna (flex-1) y se posiciona
             en %, así que escala solo con el contenedor. -->
        <div class="bg-slate-900/80 border border-slate-700 rounded-2xl px-3 pt-3 pb-2 flex flex-col md:flex-1 md:min-h-0">
          <div class="flex items-center justify-between gap-1 mb-1.5 shrink-0">
            <button id="car-prev" class="w-5 h-5 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-100 text-xs leading-none cursor-pointer shrink-0" title="Anterior">‹</button>
            <h3 id="car-title" class="text-[10px] uppercase tracking-[0.2em] font-black text-slate-400 truncate">Match Momentum</h3>
            <button id="car-next" class="w-5 h-5 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-100 text-xs leading-none cursor-pointer shrink-0" title="Siguiente">›</button>
          </div>
          <div id="car-legend" class="flex items-center justify-center gap-2 text-[9px] font-bold mb-1 shrink-0"></div>
          <div id="slide-mm" class="flex flex-col md:flex-1 md:min-h-0">
            <div id="mm-chart" class="relative w-full h-24 md:h-auto md:flex-1 md:min-h-[4.5rem]"></div>
            <div id="mm-axis" class="relative h-3 w-full text-[8.5px] text-slate-500 font-bold shrink-0"></div>
          </div>
          <!-- EL MAPA DE CALOR: la cancha ocupa el alto disponible manteniendo su
               proporción (aspect-ratio), con mi arco abajo. Debajo, a quién se mira. -->
          <div id="slide-heat" class="hidden flex-col md:flex-1 md:min-h-0">
            <div class="h-52 md:h-auto md:flex-1 md:min-h-0 flex items-center justify-center">
              <div id="heat-pitch" class="h-full max-w-full" style="aspect-ratio:3/4"></div>
            </div>
            <div class="flex items-center justify-center gap-1 mt-1.5 shrink-0">
              <button data-heat="mine" class="heat-side px-2 py-0.5 rounded-md text-[9px] font-black border cursor-pointer transition-colors">${me.name}</button>
              <button data-heat="opp" class="heat-side px-2 py-0.5 rounded-md text-[9px] font-black border cursor-pointer transition-colors">${opp.name}</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  `, "max-w-6xl md:h-dvh md:py-3 md:flex md:flex-col");
  document.querySelectorAll(".ment-btn").forEach(b => b.onclick = () => {
    S.matchCtx.mentalidad = b.dataset.ment;
    document.querySelectorAll(".ment-btn").forEach(x => { x.className = x.className.replace("bg-amber-500 text-slate-900", "bg-slate-700 hover:bg-slate-600"); });
    b.className = b.className.replace("bg-slate-700 hover:bg-slate-600", "bg-amber-500 text-slate-900");
    markMomentum(S.match, "⚙️");   // decisión táctica: marca, no puntos
    S.match.log("info", `📢 Mentalidad: ${b.dataset.ment.toUpperCase()}.`);
    updateMatchUI();
  });
  // Cada módulo cablea SUS controles: el carrusel vive con el estado de la vista
  // (panels) y las palancas del DT con sus reglas (tactics). Esta pantalla solo pinta
  // la estructura y reparte.
  wireCarousel();
  wireTactics();
  $("#btn-pause").onclick = togglePause;
  $("#btn-subs").onclick = () => openSquadModal(); // sin args: el onclick pasaría el MouseEvent como "caído"
  $("#btn-speed").onclick = () => {
    // El reloj lee CRUISE() en cada paso, así que cambiar la velocidad tiene efecto solo: no
    // hace falta reiniciar el timer (reiniciar duplicaría el auto-agendado).
    S.speed = S.speed === 1 ? 2 : 1;
    $("#btn-speed").textContent = S.speed === 1 ? "⏩ Rápido" : "🐢 Normal";
  };
}

// Ritmo del partido (Bible §7, decisión PO "ráfaga"): la simulación CORRE entre secuencias
// —el relato de ambiente pasa rápido, da la sensación de partido vivo— y FRENA en seco al
// llegar una secuencia (que es una decisión, congela sola). Un gol hace una pausa breve para
// que se registre. El reloj se auto-agenda con setTimeout para poder variar el ritmo por paso.
// Ajuste PO 22-jul ("no asfixiar"): todo más lento, y AIRE entre actos encadenados — el
// desenlace de un acto se LEE antes de que el modal siguiente lo tape.
// EL RELOJ CONTINUO (PO 27-jul): un tick ES un minuto de partido, y se ve correr —
// 2 segundos por minuto en velocidad normal (un partido dura ~3'30" de reloj de pared
// más lo que el DT tarde en decidir). "Rápido" comprime a 0,8 s/minuto para quien ya
// vio el partido. El congelado en las decisiones lo hace solo el motor: tick() corta
// con decisión pendiente y el reloj no se reagenda hasta resolverla.

const CRUISE = () => (S.speed === 1 ? 2000 : 800);
const GOAL_HOLD = 2600;
const SEQ_INTRO_HOLD = 900; // la intro de la secuencia se lee antes de abrir su primer modal
const ACT_HOLD = 1300;      // entre actos encadenados: el resultado del acto respira
const SEQ_END_HOLD = 900;   // tras el desenlace, antes de que el reloj retome

/** Un paso del reloj: avanza el partido, reacciona, y agenda el siguiente al ritmo que toque. */
function step() {
  if (S.paused || S.match.decision || S.match.finished) { S.timer = setTimeout(step, CRUISE()); return; }
  const before = S.match.feed.length;
  const r = S.match.tick();
  updateMatchUI();
  if (r === true && S.match.decision) { stopTimer(); S.timer = setTimeout(presentDecision, SEQ_INTRO_HOLD); return; }
  if (r === "halftime") { stopTimer(); S.halftime = true; showHalftime(); return; }
  if (r === "pens") { stopTimer(); go("shootout"); return; }
  if (r === "end") { stopTimer(); go("finish-match"); return; }
  const scored = S.match.feed.slice(before).some(f => f.kind === "goal" || f.kind === "goal_opp");
  S.timer = setTimeout(step, scored ? GOAL_HOLD : CRUISE());
}

/** Arranca el reloj del relato. */
export function startTimer() { stopTimer(); S.timer = setTimeout(step, CRUISE()); }

/** Detiene el reloj del partido. */
export function stopTimer() { if (S.timer) { clearTimeout(S.timer); S.timer = null; } }

/** Alterna pausa/reanudar del relato. */
function togglePause() {
  S.paused = !S.paused;
  const b = $("#btn-pause");
  if (b) b.textContent = S.paused ? "▶️ Seguir" : "⏸️ Pausa";
}


const FEED_STYLE = {
  goal: "bg-emerald-500/15 border-l-4 border-emerald-400 font-bold",
  goal_opp: "bg-red-500/15 border-l-4 border-red-400 font-bold",
  chance: "text-slate-200",
  card: "bg-yellow-500/10 border-l-4 border-yellow-500",
  event: "bg-purple-500/10 border-l-4 border-purple-400",
  filo: "bg-amber-400/15 border-l-4 border-amber-300 font-bold text-amber-200",
  info: "text-amber-300 font-semibold",
  plain: "text-slate-400",
};


/** Refresca marcador, minuto, relato (solo líneas nuevas) y las estadísticas. */
export function updateMatchUI() {
  if (!$("#score")) return;
  const match = S.match, matchCtx = S.matchCtx;
  $("#score").textContent = `${match.gMy} - ${match.gOpp}`;
  // El reloj corre minuto a minuto y canta el descuento como la tele ("90+3'").
  const enDescuento = match.min > match.nominal;
  const min = $("#minute");
  min.textContent = `${match.clock()}'${match.phase === "extra" ? " (prórroga)" : ""}`;
  min.className = `font-bold text-sm ${enDescuento ? "text-red-400" : "text-amber-400"}`;
  $("#subs-left").textContent = match.subsLeft;
  // Momentum (A3): quién está generando en los últimos 15'. Vive junto al panel porque
  // es la lectura dinámica de las mismas estadísticas.
  const fl = match.flow();
  const mom = $("#mom-chip");
  if (mom) {
    const [sym, cls] = fl.net > 4 ? ["▲▲", "text-emerald-400"] : fl.net > 1 ? ["▲", "text-emerald-400"]
      : fl.net < -4 ? ["▼▼", "text-red-400"] : fl.net < -1 ? ["▼", "text-red-400"] : ["·", "text-slate-500"];
    mom.textContent = sym;
    mom.className = `font-black text-xs ${cls}`;
  }
  paintStats(match);
  paintFiloXp(match);
  paintMomentum(match);
  paintHeat(match);
  paintTactics(match);
  const feed = $("#feed");
  while (S.feedRendered < match.feed.length) {
    const f = match.feed[S.feedRendered++];
    const div = document.createElement("div");
    div.className = `px-3 py-1.5 rounded-lg animate-fadein ${FEED_STYLE[f.kind] || "text-slate-300"}`;
    div.textContent = f.text;
    feed.appendChild(div);
  }
  feed.scrollTop = feed.scrollHeight;
}

// --- Decisiones en partido ---


/**
 * Presenta la decisión pendiente: el modal genérico, o —si es una lesión (`injury_sub`)—
 * la Gestión de plantilla en vivo con el caído marcado (PO 22-jul: el reemplazo es manual,
 * sin lista de recomendados). Se llama con delay para que el relato previo se lea.
 */
function presentDecision() {
  const match = S.match;
  if (!match || match.finished) return;
  if (!match.decision) { startTimer(); return; }
  if (match.decision.id === "injury_sub") {
    const caido = match.decision.player;
    match.decision = null;
    updateMatchUI();
    openSquadModal(caido);
    return;
  }
  showDecision();
}

/** Muestra el modal de la decisión pendiente (ocasión, penal, cambio forzado del arquero). */
function showDecision() {
  const d = S.match.decision;
  const m = modal(`
    <h2 class="text-lg font-black mb-1">${d.title}</h2>
    <p class="text-slate-300 text-sm mb-4">${d.text}</p>
    <div class="space-y-2">
      ${d.options.map((o, i) => `<button data-i="${i}" class="dec-opt w-full text-left px-4 py-3 rounded-xl border border-slate-600 bg-slate-700/60 hover:border-amber-400 hover:bg-slate-700 transition-all cursor-pointer">
        <div class="font-semibold">${o.label}</div>
        ${o.hint ? `<div class="text-xs text-slate-400">${o.hint}</div>` : ""}
      </button>`).join("")}
    </div>
  `);
  m.querySelectorAll(".dec-opt").forEach(b => b.onclick = () => {
    const opt = d.options[+b.dataset.i];
    closeModal();
    handleDecision(d, opt.key);
  });
}

/** Enruta la opción elegida al método correspondiente de Match y reanuda (o encadena otra decisión). */
function handleDecision(d, key) {
  const match = S.match;
  if (d.id === "sequence") match.resolveSequenceAct(key);
  else if (d.id === "penalty_mine") match.resolvePenaltyMine(key);
  else if (d.id === "penalty_opp") match.resolvePenaltyOpp(key);
  else if (d.id === "last_man") match.resolveLastMan(key);
  else if (d.id === "forced_sub") { match.decision = null; match.makeSub(d.out, key); }
  else if (d.id === "gk_red") { match.decision = null; match.makeSub(match.my.lineup.find(p => p.name === key), d.gkIn, true); }
  else if (d.id === "gk_emergency") match.resolveGkEmergency(key);
  else if (d.id === "protect") {
    match.decision = null;
    if (key === "sub") {
      const opts = match.eligibleFor(d.player);
      if (opts.length) {
        match.decision = {
          id: "forced_sub", out: d.player,
          title: `🔄 Cambio por ${d.player.name}`,
          text: "Elige quién entra:",
          options: opts.map(b => ({ label: `#${b.num} ${b.name} (${b.pos})`, hint: statLine(b), key: b.name })),
        };
      }
    }
  }
  updateMatchUI();
  // Aire entre actos (PO 22-jul): el desenlace del acto se lee ANTES de que el próximo
  // modal lo tape; y al cerrar una secuencia, el reloj retoma con un respiro.
  stopTimer();
  if (match.decision) { S.timer = setTimeout(presentDecision, ACT_HOLD); return; }
  S.timer = setTimeout(step, SEQ_END_HOLD);
}

/** Pausa de entretiempo: botón para reanudar (permite ajustar cambios y mentalidad). */
function showHalftime() {
  updateMatchUI();
  const footer = $("#match-footer");
  footer.innerHTML = `<button id="btn-resume" class="btn-primary">▶️ Continuar el partido</button>
    <p class="text-xs text-slate-400 mt-2">Aprovecha para hacer cambios o ajustar la mentalidad.</p>`;
  $("#btn-resume").onclick = () => { S.halftime = false; footer.innerHTML = ""; startTimer(); };
}


register("start-match", startMatch);
