/* ============================================================
   Tests de la Filosofía (game/philosophy.js + content/identity/philosophies.js) — F1:
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
// T1 (arco de Rasgos): la escalera fina de 10 niveles + las 3 ETAPAS de F1 (valores exactos)
assert(E.FILO_LEVELS.length === 10 && E.FILO_LEVELS[0].min === 0, "10 niveles y el primero arranca en 0");
assert(E.FILO_LEVELS.every((l, i) => i === 0 || l.min > E.FILO_LEVELS[i - 1].min), "umbrales de nivel crecientes");
assert(E.FILO_LEVELS.every((l, i) => i === 0 || l.mult > E.FILO_LEVELS[i - 1].mult), "multiplicadores crecientes");
assert(E.FILO_LEVELS[0].mult === 1.35 && E.FILO_LEVELS[9].mult === 2.1, "la escalera interpola los extremos aprobados en F1");
assert(E.FILO_ETAPAS.length === 3, "3 etapas");
assert(E.FILO_ETAPAS[0].min === 0 && E.FILO_ETAPAS[1].min === 4 && E.FILO_ETAPAS[2].min === 9, "umbrales de etapa EXACTOS de F1 (anclas intactas)");
assert(E.FILO_ETAPAS[0].mult === 1.35 && E.FILO_ETAPAS[1].mult === 1.7 && E.FILO_ETAPAS[2].mult === 2.1, "mults de etapa EXACTOS de F1 (el rival no se recalibra)");
assert(E.FILO_LEVELS[3].etapa === 0 && E.FILO_LEVELS[4].etapa === 1 && E.FILO_LEVELS[8].etapa === 1 && E.FILO_LEVELS[9].etapa === 2, "el mapeo nivel→etapa respeta las anclas 4/9");

// ---------- nacimiento, elección y nivel (arco de Progresión) ----------
const run = E.newRun("BRA");
assert(run.filoId === null && run.filoInicial === null, "la run nace sin filosofía ni escuela");
assert(Object.values(run.filoXp).every(v => v === 0) && run.dtNivel === 1 && run.identityPoints === 0, "las 4 progresiones nacen en 0 y el DT en nivel 1");
assert(E.filoCtx(run) === null, "sin filosofía no hay filo en el matchCtx");
const antes = run.journal.length;
assert(E.choosePhilosophy(run, "no_existe") === null, "elegir una filosofía inexistente no hace nada");
const f = E.choosePhilosophy(run, "press");
assert(f && run.filoId === "press" && run.filoInicial === "press" && run.journal.length === antes + 1, "la elección queda en la run y escribe el diario");
assert(run.identityPoints === 1, "elegir filosofía ES el nivel 1 del DT: 1 PI para el rasgo básico obligatorio");

assert(E.filoPoints(run) === 0 && E.filoLevel(run) === 0 && E.filoEtapa(run) === 0, "nace en nivel 1 (índice 0), Aprendiendo, con 0 XP");
run.filoXp.press = E.FILO_LEVELS[3].min; run.filoXp.bloque = 99999; // el bloque NO es la activa
assert(E.filoLevel(run) === 3 && E.filoEtapa(run) === 0, "la XP de otra filosofía no mueve la activa; nivel 4, aún Aprendiendo");
assert(E.filoLevel(run, "bloque") === 9, "cada filosofía lleva su propio nivel (el bloque está en 10)");
run.filoXp.press = E.FILO_LEVELS[4].min;
assert(E.filoLevel(run) === 4 && E.filoEtapa(run) === 1, "ancla de En desarrollo (nivel 5)");
run.filoXp.press = E.FILO_LEVELS[9].min;
assert(E.filoLevel(run) === 9 && E.filoEtapa(run) === 2, "ancla de Consolidada (nivel 10)");
assert(E.filoCtx(run).id === "press" && E.filoCtx(run).nivel === 9 && E.filoCtx(run).etapa === 2, "filoCtx viaja {id, nivel, etapa}");
run.filoXp.press = 999999;
assert(E.filoLevel(run) === 9, "la escalera tiene techo: XP de sobra no desborda el índice");

// ---------- afinidad de la escuela ----------
{
  for (const [ini, fila] of Object.entries(E.AFINIDAD)) {
    assert(fila[ini] === 2, "la propia escuela aprende al doble", ini);
    assert(Object.values(fila).filter(v => v === 0.6).length === 1, "cada escuela tiene EXACTAMENTE una opuesta", ini);
    assert(Object.keys(fila).length === 4, "la fila cubre las 4 filosofías", ini);
  }
  assert(E.afinidadMult("posesion", "press") === 1.25 && E.afinidadMult("posesion", "contra") === 1
    && E.afinidadMult("posesion", "bloque") === 0.6, "el ejemplo del GDD: desde Posesión, Press afín · Contra neutral · Bloque opuesta");
  const r = E.newRun("BRA");
  E.choosePhilosophy(r, "contra");
  const m = E.filoXpMults(r);
  assert(m.contra === 2 && m.bloque === 1.25 && m.press === 1 && m.posesion === 0.6, "los mults salen de la ESCUELA, no de lo que juegues", JSON.stringify(m));
  r.planFilo = "bloque";
  assert(E.filoXpMults(r).bloque === +(1.25 * E.PLAN_XP_MULT).toFixed(2), "el Plan de Partido multiplica encima de la afinidad");
}

// ---------- el Plan de Partido (Acción del Día) ----------
{
  const r = E.newRun("BRA");
  E.choosePhilosophy(r, "posesion");
  r.actionPending = true;
  const energiaAntes = r.squad.map(p => p.energia);
  const res = E.applyDayAction(r, "plan_contra");
  assert(res && r.filoId === "contra" && r.planFilo === "contra", "declarar el plan cambia la identidad que se juega");
  assert(Object.values(r.filoXp).every(v => v === 0), "el menú NO regala experiencia (regla del GDD)");
  assert(r.buffs.tactica === undefined, "el buff táctico sigue MUERTO");
  assert(r.squad.every((p, i) => p.energia === energiaAntes[i]), "el Plan de Partido no cuesta energía");
  assert(!r.actionPending, "el plan consume la Acción del Día");
  r.actionPending = true;
  r.dayMod = { title: "prueba", mods: { tactica: 0 } };
  assert(E.applyDayAction(r, "plan_press") === null && r.actionPending, "el bloqueo del día bloquea TODOS los planes");
}

// ---------- cambio de identidad: cada idea guarda su nivel ----------
{
  const r = E.newRun("BRA");
  E.choosePhilosophy(r, "press");
  r.filoXp.press = 900;
  r.actionPending = false;
  assert(E.changePhilosophy(r, "contra") === null, "sin Acción del Día pendiente no hay cambio");
  r.actionPending = true;
  assert(E.changePhilosophy(r, "press") === null && r.actionPending, "cambiar a la misma filosofía no consume nada");
  const g = E.changePhilosophy(r, "contra");
  assert(g && r.filoId === "contra" && !r.actionPending, "el cambio consume la Acción del Día");
  assert(r.planFilo === "contra", "el día invertido vale como Plan de Partido");
  assert(r.filoXp.press === 900 && r.filoXp.contra === 0, "lo aprendido de cada idea queda donde estaba");
  assert(r.filoInicial === "press", "la ESCUELA no cambia nunca: la afinidad es de por vida");
}

// ---------- la progresión del partido: XP → nivel → DT → PI ----------
{
  const r = E.newRun("BRA");
  E.choosePhilosophy(r, "press");
  assert(E.applyFiloXp(r, {}) === null, "un partido sin jugadas de identidad no reporta nada");
  const parte = E.applyFiloXp(r, { filoXp: { press: 300, bloque: 60 }, filoIntentos: { press: 5 }, filoAciertos: { press: 3 } });
  assert(r.filoXp.press === 300 && r.filoXp.bloque === 60, "la XP se acredita en CADA filosofía que se ejercitó");
  assert(parte.filos[0].id === "press" && parte.filos[0].intentos === 5 && parte.filos[0].aciertos === 3, "el parte trae el desglose intención/efectividad");
  assert(parte.filos[0].antes === 0 && parte.filos[0].ahora === 1, "300 XP cruzan el primer umbral (250)");
  assert(parte.dtXp === E.FILO_LEVEL_REWARD[2], "la subida a nivel 2 paga la recompensa exacta del GDD");
  assert(r.dtXp === parte.dtXp && r.identityPoints === 2, "el DT cobró la XP y su subida imprimió el 2º PI");
  assert(E.FILO_LEVEL_REWARD[10] > 3 * E.FILO_LEVEL_REWARD[2], "llevar una idea de 9 a 10 paga 3× lo que paga de 1 a 2");
}

// ---------- el Director Técnico (game/coach) ----------
{
  const r = E.newRun("BRA");
  E.choosePhilosophy(r, "bloque");
  assert(E.DT_LEVELS.length === E.DT_MAX && E.DT_LEVELS[0] === 0, "20 niveles de DT y el primero es gratis");
  assert(E.DT_LEVELS.every((v, i) => i === 0 || v > E.DT_LEVELS[i - 1]), "curva de DT estrictamente creciente");
  assert(E.dtLevelOf(0) === 1 && E.dtLevelOf(E.DT_LEVELS[19]) === 20, "el mapeo XP→nivel cubre los extremos");
  const res = E.addCoachXp(r, E.DT_LEVELS[4]);
  assert(res.nivel === 5 && res.pi === 4 && r.identityPoints === 5, "subir 4 niveles de golpe imprime 4 PI (más el inicial)");
  E.addCoachXp(r, 999999);
  assert(r.dtNivel === 20, "el DT tiene techo en 20");
  assert(E.FILO_LEVEL_REWARD.slice(2).reduce((s, x) => s + x, 0) < E.DT_LEVELS[19],
    "una sola filosofía al tope NO alcanza para el DT 20: hay que abrir una segunda idea");
}

// ---------- addFiloProgress: los eventos también enseñan ----------
{
  const r = E.newRun("BRA");
  assert(E.addFiloProgress(r, 1) === null, "sin filosofía el contenido no regala progreso");
  assert(E.addFirmaProgress(r, 1) === null, "tampoco a la firma (F3)");
  E.choosePhilosophy(r, "bloque");
  const a = E.addFiloProgress(r, 1);
  assert(a && a.id === "bloque" && a.xp === E.EVENT_XP * 2, "el evento paga XP a la filosofía activa, con afinidad de escuela", a && a.xp);
  assert(r.filoXp.bloque === a.xp, "la XP del evento queda acreditada");
  assert(E.STAT_LABELS[a.stat], "el evento sigue pudiendo tocar la stat de ese fútbol (Ensayo de la firma)");
}

// ---------- una sola fuente para XP/nivel (content delega en game) ----------
{
  const r = E.newRun("BRA");
  E.choosePhilosophy(r, "press");
  r.filoXp.press = 700;
  assert(E.filoPointsOf(r) === E.filoPoints(r) && E.filoLevelOf(r) === E.filoLevel(r), "filoPointsOf/filoLevelOf (content) ≡ filoPoints/filoLevel (game)");
  assert(E.xpLevelOf(700) === E.filoLevel(r), "xpLevelOf es la misma escalera (la usa el Match para el skill-up en vivo)");
  for (const [tipo, filo] of Object.entries(E.FILO_BY_TIPO)) {
    assert(E.SEQUENCE_TYPES.some(t => t.id === tipo), "el tipo existe en el catálogo", tipo);
    assert(E.PHILOSOPHIES.some(p => p.id === filo), "la filosofía que aprende existe", filo);
  }
  for (const p of E.PHILOSOPHIES) {
    assert(Object.values(E.FILO_BY_TIPO).includes(p.id), "las 4 filosofías tienen al menos un fútbol que las enseña", p.id);
    assert(p.counters && p.counters.brilla.length > 15 && p.counters.sufre.length > 15, "counters cualitativos visibles (pantalla de identidad)", p.id);
    assert(Array.isArray(p.firmaIntros) && p.firmaIntros.length >= 2 && p.firmaIntros.every(fn => typeof fn({ name: "X" }) === "string"), "voces de la firma para el relato", p.id);
  }
  for (const a of E.ARISTAS) assert(E.STAT_LABELS[a.stat], "cada arista trabaja una stat real (evento Ensayo de la firma)", a.id);
}


// ---------- F2: la identidad del rival (curación + derivación) ----------
{
  const IDS = Object.keys(E.TEAM_PHILOSOPHIES);
  assert(IDS.length === 17, "los 16 del roadmap + ITA (rebalance de la curación, sprint del Rival que Decide)", IDS.length);
  // EL REPARTO de la curación es parte del balance, no un detalle: los curados son los
  // 16 de más rating, o sea LOS QUE LLEGAN A LA FINAL. Un ciclo de counters sobre un
  // campo desparejo no es un ciclo — F2 tenía 7 posesión contra 1 bloque y eso valía
  // ~2.2pp de campeón entre el mejor y el peor pick. Ninguna identidad puede volver a
  // duplicar a otra sin que alguien lo note acá.
  {
    const n = f => IDS.filter(id => E.TEAM_PHILOSOPHIES[id] === f).length;
    const cuentas = E.COUNTER_CYCLE.map(n);
    assert(Math.max(...cuentas) - Math.min(...cuentas) <= 1,
      "la curación reparte las 4 identidades parejo (±1)", E.COUNTER_CYCLE.map((f, i) => `${f}:${cuentas[i]}`).join(" "));
  }
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
  // Bloque cede volumen ofensivo; el rival que espera me la cede a mí. Los COSTOS DE
  // IDENTIDAD (F2) se miden en cruces NEUTROS del ciclo, para que el diente del ciclo
  // (±CICLO_SHARE) no los contamine: son costos de la identidad, no del cruce.
  //
  // LA FILA DE CONTRA (hallazgo post-cierre del sprint del Rival que Decide): el −0.05
  // de "mi Contra cede posesión" SE RETIRÓ. Nació en F2 para compensar que el counter
  // vivía en el pool, y con el pool degradado a narrador (0.0pp) quedó huérfano —
  // apilado con el diente nuevo en el MISMO canal, cancelaba el diente en el cruce que
  // Contra gana (vs Press: −0.05 + 0.05 = 0.00). Medido: Contra rendía −2.5pp de share
  // neto contra los 4 rivales mientras Press y Posesión (sin costo) se quedaban con
  // +2.5pp — Contra terminaba siendo la peor identidad de las cuatro pese a que Bloque
  // paga MÁS costo en papel (su formación defensiva lo compensa; la de Contra no).
  assert(E.filoShareShift({ id: "contra" }, null) === 0, "mi Contra NO paga costo de identidad (retirado, ver arriba)");
  assert(E.filoShareShift({ id: "bloque" }, { id: "press" }) === -0.08, "mi Bloque cede volumen (−0.08, ajuste PO post-gate)");
  assert(E.filoShareShift(null, { id: "bloque" }) === 0.06, "el bloque rival me cede la pelota");
  assert(E.filoShareShift({ id: "press" }, { id: "press" }) === 0, "el Press no toca el reparto (paga energía)");
  // El diente del ciclo, en el cruce favorable de Contra, ya no se cancela.
  assert(E.filoShareShift({ id: "contra" }, { id: "press" }) === E.CICLO_SHARE, "el diente de Contra vs Press llega entero, sin costo que lo anule");
}

/* ---------- EL CICLO DE COUNTERS (sprint del Rival que Decide) ---------- */
{
  const F = E.COUNTER_CYCLE;
  assert(F.length === 4 && new Set(F).size === 4, "el ciclo son las 4 identidades, sin repetir");
  assert(F.join() === "press,posesion,bloque,contra", "el ciclo es Press > Posesión > Bloque > Contra > Press", F.join());

  // LA LEY: cada uno le gana a UNO, pierde con UNO y empata con UNO. Es lo que el PO
  // pidió literalmente ("fuerte contra uno, débil contra otro, indiferente con el
  // tercero") y lo único que hace que ninguna identidad quede dominada por estructura.
  for (const f of F) {
    const signos = F.filter(o => o !== f).map(o => E.counterEdge(f, o)).sort();
    assert(signos.join() === "-1,0,1", `${f}: gana a uno, pierde con uno, empata con uno`, signos.join());
    assert(E.counterEdge(f, f) === 0, `${f} contra sí mismo es espejo, no cruce`);
    assert(E.counterEdge(f, E.PRESA_DE[f]) === 1, `${f} caza a su presa`);
    assert(E.counterEdge(E.CAZADOR_DE[f], f) === 1, `al cazador de ${f} le gana el cruce`);
  }
  // ANTISIMETRÍA: si te gano, me ganás al revés. Sin esto un "ciclo" puede tener dos
  // ganadores del mismo cruce y nadie se entera hasta medirlo.
  for (const a of F) for (const b of F) {
    assert(E.counterEdge(a, b) === -E.counterEdge(b, a), `el cruce ${a}|${b} es antisimétrico`);
  }
  assert(E.counterEdge(null, "press") === 0 && E.counterEdge("press", null) === 0, "sin identidad no hay cruce");

  // EL DIENTE está en el canal de POSESIÓN (ROADMAP-rival §2: el pool medía 0.0pp de
  // interacción, la posesión ~0.8pp de win% por 0.01 de share). Se mide en los cruces
  // Press↔Posesión, que son los únicos donde ninguna de las dos paga costo de identidad:
  // ahí el término del ciclo queda solo y se puede leer.
  assert(E.filoShareShift({ id: "press" }, { id: "posesion" }) === E.CICLO_SHARE, "cazar inclina el reparto a mi favor");
  assert(E.filoShareShift({ id: "posesion" }, { id: "press" }) === -E.CICLO_SHARE, "ser cazado me lo quita");
  assert(E.filoShareShift({ id: "press" }, { id: "bloque" }) === 0.06, "en el cruce neutro solo quedan los costos de identidad");

  // LA MATRIZ DE POOL NO PUEDE CONTRADECIR AL CICLO. Es el candado que faltaba en F2:
  // las celdas se escribían a mano y se habían vuelto 7 celdas ad hoc con un cruce
  // LOSE-LOSE (Posesión↔Bloque penalizado en las dos sillas) que nadie detectó hasta
  // medirlo. La firma de cada identidad solo puede AGRANDARSE en un cruce que gana y
  // ACHICARSE en uno que pierde.
  for (const [side, mio, suyo, pesos] of E.counterCells()) {
    const edge = E.counterEdge(mio, suyo);
    if (mio === suyo) continue;                       // el espejo es sabor, no ciclo
    assert(edge !== 0, `la celda ${side} ${mio}|${suyo} existe: el cruce no puede ser neutro`);
    // Solo el lado `mine` se verifica contra la firma: ahí la celda habla de MI fútbol
    // y la lectura es directa (mi firma crece si gano el cruce). Las celdas `opp` son
    // el rival haciéndome algo (el sitio del que elabora), otro tipo y otra gramática.
    if (side !== "mine") continue;
    const mult = pesos[E.FIRMA_TYPE[mio]];
    if (mult === undefined) continue;
    assert(edge > 0 ? mult > 1 : mult < 1,
      `mine ${mio}|${suyo}: la firma se mueve en la dirección del ciclo`, `${E.FIRMA_TYPE[mio]} ×${mult}`);
  }
  // Y el ciclo tiene que estar COMPLETO en el pool: las 4 aristas contadas desde las dos
  // sillas. F2 tenía 9 de 16 cruces vacíos y por eso "elegir identidad daba igual".
  for (const f of F) {
    assert(E.counterCell("mine", f, E.PRESA_DE[f]), `el pool cuenta que ${f} caza a ${E.PRESA_DE[f]}`);
    assert(E.counterCell("mine", f, E.CAZADOR_DE[f]), `el pool cuenta que a ${f} lo caza ${E.CAZADOR_DE[f]}`);
  }
  // Los NEUTROS no tienen celda, y esa ausencia es parte del diseño.
  for (const a of F) for (const b of F) {
    if (a === b || E.counterEdge(a, b) !== 0) continue;
    assert(!E.counterCell("mine", a, b), `el cruce neutro ${a}|${b} no lleva celda`);
  }

  // LA LEY DE PARIDAD (hallazgo post-cierre): ningún costo de identidad puede cancelar
  // el diente en el cruce que esa identidad GANA. Es exactamente el agujero que dejó a
  // Contra −2.5pp de share neto mientras Press/Posesión (sin costo) se quedaban con el
  // diente entero — apilar un costo viejo sobre un mecanismo nuevo en el MISMO canal, sin
  // volver a mirar la interacción. En el cruce favorable, el shift total tiene que ser
  // ESTRICTAMENTE mayor que 0 (el diente solo, sin costo, ya da +CICLO_SHARE > 0): si un
  // costo de identidad futuro lo empuja a ≤0, este test explota antes de que alguien
  // tenga que medirlo en un banco de 2000 partidos para encontrarlo.
  for (const f of F) {
    const presa = E.PRESA_DE[f];
    assert(E.filoShareShift({ id: f }, { id: presa }) > 0,
      `el cruce que ${f} gana (vs ${presa}) le queda share NETO positivo, no cancelado por su costo de identidad`,
      E.filoShareShift({ id: f }, { id: presa }).toFixed(3));
  }
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
  assert(E.identityGapMult(cpv, 2, 1) === 1, "sin pasar mi nivel fino, llevar ventaja de ETAPA no cambia nada");
  // La brecha COMPONE con la madurez (R3: desde 16avos): hasta el rival chico llega
  // a KO con idea (nivel 1 madurado) y castiga al improvisador — nunca en grupos.
  assert(Math.abs(E.identityGapMult(cpv, 0, 1) - (1 + E.IDENTITY_GAP_PCT)) < 1e-9,
    "el chico madurado ya genera brecha 1 contra el sin idea desde 16avos", E.identityGapMult(cpv, 0, 1));
  assert(E.identityGapMult(cpv, 1, 1) === 1, "…y con nivel propio 1 esa brecha desaparece");

  // AL FAVORITO LE JUEGAN LA FINAL (el dial del techo, 29-jul-2026): el espejo. El
  // castigo se mide en ETAPAS y la ventaja en NIVELES (0-9) — es lo único que separa
  // al DT óptimo (~7) del que improvisa (~5), porque en etapas los dos están en 1.
  {
    const cpvKO = E.rivalFiloLevel(cpv, 1); // el chico madurado en 16avos = etapa 1 → ancla nivel 4
    assert(cpvKO === 1, "el rival del ejemplo llega a 16avos En desarrollo", cpvKO);
    assert(E.identityGapMult(cpv, 1, 0, 9) === 1, "en grupos no hay vara alta: la ventaja tampoco existe (koRound 0)");
    assert(E.identityGapMult(cpv, 1, 1, 4) === 1, "empatado con su etapa (nivel 4 = el ancla) el partido es parejo: ×1");
    assert(Math.abs(E.identityGapMult(cpv, 1, 1, 7) - (1 + 3 * E.IDENTITY_LEAD_PCT)) < 1e-9,
      "3 niveles por encima de su etapa → le juegan la final de su vida", E.identityGapMult(cpv, 1, 1, 7));
    assert(E.identityGapMult(cpv, 1, 1, 4) <= E.identityGapMult(cpv, 1, 1, 7), "más ventaja = más vara alta (monótono)");
    // Las dos mitades NUNCA se pisan: o llego corto de idea, o llego sobrado.
    assert(E.identityGapMult(fra, 0, 1, 2) === E.identityGapMult(fra, 0, 1),
      "contra un grande voy por detrás: paga la brecha y la vara alta no suma nada");
    assert(E.identityGapMult(cpv, 1, 1, 0) === 1, "y por debajo del ancla no hay ventaja que cobrar (nunca es negativa)");
    // El ancla sale de FILO_LEVELS, no de un número a mano: Consolidada arranca en el
    // último nivel, así que ni el nivel 9 lleva ventaja contra un rival Consolidado.
    assert(E.identityGapMult(fra, 2, 5, 9) === 1, "contra el Consolidado, ni con la filosofía al tope hay ventaja");
  }

  // El canal completo: forma × brecha llegan multiplicadas al once del Match.
  // (T1: el Match lee filo.etapa para la brecha — matchCtx viaja {id, nivel, etapa})
  const my = { team: E.getTeam("BRA"), lineup: [], bench: [], mentalidad: "normal", buffs: {}, moral: 50, filo: { id: "press", nivel: 0, etapa: 0 }, koRound: 3 };
  const m = new E.Match(my, fra, true);
  const esperado = E.tourneyFormaMult(3) * E.identityGapMult(fra, 0, 3);
  assert(m.oppLineup.every(p => Math.abs(p.forma - esperado) < 1e-9), "p.forma = forma de torneo × brecha, exacto", esperado);
}

console.log(`\nphilosophy: ${checks} checks · fallos: ${fails}`);
console.log(fails ? "❌ philosophy con fallos" : "✅ philosophy OK");
process.exit(fails ? 1 : 0);
