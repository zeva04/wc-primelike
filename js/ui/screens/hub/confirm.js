/* ============================================================
   ui/screens/hub/confirm — LA HOJA DE CONFIRMACIÓN de la Acción del Día.

   LA REGLA: ninguna acción que gaste el día se ejecuta con un clic suelto. El
   edificio abre una hoja que dice CON NÚMEROS qué va a pasar — las mismas barras
   del panel "Mi equipo", con los cuadrados que se van a mover titilando y el
   antes → después escrito debajo — y recién ahí se confirma.

   De dónde salen los números: de `previewDayAction` (game/day-action), que corre
   el efecto REAL de la acción sobre un clon del run. Esta pantalla no reimplementa
   ni una fórmula, así que la hoja no puede prometer algo distinto de lo que pasa
   al confirmar — `tests/day-action.test` fija esa igualdad. Por eso también los
   clamps se ven solos: si el plantel está al 95%, "+15 de energía" muestra el +5
   que de verdad va a entrar.

   Dos estados, la misma hoja y el mismo sitio (nada salta de lugar al confirmar):

     PREVIA     los cuadrados que se van a mover TITILAN, y hay dos salidas:
                Cancelar (no pasó nada) o Confirmar.
     RESULTADO  ya está aplicado: los cuadrados VIAJAN a su valor final en
                cascada, el titular canta lo que pasó y queda una sola salida.

   El viaje de los cuadrados son transiciones CSS con `transition-delay` escalonado,
   no un temporizador de JS: así el congelador de animaciones del deep-link
   (js/dev/deeplink) los deja directamente en su estado final y una captura sale
   limpia en vez de pillar la cascada por la mitad.
   ============================================================ */
import { previewDayAction, multLabel } from "../../../game/day-action.js";
import { STAT_LABELS, PLAN_XP_MULT } from "../../../content/daily/day-actions.js";
import { getPhilosophy } from "../../../content/identity/philosophies.js";
import { S } from "../../session.js";
import { pxIcon } from "../../pixicons.js";
import { medidoresEquipo, SEGS, SEG_VACIO, segsLlenos } from "./hud.js";

/** El icono pixel de cada acción (el emoji del contenido no entra al kit del hub). */
const ICONO = {
  entrenar_ataque: "diana", entrenar_defensa: "escudo", entrenar_pase_corto: "balon",
  entrenar_pase_largo: "flecha", entrenar_velocidad: "energia",
  recuperar: "luna", bonding: "moral",
};
const iconoDe = a => ICONO[a.id] || (a.group === "tactica" ? "escudo" : "silbato");

/** Cuánto tarda cada cuadrado en encenderse después del anterior (la cascada). */
const PASO_MS = 45;

/* ── Qué cambia ─────────────────────────────────────────────────────────────── */

/**
 * Las filas de medidor que SE MUEVEN: se comparan los tres del equipo (moral,
 * energía, ritmo) entre el run de hoy y el proyectado, y se descartan los que
 * quedan igual. Una hoja que muestra tres barras de las cuales dos no se mueven
 * enseña menos que una que muestra solo la que sí.
 */
function filasMedidor(run, sim) {
  const hoy = medidoresEquipo(run), luego = medidoresEquipo(sim);
  return luego
    .map((f, i) => ({ ...f, antes: hoy[i] }))
    .filter(f => f.pct !== f.antes.pct || f.valor !== f.antes.valor);
}

/** Los buffs de stat que cambian (el boost del entrenamiento), con su acumulado. */
function filasBuff(run, sim) {
  const claves = new Set([...Object.keys(run.buffs || {}), ...Object.keys(sim.buffs || {})]);
  const out = [];
  for (const k of claves) {
    if (!STAT_LABELS[k]) continue;                       // `tactica`/`penales` no son stats
    const a = run.buffs[k] || 0, d = sim.buffs[k] || 0;
    if (a !== d) out.push({ label: STAT_LABELS[k], antes: a, despues: d });
  }
  return out;
}

/* ── Cómo se ve ─────────────────────────────────────────────────────────────── */

/**
 * Los 16 cuadrados de una barra, repartidos en tres tramos: los que ya estaban y
 * se quedan, los PENDIENTES (el tramo que la acción mueve) y los apagados. Cada
 * cuadrado sale pintado como está HOY y lleva escrito a dónde va (`data-fin`) más
 * el retraso de su turno en la cascada — el resultado solo tiene que soltarlos.
 */
function cuadrados(f) {
  const A = segsLlenos(f.antes.pct), D = segsLlenos(f.pct);
  const sube = D > A, lo = Math.min(A, D), hi = Math.max(A, D);
  return Array.from({ length: SEGS }, (_, k) => {
    const fijo = k < lo, pendiente = k >= lo && k < hi;
    // Al subir, el tramo pendiente arranca vacío y titila en el color que va a ganar.
    // Al bajar, arranca lleno y titila en rojo: son los cuadrados que se pierden.
    const ini = fijo ? f.antes.color : pendiente && !sube ? f.antes.color : SEG_VACIO;
    const fin = fijo || (pendiente && sube) ? f.color : SEG_VACIO;
    const destaca = sube ? f.color : "var(--px-bad)";
    // El orden del viaje: subiendo se llena hacia afuera, bajando se vacía desde la punta.
    const turno = sube ? k - lo + 1 : hi - k;
    return `<div class="px-seg${pendiente ? " px-seg-pend" : ""}" data-fin="${fin}"
      style="background:${ini};${pendiente ? `--seg-a:${destaca};--seg-b:${ini};` : ""}transition:background-color 140ms steps(2,end);transition-delay:${(pendiente ? turno : 0) * PASO_MS}ms"></div>`;
  }).join("");
}

/** Una fila entera: icono, nombre, barra y el antes → después escrito debajo. */
function filaMedidor(f) {
  const sube = f.pct > f.antes.pct;
  const flecha = sube ? "var(--px-ok)" : "var(--px-bad)";
  // El número manda cuando existe ("56% → 71%"); el Ritmo no tiene y compara su texto.
  const izq = f.num === null ? f.antes.valor : `${f.antes.num}%`;
  const der = f.num === null ? f.valor : `${f.num}%`;
  // La Moral además cambia de BANDA, y la banda es lo que el DT reconoce ("Estable
  // → Alta"). Solo se escribe cuando dice algo que el número no dice ya.
  const banda = f.valor !== der && f.valor !== f.antes.valor ? `${f.antes.valor} → ${f.valor}` : "";
  return `<div style="margin-bottom:12px">
    <div class="flex items-center gap-2">
      ${pxIcon(f.ico, 16)}
      <span class="px" style="width:56px;font-size:8px;color:var(--px-dim)">${f.label}</span>
      <div class="flex-1 flex gap-0.5">${cuadrados(f)}</div>
    </div>
    <div class="flex items-baseline gap-2" style="margin-left:74px;margin-top:5px">
      <span class="px" style="font-size:11px;color:var(--px-faint)">${izq}</span>
      <span class="px" style="font-size:11px;color:${flecha}">→</span>
      <span class="px" style="font-size:13px;color:${f.color}">${der}</span>
      ${banda ? `<span class="px-body" style="font-size:12.5px;color:var(--px-dim)">${banda}</span>` : ""}
    </div>
  </div>`;
}

/** Los boosts de stat del entrenamiento: no son un tanque, son un contador. */
function filaBuff(b) {
  return `<div class="flex items-center gap-2" style="margin-bottom:8px">
    ${pxIcon("diana", 16)}
    <span class="px" style="width:56px;font-size:8px;color:var(--px-dim)">${b.label}</span>
    <span class="px" style="font-size:11px;color:var(--px-faint)">${b.antes > 0 ? `+${b.antes}` : "sin boost"}</span>
    <span class="px" style="font-size:11px;color:var(--px-ok)">→</span>
    <span class="px" style="font-size:13px;color:var(--px-ok)">+${b.despues}</span>
    <span class="px-body" style="font-size:12.5px;color:var(--px-dim)">para el próximo partido</span>
  </div>`;
}

/** El cambio de identidad del Plan de partido: no mueve barras, mueve a qué juega el equipo. */
function filaPlan(run, sim) {
  if (run.filoId === sim.filoId) return "";
  const de = getPhilosophy(run.filoId), a = getPhilosophy(sim.filoId);
  return `<div class="flex items-center gap-2" style="margin-bottom:8px">
    ${pxIcon("escudo", 16)}
    <span class="px" style="width:56px;font-size:8px;color:var(--px-dim)">Identidad</span>
    <span class="px" style="font-size:11px;color:var(--px-faint)">${de ? de.name : "sin identidad"}</span>
    <span class="px" style="font-size:11px;color:var(--px-ok)">→</span>
    <span class="px" style="font-size:13px;color:var(--wc-gold-light)">${a.name}</span>
  </div>`;
}

/** Cabecera de la hoja: quién habla y con qué cara. */
const cabezaHoja = (a, titulo, consigna, color) => `<div class="px-sheet-head">
  ${pxIcon(iconoDe(a), 16)}
  <span class="px" style="font-size:11px;letter-spacing:.1em;color:${color}">${titulo}</span>
  <span class="px-body ml-auto" style="font-size:13px;letter-spacing:.08em;text-transform:uppercase;color:var(--px-dim)">${consigna}</span>
</div>`;

/* ── Las dos caras de la hoja ───────────────────────────────────────────────── */

/**
 * PREVIA. `estado` es lo que guarda el hub: `{ id }`. Devuelve "" si la acción ya
 * no se puede tomar (el motor manda: si `previewDayAction` dice que no, no hay hoja).
 */
export function hojaPrevia(estado) {
  const run = S.run;
  const pv = previewDayAction(run, estado.id);
  if (!pv) return "";
  const medidores = filasMedidor(run, pv.sim);
  const buffs = filasBuff(run, pv.sim);
  const plan = filaPlan(run, pv.sim);
  return `<div class="px-scrim"></div>
  <div class="px-confirm" id="pxc-hoja">
    ${cabezaHoja(pv, pv.title, "Acción del día", "var(--wc-gold-light)")}
    <div style="padding:14px 16px 4px">
      <div class="px-body" style="font-size:14px;color:#d8d8e2;margin-bottom:14px">
        ${pv.desc}${pv.mult !== 1 ? ` · <b style="color:var(--wc-gold-light)">${multLabel(pv.mult)} hoy</b>` : ""}
      </div>
      ${plan}
      ${buffs.map(filaBuff).join("")}
      ${medidores.map(filaMedidor).join("")}
      ${pv.group === "tactica" ? `<div class="px-body" style="font-size:12.5px;color:var(--px-dim);margin-bottom:8px">
        La idea declarada sale más seguido y rinde ×${PLAN_XP_MULT} de experiencia en el próximo partido. Se aprende jugando, no eligiendo.
      </div>` : ""}
      <div class="px-body" style="font-size:12.5px;color:var(--px-faint);margin-bottom:12px">
        Confirmar gasta el día: el resto del complejo queda cerrado hasta mañana.
      </div>
    </div>
    <div class="flex gap-2" style="padding:0 16px 16px">
      <button id="pxc-cancel" class="px px-btn2" style="flex:1;height:40px;font-size:10px">Cancelar</button>
      <button id="pxc-ok" class="px px-btn" style="flex:1.4;height:40px;font-size:12px">Confirmar</button>
    </div>
  </div>`;
}

/**
 * RESULTADO. `estado` trae la foto de ANTES (`filas`, `buffs`, `plan`) tomada
 * justo antes de aplicar: la hoja se pinta en ese estado viejo y `animarHoja()`
 * la suelta al nuevo, para que el movimiento se VEA. Volver a leer el run acá
 * pintaría el final directamente y no habría viaje que mirar.
 */
export function hojaResultado(estado) {
  return `<div class="px-scrim"></div>
  <div class="px-confirm" id="pxc-hoja">
    ${cabezaHoja(estado.accion, estado.accion.title, "Hecho", "var(--px-ok)")}
    <div style="padding:14px 16px 4px">
      <div class="px" style="font-size:13px;color:var(--px-ok);margin-bottom:14px">${estado.done}</div>
      ${estado.plan}
      ${estado.buffs.map(filaBuff).join("")}
      ${estado.filas.map(filaMedidor).join("")}
    </div>
    <div class="flex" style="padding:0 16px 16px">
      <button id="pxc-close" class="px px-btn" style="flex:1;height:40px;font-size:12px">Cerrar</button>
    </div>
  </div>`;
}

/**
 * Suelta los cuadrados hacia su valor final. Se llama justo después de pintar el
 * resultado: la hoja nace con los valores VIEJOS y esta función los cambia, que es
 * lo que dispara la transición (y con ella la cascada de `transition-delay`).
 *
 * Va en DOS tiempos, y el orden es todo el truco:
 *   1 · se apaga el titileo (el cuadrado deja de ser una promesa) y se OBLIGA al
 *       navegador a recalcular con `offsetWidth`. Sin esa lectura, apagar la
 *       animación y escribir el color nuevo caen en el mismo ciclo: el navegador
 *       nunca ve el color viejo asentado y no hay nada desde donde animar.
 *   2 · recién ahí se escribe el destino, y la transición arranca.
 *
 * Se hace así y no con `requestAnimationFrame` porque el rAF no dispara si la
 * pestaña no está componiendo: una ventana oculta dejaría la hoja clavada en el
 * ANTES, que es justo lo contrario de lo que tiene que contar.
 */
export function animarHoja() {
  const hoja = document.getElementById("pxc-hoja");
  if (!hoja) return;
  const cuadros = [...hoja.querySelectorAll("[data-fin]")];
  cuadros.forEach(el => el.classList.remove("px-seg-pend"));
  void hoja.offsetWidth;
  cuadros.forEach(el => { el.style.background = el.dataset.fin; });
}

/**
 * La foto del ANTES que el resultado necesita, tomada con el run todavía intacto.
 * La saca el hub justo antes de aplicar la acción.
 */
export function fotoAntes(id) {
  const run = S.run;
  const pv = previewDayAction(run, id);
  if (!pv) return null;
  return {
    accion: pv,
    done: pv.done || `¡${pv.title}!`,
    filas: filasMedidor(run, pv.sim),
    buffs: filasBuff(run, pv.sim),
    plan: filaPlan(run, pv.sim),
  };
}
