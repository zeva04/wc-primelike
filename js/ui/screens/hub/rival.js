/* ============================================================
   ui/screens/hub/rival — TODO LO QUE SE SABE DEL QUE VIENE:
   la card del rival del día, el Informe completo (Bible §4.6) y el
   selector de Oportunidad. Mirar el informe es gratis e ilimitado: la
   curiosidad no se castiga.
   ============================================================ */
import { getTeam } from "../../../data/teams-repo.js";
import { playerOverall } from "../../../game/ratings.js";
import { applyDayAction, dayOpportunity } from "../../../game/day-action.js";
import { RARITIES } from "../../../content/rarities.js";
import { buildOpponentReport } from "../../../game/scouting.js";
import { S } from "../../session.js";
import { flagImg, modal, closeModal, toast } from "../../components.js";
import { spriteSvg } from "../../sprites.js";
import { renderHub } from "./index.js";
import { alturaPicker, wireAlturaPicker } from "./team.js";

/**
 * Figuras a mostrar del rival: las de mayor nota, sin duplicados y con un solo arquero.
 * Rival jugable → ordena su plantel por nota; rival normal → usa sus figuras curadas.
 */
export function keyPlayers(team, max = 5) {
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
export function showScoutReport(oppId) {
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
export function oppCard(state = "active") {
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
export function showOppChooser(o) {
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

