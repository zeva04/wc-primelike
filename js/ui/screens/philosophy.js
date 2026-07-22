/* ============================================================
   ui/screens/philosophy — la pantalla de IDENTIDAD (F3, "La
   vitrina"): quién eres, cuánto camino llevas y qué te espera.
   Solo lectura: el progreso se construye en la Sesión Táctica y
   en la cancha; el cambio de identidad vive en el hub (cuesta la
   Acción del Día). Diseño aprobado por PO: nivel con barra al
   próximo umbral, las 5 aristas (propias destacadas), la firma,
   el rasgo (🔒 hasta Consolidada) y MI fila de la matriz de
   counters en cualitativo (regla 4 del Bible: fortalezas Y
   vulnerabilidades visibles).
   ============================================================ */
import { getPhilosophy, aristaById, ARISTAS, FILO_LEVELS } from "../../content/philosophies.js";
import { sequenceType } from "../../content/sequences.js";
import { filoPoints, filoLevel } from "../../game/philosophy.js";
import { S } from "../session.js";
import { register, go } from "../nav.js";
import { screenShell, $ } from "../components.js";

// Escala visual de las barras de arista: 12 puntos = barra llena (Consolidada exige
// 9 entre DOS aristas; 12 en una sola es una vida entera de foco — el tope visual).
const BAR_MAX = 12;

/** Barra de progreso genérica (ancho 0..100%). */
const bar = (pct, cls) => `<div class="h-1.5 rounded-full bg-slate-900/80 overflow-hidden"><div class="h-full rounded-full ${cls}" style="width:${Math.min(100, pct)}%"></div></div>`;

function renderPhilosophy() {
  const run = S.run;
  const f = getPhilosophy(run.filoId);
  if (!f) { go("hub"); return; } // sin identidad no hay vitrina (no debería pasar post-sorteo)
  const pts = filoPoints(run);
  const lvl = filoLevel(run);
  const nivel = FILO_LEVELS[lvl];
  const next = FILO_LEVELS[lvl + 1] || null;
  const firma = aristaById(f.firma);
  const firmaType = sequenceType(firma.tipo);
  // Progreso hacia el próximo umbral, desde el piso del nivel actual (para que la barra
  // no nazca medio llena al subir de nivel).
  const nivelPct = next ? (100 * (pts - nivel.min)) / (next.min - nivel.min) : 100;

  screenShell(`
    <div class="flex items-center justify-between mb-5">
      <h1 class="text-2xl font-black flex items-center gap-2">${f.icon} Identidad — ${f.name}</h1>
      <button id="btn-back" class="text-sm text-slate-400 hover:text-slate-200 cursor-pointer px-3 py-2 rounded-xl border border-slate-700 hover:border-slate-500">← Volver</button>
    </div>
    <p class="text-sm text-slate-400 italic -mt-3 mb-5">${f.lema}</p>

    <div class="grid md:grid-cols-2 gap-4 items-start">
      <div class="space-y-4">
        <!-- Nivel y progreso -->
        <div class="bg-slate-800/60 border tp-border rounded-2xl p-4">
          <div class="flex items-center justify-between mb-1">
            <h3 class="font-bold text-sm">📈 Nivel de identidad</h3>
            <span class="px-2 py-0.5 rounded-full border ${lvl === 2 ? "border-amber-500/60 bg-amber-500/10 text-amber-300" : "tp-border tp-bg-soft tp-text"} text-[10px] font-black uppercase tracking-widest">${nivel.label}</span>
          </div>
          <p class="text-[11px] text-slate-500 mb-2">Suma de tus 2 aristas: <b class="text-slate-300">${pts} pts</b>${next ? ` · ${next.label} a los ${next.min}` : " · la idea ya es ley"}</p>
          ${bar(nivelPct, lvl === 2 ? "bg-amber-400" : "tp-gradient")}
          <p class="text-[10px] text-slate-500 mt-2">Tu jugada firma sale <b class="text-slate-300">×${nivel.mult}</b> más seguido en el pool del partido${next ? ` (al consolidar: ×${FILO_LEVELS[2].mult})` : ""}.</p>
        </div>

        <!-- La firma y el rasgo -->
        <div class="bg-slate-800/60 border border-slate-700 rounded-2xl p-4">
          <h3 class="font-bold text-sm mb-1">${firmaType.icon} Tu jugada firma: ${firmaType.name}</h3>
          <p class="text-[11px] text-slate-400">Acertar sus actos en partido también te consolida (+0.25 por acierto, tope +0.5 por partido): jugar tu fútbol y que salga ES entrenamiento.</p>
          <div class="mt-3 rounded-xl border ${lvl === 2 ? "border-amber-500/50 bg-amber-500/10" : "border-slate-700 bg-slate-900/50"} p-3">
            <div class="text-[11px] font-bold ${lvl === 2 ? "text-amber-300" : "text-slate-400"}">${lvl === 2 ? "✅ Rasgo desbloqueado" : "🔒 Rasgo de Consolidada"}</div>
            <div class="text-[11px] ${lvl === 2 ? "text-slate-200" : "text-slate-500"} mt-0.5">${f.rasgo}</div>
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
  `, "max-w-4xl");
  $("#btn-back").onclick = () => go("hub");
}

register("philosophy", renderPhilosophy);
