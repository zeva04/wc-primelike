/* ============================================================
   Tests de la Acción del Día y del CANJE de entrenamiento
   (game/day-action.js · Bible cap.6 "Permanent Growth"):
   - canjeableBuffs solo ofrece stats reales que llegan al umbral
   - canjeBuff descuenta el umbral del buff y suma +CANJE_PERMANENT
     PERMANENTE a todo el que TIENE esa stat (los de campo no tienen
     atajadas) — recorte de balance 18-jul: +1 y no +2
   - el crecimiento nunca decrece y respeta el techo de 99
   - los buffs que no son stats (tactica/penales) no se canjean
   Uso: node tests/day-action.test.js
   ============================================================ */
import { loadEngine } from "./load-engine.js";

const { Engine: E } = await loadEngine();

let fails = 0, checks = 0;
const assert = (cond, msg, ctx) => { checks++; if (!cond) { fails++; console.error("FAIL:", msg, ctx ?? ""); } };

const TH = E.CANJE_THRESHOLD, PERM = E.CANJE_PERMANENT;
assert(TH === 4 && PERM === 1, "umbral 4 → +1 permanente (constantes; +1 es el recorte de balance del 18-jul)", `${TH}/${PERM}`);

// ---------- canjeableBuffs: qué se ofrece ----------
{
  const run = E.newRun("BRA");
  assert(E.canjeableBuffs(run).length === 0, "sin buffs no hay nada que canjear");
  run.buffs.tiro = TH - 1;
  assert(E.canjeableBuffs(run).length === 0, "por debajo del umbral no se ofrece");
  run.buffs.tiro = TH;
  const c = E.canjeableBuffs(run);
  assert(c.length === 1 && c[0].key === "tiro", "en el umbral, tiro es canjeable");
  assert(c[0].label === "Tiro", "trae la etiqueta legible");
  assert(c[0].alcance === run.squad.filter(p => p.stats.tiro !== undefined).length, "alcance = jugadores con la stat");
  // los buffs que NO son stats nunca se ofrecen
  run.buffs.tactica = 0.4; run.buffs.penales = 0.15; run.buffs.antiLesion = true;
  assert(E.canjeableBuffs(run).every(x => x.key === "tiro"), "tactica/penales/antiLesion no son canjeables");
}

// ---------- canjeBuff: conversión y descuento ----------
{
  const run = E.newRun("BRA");
  const campo = run.squad.filter(p => p.pos !== "POR");
  const arqueros = run.squad.filter(p => p.pos === "POR");
  const before = new Map(campo.map(p => [p, p.stats.tiro]));

  run.buffs.tiro = TH;
  const res = E.canjeBuff(run, "tiro");
  assert(res && res.key === "tiro", "el canje válido devuelve resultado");
  assert(res.permanent === PERM, "informa el crecimiento permanente aplicado");
  assert(!("tiro" in run.buffs), "un buff exacto al umbral queda consumido del todo");
  assert(res.alcance === campo.length, "alcanzó a todos los jugadores de campo");
  for (const p of campo) assert(p.stats.tiro === before.get(p) + PERM, `cada jugador de campo ganó +${PERM} de tiro permanente`, `${p.name} ${before.get(p)}→${p.stats.tiro}`);
  for (const p of arqueros) assert(p.stats.tiro === undefined, "los arqueros no tienen tiro: el canje no se lo inventa", p.name);
}

// ---------- descuento parcial: el excedente sigue siendo boost ----------
{
  const run = E.newRun("BRA");
  run.buffs.aura = TH + 2; // +6
  const antes = run.squad.map(p => p.stats.aura);
  E.canjeBuff(run, "aura");
  assert(run.buffs.aura === 2, "de +6 se descuenta el umbral y quedan +2 de boost", run.buffs.aura);
  run.squad.forEach((p, i) => assert(p.stats.aura === Math.min(99, antes[i] + PERM), `el aura crece +${PERM} para todos (todos la tienen)`, p.name));
  // se puede volver a canjear si se acumula de nuevo
  run.buffs.aura = TH;
  assert(E.canjeableBuffs(run).some(c => c.key === "aura"), "reacumular vuelve a habilitar el canje");
}

// ---------- stat de arquero: solo alcanza a los arqueros ----------
{
  const run = E.newRun("BRA");
  const campo = run.squad.filter(p => p.pos !== "POR");
  const arqueros = run.squad.filter(p => p.pos === "POR");
  const antesGK = new Map(arqueros.map(p => [p, p.stats.atajadas]));
  run.buffs.atajadas = TH;
  const res = E.canjeBuff(run, "atajadas");
  assert(res.alcance === arqueros.length, "atajadas solo alcanza a los arqueros", res.alcance);
  for (const p of arqueros) assert(p.stats.atajadas === antesGK.get(p) + PERM, `el arquero ganó +${PERM} de atajadas`, p.name);
  for (const p of campo) assert(p.stats.atajadas === undefined, "un jugador de campo no gana atajadas", p.name);
}

// ---------- techo 99 y no-decrecimiento (Bible: nunca baja) ----------
{
  const run = E.newRun("BRA");
  const p = run.squad.find(x => x.pos !== "POR");
  p.stats.tiro = 99;
  run.buffs.tiro = TH;
  E.canjeBuff(run, "tiro");
  assert(p.stats.tiro === 99, "en el techo (99) el crecimiento se clampa: no pasa de 99 ni baja", p.stats.tiro);
}

// ---------- guardas: no se canjea lo que no corresponde ----------
{
  const run = E.newRun("BRA");
  assert(E.canjeBuff(run, "tiro") === null, "sin buff suficiente, canjeBuff no aplica ni miente");
  run.buffs.tiro = TH - 1;
  assert(E.canjeBuff(run, "tiro") === null, "por debajo del umbral tampoco");
  run.buffs.tactica = 4;
  assert(E.canjeBuff(run, "tactica") === null, "tactica no es una stat: no se canjea");
  run.buffs.inventada = 9;
  assert(E.canjeBuff(run, "inventada") === null, "una clave que no es stat real no se canjea");
}

// ---------- integración: el canje sube la nota real de la ficha ----------
{
  const run = E.newRun("BRA");
  const del = run.squad.filter(p => p.pos === "DEL").sort((a, b) => E.playerOverall(b) - E.playerOverall(a))[0];
  const notaAntes = E.playerOverall(del);
  run.buffs.tiro = TH;
  E.canjeBuff(run, "tiro");
  assert(E.playerOverall(del) >= notaAntes, "la nota de la ficha refleja el crecimiento permanente", `${notaAntes}→${E.playerOverall(del)}`);
}

// ---------- el diario registra el canje ----------
{
  const run = E.newRun("BRA");
  const j0 = run.journal.length;
  run.buffs.pase_corto = TH;
  E.canjeBuff(run, "pase_corto");
  assert(run.journal.length === j0 + 1, "el canje deja una entrada en el diario");
  assert(run.journal.at(-1).tone === "gold", "la entrada del canje es dorada (hito)");
}

// ---------- Sprint 3: Team Bonding (sube la Moral, cuesta energía) ----------
{
  const run = E.newRun("BRA");
  const bonding = E.DAY_ACTIONS.find(a => a.id === "bonding");
  assert(!!bonding, "existe la acción Team Bonding");
  assert(!bonding.group, "Bonding es una acción suelta (no del grupo entrenar)");
  run.moral = 40;
  const energiaAntes = run.squad.map(p => p.energia);
  const res = E.applyDayAction(run, "bonding");
  assert(res && res.id === "bonding", "la acción se aplica");
  assert(run.moral === 40 + E.BONDING_MORAL, "sube la moral en BONDING_MORAL", `40→${run.moral}`);
  assert(run.squad.every((p, i) => p.energia === energiaAntes[i] - E.BONDING_FATIGUE), "cuesta BONDING_FATIGUE de energía a TODO el plantel");
  assert(!run.actionPending, "consume la Acción del Día");
}
{
  // Clamps: la moral no pasa de 100 ni la energía baja de 5
  const run = E.newRun("BRA");
  run.moral = 96;
  run.squad.forEach(p => p.energia = 6);
  E.applyDayAction(run, "bonding");
  assert(run.moral === 100, "la moral se topa en 100", run.moral);
  assert(run.squad.every(p => p.energia === 5), "la energía se topa en 5", run.squad[0].energia);
}

// ---------- Sprint 3: descanso dirigido (oportunidad rara con protagonista elegido) ----------
{
  const desc = E.OPPORTUNITIES.find(o => o.id === "descanso_dirigido");
  assert(!!desc, "existe la oportunidad descanso_dirigido");
  assert(desc.rareza === "rara", "es RARA (decisión PO: evento raro, no acción del día)", desc.rareza);
  assert(!!desc.choose, "el DT elige al protagonista");

  const run = E.newRun("BRA");
  const p = run.squad[0];
  p.energia = 40;
  const otros = run.squad.filter(x => x !== p).map(x => x.energia);
  run.dayOpp = { id: "descanso_dirigido" };
  const res = E.applyDayAction(run, "descanso_dirigido", p.name);
  assert(res && res.desc.includes(p.name), "el resultado protagoniza al elegido", res && res.desc);
  assert(p.energia === 65, "recupera +25 al elegido (40→65)", p.energia);
  assert(run.squad.filter(x => x !== p).every((x, i) => x.energia === otros[i]), "NO toca la energía del resto (es dirigido)");
  assert(!run.actionPending, "tomarla consume la Acción del Día");
}
{
  // Tope de energía en 100 y candidatos = todo el plantel
  const run = E.newRun("BRA");
  const desc = E.OPPORTUNITIES.find(o => o.id === "descanso_dirigido");
  assert(desc.choose.candidates(run).length === run.squad.length, "cualquiera del plantel puede recibir el descanso");
  const p = run.squad[0];
  p.energia = 90;
  run.dayOpp = { id: "descanso_dirigido" };
  E.applyDayAction(run, "descanso_dirigido", p.name);
  assert(p.energia === 100, "la energía se topa en 100", p.energia);
}

/* ──────────────────────────────────────────────────────────────────────────────
   previewDayAction: la PROMESA de la hoja de confirmación del hub.

   La ley de esta sección: lo que la hoja muestra antes de gastar el día tiene que
   ser EXACTAMENTE lo que pasa al confirmar. Si algún día alguien reimplementa la
   fórmula en la UI "para no clonar el run", esto se pone rojo.
   ────────────────────────────────────────────────────────────────────────────── */

/** Todo lo que la hoja puede llegar a mostrar, en una sola cadena comparable. */
const foto = r => JSON.stringify({
  energias: r.squad.map(p => p.energia), moral: r.moral, buffs: r.buffs,
  sinEntrenar: r.diasSinEntrenar, filo: r.filoId, plan: r.planFilo,
});

{
  // El preview no toca el run de verdad: mirar nunca cuesta.
  const run = E.newRun("BRA");
  const antes = foto(run);
  const pv = E.previewDayAction(run, "recuperar");
  assert(!!pv, "recuperar se puede previsualizar");
  assert(foto(run) === antes, "previewDayAction NO muta el run");
  assert(run.actionPending, "y no consume la Acción del Día");
}

{
  // El corazón: preview === aplicar, para TODAS las acciones del complejo.
  for (const a of E.DAY_ACTIONS) {
    const run = E.newRun("BRA");
    run.squad.forEach((p, i) => { p.energia = 40 + i * 5; });   // energías desparejas: los clamps se notan
    run.moral = 55;
    run.buffs.tiro = 2;
    run.diasSinEntrenar = 2;
    const pv = E.previewDayAction(run, a.id);
    const prometido = foto(pv.sim);
    E.applyDayAction(run, a.id);
    assert(prometido === foto(run), `la hoja de "${a.id}" promete exactamente lo que aplica`, `${prometido}\n  vs ${foto(run)}`);
  }
}

{
  // El multiplicador del día entra solo (viene del mismo effect, no de una cuenta aparte).
  const run = E.newRun("BRA");
  run.squad.forEach(p => { p.energia = 50; });
  run.dayMod = { title: "Spa del hotel", mods: { recuperar: 2 } };
  const pv = E.previewDayAction(run, "recuperar");
  assert(pv.mult === 2, "el preview trae el multiplicador del día", pv.mult);
  assert(pv.sim.squad[0].energia === 80, "y lo aplica al proyectar (50 +15×2)", pv.sim.squad[0].energia);
}

{
  // Los clamps se ven en la promesa: "+15" con el tanque casi lleno son +5 de verdad.
  const run = E.newRun("BRA");
  run.squad.forEach(p => { p.energia = 95; });
  const pv = E.previewDayAction(run, "recuperar");
  assert(pv.sim.squad.every(p => p.energia === 100), "la energía proyectada se topa en 100", pv.sim.squad[0].energia);
}

{
  // El RITMO también es parte de lo que cuesta el día, y la hoja lo proyecta.
  const run = E.newRun("BRA");
  run.diasSinEntrenar = 3;
  assert(E.previewDayAction(run, "entrenar_ataque").sim.diasSinEntrenar === 0, "entrenar resetea la racha en la proyección");
  assert(E.previewDayAction(run, "recuperar").sim.diasSinEntrenar === 4, "recuperar suma un día sin entrenar en la proyección");
  assert(run.diasSinEntrenar === 3, "y ninguna de las dos tocó la racha real");
}

{
  // Las mismas puertas cerradas que applyDayAction: si no se puede, no hay hoja.
  const run = E.newRun("BRA");
  assert(E.previewDayAction(run, "no_existe") === null, "id desconocido → null");
  run.dayMod = { title: "Cancha anegada", mods: { entrenar: 0 } };
  assert(E.previewDayAction(run, "entrenar_ataque") === null, "acción bloqueada hoy → null");
  assert(E.previewDayAction(run, "recuperar") !== null, "pero el resto del día sigue disponible");
  run.actionPending = false;
  assert(E.previewDayAction(run, "recuperar") === null, "sin acción pendiente → null");
}

{
  // Todas las acciones traen su titular para la cara de RESULTADO de la hoja.
  for (const a of E.DAY_ACTIONS) assert(typeof a.done === "string" && a.done.length > 0, `"${a.id}" declara su titular (done)`, a.done);
}

console.log(`day-action.test: ${checks} checks · fallos: ${fails}`);
console.log(fails ? "❌ day-action con fallos" : "✅ day-action OK");
process.exit(fails ? 1 : 0);
