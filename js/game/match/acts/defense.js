/* ============================================================
   game/match/acts/defense — LOS ACTOS DE DEFENDER:
   la salida bajo presión rival, la contención del ataque que
   llega y el remate rival que la cierra.

   Cada familia trae SUS constructores de decisión (`BUILDERS`) y
   SUS resolvers: agregar un acto es tocar un solo archivo. La
   entrada (`../sequence-acts.js`) solo los monta y despacha.

   Ciclo BENIGNO de runtime con la entrada y con `chains.js` (el
   mismo patrón que sequences ↔ sequence-acts): nada se usa en la
   evaluación del módulo, solo dentro de las funciones.
   ============================================================ */
import { rnd, pick } from "../../../core/rng.js";
import { playedPos } from "../../ratings.js";
import { sequenceType } from "../../../content/sequences.js";
import { protMomentum, familyOf } from "../sequences.js";
import { hookOf, rollChain, chainMine, traitMoment, hasTrait } from "../trait-hooks.js";
import { effStat } from "../powers.js";
import * as A from "../actions.js";
import { goalOpp, lastManChance } from "../chances.js";
import { moveBall, setBall, ADVANCE, BOX_MINE, defenseWidth, inWing } from "../field.js";
import { buildActDecision, resolveSequenceAct } from "../sequence-acts.js";
import { dtOk, dtFail } from "./common.js";
import { escalate, closeSeq, closeSilent, chainOppCorner, LASTMAN_FROM_CONTAIN } from "./chains.js";
import { oppShotBlockMalus, noteOppDead, clearChanceGuarded } from "./block.js";

/** Los constructores de decisión de esta familia (los monta buildActDecision). */
export const BUILDERS = {
  playout: (m, s) => ({
    title: `🗼 min ${m.clock()}' — ${m.oppTeam.name} asfixia la salida: la tiene ${s.prot.name}`,
    text: "¿Cómo salen del fondo?",
    options: [
      { label: "💎 Salir jugando", hint: `Pase corto ${s.prot.stats.pase_corto} — romper la presión regala una contra tuya`, key: "jugar" },
      { label: "🚀 Reventarla", hint: "Seguro: se pierde la pelota, no se arriesga nada", key: "despeje" },
    ],
  }),
  contain: (m, s) => ({
    title: `🧱 min ${m.clock()}' — ¡${s.shooter.name} encara! Hay que defender`,
    text: "¿Cómo lo frena la zaga?",
    options: [
      { label: "🧍 Contener y esperar", hint: "Seguro: baja la peligrosidad", key: "contener" },
      { label: "🏃 Salir a presionar", hint: "Corta más, pero si falla queda mejor perfilado", key: "presionar" },
      // PELOTAZO (Bloque, avanzada): "Reventar el Balón" — la tercera jugada NUEVA del
      // catálogo, junto al Retroceso de La Trampa y el Congelar de Fríos. No se sortea:
      // la elige el DT. Mata el ataque rival sin remate… y renuncia a todo lo que la
      // contención podía darte (convertir, encadenar contra) — y a veces sale al córner.
      ...(hookOf(m, "clearBall")
        ? [{ label: "🚀 Reventar el balón", hint: "Mata la jugada sin remate: el rival empieza de nuevo desde atrás… o se lleva un córner", key: "reventar" }]
        : []),
    ],
  }),
};

export function resolvePlayout(m, s, key, f) {
  // Salida bajo presión (def→of): reventarla es gratis; salir jugando arriesga un regalo
  // letal… o CONVIERTE la secuencia en una transición mía (la misma jugada sigue).
  if (key === "despeje") {
    const out = closeSeq(m, "plain", `min ${m.clock()}' — ${f.playoutSafe}`);
    // SAQUE RÁPIDO (Contra): reventarla ya no es rendirse — el equipo reinicia antes
    // de que el rival se acomode y la jugada muerta sale corriendo para el otro lado.
    const qr = rollChain(m, "quickRestart");
    if (qr && chainMine(m, "transicion", { bonus: qr.bonus, intro: qr.intro, buildDecision: buildActDecision })) return false;
    return out;
  }
  const r = A.actPass(m, s.prot, { hard: true });
  if (!r.ok) {
    // T2 — El Tercer Hombre: la salida rota puede RESCATARSE — el desmarcado aparece
    // a tiempo y el regalo letal no existe (la posesión se pierde sin sangre). La
    // vacuna comprable contra el festín del Press rival.
    const th = hookOf(m, "playoutRescue");
    if (th && rnd() < th.p) return closeSeq(m, "plain", `min ${m.clock()}' — ${th.texto}`);
    m.log("chance", `min ${m.clock()}' — ${f.playoutFail(s.prot)}`);
    dtFail(m);
    setBall(m, { v: BOX_MINE, side: "opp" });   // el regalo se produce EN mi área
    const { mine } = m.powers();
    const shot = A.actOppShot(m, s.shooter, mine, { bonus: 0.12 + oppShotBlockMalus(m) });
    if (shot.ok) { goalOpp(m, s.shooter); return closeSilent(m); }
    return closeSeq(m, "chance", `min ${m.clock()}' — ${s.shooter.name} remata el regalo pero ${mine.por ? mine.por.name : "el arquero"} responde. Se salvaron.`);
  }
  m.log("event", `min ${m.clock()}' — ${f.playoutOk(s.prot)}`);
  dtOk(m);
  setBall(m, { v: 3, side: "mine" });   // romper la presión SACA al equipo del embudo
  const t = sequenceType("transicion");
  const cands = m.activeMine().filter(p => p.pos !== "POR");
  const prot = m._weightedPick(cands, cands.map(p => (t.protWeight[playedPos(p)] ?? 1) * protMomentum(p)));
  // misma secuencia, ahora es MI contra; el que rompió la presión asiste si esto
  // termina en gol. (El bonus del rasgo F2 del Contra se fusionó en SU avanzada — M2.)
  m.seq = { type: t, prot, actIdx: 0, bonus: 0.04, assistFrom: s.prot };
  buildActDecision(m);
  return false;
}


export function resolveContain(m, s, key, f) {
  // PELOTAZO (Bloque): REVENTAR EL BALÓN. La jugada rival muere sin remate — el precio
  // es doble: se resigna todo lo que la contención podía dar (la fortaleza que convierte,
  // la contra que encadena) y `p` de las veces el despeje apurado sale al córner.
  if (key === "reventar") {
    // El hook se vuelve a pedir al resolver: si el rasgo ya no aplica acá (gate
    // territorial), la orden simplemente no existe y la jugada sigue su curso normal.
    const cb = hookOf(m, "clearBall");
    if (!cb) return resolveSequenceAct(m, "contener");
    traitMoment(m, cb.traitId, [cb.texto]);
    if (rnd() < cb.p) {
      m.log("chance", `min ${m.clock()}' — el despeje sale apurado y se va al CÓRNER de ${m.oppTeam.name}.`);
      return chainOppCorner(m);
    }
    noteOppDead(m);   // el ataque rival murió: alimenta la frustración como cualquier otro
    return closeSeq(m, "event", `min ${m.clock()}' — 🚀 La revientan lejos del área: ${m.oppTeam.name} tiene que armar todo otra vez desde atrás.`);
  }
  const { mine } = m.powers();
  const fortaleza = s.type.advFor === "bloque"; // la avanzada del Bloque (M2)
  // La contención profunda de la fortaleza era el rasgo F2 de Consolidada — desde T2
  // la compra Dueños del Área (migración al árbol); el repliegue base sigue original.
  // ODISEA: replegar es LLEGAR — la velocidad media de mi línea de fondo entra al corte.
  const zaga = m.activeMine().filter(p => playedPos(p) === "DEF");
  const chase = zaga.length ? zaga.reduce((a, p) => a + effStat(p, "velocidad", m.my.buffs), 0) / zaga.length : null;
  // ESTÓICOS (Contra, básica): replegado, el equipo aguanta lo que le tiren — la
  // contención del bloque corta más ("en Bloque Bajo" = cuando el equipo se repliega,
  // decisión PO 30-jul: no la filosofía homónima ni la mentalidad).
  const est = hookOf(m, "containBonus");
  // LA AMPLITUD DEFENSIVA (Eje Horizontal): cortar un ataque POR AFUERA depende de que
  // alguien esté parado ahí. Una zaga de tres cubre las dos bandas; una de uno vive de
  // milagro cada vez que la jugada se abre. Por el centro no cambia nada.
  const r = A.actContain(m, mine, { press: key === "presionar", chase,
    bonus: (est ? est.bonus : 0) + (inWing(m) ? 0.10 * defenseWidth(m) : 0)
      + (fortaleza && hasTrait(m, "area_blindada") ? s.type.adv.deepContain : 0) });
  if (est && r.ok && rnd() < 0.2) traitMoment(m, est.traitId, [est.texto]);
  if (r.ok) {
    setBall(m, { side: "mine" });   // cortar es recuperar: la pelota pasa a ser mía
    // La fortaleza CASTIGA (M2): la contención exitosa convierte — pelotazo inmediato
    // con el rival desarmado (def→of, el patrón de la salida bajo presión). El convert
    // profundo era el rasgo F2 de Consolidada — desde T2 lo compra Dueños del Área.
    if (fortaleza && rnd() < (hasTrait(m, "area_blindada") ? s.type.adv.convertDeep : s.type.adv.convert)) {
      if (r.press) dtOk(m);
      m.log("event", `min ${m.clock()}' — ${f.convertText(m.oppTeam)}`);
      const t = sequenceType("pelotazo");
      const cands = m.activeMine().filter(p => p.pos !== "POR");
      const prot = m._weightedPick(cands, cands.map(p => (t.protWeight[playedPos(p)] ?? 1) * protMomentum(p)));
      m.seq = { type: t, prot, actIdx: 0, bonus: s.type.adv.counterBonus, cornerOnDuelFail: s.type.adv.cornerOnDuelFail };
      buildActDecision(m);
      return false;
    }
    // T1 — Tender la Trampa: el repliegue contenido puede CONVERTIR en contra
    // (el rival quedó estirado a propósito) — el patrón def→of, ahora comprable.
    const tt = s.type.id === "repliegue" ? rollChain(m, "chainOnContain") : null;
    if (tt) {
      m.log("event", `min ${m.clock()}' — 🧱 ${f.containOk}`);
      if (r.press) dtOk(m);
      return chainMine(m, tt.to, { bonus: tt.bonus, intro: tt.intro, buildDecision: buildActDecision }) ? false : closeSilent(m);
    }
    const out = closeSeq(m, "event", `min ${m.clock()}' — 🧱 ${f.containOk}`); if (r.press) dtOk(m); noteOppDead(m); return out;
  }
  if (r.press) s.bonus = 0.05; // presión fallida: el rival queda mejor perfilado
  moveBall(m, ADVANCE.avanceRival);   // el rival progresa HACIA mi arco
  m.log("chance", `min ${m.clock()}' — ${f.containFail(m.oppTeam)}`);
  if (r.press) dtFail(m);
  // T1 — Oficio de Trinchera: el avance rival puede morir CORTADO (falta táctica,
  // ritmo roto) antes de llegar al remate — el partido se corta, la jugada muere.
  const of = hookOf(m, "oppLoseActs");
  if (of && rnd() < of.p) {
    traitMoment(m, of.traitId, [of.texto]);
    return closeSilent(m);
  }
  // FORTALEZA INEXPUGNABLE (Bloque, Master): la OCASIÓN CLARA que no ocurre. Antes de
  // que la contención rota se vuelva mano a mano, apareció el que tenía que aparecer.
  if (clearChanceGuarded(m)) return closeSilent(m);
  // ABSORCIÓN DEL ÚLTIMO HOMBRE (Sprint A2, decisión PO #7): buena parte de las
  // contenciones rotas terminan en el mano a mano con MI central — la decisión
  // `last_man` del Sprint 1, con su calibración INTACTA (lastManChance/resolveLastMan
  // no se tocan). La secuencia cierra y el último hombre toma el control.
  if (rnd() < LASTMAN_FROM_CONTAIN && lastManChance(m)) { closeSilent(m); return true; }
  return escalate(m); // escala al remate rival (clear)
}

/**
 * CLEAR — el único acto que se resuelve SOLO, sin preguntarle nada al DT: el rival
 * remata y mi arquero responde. Cierra el repliegue y la fortaleza.
 */
export function resolveClear(m, s, key, f) {
  // el rival remata, mi arquero responde (desenlace defensivo automático)
  const { mine } = m.powers();
  // T1 — Jaula Central: el remate del repliegue llega INCÓMODO (la jaula lo empujó
  // a la banda: la situación es peor, no mi arquero mejor — el canal finishBonus).
  // Por FAMILIA: la fortaleza también encierra (gate T1).
  const jl = hookOf(m, "oppShotMalus", familyOf(s.type));
  const malus = jl ? jl.bonus : 0;
  // BLOQUE BAJO: todo lo que el árbol le hace a este remate — la frustración acumulada,
  // la muralla mientras el marcador aguanta, el área blindada y la primera ocasión del
  // partido contra la defensa escalonada (ver oppShotBlockMalus).
  const r = A.actOppShot(m, s.shooter, mine, { bonus: s.bonus + malus + oppShotBlockMalus(m)
    - (inWing(m) ? 0.09 * defenseWidth(m) : 0) });   // el remate que nace de una banda cubierta llega peor
  if (r.ok) { goalOpp(m, s.shooter); return closeSilent(m); }
  const out = closeSeq(m, "chance", `min ${m.clock()}' — ${s.shooter.name} remata pero ${pick([`ataja ${mine.por ? mine.por.name : "el arquero"}`, "se va afuera", "la bloquea la zaga"])}.`);
  if (malus && rnd() < 0.4) traitMoment(m, jl.traitId, [jl.texto]); // el momento se narra a veces (sin spamear)
  else noteOppDead(m);
  return out;
}

