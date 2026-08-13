/* ============================================================
   Tests de las RANURAS DE PARTIDA GUARDADA (sprint del 12-ago-2026).

   Lo que una captura de pantalla NO chequea y acá sí:

   1. Que una `run` de verdad SOBREVIVA el viaje a localStorage y vuelva idéntica.
      Es la promesa que ARQUITECTURA §3.1 viene declarando desde F7 ("run solo
      datos planos") y que nadie había ejercido de punta a punta: hasta hoy el
      único consumidor de storage era el historial, que guarda seis números. Una
      función, un nodo DOM o un ciclo metidos en `run` no rompen ningún test de
      motor — rompen el guardado, y se descubriría con la partida perdida.
   2. Que una ranura de OTRA VERSIÓN no se intente interpretar. Un run al que le
      falta un campo revienta la pantalla que lo pinta, y voltearía las tres.
   3. Que las tres ranuras sean independientes y que escribir una no toque a las
      otras (el bug clásico de un almacén que se reescribe entero).

   `localStorage` no existe en Node: se monta un doble mínimo. Es exactamente la
   superficie que usa storage/saves.js (getItem/setItem), así que probar contra él
   prueba el módulo, no el navegador.

   Uso: node tests/saves.test.js
   ============================================================ */
import { loadEngine } from "./load-engine.js";

/* ── El doble de localStorage, montado ANTES de importar el módulo ───────────── */
let store = new Map();
globalThis.localStorage = {
  getItem: (k) => (store.has(k) ? store.get(k) : null),
  setItem: (k, v) => { store.set(k, String(v)); },
  removeItem: (k) => { store.delete(k); },
  clear: () => store.clear(),
};

const { Engine: E } = await loadEngine();
const saves = await import("../js/storage/saves.js");
const { RUTA_PARTIDOS } = await import("../js/game/tournament/knockout.js");

let fails = 0, checks = 0;
const assert = (cond, msg, ctx) => { checks++; if (!cond) { fails++; console.error("FAIL:", msg, ctx ?? ""); } };

/* ── 1 · Una run real, ida y vuelta ──────────────────────────────────────────── */

const run = E.newRun("ARG");
// Se la ensucia como una partida vivida: días pasados, un resultado propio y un
// rasgo comprado. Una run recién nacida es demasiado simple para probar nada.
run.day = 9;
run.moral = 63;
run.squad[0].energia = 41;
run.squad[2].amarillas = 1;
run.misResultados.push({ oppId: "BRA", gf: 2, gc: 1, stage: "groups", day: 7 });
run.misResultados.push({ oppId: "FRA", gf: 1, gc: 1, stage: "groups", day: 13, pens: { gf: 4, gc: 2 } });

assert(saves.writeSlot(0, run), "una run se escribe en la ranura 0");
const leida = saves.readSlot(0);
assert(!!leida && !leida.incompatible, "la ranura 0 se lee de vuelta");
assert(leida.savedAt > 0, "la ranura recuerda cuándo se escribió");
assert(leida.fin === null, "una partida en curso no tiene desenlace");

// La prueba dura: el árbol entero, campo por campo. Si algo de `run` no fuera
// JSON-izable, no llegaría acá igual (o no llegaría).
assert(JSON.stringify(leida.run) === JSON.stringify(run), "la run vuelve IDÉNTICA de localStorage");
assert(leida.run.squad.length === run.squad.length, "el plantel entero viaja", leida.run.squad.length);
assert(leida.run.squad[0].energia === 41, "el estado de cada jugador viaja (energía)");
assert(leida.run.squad[0].look && typeof leida.run.squad[0].look === "object", "el `look` del sprite sobrevive (el bug de 'todos iguales')");
assert(leida.run.misResultados.length === 2, "los marcadores propios viajan");
assert(leida.run.misResultados[1].pens.gf === 4, "y la tanda de penales adentro de ellos");
assert(leida.run.groups.length === 12, "los 12 grupos del sorteo viajan");
assert(leida.run.journal.length === run.journal.length, "el diario de campaña viaja entero");

// Y no es la MISMA referencia: mutar lo cargado no puede tocar lo guardado.
leida.run.moral = 1;
assert(saves.readSlot(0).run.moral === 63, "lo cargado es una copia: mutarla no pisa la ranura");

/* ── 2 · Las tres ranuras son independientes ─────────────────────────────────── */

assert(saves.getSlots().length === saves.SLOTS, `getSlots devuelve siempre ${saves.SLOTS} posiciones`);
const otra = E.newRun("MAR");
saves.writeSlot(2, otra);
const todas = saves.getSlots();
assert(todas[0].run.teamId === "ARG", "la ranura 0 sigue con su partida");
assert(todas[1] === null, "la ranura 1 sigue vacía");
assert(todas[2].run.teamId === "MAR", "la ranura 2 tiene la suya");

saves.clearSlot(2);
assert(saves.readSlot(2) === null, "borrar una ranura la vacía");
assert(saves.readSlot(0).run.teamId === "ARG", "borrar una ranura NO toca a las otras");

/* ── 3 · El desenlace se queda en la ranura ──────────────────────────────────── */

saves.writeSlot(1, otra, { champion: true, abandoned: false, stageLabel: "🏆 CAMPEÓN DEL MUNDO", date: "12 ago 2026" });
const campeona = saves.readSlot(1);
assert(campeona.fin && campeona.fin.champion === true, "una partida terminada guarda su desenlace");
assert(campeona.run.teamId === "MAR", "y sigue guardando la run que lo consiguió (para pintar la tarjeta)");

/* ── 4 · Una ranura de otra versión no se interpreta ─────────────────────────── */

store.set("wc26_saves", JSON.stringify({
  v: saves.SAVE_VERSION, slots: [{ v: saves.SAVE_VERSION + 99, savedAt: 123, run: { teamId: "BRA", squad: [] } }, null, null],
}));
const vieja = saves.readSlot(0);
assert(vieja && vieja.incompatible === true, "una ranura de otra versión se marca incompatible");
assert(vieja.run === undefined, "y NO se entrega su run: nadie puede intentar pintarla");

// Lo mismo si la forma está rota aunque la versión coincida.
store.set("wc26_saves", JSON.stringify({
  v: saves.SAVE_VERSION, slots: [{ v: saves.SAVE_VERSION, savedAt: 1, run: { teamId: "BRA" } }, null, null],
}));
assert(saves.readSlot(0).incompatible === true, "una run sin plantel es ilegible, no una partida vacía");

/* ── 5 · Basura en el almacén no voltea la portada ───────────────────────────── */

store.set("wc26_saves", "{{{ esto no es json");
assert(saves.getSlots().every(s => s === null), "un almacén corrupto se lee como tres ranuras vacías");
store.set("wc26_saves", JSON.stringify({ v: 1, slots: "no soy un array" }));
assert(saves.getSlots().every(s => s === null), "un almacén con forma inesperada tampoco rompe");
store.delete("wc26_saves");
assert(saves.getSlots().every(s => s === null), "sin almacén, tres ranuras vacías");

/* ── 6 · Índices fuera de rango ──────────────────────────────────────────────── */

assert(saves.readSlot(9) === null, "leer una ranura que no existe da null");
assert(saves.readSlot(-1) === null, "ni con índice negativo");
assert(saves.writeSlot(9, run) === false, "escribir fuera de rango se rechaza");
assert(saves.writeSlot(0, null) === false, "escribir sin run se rechaza");
assert(saves.getSlots().every(s => s === null), "y ninguno de esos rechazos escribió nada");

/* ── 7 · La ruta de la copa son OCHO partidos ────────────────────────────────── */

// La barra de progreso de la ranura mide la RUTA, no los días (decisión PO): el
// total de días de una run no se sabe de antemano, el de partidos sí. Si algún día
// cambia el formato del torneo, este test cae antes que la barra mienta.
assert(RUTA_PARTIDOS === 3 + E.STAGE_ORDER.length, "la ruta son las 3 fechas de grupos + las rondas KO", RUTA_PARTIDOS);
assert(RUTA_PARTIDOS === 8, "y hoy eso son 8 partidos", RUTA_PARTIDOS);

/* ── 8 · El almacén de ranuras y el historial no se pisan ────────────────────── */

const hist = await import("../js/storage/history.js");
saves.writeSlot(0, run);
hist.saveHistoryEntry({ date: "12 ago 2026", teamId: "ARG", champion: false, stageLabel: "Cuartos de final", pg: 3, pe: 1, pp: 1, gf: 7, gc: 4, topScorer: "Nadie" });
assert(saves.readSlot(0)?.run.teamId === "ARG", "escribir el historial no toca las ranuras");
assert(hist.getHistory().length === 1, "y las ranuras no tocan el historial");

console.log(`saves.test: ${checks} comprobaciones`);
console.log(fails ? `❌ ${fails} fallo(s)` : "✅ las ranuras de partida guardada OK");
process.exit(fails ? 1 : 0);
