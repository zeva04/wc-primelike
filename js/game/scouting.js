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
     jugados por el mundo vivo, bajas de run.rivalBans y la
     figura del rival. Nada de "filosofía del rival" hasta que
     exista Filosofía.
   - PURO: no consume rng, no muta la run (mirar el informe es
     gratis e ilimitado — la curiosidad no se castiga).
   ============================================================ */
import { getTeam } from "../data/teams-repo.js";
import { playerOverall, teamFigure } from "./ratings.js";
import { bestSix, expectedOpponentLineup, tourneyFormaMult } from "./opponents.js";
import { teamPowers, gkQuality } from "./match/powers.js";
import { rivalFilo, rivalFiloLevel, identityGapMult, filoEtapa, filoLevel } from "./philosophy.js";
import { koRoundOf } from "./tournament/knockout.js";
import { getPhilosophy, FILO_ETAPAS } from "../content/philosophies.js";

// La lectura táctica de cada identidad rival (F2): qué te propone y por dónde
// se le entra — el "España quiere la pelota: presiónala o enciérrate" del roadmap.
const FILO_SCOUT = {
  posesion: "Quiere la pelota y te va a hacer correr detrás de ella: presiónale la salida o enciérrate y espera tu momento.",
  press: "Te va a asfixiar la salida desde el minuto uno: salir jugando contra ellos es jugar con fuego — el pelotazo no es cobardía.",
  contra: "Espera agazapado y vive de tus pérdidas: cada pelota regalada en campo rival vuelve convertida en puñalada.",
  bloque: "Se encierra y revienta la pelota: derribar la muralla exige paciencia, y sus balones parados son su gol de vestuario.",
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
    filosofia: { id: rf.id, name: rfData.name, icon: rfData.icon, nivel: FILO_ETAPAS[rf.nivel].label, consolidada: rf.nivel === 2, detalle: FILO_SCOUT[rf.id] },
    modoMundial: koRound ? {
      pct: Math.round((tourneyFormaMult(koRound) - 1) * 100),
      madura: rivalFiloLevel(opp, koRound) > rivalFiloLevel(opp),
      // La identidad, en los dos sentidos: si su idea supera a la mía se nombra el
      // castigo (R3, accionable: consolidar ANTES de KO es la vacuna); si la mía lo
      // supera, se nombra la vara alta (al favorito le juegan la final). El informe
      // tiene que decir el multiplicador COMPLETO que va a llevar el rival — reportar
      // solo una mitad sería mentirle al DT sobre el partido que le espera.
      brechaPct: Math.round((identityGapMult(opp, filoEtapa(run), koRound, filoLevel(run)) - 1) * 100),
      // Cuál de las dos: el relato del informe no dice lo mismo si te respetan que si
      // te subestiman. `lead` = me tienen miedo; si no, es que llego corto de idea.
      lead: filoLevel(run) > 0 && identityGapMult(opp, filoEtapa(run), koRound, filoLevel(run)) > identityGapMult(opp, filoEtapa(run), koRound),
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
