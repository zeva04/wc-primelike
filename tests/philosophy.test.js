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

// ---------- addFiloProgress / addFirmaProgress (contenido) ----------
{
  const r = E.newRun("BRA");
  assert(E.addFiloProgress(r, 1) === null, "sin filosofía el contenido no regala progreso");
  assert(E.addFirmaProgress(r, 1) === null, "tampoco a la firma (F3)");
  E.choosePhilosophy(r, "bloque");
  const a = E.addFiloProgress(r, 1);
  assert(a && a.id === "directo" && r.aristas.directo === 1, "en empate refuerza la arista firma", a?.id);
  const b = E.addFiloProgress(r, 0.5);
  assert(b && b.id === "solidez" && r.aristas.solidez === 0.5, "refuerza la arista más baja de la filosofía", b?.id);
  const c = E.addFirmaProgress(r, 1);
  assert(c && c.id === "directo" && r.aristas.directo === 2, "addFirmaProgress va DIRECTO a la firma aunque no sea la más baja (F3)", c?.id);
}

// ---------- F3: una sola fuente para puntos/nivel (content delega en game) ----------
{
  const r = E.newRun("BRA");
  E.choosePhilosophy(r, "press");
  r.aristas.presion = 3; r.aristas.verticalidad = 2;
  assert(E.filoPointsOf(r) === E.filoPoints(r) && E.filoLevelOf(r) === E.filoLevel(r), "filoPointsOf/filoLevelOf (content) ≡ filoPoints/filoLevel (game)");
  // los datos F3 del catálogo: counters y voces de la firma para el relato
  for (const p of E.PHILOSOPHIES) {
    assert(p.counters && p.counters.brilla.length > 15 && p.counters.sufre.length > 15, "counters cualitativos visibles (pantalla de identidad)", p.id);
    assert(Array.isArray(p.firmaIntros) && p.firmaIntros.length >= 2 && p.firmaIntros.every(fn => typeof fn({ name: "X" }) === "string"), "voces de la firma para el relato", p.id);
  }
  for (const a of E.ARISTAS) assert(E.STAT_LABELS[a.stat], "cada arista trabaja una stat real (evento Ensayo de la firma)", a.id);
}

// ---------- F2: la identidad del rival (curación + derivación) ----------
{
  const IDS = Object.keys(E.TEAM_PHILOSOPHIES);
  assert(IDS.length === 16, "los 16 curados del roadmap, ni uno más", IDS.length);
  for (const id of IDS) {
    const team = E.getTeam(id);
    assert(team, "todo curado existe en la base de datos", id);
    assert(E.PHILOSOPHIES.some(p => p.id === E.TEAM_PHILOSOPHIES[id]), "filosofía curada válida", id);
    assert(E.getFormation(E.FILO_FORMATION[E.TEAM_PHILOSOPHIES[id]]), "formación curada válida", id);
  }
  assert(E.derivePhilosophy(E.getTeam("BRA")) === "contra", "el curado manda sobre la derivación (BRA)");
  const rf = E.rivalFilo(E.getTeam("ESP"));
  assert(rf.id === "posesion" && rf.nivel === 2 && rf.curated, "ESP: posesión consolidada curada", JSON.stringify(rf));
  // Derivación determinista para los 48: siempre una filosofía válida, sin rng
  for (const t of E.allTeams()) {
    const d = E.derivePhilosophy(t);
    assert(E.PHILOSOPHIES.some(p => p.id === d), "derivación válida para todos", `${t.id}=${d}`);
    assert(E.rivalFiloLevel(t) >= 0 && E.rivalFiloLevel(t) <= 2, "nivel rival en rango", t.id);
  }
  // Los grandes llegan consolidados; los chicos, aprendiendo (decisión PO F2)
  assert(E.rivalFiloLevel(E.getTeam("FRA")) === 2, "FRA consolidado");
  assert(E.rivalFiloLevel(E.getTeam("CUW")) === 0, "Curazao aprendiendo");
  // El Press derivado no existe: solo curado (presionar 90' no se infiere de stats)
  for (const t of E.allTeams()) {
    if (!E.TEAM_PHILOSOPHIES[t.id]) assert(E.derivePhilosophy(t) !== "press", "press solo curado", t.id);
  }
}

// ---------- F2: formación curada en el once rival ----------
{
  const lineup = E.genOpponentLineup(E.getTeam("SWE"));
  const defs = lineup.filter(p => p.pos === "DEF").length;
  assert(lineup.length === 6, "SWE forma 6");
  assert(defs >= 2, "el bloque de SWE presenta una zaga poblada (3-1-1, con fallback si el plantel no da)", `DEF=${defs}`);
  const esp = E.genOpponentLineup(E.getTeam("ESP"));
  assert(esp.filter(p => p.pos === "MED").length >= 2, "la posesión de ESP puebla el medio (1-3-1)", esp.map(p => p.pos).join(","));
}

// ---------- F2: costos de identidad ----------
{
  const r = E.newRun("BRA");
  E.choosePhilosophy(r, "press");
  const lineup = r.squad.slice(0, 6);
  const antesE = lineup.map(p => p.energia);
  const res = E.applyFiloCosts(r, { my: { lineup } });
  assert(res && res.press === -E.PRESS_FATIGUE && lineup.every((p, i) => p.energia === antesE[i] - E.PRESS_FATIGUE), "el Press paga −6 post-partido a los que jugaron");
  assert(r.squad.slice(6).every(p => p.energia === 100), "los que no jugaron no pagan");
  r.filoId = "posesion";
  assert(E.applyFiloCosts(r, { my: { lineup } }) === null, "solo el Press paga energía");
  // Contra/Bloque ceden posesión; el rival que espera me la cede a mí
  assert(E.filoShareShift({ id: "contra" }, null) === -0.05, "mi Contra cede posesión");
  assert(E.filoShareShift({ id: "bloque" }, { id: "posesion" }) === -0.08, "mi Bloque cede volumen (−0.08, ajuste PO post-gate)");
  assert(E.filoShareShift(null, { id: "bloque" }) === 0.06, "el bloque rival me cede la pelota");
  assert(E.filoShareShift({ id: "press" }, { id: "press" }) === 0, "el Press no toca el reparto (paga energía)");
}

// ---------- R2/R3: la escalada — madurez por ronda y la brecha de identidad ----------
{
  // La madurez (R2): +1 nivel desde cuartos (koRound 3), tope Consolidada.
  const fra = E.getTeam("FRA"), swe = E.getTeam("SWE"), cpv = E.getTeam("CPV");
  assert(E.rivalFiloLevel(fra) === 2, "un grande llega Consolidado de base");
  assert(E.rivalFiloLevel(fra, 5) === 2, "Consolidada es el tope: la final no lo sube a 3");
  assert(E.rivalFiloLevel(swe, 1) === Math.min(2, E.rivalFiloLevel(swe) + 1), "desde 16avos todo rival madura (R3: nadie llega a KO sin idea)");
  assert(E.rivalFiloLevel(swe, 0) === E.rivalFiloLevel(swe), "en grupos nadie madura (koRound 0)");
  assert(E.rivalFiloLevel(cpv, 3) === 1, "el chico (Aprendiendo) llega a cuartos En desarrollo");

  // La brecha (R3): tabla exacta, inmunidad con nivel propio ≥ rival, grupos ×1.
  assert(E.identityGapMult(fra, 0, 0) === 1, "en grupos la brecha no existe (koRound 0)");
  assert(E.identityGapMult(fra, 2, 5) === 1, "Consolidado es INMUNE: brecha 0 hasta en la final (la tesis de R3)");
  assert(Math.abs(E.identityGapMult(fra, 1, 1) - (1 + E.IDENTITY_GAP_PCT)) < 1e-9, "brecha 1 → +2%", E.identityGapMult(fra, 1, 1));
  assert(Math.abs(E.identityGapMult(fra, 0, 1) - (1 + 2 * E.IDENTITY_GAP_PCT)) < 1e-9, "brecha 2 → +4% (el sin idea ante un grande)");
  assert(E.identityGapMult(fra, undefined, 1) === E.identityGapMult(fra, 0, 1), "sin filosofía = nivel 0 (duck-typed)");
  assert(E.identityGapMult(cpv, 2, 1) === 1, "mi nivel sobre el suyo NUNCA me premia: la brecha solo castiga");
  // La brecha COMPONE con la madurez (R3: desde 16avos): hasta el rival chico llega
  // a KO con idea (nivel 1 madurado) y castiga al improvisador — nunca en grupos.
  assert(Math.abs(E.identityGapMult(cpv, 0, 1) - (1 + E.IDENTITY_GAP_PCT)) < 1e-9,
    "el chico madurado ya genera brecha 1 contra el sin idea desde 16avos", E.identityGapMult(cpv, 0, 1));
  assert(E.identityGapMult(cpv, 1, 1) === 1, "…y con nivel propio 1 esa brecha desaparece");

  // El canal completo: forma × brecha llegan multiplicadas al once del Match.
  const my = { team: E.getTeam("BRA"), lineup: [], bench: [], mentalidad: "normal", buffs: {}, moral: 50, filo: { id: "press", nivel: 0 }, koRound: 3 };
  const m = new E.Match(my, fra, true);
  const esperado = E.tourneyFormaMult(3) * E.identityGapMult(fra, 0, 3);
  assert(m.oppLineup.every(p => Math.abs(p.forma - esperado) < 1e-9), "p.forma = forma de torneo × brecha, exacto", esperado);
}

console.log(`\nphilosophy: ${checks} checks · fallos: ${fails}`);
console.log(fails ? "❌ philosophy con fallos" : "✅ philosophy OK");
process.exit(fails ? 1 : 0);
