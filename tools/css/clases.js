/* ============================================================
   tools/css/clases — DE DÓNDE SALEN LAS CLASES QUE USA EL JUEGO.

   Una sola pieza, dos consumidores: el congelado de Tailwind
   (tools/congelar-css.js) y el test que lo vigila (tests/css.test.js).
   Si los dos no leyeran EL MISMO extractor, el test estaría verificando
   una lista distinta de la que se congeló, que es la forma más cómoda de
   dar verde sobre un CSS incompleto.

   ── Por qué no alcanza un regex ─────────────────────────────────────
   El primer intento fue `class="([^"]*)"` y se equivocaba en ~60 casos.
   La UI escribe HTML con template literals, así que un atributo real es:

       class="bg-slate-800/70 border ${e.champion ? "border-amber-400"
                                                  : "border-slate-700"} rounded-xl"

   Un regex plano corta en la comilla de `"border-amber-400"` y se lleva
   `e.champion` y `?` como si fueran clases, mientras PIERDE las dos clases
   que de verdad están ahí adentro. Las dos mitades del error importan: la
   basura ensucia el test con fallos falsos, y lo perdido es justamente el
   caso peligroso —una clase que solo existe en una rama de un ternario es
   la que un congelado incompleto se come sin que se note.

   Por eso esto ESCANEA en vez de matchear: sigue la profundidad de `${}`
   para saber qué comilla cierra el atributo, y de cada expresión interpolada
   se queda con sus literales de string, que en esta UI son siempre clases.

   ── Los dos niveles ─────────────────────────────────────────────────
   `atributo` — tokens que aparecen en un `class=`. Son clases SÍ o SÍ, y el
     test las exige a todas: no hay heurística, y por eso también caza typos.
   `literal`  — strings sueltos del código (`TONE`, `colors[pos]`, `energyCls`).
     Acá no se puede saber si `btn-start` es una clase o el id de un botón, así
     que el test los filtra por el vocabulario del propio CSS congelado.
   ============================================================ */
import fs from "node:fs";
import path from "node:path";

/**
 * Marca de "acá había un `${}`". Se mete en el texto del atributo para que un
 * nombre PARTIDO se note: `class="tb-node tb-${st}"` tiene una clase entera
 * (`tb-node`) y una que se arma en runtime (`tb-` + lo que valga `st`). Sin la
 * marca, la segunda entraba a la lista como `tb-` y el test iba a exigir una
 * clase que no existe. Con ella, el token queda contaminado y se descarta: un
 * nombre que se compone en runtime no se puede verificar de forma estática, y
 * decirlo es más honesto que fingir que sí.
 */
const HUECO = "\u0001";

/**
 * Un token de clase: palabra/`:`/`.`/`/` (y el HUECO) más grupos `[…]` con
 * paréntesis y comas adentro, para los arbitrarios tipo
 * `drop-shadow-[0_1px_2px_rgba(0,0,0,.85)]`.
 */
const TOKEN = /(?:[\w:.\/%-]|\[[^\]\s"'`]*\])+/g;

/** ¿Es un nombre entero, o una mitad que se arma en runtime? */
const entero = (t) => !t.includes(HUECO);

/** Todos los .js de un directorio, recursivo. */
function walk(dir, out = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) walk(full, out);
    else if (e.name.endsWith(".js")) out.push(full);
  }
  return out;
}

/** Los archivos que pueden nombrar una clase: el HTML y toda la capa JS. */
export function fuentes(root) {
  return [path.join(root, "index.html"), ...walk(path.join(root, "js"))];
}

/**
 * Recorre un `class="…"` desde la comilla de apertura y devuelve
 * `{ texto, expresiones, fin }`: el texto literal de nivel 0 (las clases
 * escritas a mano) y el código fuente de cada `${…}` interpolado, por separado.
 *
 * Escanea en vez de matchear porque la comilla que cierra el atributo no es la
 * primera que aparece: dentro de un `${}` puede haber strings con comillas del
 * mismo tipo. La profundidad de llaves es lo único que distingue una de otra.
 */
function leerAtributo(src, i, comilla) {
  let texto = "", expr = "", prof = 0, exprs = [];
  while (i < src.length) {
    const c = src[i];
    if (prof === 0) {
      if (c === comilla) return { texto, expresiones: exprs, fin: i };
      if (c === "$" && src[i + 1] === "{") { texto += HUECO; prof = 1; i += 2; continue; }
      texto += c; i++; continue;
    }
    // Dentro de la expresión: las llaves anidan y los strings se copian tal cual
    // (los necesitamos: son las clases de las ramas del ternario).
    if (c === "{") prof++;
    else if (c === "}" && --prof === 0) { exprs.push(expr); expr = ""; i++; continue; }
    expr += c; i++;
  }
  return { texto, expresiones: exprs, fin: i };   // atributo sin cerrar: se corta acá
}

/**
 * Los strings de una expresión interpolada, que en esta UI son clases… salvo los
 * que están del otro lado de una COMPARACIÓN. En
 *
 *     class="text-sm ${ev.tipo === "buff" ? "text-emerald-400" : "text-red-400"}"
 *
 * hay tres literales y solo dos son clases: `"buff"` es el valor con el que se
 * compara. Se descartan los operandos antes de mirar, porque si no el test exige
 * una clase `.buff` que nadie escribió nunca.
 */
function literalesDe(expr) {
  const sinComparaciones = expr
    .replace(/[=!]==?\s*(["'`])[^"'`]*\1/g, " ")
    .replace(/(["'`])[^"'`]*\1\s*[=!]==?/g, " ");
  return [...sinComparaciones.matchAll(/["'`]([^"'`\n]*)["'`]/g)].map(m => m[1]);
}

/**
 * Las clases que usa el código, en los dos niveles descritos arriba.
 * @returns {{atributo: Set<string>, literal: Set<string>}}
 */
export function clasesDelCodigo(root) {
  const atributo = new Set(), literal = new Set();
  const suma = (set, s) => (s.match(TOKEN) || []).filter(entero).forEach(t => set.add(t));

  for (const f of fuentes(root)) {
    const src = fs.readFileSync(f, "utf8");

    // (a) Atributos class=, escaneados.
    for (const m of src.matchAll(/class\s*=\s*(["'`])/g)) {
      const { texto, expresiones } = leerAtributo(src, m.index + m[0].length, m[1]);
      suma(atributo, texto);
      // Las ramas de un ternario son clases igual que el texto de nivel 0.
      for (const e of expresiones) for (const s of literalesDe(e)) suma(atributo, s);
    }

    // (b) Literales sueltos: las tablas que guardan clases (TONE, rarezas, colors[pos]).
    for (const m of src.matchAll(/["']([^"'\n$<>=;(){}]{2,120})["']/g)) {
      const v = m[1].trim();
      if (v && v.split(/\s+/).every(p => /^[a-z][\w-]*(?:[:/][\w.[\]#%(),-]+)*$/.test(p) && p.includes("-")))
        suma(literal, v);
    }
  }
  return { atributo, literal };
}


/**
 * Las clases que existen para que el JS las AGARRE, no para pintar.
 *
 * `.confed-tab` no tiene ni una regla de estilo y no por eso está mal: es el
 * asidero de un `querySelectorAll`. Sin esta lista el test las reclamaría como
 * huérfanas, y la reacción natural sería inventarles un estilo vacío o meterlas
 * en una lista de excepciones a mano. Se DETECTAN en vez de declararse para que
 * la lista no envejezca: la que deje de usarse como gancho deja de estar exenta,
 * que es justo cuando conviene que el test hable.
 */
export function clasesGancho(root) {
  const out = new Set();
  for (const f of fuentes(root)) {
    const src = fs.readFileSync(f, "utf8");
    // querySelector(".x"), closest(".x .y"), matches(".x")
    for (const m of src.matchAll(/(?:querySelector(?:All)?|closest|matches)\s*\(\s*(["'`])([^"'`]*)\1/g))
      for (const c of m[2].matchAll(/\.([\w-]+)/g)) out.add(c[1]);
    // classList.add("x", "y")
    for (const m of src.matchAll(/classList\.(?:add|remove|toggle|contains|replace)\s*\(([^)]*)\)/g))
      for (const c of m[1].matchAll(/["'`]([\w-]+)["'`]/g)) out.add(c[1]);
  }
  return out;
}

/**
 * Los IDENTIFICADORES de elemento del código.
 *
 * No son clases, pero se les parecen tanto que el barrido de literales sueltos
 * los levanta igual: `id="px-opp"` y `id="h-bars"` empiezan con dos prefijos que
 * Tailwind también usa (`px-` es el padding horizontal, `h-` la altura), así que
 * sin esta lista el test los reclamaba como utilidades sin congelar. Se detectan
 * en vez de declararse, por lo mismo que los ganchos.
 */
export function idsDelCodigo(root) {
  const out = new Set();
  for (const f of fuentes(root)) {
    const src = fs.readFileSync(f, "utf8");
    for (const m of src.matchAll(/\bid\s*=\s*["'`]([\w-]+)["'`]/g)) out.add(m[1]);
    for (const m of src.matchAll(/getElementById\s*\(\s*["'`]([\w-]+)["'`]/g)) out.add(m[1]);
    for (const m of src.matchAll(/["'`]#([\w-]+)["'`]/g)) out.add(m[1]);
  }
  return out;
}

/**
 * Las clases que define una hoja de estilo, des-escapadas.
 *
 * Tailwind escapa los caracteres raros de dos maneras distintas y hay que
 * deshacer las dos o la comparación miente: `\[` (barra invertida) y `\2c `
 * (el código hexadecimal de la coma, CON el espacio final que lo termina).
 * Esa segunda forma es la que hacía "faltar" a los `grid-cols-[minmax(0,1fr)…]`
 * que en realidad estaban.
 */
export function clasesDelCss(file) {
  const css = fs.readFileSync(file, "utf8");
  const out = new Set();
  for (const m of css.matchAll(/\.((?:\\[0-9a-f]{1,6} |\\.|[\w-])(?:\\[0-9a-f]{1,6} |\\.|[\w\/-])*)/g)) {
    out.add(m[1]
      .replace(/\\([0-9a-f]{1,6}) /g, (_, h) => String.fromCharCode(parseInt(h, 16)))
      .replace(/\\(.)/g, "$1"));
  }
  return out;
}
