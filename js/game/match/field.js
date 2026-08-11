/* ============================================================
   game/match/field — EL TERRITORIO.

   El partido pasa a saber DÓNDE se juega. Hasta acá el motor
   sabía qué jugada salía y qué tan buena quedaba (el canal
   `bonus`), pero no existía el concepto de posición: un penal y
   una circulación nacían del mismo sitio, que era ninguno.

   ── EL MARCO ─────────────────────────────────────
   ABSOLUTO y anclado a MI arco. Siempre, sin importar de quién
   sea la pelota:
       v1 = mi área · v2 = mi salida · v3 = mediocampo
       v4 = tres cuartos (campo rival) · v5 = área rival
       h1 = banda izquierda · h2 = centro · h3 = banda derecha
   Cuando el rival ataca, la pelota BAJA por el mismo eje. Una
   sola verdad: el mapa de calor se lee como una transmisión y las
   jugadas rivales no necesitan traducirse a otro marco.
   ───────────────────────────────────────────────────────────────

   ── LA LEY DEL AZAR (la misma de stats.js y match-momentum.js) ──
   La DERIVA AMBIENTE —los ~90 minutos en los que no hay una Key
   Sequence— NO consume `rnd`. Ni una tirada. Con 5-9 secuencias
   por partido, un mapa de calor alimentado solo por jugadas
   tendría 5 muestras; el relleno sale DETERMINISTA de la posesión
   ya derivada del juego (`Match.flow`), los poderes y las dos
   alturas de bloque. Así el sistema territorial puede existir sin
   correr el flujo del RNG ni moverle un dial al balance calibrado
   (lección de A1/A2/A3): el azar se gasta donde hay fútbol de
   verdad —las secuencias y sus actos—, no en el relleno.
   ───────────────────────────────────────────────────────────────

   EL JUGADOR NUNCA VE UN NÚMERO DE ZONA. Todo esto se comunica
   por el mapa de calor, el momentum, la narración y qué jugadas
   aparecen (objetivo de diseño del sprint).
   ============================================================ */
import { clamp } from "../../core/math.js";
import { rivalFilo } from "../philosophy.js";
import { playedPos } from "../ratings.js";
import { momentumTrend } from "./match-momentum.js";

/** Carriles (horizontal) y alturas (vertical) de la grilla. */
export const LANES = 3, ROWS = 5;

/** Los nombres del territorio para la NARRACIÓN (jamás un número al jugador). */
export const ROW_NAME = ["", "el área propia", "la salida", "el mediocampo", "tres cuartos", "el área rival"];
export const LANE_NAME = ["", "la banda izquierda", "el centro", "la banda derecha"];

/** La ALTURA DEL BLOQUE del DT (1..5). Los nombres los pinta la UI. */
export const HEIGHTS = [
  { n: 1, id: "muy_bajo", label: "Muy bajo", icon: "🛡️", desc: "El equipo se mete en su área: cero espacio a la espalda, cero campo por delante." },
  { n: 2, id: "bajo", label: "Bajo", icon: "🧱", desc: "Bloque replegado que espera y sale de contra." },
  { n: 3, id: "medio", label: "Medio", icon: "⚖️", desc: "El equilibrio: se disputa el mediocampo." },
  { n: 4, id: "alto", label: "Alto", icon: "⚔️", desc: "Líneas adelantadas: se juega en campo rival y se roba arriba." },
  { n: 5, id: "muy_alto", label: "Muy alto", icon: "🔥", desc: "Los centrales en la mitad de cancha: asfixia total… y toda la espalda descubierta." },
];
export const HEIGHT_DEFAULT = 3;
export const heightOf = n => HEIGHTS[clamp(n, 1, 5) - 1];

/** Índice plano de una celda en la grilla (3 carriles × 5 alturas). */
export const cellIdx = (h, v) => (clamp(h, 1, LANES) - 1) * ROWS + (clamp(v, 1, ROWS) - 1);

/* ── La deriva ────────────────────────────────────────────────────────────────
   PASO: cuánto puede viajar la pelota en un minuto (en alturas). 0.8 deja que
   una posesión cruce medio campo en dos o tres minutos — ni teletransporte ni
   melaza. FASE: cada cuántos minutos se decide de quién es la pelota; con 1 la
   posesión alternaba cada minuto y el balón oscilaba clavado en el mediocampo
   (el mapa de calor salía una mancha central en todos los partidos). Con 3, cada
   equipo tiene RACHAS y el mapa se abre. TIRÓN: el salto extra en el momento del
   robo — el que recupera saca el balón de la zona en la que se lo quitó. */
const DRIFT_STEP = 0.8;
const PHASE_MIN = 3;
const TURNOVER_PULL = 0.7;

/* ── EL RECORRIDO: una posesión no ESTÁ en un sitio, VIAJA ─────────────────────
   Hasta acá el target era un punto fijo y `vf` lo alcanzaba en dos minutos para
   quedarse clavado ahí los otros ochenta y ocho. Con la deriva sin azar (la ley de
   arriba), un atractor puntual no dibuja una nube: dibuja un punto. Medido antes de
   tocarlo, sobre 150 partidos por escenario: el pico del mapa cayó en el mediocampo
   en 150 de 150, con ~75% del calor en una sola fila, y golear movía el reparto 2.7pp
   — o sea, nada.

   Ahora cada fase es un RECORRIDO: la posesión nace atrás, progresa y muere en su
   punto más alto, como una posesión de verdad. El target sigue siendo el CENTRO de
   gravedad y el viaje se abre a los dos lados por igual, así el centro de masa medido
   no se mueve y lo único que cambia es que el mapa deja de ser una mancha (misma
   técnica del punto neutro que usan el bloque medio y la línea de dos).

   El paso sigue siendo DRIFT_STEP, más chico que el tramo que el recorrido pide cada
   minuto: la pelota PERSIGUE su objetivo sin alcanzarlo nunca del todo, y ese retraso
   es el que la deja pasar por las alturas intermedias en vez de saltar entre extremos.
   ───────────────────────────────────────────────────────────────────────────── */
const PHASE_SPAN = 1.45;

/** Cuánto calor deja un minuto ambiente y cuánto un acto de una jugada REAL. La jugada
 *  pesa CINCO veces más porque el mapa contesta "dónde se jugó el partido", no "dónde
 *  estuvo la pelota": con el relleno pesando 3 a 1 sobre las Key Sequences, el dibujo
 *  era el de la circulación intrascendente y el fútbol de verdad quedaba tapado. Es un
 *  dial de LECTURA — cambia lo que el mapa cuenta, no lo que el simulador decide. */
export const HEAT_TICK = 1, HEAT_ACT = 5;

/* ── EL EJE HORIZONTAL: el carril también lo decide el fútbol ──────────────────
   Era un ciclo fijo de diez valores, idéntico en todos los partidos: un 1-3-1 y un
   3-1-1 dibujaban exactamente el mismo mapa aunque `attackWidth`/`defenseWidth` ya
   estuvieran calculados. Ahora el reparto sale de la AMPLITUD del dibujo (una línea
   de tres llega a las bandas; una de uno, no) y de la ALTURA de la pelota: se ataca
   por afuera y se define por adentro, así que dentro de las áreas el juego se cierra
   al centro. Sin gastar azar: el mismo Bresenham que ya reparte la posesión, y la
   banda concreta alterna con el contador que ya existía. */
const WING_BASE = 0.52;   // cuánta banda hay con el dibujo NEUTRO (la línea de dos: ×1)
const WING_WIDTH = 0.17;  // cuánto la mueve la amplitud, de punta a punta del dial
const WING_BOX = 0.45;    // y cuánto se cierra el juego dentro de un área

/** La altura de bloque BASE de cada identidad rival (la IA juega su idea). */
const OPP_HEIGHT = { press: 4, posesion: 4, contra: 2, bloque: 2 };

/** Un mapa de calor vacío para un tiempo (mío y suyo, misma grilla absoluta). */
const newMap = (nominal) => ({
  nominal,
  mine: new Array(LANES * ROWS).fill(0),
  opp: new Array(LANES * ROWS).fill(0),
});

/**
 * El estado territorial que cuelga de cada Match. `vf` es la altura CONTINUA (la
 * que deriva); `v` su redondeo, que es la zona en la que el partido "está".
 * `oppFilo` se cachea acá: `rivalFilo` es pura (no gasta azar), así que llamarla
 * en el constructor no corre el flujo del RNG.
 */
export function newField(oppTeam, koRound = 0, laneSeed = 0) {
  return {
    h: 2, v: 3, vf: 3,
    side: "mine",
    oppFilo: oppTeam ? rivalFilo(oppTeam, koRound) : null,
    maps: [newMap(45)],
    windows: 0,                // ventanas tácticas gastadas (mover el bloque en juego)
    _pos: 0.5,                 // acumulador del reparto de posesión (Bresenham por fases)
    _phase: 0,                 // minuto en que nació la posesión en curso (el recorrido)
    _wing: (Math.abs(laneSeed) % 7) / 7,   // acumulador del reparto de carriles (Bresenham)
    _lane: Math.abs(laneSeed),             // qué banda toca cuando el reparto pide una
  };
}

/** El mapa del tiempo EN CURSO (el último de la lista). */
export const currentMap = m => m.field?.maps[m.field.maps.length - 1] || null;

/** Dónde está la pelota AHORA: {h, v, side}. La lectura pública del territorio. */
export const ballZone = m => (m.field ? { h: m.field.h, v: m.field.v, side: m.field.side } : { h: 2, v: 3, side: "mine" });

/** MI altura de bloque: es una orden del DT y vive en matchCtx (como la mentalidad),
 *  no en el estado del simulador — por eso se lee EN VIVO en cada consulta. */
export const myHeight = m => clamp(m.my?.altura ?? HEIGHT_DEFAULT, 1, 5);

/* EL RIVAL QUE REACCIONA.

   El PO fijó el alcance: *"el rival mantiene su formación de esencia y su filosofía de
   esencia; puede cambiar durante un partido si el partido se le empieza a escapar, pero
   no antes de iniciarlo. Con las tarjetas rojas sí se readapta estratégicamente."*

   O sea: **no contra-elige, reacciona**. Y eso es mejor diseño de lo que parece, porque
   el gate del propio sprint pedía que el informe lo anticipe SIEMPRE — con una identidad
   que se elige antes del partido, el ojeador tendría que adivinar una decisión que
   todavía no ocurrió. Con esencia fija el informe es verdadero por construcción: dice a
   qué juegan, y a eso juegan. Lo que cambia es la POSTURA, y eso el DT lo ve pasar.

   Se expresa donde ya vivía —la altura del bloque— y no en un canal nuevo, por dos
   razones medidas: (1) la altura ya arrastra territorio Y reparto de pelota
   (`heightShareShift` descuenta 0.02 por escalón rival), o sea que subir el bloque YA
   es salir a buscar la pelota; (2) es lo único VISIBLE — el informe anuncia la altura de
   esencia antes del partido, así que cuando el bloque se mueve el DT lo reconoce.

   Es gradual y mira más que el marcador a propósito: un equipo no espera al minuto 70
   para darse cuenta de que se le está escapando. */
const REACCION_DOMINIO = 20;   // tendencia de match-momentum que ya es "me están comiendo"
                               // (el asistente técnico usa 22 para decir lo mismo)

/**
 * Cómo está reaccionando el rival AHORA: −1 se atrinchera · 0 sigue con su plan ·
 * +1 sale a buscarlo. Puro y sin azar (la ley del sprint del Territorio).
 */
export function oppReaction(m) {
  // Las ROJAS mandan sobre todo lo demás y son inmediatas: con uno menos te metés atrás
  // aunque vayas perdiendo, y con uno más salís a buscarlo aunque vayas ganando.
  const rojas = m.my.lineup.filter(p => p.expulsado).length - m.oppLineup.filter(p => p.expulsado).length;
  if (rojas !== 0) return clamp(rojas, -1, 1);
  // El marcador pesa cada vez más con el reloj: a los 20' un 0-1 se remonta caminando,
  // a los 80' no. Antes de la media hora el rival no se mueve de su plan.
  const urgencia = m.min >= 65 ? 1 : m.min >= 30 ? 0.5 : 0;
  const marcador = m.gOpp < m.gMy ? 1 : m.gOpp > m.gMy ? -1 : 0;
  // Y el DOMINIO adelanta la reacción aunque el marcador todavía no lo diga: si lo
  // tengo contra su arco hace diez minutos, sale a despegarse antes de que entre.
  const ahogado = m.min >= 30 && momentumTrend(m, 8) > REACCION_DOMINIO ? 1 : 0;
  const r = marcador * urgencia + ahogado * 0.5;
  return r >= 0.5 ? 1 : r <= -0.5 ? -1 : 0;
}

/**
 * La altura del bloque RIVAL: su identidad la fija (el Press y la Posesión adelantan
 * líneas; la Contra y el Bloque esperan), su nivel la radicaliza, y su REACCIÓN al
 * partido la mueve — el que se le está escapando sube, el que administra se agacha.
 * La IA rival juega con las MISMAS reglas territoriales que el DT (entregable del sprint).
 */
export function oppHeight(m) {
  return clamp(baseHeight(m.field?.oppFilo) + oppReaction(m), 1, 5);
}

/**
 * La altura de una identidad SIN contexto de partido: su idea la fija y su nivel la
 * radicaliza. Es PURA (no necesita un Match) a propósito — así el Informe del Rival puede
 * decir, ANTES de jugar, cómo se va a parar el que viene: la altura propia es una decisión
 * de pizarra, y una decisión de pizarra sin información previa es una moneda al aire.
 */
export function baseHeight(filo) {
  const base = OPP_HEIGHT[filo?.id] ?? HEIGHT_DEFAULT;
  const conv = filo && filo.nivel >= 2 ? (base >= 4 ? 1 : base <= 2 ? -1 : 0) : 0;
  return clamp(base + conv, 1, 5);
}

/* ── EL PARTIDO EMPUJA EL TERRITORIO ──────────────────────────────────────────
   El rival ya reaccionaba al partido (`oppReaction`, más arriba); MI lado no tenía el
   espejo, y por eso el marcador no aparecía en ninguna parte del mapa. Faltan dos
   fuerzas, y se miden por separado a propósito porque dicen cosas distintas:

   · el DOMINIO es lo que ESTÁ pasando — el momentum que el juego ya deriva. Si lo tengo
     contra su arco hace diez minutos, la pelota vive arriba. Nada nuevo que calibrar.
   · la URGENCIA es lo que HACE FALTA — el marcador pesado por el reloj, igual que en
     `oppReaction`: a los 20' un 0-1 se remonta caminando, a los 80' se juega en un área.

   La URGENCIA es ASIMÉTRICA a propósito: el que pierde se vuelca entero, y el que gana
   administra pero no se esconde. Con el freno simétrico, golear te dejaba el mapa ABAJO
   —el que golea se replegaría hasta su área— que es justo lo contrario de lo que se ve
   en una transmisión. Así, un partido goleado sale volcado al último tercio por
   ACUMULACIÓN (goleé porque estuve setenta minutos arriba), que es una salida del
   simulador y no una regla que pinte el mapa: la regla de oro del Momentum, otra vez.
   ───────────────────────────────────────────────────────────────────────────── */
const PUSH_DOMINIO = 1.0;    // alturas de empuje con el momentum a tope
const PUSH_URGENCIA = 0.9;   // alturas de empuje yendo dos goles abajo sobre el final
const PUSH_ADMIN = 0.30;     // …y cuánto se agacha el que administra (el freno asimétrico)
const PUSH_ROJA = 0.5;       // lo que cuesta cada hombre de diferencia
/* La tendencia de momentum que ya es "lo tengo contra su arco". MEDIDO, no elegido: la
   distribución real de `momentumTrend(m, 10)` en partido tiene su p95 en 14.2, así que
   un equipo que domina de verdad satura el canal y uno que empata no lo mueve. Puesto a
   ojo en 40 —la escala nominal del gráfico, que llega a 100— el empuje entero valía
   ±0.35 alturas y el marcador seguía sin aparecer en el mapa. */
const MM_FULL = 14;

/**
 * Cuánto empuja MI equipo hacia el arco rival AHORA, en alturas (+) o cuánto lo empujan
 * a él (−). Pura y sin azar, como todo el territorio.
 */
export function matchPush(m) {
  const dom = clamp(momentumTrend(m, 10) / MM_FULL, -1, 1) * PUSH_DOMINIO;
  const reloj = m.min >= 65 ? 1 : m.min >= 30 ? 0.5 : 0;
  const dif = clamp((m.gOpp - m.gMy) / 2, -1, 1);   // + = voy perdiendo
  const urgencia = reloj * dif * (dif > 0 ? PUSH_URGENCIA : PUSH_ADMIN);
  const rojas = m.oppLineup.filter(p => p.expulsado).length - m.my.lineup.filter(p => p.expulsado).length;
  return dom + urgencia + PUSH_ROJA * clamp(rojas, -2, 2);
}

/* ── LA IDENTIDAD DIBUJA SU PROPIO MAPA ───────────────────────────────────────
   Dos diales, porque con uno solo las cuatro identidades salían de a pares: medido con
   el empuje solo, el Press y la Posesión daban mapas IDÉNTICOS, y la Contra y el Bloque
   también. Y es correcto que así fuera — lo que separa a una Contra de un Bloque no es
   la altura (las dos esperan atrás), es CUÁNTO VIAJA la pelota cuando por fin sale.

   · PUSH mueve la cuna: dónde nace el fútbol de esa idea.
   · SPAN mueve el largo del recorrido: la Contra sale de su propio campo y muere en el
     área rival de un tirón —el viaje más largo del juego, y su mapa se ve así: dos
     manchas y poco medio—; el Press vive arriba y apenas se mueve; la Posesión progresa
     despacio; el Bloque defiende abajo y revienta lejos.

   Solo se le aplican al DT: la identidad del rival ya entra por su altura de bloque
   (`baseHeight`), y sumarla acá sería contarle la misma idea dos veces.
   ───────────────────────────────────────────────────────────────────────────── */
const FILO_PUSH = { press: 0.55, posesion: 0.20, contra: -0.45, bloque: -0.60 };
const FILO_SPAN = { press: 1.00, posesion: 1.20, contra: 2.10, bloque: 1.70 };

/**
 * Dónde tiende a jugarse MI posesión: mi altura manda (un bloque muy alto ataca
 * desde tres cuartos; uno muy bajo construye desde su salida), mi ventaja de ataque
 * sobre su defensa empuja, el bloque rival adelantado me obliga a nacer más atrás, mi
 * IDENTIDAD mueve la cuna de mi fútbol y el PARTIDO en curso empuja o repliega.
 */
function targetMine(m, mine, opp) {
  const edge = mine.atk / (mine.atk + opp.def) - 0.5;
  return clamp(3 + 0.55 * (myHeight(m) - 3) + 3 * edge - 0.25 * (oppHeight(m) - 3)
    + (FILO_PUSH[m.my?.filo?.id] ?? 0) + matchPush(m), 1, ROWS);
}

/** El espejo exacto para SU posesión: su altura lo adelanta hacia mi arco (v baja),
 *  su peligro empuja, MI bloque alto lo pin­cha contra su propio campo (v sube) — y mi
 *  empuje lo pincha igual: si lo tengo contra su arco, su pelota no sale de ahí. */
function targetOpp(m, mine, opp) {
  const edge = opp.atk / (opp.atk + mine.def) - 0.5;
  return clamp(3 - 0.55 * (oppHeight(m) - 3) - 3 * edge + 0.25 * (myHeight(m) - 3)
    + matchPush(m), 1, ROWS);
}

/**
 * El carril de este minuto. Cuánta banda hay lo deciden la AMPLITUD de quien tiene la
 * pelota —la mía cuando ataco; cuando defiende el rival, mi cobertura al revés: el que
 * deja las bandas libres las va a sufrir— y la ALTURA: dentro de un área el juego se
 * cierra al centro. El reparto se resuelve con el mismo Bresenham que la posesión y la
 * banda concreta alterna, así que no se gasta una sola tirada de azar.
 */
function driftLane(m) {
  const f = m.field;
  const w = f.side === "mine" ? attackWidth(m) : -defenseWidth(m);
  const cierre = f.vf >= 4.3 || f.vf <= 1.7 ? WING_BOX : 1;
  f._wing += clamp(WING_BASE + WING_WIDTH * w, 0.05, 0.80) * cierre;
  if (f._wing < 1) return 2;
  f._wing -= 1;
  return f._lane++ % 2 ? 1 : LANES;
}

/**
 * UN MINUTO DE TERRITORIO (sin azar). Lo llama `Match.tick` con los poderes ya
 * calculados —mismo contrato que `tickStats`, y por el mismo motivo: no recalcular—.
 * Decide de quién es la pelota por fases, la mueve hacia donde tira ese fútbol y
 * deja el calor del minuto en la celda donde quedó.
 */
export function tickField(m, mine, opp) {
  const f = m.field;
  if (!f) return;
  // 1. ¿De quién es este tramo? Bresenham sobre la posesión que el juego YA derivó
  //    (Match.flow: una sola verdad), en bloques de PHASE_MIN para que haya rachas.
  const antes = f.side;
  if (m.min % PHASE_MIN === 0 || m.min <= 1) {
    f._pos += m.flow().pos / 100;
    if (f._pos >= 1) { f._pos -= 1; f.side = "mine"; } else f.side = "opp";
    f._phase = m.min;                     // y con la posesión nueva arranca su RECORRIDO
  }
  // 2. ¿Hacia dónde tira? El target es el centro de gravedad de ese fútbol; lo que la
  //    pelota persigue es el punto del RECORRIDO que le toca a este minuto: la posesión
  //    nace un tramo por detrás y muere un tramo por delante, hacia el arco del que la
  //    tiene (que en el marco absoluto es +1 para mí y −1 para él). En el minuto del ROBO
  //    se agrega un tirón extra: el que recupera saca la pelota de donde se la quitó.
  const target = f.side === "mine" ? targetMine(m, mine, opp) : targetOpp(m, mine, opp);
  const prog = clamp((m.min - f._phase) / Math.max(1, PHASE_MIN - 1), 0, 1);
  const span = f.side === "mine" ? (FILO_SPAN[m.my?.filo?.id] ?? PHASE_SPAN) : PHASE_SPAN;
  const objetivo = target + (f.side === "mine" ? 1 : -1) * span * (2 * prog - 1);
  //    El objetivo NO se recorta contra los bordes y `vf` SÍ: un recorrido que apunta
  //    más allá del área empuja la pelota hasta el fondo y la sostiene ahí, que es lo
  //    que hace la diferencia entre una Contra —del propio campo al área rival de un
  //    tirón— y un Bloque. Recortando el objetivo, los dos saturaban en el mismo sitio y
  //    dibujaban el mismo mapa. Y acotar `vf` cierra de paso un agujero viejo: la altura
  //    continua se iba fuera de la cancha (solo se recortaba `v`, su redondeo) y tardaba
  //    minutos de más en volver.
  //    El VIAJE es largo y rápido, o corto y pausado: las dos cosas son la misma, porque
  //    recorrer más cancha en los mismos minutos ES ir más rápido. Sin escalar el paso, el
  //    span quedaba saturado —la pelota avanza 0.8 por minuto apunte donde apunte, así que
  //    apuntar más lejos no la llevaba más lejos— y la Contra dibujaba el mismo mapa que
  //    el Bloque. Con el paso escalado, la Contra sale disparada y el Press mueve poco la
  //    pelota porque ya está donde la quiere.
  const paso = (DRIFT_STEP + (f.side !== antes ? TURNOVER_PULL : 0)) * (span / PHASE_SPAN);
  f.vf = clamp(f.vf + clamp(objetivo - f.vf, -paso, paso), 1, ROWS);
  f.v = clamp(Math.round(f.vf), 1, ROWS);
  // 3. El carril: la amplitud del dibujo y la altura de la pelota (sin azar, la ley).
  f.h = driftLane(m);
  // 4. El calor del minuto va al mapa del que tiene la pelota.
  noteZone(m, f.side, HEAT_TICK);
  // 5. Y el minuto se cobra en piernas si el bloque está adelantado.
  drainHeight(m);
}

/**
 * Planta la pelota en una zona (lo usan las jugadas: una secuencia nace donde su
 * fútbol nace, y cada acto la mueve). `side` opcional cambia de quién es. Deja el
 * calor de una jugada REAL, que pesa más que un minuto de relleno.
 */
export function setBall(m, { h, v, side } = {}, heat = HEAT_ACT) {
  const f = m.field;
  if (!f) return;
  if (h !== undefined) f.h = clamp(Math.round(h), 1, LANES);
  if (v !== undefined) { f.v = clamp(Math.round(v), 1, ROWS); f.vf = f.v; }
  if (side) f.side = side;
  if (heat) noteZone(m, f.side, heat);
}

/** Mueve la pelota `dv` alturas (y `dh` carriles), respetando los bordes. */
export function moveBall(m, dv, dh = 0, heat = HEAT_ACT) {
  const f = m.field;
  if (!f) return;
  setBall(m, { v: f.v + dv, h: f.h + dh }, heat);
}

/** Suma calor en la celda actual al mapa del lado indicado. */
export function noteZone(m, side, w = HEAT_ACT) {
  const map = currentMap(m);
  if (!map || !w) return;
  map[side === "opp" ? "opp" : "mine"][cellIdx(m.field.h, m.field.v)] += w;
}

/**
 * Empieza un tiempo nuevo: MAPA LIMPIO (decisión de diseño del sprint: cada tiempo
 * tiene el suyo) y la pelota al medio, como en el saque. Los mapas anteriores se
 * conservan en la lista — el post-partido los muestra.
 */
export function startHalfField(m, nominal) {
  const f = m.field;
  if (!f) return;
  f.maps.push(newMap(nominal));
  f.h = 2; f.v = 3; f.vf = 3;
  f.side = "mine";
  f._pos = 0.5;
  f._phase = m.min;   // el saque abre una posesión nueva: su recorrido empieza de cero
}

/* ── LA AMPLITUD: quién ocupa los carriles ────────
   Una línea de TRES ocupa los tres carriles. Una de UNO, solo el centro. Es la
   lectura que le faltaba al dibujo: un 3-1-1 no es "defensivo" a secas — es un
   equipo que cubre las dos bandas atrás y que arriba no tiene a NADIE por afuera;
   un 1-3-1 es exactamente el espejo. El mismo número que ya se elegía cobra un
   significado nuevo, sin agregar un dial más que mantener.

   Escala −1..+1 CENTRADA EN LA LÍNEA DE DOS: ahí todo vale ×1, que es el punto
   neutro del dial (misma técnica que el bloque medio en la altura — la línea base
   medida no se mueve por el hecho de que la lectura exista).
   ───────────────────────────────────────────────────────────────────────────── */

/** Cuánto cubre los CARRILES una línea de n jugadores: 0 (nadie por afuera) … 1 (los tres). */
export const lineCover = n => clamp((n - 1) / 2, 0, 1);

/** Cuántos hay en cada línea AHORA (por puesto jugado: una roja angosta al equipo). */
function lineCounts(m) {
  const c = { DEF: 0, MED: 0, DEL: 0 };
  for (const p of m.activeMine()) if (c[playedPos(p)] !== undefined) c[playedPos(p)]++;
  return c;
}

/** Amplitud OFENSIVA (−1..+1): manda la línea más ancha de las dos de arriba — para
 *  atacar la banda alcanza con que ALGUIEN la ocupe (el extremo o el volante abierto). */
export function attackWidth(m) {
  const c = lineCounts(m);
  return 2 * (Math.max(lineCover(c.MED), lineCover(c.DEL)) - 0.5);
}

/** Amplitud DEFENSIVA (−1..+1): la zaga manda y el mediocampo ayuda (×0.7 — bajar a
 *  tapar la banda no es lo mismo que estar parado ahí). */
export function defenseWidth(m) {
  const c = lineCounts(m);
  return 2 * (Math.max(lineCover(c.DEF), lineCover(c.MED) * 0.7) - 0.5);
}

/** ¿La pelota está en una banda? (el centro no premia ni castiga la amplitud) */
export const inWing = m => (m.field?.h ?? 2) !== 2;

/**
 * La lectura de amplitud de un DIBUJO, para la UI: en palabras, nunca en números
 * (objetivo de diseño del territorio). Recibe la cuenta por línea, no un Match, así
 * la puede pedir el selector de formación antes de que exista el partido.
 */
export function widthHint(def, med, del) {
  const a = 2 * (Math.max(lineCover(med), lineCover(del)) - 0.5);
  const d = 2 * (Math.max(lineCover(def), lineCover(med) * 0.7) - 0.5);
  const partes = [];
  if (a >= 0.9) partes.push("llega a las dos bandas");
  else if (a <= -0.9) partes.push("ataca solo por el medio");
  if (d >= 0.9) partes.push("cubre las bandas atrás");
  else if (d <= -0.9) partes.push("deja las bandas libres");
  return { atk: a, def: d, txt: partes.join(" · ") };
}

/* ── LA GEOGRAFÍA DE LAS JUGADAS ─────────────────────────────────────────
   Cada tipo de Key Sequence declara DESDE QUÉ ALTURAS puede nacer (`zone.from` en
   content/sequences). Un penal casi solo puede originarse en el área rival; una
   circulación larga no arranca dentro de esa misma área; una recuperación alta
   necesita, por definición, que la pelota esté arriba.

   No es un filtro duro: es un PESO. Cuanto más lejos está la pelota del sitio
   donde ese fútbol nace, menos probable es que ese fútbol aparezca — y como el
   sorteo normaliza dentro de cada lado, esto cambia la MEZCLA de jugadas, nunca
   cuántas hay (la densidad no se toca en este sprint).
   ───────────────────────────────────────────────────────────────────────────── */

/** Caída del peso por cada altura de distancia entre la pelota y la cuna del tipo. */
const ZONE_FALLOFF = 0.55;

/**
 * Cuánto pesa un tipo desde donde está la pelota (1 = nace justo acá). La ALTURA cae
 * por distancia; el CARRIL es una preferencia más suave — con la pelota ya abierta, el
 * fútbol por afuera se propone solo; con la pelota en el medio, cuesta más abrirla.
 */
export function zoneWeight(type, v, h = 2) {
  const z = type?.zone?.from;
  if (!z) return 1;
  const d = v < z[0] ? z[0] - v : v > z[1] ? v - z[1] : 0;
  const lane = type.zone.lane === "wide" ? (h === 2 ? 0.65 : 1.35)
    : type.zone.lane === "center" ? (h === 2 ? 1.25 : 0.80) : 1;
  return (ZONE_FALLOFF ** d) * lane;
}

/** Un carril de BANDA, alternando (sin gastar azar: la ley de la deriva). Comparte el
 *  contador con la deriva a propósito: las dos fuentes de banda se turnan entre sí, así
 *  un partido no carga siempre el mismo lado. */
export const wingLane = m => (m.field ? (m.field._lane++ % 2 ? 1 : LANES) : 1);

/** El carril OPUESTO al actual (el cambio de frente). Desde el centro, abre a una banda. */
export const otherLane = m => ((m.field?.h ?? 2) === 2 ? wingLane(m) : LANES + 1 - m.field.h);

/**
 * Dónde PLANTA la pelota un tipo que arranca: la altura actual llevada al borde más
 * cercano de su cuna (la jugada nace donde está la pelota si puede; si no, en el
 * sitio más cercano donde ese fútbol existe). El carril lo pide el tipo: `wide` la
 * abre a una banda —alternando, sin gastar azar— y `center` la trae al medio.
 */
export function originOf(m, type) {
  const f = m.field;
  const z = type?.zone?.from || [1, ROWS];
  const v = clamp(f?.v ?? 3, z[0], z[1]);
  const lane = type?.zone?.lane;
  const h = lane === "wide" ? wingLane(m) : lane === "center" ? 2 : (f?.h ?? 2);
  return { h, v };
}

/* Cuánto AVANZA la pelota cada gesto, en alturas. El fútbol del sprint, en una tabla
. Los
   resolvers de sequence-acts la leen; nadie más tiene permitido inventar números. */
export const ADVANCE = {
  paseSeguro: 1,      // la circulación progresa un tramo
  paseFiltrado: 2,    // el filtrado rompe una línea entera
  paseAtras: -1,      // el retroceso de posesión saca al rival de su bloque
  conduccion: 1,      // conducir al espacio gana metros
  paseAlPie: 1,
  robo: 1,            // el robo alto deja la pelota más cerca aún
  duelo: 1,           // el pelotazo ganado por arriba prolonga
  peinada: 2,         // la peinada al espacio deja al que llega de frente
  sprint: 2,          // llegar a la línea de fondo
  filtradoEspalda: 2, // la pelota a la espalda del bloque alto
  avanceRival: -1,    // el rival progresa hacia MI arco
};

/** El área rival (donde se remata y donde se cobra un penal) y la mía. */
export const BOX_OPP = ROWS, BOX_MINE = 1;

/** ¿La pelota está dentro del área rival? Lo pregunta la falta: solo ahí hay penal. */
export const inOppBox = m => (m.field?.v ?? 3) >= BOX_OPP;

/* ── LA ALTURA COMO PALANCA DEL DT ─────────────────────────────────────────────
   Mover el bloque antes del partido y en el entretiempo es GRATIS: ahí el equipo
   está parado y el DT habla. Moverlo CON EL PARTIDO EN JUEGO cuesta una VENTANA
   TÁCTICA: reorganizar veinte metros de líneas en caliente es una
   orden real, no un dial que se toquetea. Las ventanas son un recurso NUEVO y
   propio — no gastan los 3 cambios, y la mentalidad (que es actitud, no
   estructura) sigue siendo gratis e ilimitada.
   ───────────────────────────────────────────────────────────────────────────── */
export const TACTIC_WINDOWS = 3;

/** El sobrecosto físico de jugar alto, en minutos equivalentes POR minuto jugado y
 *  por escalón sobre el bloque medio: correr veinte metros más adelante se paga.
 *  Los bloques bajos no pagan nada (ni cobran: su precio es territorial). */
export const HIGH_FATIGUE = 0.10;

/** ¿Mover el bloque es gratis AHORA? (antes del arranque y en cualquier entretiempo) */
export const heightFree = m => m.min === 0 || !!m.enHalftime;

/** ¿Se puede mover el bloque a `n`? Gratis siempre que lo sea; si no, hace falta ventana. */
export function canChangeHeight(m, n) {
  if (m.finished || clamp(n, 1, 5) === myHeight(m)) return false;
  return heightFree(m) || (m.field?.windows ?? 0) < TACTIC_WINDOWS;
}

/**
 * El DT mueve el bloque. Escribe la orden en matchCtx (donde vive la mentalidad),
 * cobra la ventana si el partido está en juego y lo NARRA — el jugador se entera
 * por el relato, jamás por un número de zona.
 */
export function setHeight(m, n) {
  const destino = clamp(Math.round(n), 1, 5);
  if (!canChangeHeight(m, destino)) return false;
  const antes = myHeight(m);
  m.my.altura = destino;
  const gratis = heightFree(m);
  if (!gratis) m.field.windows = (m.field.windows || 0) + 1;
  const h = heightOf(destino);
  const verbo = destino > antes ? "ADELANTA" : "RETRASA";
  m.log("info", `📢 min ${m.clock()}' — El banco ${verbo} las líneas: ${h.icon} bloque ${h.label.toLowerCase()}. ${h.desc}`);
  return true;
}

/**
 * EL ESPACIO A LA ESPALDA: cuánto se multiplica el riesgo del pelotazo largo que
 * salta a mi línea (el canal `BREAKAWAY_TICK` del Match). Es el precio honesto de
 * jugar alto y el premio de replegarse — la contracara exacta de robar arriba.
 * Neutro (×1) en el bloque medio: el balance medido no se mueve por defecto.
 */
export function backlineRisk(m) {
  const a = myHeight(m) - HEIGHT_DEFAULT;
  // ASIMÉTRICO a propósito (medido): con la pendiente simétrica, replegarse apagaba el
  // canal a ×0.4 y el bloque MUY BAJO salía la mejor estrategia del juego para un
  // favorito — gratis, porque su costo (menos iniciativa, menos robo arriba) no
  // alcanzaba a compensar semejante seguro. Meterse atrás reduce el espacio a la
  // espalda, no lo elimina: siempre habrá un pelotazo.
  return 1 + (a > 0 ? 0.30 : 0.12) * a;
}

/** Acumula el sobrecosto físico del bloque adelantado (lo cobra medical, vía flow). */
function drainHeight(m) {
  const extra = HIGH_FATIGUE * Math.max(0, myHeight(m) - HEIGHT_DEFAULT);
  if (!extra || !m._highMin) return;
  for (const p of m.activeMine()) m._highMin.set(p, (m._highMin.get(p) || 0) + extra);
}

/* ── Salidas para la UI (la vista no conoce ninguna regla) ──────────────────── */

/** Etiqueta humana de un tiempo, para el selector del post-partido. */
const HALF_LABEL = { 45: "1er tiempo", 90: "2do tiempo", 105: "Prórroga", 120: "Prórroga" };

/**
 * Un mapa listo para pintar: 15 celdas con su intensidad 0..1 NORMALIZADA contra
 * la celda más caliente de ESE mapa (como los mapas de calor de las transmisiones:
 * lo que se compara es el reparto dentro del partido, no un absoluto).
 */
export function heatCells(m, side = "mine", mapIdx = -1) {
  const maps = m.field?.maps || [];
  const map = maps[mapIdx < 0 ? maps.length + mapIdx : mapIdx];
  if (!map) return [];
  const raw = map[side === "opp" ? "opp" : "mine"];
  const max = Math.max(...raw, 0);
  const out = [];
  for (let h = 1; h <= LANES; h++)
    for (let v = 1; v <= ROWS; v++)
      out.push({ h, v, i: max > 0 ? raw[cellIdx(h, v)] / max : 0 });
  return out;
}

/** Los tiempos jugados, para que el post-partido pueda ofrecerlos. */
export function heatHalves(m) {
  return (m.field?.maps || []).map((map, i) => ({
    idx: i,
    nominal: map.nominal,
    label: HALF_LABEL[map.nominal] || `${map.nominal}'`,
    vacio: map.mine.every(x => !x) && map.opp.every(x => !x),
  }));
}

/**
 * Lo que la UI necesita para pintar la altura de bloque, sin saber ninguna regla.
 * `rival` es lo que el DT PERCIBE del rival — se comunica con palabras, nunca con
 * el número (objetivo de diseño: la capa numérica es invisible).
 */
export function fieldState(m) {
  const n = myHeight(m);
  const gastadas = m.field?.windows ?? 0;
  return {
    altura: n,
    ...heightOf(n),
    rival: heightOf(oppHeight(m)).label.toLowerCase(),
    zona: `${LANE_NAME[m.field?.h ?? 2]} de ${ROW_NAME[m.field?.v ?? 3]}`,
    gratis: heightFree(m),
    ventanas: TACTIC_WINDOWS - gastadas,
    // Qué se puede elegir AHORA: la UI solo pinta lo que el motor habilita.
    opciones: HEIGHTS.map(h => ({ ...h, actual: h.n === n, puede: canChangeHeight(m, h.n) })),
  };
}
