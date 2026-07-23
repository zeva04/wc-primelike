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
import { hookOf, rollChain, chainMine, traitMoment, hasTrait } from "./trait-hooks.js"; // el árbol de rasgos (T1/T2)

// El plan de actos de la secuencia: el propio si lo tiene (rasgo de Posesión:
// un acto más de circulación, lo arma startSequence) o el del catálogo.
const planOf = s => s.plan || s.type.plan;
import * as A from "./actions.js";
import { goalMine, goalOpp, myPenalty, lastManChance } from "./chances.js";

/** Crea la decisión del acto actual según su `kind`. Las opciones son reglas (mapean a
 *  Football Actions); el flavor viene del tipo. */
export function buildActDecision(m) {
  const s = m.seq, kind = planOf(s)[s.actIdx];
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
    press: () => ({
      // El 2º acto de la Cacería total (M2) es la TRAMPA sobre el reseteo rival — mismo
      // gesto (Football Action de presión), otro momento del fútbol.
      title: s.type.id === "caceria" && s.actIdx === 1
        ? `🦁 min ${m.min}' — ¡El rival intenta resetear y la trampa se cierra! ${s.prot.name} otra vez encima`
        : `🦁 min ${m.min}' — ¡Presión alta! ${s.prot.name} achica sobre la salida rival`,
      text: "¿Cómo cazan la pelota?",
      options: [
        { label: "🔥 Presión total", hint: "Robo en zona letal (remate top)… pero si la rompen, duele", key: "total" },
        { label: "🕸️ Cerrar líneas de pase", hint: "Roba más seguido, en posición más discreta", key: "lineas" },
      ],
    }),
    duel: () => ({
      title: `🌩️ min ${m.min}' — Pelotazo a ${s.prot.name}: se viene el duelo aéreo`,
      text: "¿Cómo lo juega?",
      options: [
        { label: "🤜 Ir al choque", hint: `Cabezazo ${s.prot.stats.cabezazo} — ganarla es rematar de cabeza`, key: "choque" },
        { label: "🪶 Peinarla al espacio", hint: "Prolonga para un compañero lanzado: más letal, más difícil", key: "peinar" },
      ],
    }),
    setpiece: () => {
      const mates = m.activeMine().filter(p => p !== s.prot && p.pos !== "POR");
      s.target = mates.sort((a, b) => (b.stats.cabezazo || 0) - (a.stats.cabezazo || 0))[0] || s.prot;
      return {
        title: `🎯 min ${m.min}' — Balón parado: lo para ${s.prot.name}`,
        text: "¿Qué ensayaron en la semana?",
        options: [
          { label: `📡 Centro al área para ${s.target.name}`, hint: `Cabezazo ${s.target.stats.cabezazo}`, key: "centro" },
          { label: "🎭 Jugada preparada", hint: `Descarga corta y remate (Tiro ${s.prot.stats.tiro})`, key: "jugada" },
        ],
      };
    },
    defend_sp: () => ({
      title: `🚨 min ${m.min}' — Córner de ${m.oppTeam.name}: ${s.shooter.name} manda en el área`,
      text: "¿Cómo lo defiende la zaga?",
      options: [
        { label: "🧲 Defensa en zona", hint: "Seguro: cada uno cuida su espacio", key: "zonal" },
        { label: "🥊 Salir a despejar", hint: "Puede matar la jugada de una… pero si falla, el cabeceador queda solo", key: "salir" },
      ],
    }),
    playout: () => ({
      title: `🗼 min ${m.min}' — ${m.oppTeam.name} asfixia la salida: la tiene ${s.prot.name}`,
      text: "¿Cómo salen del fondo?",
      options: [
        { label: "💎 Salir jugando", hint: `Pase ${s.prot.stats.pase} — romper la presión regala una contra tuya`, key: "jugar" },
        { label: "🚀 Reventarla", hint: "Seguro: se pierde la pelota, no se arriesga nada", key: "despeje" },
      ],
    }),
  }[kind]();
  m.decision = { id: "sequence", ...opts };
}

// Feedback del DT (PO 22-jul): solo las decisiones con RIESGO real generan comentario —
// el relato celebra el acierto de la arriesgada y cobra su fallo. La opción segura no
// opina: no hay mérito en lo seguro.
const dtOk = m => m.log("info", `min ${m.min}' — 🎯 ${pick(["La decisión del DT fue la correcta.", "La apuesta del banco sale perfecta.", "El riesgo del DT paga."])}`);
const dtFail = m => m.log("info", `min ${m.min}' — 💢 ${pick(["La apuesta del DT salió cara.", "El riesgo no pagó esta vez.", "Decisión valiente, castigo inmediato."])}`);

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
        const h = hookOf(m, "recycleBuild");
        if (h && !s.recycled && rnd() < h.p) {
          s.recycled = true;
          traitMoment(m, h.traitId, [h.texto]);
          passTo(m, s);
          buildActDecision(m);
          return false;
        }
        return maybeCounter(m, `min ${m.min}' — ${f.buildFail}`, true);
      }
      s.bonus += 0.07;
    }
    s.buildOks = (s.buildOks || 0) + 1; // la sinfonía (M2) cuenta la desesperación rival
    const recibe = passTo(m, s); // seguro o filtrado: el pase cambia la pelota de pies
    m.log("plain", `min ${m.min}' — ${f.buildOk}${recibe ? ` La recibe ${s.prot.name}.` : ""}`);
    if (key === "filtrado") dtOk(m);
    return escalate(m);
  }

  if (kind === "carry") {
    if (key === "conducir") {
      const r = A.actDribble(m, s.prot, { bonus: s.type.advFor === "contra" && s.actIdx === 1 ? s.type.adv.carryEase : 0 });
      if (r.foul) {
        // GEOGRAFÍA de la falta en el Contragolpe letal (M2): en el primer tramo (lejos
        // del área) es la falta desesperada — amarilla + tiro libre encadenado; en el
        // segundo (zona letal) es PENAL, como la conducción de siempre.
        if (s.type.advFor === "contra" && s.actIdx === 0) return advFoulSetPiece(m, f.foulText, s.type.adv.freekickBonus);
        m.log("event", `min ${m.min}' — ¡Derriban a ${s.prot.name}! ¡PENAL!`); closeSilent(m); return myPenalty(m);
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
              m.log("card", `min ${m.min}' — 🟥 ${f.redText(rival)}`);
              return chainSetPiece(m, s.type.adv.despFreekickBonus);
            }
            if (rival) {
              rival.amarillaPartido = (rival.amarillaPartido || 0) + 1;
              m.log("card", `min ${m.min}' — 🟨 ${f.penalFoulText(rival)}`);
              if (rival.amarillaPartido >= 2) { rival.expulsado = true; m.log("card", `min ${m.min}' — 🟥 ¡Era su segunda amarilla! EXPULSADO.`); }
            }
            closeSilent(m);
            return myPenalty(m);
          }
          m.log("chance", `min ${m.min}' — ${f.carryFail}`); dtFail(m); return closeSilent(m);
        }
        return maybeCounter(m, `min ${m.min}' — ${f.carryFail}`, true);
      }
      // El Contragolpe letal paga por tramo (adv.carryBonus: el rival partido vale más
      // que la transición simple); el 1er tramo profundo era el rasgo F2 de Consolidada —
      // desde T2 lo compra La Trampa Cerrada (migración al árbol).
      s.bonus += (s.type.advFor === "contra" ? s.type.adv.carryBonus[Math.min(s.actIdx, 1)] : 0.05)
        + (s.type.advFor === "contra" && s.actIdx === 0 && hasTrait(m, "trampa_cerrada") ? s.type.adv.deepBonus : 0);
      m.log("plain", `min ${m.min}' — ${f.carryOk(s.prot)}`);
      dtOk(m);
    } else {
      // Pase al pie: seguro, siempre progresa. En el Contragolpe letal (M2) TAMBIÉN gana
      // metros de verdad (adv.passBonus): con el rival partido, el pase al pie es progreso.
      s.bonus += s.type.advFor === "contra" ? s.type.adv.passBonus[Math.min(s.actIdx, 1)] : 0.02;
      const pasador = s.prot;
      m.log("plain", passTo(m, s) // el pase al pie también se desprende de la pelota
        ? `min ${m.min}' — ${pasador.name} la juega al pie y ${s.prot.name} toma la posta.`
        : `min ${m.min}' — ${f.carryOk(s.prot)}`);
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
      if (caza && rnd() < (hasTrait(m, "caceria_letal") ? s.type.adv.foulBreakDeep : s.type.adv.foulBreak)) return advFoulSetPiece(m, f.foulText, s.type.adv.freekickBonus);
      return maybeCounter(m, `min ${m.min}' — ${f.pressFail}`, total);
    }
    // El 2º robo de la cacería es en ZONA LETAL (+trapBonus); el deepBonus era el rasgo
    // F2 de Consolidada — desde T2 lo compra Cacería Letal (migración al árbol).
    s.bonus += (total ? 0.15 : 0.05) + (caza && s.actIdx === 1 ? s.type.adv.trapBonus + (hasTrait(m, "caceria_letal") ? s.type.adv.deepBonus : 0) : 0);
    m.log("event", `min ${m.min}' — ${caza && s.actIdx === 1 ? f.press2Ok : f.pressOk}`);
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
    const r = A.actAerial(m, s.prot, { handicap: key === "peinar" ? 0.08 : 0 });
    if (!r.ok) {
      // La fortaleza castiga (M2): el pelotazo del castigo que la zaga rival despeja
      // apurada, de espaldas a su arco, un % de las veces muere en CÓRNER ganado —
      // balón parado encadenado. La fortaleza casi siempre saca algo.
      if (s.cornerOnDuelFail && rnd() < s.cornerOnDuelFail) {
        if (key === "peinar") dtFail(m);
        m.log("chance", `min ${m.min}' — ${sequenceType("fortaleza").flavor.cornerText}`);
        return chainSetPiece(m, 0.02);
      }
      // T1 — Segunda Jugada: el duelo perdido no siempre es pérdida — la segunda
      // pelota puede caer nuestra y el bloque vuelve a lanzar (secuencia reactiva).
      // T2 — Plataforma la sube de calidad: posición establecida, con su propia voz.
      const sj = rollChain(m, "chainOnDuelFail");
      if (sj) {
        if (key === "peinar") dtFail(m);
        m.log("chance", `min ${m.min}' — ${f.duelFail}`);
        const up = hookOf(m, "secondBallUpgrade");
        return chainMine(m, sj.to, { bonus: sj.bonus + (up?.bonus || 0), intro: up?.intro || sj.intro, buildDecision: buildActDecision }) ? false : closeSilent(m);
      }
      const out = closeSeq(m, "chance", `min ${m.min}' — ${f.duelFail}`);
      if (key === "peinar") dtFail(m);
      return out;
    }
    m.log("event", `min ${m.min}' — ${f.duelOk(winner)}`);
    if (key === "peinar") {
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

  if (kind === "finish") {
    // La sinfonía (M2): si TODOS los compases sonaron (desesperación llena), un % de las
    // veces el rival ya no llega con las piernas y te baja DENTRO del área — penal.
    // El penal profundo (y el 4º compás) eran el rasgo F2 de Consolidada — desde T2 los
    // compra Sitio al Área (migración al árbol). Si no hay penal, el remate llega limpio.
    if (s.type.advFor === "posesion" && (s.buildOks || 0) >= planOf(s).filter(k => k === "build").length
        && rnd() < (hasTrait(m, "sitio_area") ? s.type.adv.penaltyChanceDeep : s.type.adv.penaltyChance)) {
      m.log("event", `min ${m.min}' — ${f.penaltyText(s.prot)}`);
      closeSilent(m);
      return myPenalty(m);
    }
    // T1 — Pausa: en el desenlace de la circulación, la aceleración súbita — el
    // rival dormido por el tempo no llega al cierre (mejor perfil, relato propio).
    // Por FAMILIA: la sinfonía también acelera (hallazgo del gate T1).
    const acc = hookOf(m, "accelFinish");
    if (acc && familyOf(s.type) === acc.of && rnd() < acc.p) { s.bonus += acc.bonus; m.log("event", `min ${m.min}' — ${acc.intro(s.prot)}`); }
    // T2 — Arco a la Vista: si la jugada nació en su variante profunda (la asfixia
    // sobre el saque de meta), el desenlace llega a quemarropa.
    const df = hookOf(m, "deepFinish");
    if (df && s.deepVariant && familyOf(s.type) === df.of) { s.bonus += df.bonus; traitMoment(m, df.traitId, [df.texto]); }
    const stat = s.finishStat || f.finishStat;
    if (key === "asistir") {
      const mates = m.activeMine().filter(p => p !== s.prot && p.pos !== "POR");
      // T2 — Superioridad Numérica: en la familia de la contra, el pase elige al MEJOR
      // ubicado DE VERDAD (el de mejor Tiro), no a un corredor cualquiera.
      const supUp = hookOf(m, "supportUpgrade");
      const numeric = supUp && familyOf(s.type) === "transicion" && mates.length > 0;
      const mate = !mates.length ? s.prot
        : numeric ? [...mates].sort((a, b) => (b.stats.tiro || 0) - (a.stats.tiro || 0))[0]
        : m._weightedPick(mates, mates.map(p => playedPos(p) === "DEL" ? 3 : 1));
      const pass = A.actPass(m, s.prot);
      if (!pass.ok) return maybeCounter(m, `min ${m.min}' — el pase de ${s.prot.name} no encuentra a nadie.`, true);
      // T1 — Correr en Manada: en la contra, el "buscar al mejor ubicado" encuentra
      // superioridad de verdad — la definición llega con dos camisetas libres.
      // Por FAMILIA: el contragolpe letal también corre en manada (gate T1).
      const sup = hookOf(m, "finishSupport");
      const supBonus = (sup && familyOf(s.type) === sup.of ? sup.bonus : 0) + (numeric ? supUp.bonus : 0);
      // La voz: Superioridad (si la hay) pisa a la de la Manada — un momento, no dos.
      if (numeric) traitMoment(m, supUp.traitId, [supUp.texto]);
      else if (sup && familyOf(s.type) === sup.of) traitMoment(m, sup.traitId, [sup.texto]);
      const shot = A.actShot(m, mate, { stat: "tiro", bonus: s.bonus + f.finishBonus + 0.04 + supBonus });
      if (shot.ok) { goalMine(m, mate, "¡Definición tras la asistencia!", s.prot); return closeSilent(m); }
      return maybeRebound(m, `min ${m.min}' — ${mate.name} no logra conectar el remate.`);
    }
    const shot = A.actShot(m, s.prot, { stat, bonus: s.bonus + f.finishBonus });
    if (shot.ok) { goalMine(m, s.prot, stat === "cabezazo" ? "¡Cabezazo imparable!" : "¡Culminó la jugada!", s.assistFrom || "open"); return closeSilent(m); }
    return maybeRebound(m, `min ${m.min}' — ${s.prot.name} remata pero ${pick(["ataja el arquero", "se va desviado", "la saca la defensa"])}.`);
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
      return maybeRebound(m, `min ${m.min}' — el centro busca a ${t.name} pero ${pick(["gana el arquero en el aire", "la despeja la zaga", "el cabezazo se va por arriba"])}.`);
    }
    const shot = A.actShot(m, s.prot, { stat: "tiro", bonus: 0.06 + srB });
    if (shot.ok) { goalMine(m, s.prot, "¡La jugada preparada termina en gol!", "open"); return closeSilent(m); }
    return maybeRebound(m, `min ${m.min}' — la jugada ensayada muere en ${pick(["un rebote", "el achique del arquero", "un despeje al córner"])}.`);
  }

  if (kind === "defend_sp") {
    // Córner en contra: zona = seguro; salir = puede matarla de una, o dejar solo al cabeceador.
    // T2 — Dueños del Área: el córner DEFENDIDO puede encadenar pelotazo propio
    // (comer centros → lanzar: la cadena completa de la firma del Bloque).
    const { mine } = m.powers();
    const chainDS = () => {
      const ds = rollChain(m, "chainOnDefendSp");
      return ds ? chainMine(m, ds.to, { bonus: ds.bonus, intro: ds.intro, buildDecision: buildActDecision }) : false;
    };
    if (key === "salir") {
      const r = A.actContain(m, mine, { press: true, bonus: 0.06 });
      if (r.ok) {
        m.log("event", `min ${m.min}' — 🥊 ¡La zaga sale con todo y despeja el córner de una!`);
        dtOk(m);
        if (chainDS()) return false;
        return closeSilent(m);
      }
      dtFail(m);
      const shot = A.actOppShot(m, s.shooter, mine, { stat: "cabezazo", bonus: 0.08 });
      if (shot.ok) { goalOpp(m, s.shooter); return closeSilent(m); }
      return closeSeq(m, "chance", `min ${m.min}' — ¡${s.shooter.name} cabecea SOLO pero ${mine.por ? mine.por.name : "el arquero"} la saca de milagro!`);
    }
    const shot = A.actOppShot(m, s.shooter, mine, { stat: "cabezazo", bonus: -0.05 }); // área poblada
    if (shot.ok) { goalOpp(m, s.shooter); return closeSilent(m); }
    m.log("chance", `min ${m.min}' — la zona aguanta: el cabezazo de ${s.shooter.name} ${pick(["se va desviado", "muere en las manos del arquero", "lo saca la defensa"])}.`);
    if (chainDS()) return false;
    return closeSilent(m);
  }

  if (kind === "playout") {
    // Salida bajo presión (def→of): reventarla es gratis; salir jugando arriesga un regalo
    // letal… o CONVIERTE la secuencia en una transición mía (la misma jugada sigue).
    if (key === "despeje") return closeSeq(m, "plain", `min ${m.min}' — ${f.playoutSafe}`);
    const r = A.actPass(m, s.prot, { hard: true });
    if (!r.ok) {
      // T2 — El Tercer Hombre: la salida rota puede RESCATARSE — el desmarcado aparece
      // a tiempo y el regalo letal no existe (la posesión se pierde sin sangre). La
      // vacuna comprable contra el festín del Press rival.
      const th = hookOf(m, "playoutRescue");
      if (th && rnd() < th.p) return closeSeq(m, "plain", `min ${m.min}' — ${th.texto}`);
      m.log("chance", `min ${m.min}' — ${f.playoutFail(s.prot)}`);
      dtFail(m);
      const { mine } = m.powers();
      const shot = A.actOppShot(m, s.shooter, mine, { bonus: 0.12 });
      if (shot.ok) { goalOpp(m, s.shooter); return closeSilent(m); }
      return closeSeq(m, "chance", `min ${m.min}' — ${s.shooter.name} remata el regalo pero ${mine.por ? mine.por.name : "el arquero"} responde. Se salvaron.`);
    }
    m.log("event", `min ${m.min}' — ${f.playoutOk(s.prot)}`);
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
    const { mine } = m.powers();
    const fortaleza = s.type.advFor === "bloque"; // la avanzada del Bloque (M2)
    // La contención profunda de la fortaleza era el rasgo F2 de Consolidada — desde T2
    // la compra Dueños del Área (migración al árbol); el repliegue base sigue original.
    const r = A.actContain(m, mine, { press: key === "presionar", bonus: fortaleza && hasTrait(m, "duenos_area") ? s.type.adv.deepContain : 0 });
    if (r.ok) {
      // La fortaleza CASTIGA (M2): la contención exitosa convierte — pelotazo inmediato
      // con el rival desarmado (def→of, el patrón de la salida bajo presión). El convert
      // profundo era el rasgo F2 de Consolidada — desde T2 lo compra Dueños del Área.
      if (fortaleza && rnd() < (hasTrait(m, "duenos_area") ? s.type.adv.convertDeep : s.type.adv.convert)) {
        if (r.press) dtOk(m);
        m.log("event", `min ${m.min}' — ${f.convertText(m.oppTeam)}`);
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
        m.log("event", `min ${m.min}' — 🧱 ${f.containOk}`);
        if (r.press) dtOk(m);
        return chainMine(m, tt.to, { bonus: tt.bonus, intro: tt.intro, buildDecision: buildActDecision }) ? false : closeSilent(m);
      }
      const out = closeSeq(m, "event", `min ${m.min}' — 🧱 ${f.containOk}`); if (r.press) dtOk(m); return out;
    }
    if (r.press) s.bonus = 0.05; // presión fallida: el rival queda mejor perfilado
    m.log("chance", `min ${m.min}' — ${f.containFail(m.oppTeam)}`);
    if (r.press) dtFail(m);
    // T1 — Oficio de Trinchera: el avance rival puede morir CORTADO (falta táctica,
    // ritmo roto) antes de llegar al remate — el partido se corta, la jugada muere.
    const of = hookOf(m, "oppLoseActs");
    if (of && rnd() < of.p) {
      traitMoment(m, of.traitId, [of.texto]);
      return closeSilent(m);
    }
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
  const jl = hookOf(m, "oppShotMalus");
  const malus = jl && familyOf(s.type) === jl.seq ? jl.bonus : 0;
  const r = A.actOppShot(m, s.shooter, mine, { bonus: s.bonus + malus });
  if (r.ok) { goalOpp(m, s.shooter); return closeSilent(m); }
  const out = closeSeq(m, "chance", `min ${m.min}' — ${s.shooter.name} remata pero ${pick([`ataja ${mine.por ? mine.por.name : "el arquero"}`, "se va afuera", "la bloquea la zaga"])}.`);
  if (malus && rnd() < 0.4) traitMoment(m, jl.traitId, [jl.texto]); // el momento se narra a veces (sin spamear)
  return out;
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
  return closeSeq(m, "chance", `min ${m.min}' — ¡el rebote le queda a ${p2.name}! pero su remate ${pick(["lo tapa el arquero", "se va por arriba", "muere en la zaga"])}.`);
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
    const md = rollChain(m, "chainOnMineFail");
    if (md && chainMine(m, md.to, { bonus: md.bonus, intro: md.intro, buildDecision: buildActDecision })) return false;
    return out;
  }
  m.log("chance", failText);
  if (risky) dtFail(m);
  m.log("event", `min ${m.min}' — ¡${m.oppTeam.name} sale de CONTRA con el equipo partido!`);
  // La mitad de las contras terminan en el mano a mano del último hombre (absorción A2,
  // calibración del Sprint 1 intacta); la otra mitad, en remate directo del que se escapó.
  if (rnd() < LASTMAN_FROM_COUNTER && lastManChance(m)) { closeSilent(m); return true; }
  const { mine } = m.powers();
  const alive = m.oppLineup.filter(p => !p.expulsado);
  const fast = alive.filter(p => p.pos === "DEL" || p.pos === "MED");
  const sh = fast.length ? pick(fast) : pick(alive);
  const shot = A.actOppShot(m, sh, mine, { bonus: 0.10 });
  if (shot.ok) { goalOpp(m, sh); return closeSilent(m); }
  return closeSeq(m, "chance", `min ${m.min}' — ${sh.name} remata la contra pero ${mine.por ? mine.por.name : "el arquero"} responde enorme.`);
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
    m.log("card", `min ${m.min}' — 🟨 ${foulText(p)}`);
    if (p.amarillaPartido >= 2) {
      p.expulsado = true;
      m.log("card", `min ${m.min}' — 🟥 ¡Segunda amarilla y EXPULSIÓN de ${p.name}! ${m.oppTeam.name} queda con uno menos.`);
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
