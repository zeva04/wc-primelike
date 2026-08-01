/* ============================================================
   Test determinista de las reglas de alineación: formaciones,
   asignación de puestos y castigo por jugar fuera de puesto
   (docs/CORE.md §2b). Sin azar: los estados se fabrican a mano.

   Cubre el riesgo real de esta regla: que un castigo mal aplicado
   entre al motor como NaN y envenene el partido en silencio.

   Uso: node tests/lineup.test.js
   ============================================================ */
import { loadEngine } from "./load-engine.js";

const { Engine: E } = await loadEngine();

let fails = 0, checks = 0;
function t(cond, msg) {
  checks++;
  if (!cond) { fails++; console.error("  ❌", msg); }
}

const bra = E.getTeam("BRA");
const vini = bra.players.find(p => p.name === "Vinícius Júnior");   // DEL 88
const alisson = bra.players.find(p => p.name === "Alisson");        // POR
const clon = p => ({ ...p, stats: { ...p.stats }, posJugada: null });

// ---------- 1. Distancia entre posiciones ----------
{
  t(E.posDistance("DEF", "MED") === 1, "DEF→MED es 1 paso");
  t(E.posDistance("MED", "DEL") === 1, "MED→DEL es 1 paso");
  t(E.posDistance("DEF", "DEL") === 2, "DEF→DEL son 2 pasos");
  t(E.posDistance("POR", "DEL") === 3, "POR→DEL son 3 pasos (el máximo)");
  t(E.posDistance("DEL", "DEL") === 0, "misma posición, 0 pasos");
  t(E.posDistance("DEF", "DEL") === E.posDistance("DEL", "DEF"), "la distancia es simétrica");
}

// ---------- 2. El castigo crece con la distancia ----------
{
  const p = clon(vini);
  t(E.outOfPosPenalty(p) === 0, "en su puesto no hay castigo");
  p.posJugada = "MED";
  t(E.outOfPosPenalty(p) === E.OUT_OF_POS_STEP, "a 1 paso, castigo de 1 escalón");
  p.posJugada = "DEF";
  t(E.outOfPosPenalty(p) === E.OUT_OF_POS_STEP * 2, "a 2 pasos, castigo doble — más lejos, más duele");
  t(E.outOfPosPenalty(clon(vini)) < E.outOfPosPenalty(p), "el de más lejos siempre recibe más castigo");
}

// ---------- 3. Qué stats baja el castigo (y cuáles no) ----------
{
  const p = clon(vini);
  p.posJugada = "DEF";
  t(E.effectiveStat(p, "defensa") === vini.stats.defensa - 12, "las stats técnicas bajan 6 por paso");
  t(E.effectiveStat(p, "aura") === vini.stats.aura, "el aura NO se castiga: no depende del puesto");
  t(E.effectiveStat(clon(vini), "defensa") === vini.stats.defensa, "en su puesto la stat queda intacta");
  const pen = E.statPenalties(p);
  // Odisea: las técnicas de campo pasaron de 4 a 6 (el pase se partió y entró la velocidad).
  t(pen.length === 6, "statPenalties lista las 6 stats técnicas afectadas");
  t(pen.every(s => s.delta === -12), "cada delta refleja el castigo");
  t(!pen.some(s => s.key === "aura"), "statPenalties no incluye el aura");
  t(E.statPenalties(clon(vini)).length === 0, "en su puesto no hay nada que mostrar");
  // Piso: una stat castigada nunca cae bajo 1 ni se vuelve negativa
  const flojo = clon(vini);
  flojo.stats.defensa = 3; flojo.posJugada = "DEF";
  t(E.effectiveStat(flojo, "defensa") >= 1, "la stat castigada nunca baja de 1");
}

// ---------- 4. La nota cae por partida doble (pesos + castigo) ----------
{
  // Los valores exactos dependen de data/teams.js, que el PO edita entre sesiones: se
  // testean las RELACIONES y la magnitud del castigo, no un snapshot de stats (precedente
  // discipline.test §8, Sprint 3 — derivar, no hardcodear).
  const enSuPuesto = E.playerOverall(clon(vini));
  const deMed = clon(vini); deMed.posJugada = "MED";
  const deDef = clon(vini); deDef.posJugada = "DEF";
  t(enSuPuesto >= 80, `Vinícius en su puesto es élite (${enSuPuesto})`);
  t(E.playerOverall(deDef) < E.playerOverall(deMed), "cuanto más lejos del puesto, peor nota");
  t(E.playerOverall(deMed) < enSuPuesto, "fuera de puesto siempre baja");
  t(enSuPuesto - E.playerOverall(deDef) >= 25, `jugar de DEF castiga fuerte a un DEL (${enSuPuesto} → ${E.playerOverall(deDef)})`);
  t(Number.isFinite(E.playerOverall(deDef)), "la nota fuera de puesto es un número, no NaN");
}

// ---------- 5. El arco es exclusivo de los arqueros (stats disjuntas) ----------
{
  t(E.canPlayAt(vini, "DEF"), "un delantero puede jugar de defensa");
  t(E.canPlayAt(vini, "MED"), "un delantero puede jugar de mediocampista");
  t(!E.canPlayAt(vini, "POR"), "un jugador de campo NO puede ir al arco: no tiene atajadas");
  t(E.canPlayAt(alisson, "POR"), "el arquero puede jugar de arquero");
  t(!E.canPlayAt(alisson, "DEF"), "el arquero NO sale del arco: no tiene defensa");
}

// ---------- 6. Asignación de puestos según la formación ----------
{
  t(E.formationSlots("2-1-2").join() === "POR,DEF,DEF,MED,DEL,DEL", "los slots salen en orden POR→DEF→MED→DEL");
  t(E.formationSlots("3-1-1").join() === "POR,DEF,DEF,DEF,MED,DEL", "3-1-1 pide 3 defensas");
  t(E.formationSlots("no-existe").length === 0, "una formación inexistente no tiene slots");

  const run = E.newRun("BRA");
  const available = run.squad.filter(p => !p.suspendido && p.lesionadoPartidos === 0);
  const once = E.autoLineup(available, "2-1-2");
  E.assignPositions(run.squad, once, "2-1-2");
  t(once.every(p => p.posJugada === p.pos), "el once automático deja a todos en su puesto natural");
  t(run.squad.filter(p => !once.includes(p)).every(p => !p.posJugada), "a los suplentes se les borra el puesto");

  // El DT mete un delantero de defensa: intercambia los índices 1 (DEF) y 4 (DEL)
  const manual = once.slice();
  [manual[1], manual[4]] = [manual[4], manual[1]];
  E.assignPositions(run.squad, manual, "2-1-2");
  t(manual[1].posJugada === "DEF" && manual[1].pos === "DEL", "el delantero movido al slot de DEF juega de DEF");
  t(manual[4].posJugada === "DEL" && manual[4].pos === "DEF", "y el defensa queda de DEL");
  t(E.outOfPosPenalty(manual[1]) > 0, "el delantero improvisado de defensa está castigado");

  // Reasignar limpia lo anterior: el estado no se acumula entre formaciones
  E.assignPositions(run.squad, once, "2-1-2");
  t(once.every(p => E.outOfPosPenalty(p) === 0), "volver al once natural borra todos los castigos");
}

// ---------- 6b. currentLineup: la puerta real que usan las pantallas ----------
// REGRESIÓN (bug del PO): el once automático salía POR,DEF,MED,DEL,+extras y los slots
// del 2-1-2 son POR,DEF,DEF,MED,DEL,DEL — al asignar por índice, media Brasil quedaba
// castigada jugando en su propia posición. Nadie debe estar fuera de puesto sin que el
// DT lo haya movido a mano.
{
  for (const id of E.allTeams().filter(t => t.players).map(t => t.id)) {
    const run = E.newRun(id);
    const { lineup, formationId } = E.currentLineup(run.squad, [], null);
    const castigados = lineup.filter(p => E.outOfPosPenalty(p) > 0);
    t(castigados.length === 0,
      `${id}: el once automático no castiga a nadie (castigados: ${castigados.map(p => `${p.name} ${p.pos}→${p.posJugada}`).join(", ")})`);
    if (E.getFormation(formationId)) {
      const slots = E.formationSlots(formationId);
      t(lineup.every((p, i) => p.pos === slots[i]), `${id}: cada titular cae en un slot de su posición natural`);
    }
    t(lineup.every(p => E.playerOverall(p) === E.playerOverall({ ...p, posJugada: null })),
      `${id}: la media del once automático es la real de cada jugador`);
  }
  // Idempotencia: volver a pasar por currentLineup no mueve ni castiga a nadie
  const run = E.newRun("BRA");
  const a = E.currentLineup(run.squad, [], null);
  const b = E.currentLineup(run.squad, a.lineup, a.formationId);
  t(b.lineup.every((p, i) => p === a.lineup[i]), "currentLineup es idempotente: no reordena un once vigente");
  t(b.lineup.every(p => E.outOfPosPenalty(p) === 0), "y no aparecen castigos al repintar");
  t(b.formationId === a.formationId, "la formación no cambia sola entre renders");

  // El movimiento manual del DT SÍ se respeta y sobrevive al siguiente render
  const manual = a.lineup.slice();
  [manual[1], manual[4]] = [manual[4], manual[1]];
  const c = E.currentLineup(run.squad, manual, a.formationId);
  t(E.outOfPosPenalty(c.lineup[1]) > 0, "si el DT mueve a alguien fuera de puesto, el castigo se mantiene");
}

// ---------- 6c. El ranking del plantel usa el TALENTO, no la circunstancia ----------
// REGRESIÓN: playerOverall depende de dónde está parado el jugador. Si autoLineup ordena
// con esa nota, al crack que venías usando fuera de puesto lo compara castigado contra
// suplentes intactos y lo manda al banco. Debe ordenar por naturalOverall.
{
  const p = clon(vini);
  const natural = E.naturalOverall(clon(vini)); // derivado de los datos, no snapshot
  t(E.naturalOverall(p) === natural, "naturalOverall es su nota en su puesto");
  p.posJugada = "DEF";
  t(E.naturalOverall(p) === natural, "naturalOverall ignora dónde lo pararon hoy");
  t(E.playerOverall(p) < natural, "playerOverall sí refleja dónde está parado");
  t(E.overallAt(p, "DEL") > E.overallAt(p, "DEF"), "overallAt calcula la nota en cualquier puesto");

  const run = E.newRun("BRA");
  const a = E.currentLineup(run.squad, [], null);
  // El DT deja a Vinícius de defensa (queda en 47) y luego pide once automático
  const manual = a.lineup.slice();
  const iVini = manual.findIndex(x => x.name === "Vinícius Júnior");
  const iDef = E.formationSlots(a.formationId).indexOf("DEF");
  [manual[iVini], manual[iDef]] = [manual[iDef], manual[iVini]];
  E.assignPositions(run.squad, manual, a.formationId);
  t(E.playerOverall(run.squad.find(x => x.name === "Vinícius Júnior")) < 60, "montado el escenario: Vinícius está castigado");

  const auto = E.autoLineup(run.squad.filter(x => !x.suspendido && x.lesionadoPartidos === 0), a.formationId);
  t(auto.some(x => x.name === "Vinícius Júnior"), "el once automático NO manda al banco al crack por estar castigado");
}

// ---------- 6d. El puesto asignado no sobrevive al partido siguiente ----------
// REGRESIÓN: `posJugada` es estado que vive en run.squad. Si un cambio del partido se lo
// deja pegado a un suplente, ese jugador arrastraría el castigo por el resto de la run.
{
  const run = E.newRun("BRA");
  const suplente = run.squad[7];
  suplente.posJugada = "POR";                       // basura de un partido anterior
  const { lineup } = E.currentLineup(run.squad, null, null);
  t(run.squad.every(p => lineup.includes(p) || !p.posJugada), "currentLineup limpia el puesto de todo el que no es titular");
  t(lineup.every(p => E.outOfPosPenalty(p) === 0), "y nadie arrastra castigo al armar el once nuevo");
}

// ---------- 6e. Reubicación táctica (swapAssignments) ----------
// En el partido no hay formación de la que rederivar: posJugada es la única verdad.
{
  const run = E.newRun("BRA");
  const { lineup, formationId } = E.currentLineup(run.squad, [], null);
  const def = lineup.find(p => E.playedPos(p) === "DEF");
  const del = lineup.find(p => E.playedPos(p) === "DEL");
  const por = lineup.find(p => p.pos === "POR");

  t(E.swapAssignments(def, del), "dos jugadores de campo pueden intercambiar el puesto");
  t(E.playedPos(def) === "DEL" && E.playedPos(del) === "DEF", "quedaron cruzados");
  t(E.outOfPosPenalty(def) > 0 && E.outOfPosPenalty(del) > 0, "y ambos pagan el castigo");
  t(E.swapAssignments(def, del) && E.playedPos(def) === "DEF", "volver a intercambiarlos los deja como estaban");
  t(E.outOfPosPenalty(def) === 0, "sin castigo al volver a su puesto");

  t(!E.swapAssignments(por, del), "el arquero NO puede intercambiarse con uno de campo");
  t(E.playedPos(por) === "POR" && E.playedPos(del) === "DEL", "y el rechazo no dejó a nadie movido");
  t(Number.isFinite(E.teamPowers(lineup, "normal", {}).def), "el equipo sigue calculando tras las reubicaciones");
}

// ---------- 6f. Plantel SIN ARQUERO: jugar corto se paga UNA vez ----------
// REGRESIÓN (1-ago-2026, lo cazó un barrido de balance a n=4000). §6b prueba lo mismo pero
// con el plantel entero — y el agujero estaba exactamente en el plantel diezmado.
//
// La cadena: sin ningún POR disponible el once se arma con 5 de campo; `formationLabel`
// cuenta solo DEF/MED/DEL y DA POR SENTADO el arquero, así que devuelve etiquetas que suman
// 5 ("1-1-3") y COINCIDEN con las de una formación real de 6. currentLineup la adoptaba y
// orderBySlots pedía 6 slots para un pool de 5: sin nadie de pos POR su findIndex fallaba,
// metía al primero de la fila en el arco y CORRÍA A TODOS una línea (DEF→POR, MED→DEF,
// DEL→MED). Tres castigos de −6 ENCIMA de la inferioridad numérica — que es el único
// castigo que corresponde (§Plantel diezmado: perder por diezmado es una historia).
//
// Se barre exhaustivo: todos los quintetos de campo posibles de cada jugable, o sea todas
// las formas que puede tomar un plantel sin arquero. Derivado, no hardcodeado.
{
  const combinaciones = (arr, k) => {
    if (k === 0) return [[]];
    if (arr.length < k) return [];
    const [x, ...resto] = arr;
    return [...combinaciones(resto, k - 1).map(c => [x, ...c]), ...combinaciones(resto, k)];
  };

  let casos = 0, conCastigo = null, conFormacion = null, noCorto = null, tamañoMal = null;
  for (const equipo of E.allTeams().filter(t => t.players)) {
    const base = E.newRun(equipo.id);
    const campo = base.squad.filter(p => p.pos !== "POR");
    for (const quinteto of combinaciones(campo.map(p => p.name), 5)) {
      const run = E.newRun(equipo.id);
      // Los dos arqueros afuera + todos los de campo salvo el quinteto elegido
      for (const p of run.squad) p.suspendido = p.pos === "POR" || !quinteto.includes(p.name);
      const available = run.squad.filter(p => !p.suspendido && p.lesionadoPartidos === 0);
      const { lineup, formationId } = E.currentLineup(run.squad, null, null);
      const val = E.validateLineup(available, lineup);
      casos++;

      const forma = `${equipo.id} [${available.map(p => p.pos).sort().join(",")}]`;
      const castigados = lineup.filter(p => E.outOfPosPenalty(p) > 0);
      if (castigados.length && !conCastigo) conCastigo = `${forma} → ${castigados.map(p => `${p.pos}→${E.playedPos(p)}`).join(" ")}`;
      // Sin arquero NINGUNA formación aplica: sus slots piden 6 cabezas y hay 5.
      if (E.getFormation(formationId) && !conFormacion) conFormacion = `${forma} → adoptó ${formationId}`;
      if (lineup.length !== 5 && !tamañoMal) tamañoMal = `${forma} → once de ${lineup.length}`;
      // El castigo que SÍ corresponde tiene que seguir ahí
      if (!(val.ok && val.short) && !noCorto) noCorto = `${forma} → ok=${val.ok} short=${val.short}`;
    }
  }

  t(casos > 0, `el barrido montó planteles sin arquero (${casos} casos)`);
  t(!conCastigo, `sin arquero NADIE juega fuera de puesto: el diezmado se paga una sola vez (${conCastigo})`);
  t(!conFormacion, `sin arquero no se adopta ninguna formación: la etiqueta de 5 es ambigua (${conFormacion})`);
  t(!tamañoMal, `el once diezmado presenta a los 5 que quedan en pie (${tamañoMal})`);
  t(!noCorto, `y sigue siendo válido en modo corto — la inferioridad numérica no se perdona (${noCorto})`);
}

// ---------- 6g. Con arquero, el diezmado tampoco improvisa puestos ----------
// El otro lado de la misma moneda: 1 POR + 4 de campo son 5, pero la etiqueta suma 4 y no
// choca con ninguna formación. Se fija para que un cambio futuro en FORMATIONS no lo rompa.
{
  for (const equipo of E.allTeams().filter(t => t.players)) {
    const run = E.newRun(equipo.id);
    const campo = run.squad.filter(p => p.pos !== "POR");
    const arquero = run.squad.find(p => p.pos === "POR");
    // Deja 1 arquero y los 4 primeros de campo
    for (const p of run.squad) p.suspendido = p !== arquero && !campo.slice(0, 4).includes(p);
    const available = run.squad.filter(p => !p.suspendido && p.lesionadoPartidos === 0);
    const { lineup } = E.currentLineup(run.squad, null, null);
    t(lineup.length === E.maxLineupSize(available), `${equipo.id}: con 1 arquero y 4 de campo presenta a los 5`);
    t(lineup.every(p => E.outOfPosPenalty(p) === 0), `${equipo.id}: y ninguno juega fuera de puesto`);
    t(lineup.filter(p => p.pos === "POR").length === 1, `${equipo.id}: el arquero que queda va al arco`);
  }
}

// ---------- 7. El castigo llega al PARTIDO, no solo a la ficha ----------
{
  const run = E.newRun("BRA");
  const available = run.squad.filter(p => !p.suspendido && p.lesionadoPartidos === 0);
  const once = E.autoLineup(available, "2-1-2");

  E.assignPositions(run.squad, once, "2-1-2");
  const sano = E.teamPowers(once, "normal", {});

  const roto = once.slice();
  [roto[1], roto[4]] = [roto[4], roto[1]];   // delantero al fondo, defensa arriba
  E.assignPositions(run.squad, roto, "2-1-2");
  const improvisado = E.teamPowers(roto, "normal", {});

  t(improvisado.def < sano.def, "parar a un delantero de defensa baja el poder defensivo REAL del partido");
  t(Number.isFinite(improvisado.def) && Number.isFinite(improvisado.atk), "los poderes siguen siendo números (nada de NaN)");
  t(improvisado.por === sano.por, "el arquero sigue siendo el arquero");
  E.assignPositions(run.squad, once, "2-1-2");
}

// ---------- 8. Los cambios del partido heredan el puesto ----------
{
  const run = E.newRun("BRA");
  const me = E.getTeam("BRA");
  const available = run.squad.filter(p => !p.suspendido && p.lesionadoPartidos === 0);
  const once = E.autoLineup(available, "2-1-2");
  // El DT para a un delantero de defensa (slot 1)
  const manual = once.slice();
  [manual[1], manual[4]] = [manual[4], manual[1]];
  E.assignPositions(run.squad, manual, "2-1-2");

  const bench = run.squad.filter(p => !manual.includes(p) && !p.suspendido && p.lesionadoPartidos === 0);
  const m = new E.Match({ team: me, lineup: manual.slice(), bench, mentalidad: "normal", buffs: {} }, E.getTeam("IRN"), false);

  const sale = manual[1];                                    // el delantero parado de DEF
  const entra = m.availableBench().find(b => b.pos !== "POR");
  t(!!entra, "hay un suplente de campo para el cambio");
  m.makeSub(sale, entra.name);
  t(entra.posJugada === "DEF", "el que entra ocupa el puesto del que sale, no el suyo natural");
  t(Number.isFinite(E.teamPowers(m.my.lineup, "normal", {}).def), "el partido sigue calculando tras el cambio");

  // Roja al arquero: el POR suplente entra por un jugador de campo y va AL ARCO
  const once2 = E.autoLineup(available, "2-1-2");
  const m2 = new E.Match({ team: me, lineup: once2.slice(), bench: run.squad.filter(p => !once2.includes(p)), mentalidad: "normal", buffs: {} }, E.getTeam("IRN"), false);
  E.assignPositions(run.squad, m2.my.lineup, "2-1-2");
  const gk = m2.availableBench().find(b => b.pos === "POR");
  const campo = m2.my.lineup.find(p => p.pos === "DEF");
  t(!!gk && !!campo, "hay arquero suplente y jugador de campo en cancha");
  m2.my.lineup.find(p => p.pos === "POR").expulsado = true;   // la roja que dispara el reemplazo
  m2.makeSub(campo, gk.name, true);
  t(gk.posJugada === "POR", "el arquero que entra por la roja va al ARCO, no al puesto del que salió");
  t(Number.isFinite(E.playerOverall(gk)), "la nota del arquero que entró no es NaN");
  t(E.teamPowers(m2.my.lineup, "normal", {}).por === gk, "el motor lo reconoce como su arquero");
}

// ---------- 9. El arco nunca queda vacío por un cambio ----------
// REGRESIÓN (bug del PO): `eligibleFor` solo vigilaba que un arquero suplente no entrara
// por un jugador de campo, pero no la dirección contraria — se podía mandar a un mediocampista
// al arco y el equipo quedaba SIN ARQUERO y con 6 de campo.
{
  const run = E.newRun("BRA");
  const me = E.getTeam("BRA");
  const { lineup } = E.currentLineup(run.squad, null, null);
  const bench = run.squad.filter(p => !lineup.includes(p));
  const m = new E.Match({ team: me, lineup: lineup.slice(), bench, mentalidad: "normal", buffs: {} }, E.getTeam("IRN"), false);

  const arquero = m.my.lineup.find(p => p.pos === "POR");
  const campoBanco = m.availableBench().filter(b => b.pos !== "POR");
  const gkBanco = m.availableBench().find(b => b.pos === "POR");

  t(campoBanco.length > 0 && !!gkBanco, "montado: hay suplentes de campo y un arquero suplente");
  t(m.eligibleFor(arquero).every(b => b.pos === "POR"), "por el arquero SOLO pueden entrar arqueros");
  t(m.eligibleFor(arquero).includes(gkBanco), "y el arquero suplente sí está entre ellos");

  const campo = m.my.lineup.find(p => p.pos === "DEF");
  t(m.eligibleFor(campo).every(b => b.pos !== "POR"), "por un jugador de campo NO puede entrar el arquero suplente");

  // El intento directo tiene que rebotar
  t(m.makeSub(arquero, campoBanco[0].name) === false, "makeSub rechaza mandar a un jugador de campo al arco");
  t(m.subsLeft === 3, "y el intento rechazado no gasta un cambio");
  t(m.my.lineup.includes(arquero), "el arquero sigue en cancha");
  t(!!E.teamPowers(m.my.lineup, "normal", {}).por, "el equipo NUNCA se queda sin arquero por un cambio");
  t(m.my.lineup.filter(p => E.playedPos(p) === "POR").length === 1, "hay exactamente 1 arquero, no 6 de campo");

  // El cambio legítimo de arquero sigue funcionando
  t(m.makeSub(arquero, gkBanco.name), "arquero por arquero sí se puede");
  t(E.playedPos(gkBanco) === "POR" && E.teamPowers(m.my.lineup, "normal", {}).por === gkBanco, "y el suplente queda como arquero");
}

// ---------- assignToFormation: cambiar el DIBUJO sin cambiar el once (PO 28-jul-2026) ----------
{
  const run = E.newRun("BRA");
  const { lineup } = E.currentLineup(run.squad, null, null);
  for (const f of E.FORMATIONS) {
    const map = E.assignToFormation(lineup, f.id);
    t(!!map, `el dibujo ${f.id} se puede armar con cualquier once de 6`, f.id);
    t(map.size === 6, `${f.id} reparte a los 6`, map.size);
    // NO cambia quiénes juegan: exactamente el mismo once, otro reparto
    t(lineup.every(p => map.has(p)), `${f.id} no deja a nadie afuera`);
    // Los puestos son EXACTAMENTE los que pide la formación
    const c = { POR: 0, DEF: 0, MED: 0, DEL: 0 };
    for (const pos of map.values()) c[pos]++;
    t(c.POR === 1 && c.DEF === f.def && c.MED === f.med && c.DEL === f.del,
      `${f.id} deja las líneas que pide`, JSON.stringify(c));
    // El arco es innegociable: solo un arquero (regla canPlayAt)
    const alArco = [...map].find(([, pos]) => pos === "POR")[0];
    t(alArco.pos === "POR", `${f.id} manda un arquero al arco`, alArco.name);
  }
  // Un dibujo que el once no cubre naturalmente se PERMITE (a diferencia del hub): alguien
  // juega fuera de puesto y paga su castigo — eso es la decisión del DT en partido.
  const tresAtras = E.assignToFormation(lineup, "3-1-1");
  const defs = lineup.filter(p => p.pos === "DEF").length;
  if (defs < 3) {
    const fuera = [...tresAtras].filter(([p, pos]) => pos !== "POR" && p.pos !== pos).length;
    t(fuera > 0, "si faltan defensas, alguien queda fuera de puesto (no se bloquea)", fuera);
  }
}

console.log(`lineup.test: ${checks} checks`);
console.log(fails ? `❌ ${fails} fallo(s)` : "✅ alineación y fuera de puesto OK");
process.exit(fails ? 1 : 0);
