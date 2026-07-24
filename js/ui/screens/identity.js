/* ============================================================
   ui/screens/identity — inicio de run y ELECCIÓN DE IDENTIDAD
   (arco de Filosofía F1, decisión PO #1: se elige apenas
   confirmado el equipo, antes de ver el sorteo — el grupo no
   influye en quién decides ser). Las 4 cards muestran fortaleza
   Y vulnerabilidad (Bible §5 regla 4: se elige informado, no hay
   build sin costo).
   ============================================================ */
import { getTeam } from "../../data/teams-repo.js";
import { newRun } from "../../game/run.js";
import { PHILOSOPHIES, aristaById } from "../../content/philosophies.js";
import { choosePhilosophy } from "../../game/philosophy.js";
import { markerColor, PRINCIPLE_COLORS } from "../board.js";
import { playBoard } from "../plays.js";
import { S } from "../session.js";
import { register, go } from "../nav.js";
import { screenShell, $, flagImg } from "../components.js";
import { applyTeamColors } from "../theme.js";

/* El orden en que se muestran las cuatro. Es una decisión de VITRINA, no de datos:
   content/philosophies mantiene el suyo (lo usan el modal de cambio y el scouting),
   acá se alternan ofensiva/defensiva — press · contra · posesión · bloque — para que
   dos identidades vecinas nunca propongan el mismo fútbol. */
const ORDEN_VITRINA = ["press", "contra", "posesion", "bloque"]
  .map(id => PHILOSOPHIES.find(p => p.id === id))
  .filter(Boolean);

/** Inicia una run con el equipo elegido: crea el estado, aplica sus colores y pide la identidad. */
function startRun(teamId) {
  S.run = newRun(teamId);
  applyTeamColors(getTeam(teamId));
  renderChooseIdentity();
}

/**
 * Pantalla previa al sorteo: confirmar el equipo y elegir la identidad.
 *
 * Sprint de UI del selector: el jugador elige entre cuatro FÚTBOLS distintos, así
 * que se los dibujamos (ui/plays) en vez de describírselos. La cancha de cada
 * filosofía con su jugada firma ES la información — se compara de un vistazo.
 *
 * Reglas del sprint (decisiones PO):
 *  · Fortaleza y advertencia SOLO en la elegida — Bible §5 regla 4 se cumple
 *    igual (ves el precio antes de confirmar) sin el muro de 8 líneas en paralelo.
 *  · Fuera la línea del fútbol superior / árbol de rasgos: habla de un desbloqueo
 *    que el jugador no puede usar para decidir, y ya vive en la pizarra grande.
 *  · La explicación baja de párrafo a una línea de tiza.
 */
function renderChooseIdentity() {
  const run = S.run;
  const me = getTeam(run.teamId);
  screenShell(`
    <div class="text-center mb-5">
      <div class="flex items-center justify-center gap-2.5">
        ${flagImg(me, "w-8 h-5")}
        <h1 class="text-lg font-black tracking-tight">${me.name}</h1>
      </div>
      <div class="tricolor-bar max-w-[10rem] mx-auto mt-2 mb-4"></div>
      <h2 class="text-2xl font-black">🧭 Elige tu identidad</h2>
      <p class="chalk-hand text-[15px] text-slate-400 mt-1.5">Tu filosofía decide qué fútbol genera cada partido — y toda identidad tiene su contra.</p>
    </div>

    <div id="filo-grid" class="grid grid-cols-2 lg:grid-cols-4 gap-3.5 items-stretch">
      ${ORDEN_VITRINA.map(p => {
        const ink = markerColor(p);
        return `<div data-filo="${p.id}" class="filo-board flex flex-col overflow-hidden" style="--ink:${ink}">
          ${playBoard(p)}
          <div class="px-3.5 pb-3.5 pt-1 flex flex-col flex-1">
            <div class="flex items-center gap-2">
              <span class="text-xl leading-none">${p.icon}</span>
              <span class="font-black text-[15px] leading-tight" style="color:${ink}">${p.name}</span>
            </div>
            <p class="chalk-hand text-[13.5px] leading-snug text-[#dff0e5]/60 mt-1.5">${p.lema}</p>
            <div class="filo-annot mt-auto pt-3">
              <div class="flex flex-wrap gap-x-3 gap-y-1 mb-2.5">
                ${p.aristas.map(k => { const a = aristaById(k); return `<span class="text-[10px] font-black uppercase tracking-widest"
                  style="color:${PRINCIPLE_COLORS[a.id]}">${a.icon} ${a.label}</span>`; }).join("")}
              </div>
              <div class="text-[11px] leading-snug text-emerald-300/90">✓ ${p.fuerte}</div>
              <div class="text-[11px] leading-snug text-amber-300/90 mt-1.5">⚠ ${p.advertencia}</div>
            </div>
          </div>
        </div>`;
      }).join("")}
    </div>

    <div class="flex items-center justify-center gap-4 mt-6">
      <button id="btn-back-team" class="text-sm text-slate-400 hover:text-white cursor-pointer px-3 py-2 rounded-xl border border-slate-700 hover:border-slate-500">← Volver a elegir equipo</button>
      <button id="btn-continue" disabled class="btn-primary opacity-40 cursor-not-allowed" title="Primero elige tu identidad">Confirmar →</button>
    </div>
  `, "max-w-6xl");
  let elegida = null;
  const grid = $("#filo-grid");
  // La elección es un TOGGLE: volver a tocar la elegida la suelta y devuelve las
  // cuatro al mismo peso. Nada obliga a quedarse con la primera que tocaste.
  grid.querySelectorAll("[data-filo]").forEach(b => b.onclick = () => {
    const soltar = b.classList.contains("is-sel");
    grid.querySelectorAll(".is-sel").forEach(x => x.classList.remove("is-sel"));
    const btn = $("#btn-continue");
    elegida = soltar ? null : b.dataset.filo;
    grid.classList.toggle("filo-pick", !soltar);           // apaga las no elegidas
    if (!soltar) b.classList.add("is-sel");
    btn.disabled = soltar;
    btn.classList.toggle("opacity-40", soltar);
    btn.classList.toggle("cursor-not-allowed", soltar);
    btn.title = soltar ? "Primero elige tu identidad" : "";
  });
  $("#btn-back-team").onclick = () => go("menu");
  $("#btn-continue").onclick = () => {
    if (!elegida) return;
    choosePhilosophy(S.run, elegida);
    // Arco de Rasgos (T1, decisión PO): elegir filosofía acredita el PI del nivel 1
    // y lleva DIRECTO al árbol — el 1-de-3 de rasgos básicos es la segunda decisión
    // de identidad de la run. De ahí, al sorteo.
    go("philosophy", { onboarding: true });
  };
}

register("start-run", startRun);
