/* ============================================================
   game/match/actions — Football Actions: los
   bloques de juego reutilizables con los que se arman las
   secuencias. Cada uno resuelve UN gesto (pase, regate, remate,
   presión, corte, atajada) sobre `effStat` y devuelve un
   resultado ESTRUCTURADO — NO narra ni muta el marcador. La
   narración y el hilo (escalar/cerrar) los maneja sequences.js;
   los goles los anota chances.goalMine/goalOpp. Así una misma
   acción sirve en cualquier tipo de secuencia y se testea sola.

   Las fórmulas están ANCLADAS a las de chances.js (las ocasiones
   sueltas que las secuencias reemplazan): la intención de A1 es
   "menos momentos interactivos y más largos", NO "otra matemática
   de gol". Si el gate deriva, el dial es el número de secuencias
   (sequences.js), no estos números — salvo que la deriva venga de
   acá, medido.
   ============================================================ */
import { rnd } from "../../core/rng.js";
import { clamp } from "../../core/math.js";
import { teamRating } from "../ratings.js";
import { effStat } from "./powers.js";
import { notePass } from "./stats.js";
import { noteMomentum } from "./match-momentum.js";

/** Nota de ataque del rival, escala 0..5 (misma que usaban las ocasiones sueltas). */
function oppR(m) { return teamRating(m.oppTeam) / 20; }

/**
 * Pase entre dos de los míos. `hard` = pase filtrado de riesgo (menos probable, pero en
 * una secuencia habilita un remate mejor). Espejo de la rama "pass" de resolveChance
 * (0.35 + pase·0.11), con el filtrado un poco más exigente.
 *
 * ODISEA: el pase filtrado es el que ROMPE LÍNEAS — lo mide `pase_largo`; el
 * pase de circulación lo mide `pase_corto`. Es el primer sitio del motor donde el split
 * ya significa algo, y el patrón que va a seguir el resto en la segunda mitad del sprint.
 */
export function actPass(m, from, { hard = false, bonus = 0 } = {}) {
  const base = hard ? 0.58 : 0.38;
  const key = hard ? "pase_largo" : "pase_corto";
  const p = clamp(base + effStat(from, key, m.my.buffs) * (hard ? 0.06 : 0.11) + bonus, 0.2, 0.92);
  const ok = rnd() < p;
  notePass(m, "mine", ok);   // el pase que el DT eligió también entra al panel de stats
  // Match Momentum: el pase SEGURO no mueve la aguja (pesa 0) y el filtrado que sale la
  // mueve mucho. Ahí está el "possession value": diez laterales no son una jugada.
  noteMomentum(m, ok ? (hard ? "romperLineas" : "paseProgresivo") : "paseFallado");
  return { ok, hard };
}

/**
 * Regate/individual de un mío. Puede salir (ok), terminar en falta a favor → penal
 * (foul), o perderse. Espejo de la rama "solo" de resolveChance (aura·0.075 + 12% penal).
 * `bonus`: conducir con la cancha ROTA es más fácil — el 2º tramo del Contragolpe
 * letal lo usa (adv.carryEase): el rival partido y de espaldas no es una defensa plantada.
 */
/** `foulPlus` (Skiller, Contra): a ese no lo frenan limpio — la ventana de FALTA a favor
 *  se ensancha (el 12% de siempre más lo que traiga el rasgo). */
export function actDribble(m, p, { bonus = 0, foulPlus = 0 } = {}) {
  // ODISEA (2ª mitad): conducir al espacio es carisma Y PIERNAS. El aura cedió parte de
  // su peso a la velocidad manteniendo el mismo valor esperado en un jugador promedio
  // (aura 70 / vel 70 daba 0.313; ahora 0.323): el que cambia es el perfil, no el ritmo
  // de gol — el extremo veloz conduce mejor que el 10 lento, que antes iban iguales.
  const pr = clamp(0.05 + effStat(p, "aura", m.my.buffs) * 0.048
    + effStat(p, "velocidad", m.my.buffs) * 0.028 + bonus, 0.05, 0.65);
  const roll = rnd();
  const out = { ok: roll < pr, foul: roll >= pr && roll < pr + 0.12 + foulPlus };
  noteMomentum(m, out.ok ? "conduccion" : out.foul ? "paseProgresivo" : "conduccionFallada");
  return out;
}

/**
 * Remate de un mío. `stat` (tiro/cabezazo) y `bonus` (una buena construcción o una
 * transición limpia dejan mejor perfil de remate). Espejo del remate automático de
 * myChance (0.12 + q·0.085 − oppR·0.035), que es el que fija el ritmo de gol del juego.
 * Devuelve solo si fue gol; anotar es cosa de sequences.js (goalMine con su asistidor).
 * Cuenta el tiro en m.stats — EL punto único de conteo de los remates de secuencia
 * (excepción documentada al "no muta": stats no es marcador; cuentan también los
 * remates ambiente y el panel post-partido sub-reportaba desde A1 — bug T3).
 */
export function actShot(m, p, { stat = "tiro", bonus = 0 } = {}) {
  m.stats.misTiros++;
  noteMomentum(m, "remate");   // el pico del gráfico (el gol suma aparte, en chances)
  const q = effStat(p, stat, m.my.buffs);
  // El remate de definición de una secuencia es una ocasión construida: base más alta que el
  // remate ambiente (espejo del antiguo "shoot" interactivo, 0.14 + q·0.09).
  const pg = clamp(0.15 + q * 0.09 + bonus - oppR(m) * 0.035, 0.05, 0.66);
  return { ok: rnd() < pg };
}

/**
 * Remate del rival ante mi defensa (secuencias defensivas). `ok` = gol rival. Espejo
 * del remate automático de oppChance (arquero + zaga pesan). `stat` permite el cabezazo
 * (balón parado en contra) y `bonus` el perfil (un rival mejor parado remata mejor).
 * Cuenta el tiro rival en m.stats (punto único, espejo de actShot — bug T3).
 */
export function actOppShot(m, shooter, mine, { stat = "tiro", bonus = 0 } = {}) {
  m.stats.oppTiros++;
  noteMomentum(m, "remate", "opp");
  const q = effStat(shooter, stat);
  const porQ = mine.por ? (effStat(mine.por, "atajadas", m.my.buffs) * 0.65 + effStat(mine.por, "reflejos", m.my.buffs) * 0.35) : 1;
  const pg = clamp(0.12 + q * 0.08 + bonus - porQ * 0.06 - (mine.def - 2.5) * 0.04, 0.05, 0.6);
  const ok = rnd() < pg;
  if (!ok) noteMomentum(m, "atajada");   // el peligro se apaga: el mérito vuelve a ser mío
  return { ok };
}

/**
 * Duelo aéreo de un mío (pelotazo largo, balón parado): gana la pelota o la pierde.
 * Pesa el CABEZAZO — la stat que casi no jugaba — contra la zaga rival. `handicap` resta
 * probabilidad (la peinada al espacio es más difícil que ganar el choque frontal).
 */
export function actAerial(m, p, { handicap = 0 } = {}) {
  const q = effStat(p, "cabezazo", m.my.buffs);
  const pw = clamp(0.42 + q * 0.08 - oppR(m) * 0.03 - handicap, 0.15, 0.78);
  const ok = rnd() < pw;
  noteMomentum(m, ok ? "duelo" : "dueloPerdido");
  return { ok };
}

/**
 * Intento de MI equipo de cortar la construcción rival (contener/presionar en un
 * repliegue). `press` = salir a presionar arriba: corta más, pero si falla el rival
 * queda mejor perfilado (lo escala sequences.js). `bonus` suma probabilidad — la
 * recuperación alta (MI iniciativa, con el rival saliendo de su arco) roba más que
 * la contención de emergencia con el rival lanzado. `ok` = corté la jugada.
 */
/**
 * LA CARRERA POR LA BANDA (Odisea, 2ª mitad): el extremo tira el sprint por afuera contra
 * el lateral que lo persigue. Es el primer duelo del motor que enfrenta VELOCIDAD contra
 * VELOCIDAD — hasta acá la stat solo pesaba en la media. `chaser` es el rival que corre
 * con él (sin él, se usa la nota del rival como proxy); `handicap` encarece el intento
 * (llegar a la línea de fondo es más difícil que ganar un metro y centrar).
 */
export function actSprint(m, p, { chaser = null, handicap = 0, bonus = 0 } = {}) {
  const v = effStat(p, "velocidad", m.my.buffs);
  const vd = chaser ? effStat(chaser, "velocidad") : oppR(m) * 0.9;
  const pw = clamp(0.50 + (v - vd) * 0.10 + bonus - handicap, 0.15, 0.88);
  const ok = rnd() < pw;
  noteMomentum(m, ok ? "conduccion" : "conduccionFallada");
  return { ok };
}

/**
 * EL CENTRO AL ÁREA (Odisea, 2ª mitad): el envío desde la banda. El centro alto mide
 * `pase_largo` (y termina en un duelo aéreo); el pase atrás rasante mide `pase_corto`
 * (y termina en un remate de frente). Es el sitio donde el split de pase decide QUÉ
 * jugada se juega, no solo con cuánta probabilidad.
 */
export function actCross(m, from, { rasante = false, bonus = 0 } = {}) {
  const q = effStat(from, rasante ? "pase_corto" : "pase_largo", m.my.buffs);
  const p = clamp((rasante ? 0.40 : 0.34) + q * (rasante ? 0.085 : 0.095) + bonus, 0.2, 0.9);
  const ok = rnd() < p;
  notePass(m, "mine", ok);
  noteMomentum(m, ok ? "centro" : "paseFallado");
  return { ok, rasante };
}

export function actContain(m, mine, { press = false, bonus = 0, chase = null } = {}) {
  const base = press ? 0.30 : 0.42;
  // ODISEA (2ª mitad): `chase` es la velocidad media de MI línea defensiva (0..5, la
  // calcula el resolver del acto). Replegar es llegar: una zaga rápida cierra el espacio
  // que una lenta regala. Pesa poco a propósito —el corte lo sigue decidiendo la
  // defensa— pero convierte a un central lento en un problema real.
  const legs = chase === null ? 0 : (chase - 2.5) * 0.035;
  const p = clamp(base + bonus + legs + (mine.def - 2.5) * 0.06, 0.18, 0.78);
  const ok = rnd() < p;
  // Cortar la jugada rival devuelve el partido; que te la rompan lo entrega.
  noteMomentum(m, ok ? (press ? "presionExitosa" : "recuperacionAlta") : "presionSuperada");
  return { ok, press };
}
