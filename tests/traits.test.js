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

// Las filosofías cuyo árbol YA se rediseñó (grafo con `pos` y bifurcaciones).
// Las demás siguen con la grilla 3×3 del arco T1-T3 y sus reglas de forma.
const REDISENADAS = ["press", "posesion"];

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
  assert(E.traitById("presion_intensificada")?.filo === "press", "traitById encuentra por id");
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
  const t = E.buyTrait(r, "presion_intensificada");
  assert(t && t.id === "presion_intensificada" && r.identityPoints === 0, "comprar cobra el PI y devuelve la fila", r.identityPoints);
  assert(r.rasgos.press.includes("presion_intensificada") && r.journal.length === antes + 1, "el rasgo queda en la run y escribe el diario");
  assert(E.activeTraitIds(r).join() === "presion_intensificada" && E.activeTraits(r)[0].nombre === "Presión Intensificada", "activeTraits lee la filosofía activa");
  assert(E.buyTrait(r, "presion_intensificada") === null, "no se compra dos veces");
  assert(E.buyTrait(r, "pulmones") === null, "sin PI no hay compra");
  const reqs = E.traitReqs(r, E.traitById("pulmones"));
  assert(!reqs.ok && reqs.faltas.some(x => x.includes("Punto de Identidad")), "el candado nombra la falta en lenguaje de jugador", reqs.faltas.join(" · "));
  // filoCtx viaja con los rasgos activos (la frontera run→Match)
  assert(E.filoCtx(r).rasgos.includes("presion_intensificada"), "filoCtx lleva los rasgos al matchCtx");
  // Latencia (decisión PO #3): cambiar apaga, volver revive
  r.actionPending = true;
  E.changePhilosophy(r, "bloque");
  assert(E.activeTraitIds(r).length === 0, "con otra filosofía los rasgos comprados se APAGAN (latentes)");
  assert(r.rasgos.press.includes("presion_intensificada"), "…pero no se pierden");
  r.actionPending = true;
  E.changePhilosophy(r, "press");
  assert(E.activeTraitIds(r).includes("presion_intensificada"), "volver a la filosofía REVIVE sus rasgos");
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
    const m = makeMatch("ARG", "press", ["gegenpressing"]);
    m.min = 30;
    const feed = forcePlay(m, "circulacion", 1); // filtrado: la opción de riesgo
    if (feed.includes("MORDIDA")) mordida = true;
    if ((m._chainCount || 0) > E.MAX_CHAINS) chainBudgetOk = false;
  }
  assert(mordida, "Gegenpressing encadena la recuperación reactiva (el momento SE VE en el feed)");
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
    const m = makeMatch("ESP", "press", ["angriffpressing"]);
    m.min = 30;
    E.startSequence(m, E.sequenceType("recuperacion"));
    if (m.feed.some(l => l.text.includes("SAQUE DE META"))) asfixia = true;
    m.seq = null; m.decision = null;
  }
  assert(asfixia, "Angriffpressing abre su variante profunda con relato propio");

  // Las secuencias reactivas NO cuentan contra el objetivo del generador
  {
    const m = makeMatch("ARG", "press", ["gegenpressing"]);
    m.min = 30;
    const antes = m._seqCount || 0;
    forcePlay(m, "circulacion", 1);
    assert((m._seqCount || 0) === antes + 1, "la cadena reactiva no infla _seqCount (solo la original cuenta)");
  }

  // Osciladores: el pool contra el Bloque rival NEUTRALIZA la celda de la matriz
  {
    // Plumbing: el hook viaja al Match y se resuelve desde los ids del ctx
    const m0 = makeMatch("SWE", "posesion", ["osciladores"]);    // SWE = bloque curado
    assert(E.traitHooks(m0).poolMod?.[0]?.weights?.circulacion === 1.54, "el hook poolMod viaja al Match vía matchCtx.filo.rasgos");
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
    const con = share(["osciladores"]), sin = share([]);
    assert(con > sin, "Osciladores sube la circulación contra el Bloque (celda a tablas, no invertida)", `con=${(con * 100).toFixed(1)}% sin=${(sin * 100).toFixed(1)}%`);
  }
}

// ---------- T2: los 12 Intermediate — catálogo, gating y la regla del ajeno ----------
{
  assert(E.TRAITS.length === 51, "51 rasgos: 18 del Press + 15 de Posesión (rediseñados) + 9 × 2 por rediseñar", E.TRAITS.length);
  // Las reglas de forma de T2 valen para las filosofías que todavía NO se
  // rediseñaron. Las rediseñadas (Press, Posesión) tienen su propia sección más
  // abajo: son grafos con ramas que se bifurcan, y por lo tanto pueden tener más
  // de un intermediate por rama y convergencias por `alguno`.
  const inters = E.TRAITS.filter(t => t.tier === "intermediate" && !REDISENADAS.includes(t.filo));
  assert(inters.length === 6, "6 Intermediate (3 por filosofía sin rediseñar)", inters.length);
  for (const filo of ["contra", "bloque"]) {
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
  for (const [id, ajeno] of [["primer_pase", false], ["trampa_cerrada", false], ["superioridad", true],
    ["duenos_area", false], ["pelota_ensayada", true], ["plataforma", false]]) {
    assert(esAjeno(E.traitById(id)) === ajeno, `principio ${ajeno ? "AJENO" : "propio"} según la tabla aprobada`, id);
  }
  // Las rediseñadas pagan su ajeno donde su árbol lo pide (Press en la Respuesta,
  // Posesión en la Firma): eso lo verifica su propia sección, no esta regla T2.
  for (const filo of ["contra", "bloque"]) {
    assert(E.traitsOf(filo, "intermediate").some(esAjeno), `${filo} paga al menos un principio ajeno`);
  }
}

// ---------- T2: la cadena de compra básico → intermediate ----------
{
  const r = E.newRun("BRA");
  E.choosePhilosophy(r, "press");             // 1 PI
  E.buyTrait(r, "presion_intensificada");                    // gasta el inicial
  r.aristas.presion = 2;                      // nivel 3 (2 pts) y Presión 2
  E.syncIdentityPI(r);                        // +2 PI (niveles 2 y 3)
  const reqs = E.traitReqs(r, E.traitById("mittelfeldpressing"));
  assert(reqs.ok, "con previo + nivel 3 + Presión 2 + PI, Cacería Letal se abre", reqs.faltas.join(" · "));
  assert(E.buyTrait(r, "mittelfeldpressing"), "la compra intermediate procede");
  // El ajeno de la rama Respuesta: sin Solidez no hay Anticipar aunque sobren PI
  E.buyTrait(r, "pulmones");
  r.aristas.verticalidad = 1; E.syncIdentityPI(r); // repone el PI (nivel 4) para aislar la falta de Solidez
  const anticipar = E.traitReqs(r, E.traitById("vigilancia"));
  assert(!anticipar.ok && anticipar.faltas.some(x => x.includes("Solidez")), "Anticipar exige Solidez (AJENA): el candado la nombra", anticipar.faltas.join(" · "));
  r.aristas.solidez = 2;
  assert(E.traitReqs(r, E.traitById("vigilancia")).ok, "con Solidez 2 el candado se abre (cubrirse costó pureza)");
}

// ---------- T3: Advanced y Master — catálogo, convergencias y la doctrina completa ----------
{
  const advs = E.TRAITS.filter(t => t.tier === "advanced" && !REDISENADAS.includes(t.filo));
  const masters = E.TRAITS.filter(t => t.tier === "master" && !REDISENADAS.includes(t.filo));
  assert(advs.length === 4 && masters.length === 2, "4 Advanced (2×filo) + 2 Master (1×filo) en las filosofías sin rediseñar");
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
  for (const id of ["presion_intensificada", "mittelfeldpressing", "angriffpressing"]) {
    assert(E.buyTrait(r, id), `la escalera compra ${id}`);
  }
  const reqs = E.traitReqs(r, E.traitById("pressingfalle"));
  assert(reqs.ok, "con la doctrina completa el Master se abre", reqs.faltas.join(" · "));
  const antes = r.journal.length;
  assert(E.buyTrait(r, "pressingfalle"), "el Master se compra");
  assert(r.journal.length === antes + 2 && r.journal[r.journal.length - 1].title.includes("PRENSA CONSAGRA"),
    "comprar un Master dispara la CONSAGRACIÓN de prensa (dos entradas)");
  // El camino costó 6 PI de 10: la escasez del Bible sobrevive al arco completo
  assert(r.identityPoints === 6, "el camino mínimo al Master de Press cuesta 4 PI (sube por su rama)", r.identityPoints);
  // Pressingfalle CONVERGE (decisión PO 26-jul): se llega desde Angriffpressing o
  // desde Gegenpressing, cualquiera de los dos. Se comprueba por el otro camino.
  const r2 = E.newRun("BRA");
  E.choosePhilosophy(r2, "press");
  r2.aristas.presion = 5; r2.aristas.verticalidad = 4;
  E.syncIdentityPI(r2);
  for (const id of ["presion_intensificada", "mittelfeldpressing", "gegenpressing"]) E.buyTrait(r2, id);
  assert(E.traitReqs(r2, E.traitById("pressingfalle")).ok,
    "al Master del Press también se llega por Gegenpressing (la convergencia)",
    E.traitReqs(r2, E.traitById("pressingfalle")).faltas.join(" · "));

  // La consagración se narra UNA vez por filosofía, no una por Master (Posesión tiene 4).
  const rp = E.newRun("BRA");
  E.choosePhilosophy(rp, "posesion");
  rp.aristas.elaboracion = 5; rp.aristas.presion = 4; rp.aristas.directo = 3;  // Osciladores pide el ajeno
  E.syncIdentityPI(rp);
  for (const id of ["buen_pie", "tercer_hombre", "pitagoricos", "maquina_colectiva"]) {
    assert(E.buyTrait(rp, id), `la escalera de Posesión compra ${id}`);
  }
  assert(rp.journal.some(j => j.title.includes("PRENSA CONSAGRA")), "el primer Master consagra");
  const antes2 = rp.journal.length;
  for (const id of ["osciladores", "hombre_libre"]) E.buyTrait(rp, id);
  assert(E.activeTraitIds(rp).includes("hombre_libre"), "el segundo Master se compra igual");
  assert(!rp.journal.slice(antes2).some(j => j.title.includes("PRENSA CONSAGRA")),
    "el SEGUNDO Master ya no vuelve a consagrar: el hito se narra una sola vez");
}

// ---------- T2: la migración F2 — el efecto profundo responde al RASGO, no a la etapa ----------
{
  // Plumbing: hasTrait lee el ctx del Match
  const mSin = makeMatch("MAR", "posesion", [], 2);            // Consolidada SIN el rasgo
  const mCon = makeMatch("MAR", "posesion", ["desesperantes"], 2);
  assert(!E.hasTrait(mSin, "desesperantes") && E.hasTrait(mCon, "desesperantes"), "hasTrait lee matchCtx.filo.rasgos");
  // El 4º compás de la sinfonía: Consolidada YA NO lo regala — lo compra Desesperantes
  E.startSequence(mSin, E.sequenceType("sinfonia"));
  assert(!mSin.seq.plan, "Consolidada sin el rasgo: la sinfonía queda en 3 compases (la migración quitó el regalo)");
  mSin.seq = null; mSin.decision = null;
  E.startSequence(mCon, E.sequenceType("sinfonia"));
  assert(mCon.seq.plan && mCon.seq.plan.filter(k => k === "build").length === 4, "con Desesperantes la sinfonía gana su 4º compás");
  mCon.seq = null; mCon.decision = null;
}

// ---------- Los árboles REDISEÑADOS (Press 25-jul · Posesión 26-jul) ----------
// Un árbol rediseñado es un GRAFO: cada nodo trae su posición en la cancha, se
// encadena por `previo` dentro de SU rama y puede bifurcarse. La única forma de
// juntar dos caminos es `alguno` (la convergencia), nunca saltar de rama.
{
  const FORMA = {
    press:    { total: 18, firma: 5, respuesta: 4, expansion: 9, deep: "gegenpressing" },
    posesion: { total: 15, firma: 6, respuesta: 4, expansion: 5, deep: "desesperantes" },
  };
  const NIVEL = { basic: 1, intermediate: 3, advanced: 6, master: 10 };
  const ORDEN = ["basic", "intermediate", "advanced", "master"];

  for (const filo of REDISENADAS) {
    const arbol = E.traitsOf(filo);
    const f = FORMA[filo];
    assert(arbol.length === f.total, `${filo}: ${f.total} rasgos`, arbol.length);
    const porRama = r => arbol.filter(t => t.rama === r).length;
    assert(porRama("firma") === f.firma && porRama("respuesta") === f.respuesta && porRama("expansion") === f.expansion,
      `${filo}: el reparto por rama es el del rediseño`,
      `${porRama("firma")}/${porRama("respuesta")}/${porRama("expansion")}`);

    const propias = E.getPhilosophy(filo).aristas;
    const vistos = new Set();
    for (const t of arbol) {
      // TODO nodo se dibuja: la pizarra de un árbol rediseñado es un grafo.
      assert(t.pos && Number.isFinite(t.pos.x) && Number.isFinite(t.pos.y), "el rasgo declara su posición en la cancha", t.id);
      const clave = `${t.pos.x}|${t.pos.y}`;
      assert(!vistos.has(clave), "dos rasgos nunca comparten posición", t.id);
      vistos.add(clave);
      assert(t.req.nivel === NIVEL[t.tier], `nivel ${NIVEL[t.tier]} para un ${t.tier}`, t.id);
      assert(!t.req.todos, "los árboles rediseñados no usan `todos` (se encadenan, no convergen por AND)", t.id);

      // Padres: de SU misma rama y del tier inmediatamente anterior. El árbol se
      // bifurca hacia adelante y a veces vuelve a juntarse, pero jamás cruza de rama
      // ni saltea escalones.
      const padres = [...(t.req.previo ? [t.req.previo] : []), ...(t.req.alguno || [])];
      if (t.tier === "basic") {
        assert(!padres.length, "los básicos no tienen previo: abren su rama", t.id);
      } else {
        assert(padres.length >= 1, "todo nodo no básico cuelga de alguien", t.id);
        for (const pid of padres) {
          const prev = E.traitById(pid);
          assert(prev && prev.filo === filo && prev.rama === t.rama, "el padre es de SU rama", `${t.id} <- ${pid}`);
          assert(ORDEN.indexOf(prev.tier) === ORDEN.indexOf(t.tier) - 1, "el padre es del tier inmediatamente anterior", `${t.id} <- ${pid}`);
        }
      }

      // Principios: los Master piden dos propios; el resto uno. Propio a 4 / ajeno a 3
      // en avanzados — la misma vara de pureza del arco.
      const reqs = [...(t.req.principio ? [t.req.principio] : []), ...(t.req.principios || [])];
      assert(reqs.length === (t.tier === "master" ? 2 : t.tier === "basic" ? 0 : 1),
        "cantidad de principios exigidos según el tier", t.id);
      for (const pr of reqs) assert(E.aristaById(pr.id), "el principio requerido existe", `${t.id}/${pr.id}`);
      if (t.tier === "advanced") {
        const propio = propias.includes(t.req.principio.id);
        assert(t.req.principio.min === (propio ? 4 : 3), "avanzado: principio propio a 4 / ajeno a 3", t.id);
      }
      if (t.tier === "master") {
        // Un Master pide sus DOS principios a 4 — la vara completa. Al menos uno es
        // propio; el otro puede ser AJENO cuando la rama entera se construyó pagando
        // pureza (Elasticidad nace de la Respuesta del Press, que vive de Solidez;
        // Fríos congela, y congelar es elaborar). El ajeno de un Master se paga
        // entero: en la cima no hay descuento.
        assert(t.req.principios.every(pr => pr.min === 4), "Master: los dos principios a 4", t.id);
        assert(t.req.principios.some(pr => propias.includes(pr.id)), "Master: al menos un principio PROPIO", t.id);
      }
    }

    // Toda filosofía paga al menos un principio AJENO en algún punto del árbol
    // (el costo de cubrirse). Press lo paga en la Respuesta; Posesión, en la Firma
    // —Osciladores pide Directo— porque ahí migró su anti-bloque: la segunda
    // excepción documentada del arco, junto al Contra.
    const ajenos = arbol.filter(t => t.req.principio && !propias.includes(t.req.principio.id));
    assert(ajenos.length >= 1, `${filo} paga al menos un principio AJENO`, ajenos.map(t => t.id).join());

    // El efecto profundo (migración F2) sigue teniendo dueño tras el rediseño.
    assert(E.DEEP_TRAIT[filo]?.id === f.deep, `deepXxx de ${filo} vive en ${f.deep}`, E.DEEP_TRAIT[filo]?.id);
  }

  // Las bifurcaciones y convergencias, nombradas una a una.
  const hijosDe = id => E.TRAITS.filter(t => (t.req.previo === id) || (t.req.alguno || []).includes(id))
    .map(t => t.id).sort().join();
  assert(hijosDe("mittelfeldpressing") === "angriffpressing,gegenpressing", "Mittelfeldpressing abre la bifurcación alemana", hijosDe("mittelfeldpressing"));
  assert(hijosDe("angriffpressing") === "pressingfalle" && hijosDe("gegenpressing") === "pressingfalle",
    "los DOS caminos de la Firma del Press llegan al mismo Master");
  assert(hijosDe("directo") === "contragolpistas,egoistas", "Directo abre las dos ideas opuestas de la Expansión", hijosDe("directo"));
  assert(hijosDe("tercer_hombre") === "osciladores,pitagoricos", "El Tercer Hombre abre la bifurcación de la Firma de Posesión", hijosDe("tercer_hombre"));
  assert(hijosDe("profundos") === "desesperantes,sorpresivos", "Profundos abre las dos maneras de romper una línea", hijosDe("profundos"));
  assert(hijosDe("sorpresivos") === "polivalentes" && hijosDe("desesperantes") === "polivalentes",
    "las dos maneras de romper una línea vuelven a juntarse en Polivalentes");

  // LA NEUTRALIZACIÓN de Posesión sobrevive al rediseño: la celda posesion|bloque
  // (circulación 0.65 · pelotazo 1.30) vuelve a tablas, sin invertirse.
  const osc = E.traitById("osciladores").hooks.poolMod;
  assert(osc.vsFilo === "bloque", "Osciladores neutraliza SOLO contra el Bloque");
  assert(Math.abs(0.65 * osc.weights.circulacion - 1) < 0.03, "la circulación vuelve a ~1.00 contra el bloque", (0.65 * osc.weights.circulacion).toFixed(3));
  assert(Math.abs(1.30 * osc.weights.pelotazo - 1) < 0.03, "el pelotazo forzado vuelve a ~1.00", (1.30 * osc.weights.pelotazo).toFixed(3));
  assert(osc.weights.circulacion * 0.65 < 1.05, "empareja el matchup, NO lo invierte (regla del arco)");
}

// ---------- Las 3 mecanicas del arbol de Posesion (26-jul-2026) ----------
// Eran deuda declarada del rediseno: el catalogo las nombraba y el Match no las leia.
// Aca se fija que OCURREN de verdad en un partido, no solo que el hook existe.
{
  // --- LA TRAMPA: el Retroceso de posesion es una OPCION NUEVA del acto ---
  {
    const sin = makeMatch("ARG", "posesion", []);
    E.startSequence(sin, E.sequenceType("circulacion"));
    assert(sin.decision.options.length === 2, "sin el rasgo, la construccion ofrece 2 opciones", sin.decision.options.length);
    assert(!sin.decision.options.some(o => o.key === "atras"), "sin La Trampa no existe el retroceso");

    const con = makeMatch("ARG", "posesion", ["la_trampa"]);
    E.startSequence(con, E.sequenceType("circulacion"));
    assert(con.decision.options.length === 3, "con La Trampa la construccion ofrece 3", con.decision.options.length);
    const back = con.decision.options.find(o => o.key === "atras");
    assert(back && /Retroceso/.test(back.label), "la opcion nueva se llama por su nombre", back?.label);

    // Se usa UNA vez por secuencia: tras retroceder, la opcion ya no vuelve a aparecer.
    let usos = 0, reaparecio = false, guard = 0;
    while (con.seq && guard++ < 25) {
      if (!con.decision) { con.resolveSequenceAct(null); continue; }
      if (con.decision.id !== "sequence") break;
      const hay = con.decision.options.find(o => o.key === "atras");
      if (hay && usos >= 1) reaparecio = true;
      if (hay) { usos++; con.resolveSequenceAct("atras"); }
      else con.resolveSequenceAct("seguro");
    }
    assert(usos === 1, "el retroceso se ofrece una sola vez por secuencia", usos);
    assert(!reaparecio, "gastado el recurso, la opcion desaparece del acto");
  }

  // El retroceso NO avanza la jugada (paga un toque) pero sube el perfil del ataque.
  {
    let vistoTexto = false, subioBonus = false, guard = 0;
    while (guard++ < 200 && !(vistoTexto && subioBonus)) {
      const m = makeMatch("ARG", "posesion", ["la_trampa"]);
      m.min = 30;
      E.startSequence(m, E.sequenceType("circulacion"));
      const actAntes = m.seq.actIdx, bonusAntes = m.seq.bonus;
      m.resolveSequenceAct("atras");
      if (!m.seq) continue;                      // se la robaron: el fallo abre contra (tiene costo)
      if (m.seq.actIdx === actAntes) {
        if (m.seq.bonus > bonusAntes) subioBonus = true;
        if (m.feed.some(f => /vuelve a armar/.test(f.text))) vistoTexto = true;
      }
    }
    assert(subioBonus, "el retroceso deja el ataque mejor perfilado sin avanzar el acto");
    assert(vistoTexto, "el momento del retroceso SE VE en el relato");
  }

  // Y su costo es real: perder el pase hacia atras con el equipo adelantado abre contra.
  {
    let perdida = false;
    for (let i = 0; i < 400 && !perdida; i++) {
      const m = makeMatch("ARG", "posesion", ["la_trampa"]);
      m.min = 30;
      E.startSequence(m, E.sequenceType("circulacion"));
      m.resolveSequenceAct("atras");
      if (m.feed.some(f => /roban el pase hacia atr/.test(f.text))) perdida = true;
    }
    assert(perdida, "retroceder tiene costo: el pase se juega de verdad y se puede perder");
  }

  // --- LA MAQUINA COLECTIVA: la pelota servida tras la circulacion larga ---
  {
    let servida = false, empujada = false;
    for (let i = 0; i < 400 && !(servida && empujada); i++) {
      const m = makeMatch("ARG", "posesion", ["maquina_colectiva"]);
      m.min = 30;
      const feed = forcePlay(m, "circulacion", 0);   // pase seguro: todos los compases suenan
      if (/solo hay que empujarla/.test(feed)) servida = true;
      if (/Solo tuvo que empujarla/.test(feed)) empujada = true;
    }
    assert(servida, "La Maquina Colectiva deja la pelota servida (el momento SE VE)");
    assert(empujada, "y cuando entra, el relato del gol lo reconoce");

    // Sin el rasgo, jamas ocurre.
    let nunca = true;
    for (let i = 0; i < 200 && nunca; i++) {
      const m = makeMatch("ARG", "posesion", []);
      m.min = 30;
      if (/empujarla/.test(forcePlay(m, "circulacion", 0))) nunca = false;
    }
    assert(nunca, "sin el Master la pelota nunca queda servida");
  }

  // --- LA FRONTERA: la contra tras mi perdida muere en offside ---
  {
    let anulada = false, guard = 0;
    while (guard++ < 600 && !anulada) {
      const m = makeMatch("ARG", "posesion", ["la_frontera"]);
      m.min = 30;
      const feed = forcePlay(m, "circulacion", 1);   // filtrado: la perdida arriesgada abre contra
      if (/sale de CONTRA/.test(feed) && /offside/.test(feed)) anulada = true;
    }
    assert(anulada, "La Frontera anula la contra rival con la trampa del offside");

    // El otro hook del MISMO rasgo sigue vivo: el pelotazo ambiente a la espalda.
    const t = E.traitById("la_frontera");
    assert(t.hooks.offsideTrap && t.hooks.breakawayGuard,
      "La Frontera cubre los DOS canales del balon a la espalda (contra + pelotazo ambiente)");
  }

  // --- Ninguna de las tres sigue siendo deuda ---
  for (const [id, hook] of [["maquina_colectiva", "tapIn"], ["la_trampa", "backPass"], ["la_frontera", "offsideTrap"]]) {
    assert(E.traitById(id).hooks[hook], `${id} declara ${hook}`);
  }
}

// ---------- Fatiga del rival + Congelar (26-jul-2026) ----------
{
  // --- El rival se cansa DENTRO del partido (antes nacia al 100% y no bajaba) ---
  {
    const m = makeMatch("ARG", "posesion", []);
    const antes = m.oppLineup.map(p => p.energia);
    assert(antes.every(e => e === 100), "el once rival arranca al 100%");
    for (let g = 0; !m.finished && g < 400; g++) { m.decision = null; m.seq = null; m.tick(); }
    const fin = m.oppLineup.filter(p => !p.expulsado && !p.lesionado).map(p => p.energia);
    assert(fin.every(e => e < 100), "tras los 90 minutos el rival YA no esta fresco", fin[0]);
    assert(fin.every(e => e > 40 && e < 70), "termina cerca de 58: el mismo dial que paga mi equipo", fin[0]);
  }

  // --- El Rondo acelera ese drenaje (y es lo UNICO que hace hoy en el motor) ---
  {
    const drena = rasgos => {
      const m = makeMatch("ARG", "posesion", rasgos);
      for (let g = 0; !m.finished && g < 400; g++) { m.decision = null; m.seq = null; m.tick(); }
      const vivos = m.oppLineup.filter(p => !p.expulsado && !p.lesionado);
      return vivos.reduce((a, p) => a + p.energia, 0) / Math.max(1, vivos.length);
    };
    const sin = drena([]), con = drena(["el_rondo"]);
    assert(con < sin, "El Rondo deja al rival mas gastado al final", `sin=${sin.toFixed(1)} con=${con.toFixed(1)}`);
  }

  // --- La fatiga rival llega a sus duelos por el MISMO cano que la mia (effStat) ---
  {
    const m = makeMatch("ARG", "posesion", []);
    const fresco = m.powers().opp.def;
    for (const p of m.oppLineup) p.energia = 20;      // rival fundido
    const fundido = m.powers().opp.def;
    assert(fundido < fresco, "un rival sin piernas defiende peor (energyMult, sin canaria nueva)",
      `${fresco.toFixed(3)} -> ${fundido.toFixed(3)}`);
  }

  // --- CONGELAR: solo desde el minuto 70 y sin ir perdiendo ---
  {
    const conFrios = (min, gMy, gOpp) => {
      const m = makeMatch("ARG", "press", ["frios"]);
      m.min = min; m.gMy = gMy; m.gOpp = gOpp;
      E.startSequence(m, E.sequenceType("circulacion"));
      let guard = 0;
      while (m.seq && guard++ < 20) {
        if (!m.decision) { m.resolveSequenceAct(null); continue; }
        const opts = m.decision.options.map(o => o.key);
        if (opts.includes("rematar")) return opts;    // llegamos al desenlace
        m.resolveSequenceAct("seguro");
      }
      return null;
    };
    assert(conFrios(75, 1, 0)?.includes("congelar"), "ganando en el minuto 75 se puede congelar");
    assert(conFrios(75, 1, 1)?.includes("congelar"), "empatando en el tramo final tambien (decision PO)");
    assert(!conFrios(75, 0, 1)?.includes("congelar"), "perdiendo NO se congela");
    assert(!conFrios(40, 1, 0)?.includes("congelar"), "ganando temprano tampoco: es un recurso de cierre");
    const sinRasgo = (() => {
      const m = makeMatch("ARG", "press", []);
      m.min = 80; m.gMy = 1;
      E.startSequence(m, E.sequenceType("circulacion"));
      let guard = 0;
      while (m.seq && guard++ < 20) {
        if (!m.decision) { m.resolveSequenceAct(null); continue; }
        const opts = m.decision.options.map(o => o.key);
        if (opts.includes("rematar")) return opts;
        m.resolveSequenceAct("seguro");
      }
      return null;
    })();
    assert(sinRasgo && !sinRasgo.includes("congelar"), "sin Frios la opcion no existe");
  }

  // --- Congelar CAMBIA mi ocasion por la del rival: le descuenta una llegada ---
  {
    let visto = false, guard = 0;
    while (guard++ < 60 && !visto) {
      const m = makeMatch("ARG", "press", ["frios"]);
      m.min = 75; m.gMy = 1;
      E.maybeStartSequence(m); m.seq = null; m.decision = null;   // fuerza el plan del partido
      E.startSequence(m, E.sequenceType("circulacion"));
      let steps = 0;
      while (m.seq && steps++ < 20) {
        if (!m.decision) { m.resolveSequenceAct(null); continue; }
        const opts = m.decision.options.map(o => o.key);
        if (opts.includes("congelar")) {
          const target = m._seqPlan.target;
          m.resolveSequenceAct("congelar");
          assert(m._frozen === 1, "congelar deja el credito anotado", m._frozen);
          assert(!m.seq, "la jugada muere sin remate: se resigno el ataque");
          assert(m.feed.some(f => /reloj/.test(f.text)), "el momento SE VE en el relato");
          // y la proxima llegada RIVAL se descuenta del objetivo del partido
          // El generador corta al alcanzar el objetivo del partido: se reinicia el
          // contador en cada vuelta para que siga sorteando lados hasta que salga "opp".
          let g2 = 0;
          while (m._frozen > 0 && g2++ < 400) { m.seq = null; m.decision = null; m._seqCount = 0; E.maybeStartSequence(m); }
          assert(m._frozen === 0, "el credito se consume contra una secuencia rival", m._frozen);
          assert(m._seqPlan.target < target, "la llegada rival se PIERDE, no se pospone",
            `${target} -> ${m._seqPlan.target}`);
          visto = true;
          break;
        }
        m.resolveSequenceAct("seguro");
      }
    }
    assert(visto, "el camino de congelar se ejercita de punta a punta");
  }
}

console.log(`\ntraits: ${checks} checks · fallos: ${fails}`);
console.log(fails ? "❌ traits con fallos" : "✅ traits OK");
process.exit(fails ? 1 : 0);
