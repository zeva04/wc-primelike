/* Rasgos de 🦁 HIGH PRESS — cazar arriba.
   Tres ramas: firma (profundiza lo propio) · respuesta (cubre el matchup débil)
   · expansión (abre un fútbol lateral). El nivel de desbloqueo y el costo salen
   del tier (ver TRAIT_LEVEL / TRAIT_COST en ./index.js).

   `efecto`: LO QUE EL RASGO HACE EN EL PARTIDO, escrito para el jugador. Cada
   línea es [valor, texto] y sale LEÍDA DEL HOOK de al lado — si el hook se
   recalibra, la línea se corrige con él. Convenciones del valor:
     · "28%"   una probabilidad del hook (`p`)
     · "+5%"   un `bonus`, que el motor SUMA a una probabilidad 0..1 (actions.js)
     · "×1.22" un peso del sorteo de jugadas (`poolMod` / `oppPoolMod`)
     · "NUEVA" desbloquea una jugada · "PROFUNDA" profundiza la jugada firma

   `gate`: la CONDICIÓN, aparte. No es un efecto más — es la letra chica: si no se
   cumple, el rasgo vale cero. Por eso la ficha lo baja al pie, en ámbar y con ⚠,
   en vez de dejarlo confundido entre los buffs. */

export const TRAITS_PRESS = [
  /* Firma · la presión misma */
  {
    id: "presion_intensificada", filo: "press", rama: "firma", tier: "basic", icon: "🔥",
    nombre: "Presión Intensificada",
    desc: "El equipo salta sobre el que recibe sin esperar a estar ordenado: presionar deja de ser un recurso y pasa a ser la primera opción.",
    momento: "El rival tocando de primera porque no lo dejan pensar.",
    efecto: [["28%", "de que un acierto de la presión se convierta directo en RECUPERACIÓN (+3% de acierto en esa jugada)"]],
    req: {}, pos: { x: 190, y: 200 },
    hooks: { convertOnPress: { to: "recuperacion", p: 0.28, bonus: 0.03,
      texto: "¡La presión no da tregua! El que recibe no tuvo tiempo ni de girar: la pelota es nuestra." } },
  },
  {
    id: "mittelfeldpressing", filo: "press", rama: "firma", tier: "intermediate", icon: "🧲",
    nombre: "Mittelfeldpressing",
    desc: "La línea de presión se planta en el círculo central: el rival puede salir de su área, pero no puede cruzar la mitad.",
    momento: "Tres robos seguidos en el círculo central.",
    efecto: [["×1.22", "más RECUPERACIONES en el sorteo de jugadas del partido"]],
    req: { previo: "presion_intensificada" },
    pos: { x: 450, y: 200 },
    hooks: { poolMod: { weights: { recuperacion: 1.22 } } },
  },
  {
    id: "angriffpressing", filo: "press", rama: "firma", tier: "advanced", icon: "🦁",
    nombre: "Angriffpressing",
    desc: "La presión se adelanta hasta el saque de meta rival: el error se fuerza en el último tercio, con el arco enfrente. Exige jugar con el BLOQUE ALTO: no se salta sobre el saque de meta desde el propio área.",
    momento: "Robo al central y gol de vestuario.",
    efecto: [["45%", "de que la recuperación nazca en su versión PROFUNDA: robo sobre el saque de meta rival (+6% de acierto)"]],
    gate: "Solo con BLOQUE ALTO o MUY ALTO: no se salta sobre el saque de meta desde el propio área.",
    req: { previo: "mittelfeldpressing" },
    pos: { x: 710, y: 128 },
    hooks: { variantDeep: { of: "recuperacion", minHeight: 4, p: 0.45, bonus: 0.06,
      intro: p => `¡Presión sobre el SAQUE DE META rival! ${p.name} salta sobre el central que recibe.` } },
  },
  {
    id: "gegenpressing", filo: "press", rama: "firma", tier: "advanced", icon: "🐺",
    nombre: "Gegenpressing",
    desc: "Los cinco segundos siguientes a una pérdida son los más agresivos del partido: recuperar antes de reorganizarse.",
    momento: "La perdió y la cazó al toque.",
    efecto: [
      ["30%", "de encadenar una recuperación mía justo al perder la pelota (+4% de acierto)"],
      ["PROFUNDA", "la jugada firma del Press gana su tramo extra"],
    ],
    req: { previo: "mittelfeldpressing" },
    pos: { x: 710, y: 275 },
    hooks: {
      chainOnMineFail: { to: "recuperacion", p: 0.30, bonus: 0.04,
        intro: p => `¡MORDIDA tras pérdida! ${p.name} salta sobre la pelota antes de que el rival respire.` },
      deepPress: {},
    },
  },
  {
    id: "pressingfalle", filo: "press", rama: "firma", tier: "master", icon: "👑",
    nombre: "Pressingfalle",
    desc: "La cancha tiene zonas donde entrar es un error: el equipo deja pasar el balón hasta ahí y entonces se cierra la trampa.",
    momento: "El rival metiéndose solo en la boca del lobo, partido tras partido.",
    efecto: [
      ["+7%", "de acierto en toda la familia de la RECUPERACIÓN"],
      ["+12%", "de que enganche la mordida tras pérdida (sobre el 30% de Gegenpressing)"],
    ],
    req: { alguno: ["angriffpressing", "gegenpressing"] },
    pos: { x: 960, y: 200 },
    hooks: { masterPress: { bonus: 0.07, chainPlus: 0.12,
      texto: "La trampa estaba dibujada desde el primer minuto: el rival entró, y entrar ahí es perderla." } },
  },

  /* Respuesta · el precio de presionar */
  {
    id: "pulmones", filo: "press", rama: "respuesta", tier: "basic", icon: "🫁",
    nombre: "Pulmones de Acero",
    desc: "El equipo está preparado para correr los noventa minutos: presionar le cuesta menos que a cualquier otro.",
    momento: "Presionando igual de arriba en el minuto ochenta.",
    efecto: [["−15%", "de energía por cada botón de PRESIÓN que aprietes en el partido"]],
    req: {}, pos: { x: 190, y: 390 },
    hooks: { pressStamina: { factor: 0.85 } },
  },
  {
    id: "vigilancia", filo: "press", rama: "respuesta", tier: "intermediate", icon: "🛡️",
    nombre: "Vigilancia Defensiva",
    desc: "Los centrales leen el balón largo antes de que salga: la espalda de la presión deja de ser una autopista.",
    momento: "El central cortando de cabeza el pelotazo que iba a partir al equipo.",
    efecto: [["40%", "de cortar el pelotazo a tu espalda ANTES de que se vuelva mano a mano"]],
    req: { previo: "pulmones" },
    pos: { x: 450, y: 390 },
    hooks: { breakawayGuard: { p: 0.40,
      texto: "El central LEYÓ el pelotazo a la espalda: paso adelante y corte de cabeza. La presión sigue viva." } },
  },
  {
    id: "repliegue", filo: "press", rama: "respuesta", tier: "advanced", icon: "🪃",
    nombre: "Repliegue",
    desc: "Cuando la presión se rompe, el equipo entero vuelve corriendo a plantarse: el contragolpe rival se encuentra con todos de vuelta. Cuesta piernas.",
    momento: "La contra rival muriendo contra once camisetas que llegaron antes.",
    efecto: [["−6%", "de acierto en el remate de la CONTRA rival: llega a rematar desde donde no se hace gol"]],
    req: { previo: "vigilancia" },
    pos: { x: 710, y: 390 },
    hooks: { oppShotMalus: { seq: "transicion", bonus: -0.06,
      texto: "El repliegue llegó primero: la contra rival remató desde donde no se hace gol." } },
  },
  {
    id: "elasticidad", filo: "press", rama: "respuesta", tier: "master", icon: "👑",
    nombre: "Elasticidad",
    desc: "Replegarse ya no es rendirse: el bloque se estira, aguanta, y en cuanto toca la pelota vuelve a salir a presionar como si nada.",
    momento: "Repliegue, corte, y el equipo entero otra vez arriba en diez segundos.",
    efecto: [["32%", "de que contener el ataque rival encadene RECUPERACIÓN mía (+5% de acierto)"]],
    req: { previo: "repliegue" },
    pos: { x: 960, y: 390 },
    hooks: { chainOnContain: { to: "recuperacion", p: 0.32, bonus: 0.05,
      intro: p => `¡El acordeón se cierra! Contuvieron, y ${p.name} ya está otra vez encima del que la tiene.` } },
  },

  /* Expansión · qué hacer con la pelota robada */
  {
    id: "directo", filo: "press", rama: "expansion", tier: "basic", icon: "🎯",
    nombre: "Directo",
    desc: "El primer pase tras el robo mira siempre hacia adelante: nada de asegurar, nada de recircular.",
    momento: "Robo y pase al espacio en el mismo movimiento.",
    efecto: [["26%", "de que la recuperación saltee los actos intermedios y vaya directo al desenlace (+4% de acierto)"]],
    req: {}, pos: { x: 190, y: 545 },
    hooks: { skipToFinish: { of: "recuperacion", p: 0.26, bonus: 0.04,
      intro: p => `¡Sin pensarlo! El robo y el pase fueron la misma jugada: ${p.name} ya está de cara.` } },
  },
  {
    id: "egoistas", filo: "press", rama: "expansion", tier: "intermediate", icon: "🧊",
    nombre: "Egoístas",
    desc: "Robada la pelota, el equipo se la queda: el rival, que salió a buscarla, se queda esperando su turno.",
    momento: "Dos minutos sin que el rival la toque después del robo.",
    efecto: [["35%", "de reciclar la posesión cuando te interceptan el pase de construcción: la jugada no muere ahí"]],
    req: { previo: "directo" },
    pos: { x: 400, y: 505 },
    hooks: { recycleBuild: { p: 0.35,
      texto: "La pelota es nuestra y se queda: el equipo la esconde, la jugada no muere." } },
  },
  {
    id: "contragolpistas", filo: "press", rama: "expansion", tier: "intermediate", icon: "🏇",
    nombre: "Contragolpistas",
    desc: "No hace falta robar arriba: cualquier pelota ganada en el medio o atrás también se convierte en carrera.",
    momento: "El rechace que cae al pie y ya son cuatro corriendo.",
    efecto: [["28%", "de que el rechace de un duelo aéreo perdido lance TRANSICIÓN mía (+3% de acierto)"]],
    req: { previo: "directo" },
    pos: { x: 400, y: 615 },
    hooks: { chainOnDuelFail: { to: "transicion", p: 0.28, bonus: 0.03,
      intro: p => `¡La segunda pelota fue nuestra! ${p.name} la engancha y sale disparado con el rival mal parado.` } },
  },
  {
    id: "pacientes", filo: "press", rama: "expansion", tier: "advanced", icon: "♟️",
    nombre: "Pacientes",
    desc: "Con la pelota robada, el equipo elige bien: los pases posteriores a una presión exitosa se juegan con cabeza fría.",
    momento: "El pase de gol dado sin apuro, con el rival todavía desordenado.",
    efecto: [["+5%", "de acierto al buscar al MEJOR UBICADO en el desenlace de la jugada"]],
    req: { previo: "egoistas" },
    pos: { x: 620, y: 505 },
    hooks: { supportUpgrade: { bonus: 0.05,
      texto: "Cabeza fría: el pase busca al mejor ubicado de verdad, y lo encuentra libre." } },
  },
  {
    id: "tres_toques", filo: "press", rama: "expansion", tier: "advanced", icon: "🗡️",
    nombre: "Tres Toques",
    desc: "Del robo al remate en el menor número de pases posible: la jugada se resuelve antes de que el rival vuelva a estar en su sitio.",
    momento: "Robo, pase, gol: ocho segundos.",
    efecto: [["+6%", "de acierto cada vez que la jugada SALTEA los actos intermedios (el atajo de Directo)"]],
    req: { previo: "contragolpistas" },
    pos: { x: 620, y: 615 },
    hooks: { skipUpgrade: { bonus: 0.06,
      intro: p => `¡TRES TOQUES y afuera! El pase rompe la última línea y ${p.name} queda lanzado.` } },
  },
  {
    id: "frios", filo: "press", rama: "expansion", tier: "master", icon: "👑",
    nombre: "Fríos",
    desc: "Con el partido ganado, el equipo que presiona sabe también congelarlo: robar y devolverla atrás es una decisión, no una renuncia.",
    momento: "Los últimos diez minutos jugados en campo propio, con la ventaja intacta.",
    efecto: [
      ["NUEVA", "desbloquea CONGELAR en el desenlace: devolverla al área propia y comer reloj"],
      ["−1", "llegada rival descontada del partido por cada congelada — el precio es resignar TU ocasión"],
    ],
    gate: "Rasgo de ESTADO: solo desde el minuto 70 y sin ir perdiendo. Fuera de ahí no aporta nada.",
    req: { previo: "pacientes" },
    pos: { x: 840, y: 490 },
    hooks: { iceGame: {
      texto: "Fríos como el hielo: la devuelven atrás y el reloj empieza a jugar para nosotros." } },
  },
  {
    id: "calientes", filo: "press", rama: "expansion", tier: "master", icon: "👑",
    nombre: "Calientes",
    desc: "Robada la pelota, el equipo no la suelta más: el rival queda encerrado en su propio bloque y ya no sale de ahí.",
    momento: "El rival metido en su área durante diez minutos seguidos.",
    efecto: [["×1.28", "más REPLIEGUE en el sorteo del rival: se queda metido en su área en vez de atacarte"]],
    req: { previo: "pacientes" },
    pos: { x: 1040, y: 500 },
    hooks: { oppPoolMod: { weights: { repliegue: 1.28 } } },
  },
  {
    id: "carrilenos", filo: "press", rama: "expansion", tier: "master", icon: "👑",
    nombre: "Carrileños",
    desc: "Los laterales son los que más corren del equipo: en cada contra hay siempre una banda libre y un centro esperando.",
    momento: "El centro del lateral que llegó desde su propia área.",
    efecto: [["+6%", "de acierto: el desenlace de la TRANSICIÓN llega en su versión profunda, el centro del carrilero"]],
    req: { previo: "tres_toques" },
    pos: { x: 840, y: 615 },
    hooks: { deepFinish: { of: "transicion", bonus: 0.06,
      texto: "El carrilero llegó desde atrás y puso el centro exacto: la contra terminó como se dibuja." } },
  },
  {
    id: "el_jaguar", filo: "press", rama: "expansion", tier: "master", icon: "👑",
    nombre: "El Jaguar",
    desc: "En cada contra hay un jugador que sale solo: el equipo lo busca siempre, y el mano a mano es el desenlace natural.",
    momento: "El delantero solo contra el arquero, otra vez.",
    efecto: [["28%", "de que el desenlace de la TRANSICIÓN se acelere hasta el mano a mano (+6% de acierto)"]],
    req: { previo: "tres_toques" },
    pos: { x: 1040, y: 615 },
    hooks: { accelFinish: { of: "transicion", p: 0.28, bonus: 0.06,
      intro: p => `¡EL JAGUAR se suelta! ${p.name} arranca solo y ya no lo agarra nadie: mano a mano.` } },
  },
];
