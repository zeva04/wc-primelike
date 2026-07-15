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
import { applyDisciplinePostMatch, clearAmarillas } from "./discipline.js";
import { simMatchday, qualifyRound32, computeTable } from "./tournament/groups.js";
import { simKnockoutRound, pairNextRound, STAGE_ORDER, STAGE_LABEL } from "./tournament/knockout.js";

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
  const scorersTxt = match.scorers.map(s => `${s.name} ${s.min}'`).join(", ");
  const pensTxt = res.pens ? ` (${res.pens.myGoals}-${res.pens.oppGoals} en penales)` : "";
  addJournal(run, {
    icon: won ? "🎉" : drew ? "🤝" : "😞",
    tone: won ? "good" : drew ? "neutral" : "bad",
    title: `${won ? "Victoria" : drew ? "Empate" : "Derrota"} ${res.gMy}-${res.gOpp} vs ${match.oppTeam.name}${pensTxt}`,
    desc: `${stageTxt}. ${scorersTxt ? `Goles: ${scorersTxt}.` : "Sin goles propios."}`,
  });

  const oppId = match.oppTeam.id;
  let otherResults = [], advanced = null;

  if (run.stage === "groups") {
    run.groups[run.myGroupIdx].results.push({ a: run.teamId, b: oppId, gA: res.gMy, gB: res.gOpp });
    otherResults = simMatchday(run, run.matchday);
    run.matchday++;
  } else {
    const sim = simKnockoutRound(run.koMatches, run.teamId);
    const myIdx = run.koMatches.findIndex(([a, b]) => a === run.teamId || b === run.teamId);
    sim.winners[myIdx] = won ? run.teamId : oppId;
    otherResults = sim.results.filter(Boolean);
    run.lastWinners = sim.winners;
    advanced = won;
  }

  postMatchUpdate(run, match);
  return { res, otherResults, advanced };
}

/** Cierre físico y disciplinario del partido, jugador por jugador, y re-agendado. */
export function postMatchUpdate(run, match) {
  for (const p of run.squad) {
    const played = match.my.lineup.includes(p) || p.usado;
    if (played) p.partidos++;
    applyMedicalPostMatch(run, p, played);
    applyDisciplinePostMatch(run, p);
    p.usado = false;
    p.sustituido = false;
    p.enCancha = false;
  }
  run.buffs = {};
  // El partido consumió el día: se agenda el siguiente a 5-6 días con sus eventos diarios
  scheduleNextMatch(run);
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
    const myPos = computeTable(run.groups[run.myGroupIdx]).findIndex(r => r.id === run.teamId) + 1;
    addJournal(run, { icon: "🎊", tone: "gold", title: "¡Clasificados a 16avos de final!", desc: `Terminaron ${myPos}º del Grupo ${run.groups[run.myGroupIdx].name}. Desde aquí, todo es a vida o muerte.` });
    // Regla FIFA adaptada: al cerrar la fase de grupos se borran las amarillas acumuladas
    clearAmarillas(run, "Terminó la fase de grupos");
    return { type: "qualified", myPos };
  }
  if (!advanced) return { type: "eliminated" };
  if (run.stage === "final") return { type: "champion" };
  const nextStage = STAGE_ORDER[STAGE_ORDER.indexOf(run.stage) + 1];
  run.koMatches = pairNextRound(run.lastWinners);
  run.stage = nextStage;
  addJournal(run, { icon: "🔥", tone: "gold", title: nextStage === "final" ? "¡FINALISTAS del Mundial!" : `¡A ${STAGE_LABEL[nextStage]}!`, desc: `Sobreviven ${run.koMatches.length * 2} equipos.` });
  // Regla FIFA adaptada: al terminar los cuartos también se borran las amarillas
  if (nextStage === "sf") clearAmarillas(run, "Terminaron los cuartos de final");
  return { type: "next-round", stage: nextStage };
}
