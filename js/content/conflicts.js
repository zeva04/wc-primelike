/* ============================================================
   content/conflicts — conflictos con decisión (Game Vision:
   dilemas con 2 opciones y trade-offs sobre plantel o buffs).
   Ocurren en días del calendario igual que los eventos; también
   llevan temática. Los efectos de stat son ±5 por la misma razón
   que en prep-events.

   Agregar un conflicto nuevo = agregar una fila con `tema`,
   `text` (string o función(run)) y 2+ `options` cuyo effect(run)
   devuelve el texto del resultado. Nada más.
   ============================================================ */
import { rnd, shuffle } from "../core/rng.js";
import { clamp } from "../core/math.js";

export const RANDOM_EVENTS = [
  {
    id: "sponsor", tema: "entorno", icon: "💰", title: "Oferta de sponsor",
    text: "Una marca deportiva ofrece una sesión publicitaria con el plantel. Es agotadora, pero motiva al grupo.",
    options: [
      { label: "Aceptar", effect: r => { r.squad.forEach(p => { p.stats.aura = clamp(p.stats.aura + 5, 1, 99); p.energia = clamp(p.energia - 15, 5, 100); }); return "El plantel posa para las cámaras: +5 de Aura permanente, −15 energía."; } },
      { label: "Rechazar", effect: r => { r.squad.forEach(p => p.energia = clamp(p.energia + 10, 5, 100)); return "Prefieren descansar tranquilos: +10 energía."; } },
    ],
  },
  {
    id: "localia", tema: "entorno", icon: "🏟️", title: "¡Marea de hinchas!",
    text: "Miles de compatriotas viajaron a la sede. El estadio será prácticamente una localía.",
    options: [
      { label: "Salir a saludarlos", effect: r => { r.buffs.aura = (r.buffs.aura || 0) + 5; return "El equipo se llena de energía emocional: +5 de Aura el próximo partido."; } },
      { label: "Mantener la concentración", effect: r => { r.buffs.defensa = (r.buffs.defensa || 0) + 5; return "Foco total: +5 de Defensa el próximo partido."; } },
    ],
  },
  {
    id: "medicos", tema: "fisico", icon: "🧑‍⚕️", title: "Insumos médicos de primera",
    text: "La federación consiguió un equipo médico de élite para esta fase.",
    options: [
      { label: "Recuperación intensiva", effect: r => { r.squad.forEach(p => { p.energia = clamp(p.energia + 25, 5, 100); if (p.lesionadoPartidos > 0) p.lesionadoPartidos--; }); return "+25 energía para todos y las lesiones se aceleran en su recuperación."; } },
      { label: "Prevención de lesiones", effect: r => { r.buffs.antiLesion = true; return "Vendajes y fisioterapia: sin riesgo de lesión el próximo partido."; } },
    ],
  },
  {
    id: "pelea", tema: "vestuario", icon: "🥊", title: "¡Pelea en el entrenamiento!",
    text: (r) => { const [a, b] = shuffle(r.squad).slice(0, 2); r._peleaA = a; r._peleaB = b; return `${a.name} y ${b.name} se fueron a las manos en la práctica. El camarín está dividido.`; },
    options: [
      { label: "Castigar a ambos", effect: r => { [r._peleaA, r._peleaB].forEach(p => p.stats.aura = clamp(p.stats.aura - 5, 1, 99)); return `Disciplina ante todo: ${r._peleaA.name} y ${r._peleaB.name} pierden 5 de Aura, pero el grupo respeta tu autoridad.`; } },
      { label: "Hacer de mediador", effect: r => { if (rnd() < 0.5) { r.squad.forEach(p => p.stats.aura = clamp(p.stats.aura + 5, 1, 99)); return "¡Funciona! El plantel sale fortalecido: +5 de Aura para todos."; } [r._peleaA, r._peleaB].forEach(p => p.energia = clamp(p.energia - 20, 5, 100)); return "La reunión se alarga hasta la madrugada y no resuelve nada: ambos pierden 20 de energía."; } },
    ],
  },
  {
    id: "virus", tema: "fisico", icon: "🤒", title: "Virus en la concentración",
    text: "Un virus estomacal recorre el hotel. Varios jugadores amanecieron débiles.",
    options: [
      { label: "Aislar a los enfermos", effect: r => { shuffle(r.squad).slice(0, 3).forEach(p => p.energia = clamp(p.energia - 25, 5, 100)); return "3 jugadores pierden 25 de energía, pero el resto se salva."; } },
      { label: "Seguir la rutina normal", effect: r => { if (rnd() < 0.4) { r.squad.forEach(p => p.energia = clamp(p.energia - 15, 5, 100)); return "El virus se expande: −15 energía para TODOS."; } return "Por suerte era una falsa alarma. No pasa nada."; } },
    ],
  },
  {
    id: "periodista", tema: "entorno", icon: "🎤", title: "Polémica en la prensa",
    text: "Un periodista publicó declaraciones sacadas de contexto de tu capitán. Hay revuelo.",
    options: [
      { label: "Conferencia para aclarar", effect: r => { r.buffs.aura = (r.buffs.aura || 0) + 5; r.squad.forEach(p => p.energia = clamp(p.energia - 5, 5, 100)); return "La aclaración une al grupo contra la prensa: +5 de Aura el próximo partido, −5 energía."; } },
      { label: "Ignorar el ruido", effect: r => { if (rnd() < 0.35) { r.squad.forEach(p => p.stats.aura = clamp(p.stats.aura - 5, 1, 99)); return "El ruido crece y afecta al grupo: −5 de Aura permanente."; } return "El escándalo muere solo. Bien jugado."; } },
    ],
  },
];
