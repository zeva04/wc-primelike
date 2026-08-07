/* ============================================================
   ui/filo-change — el modal de CAMBIO DE IDENTIDAD, compartido.

   Vivía dentro de hub.js; se extrajo cuando la pantalla de
   Identidad pasó a ofrecer el cambio también: la regla se muestra en un solo lugar y no hay dos
   copias del texto del costo que puedan divergir.

   La REGLA no vive acá: `changePhilosophy` (game/philosophy)
   exige `run.actionPending` y lo consume — desde donde se llame,
   el cambio siempre cuesta la Acción del Día. Este módulo solo
   pinta la elección informada: la demolición
   es ORGÁNICA, así que cada card muestra cuánto de lo entrenado
   le sirve a la identidad nueva (el costo hundido, a la vista
   antes de firmar).
   ============================================================ */
import { PHILOSOPHIES, aristaById, filoLevelOf } from "../content/identity/philosophies.js";
import { changePhilosophy } from "../game/philosophy.js";
import { S } from "./session.js";
import { modal, closeModal, toast } from "./components.js";

/**
 * Abre el modal. `onDone` se llama tras un cambio efectivo — cada pantalla
 * pasa su propio re-pintado (el hub el suyo, la Identidad el suyo).
 */
export function showFiloChange(onDone) {
  const run = S.run;
  const others = PHILOSOPHIES.filter(p => p.id !== run.filoId);
  const m = modal(`
    <h3 class="text-lg font-black">🔄 Cambio de identidad</h3>
    <p class="text-xs text-slate-400 mt-1 mb-3">Cuesta la <b class="text-amber-400">Acción del Día</b> y vale como <b class="text-amber-400">Plan de Partido</b>. Cada idea guarda su propio nivel: nada se pierde al cambiar.</p>
    <div class="space-y-2">
      ${others.map(p => {
        const lvl = filoLevelOf(run, p.id) + 1;
        return `<button data-filo="${p.id}" class="w-full text-left rounded-xl border border-slate-600 bg-slate-800/70 hover:border-amber-400 p-3 cursor-pointer transition-all">
          <div class="flex items-center justify-between">
            <span class="font-bold text-sm">${p.icon} ${p.name}</span>
            <span class="text-[10px] font-bold ${lvl > 1 ? "text-emerald-400" : "text-slate-500"}">nivel ${lvl}${p.id === run.filoInicial ? " · tu escuela" : ""}</span>
          </div>
          <div class="text-[10px] text-slate-400 mt-0.5">${p.aristas.map(k => `${aristaById(k).icon} ${aristaById(k).label}`).join(" + ")}</div>
          <div class="text-[10px] text-amber-400/90 mt-0.5">⚠️ ${p.advertencia}</div>
        </button>`;
      }).join("")}
    </div>
    <button id="filo-cancel" class="mt-3 w-full text-xs font-bold py-2 rounded-lg border border-slate-600 text-slate-400 hover:bg-slate-800 cursor-pointer">Mejor seguimos como estamos</button>
  `, "max-w-md");
  m.querySelectorAll("[data-filo]").forEach(b => b.onclick = () => {
    const f = changePhilosophy(S.run, b.dataset.filo);
    if (!f) return;
    closeModal();
    toast(`${f.icon} Nueva identidad: ${f.name} — el día entero se fue en reinstalar ideas.`);
    onDone?.();
  });
  m.querySelector("#filo-cancel").onclick = closeModal;
}
