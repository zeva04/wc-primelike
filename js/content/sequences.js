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
   (remate / atajada); los previos construyen. El fallo de un acto
   cierra la secuencia... o ENCADENA (Sprint A2, regla 7 del Bible):
   un remate atajado puede dar rebote y una pérdida arriesgada puede
   abrir un contragolpe rival — eso lo maneja la máquina, acá solo
   se declara la forma. Cada `kind` lo entiende la máquina:
     mine → build (construir) · carry (conducir) · press (presionar
            la salida rival) · duel (duelo aéreo) · setpiece (balón
            parado a favor) · finish (rematar)
     opp  → contain (contener) · clear (despejar el remate) ·
            defend_sp (córner en contra) · playout (el rival me
            presiona la salida: sobrevivirla CONVIERTE la secuencia
            en una transición mía — def→of, decisión PO A2)

   `protWeight`: ponderación del protagonista por puesto JUGADO
   (mismo criterio que _weightedPick de las ocasiones sueltas).

   El catálogo A2 completa los 6 tipos del roadmap: los 4 que mapean
   a filosofías (recuperación→High Press · circulación→Posesión ·
   transición→Contragolpe · pelotazo→Bloque bajo) + balón parado
   (DOS caras: a favor y en contra) + salida desde el fondo, y el
   repliegue de A1 sigue como defensiva base. La FRECUENCIA de cada
   tipo la decide la máquina según la mentalidad y el perfil del
   rival (sequences.seqPlan) — acá no hay pesos, solo identidad.

   Agregar un tipo nuevo = agregar una fila.
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
    id: "recuperacion", side: "mine", icon: "🦁", name: "Recuperación alta",
    // Presión alta: cazar la salida rival y definir corto. Mapea a High Press (A3+/Filosofía).
    // La presión total roba más ARRIBA (mejor remate); cerrar líneas roba más seguido pero
    // en peor posición. La presión fallida es una pérdida ARRIESGADA: puede abrir contra rival.
    protWeight: { DEL: 2, MED: 3, DEF: 1 },
    plan: ["press", "finish"],
    flavor: {
      intro: p => `¡El equipo salta a presionar la salida rival! ${p.name} lidera la cacería.`,
      pressOk: "¡Robo en campo rival! La defensa quedó vendida.",
      pressFail: "El rival rompe la presión con un pase y se sacude el acoso.",
      finishStat: "tiro", finishBonus: 0.10,
    },
  },
  {
    id: "pelotazo", side: "mine", icon: "🌩️", name: "Pelotazo largo",
    // Fútbol directo: pelotazo y duelo aéreo (POR FIN juega el Cabezazo). Mapea a Bloque
    // bajo (el equipo replegado vive de esto). Ganar el duelo de cabeza habilita el remate.
    protWeight: { DEL: 3, MED: 1, DEF: 1 },
    plan: ["duel", "finish"],
    flavor: {
      intro: p => `Pelotazo largo buscando a ${p.name}. El duelo aéreo se viene.`,
      duelOk: p => `¡${p.name} gana el duelo por arriba!`,
      duelFail: "La zaga rival despeja el pelotazo sin despeinarse.",
      finishStat: "tiro", finishBonus: 0.10,
    },
  },
  {
    id: "balon_parado", side: "mine", icon: "🎯", name: "Balón parado a favor",
    // Córner/tiro libre: UNA decisión y desenlace (Bible: algunas secuencias son un solo
    // duelo decisivo). El centro busca al mejor cabeceador; la jugada preparada, un remate limpio.
    protWeight: { MED: 3, DEL: 2, DEF: 1 }, // el lanzador
    plan: ["setpiece"],
    flavor: {
      intro: p => `Balón parado a favor: ${p.name} se para detrás de la pelota.`,
    },
  },
  {
    id: "balon_parado_def", side: "opp", icon: "🚨", name: "Balón parado en contra",
    // El espejo defensivo: córner rival. Zona = seguro; salir a despejar corta más, pero si
    // se falla el cabeceador remata solo.
    protWeight: { DEF: 3, MED: 1, DEL: 0 },
    plan: ["defend_sp"],
    flavor: {
      intro: opp => `Córner para ${opp.name}. El área se llena de camisetas rivales.`,
    },
  },
  {
    id: "salida_fondo", side: "opp", icon: "🗼", name: "Salida bajo presión",
    // El rival me presiona la salida (SU iniciativa: cuenta como secuencia rival). Salir
    // jugando limpio CONVIERTE la jugada en transición mía (def→of, la secuencia más
    // novedosa del catálogo); perder la pelota ahí es regalarle un remate al rival.
    protWeight: { DEF: 3, MED: 1, DEL: 0 }, // el que saca la pelota jugada
    plan: ["playout"],
    flavor: {
      intro: opp => `${opp.name} adelanta líneas y asfixia la salida desde el fondo.`,
      playoutOk: p => `¡${p.name} rompe la presión con un pase quirúrgico! El rival quedó partido al medio...`,
      playoutFail: p => `¡${p.name} pierde la pelota saliendo desde el fondo! Regalo en zona letal.`,
      playoutSafe: "Pelotazo de despeje: se pierde la posesión, pero no pasa nada.",
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
