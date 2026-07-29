/* ============================================================
   Validador de la capa de UI: que TODO js/ui/**.js parsee.

   POR QUÉ EXISTE (28-jul-2026): la batería entera daba verde con
   `screens/match.js` roto. Ningún test carga la UI —load-engine
   importa solo el motor, a propósito: la UI necesita `document`—
   así que un error de sintaxis en una pantalla solo aparecía
   abriendo el navegador. El que lo destapó: un BACKTICK dentro de
   un comentario HTML, que vive dentro de un template literal y lo
   corta en seco. Barato de prevenir, caro de descubrir a mano.

   No ejecuta nada (no hay DOM acá): solo comprueba que cada
   archivo sea un módulo ES parseable, que es exactamente la clase
   de error que se escapaba.

   Uso: node tests/ui.validate.js
   ============================================================ */
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const DIRS = ["js/ui", "js/content", "js/core", "js/data", "js/game", "js/storage"];

let fails = 0, n = 0;

/** Todos los .js de un directorio, recursivo. */
function walk(dir) {
  const out = [];
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) out.push(...walk(full));
    else if (e.name.endsWith(".js")) out.push(full);
  }
  return out;
}

for (const d of DIRS) {
  const dir = path.join(ROOT, d);
  if (!fs.existsSync(dir)) continue;
  for (const file of walk(dir)) {
    n++;
    const rel = path.relative(ROOT, file).replace(/\\/g, "/");
    try {
      // SourceTextModule sin instanciar: parsea el módulo (imports incluidos) sin
      // ejecutarlo ni resolver dependencias — no hace falta un DOM.
      new vm.SourceTextModule(fs.readFileSync(file, "utf8"), { identifier: rel });
    } catch (e) {
      fails++;
      console.error(`FAIL: ${rel} no parsea → ${e.message}`);
    }
  }
}

// Los template literals de la UI llevan HTML con comentarios: un backtick suelto ahí
// adentro cierra el literal y el error aparece a 200 líneas de distancia. Se avisa aparte
// del parseo porque puede parsear igual y romper otra cosa.
let warns = 0;
for (const d of ["js/ui"]) {
  const dir = path.join(ROOT, d);
  if (!fs.existsSync(dir)) continue;
  for (const file of walk(dir)) {
    const rel = path.relative(ROOT, file).replace(/\\/g, "/");
    const src = fs.readFileSync(file, "utf8");
    for (const [i, line] of src.split("\n").entries()) {
      if (/<!--/.test(line) && line.includes("`")) {
        warns++;
        console.warn(`WARN: ${rel}:${i + 1} backtick dentro de un comentario HTML`);
      }
    }
  }
}

console.log(`ui.validate: ${n} módulos parseados${warns ? ` · ${warns} advertencia(s)` : ""}`);
console.log(fails ? `❌ ${fails} archivo(s) rotos` : "✅ sintaxis de todos los módulos OK");
process.exit(fails ? 1 : 0);
