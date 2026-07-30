/* ============================================================
   game/flow — orquestador de transiciones de la run.
   Coordina sistemas y escribe SOLO los campos que posee
   (stage, matchday, koMatches, lastWinners, stats, buffs);
   las reglas viven en cada sistema (ARQUITECTURA §3).

   Tres transiciones:
   - closeMatch(run, match)      cierra un partido del usuario
   - postMatchUpdate(run, match) parte física/disciplinaria del cierre
   - advanceStage(run, advanced) decide qué sigue en el torneo
   ============================================================ */
import { addJournal } from "./journal.js";
import { scheduleNextMatch } from "./calendar.js";
import { applyMedicalPostMatch } from "./medical.js";
import { pressExtraMinutes } from "./match/press.js";
import { resetOxidacion } from "./oxidation.js";
import { applyDisciplinePostMatch, clearAmarillas } from "./discipline.js";
import { applyMomentumPostMatch } from "./momentum.js";
import { applyMoralePostMatch, bumpMorale } from "./morale.js";
import { applyFiloXp, applyFiloCosts, noteFiloMilestones } from "./philosophy.js";
import { assignScorers } from "./scorers.js";
import { assignAssists } from "./assists.js";
import { qualifyRound32, computeTable } from "./tournament/groups.js";
import { pairNextRound, STAGE_ORDER, STAGE_LABEL } from "./tournament/knockout.js";
import { finishGroupMatchday, finishKnockoutRound } from "./tournament/world.js";

/**
 * Cierra un partido jugado por el usuario: stats de la run, entrada del diario
 * (ANTES de postMatchUpdate: así lleva el día del partido y las suspensiones/
 * lesiones aparecen a continuación), resultado al grupo o a la ronda, simulación
 * del resto de la fecha y cierre físico/disciplinario.
 * Devuelve { res, otherResults, advanced } para que la UI pinte el post-partido.
 */
export function closeMatch(run, match) {
  const res = match.result();
  const won = res.winner === "my";
  const drew = res.winner === null;

  run.stats.pj++;
  if (won) run.stats.pg++; else if (drew) run.stats.pe++; else run.stats.pp++;
  run.stats.gf += res.gMy; run.stats.gc += res.gOpp;
  run.stats.penalesAtajados += match.stats.penalesAtajados;

  const stageTxt = run.stage === "groups" ? `Fase de grupos · Fecha ${run.matchday + 1}` : STAGE_LABEL[run.stage];
  const scorersTxt = match.scorers.map(s => `${s.name} ${s.clock ?? s.min}'`).join(", ");
  const pensTxt = res.pens ? ` (${res.pens.myGoals}-${res.pens.oppGoals} en penales)` : "";
  addJournal(run, {
    icon: won ? "🎉" : drew ? "🤝" : "😞",
    tone: won ? "good" : drew ? "neutral" : "bad",
    title: `${won ? "Victoria" : drew ? "Empate" : "Derrota"} ${res.gMy}-${res.gOpp} vs ${match.oppTeam.name}${pensTxt}`,
    desc: `${stageTxt}. ${scorersTxt ? `Goles: ${scorersTxt}.` : "Sin goles propios."}`,
  });

  const oppId = match.oppTeam.id;
  // Los goles del rival en MI partido van a la tabla de goleadores como figuras ponderadas
  // (los míos ya son exactos en run.squad). La tanda no cuenta: solo el marcador de juego.
  // Mismo espejo para los asistidores: mis asistencias ya viven en squad[].asistencias
  // (las atribuyó el partido en chances.goalMine), las del rival se reparten acá.
  assignScorers(run, oppId, res.gOpp);
  assignAssists(run, oppId, res.gOpp);
  delete run.rivalBans[oppId]; // si tenía un suspendido, lo cumplió ante mí
  let otherResults = [], advanced = null;

  if (run.stage === "groups") {
    run.groups[run.myGroupIdx].results.push({ a: run.teamId, b: oppId, gA: res.gMy, gB: res.gOpp });
    // El mundo ya jugó su fecha durante la ventana (tournament/world); acá solo se cierra lo que falte
    otherResults = finishGroupMatchday(run);
    run.matchday++;
  } else {
    const sim = finishKnockoutRound(run);
    const myIdx = run.koMatches.findIndex(([a, b]) => a === run.teamId || b === run.teamId);
    sim.winners[myIdx] = won ? run.teamId : oppId;
    otherResults = sim.results.filter(Boolean);
    run.lastWinners = sim.winners;
    advanced = won;
  }

  const { momentum, morale, filoExec, filoCost } = postMatchUpdate(run, match);
  return { res, otherResults, advanced, momentum, morale, filoExec, filoCost };
}

/**
 * Cierre físico, disciplinario y anímico del partido, jugador por jugador, y re-agendado.
 * Devuelve `{momentum, morale}` para el análisis del cuerpo técnico del post-partido:
 * `momentum` = resumen por jugador; `morale` = resumen del ánimo colectivo.
 */
export function postMatchUpdate(run, match) {
  const minutos = match.minutesByName ? match.minutesByName() : {}; // duck-typed en algunos tests
  // Minutos presionados (botón de presión): cuestan el doble de energía. Pulmones de
  // Acero los abarata acá, donde todavía se puede leer el rasgo desde el Match.
  const presRaw = match.pressMinutesByName ? match.pressMinutesByName() : {};
  const presionados = {};
  for (const [name, min] of Object.entries(presRaw)) presionados[name] = pressExtraMinutes(match, min);
  // Y el sobrecosto del BLOQUE ADELANTADO (sprint del Territorio) se cobra por el mismo
  // caño, pero SIN el descuento de los rasgos de fuelle: esos abaratan el acto de
  // presionar, no la decisión estructural de vivir veinte metros más arriba.
  const altoRaw = match.heightMinutesByName ? match.heightMinutesByName() : {};
  for (const [name, min] of Object.entries(altoRaw)) presionados[name] = (presionados[name] || 0) + min;
  // El costo físico de la identidad (F2: el Press corre y lo paga) se cobra ANTES
  // del loop por jugador: usa los flags usado/sustituido que ese loop resetea.
  const filoCost = applyFiloCosts(run, match);
  const momentum = [];
  for (const p of run.squad) {
    // Jugó = está en el once final, entró desde el banco (`usado`) o SALIÓ por un cambio
    // (`sustituido`): sin este último, al sustituido no se le contaba el partido y recuperaba
    // energía como si hubiera descansado (bug reportado por el PO).
    const played = match.my.lineup.includes(p) || p.usado || p.sustituido;
    if (played) p.partidos++;
    applyMedicalPostMatch(run, p, played, minutos[p.name] || 0, presionados[p.name] || 0);
    applyDisciplinePostMatch(run, p);
    momentum.push(applyMomentumPostMatch(run, p, played, match)); // antes de resetear flags: lee p.sustituido
    p.usado = false;
    p.sustituido = false;
    p.enCancha = false;
  }
  const morale = applyMoralePostMatch(run, match);
  // LA PROGRESIÓN (arco de Progresión): la XP que el Match repartió por filosofía se
  // acredita, sube niveles, paga XP al DT y este imprime PI. `filoExec` viaja en el
  // retorno para que el post-partido lo narre.
  const filoExec = applyFiloXp(run, match);
  noteFiloMilestones(run); // la cancha pudo consolidar el umbral: la conquista se narra (M2)
  run.planFilo = null;     // el Plan de Partido se consume con el partido
  run.buffs = {};
  // Oxidación (R1): JUGAR devuelve el ritmo ("jugar es ritmo", decisión PO). El reset va
  // acá, en el cierre físico — el partido ya se jugó con la racha que traía el plantel.
  resetOxidacion(run);
  // El partido consumió el día: se agenda el siguiente a 5-6 días con sus eventos diarios
  scheduleNextMatch(run);
  return { momentum, morale, filoExec, filoCost };
}

/**
 * Avanza el torneo tras un partido cerrado y devuelve qué sigue:
 *  - {type:"next-matchday"}       otra fecha de grupos
 *  - {type:"qualified", myPos}    grupos cerrados y clasificados (amarillas limpias)
 *  - {type:"eliminated"}          fuera del Mundial
 *  - {type:"next-round", stage}   siguiente ronda eliminatoria (tras 4tos limpia amarillas)
 *  - {type:"champion"}            ganó la final
 */
export function advanceStage(run, advanced) {
  if (run.stage === "groups") {
    if (run.matchday < 3) return { type: "next-matchday" };
    const qual = qualifyRound32(run);
    if (!qual.meIn) return { type: "eliminated" };
    run.stage = "r32";
    run.koMatches = qual.matches;
    run.koPlayed = {}; // ronda nueva: el mundo la irá jugando día a día
    const myPos = computeTable(run.groups[run.myGroupIdx]).findIndex(r => r.id === run.teamId) + 1;
    addJournal(run, { icon: "🎊", tone: "gold", title: "¡Clasificados a 16avos de final!", desc: `Terminaron ${myPos}º del Grupo ${run.groups[run.myGroupIdx].name}. Desde aquí, todo es a vida o muerte.` });
    // Regla FIFA adaptada: al cerrar la fase de grupos se borran las amarillas acumuladas
    clearAmarillas(run, "Terminó la fase de grupos");
    bumpMorale(run, 5, "Clasificar a las eliminatorias enciende al grupo."); // pasar de ronda sube la moral
    return { type: "qualified", myPos };
  }
  if (!advanced) return { type: "eliminated" };
  if (run.stage === "final") return { type: "champion" };
  const nextStage = STAGE_ORDER[STAGE_ORDER.indexOf(run.stage) + 1];
  run.koMatches = pairNextRound(run.lastWinners);
  run.koPlayed = {}; // ronda nueva: el mundo la irá jugando día a día
  run.stage = nextStage;
  addJournal(run, { icon: "🔥", tone: "gold", title: nextStage === "final" ? "¡FINALISTAS del Mundial!" : `¡A ${STAGE_LABEL[nextStage]}!`, desc: `Sobreviven ${run.koMatches.length * 2} equipos.` });
  bumpMorale(run, 5, "Pasar de ronda agranda el sueño."); // pasar de ronda sube la moral
  // Regla FIFA adaptada: al terminar los cuartos también se borran las amarillas
  if (nextStage === "sf") clearAmarillas(run, "Terminaron los cuartos de final");
  return { type: "next-round", stage: nextStage };
}
