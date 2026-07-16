/* ============================================================
   content/prep-events — los 30 eventos inevitables del calendario
   (Game Vision: "Eventos" = cambios del mundo que no se deciden).

   Cada día sin partido trae uno (o un conflicto, ver calendar.js),
   sorteado por RAREZA (content/rarities.js): a mayor rareza, menos
   probable y MÁS impactante. Magnitudes por nivel:
   - comun       ±5 de stat o ±10/20 de energía (los 10 originales)
   - infrecuente ±8 de stat, ±12 de energía, o un MODIFICADOR del día
   - rara        ±10-12, combos de dos stats, o golpes al plantel
   - legendaria  campaña-defining: todas las stats, crecimiento
                 permanente, brotes… (~1 por run)

   Los buffs de stat duran hasta el próximo partido y se ACUMULAN
   entre días. El campo opcional `mod` convierte al evento en un
   MODIFICADOR de la Acción del Día (Bible §4.5: los eventos
   cambian el problema de hoy, no solo los números):
     mod: { mods: {entrenar|recuperar|tactica: mult}, desc }
   mult 0 bloquea la acción hoy; 0.5 la reduce; 2 la duplica.
   Lo aplica game/day-action vía run.dayMod (escribe calendar).

   `effect(run)` puede devolver un string para reemplazar `desc`
   (eventos con protagonista, p.ej. una lesión en la práctica).

   Agregar un evento nuevo = agregar una fila con su `tema`,
   `tipo` (buff|debuff), `rareza` y `effect(run)`. Nada más.
   ============================================================ */
import { clamp } from "../core/math.js";
import { pick } from "../core/rng.js";

const buff = (r, k, v) => { r.buffs[k] = (r.buffs[k] || 0) + v; };
const energia = (r, v) => r.squad.forEach(p => p.energia = clamp(p.energia + v, 5, 100));

export const PREP_EVENTS = [
  // ---------- COMUNES (los 10 originales, ±5) ----------
  { id: "definicion", rareza: "comun", tema: "entrenamiento", icon: "🎯", title: "Sesión de definición perfecta", tipo: "buff",   desc: "+5 de Tiro para el próximo partido.",               effect: r => buff(r, "tiro", 5) },
  { id: "muro",       rareza: "comun", tema: "entrenamiento", icon: "🛡️", title: "Trabajo defensivo impecable",   tipo: "buff",   desc: "+5 de Defensa y Atajadas para el próximo partido.",  effect: r => { buff(r, "defensa", 5); buff(r, "atajadas", 5); } },
  { id: "arenga",     rareza: "comun", tema: "vestuario",     icon: "🔥", title: "Arenga del capitán",            tipo: "buff",   desc: "+5 de Aura para el próximo partido.",                effect: r => buff(r, "aura", 5) },
  { id: "penales",    rareza: "comun", tema: "entrenamiento", icon: "🥅", title: "Tarde de penales",              tipo: "buff",   desc: "Bonus en penales del próximo partido.",              effect: r => { r.buffs.penales = (r.buffs.penales || 0) + 0.10; } },
  { id: "descanso",   rareza: "comun", tema: "fisico",        icon: "😴", title: "Jornada de recuperación",       tipo: "buff",   desc: "+20 de energía para todo el plantel.",               effect: r => energia(r, 20) },
  { id: "lluvia",     rareza: "comun", tema: "fisico",        icon: "🌧️", title: "Entrenamiento pasado por agua", tipo: "debuff", desc: "−10 de energía para todo el plantel.",               effect: r => energia(r, -10) },
  { id: "molestias",  rareza: "comun", tema: "fisico",        icon: "🤕", title: "Molestias en la zaga",          tipo: "debuff", desc: "−5 de Defensa para el próximo partido.",             effect: r => buff(r, "defensa", -5) },
  { id: "nervios",    rareza: "comun", tema: "vestuario",     icon: "😰", title: "Nervios previos",               tipo: "debuff", desc: "−5 de Aura para el próximo partido.",                effect: r => buff(r, "aura", -5) },
  { id: "piernas",    rareza: "comun", tema: "entrenamiento", icon: "🦵", title: "Piernas cargadas",              tipo: "debuff", desc: "−5 de Tiro para el próximo partido.",                effect: r => buff(r, "tiro", -5) },
  { id: "prensa",     rareza: "comun", tema: "entorno",       icon: "📸", title: "Maratón de prensa y sponsors",  tipo: "debuff", desc: "−5 de Pase para el próximo partido.",                effect: r => buff(r, "pase", -5) },

  // ---------- INFRECUENTES (±8, ±12 energía, o modificadores del día) ----------
  { id: "doble_turno", rareza: "infrecuente", tema: "entrenamiento", icon: "🏋️", title: "Doble turno de trabajo", tipo: "buff",
    desc: "El cuerpo técnico programa doble sesión: hoy Entrenar rinde el doble.",
    mod: { mods: { entrenar: 2 }, desc: "Entrenar rinde ×2 hoy" }, effect: () => {} },
  { id: "cancha_anegada", rareza: "infrecuente", tema: "entorno", icon: "🌊", title: "Cancha anegada", tipo: "debuff",
    desc: "El temporal inundó el complejo: hoy no se puede Entrenar.",
    mod: { mods: { entrenar: 0 }, desc: "Entrenar no disponible hoy" }, effect: () => {} },
  { id: "spa", rareza: "infrecuente", tema: "fisico", icon: "💆", title: "Día de spa", tipo: "buff",
    desc: "El hotel abre su spa para el plantel: hoy Recuperar rinde el doble.",
    mod: { mods: { recuperar: 2 }, desc: "Recuperar rinde ×2 hoy" }, effect: () => {} },
  { id: "pizarra", rareza: "infrecuente", tema: "vestuario", icon: "🧠", title: "El DT ve algo en el video", tipo: "buff",
    desc: "Un patrón del rival quedó al descubierto: hoy la Sesión táctica rinde el doble.",
    mod: { mods: { tactica: 2 }, desc: "Sesión táctica rinde ×2 hoy" }, effect: () => {} },
  { id: "alineacion_filtrada", rareza: "infrecuente", tema: "entorno", icon: "🕵️", title: "Se filtró la alineación", tipo: "debuff",
    desc: "La prensa publicó el plan de partido: hoy la Sesión táctica no sirve de nada.",
    mod: { mods: { tactica: 0 }, desc: "Sesión táctica no disponible hoy" }, effect: () => {} },
  { id: "toque_seda",  rareza: "infrecuente", tema: "entrenamiento", icon: "🎩", title: "Toque de seda",            tipo: "buff",   desc: "+8 de Pase para el próximo partido.",                 effect: r => buff(r, "pase", 8) },
  { id: "banderazo",   rareza: "infrecuente", tema: "entorno",       icon: "🥁", title: "Banderazo de la hinchada", tipo: "buff",   desc: "+8 de Aura para el próximo partido.",                 effect: r => buff(r, "aura", 8) },
  { id: "viaje_pesado",rareza: "infrecuente", tema: "fisico",        icon: "✈️", title: "Viaje pesado",             tipo: "debuff", desc: "−12 de energía para todo el plantel.",                effect: r => energia(r, -12) },

  // ---------- RARAS (±10-12, combos o golpes al plantel) ----------
  { id: "masajista",     rareza: "rara", tema: "fisico",        icon: "🙌", title: "Fisios de élite",            tipo: "buff",   desc: "+25 de energía para todo el plantel.",                          effect: r => energia(r, 25) },
  { id: "sparring",      rareza: "rara", tema: "entrenamiento", icon: "🤺", title: "Sparring de lujo",           tipo: "buff",   desc: "+8 de Tiro y Defensa para el próximo partido.",                 effect: r => { buff(r, "tiro", 8); buff(r, "defensa", 8); } },
  { id: "leyenda",       rareza: "rara", tema: "vestuario",     icon: "👑", title: "Visita de una leyenda",      tipo: "buff",   desc: "+12 de Aura para el próximo partido.",                          effect: r => buff(r, "aura", 12) },
  { id: "video_premium", rareza: "rara", tema: "vestuario",     icon: "🎥", title: "Sesión de video reveladora", tipo: "buff",   desc: "El equipo llega mucho mejor plantado al próximo partido.",      effect: r => { r.buffs.tactica = +((r.buffs.tactica || 0) + 0.2).toFixed(2); } },
  { id: "crisis_prensa", rareza: "rara", tema: "entorno",       icon: "🎙️", title: "Crisis con la prensa",       tipo: "debuff", desc: "−10 de Aura y −6 de Pase para el próximo partido.",             effect: r => { buff(r, "aura", -10); buff(r, "pase", -6); } },
  { id: "ola_calor",     rareza: "rara", tema: "fisico",        icon: "🥵", title: "Ola de calor", tipo: "debuff",
    desc: "−15 de energía para todo el plantel, y hoy Recuperar rinde la mitad.",
    mod: { mods: { recuperar: 0.5 }, desc: "Recuperar rinde la mitad hoy" }, effect: r => energia(r, -15) },
  { id: "golpe_practica", rareza: "rara", tema: "entrenamiento", icon: "🚑", title: "Golpe en la práctica", tipo: "debuff",
    desc: "Un jugador queda descartado para el próximo partido.",
    effect: r => {
      const sanos = r.squad.filter(p => p.pos !== "POR" && p.lesionadoPartidos === 0 && !p.suspendido);
      if (!sanos.length) { energia(r, -10); return "El susto quedó en nada, pero el plantel gastó energías de más (−10)."; }
      const p = pick(sanos);
      p.lesionadoPartidos = 1;
      return `${p.name} cayó mal en la práctica: se pierde el próximo partido.`;
    } },

  // ---------- LEGENDARIAS (~1 por run: campaña-defining) ----------
  { id: "dia_perfecto", rareza: "legendaria", tema: "vestuario", icon: "🌟", title: "Día perfecto", tipo: "buff",
    desc: "Todo fluye: +5 a TODAS las stats para el próximo partido.",
    effect: r => ["tiro", "defensa", "atajadas", "pase", "cabezazo", "aura"].forEach(k => buff(r, k, 5)) },
  { id: "clase_magistral", rareza: "legendaria", tema: "entrenamiento", icon: "🎓", title: "Clase magistral", tipo: "buff",
    desc: "Tu mejor delantero da un salto de calidad permanente.",
    effect: r => {
      const dels = r.squad.filter(p => p.pos === "DEL");
      const star = dels.length ? dels.reduce((a, b) => (b.stats.tiro > a.stats.tiro ? b : a)) : null;
      if (!star) { buff(r, "tiro", 10); return "+10 de Tiro para el próximo partido."; }
      star.stats.tiro = clamp(star.stats.tiro + 3, 1, 99);
      return `${star.name} incorporó un recurso nuevo: +3 de Tiro PERMANENTE (ahora ${star.stats.tiro}).`;
    } },
  { id: "inspiracion", rareza: "legendaria", tema: "entrenamiento", icon: "✨", title: "El día que todo sale", tipo: "buff",
    desc: "Uno de esos días irrepetibles: hoy TODAS las acciones rinden el doble.",
    mod: { mods: { entrenar: 2, recuperar: 2, tactica: 2 }, desc: "Todas las acciones rinden ×2 hoy" }, effect: () => {} },
  { id: "gripe", rareza: "legendaria", tema: "fisico", icon: "🤒", title: "Brote de gripe", tipo: "debuff",
    desc: "Media concentración en cama: −25 de energía para todo el plantel.",
    effect: r => energia(r, -25) },
  { id: "motin", rareza: "legendaria", tema: "vestuario", icon: "💥", title: "Motín por los premios", tipo: "debuff",
    desc: "El plantel se planta por los premios: −12 de Aura y −10 de energía.",
    effect: r => { buff(r, "aura", -12); energia(r, -10); } },
];
