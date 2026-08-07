/* La máquina de Key Sequences. Opera sobre una instancia de Match.

   Una secuencia es una historia en miniatura de 1 a 3 actos: cada acto es una
   DECISIÓN del DT que se resuelve con Football Actions (actions.js). Al acertar la
   jugada ESCALA al acto siguiente; al fallar CIERRA, o ENCADENA (rebote, pelota
   suelta). El último acto del plan es el desenlace: remate o atajada.

   Contrato de la decisión `sequence`:
     - la crea startSequence/buildActDecision (setea m.decision)
     - la resuelve resolveSequenceAct
     - la rutea screens/match.js → match.resolveSequenceAct(key)
   Como cada acto es una decisión y tick corta con decisión pendiente, la escalera
   multi-acto funciona sola en la UI y en el smoke sin tocar sus loops.

   Los ACTOS viven en sequence-acts.js. Acá vive la GENERACIÓN: qué secuencia sale,
   cuándo y con qué protagonista. */
import { rnd, ri, pick } from "../../core/rng.js";
import { clamp } from "../../core/math.js";
import { playedPos } from "../ratings.js";
import { moraleBand } from "../morale.js";
import { SEQUENCE_TYPES, ADVANCED_BY_FILO } from "../../content/match/sequences.js";
import { FIRMA_TYPE, FILO_LEVELS, FILO_ETAPAS, getPhilosophy, filoOfType, xpLevelOf, XP_INTENCION, XP_ACIERTO, counterEdge } from "../../content/identity/philosophies.js";
import { rivalFilo } from "../philosophy.js";
import { buildActDecision } from "./sequence-acts.js";
import { hookOf, hasTrait, traitHooks, traitMoment } from "./trait-hooks.js";
import { pressOn, PRESS_POOL } from "./press.js";
import { noteCorner as noteCornerStat } from "./stats.js";
import { setBall, myHeight, oppHeight, HEIGHT_DEFAULT, zoneWeight, originOf, attackWidth, defenseWidth } from "./field.js";
import { noteMomentum } from "./match-momentum.js";

/* DIAL: cuántas jugadas por partido. Con el reloj continuo (1 minuto cada 2 s) este
   número gobierna el ritmo de lo que el jugador VE: por debajo de 5 quedan huecos
   largos mirando correr el minutero. `seqSlots` reparte la cola; la media es esto. */
export const SEQ_MIN = 5, SEQ_MAX = 9;

/**
 * Factor de presencia por Momento: el encendido (7) pide la pelota (~1.36×), el
 * apagado (1) se esconde (~0.64×). Pondera QUIÉN protagoniza — nunca una probabilidad
 * de éxito: el Momento ya escala stats por statAt, y sería contarlo dos veces.
 */
export function protMomentum(p) { return 1 + 0.12 * ((p.momento ?? 4) - 4); }

/**
 * Peso por la STAT que la jugada pide. Un tipo puede declarar `protStat`: el desborde
 * por la banda lo corre el RÁPIDO, no un central que quedó suelto. Cuadrático sobre 70
 * (la media del plantel): vel 95 pesa ×1.8, vel 55 ×0.6 — inclina fuerte sin volverlo
 * determinista, el segundo más rápido también juega.
 */
export function protStatW(type, p) {
  if (!type.protStat) return 1;
  const v = (p.stats[type.protStat] ?? 70) / 70;
  return v * v;
}

/**
 * Perfil del rival DERIVADO de sus stats: cada dimensión se normaliza a 0..1 desde el
 * promedio de sus jugadores de campo. Define qué fútbol te genera y contra qué fútbol
 * atacás: atk = su peligro directo · def = su solidez (proxy de cuánto te presiona) ·
 * pase = su vocación de tener la pelota · cab = su juego aéreo. Es la BASE sobre la que
 * multiplica su filosofía real, no un reemplazo de ella.
 */
function rivalProfile(m) {
  const field = m.oppLineup.filter(p => p.pos !== "POR");
  const st = k => field.reduce((s, p) => s + (p.stats[k] || 50), 0) / Math.max(1, field.length);
  const N = x => clamp((x - 58) / 28, 0, 1); // ~58 (genéricos débiles) → 0 · ~86 (élite) → 1
  // "Vocación de tener la pelota" es `pase_corto`: quiere la pelota el que sabe tocarla,
  // no el que sabe lanzarla — el que vive del pase largo es justo el que NO la quiere.
  return { atk: N(st("tiro")), def: N(st("defensa")), pase: N(st("pase_corto")), cab: N(st("cabezazo")), vel: N(st("velocidad")) };
}

/**
 * LOS MOMENTOS DEL PARTIDO: cuándo sale cada secuencia, REPARTIDO.
 *
 * Los minutos se sortean una vez por fase, una VENTANA por secuencia (`abre` … `cierra`).
 * Sortear tick a tick con una probabilidad sin memoria da el número correcto por partido
 * pero huecos exponenciales — medido: mediana de 15 minutos sin una sola jugada, p90 de
 * 42. Con el reloj continuo eso son 30+ segundos mirando el minutero.
 *
 * Dentro de su ventana la jugada espera a que haya fútbol (`zonaViva`) y sale ahí; si el
 * partido se queda trabado en el medio, sale igual al vencer `cierra`. La geografía elige
 * CUÁL minuto de la ventana se usa, nunca CUÁNTAS jugadas hay: esa es ley del Territorio.
 *
 * Lo que decide QUÉ secuencia sale (lado, tipo, protagonista, contexto) pasa al
 * DISPARARLA, no acá: esto solo responde "¿ahora?".
 */
const ANTICIPO = 0.40;   // cuánto se abre la ventana antes de su vencimiento, en fracción de L

function seqSlots(count, desde, hasta) {
  const L = (hasta - desde) / count;
  // El jitter es [0.30, 0.85] de cada tramo: deja 0.45·L de separación mínima entre dos
  // vencimientos, o sea MÁS que el ANTICIPO — así una ventana nunca abre antes de que la
  // anterior haya vencido y dos jugadas no pueden pisarse.
  return Array.from({ length: count }, (_, i) => {
    const cierra = desde + L * (i + 0.30 + 0.55 * rnd());
    return { abre: cierra - L * ANTICIPO, cierra };
  });
}

/** ¿Hay fútbol AHORA? La pelota fuera del mediocampo: alguien ataca o defiende de
 *  verdad. Pasa el ~35% de los minutos, así que es una puerta real y no un pase libre.
 *  No gasta azar: lee el territorio, que es determinista. */
const zonaViva = m => (m.field?.v ?? 3) !== 3;

/**
 * Objetivo de secuencias del partido, ventaja y perfil rival. Se calcula UNA vez por partido
 * (cacheado en m._seqPlan). El favorito bien preparado recibe más secuencias y más ofensivas;
 * el superado, menos y más defensivas — es el pago visible de prepararse.
 */
function seqPlan(m) {
  if (m._seqPlan) return m._seqPlan;
  const { mine, opp } = m.powers();
  const edge = (mine.atk - opp.atk) + (mine.def - opp.def); // ~[-6, 6]
  // La BASE y la PENDIENTE del edge son diales separados: subir la base da más jugadas a
  // los dos por igual, subir la pendiente se las da al favorito. Moverlos juntos fue el
  // error medido una vez (+8pp al favorito) — si se toca la densidad, tocar solo la base.
  const target = clamp(Math.round(7 + edge * 0.32 + ri(-1, 1) * 0.5), SEQ_MIN, SEQ_MAX);
  // La identidad del rival es fija por partido y madura con la profundidad del torneo.
  m._seqPlan = { target, edge, prof: rivalProfile(m), oppFilo: rivalFilo(m.oppTeam, m.koRound), slots: seqSlots(target, 0, 90) };
  return m._seqPlan;
}

/**
 * Pesos de cada tipo dentro de su lado, desde el perfil rival y la MENTALIDAD. Todo se lee
 * EN VIVO al generar: cambiar la mentalidad a mitad de partido cambia el fútbol que sale.
 *
 * Lado mine (mi ataque contra SU perfil): un rival que ataca deja espacio a la contra; un
 * bloque sólido invita al juego directo y al balón parado; uno que quiere la pelota, a
 * presionarle la salida. Lado opp (su iniciativa): su ataque genera repliegues, su
 * intensidad te presiona la salida, su juego aéreo vive del córner.
 */
function typeWeights(m, side, plan) {
  const prof = plan.prof;
  const ment = m.my.mentalidad;
  // Contexto dinámico: nunca se cachea. seqPlan cachea target/edge/perfil; el partido
  // —marcador, minuto, fatiga— cambia y se lee al momento de generar.
  const losingLate = m.min >= 75 && m.gMy < m.gOpp;   // perder tarde → fútbol directo
  const winningLate = m.min >= 75 && m.gMy > m.gOpp;  // ganar tarde → el rival te empuja
  const act = m.activeMine();
  const tired = act.reduce((s, p) => s + p.energia, 0) / Math.max(1, act.length) < 55;
  // [MORAL → OCASIONES]: la Moral sesga el TIPO, nunca el número. En las nubes el equipo
  // se anima (presiona y corre); por el suelo se asusta (revienta y no presiona).
  const band = moraleBand(m.my.moral ?? 50).id;
  const brave = band === "nubes" ? 1.5 : band === "alta" ? 1.2 : 1;
  const scared = band === "suelo" ? 1.5 : band === "baja" ? 1.2 : 1;
  const noPress = band === "suelo" ? 0.6 : band === "baja" ? 0.8 : 1;
  // Las AVANZADAS arrancan en 0: el pool las contiene para todos, pero solo
  // applyFiloWeights les da peso, al dueño de la filosofía. El 0 es explícito porque el
  // pick usa `w[t.id] ?? 1`: sin esto jugarían gratis.
  const w = side === "mine" ? {
    circulacion: 3,
    transicion: (2.5 + 2 * prof.atk) * (losingLate ? 1.5 : 1) * brave,
    recuperacion: (2 + 1.5 * prof.pase) * (ment === "ofensiva" ? 1.6 : 1) * (tired ? 0.6 : 1) * brave * noPress,
    pelotazo: (1.3 + 1.8 * prof.def) * (ment === "defensiva" ? 1.5 : 1) * (losingLate ? 1.5 : 1) * (tired ? 1.4 : 1) * scared,
    // El desborde: la respuesta clásica al que se encierra — cuanto más sólido y junto
    // el bloque rival, más sentido tiene ir por afuera. Cansado no sale (el sprint es lo
    // primero que se pierde) y perdiendo tarde se busca más. Busca la ESPALDA LENTA: el
    // término va CENTRADO en 1.0 para que discrimine por rival sin salir más seguido.
    banda: (1.0 + 1.5 * prof.def + 1.0 * (1 - prof.vel)) * (losingLate ? 1.4 : 1) * (tired ? 0.7 : 1) * brave,
    balon_parado: 1.5,
    // La salida desde el área no lleva multiplicador de contexto: su gate es GEOGRÁFICO,
    // solo aparece con la pelota en mi fondo (el bloque bajo la ve mucho; el alto casi no).
    salida_corta: 2.2,
    // La espalda sí lee al rival: es la respuesta al bloque adelantado, y contra un equipo
    // metido atrás prácticamente no existe — no hay espalda que atacar.
    espalda: Math.max(0.3, 1 + 0.55 * (oppHeight(m) - HEIGHT_DEFAULT)) * 1.4 * (losingLate ? 1.3 : 1),
    // EL CAMBIO DE FRENTE: la respuesta al bloque JUNTO — cuanto más amontonado el rival,
    // más sentido tiene mandarla al otro carril. La amplitud lo gatea en widthWeights:
    // sin nadie del otro lado, no hay a quién cambiarle el frente.
    cambio_frente: (0.9 + 1.1 * prof.def) * (tired ? 0.8 : 1),
    caceria: 0, sinfonia: 0, contra_letal: 0,
  } : {
    repliegue: (2 + 3 * prof.atk) * (winningLate ? 1.4 : 1),
    salida_fondo: (0.8 + 2.5 * prof.def) * (tired ? 1.4 : 1),
    balon_parado_def: 0.8 + 1 * prof.cab,
    fortaleza: 0,
  };
  heightWeights(m, side, w);
  widthWeights(m, side, w);
  applyFiloWeights(m, side, w, plan.oppFilo);
  // EL BOTÓN DE PRESIÓN: mientras corre la ráfaga el partido GENERA otro fútbol — se roba
  // arriba mucho más y no se revienta la pelota. Va DESPUÉS de la filosofía, para heredar
  // la matriz y las firmas ya aplicadas.
  if (side === "mine" && pressOn(m)) for (const k of Object.keys(PRESS_POOL)) if (w[k] > 0) w[k] *= PRESS_POOL[k];
  // Memoria de secuencias: no repetir el mismo tipo dos veces seguidas (el partido varía).
  if (m._lastSeqType && w[m._lastSeqType] !== undefined) w[m._lastSeqType] = 0;
  return w;
}

/* ── [LA ALTURA DEL BLOQUE → EL POOL] ─────────────────────────────────────────
   El DT decide DÓNDE se juega y eso decide QUÉ jugadas existen. Nunca CUÁNTAS ni con
   qué probabilidad de gol: el territorio no puede ser un modificador de poder
   escondido, misma ley que la Filosofía.

   Todo vale ×1 con el bloque MEDIO — es el punto neutro del dial, y por eso la línea
   base calibrada del juego no se mueve por el solo hecho de que la palanca exista.

   El fútbol que codifica: arriba se roba arriba y no se revienta la pelota; abajo se
   revienta y se sale de contra. La ESPALDA es simétrica: mi contra vive del bloque
   rival adelantado, y mi bloque adelantado le regala ese mismo fútbol a él (lo cobra
   `field.backlineRisk`). */
const famOf = id => ADV_SOURCE[id] || id;
const mulFam = (w, fam, f) => { for (const k of Object.keys(w)) if (famOf(k) === fam && w[k] > 0) w[k] *= f; };

function heightWeights(m, side, w) {
  const a = myHeight(m) - HEIGHT_DEFAULT;    // −2..+2 — mi bloque
  const o = oppHeight(m) - HEIGHT_DEFAULT;   // −2..+2 — el suyo (la IA juega su idea)
  if (side === "mine") {
    mulFam(w, "recuperacion", 1 + 0.28 * a);
    mulFam(w, "pelotazo", 1 - 0.20 * a);
    mulFam(w, "transicion", (1 - 0.10 * a) * (1 + 0.18 * o));
    // El bloque rival ROTA el pool, no lo encoge: lo que la contra pierde contra un equipo
    // que espera lo ganan las dos respuestas clásicas al bloque bajo, circular con
    // paciencia e ir por afuera. Sin la rotación la altura rival mueve la línea base sin
    // que el DT toque nada (medido: −2.8pp al favorito con mi bloque en medio).
    mulFam(w, "circulacion", (1 + 0.06 * a) * (1 - 0.10 * o));
    if (w.banda) w.banda *= 1 - 0.10 * o;
  } else {
    mulFam(w, "salida_fondo", 1 + 0.25 * o); // su bloque alto me asfixia la salida
    mulFam(w, "repliegue", 1 + 0.10 * a);    // yo muy alto: cuando llegan, llegan de verdad
  }
}

/**
 * Los pesos del pool tal como los ve el generador AHORA, sin sortear nada: el mismo
 * cálculo que usa `maybeStartSequence`. Existe para poder LEER el sesgo (tests del
 * territorio) sin tener que muestrear diez mil partidos para inferirlo.
 */
export const typeWeightsFor = (m, side) => typeWeights(m, side, seqPlan(m));

/**
 * [LA AMPLITUD → EL POOL]: una línea de TRES ocupa los tres carriles y una de UNO solo el
 * centro, así que el dibujo decide cuánto fútbol por afuera existe. Neutro (×1) en las
 * líneas de DOS, el punto medio del dial — igual que el bloque medio en la altura.
 */
function widthWeights(m, side, w) {
  if (side !== "mine") return;
  const a = attackWidth(m);            // −1 (todo por el medio) … +1 (los tres carriles)
  mulFam(w, "banda", 1 + 0.35 * a);
  mulFam(w, "cambio_frente", 1 + 0.60 * a);   // ES la jugada del ancho
  // ROTA la mezcla en vez de inflarla: un dial de contexto que solo SUBE una familia
  // diluye a todas las demás y termina castigando al dibujo que venía a premiar. El que
  // no tiene a nadie por afuera ataca por dentro: más circulación, pelotazo y espalda.
  mulFam(w, "circulacion", 1 - 0.12 * a);
  mulFam(w, "pelotazo", 1 - 0.10 * a);
  mulFam(w, "espalda", 1 - 0.10 * a);
}

/* La amplitud DEFENSIVA no toca el pool: se expresa donde está el fútbol —cortar por
   afuera y el remate que nace de una banda cubierta, en sequence-acts—. Tocar el pool
   rival es un canal escondido: bajarle peso al repliegue le sube la cuota a la salida
   asfixiada y al córner en contra, que son PEORES para mí (medido: −3.6pp al 3-1-1). */

/**
 * Cuánto inclina la ALTURA el reparto de iniciativa: el que vive arriba tiene la
 * pelota más cerca del arco rival y más seguido; el que se mete atrás se la cede.
 * Mismo canal (y mismo orden de magnitud) que la mentalidad y la filosofía.
 */
export const heightShareShift = m => 0.045 * (myHeight(m) - HEIGHT_DEFAULT) - 0.02 * (oppHeight(m) - HEIGHT_DEFAULT);

/* [MATRIZ DE COUNTERS] — el CICLO, contado en fútbol.

   La LEY vive en content/identity/philosophies.COUNTER_CYCLE (Press > Posesión >
   Bloque > Contra > Press). Esta tabla NO decide quién le gana a quién: solo cuenta,
   en tipos de jugada, lo que el ciclo ya decidió. `philosophy.test` verifica celda por
   celda que su dirección coincida con `counterEdge`, así la prosa y los números no
   pueden divergir de la ley.

   El patrón es uno solo: en cada arista A > B la FIRMA de A se agranda contra B
   (×1.35/1.40) y la FIRMA de B se achica contra A (×0.72 ≈ 1/1.35, para que el pool se
   conserve). Los neutros del ciclo —Press↔Bloque y Posesión↔Contra— no tienen celda:
   la ausencia dice algo, no es un hueco.

   OJO CON EL CANAL: esta matriz mueve el share de tipos hasta ×2 y el win% 0.0pp
. Es el NARRADOR del ciclo — cambia qué fútbol sale, que es lo
   que se le pide a una filosofía. Los DIENTES viven en `filoShareShift`. */
const MATRIX = {
  mine: {
    // Press > Posesión — su salida es mi festín; y sin nadie a quien cazar, mi presión
    // corre al vacío contra el que espera.
    "press|posesion": { recuperacion: 1.4 },
    "press|contra": { recuperacion: 0.72 },
    // Posesión > Bloque — la paciencia rompe la muralla.
    "posesion|bloque": { circulacion: 1.35 },
    "posesion|press": { circulacion: 0.72 },
    // Bloque > Contra — el duelo directo contra el que también espera lo gana el que
    // no necesita la pelota; y mi pelotazo muere contra el que no me la devuelve.
    "bloque|contra": { pelotazo: 1.35 },
    "bloque|posesion": { pelotazo: 0.72 },
    // Contra > Press — el que se adelanta me deja la espalda; el que se encierra la tapa.
    "contra|press": { transicion: 1.35 },
    "contra|bloque": { transicion: 0.6 },
    // ESPEJO, no ciclo: dos que esperan hacen un partido muerto. Fuera de la ley del
    // ciclo a propósito (`counterEdge` da 0 acá) — es sabor, y El Anzuelo lo neutraliza.
    "contra|contra": { transicion: 0.6 },
  },
  opp: {
    // La otra silla de Posesión > Bloque: me sitian, más repliegues en mi área. Su
    // neutralizador es La Fortaleza Inexpugnable.
    "bloque|posesion": { repliegue: 1.35 },
  },
};
/** La celda del cruce, o null. EXPUESTA para que los tests verifiquen que su dirección
 *  coincide con `counterEdge` y que los rasgos neutralizadores devuelven a tablas la
 *  celda REAL y no una copia. */
export const counterCell = (side, myId, oppId) => MATRIX[side]?.[`${myId}|${oppId}`] || null;
/** Todos los cruces declarados, como [side, miFilo, suFilo, pesos]. Solo para tests. */
export const counterCells = () => Object.entries(MATRIX).flatMap(([side, cells]) =>
  Object.entries(cells).map(([k, w]) => [side, ...k.split("|"), w]));

// La firma del RIVAL en el lado opp (su iniciativa, con SU nivel como magnitud): el que
// presiona te asfixia la salida; el que quiere la pelota te sitia. Contra y Bloque no
// suman tipos: CEDEN pelota (filoShareShift) — y el Bloque vive del córner (celda fija).
const RIVAL_FIRMA_OPP = { press: "salida_fondo", posesion: "repliegue" };

/**
 * Todo el sesgo de FILOSOFÍA sobre el pool en un solo lugar: mi firma por nivel · la
 * matriz de counters mía×rival · la firma rival por SU nivel. Muta `w` in place y se lee
 * EN VIVO al generar (nada cacheado salvo oppFilo, que es fijo por partido).
 */
// De qué tipo BASE se desprende cada avanzada: su peso es una FRACCIÓN del de su familia
// — a nivel 1 asoma (×0.6), en Consolidada casi la iguala (×0.9). La fortaleza vive del
// lado opp: el Bloque castiga desde su trinchera.
const ADV_SOURCE = { caceria: "recuperacion", sinfonia: "circulacion", contra_letal: "transicion", fortaleza: "repliegue" };
const ADV_SHARE = [0.6, 0.9]; // [nivel 1, nivel 2]

/** El plan de actos de un TIPO (sin instancia de secuencia): lo necesita el arranque
 *  para saltar al último acto (Sin Escalas) antes de que exista `m.seq.plan`. */
const planOfType = type => type.plan;

/** La FAMILIA de un tipo: la avanzada pertenece a su tipo base (cacería ES recuperación
 *  profunda). Los hooks de rasgos matchean por familia — si matchearan por id, el rasgo
 *  básico se apagaría justo al consolidar, cuando la avanzada desplaza a su base. */
export const familyOf = type => ADV_SOURCE[type.id] || type.id;

function applyFiloWeights(m, side, w, oppFilo) {
  const filo = m.my.filo;
  // Mi tipo firma pesa por mi nivel, fino (0..9, mult interpolado ×1.35→×2.10): cada
  // nivel se siente en el pool. El rival usa la escala de ETAPAS (más abajo).
  if (filo) {
    const t = FIRMA_TYPE[filo.id];
    if (w[t] !== undefined && w[t] > 0) w[t] *= FILO_LEVELS[filo.nivel]?.mult || 1;
  }
  // Matriz de counters (solo si ambos tienen identidad; el rival siempre tiene)
  if (filo && oppFilo) {
    const cell = MATRIX[side][`${filo.id}|${oppFilo.id}`];
    if (cell) for (const k of Object.keys(cell)) { if (w[k] !== undefined) w[k] *= cell[k]; }
  }
  // El arma propia del Bloque: el balón parado ES su gol. No es celda de matriz — es su
  // fortaleza incondicional, como la firma.
  if (filo?.id === "bloque" && side === "mine") w.balon_parado *= 1.3;
  // Los RASGOS también sesgan el pool, y algunos NEUTRALIZAN celdas de la matriz — a
  // tablas, jamás invertidas. Se APILAN, y son condicionales al rival si el hook lo pide
  // (vsFilo acepta un id o una lista).
  if (side === "mine") {
    for (const pm of traitHooks(m).poolMod || []) {
      if (pm.vsFilo && ![].concat(pm.vsFilo).includes(oppFilo?.id)) continue;
      for (const k of Object.keys(pm.weights)) if (w[k] !== undefined && w[k] > 0) w[k] *= pm.weights[k];
    }
  }
  // La Fortaleza neutraliza el SITIO: la celda opp bloque|posesion vuelve a tablas
  // (1.35 × 0.74 ≈ 1.0). Mismo mecanismo, lado rival.
  if (side === "opp") {
    for (const pm of traitHooks(m).oppPoolMod || []) {
      if (pm.vsFilo && ![].concat(pm.vsFilo).includes(oppFilo?.id)) continue;
      for (const k of Object.keys(pm.weights)) if (w[k] !== undefined && w[k] > 0) w[k] *= pm.weights[k];
    }
  }
  // Pelota Parada Ensayada: la jugada ensayada sale más seguido (se apila sobre el ×1.3
  // incondicional del Bloque: su arma, más afilada).
  const sr = hookOf(m, "setpieceRehearsed");
  if (sr && side === "mine" && w.balon_parado > 0) w.balon_parado *= sr.poolMult;
  // La firma rival sesga SU lado, con su nivel como magnitud (escala de ETAPAS: el rival
  // no tiene escalera fina). Asfixia Total le pone BOZAL: la identidad rival se expresa
  // mucho menos — no ataca menos, renuncia a SU fútbol.
  if (oppFilo && side === "opp") {
    const t = RIVAL_FIRMA_OPP[oppFilo.id];
    const muzzle = hookOf(m, "muzzleOppFirma");
    if (t && w[t] !== undefined) w[t] *= (FILO_ETAPAS[oppFilo.nivel]?.mult || 1) * (muzzle ? muzzle.factor : 1);
    if (oppFilo.id === "bloque") { w.balon_parado_def *= 1.3; w.salida_fondo *= 0.6; }
  }
  // La secuencia AVANZADA de mi filosofía entra al pool desde En desarrollo y en
  // Consolidada casi desplaza a su tipo base: la progresión desbloquea GENERACIÓN.
  //
  // REPARTE el peso de la familia, no lo suma — sumarlo infla el volumen de la familia y
  // hunde a las identidades cuyas jugadas cargan riesgo (medido: Contra −5pp). Y va AL
  // FINAL para que herede lo que la matriz y las firmas le hicieron a su familia: si tu
  // transición vale ×0.6 contra un bloque, tu Contragolpe Letal también.
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

/* EL DIENTE DEL CICLO: el ciclo de counters muerde ACÁ, en el reparto de iniciativa, y
   no en la matriz de pool.

   Es la lección más cara del proyecto y conviene no volver a pagarla: los sesgos de POOL
   miden ~0pp de win%. Medido con plantel fijo, n=2000 por celda — la matriz movía el
   share de tipos hasta ×2 (Contra pasaba de 27.4% de transiciones a 13.5%) y el residuo
   de interacción del resultado fue 0.65pp contra un error estándar de 1.02pp: cero.

   El canal de POSESIÓN sí muerde: ~0.8pp de win% por 0.01 de share. Y es VISIBLE por
   construcción — la posesión se ve en las estadísticas y se siente en cuántas jugadas
   propone cada uno, sin necesidad de una línea de UI que lo explique. */
export const CICLO_SHARE = 0.05;

/**
 * Cuánto inclina la FILOSOFÍA el reparto de iniciativa. Puro. Dos sumandos:
 *
 * 1. COSTOS DE IDENTIDAD: mi Bloque cede volumen ofensivo (−0.08) y el rival que espera
 *    me cede a mí (contra +0.04 · bloque +0.06). Son de la IDENTIDAD y no del cruce: se
 *    pagan contra todos. Solo el Bloque paga costo propio — su formación 3-1-1 se lo
 *    compensa; cobrárselo también al Contra lo hundía a la peor identidad de las cuatro,
 *    porque el costo se apilaba con el diente en el MISMO canal y lo anulaba.
 *
 * 2. EL CICLO: ±CICLO_SHARE según `counterEdge`. Es de suma cero por construcción
 *    —`mineShare` es un solo número—, así que el ciclo no puede inflar el partido: solo
 *    decide de quién es la pelota.
 */
export function filoShareShift(myFilo, oppFilo) {
  let d = 0;
  if (myFilo?.id === "bloque") d -= 0.08;
  if (oppFilo?.id === "contra") d += 0.04;
  if (oppFilo?.id === "bloque") d += 0.06;
  return d + CICLO_SHARE * counterEdge(myFilo?.id, oppFilo?.id);
}

/* LA EXPERIENCIA SE GANA EN LA CANCHA: se aprende el fútbol que se juega. Cada
   secuencia le da XP a LA FILOSOFÍA DUEÑA DE ESE TIPO (filoOfType), sea o no la que
   declaraste. El reparto:
     70% INTENCIÓN   — la jugada se propuso (noteFiloIntent)
     30% EFECTIVIDAD — el acto salió bien (noteFiloHit)
   Se acumula YA multiplicada por afinidad y Plan de Partido (m.my.filo.mult, que arma
   game/philosophy.filoXpMults): la barra que crece en vivo y la que se acredita al
   cerrar son el mismo número, y el Match sigue sin conocer la run. */

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
  // SKILL-UP EN VIVO: el nivel sube DENTRO del partido y el relato lo grita.
  if (ahora > antes) {
    const f = getPhilosophy(filoId);
    m.log("filo", `${f.icon} min ${m.clock()}' — ¡${f.name.toUpperCase()} NIVEL ${ahora + 1}! El equipo entendió algo jugando: esa idea ya se sabe mejor.`);
  }
}

/** La INTENCIÓN: el equipo propuso una jugada de ese fútbol. Es el 70% de la XP —
 *  jugar tu idea vale aunque no salga. */
export function noteFiloIntent(m, type) {
  if (type?.side !== "mine" && !DEF_XP_TYPES.includes(type?.id)) return;
  grantFiloXp(m, filoOfType(type), XP_INTENCION, "filoIntentos");
}
// Las dos secuencias que enseñan defendiendo (son `side: "opp"` pero la identidad
// que se ejercita es MÍA: aguantar el bloque ES el fútbol del Bloque bajo).
const DEF_XP_TYPES = ["repliegue", "fortaleza"];

/** La EFECTIVIDAD: un acto salió bien (lo cuentan sequence-acts) o el gol la coronó.
 *  Es el 30% restante. */
export function noteFiloHit(m) {
  const s = m.seq;
  if (!s) return;
  grantFiloXp(m, filoOfType(s.type), XP_ACIERTO, "filoAciertos");
}

/**
 * ¿Arranca una secuencia en este tick? Cada una tiene su ventana sorteada en el plan (ver
 * seqSlots). Devuelve true (y deja m.decision) si arrancó. Todo el contexto —lado, tipo,
 * protagonista— se decide acá, en el momento.
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
  // La ventana de esta jugada: sale en cuanto haya fútbol, y al vencer sale sí o sí.
  // (Sin slot —los tests fuerzan `slots = []`— arranca en el acto, como siempre.)
  const slot = plan.slots[done];
  if (slot && m.min < slot.cierra && !(m.min >= slot.abre && zonaViva(m))) return false;
  const mentShift = m.my.mentalidad === "ofensiva" ? 0.10 : m.my.mentalidad === "defensiva" ? -0.10 : 0;
  // El partido inclina el reparto EN VIVO: perder tarde te vuelca al ataque (+0.07, y te
  // expone), ganar tarde te repliega (−0.05, el rival empuja) y cada expulsado inclina la
  // cancha (±0.06).
  const late = m.min >= 75 ? (m.gMy < m.gOpp ? 0.07 : m.gMy > m.gOpp ? -0.05 : 0) : 0;
  const reds = 0.06 * (m.oppLineup.filter(p => p.expulsado).length - m.my.lineup.filter(p => p.expulsado).length);
  // Las identidades que esperan CEDEN iniciativa, y los rasgos MASTER inclinan el reparto
  // de raíz: uno estrangula al rival por posesión, otro por miedo (atacar contra esa
  // contra es regalarse, así que el rival se cuida). Suma de todos los shareShift.
  const traitShift = Object.values(traitHooks(m)).flat().reduce((s, h) => s + (h.shareShift || 0), 0);
  const mineShare = clamp(0.5 + plan.edge * 0.045 + mentShift + late + reds + filoShareShift(m.my.filo, plan.oppFilo) + traitShift + heightShareShift(m), 0.3, 0.72);
  const side = rnd() < mineShare ? "mine" : "opp";
  // FRÍOS: el DT congeló el partido renunciando a un remate, y lo que compró fue esto —
  // la próxima llegada rival NO ocurre. Se DESCUENTA del objetivo del partido en vez de
  // posponerse: si solo se retrasara, no habría comprado nada.
  if (side === "opp" && (m._frozen || 0) > 0) {
    m._frozen--;
    // Se consume también su MOMENTO: sin sacarlo de la agenda, el minuto ya vencido se
    // volvería a disparar en el tick siguiente, y otra vez, y otra.
    plan.slots.splice(done, 1);
    plan.target = Math.max(done, plan.target - 1);
    m.log("plain", `min ${m.clock()}' — El equipo la hace circular sin apuro: ${m.oppTeam.name} no la ve pasar.`);
    return false;
  }
  const pool = SEQUENCE_TYPES.filter(t => t.side === side);
  const w = typeWeights(m, side, plan);
  // [EL TERRITORIO DECIDE QUÉ JUGADA SALE]: cada tipo pesa según cuán lejos está la
  // pelota de la altura donde ese fútbol NACE. Como el sorteo normaliza dentro del lado,
  // esto cambia la MEZCLA y nunca el número de jugadas.
  startSequence(m, m._weightedPick(pool, pool.map(t => (w[t.id] ?? 1) * zoneWeight(t, m.field?.v ?? 3, m.field?.h ?? 2))));
  return true;
}

/** Arranca una secuencia de un tipo dado: elige protagonista(s) y crea la decisión del acto 1. */
export function startSequence(m, type) {
  m._seqCount = (m._seqCount || 0) + 1;
  noteFiloIntent(m, type);   // la INTENCIÓN: proponer ese fútbol ya enseña (70% de la XP)
  m._lastSeqType = type.id;  // memoria: no repetir el mismo tipo dos veces seguidas
  m._flow.push({ min: m.min, side: type.side, w: 3 });   // posesión y momentum derivados
  // EL TERRITORIO: la jugada PLANTA la pelota donde ese fútbol nace (`zone.from` del
  // catálogo, llevado al borde más cercano) y deja mucho más calor que un minuto de
  // relleno. Del lado de quien la propone: una defensiva es SU posesión.
  setBall(m, { ...originOf(m, type), side: type.side });
  m.stats.decisiones++;
  if (type.side === "mine") {
    const cands = m.activeMine().filter(p => p.pos !== "POR");
    // Momento → protagonista: ver protMomentum.
    const prot = m._weightedPick(cands, cands.map(p => (type.protWeight[playedPos(p)] ?? 1) * protMomentum(p) * protStatW(type, p)));
    m.seq = { type, prot, actIdx: 0, bonus: 0 };
    // El 4º compás de la sinfonía profunda lo aporta el rasgo Desesperantes.
    if (type.id === "sinfonia" && hasTrait(m, "desesperantes")) m.seq.plan = ["build", ...type.plan];
    // Hooks de ARRANQUE del árbol de rasgos: la secuencia puede nacer en su variante,
    // con relato propio. Matchean por FAMILIA (ver familyOf). El salto va al ACTO 1: en
    // la transición base ese es el desenlace (la contra a una) y en el contragolpe letal
    // conserva un tramo + definición, acelerándolo sin canibalizar sus bonus de escalada.
    let traitIntro = null;
    const fam = familyOf(type);
    const vd = hookOf(m, "variantDeep", fam); // Angriffpressing: el robo nace sobre el saque de meta
    if (vd && rnd() < vd.p) {
      m.seq.bonus += vd.bonus;
      m.seq.deepVariant = true; // Arco a la Vista profundiza ESTE desenlace
      traitIntro = vd.intro;
    }
    // Variante condicional al RIVAL: la Salida Lavolpiana de Posesión la usa contra
    // el Press (el mediocampista que baja deja sobrando a la primera línea).
    const vs = hookOf(m, "variantSwitch", fam);
    if (vs && vs.vsFilo === seqPlan(m).oppFilo?.id && rnd() < vs.p) {
      m.seq.bonus += vs.bonus;
      traitIntro = vs.intro;
    }
    // SIN ESCALAS: la contra puede nacer YA RESUELTA — se saltean los actos intermedios y
    // el desenlace es el mano a mano. Va antes del salto normal porque es su versión
    // superlativa: si sale esta, la otra no se tira.
    const oo = fam === "transicion" ? hookOf(m, "oneOnOne") : null;
    if (oo && rnd() < oo.p) {
      m.seq.actIdx = planOfType(type).length - 1;
      m.seq.bonus += oo.bonus;
      m.seq.oneOnOne = true;
      traitIntro = oo.intro;
    } else {
      const sk = hookOf(m, "skipToFinish", fam); // Ataque Relámpago: la contra se juega a una
      if (sk && rnd() < sk.p) {
        m.seq.actIdx = 1;
        m.seq.bonus += sk.bonus;
        traitIntro = sk.intro;
        // Tres Toques (Press, T2): el salto gana calidad y SU voz.
        const up = hookOf(m, "skipUpgrade");
        if (up) { m.seq.bonus += up.bonus; traitIntro = up.intro; }
      }
    }
    // [RELATO CON IDENTIDAD]: cuando la secuencia es MI tipo firma, la narra la filosofía
    // ("el pressing que entrenamos toda la semana") en vez del intro genérico.
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
    // El bozal de Asfixia Total se NARRA de vez en cuando: el rival con la identidad
    // amordazada juega otro fútbol, y el relato lo dice.
    const muzzle = hookOf(m, "muzzleOppFirma");
    const oppFilo = m._seqPlan?.oppFilo;
    if (muzzle && oppFilo && RIVAL_FIRMA_OPP[oppFilo.id] && rnd() < 0.12) traitMoment(m, muzzle.traitId, [muzzle.texto]);
  }
  buildActDecision(m);
}
