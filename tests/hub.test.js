/* ============================================================
   Test del COMPLEJO del hub (rediseño del 6-ago-2026).

   El mapa no se puede probar mirándolo: si una parcela se sale de su caja o un
   edificio se queda sin sprite, el bug es una mancha en una captura que nadie
   compara. Estas comprobaciones son geométricas y de cobertura — justo lo que la
   vista no chequea sola.

   `complex.js` y `pixicons.js` se importan en Node porque NO tocan el DOM (dibujan
   strings SVG). El resto del hub sí lo toca y lo cubre ui.validate.js, que al menos
   garantiza que parsea.

   Uso: node tests/hub.test.js
   ============================================================ */
import { PLOTS, PLANO_H, ACCESOS, plotHtml, complexGround } from "../js/ui/screens/hub/complex.js";
import { pxIcon, PX_ICON_NAMES } from "../js/ui/pixicons.js";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
let n = 0, fails = 0;
const assert = (cond, msg, extra = "") => {
  n++;
  if (!cond) { fails++; console.error(`FAIL: ${msg}${extra ? ` — ${extra}` : ""}`); }
};

/* ── Las seis parcelas ──────────────────────────────────────────────────────── */

// La columna derecha del HUD arranca en x=1056: ninguna parcela puede llegar ahí,
// o el edificio queda debajo del panel y deja de ser clickeable.
const COL_HUD = 1056;

assert(PLOTS.length === 6, "el complejo tiene seis parcelas", PLOTS.length);
assert(new Set(PLOTS.map(p => p.id)).size === 6, "los ids de parcela son únicos");

for (const p of PLOTS) {
  const html = plotHtml(p, { titulo: "X", tip: "Y" });
  assert(html.includes("<svg"), "la parcela dibuja su edificio", p.id);
  assert(html.includes(`data-plot="${p.id}"`), "la parcela declara su id para el cableado", p.id);
  // Geometría: la caja de la parcela más su cartel (+54) tiene que entrar en el plano.
  const top = p.cy - p.h / 2, bottom = p.cy + p.h / 2 + 54, right = p.cx + p.w / 2;
  assert(top >= 0, "la parcela no se sale por arriba", `${p.id}: ${top}`);
  assert(bottom <= PLANO_H, "la parcela y su cartel entran en el plano", `${p.id}: ${bottom} > ${PLANO_H}`);
  assert(right < COL_HUD, "la parcela no queda debajo de la columna del HUD", `${p.id}: ${right} ≥ ${COL_HUD}`);
}

// Dos parcelas no pueden solaparse: el clic caería siempre en la de encima.
for (let i = 0; i < PLOTS.length; i++) {
  for (let j = i + 1; j < PLOTS.length; j++) {
    const a = PLOTS[i], b = PLOTS[j];
    const solapa = Math.abs(a.cx - b.cx) < (a.w + b.w) / 2 && Math.abs(a.cy - b.cy) < (a.h + b.h) / 2;
    assert(!solapa, "dos parcelas no se pisan", `${a.id} × ${b.id}`);
  }
}

/* ── Los estados de una parcela ─────────────────────────────────────────────── */

const st = extra => plotHtml(PLOTS[0], { titulo: "Campo", tip: "T", ...extra });
assert(st({ free: true }).includes("no gasta el día"), "el edificio GRATIS lo declara en su cartel");
assert(st({ boost: true }).includes("×2 hoy"), "el edificio POTENCIADO muestra su multiplicador");
assert(!st({ boost: true, locked: true }).includes("×2 hoy"), "un edificio bloqueado no ofrece su ×2 (sería mentir)");
assert(st({ locked: true }).includes("data-locked"), "el BLOQUEADO se marca para que el clic lo ignore");
assert(st({ mine: true }).includes("elegida hoy"), "el ELEGIDO se sella");
assert(st({ off: true }).includes("data-off"), "el APAGADO se marca (ya decidiste otra cosa)");

/* ── Los iconos ─────────────────────────────────────────────────────────────── */

assert(pxIcon("balon", 16).startsWith("<svg"), "pxIcon dibuja un icono conocido");
assert(pxIcon("no_existe") === "", "un icono inexistente devuelve vacío, no rompe la pantalla");

// Todo nombre de icono que el hub pida tiene que existir. Un typo no lo caza ni el
// parseo ni una captura: `pxIcon` devuelve "" y queda un hueco mudo en la interfaz.
//
// Se miran los DOS sitios donde un nombre se escribe a mano:
//   · las llamadas literales `pxIcon("x", n)`
//   · las TABLAS de traducción (ICONO_TEMA, ICONO_FOCO), que son las peligrosas —
//     su valor solo se usa cuando el día trae esa temática o el foco ese id, así
//     que un typo ahí puede pasar semanas sin aparecer.
const usados = new Set();
for (const f of ["js/ui/screens/hub/hud.js", "js/ui/screens/hub/panels.js", "js/ui/screens/hub/complex.js"]) {
  const src = fs.readFileSync(path.join(ROOT, f), "utf8");
  for (const m of src.matchAll(/pxIcon\(\s*"([a-z_]+)"/g)) usados.add(m[1]);
  for (const tabla of src.matchAll(/const ICONO_[A-Z]+ = \{([\s\S]*?)\};/g)) {
    for (const m of tabla[1].matchAll(/:\s*"([a-z_]+)"/g)) usados.add(m[1]);
  }
}
for (const name of usados) assert(PX_ICON_NAMES.includes(name), "el icono que pide el hub existe", name);
assert(usados.size >= 12, "se detectaron los iconos del hub", `solo ${usados.size}`);

/* ── La red vial ────────────────────────────────────────────────────────────── */

// LO QUE PIDIÓ EL PO: que las calles conecten los edificios, no que pasen cerca.
// Cada parcela tiene que tener su ramal, y ese ramal tiene que MORIR en su puerta
// (el vértice de abajo del rombo). Es un invariante geométrico: si alguien mueve
// una parcela y el ramal se despega, en una captura no se nota — parece que la
// calle "casi" llega. Acá sí se nota.
assert(ACCESOS.length === PLOTS.length, "cada edificio tiene su ramal de acceso", `${ACCESOS.length} de ${PLOTS.length}`);

// Un ramal es siempre `M x yAvenida L x yPuerta`: cuatro números y nada más.
const tramos = ACCESOS.map(d => d.match(/-?\d+(?:\.\d+)?/g).map(Number));
for (const p of PLOTS) {
  const puertaX = p.cx, puertaY = p.cy + p.h / 2;
  const ramal = tramos.find(([x0, , x1, y1]) => x0 === puertaX && x1 === puertaX && Math.abs(y1 - puertaY) <= 8);
  assert(ramal, "el ramal muere en la puerta del edificio", p.id);
  if (ramal) assert(ramal[1] > ramal[3], "el ramal baja de la puerta hacia la avenida", `${p.id}: ${ramal.join(",")}`);
}

/* ── El suelo ───────────────────────────────────────────────────────────────── */

const suelo = complexGround();
assert(suelo.includes(`viewBox="0 0 1440 ${PLANO_H}"`), "las calles usan el MISMO sistema de coordenadas que las parcelas");
assert(/stroke-width="34"/.test(suelo) && /stroke-width="24"/.test(suelo), "cada calle lleva su contorno y su asfalto");
assert(/stroke-width="18"/.test(suelo), "los ramales de acceso se pintan más finos que la avenida");

console.log(`hub.test: ${n} checks · fallos: ${fails}`);
if (fails) process.exit(1);
console.log("✅ hub OK");
