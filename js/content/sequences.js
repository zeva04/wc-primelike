/* ============================================================
   content/sequences — el catálogo de tipos de Key Sequence
   (Bible §7). Cada tipo es DATOS: su identidad, quién tiende a
   protagonizarla y su FORMA (el plan de actos y el flavor). La
   máquina que los resuelve vive en game/match/sequences.js y la
   matemática de cada gesto en game/match/actions.js — acá no hay
   reglas, solo la caracterización (ARQUITECTURA §3: content =
   datos + flavor, cero lógica de sistema).

   `side`: "mine" (yo ataco) | "opp" (yo defiendo). El generador
   reparte el partido entre ofensivas y defensivas según la
   preparación (Bible: la mala preparación produce más defensivas).

   `plan`: la secuencia MÁXIMA de actos (Bible §7 "1 a 3 actos,
   variable" — decisión PO). El último acto es el desenlace
   (remate / atajada); los previos construyen. En A1 el fallo de
   un acto CIERRA la secuencia; el fallo que encadena (rebote,
   pelota suelta) es A2. Cada `kind` lo entiende la máquina:
     mine → build (construir) · carry (conducir) · finish (rematar)
     opp  → contain (contener) · clear (despejar el remate)

   `protWeight`: ponderación del protagonista por puesto JUGADO
   (mismo criterio que _weightedPick de las ocasiones sueltas).

   Agregar un tipo nuevo = agregar una fila. El catálogo completo
   de 6 (con balón parado y salida desde el fondo, y las variantes
   que mapean a las 4 filosofías) es el Sprint A2.
   ============================================================ */

export const SEQUENCE_TYPES = [
  {
    id: "circulacion", side: "mine", icon: "🎼", name: "Circulación posicional",
    // Ofensiva paciente: dos toques de construcción y definición. Pesa el Pase; una buena
    // construcción deja mejor perfil de remate (bonus alto). Mapea a Posesión (A2+).
    protWeight: { DEL: 2, MED: 3, DEF: 1 },
    plan: ["build", "build", "finish"],
    flavor: {
      intro: p => `${p.name} baja a recibir y el equipo empieza a mover la pelota con paciencia.`,
      buildOk: "El equipo circula y desarma la marca.",
      buildFail: "Pierden la pelota en la circulación.",
      finishStat: "tiro", finishBonus: 0.14,
    },
  },
  {
    id: "transicion", side: "mine", icon: "⚡", name: "Transición rápida",
    // Ofensiva vertical: robo y ataque directo, corto y letal. Un solo pase de conducción
    // y remate; el remate llega mejor perfilado que en la circulación (bonus mayor) pero
    // hay menos actos para construir. Mapea a Contragolpe (A2+).
    protWeight: { DEL: 3, MED: 2, DEF: 1 },
    plan: ["carry", "finish"],
    flavor: {
      intro: p => `¡Recuperación y salida rápida! ${p.name} conduce al espacio.`,
      carryOk: p => `${p.name} gana metros antes de que el rival se acomode.`,
      carryFail: "La defensa rival cierra el espacio a tiempo.",
      finishStat: "tiro", finishBonus: 0.18,
    },
  },
  {
    id: "repliegue", side: "opp", icon: "🧱", name: "Repliegue defensivo",
    // Defensiva: el rival ataca y yo contengo. Un acto de contención y el remate a atajar.
    // Mapea a Bloque bajo (A2+). El protagonista lo elige la máquina entre mis DEF en cancha.
    protWeight: { DEF: 3, MED: 1, DEL: 0 },
    plan: ["contain", "clear"],
    flavor: {
      intro: opp => `${opp.name} llega con peligro y el equipo se repliega para defender.`,
      containOk: "¡La zaga corta la jugada antes del remate!",
      containFail: opp => `${opp.name} progresa y encara el área.`,
    },
  },
];

/** Un tipo por id (o undefined). */
export function sequenceType(id) { return SEQUENCE_TYPES.find(t => t.id === id); }
