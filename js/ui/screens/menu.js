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
import { screenShell, $, flagImg, starsHtml, posBadge, numTag } from "../components.js";
import { spriteSvg } from "../sprites.js";
import { applyTeamColors, TROPHY_SVG, BALL_SVG } from "../theme.js";
import { stopTimer } from "./match.js";

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

  screenShell(`
    <div class="text-center mb-6 mt-4">
      <div class="flex items-end justify-center gap-8 mb-3">
        <div class="w-12 h-12 md:w-16 md:h-16 animate-floaty">${BALL_SVG}</div>
        <div class="w-16 h-[5.6rem] md:w-20 md:h-28">${TROPHY_SVG}</div>
        <div class="w-12 h-12 md:w-16 md:h-16 animate-floaty" style="animation-delay:-2.5s">${BALL_SVG}</div>
      </div>
      <h1 class="text-4xl md:text-5xl font-black tracking-tighter gold-text">MUNDIAL 26</h1>
      <p class="text-slate-300 mt-1.5 font-bold tracking-[0.35em] text-[11px] uppercase">
        <span style="color:var(--wc-blue)">Estados Unidos</span> · <span style="color:var(--wc-green)">México</span> · <span style="color:var(--wc-red)">Canadá</span>
      </p>
      <div class="tricolor-bar max-w-md mx-auto mt-3"></div>
    </div>
    <h2 class="text-center text-slate-300 font-bold mb-3 uppercase tracking-widest text-sm">Elige tu selección</h2>
    <div class="flex justify-center gap-2 mb-4 flex-wrap">
      ${confeds.map(cf => `<button data-confed="${cf}" class="confed-tab px-4 py-1.5 rounded-full border text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${cf === menuConfed ? "border-[var(--wc-gold)] text-amber-300 bg-amber-400/10" : "border-slate-700 text-slate-400 bg-slate-800/50 hover:border-slate-500"}">${CONFED_LABELS[cf] || cf} <span class="opacity-60">(${playables.filter(t => t.confed === cf).length})</span></button>`).join("")}
      <button id="btn-random" title="Selección al azar" class="px-4 py-1.5 rounded-full border border-slate-600 text-xs font-bold uppercase tracking-wider text-slate-200 bg-slate-800/70 hover:border-[var(--wc-gold)] hover:text-amber-300 cursor-pointer transition-all">🎲 Aleatorio</button>
    </div>
    <div class="flex items-stretch gap-3 max-w-4xl mx-auto">
      <button id="car-prev" title="Anterior" class="self-center shrink-0 w-11 h-11 rounded-full border border-slate-600 bg-slate-800/80 hover:border-[var(--wc-gold)] hover:text-amber-300 text-2xl font-black cursor-pointer transition-all">‹</button>
      <div class="flex-1 w-full bg-slate-800/70 border border-slate-600 rounded-2xl overflow-hidden animate-pop" key="${sel.id}">
        <div class="h-2" style="background:linear-gradient(90deg, ${c.primary}, ${c.secondary})"></div>
        <div class="p-5">
          <div class="flex items-center justify-between flex-wrap gap-3 mb-1">
            <div class="flex items-center gap-3">
              ${flagImg(sel, "w-16 h-11")}
              <div>
                <div class="text-2xl font-black">${sel.name}</div>
                <div>${starsHtml(teamStars(sel))} <span class="text-amber-300 font-black ml-1">${teamRating(sel)}</span>
                  <span class="text-slate-400 text-xs ml-2">Figura: <b class="text-slate-200">${best.name}</b> ${playerOverall(best)}</span></div>
              </div>
            </div>
            <span class="px-3 py-1.5 rounded-full border text-xs font-bold ${DIFF_CHIP[diff.tier]}">${diff.label}</span>
          </div>
          <p class="text-xs text-slate-400 mb-4">${teamDesc(sel.id)}</p>
          <div class="grid grid-cols-2 sm:grid-cols-5 gap-2 mb-4">
            ${sel.players.map(p => `
              <div class="bg-slate-900/60 border border-slate-700 rounded-xl p-2 text-center" title="${statLine(p)}">
                <div class="flex justify-center">${spriteSvg(p, sel, "w-9 h-10")}</div>
                <div class="text-[10px] font-semibold truncate mt-1">${p === best ? "⭐ " : ""}${p.name}</div>
                <div class="flex items-center justify-center gap-1">${numTag(p)}${posBadge(p.pos)}<span class="text-amber-300 text-xs font-black">${playerOverall(p)}</span></div>
              </div>`).join("")}
          </div>
          <button id="btn-start" class="w-full py-3 rounded-xl font-black text-lg cursor-pointer transition-all hover:brightness-110 hover:scale-[1.01]" style="background:linear-gradient(135deg, ${c.primary}, ${c.secondary});color:${c.text}">⚽ JUGAR CON ${sel.name.toUpperCase()}</button>
        </div>
      </div>
      <button id="car-next" title="Siguiente" class="self-center shrink-0 w-11 h-11 rounded-full border border-slate-600 bg-slate-800/80 hover:border-[var(--wc-gold)] hover:text-amber-300 text-2xl font-black cursor-pointer transition-all">›</button>
    </div>
    <div class="flex justify-center gap-2 mt-4 flex-wrap">
      ${confTeams.map(t => `<button data-team="${t.id}" title="${t.name}" class="car-dot rounded-md overflow-hidden transition-all cursor-pointer ${t.id === menuSel ? "ring-2 ring-[var(--wc-gold)] scale-110" : "opacity-50 hover:opacity-90"}">${flagImg(t, "w-9 h-6")}</button>`).join("")}
    </div>
    <div class="text-center mt-8">
      <button id="btn-history" class="text-slate-400 hover:text-slate-200 text-sm underline underline-offset-4 cursor-pointer">📜 Historial de partidas</button>
    </div>
  `);
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
