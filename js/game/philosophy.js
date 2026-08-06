/* ============================================================
   game/philosophy — la identidad futbolística de la run
   (arco de Filosofía F1, decisiones PO 22-jul-2026).

   Posee `run.filoId` (la identidad que se JUEGA), `run.filoInicial`
   (la escuela de la que viene el DT, fija) y `run.filoXp` (las 4
   progresiones independientes). Reglas que viven acá:
   - nivel = f(XP de ESA filosofía) → FILO_LEVELS (1..10 c/u)
   - elección post-sorteo (gratis, antes del día 1) → 1 PI a gastar
     obligatoriamente en un rasgo básico de la escuela elegida
   - cambio de identidad: cuesta la Acción del Día y declara el
     Plan de Partido (×1.5 de XP para esa idea)
   - LA PROGRESIÓN (arco de Progresión, 28-jul-2026): toda la XP
     viene del PARTIDO (70% intención / 30% efectividad) y de los
     eventos; subir de nivel una filosofía paga XP al Director
     Técnico (game/coach), que paga Puntos de Identidad.

   La filosofía viaja al partido como la moral: matchCtx.filo =
   {id, nivel} (se arma en screens/match.js Y tests/smoke.js);
   el Match no conoce la run (ARQUITECTURA §3.2).
   ============================================================ */
import { getPhilosophy, PHILOSOPHIES, aristaById, filoPointsOf, filoLevelOf, filoEtapaOf, afinidadMult, FILO_LEVELS } from "../content/identity/philosophies.js";
import { ADVANCED_BY_FILO } from "../content/match/sequences.js";
import { TEAM_PHILOSOPHIES } from "../content/identity/team-philosophies.js";
import { teamRating } from "./ratings.js";
import { clamp } from "../core/math.js";
import { addJournal } from "./journal.js";
import { trackOxidacion } from "./oxidation.js";
import { activeTraitIds } from "./traits.js";
import { addCoachXp, filoLevelReward } from "./coach.js";
import { DEEP_TRAIT } from "../content/traits/index.js";

// EL PLAN DE PARTIDO (arco de Progresión, decisión PO 28-jul-2026): la vieja
// Sesión Táctica ya no regala progreso desde el menú — declara QUÉ FÚTBOL vas a
// intentar. Esa declaración vale ×PLAN_XP_MULT sobre toda la XP que ese partido
// genere para esa filosofía: el día invertido no compra puntos, compra INTENCIÓN.
export const PLAN_XP_MULT = 1.5;

/** XP acumulada de una filosofía de la run (la activa por defecto). */
export const filoPoints = filoPointsOf;

/** Índice del nivel actual en FILO_LEVELS (0..9 = nivel 1..10). */
export const filoLevel = filoLevelOf;

/** Etapa del nivel (0 Aprendiendo · 1 En desarrollo · 2 Consolidada) — la escala
 *  0-2 original de F1: el rival, la brecha R3 y los gates viven acá (T1). */
export const filoEtapa = filoEtapaOf;

/**
 * Multiplicadores de XP del partido, por filosofía: la AFINIDAD de tu escuela
 * (la filosofía INICIAL de la run) por el Plan de Partido si lo declaraste.
 * Los aplica el Match al acumular, así la barra que se ve crecer en vivo y la
 * que se acredita al cerrar son EL MISMO número.
 */
export function filoXpMults(run) {
  const out = {};
  for (const p of PHILOSOPHIES)
    out[p.id] = +(afinidadMult(run.filoInicial, p.id) * (run.planFilo === p.id ? PLAN_XP_MULT : 1)).toFixed(2);
  return out;
}

/** La filosofía para matchCtx: `{id, nivel, etapa, rasgos, xp, mult}` o null — la
 *  frontera run→Match, como la moral. `nivel` (0..9) sesga MI pool; `etapa` (0..2)
 *  es la escala de los gates (avanzada, brecha R3) y de todo lo que compara contra
 *  el rival; `rasgos` son los ids ACTIVOS del árbol (T1 — todos los comprados desde
 *  el arco de Progresión: las builds híbridas juegan de verdad); `xp`/`mult` son lo
 *  que el Match necesita para anunciar EN VIVO la subida de nivel sin conocer la run. */
export function filoCtx(run) {
  if (!run.filoId) return null;
  return {
    id: run.filoId, nivel: filoLevel(run), etapa: filoEtapa(run), rasgos: activeTraitIds(run),
    xp: { ...run.filoXp }, mult: filoXpMults(run), plan: run.planFilo || null,
  };
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
  // LA ESCUELA (arco de Progresión): la filosofía inicial no se vuelve a elegir —
  // es de dónde viene el DT, y de por vida decide a qué velocidad aprende cada
  // idea (afinidad). Cambiar de identidad cambia lo que JUEGAS, no de dónde vienes.
  run.filoInicial = f.id;
  run.filoNarrado = 0; // hito de nivel ya narrado (la CONQUISTA de M2 se cuenta una sola vez)
  const nombres = f.aristas.map(k => aristaById(k).label);
  addJournal(run, {
    icon: f.icon, tone: "gold", title: `El equipo abraza una identidad: ${f.name}`,
    desc: `${f.lema} El plan: jugar ${nombres.join(" y ")} hasta que ese fútbol salga solo.`,
  });
  // El PI inicial (GDD): elegir filosofía ES el nivel 1 del DT — el flujo de inicio
  // OBLIGA a gastarlo en uno de los 3 rasgos básicos de la escuela elegida.
  run.dtNivel = 1;
  run.identityPoints = (run.identityPoints || 0) + 1;
  return f;
}

/**
 * Cambio de filosofía a mitad de run: CUESTA la Acción del Día (decisión PO #1).
 * Desde el arco de la Progresión no hay nada que demoler — cada filosofía lleva su
 * propio nivel de XP y sus rasgos comprados siguen activos (build híbrida), así que
 * cambiar no hereda ni pierde: solo declara qué fútbol se va a jugar, y ese día
 * invertido vale como Plan de Partido (×1.5 de XP en el próximo partido).
 * Devuelve la filosofía nueva, o null si no hay acción pendiente, el id no existe
 * o es la actual (la UI no debería permitirlo).
 */
export function changePhilosophy(run, filoId) {
  const f = getPhilosophy(filoId);
  if (!f || !run.actionPending || f.id === run.filoId) return null;
  const prev = getPhilosophy(run.filoId);
  run.filoId = f.id;
  // El día invertido ES el Plan de Partido: la identidad nueva cobra el ×1.5 de XP
  // en el próximo partido (arco de Progresión — declarar cuesta y por eso paga).
  run.planFilo = f.id;
  // Cada filosofía tiene su propio nivel: la nueva NO hereda nada, ni pierde nada.
  // Sus rasgos comprados siguen ACTIVOS (builds híbridas, decisión PO 28-jul).
  run.filoNarrado = filoEtapa(run);
  run.actionPending = false;
  run.lastAction = { day: run.day, id: `filo_${f.id}`, group: null, icon: f.icon, title: `Cambio de identidad: ${f.name}` };
  addJournal(run, {
    icon: "🔄", tone: "neutral", title: `Golpe de timón: de ${prev ? prev.name : "la nada"} a ${f.name}`,
    desc: `El día entero se fue en reinstalar ideas. Lo aprendido no se borra —cada idea tiene su propio camino—, pero desde hoy el equipo juega ${f.aristas.map(k => aristaById(k).label).join(" y ")}.`,
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
  else {
    // T2 (migración F2): Consolidada ya no regala el efecto profundo — lo compra su
    // rasgo Intermediate. El diario celebra la ley y apunta al árbol (o celebra la
    // sinergia si el DT ya lo había comprado).
    const deep = DEEP_TRAIT[f.id];
    const owned = (run.rasgos?.[f.id] || []).includes(deep.id);
    addJournal(run, {
      icon: "⭐", tone: "gold", title: `La idea es LEY: ${f.name} consolidada`,
      desc: owned
        ? `${adv.icon} ${adv.name} domina el pool — y con ${deep.nombre} ya comprada, tu fútbol superior juega PROFUNDO.`
        : `${adv.icon} ${adv.name} domina el pool. Su profundidad no viene de regalo: ${deep.icon} ${deep.nombre} te espera en el árbol de rasgos.`,
    });
  }
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

// AL FAVORITO LE JUEGAN LA FINAL (29-jul-2026, el dial del techo): el espejo del de
// arriba. En KO, el rival al que le llevo VENTAJA de identidad también se agranda:
// nadie le juega igual al que llega con todo resuelto — te esperan diez atrás, te
// estudian, y sale el mejor partido de su torneo.
//
// Por qué hizo falta ESTE lever y no un dial global. Medido a n=4000 sobre BRA
// (techo `--smart` 48.5% · piso mixto azar 28.9%):
//   · afeitar los hooks del árbol un 30% → techo −1.9pp pero piso −2.1pp
//   · forma de torneo +3%→+4% por ronda  → techo −3.3pp pero piso −3.7pp
// Los dos hunden MÁS el piso que el techo, porque el mismo % de poder rival le cuesta
// más win-rate al que ya venía peor. Un dial global no puede bajar el techo: la única
// palanca que discrimina es la que se enciende PORQUE estoy fuerte.
// El castigo se mide en ETAPAS (0-2, escala del rival) y la ventaja en NIVELES (1-10,
// la escala fina de la Progresión). No es una inconsistencia: es lo único que funciona.
// La etapa no puede ver la ventaja — Consolidada exige nivel 10 y el DT óptimo promedia
// 7.9, así que en etapas está EMPATADO con medio mundo y `lead` no se enciende nunca
// (medido: +10%/etapa movió el techo −0.4pp). En niveles, 7.9 contra 5.7 sí se distingue.
export const IDENTITY_LEAD_PCT = 0.16;
/** El nivel equivalente de una etapa rival: el PRIMER nivel de esa etapa. Traduce la
 *  escala gruesa del rival a la fina del jugador para poder comparar ventaja.
 *  DERIVADO de FILO_LEVELS, no escrito a mano: si la escalera se recalibra, esto
 *  la sigue sola (misma indexación 0-9 que `filoLevel`). */
const NIVEL_DE_ETAPA = [0, 1, 2].map(e => FILO_LEVELS.findIndex(l => l.etapa === e));

/** Multiplicador de identidad del rival en KO. ×1 en grupos. Es SIMÉTRICO:
 *  - le llevo MENOS idea (`gap`, en etapas) → me pasa por encima (R3, "el Mundial
 *    castiga al sin idea")
 *  - le llevo MÁS idea (`lead`, en niveles) → le juegan la final de su vida
 *  Parejos, ×1: el partido de igual a igual es el único sin condimento. */
export function identityGapMult(oppTeam, myEtapa, koRound = 0, myNivel = null) {
  if (!koRound) return 1;
  const rivalEtapa = rivalFiloLevel(oppTeam, koRound);
  const gap = Math.max(0, rivalEtapa - (myEtapa ?? 0));
  const lead = myNivel == null ? 0 : Math.max(0, myNivel - NIVEL_DE_ETAPA[rivalEtapa]);
  return 1 + IDENTITY_GAP_PCT * gap + IDENTITY_LEAD_PCT * lead;
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
 * LA PROGRESIÓN DEL ARCO (la llama flow.postMatchUpdate, del lado run de la
 * frontera): acredita la XP que el Match repartió por filosofía (`match.filoXp`,
 * ya multiplicada por afinidad y Plan de Partido), resuelve las subidas de nivel
 * de cada una y convierte esas subidas en XP del Director Técnico — que a su vez
 * paga Puntos de Identidad. Se aprende el fútbol que se juega.
 *
 * Devuelve el parte para el post-partido:
 *   {filos: [{id, name, icon, xp, mult, antes, ahora, intentos, aciertos}], dt}
 * o null si el partido no dejó una sola jugada de identidad.
 */
export function applyFiloXp(run, match) {
  const ganada = match.filoXp || {};
  const filos = [];
  let dtXp = 0, subidas = [];
  run.filoXp = run.filoXp || {};
  for (const p of PHILOSOPHIES) {
    const xp = Math.round(ganada[p.id] || 0);
    if (!xp) continue;
    const antes = filoLevelOf(run, p.id);
    run.filoXp[p.id] = (run.filoXp[p.id] || 0) + xp;
    const ahora = filoLevelOf(run, p.id);
    for (let n = antes + 2; n <= ahora + 1; n++) { dtXp += filoLevelReward(n); subidas.push(`${p.name} ${n}`); }
    filos.push({
      id: p.id, name: p.name, icon: p.icon, xp, antes, ahora,
      mult: filoXpMults(run)[p.id],
      intentos: match.filoIntentos?.[p.id] || 0, aciertos: match.filoAciertos?.[p.id] || 0,
    });
  }
  if (!filos.length) return null;
  filos.sort((a, b) => b.xp - a.xp);
  const dt = dtXp ? addCoachXp(run, dtXp, subidas.length ? `${subidas.join(" · ")}.` : "") : null;
  return { filos, dt, dtXp };
}
