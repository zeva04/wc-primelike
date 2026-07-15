/* ============================================================
   content/prep-events — los 10 eventos inevitables del calendario
   (Game Vision: "Eventos" = cambios del mundo que no se deciden).

   Cada día sin partido trae uno (o un conflicto, ver calendar.js).
   Los buffs de stat duran hasta el próximo partido y se ACUMULAN
   entre días: por eso son ±5 y no ±10 (con 4-5 días de eventos por
   ventana, ±10 apilaba hasta ±30 y rompía el balance).

   Agregar un evento nuevo = agregar una fila con su `tema`,
   `tipo` (buff|debuff) y `effect(run)`. Nada más.
   ============================================================ */
import { clamp } from "../core/math.js";

export const PREP_EVENTS = [
  { id: "definicion", tema: "entrenamiento", icon: "🎯", title: "Sesión de definición perfecta", tipo: "buff",   desc: "+5 de Tiro para el próximo partido.",               effect: r => { r.buffs.tiro = (r.buffs.tiro || 0) + 5; } },
  { id: "muro",       tema: "entrenamiento", icon: "🛡️", title: "Trabajo defensivo impecable",   tipo: "buff",   desc: "+5 de Defensa y Atajadas para el próximo partido.",  effect: r => { r.buffs.defensa = (r.buffs.defensa || 0) + 5; r.buffs.atajadas = (r.buffs.atajadas || 0) + 5; } },
  { id: "arenga",     tema: "vestuario",     icon: "🔥", title: "Arenga del capitán",            tipo: "buff",   desc: "+5 de Aura para el próximo partido.",                effect: r => { r.buffs.aura = (r.buffs.aura || 0) + 5; } },
  { id: "penales",    tema: "entrenamiento", icon: "🥅", title: "Tarde de penales",              tipo: "buff",   desc: "Bonus en penales del próximo partido.",              effect: r => { r.buffs.penales = (r.buffs.penales || 0) + 0.10; } },
  { id: "descanso",   tema: "fisico",        icon: "😴", title: "Jornada de recuperación",       tipo: "buff",   desc: "+20 de energía para todo el plantel.",               effect: r => r.squad.forEach(p => p.energia = clamp(p.energia + 20, 5, 100)) },
  { id: "lluvia",     tema: "fisico",        icon: "🌧️", title: "Entrenamiento pasado por agua", tipo: "debuff", desc: "−10 de energía para todo el plantel.",               effect: r => r.squad.forEach(p => p.energia = clamp(p.energia - 10, 5, 100)) },
  { id: "molestias",  tema: "fisico",        icon: "🤕", title: "Molestias en la zaga",          tipo: "debuff", desc: "−5 de Defensa para el próximo partido.",             effect: r => { r.buffs.defensa = (r.buffs.defensa || 0) - 5; } },
  { id: "nervios",    tema: "vestuario",     icon: "😰", title: "Nervios previos",               tipo: "debuff", desc: "−5 de Aura para el próximo partido.",                effect: r => { r.buffs.aura = (r.buffs.aura || 0) - 5; } },
  { id: "piernas",    tema: "entrenamiento", icon: "🦵", title: "Piernas cargadas",              tipo: "debuff", desc: "−5 de Tiro para el próximo partido.",                effect: r => { r.buffs.tiro = (r.buffs.tiro || 0) - 5; } },
  { id: "prensa",     tema: "entorno",       icon: "📸", title: "Maratón de prensa y sponsors",  tipo: "debuff", desc: "−5 de Pase para el próximo partido.",                effect: r => { r.buffs.pase = (r.buffs.pase || 0) - 5; } },
];
