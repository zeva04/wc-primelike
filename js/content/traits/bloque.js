/* Rasgos de 🧱 BLOQUE BAJO — orden y muralla.
   Forma v2: 1 raíz + 3 ramas × 3 tiers + 2 Masters (uno de Firma, uno que
   converge Respuesta + Expansión). Convenciones de `efecto`, escala cerrada y
   excepción de los multiplicadores `vsFilo`: documentadas en ./press.js. */

export const TRAITS_BLOQUE = [
  /* ── RAÍZ ───────────────────────────────────────────────────────────────── */
  {
    id: "marca_zonal", filo: "bloque", rama: "raiz", tier: "root", icon: "🕸️",
    nombre: "Marca Zonal",
    desc: "Cada uno tiene su casillero y no lo abandona: hay siempre una pierna más de la que el rival contaba, y el pase entre líneas se topa con alguien.",
    momento: "El pase rival que no llega a destino tres veces seguidas.",
    efecto: [["20%", "de que el avance rival muera interceptado ANTES de llegar al remate"]],
    req: {}, pos: { x: 150, y: 372 },
    hooks: { oppLoseActs: { p: 0.20,
      texto: "Zona cubierta: el pase entre líneas se topa con una pierna y el ataque muere en la nada." } },
  },

  /* ── FIRMA · el área como fortaleza ──────────────────────────────────────── */
  {
    id: "compactacion", filo: "bloque", rama: "firma", tier: "basic", icon: "🏰",
    nombre: "Compactación",
    desc: "El bloque se cierra y le tapa el carril del medio: por el centro no se pasa, y al rival solo le queda dar la vuelta por afuera.",
    momento: "El rival dando vueltas por afuera sin encontrar la puerta.",
    efecto: [["−5%", "de acierto en el remate rival del REPLIEGUE: con el centro cerrado, remata desde afuera"]],
    req: { previo: "marca_zonal" }, pos: { x: 415, y: 165 },
    hooks: { oppShotMalus: { seq: "repliegue", bonus: -0.05,
      texto: "El centro está clausurado: el remate llegó incómodo, forzado desde afuera." } },
  },
  {
    id: "area_blindada", filo: "bloque", rama: "firma", tier: "intermediate", icon: "🔩",
    nombre: "Área Blindada",
    desc: "Dentro del área manda el equipo: cada centro se come, cada remate sale a destiempo y el rival termina buscando desde afuera.",
    momento: "El despeje número diez del central y la contra que nace de ahí.",
    efecto: [
      ["PROFUNDA", "la fortaleza contiene mejor y castiga más al rival que se estrella contra ella"],
      ["−10%", "de acierto en el remate rival DENTRO del área"],
    ],
    req: { previo: "compactacion" }, pos: { x: 650, y: 165 },
    hooks: {
      deepBloque: {},
      boxShield: { bonus: -0.10,
        texto: "El área blindada: le achicaron el ángulo y el remate salió sin destino." },
    },
  },
  {
    id: "muralla", filo: "bloque", rama: "firma", tier: "advanced", icon: "🧱",
    nombre: "Muralla",
    desc: "Mientras el marcador no vaya en contra, la zaga juega con una convicción distinta: nadie se saca la camiseta de encima y no pasa nadie.",
    momento: "Los últimos veinte minutos defendiendo el resultado sin conceder una sola llegada limpia.",
    efecto: [["−15%", "de acierto en TODO remate rival"]],
    gate: "Rasgo de ESTADO: solo con el marcador empatado o a favor. Yendo perdiendo no aporta nada.",
    req: { previo: "area_blindada" }, pos: { x: 885, y: 165 },
    hooks: { wall: { bonus: -0.15,
      texto: "La muralla no se mueve: mientras el resultado aguante, por acá no pasa nadie." } },
  },
  {
    id: "fortaleza_inexpugnable", filo: "bloque", rama: "firma", tier: "master", icon: "🏯",
    nombre: "Fortaleza Inexpugnable",
    desc: "El rival puede tener la pelota todo el partido: no va a tener una sola ocasión clara. Ataca, ataca, y termina discutiendo entre ellos.",
    momento: "El delantero rival discutiendo con sus compañeros tras la enésima llegada muerta.",
    // ⚠ El ×0.75 es 1 / celda del asedio de Posesión (1.35 × 0.75 ≈ 1.01): entra en la
    // escala cerrada por casualidad, pero se DERIVA de la matriz — si la celda cambia, cambia.
    efecto: [
      ["25%", "de que la OCASIÓN CLARA rival (mano a mano, contra tras tu pérdida) directamente no ocurra"],
      ["×0.75", "menos asedio del rival de 🎼 Posesión: neutraliza la celda que te castiga, no la invierte"],
      ["−10%", "de acierto rival como tope: cada remate que fallan les suma frustración"],
    ],
    req: { previo: "muralla" }, pos: { x: 1092, y: 165 },
    hooks: {
      clearChanceGuard: { p: 0.25,
        texto: "¡No hay ocasión clara contra esta fortaleza! Apareció el que tenía que aparecer y la jugada murió sin remate." },
      oppPoolMod: { vsFilo: "posesion", weights: { repliegue: 0.75 } },
      frustration: { perShot: 0.02, cap: 0.10,
        texto: "La frustración rival se palpa: cuanto más ataca sin premio, peor remata — la muralla come moral." },
    },
  },

  /* ── RESPUESTA · sobrevivir al asedio ────────────────────────────────────── */
  {
    id: "dominio_aereo", filo: "bloque", rama: "respuesta", tier: "basic", icon: "🦅",
    nombre: "Dominio Aéreo",
    desc: "Todo lo que entra por el aire lo gana el equipo: centros, córners y pelotas divididas terminan siempre en una cabeza propia.",
    momento: "El central ganando el décimo cabezazo del partido.",
    efecto: [["−5%", "de acierto en el cabezazo rival del córner en contra"]],
    req: { previo: "marca_zonal" }, pos: { x: 415, y: 372 },
    hooks: { aerialDef: { bonus: -0.05,
      texto: "Por arriba no se les gana: el cabezazo rival salió forzado, con la zaga encima." } },
  },
  {
    id: "atentos", filo: "bloque", rama: "respuesta", tier: "intermediate", icon: "👀",
    nombre: "Atentos",
    desc: "Tras cada atajada y cada bloqueo, la segunda pelota es del equipo: nadie mira la jugada, todos van al rechace.",
    momento: "El rechace del córner que ya es un pelotazo nuestro.",
    efecto: [
      ["30%", "de que el córner rival defendido encadene PELOTAZO mío (+5% de acierto)"],
      ["30%", "de que el rechace de un duelo aéreo perdido encadene PELOTAZO mío (+5% de acierto)"],
    ],
    req: { previo: "dominio_aereo" }, pos: { x: 650, y: 372 },
    hooks: {
      chainOnDefendSp: { to: "pelotazo", p: 0.30, bonus: 0.05,
        intro: p => `¡Atentos al rechace! La segunda pelota es nuestra y ${p.name} ya tiene el pelotazo armado.` },
      chainOnDuelFail: { to: "pelotazo", p: 0.30, bonus: 0.05,
        intro: p => `¡Atentos! El rechace del duelo cae al pie y ${p.name} vuelve a la carga.` },
    },
  },
  {
    id: "pelotazo_fuera", filo: "bloque", rama: "respuesta", tier: "advanced", icon: "🚀",
    nombre: "Pelotazo",
    desc: "Cuando el peligro aprieta, la zaga la manda lejos y obliga al rival a empezar todo de nuevo desde atrás.",
    momento: "El pelotazo a la tribuna que apaga el incendio y hace bramar al estadio.",
    efecto: [
      ["NUEVA", "desbloquea REVENTAR EL BALÓN defendiendo en campo propio: mata el ataque rival sin remate"],
      ["30%", "de córner concedido — y resignás la conversión de la fortaleza: es un canje, no un regalo"],
    ],
    req: { previo: "atentos" }, pos: { x: 885, y: 372 },
    hooks: { clearBall: { zone: [1, 3], p: 0.30,
      texto: "¡A REVENTARLA! La zaga la manda lejos del área y el rival tiene que armar todo otra vez desde atrás." } },
  },

  /* ── EXPANSIÓN · las armas del que defiende ──────────────────────────────── */
  {
    id: "especialistas", filo: "bloque", rama: "expansion", tier: "basic", icon: "📐",
    nombre: "Especialistas",
    desc: "El equipo tiene pateadores de verdad: cada centro de pelota quieta cae donde tiene que caer.",
    momento: "El córner que cae clavado en la cabeza del nueve.",
    efecto: [["+10%", "de acierto en la ejecución de TU balón parado"]],
    req: { previo: "marca_zonal" }, pos: { x: 415, y: 578 },
    hooks: { setpieceRehearsed: { bonus: 0.10, poolMult: 1,
      texto: "Esto lo patea un especialista: la pelota quieta cae exactamente donde se ensayó." } },
  },
  {
    id: "estrategia_ensayada", filo: "bloque", rama: "expansion", tier: "intermediate", icon: "📋",
    nombre: "Estrategia Ensayada",
    desc: "La pizarra del balón parado se ensaya toda la semana: córners y tiros libres laterales terminan en remate mucho más seguido.",
    momento: "El córner que sale clavado como en la pizarra, con el rival mirándolo venir y llegando tarde igual.",
    // LOS DOS EFECTOS SON UNO SOLO, y separarlos fue un error medido. El ×1.25 se quitó
    // por "mudo" y resultó ser lo único que hacía EXISTIR el fútbol de esta rama: sin él,
    // un equipo de Bloque juega 0.34 balones parados por partido y sus tres nodos de
    // balón parado —el básico, éste y La Segunda Ola— casi no tienen dónde ocurrir. La
    // lección: un multiplicador de sorteo no se SIENTE solo, pero es lo que le da materia
    // prima a los que sí se sienten. Se mide la frecuencia ANTES de quitar una.
    efecto: [
      ["×1.25", "más BALÓN PARADO en tu sorteo, apilado sobre el que el Bloque ya tiene de fábrica"],
      ["30%", "de que ese balón parado nazca ENSAYADO: se ve antes de elegir y suma +10% de acierto"],
    ],
    req: { previo: "especialistas" }, pos: { x: 650, y: 578 },
    hooks: {
      poolMod: { weights: { balon_parado: 1.25 } },
      setpieceVariant: { p: 0.30, bonus: 0.10,
        texto: "Es la jugada de la semana: el bloqueo sale, el que entra llega antes y la pizarra se cumple." },
    },
  },
  {
    // Reemplaza a Al Área, que se anunciaba como jugada NUEVA y no lo era: `beachhead` no
    // le pone ninguna opción en la mano al jugador, es una cadena automática. Y encima su
    // gate la ataba a la zona del área rival, donde un equipo de Bloque casi nunca está —
    // se veía en el 9.4% de los partidos, el nodo más invisible del árbol.
    id: "segunda_ola", filo: "bloque", rama: "expansion", tier: "advanced", icon: "♒",
    nombre: "La Segunda Ola",
    desc: "En el balón parado suben todos, y los que suben no se van cuando la despejan: el área sigue llena cuando la pelota vuelve a caer, y el que la caza ya estaba parado ahí.",
    momento: "El córner despejado que vuelve al área y termina en gol de un central, con el rival mirando.",
    efecto: [["40%", "de que el rechace de TU balón parado vuelva a caer en el área: hay segundo remate (+10% de acierto)"]],
    req: { previo: "estrategia_ensayada" }, pos: { x: 885, y: 578 },
    hooks: { secondWave: { p: 0.40, bonus: 0.10,
      texto: "¡La despejan corta y el área SIGUE LLENA! Nadie bajó: la segunda ola ya estaba ahí." } },
  },

  /* ── MASTER de convergencia (Respuesta + Expansión) ──────────────────────── */
  {
    id: "hombre_objetivo", filo: "bloque", rama: "convergencia", tier: "master", icon: "🎯",
    nombre: "Hombre Objetivo",
    desc: "El nueve ya no solo cabecea: también la baja para el que llega de frente al arco.",
    momento: "El nueve aguantando de espaldas y la descarga que termina en gol.",
    efecto: [
      ["NUEVA", "desbloquea PIVOTEO AL ÁREA rival como tercera opción del duelo aéreo"],
      ["+10%", "de acierto: la baja al mejor rematador, que define de frente al arco"],
    ],
    req: { alguno: ["pelotazo_fuera", "segunda_ola"] }, pos: { x: 1092, y: 475 },
    hooks: { pivot: { zone: [4, 5], bonus: 0.10,
      texto: "El hombre objetivo la aguanta de espaldas y la BAJA: llega uno de frente al arco." } },
  },
];
