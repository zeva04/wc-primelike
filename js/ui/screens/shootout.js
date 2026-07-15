/* ============================================================
   ui/screens/shootout — la tanda de penales: elegir pateador y
   dirección en los míos, el lado del arquero en los rivales.
   ============================================================ */
import { pick } from "../../core/rng.js";
import { currentAura } from "../../game/ratings.js";
import { S } from "../session.js";
import { register, go } from "../nav.js";
import { modal, closeModal, flagImg, numTag, posBadge } from "../components.js";
import { updateMatchUI } from "./match.js";

/** Inicia la tanda y lanza el primer turno. */
function startShootoutUI() {
  S.match.startShootout();
  updateMatchUI();
  shootoutTurn();
}

/** Marcador de la tanda con las secuencias de aciertos/fallos (🟢/🔴). */
function pensTally() {
  const s = S.match.shootoutStatus();
  const dots = arr => arr.map(x => x ? "🟢" : "🔴").join("") || "—";
  return `<div class="text-center mb-4">
    <div class="text-2xl font-black">${s.myGoals} - ${s.oppGoals}</div>
    <div class="text-sm mt-1 space-y-0.5">
      <div class="flex items-center justify-center gap-2">${flagImg(S.matchCtx.team, "w-5 h-3.5")} <span>${dots(s.my)}</span></div>
      <div class="flex items-center justify-center gap-2">${flagImg(S.match.oppTeam, "w-5 h-3.5")} <span>${dots(s.opp)}</span></div>
    </div>
  </div>`;
}

/** Un turno de la tanda: si me toca elijo pateador y dirección; si es rival, el lado del arquero. */
function shootoutTurn() {
  const match = S.match;
  const s = match.shootoutStatus();
  if (s.done) { go("finish-match"); return; }
  const myTurn = s.my.length <= s.opp.length;
  if (myTurn) {
    const onField = S.matchCtx.lineup.filter(p => !p.expulsado && !p.lesionado);
    const notUsed = onField.filter(p => !match.pens.takers.slice(-Math.min(onField.length - 1, match.pens.takers.length)).includes(p.name));
    const cands = notUsed.length ? notUsed : onField;
    const m = modal(`
      <h2 class="text-lg font-black text-center mb-2">🎯 Penal ${s.my.length + 1} — Tu turno</h2>
      ${pensTally()}
      <p class="text-sm text-slate-300 mb-2 text-center">Elige el pateador:</p>
      <div class="space-y-1.5" id="pen-takers">
        ${cands.map(p => `<button data-name="${p.name}" class="pen-taker w-full text-left px-3 py-2 rounded-xl border border-slate-600 hover:border-amber-400 cursor-pointer text-sm">${numTag(p)} ${posBadge(p.pos)} <b>${p.name}</b> <span class="text-xs text-slate-400">${p.pos === "POR" ? `Reflejos ${p.stats.reflejos}` : `Tiro ${p.stats.tiro}`} · Aura ${currentAura(p, S.matchCtx.buffs)}</span></button>`).join("")}
      </div>
    `);
    m.querySelectorAll(".pen-taker").forEach(b => b.onclick = () => {
      const name = b.dataset.name;
      const m2 = modal(`
        <h2 class="text-lg font-black text-center mb-2">${name} al punto penal...</h2>
        ${pensTally()}
        <p class="text-sm text-slate-300 mb-3 text-center">¿Hacia dónde patea?</p>
        <div class="grid grid-cols-3 gap-2">
          ${[["izq", "⬅️ Izquierda"], ["centro", "🎯 Centro"], ["der", "➡️ Derecha"]].map(([k, l]) =>
            `<button data-dir="${k}" class="pen-dir px-2 py-4 rounded-xl border border-slate-600 hover:border-amber-400 font-bold cursor-pointer">${l}</button>`).join("")}
        </div>
      `);
      m2.querySelectorAll(".pen-dir").forEach(db => db.onclick = () => {
        const res = match.shootMyPen(name, db.dataset.dir);
        showPenResult(res.scored
          ? `⚽ ¡GOL! ${res.taker} la clava con categoría.`
          : `❌ ¡${res.taker} FALLA! ${pick(["El arquero la ataja.", "La tira afuera.", "¡Al travesaño!"])}`, res.scored);
      });
    });
  } else {
    const shooterIdx = s.opp.length;
    const m = modal(`
      <h2 class="text-lg font-black text-center mb-2">🧤 Penal rival ${shooterIdx + 1}</h2>
      ${pensTally()}
      <p class="text-sm text-slate-300 mb-3 text-center">¿Hacia dónde se lanza tu arquero?</p>
      <div class="grid grid-cols-3 gap-2">
        ${[["izq", "⬅️ Izquierda"], ["centro", "🧍 Centro"], ["der", "➡️ Derecha"]].map(([k, l]) =>
          `<button data-dir="${k}" class="pen-dive px-2 py-4 rounded-xl border border-slate-600 hover:border-amber-400 font-bold cursor-pointer">${l}</button>`).join("")}
      </div>
    `);
    m.querySelectorAll(".pen-dive").forEach(db => db.onclick = () => {
      const res = match.shootOppPen(db.dataset.dir);
      showPenResult(res.scored
        ? `💔 Gol de ${res.shooter}. ${res.guessed ? "Adivinaste el lado pero fue imposible." : "Se lanzó al otro lado."}`
        : (res.guessed ? `🧤 ¡¡ATAJADO!! ¡Adivinaste el lado! HÉROE NACIONAL.` : `😅 ¡${res.shooter} la tiró AFUERA! Se salvaron.`), !res.scored);
    });
  }
}

/** Muestra el resultado de un penal y encadena el siguiente turno. */
function showPenResult(text, positive) {
  const m = modal(`
    <div class="text-center">
      <div class="text-5xl mb-3">${positive ? "🎉" : "😖"}</div>
      <p class="font-bold text-lg mb-4">${text}</p>
      ${pensTally()}
      <button id="pen-next" class="btn-primary">Continuar</button>
    </div>
  `);
  m.querySelector("#pen-next").onclick = () => { closeModal(); shootoutTurn(); };
}

register("shootout", startShootoutUI);
