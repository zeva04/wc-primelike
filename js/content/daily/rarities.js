/* Los 4 niveles de rareza de los eventos. A mayor rareza, menor probabilidad y
   mayor impacto (la magnitud vive en cada evento de prep-events.js).

   DIAL: `weight`, el peso del sorteo diario. Calibrado para que con ~19 eventos
   por run una legendaria aparezca ~1 vez: que se sienta un momento, no rutina.

   El COLOR de cada rareza no vive acá: es maquetación, y content/ tiene
   prohibido el DOM (ARQUITECTURA §4.2). Está en `RAREZA_HEX` de ui/theme.js,
   con la explicación de por qué se mudó el 13-ago-2026. */

export const RARITIES = {
  comun:      { label: "Común",      weight: 55 },
  infrecuente:{ label: "Infrecuente",weight: 27 },
  rara:       { label: "Rara",       weight: 13 },
  legendaria: { label: "Legendaria", weight: 5  },
};
