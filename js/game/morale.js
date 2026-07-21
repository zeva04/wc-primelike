/* ============================================================
   game/morale — la Moral del EQUIPO (Bible cap. 6): estado
   anímico colectivo 1..100 (nace en 50). Reacciona a los
   resultados y a CÓMO se dan: un gol agónico del triunfo sube
   más que ganar de trámite; que te empaten al final duele más
   que un empate cualquiera; pasar de ronda celebra.

   v1 (decisión PO 17-jul-2026): la moral es VISIBLE (hub, Daily,
   diario en cambios de banda) y es target de efectos de
   contenido (content/ la muta directo con clamp), pero NO tiene
   efecto mecánico en el partido todavía.

   [MORAL → OCASIONES] PRÓXIMA ITERACIÓN (dejado aquí y en
   Match.tick a pedido del PO): la moral modulará el TIPO y el
   NÚMERO de ocasiones que el equipo genera en el partido —
   p. ej. escalar la probabilidad de ocasión propia (hoy
   `0.12 + 0.22 * ratioMy` en Match.tick) según la banda, y/o
   sesgar el mix remate/pase/individual. Para eso el Match
   necesitará recibir la moral en su contexto (matchCtx), porque
   el motor del partido no conoce la run.
   ============================================================ */
import { clamp } from "../core/math.js";
import { addJournal } from "./journal.js";

export const MORAL_MIN = 1;
export const MORAL_MAX = 100;
export const MORAL_INICIAL = 50;

// Las 5 bandas (de mejor a peor). `moraleBand` devuelve la primera cuyo mínimo se alcanza.
export const MORAL_BANDS = [
  { min: 81, id: "nubes",   label: "Por las nubes", icon: "🚀" },
  { min: 61, id: "alta",    label: "Alta",          icon: "😄" },
  { min: 41, id: "estable", label: "Estable",       icon: "😐" },
  { min: 21, id: "baja",    label: "Baja",          icon: "😟" },
  { min: 1,  id: "suelo",   label: "Por el suelo",  icon: "🥀" },
];

/** Banda anímica de un valor de moral 1..100. */
export function moraleBand(v) { return MORAL_BANDS.find(b => v >= b.min) || MORAL_BANDS.at(-1); }

// Un gol del minuto 85 en adelante es "agónico" (la prórroga entera lo es).
const MIN_AGONICO = 85;

// SPRINT 4 — interacción cruzada Momento → Moral (decisión PO 21-jul-2026): un vestuario
// lleno de jugadores apagados hunde el ánimo colectivo. Cierra el loop individual →
// colectivo sin sistemas nuevos: la forma de cada uno ya la calcula momentum.js, acá solo
// se cuenta. Es un CASTIGO sin premio espejo a propósito (Bible §4.5: los sistemas deben
// generar problemas). Se evalúa DESPUÉS del cierre de momento del partido —
// flow.postMatchUpdate corre applyMomentumPostMatch de todo el plantel antes de llamar acá.
export const FRIOS_UMBRAL = 4;   // cuántos jugadores en momento ≤2 hacen falta
export const FRIOS_MOMENTO = 2;  // "frío" = momento 1 o 2 (Paupérrimo / Apagado)
export const FRIOS_MORAL = 5;    // cuánta moral se lleva puesta

/**
 * Mueve la moral del equipo con clamp 1..100. Si el movimiento cruza de banda,
 * lo anota en el Diario (el cambio de humor colectivo es un momento de la run;
 * los ajustes que no cambian la banda son silenciosos).
 */
export function bumpMorale(run, delta, motivo) {
  if (run.moral === undefined) run.moral = MORAL_INICIAL; // runs guardadas antes del sprint
  const antes = moraleBand(run.moral);
  run.moral = clamp(run.moral + delta, MORAL_MIN, MORAL_MAX);
  const ahora = moraleBand(run.moral);
  if (ahora !== antes) {
    const sube = delta > 0;
    addJournal(run, {
      icon: ahora.icon, tone: sube ? "good" : "bad",
      title: `La moral del equipo ${sube ? "sube" : "cae"}: ${ahora.label.toLowerCase()}`,
      desc: motivo,
    });
  }
  return run.moral;
}

/**
 * Cierre anímico del partido (lo llama flow.postMatchUpdate):
 *  - base: victoria +10 · derrota −10 · empate 0 (el RESULTADO mueve la moral del equipo,
 *    no el momento individual — decisión PO 18-jul)
 *  - gol agónico (≥85') que decide: triunfo por la mínima +5 · empate propio al
 *    final +4 · nos empatan al final −4 · derrota por la mínima al final −5
 *  - tanda de penales: ganarla +3 extra, perderla −3 extra (el drama pesa)
 *  - vestuario apagado: FRIOS_UMBRAL+ jugadores en momento ≤2 restan FRIOS_MORAL (Sprint 4)
 * "Pasar de ronda" suma aparte en flow.advanceStage (bumpMorale +5).
 *
 * Devuelve el RESUMEN para el análisis del cuerpo técnico del post-partido:
 * `{before, after, delta, bandBefore, bandAfter, reasons:[texto]}`.
 */
export function applyMoralePostMatch(run, match) {
  const res = match.result();
  const won = res.winner === "my", lost = res.winner === "opp";
  const reasons = [];
  let delta = won ? 10 : lost ? -10 : 0;
  reasons.push(won ? "Victoria" : lost ? "Derrota" : "Empate");

  const lastMy = match.scorers.at(-1);          // mi último gol {name, min}
  const lastOpp = match.oppGoalMins.at(-1);     // minuto del último gol rival
  const margen = match.gMy - match.gOpp;        // marcador de los 90/120 (sin tanda)
  if (margen === 1 && lastMy && lastMy.min >= MIN_AGONICO) { delta += 5; reasons.push("triunfo sobre la hora"); }
  else if (margen === -1 && lastOpp >= MIN_AGONICO) { delta -= 5; reasons.push("gol rival sobre la hora"); }
  else if (margen === 0 && (lastMy || lastOpp !== undefined)) {
    const myMin = lastMy ? lastMy.min : -1;
    const oppMin = lastOpp !== undefined ? lastOpp : -1;
    if (myMin > oppMin && myMin >= MIN_AGONICO) { delta += 4; reasons.push("empate rescatado al final"); }
    else if (oppMin > myMin && oppMin >= MIN_AGONICO) { delta -= 4; reasons.push("empate sufrido al final"); }
  }
  if (res.pens) { delta += won ? 3 : -3; reasons.push(won ? "tanda ganada" : "tanda perdida"); }
  // Cruce Momento → Moral: demasiados jugadores apagados pesan en el vestuario (Sprint 4).
  const frios = (run.squad || []).filter(p => (p.momento ?? 4) <= FRIOS_MOMENTO).length;
  if (frios >= FRIOS_UMBRAL) { delta -= FRIOS_MORAL; reasons.push(`${frios} jugadores apagados`); }

  const before = run.moral ?? MORAL_INICIAL;
  const bandBefore = moraleBand(before);
  bumpMorale(run, delta, motivoDe(match, res, won, lost));
  return { before, after: run.moral, delta, bandBefore, bandAfter: moraleBand(run.moral), reasons };
}

/** Frase del diario para un cambio de banda tras el partido. */
function motivoDe(match, res, won, lost) {
  const marcador = `${res.gMy}-${res.gOpp} vs ${match.oppTeam.name}`;
  if (res.pens) return won ? `La tanda ganada ante ${match.oppTeam.name} desata la euforia.` : `Perder en los penales ante ${match.oppTeam.name} golpea al grupo.`;
  return won ? `La victoria ${marcador} contagia al grupo.` : lost ? `La derrota ${marcador} pesa en el vestuario.` : `El empate ${marcador} deja sensaciones divididas.`;
}
