/* ============================================================
   ui/screens/match/panels — LA COLUMNA DE LECTURA del partido:
   estadísticas, XP de identidad en vivo, Match Momentum y mapa de
   calor, con el carrusel que alterna los dos últimos.

   Todo lo de acá es PINTURA: el motor sirve los datos ya masticados
   (matchStats, momentumBars, heatCells) y esta capa no decide nada
   del partido. El markup fijo lo crea la pantalla (index.js); estos
   pintores lo rellenan por id.

   Desde el rediseño del 7-ago-2026 pinta con el kit px-* (bordes
   duros, Silkscreen en las cifras, la paleta morada del hub): lo
   que cambió es la piel, no de dónde salen los números.
   ============================================================ */
import { matchStats } from "../../../game/match/stats.js";
import { momentumBars } from "../../../game/match/match-momentum.js";
import { heatCells } from "../../../game/match/field.js";
import { PHILOSOPHIES, FILO_LEVELS, xpLevelOf } from "../../../content/identity/philosophies.js";
import { S } from "../../session.js";
import { $, heatPitch } from "../../components.js";

/**
 * Pinta las Estadísticas del partido desde `matchStats` — la vista no conoce ninguna
 * regla: recibe [{label, mine, opp, txt}] y arma la fila de transmisión (número mío ·
 * etiqueta · número suyo, y debajo la barra repartida). Verde lo mío, rojo lo suyo.
 *
 * Se pinta con innerHTML solo la PRIMERA vez y después se actualizan los nodos: así la
 * transición CSS de las barras se ve (un innerHTML nuevo cada tick las haría saltar).
 */
export function paintStats(match) {
  const box = $("#match-stats"); if (!box) return;
  const rows = matchStats(match);
  if (!box.firstChild) {
    box.innerHTML = rows.map(r => `
      <div>
        <div class="flex items-baseline justify-between" style="gap:8px;margin-bottom:4px">
          <b data-v="${r.id}-mine" class="px" style="font-size:12px;color:var(--px-ok)">–</b>
          <span class="px-body uppercase" style="font-size:11px;letter-spacing:.1em;font-weight:700;color:var(--px-dim)">${r.label}</span>
          <b data-v="${r.id}-opp" class="px" style="font-size:12px;color:var(--px-bad)">–</b>
        </div>
        <div style="height:8px;background:var(--px-bad);border:2px solid var(--wc-black);overflow:hidden">
          <div data-bar="${r.id}" class="h-full transition-all duration-500" style="width:50%;background:var(--px-ok)"></div>
        </div>
      </div>`).join("");
  }
  for (const r of rows) {
    box.querySelector(`[data-v="${r.id}-mine"]`).textContent = r.txt[0];
    box.querySelector(`[data-v="${r.id}-opp"]`).textContent = r.txt[1];
    // Sin datos todavía (0 a 0 tiros) la barra queda al medio: no insinuar un dominio que
    // no existe. Es el mismo criterio del prior neutral de la posesión.
    const tot = r.mine + r.opp;
    box.querySelector(`[data-bar="${r.id}"]`).style.width = `${tot > 0 ? Math.round((100 * r.mine) / tot) : 50}%`;
  }
}


/**
 * LA XP DE IDENTIDAD EN VIVO: una fila por
 * filosofía que este partido ejercitó, con lo ganado y la barra hacia su próximo nivel.
 * Los números salen del Match (`filoXp`, ya multiplicados) y de la foto que trajo el
 * matchCtx (`filo.xp`): la pantalla no calcula reglas, solo suma foto + partido.
 */
export function paintFiloXp(match) {
  const box = $("#filo-xp"); if (!box || !match.my.filo) return;
  const ganado = match.filoXp || {};
  const filas = PHILOSOPHIES.filter(p => ganado[p.id]);
  // El vacío se DICE: un panel en blanco parece roto, y además informa —todavía no se
  // propuso ninguna idea reconocible.
  if (!filas.length) {
    box.innerHTML = `<div class="px-body" style="font-size:12.5px;color:var(--px-faint)">Ninguna idea sonó todavía. La experiencia se gana jugándola.</div>`;
    return;
  }
  box.innerHTML = filas.map(p => {
    const total = (match.my.filo.xp?.[p.id] || 0) + ganado[p.id];
    const lvl = xpLevelOf(total);
    const piso = FILO_LEVELS[lvl].min, techo = FILO_LEVELS[lvl + 1]?.min ?? null;
    const pct = techo ? Math.min(100, (100 * (total - piso)) / (techo - piso)) : 100;
    return `<div>
      <div class="flex items-baseline justify-between" style="gap:8px">
        <span class="px-body" style="font-size:13px;font-weight:700;color:#d4cee0">${p.icon} ${p.name}<span style="color:var(--px-faint)"> nv${lvl + 1}</span></span>
        <b class="px" style="font-size:10px;color:var(--wc-gold-light)">+${Math.round(ganado[p.id])}</b>
      </div>
      <div style="height:6px;background:var(--wc-black);border:1px solid var(--px-line-off);margin-top:5px">
        <div class="h-full transition-all duration-500" style="width:${pct}%;background:var(--wc-gold)"></div>
      </div>
    </div>`;
  }).join("");
}


/**
 * MATCH MOMENTUM: el gráfico de barras de la transmisión. Una barra por minuto cerrado,
 * hacia arriba lo mío (verde) y hacia abajo lo suyo (rojo), con la línea del cero al medio,
 * el corte del entretiempo y las marcas (⚽ 🟨 🟥 🔄 🚑 🔥) sobre el minuto en que pasaron.
 *
 * El motor lo sirve masticado (`momentumBars`: altura ya normalizada 0..1 y de qué lado va);
 * acá no se decide nada del partido, solo se dibuja. Se repinta cuando aparece una barra
 * nueva —una vez por minuto—, no en cada refresco: son ~95 nodos.
 *
 * El eje se ancla al MINUTO de fútbol, no al índice de la barra: con el descuento hay más
 * de 90 barras, y si se repartiera por índice el "HT" caería en cualquier lado.
 */
const MM_AXIS = [0, 15, 30, "HT", 60, 75, 90];
export function paintMomentum(match) {
  const box = $("#mm-chart"); if (!box) return;
  const bars = momentumBars(match);
  if (box.dataset.n === String(bars.length)) return;   // nada nuevo que dibujar
  box.dataset.n = String(bars.length);
  if (!bars.length) { box.innerHTML = ""; return; }
  const w = 100 / bars.length;
  // Índice de la primera barra del segundo tiempo: ahí va la línea del entretiempo.
  const htIdx = bars.findIndex(b => b.half > 45);
  const cuerpo = bars.map((b, i) => {
    const alto = Math.max(2, b.h * 100);          // un mínimo visible: 0 exacto no se ve
    const lado = b.mine
      ? `bottom:50%;height:${alto / 2}%;background:var(--px-ok)`
      : `top:50%;height:${alto / 2}%;background:var(--px-bad)`;
    // La marca va sobre la PUNTA de su barra, no sobre la línea del cero. Se posiciona con
    // `calc(50% + N%)`: en `top`/`bottom` los porcentajes se resuelven contra la ALTURA del
    // contenedor, que es lo que queremos. (Con `margin-bottom:N%` se resolvían contra el
    // ANCHO de la columna —3 píxeles—, así que las marcas quedaban todas pegadas al cero:
    // se vio en el navegador.)
    const marcas = b.marks.length
      ? `<span class="absolute left-1/2 -translate-x-1/2 text-[9px] leading-none whitespace-nowrap pointer-events-none"
           style="${b.mine ? `bottom:calc(50% + ${alto / 2}%);margin-bottom:2px` : `top:calc(50% + ${alto / 2}%);margin-top:2px`}">${b.marks.join("")}</span>`
      : "";
    return `<div class="absolute" style="left:${i * w}%;width:${w}%;top:0;bottom:0">
      <div class="absolute" style="left:8%;right:8%;${lado}"></div>${marcas}</div>`;
  }).join("");
  box.innerHTML = `
    ${cuerpo}
    <div class="absolute left-0 right-0 top-1/2" style="height:1px;background:var(--px-line)"></div>
    ${htIdx > 0 ? `<div class="absolute top-0 bottom-0" style="width:1px;background:rgba(70,64,90,.7);left:${htIdx * w}%"></div>` : ""}`;
  // El eje: cada marca se planta sobre la primera barra que alcanza ese minuto.
  const eje = $("#mm-axis");
  if (eje) eje.innerHTML = MM_AXIS.map(t => {
    const i = t === "HT" ? htIdx : bars.findIndex(b => b.min >= t);
    if (i < 0) return "";
    const x = t === 90 ? 100 : i * w;
    return `<span class="absolute" style="left:${x}%;transform:translateX(${t === 0 ? "0" : t === 90 ? "-100%" : "-50%"})">${t === "HT" ? "HT" : t + "'"}</span>`;
  }).join("");
}


/* ── EL CARRUSEL: Match Momentum ↔ Mapa de calor ────────────────────────────
   Estado de VISTA, no de partido: cuál diapositiva se mira y de quién es el mapa.
   Vive en el módulo (no en `S`) porque muere con la pantalla, como `slide`.

   El rediseño del partido movió el momentum a lo ancho de la pantalla y el mapa de
   calor a la columna de lectura. Decisión PO del 7-ago-2026: los dos siguen siendo
   UN CARRUSEL, y vive donde el diseño puso el mapa — al pie de la columna izquierda,
   quedándose con todo el alto que sobra. */
const SLIDES = ["Match Momentum", "Mapa de calor"];
let slide = 0, heatSide = "mine";

/** Alterna de diapositiva (delta ±1, circular). */
function moveCarousel(d) {
  slide = (slide + d + SLIDES.length) % SLIDES.length;
  paintCarousel();
}

/** Pinta la diapositiva activa: título, leyenda y qué panel se ve. */
function paintCarousel() {
  const t = $("#car-title"); if (!t) return;
  t.textContent = SLIDES[slide];
  const mm = $("#slide-mm"), heat = $("#slide-heat");
  mm.classList.toggle("hidden", slide !== 0);
  mm.classList.toggle("flex", slide === 0);
  heat.classList.toggle("hidden", slide !== 1);
  heat.classList.toggle("flex", slide === 1);
  const me = S.matchCtx.team.name, opp = S.match.oppTeam.name;
  $("#car-legend").innerHTML = slide === 0
    ? `<span class="flex items-center gap-1.5" style="color:var(--px-ok)"><i class="inline-block" style="width:8px;height:8px;background:var(--px-ok)"></i>${me}</span>
       <span class="flex items-center gap-1.5" style="color:var(--px-bad)"><i class="inline-block" style="width:8px;height:8px;background:var(--px-bad)"></i>${opp}</span>`
    // La escala del mapa se explica sola: de "sin uso" a rojo, como en la tele.
    : `<span style="color:var(--px-faint)">Sin uso</span>
       <i class="inline-block" style="height:6px;width:64px;background:linear-gradient(90deg,rgba(250,204,21,.25),rgb(250,204,21),rgb(249,115,22),rgb(239,68,68))"></i>
       <span style="color:var(--px-bad)">Intenso</span>`;
  // Los botones de a quién se mira (solo tienen sentido en el mapa).
  document.querySelectorAll(".heat-side").forEach(b => {
    const on = b.dataset.heat === heatSide;
    b.style.borderColor = on ? "var(--wc-gold)" : "var(--px-line-off)";
    b.style.background = on ? "#2e2415" : "var(--px-panel-lo)";
    b.style.color = on ? "var(--wc-gold-light)" : "var(--px-faint)";
  });
  paintHeat(S.match, true);
}

/**
 * EL MAPA DE CALOR del tiempo EN CURSO (cada tiempo tiene el suyo: el motor lo reinicia
 * al empezar el segundo). Se repinta una vez por minuto —cuando hay calor nuevo—, no en
 * cada refresco: son 15 nodos con desenfoque. El motor sirve las celdas ya normalizadas;
 * acá no se decide nada del partido.
 */
export function paintHeat(match, force = false) {
  const box = $("#heat-pitch");
  if (!box || (slide !== 1 && !force)) return;
  const marca = `${match.min}-${heatSide}-${match.field?.maps.length}`;
  if (!force && box.dataset.k === marca) return;
  box.dataset.k = marca;
  // Sin redondeo y con borde duro: la cancha vive dentro del kit pixel del partido.
  box.innerHTML = `<div style="width:100%;height:100%;border:2px solid var(--wc-black)">${heatPitch(heatCells(match, heatSide), { radius: "0" })}</div>`;
}


/** Cablea los controles del carrusel: las flechas y el toggle mío/rival. Vive acá, con
 *  el estado que toca — la pantalla no tiene por qué conocer `slide` ni `heatSide`. */
export function wireCarousel() {
  $("#car-prev").onclick = () => moveCarousel(-1);
  $("#car-next").onclick = () => moveCarousel(1);
  document.querySelectorAll(".heat-side").forEach(b => b.onclick = () => { heatSide = b.dataset.heat; paintCarousel(); });
  paintCarousel();
}

/** Un partido nuevo arranca siempre mirando el momentum y el mapa propio. */
export function resetCarousel() { slide = 0; heatSide = "mine"; }
