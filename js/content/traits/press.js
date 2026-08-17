/* Rasgos de 🦁 HIGH PRESS — cazar arriba.

   FORMA v2 (13-ago-2026): la MISMA en las cuatro filosofías —
     1 RAÍZ (la declaración de identidad, sin rama)
     3 ramas × 3 tiers (firma · respuesta · expansión)
     2 MASTERS: uno cierra la Firma, el otro CONVERGE Respuesta + Expansión.
   Total 12 por árbol. El nivel de desbloqueo y el costo salen del tier
   (TRAIT_LEVEL / TRAIT_COST en ./index.js).

   `efecto`: LO QUE EL RASGO HACE EN EL PARTIDO, escrito para el jugador. Cada
   línea es [valor, texto] y sale LEÍDA DEL HOOK de al lado — si el hook se
   recalibra, la línea se corrige con él. Convenciones del valor:
     · "30%"   una probabilidad del hook (`p`)
     · "+10%"  un `bonus`, que el motor SUMA a una probabilidad 0..1 (actions.js)
     · "×1.25" un peso del sorteo de jugadas (`poolMod` / `oppPoolMod`)
     · "NUEVA" desbloquea una jugada · "PROFUNDA" profundiza la jugada firma

   LA ESCALA CERRADA v2. Los números no se eligen a ojo: `p` ∈ {20 25 30 40 50}%
   y el bonus sale del PESO DEL MOMENTO futbolístico, no del tier del nodo —
   acto repetido +5% · acto decisivo +10% · desenlace +15% · regalo +20%.
   EXCEPCIÓN declarada: los multiplicadores `vsFilo` (Osciladores, El Anzuelo,
   Fortaleza Inexpugnable) NO entran en la escala porque no se eligen — se
   DERIVAN de la celda de la matriz de counters (1 / celda) para dejarla en
   tablas. Redondearlos a ×1.5 invierte el matchup y rompe la ley del arco.

   `gate`: la CONDICIÓN, aparte. No es un efecto más — es la letra chica: si no se
   cumple, el rasgo vale cero. Por eso la ficha lo baja al pie, en ámbar y con ⚠,
   en vez de dejarlo confundido entre los buffs. */

export const TRAITS_PRESS = [
  /* ── RAÍZ ───────────────────────────────────────────────────────────────── */
  {
    id: "incomodar", filo: "press", rama: "raiz", tier: "root", icon: "❗",
    nombre: "Incomodar",
    desc: "No se espera a estar ordenado para molestar: desde el primer minuto el que recibe tiene a alguien encima, y el rival nunca llega a jugar lo que sabe jugar.",
    momento: "El rival renunciando a su fútbol y mandándola larga sin mirar.",
    efecto: [["×0.75", "menos jugada FIRMA del rival en su sorteo: no ataca menos, renuncia a lo suyo"]],
    req: {}, pos: { x: 150, y: 372 },
    hooks: { muzzleOppFirma: { factor: 0.75,
      texto: "No los dejan jugar lo suyo: el rival abandonó su libreto y juega a otra cosa." } },
  },

  /* ── FIRMA · la presión misma ────────────────────────────────────────────── */
  {
    id: "presion_intensificada", filo: "press", rama: "firma", tier: "basic", icon: "🔍",
    nombre: "Presión Intensificada",
    desc: "El equipo salta sobre el que recibe sin esperar a estar ordenado: presionar deja de ser un recurso y pasa a ser la primera opción.",
    momento: "El rival tocando de primera porque no lo dejan pensar.",
    efecto: [["+10%", "de acierto cada vez que el equipo sale a PRESIONAR"]],
    req: { previo: "incomodar" }, pos: { x: 415, y: 165 },
    hooks: { pressBonus: { bonus: 0.10,
      texto: "¡La presión no da tregua! El que recibe no tuvo tiempo ni de girar." } },
  },
  {
    id: "gegenpressing", filo: "press", rama: "firma", tier: "intermediate", icon: "🐺",
    nombre: "Gegenpressing",
    desc: "Los cinco segundos siguientes a una pérdida son los más agresivos del partido: recuperar antes de reorganizarse.",
    momento: "La perdió y la cazó al toque.",
    efecto: [
      ["30%", "de encadenar una recuperación mía justo al perder la pelota (+10% de acierto)"],
      ["PROFUNDA", "la jugada firma del Press gana su tramo extra"],
    ],
    req: { previo: "presion_intensificada" }, pos: { x: 650, y: 165 },
    hooks: {
      chainOnMineFail: { to: "recuperacion", p: 0.30, bonus: 0.10,
        intro: p => `¡MORDIDA tras pérdida! ${p.name} salta sobre la pelota antes de que el rival respire.` },
      deepPress: {},
    },
  },
  {
    id: "angriffpressing", filo: "press", rama: "firma", tier: "advanced", icon: "⬆️",
    nombre: "Angriffpressing",
    desc: "La presión se adelanta hasta el saque de meta rival: el error se fuerza en el último tercio, con el arco enfrente.",
    momento: "Robo al central y gol de vestuario.",
    efecto: [["50%", "de que la recuperación nazca en su versión PROFUNDA: robo sobre el saque de meta rival (+10% de acierto)"]],
    gate: "Solo con BLOQUE ALTO o MUY ALTO: no se salta sobre el saque de meta desde el propio área.",
    req: { previo: "gegenpressing" }, pos: { x: 885, y: 165 },
    hooks: { variantDeep: { of: "recuperacion", minHeight: 4, p: 0.50, bonus: 0.10,
      intro: p => `¡Presión sobre el SAQUE DE META rival! ${p.name} salta sobre el central que recibe.` } },
  },
  {
    id: "pressingfalle", filo: "press", rama: "firma", tier: "master", icon: "⛓️",
    nombre: "Pressingfalle",
    desc: "La cancha tiene zonas donde entrar es un error: el equipo deja pasar el balón hasta ahí y entonces se cierra la trampa.",
    momento: "El rival metiéndose solo en la boca del lobo, partido tras partido.",
    efecto: [
      ["+10%", "de acierto en toda la familia de la RECUPERACIÓN"],
      ["+10%", "de que enganche la mordida tras pérdida (sobre el 30% de Gegenpressing)"],
    ],
    req: { previo: "angriffpressing" }, pos: { x: 1092, y: 165 },
    hooks: { masterPress: { bonus: 0.10, chainPlus: 0.10,
      texto: "La trampa estaba dibujada desde el primer minuto: el rival entró, y entrar ahí es perderla." } },
  },

  /* ── RESPUESTA · el precio de presionar ──────────────────────────────────── */
  {
    id: "pulmones", filo: "press", rama: "respuesta", tier: "basic", icon: "🫁",
    nombre: "Pulmones de Acero",
    desc: "El equipo está preparado para correr los noventa minutos: presionar le cuesta menos que a cualquier otro.",
    momento: "Presionando igual de arriba en el minuto ochenta.",
    efecto: [["−20%", "de energía por cada botón de PRESIÓN que aprietes en el partido"]],
    req: { previo: "incomodar" }, pos: { x: 415, y: 372 },
    hooks: { pressStamina: { factor: 0.80 } },
  },
  {
    id: "vigilancia", filo: "press", rama: "respuesta", tier: "intermediate", icon: "🛡️",
    nombre: "Vigilancia Defensiva",
    desc: "Los centrales leen el balón largo antes de que salga: la espalda de la presión deja de ser una autopista.",
    momento: "El central cortando de cabeza el pelotazo que iba a partir al equipo.",
    efecto: [["40%", "de cortar el pelotazo a tu espalda ANTES de que se vuelva mano a mano"]],
    req: { previo: "pulmones" }, pos: { x: 650, y: 372 },
    hooks: { breakawayGuard: { p: 0.40,
      texto: "El central LEYÓ el pelotazo a la espalda: paso adelante y corte de cabeza. La presión sigue viva." } },
  },
  {
    // LA ÚNICA JUGADA NUEVA DEL PRESS. El árbol tenía doce nodos de porcentajes y ni una
    // decisión: la filosofía que más gente elige primero era la única que nunca le ponía
    // una opción en la mano. Y el gesto elegido no es decorativo — cortar con falta es el
    // parche que el propio Press se fabrica contra su propio riesgo (quedar partido).
    id: "falta_tactica", filo: "press", rama: "respuesta", tier: "advanced", icon: "🟨",
    nombre: "Falta Táctica",
    desc: "Cuando la presión se rompe y el rival sale lanzado, alguien lo baja. No es un error: es la última línea del que juega adelantado, y el equipo la ensaya como cualquier otra cosa.",
    momento: "La falta fría en el círculo central, con el brazo levantado pidiendo disculpas que nadie cree.",
    efecto: [
      ["NUEVA", "desbloquea CORTARLA CON FALTA en la contención: mata el ataque rival sin remate, y no falla nunca"],
      ["🟨", "amarilla segura, UNA vez por partido — y la segunda del mismo jugador te deja con diez"],
    ],
    req: { previo: "vigilancia" }, pos: { x: 885, y: 372 },
    hooks: { tacticalFoul: { once: true,
      texto: "Falta táctica, de manual: la cortan antes de que sea peligro y se comen la tarjeta sin discutir." } },
  },

  /* ── EXPANSIÓN · qué hacer con la pelota robada ──────────────────────────── */
  {
    id: "directo", filo: "press", rama: "expansion", tier: "basic", icon: "➡️",
    nombre: "Directo",
    desc: "El primer pase tras el robo mira siempre hacia adelante: nada de asegurar, nada de recircular.",
    momento: "Robo y pase al espacio en el mismo movimiento.",
    efecto: [["30%", "de que la recuperación saltee los actos intermedios y vaya directo al desenlace (+10% de acierto)"]],
    req: { previo: "incomodar" }, pos: { x: 415, y: 578 },
    hooks: { skipToFinish: { of: "recuperacion", p: 0.30, bonus: 0.10,
      intro: p => `¡Sin pensarlo! El robo y el pase fueron la misma jugada: ${p.name} ya está de cara.` } },
  },
  {
    // LA SEGUNDA JUGADA NUEVA DEL PRESS, y ocupa el slot que era de Egoístas — un nodo
    // que se veía en el 2.8% de los partidos porque su efecto (reciclar un pase filtrado
    // interceptado) solo existe en la CIRCULACIÓN, un fútbol que este árbol casi nunca
    // sortea. Estaba escrito para una filosofía que no era la suya.
    id: "el_zarpazo", filo: "press", rama: "expansion", tier: "intermediate", icon: "🐾",
    nombre: "El Zarpazo",
    desc: "La pelota robada no se acomoda: se remata en el mismo movimiento del robo, antes de que nadie llegue a taparla. O sale, o se va a la tribuna, y el equipo prefiere que a veces se vaya a la tribuna.",
    momento: "El zurdazo de primera apenas la robaron, con el arquero todavía dando dos pasos hacia atrás.",
    efecto: [
      ["NUEVA", "desbloquea REMATAR DE PRIMERA en el desenlace del robo alto: sin control, en el mismo movimiento"],
      ["+20%", "de acierto si la agarra bien, porque el arquero no llegó a acomodarse — pero un 30% de las veces se va a la tribuna sin remate"],
    ],
    req: { previo: "directo" }, pos: { x: 650, y: 578 },
    hooks: { firstTime: { p: 0.30, bonus: 0.20,
      texto: "¡No la controla! La engancha de primera apenas la roban." } },
  },
  {
    // Era "Tres Toques", y era el eslabón redundante del árbol: no hacía nada propio,
    // solo afilaba el atajo de Directo — con Mordedura Fatal arriba, la rama entera eran
    // tres versiones del mismo mecanismo. Ahora la rama cuenta CUATRO ideas: robo la
    // pelota y voy directo · me la quedo · elijo bien a quién · la mato.
    id: "pacientes", filo: "press", rama: "expansion", tier: "advanced", icon: "♟️",
    nombre: "Pacientes",
    desc: "Con la pelota robada, el equipo elige bien: el pase que sigue a un robo alto no busca al que está más cerca, busca al que de verdad puede definir.",
    momento: "El pase de gol dado sin apuro, con el rival todavía volviendo.",
    efecto: [["+10%", "de acierto: tras el ROBO ALTO el pase encuentra al MEJOR rematador, no al más cercano"]],
    req: { previo: "el_zarpazo" }, pos: { x: 885, y: 578 },
    hooks: { supportUpgrade: { of: "recuperacion", bonus: 0.10,
      texto: "Cabeza fría tras el robo: el pase busca al mejor ubicado de verdad, y lo encuentra libre." } },
  },

  /* ── MASTER de convergencia (Respuesta + Expansión) ──────────────────────── */
  {
    id: "mordedura_fatal", filo: "press", rama: "convergencia", tier: "master", icon: "🐍",
    nombre: "Mordedura Fatal",
    desc: "La pelota robada en campo rival ya no se juega: se termina. Entre el robo y el remate no queda nada en el medio.",
    momento: "Robo en la puerta del área y remate en el mismo movimiento, sin que nadie toque otra vez.",
    efecto: [["50%", "de que la recuperación nazca YA en el desenlace, sin actos intermedios"]],
    req: { alguno: ["falta_tactica", "pacientes"] }, pos: { x: 1092, y: 475 },
    hooks: { skipToFinish: { of: "recuperacion", p: 0.50, bonus: 0.10,
      intro: p => `¡MORDEDURA FATAL! Robaron y ya está: ${p.name} no dio ni un pase, está de cara al arco.` } },
  },
];
