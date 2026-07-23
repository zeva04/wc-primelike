/* ============================================================
   ui/screens/philosophy — la pantalla de IDENTIDAD (F3 "La
   vitrina" + arco de Rasgos T1 "el árbol"): quién eres, cuánto
   camino llevas, y EL ÁRBOL de rasgos donde se gastan los Puntos
   de Identidad. El progreso de aristas se construye en la Sesión
   Táctica y en la cancha; comprar rasgos es gratis en tiempo (los
   PI ya se pagaron con niveles). El cambio de identidad vive en
   el hub (cuesta la Acción del Día).

   Doble modo (T1.5): pantalla normal desde el hub, y ONBOARDING
   en el flujo de inicio (decisión PO: elegir filosofía te trae
   directo acá con 1 PI para el 1-de-3 de rasgos básicos; el
   botón sigue al sorteo).
   ============================================================ */
import { getPhilosophy, aristaById, ARISTAS, FILO_LEVELS, FILO_ETAPAS } from "../../content/philosophies.js";
import { sequenceType, ADVANCED_BY_FILO } from "../../content/sequences.js";
import { RAMA_LABELS } from "../../content/traits.js";
import { filoPoints, filoLevel, filoEtapa } from "../../game/philosophy.js";
import { traitTree, buyTrait } from "../../game/traits.js";
import { S } from "../session.js";
import { register, go } from "../nav.js";
import { screenShell, $ } from "../components.js";

// Escala visual de las barras de arista: 12 puntos = barra llena (Consolidada exige
// 9 entre DOS aristas; 12 en una sola es una vida entera de foco — el tope visual).
const BAR_MAX = 12;

/** Barra de progreso genérica (ancho 0..100%). */
const bar = (pct, cls) => `<div class="h-1.5 rounded-full bg-slate-900/80 overflow-hidden"><div class="h-full rounded-full ${cls}" style="width:${Math.min(100, pct)}%"></div></div>`;

/**
 * El ÁRBOL de rasgos (T1.5): las 3 ramas de la filosofía (Firma · Respuesta ·
 * Expansión) con el estado de cada rasgo — owned ✓ · comprable (botón) · con
 * candado (faltas legibles). El PI disponible manda el call-to-action.
 */
function treePanel(run) {
  const tree = traitTree(run);
  const pi = run.identityPoints || 0;
  const byRama = Object.keys(RAMA_LABELS).map(rama => ({ rama, ...RAMA_LABELS[rama], traits: tree.filter(t => t.rama === rama) }));
  return `<div class="bg-slate-800/60 border tp-border rounded-2xl p-4 mt-4">
    <div class="flex items-center justify-between mb-1">
      <h3 class="font-bold text-sm">🌳 El árbol de rasgos</h3>
      <span class="px-2 py-0.5 rounded-full border ${pi > 0 ? "border-amber-500/60 bg-amber-500/10 text-amber-300" : "border-slate-700 text-slate-500"} text-[10px] font-black uppercase tracking-widest">🧠 ${pi} PI</span>
    </div>
    <p class="text-[11px] text-slate-500 mb-3">Cada nivel de identidad otorga un Punto de Identidad. Un rasgo es una idea futbolística permanente: no te hace más fuerte — te hace jugar distinto.</p>
    <div class="grid md:grid-cols-3 gap-3">
      ${byRama.map(r => `<div class="rounded-xl border border-slate-700 bg-slate-900/40 p-3">
        <div class="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-0.5">${r.label}</div>
        <div class="text-[10px] text-slate-500 mb-2">${r.desc}</div>
        ${r.traits.map(t => `<div class="rounded-lg border p-2.5 ${t.owned ? "tp-border tp-bg-soft" : t.buyable ? "border-amber-500/50 bg-slate-800/80" : "border-slate-700 bg-slate-900/50 opacity-70"}">
          <div class="flex items-center justify-between gap-1">
            <span class="text-xs font-bold ${t.owned ? "tp-text" : "text-slate-200"}">${t.icon} ${t.nombre}</span>
            ${t.owned ? `<span class="text-[9px] font-black text-emerald-400 uppercase">✓ tuya</span>` : t.buyable ? "" : `<span class="text-[10px]">🔒</span>`}
          </div>
          <div class="text-[10px] text-slate-400 leading-snug mt-1">${t.desc}</div>
          <div class="text-[10px] text-slate-500 italic mt-1">Su momento: ${t.momento}</div>
          ${t.buyable ? `<button data-buy="${t.id}" class="mt-2 w-full px-2 py-1.5 rounded-lg border border-amber-500/60 bg-amber-500/10 text-amber-300 text-[11px] font-bold cursor-pointer transition-all hover:bg-amber-500/20">Incorporar (1 PI)</button>` : ""}
          ${!t.owned && !t.buyable && t.faltas.length ? `<div class="text-[9px] text-slate-500 mt-1.5">Falta: ${t.faltas.join(" · ")}</div>` : ""}
        </div>`).join("")}
      </div>`).join("")}
    </div>
  </div>`;
}

function renderPhilosophy(opts = {}) {
  const run = S.run;
  const f = getPhilosophy(run.filoId);
  if (!f) { go("hub"); return; } // sin identidad no hay vitrina (no debería pasar post-sorteo)
  const pts = filoPoints(run);
  const lvl = filoLevel(run);           // nivel fino 0..9 (T1)
  const etapa = filoEtapa(run);         // etapa 0..2 (los hitos de siempre)
  const nivel = FILO_LEVELS[lvl];
  const next = FILO_LEVELS[lvl + 1] || null;
  const firma = aristaById(f.firma);
  const firmaType = sequenceType(firma.tipo);
  const adv = ADVANCED_BY_FILO[f.id]; // la secuencia avanzada de mi identidad (M2)
  // Progreso hacia el próximo umbral, desde el piso del nivel actual (para que la barra
  // no nazca medio llena al subir de nivel).
  const nivelPct = next ? (100 * (pts - nivel.min)) / (next.min - nivel.min) : 100;

  screenShell(`
    <div class="flex items-center justify-between mb-5">
      <h1 class="text-2xl font-black flex items-center gap-2">${f.icon} Identidad — ${f.name}</h1>
      ${opts.onboarding
        ? `<button id="btn-continue" class="btn-primary text-sm">Al sorteo →</button>`
        : `<button id="btn-back" class="text-sm text-slate-400 hover:text-slate-200 cursor-pointer px-3 py-2 rounded-xl border border-slate-700 hover:border-slate-500">← Volver</button>`}
    </div>
    <p class="text-sm text-slate-400 italic -mt-3 mb-5">${f.lema}</p>
    ${opts.onboarding ? `<div class="rounded-xl border border-amber-500/50 bg-amber-500/10 px-4 py-3 mb-5 text-sm text-amber-200">
      🧠 <b>Tu primera decisión de identidad:</b> tienes 1 Punto de Identidad. Elige UNO de los 3 rasgos básicos — ¿profundizas tu firma, cubres tu debilidad o te ensanchas? Los otros dos seguirán ahí: cada nivel de filosofía te dará otro punto.
    </div>` : ""}

    <div class="grid md:grid-cols-2 gap-4 items-start">
      <div class="space-y-4">
        <!-- Nivel y progreso -->
        <div class="bg-slate-800/60 border tp-border rounded-2xl p-4">
          <div class="flex items-center justify-between mb-1">
            <h3 class="font-bold text-sm">📈 Nivel ${lvl + 1} de identidad</h3>
            <span class="px-2 py-0.5 rounded-full border ${etapa === 2 ? "border-amber-500/60 bg-amber-500/10 text-amber-300" : "tp-border tp-bg-soft tp-text"} text-[10px] font-black uppercase tracking-widest">${FILO_ETAPAS[etapa].label}</span>
          </div>
          <p class="text-[11px] text-slate-500 mb-2">Suma de tus 2 aristas: <b class="text-slate-300">${pts} pts</b>${next ? ` · nivel ${lvl + 2} a los ${next.min}` : " · la idea ya es ley"}</p>
          ${bar(nivelPct, etapa === 2 ? "bg-amber-400" : "tp-gradient")}
          <p class="text-[10px] text-slate-500 mt-2">Tu jugada firma sale <b class="text-slate-300">×${nivel.mult}</b> más seguido en el pool del partido${etapa < 2 ? ` (al consolidar: ×${FILO_ETAPAS[2].mult})` : ""}.</p>
        </div>

        <!-- La firma y la secuencia AVANZADA (M2: el rasgo se fusionó acá) -->
        <div class="bg-slate-800/60 border border-slate-700 rounded-2xl p-4">
          <h3 class="font-bold text-sm mb-1">${firmaType.icon} Tu jugada firma: ${firmaType.name}</h3>
          <p class="text-[11px] text-slate-400">Acertar sus actos en partido también te consolida (+0.25 por acierto, tope +0.5 por partido): jugar tu fútbol y que salga ES entrenamiento.</p>
          <div class="mt-3 rounded-xl border ${etapa >= 1 ? "tp-border tp-bg-soft" : "border-slate-700 bg-slate-900/50"} p-3">
            <div class="text-[11px] font-bold ${etapa >= 1 ? "tp-text" : "text-slate-400"}">${etapa >= 1 ? "✅ Fútbol superior desbloqueado" : `🔒 Fútbol superior — se conquista En desarrollo (${FILO_ETAPAS[1].min} pts)`}</div>
            <div class="text-[12px] font-black ${etapa >= 1 ? "text-slate-100" : "text-slate-500"} mt-1">${adv.icon} ${adv.name}</div>
            <div class="text-[11px] ${etapa >= 1 ? "text-slate-200" : "text-slate-500"} mt-0.5">${adv.vitrina}</div>
            <div class="mt-2 pt-2 border-t ${etapa === 2 ? "border-amber-500/40" : "border-slate-700/60"}">
              <span class="text-[11px] font-bold ${etapa === 2 ? "text-amber-300" : "text-slate-500"}">${etapa === 2 ? "✅ Profunda (Consolidada)" : `🔒 Consolidada la profundiza (${FILO_ETAPAS[2].min} pts)`}</span>
              <div class="text-[11px] ${etapa === 2 ? "text-slate-200" : "text-slate-500"} mt-0.5">${f.rasgo}</div>
            </div>
          </div>
        </div>

        <!-- Mi fila de la matriz (cualitativa) -->
        <div class="bg-slate-800/60 border border-slate-700 rounded-2xl p-4">
          <h3 class="font-bold text-sm mb-2">⚔️ Tus counters</h3>
          <div class="text-[11px] text-emerald-400 leading-snug">✓ Brillas ${f.counters.brilla}.</div>
          <div class="text-[11px] text-amber-400 leading-snug mt-1.5">⚠️ Lo tuyo se paga: ${f.counters.sufre}.</div>
          <p class="text-[10px] text-slate-500 mt-2">El Informe del Rival te dice a qué juega el próximo: elegir contra qué juegas es parte del juego.</p>
        </div>
      </div>

      <!-- Las 5 aristas -->
      <div class="bg-slate-800/60 border border-slate-700 rounded-2xl p-4">
        <h3 class="font-bold text-sm mb-1">🧭 Las 5 aristas</h3>
        <p class="text-[11px] text-slate-500 mb-3">Tu filosofía vive de ${f.aristas.map(k => aristaById(k).label).join(" y ")}. Las demás no se pierden: son la semilla de otra identidad si algún día cambias el rumbo (cuesta la Acción del Día, desde la Sesión Táctica).</p>
        <div class="space-y-3">
          ${ARISTAS.map(a => {
            const own = f.aristas.includes(a.id);
            const v = run.aristas?.[a.id] || 0;
            const t = sequenceType(a.tipo);
            return `<div class="rounded-xl border ${own ? "tp-border tp-bg-soft" : "border-slate-700 bg-slate-900/40"} p-3">
              <div class="flex items-center justify-between">
                <span class="text-sm font-semibold ${own ? "tp-text" : "text-slate-300"}">${a.icon} ${a.label}${own ? `<span class="text-[9px] font-black uppercase tracking-widest ml-2 ${a.id === f.firma ? "text-amber-400" : "opacity-70"}">${a.id === f.firma ? "· firma" : "· tuya"}</span>` : ""}</span>
                <span class="text-xs font-black ${v ? "text-slate-200" : "text-slate-600"}">${v}</span>
              </div>
              <div class="mt-1.5">${bar((100 * v) / BAR_MAX, own ? "tp-gradient" : "bg-slate-600")}</div>
              <div class="text-[10px] text-slate-500 mt-1">${a.desc} · genera: ${t.icon} ${t.name}</div>
            </div>`;
          }).join("")}
        </div>
      </div>
    </div>
    ${treePanel(run)}
  `, "max-w-4xl");
  if (opts.onboarding) $("#btn-continue").onclick = () => go("draw");
  else $("#btn-back").onclick = () => go("hub");
  // Comprar un rasgo: la regla vive en game/traits (valida todo); la pantalla solo re-pinta.
  document.querySelectorAll("[data-buy]").forEach(b => b.onclick = () => {
    if (buyTrait(run, b.dataset.buy)) renderPhilosophy(opts);
  });
}

register("philosophy", renderPhilosophy);
