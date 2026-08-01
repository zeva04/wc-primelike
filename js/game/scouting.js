/* ============================================================
   game/scouting — el Informe del Rival (Bible §4.6, sprint
   "Preparación con dientes"): lo que el cuerpo técnico sabe del
   próximo cruce, para que la Acción del Día se decida mirando
   al rival y no en el vacío.

   Reglas de diseño:
   - CUALITATIVO (UX Bible): niveles Alto/Medio/Bajo relativos a
     TU equipo, nunca porcentajes. Los niveles comparan el cruce
     real: su ataque contra tu defensa, su defensa contra tu
     ataque, su arquero contra el tuyo.
   - Solo datos que el motor YA tiene: poderes esperados (stats
     sin ruido, opponents.expectedOpponentLineup), resultados
     jugados por el mundo vivo, bajas de run.rivalBans, la figura
     del rival, su identidad (F2) y —desde el sprint del
     Territorio— la ALTURA DE BLOQUE con la que va a jugar: es la
     información que le faltaba a la decisión más nueva del DT,
     que hasta ahora se tomaba a ciegas.
   - PURO: no consume rng, no muta la run (mirar el informe es
     gratis e ilimitado — la curiosidad no se castiga).
   ============================================================ */
import { getTeam } from "../data/teams-repo.js";
import { playerOverall, teamFigure } from "./ratings.js";
import { bestSix, expectedOpponentLineup } from "./opponents.js";
import { teamPowers, gkQuality } from "./match/powers.js";
import { rivalFilo, rivalFiloLevel, identityGapMult, filoEtapa, filoLevel } from "./philosophy.js";
import { koRoundOf } from "./tournament/knockout.js";
import { getPhilosophy, FILO_ETAPAS, counterEdge } from "../content/philosophies.js";
import { baseHeight, heightOf } from "./match/field.js";

// La lectura táctica de cada identidad rival (F2): qué te propone y por dónde
// se le entra — el "España quiere la pelota: presiónala o enciérrate" del roadmap.
// El CONSEJO de cada línea nombra al cazador de esa identidad en el ciclo (Press >
// Posesión > Bloque > Contra > Press): lo que el ojeador te dice que hagas es
// exactamente lo que el motor premia. Antes no cuadraban — la línea de `posesion`
// recomendaba "enciérrate", que bajo el ciclo nuevo es justo el cruce que se pierde.
const FILO_SCOUT = {
  posesion: "Quiere la pelota y te va a hacer correr detrás de ella: la única forma de quitársela es ir a buscarla arriba — encerrarse solo les da la tarde entera para pensar.",
  press: "Te va a asfixiar la salida desde el minuto uno: salir jugando contra ellos es jugar con fuego, pero si aguantas el primer salto la espalda que dejan es enorme.",
  contra: "Espera agazapado y vive de tus pérdidas: cada pelota regalada en campo rival vuelve convertida en puñalada — no les regales el espacio que necesitan.",
  bloque: "Se encierra y revienta la pelota: derribar la muralla exige paciencia y mover el balón hasta que se parta, y ojo con sus balones parados, que son su gol de vestuario.",
};

/* CÓMO SE VA A PARAR (sprint del Territorio): la altura de bloque que va a jugar el rival y,
   sobre todo, QUÉ CAMINO DEJA ABIERTO. Es la información que le faltaba a la decisión más
   nueva del DT —su propia altura—, que se toma en la pizarra y antes se tomaba a ciegas.
   Dicho como lo diría un ojeador: dónde te esperan y por dónde se les entra. */
const BLOQUE_SCOUT = {
  1: "Se meten todos en su área y no te van a dejar un metro a la espalda: hay que tener paciencia, mover la pelota de lado a lado y confiar en el balón parado.",
  2: "Bloque replegado que espera tu error para salir de contra: cuidado con perderla adelantado, porque cada regalo vuelve convertido en carrera.",
  3: "Se paran en el mediocampo sin regalar nada: el partido se va a disputar en el medio y lo va a definir quién gane esa zona.",
  4: "Adelantan líneas para incomodarte la salida: te van a apretar arriba, pero detrás de su zaga hay espacio — la pelota a la espalda y el desborde son el camino.",
  5: "Juegan con los centrales cerca del círculo central: te van a asfixiar la salida desde el minuto uno… y toda su espalda queda descubierta para el que se anime a atacarla.",
};

/* EL MODO MUNDIAL, EN PALABRAS (sprint de la Escalada, decisión PO 31-jul-2026).

   El informe decía "🔥 Modo Mundial: llega un +18% encendido". Era el ÚNICO porcentaje
   del módulo y contradecía su propia regla declarada acá arriba ("CUALITATIVO, nunca
   porcentajes"). Con la escalada convexa ese número habría llegado a +45%, que es
   exactamente el problema: convierte una amenaza en una planilla de cálculo, y el DT
   termina leyendo un dial en vez de leer un partido.

   Cada ronda tiene ahora su propia voz, y lo que sube no es un multiplicador: es lo que
   el rival se está jugando. La información sigue siendo accionable —el texto dice qué
   esperar y qué hacer— pero se lee como un ojeador, no como una hoja de balance. */
const MODO_MUNDIAL = {
  1: { titulo: "Se acabaron los ensayos", texto: "En eliminatoria no hay revancha, y eso solo ya los pone a otra intensidad: nadie quiere ser el que se vuelve a casa en la primera." },
  2: { titulo: "Ya no queda ningún equipo de relleno", texto: "El que llegó hasta acá no llegó de casualidad. Se les nota en cómo aprietan los últimos veinte minutos." },
  3: { titulo: "Acá el Mundial se pone serio", texto: "Este no es el equipo que viste en la primera semana. A esta altura del torneo son otro animal, y lo saben." },
  4: { titulo: "Una semifinal se juega una vez en la vida", texto: "Van a dejar hasta lo que no tienen. Nadie se guarda nada cuando la final está a noventa minutos." },
  5: { titulo: "Es LA FINAL", texto: "No hay reserva, no hay mañana, no hay cálculo. Van a morir en la cancha — y hay que llegar dispuesto a lo mismo." },
};

/* La BRECHA DE IDENTIDAD, también en palabras: las dos caras del mismo multiplicador
   (R3 + la vara alta del techo). `lead` = les llevo ventaja de idea y me respetan;
   si no, es que llego corto y me van a pasar por encima con la suya. */
// Arrancan con "Encima" y no con "Y" a propósito: la frase de `madura` que puede
// precederlas ya empieza con "Y", y pintadas juntas quedaban dos "Y" seguidas.
const BRECHA_SCOUT = {
  lead: "Encima nos tienen miedo: saben a qué jugamos y van a dar el partido de su torneo. Al favorito nadie le juega de igual a igual.",
  behind: "Encima llegan con más idea que nosotros: a la final no se llega improvisando — consolidar nuestra identidad es la vacuna.",
};

/* EL CRUCE, ANTICIPADO (sprint del Rival que Decide, gate del PO: *"que el informe lo
   anticipe SIEMPRE: si no lo veo venir es un impuesto, no una decisión"*).

   Es el dato más accionable del informe, porque es el único que el DT puede CAMBIAR con
   un día: declarar el Plan de Partido que caza a esa idea. Y se puede decir sin mentir
   porque la identidad del rival es su ESENCIA y no una elección de último momento
   (decisión PO: el rival reacciona durante el partido, no contra-elige antes).

   Cualitativo como todo el módulo: ni el multiplicador ni los puntos porcentuales. Lo
   que se nombra es de quién va a ser la pelota, que es exactamente donde muerde el ciclo
   (`filoShareShift`) y lo que el DT va a ver en la pantalla. */
const CRUCE_SCOUT = {
  1: { tono: "bien", titulo: "El cruce nos favorece", texto: "Nuestra idea es justo la que a ellos les incomoda: si el equipo juega a lo que sabe, la pelota va a ser nuestra más tiempo del que ellos quisieran." },
  0: { tono: "neutro", titulo: "El cruce es parejo", texto: "Ninguna de las dos ideas incomoda especialmente a la otra. Acá no va a decidir el pizarrón: va a decidir quién ejecuta mejor." },
  [-1]: { tono: "mal", titulo: "El cruce nos viene mal", texto: "Su idea está hecha para hacerle daño a la nuestra: van a tener la pelota más de lo que nos conviene. Cambiar el plan de partido cuesta un día — y este es el día para pensarlo." },
};

// Umbral en escala de poder (~0-5): ±0.25 ≈ 5 puntos de rating de diferencia
const THRESHOLD = 0.25;
const nivel = diff => (diff >= THRESHOLD ? "Alto" : diff <= -THRESHOLD ? "Bajo" : "Medio");

const DETALLE = {
  ataque: {
    Alto: "Su ofensiva supera a tu defensa: cada espacio que dejes lo van a castigar.",
    Medio: "Su ataque y tu defensa están a la par: el duelo se define en los detalles.",
    Bajo: "Tu defensa está por encima de su ataque: sin regalos, no deberían lastimarte.",
  },
  defensa: {
    Alto: "Su bloque defensivo supera a tu ataque: va a haber que trabajar cada gol.",
    Medio: "Su defensa y tu ataque están parejos: la efectividad va a mandar.",
    Bajo: "Tu ataque está por encima de su defensa: hay espacios para lastimar.",
  },
  arquero: {
    Alto: "Su arquero es superior al tuyo: el mano a mano no te conviene.",
    Medio: "Los arqueros están a la par: nadie gana el partido bajo los palos.",
    Bajo: "Tu arquero es superior: en un partido cerrado, esa ventaja pesa.",
  },
};

const POR_QUE = {
  DEL: "Su gol: el hombre que define los partidos.",
  MED: "Maneja los hilos: todo el juego pasa por sus pies.",
  DEF: "Ordena el fondo: la muralla que hay que mover.",
  POR: "Achica todo: un arquero que gana puntos solo.",
};

/** Copia limpia para calcular poderes sin arrastrar estado de run (posJugada, energía del torneo). */
const shadow = p => ({ name: p.name, pos: p.pos, stats: { ...p.stats }, energia: 100 });

/** La figura del rival: con stats reales manda la nota; sin ellas, su figura curada (la primera). */
function keyFigure(opp) {
  if (opp.players) {
    const star = teamFigure(opp); // mejor media, incluye POR, desempata por aura (§ratings)
    return { name: star.name, pos: star.pos, nota: playerOverall(star), por_que: POR_QUE[star.pos] };
  }
  const star = opp.figures[0];
  return { name: star.name, pos: star.pos, nota: null, por_que: POR_QUE[star.pos] };
}

/** Los partidos ya jugados por el rival en su grupo, del más reciente al más viejo (máx 3). */
function recentForm(run, oppId) {
  const g = run.groups.find(g => g.teamIds.includes(oppId));
  if (!g) return [];
  return g.results
    .filter(r => r.a === oppId || r.b === oppId)
    .map(r => {
      const soyA = r.a === oppId;
      const gf = soyA ? r.gA : r.gB, gc = soyA ? r.gB : r.gA;
      return { rival: getTeam(soyA ? r.b : r.a).name, marcador: `${gf}-${gc}`, res: gf > gc ? "V" : gf < gc ? "D" : "E" };
    })
    .reverse()
    .slice(0, 3);
}

/**
 * El Informe del Rival completo:
 *   { oppId, name, lineas: {ataque|defensa|arquero: {nivel, detalle}},
 *     figura: {name, pos, nota|null, por_que}, forma: [{rival, marcador, res}],
 *     bajas: [nombres], enEliminatorias: bool }
 * Los niveles usan la alineación esperada del rival (sin ruido, con sus bajas
 * descontadas) contra tu mejor seis DISPONIBLE hoy, ambos sin buffs: calidad
 * base — los efectos del calendario ya se ven en su propia card del hub.
 */
export function buildOpponentReport(run, oppId) {
  const opp = getTeam(oppId);
  const bajas = run.rivalBans[oppId] || [];

  const oppP = teamPowers(expectedOpponentLineup(opp, bajas).map(shadow), "normal", {});
  // shadow ANTES de bestSix: sobre jugadores de la run, playerOverall castiga por la
  // posJugada del momento (lección v13) y elegiría mal; la copia limpia mide su puesto natural
  const available = run.squad.filter(p => !p.suspendido && p.lesionadoPartidos === 0).map(shadow);
  const myP = teamPowers(bestSix(available), "normal", {});

  // La identidad del rival (F2): curada para los 16, derivada para el resto. El nivel
  // sale de su jerarquía (los grandes llegan Consolidados) — el informe la NOMBRA
  // porque es accionable: la matriz de counters premia elegir bien contra qué juegas.
  // R2: el nivel que muestra es el MADURADO por la ronda (el que vas a enfrentar), y
  // `modoMundial` narra la escalada (forma de torneo) cuando hay eliminatoria.
  const koRound = koRoundOf(run.stage);
  const rf = rivalFilo(opp, koRound);
  const rfData = getPhilosophy(rf.id);

  return {
    oppId,
    name: opp.name,
    filosofia: {
      id: rf.id, name: rfData.name, icon: rfData.icon, nivel: FILO_ETAPAS[rf.nivel].label,
      consolidada: rf.nivel === 2, detalle: FILO_SCOUT[rf.id],
      // EL CRUCE: cómo se lleva MI idea con la suya. `null` mientras no haya elegido
      // identidad (el informe del sorteo no puede hablar de un cruce que no existe).
      cruce: run.filoId ? { signo: counterEdge(run.filoId, rf.id), ...CRUCE_SCOUT[counterEdge(run.filoId, rf.id)] } : null,
    },
    // CÓMO SE VA A PARAR: la misma altura que va a jugar en el partido (field.baseHeight
    // la deriva de su identidad y su nivel; el marcador la mueve después, ya en la cancha).
    bloque: (n => ({ n, ...heightOf(n), detalle: BLOQUE_SCOUT[n] }))(baseHeight(rf)),
    // MODO MUNDIAL: la escalada de la ronda, dicha por un ojeador y no por una planilla.
    // `ronda` viaja igual que el texto porque la UI necesita saber cuán fuerte pintarlo:
    // una final no puede verse como unos 16avos. Es el ÚNICO número que sale de acá, y
    // no es una magnitud del motor — es en qué ronda estás, que el DT ya sabe.
    modoMundial: koRound ? {
      ronda: koRound,
      ...MODO_MUNDIAL[koRound],
      madura: rivalFiloLevel(opp, koRound) > rivalFiloLevel(opp),
      // La identidad, en los dos sentidos: si su idea supera a la mía se nombra el
      // castigo (R3, accionable: consolidar ANTES de KO es la vacuna); si la mía lo
      // supera, se nombra la vara alta (al favorito le juegan la final). El informe
      // tiene que nombrar el multiplicador COMPLETO que va a llevar el rival — callar
      // una de las dos mitades sería mentirle al DT sobre el partido que le espera.
      brecha: (gap => gap <= 1 ? null
        : BRECHA_SCOUT[filoLevel(run) > 0 && gap > identityGapMult(opp, filoEtapa(run), koRound) ? "lead" : "behind"]
      )(identityGapMult(opp, filoEtapa(run), koRound, filoLevel(run))),
    } : null,
    lineas: {
      ataque: { nivel: nivel(oppP.atk - myP.def), detalle: DETALLE.ataque[nivel(oppP.atk - myP.def)] },
      defensa: { nivel: nivel(oppP.def - myP.atk), detalle: DETALLE.defensa[nivel(oppP.def - myP.atk)] },
      arquero: { nivel: nivel(gkQuality(oppP.por, {}) - gkQuality(myP.por, {})), detalle: DETALLE.arquero[nivel(gkQuality(oppP.por, {}) - gkQuality(myP.por, {}))] },
    },
    figura: keyFigure(opp),
    forma: recentForm(run, oppId),
    bajas: [...bajas],
    enEliminatorias: run.stage !== "groups",
  };
}
