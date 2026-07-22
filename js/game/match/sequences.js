/* ============================================================
   game/match/sequences — la máquina de Key Sequences (Bible §7).
   Opera sobre una instancia de Match, como chances/incidents.

   Una secuencia es una historia en miniatura de 1 a 3 actos
   (decisión PO): cada acto es una DECISIÓN del DT que se resuelve
   con Football Actions (actions.js). Al acertar, la jugada ESCALA
   al acto siguiente; al fallar, CIERRA (en A1 el fallo cierra; el
   fallo que encadena —rebote, pelota suelta— es A2). El último
   acto del plan es el desenlace (remate / atajada).

   Contrato §3.2 — la decisión `sequence`:
     - la crea startSequence/buildActDecision (setea m.decision)
     - la resuelve resolveSequenceAct (acá)
     - la rutea screens/match.js → match.resolveSequenceAct(key)
   Como cada acto es una decisión y tick() corta con decisión
   pendiente, la escalera multi-acto funciona sola en la UI y en
   el smoke sin tocar sus loops: resolver un acto puede dejar
   OTRA decisión (el acto siguiente) y ambos loops la reprocesan.

   Los ACTOS (constructores de decisión, resolución, escalada y
   el fallo que encadena) viven en sequence-acts.js desde A2
   (presupuesto de líneas §6). Acá vive la GENERACIÓN: qué
   secuencia sale, cuándo y con qué protagonista.

   GENERACIÓN (decisión PO): sobre la marcha, apuntando a un
   objetivo de 2-6 por partido modulado por la preparación (Bible:
   la preparación determina cuántas oportunidades recibes). Se
   decide por tick para que A3 pueda meter contexto (marcador,
   minuto, fatiga) sin reescribir esto.
   ============================================================ */
import { rnd, ri, pick } from "../../core/rng.js";
import { clamp } from "../../core/math.js";
import { playedPos } from "../ratings.js";
import { moraleBand } from "../morale.js";
import { SEQUENCE_TYPES, ADVANCED_BY_FILO } from "../../content/sequences.js";
import { FIRMA_TYPE, FILO_LEVELS, getPhilosophy } from "../../content/philosophies.js";
import { rivalFilo } from "../philosophy.js";
import { buildActDecision } from "./sequence-acts.js";

// Rango objetivo de secuencias por partido (Bible §7: "aproximadamente 2 a 6").
export const SEQ_MIN = 2, SEQ_MAX = 6;

/**
 * Factor de presencia por Momento (A3, decisión #15): el encendido (7) pide la pelota
 * (~1.36×), el apagado (1) se esconde (~0.64×). Pondera QUIÉN protagoniza — nunca toca una
 * probabilidad de éxito: el Momento ya escala stats por statAt (sería contarlo dos veces).
 * Lo usan startSequence y la conversión def→of de sequence-acts (el mismo pick).
 */
export function protMomentum(p) { return 1 + 0.12 * ((p.momento ?? 4) - 4); }

/**
 * Perfil del rival DERIVADO de sus stats (decisión PO A2, #14): sin datos nuevos, cada
 * dimensión se normaliza a 0..1 desde el promedio de sus jugadores de campo. Define qué
 * fútbol te genera (y contra qué fútbol atacas tú): atk = su peligro directo · def = su
 * solidez/intensidad (proxy de cuánto te presiona) · pase = su vocación de tener la pelota ·
 * cab = su juego aéreo. Cuando llegue Filosofía, su filosofía real reemplaza este proxy.
 */
function rivalProfile(m) {
  const field = m.oppLineup.filter(p => p.pos !== "POR");
  const st = k => field.reduce((s, p) => s + (p.stats[k] || 50), 0) / Math.max(1, field.length);
  const N = x => clamp((x - 58) / 28, 0, 1); // ~58 (genéricos débiles) → 0 · ~86 (élite) → 1
  return { atk: N(st("tiro")), def: N(st("defensa")), pase: N(st("pase")), cab: N(st("cabezazo")) };
}

/**
 * Objetivo de secuencias del partido, ventaja y perfil rival. Se calcula UNA vez por partido
 * (cacheado en m._seqPlan). El favorito bien preparado recibe más secuencias y más ofensivas;
 * el superado, menos y más defensivas — es el pago visible de prepararse (Bible §7).
 */
function seqPlan(m) {
  if (m._seqPlan) return m._seqPlan;
  const { mine, opp } = m.powers();
  const edge = (mine.atk - opp.atk) + (mine.def - opp.def); // ~[-6, 6]
  const target = clamp(Math.round(4 + edge * 0.32 + ri(-1, 1) * 0.5), SEQ_MIN, SEQ_MAX);
  // La identidad del RIVAL (F2, decisión PO #4): curada o derivada, es fija por
  // partido — se cachea con el plan. El proxy de stats (prof) queda como BASE:
  // la filosofía multiplica encima, no lo reemplaza (un bloque de élite sigue
  // siendo más sólido que un bloque débil).
  // R2: la identidad rival MADURA con la profundidad del torneo (desde cuartos +1 nivel)
  m._seqPlan = { target, edge, prof: rivalProfile(m), oppFilo: rivalFilo(m.oppTeam, m.koRound) };
  return m._seqPlan;
}

/**
 * Pesos de cada tipo dentro de su lado, desde el perfil rival y la MENTALIDAD (que es una
 * palanca viva: se leen en el momento de generar, no al inicio — cambiarla a mitad de
 * partido cambia el fútbol que sale, decisión PO A2 "sesgo perceptible").
 * Lado mine (mi ataque, contra SU perfil): un rival que ataca deja espacio a la contra; un
 * bloque sólido invita al juego directo y al balón parado; uno que quiere la pelota, a
 * presionarle la salida. Lado opp (su iniciativa): su ataque genera repliegues, su intensidad
 * te presiona la salida, su juego aéreo vive del córner.
 */
function typeWeights(m, side, plan) {
  const prof = plan.prof;
  const ment = m.my.mentalidad;
  // Contexto dinámico (A3, decisión #9): TODO se lee EN VIVO al generar, nunca se cachea
  // (seqPlan cachea target/edge/perfil; el partido —marcador, minuto, fatiga— cambia).
  const losingLate = m.min >= 75 && m.gMy < m.gOpp;   // perder tarde → fútbol directo
  const winningLate = m.min >= 75 && m.gMy > m.gOpp;  // ganar tarde → el rival te empuja
  const act = m.activeMine();
  const tired = act.reduce((s, p) => s + p.energia, 0) / Math.max(1, act.length) < 55;
  // [MORAL → OCASIONES] (A3, decisión #10): la Moral sesga el TIPO, nunca el número. Llega
  // por matchCtx (el Match no conoce la run). Extremos fuertes + leves: en las nubes el
  // equipo se anima (presiona y corre); por el suelo, se asusta (revienta, no presiona).
  const band = moraleBand(m.my.moral ?? 50).id;
  const brave = band === "nubes" ? 1.5 : band === "alta" ? 1.2 : 1;
  const scared = band === "suelo" ? 1.5 : band === "baja" ? 1.2 : 1;
  const noPress = band === "suelo" ? 0.6 : band === "baja" ? 0.8 : 1;
  // Las AVANZADAS (M2) arrancan en 0: el pool las contiene para todos, pero solo
  // applyFiloWeights les da peso — al dueño de la filosofía, desde nivel 1. Un 0
  // explícito, porque el pick usa `w[t.id] ?? 1`: sin esto jugarían gratis.
  const w = side === "mine" ? {
    circulacion: 3,
    transicion: (2.5 + 2 * prof.atk) * (losingLate ? 1.5 : 1) * brave,
    recuperacion: (2 + 1.5 * prof.pase) * (ment === "ofensiva" ? 1.6 : 1) * (tired ? 0.6 : 1) * brave * noPress,
    pelotazo: (1.3 + 1.8 * prof.def) * (ment === "defensiva" ? 1.5 : 1) * (losingLate ? 1.5 : 1) * (tired ? 1.4 : 1) * scared,
    balon_parado: 1.5,
    caceria: 0, sinfonia: 0, contra_letal: 0,
  } : {
    repliegue: (2 + 3 * prof.atk) * (winningLate ? 1.4 : 1),
    salida_fondo: (0.8 + 2.5 * prof.def) * (tired ? 1.4 : 1),
    balon_parado_def: 0.8 + 1 * prof.cab,
    fortaleza: 0,
  };
  applyFiloWeights(m, side, w, plan.oppFilo);
  // Memoria de secuencias: no repetir el mismo tipo dos veces seguidas (el partido varía).
  if (m._lastSeqType && w[m._lastSeqType] !== undefined) w[m._lastSeqType] = 0;
  return w;
}

/* [MATRIZ DE COUNTERS] (F2, decisión PO #7 — celdas aprobadas 22-jul): "mi filo|su filo"
   → multiplicadores sobre el pool del lado indicado. Direccionales del roadmap: mi Press
   brilla contra Posesión · mi Posesión se estrella contra Bloque (pelotazo forzado) · mi
   Contra vive del rival con iniciativa y muere contra el que también espera · mi Bloque
   sufre al que elabora (te sitian: más repliegues en tu área). */
const MATRIX = {
  mine: {
    "press|posesion": { recuperacion: 1.4 },
    "posesion|bloque": { circulacion: 0.65, pelotazo: 1.3 },
    "contra|press": { transicion: 1.35 }, "contra|posesion": { transicion: 1.35 },
    "contra|contra": { transicion: 0.6 }, "contra|bloque": { transicion: 0.6 },
  },
  opp: {
    "bloque|posesion": { repliegue: 1.35 },
  },
};
// La firma del RIVAL en el lado opp (su iniciativa, con SU nivel como magnitud): el que
// presiona te asfixia la salida; el que quiere la pelota te sitia. Contra y Bloque no
// suman tipos: CEDEN pelota (filoShareShift) — y el Bloque vive del córner (celda fija).
const RIVAL_FIRMA_OPP = { press: "salida_fondo", posesion: "repliegue" };

/**
 * Todo el sesgo de FILOSOFÍA sobre el pool en un solo lugar (F1 + F2; extraído para que
 * typeWeights no se vuelva sopa — riesgo registrado del arco): mi firma por nivel
 * (×1.35/×1.7/×2.1, F1) · la matriz de counters mía×rival · la firma rival por SU nivel.
 * Muta `w` in place. Todo se lee EN VIVO al generar (nada cacheado salvo oppFilo, fijo).
 */
// M2 — de qué tipo BASE se desprende cada avanzada (su peso es una fracción del de la
// familia, ya multiplicado por el nivel de la firma cuando es lado mine): a nivel 1 la
// avanzada asoma (×0.6 de su base), en Consolidada casi lo iguala (×0.9). La fortaleza
// vive del lado opp (nace del repliegue: el Bloque castiga desde su trinchera).
const ADV_SOURCE = { caceria: "recuperacion", sinfonia: "circulacion", contra_letal: "transicion", fortaleza: "repliegue" };
const ADV_SHARE = [0.6, 0.9]; // [nivel 1, nivel 2]

function applyFiloWeights(m, side, w, oppFilo) {
  const filo = m.my.filo;
  // F1 — mi tipo firma pesa por mi nivel (llega por matchCtx, como la moral)
  if (filo) {
    const t = FIRMA_TYPE[filo.id];
    if (w[t] !== undefined && w[t] > 0) w[t] *= FILO_LEVELS[filo.nivel]?.mult || 1;
  }
  // F2 — matriz de counters (solo si ambos tienen identidad; el rival siempre tiene)
  if (filo && oppFilo) {
    const cell = MATRIX[side][`${filo.id}|${oppFilo.id}`];
    if (cell) for (const k of Object.keys(cell)) { if (w[k] !== undefined) w[k] *= cell[k]; }
  }
  // F2 (ajuste PO tras el gate: el Bloque medía −5.5pp con puros palos) — el arma
  // propia del Bloque: el balón parado ES su gol (el scouting ya lo decía). No es
  // celda de matriz: es su fortaleza incondicional, como la firma.
  if (filo?.id === "bloque" && side === "mine") w.balon_parado *= 1.3;
  // F2 — la firma rival sesga SU lado, con su nivel como magnitud
  if (oppFilo && side === "opp") {
    const t = RIVAL_FIRMA_OPP[oppFilo.id];
    if (t && w[t] !== undefined) w[t] *= FILO_LEVELS[oppFilo.nivel]?.mult || 1;
    if (oppFilo.id === "bloque") { w.balon_parado_def *= 1.3; w.salida_fondo *= 0.6; }
  }
  // M2 — la secuencia AVANZADA de mi filosofía entra al pool desde En desarrollo
  // (nivel 1) y en Consolidada casi desplaza a su tipo base. REPARTE el peso de la
  // familia, no lo suma (medido: sumar inflaba el volumen de la familia y hundía a las
  // identidades cuyas jugadas cargan riesgo — Contra −5pp). VA AL FINAL a propósito:
  // la avanzada hereda TODO lo que la matriz y las firmas le hicieron a su familia —
  // si tu transición vale ×0.6 contra un bloque, tu Contragolpe letal también (medido:
  // repartir ANTES de la matriz dejaba al letal sobre-jugado justo en sus peores cruces).
  // Bible regla 3: la progresión desbloquea GENERACIÓN — la avanzada REEMPLAZA a tu
  // fútbol básico: quien no entrena su idea se queda en él.
  if (filo && filo.nivel >= 1) {
    const advId = ADVANCED_BY_FILO[filo.id]?.id;
    if (advId && w[advId] !== undefined) {
      const share = ADV_SHARE[Math.min(filo.nivel - 1, 1)];
      const src = ADV_SOURCE[advId];
      w[advId] = (w[src] || 1) * share;
      if (w[src]) w[src] *= 1 - share;
    }
  }
}

/**
 * Cuánto inclina la FILOSOFÍA el reparto de iniciativa (F2, costos de identidad):
 * mi Contra cede posesión (−0.05) y mi Bloque cede volumen ofensivo (−0.08 — era
 * −0.10, ajuste PO tras medir el gate: el Bloque cargaba −5.5pp de piso); el
 * rival que espera me la cede a mí (contra +0.04 · bloque +0.06). Posesión y
 * Press no tocan el reparto (sus costos son la matriz y la energía). Puro.
 */
export function filoShareShift(myFilo, oppFilo) {
  let d = 0;
  if (myFilo?.id === "contra") d -= 0.05;
  if (myFilo?.id === "bloque") d -= 0.08;
  if (oppFilo?.id === "contra") d += 0.04;
  if (oppFilo?.id === "bloque") d += 0.06;
  return d;
}

/** ¿Tengo el RASGO de esta filosofía activo? (F2: Consolidada = nivel 2, decisión PO #6). */
export function filoRasgo(m, filoId) {
  return m.my.filo?.id === filoId && m.my.filo.nivel >= 2;
}

/**
 * Acierto de un acto en una secuencia del TIPO FIRMA de mi filosofía (F1, "successful
 * execution" del Bible §5): lo cuentan sequence-acts (cada acto que progresa) y
 * chances.goalMine (el gol que corona). El contador vive en el Match; la conversión a
 * progreso de arista (con tope) la hace game/philosophy del lado run de la frontera.
 */
export function noteFiloHit(m) {
  const f = m.my.filo, s = m.seq;
  // La AVANZADA también es tu firma (M2): jugar tu fútbol superior consolida igual.
  if (f && s && (s.type.id === FIRMA_TYPE[f.id] || s.type.advFor === f.id)) m.filoHits = (m.filoHits || 0) + 1;
}

/**
 * ¿Arranca una secuencia en este tick? Sobre la marcha: la probabilidad reparte las
 * secuencias que faltan entre los ticks que quedan, así el partido tiende al objetivo sin
 * agolparlas. Devuelve true (y deja m.decision) si arrancó una.
 */
export function maybeStartSequence(m) {
  if (m.seq) return false; // ya hay una en curso (no debería: la decisión bloquea el tick)
  const plan = seqPlan(m);
  const done = m._seqCount || 0;
  if (done >= plan.target) return false;
  const end = m.phase === "extra" ? 120 : 90;
  const ticksLeft = Math.max(1, Math.ceil((end - m.min) / 5));
  const pStart = (plan.target - done) / ticksLeft;
  if (rnd() >= pStart) return false;
  const mentShift = m.my.mentalidad === "ofensiva" ? 0.10 : m.my.mentalidad === "defensiva" ? -0.10 : 0;
  // Contexto dinámico (A3): el partido inclina el reparto EN VIVO — perder tarde te vuelca
  // al ataque (+0.07, y te expones: el rival gana repliegues/contras), ganar tarde te
  // repliega (−0.05, el rival empuja), y cada expulsado inclina la cancha (±0.06).
  const late = m.min >= 75 ? (m.gMy < m.gOpp ? 0.07 : m.gMy > m.gOpp ? -0.05 : 0) : 0;
  const reds = 0.06 * (m.oppLineup.filter(p => p.expulsado).length - m.my.lineup.filter(p => p.expulsado).length);
  // F2: las identidades que esperan CEDEN iniciativa (mi Contra/Bloque; el rival igual)
  const mineShare = clamp(0.5 + plan.edge * 0.045 + mentShift + late + reds + filoShareShift(m.my.filo, plan.oppFilo), 0.3, 0.72);
  const side = rnd() < mineShare ? "mine" : "opp";
  const pool = SEQUENCE_TYPES.filter(t => t.side === side);
  const w = typeWeights(m, side, plan);
  startSequence(m, m._weightedPick(pool, pool.map(t => w[t.id] ?? 1)));
  return true;
}

/** Arranca una secuencia de un tipo dado: elige protagonista(s) y crea la decisión del acto 1. */
export function startSequence(m, type) {
  m._seqCount = (m._seqCount || 0) + 1;
  m._lastSeqType = type.id; // memoria del contexto dinámico: no repetir tipo dos veces seguidas
  m._flow.push({ min: m.min, side: type.side, w: 3 }); // posesión/momentum derivados (A3, #11)
  m.stats.decisiones++;
  if (type.side === "mine") {
    const cands = m.activeMine().filter(p => p.pos !== "POR");
    // Momento → protagonista (decisión #15): ver protMomentum.
    const prot = m._weightedPick(cands, cands.map(p => (type.protWeight[playedPos(p)] ?? 1) * protMomentum(p)));
    m.seq = { type, prot, actIdx: 0, bonus: 0 };
    // Los RASGOS de F2 se FUSIONARON en las secuencias avanzadas (M2, decisión PO):
    // Consolidada ya no bufea los tipos base — PROFUNDIZA tu avanzada. El único que
    // sigue usando el plan propio es la sinfonía profunda: 4º compás en Consolidada
    // (el viejo rasgo de Posesión, ahora dentro de SU fútbol).
    if (type.id === "sinfonia" && filoRasgo(m, "posesion")) m.seq.plan = ["build", ...type.plan];
    // [RELATO CON IDENTIDAD] (F3): cuando la secuencia es MI tipo firma, la narra la
    // filosofía ("el pressing que entrenamos toda la semana") en vez del intro genérico.
    const filoIntros = m.my.filo && FIRMA_TYPE[m.my.filo.id] === type.id ? getPhilosophy(m.my.filo.id).firmaIntros : null;
    m.log("event", `${type.icon} min ${m.min}' — ${filoIntros ? pick(filoIntros)(prot) : type.flavor.intro(prot)}`);
  } else {
    // El atacante rival: en un córner en contra manda su mejor cabeceador; si no, un DEL/MED.
    const alive = m.oppLineup.filter(p => !p.expulsado);
    const shooter = type.plan[0] === "defend_sp"
      ? alive.filter(p => p.pos !== "POR").sort((a, b) => (b.stats.cabezazo || 0) - (a.stats.cabezazo || 0))[0] || pick(alive)
      : (() => { const s = alive.filter(p => p.pos === "DEL" || p.pos === "MED"); return s.length ? pick(s) : pick(alive); })();
    m.seq = { type, shooter, actIdx: 0, bonus: 0 };
    // La salida bajo presión además necesita MI protagonista: el que saca la pelota jugada
    // (el DEF de mejor pase; sin DEF en pie, el jugador de campo de mejor pase).
    if (type.plan[0] === "playout") {
      const defs = m.activeMine().filter(p => playedPos(p) === "DEF");
      const pool = defs.length ? defs : m.activeMine().filter(p => p.pos !== "POR");
      m.seq.prot = pool.sort((a, b) => (b.stats.pase || 0) - (a.stats.pase || 0))[0];
    }
    m.log("event", `${type.icon} min ${m.min}' — ${type.flavor.intro(m.oppTeam)}`);
  }
  buildActDecision(m);
}
