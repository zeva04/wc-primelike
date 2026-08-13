/* ============================================================
   ui/screens/hub/day — LO QUE PASA AL CAMBIAR DE DÍA:
   la portada del Daily, el evento inevitable y el conflicto con decisión.

   El calendario y la Acción del Día vivían acá hasta el rediseño del hub
   (6-ago-2026): ahora son la línea de días (hub/hud) y los edificios del
   complejo (hub/complex, hub/panels). Lo que queda son los MODALES — lo que
   interrumpe al DT, no lo que él decide.
   ============================================================ */
import { dayLabel } from "../../../game/calendar.js";
import { chapaRareza } from "../../theme.js";
import { addJournal } from "../../../game/journal.js";
import { EVENT_THEMES } from "../../../content/daily/themes.js";
import { S } from "../../session.js";
import { go } from "../../nav.js";
import { modal, closeModal, toast } from "../../components.js";
import { renderHub } from "./index.js";

/**
 * El World Cup Daily como PORTADA de diario: papel crema, serifas,
 * cabecera con doble filete y la nota de tapa en grande. Se abre al llegar a un
 * día nuevo, ANTES del evento — primero informar, después transformar. `onClose`
 * encadena lo que siga (modal de evento/conflicto o el toast de día de partido).
 */
export function showDaily(daily, onClose) {
  const [main, ...rest] = daily.items;
  const tag = t => `<span class="text-[9px] font-sans font-black tracking-[0.25em] text-red-800 uppercase">${t}</span>`;
  const m = modal(`
    <div class="-m-6 bg-[#f3edda] text-slate-900 font-serif rounded-2xl overflow-hidden px-6 pt-5 pb-5">
      <div class="text-center border-b-4 border-double border-slate-900 pb-2">
        <div class="text-[9px] font-sans tracking-[0.35em] uppercase text-slate-500">Edición especial mundial 2026</div>
        <h1 class="text-3xl font-black tracking-tight uppercase">El Pitazo Inicial</h1>
      </div>
      <div class="flex items-center justify-between text-[9px] font-sans uppercase tracking-widest text-slate-500 border-b border-slate-900/50 py-1.5">
        <span>Edición Nº ${daily.day}</span><span>${dayLabel(daily.day)} 2026</span><span>$1,00</span>
      </div>
      <div class="py-3 border-b border-slate-900/25">
        ${tag(main.tag)}
        <div class="text-xl font-black leading-snug mt-1">${main.icon} ${main.text}</div>
      </div>
      ${rest.map(it => `
        <div class="py-2.5 border-b border-slate-900/15 flex gap-2.5 items-start">
          <span class="text-base leading-none mt-0.5">${it.icon}</span>
          <div class="leading-snug"><span class="mr-1.5">${tag(it.tag)}</span><span class="text-sm">${it.text}</span></div>
        </div>`).join("")}
      <button id="daily-fold" class="mt-4 w-full bg-slate-900 text-[#f3edda] font-sans font-black uppercase tracking-widest text-xs py-3 rounded-lg cursor-pointer hover:bg-slate-700 transition-all">Doblar el diario →</button>
    </div>
  `, "max-w-xl");
  m.querySelector("#daily-fold").onclick = onClose;
}


/** Cabecera de temática de un evento/conflicto del calendario (misma caracterización siempre). */
export function themeHeader(tema) {
  const th = EVENT_THEMES[tema];
  if (!th) return "";
  return `<div class="text-[10px] uppercase tracking-widest font-bold ${th.color} mb-1">${th.icon} ${th.name} · ${dayLabel(S.run.day)}</div>`;
}


/** Bajas actuales del once (suspendidos + lesionados). */
export const bajasDelOnce = () => (S.selectedLineup || []).filter(p => p.suspendido || p.lesionadoPartidos > 0);


/**
 * Si el evento recién cerrado tumbó a un TITULAR (lesión), el DT lo resuelve AHORA:
 * se navega directo a Gestión de Plantilla con el caído a la vista (PO — nada
 * se reemplaza solo). Solo dispara ante una baja NUEVA (`prev` = cuántas había antes
 * del evento): una baja vieja pendiente ya tiene su aviso fijo en el hub, no secuestra
 * la navegación cada mañana. Devuelve true si navegó (el caller no repinta el hub).
 */
export function irASquadSiBaja(prev) {
  const bajas = bajasDelOnce();
  if (bajas.length <= prev) return false;
  toast(`🚑 ${bajas[bajas.length - 1].name} es baja: elige su reemplazo.`);
  go("squad");
  return true;
}


/** Muestra el evento inevitable del día (ya aplicado por el motor) y vuelve al hub. */
export function showDayEvent(ev, bajasPre = 0) {
  S.run.stats.eventos++;
  const m = modal(`
    <div class="text-center">
      ${themeHeader(ev.tema)}
      <div class="text-5xl mb-2">${ev.icon}</div>
      ${chapaRareza(ev.rareza)}
      <h2 class="text-xl font-black mb-2">${ev.title}</h2>
      <p class="text-sm mb-2 ${ev.tipo === "buff" ? "text-emerald-400" : "text-red-400"}">${ev.desc}</p>
      <p class="text-[10px] text-slate-500 mb-5">Los eventos son inevitables: el mundo del Mundial no espera a nadie.</p>
      <button id="ev-ok" class="btn-primary">Continuar</button>
    </div>
  `);
  m.querySelector("#ev-ok").onclick = () => { closeModal(); if (!irASquadSiBaja(bajasPre)) renderHub(); };
}


/** Muestra el modal de un conflicto con decisión y aplica el efecto de la opción elegida. */
export function showRandomEvent(ev) {
  const m = modal(`
    <div class="text-center">
      ${themeHeader(ev.tema)}
      <div class="text-5xl mb-2">${ev.icon}</div>
      <h2 class="text-xl font-black mb-2">${ev.title}</h2>
      <p class="text-slate-300 text-sm mb-5">${ev.text}</p>
      <div class="space-y-2">
        ${ev.options.map((o, i) => `<button data-opt="${i}" class="ev-opt w-full px-4 py-3 rounded-xl border border-slate-600 bg-slate-700/60 hover:border-amber-400 hover:bg-slate-700 font-semibold transition-all cursor-pointer">${o.label}</button>`).join("")}
      </div>
    </div>
  `);
  m.querySelectorAll(".ev-opt").forEach(b => b.onclick = () => {
    const opt = ev.options[+b.dataset.opt];
    const bajasPre = bajasDelOnce().length; // el efecto del conflicto puede lesionar a un titular
    const res = opt.effect(S.run);
    S.run.stats.eventos++;
    addJournal(S.run, { icon: ev.icon, tone: "neutral", title: ev.title, desc: `Elegiste "${opt.label}". ${res}` });
    closeModal();
    toast(res);
    if (!irASquadSiBaja(bajasPre)) renderHub();
  });
}

