/* ============================================================
   game/match/shootout — tanda de penales (5 rondas + muerte
   súbita). Funciones que operan sobre una instancia de Match.
   ============================================================ */
import { rnd, pick } from "../../core/rng.js";
import { clamp } from "../../core/math.js";
import { momentoMult } from "../momentum.js";
import { effStat } from "./powers.js";

/** Inicializa la tanda (5 rondas + muerte súbita). */
export function startShootout(m) {
  m.pens = { my: [], opp: [], round: 0, done: false, winner: null, takers: [] };
}

/** Estado actual de la tanda para la UI (goles, secuencias, ganador). */
export function shootoutStatus(m) {
  const p = m.pens;
  const sum = a => a.filter(Boolean).length;
  return { myGoals: sum(p.my), oppGoals: sum(p.opp), round: p.round, my: p.my, opp: p.opp, done: p.done, winner: p.winner };
}

/** Penal mío en la tanda: el usuario eligió pateador y dirección (al centro es más arriesgado). */
export function shootMyPen(m, takerName, dir) {
  const p = m.my.lineup.find(x => x.name === takerName) || m.my.bench.find(x => x.name === takerName);
  m.pens.takers.push(takerName);
  // Si patea el arquero (obligado en tandas largas), usa reflejos con castigo en vez de tiro.
  // La tanda va SIN el % del Momento (recorte de balance ver chances.resolvePenaltyMine).
  const base = p.pos === "POR" ? effStat(p, "reflejos", m.my.buffs) * 0.8 : effStat(p, "tiro", m.my.buffs);
  const q = (base + effStat(p, "aura", m.my.buffs)) / 2 / momentoMult(p);
  let prob = clamp(0.5 + q * 0.07 + (m.my.buffs.penales || 0), 0.45, 0.92);
  if (dir === "centro") prob -= 0.06; // más riesgo, el arquero a veces se queda
  const scored = rnd() < prob;
  if (!scored) m.pensFallados.push(p.name); // señal para el momento post-partido
  m.pens.my.push(scored);
  checkShootoutEnd(m);
  return { scored, taker: p.name };
}

/** Penal rival en la tanda: el usuario eligió hacia dónde se lanza su arquero. */
export function shootOppPen(m, guess) {
  const { mine } = m.powers();
  const shooters = m.oppLineup.filter(x => x.pos !== "POR");
  const shooter = shooters[m.pens.opp.length % shooters.length];
  const dir = pick(["izq", "centro", "der"]);
  const porQ = mine.por ? (effStat(mine.por, "reflejos", m.my.buffs) * 0.6 + effStat(mine.por, "aura", m.my.buffs) * 0.4) / momentoMult(mine.por) : 1;
  let scored;
  if (guess === dir) {
    scored = !(rnd() < clamp(0.30 + porQ * 0.09, 0.3, 0.8));
  } else {
    scored = !(rnd() < 0.10); // a veces la tiran afuera
  }
  if (!scored && guess === dir) {
    m.stats.penalesAtajados++;
    if (mine.por) m.pensAtajadosPor.push(mine.por.name); // señal para el momento post-partido
  }
  m.pens.opp.push(scored);
  m.pens.round = Math.max(m.pens.my.length, m.pens.opp.length);
  checkShootoutEnd(m);
  return { scored, shooter: shooter.name, dir, guessed: guess === dir };
}

/** Cierra la tanda cuando hay definición matemática (dentro de los 5) o diferencia en muerte súbita. */
function checkShootoutEnd(m) {
  const p = m.pens;
  const sm = p.my.filter(Boolean).length, so = p.opp.filter(Boolean).length;
  const nm = p.my.length, no = p.opp.length;
  // definición matemática dentro de los 5
  if (nm <= 5 && no <= 5) {
    if (sm > so + (5 - no)) { p.done = true; p.winner = "my"; }
    else if (so > sm + (5 - nm)) { p.done = true; p.winner = "opp"; }
    else if (nm === 5 && no === 5 && sm !== so) { p.done = true; p.winner = sm > so ? "my" : "opp"; }
  } else if (nm === no && nm > 5 && sm !== so) {
    p.done = true; p.winner = sm > so ? "my" : "opp";
  }
  if (p.done) { m.finished = true; m.phase = "done"; }
}
