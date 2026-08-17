/* Rasgos de 🎼 POSESIÓN — tener y circular.
   Forma v2: 1 raíz + 3 ramas × 3 tiers + 2 Masters (uno de Firma, uno que
   converge Respuesta + Expansión). Convenciones de `efecto`, escala cerrada y
   excepción de los multiplicadores `vsFilo`: documentadas en ./press.js. */

export const TRAITS_POSESION = [
  /* ── RAÍZ ───────────────────────────────────────────────────────────────── */
  {
    id: "el_rondo", filo: "posesion", rama: "raiz", tier: "root", icon: "🔄",
    nombre: "El Rondo",
    desc: "El equipo instala el rondo en campo rival y no lo suelta: el partido entero se juega donde el rival no quiere, y las piernas que corren detrás no son las nuestras.",
    momento: "Diez minutos seguidos de toque en campo rival.",
    efecto: [
      ["×1.25", "más CIRCULACIÓN en el sorteo de jugadas del partido"],
      ["+10%", "de desgaste de energía del RIVAL: el que corre detrás de la pelota es él"],
    ],
    req: {}, pos: { x: 150, y: 372 },
    hooks: {
      poolMod: { weights: { circulacion: 1.25 } },
      // El desgaste era el único efecto REAL del juego que no se veía nunca: vivía en el
      // tanque de energía del rival, que el jugador no mira. Ahora se narra el minuto en
      // que se cobra — que es el momento que el rasgo promete, no el promedio que lo causa.
      oppStamina: { factor: 1.10,
        texto: "El rival ya no llega: lleva medio partido corriendo detrás de una pelota que no toca, y se le nota en las piernas." },
    },
  },

  /* ── FIRMA · perfeccionar la estructura ofensiva ─────────────────────────── */
  {
    id: "buen_pie", filo: "posesion", rama: "firma", tier: "basic", icon: "🦶",
    nombre: "Buen Pie",
    desc: "El pase de seguridad deja de ser un trámite: el equipo lo da bien incluso con la presión encima, y la circulación no se corta nunca.",
    momento: "Veinte pases seguidos sin que ninguno se caiga.",
    // ACTO REPETIDO: suena en CADA pase seguro de la circulación (dos o tres por jugada),
    // así que vive en el escalón más bajo de la escala. A +10% una sinfonía entera valdría
    // +30% de remate, que es más que cualquier Master del juego.
    efecto: [["+5%", "de perfil de remate por cada PASE SEGURO completado: circular deja de ser trámite"]],
    req: { previo: "el_rondo" }, pos: { x: 415, y: 165 },
    hooks: { safePass: { bonus: 0.05,
      texto: "Buen pie: el pase de seguridad sale clavado y el ataque se acomoda un poco mejor." } },
  },
  {
    id: "tercer_hombre", filo: "posesion", rama: "firma", tier: "intermediate", icon: "🔺",
    nombre: "El Tercer Hombre",
    desc: "Las combinaciones de tres jugadores rompen líneas y aseguran la salida bajo presión: siempre aparece uno más para recibir.",
    momento: "La pared que deja atrás a toda la primera línea de presión.",
    efecto: [["40%", "de rescatar la SALIDA bajo presión cuando el pase falla, sin regalarle el remate al rival"]],
    req: { previo: "buen_pie" }, pos: { x: 650, y: 165 },
    hooks: { playoutRescue: { p: 0.40,
      texto: "El tercer hombre salva la salida: el pase interceptado encuentra al desmarcado y el regalo no existe." } },
  },
  {
    id: "osciladores", filo: "posesion", rama: "firma", tier: "advanced", icon: "🌊",
    nombre: "Osciladores",
    desc: "El equipo mueve el balón de un lado al otro hasta que la presión rival se parte: cada cambio de orientación deja la jauría corriendo el carril equivocado.",
    momento: "El cambio de cuarenta metros con los tres que venían a presionar mirando cómo pasa por arriba.",
    // ⚠ NO redondear a ×1.5: este peso es 1 / celda de la matriz de counters. Con ×1.5 la
    // celda queda en 1.08 y la Posesión GANA el cruce en vez de emparejarlo (ley del arco).
    efecto: [
      ["+10%", "de acierto en la DIAGONAL LARGA al carril vacío, el cambio de frente"],
      ["×1.39", "más CIRCULACIÓN en tu sorteo, pero solo frente a 🦁 High Press: neutraliza esa celda, no la invierte"],
    ],
    req: { previo: "tercer_hombre" }, pos: { x: 885, y: 165 },
    hooks: {
      // El ×1.39 solo existe contra UN rival de cuatro, así que como Avanzado el nodo
      // era inerte en tres partidos de cada cuatro. `switchPass` es lo que su propio
      // dibujo prometía —la onda que cruza de lado a lado— y aplica siempre.
      switchPass: { bonus: 0.10,
        texto: "El cambio de cuarenta metros: los tres que venían a presionar se quedan mirando cómo pasa por arriba." },
      poolMod: { vsFilo: "press", weights: { circulacion: 1.39 } },
    },
  },
  {
    id: "maquina_colectiva", filo: "posesion", rama: "firma", tier: "master", icon: "⚙️",
    nombre: "La Máquina Colectiva",
    desc: "Once jugadores moviéndose como una sola pieza. El rival deja de disputar el partido: corre detrás de una pelota que nunca le pertenece.",
    momento: "El gol a puerta vacía tras treinta pases, empujándola sin oposición.",
    efecto: [
      ["+5%", "de INICIATIVA: el reparto de jugadas del partido se inclina a tu favor de raíz"],
      ["40%", "de «pelota servida» una vez que la circulación llegó a ZONA DE REMATE (+20%: el gol a puerta vacía)"],
    ],
    req: { previo: "osciladores" }, pos: { x: 1092, y: 165 },
    hooks: {
      masterPosesion: { shareShift: 0.05 },
      tapIn: { zone: [4, 5], p: 0.40, bonus: 0.20, texto: "La máquina la dejó servida: solo hay que empujarla." },
    },
  },

  /* ── RESPUESTA · neutralizar cualquier intento del rival ─────────────────── */
  {
    id: "cabeza_fria", filo: "posesion", rama: "respuesta", tier: "basic", icon: "🧊",
    nombre: "Cabeza Fría",
    desc: "Con el rival encima y el arco propio a la espalda, el equipo no se apura: la pelota sale jugada igual, como si no pasara nada.",
    momento: "El central saliendo jugando entre dos que le venían a comer.",
    efecto: [["+10%", "de acierto al SALIR JUGANDO cuando el rival te asfixia la salida"]],
    req: { previo: "el_rondo" }, pos: { x: 415, y: 372 },
    hooks: { playoutBonus: { bonus: 0.10,
      texto: "Cabeza fría: con dos encima, la sacan jugada como si estuvieran solos." } },
  },
  {
    id: "la_trampa", filo: "posesion", rama: "respuesta", tier: "intermediate", icon: "🪤",
    nombre: "La Trampa",
    desc: "El equipo puede devolver la pelota atrás a propósito, para sacar al rival de su bloque y volver a empezar el ataque desde otro sitio.",
    momento: "El rival saliendo a buscarla y dejando el espacio que se estaba negando.",
    efecto: [
      ["NUEVA", "desbloquea DEVOLVERLA ATRÁS: sacar al rival de su bloque y rearmar (+10% de acierto)"],
      ["−5%", "de acierto en el remate del rival cuando te recupera la pelota: recupera lejos"],
    ],
    gate: "Devolverla atrás solo existe con el equipo YA ADELANTADO, de mediocampo en adelante: retroceder desde tu propia salida no saca a nadie de su bloque.",
    req: { previo: "cabeza_fria" }, pos: { x: 650, y: 372 },
    hooks: {
      oppShotMalus: { seq: "recuperacion", bonus: -0.05,
        texto: "Mordieron el anzuelo y salieron: cuando la recuperan, están lejos y el remate no asusta." },
      backPass: { zone: [3, 5], bonus: 0.10, texto: "El equipo la devuelve atrás y vuelve a armar: el rival tiene que salir de su bloque." },
    },
  },
  {
    id: "la_frontera", filo: "posesion", rama: "respuesta", tier: "advanced", icon: "🚩",
    nombre: "La Frontera",
    desc: "La línea sube y se sostiene: cuando la pierden arriba y el rival busca la espalda, el equipo levanta la mano en bloque.",
    momento: "El contragolpe rival muriendo en offside con toda la línea levantando el brazo.",
    efecto: [
      ["40%", "de cortar el pelotazo a tu espalda antes de que se vuelva mano a mano"],
      ["50%", "de anular la contra rival por OFFSIDE"],
    ],
    gate: "La trampa del offside pide BLOQUE ALTO o MUY ALTO: sin línea adelantada no hay trampa que tender (el corte del pelotazo sí aplica siempre).",
    req: { previo: "la_trampa" }, pos: { x: 885, y: 372 },
    hooks: {
      breakawayGuard: { p: 0.40,
        texto: "La línea sube junta y lo deja en offside: la frontera aguantó y el contragolpe no existió." },
      offsideTrap: { minHeight: 4, p: 0.50, texto: "¡Trampa del offside! La línea sube junta, el brazo en alto y la contra queda anulada." },
    },
  },

  /* ── EXPANSIÓN · transformar el dominio territorial en ocasiones ─────────── */
  {
    id: "pase_riesgo", filo: "posesion", rama: "expansion", tier: "basic", icon: "🔑",
    nombre: "Pase de Riesgo",
    desc: "Tanto toque tiene un para qué: cuando la línea rival se descuida un segundo, el pase ya salió entre los dos centrales.",
    momento: "El filtrado que parte a la defensa después de veinte toques.",
    efecto: [["+10%", "de acierto en el PASE FILTRADO, el que rompe líneas"]],
    req: { previo: "el_rondo" }, pos: { x: 415, y: 578 },
    hooks: { riskPass: { bonus: 0.10,
      texto: "El pase que rompe líneas: se metió entre los dos centrales y del otro lado había un compañero." } },
  },
  {
    id: "desesperantes", filo: "posesion", rama: "expansion", tier: "intermediate", icon: "⏳",
    nombre: "Desesperantes",
    desc: "Perseguir la pelota sin tocarla enloquece a cualquiera. El rival termina entrando mal, y eso se cobra en tiros libres y en tarjetas.",
    momento: "El penal en el minuto ochenta tras diez minutos de sitio.",
    efecto: [["PROFUNDA", "la jugada firma de Posesión gana su 4º compás y abre el penal por desesperación"]],
    req: { previo: "pase_riesgo" }, pos: { x: 650, y: 578 },
    hooks: { deepPosesion: {} },
  },
  {
    id: "frios", filo: "posesion", rama: "expansion", tier: "advanced", icon: "❄️",
    nombre: "Fríos",
    desc: "Con el partido ganado, el equipo que tiene la pelota sabe también congelarlo: devolverla atrás y comer reloj es una decisión, no una renuncia.",
    momento: "Los últimos diez minutos jugados en campo propio, con la ventaja intacta.",
    efecto: [
      ["NUEVA", "desbloquea CONGELAR en el desenlace: devolverla al área propia y comer reloj"],
      ["−1", "llegada rival descontada del partido por cada congelada — el precio es resignar TU ocasión"],
    ],
    gate: "Rasgo de ESTADO: solo desde el minuto setenta y sin ir perdiendo. Fuera de ahí no aporta nada.",
    req: { previo: "desesperantes" }, pos: { x: 885, y: 578 },
    hooks: { iceGame: {
      texto: "Fríos como el hielo: la devuelven atrás y el reloj empieza a jugar para nosotros." } },
  },

  /* ── MASTER de convergencia (Respuesta + Expansión) ──────────────────────── */
  {
    id: "el_carrusel", filo: "posesion", rama: "convergencia", tier: "master", icon: "🎠",
    nombre: "El Carrusel",
    desc: "Ya no es circular para atacar: es circular para vaciarlos. Cada pase que el rival persigue y no alcanza le saca un poco más de piernas.",
    momento: "El rival caminando en el minuto setenta mientras la pelota sigue girando.",
    efecto: [["−1", "de energía del RIVAL por cada pase que completás: la circulación es el desgaste"]],
    req: { alguno: ["la_frontera", "frios"] }, pos: { x: 1092, y: 475 },
    hooks: { passDrain: { per: 1,
      texto: "El carrusel no para: el rival lleva veinte minutos corriendo detrás de una pelota que no toca." } },
  },
];
