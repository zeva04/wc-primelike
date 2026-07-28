/* ============================================================
   tests/press — EL BOTÓN DE PRESIÓN (decisión PO 25-jul-2026).

   Lo que se fija acá: el ciclo ráfaga → recarga → ráfaga medido en
   MINUTOS DE PARTIDO (no en reloj de pared), el tope de usos, y que
   los minutos presionados se cobren DOBLE en energía — con Pulmones
   de Acero abaratando SOLO ese sobrecosto.
   ============================================================ */
import { loadEngine } from "./load-engine.js";

const { Engine: E } = await loadEngine();

let checks = 0, fails = 0;
const assert = (cond, msg, extra = "") => { checks++; if (!cond) { fails++; console.error("FAIL:", msg, extra ?? ""); } };

/** Un Match mínimo pero real (el mismo patrón que traits.test). */
function makeMatch(oppId = "ARG", rasgos = []) {
  const run = E.newRun("BRA");
  const { lineup } = E.currentLineup(run.squad, null, null);
  const bench = run.squad.filter(p => !lineup.includes(p));
  return new E.Match({ team: E.getTeam("BRA"), lineup, bench, mentalidad: "normal", buffs: {},
    filo: rasgos.length ? { id: "press", nivel: 9, etapa: 2, rasgos } : null }, E.getTeam(oppId), false, []);
}

// ---------- El ciclo: encender, vencer, recargar ----------
{
  const m = makeMatch();
  let st = E.pressState(m);
  assert(st.ready && !st.on && st.pct === 100 && st.restantes === E.PRESS_MAX_USES,
    "al arrancar el partido la presión está LISTA y la barra llena", JSON.stringify(st));

  assert(E.startPress(m), "la primera ráfaga prende");
  assert(!E.startPress(m), "no se puede prender dos veces seguidas");
  st = E.pressState(m);
  assert(st.on && !st.ready && st.pct === 100, "encendida: la barra arranca llena y se vacía", st.pct);
  assert(m.feed.some(f => f.text.includes("PRESIONAR")), "el momento SE VE en el relato");

  // La ráfaga vence por MINUTOS de partido: dos ticks (10') la consumen.
  m.min = 5; E.tickPress(m);
  assert(E.pressOn(m), "a mitad de ráfaga sigue encendida");
  assert(Math.round(E.pressState(m).pct) === 50, "la barra va por la mitad", E.pressState(m).pct);
  m.min = 10; E.tickPress(m);
  assert(!E.pressOn(m), "cumplidos los 10 minutos se apaga sola");

  // Y la recarga también corre en minutos de partido.
  st = E.pressState(m);
  assert(!st.ready && st.pct === 0, "recién apagada: recarga vacía", st.pct);
  m.min = 15;
  assert(Math.round(E.pressState(m).pct) === 50 && !E.canPress(m), "a mitad de recarga el botón sigue apagado");
  m.min = 20;
  assert(E.pressState(m).ready && E.pressState(m).pct === 100, "cumplida la recarga el botón recupera su color");
}

// ---------- El tope: 4-5 ráfagas por partido, ni una más ----------
{
  const m = makeMatch();
  let usos = 0;
  for (m.min = 0; m.min <= 90; m.min += 5) {
    E.tickPress(m);
    if (E.canPress(m)) { E.startPress(m); usos++; }
  }
  assert(usos >= 4 && usos <= 5, "un partido de 90' da 4-5 ráfagas (el ciclo las limita solo)", usos);

  // Y el tope duro corta la prórroga, donde el reloj ya no alcanza para limitarlas.
  const m2 = makeMatch();
  for (m2.min = 0; m2.min <= 120; m2.min += 5) { E.tickPress(m2); if (E.canPress(m2)) E.startPress(m2); }
  assert(m2.press.usos === E.PRESS_MAX_USES, "el tope duro no se supera ni en prórroga", m2.press.usos);
  assert(E.pressState(m2).agotado, "agotadas las ráfagas, el estado lo dice");
}

// ---------- El efecto: mientras corre, el equipo aprieta ----------
{
  const m = makeMatch();
  const antes = m.powers().mine;
  E.startPress(m);
  const durante = m.powers().mine;
  assert(durante.atk > antes.atk, "encendida ataca mejor", `${antes.atk.toFixed(2)} → ${durante.atk.toFixed(2)}`);
  assert(durante.def < antes.def, "…y se expone atrás: presionar arriba tiene su riesgo", `${antes.def.toFixed(2)} → ${durante.def.toFixed(2)}`);
  m.min = 10; E.tickPress(m);
  assert(Math.abs(m.powers().mine.atk - antes.atk) < 1e-9, "apagada, el poder vuelve exactamente al de antes");
}

// ---------- El costo: los minutos presionados se cobran DOBLE ----------
{
  const m = makeMatch();
  E.startPress(m);
  m.min = 5;
  for (const p of m.activeMine()) m._pressMin.set(p, 10);   // 10' presionados a los titulares
  const pres = m.pressMinutesByName();
  assert(Object.keys(pres).length === m.activeMine().length, "pressMinutesByName cubre a los que estaban en cancha");

  // La conversión a energía es de medical, dueño único del dial.
  const run = E.newRun("BRA");
  const a = run.squad[0], b = run.squad[1];
  a.energia = 100; b.energia = 100;
  E.applyMedicalPostMatch(run, a, true, 90, 0);   // jugó 90 sin presionar
  E.applyMedicalPostMatch(run, b, true, 90, 30);  // jugó 90, 30 de ellos presionando
  const solo = 100 - a.energia, con = 100 - b.energia;
  assert(con > solo, "presionar cuesta más energía que no presionar", `${solo} vs ${con}`);
  assert(con - solo === E.matchFatigue(30), "el sobrecosto es EXACTAMENTE otra vez los minutos presionados (doble)", con - solo);
}

// ---------- Pulmones de Acero abarata el acto de presionar, y nada más ----------
{
  const sin = makeMatch("ARG", []);
  const con = makeMatch("ARG", ["pulmones"]);
  assert(E.pressExtraMinutes(sin, 30) === 30, "sin el rasgo, el sobrecosto es el total presionado");
  const rebajado = E.pressExtraMinutes(con, 30);
  assert(rebajado < 30, "Pulmones de Acero abarata el sobrecosto de presionar", rebajado);
  // La factura del partido NORMAL no la toca: eso lo decide medical con `minutos`, que el
  // rasgo jamás ve (decisión PO — la economía de energía general no se negocia).
  const run = E.newRun("BRA");
  const p = run.squad[0]; p.energia = 100;
  E.applyMedicalPostMatch(run, p, true, 90, 0);
  assert(100 - p.energia === E.matchFatigue(90), "sin minutos presionados el gasto es el de siempre", 100 - p.energia);
}

console.log(`\npress: ${checks} checks · fallos: ${fails}`);
console.log(fails ? "❌ press con fallos" : "✅ press OK");
process.exit(fails ? 1 : 0);
