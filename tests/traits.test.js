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

// LAS CUATRO filosofías están rediseñadas (Press 25-jul · Posesión 26-jul · Bloque y
// Contra 30-jul): todos los árboles son GRAFOS con `pos` y bifurcaciones. La grilla
// 3×3 del arco T1-T3 quedó sin usuarios — sus reglas de forma murieron con ella.
const REDISENADAS = ["press", "posesion", "bloque", "contra"];

// ---------- catálogo ----------
{
  const basics = E.TRAITS.filter(t => t.tier === "basic");
  // 13 y no 12: el rediseño del Bloque (30-jul-2026) abre su Firma con DOS básicos
  // —compactar por dentro y poblar la zona— que convergen en el Área Blindada.
  assert(basics.length === 13, "13 rasgos Basic (3 por filosofía; 4 en el Bloque)", basics.length);
  assert(new Set(E.TRAITS.map(t => t.id)).size === E.TRAITS.length, "ids únicos en el catálogo");
  for (const filo of ["press", "posesion", "contra", "bloque"]) {
    const own = E.traitsOf(filo, "basic");
    assert(own.length === (filo === "bloque" ? 4 : 3), `${filo} tiene sus básicos`, own.length);
    // Regla Firma · Respuesta · Expansión: SIEMPRE hay un básico que abre cada rama
    assert(new Set(own.map(t => t.rama)).size === 3, `${filo}: las tres ramas nacen de un básico`, own.map(t => t.rama).join(","));
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

// ---------- PI: el inicial y la escalera del Director Técnico ----------
{
  const r = E.newRun("BRA");
  assert(r.identityPoints === 0 && Object.keys(r.rasgos).length === 0, "la run nace sin PI ni rasgos");
  E.choosePhilosophy(r, "press");
  assert(r.identityPoints === 1 && r.dtNivel === 1, "elegir filosofía = nivel 1 del DT = 1 PI inmediato (flujo de inicio)", r.identityPoints);
  // El menú YA NO imprime PI: subir de nivel una filosofía sí, vía el DT
  r.actionPending = true;
  E.applyDayAction(r, "plan_press");
  assert(r.identityPoints === 1, "el Plan de Partido no regala PI: la progresión es de cancha", r.identityPoints);
  E.applyFiloXp(r, { filoXp: { press: E.FILO_LEVELS[1].min } });   // press a nivel 2
  assert(r.identityPoints === 2 && r.dtNivel === 2, "subir una filosofía paga XP al DT y su nivel imprime 1 PI", `${r.dtNivel}/${r.identityPoints}`);
  // Varios niveles de golpe (partidazo + eventos): se acreditan TODOS
  E.applyFiloXp(r, { filoXp: { press: E.FILO_LEVELS[5].min } });
  assert(E.filoLevel(r) === 5 && r.identityPoints > 2, "niveles múltiples acreditan de a varios", r.identityPoints);
}

// ---------- especializar rinde más que repartirse (la tesis del GDD) ----------
{
  const foco = E.newRun("BRA"); E.choosePhilosophy(foco, "press");
  E.applyFiloXp(foco, { filoXp: { press: E.FILO_LEVELS[9].min } });     // una idea al tope
  const disperso = E.newRun("BRA"); E.choosePhilosophy(disperso, "press");
  E.applyFiloXp(disperso, { filoXp: {                                   // la misma XP repartida
    press: E.FILO_LEVELS[9].min / 4, posesion: E.FILO_LEVELS[9].min / 4,
    contra: E.FILO_LEVELS[9].min / 4, bloque: E.FILO_LEVELS[9].min / 4 } });
  assert(foco.dtXp > disperso.dtXp, "la misma XP concentrada paga MÁS al DT que repartida en cuatro",
    `${foco.dtXp} vs ${disperso.dtXp}`);
}

// ---------- compra: sin latencia, las builds híbridas juegan ----------
{
  const r = E.newRun("BRA");
  E.choosePhilosophy(r, "press");           // 1 PI
  assert(E.buyTrait(r, "no_existe") === null, "un id basura no se puede comprar");
  const antes = r.journal.length;
  const t = E.buyTrait(r, "presion_intensificada");
  assert(t && t.id === "presion_intensificada" && r.identityPoints === 0, "comprar cobra el PI y devuelve la fila", r.identityPoints);
  assert(r.rasgos.press.includes("presion_intensificada") && r.journal.length === antes + 1, "el rasgo queda en la run y escribe el diario");
  assert(E.activeTraitIds(r).join() === "presion_intensificada" && E.activeTraits(r)[0].nombre === "Presión Intensificada", "activeTraits lee lo comprado");
  assert(E.buyTrait(r, "presion_intensificada") === null, "no se compra dos veces");
  assert(E.buyTrait(r, "pulmones") === null, "sin PI no hay compra");
  const reqs = E.traitReqs(r, E.traitById("pulmones"));
  assert(!reqs.ok && reqs.faltas.some(x => x.includes("Punto de Identidad")), "el candado nombra la falta en lenguaje de jugador", reqs.faltas.join(" · "));
  assert(!reqs.faltas.some(x => x.includes("Principio") || x.includes("Presión 2")), "los Principios mínimos MURIERON: no quedan en las faltas", reqs.faltas.join(" · "));
  // filoCtx viaja con los rasgos activos (la frontera run→Match)
  assert(E.filoCtx(r).rasgos.includes("presion_intensificada"), "filoCtx lleva los rasgos al matchCtx");
  // HÍBRIDO (decisión PO 28-jul): un rasgo de OTRA filosofía se compra con su propio nivel…
  r.identityPoints = 1;
  const otro = E.buyTrait(r, "buen_pie");        // básico de Posesión, nivel 1
  assert(otro && r.rasgos.posesion.includes("buen_pie"), "un básico de otra filosofía se compra: la build híbrida existe");
  // …y NO se apaga al cambiar de identidad: si lo compraste, juega
  r.actionPending = true;
  E.changePhilosophy(r, "bloque");
  const activos = E.activeTraitIds(r);
  assert(activos.includes("presion_intensificada") && activos.includes("buen_pie"), "se acabó la latencia: todos los comprados siguen activos");
  assert(E.filoCtx(r).rasgos.length === 2, "el Match recibe los dos, sea cual sea la identidad que se juega");
}

// ---------- el nivel se mide en LA FILOSOFÍA DEL RASGO ----------
{
  const r = E.newRun("BRA");
  E.choosePhilosophy(r, "press");
  r.identityPoints = 5;
  E.buyTrait(r, "presion_intensificada");
  const mitte = E.traitById("mittelfeldpressing");   // intermedio del press: nivel 3
  assert(!E.traitReqs(r, mitte).ok, "en nivel 1 el intermedio está bloqueado");
  r.filoXp.posesion = E.FILO_LEVELS[9].min;          // subir OTRA filosofía no abre esta rama
  assert(!E.traitReqs(r, mitte).ok, "el nivel de otra idea no desbloquea la propia");
  r.filoXp.press = E.FILO_LEVELS[2].min;             // press nivel 3
  assert(E.traitReqs(r, mitte).ok, "con SU filosofía en nivel 3, el intermedio se abre");
  const falta = E.traitReqs(E.newRun("BRA"), mitte).faltas.join(" · ");
  assert(falta.includes("High Press nivel 3"), "la falta nombra la filosofía y su nivel", falta);
}

// ---------- el árbol para la pantalla ----------
{
  const r = E.newRun("BRA");
  E.choosePhilosophy(r, "contra");
  const tree = E.traitTree(r);
  assert(tree.length === 16, "el árbol del contra trae su rediseño completo: 6+5+5", tree.length);
  const buyables = tree.filter(t => t.buyable);
  assert(buyables.length === 3 && buyables.every(t => t.tier === "basic"), "con 1 PI solo los 3 básicos son comprables (el 1-de-3 del inicio)");
  assert(tree.filter(t => t.tier === "intermediate").every(t => !t.buyable && t.faltas.length >= 2), "los intermediate nacen con candado múltiple (previo + nivel)");
  E.buyTrait(r, "primer_pase");
  const tree2 = E.traitTree(r);
  assert(tree2.find(t => t.id === "primer_pase").owned, "el comprado figura owned");
  assert(tree2.filter(t => !t.owned).every(t => !t.buyable && t.faltas.length), "sin PI el resto queda con candado y faltas legibles");
  // El árbol de CUALQUIER filosofía se puede consultar (la pizarra las navega)
  const ajeno = E.traitTree(r, "bloque");
  assert(ajeno.length && ajeno.every(t => t.filo === "bloque"), "traitTree(run, filoId) devuelve el árbol pedido");
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

  // Contragolpe Letal (Bloque, Master): el repliegue contenido convierte en transición
  // mía — es el chainOnContain que antes traía Tender la Trampa.
  let trampa = false;
  for (let i = 0; i < 300 && !trampa; i++) {
    const m = makeMatch("MAR", "bloque", ["contragolpe_letal"]);
    m.min = 30;
    if (forcePlay(m, "repliegue", 0).includes("¡CONTRAATAQUE!")) trampa = true;
  }
  assert(trampa, "el repliegue contenido convierte en contra (def→of comprable)");

  // Atentos: el duelo perdido del pelotazo recupera la segunda pelota (heredó el hook
  // de Segunda Jugada en el rediseño del Bloque: no conceder el rebote es quedárselo)
  let segunda = false;
  for (let i = 0; i < 300 && !segunda; i++) {
    const m = makeMatch("ARG", "bloque", ["atentos"]);
    m.min = 30;
    if (forcePlay(m, "pelotazo", 0).includes("El rechace del duelo cae al pie")) segunda = true;
  }
  assert(segunda, "Atentos caza el rechace y vuelve a lanzar");

  // Ataque Relámpago: la transición puede NACER en el desenlace (actIdx saltado)
  let salto = false;
  for (let i = 0; i < 200 && !salto; i++) {
    const m = makeMatch("MAR", "contra", ["ataque_relampago"]);
    m.min = 30;
    E.startSequence(m, E.sequenceType("transicion"));
    if (m.seq && m.seq.actIdx === 1) salto = true;
    m.seq = null; m.decision = null;
  }
  assert(salto, "Tres Pases o Nada salta directo a la definición (fútbol sin escalas)");

  // Asfixia en Salida: la recuperación puede nacer sobre el saque de meta (variante profunda)
  // GATE TERRITORIAL (sprint del Territorio): saltar sobre el saque de meta rival exige
  // jugar con la línea adelantada. Con el bloque medio, este rasgo no tiene dónde existir.
  const asfixiaCon = alt => {
    for (let i = 0; i < 300; i++) {
      const m = makeMatch("ESP", "press", ["angriffpressing"]);
      m.min = 30; m.my.altura = alt;
      E.startSequence(m, E.sequenceType("recuperacion"));
      if (m.feed.some(l => l.text.includes("SAQUE DE META"))) return true;
    }
    return false;
  };
  assert(asfixiaCon(5), "Angriffpressing abre su variante profunda con relato propio (con bloque alto)");
  assert(!asfixiaCon(2), "y con el bloque replegado no existe: no se presiona el saque de meta desde el propio área");

  // Las secuencias reactivas NO cuentan contra el objetivo del generador
  {
    const m = makeMatch("ARG", "press", ["gegenpressing"]);
    m.min = 30;
    const antes = m._seqCount || 0;
    forcePlay(m, "circulacion", 1);
    assert((m._seqCount || 0) === antes + 1, "la cadena reactiva no infla _seqCount (solo la original cuenta)");
  }

  // Osciladores: el pool contra el PRESS rival NEUTRALIZA la celda de la matriz
  // (era contra el Bloque; el ciclo dio vuelta ese cruce — ver el bloque del catálogo)
  {
    // Plumbing: el hook viaja al Match y se resuelve desde los ids del ctx
    const m0 = makeMatch("GER", "posesion", ["osciladores"]);    // GER = press curado
    assert(E.traitHooks(m0).poolMod?.[0]?.weights?.circulacion === E.traitById("osciladores").hooks.poolMod.weights.circulacion,
      "el hook poolMod viaja al Match vía matchCtx.filo.rasgos");
    assert(Object.keys(E.traitHooks(makeMatch("GER", "posesion", []))).length === 0, "sin rasgos no hay hooks");
    // Efecto: entre los arranques MÍOS, la circulación sale más seguido con el rasgo.
    // Muestra grande (3000 arranques mine por lado) para que la señal supere el ruido.
    const share = rasgos => {
      const m = makeMatch("GER", "posesion", rasgos);
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
    assert(con > sin, "Osciladores sube la circulación contra el Press (celda a tablas, no invertida)", `con=${(con * 100).toFixed(1)}% sin=${(sin * 100).toFixed(1)}%`);
  }
}

// ---------- El catálogo entero, ya con las 4 filosofías rediseñadas ----------
{
  assert(E.TRAITS.length === 64, "64 rasgos: 18 Press + 15 Posesión + 15 Bloque + 16 Contra", E.TRAITS.length);
  assert(E.TRAITS.every(t => REDISENADAS.includes(t.filo)),
    "no quedan filosofías con el árbol viejo: las cuatro son grafos");
  assert(E.TRAITS.every(t => t.pos), "y por lo tanto TODO rasgo del juego declara su posición en la cancha");
  assert(E.TRAITS.every(t => t.req.principio === undefined && t.req.principios === undefined),
    "ningún rasgo pide ya Principios (murieron con las aristas)");
  // Un nombre no se repite JAMÁS entre filosofías: la pizarra y el diario no pueden
  // mostrar dos rasgos distintos con el mismo nombre (rediseño del Contra: por esto
  // "Salida Vertical" pasó a Primera Marcha y "Pulmones de Acero" a Segundo Aire).
  const nombres = E.TRAITS.map(t => t.nombre);
  const repes = [...new Set(nombres.filter((n, i) => nombres.indexOf(n) !== i))];
  assert(!repes.length, "ningún nombre de rasgo se repite en el catálogo", repes.join(" · "));
}

// ---------- T2: la cadena de compra básico → intermediate ----------
{
  const r = E.newRun("BRA");
  E.choosePhilosophy(r, "press");             // 1 PI
  E.buyTrait(r, "presion_intensificada");                    // gasta el inicial
  E.applyFiloXp(r, { filoXp: { press: E.FILO_LEVELS[2].min } });   // press nivel 3 → PI vía DT
  const reqs = E.traitReqs(r, E.traitById("mittelfeldpressing"));
  assert(reqs.ok, "con previo + nivel 3 + PI, Cacería Letal se abre", reqs.faltas.join(" · "));
  assert(E.buyTrait(r, "mittelfeldpressing"), "la compra intermediate procede");
  // El nivel manda: sin nivel 6 no hay avanzada aunque sobren PI
  r.identityPoints = 5;
  const ang = E.traitReqs(r, E.traitById("angriffpressing"));
  assert(!ang.ok && ang.faltas.some(x => x.includes("nivel 6")), "la avanzada pide nivel 6 y el candado lo nombra", ang.faltas.join(" · "));
  E.applyFiloXp(r, { filoXp: { press: E.FILO_LEVELS[5].min - r.filoXp.press } });
  assert(E.traitReqs(r, E.traitById("angriffpressing")).ok, "en nivel 6 el candado se abre");
}

// ---------- La doctrina completa: la cadena de compra hasta el Master ----------
{
  // La cadena completa hasta el Master (camino mínimo: 4 PI + Consolidada)
  const r = E.newRun("BRA");
  E.choosePhilosophy(r, "press");
  E.applyFiloXp(r, { filoXp: { press: E.FILO_LEVELS[9].min } }); // Consolidada: nivel 10
  r.identityPoints = 10;                                          // PI de sobra para aislar el gating
  for (const id of ["presion_intensificada", "mittelfeldpressing", "angriffpressing"]) {
    assert(E.buyTrait(r, id), `la escalera compra ${id}`);
  }
  const reqs = E.traitReqs(r, E.traitById("pressingfalle"));
  assert(reqs.ok, "con la doctrina completa el Master se abre", reqs.faltas.join(" · "));
  const antes = r.journal.length;
  assert(E.buyTrait(r, "pressingfalle"), "el Master se compra");
  assert(r.journal.length === antes + 2 && r.journal[r.journal.length - 1].title.includes("PRENSA CONSAGRA"),
    "comprar un Master dispara la CONSAGRACIÓN de prensa (dos entradas)");
  // El camino costó 4 PI: la escasez del Bible sobrevive al arco completo
  assert(r.identityPoints === 6, "el camino mínimo al Master de Press cuesta 4 PI (sube por su rama)", r.identityPoints);
  // Pressingfalle CONVERGE (decisión PO 26-jul): se llega desde Angriffpressing o
  // desde Gegenpressing, cualquiera de los dos. Se comprueba por el otro camino.
  const r2 = E.newRun("BRA");
  E.choosePhilosophy(r2, "press");
  E.applyFiloXp(r2, { filoXp: { press: E.FILO_LEVELS[9].min } });
  r2.identityPoints = 10;
  for (const id of ["presion_intensificada", "mittelfeldpressing", "gegenpressing"]) E.buyTrait(r2, id);
  assert(E.traitReqs(r2, E.traitById("pressingfalle")).ok,
    "al Master del Press también se llega por Gegenpressing (la convergencia)",
    E.traitReqs(r2, E.traitById("pressingfalle")).faltas.join(" · "));

  // La consagración se narra UNA vez por filosofía, no una por Master (Posesión tiene 4).
  const rp = E.newRun("BRA");
  E.choosePhilosophy(rp, "posesion");
  E.applyFiloXp(rp, { filoXp: { posesion: E.FILO_LEVELS[9].min } });
  rp.identityPoints = 10;
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
    bloque:   { total: 15, firma: 6, respuesta: 5, expansion: 4, deep: "area_blindada" },
    contra:   { total: 16, firma: 6, respuesta: 5, expansion: 5, deep: "ataque_relampago" },
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
      // `todos` (convergencia Y) es de los dos árboles del 30-jul: el Bloque abre su
      // Firma con dos básicos que se compran juntos, y el Contra pide DOS padres en
      // las tres avanzadas. Press y Posesión se encadenan y convergen solo por `alguno`.
      assert(!t.req.todos || filo === "bloque" || filo === "contra", "solo Bloque y Contra convergen por AND", t.id);

      // Padres: de SU misma rama y del tier inmediatamente anterior. El árbol se
      // bifurca hacia adelante y a veces vuelve a juntarse, pero jamás cruza de rama
      // ni saltea escalones.
      const padres = [...(t.req.previo ? [t.req.previo] : []), ...(t.req.todos || []), ...(t.req.alguno || [])];
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

      // Los Principios murieron con las aristas (arco de Progresión): lo que queda es
      // el NIVEL de su filosofía, uniforme por tier — la vara del GDD.
      assert(t.req.principio === undefined && t.req.principios === undefined, "ningún nodo pide Principios", t.id);
      assert((t.req.nivel || 1) === NIVEL[t.tier], "el nivel exigido es el de su tier (1·3·6·10)", t.id);
    }


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

  // LA NEUTRALIZACIÓN de Posesión, RE-APUNTADA (sprint del Rival que Decide): su presa
  // vieja era el Bloque, y el ciclo dio vuelta ese cruce (ahora la Posesión lo gana), así
  // que el nodo apunta al depredador nuevo — el High Press.
  // Se lee la celda REAL del motor en vez de copiar sus números: así el rasgo no puede
  // volver a quedar apuntando a una celda que cambió de signo sin que nadie se entere,
  // que es exactamente lo que pasó con la matriz de F2.
  const osc = E.traitById("osciladores").hooks.poolMod;
  assert(osc.vsFilo === E.CAZADOR_DE.posesion, "Osciladores neutraliza contra el cazador de la Posesión", osc.vsFilo);
  const celda = E.counterCell("mine", "posesion", osc.vsFilo);
  assert(celda && celda.circulacion < 1, "la celda que neutraliza es la que castiga a la Posesión");
  const neto = celda.circulacion * osc.weights.circulacion;
  assert(Math.abs(neto - 1) < 0.03, "la circulación vuelve a ~1.00 contra su cazador", neto.toFixed(3));
  assert(neto < 1.05, "empareja el matchup, NO lo invierte (regla del arco)");
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
      m.my.altura = 5;   // la trampa del offside EXIGE línea alta (gate territorial)
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

// ---------- Las mecánicas del árbol del BLOQUE BAJO (30-jul-2026) ----------
// Mismo criterio que la sección de Posesión: no basta con que el hook exista — cada
// jugada nueva tiene que OCURRIR en un partido de verdad.
{
  // --- REVENTAR EL BALÓN: opción nueva del acto de contención ---
  {
    const sin = makeMatch("ARG", "bloque", []);
    E.startSequence(sin, E.sequenceType("repliegue"));
    assert(sin.decision.options.length === 2, "sin el rasgo, contener ofrece 2 opciones", sin.decision.options.length);
    assert(!sin.decision.options.some(o => o.key === "reventar"), "sin Pelotazo no existe el reventarla");

    const con = makeMatch("ARG", "bloque", ["pelotazo_fuera"]);
    E.startSequence(con, E.sequenceType("repliegue"));
    const rev = con.decision.options.find(o => o.key === "reventar");
    assert(rev && /Reventar el bal/.test(rev.label), "la jugada nueva se ofrece por su nombre", rev?.label);

    // Mata la jugada rival sin remate… y a veces la manda al córner (su precio).
    let muerta = false, corner = false;
    for (let i = 0; i < 200 && !(muerta && corner); i++) {
      const m = makeMatch("ARG", "bloque", ["pelotazo_fuera"]);
      m.min = 30;
      const tiros = m.stats.oppTiros;
      E.startSequence(m, E.sequenceType("repliegue"));
      m.resolveSequenceAct("reventar");
      if (!m.seq && m.stats.oppTiros === tiros) muerta = true;
      if (m.seq && m.seq.type.id === "balon_parado_def") corner = true;
    }
    assert(muerta, "reventarla mata el ataque rival sin remate");
    assert(corner, "y a veces el despeje apurado regala el córner (el precio de la jugada)");
  }

  // --- PIVOTEO AL ÁREA: opción nueva del duelo aéreo ---
  {
    const sin = makeMatch("ARG", "bloque", []);
    E.startSequence(sin, E.sequenceType("pelotazo"));
    assert(!sin.decision.options.some(o => o.key === "pivotear"), "sin Hombre Objetivo no hay pivoteo");

    let bajada = false;
    for (let i = 0; i < 300 && !bajada; i++) {
      const m = makeMatch("ARG", "bloque", ["hombre_objetivo"]);
      m.min = 30;
      E.startSequence(m, E.sequenceType("pelotazo"));
      assert(m.decision.options.some(o => o.key === "pivotear"), "con Hombre Objetivo el duelo ofrece pivotear");
      m.resolveSequenceAct("pivotear");
      // Ganado el duelo, la pelota cambia de pies y el remate pasa a ser de frente
      if (m.seq && m.seq.finishStat === "tiro" && m.seq.assistFrom) bajada = true;
    }
    assert(bajada, "el pivoteo baja la pelota al mejor rematador, que define de frente");
  }

  // --- LA MURALLA es de ESTADO: solo mientras el marcador no vaya en contra ---
  {
    // Se juegan N repliegues sosteniendo el marcador (el estado es lo único que cambia)
    // y se cuentan los goles rivales.
    const concede = (gMy, gOpp, rasgos) => {
      const m = makeMatch("ARG", "bloque", rasgos);
      m.min = 30;
      let goles = 0;
      for (let i = 0; i < 6000; i++) {   // muestra grande: los goles concedidos son ~1 de cada 100 repliegues
        m.gMy = gMy; m.gOpp = gOpp;
        E.startSequence(m, E.sequenceType("repliegue"));
        let g = 0;
        while (m.seq && g++ < 10) m.resolveSequenceAct(m.decision?.id === "sequence" ? m.decision.options[0].key : null);
        if (m.gOpp > gOpp) goles++;
        m.seq = null; m.decision = null;
      }
      return goles;
    };
    const enPie = concede(0, 0, ["muralla"]), abajo = concede(0, 1, ["muralla"]), pelado = concede(0, 0, []);
    assert(enPie < abajo, "empatado la muralla aguanta; yendo abajo en el marcador no aporta nada", `${enPie} vs ${abajo}`);
    assert(enPie < pelado, "y con el marcador a salvo concede menos que sin el rasgo", `${enPie} vs ${pelado}`);
  }

  // --- DEFENSA ESCALONADA: la primera ocasión rival, una sola vez por partido ---
  {
    let visto = false;
    for (let i = 0; i < 60 && !visto; i++) {
      const m = makeMatch("ARG", "bloque", ["defensa_escalonada"]);
      m.min = 30;
      for (let k = 0; k < 4; k++) {
        E.startSequence(m, E.sequenceType("repliegue"));
        while (m.seq) m.resolveSequenceAct(m.decision?.id === "sequence" ? "contener" : null);
        m.decision = null;
      }
      const veces = m.feed.filter(l => /escalonados/.test(l.text)).length;
      assert(veces <= 1, "el escalonamiento se cobra UNA sola vez por partido", veces);
      if (veces === 1) visto = true;
    }
    assert(visto, "la primera ocasión rival del partido se encuentra con la segunda línea");
  }

  // --- FORTALEZA INEXPUGNABLE: la ocasión clara que no ocurre ---
  {
    let anulada = false;
    for (let i = 0; i < 600 && !anulada; i++) {
      const m = makeMatch("ARG", "bloque", ["fortaleza_inexpugnable"]);
      m.min = 30;
      if (/No hay ocasión clara/.test(forcePlay(m, "circulacion", 1))) anulada = true;   // filtrado: abre contra
    }
    assert(anulada, "la Fortaleza mata la contra rival antes de que sea ocasión clara");
    // y conserva la NEUTRALIZACIÓN del sitio que traía La Fortaleza vieja
    const h = E.traitById("fortaleza_inexpugnable").hooks;
    assert(h.oppPoolMod?.vsFilo === "posesion" && Math.abs(1.35 * h.oppPoolMod.weights.repliegue - 1) < 0.03,
      "el sitio de Posesión vuelve a tablas (1.35 × 0.74 ≈ 1.00), sin invertirse");
    assert(h.frustration, "y la frustración acumulada sigue teniendo dueño");
  }

  // --- La migración F2 del Bloque cambió de dueño: la fortaleza profunda es del Área Blindada ---
  {
    const m = makeMatch("MAR", "bloque", ["area_blindada"], 2);
    assert(E.hasTrait(m, "area_blindada"), "hasTrait lee el nodo nuevo");
    assert(E.DEEP_TRAIT.bloque.id === "area_blindada", "deepBloque vive en Área Blindada", E.DEEP_TRAIT.bloque.id);
  }

  // --- El camino mínimo a una Maestría del Bloque cuesta 5 PI (los dos básicos de Firma) ---
  {
    const r = E.newRun("BRA");
    E.choosePhilosophy(r, "bloque");
    E.applyFiloXp(r, { filoXp: { bloque: E.FILO_LEVELS[9].min } });
    r.identityPoints = 10;
    for (const id of ["compactacion", "sobrepoblado", "area_blindada", "muralla"]) assert(E.buyTrait(r, id), `la escalera compra ${id}`);
    assert(E.traitReqs(r, E.traitById("fortaleza_inexpugnable")).ok, "con Muralla sola el Master converge (O, no Y)");
    assert(E.buyTrait(r, "fortaleza_inexpugnable"), "el Master del Bloque se compra");
    assert(r.identityPoints === 5, "el camino mínimo cuesta 5 PI", r.identityPoints);
    assert(r.journal.some(j => j.title.includes("PRENSA CONSAGRA")), "y consagra");
  }
}

// ---------- Las mecánicas del árbol del CONTRAGOLPE (30-jul-2026) ----------
{
  // --- PASE ATRÁS: opción nueva del desenlace, SOLO en la familia de la contra ---
  {
    const sin = makeMatch("ARG", "contra", []);
    E.startSequence(sin, E.sequenceType("transicion"));
    while (sin.seq && sin.decision?.options && !sin.decision.options.some(o => o.key === "rematar")) sin.resolveSequenceAct("pase");
    assert(sin.decision.options.length === 2, "sin el rasgo, el desenlace ofrece 2 opciones", sin.decision.options.length);

    let ofrecido = false, gol = false, perdida = false;
    for (let i = 0; i < 400 && !(ofrecido && gol && perdida); i++) {
      const m = makeMatch("ARG", "contra", ["pase_atras"]);
      m.min = 30;
      E.startSequence(m, E.sequenceType("transicion"));
      let g = 0;
      while (m.seq && g++ < 10) {
        if (!m.decision) { m.resolveSequenceAct(null); continue; }
        const hay = m.decision.options.find(o => o.key === "pase_atras");
        if (hay) { ofrecido = true; m.resolveSequenceAct("pase_atras"); break; }
        m.resolveSequenceAct("pase");
      }
      const feed = m.feed.map(l => l.text).join(" | ");
      if (/pase atr[áa]s/i.test(feed) && /GOOOOL|GOL CONFIRMADO/.test(feed)) gol = true;
      if (/la corta un rival que volvió/.test(feed)) perdida = true;
    }
    assert(ofrecido, "con Pase Atrás el desenlace de la contra ofrece la jugada nueva");
    assert(gol, "y cuando entra, el gol lo reconoce el relato");
    assert(perdida, "el pase se juega de verdad: se puede perder (y perderla ahí abre contra)");

    // En una jugada que NO es contra, la opción no existe (es de la familia de la transición)
    const otra = makeMatch("ARG", "contra", ["pase_atras"]);
    E.startSequence(otra, E.sequenceType("circulacion"));
    let g2 = 0;
    while (otra.seq && g2++ < 10 && !otra.decision?.options?.some(o => o.key === "rematar")) otra.resolveSequenceAct("seguro");
    assert(!otra.decision.options.some(o => o.key === "pase_atras"), "en la circulación no se ofrece: es una jugada de la contra");
  }

  // --- SIN ESCALAS: la contra nace YA resuelta, en mano a mano ---
  {
    let directo = false;
    for (let i = 0; i < 300 && !directo; i++) {
      const m = makeMatch("MAR", "contra", ["sin_escalas"]);
      m.min = 30;
      E.startSequence(m, E.sequenceType("transicion"));
      if (m.seq && m.seq.oneOnOne && m.seq.actIdx === m.seq.type.plan.length - 1) directo = true;
      m.seq = null; m.decision = null;
    }
    assert(directo, "Sin Escalas saltea los actos intermedios y arranca en el mano a mano");
    // Sin el rasgo jamás ocurre
    let nunca = true;
    for (let i = 0; i < 200 && nunca; i++) {
      const m = makeMatch("MAR", "contra", []);
      E.startSequence(m, E.sequenceType("transicion"));
      if (m.seq?.oneOnOne) nunca = false;
      m.seq = null; m.decision = null;
    }
    assert(nunca, "sin el Master la contra nunca nace resuelta");
  }

  // --- SAQUE RÁPIDO: el despeje de la salida asfixiada se vuelve contra mía ---
  {
    let reinicio = false;
    for (let i = 0; i < 400 && !reinicio; i++) {
      const m = makeMatch("ESP", "contra", ["saque_rapido"]);
      m.min = 30;
      E.startSequence(m, E.sequenceType("salida_fondo"));
      m.resolveSequenceAct("despeje");
      if (m.feed.some(l => /SAQUE RÁPIDO/.test(l.text))) reinicio = true;
    }
    assert(reinicio, "Saque Rápido convierte el despeje en contraataque");
  }

  // --- DEFENSA INTENCIONADA: el córner defendido lanza la contra ---
  {
    let contra = false;
    for (let i = 0; i < 400 && !contra; i++) {
      const m = makeMatch("ARG", "contra", ["defensa_intencionada"]);
      m.min = 30;
      if (forcePlay(m, "balon_parado_def", 0).includes("El despeje fue un PASE")) contra = true;
    }
    assert(contra, "Defensa Intencionada convierte el cabezazo de despeje en contra");
  }

  // --- SKILLER: al que conduce la contra le hacen más faltas ---
  {
    const penales = rasgos => {
      const m = makeMatch("ARG", "contra", rasgos);
      m.min = 30;
      let faltas = 0;
      for (let i = 0; i < 2500; i++) {
        E.startSequence(m, E.sequenceType("transicion"));
        const antes = m.feed.length;
        if (m.decision?.options?.some(o => o.key === "conducir")) m.resolveSequenceAct("conducir");
        // Con la geografía de la falta (Territorio, T4) derribarlo lejos del área ya no es
        // penal sino tiro libre: lo que este rasgo ensancha es la FALTA, se cobre donde se cobre.
        if (m.feed.slice(antes).some(l => /PENAL|Falta sobre/.test(l.text))) faltas++;
        m.seq = null; m.decision = null;
      }
      return faltas;
    };
    const con = penales(["skiller"]), sin = penales([]);
    assert(con > sin, "con Skiller, conducir la contra termina en falta más seguido", `${con} vs ${sin}`);
  }

  // --- EL PASE DE LA CONTRA SE APILA (Primer Pase + Primera Marcha + Salida Vertical) ---
  {
    const bonus = rasgos => {
      const m = makeMatch("ARG", "contra", rasgos);
      m.min = 30;
      E.startSequence(m, E.sequenceType("transicion"));
      if (m.seq.actIdx !== 0) return null;          // saltó al desenlace: no sirve de muestra
      const antes = m.seq.bonus;
      m.resolveSequenceAct("pase");
      return m.seq ? m.seq.bonus - antes : null;
    };
    const medir = rasgos => { for (let i = 0; i < 50; i++) { const b = bonus(rasgos); if (b !== null) return b; } return null; };
    const uno = medir(["primer_pase"]), dos = medir(["primer_pase", "primera_marcha"]);
    assert(uno > 0 && dos > uno, "dos rasgos del pase de la contra SUMAN (no gana el primero comprado)", `${uno} vs ${dos}`);
  }

  // --- SEGUNDO AIRE: solo con el tanque vacío ---
  // OJO (hallazgo del gate): MI energía no baja DENTRO del partido — solo el rival se
  // cansa en cancha (drainOppEnergy). Al rasgo se llega fundido desde el día anterior,
  // que es exactamente la situación que el diseño quiere premiar.
  {
    const medir = energia => {
      let n = 0, suma = 0, visto = 0;
      for (let i = 0; i < 200; i++) {
        const run = E.newRun("BRA");
        const { lineup } = E.currentLineup(run.squad, null, null);
        for (const p of run.squad) p.energia = energia;
        const bench = run.squad.filter(p => !lineup.includes(p));
        const m = new E.Match({ team: E.getTeam("BRA"), lineup, bench, mentalidad: "normal", buffs: {},
          filo: { id: "contra", nivel: 0, etapa: 0, rasgos: ["segundo_aire"] } }, E.getTeam("ARG"), false, []);
        m.min = 30;
        E.startSequence(m, E.sequenceType("transicion"));
        if (m.seq?.actIdx !== 0) continue;
        n++;
        const antes = m.seq.bonus;
        m.resolveSequenceAct("pase");
        if (m.seq) suma += m.seq.bonus - antes;
        if (m.feed.some(l => /segundo aire/i.test(l.text))) visto++;
      }
      return { medio: suma / n, visto };
    };
    const fresco = medir(100), fundido = medir(45);
    assert(fundido.medio > fresco.medio, "con el tanque vacío la contra sigue llegando; fresco no aporta nada",
      `${fresco.medio.toFixed(3)} vs ${fundido.medio.toFixed(3)}`);
    assert(!fresco.visto && fundido.visto, "y el momento SE VE solo cuando hay piernas fundidas", `${fresco.visto}/${fundido.visto}`);
  }

  // --- EL ANZUELO: la neutralización del partido muerto (heredada de La Invitación) ---
  {
    const h = E.traitById("el_anzuelo").hooks;
    assert(h.poolMod.vsFilo.includes("contra") && h.poolMod.vsFilo.includes("bloque"),
      "el anzuelo neutraliza SOLO contra los que esperan");
    assert(Math.abs(0.6 * h.poolMod.weights.transicion - 1) < 0.05,
      "la transición vuelve a ~1.00 contra el que espera (a tablas, no invertida)", (0.6 * h.poolMod.weights.transicion).toFixed(3));
    let picaron = false, esperador = false;
    for (let i = 0; i < 400 && !picaron; i++) {
      const m = makeMatch("SWE", "contra", ["el_anzuelo"]);   // SWE = bloque curado
      m.min = 30;
      // El hook lee la filosofía rival del PLAN del partido: hay que despertarlo antes
      // de forzar la jugada (el plan nace en maybeStartSequence, no en startSequence).
      E.maybeStartSequence(m); m.seq = null; m.decision = null;
      if (["contra", "bloque"].includes(m._seqPlan?.oppFilo?.id)) esperador = true;
      if (/Picaron el ANZUELO/.test(forcePlay(m, "circulacion", 0))) picaron = true;
    }
    assert(esperador, "el rival de prueba es de los que esperan");
    assert(picaron, "el rival que espera pica el anzuelo y la circulación-cebo se vuelve contra");
  }

  // --- EL FILTRO POR FAMILIA: dos filosofías con el mismo hook para jugadas distintas ---
  {
    // Directo (Press) salta la recuperación · Ataque Relámpago (Contra) salta la contra.
    const m = makeMatch("ARG", "press", ["directo", "ataque_relampago"]);
    assert(E.hookOf(m, "skipToFinish", "recuperacion")?.traitId === "directo", "el hook de la recuperación es el del Press");
    assert(E.hookOf(m, "skipToFinish", "transicion")?.traitId === "ataque_relampago", "y el de la contra es el del Contragolpe");
    assert(E.hookOf(m, "skipToFinish", "circulacion") === null, "y para una jugada que ninguno cubre, ninguno");
  }

  // --- El camino mínimo a una Maestría del Contra cuesta 5 PI (las tres avanzadas piden DOS padres) ---
  {
    const r = E.newRun("BRA");
    E.choosePhilosophy(r, "contra");
    E.applyFiloXp(r, { filoXp: { contra: E.FILO_LEVELS[9].min } });
    r.identityPoints = 10;
    for (const id of ["primer_pase", "primera_marcha", "ataque_espacio", "ataque_relampago", "duelista"]) {
      assert(E.buyTrait(r, id), `la escalera del Contra compra ${id}`);
    }
    assert(r.identityPoints === 5, "el camino mínimo al Master del Contra cuesta 5 PI", r.identityPoints);
    assert(r.journal.some(j => j.title.includes("PRENSA CONSAGRA")), "y consagra");
    // La convergencia Y muerde: sin los DOS padres, la avanzada no se abre
    const r2 = E.newRun("BRA");
    E.choosePhilosophy(r2, "contra");
    E.applyFiloXp(r2, { filoXp: { contra: E.FILO_LEVELS[9].min } });
    r2.identityPoints = 10;
    E.buyTrait(r2, "primer_pase"); E.buyTrait(r2, "primera_marcha");
    const faltas = E.traitReqs(r2, E.traitById("ataque_relampago")).faltas;
    assert(faltas.some(x => x.includes("Ataque al Espacio")), "el candado nombra el padre que falta", faltas.join(" · "));
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
