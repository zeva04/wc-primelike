/* ============================================================
   ui/screens/squad — Gestión de Plantilla: formación, ficha del
   jugador y el once sobre la cancha.

   La cancha y su arrastre viven en ui/pitch.js (la comparte con
   el partido); las reglas, en game/lineup.js y game/ratings.js.
   Esta pantalla decide QUÉ intercambio es válido y qué significa.

   MODELO: S.selectedLineup va ORDENADO por los slots de
   S.formation — el titular del índice i juega formationSlots(i).
   Mover a alguien = mover su índice; assignPositions rederiva de
   ahí el puesto de cada uno (y con él, el castigo).
   ============================================================ */
import { getTeam } from "../../data/teams-repo.js";
import {
  playerOverall, naturalOverall, overallAt, playerStars, lineupRating,
  STAT_KEYS, GK_STAT_KEYS, playedPos, posDistance, effectiveStat, baseStatAt, outOfPosPenalty, statPenalties,
} from "../../game/ratings.js";
import { momentoPct, momentoLabel } from "../../game/momentum.js";
import { moraleBand } from "../../game/morale.js";
import {
  currentLineup, autoLineup, validateLineup, assignPositions, canPlayAt,
  formationSlots, FORMATIONS, getFormation, canUseFormation, maxLineupSize,
} from "../../game/lineup.js";
import { S } from "../session.js";
import { register, go } from "../nav.js";
import { screenShell, $, flagImg, starsHtml, posBadge, numTag, energyBar, momentoChip, toast, modal, closeModal } from "../components.js";
import { mountPitch, POS_NAME } from "../pitch.js";
import { spriteSvg } from "../sprites.js";

const STAT_NAME = {
  tiro: "Tiro", defensa: "Defensa", cabezazo: "Cabezazo", pase: "Pase", aura: "Aura",
  atajadas: "Atajadas", reflejos: "Reflejos", salidas: "Salidas",
};

let selName = null; // jugador con la ficha abierta (solo estado visual de esta pantalla)

/**
 * Gestión de Plantilla: cancha con los 6 titulares, selector de formación,
 * ficha del jugador elegido y los 4 suplentes. Se llega desde la media del equipo en el hub.
 */
function renderSquadScreen() {
  const me = getTeam(S.run.teamId);
  refreshLineup();
  if (!S.run.squad.some(p => p.name === selName)) selName = (S.selectedLineup[0] || S.run.squad[0]).name;

  screenShell(`
    <button id="btn-back" class="text-slate-400 hover:text-white mb-4 cursor-pointer">← Volver a la concentración</button>
    <div class="flex items-center justify-between flex-wrap gap-3 mb-4">
      <h1 class="text-2xl font-black flex items-center gap-2">${flagImg(me, "w-8 h-[1.4rem]")} Gestión de Plantilla</h1>
    </div>

    <div class="grid lg:grid-cols-[minmax(0,1fr)_20rem] gap-4 items-start">
      <div class="min-w-0 bg-slate-800/60 border border-slate-700 rounded-2xl p-3 sm:p-4">
        <div class="flex items-end justify-between gap-3 mb-3 flex-wrap">
          <div>
            <div class="text-[10px] uppercase tracking-widest text-slate-500 font-bold mb-1">Formación actual</div>
            <div id="formation-picker" class="relative"></div>
          </div>
          <div class="flex items-end gap-4">
            ${moraleBadge()}
            <div class="text-right">
              <div class="text-[10px] uppercase tracking-widest text-slate-500 font-bold mb-1">Media del once</div>
              <div id="lineup-avg" class="flex items-center gap-2 justify-end"></div>
            </div>
          </div>
        </div>
        <!-- Alto fijo por breakpoint, no aspect-ratio: con las filas al 20/43/66/89% las
             fichas se pisan bajo ~26rem, y un aspect-ratio + min-h infla el ancho. -->
        <div id="pitch" class="pitch relative w-full h-[26rem] sm:h-[30rem] lg:h-[34rem] rounded-xl overflow-hidden border-2 border-slate-900"></div>
        <div id="lineup-status" class="text-xs mt-2.5"></div>
      </div>

      <div class="space-y-4">
        <div class="bg-slate-800/60 border border-slate-700 rounded-2xl p-4">
          <div class="text-[10px] uppercase tracking-widest text-slate-500 font-bold mb-2">Jugador seleccionado</div>
          <div id="player-card"></div>
        </div>
        <div class="bg-slate-800/60 border border-slate-700 rounded-2xl p-4">
          <div class="flex items-center justify-between mb-2">
            <div class="text-[10px] uppercase tracking-widest text-slate-500 font-bold">Suplentes</div>
            <button id="btn-auto" class="text-[11px] tp-text hover:opacity-80 cursor-pointer font-bold">⚡ Auto</button>
          </div>
          <div id="bench" class="grid grid-cols-4 gap-1.5"></div>
        </div>
        <div class="bg-slate-800/60 border border-slate-700 rounded-2xl p-4">
          <div class="text-[10px] uppercase tracking-widest text-slate-500 font-bold mb-0.5">⚡ Energía del plantel</div>
          <p class="text-[10px] text-slate-500 mb-2">Del más cansado al más entero — para decidir a quién rotar o descansar.</p>
          <div id="energy-panel" class="space-y-0.5"></div>
        </div>
      </div>
    </div>
    <button id="btn-confirm" class="btn-primary w-full mt-4">✔ Confirmar y volver</button>
  `, "max-w-6xl");

  $("#btn-back").onclick = () => go("hub");
  $("#btn-confirm").onclick = () => go("hub");
  $("#btn-auto").onclick = () => { setLineup(autoLineup(availables(), S.formation)); renderAll(); };
  renderAll();
}

const availables = () => S.run.squad.filter(isAvailable);
const isAvailable = p => !p.suspendido && p.lesionadoPartidos === 0;

/** Barra de moral del equipo, a la izquierda de la Media del once en el bloque de la cancha. */
function moraleBadge() {
  const moral = S.run.moral ?? 50;
  const b = moraleBand(moral);
  const barColor = moral >= 61 ? "bg-emerald-500" : moral >= 41 ? "bg-amber-500" : "bg-red-500";
  const txtColor = moral >= 61 ? "text-emerald-400" : moral >= 41 ? "text-slate-300" : "text-red-400";
  return `<div title="Moral del equipo (${moral}/100)">
    <div class="text-[10px] uppercase tracking-widest text-slate-500 font-bold mb-1">${b.icon} Moral del equipo</div>
    <div class="flex items-center gap-2">
      <span class="w-20 h-1.5 bg-slate-700 rounded-full overflow-hidden inline-block"><span class="block h-full ${barColor} rounded-full" style="width:${moral}%"></span></span>
      <b class="${txtColor} text-sm">${b.label}</b>
    </div>
  </div>`;
}

/**
 * Trae el once vigente y deja los puestos asignados. Las BAJAS no se auto-reemplazan
 * (PO 22-jul): el caído queda a la vista en su slot (muted 🚑/🟥) y el DT arma el cambio
 * a mano — arrastrando un suplente sobre él o desde su ficha. La válvula automática queda
 * solo para el plantel diezmado (no llega a 6: sin decisión que tomar, evita el softlock).
 */
function refreshLineup() {
  const bajas = (S.selectedLineup || []).filter(p => !isAvailable(p));
  if (bajas.length && maxLineupSize(availables()) >= 6) {
    assignPositions(S.run.squad, S.selectedLineup, S.formation);
    return;
  }
  ({ lineup: S.selectedLineup, formationId: S.formation } = currentLineup(S.run.squad, S.selectedLineup, S.formation));
}

/** Fija un once nuevo y reasigna los puestos: TODO cambio del once pasa por acá. */
function setLineup(lineup) {
  S.selectedLineup = lineup;
  assignPositions(S.run.squad, S.selectedLineup, S.formation);
}

/** Repinta las zonas que dependen de la alineación (todas leen S.selectedLineup). */
function renderAll() {
  const available = availables();
  renderFormationPicker(available);
  mountPitch({
    pitchEl: $("#pitch"), benchEl: $("#bench"),
    team: getTeam(S.run.teamId),
    lineup: S.selectedLineup,
    bench: S.run.squad.filter(p => !S.selectedLineup.includes(p)),
    selected: selName,
    badge: p => momentoChip(p) + (p.amarillas > 0 ? " 🟨" : "") + (p.suspendido ? "🟥" : p.lesionadoPartidos > 0 ? "🚑" : ""),
    muted: p => !isAvailable(p),
    draggable: isAvailable,
    canSwap: (a, b) => swapCandidates(a).includes(b) ? { tone: "sky" } : null,
    onSwap: (a, b) => { swapPlayers(a, b); renderAll(); },
    onSelect: p => { selName = p.name; renderAll(); },
  });
  renderPlayerCard();
  renderEnergyPanel();
  renderStatus(available);
}

/**
 * Vista de energía del plantel (Sprint 3): TODAS las barras de un vistazo, ordenadas del
 * más cansado al más entero — es el insumo para decidir la rotación (jugar cansa −10 cada
 * 30', docs/CORE.md §Energía). Marca en negrita a los titulares del once actual y atenúa a
 * los no disponibles (suspendidos/lesionados). Clic en una fila abre esa ficha.
 */
function renderEnergyPanel() {
  const el = $("#energy-panel");
  if (!el) return;
  const rows = [...S.run.squad].sort((a, b) => a.energia - b.energia || a.name.localeCompare(b.name));
  el.innerHTML = rows.map(p => {
    const titular = S.selectedLineup.includes(p);
    const cls = p.energia > 65 ? "text-emerald-400" : p.energia > 35 ? "text-amber-400" : "text-red-400";
    return `<button data-name="${p.name}" title="${titular ? "Titular" : "Suplente"}${isAvailable(p) ? "" : p.suspendido ? " · suspendido" : " · lesionado"}" class="ep-row w-full flex items-center gap-1.5 px-1 py-0.5 rounded-lg text-left transition-colors cursor-pointer ${
      p.name === selName ? "bg-slate-700/60" : "hover:bg-slate-700/40"} ${isAvailable(p) ? "" : "opacity-40"}">
      ${posBadge(playedPos(p))}
      <span class="flex-1 min-w-0 truncate text-[11px] ${titular ? "font-bold" : "text-slate-400"}">${p.name}</span>
      <span class="w-10 shrink-0">${energyBar(p.energia)}</span>
      <b class="w-8 text-right text-[10px] ${cls}">${p.energia}%</b>
    </button>`;
  }).join("");
  el.querySelectorAll(".ep-row").forEach(b => b.onclick = () => { selName = b.dataset.name; renderAll(); });
}

/* ---------- Formación ---------- */

/** Selector de formación: 6 opciones con su diagrama de puntos; se desactivan las que el plantel no cubre. */
function renderFormationPicker(available) {
  const el = $("#formation-picker");
  if (!el) return;
  const curF = getFormation(S.formation);

  el.innerHTML = `
    <button id="btn-formation" class="flex items-center gap-2.5 bg-slate-900/80 border-2 tp-border rounded-lg pl-3 pr-2 py-1.5 cursor-pointer hover:brightness-125 transition-all">
      <span class="font-black tp-text tracking-wide">${curF ? curF.id : "Improvisada"}</span>
      ${curF ? `<span class="tp-text opacity-80">${formationDots(curF)}</span>` : ""}
      <span class="text-slate-500 text-[9px]">▼</span>
    </button>
    <div id="formation-list" class="hidden absolute left-0 top-full mt-1.5 z-30 w-60 bg-slate-900 border-2 border-slate-600 rounded-lg shadow-2xl overflow-hidden animate-pop">
      ${FORMATIONS.map(f => {
        const usable = canUseFormation(available, f.id);
        const isCur = f.id === S.formation;
        return `<button data-formation="${f.id}" ${usable ? "" : "disabled"}
          class="w-full flex items-center gap-2.5 px-3 py-2 text-left border-b border-slate-800 last:border-0 ${
            !usable ? "opacity-35 cursor-not-allowed"
            : isCur ? "tp-bg-soft tp-text cursor-pointer"
            : "text-slate-200 hover:bg-slate-800 cursor-pointer"}">
          <span class="font-black text-sm w-11 shrink-0">${f.id}</span>
          <span class="${isCur ? "" : "text-slate-500"}">${formationDots(f)}</span>
          <span class="text-[10px] flex-1 text-right ${usable ? "text-slate-500" : "text-red-400/80"}">${usable ? f.hint : `Faltan ${missingLines(available, f)}`}</span>
        </button>`;
      }).join("")}
    </div>`;

  const list = $("#formation-list");
  $("#btn-formation").onclick = (e) => {
    e.stopPropagation();
    list.classList.toggle("hidden");
    if (!list.classList.contains("hidden")) {
      document.addEventListener("click", () => list.classList.add("hidden"), { once: true });
    }
  };
  el.querySelectorAll("[data-formation]").forEach(b => b.onclick = () => {
    // `keep` = el once actual: cambiar de formación conserva a los que caben en ella.
    S.formation = b.dataset.formation;
    setLineup(autoLineup(available, S.formation, S.selectedLineup.slice()));
    renderAll();
  });
}

/** Qué línea(s) le impiden al plantel armar una formación — para explicar por qué está en gris. */
function missingLines(available, f) {
  return ["DEF", "MED", "DEL"].filter(pos => available.filter(p => p.pos === pos).length < f[pos.toLowerCase()]).join(" y ");
}

/** Diagrama de puntos de una formación: una columna por línea (DEF · MED · DEL). */
function formationDots(f) {
  const col = n => `<span class="flex flex-col justify-center gap-[3px]">${
    Array.from({ length: n }, () => `<i class="block w-[5px] h-[5px] bg-current rounded-[1px]"></i>`).join("")}</span>`;
  return `<span class="inline-flex items-center gap-[5px] h-4 align-middle">${col(f.def)}${col(f.med)}${col(f.del)}</span>`;
}

/* ---------- Ficha del jugador ---------- */

/** Ficha completa del jugador seleccionado: sprite, nota, stats reales del motor e info de la run. */
function renderPlayerCard() {
  const el = $("#player-card");
  if (!el) return;
  const p = S.run.squad.find(x => x.name === selName);
  if (!p) return;
  const me = getTeam(S.run.teamId);
  const keys = p.pos === "POR" ? GK_STAT_KEYS : STAT_KEYS;
  const st = stateOf(p);
  const fuera = outOfPosPenalty(p) > 0;
  const bajas = statPenalties(p);

  el.innerHTML = `
    <div class="flex items-center gap-3 mb-3">
      <div class="relative shrink-0 bg-slate-900/70 border-2 ${fuera ? "border-orange-400" : "tp-border"} rounded-lg p-1">
        ${spriteSvg(p, me, "w-16 h-20")}
        <span class="absolute -top-2 -left-2 text-[9px] font-black text-slate-200 bg-slate-800 border border-slate-600 rounded px-1">${p.num || "–"}</span>
      </div>
      <div class="min-w-0">
        <div class="font-black text-lg leading-tight truncate">${p.name}</div>
        <div class="text-xs text-slate-400 mb-1">${posBadge(p.pos)} <span class="ml-1">${POS_NAME[p.pos]}</span></div>
        <div class="flex items-baseline gap-1.5">
          <span class="text-3xl font-black leading-none ${fuera ? "text-orange-400" : "text-amber-300"}">${playerOverall(p)}</span>
          ${fuera ? `<span class="text-xs text-slate-500 line-through">${naturalOverall(p)}</span>` : ""}
          <span class="text-[9px] uppercase tracking-wider text-slate-500 font-bold">Media</span>
        </div>
        ${starsHtml(playerStars(p), "text-xs")}
      </div>
    </div>
    ${fuera ? outOfPosNote(p, bajas) : ""}

    <div class="text-[10px] uppercase tracking-wider text-slate-500 font-bold mb-1.5">Estadísticas</div>
    <div class="space-y-1 mb-3">${keys.map(k => statRow(p, k)).join("")}</div>

    <div class="text-[10px] uppercase tracking-wider text-slate-500 font-bold mb-1.5">Información</div>
    <div class="space-y-1 mb-3 text-xs">
      <div class="flex items-center justify-between gap-2">
        <span class="text-slate-400">Energía</span>
        <span class="flex items-center gap-1.5"><span class="w-16">${energyBar(p.energia)}</span><b class="w-8 text-right ${p.energia > 65 ? "text-emerald-400" : p.energia > 35 ? "text-amber-400" : "text-red-400"}">${p.energia}%</b></span>
      </div>
      <div class="flex items-center justify-between gap-2" title="Forma del jugador (Normal es lo neutro): sube y baja con su rendimiento en los partidos y afecta sus stats">
        <span class="text-slate-400">Momento</span>
        <span class="flex items-center gap-1.5"><b class="${momentoPct(p) > 0 ? "text-emerald-400" : momentoPct(p) < 0 ? "text-sky-400" : "text-slate-300"}">${momentoLabel(p)}</b>${momentoChip(p)}${momentoPct(p) !== 0 ? `<span class="font-bold text-[11px] ${momentoPct(p) > 0 ? "text-emerald-400" : "text-sky-400"}">(${momentoPct(p) > 0 ? "+" : ""}${momentoPct(p)}% stats)</span>` : ""}</span>
      </div>
      <div class="flex items-center justify-between gap-2"><span class="text-slate-400">Estado</span><span class="${st.cls} font-semibold text-right">${st.txt}</span></div>
      <div class="flex items-center justify-between gap-2"><span class="text-slate-400">Partidos</span><b>${p.partidos}</b></div>
      <div class="flex items-center justify-between gap-2"><span class="text-slate-400">Goles</span><b>${p.goles}</b></div>
    </div>

    ${swapCandidates(p).length
      ? `<button id="btn-swap" class="w-full text-sm font-bold py-2 rounded-lg tp-gradient cursor-pointer hover:brightness-110 transition-all">⇄ Sustituir jugador</button>`
      : `<div class="text-[11px] text-slate-500 text-center py-2 border border-slate-700 border-dashed rounded-lg">No disponible para este partido</div>`}
    <p class="text-[10px] text-slate-500 text-center mt-2">Arrastra las fichas para moverlas o cambiarlas.</p>`;

  const btn = $("#btn-swap");
  if (btn) btn.onclick = () => openSwapModal(p);
}

/** Explica el castigo por jugar fuera de puesto: cuánto pierde y por qué. */
function outOfPosNote(p, bajas) {
  // Distancia real en la línea POR-DEF-MED-DEL: la baja mostrada puede venir
  // levemente escalada por el Momento, así que no sirve para derivar los pasos.
  const pasos = posDistance(p.pos, playedPos(p));
  return `<div class="mb-3 p-2 rounded-lg border border-orange-400/60 bg-orange-400/10">
    <div class="text-[11px] font-black text-orange-300 mb-1">❗ Jugando de ${POS_NAME[playedPos(p)].toLowerCase()}</div>
    <p class="text-[10px] text-slate-300 leading-snug">No es su puesto: ${POS_NAME[p.pos].toLowerCase()} está a ${pasos} ${pasos === 1 ? "línea" : "líneas"} de distancia.
    Pierde <b class="text-orange-300">${Math.abs(bajas[0] ? bajas[0].delta : 0)}</b> en cada stat técnica y su media cae de
    <b>${naturalOverall(p)}</b> a <b class="text-orange-300">${playerOverall(p)}</b> mientras siga ahí.</p>
  </div>`;
}

/**
 * Fila de una stat: la BARRA muestra el valor BASE (sin el % del Momento, con los colores
 * de siempre; el entrenamiento/canje suben esa base), y aparte el boost/nerf que aporta el
 * Momento — dorado si suma, celeste si resta. El castigo por fuera de puesto ya está en la
 * base (la nota de "jugando de …" lo explica arriba).
 */
function statRow(p, key) {
  const base = baseStatAt(p, key);
  const mDelta = effectiveStat(p, key) - base; // lo que suma o resta el Momento
  const color = base >= 75 ? "bg-emerald-500" : base >= 55 ? "bg-amber-500" : "bg-red-500";
  const txt = base >= 75 ? "text-emerald-400" : base >= 55 ? "text-amber-400" : "text-red-400";
  const delta = mDelta !== 0
    ? `<span class="w-8 text-right font-black text-[11px] ${mDelta > 0 ? "text-amber-300" : "text-sky-400"}" title="Efecto del Momento">${mDelta > 0 ? "+" : ""}${mDelta}</span>`
    : `<span class="w-8"></span>`;
  return `<div class="flex items-center gap-2 text-xs">
    <span class="text-slate-400 w-20 shrink-0">${STAT_NAME[key]}</span>
    <span class="flex-1 h-1.5 bg-slate-700 rounded-full overflow-hidden"><span class="block h-full ${color} rounded-full" style="width:${base}%"></span></span>
    <b class="w-6 text-right ${txt}">${base}</b>
    ${delta}
  </div>`;
}

/* ---------- Estado ---------- */

/** Línea de validación: formación lista, avisos de fuera de puesto, o el motivo de que no lo esté. */
function renderStatus(available) {
  const st = $("#lineup-status");
  const avg = $("#lineup-avg");
  if (avg) {
    const r = lineupRating(S.selectedLineup);
    avg.innerHTML = `<span class="w-20 h-1.5 bg-slate-700 rounded-full overflow-hidden inline-block"><span class="block h-full tp-gradient rounded-full" style="width:${r}%"></span></span>
      <b class="text-amber-300 font-black">${r}</b>`;
  }
  if (!st) return;
  const v = validateLineup(available, S.selectedLineup);
  const f = getFormation(S.formation);
  const fuera = S.selectedLineup.filter(p => outOfPosPenalty(p) > 0);
  // Baja en el once (validateLineup no mira disponibilidad): la instrucción manda, y si el
  // plantel ya no cubre la formación actual, se LEE que hay que cambiarla (PO 22-jul).
  const bajas = S.selectedLineup.filter(p => !isAvailable(p));
  if (bajas.length) {
    const sinFormacion = !canUseFormation(available, S.formation);
    st.innerHTML = `<span class="text-red-400">🚑 Baja en el once: ${bajas.map(p => p.name).join(" y ")}. Arrastra un suplente sobre su ficha (o entra a su ficha) para reemplazarlo.</span>${
      sinFormacion ? `<span class="text-orange-400"> · ❗ Ya no te quedan jugadores para sostener la ${S.formation}: elige otra formación en el selector.</span>` : ""}`;
    return;
  }
  if (!v.ok) { st.innerHTML = `<span class="text-amber-400">⚠️ ${v.msg}</span>`; return; }
  st.innerHTML = `<span class="tp-text font-semibold">✅ ${f ? `Formación ${f.id} · ${f.hint}` : "Alineación improvisada"}</span>
    ${fuera.length
      ? `<span class="text-orange-400"> · ❗ ${fuera.length} fuera de puesto: ${fuera.map(p => `${p.name} de ${POS_NAME[playedPos(p)].toLowerCase()}`).join(", ")}</span>`
      : `<span class="text-slate-500"> · Arrastra una ficha sobre otra para intercambiarlas.</span>`}`;
}

/** Estado del jugador para este partido (mismo criterio que usa el motor para dejarlo fuera). */
function stateOf(p) {
  if (p.suspendido) return { icon: "🟥", txt: "🟥 Suspendido", cls: "text-red-400" };
  if (p.lesionadoPartidos > 0) return { icon: "🚑", txt: `🚑 Lesionado (${p.lesionadoPartidos})`, cls: "text-red-400" };
  if (p.amarillas > 0) return { icon: "🟨", txt: "🟨 Apercibido", cls: "text-yellow-400" };
  return { icon: "", txt: "✅ Disponible", cls: "text-emerald-400" };
}

/* ---------- Mover jugadores ---------- */

/** Índice del jugador en el once, o -1 si está en el banco. */
const idxOf = (p) => S.selectedLineup.indexOf(p);
/** Puesto que juega el slot i (el del jugador si el once es improvisado y no hay formación). */
const slotPos = (i) => formationSlots(S.formation)[i] || S.selectedLineup[i].pos;

/**
 * Con quién puede intercambiarse este jugador. Cualquier puesto vale (el castigo por
 * jugar fuera de él ya lo cobra el motor); el único límite es el arco, que solo pueden
 * ocupar los arqueros porque sus stats son otro juego (game/lineup.canPlayAt).
 */
function swapCandidates(p) {
  const i = idxOf(p);
  // El titular DE BAJA (🚑/🟥) no juega ni se mueve, pero SÍ se reemplaza: puede entrar en
  // su slot cualquier disponible del banco (PO 22-jul: el reemplazo es manual, acá).
  if (!isAvailable(p)) {
    if (i < 0) return [];
    return S.run.squad.filter(q => q !== p && idxOf(q) < 0 && isAvailable(q) && canPlayAt(q, slotPos(i)));
  }
  if (i >= 0) {
    return S.run.squad.filter(q => {
      if (q === p || !isAvailable(q)) return false;
      const j = idxOf(q);
      return j >= 0 ? canPlayAt(p, slotPos(j)) && canPlayAt(q, slotPos(i))
                    : canPlayAt(q, slotPos(i));
    });
  }
  return S.selectedLineup.filter(q => canPlayAt(p, slotPos(idxOf(q))));
}

/**
 * Intercambia dos jugadores respetando los slots: si ambos son titulares permutan sus
 * puestos; si uno viene del banco, ocupa el slot del que sale.
 */
function swapPlayers(a, b) {
  const i = idxOf(a), j = idxOf(b);
  if (i >= 0 && j >= 0) { [S.selectedLineup[i], S.selectedLineup[j]] = [b, a]; }
  else if (i >= 0) S.selectedLineup[i] = b;
  else if (j >= 0) S.selectedLineup[j] = a;
  else return;
  assignPositions(S.run.squad, S.selectedLineup, S.formation);
  const movido = idxOf(a) >= 0 ? a : b;
  selName = movido.name;
  const aviso = outOfPosPenalty(movido) > 0 ? ` — ❗ ${movido.name} juega de ${POS_NAME[playedPos(movido)].toLowerCase()}` : "";
  toast(`${a.name} ⇄ ${b.name}${aviso}`);
}

/**
 * Lista de intercambios en modal: misma permuta que el arrastre, pero explícita — es el
 * camino accesible y el único que funciona en móvil (el drag & drop HTML5 no existe en táctil).
 */
function openSwapModal(p) {
  const me = getTeam(S.run.teamId);
  const i = idxOf(p);
  const cands = swapCandidates(p);
  const dest = (q) => i >= 0 ? slotPos(i) : slotPos(idxOf(q)); // puesto que ocuparía el que entra
  const wrap = modal(`
    <h3 class="font-black text-lg mb-1">⇄ Sustituir a ${p.name}</h3>
    <p class="text-xs text-slate-400 mb-4">Puede entrar cualquiera: si no es su puesto igual juega, pero con las stats castigadas.</p>
    <div class="space-y-1.5">
      ${cands.map(q => {
        const puesto = dest(q);
        const fuera = puesto !== q.pos;
        return `<button data-swap="${q.name}" class="w-full flex items-center gap-2 px-3 py-2 rounded-xl border ${fuera ? "border-orange-400/50" : "border-slate-600"} hover:border-[var(--team-primary)] hover:bg-slate-700/40 cursor-pointer text-left transition-all">
          ${spriteSvg(q, me, "w-7 h-9")}
          ${numTag(q)} ${posBadge(q.pos)}
          <span class="flex-1 min-w-0">
            <b class="text-sm truncate block">${q.name}</b>
            <span class="text-[10px] ${fuera ? "text-orange-400" : "text-slate-500"}">${idxOf(q) >= 0 ? "En cancha" : "Suplente"} · ${fuera ? `❗ jugaría de ${POS_NAME[puesto].toLowerCase()}` : "en su puesto"}</span>
          </span>
          <span class="text-right">
            <b class="${fuera ? "text-orange-400" : "text-amber-300"} text-sm block">${overallAt(q, puesto)}</b>
            ${fuera ? `<span class="text-[9px] text-slate-500 line-through">${naturalOverall(q)}</span>` : ""}
          </span>
        </button>`;
      }).join("")}
    </div>
    <button id="btn-cancel-swap" class="w-full mt-4 text-sm text-slate-400 hover:text-white py-2 cursor-pointer">Cancelar</button>
  `);
  wrap.querySelectorAll("[data-swap]").forEach(b => b.onclick = () => {
    swapPlayers(p, S.run.squad.find(x => x.name === b.dataset.swap));
    closeModal();
    renderAll();
  });
  wrap.querySelector("#btn-cancel-swap").onclick = closeModal;
}

register("squad", renderSquadScreen);
