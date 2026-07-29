/* ============================================================
   content/opportunities — Eventos de Oportunidad (Bible §4.5):
   ofertas únicas que COMPITEN con la Acción del Día. Tomarla
   consume la acción de hoy (day-action.js); dejarla pasar la
   pierde para siempre, sin rastro (el silencio es el costo).

   Reglas del sistema (decisiones del PO, 16-jul-2026):
   - Máx 1 por ventana entre partidos; ~20% de los días libres
     la sortean (calendar.js, OPPORTUNITY_CHANCE).
   - El modificador del día (run.dayMod) NO la escala ni la
     bloquea: es un premio externo, no una acción del club.
   - El calendario NO la anticipa (sin `tema`) y el Daily no la
     pronostica (sin `teaser`): la sorpresa es parte del diseño.

   La tentación es que rinde MÁS que una acción normal del mismo
   corte — el trade-off no está en el efecto sino en el costo de
   oportunidad: tomarla es renunciar a entrenar/recuperar/táctica.
   A mayor rareza, mayor premio (misma escala que prep-events).
   Pool de 20 elegido por el PO: 5 comunes · 7 infrecuentes ·
   6 raras · 2 legendarias (la distribución es LEY en el validador).

   `choose` (opcional) convierte la oportunidad en una DECISIÓN con
   protagonista: el DT elige a qué jugador apunta el premio.
     choose: { label: "pregunta para la UI", candidates: run => [jugadores] }
   Su `effect(run, jugador)` recibe al elegido; day-action valida
   que el objetivo esté entre los candidatos (por nombre, §3.1).

   `effect(run)` puede devolver un string para reemplazar `desc`
   (oportunidades con protagonista). Solo sistemas existentes:
   buffs, energía, lesiones, mejora permanente. Ni dinero ni moral.

   Agregar una oportunidad = agregar una fila con su `rareza`.
   ============================================================ */
import { clamp } from "../core/math.js";
import { addFiloProgress } from "./philosophies.js";

// Descanso dirigido (Sprint 3, decisión PO 20-jul-2026): el PO lo quiso como EVENTO RARO
// con protagonista elegido, no como Acción del Día — así la rotación fina es un premio
// ocasional y no una herramienta permanente (que habría inflado la ventaja de energía).
const DESCANSO_ENERGIA = 25;

const buff = (r, k, v) => { r.buffs[k] = (r.buffs[k] || 0) + v; };
const energia = (r, v) => r.squad.forEach(p => p.energia = clamp(p.energia + v, 5, 100));
const perm = (p, k, v) => { p.stats[k] = clamp(p.stats[k] + v, 1, 99); return p.stats[k]; };

export const OPPORTUNITIES = [
  // ---------- COMUNES (mejores que una acción normal, sin costo extra) ----------
  { id: "clinica_definicion", rareza: "comun", icon: "🏅", title: "Clínica de definición",
    desc: "Un ex goleador del país anfitrión ofrece una tarde de trabajo: +6 de Tiro para el próximo partido, sin cansar a nadie.",
    effect: r => buff(r, "tiro", 6) },

  { id: "pelota_parada", rareza: "comun", icon: "🚩", title: "Ensayo de pelota parada",
    desc: "Un especialista en balón detenido pide una sesión: +5 de Defensa y +5 de Cabezazo para el próximo partido.",
    effect: r => { buff(r, "defensa", 5); buff(r, "cabezazo", 5); } },

  { id: "arquero_invitado", rareza: "comun", icon: "🧤", title: "Arquero invitado",
    desc: "Un histórico del arco nacional pasa a trabajar con tus arqueros: +6 de Atajadas para el próximo partido.",
    effect: r => buff(r, "atajadas", 6) },

  { id: "jornada_ninos", rareza: "comun", icon: "🎪", title: "Jornada con niños de la comunidad",
    desc: "El plantel se suelta y se olvida de la presión: +6 de Aura y +5 de energía.",
    effect: r => { buff(r, "aura", 6); energia(r, 5); } },

  { id: "entrenamiento_abierto", rareza: "comun", icon: "🎺", title: "Caravana al entrenamiento abierto",
    desc: "Miles de hinchas coparon la práctica: +7 de Aura para el próximo partido.",
    effect: r => buff(r, "aura", 7) },

  // ---------- INFRECUENTES (claramente mejores, o combos con costo) ----------
  { id: "amistoso_puertas", rareza: "infrecuente", icon: "🤝", title: "Amistoso a puertas cerradas",
    desc: "Un club local ofrece un ensayo de verdad: la identidad progresa (experiencia para tu filosofía), pero cuesta −8 de energía.",
    effect: r => { const a = addFiloProgress(r, 1); energia(r, -8); return !a ? undefined : `El ensayo puso a prueba las ideas: +${a.xp} XP de ${a.label} y −8 de energía.`; } },

  { id: "psicologo", rareza: "infrecuente", icon: "🧠", title: "Psicólogo deportivo de élite",
    desc: "Una eminencia ofrece una sesión grupal: borra todos los efectos negativos acumulados para el próximo partido.",
    effect: r => {
      const malos = Object.entries(r.buffs).filter(([, v]) => typeof v === "number" && v < 0);
      if (!malos.length) return "El grupo estaba en paz: la sesión terminó siendo una linda charla, nada más.";
      for (const [k] of malos) r.buffs[k] = 0;
      return `Catarsis grupal: ${malos.length} efecto${malos.length > 1 ? "s" : ""} negativo${malos.length > 1 ? "s" : ""} borrado${malos.length > 1 ? "s" : ""} de cara al próximo partido.`;
    } },

  { id: "especialista_medico", rareza: "infrecuente", icon: "🩹", title: "Especialista médico de paso por la sede",
    desc: "Un referente mundial en recuperación ofrece atender a tu lesionado más comprometido.",
    effect: r => {
      const les = r.squad.filter(p => p.lesionadoPartidos > 0);
      if (!les.length) { energia(r, 8); return "No había lesionados que tratar: el plantel aprovechó una puesta a punto (+8 de energía)."; }
      const p = les.reduce((a, b) => (b.lesionadoPartidos > a.lesionadoPartidos ? b : a));
      p.lesionadoPartidos--;
      return p.lesionadoPartidos === 0
        ? `${p.name} respondió de maravilla al tratamiento: queda DISPONIBLE para el próximo partido.`
        : `${p.name} recorta su recuperación: le quedan ${p.lesionadoPartidos} partido(s) de baja.`;
    } },

  { id: "spa_termal", rareza: "infrecuente", icon: "♨️", title: "Spa termal invita al plantel",
    desc: "Aguas termales, masajes y silencio: +20 de energía para todo el plantel.",
    effect: r => energia(r, 20) },

  { id: "sparring_local", rareza: "infrecuente", icon: "🥊", title: "Sparring contra un club local",
    desc: "Fútbol de verdad contra piernas frescas: +6 de Tiro y +6 de Defensa, a cambio de −6 de energía.",
    effect: r => { buff(r, "tiro", 6); buff(r, "defensa", 6); energia(r, -6); } },

  { id: "penales_figura", rareza: "infrecuente", icon: "🥅", title: "Tarde de penales con figura invitada",
    desc: "Un pateador legendario dirige la práctica: bonus fuerte en penales y +4 de Reflejos para el próximo partido.",
    effect: r => { r.buffs.penales = (r.buffs.penales || 0) + 0.15; buff(r, "reflejos", 4); } },

  { id: "archivo_periodista", rareza: "infrecuente", icon: "📼", title: "El archivo del periodista veterano",
    desc: "Décadas de apuntes sobre tu próximo rival, sin pedir nada a cambio: la identidad afina detalles (algo de experiencia para tu filosofía).",
    effect: r => { const a = addFiloProgress(r, 0.5); return !a ? undefined : `Los apuntes del veterano afinan el plan: +${a.xp} XP de ${a.label}.`; } },

  // ---------- RARAS (el DT elige al protagonista: calidad permanente o descanso a medida) ----------
  { id: "descanso_dirigido", rareza: "rara", icon: "🛌", title: "Plan de descanso a medida",
    desc: `El cuerpo médico arma una jornada de recuperación exclusiva para UN jugador que elijas: +${DESCANSO_ENERGIA} de energía.`,
    choose: { label: "¿A quién le das el día de descanso?", candidates: r => [...r.squad] },
    effect: (r, p) => { p.energia = clamp(p.energia + DESCANSO_ENERGIA, 5, 100); return `${p.name} tuvo su jornada de descanso a medida: +${DESCANSO_ENERGIA} de energía (ahora ${p.energia}%).`; } },

  { id: "mentor_leyenda", rareza: "rara", icon: "🎖️", title: "Un campeón del mundo, de visita",
    desc: "Una leyenda se ofrece a trabajar el día entero con UN jugador que elijas: +3 de Aura PERMANENTE.",
    choose: { label: "¿Quién pasa el día con la leyenda?", candidates: r => [...r.squad] },
    effect: (r, p) => `${p.name} absorbió cada consejo de la leyenda: +3 de Aura PERMANENTE (ahora ${perm(p, "aura", 3)}).` },

  { id: "botines_medida", rareza: "rara", icon: "👟", title: "El sponsor trae botines a medida",
    desc: "Tecnología de punta para UN jugador de campo que elijas: +2 de Tiro PERMANENTE.",
    choose: { label: "¿Quién estrena los botines?", candidates: r => r.squad.filter(p => p.pos !== "POR") },
    effect: (r, p) => `${p.name} estrenó sus botines a medida: +2 de Tiro PERMANENTE (ahora ${perm(p, "tiro", 2)}).` },

  { id: "leyenda_arco", rareza: "rara", icon: "🥇", title: "Leyenda de los tres palos",
    desc: "Un arquero de época ofrece una jornada intensiva con UN arquero que elijas: +2 de Atajadas y +2 de Reflejos PERMANENTES.",
    choose: { label: "¿Qué arquero recibe la clase?", candidates: r => r.squad.filter(p => p.pos === "POR") },
    effect: (r, p) => { perm(p, "reflejos", 2); return `${p.name} entrenó con la leyenda: +2 de Atajadas y +2 de Reflejos PERMANENTES (atajadas ${perm(p, "atajadas", 2)}).`; } },

  { id: "meditacion", rareza: "rara", icon: "🪷", title: "Jornada especial de meditación",
    desc: "Un maestro guía al plantel en un día de introspección: +10 de Aura para el próximo partido y +12 de energía.",
    effect: r => { buff(r, "aura", 10); energia(r, 12); } },

  { id: "doble_jornada", rareza: "rara", icon: "📊", title: "Doble jornada con un cuerpo técnico top",
    desc: "El staff de un grande abre su pizarra un día entero: la identidad da un salto grande (mucha experiencia para tu filosofía), a cambio de −10 de energía.",
    effect: r => { const a = addFiloProgress(r, 1.5); energia(r, -10); return !a ? undefined : `Un día entero de pizarra ajena: +${a.xp} XP de ${a.label} y −10 de energía.`; } },

  // ---------- LEGENDARIAS (~1 cada 5-6 runs: campaña-defining) ----------
  { id: "doctor_milagro", rareza: "legendaria", icon: "🩺", title: "El Doctor Milagro",
    desc: "El médico deportivo más famoso del planeta ofrece su día: cura TODAS las lesiones del plantel.",
    effect: r => {
      const les = r.squad.filter(p => p.lesionadoPartidos > 0);
      if (les.length) {
        les.forEach(p => p.lesionadoPartidos = 0);
        energia(r, 10);
        return `El Doctor Milagro hizo lo suyo: ${les.map(p => p.name).join(", ")} — todo el plantel DISPONIBLE, y encima se respira alivio (+10 de energía).`;
      }
      r.buffs.antiLesion = true;
      r.squad.forEach(p => p.energia = 100);
      return "Sin lesionados que curar, blindó al plantel: nadie se lesiona en el próximo partido y la energía quedó a tope.";
    } },

  { id: "genio_tactico", rareza: "legendaria", icon: "🧙", title: "Un genio táctico se suma por 24 horas",
    desc: "Un entrenador de culto trabaja un día entero con el equipo y a solas con UN jugador que elijas: la identidad da un salto enorme (experiencia a raudales para tu filosofía) y el elegido gana +3 de Pase PERMANENTE.",
    choose: { label: "¿Quién trabaja mano a mano con el genio?", candidates: r => [...r.squad] },
    effect: (r, p) => {
      const a = addFiloProgress(r, 2);
      return `El genio dejó su huella: ${a ? `+${a.xp} XP de ${a.label} para la identidad` : "el equipo repensó su fútbol"} y ${p.name} ganó +3 de Pase corto PERMANENTE (ahora ${perm(p, "pase_corto", 3)}).`;
    } },
];
