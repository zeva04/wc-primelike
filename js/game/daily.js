/* ============================================================
   game/daily — el World Cup Daily (Bible §4.4): la portada que
   responde "¿qué cambió desde ayer?" ANTES de decidir el día.

   Genera 1-5 titulares desde el estado real de la run, con la
   jerarquía de prioridades del Bible:
     P1 PLANTEL  → reacción al último partido, parte médico,
                   tarjetas, goleador en racha, desgaste, posición
     P1.5 GRUPO  → anoche en MI grupo (rivales directos), con el
                   próximo rival señalado
     P2 RIVAL    → framing del próximo cruce (favorito/parejo)
     P3 MUNDIAL  → lo noticiable de anoche en el resto del torneo
                   (run.lastNight, ver tournament/world.js):
                   batacazos por tier, goleadas, festivales,
                   grandes y expulsiones — hasta 2 titulares
     P4 COLOR    → flavor (content/daily-flavor), solo en días
                   tranquilos y máximo 1 — los días con poco que
                   contar son deliberados (§4.4: contraste)

   El Daily INFORMA; el evento del día TRANSFORMA (llega después).
   Nada de acá muta la run: es una consulta de solo lectura
   (salvo el pick() del flavor, que consume rng).
   ============================================================ */
import { pick } from "../core/rng.js";
import { getTeam } from "../data/teams-repo.js";
import { teamRating, difficultyOf } from "./ratings.js";
import { computeTable } from "./tournament/groups.js";
import { nextOpponentId, STAGE_LABEL } from "./tournament/knockout.js";
import { DAILY_FLAVOR } from "../content/daily-flavor.js";
import { PREP_EVENTS } from "../content/prep-events.js";
import { RANDOM_EVENTS } from "../content/conflicts.js";
import { buildOpponentReport } from "./scouting.js";

// H6 (sprint Preparación con dientes): el framing de la previa cita UN dato del
// Informe del Rival — la debilidad si la hay (accionable), si no la amenaza.
const LINEA_TXT = { ataque: "su ataque", defensa: "su defensa", arquero: "su arquero" };
function scoutHint(run, oppId) {
  const lineas = Object.entries(buildOpponentReport(run, oppId).lineas);
  const debil = lineas.find(([, l]) => l.nivel === "Bajo");
  if (debil) return ` El informe del cuerpo técnico marca su punto débil: ${LINEA_TXT[debil[0]]}.`;
  const fuerte = lineas.find(([, l]) => l.nivel === "Alto");
  if (fuerte) return ` El informe del cuerpo técnico advierte: ${LINEA_TXT[fuerte[0]]} es superior.`;
  return " El informe del cuerpo técnico no encuentra grietas: partido de igual a igual.";
}

const ORD = ["", "1º", "2º", "3º", "4º"];

/** Los partidos "de anoche" de MI grupo (rivales directos), marcando al próximo rival. */
function myGroupHeadlines(run, oppId) {
  return (run.lastNight || []).filter(e => e.myGroup).map(e => {
    const A = getTeam(e.a), B = getTeam(e.b);
    const opp = e.a === oppId ? A : e.b === oppId ? B : null;
    let text;
    if (e.gA === e.gB) {
      text = opp
        ? `${opp.name} — nuestro próximo rival — empató ${e.gA}-${e.gB} con ${opp === A ? B.name : A.name} en nuestro grupo.`
        : `En nuestro grupo, ${A.name} y ${B.name} repartieron puntos: ${e.gA}-${e.gB}.`;
    } else {
      const [W, L, gw, gl] = e.gA > e.gB ? [A, B, e.gA, e.gB] : [B, A, e.gB, e.gA];
      text = opp === W ? `Atención: ${W.name} — nuestro próximo rival — venció ${gw}-${gl} a ${L.name} en nuestro grupo.`
        : opp === L ? `Buena señal: ${L.name}, nuestro próximo rival, cayó ${gl}-${gw} ante ${W.name}.`
        : `En nuestro grupo, ${W.name} venció ${gw}-${gl} a ${L.name}: la tabla se mueve.`;
    }
    return { icon: "👀", tag: "GRUPO", text };
  });
}

/**
 * Los titulares del resto del Mundial (P3), puntuando lo noticiable de anoche:
 * batacazos por tier (una "Campaña legendaria" venciendo a un "Favorito" es LA
 * noticia), favoritos eliminados, goleadas (margen ≥3), festivales (5+ goles),
 * resultados de los grandes (media ≥85) y expulsiones. Devuelve hasta `max`.
 */
function worldHeadlines(run, max = 2) {
  const scored = (run.lastNight || []).filter(e => !e.myGroup).map(e => {
    const A = getTeam(e.a), B = getTeam(e.b);
    const ko = e.stage !== "groups";
    const decided = e.gA !== e.gB || ko;
    const [W, L, gw, gl] = !decided ? [null, null, e.gA, e.gB]
      : e.gA > e.gB ? [A, B, e.gA, e.gB]
      : e.gA < e.gB ? [B, A, e.gB, e.gA]
      : e.win === e.a ? [A, B, e.gA, e.gB] : [B, A, e.gB, e.gA];
    const margin = Math.abs(e.gA - e.gB), total = e.gA + e.gB;
    let s = 0, kind = null;
    if (W) {
      const tW = difficultyOf(W).tier, tL = difficultyOf(L).tier;
      const gap = teamRating(L) - teamRating(W);
      // Umbral alto a propósito: con ~5 partidos por noche, un "batacazo" diario
      // devalúa la palabra (Bible §4.4: si todos los días son espectaculares, ninguno lo es)
      if (tL === "favorito" && (tW === "sorpresa" || tW === "leyenda")) { s += 100; kind = "batacazo"; }
      else if (gap >= 12) { s += 60; kind = "batacazo"; }
      if (ko && tL === "favorito" && !kind) { s += 50; kind = "favorito_out"; }
      if (margin >= 3) { s += 25 + margin; kind = kind || "goleada"; }
    }
    if (total >= 5) { s += 20; kind = kind || "festival"; }
    if (W && teamRating(W) >= 85) { s += 12; kind = kind || "grande"; }
    if (ko) { s += 15; kind = kind || "eliminacion"; }
    if (e.red) s += 8;
    return { e, A, B, W, L, gw, gl, ko, s, kind };
  }).filter(x => x.kind && x.s >= 12).sort((x, y) => y.s - x.s);

  const items = [];
  for (const h of scored.slice(0, max)) {
    const marker = h.e.pens ? " en los penales" : "";
    const donde = h.e.groupName ? ` (Grupo ${h.e.groupName})` : "";
    let text =
      h.kind === "batacazo" ? (h.ko ? `¡Batacazo mundial! ${h.W.name} eliminó a ${h.L.name} ${h.gw}-${h.gl}${marker}.` : `¡${h.W.name} sorprende a ${h.L.name} y le gana ${h.gw}-${h.gl}${donde}!`)
      : h.kind === "favorito_out" ? `Se cae un candidato: ${h.W.name} despachó ${h.gw}-${h.gl}${marker} a ${h.L.name}.`
      : h.kind === "goleada" ? `Goleada${donde}: ${h.W.name} aplastó ${h.gw}-${h.gl} a ${h.L.name}${h.ko ? " y avanza de ronda" : ""}.`
      : h.kind === "festival" ? `Lluvia de goles${donde}: ${h.A.name} ${h.e.gA}-${h.e.gB} ${h.B.name}.`
      : h.kind === "grande" ? `${h.W.name} hizo los deberes: ${h.gw}-${h.gl} a ${h.L.name}${donde}.`
      : `${h.W.name} eliminó a ${h.L.name} (${h.gw}-${h.gl}${marker}) en ${STAGE_LABEL[h.e.stage]}.`;
    if (h.e.red && h.e.red.name) text += ` Además, ${h.e.red.name} vio la roja.`;
    const icon = { batacazo: "🚨", favorito_out: "💥", goleada: "🔥", festival: "⚽", grande: "🏆", eliminacion: "⚔️" }[h.kind];
    items.push({ icon, tag: "MUNDIAL", text });
  }
  // Roja de un partido que no llegó a titular: escándalo aparte (si queda espacio)
  if (items.length < max) {
    const used = new Set(scored.slice(0, max).map(x => x.e));
    const redE = (run.lastNight || []).find(e => !e.myGroup && e.red && e.red.name && !used.has(e));
    if (redE) items.push({ icon: "🟥", tag: "MUNDIAL", text: `Escándalo: expulsado ${redE.red.name} (${getTeam(redE.red.teamId).name}) en el ${getTeam(redE.a).name}-${getTeam(redE.b).name}.` });
  }
  return items;
}

/**
 * Arma la edición del día: {day, isMatchDay, items} con 1-5 titulares
 * ordenados por prioridad — el primero es la nota de tapa.
 */
export function buildDaily(run) {
  const items = [];
  const me = getTeam(run.teamId);
  const oppId = nextOpponentId(run);
  const opp = oppId ? getTeam(oppId) : null;
  const isMatchDay = run.day >= run.nextMatchDay;

  // Tapa de día de partido: nada compite con el clímax
  if (isMatchDay && opp) {
    const stageTxt = run.stage === "groups" ? `por la fecha ${run.matchday + 1} del Grupo ${run.groups[run.myGroupIdx].name}` : `por ${STAGE_LABEL[run.stage]}`;
    items.push({ icon: "⚽", tag: "PORTADA", text: `¡DÍA DE PARTIDO! ${me.name} enfrenta a ${opp.name} ${stageTxt}.` });
  }

  // P1 — la prensa reacciona al partido de ayer
  const lastMatch = [...run.journal].reverse().find(j => ["🎉", "🤝", "😞"].includes(j.icon));
  if (lastMatch && lastMatch.day === run.day - 1) {
    const won = lastMatch.icon === "🎉", drew = lastMatch.icon === "🤝";
    // Solo la inicial a minúscula: el título trae nombres propios ("Empate 0-0 vs Brasil")
    const ref = lastMatch.title.charAt(0).toLowerCase() + lastMatch.title.slice(1);
    items.push({
      icon: won ? "🗞️" : drew ? "📰" : "🧨", tag: "PLANTEL",
      text: won ? `La prensa se rinde tras la ${ref}: el país empieza a soñar.`
        : drew ? `Sabor agridulce: el ${ref} deja más preguntas que respuestas.`
        : `Duras críticas tras la ${ref}: el DT, en el ojo de la tormenta.`,
    });
  }

  // P1 — parte médico, sanciones y capilla
  const injured = run.squad.filter(p => p.lesionadoPartidos > 0);
  if (injured.length) items.push({ icon: "🚑", tag: "PLANTEL", text: `Parte médico: ${injured.map(p => p.name).join(" y ")} no llega${injured.length > 1 ? "n" : ""} al próximo partido.` });
  const susp = run.squad.filter(p => p.suspendido);
  if (susp.length) items.push({ icon: "🟥", tag: "PLANTEL", text: `${susp.map(p => p.name).join(" y ")} cumplirá${susp.length > 1 ? "n" : ""} suspensión${opp ? ` ante ${opp.name}` : ""}.` });
  const aperc = run.squad.filter(p => p.amarillas > 0 && !p.suspendido);
  if (aperc.length && aperc.length <= 2) items.push({ icon: "🟨", tag: "PLANTEL", text: `En capilla: ${aperc.map(p => p.name).join(" y ")} — una amarilla más y se pierde${aperc.length > 1 ? "n" : ""} un partido.` });

  // P1 — la racha del goleador y el desgaste del plantel
  const scorer = [...run.squad].sort((a, b) => b.goles - a.goles)[0];
  if (scorer && scorer.goles >= 2) items.push({ icon: "🔥", tag: "PLANTEL", text: `${scorer.name} está en racha: ${scorer.goles} goles en el torneo. ¿La revelación de ${me.name}?` });
  const avgEnergy = Math.round(run.squad.reduce((s, p) => s + p.energia, 0) / run.squad.length);
  if (avgEnergy < 60) items.push({ icon: "🥵", tag: "PLANTEL", text: `El plantel acusa el desgaste del torneo (energía media ${avgEnergy}): el cuerpo técnico evalúa rotar.` });

  // P1 — posición en el grupo (cuando ya se jugó)
  if (run.stage === "groups" && run.matchday > 0) {
    const g = run.groups[run.myGroupIdx];
    const pos = computeTable(g).findIndex(r => r.id === run.teamId) + 1;
    items.push({ icon: "📊", tag: "PLANTEL", text: pos === 1 ? `${me.name} manda en el Grupo ${g.name}: el liderazgo es nuestro.` : `${me.name} marcha ${ORD[pos]} en el Grupo ${g.name}: nada está dicho.` });
  }

  // P1.5 — anoche en NUESTRO grupo: los rivales directos, con el próximo marcado
  items.push(...myGroupHeadlines(run, oppId));

  // P2 — suspendidos del rival (roja del mundo vivo): scouting accionable,
  // se repite cada mañana hasta que la cumpla porque cambia MI preparación
  const bans = opp && run.rivalBans[opp.id];
  if (bans && bans.length) {
    items.push({ icon: "🟥", tag: "RIVAL", text: `Buena noticia: ${bans.join(" y ")} está suspendido y ${opp.name} no podrá contar con él ante nosotros.` });
  }

  // P2 — el próximo rival, con framing por paridad. Solo en la PREVIA (≤2 días
  // del partido): repetir el mismo titular toda la ventana lo convertía en ruido.
  if (opp && !isMatchDay && run.nextMatchDay - run.day <= 2) {
    const rMe = teamRating(me), rOpp = teamRating(opp);
    const diff = rOpp - rMe;
    const framing = diff >= 5 ? `${opp.name} (media ${rOpp}) llega como favorito al cruce: nadie nos regala nada.`
      : diff <= -5 ? `Los analistas dan a ${me.name} como favorito ante ${opp.name} (media ${rOpp}). Cuidado con el exceso de confianza.`
      : `Duelo parejo a la vista: ${opp.name} (media ${rOpp}) promete un partido cerrado.`;
    items.push({ icon: "🎯", tag: "RIVAL", text: framing + scoutHint(run, opp.id) });
  }

  // P3 — anoche en el resto del Mundial (hasta 2 titulares)
  items.push(...worldHeadlines(run));

  // P3.5 — el pronóstico de HOY (Bible §4.4: el Daily anticipa, el evento
  // materializa): un teaser ambiguo del evento/conflicto que trae el día
  const plan = run.dayPlan[run.day];
  if (!isMatchDay && plan) {
    const src = (plan.kind === "evento" ? PREP_EVENTS : RANDOM_EVENTS).find(e => e.id === plan.id);
    if (src?.teaser) items.push({ icon: "🔭", tag: "HOY", text: src.teaser });
  }

  // P4 — color, solo si el día viene tranquilo (máximo 1)
  if (items.length < 3) items.push({ ...pick(DAILY_FLAVOR), tag: "COLOR" });

  return { day: run.day, isMatchDay, items: items.slice(0, 5) };
}
