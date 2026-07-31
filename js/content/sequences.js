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
import { pick } from "../core/rng.js";

export const SEQUENCE_TYPES = [
  {
    id: "circulacion", side: "mine", icon: "🎼", name: "Circulación posicional",
    zone: { from: [2, 4] },                 // se construye desde la salida hasta tres cuartos
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
    zone: { from: [2, 4] },                 // el robo que la lanza puede pasar en cualquier tramo propio
    // Ofensiva vertical: robo y ataque directo, corto y letal. Un solo pase de conducción
    // y remate; el remate llega mejor perfilado que en la circulación (bonus mayor) pero
    // hay menos actos para construir. Mapea a Contragolpe (A2+).
    protWeight: { DEL: 3, MED: 2, DEF: 1 },
    plan: ["carry", "finish"],
    flavor: {
      // Varias voces (F3, herencia de F2: con Contra consolidado vs press la transición
      // llega al 58% del pool — un solo intro se leía repetido tres veces por partido).
      intro: p => pick([
        `¡Recuperación y salida rápida! ${p.name} conduce al espacio.`,
        `¡Se rompe el partido! ${p.name} recibe con campo por delante.`,
        `Robo en el medio y a correr: ${p.name} encara con ventaja.`,
      ]),
      carryOk: p => `${p.name} gana metros antes de que el rival se acomode.`,
      carryFail: "La defensa rival cierra el espacio a tiempo.",
      finishStat: "tiro", finishBonus: 0.18,
    },
  },
  {
    // LA JUGADA NUEVA DE LA ODISEA (2ª mitad, decisión PO 29-jul-2026): el fútbol por
    // afuera, que el motor no tenía. Tres actos con decisión propia — correr la banda,
    // llegar (o no) a la línea de fondo, y el centro — y por fin una jugada cuya primera
    // pregunta es "¿tenés piernas?" en vez de "¿tenés pase?". Enseña Contragolpe: desbordar
    // es atacar el espacio, que es exactamente lo que mide su arista Verticalidad.
    id: "banda", side: "mine", icon: "🏃", name: "Desborde por la banda",
    zone: { from: [3, 4], lane: "wide" },   // el fútbol por afuera nace ABIERTO, nunca por el medio
    protWeight: { DEL: 3, MED: 2, DEF: 1 }, protStat: "velocidad",   // la corre el rápido
    plan: ["wing", "cross", "finish"],
    flavor: {
      intro: p => pick([
        `${p.name} recibe abierto sobre la banda y encara al lateral.`,
        `El equipo abre la cancha: ${p.name} tiene el pasillo de afuera para él.`,
        `¡Se va al mano a mano por la banda! ${p.name} arranca la carrera.`,
      ]),
      wingOk: p => `${p.name} se lo lleva por afuera y llega al fondo.`,
      wingFail: "El lateral aguanta la carrera y lo saca de la jugada.",
      crossOk: "El centro cruza el área buscando cabeza.",
      crossFail: "El centro se pasa de largo y muere en el otro costado.",
      finishStat: "cabezazo", finishBonus: 0.15,
    },
  },
  {
    id: "recuperacion", side: "mine", icon: "🦁", name: "Recuperación alta",
    zone: { from: [4, 5] },                 // presionar la salida rival EXIGE estar arriba
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
    zone: { from: [1, 3] },                 // se lanza desde atrás: es la salida del bloque bajo
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
    zone: { from: [4, 5], lane: "center" }, // córner o tiro libre cerca del área rival
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
    zone: { from: [1, 1], lane: "center" }, // el córner en contra se defiende DENTRO de mi área
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
    zone: { from: [1, 2] },                 // me asfixian donde nace mi salida
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
    zone: { from: [1, 3] },                 // su ataque me llega a mi campo
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
  /* ---------- Las 2 jugadas del TERRITORIO (T4, decisión PO 30-jul-2026) ----------
     No son tipos más: son los dos fútbols que ANTES NO PODÍAN EXISTIR porque el motor
     no sabía dónde estaba la pelota. Uno solo aparece con el balón en el área propia
     (¿la sacamos jugando o la reventamos?) y el otro solo tiene sentido contra un
     bloque rival adelantado (el espacio a su espalda). La geografía los gatea sola:
     `zone.from` decide desde dónde nacen y el generador pondera por distancia. */
  {
    id: "salida_corta", side: "mine", icon: "🧤", name: "Salida desde el área",
    zone: { from: [1, 2] },
    // La saca el que sabe jugarla: el DEF de mejor pase (o el volante que baja a recibir).
    protWeight: { DEF: 3, MED: 2, DEL: 0 }, protStat: "pase_corto",
    plan: ["buildout", "build", "finish"],
    flavor: {
      intro: p => pick([
        `El arquero se la deja a ${p.name} en el borde del área. Hay que sacarla de acá.`,
        `${p.name} baja a recibir al área propia: el equipo tiene que empezar la jugada desde el fondo.`,
      ]),
      buildOk: "El equipo sale del embudo y la pelota respira.",
      buildFail: "Se corta la salida: la pierden en tres cuartos propios.",
      outShort: p => `¡${p.name} rompe la primera línea con un pase al pie! El equipo sale jugando de verdad.`,
      outFail: p => `¡${p.name} la pierde en la puerta del área! Se le viene el mundo encima…`,
      outLong: "Pelotazo a buscar al punta: la salida se juega por arriba.",
      outSafe: "La sacan al lateral sin arriesgar: pelota afuera y a respirar.",
      finishStat: "tiro", finishBonus: 0.12,
    },
  },
  {
    id: "espalda", side: "mine", icon: "🏹", name: "Pelota a la espalda",
    zone: { from: [3, 4] },
    // La ataca el que CORRE: es la jugada del punta veloz contra la línea adelantada.
    protWeight: { DEL: 3, MED: 2, DEF: 0 }, protStat: "velocidad",
    plan: ["throughball", "finish"],
    flavor: {
      intro: p => pick([
        `La zaga rival está partida en la mitad de cancha y ${p.name} mira ese espacio.`,
        `${p.name} amaga con venir y pica al hueco: los centrales rivales están adelantadísimos.`,
        `Toda la espalda del bloque rival está descubierta. ${p.name} arranca.`,
      ]),
      throughOk: p => `¡Pelota a la espalda y ${p.name} GANA la carrera! Se le abre el arco.`,
      throughFail: "La pelota a la espalda se pasa de largo: la levanta el arquero rival.",
      lineOk: p => `Rompen líneas al pie: ${p.name} recibe de espaldas entre los centrales.`,
      lineFail: "El pase entre líneas lo lee la zaga y corta.",
      finishStat: "tiro", finishBonus: 0.10,
    },
  },
  /* ---------- Las 4 SECUENCIAS AVANZADAS (arco del Meta M2, diseños PO 22-jul) ----------
     El fútbol superior de cada filosofía: entran al pool desde EN DESARROLLO (nivel 1)
     y Consolidada las PROFUNDIZA (el rasgo de F2 se FUSIONÓ acá — decisión PO M2: la
     avanzada ES el rasgo cumplido jugando). `advFor` es la filosofía dueña: la máquina
     las gatea por `filo.nivel` (applyFiloWeights) y cuentan como ejecución de la firma
     (noteFiloHit). Los números finos del castigo/desenlace viven en `adv` — datos, no
     lógica: la máquina los lee. */
  {
    id: "caceria", side: "mine", icon: "🦁", name: "Cacería total", advFor: "press",
    zone: { from: [4, 5] },                 // la cacería vive en el campo rival
    // Presión ENCADENADA (3 actos): cazar la salida, cerrar la trampa sobre el reseteo y
    // definir en zona letal. Si el rival la rompe, un % de las veces la rompe CON FALTA:
    // amarilla (acumula: la 2ª expulsa) + tiro libre encadenado — la jugada sigue.
    protWeight: { DEL: 2, MED: 3, DEF: 1 },
    plan: ["press", "press", "finish"],
    // freekickBonus: la falta corta la cacería en la SALIDA rival — tiro libre lejano
    // (modesto), a diferencia del contragolpe cortado al borde del área.
    adv: { foulBreak: 0.35, foulBreakDeep: 0.5, trapBonus: 0.07, deepBonus: 0.05, freekickBonus: 0.04 },
    vitrina: "Presión encadenada en 3 actos: cazar la salida, cerrar la trampa sobre el reseteo y definir en zona letal. Al rival que la rompe con falta: amarilla — y el tiro libre es tuyo.",
    flavor: {
      intro: p => pick([
        `¡CACERÍA TOTAL! El equipo entero salta sobre la salida rival; ${p.name} guía la jauría.`,
        `La presión que entrenamos hasta el hartazgo: ${p.name} ordena la cacería sobre el fondo rival.`,
      ]),
      pressOk: "¡Primer robo! El rival intenta resetear... y la jauría no lo suelta.",
      press2Ok: "¡¡La trampa se cierra!! Segunda cacería y la pelota es nuestra en ZONA LETAL.",
      pressFail: "El rival rompe la cacería con un pase entre líneas.",
      foulText: p => `¡${p.name} no encuentra salida y DERRIBA para cortar la cacería! Amarilla y tiro libre.`,
      finishStat: "tiro", finishBonus: 0.10,
    },
  },
  {
    id: "sinfonia", side: "mine", icon: "🎼", name: "La sinfonía", advFor: "posesion",
    zone: { from: [2, 4] },
    // Circulación LARGA (3 compases; 4 en Consolidada — el rasgo viejo vive acá): cada
    // build acertado suma desesperación. Con la desesperación llena, un % de las veces el
    // rival ya no llega y te baja DENTRO del área: penal. Si no, remate limpio de alta calidad.
    protWeight: { DEL: 2, MED: 3, DEF: 1 },
    plan: ["build", "build", "build", "finish"],
    adv: { penaltyChance: 0.22, penaltyChanceDeep: 0.30 },
    vitrina: "Circulación larga que desespera (3 compases): definición limpia de alta calidad… o el rival, mareado de correr, te baja dentro del área — PENAL.",
    flavor: {
      intro: p => pick([
        `Arranca LA SINFONÍA: ${p.name} marca el tempo y el equipo entero se hace dueño de la pelota.`,
        `${p.name} pide la batuta: circulación larga para desesperar al rival.`,
      ]),
      buildOk: "El rival corre detrás de la pelota. La sinfonía sigue.",
      buildFail: "Se corta la sinfonía: la pelota se pierde en un pase.",
      penaltyText: p => `¡El rival, mareado de correr, DERRIBA a ${p.name} dentro del área! ¡PENAL!`,
      finishStat: "tiro", finishBonus: 0.16,
    },
  },
  {
    id: "contra_letal", side: "mine", icon: "⚡", name: "Contragolpe letal", advFor: "contra",
    zone: { from: [2, 4] },
    // Doble conducción con el rival partido. La falta tiene GEOGRAFÍA: en el primer tramo
    // (lejos) es la falta desesperada — amarilla + tiro libre encadenado; en el segundo
    // (zona letal) es PENAL, como la conducción de siempre.
    protWeight: { DEL: 3, MED: 2, DEF: 1 },
    plan: ["carry", "carry", "finish"],
    // carryBonus por tramo: con el rival partido, cada conducción ganada vale MÁS que la
    // de la transición simple (+0.05) — el doble riesgo de conducir dos veces debe pagar.
    // freekickBonus: la falta desesperada del 1º tramo te corta lejos — tiro libre
    // peligroso pero no letal. En el 2º TRAMO la desesperación escala (decisión PO M2):
    // despFoul = % de los fallos del conducir que son FALTA del rival desesperado;
    // despRed = de esas, cuántas son ROJA por último hombre (+ tiro libre al borde,
    // despFreekickBonus); el resto es amarilla + PENAL. Devuelve el EV del penal que la
    // geografía le quitó al 1º tramo — donde el fútbol lo pone.
    // carryEase: el 2º tramo se conduce con la cancha ROTA — más fácil que driblear una
    // defensa plantada (sin esto, la compuerta extra del 3er acto drenaba el EV: medido).
    // passBonus: con el rival partido el PASE AL PIE también gana metros (la base solo
    // premia conducir: +0.02 al pase — acá el pase corre con la cancha rota).
    // despFoul/despRed subieron 0.22→0.28 / 0.30→0.40 en la calibración final (PO):
    // el rival desesperado comete más faltas, y más veces es el último hombre.
    adv: { carryBonus: [0.10, 0.14], passBonus: [0.06, 0.08], carryEase: 0.15, deepBonus: 0.05, freekickBonus: 0.08, despFoul: 0.28, despRed: 0.40, despFreekickBonus: 0.12 },
    vitrina: "Doble conducción con el rival partido. Si te bajan lejos: amarilla y tiro libre. Si te bajan en zona letal: penal — o ROJA al último hombre que cortó la escapada.",
    flavor: {
      intro: p => pick([
        `¡CONTRAGOLPE LETAL! El rival quedó partido y ${p.name} arranca con toda la pradera.`,
        `Robo y a correr: ${p.name} lanza el contragolpe que ensayamos mil veces.`,
      ]),
      carryOk: p => `${p.name} devora metros: el rival retrocede sin poder acomodarse.`,
      carryFail: "La defensa rival llega a cerrar el hueco a tiempo.",
      foulText: p => `¡${p.name} corta el contragolpe con falta lejos del área! Amarilla y tiro libre.`,
      penalFoulText: p => `¡${p.name}, desesperado, DERRIBA al contragolpe dentro del área! Amarilla... ¡y PENAL!`,
      redText: p => `¡${p.name} era el ÚLTIMO HOMBRE y bajó al que se escapaba! ROJA DIRECTA — y tiro libre al borde del área.`,
      // 0.21 > 0.18 de la transición simple: tras DOS conducciones el rival no existe —
      // la definición del letal llega regalada (calibrado en M2 contra su baseline).
      finishStat: "tiro", finishBonus: 0.21,
    },
  },
  {
    id: "fortaleza", side: "opp", icon: "🧱", name: "La fortaleza castiga", advFor: "bloque",
    zone: { from: [1, 3] },
    // La única avanzada DEFENSIVA: arranca como repliegue, pero la contención exitosa
    // CONVIERTE (def→of, el patrón de la salida bajo presión): pelotazo inmediato con el
    // rival desarmado. Si el duelo aéreo se pierde, % de córner ganado encadenado — la
    // fortaleza casi siempre saca algo. El rasgo viejo (+contención) vive acá (Consolidada).
    protWeight: { DEF: 3, MED: 1, DEL: 0 },
    plan: ["contain", "clear"],
    adv: { convert: 0.55, convertDeep: 0.75, counterBonus: 0.06, cornerOnDuelFail: 0.35, deepContain: 0.05 },
    vitrina: "La contención CONVIERTE: pelotazo inmediato con el rival desarmado. Y si el duelo aéreo se pierde, la jugada puede morir en córner ganado — la fortaleza casi siempre saca algo.",
    flavor: {
      intro: opp => `${opp.name} ataca... pero esta muralla tiene dientes. El bloque espera su momento.`,
      containOk: "¡La zaga corta la jugada antes del remate!",
      containFail: opp => `${opp.name} progresa y encara el área.`,
      convertText: opp => `🧱 ¡La muralla corta... y CASTIGA! Pelotazo inmediato con ${opp.name} desarmado.`,
      cornerText: "la zaga rival, de espaldas a su arco, la manda al CÓRNER. ¡La fortaleza sigue castigando!",
    },
  },
];

/** Un tipo por id (o undefined). */
export function sequenceType(id) { return SEQUENCE_TYPES.find(t => t.id === id); }

/** La secuencia avanzada de cada filosofía ({press: fila, ...}) — derivado de los datos. */
export const ADVANCED_BY_FILO = Object.fromEntries(SEQUENCE_TYPES.filter(t => t.advFor).map(t => [t.advFor, t]));
