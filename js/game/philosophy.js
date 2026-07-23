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
import { getPhilosophy, aristaById, filoPointsOf, filoLevelOf, filoEtapaOf } from "../content/philosophies.js";
import { ADVANCED_BY_FILO } from "../content/sequences.js";
import { TEAM_PHILOSOPHIES } from "../content/team-philosophies.js";
import { teamRating } from "./ratings.js";
import { clamp } from "../core/math.js";
import { addJournal } from "./journal.js";
import { trackOxidacion } from "./oxidation.js";
import { syncIdentityPI, creditInheritedPI, activeTraitIds } from "./traits.js";

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

/** Índice del nivel actual en FILO_LEVELS (0..9 desde T1 — la escalera de PI). */
export const filoLevel = filoLevelOf;

/** Etapa del nivel (0 Aprendiendo · 1 En desarrollo · 2 Consolidada) — la escala
 *  0-2 original de F1: el rival, la brecha R3 y los gates viven acá (T1). */
export const filoEtapa = filoEtapaOf;

/** La filosofía para matchCtx: `{id, nivel, etapa, rasgos}` o null — la frontera
 *  run→Match, como la moral. `nivel` (0..9) sesga MI pool; `etapa` (0..2) es la
 *  escala de los gates (avanzada, rasgo, brecha R3) y de todo lo que compara
 *  contra el rival; `rasgos` son los ids ACTIVOS del árbol (T1 — el Match los
 *  interpreta vía sus hooks, jamás conoce la run). */
export function filoCtx(run) {
  return run.filoId ? { id: run.filoId, nivel: filoLevel(run), etapa: filoEtapa(run), rasgos: activeTraitIds(run) } : null;
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
  // El PI inicial (T1, decisión PO): elegir filosofía ES el nivel 1 — el sync lo
  // acredita y el flujo de inicio lo gasta en 1 de los 3 rasgos básicos.
  syncIdentityPI(run);
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
  syncIdentityPI(run); // niveles pendientes de la identidad SALIENTE: se acreditan antes de soltarla
  run.filoId = f.id;
  // ANTI-FARMING (T1): la identidad nueva NACE acreditada a su nivel heredado — la
  // arista compartida cuenta para dos filosofías y premiarla dos veces imprimiría PI.
  // Los rasgos comprados de la saliente quedan LATENTES en run.rasgos (decisión PO #3).
  creditInheritedPI(run);
  // Las aristas persisten: la identidad nueva puede NACER con nivel. Esa etapa heredada
  // no se narra como conquista (no se conquistó hoy) — la base narrada arranca ahí.
  run.filoNarrado = filoEtapa(run);
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
 * La CONQUISTA narrada (M2): si la ETAPA de identidad cruzó un umbral desde la última
 * vez que se contó, el diario lo celebra — Desarrollo desbloquea la secuencia AVANZADA
 * (el fútbol superior ya sale en los partidos), Consolidada la profundiza. Se llama en
 * los dos beats donde las aristas crecen: la Acción del Día (day-action) y el
 * post-partido (flow, la ejecución). Los eventos del calendario que sumen arista se
 * narran en el siguiente beat — la conquista no se pierde, se cuenta apenas hay
 * micrófono. (T1: los hitos son de ETAPA — los 10 niveles finos otorgan PI, no relato;
 * su celebración es la pantalla del árbol.) Devuelve la etapa narrada o null.
 */
export function noteFiloMilestones(run) {
  const f = getPhilosophy(run.filoId);
  if (!f) return null;
  const lvl = filoEtapa(run);
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
 * aprendiendo. Escala 0..2 de FILO_ETAPAS (y sus multiplicadores exactos —
 * la escalera de 10 niveles de T1 es solo MÍA: el rival no compra rasgos).
 * LA IDENTIDAD MADURA (R2, decisión PO): en eliminatorias todo rival sube +1
 * nivel (tope Consolidada) — nadie llega a KO sin idea. Nació "desde cuartos"
 * (koRound 3) y R3 la adelantó a 16avos (decisión PO 22-jul): la brecha de
 * identidad medía −1.3pp porque en 16avos/octavos los rivales chicos eran nivel
 * 0 y la brecha no existía justo donde mueren las runs del improvisador. El eje
 * es tournament/knockout.koRoundOf.
 */
export const FILO_MADURA_DESDE = 1; // koRound de 16avos (R3; nació 3 = cuartos en R2)
export function rivalFiloLevel(team, koRound = 0) {
  const r = teamRating(team);
  const base = r >= 84 ? 2 : r >= 78 ? 1 : 0;
  return Math.min(2, base + (koRound >= FILO_MADURA_DESDE ? 1 : 0));
}

/** La identidad rival completa para el Match y el scouting: {id, nivel, curated}. */
export function rivalFilo(team, koRound = 0) {
  return { id: derivePhilosophy(team), nivel: rivalFiloLevel(team, koRound), curated: !!TEAM_PHILOSOPHIES[team.id] };
}

// EL MUNDIAL CASTIGA AL SIN IDEA (arco del Rebalance R3, decisión PO 22-jul-2026):
// en KO, el rival con MÁS nivel de identidad que yo amplifica su modo Mundial —
// +2% de poder por nivel de brecha, apilado sobre p.forma (canal de PODER: la
// lección de R2 es que los sesgos de pool miden ~0pp). El DT que llega a KO
// Consolidado es INMUNE por construcción — a la final no se llega improvisando;
// el que dispersó su Sesión Táctica entre 5 aristas paga la brecha. En grupos no
// existe (koRound 0). El dial declarado del sprint es ESTA constante.
export const IDENTITY_GAP_PCT = 0.04; // nació 0.02; el dial declarado de R3 (medido: 2% movía −1.8pp)
/** Multiplicador del castigo por brecha de identidad: ×1 en grupos o sin brecha;
 *  ×(1 + 0.04·brecha) con brecha = etapa rival (madurada por la ronda) − MI etapa.
 *  ETAPA vs etapa (T1): la escalera de 10 niveles no toca la brecha — cero
 *  recalibración del Rebalance. */
export function identityGapMult(oppTeam, myEtapa, koRound = 0) {
  if (!koRound) return 1;
  const gap = Math.max(0, rivalFiloLevel(oppTeam, koRound) - (myEtapa ?? 0));
  return 1 + IDENTITY_GAP_PCT * gap;
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
