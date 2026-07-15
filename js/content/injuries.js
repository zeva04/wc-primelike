/* ============================================================
   content/injuries — tabla de lesiones (FEAT-002).
   Cada una tiene severidad, `partidos` de baja (recuperación) y
   `peso` (probabilidad relativa de ocurrir). `partidos: 0` =
   lesión menor: obliga a salir del partido actual pero el
   jugador está disponible para el siguiente.

   Agregar una lesión nueva = agregar una fila. Nada más.
   ============================================================ */

export const INJURY_TYPES = [
  { name: "Calambre",                     severidad: "Leve",     partidos: 0, peso: 22 },
  { name: "Contusión",                    severidad: "Leve",     partidos: 0, peso: 19 },
  { name: "Torcedura leve de tobillo",    severidad: "Leve",     partidos: 0, peso: 16 },
  { name: "Corte que requiere puntos",    severidad: "Leve",     partidos: 0, peso: 13 },
  { name: "Mareo tras un golpe",          severidad: "Leve",     partidos: 0, peso: 11 },
  { name: "Sobrecarga muscular",          severidad: "Moderada", partidos: 1, peso: 10 },
  { name: "Esguince de tobillo",          severidad: "Moderada", partidos: 1, peso: 9  },
  { name: "Distensión de isquiotibiales", severidad: "Moderada", partidos: 1, peso: 8  },
  { name: "Esguince de rodilla",          severidad: "Moderada", partidos: 2, peso: 7  },
  { name: "Desgarro muscular",            severidad: "Moderada", partidos: 2, peso: 6  },
  { name: "Fisura de costilla",           severidad: "Moderada", partidos: 2, peso: 5  },
  { name: "Luxación de hombro",           severidad: "Grave",    partidos: 3, peso: 4  },
  { name: "Fractura de peroné",           severidad: "Grave",    partidos: 4, peso: 3  },
  { name: "Rotura de ligamento cruzado",  severidad: "Grave",    partidos: 5, peso: 2  },
  { name: "Rotura del tendón de Aquiles", severidad: "Grave",    partidos: 5, peso: 1  },
];
