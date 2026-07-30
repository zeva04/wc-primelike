/* ============================================================
   ui/screens/philosophy — la pantalla de IDENTIDAD: LA PIZARRA
   DEL DT (sprint de UI de Identidad, decisiones PO 23-jul-2026).

   Antes esta pantalla apilaba 19 bloques rectangulares y dejaba
   el árbol —lo único accionable— al fondo del scroll. Ahora hay
   DOS cosas: una banda superior con el nivel de filosofía, y la
   pizarra táctica (ui/board.js) donde el árbol se dibuja sobre
   una cancha. Nada se borró: los 5 principios viven en la franja
   de cabecera de la pizarra y los counters + el fútbol superior
   en las notas del DT, que se leen en el riel al tocar la
   chincheta (rediseño de espacio del 26-jul-2026).

   El detalle de cada rasgo NO se muestra en reposo (el nodo es
   ícono + nombre): se abre al tocarlo, la cámara hace zoom sobre
   él y la ficha aparece a la derecha con desc, momento, faltas y
   la compra. Esa es la única profundidad de la pantalla.

   Doble modo (T1.5): pantalla normal desde el hub, y ONBOARDING
   en el flujo de inicio (elegir filosofía trae acá con 1 PI para
   el 1-de-3 de rasgos básicos; el botón sigue al sorteo).
   ============================================================ */
import { getPhilosophy, FILO_LEVELS, FILO_ETAPAS, AFINIDAD_LABEL, afinidadMult } from "../../content/philosophies.js";
import { ADVANCED_BY_FILO } from "../../content/sequences.js";
import { RAMA_LABELS, DEEP_TRAIT } from "../../content/traits.js";
import { filoPoints, filoLevel, filoEtapa } from "../../game/philosophy.js";
import { dtProgress, DT_MAX } from "../../game/coach.js";
import { traitTree, buyTrait, traitCost } from "../../game/traits.js";
import { S } from "../session.js";
import { register, go } from "../nav.js";
import { screenShell, $ } from "../components.js";
import { showFiloChange } from "../filo-change.js";
import { tacticBoard, nodePos, camTransform, markerColor, TIER_LABEL, NOTES_ID, notesBlocks } from "../board.js";

const MAGNETS = `<span class="tb-magnet" style="left:9px"></span><span class="tb-magnet" style="right:9px"></span>`;

/**
 * La ficha del rasgo, escrita en EL RIEL DEL PIZARRÓN (decisión PO: opción D).
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
 * Las NOTAS DEL DT en el riel. Desde el rediseño de espacio (26-jul) el post-it
 * dejó de ser un papel de 164×174 en la cancha: es una chincheta, y su contenido
 * se lee acá — el mismo panel donde ya se leen las fichas de rasgos, con la misma
 * tipografía de tiza. Un solo lugar en la pantalla donde vive el texto largo.
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
  // ARBOLES NAVEGABLES (arco de Progresión): las 4 filosofías progresan a la vez, así
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
  const adv = ADVANCED_BY_FILO[f.id];         // la secuencia avanzada de esa identidad (M2)
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
    ? { label: "Elegir otra identidad", title: "Vuelve al selector — todavía no gastaste nada",
        cls: "cursor-pointer border-slate-600 bg-slate-800/70 text-slate-300 hover:border-slate-400 hover:text-white hover:bg-slate-700/70" }
    : run.actionPending
      ? { label: "Cambiar identidad", title: "Cuesta la Acción del Día",
          cls: "cursor-pointer border-slate-600 bg-slate-800/70 text-slate-300 hover:border-amber-400 hover:text-amber-300 hover:bg-slate-700/70" }
      : { label: "Cambiar identidad", title: "Ya usaste la Acción del Día: mañana",
          cls: "cursor-not-allowed border-slate-800 bg-slate-900/50 text-slate-600" };

  screenShell(`
    <!-- LA BANDA: quién eres y cuánto camino llevas. Una sola fila, sin cajas. -->
    <div class="flex flex-wrap items-center gap-x-6 gap-y-3 mb-4">
      <div class="flex items-center gap-2.5 min-w-0">
        <span class="text-3xl leading-none">${f.icon}</span>
        <div class="min-w-0">
          <div class="flex items-baseline gap-2.5">
            <h1 class="text-xl font-black leading-none tracking-tight">${f.name}</h1>
            <span class="text-[9px] font-black uppercase tracking-[.18em] px-2 py-1 rounded-lg ${jugando ? "text-emerald-300 bg-emerald-500/10" : "text-slate-500 bg-slate-800/70"}">${jugando ? "la que juegas" : "solo mirando"}</span>
            <!-- El cambio de identidad, en la misma línea del nombre: no cuesta
                 un píxel de alto y queda donde el jugador mira su identidad. -->
            <button id="btn-filo" class="text-[11px] font-bold px-2.5 py-1 rounded-lg border transition-all ${cambioTxt.cls}"
              title="${cambioTxt.title}">↩ ${cambioTxt.label}</button>
          </div>
          <p class="chalk-hand text-[13px] text-slate-500 truncate mt-1">${f.lema}</p>
        </div>
      </div>

      <!-- El flex-wrap NO es decorativo: los cuatro bloques miden ~515px y a 375 de
           pantalla el contenedor tiene 343. Sin envolver, la banda empujaba la página
           a 567px de ancho y la pizarra se miraba con scroll horizontal (medido con
           tools/mobile.html, 29-jul). Mismo bug —y mismo arreglo— que la cabecera de
           Gestión de Plantilla: una fila de anchos fijos que no puede romper. -->
      <div class="flex flex-wrap items-center justify-end gap-3 ml-auto">
        <!-- EL DIRECTOR TÉCNICO: la segunda capa. Los PI que gasta el árbol salen de acá. -->
        <div class="text-right leading-none">
          <div class="text-[9px] font-black uppercase tracking-[.2em] mb-1 text-sky-400/70">Director técnico</div>
          <div class="text-[15px] font-black">Nivel ${run.dtNivel || 1}<span class="text-slate-600 text-[12px] font-bold">/${DT_MAX}</span>
            ${run.identityPoints > 0 ? `<span class="text-amber-300 text-[12px]"> · ${run.identityPoints} PI</span>` : ""}</div>
          <div class="h-[4px] w-28 ml-auto rounded-full bg-black/60 overflow-hidden ring-1 ring-white/10 mt-1.5">
            <div class="h-full rounded-full bg-sky-400" style="width:${dt.pct}%"></div>
          </div>
        </div>
        <div class="text-right leading-none">
          <div class="text-[9px] font-black uppercase tracking-[.2em] mb-1" style="color:${oro}b3">${FILO_ETAPAS[etapa].label}</div>
          <div class="text-[15px] font-black">Nivel ${lvl + 1}<span class="text-slate-600 text-[12px] font-bold">/10</span></div>
        </div>
        <div class="w-56 max-w-full">
          <div class="h-[6px] rounded-full bg-black/60 overflow-hidden ring-1 ring-white/10">
            <div class="h-full rounded-full transition-all duration-500" style="width:${Math.min(100, nivelPct)}%;background:linear-gradient(90deg,${oro}88,${oro})"></div>
          </div>
          <div class="text-[9.5px] text-slate-500 mt-1.5">${pts} XP${next ? ` · nivel ${lvl + 2} a los ${next.min}` : " · la idea ya es ley"} · su firma sale ×${nivel.mult} · aprende ×${afin} <span class="opacity-70">(${AFINIDAD_LABEL[afin] || "neutral"})</span></div>
        </div>
        ${opts.onboarding
          ? `<button id="btn-continue" class="btn-primary text-sm ${run.identityPoints > 0 ? "opacity-40 cursor-not-allowed" : ""}"
              title="${run.identityPoints > 0 ? "Primero incorpora tu primera idea: elige uno de los tres rasgos básicos" : ""}">Al sorteo →</button>`
          : `<button id="btn-back" class="text-sm text-slate-400 hover:text-slate-200 cursor-pointer px-3 py-2 rounded-xl border border-slate-700 hover:border-slate-500">← Volver</button>`}
      </div>
    </div>

    <!-- LA PIZARRA. Sin instrucciones escritas: el onboarding se resuelve solo con
         los tres círculos que laten en campo propio y el contador de PI. El riel
         de la derecha entra al enfocar un rasgo; la cámara encuadra el nodo al 29%
         del ancho justamente para dejarle ese cuarto del tablero libre. -->
    <div class="board-frame relative">
      ${tacticBoard(run, f, tree, { adv, deep, deepOwned, etapa, selected })}
      <div id="tb-rail" class="tb-rail"></div>
    </div>
  `, "max-w-5xl");   // 6xl→5xl (26-jul): con 19 rasgos el tablero no entraba sin scroll
                     // vertical en una notebook típica (1280×720): a 6xl sobraban 48px de
                     // alto. El SVG escala uniforme (viewBox), así que achicar el ancho del
                     // contenedor reduce TODO por igual — nodos, texto, huecos — sin riesgo
                     // de reabrir los solapamientos que ya se verificaron sin él.

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
    // escuela elegida (GDD). Después, la pizarra entera queda abierta.
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
