/* ============================================================
   content/conflicts — conflictos con decisión (Game Vision:
   dilemas con 2 opciones y trade-offs sobre plantel o buffs).
   Ocurren en días del calendario igual que los eventos; también
   llevan temática. Los efectos de stat son ±5 por la misma razón
   que en prep-events.

   Agregar un conflicto nuevo = agregar una fila con `tema`,
   `teaser` (el pronóstico ambiguo que publica el World Cup
   Daily esa mañana), `text` (string o función(run)) y 2+
   `options` cuyo effect(run) devuelve el texto del resultado.
   ============================================================ */
import { rnd, shuffle } from "../core/rng.js";
import { clamp } from "../core/math.js";

/** Los dos jugadores de la pelea, resueltos por nombre desde `run.peleaEntre` (§3.1). */
const peleadores = r => (r.peleaEntre || []).map(n => r.squad.find(p => p.name === n)).filter(Boolean);
/** El jugador señalado por la fuga, resuelto por nombre desde `run.filtrador` (§3.1). */
const filtrador = r => r.squad.find(p => p.name === r.filtrador);

export const RANDOM_EVENTS = [
  {
    id: "sponsor", tema: "entorno", icon: "💰", title: "Oferta de sponsor",
    teaser: "Ejecutivos de traje rondan la concentración desde temprano.",
    text: "Una marca deportiva ofrece una sesión publicitaria con el plantel. Es agotadora, pero motiva al grupo.",
    options: [
      { label: "Aceptar", effect: r => { r.squad.forEach(p => { p.stats.aura = clamp(p.stats.aura + 5, 1, 99); p.energia = clamp(p.energia - 15, 5, 100); }); return "El plantel posa para las cámaras: +5 de Aura permanente, −15 energía."; } },
      { label: "Rechazar", effect: r => { r.squad.forEach(p => p.energia = clamp(p.energia + 10, 5, 100)); return "Prefieren descansar tranquilos: +10 energía."; } },
    ],
  },
  {
    id: "localia", tema: "entorno", icon: "🏟️", title: "¡Marea de hinchas!",
    teaser: "La ciudad empieza a teñirse de nuestros colores.",
    text: "Miles de compatriotas viajaron a la sede. El estadio será prácticamente una localía.",
    options: [
      { label: "Salir a saludarlos", effect: r => { r.buffs.aura = (r.buffs.aura || 0) + 5; return "El equipo se llena de energía emocional: +5 de Aura el próximo partido."; } },
      { label: "Mantener la concentración", effect: r => { r.buffs.defensa = (r.buffs.defensa || 0) + 5; return "Foco total: +5 de Defensa el próximo partido."; } },
    ],
  },
  {
    id: "medicos", tema: "fisico", icon: "🧑‍⚕️", title: "Insumos médicos de primera",
    teaser: "La federación anuncia novedades del área médica para hoy.",
    text: "La federación consiguió un equipo médico de élite para esta fase.",
    options: [
      { label: "Recuperación intensiva", effect: r => { r.squad.forEach(p => { p.energia = clamp(p.energia + 25, 5, 100); if (p.lesionadoPartidos > 0) p.lesionadoPartidos--; }); return "+25 energía para todos y las lesiones se aceleran en su recuperación."; } },
      { label: "Prevención de lesiones", effect: r => { r.buffs.antiLesion = true; return "Vendajes y fisioterapia: sin riesgo de lesión el próximo partido."; } },
    ],
  },
  {
    id: "pelea", tema: "vestuario", icon: "🥊", title: "¡Pelea en el entrenamiento!",
    teaser: "El clima en la práctica viene espeso desde temprano.",
    // `run.peleaEntre` guarda los NOMBRES de los dos protagonistas, no las referencias:
    // la regla de serialización de ARQUITECTURA §3.1 exige que `run` sea JSON-izable
    // (antes eran `_peleaA/_peleaB` apuntando a objetos del squad — deuda saldada 21-jul-2026).
    text: (r) => { const [a, b] = shuffle(r.squad).slice(0, 2); r.peleaEntre = [a.name, b.name]; return `${a.name} y ${b.name} se fueron a las manos en la práctica. El camarín está dividido.`; },
    options: [
      { label: "Castigar a ambos", effect: r => { const ps = peleadores(r); ps.forEach(p => p.stats.aura = clamp(p.stats.aura - 5, 1, 99)); return `Disciplina ante todo: ${ps.map(p => p.name).join(" y ")} pierden 5 de Aura, pero el grupo respeta tu autoridad.`; } },
      { label: "Hacer de mediador", effect: r => { if (rnd() < 0.5) { r.squad.forEach(p => p.stats.aura = clamp(p.stats.aura + 5, 1, 99)); return "¡Funciona! El plantel sale fortalecido: +5 de Aura para todos."; } peleadores(r).forEach(p => p.energia = clamp(p.energia - 20, 5, 100)); return "La reunión se alarga hasta la madrugada y no resuelve nada: ambos pierden 20 de energía."; } },
    ],
  },
  {
    id: "virus", tema: "fisico", icon: "🤒", title: "Virus en la concentración",
    teaser: "En el hotel se habla de varios estómagos revueltos.",
    text: "Un virus estomacal recorre el hotel. Varios jugadores amanecieron débiles.",
    options: [
      { label: "Aislar a los enfermos", effect: r => { shuffle(r.squad).slice(0, 3).forEach(p => p.energia = clamp(p.energia - 25, 5, 100)); return "3 jugadores pierden 25 de energía, pero el resto se salva."; } },
      { label: "Seguir la rutina normal", effect: r => { if (rnd() < 0.4) { r.squad.forEach(p => p.energia = clamp(p.energia - 15, 5, 100)); return "El virus se expande: −15 energía para TODOS."; } return "Por suerte era una falsa alarma. No pasa nada."; } },
    ],
  },
  // ---------- SPRINT 4: conflictos-PROBLEMA (Bible §4.5) ----------
  // No reparten premios: las dos ramas cobran algo. Usan los recursos que el juego ya
  // tiene escasos (energía y moral) en vez de mover aura como casi todo lo anterior.
  {
    id: "carga_fisica", tema: "fisico", icon: "🏋️", title: "El preparador físico pide más",
    teaser: "El cuerpo físico y el técnico discuten a los gritos junto al campo.",
    text: "El preparador quiere una doble sesión de carga antes del partido. El plantel viene fundido y algunos referentes ya pusieron cara.",
    options: [
      { label: "Cargar la pierna", effect: r => { r.squad.forEach(p => p.energia = clamp(p.energia - 18, 5, 100)); r.buffs.tactica = +((r.buffs.tactica || 0) + 0.15).toFixed(2); return "Doble sesión a fondo: −18 de energía para todos, pero el equipo llega mucho mejor plantado."; } },
      { label: "Bajar la carga", effect: r => { r.squad.forEach(p => p.energia = clamp(p.energia + 8, 5, 100)); r.buffs.aura = (r.buffs.aura || 0) - 5; return "Se levanta la segunda sesión: +8 de energía, pero el grupo llega blando de cabeza (−5 de Aura el próximo partido)."; } },
    ],
  },
  {
    id: "fuga_vestuario", tema: "vestuario", icon: "🕳️", title: "Fuga en el vestuario",
    teaser: "Un portal publicó detalles que solo se hablaron puertas adentro.",
    text: (r) => { const p = shuffle(r.squad)[0]; r.filtrador = p.name; return `Alguien filtró la interna a la prensa y todos los dedos apuntan a ${p.name}. El grupo espera tu reacción.`; },
    options: [
      { label: "Apartarlo del plantel", effect: r => { r.moral = clamp((r.moral ?? 50) - 10, 1, 100); r.buffs.aura = (r.buffs.aura || 0) + 5; const p = filtrador(r); if (p) p.momento = clamp((p.momento ?? 4) - 2, 1, 7); return `${r.filtrador} queda afuera del grupo: −10 de Moral, pero nadie vuelve a hablar de más (+5 de Aura el próximo partido).`; } },
      { label: "Taparlo y seguir", effect: r => { if (rnd() < 0.45) return "La historia se desinfla sola en 24 horas. Te la llevaste de arriba."; r.moral = clamp((r.moral ?? 50) - 14, 1, 100); return "El silencio se lee como complicidad y la interna estalla peor: −14 de Moral."; } },
      { label: "Hablar de frente con el grupo", effect: r => { r.squad.forEach(p => p.energia = clamp(p.energia - 10, 5, 100)); return "La charla se estira hasta la madrugada: nadie pierde la cara, pero el plantel amanece fundido (−10 de energía)."; } },
    ],
  },
  {
    id: "periodista", tema: "entorno", icon: "🎤", title: "Polémica en la prensa",
    teaser: "Un titular de la prensa promete sacudir el día.",
    text: "Un periodista publicó declaraciones sacadas de contexto de tu capitán. Hay revuelo.",
    options: [
      { label: "Conferencia para aclarar", effect: r => { r.buffs.aura = (r.buffs.aura || 0) + 5; r.squad.forEach(p => p.energia = clamp(p.energia - 5, 5, 100)); return "La aclaración une al grupo contra la prensa: +5 de Aura el próximo partido, −5 energía."; } },
      { label: "Ignorar el ruido", effect: r => { if (rnd() < 0.35) { r.squad.forEach(p => p.stats.aura = clamp(p.stats.aura - 5, 1, 99)); return "El ruido crece y afecta al grupo: −5 de Aura permanente."; } return "El escándalo muere solo. Bien jugado."; } },
    ],
  },
];
