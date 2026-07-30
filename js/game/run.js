/* ============================================================
   game/run — nacimiento de la run: sorteo de grupos, clonado
   del plantel y forma canónica del estado.
   ============================================================ */
import { ri, shuffle } from "../core/rng.js";
import { allTeams, getTeam } from "../data/teams-repo.js";
import { addJournal } from "./journal.js";
import { scheduleNextMatch } from "./calendar.js";

export const GROUP_NAMES = "ABCDEFGHIJKL".split("");

/** Crea una run nueva: sortea los 12 grupos (solo clasificados) y clona el plantel con estado. */
export function newRun(myTeamId) {
  const data = allTeams();
  const me = data.find(t => t.id === myTeamId);
  // Solo participan los clasificados reales al Mundial 2026 (qualified !== false).
  // Los no clasificados quedan en la base de datos para features futuras.
  const others = shuffle(data.filter(t => t.id !== myTeamId && t.qualified !== false));
  if (others.length < 47) throw new Error(`Se necesitan 47 rivales clasificados y hay ${others.length}`);

  // 12 grupos de 4. Mi equipo cae en un grupo aleatorio.
  const groups = [];
  const myGroupIdx = ri(0, 11);
  let cursor = 0;
  for (let g = 0; g < 12; g++) {
    const teams = [];
    const count = (g === myGroupIdx) ? 3 : 4;
    for (let i = 0; i < count; i++) teams.push(others[cursor++].id);
    if (g === myGroupIdx) teams.splice(ri(0, 3), 0, myTeamId);
    groups.push({ name: GROUP_NAMES[g], teamIds: teams, results: [] });
  }

  // Fixture round-robin de 3 fechas para 4 equipos (índices)
  const ROUNDS = [
    [[0, 1], [2, 3]],
    [[0, 2], [1, 3]],
    [[0, 3], [1, 2]],
  ];

  // Plantel propio: copia profunda con estado de run
  const squad = me.players.map(p => ({
    name: p.name, pos: p.pos, num: p.num,
    stats: { ...p.stats },
    look: p.look, // apariencia del sprite (el bug de "todos iguales" era esta copia perdida)
    energia: 100,
    momento: 4,               // Momento 1..7, nace neutro (escribe game/momentum)
    amarillas: 0, suspendido: false, lesionadoPartidos: 0,
    goles: 0, asistencias: 0, partidos: 0,
  }));

  // Forma canónica del estado de una run. Propiedad de cada campo: ARQUITECTURA §3.1.
  // Solo datos planos (JSON-serializable): jugadores referenciados por objeto dentro
  // de la run, por nombre cuando cruzan una frontera.
  const run = {
    teamId: myTeamId,
    squad,
    groups, myGroupIdx, rounds: ROUNDS,
    stage: "groups",           // groups | r32 | r16 | qf | sf | final  (escribe game/flow)
    matchday: 0,               // 0..2 en fase de grupos                (escribe game/flow)
    koMatches: null,           // cruces de la ronda eliminatoria       (escribe game/flow)
    koPlayed: {},              // {idx: resultado} cruces ajenos ya jugados (escribe tournament/world, resetea flow)
    lastWinners: null,         // ganadores de la última ronda          (escribe game/flow)
    lastNight: [],             // partidos ajenos "de anoche" para el Daily (escribe tournament/world)
    rivalBans: {},             // {teamId: [nombres]} suspendidos por roja ajena para SU próximo partido (escribe world, limpia flow ante mí)
    buffs: {},                 // bonus temporales del próximo partido  (escriben content/, limpia flow)
    day: 1,                    // día 1 = 11 de junio de 2026           (escribe game/calendar)
    nextMatchDay: null,        // día del próximo partido               (escribe game/calendar)
    windowStart: 1,            // primer día de la ventana de prep actual (escribe game/calendar)
    dayPlan: {},               // {día: {kind, id, tema}} pre-sorteados (escribe game/calendar)
    actionPending: true,       // Acción del Día por elegir (levanta calendar, baja day-action)
    lastAction: null,          // {day, icon, title} de la última acción (escribe day-action)
    dayMod: null,              // modificador de las acciones de HOY: {icon,title,desc,mods} (escribe calendar)
    dayOpp: null,              // Oportunidad viva HOY: {id} o null (escribe calendar; day-action la consume)
    diasSinEntrenar: 0,        // racha de días de prep sin Entrenar/Táctica → oxidación R1 (escribe game/oxidation; flow resetea al jugar)
    moral: 50,                 // Moral del equipo 1..100 (escribe game/morale; content/ la muta con clamp)
    altura: 3,                 // Altura del bloque 1..5 que el DT deja puesta (escribe ui/hub; viaja a matchCtx)
    filoId: null,              // filosofía que se JUEGA hoy (escribe game/philosophy)
    filoInicial: null,         // la escuela del DT: fija toda la run, decide la afinidad de XP (escribe game/philosophy)
    filoXp: { press: 0, posesion: 0, contra: 0, bloque: 0 }, // las 4 progresiones INDEPENDIENTES (escriben game/philosophy y content/ vía addFiloProgress)
    planFilo: null,            // Plan de Partido declarado: ×1.5 de XP para esa idea (escribe content/day-actions, limpia flow)
    dtXp: 0,                   // experiencia del Director Técnico — solo la pagan las subidas de filosofía (escribe game/coach)
    dtNivel: 1,                // nivel del DT 1..20; cada subida imprime 1 PI (escribe game/coach)
    identityPoints: 0,         // Puntos de Identidad disponibles (escriben game/coach y game/philosophy; gasta game/traits)
    rasgos: {},                // {filoId: [traitIds]} rasgos comprados por árbol — TODOS activos a la vez (escribe game/traits)
    scorers: {},               // goleadores del torneo ajenos {"teamId|name": {teamId,name,goles}} (escribe game/scorers)
    assists: {},               // asistidores del torneo ajenos {"teamId|name": {teamId,name,asistencias}} (escribe game/assists)
    stats: { pj: 0, pg: 0, pe: 0, pp: 0, gf: 0, gc: 0, tarjetas: 0, eventos: 0, penalesAtajados: 0, oppOfrecidas: 0, oppAprovechadas: 0 },
    champion: false,
    journal: [],               // Diario de Campaña: la memoria narrativa de la run
  };
  addJournal(run, {
    icon: "🎬", tone: "gold", title: `Comienza la aventura de ${me.name}`,
    desc: `El sorteo los deja en el Grupo ${GROUP_NAMES[myGroupIdx]} junto a ${groups[myGroupIdx].teamIds.filter(id => id !== myTeamId).map(id => getTeam(id).name).join(", ")}.`,
  });
  scheduleNextMatch(run);
  return run;
}
