/* ============================================================
   game/match/chances — ocasiones de gol, penales en juego y VAR.
   Funciones que operan sobre una instancia de Match (`m`).
   Crea las decisiones: chance | penalty_mine | penalty_opp
   (contrato de decisiones: ver Match.js).
   ============================================================ */
import { rnd, pick } from "../../core/rng.js";
import { clamp } from "../../core/math.js";
import { teamRating, currentAura, playedPos } from "../ratings.js";
import { momentoMult } from "../momentum.js";
import { effStat } from "./powers.js";

/** Ocasión de mi equipo: puede ser penal, decisión interactiva (55%) o remate automático. */
export function myChance(m, opp) {
  m.stats.misTiros++;
  // Protagonista según dónde está PARADO: el que juega de 9 pisa el área más seguido,
  // sea o no su puesto natural.
  const cands = m.activeMine().filter(p => p.pos !== "POR");
  const weights = cands.map(p => playedPos(p) === "DEL" ? 3 : playedPos(p) === "MED" ? 2 : 1);
  const prot = m._weightedPick(cands, weights);
  // Penal a favor (poco frecuente)
  if (rnd() < 0.07) return myPenalty(m);
  // 55% de las ocasiones son interactivas
  if (m._interactiveChanceCooldown === 0 && rnd() < 0.55) {
    m._interactiveChanceCooldown = 2;
    const mates = cands.filter(p => p !== prot);
    const mate = mates.length ? m._weightedPick(mates, mates.map(p => playedPos(p) === "DEL" ? 3 : 1)) : prot;
    m.decision = {
      id: "chance", prot, mate,
      title: `⚡ min ${m.min}' — ¡${prot.name} queda en posición de ataque!`,
      text: "¿Cómo la juega?",
      options: [
        { label: `🎯 Remata él mismo`, hint: `Tiro ${prot.stats.tiro}`, key: "shoot" },
        { label: `🤝 Pase a ${mate.name}`, hint: `Pase ${prot.stats.pase} → Tiro ${mate.stats.tiro}`, key: "pass" },
        { label: `😤 Jugada individual`, hint: `Aura ${prot.stats.aura} (arriesgada, puede ganar penal)`, key: "solo" },
      ],
    };
    m.stats.decisiones++;
    return true;
  }
  // Ocasión automática
  const q = effStat(prot, rnd() < 0.75 ? "tiro" : "cabezazo", m.my.buffs);
  const pGoal = clamp(0.11 + q * 0.08 - (teamRating(m.oppTeam) / 20) * 0.035, 0.06, 0.55);
  if (rnd() < pGoal) goalMine(m, prot, pick(["¡Golazo!", "¡Define como crack!", "¡La clava en el ángulo!"]));
  else m.log("chance", `min ${m.min}' — ${prot.name} remata... ${pick(["¡ataja el arquero!", "¡se va apenas desviado!", "¡al palo!", "la defensa despeja."])}`);
  return false;
}

/** Resuelve la decisión "chance": shoot (tiro), pass (pase+tiro del compañero) o solo (aura, puede ganar penal). */
export function resolveChance(m, key) {
  const d = m.decision; m.decision = null;
  const oppR = teamRating(m.oppTeam) / 20;
  const attempt = (player, stat, bonus, texts) => {
    const q = effStat(player, stat, m.my.buffs);
    const p = clamp(0.14 + q * 0.09 + bonus - oppR * 0.035, 0.05, 0.68);
    if (rnd() < p) goalMine(m, player, texts.goal);
    else m.log("chance", `min ${m.min}' — ${texts.fail}`);
  };
  if (key === "shoot") {
    attempt(d.prot, "tiro", 0.02, { goal: "¡Remate letal!", fail: `${d.prot.name} remata pero ${pick(["ataja el arquero", "se va por arriba", "un defensa la saca en la línea"])}.` });
  } else if (key === "pass") {
    const pPass = clamp(0.35 + effStat(d.prot, "pase", m.my.buffs) * 0.11, 0.3, 0.92);
    if (rnd() < pPass) {
      m.log("plain", `min ${m.min}' — ¡Gran pase de ${d.prot.name}!`);
      attempt(d.mate, "tiro", 0.06, { goal: "¡Definición perfecta tras el pase!", fail: `${d.mate.name} no logra conectar bien el remate.` });
    } else m.log("chance", `min ${m.min}' — el pase de ${d.prot.name} es interceptado.`);
  } else if (key === "solo") {
    const pSolo = clamp(0.05 + effStat(d.prot, "aura", m.my.buffs) * 0.075, 0.05, 0.5);
    const roll = rnd();
    if (roll < pSolo) goalMine(m, d.prot, "¡JUGADÓN! Se saca a todos de encima y define. ¡Puro aura!");
    else if (roll < pSolo + 0.12) { m.log("event", `min ${m.min}' — ¡Derriban a ${d.prot.name} en el área! ¡PENAL!`); return myPenalty(m); }
    else m.log("chance", `min ${m.min}' — ${d.prot.name} intenta la individual pero lo frenan.`);
  }
  return false;
}

/** Penal a favor: pide al usuario elegir pateador (decisión "penalty_mine"). */
export function myPenalty(m) {
  const cands = m.activeMine().filter(p => p.pos !== "POR");
  m.decision = {
    id: "penalty_mine",
    title: `🎯 min ${m.min}' — ¡PENAL A FAVOR!`,
    text: "Elige quién lo patea:",
    options: cands.map(p => ({ label: `${p.name}`, hint: `Tiro ${p.stats.tiro} · Aura ${currentAura(p, m.my.buffs)}`, key: p.name })),
  };
  m.stats.decisiones++;
  return true;
}

/** Ejecuta el penal a favor con el pateador elegido (tiro + aura + bonus de práctica). */
export function resolvePenaltyMine(m, name) {
  const p = m.my.lineup.find(x => x.name === name);
  m.decision = null;
  // RECORTE DE BALANCE (17-jul-2026): la definición de penales NO lleva el % del Momento
  // (÷ momentoMult lo neutraliza). Fue la "primera línea de recorte" pactada al aprobar
  // la feature: con el efecto pleno, BRA derivaba ~+2pp en el smoke (precedente FEAT-003).
  const q = (effStat(p, "tiro", m.my.buffs) + effStat(p, "aura", m.my.buffs)) / 2 / momentoMult(p);
  const prob = clamp(0.52 + q * 0.07 + (m.my.buffs.penales || 0), 0.5, 0.93);
  if (rnd() < prob) goalMine(m, p, "¡PENAL CONVERTIDO con sangre fría!");
  else {
    m.pensFallados.push(p.name); // señal para el momento post-partido
    m.log("chance", `min ${m.min}' — ${p.name} patea el penal... ${pick(["¡EL ARQUERO LO ATAJA!", "¡LO TIRA AFUERA! Increíble.", "¡AL PALO!"])}`);
  }
  return false;
}

/** Ocasión rival: penal en contra interactivo (6%) o remate resuelto contra arquero y zaga. */
export function oppChance(m, mine) {
  m.stats.oppTiros++;
  const shooters = m.oppLineup.filter(p => (p.pos === "DEL" || p.pos === "MED") && !p.expulsado);
  const prot = shooters.length ? pick(shooters) : pick(m.oppLineup);
  // Penal en contra: decisión interactiva de atajada
  if (rnd() < 0.06) {
    m.decision = {
      id: "penalty_opp", shooter: prot,
      title: `🧤 min ${m.min}' — ¡Penal en contra! Patea ${prot.name}`,
      text: `¿Hacia dónde se lanza ${mine.por ? mine.por.name : "tu arquero"}?`,
      options: [
        { label: "⬅️ Palo izquierdo", key: "izq" },
        { label: "🧍 Se queda en el centro", key: "centro" },
        { label: "➡️ Palo derecho", key: "der" },
      ],
    };
    m.stats.decisiones++;
    return true;
  }
  // La calidad del arquero y la zaga pesan fuerte: tener defensa débil debe doler
  const q = effStat(prot, "tiro");
  const porQ = mine.por ? (effStat(mine.por, "atajadas", m.my.buffs) * 0.65 + effStat(mine.por, "reflejos", m.my.buffs) * 0.35) : 1;
  const pGoal = clamp(0.12 + q * 0.08 - porQ * 0.06 - (mine.def - 2.5) * 0.04, 0.05, 0.55);
  if (rnd() < pGoal) goalOpp(m, prot);
  else m.log("chance", `min ${m.min}' — ${prot.name} remata para ${m.oppTeam.name}... ${pick([`¡atajadón de ${mine.por ? mine.por.name : "tu arquero"}!`, "¡se va desviado!", "¡la defensa la saca!"])}`);
  return false;
}

/** Penal en contra: el usuario eligió el lado del arquero; adivinar da chance real de atajar. */
export function resolvePenaltyOpp(m, key) {
  const d = m.decision; m.decision = null;
  const { mine } = m.powers();
  const shooterDir = pick(["izq", "centro", "der"]);
  const por = mine.por;
  // En penales mandan los reflejos y el aura del arquero (sin Momento: recorte de balance, ver resolvePenaltyMine)
  const porQ = por ? (effStat(por, "reflejos", m.my.buffs) * 0.6 + effStat(por, "aura", m.my.buffs) * 0.4) / momentoMult(por) : 1;
  if (key === shooterDir) {
    const pSave = clamp(0.35 + porQ * 0.09, 0.35, 0.85);
    if (rnd() < pSave) {
      m.stats.penalesAtajados++;
      if (por) m.pensAtajadosPor.push(por.name); // señal para el momento post-partido
      m.log("event", `min ${m.min}' — ¡¡ATAJADO!! ${por ? por.name : "Tu arquero"} adivinó el lado. ¡HÉROE!`);
      return false;
    }
    m.log("goal_opp", `min ${m.min}' — Adivinaste el lado pero el remate de ${d.shooter.name} fue imposible. Gol de ${m.oppTeam.name}.`);
  } else {
    if (rnd() < 0.12) { m.log("event", `min ${m.min}' — ¡${d.shooter.name} LO TIRA AFUERA! Se salvaron.`); return false; }
    m.log("goal_opp", `min ${m.min}' — ${d.shooter.name} la puso al otro lado. Gol de ${m.oppTeam.name}.`);
  }
  m.gOpp++;
  m.oppGoalMins.push(m.min);
  return false;
}

// ---------- Goles y VAR ----------

/** Anota gol mío (con posible revisión del VAR que lo anula el 12%×30% de las veces). */
export function goalMine(m, p, flavor) {
  m.gMy++;
  p.goles = (p.goles || 0) + 1;
  m.scorers.push({ name: p.name, min: m.min });
  // VAR
  if (rnd() < 0.12) {
    m.log("event", `min ${m.min}' — ⚽ Gol de ${p.name}... ¡pero el VAR lo está revisando! 😬`);
    if (rnd() < 0.3) {
      m.gMy--; p.goles--; m.scorers.pop();
      m.log("event", `❌ GOL ANULADO por el VAR. Posición adelantada.`);
      return;
    }
    m.log("goal", `✅ ¡GOL CONFIRMADO! ${flavor} ${p.name} (${m.gMy}-${m.gOpp})`);
    return;
  }
  m.log("goal", `min ${m.min}' — ⚽ ¡GOOOOL DE ${p.name.toUpperCase()}! ${flavor} (${m.gMy}-${m.gOpp})`);
}

/** Anota gol rival (el VAR te salva el 10%×35% de las veces). */
export function goalOpp(m, p) {
  m.gOpp++;
  m.oppGoalMins.push(m.min);
  if (rnd() < 0.10) {
    m.log("event", `min ${m.min}' — Gol de ${m.oppTeam.name}... ¡VAR en revisión!`);
    if (rnd() < 0.35) {
      m.gOpp--;
      m.oppGoalMins.pop();
      m.log("event", `✅ ¡ANULADO! El VAR te salva. Sigue ${m.gMy}-${m.gOpp}.`);
      return;
    }
  }
  m.log("goal_opp", `min ${m.min}' — 💔 Gol de ${p.name} para ${m.oppTeam.name}. (${m.gMy}-${m.gOpp})`);
}
