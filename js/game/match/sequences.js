/* ============================================================
   game/match/sequences — la máquina de Key Sequences (Bible §7).
   Opera sobre una instancia de Match, como chances/incidents.

   Una secuencia es una historia en miniatura de 1 a 3 actos
   (decisión PO): cada acto es una DECISIÓN del DT que se resuelve
   con Football Actions (actions.js). Al acertar, la jugada ESCALA
   al acto siguiente; al fallar, CIERRA (en A1 el fallo cierra; el
   fallo que encadena —rebote, pelota suelta— es A2). El último
   acto del plan es el desenlace (remate / atajada).

   Contrato §3.2 — la decisión `sequence`:
     - la crea startSequence/buildActDecision (setea m.decision)
     - la resuelve resolveSequenceAct (acá)
     - la rutea screens/match.js → match.resolveSequenceAct(key)
   Como cada acto es una decisión y tick() corta con decisión
   pendiente, la escalera multi-acto funciona sola en la UI y en
   el smoke sin tocar sus loops: resolver un acto puede dejar
   OTRA decisión (el acto siguiente) y ambos loops la reprocesan.

   GENERACIÓN (decisión PO): sobre la marcha, apuntando a un
   objetivo de 2-6 por partido modulado por la preparación (Bible:
   la preparación determina cuántas oportunidades recibes). Se
   decide por tick para que A3 pueda meter contexto (marcador,
   minuto, fatiga) sin reescribir esto.
   ============================================================ */
import { rnd, ri, pick } from "../../core/rng.js";
import { clamp } from "../../core/math.js";
import { playedPos } from "../ratings.js";
import { SEQUENCE_TYPES, sequenceType } from "../../content/sequences.js";
import * as A from "./actions.js";
import { goalMine, goalOpp, myPenalty } from "./chances.js";

// Rango objetivo de secuencias por partido (Bible §7: "aproximadamente 2 a 6").
export const SEQ_MIN = 2, SEQ_MAX = 6;

/**
 * Objetivo de secuencias del partido y reparto ofensivo/defensivo, desde la preparación
 * (ventaja atk+def sobre el rival) y la mentalidad. Se calcula UNA vez por partido y queda
 * cacheado en m._seqPlan. El favorito bien preparado recibe más secuencias y más ofensivas;
 * el superado, menos y más defensivas — es el pago visible de prepararse (Bible §7).
 */
function seqPlan(m) {
  if (m._seqPlan) return m._seqPlan;
  const { mine, opp } = m.powers();
  const edge = (mine.atk - opp.atk) + (mine.def - opp.def); // ~[-6, 6]
  const target = clamp(Math.round(4 + edge * 0.32 + ri(-1, 1) * 0.5), SEQ_MIN, SEQ_MAX);
  const mentShift = m.my.mentalidad === "ofensiva" ? 0.10 : m.my.mentalidad === "defensiva" ? -0.10 : 0;
  const mineShare = clamp(0.5 + edge * 0.045 + mentShift, 0.3, 0.72);
  m._seqPlan = { target, mineShare };
  return m._seqPlan;
}

/**
 * ¿Arranca una secuencia en este tick? Sobre la marcha: la probabilidad reparte las
 * secuencias que faltan entre los ticks que quedan, así el partido tiende al objetivo sin
 * agolparlas. Devuelve true (y deja m.decision) si arrancó una.
 */
export function maybeStartSequence(m) {
  if (m.seq) return false; // ya hay una en curso (no debería: la decisión bloquea el tick)
  const plan = seqPlan(m);
  const done = m._seqCount || 0;
  if (done >= plan.target) return false;
  const end = m.phase === "extra" ? 120 : 90;
  const ticksLeft = Math.max(1, Math.ceil((end - m.min) / 5));
  const pStart = (plan.target - done) / ticksLeft;
  if (rnd() >= pStart) return false;
  const side = rnd() < plan.mineShare ? "mine" : "opp";
  const pool = SEQUENCE_TYPES.filter(t => t.side === side);
  startSequence(m, pick(pool));
  return true;
}

/** Arranca una secuencia de un tipo dado: elige protagonista y crea la decisión del acto 1. */
export function startSequence(m, type) {
  m._seqCount = (m._seqCount || 0) + 1;
  m.stats.decisiones++;
  if (type.side === "mine") {
    const cands = m.activeMine().filter(p => p.pos !== "POR");
    const prot = m._weightedPick(cands, cands.map(p => type.protWeight[playedPos(p)] ?? 1));
    m.seq = { type, prot, actIdx: 0, bonus: 0 };
    m.log("event", `⚡ min ${m.min}' — ${type.icon} ${type.flavor.intro(prot)}`);
  } else {
    const shooters = m.oppLineup.filter(p => (p.pos === "DEL" || p.pos === "MED") && !p.expulsado);
    const shooter = shooters.length ? pick(shooters) : pick(m.oppLineup);
    m.seq = { type, shooter, actIdx: 0 };
    m.log("event", `🧱 min ${m.min}' — ${type.flavor.intro(m.oppTeam)}`);
  }
  buildActDecision(m);
}

/** Crea la decisión del acto actual según su `kind`. Las opciones son reglas (mapean a
 *  Football Actions); el flavor viene del tipo. */
function buildActDecision(m) {
  const s = m.seq, kind = s.type.plan[s.actIdx];
  const opts = {
    build: () => ({
      title: `⚡ min ${m.min}' — Circulación: ${s.prot.name} tiene la pelota`,
      text: "¿Cómo la hacen circular?",
      options: [
        { label: "🎩 Pase seguro", hint: `Mantiene la posesión (Pase ${s.prot.stats.pase})`, key: "seguro" },
        { label: "🔑 Pase filtrado", hint: "Arriesgado, pero deja mejor perfil de remate", key: "filtrado" },
      ],
    }),
    carry: () => ({
      title: `⚡ min ${m.min}' — Transición: ${s.prot.name} conduce`,
      text: "La defensa rival viene a la carrera. ¿Qué hace?",
      options: [
        { label: "🏃 Conducir al espacio", hint: `Puede ganar una falta (Aura ${s.prot.stats.aura})`, key: "conducir" },
        { label: "🎯 Pase al pie", hint: `Rápido y seguro (Pase ${s.prot.stats.pase})`, key: "pase" },
      ],
    }),
    finish: () => ({
      title: `🎯 min ${m.min}' — ¡Momento de definir! ${s.prot.name}`,
      text: "¿Cómo resuelve la jugada?",
      options: [
        { label: "💥 Rematar", hint: `Tiro ${s.prot.stats.tiro}`, key: "rematar" },
        { label: "🤝 Buscar al mejor ubicado", hint: "Un pase más para una definición mejor", key: "asistir" },
      ],
    }),
    contain: () => ({
      title: `🧱 min ${m.min}' — ¡${s.shooter.name} encara! Hay que defender`,
      text: "¿Cómo lo frena la zaga?",
      options: [
        { label: "🧍 Contener y esperar", hint: "Seguro: baja la peligrosidad", key: "contener" },
        { label: "🏃 Salir a presionar", hint: "Corta más, pero si falla queda mejor perfilado", key: "presionar" },
      ],
    }),
  }[kind]();
  m.decision = { id: "sequence", ...opts };
}

/**
 * Resuelve el acto actual con la opción elegida. Narra, y ESCALA (deja la decisión del acto
 * siguiente) o CIERRA la secuencia (desenlace: gol, erra, corte). Devuelve false (el tick
 * sigue) — como los otros resolvers.
 */
export function resolveSequenceAct(m, key) {
  const s = m.seq;
  m.decision = null;
  const kind = s.type.plan[s.actIdx];
  const f = s.type.flavor;

  if (kind === "build") {
    // La construcción NO es una compuerta de supervivencia: modula la CALIDAD del remate
    // (bonus), no si la jugada muere. El pase seguro siempre progresa; el filtrado arriesga
    // perder la pelota a cambio de mejor perfil. Así el gate de gol es el remate (como las
    // ocasiones que reemplaza), no la cadena de actos — si no, tres actos multiplican el
    // fallo y el scoring se derrumba (medido en A1).
    if (key === "filtrado") {
      const r = A.actPass(m, s.prot, { hard: true });
      if (!r.ok) return closeSeq(m, "chance", `min ${m.min}' — ${f.buildFail}`);
      s.bonus += 0.07;
    }
    m.log("plain", `min ${m.min}' — ${f.buildOk}`);
    return escalate(m);
  }

  if (kind === "carry") {
    if (key === "conducir") {
      const r = A.actDribble(m, s.prot);
      if (r.foul) { m.log("event", `min ${m.min}' — ¡Derriban a ${s.prot.name}! ¡PENAL!`); closeSilent(m); return myPenalty(m); }
      if (!r.ok) return closeSeq(m, "chance", `min ${m.min}' — ${f.carryFail}`);
      s.bonus += 0.05;
    } else {
      s.bonus += 0.02; // pase al pie: seguro, siempre progresa
    }
    m.log("plain", `min ${m.min}' — ${f.carryOk(s.prot)}`);
    return escalate(m);
  }

  if (kind === "finish") {
    if (key === "asistir") {
      const mates = m.activeMine().filter(p => p !== s.prot && p.pos !== "POR");
      const mate = mates.length ? m._weightedPick(mates, mates.map(p => playedPos(p) === "DEL" ? 3 : 1)) : s.prot;
      const pass = A.actPass(m, s.prot);
      if (!pass.ok) return closeSeq(m, "chance", `min ${m.min}' — el pase de ${s.prot.name} no encuentra a nadie.`);
      const shot = A.actShot(m, mate, { stat: f.finishStat, bonus: s.bonus + f.finishBonus + 0.04 });
      if (shot.ok) { goalMine(m, mate, "¡Definición tras la asistencia!", s.prot); return closeSilent(m); }
      return closeSeq(m, "chance", `min ${m.min}' — ${mate.name} no logra conectar el remate.`);
    }
    const shot = A.actShot(m, s.prot, { stat: f.finishStat, bonus: s.bonus + f.finishBonus });
    if (shot.ok) { goalMine(m, s.prot, "¡Culminó la jugada!", "open"); return closeSilent(m); }
    return closeSeq(m, "chance", `min ${m.min}' — ${s.prot.name} remata pero ${pick(["ataja el arquero", "se va desviado", "la saca la defensa"])}.`);
  }

  if (kind === "contain") {
    const { mine } = m.powers();
    const r = A.actContain(m, mine, { press: key === "presionar" });
    if (r.ok) return closeSeq(m, "event", `min ${m.min}' — 🧱 ${f.containOk}`);
    if (r.press) s.bonus = 0.05; // presión fallida: el rival queda mejor perfilado
    m.log("chance", `min ${m.min}' — ${f.containFail(m.oppTeam)}`);
    return escalate(m); // escala al remate rival (clear)
  }

  // clear: el rival remata, mi arquero responde (desenlace defensivo, sin decisión extra en A1)
  const { mine } = m.powers();
  const r = A.actOppShot(m, s.shooter, mine);
  if (r.ok) { goalOpp(m, s.shooter); return closeSilent(m); }
  return closeSeq(m, "chance", `min ${m.min}' — ${s.shooter.name} remata pero ${pick([`ataja ${mine.por ? mine.por.name : "el arquero"}`, "se va afuera", "la bloquea la zaga"])}.`);
}

// Actos que se resuelven SOLOS, sin pedir decisión al DT (desenlaces): el remate rival de una
// secuencia de repliegue. El resto son interactivos (crean una decisión `sequence`).
const AUTO_ACTS = new Set(["clear"]);

/**
 * Pasa al acto siguiente. Si el plan se acabó, cierra. Si el próximo acto es interactivo,
 * crea su decisión. Si es un desenlace automático (AUTO_ACTS), lo resuelve en el acto —
 * sin pedirle nada al DT (p. ej. el remate rival tras una contención fallida).
 */
function escalate(m) {
  const s = m.seq;
  s.actIdx++;
  if (s.actIdx >= s.type.plan.length) return closeSilent(m);
  if (AUTO_ACTS.has(s.type.plan[s.actIdx])) return resolveSequenceAct(m, null);
  buildActDecision(m);
  return false;
}

/** Cierra la secuencia con una línea de relato. */
function closeSeq(m, kind, text) {
  m.log(kind, text);
  m.seq = null;
  return false;
}

/** Cierra la secuencia sin relato extra (el desenlace ya se narró: gol, penal, etc.). */
function closeSilent(m) {
  m.seq = null;
  return false;
}
