/* ============================================================
   tools/congelar-css — REGENERA assets/tailwind.css.

   Uso:  node tools/congelar-css.js

   ── Por qué existe ──────────────────────────────────────────────────────────
   Hasta el 13-ago-2026 index.html cargaba `https://cdn.tailwindcss.com`, o sea
   el compilador entero de Tailwind corriendo EN EL NAVEGADOR en cada arranque.
   Eso costaba dos cosas:

     · el juego no se maquetaba sin internet, contra lo que decían el README
       ("sin dependencias") y un comentario del propio CSS ("funciona offline");
     · el JIT aplica las clases de forma ASÍNCRONA, así que medir el layout en el
       mismo tick del `innerHTML` devolvía un tamaño sin estilizar. Eso ya había
       obligado a un `setTimeout(…, 50)` antes de `fitScaleUp` en menu.js: un
       número mágico sosteniendo el escalado del menú.

   Congelar el CSS mata las dos de una vez y NO agrega un paso de build al
   proyecto: quien clona corre `npx http-server` y juega, igual que antes. Este
   script es una herramienta de autoría, no un build — se corre a mano y solo
   cuando cambian las clases, que es exactamente lo que avisa tests/css.test.js.

   ── Por qué el CLI y no raspar el CDN ───────────────────────────────────────
   La alternativa era abrir el juego, recorrer las pantallas y volcar lo que el
   JIT hubiera generado. Se descartó: ese volcado solo contiene las clases de los
   caminos que uno se acordó de visitar, y las que falten no se ven hasta que un
   jugador llega a esa pantalla. El CLI usa el MISMO motor que el CDN (v3) y el
   mismo extractor, leyendo los archivos en vez del DOM: no depende de por dónde
   se navegó.
   ============================================================ */
import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const SALIDA = "assets/tailwind.css";

// Versión CLAVADA. El CDN servía "el último v3", así que un v4 acá cambiaría el
// CSS de golpe y en silencio: v4 rehace la paleta y borra utilidades que esta UI
// usa. La versión es parte del contrato del congelado, no un detalle.
const VERSION = "tailwindcss@3.4.19";

console.log(`Congelando ${VERSION} → ${SALIDA}`);
const r = spawnSync("npx", [
  "-y", VERSION,
  "-c", "tools/css/tailwind.config.js",
  "-i", "tools/css/entrada.css",
  "-o", SALIDA,
], { cwd: ROOT, stdio: "inherit", shell: process.platform === "win32" });

if (r.status !== 0) {
  console.error("\n❌ falló el congelado (¿sin red para bajar el CLI?)");
  process.exit(1);
}
console.log(`\n✅ ${SALIDA} regenerado. Corré \`node tests/css.test.js\` para verificar la cobertura.`);
