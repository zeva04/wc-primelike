/* ============================================================
   ui/screens/match/tactics — EL CENTRO DE MANDO: la columna de la
   derecha, todo lo que el DT puede TOCAR durante el partido.

   Mentalidad · altura del bloque · ráfaga de presión · plantilla ·
   energía, y al pie el asistente técnico. Es la única columna con
   borde de oro de la pantalla, y es literal: lo que se toca vive
   acá y en ningún otro sitio.

   ── QUÉ CAMBIÓ EL 7-AGO-2026 ─────────────────────────────────
   Antes esto eran dos botones en la cabecera y DOS MODALES (la
   pizarra de la altura y el modal de mentalidad). El rediseño los
   trajo a la vista permanente: la altura del bloque son cinco
   escalones que se clickean, no una pantalla que se abre. Las
   REGLAS no se movieron ni un milímetro — siguen viviendo en el
   motor (game/match/press y game/match/field: cuándo se puede
   presionar, cuánto cuesta mover el bloque, qué alturas se pueden
   elegir). Acá solo se pregunta, se pinta y se rutea.

   Importa `updateMatchUI`/`startTimer` de la pantalla: es un ciclo
   BENIGNO, solo de runtime (mismo patrón que game/match usa entre
   sequences y sequence-acts).
   ============================================================ */
import { startPress, pressState } from "../../../game/match/press.js";
import { fieldState, setHeight, HEIGHTS } from "../../../game/match/field.js";
import { markMomentum } from "../../../game/match/match-momentum.js";
import { S } from "../../session.js";
import { $ } from "../../components.js";
import { updateMatchUI } from "./index.js";
import { openSquadModal } from "./squad.js";

const MENTALIDADES = [
  { id: "defensiva", ico: "🛡️", label: "Defensiva" },
  { id: "normal", ico: "⚖️", label: "Normal" },
  { id: "ofensiva", ico: "⚔️", label: "Ofensiva" },
];

/** El bloque de un rótulo del mando: título en Silkscreen chico, siempre igual. */
const rotulo = txt => `<div class="px" style="font-size:9px;letter-spacing:.12em;color:var(--px-dim);margin-bottom:7px">${txt}</div>`;

/**
 * EL MARKUP FIJO de la columna. Lo pinta la pantalla una vez; los valores los rellena
 * `paintCommand` en cada refresco. Se arma acá y no en index.js para que el mando entre
 * y salga de una pieza: el que agregue una palanca toca un solo archivo.
 */
export function commandColumn() {
  return `
    <div class="px-cmd shrink-0" style="width:404px">
      <div class="px-cmd-head">
        <span class="px" style="font-size:12px;letter-spacing:.12em;color:var(--wc-gold-light)">Centro de mando</span>
        <span class="px ml-auto" style="font-size:8px;color:var(--px-dim)">DT Nv${S.run.dtNivel || 1}</span>
      </div>

      <!-- Las cuatro palancas se REPARTEN el alto de la columna (space-between): a la
           altura de una pantalla de 900 el contenido natural deja unos 200px sueltos, y
           amontonarlo arriba dejaba un agujero justo encima del asistente. -->
      <div class="flex flex-col justify-between" style="flex:1;min-height:0;padding:12px;gap:14px">
        <div>
          ${rotulo("Mentalidad")}
          <div class="flex" style="gap:6px">
            ${MENTALIDADES.map(m => `<button data-ment="${m.id}" class="ment-btn px-ment">
              <span style="font-size:18px">${m.ico}</span>
              <span class="px" style="font-size:8px">${m.label}</span>
            </button>`).join("")}
          </div>
        </div>

        <!-- LA ALTURA DEL BLOQUE (sprint del Territorio): dónde vive el equipo cuando
             tiene y cuando no tiene la pelota. Cinco escalones que SUBEN — la forma es
             el significado, así que no hace falta ningún número. Gratis con el equipo
             parado; con el partido en juego consume una VENTANA TÁCTICA (la regla vive
             en game/match/field, estos botones solo preguntan). -->
        <div>
          <div class="flex items-baseline" style="gap:8px;margin-bottom:7px">
            <span class="px" style="font-size:9px;letter-spacing:.12em;color:var(--px-dim)">Altura del bloque</span>
            <span id="h-cost" class="px-body ml-auto" style="font-size:12px;color:var(--px-faint)"></span>
          </div>
          <div id="h-bars" class="flex items-end" style="gap:4px;height:56px">
            ${HEIGHTS.map((h, i) => `<button data-h="${h.n}" class="px-hbar" style="height:${40 + i * 15}%"></button>`).join("")}
          </div>
          <div class="flex items-center justify-between" style="margin-top:6px">
            <span class="px-body uppercase" style="font-size:11px;letter-spacing:.08em;color:var(--px-faint)">Repliegue</span>
            <span id="h-label" class="px" style="font-size:9px;color:var(--wc-gold-light)"></span>
            <span class="px-body uppercase" style="font-size:11px;letter-spacing:.08em;color:var(--px-faint)">Asfixia</span>
          </div>
          <!-- La lectura del rival, en PALABRAS (nunca su número): es scouting en vivo. -->
          <div id="h-rival" class="px-body" style="margin-top:7px;font-size:12.5px;line-height:1.4;color:var(--px-dim)"></div>
        </div>

        <div>
          ${rotulo("Ráfaga de presión")}
          <button id="btn-press" class="px-press">
            <span id="press-fill" class="absolute inset-y-0 left-0 transition-[width] duration-700 ease-linear"></span>
            <span class="absolute inset-0 flex items-center justify-center" style="gap:10px">
              <span id="press-label" class="px" style="font-size:13px;letter-spacing:.1em"></span>
              <span id="press-left" class="px" style="font-size:10px"></span>
            </span>
          </button>
          <div class="px-body" style="margin-top:6px;font-size:12.5px;line-height:1.4;color:var(--px-faint)">10 minutos robando más alto. Esos minutos cuestan el doble de energía.</div>
        </div>

        <div class="flex" style="gap:8px">
          <button id="btn-subs" class="px-btn2 px" style="flex:1;height:42px;font-size:10px">🔄 Plantilla (<span id="subs-left">3</span>)</button>
          <!-- La ENERGÍA del once en cancha: el promedio, que es lo que decide si hay
               que mover el banco. El detalle jugador por jugador está a un clic. -->
          <div class="flex flex-col items-center justify-center shrink-0" style="width:96px;height:42px;background:var(--px-panel-lo);border:2px solid var(--px-line-off)"
               title="Energía promedio del once en cancha: baja mientras el partido corre. Los minutos presionados —y los de bloque adelantado— la vacían más rápido. El resto del desgaste se cobra al terminar.">
            <span class="px" style="font-size:9px;color:var(--px-faint)">Energía</span>
            <span id="cmd-energy" class="px" style="font-size:11px;color:var(--px-warn)">–</span>
          </div>
        </div>
      </div>

      <!-- EL ASISTENTE TÉCNICO. Su consejo se queda hasta que haya otro: en el relato
           duraba tres segundos y se lo llevaba el scroll (game/match/match-momentum lo
           deja en mm.talk). Va al pie: lo empuja el flex-1 de las palancas.
           (Sin backticks en este comentario: vive dentro de un template literal y lo
           cortaría en seco — es el bug que ui.validate vigila.) -->
      <div class="px-at shrink-0" style="margin:0 12px 12px">
        <div class="px-at-ico">AT</div>
        <div class="flex flex-col" style="min-width:0;gap:5px">
          <div class="flex items-baseline" style="gap:8px">
            <span class="px" style="font-size:9px;color:var(--wc-gold-light)">Asistente técnico</span>
            <span id="at-min" class="px" style="font-size:8px;color:var(--px-faint)"></span>
          </div>
          <div id="at-text" class="px-body" style="font-size:13.5px;line-height:1.45;color:#d4cee0;text-wrap:pretty"></div>
        </div>
      </div>
    </div>`;
}


/**
 * Pinta el botón de presión desde `pressState` — la UI no conoce ninguna regla: recibe
 * `on/ready/agotado/pct/restantes` y elige colores. Cuatro estados legibles de un vistazo:
 *   ENCENDIDA  ámbar lleno, la barra se VACÍA (te queda esto de ráfaga)
 *   LISTA      ámbar lleno y clickeable — "el botón recupera su color" (pedido del PO)
 *   RECARGANDO gris, la barra se LLENA en ámbar apagado
 *   AGOTADA    gris muerto, sin barra
 */
function paintPress(match) {
  const btn = $("#btn-press"); if (!btn) return;
  const st = pressState(match);
  const fill = $("#press-fill"), label = $("#press-label"), left = $("#press-left");
  fill.style.width = `${Math.round(st.pct)}%`;
  // El color de fondo vive en la BARRA y en el borde del botón, nunca en un `background`
  // del <button>: la hoja del tema fija el background de `button` y le gana hasta a un
  // inline `!important` (verificado en navegador). Con capas, además, la barra ES el
  // fondo: el estado se lee sin mirar ningún número. Y el color cambia SIN transición a
  // propósito — lo que anima es el ancho; el estado tiene que saltar a la vista.
  const paint = (borde, texto, barra, cursor) => {
    btn.style.borderColor = borde;
    fill.style.background = barra;
    label.style.color = texto;
    left.style.color = texto;
    btn.style.cursor = cursor;
  };
  if (st.on) {
    paint("#fcd34d", "#fef3c7", "rgba(245,158,11,.8)", "default");
    label.textContent = "🔥 Presionando";
    left.textContent = "";
  } else if (st.ready) {
    // Lleno de ámbar: "el botón recupera su color" (pedido del PO) es literalmente
    // la barra completa, el mismo objeto que se vació durante la ráfaga.
    paint("var(--px-warn)", "#0f172a", "#b45309", "pointer");
    label.textContent = "🔥 Presionar";
    left.textContent = `${st.restantes} restantes`;
  } else {
    paint("var(--px-line)", "var(--px-dim)", "rgba(217,119,6,.35)", "not-allowed");
    label.textContent = st.agotado ? "🔥 Sin ráfagas" : "🔥 Recargando…";
    left.textContent = "";
  }
  btn.disabled = !st.ready;
  btn.title = st.agotado
    ? `Ya usaste las ${st.usos} ráfagas del partido.`
    : "Presionar arriba durante 10 minutos: el equipo roba más alto y ataca mejor, pero esos minutos cuestan el DOBLE de energía.";
}


/** Los cinco escalones de la altura: el vigente en oro, los prohibidos apagados. */
function paintHeights(match) {
  const box = $("#h-bars"); if (!box) return;
  const st = fieldState(match);
  // Los <button> los pinta commandColumn UNA vez y acá solo se re-clasifican: si se
  // recrearan en cada refresco perderían el `onclick` que les cableó wireCommand.
  for (const o of st.opciones) {
    const b = box.querySelector(`[data-h="${o.n}"]`);
    b.classList.toggle("is-on", o.actual);
    b.disabled = o.actual || !o.puede;
    b.title = `${o.icon} ${o.label} — ${o.desc}`;
  }
  $("#h-label").textContent = st.label;
  $("#h-cost").textContent = st.gratis ? "Moverlo ahora es gratis" : `${st.ventanas} ventana${st.ventanas === 1 ? "" : "s"} táctica${st.ventanas === 1 ? "" : "s"}`;
  $("#h-cost").style.color = st.gratis ? "var(--px-ok)" : "var(--px-faint)";
  $("#h-rival").innerHTML = `🔎 ${match.oppTeam.name} está parado con un <b style="color:var(--px-ink)">bloque ${st.rival}</b>.`;
}


/** Pinta todo lo que cambia del mando: mentalidad, altura, presión, cambios, energía y AT. */
export function paintCommand(match) {
  if (!$("#btn-press")) return;
  document.querySelectorAll(".ment-btn").forEach(b => b.classList.toggle("is-on", b.dataset.ment === S.matchCtx.mentalidad));
  paintHeights(match);
  paintPress(match);
  $("#subs-left").textContent = match.subsLeft;
  // La energía del once EN CANCHA (los expulsados y lesionados ya no corren).
  const act = match.activeMine();
  const en = act.length ? Math.round(act.reduce((s, p) => s + p.energia, 0) / act.length) : 0;
  const eEl = $("#cmd-energy");
  eEl.textContent = `${en}%`;
  eEl.style.color = en >= 60 ? "var(--px-ok)" : en >= 40 ? "var(--px-warn)" : "var(--px-bad)";
  // El asistente: lo último que dijo, o —mientras no haya dicho nada— la lectura de
  // arranque, que es la que un ayudante da mirando cómo se paró el rival.
  const t = match.mm?.talk;
  $("#at-min").textContent = t ? `${t.min}'` : "";
  $("#at-text").textContent = t ? t.text
    : "Todavía no vi lo suficiente. Dame unos minutos y te digo por dónde se gana este partido.";
}


/**
 * Cablea el mando entero. Las REGLAS viven en el motor (game/match/press y
 * game/match/field, y la mentalidad en game/match/powers): estos botones solo
 * preguntan y pintan.
 */
export function wireCommand() {
  document.querySelectorAll(".ment-btn").forEach(b => b.onclick = () => {
    if (S.matchCtx.mentalidad === b.dataset.ment) return;
    S.matchCtx.mentalidad = b.dataset.ment;
    markMomentum(S.match, "⚙️");   // decisión táctica: marca en el gráfico, nunca puntos
    S.match.log("info", `📢 Mentalidad: ${b.dataset.ment.toUpperCase()}.`);
    updateMatchUI();
  });
  document.querySelectorAll("[data-h]").forEach(b => b.onclick = () => {
    if (!setHeight(S.match, +b.dataset.h)) return;   // la regla vive en game/match/field
    markMomentum(S.match, "⚙️");
    updateMatchUI();
  });
  $("#btn-press").onclick = () => {
    if (!startPress(S.match)) return;                // la regla vive en game/match/press
    updateMatchUI();
  };
  $("#btn-subs").onclick = () => openSquadModal();   // sin args: el onclick pasaría el MouseEvent como "caído"
}
