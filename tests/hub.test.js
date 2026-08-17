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
import { PLOTS, PLANO_H, ACCESOS, CALZADAS, ENTRADAS, CALLE_Y, ORIGEN_DY, plotHtml, complexGround } from "../js/ui/screens/hub/complex.js";
import { pxIcon, PX_ICON_NAMES } from "../js/ui/pixicons.js";
import { traitIcon, traitIconG, TRAIT_ICON_IDS } from "../js/ui/traiticons.js";
import { TRAITS } from "../js/content/traits/index.js";
import { pxFlag } from "../js/ui/screens/hub/hud.js";
import { WC_DATA } from "../data/teams.js";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
let n = 0, fails = 0;
const assert = (cond, msg, extra = "") => {
  n++;
  if (!cond) { fails++; console.error(`FAIL: ${msg}${extra ? ` — ${extra}` : ""}`); }
};

/* ── Las cinco parcelas ─────────────────────────────────────────────────────── */

// La columna derecha del HUD arranca en x=1056: ninguna parcela puede llegar ahí,
// o el edificio queda debajo del panel y deja de ser clickeable.
const COL_HUD = 1056;

// EL REPLANTEO DEL 10-AGO-2026: cuatro esquinas y un centro. Enfermería y Scouting
// se fueron (duplicaban botones de la columna derecha) y entró el estacionamiento.
const ESPERADAS = ["residencia", "video", "campo", "asado", "estacionamiento"];
assert(PLOTS.length === 5, "el complejo tiene cinco parcelas", PLOTS.length);
assert(new Set(PLOTS.map(p => p.id)).size === 5, "los ids de parcela son únicos");
for (const id of ESPERADAS) assert(PLOTS.some(p => p.id === id), "la parcela esperada existe", id);

// El campo va AL CENTRO y las otras cuatro a las esquinas. No es decoración: es la
// gramática del plano, y de ella cuelgan los huecos por donde bajan las calzadas.
// Las cuatro tienen que caer en CUATRO CUADRANTES DISTINTOS alrededor del campo:
// dos en la misma esquina dejarían medio predio vacío y el otro medio apretado.
const campo = PLOTS.find(p => p.id === "campo");
const cuadrantes = new Set();
for (const p of PLOTS.filter(x => x.id !== "campo")) {
  assert(Math.abs(p.cx - campo.cx) > 250, "la parcela se aparta del campo en X", `${p.id}: ${p.cx}`);
  assert(Math.abs(p.cy - campo.cy) > 100, "la parcela se aparta del campo en Y", `${p.id}: ${p.cy}`);
  cuadrantes.add(`${p.cx < campo.cx ? "O" : "E"}${p.cy < campo.cy ? "N" : "S"}`);
}
assert(cuadrantes.size === 4, "hay una parcela en cada esquina", [...cuadrantes].join(","));

for (const p of PLOTS) {
  const html = plotHtml(p, { titulo: "X", tip: "Y" });
  assert(html.includes("<svg"), "la parcela dibuja su edificio", p.id);
  assert(html.includes(`data-plot="${p.id}"`), "la parcela declara su id para el cableado", p.id);
  // Geometría: la caja de la parcela más su cartel (+54) tiene que entrar en el
  // plano SIN pisar la calle exterior, que ahora corre por el borde de abajo.
  const top = p.cy - p.h / 2, bottom = p.cy + p.h / 2 + 54, right = p.cx + p.w / 2;
  assert(top >= 0, "la parcela no se sale por arriba", `${p.id}: ${top}`);
  assert(bottom <= PLANO_H, "la parcela y su cartel entran en el plano", `${p.id}: ${bottom} > ${PLANO_H}`);
  assert(bottom <= CALLE_Y - 15, "la parcela no invade la calle exterior", `${p.id}: ${bottom} > ${CALLE_Y - 15}`);
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

// EL HITBOX ES EL EDIFICIO (decisión PO del 7-ago-2026). La parcela romboidal de
// color se eliminó porque era más grande que el edificio, su vértice asomaba por
// encima del techo y ERA el elemento clickeable. Si alguien la reintroduce, el
// bloque reactivo vuelve — y en una captura estática no se distingue de arte.
const marcado = plotHtml(PLOTS[0], { titulo: "Campo", tip: "T" });
assert(!/px-rhomb/.test(marcado), "la parcela de color no vuelve: el hitbox es el edificio");
assert((marcado.match(/<svg/g) || []).length === 1, "el edificio se dibuja una sola vez", `${(marcado.match(/<svg/g) || []).length}`);

const st = extra => plotHtml(PLOTS[0], { titulo: "Campo", tip: "T", ...extra });
assert(st({ free: true }).includes("no gasta el día"), "el edificio GRATIS lo declara en su cartel");
assert(st({ boost: true }).includes("×2 hoy"), "el edificio POTENCIADO muestra su multiplicador");
assert(!st({ boost: true, locked: true }).includes("×2 hoy"), "un edificio bloqueado no ofrece su ×2 (sería mentir)");
assert(st({ locked: true }).includes("data-locked"), "el BLOQUEADO se marca para que el clic lo ignore");
assert(st({ mine: true }).includes("elegida hoy"), "el ELEGIDO se sella");
assert(st({ off: true }).includes("data-off"), "el APAGADO se marca (ya decidiste otra cosa)");

// El INERTE (hoy solo el estacionamiento) no es ninguno de los otros tres: se ve
// entero, sin velo ni cinta, y solo se marca para que el CSS no lo haga levitar.
const inerte = plotHtml(PLOTS.find(p => p.id === "estacionamiento"), { titulo: "Estacionamiento", tip: "T", inerte: true });
assert(inerte.includes("data-inerte"), "el INERTE se marca para que no se comporte como un botón");
assert(!/data-locked|data-off|px-tag/.test(inerte), "el INERTE no se apaga ni se bloquea ni lleva cinta");

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

/* ── Los iconos de RASGO (fase visual del catálogo v2) ──────────────────────── */
// Mismo riesgo que arriba, multiplicado por cuatro: son 48 y se piden POR ID, así que
// renombrar un rasgo en el catálogo deja su nodo mudo en la pizarra sin romper nada.
// El invariante es una biyección: ningún rasgo sin dibujo, ningún dibujo sin rasgo.
{
  const faltan = TRAITS.filter(t => !TRAIT_ICON_IDS.includes(t.id)).map(t => t.id);
  assert(!faltan.length, "todo rasgo del catálogo tiene su icono dibujado", faltan.join(" · "));
  const ids = new Set(TRAITS.map(t => t.id));
  const sobran = TRAIT_ICON_IDS.filter(id => !ids.has(id));
  assert(!sobran.length, "y no queda ningún icono huérfano (rasgo que ya no existe)", sobran.join(" · "));
  assert(traitIcon("incomodar", 32).startsWith("<svg"), "traitIcon dibuja el icono de un rasgo conocido");
  assert(traitIcon("no_existe") === "", "un rasgo sin dibujo devuelve vacío: la pizarra cae al emoji, no se rompe");
  assert(traitIconG("incomodar", 100, 100, 26).startsWith("<g"), "traitIconG entrega un grupo ya posicionado para el tablero");
  // El emoji NO muere: sigue siendo lo que se lee en el relato del partido y el diario,
  // que son texto plano. Si alguien lo borra del catálogo, esas dos superficies quedan mudas.
  assert(TRAITS.every(t => t.icon && t.icon.length <= 4), "todo rasgo conserva su emoji para el relato y el diario");
  // Toda grilla es de 16 de ancho: una fila corta desplaza el dibujo entero.
  for (const id of TRAIT_ICON_IDS) {
    const svg = traitIcon(id, 16);
    const xs = [...svg.matchAll(/x="(\d+)"/g)].map(m => +m[1]);
    assert(xs.length && Math.max(...xs) <= 15, "el icono no se sale de la grilla de 16", id);
  }
}

/* ── La red vial ────────────────────────────────────────────────────────────── */

// LO QUE PIDIÓ EL PO: que las calles conecten los edificios, no que pasen cerca.
// El invariante es geométrico y vale para las cinco: la entrada de cada parcela
// tiene que ser un VÉRTICE de alguna calzada o ramal. Si alguien mueve una parcela
// y la calle se despega, en una captura no se nota — parece que "casi" llega.
//
// Ya no todas entran por la puerta: desde el replanteo del eje, las dos de abajo
// entran por su vértice LATERAL, que es donde las deja el brazo de la rotonda.
const vertices = new Set();
for (const d of [...CALZADAS, ...ACCESOS]) {
  for (const m of d.matchAll(/[ML] (-?\d+(?:\.\d+)?) (-?\d+(?:\.\d+)?)/g)) vertices.add(`${m[1]},${m[2]}`);
}
// EL BUG QUE ESTO CAZA (10-ago-2026): la entrada se calculaba desde la CAJA de la
// parcela (`cx ± w/2`) y no desde el terreno DIBUJADO. La caja es el hitbox y es
// más ancha que el rombo, así que el brazo de la rotonda moría 35px en el aire,
// antes de tocar el patio. Los vértices salen de `iso`, que es el `slab` real.
for (const e of ENTRADAS) {
  assert(vertices.has(`${e.x},${e.y}`), "la calzada muere exactamente en la entrada de la parcela",
    `${e.id}: ${e.x},${e.y}`);
  const p = PLOTS.find(x => x.id === e.id);
  const o = { x: p.cx, y: p.cy + ORIGEN_DY };
  const lateral = Math.abs(e.x - o.x) === Math.round(p.iso * 32) && e.y === o.y;
  const puerta = e.x === o.x && e.y === o.y + Math.round(p.iso * 16);
  assert(lateral || puerta,
    "la entrada es la puerta o un vértice lateral del rombo, nunca un punto suelto", e.id);
}

// EL EJE Y SUS TRES BRAZOS. La rotonda es el único nudo del plano: el eje de
// entrada muere en ella y de ella salen los brazos. Si alguien desengancha uno,
// media parcela queda sin calle y la simetría del predio se rompe.
const rot = `${PLOTS.find(p => p.id === "campo").cx} ${PLOTS.find(p => p.id === "asado").cy + ORIGEN_DY}`;
const enRotonda = CALZADAS.filter(d => d.includes(`M ${rot}`) || d.includes(`L ${rot}`));
assert(enRotonda.length === 3, "de la rotonda salen exactamente tres brazos", `${enRotonda.length}`);

// Los dos brazos laterales son ESPEJO: el plano se compuso simétrico a propósito
// (eje de entrada, fuente al medio, una parcela por esquina) y una asimetría acá
// se vería como un error de dibujo, no como una decisión.
const numeros = d => d.match(/-?\d+(?:\.\d+)?/g).map(Number);
const [oeste, este] = [enRotonda[1], enRotonda[2]].map(numeros);
for (let i = 0; i < oeste.length; i += 2) {
  assert(oeste[i] + este[i] === 1060, "los dos brazos son espejo en X", `${oeste[i]} ↔ ${este[i]}`);
  assert(oeste[i + 1] === este[i + 1], "los dos brazos son espejo en Y", `${oeste[i + 1]} ≠ ${este[i + 1]}`);
}

/* ── La bandera ─────────────────────────────────────────────────────────────── */

// EL BUG (7-ago-2026): pxFlag no dibujaba una bandera — apilaba tres franjas con los
// colores de la CAMISETA. Con Argentina daba celeste/blanco/celeste, o sea acertaba
// por casualidad, y por eso sobrevivió a todas las capturas. La prueba tiene que
// usar un equipo donde camiseta y bandera NO coincidan.
const bandera = id => pxFlag(WC_DATA.teams.find(t => t.id === id));
const bra = WC_DATA.teams.find(t => t.id === "BRA");

assert(/data\/flags\/br\.png/.test(bandera("BRA")), "la bandera sale del archivo del país, no de los colores del kit");
assert(!bandera("BRA").includes(bra.kits.field.shirt), "la bandera de Brasil no se pinta con su camiseta", bra.kits.field.shirt);
assert(pxFlag(null).includes("width:32px"), "sin equipo, el marco se dibuja igual y no rompe la cabecera");

// Un `iso` sin archivo deja un hueco mudo: el <img> no carga y no hay error en consola.
for (const t of WC_DATA.teams) {
  assert(t.iso, "todo equipo declara su iso", t.id);
  if (t.iso) assert(fs.existsSync(path.join(ROOT, "data/flags", `${t.iso}.png`)),
    "la bandera del equipo existe en disco", `${t.id} → data/flags/${t.iso}.png`);
}

/* ── El suelo ───────────────────────────────────────────────────────────────── */

const suelo = complexGround();
assert(suelo.includes(`viewBox="0 0 1440 ${PLANO_H}"`), "las calles usan el MISMO sistema de coordenadas que las parcelas");
assert(/stroke-width="34"/.test(suelo) && /stroke-width="24"/.test(suelo), "cada calle lleva su contorno y su asfalto");
assert(/stroke-width="18"/.test(suelo), "los ramales de acceso se pintan más finos que la avenida");

/* ── El cerco y el portón ───────────────────────────────────────────────────── */

// EL PREDIO ESTÁ CERRADO (PO, 10-ago-2026). El cerco tiene que dar la vuelta
// entera: si alguien borra un lateral queda un complejo con dos rayas y la valla
// roja deja de significar nada — se entraría por el pasto.
const estaciona = PLOTS.find(p => p.id === "estacionamiento");
assert(suelo.includes(`<rect x="0" y="${CALLE_Y - 15}" width="1440"`), "la calle exterior corre por el borde de abajo");
assert(suelo.includes("#EA002A"), "la valla del portón se pinta de rojo");

// El portón está en el EJE: abajo al medio, alineado con la fuente y con el campo.
// Ese eje es toda la composición del predio — si el portón se corre, la avenida de
// entrada deja de apuntar a la fuente y la simetría se cae.
const eje = PLOTS.find(p => p.id === "campo").cx;
assert(suelo.includes(`M ${eje} ${CALLE_Y}`), "la entrada arranca en la calle exterior, sobre el eje del predio");
assert(estaciona.cx !== eje, "el estacionamiento ya no come el eje: se entra por el medio");

console.log(`hub.test: ${n} checks · fallos: ${fails}`);
if (fails) process.exit(1);
console.log("✅ hub OK");
