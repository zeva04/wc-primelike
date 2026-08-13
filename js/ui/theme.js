/* ============================================================
   ui/theme — identidad visual: colores del equipo elegido y
   arte SVG propio (trofeo y balón; sin assets FIFA, que tienen
   derechos).
   ============================================================ */
import { RARITIES } from "../content/daily/rarities.js";

/** Vuelca los colores del equipo elegido a variables CSS globales (--team-*) que usan las clases tp-*. */
export function applyTeamColors(team) {
  const c = (team && team.colors) || { primary: "#D4AF37", secondary: "#8B6914", text: "#0f172a" };
  const r = document.documentElement.style;
  r.setProperty("--team-primary", c.primary);
  r.setProperty("--team-secondary", c.secondary);
  r.setProperty("--team-text", c.text);
}

/* ── LAS RAREZAS, en un color y no en una clase ──────────────────────────────
   Hasta el 13-ago-2026 cada rareza guardaba su color COMO CLASE DE TAILWIND
   (`color: "text-amber-400"`, `border: "border-amber-500/70"`) dentro de
   content/daily/rarities.js. Dos cosas estaban mal con eso:

     · content/ tiene prohibido el DOM (ARQUITECTURA §4.2) y una clase de un
       framework de CSS es DOM. El PO edita ahí pesos y textos, no maquetación.
     · el kit pixel no puede usar esas clases —pinta con `style` para mezclar con
       los tokens px-*— así que el hub se había hecho su PROPIA tabla de hex, en
       paralelo. Dos listas del mismo dato, y nada que las obligue a coincidir.

   Ahora la rareza tiene UN color y cada kit lo expresa como sabe. El borde sale
   del mismo hex con alfa en vez de un tono aparte: los bordes de antes iban de
   `/60` a `/70` y de `slate-600` a `amber-500`, diferencias que nadie ve y que
   solo existían porque eran clases sueltas escritas a mano. */
export const RAREZA_HEX = {
  comun: "#94a3b8", infrecuente: "#34d399", rara: "#a78bfa", legendaria: "#fbbf24",
};

/**
 * La chapita de rareza de las pantallas del kit viejo (el modal del evento del
 * día y el de la Oportunidad), que la dibujaban con el mismo markup copiado.
 * @param {string} rareza  clave de RARITIES
 * @param {string} prefijo texto antes de la etiqueta ("Oportunidad · ")
 */
export function chapaRareza(rareza, prefijo = "") {
  const hex = RAREZA_HEX[rareza], label = RARITIES[rareza]?.label;
  if (!label) return "";
  return `<div class="inline-block px-2.5 py-0.5 rounded-full border text-[10px] font-black uppercase tracking-widest mb-2"
    style="color:${hex};border-color:${hex}99">${prefijo}${label}</div>`;
}

// Trofeo estilizado (inspirado en la Copa del Mundo, dibujo propio)
export const TROPHY_SVG = `<svg viewBox="0 0 100 140" xmlns="http://www.w3.org/2000/svg" class="w-full h-full drop-shadow-[0_0_28px_rgba(212,175,55,0.4)]">
  <defs><linearGradient id="wcGold" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0" stop-color="#F5DD8A"/><stop offset="0.45" stop-color="#D4AF37"/><stop offset="1" stop-color="#8B6914"/>
  </linearGradient></defs>
  <circle cx="50" cy="26" r="19" fill="url(#wcGold)"/>
  <path d="M33 20 Q50 30 67 20 M33 32 Q50 40 67 32" fill="none" stroke="#8B6914" stroke-width="1.2" opacity="0.5"/>
  <path d="M39 10 Q46 26 42 44 M61 10 Q54 26 58 44" fill="none" stroke="#8B6914" stroke-width="1.2" opacity="0.5"/>
  <path d="M34 42 C20 55 24 74 40 83 L44 100 L56 100 L60 83 C76 74 80 55 66 42 C61 47 39 47 34 42 Z" fill="url(#wcGold)"/>
  <rect x="41" y="100" width="18" height="8" rx="2" fill="url(#wcGold)"/>
  <path d="M33 110 h34 a4 4 0 0 1 4 4 l3 12 h-48 l3 -12 a4 4 0 0 1 4 -4 Z" fill="url(#wcGold)"/>
  <rect x="30" y="126" width="40" height="4" rx="2" fill="#6e5410"/>
</svg>`;

// Balón estilo Trionda: olas roja/verde/azul que convergen en un triángulo dorado
export const BALL_SVG = `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" class="w-full h-full drop-shadow-[0_8px_20px_rgba(0,0,0,0.5)]">
  <circle cx="50" cy="50" r="47" fill="#f6f4ee"/>
  <path d="M50 50 C40 34 42 16 54 5 A47 47 0 0 1 90 61 C72 63 58 60 50 50 Z" fill="#0057B8"/>
  <path d="M50 50 C40 34 42 16 54 5 A47 47 0 0 1 90 61 C72 63 58 60 50 50 Z" fill="#007A33" transform="rotate(120 50 50)"/>
  <path d="M50 50 C40 34 42 16 54 5 A47 47 0 0 1 90 61 C72 63 58 60 50 50 Z" fill="#EA002A" transform="rotate(240 50 50)"/>
  <path d="M50 39 L60 55 L40 55 Z" fill="none" stroke="#D4AF37" stroke-width="2.5" stroke-linejoin="round"/>
  <circle cx="50" cy="50" r="47" fill="none" stroke="#cfccc2" stroke-width="1.5"/>
</svg>`;
