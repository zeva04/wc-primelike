/* ============================================================
   game/match/sequence-acts — los ACTOS de las Key Sequences:
   constructores de decisión, resolución, escalada y el fallo que
   encadena (rebote / contra / mano a mano). Extraído de
   sequences.js en A2 por presupuesto de líneas (ARQUITECTURA §6:
   el archivo pasó de 300 con el catálogo completo) — mudanza
   pura, cero cambios de lógica.

   La GENERACIÓN (qué secuencia sale y cuándo) vive en
   sequences.js; acá vive CÓMO se juega una vez que arrancó.
   Contrato §3.2: la decisión `sequence` se crea acá
   (buildActDecision) y se resuelve acá (resolveSequenceAct).
   ============================================================ */
import { rnd, pick } from "../../core/rng.js";
import { playedPos } from "../ratings.js";
import { sequenceType } from "../../content/sequences.js";
import { protMomentum, noteFiloHit, familyOf } from "./sequences.js"; // ciclo benigno: solo se llama en runtime
import { hookOf, hooksOf, rollChain, chainMine, traitMoment, hasTrait } from "./trait-hooks.js"; // el árbol de rasgos (T1/T2)
import { effStat } from "./powers.js";
import * as A from "./actions.js";
import { goalMine, goalOpp, myPenalty, lastManChance } from "./chances.js";
import { noteCorner } from "./stats.js";
import { noteMomentum } from "./match-momentum.js";

// El plan de actos de la secuencia: el propio si lo tiene (rasgo de Posesión:
// un acto más de circulación, lo arma startSequence) o el del catálogo.
const planOf = s => s.plan || s.type.plan;

/** Peso del DESMARQUE (Odisea): el que se suelta para recibir es el que arranca. Mismo
 *  cuadrático sobre 70 que `protStatW` — inclina fuerte sin ser determinista. */
const desmarqueW = p => ((p.stats.velocidad ?? 70) / 70) ** 2;

/** Crea la decisión del acto actual según su `kind`. Las opciones son reglas (mapean a
 *  Football Actions); el flavor viene del tipo. */
export function buildActDecision(m) {
  const s = m.seq, kind = planOf(s)[s.actIdx];
  const opts = {
    build: () => ({
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
    carry: () => ({
      title: `⚡ min ${m.clock()}' — Transición: ${s.prot.name} conduce`,
      text: "La defensa rival viene a la carrera. ¿Qué hace?",
      options: [
        { label: "🏃 Conducir al espacio", hint: `Puede ganar una falta (Aura ${s.prot.stats.aura})`, key: "conducir" },
        { label: "🎯 Pase al pie", hint: `Rápido y seguro (Pase corto ${s.prot.stats.pase_corto})`, key: "pase" },
      ],
    }),
    finish: () => ({
      title: `🎯 min ${m.clock()}' — ¡Momento de definir! ${s.prot.name}`,
      text: "¿Cómo resuelve la jugada?",
      options: [
        { label: "💥 Rematar", hint: `Tiro ${s.prot.stats.tiro}`, key: "rematar" },
        { label: "🤝 Buscar al mejor ubicado", hint: "Un pase más para una definición mejor", key: "asistir" },
        // FRÍOS (Press, Master): la otra jugada NUEVA del catálogo. Solo en el tramo
        // final y sin ir perdiendo — congelar ganando o empatando es fútbol; hacerlo
        // en el minuto 20 sería renunciar al partido.
        ...(canFreeze(m) ? [{ label: "🧊 Congelar el partido", hint: "Renuncias al remate: a cambio, el rival pierde su próxima llegada", key: "congelar" }] : []),
        // PASE ATRÁS (Contra, avanzada): la jugada de finalización de la contra. Solo en
        // SU familia — es el que llegó al fondo pisándola para el que entra de frente.
        ...(hookOf(m, "squarePass") && familyOf(s.type) === "transicion"
          ? [{ label: "🎯 Pase atrás", hint: `La pisa y la devuelve al que entra de frente (Pase corto ${s.prot.stats.pase_corto})`, key: "pase_atras" }]
          : []),
      ],
    }),
    contain: () => ({
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
    press: () => ({
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
    duel: () => ({
      title: `🌩️ min ${m.clock()}' — Pelotazo a ${s.prot.name}: se viene el duelo aéreo`,
      text: "¿Cómo lo juega?",
      options: [
        { label: "🤜 Ir al choque", hint: `Cabezazo ${s.prot.stats.cabezazo} — ganarla es rematar de cabeza`, key: "choque" },
        { label: "🪶 Peinarla al espacio", hint: "Prolonga para un compañero lanzado: más letal, más difícil", key: "peinar" },
        // HOMBRE OBJETIVO (Bloque, Master): "Pivoteo al Área". El que gana por arriba no
        // remata: la aguanta de espaldas y la BAJA para el mejor rematador, que llega de
        // frente al arco. Tampoco se sortea — es una decisión del DT.
        ...(hookOf(m, "pivot")
          ? [{ label: "🎯 Pivotear al área", hint: "La aguanta de espaldas y la baja al mejor rematador, de frente al arco", key: "pivotear" }]
          : []),
      ],
    }),
    setpiece: () => {
      const mates = m.activeMine().filter(p => p !== s.prot && p.pos !== "POR");
      s.target = mates.sort((a, b) => (b.stats.cabezazo || 0) - (a.stats.cabezazo || 0))[0] || s.prot;
      return {
        title: `🎯 min ${m.clock()}' — Balón parado: lo para ${s.prot.name}`,
        text: "¿Qué ensayaron en la semana?",
        options: [
          { label: `📡 Centro al área para ${s.target.name}`, hint: `Cabezazo ${s.target.stats.cabezazo}`, key: "centro" },
          { label: "🎭 Jugada preparada", hint: `Descarga corta y remate (Tiro ${s.prot.stats.tiro})`, key: "jugada" },
        ],
      };
    },
    defend_sp: () => ({
      title: `🚨 min ${m.clock()}' — Córner de ${m.oppTeam.name}: ${s.shooter.name} manda en el área`,
      text: "¿Cómo lo defiende la zaga?",
      options: [
        { label: "🧲 Defensa en zona", hint: "Seguro: cada uno cuida su espacio", key: "zonal" },
        { label: "🥊 Salir a despejar", hint: "Puede matar la jugada de una… pero si falla, el cabeceador queda solo", key: "salir" },
      ],
    }),
    // ═══ EL DESBORDE POR LA BANDA (Odisea, 2ª mitad) ═══
    // Tres opciones = tres fútbols distintos por afuera. La primera pregunta del acto no
    // es "¿tenés pase?" sino "¿tenés piernas?": el rival que corre con él sale del once
    // rival y su velocidad DECIDE (actions.actSprint).
    wing: () => {
      s.chaser = wingChaser(m);
      return {
        title: `🏃 min ${m.clock()}' — Banda: ${s.prot.name} encara a ${s.chaser ? s.chaser.name : "su marca"}`,
        text: "El pasillo de afuera está abierto. ¿Qué hace?",
        options: [
          { label: "🏁 Ir a la línea de fondo", hint: `Velocidad ${s.prot.stats.velocidad} vs ${s.chaser ? s.chaser.stats.velocidad : "el lateral"} — si llega, centra con la zaga de espaldas`, key: "fondo" },
          { label: "📡 Centrar de primera", hint: "No arriesga el desborde, pero la defensa llega acomodada", key: "primera" },
          { label: "✂️ Cortar hacia adentro", hint: `Se perfila y busca el remate él mismo (Tiro ${s.prot.stats.tiro})`, key: "adentro" },
        ],
      };
    },
    // El envío desde la banda: es EL sitio donde el split de pase decide qué jugada se
    // juega — el centro alto es pase largo y termina en cabezazo; el rasante es pase
    // corto y termina en remate de frente.
    cross: () => ({
      title: `📡 min ${m.clock()}' — ${s.prot.name} levanta la cabeza desde el costado`,
      text: "El área está poblada. ¿Qué manda?",
      options: [
        { label: "📡 Centro al área", hint: `Pase largo ${s.prot.stats.pase_largo} — busca la cabeza del mejor rematador`, key: "centro" },
        { label: "🎯 Pase atrás rasante", hint: `Pase corto ${s.prot.stats.pase_corto} — al que llega de frente al arco`, key: "atras" },
      ],
    }),
    playout: () => ({
      title: `🗼 min ${m.clock()}' — ${m.oppTeam.name} asfixia la salida: la tiene ${s.prot.name}`,
      text: "¿Cómo salen del fondo?",
      options: [
        { label: "💎 Salir jugando", hint: `Pase corto ${s.prot.stats.pase_corto} — romper la presión regala una contra tuya`, key: "jugar" },
        { label: "🚀 Reventarla", hint: "Seguro: se pierde la pelota, no se arriesga nada", key: "despeje" },
      ],
    }),
  }[kind]();
  m.decision = { id: "sequence", ...opts };
}

/**
 * El lateral que corre la banda con mi extremo (Odisea): un DEF rival en cancha. Se elige
 * el MÁS RÁPIDO de su zaga — el desborde se juega contra el que puede seguirlo, no contra
 * el central lento que quedó del otro lado. Sin defensas en pie (equipo diezmado, rojas)
 * devuelve null y actSprint usa la nota del rival como proxy.
 */
function wingChaser(m) {
  const defs = m.oppLineup.filter(p => !p.expulsado && p.pos === "DEF");
  const pool = defs.length ? defs : m.oppLineup.filter(p => !p.expulsado && p.pos !== "POR");
  return pool.sort((a, b) => (b.stats.velocidad || 0) - (a.stats.velocidad || 0))[0] || null;
}

/**
 * ¿Se puede congelar? Fríos es un rasgo de ESTADO: pide el tramo final (desde el 70')
 * y NO ir perdiendo — con ventaja o empate (decisión PO: el empate también sirve, y
 * en fase de grupos a veces es justo lo que hace falta).
 */
export const FREEZE_FROM_MIN = 70;
const canFreeze = m => !!hookOf(m, "iceGame") && m.min >= FREEZE_FROM_MIN && m.gMy >= m.gOpp;

// Feedback del DT (PO 22-jul): solo las decisiones con RIESGO real generan comentario —
// el relato celebra el acierto de la arriesgada y cobra su fallo. La opción segura no
// opina: no hay mérito en lo seguro.
const dtOk = m => m.log("info", `min ${m.clock()}' — 🎯 ${pick(["La decisión del DT fue la correcta.", "La apuesta del banco sale perfecta.", "El riesgo del DT paga."])}`);
const dtFail = m => m.log("info", `min ${m.clock()}' — 💢 ${pick(["La apuesta del DT salió cara.", "El riesgo no pagó esta vez.", "Decisión valiente, castigo inmediato."])}`);

/**
 * El que pasa SE DESPRENDE de la pelota (bug PO 22-jul): la recibe un compañero, que pasa a
 * ser el protagonista del acto siguiente (ponderado por el puesto que pide el tipo y su
 * Momento, como en el arranque). El pasador queda como asistidor si el receptor convierte.
 * Devuelve false si no hay a quién pasársela (equipo diezmado): el prot no cambia.
 */
function passTo(m, s) {
  const cands = m.activeMine().filter(p => p !== s.prot && p.pos !== "POR");
  if (!cands.length) return false;
  s.assistFrom = s.prot;
  s.prot = m._weightedPick(cands, cands.map(p => (s.type.protWeight[playedPos(p)] ?? 1) * protMomentum(p)));
  return true;
}

/**
 * Resuelve el acto actual con la opción elegida. Narra, y ESCALA (deja la decisión del acto
 * siguiente) o CIERRA la secuencia (desenlace: gol, erra, corte). Devuelve false (el tick
 * sigue) — como los otros resolvers.
 */
export function resolveSequenceAct(m, key) {
  const s = m.seq;
  m.decision = null;
  const kind = planOf(s)[s.actIdx];
  const f = s.type.flavor;

  if (kind === "build") {
    // LA TRAMPA (Posesión): el RETROCESO DE POSESIÓN. La jugada no avanza —se paga un
    // toque— pero el rival tiene que salir de su bloque, y el ataque queda mejor
    // perfilado. No es gratis: retroceder con el equipo adelantado es justo cuando la
    // pérdida más duele, así que el pase se juega de verdad y su fallo abre contra.
    if (key === "atras") {
      const bp = hookOf(m, "backPass");
      s.backUsed = true;                      // se marca ANTES de tirar: el recurso ya se gastó
      if (!A.actPass(m, s.prot).ok)
        return maybeCounter(m, `min ${m.clock()}' — ¡Le roban el pase hacia atrás a ${s.prot.name} con el equipo adelantado!`, true);
      s.bonus += bp.bonus;
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
    const recibe = passTo(m, s); // seguro o filtrado: el pase cambia la pelota de pies
    m.log("plain", `min ${m.clock()}' — ${f.buildOk}${recibe ? ` La recibe ${s.prot.name}.` : ""}`);
    if (key === "filtrado") dtOk(m);
    return escalate(m);
  }

  if (kind === "carry") {
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
        m.log("event", `min ${m.clock()}' — ¡Derriban a ${s.prot.name}! ¡PENAL!`); closeSilent(m); return myPenalty(m);
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
      m.log("plain", `min ${m.clock()}' — ${f.carryOk(s.prot)}`);
      dtOk(m);
    } else {
      // Pase al pie: seguro, siempre progresa. En el Contragolpe letal (M2) TAMBIÉN gana
      // metros de verdad (adv.passBonus): con el rival partido, el pase al pie es progreso.
      s.bonus += (s.type.advFor === "contra" ? s.type.adv.passBonus[Math.min(s.actIdx, 1)] : 0.02) + tiredBonus;
      if (tiredBonus && rnd() < 0.3) traitMoment(m, legs.traitId, [legs.texto]);
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

  if (kind === "press") {
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

  if (kind === "duel") {
    // Pelotazo: choque = gana y remata ÉL de cabeza; peinar = prolonga a un lanzado (más
    // letal, más difícil de ganar). El Cabezazo por fin decide jugadas.
    const winner = s.prot;
    // El pivoteo es más difícil que el choque frontal (hay que aguantar de espaldas)
    // pero menos que la peinada al espacio: la pelota se baja, no se prolonga.
    const pv = key === "pivotear" ? hookOf(m, "pivot") : null;
    const risky = key === "peinar" || !!pv;   // las dos opciones de riesgo cobran el fallo
    const r = A.actAerial(m, s.prot, { handicap: key === "peinar" ? 0.08 : pv ? 0.05 : 0 });
    if (!r.ok) {
      // La fortaleza castiga (M2): el pelotazo del castigo que la zaga rival despeja
      // apurada, de espaldas a su arco, un % de las veces muere en CÓRNER ganado —
      // balón parado encadenado. La fortaleza casi siempre saca algo.
      if (s.cornerOnDuelFail && rnd() < s.cornerOnDuelFail) {
        if (risky) dtFail(m);
        noteCorner(m, "mine"); noteMomentum(m, "corner");   // córner ganado de verdad
        m.log("chance", `min ${m.clock()}' — ${sequenceType("fortaleza").flavor.cornerText}`);
        return chainSetPiece(m, 0.02);
      }
      // T1 — Segunda Jugada: el duelo perdido no siempre es pérdida — la segunda
      // pelota puede caer nuestra y el bloque vuelve a lanzar (secuencia reactiva).
      // T2 — Plataforma la sube de calidad: posición establecida, con su propia voz.
      const sj = rollChain(m, "chainOnDuelFail");
      if (sj) {
        if (risky) dtFail(m);
        m.log("chance", `min ${m.clock()}' — ${f.duelFail}`);
        const up = hookOf(m, "secondBallUpgrade");
        return chainMine(m, sj.to, { bonus: sj.bonus + (up?.bonus || 0), intro: up?.intro || sj.intro, buildDecision: buildActDecision }) ? false : closeSilent(m);
      }
      const out = closeSeq(m, "chance", `min ${m.clock()}' — ${f.duelFail}`);
      if (risky) dtFail(m);
      return out;
    }
    m.log("event", `min ${m.clock()}' — ${f.duelOk(winner)}`);
    if (pv) {
      // La bajada: la pelota cambia de pies hacia el MEJOR rematador de los que llegan
      // (mismo criterio que Superioridad Numérica) y el remate es de frente, no de cabeza.
      const mates = m.activeMine().filter(p => p !== s.prot && p.pos !== "POR");
      if (mates.length) {
        s.assistFrom = winner;
        s.prot = [...mates].sort((a, b) => (b.stats.tiro || 0) - (a.stats.tiro || 0))[0];
      }
      s.finishStat = "tiro";
      s.bonus += pv.bonus;
      traitMoment(m, pv.traitId, [pv.texto]);
      dtOk(m);
    } else if (key === "peinar") {
      const runners = m.activeMine().filter(p => p !== s.prot && p.pos !== "POR");
      if (runners.length) s.prot = m._weightedPick(runners, runners.map(p => playedPos(p) === "DEL" ? 3 : 1));
      s.assistFrom = winner; // la peinada es la asistencia si el lanzado convierte
      s.bonus += 0.10;
      dtOk(m);
    } else {
      s.finishStat = "cabezazo"; // ganó por arriba: define de cabeza
      s.bonus += 0.05;
    }
    return escalate(m);
  }

  if (kind === "wing") {
    // CORTAR HACIA ADENTRO: se salta el centro. El extremo se perfila (conducción: aura +
    // velocidad) y va derecho al desenlace con el pie cambiado. Es la opción del que sabe
    // rematar; si la pierde encarando hacia el medio, el equipo queda partido → contra.
    if (key === "adentro") {
      const r = A.actDribble(m, s.prot, { bonus: 0.04 });
      if (r.foul) { m.log("event", `min ${m.clock()}' — ¡Lo cruzan cuando entraba al área! ¡PENAL!`); closeSilent(m); return myPenalty(m); }
      if (!r.ok) return maybeCounter(m, `min ${m.clock()}' — ${s.prot.name} se cierra hacia adentro pero lo achican entre dos.`, true);
      m.log("plain", `min ${m.clock()}' — ${s.prot.name} se perfila hacia adentro y busca el remate.`);
      dtOk(m);
      s.finishStat = "tiro";
      s.bonus += 0.06;
      s.actIdx = planOf(s).length - 1;   // saltea el centro: la jugada ya no va por afuera
      noteFiloHit(m);
      buildActDecision(m);
      return false;
    }
    // CENTRAR DE PRIMERA: no arriesga el sprint, pero la zaga llega acomodada — el centro
    // sale peor. Es el trade honesto de la opción segura: llega siempre, vale menos.
    if (key === "primera") {
      s.crossBonus = -0.05;
      m.log("plain", `min ${m.clock()}' — ${s.prot.name} no espera el desborde: levanta la cabeza y prepara el envío.`);
      return escalate(m);
    }
    // LA LÍNEA DE FONDO: el sprint puro contra el lateral. Llegar al fondo deja a la zaga
    // rival de espaldas a su arco — el centro que sigue es el mejor del juego.
    const r = A.actSprint(m, s.prot, { chaser: s.chaser, handicap: 0.10 });
    if (!r.ok) return maybeCounter(m, `min ${m.clock()}' — ${f.wingFail}`, false);
    m.log("plain", `min ${m.clock()}' — ${f.wingOk(s.prot)}`);
    dtOk(m);
    s.crossBonus = 0.07;
    s.bonus += 0.04;              // la zaga de espaldas: el remate posterior llega mejor
    return escalate(m);
  }

  if (kind === "cross") {
    const rasante = key === "atras";
    const r = A.actCross(m, s.prot, { rasante, bonus: s.crossBonus || 0 });
    if (!r.ok) return closeSeq(m, "chance", `min ${m.clock()}' — ${f.crossFail}`);
    // El centro CAMBIA de protagonista: el que remata es el que atacó el área. El alto
    // busca al mejor cabezazo (y define de cabeza); el rasante, al mejor tiro de frente.
    // Quién ataca el área en juego abierto: delanteros y volantes. Los centrales suben
    // al córner, no al centro desde la banda — si se los deja entrar, el mejor cabezazo
    // del plantel (que casi siempre es un central) termina rematando todos los centros.
    const all = m.activeMine().filter(x => x !== s.prot && x.pos !== "POR");
    const mates = all.filter(x => playedPos(x) !== "DEF").length ? all.filter(x => playedPos(x) !== "DEF") : all;
    if (mates.length) {
      s.assistFrom = s.prot;
      s.prot = mates.sort((a, b) => (b.stats[rasante ? "tiro" : "cabezazo"] || 0) - (a.stats[rasante ? "tiro" : "cabezazo"] || 0))[0];
    }
    s.finishStat = rasante ? "tiro" : "cabezazo";
    s.bonus += rasante ? 0.05 : 0.02;   // el rasante llega de frente al arco: mejor perfil
    m.log("event", `min ${m.clock()}' — ${rasante
      ? `${s.assistFrom.name} la pisa y la devuelve atrás: ${s.prot.name} entra de frente.`
      : `${f.crossOk} La pelea ${s.prot.name}.`}`);
    return escalate(m);
  }

  if (kind === "finish") {
    // FRÍOS: se cambia MI ocasión por la del rival. La jugada muere sin peligro y el
    // generador le descuenta una llegada al rival (sequences.maybeStartSequence). Es
    // una decisión honesta: resignás atacar para proteger el resultado.
    if (key === "congelar") {
      const ice = hookOf(m, "iceGame");
      m._frozen = (m._frozen || 0) + 1;
      traitMoment(m, ice.traitId, [ice.texto]);
      return closeSeq(m, "info", `min ${m.clock()}' — ${s.prot.name} la devuelve al área propia. El equipo se queda con la pelota y el reloj corre.`);
    }
    // La sinfonía (M2): si TODOS los compases sonaron (desesperación llena), un % de las
    // veces el rival ya no llega con las piernas y te baja DENTRO del área — penal.
    // El penal profundo (y el 4º compás) eran el rasgo F2 de Consolidada — desde T2 los
    // compra Sitio al Área (migración al árbol). Si no hay penal, el remate llega limpio.
    if (s.type.advFor === "posesion" && (s.buildOks || 0) >= planOf(s).filter(k => k === "build").length
        && rnd() < (hasTrait(m, "desesperantes") ? s.type.adv.penaltyChanceDeep : s.type.adv.penaltyChance)) {
      m.log("event", `min ${m.clock()}' — ${f.penaltyText(s.prot)}`);
      closeSilent(m);
      return myPenalty(m);
    }
    // LA MÁQUINA COLECTIVA (Posesión, Master): tras una circulación LARGA en campo
    // rival —todos los compases sonaron, la misma condición de "desesperación llena"
    // que abre el penal de la sinfonía— la pelota puede quedar SERVIDA: al atacante
    // solo le queda empujarla. Acá el premio no es un penal: es el gol hecho.
    const tap = hookOf(m, "tapIn");
    if (tap && familyOf(s.type) === "circulacion"
        && (s.buildOks || 0) >= planOf(s).filter(k => k === "build").length && rnd() < tap.p) {
      s.bonus += tap.bonus;
      s.tapIn = true;
      traitMoment(m, tap.traitId, [tap.texto]);
    }
    // T1 — Pausa: en el desenlace de la circulación, la aceleración súbita — el
    // rival dormido por el tempo no llega al cierre (mejor perfil, relato propio).
    // Por FAMILIA: la sinfonía también acelera (hallazgo del gate T1).
    const acc = hookOf(m, "accelFinish", familyOf(s.type));
    if (acc && !s.oneOnOne && rnd() < acc.p) { s.bonus += acc.bonus; s.oneOnOne = true; m.log("event", `min ${m.clock()}' — ${acc.intro(s.prot)}`); }
    // T2 — Arco a la Vista: si la jugada nació en su variante profunda (la asfixia
    // sobre el saque de meta), el desenlace llega a quemarropa.
    const df = hookOf(m, "deepFinish", familyOf(s.type));
    if (df && s.deepVariant) { s.bonus += df.bonus; traitMoment(m, df.traitId, [df.texto]); }
    // T3 — A Campo Abierto: la avalancha llega al desenlace de toda la familia de la
    // contra — la defensa no sabe a quién marcar.
    const av = hookOf(m, "avalancha");
    if (av && familyOf(s.type) === "transicion") { s.bonus += av.bonus; if (rnd() < 0.5) traitMoment(m, av.traitId, [av.texto]); }
    // T3 — El Robo es el Pase (Master): el desenlace de la familia de la recuperación
    // define mejor — el robo YA es creación.
    const mp = hookOf(m, "masterPress");
    if (mp && familyOf(s.type) === "recuperacion") { s.bonus += mp.bonus; if (rnd() < 0.4) traitMoment(m, mp.traitId, [mp.texto]); }
    const stat = s.finishStat || f.finishStat;
    // PASE ATRÁS (Contra): el que llegó no remata — la pisa y la devuelve al que entra
    // de frente al arco. Es un pase de VERDAD (se puede perder, y perderla ahí abre
    // contra); a cambio, el remate que sigue llega servido y de frente.
    if (key === "pase_atras") {
      const sq = hookOf(m, "squarePass");
      const mates = m.activeMine().filter(p => p !== s.prot && p.pos !== "POR");
      const mate = mates.length ? [...mates].sort((a, b) => (b.stats.tiro || 0) - (a.stats.tiro || 0))[0] : s.prot;
      const pass = A.actPass(m, s.prot);
      if (!pass.ok) return maybeCounter(m, `min ${m.clock()}' — ${s.prot.name} la pisa y la devuelve atrás, pero la corta un rival que volvió.`, true);
      traitMoment(m, sq.traitId, [sq.texto]);
      const shot = A.actShot(m, mate, { stat: "tiro", bonus: s.bonus + f.finishBonus + sq.bonus });
      if (shot.ok) { goalMine(m, mate, "¡La empujó de frente tras el pase atrás!", s.prot); return closeSilent(m); }
      return maybeRebound(m, `min ${m.clock()}' — ${mate.name} entra de frente pero su remate se va.`);
    }
    if (key === "asistir") {
      const mates = m.activeMine().filter(p => p !== s.prot && p.pos !== "POR");
      // T2 — Superioridad Numérica: en la familia de la contra, el pase elige al MEJOR
      // ubicado DE VERDAD (el de mejor Tiro), no a un corredor cualquiera.
      const supUp = hookOf(m, "supportUpgrade");
      const numeric = supUp && familyOf(s.type) === "transicion" && mates.length > 0;
      // ODISEA (costura cerrada): EL DESMARQUE. Sin Superioridad Numérica, el que recibe
      // el pase de gol no es el mejor ubicado: es el que ARRANCÓ. La velocidad pondera el
      // sorteo (mismo cuadrático sobre 70 que protStatW: vel 95 ×1.8, vel 55 ×0.6) sin
      // volverlo determinista — el 9 lento sigue recibiendo, solo deja de recibir igual.
      const mate = !mates.length ? s.prot
        : numeric ? [...mates].sort((a, b) => (b.stats.tiro || 0) - (a.stats.tiro || 0))[0]
        : m._weightedPick(mates, mates.map(p => (playedPos(p) === "DEL" ? 3 : 1) * desmarqueW(p)));
      const pass = A.actPass(m, s.prot);
      if (!pass.ok) return maybeCounter(m, `min ${m.clock()}' — el pase de ${s.prot.name} no encuentra a nadie.`, true);
      // T1 — Correr en Manada: en la contra, el "buscar al mejor ubicado" encuentra
      // superioridad de verdad — la definición llega con dos camisetas libres.
      // Por FAMILIA: el contragolpe letal también corre en manada (gate T1).
      const sup = hookOf(m, "finishSupport", familyOf(s.type));
      const supBonus = (sup ? sup.bonus : 0) + (numeric ? supUp.bonus : 0);
      // La voz: Superioridad (si la hay) pisa a la de la Manada — un momento, no dos.
      if (numeric) traitMoment(m, supUp.traitId, [supUp.texto]);
      else if (sup) traitMoment(m, sup.traitId, [sup.texto]);
      const shot = A.actShot(m, mate, { stat: "tiro", bonus: s.bonus + f.finishBonus + 0.04 + supBonus });
      if (shot.ok) { goalMine(m, mate, "¡Definición tras la asistencia!", s.prot); return closeSilent(m); }
      return maybeRebound(m, `min ${m.clock()}' — ${mate.name} no logra conectar el remate.`);
    }
    const shot = A.actShot(m, s.prot, { stat, bonus: s.bonus + f.finishBonus });
    if (shot.ok) { goalMine(m, s.prot, s.tapIn ? "¡Solo tuvo que empujarla!" : stat === "cabezazo" ? "¡Cabezazo imparable!" : "¡Culminó la jugada!", s.assistFrom || "open"); return closeSilent(m); }
    // T3 — Cabeza de Playa: el pelotazo que muere sin gol puede fabricar córner —
    // "el equipo YA NO despeja: cada balón largo establece posición" (gate T3: la
    // versión solo-reactiva era invisible en juego real — cadenas demasiado raras).
    const bh = hookOf(m, "beachhead");
    if (bh && s.type.id === "pelotazo" && rnd() < bh.p) {
      m.log("chance", `min ${m.clock()}' — ${s.prot.name} remata pero la defensa rechaza apurada...`);
      traitMoment(m, bh.traitId, [bh.texto]);
      return chainSetPiece(m, 0.02);
    }
    return maybeRebound(m, `min ${m.clock()}' — ${s.prot.name} remata pero ${pick(["ataja el arquero", "se va desviado", "la saca la defensa"])}.`);
  }

  if (kind === "setpiece") {
    // Balón parado a favor: una decisión, desenlace inmediato (secuencia de un solo duelo).
    // T2 — Pelota Parada Ensayada: la pizarra entra en acción — ambas opciones llegan
    // mejor ensayadas (bonus de situación) y el momento se narra una vez por jugada.
    const sr = hookOf(m, "setpieceRehearsed");
    const srB = sr ? sr.bonus : 0;
    if (sr && !s.rehearsedTold) { s.rehearsedTold = true; traitMoment(m, sr.traitId, [sr.texto]); }
    if (key === "centro") {
      const t = s.target || s.prot;
      const shot = A.actShot(m, t, { stat: "cabezazo", bonus: 0.10 + srB });
      if (shot.ok) { goalMine(m, t, "¡Cabezazo letal en el balón parado!", s.prot); return closeSilent(m); }
      return maybeRebound(m, `min ${m.clock()}' — el centro busca a ${t.name} pero ${pick(["gana el arquero en el aire", "la despeja la zaga", "el cabezazo se va por arriba"])}.`);
    }
    const shot = A.actShot(m, s.prot, { stat: "tiro", bonus: 0.06 + srB });
    if (shot.ok) { goalMine(m, s.prot, "¡La jugada preparada termina en gol!", "open"); return closeSilent(m); }
    return maybeRebound(m, `min ${m.clock()}' — la jugada ensayada muere en ${pick(["un rebote", "el achique del arquero", "un despeje al córner"])}.`);
  }

  if (kind === "defend_sp") {
    // Córner en contra: zona = seguro; salir = puede matarla de una, o dejar solo al cabeceador.
    // T2 — Dueños del Área: el córner DEFENDIDO puede encadenar pelotazo propio
    // (comer centros → lanzar: la cadena completa de la firma del Bloque).
    // T3 — Contragolpe Total (Master): la contra también nace del córner rival —
    // el momento más improbable del catálogo, comprado con toda la doctrina.
    const { mine } = m.powers();
    // Dos filosofías encadenan desde acá hacia jugadas distintas (Atentos lanza el
    // pelotazo del Bloque · Defensa Intencionada lanza la contra): rollChain las tira
    // a las dos, así tener las dos da las dos chances.
    const chainDS = () => {
      const ds = rollChain(m, "chainOnDefendSp");
      return ds ? chainMine(m, ds.to, { bonus: ds.bonus, intro: ds.intro, buildDecision: buildActDecision }) : false;
    };
    if (key === "salir") {
      const r = A.actContain(m, mine, { press: true, bonus: 0.06 });
      if (r.ok) {
        m.log("event", `min ${m.clock()}' — 🥊 ¡La zaga sale con todo y despeja el córner de una!`);
        dtOk(m);
        if (chainDS()) return false;
        return closeSilent(m);
      }
      dtFail(m);
      const shot = A.actOppShot(m, s.shooter, mine, { stat: "cabezazo", bonus: 0.08 + oppShotBlockMalus(m, { aerial: true }) });
      if (shot.ok) { goalOpp(m, s.shooter); return closeSilent(m); }
      return closeSeq(m, "chance", `min ${m.clock()}' — ¡${s.shooter.name} cabecea SOLO pero ${mine.por ? mine.por.name : "el arquero"} la saca de milagro!`);
    }
    const shot = A.actOppShot(m, s.shooter, mine, { stat: "cabezazo", bonus: -0.05 + oppShotBlockMalus(m, { aerial: true }) }); // área poblada
    if (shot.ok) { goalOpp(m, s.shooter); return closeSilent(m); }
    m.log("chance", `min ${m.clock()}' — la zona aguanta: el cabezazo de ${s.shooter.name} ${pick(["se va desviado", "muere en las manos del arquero", "lo saca la defensa"])}.`);
    noteOppDead(m);
    if (chainDS()) return false;
    return closeSilent(m);
  }

  if (kind === "playout") {
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
      const { mine } = m.powers();
      const shot = A.actOppShot(m, s.shooter, mine, { bonus: 0.12 + oppShotBlockMalus(m) });
      if (shot.ok) { goalOpp(m, s.shooter); return closeSilent(m); }
      return closeSeq(m, "chance", `min ${m.clock()}' — ${s.shooter.name} remata el regalo pero ${mine.por ? mine.por.name : "el arquero"} responde. Se salvaron.`);
    }
    m.log("event", `min ${m.clock()}' — ${f.playoutOk(s.prot)}`);
    dtOk(m);
    const t = sequenceType("transicion");
    const cands = m.activeMine().filter(p => p.pos !== "POR");
    const prot = m._weightedPick(cands, cands.map(p => (t.protWeight[playedPos(p)] ?? 1) * protMomentum(p)));
    // misma secuencia, ahora es MI contra; el que rompió la presión asiste si esto
    // termina en gol. (El bonus del rasgo F2 del Contra se fusionó en SU avanzada — M2.)
    m.seq = { type: t, prot, actIdx: 0, bonus: 0.04, assistFrom: s.prot };
    buildActDecision(m);
    return false;
  }

  if (kind === "contain") {
    // PELOTAZO (Bloque): REVENTAR EL BALÓN. La jugada rival muere sin remate — el precio
    // es doble: se resigna todo lo que la contención podía dar (la fortaleza que convierte,
    // la contra que encadena) y `p` de las veces el despeje apurado sale al córner.
    if (key === "reventar") {
      const cb = hookOf(m, "clearBall");
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
    const r = A.actContain(m, mine, { press: key === "presionar", chase,
      bonus: (est ? est.bonus : 0) + (fortaleza && hasTrait(m, "area_blindada") ? s.type.adv.deepContain : 0) });
    if (est && r.ok && rnd() < 0.2) traitMoment(m, est.traitId, [est.texto]);
    if (r.ok) {
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

  // clear: el rival remata, mi arquero responde (desenlace defensivo automático)
  const { mine } = m.powers();
  // T1 — Jaula Central: el remate del repliegue llega INCÓMODO (la jaula lo empujó
  // a la banda: la situación es peor, no mi arquero mejor — el canal finishBonus).
  // Por FAMILIA: la fortaleza también encierra (gate T1).
  const jl = hookOf(m, "oppShotMalus", familyOf(s.type));
  const malus = jl ? jl.bonus : 0;
  // BLOQUE BAJO: todo lo que el árbol le hace a este remate — la frustración acumulada,
  // la muralla mientras el marcador aguanta, el área blindada y la primera ocasión del
  // partido contra la defensa escalonada (ver oppShotBlockMalus).
  const r = A.actOppShot(m, s.shooter, mine, { bonus: s.bonus + malus + oppShotBlockMalus(m) });
  if (r.ok) { goalOpp(m, s.shooter); return closeSilent(m); }
  const out = closeSeq(m, "chance", `min ${m.clock()}' — ${s.shooter.name} remata pero ${pick([`ataja ${mine.por ? mine.por.name : "el arquero"}`, "se va afuera", "la bloquea la zaga"])}.`);
  if (malus && rnd() < 0.4) traitMoment(m, jl.traitId, [jl.texto]); // el momento se narra a veces (sin spamear)
  else noteOppDead(m);
  return out;
}

// Actos que se resuelven SOLOS, sin pedir decisión al DT (desenlaces): el remate rival de una
// secuencia de repliegue. El resto son interactivos (crean una decisión `sequence`).
const AUTO_ACTS = new Set(["clear"]);

/** T3 — La Fortaleza: malus de frustración al remate rival = f(ataques rivales
 *  MUERTOS en la muralla, con tope). Contador propio (m._frustDead) a propósito:
 *  el diseño pide ataques FRUSTRADOS, no tiros — un avance cortado sin remate
 *  también come moral (stats.oppTiros ya cuenta bien desde el fix del bug T3). */
function frustMalus(m) {
  const fr = hookOf(m, "frustration");
  return fr ? -Math.min(fr.cap, fr.perShot * (m._frustDead || 0)) : 0;
}

/** El ataque rival MURIÓ en la muralla: alimenta la frustración y a veces la narra
 *  (gate T3: narrarla solo en el acto clear era invisible — la propia fortaleza
 *  convierte la mayoría de las contenciones y el clear casi no ocurre). */
function noteOppDead(m) {
  m._frustDead = (m._frustDead || 0) + 1;
  const fr = hookOf(m, "frustration");
  if (fr && frustMalus(m) <= -0.05 && rnd() < 0.25) traitMoment(m, fr.traitId, [fr.texto]);
}

/* ---------- LO QUE EL BLOQUE LE HACE AL REMATE RIVAL (rediseño 30-jul-2026) ----------
   Cuatro nodos del árbol nuevo empeoran la SITUACIÓN del remate rival (jamás mejoran a
   mis jugadores: la ley del arco). Se suman por el mismo canal —el bonus de actOppShot—
   y se piden juntos en los tres sitios donde el rival remata contra mi bloque: el
   desenlace del repliegue (clear), el córner en contra (defend_sp) y el regalo de la
   salida asfixiada. `aerial` suma el dominio aéreo solo donde se cabecea. */
function oppShotBlockMalus(m, { aerial = false } = {}) {
  return frustMalus(m) + wallMalus(m) + boxMalus(m) + firstChanceMalus(m) + (aerial ? aerialMalus(m) : 0);
}

/** MURALLA (avanzada, ESTADO): mientras el marcador no vaya en contra —empatado O
 *  ganando, decisión PO— la zaga no se mueve. Perdiendo no aporta nada: pura identidad. */
function wallMalus(m) {
  const w = hookOf(m, "wall");
  return w && m.gMy >= m.gOpp ? w.bonus : 0;
}

/** ÁREA BLINDADA (intermedia): el remate rival DENTRO del área sale a destiempo. */
const boxMalus = m => hookOf(m, "boxShield")?.bonus || 0;

/** DOMINIO AÉREO (básica): por arriba no se les gana — el cabezazo rival llega forzado. */
const aerialMalus = m => hookOf(m, "aerialDef")?.bonus || 0;

/**
 * DEFENSA ESCALONADA (avanzada): la PRIMERA ocasión rival del partido —la que llega con
 * el equipo todavía leyendo al rival— se encuentra con la segunda línea ya puesta. Se
 * consume una sola vez por partido: la función es IMPURA a propósito (marca y narra el
 * momento al gastarlo), como el contador de frustración que vive al lado.
 */
function firstChanceMalus(m) {
  const h = hookOf(m, "firstChanceGuard");
  if (!h || m._escalonadaUsada) return 0;
  m._escalonadaUsada = true;
  traitMoment(m, h.traitId, [h.texto]);
  return h.bonus;
}

/**
 * FORTALEZA INEXPUGNABLE (Master): ¿esta OCASIÓN CLARA rival directamente no ocurre? Los
 * dos canales por los que el rival llega solo frente al arco —el mano a mano tras la
 * contención rota y la contra tras mi pérdida— pueden morir contra el que llegó a cubrir.
 */
function clearChanceGuarded(m) {
  const cg = hookOf(m, "clearChanceGuard");
  if (!cg || rnd() >= cg.p) return false;
  traitMoment(m, cg.traitId, [cg.texto]);
  return true;
}

/**
 * El CÓRNER que se regala al reventar el balón: la misma jugada sigue como balón parado
 * EN CONTRA (espejo de chainSetPiece, del otro lado). El cabeceador rival es su mejor
 * cabezazo en cancha, igual que cuando el córner nace del generador.
 */
function chainOppCorner(m) {
  const t = sequenceType("balon_parado_def");
  const alive = m.oppLineup.filter(p => !p.expulsado && p.pos !== "POR");
  const shooter = alive.sort((a, b) => (b.stats.cabezazo || 0) - (a.stats.cabezazo || 0))[0] || pick(m.oppLineup);
  noteCorner(m, "opp"); noteMomentum(m, "corner", "opp");
  m.seq = { type: t, shooter, actIdx: 0, bonus: 0 };
  m.log("event", `${t.icon} min ${m.clock()}' — ${t.flavor.intro(m.oppTeam)}`);
  buildActDecision(m);
  return false;
}

/**
 * Pasa al acto siguiente. Si el plan se acabó, cierra. Si el próximo acto es interactivo,
 * crea su decisión. Si es un desenlace automático (AUTO_ACTS), lo resuelve en el acto —
 * sin pedirle nada al DT (p. ej. el remate rival tras una contención fallida).
 */
function escalate(m) {
  const s = m.seq;
  // Escalar ES acertar el acto (los fallos cierran o encadenan, nunca escalan… salvo la
  // contención rota, que escala al remate rival — pero el repliegue no es tipo firma de
  // nadie: las 4 firmas son del lado mine). Si la secuencia es de MI tipo firma, el
  // acierto alimenta la progresión por ejecución (F1).
  noteFiloHit(m);
  s.actIdx++;
  if (s.actIdx >= planOf(s).length) return closeSilent(m);
  if (AUTO_ACTS.has(planOf(s)[s.actIdx])) return resolveSequenceAct(m, null);
  buildActDecision(m);
  return false;
}

// ---------- El fallo que encadena (Sprint A2, regla 7 del Bible) ----------
// "Los errores deben generar nuevos problemas de fútbol en vez de terminar la jugada."
// BIDIRECCIONAL a propósito (decisión PO): el rebote me regala remates, la pérdida
// arriesgada le regala contras al rival — las dos direcciones se compensan en el balance.
const REBOUND_CHANCE = 0.30;  // mi remate fallado deja la pelota viva
const COUNTER_CHANCE = 0.28;  // mi pérdida ARRIESGADA (filtrado/conducción/presión rota) abre contra
// Absorción del último hombre (decisión PO #7): ya no asoma como evento suelto del tick —
// nace del FÚTBOL: una contención rota o una contra tras pérdida se vuelven el mano a mano.
const LASTMAN_FROM_CONTAIN = 0.70; // contención rota → último hombre
const LASTMAN_FROM_COUNTER = 1.0;  // TODA contra con el equipo partido es un mano a mano (si hay DEF en pie)

/**
 * Mi remate falló: a veces la pelota queda viva y alguien la caza en el área (un solo
 * rebote por secuencia — `s.rebounded` corta la cadena geométrica). El remate de rebote
 * es sucio: a quemarropa pero incómodo (bonus negativo), y sin asistidor.
 */
function maybeRebound(m, failText) {
  const s = m.seq;
  if (s.rebounded || rnd() >= REBOUND_CHANCE) return closeSeq(m, "chance", failText);
  s.rebounded = true;
  m.log("chance", failText);
  const pool = m.activeMine().filter(p => p.pos !== "POR");
  const p2 = m._weightedPick(pool, pool.map(p => playedPos(p) === "DEL" ? 3 : 1));
  const shot = A.actShot(m, p2, { bonus: -0.03 });
  if (shot.ok) { goalMine(m, p2, "¡REBOTE y gol! Cazó la pelota viva en el área."); return closeSilent(m); }
  return closeSeq(m, "chance", `min ${m.clock()}' — ¡el rebote le queda a ${p2.name}! pero su remate ${pick(["lo tapa el arquero", "se va por arriba", "muere en la zaga"])}.`);
}

/**
 * Pérdida ARRIESGADA mía (pase filtrado interceptado, conducción perdida, presión rota):
 * a veces el rival sale de contra con el equipo partido. Elegir la opción de riesgo tiene
 * que poder DOLER — es la mordida que le faltaba al riesgo/recompensa de los actos.
 */
function maybeCounter(m, failText, risky = false) {
  if (rnd() >= COUNTER_CHANCE) {
    const out = closeSeq(m, "chance", failText);
    if (risky) dtFail(m);
    // T1 — Morder Tras Pérdida: si la pérdida NO abrió contra rival, la jauría puede
    // cazarla de vuelta — recuperación REACTIVA en campo rival. El orden importa: el
    // riesgo del contragolpe rival queda EXACTO (0.28, calibración A2); la mordida
    // vive en el 72% restante, donde antes la jugada simplemente moría.
    // T3 — El Robo es el Pase afila la mordida (chainPlus sobre la p de Morder).
    const md = rollChain(m, "chainOnMineFail", hookOf(m, "masterPress")?.chainPlus || 0);
    if (md && chainMine(m, md.to, { bonus: md.bonus, intro: md.intro, buildDecision: buildActDecision })) return false;
    return out;
  }
  m.log("chance", failText);
  if (risky) dtFail(m);
  noteMomentum(m, "contraataque", "opp");
  m.log("event", `min ${m.clock()}' — ¡${m.oppTeam.name} sale de CONTRA con el equipo partido!`);
  // LA FRONTERA (Posesión): la línea alta sube junta y la transición muere en offside.
  // Es el espejo exacto de su otro hook, breakawayGuard, que ya mata el pelotazo
  // AMBIENTE a la espalda: el mismo rasgo cubre los DOS canales por los que llega ese
  // fútbol —el balón largo suelto y la contra tras mi pérdida—, que es justo lo que
  // significa sostener una línea adelantada.
  const ot = hookOf(m, "offsideTrap");
  if (ot && rnd() < ot.p) { traitMoment(m, ot.traitId, [ot.texto]); return closeSilent(m); }
  // FORTALEZA INEXPUGNABLE (Bloque): el otro canal de la ocasión clara — la contra que
  // nace de mi pérdida. El espejo defensivo de lo que la trampa del offside hace en
  // Posesión: la jugada más peligrosa del rival muere antes de existir.
  if (clearChanceGuarded(m)) return closeSilent(m);
  // La mitad de las contras terminan en el mano a mano del último hombre (absorción A2,
  // calibración del Sprint 1 intacta); la otra mitad, en remate directo del que se escapó.
  if (rnd() < LASTMAN_FROM_COUNTER && lastManChance(m)) { closeSilent(m); return true; }
  const { mine } = m.powers();
  const alive = m.oppLineup.filter(p => !p.expulsado);
  const fast = alive.filter(p => p.pos === "DEL" || p.pos === "MED");
  const sh = fast.length ? pick(fast) : pick(alive);
  // Rama de EMERGENCIA: con LASTMAN_FROM_COUNTER = 1.0 acá solo se llega sin un defensor
  // en pie (todos expulsados o lesionados). La persecución con velocidad vive donde la
  // contra realmente se juega — `chances.resolveLastMan`, opción "esperar".
  const shot = A.actOppShot(m, sh, mine, { bonus: 0.10 });
  if (shot.ok) { goalOpp(m, sh); return closeSilent(m); }
  return closeSeq(m, "chance", `min ${m.clock()}' — ${sh.name} remata la contra pero ${mine.por ? mine.por.name : "el arquero"} responde enorme.`);
}

// ---------- Desenlaces nuevos de las AVANZADAS (M2) ----------

/**
 * El balón parado ENCADENADO: la misma jugada sigue como balón parado mío (el patrón de
 * conversión de la salida bajo presión). El lanzador sale por el protWeight del tipo,
 * como en un balón parado que nace solo.
 */
function chainSetPiece(m, bonus = 0) {
  const t = sequenceType("balon_parado");
  const cands = m.activeMine().filter(p => p.pos !== "POR");
  const prot = m._weightedPick(cands, cands.map(p => (t.protWeight[playedPos(p)] ?? 1) * protMomentum(p)));
  m.seq = { type: t, prot, actIdx: 0, bonus };
  buildActDecision(m);
  return false;
}

/**
 * El rival corta tu fútbol superior CON FALTA (Cacería total / Contragolpe letal): 🟨
 * amarilla al infractor — que ACUMULA: la segunda lo expulsa, y teamPowers ya castiga la
 * inferioridad rival — y tiro libre encadenado. El infractor es un rival de campo al azar
 * (el que llegó tarde). Sin stats de tarjetas mías: es SU falta.
 */
function advFoulSetPiece(m, foulText, bonus = 0) {
  const alive = m.oppLineup.filter(p => !p.expulsado && p.pos !== "POR");
  if (alive.length) {
    const p = pick(alive);
    p.amarillaPartido = (p.amarillaPartido || 0) + 1;
    m.log("card", `min ${m.clock()}' — 🟨 ${foulText(p)}`);
    if (p.amarillaPartido >= 2) {
      p.expulsado = true;
      m.log("card", `min ${m.clock()}' — 🟥 ¡Segunda amarilla y EXPULSIÓN de ${p.name}! ${m.oppTeam.name} queda con uno menos.`);
    }
  }
  return chainSetPiece(m, bonus);
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
