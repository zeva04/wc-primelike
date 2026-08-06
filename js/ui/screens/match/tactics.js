/* ============================================================
   ui/screens/match/tactics — LAS PALANCAS DEL DT durante el juego:
   el botón de presión y la pizarra de la altura del bloque.

   Las REGLAS viven en el motor (game/match/press y game/match/field:
   cuándo se puede presionar, cuánto cuesta mover el bloque, qué
   alturas se pueden elegir). Acá solo se pregunta, se pinta y se
   rutea — el botón nunca decide.

   Importa `updateMatchUI`/`startTimer` de la pantalla: es un ciclo
   BENIGNO, solo de runtime (mismo patrón que game/match usa entre
   sequences y sequence-acts).
   ============================================================ */
import { startPress, pressState } from "../../../game/match/press.js";
import { fieldState, setHeight } from "../../../game/match/field.js";
import { markMomentum } from "../../../game/match/match-momentum.js";
import { S } from "../../session.js";
import { $, modal, closeModal } from "../../components.js";
import { updateMatchUI, startTimer } from "./index.js";

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
    // BUG FIX (2-ago-2026): `!S.timer` no distingue "pausa manual" de "estamos en el
    // entretiempo" — showHalftime también deja el timer en null, y ahí el ÚNICO botón
    // que puede reanudar es el dedicado ("Continuar el partido"). Sin `!S.halftime`
    // acá, cambiar la altura en el entretiempo reanudaba el partido solo mientras el
    // botón de "Continuar" seguía en pantalla mintiendo sobre el estado real — y
    // apretarlo después volvía a llamar a startTimer() sobre un partido que ya venía
    // corriendo, dejando el relato colgado.
    if (!match.finished && !match.decision && !S.timer && !S.halftime) startTimer();
  };
  w.querySelectorAll(".h-opt").forEach(b => b.onclick = () => {
    if (!setHeight(match, +b.dataset.h)) return;
    markMomentum(match, "⚙️");   // decisión táctica: marca en el gráfico, nunca puntos
    cerrar();
  });
  w.querySelector("#h-close").onclick = cerrar;
}


/**
 * Cablea las dos palancas del DT. Las REGLAS viven en el motor (game/match/press y
 * game/match/field): estos botones solo preguntan y pintan.
 */
export function wireTactics() {
  $("#btn-height").onclick = openHeightModal;
  $("#btn-press").onclick = () => {
    if (!startPress(S.match)) return;   // la regla vive en game/match/press, no en el botón
    updateMatchUI();
  };
}

/** Pinta las dos palancas: el botón de presión y el del bloque (con su altura vigente
 *  y lo que costaría moverla ahora). */
export function paintTactics(match) {
  paintPressButton(match);
  const bh = $("#btn-height");
  if (!bh) return;
  const st = fieldState(match);
  bh.textContent = `${st.icon} ${st.label}`;
  bh.title = st.gratis
    ? `Bloque ${st.label.toLowerCase()}. Ahora moverlo es gratis. El rival está parado con un bloque ${st.rival}.`
    : `Bloque ${st.label.toLowerCase()}. Moverlo en juego consume una ventana táctica (quedan ${st.ventanas}). El rival está parado con un bloque ${st.rival}.`;
}
