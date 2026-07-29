/* ============================================================
   game/match/stats — LAS ESTADÍSTICAS DE TRANSMISIÓN
   (pedido del PO 28-jul-2026: el panel del partido pasó de las
   alineaciones a Posesión · Tiros · % Pases · Córners).

   Dos de las cuatro ya vivían en el motor y NO se tocan:
     · Posesión → `Match.flow()` la deriva de lo GENERADO (A3, #11)
     · Tiros    → `m.stats.misTiros/oppTiros` (punto único en
                  actions.actShot/actOppShot + chances)

   Las otras dos no existían. Se resuelven con la misma licencia
   que los remates ambiente del Bible §7 ("el resto se simula"):
   un 6v6 no juega 400 pases a mano, así que el VOLUMEN se simula
   por minuto desde la posesión y la calidad de pase de cada once,
   y lo que SÍ es una jugada del partido se suma encima —cada
   `actPass` que el DT eligió en una secuencia, y cada córner que
   nace de una jugada real (el balón parado en contra, el córner
   que gana la Fortaleza).

   POR QUÉ EL VOLUMEN SIMULADO ES DETERMINISTA: no consume `rnd()`.
   El % de pase de un equipo es genuinamente estable partido a
   partido (lo que varía es de quién es la pelota, y eso ya lo
   modula la posesión), y así el panel no le mueve NI UN dial al
   balance calibrado — el flujo del RNG queda intacto. La varianza
   visible la ponen los pases reales de las secuencias.
   ============================================================ */
import { clamp } from "../../core/math.js";
import { effStat } from "./powers.js";

/** Pases que se juegan por minuto entre los dos equipos (6v6: ~800 en 90'). */
const PASSES_PER_MIN = 9;
/** Córners por cada 5 minutos, escalados por el peligro de cada lado (≈4-5 por partido). */
const CORNER_MINE = 0.14, CORNER_OPP = 0.12;

/** El acumulador que cuelga de cada Match. `tot`/`ok` son floats: se redondean al mostrar. */
export const newTally = () => ({
  pases: { mine: { ok: 0, tot: 0 }, opp: { ok: 0, tot: 0 } },
  corners: { mine: 0, opp: 0 },
});

/**
 * Precisión de pase de un once, 0..1. Sale del `pase` promedio de sus jugadores de campo
 * por el MISMO caño que todo lo demás (`effStat`: energía, forma, oxidación incluidas),
 * así un equipo fundido al 80' también pierde la pelota más seguido.
 */
function passRate(players, buffs) {
  const field = players.filter(p => p.pos !== "POR" && !p.expulsado && !p.lesionado);
  if (!field.length) return 0.6;
  const q = field.reduce((s, p) => s + effStat(p, "pase", buffs), 0) / field.length;
  return clamp(0.58 + q * 0.06, 0.5, 0.93);
}

/**
 * Un minuto de estadística ambiente. Lo llama `Match.tick` con los poderes ya calculados
 * (mismo contrato que los remates ambiente, y por el mismo motivo: no recalcular).
 */
export function tickStats(m, mine, opp) {
  const t = m.tally;
  // La pelota se reparte como dice la posesión YA derivada del juego: una sola verdad.
  const cuota = m.flow().pos / 100;
  const passMine = PASSES_PER_MIN * cuota, passOpp = PASSES_PER_MIN * (1 - cuota);
  t.pases.mine.tot += passMine;
  t.pases.mine.ok += passMine * passRate(m.my.lineup, m.my.buffs);
  t.pases.opp.tot += passOpp;
  t.pases.opp.ok += passOpp * passRate(m.oppLineup, {});
  // Los córners nacen del ataque que muere en la zaga: mismo ratio que el remate ambiente.
  const ratioMy = mine.atk / (mine.atk + opp.def);
  const ratioOpp = opp.atk / (opp.atk + mine.def);
  if (m._roll(CORNER_MINE + 0.22 * ratioMy)) t.corners.mine++;
  if (m._roll(CORNER_OPP + 0.22 * ratioOpp)) t.corners.opp++;
}

/** Un pase REAL de una secuencia (lo llama actions.actPass): pesa como cualquier otro. */
export function notePass(m, side, ok) {
  const p = m.tally?.pases[side];
  if (!p) return;
  p.tot += 1;
  if (ok) p.ok += 1;
}

/** Un córner REAL de una jugada (balón parado en contra, el que gana la Fortaleza). */
export function noteCorner(m, side) { if (m.tally) m.tally.corners[side]++; }

/**
 * Lo que la UI necesita para pintar el panel, sin saber ninguna regla. Devuelve, por
 * estadística, `{ mine, opp, txt: [mío, suyo] }` — `txt` ya formateado y `mine/opp`
 * numéricos para el ancho de la barra.
 */
export function matchStats(m) {
  const t = m.tally || newTally();
  const pos = m.flow().pos;
  const pct = s => (s.tot < 1 ? 0 : Math.round((100 * s.ok) / s.tot));
  const pMine = pct(t.pases.mine), pOpp = pct(t.pases.opp);
  return [
    { id: "pos", label: "Posesión", mine: pos, opp: 100 - pos, txt: [`${pos}%`, `${100 - pos}%`] },
    { id: "tiros", label: "Tiros", mine: m.stats.misTiros, opp: m.stats.oppTiros, txt: [`${m.stats.misTiros}`, `${m.stats.oppTiros}`] },
    { id: "pases", label: "Pases con éxito", mine: pMine, opp: pOpp, txt: [`${pMine}%`, `${pOpp}%`] },
    { id: "corners", label: "Córners", mine: t.corners.mine, opp: t.corners.opp, txt: [`${t.corners.mine}`, `${t.corners.opp}`] },
  ];
}
