/* ============================================================
   game/match/incidents — faltas, tarjetas y lesiones EN juego.
   Funciones que operan sobre una instancia de Match (`m`).
   Crea las decisiones: injury_sub | gk_red
   (contrato de decisiones: ver Match.js).
   (Lo que trasciende el partido — acumulación, suspensiones —
   vive en game/discipline.js y game/flow.js.)
   ============================================================ */
import { rnd, pick } from "../../core/rng.js";
import { noteMomentum, markMomentum } from "./match-momentum.js";
import { statLine } from "../ratings.js";
import { rollInjury, fatigueInjuryMult } from "../medical.js";

/** Falta aleatoria: puede derivar en amarilla, roja, o la decisión de proteger a un amonestado. */
export function foulEvent(m) {
  const againstMe = rnd() < 0.5;
  if (againstMe) {
    const p = pick(m.oppLineup.filter(x => !x.expulsado));
    if (rnd() < 0.4) {
      p.amarillaPartido = 1; // persiste toda la partida (se muestra en el panel del rival)
      markMomentum(m, "🟨");
      m.log("card", `min ${m.clock()}' — 🟨 Amarilla a ${p.name} (${m.oppTeam.name}) por falta dura.`);
    } else {
      m.log("card", `min ${m.clock()}' — Falta dura de ${p.name} (${m.oppTeam.name}). El árbitro deja seguir.`);
    }
    return false;
  }
  const cands = m.activeMine();
  const p = pick(cands);
  if (rnd() < 0.40) {
    if (rnd() < 0.06) {
      p.expulsado = true;
      m.stats.tarjetas++;
      // Quedarse con uno menos ENTREGA el partido: es de lo poco que mueve el momentum
      // sin ser una jugada (el gráfico tiene que explicar el quiebre que viene después).
      noteMomentum(m, "roja", "opp"); markMomentum(m, "🟥");
      m.log("card", `min ${m.clock()}' — 🟥 ¡EXPULSADO ${p.name}! Roja directa. Juegan con ${m.activeMine().length}.`);
      return p.pos === "POR" ? forceGkReplacement(m) : false;
    }
    p.amarillaPartido = (p.amarillaPartido || 0) + 1;
    m.stats.tarjetas++;
    if (p.amarillaPartido >= 2) {
      p.expulsado = true;
      noteMomentum(m, "roja", "opp"); markMomentum(m, "🟥");
      m.log("card", `min ${m.clock()}' — 🟥 Segunda amarilla y EXPULSIÓN de ${p.name}.`);
      return p.pos === "POR" ? forceGkReplacement(m) : false;
    }
    // La amarilla solo NARRA (PO 22-jul: el popup de "protegerlo" se eliminó — cambiar al
    // amonestado es una decisión que el DT toma solo, desde la Gestión de plantilla en vivo).
    markMomentum(m, "🟨");
    m.log("card", `min ${m.clock()}' — 🟨 Amarilla para ${p.name}. Queda condicionado: otra falta y se va.`);
    // Si venía apercibido del torneo, esta amarilla lo suspende para el próximo partido
    if ((p.amarillas || 0) >= 1) {
      m.log("card", `⚠️ ${p.name} estaba apercibido: acumula su segunda amarilla del torneo y se perderá el PRÓXIMO partido.`);
    }
  } else {
    m.log("plain", `min ${m.clock()}' — Falta de ${p.name}, el árbitro cobra pero no amonesta.`);
  }
  return false;
}

/**
 * Tras la roja al arquero: pausa y obliga a meter un arquero suplente por un jugador de campo.
 * Devuelve true (decisión pendiente) o, si no hay arquero suplente / cambios, false con aviso.
 */
export function forceGkReplacement(m) {
  const gkIn = m.availableBench().find(b => b.pos === "POR");
  const fieldOnPitch = m.activeMine().filter(p => p.pos !== "POR");
  if (m.subsLeft <= 0 || !gkIn || !fieldOnPitch.length) {
    m.log("event", `Sin arquero en la banca: un jugador de campo se pone los guantes. 🧤`);
    return false;
  }
  m.decision = {
    id: "gk_red", gkIn: gkIn.name,
    title: `🧤 ¡Te quedaste sin arquero!`,
    text: `Entra #${gkIn.num || "?"} ${gkIn.name} (POR). Elige qué jugador de campo sale:`,
    options: fieldOnPitch.map(p => ({ label: `#${p.num} ${p.name} (${p.pos})`, hint: statLine(p), key: p.name })),
  };
  m.stats.decisiones++;
  return true;
}

/** Lesión aleatoria: golpe leve (−energía) o lesión que fuerza un cambio (decisión "forced_sub"). */
export function injuryEvent(m) {
  const mineInjured = rnd() < 0.5;
  if (!mineInjured) {
    m.log("plain", `min ${m.clock()}' — Un jugador de ${m.oppTeam.name} recibe atención médica. Se reincorpora.`);
    return false;
  }
  if (m.my.buffs.antiLesion) {
    m.log("event", `min ${m.clock()}' — Golpe fuerte a uno de los tuyos, pero el cuerpo médico de élite lo deja como nuevo. 🧑‍⚕️`);
    return false;
  }
  const p = pick(m.activeMine());
  // Cruce Energía → Lesión (Sprint 4): con las piernas vacías, el golpe termina peor.
  const grave = rnd() < 0.45 * fatigueInjuryMult(p.energia);
  if (!grave) {
    p.energia = Math.max(10, p.energia - 20);
    m.log("event", `min ${m.clock()}' — ${p.name} recibe un golpe. Sigue, pero está tocado (−energía).`);
    return false;
  }
  const inj = rollInjury();
  p.lesionado = true;
  // +1 porque postMatchUpdate descuenta uno al cerrar este partido; así `partidos` = bajas completas.
  p.lesionadoPartidos = inj.partidos + 1;
  const baja = inj.partidos === 0
    ? "sale del partido pero llega al próximo"
    : `${inj.partidos} partido${inj.partidos > 1 ? "s" : ""} de baja`;
  markMomentum(m, "🚑");
  m.log("event", `min ${m.clock()}' — 🚑 ¡${p.name} sufre ${inj.name} (${inj.severidad})! No puede continuar — ${baja}.`);
  if (m.subsLeft > 0 && m.eligibleFor(p).length > 0) {
    // El reemplazo es MANUAL (PO 22-jul): nada de lista de recomendados — la UI abre la
    // Gestión de plantilla en vivo con el caído marcado y el DT arma el cambio a mano.
    // El smoke lo emula con makeSub directo (mismo efecto que la lista vieja).
    m.decision = {
      id: "injury_sub", player: p,
      title: `🚑 ${p.name}: ${inj.name}`,
      text: "Debes reemplazarlo en la Gestión de plantilla.",
      options: [],
    };
    m.stats.decisiones++;
    return true;
  }
  m.log("event", `Sin cambios disponibles: juegan con ${m.activeMine().length}.`);
  return false;
}
