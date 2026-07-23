/* ============================================================
   Tests del árbol de Rasgos (game/traits.js + content/traits.js) — T1:
   - catálogo sano: 12 Basic, 3 por filosofía, uno por rama, tono sobrio
   - Puntos de Identidad: +1 al elegir (nivel 1), +1 por nivel de la ACTIVA
   - anti-farming: los niveles heredados al cambiar NO premian
   - latencia: los rasgos comprados reviven al volver a la filosofía
   - compra: 1 PI + requisitos; duplicado/ajeno/sin PI no pasan
   Uso: node tests/traits.test.js
   ============================================================ */
import { loadEngine } from "./load-engine.js";

const { Engine: E } = await loadEngine();

let fails = 0, checks = 0;
const assert = (cond, msg, ctx) => { checks++; if (!cond) { fails++; console.error("FAIL:", msg, ctx ?? ""); } };

// ---------- catálogo ----------
{
  const basics = E.TRAITS.filter(t => t.tier === "basic");
  assert(basics.length === 12, "12 rasgos Basic (3 por filosofía)", basics.length);
  assert(new Set(E.TRAITS.map(t => t.id)).size === E.TRAITS.length, "ids únicos en el catálogo");
  for (const filo of ["press", "posesion", "contra", "bloque"]) {
    const own = E.traitsOf(filo, "basic");
    assert(own.length === 3, `${filo} tiene 3 básicos`, own.length);
    // Regla Firma · Respuesta · Expansión: cada básico abre una rama distinta
    assert(new Set(own.map(t => t.rama)).size === 3, `${filo}: un básico por rama`, own.map(t => t.rama).join(","));
    for (const t of own) assert(E.RAMA_LABELS[t.rama], "rama válida", `${t.id}: ${t.rama}`);
  }
  for (const t of E.TRAITS) {
    assert(t.nombre && t.desc && t.momento && t.icon, "rasgo completo (nombre/desc/momento/icon)", t.id);
    assert(!/\d/.test(t.desc), "la descripción al jugador NUNCA habla de números (tono sobrio, decisión PO)", `${t.id}: "${t.desc}"`);
    assert(t.req && (t.req.nivel || 1) >= 1, "todo rasgo declara su nivel requerido", t.id);
    assert(t.hooks && Object.keys(t.hooks).length >= 1, "todo rasgo declara sus hooks (backlog interno)", t.id);
    assert(E.getPhilosophy(t.filo), "la filosofía del rasgo existe", t.id);
  }
  assert(E.traitById("morder")?.filo === "press", "traitById encuentra por id");
  assert(E.traitById("no_existe") === undefined, "traitById devuelve undefined para basura");
}

// ---------- PI: el inicial y la escalera de la filosofía activa ----------
{
  const r = E.newRun("BRA");
  assert(r.identityPoints === 0 && Object.keys(r.rasgos).length === 0, "la run nace sin PI ni rasgos");
  E.choosePhilosophy(r, "press");
  assert(r.identityPoints === 1, "elegir filosofía = nivel 1 = 1 PI inmediato (flujo de inicio)", r.identityPoints);
  assert(r.piCredited.press === 0, "el nivel 1 (índice 0) queda acreditado");
  assert(E.syncIdentityPI(r) === null, "el sync es idempotente: sin nivel nuevo no regala nada");
  // La Sesión Táctica sube nivel → PI en el mismo beat (applyDayAction llama al sync)
  r.actionPending = true;
  E.applyDayAction(r, "tactica_presion");
  assert(r.aristas.presion === 1 && r.identityPoints === 2, "subir a nivel 2 vía Acción del Día acredita +1 PI", r.identityPoints);
  // La ejecución también (postMatchUpdate llama al sync): +1 punto de arista = +1 nivel
  r.aristas.presion = 2;
  const res = E.syncIdentityPI(r);
  assert(res && res.gained === 1 && r.identityPoints === 3, "cada nivel de la ACTIVA acredita 1 PI");
  // Varios niveles de golpe (evento generoso): se acreditan TODOS
  r.aristas.verticalidad = 3;
  const multi = E.syncIdentityPI(r);
  assert(multi && multi.gained === 3 && r.identityPoints === 6, "niveles múltiples acreditan de a varios", multi?.gained);
}

// ---------- anti-farming: la herencia no imprime PI ----------
{
  const r = E.newRun("BRA");
  E.choosePhilosophy(r, "press");           // 1 PI (nivel 1)
  r.aristas.presion = 4;                    // arista COMPARTIDA con posesión
  E.syncIdentityPI(r);                      // press nivel 5: +4 → 5 PI
  assert(r.identityPoints === 5, "premisa: 5 PI ganados con el press", r.identityPoints);
  r.actionPending = true;
  E.changePhilosophy(r, "posesion");        // posesión HEREDA presión 4 → nivel 5
  assert(r.identityPoints === 5, "cambiar NO imprime PI: la herencia se acredita sin premio", r.identityPoints);
  assert(r.piCredited.posesion === E.filoLevelOf(r), "la nueva nace acreditada a su nivel heredado");
  // …pero lo que se construya DESDE hoy sí paga
  r.aristas.elaboracion = 1;
  const res = E.syncIdentityPI(r);
  assert(res && res.gained === 1 && r.identityPoints === 6, "el nivel nuevo de la activa sí acredita");
  // Y al VOLVER: los niveles que la latente ganó mientras tanto tampoco premian
  r.aristas.verticalidad = 2;               // sube el nivel del press latente (presión 4 + vertical 2)
  r.actionPending = true;
  E.changePhilosophy(r, "press");
  assert(r.identityPoints === 6, "volver tampoco imprime: PI solo de la filosofía ACTIVA jugándola", r.identityPoints);
}

// ---------- compra y latencia ----------
{
  const r = E.newRun("BRA");
  E.choosePhilosophy(r, "press");           // 1 PI
  assert(E.buyTrait(r, "hombre_libre") === null, "un rasgo de OTRA filosofía no se puede comprar");
  assert(E.buyTrait(r, "no_existe") === null, "un id basura no se puede comprar");
  const antes = r.journal.length;
  const t = E.buyTrait(r, "morder");
  assert(t && t.id === "morder" && r.identityPoints === 0, "comprar cobra el PI y devuelve la fila", r.identityPoints);
  assert(r.rasgos.press.includes("morder") && r.journal.length === antes + 1, "el rasgo queda en la run y escribe el diario");
  assert(E.activeTraitIds(r).join() === "morder" && E.activeTraits(r)[0].nombre === "Morder Tras Pérdida", "activeTraits lee la filosofía activa");
  assert(E.buyTrait(r, "morder") === null, "no se compra dos veces");
  assert(E.buyTrait(r, "trampa_banda") === null, "sin PI no hay compra");
  const reqs = E.traitReqs(r, E.traitById("trampa_banda"));
  assert(!reqs.ok && reqs.faltas.some(x => x.includes("Punto de Identidad")), "el candado nombra la falta en lenguaje de jugador", reqs.faltas.join(" · "));
  // filoCtx viaja con los rasgos activos (la frontera run→Match)
  assert(E.filoCtx(r).rasgos.includes("morder"), "filoCtx lleva los rasgos al matchCtx");
  // Latencia (decisión PO #3): cambiar apaga, volver revive
  r.actionPending = true;
  E.changePhilosophy(r, "bloque");
  assert(E.activeTraitIds(r).length === 0, "con otra filosofía los rasgos comprados se APAGAN (latentes)");
  assert(r.rasgos.press.includes("morder"), "…pero no se pierden");
  r.actionPending = true;
  E.changePhilosophy(r, "press");
  assert(E.activeTraitIds(r).includes("morder"), "volver a la filosofía REVIVE sus rasgos");
}

// ---------- el árbol para la pantalla ----------
{
  const r = E.newRun("BRA");
  E.choosePhilosophy(r, "contra");
  const tree = E.traitTree(r);
  assert(tree.length === 9, "el árbol del contra trae el arco completo: 3+3+2+1 (T3)", tree.length);
  const buyables = tree.filter(t => t.buyable);
  assert(buyables.length === 3 && buyables.every(t => t.tier === "basic"), "con 1 PI solo los 3 básicos son comprables (el 1-de-3 del inicio)");
  assert(tree.filter(t => t.tier === "intermediate").every(t => !t.buyable && t.faltas.length >= 2), "los intermediate nacen con candado múltiple (previo + nivel + principio)");
  E.buyTrait(r, "tres_pases");
  const tree2 = E.traitTree(r);
  assert(tree2.find(t => t.id === "tres_pases").owned, "el comprado figura owned");
  assert(tree2.filter(t => !t.owned).every(t => !t.buyable && t.faltas.length), "sin PI el resto queda con candado y faltas legibles");
}

// ---------- T1.3/T1.4: el motor reactivo — los hooks EN el partido ----------
/** Un Match real BRA vs oppId con filosofía + rasgos en el ctx (como filoCtx los manda). */
function makeMatch(oppId, filoId, rasgos, etapa = 0) {
  const run = E.newRun("BRA");
  const { lineup } = E.currentLineup(run.squad, null, null);
  const bench = run.squad.filter(p => !lineup.includes(p));
  return new E.Match({ team: E.getTeam("BRA"), lineup, bench, mentalidad: "normal", buffs: {},
    filo: filoId ? { id: filoId, nivel: [0, 4, 9][etapa], etapa, rasgos } : null }, E.getTeam(oppId), false, []);
}
/** Fuerza una secuencia y la juega eligiendo SIEMPRE la opción `optIdx`. Devuelve el feed nuevo. */
function forcePlay(m, typeId, optIdx = 0) {
  const from = m.feed.length;
  E.startSequence(m, E.sequenceType(typeId));
  let steps = 0;
  while (m.seq && steps++ < 25) {
    if (!m.decision) { m.resolveSequenceAct(null); continue; }
    if (m.decision.id !== "sequence") break;
    m.resolveSequenceAct(m.decision.options[Math.min(optIdx, m.decision.options.length - 1)].key);
  }
  return m.feed.slice(from).map(l => l.text).join(" | ");
}

{
  // Morder Tras Pérdida: la pérdida arriesgada a veces ENCADENA una recuperación mía
  let mordida = false, chainBudgetOk = true;
  for (let i = 0; i < 300 && !mordida; i++) {
    const m = makeMatch("ARG", "press", ["morder"]);
    m.min = 30;
    const feed = forcePlay(m, "circulacion", 1); // filtrado: la opción de riesgo
    if (feed.includes("MORDIDA")) mordida = true;
    if ((m._chainCount || 0) > E.MAX_CHAINS) chainBudgetOk = false;
  }
  assert(mordida, "Morder encadena la recuperación reactiva (el momento SE VE en el feed)");
  assert(chainBudgetOk, "el presupuesto de cadenas nunca se excede");

  // Sin el rasgo, la mordida JAMÁS aparece (el hook no filtra gratis)
  let sinRasgo = false;
  for (let i = 0; i < 150; i++) {
    const m = makeMatch("ARG", "press", []);
    m.min = 30;
    if (forcePlay(m, "circulacion", 1).includes("MORDIDA")) sinRasgo = true;
  }
  assert(!sinRasgo, "sin comprar el rasgo no hay mordida (los hooks nacen del árbol)");

  // Tender la Trampa: el repliegue contenido convierte en transición mía
  let trampa = false;
  for (let i = 0; i < 300 && !trampa; i++) {
    const m = makeMatch("MAR", "contra", ["tender_trampa"]);
    m.min = 30;
    if (forcePlay(m, "repliegue", 0).includes("¡La trampa se cierra!")) trampa = true;
  }
  assert(trampa, "Tender la Trampa convierte el repliegue en contra (def→of comprable)");

  // Segunda Jugada: el duelo perdido del pelotazo recupera la segunda pelota
  let segunda = false;
  for (let i = 0; i < 300 && !segunda; i++) {
    const m = makeMatch("ARG", "bloque", ["segunda_jugada"]);
    m.min = 30;
    if (forcePlay(m, "pelotazo", 0).includes("La segunda pelota es nuestra")) segunda = true;
  }
  assert(segunda, "Segunda Jugada caza el rechace y vuelve a lanzar");

  // Tres Pases o Nada: la transición puede NACER en el desenlace (actIdx saltado)
  let salto = false;
  for (let i = 0; i < 200 && !salto; i++) {
    const m = makeMatch("MAR", "contra", ["tres_pases"]);
    m.min = 30;
    E.startSequence(m, E.sequenceType("transicion"));
    if (m.seq && m.seq.actIdx === 1) salto = true;
    m.seq = null; m.decision = null;
  }
  assert(salto, "Tres Pases o Nada salta directo a la definición (fútbol sin escalas)");

  // Asfixia en Salida: la recuperación puede nacer sobre el saque de meta (variante profunda)
  let asfixia = false;
  for (let i = 0; i < 200 && !asfixia; i++) {
    const m = makeMatch("ESP", "press", ["asfixia_salida"]);
    m.min = 30;
    E.startSequence(m, E.sequenceType("recuperacion"));
    if (m.feed.some(l => l.text.includes("SAQUE DE META"))) asfixia = true;
    m.seq = null; m.decision = null;
  }
  assert(asfixia, "Asfixia en Salida abre su variante profunda con relato propio");

  // Las secuencias reactivas NO cuentan contra el objetivo del generador
  {
    const m = makeMatch("ARG", "press", ["morder"]);
    m.min = 30;
    const antes = m._seqCount || 0;
    forcePlay(m, "circulacion", 1);
    assert((m._seqCount || 0) === antes + 1, "la cadena reactiva no infla _seqCount (solo la original cuenta)");
  }

  // Amplitud Máxima: el pool contra el Bloque rival suaviza la celda de la matriz
  {
    // Plumbing: el hook viaja al Match y se resuelve desde los ids del ctx
    const m0 = makeMatch("SWE", "posesion", ["amplitud"]);    // SWE = bloque curado
    assert(E.traitHooks(m0).poolMod?.[0]?.weights?.circulacion === 1.25, "el hook poolMod viaja al Match vía matchCtx.filo.rasgos");
    assert(Object.keys(E.traitHooks(makeMatch("SWE", "posesion", []))).length === 0, "sin rasgos no hay hooks");
    // Efecto: entre los arranques MÍOS, la circulación sale más seguido con el rasgo.
    // Muestra grande (3000 arranques mine por lado) para que la señal (~16%→~20%)
    // supere el ruido con holgura.
    const share = rasgos => {
      const m = makeMatch("SWE", "posesion", rasgos);
      m.min = 30;
      let mine = 0, circ = 0, guard = 0;
      while (mine < 3000 && guard++ < 60000) {
        m.seq = null; m.decision = null; m._seqCount = 0; m._lastSeqType = null;
        if (E.maybeStartSequence(m) && m.seq && m.seq.type.side === "mine") {
          mine++;
          if (m.seq.type.id === "circulacion") circ++;
        }
      }
      return circ / mine;
    };
    const con = share(["amplitud"]), sin = share([]);
    assert(con > sin, "Amplitud sube la circulación contra el Bloque (celda suavizada, no invertida)", `con=${(con * 100).toFixed(1)}% sin=${(sin * 100).toFixed(1)}%`);
  }
}

// ---------- T2: los 12 Intermediate — catálogo, gating y la regla del ajeno ----------
{
  assert(E.TRAITS.length === 36, "36 rasgos: el arco COMPLETO (12 Basic + 12 Int + 8 Adv + 4 Master)", E.TRAITS.length);
  const inters = E.TRAITS.filter(t => t.tier === "intermediate");
  assert(inters.length === 12, "12 Intermediate (3 por filosofía)", inters.length);
  for (const filo of ["press", "posesion", "contra", "bloque"]) {
    const own = E.traitsOf(filo, "intermediate");
    assert(own.length === 3 && new Set(own.map(t => t.rama)).size === 3, `${filo}: un intermediate por rama`);
  }
  const filoAristas = id => E.getPhilosophy(id).aristas;
  for (const t of inters) {
    // Las 4 condiciones del GDD §5: previo en SU rama, principio, nivel 3
    const prev = E.traitById(t.req.previo);
    assert(prev && prev.filo === t.filo && prev.rama === t.rama && prev.tier === "basic",
      "el previo es el básico de SU rama", `${t.id} ← ${t.req.previo}`);
    assert(t.req.nivel === 3 && t.req.principio?.min === 2, "gating uniforme: nivel 3 + principio 2", t.id);
    assert(E.aristaById(t.req.principio.id), "el principio requerido existe", t.id);
  }
  // LA REGLA DEL ARCO (tabla aprobada por el PO): toda filosofía paga al menos UN
  // principio AJENO en sus intermediate (cubrirse/expandirse cuesta pureza). En
  // Press/Posesión/Bloque el ajeno vive en la Respuesta; el Contra es la excepción
  // documentada — su Respuesta pide Solidez (que ES suya: aguantar para cazar) y su
  // ajeno (Elaboración) vive en la Expansión, abriendo el camino que La Invitación
  // (T3, Elaboración 3) continúa: el Contra aprende a tener la pelota por etapas.
  const esAjeno = t => !filoAristas(t.filo).includes(t.req.principio.id);
  for (const [id, ajeno] of [["caceria_letal", false], ["anticipar", true], ["arco_vista", false],
    ["tercer_hombre", false], ["cambio_frente", true], ["sitio_area", false],
    ["primer_pase", false], ["trampa_cerrada", false], ["superioridad", true],
    ["duenos_area", false], ["pelota_ensayada", true], ["plataforma", false]]) {
    assert(esAjeno(E.traitById(id)) === ajeno, `principio ${ajeno ? "AJENO" : "propio"} según la tabla aprobada`, id);
  }
  for (const filo of ["press", "posesion", "contra", "bloque"]) {
    assert(E.traitsOf(filo, "intermediate").some(esAjeno), `${filo} paga al menos un principio ajeno`);
  }
}

// ---------- T2: la cadena de compra básico → intermediate ----------
{
  const r = E.newRun("BRA");
  E.choosePhilosophy(r, "press");             // 1 PI
  E.buyTrait(r, "morder");                    // gasta el inicial
  r.aristas.presion = 2;                      // nivel 3 (2 pts) y Presión 2
  E.syncIdentityPI(r);                        // +2 PI (niveles 2 y 3)
  const reqs = E.traitReqs(r, E.traitById("caceria_letal"));
  assert(reqs.ok, "con previo + nivel 3 + Presión 2 + PI, Cacería Letal se abre", reqs.faltas.join(" · "));
  assert(E.buyTrait(r, "caceria_letal"), "la compra intermediate procede");
  // El ajeno de la rama Respuesta: sin Solidez no hay Anticipar aunque sobren PI
  E.buyTrait(r, "trampa_banda");
  r.aristas.verticalidad = 1; E.syncIdentityPI(r); // repone el PI (nivel 4) para aislar la falta de Solidez
  const anticipar = E.traitReqs(r, E.traitById("anticipar"));
  assert(!anticipar.ok && anticipar.faltas.some(x => x.includes("Solidez")), "Anticipar exige Solidez (AJENA): el candado la nombra", anticipar.faltas.join(" · "));
  r.aristas.solidez = 2;
  assert(E.traitReqs(r, E.traitById("anticipar")).ok, "con Solidez 2 el candado se abre (cubrirse costó pureza)");
}

// ---------- T3: Advanced y Master — catálogo, convergencias y la doctrina completa ----------
{
  const advs = E.TRAITS.filter(t => t.tier === "advanced");
  const masters = E.TRAITS.filter(t => t.tier === "master");
  assert(advs.length === 8 && masters.length === 4, "8 Advanced (2×filo) + 4 Master (1×filo)");
  for (const t of advs) {
    // Convergencia asimétrica: Int de rama líder + Básico de rama de apoyo, de ramas DISTINTAS
    const [a, b] = t.req.todos.map(id => E.traitById(id));
    assert(a && b && a.filo === t.filo && b.filo === t.filo, "convergencia dentro de la filosofía", t.id);
    assert(a.tier === "intermediate" && b.tier === "basic" && a.rama !== b.rama, "Int líder + Básico apoyo de ramas distintas", t.id);
    assert(t.req.nivel === 6, "Advanced pide nivel 6", t.id);
    const propio = E.getPhilosophy(t.filo).aristas.includes(t.req.principio.id);
    assert(t.req.principio.min === (propio ? 4 : 3), "principio a 4 (propio) o 3 (ajeno)", t.id);
  }
  for (const t of masters) {
    assert(t.req.nivel === 10, "Master pide Consolidada (nivel 10)", t.id);
    const basicos = t.req.todos.map(id => E.traitById(id));
    assert(basicos.length === 3 && new Set(basicos.map(x => x.rama)).size === 3 && basicos.every(x => x.tier === "basic" && x.filo === t.filo),
      "Master exige los 3 básicos: presencia en las TRES ramas", t.id);
    assert(t.req.alguno.length === 2 && t.req.alguno.every(id => E.traitById(id)?.tier === "advanced"), "Master exige un Advanced cualquiera", t.id);
    const propias = E.getPhilosophy(t.filo).aristas;
    assert(t.req.principios.length === 2 && t.req.principios.every(p => propias.includes(p.id) && p.min === 4),
      "Master exige AMBOS principios propios a 4", t.id);
  }
  // La cadena completa hasta el Master (camino mínimo: 6 PI + Consolidada)
  const r = E.newRun("BRA");
  E.choosePhilosophy(r, "press");
  r.aristas.presion = 5; r.aristas.verticalidad = 4; r.aristas.solidez = 3; // Consolidada (9 pts propios)
  E.syncIdentityPI(r); // nivel 10 → 10 PI en total
  for (const id of ["morder", "trampa_banda", "asfixia_salida", "caceria_letal", "asfixia_total"]) {
    assert(E.buyTrait(r, id), `la escalera compra ${id}`);
  }
  const reqs = E.traitReqs(r, E.traitById("robo_es_pase"));
  assert(reqs.ok, "con la doctrina completa el Master se abre", reqs.faltas.join(" · "));
  const antes = r.journal.length;
  assert(E.buyTrait(r, "robo_es_pase"), "el Master se compra");
  assert(r.journal.length === antes + 2 && r.journal[r.journal.length - 1].title.includes("PRENSA CONSAGRA"),
    "comprar un Master dispara la CONSAGRACIÓN de prensa (dos entradas)");
  // El camino costó 6 PI de 10: la escasez del Bible sobrevive al arco completo
  assert(r.identityPoints === 4, "el camino mínimo al Master cuesta 6 PI", r.identityPoints);
}

// ---------- T2: la migración F2 — el efecto profundo responde al RASGO, no a la etapa ----------
{
  // Plumbing: hasTrait lee el ctx del Match
  const mSin = makeMatch("MAR", "posesion", [], 2);            // Consolidada SIN el rasgo
  const mCon = makeMatch("MAR", "posesion", ["sitio_area"], 2);
  assert(!E.hasTrait(mSin, "sitio_area") && E.hasTrait(mCon, "sitio_area"), "hasTrait lee matchCtx.filo.rasgos");
  // El 4º compás de la sinfonía: Consolidada YA NO lo regala — lo compra Sitio al Área
  E.startSequence(mSin, E.sequenceType("sinfonia"));
  assert(!mSin.seq.plan, "Consolidada sin el rasgo: la sinfonía queda en 3 compases (la migración quitó el regalo)");
  mSin.seq = null; mSin.decision = null;
  E.startSequence(mCon, E.sequenceType("sinfonia"));
  assert(mCon.seq.plan && mCon.seq.plan.filter(k => k === "build").length === 4, "con Sitio al Área la sinfonía gana su 4º compás");
  mCon.seq = null; mCon.decision = null;
}

console.log(`\ntraits: ${checks} checks · fallos: ${fails}`);
console.log(fails ? "❌ traits con fallos" : "✅ traits OK");
process.exit(fails ? 1 : 0);
