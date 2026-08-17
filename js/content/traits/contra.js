/* Rasgos de ⚡ CONTRAGOLPE — atacar el espacio.
   Forma v2: 1 raíz + 3 ramas × 3 tiers + 2 Masters (uno de Firma, uno que
   converge Respuesta + Expansión). Convenciones de `efecto`, escala cerrada y
   excepción de los multiplicadores `vsFilo`: documentadas en ./press.js. */

export const TRAITS_CONTRA = [
  /* ── RAÍZ ───────────────────────────────────────────────────────────────── */
  {
    id: "punta_velocidad", filo: "contra", rama: "raiz", tier: "root", icon: "⚡",
    nombre: "Punta de Velocidad",
    desc: "El equipo se arma alrededor de una idea sola: cuando hay campo por delante, el que conduce arranca y no lo alcanza nadie.",
    momento: "Los treinta metros corridos de una sola vez, sin que nadie le llegue.",
    efecto: [["+5%", "de acierto al CONDUCIR la contra: el arranque al espacio se gana"]],
    req: {}, pos: { x: 150, y: 372 },
    hooks: { carryBonus: { bonus: 0.05,
      texto: "Punta de velocidad: arrancó y la carrera ya estaba decidida a los diez metros." } },
  },

  /* ── FIRMA · la contra misma ─────────────────────────────────────────────── */
  {
    id: "primer_pase", filo: "contra", rama: "firma", tier: "basic", icon: "📡",
    nombre: "Primer Pase",
    desc: "El primer pase tras recuperar la pelota no se piensa: sale hacia adelante y sale bien. La contra nace ya lanzada.",
    momento: "El pase que sale en el mismo movimiento del robo.",
    efecto: [["+10%", "de acierto en el PRIMER pase de la contra, el que la lanza"]],
    req: { previo: "punta_velocidad" }, pos: { x: 415, y: 165 },
    hooks: { transitionPass: { act: "first", bonus: 0.10,
      texto: "El primer pase salió al toque: la contra nace lanzada, sin escala de seguridad." } },
  },
  {
    id: "ataque_relampago", filo: "contra", rama: "firma", tier: "intermediate", icon: "🌩️",
    nombre: "Ataque Relámpago",
    desc: "Del robo al remate en el menor número de pases posible: la jugada se resuelve antes de que el rival vuelva a estar en su sitio.",
    momento: "Robo, pase, gol: ocho segundos.",
    efecto: [
      ["30%", "de que la contra saltee los actos intermedios y se juegue a UNA (+10% de acierto)"],
      ["PROFUNDA", "la jugada firma del Contragolpe gana su tramo extra"],
    ],
    req: { previo: "primer_pase" }, pos: { x: 650, y: 165 },
    hooks: {
      skipToFinish: { of: "transicion", p: 0.30, bonus: 0.10,
        intro: p => `¡Sin escalas! ${p.name} sale disparado: la contra se juega a UNA.` },
      deepContra: {},
    },
  },
  {
    id: "duelista", filo: "contra", rama: "firma", tier: "advanced", icon: "🏃",
    nombre: "Duelista",
    desc: "La contra ya está en marcha y el que la lleva no acepta el pase: encara al último defensor, se lo saca de encima y sigue. Lo que era una jugada de tres pasa a ser cosa de dos.",
    momento: "El uno contra uno ganado a la carrera, en la última línea, con todo el estadio de pie.",
    efecto: [["30%", "de que la contra YA LANZADA se salte su último pase: encara, gana el duelo y define él (+15%)"]],
    req: { previo: "ataque_relampago" }, pos: { x: 885, y: 165 },
    hooks: { accelFinish: { of: "transicion", p: 0.30, bonus: 0.15,
      intro: p => `¡${p.name} encara al último y se lo lleva puesto! Ya no hay a quién pasarla: va él.` } },
  },
  {
    id: "el_enjambre", filo: "contra", rama: "firma", tier: "master", icon: "🐝",
    nombre: "El Enjambre",
    desc: "La contra ya no la corren dos: la corren cinco. Cuando la pelota llega al área, la defensa rival no sabe a quién marcar.",
    momento: "Cuatro camisetas cruzando mediocampo a la vez.",
    efecto: [
      ["+10%", "de acierto cuando la contra llega en oleada a campo abierto"],
      ["+5%", "de que le hagan FALTA al que conduce la contra: más tiros libres y más penales"],
    ],
    req: { previo: "duelista" }, pos: { x: 1092, y: 165 },
    hooks: {
      avalancha: { bonus: 0.10,
        texto: "AVALANCHA a campo abierto: la contra llega en oleada y la defensa no sabe a quién marcar." },
      // El segundo efecto que le faltaba al Master más pobre del catálogo. Y no es un
      // bonus más: una falta CAMBIA el marcador (tiro libre, penal, tarjeta rival), así
      // que se siente de una manera que un porcentaje de acierto no puede.
      counterFouls: { plus: 0.05,
        texto: "Con cinco encima no lo pueden frenar limpio: al que corre la contra hay que hacerle falta." },
    },
  },

  /* ── RESPUESTA · el precio de correr, y cómo fabricarse la contra ────────── */
  {
    id: "estoicos", filo: "contra", rama: "respuesta", tier: "basic", icon: "🗿",
    nombre: "Estóicos",
    desc: "Replegado, el equipo aguanta lo que le tiren: cede terreno sin ceder el área, y espera su momento.",
    momento: "El rival estrellándose contra el bloque una y otra vez.",
    efecto: [["+10%", "de acierto en el acto de CONTENER el ataque rival cuando estás replegado"]],
    req: { previo: "punta_velocidad" }, pos: { x: 415, y: 372 },
    hooks: { containBonus: { bonus: 0.10,
      texto: "El bloque aguanta estoico: cortan la jugada sin despeinarse." } },
  },
  {
    id: "el_anzuelo", filo: "contra", rama: "respuesta", tier: "intermediate", icon: "🎣",
    nombre: "El Anzuelo",
    desc: "El equipo tiene la pelota en su propio campo y espera: el rival, aburrido de mirar, termina saliendo a buscarla — y eso es exactamente lo que se quería.",
    momento: "El rival dando dos pasos afuera de su bloque y el espacio a su espalda abierto de par en par.",
    // ⚠ El ×1.67 NO se redondea a ×1.5: es 1 / celda de la matriz contra los que esperan
    // (0.6 × 1.67 ≈ 1.00). Con ×1.5 la celda queda en 0.90 y el partido muerto sigue muerto.
    efecto: [
      ["×1.25", "el rival sale a presionar tu salida más seguido: sobrevivirla YA es una contra"],
      ["×1.67", "más TRANSICIONES en tu sorteo, solo contra ⚡ Contragolpe y 🧱 Bloque bajo (el partido muerto)"],
      ["30%", "de convertir la circulación-cebo en contra mía (+10% de acierto)"],
    ],
    req: { previo: "estoicos" }, pos: { x: 650, y: 372 },
    hooks: {
      oppPoolMod: { weights: { salida_fondo: 1.25 } },
      poolMod: { vsFilo: ["contra", "bloque"], weights: { transicion: 1.67 } },
      baitConvert: { vsFilo: ["contra", "bloque"], p: 0.30, bonus: 0.10,
        texto: "¡Picaron el ANZUELO! El rival dio dos pasos afuera y el espacio a su espalda es una autopista." },
    },
  },
  {
    // El cierre de la rama Respuesta: aguanto (Estóicos) → los invito (El Anzuelo) →
    // SALGO. Reemplazó a Segundo Aire, que pedía llegar al partido con medio tanque —
    // un estado de partido entero, no un momento, y muchas runs no lo veían nunca.
    id: "salir_de_contra", filo: "contra", rama: "respuesta", tier: "advanced", icon: "🚪",
    nombre: "Salir de Contra",
    desc: "Defender no es el final de nada: en el instante en que la zaga toca la pelota, los de arriba ya arrancaron. El bloque no aguanta para sobrevivir, aguanta para salir.",
    momento: "El corte del central y, tres segundos después, dos camisetas cruzando la mitad de cancha.",
    efecto: [["30%", "de que CONTENER el ataque rival encadene contra mía sin pasar por armar (+10% de acierto)"]],
    req: { previo: "el_anzuelo" }, pos: { x: 885, y: 372 },
    hooks: { chainOnContain: { to: "transicion", p: 0.30, bonus: 0.10,
      intro: p => `¡CONTUVIERON Y SALIERON! ${p.name} arranca con el rival todavía volcado en ataque.` } },
  },

  /* ── EXPANSIÓN · lo que un equipo de contra sabe hacer ADEMÁS de correr ──── */
  {
    // Bajó del Intermedio al básico cuando Segunda Pelota salió del catálogo: su cadena
    // se veía en el 18% de los partidos contra el 6% de aquella, y encima aquella era el
    // único básico del juego que no era un número simple.
    id: "saque_rapido", filo: "contra", rama: "expansion", tier: "basic", icon: "⏱️",
    nombre: "Saque Rápido",
    desc: "Reventarla ya no es rendirse: el equipo reinicia antes de que el rival se acomode, y la jugada que parecía muerta sale corriendo para el otro lado.",
    momento: "El despeje que el rival mira caer mientras dos ya salieron corriendo.",
    efecto: [["30%", "de que el despeje de una salida asfixiada reinicie rápido y sea CONTRA mía (+10% de acierto)"]],
    req: { previo: "punta_velocidad" }, pos: { x: 415, y: 578 },
    hooks: { quickRestart: { p: 0.30, bonus: 0.10,
      intro: p => `¡SAQUE RÁPIDO! La reiniciaron antes de que el rival volviera: ${p.name} ya está corriendo.` } },
  },
  {
    // LA SEGUNDA JUGADA NUEVA DEL CONTRA, y la única del catálogo que le enseña al árbol
    // a hacer LO CONTRARIO de su fantasía: frenar. Es la decisión que un equipo de contra
    // toma cuando llega dos contra cuatro — y la que separa al que corre del que sabe
    // correr. Cuesta un toque (la jugada no avanza) y puede morir en el intento.
    id: "la_pausa", filo: "contra", rama: "expansion", tier: "intermediate", icon: "✋",
    nombre: "La Pausa",
    desc: "Llegar primero no siempre es llegar mejor. El que conduce levanta la cabeza, ve que atrás vienen tres, y aguanta la pelota hasta que la contra deja de ser una carrera y pasa a ser un ataque.",
    momento: "El que iba lanzado frenando en seco, esperando, y recién entonces soltándola.",
    efecto: [
      ["NUEVA", "desbloquea LA PAUSA al conducir la contra: frenar para que lleguen los de atrás (+15% de acierto)"],
      ["25%", "de que la defensa se acomode mientras esperás y la contra se apague: frenar se paga"],
    ],
    req: { previo: "saque_rapido" }, pos: { x: 650, y: 578 },
    hooks: { pauseCounter: { p: 0.25, bonus: 0.15,
      texto: "LA PAUSA: frena, levanta la cabeza y espera. Cuando la suelta ya no son dos contra cuatro." } },
  },
  {
    id: "pase_atras", filo: "contra", rama: "expansion", tier: "advanced", icon: "🔙",
    nombre: "Pase Atrás",
    desc: "Llegado al área, el que conduce no remata: la pisa y la devuelve para el que entra de frente al arco.",
    momento: "La pisada en el área chica y el compañero entrando solo a empujarla.",
    efecto: [
      ["NUEVA", "desbloquea PASE ATRÁS como opción del desenlace de la contra"],
      ["+15%", "de acierto respecto de rematar — pero es un pase de verdad: perderlo abre contra rival"],
    ],
    req: { previo: "la_pausa" }, pos: { x: 885, y: 578 },
    hooks: { squarePass: { bonus: 0.15,
      texto: "La pisa y la devuelve atrás: el que llega la empuja de frente al arco." } },
  },

  /* ── MASTER de convergencia (Respuesta + Expansión) ──────────────────────── */
  {
    id: "sin_escalas", filo: "contra", rama: "convergencia", tier: "master", icon: "🛣️",
    nombre: "Sin Escalas",
    desc: "A veces no hay jugada que contar. Hay una pelota que sale del área propia y cae cincuenta metros más allá, y cuando el relato empieza ya está todo decidido.",
    momento: "El pase único, de área a área, y el nueve girando de cara al arquero antes de que nadie reaccione.",
    efecto: [["20%", "de que la contra NO EXISTA como jugada: un solo pase y arranca YA de cara al arquero (+15%)"]],
    req: { alguno: ["salir_de_contra", "pase_atras"] }, pos: { x: 1092, y: 475 },
    hooks: { oneOnOne: { p: 0.20, bonus: 0.15,
      intro: p => `¡SIN ESCALAS! Un solo pase y ${p.name} quedó MANO A MANO con el arquero: no hubo jugada, hubo puñalada.` } },
  },
];
