/* ============================================================
   game/philosophy — la identidad futbolística de la run
   (arco de Filosofía F1, decisiones PO 22-jul-2026).

   Posee `run.filoId` y lee `run.aristas` (que mutan content/
   day-actions con los focos de la Sesión Táctica y los eventos
   vía addFiloProgress). Reglas que viven acá:
   - nivel = f(suma de las 2 aristas propias)  → FILO_LEVELS
   - elección post-sorteo (gratis, antes del día 1)
   - cambio a mitad de run: cuesta la Acción del Día; las
     aristas PERSISTEN (demolición orgánica, decisión PO #1)
   - progresión por EJECUCIÓN (Bible §5 "successful execution"):
     acertar actos del tipo firma en partido suma progreso chico
     a la arista firma, con tope por partido.

   La filosofía viaja al partido como la moral: matchCtx.filo =
   {id, nivel} (se arma en screens/match.js Y tests/smoke.js);
   el Match no conoce la run (ARQUITECTURA §3.2).
   ============================================================ */
import { getPhilosophy, aristaById, filoPointsOf, filoLevelOf } from "../content/philosophies.js";
import { ADVANCED_BY_FILO } from "../content/sequences.js";
import { TEAM_PHILOSOPHIES } from "../content/team-philosophies.js";
import { teamRating } from "./ratings.js";
import { clamp } from "../core/math.js";
import { addJournal } from "./journal.js";
import { trackOxidacion } from "./oxidation.js";

// Progresión por ejecución: cada ACIERTO de acto en una secuencia del tipo firma
// (los cuenta el Match en `match.filoHits`) vale FILO_EXEC_GAIN de la arista
// firma, con tope de FILO_EXEC_CAP aciertos por partido (decisión PO F1:
// +0.25 y tope +0.5 — dos partidos jugando tu fútbol = un día de Sesión
// Táctica; la cancha consolida, el entrenamiento sigue siendo la vía principal).
export const FILO_EXEC_GAIN = 0.25;
export const FILO_EXEC_CAP = 2;

/** Suma de las 2 aristas propias de la filosofía activa (0 sin filosofía).
 *  Delegado en content/philosophies desde F3 (el contenido también lo lee). */
export const filoPoints = filoPointsOf;

/** Índice del nivel actual en FILO_LEVELS (0 Aprendiendo · 1 En desarrollo · 2 Consolidada). */
export const filoLevel = filoLevelOf;

/** La filosofía para matchCtx: `{id, nivel}` o null — la frontera run→Match, como la moral. */
export function filoCtx(run) {
  return run.filoId ? { id: run.filoId, nivel: filoLevel(run) } : null;
}

/**
 * Elección post-sorteo (decisión PO #1): gratis, antes del día 1. Devuelve la
 * filosofía elegida o null si el id no existe. No valida "ya elegiste" — la
 * pantalla del sorteo solo la llama una vez; re-elegir después pasa por
 * changePhilosophy (con costo).
 */
export function choosePhilosophy(run, filoId) {
  const f = getPhilosophy(filoId);
  if (!f) return null;
  run.filoId = f.id;
  run.filoNarrado = 0; // hito de nivel ya narrado (la CONQUISTA de M2 se cuenta una sola vez)
  const nombres = f.aristas.map(k => aristaById(k).label);
  addJournal(run, {
    icon: f.icon, tone: "gold", title: `El equipo abraza una identidad: ${f.name}`,
    desc: `${f.lema} El plan: entrenar ${nombres.join(" y ")} hasta que ese fútbol salga solo.`,
  });
  return f;
}

/**
 * Cambio de filosofía a mitad de run: CUESTA la Acción del Día (decisión PO #1)
 * y la demolición es orgánica — `run.aristas` no se toca: lo entrenado persiste,
 * pero la nueva identidad combina otras aristas (costo hundido real, sin castigo
 * arbitrario). Devuelve la filosofía nueva, o null si no hay acción pendiente,
 * el id no existe o es la actual (la UI no debería permitirlo).
 */
export function changePhilosophy(run, filoId) {
  const f = getPhilosophy(filoId);
  if (!f || !run.actionPending || f.id === run.filoId) return null;
  const prev = getPhilosophy(run.filoId);
  run.filoId = f.id;
  // Las aristas persisten: la identidad nueva puede NACER con nivel. Ese nivel heredado
  // no se narra como conquista (no se conquistó hoy) — la base narrada arranca ahí.
  run.filoNarrado = filoLevel(run);
  run.actionPending = false;
  run.lastAction = { day: run.day, id: `filo_${f.id}`, group: null, icon: f.icon, title: `Cambio de identidad: ${f.name}` };
  addJournal(run, {
    icon: "🔄", tone: "neutral", title: `Golpe de timón: de ${prev ? prev.name : "la nada"} a ${f.name}`,
    desc: `El día entero se fue en reinstalar ideas. Lo entrenado no se borra, pero la nueva identidad vive de ${f.aristas.map(k => aristaById(k).label).join(" y ")}.`,
  });
  // Oxidación (R1): reinstalar ideas ES trabajo táctico — el día cuenta como entrenado
  // (consume el turno por fuera de applyDayAction, así que registra su día acá).
  trackOxidacion(run, true);
  return f;
}

/**
 * La CONQUISTA narrada (M2): si el nivel de identidad cruzó un umbral desde la última
 * vez que se contó, el diario lo celebra — nivel 1 desbloquea la secuencia AVANZADA
 * (el fútbol superior ya sale en los partidos), nivel 2 la profundiza. Se llama en los
 * dos beats donde las aristas crecen: la Acción del Día (day-action) y el post-partido
 * (flow, la ejecución). Los eventos del calendario que sumen arista se narran en el
 * siguiente beat — la conquista no se pierde, se cuenta apenas hay micrófono.
 * Devuelve el nivel narrado o null.
 */
export function noteFiloMilestones(run) {
  const f = getPhilosophy(run.filoId);
  if (!f) return null;
  const lvl = filoLevel(run);
  if (lvl <= (run.filoNarrado ?? 0)) return null;
  run.filoNarrado = lvl;
  const adv = ADVANCED_BY_FILO[f.id];
  if (lvl === 1) addJournal(run, {
    icon: "🔓", tone: "gold", title: `¡Conquista! ${adv.icon} ${adv.name} ya es nuestro fútbol`,
    desc: `La idea de ${f.name} entró: desde hoy la ${adv.name} sale en los partidos. El fútbol básico quedó atrás — esto se entrenó.`,
  });
  else addJournal(run, {
    icon: "⭐", tone: "gold", title: `La idea es LEY: ${f.name} consolidada`,
    desc: `${adv.icon} ${adv.name} se profundiza: ${f.rasgo}`,
  });
  return lvl;
}

/* ---------- El rival tiene identidad (F2, decisión PO #4) ---------- */

/**
 * Filosofía de un equipo RIVAL: los 16 curados por su fútbol real
 * (content/team-philosophies) y el resto DERIVADA de sus datos, determinista y
 * sin rng: los débiles se encierran (bloque), los equipos de mediocampo con
 * jerarquía tocan (posesion), el resto espera y sale (contra — el fútbol
 * default del que no manda). El Press derivado no existe: presionar 90' es una
 * identidad demasiado específica para inferirla de stats — solo curado.
 */
export function derivePhilosophy(team) {
  if (TEAM_PHILOSOPHIES[team.id]) return TEAM_PHILOSOPHIES[team.id];
  const r = teamRating(team);
  if (r <= 70) return "bloque";
  const figs = team.players || team.figures || [];
  if (r >= 78 && figs.filter(f => f.pos === "MED").length >= 2) return "posesion";
  return "contra";
}

/**
 * Nivel de identidad del rival, por jerarquía: los grandes llegan CONSOLIDADOS
 * a su idea (decisión PO F2), los del medio en desarrollo, los chicos
 * aprendiendo. Misma escala 0..2 que FILO_LEVELS (y mismos multiplicadores).
 * LA IDENTIDAD MADURA (R2, decisión PO): desde CUARTOS (koRound ≥ 3) todo rival
 * sube +1 nivel (tope Consolidada) — el mediano que llegó lejos ya juega su
 * fútbol en serio. El eje es tournament/knockout.koRoundOf.
 */
export const FILO_MADURA_DESDE = 3; // koRound de cuartos
export function rivalFiloLevel(team, koRound = 0) {
  const r = teamRating(team);
  const base = r >= 84 ? 2 : r >= 78 ? 1 : 0;
  return Math.min(2, base + (koRound >= FILO_MADURA_DESDE ? 1 : 0));
}

/** La identidad rival completa para el Match y el scouting: {id, nivel, curated}. */
export function rivalFilo(team, koRound = 0) {
  return { id: derivePhilosophy(team), nivel: rivalFiloLevel(team, koRound), curated: !!TEAM_PHILOSOPHIES[team.id] };
}

/**
 * El costo físico de MI identidad (F2, decisión PO #7): el Press paga −6 de
 * energía extra post-partido a los que jugaron (Bible lo exige: correr arriba
 * los 90' pasa factura). Contra y Bloque pagan EN el partido (ceden posesión /
 * volumen ofensivo, match/sequences.filoShareShift); Posesión no paga costo
 * físico — su costo es la matriz. Lo llama flow.postMatchUpdate ANTES de su
 * loop por jugador ("jugó" = la misma regla, pero los flags usado/sustituido
 * se resetean en ese loop — cobrar después contaría mal a los suplentes).
 * Devuelve {press: -6, jugadores} o null para el análisis del post-partido.
 */
export const PRESS_FATIGUE = 6;
export function applyFiloCosts(run, match) {
  if (run.filoId !== "press") return null;
  const jugaron = run.squad.filter(p => match.my.lineup.includes(p) || p.usado || p.sustituido);
  for (const p of jugaron) p.energia = clamp(p.energia - PRESS_FATIGUE, 5, 100);
  return { press: -PRESS_FATIGUE, jugadores: jugaron.length };
}

/**
 * Progresión por ejecución tras el partido (la llama flow.postMatchUpdate, del
 * lado run de la frontera): convierte `match.filoHits` (aciertos de actos del
 * tipo firma, cuenta el Match) en progreso de la arista firma, con tope.
 * Devuelve `{arista, add, hits}` para el relato del post-partido (F3) o null
 * si no hubo nada que sumar.
 */
export function applyFiloExecution(run, match) {
  const f = getPhilosophy(run.filoId);
  const hits = Math.min(match.filoHits || 0, FILO_EXEC_CAP);
  if (!f || !hits) return null;
  run.aristas = run.aristas || {};
  const add = +(hits * FILO_EXEC_GAIN).toFixed(2);
  run.aristas[f.firma] = +((run.aristas[f.firma] || 0) + add).toFixed(2);
  return { arista: aristaById(f.firma), add, hits };
}
