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
import { ASSIST_CHANCE, POS_ASSIST_WEIGHT } from "../assists.js";
import { effStat } from "./powers.js";

// Fracción de las ocasiones peligrosas del rival que se vuelven decisión de "último hombre"
// para MI central (barrerse/esperar/anticipar). Dial de balance del Sprint 1 (decisión PO
// 20-jul-2026): ayuda a DEFENDER + suma Momento a los DEF, poder asimétrico → gatear con smoke.
const LAST_MAN_CHANCE = 0.25;

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
  if (rnd() < pGoal) goalMine(m, prot, pick(["¡Golazo!", "¡Define como crack!", "¡La clava en el ángulo!"]), "open");
  else m.log("chance", `min ${m.min}' — ${prot.name} remata... ${pick(["¡ataja el arquero!", "¡se va apenas desviado!", "¡al palo!", "la defensa despeja."])}`);
  return false;
}

/** Resuelve la decisión "chance": shoot (tiro), pass (pase+tiro del compañero) o solo (aura, puede ganar penal). */
export function resolveChance(m, key) {
  const d = m.decision; m.decision = null;
  const oppR = teamRating(m.oppTeam) / 20;
  const attempt = (player, stat, bonus, texts, assist) => {
    const q = effStat(player, stat, m.my.buffs);
    const p = clamp(0.14 + q * 0.09 + bonus - oppR * 0.035, 0.05, 0.68);
    if (rnd() < p) goalMine(m, player, texts.goal, assist);
    else m.log("chance", `min ${m.min}' — ${texts.fail}`);
  };
  if (key === "shoot") {
    // Remate propio: jugada abierta, asistencia posible de un compañero (assistFor).
    attempt(d.prot, "tiro", 0.02, { goal: "¡Remate letal!", fail: `${d.prot.name} remata pero ${pick(["ataja el arquero", "se va por arriba", "un defensa la saca en la línea"])}.` }, "open");
  } else if (key === "pass") {
    const pPass = clamp(0.35 + effStat(d.prot, "pase", m.my.buffs) * 0.11, 0.3, 0.92);
    if (rnd() < pPass) {
      m.log("plain", `min ${m.min}' — ¡Gran pase de ${d.prot.name}!`);
      // El pase es la asistencia: si el compañero convierte, el pasador (d.prot) la firma.
      attempt(d.mate, "tiro", 0.06, { goal: "¡Definición perfecta tras el pase!", fail: `${d.mate.name} no logra conectar bien el remate.` }, d.prot);
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
  if (rnd() < prob) goalMine(m, p, "¡PENAL CONVERTIDO con sangre fría!", undefined, false);
  else {
    m.pensFallados.push(p.name); // señal para el momento post-partido
    m.log("chance", `min ${m.min}' — ${p.name} patea el penal... ${pick(["¡EL ARQUERO LO ATAJA!", "¡LO TIRA AFUERA! Increíble.", "¡AL PALO!"])}`);
  }
  return false;
}

/** Crea la decisión "penalty_opp" (elegir el palo del arquero) para un pateador dado. */
function oppPenaltyDecision(m, shooter) {
  const { mine } = m.powers();
  m.decision = {
    id: "penalty_opp", shooter,
    title: `🧤 min ${m.min}' — ¡Penal en contra! Patea ${shooter.name}`,
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

/** Ocasión rival: último hombre (25%), penal en contra interactivo (6%) o remate automático. */
export function oppChance(m, mine) {
  m.stats.oppTiros++;
  const shooters = m.oppLineup.filter(p => (p.pos === "DEL" || p.pos === "MED") && !p.expulsado);
  const prot = shooters.length ? pick(shooters) : pick(m.oppLineup);
  // Último hombre: una fracción de las ocasiones peligrosas se convierte en decisión de MI
  // central. Necesita un DEF mío en cancha; si no hay (rojas/lesiones), sigue el flujo normal.
  if (rnd() < LAST_MAN_CHANCE) {
    const defs = m.activeMine().filter(p => playedPos(p) === "DEF");
    if (defs.length) {
      const def = pick(defs);
      m.decision = {
        id: "last_man", prot: def, shooter: prot,
        title: `🛡️ min ${m.min}' — ¡${prot.name} filtra un pase y se escapa! ${def.name} es el último hombre`,
        text: "¿Cómo lo encara?",
        options: [
          { label: "🏃 Anticipar", hint: `Defensa ${def.stats.defensa} — corte limpio, o queda de cara al arco`, key: "anticipar" },
          { label: "🧹 Barrerse", hint: "Puede cortar, pero arriesga tarjeta o penal", key: "barrerse" },
          { label: "🧍 Esperar / contener", hint: "Seguro: baja la peligrosidad, remate a atajar", key: "esperar" },
        ],
      };
      m.stats.decisiones++;
      return true;
    }
  }
  // Penal en contra: decisión interactiva de atajada
  if (rnd() < 0.06) return oppPenaltyDecision(m, prot);
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

// ---------- Último hombre ----------

/** Corte heroico del central: marca el crédito de Momento (+1 post-partido) y lo narra. */
function lastManStop(m, def, text) {
  m.lastManStops.push(def.name); // señal +Momento para applyMomentumPostMatch
  m.log("event", `min ${m.min}' — 🛡️ ${text}`);
  return false;
}

/**
 * Resuelve la decisión "último hombre" de MI central (d.prot) ante el escapado (d.shooter).
 * Perfiles (decisión PO 20-jul-2026):
 *  - anticipar: alto riesgo/recompensa. Corte limpio (+Momento) o el delantero queda de
 *    cara al arco → gol muy probable (sin tarjeta).
 *  - barrerse: puede cortar (+Momento), pero el mal timing es falta → PENAL si es en el
 *    área, o tarjeta (amarilla, a veces roja de último hombre). Tarjeta/penal → −Momento.
 *  - esperar: contiene y baja la peligrosidad → remate normal a atajar. NUNCA da Momento,
 *    pero tampoco arriesga nada.
 * El éxito/fracaso se paga con su consecuencia natural; el −Momento SOLO llega por
 * tarjeta o penal (no por el gol de un anticipe fallado).
 */
export function resolveLastMan(m, key) {
  const d = m.decision; m.decision = null;
  const def = d.prot, shooter = d.shooter;
  const dPow = effStat(def, "defensa", m.my.buffs);
  const atk = teamRating(m.oppTeam) / 20;
  const edge = dPow - atk;

  if (key === "anticipar") {
    const pCut = clamp(0.46 + edge * 0.14 + effStat(def, "aura", m.my.buffs) * 0.02, 0.25, 0.82);
    if (rnd() < pCut) return lastManStop(m, def, `${def.name} LEE el pase y se anticipa. ¡Corte magistral del último hombre!`);
    m.log("chance", `min ${m.min}' — ${def.name} se adelanta pero ${shooter.name} le gana la espalda y queda de cara al arco...`);
    if (rnd() < 0.68) return goalOpp(m, shooter); // gol muy probable
    m.log("event", `min ${m.min}' — ¡${m.powers().mine.por ? m.powers().mine.por.name : "tu arquero"} le tapa el mano a mano de milagro!`);
    return false;
  }

  if (key === "barrerse") {
    const pCut = clamp(0.44 + edge * 0.12, 0.25, 0.74);
    if (rnd() < pCut) return lastManStop(m, def, `${def.name} se BARRE y saca la pelota limpita al córner. ¡Ovación!`);
    // Mal timing → falta. En el área es penal; si no, tarjeta (de último hombre puede ser roja).
    m.lastManFouls.push(def.name); // señal −Momento (tarjeta o penal), pase lo que pase después
    if (rnd() < 0.28) {
      m.log("event", `min ${m.min}' — ¡${def.name} llega tarde en la barrida y comete PENAL! 😱`);
      return oppPenaltyDecision(m, shooter);
    }
    m.stats.tarjetas++;
    if (rnd() < 0.12) {
      def.expulsado = true;
      m.log("card", `min ${m.min}' — 🟥 ¡ROJA a ${def.name}! Frena el contragolpe como último hombre y se va expulsado. Juegan con ${m.activeMine().length}.`);
    } else {
      def.amarillaPartido = (def.amarillaPartido || 0) + 1;
      if (def.amarillaPartido >= 2) {
        def.expulsado = true;
        m.log("card", `min ${m.min}' — 🟥 Segunda amarilla y EXPULSIÓN de ${def.name} por la falta táctica.`);
      } else {
        m.log("card", `min ${m.min}' — 🟨 Amarilla a ${def.name} por la falta táctica que corta el ataque.`);
        if ((def.amarillas || 0) >= 1) m.log("card", `⚠️ ${def.name} estaba apercibido: acumula su segunda amarilla del torneo y se perderá el PRÓXIMO partido.`);
      }
    }
    return false; // la falta corta la jugada: sin gol
  }

  // esperar: contiene. Baja la peligrosidad y se resuelve como remate normal a atajar.
  const { mine } = m.powers();
  const q = effStat(shooter, "tiro");
  const porQ = mine.por ? (effStat(mine.por, "atajadas", m.my.buffs) * 0.65 + effStat(mine.por, "reflejos", m.my.buffs) * 0.35) : 1;
  const pGoal = clamp(0.18 + q * 0.06 - porQ * 0.05 - (dPow - 2.5) * 0.04, 0.05, 0.42);
  if (rnd() < pGoal) return goalOpp(m, shooter);
  m.log("chance", `min ${m.min}' — ${def.name} CONTIENE y le da tiempo a la zaga; ${shooter.name} termina rematando sin ángulo y ${pick(["ataja el arquero", "la manda afuera", "pega en la defensa"])}.`);
  return false;
}

// ---------- Goles y VAR ----------

/**
 * Elige el asistidor de un gol MÍO, o null si el gol no lleva asistencia.
 * `assist`: undefined → sin asistencia (penal, jugada individual); un jugador → pasador
 * explícito (la jugada de "pase", asistencia segura); "open" → jugada abierta, con
 * ASSIST_CHANCE de tener asistidor, atribuido a un compañero en cancha ponderado PRO-MED
 * (el propio goleador y el arquero no asisten). Solo el caso "open" consume rng.
 */
function assistFor(m, scorer, assist) {
  if (assist === undefined) return null;
  if (assist !== "open") return assist;             // pasador explícito
  if (rnd() >= ASSIST_CHANCE) return null;          // esta jugada no tuvo asistencia
  const mates = m.activeMine().filter(p => p !== scorer && p.pos !== "POR");
  if (!mates.length) return null;
  return m._weightedPick(mates, mates.map(p => POS_ASSIST_WEIGHT[playedPos(p)] ?? 1));
}

/**
 * Anota gol mío (con posible revisión del VAR que lo anula el 12%×30% de las veces).
 * `assist` define el asistidor (ver assistFor): sus `asistencias` suben en el acto y se
 * revierten si el VAR anula, igual que los goles — así la tabla del torneo nunca cuenta
 * un gol fantasma.
 */
export function goalMine(m, p, flavor, assist, varOffside = true) {
  m.gMy++;
  p.goles = (p.goles || 0) + 1;
  m.scorers.push({ name: p.name, min: m.min });
  const assistP = assistFor(m, p, assist);
  if (assistP) { assistP.asistencias = (assistP.asistencias || 0) + 1; m.assists.push({ name: assistP.name, min: m.min }); }
  const assistTxt = assistP ? ` Asistencia de ${assistP.name}.` : "";
  // VAR. `varOffside = false` para los goles de PENAL: un penal convertido no puede
  // anularse por posición adelantada (bug reportado por el PO, 21-jul-2026) — el
  // pateador sale del punto blanco con todos detrás de la pelota.
  if (varOffside && rnd() < 0.12) {
    m.log("event", `min ${m.min}' — ⚽ Gol de ${p.name}... ¡pero el VAR lo está revisando! 😬`);
    if (rnd() < 0.3) {
      m.gMy--; p.goles--; m.scorers.pop();
      if (assistP) { assistP.asistencias--; m.assists.pop(); }
      m.log("event", `❌ GOL ANULADO por el VAR. Posición adelantada.`);
      return;
    }
    m.log("goal", `✅ ¡GOL CONFIRMADO! ${flavor} ${p.name}.${assistTxt} (${m.gMy}-${m.gOpp})`);
    return;
  }
  m.log("goal", `min ${m.min}' — ⚽ ¡GOOOOL DE ${p.name.toUpperCase()}! ${flavor}${assistTxt} (${m.gMy}-${m.gOpp})`);
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
