/* La pantalla de IDENTIDAD: LA PIZARRA DEL DT.

   Dos cosas y nada más: el HUD de estado arriba y la pizarra táctica (ui/board.js), donde
   el árbol de rasgos se dibuja sobre una cancha. Los 5 principios viven en la franja de
   cabecera de la pizarra, y los counters y el fútbol superior en las notas del DT, que se
   leen en el riel al tocar la chincheta.

   El detalle de cada rasgo NO se muestra en reposo (el nodo es ícono + nombre): se abre al
   tocarlo, la cámara hace zoom sobre él y la ficha entra por el riel de la derecha con
   desc, momento, faltas y la compra. Esa es la única profundidad de la pantalla.

   Doble modo: pantalla normal desde el hub, y ONBOARDING en el flujo de inicio (elegir
   filosofía trae acá con 1 PI para el 1-de-3 de rasgos básicos; el botón sigue al sorteo). */
import { getPhilosophy, FILO_LEVELS, FILO_ETAPAS, AFINIDAD_LABEL, afinidadMult } from "../../content/identity/philosophies.js";
import { ADVANCED_BY_FILO } from "../../content/match/sequences.js";
import { RAMA_LABELS, DEEP_TRAIT } from "../../content/traits/index.js";
import { filoPoints, filoLevel } from "../../game/philosophy.js";
import { dtProgress, DT_MAX } from "../../game/coach.js";
import { traitTree, buyTrait, traitCost } from "../../game/traits.js";
import { S } from "../session.js";
import { register, go } from "../nav.js";
import { screenFull, $, hudGauge } from "../components.js";
import { showFiloChange } from "../filo-change.js";
import { tacticBoard, nodePos, camTransform, markerColor, TIER_LABEL, NOTES_ID, notesBlocks } from "../board.js";

const MAGNETS = `<span class="tb-magnet" style="left:9px"></span><span class="tb-magnet" style="right:9px"></span>`;

/**
 * La ficha del rasgo, escrita en EL RIEL DEL PIZARRÓN.
 * Lo narrativo (nombre, descripción, su momento) va en tiza sobre la misma
 * superficie del tablero; lo funcional (requisitos y compra) va en una ETIQUETA
 * IMANTADA — el único objeto que puede permitirse alto contraste, porque es lo
 * que hay que poder tocar.
 *
 * El bloque de acción va PEGADO AL FONDO (`mt-auto`): así el botón aterriza en
 * el mismo píxel para todos los rasgos, largos o cortos. Esa es la "elegancia
 * equidistante y firme" — la ficha ya no baila según cuánto texto traiga.
 *
 * El requisito de principio AJENO se anota en el color de ESE principio (regla
 * de color del sprint: el color es información — "esto está escrito con un
 * marcador que no es el tuyo").
 */
function traitCard(t, f, run, color) {
  const isMaster = t.tier === "master";
  const ink = isMaster && t.owned ? "#fbbf24" : color;

  // El precio es un dato del rasgo, no del botón: se muestra siempre (tuyo,
  // comprable o bloqueado) y sale de game/traits — el día que un rasgo valga 2 PI,
  // la ficha, la validación y el cobro dicen lo mismo sin tocar nada acá.
  const costo = traitCost(t);
  const precio = `<div class="flex items-baseline justify-between mb-2.5">
    <span class="chalk-hand text-[14px] text-[#dff0e5]/55">Costo del rasgo</span>
    <span class="text-[13px] font-black tracking-wide" style="color:${ink}">${costo} PI</span>
  </div>`;

  const accion = t.owned
    ? `<div class="tb-plate">${MAGNETS}
        <div class="text-[10.5px] font-black uppercase tracking-[.18em]" style="color:${ink}">✓ Ya es parte de tu fútbol</div>
        ${isMaster ? `<p class="chalk-hand text-[13.5px] text-amber-200/90 leading-snug mt-2">📰 La prensa le puso nombre a tu estilo: muy pocos DTs llegaron a jugar así.</p>` : ""}
      </div>`
    : t.buyable
      ? `<button data-buy="${t.id}" class="tb-cta" style="--ink:${ink}">${MAGNETS}
          ${isMaster ? "👑 CONSAGRAR LA DOCTRINA" : "INCORPORAR LA IDEA"}</button>`
      : `<div class="tb-plate">${MAGNETS}
          <div class="chalk-hand text-[14px] text-[#dff0e5]/55 mb-2">Para dibujarla te falta</div>
          <ul class="space-y-1.5">${t.faltas.map(x => `<li class="text-[11.5px] text-[#dff0e5]/75 flex gap-2">
            <span style="color:${ink}">·</span><span>${x}</span></li>`).join("")}</ul>
        </div>`;

  return `<button id="tb-close" class="absolute top-2.5 right-4 chalk-hand text-[24px] leading-none text-white/30 hover:text-white/80 cursor-pointer">×</button>

    <div class="text-[9px] font-black uppercase tracking-[.22em]" style="color:${ink}a6">
      ${TIER_LABEL[t.tier]}${RAMA_LABELS[t.rama] ? ` · ${RAMA_LABELS[t.rama].label}` : " · converge los 3 carriles"}
    </div>
    <div class="flex items-center gap-3 mt-2.5">
      <span class="text-[32px] leading-none">${t.icon}</span>
      <h2 class="text-[17px] font-black leading-tight" style="color:${t.owned ? "#eef7f1" : ink}">${t.nombre}</h2>
    </div>

    <div class="tb-chalkline my-4"></div>

    <p class="text-[12.5px] leading-relaxed text-[#dff0e5]/85">${t.desc}</p>
    <p class="chalk-hand text-[16px] leading-snug mt-4" style="color:${ink}">“${t.momento}”</p>

    <div class="mt-auto pt-5">
      ${precio}
      ${accion}
    </div>`;
}

/**
 * Las NOTAS DEL DT en el riel. En la cancha son solo una chincheta; su contenido se lee
 * acá, el mismo panel donde se leen las fichas de rasgos y con la misma tipografía de
 * tiza. Un solo lugar en la pantalla donde vive el texto largo.
 */
function notesCard(f, adv, deep, deepOwned, etapa, color) {
  const TONE = { ok: ["✓", "#86efac"], warn: ["⚠", "#fdba74"], info: ["🎯", "#fde68a"] };
  return `<button id="tb-close" class="absolute top-2.5 right-4 chalk-hand text-[24px] leading-none text-white/30 hover:text-white/80 cursor-pointer">×</button>

    <div class="text-[9px] font-black uppercase tracking-[.22em]" style="color:${color}a6">apuntes · ${f.name}</div>
    <div class="flex items-center gap-3 mt-2.5">
      <span class="text-[32px] leading-none">📌</span>
      <h2 class="text-[17px] font-black leading-tight text-[#eef7f1]">Notas del DT</h2>
    </div>

    <div class="tb-chalkline my-4"></div>

    ${notesBlocks(f, adv, deep, deepOwned, etapa).map(b => `<p class="chalk-hand text-[15.5px] leading-snug mb-3.5 flex gap-2.5">
      <span style="color:${TONE[b.tone][1]}">${TONE[b.tone][0]}</span>
      <span style="color:${TONE[b.tone][1]}">${b.txt}</span></p>`).join("")}`;
}

function renderPhilosophy(opts = {}, selected = null) {
  const run = S.run;
  // ARBOLES NAVEGABLES: las 4 filosofías progresan a la vez, así
  // que la pizarra muestra la que estés MIRANDO (`opts.view`), no solo la que juegas.
  // La franja de cabecera del tablero es el selector.
  const viewId = opts.view && getPhilosophy(opts.view) ? opts.view : run.filoId;
  const f = getPhilosophy(viewId);
  if (!f) { go("hub"); return; }              // sin identidad no hay pizarra
  const tree = traitTree(run, viewId);
  const color = markerColor(f);
  const pts = filoPoints(run, viewId);
  const lvl = filoLevel(run, viewId);         // nivel 0..9 de la filosofía mirada
  const etapa = FILO_LEVELS[lvl].etapa;       // etapa 0..2 (los hitos de siempre)
  const nivel = FILO_LEVELS[lvl];
  const next = FILO_LEVELS[lvl + 1] || null;
  const adv = ADVANCED_BY_FILO[f.id];         // la secuencia avanzada de esa identidad
  const deep = DEEP_TRAIT[f.id];              // el rasgo que la profundiza (migración F2, T2)
  const deepOwned = (run.rasgos?.[f.id] || []).includes(deep.id);
  const dt = dtProgress(run);
  const afin = afinidadMult(run.filoInicial, viewId);
  const jugando = viewId === run.filoId;
  // Progreso hacia el próximo umbral desde el piso del nivel actual (para que la barra
  // no nazca medio llena al subir de nivel).
  const nivelPct = next ? (100 * (pts - nivel.min)) / (next.min - nivel.min) : 100;
  const oro = etapa === 2 ? "#fbbf24" : color;
  // Volver a elegir identidad. En ONBOARDING es gratis y literal (nada se gastó
  // todavía: se rehace la run del mismo equipo y vuelves al selector). En run
  // abre el modal compartido, donde la regla manda: changePhilosophy exige y
  // consume la Acción del Día — si ya la usaste hoy, el enlace lo dice y no miente.
  const cambioTxt = opts.onboarding
    ? { label: "Elegir otra identidad", title: "Vuelve al selector — todavía no gastaste nada" }
    : run.actionPending
      ? { label: "Cambiar identidad", title: "Cuesta la Acción del Día" }
      : { label: "Cambiar identidad", title: "Ya usaste la Acción del Día: mañana" };

  screenFull(`
    <!-- EL HUD: UNA fila de altura fija con tres piezas de gramática distinta.
           · IDENTIDAD  (quién sos: icono, nombre, lema)
           · MEDIDORES  (cuánto avanzaste: dos gauges idénticos, DT y filosofía)
           · RECURSO    (qué podés gastar: los PI, en su placa dorada)
         Los multiplicadores son chips-buff con tooltip, no prosa. El pie del gauge trae
         el XP vivo (7/250) y no "nivel 2 a los 250", que obliga a restar de cabeza. -->
    <!-- El HUD y la pizarra comparten ANCHO (lo ajusta fitBoard(), abajo): sin eso la
         barra sobresalía ~100px a cada lado del tablero y los dos bloques se leían
         como dos pantallas distintas en vez de una. -->
    <div id="filo-fit" class="flex flex-col h-full w-full mx-auto">
    <div class="hud shrink-0">
      <span class="text-[26px] leading-none">${f.icon}</span>
      <!-- El bloque de identidad va ACOTADO: el lema es el texto más largo del HUD y
           sin techo empujaba la barra a dos filas, que a su vez le comía alto a la
           pizarra. Truncado con su tooltip: el lema se lee entero al pasar el mouse. -->
      <div class="min-w-0 mr-1 max-w-[15rem]">
        <div class="flex items-baseline gap-2">
          <h1 class="text-2xl font-black leading-none tracking-tight truncate">${f.name}</h1>
          <!-- El aviso existe SOLO en el caso anómalo: si estás mirando un árbol que
               no es el que juegas. Un chip permanente que el 90% del tiempo dice lo
               obvio es ruido (decisión PO 5-ago: fuera "la que juegas"). -->
          ${jugando ? "" : `<span class="text-[10px] font-black uppercase tracking-[.16em] text-amber-400/80 shrink-0">solo mirando</span>`}
        </div>
        <p class="tip tip-b text-xs text-slate-500 truncate mt-1" data-tip="${f.lema}">${f.lema}</p>
      </div>

      <!-- El DT no se muestra en el ONBOARDING: recién empieza (nivel 1, sin XP) y ahí
           lo único que se decide es la identidad y el primer PI. Además su hueco es
           justo el que necesita el CTA "Al sorteo" para que el HUD entre en una fila. -->
      ${opts.onboarding ? "" : `<div class="hud-sep ml-auto"></div>
      ${hudGauge({ label: "Director técnico", color: "#38bdf8", lvl: run.dtNivel || 1, max: DT_MAX,
        pct: dt.pct, foot: dt.need ? `${dt.curr} / ${dt.need} XP` : "tope alcanzado" })}`}

      <div class="hud-sep ${opts.onboarding ? "ml-auto" : ""}"></div>
      ${hudGauge({ label: FILO_ETAPAS[etapa].label, color: oro, lvl: lvl + 1, max: 10, pct: nivelPct,
        foot: next ? `${pts} / ${next.min} XP` : "la idea ya es ley", w: "11rem",
        chips: [
          { txt: `×${nivel.mult}`, tip: `Potencia de su jugada firma · nivel ${lvl + 1}` },
          { txt: `×${afin}`, tip: `Aprende ${AFINIDAD_LABEL[afin] || "neutral"}` },
        ] })}

      <div class="hud-sep"></div>
      <div class="hud-res tip tip-b" data-tip="Puntos de Identidad: se gastan en la pizarra">
        <span class="text-[17px] font-black ${run.identityPoints > 0 ? "text-amber-300" : "text-slate-600"}">${run.identityPoints || 0}</span>
        <span class="text-[10px] font-black uppercase tracking-[.14em] leading-tight text-amber-200/70">Puntos<br>Identidad</span>
      </div>

      <div class="flex items-center gap-2">
        <button id="btn-filo" class="hud-btn tip tip-b ${opts.onboarding || run.actionPending ? "" : "opacity-40 cursor-not-allowed"}"
          data-tip="${cambioTxt.title}">↩ ${opts.onboarding ? "Otra" : "Cambiar"}</button>
        ${opts.onboarding
          ? `<button id="btn-continue" class="btn-primary text-sm ${run.identityPoints > 0 ? "opacity-40 cursor-not-allowed" : ""}"
              title="${run.identityPoints > 0 ? "Primero incorpora tu primera idea: elige uno de los tres rasgos básicos" : ""}">Al sorteo →</button>`
          : `<button id="btn-back" class="hud-btn tip tip-b" data-tip="Volver al hub">←</button>`}
      </div>
    </div>

    <!-- LA PIZARRA. Sin instrucciones escritas: el onboarding se resuelve solo con
         los tres círculos que laten en campo propio y el contador de PI del HUD. El
         riel de la derecha entra al enfocar un rasgo; la cámara encuadra el nodo al
         29% del ancho justamente para dejarle ese cuarto del tablero libre.
         El tablero manda por ALTO (el SVG es h-full y deriva su ancho del viewBox):
         así la pizarra llena lo que le sobra a la pantalla y nunca la desborda. -->
    <div class="flex-1 min-h-0 flex justify-center mt-3">
      <div class="board-frame relative h-full">
        ${tacticBoard(run, f, tree, { adv, deep, deepOwned, etapa, selected })}
        <div id="tb-rail" class="tb-rail"></div>
      </div>
    </div>
    </div>
  `);

  /**
   * Iguala el ancho del HUD al de la pizarra. El tablero manda por ALTO (llena lo que
   * le sobra a la pantalla) y su ancho sale del aspecto del viewBox, 1200×700 = 12/7.
   * El alto del HUD se MIDE en vez de constantear: si en una ventana angosta envuelve
   * a dos filas, el cálculo sigue siendo exacto. Dos pases porque son mutuamente
   * dependientes — al angostar el contenedor el HUD puede envolver y cambiar de alto.
   */
  function fitBoard() {
    const wrap = $("#filo-fit"), hudEl = wrap.querySelector(".hud");
    const libre = wrap.clientHeight - hudEl.offsetHeight - 12;   // 12 = el hueco (mt-3)
    wrap.style.maxWidth = `${Math.min(1280, (libre * 12) / 7)}px`;
  }
  fitBoard();
  requestAnimationFrame(fitBoard);

  const svg = $("#tb-svg"), cam = $("#tb-cam"), card = $("#tb-rail");

  /**
   * Abre un nodo: la cámara le hace zoom. Un rasgo se encuadra a la izquierda y
   * abre su ficha; el POST-IT va centrado, con más zoom y sin ficha — se lee en
   * el propio papel. `instant` evita la animación al re-pintar tras una compra.
   */
  function open(id, instant) {
    const notes = id === NOTES_ID;
    const t = notes ? null : tree.find(x => x.id === id);
    if (!notes && !t) return;
    if (instant) cam.style.transition = "none";
    // El foco es una clase del DOM, no del render: sin esto el nodo abierto se
    // apagaba junto con los demás al entrar en modo zoom.
    svg.querySelectorAll(".tb-sel").forEach(n => n.classList.remove("tb-sel"));
    svg.querySelector(`[data-node="${id}"]`)?.classList.add("tb-sel");
    // La chincheta no necesita zoom (no hay nada que leer en el papel): solo abre
    // sus notas en el riel. Los rasgos sí se encuadran.
    if (!notes) {
      cam.setAttribute("transform", camTransform(nodePos(tree, id), 2.4, false));
      svg.classList.add("tb-zoomed");
    }
    if (instant) requestAnimationFrame(() => { cam.style.transition = ""; });
    card.innerHTML = notes ? notesCard(f, adv, deep, deepOwned, etapa, color) : traitCard(t, f, run, color);
    card.classList.add("open");
    if (notes) { $("#tb-close").onclick = close; return; }
    wireCard(id);
  }

  function close() {
    cam.setAttribute("transform", "translate(0,0) scale(1)");
    svg.classList.remove("tb-zoomed");
    svg.querySelectorAll(".tb-sel").forEach(n => n.classList.remove("tb-sel"));
    card.classList.remove("open");   // el contenido queda: se desliza afuera, no parpadea
  }

  /** Los dos botones de la ficha. La compra la valida game/traits; acá solo re-pintamos. */
  function wireCard(id) {
    const x = $("#tb-close");
    if (x) x.onclick = close;
    const buy = card.querySelector("[data-buy]");
    if (buy) buy.onclick = () => { if (buyTrait(run, buy.dataset.buy)) renderPhilosophy(opts, id); };
  }

  // Un solo listener en el SVG: si el click no cayó dentro de un nodo, se cierra.
  // (Escuchar solo el fondo no basta: cualquier trazo pintado encima —grano, líneas
  // de cancha, regla lateral, notas— se come el evento antes de que llegue al rect.)
  svg.addEventListener("click", (e) => {
    // La franja de cabecera es el SELECTOR de árbol: tocar otra filosofía cambia de pizarra.
    const tab = e.target.closest("[data-filo]");
    // En ONBOARDING no se navega: el PI inicial se gasta SÍ o SÍ en un básico de la
    // escuela elegida. Después, la pizarra entera queda abierta.
    if (tab) { if (!opts.onboarding) renderPhilosophy({ ...opts, view: tab.dataset.filo }); return; }
    const g = e.target.closest("[data-node]");
    if (g) open(g.dataset.node); else close();
  });
  if (selected) open(selected, true);

  $("#btn-filo").onclick = () => {
    if (opts.onboarding) go("start-run", run.teamId);          // rehace la run: cero estado a medias
    else if (run.actionPending) showFiloChange(() => renderPhilosophy(opts));
  };
  if (opts.onboarding) $("#btn-continue").onclick = () => { if (!run.identityPoints) go("draw"); };
  else $("#btn-back").onclick = () => go("hub");
}

register("philosophy", renderPhilosophy);
