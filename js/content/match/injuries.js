/* Tabla de lesiones. Cada una tiene severidad, `partidos` de baja y `peso`
   (probabilidad relativa de ocurrir). `partidos: 0` = lesión menor: obliga a
   salir del partido actual pero el jugador llega al siguiente.

   Agregar una lesión = agregar una fila. */

export const INJURY_TYPES = [
  { name: "Calambre",                     severidad: "Leve",     partidos: 0, peso: 22 },
  { name: "Contusión",                    severidad: "Leve",     partidos: 0, peso: 19 },
  { name: "Torcedura leve de tobillo",    severidad: "Leve",     partidos: 0, peso: 16 },
  { name: "Torcedura leve de rodilla",     severidad: "Leve",    partidos: 0, peso: 15 },
  { name: "Corte que requiere puntos",    severidad: "Leve",     partidos: 0, peso: 13 },
  { name: "Mareo tras un golpe",          severidad: "Leve",     partidos: 0, peso: 11 },

  { name: "Sobrecarga de gemelo",         severidad: "Moderada", partidos: 1, peso: 10 },
  { name: "Sobrecarga de cuadriceps",     severidad: "Moderada", partidos: 1, peso: 10 },
  { name: "Sobrecarga del sóleo",         severidad: "Moderada", partidos: 1, peso: 10 },
  { name: "Sobrecarga de isquiotibiales", severidad: "Moderada", partidos: 1, peso: 10 },

  { name: "Fractura de nariz",            severidad: "Moderada", partidos: 2, peso: 9 },

  { name: "Esguince de hombro",           severidad: "Moderada", partidos: 2, peso: 8  },
  { name: "Esguince de muñeca",           severidad: "Moderada", partidos: 2, peso: 8  },
  { name: "Esguince de tobillo",          severidad: "Moderada", partidos: 2, peso: 7  },
  { name: "Esguince de rodilla",          severidad: "Moderada", partidos: 2, peso: 7  },

  { name: "Microdesgarro de cuadriceps",     severidad: "Moderada", partidos: 3, peso: 6  },
  { name: "Microdesgarro de isquiotibiales", severidad: "Moderada", partidos: 3, peso: 6  },
  { name: "Microdesgarro de gemelo",         severidad: "Moderada", partidos: 3, peso: 6  },
  { name: "Microdesgarro de sóleo",          severidad: "Moderada", partidos: 3, peso: 6  },

  { name: "Fisura de costilla",           severidad: "Moderada", partidos: 3, peso: 5  },
  { name: "Luxación de hombro",           severidad: "Grave",    partidos: 3, peso: 4  },

  { name: "Desgarro de cuadriceps",       severidad: "Grave",    partidos: 5, peso: 3  },
  { name: "Desgarro de isquiotibiales",   severidad: "Grave",    partidos: 5, peso: 3  },
  { name: "Desgarro de gemelo",           severidad: "Grave",    partidos: 5, peso: 3  },
  { name: "Desgarro de sóleo",            severidad: "Grave",    partidos: 5, peso: 3  },

  { name: "Pubalgia",                     severidad: "Grave",    partidos: 6, peso: 2  },
  { name: "Fractura de tibia y peroné",   severidad: "Grave",    partidos: 8, peso: 2  },
  { name: "Rotura de ligamento cruzado",  severidad: "Grave",    partidos: 8, peso: 1  },
  { name: "Rotura del tendón de Aquiles", severidad: "Grave",    partidos: 8, peso: 1  },
];
