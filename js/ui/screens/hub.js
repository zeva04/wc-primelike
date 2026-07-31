/* ============================================================
   ui/screens/hub — Concentración Mundialista (Game Vision):
   pantalla central entre partidos. Rival, calendario por días,
   estado del torneo, plantilla, efectos y el botón del día.
   También muestra los modales de evento/conflicto del día.
   ============================================================ */
import { getTeam } from "../../data/teams-repo.js";
import { teamRating, teamStars, playerOverall, outOfPosPenalty } from "../../game/ratings.js";
import { currentLineup, validateLineup, getFormation, assignPositions, maxLineupSize } from "../../game/lineup.js";
import { dayLabel, advanceDay } from "../../game/calendar.js";
import { buildDaily } from "../../game/daily.js";
import { applyDayAction, actionMult, multLabel, dayOpportunity, canjeableBuffs, canjeBuff } from "../../game/day-action.js";
import { DAY_ACTIONS, PLAN_XP_MULT, TRAIN_BUFF, TRAIN_FATIGUE, CANJE_THRESHOLD, CANJE_PERMANENT, STAT_LABELS } from "../../content/day-actions.js";
import { getPhilosophy, FILO_LEVELS, FILO_ETAPAS } from "../../content/philosophies.js";
import { filoPoints, filoLevel, filoEtapa, filoXpMults } from "../../game/philosophy.js";
import { planPayoff } from "../../game/traits.js";
import { dtProgress, DT_MAX } from "../../game/coach.js";
import { markerColor } from "../board.js";
import { RARITIES } from "../../content/rarities.js";
import { addJournal } from "../../game/journal.js";
import { moraleBand } from "../../game/morale.js";
import { nextOpponentId, STAGE_LABEL } from "../../game/tournament/knockout.js";
import { buildOpponentReport } from "../../game/scouting.js";
import { EVENT_THEMES } from "../../content/themes.js";
import { S } from "../session.js";
import { register, go } from "../nav.js";
import { screenShell, $, flagImg, starsHtml, modal, closeModal, modalOpen, toast, momentoChip, energyCls, oxidCls } from "../components.js";
import { oxidState } from "../../game/oxidation.js";
import { HEIGHTS, HEIGHT_DEFAULT, heightOf } from "../../game/match/field.js";
import { spriteSvg } from "../sprites.js";
import { mountPitch } from "../pitch.js";
import { renderGroupTableCard, renderKoInfoCard } from "./worldcup.js";
import { renderScorersCard, wireScorersCard } from "./scorers.js";

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
 * Tarjeta del calendario: la ventana de preparación COMPLETA, desde su primer día
 * (`windowStart`, tras el último partido) hasta el próximo partido. Los días ya vividos
 * NO se borran: quedan en gris para dar sensación de avance; HOY se resalta y los futuros
 * anticipan su temática. El día de partido muestra al rival. Todo a lo ancho (flex-1).
 */
function renderCalendarCard(opp) {
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

/** Chips con los efectos acumulados para el próximo partido; "" si no hay ninguno. */
function buffChips() {
  const chips = [];
  for (const [k, v] of Object.entries(S.run.buffs)) {
    if (k === "antiLesion") { if (v) chips.push(`<span class="px-2 py-0.5 rounded-full border border-emerald-500/50 bg-emerald-500/10 text-emerald-400">🧑‍⚕️ Sin lesiones</span>`); continue; }
    if (k === "penales") { if (v) chips.push(`<span class="px-2 py-0.5 rounded-full border border-emerald-500/50 bg-emerald-500/10 text-emerald-400">🥅 Penales +</span>`); continue; }
    if (k === "tactica") { // reliquia pre-F1: el buff táctico murió con el arco de Filosofía
      continue;
    }
    if (!v || !STAT_LABELS[k]) continue;
    const pos = v > 0;
    const canje = v >= CANJE_THRESHOLD; // ya alcanza el umbral: se resalta como canjeable
    chips.push(`<span class="px-2 py-0.5 rounded-full border ${canje ? "tp-border tp-text" : pos ? "border-emerald-500/50 bg-emerald-500/10 text-emerald-400" : "border-red-500/50 bg-red-500/10 text-red-400"}">${canje ? "✨ " : ""}${STAT_LABELS[k]} ${pos ? "+" : ""}${v}</span>`);
  }
  return chips.length ? `<div class="flex flex-wrap gap-1.5 text-[10px] font-bold">${chips.join("")}</div>` : "";
}

/**
 * Confirmación del canje (Bible cap.6): renuncias a +CANJE_THRESHOLD del boost del próximo
 * partido y, a cambio, ganas +CANJE_PERMANENT PERMANENTE en esa stat para todos los que la
 * tienen. Es irreversible (crece y no baja) pero gratis (no gasta la Acción del Día).
 */
function showCanje(key) {
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
const NIVEL_CHIP = {
  Alto: "border-red-500/60 bg-red-500/10 text-red-400",
  Medio: "border-slate-500/60 bg-slate-500/10 text-slate-300",
  Bajo: "border-emerald-500/60 bg-emerald-500/10 text-emerald-400",
};
const RES_CHIP = { V: "text-emerald-400 border-emerald-500/50", E: "text-slate-300 border-slate-500/50", D: "text-red-400 border-red-500/50" };

/**
 * Modal del Informe del Rival (Bible §4.6): las tres líneas del cruce con su
 * nivel cualitativo, la figura, la forma reciente y las bajas confirmadas.
 * Gratis e ilimitado — mirar nunca gasta el día.
 */
/**
 * LA ALTURA DEL BLOQUE (sprint del Territorio): los 5 botones y la explicación de la elegida.
 * Vive en DOS sitios —la card del día de partido y el Informe del Rival— porque la decisión
 * se toma LEYENDO al rival: por eso el markup y el cableado se comparten en vez de copiarse.
 * Acá es gratis; dentro del partido, moverla consume una ventana táctica. Queda puesta para
 * los partidos siguientes (`run.altura`).
 */
function alturaPicker() {
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
function wireAlturaPicker() {
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

function showScoutReport(oppId) {
  const rep = buildOpponentReport(S.run, oppId);
  const opp = getTeam(oppId);
  const LINEA = { ataque: "⚔️ Su ataque", defensa: "🛡️ Su defensa", arquero: "🧤 Su arquero" };
  const figuraObj = (opp.players || opp.figures).find(p => p.name === rep.figura.name);
  modal(`
    <div>
      <div class="flex items-center gap-3 mb-1">
        ${flagImg(opp, "w-10 h-7", true)}
        <div>
          <h2 class="text-xl font-black">📋 Informe del rival — ${rep.name}</h2>
          <p class="text-[10px] text-slate-500">Cuerpo técnico · consultarlo es gratis: mirar no gasta el día</p>
        </div>
      </div>
      <div class="space-y-2 mt-4">
        ${(mm => mm ? `<div class="rounded-xl border ${mm.brechaPct ? "border-red-500/60 bg-red-500/10" : "border-amber-500/60 bg-amber-500/10"} p-3">
          <span class="font-semibold text-sm ${mm.brechaPct ? "text-red-300" : "text-amber-300"}">🔥 Modo Mundial: llega un +${mm.pct + mm.brechaPct}% encendido</span>
          <p class="text-[11px] ${mm.brechaPct ? "text-red-200/70" : "text-amber-200/70"} mt-1">En eliminatorias los rivales suben con cada ronda — el Mundial de verdad se juega en finales.${mm.madura ? " Y a esta altura del torneo, su idea llega madurada: juega su fútbol en serio." : ""}${
            // Las dos caras del mismo número. Antes el texto SIEMPRE decía "llega con más
            // idea que nosotros", pero desde que existe la vara alta el extra también
            // aparece cuando somos NOSOTROS los que llegamos con la idea armada — y ahí
            // ese texto decía exactamente lo contrario de lo que pasa en la cancha.
            !mm.brechaPct ? ""
              : mm.lead ? ` <b>Nos tienen miedo (+${mm.brechaPct}% extra): saben a qué jugamos y van a dar el partido de su torneo. Al favorito nadie le juega de igual a igual.</b>`
              : ` <b>Llega con más idea que nosotros (+${mm.brechaPct}% extra): a la final no se llega improvisando — consolidar nuestra identidad es la vacuna.</b>`}</p>
        </div>` : "")(rep.modoMundial)}
        <div class="rounded-xl border tp-border tp-bg-soft p-3">
          <div class="flex items-center justify-between">
            <span class="font-semibold text-sm">${rep.filosofia.icon} Su idea: ${rep.filosofia.name}</span>
            <span class="px-2 py-0.5 rounded-full border ${rep.filosofia.consolidada ? "border-amber-500/60 bg-amber-500/10 text-amber-300" : "border-slate-600 bg-slate-800/60 text-slate-300"} text-[10px] font-black uppercase tracking-widest">${rep.filosofia.nivel}</span>
          </div>
          <p class="text-[11px] text-slate-400 mt-1">${rep.filosofia.detalle}</p>
        </div>
        <!-- CÓMO SE VA A PARAR (Territorio): la altura rival y, debajo, la nuestra — la
             decisión se toma acá, leyendo al que viene, y no a ciegas en la pizarra. -->
        <div class="rounded-xl border tp-border tp-bg-soft p-3">
          <div class="flex items-center justify-between">
            <span class="font-semibold text-sm">${rep.bloque.icon} Cómo se van a parar: bloque ${rep.bloque.label.toLowerCase()}</span>
          </div>
          <p class="text-[11px] text-slate-400 mt-1">${rep.bloque.detalle}</p>
          <div class="mt-3 pt-3 border-t border-slate-700/70">${alturaPicker()}</div>
        </div>
        ${Object.entries(rep.lineas).map(([k, l]) => `
          <div class="rounded-xl border border-slate-700 bg-slate-900/50 p-3">
            <div class="flex items-center justify-between">
              <span class="font-semibold text-sm">${LINEA[k]}</span>
              <span class="px-2 py-0.5 rounded-full border ${NIVEL_CHIP[l.nivel]} text-[10px] font-black uppercase tracking-widest">${l.nivel}</span>
            </div>
            <p class="text-[11px] text-slate-400 mt-1">${l.detalle}</p>
          </div>`).join("")}
        <div class="rounded-xl border border-slate-700 bg-slate-900/50 p-3 flex items-center gap-3">
          ${figuraObj ? spriteSvg(figuraObj, opp, "w-8 h-9") : ""}
          <div class="flex-1">
            <div class="font-semibold text-sm">⭐ ${rep.figura.name} <span class="text-[10px] text-slate-500">${rep.figura.pos}${rep.figura.nota ? ` · ${rep.figura.nota}` : ""}</span></div>
            <p class="text-[11px] text-slate-400 mt-0.5">${rep.figura.por_que}</p>
          </div>
        </div>
        <div class="rounded-xl border border-slate-700 bg-slate-900/50 p-3">
          <span class="font-semibold text-sm">📈 Forma reciente</span>
          ${rep.forma.length
            ? `<div class="flex flex-wrap gap-1.5 mt-1.5">${rep.forma.map(f => `<span class="px-2 py-0.5 rounded-full border ${RES_CHIP[f.res]} bg-slate-800/60 text-[10px] font-bold">${f.res} ${f.marcador} vs ${f.rival}</span>`).join("")}</div>`
            : `<p class="text-[11px] text-slate-500 mt-1">${rep.enEliminatorias ? "Sigue vivo en las eliminatorias: viene ganando cuando importa." : "Aún no jugó en el torneo."}</p>`}
          ${rep.forma.length && rep.enEliminatorias ? `<p class="text-[10px] text-slate-500 mt-1.5">Además sigue vivo en las eliminatorias.</p>` : ""}
        </div>
        ${rep.bajas.length ? `<div class="rounded-xl border border-red-500/40 bg-red-500/10 p-3 text-[11px] text-red-300"><b>🟥 Bajas confirmadas:</b> ${rep.bajas.join(" y ")} no juega${rep.bajas.length > 1 ? "n" : ""} ante nosotros.</div>` : ""}
      </div>
      <button id="scout-close" class="btn-primary w-full mt-4">Cerrar informe</button>
    </div>
  `, "max-w-lg").querySelector("#scout-close").onclick = closeModal;
  wireAlturaPicker();
}

/**
 * Card de la Oportunidad del día (Bible §4.5): la oferta única que compite con
 * las acciones normales. Borde y badge de su rareza; el calendario nunca la
 * anticipó y mañana no va a estar — la card lo dice. "" si hoy no hay.
 * `state`: "active" (elegible) · "chosen" (fue la acción de hoy) · "muted"
 * (elegiste otra). La card se queda visible en los tres casos para que el
 * panel no cambie de tamaño (evita huecos al elegir).
 */
function oppCard(state = "active") {
  const o = dayOpportunity(S.run);
  if (!o) return "";
  const rar = RARITIES[o.rareza];
  const chosen = state === "chosen", muted = state === "muted";
  const box = chosen ? `${rar.border} ring-2 ring-emerald-400/50 bg-slate-900/70`
    : muted ? "border-slate-700 bg-slate-900/40 opacity-40 cursor-not-allowed"
    : `${rar.border} bg-slate-900/60 hover:scale-[1.01] hover:brightness-110 cursor-pointer`;
  const foot = chosen ? `<div class="text-[9px] text-emerald-400 font-bold mt-1">✓ Aprovechada hoy — ocupó tu Acción del Día</div>`
    : muted ? `<div class="text-[9px] text-slate-500 mt-1">Hoy elegiste otra acción</div>`
    : `<div class="text-[9px] ${rar.color} font-bold mt-1">⏳ Solo por hoy — ocupa tu Acción del Día${o.choose ? " · tú eliges al protagonista" : ""}</div>`;
  return `<button id="da-opp" ${state === "active" ? "" : "disabled"} class="w-full text-left rounded-xl border-2 ${box} p-3 mb-2 transition-all">
    <div class="flex items-center justify-between gap-2 flex-wrap">
      <span class="font-semibold text-sm">${o.icon} ${o.title}</span>
      <span class="px-2 py-0.5 rounded-full border ${rar.border} ${rar.color} text-[9px] font-black uppercase tracking-widest">Oportunidad · ${rar.label}</span>
    </div>
    <div class="text-[10px] text-slate-400 mt-0.5">${o.desc}</div>
    ${foot}
  </button>`;
}

/**
 * Selector de protagonista de una oportunidad con `choose`: modal con los
 * candidatos (sprite, nombre, puesto y nota). Elegir aplica y consume el día;
 * "decidir más tarde" no toca nada — la oportunidad sigue viva hasta que el
 * día pase.
 */
function showOppChooser(o) {
  const me = getTeam(S.run.teamId);
  const rar = RARITIES[o.rareza];
  const m = modal(`
    <div class="text-center">
      <div class="text-5xl mb-2">${o.icon}</div>
      <div class="inline-block px-2.5 py-0.5 rounded-full border ${rar.border} ${rar.color} text-[10px] font-black uppercase tracking-widest mb-2">Oportunidad · ${rar.label}</div>
      <h2 class="text-xl font-black mb-1">${o.title}</h2>
      <p class="text-slate-300 text-sm mb-4">${o.desc}</p>
      <p class="text-xs font-bold tp-text mb-3">${o.choose.label}</p>
      <div class="space-y-2 max-h-72 overflow-y-auto pr-1">
        ${o.choose.candidates(S.run).map(p => `
          <button data-name="${p.name}" class="opp-cand w-full flex items-center gap-3 px-3 py-2 rounded-xl border border-slate-600 bg-slate-700/60 hover:border-amber-400 hover:bg-slate-700 transition-all cursor-pointer text-left">
            ${spriteSvg(p, me, "w-7 h-8")}
            <span class="flex-1 font-semibold text-sm">${p.name}</span>
            <span class="text-[10px] text-slate-400">${p.pos}</span>
            <span class="text-amber-300 font-black text-sm">${playerOverall(p)}</span>
          </button>`).join("")}
      </div>
      <button id="opp-cancel" class="mt-4 text-xs text-slate-500 hover:text-slate-300 cursor-pointer">Todavía no — decidir más tarde</button>
    </div>
  `);
  m.querySelectorAll(".opp-cand").forEach(b => b.onclick = () => {
    const res = applyDayAction(S.run, o.id, b.dataset.name);
    if (!res) return;
    closeModal();
    toast(`${res.icon} ${res.title}: ${res.desc}`);
    renderHub();
  });
  m.querySelector("#opp-cancel").onclick = closeModal;
}

/**
 * Panel de la Acción del Día (Bible §4.7): un día sin partido = una inversión.
 * La Oportunidad del día (si hay) va arriba, tentando; Entrenar agrupa sus
 * focos en una fila de botones; las demás acciones son una tarjeta-botón cada
 * una. Una vez elegida la acción, el panel NO desaparece: se queda con la
 * elegida resaltada (✓ Elegida hoy) y las demás en gris, no clickeables. Así
 * el bloque no cambia de tamaño (no deja huecos) y queda claro qué decidiste.
 */
function actionCard() {
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
 * Card de IDENTIDAD del estado del equipo (F3, "La vitrina"): filosofía, nivel y la
 * barra de progreso al próximo umbral. Clic → pantalla de identidad. Compacta a
 * propósito: el despliegue completo (aristas, rasgo, counters) vive en la pantalla.
 */
function filoCard() {
  const run = S.run;
  const f = getPhilosophy(run.filoId);
  if (!f) return "";
  const pts = filoPoints(run);
  const lvl = filoLevel(run);           // nivel 0..9 de la identidad que se juega
  const etapa = filoEtapa(run);         // etiqueta visible: la etapa de siempre
  const nivel = FILO_LEVELS[lvl];
  const next = FILO_LEVELS[lvl + 1] || null;
  const pct = next ? Math.min(100, (100 * (pts - nivel.min)) / (next.min - nivel.min)) : 100;
  // La segunda capa (arco de Progresión): el Director Técnico y su barra propia.
  // Las filosofías son lo que SABE el equipo; el DT es lo que sabe el entrenador.
  const dt = dtProgress(run);
  return `<div id="btn-filo" class="rounded-xl border tp-border tp-bg-soft px-3 py-2 mb-3 shrink-0 cursor-pointer transition-all hover:brightness-125" title="Ver la identidad del equipo">
    <div class="flex items-center justify-between gap-2">
      <span class="text-xs font-bold ${etapa === 2 ? "text-amber-300" : "tp-text"}">${f.icon} ${f.name}</span>
      <span class="text-[9px] uppercase tracking-wider font-black text-slate-400">Nv ${lvl + 1} · ${FILO_ETAPAS[etapa].label}${next ? ` · ${pts}/${next.min} XP` : ""}</span>
    </div>
    <div class="h-1 rounded-full bg-slate-900/80 overflow-hidden mt-1.5"><div class="h-full rounded-full ${etapa === 2 ? "bg-amber-400" : "tp-gradient"}" style="width:${pct}%"></div></div>
    <div class="flex items-center justify-between gap-2 mt-2">
      <span class="text-[10px] font-bold text-slate-300">🧠 DT nivel ${run.dtNivel || 1}<span class="text-slate-600">/${DT_MAX}</span></span>
      <span class="text-[9px] uppercase tracking-wider font-black ${run.identityPoints > 0 ? "text-amber-300" : "text-slate-500"}">${run.identityPoints > 0 ? `${run.identityPoints} PI por gastar` : `${dt.need ? `${dt.curr}/${dt.need}` : "tope"}`}</span>
    </div>
    <div class="h-1 rounded-full bg-slate-900/80 overflow-hidden mt-1"><div class="h-full rounded-full bg-sky-400" style="width:${dt.pct}%"></div></div>
  </div>`;
}

/** Chip de un indicador del estado del equipo (icono + label + valor coloreado). */
function stateChip(icon, label, value, cls) {
  return `<div class="flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-900/50 px-2 py-1.5 flex-1 min-w-0">
    <span class="text-base leading-none">${icon}</span>
    <div class="min-w-0">
      <div class="text-[9px] uppercase tracking-wider text-slate-500 font-bold leading-none">${label}</div>
      <div class="text-xs font-black ${cls} truncate">${value}</div>
    </div>
  </div>`;
}

/**
 * Columna izquierda "Estado del equipo": formación, la cancha con el once (solo
 * lectura, clic → Gestión de Plantilla), chips de Moral y Energía, los efectos para
 * el próximo partido, los avisos que importan (alineación inválida, fuera de puesto,
 * sanciones, forma) y el botón a Gestión de Plantilla. La card llena su columna
 * (`h-full flex flex-col`) y la cancha absorbe el alto sobrante (`flex-1`) — así el
 * arquero se ve completo y la columna nunca deja hueco. La cancha la monta renderHub
 * tras pintar (necesita el DOM).
 */
function teamStateCard(v, discipline, fueraDePuesto, forma) {
  const run = S.run;
  const moral = run.moral ?? 50;
  const mb = moraleBand(moral);
  const moralCls = moral >= 61 ? "text-emerald-400" : moral >= 41 ? "text-slate-300" : "text-red-400";
  const avgEnergy = Math.round(run.squad.reduce((s, p) => s + p.energia, 0) / run.squad.length);
  const enCls = energyCls(avgEnergy);
  // Ritmo de trabajo (oxidación R1): el color ES la mecánica, misma constante que la banda
  const ox = oxidState(run);
  const oxVal = ox.oxidado ? `Oxidado −${Math.round((1 - ox.mult) * 100)}%` : ox.racha ? `${ox.racha} día${ox.racha > 1 ? "s" : ""} sin entrenar` : "Al día";
  const formationLabel = getFormation(S.formation) ? S.formation : "Improvisada";
  const chips = buffChips();
  const canjeables = canjeableBuffs(run);
  const avisos = [];
  const bajasOnce = S.selectedLineup.filter(p => p.suspendido || p.lesionadoPartidos > 0);
  if (bajasOnce.length) avisos.push(`<div class="text-red-400">🚑 Baja en el once: ${bajasOnce.map(p => p.name).join(", ")} — elige su reemplazo en Gestión de Plantilla</div>`);
  if (!v.ok) avisos.push(`<div class="text-amber-400">⚠️ ${v.msg}</div>`);
  else if (v.short) avisos.push(`<div class="text-orange-400">🆘 Plantel diezmado: presentas ${S.selectedLineup.length} — jugarás en inferioridad</div>`);
  if (fueraDePuesto.length) avisos.push(`<div class="text-orange-400" title="Sus stats bajan mientras jueguen ahí">❗ Fuera de puesto: ${fueraDePuesto.map(p => p.name).join(", ")}</div>`);
  if (discipline.susp.length) avisos.push(`<div class="text-red-400">🟥 Suspendido${discipline.susp.length > 1 ? "s" : ""}: ${discipline.susp.map(p => p.name).join(", ")}</div>`);
  if (discipline.aperc.length) avisos.push(`<div class="text-yellow-400" title="Con otra amarilla se pierde un partido">🟨 Apercibido${discipline.aperc.length > 1 ? "s" : ""}: ${discipline.aperc.map(p => p.name).join(", ")}</div>`);
  if (forma.racha.length) avisos.push(`<div class="text-emerald-400" title="Momento alto: rinden por encima">🔥 En racha: ${forma.racha.map(p => p.name).join(", ")}</div>`);
  if (forma.frios.length) avisos.push(`<div class="text-sky-400" title="Momento bajo: rinden por debajo">❄️ Fríos: ${forma.frios.map(p => p.name).join(", ")}</div>`);
  // Plantel oxidado (R1): el aviso explica el CASTIGO y las dos salidas (riesgo declarado
  // del arco: que el jugador nuevo entienda por qué rinde menos).
  if (ox.oxidado) avisos.push(`<div class="${oxidCls(ox.racha)}" title="Cada día de preparación sin Entrenar ni Sesión Táctica suma; al 3º el plantel pierde filo">⚙️ Plantel oxidado: ${ox.racha} días sin entrenar — rinde un ${Math.round((1 - ox.mult) * 100)}% menos hasta entrenar (o jugar: el partido devuelve el ritmo)</div>`);
  // Clima de vestuario: la Moral modula la frecuencia de conflictos de la ventana (Sprint 2).
  if (mb.id === "suelo" || mb.id === "baja") avisos.push(`<div class="text-orange-400" title="La moral baja convulsiona el vestuario: más conflictos entre partidos">🎭 Vestuario caldeado: se vienen más conflictos</div>`);
  else if (mb.id === "nubes") avisos.push(`<div class="text-emerald-400" title="La moral alta serena el vestuario: menos conflictos entre partidos">🎭 Vestuario en paz: semana tranquila por delante</div>`);
  // min-w-0: sin él la card hereda el piso `min-width:auto` de item de grilla y NO puede
  // achicarse por debajo de su contenido mínimo. En escritorio no se nota (la columna mide
  // 20rem), pero en una sola columna a 375px la card se plantaba en 379 y empujaba la
  // página a 394 con scroll horizontal (medido con tools/mobile.html, 29-jul). Sus
  // hermanas de la grilla ya lo llevan; a esta se le había escapado.
  return `<div class="bg-slate-800/60 border border-slate-700 rounded-2xl p-4 h-full flex flex-col min-w-0">
    <div class="flex items-center justify-between mb-2.5 shrink-0">
      <h3 class="font-bold text-sm">👕 Estado del equipo</h3>
      <span class="text-[10px] uppercase tracking-wider text-slate-500 font-bold">Formación <b class="tp-text">${formationLabel}</b></span>
    </div>
    <div id="hub-pitch" class="pitch relative w-full flex-1 min-h-[22rem] rounded-xl overflow-hidden border-2 border-slate-900 mb-3 cursor-pointer" title="Ir a Gestión de Plantilla"></div>
    <div class="flex gap-2 mb-2 shrink-0">
      ${stateChip(mb.icon, "Moral", mb.label, moralCls)}
      ${stateChip("⚡", "Energía", avgEnergy + "%", enCls)}
      ${stateChip("⚙️", "Ritmo", oxVal, oxidCls(ox.racha))}
    </div>
    ${filoCard()}
    <div class="mb-3 shrink-0">
      <div class="text-[10px] uppercase tracking-wider text-slate-500 font-bold mb-1.5">✨ Efectos próximo partido</div>
      ${chips || `<div class="text-[10px] text-slate-500">Sin efectos aún — los días del calendario los irán sumando.</div>`}
      ${canjeables.length ? `<div class="mt-2 space-y-1.5">
        ${canjeables.map(c => `<button data-key="${c.key}" class="canje-opt w-full flex items-center justify-between gap-2 rounded-lg border tp-border tp-bg-soft px-2.5 py-1.5 text-left hover:brightness-125 cursor-pointer transition-all" title="Convierte el boost en crecimiento permanente para el resto de la run">
          <span class="text-[11px] font-bold tp-text">✨ Canjear ${c.label} +${CANJE_THRESHOLD} → +${CANJE_PERMANENT} permanente</span>
          <span class="text-[9px] text-slate-400 shrink-0">a ${c.alcance} jug.</span>
        </button>`).join("")}
      </div>` : ""}
    </div>
    ${avisos.length ? `<div class="space-y-1 text-xs mb-3 shrink-0">${avisos.join("")}</div>` : ""}
    <button id="btn-squad" class="w-full text-sm font-bold py-2.5 rounded-lg tp-gradient cursor-pointer hover:brightness-110 transition-all shrink-0">📋 Gestión de Plantilla →</button>
  </div>`;
}

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

function renderHub(opts = {}) {
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

/** Bajas actuales del once (suspendidos + lesionados). */
const bajasDelOnce = () => (S.selectedLineup || []).filter(p => p.suspendido || p.lesionadoPartidos > 0);

/**
 * Si el evento recién cerrado tumbó a un TITULAR (lesión), el DT lo resuelve AHORA:
 * se navega directo a Gestión de Plantilla con el caído a la vista (PO 22-jul — nada
 * se reemplaza solo). Solo dispara ante una baja NUEVA (`prev` = cuántas había antes
 * del evento): una baja vieja pendiente ya tiene su aviso fijo en el hub, no secuestra
 * la navegación cada mañana. Devuelve true si navegó (el caller no repinta el hub).
 */
function irASquadSiBaja(prev) {
  const bajas = bajasDelOnce();
  if (bajas.length <= prev) return false;
  toast(`🚑 ${bajas[bajas.length - 1].name} es baja: elige su reemplazo.`);
  go("squad");
  return true;
}

/** Muestra el evento inevitable del día (ya aplicado por el motor) y vuelve al hub. */
function showDayEvent(ev, bajasPre = 0) {
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
    const bajasPre = bajasDelOnce().length; // el efecto del conflicto puede lesionar a un titular
    const res = opt.effect(S.run);
    S.run.stats.eventos++;
    addJournal(S.run, { icon: ev.icon, tone: "neutral", title: ev.title, desc: `Elegiste "${opt.label}". ${res}` });
    closeModal();
    toast(res);
    if (!irASquadSiBaja(bajasPre)) renderHub();
  });
}

register("hub", renderHub);
