/* ============================================================
   ui/screens/match/index — LA PANTALLA del partido en vivo: la
   estructura fija (marcador, relato, mando), el reloj del relato y
   el ruteo de decisiones.

   ── EL REDISEÑO DEL 7-AGO-2026 ────────────────────────────────
   Adaptado del diseño "Partido - Mockups v2" (Claude Design). El
   partido dejó de ser una página que hace scroll y pasó a ser un
   PUENTE DE MANDO: lienzo FIJO de 1440×900 escalado entero, como
   la Concentración (ver components.screenStage y el bloque "EL
   PARTIDO" del kit px-* en index.html).

   Las dos ideas del rediseño:
     · el mando es una COLUMNA a la derecha, siempre a la vista —
       mentalidad, altura del bloque, presión, plantilla y energía
       dejaron de estar repartidos entre la cabecera y dos modales;
     · la decisión ATERRIZA DENTRO DEL RELATO, en el mismo sitio
       donde se venía leyendo el minuto. Ya no hay modal que tape
       el partido mientras se decide (salvo las decisiones que son
       una lista de jugadores: ver showDecision).

   Ni una regla de juego se movió con el rediseño. Lo que sí se
   agregó al motor es el RIESGO de cada opción (`option.risk`, ver
   game/match/sequence-acts.js): dato de diseño que la tarjeta
   dibuja, y que el jugador antes tenía que adivinar del texto.

   El resto de la pantalla vive en módulos hermanos, que operan
   sobre el mismo DOM (el presupuesto de líneas de ARQUITECTURA §6):
     panels.js   → la columna de lectura (estadísticas, XP de
                   identidad y el carrusel momentum ↔ mapa de calor)
     tactics.js  → el Centro de mando (las palancas del DT)
     squad.js    → la Gestión de plantilla en vivo

   Contrato de decisiones: ver game/match/Match.js. Agregar una
   decisión nueva exige su entrada de ruteo en handleDecision.
   ============================================================ */
import { getTeam } from "../../../data/teams-repo.js";
import { statLine } from "../../../game/ratings.js";
import { STAGE_LABEL, koRoundOf } from "../../../game/tournament/knockout.js";
import { Match } from "../../../game/match/Match.js";
import { markMomentum } from "../../../game/match/match-momentum.js";
import { HEIGHT_DEFAULT } from "../../../game/match/field.js";
import { actProgress, RISK_MAX } from "../../../game/match/sequence-acts.js";
import { filoOfType, getPhilosophy } from "../../../content/identity/philosophies.js";
import { filoCtx, PLAN_XP_MULT } from "../../../game/philosophy.js";
import { S } from "../../session.js";
import { register, go } from "../../nav.js";
import { screenStage, $, flagImg, modal, closeModal } from "../../components.js";
import { paintStats, paintFiloXp, paintMomentum, paintHeat, wireCarousel, resetCarousel } from "./panels.js";
import { commandColumn, wireCommand, paintCommand } from "./tactics.js";
import { openSquadModal } from "./squad.js";

/** Crea la instancia Match con el once elegido y arranca el reloj del relato. */
function startMatch(oppId) {
  const me = getTeam(S.run.teamId);
  const opp = getTeam(oppId);
  const bench = S.run.squad.filter(p => !S.selectedLineup.includes(p) && !p.suspendido && p.lesionadoPartidos === 0);
  // La filosofía cruza la frontera run→Match como la moral: {id, nivel}, nada más.
  // koRound: la profundidad KO enciende la escalada del rival (forma de torneo).
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


/** La cabecera: banderas, marcador, minuto y los dos controles del reloj de pared. */
function cabecera(me, opp) {
  return `
    <div class="flex items-center gap-4 shrink-0" style="height:76px;padding:0 16px;background:var(--px-panel);border-bottom:2px solid var(--wc-black)">
      <div class="px-flag">${flagImg(me, "")}</div>
      <div class="px" style="font-size:16px">${me.name}</div>
      <div class="ml-auto flex flex-col items-center" style="gap:2px">
        <div id="score" class="px" style="font-size:34px;letter-spacing:.14em">0 - 0</div>
        <div class="flex items-center gap-2">
          <span id="minute" class="px" style="font-size:12px;color:var(--px-warn)">0'</span>
          <span id="phase" class="px-body uppercase" style="font-size:12px;letter-spacing:.1em;color:var(--px-faint)">1º tiempo</span>
        </div>
      </div>
      <div class="ml-auto px" style="font-size:16px">${opp.name}</div>
      <div class="px-flag">${flagImg(opp, "")}</div>
      <div class="flex items-center gap-2" style="margin-left:24px">
        <button id="btn-pause" class="px-btn2 px" style="height:34px;padding:0 12px;font-size:9px">⏸️ Pausa</button>
        <button id="btn-speed" class="px-btn2 px" style="height:34px;padding:0 12px;font-size:9px">⏩ Rápido</button>
      </div>
    </div>
    <div class="px-host"><div style="flex:1;background:#EA002A"></div><div style="flex:1;background:#007A33"></div><div style="flex:1;background:#0057B8"></div></div>`;
}


/** Pinta la estructura fija del partido: cabecera, columna de lectura, relato y mando. */
function renderMatchScreen() {
  const me = S.matchCtx.team, opp = S.match.oppTeam;
  const fit = screenStage(`
    ${cabecera(me, opp)}

    <!-- EL CUERPO: tres columnas de ancho FIJO salvo el relato, que es la pieza
         elástica. 328 (lectura) · resto (relato) · 404 (mando). -->
    <div class="flex" style="flex:1;min-height:0;gap:12px;padding:12px">

      <!-- ══ COLUMNA DE LECTURA ══ Las estadísticas responden "cómo va", la
           identidad "qué estoy aprendiendo" y el carrusel "dónde y quién manda
           ahora". Ninguna se toca: es la mitad de la pantalla que solo se mira. -->
      <div class="flex flex-col shrink-0" style="width:328px;gap:10px">
        <div class="px-panel flex flex-col shrink-0">
          <div class="px-head">
            <span class="px" style="font-size:10px">Cómo va</span>
            <!-- El chip de momentum vive con las estadísticas porque es su lectura
                 dinámica: quién está generando en los últimos 15'. -->
            <span id="mom-chip" class="px ml-auto" style="font-size:11px;color:var(--px-faint)" title="Momentum: quién está generando en los últimos 15'">·</span>
          </div>
          <div id="match-stats" class="flex flex-col" style="padding:10px;gap:11px"></div>
        </div>

        <!-- LA IDENTIDAD SE APRENDE EN VIVO (arco de Progresión): la XP que cada idea
             va ganando ESTE partido, con la barra hacia su próximo nivel. El feed
             grita la subida; esto la deja ver venir. -->
        <div class="px-panel flex flex-col shrink-0">
          <div class="px-head">
            <span class="px" style="font-size:10px">Identidad en vivo</span>
            <!-- Solo el NOMBRE de la idea que se juega: el nivel lo canta cada fila, ya
                 actualizado con lo aprendido en este partido. Repetirlo acá con la foto
                 del arranque decía "nv2" al lado de un "nv3" — parecía un bug. -->
            <span class="px-body ml-auto uppercase" style="font-size:12px;letter-spacing:.06em;color:var(--px-faint)">${S.matchCtx.filo
              ? getPhilosophy(S.matchCtx.filo.id).name
              : "Sin idea declarada"}</span>
          </div>
          <div id="filo-xp" class="flex flex-col" style="padding:10px;gap:10px"></div>
        </div>

        <!-- EL CARRUSEL DE LECTURA (sprint del Territorio): dos formas de leer el mismo
             partido en el mismo sitio — el Match Momentum (quién genera AHORA) y el mapa
             de calor (dónde se está jugando). Las flechas alternan; ambos se actualizan
             en vivo aunque no se estén viendo, porque los dos los sirve el motor.
             Es lo ÚLTIMO de la columna y se lleva TODO lo que sobre (flex:1): los dos
             gráficos se posicionan en %, así que escalan solos con el contenedor. -->
        <div class="px-panel flex flex-col" style="flex:1;min-height:0">
          <div class="px-head">
            <button id="car-prev" class="px-x" title="Anterior">‹</button>
            <span id="car-title" class="px truncate" style="font-size:10px">Match Momentum</span>
            <button id="car-next" class="px-x ml-auto" title="Siguiente">›</button>
          </div>
          <div id="car-legend" class="flex items-center justify-center gap-2 shrink-0 px-body" style="font-size:11px;padding:6px 8px 0"></div>
          <div id="slide-mm" class="flex flex-col" style="flex:1;min-height:0;padding:6px 10px 8px">
            <div id="mm-chart" class="relative w-full" style="flex:1;min-height:0"></div>
            <div id="mm-axis" class="relative w-full px shrink-0" style="height:14px;font-size:8px;color:var(--px-faint)"></div>
          </div>
          <!-- EL MAPA DE CALOR: la cancha ocupa el alto disponible manteniendo su
               proporción (aspect-ratio), con mi arco abajo. Debajo, a quién se mira. -->
          <div id="slide-heat" class="hidden flex-col" style="flex:1;min-height:0;padding:6px 10px 8px">
            <div class="flex items-center justify-center" style="flex:1;min-height:0">
              <div id="heat-pitch" class="h-full max-w-full" style="aspect-ratio:3/4"></div>
            </div>
            <div class="flex items-center justify-center gap-1 shrink-0" style="margin-top:6px">
              <button data-heat="mine" class="heat-side px" style="font-size:8px;padding:3px 6px;border:2px solid;cursor:pointer">${me.name}</button>
              <button data-heat="opp" class="heat-side px" style="font-size:8px;padding:3px 6px;border:2px solid;cursor:pointer">${opp.name}</button>
            </div>
          </div>
        </div>
      </div>

      <!-- ══ EL RELATO ══ La decisión aterriza ARRIBA de todo (#dec-slot) y el relato
           corre debajo, del minuto más nuevo al más viejo: así lo que se decide y lo
           que lo provocó quedan pegados, en vez de a media pantalla de distancia. -->
      <div class="px-panel flex flex-col" style="flex:1;min-width:0;background:var(--px-panel-lo)">
        <div class="px-head">
          <span class="px" style="font-size:10px;color:var(--wc-gold-light)">El partido</span>
          <span class="px-body uppercase" style="font-size:12.5px;letter-spacing:.08em;color:var(--px-faint)">Relato en vivo</span>
        </div>
        <div id="dec-slot" class="shrink-0"></div>
        <div id="feed" class="flex flex-col" style="flex:1;min-height:0;overflow-y:auto;padding:12px;gap:6px"></div>
      </div>

      ${commandColumn()}
    </div>

    <div class="px-scan"></div>
    <div class="px-vig"></div>
  `);
  window.onresize = fit;

  // Cada módulo cablea SUS controles: el carrusel vive con el estado de la vista
  // (panels) y las palancas del DT con sus reglas (tactics). Esta pantalla solo pinta
  // la estructura y reparte.
  wireCarousel();
  wireCommand();
  $("#btn-pause").onclick = togglePause;
  $("#btn-speed").onclick = () => {
    // El reloj lee CRUISE en cada paso, así que cambiar la velocidad tiene efecto solo: no
    // hace falta reiniciar el timer (reiniciar duplicaría el auto-agendado).
    S.speed = S.speed === 1 ? 2 : 1;
    $("#btn-speed").textContent = S.speed === 1 ? "⏩ Rápido" : "🐢 Normal";
  };
  // Las teclas de la decisión: A/B/C (y 1/2/3, que es lo que la mano busca sola).
  document.onkeydown = onDecisionKey;
}

// Ritmo del partido: la simulación CORRE entre secuencias
// —el relato de ambiente pasa rápido, da la sensación de partido vivo— y FRENA en seco al
// llegar una secuencia (que es una decisión, congela sola). Un gol hace una pausa breve para
// que se registre. El reloj se auto-agenda con setTimeout para poder variar el ritmo por paso.
// Ajuste PO ("no asfixiar"): todo más lento, y AIRE entre actos encadenados — el
// desenlace de un acto se LEE antes de que el modal siguiente lo tape.
// EL RELOJ CONTINUO (PO): un tick ES un minuto de partido, y se ve correr —
// 2 segundos por minuto en velocidad normal (un partido dura ~3'30" de reloj de pared
// más lo que el DT tarde en decidir). "Rápido" comprime a 0,8 s/minuto para quien ya
// vio el partido. El congelado en las decisiones lo hace solo el motor: tick corta
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


/**
 * El relato lo escribe el motor cantando el minuto adentro del texto ("🟨 min 48' —
 * Amarilla a…"): así se lee en cualquier parte, incluido el post-partido. Pero el relato
 * en vivo ahora tiene COLUMNA DE MINUTO propia, y repetirlo dos veces en la misma línea
 * queda torpe. Esto le saca el minuto al texto conservando el emoji, que es lo que dice
 * de un vistazo qué clase de línea es. Si el patrón no aparece, no toca nada.
 */
const MINUTO_EN_TEXTO = /^([^\w\s]*\s*)(?:min\s+)?\d+(?:\+\d+)?'\s*—\s*/u;
const sinMinuto = t => t.replace(MINUTO_EN_TEXTO, "$1").trim();

/** Refresca marcador, minuto, relato (solo líneas nuevas) y todos los paneles. */
export function updateMatchUI() {
  if (!$("#score")) return;
  const match = S.match;
  $("#score").textContent = `${match.gMy} - ${match.gOpp}`;
  // El reloj corre minuto a minuto y canta el descuento como la tele ("90+3'").
  const enDescuento = match.min > match.nominal;
  const min = $("#minute");
  min.textContent = `${match.clock()}'`;
  min.style.color = S.paused || match.decision ? "var(--wc-gold-light)" : enDescuento ? "var(--px-bad)" : "var(--px-warn)";
  // El pie del minuto dice en qué estamos: el reloj DETENIDO es información, no un detalle.
  const fase = $("#phase");
  fase.textContent = match.decision ? "Reloj detenido" : S.paused ? "En pausa" : S.halftime ? "Entretiempo"
    : match.phase === "extra" ? "Prórroga" : match.nominal > 45 ? "2º tiempo" : "1º tiempo";
  fase.style.color = match.decision || S.paused ? "var(--wc-gold-light)" : "var(--px-faint)";
  // Momentum: quién está generando en los últimos 15'. Vive junto al panel porque
  // es la lectura dinámica de las mismas estadísticas.
  const fl = match.flow();
  const mom = $("#mom-chip");
  if (mom) {
    const [sym, col] = fl.net > 4 ? ["▲▲", "var(--px-ok)"] : fl.net > 1 ? ["▲", "var(--px-ok)"]
      : fl.net < -4 ? ["▼▼", "var(--px-bad)"] : fl.net < -1 ? ["▼", "var(--px-bad)"] : ["·", "var(--px-faint)"];
    mom.textContent = sym;
    mom.style.color = col;
  }
  paintStats(match);
  paintFiloXp(match);
  paintMomentum(match);
  paintHeat(match);
  paintCommand(match);
  // El relato va del MÁS NUEVO al más viejo: la línea recién ocurrida queda pegada a la
  // tarjeta de decisión, arriba de todo, y no hay que perseguir ningún scroll.
  const feed = $("#feed");
  while (S.feedRendered < match.feed.length) {
    const f = match.feed[S.feedRendered++];
    const div = document.createElement("div");
    div.className = `px-line px-line-${f.kind} animate-fadein`;
    div.innerHTML = `<b></b><span></span>`;
    div.firstChild.textContent = `${f.clock ?? f.min}'`;
    div.lastChild.textContent = sinMinuto(f.text);
    feed.insertBefore(div, feed.firstChild);
  }
  feed.scrollTop = 0;
}

// --- Decisiones en partido ---

/** El riesgo de una opción: 5 casillas, verde ≤2 · ámbar 3 · rojo ≥4 (el dato es del motor). */
function riskBar(n) {
  const col = n >= 4 ? "var(--px-bad)" : n === 3 ? "var(--px-warn)" : "var(--px-ok)";
  return `<div class="flex items-center gap-1.5">
    <span class="px" style="font-size:8px;color:var(--px-faint)">Riesgo</span>
    <div class="px-risk">${Array.from({ length: RISK_MAX }, (_, i) =>
      `<i${i < n ? ` style="background:${col}"` : ""}></i>`).join("")}</div>
  </div>`;
}

/**
 * Presenta la decisión pendiente: la tarjeta dentro del relato, o —si es una lesión
 * (`injury_sub`)— la Gestión de plantilla en vivo con el caído marcado (PO el reemplazo
 * es manual, sin lista de recomendados). Se llama con delay para que el relato previo se lea.
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

const KEYS = ["A", "B", "C", "D"];

/**
 * Muestra la decisión pendiente. DOS caminos, y la frontera es cuántas opciones hay:
 *
 *   ≤3 opciones → la TARJETA dentro del relato (el caso normal: secuencias, penal en
 *     contra, último hombre). El partido nunca se tapa, que es la idea del rediseño.
 *   más → el modal de siempre. Esas decisiones son una LISTA DE JUGADORES (elegir
 *     pateador, quién sale por la roja al arquero, quién se pone los guantes): en
 *     columnas no entran, y no son una apuesta táctica sino un nombre.
 */
function showDecision() {
  const d = S.match.decision;
  if (d.options.length > 3) { showDecisionModal(d); return; }
  const acto = actProgress(S.match);
  // El ×1.5 del Plan de Partido, dicho EN EL MOMENTO en que se cobra: la XP de una
  // secuencia va a la filosofía DUEÑA DE SU TIPO (filoOfType), declarada o no, así que
  // el chip aparece cuando esa dueña es justo la idea que se declaró en la Sala de video.
  const plan = S.run.planFilo && S.match.seq && filoOfType(S.match.seq.type) === S.run.planFilo;
  $("#dec-slot").innerHTML = `
    <div class="px-dec" style="margin:12px 12px 0">
      <div class="px-dec-head">
        <span class="px" style="font-size:10px;color:var(--wc-gold-light);width:38px;flex-shrink:0">${S.match.clock()}'</span>
        <!-- El titular pierde el "min 67' —" (el minuto ya está a la izquierda) pero
             CONSERVA su emoji: es lo que dice de un vistazo qué clase de jugada es. -->
        <span style="font-size:15px;line-height:1.45;color:var(--wc-gold-light);font-weight:700">${d.title.replace(/\s*min\s[\d+]+'\s*—\s*/, " ")}</span>
      </div>
      <div class="flex flex-col" style="padding:12px;gap:9px">
        <div class="flex items-center gap-2">
          <span class="px" style="font-size:10px;color:var(--wc-gold-light)">Tu decisión</span>
          <span class="px-body" style="font-size:12.5px;color:var(--px-dim)">${d.text}</span>
          <span class="ml-auto flex items-center gap-1.5">
            ${acto ? `<span class="px" style="font-size:8px;color:var(--px-faint)">Acto ${acto.idx} de ${acto.total}</span>` : ""}
            ${plan ? `<span class="px-tag px-tag-gold" title="Plan de Partido: esta idea rinde más experiencia hoy">×${PLAN_XP_MULT} XP</span>` : ""}
          </span>
        </div>
        <div class="flex items-stretch" style="gap:9px">
          ${d.options.map((o, i) => `
            <button data-i="${i}" class="dec-opt px-dec-opt">
              <div class="flex items-center gap-2">
                <span class="px-key">${KEYS[i]}</span>
                <span class="px" style="font-size:10px;line-height:1.5">${o.label}</span>
              </div>
              ${o.hint ? `<div class="px-body" style="font-size:13px;line-height:1.4;color:var(--px-dim)">${o.hint}</div>` : ""}
              <div style="margin-top:auto">${o.risk ? riskBar(o.risk) : ""}</div>
            </button>`).join("")}
        </div>
      </div>
    </div>`;
  document.querySelectorAll(".dec-opt").forEach(b => b.onclick = () => chooseOption(+b.dataset.i));
  updateMatchUI();
}

/** El modal de las decisiones que son una lista de jugadores (no entran en columnas). */
function showDecisionModal(d) {
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
  m.querySelectorAll(".dec-opt").forEach(b => b.onclick = () => chooseOption(+b.dataset.i));
  updateMatchUI();
}

/** Resuelve la opción i de la decisión viva (la eligió el ratón o el teclado). */
function chooseOption(i) {
  const d = S.match.decision;
  if (!d || !d.options[i]) return;
  closeModal();
  $("#dec-slot").innerHTML = "";
  handleDecision(d, d.options[i].key);
}

/**
 * A/B/C — y 1/2/3, que es lo que la mano busca sola. El handler queda colgado de
 * `document` mientras dure la sesión, así que la primera condición es que la TARJETA
 * esté en pantalla: si no hay `#dec-slot` no estamos en el partido (o la decisión salió
 * por modal, donde estas teclas no significan nada).
 */
function onDecisionKey(e) {
  if (!document.getElementById("dec-slot")) return;
  const d = S.match?.decision;
  if (!d || !d.options.length || d.options.length > 3) return;
  const k = e.key.toUpperCase();
  const i = KEYS.indexOf(k) >= 0 ? KEYS.indexOf(k) : "123".indexOf(k);
  if (i < 0 || i >= d.options.length) return;
  e.preventDefault();
  chooseOption(i);
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
  // Aire entre actos (PO): el desenlace del acto se lee ANTES de que la próxima
  // tarjeta lo tape; y al cerrar una secuencia, el reloj retoma con un respiro.
  stopTimer();
  if (match.decision) { S.timer = setTimeout(presentDecision, ACT_HOLD); return; }
  S.timer = setTimeout(step, SEQ_END_HOLD);
}

/** Pausa de entretiempo: ocupa el mismo sitio que una decisión — porque lo es. */
function showHalftime() {
  updateMatchUI();
  $("#dec-slot").innerHTML = `
    <div class="px-dec flex items-center gap-3" style="margin:12px 12px 0;padding:12px">
      <div class="flex flex-col" style="gap:3px;min-width:0">
        <span class="px" style="font-size:10px;color:var(--wc-gold-light)">Entretiempo</span>
        <span class="px-body" style="font-size:13px;color:var(--px-dim)">Aprovechá para hacer cambios, mover el bloque —ahora es gratis— o ajustar la mentalidad.</span>
      </div>
      <button id="btn-resume" class="px-btn px ml-auto shrink-0" style="height:42px;padding:0 16px;font-size:11px">▶️ Continuar</button>
    </div>`;
  $("#btn-resume").onclick = () => {
    S.halftime = false;
    $("#dec-slot").innerHTML = "";
    updateMatchUI();
    startTimer();
  };
}


/**
 * DEV (lo llama js/dev/deeplink, y nadie más): adelanta el partido hasta el minuto
 * pedido sin esperar el reloj de pared, y deja la pantalla como quedó — con su tarjeta
 * de decisión abierta si el camino topó con una. Existe para poder MIRAR el partido
 * jugado: un deep-link recién montado está 0-0 al minuto 0, con el relato, el momentum
 * y el mapa de calor vacíos, y eso no se parece a nada de lo que hay que verificar.
 */
export function devFastForward(minuto, hastaDecision = false) {
  stopTimer();
  const m = S.match;
  // `minuto = "ht"` es el ESTADO entretiempo, que no tiene un número propio (cae en el
  // 45 más el descuento que sortee el partido): se corre hasta que el motor lo cante.
  const enHt = minuto === "ht";
  const meta = enHt ? 999 : minuto;
  const tope = meta + (hastaDecision ? 20 : 0);     // el margen para toparse con una jugada
  while (m.min < tope && !m.finished) {
    if (m.decision) {
      // Ya llegamos: la decisión viva es justo lo que se quería mirar.
      if (m.min >= meta && hastaDecision) break;
      // Por el camino se resuelven solas, SIEMPRE con la primera opción: el deep-link
      // monta un estado para mirarlo, no juega el partido — y elegir al azar haría que
      // dos capturas del mismo link no se parezcan.
      if (!m.decision.options.length) { m.decision = null; continue; }   // lesión: en dev no se abre la gestión
      handleDecision(m.decision, m.decision.options[0].key);
      stopTimer();                                  // handleDecision reagenda el reloj
      continue;
    }
    if (m.min >= meta && !hastaDecision) break;
    const r = m.tick();
    if (r === "pens" || r === "end") break;
    if (r === "halftime") { if (enHt) { S.halftime = true; showHalftime(); return; } S.halftime = false; }
  }
  updateMatchUI();
  if (m.decision) presentDecision();
}


register("start-match", startMatch);
