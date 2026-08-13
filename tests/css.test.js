/* ============================================================
   Vigila el CSS: que ninguna clase se quede sin hoja de estilo.

   POR QUÉ EXISTE (13-ago-2026): index.html cargaba Tailwind desde
   `cdn.tailwindcss.com`, o sea el compilador entero corriendo en el
   navegador. Congelarlo a assets/tailwind.css arregló que el juego
   no se maquetara sin red, pero cambió la naturaleza del riesgo: un
   CDN compila CUALQUIER clase que se le ocurra a alguien mañana, y
   un archivo congelado solo tiene las que existían al congelarlo.

   Sin este test, agregar `text-lime-300` a una pantalla no rompe
   nada visible en desarrollo —la clase simplemente no pinta— y el
   bug aparece como "ese texto se ve blanco" semanas después, en la
   pantalla que nadie estaba mirando. Con el test, el congelado corto
   es batería roja y se arregla con `node tools/congelar-css.js`.

   Uso: node tests/css.test.js
   ============================================================ */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { clasesDelCodigo, clasesDelCss, clasesGancho, idsDelCodigo, fuentes } from "../tools/css/clases.js";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const p = (f) => path.join(ROOT, f);

let fails = 0;
const fail = (msg) => { fails++; console.error(`FAIL: ${msg}`); };

const tailwind = clasesDelCss(p("assets/tailwind.css"));
const base = clasesDelCss(p("css/base.css"));
const kit = clasesDelCss(p("css/pxkit.css"));
const ganchos = clasesGancho(ROOT);
const ids = idsDelCodigo(ROOT);
const { atributo, literal } = clasesDelCodigo(ROOT);

const tieneHoja = (c) => tailwind.has(c) || base.has(c) || kit.has(c);

/* ── 1 · Ninguna clase huérfana ──────────────────────────────────────────────
   Todo lo que aparece en un `class=` tiene que estar definido en alguna de las
   tres hojas… o ser un GANCHO: una clase que existe solo para que un
   `querySelector` la agarre. Esas se detectan solas (ver clasesGancho) en vez
   de declararse a mano, así que la que deje de usarse como gancho vuelve a
   pedir estilo — que es justo cuando queremos enterarnos. */
const huerfanas = [...atributo].filter(c => !tieneHoja(c) && !ganchos.has(c));
if (huerfanas.length) fail(`${huerfanas.length} clase(s) sin hoja de estilo ni uso como gancho: ${huerfanas.sort().join(" ")}`);
console.log(`· ${atributo.size} clases en atributos, ${huerfanas.length} huérfanas`);

/* ── 2 · El congelado no se quedó corto ──────────────────────────────────────
   Las tablas de la UI guardan clases en strings sueltos (`TONE`, `energyCls`),
   y ahí no se puede saber a ojo si `btn-start` es una clase o el id de un botón.
   El filtro es el VOCABULARIO del propio Tailwind congelado: si el token empieza
   con un prefijo que Tailwind ya usa (`bg-`, `text-`, `border-amber-`…), es una
   utilidad y tiene que estar congelada.

   Límite conocido y a propósito: una utilidad de una familia que el juego no usa
   TODAVÍA (el primer `backdrop-saturate-*` de la historia, digamos) no tiene
   prefijo conocido y se escapa. Cubrir eso pedía reimplementar el parser de
   Tailwind acá; el caso que de verdad ocurre —sumar un tono más de una familia
   que ya se usa— queda cubierto. */
const prefijos = (c) => {
  const partes = c.replace(/^.*:/, "").split("-");  // fuera las variantes (hover:, sm:)
  // Desde 1: el prefijo VACÍO lo genera cualquier clase que arranque con guion
  // (`-mx-6`), y si entra al vocabulario matchea contra todo.
  return partes.map((_, i) => partes.slice(0, i + 1).join("-")).filter(Boolean);
};
const vocabulario = new Set();
for (const c of tailwind) for (const x of prefijos(c).slice(0, -1)) vocabulario.add(x);

const cortas = [...literal].filter(c =>
  !tieneHoja(c) && !ganchos.has(c) && !ids.has(c) && prefijos(c).some(x => vocabulario.has(x)));
if (cortas.length) {
  fail(`${cortas.length} utilidad(es) de Tailwind sin congelar — corré \`node tools/congelar-css.js\`:\n  ${cortas.sort().join(" ")}`);
}
console.log(`· ${literal.size} clases en literales sueltos, ${cortas.length} sin congelar`);

/* ── 3 · Los dos kits no se mezclan ──────────────────────────────────────────
   La regla del CLAUDE.md ("no mezclar el kit px-* con las cards redondeadas de
   Tailwind") era una convención escrita, y una convención escrita no falla.

   Se mide POR ELEMENTO, no por archivo, y es a propósito: `hub/day.js` vive en
   la carpeta del hub pero dibuja un modal del kit viejo, así que prohibir el
   redondeo "en los archivos del hub" daría rojo sobre código que está bien. Lo
   que el kit prohíbe es un borde duro y una esquina redonda EN LA MISMA CAJA.

   Un `px-*` cuenta como del kit solo si css/pxkit.css lo define de verdad: `px-3`
   es el padding horizontal de Tailwind y no tiene nada que ver. */
const REDONDEO = /^(rounded|shadow|backdrop-blur|blur)(-|$)/;
let mezclas = 0;
for (const f of fuentes(ROOT)) {
  const src = fs.readFileSync(f, "utf8");
  const rel = path.relative(ROOT, f).replace(/\\/g, "/");
  for (const m of src.matchAll(/class\s*=\s*(["'`])([^"'`]*)\1/g)) {
    const t = m[2].split(/\s+/).filter(Boolean);
    const px = t.filter(x => kit.has(x));
    const rd = t.filter(x => REDONDEO.test(x));
    if (px.length && rd.length) {
      mezclas++;
      fail(`${rel}: el kit pixel y el redondeo de Tailwind en la misma caja → ${px.join(" ")} + ${rd.join(" ")}`);
    }
  }
}
console.log(`· ${kit.size} clases del kit pixel, ${mezclas} cajas mezcladas`);

console.log(fails ? `\n❌ css: ${fails} problema(s)` : "\n✅ css OK");
process.exit(fails ? 1 : 0);
