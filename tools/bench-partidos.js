/* ============================================================
   Banco de PARTIDOS con plantel FIJO.

   POR QUÉ EXISTE (lección del sprint del Territorio): el % de
   campeón del smoke tiene ±1.3pp de ruido a n=2500 — mide una RUN
   entera (7 partidos, lesiones, moral, progresión, azar del
   bracket) y no sirve para calibrar un efecto de PARTIDO. Acá se
   juega el MISMO once contra el MISMO rival miles de veces,
   reseteando energía/tarjetas/lesiones entre partidos y sin
   regenerar el plantel: lo único que varía es el azar del juego,
   así que un efecto fino se ve limpio.

   Se usó a mano en el sprint del Eje Horizontal y se perdió; vive
   acá para no volver a reconstruirlo.

   Uso:
     node tools/bench-partidos.js --team=BRA --opp=POL --runs=2000
     node tools/bench-partidos.js --duelos --runs=1500
     node tools/bench-partidos.js --team=BRA --opp=BEL --altura=5 --filo=press
   ============================================================ */
import { loadEngine } from "../tests/load-engine.js";

const { Engine: E, WC_DATA } = await loadEngine();

const args = Object.fromEntries(process.argv.slice(2).map(a => {
  const m = a.match(/^--([^=]+)(?:=(.*))?$/);
  return m ? [m[1], m[2] ?? true] : [a, true];
}));
const RUNS = +args.runs || 1000;
const ALTURA = +args.altura || 3;
const FORMACION = args.formacion || null;
const FILO = args.filo || null;
const KO = !!args.ko;

/* Los DUELOS por defecto: el mismo favorito contra tres escalones de rival y el
   espejo del underdog. La pregunta que el banco tiene que contestar en un sprint
   de balance no es "¿cuántos goles hay?" sino DE QUÉ LADO MUERDE un dial — y eso
   solo se ve comparando al fuerte y al débil en la misma tirada. */
const DUELOS = [
  ["BRA", "HAI"],  // favorito claro (8.69 vs rating 61)
  ["BRA", "POL"],  // favorito cómodo (rating 74)
  ["BRA", "BEL"],  // partido parejo (rating 83)
  ["CPV", "POL"],  // el underdog: mi plantel más débil contra un rival medio
  ["CPV", "BEL"],  // el underdog contra un grande
];

/** Deja al plantel como recién bajado del micro: el banco mide fútbol, no desgaste. */
function resetSquad(squad) {
  for (const p of squad) {
    p.energia = 100;
    p.momento = 4;
    p.amarillas = 0;
    p.amarillaPartido = 0;
    p.expulsado = false;
    p.lesionado = false;
    p.lesionadoPartidos = 0;
    p.suspendido = false;
    p.sustituido = false;
    p.usado = false;
    p.oxid = 1;
    delete p.posJugada;
    delete p.enCancha;
  }
}

/** Un partido con decisiones al azar (mismo bucle que tests/smoke.js playMatch). */
function playMatch(squad, me, opp, filoCtx) {
  resetSquad(squad);
  const { lineup } = E.currentLineup(squad, null, FORMACION);
  const bench = squad.filter(p => !lineup.includes(p));
  const ctx = { team: me, lineup, bench, mentalidad: "normal", altura: ALTURA, buffs: {}, moral: 50, filo: filoCtx, koRound: 0 };
  const match = new E.Match(ctx, opp, KO, []);
  let guard = 0;
  while (!match.finished && guard++ < 500) {
    const r = match.tick();
    if (match.decision) {
      const d = match.decision;
      const o = d.options[Math.floor(Math.random() * d.options.length)];
      if (d.id === "sequence") match.resolveSequenceAct(o.key);
      else if (d.id === "penalty_mine") match.resolvePenaltyMine(o.key);
      else if (d.id === "penalty_opp") match.resolvePenaltyOpp(o.key);
      else if (d.id === "last_man") match.resolveLastMan(o.key);
      else if (d.id === "injury_sub") {
        match.decision = null;
        const el = match.eligibleFor(d.player);
        if (el.length) match.makeSub(d.player, el[Math.floor(Math.random() * el.length)].name);
      } else if (d.id === "gk_red") {
        match.decision = null;
        match.makeSub(match.my.lineup.find(p => p.name === o.key), d.gkIn, true);
      } else match.decision = null;
    } else if (r === "pens") {
      match.startShootout();
      let pg = 0;
      while (!match.shootoutStatus().done && pg++ < 200) {
        const s = match.shootoutStatus();
        if (s.my.length <= s.opp.length) {
          const on = ctx.lineup.filter(p => !p.expulsado && !p.lesionado);
          match.shootMyPen(on[Math.floor(Math.random() * on.length)].name, E.pick(["izq", "centro", "der"]));
        } else match.shootOppPen(E.pick(["izq", "centro", "der"]));
      }
    }
  }
  return match;
}

/** Percentil de una lista YA ordenada. */
const pct = (arr, q) => (arr.length ? arr[Math.min(arr.length - 1, Math.floor(q * arr.length))] : 0);

function duelo(teamId, oppId, runs) {
  const run = E.newRun(teamId);
  // La filosofía es parte del plantel fijo: se declara una vez y no se toca (sin
  // --filo el banco juega SIN identidad, que es la lectura más limpia del motor).
  if (FILO) E.choosePhilosophy(run, FILO);
  const me = E.getTeam(teamId);
  const opp = E.getTeam(oppId);
  const filoCtx = FILO ? E.filoCtx(run) : null;
  const acc = { w: 0, d: 0, l: 0, gm: 0, go: 0, seq: 0, tm: 0, to: 0, dec: 0 };
  const huecos = [];
  for (let i = 0; i < runs; i++) {
    const m = playMatch(run.squad, me, opp, filoCtx);
    const res = m.result();
    if (res.gMy > res.gOpp) acc.w++; else if (res.gMy < res.gOpp) acc.l++; else acc.d++;
    acc.gm += res.gMy; acc.go += res.gOpp;
    acc.seq += m._seqCount || 0;
    acc.tm += m.stats.misTiros; acc.to += m.stats.oppTiros;
    acc.dec += m.stats.decisiones;
    // El HUECO entre jugadas: lo que el PO ve como "minutos sin que pase nada".
    // Se mide contra el arranque y contra el final, no solo entre jugadas.
    const mins = m._flow.filter(f => f.w === 3).map(f => f.min).sort((a, b) => a - b);
    let prev = 0;
    for (const x of mins) { huecos.push(x - prev); prev = x; }
    huecos.push(m.min - prev);
  }
  huecos.sort((a, b) => a - b);
  const n = runs;
  return {
    duelo: `${teamId} vs ${oppId}`,
    win: 100 * acc.w / n, draw: 100 * acc.d / n, loss: 100 * acc.l / n,
    gm: acc.gm / n, go: acc.go / n,
    seq: acc.seq / n, dec: acc.dec / n, tm: acc.tm / n, to: acc.to / n,
    hMed: pct(huecos, 0.5), h90: pct(huecos, 0.9), hMax: huecos[huecos.length - 1],
  };
}

// ---------- ejecución ----------
const pares = args.duelos || !args.team ? DUELOS : [[args.team, args.opp || "POL"]];
const t0 = Date.now();
const filas = pares.map(([a, b]) => duelo(a, b, RUNS));
const cfg = [`n=${RUNS}`, `altura=${ALTURA}`, FORMACION && `formación=${FORMACION}`, FILO ? `filo=${FILO}` : "sin identidad", KO && "KO"].filter(Boolean).join(" · ");
console.log(`\nbanco de partidos · plantel FIJO · ${cfg} · ${((Date.now() - t0) / 1000).toFixed(1)}s`);
console.log("  duelo          gana   emp   pierde |  GF   GC  | jugadas decis. | remates  | hueco med/p90/máx");
for (const r of filas) {
  console.log(`  ${r.duelo.padEnd(13)} ${r.win.toFixed(1).padStart(5)}% ${r.draw.toFixed(1).padStart(5)}% ${r.loss.toFixed(1).padStart(6)}% | ` +
    `${r.gm.toFixed(2)} ${r.go.toFixed(2)} | ${r.seq.toFixed(2).padStart(7)} ${r.dec.toFixed(2).padStart(6)} | ` +
    `${r.tm.toFixed(1)}-${r.to.toFixed(1)} | ${r.hMed}' / ${r.h90}' / ${r.hMax}'`);
}
// El número que resume "de qué lado muerde": la brecha entre lo que saca el favorito
// y lo que saca el underdog en los mismos duelos.
if (filas.length === DUELOS.length) {
  const fav = (filas[0].win + filas[1].win + filas[2].win) / 3;
  const und = (filas[3].win + filas[4].win) / 2;
  console.log(`\n  favorito ${fav.toFixed(1)}% · underdog ${und.toFixed(1)}% · BRECHA ${(fav - und).toFixed(1)}pp`);
}
