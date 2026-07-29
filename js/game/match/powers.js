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

// LA CURVA DE ENERGÍA DEL RIVAL (decisión PO 26-jul-2026) — deliberadamente DISTINTA.
// La banda verde de arriba existe para arreglar MI economía: sin ella, Recuperar era
// comprar rendimiento universal a diario y dominaba como estrategia del día (44-47% vs
// mixto 30.5). Pero el rival NO tiene acciones del día, ni recuperación pasiva, ni
// plantel que rotar — se genera nuevo en cada partido. Aplicarle la misma curva
// indulgente era un error de categoría: su fatiga en partido lo dejaba en ~58, y la
// banda valora eso en ×0.9966, o sea nada (medido: la mecánica no se sentía).
// Acá la energía pesa LINEAL desde el primer punto: al 100% rinde igual que siempre y
// se va apagando de verdad según lo hacés correr. Mi banda verde queda intacta.
export const OPP_ENERGY_FLOOR_MULT = 0.81;   // con el tanque vacío (energía 5)
export function oppEnergyMult(en) {
  const e = en !== undefined ? en : 100;
  return 1 - (1 - OPP_ENERGY_FLOOR_MULT) * (clamp(100 - e, 0, 95) / 95);
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
  // `p.rival` marca al once generado (opponents.genOpponentLineup): la asimetría vive en
  // los DATOS, igual que `oxid` y `forma`. Cada lado tiene su curva de energía.
  const enMult = p.rival ? oppEnergyMult(p.energia) : energyMult(p.energia);
  return clamp(v / 20, 0.05, 5.5) * enMult * (p.oxid || 1) * (p.forma || 1);
}

/** Calidad global del arquero: atajadas manda (60%), reflejos (25%) y salidas (15%) complementan. */
export function gkQuality(por, buffs) {
  if (!por) return 1;
  return effStat(por, "atajadas", buffs) * 0.6 + effStat(por, "reflejos", buffs) * 0.25 + effStat(por, "salidas", buffs) * 0.15;
}

/* ── CUÁNTAS BOCAS TIENE CADA LÍNEA (fix del dial de formación, 28-jul-2026) ──────
   EL BUG: cada línea entraba solo PROMEDIADA, así que sumarle un hombre únicamente
   podía BAJAR su promedio (el que entra es peor, o juega fuera de puesto y cobra
   `outOfPosPenalty`) y quitarlo lo SUBÍA, porque quedaba el mejor solo. Resultado
   medido sobre 6 planteles: el dibujo más defensivo daba el mayor `def` en 0 de 6, y
   el más ofensivo el mayor `atk` en 0 de 6 — en 4 de 6 el que más atacaba era el
   3-1-1. Los `hint` de lineup.FORMATIONS ("Todo al ataque", "Defensiva") decían
   exactamente lo contrario de lo que pasaba, y el selector de formación en partido
   dejó el problema a un clic de distancia.

   EL ARREGLO: la fuerza de una línea es CALIDAD × BOCAS. La calidad sigue siendo el
   promedio de siempre (misma fórmula, mismos pesos); las bocas entran con rendimiento
   DECRECIENTE — el tercer defensa suma, pero menos que el segundo. Así el dibujo
   vuelve a ser la palanca que su nombre promete sin convertirse en "meter a todos
   atrás siempre gana".

   Normalizado al 2-1-2 (la "Equilibrada"): con ese dibujo los factores valen 1 y el
   poder es EXACTAMENTE el de antes. Lo que cambia es cómo se desvían los otros cinco.
   ───────────────────────────────────────────────────────────────────────────────── */
/** Exponente del rendimiento decreciente: 0 = las bocas no cuentan (el bug), 1 = lineal. */
export const LINE_POW = 0.5;
/**
 * El MEDIO pesa menos por boca (decisión PO 28-jul): el pase es calidad, no cantidad —
 * tres mediocampistas circulan mejor que uno, pero no el triple. Sin esto el término de
 * pase se comía el atk y el dibujo más ofensivo terminaba siendo el 1-3-1, no el 1-1-3.
 * Con 0.25 todavía ganaba el 1-2-2 en 5 de 10 planteles; con 0.15 el 1-1-3 manda claro.
 */
const MED_POW = 0.15;
/**
 * CUÁNTA GENTE EMPUJA DE VERDAD HACIA ADELANTE: el delantero cuenta entero y el
 * mediocampista la mitad. Es la pieza que hace verdadero el "Todo al ataque" del 1-1-3
 * (decisión PO): amontonar delanteros TIENE que ser el dibujo más ofensivo. Antes no lo
 * era —ni siquiera con el arreglo de bocas— porque los seis dibujos con un solo defensa
 * mandan los mismos cinco hombres arriba, y el promedio de tiro no sube al empujarlos
 * (el plantel tiene 2-3 delanteros de verdad; el resto sube castigado por fuera de puesto).
 */
const MED_ATK_SHARE = 0.35;
const atkBodies = (nDel, nMed) => nDel + MED_ATK_SHARE * nMed;
/**
 * Y EL ESPEJO ATRÁS: el mediocampista también TAPA. Sin esto los tres dibujos de un solo
 * defensa daban exactamente la misma defensa (3.47 medido), como si tres delanteros
 * protegieran igual que tres medios — y el 1-3-1 quedaba estrictamente DOMINADO por el
 * 2-1-2 (peor atk y peor def a la vez), o sea una opción trampa que nadie debería elegir.
 *
 * 0.45 salió de barrer los diales (60 combinaciones × 10 planteles) contra cuatro
 * criterios a la vez: el 1-1-3 el que más ataca (10/10) y el que menos defiende (10/10),
 * el 3-1-1 entre los dos que más defienden (10/10) y por encima de TODOS los dibujos de
 * un defensa (9/10), y NINGÚN dibujo dominado. Es alto a propósito: tres medios tapan
 * de verdad. Que el 2-2-1 le gane la defensa al 3-1-1 en 4 de 10 planteles no es un
 * error — es que sin un tercer central de verdad, poner tres atrás sale peor.
 */
const MED_DEF_SHARE = 0.45;
const defBodies = (nDef, nMed) => nDef + MED_DEF_SHARE * nMed;
/**
 * Tamaño de línea de REFERENCIA: el 2-1-2, la "Equilibrada". Con ese dibujo los tres
 * factores valen exactamente 1 y el poder es idéntico al de antes del arreglo — lo que
 * cambia es cómo se desvían los otros cinco. El de ataque se DERIVA de atkBodies para
 * que no se desincronice si algún día se toca MED_ATK_SHARE.
 */
const LINE_BASE = { def: defBodies(2, 1), atk: atkBodies(2, 1), med: 1 };
/** Factor de bocas de una línea de `n` hombres contra su tamaño de referencia. */
const bodies = (n, base, pow = LINE_POW) => (n <= 0 ? 0 : (n / base) ** pow);

/** Poder ofensivo y defensivo (~0-5) de una alineación, con mentalidad y castigo por expulsados. */
export function teamPowers(lineup, mentalidad, buffs) {
  // Reparto por el puesto que JUEGA cada uno (no el natural): si el DT paró a un
  // delantero de defensa, ese delantero alimenta el poder defensivo — castigado.
  const act = lineup.filter(p => !p.expulsado && !p.lesionado);
  const por = act.find(p => playedPos(p) === "POR");
  const atkP = act.filter(p => playedPos(p) === "DEL" || playedPos(p) === "MED");
  const medP = act.filter(p => playedPos(p) === "MED");
  const delP = act.filter(p => playedPos(p) === "DEL");
  const defP = act.filter(p => playedPos(p) === "DEF");
  const avg = (ps, k) => ps.length ? ps.reduce((s, p) => s + effStat(p, k, buffs), 0) / ps.length : 1;
  const auraAll = avg(act, "aura");
  // Calidad × bocas, línea por línea. El aura y el arquero NO llevan factor: no son
  // una línea (el aura es del equipo entero y el arquero es siempre uno).
  const bAtk = bodies(atkBodies(delP.length, medP.length), LINE_BASE.atk);
  const bMed = bodies(medP.length, LINE_BASE.med, MED_POW);
  const bDef = bodies(defBodies(defP.length, medP.length), LINE_BASE.def);
  let atk = avg(atkP, "tiro") * 0.4 * bAtk + avg(medP, "pase") * 0.3 * bMed + avg(atkP, "cabezazo") * 0.12 * bAtk + auraAll * 0.18;
  let def = avg(defP, "defensa") * 0.52 * bDef + gkQuality(por, buffs) * 0.32 + auraAll * 0.16;
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
