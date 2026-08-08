/* ============================================================
   game/match/match-momentum — EL MATCH MOMENTUM (PO).

   El gráfico de barras de las transmisiones: quién está ejerciendo
   más peligro AHORA. No es posesión, no son tiros, no es xG.

   OJO CON EL NOMBRE: `game/momentum.js` (sin match-) es otra cosa
   completamente distinta — el MOMENTO del jugador (su racha, 1..7,
   que sí escala stats). Esto no lo toca ni lo lee.

   ── LA REGLA DE ORO ────────────────────────────────────────────
   El Match Momentum **refleja** el partido, no lo genera. Es una
   SALIDA del simulador:
     · no consume `rnd` — ni una sola tirada, a propósito: si
       consumiera azar correría el flujo del RNG y le movería los
       diales al balance calibrado (la lección de A1/A2/A3);
     · no escribe nada que el simulador lea (vive entero en
       `m.mm`, que ningún otro módulo consulta);
     · no sube porque el DT apretó un botón. Presionar deja una
       MARCA en el gráfico, nunca puntos: el momentum sube solo si
       esa presión produjo mejores secuencias de juego.
   Si alguna vez algo de esto deja de ser cierto, el gráfico pasó
   de ser un espejo a ser una regla, y el balance se movió.
   ───────────────────────────────────────────────────────────────

   MODELO. Una variable `now` en [-100, +100] (+ = mi equipo). Cada
   acción del simulador la empuja un poco (WEIGHTS, abajo) y cada
   minuto decae hacia 0: eso ES la ventana móvil — un evento pesa
   ~29% cinco minutos después (0.78^5), así que el gráfico habla
   siempre del pasado reciente y un cambio táctico se ve enseguida.

   VALOR DE POSESIÓN: no hace falta código aparte. Una secuencia
   larga acumula porque CADA acto suma (pase progresivo → romper
   líneas → conducción → remate); diez pases laterales no suman
   nada porque el pase seguro vale 0. La escalera de actos del
   Bible §7 ya es la cadena de valor.

   GRÁFICO: al cerrar cada minuto se guarda una barra con el
   PROMEDIO de `now` durante ese minuto (no su último valor: un
   pico de un segundo no debe pintar el minuto entero).
   ============================================================ */
import { clamp } from "../../core/math.js";

/** Techo/piso de la variable: ±100 = dominio absoluto (rarísimo, y así debe ser). */
export const MM_MAX = 100;

/**
 * Escala del DIBUJO (solo la usa momentumBars, el modelo no se entera). El modelo llega
 * a ±100, pero los partidos reales no viven ahí: medido sobre 400 partidos, el pico
 * máximo de un partido tiene mediana 29 y tope 60. Dividiendo por 100 el gráfico quedaba
 * planchado contra la línea del cero. Con 50, un dominio normal llena media altura y los
 * picos excepcionales saturan arriba — que es exactamente lo que hace un gráfico de
 * transmisión. Cambiar esto NO cambia el modelo ni el asistente: solo cuánto se ve.
 */
export const MM_DISPLAY = 50;

/**
 * Cuánto decae por minuto. 0.78 deja la ventana efectiva en ~5 minutos
 * (0.78^5 ≈ 0.29): lo bastante corto para que una sustitución se note, lo
 * bastante largo para que un dominio sostenido se lea como una meseta.
 */
export const MM_DECAY = 0.78;

/**
 * EL PESO DE CADA ACCIÓN. Positivo = a favor de quien la ejecuta; el signo lo
 * pone `noteMomentum` según el lado. Están ordenados por lo que significan en
 * fútbol, no por magnitud: lo que importa es que un remate al arco pese mucho
 * más que un pase y que un pase lateral no pese nada.
 */
export const MM_W = {
  // Construcción
  paseSeguro: 0,          // pase lateral entre defensores: no pasa nada
  paseProgresivo: 3,      // pase al pie que hace avanzar la jugada
  romperLineas: 6,        // el filtrado que deja atrás una línea
  paseFallado: -3,
  conduccion: 2,          // conducción progresiva
  conduccionFallada: -3,
  duelo: 4,               // duelo aéreo ganado / pelota que queda
  dueloPerdido: -2,
  // Presión y recuperación
  presionExitosa: 3,
  presionSuperada: -3,
  recuperacionAlta: 2,
  perdidaEnSalida: -5,    // balón perdido saliendo desde el fondo
  // Peligro
  centro: 5,
  corner: 4,
  remate: 8,              // remate: el pico del gráfico
  atajada: 6,             // gran atajada: el peligro se apaga y el mérito es del que ataja
  penal: 12,
  contraataque: 8,        // el rival sale lanzado con la cancha partida
  gol: 25,
  // Disciplina (el que se queda con uno menos cede el partido)
  roja: 10,
};

/** El estado que cuelga de cada Match. Solo lo lee la UI. */
export const newMomentum = () => ({
  now: 0,          // la variable, -100..+100 (+ = mío)
  bars: [],        // una por minuto cerrado: {min, val, half, marks:[emoji]}
  _samples: [],    // valores de `now` dentro del minuto en curso (para el promedio)
  _marks: [],      // marcas pendientes del minuto en curso
  _lastTalk: -99,  // minuto del último comentario del asistente (para no spamear)
  _talks: 0,       // cuántas veces habló (rota la frase sin usar azar)
  talk: null,      // lo ÚLTIMO que dijo el asistente {min, text} — su sitio en la pantalla
});

/**
 * Una acción del partido empuja el momentum. `key` es una entrada de MM_W y
 * `side` quién la ejecutó ("mine" | "opp"): el lado solo define el SIGNO.
 * Es idempotente respecto del simulador — no devuelve nada que nadie use.
 */
export function noteMomentum(m, key, side = "mine") {
  const mm = m.mm;
  if (!mm) return;
  const w = MM_W[key];
  if (!w) return;                                   // peso 0 (pase seguro): ni se registra
  mm.now = clamp(mm.now + (side === "opp" ? -w : w), -MM_MAX, MM_MAX);
  mm._samples.push(mm.now);
}

/**
 * Una MARCA sobre el gráfico (gol, tarjeta, cambio, lesión, decisión táctica):
 * el jugador tiene que poder relacionar un quiebre del momentum con lo que pasó.
 * No mueve la variable — eso es cosa de noteMomentum.
 */
export function markMomentum(m, icon) {
  // Se DEDUPLICA dentro del minuto a propósito: dos amarillas seguidas (o dos goles en el
  // mismo minuto) apilarían iconos sobre una barra de 3 píxeles. El gráfico dice QUÉ pasó
  // en ese minuto, no cuántas veces — para el detalle está el relato.
  if (m.mm && !m.mm._marks.includes(icon)) m.mm._marks.push(icon);
}

/**
 * Cierra el minuto que termina: guarda su barra (el PROMEDIO de la variable
 * durante ese minuto, o su valor si no pasó nada) con sus marcas, y decae.
 * Lo llama Match.tick ANTES de avanzar el reloj, así los actos de una secuencia
 * —que se resuelven con el reloj congelado— caen en el minuto que les toca.
 */
export function closeMinute(m) {
  const mm = m.mm;
  if (!mm || m.min < 1) return;
  const val = mm._samples.length
    ? mm._samples.reduce((s, v) => s + v, 0) / mm._samples.length
    : mm.now;
  mm.bars.push({ min: m.min, val, half: m.nominal, marks: mm._marks });
  mm._samples = [];
  mm._marks = [];
  mm.now *= MM_DECAY;
}

/**
 * Tendencia de los últimos `n` minutos: el promedio de sus barras. Es lo que lee
 * el asistente (y lo que el jugador ve sin darse cuenta al mirar el gráfico).
 */
export function momentumTrend(m, n = 5) {
  const bars = m.mm?.bars || [];
  const last = bars.slice(-n);
  if (!last.length) return 0;
  return last.reduce((s, b) => s + b.val, 0) / last.length;
}

/* ── EL ASISTENTE TÉCNICO ──────────────────────────────────────────────────
   Lee la tendencia y la traduce a fútbol. NUNCA dice un número: dice qué está
   pasando, que es lo que diría el ayudante desde el banco. Las condiciones
   miran también el marcador porque "dominamos" significa cosas distintas
   ganando 2-0 que perdiendo 0-1.
   Elegir la frase NO usa `rnd` (ver la regla de oro): rota por minuto.

   Las frases se guardan LIMPIAS (sin el "🎧 El ayudante:") porque desde el
   rediseño del partido tienen sitio propio en pantalla —el slot al pie del
   Centro de mando, que ya dice de quién es la voz— y ahí el prefijo sobra.
   `assistantLine` sigue devolviendo la línea decorada: es lo que espera quien
   la quiera narrar (y lo que el test del asistente verifica). */
const TALK = [
  {
    when: (t, m) => t > 22 && m.gMy <= m.gOpp,
    lines: [
      "Los tenemos contra su arco. Falta el último pase, nada más.",
      "Estamos dominando pero no conseguimos finalizar. Insistan.",
      "El partido es nuestro. Si seguimos así, cae.",
    ],
  },
  {
    when: t => t > 22,
    lines: [
      "Recuperamos el control del mediocampo. Ahora hay que administrar.",
      "Los pasamos por encima. No aflojen.",
    ],
  },
  {
    when: (t, m) => t < -22 && m.min >= 70,
    lines: [
      "Nos están encerrando y quedan minutos. Hay que cortar el partido.",
      "No salimos de nuestro campo. Esto se va a romper si no cambiamos algo.",
    ],
  },
  {
    when: t => t < -22,
    lines: [
      "Nos están encerrando desde hace varios minutos.",
      "Ellos crecieron. No estamos llegando ni a la mitad de cancha.",
      "Nos comieron el medio. Hay que ajustar algo.",
    ],
  },
  {
    when: (t, m) => Math.abs(t) < 6 && m.min >= 60,
    lines: [
      "Partido trabado, no se saca ventaja ninguno. Lo va a definir un detalle.",
      "Está todo en el medio. El que se anime primero se lo lleva.",
      "Nadie encuentra el partido. Habría que mover algo del banco.",
    ],
  },
];

/** Cada cuántos minutos, como mucho, habla el asistente (para que no sea ruido). */
export const MM_TALK_EVERY = 12;

/**
 * ¿Tiene algo que decir el asistente en este minuto? Devuelve la línea o null.
 * Pide una tendencia SOSTENIDA (5 minutos de barras) y respeta el silencio
 * mínimo: el valor de estas frases es que se sientan ganadas.
 *
 * Deja además lo dicho en `mm.talk` ({min, text} sin decorar): el slot del
 * asistente lo muestra hasta que haya algo nuevo, así el consejo no se lo lleva
 * el scroll del relato tres segundos después de aparecer.
 */
export function assistantLine(m) {
  const mm = m.mm;
  if (!mm || mm.bars.length < 5 || m.min - mm._lastTalk < MM_TALK_EVERY) return null;
  const t = momentumTrend(m, 5);
  const rule = TALK.find(r => r.when(t, m));
  if (!rule) return null;
  mm._lastTalk = m.min;
  // Sin azar: rota por CUÁNTAS VECES habló, no por el minuto (con el minuto, un pool de
  // una sola frase repetía siempre la misma y dos pools distintos podían sincronizarse —
  // se vio en el navegador: tres «partido trabado» idénticos en un partido).
  const text = rule.lines[mm._talks++ % rule.lines.length];
  mm.talk = { min: m.min, text };
  return `🎧 El ayudante: «${text}»`;
}

/**
 * Lo que la UI necesita para pintar, sin saber ninguna regla: las barras ya
 * normalizadas a 0..1 (`h`), de qué lado va cada una y sus marcas.
 */
export function momentumBars(m) {
  return (m.mm?.bars || []).map(b => ({
    min: b.min,
    half: b.half,
    mine: b.val >= 0,
    h: Math.min(1, Math.abs(b.val) / MM_DISPLAY),
    marks: b.marks,
  }));
}
