/* ============================================================
   Tests de la Filosofía (game/philosophy.js + content/philosophies.js) — F1:
   - catálogo sano: 4 filosofías de 2 aristas, firma propia y del lado "mine"
   - nivel por umbrales (suma de las 2 aristas propias) y filoCtx
   - elección post-sorteo y cambio con costo (Acción del Día; aristas persisten)
   - focos de la Sesión Táctica (+1 arista, sin buff, sin energía)
   - progresión por ejecución (match.filoHits → arista firma, con tope)
   - addFiloProgress refuerza la arista más baja
   Uso: node tests/philosophy.test.js
   ============================================================ */
import { loadEngine } from "./load-engine.js";

const { Engine: E } = await loadEngine();

let fails = 0, checks = 0;
const assert = (cond, msg, ctx) => { checks++; if (!cond) { fails++; console.error("FAIL:", msg, ctx ?? ""); } };

// ---------- catálogo ----------
assert(E.PHILOSOPHIES.length === 4, "hay exactamente 4 filosofías");
const aristaIds = E.ARISTAS.map(a => a.id);
assert(new Set(aristaIds).size === 5, "hay exactamente 5 aristas únicas");
for (const p of E.PHILOSOPHIES) {
  assert(p.aristas.length === 2 && p.aristas.every(k => aristaIds.includes(k)), "cada filosofía combina 2 aristas del catálogo", p.id);
  assert(p.aristas.includes(p.firma), "la arista firma es una de las 2 propias", p.id);
  const tipo = E.SEQUENCE_TYPES.find(t => t.id === E.FIRMA_TYPE[p.id]);
  assert(tipo && tipo.side === "mine", "el tipo firma existe en el catálogo y es del lado mine (la ejecución depende de MI fútbol)", p.id);
  assert(p.fuerte && p.advertencia && p.rasgo, "fortaleza, advertencia y rasgo visibles (Bible §5 regla 4)", p.id);
}
// cada arista mapea a un tipo real del catálogo de secuencias
for (const a of E.ARISTAS) assert(E.SEQUENCE_TYPES.some(t => t.id === a.tipo), "la arista mapea a un tipo de secuencia real", a.id);
assert(E.FILO_LEVELS.length === 3 && E.FILO_LEVELS[0].min === 0, "3 niveles y el primero arranca en 0");
assert(E.FILO_LEVELS.every((l, i) => i === 0 || l.min > E.FILO_LEVELS[i - 1].min), "umbrales de nivel crecientes");
assert(E.FILO_LEVELS.every((l, i) => i === 0 || l.mult > E.FILO_LEVELS[i - 1].mult), "multiplicadores crecientes");

// ---------- nacimiento, elección y nivel ----------
const run = E.newRun("BRA");
assert(run.filoId === null && typeof run.aristas === "object", "la run nace sin filosofía y con aristas vacías");
assert(E.filoCtx(run) === null, "sin filosofía no hay filo en el matchCtx");
const antes = run.journal.length;
assert(E.choosePhilosophy(run, "no_existe") === null, "elegir una filosofía inexistente no hace nada");
const f = E.choosePhilosophy(run, "press");
assert(f && run.filoId === "press" && run.journal.length === antes + 1, "la elección queda en la run y escribe el diario");

assert(E.filoPoints(run) === 0 && E.filoLevel(run) === 0, "nace Aprendiendo con 0 pts");
run.aristas.presion = 3; run.aristas.solidez = 99; // solidez NO es del press: no cuenta
assert(E.filoPoints(run) === 3 && E.filoLevel(run) === 0, "las aristas ajenas no suman al nivel");
run.aristas.verticalidad = 1;
assert(E.filoPoints(run) === 4 && E.filoLevel(run) === 1, "umbral de En desarrollo (4 pts)");
run.aristas.presion = 8;
assert(E.filoLevel(run) === 2, "umbral de Consolidada (9 pts)");
assert(E.filoCtx(run).id === "press" && E.filoCtx(run).nivel === 2, "filoCtx viaja {id, nivel}");

// ---------- focos de la Sesión Táctica ----------
{
  const r = E.newRun("BRA");
  E.choosePhilosophy(r, "posesion");
  r.actionPending = true;
  const energiaAntes = r.squad.map(p => p.energia);
  const res = E.applyDayAction(r, "tactica_elaboracion");
  assert(res && r.aristas.elaboracion === 1, "el foco suma +1 a su arista", JSON.stringify(r.aristas));
  assert(r.buffs.tactica === undefined, "el buff táctico está MUERTO: el foco no lo escribe");
  assert(r.squad.every((p, i) => p.energia === energiaAntes[i]), "la Sesión Táctica no cuesta energía");
  assert(!r.actionPending, "el foco consume la Acción del Día");
  // el modificador del día escala el foco como al resto del grupo
  r.actionPending = true;
  r.dayMod = { title: "prueba", mods: { tactica: 2 } };
  E.applyDayAction(r, "tactica_elaboracion");
  assert(r.aristas.elaboracion === 3, "el ×2 del día duplica el foco", r.aristas.elaboracion);
  r.actionPending = true;
  r.dayMod = { title: "prueba", mods: { tactica: 0 } };
  assert(E.applyDayAction(r, "tactica_presion") === null && r.actionPending, "el bloqueo del día bloquea TODOS los focos");
}

// ---------- cambio con costo y demolición orgánica ----------
{
  const r = E.newRun("BRA");
  E.choosePhilosophy(r, "press");
  r.aristas.presion = 5; r.aristas.verticalidad = 2;
  r.actionPending = false;
  assert(E.changePhilosophy(r, "contra") === null, "sin Acción del Día pendiente no hay cambio");
  r.actionPending = true;
  assert(E.changePhilosophy(r, "press") === null && r.actionPending, "cambiar a la misma filosofía no consume nada");
  const g = E.changePhilosophy(r, "contra");
  assert(g && r.filoId === "contra" && !r.actionPending, "el cambio consume la Acción del Día");
  assert(r.aristas.presion === 5 && r.aristas.verticalidad === 2, "las aristas PERSISTEN (demolición orgánica)");
  assert(E.filoPoints(r) === 2, "el nivel ahora se calcula sobre las aristas de la filosofía nueva (verticalidad 2 + solidez 0)");
}

// ---------- progresión por ejecución ----------
{
  const r = E.newRun("BRA");
  E.choosePhilosophy(r, "contra");
  assert(E.applyFiloExecution(r, { filoHits: 0 }) === null, "sin aciertos no hay progreso");
  const res = E.applyFiloExecution(r, { filoHits: 1 });
  assert(res && res.add === E.FILO_EXEC_GAIN && r.aristas.verticalidad === 0.25, "un acierto suma FILO_EXEC_GAIN a la arista firma");
  const res2 = E.applyFiloExecution(r, { filoHits: 99 });
  assert(res2.add === E.FILO_EXEC_CAP * E.FILO_EXEC_GAIN && r.aristas.verticalidad === 0.75, "el tope por partido corta la avalancha", r.aristas.verticalidad);
  assert(E.applyFiloExecution({ ...r, filoId: null }, { filoHits: 5 }) === null, "sin filosofía no hay ejecución que contar");
}

// ---------- addFiloProgress (contenido) ----------
{
  const r = E.newRun("BRA");
  assert(E.addFiloProgress(r, 1) === null, "sin filosofía el contenido no regala progreso");
  E.choosePhilosophy(r, "bloque");
  const a = E.addFiloProgress(r, 1);
  assert(a && a.id === "directo" && r.aristas.directo === 1, "en empate refuerza la arista firma", a?.id);
  const b = E.addFiloProgress(r, 0.5);
  assert(b && b.id === "solidez" && r.aristas.solidez === 0.5, "refuerza la arista más baja de la filosofía", b?.id);
}

console.log(`\nphilosophy: ${checks} checks · fallos: ${fails}`);
console.log(fails ? "❌ philosophy con fallos" : "✅ philosophy OK");
process.exit(fails ? 1 : 0);
