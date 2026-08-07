/* ============================================================
   ui/screens/match/squad — LA GESTIÓN DE PLANTILLA EN VIVO: la
   misma cancha del hub, con el partido en pausa, para reubicar,
   cambiar el dibujo y hacer los cambios.

   Las reglas del cambio las manda el motor (Match.eligibleFor,
   makeSub, game/lineup): acá se arma un PLAN y nada toca el partido
   hasta Confirmar.

   Importa `updateMatchUI`/`startTimer` de la pantalla: ciclo
   BENIGNO, solo de runtime (ver tactics.js).
   ============================================================ */
import { playedPos, outOfPosPenalty } from "../../../game/ratings.js";
import { swapAssignments, canPlayAt, assignToFormation, FORMATIONS } from "../../../game/lineup.js";
import { teamPowers } from "../../../game/match/powers.js";
import { widthHint } from "../../../game/match/field.js";
import { S } from "../../session.js";
import { $, modal, closeModal, toast, energyBar, momentoChip } from "../../components.js";
import { mountPitch, POS_NAME } from "../../pitch.js";
import { updateMatchUI, startTimer } from "./index.js";

/* ---------- Gestión de plantilla en partido ---------- */

/**
 * Gestión de plantilla en vivo: la misma cancha del hub, con el partido en pausa.
 * Arrastrar titular sobre titular reubica (gratis); traer a alguien del banco es un cambio.
 *
 * NADA toca el partido hasta Confirmar: los cambios se arman como un plan y se aplican
 * juntos. Las reubicaciones sí mutan `posJugada` en el momento — es lo que la cancha lee
 * para previsualizar — y por eso se guarda el estado previo y se restaura al salir.
 */
export function openSquadModal(caido = null) {
  const match = S.match;
  if (match.finished) return;
  const wasPaused = S.paused;
  S.paused = true;

  const previo = new Map(S.run.squad.map(p => [p, p.posJugada || null]));
  const once = S.matchCtx.lineup.slice();   // once previsualizado
  let banco = match.my.bench.slice();
  const pendientes = [];                    // [{ sale, entra }] cambios por confirmar

  // EL DIBUJO (PO): la formación no se guarda en ningún lado durante el partido —
  // se DERIVA de dónde está parado cada uno (`playedPos`), que es la única verdad acá.
  // Así sigue siendo correcta tras un cambio, una reubicación a mano o una expulsión,
  // sin un campo más que mantener sincronizado.
  const dibujo = () => {
    const c = { DEF: 0, MED: 0, DEL: 0 };
    once.forEach(p => { if (c[playedPos(p)] !== undefined) c[playedPos(p)]++; });
    return `${c.DEF}-${c.MED}-${c.DEL}`;
  };
  const dibujoInicial = dibujo();
  // Poder del once tal como está AHORA (antes de que la vista previa toque un solo
  // posJugada): es el punto de comparación de todo lo que el DT pruebe en el modal.
  const poderPrevio = teamPowers(S.matchCtx.lineup, S.matchCtx.mentalidad, S.matchCtx.buffs);

  const enOnce = p => once.includes(p);
  /** En el once previsualizado y en condiciones de jugar: un expulsado o lesionado no se mueve. */
  const activo = p => enOnce(p) && !p.expulsado && !p.lesionado;
  /** Puede SALIR en un cambio: los activos y el lesionado aún en cancha (PO el
   *  caído se reemplaza acá, arrastrando un suplente sobre su ficha — no se reubica). */
  const puedeSalir = p => activo(p) || (enOnce(p) && p.lesionado && !p.sustituido);
  const restantes = () => match.subsLeft - pendientes.length;
  const hayPlan = () => pendientes.length > 0 || once.some(p => (p.posJugada || null) !== previo.get(p));

  /** El cambio pendiente cuyo ENTRANTE es p (si p entró al once solo en el plan). */
  const pendienteDe = p => pendientes.find(c => c.entra === p);

  /**
   * Qué significa arrastrar `a` sobre `b`, o null si no se puede:
   *  - dos titulares activos → REUBICAR: intercambian el puesto, gratis (azul).
   *  - banco → titular → CAMBIO: se suma al plan y gastará 1 de 3 (verde).
   *  - un ENTRANTE del plan → banco → EDITAR el plan, gratis (ámbar): sobre el que
   *    salía lo DESHACE; sobre otro suplente elegible, entra ese en su lugar.
   *    Mientras no se confirme, el plan es plastilina — nada se gastó todavía.
   * Las reglas del cambio las manda el motor (`eligibleFor`): el arco solo lo cubre un
   * arquero, un arquero no sale a la cancha, y el sustituido no reingresa.
   */
  const tipo = (a, b) => {
    if (match.finished) return null;
    if (activo(a) && activo(b)) {
      // Enrocar dos que juegan el MISMO puesto no cambia nada (mismas stats de posición):
      // se prohíbe para no ofrecer un gesto sin efecto (pedido del PO).
      if (playedPos(a) === playedPos(b)) return null;
      // El arco no se permuta: solo un arquero puede ocuparlo (game/lineup.canPlayAt).
      return canPlayAt(a, playedPos(b)) && canPlayAt(b, playedPos(a)) ? { tone: "sky", kind: "mover" } : null;
    }
    const sale = puedeSalir(a) ? a : puedeSalir(b) ? b : null;
    const entra = sale === a ? b : a;
    if (!sale || enOnce(entra)) return null;
    const plan = pendienteDe(sale);
    if (plan) {
      // Editar el plan no gasta ni consulta `restantes`: ese cambio ya estaba contado
      if (entra === plan.sale) return { tone: "amber", kind: "deshacer", plan };
      if (match.availableBench().includes(entra) && match.eligibleFor(plan.sale).includes(entra))
        return { tone: "amber", kind: "reemplazar", plan, entra };
      return null;
    }
    if (restantes() <= 0) return null;
    // El que sale tiene que ser titular de verdad: no se encadenan cambios sobre un
    // jugador que recién metiste en el plan (editar su cambio sí se puede, arriba).
    if (!S.matchCtx.lineup.includes(sale)) return null;
    if (!match.availableBench().includes(entra) || !match.eligibleFor(sale).includes(entra)) return null;
    return { tone: "emerald", kind: "cambio", sale, entra };
  };

  const wrap = modal(`
    <div class="flex items-center justify-between gap-3 mb-3 flex-wrap">
      <h2 class="text-lg font-black">🔄 Gestión de plantilla</h2>
      <span class="text-xs text-slate-400">Cambios restantes: <b id="modal-subs" class="text-amber-300">${match.subsLeft}</b> de 3</span>
    </div>
    ${caido ? `<div class="p-2.5 rounded-lg border border-red-400/60 bg-red-500/10 text-sm text-red-300 font-bold mb-3">🚑 ${caido.name} no puede continuar: arrastra un suplente sobre su ficha y confirma el cambio (o sal y juegan con uno menos).</div>` : ""}
    <!-- CAMBIAR EL DIBUJO EN PARTIDO (PO 28-jul): las 6 formaciones a un clic. No gasta
         cambio —es una reubicación masiva, la misma moneda que arrastrar una ficha— y
         tampoco toca QUIÉN juega: solo dónde se para cada uno. A diferencia del hub, acá
         NINGUNA está deshabilitada: si no tienes defensas para un 3-1-1, alguien juega
         fuera de puesto y paga su ❗ — que es exactamente la decisión del DT. -->
    <div class="flex items-center gap-1.5 mb-3 flex-wrap">
      <span class="text-[10px] uppercase tracking-widest text-slate-500 font-bold mr-1">Dibujo</span>
      ${FORMATIONS.map(f => `<button data-form="${f.id}" title="${f.def} defensa(s) · ${f.med} medio(s) · ${f.del} delantero(s)${
        widthHint(f.def, f.med, f.del).txt ? ` — ${widthHint(f.def, f.med, f.del).txt}` : ""}"
        class="form-btn px-2 py-1 rounded-lg text-[11px] font-black border cursor-pointer transition-colors"></button>`).join("")}
      <!-- El SALDO real del dibujo, en vivo (OJO: nada de backticks en estos comentarios,
           que viven dentro de un template literal y lo cortan). Nació como mitigación de un
           bug —el dial de formación estaba invertido— y se queda ahora que está arreglado,
           porque sigue siendo la información que el DT necesita: el nombre del dibujo dice
           la INTENCIÓN, el saldo dice lo que ESTE plantel puede ejecutar. Con dos defensas
           de verdad, un 3-1-1 puede salir peor que un 2-2-1, y eso solo se ve acá. -->
      <span id="poder-delta" class="text-[10px] font-bold ml-auto tabular-nums"></span>
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
      <span class="flex items-center gap-1.5"><i class="w-3 h-3 rounded ring-2 ring-amber-400 inline-block"></i> Ajustar un cambio sin aplicar — gratis</span>
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
      badge: p => `${momentoChip(p)}${p.usado ? "🔄" : ""}${p.amarillaPartido ? "🟨" : ""}${p.expulsado ? "🟥" : ""}${p.lesionado ? "🚑" : ""}${p.sustituido ? "↩" : ""}`,
      extra: p => `<span class="block w-10 mx-auto mt-0.5">${energyBar(p.energia)}</span>`,
      muted: p => p.expulsado || p.lesionado || p.sustituido,
      // Arrastrables: los activos del once previsualizado, el banco real disponible y
      // el que SALÍA en un cambio pendiente (vive en el banco de la vista previa y
      // tiene que poder volver — es la edición del plan).
      draggable: p => activo(p) || (!enOnce(p) && (match.availableBench().includes(p) || pendientes.some(c => c.sale === p))),
      canSwap: tipo,
      onSwap: (a, b) => {
        const s = tipo(a, b);
        if (!s) return;
        if (s.kind === "mover") {
          if (!swapAssignments(a, b)) return toast("No pueden intercambiar ese puesto.");
        } else if (s.kind === "deshacer") {
          // El cambio pendiente se anula entero: cada uno vuelve a donde estaba
          once[once.indexOf(s.plan.entra)] = s.plan.sale;
          banco = banco.filter(x => x !== s.plan.sale).concat(s.plan.entra);
          s.plan.entra.posJugada = previo.get(s.plan.entra) || null;
          pendientes.splice(pendientes.indexOf(s.plan), 1);
        } else if (s.kind === "reemplazar") {
          // Mismo cambio, otro protagonista: hereda el puesto que dejaba el anterior
          const puesto = s.plan.entra.posJugada || s.plan.entra.pos;
          once[once.indexOf(s.plan.entra)] = s.entra;
          banco = banco.filter(x => x !== s.entra).concat(s.plan.entra);
          s.plan.entra.posJugada = previo.get(s.plan.entra) || null;
          s.entra.posJugada = canPlayAt(s.entra, puesto) ? puesto : s.entra.pos;
          s.plan.entra = s.entra;
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
    paintFormBtns();
    renderPlan();
  };

  /**
   * Los 6 botones del dibujo (el vigente resaltado, derivado de la cancha) y el SALDO de
   * poder que deja la vista previa. El saldo se pinta siempre, no solo al tocar el dibujo:
   * mover una ficha a mano tiene el mismo efecto y merece la misma transparencia.
   */
  const paintFormBtns = () => {
    const ahora = teamPowers(once, S.matchCtx.mentalidad, S.matchCtx.buffs);
    const delta = (k, lbl) => {
      const d = ahora[k] - poderPrevio[k];
      if (Math.abs(d) < 0.005) return `<span class="text-slate-500">${lbl} =</span>`;
      return `<span class="${d > 0 ? "text-emerald-400" : "text-red-400"}">${lbl} ${d > 0 ? "+" : ""}${d.toFixed(2)}</span>`;
    };
    wrap.querySelector("#poder-delta").innerHTML = `${delta("atk", "⚔️")} &nbsp; ${delta("def", "🛡️")}`;
    const actual = dibujo();
    wrap.querySelectorAll(".form-btn").forEach(b => {
      const cur = b.dataset.form === actual;
      b.textContent = b.dataset.form;
      b.className = `form-btn px-2 py-1 rounded-lg text-[11px] font-black border cursor-pointer transition-colors ${
        cur ? "border-sky-400 bg-sky-400/20 text-sky-200" : "border-slate-600 bg-slate-800 text-slate-400 hover:border-sky-400/60 hover:text-slate-200"}`;
    });
  };

  /** Resumen de lo que está por aplicarse: nada de esto pasó todavía. */
  const renderPlan = () => {
    const reubicados = once.filter(p => (p.posJugada || null) !== previo.get(p) && !pendientes.some(c => c.entra === p));
    wrap.querySelector("#plan-resumen").innerHTML = !hayPlan()
      ? `<p class="text-[11px] text-slate-500 text-center">Arrastra las fichas para armar los cambios. Nada se aplica hasta que confirmes.</p>`
      : `<div class="p-2 rounded-lg border border-amber-400/50 bg-amber-400/10 space-y-0.5">
          <div class="text-[10px] uppercase tracking-wider text-amber-300 font-black mb-1">Sin aplicar</div>
          ${dibujo() !== dibujoInicial ? `<div class="text-[11px] text-slate-200">📐 Dibujo: <b>${dibujoInicial}</b> → <b class="text-sky-300">${dibujo()}</b></div>` : ""}
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
    // Un cambio de dibujo mueve hasta 5 fichas: se narra como UNA orden del banco, no como
    // cinco reubicaciones sueltas (que es como sigue narrándose mover a uno solo).
    if (dibujo() !== dibujoInicial) match.log("info", `📢 min ${match.clock()}' — El banco cambia el dibujo: ${dibujoInicial} → ${dibujo()}.`);
    else for (const p of movidos) match.log("info", `📢 min ${match.clock()}' — ${p.name} pasa a ${POS_NAME[playedPos(p)].toLowerCase()}.`);
    closeModal();
    S.paused = wasPaused;
    updateMatchUI();
    if (fallidos) toast(`${fallidos} cambio(s) no se pudieron aplicar.`);
    reanudar();
  }

  /** El reloj retoma al cerrar (el flujo de la lesión llega con el timer detenido).
   *  Mismo cuidado que tactics.js (bug fix,): esta pantalla también se abre
   *  desde `#btn-subs` en el ENTRETIEMPO (showHalftime invita a "hacer cambios" acá
   *  mismo) — y ahí el ÚNICO botón que puede reanudar es el dedicado del entretiempo,
   *  nunca el cierre de este modal. */
  const reanudar = () => { if (!match.finished && !match.decision && !S.halftime) startTimer(); };

  /** Sale sin tocar el partido: deshace las reubicaciones y tira el plan. */
  const cancelar = () => {
    for (const [p, pos] of previo) p.posJugada = pos;
    closeModal();
    S.paused = wasPaused;
    reanudar();
  };

  paint();
  wrap.querySelectorAll(".form-btn").forEach(b => b.onclick = () => {
    // La regla vive en game/lineup: quién va a qué puesto. Acá solo se escribe la vista
    // previa (posJugada), igual que una reubicación a mano — y como todo el plan, no toca
    // el partido hasta Confirmar.
    const map = assignToFormation(once, b.dataset.form);
    if (!map) return toast("Con este once no se puede armar ese dibujo.");
    for (const [p, pos] of map) p.posJugada = pos;
    paint();
  });
  wrap.querySelector("#squad-ok").onclick = () => { if (hayPlan()) confirmar(); };
  wrap.querySelector("#squad-cancel").onclick = cancelar;
}

