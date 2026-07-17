/* ============================================================
   ui/screens/hub — Concentración Mundialista (Game Vision):
   pantalla central entre partidos. Rival, calendario por días,
   estado del torneo, plantilla, efectos y el botón del día.
   También muestra los modales de evento/conflicto del día.
   ============================================================ */
import { getTeam } from "../../data/teams-repo.js";
import { teamRating, teamStars, playerOverall, outOfPosPenalty } from "../../game/ratings.js";
import { currentLineup, validateLineup, getFormation } from "../../game/lineup.js";
import { dayLabel, advanceDay } from "../../game/calendar.js";
import { buildDaily } from "../../game/daily.js";
import { applyDayAction, actionMult, multLabel } from "../../game/day-action.js";
import { DAY_ACTIONS, TACTICS_BONUS, TRAIN_BUFF, TRAIN_FATIGUE } from "../../content/day-actions.js";
import { RARITIES } from "../../content/rarities.js";
import { addJournal } from "../../game/journal.js";
import { nextOpponentId, STAGE_LABEL } from "../../game/tournament/knockout.js";
import { EVENT_THEMES } from "../../content/themes.js";
import { S } from "../session.js";
import { register, go } from "../nav.js";
import { screenShell, $, flagImg, starsHtml, modal, closeModal, toast } from "../components.js";
import { spriteSvg } from "../sprites.js";
import { renderGroupTableCard, renderKoInfoCard } from "./worldcup.js";

/**
 * Figuras a mostrar del rival: las de mayor nota, sin duplicados y con un solo arquero.
 * Rival jugable → ordena su plantel por nota; rival normal → usa sus figuras curadas.
 */
function keyPlayers(team, max = 5) {
  const source = team.players || team.figures || [];
  const seen = new Set();
  const unique = source.filter(p => (seen.has(p.name) ? false : seen.add(p.name)));
  if (unique.every(p => p.stats)) unique.sort((a, b) => playerOverall(b) - playerOverall(a));
  const out = [];
  let gkUsed = false;
  for (const p of unique) {
    if (p.pos === "POR") { if (gkUsed) continue; gkUsed = true; }
    out.push(p);
    if (out.length === max) break;
  }
  return out;
}

/**
 * Tarjeta del calendario: la ventana de días desde hoy hasta el próximo partido.
 * Cada día futuro muestra SOLO la temática de su evento (siempre caracterizada igual);
 * el día de partido muestra al rival. Los días se reparten TODO el ancho de la tarjeta
 * (flex-1): sin huecos muertos a la derecha.
 */
function renderCalendarCard(opp) {
  const run = S.run;
  const days = [];
  for (let d = run.day; d <= run.nextMatchDay; d++) days.push(d);
  return `<div class="bg-slate-800/60 border border-slate-700 rounded-2xl p-4">
    <div class="flex items-center justify-between flex-wrap gap-2 mb-3">
      <h3 class="font-bold">📅 Calendario</h3>
      <span class="text-xs text-slate-400">Próximo partido: <b class="text-slate-200">${dayLabel(run.nextMatchDay)}</b> vs ${opp.name}</span>
    </div>
    <div class="flex gap-2 overflow-x-auto pb-1">
      ${days.map(d => {
        const today = d === run.day;
        const isMatch = d === run.nextMatchDay;
        const plan = run.dayPlan[d];
        const th = plan ? EVENT_THEMES[plan.tema] : null;
        const box = today ? "tp-border tp-bg-soft" : isMatch ? "border-amber-500/70 bg-amber-500/10" : "border-slate-700 bg-slate-900/50";
        return `<div class="rounded-xl border ${box} px-2 py-2 text-center flex-1 min-w-[4.6rem]">
          <div class="text-[9px] uppercase tracking-wider font-bold ${today ? "tp-text" : "text-slate-500"}">${today ? "HOY" : dayLabel(d).split(" ")[0]}</div>
          <div class="text-[10px] text-slate-400 mb-1">${dayLabel(d).split(" ").slice(1).join(" ")}</div>
          ${isMatch
            ? `<div class="text-lg leading-none">⚽</div><div class="text-[9px] font-bold text-amber-400 mt-0.5 flex items-center justify-center gap-1">${flagImg(opp, "w-4 h-3")}<span class="truncate max-w-[3.2rem]">${opp.name}</span></div>`
            : th
              ? `<div class="text-lg leading-none">${th.icon}</div><div class="text-[9px] font-semibold ${th.color} mt-0.5">${th.name}</div>`
              : `<div class="text-lg leading-none">🧘</div><div class="text-[9px] text-slate-500 mt-0.5">Tranquilo</div>`}
        </div>`;
      }).join("")}
    </div>
    <p class="text-[10px] text-slate-500 mt-2">El calendario anticipa la temática de cada día; qué pasa exactamente se descubre al vivirlo.</p>
  </div>`;
}

/** Chips con los efectos acumulados para el próximo partido; "" si no hay ninguno. */
function buffChips() {
  const LABELS = { tiro: "Tiro", defensa: "Defensa", atajadas: "Atajadas", pase: "Pase", aura: "Aura", cabezazo: "Cabezazo" };
  const chips = [];
  for (const [k, v] of Object.entries(S.run.buffs)) {
    if (k === "antiLesion") { if (v) chips.push(`<span class="px-2 py-0.5 rounded-full border border-emerald-500/50 bg-emerald-500/10 text-emerald-400">🧑‍⚕️ Sin lesiones</span>`); continue; }
    if (k === "penales") { if (v) chips.push(`<span class="px-2 py-0.5 rounded-full border border-emerald-500/50 bg-emerald-500/10 text-emerald-400">🥅 Penales +</span>`); continue; }
    if (k === "tactica") {
      if (!v) continue;
      const n = Math.round(v / TACTICS_BONUS);
      chips.push(`<span class="px-2 py-0.5 rounded-full border border-emerald-500/50 bg-emerald-500/10 text-emerald-400">📋 Preparación táctica${n > 1 ? ` ×${n}` : ""}</span>`);
      continue;
    }
    if (!v || !LABELS[k]) continue;
    const pos = v > 0;
    chips.push(`<span class="px-2 py-0.5 rounded-full border ${pos ? "border-emerald-500/50 bg-emerald-500/10 text-emerald-400" : "border-red-500/50 bg-red-500/10 text-red-400"}">${LABELS[k]} ${pos ? "+" : ""}${v}</span>`);
  }
  return chips.length ? `<div class="flex flex-wrap gap-1.5 text-[10px] font-bold">${chips.join("")}</div>` : "";
}

/**
 * Tarjeta de efectos: card completa cuando hay chips que mostrar; cuando no hay
 * nada, una sola línea discreta (una card entera diciendo "no hay nada" era un
 * bloque que solo ocupaba espacio).
 */
function effectsCard() {
  const chips = buffChips();
  if (!chips) {
    return `<div class="border border-slate-700/70 bg-slate-800/40 rounded-2xl px-4 py-2.5 text-xs text-slate-500">
      ✨ Sin efectos para el próximo partido — los días del calendario los irán sumando.
    </div>`;
  }
  return `<div class="bg-slate-800/60 border border-slate-700 rounded-2xl p-4">
    <h3 class="font-bold text-sm mb-2">✨ Efectos para el próximo partido</h3>
    ${chips}
  </div>`;
}

/**
 * Panel de la Acción del Día (Bible §4.7): un día sin partido = una inversión.
 * Entrenar agrupa sus focos en una fila de botones; las demás acciones son una
 * tarjeta-botón cada una. Cuando la acción ya se eligió, una línea de
 * confirmación reemplaza al panel y se desbloquea "Pasar al día siguiente".
 */
function actionCard() {
  const run = S.run;
  if (!run.actionPending) {
    const done = run.lastAction && run.lastAction.day === run.day;
    return done
      ? `<div class="border border-slate-700/70 bg-slate-800/40 rounded-2xl px-4 py-2.5 text-xs text-slate-400">
          Acción de hoy: <b class="text-slate-200">${run.lastAction.icon} ${run.lastAction.title}</b> ✓
        </div>`
      : "";
  }
  const training = DAY_ACTIONS.filter(a => a.group === "entrenar");
  const rest = DAY_ACTIONS.filter(a => !a.group);
  // Badge del modificador del día sobre una acción: bloqueada / ×2 / ×½
  const modBadge = m => m === 0
    ? `<span class="text-[9px] font-black text-red-400 uppercase">no disponible hoy</span>`
    : m !== 1
      ? `<span class="text-[9px] font-black ${m > 1 ? "text-emerald-400" : "text-orange-400"}">${multLabel(m)} hoy</span>`
      : "";
  const tMult = actionMult(run, training[0]);
  return `<div class="bg-slate-800/60 border tp-border rounded-2xl p-4">
    <h3 class="font-bold">🧭 Acción del día</h3>
    <p class="text-[10px] text-slate-500 mt-0.5 mb-3">Un día, una inversión: lo que elijas hoy es lo que NO harás. Revisa plantilla y rival antes de decidir.</p>
    ${run.dayMod ? `<div class="rounded-lg border border-amber-500/50 bg-amber-500/10 px-3 py-2 text-[11px] font-semibold text-amber-300 mb-3">${run.dayMod.icon} ${run.dayMod.title}: ${run.dayMod.desc}.</div>` : ""}
    <div class="rounded-xl border border-slate-700 bg-slate-900/50 p-3 mb-2 ${tMult === 0 ? "opacity-50" : ""}">
      <div class="flex items-center justify-between">
        <span class="font-semibold text-sm">🏋️ Entrenar</span>
        ${modBadge(tMult) || `<span class="text-[10px] font-bold text-red-400/90">cansa al plantel</span>`}
      </div>
      <p class="text-[10px] text-slate-500 mt-0.5 mb-2">+${TRAIN_BUFF} a la stat del foco elegido hasta el próximo partido · −${TRAIN_FATIGUE} de energía al plantel.</p>
      <div class="grid grid-cols-3 gap-2">
        ${training.map(a => `<button data-action="${a.id}" ${tMult === 0 ? "disabled" : ""} class="da-opt px-2 py-2 rounded-lg border border-slate-600 bg-slate-700/60 text-xs font-semibold transition-all ${tMult === 0 ? "cursor-not-allowed text-slate-500" : "hover:border-amber-400 hover:bg-slate-700 cursor-pointer"}" title="${a.desc}">${a.icon} ${a.label}</button>`).join("")}
      </div>
    </div>
    ${rest.map(a => {
      const m = actionMult(run, a);
      return `<button data-action="${a.id}" ${m === 0 ? "disabled" : ""} class="da-opt w-full text-left rounded-xl border border-slate-700 bg-slate-900/50 p-3 mb-2 transition-all ${m === 0 ? "opacity-50 cursor-not-allowed" : "hover:border-amber-400 hover:bg-slate-800 cursor-pointer"}">
        <div class="flex items-center justify-between">
          <span class="font-semibold text-sm">${a.icon} ${a.title}</span>
          ${modBadge(m)}
        </div>
        <div class="text-[10px] text-slate-500 mt-0.5">${a.desc}.</div>
      </button>`;
    }).join("")}
  </div>`;
}

/**
 * Concentración Mundialista: pantalla central entre partidos.
 * Layout balanceado en 2 columnas: IZQUIERDA posición + efectos;
 * DERECHA plantilla + diario + la Acción del Día + el botón del día
 * (pasar día — bloqueado hasta elegir acción — o jugar).
 */
function renderHub() {
  const run = S.run;
  const me = getTeam(run.teamId);
  const oppId = nextOpponentId(run);
  const opp = getTeam(oppId);
  const isMatchDay = run.day >= run.nextMatchDay;
  const stageTxt = (run.stage === "groups"
    ? `Fase de grupos · Fecha ${run.matchday + 1} de 3 · Grupo ${run.groups[run.myGroupIdx].name}`
    : STAGE_LABEL[run.stage]) + ` · ${dayLabel(run.day)}`;

  const available = run.squad.filter(p => !p.suspendido && p.lesionadoPartidos === 0);
  ({ lineup: S.selectedLineup, formationId: S.formation } = currentLineup(run.squad, S.selectedLineup, S.formation));
  const v = validateLineup(available, S.selectedLineup);
  const discipline = { susp: run.squad.filter(p => p.suspendido), aperc: run.squad.filter(p => p.amarillas > 0 && !p.suspendido) };
  const fueraDePuesto = S.selectedLineup.filter(p => outOfPosPenalty(p) > 0);

  screenShell(`
    <div class="flex items-center justify-between flex-wrap gap-3 mb-5">
      <div>
        <div class="text-xs uppercase tracking-widest tp-text font-bold">${stageTxt}</div>
        <h1 class="text-2xl font-black mt-1 flex items-center gap-2">${flagImg(me, "w-8 h-[1.4rem]")} Concentración Mundialista</h1>
      </div>
      <button id="btn-abandon" class="text-xs text-slate-500 hover:text-red-400 cursor-pointer">Abandonar torneo</button>
    </div>

    <div class="bg-slate-800/80 border border-slate-600 tp-topbar rounded-2xl p-5 mb-5 flex items-center justify-between flex-wrap gap-4">
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

    <div class="mb-5">${renderCalendarCard(opp)}</div>

    <div class="grid md:grid-cols-2 gap-5 md:items-start">
      <div class="space-y-5">
        <div id="btn-standings" class="cursor-pointer transition-transform hover:scale-[1.01]" title="Ver el estado de todos los grupos">
          ${run.stage === "groups" ? renderGroupTableCard() : renderKoInfoCard()}
          <p class="text-[10px] tp-text font-semibold text-right mt-1 pr-1">Ver estado del Mundial →</p>
        </div>
        ${effectsCard()}
      </div>

      <div class="space-y-5">
        <button id="btn-squad" class="w-full text-left bg-slate-800/60 border border-slate-700 hover:border-[var(--team-primary)] rounded-2xl p-4 cursor-pointer transition-all hover:scale-[1.01]">
          <div class="flex items-center justify-between">
            <h3 class="font-bold">📊 Media del equipo</h3>
            <span class="text-amber-300 font-black text-2xl">${teamRating(me)}</span>
          </div>
          <div class="mt-1">${starsHtml(teamStars(me))}</div>
          <div class="text-xs mt-2 ${!v.ok ? "text-amber-400" : v.short ? "text-orange-400" : "text-slate-400"}">${!v.ok ? `⚠️ ${v.msg}` : v.short ? `🆘 Plantel diezmado: presentas ${S.selectedLineup.length} — jugarás en inferioridad numérica` : `Formación ${getFormation(S.formation) ? S.formation : "improvisada"} · alineación lista`}</div>
          ${fueraDePuesto.length ? `<div class="text-xs text-orange-400 mt-1.5" title="Sus stats bajan mientras jueguen ahí">❗ Fuera de puesto: ${fueraDePuesto.map(p => `${p.name} (de ${p.posJugada})`).join(", ")}</div>` : ""}
          ${discipline.susp.length ? `<div class="text-xs text-red-400 mt-1.5">🟥 Suspendido${discipline.susp.length > 1 ? "s" : ""}: ${discipline.susp.map(p => p.name).join(", ")}</div>` : ""}
          ${discipline.aperc.length ? `<div class="text-xs text-yellow-400 mt-1.5" title="Con otra amarilla quedan suspendidos un partido">🟨 Apercibido${discipline.aperc.length > 1 ? "s" : ""}: ${discipline.aperc.map(p => p.name).join(", ")}</div>` : ""}
          <p class="text-xs tp-text font-semibold mt-2">Gestión de Plantilla →</p>
        </button>
        <button id="btn-journal" class="w-full text-left bg-slate-800/60 border border-slate-700 hover:border-[var(--team-primary)] rounded-2xl p-4 cursor-pointer transition-all hover:scale-[1.01]">
          <div class="flex items-center justify-between">
            <h3 class="font-bold">📖 Diario de Campaña</h3>
            <span class="text-xs text-slate-500">${run.journal.length} momento${run.journal.length !== 1 ? "s" : ""}</span>
          </div>
          <p class="text-xs text-slate-400 mt-1 truncate">Último: ${run.journal.length ? run.journal[run.journal.length - 1].title : "la historia recién comienza."}</p>
          <p class="text-xs tp-text font-semibold mt-2">Revivir la campaña →</p>
        </button>
        ${isMatchDay ? "" : actionCard()}
        ${isMatchDay
          ? `<button id="btn-play" class="tp-gradient w-full text-lg font-black py-3 rounded-xl shadow-lg cursor-pointer transition-all hover:scale-[1.01] hover:brightness-110">⚽ JUGAR PARTIDO</button>`
          : run.actionPending
            ? `<button id="btn-nextday" disabled class="w-full text-lg font-black py-3 rounded-xl border border-slate-700 bg-slate-800/60 text-slate-500 shadow-lg cursor-not-allowed" title="Primero elige la Acción del día">🌙 Pasar al día siguiente →</button>`
            : `<button id="btn-nextday" class="w-full text-lg font-black py-3 rounded-xl border border-slate-500 bg-slate-700/70 hover:bg-slate-600 shadow-lg cursor-pointer transition-all hover:scale-[1.01]">🌙 Pasar al día siguiente →</button>`}
      </div>
    </div>
  `);

  $("#btn-abandon").onclick = () => { if (confirm("¿Abandonar el torneo? La partida terminará.")) go("end-run", false, true); };
  $("#btn-standings").onclick = () => go("worldcup");
  $("#btn-journal").onclick = () => go("journal", "hub");
  $("#btn-squad").onclick = () => go("squad");
  if (isMatchDay) {
    const play = $("#btn-play");
    play.disabled = !v.ok;
    play.classList.toggle("opacity-40", !v.ok);
    play.classList.toggle("cursor-not-allowed", !v.ok);
    play.onclick = () => { if (validateLineup(available, S.selectedLineup).ok) go("start-match", oppId); };
  } else {
    document.querySelectorAll(".da-opt").forEach(b => b.onclick = () => {
      const a = applyDayAction(S.run, b.dataset.action);
      if (!a) return;
      toast(`${a.icon} ${a.title}${a.mult !== 1 ? ` (${multLabel(a.mult)} hoy)` : ""}: ${a.desc}.`);
      renderHub();
    });
    if (!S.run.actionPending) $("#btn-nextday").onclick = () => {
      const res = advanceDay(S.run);
      if (!res) { renderHub(); return; }
      renderHub(); // el hub del día nuevo queda detrás de la portada
      // Bible §4.4: el día arranca con el Daily (informa); el evento llega después (transforma)
      showDaily(buildDaily(S.run), () => {
        if (res.type === "match") { closeModal(); toast(`⚽ ${dayLabel(S.run.day)} — ¡Día de partido!`); }
        else if (res.type === "evento") showDayEvent(res);
        else showRandomEvent(res);
      });
    };
  }
}

/**
 * El World Cup Daily (Bible §4.4) como PORTADA de diario: papel crema, serifas,
 * cabecera con doble filete y la nota de tapa en grande. Se abre al llegar a un
 * día nuevo, ANTES del evento — primero informar, después transformar. `onClose`
 * encadena lo que siga (modal de evento/conflicto o el toast de día de partido).
 */
function showDaily(daily, onClose) {
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
function themeHeader(tema) {
  const th = EVENT_THEMES[tema];
  if (!th) return "";
  return `<div class="text-[10px] uppercase tracking-widest font-bold ${th.color} mb-1">${th.icon} ${th.name} · ${dayLabel(S.run.day)}</div>`;
}

/** Muestra el evento inevitable del día (ya aplicado por el motor) y vuelve al hub. */
function showDayEvent(ev) {
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
  m.querySelector("#ev-ok").onclick = () => { closeModal(); renderHub(); };
}

/** Muestra el modal de un conflicto con decisión y aplica el efecto de la opción elegida. */
function showRandomEvent(ev) {
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
    const res = opt.effect(S.run);
    S.run.stats.eventos++;
    addJournal(S.run, { icon: ev.icon, tone: "neutral", title: ev.title, desc: `Elegiste "${opt.label}". ${res}` });
    closeModal();
    toast(res);
    renderHub();
  });
}

register("hub", renderHub);
