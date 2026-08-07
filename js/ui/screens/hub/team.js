/* ============================================================
   ui/screens/hub/team — LO QUE EL DT AJUSTA DE SU EQUIPO:
   los efectos acumulados con su canje, y la altura del bloque — que se elige
   el día del partido o leyendo el informe del rival.

   La card de "estado del equipo" vivía acá hasta el rediseño del hub
   (6-ago-2026): ahora es el panel MI EQUIPO de la columna derecha (hub/hud).
   ============================================================ */
import { canjeBuff } from "../../../game/day-action.js";
import { CANJE_THRESHOLD, CANJE_PERMANENT, STAT_LABELS } from "../../../content/daily/day-actions.js";
import { S } from "../../session.js";
import { modal, closeModal, toast } from "../../components.js";
import { HEIGHTS, HEIGHT_DEFAULT, heightOf } from "../../../game/match/field.js";
import { renderHub } from "./index.js";

/**
 * Confirmación del canje (Bible cap.6): renuncias a +CANJE_THRESHOLD del boost del próximo
 * partido y, a cambio, ganas +CANJE_PERMANENT PERMANENTE en esa stat para todos los que la
 * tienen. Es irreversible (crece y no baja) pero gratis (no gasta la Acción del Día).
 */
export function showCanje(key) {
  const label = STAT_LABELS[key];
  const alcance = S.run.squad.filter(p => p.stats[key] !== undefined).length;
  const m = modal(`
    <div class="text-center">
      <div class="text-5xl mb-2">✨</div>
      <h2 class="text-xl font-black mb-1">Canjear entrenamiento</h2>
      <p class="text-slate-300 text-sm mb-4">Renuncias a <b class="text-emerald-400">+${CANJE_THRESHOLD} de ${label}</b> para el próximo partido y, a cambio, sumas <b class="tp-text">+${CANJE_PERMANENT} de ${label} PERMANENTE</b> a los <b>${alcance}</b> jugadores del plantel que tienen esa stat — para el resto de la run.</p>
      <p class="text-[11px] text-slate-500 mb-5">El crecimiento permanente no baja y no pasa a otras runs. Gratis: no gasta tu Acción del Día.</p>
      <div class="flex gap-2">
        <button id="canje-cancel" class="flex-1 px-4 py-2.5 rounded-xl border border-slate-600 text-slate-300 hover:bg-slate-800 cursor-pointer transition-all">Mejor no</button>
        <button id="canje-ok" class="flex-1 btn-primary">✨ Canjear</button>
      </div>
    </div>
  `);
  m.querySelector("#canje-cancel").onclick = closeModal;
  m.querySelector("#canje-ok").onclick = () => {
    const res = canjeBuff(S.run, key);
    closeModal();
    if (res) toast(`✨ +${res.permanent} de ${res.label} PERMANENTE para ${res.alcance} jugador${res.alcance > 1 ? "es" : ""}.`);
    renderHub();
  };
}

// Colores del nivel de amenaza del informe: Alto = peligro, Bajo = ventaja tuya

/**
 * LA ALTURA DEL BLOQUE: los 5 botones y la explicación de la elegida.
 * Vive en DOS sitios —la card del día de partido y el Informe del Rival— porque la decisión
 * se toma LEYENDO al rival: por eso el markup y el cableado se comparten en vez de copiarse.
 * Acá es gratis; dentro del partido, moverla consume una ventana táctica. Queda puesta para
 * los partidos siguientes (`run.altura`).
 */
export function alturaPicker() {
  return `<div class="alt-picker">
    <div class="text-[10px] uppercase tracking-widest text-slate-500 font-bold mb-2">🧱 Nuestra altura del bloque</div>
    <div class="flex items-center justify-center gap-1 flex-wrap">
      ${HEIGHTS.map(h => `<button data-alt="${h.n}" title="${h.desc}"
        class="alt-btn px-2 py-1 rounded-lg text-[11px] font-black border cursor-pointer transition-colors">${h.icon} ${h.label}</button>`).join("")}
    </div>
    <p class="alt-desc text-[11px] text-slate-400 mt-2 text-center"></p>
  </div>`;
}

/** Cablea TODOS los pickers del documento a la vez: si el DT decide leyendo el informe, la
 *  card del hub que quedó detrás tiene que quedar contando lo mismo. */
export function wireAlturaPicker() {
  const paint = () => {
    const n = S.run.altura ?? HEIGHT_DEFAULT;
    document.querySelectorAll(".alt-btn").forEach(b => {
      const on = +b.dataset.alt === n;
      b.className = `alt-btn px-2 py-1 rounded-lg text-[11px] font-black border cursor-pointer transition-colors ${
        on ? "border-amber-400 bg-amber-400/20 text-amber-200" : "border-slate-600 bg-slate-800 text-slate-400 hover:border-amber-400/60 hover:text-slate-200"}`;
    });
    document.querySelectorAll(".alt-desc").forEach(d => { d.textContent = heightOf(n).desc; });
  };
  document.querySelectorAll(".alt-btn").forEach(b => b.onclick = () => { S.run.altura = +b.dataset.alt; paint(); });
  paint();
}
