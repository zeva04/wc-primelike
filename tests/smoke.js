/* ============================================================
   Smoke test: simula runs COMPLETAS sin UI, con decisiones al
   azar, y verifica invariantes del motor en cada una. Es el
   árbitro de la migración y del balance: si el % de campeón se
   mueve fuera del ruido tras tocar código, algo se rompió.

   Desde F7 usa el flujo REAL del motor (autoLineup,
   nextOpponentId, closeMatch, advanceStage): cero reglas
   duplicadas.

   Uso:
     node tests/smoke.js                  → 300 runs, equipo al azar
     node tests/smoke.js --runs=1500 --team=BRA
     node tests/smoke.js --all [--runs=100]   → tabla por selección
     node tests/smoke.js --smart --runs=4000 --team=BRA → el TECHO (DT greedy)
   ============================================================ */
import { loadEngine } from "./load-engine.js";

const { Engine: E, WC_DATA } = await loadEngine();

// ---------- argumentos ----------
const args = Object.fromEntries(process.argv.slice(2).map(a => {
  const m = a.match(/^--([^=]+)(?:=(.*))?$/);
  return m ? [m[1], m[2] ?? true] : [a, true];
}));
const ALL = !!args.all;
const RUNS = +args.runs || (ALL ? 100 : 300);
const TEAM = args.team || null;
// --action=<id|grupo>: fija la Acción del Día (p. ej. `entrenar`, `recuperar`, `tactica`)
// para COMPARAR ESTRATEGIAS y comprobar que ninguna domina (Bible §4.7: no dominant
// strategy). Con el flag no se toman oportunidades: la comparación es entre acciones.
const ACTION = args.action || null;
// --filo=<id>: fija la FILOSOFÍA de todas las runs (press|posesion|contra|bloque) para
// fotografiar cada identidad por separado (F2): separa el costo de una identidad del
// ruido del azar. Sin el flag, se elige al azar (el PISO de siempre).
const FILO = args.filo || null;
// --altura=<1..5>: fija la ALTURA DEL BLOQUE de todas las runs (sprint del Territorio).
// Es el gate propio de esa palanca: NINGUNA altura puede dominar a las otras (mismo
// criterio que --action con las acciones del día). Sin el flag se juega en MEDIO, que
// es donde todos los multiplicadores territoriales valen ×1 — o sea, la línea base
// histórica del juego no se mueve por el hecho de que la palanca exista.
const ALTURA = +args.altura || 3;
// --formacion=<id>: fija el DIBUJO de todas las runs (1-1-3 … 3-1-1). Es el gate del
// sprint del Eje Horizontal: una línea de TRES ocupa los tres carriles, así que el dibujo
// pasa a decidir cuánto fútbol por afuera existe — y ningún dibujo puede quedar dominado.
const FORMACION = args.formacion || null;
// --smart: el DT GREEDY del arco del Meta (M1) — el smoke al azar mide el PISO de la
// mecánica; este flag mide el TECHO de una estrategia óptima simple. El arco cambia la
// estrategia dominante y el azar no la ve. Compone con --filo/--team; excluye --action
// (el greedy YA decide la acción cada día). Heurísticas acordadas con el PO (M1).
const SMART = !!args.smart;
// --focus: el DT compra CON INTENCIÓN — solo en el árbol de su escuela y siempre lo más
// profundo disponible (sube por una rama en vez de esparcir PI). Es el techo REAL del
// árbol: sin esto el árbitro compra al azar entre los 4 árboles y casi nunca completa
// una rama hasta el Maestro, así que la tasa de Master del smoke subestima al jugador.
const FOCUS = !!args.focus;
// --counter: el DT CONTRA-ELECTOR (sprint del Rival que Decide). Igual que --smart,
// pero antes de cada partido lee la identidad del rival en el informe y declara el
// Plan de Partido que la CAZA (content/philosophies.COUNTER_CYCLE). Es un flag aparte
// y NO un cambio de --smart a propósito: los anclajes de CORE §10 (piso ~19% · techo
// ~30%) se fijaron contra la política de --smart, y re-basarla en silencio volvería a
// dejar el techo derivando, que es justo el trinquete que el PO cerró el 1-ago.
// Calibración del instrumento: ANTES del sprint tiene que medir lo mismo que --smart
// (la interacción del matchup medía 0.0pp); si separa después, el sprint mordió.
// `--counter` = contra-elige SIEMPRE que el cruce no esté ya ganado (el greedy literal).
// `--counter=huir` = contra-elige SOLO para escapar de un cruce PERDIDO, y en cualquier
// otro caso sigue consolidando. Es la hipótesis del DT humano: la Acción del Día es
// escasa y repartir la XP entre cuatro ideas cuesta caro, así que el cambio se guarda
// para cuando de verdad duele. Los dos se miden porque la diferencia ES el hallazgo.
const COUNTER = !!args.counter;
const COUNTER_HUIR = args.counter === "huir";
const TIER_ORDER = { master: 3, advanced: 2, intermediate: 1, basic: 0 };
if (SMART && ACTION) { console.error("--smart y --action son excluyentes: el greedy ya decide la acción del día"); process.exit(1); }
if (COUNTER && !SMART) { console.error("--counter necesita --smart: es el mismo DT greedy, con contra-elección"); process.exit(1); }

let fails = 0, avisoFormacion = false;
// [−1, 0, +1] → cuántos partidos se jugaron con el cruce del ciclo perdido / neutro / ganado,
// y cuántos de esos se GANARON. Sin el win% por cruce no se puede distinguir "el ciclo no
// paga" de "el DT no llega a usarlo": el banco de partidos y el smoke miden cosas distintas
// y la lección del sprint de la Densidad es que hay que componerlas a mano antes de comparar.
const CRUCES = [0, 0, 0], CRUCES_W = [0, 0, 0];
let cruceActual = 1;
const assert = (cond, msg, ctx) => { if (!cond) { fails++; console.error("FAIL:", msg, ctx || ""); } };

// ---------- el DT greedy del techo (--smart, heurísticas acordadas con el PO en M1) ----------
// Prioridad de cada día: (1) Recuperar SOLO si la energía media del ONCE proyectado cae
// bajo SMART_RECOVER_AT — el umbral de la banda verde: recuperar fresco es un día tirado;
// (2) Bonding solo con moral ≤40 (la misma regla situacional del piso); (3) Sesión
// Táctica al foco de las aristas de SU filosofía hasta Consolidada — la tesis del arco:
// lo importante es que el equipo MEJORE; (4) después, Entrenar (defensa: mueve 2 stats
// por día, el canje greedy lo convierte al doble de ritmo). NUNCA cambia de filosofía
// (mejorar > resetear) y NO toma Oportunidades: mide estrategia pura, comparable con las
// fotos de --action. Si el modificador del día bloquea la elección, cae a la siguiente.
const SMART_RECOVER_AT = E.ENERGY_OK; // el umbral de la banda verde: una sola fuente
function smartDayAction(run, opts) {
  const has = id => opts.find(a => a.id === id);
  const { lineup } = E.currentLineup(run.squad, null, FORMACION);
  const avg = lineup.reduce((s, p) => s + p.energia, 0) / (lineup.length || 1);
  if (avg < SMART_RECOVER_AT && has("recuperar")) return has("recuperar");
  if ((run.moral ?? 50) <= 40 && has("bonding")) return has("bonding");
  // CONTRA-ELECCIÓN (--counter): la identidad del próximo rival es información que el
  // informe ya da gratis, así que un DT competente la usa. Declara el Plan que CAZA a
  // esa idea si no es la que ya está jugando. Paga el precio completo del sistema —
  // gasta la Acción del Día y reparte su XP entre varias filosofías en vez de
  // consolidar una— y ese precio es justamente lo que el gate del sprint tiene que ver.
  if (COUNTER) {
    const oppId = E.nextOpponentId(run);
    const rf = oppId ? E.rivalFilo(E.getTeam(oppId), E.koRoundOf(run.stage)) : null;
    const cazador = rf ? E.CAZADOR_DE[rf.id] : null;
    // En modo `huir` solo se paga el cambio si el cruce actual está PERDIDO.
    const duele = !COUNTER_HUIR || E.counterEdge(run.filoId, rf?.id) < 0;
    if (cazador && duele && cazador !== run.filoId && has(`plan_${cazador}`)) return has(`plan_${cazador}`);
  }
  // Arco de Progresión: el greedy declara el PLAN DE PARTIDO de su ESCUELA mientras esa
  // idea no esté en el techo (×2 de afinidad × ×1.5 del plan = la vía más rápida al nivel
  // 10 y, por la escalera de recompensas, al DT 20). En el techo abre la siguiente más afín.
  const escuela = run.filoInicial;
  if (escuela) {
    const orden = E.PHILOSOPHIES.map(p => p.id).sort((a, b) => E.afinidadMult(escuela, b) - E.afinidadMult(escuela, a));
    for (const id of orden) {
      if (E.filoLevel(run, id) >= 9) continue;
      const plan = has(`plan_${id}`);
      if (plan) return plan;
    }
  }
  return has("entrenar_defensa") || has("entrenar_ataque") || has("entrenar_pases") || opts[0];
}

// ---------- un partido interactivo con decisiones al azar ----------
function playMatch(run, oppId) {
  const me = E.getTeam(run.teamId);
  const opp = E.getTeam(oppId);
  const available = run.squad.filter(p => !p.suspendido && p.lesionadoPartidos === 0);
  for (const p of available) assert(!p.suspendido, "jugador suspendido en available");
  // Misma puerta que usan las pantallas: arma el once, lo ordena por slots y asigna los
  // puestos (limpiando los que quedaron del partido anterior). Llamar a autoLineup pelado
  // dejaría `posJugada` pegado de un cambio previo y castigaría a ese jugador para siempre.
  const { lineup, formationId } = E.currentLineup(run.squad, null, FORMACION);
  // TRAMPA DEL BANCO (hallazgo del sprint del Eje Horizontal): si el plantel no puede
  // armar el dibujo pedido, currentLineup cae a otro EN SILENCIO — y la medición pasa a
  // ser de una formación distinta a la que dice el flag. BRA, por ejemplo, tiene 2
  // defensas: --formacion=3-1-1 medía un 2-1-2. Se avisa una vez y se sigue.
  if (FORMACION && formationId !== FORMACION && !avisoFormacion) {
    avisoFormacion = true;
    console.log(`  ⚠️  el plantel de ${run.teamId} no puede armar ${FORMACION}: se está jugando ${formationId}`);
  }
  const val = E.validateLineup(available, lineup);
  assert(val.ok, "autoLineup debe producir alineación válida",
    `[${val.msg}] once: ${lineup.map(p => `${p.pos}:${p.name}`).join(", ")} · fuera: ${run.squad.filter(p => p.suspendido || p.lesionadoPartidos > 0).map(p => `${p.name}(${p.pos}${p.suspendido ? " susp" : " les" + p.lesionadoPartidos})`).join(", ") || "nadie"}`);
  // Única excepción admitida (bug fix, 2-ago-2026): el arquero de EMERGENCIA, cuando el
  // plantel se quedó sin ningún POR disponible. Fuera de ese caso, el once automático
  // sigue sin poder castigar a nadie.
  assert(lineup.every(p => E.outOfPosPenalty(p) === 0 || (p.pos !== "POR" && E.playedPos(p) === "POR")),
    "el once automático no castiga a nadie salvo al arquero de emergencia (si hace falta uno)",
    lineup.filter(p => E.outOfPosPenalty(p) > 0).map(p => `${p.name}:${p.pos}->${p.posJugada}`).join(", "));
  const bench = available.filter(p => !lineup.includes(p));
  // matchCtx homólogo al de screens/match.js (la moral entra al generador por acá — A3;
  // la filosofía viaja igual desde F1: {id, nivel}, el Match no conoce la run)
  const ctx = { team: me, lineup, bench, mentalidad: "normal", altura: ALTURA, buffs: { ...run.buffs }, moral: run.moral, filo: E.filoCtx(run), koRound: E.koRoundOf(run.stage) };
  const banned = run.rivalBans[oppId] || [];
  const match = new E.Match(ctx, opp, run.stage !== "groups", banned);
  // Escalada R2 + identidad (R3 + el dial del techo): el once rival lleva forma de torneo
  // × el multiplicador de identidad exacto para la ronda y MI nivel — el castigo si llego
  // con menos idea y la vara alta si llego con más (×1 en grupos, y ×1 en el partido parejo).
  const koR = E.koRoundOf(run.stage);
  const fc = E.filoCtx(run);
  const formaEsperada = E.tourneyFormaMult(koR) * E.identityGapMult(opp, fc?.etapa, koR, fc?.nivel);
  assert(match.oppLineup.every(p => Math.abs(p.forma - formaEsperada) < 1e-9), "la forma del rival cuadra con ronda y brecha", `${run.stage} → ${formaEsperada}`);
  // La suspensión por roja ajena es real: el suspendido no puede estar en el once rival
  for (const name of banned) assert(!match.oppLineup.some(p => p.name === name), "suspendido fuera del once rival", name);
  assert(match.oppLineup.length === 6, "el rival siempre forma 6 (los genéricos cubren al suspendido)");
  assert(match.oppLineup.some(p => p.pos === "POR"), "el rival nunca se queda sin arquero");
  // Bug fix 2-ago-2026: MI arco tampoco puede arrancar vacío (playedPos, no p.pos: admite
  // al arquero de emergencia cuando ningún POR real está disponible en el plantel).
  assert(ctx.lineup.some(p => E.playedPos(p) === "POR"), "mi arco nunca arranca vacío", ctx.lineup.map(p => `${p.name}:${p.pos}->${p.posJugada}`).join(", "));
  // El Momento es poder asimétrico POR DATOS: ningún rival debe llevar el campo
  assert(match.oppLineup.every(p => p.momento === undefined), "los rivales no tienen Momento");
  let guard = 0;
  while (!match.finished && guard++ < 500) {
    const r = match.tick();
    if (match.decision) {
      const d = match.decision;
      const opt = d.options[Math.floor(Math.random() * d.options.length)];
      if (d.id === "sequence") match.resolveSequenceAct(opt.key);
      else if (d.id === "penalty_mine") match.resolvePenaltyMine(opt.key);
      else if (d.id === "penalty_opp") match.resolvePenaltyOpp(opt.key);
      else if (d.id === "last_man") match.resolveLastMan(opt.key);
      else if (d.id === "injury_sub") {
        // En la UI el reemplazo del lesionado es manual (Gestión en vivo); acá se emula
        // con un elegible al azar — mismo efecto que la lista vieja para el balance.
        match.decision = null;
        const elig = match.eligibleFor(d.player);
        if (elig.length) match.makeSub(d.player, elig[Math.floor(Math.random() * elig.length)].name);
      }
      else if (d.id === "gk_red") { match.decision = null; match.makeSub(match.my.lineup.find(p => p.name === opt.key), d.gkIn, true); }
      else if (d.id === "gk_emergency") match.resolveGkEmergency(opt.key);
      else match.decision = null;
    } else if (r === "pens") {
      match.startShootout();
      // Guard anti-loop-infinito, NO una afirmación sobre cuánto dura una tanda: con 60
      // (25 rondas de muerte súbita empatadas) fallaba ~1 de cada 100.000 tandas por una
      // tanda larga perfectamente legal. Medido: promedio 10,6 patadas, 0,03% pasa de 40.
      let pGuard = 0;
      while (!match.shootoutStatus().done && pGuard++ < 200) {
        const s = match.shootoutStatus();
        if (s.my.length <= s.opp.length) {
          const onField = ctx.lineup.filter(p => !p.expulsado && !p.lesionado);
          match.shootMyPen(onField[Math.floor(Math.random() * onField.length)].name, E.pick(["izq", "centro", "der"]));
        } else match.shootOppPen(E.pick(["izq", "centro", "der"]));
      }
      assert(pGuard < 200, "tanda de penales no terminó");
    }
  }
  assert(guard < 500, "partido no terminó (loop guard)");
  // EL EQUIPO NUNCA JUEGA SIN ARQUERO (bug fix, 2-ago-2026): al cerrar el partido, si
  // queda alguien activo en cancha, uno de ellos tiene que estar jugando de arquero —
  // sea el titular, un suplente, o el arquero de emergencia (playedPos, no p.pos: el
  // de emergencia nunca es un POR de verdad).
  const activos = match.activeMine();
  if (activos.length) {
    assert(activos.some(p => E.playedPos(p) === "POR"), "el arco nunca queda vacío al cierre del partido", activos.map(p => `${p.name}:${p.pos}->${p.posJugada}`).join(", "));
  }
  return match;
}

// ---------- una run completa (flujo real del motor) ----------
function playRun(teamId) {
  const run = E.newRun(teamId);
  assert(run.journal.length === 1, "el diario debe abrir con el sorteo");
  // Filosofía AL AZAR (F1): el smoke mide el PISO de la mecánica — un DT real elige
  // mirando su grupo y sus focos; acá nadie optimiza. No calibrar el techo con esto.
  const filoElegida = E.choosePhilosophy(run, FILO || E.PHILOSOPHIES[Math.floor(Math.random() * E.PHILOSOPHIES.length)].id);
  assert(filoElegida && run.filoId === filoElegida.id, "la elección de filosofía queda en la run");
  // El flujo de inicio del arco de Rasgos (T1): elegir filosofía acredita el PI del
  // nivel 1, y el DT gasta su 1-de-3 en un básico al azar (el PISO: nadie optimiza).
  assert(run.identityPoints === 1, "elegir filosofía acredita el PI inicial", run.identityPoints);
  {
    const opciones = E.traitTree(run).filter(t => t.buyable);
    // 3 en casi todas; 4 en el Bloque bajo, cuya Firma abre con dos básicos que
    // convergen (rediseño del 30-jul-2026).
    const basicos = E.traitsOf(run.filoId, "basic").length;
    assert(opciones.length === basicos, "los básicos de la filosofía están comprables al inicio", `${opciones.length}/${basicos}`);
    const elegido = opciones[Math.floor(Math.random() * opciones.length)];
    assert(E.buyTrait(run, elegido.id), "el 1-de-3 del inicio se compra", elegido.id);
    assert(run.identityPoints === 0 && E.activeTraitIds(run).length === 1, "la compra cobra el PI");
  }
  let alive = true, champion = false, guard = 0;
  let oppSeen = 0, oppTaken = 0; // contabilidad paralela de oportunidades (audita run.stats)
  const dailySeen = new Map();   // texto de titular → último día en portada (bug PO 22-jul: sin repetirse en la semana)

  while (alive && guard++ < 60) {
    let dayGuard = 0, oppDays = 0;
    while (run.day < run.nextMatchDay && dayGuard++ < 10) {
      // Acción del Día del día actual (mismo orden que la UI: evento → acción → avanzar).
      // Solo entre las acciones disponibles: los modificadores del día pueden bloquear.
      // La Oportunidad viva compite como una opción más (Bible §4.5).
      if (run.actionPending) {
        const opp = E.dayOpportunity(run);
        // El Team Bonding es SITUACIONAL: solo vale la pena con el vestuario caldeado
        // (moral ≤40 = bandas baja/suelo, la misma condición que avisa el hub). Ofrecerlo
        // SIEMPRE modelaría a un DT que quema días subiendo una moral que ya está bien:
        // medido, eso solo por dilución hundía a BRA −2.5pp aunque el Bonding fuera gratis.
        // Mismo criterio que el canje greedy: el smoke debe decidir como decidiría alguien.
        let opts = E.DAY_ACTIONS.filter(a => E.actionMult(run, a) > 0 && (a.id !== "bonding" || (run.moral ?? 50) <= 40));
        // Los 5 focos de la Sesión Táctica (F1) se COLAPSAN a uno al azar por día: si
        // entraran los 5 al sorteo uniforme, la táctica pasaría de ~1/5 a ~5/9 de los
        // días y la comparación con el baseline pre-F1 quedaría envenenada. El foco
        // al azar dentro del grupo es justamente el PISO que este smoke mide.
        // (con --smart NO se colapsa: el greedy elige su foco exacto, y tampoco entra
        // la Oportunidad — ver smartDayAction)
        const tacRows = opts.filter(a => a.group === "tactica");
        if (!SMART && tacRows.length) opts = opts.filter(a => a.group !== "tactica").concat(tacRows[Math.floor(Math.random() * tacRows.length)]);
        assert(opts.length > 0, "ningún modificador puede bloquear TODAS las acciones");
        if (opp && !SMART) opts.push(opp);
        const blocked = E.DAY_ACTIONS.find(a => E.actionMult(run, a) === 0);
        if (blocked) assert(E.applyDayAction(run, blocked.id) === null, "una acción bloqueada no debe aplicarse", blocked.id);
        // Con --action se juega SIEMPRE esa estrategia (si hoy está disponible); si no, al azar.
        const forced = ACTION ? opts.filter(x => x.id === ACTION || x.group === ACTION) : [];
        const pool = forced.length ? forced : opts;
        const a = SMART ? smartDayAction(run, opts) : pool[Math.floor(Math.random() * pool.length)];
        let res;
        if (opp && a.id === opp.id && opp.choose) {
          // La oportunidad con elección exige objetivo: sin él no se aplica, y un
          // candidato al azar (como haría un jugador) sí
          assert(E.applyDayAction(run, a.id) === null, "con choose y sin objetivo no debe aplicarse", a.id);
          const cands = opp.choose.candidates(run);
          assert(cands.length > 0, "la oportunidad con elección siempre tiene candidatos", opp.id);
          res = E.applyDayAction(run, a.id, cands[Math.floor(Math.random() * cands.length)].name);
        } else res = E.applyDayAction(run, a.id);
        assert(res, "la acción del día debe aplicarse", a.id);
        if (opp && a.id === opp.id) { oppTaken++; assert(res.mult === 1, "el modificador del día no escala la oportunidad", a.id); }
        assert(!run.actionPending, "aplicar la acción consume el turno del día");
      }
      // Canje de entrenamiento (game/day-action): si un buff llegó al umbral, el DT lo
      // convierte en crecimiento permanente. Greedy (siempre que se pueda) para medir el
      // TECHO del balance de una feature asimétrica; es gratis y no consume rng.
      // `--nocanje` lo apaga para medir el baseline (TRAIN_BUFF=1 sin la feature).
      for (let cGuard = 0; !args.nocanje && E.canjeableBuffs(run).length && cGuard < 20; cGuard++) {
        const c = E.canjeableBuffs(run)[0];
        const buffBefore = run.buffs[c.key];
        const before = run.squad.filter(p => p.stats[c.key] !== undefined).map(p => ({ p, v: p.stats[c.key] }));
        const res = E.canjeBuff(run, c.key);
        assert(res && res.key === c.key, "el canje ofrecido debe aplicarse", c.key);
        assert((run.buffs[c.key] || 0) === buffBefore - E.CANJE_THRESHOLD, "el canje descuenta el umbral del buff", `${c.key}: ${buffBefore}→${run.buffs[c.key] || 0}`);
        for (const b of before) {
          assert(b.p.stats[c.key] === Math.min(99, b.v + E.CANJE_PERMANENT), "el canje suma el crecimiento permanente con techo 99", `${b.p.name} ${b.v}→${b.p.stats[c.key]}`);
          assert(b.p.stats[c.key] >= b.v, "el crecimiento permanente nunca decrece", b.p.name);
        }
      }
      // El árbol de Rasgos (T1): el DT del piso gasta cada PI disponible en un rasgo
      // comprable al azar apenas lo tiene (la compra es gratis en tiempo — no consume
      // acción). Con solo los básicos en el pool, el árbol se agota rápido.
      for (let tGuard = 0; run.identityPoints > 0 && tGuard < 10; tGuard++) {
        let buyables = E.PHILOSOPHIES.flatMap(p => E.traitTree(run, p.id)).filter(t => t.buyable);
        if (FOCUS) {
          const propios = buyables.filter(t => t.filo === run.filoInicial);
          if (propios.length) buyables = propios.sort((a, b) => TIER_ORDER[b.tier] - TIER_ORDER[a.tier]);
        }
        if (!buyables.length) break;
        const piAntes = run.identityPoints;
        const elegido = FOCUS ? buyables[0] : buyables[Math.floor(Math.random() * buyables.length)];
        assert(E.buyTrait(run, elegido.id), "el rasgo comprable se compra");
        assert(run.identityPoints === piAntes - 1, "cada compra cobra exactamente 1 PI");
      }
      const ev = E.advanceDay(run);
      if (run.dayOpp) {
        oppDays++; oppSeen++;
        assert(oppDays <= 1, "máx 1 oportunidad por ventana entre partidos");
        assert(E.dayOpportunity(run), "la oportunidad viva debe existir en el pool", run.dayOpp.id);
        // Un solo estímulo por día (bug PO 22-jul): el día de la Oportunidad no trae evento
        assert(ev && ev.type === "tranquilo", "el día de la Oportunidad amanece tranquilo", ev && ev.type);
      }
      // El mundo jugó "anoche": las entradas de lastNight deben estar completas
      for (const n of run.lastNight) {
        assert(n.a && n.b && Number.isInteger(n.gA) && Number.isInteger(n.gB), "resultado de anoche completo", JSON.stringify(n));
        if (run.stage !== "groups") assert(n.win === n.a || n.win === n.b, "cruce ajeno con ganador válido");
      }
      // El World Cup Daily se lee al llegar al día nuevo (mismo orden que la UI)
      const daily = E.buildDaily(run);
      assert(daily.items.length >= 1 && daily.items.length <= 5, "el Daily trae 1-5 titulares", daily.items.length);
      for (const it of daily.items) {
        assert(it.icon && it.text && it.tag, "titular completo (icon/text/tag)", JSON.stringify(it));
        if (it.tag === "PORTADA") continue;
        const prev = dailySeen.get(it.text);
        assert(!(prev >= run.day - 6 && prev < run.day), "titular repetido en la misma semana", it.text);
        dailySeen.set(it.text, run.day);
      }
      if (ev && ev.type === "conflicto") {
        const opt = ev.options[Math.floor(Math.random() * ev.options.length)];
        const res = opt.effect(run);
        E.addJournal(run, { icon: ev.icon, tone: "neutral", title: ev.title, desc: `Elegiste "${opt.label}". ${res}` });
      }
    }
    assert(!run.actionPending, "el día de partido no debe tener acción pendiente");
    assert(!run.dayOpp, "el día de partido no trae oportunidad (y la de ayer expiró sin rastro)");
    // Edición de día de partido: la tapa es el partido, nada compite con el clímax
    const matchDaily = E.buildDaily(run);
    assert(matchDaily.isMatchDay && matchDaily.items[0].tag === "PORTADA", "el Daily de día de partido abre con la tapa del partido");
    const oppId = E.nextOpponentId(run);
    // GATE DEL SPRINT DEL RIVAL QUE DECIDE: con cuánta frecuencia se llega al partido con
    // el cruce ganado, empatado o perdido. Sin esto no se puede saber si un `--counter`
    // que mide poco es que el ciclo rinde poco o que el DT casi nunca llega a contra-elegir
    // —la Acción del Día es un recurso escaso y compite con recuperar y con entrenar—.
    cruceActual = E.counterEdge(run.filoId, E.rivalFilo(E.getTeam(oppId), E.koRoundOf(run.stage)).id) + 1;
    CRUCES[cruceActual]++;
    // Oxidación (R1): al partido se llega con la racha de la ventana — el estampado del
    // plantel tiene que ser coherente con ella (el rival jamás lleva el campo: nace sin él).
    assert(run.squad.every(p => (p.oxid ?? 1) === E.oxidMult(run.diasSinEntrenar)), "p.oxid coherente con la racha al llegar al partido", run.diasSinEntrenar);
    const match = playMatch(run, oppId);
    if (match.gMy > match.gOpp) CRUCES_W[cruceActual]++;

    // foto previa para validar la acumulación de amarillas del cierre
    const before = run.squad.map(p => ({ p, am: p.amarillas || 0, amP: p.amarillaPartido || 0, exp: p.expulsado, susp: p.suspendido }));
    const journalBefore = run.journal.length;

    const out = E.closeMatch(run, match);
    assert(run.diasSinEntrenar === 0 && run.squad.every(p => p.oxid === 1), "jugar devuelve el ritmo: la racha se resetea al cierre");

    for (const b of before) {
      const p = b.p;
      if (b.exp) assert(p.suspendido === true, "roja debe suspender", p.name);
      else if (b.susp) assert(p.suspendido === false, "suspensión cumplida debe limpiarse", p.name);
      else if (b.amP === 1) {
        if (b.am >= 1) assert(p.suspendido === true && p.amarillas === 0, "2ª amarilla acumulada debe suspender y resetear", p.name);
        else assert(p.amarillas === 1 && !p.suspendido, "1ª amarilla deja apercibido", p.name);
      } else if (b.amP === 0) assert((p.amarillas || 0) === b.am, "sin amarilla el contador no cambia", p.name);
      assert(p.energia >= 5 && p.energia <= 100, "energía fuera de rango", `${p.name}=${p.energia}`);
      assert(Number.isInteger(p.momento) && p.momento >= 1 && p.momento <= 7, "momento en rango 1..7", `${p.name}=${p.momento}`);
    }
    assert(Number.isInteger(run.moral) && run.moral >= 1 && run.moral <= 100, "moral en rango 1..100", run.moral);
    assert(Object.values(run.filoXp).every(v => typeof v === "number" && v >= 0), "XP de filosofía numérica y no negativa", JSON.stringify(run.filoXp));
    assert(Number.isInteger(run.dtNivel) && run.dtNivel >= 1 && run.dtNivel <= E.DT_MAX, "nivel de DT en rango 1..20", run.dtNivel);
    assert(E.dtLevelOf(run.dtXp) === run.dtNivel, "el nivel del DT deriva de su XP acumulada", `${run.dtXp}→${run.dtNivel}`);
    assert(E.filoLevel(run) >= 0 && E.filoLevel(run) <= 9, "nivel de filosofía en rango 0..9 (escalera T1)");
    assert(E.filoEtapa(run) >= 0 && E.filoEtapa(run) <= 2, "etapa de filosofía en rango 0..2");
    assert(E.FILO_LEVELS[E.filoLevel(run)].etapa === E.filoEtapa(run), "nivel y etapa coherentes (vista dual T1)");
    // La economía de Rasgos (T1): PI enteros y no negativos; los comprados son válidos,
    // sin duplicar y de la filosofía de SU llave (cada árbol guarda lo suyo, aunque
    // TODOS estén activos a la vez desde el arco de Progresión).
    assert(Number.isInteger(run.identityPoints) && run.identityPoints >= 0, "PI enteros y no negativos", run.identityPoints);
    for (const [fid, ids] of Object.entries(run.rasgos)) {
      assert(new Set(ids).size === ids.length, "sin rasgos duplicados", fid);
      for (const id of ids) assert(E.traitById(id)?.filo === fid, "rasgo válido y de la filosofía de su llave", `${fid}:${id}`);
    }
    assert(run.journal.length >= journalBefore + 1, "el diario debe crecer con el partido");

    const adv = E.advanceStage(run, out.advanced);
    if (adv.type === "eliminated") { alive = false; }
    else if (adv.type === "champion") { champion = true; alive = false; }
    else if (adv.type === "qualified") {
      assert(run.squad.every(p => (p.amarillas || 0) === 0), "amarillas en 0 al cerrar grupos");
      assert(run.stage === "r32" && run.koMatches.length === 16, "bracket de 16avos armado");
      // El mundo repartido por días no debe duplicar ni saltarse partidos:
      // cada grupo cierra con sus 6 resultados y sin pares repetidos
      for (const g of run.groups) {
        assert(g.results.length === 6, "grupo con 6 resultados al clasificar", `${g.name}=${g.results.length}`);
        const keys = new Set(g.results.map(r => [r.a, r.b].sort().join("|")));
        assert(keys.size === 6, "sin partidos duplicados en el grupo", g.name);
      }
    } else if (adv.type === "next-round" && adv.stage === "sf") {
      assert(run.squad.every(p => (p.amarillas || 0) === 0), "amarillas en 0 tras 4tos");
    }
  }
  assert(guard < 60, "la run no terminó (loop guard)");
  // Goleadores del torneo: entradas sanas y mi equipo nunca entra (se lee de squad)
  for (const s of Object.values(run.scorers)) {
    assert(s.goles > 0 && s.name && s.teamId, "goleador del torneo válido", JSON.stringify(s));
    assert(s.teamId !== teamId, "mi equipo no entra en run.scorers", s.name);
  }
  const tabla = E.tournamentScorers(run);
  for (let k = 1; k < tabla.length; k++) assert(tabla[k].goles <= tabla[k - 1].goles, "tabla de goleadores ordenada");
  // Asistidores del torneo: espejo de goleadores — mi equipo nunca entra en run.assists
  // (mis asistencias viven en squad[].asistencias), entradas sanas, tabla ordenada.
  for (const s of Object.values(run.assists)) {
    assert(s.asistencias > 0 && s.name && s.teamId, "asistidor del torneo válido", JSON.stringify(s));
    assert(s.teamId !== teamId, "mi equipo no entra en run.assists (se lee de squad)", s.name);
  }
  for (const p of run.squad) assert(Number.isInteger(p.asistencias) && p.asistencias >= 0, "asistencias del plantel sanas", `${p.name}=${p.asistencias}`);
  const tablaA = E.tournamentAssists(run);
  for (let k = 1; k < tablaA.length; k++) assert(tablaA[k].asistencias <= tablaA[k - 1].asistencias, "tabla de asistidores ordenada");
  assert(run.stats.oppOfrecidas === oppSeen, "oppOfrecidas cuadra con las oportunidades vistas", `stats=${run.stats.oppOfrecidas} vistas=${oppSeen}`);
  assert(run.stats.oppAprovechadas === oppTaken, "oppAprovechadas cuadra con las tomadas", `stats=${run.stats.oppAprovechadas} tomadas=${oppTaken}`);
  for (let k = 1; k < run.journal.length; k++) {
    assert(run.journal[k].day >= run.journal[k - 1].day, "diario fuera de orden cronológico");
  }
  // Instrumento por ronda (R2): DÓNDE murió la run — la escalada debe sentirse en KO,
  // no en grupos, y este reporte es el termómetro de esa forma.
  // Instrumento del árbol (T3): ¿la run alcanzó un Master? El gate del arco exige que
  // el azar (piso) casi nunca llegue y el greedy (techo) sí — inversión total.
  const master = Object.values(run.rasgos).flat().some(id => E.traitById(id)?.tier === "master");
  // Arco de Progresión: el techo alcanzado por la run (para calibrar la curva).
  const maxFilo = Math.max(...E.PHILOSOPHIES.map(f => E.filoLevel(run, f.id))) + 1;
  return { champion, journal: run.journal.length, stage: champion ? "champion" : run.stage, master,
    maxFilo, dt: run.dtNivel, pi: run.identityPoints, rasgos: Object.values(run.rasgos).flat().length };
}

// ---------- ejecución ----------
const playables = WC_DATA.teams.filter(t => t.playable).map(t => t.id);
const teamsToRun = ALL ? playables : [TEAM];
const t0 = Date.now();
const results = [];

for (const teamId of teamsToRun) {
  let champs = 0, journalSum = 0, masters = 0, filoSum = 0, dtSum = 0, dtMax = 0, rasgoSum = 0, champFilo = 0, champDt = 0;
  const deaths = {}; // instrumento por ronda (R2): dónde mueren las runs
  for (let i = 0; i < RUNS; i++) {
    const id = teamId || playables[Math.floor(Math.random() * playables.length)];
    const r = playRun(id);
    if (r.champion) champs++;
    if (r.master) masters++;
    filoSum += r.maxFilo; dtSum += r.dt; dtMax = Math.max(dtMax, r.dt); rasgoSum += r.rasgos;
    if (r.champion) { champFilo += r.maxFilo; champDt += r.dt; }
    journalSum += r.journal;
    deaths[r.stage] = (deaths[r.stage] || 0) + 1;
  }
  results.push({ team: teamId || "(azar)", champs, masters, journal: journalSum / RUNS, deaths,
    filo: filoSum / RUNS, dt: dtSum / RUNS, dtMax, rasgos: rasgoSum / RUNS,
    champFilo: champFilo / (champs || 1), champDt: champDt / (champs || 1) });
}

console.log(`\nsmoke: ${teamsToRun.length * RUNS} runs en ${((Date.now() - t0) / 1000).toFixed(1)}s · fallos: ${fails}`);
const DEATH_COLS = [["groups", "grupos"], ["r32", "16avos"], ["r16", "8vos"], ["qf", "4tos"], ["sf", "semis"], ["final", "final"], ["champion", "🏆"]];
const KO_COLS = [["r32", "16avos"], ["r16", "8vos"], ["qf", "4tos"], ["sf", "semis"], ["final", "FINAL"]];

/**
 * LA CURVA DE DIFICULTAD (sprint de la Escalada): de los que LLEGAN a cada ronda,
 * ¿cuántos la ganan? Es una probabilidad CONDICIONAL y es lo único que mide si el
 * torneo se endurece — el % de campeón cae de 100 a 28 solo porque hay que ganar cinco
 * veces seguidas, y eso da la ilusión de dificultad creciente donde no la hay.
 *
 * Se deriva de las MISMAS caídas de arriba: no mide nada nuevo, solo lo lee bien. El
 * `salto` (16avos − FINAL) es el gate del arco: hasta este sprint valía 5.7pp con
 * decisiones al azar, o sea que la final era prácticamente igual de difícil que la
 * primera eliminatoria mientras el DT llegaba a ella mucho más fuerte.
 */
function curva(deaths) {
  let vivos = RUNS - (deaths.groups || 0);
  const out = [];
  for (const [k, lbl] of KO_COLS) {
    if (vivos <= 0) break;
    const gana = 100 * (vivos - (deaths[k] || 0)) / vivos;
    out.push({ lbl, gana });
    vivos -= deaths[k] || 0;
  }
  return out;
}

for (const r of results) {
  console.log(`  ${r.team.padEnd(7)} campeón ${(100 * r.champs / RUNS).toFixed(1).padStart(5)}%  · master ${(100 * r.masters / RUNS).toFixed(1)}% · diario ~${r.journal.toFixed(0)} entradas`);
  console.log(`    progresión: filosofía tope ~${r.filo.toFixed(1)}/10 · DT ~${r.dt.toFixed(1)}/20 (máx ${r.dtMax}) · rasgos ~${r.rasgos.toFixed(1)} | CAMPEONES: filo ~${r.champFilo.toFixed(1)} · DT ~${r.champDt.toFixed(1)}`);
  console.log(`    caídas: ${DEATH_COLS.map(([k, lbl]) => `${lbl} ${(100 * (r.deaths[k] || 0) / RUNS).toFixed(1)}%`).join(" · ")}`);
  const c = curva(r.deaths);
  if (c.length === KO_COLS.length) {
    const salto = c[0].gana - c[c.length - 1].gana;
    console.log(`    CURVA (de los que llegan, cuántos ganan): ${c.map(x => `${x.lbl} ${x.gana.toFixed(1)}%`).join(" · ")} → salto ${salto.toFixed(1)}pp`);
  }
}
// EL CICLO, en partidos jugados (sprint del Rival que Decide). Es la línea que separa
// "el ciclo rinde poco" de "el DT casi nunca llega a contra-elegir": son diagnósticos
// distintos y piden diales distintos.
{
  const tot = CRUCES[0] + CRUCES[1] + CRUCES[2] || 1;
  const w = i => CRUCES[i] ? (100 * CRUCES_W[i] / CRUCES[i]).toFixed(1) : "—";
  console.log(`    CICLO (cruces jugados): gano ${(100 * CRUCES[2] / tot).toFixed(1)}% · neutro ${(100 * CRUCES[1] / tot).toFixed(1)}% · pierdo ${(100 * CRUCES[0] / tot).toFixed(1)}%`);
  console.log(`    CICLO (win% del partido según el cruce): gano ${w(2)}% · neutro ${w(1)}% · pierdo ${w(0)}%  ← el diente, medido en runs reales`);
}
console.log(fails ? "❌ smoke con fallos" : "✅ smoke OK");
process.exit(fails ? 1 : 0);
