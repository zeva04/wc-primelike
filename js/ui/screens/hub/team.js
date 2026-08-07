/* ============================================================
   ui/screens/hub/team — EL ESTADO DE MI EQUIPO:
   la card de la izquierda (moral, energía, ritmo, la cancha, los avisos),
   la identidad, los efectos acumulados con su canje, y la altura del
   bloque — que se elige acá o leyendo el informe del rival.
   ============================================================ */
import { getFormation } from "../../../game/lineup.js";
import { canjeableBuffs, canjeBuff } from "../../../game/day-action.js";
import { CANJE_THRESHOLD, CANJE_PERMANENT, STAT_LABELS } from "../../../content/daily/day-actions.js";
import { getPhilosophy, FILO_LEVELS, FILO_ETAPAS } from "../../../content/identity/philosophies.js";
import { filoPoints, filoLevel, filoEtapa } from "../../../game/philosophy.js";
import { dtProgress, DT_MAX } from "../../../game/coach.js";
import { moraleBand } from "../../../game/morale.js";
import { S } from "../../session.js";
import { modal, closeModal, toast, energyCls, oxidCls } from "../../components.js";
import { oxidState } from "../../../game/oxidation.js";
import { HEIGHTS, HEIGHT_DEFAULT, heightOf } from "../../../game/match/field.js";
import { renderHub } from "./index.js";

/** Chips con los efectos acumulados para el próximo partido; "" si no hay ninguno. */
export function buffChips() {
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


/**
 * Card de IDENTIDAD del estado del equipo: filosofía, nivel y la
 * barra de progreso al próximo umbral. Clic → pantalla de identidad. Compacta a
 * propósito: el despliegue completo (aristas, rasgo, counters) vive en la pantalla.
 */
export function filoCard() {
  const run = S.run;
  const f = getPhilosophy(run.filoId);
  if (!f) return "";
  const pts = filoPoints(run);
  const lvl = filoLevel(run);           // nivel 0..9 de la identidad que se juega
  const etapa = filoEtapa(run);         // etiqueta visible: la etapa de siempre
  const nivel = FILO_LEVELS[lvl];
  const next = FILO_LEVELS[lvl + 1] || null;
  const pct = next ? Math.min(100, (100 * (pts - nivel.min)) / (next.min - nivel.min)) : 100;
  // La segunda capa: el Director Técnico y su barra propia.
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
export function stateChip(icon, label, value, cls) {
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
export function teamStateCard(v, discipline, fueraDePuesto, forma) {
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
  // Plantel oxidado: el aviso explica el CASTIGO y las dos salidas (riesgo declarado
  // del arco: que el jugador nuevo entienda por qué rinde menos).
  if (ox.oxidado) avisos.push(`<div class="${oxidCls(ox.racha)}" title="Cada día de preparación sin Entrenar ni Sesión Táctica suma; al 3º el plantel pierde filo">⚙️ Plantel oxidado: ${ox.racha} días sin entrenar — rinde un ${Math.round((1 - ox.mult) * 100)}% menos hasta entrenar (o jugar: el partido devuelve el ritmo)</div>`);
  // Clima de vestuario: la Moral modula la frecuencia de conflictos de la ventana.
  if (mb.id === "suelo" || mb.id === "baja") avisos.push(`<div class="text-orange-400" title="La moral baja convulsiona el vestuario: más conflictos entre partidos">🎭 Vestuario caldeado: se vienen más conflictos</div>`);
  else if (mb.id === "nubes") avisos.push(`<div class="text-emerald-400" title="La moral alta serena el vestuario: menos conflictos entre partidos">🎭 Vestuario en paz: semana tranquila por delante</div>`);
  // min-w-0: sin él la card hereda el piso `min-width:auto` de item de grilla y NO puede
  // achicarse por debajo de su contenido mínimo. En escritorio no se nota (la columna mide
  // 20rem), pero en una sola columna a 375px la card se plantaba en 379 y empujaba la
  // página a 394 con scroll horizontal (medido con tools/mobile.html,). Sus
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

