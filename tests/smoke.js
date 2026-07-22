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

let fails = 0;
const assert = (cond, msg, ctx) => { if (!cond) { fails++; console.error("FAIL:", msg, ctx || ""); } };

// ---------- un partido interactivo con decisiones al azar ----------
function playMatch(run, oppId) {
  const me = E.getTeam(run.teamId);
  const opp = E.getTeam(oppId);
  const available = run.squad.filter(p => !p.suspendido && p.lesionadoPartidos === 0);
  for (const p of available) assert(!p.suspendido, "jugador suspendido en available");
  // Misma puerta que usan las pantallas: arma el once, lo ordena por slots y asigna los
  // puestos (limpiando los que quedaron del partido anterior). Llamar a autoLineup pelado
  // dejaría `posJugada` pegado de un cambio previo y castigaría a ese jugador para siempre.
  const { lineup } = E.currentLineup(run.squad, null, null);
  const val = E.validateLineup(available, lineup);
  assert(val.ok, "autoLineup debe producir alineación válida",
    `[${val.msg}] once: ${lineup.map(p => `${p.pos}:${p.name}`).join(", ")} · fuera: ${run.squad.filter(p => p.suspendido || p.lesionadoPartidos > 0).map(p => `${p.name}(${p.pos}${p.suspendido ? " susp" : " les" + p.lesionadoPartidos})`).join(", ") || "nadie"}`);
  assert(lineup.every(p => E.outOfPosPenalty(p) === 0), "el once automático no debe castigar a nadie");
  const bench = available.filter(p => !lineup.includes(p));
  // matchCtx homólogo al de screens/match.js (la moral entra al generador por acá — A3;
  // la filosofía viaja igual desde F1: {id, nivel}, el Match no conoce la run)
  const ctx = { team: me, lineup, bench, mentalidad: "normal", buffs: { ...run.buffs }, moral: run.moral, filo: E.filoCtx(run) };
  const banned = run.rivalBans[oppId] || [];
  const match = new E.Match(ctx, opp, run.stage !== "groups", banned);
  // La suspensión por roja ajena es real: el suspendido no puede estar en el once rival
  for (const name of banned) assert(!match.oppLineup.some(p => p.name === name), "suspendido fuera del once rival", name);
  assert(match.oppLineup.length === 6, "el rival siempre forma 6 (los genéricos cubren al suspendido)");
  assert(match.oppLineup.some(p => p.pos === "POR"), "el rival nunca se queda sin arquero");
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
  return match;
}

// ---------- una run completa (flujo real del motor) ----------
function playRun(teamId) {
  const run = E.newRun(teamId);
  assert(run.journal.length === 1, "el diario debe abrir con el sorteo");
  // Filosofía AL AZAR (F1): el smoke mide el PISO de la mecánica — un DT real elige
  // mirando su grupo y sus focos; acá nadie optimiza. No calibrar el techo con esto.
  const filoElegida = E.choosePhilosophy(run, E.PHILOSOPHIES[Math.floor(Math.random() * E.PHILOSOPHIES.length)].id);
  assert(filoElegida && run.filoId === filoElegida.id, "la elección de filosofía queda en la run");
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
        const tacRows = opts.filter(a => a.group === "tactica");
        if (tacRows.length) opts = opts.filter(a => a.group !== "tactica").concat(tacRows[Math.floor(Math.random() * tacRows.length)]);
        assert(opts.length > 0, "ningún modificador puede bloquear TODAS las acciones");
        if (opp) opts.push(opp);
        const blocked = E.DAY_ACTIONS.find(a => E.actionMult(run, a) === 0);
        if (blocked) assert(E.applyDayAction(run, blocked.id) === null, "una acción bloqueada no debe aplicarse", blocked.id);
        // Con --action se juega SIEMPRE esa estrategia (si hoy está disponible); si no, al azar.
        const forced = ACTION ? opts.filter(x => x.id === ACTION || x.group === ACTION) : [];
        const pool = forced.length ? forced : opts;
        const a = pool[Math.floor(Math.random() * pool.length)];
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
    const match = playMatch(run, oppId);

    // foto previa para validar la acumulación de amarillas del cierre
    const before = run.squad.map(p => ({ p, am: p.amarillas || 0, amP: p.amarillaPartido || 0, exp: p.expulsado, susp: p.suspendido }));
    const journalBefore = run.journal.length;

    const out = E.closeMatch(run, match);

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
    assert(Object.values(run.aristas).every(v => typeof v === "number" && v >= 0), "aristas numéricas y no negativas", JSON.stringify(run.aristas));
    assert(E.filoLevel(run) >= 0 && E.filoLevel(run) <= 2, "nivel de filosofía en rango 0..2");
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
  return { champion, journal: run.journal.length };
}

// ---------- ejecución ----------
const playables = WC_DATA.teams.filter(t => t.playable).map(t => t.id);
const teamsToRun = ALL ? playables : [TEAM];
const t0 = Date.now();
const results = [];

for (const teamId of teamsToRun) {
  let champs = 0, journalSum = 0;
  for (let i = 0; i < RUNS; i++) {
    const id = teamId || playables[Math.floor(Math.random() * playables.length)];
    const r = playRun(id);
    if (r.champion) champs++;
    journalSum += r.journal;
  }
  results.push({ team: teamId || "(azar)", champs, journal: journalSum / RUNS });
}

console.log(`\nsmoke: ${teamsToRun.length * RUNS} runs en ${((Date.now() - t0) / 1000).toFixed(1)}s · fallos: ${fails}`);
for (const r of results) {
  console.log(`  ${r.team.padEnd(7)} campeón ${(100 * r.champs / RUNS).toFixed(1).padStart(5)}%  · diario ~${r.journal.toFixed(0)} entradas`);
}
console.log(fails ? "❌ smoke con fallos" : "✅ smoke OK");
process.exit(fails ? 1 : 0);
