/* ============================================================
   Test determinista del sistema de disciplina y médico
   (postMatchUpdate + clearAmarillas): acumulación de amarillas,
   suspensiones, limpiezas y entradas del diario. Sin azar en los
   asserts: los estados se fabrican a mano.

   Uso: node tests/discipline.test.js
   ============================================================ */
import { loadEngine } from "./load-engine.js";

const { Engine: E } = await loadEngine();

let fails = 0, checks = 0;
function t(cond, msg) {
  checks++;
  if (!cond) { fails++; console.error("  ❌", msg); }
}

/** Run nueva + partido falso donde jugaron los primeros 6 del plantel. */
function setup() {
  const run = E.newRun("ARG");
  const match = { my: { lineup: run.squad.slice(0, 6) } };
  return { run, match, j: (p) => run.journal.filter(e => e.title.includes(p)) };
}

// 1. Primera amarilla del torneo → apercibido, sin suspensión
{
  const { run, match, j } = setup();
  const p = match.my.lineup[2];
  p.amarillaPartido = 1;
  E.postMatchUpdate(run, match);
  t(p.amarillas === 1, "1ª amarilla: contador debe quedar en 1");
  t(!p.suspendido, "1ª amarilla: no debe suspender");
  t(j("suspendido").length === 0, "1ª amarilla: sin entrada de suspensión en el diario");
}

// 2. Segunda amarilla en OTRO partido → suspendido + contador a 0 + diario
{
  const { run, match, j } = setup();
  const p = match.my.lineup[2];
  p.amarillas = 1;
  p.amarillaPartido = 1;
  E.postMatchUpdate(run, match);
  t(p.suspendido === true, "2ª acumulada: debe suspender");
  t(p.amarillas === 0, "2ª acumulada: el contador vuelve a 0");
  t(j("suspendido por acumulación").length === 1, "2ª acumulada: entrada en el diario");
}

// 3. El suspendido cumple y vuelve
{
  const { run, match } = setup();
  const p = run.squad[8]; // no jugó (fuera del lineup falso)
  p.suspendido = true;
  E.postMatchUpdate(run, match);
  t(p.suspendido === false, "suspensión cumplida: debe volver a estar disponible");
}

// 4. Roja directa → suspende y NO toca el acumulado de amarillas
{
  const { run, match, j } = setup();
  const p = match.my.lineup[3];
  p.amarillas = 1;
  p.expulsado = true;
  E.postMatchUpdate(run, match);
  t(p.suspendido === true, "roja: debe suspender");
  t(p.amarillas === 1, "roja: el acumulado de amarillas no cambia");
  t(j("suspendido").length === 1, "roja: entrada en el diario");
}

// 5. Doble amarilla en el MISMO partido = roja, no suma al acumulado (regla FIFA)
{
  const { run, match } = setup();
  const p = match.my.lineup[4];
  p.amarillaPartido = 2;
  p.expulsado = true;
  E.postMatchUpdate(run, match);
  t(p.suspendido === true, "doble amarilla: suspende como roja");
  t(p.amarillas === 0, "doble amarilla: NO acumula amarillas del torneo");
}

// 6. clearAmarillas: limpia contadores, respeta suspensiones, anota en diario
{
  const { run, j } = setup();
  run.squad[1].amarillas = 1;
  run.squad[2].amarillas = 1;
  run.squad[3].suspendido = true;
  const n = E.clearAmarillas(run, "Prueba");
  t(n === 2, `clearAmarillas devuelve 2 (devolvió ${n})`);
  t(run.squad.every(p => (p.amarillas || 0) === 0), "clearAmarillas: todos los contadores en 0");
  t(run.squad[3].suspendido === true, "clearAmarillas: la suspensión pendiente NO se perdona");
  t(j("Borrón").length === 1, "clearAmarillas: entrada en el diario");
}

// 7. Lesión con baja real → descuenta y anota en el diario
{
  const { run, match, j } = setup();
  const p = match.my.lineup[5];
  p.lesionado = true;
  p.lesionadoPartidos = 3; // rollInjury guarda partidos+1; tras el partido queda 2
  E.postMatchUpdate(run, match);
  t(p.lesionadoPartidos === 2, "lesión: descuenta el partido jugado");
  t(p.lesionado === false, "lesión: el flag de partido se limpia");
  t(j("lesionado").length === 1, "lesión: entrada en el diario");
}

// 8. Energía: +15 si jugó, +30 si descansó (tope 100)
{
  const { run, match } = setup();
  const jugador = match.my.lineup[0];
  const banca = run.squad[9];
  jugador.energia = 50;
  banca.energia = 50;
  E.postMatchUpdate(run, match);
  t(jugador.energia === 65, `energía del titular: 50→65 (quedó ${jugador.energia})`);
  t(banca.energia === 80, `energía del suplente: 50→80 (quedó ${banca.energia})`);
}

// 9. postMatchUpdate re-agenda el calendario y limpia buffs
{
  const { run, match } = setup();
  run.buffs = { tiro: 5 };
  E.postMatchUpdate(run, match);
  t(run.nextMatchDay > run.day, "re-agenda: nextMatchDay en el futuro");
  t(Object.keys(run.buffs).length === 0, "re-agenda: buffs limpios");
  let plan = true;
  for (let d = run.day + 1; d < run.nextMatchDay; d++) if (!run.dayPlan[d]) plan = false;
  t(plan, "re-agenda: todos los días intermedios tienen evento planificado");
}

console.log(`discipline.test: ${checks} checks`);
console.log(fails ? `❌ ${fails} fallo(s)` : "✅ disciplina OK");
process.exit(fails ? 1 : 0);
