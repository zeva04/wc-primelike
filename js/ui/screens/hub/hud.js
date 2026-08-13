/* ============================================================
   ui/screens/hub/hud — EL HUD que flota sobre el complejo.

   Adaptado del diseño "Hub Mundial 2026". El mapa es el fondo real de la pantalla
   y todo esto va ENCIMA, en cuatro franjas de alto fijo (arriba) y una columna
   (derecha). Los altos son constantes a propósito: el lienzo mide 1440×900 exactos
   y cada pieza tiene su presupuesto, así nada empuja a nada.

     28px  la Oportunidad del día (solo si hay)
     56px  la cabecera de selección
      4px  la franja tricolor de los anfitriones
     96px  la línea de días
     ───   el complejo (lo que sobra)
     72px  la barra de acción

   La columna derecha (372px) arranca en x=1056 y el complejo termina en 1030: no
   se pisan nunca. La regla del kit vive en index.html (clases px-*).
   ============================================================ */
import { teamRating, teamStars } from "../../../game/ratings.js";
import { dayLabel } from "../../../game/calendar.js";
import { dayOpportunity } from "../../../game/day-action.js";
import { getPhilosophy, FILO_LEVELS } from "../../../content/identity/philosophies.js";
import { filoPoints, filoLevel } from "../../../game/philosophy.js";
import { getFormation } from "../../../game/lineup.js";
import { moraleBand } from "../../../game/morale.js";
import { canjeableBuffs } from "../../../game/day-action.js";
import { STAT_LABELS } from "../../../content/daily/day-actions.js";
import { oxidState } from "../../../game/oxidation.js";
import { RARITIES } from "../../../content/daily/rarities.js";
import { EVENT_THEMES } from "../../../content/daily/themes.js";
import { S } from "../../session.js";
import { pxFlag } from "../../components.js";
import { pxIcon } from "../../pixicons.js";

// `pxFlag` vivía acá y se mudó a ui/components.js el 12-ago-2026: la pantalla de
// ranuras de partida guardada también la necesita, y una pantalla no importa de
// otra. Se re-exporta para no romper a quien ya la pedía a este módulo.
export { pxFlag };

/* Las rarezas traen su color como CLASE de Tailwind (`text-amber-400`), que acá no
   sirve: el kit pixel pinta con `style` para poder mezclar con los tokens px-*. Este
   es el mismo orden de rareza traducido a hex. */
const RAREZA_HEX = { comun: "#94a3b8", infrecuente: "#34d399", rara: "#a78bfa", legendaria: "#fbbf24" };

/* ── 1 · La Oportunidad del día ─────────────────────────────────────────────── */

/**
 * La franja de arriba de todo. Solo existe si hay Oportunidad: es una oferta que
 * vence hoy, y por eso se lleva la primera línea de la pantalla. Sin oferta la
 * franja no se dibuja (y el complejo gana 28px de aire).
 */
export function barraOportunidad() {
  const o = dayOpportunity(S.run);
  if (!o) return "";
  const rar = RARITIES[o.rareza] || {};
  return `<div id="px-opp" class="shrink-0 flex items-center gap-2.5 px-3 cursor-pointer"
      style="height:28px;background:var(--px-panel-hi);border-bottom:2px solid var(--wc-black);box-shadow:inset 4px 0 0 var(--wc-gold)">
    <span class="px-tag px-tag-gold">Oportunidad · solo hoy</span>
    <span class="px-body truncate" style="font-size:14px;color:#e6e6ec">${o.title}</span>
    ${rar.label ? `<span class="px-tag" style="background:rgba(38,34,48,.86);color:${RAREZA_HEX[o.rareza] || "#38bdf8"};border-color:var(--wc-black)">${rar.label}</span>` : ""}
    <span class="px ml-auto shrink-0" style="font-size:8px;color:var(--px-dim)">Ocupa tu día · tomar →</span>
  </div>`;
}

/* ── 2 · La cabecera de selección ───────────────────────────────────────────── */

export function cabecera(me, stageTxt) {
  const run = S.run;
  const btn = (id, ico, label, badge) => `<div id="${id}" class="relative flex flex-col items-center justify-center gap-0.5 cursor-pointer"
      style="width:40px;height:40px;background:var(--px-panel-hi);border:2px solid var(--px-line);box-shadow:2px 2px 0 var(--px-shadow)">
    ${pxIcon(ico, 20)}
    <span class="px" style="font-size:6px;color:var(--px-dim)">${label}</span>
    ${badge ? `<span class="px absolute flex items-center justify-center" style="top:-8px;right:-8px;min-width:18px;height:16px;background:var(--wc-red);border:2px solid var(--wc-black);font-size:8px;color:var(--px-ink)">${badge}</span>` : ""}
  </div>`;

  return `<div class="shrink-0 flex items-center gap-3 px-3" style="height:56px;background:var(--px-panel);border-bottom:2px solid var(--wc-black)">
    ${pxFlag(me)}
    <div class="flex flex-col gap-1 min-w-0">
      <div class="px truncate" style="font-size:16px;color:var(--px-ink)">${me.name}</div>
      <div class="px-body truncate" style="font-size:12.5px;letter-spacing:.1em;color:var(--px-dim);text-transform:uppercase">${stageTxt}</div>
    </div>
    <div class="ml-auto flex items-center gap-2">
      ${btn("px-journal", "diario", "Diario", run.journal.length > 99 ? "99" : run.journal.length)}
      ${btn("px-world", "trofeo", "Mundial", 0)}
      <div id="px-abandon" class="flex items-center justify-center cursor-pointer" title="Abandonar torneo"
        style="width:28px;height:28px;background:var(--px-panel);border:2px solid #22222c">${pxIcon("engranaje", 16)}</div>
    </div>
  </div>`;
}

/** La franja tricolor de los tres anfitriones. Cuatro píxeles y toda la marca. */
export const franjaAnfitriones = () => `<div class="shrink-0 flex" style="height:4px">
  <div class="flex-1" style="background:var(--wc-red)"></div>
  <div class="flex-1" style="background:var(--wc-green)"></div>
  <div class="flex-1" style="background:var(--wc-blue)"></div></div>`;

/* ── 3 · La línea de días ───────────────────────────────────────────────────── */

/** Qué icono pixel le toca a la temática de un día (las del contenido son emoji). */
const ICONO_TEMA = {
  entrenamiento: "silbato", vestuario: "moral", prensa: "diario", tactica: "diana",
  fisico: "energia", lesiones: "lesion", disciplina: "amarilla", mercado: "cronometro",
};

/**
 * La ventana de preparación entera, de su primer día al partido. Los vividos no se
 * borran (dan sensación de avance), HOY late en oro y el día del partido muestra al
 * rival. Es el mismo dato que la card vieja del calendario, con la ropa del kit.
 */
export function lineaDias(opp) {
  const run = S.run;
  const dias = [];
  for (let d = run.windowStart ?? run.day; d <= run.nextMatchDay; d++) dias.push(d);

  return `<div class="relative shrink-0 px-4 py-2" style="height:96px;background:var(--px-panel-lo);border-bottom:2px solid var(--wc-black)">
    <div class="absolute" style="left:40px;right:40px;top:52px;height:2px;background:#2a2a34"></div>
    <div class="relative flex items-end gap-2" style="height:80px">
      ${dias.map(d => {
        const hoy = d === run.day, pasado = d < run.day, partido = d === run.nextMatchDay;
        const plan = run.dayPlan[d];
        const th = plan ? EVENT_THEMES[plan.tema] : null;
        const cls = hoy ? "px-day-now" : partido ? "px-day-match" : pasado ? "px-day-past" : "px-day-next";
        const ico = partido ? "balon" : hoy ? "diana" : (ICONO_TEMA[plan?.tema] || "luna");
        const tinta = hoy ? "var(--wc-gold-light)" : partido ? "var(--px-warn)" : pasado ? "var(--px-faint)" : "#c8c8d2";
        const tema = partido ? "Partido" : th ? th.name : "Tranquilo";
        return `<div class="px-day ${cls}">
          ${hoy ? `<div class="px absolute" style="top:-9px;left:50%;transform:translateX(-50%);background:var(--wc-gold);color:var(--wc-black);font-size:8px;letter-spacing:.1em;padding:2px 6px;border:2px solid var(--wc-black)">Hoy</div>` : ""}
          <div class="px" style="font-size:11px;color:${tinta}">${dayLabel(d)}</div>
          <div class="flex items-center gap-1.5 mt-1">
            ${pxIcon(ico, 16)}
            <span class="px-body truncate" style="font-size:12px;letter-spacing:.08em;text-transform:uppercase;color:${hoy ? "#e6d9b0" : partido ? "#f0d9a8" : pasado ? "var(--px-faint)" : "#8b8b98"}">${tema}</span>
          </div>
          ${pasado ? `<div class="px" style="font-size:7px;color:var(--px-faint);margin-top:4px">✓ Vivido</div>` : ""}
          ${partido ? `<div class="flex items-center gap-1.5 mt-1">${pxFlag(opp, 18, 12)}<span class="px" style="font-size:8px;color:var(--px-warn)">vs ${opp.name}</span></div>` : ""}
        </div>`;
      }).join("")}
    </div>
  </div>`;
}

/* ── 4 · La columna derecha ─────────────────────────────────────────────────── */

/** Casillas de un medidor. 16 y no una barra continua: un valor en bloques se cuenta de un vistazo. */
export const SEGS = 16;
/** Color de una casilla apagada (la parte del tanque que falta). */
export const SEG_VACIO = "#3a3548";
/** Cuántas casillas prende un porcentaje. La usan el panel y la hoja de confirmación. */
export const segsLlenos = pct => Math.round((Math.max(0, Math.min(100, pct)) / 100) * SEGS);

/**
 * LOS TRES MEDIDORES del equipo, derivados del run. Es la ÚNICA fuente de esos tres
 * números y de sus colores: los pinta el panel "Mi equipo" y los vuelve a pintar la
 * hoja de confirmación de la Acción del Día (hub/confirm), que muestra el ANTES y el
 * DESPUÉS con las mismas barras. Calculados en dos sitios, la promesa de la hoja y el
 * estado del panel podrían llegar a decir cosas distintas.
 *
 * `num` es el número que se puede escribir como "56% → 71%"; el Ritmo no tiene (su
 * barra es una escala de tres escalones, no un porcentaje) y por eso va en null: ahí
 * lo que se compara es `valor`, el texto.
 */
export function medidoresEquipo(run) {
  const moral = run.moral ?? 50;
  const mb = moraleBand(moral);
  const energia = Math.round(run.squad.reduce((s, p) => s + p.energia, 0) / run.squad.length);
  const ox = oxidState(run);
  return [
    { id: "moral", ico: "moral", label: "Moral", pct: moral, num: moral, valor: mb.label,
      color: moral >= 61 ? "var(--px-ok)" : moral >= 41 ? "#c8c8d2" : "var(--px-bad)" },
    { id: "energia", ico: "energia", label: "Energía", pct: energia, num: energia, valor: `${energia}%`,
      color: energia >= 70 ? "var(--px-ok)" : energia >= 45 ? "var(--px-warn)" : "var(--px-bad)" },
    { id: "ritmo", ico: "ritmo", label: "Ritmo", pct: ox.oxidado ? 30 : ox.racha ? 65 : 100, num: null,
      valor: ox.oxidado ? `Oxidado −${Math.round((1 - ox.mult) * 100)}%` : ox.racha ? `${ox.racha}d sin entrenar` : "Al día",
      color: ox.oxidado ? "var(--px-bad)" : ox.racha ? "var(--px-warn)" : "var(--px-ok)" },
  ];
}

/** Un medidor pintado, tal como sale de `medidoresEquipo`. */
export function medidor({ ico, label, pct, valor, color }) {
  const llenas = segsLlenos(pct);
  return `<div class="flex items-center gap-2 mb-1.5">
    ${pxIcon(ico, 16)}
    <span class="px" style="width:56px;font-size:8px;color:var(--px-dim)">${label}</span>
    <div class="flex-1 flex gap-0.5">
      ${Array.from({ length: SEGS }, (_, k) => `<div class="px-seg" style="background:${k < llenas ? color : SEG_VACIO}"></div>`).join("")}
    </div>
    <span class="px text-right" style="width:88px;font-size:8px;letter-spacing:.04em;color:${color}">${valor}</span>
  </div>`;
}

/**
 * LOS EFECTOS acumulados para el próximo partido, en la ropa del kit.
 *
 * El que ya llegó al umbral se marca con ✨ y ES un botón (`canje-opt`): se puede
 * cambiar ese boost de un partido por crecimiento PERMANENTE. Ese canje es una de
 * las pocas decisiones gratis del juego y por eso vive acá, a la vista, y no
 * escondido en otra pantalla.
 */
function efectos() {
  const run = S.run;
  const canjeables = new Set(canjeableBuffs(run).map(c => c.key));
  const tags = [];
  for (const [k, v] of Object.entries(run.buffs)) {
    if (k === "antiLesion") { if (v) tags.push([null, "Sin lesiones", "var(--px-ok)"]); continue; }
    if (k === "penales") { if (v) tags.push([null, "Penales +", "var(--px-ok)"]); continue; }
    if (k === "tactica" || !v || !STAT_LABELS[k]) continue;   // `tactica` es reliquia pre-F1
    if (canjeables.has(k)) tags.push([k, `✨ ${STAT_LABELS[k]} +${v}`, "var(--team-primary)"]);
    else tags.push([null, `${STAT_LABELS[k]} ${v > 0 ? "+" : ""}${v}`, v > 0 ? "var(--px-ok)" : "var(--px-bad)"]);
  }
  if (!tags.length) return "";
  return `<div class="px-2.5 pb-2 flex flex-wrap gap-1">
    ${tags.map(([key, txt, col]) => key
      ? `<button class="canje-opt px-tag" data-key="${key}" style="color:${col};border-color:${col};background:rgba(0,0,0,.35);cursor:pointer" title="Canjear por crecimiento permanente — no gasta el día">${txt}</button>`
      : `<span class="px-tag" style="color:${col};border-color:${col};background:rgba(0,0,0,.35)">${txt}</span>`).join("")}
  </div>`;
}

/**
 * MI EQUIPO: la cancha con el once, los tres medidores, los efectos y los avisos que
 * de verdad bloquean. Los avisos van RECORTADOS a tres: la card tiene alto fijo y una
 * semana mala genera ocho. Los que quedan fuera se cuentan ("ver N más" → plantilla).
 */
function cardEquipo(avisos) {
  const run = S.run;
  const visibles = avisos.slice(0, 3), resto = avisos.length - visibles.length;

  return `<div class="px-panel flex flex-col" style="flex:1;min-height:0">
    <div class="px-head">
      ${pxIcon("escudo", 16)}
      <span class="px" style="font-size:10px;letter-spacing:.1em">Mi equipo</span>
      <span class="px-body ml-auto" style="font-size:13px;letter-spacing:.08em;color:var(--px-dim)">${getFormation(S.formation) ? S.formation : "Improvisada"}</span>
    </div>
    <div id="hub-pitch" class="pitch pitch-mini relative cursor-pointer" title="Ir a Gestión de Plantilla"
      style="flex:1;min-height:96px;max-height:188px;margin:6px;border:2px solid var(--wc-black);overflow:hidden"></div>
    <div class="px-2.5 pb-2">
      ${medidoresEquipo(run).map(medidor).join("")}
    </div>
    ${efectos()}
    <div class="px-2.5 pb-2 flex flex-col gap-1.5" style="min-height:0;overflow:hidden">
      ${visibles.map(a => `<div class="flex items-center gap-2" style="padding:4px 8px;background:${a.bg};border:2px solid ${a.col}${a.fuerte ? `;box-shadow:inset 5px 0 0 ${a.col}` : ""}">
        ${pxIcon(a.ico, a.fuerte ? 24 : 16)}
        <div class="min-w-0">
          ${a.fuerte ? `<div class="px" style="font-size:9px;color:${a.col}">${a.titulo}</div>` : ""}
          <div class="px-body truncate" style="font-size:13px;color:${a.txtCol}">${a.txt}</div>
        </div>
      </div>`).join("")}
      ${resto > 0 ? `<div id="px-mas" class="px cursor-pointer self-end" style="font-size:8px;color:var(--px-dim);text-decoration:underline">Ver ${resto} más</div>` : ""}
    </div>
    <div id="btn-squad" class="px cursor-pointer" style="margin:0 10px 8px;height:28px;display:flex;align-items:center;justify-content:center;background:#1f2b38;border:2px solid var(--team-primary);box-shadow:2px 2px 0 var(--px-shadow);font-size:9px;color:#cfe4f5">Gestión de plantilla →</div>
  </div>`;
}

/** PRÓXIMO RIVAL: bandera, estrellas y media. Clic → informe del cuerpo técnico. */
function cardRival(opp) {
  const run = S.run;
  const estrellas = teamStars(opp);
  return `<div class="px-panel shrink-0">
    <div class="px-head" style="padding:6px 10px">
      ${pxIcon("balon", 16)}
      <span class="px" style="font-size:10px;letter-spacing:.1em">Próximo rival</span>
      <span class="px-body ml-auto" style="font-size:13px;color:var(--px-warn);text-transform:uppercase">${dayLabel(run.nextMatchDay)}</span>
    </div>
    <div class="flex items-center gap-2.5 p-2.5">
      ${pxFlag(opp, 44, 30)}
      <div class="min-w-0">
        <div class="px truncate" style="font-size:13px;letter-spacing:.06em">${opp.name}</div>
        <div class="flex items-center gap-1.5 mt-1">
          <div class="flex gap-0.5">
            ${Array.from({ length: 5 }, (_, k) => `<div style="width:10px;height:10px;background:${k < estrellas ? "var(--wc-gold)" : "#2b2b36"};border:2px solid var(--wc-black)"></div>`).join("")}
          </div>
          <span class="px" style="font-size:9px;color:var(--wc-gold-light)">Media ${teamRating(opp)}</span>
        </div>
      </div>
    </div>
    <div id="btn-scout" class="px cursor-pointer" style="margin:0 10px 8px;height:26px;display:flex;align-items:center;justify-content:center;background:var(--px-panel-hi);border:2px solid var(--wc-gold);font-size:9px;color:var(--wc-gold-light)">Ver informe →</div>
  </div>`;
}

/** La tabla del grupo, con la pestaña de goleadores al lado. */
function cardGrupo(tabla, grupoName) {
  return `<div class="px-panel shrink-0">
    <div class="flex items-stretch" style="background:var(--px-panel-lo);border-bottom:2px solid var(--wc-black)">
      <div class="px" style="padding:7px 12px;background:var(--px-panel);border-right:2px solid var(--wc-black);border-bottom:2px solid var(--wc-gold);font-size:9px;letter-spacing:.1em;color:var(--wc-gold-light)">Grupo</div>
      <div id="btn-scorers" class="px cursor-pointer" style="padding:7px 12px;border-right:2px solid var(--wc-black);font-size:9px;letter-spacing:.1em;color:#8f889f">Goleadores</div>
      <div class="px ml-auto flex items-center px-2.5" style="font-size:8px;color:var(--px-faint)">${grupoName}</div>
    </div>
    <div style="padding:6px 10px 8px">
      <div class="px flex items-center gap-2" style="padding:0 6px 4px;font-size:7px;color:var(--px-faint)">
        <span style="width:18px">#</span><span class="flex-1">Equipo</span>
        <span class="text-right" style="width:26px">PJ</span><span class="text-right" style="width:32px">DG</span><span class="text-right" style="width:32px">Pts</span>
      </div>
      ${tabla.map((t, i) => `<div class="flex items-center gap-2" style="padding:4px 6px;margin-bottom:2px;border:2px solid ${t.mine ? "var(--wc-gold)" : "#3a3548"};background:${t.mine ? "#2e2415" : "rgba(40,36,52,.85)"};color:${t.mine ? "var(--wc-gold-light)" : "#d4cee0"}">
        <span class="px" style="width:18px;font-size:9px;color:var(--px-dim)">${i + 1}</span>
        <span class="px-body flex-1 truncate" style="font-weight:600;font-size:14px;letter-spacing:.04em">${t.name}</span>
        <span class="px text-right" style="width:26px;font-size:9px">${t.pj}</span>
        <span class="px text-right" style="width:32px;font-size:9px">${t.dg > 0 ? "+" : ""}${t.dg}</span>
        <span class="px text-right" style="width:32px;font-size:9px">${t.pts}</span>
      </div>`).join("")}
    </div>
  </div>`;
}

/** La columna entera. Flota sobre el mapa y nunca lo pisa (el complejo acaba en x=1030). */
export function columnaDerecha(opp, avisos, tabla, grupoName) {
  return `<div class="absolute flex flex-col gap-2" style="right:12px;top:12px;bottom:12px;width:372px;z-index:40">
    ${cardEquipo(avisos)}
    ${cardRival(opp)}
    ${cardGrupo(tabla, grupoName)}
  </div>`;
}

/* ── 5 · La barra de acción ─────────────────────────────────────────────────── */

/**
 * El pie: a la izquierda el estado de la doctrina (clic → pizarra de rasgos: es
 * gratis, por eso vive acá y no en un edificio) y a la derecha el botón grande.
 * `cta` decide qué hace ese botón — pasar el día o entrar al partido.
 */
export function barraAccion({ listo, ayuda, ayudaOk, cta }) {
  const run = S.run;
  const f = getPhilosophy(run.filoId);
  const lvl = filoLevel(run);
  const pts = filoPoints(run);
  const next = FILO_LEVELS[lvl + 1] || null;
  return `<div class="shrink-0 flex items-center gap-4 px-4" style="height:72px;background:var(--px-panel);border-top:2px solid var(--wc-black)">
    <div id="btn-filo" class="flex flex-col gap-1 cursor-pointer" title="Abrir la pizarra del DT — mirar y comprar rasgos no gasta el día">
      <div class="flex items-center gap-1.5">
        ${pxIcon("escudo", 16)}
        <span class="px" style="font-size:9px;color:var(--wc-gold-light)">${f ? `${f.name} Nv${lvl + 1}` : "Sin identidad"}</span>
        <span class="px" style="font-size:9px;color:#3a3a46">·</span>
        <span class="px" style="font-size:9px;color:var(--px-dim)">DT Nv${run.dtNivel || 1}</span>
        <span class="px" style="font-size:9px;color:#3a3a46">·</span>
        <span class="px" style="font-size:9px;color:${run.identityPoints > 0 ? "var(--px-free)" : "var(--px-faint)"}">${run.identityPoints || 0} PI</span>
        ${next ? `<span class="px-body" style="font-size:12px;color:var(--px-faint)">${pts}/${next.min} XP</span>` : ""}
      </div>
      <div class="px-body" style="font-size:13.5px;letter-spacing:.04em;color:${ayudaOk ? "var(--px-ok)" : "var(--px-bad)"}">${ayuda}</div>
    </div>
    <button id="${cta.id}" class="px px-btn ml-auto" ${listo ? "" : "disabled"} style="width:560px;height:52px;font-size:16px;letter-spacing:.1em">
      ${pxIcon(cta.ico, 24)}${cta.label}
    </button>
  </div>`;
}
