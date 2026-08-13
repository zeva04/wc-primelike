/* ============================================================
   ui/screens/hub — CONCENTRACIÓN MUNDIALISTA: la pantalla central entre partidos.

   ── EL REDISEÑO DEL 6-AGO-2026 ───────────────────────────────────────────────
   El hub dejó de ser un tablero de tarjetas y pasó a ser un LUGAR: una ciudad
   deportiva isométrica en pixel art donde cada edificio es una acción del día.
   Adaptado del diseño "Hub Mundial 2026" (Claude Design). Lo que cambió es la
   piel y la gramática espacial; ni una regla de juego se movió — las acciones,
   sus multiplicadores y lo que cuesta el día siguen viniendo de game/day-action.

   La idea de fondo: antes el DT leía una lista y elegía una fila. Ahora MIRA UN
   SITIO y decide a dónde lleva al plantel. La distinción entre lo que gasta el
   día y lo que es gratis, que era una etiqueta en una card, ahora es geografía —
   cuatro edificios se apagan cuando ya decidiste y dos siguen encendidos.

   ── LA CARPETA `hub/` ────────────────────────────────────────────────────────
     hub/complex.js  el complejo: los 6 edificios isométricos y el plano
     hub/hud.js      las franjas de arriba, la columna derecha y la barra de acción
     hub/panels.js   lo que abre un edificio que pide una elección más
     hub/day.js      calendario, Acción del Día y los modales de pasar de día
     hub/team.js     estado del equipo, altura de bloque, canjes
     hub/rival.js    informe del rival y la Oportunidad
   Acá quedan la COMPOSICIÓN, el cableado y el paso del día.
   ============================================================ */
import { getTeam } from "../../../data/teams-repo.js";
import { outOfPosPenalty } from "../../../game/ratings.js";
import { currentLineup, validateLineup, assignPositions, maxLineupSize } from "../../../game/lineup.js";
import { advanceDay, dayLabel } from "../../../game/calendar.js";
import { buildDaily } from "../../../game/daily.js";
import { applyDayAction, multLabel, actionMult, dayOpportunity } from "../../../game/day-action.js";
import { DAY_ACTIONS } from "../../../content/daily/day-actions.js";
import { computeTable } from "../../../game/tournament/groups.js";
import { nextOpponentId, STAGE_LABEL } from "../../../game/tournament/knockout.js";
import { oxidState } from "../../../game/oxidation.js";
import { S } from "../../session.js";
import { register, go } from "../../nav.js";
import { screenStage, $, closeModal, modalOpen, toast, momentoChip } from "../../components.js";
import { autoguardar } from "../../save.js";
import { mountPitch } from "../../pitch.js";
import { showScoutReport, showOppChooser } from "./rival.js";
import { alturaPicker, wireAlturaPicker, showCanje } from "./team.js";
import { showDaily, showDayEvent, showRandomEvent, bajasDelOnce } from "./day.js";
import { PLOTS, PLANO_H, complexGround, plotHtml } from "./complex.js";
import { barraOportunidad, cabecera, franjaAnfitriones, lineaDias, columnaDerecha, barraAccion } from "./hud.js";
import { panelFocos, panelPlan } from "./panels.js";
import { hojaPrevia, hojaResultado, animarHoja, fotoAntes } from "./confirm.js";

/**
 * Qué edificio ejecuta qué. `accion` resuelve en el clic; `panel` pide otra elección;
 * `inerte` es la parcela que todavía no decide nada.
 *
 * La Enfermería y la Sala de Scouting salieron del complejo el 10-ago-2026: no
 * abrían una decisión del día, solo navegaban a la Gestión de plantilla y al
 * Informe del rival, que están a un clic en la columna derecha (`#btn-squad`,
 * `#btn-scout`). Un edificio que duplica un botón ocupa una parcela y no agrega
 * ninguna elección.
 */
const EDIFICIOS = {
  campo: { titulo: "Campo de entrenamiento", grupo: "entrenar", panel: "focos",
    tip: "Sesión con foco: sube una stat del plantel hasta el próximo partido, a costa de energía." },
  video: { titulo: "Sala de video", grupo: "tactica", panel: "plan",
    tip: "Declará el plan: esa idea sale más seguido y rinde más experiencia en el partido." },
  residencia: { titulo: "Residencia", accion: "recuperar",
    tip: "Jornada de recuperación: el plantel entero recupera energía." },
  asado: { titulo: "Patio · asado", accion: "bonding",
    tip: "Jornada de integración: sube la moral del grupo, cansa un poco las piernas." },
  estacionamiento: { titulo: "Estacionamiento", inerte: true,
    tip: "El micro del plantel, parado junto al portón. Por ahora no hay nada que decidir acá." },
};

// Qué panel hay abierto (null = ninguno). Vive fuera del render porque un re-pintado
// tras comprar/canjear no debe cerrar el panel que el DT tenía abierto.
let panelAbierto = null;
// La hoja de confirmación (hub/confirm), en uno de sus dos estados. `confirmando`
// es la acción que se está mirando ANTES de gastar el día; `resultado` es la foto
// del antes que la hoja usa para animar lo que ya pasó. Nunca los dos a la vez.
let confirmando = null;
let resultado = null;
let desengancharResize = null;

/**
 * Pasa al día siguiente: lo resuelve el motor (advanceDay), re-pinta el hub y abre la
 * portada del Daily; al cerrarla llega el evento/conflicto (o el toast de día de partido).
 * Lo usan el botón del hub y la vuelta del partido (el partido consume su día, así que al
 * volver arranca el día siguiente — no el del partido).
 */
function pasarDia() {
  // Guarda anti doble-día (bug del PO, "a veces doble evento"). Todo camino legítimo hasta
  // acá deja la pantalla SIN modal; si hay uno abierto es porque la cadena Daily→evento de
  // este día ya está en curso y el disparo es repetido (doble clic).
  if (modalOpen()) return;
  const bajasPre = bajasDelOnce().length;
  const res = advanceDay(S.run);
  if (!res) { renderHub(); return; }
  panelAbierto = confirmando = resultado = null;
  // EL AUTOGUARDADO (decisión PO): la ranura se escribe al terminar cada día, y este
  // es el único sitio del juego donde un día termina — lo llama tanto el botón del
  // hub como la vuelta del partido (`autoAdvance`), así que un partido jugado queda
  // guardado por el mismo caño. Va ANTES de repintar: si el navegador rechaza la
  // escritura (cuota llena, modo privado), el aviso sale sobre la pantalla ya nueva.
  const guardado = S.slot == null || autoguardar();
  renderHub();
  if (!guardado) toast("⚠️ No se pudo guardar la partida: el navegador rechazó la escritura.");
  // Bible §4.4: el día arranca con el Daily (informa); el evento llega después (transforma)
  // showDaily NO cierra su propio modal: el que encadena decide. Los dos modales que
  // siguen abren el suyo (y `modal()` cierra el anterior); los otros dos caminos —día de
  // partido y día tranquilo— tienen que cerrarlo a mano o el diario se queda pegado.
  showDaily(buildDaily(S.run), () => {
    if (res.type === "evento") showDayEvent(res, bajasPre);
    else if (res.type === "conflicto") showRandomEvent(res);
    else {
      closeModal();
      if (res.type === "match") toast(`⚽ ${dayLabel(S.run.day)} — ¡Día de partido!`);
    }
  });
}

/** Los avisos de la columna derecha, del más bloqueante al más ambiental. */
function construirAvisos(v, discipline, fueraDePuesto, forma, bajasOnce) {
  const run = S.run;
  const a = [];
  const rojo = { col: "var(--px-bad)", bg: "#2a0f13", txtCol: "#f0d5d5" };
  const ambar = { col: "var(--px-warn)", bg: "#221a08", txtCol: "#f5dfa8" };
  const verde = { col: "var(--px-ok)", bg: "#0d2019", txtCol: "#c9efdd" };

  if (bajasOnce.length) a.push({ ...rojo, fuerte: true, ico: "lesion", titulo: "Baja en el once",
    txt: `${bajasOnce.map(p => p.name).join(", ")} — elegí su reemplazo` });
  if (!v.ok) a.push({ ...ambar, ico: "amarilla", txt: v.msg });
  else if (v.short) a.push({ ...ambar, ico: "lesion", txt: `Plantel diezmado: presentás ${S.selectedLineup.length}` });
  if (fueraDePuesto.length) a.push({ ...ambar, ico: "ritmo", txt: `Fuera de puesto: ${fueraDePuesto.map(p => p.name).join(", ")}` });
  if (discipline.susp.length) a.push({ ...rojo, ico: "roja", txt: `Suspendido${discipline.susp.length > 1 ? "s" : ""}: ${discipline.susp.map(p => p.name).join(", ")}` });
  if (discipline.aperc.length) a.push({ ...ambar, ico: "amarilla", txt: `${discipline.aperc.length} apercibido${discipline.aperc.length > 1 ? "s" : ""} — con otra amarilla se lo pierden` });
  const ox = oxidState(run);
  if (ox.oxidado) a.push({ ...ambar, ico: "ritmo", txt: `Plantel oxidado: ${ox.racha} días sin entrenar` });
  if (forma.racha.length) a.push({ ...verde, ico: "racha", txt: `En racha: ${forma.racha.map(p => p.name).join(", ")}` });
  if (forma.frios.length) a.push({ col: "var(--px-free)", bg: "#0d1b24", txtCol: "#cfe4f5", ico: "frio", txt: `Fríos: ${forma.frios.map(p => p.name).join(", ")}` });
  return a;
}

/** El estado de cada parcela, derivado del run — nunca de la UI. */
function estadoDeParcelas(isMatchDay) {
  const run = S.run;
  const elegidoHoy = !run.actionPending && run.lastAction?.day === run.day;
  const grupoElegido = elegidoHoy ? run.lastAction.group : null;
  const idElegido = elegidoHoy ? run.lastAction.id : null;

  return PLOTS.map(def => {
    const e = EDIFICIOS[def.id];
    // La parcela INERTE no tiene estado que derivar: no gasta el día, no se apaga
    // cuando ya decidiste y no se bloquea el día del partido. Está y punto.
    if (e.inerte) return { def, st: { titulo: e.titulo, tip: e.tip, inerte: true } };
    // Una acción de referencia del edificio, para leerle el multiplicador del día.
    const ref = e.accion ? DAY_ACTIONS.find(x => x.id === e.accion) : DAY_ACTIONS.find(x => x.group === e.grupo);
    const mult = e.libre || !ref ? 1 : actionMult(run, ref);
    const mine = !e.libre && (e.grupo ? grupoElegido === e.grupo : idElegido === e.accion);
    return {
      def,
      st: {
        titulo: e.titulo,
        // El tooltip DICE el multiplicador cuando lo hay: es la información que
        // convierte el mapa en una decisión y no en una lista de puertas.
        tip: mult === 0 ? "Hoy no se puede: el día lo impide." : e.tip + (mult !== 1 ? ` · <b style="color:#F0D97D">${multLabel(mult)} hoy</b>` : ""),
        free: !!e.libre,
        boost: mult > 1,
        // El día del partido lo que gasta el día ya no se puede: no hay decisión que tomar.
        locked: !e.libre && (mult === 0 || isMatchDay),
        off: !e.libre && elegidoHoy && !mine,
        mine,
      },
    };
  });
}

export function renderHub(opts = {}) {
  // Al volver de un partido el día ya se jugó: se avanza al siguiente en vez de
  // quedarse en el hub del día del partido (evita re-mostrar ese día).
  if (opts.autoAdvance) { pasarDia(); return; }
  const run = S.run;
  const me = getTeam(run.teamId);
  const oppId = nextOpponentId(run);
  const opp = getTeam(oppId);
  const isMatchDay = run.day >= run.nextMatchDay;
  const grupo = run.groups[run.myGroupIdx];
  const stageTxt = run.stage === "groups"
    ? `Fase de grupos · Fecha ${run.matchday + 1} de 3 · Grupo ${grupo.name}`
    : STAGE_LABEL[run.stage];

  const available = run.squad.filter(p => !p.suspendido && p.lesionadoPartidos === 0);
  // Las BAJAS del once NO se auto-reemplazan (PO): el caído queda a la vista y el DT arma
  // el reemplazo a mano. La válvula automática queda SOLO para el plantel diezmado.
  const conBaja = (S.selectedLineup || []).some(p => p.suspendido || p.lesionadoPartidos > 0);
  if (conBaja && maxLineupSize(available) >= 6) assignPositions(run.squad, S.selectedLineup, S.formation);
  else ({ lineup: S.selectedLineup, formationId: S.formation } = currentLineup(run.squad, S.selectedLineup, S.formation));
  const bajasOnce = S.selectedLineup.filter(p => p.suspendido || p.lesionadoPartidos > 0);
  const v = validateLineup(available, S.selectedLineup);
  const discipline = { susp: run.squad.filter(p => p.suspendido), aperc: run.squad.filter(p => p.amarillas > 0 && !p.suspendido) };
  const fueraDePuesto = S.selectedLineup.filter(p => outOfPosPenalty(p) > 0);
  const forma = { racha: run.squad.filter(p => (p.momento ?? 4) >= 6), frios: run.squad.filter(p => (p.momento ?? 4) <= 2) };
  const avisos = construirAvisos(v, discipline, fueraDePuesto, forma, bajasOnce);
  const tabla = computeTable(grupo).map(r => ({
    name: getTeam(r.id).name, pj: r.pj, dg: r.gf - r.gc, pts: r.pts, mine: r.id === run.teamId,
  }));

  const parcelas = estadoDeParcelas(isMatchDay);
  const elegidoHoy = !run.actionPending && run.lastAction?.day === run.day;
  const listoParaJugar = v.ok && !bajasOnce.length;
  const cta = isMatchDay
    ? { id: "btn-play", ico: "balon", label: "Jugar partido →" }
    : { id: "btn-nextday", ico: "luna", label: "Pasar al día siguiente →" };
  const ayuda = isMatchDay
    ? (listoParaJugar ? "El once está listo — a la cancha" : "Resolvé las bajas del once antes de jugar")
    : (elegidoHoy ? `Acción tomada: ${EDIFICIOS[Object.keys(EDIFICIOS).find(k => (EDIFICIOS[k].grupo && EDIFICIOS[k].grupo === run.lastAction.group) || EDIFICIOS[k].accion === run.lastAction.id) || "campo"].titulo}` : "Primero elegí la acción del día");

  desengancharResize = screenStage(`
    ${barraOportunidad()}
    ${cabecera(me, stageTxt)}
    ${franjaAnfitriones()}
    ${lineaDias(opp)}

    <!-- EL COMPLEJO. El mapa es el fondo REAL de esta franja (no una card): los
         edificios se posicionan en absoluto sobre él y la columna del HUD flota
         encima, a la derecha, sin llegar a pisarlos. -->
    <div class="relative flex-1" style="min-height:0;overflow:hidden">
      ${complexGround()}
      <div class="px absolute flex items-center gap-2.5" style="left:16px;top:12px;z-index:35;font-size:11px;letter-spacing:.12em;color:var(--wc-gold-light);background:rgba(11,11,14,.7);border:2px solid rgba(11,11,14,.9);padding:4px 8px">
        El complejo
        <span class="px-body" style="font-size:13px;letter-spacing:.08em;color:var(--px-dim);text-transform:uppercase">${isMatchDay
          ? "Hoy se juega · el complejo cierra"
          : elegidoHoy ? "Ya decidiste: el resto queda para otro día" : "¿A dónde llevás al plantel hoy?"}</span>
      </div>
      <!-- EL PLANO: las parcelas comparten con las calles un sistema de coordenadas
           propio de 1440×PLANO_H anclado ABAJO. Sin esta caja, las posiciones se
           medirían contra un alto que cambia según haya Oportunidad o no, y la fila
           de abajo se saldría de la pantalla. -->
      <div class="absolute" style="left:0;right:0;bottom:0;height:${PLANO_H}px">
        ${parcelas.map(p => plotHtml(p.def, p.st)).join("")}
      </div>
      ${panelAbierto === "focos" ? panelFocos() : panelAbierto === "plan" ? panelPlan() : ""}
      <!-- La hoja de confirmación va SOBRE todo lo demás (su velo incluido): mientras
           está abierta, la única decisión posible es confirmar o cancelar. -->
      ${confirmando ? hojaPrevia(confirmando) : resultado ? hojaResultado(resultado) : ""}
      ${isMatchDay ? `<div class="px-panel absolute" style="left:24px;bottom:16px;width:420px;z-index:35;padding:10px 12px">
        <div class="px" style="font-size:10px;letter-spacing:.1em;color:var(--wc-gold-light)">Altura del bloque</div>
        <div class="mt-2">${alturaPicker()}</div>
      </div>` : ""}
      ${columnaDerecha(opp, avisos, tabla, `Grupo ${grupo.name}`)}
    </div>

    ${barraAccion({
      listo: isMatchDay ? listoParaJugar : !run.actionPending,
      ayuda, ayudaOk: isMatchDay ? listoParaJugar : elegidoHoy, cta,
    })}

    <div class="px-scan"></div>
    <div class="px-vig"></div>
  `);
  window.onresize = desengancharResize;

  // La cancha del panel "Mi equipo": solo lectura, clic → Gestión de Plantilla.
  mountPitch({
    pitchEl: $("#hub-pitch"), team: me, lineup: S.selectedLineup, bench: [], selected: null,
    sizes: { sprite: "w-5 h-6", bench: "w-5 h-6" },
    draggable: () => false, canSwap: () => null, onSelect: () => {},
    badge: p => momentoChip(p) + (p.suspendido ? "🟥" : p.lesionadoPartidos > 0 ? "🚑" : p.amarillas > 0 ? "🟨" : ""),
    muted: p => p.suspendido || p.lesionadoPartidos > 0,
  });

  /* ── Cableado ────────────────────────────────────────────────────────────── */
  const on = (sel, fn) => { const el = $(sel); if (el) el.onclick = fn; };

  on("#hub-pitch", () => go("squad"));
  on("#btn-squad", () => go("squad"));
  on("#px-mas", () => go("squad"));
  on("#btn-scout", () => showScoutReport(oppId));
  on("#px-journal", () => go("journal", "hub"));
  on("#px-world", () => go("worldcup"));
  on("#btn-scorers", () => go("scorers"));
  on("#btn-filo", () => go("philosophy"));
  on("#px-abandon", () => { if (confirm("¿Abandonar el torneo? La partida terminará.")) go("end-run", false, true); });
  on("#px-opp", () => {
    const o = dayOpportunity(S.run);
    if (!o) return;
    if (o.choose) { showOppChooser(o); return; }
    const res = applyDayAction(S.run, o.id);
    if (!res) return;
    toast(`${res.icon} ${res.title}: ${res.desc}`);
    panelAbierto = null;
    renderHub();
  });

  // LOS EDIFICIOS. Uno solo de los dos caminos: abrir panel o ejecutar la acción.
  // El bloqueado no hace nada — su tooltip ya dijo por qué; el inerte tampoco.
  document.querySelectorAll("[data-plot]").forEach(el => el.onclick = () => {
    const id = el.dataset.plot;
    const e = EDIFICIOS[id];
    if (e.inerte || el.hasAttribute("data-locked")) return;
    if (el.hasAttribute("data-off")) return;            // ya decidiste: gastar el día otra vez, no
    if (e.panel) { panelAbierto = el.hasAttribute("data-mine") ? null : e.panel; renderHub(); return; }
    aplicar(e.accion);
  });

  // Las opciones DENTRO de un panel (los 5 focos, las 4 filosofías).
  document.querySelectorAll(".da-opt").forEach(b => b.onclick = () => aplicar(b.dataset.action));
  on("#px-sheet-x", () => { panelAbierto = null; renderHub(); });

  // LA HOJA DE CONFIRMACIÓN. Cancelar no toca el run: el día sigue entero.
  on("#pxc-cancel", () => { confirmando = null; renderHub(); });
  on("#pxc-ok", () => confirmar());
  on("#pxc-close", () => { resultado = null; renderHub(); });
  if (resultado) animarHoja();

  document.querySelectorAll(".canje-opt").forEach(b => b.onclick = () => showCanje(b.dataset.key));

  if (isMatchDay) {
    wireAlturaPicker();
    on("#btn-play", () => {
      if (validateLineup(available, S.selectedLineup).ok && !S.selectedLineup.some(p => p.suspendido || p.lesionadoPartidos > 0)) go("start-match", oppId);
    });
  } else if (!run.actionPending) {
    on("#btn-nextday", pasarDia);
  }

  /**
   * Abre la hoja de confirmación de una acción del día. Nada se aplica todavía: lo
   * que gasta el día se mira con números antes de gastarlo (hub/confirm).
   */
  function aplicar(actionId) {
    confirmando = { id: actionId };
    renderHub();
  }

  /**
   * Confirma lo que la hoja venía mostrando. El orden importa: primero la FOTO del
   * antes (con el run todavía intacto), después el motor. La hoja pasa a su cara de
   * resultado y anima desde esa foto hasta lo que ya es verdad.
   */
  function confirmar() {
    const foto = fotoAntes(confirmando.id);
    const a = applyDayAction(S.run, confirmando.id);
    confirmando = null;
    if (!a) { renderHub(); return; }        // el motor la rechazó: no hay nada que cantar
    panelAbierto = null;
    resultado = foto;
    renderHub();
  }
}

register("hub", renderHub);
