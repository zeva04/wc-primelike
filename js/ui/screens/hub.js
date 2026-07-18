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
import { applyDayAction, actionMult, multLabel, dayOpportunity } from "../../game/day-action.js";
import { DAY_ACTIONS, TACTICS_BONUS, TRAIN_BUFF, TRAIN_FATIGUE } from "../../content/day-actions.js";
import { RARITIES } from "../../content/rarities.js";
import { addJournal } from "../../game/journal.js";
import { moraleBand } from "../../game/morale.js";
import { nextOpponentId, STAGE_LABEL } from "../../game/tournament/knockout.js";
import { buildOpponentReport } from "../../game/scouting.js";
import { EVENT_THEMES } from "../../content/themes.js";
import { S } from "../session.js";
import { register, go } from "../nav.js";
import { screenShell, $, flagImg, starsHtml, modal, closeModal, toast, momentoChip } from "../components.js";
import { spriteSvg } from "../sprites.js";
import { mountPitch } from "../pitch.js";
import { renderGroupTableCard, renderKoInfoCard } from "./worldcup.js";
import { renderScorersCard } from "./scorers.js";

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
  const LABELS = { tiro: "Tiro", defensa: "Defensa", atajadas: "Atajadas", reflejos: "Reflejos", pase: "Pase", aura: "Aura", cabezazo: "Cabezazo" };
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
}

/**
 * Card de la Oportunidad del día (Bible §4.5): la oferta única que compite con
 * las acciones normales. Borde y badge de su rareza; el calendario nunca la
 * anticipó y mañana no va a estar — la card lo dice. "" si hoy no hay.
 */
function oppCard() {
  const o = dayOpportunity(S.run);
  if (!o) return "";
  const rar = RARITIES[o.rareza];
  return `<button id="da-opp" class="w-full text-left rounded-xl border-2 ${rar.border} bg-slate-900/60 p-3 mb-2 transition-all hover:scale-[1.01] hover:brightness-110 cursor-pointer">
    <div class="flex items-center justify-between gap-2 flex-wrap">
      <span class="font-semibold text-sm">${o.icon} ${o.title}</span>
      <span class="px-2 py-0.5 rounded-full border ${rar.border} ${rar.color} text-[9px] font-black uppercase tracking-widest">Oportunidad · ${rar.label}</span>
    </div>
    <div class="text-[10px] text-slate-400 mt-0.5">${o.desc}</div>
    <div class="text-[9px] ${rar.color} font-bold mt-1">⏳ Solo por hoy — ocupa tu Acción del Día${o.choose ? " · tú eliges al protagonista" : ""}</div>
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
 * una. Cuando la acción ya se eligió, una línea de confirmación reemplaza al
 * panel y se desbloquea "Pasar al día siguiente".
 */
function actionCard() {
  const run = S.run;
  const oppNextId = nextOpponentId(run);
  const opp = oppNextId ? getTeam(oppNextId) : null;
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
    ${oppCard()}
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
      // La Sesión Táctica se prepara contra ALGUIEN: el informe del rival (card VS) es su insumo
      const desc = a.id === "tactica" && opp ? `Preparar el partido vs ${opp.name}: el equipo llega mejor plantado (bonus de ataque y defensa)` : a.desc;
      return `<button data-action="${a.id}" ${m === 0 ? "disabled" : ""} class="da-opt w-full text-left rounded-xl border border-slate-700 bg-slate-900/50 p-3 mb-2 transition-all ${m === 0 ? "opacity-50 cursor-not-allowed" : "hover:border-amber-400 hover:bg-slate-800 cursor-pointer"}">
        <div class="flex items-center justify-between">
          <span class="font-semibold text-sm">${a.icon} ${a.title}</span>
          ${modBadge(m)}
        </div>
        <div class="text-[10px] text-slate-500 mt-0.5">${desc}.</div>
      </button>`;
    }).join("")}
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
 * lectura, clic → Gestión de Plantilla), chips de Moral y Energía, los avisos que
 * importan (alineación inválida, fuera de puesto, sanciones, forma) y el botón a
 * Gestión de Plantilla. La cancha la monta renderHub tras pintar (necesita el DOM).
 */
function teamStateCard(v, discipline, fueraDePuesto, forma) {
  const run = S.run;
  const moral = run.moral ?? 50;
  const mb = moraleBand(moral);
  const moralCls = moral >= 61 ? "text-emerald-400" : moral >= 41 ? "text-slate-300" : "text-red-400";
  const avgEnergy = Math.round(run.squad.reduce((s, p) => s + p.energia, 0) / run.squad.length);
  const enCls = avgEnergy > 65 ? "text-emerald-400" : avgEnergy > 35 ? "text-amber-400" : "text-red-400";
  const formationLabel = getFormation(S.formation) ? S.formation : "Improvisada";
  const avisos = [];
  if (!v.ok) avisos.push(`<div class="text-amber-400">⚠️ ${v.msg}</div>`);
  else if (v.short) avisos.push(`<div class="text-orange-400">🆘 Plantel diezmado: presentas ${S.selectedLineup.length} — jugarás en inferioridad</div>`);
  if (fueraDePuesto.length) avisos.push(`<div class="text-orange-400" title="Sus stats bajan mientras jueguen ahí">❗ Fuera de puesto: ${fueraDePuesto.map(p => p.name).join(", ")}</div>`);
  if (discipline.susp.length) avisos.push(`<div class="text-red-400">🟥 Suspendido${discipline.susp.length > 1 ? "s" : ""}: ${discipline.susp.map(p => p.name).join(", ")}</div>`);
  if (discipline.aperc.length) avisos.push(`<div class="text-yellow-400" title="Con otra amarilla se pierde un partido">🟨 Apercibido${discipline.aperc.length > 1 ? "s" : ""}: ${discipline.aperc.map(p => p.name).join(", ")}</div>`);
  if (forma.racha.length) avisos.push(`<div class="text-emerald-400" title="Momento alto: rinden por encima">🔥 En racha: ${forma.racha.map(p => p.name).join(", ")}</div>`);
  if (forma.frios.length) avisos.push(`<div class="text-sky-400" title="Momento bajo: rinden por debajo">❄️ Fríos: ${forma.frios.map(p => p.name).join(", ")}</div>`);
  return `<div class="bg-slate-800/60 border border-slate-700 rounded-2xl p-4">
    <div class="flex items-center justify-between mb-2.5">
      <h3 class="font-bold text-sm">👕 Estado del equipo</h3>
      <span class="text-[10px] uppercase tracking-wider text-slate-500 font-bold">Formación <b class="tp-text">${formationLabel}</b></span>
    </div>
    <div id="hub-pitch" class="pitch relative w-full h-56 rounded-xl overflow-hidden border-2 border-slate-900 mb-3 cursor-pointer" title="Ir a Gestión de Plantilla"></div>
    <div class="flex gap-2 mb-3">
      ${stateChip(mb.icon, "Moral", mb.label, moralCls)}
      ${stateChip("⚡", "Energía", avgEnergy + "%", enCls)}
    </div>
    ${avisos.length ? `<div class="space-y-1 text-xs mb-3">${avisos.join("")}</div>` : ""}
    <button id="btn-squad" class="w-full text-sm font-bold py-2.5 rounded-lg tp-gradient cursor-pointer hover:brightness-110 transition-all">📋 Gestión de Plantilla →</button>
  </div>`;
}

/**
 * Concentración Mundialista: pantalla central entre partidos. Calca el layout de
 * referencia del PO: banda VS a lo ancho; cuerpo en 3 columnas (IZQ estado del
 * equipo con la cancha · CENTRO "¿Qué harás hoy?" + efectos · DER grupo + goleadores);
 * y a lo ancho abajo el calendario y el botón del día. El Diario y el Estado del
 * Mundial viven como iconos en la cabecera.
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

    <div class="grid lg:grid-cols-[19rem_minmax(0,1fr)_20rem] gap-5 items-start">
      <!-- IZQUIERDA: estado del equipo -->
      ${teamStateCard(v, discipline, fueraDePuesto, forma)}

      <!-- CENTRO: ¿qué harás hoy? + efectos -->
      <div class="space-y-5 min-w-0">
        ${isMatchDay
          ? `<div class="bg-slate-800/60 border tp-border rounded-2xl p-5 text-center">
              <div class="text-4xl mb-2">⚽</div>
              <h3 class="text-xl font-black">¡Hoy se juega!</h3>
              <p class="text-sm text-slate-400 mt-1">${me.name} enfrenta a ${opp.name}. Revisa tu plantilla y cuando estés listo, salta a la cancha.</p>
            </div>`
          : actionCard()}
        ${effectsCard()}
      </div>

      <!-- DERECHA: grupo + goleadores -->
      <div class="space-y-5">
        <div id="btn-standings2" class="cursor-pointer transition-transform hover:scale-[1.01]" title="Ver el estado de todos los grupos">
          ${run.stage === "groups" ? renderGroupTableCard() : renderKoInfoCard()}
          <p class="text-[10px] tp-text font-semibold text-right mt-1 pr-1">Ver estado del Mundial →</p>
        </div>
        <div id="btn-scorers" class="cursor-pointer transition-transform hover:scale-[1.01]" title="Ver la tabla completa de goleadores">
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
