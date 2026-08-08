/* ============================================================
   game/medical — reglas del cuerpo médico.
   (La tabla de lesiones vive en content/match/injuries.js: contenido
   y regla separados, como manda ARQUITECTURA §3.)
   ============================================================ */
import { rnd } from "../core/rng.js";
import { clamp } from "../core/math.js";
import { INJURY_TYPES } from "../content/match/injuries.js";
import { addJournal } from "./journal.js";

/** Sortea un tipo de lesión ponderado por su probabilidad (`peso`). */
export function rollInjury() {
  const total = INJURY_TYPES.reduce((s, i) => s + i.peso, 0);
  let r = rnd() * total;
  for (const inj of INJURY_TYPES) { r -= inj.peso; if (r <= 0) return inj; }
  return INJURY_TYPES[0];
}

// Cansancio por jugar: −14 de energía cada 30' disputados. Subió de 10 a 14 en el
// rebalance del PO, acoplado a bajar el peso de la energía en el
// rendimiento (match/powers.effStat: 20% en vez de 35%). La idea: el partido vacía más
// rápido (rotar importa) pero estar cansado no te deja inservible — así Entrenar deja de
// ser una trampa sin regalar dificultad. Ver CORE §4 y §Energía.
export const FATIGUE_PER_30 = 14;
// Recuperación del que descansó todo el partido (rotar sigue siendo una estrategia real).
export const REST_RECOVERY = 30;

// SPRINT 4 — interacción cruzada Energía → Lesión: las piernas
// cansadas se rompen más. La escala arranca en FATIGUE_INJURY_FROM (energía 50) y crece
// lineal hasta FATIGUE_INJURY_MAX en el piso de energía (5). Multiplica la probabilidad de
// que un golpe en juego sea GRAVE (match/incidents.injuryEvent), no la frecuencia de golpes:
// el cansancio no provoca más choques, hace que los choques terminen peor.
// Refuerza la rotación del Sprint 3 con una consecuencia que se siente, sin sistemas nuevos.
export const FATIGUE_INJURY_FROM = 50;
export const FATIGUE_INJURY_MAX = 1.8;

/** Multiplicador de gravedad de lesión según la energía del jugador (1.0 sano → 1.8 vacío). */
export function fatigueInjuryMult(energia) {
  const e = energia ?? 100;
  if (e >= FATIGUE_INJURY_FROM) return 1;
  return 1 + (FATIGUE_INJURY_MAX - 1) * (FATIGUE_INJURY_FROM - e) / (FATIGUE_INJURY_FROM - 5);
}

/** Energía perdida por disputar `minutos` (proporcional: −14 cada 30'). */
export function matchFatigue(minutos) { return Math.round(minutos / 30 * FATIGUE_PER_30); }

/** El MISMO dial sin redondear. Lo usa el desgaste minuto a minuto (`Match._drainMine`):
 *  redondear en cada uno de los 90 ticks acumularía un error que el cierre no podría
 *  reconciliar, y el total del partido tiene que ser exactamente `matchFatigue`. */
export const matchFatigueRaw = minutos => (minutos / 30) * FATIGUE_PER_30;

/**
 * QUÉ PARTE DEL CANSANCIO SE SIENTE DENTRO DEL PARTIDO (7-ago-2026).
 *
 * `p.energia` hace DOS trabajos a la vez, y ahí está todo el asunto: es el tanque de
 * TORNEO (lo que decide si hay que rotar, lo que Recuperar rellena) y es la entrada de
 * rendimiento de cada duelo (`powers.energyMult`). El costo de un partido en el tanque
 * es grande a propósito —14 cada 30', o sea 42 puntos por los 90— porque tiene que doler
 * a lo largo de siete partidos. Volcarlo ENTERO minuto a minuto lo hace valer dos veces:
 * un titular que llega a 65 termina el partido en 23, adentro de la parte convexa de la
 * banda verde, que es donde el castigo muerde de verdad. Y no es lo que pasa en un
 * partido de fútbol: el jugador del minuto 90 no rinde a un cuarto del que arrancó — la
 * mayor parte de esos 42 puntos es DESGASTE ACUMULADO, la factura que llega después del
 * pitazo, no el bajón de piernas de la última media hora.
 *
 * Así que el desgaste en vivo cobra esta FRACCIÓN del costo del partido y el resto lo
 * sigue cobrando el cierre. El total por partido no se mueve **ni un punto** (la economía
 * de energía entre partidos queda intacta): esto es el dial de "cuánto se SIENTE", no el
 * de "cuánto cuesta".
 *
 * ── LA ESCALERA MEDIDA (n=4000, BRA, % de título) ──────────────────────────────
 *   share │ piso (azar) │ techo (--smart)
 *   ──────┼─────────────┼────────────────
 *    0    │  7.7 · 8.1  │  27.1 · 27.8     ← control: dos corridas, el ruido a 2σ es ~±0.9
 *    0.2  │  7.5        │  27.6            ← ELEGIDO: las dos puertas en pie
 *    0.35 │  6.1        │  25.2            ← rompe la LEY del techo (−2.2pp)
 *    0.5  │  6.1        │  —
 *    1.0  │  5.1        │  —               ← −3.0pp: fuera del gate de ±2pp
 *
 * Sube más de 0.2 y el juego se pone MÁS DIFÍCIL de verdad, y no solo por el rendimiento:
 * el cruce Energía→Lesión (`fatigueInjuryMult`, arriba) empieza a morder en la segunda
 * mitad de cada partido y el plantel llega diezmado a las rondas finales. Si el PO quiere
 * el efecto más marcado, el precio hay que devolverlo por otro lado — no subir este
 * número solo (precedente FEAT-003: se recorta el efecto, no el gate).
 */
export const LIVE_FATIGUE_SHARE = 0.2;

/**
 * FATIGA DEL RIVAL — el mismo dial, cobrado en otro momento.
 *
 * Hasta hoy el once rival nacía al 100% y JAMÁS bajaba: mi plantel llegaba con la
 * energía que arrastra del torneo (55-70 en un titular fijo) y enfrente siempre había
 * once tipos frescos. La asimetría era deliberada, pero desbalanceada en la dirección
 * equivocada — el rival no paga NADA por jugar.
 *
 * Ahora el rival se cansa DENTRO del partido. No lleva su energía al siguiente (se
 * genera nuevo cada vez, `opponents.genOpponentLineup`), así que el único sitio donde
 * su costo puede morder es el partido en curso. Con el mismo dial que mi equipo, un
 * rival llega al 90' cerca de 58 — arranca más fresco que mis titulares y termina más
 * gastado. Esa es la lectura buscada: al rival fresco hay que aguantarlo; si llegás
 * descansado, lo pasás por arriba en el tramo final.
 *
 * `factor` lo sube El Rondo (Posesión): hacerlos correr detrás de la pelota cuesta
 * piernas de verdad.
 */
export function drainOppEnergy(lineup, minutos, factor = 1) {
  const gasto = (minutos / 30) * FATIGUE_PER_30 * factor;
  for (const p of lineup) {
    if (p.expulsado || p.lesionado) continue;
    p.energia = clamp((p.energia ?? 100) - gasto, 5, 100);
  }
}

/**
 * Parte médica del cierre de partido para UN jugador: energía (jugar CANSA −14 cada 30'
 * jugados; descansar recupera +30), descuento de la baja por lesión y registro en el
 * diario si la lesión de este partido lo deja fuera de los próximos. `minutos` = los que
 * disputó (0 si no jugó), lo calcula el Match.
 *
 * `yaCobrado` es la energía que el PARTIDO ya le fue descontando minuto a minuto
 * (`Match.drainedByName`, 7-ago-2026): acá se cobra solo lo que falte, así el total del
 * partido sigue siendo EXACTAMENTE el mismo dial de siempre y la economía de energía
 * —que es el dial más sensible del juego— no se mueve ni un punto. Sin ese descuento,
 * cada partido cobraría dos veces. Con `yaCobrado = 0` (el default, y lo que pasan los
 * tests que miden el dial en frío) el comportamiento es el histórico.
 */
export function applyMedicalPostMatch(run, p, played, minutos = 0, presionados = 0, yaCobrado = 0) {
  // Los minutos PRESIONADOS cuestan el doble (botón de presión, match/press.js): se cobran
  // una vez como minutos jugados —ya vienen dentro de `minutos`— y una segunda vez acá.
  // El sobrecosto llega ya descontado por Pulmones de Acero, si el DT lo compró.
  // El `max(0, …)` importa: el redondeo del cierre puede quedar por DEBAJO de lo ya
  // cobrado en vivo, y un gasto negativo sería regalar energía por haber jugado.
  const gasto = Math.max(0, matchFatigue(minutos) + matchFatigue(presionados) - yaCobrado);
  // Se redondea acá: entre partidos la energía es un entero (es lo que pinta toda la UI
  // de gestión); dentro del partido corre con decimales para no acumular error.
  p.energia = Math.round(clamp(p.energia + (played ? -gasto : REST_RECOVERY), 5, 100));
  if (p.lesionadoPartidos > 0) p.lesionadoPartidos--;
  // Lesión sufrida en este partido con baja real → queda registrada en el diario
  if (p.lesionado && p.lesionadoPartidos > 0) {
    addJournal(run, { icon: "🚑", tone: "bad", title: `${p.name} lesionado`, desc: `Se pierde ${p.lesionadoPartidos} partido${p.lesionadoPartidos > 1 ? "s" : ""}.` });
  }
  p.lesionado = false;
}
