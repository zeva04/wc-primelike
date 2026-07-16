/* ============================================================
   ui/screens/squad — Gestión de Plantilla: el once sobre la
   cancha, la formación y la ficha del jugador.

   Las reglas de alineación viven en game/lineup.js y el castigo
   por jugar fuera de puesto en game/ratings.js: esta pantalla
   solo pinta y captura clics/arrastres. Las coordenadas de la
   cancha SÍ son suyas: son presentación, no regla.

   MODELO: S.selectedLineup va ORDENADO por los slots de
   S.formation — el titular del índice i juega formationSlots(i).
   Mover a alguien = mover su índice. game/lineup.assignPositions
   deriva de ahí el puesto de cada uno (y con él, el castigo).
   ============================================================ */
import { getTeam } from "../../data/teams-repo.js";
import {
  playerOverall, naturalOverall, overallAt, playerStars, teamRating, teamStars, lineupRating,
  STAT_KEYS, GK_STAT_KEYS, playedPos, outOfPosPenalty, statPenalties,
} from "../../game/ratings.js";
import {
  currentLineup, autoLineup, validateLineup, assignPositions, canPlayAt,
  formationSlots, FORMATIONS, getFormation, canUseFormation,
} from "../../game/lineup.js";
import { S } from "../session.js";
import { register, go } from "../nav.js";
import { screenShell, $, flagImg, starsHtml, posBadge, numTag, energyBar, toast, modal, closeModal } from "../components.js";
import { spriteSvg } from "../sprites.js";

const POS_NAME = { POR: "Arquero", DEF: "Defensa", MED: "Mediocampista", DEL: "Delantero" };
const STAT_NAME = {
  tiro: "Tiro", defensa: "Defensa", cabezazo: "Cabezazo", pase: "Pase", aura: "Aura",
  atajadas: "Atajadas", reflejos: "Reflejos", salidas: "Salidas",
};
// Filas de la cancha (% desde arriba): el arquero abajo, los delanteros arriba.
// Equiespaciadas a 23%: menos que eso y las fichas se pisan en pantallas chicas.
const ROW_Y = { DEL: 20, MED: 43, DEF: 66, POR: 89 };

let selName = null; // jugador con la ficha abierta (solo estado visual de esta pantalla)
let dragging = null; // origen del arrastre en curso: {kind:"pitch",idx} | {kind:"bench",name}

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
      <div class="text-sm">${starsHtml(teamStars(me))} <span class="text-amber-300 font-black ml-1">Media ${teamRating(me)}</span></div>
    </div>

    <div class="grid lg:grid-cols-[minmax(0,1fr)_20rem] gap-4 items-start">
      <div class="min-w-0 bg-slate-800/60 border border-slate-700 rounded-2xl p-3 sm:p-4">
        <div class="flex items-end justify-between gap-3 mb-3 flex-wrap">
          <div>
            <div class="text-[10px] uppercase tracking-widest text-slate-500 font-bold mb-1">Formación actual</div>
            <div id="formation-picker" class="relative"></div>
          </div>
          <div class="text-right">
            <div class="text-[10px] uppercase tracking-widest text-slate-500 font-bold mb-1">Media del once</div>
            <div id="lineup-avg" class="flex items-center gap-2 justify-end"></div>
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

/** Trae el once vigente del motor (lo rearma si hay bajas nuevas) y deja los puestos asignados. */
function refreshLineup() {
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
  renderPitch();
  renderPlayerCard();
  renderBench();
  renderStatus(available);
}

/* ---------- Formación ---------- */

/** Selector de formación: 6 opciones con su diagrama de puntos; se desactivan las que el plantel no cubre. */
function renderFormationPicker(available) {
  const el = $("#formation-picker");
  if (!el) return;
  const cur = S.formation;
  const curF = getFormation(cur);

  el.innerHTML = `
    <button id="btn-formation" class="flex items-center gap-2.5 bg-slate-900/80 border-2 tp-border rounded-lg pl-3 pr-2 py-1.5 cursor-pointer hover:brightness-125 transition-all">
      <span class="font-black tp-text tracking-wide">${curF ? curF.id : "Improvisada"}</span>
      ${curF ? `<span class="tp-text opacity-80">${formationDots(curF)}</span>` : ""}
      <span class="text-slate-500 text-[9px]">▼</span>
    </button>
    <div id="formation-list" class="hidden absolute left-0 top-full mt-1.5 z-30 w-60 bg-slate-900 border-2 border-slate-600 rounded-lg shadow-2xl overflow-hidden animate-pop">
      ${FORMATIONS.map(f => {
        const usable = canUseFormation(available, f.id);
        const isCur = f.id === cur;
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

/* ---------- Cancha ---------- */

/** Reparte n fichas a lo ancho (%): 1 al centro, 2 abiertos, 3 en línea. */
function spreadX(n) {
  if (n <= 1) return [50];
  const gap = n === 2 ? 36 : n === 3 ? 30 : 24;
  return Array.from({ length: n }, (_, i) => 50 + (i - (n - 1) / 2) * gap);
}

/** Puesto que juega el slot i (el del jugador si el once es improvisado y no hay formación). */
const slotPos = (i) => formationSlots(S.formation)[i] || S.selectedLineup[i].pos;

/** Pinta el once sobre el césped, cada uno en la fila del PUESTO QUE JUEGA (no el natural). */
function renderPitch() {
  const el = $("#pitch");
  if (!el) return;
  const me = getTeam(S.run.teamId);
  const rows = { POR: [], DEF: [], MED: [], DEL: [] };
  S.selectedLineup.forEach((p, i) => rows[slotPos(i)].push(i));
  const tokens = [];
  for (const pos of ["DEL", "MED", "DEF", "POR"]) {
    const xs = spreadX(rows[pos].length);
    rows[pos].forEach((idx, k) => tokens.push(pitchToken(S.selectedLineup[idx], idx, me, xs[k], ROW_Y[pos])));
  }
  el.innerHTML = pitchLines() + tokens.join("");
  bindTokens(el);
}

/** Líneas de la cancha: borde, medio campo, círculo central y las dos áreas. */
function pitchLines() {
  return `
    <div class="pitch-line inset-2 border-2"></div>
    <div class="pitch-line left-2 right-2 top-1/2 border-t-2"></div>
    <div class="pitch-line left-1/2 top-1/2 w-20 h-20 -translate-x-1/2 -translate-y-1/2 border-2 rounded-full"></div>
    <div class="pitch-line left-1/2 -translate-x-1/2 top-2 w-2/5 h-[13%] border-2 border-t-0"></div>
    <div class="pitch-line left-1/2 -translate-x-1/2 bottom-2 w-2/5 h-[13%] border-2 border-b-0"></div>`;
}

/** Ficha de un titular: sprite + dorsal + placa con nombre y nota. Arrastrable. */
function pitchToken(p, idx, team, x, y) {
  const sel = p.name === selName;
  const fuera = outOfPosPenalty(p) > 0;
  return `<button data-idx="${idx}" data-name="${p.name}" draggable="true"
    title="${p.name}${fuera ? ` — ¡de ${POS_NAME[playedPos(p)].toLowerCase()}! No es su puesto` : ""}"
    class="absolute -translate-x-1/2 -translate-y-1/2 flex flex-col items-center cursor-grab active:cursor-grabbing group z-10"
    style="left:${x}%;top:${y}%">
    <div class="relative pointer-events-none">
      <div class="absolute left-1/2 -translate-x-1/2 bottom-0 w-8 h-1.5 bg-black/40 rounded-[50%]"></div>
      <div class="relative rounded border-2 px-0.5 transition-all group-hover:brightness-125 ${
        sel ? "tp-border tp-bg-soft tp-ring" : fuera ? "border-orange-400/70" : "border-transparent"}">
        ${spriteSvg(p, team, "w-10 h-12 sm:w-12 sm:h-14")}
      </div>
      <span class="absolute -top-1.5 -left-2.5 text-[9px] font-black text-slate-200 bg-slate-900/90 border border-slate-600 rounded px-1">${p.num || "–"}</span>
      ${fuera ? `<span class="absolute -top-2 -right-2 text-[11px] font-black text-slate-900 bg-orange-400 border border-orange-200 rounded-full w-4 h-4 flex items-center justify-center leading-none">!</span>` : ""}
    </div>
    <span class="mt-0.5 px-1.5 py-0.5 rounded bg-slate-900/85 border text-center leading-tight pointer-events-none ${sel ? "tp-border" : fuera ? "border-orange-400/70" : "border-slate-700"}">
      <span class="block text-[10px] font-bold text-slate-100 truncate max-w-[4.5rem] sm:max-w-[6.5rem]">${p.name}${p.amarillas > 0 ? " 🟨" : ""}</span>
      <b class="block text-[11px] ${fuera ? "text-orange-400" : "text-amber-300"}">${playerOverall(p)}</b>
    </span>
  </button>`;
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
  const notaReal = naturalOverall(p); // la que tendría en su puesto

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
          ${fuera ? `<span class="text-xs text-slate-500 line-through">${notaReal}</span>` : ""}
          <span class="text-[9px] uppercase tracking-wider text-slate-500 font-bold">Media</span>
        </div>
        ${starsHtml(playerStars(p), "text-xs")}
      </div>
    </div>

    ${fuera ? `<div class="mb-3 p-2 rounded-lg border border-orange-400/60 bg-orange-400/10">
      <div class="text-[11px] font-black text-orange-300 mb-1">❗ Jugando de ${POS_NAME[playedPos(p)].toLowerCase()}</div>
      <p class="text-[10px] text-slate-300 leading-snug">No es su puesto: ${POS_NAME[p.pos].toLowerCase()} está a ${bajas[0] ? Math.abs(bajas[0].delta) / 6 : 0} ${(bajas[0] && Math.abs(bajas[0].delta) / 6) === 1 ? "línea" : "líneas"} de distancia.
      Pierde <b class="text-orange-300">${Math.abs(bajas[0] ? bajas[0].delta : 0)}</b> en cada stat técnica y su media cae de
      <b>${notaReal}</b> a <b class="text-orange-300">${playerOverall(p)}</b> mientras siga ahí.</p>
    </div>` : ""}

    <div class="text-[10px] uppercase tracking-wider text-slate-500 font-bold mb-1.5">Estadísticas</div>
    <div class="space-y-1 mb-3">${keys.map(k => statRow(p, k, bajas.find(b => b.key === k))).join("")}</div>

    <div class="text-[10px] uppercase tracking-wider text-slate-500 font-bold mb-1.5">Información</div>
    <div class="space-y-1 mb-3 text-xs">
      <div class="flex items-center justify-between gap-2">
        <span class="text-slate-400">Energía</span>
        <span class="flex items-center gap-1.5"><span class="w-16">${energyBar(p.energia)}</span><b class="w-8 text-right ${p.energia > 65 ? "text-emerald-400" : p.energia > 35 ? "text-amber-400" : "text-red-400"}">${p.energia}%</b></span>
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

/** Fila de una stat: si el jugador está fuera de puesto, muestra base → castigada. */
function statRow(p, key, baja) {
  const v = baja ? baja.real : p.stats[key];
  const color = v >= 75 ? "bg-emerald-500" : v >= 55 ? "bg-amber-500" : "bg-red-500";
  const txt = v >= 75 ? "text-emerald-400" : v >= 55 ? "text-amber-400" : "text-red-400";
  return `<div class="flex items-center gap-2 text-xs">
    <span class="text-slate-400 w-20 shrink-0">${STAT_NAME[key]}</span>
    <span class="flex-1 h-1.5 bg-slate-700 rounded-full overflow-hidden"><span class="block h-full ${color} rounded-full" style="width:${v}%"></span></span>
    ${baja ? `<span class="text-[9px] text-slate-500 line-through w-5 text-right">${baja.base}</span>
              <b class="w-6 text-right text-orange-400">${v}</b>`
            : `<b class="w-6 text-right ${txt}">${v}</b><span class="w-5"></span>`}
  </div>`;
}

/* ---------- Suplentes ---------- */

/** Los 4 del banco: todo el que no es titular (lesionados y suspendidos incluidos, en gris). */
function renderBench() {
  const el = $("#bench");
  if (!el) return;
  const me = getTeam(S.run.teamId);
  const bench = S.run.squad.filter(p => !S.selectedLineup.includes(p));
  el.innerHTML = bench.map(p => {
    const sel = p.name === selName;
    const out = !isAvailable(p);
    const st = stateOf(p);
    return `<button data-name="${p.name}" ${out ? "" : 'draggable="true"'} title="${p.name}${out ? ` · ${st.txt}` : ""}"
      class="relative flex flex-col items-center gap-0.5 p-1 pt-2 rounded-lg border-2 transition-all ${out ? "opacity-40 cursor-not-allowed" : "cursor-grab active:cursor-grabbing"} ${
        sel ? "tp-border tp-bg-soft" : "border-slate-700 bg-slate-900/50 hover:border-slate-500"}">
      <span class="absolute top-0.5 left-0.5 text-[8px] font-black text-slate-300 bg-slate-800/90 rounded px-0.5 pointer-events-none">${p.num || "–"}</span>
      ${out ? `<span class="absolute top-0.5 right-0.5 text-[9px] pointer-events-none">${st.icon}</span>` : ""}
      <span class="relative pointer-events-none">${spriteSvg(p, me, "w-9 h-11")}</span>
      <span class="scale-[0.82] origin-center -my-0.5 pointer-events-none">${posBadge(p.pos)}</span>
      <span class="text-[9px] font-medium text-slate-300 truncate max-w-full leading-tight pointer-events-none">${p.name}</span>
      <b class="text-[11px] text-amber-300 leading-none pointer-events-none">${playerOverall(p)}</b>
    </button>`;
  }).join("");
  bindTokens(el);
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
  if (!v.ok) { st.innerHTML = `<span class="text-amber-400">⚠️ ${v.msg}</span>`; return; }
  st.innerHTML = `<span class="tp-text font-semibold">✅ ${f ? `Formación ${f.id} · ${f.hint}` : "Alineación improvisada"}</span>
    ${fuera.length
      ? `<span class="text-orange-400"> · ❗ ${fuera.length} fuera de puesto: ${fuera.map(p => `${p.name} de ${POS_NAME[playedPos(p)].toLowerCase()}`).join(", ")}</span>`
      : `<span class="text-slate-500"> · Arrastra una ficha sobre otra para intercambiarlas.</span>`}`;
}

const isAvailable = p => !p.suspendido && p.lesionadoPartidos === 0;

/** Estado del jugador para este partido (mismo criterio que usa el motor para dejarlo fuera). */
function stateOf(p) {
  if (p.suspendido) return { icon: "🟥", txt: "🟥 Suspendido", cls: "text-red-400" };
  if (p.lesionadoPartidos > 0) return { icon: "🚑", txt: `🚑 Lesionado (${p.lesionadoPartidos})`, cls: "text-red-400" };
  if (p.amarillas > 0) return { icon: "🟨", txt: "🟨 Apercibido", cls: "text-yellow-400" };
  return { icon: "", txt: "✅ Disponible", cls: "text-emerald-400" };
}

/* ---------- Mover jugadores: arrastre y permuta ---------- */

/** Índice del jugador en el once, o -1 si está en el banco. */
const idxOf = (p) => S.selectedLineup.indexOf(p);

/**
 * Con quién puede intercambiarse este jugador. Cualquier puesto vale (el castigo por
 * jugar fuera de él ya lo cobra el motor); el único límite es el arco, que solo pueden
 * ocupar los arqueros porque sus stats son otro juego (game/lineup.canPlayAt).
 */
function swapCandidates(p) {
  if (!isAvailable(p)) return [];
  const i = idxOf(p);
  if (i >= 0) {
    // Titular: puede permutar con otro titular o con cualquier suplente disponible.
    return S.run.squad.filter(q => {
      if (q === p || !isAvailable(q)) return false;
      const j = idxOf(q);
      return j >= 0 ? canPlayAt(p, slotPos(j)) && canPlayAt(q, slotPos(i))
                    : canPlayAt(q, slotPos(i));
    });
  }
  // Suplente: puede entrar por cualquier titular cuyo puesto sepa ocupar.
  return S.selectedLineup.filter(q => canPlayAt(p, slotPos(idxOf(q))));
}

/** ¿Este destino acepta la ficha que se está arrastrando ahora? (pinta el resalte azul). */
function isDropTarget(dest) {
  if (!dragging) return false;
  const from = entityPlayer(dragging), to = entityPlayer(dest);
  if (!from || !to || from === to) return false;
  return swapCandidates(from).includes(to);
}

/** El jugador detrás de un origen/destino de arrastre. */
function entityPlayer(e) {
  return e.kind === "pitch" ? S.selectedLineup[e.idx] : S.run.squad.find(p => p.name === e.name);
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
  selName = (idxOf(a) >= 0 ? a : b).name;
  const movido = idxOf(a) >= 0 ? a : b;
  const aviso = outOfPosPenalty(movido) > 0 ? ` — ❗ ${movido.name} juega de ${POS_NAME[playedPos(movido)].toLowerCase()}` : "";
  toast(`${a.name} ⇄ ${b.name}${aviso}`);
}

/** El origen/destino de arrastre que representa un nodo de ficha. */
const destOf = (node) => node.dataset.idx !== undefined
  ? { kind: "pitch", idx: +node.dataset.idx }
  : { kind: "bench", name: node.dataset.name };

/**
 * Enciende (o apaga) el resalte de los destinos válidos SIN repintar: durante un arrastre
 * no se puede tocar el innerHTML, porque destruir el nodo que el mouse está arrastrando
 * cancela el drag. Por eso el resalte va por clases sobre los nodos que ya existen.
 */
function markDropTargets(on) {
  document.querySelectorAll("#pitch [data-name], #bench [data-name]").forEach(n => {
    const ok = on && isDropTarget(destOf(n));
    n.classList.toggle("ring-2", ok);
    n.classList.toggle("ring-sky-400", ok);
    n.classList.toggle("ring-offset-1", ok);
    n.classList.toggle("ring-offset-slate-900", ok);
  });
}

/** Engancha clic (ver ficha) y arrastre (mover/permutar) en las fichas de un contenedor. */
function bindTokens(el) {
  el.querySelectorAll("[data-name]").forEach(node => {
    const dest = destOf(node);

    node.onclick = () => { selName = node.dataset.name; renderAll(); };

    node.addEventListener("dragstart", (e) => {
      const p = entityPlayer(dest);
      if (!isAvailable(p)) return e.preventDefault();   // lesionado/suspendido no se arrastra
      dragging = dest;
      e.dataTransfer.effectAllowed = "move";
      e.dataTransfer.setData("text/plain", p.name);     // Firefox exige carga útil
      // Tras el tick en que el navegador captura la imagen del arrastre.
      setTimeout(() => markDropTargets(true), 0);
    });
    node.addEventListener("dragend", () => { dragging = null; markDropTargets(false); });
    node.addEventListener("dragover", (e) => { if (isDropTarget(dest)) { e.preventDefault(); e.dataTransfer.dropEffect = "move"; } });
    node.addEventListener("drop", (e) => {
      e.preventDefault();
      if (!isDropTarget(dest)) return;
      const from = entityPlayer(dragging), to = entityPlayer(dest);
      dragging = null;
      markDropTargets(false);
      swapPlayers(from, to);
      renderAll();
    });
  });
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
        const notaAhi = overallAt(q, puesto);
        const notaSuya = naturalOverall(q);
        const fuera = puesto !== q.pos;
        return `<button data-swap="${q.name}" class="w-full flex items-center gap-2 px-3 py-2 rounded-xl border ${fuera ? "border-orange-400/50" : "border-slate-600"} hover:border-[var(--team-primary)] hover:bg-slate-700/40 cursor-pointer text-left transition-all">
          ${spriteSvg(q, me, "w-7 h-9")}
          ${numTag(q)} ${posBadge(q.pos)}
          <span class="flex-1 min-w-0">
            <b class="text-sm truncate block">${q.name}</b>
            <span class="text-[10px] ${fuera ? "text-orange-400" : "text-slate-500"}">${idxOf(q) >= 0 ? "En cancha" : "Suplente"} · ${fuera ? `❗ jugaría de ${POS_NAME[puesto].toLowerCase()}` : "en su puesto"}</span>
          </span>
          <span class="text-right">
            <b class="${fuera ? "text-orange-400" : "text-amber-300"} text-sm block">${notaAhi}</b>
            ${fuera ? `<span class="text-[9px] text-slate-500 line-through">${notaSuya}</span>` : ""}
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
