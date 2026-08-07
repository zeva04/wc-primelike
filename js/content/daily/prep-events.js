/* Los eventos inevitables del calendario: cambios del mundo que no se deciden.
   Cada día sin partido trae uno (o un conflicto), sorteado por RAREZA. A mayor
   rareza, menos probable y más impactante:
   - comun       ±5 de stat o ±10/20 de energía
   - infrecuente ±8 de stat, ±12 de energía, o un MODIFICADOR del día
   - rara        ±10-12, combos de dos stats, o golpes al plantel
   - legendaria  campaña-defining (~1 por run)

   Los buffs duran hasta el próximo partido y se ACUMULAN entre días. El campo
   opcional `mod` convierte al evento en un MODIFICADOR de la Acción del Día:
     mod: { mods: {entrenar|recuperar|tactica: mult}, desc }
   mult 0 bloquea la acción hoy; 0.5 la reduce; 2 la duplica.

   `teaser` es el pronóstico que el World Cup Daily publica esa mañana: insinúa el
   tema SIN revelar magnitud ni rareza. `effect(run)` puede devolver un string que
   reemplaza `desc` (eventos con protagonista).

   Agregar un evento = agregar una fila con su `tema`, `tipo` (buff|debuff),
   `rareza`, `teaser` y `effect(run)`. */
import { clamp } from "../../core/math.js";
import { pick } from "../../core/rng.js";
import { addFiloProgress, addFirmaProgress, getPhilosophy, filoEtapaOf } from "../identity/philosophies.js";
import { STAT_LABELS } from "./day-actions.js";

const buff = (r, k, v) => { r.buffs[k] = (r.buffs[k] || 0) + v; };
const energia = (r, v) => r.squad.forEach(p => p.energia = clamp(p.energia + v, 5, 100));

export const PREP_EVENTS = [
  // ---------- COMUNES (los 10 originales, ±5) ----------
  { id: "definicion", rareza: "comun", tema: "entrenamiento", icon: "🎯", title: "Sesión de definición perfecta", tipo: "buff",   desc: "+5 de Tiro para el próximo partido.",
    teaser: "El cuerpo técnico prepara trabajos de cara al arco para hoy.",              effect: r => buff(r, "tiro", 5) },
  { id: "muro",       rareza: "comun", tema: "entrenamiento", icon: "🛡️", title: "Trabajo defensivo impecable",   tipo: "buff",   desc: "+5 de Defensa y Atajadas para el próximo partido.",
    teaser: "La pizarra amaneció llena de flechas defensivas.",                          effect: r => { buff(r, "defensa", 5); buff(r, "atajadas", 5); } },
  { id: "arenga",     rareza: "comun", tema: "vestuario",     icon: "🔥", title: "Arenga del capitán",            tipo: "buff",   desc: "+5 de Aura para el próximo partido.",
    teaser: "El capitán pidió unos minutos a solas con el grupo.",                       effect: r => buff(r, "aura", 5) },
  { id: "penales",    rareza: "comun", tema: "entrenamiento", icon: "🥅", title: "Tarde de penales",              tipo: "buff",   desc: "Bonus en penales del próximo partido.",
    teaser: "Hay una fila de pelotas esperando en el punto blanco.",                     effect: r => { r.buffs.penales = (r.buffs.penales || 0) + 0.10; } },
  { id: "descanso",   rareza: "comun", tema: "fisico",        icon: "😴", title: "Jornada de recuperación",       tipo: "buff",   desc: "+20 de energía para todo el plantel.",
    teaser: "El plan del día huele a siesta, pileta y masajes.",                         effect: r => energia(r, 20) },
  { id: "lluvia",     rareza: "comun", tema: "fisico",        icon: "🌧️", title: "Entrenamiento pasado por agua", tipo: "debuff", desc: "−10 de energía para todo el plantel.",
    teaser: "El pronóstico no pinta bien: nubes negras sobre la concentración.",
    // Evento × filosofía: la lluvia castiga distinto según tu fútbol —
    // el Press corre en el barro y la cancha pesada le corta el toque a la Posesión.
    effect: r => {
      energia(r, -10);
      if (r.filoId === "press") { energia(r, -5); return "El barro castiga doble al que presiona: −15 de energía para el plantel."; }
      if (r.filoId === "posesion") { buff(r, "pase_corto", -3); return "−10 de energía, y la cancha pesada le corta el toque a tu idea: −3 de Pase corto el próximo partido."; }
    } },
  { id: "molestias",  rareza: "comun", tema: "fisico",        icon: "🤕", title: "Molestias en la zaga",          tipo: "debuff", desc: "−5 de Defensa para el próximo partido.",
    teaser: "Se ven vendas y bolsas de hielo saliendo de la enfermería.",                effect: r => buff(r, "defensa", -5) },
  { id: "nervios",    rareza: "comun", tema: "vestuario",     icon: "😰", title: "Nervios previos",               tipo: "debuff", desc: "−5 de Aura para el próximo partido.",
    teaser: "Se respira tensión en los pasillos del hotel.",                             effect: r => buff(r, "aura", -5) },
  { id: "piernas",    rareza: "comun", tema: "entrenamiento", icon: "🦵", title: "Piernas cargadas",              tipo: "debuff", desc: "−5 de Tiro para el próximo partido.",
    teaser: "Los fisios advierten que las piernas vienen pesadas.",                      effect: r => buff(r, "tiro", -5) },
  { id: "prensa",     rareza: "comun", tema: "entorno",       icon: "📸", title: "Maratón de prensa y sponsors",  tipo: "debuff", desc: "−5 de Pase para el próximo partido.",
    teaser: "La agenda del día está tomada por micrófonos y flashes.",                   effect: r => buff(r, "pase_corto", -5) },

  // ---------- INFRECUENTES (±8, ±12 energía, o modificadores del día) ----------
  { id: "doble_turno", rareza: "infrecuente", tema: "entrenamiento", icon: "🏋️", title: "Doble turno de trabajo", tipo: "buff",
    desc: "El cuerpo técnico programa doble sesión: hoy Entrenar rinde el doble.",
    teaser: "El DT canceló la tarde libre: hoy se trabaja a fondo.",
    mod: { mods: { entrenar: 2 }, desc: "Entrenar rinde ×2 hoy" }, effect: () => {} },
  { id: "cancha_anegada", rareza: "infrecuente", tema: "entorno", icon: "🌊", title: "Cancha anegada", tipo: "debuff",
    desc: "El temporal inundó el complejo: hoy no se puede Entrenar.",
    teaser: "Llovió toda la noche y el predio amaneció bajo agua.",
    mod: { mods: { entrenar: 0 }, desc: "Entrenar no disponible hoy" }, effect: () => {} },
  { id: "spa", rareza: "infrecuente", tema: "fisico", icon: "💆", title: "Día de spa", tipo: "buff",
    desc: "El hotel abre su spa para el plantel: hoy Recuperar rinde el doble.",
    teaser: "El hotel prepara algo especial para el plantel.",
    mod: { mods: { recuperar: 2 }, desc: "Recuperar rinde ×2 hoy" }, effect: () => {} },
  { id: "pizarra", rareza: "infrecuente", tema: "vestuario", icon: "🧠", title: "El DT ve algo en el video", tipo: "buff",
    desc: "Un patrón del rival quedó al descubierto: hoy la Sesión táctica rinde el doble.",
    teaser: "El analista de video pidió una reunión urgente con el DT.",
    mod: { mods: { tactica: 2 }, desc: "Sesión táctica rinde ×2 hoy" }, effect: () => {} },
  { id: "alineacion_filtrada", rareza: "infrecuente", tema: "entorno", icon: "🕵️", title: "Se filtró la alineación", tipo: "debuff",
    desc: "La prensa publicó el plan de partido: hoy la Sesión táctica no sirve de nada.",
    teaser: "Hay revuelo en la prensa: alguien habló de más.",
    mod: { mods: { tactica: 0 }, desc: "Sesión táctica no disponible hoy" }, effect: () => {} },
  // SPRINT 4 — evento-PROBLEMA.
  // Pega donde más duele desde el rebalance del núcleo: el descanso. No baja un número —
  // rompe el plan del día, que es la decisión que el DT ya tenía tomada.
  { id: "jet_lag", rareza: "infrecuente", tema: "fisico", icon: "🥱", title: "Jet lag", tipo: "debuff",
    desc: "El cambio de huso horario desarmó el sueño del plantel: hoy Recuperar rinde la mitad.",
    teaser: "Media concentración amaneció mirando el techo a las cuatro de la mañana.",
    mod: { mods: { recuperar: 0.5 }, desc: "Recuperar rinde la mitad hoy" }, effect: () => {} },
  // ---------- F3: eventos de FILOSOFÍA (leen la identidad de la run) ----------
  { id: "prensa_bautiza", rareza: "infrecuente", tema: "entorno", icon: "📰", title: "La prensa bautiza tu estilo", tipo: "buff",
    desc: "Los medios le ponen nombre a tu fútbol: si la idea ya camina, el grupo se agranda (+8 de Moral); si aún no se nota, se burlan (−5 de Aura).",
    teaser: "Un columnista prepara una nota grande sobre la identidad del equipo.",
    effect: r => {
      const f = getPhilosophy(r.filoId);
      if (f && filoEtapaOf(r) >= 1) { r.moral = clamp((r.moral ?? 50) + 8, 1, 100); return `"${f.name}" ya es marca registrada: la prensa aplaude la idea y el grupo se agranda (+8 de Moral).`; }
      buff(r, "aura", -5);
      return "La nota salió con sorna: el proyecto todavía no se ve en la cancha (−5 de Aura el próximo partido).";
    } },
  { id: "ensayo_firma", rareza: "infrecuente", tema: "entrenamiento", icon: "🎬", title: "Ensayo de la jugada firma", tipo: "buff",
    desc: "La mañana entera dedicada a TU fútbol: experiencia para tu identidad y un plus en la stat que ese fútbol trabaja.",
    teaser: "El cuerpo técnico montó la práctica de hoy alrededor de una sola jugada.",
    effect: r => {
      const a = addFirmaProgress(r, 0.5);
      if (!a) { buff(r, "pase_corto", 3); return "Sin una idea instalada, el ensayo quedó en fundamentos: +3 de Pase corto el próximo partido."; }
      buff(r, a.stat, 3);
      return `Cien repeticiones de lo nuestro: +${a.xp} XP de ${a.label} y +3 de ${STAT_LABELS[a.stat]} para el próximo partido.`;
    } },
  { id: "toque_seda",  rareza: "infrecuente", tema: "entrenamiento", icon: "🎩", title: "Toque de seda",            tipo: "buff",   desc: "+8 de Pase para el próximo partido.",
    teaser: "Los ayudantes arman circuitos de pases en espacios reducidos.",             effect: r => buff(r, "pase_corto", 8) },
  { id: "banderazo",   rareza: "infrecuente", tema: "entorno",       icon: "🥁", title: "Banderazo de la hinchada", tipo: "buff",   desc: "+8 de Aura para el próximo partido.",
    teaser: "Se escuchan bombos a lo lejos: la hinchada anda cerca del hotel.",          effect: r => buff(r, "aura", 8) },
  { id: "viaje_pesado",rareza: "infrecuente", tema: "fisico",        icon: "✈️", title: "Viaje pesado",             tipo: "debuff", desc: "−12 de energía para todo el plantel.",
    teaser: "Toca micro y avión: día de traslado a la próxima sede.",                    effect: r => energia(r, -12) },
  // Interactúan con Forma y Ánimo: content/ muta run con primitivas + clamp, sin importar game/
  { id: "psicologo_deportivo", rareza: "infrecuente", tema: "vestuario", icon: "🧠", title: "Sesión con el psicólogo deportivo", tipo: "buff",
    desc: "El jugador más golpeado anímicamente recupera la confianza.",
    teaser: "Un especialista llegó a la concentración con una libreta bajo el brazo.",
    effect: r => {
      const peor = r.squad.reduce((a, b) => ((b.momento ?? 4) < (a.momento ?? 4) ? b : a));
      if ((peor.momento ?? 4) >= 4) return "La charla fue pura prevención: el grupo está bien de la cabeza.";
      peor.momento = 4;
      return `${peor.name} salió de la sesión con otra cara: recupera la confianza (Momento al neutro).`;
    } },
  { id: "pais_ilusionado", rareza: "infrecuente", tema: "entorno", icon: "🇺🇳", title: "El país se ilusiona", tipo: "buff",
    desc: "+8 de Moral: el aliento se siente desde casa.",
    teaser: "Las calles amanecieron pintadas con los colores de la selección.",
    effect: r => { r.moral = clamp((r.moral ?? 50) + 8, 1, 100); } },

  // ---------- RARAS (±10-12, combos o golpes al plantel) ----------
  { id: "masajista",     rareza: "rara", tema: "fisico",        icon: "🙌", title: "Fisios de élite",            tipo: "buff",   desc: "+25 de energía para todo el plantel.",
    teaser: "Llegaron refuerzos al área médica con maletas llenas de aparatos.",         effect: r => energia(r, 25) },
  { id: "sparring",      rareza: "rara", tema: "entrenamiento", icon: "🤺", title: "Sparring de lujo",           tipo: "buff",   desc: "+8 de Tiro y Defensa para el próximo partido.",
    teaser: "Se rumorea que hoy habrá un ensayo de altísimo nivel.",                     effect: r => { buff(r, "tiro", 8); buff(r, "defensa", 8); } },
  { id: "leyenda",       rareza: "rara", tema: "vestuario",     icon: "👑", title: "Visita de una leyenda",      tipo: "buff",   desc: "+12 de Aura para el próximo partido.",
    teaser: "Hay movimiento raro en recepción: se espera una visita ilustre.",           effect: r => buff(r, "aura", 12) },
  { id: "video_premium", rareza: "rara", tema: "vestuario",     icon: "🎥", title: "Sesión de video reveladora", tipo: "buff",   desc: "La identidad del equipo da un salto (experiencia para tu filosofía).",
    teaser: "El analista no durmió: dice que encontró algo grande.",                     effect: r => { const a = addFiloProgress(r, 1); return !a ? undefined : `El video muestra exactamente dónde crecer: +${a.xp} XP de ${a.label} — la identidad da un salto.`; } },
  { id: "crisis_prensa", rareza: "rara", tema: "entorno",       icon: "🎙️", title: "Crisis con la prensa",       tipo: "debuff", desc: "−10 de Aura y −6 de Pase para el próximo partido.",
    teaser: "Un rumor feo empieza a circular en los portales deportivos.",               effect: r => { buff(r, "aura", -10); buff(r, "pase_corto", -6); } },
  { id: "ola_calor",     rareza: "rara", tema: "fisico",        icon: "🥵", title: "Ola de calor", tipo: "debuff",
    desc: "−15 de energía para todo el plantel, y hoy Recuperar rinde la mitad.",
    teaser: "El termómetro amenaza con romper récords hoy.",
    mod: { mods: { recuperar: 0.5 }, desc: "Recuperar rinde la mitad hoy" },
    // Evento × filosofía: correr arriba con 40 grados es doble castigo para el Press.
    effect: r => {
      energia(r, -15);
      if (r.filoId === "press") { energia(r, -5); return "−20 de energía para el plantel: presionar bajo este sol es un suplicio."; }
    } },
  { id: "visita_maestro", rareza: "rara", tema: "entrenamiento", icon: "🎓", title: "Visita del maestro de tu escuela", tipo: "buff",
    desc: "Un ídolo de tu filosofía pasa el día con el equipo: una sesión entera de experiencia para tu identidad.",
    teaser: "Corre el rumor de que hoy llega una eminencia del fútbol que juega el equipo.",
    effect: r => {
      const a = addFirmaProgress(r, 1);
      if (!a) { buff(r, "aura", 5); return "Sin una idea declarada, la visita quedó en anécdota inspiradora: +5 de Aura el próximo partido."; }
      return `El maestro habló el idioma de la casa: +${a.xp} XP de ${a.label} — la identidad se profundiza.`;
    } },
  { id: "critica_demoledora", rareza: "rara", tema: "entorno", icon: "🗞️", title: "Crítica demoledora", tipo: "debuff",
    desc: "−8 de Moral, y la presión alcanza a tu figura del momento.",
    teaser: "Una pluma famosa prepara una columna venenosa sobre el equipo.",
    effect: r => {
      r.moral = clamp((r.moral ?? 50) - 8, 1, 100);
      const figura = r.squad.reduce((a, b) => ((b.momento ?? 4) > (a.momento ?? 4) ? b : a));
      if ((figura.momento ?? 4) <= 4) return "El vestuario acusa el golpe: −8 de Moral.";
      figura.momento -= 1;
      return `La columna apunta directo a ${figura.name} y la presión le pasa factura: −8 de Moral y su Momento cae.`;
    } },
  
  { id: "golpe_practica", rareza: "rara", tema: "entrenamiento", icon: "🚑", title: "Golpe en la práctica", tipo: "debuff",
    desc: "Un jugador queda descartado para el próximo partido.",
    teaser: "Los médicos miran con preocupación la intensidad de la práctica.",
    effect: r => {
      const sanos = r.squad.filter(p => p.pos !== "POR" && p.lesionadoPartidos === 0 && !p.suspendido);
      if (!sanos.length) { energia(r, -10); return "El susto quedó en nada, pero el plantel gastó energías de más (−10)."; }
      const p = pick(sanos);
      p.lesionadoPartidos = 1;
      p.momento = 4; // la lesión le corta la forma (neutro; content no importa game/momentum)
      return `${p.name} cayó mal en la práctica: se pierde el próximo partido.`;
    } },

  // ---------- LEGENDARIAS (~1 por run: campaña-defining) ----------
  { id: "dia_perfecto", rareza: "legendaria", tema: "vestuario", icon: "🌟", title: "Día perfecto", tipo: "buff",
    desc: "Todo fluye: +5 a TODAS las stats para el próximo partido.",
    teaser: "Amaneció un día extrañamente luminoso en la concentración.",
    effect: r => ["tiro", "defensa", "atajadas", "pase_corto", "pase_largo", "velocidad", "cabezazo", "aura"].forEach(k => buff(r, k, 5)) },
  
  { id: "clase_magistral", rareza: "legendaria", tema: "entrenamiento", icon: "🎓", title: "Clase magistral", tipo: "buff",
    desc: "Tu mejor delantero da un salto de calidad permanente.",
    teaser: "Dicen que el entrenamiento de hoy tendrá un invitado muy especial.",
    effect: r => {
      const dels = r.squad.filter(p => p.pos === "DEL");
      const star = dels.length ? dels.reduce((a, b) => (b.stats.tiro > a.stats.tiro ? b : a)) : null;
      if (!star) { buff(r, "tiro", 10); return "+10 de Tiro para el próximo partido."; }
      star.stats.tiro = clamp(star.stats.tiro + 3, 1, 99);
      return `${star.name} incorporó un recurso nuevo: +3 de Tiro PERMANENTE (ahora ${star.stats.tiro}).`;
    } },
  
  { id: "inspiracion", rareza: "legendaria", tema: "entrenamiento", icon: "✨", title: "El día que todo sale", tipo: "buff",
    desc: "Uno de esos días irrepetibles: hoy TODAS las acciones rinden el doble.",
    teaser: "Hay una energía rara en el aire: de esos días que se recuerdan.",
    mod: { mods: { entrenar: 2, recuperar: 2, tactica: 2 }, desc: "Todas las acciones rinden ×2 hoy" }, effect: () => {} },
  
  { id: "gripe", rareza: "legendaria", tema: "fisico", icon: "🤒", title: "Brote de gripe", tipo: "debuff",
    desc: "Media concentración en cama: −25 de energía para todo el plantel.",
    teaser: "El médico del plantel pidió cerrar el comedor por precaución.",
    effect: r => energia(r, -25) },
  
  { id: "pelea", rareza: "legendaria", tema: "vestuario", icon: "💥", title: "Duelo de egos", tipo: "debuff",
    desc: "El plantel se pelea luego de la práctica: −12 de Aura y −10 de energía.",
    teaser: "Murmullos en el vestuario: los referentes piden una reunión a puertas cerradas.",
    effect: r => { buff(r, "aura", -12); energia(r, -10); } },
];
