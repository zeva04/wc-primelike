/* ============================================================
   game/match/acts/setpiece — EL BALÓN PARADO, sus dos caras:
   el córner o tiro libre a favor (que desde la banda y desde
   el frente son jugadas distintas) y el córner en contra.

   Cada familia trae SUS constructores de decisión (`BUILDERS`) y
   SUS resolvers: agregar un acto es tocar un solo archivo. La
   entrada (`../sequence-acts.js`) solo los monta y despacha.

   Ciclo BENIGNO de runtime con la entrada y con `chains.js` (el
   mismo patrón que sequences ↔ sequence-acts): nada se usa en la
   evaluación del módulo, solo dentro de las funciones.
   ============================================================ */
import { pick } from "../../../core/rng.js";
import { hookOf, rollChain, chainMine, traitMoment } from "../trait-hooks.js";
import * as A from "../actions.js";
import { goalMine, goalOpp } from "../chances.js";
import { BOX_OPP, inWing } from "../field.js";
import { buildActDecision } from "../sequence-acts.js";
import { dtOk, dtFail } from "./common.js";
import { closeSeq, closeSilent, maybeRebound } from "./chains.js";
import { oppShotBlockMalus, noteOppDead } from "./block.js";

/** Los constructores de decisión de esta familia (los monta buildActDecision). */
export const BUILDERS = {
  setpiece: (m, s) => {
    const mates = m.activeMine().filter(p => p !== s.prot && p.pos !== "POR");
    s.target = mates.sort((a, b) => (b.stats.cabezazo || 0) - (a.stats.cabezazo || 0))[0] || s.prot;
    const corner = inWing(m);
    return {
      title: corner
        ? `🎯 min ${m.clock()}' — Córner a favor: lo tira ${s.prot.name}`
        : `🎯 min ${m.clock()}' — Tiro libre frontal: ${s.prot.name} se para detrás de la pelota`,
      text: corner ? "El área se llena de camisetas. ¿Qué ensayaron en la semana?" : "Hay barrera, y el arco de frente. ¿Qué ensayaron en la semana?",
      options: [
        ...(corner ? [] : [{ label: "🎯 Tiro libre directo al arco", hint: `Tiro ${s.prot.stats.tiro} — de frente hay ángulo: es la opción más peligrosa`, key: "directo" }]),
        { label: `📡 Centro al área para ${s.target.name}`, hint: corner
          ? `Cabezazo ${s.target.stats.cabezazo} — desde el costado el envío llega perfecto`
          : `Cabezazo ${s.target.stats.cabezazo} — de frente, el centro sale peor`, key: "centro" },
        { label: "🎭 Jugada preparada", hint: `Descarga corta y remate (Tiro ${s.prot.stats.tiro})`, key: "jugada" },
      ],
    };
  },
  defend_sp: (m, s) => ({
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
};

export function resolveSetpiece(m, s, key, f) {
  // Balón parado a favor: una decisión, desenlace inmediato (secuencia de un solo duelo).
  // T2 — Pelota Parada Ensayada: la pizarra entra en acción — ambas opciones llegan
  // mejor ensayadas (bonus de situación) y el momento se narra una vez por jugada.
  const sr = hookOf(m, "setpieceRehearsed");
  const srB = sr ? sr.bonus : 0;
  if (sr && !s.rehearsedTold) { s.rehearsedTold = true; traitMoment(m, sr.traitId, [sr.texto]); }
  // EL TIRO LIBRE DIRECTO (Eje Horizontal): solo existe de frente al arco, y vale más
  // cuanto más cerca se cobra. Es la opción más peligrosa del balón parado frontal —
  // y la que no existe desde el córner, donde no hay ángulo que valga.
  if (key === "directo") {
    const cerca = (m.field?.v ?? 4) >= BOX_OPP;
    const shot = A.actShot(m, s.prot, { stat: "tiro", bonus: (cerca ? 0.13 : 0.07) + srB });
    if (shot.ok) { goalMine(m, s.prot, "¡GOLAZO DE TIRO LIBRE! La colgó del ángulo.", "open"); return closeSilent(m); }
    return maybeRebound(m, `min ${m.clock()}' — el tiro libre de ${s.prot.name} ${pick(["se estrella en la barrera", "pasa lamiendo el palo", "lo manda al córner el arquero volando"])}.`);
  }
  if (key === "centro") {
    const t = s.target || s.prot;
    // El centro es MÁS peligroso desde el costado (el córner es su sitio natural) y peor
    // de frente, donde la barrera y la zaga están mirando la pelota.
    const shot = A.actShot(m, t, { stat: "cabezazo", bonus: 0.10 + (inWing(m) ? 0.03 : -0.05) + srB });
    if (shot.ok) { goalMine(m, t, "¡Cabezazo letal en el balón parado!", s.prot); return closeSilent(m); }
    return maybeRebound(m, `min ${m.clock()}' — el centro busca a ${t.name} pero ${pick(["gana el arquero en el aire", "la despeja la zaga", "el cabezazo se va por arriba"])}.`);
  }
  const shot = A.actShot(m, s.prot, { stat: "tiro", bonus: 0.06 + srB });
  if (shot.ok) { goalMine(m, s.prot, "¡La jugada preparada termina en gol!", "open"); return closeSilent(m); }
  return maybeRebound(m, `min ${m.clock()}' — la jugada ensayada muere en ${pick(["un rebote", "el achique del arquero", "un despeje al córner"])}.`);
}


export function resolveDefendSp(m, s, key, f) {
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


