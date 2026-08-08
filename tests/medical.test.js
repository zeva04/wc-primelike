/* ============================================================
   Tests del cuerpo médico y la economía de energía (game/medical.js):
   - cruce Energía → Lesión del Sprint 4 (fatigueInjuryMult)
   - cansancio por minutos (matchFatigue) derivado de la constante
   - EL DESCANSO PASIVO DIARIO SE ELIMINÓ (decisión PO, 2-ago-2026):
     pasar un día ya NO recupera energía por sí solo. La única fuente
     es la acción 🧘 Recuperar o el descanso del banco al no jugar
     (REST_RECOVERY, que sigue vivo — ver el bloque de abajo).
   Uso: node tests/medical.test.js
   ============================================================ */
import { loadEngine } from "./load-engine.js";

const { Engine: E } = await loadEngine();

let fails = 0, checks = 0;
const assert = (cond, msg, ctx) => { checks++; if (!cond) { fails++; console.error("FAIL:", msg, ctx ?? ""); } };

// ---------- cruce Energía → Lesión (Sprint 4) ----------
assert(E.fatigueInjuryMult(100) === 1, "un jugador entero no tiene riesgo extra", E.fatigueInjuryMult(100));
assert(E.fatigueInjuryMult(E.FATIGUE_INJURY_FROM) === 1, "el multiplicador arranca recién bajo el umbral de energía", E.fatigueInjuryMult(E.FATIGUE_INJURY_FROM));
assert(E.fatigueInjuryMult(E.FATIGUE_INJURY_FROM + 20) === 1, "por encima del umbral no escala");
assert(Math.abs(E.fatigueInjuryMult(5) - E.FATIGUE_INJURY_MAX) < 1e-9, "en el piso de energía llega al tope", E.fatigueInjuryMult(5));
assert(E.fatigueInjuryMult(undefined) === 1, "sin campo energía (rival/duck-typed) no escala: la asimetría vive en los datos");
// Monotonía: cuanto más vacío, peor. Ningún escalón puede bajar el riesgo.
{
  let ok = true;
  for (let e = 5; e < 100; e++) if (E.fatigueInjuryMult(e) > E.fatigueInjuryMult(e - 1) + 1e-12) { ok = false; break; }
  assert(ok, "el multiplicador es monótono decreciente en energía (más energía = menos riesgo)");
  assert(E.fatigueInjuryMult(20) > E.fatigueInjuryMult(45), "un jugador al 20% corre más riesgo que uno al 45%");
}
// El cruce no puede convertir un golpe en lesión segura: 0.45 base × tope debe seguir < 1.
assert(0.45 * E.FATIGUE_INJURY_MAX < 1, "ni con las piernas vacías el golpe es lesión garantizada", 0.45 * E.FATIGUE_INJURY_MAX);

// ---------- EL DESCANSO PASIVO NO EXISTE (decisión PO, 2-ago-2026) ----------
{
  assert(E.applyDailyRecovery === undefined, "applyDailyRecovery se borró: no queda ni la función muerta");
  assert(E.DAILY_RECOVERY === undefined && E.MATCHDAY_RECOVERY === undefined, "y tampoco sus constantes");

  // Pasar un día de preparación, jugando o no, no mueve la energía de nadie POR SÍ SOLO.
  // Repetido en vez de un solo trial: `advanceDay` también dispara eventos de preparación
  // al azar (content/prep-events), y varios de ellos SÍ tocan energía por su cuenta — eso
  // es un mecanismo distinto del descanso pasivo que se está probando acá. Un único día
  // podía coincidir con uno de esos eventos y dar un falso rojo. Lo que hay que confirmar
  // es que "nada pasa" sea un resultado POSIBLE (antes era IMPOSIBLE: el pasivo garantizaba
  // +7 siempre) — no que sea el resultado de un día cualquiera.
  let huboDiaSinCambios = false;
  for (let i = 0; i < 60 && !huboDiaSinCambios; i++) {
    const run = E.newRun("BRA");
    run.squad.forEach(p => { p.energia = 40; });
    E.advanceDay(run);
    if (run.squad.every(p => p.energia === 40)) huboDiaSinCambios = true;
  }
  assert(huboDiaSinCambios, "en al menos uno de 60 días de preparación la energía no se mueve — confirma que no queda ningún piso pasivo");

  // Tampoco la víspera del partido (antes recuperaba +2 — ya no). Mismo cuidado con los
  // eventos al azar: se repite hasta ver un caso limpio.
  let huboVisperaSinCambios = false;
  for (let i = 0; i < 60 && !huboVisperaSinCambios; i++) {
    const run = E.newRun("BRA");
    while (run.day < run.nextMatchDay - 1) E.advanceDay(run);
    run.squad.forEach(p => { p.energia = 40; });
    const res = E.advanceDay(run);
    assert(res && res.type === "match", "el día siguiente es el de partido", JSON.stringify(res));
    assert(res.type !== "match" || run.actionPending === false, "el día de partido sigue sin Acción del Día (los días de partido son sagrados)");
    if (run.squad.every(p => p.energia === 40)) huboVisperaSinCambios = true;
  }
  assert(huboVisperaSinCambios, "en al menos una víspera de partido la energía tampoco se mueve por sí sola");

  // La única fuente pasiva que sigue viva: el banco que no jugó (REST_RECOVERY).
  assert(E.REST_RECOVERY > 0, "el que no juega un partido sigue recuperando por rotar");
}

// ---------- cansancio por minutos (derivado de la constante, no hardcodeado) ----------
assert(E.matchFatigue(90) === Math.round(90 / 30 * E.FATIGUE_PER_30), "90' cuestan 3 × FATIGUE_PER_30", E.matchFatigue(90));
assert(E.matchFatigue(0) === 0, "el que no entró no se cansa");
assert(E.matchFatigue(45) < E.matchFatigue(90), "el cansancio es proporcional a los minutos");
assert(Math.abs(E.matchFatigueRaw(90) - 90 / 30 * E.FATIGUE_PER_30) < 1e-12, "matchFatigueRaw es el MISMO dial sin redondear", E.matchFatigueRaw(90));

/* ══════════════════════════════════════════════════════════════════════════════
   EL DESGASTE EN VIVO (7-ago-2026): la energía se pierde MIENTRAS se juega.

   Lo que se fija acá no es que baje —eso es la mitad fácil— sino que el partido
   siga costando EXACTAMENTE lo mismo que cuando se cobraba todo al final. La
   economía de energía es el dial más sensible del juego (powers.ENERGY_OK, y el
   arco del Meta midió ~5pp de título por punto de recuperación diaria): si el
   desgaste en vivo cobrara de más, cada partido saldría el doble y toda la
   calibración de Recuperar/Entrenar se caería sin que ningún test lo dijera.
   ══════════════════════════════════════════════════════════════════════════════ */
{
  /** 20 minutos de un partido real, resolviendo lo que aparezca. Siempre la PRIMERA
   *  opción: acá se mide energía, no balance — que no entre azar propio. */
  function jugar20() {
    const run = E.newRun("BRA");
    const { lineup } = E.currentLineup(run.squad, null, null);
    const bench = run.squad.filter(p => !lineup.includes(p));
    run.squad.forEach(p => { p.energia = 100; });   // desde el techo: así nada roza el piso de 5
    const m = new E.Match({ team: E.getTeam("BRA"), lineup, bench, mentalidad: "normal", buffs: {}, filo: null },
      E.getTeam("ARG"), false, []);
    const resolver = () => {
      const d = m.decision;
      if (!d) return;
      const k = d.options[0]?.key;
      if (d.id === "sequence") m.resolveSequenceAct(k);
      else if (d.id === "penalty_mine") m.resolvePenaltyMine(k);
      else if (d.id === "penalty_opp") m.resolvePenaltyOpp(k);
      else if (d.id === "last_man") m.resolveLastMan(k);
      else if (d.id === "gk_emergency") m.resolveGkEmergency(k);
      else m.decision = null;
    };
    for (let i = 0; i < 20; i++) { m.tick(); let g = 0; while (m.decision && g++ < 20) resolver(); }
    return { run, m, lineup, bench };
  }

  // Se REPITE hasta dar con un partido en el que el titular medido no se lesionó: el
  // golpe de una lesión descuenta 20 por su cuenta (incidents) y es un mecanismo
  // distinto del que se está midiendo acá. Sin esto, el test daría rojo ~1 de cada 10
  // corridas por una lesión legítima — un test que miente una vez cada diez es peor
  // que no tenerlo.
  let caso = null;
  for (let i = 0; i < 25 && !caso; i++) {
    const c = jugar20();
    if (!c.lineup[0].lesionado && !c.lineup[0].expulsado) caso = c;
  }
  assert(!!caso, "hubo al menos un partido de 20' con el titular medido entero");
  if (caso) {
    const { run, m, lineup, bench } = caso;
    const titular = lineup[0];

    assert(titular.energia < 100, "el titular pierde energía DURANTE el partido", `100 → ${titular.energia}`);
    // Lo que se siente en vivo es LIVE_FATIGUE_SHARE del costo del partido, prorrateado
    // al minuto que va. El resto llega con el pitazo (ver el invariante, más abajo).
    const esperado = E.matchFatigueRaw(m.min) * E.LIVE_FATIGUE_SHARE;
    assert(Math.abs((100 - titular.energia) - esperado) < 1.5,
      "y lo que perdió es la parte EN VIVO del dial, prorrateada al minuto que va",
      `perdió ${(100 - titular.energia).toFixed(2)} · esperado ~${esperado.toFixed(2)} al ${m.min}'`);
    assert(E.LIVE_FATIGUE_SHARE > 0 && E.LIVE_FATIGUE_SHARE < 1,
      "la fracción en vivo es una fracción: en 0 no se siente nada y en 1 el partido cobra dos veces el mismo tanque",
      E.LIVE_FATIGUE_SHARE);
    assert(Math.abs((m.drainedByName()[titular.name] || 0) - (100 - titular.energia)) < 1e-9,
      "el Match declara lo mismo que descontó (drainedByName es lo que el cierre resta)");

    // El banco no corre: nadie que no esté en cancha pierde nada.
    assert(bench.every(p => p.energia === 100), "el que mira desde el banco no se cansa");

    // EL INVARIANTE: cerrar el partido no lo cobra dos veces. El estado final tiene que
    // ser el mismo que daba el cierre de golpe — energía inicial menos el dial completo.
    const minutos = m.minutesByName()[titular.name];
    E.applyMedicalPostMatch(run, titular, true, minutos, 0, m.drainedByName()[titular.name] || 0);
    assert(titular.energia === Math.round(100 - E.matchFatigue(minutos)),
      "tras el cierre, la energía es la de SIEMPRE: el partido no se cobra dos veces",
      `${titular.energia} vs ${Math.round(100 - E.matchFatigue(minutos))} (${minutos}')`);
    assert(Number.isInteger(titular.energia), "y entre partidos vuelve a ser un entero (la UI de gestión la pinta así)");
  }
}

console.log(`medical.test: ${checks} checks · fallos: ${fails}`);
console.log(fails ? "❌ medical con fallos" : "✅ medical OK");
process.exit(fails ? 1 : 0);
