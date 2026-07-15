/* ============================================================
   game/match/incidents — faltas, tarjetas y lesiones EN juego.
   Funciones que operan sobre una instancia de Match (`m`).
   Crea las decisiones: protect | forced_sub | gk_red
   (contrato de decisiones: ver Match.js).
   (Lo que trasciende el partido — acumulación, suspensiones —
   vive en game/discipline.js y game/flow.js.)
   ============================================================ */
import { rnd, pick } from "../../core/rng.js";
import { statLine } from "../ratings.js";
import { rollInjury } from "../medical.js";

/** Falta aleatoria: puede derivar en amarilla, roja, o la decisión de proteger a un amonestado. */
export function foulEvent(m) {
  const againstMe = rnd() < 0.5;
  if (againstMe) {
    const p = pick(m.oppLineup.filter(x => !x.expulsado));
    if (rnd() < 0.4) {
      p.amarillaPartido = 1; // persiste toda la partida (se muestra en el panel del rival)
      m.log("card", `min ${m.min}' — 🟨 Amarilla a ${p.name} (${m.oppTeam.name}) por falta dura.`);
    } else {
      m.log("card", `min ${m.min}' — Falta dura de ${p.name} (${m.oppTeam.name}). El árbitro deja seguir.`);
    }
    return false;
  }
  const cands = m.activeMine();
  const p = pick(cands);
  if (rnd() < 0.40) {
    if (rnd() < 0.06) {
      p.expulsado = true;
      m.stats.tarjetas++;
      m.log("card", `min ${m.min}' — 🟥 ¡EXPULSADO ${p.name}! Roja directa. Juegan con ${m.activeMine().length}.`);
      return p.pos === "POR" ? forceGkReplacement(m) : false;
    }
    p.amarillaPartido = (p.amarillaPartido || 0) + 1;
    m.stats.tarjetas++;
    if (p.amarillaPartido >= 2) {
      p.expulsado = true;
      m.log("card", `min ${m.min}' — 🟥 Segunda amarilla y EXPULSIÓN de ${p.name}.`);
      return p.pos === "POR" ? forceGkReplacement(m) : false;
    }
    m.log("card", `min ${m.min}' — 🟨 Amarilla para ${p.name}.`);
    // Si venía apercibido del torneo, esta amarilla lo suspende para el próximo partido
    if ((p.amarillas || 0) >= 1) {
      m.log("card", `⚠️ ${p.name} estaba apercibido: acumula su segunda amarilla del torneo y se perderá el PRÓXIMO partido.`);
    }
    // Decisión: ¿lo cambio para protegerlo?
    if (m.subsLeft > 0 && m.eligibleFor(p).length > 0) {
      m.decision = {
        id: "protect", player: p,
        title: `🟨 ${p.name} está amonestado`,
        text: "Si comete otra falta, se va expulsado. ¿Qué haces?",
        options: [
          { label: "Sigue en cancha", hint: "Confías en él", key: "keep" },
          { label: `Cambiarlo (${m.subsLeft} cambios restantes)`, hint: "Elegirás el reemplazo", key: "sub" },
        ],
      };
      m.stats.decisiones++;
      return true;
    }
  } else {
    m.log("plain", `min ${m.min}' — Falta de ${p.name}, el árbitro cobra pero no amonesta.`);
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
    m.log("plain", `min ${m.min}' — Un jugador de ${m.oppTeam.name} recibe atención médica. Se reincorpora.`);
    return false;
  }
  if (m.my.buffs.antiLesion) {
    m.log("event", `min ${m.min}' — Golpe fuerte a uno de los tuyos, pero el cuerpo médico de élite lo deja como nuevo. 🧑‍⚕️`);
    return false;
  }
  const p = pick(m.activeMine());
  const grave = rnd() < 0.45;
  if (!grave) {
    p.energia = Math.max(10, p.energia - 20);
    m.log("event", `min ${m.min}' — ${p.name} recibe un golpe. Sigue, pero está tocado (−energía).`);
    return false;
  }
  const inj = rollInjury();
  p.lesionado = true;
  // +1 porque postMatchUpdate descuenta uno al cerrar este partido; así `partidos` = bajas completas.
  p.lesionadoPartidos = inj.partidos + 1;
  const baja = inj.partidos === 0
    ? "sale del partido pero llega al próximo"
    : `${inj.partidos} partido${inj.partidos > 1 ? "s" : ""} de baja`;
  m.log("event", `min ${m.min}' — 🚑 ¡${p.name} sufre ${inj.name} (${inj.severidad})! No puede continuar — ${baja}.`);
  if (m.subsLeft > 0 && m.eligibleFor(p).length > 0) {
    m.decision = {
      id: "forced_sub", out: p,
      title: `🚑 ${p.name}: ${inj.name}`,
      text: "Debes reemplazarlo. Elige quién entra:",
      options: m.eligibleFor(p).map(b => ({ label: `#${b.num} ${b.name} (${b.pos})`, hint: statLine(b), key: b.name })),
    };
    m.stats.decisiones++;
    return true;
  }
  m.log("event", `Sin cambios disponibles: juegan con ${m.activeMine().length}.`);
  return false;
}
