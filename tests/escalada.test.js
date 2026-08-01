/* ============================================================
   Tests del SPRINT DE LA ESCALADA (31-jul-2026):
   - la forma de torneo pasa de LINEAL a CONVEXA hasta ×1.45
   - el mundo simulado se vuelve selectivo SOLO en eliminatorias
   - el Informe del Rival dice el Modo Mundial en PALABRAS
   Uso: node tests/escalada.test.js
   ============================================================ */
import { loadEngine } from "./load-engine.js";

const { Engine: E, WC_DATA } = await loadEngine();

let fails = 0, checks = 0;
const assert = (cond, msg, ctx) => { checks++; if (!cond) { fails++; console.error("FAIL:", msg, ctx ?? ""); } };

/* ---------- 1. LA CURVA DE FORMA DE TORNEO ----------
   El problema que este sprint vino a resolver: la escalada era LINEAL (+3%/ronda) y la
   progresión del DT es COMPUESTA, así que la progresión le ganaba la carrera — medido,
   la final se ganaba casi tan seguido como los 16avos (salto de 5.7pp con decisiones al
   azar, 3.1pp jugando bien). Lo que fija este bloque no es el valor de cada escalón sino
   la FORMA: convexa. Un escalón plano en el medio devuelve el problema original. */
{
  assert(E.tourneyFormaMult(0) === 1, "en grupos el rival no lleva forma de torneo", E.tourneyFormaMult(0));
  assert(Math.abs(E.tourneyFormaMult(1) - 1.03) < 1e-9, "los 16avos quedan donde estaban (×1.03): la puerta del KO no se movió", E.tourneyFormaMult(1));
  assert(Math.abs(E.tourneyFormaMult(5) - 1.45) < 1e-9, "la final llega a ×1.45 (decisión PO)", E.tourneyFormaMult(5));

  const saltos = [];
  for (let k = 1; k <= 5; k++) {
    assert(E.tourneyFormaMult(k) > E.tourneyFormaMult(k - 1), `la ronda ${k} exige más que la anterior`);
    saltos.push(+(E.tourneyFormaMult(k) - E.tourneyFormaMult(k - 1)).toFixed(6));
  }
  for (let i = 1; i < saltos.length; i++) {
    assert(saltos[i] > saltos[i - 1], "la curva es CONVEXA: cada ronda sube MÁS que la anterior", saltos.join(" < "));
  }
  // Fuera de rango no explota (koRound nace de STAGE_ORDER, pero un stage nuevo no puede
  // devolver NaN y estampar `forma: NaN` en el once rival — sería un equipo sin poder).
  assert(E.tourneyFormaMult(99) === E.tourneyFormaMult(5), "una ronda fuera de rango se acota al tope");
  assert(E.tourneyFormaMult(undefined) === 1, "sin ronda (grupos) es ×1");
}

/* ---------- 2. EL MUNDO SELECCIONA — PERO SOLO EN ELIMINATORIAS ----------
   Antes `quickSim` pesaba el rating igual en todo el torneo y el mundo apenas filtraba:
   el 6% de las finales se jugaban contra un rival de rating ≤69. Ahora los grupos
   conservan su caos A PROPÓSITO (la cenicienta y el batacazo son el combustible del
   World Cup Daily) y el KO se vuelve implacable. */
{
  const gana = (a, b, ko, n) => {
    let w = 0;
    for (let i = 0; i < n; i++) { const r = E.quickSim(a, b, ko); if (r.gA > r.gB || r.pens === "A") w++; }
    return 100 * w / n;
  };
  const N = 12000;
  const koFuerte = gana("BEL", "IRQ", true, N);    // 83 vs 69
  const grupoFuerte = gana("BEL", "IRQ", false, N);
  assert(koFuerte > grupoFuerte + 8, "el rating pesa MUCHO más en eliminatorias que en grupos",
    `KO ${koFuerte.toFixed(1)}% vs grupos ${grupoFuerte.toFixed(1)}%`);
  assert(grupoFuerte < 62, "los grupos siguen siendo caóticos: el grande no tiene el pase asegurado", `${grupoFuerte.toFixed(1)}%`);
  assert(koFuerte > 70, "en KO el grande ya se impone de verdad al chico", `${koFuerte.toFixed(1)}%`);
  // Y el partido PAREJO sigue siendo parejo: la selectividad amplifica la diferencia de
  // rating, no inventa una jerarquía donde no la hay.
  const parejo = gana("BEL", "CRO", true, N); // 83 vs 82
  assert(Math.abs(parejo - 50) < 6, "un cruce parejo sigue siendo una moneda", `${parejo.toFixed(1)}%`);
}

/* ---------- 3. LA SELECTIVIDAD SE NOTA EN EL BRACKET ----------
   La prueba de que el cambio hace lo que promete: el que sobrevive tiene que ser cada vez
   mejor. Es la mitad VISIBLE de la dificultad — llegar a la final y encontrarse un grande
   se lee en el escudo, no en un multiplicador escondido. */
{
  const ratingOf = id => E.teamRating(E.getTeam(id));
  const todos = WC_DATA.teams.map(t => t.id);
  const medias = [];
  let campo = null;
  const acum = { r32: [], r16: [], qf: [], sf: [], final: [] };
  for (let rep = 0; rep < 400; rep++) {
    campo = [...todos].sort(() => Math.random() - 0.5).slice(0, 32);
    acum.r32.push(...campo.map(ratingOf));
    let vivos = campo;
    for (const ronda of ["r16", "qf", "sf", "final"]) {
      const next = [];
      for (let i = 0; i < vivos.length; i += 2) {
        const r = E.quickSim(vivos[i], vivos[i + 1], true);
        next.push(r.gA > r.gB || r.pens === "A" ? vivos[i] : vivos[i + 1]);
      }
      vivos = next;
      acum[ronda].push(...vivos.map(ratingOf));
    }
  }
  for (const k of ["r32", "r16", "qf", "sf", "final"]) {
    medias.push(acum[k].reduce((s, x) => s + x, 0) / acum[k].length);
  }
  for (let i = 1; i < medias.length; i++) {
    assert(medias[i] > medias[i - 1], "cada ronda deja vivos a equipos mejores que la anterior",
      medias.map(m => m.toFixed(1)).join(" → "));
  }
  assert(medias[4] - medias[0] > 4, "el finalista medio es claramente mejor que el que entra a 16avos",
    `${medias[0].toFixed(1)} → ${medias[4].toFixed(1)}`);
  const flojosEnFinal = 100 * acum.final.filter(x => x <= 69).length / acum.final.length;
  assert(flojosEnFinal < 4, "casi no quedan finales contra un rival flojo (antes eran el 6%)", `${flojosEnFinal.toFixed(1)}%`);
}

/* ---------- 4. EL MODO MUNDIAL, EN PALABRAS ----------
   `game/scouting` declara en su cabecera que es CUALITATIVO ("nunca porcentajes") y este
   bloque era su única excepción: mostraba "+18% encendido". Con la escalada convexa habría
   llegado a +45%, que convierte una amenaza en una planilla. Lo que se fija acá es que
   ningún número de MAGNITUD vuelva a salir por esta puerta. */
{
  const run = E.newRun("BRA");
  E.choosePhilosophy(run, "press");
  const vistos = new Set();
  for (const [stage, ronda] of [["r32", 1], ["r16", 2], ["qf", 3], ["sf", 4], ["final", 5]]) {
    run.stage = stage;
    const rep = E.buildOpponentReport(run, "BEL");
    const mm = rep.modoMundial;
    assert(mm, `en ${stage} el informe trae el Modo Mundial`);
    assert(mm.ronda === ronda, `el informe sabe en qué ronda está (${stage})`, mm.ronda);
    assert(typeof mm.titulo === "string" && mm.titulo.length > 3, "cada ronda tiene su titular");
    assert(typeof mm.texto === "string" && mm.texto.length > 30, "cada ronda tiene su párrafo de ojeador");
    assert(!vistos.has(mm.titulo), "cada ronda habla distinto (nada de un texto reciclado)", mm.titulo);
    vistos.add(mm.titulo);
    // NINGÚN número de magnitud sale del informe: `ronda` es el único, y no es una
    // magnitud del motor — es en qué instancia del torneo está, que el DT ya sabe.
    for (const [k, v] of Object.entries(mm)) {
      if (k === "ronda") continue;
      assert(typeof v !== "number", `el informe no expone magnitudes numéricas (${k})`, v);
    }
    assert(!`${mm.titulo} ${mm.texto}`.includes("%"), "y ningún texto cuela un porcentaje", mm.titulo);
  }
  assert(vistos.size === 5, "las cinco rondas tienen voz propia", [...vistos].join(" | "));
  // En grupos no hay Modo Mundial: el rival de la fase de grupos no está encendido.
  run.stage = "groups";
  assert(E.buildOpponentReport(run, "BEL").modoMundial === null, "en grupos no hay Modo Mundial");
}

/* ---------- 5. LA BRECHA DE IDENTIDAD CONSERVA SUS DOS CARAS ----------
   R3 + la vara alta del techo: el mismo multiplicador significa cosas opuestas según quién
   llegue con más idea, y el informe tiene que decir la correcta (bug histórico: el texto
   decía SIEMPRE "llega con más idea que nosotros", incluso cuando era al revés). */
{
  const conNivel = (nivel, etapa) => {
    const run = E.newRun("BRA");
    E.choosePhilosophy(run, "press");
    run.stage = "final";
    run.filoXp = { press: E.FILO_LEVELS[nivel].min };
    return E.buildOpponentReport(run, "BEL").modoMundial.brecha;
  };
  const sinIdea = conNivel(0, 0);
  const conIdea = conNivel(9, 2);
  assert(sinIdea === null || typeof sinIdea === "string", "la brecha es texto o nada, nunca un número", sinIdea);
  if (conIdea) assert(conIdea.includes("miedo") || conIdea.includes("improvisando"), "la brecha nombra una de sus dos caras", conIdea);
  assert(sinIdea !== conIdea || sinIdea === null, "llegar con idea y llegar sin idea no se narran igual",
    `sin: ${sinIdea} · con: ${conIdea}`);
}

console.log(`\nescalada.test: ${checks} checks · fallos: ${fails}`);
console.log(fails ? "❌ escalada con fallos" : "✅ escalada OK");
process.exit(fails ? 1 : 0);
