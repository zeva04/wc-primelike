/* ============================================================
   Tests del árbol de Rasgos (game/traits.js + content/traits/**) — catálogo v2:
   - LA FORMA, idéntica en las cuatro filosofías: 1 raíz + 3 ramas × 3 tiers + 2 Masters
   - la escala numérica cerrada, y la EXCEPCIÓN de los multiplicadores derivados
   - Puntos de Identidad: +1 al elegir (nivel 1), +1 por nivel del DT
   - compra: 1 PI + requisitos; duplicado/sin PI/sin nivel no pasan
   - las mecánicas de cada árbol OCURREN en un partido de verdad (no basta el hook)
   Uso: node tests/traits.test.js
   ============================================================ */
import { loadEngine } from "./load-engine.js";

const { Engine: E } = await loadEngine();

let fails = 0, checks = 0;
const assert = (cond, msg, ctx) => { checks++; if (!cond) { fails++; console.error("FAIL:", msg, ctx ?? ""); } };

const FILOS = ["press", "posesion", "bloque", "contra"];
/** La raíz de cada árbol: el nodo del que cuelgan las tres ramas. */
const RAIZ = { press: "incomodar", posesion: "el_rondo", bloque: "marca_zonal", contra: "punta_velocidad" };

/** Una run con la filosofía elegida, a nivel tope y con PI de sobra: aísla el gating. */
function runAt(filo, pi = 12) {
  const r = E.newRun("BRA");
  E.choosePhilosophy(r, filo);
  E.applyFiloXp(r, { filoXp: { [filo]: E.FILO_LEVELS[9].min } });
  r.identityPoints = pi;
  return r;
}

// ---------- catálogo: forma, tono y escala ----------
{
  assert(E.TRAITS.length === 48, "48 rasgos: 12 por filosofía", E.TRAITS.length);
  assert(new Set(E.TRAITS.map(t => t.id)).size === E.TRAITS.length, "ids únicos en el catálogo");
  const nombres = E.TRAITS.map(t => t.nombre);
  const repes = [...new Set(nombres.filter((n, i) => nombres.indexOf(n) !== i))];
  assert(!repes.length, "ningún nombre de rasgo se repite (la pizarra y el diario no pueden mostrar dos iguales)", repes.join(" · "));

  for (const t of E.TRAITS) {
    assert(t.nombre && t.desc && t.momento && t.icon, "rasgo completo (nombre/desc/momento/icon)", t.id);
    assert(!/\d/.test(t.desc), "la descripción al jugador NUNCA habla de números (tono sobrio, decisión PO)", `${t.id}: "${t.desc}"`);
    assert(t.hooks && Object.keys(t.hooks).length >= 1, "todo rasgo declara sus hooks", t.id);
    assert(Array.isArray(t.efecto) && t.efecto.length, "todo rasgo declara su efecto en el partido", t.id);
    for (const e of t.efecto) {
      assert(Array.isArray(e) && e.length === 2 && e.every(x => typeof x === "string" && x),
        "cada efecto es [valor, texto]", `${t.id}: ${JSON.stringify(e)}`);
      assert(e[0].length <= 14, "el valor del efecto entra en su placa (≤14 caracteres)", `${t.id}: "${e[0]}"`);
    }
    // LA GEOGRAFÍA SIEMPRE SE DICE — pero no siempre hace falta el bloque ámbar del ⚠.
    // El invariante que importa es que el jugador SEPA dónde funciona el rasgo, no en qué
    // campo del catálogo está escrito: "desbloquea SAQUE LARGO AL ÁREA rival" ya lo dice
    // entero, y repetirlo abajo en letra chica solo agrega peso visual (la pasada de
    // revisión del 13-ago midió que Bloque y Posesión eran el doble de densos de leer que
    // Press y Contra, y los gates redundantes eran la mitad de esa diferencia). Así que
    // vale el `gate` O que el sitio esté nombrado en el efecto; lo que NO vale es callarlo.
    const LUGARES = /área|campo propio|campo rival|zona de remate|bloque alto|mediocampo|adelantado/i;
    const gated = Object.values(t.hooks).some(h => h?.zone || h?.minHeight);
    if (gated) {
      const dicho = (typeof t.gate === "string" && t.gate.length > 20)
        || t.efecto.some(([, txt]) => LUGARES.test(txt));
      assert(dicho, "un rasgo con geografía (zone/minHeight) DICE dónde funciona: en su gate o en su efecto", t.id);
    }
    assert(E.getPhilosophy(t.filo), "la filosofía del rasgo existe", t.id);
    assert(E.RAMA_LABELS[t.rama], "rama con etiqueta para la UI", `${t.id}: ${t.rama}`);
  }
  assert(E.traitById("presion_intensificada")?.filo === "press", "traitById encuentra por id");
  assert(E.traitById("no_existe") === undefined, "traitById devuelve undefined para basura");

  // LA ESCALA CERRADA v2. Los números dejaron de elegirse a ojo.
  const P_OK = [0.20, 0.25, 0.30, 0.40, 0.50, 1];
  const BONUS_OK = [0.05, 0.10, 0.15, 0.20];
  for (const t of E.TRAITS) {
    for (const [nombre, h] of Object.entries(t.hooks)) {
      if (typeof h?.p === "number")
        assert(P_OK.some(v => Math.abs(v - h.p) < 1e-9), `${t.id}.${nombre}: la probabilidad está en la escala (20·25·30·40·50%)`, h.p);
      if (typeof h?.bonus === "number" && h.bonus !== 0)
        assert(BONUS_OK.some(v => Math.abs(v - Math.abs(h.bonus)) < 1e-9),
          `${t.id}.${nombre}: el bonus está en la escala (5·10·15·20%)`, h.bonus);
    }
  }
  // …y su EXCEPCIÓN: los multiplicadores `vsFilo` no se eligen, se DERIVAN de la celda
  // de la matriz de counters. Se verifican por su producto (abajo), nunca por su forma.
  const derivados = E.TRAITS.filter(t => Object.values(t.hooks).some(h => h?.vsFilo && h?.weights)).map(t => t.id).sort();
  assert(derivados.join() === "el_anzuelo,fortaleza_inexpugnable,osciladores",
    "solo tres rasgos llevan multiplicador derivado de la matriz", derivados.join());
}

// ---------- LA FORMA: 1 + (3×3) + 2, idéntica en las cuatro ----------
{
  const NIVEL = { root: 1, basic: 1, intermediate: 3, advanced: 6, master: 10 };
  const ORDEN = ["root", "basic", "intermediate", "advanced", "master"];

  for (const filo of FILOS) {
    const arbol = E.traitsOf(filo);
    assert(arbol.length === 12, `${filo}: 12 rasgos`, arbol.length);
    const porRama = r => arbol.filter(t => t.rama === r);
    assert(porRama("raiz").length === 1, `${filo}: UNA raíz`, porRama("raiz").length);
    assert(porRama("raiz")[0].id === RAIZ[filo], `${filo}: la raíz es ${RAIZ[filo]}`, porRama("raiz")[0].id);
    assert(porRama("convergencia").length === 1, `${filo}: UN master de convergencia`, porRama("convergencia").length);
    for (const rama of ["respuesta", "expansion"])
      assert(porRama(rama).length === 3 && porRama(rama).map(t => t.tier).sort().join() === "advanced,basic,intermediate",
        `${filo}: la rama ${rama} son tres tiers`, porRama(rama).map(t => t.tier).join());
    assert(porRama("firma").length === 4 && porRama("firma").filter(t => t.tier === "master").length === 1,
      `${filo}: la Firma son tres tiers + su Master propio`, porRama("firma").map(t => t.tier).join());
    assert(arbol.filter(t => t.tier === "master").length === 2, `${filo}: exactamente DOS Masters`, arbol.filter(t => t.tier === "master").length);
    assert(arbol.filter(t => t.tier === "basic").length === 3, `${filo}: TRES básicos, uno por rama`, arbol.filter(t => t.tier === "basic").length);

    const vistos = new Set();
    for (const t of arbol) {
      assert(t.pos && Number.isFinite(t.pos.x) && Number.isFinite(t.pos.y), "el rasgo declara su posición en la cancha", t.id);
      const clave = `${t.pos.x}|${t.pos.y}`;
      assert(!vistos.has(clave), "dos rasgos nunca comparten posición", t.id);
      vistos.add(clave);
      assert(t.req.nivel === NIVEL[t.tier], `nivel ${NIVEL[t.tier]} para un ${t.tier}`, t.id);
      assert(t.req.todos === undefined, "la convergencia Y murió con el rediseño v2: solo `previo` y `alguno`", t.id);
      assert(t.req.principio === undefined && t.req.principios === undefined, "ningún nodo pide Principios", t.id);

      const padres = [...(t.req.previo ? [t.req.previo] : []), ...(t.req.alguno || [])];
      if (t.tier === "root") { assert(!padres.length, "la raíz no cuelga de nadie", t.id); continue; }
      assert(padres.length >= 1, "todo nodo no-raíz cuelga de alguien", t.id);
      for (const pid of padres) {
        const prev = E.traitById(pid);
        assert(prev && prev.filo === filo, "el padre es del mismo árbol", `${t.id} <- ${pid}`);
        assert(ORDEN.indexOf(prev.tier) === ORDEN.indexOf(t.tier) - 1, "el padre es del tier inmediatamente anterior", `${t.id} <- ${pid}`);
        // Los básicos cuelgan de la RAÍZ (que no tiene rama) y el Master de convergencia
        // de las dos avanzadas de Respuesta y Expansión. El resto no cruza de rama jamás.
        if (t.tier === "basic") assert(prev.rama === "raiz", "un básico cuelga de la raíz", t.id);
        else if (t.rama === "convergencia") assert(["respuesta", "expansion"].includes(prev.rama), "la convergencia junta Respuesta y Expansión", `${t.id} <- ${pid}`);
        else assert(prev.rama === t.rama, "el padre es de SU rama", `${t.id} <- ${pid}`);
      }
      if (t.rama === "convergencia")
        assert((t.req.alguno || []).length === 2, "la convergencia se abre por CUALQUIERA de sus dos padres (O, no Y)", t.id);
    }
  }

  // El efecto profundo (migración F2) sigue teniendo dueño, y ahora vive en el Intermedio.
  const DEEP = { press: "gegenpressing", posesion: "desesperantes", bloque: "area_blindada", contra: "ataque_relampago" };
  for (const filo of FILOS) {
    assert(E.DEEP_TRAIT[filo]?.id === DEEP[filo], `deepXxx de ${filo} vive en ${DEEP[filo]}`, E.DEEP_TRAIT[filo]?.id);
    assert(E.DEEP_TRAIT[filo].tier === "intermediate", `${filo}: la PROFUNDA se conquista en el Intermedio`, E.DEEP_TRAIT[filo].tier);
  }
}

// ---------- PI: el inicial y la escalera del Director Técnico ----------
{
  const r = E.newRun("BRA");
  assert(r.identityPoints === 0 && Object.keys(r.rasgos).length === 0, "la run nace sin PI ni rasgos");
  E.choosePhilosophy(r, "press");
  assert(r.identityPoints === 1 && r.dtNivel === 1, "elegir filosofía = nivel 1 del DT = 1 PI inmediato (flujo de inicio)", r.identityPoints);
  r.actionPending = true;
  E.applyDayAction(r, "plan_press");
  assert(r.identityPoints === 1, "el Plan de Partido no regala PI: la progresión es de cancha", r.identityPoints);
  E.applyFiloXp(r, { filoXp: { press: E.FILO_LEVELS[1].min } });
  assert(r.identityPoints === 2 && r.dtNivel === 2, "subir una filosofía paga XP al DT y su nivel imprime 1 PI", `${r.dtNivel}/${r.identityPoints}`);
  E.applyFiloXp(r, { filoXp: { press: E.FILO_LEVELS[5].min } });
  assert(E.filoLevel(r) === 5 && r.identityPoints > 2, "niveles múltiples acreditan de a varios", r.identityPoints);
}

// ---------- especializar rinde más que repartirse (la tesis del GDD) ----------
{
  const foco = E.newRun("BRA"); E.choosePhilosophy(foco, "press");
  E.applyFiloXp(foco, { filoXp: { press: E.FILO_LEVELS[9].min } });
  const disperso = E.newRun("BRA"); E.choosePhilosophy(disperso, "press");
  E.applyFiloXp(disperso, { filoXp: {
    press: E.FILO_LEVELS[9].min / 4, posesion: E.FILO_LEVELS[9].min / 4,
    contra: E.FILO_LEVELS[9].min / 4, bloque: E.FILO_LEVELS[9].min / 4 } });
  assert(foco.dtXp > disperso.dtXp, "la misma XP concentrada paga MÁS al DT que repartida en cuatro",
    `${foco.dtXp} vs ${disperso.dtXp}`);
}

// ---------- LA RAÍZ es el primer gasto obligado (decisión PO del rediseño v2) ----------
{
  const r = E.newRun("BRA");
  E.choosePhilosophy(r, "press");                 // 1 PI
  const tree = E.traitTree(r);
  const buyables = tree.filter(t => t.buyable);
  assert(buyables.length === 1 && buyables[0].id === "incomodar",
    "con el PI inicial lo ÚNICO comprable es la raíz: el árbol tiene una sola entrada",
    buyables.map(t => t.id).join());
  const bas = E.traitReqs(r, E.traitById("presion_intensificada"));
  assert(!bas.ok && bas.faltas.some(x => x.includes("Incomodar")), "los tres básicos cuelgan de ella y el candado la nombra", bas.faltas.join(" · "));
  assert(E.buyTrait(r, "incomodar") && r.identityPoints === 0, "comprar la raíz cobra el PI");
  r.identityPoints = 1;
  const abiertos = E.traitTree(r).filter(t => t.buyable).map(t => t.id).sort();
  assert(abiertos.join() === "directo,presion_intensificada,pulmones",
    "conquistada la raíz se abren los TRES básicos a la vez: ahí está el 1-de-3", abiertos.join());
}

// ---------- compra: sin latencia, las builds híbridas juegan ----------
{
  const r = E.newRun("BRA");
  E.choosePhilosophy(r, "press");
  assert(E.buyTrait(r, "no_existe") === null, "un id basura no se puede comprar");
  const antes = r.journal.length;
  const t = E.buyTrait(r, "incomodar");
  assert(t && t.id === "incomodar" && r.identityPoints === 0, "comprar cobra el PI y devuelve la fila", r.identityPoints);
  assert(r.rasgos.press.includes("incomodar") && r.journal.length === antes + 1, "el rasgo queda en la run y escribe el diario");
  assert(E.activeTraitIds(r).join() === "incomodar" && E.activeTraits(r)[0].nombre === "Incomodar", "activeTraits lee lo comprado");
  assert(E.buyTrait(r, "incomodar") === null, "no se compra dos veces");
  assert(E.buyTrait(r, "pulmones") === null, "sin PI no hay compra");
  const reqs = E.traitReqs(r, E.traitById("pulmones"));
  assert(!reqs.ok && reqs.faltas.some(x => x.includes("Punto de Identidad")), "el candado nombra la falta en lenguaje de jugador", reqs.faltas.join(" · "));
  assert(E.filoCtx(r).rasgos.includes("incomodar"), "filoCtx lleva los rasgos al matchCtx");
  // HÍBRIDO: un rasgo de OTRA filosofía se compra con su propio nivel…
  r.identityPoints = 1;
  assert(E.buyTrait(r, "el_rondo") && r.rasgos.posesion.includes("el_rondo"), "la raíz de otra filosofía se compra: la build híbrida existe");
  // …y NO se apaga al cambiar de identidad: si lo compraste, juega
  r.actionPending = true;
  E.changePhilosophy(r, "bloque");
  const activos = E.activeTraitIds(r);
  assert(activos.includes("incomodar") && activos.includes("el_rondo"), "se acabó la latencia: todos los comprados siguen activos");
  assert(E.filoCtx(r).rasgos.length === 2, "el Match recibe los dos, sea cual sea la identidad que se juega");
}

// ---------- el nivel se mide en LA FILOSOFÍA DEL RASGO ----------
{
  const r = E.newRun("BRA");
  E.choosePhilosophy(r, "press");
  r.identityPoints = 5;
  E.buyTrait(r, "incomodar"); E.buyTrait(r, "presion_intensificada");
  const gegen = E.traitById("gegenpressing");        // intermedio del press: nivel 3
  assert(!E.traitReqs(r, gegen).ok, "en nivel 1 el intermedio está bloqueado");
  r.filoXp.posesion = E.FILO_LEVELS[9].min;          // subir OTRA filosofía no abre esta rama
  assert(!E.traitReqs(r, gegen).ok, "el nivel de otra idea no desbloquea la propia");
  r.filoXp.press = E.FILO_LEVELS[2].min;             // press nivel 3
  assert(E.traitReqs(r, gegen).ok, "con SU filosofía en nivel 3, el intermedio se abre");
  const falta = E.traitReqs(E.newRun("BRA"), gegen).faltas.join(" · ");
  assert(falta.includes("High Press nivel 3"), "la falta nombra la filosofía y su nivel", falta);
}

// ---------- el árbol para la pantalla ----------
{
  const r = E.newRun("BRA");
  E.choosePhilosophy(r, "contra");
  const tree = E.traitTree(r);
  assert(tree.length === 12, "el árbol del contra trae sus 12 nodos", tree.length);
  assert(tree.filter(t => t.tier === "intermediate").every(t => !t.buyable && t.faltas.length >= 2), "los intermediate nacen con candado múltiple (previo + nivel)");
  E.buyTrait(r, "punta_velocidad");
  const tree2 = E.traitTree(r);
  assert(tree2.find(t => t.id === "punta_velocidad").owned, "el comprado figura owned");
  assert(tree2.filter(t => !t.owned).every(t => !t.buyable && t.faltas.length), "sin PI el resto queda con candado y faltas legibles");
  const ajeno = E.traitTree(r, "bloque");
  assert(ajeno.length === 12 && ajeno.every(t => t.filo === "bloque"), "traitTree(run, filoId) devuelve el árbol pedido");
}

// ---------- los caminos: 5 PI a cualquiera de los dos Masters ----------
{
  for (const filo of FILOS) {
    const arbol = E.traitsOf(filo);
    const mFirma = arbol.find(t => t.tier === "master" && t.rama === "firma");
    const mConv = arbol.find(t => t.rama === "convergencia");

    // Camino de la FIRMA: raíz → básico → intermedio → avanzado → Master. Cinco PI.
    const r = runAt(filo, 10);
    const cadena = [RAIZ[filo]];
    let cur = mFirma;
    const escalera = [];
    while (cur.req.previo) { escalera.unshift(cur.id); cur = E.traitById(cur.req.previo); }
    escalera.unshift(cur.id);
    for (const id of [...cadena.slice(0, 0), ...escalera]) assert(E.buyTrait(r, id), `${filo}: la escalera de Firma compra ${id}`);
    assert(r.identityPoints === 5, `${filo}: el camino mínimo al Master de Firma cuesta 5 PI`, 10 - r.identityPoints);
    assert(r.journal.some(j => j.title.includes("PRENSA CONSAGRA")), `${filo}: el Master consagra`);

    // Camino de la CONVERGENCIA: se llega por CUALQUIERA de sus dos padres, también en 5.
    for (const padre of mConv.req.alguno) {
      const r2 = runAt(filo, 10);
      const via = [];
      let n = E.traitById(padre);
      while (n.req.previo) { via.unshift(n.id); n = E.traitById(n.req.previo); }
      via.unshift(n.id);
      for (const id of via) assert(E.buyTrait(r2, id), `${filo}: la rama compra ${id}`);
      assert(E.traitReqs(r2, mConv).ok, `${filo}: al Master de convergencia se llega por ${padre}`, E.traitReqs(r2, mConv).faltas.join(" · "));
      assert(E.buyTrait(r2, mConv.id) && r2.identityPoints === 5, `${filo}: y también cuesta 5 PI por ese lado`, 10 - r2.identityPoints);
    }
  }

  // La consagración se narra UNA vez por filosofía, no una por Master.
  const rp = runAt("posesion", 12);
  for (const id of ["el_rondo", "buen_pie", "tercer_hombre", "osciladores", "maquina_colectiva"]) E.buyTrait(rp, id);
  assert(rp.journal.some(j => j.title.includes("PRENSA CONSAGRA")), "el primer Master consagra");
  const antes = rp.journal.length;
  for (const id of ["cabeza_fria", "la_trampa", "la_frontera", "el_carrusel"]) E.buyTrait(rp, id);
  assert(E.activeTraitIds(rp).includes("el_carrusel"), "el segundo Master se compra igual");
  assert(!rp.journal.slice(antes).some(j => j.title.includes("PRENSA CONSAGRA")),
    "el SEGUNDO Master ya no vuelve a consagrar: el hito se narra una sola vez");
}

// ---------- El motor reactivo: los hooks EN el partido ----------
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
  // Plumbing general
  const m0 = makeMatch("GER", "posesion", ["osciladores"]);
  assert(E.traitHooks(m0).poolMod?.[0]?.weights?.circulacion === E.traitById("osciladores").hooks.poolMod.weights.circulacion,
    "el hook poolMod viaja al Match vía matchCtx.filo.rasgos");
  assert(Object.keys(E.traitHooks(makeMatch("GER", "posesion", []))).length === 0, "sin rasgos no hay hooks");

  // Gegenpressing: la pérdida arriesgada ENCADENA una recuperación mía
  let mordida = false, chainBudgetOk = true;
  for (let i = 0; i < 300 && !mordida; i++) {
    const m = makeMatch("ARG", "press", ["gegenpressing"]);
    m.min = 30;
    if (forcePlay(m, "circulacion", 1).includes("MORDIDA")) mordida = true;
    if ((m._chainCount || 0) > E.MAX_CHAINS) chainBudgetOk = false;
  }
  assert(mordida, "Gegenpressing encadena la recuperación reactiva (el momento SE VE en el feed)");
  assert(chainBudgetOk, "el presupuesto de cadenas nunca se excede");

  let sinRasgo = false;
  for (let i = 0; i < 150; i++) {
    const m = makeMatch("ARG", "press", []);
    m.min = 30;
    if (forcePlay(m, "circulacion", 1).includes("MORDIDA")) sinRasgo = true;
  }
  assert(!sinRasgo, "sin comprar el rasgo no hay mordida (los hooks nacen del árbol)");

  // Las secuencias reactivas NO cuentan contra el objetivo del generador
  {
    const m = makeMatch("ARG", "press", ["gegenpressing"]);
    m.min = 30;
    const antes = m._seqCount || 0;
    forcePlay(m, "circulacion", 1);
    assert((m._seqCount || 0) === antes + 1, "la cadena reactiva no infla _seqCount (solo la original cuenta)");
  }

  // Atentos (Bloque): el duelo perdido del pelotazo recupera la segunda pelota
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
  assert(salto, "Ataque Relámpago salta directo a la definición (fútbol sin escalas)");

  // Angriffpressing: la recuperación nace sobre el saque de meta — con GATE territorial
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
}

// ---------- Los TRES hooks nuevos del rediseño v2 ----------
{
  /** Media del bonus que deja un acto, sobre N muestras válidas. */
  const mediaBonus = (rasgos, filoId, typeId, key, n = 400) => {
    let suma = 0, casos = 0;
    for (let i = 0; i < n * 4 && casos < n; i++) {
      const m = makeMatch("MAR", filoId, rasgos);
      m.min = 30;
      E.startSequence(m, E.sequenceType(typeId));
      if (!m.seq || m.seq.actIdx !== 0 || !m.decision?.options?.some(o => o.key === key)) { continue; }
      const antes = m.seq.bonus;
      m.resolveSequenceAct(key);
      if (!m.seq) continue;
      suma += m.seq.bonus - antes; casos++;
    }
    return casos ? suma / casos : null;
  };

  // PRESIÓN INTENSIFICADA: el acto de presionar acierta más (menos presiones rotas)
  {
    // Se REUTILIZA una sola instancia y se reinicia la jugada (patrón de los tests
    // viejos): crear un Match por muestra es caro, y con pocas muestras un efecto de
    // +10% se pierde en el ruido — estos tests fallaban una de cada tres corridas.
    const rotas = rasgos => {
      const m = makeMatch("ESP", "press", rasgos);
      m.min = 30; m.my.altura = 4;
      let n = 0;
      for (let i = 0; i < 4000; i++) {
        m.seq = null; m.decision = null;
        const from = m.feed.length;
        E.startSequence(m, E.sequenceType("recuperacion"));
        if (m.decision?.id === "sequence") m.resolveSequenceAct(m.decision.options[1].key);
        if (m.feed.slice(from).some(l => /rompe la presión/.test(l.text))) n++;
      }
      return n;
    };
    const con = rotas(["presion_intensificada"]), sin = rotas([]);
    assert(con < sin, "Presión Intensificada rompe menos veces: el acto de presionar acierta más", `${con} vs ${sin}`);
  }

  // PUNTA DE VELOCIDAD (raíz del Contra): conducir la contra se gana más seguido
  {
    const perdidas = rasgos => {
      const m = makeMatch("MAR", "contra", rasgos);
      m.min = 30;
      let n = 0, casos = 0;
      for (let i = 0; i < 6000 && casos < 4000; i++) {
        m.seq = null; m.decision = null;
        E.startSequence(m, E.sequenceType("transicion"));
        if (!m.seq || m.seq.actIdx !== 0) continue;
        casos++;
        m.resolveSequenceAct("conducir");
        if (!m.seq) n++;    // la conducción rota cierra la jugada
      }
      return n;
    };
    const con = perdidas(["punta_velocidad"]), sin = perdidas([]);
    assert(con < sin, "Punta de Velocidad pierde menos conducciones: el arranque al espacio se gana", `${con} vs ${sin}`);
  }

  // BUEN PIE: el pase seguro deja de ser trámite — cada uno perfila el remate
  {
    const con = mediaBonus(["buen_pie"], "posesion", "circulacion", "seguro");
    const sin = mediaBonus([], "posesion", "circulacion", "seguro");
    assert(con !== null && sin !== null && Math.abs((con - sin) - 0.05) < 1e-6,
      "Buen Pie suma su perfil en CADA pase seguro", `${con} vs ${sin}`);
    let visto = false;
    for (let i = 0; i < 80 && !visto; i++) {
      const m = makeMatch("MAR", "posesion", ["buen_pie"]);
      m.min = 30;
      if (/Buen pie/.test(forcePlay(m, "circulacion", 0))) visto = true;
    }
    assert(visto, "y el momento SE VE en el relato");
    // …pero UNA sola vez por jugada: tres pases seguros no son tres líneas de tiza
    let repetido = false;
    for (let i = 0; i < 120 && !repetido; i++) {
      const m = makeMatch("MAR", "posesion", ["buen_pie"]);
      m.min = 30;
      const feed = forcePlay(m, "sinfonia", 0);
      if ((feed.match(/Buen pie/g) || []).length > 1) repetido = true;
    }
    assert(!repetido, "el relato del pase seguro no se repite dentro de la misma jugada");
  }

  // PASE DE RIESGO: el filtrado LLEGA más seguido (muerde en el acierto, no en el perfil)
  {
    const perdidos = rasgos => {
      const m = makeMatch("MAR", "posesion", rasgos);
      m.min = 30;
      let n = 0, casos = 0;
      for (let i = 0; i < 6000 && casos < 4000; i++) {
        m.seq = null; m.decision = null;
        E.startSequence(m, E.sequenceType("circulacion"));
        if (!m.seq || m.seq.actIdx !== 0) continue;
        casos++;
        const act = m.seq.actIdx;
        m.resolveSequenceAct("filtrado");
        // El filtrado perdido cierra la jugada (o la recicla sin avanzar el acto): en
        // los dos casos NO progresó. El que llega, avanza.
        if (!m.seq || m.seq.actIdx === act) n++;
      }
      return n;
    };
    const con = perdidos(["pase_riesgo"]), sin = perdidos([]);
    assert(con < sin, "Pase de Riesgo pierde menos filtrados: el pase que rompe líneas llega", `${con} vs ${sin}`);
  }

  // CABEZA FRÍA: salir jugando bajo asfixia sale más seguido
  {
    const regalos = rasgos => {
      const m = makeMatch("ESP", "posesion", rasgos);
      m.min = 30;
      let n = 0;
      for (let i = 0; i < 4000; i++) {
        m.seq = null; m.decision = null;
        E.startSequence(m, E.sequenceType("salida_fondo"));
        const antes = m.feed.length;
        m.resolveSequenceAct("jugar");
        if (m.feed.slice(antes).some(l => l.kind === "chance")) n++;
      }
      return n;
    };
    const con = regalos(["cabeza_fria"]), sin = regalos([]);
    assert(con < sin, "Cabeza Fría regala menos salidas: la sacan jugada con dos encima", `${con} vs ${sin}`);
  }

  // EL CARRUSEL: cada pase completado le come piernas al rival
  {
    const energia = rasgos => {
      const m = makeMatch("MAR", "posesion", rasgos);
      m.min = 30;
      for (let i = 0; i < 40; i++) { forcePlay(m, "circulacion", 0); m.seq = null; m.decision = null; }
      const vivos = m.oppLineup.filter(p => !p.expulsado && !p.lesionado);
      return vivos.reduce((a, p) => a + p.energia, 0) / vivos.length;
    };
    assert(energia(["el_carrusel"]) < energia([]), "El Carrusel vacía al rival a base de pases");
  }

  // MORDEDURA FATAL: el Master gana el atajo al básico que ya lo tenía (hookOf best:"p")
  {
    const salta = rasgos => {
      let n = 0;
      for (let i = 0; i < 600; i++) {
        const m = makeMatch("ESP", "press", rasgos);
        m.min = 30; m.my.altura = 4;
        E.startSequence(m, E.sequenceType("recuperacion"));
        if (m.seq?.actIdx === 1) n++;
        m.seq = null; m.decision = null;
      }
      return n;
    };
    const soloBasico = salta(["directo"]);
    const conMaster = salta(["directo", "mordedura_fatal"]);
    assert(conMaster > soloBasico, "Mordedura Fatal manda sobre Directo: gana el mejor atajo, no el comprado primero",
      `${soloBasico} vs ${conMaster}`);
    assert(salta([]) === 0, "sin ninguno de los dos, la recuperación nunca saltea sus actos");

    // …pero la CALIDAD se SUMA. Con el desempate a secas, el básico caía a 0% de
    // participación: un Punto de Identidad gastado en un nodo que dejaba de existir
    // apenas completabas su propia rama. La frecuencia la manda el mejor, el bonus se apila.
    const bonoDelSalto = rasgos => {
      for (let i = 0; i < 600; i++) {
        const m = makeMatch("ESP", "press", rasgos);
        m.min = 30; m.my.altura = 4;
        E.startSequence(m, E.sequenceType("recuperacion"));
        if (m.seq?.actIdx === 1) return m.seq.bonus;
        m.seq = null; m.decision = null;
      }
      return null;
    };
    const uno = bonoDelSalto(["directo"]), dos = bonoDelSalto(["directo", "mordedura_fatal"]);
    assert(uno !== null && dos !== null && Math.abs(dos - uno * 2) < 1e-6,
      "los dos dueños del atajo SUMAN su bonus: el básico sigue aportando después de comprar el Master",
      `${uno} vs ${dos}`);
  }
}

// ---------- La FALTA TÁCTICA: la única jugada nueva del 🦁 Press ----------
{
  const sin = makeMatch("ARG", "press", []);
  E.startSequence(sin, E.sequenceType("repliegue"));
  assert(!sin.decision.options.some(o => o.key === "falta"), "sin el rasgo, contener no ofrece cortarla con falta");

  const con = makeMatch("ARG", "press", ["falta_tactica"]);
  E.startSequence(con, E.sequenceType("repliegue"));
  const op = con.decision.options.find(o => o.key === "falta");
  assert(op && /Cortarla con falta/.test(op.label), "con Falta Táctica la jugada nueva se ofrece por su nombre", op?.label);

  // Mata el ataque SIEMPRE (no hay tirada: por eso existe en el fútbol real) y cobra
  // la amarilla por el mismo camino que cualquier otra (incidents.bookMine).
  {
    const m = makeMatch("ARG", "press", ["falta_tactica"]);
    m.min = 30;
    const tiros = m.stats.oppTiros, tarj = m.stats.tarjetas;
    E.startSequence(m, E.sequenceType("repliegue"));
    m.resolveSequenceAct("falta");
    assert(!m.seq && m.stats.oppTiros === tiros, "cortarla con falta mata el ataque rival sin remate");
    assert(m.stats.tarjetas === tarj + 1, "y cuesta una amarilla, siempre", m.stats.tarjetas - tarj);
    assert(m.my.lineup.filter(p => p.amarillaPartido).length === 1, "la amarilla se la come un jugador MÍO");
    assert(m.feed.some(l => /lo baja antes de que la jugada exista/.test(l.text)), "el momento SE VE en el relato");
    // UNA por partido: sin ese tope, once tarjetas comprarían once ataques rivales muertos
    E.startSequence(m, E.sequenceType("repliegue"));
    assert(!m.decision.options.some(o => o.key === "falta"), "gastada, la opción no vuelve a ofrecerse en todo el partido");
  }

  // La acumulación es REAL: al mismo jugador, la segunda lo expulsa.
  {
    const m = makeMatch("ARG", "press", ["falta_tactica"]);
    m.min = 30;
    for (const p of m.my.lineup) p.amarillaPartido = 1;   // todos apercibidos: la falta expulsa seguro
    E.startSequence(m, E.sequenceType("repliegue"));
    m.resolveSequenceAct("falta");
    assert(m.my.lineup.some(p => p.expulsado), "la segunda amarilla del mismo jugador lo deja afuera: el precio es real");
  }
}

// ---------- PACIENTES: el pase tras el robo busca al MEJOR, no al más cercano ----------
// Reemplazó a Tres Toques, que solo afilaba el atajo de Directo — con Mordedura Fatal
// arriba, la rama entera eran tres versiones del mismo mecanismo.
{
  // El hook `supportUpgrade` estaba clavado a la familia de la contra; ahora va por
  // FAMILIA, como sus hermanos, y por eso un rasgo del Press puede usarlo.
  const t = E.traitById("pacientes");
  assert(t.hooks.supportUpgrade?.of === "recuperacion", "Pacientes declara SU jugada (el robo alto)", t.hooks.supportUpgrade?.of);

  // El efecto es DETERMINISTA, así que se comprueba como tal en vez de por muestreo: con
  // el rasgo, el pase va SIEMPRE al de mejor Tiro de los que quedan (el protagonista no
  // cuenta: él es el que pasa). Medirlo por diferencia de frecuencias era una moneda —
  // sin el rasgo el sorteo ya pondera a los delanteros y acertaba al mejor bastante seguido.
  const receptor = rasgos => {
    for (let i = 0; i < 400; i++) {
      const m = makeMatch("MAR", "press", rasgos);
      m.min = 30; m.my.altura = 4;
      E.startSequence(m, E.sequenceType("recuperacion"));
      let g = 0;
      while (m.seq && g++ < 10) {
        if (!m.decision) { m.resolveSequenceAct(null); continue; }
        if (m.decision.options.some(o => o.key === "asistir")) {
          const prot = m.seq.prot;
          const mates = m.activeMine().filter(p => p !== prot && p.pos !== "POR");
          if (!mates.length) break;
          const mejor = [...mates].sort((a, b) => (b.stats.tiro || 0) - (a.stats.tiro || 0))[0];
          const antes = m.feed.length;
          m.resolveSequenceAct("asistir");
          const nuevo = m.feed.slice(antes).map(l => l.text).join(" | ");
          // OJO al comparar: el relato del gol GRITA el nombre en mayúsculas
          // ("¡GOOOOL DE VINÍCIUS JÚNIOR!"), así que un includes crudo falla justo en
          // los casos en que el rasgo funcionó mejor.
          return { alMejor: nuevo.toUpperCase().includes(mejor.name.toUpperCase()),
                   // El pase de la asistencia se juega de verdad y se puede perder; en ese
                   // caso no hay receptor que comprobar, así que esa muestra no cuenta.
                   llego: !/no encuentra a nadie/.test(nuevo),
                   voz: /mejor ubicado de verdad/.test(nuevo) };
        }
        m.resolveSequenceAct(m.decision.options[0].key);
      }
    }
    return null;
  };
  let con = 0, sin = 0, voz = 0, n = 0, nSin = 0;
  for (let i = 0; i < 60; i++) {
    const a = receptor(["pacientes"]), b = receptor([]);
    if (a?.voz) voz++;
    if (a?.llego) { n++; if (a.alMejor) con++; }
    if (b?.llego) { nSin++; if (b.alMejor) sin++; }
  }
  assert(n > 20 && nSin > 20, "hubo muestras suficientes del desenlace del robo", `${n}/${nSin}`);
  assert(con === n, "con Pacientes el pase que LLEGA va siempre al mejor rematador de los que quedan", `${con}/${n}`);
  assert(sin < nSin, "y sin el rasgo, no: al receptor lo elige el desmarque", `${sin}/${nSin}`);
  assert(voz > 0, "el momento SE VE en el relato", voz);
}

// ---------- EL ZARPAZO: la segunda jugada nueva del 🦁 Press ----------
// Ocupa el slot que era de Egoístas, un nodo que se veía en el 2.8% de los partidos
// porque su efecto solo existía en la circulación — un fútbol que el Press no sortea.
{
  /** Juega una recuperación hasta el desenlace y devuelve la decisión de ese acto. */
  const alDesenlace = (rasgos, tipo = "recuperacion") => {
    for (let i = 0; i < 300; i++) {
      const m = makeMatch("ESP", "press", rasgos);
      m.min = 30; m.my.altura = 4;
      E.startSequence(m, E.sequenceType(tipo));
      let g = 0;
      while (m.seq && g++ < 10) {
        if (!m.decision) { m.resolveSequenceAct(null); continue; }
        if (m.decision.options.some(o => o.key === "rematar")) return { m, opts: m.decision.options.map(o => o.key) };
        m.resolveSequenceAct(m.decision.options[0].key);
      }
    }
    return null;
  };
  const sin = alDesenlace([]);
  assert(sin && !sin.opts.includes("primera"), "sin el rasgo, el desenlace no ofrece rematar de primera", sin?.opts.join());
  const con = alDesenlace(["el_zarpazo"]);
  assert(con && con.opts.includes("primera"), "con El Zarpazo el desenlace del robo alto ofrece la jugada nueva", con?.opts.join());

  // Es de SU familia: el robo alto. En la circulación no existe.
  const otra = alDesenlace(["el_zarpazo"], "circulacion");
  assert(otra && !otra.opts.includes("primera"), "en la circulación no se ofrece: es una jugada del robo", otra?.opts.join());

  // Las dos caras de la apuesta: el gol que el arquero no ve venir, y la tribuna.
  let gol = false, tribuna = false, voz = false;
  for (let i = 0; i < 600 && !(gol && tribuna); i++) {
    const r = alDesenlace(["el_zarpazo"]);
    if (!r) break;
    const antes = r.m.feed.length;
    r.m.resolveSequenceAct("primera");
    const nuevo = r.m.feed.slice(antes).map(l => l.text).join(" | ");
    if (/DE PRIMERA! No la controló/.test(nuevo)) gol = true;
    if (/la manda a la tribuna/.test(nuevo)) tribuna = true;
    if (/La engancha de primera apenas la roban/.test(nuevo)) voz = true;
    assert(!r.m.seq, "el zarpazo cierra la jugada pase lo que pase: no hay rebote");
  }
  assert(gol, "cuando la agarra bien, es gol y el relato lo reconoce");
  assert(tribuna, "y cuando no, se va a la tribuna sin siquiera un remate: es todo o nada");
  assert(voz, "el momento SE VE en el relato");
}

// ---------- EL TECHO DE OPCIONES: cuántas puede juntar UN acto ----------
// El árbol AGREGA opciones a los actos, así que el ancho de una decisión ya no lo decide
// el motor sino la build del DT. La pantalla las reparte en columnas y les asigna una
// tecla; si un acto se pasara de largo, el jugador vería una tecla vacía y una fila
// estrujada. Esto fija el techo real y de dónde sale.
{
  const OPCIONES_TECLA = 6;   // ui/screens/match.KEYS
  // El desenlace es el acto más disputado: tres rasgos de tres filosofías distintas le
  // agregan una opción. Dos de ellos son EXCLUYENTES por familia (Pase Atrás es de la
  // contra y El Zarpazo del robo alto), y eso es justo lo que lo mantiene en cuatro.
  const opcionesDe = (tipo, rasgos, filo, prep) => {
    for (let i = 0; i < 400; i++) {
      const m = makeMatch("MAR", filo, rasgos);
      m.min = 80; m.gMy = 1; m.my.altura = 4;
      if (prep) prep(m);
      E.startSequence(m, E.sequenceType(tipo));
      let g = 0;
      while (m.seq && g++ < 10) {
        if (!m.decision) { m.resolveSequenceAct(null); continue; }
        if (m.decision.options.some(o => o.key === "rematar")) return m.decision.options.map(o => o.key);
        m.resolveSequenceAct(m.decision.options[0].key);
      }
    }
    return null;
  };
  const TODOS = ["el_zarpazo", "pase_atras", "frios"];
  const contra = opcionesDe("transicion", TODOS, "contra");
  const robo = opcionesDe("recuperacion", TODOS, "press");
  assert(contra && contra.includes("pase_atras") && !contra.includes("primera"),
    "en la contra se ofrece el pase atrás y NO el zarpazo", contra?.join());
  assert(robo && robo.includes("primera") && !robo.includes("pase_atras"),
    "y en el robo alto, al revés", robo?.join());
  for (const [nombre, opts] of [["contra", contra], ["robo", robo]])
    assert(opts.length <= OPCIONES_TECLA,
      `el desenlace (${nombre}) entra en las teclas disponibles`, `${opts.length} > ${OPCIONES_TECLA}`);

  // La contención, el otro acto que dos filosofías ensanchan a la vez.
  const cont = (() => {
    const m = makeMatch("ARG", "bloque", ["pelotazo_fuera", "falta_tactica"]);
    m.min = 30;
    E.startSequence(m, E.sequenceType("repliegue"));
    return m.decision.options.map(o => o.key);
  })();
  assert(cont.includes("reventar") && cont.includes("falta"),
    "una build 🦁+🧱 junta las DOS maneras de matar un ataque en el mismo acto", cont.join());
  assert(cont.length === 4 && cont.length <= OPCIONES_TECLA, "y son cuatro, dentro del techo", cont.length);
}

// ---------- Las mecánicas del árbol de POSESIÓN ----------
{
  // --- LA TRAMPA: el Retroceso de posesión es una OPCIÓN NUEVA del acto ---
  {
    const sin = makeMatch("ARG", "posesion", []);
    E.startSequence(sin, E.sequenceType("circulacion"));
    assert(sin.decision.options.length === 2, "sin el rasgo, la construcción ofrece 2 opciones", sin.decision.options.length);

    const con = makeMatch("ARG", "posesion", ["la_trampa"]);
    E.startSequence(con, E.sequenceType("circulacion"));
    assert(con.decision.options.length === 3, "con La Trampa la construcción ofrece 3", con.decision.options.length);
    const back = con.decision.options.find(o => o.key === "atras");
    assert(back && /Retroceso/.test(back.label), "la opción nueva se llama por su nombre", back?.label);

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
    assert(!reaparecio, "gastado el recurso, la opción desaparece del acto");
  }
  {
    let vistoTexto = false, subioBonus = false, guard = 0;
    while (guard++ < 200 && !(vistoTexto && subioBonus)) {
      const m = makeMatch("ARG", "posesion", ["la_trampa"]);
      m.min = 30;
      E.startSequence(m, E.sequenceType("circulacion"));
      const actAntes = m.seq.actIdx, bonusAntes = m.seq.bonus;
      m.resolveSequenceAct("atras");
      if (!m.seq) continue;
      if (m.seq.actIdx === actAntes) {
        if (m.seq.bonus > bonusAntes) subioBonus = true;
        if (m.feed.some(f => /vuelve a armar/.test(f.text))) vistoTexto = true;
      }
    }
    assert(subioBonus, "el retroceso deja el ataque mejor perfilado sin avanzar el acto");
    assert(vistoTexto, "el momento del retroceso SE VE en el relato");
  }
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

  // --- LA MÁQUINA COLECTIVA: la pelota servida tras la circulación larga ---
  {
    let servida = false, empujada = false;
    for (let i = 0; i < 400 && !(servida && empujada); i++) {
      const m = makeMatch("ARG", "posesion", ["maquina_colectiva"]);
      m.min = 30;
      const feed = forcePlay(m, "circulacion", 0);
      if (/solo hay que empujarla/.test(feed)) servida = true;
      if (/Solo tuvo que empujarla/.test(feed)) empujada = true;
    }
    assert(servida, "La Máquina Colectiva deja la pelota servida (el momento SE VE)");
    assert(empujada, "y cuando entra, el relato del gol lo reconoce");

    let nunca = true;
    for (let i = 0; i < 200 && nunca; i++) {
      const m = makeMatch("ARG", "posesion", []);
      m.min = 30;
      if (/empujarla/.test(forcePlay(m, "circulacion", 0))) nunca = false;
    }
    assert(nunca, "sin el Master la pelota nunca queda servida");
  }

  // --- LA FRONTERA: la contra tras mi pérdida muere en offside ---
  {
    let anulada = false, guard = 0;
    while (guard++ < 600 && !anulada) {
      const m = makeMatch("ARG", "posesion", ["la_frontera"]);
      m.min = 30; m.my.altura = 5;
      const feed = forcePlay(m, "circulacion", 1);
      if (/sale de CONTRA/.test(feed) && /offside/.test(feed)) anulada = true;
    }
    assert(anulada, "La Frontera anula la contra rival con la trampa del offside");
    const t = E.traitById("la_frontera");
    assert(t.hooks.offsideTrap && t.hooks.breakawayGuard,
      "La Frontera cubre los DOS canales del balón a la espalda (contra + pelotazo ambiente)");
  }

  // --- EL RONDO: el desgaste del rival, que existía y NO SE VEÍA, ahora se narra ---
  {
    const jugar = rasgos => {
      const m = makeMatch("ARG", "posesion", rasgos);
      for (let g = 0; !m.finished && g < 400; g++) { m.decision = null; m.seq = null; m.tick(); }
      return m.feed.filter(l => /medio partido corriendo detrás/.test(l.text)).length;
    };
    const veces = jugar(["el_rondo"]);
    assert(veces === 1, "El Rondo canta su desgaste UNA vez por partido, en el minuto en que se cobra", veces);
    assert(jugar([]) === 0, "y sin el rasgo no lo dice nunca");
  }

  // --- OSCILADORES: el CAMBIO DE FRENTE, el efecto que aplica en los cuatro cruces ---
  {
    const perdidas = rasgos => {
      let n = 0, casos = 0;
      for (let i = 0; i < 900 && casos < 400; i++) {
        const m = makeMatch("MAR", "posesion", rasgos);   // MAR no es Press: el ×1.39 NO aplica
        m.min = 30;
        E.startSequence(m, E.sequenceType("cambio_frente"));
        if (!m.seq || !m.decision?.options?.some(o => o.key === "largo")) continue;
        casos++;
        const act = m.seq.actIdx;
        m.resolveSequenceAct("largo");
        if (!m.seq || m.seq.actIdx === act) n++;
      }
      return n;
    };
    assert(perdidas(["osciladores"]) < perdidas([]),
      "Osciladores pierde menos diagonales largas — y contra un rival que NO es Press, donde su ×1.39 vale cero");
    const t = E.traitById("osciladores");
    assert(t.hooks.switchPass && t.hooks.poolMod, "el nodo tiene los DOS efectos: el incondicional y el anti-matchup");
  }

  // --- OSCILADORES: la celda de la matriz vuelve a TABLAS, no se invierte ---
  {
    const osc = E.traitById("osciladores").hooks.poolMod;
    assert(osc.vsFilo === E.CAZADOR_DE.posesion, "Osciladores neutraliza contra el cazador de la Posesión", osc.vsFilo);
    const celda = E.counterCell("mine", "posesion", osc.vsFilo);
    assert(celda && celda.circulacion < 1, "la celda que neutraliza es la que castiga a la Posesión");
    const neto = celda.circulacion * osc.weights.circulacion;
    assert(Math.abs(neto - 1) < 0.03, "la circulación vuelve a ~1.00 contra su cazador", neto.toFixed(3));
    assert(neto < 1.05, "empareja el matchup, NO lo invierte (la ley del arco manda sobre la escala cerrada)");
  }
}

// ---------- Las mecánicas del árbol del BLOQUE BAJO ----------
{
  // --- REVENTAR EL BALÓN ---
  {
    const sin = makeMatch("ARG", "bloque", []);
    E.startSequence(sin, E.sequenceType("repliegue"));
    assert(sin.decision.options.length === 2, "sin el rasgo, contener ofrece 2 opciones", sin.decision.options.length);

    const con = makeMatch("ARG", "bloque", ["pelotazo_fuera"]);
    E.startSequence(con, E.sequenceType("repliegue"));
    const rev = con.decision.options.find(o => o.key === "reventar");
    assert(rev && /Reventar el bal/.test(rev.label), "la jugada nueva se ofrece por su nombre", rev?.label);

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

  // --- PIVOTEO AL ÁREA ---
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
      if (m.seq && m.seq.finishStat === "tiro" && m.seq.assistFrom) bajada = true;
    }
    assert(bajada, "el pivoteo baja la pelota al mejor rematador, que define de frente");
  }

  // --- LA MURALLA es de ESTADO ---
  {
    const concede = (gMy, gOpp, rasgos) => {
      const m = makeMatch("ARG", "bloque", rasgos);
      m.min = 30;
      let goles = 0;
      for (let i = 0; i < 6000; i++) {
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

  // --- MARCA ZONAL (raíz): el avance rival muere interceptado antes del remate ---
  {
    let muerto = false;
    for (let i = 0; i < 400 && !muerto; i++) {
      const m = makeMatch("ARG", "bloque", ["marca_zonal"]);
      m.min = 30;
      if (/se topa con una pierna/.test(forcePlay(m, "repliegue", 1))) muerto = true;
    }
    assert(muerto, "Marca Zonal corta el avance rival antes de que llegue a rematar");
  }

  // --- FORTALEZA INEXPUGNABLE: la ocasión clara que no ocurre ---
  {
    let anulada = false;
    for (let i = 0; i < 600 && !anulada; i++) {
      const m = makeMatch("ARG", "bloque", ["fortaleza_inexpugnable"]);
      m.min = 30;
      if (/No hay ocasión clara/.test(forcePlay(m, "circulacion", 1))) anulada = true;
    }
    assert(anulada, "la Fortaleza mata la contra rival antes de que sea ocasión clara");
    const h = E.traitById("fortaleza_inexpugnable").hooks;
    assert(h.oppPoolMod?.vsFilo === "posesion" && Math.abs(1.35 * h.oppPoolMod.weights.repliegue - 1) < 0.03,
      "el sitio de Posesión vuelve a tablas (1.35 × 0.75 ≈ 1.00), sin invertirse");
    assert(h.frustration, "y la frustración acumulada sigue teniendo dueño");
  }

  // --- ESTRATEGIA ENSAYADA: la variante se ve ANTES de elegir, no después ---
  {
    const sin = makeMatch("ARG", "bloque", []);
    E.startSequence(sin, E.sequenceType("balon_parado"));
    assert(!/ENSAYADO/.test(sin.decision.title), "sin el rasgo, el balón parado nunca nace ensayado");

    let ensayado = false, bonoExtra = false;
    for (let i = 0; i < 400 && !(ensayado && bonoExtra); i++) {
      const m = makeMatch("ARG", "bloque", ["estrategia_ensayada"]);
      m.min = 30;
      E.startSequence(m, E.sequenceType("balon_parado"));
      if (!/ENSAYADO/.test(m.decision.title)) continue;
      ensayado = true;   // el TÍTULO lo dice: el DT decide sabiendo que esta es la de la semana
      m.resolveSequenceAct("centro");
      if (m.feed.some(l => /jugada de la semana/.test(l.text))) bonoExtra = true;
    }
    assert(ensayado, "con Estrategia Ensayada el balón parado a veces nace ENSAYADO y el título lo anuncia");
    assert(bonoExtra, "y al resolverlo el momento SE VE en el relato");
  }

  // --- LA SEGUNDA OLA: el rechace de TU balón parado vuelve al área ---
  // Reemplazó a Al Área, que se anunciaba como jugada NUEVA sin serlo: `beachhead` no le
  // pone ninguna opción en la mano al jugador, es una cadena automática.
  {
    const rebotes = rasgos => {
      const m = makeMatch("ARG", "bloque", rasgos);
      m.min = 30;
      let n = 0, casos = 0;
      for (let i = 0; i < 6000 && casos < 3000; i++) {
        m.seq = null; m.decision = null;
        E.startSequence(m, E.sequenceType("balon_parado"));
        if (!m.decision?.options?.some(o => o.key === "centro")) continue;
        casos++;
        const antes = m.feed.length;
        m.resolveSequenceAct("centro");
        if (m.feed.slice(antes).some(l => /el rebote le queda a|REBOTE y gol/.test(l.text))) n++;
      }
      return n;
    };
    assert(rebotes(["segunda_ola"]) > rebotes([]), "La Segunda Ola hace que el rechace vuelva a caer en el área mucho más seguido");

    let visto = false;
    for (let i = 0; i < 600 && !visto; i++) {
      const m = makeMatch("ARG", "bloque", ["segunda_ola"]);
      m.min = 30;
      if (/el área SIGUE LLENA/.test(forcePlay(m, "balon_parado", 0))) visto = true;
    }
    assert(visto, "y el momento SE VE en el relato");

    // Es de TU balón parado: en cualquier otra jugada, el rebote sigue siendo el de siempre.
    const t = E.traitById("segunda_ola");
    assert(t.hooks.secondWave && !t.efecto.some(e => e[0] === "NUEVA"),
      "no se anuncia como jugada nueva: es una cadena, y el catálogo lo dice así");
  }

  // --- LA VOZ DEL TRABAJO DEFENSIVO: los tres nodos que no se veían NUNCA ---
  {
    const habla = (rasgos, tipo) => {
      for (let i = 0; i < 500; i++) {
        const m = makeMatch("ESP", "bloque", rasgos);
        m.min = 30; m.gMy = 1;   // marcador a salvo: la Muralla necesita eso para existir
        const feed = forcePlay(m, tipo, 0);
        if (/le achicaron el ángulo|La muralla no se mueve|Por arriba no se les gana/.test(feed)) return true;
      }
      return false;
    };
    assert(habla(["area_blindada"], "repliegue"), "Área Blindada por fin dice algo cuando el remate rival se falla");
    assert(habla(["muralla"], "repliegue"), "y la Muralla también");
    assert(habla(["dominio_aereo"], "balon_parado_def"), "y Dominio Aéreo en el córner en contra");
    assert(!habla([], "repliegue"), "sin los rasgos, ninguna de esas líneas existe");

    // Habla UNO SOLO: tres voces sobre el mismo despeje serían tres rasgos peleándose
    // por el mismo micrófono.
    let dobles = false;
    for (let i = 0; i < 300 && !dobles; i++) {
      const m = makeMatch("ESP", "bloque", ["area_blindada", "muralla", "dominio_aereo"]);
      m.min = 30; m.gMy = 1;
      const from = m.feed.length;
      E.startSequence(m, E.sequenceType("repliegue"));
      let g = 0;
      while (m.seq && g++ < 10) m.resolveSequenceAct(m.decision?.id === "sequence" ? m.decision.options[0].key : null);
      const voces = m.feed.slice(from).filter(l => /le achicaron el ángulo|La muralla no se mueve|Por arriba no se les gana/.test(l.text)).length;
      if (voces > 1) dobles = true;
    }
    assert(!dobles, "con los tres comprados sigue hablando UNO por despeje, no tres");
  }

  // --- La migración F2 del Bloque: la fortaleza profunda es del Área Blindada ---
  {
    const m = makeMatch("MAR", "bloque", ["area_blindada"], 2);
    assert(E.hasTrait(m, "area_blindada"), "hasTrait lee el nodo");
    assert(E.DEEP_TRAIT.bloque.id === "area_blindada", "deepBloque vive en Área Blindada", E.DEEP_TRAIT.bloque.id);
  }
}

// ---------- Las mecánicas del árbol del CONTRAGOLPE ----------
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

    const otra = makeMatch("ARG", "contra", ["pase_atras"]);
    E.startSequence(otra, E.sequenceType("circulacion"));
    let g2 = 0;
    while (otra.seq && g2++ < 10 && !otra.decision?.options?.some(o => o.key === "rematar")) otra.resolveSequenceAct("seguro");
    assert(!otra.decision.options.some(o => o.key === "pase_atras"), "en la circulación no se ofrece: es una jugada de la contra");
  }

  // --- SIN ESCALAS: la contra nace YA resuelta, en mano a mano ---
  {
    let directo = false;
    for (let i = 0; i < 400 && !directo; i++) {
      const m = makeMatch("MAR", "contra", ["sin_escalas"]);
      m.min = 30;
      E.startSequence(m, E.sequenceType("transicion"));
      if (m.seq && m.seq.oneOnOne && m.seq.actIdx === m.seq.type.plan.length - 1) directo = true;
      m.seq = null; m.decision = null;
    }
    assert(directo, "Sin Escalas saltea los actos intermedios y arranca en el mano a mano");
    let nunca = true;
    for (let i = 0; i < 200 && nunca; i++) {
      const m = makeMatch("MAR", "contra", []);
      E.startSequence(m, E.sequenceType("transicion"));
      if (m.seq?.oneOnOne) nunca = false;
      m.seq = null; m.decision = null;
    }
    assert(nunca, "sin el Master la contra nunca nace resuelta");
  }

  // --- SAQUE RÁPIDO ---
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

  // --- LA PAUSA: la jugada nueva que le enseña al Contra a NO correr ---
  {
    const sin = makeMatch("ARG", "contra", []);
    E.startSequence(sin, E.sequenceType("transicion"));
    assert(!sin.decision.options.some(o => o.key === "pausa"), "sin el rasgo, conducir no ofrece frenar");

    // No existe fuera de la familia de la contra: frenar una circulación no significa nada
    const otra = makeMatch("ARG", "contra", ["la_pausa"]);
    E.startSequence(otra, E.sequenceType("circulacion"));
    assert(!otra.decision.options.some(o => o.key === "pausa"), "en la circulación no se ofrece: es una jugada de la contra");

    let ofrecida = false, mejoro = false, apagada = false, reaparecio = false;
    for (let i = 0; i < 500 && !(ofrecida && mejoro && apagada); i++) {
      const m = makeMatch("ARG", "contra", ["la_pausa"]);
      m.min = 30;
      E.startSequence(m, E.sequenceType("transicion"));
      const hay = m.decision?.options?.find(o => o.key === "pausa");
      if (!hay) continue;                       // la contra nació saltada: no hubo acto de conducir
      ofrecida = true;
      const act = m.seq.actIdx, bonusAntes = m.seq.bonus;
      m.resolveSequenceAct("pausa");
      if (!m.seq) { apagada = true; continue; } // la defensa llegó entera: el precio de frenar
      // Frenar NO avanza la jugada — paga un toque, como el Retroceso de La Trampa
      assert(m.seq.actIdx === act, "la pausa no avanza el acto: se paga un toque", `${act} → ${m.seq.actIdx}`);
      if (m.seq.bonus > bonusAntes) mejoro = true;
      if (m.decision?.options?.some(o => o.key === "pausa")) reaparecio = true;
    }
    assert(ofrecida, "con La Pausa el acto de conducir ofrece la jugada nueva");
    assert(mejoro, "frenar deja el ataque mucho mejor perfilado");
    assert(apagada, "y tiene precio real: a veces la defensa se acomoda y la contra se apaga");
    assert(!reaparecio, "gastada, la opción no vuelve a ofrecerse en esa jugada");

    let visto = false;
    for (let i = 0; i < 300 && !visto; i++) {
      const m = makeMatch("ARG", "contra", ["la_pausa"]);
      m.min = 30;
      E.startSequence(m, E.sequenceType("transicion"));
      if (!m.decision?.options?.some(o => o.key === "pausa")) continue;
      m.resolveSequenceAct("pausa");
      if (m.feed.some(l => /LA PAUSA/.test(l.text))) visto = true;
    }
    assert(visto, "el momento SE VE en el relato");
  }

  // --- EL PASE DE LA CONTRA (Primer Pase, solo el acto que la lanza) ---
  {
    const bonus = rasgos => {
      const m = makeMatch("ARG", "contra", rasgos);
      m.min = 30;
      E.startSequence(m, E.sequenceType("transicion"));
      if (m.seq.actIdx !== 0) return null;
      const antes = m.seq.bonus;
      m.resolveSequenceAct("pase");
      return m.seq ? m.seq.bonus - antes : null;
    };
    const medir = rasgos => { for (let i = 0; i < 50; i++) { const b = bonus(rasgos); if (b !== null) return b; } return null; };
    assert(medir(["primer_pase"]) > medir([]), "Primer Pase paga en el acto que lanza la contra");
  }

  // --- SALIR DE CONTRA: contener el ataque rival encadena MI contra ---
  // Reemplazó a Segundo Aire, que pedía llegar al partido con medio tanque: un estado de
  // partido entero (mi energía NO baja dentro del partido) y no un momento del fútbol.
  {
    let salida = false;
    for (let i = 0; i < 400 && !salida; i++) {
      const m = makeMatch("ARG", "contra", ["salir_de_contra"]);
      m.min = 30;
      if (/CONTUVIERON Y SALIERON/.test(forcePlay(m, "repliegue", 0))) salida = true;
    }
    assert(salida, "Salir de Contra convierte la contención en contra mía (el momento SE VE)");
    let nunca = true;
    for (let i = 0; i < 200 && nunca; i++) {
      const m = makeMatch("ARG", "contra", []);
      m.min = 30;
      if (/CONTUVIERON Y SALIERON/.test(forcePlay(m, "repliegue", 0))) nunca = false;
    }
    assert(nunca, "sin el rasgo, contener nunca lanza la contra");
  }

  // --- EL ENJAMBRE: al que corre la contra le hacen MÁS faltas (el 2º efecto del Master) ---
  {
    const faltas = rasgos => {
      const m = makeMatch("ARG", "contra", rasgos);
      m.min = 30;
      let n = 0;
      for (let i = 0; i < 2500; i++) {
        E.startSequence(m, E.sequenceType("transicion"));
        const antes = m.feed.length;
        if (m.decision?.options?.some(o => o.key === "conducir")) m.resolveSequenceAct("conducir");
        if (m.feed.slice(antes).some(l => /PENAL|Falta sobre/.test(l.text))) n++;
        m.seq = null; m.decision = null;
      }
      return n;
    };
    assert(faltas(["el_enjambre"]) > faltas([]), "con El Enjambre, conducir la contra termina en falta más seguido");
  }

  // --- EL ANZUELO: la neutralización del partido muerto ---
  {
    const h = E.traitById("el_anzuelo").hooks;
    assert(h.poolMod.vsFilo.includes("contra") && h.poolMod.vsFilo.includes("bloque"),
      "el anzuelo neutraliza SOLO contra los que esperan");
    assert(Math.abs(0.6 * h.poolMod.weights.transicion - 1) < 0.05,
      "la transición vuelve a ~1.00 contra el que espera (a tablas, no invertida)", (0.6 * h.poolMod.weights.transicion).toFixed(3));
    let picaron = false, esperador = false;
    for (let i = 0; i < 400 && !picaron; i++) {
      const m = makeMatch("SWE", "contra", ["el_anzuelo"]);
      m.min = 30;
      E.maybeStartSequence(m); m.seq = null; m.decision = null;
      if (["contra", "bloque"].includes(m._seqPlan?.oppFilo?.id)) esperador = true;
      if (/Picaron el ANZUELO/.test(forcePlay(m, "circulacion", 0))) picaron = true;
    }
    assert(esperador, "el rival de prueba es de los que esperan");
    assert(picaron, "el rival que espera pica el anzuelo y la circulación-cebo se vuelve contra");
  }

  // --- EL FILTRO POR FAMILIA: dos filosofías con el mismo hook para jugadas distintas ---
  {
    const m = makeMatch("ARG", "press", ["directo", "ataque_relampago"]);
    assert(E.hookOf(m, "skipToFinish", "recuperacion")?.traitId === "directo", "el hook de la recuperación es el del Press");
    assert(E.hookOf(m, "skipToFinish", "transicion")?.traitId === "ataque_relampago", "y el de la contra es el del Contragolpe");
    assert(E.hookOf(m, "skipToFinish", "circulacion") === null, "y para una jugada que ninguno cubre, ninguno");
  }
}

// ---------- La migración F2: el efecto profundo responde al RASGO, no a la etapa ----------
{
  const mSin = makeMatch("MAR", "posesion", [], 2);
  const mCon = makeMatch("MAR", "posesion", ["desesperantes"], 2);
  assert(!E.hasTrait(mSin, "desesperantes") && E.hasTrait(mCon, "desesperantes"), "hasTrait lee matchCtx.filo.rasgos");
  E.startSequence(mSin, E.sequenceType("sinfonia"));
  assert(!mSin.seq.plan, "Consolidada sin el rasgo: la sinfonía queda en 3 compases (la migración quitó el regalo)");
  mSin.seq = null; mSin.decision = null;
  E.startSequence(mCon, E.sequenceType("sinfonia"));
  assert(mCon.seq.plan && mCon.seq.plan.filter(k => k === "build").length === 4, "con Desesperantes la sinfonía gana su 4º compás");
}

// ---------- Fatiga del rival + Congelar ----------
{
  {
    const m = makeMatch("ARG", "posesion", []);
    const antes = m.oppLineup.map(p => p.energia);
    assert(antes.every(e => e === 100), "el once rival arranca al 100%");
    for (let g = 0; !m.finished && g < 400; g++) { m.decision = null; m.seq = null; m.tick(); }
    const fin = m.oppLineup.filter(p => !p.expulsado && !p.lesionado).map(p => p.energia);
    assert(fin.every(e => e < 100), "tras los 90 minutos el rival YA no está fresco", fin[0]);
    assert(fin.every(e => e > 40 && e < 70), "termina cerca de 58: el mismo dial que paga mi equipo", fin[0]);
  }
  {
    const drena = rasgos => {
      const m = makeMatch("ARG", "posesion", rasgos);
      for (let g = 0; !m.finished && g < 400; g++) { m.decision = null; m.seq = null; m.tick(); }
      const vivos = m.oppLineup.filter(p => !p.expulsado && !p.lesionado);
      return vivos.reduce((a, p) => a + p.energia, 0) / Math.max(1, vivos.length);
    };
    assert(drena(["el_rondo"]) < drena([]), "El Rondo deja al rival más gastado al final");
  }
  {
    const m = makeMatch("ARG", "posesion", []);
    const fresco = m.powers().opp.def;
    for (const p of m.oppLineup) p.energia = 20;
    assert(m.powers().opp.def < fresco, "un rival sin piernas defiende peor (energyMult, sin canaria nueva)");
  }

  // --- CONGELAR (Fríos, ahora en 🎼 Posesión): solo desde el minuto 70 y sin ir perdiendo ---
  {
    const conFrios = (min, gMy, gOpp) => {
      const m = makeMatch("ARG", "posesion", ["frios"]);
      m.min = min; m.gMy = gMy; m.gOpp = gOpp;
      E.startSequence(m, E.sequenceType("circulacion"));
      let guard = 0;
      while (m.seq && guard++ < 20) {
        if (!m.decision) { m.resolveSequenceAct(null); continue; }
        const opts = m.decision.options.map(o => o.key);
        if (opts.includes("rematar")) return opts;
        m.resolveSequenceAct("seguro");
      }
      return null;
    };
    assert(conFrios(75, 1, 0)?.includes("congelar"), "ganando en el minuto 75 se puede congelar");
    assert(conFrios(75, 1, 1)?.includes("congelar"), "empatando en el tramo final también (decisión PO)");
    assert(!conFrios(75, 0, 1)?.includes("congelar"), "perdiendo NO se congela");
    assert(!conFrios(40, 1, 0)?.includes("congelar"), "ganando temprano tampoco: es un recurso de cierre");
    const sinRasgo = (() => {
      const m = makeMatch("ARG", "posesion", []);
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
    assert(sinRasgo && !sinRasgo.includes("congelar"), "sin Fríos la opción no existe");
  }

  // --- Congelar CAMBIA mi ocasión por la del rival: le descuenta una llegada ---
  {
    let visto = false, guard = 0;
    while (guard++ < 60 && !visto) {
      const m = makeMatch("ARG", "posesion", ["frios"]);
      m.min = 75; m.gMy = 1;
      E.maybeStartSequence(m); m.seq = null; m.decision = null;
      E.startSequence(m, E.sequenceType("circulacion"));
      let steps = 0;
      while (m.seq && steps++ < 20) {
        if (!m.decision) { m.resolveSequenceAct(null); continue; }
        const opts = m.decision.options.map(o => o.key);
        if (opts.includes("congelar")) {
          const target = m._seqPlan.target;
          m.resolveSequenceAct("congelar");
          assert(m._frozen === 1, "congelar deja el crédito anotado", m._frozen);
          assert(!m.seq, "la jugada muere sin remate: se resignó el ataque");
          assert(m.feed.some(f => /reloj/.test(f.text)), "el momento SE VE en el relato");
          let g2 = 0;
          while (m._frozen > 0 && g2++ < 400) { m.seq = null; m.decision = null; m._seqCount = 0; E.maybeStartSequence(m); }
          assert(m._frozen === 0, "el crédito se consume contra una secuencia rival", m._frozen);
          assert(m._seqPlan.target < target, "la llegada rival se PIERDE, no se pospone", `${target} -> ${m._seqPlan.target}`);
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
