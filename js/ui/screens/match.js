/* ============================================================
   ui/screens/match — partido en vivo: relato por ticks,
   decisiones (modal), mentalidad, pausa/velocidad y cambios.

   Contrato de decisiones: ver game/match/Match.js. Agregar una
   decisión nueva exige su entrada de ruteo en handleDecision().
   ============================================================ */
import { getTeam } from "../../data/teams-repo.js";
import { statLine, playedPos, outOfPosPenalty } from "../../game/ratings.js";
import { swapAssignments, canPlayAt } from "../../game/lineup.js";
import { STAGE_LABEL } from "../../game/tournament/knockout.js";
import { Match } from "../../game/match/Match.js";
import { S } from "../session.js";
import { register, go } from "../nav.js";
import { screenShell, $, flagImg, modal, closeModal, toast, numTag, posBadge, energyBar } from "../components.js";
import { mountPitch, POS_NAME } from "../pitch.js";
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
        <button id="btn-subs" class="px-3 py-1.5 rounded-lg bg-slate-700 hover:bg-slate-600 text-xs font-semibold cursor-pointer">🔄 Plantilla (<span id="subs-left">3</span>)</button>
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
  $("#btn-subs").onclick = openSquadModal;
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
  // Alineaciones en cancha, siempre en orden POR → DEF → MED → DEL (incluso tras cambios).
  // Los míos se ordenan y etiquetan por el puesto que JUEGAN: tras una reubicación, un
  // delantero puesto de defensa aparece en la línea de atrás, con ❗ y su nota castigada.
  const POS_RANK = { POR: 0, DEF: 1, MED: 2, DEL: 3 };
  const byPos = (a, b) => POS_RANK[a.pos] - POS_RANK[b.pos];
  const byPlayed = (a, b) => POS_RANK[playedPos(a)] - POS_RANK[playedPos(b)];
  const oc = $("#oncourt");
  if (oc) oc.innerHTML = matchCtx.lineup.slice().sort(byPlayed).map(p => `
    <div class="flex items-center gap-2 text-xs px-2 py-1 rounded-lg ${p.expulsado ? "opacity-30 line-through" : p.lesionado ? "opacity-30" : "bg-slate-800/60"}">
      ${spriteSvg(p, matchCtx.team, "w-5 h-6")}
      ${numTag(p)}
      ${posBadge(playedPos(p))}
      <span class="flex-1 truncate">${p.name} ${outOfPosPenalty(p) > 0 ? `<span class="text-orange-400 font-black" title="Fuera de puesto: es ${p.pos}">!</span>` : ""}${p.usado ? "🔄" : ""}${p.amarillaPartido ? "🟨" : ""}${p.expulsado ? "🟥" : ""}${p.lesionado ? "🚑" : ""}</span>
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

/* ---------- Gestión de plantilla en partido ---------- */

/**
 * Gestión de plantilla en vivo: la misma cancha del hub, con el partido en pausa.
 * Arrastrar titular sobre titular reubica (gratis); traer a alguien del banco es un cambio.
 *
 * NADA toca el partido hasta Confirmar: los cambios se arman como un plan y se aplican
 * juntos. Las reubicaciones sí mutan `posJugada` en el momento — es lo que la cancha lee
 * para previsualizar — y por eso se guarda el estado previo y se restaura al salir.
 */
function openSquadModal() {
  const match = S.match;
  if (match.finished) return;
  const wasPaused = S.paused;
  S.paused = true;

  const previo = new Map(S.run.squad.map(p => [p, p.posJugada || null]));
  const once = S.matchCtx.lineup.slice();   // once previsualizado
  let banco = match.my.bench.slice();
  const pendientes = [];                    // [{ sale, entra }] cambios por confirmar

  const enOnce = p => once.includes(p);
  /** En el once previsualizado y en condiciones de jugar: un expulsado o lesionado no se mueve. */
  const activo = p => enOnce(p) && !p.expulsado && !p.lesionado;
  const restantes = () => match.subsLeft - pendientes.length;
  const hayPlan = () => pendientes.length > 0 || once.some(p => (p.posJugada || null) !== previo.get(p));

  /**
   * Qué significa arrastrar `a` sobre `b`, o null si no se puede:
   *  - dos titulares activos → REUBICAR: intercambian el puesto, gratis (azul).
   *  - banco → titular → CAMBIO: se suma al plan y gastará 1 de 3 (verde).
   * Las reglas del cambio las manda el motor (`eligibleFor`): el arco solo lo cubre un
   * arquero, un arquero no sale a la cancha, y el sustituido no reingresa.
   */
  const tipo = (a, b) => {
    if (match.finished) return null;
    if (activo(a) && activo(b)) {
      // El arco no se permuta: solo un arquero puede ocuparlo (game/lineup.canPlayAt).
      return canPlayAt(a, playedPos(b)) && canPlayAt(b, playedPos(a)) ? { tone: "sky", kind: "mover" } : null;
    }
    const sale = activo(a) ? a : activo(b) ? b : null;
    const entra = sale === a ? b : a;
    if (!sale || enOnce(entra) || restantes() <= 0) return null;
    // El que sale tiene que ser titular de verdad: no se encadenan cambios sobre un
    // jugador que recién metiste en el plan.
    if (!S.matchCtx.lineup.includes(sale)) return null;
    if (!match.availableBench().includes(entra) || !match.eligibleFor(sale).includes(entra)) return null;
    return { tone: "emerald", kind: "cambio", sale, entra };
  };

  const wrap = modal(`
    <div class="flex items-center justify-between gap-3 mb-3 flex-wrap">
      <h2 class="text-lg font-black">🔄 Gestión de plantilla</h2>
      <span class="text-xs text-slate-400">Cambios restantes: <b id="modal-subs" class="text-amber-300">${match.subsLeft}</b> de 3</span>
    </div>
    <div class="grid sm:grid-cols-[minmax(0,1fr)_11rem] gap-3 items-start">
      <div id="match-pitch" class="pitch relative w-full h-[22rem] rounded-xl overflow-hidden border-2 border-slate-900"></div>
      <div>
        <div class="text-[10px] uppercase tracking-widest text-slate-500 font-bold mb-1.5">Banco</div>
        <div id="match-bench" class="grid grid-cols-2 gap-1.5"></div>
      </div>
    </div>
    <div class="flex items-center gap-4 mt-3 text-[10px] text-slate-400 flex-wrap">
      <span class="flex items-center gap-1.5"><i class="w-3 h-3 rounded ring-2 ring-sky-400 inline-block"></i> Reubicar — gratis</span>
      <span class="flex items-center gap-1.5"><i class="w-3 h-3 rounded ring-2 ring-emerald-400 inline-block"></i> Cambio — gasta 1 de 3</span>
      <span class="flex items-center gap-1.5"><i class="text-orange-400 font-black">!</i> Fuera de puesto</span>
    </div>
    <div id="plan-resumen" class="mt-3"></div>
    <div class="grid grid-cols-2 gap-2 mt-3">
      <button id="squad-cancel" class="text-sm font-bold py-2.5 rounded-lg bg-slate-700 hover:bg-slate-600 cursor-pointer"></button>
      <button id="squad-ok" class="text-sm font-black py-2.5 rounded-lg tp-gradient cursor-pointer hover:brightness-110 transition-all"></button>
    </div>
  `, "max-w-3xl");

  const paint = () => {
    mountPitch({
      pitchEl: wrap.querySelector("#match-pitch"),
      benchEl: wrap.querySelector("#match-bench"),
      team: S.matchCtx.team,
      lineup: once,
      bench: banco,
      sizes: { sprite: "w-9 h-11", bench: "w-8 h-10" },
      badge: p => `${p.usado ? "🔄" : ""}${p.amarillaPartido ? "🟨" : ""}${p.expulsado ? "🟥" : ""}${p.lesionado ? "🚑" : ""}${p.sustituido ? "↩" : ""}`,
      extra: p => `<span class="block w-10 mx-auto mt-0.5">${energyBar(p.energia)}</span>`,
      muted: p => p.expulsado || p.lesionado || p.sustituido,
      draggable: p => activo(p) || (!enOnce(p) && match.availableBench().includes(p)),
      canSwap: tipo,
      onSwap: (a, b) => {
        const s = tipo(a, b);
        if (!s) return;
        if (s.kind === "mover") {
          if (!swapAssignments(a, b)) return toast("No pueden intercambiar ese puesto.");
        } else {
          once[once.indexOf(s.sale)] = s.entra;
          banco = banco.filter(x => x !== s.entra).concat(s.sale);
          // Previsualiza el puesto que ocupará: el mismo que le pondrá makeSub al confirmar.
          const puesto = s.sale.posJugada || s.sale.pos;
          s.entra.posJugada = canPlayAt(s.entra, puesto) ? puesto : s.entra.pos;
          pendientes.push({ sale: s.sale, entra: s.entra });
        }
        paint();
      },
    });
    wrap.querySelector("#modal-subs").textContent = restantes();
    renderPlan();
  };

  /** Resumen de lo que está por aplicarse: nada de esto pasó todavía. */
  const renderPlan = () => {
    const reubicados = once.filter(p => (p.posJugada || null) !== previo.get(p) && !pendientes.some(c => c.entra === p));
    wrap.querySelector("#plan-resumen").innerHTML = !hayPlan()
      ? `<p class="text-[11px] text-slate-500 text-center">Arrastra las fichas para armar los cambios. Nada se aplica hasta que confirmes.</p>`
      : `<div class="p-2 rounded-lg border border-amber-400/50 bg-amber-400/10 space-y-0.5">
          <div class="text-[10px] uppercase tracking-wider text-amber-300 font-black mb-1">Sin aplicar</div>
          ${pendientes.map(c => `<div class="text-[11px] text-slate-200">🔄 Entra <b>${c.entra.name}</b> por <b>${c.sale.name}</b>${
            outOfPosPenalty(c.entra) > 0 ? ` <span class="text-orange-400">— ❗ jugaría de ${POS_NAME[playedPos(c.entra)].toLowerCase()}</span>` : ""}</div>`).join("")}
          ${reubicados.map(p => `<div class="text-[11px] text-slate-200">📢 <b>${p.name}</b> pasa a ${POS_NAME[playedPos(p)].toLowerCase()}${
            outOfPosPenalty(p) > 0 ? ` <span class="text-orange-400">— ❗ no es su puesto</span>` : ""}</div>`).join("")}
        </div>`;
    const ok = wrap.querySelector("#squad-ok");
    const cancel = wrap.querySelector("#squad-cancel");
    ok.textContent = pendientes.length ? `✔ Confirmar (${pendientes.length} cambio${pendientes.length > 1 ? "s" : ""})` : "✔ Confirmar";
    ok.disabled = !hayPlan();
    ok.classList.toggle("opacity-40", !hayPlan());
    ok.classList.toggle("cursor-not-allowed", !hayPlan());
    cancel.textContent = hayPlan() ? "✕ Salir sin guardar" : "Volver al partido";
  };

  /** Aplica el plan al partido: primero los cambios, después las posiciones finales. */
  const confirmar = () => {
    // El plan manda: si el DT reubicó a alguien DESPUÉS de meterlo, makeSub le pondría el
    // puesto del que salió — por eso las posiciones finales se escriben al final.
    const posFinal = once.map(p => [p, p.posJugada || null]);
    const movidos = once.filter(p => (p.posJugada || null) !== previo.get(p) && !pendientes.some(c => c.entra === p));
    let fallidos = 0;
    for (const c of pendientes) if (!match.makeSub(c.sale, c.entra.name)) fallidos++;
    for (const [p, pos] of posFinal) p.posJugada = pos;
    for (const p of movidos) match.log("info", `📢 min ${match.min}' — ${p.name} pasa a ${POS_NAME[playedPos(p)].toLowerCase()}.`);
    closeModal();
    S.paused = wasPaused;
    updateMatchUI();
    if (fallidos) toast(`${fallidos} cambio(s) no se pudieron aplicar.`);
  };

  /** Sale sin tocar el partido: deshace las reubicaciones y tira el plan. */
  const cancelar = () => {
    for (const [p, pos] of previo) p.posJugada = pos;
    closeModal();
    S.paused = wasPaused;
  };

  paint();
  wrap.querySelector("#squad-ok").onclick = () => { if (hayPlan()) confirmar(); };
  wrap.querySelector("#squad-cancel").onclick = cancelar;
}

register("start-match", startMatch);
