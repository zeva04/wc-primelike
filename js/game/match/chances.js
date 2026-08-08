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
import { noteFiloHit } from "./sequences.js"; // ciclo benigno (como en sequence-acts): solo se llama en runtime
import { noteMomentum, markMomentum } from "./match-momentum.js";
import { inWing, defenseWidth } from "./field.js";

/**
 * Protagonista rival de una ocasión: un DEL/MED en cancha (o cualquiera si no queda ninguno).
 * Lo comparten el remate ambiente, el penal en contra y el último hombre.
 */
function oppShooter(m) {
  const shooters = m.oppLineup.filter(p => (p.pos === "DEL" || p.pos === "MED") && !p.expulsado);
  return shooters.length ? pick(shooters) : pick(m.oppLineup);
}

/**
 * Ocasión MÍA SIMULADA (no interactiva): un remate ambiente que produce gol o relato. Es la
 * parte "el resto se simula" del Bible §7 — lo interactivo lo llevan las secuencias
 * (sequences.js). Espejo del antiguo remate automático de myChance.
 */
export function ambientShotMine(m) {
  m.stats.misTiros++;
  noteMomentum(m, "remate");
  const cands = m.activeMine().filter(p => p.pos !== "POR");
  const prot = m._weightedPick(cands, cands.map(p => playedPos(p) === "DEL" ? 3 : playedPos(p) === "MED" ? 2 : 1));
  const q = effStat(prot, rnd() < 0.75 ? "tiro" : "cabezazo", m.my.buffs);
  const pGoal = clamp(0.11 + q * 0.08 - (teamRating(m.oppTeam) / 20) * 0.035, 0.06, 0.55);
  if (rnd() < pGoal) goalMine(m, prot, pick(["¡Golazo!", "¡Define como crack!", "¡La clava en el ángulo!"]), "open");
  else m.log("chance", `min ${m.clock()}' — ${prot.name} remata... ${pick(["¡ataja el arquero!", "¡se va apenas desviado!", "¡al palo!", "la defensa despeja."])}`);
}

/**
 * Ocasión RIVAL SIMULADA (no interactiva): remate ambiente rival. La defensa interactiva la
 * llevan las secuencias de repliegue. Espejo del antiguo remate automático de oppChance.
 */
export function ambientShotOpp(m, mine) {
  m.stats.oppTiros++;
  noteMomentum(m, "remate", "opp");
  const prot = oppShooter(m);
  const q = effStat(prot, "tiro");
  const porQ = mine.por ? (effStat(mine.por, "atajadas", m.my.buffs) * 0.65 + effStat(mine.por, "reflejos", m.my.buffs) * 0.35) : 1;
  // LA AMPLITUD DEFENSIVA (Eje Horizontal): la llegada rival que nace de una banda la
  // paga quien no tiene a nadie parado ahí. Es el canal de MÁS volumen del rival (~1,5
  // remates ambiente por partido), y por eso es donde una zaga de tres se siente de
  // verdad. Solo por afuera: por el centro, el ancho no cambia nada.
  const ancho = inWing(m) ? 0.06 * defenseWidth(m) : 0;
  const pGoal = clamp(0.12 + q * 0.08 - porQ * 0.06 - (mine.def - 2.5) * 0.04 - ancho, 0.05, 0.55);
  if (rnd() < pGoal) goalOpp(m, prot);
  else m.log("chance", `min ${m.clock()}' — ${prot.name} remata para ${m.oppTeam.name}... ${pick([`¡atajadón de ${mine.por ? mine.por.name : "tu arquero"}!`, "¡se va desviado!", "¡la defensa la saca!"])}`);
}

/**
 * Penal a favor como evento independiente (antes vivía dentro de myChance). Lo dispara el
 * tick a baja frecuencia; la resolución (resolvePenaltyMine) queda intacta.
 */
export function myPenaltyChance(m) {
  noteMomentum(m, "penal");
  // (el tiro del penal se cuenta en resolvePenaltyMine — la RESOLUCIÓN: así también
  // cuentan los penales nacidos de secuencias, que llaman a myPenalty directo. Bug T3)
  return myPenalty(m);
}

/**
 * Último hombre como evento independiente (antes vivía dentro de oppChance). Necesita un DEF
 * mío en cancha; si no hay, no dispara (devuelve false). La resolución (resolveLastMan) y sus
 * perfiles calibrados en el Sprint 1 quedan INTACTOS — A1 no toca su matemática.
 */
export function lastManChance(m) {
  const defs = m.activeMine().filter(p => playedPos(p) === "DEF");
  if (!defs.length) return false;
  noteMomentum(m, "contraataque", "opp");
  const def = pick(defs), prot = oppShooter(m);
  m.decision = {
    id: "last_man", prot: def, shooter: prot,
    title: `🛡️ min ${m.clock()}' — ¡${prot.name} filtra un pase y se escapa! ${def.name} es el último hombre`,
    text: "¿Cómo lo encara?",
    options: [
      { label: "🏃 Anticipar", hint: `Defensa ${def.stats.defensa} — corte limpio, o queda de cara al arco`, key: "anticipar", risk: 3 },
      { label: "🧹 Barrerse", hint: "Puede cortar, pero arriesga tarjeta o penal", key: "barrerse", risk: 5 },
      { label: "🧍 Esperar / contener", hint: "Seguro: baja la peligrosidad, remate a atajar", key: "esperar", risk: 2 },
    ],
  };
  m.stats.decisiones++;
  return true;
}

/** Penal en contra como evento independiente (antes dentro de oppChance). */
export function oppPenaltyChance(m) {
  noteMomentum(m, "penal", "opp");
  return oppPenaltyDecision(m, oppShooter(m));
}

/** Penal a favor: pide al usuario elegir pateador (decisión "penalty_mine"). */
export function myPenalty(m) {
  const cands = m.activeMine().filter(p => p.pos !== "POR");
  m.decision = {
    id: "penalty_mine",
    title: `🎯 min ${m.clock()}' — ¡PENAL A FAVOR!`,
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
  m.stats.misTiros++; // el penal ES un tiro — contado en la resolución (único punto, bug T3)
  // RECORTE DE BALANCE: la definición de penales NO lleva el % del Momento
  // (÷ momentoMult lo neutraliza). Fue la "primera línea de recorte" pactada al aprobar
  // la feature: con el efecto pleno, BRA derivaba ~+2pp en el smoke (precedente FEAT-003).
  const q = (effStat(p, "tiro", m.my.buffs) + effStat(p, "aura", m.my.buffs)) / 2 / momentoMult(p);
  const prob = clamp(0.52 + q * 0.07 + (m.my.buffs.penales || 0), 0.5, 0.93);
  if (rnd() < prob) goalMine(m, p, "¡PENAL CONVERTIDO con sangre fría!", undefined, false);
  else {
    m.pensFallados.push(p.name); // señal para el momento post-partido
    m.log("chance", `min ${m.clock()}' — ${p.name} patea el penal... ${pick(["¡EL ARQUERO LO ATAJA!", "¡LO TIRA AFUERA! Increíble.", "¡AL PALO!"])}`);
  }
  return false;
}

/** Crea la decisión "penalty_opp" (elegir el palo del arquero) para un pateador dado. */
function oppPenaltyDecision(m, shooter) {
  const { mine } = m.powers();
  m.decision = {
    id: "penalty_opp", shooter,
    title: `🧤 min ${m.clock()}' — ¡Penal en contra! Patea ${shooter.name}`,
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

/** Penal en contra: el usuario eligió el lado del arquero; adivinar da chance real de atajar. */
export function resolvePenaltyOpp(m, key) {
  const d = m.decision; m.decision = null;
  m.stats.oppTiros++; // simetría con resolvePenaltyMine: el penal rival también es un tiro (bug T3)
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
      m.log("event", `min ${m.clock()}' — ¡¡ATAJADO!! ${por ? por.name : "Tu arquero"} adivinó el lado. ¡HÉROE!`);
      return false;
    }
    m.log("goal_opp", `min ${m.clock()}' — Adivinaste el lado pero el remate de ${d.shooter.name} fue imposible. Gol de ${m.oppTeam.name}.`);
  } else {
    if (rnd() < 0.12) { m.log("event", `min ${m.clock()}' — ¡${d.shooter.name} LO TIRA AFUERA! Se salvaron.`); return false; }
    m.log("goal_opp", `min ${m.clock()}' — ${d.shooter.name} la puso al otro lado. Gol de ${m.oppTeam.name}.`);
  }
  m.gOpp++;
  m.oppGoalMins.push(m.min);
  return false;
}

// ---------- Último hombre ----------

/** Corte heroico del central: marca el crédito de Momento (+1 post-partido) y lo narra. */
function lastManStop(m, def, text) {
  m.lastManStops.push(def.name); // señal +Momento para applyMomentumPostMatch
  m.log("event", `min ${m.clock()}' — 🛡️ ${text}`);
  return false;
}

/**
 * Resuelve la decisión "último hombre" de MI central (d.prot) ante el escapado (d.shooter).
 * Perfiles:
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
    // ODISEA (2ª mitad): anticipar es leer Y llegar. Si el delantero es más rápido, el
    // adelantamiento sale peor — es justo la jugada donde el central lento se desnuda.
    const piernas = (effStat(def, "velocidad", m.my.buffs) - effStat(shooter, "velocidad")) * 0.05;
    const pCut = clamp(0.46 + edge * 0.14 + piernas + effStat(def, "aura", m.my.buffs) * 0.02, 0.25, 0.82);
    if (rnd() < pCut) return lastManStop(m, def, `${def.name} LEE el pase y se anticipa. ¡Corte magistral del último hombre!`);
    m.log("chance", `min ${m.clock()}' — ${def.name} se adelanta pero ${shooter.name} le gana la espalda y queda de cara al arco...`);
    m.stats.oppTiros++; // el mano a mano ES un remate rival (bug T3: no se contaba)
    if (rnd() < 0.68) return goalOpp(m, shooter); // gol muy probable
    m.log("event", `min ${m.clock()}' — ¡${m.powers().mine.por ? m.powers().mine.por.name : "tu arquero"} le tapa el mano a mano de milagro!`);
    return false;
  }

  if (key === "barrerse") {
    const pCut = clamp(0.44 + edge * 0.12, 0.25, 0.74);
    if (rnd() < pCut) return lastManStop(m, def, `${def.name} se BARRE y saca la pelota limpita al córner. ¡Ovación!`);
    // Mal timing → falta. En el área es penal; si no, tarjeta (de último hombre puede ser roja).
    m.lastManFouls.push(def.name); // señal −Momento (tarjeta o penal), pase lo que pase después
    if (rnd() < 0.28) {
      m.log("event", `min ${m.clock()}' — ¡${def.name} llega tarde en la barrida y comete PENAL! 😱`);
      return oppPenaltyDecision(m, shooter);
    }
    m.stats.tarjetas++;
    if (rnd() < 0.12) {
      def.expulsado = true;
      m.log("card", `min ${m.clock()}' — 🟥 ¡ROJA a ${def.name}! Frena el contragolpe como último hombre y se va expulsado. Juegan con ${m.activeMine().length}.`);
    } else {
      def.amarillaPartido = (def.amarillaPartido || 0) + 1;
      if (def.amarillaPartido >= 2) {
        def.expulsado = true;
        m.log("card", `min ${m.clock()}' — 🟥 Segunda amarilla y EXPULSIÓN de ${def.name} por la falta táctica.`);
      } else {
        m.log("card", `min ${m.clock()}' — 🟨 Amarilla a ${def.name} por la falta táctica que corta el ataque.`);
        if ((def.amarillas || 0) >= 1) m.log("card", `⚠️ ${def.name} estaba apercibido: acumula su segunda amarilla del torneo y se perderá el PRÓXIMO partido.`);
      }
    }
    return false; // la falta corta la jugada: sin gol
  }

  // esperar: contiene. Baja la peligrosidad y se resuelve como remate normal a atajar.
  const { mine } = m.powers();
  m.stats.oppTiros++; // remate rival contenido pero remate al fin (bug T3: no se contaba)
  const q = effStat(shooter, "tiro");
  const porQ = mine.por ? (effStat(mine.por, "atajadas", m.my.buffs) * 0.65 + effStat(mine.por, "reflejos", m.my.buffs) * 0.35) : 1;
  // ODISEA (costura cerrada): LA PERSECUCIÓN TRAS ROBO. Contener es exactamente eso —
  // "le da tiempo a la zaga", dice el relato: el último hombre aguanta mientras los demás
  // vuelven corriendo. Si vuelven rápido, el remate llega achicado; si no llegan, el que
  // se escapó define cómodo. El término está CENTRADO contra la velocidad del que corre,
  // así el ritmo de gol no se mueve: lo que se mueve es QUIÉN paga las contras.
  const pack = m.activeMine().filter(p => p !== def && p.pos !== "POR");
  const chase = pack.length ? pack.reduce((s, p) => s + effStat(p, "velocidad", m.my.buffs), 0) / pack.length : effStat(def, "velocidad", m.my.buffs);
  const piernas = (chase - effStat(shooter, "velocidad")) * 0.03;
  const pGoal = clamp(0.18 + q * 0.06 - porQ * 0.05 - (dPow - 2.5) * 0.04 - piernas, 0.05, 0.42);
  if (rnd() < pGoal) return goalOpp(m, shooter);
  m.log("chance", `min ${m.clock()}' — ${def.name} CONTIENE y le da tiempo a la zaga; ${shooter.name} termina rematando sin ángulo y ${pick(["ataja el arquero", "la manda afuera", "pega en la defensa"])}.`);
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
  // `min` es el minuto CRUDO (lo lee morale: el gol agónico) y `clock` el que se muestra
  // ("90+3" en el descuento) — el goleador de la ficha final se canta como en la tele.
  m.scorers.push({ name: p.name, min: m.min, clock: m.clock() });
  const assistP = assistFor(m, p, assist);
  if (assistP) { assistP.asistencias = (assistP.asistencias || 0) + 1; m.assists.push({ name: assistP.name, min: m.min }); }
  const assistTxt = assistP ? ` Asistencia de ${assistP.name}.` : "";
  // VAR. `varOffside = false` para los goles de PENAL: un penal convertido no puede
  // anularse por posición adelantada (bug reportado por el PO,) — el
  // pateador sale del punto blanco con todos detrás de la pelota.
  if (varOffside && rnd() < 0.12) {
    m.log("event", `min ${m.clock()}' — ⚽ Gol de ${p.name}... ¡pero el VAR lo está revisando! 😬`);
    if (rnd() < 0.3) {
      m.gMy--; p.goles--; m.scorers.pop();
      if (assistP) { assistP.asistencias--; m.assists.pop(); }
      m.log("event", `❌ GOL ANULADO por el VAR. Posición adelantada.`);
      return;
    }
    m.log("goal", `✅ ¡GOL CONFIRMADO! ${flavor} ${p.name}.${assistTxt} (${m.gMy}-${m.gOpp})`);
    noteFiloHit(m); // el gol que corona una secuencia firma también es ejecución
    golAlMomentum(m, "mine");
    return;
  }
  m.log("goal", `min ${m.clock()}' — ⚽ ¡GOOOOL DE ${p.name.toUpperCase()}! ${flavor}${assistTxt} (${m.gMy}-${m.gOpp})`);
  noteFiloHit(m); // ídem: solo si el gol quedó en pie (el anulado por VAR no cuenta)
  golAlMomentum(m, "mine");
}

/** Anota gol rival (el VAR te salva el 10%×35% de las veces). */
export function goalOpp(m, p) {
  m.gOpp++;
  m.oppGoalMins.push(m.min);
  if (rnd() < 0.10) {
    m.log("event", `min ${m.clock()}' — Gol de ${m.oppTeam.name}... ¡VAR en revisión!`);
    if (rnd() < 0.35) {
      m.gOpp--;
      m.oppGoalMins.pop();
      m.log("event", `✅ ¡ANULADO! El VAR te salva. Sigue ${m.gMy}-${m.gOpp}.`);
      return;
    }
  }
  m.log("goal_opp", `min ${m.clock()}' — 💔 Gol de ${p.name} para ${m.oppTeam.name}. (${m.gMy}-${m.gOpp})`);
  golAlMomentum(m, "opp");
}

/**
 * El gol al Match Momentum: el empujón grande y la marca ⚽ del gráfico. Se llama SOLO en
 * las salidas donde el gol QUEDÓ EN PIE — un gol anulado por el VAR no puede dejar ni
 * puntos ni marca (mismo criterio que ya tenían el marcador, los goleadores y las
 * asistencias, que se revierten). El remate que lo produjo ya contó aparte.
 */
function golAlMomentum(m, side) {
  noteMomentum(m, "gol", side);
  markMomentum(m, "⚽");
}
