/* ============================================================
   game/match/acts/build — LOS ACTOS QUE CONSTRUYEN la jugada:
   circular, salir desde el área propia, cambiar el frente,
   conducir y presionar la salida rival.

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
import { protMomentum, protStatW, noteFiloHit, familyOf } from "../sequences.js";
import { hookOf, hooksOf, traitMoment, hasTrait } from "../trait-hooks.js";
import * as A from "../actions.js";
import { goalOpp, myPenalty } from "../chances.js";
import { moveBall, setBall, ADVANCE, BOX_MINE, otherLane } from "../field.js";
import { buildActDecision, resolveSequenceAct } from "../sequence-acts.js";
import { passTo, dtOk, dtFail, desmarqueW } from "./common.js";
import { escalate, closeSeq, closeSilent, maybeCounter, chainSetPiece, advFoulSetPiece, foulGeography } from "./chains.js";
import { oppShotBlockMalus } from "./block.js";

/** Los constructores de decisión de esta familia (los monta buildActDecision). */
export const BUILDERS = {
  build: (m, s) => ({
    title: `⚡ min ${m.clock()}' — Circulación: ${s.prot.name} tiene la pelota`,
    text: "¿Cómo la hacen circular?",
    options: [
      { label: "🎩 Pase seguro", hint: `Mantiene la posesión (Pase corto ${s.prot.stats.pase_corto})`, key: "seguro" },
      { label: "🔑 Pase filtrado", hint: "Arriesgado, pero deja mejor perfil de remate", key: "filtrado" },
      // LA TRAMPA (Posesión): la jugada NUEVA que desbloquea el rasgo — una tercera
      // opción en el acto, no un modificador escondido. Una sola vez por secuencia:
      // es un recurso del DT, no una forma de circular eternamente.
      ...(hookOf(m, "backPass") && !s.backUsed
        ? [{ label: "🔙 Retroceso de posesión", hint: "Saca al rival de su bloque: mejor perfil, pero la jugada no avanza", key: "atras" }]
        : []),
    ],
  }),
  buildout: (m, s) => ({
    title: `🧤 min ${m.clock()}' — Salida desde el área: la tiene ${s.prot.name}`,
    text: "El rival espera arriba y el equipo está metido en su campo. ¿Cómo la sacan?",
    options: [
      { label: "💎 Salir jugando en corto", hint: `Pase corto ${s.prot.stats.pase_corto} — romper la primera línea y salir de verdad`, key: "corto" },
      { label: "🌩️ Buscar al punta", hint: `Pase largo ${s.prot.stats.pase_largo} — la jugada se vuelve un duelo aéreo arriba`, key: "largo" },
      { label: "🚀 Afuera y a respirar", hint: "Seguro: se cede la pelota, no se arriesga nada", key: "seguro" },
    ],
  }),
  // El ataque a la ESPALDA del bloque adelantado: la otra jugada que el territorio
  // habilita — no tiene sentido contra un equipo metido atrás, y el generador lo sabe.
  switch: (m, s) => ({
    title: `🔀 min ${m.clock()}' — ${s.prot.name} levanta la cabeza: el otro carril está vacío`,
    text: "Todo el bloque rival se corrió a este lado. ¿Cómo cambian el frente?",
    options: [
      { label: "🔀 Diagonal larga al otro carril", hint: `Pase largo ${s.prot.stats.pase_largo} — si llega, el que recibe queda SOLO para centrar`, key: "largo" },
      { label: "🎯 Circular por dentro", hint: "Llega siempre… pero el rival se corre a tiempo y el centro sale contra la defensa acomodada", key: "dentro" },
    ],
  }),
  // ═══ LAS DOS JUGADAS DEL TERRITORIO (T4) ═══
  // La salida desde el área propia: la primera decisión del partido que solo existe
  // porque el motor sabe DÓNDE está la pelota. Tres fútbols distintos para el mismo
  // problema — y el del medio ni siquiera sigue siendo esta jugada.
  carry: (m, s) => ({
    title: `⚡ min ${m.clock()}' — Transición: ${s.prot.name} conduce`,
    text: "La defensa rival viene a la carrera. ¿Qué hace?",
    options: [
      { label: "🏃 Conducir al espacio", hint: `Puede ganar una falta (Aura ${s.prot.stats.aura})`, key: "conducir" },
      { label: "🎯 Pase al pie", hint: `Rápido y seguro (Pase corto ${s.prot.stats.pase_corto})`, key: "pase" },
    ],
  }),
  press: (m, s) => ({
    // El 2º acto de la Cacería total (M2) es la TRAMPA sobre el reseteo rival — mismo
    // gesto (Football Action de presión), otro momento del fútbol.
    title: s.type.id === "caceria" && s.actIdx === 1
      ? `🦁 min ${m.clock()}' — ¡El rival intenta resetear y la trampa se cierra! ${s.prot.name} otra vez encima`
      : `🦁 min ${m.clock()}' — ¡Presión alta! ${s.prot.name} achica sobre la salida rival`,
    text: "¿Cómo cazan la pelota?",
    options: [
      { label: "🔥 Presión total", hint: "Robo en zona letal (remate top)… pero si la rompen, duele", key: "total" },
      { label: "🕸️ Cerrar líneas de pase", hint: "Roba más seguido, en posición más discreta", key: "lineas" },
    ],
  }),
};

export function resolveBuild(m, s, key, f) {
  // LA TRAMPA (Posesión): el RETROCESO DE POSESIÓN. La jugada no avanza —se paga un
  // toque— pero el rival tiene que salir de su bloque, y el ataque queda mejor
  // perfilado. No es gratis: retroceder con el equipo adelantado es justo cuando la
  // pérdida más duele, así que el pase se juega de verdad y su fallo abre contra.
  if (key === "atras") {
    const bp = hookOf(m, "backPass");
    if (!bp) return resolveSequenceAct(m, "seguro");
    s.backUsed = true;                      // se marca ANTES de tirar: el recurso ya se gastó
    if (!A.actPass(m, s.prot).ok)
      return maybeCounter(m, `min ${m.clock()}' — ¡Le roban el pase hacia atrás a ${s.prot.name} con el equipo adelantado!`, true);
    s.bonus += bp.bonus;
    moveBall(m, ADVANCE.paseAtras);   // la jugada RETROCEDE: es el precio del recurso
    traitMoment(m, bp.traitId, [bp.texto]);
    passTo(m, s);
    buildActDecision(m);                    // el MISMO acto se vuelve a jugar: la jugada se reinicia
    return false;
  }
  // La construcción NO es una compuerta de supervivencia: modula la CALIDAD del remate
  // (bonus), no si la jugada muere. El pase seguro siempre progresa; el filtrado arriesga
  // perder la pelota a cambio de mejor perfil. Así el gate de gol es el remate (como las
  // ocasiones que reemplaza), no la cadena de actos — si no, tres actos multiplican el
  // fallo y el scoring se derrumba (medido en A1).
  if (key === "filtrado") {
    const r = A.actPass(m, s.prot, { hard: true });
    if (!r.ok) {
      // T1 — Buscar al Hombre Libre: el filtrado interceptado puede RECICLARSE (una
      // vez por secuencia): la posesión no muere — aparece el desmarcado, la pelota
      // cambia de pies y el MISMO momento se juega de nuevo (el bonus se perdió).
      // T3 — Juego Posicional lo vuelve ESTRUCTURA: más seguido y hasta dos veces.
      const up = hookOf(m, "recycleUpgrade");
      const h = up || hookOf(m, "recycleBuild");
      if (h && (s.recycles || 0) < (up?.max ?? 1) && rnd() < h.p) {
        s.recycles = (s.recycles || 0) + 1;
        traitMoment(m, h.traitId, [h.texto]);
        passTo(m, s);
        buildActDecision(m);
        return false;
      }
      return maybeCounter(m, `min ${m.clock()}' — ${f.buildFail}`, true);
    }
    s.bonus += 0.07;
  }
  s.buildOks = (s.buildOks || 0) + 1; // la sinfonía (M2) cuenta la desesperación rival
  // T3 — La Invitación: contra el rival que ESPERA (contra/bloque), la circulación
  // es un cebo — el compás acertado puede convertir en transición cuando el rival
  // da un paso al frente. La respuesta comprable al partido muerto.
  const bait = hookOf(m, "baitConvert");
  if (bait && familyOf(s.type) === "circulacion" && [].concat(bait.vsFilo).includes(m._seqPlan?.oppFilo?.id) && rnd() < bait.p) {
    noteFiloHit(m);
    traitMoment(m, bait.traitId, [bait.texto]);
    const t = sequenceType("transicion");
    m.seq = { type: t, prot: s.prot, actIdx: 0, bonus: s.bonus + bait.bonus, assistFrom: s.assistFrom };
    buildActDecision(m);
    return false;
  }
  // El pase MUEVE la pelota: el seguro progresa un tramo, el filtrado rompe una línea
  // entera (T4 — "cada acto modifica la ubicación del balón").
  moveBall(m, key === "filtrado" ? ADVANCE.paseFiltrado : ADVANCE.paseSeguro);
  const recibe = passTo(m, s); // seguro o filtrado: el pase cambia la pelota de pies
  m.log("plain", `min ${m.clock()}' — ${f.buildOk}${recibe ? ` La recibe ${s.prot.name}.` : ""}`);
  if (key === "filtrado") dtOk(m);
  return escalate(m);
}


// ═══ SALIDA DESDE EL ÁREA (T4) ═══
export function resolveBuildout(m, s, key, f) {
  if (key === "seguro") {
    // Cederla no es gratis ni es un desastre: el equipo respira y sale del embudo.
    setBall(m, { v: 3, side: "opp" });
    return closeSeq(m, "plain", `min ${m.clock()}' — ${f.outSafe}`);
  }
  if (key === "largo") {
    // El pelotazo CONVIERTE la jugada (mismo patrón def→of de la salida bajo presión):
    // deja de ser una salida y pasa a ser el duelo aéreo de un bloque bajo.
    m.log("plain", `min ${m.clock()}' — ${f.outLong}`);
    const t = sequenceType("pelotazo");
    const cands = m.activeMine().filter(p => p.pos !== "POR");
    const prot = m._weightedPick(cands, cands.map(p => (t.protWeight[playedPos(p)] ?? 1) * protMomentum(p) * protStatW(t, p)));
    setBall(m, { v: 3, h: 2 });
    m.seq = { type: t, prot, actIdx: 0, bonus: 0, assistFrom: s.prot };
    buildActDecision(m);
    return false;
  }
  const r = A.actPass(m, s.prot);
  if (!r.ok) {
    // Perderla en la puerta del área propia es EL regalo: el rival remata de una.
    m.log("chance", `min ${m.clock()}' — ${f.outFail(s.prot)}`);
    dtFail(m);
    setBall(m, { v: BOX_MINE, side: "opp" });
    const th = hookOf(m, "playoutRescue");   // El Tercer Hombre también salva ESTA salida
    if (th && rnd() < th.p) return closeSeq(m, "plain", `min ${m.clock()}' — ${th.texto}`);
    const { mine } = m.powers();
    const alive = m.oppLineup.filter(p => !p.expulsado && p.pos !== "POR");
    const sh = alive.length ? pick(alive) : null;
    if (sh) {
      const shot = A.actOppShot(m, sh, mine, { bonus: 0.10 + oppShotBlockMalus(m) });
      if (shot.ok) { goalOpp(m, sh); return closeSilent(m); }
      return closeSeq(m, "chance", `min ${m.clock()}' — ${sh.name} remata el regalo pero ${mine.por ? mine.por.name : "el arquero"} la saca.`);
    }
    return closeSilent(m);
  }
  moveBall(m, ADVANCE.paseFiltrado);   // romper la primera línea son DOS zonas de golpe
  s.bonus += 0.03;
  m.log("event", `min ${m.clock()}' — ${f.outShort(s.prot)}`);
  dtOk(m);
  passTo(m, s);
  return escalate(m);
}


// ═══ CAMBIO DE FRENTE (Eje Horizontal) ═══
export function resolveSwitch(m, s, key, f) {
  const destino = otherLane(m);
  if (key === "dentro") {
    // Circular por dentro SIEMPRE llega (misma convención que el pase seguro de la
    // construcción: la opción segura no se sortea) — el precio es que el bloque rival
    // se corre con la pelota y el centro sale contra la defensa ya acomodada.
    setBall(m, { h: destino });
    m.log("plain", `min ${m.clock()}' — ${f.switchSlow}`);
    passTo(m, s);
    return escalate(m);
  }
  const r = A.actPass(m, s.prot, { hard: true });   // la diagonal larga ES un pase de riesgo
  if (!r.ok) return maybeCounter(m, `min ${m.clock()}' — ${f.switchFail}`, true);
  setBall(m, { h: destino });
  // La recibe el que ESPERABA abierto del otro lado: pesa el que llega lanzado.
  const cands = m.activeMine().filter(p => p !== s.prot && p.pos !== "POR");
  if (cands.length) {
    s.assistFrom = s.prot;
    s.prot = m._weightedPick(cands, cands.map(p => (playedPos(p) === "DEF" ? 1 : 3) * desmarqueW(p)));
  }
  s.crossBonus = (s.crossBonus || 0) + 0.10;   // el centro sale con la defensa desarmada
  s.bonus += 0.03;
  m.log("event", `min ${m.clock()}' — ${f.switchOk(s.prot)}`);
  dtOk(m);
  return escalate(m);
}


export function resolveCarry(m, s, key, f) {
  // SEGUNDO AIRE (Contra, avanzada): conducir la contra con el tanque vacío deja de
  // ser una condena — el que corre fundido llega igual. SKILLER (Master): al que
  // conduce la contra no lo frenan limpio, así que la falta rival es más probable.
  const legs = hookOf(m, "tiredLegs");
  const tiredBonus = legs && familyOf(s.type) === "transicion" && (s.prot.energia ?? 100) < legs.under ? legs.bonus : 0;
  const sk = hookOf(m, "counterFouls");
  const foulPlus = sk && familyOf(s.type) === "transicion" ? sk.plus : 0;
  if (key === "conducir") {
    const r = A.actDribble(m, s.prot, { foulPlus,
      bonus: tiredBonus + (s.type.advFor === "contra" && s.actIdx === 1 ? s.type.adv.carryEase : 0) });
    if (tiredBonus && rnd() < 0.3) traitMoment(m, legs.traitId, [legs.texto]);
    if (r.foul && sk && foulPlus && rnd() < 0.4) traitMoment(m, sk.traitId, [sk.texto]);
    if (r.foul) {
      // GEOGRAFÍA de la falta en el Contragolpe letal (M2): en el primer tramo (lejos
      // del área) es la falta desesperada — amarilla + tiro libre encadenado; en el
      // segundo (zona letal) es PENAL, como la conducción de siempre.
      if (s.type.advFor === "contra" && s.actIdx === 0) return advFoulSetPiece(m, f.foulText, s.type.adv.freekickBonus);
      // LA GEOGRAFÍA GENERAL (T4): la falta se cobra DONDE LO BAJARON, y bajarlo es
      // justamente impedir que avance — así que la pelota NO progresa antes de juzgar
      // (medido: adelantarla primero metía media conducción de más dentro del área y
      // los penales SUBÍAN, que es lo contrario de lo que este arreglo busca). Dentro
      // del área es penal; fuera, tiro libre que vale más cuanto más cerca. Antes, una
      // falta en el mediocampo cobraba penal: el agujero más grande del motor sin
      // territorio.
      return foulGeography(m, s.prot);
    }
    if (!r.ok) {
      // 2º tramo del letal (M2): el rival YA está partido, replegando a la desesperada.
      // Un % de los "fallos" son en realidad FALTA DESESPERADA (decisión PO): ROJA por
      // último hombre + tiro libre al borde (despRed), o amarilla + PENAL (el resto) —
      // devuelve el EV del penal que la geografía le quitó al 1º tramo. Y perderla ahí
      // limpio no abre contra-contra (nadie quedó parado para lanzarla): muere y punto.
      if (s.type.advFor === "contra" && s.actIdx === 1) {
        if (rnd() < s.type.adv.despFoul) {
          const alive = m.oppLineup.filter(x => !x.expulsado && x.pos !== "POR");
          const rival = alive.length ? pick(alive) : null;
          if (rival && rnd() < s.type.adv.despRed) {
            rival.expulsado = true;
            m.log("card", `min ${m.clock()}' — 🟥 ${f.redText(rival)}`);
            return chainSetPiece(m, s.type.adv.despFreekickBonus);
          }
          if (rival) {
            rival.amarillaPartido = (rival.amarillaPartido || 0) + 1;
            m.log("card", `min ${m.clock()}' — 🟨 ${f.penalFoulText(rival)}`);
            if (rival.amarillaPartido >= 2) { rival.expulsado = true; m.log("card", `min ${m.clock()}' — 🟥 ¡Era su segunda amarilla! EXPULSADO.`); }
          }
          closeSilent(m);
          return myPenalty(m);
        }
        m.log("chance", `min ${m.clock()}' — ${f.carryFail}`); dtFail(m); return closeSilent(m);
      }
      return maybeCounter(m, `min ${m.clock()}' — ${f.carryFail}`, true);
    }
    // El Contragolpe letal paga por tramo (adv.carryBonus: el rival partido vale más
    // que la transición simple); el 1er tramo profundo era el rasgo F2 de Consolidada —
    // desde T2 lo compra La Trampa Cerrada (migración al árbol).
    s.bonus += (s.type.advFor === "contra" ? s.type.adv.carryBonus[Math.min(s.actIdx, 1)] : 0.05)
      + (s.type.advFor === "contra" && s.actIdx === 0 && hasTrait(m, "ataque_relampago") ? s.type.adv.deepBonus : 0);
    moveBall(m, ADVANCE.conduccion);   // conducir al espacio ES ganar terreno
    m.log("plain", `min ${m.clock()}' — ${f.carryOk(s.prot)}`);
    dtOk(m);
  } else {
    // Pase al pie: seguro, siempre progresa. En el Contragolpe letal (M2) TAMBIÉN gana
    // metros de verdad (adv.passBonus): con el rival partido, el pase al pie es progreso.
    s.bonus += (s.type.advFor === "contra" ? s.type.adv.passBonus[Math.min(s.actIdx, 1)] : 0.02) + tiredBonus;
    if (tiredBonus && rnd() < 0.3) traitMoment(m, legs.traitId, [legs.texto]);
    moveBall(m, ADVANCE.paseAlPie);
    const pasador = s.prot;
    m.log("plain", passTo(m, s) // el pase al pie también se desprende de la pelota
      ? `min ${m.clock()}' — ${pasador.name} la juega al pie y ${s.prot.name} toma la posta.`
      : `min ${m.clock()}' — ${f.carryOk(s.prot)}`);
  }
  // EL PASE DE LA CONTRA. Tres rasgos de dos filosofías lo trabajan y se APILAN:
  // Primer Pase (Contra, solo el acto que la lanza — `act: "first"`), Primera Marcha
  // (Contra, cualquier acto) y Salida Vertical (Bloque, cualquier acto). El momento
  // se narra una sola vez por acto aunque sumen varios.
  let tpBonus = 0, tpVoz = null;
  for (const tp of hooksOf(m, "transitionPass")) {
    if (familyOf(s.type) !== "transicion") break;
    if (tp.act === "first" && s.actIdx !== 0) continue;
    tpBonus += tp.bonus;
    tpVoz = tpVoz || tp;
  }
  if (tpBonus) {
    s.bonus += tpBonus;
    if (rnd() < 0.3) traitMoment(m, tpVoz.traitId, [tpVoz.texto]);
  }
  return escalate(m);
}


export function resolvePress(m, s, key, f) {
  // Recuperación alta: total = roba menos pero en zona letal; líneas = roba más, en peor pie.
  // El +0.10 es MI iniciativa: presionar una salida roba más que contener a un rival lanzado.
  const { mine } = m.powers();
  const total = key === "total";
  const caza = s.type.id === "caceria"; // la avanzada del Press (M2)
  const r = A.actContain(m, mine, { press: total, bonus: 0.10 });
  if (!r.ok) {
    // Cacería total: el rival que la rompe, un % de las veces la rompe CON FALTA —
    // amarilla (acumula) + tiro libre encadenado. El % profundo era el rasgo F2 de
    // Consolidada — desde T2 lo compra Cacería Letal (migración al árbol).
    if (caza && rnd() < (hasTrait(m, "gegenpressing") ? s.type.adv.foulBreakDeep : s.type.adv.foulBreak)) return advFoulSetPiece(m, f.foulText, s.type.adv.freekickBonus);
    return maybeCounter(m, `min ${m.clock()}' — ${f.pressFail}`, total);
  }
  // El 2º robo de la cacería es en ZONA LETAL (+trapBonus); el deepBonus era el rasgo
  // F2 de Consolidada — desde T2 lo compra Cacería Letal (migración al árbol).
  if (total) moveBall(m, ADVANCE.robo);   // el robo en zona letal es MÁS cerca del arco
  s.bonus += (total ? 0.15 : 0.05) + (caza && s.actIdx === 1 ? s.type.adv.trapBonus + (hasTrait(m, "gegenpressing") ? s.type.adv.deepBonus : 0) : 0);
  m.log("event", `min ${m.clock()}' — ${caza && s.actIdx === 1 ? f.press2Ok : f.pressOk}`);
  if (total) dtOk(m);
  // T1 — Trampa en la Banda: el robo de la recuperación puede CONVERTIRSE en ataque
  // inmediato (transición con el bonus a cuestas) en vez de escalar a su desenlace.
  // Por FAMILIA pero SOLO en el primer acto (gate T1): el robo en banda de la
  // cacería también convierte, pero jamás aborta su trampa final en zona letal.
  // El acierto de la firma ya se contó ANTES de convertir (noteFiloHit manual).
  const cv = hookOf(m, "convertOnPress");
  if (cv && familyOf(s.type) === "recuperacion" && s.actIdx === 0 && rnd() < cv.p) {
    noteFiloHit(m);
    traitMoment(m, cv.traitId, [cv.texto]);
    const t = sequenceType(cv.to);
    m.seq = { type: t, prot: s.prot, actIdx: 0, bonus: s.bonus + cv.bonus };
    buildActDecision(m);
    return false;
  }
  return escalate(m);
}


