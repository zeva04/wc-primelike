/* ============================================================
   ui/screens/match — partido en vivo: relato por ticks,
   decisiones (modal), mentalidad, pausa/velocidad y cambios.

   Contrato de decisiones: ver game/match/Match.js. Agregar una
   decisión nueva exige su entrada de ruteo en handleDecision().
   ============================================================ */
import { getTeam } from "../../data/teams-repo.js";
import { statLine } from "../../game/ratings.js";
import { STAGE_LABEL } from "../../game/tournament/knockout.js";
import { Match } from "../../game/match/Match.js";
import { S } from "../session.js";
import { register, go } from "../nav.js";
import { screenShell, $, flagImg, modal, closeModal, toast, numTag, posBadge, energyBar } from "../components.js";
import { spriteSvg } from "../sprites.js";

/** Crea la instancia Match con el once elegido y arranca el reloj del relato. */
function startMatch(oppId) {
  const me = getTeam(S.run.teamId);
  const opp = getTeam(oppId);
  const bench = S.run.squad.filter(p => !S.selectedLineup.includes(p) && !p.suspendido && p.lesionadoPartidos === 0);
  S.matchCtx = { team: me, lineup: S.selectedLineup.slice(), bench, mentalidad: "normal", buffs: { ...S.run.buffs } };
  S.match = new Match(S.matchCtx, opp, S.run.stage !== "groups");
  S.feedRendered = 0;
  S.paused = false;
  renderMatchScreen();
  S.match.log("info", `🏟️ ¡Comienza el partido! ${me.name} vs ${opp.name} — ${S.run.stage === "groups" ? "Grupo " + S.run.groups[S.run.myGroupIdx].name : STAGE_LABEL[S.run.stage]}`);
  updateMatchUI();
  startTimer();
}

/** Pinta la estructura fija del partido: marcador, controles, relato y alineaciones. */
function renderMatchScreen() {
  const me = S.matchCtx.team, opp = S.match.oppTeam;
  screenShell(`
    <div class="bg-slate-800/90 border border-slate-600 tp-topbar rounded-2xl p-4 mb-4 sticky top-2 z-30 backdrop-blur">
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-2.5 text-lg font-black">${flagImg(me, "w-10 h-7", true)}<span class="hidden sm:inline tp-text">${me.name}</span></div>
        <div class="text-center">
          <div id="score" class="text-4xl font-black tabular-nums">0 - 0</div>
          <div id="minute" class="text-amber-400 font-bold text-sm">0'</div>
        </div>
        <div class="flex items-center gap-2.5 text-lg font-black"><span class="hidden sm:inline">${opp.name}</span>${flagImg(opp, "w-10 h-7", true)}</div>
      </div>
      <div class="flex items-center justify-center gap-2 mt-3 flex-wrap">
        <div class="flex rounded-lg overflow-hidden border border-slate-600 text-xs">
          ${["defensiva", "normal", "ofensiva"].map(mm => `<button data-ment="${mm}" class="ment-btn px-3 py-1.5 font-semibold cursor-pointer transition-colors ${mm === "normal" ? "bg-amber-500 text-slate-900" : "bg-slate-700 hover:bg-slate-600"}">${mm === "defensiva" ? "🛡️" : mm === "ofensiva" ? "⚔️" : "⚖️"} ${mm[0].toUpperCase() + mm.slice(1)}</button>`).join("")}
        </div>
        <button id="btn-pause" class="px-3 py-1.5 rounded-lg bg-slate-700 hover:bg-slate-600 text-xs font-semibold cursor-pointer">⏸️ Pausa</button>
        <button id="btn-subs" class="px-3 py-1.5 rounded-lg bg-slate-700 hover:bg-slate-600 text-xs font-semibold cursor-pointer">🔄 Cambios (<span id="subs-left">3</span>)</button>
        <button id="btn-speed" class="px-3 py-1.5 rounded-lg bg-slate-700 hover:bg-slate-600 text-xs font-semibold cursor-pointer">⏩ x1</button>
      </div>
    </div>
    <div class="grid md:grid-cols-3 gap-4">
      <div class="md:col-span-2">
        <div id="feed" class="bg-slate-900/80 border border-slate-700 rounded-2xl p-4 h-[420px] overflow-y-auto space-y-1.5 text-sm"></div>
        <div id="match-footer" class="mt-3 text-center"></div>
      </div>
      <div class="bg-slate-800/60 border border-slate-700 rounded-2xl p-3">
        <h3 class="font-bold text-sm mb-2 tp-text">Equipo en cancha</h3>
        <div id="oncourt" class="space-y-1"></div>
        <h3 class="font-bold text-sm mb-2 mt-4 text-slate-400">Rival en cancha</h3>
        <div id="oppcourt" class="space-y-1"></div>
      </div>
    </div>
  `);
  document.querySelectorAll(".ment-btn").forEach(b => b.onclick = () => {
    S.matchCtx.mentalidad = b.dataset.ment;
    document.querySelectorAll(".ment-btn").forEach(x => { x.className = x.className.replace("bg-amber-500 text-slate-900", "bg-slate-700 hover:bg-slate-600"); });
    b.className = b.className.replace("bg-slate-700 hover:bg-slate-600", "bg-amber-500 text-slate-900");
    S.match.log("info", `📢 Mentalidad: ${b.dataset.ment.toUpperCase()}.`);
    updateMatchUI();
  });
  $("#btn-pause").onclick = togglePause;
  $("#btn-subs").onclick = openSubsModal;
  $("#btn-speed").onclick = () => {
    S.speed = S.speed === 1 ? 2 : 1;
    $("#btn-speed").textContent = `⏩ x${S.speed}`;
    if (S.timer) { stopTimer(); startTimer(); }
  };
}

/** Arranca el reloj: cada tick avanza el partido y reacciona a decisiones/entretiempo/penales/fin. */
function startTimer() {
  stopTimer();
  S.timer = setInterval(() => {
    if (S.paused || S.match.decision || S.match.finished) return;
    const r = S.match.tick();
    updateMatchUI();
    if (r === true && S.match.decision) { stopTimer(); showDecision(); }
    else if (r === "halftime") { stopTimer(); showHalftime(); }
    else if (r === "pens") { stopTimer(); go("shootout"); }
    else if (r === "end") { stopTimer(); go("finish-match"); }
  }, S.speed === 1 ? 1000 : 450);
}

/** Detiene el reloj del partido. */
export function stopTimer() { if (S.timer) { clearInterval(S.timer); S.timer = null; } }

/** Alterna pausa/reanudar del relato. */
function togglePause() {
  S.paused = !S.paused;
  const b = $("#btn-pause");
  if (b) b.textContent = S.paused ? "▶️ Seguir" : "⏸️ Pausa";
}

const FEED_STYLE = {
  goal: "bg-emerald-500/15 border-l-4 border-emerald-400 font-bold",
  goal_opp: "bg-red-500/15 border-l-4 border-red-400 font-bold",
  chance: "text-slate-200",
  card: "bg-yellow-500/10 border-l-4 border-yellow-500",
  event: "bg-purple-500/10 border-l-4 border-purple-400",
  info: "text-amber-300 font-semibold",
  plain: "text-slate-400",
};

/** Refresca marcador, minuto, relato (solo líneas nuevas) y panel "En cancha". */
export function updateMatchUI() {
  if (!$("#score")) return;
  const match = S.match, matchCtx = S.matchCtx;
  $("#score").textContent = `${match.gMy} - ${match.gOpp}`;
  $("#minute").textContent = `${match.min}'${match.phase === "extra" ? " (prórroga)" : ""}`;
  $("#subs-left").textContent = match.subsLeft;
  const feed = $("#feed");
  while (S.feedRendered < match.feed.length) {
    const f = match.feed[S.feedRendered++];
    const div = document.createElement("div");
    div.className = `px-3 py-1.5 rounded-lg animate-fadein ${FEED_STYLE[f.kind] || "text-slate-300"}`;
    div.textContent = f.text;
    feed.appendChild(div);
  }
  feed.scrollTop = feed.scrollHeight;
  // Alineaciones en cancha, siempre en orden POR → DEF → MED → DEL (incluso tras cambios)
  const POS_RANK = { POR: 0, DEF: 1, MED: 2, DEL: 3 };
  const byPos = (a, b) => POS_RANK[a.pos] - POS_RANK[b.pos];
  const oc = $("#oncourt");
  if (oc) oc.innerHTML = matchCtx.lineup.slice().sort(byPos).map(p => `
    <div class="flex items-center gap-2 text-xs px-2 py-1 rounded-lg ${p.expulsado ? "opacity-30 line-through" : p.lesionado ? "opacity-30" : "bg-slate-800/60"}">
      ${spriteSvg(p, matchCtx.team, "w-5 h-6")}
      ${numTag(p)}
      ${posBadge(p.pos)}
      <span class="flex-1 truncate">${p.name} ${p.usado ? "🔄" : ""}${p.amarillaPartido ? "🟨" : ""}${p.expulsado ? "🟥" : ""}${p.lesionado ? "🚑" : ""}</span>
      <span class="w-12">${energyBar(p.energia)}</span>
    </div>`).join("");
  const opc = $("#oppcourt");
  if (opc) opc.innerHTML = match.oppLineup.slice().sort(byPos).map(p => `
    <div class="flex items-center gap-2 text-xs px-2 py-1 rounded-lg ${p.expulsado ? "opacity-30 line-through" : "bg-slate-800/40"}">
      ${spriteSvg(p, match.oppTeam, "w-5 h-6")}
      ${p.num ? numTag(p) : ""}
      ${posBadge(p.pos)}
      <span class="flex-1 truncate text-slate-300">${p.name} ${p.amarillaPartido ? "🟨" : ""}${p.expulsado ? "🟥" : ""}</span>
    </div>`).join("");
}

// --- Decisiones en partido ---

/** Muestra el modal de la decisión pendiente (ocasión, penal, cambio, protección). */
function showDecision() {
  const d = S.match.decision;
  const m = modal(`
    <h2 class="text-lg font-black mb-1">${d.title}</h2>
    <p class="text-slate-300 text-sm mb-4">${d.text}</p>
    <div class="space-y-2">
      ${d.options.map((o, i) => `<button data-i="${i}" class="dec-opt w-full text-left px-4 py-3 rounded-xl border border-slate-600 bg-slate-700/60 hover:border-amber-400 hover:bg-slate-700 transition-all cursor-pointer">
        <div class="font-semibold">${o.label}</div>
        ${o.hint ? `<div class="text-xs text-slate-400">${o.hint}</div>` : ""}
      </button>`).join("")}
    </div>
  `);
  m.querySelectorAll(".dec-opt").forEach(b => b.onclick = () => {
    const opt = d.options[+b.dataset.i];
    closeModal();
    handleDecision(d, opt.key);
  });
}

/** Enruta la opción elegida al método correspondiente de Match y reanuda (o encadena otra decisión). */
function handleDecision(d, key) {
  const match = S.match;
  if (d.id === "chance") match.resolveChance(key);
  else if (d.id === "penalty_mine") match.resolvePenaltyMine(key);
  else if (d.id === "penalty_opp") match.resolvePenaltyOpp(key);
  else if (d.id === "forced_sub") { match.decision = null; match.makeSub(d.out, key); }
  else if (d.id === "gk_red") { match.decision = null; match.makeSub(match.my.lineup.find(p => p.name === key), d.gkIn, true); }
  else if (d.id === "protect") {
    match.decision = null;
    if (key === "sub") {
      const opts = match.eligibleFor(d.player);
      if (opts.length) {
        match.decision = {
          id: "forced_sub", out: d.player,
          title: `🔄 Cambio por ${d.player.name}`,
          text: "Elige quién entra:",
          options: opts.map(b => ({ label: `#${b.num} ${b.name} (${b.pos})`, hint: statLine(b), key: b.name })),
        };
      }
    }
  }
  updateMatchUI();
  if (match.decision) { showDecision(); return; }
  startTimer();
}

/** Pausa de entretiempo: botón para reanudar (permite ajustar cambios y mentalidad). */
function showHalftime() {
  updateMatchUI();
  const footer = $("#match-footer");
  footer.innerHTML = `<button id="btn-resume" class="btn-primary">▶️ Continuar el partido</button>
    <p class="text-xs text-slate-400 mt-2">Aprovecha para hacer cambios o ajustar la mentalidad.</p>`;
  $("#btn-resume").onclick = () => { footer.innerHTML = ""; startTimer(); };
}

/** Modal de cambios manual: elige quién sale y la columna "Entra" se recalcula según las reglas. */
function openSubsModal() {
  const match = S.match;
  if (match.finished) return;
  if (match.subsLeft <= 0) return toast("Ya no te quedan cambios.");
  const wasPaused = S.paused; S.paused = true;
  const onField = S.matchCtx.lineup.filter(p => !p.expulsado && !p.lesionado);
  if (!match.availableBench().length) { S.paused = wasPaused; return toast("No hay suplentes disponibles."); }
  let outSel = null;
  const m = modal(`
    <h2 class="text-lg font-black mb-3">🔄 Realizar cambio <span class="text-xs text-slate-400">(${match.subsLeft} restantes)</span></h2>
    <div class="grid grid-cols-2 gap-3 text-sm">
      <div><div class="text-xs uppercase text-slate-400 font-bold mb-1">Sale</div><div id="sub-out" class="space-y-1">
        ${onField.map(p => `<button data-name="${p.name}" class="sub-out w-full text-left px-2 py-1.5 rounded-lg border border-slate-600 hover:border-red-400 cursor-pointer">${numTag(p)} ${posBadge(p.pos)} ${p.name} <span class="text-[10px] text-slate-400">E:${p.energia}</span></button>`).join("")}
      </div></div>
      <div><div class="text-xs uppercase text-slate-400 font-bold mb-1">Entra</div><div id="sub-in" class="space-y-1"></div></div>
    </div>
    <button id="sub-cancel" class="mt-4 text-sm text-slate-400 hover:text-white cursor-pointer">Cancelar</button>
  `);

  // La columna "Entra" se recalcula según quién sale: sustituidos en gris,
  // y el arquero suplente bloqueado salvo que salga el arquero.
  const renderIn = () => {
    const box = m.querySelector("#sub-in");
    box.innerHTML = match.my.bench.map(b => {
      if (b.sustituido) {
        return `<div class="w-full text-left px-2 py-1.5 rounded-lg border border-slate-800 bg-slate-800/30 opacity-45 grayscale">${numTag(b)} ${posBadge(b.pos)} <span class="line-through text-slate-400">${b.name}</span> <span class="text-[9px] uppercase font-bold text-slate-500 ml-1">Sustituido</span></div>`;
      }
      if (!outSel) {
        return `<div class="w-full text-left px-2 py-1.5 rounded-lg border border-slate-700 opacity-50">${numTag(b)} ${posBadge(b.pos)} ${b.name} <span class="text-[10px] text-slate-500">elige quién sale</span></div>`;
      }
      const eligible = match.eligibleFor(outSel).includes(b);
      if (!eligible) {
        const motivo = b.pos === "POR" && outSel.pos !== "POR" ? "solo puede entrar por el arquero" : "no disponible";
        return `<div class="w-full text-left px-2 py-1.5 rounded-lg border border-slate-800 opacity-40">${numTag(b)} ${posBadge(b.pos)} ${b.name} <span class="text-[9px] text-amber-500">${motivo}</span></div>`;
      }
      return `<button data-name="${b.name}" class="sub-in w-full text-left px-2 py-1.5 rounded-lg border border-slate-600 hover:border-emerald-400 cursor-pointer">${numTag(b)} ${posBadge(b.pos)} ${b.name} <span class="text-[10px] text-slate-400">${statLine(b)}</span></button>`;
    }).join("");
    box.querySelectorAll(".sub-in").forEach(b => b.onclick = () => {
      if (!outSel) return;
      match.makeSub(outSel, b.dataset.name);
      closeModal();
      S.paused = wasPaused;
      updateMatchUI();
    });
  };
  renderIn();

  m.querySelectorAll(".sub-out").forEach(b => b.onclick = () => {
    outSel = onField.find(p => p.name === b.dataset.name);
    m.querySelectorAll(".sub-out").forEach(x => x.classList.remove("border-red-400", "bg-red-400/10"));
    b.classList.add("border-red-400", "bg-red-400/10");
    renderIn();
  });
  m.querySelector("#sub-cancel").onclick = () => { closeModal(); S.paused = wasPaused; };
}

register("start-match", startMatch);
