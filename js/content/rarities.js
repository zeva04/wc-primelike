/* ============================================================
   content/rarities — los 4 niveles de rareza de los eventos.
   `weight` es el peso del sorteo diario (calendar.js): a mayor
   rareza, menor probabilidad y MAYOR impacto del evento (la
   magnitud vive en cada evento de prep-events.js).

   Pesos elegidos para que con ~19 eventos por run completa una
   legendaria aparezca ~1 vez por run: que se sienta un momento,
   no una rutina.
   ============================================================ */

export const RARITIES = {
  comun:      { label: "Común",      weight: 55, color: "text-slate-400",   border: "border-slate-600" },
  infrecuente:{ label: "Infrecuente",weight: 27, color: "text-emerald-400", border: "border-emerald-500/60" },
  rara:       { label: "Rara",       weight: 13, color: "text-violet-400",  border: "border-violet-500/60" },
  legendaria: { label: "Legendaria", weight: 5,  color: "text-amber-400",   border: "border-amber-500/70" },
};
