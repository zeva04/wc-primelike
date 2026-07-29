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
import { FIRMA_TYPE, FILO_LEVELS, FILO_ETAPAS, getPhilosophy, filoOfType, xpLevelOf, XP_INTENCION, XP_ACIERTO } from "../../content/philosophies.js";
import { rivalFilo } from "../philosophy.js";
import { buildActDecision } from "./sequence-acts.js";
import { hookOf, hasTrait, traitHooks, traitMoment } from "./trait-hooks.js";
import { pressOn, PRESS_POOL } from "./press.js";
import { noteCorner as noteCornerStat } from "./stats.js";
import { noteMomentum } from "./match-momentum.js";

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
 * Peso por la STAT que la jugada pide (Odisea, 2ª mitad). Un tipo puede declarar
 * `protStat`: el desborde por la banda lo corre el RÁPIDO, no un central que quedó
 * suelto. Cuadrático sobre 70 (la media del plantel): vel 95 pesa ×1.8, vel 55 ×0.6 —
 * inclina fuerte sin volverlo determinista (el segundo más rápido también juega).
 */
export function protStatW(type, p) {
  if (!type.protStat) return 1;
  const v = (p.stats[type.protStat] ?? 70) / 70;
  return v * v;
}

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
  const pase = st("pase_corto") * 0.6 + st("pase_largo") * 0.4;   // ODISEA: mezcla (ratings.PASE_MIX)
  return { atk: N(st("tiro")), def: N(st("defensa")), pase: N(pase), cab: N(st("cabezazo")), vel: N(st("velocidad")) };
}

/**
 * LOS MOMENTOS DEL PARTIDO (fix del PO 28-jul-2026): CUÁNDO sale cada secuencia, repartido.
 *
 * Antes se sorteaba tick a tick con una probabilidad sin memoria (`faltan / ticksQuedan`).
 * El NÚMERO por partido salía perfecto, pero los huecos eran exponenciales: medido en 300
 * partidos KOR vs ESP, mediana de **15 minutos** sin una sola jugada y p90 de **42**. Con
 * ticks de 5' eso no se veía (17 minutos eran ~2 segundos de reloj de pared); con el reloj
 * continuo son 34 segundos mirando correr el minutero, y el PO lo reportó como bug.
 *
 * Ahora los minutos se sortean UNA vez por fase: una VENTANA por secuencia y un minuto al
 * azar dentro de su ventana (con margen en los bordes para que no se peguen entre sí).
 * Misma cuenta por partido —el objetivo no se toca, el balance no se mueve—, sin sequías.
 * TODO lo que decide QUÉ secuencia sale (lado, tipo, protagonista, contexto A3/F2/T1/presión)
 * sigue pasando al DISPARARLA, no acá: esto solo reemplaza el "¿ahora?" del sorteo.
 */
function seqSlots(count, desde, hasta) {
  const L = (hasta - desde) / count;
  return Array.from({ length: count }, (_, i) => desde + L * (i + 0.15 + 0.7 * rnd()));
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
  m._seqPlan = { target, edge, prof: rivalProfile(m), oppFilo: rivalFilo(m.oppTeam, m.koRound), slots: seqSlots(target, 0, 90) };
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
    // El desborde (Odisea): la respuesta clásica al rival que se encierra — cuanto más
    // sólido y junto está el bloque rival, más sentido tiene ir por afuera. Cansado no
    // sale (el sprint es lo primero que se pierde) y perdiendo tarde se busca más.
    banda: (1.5 + 1.5 * prof.def) * (losingLate ? 1.4 : 1) * (tired ? 0.7 : 1) * brave,
    balon_parado: 1.5,
    caceria: 0, sinfonia: 0, contra_letal: 0,
  } : {
    repliegue: (2 + 3 * prof.atk) * (winningLate ? 1.4 : 1),
    salida_fondo: (0.8 + 2.5 * prof.def) * (tired ? 1.4 : 1),
    balon_parado_def: 0.8 + 1 * prof.cab,
    fortaleza: 0,
  };
  applyFiloWeights(m, side, w, plan.oppFilo);
  // EL BOTÓN DE PRESIÓN: mientras corre la ráfaga el partido GENERA otro fútbol —
  // se roba arriba mucho más y no se revienta la pelota. Va DESPUÉS de la filosofía
  // (mismo criterio que las avanzadas de M2: hereda matriz y firmas ya aplicadas).
  if (side === "mine" && pressOn(m)) for (const k of Object.keys(PRESS_POOL)) if (w[k] > 0) w[k] *= PRESS_POOL[k];
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

/** La FAMILIA de un tipo: la avanzada pertenece a su tipo base (cacería ES
 *  recuperación profunda). Los hooks de rasgos que no canibalizan la jugada
 *  avanzada matchean por familia (T1, hallazgo del gate: sin esto, el rasgo
 *  básico se apagaba justo cuando la identidad consolidaba y la avanzada
 *  desplazaba a su base — share 0.9). */
export const familyOf = type => ADV_SOURCE[type.id] || type.id;

function applyFiloWeights(m, side, w, oppFilo) {
  const filo = m.my.filo;
  // F1 — mi tipo firma pesa por mi nivel (llega por matchCtx, como la moral).
  // T1: nivel FINO (0..9, mult interpolado ×1.35→×2.10) — cada sesión táctica
  // se siente en el pool; el rival sigue en etapas (abajo).
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
  // T1/T3 — los RASGOS también sesgan el pool (Amplitud vs Bloque; Abrir la Lata y
  // La Invitación NEUTRALIZAN celdas — a tablas, jamás invertidas). Se APILAN
  // (Amplitud ×1.25 × Lata ×1.23 devuelve la celda 0.65 a ≈1.0), condicionales al
  // rival si el hook lo pide (vsFilo acepta id o lista).
  if (side === "mine") {
    for (const pm of traitHooks(m).poolMod || []) {
      if (pm.vsFilo && ![].concat(pm.vsFilo).includes(oppFilo?.id)) continue;
      for (const k of Object.keys(pm.weights)) if (w[k] !== undefined && w[k] > 0) w[k] *= pm.weights[k];
    }
  }
  // T3 — La Fortaleza neutraliza el SITIO: la celda opp bloque|posesion vuelve a
  // tablas (1.35 × 0.74 ≈ 1.0). Mismo mecanismo, lado rival.
  if (side === "opp") {
    for (const pm of traitHooks(m).oppPoolMod || []) {
      if (pm.vsFilo && ![].concat(pm.vsFilo).includes(oppFilo?.id)) continue;
      for (const k of Object.keys(pm.weights)) if (w[k] !== undefined && w[k] > 0) w[k] *= pm.weights[k];
    }
  }
  // T2 — Pelota Parada Ensayada: la jugada ensayada también sale MÁS seguido
  // (se apila sobre el ×1.3 incondicional del Bloque: su arma, más afilada).
  const sr = hookOf(m, "setpieceRehearsed");
  if (sr && side === "mine" && w.balon_parado > 0) w.balon_parado *= sr.poolMult;
  // F2 — la firma rival sesga SU lado, con su nivel como magnitud (escala de
  // ETAPAS: el rival no tiene escalera fina — sus mults F2 quedan exactos, T1).
  // T3 — Asfixia Total le pone BOZAL a esa firma: la identidad rival se expresa
  // mucho menos (×0.6 sobre su mult) — no ataca menos: renuncia a SU fútbol.
  if (oppFilo && side === "opp") {
    const t = RIVAL_FIRMA_OPP[oppFilo.id];
    const muzzle = hookOf(m, "muzzleOppFirma");
    if (t && w[t] !== undefined) w[t] *= (FILO_ETAPAS[oppFilo.nivel]?.mult || 1) * (muzzle ? muzzle.factor : 1);
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
  if (filo && filo.etapa >= 1) {
    const advId = ADVANCED_BY_FILO[filo.id]?.id;
    if (advId && w[advId] !== undefined) {
      const share = ADV_SHARE[Math.min(filo.etapa - 1, 1)];
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

/* filoRasgo() MURIÓ en T2 (migración F2, decisión PO #2): el efecto profundo que
   Consolidada regalaba automático ahora se COMPRA en el árbol — el gate es
   trait-hooks.hasTrait (gegenpressing · desesperantes · trampa_cerrada · duenos_area).
   Consolidada da su PI, el mult 2.1 y el share 0.9 de la avanzada — nada más. */

/* ============================================================
   LA EXPERIENCIA SE GANA EN LA CANCHA (arco de Progresión,
   28-jul-2026). Se aprende el fútbol que se juega: cada secuencia
   le da XP a LA FILOSOFÍA DUEÑA DE ESE TIPO (filoOfType), sea o no
   la que declaraste. El reparto del GDD:
     70% INTENCIÓN   — la jugada se propuso (noteFiloIntent)
     30% EFECTIVIDAD — el acto salió bien (noteFiloHit)
   La XP se acumula YA multiplicada por afinidad y Plan de Partido
   (m.my.filo.mult, que arma game/philosophy.filoXpMults): así la
   barra que se ve crecer en vivo y la que se acredita al cerrar
   son el mismo número, y el Match sigue sin conocer la run.
   ============================================================ */

/** Suma XP de identidad al Match y anuncia la SUBIDA DE NIVEL en vivo. */
function grantFiloXp(m, filoId, base, campo) {
  if (!filoId || !m.my.filo) return;
  const mult = m.my.filo.mult?.[filoId] ?? 1;
  const add = base * mult;
  if (!add) return;
  m.filoXp = m.filoXp || {};
  m[campo] = m[campo] || {};
  m[campo][filoId] = (m[campo][filoId] || 0) + 1;
  const antes = xpLevelOf((m.my.filo.xp?.[filoId] || 0) + (m.filoXp[filoId] || 0));
  m.filoXp[filoId] = (m.filoXp[filoId] || 0) + add;
  const ahora = xpLevelOf((m.my.filo.xp?.[filoId] || 0) + m.filoXp[filoId]);
  // SKILL-UP EN VIVO (decisión PO): el nivel sube EN el partido y el relato lo grita.
  if (ahora > antes) {
    const f = getPhilosophy(filoId);
    m.log("filo", `${f.icon} min ${m.clock()}' — ¡${f.name.toUpperCase()} NIVEL ${ahora + 1}! El equipo entendió algo jugando: esa idea ya se sabe mejor.`);
  }
}

/** La INTENCIÓN: el equipo propuso una jugada de ese fútbol (la llama el arranque
 *  de secuencia). Es el 70% de la XP — jugar tu idea vale aunque no salga. */
export function noteFiloIntent(m, type) {
  if (type?.side !== "mine" && !DEF_XP_TYPES.includes(type?.id)) return;
  grantFiloXp(m, filoOfType(type), XP_INTENCION, "filoIntentos");
}
// Las dos secuencias que enseñan defendiendo (son `side: "opp"` pero la identidad
// que se ejercita es MÍA: aguantar el bloque ES el fútbol del Bloque bajo).
const DEF_XP_TYPES = ["repliegue", "fortaleza"];

/**
 * La EFECTIVIDAD: un acto de la secuencia salió bien (lo cuentan sequence-acts) o
 * el gol la coronó (chances.goalMine). Es el 30% restante.
 */
export function noteFiloHit(m) {
  const s = m.seq;
  if (!s) return;
  grantFiloXp(m, filoOfType(s.type), XP_ACIERTO, "filoAciertos");
}

/**
 * ¿Arranca una secuencia en este tick? Cada secuencia tiene su MINUTO sorteado en el plan
 * (ventanas repartidas — ver seqSlots): arranca al pisarlo. Devuelve true (y deja
 * m.decision) si arrancó una. Todo el contexto —lado, tipo, protagonista— se decide acá,
 * en el momento, exactamente como antes.
 */
export function maybeStartSequence(m) {
  if (m.seq) return false; // ya hay una en curso (no debería: la decisión bloquea el tick)
  const plan = seqPlan(m);
  const done = m._seqCount || 0;
  // La PRÓRROGA es tiempo nuevo: se le sortean sus propios momentos, a prorrata de los 30'
  // que dura (un partido de 120' no puede quedarse con el cupo de uno de 90').
  if (m.phase === "extra" && !plan.extra) {
    plan.extra = Math.max(1, Math.round(plan.target / 3));
    plan.slots.push(...seqSlots(plan.extra, 90, 120));
    plan.target += plan.extra;
  }
  if (done >= plan.target) return false;
  if (m.min < plan.slots[done]) return false;
  const mentShift = m.my.mentalidad === "ofensiva" ? 0.10 : m.my.mentalidad === "defensiva" ? -0.10 : 0;
  // Contexto dinámico (A3): el partido inclina el reparto EN VIVO — perder tarde te vuelca
  // al ataque (+0.07, y te expones: el rival gana repliegues/contras), ganar tarde te
  // repliega (−0.05, el rival empuja), y cada expulsado inclina la cancha (±0.06).
  const late = m.min >= 75 ? (m.gMy < m.gOpp ? 0.07 : m.gMy > m.gOpp ? -0.05 : 0) : 0;
  const reds = 0.06 * (m.oppLineup.filter(p => p.expulsado).length - m.my.lineup.filter(p => p.expulsado).length);
  // F2: las identidades que esperan CEDEN iniciativa (mi Contra/Bloque; el rival igual)
  // T3: los MASTER inclinan el reparto de raíz — La Pelota es Nuestra estrangula al
  // rival por posesión (+0.06) y Contragolpe Total por MIEDO (+0.04: atacar contra
  // esa contra es regalarse — el rival se cuida). Suma de todos los shareShift.
  const traitShift = Object.values(traitHooks(m)).flat().reduce((s, h) => s + (h.shareShift || 0), 0);
  const mineShare = clamp(0.5 + plan.edge * 0.045 + mentShift + late + reds + filoShareShift(m.my.filo, plan.oppFilo) + traitShift, 0.3, 0.72);
  const side = rnd() < mineShare ? "mine" : "opp";
  // FRÍOS (Press, Master): el DT congeló el partido renunciando a un remate, y lo que
  // compró fue esto — la próxima llegada rival NO ocurre. Se descuenta del objetivo del
  // partido, no se pospone: si solo se retrasara, no habría comprado nada.
  if (side === "opp" && (m._frozen || 0) > 0) {
    m._frozen--;
    // Se descuenta el objetivo Y se consume su MOMENTO: sin sacarlo de la agenda, el
    // minuto ya vencido volvería a dispararse en el tick siguiente (y otra vez, y otra).
    plan.slots.splice(done, 1);
    plan.target = Math.max(done, plan.target - 1);
    m.log("plain", `min ${m.clock()}' — El equipo la hace circular sin apuro: ${m.oppTeam.name} no la ve pasar.`);
    return false;
  }
  const pool = SEQUENCE_TYPES.filter(t => t.side === side);
  const w = typeWeights(m, side, plan);
  startSequence(m, m._weightedPick(pool, pool.map(t => w[t.id] ?? 1)));
  return true;
}

/** Arranca una secuencia de un tipo dado: elige protagonista(s) y crea la decisión del acto 1. */
export function startSequence(m, type) {
  m._seqCount = (m._seqCount || 0) + 1;
  noteFiloIntent(m, type);   // la INTENCIÓN: proponer ese fútbol ya enseña (70% de la XP)
  m._lastSeqType = type.id; // memoria del contexto dinámico: no repetir tipo dos veces seguidas
  m._flow.push({ min: m.min, side: type.side, w: 3 }); // posesión/momentum derivados (A3, #11)
  m.stats.decisiones++;
  if (type.side === "mine") {
    const cands = m.activeMine().filter(p => p.pos !== "POR");
    // Momento → protagonista (decisión #15): ver protMomentum.
    const prot = m._weightedPick(cands, cands.map(p => (type.protWeight[playedPos(p)] ?? 1) * protMomentum(p) * protStatW(type, p)));
    m.seq = { type, prot, actIdx: 0, bonus: 0 };
    // El 4º compás de la sinfonía profunda: era el rasgo F2 de Posesión (Consolidada);
    // desde T2 lo COMPRA Sitio al Área (migración al árbol, decisión PO #2).
    if (type.id === "sinfonia" && hasTrait(m, "desesperantes")) m.seq.plan = ["build", ...type.plan];
    // T1 — hooks de ARRANQUE del árbol de rasgos: la secuencia puede nacer en su
    // variante del rasgo, con relato propio (el momento nombrable abre la jugada).
    // Ambos matchean por FAMILIA (gate T1: sin esto el básico moría al consolidar).
    // El salto de Tres Pases va al ACTO 1: en la transición base es el desenlace
    // (la contra a una), en el contragolpe letal conserva un tramo + definición —
    // acelera la avanzada sin canibalizar sus bonus de escalada.
    let traitIntro = null;
    const vd = hookOf(m, "variantDeep"); // Asfixia en Salida: el robo nace sobre el saque de meta
    if (vd && vd.of === familyOf(type) && rnd() < vd.p) {
      m.seq.bonus += vd.bonus;
      m.seq.deepVariant = true; // Arco a la Vista (T2) profundiza ESTE desenlace
      traitIntro = vd.intro;
    }
    // Variante condicional al RIVAL: la Salida Lavolpiana de Posesión la usa contra
    // el Press (el mediocampista que baja deja sobrando a la primera línea).
    const vs = hookOf(m, "variantSwitch");
    if (vs && vs.of === familyOf(type) && vs.vsFilo === seqPlan(m).oppFilo?.id && rnd() < vs.p) {
      m.seq.bonus += vs.bonus;
      traitIntro = vs.intro;
    }
    const sk = hookOf(m, "skipToFinish"); // Tres Pases o Nada: la contra se juega a una
    if (sk && sk.of === familyOf(type) && rnd() < sk.p) {
      m.seq.actIdx = 1;
      m.seq.bonus += sk.bonus;
      traitIntro = sk.intro;
      // El Primer Pase (T2): el salto gana calidad y SU voz (el pase que rompe la línea)
      const up = hookOf(m, "skipUpgrade");
      if (up) { m.seq.bonus += up.bonus; traitIntro = up.intro; }
    }
    // [RELATO CON IDENTIDAD] (F3): cuando la secuencia es MI tipo firma, la narra la
    // filosofía ("el pressing que entrenamos toda la semana") en vez del intro genérico.
    const filoIntros = m.my.filo && FIRMA_TYPE[m.my.filo.id] === type.id ? getPhilosophy(m.my.filo.id).firmaIntros : null;
    m.log("event", `${type.icon} min ${m.clock()}' — ${traitIntro ? traitIntro(prot) : filoIntros ? pick(filoIntros)(prot) : type.flavor.intro(prot)}`);
  } else {
    // El atacante rival: en un córner en contra manda su mejor cabeceador; si no, un DEL/MED.
    const alive = m.oppLineup.filter(p => !p.expulsado);
    // El balón parado en contra ES un córner (así lo narra el acto): al panel de stats.
    if (type.plan[0] === "defend_sp") { noteCornerStat(m, "opp"); noteMomentum(m, "corner", "opp"); }
    const shooter = type.plan[0] === "defend_sp"
      ? alive.filter(p => p.pos !== "POR").sort((a, b) => (b.stats.cabezazo || 0) - (a.stats.cabezazo || 0))[0] || pick(alive)
      : (() => { const s = alive.filter(p => p.pos === "DEL" || p.pos === "MED"); return s.length ? pick(s) : pick(alive); })();
    m.seq = { type, shooter, actIdx: 0, bonus: 0 };
    // La salida bajo presión además necesita MI protagonista: el que saca la pelota jugada
    // (el DEF de mejor pase; sin DEF en pie, el jugador de campo de mejor pase).
    if (type.plan[0] === "playout") {
      const defs = m.activeMine().filter(p => playedPos(p) === "DEF");
      const pool = defs.length ? defs : m.activeMine().filter(p => p.pos !== "POR");
      m.seq.prot = pool.sort((a, b) => (b.stats.pase_corto || 0) - (a.stats.pase_corto || 0))[0];
    }
    m.log("event", `${type.icon} min ${m.clock()}' — ${type.flavor.intro(m.oppTeam)}`);
    // T3 — el bozal de Asfixia Total se NARRA de vez en cuando: el rival con identidad
    // amordazada juega otro fútbol, y el relato lo dice (momento nombrable del rasgo).
    const muzzle = hookOf(m, "muzzleOppFirma");
    const oppFilo = m._seqPlan?.oppFilo;
    if (muzzle && oppFilo && RIVAL_FIRMA_OPP[oppFilo.id] && rnd() < 0.12) traitMoment(m, muzzle.traitId, [muzzle.texto]);
  }
  buildActDecision(m);
}
