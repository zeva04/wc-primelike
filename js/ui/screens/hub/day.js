/* ============================================================
   ui/screens/hub/day — EL DÍA DE LA CONCENTRACIÓN:
   el calendario, la Acción del Día con sus multiplicadores, y los modales
   que abre pasar de día — la portada del Daily, el evento inevitable y el
   conflicto con decisión.
   ============================================================ */
import { getTeam } from "../../../data/teams-repo.js";
import { dayLabel } from "../../../game/calendar.js";
import { actionMult, multLabel, dayOpportunity } from "../../../game/day-action.js";
import { DAY_ACTIONS, PLAN_XP_MULT, TRAIN_BUFF, TRAIN_FATIGUE } from "../../../content/day-actions.js";
import { getPhilosophy, FILO_LEVELS, FILO_ETAPAS } from "../../../content/philosophies.js";
import { filoPoints, filoLevel, filoEtapa, filoXpMults } from "../../../game/philosophy.js";
import { planPayoff } from "../../../game/traits.js";
import { markerColor } from "../../board.js";
import { RARITIES } from "../../../content/rarities.js";
import { addJournal } from "../../../game/journal.js";
import { nextOpponentId } from "../../../game/tournament/knockout.js";
import { EVENT_THEMES } from "../../../content/themes.js";
import { S } from "../../session.js";
import { go } from "../../nav.js";
import { flagImg, modal, closeModal, toast } from "../../components.js";
import { renderHub } from "./index.js";
import { oppCard } from "./rival.js";

/**
 * Tarjeta del calendario: la ventana de preparación COMPLETA, desde su primer día
 * (`windowStart`, tras el último partido) hasta el próximo partido. Los días ya vividos
 * NO se borran: quedan en gris para dar sensación de avance; HOY se resalta y los futuros
 * anticipan su temática. El día de partido muestra al rival. Todo a lo ancho (flex-1).
 */
export function renderCalendarCard(opp) {
  const run = S.run;
  const days = [];
  for (let d = run.windowStart ?? run.day; d <= run.nextMatchDay; d++) days.push(d);
  return `<div class="bg-slate-800/60 border border-slate-700 rounded-2xl p-4">
    <div class="flex items-center justify-between flex-wrap gap-2 mb-3">
      <h3 class="font-bold">📅 Calendario</h3>
      <span class="text-xs text-slate-400">Hoy es <b class="text-slate-200">${dayLabel(run.day)}</b> · próximo partido <b class="text-slate-200">${dayLabel(run.nextMatchDay)}</b> vs ${opp.name}</span>
    </div>
    <div class="flex gap-2 overflow-x-auto pb-1">
      ${days.map(d => {
        const today = d === run.day;
        const past = d < run.day;
        const isMatch = d === run.nextMatchDay;
        const plan = run.dayPlan[d];
        const th = plan ? EVENT_THEMES[plan.tema] : null;
        const box = today ? "tp-border tp-bg-soft"
          : past ? "border-slate-800 bg-slate-900/40 opacity-45"
          : isMatch ? "border-amber-500/70 bg-amber-500/10"
          : "border-slate-700 bg-slate-900/50";
        return `<div class="rounded-xl border ${box} px-2 py-2 text-center flex-1 min-w-[4.6rem]">
          <div class="text-[9px] uppercase tracking-wider font-bold ${today ? "tp-text" : past ? "text-slate-600" : "text-slate-500"}">${today ? "HOY" : dayLabel(d).split(" ")[0]}</div>
          <div class="text-[10px] ${past ? "text-slate-600" : "text-slate-400"} mb-1">${dayLabel(d).split(" ").slice(1).join(" ")}</div>
          ${isMatch
            ? `<div class="text-lg leading-none">⚽</div><div class="text-[9px] font-bold text-amber-400 mt-0.5 flex items-center justify-center gap-1">${flagImg(opp, "w-4 h-3")}<span class="truncate max-w-[3.2rem]">${opp.name}</span></div>`
            : th
              ? `<div class="text-lg leading-none">${th.icon}</div><div class="text-[9px] font-semibold ${past ? "text-slate-600" : th.color} mt-0.5">${th.name}</div>`
              : `<div class="text-lg leading-none">🧘</div><div class="text-[9px] text-slate-600 mt-0.5">Tranquilo</div>`}
          ${past ? `<div class="text-[8px] text-slate-600 mt-0.5">✓ vivido</div>` : ""}
        </div>`;
      }).join("")}
    </div>
    <p class="text-[10px] text-slate-500 mt-2">El calendario anticipa la temática de cada día; qué pasa exactamente se descubre al vivirlo.</p>
  </div>`;
}


/**
 * Panel de la Acción del Día (Bible §4.7): un día sin partido = una inversión.
 * La Oportunidad del día (si hay) va arriba, tentando; Entrenar agrupa sus
 * focos en una fila de botones; las demás acciones son una tarjeta-botón cada
 * una. Una vez elegida la acción, el panel NO desaparece: se queda con la
 * elegida resaltada (✓ Elegida hoy) y las demás en gris, no clickeables. Así
 * el bloque no cambia de tamaño (no deja huecos) y queda claro qué decidiste.
 */
export function actionCard() {
  const run = S.run;
  const opp = nextOpponentId(run) ? getTeam(nextOpponentId(run)) : null;
  const chosen = !run.actionPending && run.lastAction?.day === run.day; // ya se eligió hoy
  const chosenId = chosen ? run.lastAction.id : null;
  const chosenGroup = chosen ? run.lastAction.group : null;
  const training = DAY_ACTIONS.filter(a => a.group === "entrenar");
  const tacRows = DAY_ACTIONS.filter(a => a.group === "tactica");
  const rest = DAY_ACTIONS.filter(a => !a.group);
  // Badge del modificador del día sobre una acción: bloqueada / ×2 / ×½
  const modBadge = m => m === 0
    ? `<span class="text-[9px] font-black text-red-400 uppercase">no disponible hoy</span>`
    : m !== 1
      ? `<span class="text-[9px] font-black ${m > 1 ? "text-emerald-400" : "text-orange-400"}">${multLabel(m)} hoy</span>`
      : "";
  const chosenBadge = `<span class="text-[9px] font-black text-emerald-400 uppercase">✓ Elegida hoy</span>`;
  // Estado de una acción individual: chosen (la de hoy) · muted (descartada) · active.
  const stOf = id => !chosen ? "active" : (id === chosenId ? "chosen" : "muted");
  const tMult = actionMult(run, training[0]);
  const trainState = !chosen ? "active" : (chosenGroup === "entrenar" ? "chosen" : "muted");
  // EL PLAN DE PARTIDO (arco de Progresión): panel de las 4 filosofías. Declarar
  // una la vuelve la identidad que se juega y multiplica la XP que esa idea gane
  // en el próximo partido. Nada sube desde acá: la experiencia se gana jugando.
  const filo = getPhilosophy(run.filoId);
  const nivel = FILO_ETAPAS[filoEtapa(run)];
  const tacMult = actionMult(run, tacRows[0]);
  const tacState = !chosen ? "active" : (chosenGroup === "tactica" ? "chosen" : "muted");
  // La línea de payoff de un plan: hace visible la cadena jugar → XP → nivel → árbol.
  // La regla vive en game/traits.planPayoff; acá solo se redacta. Se guarda
  // encodeURIComponent en data-payoff y se pinta al hover.
  const tacPayoff = (a) => {
    const k = a.id.replace("plan_", "");
    const p = planPayoff(run, k);
    const col = markerColor(getPhilosophy(k));
    const mult = filoXpMults(run)[k] * (run.planFilo === k ? 1 : PLAN_XP_MULT);
    const head = `<b style="color:${col}">${a.label} nivel ${p.lvl + 1}</b> <span class="text-slate-500">(${p.xp} XP)</span>`;
    const escuela = p.propia ? ` · <span class="text-emerald-400">tu escuela</span>` : "";
    const lvl = p.nextAt != null
      ? ` · nivel ${p.lvl + 2} a los ${p.nextAt} XP · el partido rendiría <b class="text-amber-300">×${+mult.toFixed(2)}</b>`
      : ` · <span class="text-slate-500">la idea ya es ley</span>`;
    const u = p.unlocks[0];
    const unlock = u ? ` · abre ${u.icon} <b>${u.nombre}</b> <span class="text-slate-500">(nivel ${u.nivel})</span>` : "";
    return `${head}${escuela}${lvl}${unlock}`;
  };
  return `<div class="bg-slate-800/60 border tp-border rounded-2xl p-4 flex-1 flex flex-col">
    <h3 class="font-bold shrink-0">🧭 ${chosen ? "Tu acción de hoy" : "Acción del día"}</h3>
    <p class="text-[10px] text-slate-500 mt-0.5 mb-3">${chosen
      ? "Ya está decidido: el resto queda para otro día. Pasa al día siguiente cuando estés listo."
      : "Un día, una inversión: lo que elijas hoy es lo que NO harás. Revisa plantilla y rival antes de decidir."}</p>
    ${run.dayMod ? `<div class="rounded-lg border border-amber-500/50 bg-amber-500/10 px-3 py-2 text-[11px] font-semibold text-amber-300 mb-3">${run.dayMod.icon} ${run.dayMod.title}: ${run.dayMod.desc}.</div>` : ""}
    ${oppCard(stOf(dayOpportunity(run)?.id))}
    <div class="rounded-xl border p-3 mb-2 transition-all ${
      trainState === "chosen" ? "tp-border ring-2 ring-emerald-400/40 bg-slate-800/80"
      : trainState === "muted" ? "border-slate-700 bg-slate-900/40 opacity-40"
      : `border-slate-700 bg-slate-900/50 ${tMult === 0 ? "opacity-50" : ""}`}">
      <div class="flex items-center justify-between">
        <span class="font-semibold text-sm">🏋️ Entrenar</span>
        ${trainState === "chosen" ? chosenBadge : trainState === "muted" ? "" : (modBadge(tMult) || `<span class="text-[10px] font-bold text-red-400/90">cansa al plantel</span>`)}
      </div>
      <p class="text-[10px] text-slate-500 mt-0.5 mb-2">+${TRAIN_BUFF} a la stat del foco elegido hasta el próximo partido · −${TRAIN_FATIGUE} de energía al plantel.</p>
      <div class="grid grid-cols-3 gap-2">
        ${training.map(a => {
          const foco = chosen && a.id === chosenId;
          const active = !chosen && tMult !== 0;
          return `<button data-action="${a.id}" ${active ? "" : "disabled"} class="${active ? "da-opt " : ""}px-2 py-2 rounded-lg border text-xs font-semibold transition-all ${
            foco ? "tp-border tp-text bg-slate-700"
            : chosen ? "border-slate-700 text-slate-500 opacity-60 cursor-not-allowed"
            : tMult === 0 ? "border-slate-700 text-slate-500 cursor-not-allowed"
            : "border-slate-600 bg-slate-700/60 hover:border-amber-400 hover:bg-slate-700 cursor-pointer"}" title="${a.desc}">${a.icon} ${a.label}${foco ? " ✓" : ""}</button>`;
        }).join("")}
      </div>
    </div>
    <div class="tac-board rounded-xl border p-3 mb-2 transition-all ${
      tacState === "chosen" ? "tp-border ring-2 ring-emerald-400/40"
      : tacState === "muted" ? "border-slate-700 opacity-40"
      : `border-slate-700 ${tacMult === 0 ? "opacity-50" : ""}`}">
      <div class="flex items-center justify-between">
        <span class="font-semibold text-sm">📋 Plan de partido</span>
        ${tacState === "chosen" ? chosenBadge : tacState === "muted" ? "" : (modBadge(tacMult) || `<span class="text-[10px] font-bold text-slate-500">declara tu fútbol</span>`)}
      </div>
      <!-- Línea de PAYOFF: por defecto la consigna; al pasar el cursor por una idea,
           muestra su nivel, lo que rendiría y qué abre. Footprint fijo — una línea. -->
      <p id="tac-payoff" class="chalk-hand text-[12px] leading-snug text-[#dff0e5]/70 mt-1 mb-2.5 min-h-[2.4em]"
        data-default="Declara qué fútbol va a jugar el equipo${opp ? ` ante ${opp.name}` : ""}: esa idea sale más seguido y rinde ×${PLAN_XP_MULT} de experiencia. Se aprende jugando, no eligiendo.">
        Declara qué fútbol va a jugar el equipo${opp ? ` ante ${opp.name}` : ""}: esa idea sale más seguido y rinde ×${PLAN_XP_MULT} de experiencia. Se aprende jugando, no eligiendo.
      </p>
      <div class="grid grid-cols-4 gap-1.5">
        ${tacRows.map(a => {
          const k = a.id.replace("plan_", "");
          const p = getPhilosophy(k);
          const lvl = filoLevel(run, k);
          const xp = filoPoints(run, k);
          const piso = FILO_LEVELS[lvl].min, techo = FILO_LEVELS[lvl + 1]?.min ?? null;
          const barPct = techo ? Math.min(100, (100 * (xp - piso)) / (techo - piso)) : 100;
          const col = markerColor(p);
          const propia = run.filoInicial === k;
          const activa = run.filoId === k;
          const foco = chosen && a.id === chosenId;
          const active = !chosen && tacMult !== 0;
          return `<button data-action="${a.id}" data-payoff="${encodeURIComponent(tacPayoff(a))}" ${active ? "" : "disabled"}
            class="${active ? "da-opt " : ""}tac-mark${foco || activa ? " is-foco" : ""}" style="--pc:${col}" title="${a.desc}">
            <span class="text-[15px] leading-none">${a.icon}</span>
            <span class="chalk-hand text-[13px] font-bold leading-none" style="color:${col}">Nv ${lvl + 1}${foco ? " ✓" : ""}</span>
            <span class="tac-bar"><span style="width:${barPct}%;background:${col}"></span></span>
            <span class="chalk-hand text-[10px] leading-tight text-center" style="color:${col}">${p.name}${propia ? " ·escuela" : ""}</span>
          </button>`;
        }).join("")}
      </div>
      ${filo ? `<div class="flex items-center justify-between gap-2 mt-2.5">
        <span class="text-[10px] text-slate-400">Hoy juegas ${filo.icon} <b class="tp-text">${filo.name}</b> · ${nivel.label}${run.planFilo ? ` · <span class="text-amber-300">plan declarado ×${PLAN_XP_MULT}</span>` : ""}</span>
      </div>` : ""}
    </div>
    ${rest.map(a => {
      const m = actionMult(run, a);
      const st = stOf(a.id);
      const active = st === "active" && m !== 0;
      return `<button data-action="${a.id}" ${active ? "" : "disabled"} class="${active ? "da-opt " : ""}w-full text-left rounded-xl border p-3 mb-2 transition-all ${
        st === "chosen" ? "tp-border ring-2 ring-emerald-400/40 bg-slate-800/80"
        : st === "muted" ? "border-slate-700 bg-slate-900/40 opacity-40 cursor-not-allowed"
        : m === 0 ? "border-slate-700 bg-slate-900/50 opacity-50 cursor-not-allowed"
        : "border-slate-700 bg-slate-900/50 hover:border-amber-400 hover:bg-slate-800 cursor-pointer"}">
        <div class="flex items-center justify-between">
          <span class="font-semibold text-sm">${a.icon} ${a.title}</span>
          ${st === "chosen" ? chosenBadge : st === "muted" ? "" : modBadge(m)}
        </div>
        <div class="text-[10px] text-slate-500 mt-0.5">${a.desc}.</div>
      </button>`;
    }).join("")}
  </div>`;
}


/**
 * El World Cup Daily (Bible §4.4) como PORTADA de diario: papel crema, serifas,
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
 * se navega directo a Gestión de Plantilla con el caído a la vista (PO 22-jul — nada
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
  const rar = RARITIES[ev.rareza];
  const m = modal(`
    <div class="text-center">
      ${themeHeader(ev.tema)}
      <div class="text-5xl mb-2">${ev.icon}</div>
      ${rar ? `<div class="inline-block px-2.5 py-0.5 rounded-full border ${rar.border} ${rar.color} text-[10px] font-black uppercase tracking-widest mb-2">${rar.label}</div>` : ""}
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

