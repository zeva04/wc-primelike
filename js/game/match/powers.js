/* ============================================================
   game/match/powers — fórmulas de poder del partido
   (docs/CORE.md §4-5). Sin estado, sin azar.
   ============================================================ */
import { clamp } from "../../core/math.js";
import { effectiveStat, playedPos } from "../ratings.js";

// Modificadores de la mentalidad táctica (en escala normalizada ~0-5)
export const MENT_MOD = { defensiva: { atk: -0.5, def: +0.6 }, normal: { atk: 0, def: 0 }, ofensiva: { atk: +0.6, def: -0.5 } };

// BANDA VERDE de energía (arco del Meta M1, decisión PO 22-jul-2026): sobre el umbral
// la energía NO pesa — un plantel al 75% juega como al 100%. Bajo el umbral el castigo
// crece LINEAL hasta el piso (×0.75 con el tanque vacío, energía 5). Reemplaza al peso
// lineal del 20% (rebalance del 20-jul): con poder lineal, Recuperar era comprar
// rendimiento universal a diario y dominaba como estrategia fija (44-47% vs mixto 30.5,
// BRA n=4000). La banda convierte a Recuperar en lo que manda la tesis del arco: el
// SEGURO para volver a la banda, no una ventaja que se acumula. Ver CORE §4/§Energía.
// 70→65 (M1, decisión PO con diag): los titulares fijos del juego mixto convergen a
// 60-75 (−42/partido ≈ +pasiva de la ventana), justo BAJO el umbral 70 — con 70, el
// siempre-recuperador (100% en banda) les sacaba ~12pp de título. Bajar a 65 mete a esa
// masa en la banda sin regalarle nada al que ya vive al 100%.
export const ENERGY_OK = 65;
export const ENERGY_FLOOR_MULT = 0.75;
/** Multiplicador de rendimiento por energía: ×1.0 dentro de la banda verde (≥ENERGY_OK),
 *  cayendo CONVEXO (cuadrático) hasta ×ENERGY_FLOOR_MULT en el piso de energía (5).
 *  Convexa y no lineal (M1, decisión PO tras medir): rozar la banda es casi gratis
 *  (60 → ×0.998) pero estar fundido de verdad duele (30 → ×0.91, 5 → ×0.75). Con la
 *  rampa lineal, el castigo chico de la masa de titulares que vive en 55-68 componía
 *  ~12pp de título a favor de recuperar a diario — el título compone 6 jugadores ×
 *  7 partidos × ~30 secuencias, y ese interés compuesto era el reinado de Recuperar. */
export function energyMult(en) {
  const e = en !== undefined ? en : 100;
  if (e >= ENERGY_OK) return 1;
  const x = (ENERGY_OK - e) / (ENERGY_OK - 5);
  return 1 - (1 - ENERGY_FLOOR_MULT) * x * x;
}

// OXIDACIÓN (arco del Rebalance R1, decisión PO 22-jul-2026): el ESPEJO de la banda
// verde — un plantel que no trabaja pierde filo. La racha de días de preparación sin
// Entrenar ni Sesión Táctica (game/oxidation la trackea en run.diasSinEntrenar y la
// estampa como `p.oxid` en el plantel) enciende un multiplicador < 1 sobre effStat.
// JUGAR TAMBIÉN RESETEA ("jugar es ritmo", decisión PO): por eso la curva entera vive
// comprimida entre racha 3 y 5 — las ventanas son de 4-5 días de preparación (calendar,
// ri(5,6)) y la racha máxima real ES la ventana. La oxidación no es un estado crónico:
// es CÓMO LLEGAS al partido. El siempre-recuperador llega SIEMPRE oxidado (racha 4-5,
// ×0.93/×0.85); el mixto azar casi nunca (P(racha≥3)≈0.8%); el smart jamás (nunca
// encadena 3 días sin entrenar). Es la respuesta a la tesis del arco: no nerfear el
// botón de Recuperar — hacer que NO CONSTRUIR deje de ser gratis (ROADMAP-rebalance §A).
export const OXID_THRESHOLD = 3;   // días seguidos sin entrenar que encienden el óxido
export const OXID_FLOOR_AT = 5;    // racha donde toca el piso (= ventana larga completa)
// 0.85 → 0.82 (R2, decisión PO 22-jul): con la escalada de rivales el recuperador quedó
// en 16.6 y la tesis manda 10-15 — el piso del óxido es SU palanca quirúrgica (mixto y
// smart no la pisan, medido en R1: −1.5pp máx de derrame). Combinado banda×óxido: ×0.615.
export const OXID_FLOOR_MULT = 0.82;
/** Multiplicador de rendimiento por oxidación: ×1.0 bajo el umbral (racha < 3), cayendo
 *  CONVEXO (cuadrático, como la banda: el 3er día casi gratis ×0.983, el 5º duele ×0.85)
 *  hasta ×OXID_FLOOR_MULT en racha 5+. El piso combinado banda×oxidación es
 *  0.75 × 0.85 = ×0.6375 — fijado en unitario (tests/oxidation.test.js). */
export function oxidMult(racha) {
  const r = racha || 0;
  if (r < OXID_THRESHOLD) return 1;
  const x = Math.min(1, (r - (OXID_THRESHOLD - 1)) / (OXID_FLOOR_AT - (OXID_THRESHOLD - 1)));
  return 1 - (1 - OXID_FLOOR_MULT) * x * x;
}

/**
 * Stat efectiva normalizada a ~0-5 (stat 1-99 ÷ 20), con buffs (escala 1-99) y castigo por energía.
 * Parte de `effectiveStat`, así que el castigo por jugar fuera de puesto entra al partido
 * por el mismo caño que ve el DT en la ficha (docs/CORE.md §2b).
 * El castigo por energía es la banda verde (`energyMult`): plano arriba, lineal abajo.
 * La oxidación (R1) entra por el MISMO patrón que la banda — un campo del jugador
 * (`p.oxid`, estampa game/oxidation al cambiar la racha): así llega a TODOS los duelos
 * (secuencias, penales, ocasiones) sin tocar cada llamada. El rival nunca lo tiene (×1):
 * la asimetría vive en los datos, igual que `energia`.
 */
export function effStat(p, key, buffs = {}) {
  let v = effectiveStat(p, key);
  if (buffs[key]) v += buffs[key];
  // p.forma (R2): la FORMA DE TORNEO del rival en KO (opponents.tourneyFormaMult) — la
  // asimetría espejo de p.oxid: solo el once rival la lleva, mis jugadores nunca.
  return clamp(v / 20, 0.05, 5.5) * energyMult(p.energia) * (p.oxid || 1) * (p.forma || 1);
}

/** Calidad global del arquero: atajadas manda (60%), reflejos (25%) y salidas (15%) complementan. */
export function gkQuality(por, buffs) {
  if (!por) return 1;
  return effStat(por, "atajadas", buffs) * 0.6 + effStat(por, "reflejos", buffs) * 0.25 + effStat(por, "salidas", buffs) * 0.15;
}

/** Poder ofensivo y defensivo (~0-5) de una alineación, con mentalidad y castigo por expulsados. */
export function teamPowers(lineup, mentalidad, buffs) {
  // Reparto por el puesto que JUEGA cada uno (no el natural): si el DT paró a un
  // delantero de defensa, ese delantero alimenta el poder defensivo — castigado.
  const act = lineup.filter(p => !p.expulsado && !p.lesionado);
  const por = act.find(p => playedPos(p) === "POR");
  const atkP = act.filter(p => playedPos(p) === "DEL" || playedPos(p) === "MED");
  const defP = act.filter(p => playedPos(p) === "DEF");
  const avg = (ps, k) => ps.length ? ps.reduce((s, p) => s + effStat(p, k, buffs), 0) / ps.length : 1;
  const auraAll = avg(act, "aura");
  let atk = avg(atkP, "tiro") * 0.4 + avg(act.filter(p => playedPos(p) === "MED"), "pase") * 0.3 + avg(atkP, "cabezazo") * 0.12 + auraAll * 0.18;
  let def = avg(defP, "defensa") * 0.52 + gkQuality(por, buffs) * 0.32 + auraAll * 0.16;
  const m = MENT_MOD[mentalidad] || MENT_MOD.normal;
  atk += m.atk; def += m.def;
  // El buff de la Sesión Táctica MURIÓ acá (arco de Filosofía F1, decisión PO):
  // la táctica ya no compra atk/def — construye la identidad, que sesga el pool
  // de secuencias (match/sequences.typeWeights), no el poder.
  // jugar con menos hombres castiga (formato 6v6)
  const missing = 6 - act.length;
  if (missing > 0) { atk *= (1 - 0.18 * missing); def *= (1 - 0.15 * missing); }
  return { atk: Math.max(0.5, atk), def: Math.max(0.5, def), por };
}
