/* ============================================================
   ui/screens/match — partido en vivo: relato por ticks,
   decisiones (modal), mentalidad, pausa/velocidad y cambios.

   Contrato de decisiones: ver game/match/Match.js. Agregar una
   decisión nueva exige su entrada de ruteo en handleDecision().
   ============================================================ */
import { getTeam } from "../../data/teams-repo.js";
import { statLine, playedPos, outOfPosPenalty } from "../../game/ratings.js";
import { swapAssignments, canPlayAt, assignToFormation, FORMATIONS } from "../../game/lineup.js";
import { STAGE_LABEL, koRoundOf } from "../../game/tournament/knockout.js";
import { Match } from "../../game/match/Match.js";
import { startPress, pressState } from "../../game/match/press.js";
import { matchStats } from "../../game/match/stats.js";
import { momentumBars, markMomentum } from "../../game/match/match-momentum.js";
import { heatCells, fieldState, setHeight, HEIGHT_DEFAULT } from "../../game/match/field.js";
import { teamPowers } from "../../game/match/powers.js";
import { filoCtx } from "../../game/philosophy.js";
import { PHILOSOPHIES, FILO_LEVELS, xpLevelOf } from "../../content/philosophies.js";
import { S } from "../session.js";
import { register, go } from "../nav.js";
import { screenShell, $, flagImg, modal, closeModal, toast, energyBar, momentoChip, heatPitch } from "../components.js";
import { mountPitch, POS_NAME } from "../pitch.js";

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
  slide = 0; heatSide = "mine";   // el carrusel arranca siempre en el momentum
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
  $("#btn-height").onclick = openHeightModal;
  $("#btn-press").onclick = () => {
    if (!startPress(S.match)) return;   // la regla vive en game/match/press, no en el botón
    updateMatchUI();
  };
  $("#car-prev").onclick = () => moveCarousel(-1);
  $("#car-next").onclick = () => moveCarousel(1);
  document.querySelectorAll(".heat-side").forEach(b => b.onclick = () => { heatSide = b.dataset.heat; paintCarousel(); });
  paintCarousel();
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
  if (r === "halftime") { stopTimer(); showHalftime(); return; }
  if (r === "pens") { stopTimer(); go("shootout"); return; }
  if (r === "end") { stopTimer(); go("finish-match"); return; }
  const scored = S.match.feed.slice(before).some(f => f.kind === "goal" || f.kind === "goal_opp");
  S.timer = setTimeout(step, scored ? GOAL_HOLD : CRUISE());
}

/** Arranca el reloj del relato. */
function startTimer() { stopTimer(); S.timer = setTimeout(step, CRUISE()); }

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

/**
 * Pinta el botón de presión desde `pressState` — la UI no conoce ninguna regla: recibe
 * `on/ready/agotado/pct/restantes` y elige colores. Cuatro estados legibles de un vistazo:
 *   ENCENDIDA  ámbar lleno, la barra se VACÍA (te queda esto de ráfaga)
 *   LISTA      ámbar lleno y clickeable — "el botón recupera su color" (pedido del PO)
 *   RECARGANDO gris, la barra se LLENA en ámbar apagado
 *   AGOTADA    gris muerto, sin barra
 */
function paintPressButton(match) {
  const btn = $("#btn-press"); if (!btn) return;
  const st = pressState(match);
  const bg = $("#press-bg"), fill = $("#press-fill"), label = $("#press-label");
  fill.style.width = `${Math.round(st.pct)}%`;
  // TODO el color vive en los <span> de fondo, NUNCA en el <button>: la hoja del tema
  // fija el background de `button` y le gana hasta a un inline `!important` (verificado
  // en navegador — al botón se le queda pegado el color del primer estado que pinta).
  // Con capas, además, la barra ES el fondo: se lee sin mirar ningún número.
  // Y el color cambia SIN transición a propósito: lo que anima es el ancho de la barra;
  // el estado (listo / presionando / recargando) tiene que saltar a la vista al instante.
  const paint = (base, borde, texto, barra, cursor) => {
    bg.style.background = base;
    bg.style.borderColor = borde;
    fill.style.background = barra;
    label.style.color = texto;
    btn.style.cursor = cursor;
  };
  if (st.on) {
    paint("rgba(120,53,15,.55)", "#fcd34d", "#fef3c7", "rgba(245,158,11,.8)", "default");
    label.textContent = "🔥 PRESIONANDO";
  } else if (st.ready) {
    // Lleno de ámbar: "el botón recupera su color" (pedido del PO) es literalmente
    // la barra completa, el mismo objeto que se vació durante la ráfaga.
    paint("#b45309", "#fbbf24", "#0f172a", "#f59e0b", "pointer");
    label.textContent = `🔥 PRESIONAR (${st.restantes})`;
  } else {
    paint("#1e293b", "#475569", "#94a3b8", "rgba(217,119,6,.35)", "not-allowed");
    label.textContent = st.agotado ? "🔥 Sin ráfagas" : "🔥 Recargando…";
  }
  btn.disabled = !st.ready;
  btn.title = st.agotado
    ? `Ya usaste las ${st.usos} ráfagas del partido.`
    : "Presionar arriba durante 10 minutos: el equipo roba más alto y ataca mejor, pero esos minutos cuestan el DOBLE de energía.";
}

/**
 * Pinta las Estadísticas del partido desde `matchStats` — la vista no conoce ninguna
 * regla: recibe [{label, mine, opp, txt}] y arma la fila de transmisión (número mío ·
 * etiqueta · número suyo, y debajo la barra repartida). Reutiliza el idioma visual de la
 * vieja barra de posesión: verde lo mío, rojo lo suyo.
 *
 * Se pinta con innerHTML solo la PRIMERA vez y después se actualizan los nodos: así la
 * transición CSS de las barras se ve (un innerHTML nuevo cada tick las haría saltar).
 */
function paintStats(match) {
  const box = $("#match-stats"); if (!box) return;
  const rows = matchStats(match);
  if (!box.firstChild) {
    box.innerHTML = rows.map(r => `
      <div>
        <div class="flex items-baseline justify-between gap-2 text-[11px] mb-1">
          <b data-v="${r.id}-mine" class="tabular-nums text-emerald-300 text-sm">–</b>
          <span class="text-slate-400 uppercase tracking-wider text-[9.5px] font-bold">${r.label}</span>
          <b data-v="${r.id}-opp" class="tabular-nums text-red-300 text-sm">–</b>
        </div>
        <div class="h-1.5 rounded-full overflow-hidden bg-red-400/60">
          <div data-bar="${r.id}" class="h-full bg-emerald-400 transition-all duration-500" style="width:50%"></div>
        </div>
      </div>`).join("");
  }
  for (const r of rows) {
    box.querySelector(`[data-v="${r.id}-mine"]`).textContent = r.txt[0];
    box.querySelector(`[data-v="${r.id}-opp"]`).textContent = r.txt[1];
    // Sin datos todavía (0 a 0 tiros) la barra queda al medio: no insinuar un dominio que
    // no existe. Es el mismo criterio del prior neutral de la posesión.
    const tot = r.mine + r.opp;
    box.querySelector(`[data-bar="${r.id}"]`).style.width = `${tot > 0 ? Math.round((100 * r.mine) / tot) : 50}%`;
  }
}

/**
 * LA XP DE IDENTIDAD EN VIVO (arco de Progresión, "skill-up a la Skyrim"): una fila por
 * filosofía que este partido ejercitó, con lo ganado y la barra hacia su próximo nivel.
 * Los números salen del Match (`filoXp`, ya multiplicados) y de la foto que trajo el
 * matchCtx (`filo.xp`): la pantalla no calcula reglas, solo suma foto + partido.
 */
function paintFiloXp(match) {
  const box = $("#filo-xp"); if (!box || !match.my.filo) return;
  const ganado = match.filoXp || {};
  const filas = PHILOSOPHIES.filter(p => ganado[p.id]);
  if (!filas.length) { box.innerHTML = ""; return; }
  box.innerHTML = filas.map(p => {
    const total = (match.my.filo.xp?.[p.id] || 0) + ganado[p.id];
    const lvl = xpLevelOf(total);
    const piso = FILO_LEVELS[lvl].min, techo = FILO_LEVELS[lvl + 1]?.min ?? null;
    const pct = techo ? Math.min(100, (100 * (total - piso)) / (techo - piso)) : 100;
    return `<div>
      <div class="flex items-baseline justify-between gap-2 text-[10px]">
        <span class="font-bold text-slate-300">${p.icon} ${p.name}<span class="text-slate-500"> nv ${lvl + 1}</span></span>
        <b class="tabular-nums text-amber-300">+${Math.round(ganado[p.id])}</b>
      </div>
      <div class="h-1 rounded-full overflow-hidden bg-slate-900/80 mt-1">
        <div class="h-full bg-amber-400 transition-all duration-500" style="width:${pct}%"></div>
      </div>
    </div>`;
  }).join("");
}

/**
 * MATCH MOMENTUM: el gráfico de barras de la transmisión. Una barra por minuto cerrado,
 * hacia arriba lo mío (verde) y hacia abajo lo suyo (rojo), con la línea del cero al medio,
 * el corte del entretiempo y las marcas (⚽ 🟨 🟥 🔄 🚑 🔥) sobre el minuto en que pasaron.
 *
 * El motor lo sirve masticado (`momentumBars`: altura ya normalizada 0..1 y de qué lado va);
 * acá no se decide nada del partido, solo se dibuja. Se repinta cuando aparece una barra
 * nueva —una vez por minuto—, no en cada refresco: son ~95 nodos.
 *
 * El eje se ancla al MINUTO de fútbol, no al índice de la barra: con el descuento hay más
 * de 90 barras, y si se repartiera por índice el "HT" caería en cualquier lado.
 */
const MM_AXIS = [0, 15, 30, "HT", 60, 75, 90];
function paintMomentum(match) {
  const box = $("#mm-chart"); if (!box) return;
  const bars = momentumBars(match);
  if (box.dataset.n === String(bars.length)) return;   // nada nuevo que dibujar
  box.dataset.n = String(bars.length);
  if (!bars.length) { box.innerHTML = ""; return; }
  const w = 100 / bars.length;
  // Índice de la primera barra del segundo tiempo: ahí va la línea del entretiempo.
  const htIdx = bars.findIndex(b => b.half > 45);
  const cuerpo = bars.map((b, i) => {
    const alto = Math.max(2, b.h * 100);          // un mínimo visible: 0 exacto no se ve
    const lado = b.mine
      ? `bottom:50%;height:${alto / 2}%;background:#34d399`
      : `top:50%;height:${alto / 2}%;background:#f87171`;
    // La marca va sobre la PUNTA de su barra, no sobre la línea del cero. Se posiciona con
    // `calc(50% + N%)`: en `top`/`bottom` los porcentajes se resuelven contra la ALTURA del
    // contenedor, que es lo que queremos. (Con `margin-bottom:N%` se resolvían contra el
    // ANCHO de la columna —3 píxeles—, así que las marcas quedaban todas pegadas al cero:
    // se vio en el navegador.)
    const marcas = b.marks.length
      ? `<span class="absolute left-1/2 -translate-x-1/2 text-[9px] leading-none whitespace-nowrap pointer-events-none"
           style="${b.mine ? `bottom:calc(50% + ${alto / 2}%);margin-bottom:2px` : `top:calc(50% + ${alto / 2}%);margin-top:2px`}">${b.marks.join("")}</span>`
      : "";
    return `<div class="absolute" style="left:${i * w}%;width:${w}%;top:0;bottom:0">
      <div class="absolute rounded-[1px]" style="left:8%;right:8%;${lado}"></div>${marcas}</div>`;
  }).join("");
  box.innerHTML = `
    ${cuerpo}
    <div class="absolute left-0 right-0 top-1/2 h-px bg-slate-600"></div>
    ${htIdx > 0 ? `<div class="absolute top-0 bottom-0 w-px bg-slate-600/70" style="left:${htIdx * w}%"></div>` : ""}`;
  // El eje: cada marca se planta sobre la primera barra que alcanza ese minuto.
  const eje = $("#mm-axis");
  if (eje) eje.innerHTML = MM_AXIS.map(t => {
    const i = t === "HT" ? htIdx : bars.findIndex(b => b.min >= t);
    if (i < 0) return "";
    const x = t === 90 ? 100 : i * w;
    return `<span class="absolute" style="left:${x}%;transform:translateX(${t === 0 ? "0" : t === 90 ? "-100%" : "-50%"})">${t === "HT" ? "HT" : t + "'"}</span>`;
  }).join("");
}

/**
 * LA PIZARRA DE LA ALTURA: las 5 alturas de bloque con su explicación en fútbol y el
 * costo a la vista. El motor manda (`fieldState` dice qué se puede elegir y si es
 * gratis); acá solo se pinta y se rutea. Se muestra también cómo está parado el RIVAL
 * —con palabras, jamás con un número: la capa numérica es invisible al jugador—.
 */
function openHeightModal() {
  const match = S.match;
  if (match.finished) return;
  const wasPaused = S.paused;
  S.paused = true;
  const st = fieldState(match);
  const w = modal(`
    <h2 class="text-lg font-black mb-1">🧱 Altura del bloque</h2>
    <p class="text-slate-400 text-xs mb-1">Dónde vive el equipo cuando tiene y cuando no tiene la pelota.</p>
    <p class="text-[11px] mb-3 ${st.gratis ? "text-emerald-400" : "text-amber-300"}">${st.gratis
      ? "El equipo está parado: moverlo ahora no cuesta nada."
      : `Con el partido en juego, reorganizar las líneas consume una <b>ventana táctica</b>. Te quedan <b>${st.ventanas}</b>.`}</p>
    <div class="space-y-2">
      ${st.opciones.map(o => `<button data-h="${o.n}" ${o.actual || !o.puede ? "disabled" : ""}
        class="h-opt w-full text-left px-4 py-2.5 rounded-xl border transition-all ${o.actual
          ? "border-amber-400 bg-amber-400/15"
          : o.puede ? "border-slate-600 bg-slate-700/60 hover:border-amber-400 hover:bg-slate-700 cursor-pointer" : "border-slate-700 bg-slate-800/40 opacity-40"}">
        <div class="font-semibold text-sm">${o.icon} ${o.label}${o.actual ? ` <span class="text-[10px] text-amber-300 font-black uppercase tracking-wider">· actual</span>` : ""}</div>
        <div class="text-xs text-slate-400">${o.desc}</div>
      </button>`).join("")}
    </div>
    <!-- La lectura del rival, en PALABRAS (nunca su número): es scouting en vivo. Dice
         "bloque" y no "línea" por concordancia — las etiquetas son masculinas. -->
    <p class="text-[11px] text-slate-500 mt-3">🔎 ${match.oppTeam.name} está parado con un <b class="text-slate-300">bloque ${st.rival}</b>.</p>
    <button id="h-close" class="w-full mt-3 text-sm font-bold py-2.5 rounded-lg bg-slate-700 hover:bg-slate-600 cursor-pointer">Volver al partido</button>
  `);
  const cerrar = () => {
    closeModal();
    S.paused = wasPaused;
    updateMatchUI();
    if (!match.finished && !match.decision && !S.timer) startTimer();
  };
  w.querySelectorAll(".h-opt").forEach(b => b.onclick = () => {
    if (!setHeight(match, +b.dataset.h)) return;
    markMomentum(match, "⚙️");   // decisión táctica: marca en el gráfico, nunca puntos
    cerrar();
  });
  w.querySelector("#h-close").onclick = cerrar;
}

/* ── EL CARRUSEL: Match Momentum ↔ Mapa de calor ────────────────────────────
   Estado de VISTA, no de partido: cuál diapositiva se mira y de quién es el mapa.
   Vive en el módulo (no en `S`) porque muere con la pantalla, como `slide`. */
const SLIDES = ["Match Momentum", "Mapa de calor"];
let slide = 0, heatSide = "mine";

/** Alterna de diapositiva (delta ±1, circular). */
function moveCarousel(d) {
  slide = (slide + d + SLIDES.length) % SLIDES.length;
  paintCarousel();
}

/** Pinta la diapositiva activa: título, leyenda y qué panel se ve. */
function paintCarousel() {
  const t = $("#car-title"); if (!t) return;
  t.textContent = SLIDES[slide];
  const mm = $("#slide-mm"), heat = $("#slide-heat");
  mm.classList.toggle("hidden", slide !== 0);
  mm.classList.toggle("flex", slide === 0);
  heat.classList.toggle("hidden", slide !== 1);
  heat.classList.toggle("flex", slide === 1);
  const me = S.matchCtx.team.name, opp = S.match.oppTeam.name;
  $("#car-legend").innerHTML = slide === 0
    ? `<span class="flex items-center gap-1 text-emerald-400"><i class="w-2 h-2 rounded-sm bg-emerald-400 inline-block"></i>${me}</span>
       <span class="flex items-center gap-1 text-red-400"><i class="w-2 h-2 rounded-sm bg-red-400 inline-block"></i>${opp}</span>`
    // La escala del mapa se explica sola: de "sin uso" a rojo, como en la tele.
    : `<span class="text-slate-500">Sin uso</span>
       <i class="inline-block h-1.5 w-16 rounded-full" style="background:linear-gradient(90deg,rgba(250,204,21,.25),rgb(250,204,21),rgb(249,115,22),rgb(239,68,68))"></i>
       <span class="text-red-400">Intenso</span>`;
  // Los botones de a quién se mira (solo tienen sentido en el mapa).
  document.querySelectorAll(".heat-side").forEach(b => {
    const on = b.dataset.heat === heatSide;
    b.className = `heat-side px-2 py-0.5 rounded-md text-[9px] font-black border cursor-pointer transition-colors ${
      on ? "border-amber-400 bg-amber-400/20 text-amber-200" : "border-slate-700 bg-slate-800 text-slate-500 hover:text-slate-300"}`;
  });
  paintHeat(S.match, true);
}

/**
 * EL MAPA DE CALOR del tiempo EN CURSO (cada tiempo tiene el suyo: el motor lo reinicia
 * al empezar el segundo). Se repinta una vez por minuto —cuando hay calor nuevo—, no en
 * cada refresco: son 15 nodos con desenfoque. El motor sirve las celdas ya normalizadas;
 * acá no se decide nada del partido.
 */
function paintHeat(match, force = false) {
  const box = $("#heat-pitch");
  if (!box || (slide !== 1 && !force)) return;
  const marca = `${match.min}-${heatSide}-${match.field?.maps.length}`;
  if (!force && box.dataset.k === marca) return;
  box.dataset.k = marca;
  box.innerHTML = heatPitch(heatCells(match, heatSide));
}

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
  paintPressButton(match);
  // El botón del bloque canta la altura vigente (y lo que costaría moverla ahora).
  const bh = $("#btn-height");
  if (bh) {
    const st = fieldState(match);
    bh.textContent = `${st.icon} ${st.label}`;
    bh.title = st.gratis
      ? `Bloque ${st.label.toLowerCase()}. Ahora moverlo es gratis. El rival está parado con un bloque ${st.rival}.`
      : `Bloque ${st.label.toLowerCase()}. Moverlo en juego consume una ventana táctica (quedan ${st.ventanas}). El rival está parado con un bloque ${st.rival}.`;
  }
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
  $("#btn-resume").onclick = () => { footer.innerHTML = ""; startTimer(); };
}

/* ---------- Gestión de plantilla en partido ---------- */

/**
 * Gestión de plantilla en vivo: la misma cancha del hub, con el partido en pausa.
 * Arrastrar titular sobre titular reubica (gratis); traer a alguien del banco es un cambio.
 *
 * NADA toca el partido hasta Confirmar: los cambios se arman como un plan y se aplican
 * juntos. Las reubicaciones sí mutan `posJugada` en el momento — es lo que la cancha lee
 * para previsualizar — y por eso se guarda el estado previo y se restaura al salir.
 */
function openSquadModal(caido = null) {
  const match = S.match;
  if (match.finished) return;
  const wasPaused = S.paused;
  S.paused = true;

  const previo = new Map(S.run.squad.map(p => [p, p.posJugada || null]));
  const once = S.matchCtx.lineup.slice();   // once previsualizado
  let banco = match.my.bench.slice();
  const pendientes = [];                    // [{ sale, entra }] cambios por confirmar

  // EL DIBUJO (PO 28-jul): la formación no se guarda en ningún lado durante el partido —
  // se DERIVA de dónde está parado cada uno (`playedPos`), que es la única verdad acá.
  // Así sigue siendo correcta tras un cambio, una reubicación a mano o una expulsión,
  // sin un campo más que mantener sincronizado.
  const dibujo = () => {
    const c = { DEF: 0, MED: 0, DEL: 0 };
    once.forEach(p => { if (c[playedPos(p)] !== undefined) c[playedPos(p)]++; });
    return `${c.DEF}-${c.MED}-${c.DEL}`;
  };
  const dibujoInicial = dibujo();
  // Poder del once tal como está AHORA (antes de que la vista previa toque un solo
  // posJugada): es el punto de comparación de todo lo que el DT pruebe en el modal.
  const poderPrevio = teamPowers(S.matchCtx.lineup, S.matchCtx.mentalidad, S.matchCtx.buffs);

  const enOnce = p => once.includes(p);
  /** En el once previsualizado y en condiciones de jugar: un expulsado o lesionado no se mueve. */
  const activo = p => enOnce(p) && !p.expulsado && !p.lesionado;
  /** Puede SALIR en un cambio: los activos y el lesionado aún en cancha (PO 22-jul: el
   *  caído se reemplaza acá, arrastrando un suplente sobre su ficha — no se reubica). */
  const puedeSalir = p => activo(p) || (enOnce(p) && p.lesionado && !p.sustituido);
  const restantes = () => match.subsLeft - pendientes.length;
  const hayPlan = () => pendientes.length > 0 || once.some(p => (p.posJugada || null) !== previo.get(p));

  /** El cambio pendiente cuyo ENTRANTE es p (si p entró al once solo en el plan). */
  const pendienteDe = p => pendientes.find(c => c.entra === p);

  /**
   * Qué significa arrastrar `a` sobre `b`, o null si no se puede:
   *  - dos titulares activos → REUBICAR: intercambian el puesto, gratis (azul).
   *  - banco → titular → CAMBIO: se suma al plan y gastará 1 de 3 (verde).
   *  - un ENTRANTE del plan → banco → EDITAR el plan, gratis (ámbar): sobre el que
   *    salía lo DESHACE; sobre otro suplente elegible, entra ese en su lugar.
   *    Mientras no se confirme, el plan es plastilina — nada se gastó todavía.
   * Las reglas del cambio las manda el motor (`eligibleFor`): el arco solo lo cubre un
   * arquero, un arquero no sale a la cancha, y el sustituido no reingresa.
   */
  const tipo = (a, b) => {
    if (match.finished) return null;
    if (activo(a) && activo(b)) {
      // Enrocar dos que juegan el MISMO puesto no cambia nada (mismas stats de posición):
      // se prohíbe para no ofrecer un gesto sin efecto (pedido del PO).
      if (playedPos(a) === playedPos(b)) return null;
      // El arco no se permuta: solo un arquero puede ocuparlo (game/lineup.canPlayAt).
      return canPlayAt(a, playedPos(b)) && canPlayAt(b, playedPos(a)) ? { tone: "sky", kind: "mover" } : null;
    }
    const sale = puedeSalir(a) ? a : puedeSalir(b) ? b : null;
    const entra = sale === a ? b : a;
    if (!sale || enOnce(entra)) return null;
    const plan = pendienteDe(sale);
    if (plan) {
      // Editar el plan no gasta ni consulta `restantes`: ese cambio ya estaba contado
      if (entra === plan.sale) return { tone: "amber", kind: "deshacer", plan };
      if (match.availableBench().includes(entra) && match.eligibleFor(plan.sale).includes(entra))
        return { tone: "amber", kind: "reemplazar", plan, entra };
      return null;
    }
    if (restantes() <= 0) return null;
    // El que sale tiene que ser titular de verdad: no se encadenan cambios sobre un
    // jugador que recién metiste en el plan (editar su cambio sí se puede, arriba).
    if (!S.matchCtx.lineup.includes(sale)) return null;
    if (!match.availableBench().includes(entra) || !match.eligibleFor(sale).includes(entra)) return null;
    return { tone: "emerald", kind: "cambio", sale, entra };
  };

  const wrap = modal(`
    <div class="flex items-center justify-between gap-3 mb-3 flex-wrap">
      <h2 class="text-lg font-black">🔄 Gestión de plantilla</h2>
      <span class="text-xs text-slate-400">Cambios restantes: <b id="modal-subs" class="text-amber-300">${match.subsLeft}</b> de 3</span>
    </div>
    ${caido ? `<div class="p-2.5 rounded-lg border border-red-400/60 bg-red-500/10 text-sm text-red-300 font-bold mb-3">🚑 ${caido.name} no puede continuar: arrastra un suplente sobre su ficha y confirma el cambio (o sal y juegan con uno menos).</div>` : ""}
    <!-- CAMBIAR EL DIBUJO EN PARTIDO (PO 28-jul): las 6 formaciones a un clic. No gasta
         cambio —es una reubicación masiva, la misma moneda que arrastrar una ficha— y
         tampoco toca QUIÉN juega: solo dónde se para cada uno. A diferencia del hub, acá
         NINGUNA está deshabilitada: si no tienes defensas para un 3-1-1, alguien juega
         fuera de puesto y paga su ❗ — que es exactamente la decisión del DT. -->
    <div class="flex items-center gap-1.5 mb-3 flex-wrap">
      <span class="text-[10px] uppercase tracking-widest text-slate-500 font-bold mr-1">Dibujo</span>
      ${FORMATIONS.map(f => `<button data-form="${f.id}" title="${f.def} defensa(s) · ${f.med} medio(s) · ${f.del} delantero(s)"
        class="form-btn px-2 py-1 rounded-lg text-[11px] font-black border cursor-pointer transition-colors"></button>`).join("")}
      <!-- El SALDO real del dibujo, en vivo (OJO: nada de backticks en estos comentarios,
           que viven dentro de un template literal y lo cortan). Nació como mitigación de un
           bug —el dial de formación estaba invertido— y se queda ahora que está arreglado,
           porque sigue siendo la información que el DT necesita: el nombre del dibujo dice
           la INTENCIÓN, el saldo dice lo que ESTE plantel puede ejecutar. Con dos defensas
           de verdad, un 3-1-1 puede salir peor que un 2-2-1, y eso solo se ve acá. -->
      <span id="poder-delta" class="text-[10px] font-bold ml-auto tabular-nums"></span>
    </div>
    <div class="grid sm:grid-cols-[minmax(0,1fr)_11rem] gap-3 items-start">
      <div id="match-pitch" class="pitch relative w-full h-[22rem] rounded-xl overflow-hidden border-2 border-slate-900"></div>
      <div>
        <div class="text-[10px] uppercase tracking-widest text-slate-500 font-bold mb-1.5">Banco</div>
        <div id="match-bench" class="grid grid-cols-2 gap-1.5"></div>
      </div>
    </div>
    <div class="flex items-center gap-4 mt-3 text-[10px] text-slate-400 flex-wrap">
      <span class="flex items-center gap-1.5"><i class="w-3 h-3 rounded ring-2 ring-sky-400 inline-block"></i> Reubicar — gratis</span>
      <span class="flex items-center gap-1.5"><i class="w-3 h-3 rounded ring-2 ring-emerald-400 inline-block"></i> Cambio — gasta 1 de 3</span>
      <span class="flex items-center gap-1.5"><i class="w-3 h-3 rounded ring-2 ring-amber-400 inline-block"></i> Ajustar un cambio sin aplicar — gratis</span>
      <span class="flex items-center gap-1.5"><i class="text-orange-400 font-black">!</i> Fuera de puesto</span>
    </div>
    <div id="plan-resumen" class="mt-3"></div>
    <div class="grid grid-cols-2 gap-2 mt-3">
      <button id="squad-cancel" class="text-sm font-bold py-2.5 rounded-lg bg-slate-700 hover:bg-slate-600 cursor-pointer"></button>
      <button id="squad-ok" class="text-sm font-black py-2.5 rounded-lg tp-gradient cursor-pointer hover:brightness-110 transition-all"></button>
    </div>
  `, "max-w-3xl");

  const paint = () => {
    mountPitch({
      pitchEl: wrap.querySelector("#match-pitch"),
      benchEl: wrap.querySelector("#match-bench"),
      team: S.matchCtx.team,
      lineup: once,
      bench: banco,
      sizes: { sprite: "w-9 h-11", bench: "w-8 h-10" },
      badge: p => `${momentoChip(p)}${p.usado ? "🔄" : ""}${p.amarillaPartido ? "🟨" : ""}${p.expulsado ? "🟥" : ""}${p.lesionado ? "🚑" : ""}${p.sustituido ? "↩" : ""}`,
      extra: p => `<span class="block w-10 mx-auto mt-0.5">${energyBar(p.energia)}</span>`,
      muted: p => p.expulsado || p.lesionado || p.sustituido,
      // Arrastrables: los activos del once previsualizado, el banco real disponible y
      // el que SALÍA en un cambio pendiente (vive en el banco de la vista previa y
      // tiene que poder volver — es la edición del plan).
      draggable: p => activo(p) || (!enOnce(p) && (match.availableBench().includes(p) || pendientes.some(c => c.sale === p))),
      canSwap: tipo,
      onSwap: (a, b) => {
        const s = tipo(a, b);
        if (!s) return;
        if (s.kind === "mover") {
          if (!swapAssignments(a, b)) return toast("No pueden intercambiar ese puesto.");
        } else if (s.kind === "deshacer") {
          // El cambio pendiente se anula entero: cada uno vuelve a donde estaba
          once[once.indexOf(s.plan.entra)] = s.plan.sale;
          banco = banco.filter(x => x !== s.plan.sale).concat(s.plan.entra);
          s.plan.entra.posJugada = previo.get(s.plan.entra) || null;
          pendientes.splice(pendientes.indexOf(s.plan), 1);
        } else if (s.kind === "reemplazar") {
          // Mismo cambio, otro protagonista: hereda el puesto que dejaba el anterior
          const puesto = s.plan.entra.posJugada || s.plan.entra.pos;
          once[once.indexOf(s.plan.entra)] = s.entra;
          banco = banco.filter(x => x !== s.entra).concat(s.plan.entra);
          s.plan.entra.posJugada = previo.get(s.plan.entra) || null;
          s.entra.posJugada = canPlayAt(s.entra, puesto) ? puesto : s.entra.pos;
          s.plan.entra = s.entra;
        } else {
          once[once.indexOf(s.sale)] = s.entra;
          banco = banco.filter(x => x !== s.entra).concat(s.sale);
          // Previsualiza el puesto que ocupará: el mismo que le pondrá makeSub al confirmar.
          const puesto = s.sale.posJugada || s.sale.pos;
          s.entra.posJugada = canPlayAt(s.entra, puesto) ? puesto : s.entra.pos;
          pendientes.push({ sale: s.sale, entra: s.entra });
        }
        paint();
      },
    });
    wrap.querySelector("#modal-subs").textContent = restantes();
    paintFormBtns();
    renderPlan();
  };

  /**
   * Los 6 botones del dibujo (el vigente resaltado, derivado de la cancha) y el SALDO de
   * poder que deja la vista previa. El saldo se pinta siempre, no solo al tocar el dibujo:
   * mover una ficha a mano tiene el mismo efecto y merece la misma transparencia.
   */
  const paintFormBtns = () => {
    const ahora = teamPowers(once, S.matchCtx.mentalidad, S.matchCtx.buffs);
    const delta = (k, lbl) => {
      const d = ahora[k] - poderPrevio[k];
      if (Math.abs(d) < 0.005) return `<span class="text-slate-500">${lbl} =</span>`;
      return `<span class="${d > 0 ? "text-emerald-400" : "text-red-400"}">${lbl} ${d > 0 ? "+" : ""}${d.toFixed(2)}</span>`;
    };
    wrap.querySelector("#poder-delta").innerHTML = `${delta("atk", "⚔️")} &nbsp; ${delta("def", "🛡️")}`;
    const actual = dibujo();
    wrap.querySelectorAll(".form-btn").forEach(b => {
      const cur = b.dataset.form === actual;
      b.textContent = b.dataset.form;
      b.className = `form-btn px-2 py-1 rounded-lg text-[11px] font-black border cursor-pointer transition-colors ${
        cur ? "border-sky-400 bg-sky-400/20 text-sky-200" : "border-slate-600 bg-slate-800 text-slate-400 hover:border-sky-400/60 hover:text-slate-200"}`;
    });
  };

  /** Resumen de lo que está por aplicarse: nada de esto pasó todavía. */
  const renderPlan = () => {
    const reubicados = once.filter(p => (p.posJugada || null) !== previo.get(p) && !pendientes.some(c => c.entra === p));
    wrap.querySelector("#plan-resumen").innerHTML = !hayPlan()
      ? `<p class="text-[11px] text-slate-500 text-center">Arrastra las fichas para armar los cambios. Nada se aplica hasta que confirmes.</p>`
      : `<div class="p-2 rounded-lg border border-amber-400/50 bg-amber-400/10 space-y-0.5">
          <div class="text-[10px] uppercase tracking-wider text-amber-300 font-black mb-1">Sin aplicar</div>
          ${dibujo() !== dibujoInicial ? `<div class="text-[11px] text-slate-200">📐 Dibujo: <b>${dibujoInicial}</b> → <b class="text-sky-300">${dibujo()}</b></div>` : ""}
          ${pendientes.map(c => `<div class="text-[11px] text-slate-200">🔄 Entra <b>${c.entra.name}</b> por <b>${c.sale.name}</b>${
            outOfPosPenalty(c.entra) > 0 ? ` <span class="text-orange-400">— ❗ jugaría de ${POS_NAME[playedPos(c.entra)].toLowerCase()}</span>` : ""}</div>`).join("")}
          ${reubicados.map(p => `<div class="text-[11px] text-slate-200">📢 <b>${p.name}</b> pasa a ${POS_NAME[playedPos(p)].toLowerCase()}${
            outOfPosPenalty(p) > 0 ? ` <span class="text-orange-400">— ❗ no es su puesto</span>` : ""}</div>`).join("")}
        </div>`;
    const ok = wrap.querySelector("#squad-ok");
    const cancel = wrap.querySelector("#squad-cancel");
    ok.textContent = pendientes.length ? `✔ Confirmar (${pendientes.length} cambio${pendientes.length > 1 ? "s" : ""})` : "✔ Confirmar";
    ok.disabled = !hayPlan();
    ok.classList.toggle("opacity-40", !hayPlan());
    ok.classList.toggle("cursor-not-allowed", !hayPlan());
    cancel.textContent = hayPlan() ? "✕ Salir sin guardar" : "Volver al partido";
  };

  /** Aplica el plan al partido: primero los cambios, después las posiciones finales. */
  const confirmar = () => {
    // El plan manda: si el DT reubicó a alguien DESPUÉS de meterlo, makeSub le pondría el
    // puesto del que salió — por eso las posiciones finales se escriben al final.
    const posFinal = once.map(p => [p, p.posJugada || null]);
    const movidos = once.filter(p => (p.posJugada || null) !== previo.get(p) && !pendientes.some(c => c.entra === p));
    let fallidos = 0;
    for (const c of pendientes) if (!match.makeSub(c.sale, c.entra.name)) fallidos++;
    for (const [p, pos] of posFinal) p.posJugada = pos;
    // Un cambio de dibujo mueve hasta 5 fichas: se narra como UNA orden del banco, no como
    // cinco reubicaciones sueltas (que es como sigue narrándose mover a uno solo).
    if (dibujo() !== dibujoInicial) match.log("info", `📢 min ${match.clock()}' — El banco cambia el dibujo: ${dibujoInicial} → ${dibujo()}.`);
    else for (const p of movidos) match.log("info", `📢 min ${match.clock()}' — ${p.name} pasa a ${POS_NAME[playedPos(p)].toLowerCase()}.`);
    closeModal();
    S.paused = wasPaused;
    updateMatchUI();
    if (fallidos) toast(`${fallidos} cambio(s) no se pudieron aplicar.`);
    reanudar();
  }

  /** El reloj retoma al cerrar (el flujo de la lesión llega con el timer detenido). */
  const reanudar = () => { if (!match.finished && !match.decision) startTimer(); };;

  /** Sale sin tocar el partido: deshace las reubicaciones y tira el plan. */
  const cancelar = () => {
    for (const [p, pos] of previo) p.posJugada = pos;
    closeModal();
    S.paused = wasPaused;
    reanudar();
  };

  paint();
  wrap.querySelectorAll(".form-btn").forEach(b => b.onclick = () => {
    // La regla vive en game/lineup: quién va a qué puesto. Acá solo se escribe la vista
    // previa (posJugada), igual que una reubicación a mano — y como todo el plan, no toca
    // el partido hasta Confirmar.
    const map = assignToFormation(once, b.dataset.form);
    if (!map) return toast("Con este once no se puede armar ese dibujo.");
    for (const [p, pos] of map) p.posJugada = pos;
    paint();
  });
  wrap.querySelector("#squad-ok").onclick = () => { if (hayPlan()) confirmar(); };
  wrap.querySelector("#squad-cancel").onclick = cancelar;
}

register("start-match", startMatch);
