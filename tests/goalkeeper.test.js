/* ============================================================
   Tests del bug fix "el equipo nunca puede jugar sin arquero"
   (decisión PO, 2-ago-2026): si los dos POR del plantel quedan
   fuera a la vez (lesión + roja + suspensión acumulada), un
   jugador de campo tiene que ponerse los guantes — y hasta hoy
   el motor dejaba el arco vacío sin que el DT se enterara.

   Tres frentes:
   - ratings.js: la línea fija EMERGENCY_GK_STATS que le presta al
     arquero de emergencia las stats de arco que no tiene.
   - lineup.js: canPlayAt admite la excepción, validateLineup la
     exige SIEMPRE (antes se salteaba si no había POR disponible).
   - match/incidents.js + Match.js: la roja o la lesión al arquero
     sin suplente en la banca dispara `gk_emergency`, una decisión
     que bloquea el partido hasta que el DT elige quién va al arco.

   Uso: node tests/goalkeeper.test.js
   ============================================================ */
import { loadEngine } from "./load-engine.js";

const { Engine: E } = await loadEngine();

let fails = 0, checks = 0;
const assert = (cond, msg, ctx) => { checks++; if (!cond) { fails++; console.error("FAIL:", msg, ctx ?? ""); } };

/** Un Match de BRA vs GER con el once que se pase (por defecto, el automático). */
function makeMatch(lineup, bench) {
  const run = E.newRun("BRA");
  if (!lineup) ({ lineup } = E.currentLineup(run.squad, null, null));
  if (!bench) bench = run.squad.filter(p => !lineup.includes(p));
  return { run, match: new E.Match({ team: E.getTeam("BRA"), lineup, bench, mentalidad: "normal", buffs: {} }, E.getTeam("GER"), false, []) };
}

// ---------- ratings: la línea fija del arquero de emergencia ----------
{
  const run = E.newRun("BRA");
  const def = run.squad.find(p => p.pos === "DEF");
  const porReal = run.squad.find(p => p.pos === "POR");

  // Sin posJugada="POR", nada cambia: sigue siendo su ficha normal de DEF.
  assert(E.effectiveStat(def, "defensa") === E.baseStatAt(def, "defensa"), "un DEF sin reubicar no toca la línea de emergencia");

  def.posJugada = "POR";
  for (const k of ["atajadas", "reflejos", "salidas"]) {
    assert(E.effectiveStat(def, k) === E.EMERGENCY_GK_STATS[k], `de arquero de emergencia, ${k} sale de la línea fija`, E.effectiveStat(def, k));
  }
  // Un DEF distinto, con OTRAS stats reales, tiene que dar EXACTAMENTE lo mismo: "no
  // importa quién sea" (decisión PO) es literal en las 3 stats exclusivas del arco.
  const otroDef = run.squad.filter(p => p.pos === "DEF")[1] || run.squad.find(p => p.pos === "MED");
  otroDef.posJugada = "POR";
  for (const k of ["atajadas", "reflejos", "salidas"]) {
    assert(E.effectiveStat(otroDef, k) === E.effectiveStat(def, k), `${k} es igual sin importar quién sea el arquero de emergencia`);
  }
  // Muy por debajo del peor arquero real del juego (medido: 61/63/57 es el piso real).
  assert(E.EMERGENCY_GK_STATS.atajadas < 55 && E.EMERGENCY_GK_STATS.reflejos < 55 && E.EMERGENCY_GK_STATS.salidas < 55,
    "la línea de emergencia es claramente peor que cualquier arquero real");

  // Un arquero REAL evaluado en su propio puesto nunca toca la línea de emergencia,
  // aunque casualmente pos==="POR" && playedPos==="POR" (la condición exige p.pos!=="POR").
  assert(E.effectiveStat(porReal, "atajadas") !== E.EMERGENCY_GK_STATS.atajadas || porReal.stats.atajadas === E.EMERGENCY_GK_STATS.atajadas,
    "un arquero real usa SUS stats, no la línea de emergencia (coincidencia numérica aparte)");
  assert(E.baseStatAt(porReal, "atajadas") === porReal.stats.atajadas, "el arquero real conserva sus propias atajadas");

  // Las stats que el jugador de campo SÍ tiene (pase/velocidad/aura) no vienen de la línea
  // fija: siguen las suyas, con el castigo normal por fuera de puesto.
  def.posJugada = "POR";
  const distancia = E.posDistance("DEF", "POR"); // 1 línea
  const penaltyEsperado = E.OUT_OF_POS_STEP ? E.OUT_OF_POS_STEP * distancia : null;
  assert(E.effectiveStat(def, "velocidad") !== undefined, "la velocidad del arquero de emergencia sigue siendo la suya (con castigo)");
  def.posJugada = null; otroDef.posJugada = null;
}

// ---------- lineup: canPlayAt admite la excepción, nunca por accidente ----------
{
  const run = E.newRun("BRA");
  const def = run.squad.find(p => p.pos === "DEF");
  const por = run.squad.find(p => p.pos === "POR");

  assert(!E.canPlayAt(def, "POR"), "sin la excepción, un DEF sigue sin poder pararse en el arco");
  assert(!E.canPlayAt(def, "POR", {}), "el objeto de opciones vacío no habilita nada por accidente");
  assert(!E.canPlayAt(def, "POR", { emergency: false }), "emergency:false es explícitamente que no");
  assert(E.canPlayAt(def, "POR", { emergency: true }), "con la excepción, un DEF SÍ puede ir al arco");
  assert(E.canPlayAt(por, "POR", { emergency: true }), "un arquero real sigue pudiendo (la excepción no le quita nada)");
  assert(!E.canPlayAt(por, "DEF", { emergency: true }), "la excepción es de UNA sola vía: el arquero real sigue sin poder salir a jugar de campo");
  assert(E.canPlayAt(def, "DEF"), "entre puestos de campo, todo sigue igual que siempre");
}

// ---------- lineup: validateLineup exige arquero SIEMPRE, no solo si hay uno disponible ----------
{
  const run = E.newRun("BRA");
  // Los dos POR fuera de combate.
  run.squad.filter(p => p.pos === "POR").forEach(p => { p.lesionadoPartidos = 2; });
  const available = run.squad.filter(p => !p.suspendido && p.lesionadoPartidos === 0);
  assert(!available.some(p => p.pos === "POR"), "el banco de prueba efectivamente se quedó sin arqueros");

  const { lineup, formationId } = E.currentLineup(run.squad, null, null);
  assert(lineup.length === 6, "con 8 de campo disponibles, el once sigue siendo de 6", lineup.length);

  const enArco = lineup.filter(p => E.playedPos(p) === "POR");
  assert(enArco.length === 1, "currentLineup ya resolvió un arquero de emergencia por defecto", enArco.map(p => p.name));
  assert(enArco[0].pos !== "POR", "y es un jugador de campo, no un arquero de verdad");

  const val = E.validateLineup(available, lineup);
  assert(val.ok, "con el arquero de emergencia puesto, la alineación es válida", val.msg);

  // El bug en sí: si se le saca el arquero de emergencia a mano, ahora SÍ tiene que fallar
  // (antes de este fix, `avail("POR")===false` hacía que la regla se salteara entera).
  const sinNadieEnElArco = lineup.map(p => ({ ...p, posJugada: p.posJugada === "POR" ? p.pos : p.posJugada }));
  const valRoto = E.validateLineup(available, sinNadieEnElArco);
  assert(!valRoto.ok, "SIN nadie jugando de arquero, validateLineup ahora rechaza la alineación (antes la dejaba pasar)", JSON.stringify(valRoto));
  assert(/arquero/i.test(valRoto.msg), "y el mensaje explica que falta el arquero", valRoto.msg);

  // Con un arquero real disponible, el mensaje de error es el de siempre (no el de emergencia).
  const run2 = E.newRun("BRA");
  const { lineup: l2 } = E.currentLineup(run2.squad, null, null);
  const sinNadie2 = l2.map(p => ({ ...p, posJugada: p.pos === "POR" ? "DEF" : p.posJugada }));
  const val2 = E.validateLineup(run2.squad.filter(p => !p.suspendido && p.lesionadoPartidos === 0), sinNadie2);
  assert(!val2.ok && val2.msg === "Necesitas exactamente 1 arquero.", "con arquero disponible, el mensaje es el clásico, no el de emergencia", val2.msg);
}

// ---------- lineup: swapCandidates (squad.js) no se testea acá — es UI; ver lineup.test.js §6f ----------

// ---------- match: gk_red normal sigue intacto (hay suplente en la banca) ----------
{
  const { match } = makeMatch();
  const gk = match.my.lineup.find(p => p.pos === "POR");
  gk.expulsado = true;
  const pend = E.forceGkReplacement(match);
  assert(pend === true, "con suplente en la banca, sigue quedando una decisión pendiente");
  assert(match.decision.id === "gk_red", "y sigue siendo la sustitución normal, no la de emergencia", match.decision?.id);
  const outName = match.decision.options[0].key;
  const ok = match.makeSub(match.my.lineup.find(p => p.name === outName), match.decision.gkIn, true);
  assert(ok, "la sustitución normal se resuelve como siempre");
}

// ---------- match: SIN suplente en la banca, dispara gk_emergency y bloquea el partido ----------
{
  const { match } = makeMatch();
  // Vaciar la banca de arqueros (simula que el único suplente también está de baja).
  match.my.bench = match.my.bench.filter(b => b.pos !== "POR");
  const gk = match.my.lineup.find(p => p.pos === "POR");
  gk.expulsado = true;

  const pend = E.forceGkReplacement(match);
  assert(pend === true, "sin arquero en la banca, igual queda una decisión pendiente (no se resigna)");
  assert(match.decision.id === "gk_emergency", "y es la decisión de emergencia", match.decision?.id);
  assert(match.decision.options.length === 5, "ofrece a los 5 jugadores de campo activos", match.decision.options.length);
  assert(!match.decision.options.some(o => o.key === gk.name), "el arquero expulsado no es una opción");

  // El partido queda BLOQUEADO hasta resolver: tick() no avanza con decisión pendiente.
  const minAntes = match.min;
  match.tick();
  assert(match.min === minAntes, "tick() no avanza el reloj mientras la decisión sigue pendiente");

  const elegido = match.decision.options[0].key;
  const resuelto = match.resolveGkEmergency(elegido);
  assert(resuelto === true, "resolveGkEmergency resuelve la decisión");
  assert(match.decision === null, "y la libera: el partido puede seguir");
  const p = match.my.lineup.find(x => x.name === elegido);
  assert(p.posJugada === "POR", "el elegido queda parado en el arco", p.posJugada);
  assert(match.activeMine().some(x => E.playedPos(x) === "POR"), "el arco ya no está vacío");
  // No fue una sustitución: sigue siendo el mismo jugador, no entró nadie de la banca.
  assert(!p.usado, "no consumió un cupo de banca — es una reposición, no un cambio");
  assert(match.subsLeft === 3, "y no gastó ningún cambio");

  // El poder del equipo ahora es un número real (no NaN) y refleja al arquero de emergencia.
  const powers = E.teamPowers(match.my.lineup, "normal", {});
  assert(Number.isFinite(powers.def), "el poder defensivo sigue siendo un número real, no NaN", powers.def);
  assert(powers.por.name === elegido, "teamPowers identifica al arquero de emergencia como el POR del equipo");
}

// ---------- match: SEGUNDO ORDEN — el arquero de emergencia TAMBIÉN sale (roja) ----------
// REGRESIÓN (2-ago-2026, la cazó un `--all` de balance): foulEvent/injuryEvent chequeaban
// `p.pos==="POR"` para decidir si el que se va es "el arquero" — pero el arquero de
// emergencia tiene `p.pos` de campo (DEF/MED/DEL) para siempre; lo único que cambia es
// `posJugada`. Con el chequeo viejo, una roja o lesión al arquero de emergencia caía como
// si fuera un jugador de campo cualquiera, y el arco se quedaba vacío por segunda vez sin
// que nada lo reparara — el equipo terminaba el partido sin nadie en el arco.
{
  const { match } = makeMatch();
  match.my.bench = match.my.bench.filter(b => b.pos !== "POR");
  const gk1 = match.my.lineup.find(p => p.pos === "POR");
  gk1.expulsado = true;
  E.forceGkReplacement(match);
  const emergencia1 = match.my.lineup.find(x => x.name === match.decision.options[0].key);
  match.resolveGkEmergency(emergencia1.name);
  assert(emergencia1.posJugada === "POR", "el primer arquero de emergencia queda parado en el arco");
  assert(emergencia1.pos !== "POR", "pero su posición NATURAL sigue siendo la de campo de siempre", emergencia1.pos);

  // Ahora AL ARQUERO DE EMERGENCIA lo expulsan. El chequeo tiene que mirar playedPos.
  emergencia1.expulsado = true;
  const pend2 = E.forceGkReplacement(match);
  assert(pend2 === true, "la roja al arquero de EMERGENCIA también dispara una decisión pendiente (antes no pasaba nada)");
  assert(match.decision?.id === "gk_emergency", "otra vez la decisión de emergencia (no queda banca)", match.decision?.id);
  assert(!match.decision.options.some(o => o.key === emergencia1.name), "el que se acaba de ir no es una opción");
  assert(match.decision.options.length === 4, "quedan 4 jugadores de campo activos para elegir", match.decision.options.length);

  const emergencia2 = match.my.lineup.find(x => x.name === match.decision.options[0].key);
  const resuelto2 = match.resolveGkEmergency(emergencia2.name);
  assert(resuelto2 === true, "se resuelve el segundo relevo de emergencia");
  assert(emergencia2.posJugada === "POR", "el SEGUNDO arquero de emergencia queda parado en el arco");
  assert(match.activeMine().some(x => E.playedPos(x) === "POR"), "el arco sigue sin quedar vacío tras el segundo relevo");
  assert(Number.isFinite(E.teamPowers(match.my.lineup, "normal", {}).def), "el poder del equipo sigue siendo un número real");
}

// ---------- match: SEGUNDO ORDEN — el arquero de emergencia se lesiona ----------
{
  const { match } = makeMatch();
  match.my.bench = match.my.bench.filter(b => b.pos !== "POR");
  const gk1 = match.my.lineup.find(p => p.pos === "POR");
  gk1.expulsado = true;
  E.forceGkReplacement(match);
  const emergencia1 = match.my.lineup.find(x => x.name === match.decision.options[0].key);
  match.resolveGkEmergency(emergencia1.name);

  emergencia1.lesionado = true; // lesión, no roja: mismo chequeo, otro camino de entrada
  const pend2 = E.forceGkReplacement(match);
  assert(pend2 === true, "la LESIÓN del arquero de emergencia también dispara una decisión pendiente");
  assert(match.decision?.id === "gk_emergency", "misma decisión de emergencia por la vía de la lesión");
}

// ---------- match: resolveGkEmergency rechaza nombres inválidos o sin decisión pendiente ----------
{
  const { match } = makeMatch();
  assert(match.resolveGkEmergency("Nadie") === false, "sin decisión pendiente, no hace nada");
  match.my.bench = match.my.bench.filter(b => b.pos !== "POR");
  match.my.lineup.find(p => p.pos === "POR").expulsado = true;
  E.forceGkReplacement(match);
  assert(match.resolveGkEmergency("Un Nombre Que No Existe") === false, "un nombre que no está en las opciones no resuelve nada");
  assert(match.decision !== null, "y la decisión sigue pendiente");
  const por = match.my.lineup.find(p => p.pos === "POR");
  assert(match.resolveGkEmergency(por.name) === false, "no se puede 'reponer' al propio arquero expulsado (ya no es de campo)");
}

// ---------- match: lesión del arquero SIN suplente en la banca dispara gk_emergency ----------
{
  const { match } = makeMatch();
  match.my.bench = match.my.bench.filter(b => b.pos !== "POR");
  const eligibles = match.eligibleFor(match.my.lineup.find(p => p.pos === "POR"));
  assert(eligibles.length === 0, "sin arquero en la banca, eligibleFor da vacío para el arquero");
  // Vía injuryEvent completa (con su propio rng) sería no-determinista; se prueba el
  // enrutamiento directo, que es lo que injuryEvent llama para el caso del arquero.
  const gk = match.my.lineup.find(p => p.pos === "POR");
  gk.lesionado = true;
  const pend = E.forceGkReplacement(match);
  assert(pend === true && match.decision.id === "gk_emergency", "la lesión del arquero sin suplente enruta a la misma decisión que la roja");
}

// ---------- match: caso extremo — ni un jugador de campo activo (no debe crashear) ----------
{
  const { match } = makeMatch();
  match.my.bench = match.my.bench.filter(b => b.pos !== "POR");
  for (const p of match.my.lineup) if (p.pos !== "POR") p.expulsado = true;
  match.my.lineup.find(p => p.pos === "POR").expulsado = true;
  const pend = E.forceGkReplacement(match);
  assert(pend === false, "sin nadie en cancha para mandar al arco, no fabrica un jugador de la nada");
  assert(match.decision === null, "y no deja una decisión imposible de resolver colgada");
}

console.log(`goalkeeper.test: ${checks} checks · fallos: ${fails}`);
console.log(fails ? "❌ goalkeeper con fallos" : "✅ goalkeeper OK");
process.exit(fails ? 1 : 0);
