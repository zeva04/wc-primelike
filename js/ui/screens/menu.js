/* ============================================================
   ui/screens/menu — menú principal: carrusel de selección por
   continente, dificultad temática y acceso al historial.
   ============================================================ */
import { allTeams } from "../../data/teams-repo.js";
import { pick } from "../../core/rng.js";
import { teamRating, teamStars, playerOverall, statLine, difficultyOf, teamFigure } from "../../game/ratings.js";
import { teamDesc } from "../../content/team-flavor.js";
import { S } from "../session.js";
import { register, go } from "../nav.js";
import { screenFull, fitScaleUp, $, flagImg, starsHtml, posBadge, numTag } from "../components.js";
import { spriteSvg } from "../sprites.js";
import { applyTeamColors, TROPHY_SVG, BALL_SVG } from "../theme.js";
import { stopTimer } from "./match/index.js";

let menuSel = null;      // id del equipo mostrado en el carrusel
let menuConfed = null;   // confederación (pestaña) activa
const CONFED_LABELS = { CONMEBOL: "Sudamérica", UEFA: "Europa", CONCACAF: "Concacaf", CAF: "África", AFC: "Asia", OFC: "Oceanía" };

// Colores del chip de dificultad por tier (la regla y los textos viven en game/ratings.difficultyOf)
const DIFF_CHIP = {
  favorito: "text-emerald-400 border-emerald-500/50 bg-emerald-500/10",
  aspirante: "text-sky-400 border-sky-500/50 bg-sky-500/10",
  sorpresa: "text-amber-400 border-amber-500/50 bg-amber-500/10",
  leyenda: "text-red-400 border-red-500/50 bg-red-500/10",
};

/** Pinta el menú: héroe, pestañas de continente, carrusel del equipo activo y su plantel. */
function renderMenu() {
  S.run = null; S.match = null; stopTimer();
  const playables = allTeams().filter(t => t.playable);
  applyTeamColors(null);
  if (!menuSel || !playables.some(t => t.id === menuSel)) menuSel = playables[0].id;
  // Continentes y selecciones en orden alfabético (por nombre en español)
  const confeds = ["CONMEBOL", "UEFA", "CONCACAF", "CAF", "AFC", "OFC"]
    .filter(cf => playables.some(t => t.confed === cf))
    .sort((a, b) => (CONFED_LABELS[a] || a).localeCompare(CONFED_LABELS[b] || b, "es"));
  if (!menuConfed || !confeds.includes(menuConfed)) menuConfed = playables.find(t => t.id === menuSel).confed;
  const confTeams = playables.filter(t => t.confed === menuConfed)
    .sort((a, b) => a.name.localeCompare(b.name, "es"));
  if (!confTeams.some(t => t.id === menuSel)) menuSel = confTeams[0].id;
  const sel = playables.find(t => t.id === menuSel);
  const diff = difficultyOf(sel);
  const c = sel.colors || {};
  const best = teamFigure(sel);

  // Pantalla fija (sprint de UX): cabecera / pestañas / carrusel elástico / banderas.
  // El carrusel es el único bloque que crece (flex-1 min-h-0); todo lo demás mide fijo.
  //
  // ESCALA TIPOGRÁFICA del sprint (una sola familia; la manuscrita de tiza es la otra
  // de las dos permitidas en todo el proyecto). Cada peldaño manda un nivel de lectura:
  //   30px 900  título del juego        · 24px 900  nombre de la selección
  //   17px 900  la acción (CTA)         · 16px 900  rating y estrellas
  //   14px 600  descripción del equipo (mismo color que el nombre: son la misma voz)
  //   14px 900  el overall del jugador (el dato que se compara de un vistazo)
  //   12px      contexto: figura, continentes, nombre del jugador
  //   10px      etiquetas duras: dorsal, posición, anfitriones
  screenFull(`
    <button id="btn-history" data-tip="Historial de Partidas"
      class="tip absolute top-4 right-5 z-20 w-11 h-11 rounded-xl border border-slate-700 bg-slate-900/70 backdrop-blur text-xl leading-none
             hover:border-[var(--wc-gold)] hover:bg-slate-800/80 cursor-pointer transition-all">📜</button>

    <!-- Envoltorio de alto INTRÍNSECO para fitScaleUp (components.js): el zoom tiene
         que aplicarse acá, nunca en el shell h-screen del padre — ver el porqué en
         el comentario de fitScaleUp. El botón de historial queda AFUERA a propósito,
         posicionado absoluto contra el shell: es chrome fijo de la pantalla, no
         contenido del equipo, y no necesita moverse con el escalado. -->
    <div id="menu-content" class="flex flex-col">
    <header class="shrink-0 text-center">
      <div class="flex items-center justify-center gap-3">
        <h1 class="text-3xl font-black tracking-tighter gold-text leading-none">WC PRIME</h1>
        <div class="w-9 h-[3.15rem]">${TROPHY_SVG}</div>
      </div>
      <p class="text-slate-300 mt-1 font-bold tracking-[0.35em] text-[10px] uppercase">
        <span style="color:var(--wc-blue)">Estados Unidos</span> · <span style="color:var(--wc-green)">México</span> · <span style="color:var(--wc-red)">Canadá</span>
      </p>
      <div class="tricolor-bar w-72 mx-auto mt-2"></div>
    </header>

    <div class="shrink-0 flex justify-center items-center gap-2 flex-wrap mt-4">
      ${confeds.map(cf => `<button data-confed="${cf}" class="confed-tab px-4 py-1.5 rounded-full border text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${cf === menuConfed ? "border-[var(--wc-gold)] text-amber-300 bg-amber-400/10" : "border-slate-700 text-slate-400 bg-slate-900/50 hover:border-slate-500"}">${CONFED_LABELS[cf] || cf} <span class="opacity-60">(${playables.filter(t => t.confed === cf).length})</span></button>`).join("")}
      <button id="btn-random" title="Selección al azar" class="px-4 py-1.5 rounded-full border border-slate-600 text-xs font-bold uppercase tracking-wider text-slate-200 bg-slate-900/70 hover:border-[var(--wc-gold)] hover:text-amber-300 cursor-pointer transition-all">🎲 Aleatorio</button>
    </div>

    <!-- Orden deductivo (sprint de UX, 6-ago): primero ELEGÍS el continente (arriba),
         después ELEGÍS el equipo dentro de él (esta fila de banderas) y recién ahí
         aparece SU ficha. Por eso las banderas viven pegadas a las pestañas, no al
         pie del carrusel — son el mismo paso de la decisión, no un resumen de ella. -->
    <div class="shrink-0 flex justify-center gap-2 flex-wrap mt-2.5">
      ${confTeams.map(t => `<button data-team="${t.id}" title="${t.name}" class="car-dot rounded-md overflow-hidden transition-all cursor-pointer ${t.id === menuSel ? "ring-2 ring-[var(--wc-gold)] scale-110" : "opacity-50 hover:opacity-90"}">${flagImg(t, "w-10 h-7")}</button>`).join("")}
    </div>

    <!-- EL BLOQUE DEL EQUIPO (sprint de UX, 6-ago): deja de estirarse a lo alto de la
         pantalla. Antes "flex-1" + "justify-center" lo obligaba a llenar el resto del
         viewport, y esa plata se pagaba en dos huecos de aire —entre la descripción y
         las fichas, y entre el botón y el borde de la tarjeta— que no eran margen de
         diseño, eran sobrante sin dueño. Ahora el bloque mide EXACTO lo que su
         contenido pide (shrink-0, items-start): descripción→fichas→botón quedan a
         distancia fija de verdad. Si eso deja aire libre hasta el borde de la
         pantalla, ESE es el lugar correcto para que viva — no hay problema en que la
         pantalla no se llene del todo, lo que no puede pasar es que el aire quede
         adentro de la tarjeta. fitScaleUp() decide, ya con el bloque medido en
         serio, si ese sobrante alcanza para escalar todo un 5% en vez de dejarlo vacío. -->
    <div id="menu-block" class="shrink-0 flex items-start justify-between gap-3 mt-3 py-1">
      <div class="shrink-0 self-center w-20 h-20 animate-floaty">${BALL_SVG}</div>
      <div class="flex-1 min-w-0 max-w-5xl mx-auto flex items-start gap-3">
      <button id="car-prev" title="Anterior" class="self-center shrink-0 w-12 h-12 rounded-full border border-slate-600 bg-slate-900/80 hover:border-[var(--wc-gold)] hover:text-amber-300 text-2xl font-black cursor-pointer transition-all">‹</button>
      <div class="flex-1 min-w-0 flex flex-col bg-slate-900/60 border border-slate-600 rounded-2xl overflow-hidden animate-pop backdrop-blur-sm" key="${sel.id}">
        <div class="h-2 shrink-0" style="background:linear-gradient(90deg, ${c.primary}, ${c.secondary})"></div>
        <div class="flex flex-col p-5">
          <div class="flex items-start justify-between gap-4">
            <div class="flex items-center gap-4 min-w-0">
              ${flagImg(sel, "w-[4.5rem] h-[3.1rem]")}
              <div class="min-w-0">
                <div class="text-2xl font-black leading-tight truncate">${sel.name}</div>
                <div class="leading-tight">${starsHtml(teamStars(sel))} <span class="text-amber-300 font-black ml-1">${teamRating(sel)}</span>
                  <span class="text-slate-400 text-xs ml-2">Figura: <b class="text-slate-200">${best.name}</b> ${playerOverall(best)}</span></div>
                <p class="text-sm font-semibold text-slate-100 leading-snug mt-1">${teamDesc(sel.id)}</p>
              </div>
            </div>
            <span class="shrink-0 px-3 py-1.5 rounded-full border text-xs font-bold ${DIFF_CHIP[diff.tier]}">${diff.label}</span>
          </div>
          <div class="grid grid-cols-5 grid-rows-2 gap-2.5 mt-4">
            ${sel.players.map(p => `
              <div class="bg-slate-950/50 border border-slate-700 rounded-xl py-2.5 px-2 flex flex-col items-center gap-1.5" title="${statLine(p)}">
                ${spriteSvg(p, sel, "h-10 w-auto")}
                <div class="text-xs font-semibold truncate max-w-full">${p === best ? "⭐ " : ""}${p.name}</div>
                <div class="flex items-center justify-center gap-1">${numTag(p)}${posBadge(p.pos)}<span class="text-amber-300 text-sm font-black">${playerOverall(p)}</span></div>
              </div>`).join("")}
          </div>
          <button id="btn-start" class="w-full mt-4 py-3 rounded-xl font-black text-[17px] cursor-pointer transition-all hover:brightness-110 hover:scale-[1.005]" style="background:linear-gradient(135deg, ${c.primary}, ${c.secondary});color:${c.text}">⚽ JUGAR CON ${sel.name.toUpperCase()}</button>
        </div>
      </div>
      <button id="car-next" title="Siguiente" class="self-center shrink-0 w-12 h-12 rounded-full border border-slate-600 bg-slate-900/80 hover:border-[var(--wc-gold)] hover:text-amber-300 text-2xl font-black cursor-pointer transition-all">›</button>
      </div>
      <div class="shrink-0 self-center w-20 h-20 animate-floaty" style="animation-delay:-2.5s">${BALL_SVG}</div>
    </div>
    </div>
  `);
  // Tailwind CDN aplica sus clases de forma asíncrona (JIT en runtime), así que medir
  // en el mismo tick del innerHTML da un layout todavía sin estilizar. setTimeout (no
  // requestAnimationFrame: rAF se pausa en pestañas en segundo plano/automatizadas y
  // el escalado nunca llegaba a aplicarse) le da el respiro para asentarse de verdad.
  setTimeout(() => fitScaleUp("menu-content"), 50);
  document.querySelectorAll(".confed-tab").forEach(b => b.onclick = () => {
    menuConfed = b.dataset.confed;
    // Al cambiar de continente se abre con su primer equipo en orden alfabético
    const first = playables.filter(t => t.confed === menuConfed)
      .sort((x, y) => x.name.localeCompare(y.name, "es"))[0];
    if (first) menuSel = first.id;
    renderMenu();
  });
  const cycle = (dir) => {
    const i = confTeams.findIndex(t => t.id === menuSel);
    menuSel = confTeams[(i + dir + confTeams.length) % confTeams.length].id;
    renderMenu();
  };
  $("#car-prev").onclick = () => cycle(-1);
  $("#car-next").onclick = () => cycle(1);
  $("#btn-random").onclick = () => {
    // Sorteo entre todas las jugables (sin repetir la actual); solo posiciona el carrusel
    const pool = playables.filter(t => t.id !== menuSel);
    const t = pick(pool); // azar del motor (regla §4 de ARQUITECTURA: todo el azar sale de core/rng)
    menuConfed = t.confed;
    menuSel = t.id;
    renderMenu();
  };
  document.querySelectorAll(".car-dot").forEach(b => b.onclick = () => { menuSel = b.dataset.team; renderMenu(); });
  $("#btn-start").onclick = () => go("start-run", menuSel);
  $("#btn-history").onclick = () => go("history");
}

register("menu", renderMenu);
