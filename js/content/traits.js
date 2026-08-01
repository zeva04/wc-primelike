/* ============================================================
   content/traits — el catálogo de RASGOS del árbol de identidad
   (arco de Rasgos T1, decisiones PO 23-jul-2026 · doc vivo:
   docs/ROADMAP-rasgos.md).

   Un Rasgo es una idea futbolística permanente que el equipo
   incorpora con Puntos de Identidad. Ley del arco (Trait Design
   Rules del PO): un rasgo NUNCA es una mejora estadística —
   cambia prioridades, decisiones y generación de secuencias.
   Todo rasgo responde SÍ a: "¿esto hace que mi equipo juegue un
   fútbol diferente?", y todo rasgo tiene su MOMENTO nombrable
   (regla del arco: si no se ve en el partido, no entra al pool).

   Cada filosofía tiene 3 RAMAS (regla Firma · Respuesta ·
   Expansión): profundizar lo propio · cubrir el matchup débil ·
   abrir un fútbol lateral. El Basic de cada rama la abre.

   `desc` es la voz al jugador (sobria, sin números — decisión
   PO). `hooks` es BACKLOG: datos internos que el Match interpreta
   (match/traits-hooks) — jamás se muestran. `req` son las 4
   condiciones de desbloqueo del GDD §5: previo en la rama,
   Principios mínimos, nivel de Filosofía, 1 PI (el PI lo valida
   game/traits, no vive acá).

   Las reglas (comprar, validar, latencia al cambiar de
   filosofía) viven en game/traits.js — acá solo datos
   (ARQUITECTURA §4).
   ============================================================ */

/* Vocabulario de hooks (interpreta el motor, T1.3/T1.4):
   - chainOnMineFail:  {to, p, bonus}  mi secuencia ofensiva muere en fallo → p de
                       ENCADENAR una secuencia mía `to` (reactiva — la mordida).
   - chainOnContain:   {to, p, bonus}  mi repliegue contiene → p de convertir en
                       secuencia mía `to` (def→of, el patrón de la fortaleza).
   - chainOnDuelFail:  {to, p, bonus}  pelotazo con duelo perdido → p de ganar la
                       segunda pelota y ENCADENAR `to`.
   - variantDeep:      {of, p, bonus, intro} al arrancar una secuencia `of`, p de
                       jugarla en su variante PROFUNDA (robo más arriba / más letal),
                       con su propio relato.
   - convertOnPress:   {to, p, bonus}  acierto del acto de presión → p de convertir
                       la jugada en `to` (el robo en banda que ya es ataque).
   - recycleBuild:     {p}             pase filtrado interceptado → p de RECICLAR la
                       posesión (la jugada no muere; pierde el bonus del filtrado).
   - accelFinish:      {of, p, bonus, intro} en el desenlace de `of`, p de llegada
                       súbita con mejor perfil (la pausa que se vuelve puñal).
   - skipToFinish:     {of, p, bonus, intro} `of` puede saltarse los actos intermedios
                       e ir directo al desenlace con mejor perfil (3 pases o nada).
   - finishSupport:    {of, bonus}     el "buscar al mejor ubicado" del desenlace de
                       `of` mejora (la manada llega en números).
   - poolMod:          {vsFilo?, weights:{tipo:mult}} pesos del pool condicionales al
                       rival (la amplitud que estira al bloque). SOLO suaviza celdas
                       de matriz — neutralizar es de Advanced (regla del arco).
   - oppShotMalus:     {seq, bonus}    el remate rival en `seq` llega incómodo (la
                       jaula que invita a la banda: llegadas de peor calidad).
   - oppLoseActs:      {p}             una secuencia rival multi-acto pierde
                       continuidad (el partido cortado del oficio).

   Vocabulario Intermediate (T2 — regla: matchear por FAMILIA):
   - deepPress / deepPosesion / deepContra / deepBloque: {} — LA MIGRACIÓN F2:
     el efecto profundo que Consolidada regalaba ahora se COMPRA (caceria
     foulBreakDeep · sinfonia 4º compás + penal profundo · contra_letal
     deepBonus · fortaleza deepContain/convertDeep). Los interpreta el gate
     hasTrait() donde antes decidía filoRasgo().
   - breakawayGuard:   {p, texto}      el pelotazo ambiente a la espalda puede
                       morir cortado por el central que lo leyó (Anticipar).
   - deepFinish:       {of, bonus, texto} el desenlace de una VARIANTE PROFUNDA
                       (variantDeep) llega aún más limpio (Arco a la Vista).
   - playoutRescue:    {p, texto}      la salida jugada que falla puede rescatarse
                       (el tercer hombre aparece): sin remate regalado.
   - variantSwitch:    {of, vsFilo, p, bonus, intro} variante de arranque
                       condicional al rival (el cambio de frente vs bloque).
   - skipUpgrade:      {bonus, intro}  el salto de Tres Pases gana calidad y voz
                       propia (el primer pase que rompe la última línea).
   - supportUpgrade:   {bonus}         el "buscar al mejor ubicado" elige al MEJOR
                       de verdad (max Tiro) con superioridad real.
   - chainOnDefendSp:  {to, p, bonus, intro} el córner rival defendido encadena
                       pelotazo propio (comer centros → lanzar).
   - setpieceRehearsed:{bonus, poolMult, texto} el balón parado propio ejecuta la
                       jugada ensayada (mejor) y sale más seguido en el pool.
   - secondBallUpgrade:{bonus, intro}  la cadena de Segunda Jugada sube de calidad
                       y gana su propia voz (posición establecida).

   Vocabulario de los rediseños (Press 25-jul · Posesión 26-jul):
   - pressStamina:     {factor}        el ACTO de presionar cuesta menos piernas
                       (decisión PO: jamás la fatiga general del partido — la
                       economía de energía es el dial más sensible del juego).
   - tapIn:            {p, bonus, texto} tras una circulación LARGA (todos los
                       compases sonaron), el desenlace llega SERVIDO: solo hay
                       que empujarla. Misma condición que el penal de la sinfonía.
   - backPass:         {bonus, texto}  LA JUGADA NUEVA: una tercera opción en el
                       acto de construcción (Retroceso de posesión). No se
                       sortea: la elige el DT, una vez por secuencia. La jugada
                       no avanza, pero el rival sale de su bloque.
   - offsideTrap:      {p, texto}      la contra que nace de MI pérdida muere en
                       fuera de juego. Espejo de breakawayGuard (el otro hook de
                       La Frontera): juntos cubren los dos canales del balón a
                       la espalda.
   - iceGame:          {texto}         LA OTRA JUGADA NUEVA: "Congelar el partido",
                       una opción del desenlace desde el minuto 70 sin ir
                       perdiendo. Cambia MI ocasión por la del rival: se resigna
                       el remate y la próxima llegada rival no ocurre. Tampoco se
                       sortea — la elige el DT (match/sequence-acts.canFreeze).
   Vocabulario del rediseño del Contragolpe (30-jul-2026):
   - transitionPass:   {bonus, act?, texto} el pase de la contra sale limpio. `act:"first"`
                       lo limita al acto que la LANZA. SE APILAN (los suma el motor).
   - tiredLegs:        {under, bonus, texto} conducir la contra con la energía por debajo
                       de `under` deja de ser una condena (⚠️ adyacente: ver Segundo Aire).
   - counterFouls:     {plus, texto}   al que conduce la contra no lo frenan limpio: la
                       ventana de FALTA a favor se ensancha.
   - containBonus:     {bonus, texto}  replegado, el equipo corta más (el acto de contener).
   - quickRestart:     {p, bonus, intro} el despeje de la salida asfixiada reinicia rápido
                       y se vuelve contra mía (secuencia reactiva).
   - squarePass:       {bonus, texto}  LA JUGADA NUEVA "Pase Atrás": opción del desenlace,
                       solo en la familia de la contra. Es un pase de verdad (se pierde y
                       abre contra); si llega, el remate es de frente y servido.
   - oneOnOne:         {p, bonus, intro} la contra NACE resuelta: se saltean los actos
                       intermedios y el desenlace es el mano a mano.

   Vocabulario del rediseño del Bloque bajo (30-jul-2026):
   - boxShield:        {bonus, texto}  el remate rival DENTRO del área sale a destiempo.
   - aerialDef:        {bonus, texto}  el cabezazo rival (córner en contra) llega forzado.
   - wall:             {bonus, texto}  rasgo de ESTADO: mientras el marcador esté empatado
                       o a favor, la situación del remate rival empeora. Es el "+2 Defensa"
                       del diseño expresado por el canal legal (la ley del arco prohíbe
                       el buff plano de stats).
   - firstChanceGuard: {bonus, texto}  la PRIMERA ocasión rival del partido se encuentra
                       con la segunda línea ya puesta. Se consume una vez por partido.
   - clearChanceGuard: {p, texto}      la OCASIÓN CLARA rival (mano a mano tras contención
                       rota · contra tras mi pérdida) directamente no ocurre.
   - clearBall:        {p, texto}      LA JUGADA NUEVA "Reventar el Balón": tercera opción
                       del acto de contención. No se sortea: la elige el DT. Mata el ataque
                       rival sin remate, resignando lo que la contención podía dar — y `p`
                       de las veces el despeje sale al córner.
   - pivot:            {bonus, texto}  LA OTRA JUGADA NUEVA "Pivoteo al Área": tercera
                       opción del duelo aéreo. El que gana por arriba la BAJA al mejor
                       rematador, que define de frente en vez de cabecear.
   - transitionPass:   {bonus, texto}  tras recuperar, el pase de la transición sale limpio.
   - oppStamina:       {factor}        el rival se cansa MÁS RÁPIDO dentro del
                       partido (El Rondo: el rondo son ELLOS corriendo). Escala
                       medical.drainOppEnergy — ver docs/CORE.md §Fatiga del rival.
   El catálogo YA NO tiene deuda de motor: todo hook declarado lo lee el Match.
   ============================================================ */

export const TRAITS = [
  /* ================= 🦁 HIGH PRESS — el árbol REDISEÑADO =================
     18 rasgos (rediseño del PO, 25-jul-2026; ajustado el 26-jul, ver abajo). Sustituye al árbol de 9 del
     arco T1-T3: donde el concepto coincidía se reciclaron los hooks ya
     construidos (la mordida, el robo alto, el corte a la espalda), y el
     resto son nodos nuevos.

     La forma del árbol es la de una PRESIÓN ALTA dibujada en la cancha,
     no una grilla: cada rama nace en su zona y avanza hacia el arco rival
     por donde le corresponde ocupar el campo.
       Firma      (arriba)  la presión misma: intensidad → medio → la
                            bifurcación alemana (arriba del todo el
                            Angriffpressing; a media altura el Gegenpressing),
                            y los dos caminos vuelven a juntarse en Pressingfalle.
                            AJUSTE 26-jul (decisión PO): el Master era doble
                            (Pressingfalle + Rest Defense) y ganó Pressingfalle —
                            es el ideal platónico de la presión (no perseguís el
                            error: lo diseñás) y su hook premia a los DOS caminos.
                            El nombre y el hook de Rest Defense se mudaron a
                            Posesión, donde el concepto encaja mejor.
       Respuesta  (centro)  el precio de presionar: pulmón, vigilancia a la
                            espalda, repliegue y vuelta a empezar.
       Expansión  (abajo)   qué hacer con la pelota robada — y se abre en
                            dos ideas opuestas: quedársela o salir disparado.

     Cada nodo declara su `pos` en el viewBox de la pizarra (ui/board.js):
     el árbol de Press se dibuja como GRAFO. Las filosofías que todavía no
     se rediseñaron no declaran `pos` y siguen con la grilla de 3 carriles. */

  /* ---- Firma · la presión misma (círculo, campo alto) ---- */
  {
    id: "presion_intensificada", filo: "press", rama: "firma", tier: "basic", icon: "🔥",
    nombre: "Presión Intensificada",
    desc: "El equipo salta sobre el que recibe sin esperar a estar ordenado: presionar deja de ser un recurso y pasa a ser la primera opción.",
    momento: "El rival tocando de primera porque no lo dejan pensar.",
    req: { nivel: 1 }, pos: { x: 190, y: 200 },
    hooks: { convertOnPress: { to: "recuperacion", p: 0.28, bonus: 0.03,
      texto: "¡La presión no da tregua! El que recibe no tuvo tiempo ni de girar: la pelota es nuestra." } },
  },
  {
    id: "mittelfeldpressing", filo: "press", rama: "firma", tier: "intermediate", icon: "🧲",
    nombre: "Mittelfeldpressing",
    desc: "La línea de presión se planta en el círculo central: el rival puede salir de su área, pero no puede cruzar la mitad.",
    momento: "Tres robos seguidos en el círculo central.",
    req: { nivel: 3, previo: "presion_intensificada" },
    pos: { x: 450, y: 200 },
    // No es "+20% de presión": el partido GENERA más recuperaciones porque el
    // equipo vive en la zona donde se roba (la ley del arco — cambia el fútbol
    // que sale, no los números de los jugadores).
    hooks: { poolMod: { weights: { recuperacion: 1.22 } } },
  },
  {
    id: "angriffpressing", filo: "press", rama: "firma", tier: "advanced", icon: "🦁",
    nombre: "Angriffpressing",
    desc: "La presión se adelanta hasta el saque de meta rival: el error se fuerza en el último tercio, con el arco enfrente. Exige jugar con el BLOQUE ALTO: no se salta sobre el saque de meta desde el propio área.",
    momento: "Robo al central y gol de vestuario.",
    req: { nivel: 6, previo: "mittelfeldpressing" },
    pos: { x: 710, y: 128 },
    hooks: { variantDeep: { of: "recuperacion", minHeight: 4, p: 0.45, bonus: 0.06,
      intro: p => `¡Presión sobre el SAQUE DE META rival! ${p.name} salta sobre el central que recibe.` } },
  },
  {
    id: "gegenpressing", filo: "press", rama: "firma", tier: "advanced", icon: "🐺",
    nombre: "Gegenpressing",
    desc: "Los cinco segundos siguientes a una pérdida son los más agresivos del partido: recuperar antes de reorganizarse.",
    momento: "La perdió y la cazó al toque.",
    req: { nivel: 6, previo: "mittelfeldpressing" },
    pos: { x: 710, y: 275 },
    // deepPress: hereda la migración F2 (la Cacería total rota deja falta —
    // amarilla + tiro libre — mucho más seguido). Era de Cacería Letal.
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
    // LA CONVERGENCIA (decisión PO 26-jul): se llega desde CUALQUIERA de los dos
    // caminos de la bifurcación alemana. Su hook premia a los dos por separado —
    // `bonus` mejora la definición de toda la familia de la recuperación (lo que
    // construye Angriffpressing) y `chainPlus` afila la mordida (lo de Gegenpressing).
    // Absorbió el lugar del viejo Rest Defense, cuyo nombre se fue a Posesión y cuyo
    // hook (oppLoseActs) se fue con él: allá el concepto encaja mejor.
    req: { nivel: 10, alguno: ["angriffpressing", "gegenpressing"] },
    pos: { x: 960, y: 200 },
    // Hereda el hook del viejo Master (El Robo es el Pase): toda la familia de
    // la recuperación define mejor, y la mordida caza más seguido.
    hooks: { masterPress: { bonus: 0.07, chainPlus: 0.12,
      texto: "La trampa estaba dibujada desde el primer minuto: el rival entró, y entrar ahí es perderla." } },
  },
  /* ---- Respuesta · el precio de presionar (cuadrado, eje central) ---- */
  {
    id: "pulmones", filo: "press", rama: "respuesta", tier: "basic", icon: "🫁",
    nombre: "Pulmones de Acero",
    desc: "El equipo está preparado para correr los noventa minutos: presionar le cuesta menos que a cualquier otro.",
    momento: "Presionando igual de arriba en el minuto ochenta.",
    req: { nivel: 1 }, pos: { x: 190, y: 390 },
    // Decisión PO: abarata SOLO el acto de presionar, jamás la fatiga general
    // del partido (la economía de energía es el dial más sensible del juego).
    hooks: { pressStamina: { factor: 0.85 } },
  },
  {
    id: "vigilancia", filo: "press", rama: "respuesta", tier: "intermediate", icon: "🛡️",
    nombre: "Vigilancia Defensiva",
    desc: "Los centrales leen el balón largo antes de que salga: la espalda de la presión deja de ser una autopista.",
    momento: "El central cortando de cabeza el pelotazo que iba a partir al equipo.",
    req: { nivel: 3, previo: "pulmones" }, // AJENO: cubrirse cuesta
    pos: { x: 450, y: 390 },
    hooks: { breakawayGuard: { p: 0.40,
      texto: "El central LEYÓ el pelotazo a la espalda: paso adelante y corte de cabeza. La presión sigue viva." } },
  },
  {
    id: "repliegue", filo: "press", rama: "respuesta", tier: "advanced", icon: "🪃",
    nombre: "Repliegue",
    desc: "Cuando la presión se rompe, el equipo entero vuelve corriendo a plantarse: el contragolpe rival se encuentra con todos de vuelta. Cuesta piernas.",
    momento: "La contra rival muriendo contra once camisetas que llegaron antes.",
    req: { nivel: 6, previo: "vigilancia" }, // AJENO
    pos: { x: 710, y: 390 },
    hooks: { oppShotMalus: { seq: "transicion", bonus: -0.06,
      texto: "El repliegue llegó primero: la contra rival remató desde donde no se hace gol." } },
  },
  {
    id: "elasticidad", filo: "press", rama: "respuesta", tier: "master", icon: "👑",
    nombre: "Elasticidad",
    desc: "Replegarse ya no es rendirse: el bloque se estira, aguanta, y en cuanto toca la pelota vuelve a salir a presionar como si nada.",
    momento: "Repliegue, corte, y el equipo entero otra vez arriba en diez segundos.",
    req: { nivel: 10, previo: "repliegue" },
    pos: { x: 960, y: 390 },
    hooks: { chainOnContain: { to: "recuperacion", p: 0.32, bonus: 0.05,
      intro: p => `¡El acordeón se cierra! Contuvieron, y ${p.name} ya está otra vez encima del que la tiene.` } },
  },

  /* ---- Expansión · qué hacer con la pelota robada (triángulo, campo bajo
         que se abre en dos ideas opuestas: quedársela o salir disparado) ---- */
  {
    id: "directo", filo: "press", rama: "expansion", tier: "basic", icon: "🎯",
    nombre: "Directo",
    desc: "El primer pase tras el robo mira siempre hacia adelante: nada de asegurar, nada de recircular.",
    momento: "Robo y pase al espacio en el mismo movimiento.",
    req: { nivel: 1 }, pos: { x: 190, y: 545 },
    hooks: { skipToFinish: { of: "recuperacion", p: 0.26, bonus: 0.04,
      intro: p => `¡Sin pensarlo! El robo y el pase fueron la misma jugada: ${p.name} ya está de cara.` } },
  },
  {
    id: "egoistas", filo: "press", rama: "expansion", tier: "intermediate", icon: "🧊",
    nombre: "Egoístas",
    desc: "Robada la pelota, el equipo se la queda: el rival, que salió a buscarla, se queda esperando su turno.",
    momento: "Dos minutos sin que el rival la toque después del robo.",
    req: { nivel: 3, previo: "directo" },
    pos: { x: 400, y: 505 },
    hooks: { recycleBuild: { p: 0.35,
      texto: "La pelota es nuestra y se queda: el equipo la esconde, la jugada no muere." } },
  },
  {
    id: "contragolpistas", filo: "press", rama: "expansion", tier: "intermediate", icon: "🏇",
    nombre: "Contragolpistas",
    desc: "No hace falta robar arriba: cualquier pelota ganada en el medio o atrás también se convierte en carrera.",
    momento: "El rechace que cae al pie y ya son cuatro corriendo.",
    req: { nivel: 3, previo: "directo" },
    pos: { x: 400, y: 615 },
    hooks: { chainOnDuelFail: { to: "transicion", p: 0.28, bonus: 0.03,
      intro: p => `¡La segunda pelota fue nuestra! ${p.name} la engancha y sale disparado con el rival mal parado.` } },
  },
  {
    id: "pacientes", filo: "press", rama: "expansion", tier: "advanced", icon: "♟️",
    nombre: "Pacientes",
    desc: "Con la pelota robada, el equipo elige bien: los pases posteriores a una presión exitosa se juegan con cabeza fría.",
    momento: "El pase de gol dado sin apuro, con el rival todavía desordenado.",
    req: { nivel: 6, previo: "egoistas" },
    pos: { x: 620, y: 505 },
    hooks: { supportUpgrade: { bonus: 0.05,
      texto: "Cabeza fría: el pase busca al mejor ubicado de verdad, y lo encuentra libre." } },
  },
  {
    id: "tres_toques", filo: "press", rama: "expansion", tier: "advanced", icon: "🗡️",
    nombre: "Tres Toques",
    desc: "Del robo al remate en el menor número de pases posible: la jugada se resuelve antes de que el rival vuelva a estar en su sitio.",
    momento: "Robo, pase, gol: ocho segundos.",
    req: { nivel: 6, previo: "contragolpistas" },
    pos: { x: 620, y: 615 },
    // Afila el salto que abre Directo (mismo par que El Primer Pase / Tres Pases).
    hooks: { skipUpgrade: { bonus: 0.06,
      intro: p => `¡TRES TOQUES y afuera! El pase rompe la última línea y ${p.name} queda lanzado.` } },
  },
  {
    id: "frios", filo: "press", rama: "expansion", tier: "master", icon: "👑",
    nombre: "Fríos",
    desc: "Con el partido ganado, el equipo que presiona sabe también congelarlo: robar y devolverla atrás es una decisión, no una renuncia.",
    momento: "Los últimos diez minutos jugados en campo propio, con la ventaja intacta.",
    req: { nivel: 10, previo: "pacientes" }, // AJENO: congelar es elaborar
    pos: { x: 840, y: 490 },
    // RASGO DE ESTADO (el segundo del catálogo, tras Uno a Cero): SOLO con
    // ventaja en el marcador. Habilita una decisión NUEVA en el partido —
    // devolver la pelota al área propia para consumir reloj.
    // Sin `p`: no se sortea, la ELIGE el DT — una opción nueva del desenlace, disponible
    // desde el minuto 70 sin ir perdiendo (ver match/sequence-acts.canFreeze).
    hooks: { iceGame: {
      texto: "Fríos como el hielo: la devuelven atrás y el reloj empieza a jugar para nosotros." } },
  },
  {
    id: "calientes", filo: "press", rama: "expansion", tier: "master", icon: "👑",
    nombre: "Calientes",
    desc: "Robada la pelota, el equipo no la suelta más: el rival queda encerrado en su propio bloque y ya no sale de ahí.",
    momento: "El rival metido en su área durante diez minutos seguidos.",
    req: { nivel: 10, previo: "pacientes" },
    pos: { x: 1040, y: 500 },
    hooks: { oppPoolMod: { weights: { repliegue: 1.28 } } },
  },
  {
    id: "carrilenos", filo: "press", rama: "expansion", tier: "master", icon: "👑",
    nombre: "Carrileños",
    desc: "Los laterales son los que más corren del equipo: en cada contra hay siempre una banda libre y un centro esperando.",
    momento: "El centro del lateral que llegó desde su propia área.",
    req: { nivel: 10, previo: "tres_toques" },
    pos: { x: 840, y: 615 },
    hooks: { deepFinish: { of: "transicion", bonus: 0.06,
      texto: "El carrilero llegó desde atrás y puso el centro exacto: la contra terminó como se dibuja." } },
  },
  {
    id: "el_jaguar", filo: "press", rama: "expansion", tier: "master", icon: "👑",
    nombre: "El Jaguar",
    desc: "En cada contra hay un jugador que sale solo: el equipo lo busca siempre, y el mano a mano es el desenlace natural.",
    momento: "El delantero solo contra el arquero, otra vez.",
    req: { nivel: 10, previo: "tres_toques" },
    pos: { x: 1040, y: 615 },
    hooks: { accelFinish: { of: "transicion", p: 0.28, bonus: 0.06,
      intro: p => `¡EL JAGUAR se suelta! ${p.name} arranca solo y ya no lo agarra nadie: mano a mano.` } },
  },

  /* ================= POSESION — el arbol REDISENADO =================
     15 rasgos (rediseno del PO, 26-jul-2026). Sustituye al arbol de 9 del
     arco T1-T3. Igual que en Press, donde el concepto coincidia se reciclaron
     los hooks ya construidos: El Tercer Hombre conserva id, nombre, tier y
     hook — es el mismo rasgo de siempre, ahora dentro de otra estructura.

     LA DECISION DE DISENO DEL REDISENO (PO, sobre la mesa antes de construir):
     la rama Respuesta del PO responde a la PRESION ALTA, pero el matchup debil
     declarado de Posesion es el BLOQUE BAJO (philosophies.advertencia) y la
     neutralizacion de esa celda —el espejo de La Fortaleza del Bloque— vivia
     justamente ahi (Amplitud -> Cambio de Frente -> Abrir la Lata). Se resolvio
     MIGRANDO el anti-bloque a la Firma: Osciladores ES el cambio de frente, y
     carga la neutralizacion COMPLETA en un solo nodo. La Respuesta queda libre
     para lo que el PO quiso: aguantar la presion rival.

     Cuenta de la neutralizacion: la celda posesion|bloque vale 0.65 en
     circulacion y 1.30 en pelotazo (matriz F2). El stack viejo era
     0.65 x 1.25 x 1.23 ~ 1.00 y 1.30 x 0.77 ~ 1.00, repartido en 3 nodos
     (basic + int + adv = 3 PI). Osciladores lo hace de una: 1.54 y 0.77 — el
     mismo resultado exacto, al mismo costo (buen_pie + tercer_hombre +
     osciladores = 3 PI). Empareja el matchup; jamas lo invierte.

     La forma en la cancha: la Firma teje por el centro y se abre en dos
     acabados (empujarla o el mano a mano); la Respuesta baja al eje —es la
     salida desde el fondo—; la Expansion ocupa el campo rival y se bifurca en
     las dos maneras de romper una linea (por abajo o por arriba), que vuelven
     a juntarse en Polivalentes. */

  /* ---- Firma - perfeccionar la estructura ofensiva (circulo) ---- */
  {
    id: "buen_pie", filo: "posesion", rama: "firma", tier: "basic", icon: "\u{1F9B6}",
    nombre: "Buen Pie",
    desc: "El pase de seguridad deja de ser un tramite: el equipo lo da bien incluso con la presion encima, y una pelota que parecia perdida vuelve a ser suya.",
    momento: "El pase interceptado que igual termina en un pie propio.",
    req: { nivel: 1 }, pos: { x: 190, y: 200 },
    // El "+15% de precision" del diseno original seria un buff plano (ley del arco:
    // un rasgo NUNCA es una mejora estadistica). Se expresa como comportamiento:
    // el pase seguro que se corta no mata la jugada — la posesion se recicla.
    hooks: { recycleBuild: { p: 0.35,
      texto: "Buen pie: la pelota rebota y vuelve a ser nuestra — la jugada no se muere ahi." } },
  },
  {
    id: "tercer_hombre", filo: "posesion", rama: "firma", tier: "intermediate", icon: "\u{1F53A}",
    nombre: "El Tercer Hombre",
    desc: "Las combinaciones de tres jugadores rompen lineas y aseguran la salida bajo presion: siempre aparece uno mas para recibir.",
    momento: "La pared que deja atras a toda la primera linea de presion.",
    req: { nivel: 3, previo: "buen_pie" },
    pos: { x: 450, y: 200 },
    // RECICLADO INTEGRO del arbol anterior: mismo id, nombre, tier y hook.
    hooks: { playoutRescue: { p: 0.40,
      texto: "El tercer hombre salva la salida: el pase interceptado encuentra al desmarcado y el regalo no existe." } },
  },
  {
    id: "pitagoricos", filo: "posesion", rama: "firma", tier: "advanced", icon: "\u{1F4D0}",
    nombre: "Pitagoricos",
    desc: "El equipo triangula con los ojos cerrados: cuando hay que elegir a quien buscar, siempre encuentra al que de verdad esta mejor parado.",
    momento: "La triangulacion que deja al mejor ubicado solo frente al arco.",
    req: { nivel: 6, previo: "tercer_hombre" },
    pos: { x: 710, y: 128 },
    hooks: { supportUpgrade: { bonus: 0.05,
      texto: "Geometria pura: el triangulo encuentra al mejor ubicado de verdad, no al mas cercano." } },
  },
  {
    id: "osciladores", filo: "posesion", rama: "firma", tier: "advanced", icon: "\u{1F30A}",
    nombre: "Osciladores",
    desc: "El equipo mueve el balon de un lado al otro hasta que la presion rival se parte: cada cambio de orientacion deja la jauria corriendo el carril equivocado.",
    momento: "El cambio de cuarenta metros con los tres que venian a presionar mirando como pasa por arriba.",
    req: { nivel: 6, previo: "tercer_hombre" }, // AJENO: el cambio largo ES juego directo
    pos: { x: 710, y: 275 },
    // LA NEUTRALIZACION del matchup debil de la Posesion. RE-APUNTADA en el sprint del
    // Rival que Decide: su presa vieja (el Bloque) dejo de ser una amenaza cuando el
    // ciclo dio vuelta esa celda —ahora la Posesion GANA ese cruce— asi que el nodo
    // apunta al depredador nuevo: el High Press. 0.72 x 1.39 ~ 1.00, la circulacion
    // vuelve a rendir contra la presion. A TABLAS, nunca invertido: sigue siendo el
    // espejo exacto de La Fortaleza Inexpugnable, que si conservo su celda.
    // El concepto no se forzo: cambiar de orientacion ES la respuesta clasica a un
    // pressing orientado, y el nombre le queda mejor ahora que antes.
    hooks: { poolMod: { vsFilo: "press", weights: { circulacion: 1.39 } } },
  },
  {
    id: "maquina_colectiva", filo: "posesion", rama: "firma", tier: "master", icon: "\u{1F451}",
    nombre: "La Maquina Colectiva",
    desc: "Once jugadores moviendose como una sola pieza. El rival deja de disputar el partido: corre detras de una pelota que nunca le pertenece.",
    momento: "El gol a puerta vacia tras treinta pases, empujandola sin oposicion.",
    req: { nivel: 10, previo: "pitagoricos" },
    pos: { x: 960, y: 128 },
    hooks: {
      // Hereda el hook del viejo Master (La Pelota es Nuestra): el reparto de
      // iniciativa se inclina de raiz y el pool rival se estrangula por falta de balon.
      masterPosesion: { shareShift: 0.06 },
      // La circulación larga deja la pelota servida: el remate llega casi hecho.
      tapIn: { zone: [4, 5], p: 0.38, bonus: 0.22, texto: "La máquina la dejó servida: solo hay que empujarla." },
    },
  },
  {
    id: "hombre_libre", filo: "posesion", rama: "firma", tier: "master", icon: "\u{1F451}",
    nombre: "Hombre Libre",
    desc: "Despues de tanto tejer, siempre termina apareciendo uno solo. El equipo lo encuentra, y lo que sigue es el delantero contra el arquero.",
    momento: "Veinte pases y el nueve de cara al arquero.",
    req: { nivel: 10, previo: "osciladores" },
    pos: { x: 960, y: 275 },
    hooks: { accelFinish: { of: "circulacion", p: 0.30, bonus: 0.06,
      intro: p => `Ahi esta el hombre libre: ${p.name} se suelta de la marca y queda de cara al arquero.` } },
  },

  /* ---- Respuesta - neutralizar cualquier intento del rival (cuadrado, eje) ---- */
  {
    id: "la_trampa", filo: "posesion", rama: "respuesta", tier: "basic", icon: "\u{1FAA4}",
    nombre: "La Trampa",
    desc: "El equipo puede devolver la pelota atras a proposito, para sacar al rival de su bloque y volver a empezar el ataque desde otro sitio.",
    momento: "El rival saliendo a buscarla y dejando el espacio que se estaba negando.",
    req: { nivel: 1 }, pos: { x: 190, y: 390 },
    hooks: {
      // Retroceder la posesion aleja el robo del arco propio: cuando el rival la
      // recupera, su ataque nace lejos e incomodo.
      oppShotMalus: { seq: "recuperacion", bonus: -0.06,
        texto: "Mordieron el anzuelo y salieron: cuando la recuperan, estan lejos y el remate no asusta." },
      // Sin `p`: esta no se sortea, la ELIGE el DT — es una opción nueva del acto de
      // construcción, una sola vez por secuencia (ver match/sequence-acts).
      backPass: { zone: [3, 5], bonus: 0.06, texto: "El equipo la devuelve atrás y vuelve a armar: el rival tiene que salir de su bloque." },
    },
  },
  {
    id: "salida_lavolpiana", filo: "posesion", rama: "respuesta", tier: "intermediate", icon: "\u{1F9E9}",
    nombre: "Salida Lavolpiana",
    desc: "Contra la presion alta, un mediocampista baja entre los centrales: de golpe hay un hombre mas para salir y la primera linea rival queda sobrando.",
    momento: "El cinco entre los centrales y la presion rival saltando al vacio.",
    req: { nivel: 3, previo: "la_trampa" },
    pos: { x: 450, y: 390 },
    hooks: { variantSwitch: { of: "circulacion", vsFilo: "press", p: 0.30, bonus: 0.07,
      intro: p => `SALIDA LAVOLPIANA: ${p.name} se descuelga entre los centrales y la presion rival ya no alcanza.` } },
  },
  {
    id: "la_frontera", filo: "posesion", rama: "respuesta", tier: "advanced", icon: "\u{1F6A9}",
    nombre: "La Frontera",
    desc: "La linea sube y se sostiene: cuando la pierden arriba y el rival busca la espalda, el equipo levanta la mano en bloque. Exige jugar con el BLOQUE ALTO: sin linea adelantada no hay trampa que tender.",
    momento: "El contragolpe rival muriendo en offside con toda la linea levantando el brazo.",
    req: { nivel: 6, previo: "salida_lavolpiana" },
    pos: { x: 710, y: 390 },
    hooks: {
      // El balon a la espalda es exactamente lo que la trampa del offside anula:
      // el pelotazo ambiente muere leido por la linea.
      breakawayGuard: { p: 0.40,
        texto: "La linea sube junta y lo deja en offside: la frontera aguanto y el contragolpe no existio." },
      offsideTrap: { minHeight: 4, p: 0.50, texto: "¡Trampa del offside! La línea sube junta, el brazo en alto y la contra queda anulada." },
    },
  },
  {
    id: "rest_defense", filo: "posesion", rama: "respuesta", tier: "master", icon: "\u{1F451}",
    nombre: "Rest Defense",
    desc: "Incluso volcado en campo rival el equipo deja el ataque preparado para defender: la transicion del rival se apaga antes de cruzar la mitad.",
    momento: "El rival recuperando la pelota y no pudiendo dar dos pases seguidos.",
    req: { nivel: 10, previo: "la_frontera" },
    pos: { x: 960, y: 390 },
    // Hereda el hook del Rest Defense que vivia en el Press: el concepto —tener el
    // ataque ordenado para defender— pertenece a la filosofia que ATACA con la pelota.
    hooks: { oppLoseActs: { zone: [2, 5], p: 0.36,
      texto: "El resto defensivo estaba armado: recuperaron, miraron arriba y no habia a quien pasarla." } },
  },

  /* ---- Expansion - transformar el dominio territorial en ocasiones (triangulo) ---- */
  {
    id: "el_rondo", filo: "posesion", rama: "expansion", tier: "basic", icon: "\u{1F504}",
    nombre: "El Rondo",
    desc: "El equipo instala el rondo en campo rival y no lo suelta: el partido entero se juega donde el rival no quiere, y las piernas que corren detras no son las nuestras.",
    momento: "Diez minutos seguidos de toque en campo rival.",
    req: { nivel: 1 }, pos: { x: 190, y: 545 },
    hooks: {
      // El rondo instala el partido en la circulacion: el pool se inclina hacia el
      // futbol que el rasgo describe (no es un buff, es OTRO partido).
      poolMod: { weights: { circulacion: 1.20 } },
      // Acelera el drenaje de energía del once rival (medical.drainOppEnergy).
      oppStamina: { factor: 1.10 },
    },
  },
  {
    id: "profundos", filo: "posesion", rama: "expansion", tier: "intermediate", icon: "\u{1F5E1}",
    nombre: "Profundos",
    desc: "Tanto toque tiene un para que: cuando la linea rival se descuida un segundo, el pase ya salio hacia el espacio.",
    momento: "El pase filtrado que parte a la defensa despues de veinte toques.",
    req: { nivel: 3, previo: "el_rondo" },
    pos: { x: 450, y: 545 },
    hooks: { skipToFinish: { of: "circulacion", p: 0.26, bonus: 0.04,
      intro: p => `Se acabo la paciencia: ${p.name} la pincha al espacio y saltea todo el tramite.` } },
  },
  {
    id: "sorpresivos", filo: "posesion", rama: "expansion", tier: "advanced", icon: "\u{1FA82}",
    nombre: "Sorpresivos",
    desc: "El equipo que toca y toca de pronto la manda por arriba: nadie lo espera, y la linea rival queda partida por el aire.",
    momento: "El pelotazo aereo tras cuarenta toques, con la defensa adelantada.",
    req: { nivel: 6, previo: "profundos" },
    pos: { x: 710, y: 505 },
    hooks: { variantDeep: { of: "circulacion", p: 0.30, bonus: 0.06,
      intro: p => `Sorpresa: tras tanto toque ${p.name} la manda por ARRIBA y la linea rival queda partida.` } },
  },
  {
    id: "desesperantes", filo: "posesion", rama: "expansion", tier: "advanced", icon: "\u{1F624}",
    nombre: "Desesperantes",
    desc: "Perseguir la pelota sin tocarla enloquece a cualquiera. El rival termina entrando mal, y eso se cobra en tiros libres y en tarjetas.",
    momento: "El penal en el minuto ochenta tras diez minutos de sitio.",
    req: { nivel: 6, previo: "profundos" },
    pos: { x: 710, y: 615 },
    // Migracion F2: el 4o compas de la sinfonia + el penal profundo. La desesperacion
    // acumulada ES el rasgo declarado de la filosofia (philosophies.rasgo) — vive aca.
    hooks: { deepPosesion: {} },
  },
  {
    id: "polivalentes", filo: "posesion", rama: "expansion", tier: "master", icon: "\u{1F451}",
    nombre: "Polivalentes",
    desc: "Delanteros que arman y mediocampistas que atacan: nadie ocupa el puesto que dice su camiseta, y la defensa rival ya no sabe a quien seguir.",
    momento: "El mediocampista definiendo de nueve mientras el nueve dio el pase.",
    // LA CONVERGENCIA de la rama (decision PO): basta con haber profundizado por
    // CUALQUIERA de las dos maneras de romper una linea — por abajo o por arriba.
    req: { nivel: 10, alguno: ["sorpresivos", "desesperantes"] },
    pos: { x: 960, y: 560 },
    // Hereda el hook del viejo Juego Posicional: siempre hay un pasillo y siempre
    // hay un pie — con todos jugando de todo, la posesion directamente no muere.
    hooks: { recycleUpgrade: { p: 0.60, max: 2,
      texto: "Todos juegan de todo: aparece un pasillo donde no habia nadie y la posesion no muere." } },
  },

  /* ================= 🧱 BLOQUE BAJO — el árbol REDISEÑADO =================
     15 rasgos (rediseño del PO, 30-jul-2026). Sustituye al árbol de 9 del arco
     T1-T3, con el mismo criterio que Press y Posesión: donde el concepto
     coincidía se RECICLARON los hooks ya construidos (la jaula que empuja el
     remate afuera, el oficio que corta el partido, la fortaleza profunda, el
     córner defendido que lanza, la cabeza de playa, el balón parado ensayado,
     la trampa que convierte el repliegue) y el resto son nodos nuevos.

     La forma en la cancha es la de un BLOQUE BAJO de verdad: todo nace pegado
     al área propia y solo la Expansión cruza hacia el campo rival.
       Firma      (arriba)  el área como fortaleza: dos básicos que se cierran
                            juntos (compactar por dentro y poblar la zona)
                            convergen en el Área Blindada, que se abre en las
                            dos maneras de sostenerla —escalonarse o amurallarse—
                            y las dos vuelven a juntarse en la Maestría.
       Respuesta  (centro)  sobrevivir al asedio: ganar por arriba, quedarse con
                            el rechace, y las dos maneras de sacar la pelota de
                            ahí (reventarla o mandarla al área rival).
       Expansión  (abajo)   las armas del que defiende: el balón parado y la
                            salida rápida, en línea recta hasta el contraataque.

     LAS DECISIONES DE DISEÑO (PO, 30-jul-2026):
     1. MURALLA no da "+2 Defensa": la ley del arco prohíbe la mejora estadística
        plana. Se expresa por el canal de siempre (la SITUACIÓN del remate rival),
        como el viejo Uno a Cero — pero con su condición propia: empatado O
        ganando, no solo ganando.
     2. La NEUTRALIZACIÓN del sitio de Posesión (era La Fortaleza, avanzada) se
        mudó a Fortaleza Inexpugnable: "el rival no genera ocasión clara" ES el
        asedio neutralizado. Sube de precio (nivel 6 → 10) a cambio de que la
        Maestría de la Firma signifique algo contra su peor cruce.
     3. Las convergencias: Y en Área Blindada (los dos básicos son baratos y la
        rama se abre con los dos puestos), O en las dos Maestrías (como en Press:
        cualquiera de los dos caminos llega). Camino mínimo al primer Master: 5 PI. */

  /* ---- Firma · el área como fortaleza (círculo, campo propio) ---- */
  {
    id: "compactacion", filo: "bloque", rama: "firma", tier: "basic", icon: "🏰",
    nombre: "Compactación",
    desc: "El bloque se cierra y le tapa el carril del medio: por el centro no se pasa, y al rival solo le queda dar la vuelta por afuera.",
    momento: "El rival dando vueltas por afuera sin encontrar la puerta.",
    req: { nivel: 1 }, pos: { x: 190, y: 140 },
    // RECICLADO de Jaula Central: mismo hook, mismo concepto (la jaula que invita
    // a la banda — el remate llega incómodo, forzado desde afuera).
    hooks: { oppShotMalus: { seq: "repliegue", bonus: -0.05,
      texto: "El centro está clausurado: el remate llegó incómodo, forzado desde afuera." } },
  },
  {
    id: "sobrepoblado", filo: "bloque", rama: "firma", tier: "basic", icon: "🕸️",
    nombre: "Sobrepoblado",
    desc: "Hay siempre una pierna más de la que el rival contaba: los pases entre líneas se topan con alguien y el ataque muere antes de nacer.",
    momento: "El pase rival que no llega a destino tres veces seguidas.",
    req: { nivel: 1 }, pos: { x: 190, y: 250 },
    // RECICLADO de Oficio de Trinchera: la secuencia rival pierde continuidad —
    // acá el motivo es la intercepción, no la falta táctica (el texto lo dice).
    hooks: { oppLoseActs: { p: 0.25,
      texto: "Zona sobrepoblada: el pase entre líneas se topa con una pierna y el ataque muere en la nada." } },
  },
  {
    id: "area_blindada", filo: "bloque", rama: "firma", tier: "intermediate", icon: "🗿",
    nombre: "Área Blindada",
    desc: "Dentro del área manda el equipo: cada centro se come, cada remate sale a destiempo y el rival termina buscando desde afuera.",
    momento: "El despeje número diez del central y la contra que nace de ahí.",
    // LA CONVERGENCIA Y (decisión PO): cerrar el centro y poblar la zona son las
    // dos mitades de la misma idea — el área se blinda con las dos, no con una.
    req: { nivel: 3, todos: ["compactacion", "sobrepoblado"] },
    pos: { x: 450, y: 195 },
    // Hereda deepBloque de Dueños del Área: LA MIGRACIÓN F2 del Bloque (la fortaleza
    // PROFUNDA — deepContain + convertDeep, lo que Consolidada regalaba). Y `boxShield`
    // es el nodo propiamente dicho: el remate rival DENTRO del área llega peor.
    hooks: {
      deepBloque: {},
      boxShield: { bonus: -0.05,
        texto: "El área blindada: le achicaron el ángulo y el remate salió sin destino." },
    },
  },
  {
    id: "defensa_escalonada", filo: "bloque", rama: "firma", tier: "advanced", icon: "🪜",
    nombre: "Defensa Escalonada",
    desc: "Las líneas se escalonan: al que rompe la primera lo espera la segunda. El rival tarda medio partido en entender por dónde entrar.",
    momento: "La primera llegada rival muriendo contra una línea que ya estaba ahí.",
    req: { nivel: 6, previo: "area_blindada" },
    pos: { x: 710, y: 125 },
    // Rasgo de MOMENTO del partido: la PRIMERA ocasión rival del partido, la que
    // llega con el equipo todavía sin leer al rival, es la que el escalonamiento
    // paga. Se consume una vez por partido (trait-hooks lo marca).
    hooks: { firstChanceGuard: { bonus: -0.06,
      texto: "Primera llegada del partido y ya estaban escalonados: el que rompió la primera línea se encontró con la segunda." } },
  },
  {
    id: "muralla", filo: "bloque", rama: "firma", tier: "advanced", icon: "🧱",
    nombre: "Muralla",
    desc: "Mientras el marcador no vaya en contra, la zaga juega con una convicción distinta: nadie se saca la camiseta de encima y no pasa nadie.",
    momento: "Los últimos veinte minutos defendiendo el resultado sin conceder una sola llegada limpia.",
    req: { nivel: 6, previo: "area_blindada" },
    pos: { x: 710, y: 245 },
    // Rasgo de ESTADO (decisión PO 30-jul): NO es "+2 Defensa" —la ley del arco
    // prohíbe el buff plano— sino el canal de siempre: con el marcador a favor o
    // empatado, la situación del remate rival empeora. Perdiendo no aporta nada.
    hooks: { wall: { bonus: -0.05,
      texto: "La muralla no se mueve: mientras el resultado aguante, por acá no pasa nadie." } },
  },
  {
    id: "fortaleza_inexpugnable", filo: "bloque", rama: "firma", tier: "master", icon: "👑",
    nombre: "Fortaleza Inexpugnable",
    desc: "El rival puede tener la pelota todo el partido: no va a tener una sola ocasión clara. Ataca, ataca, y termina discutiendo entre ellos.",
    momento: "El delantero rival discutiendo con sus compañeros tras la enésima llegada muerta.",
    // LA CONVERGENCIA O (decisión PO): se llega desde cualquiera de las dos maneras
    // de sostener el área — escalonarse o amurallarse.
    req: { nivel: 10, alguno: ["defensa_escalonada", "muralla"] },
    pos: { x: 960, y: 185 },
    hooks: {
      // LA OCASIÓN CLARA que no ocurre: el mano a mano y la contra tras mi pérdida
      // mueren contra el que llegó a cubrir. Es el hook propio del Master.
      clearChanceGuard: { p: 0.25,
        texto: "¡No hay ocasión clara contra esta fortaleza! Apareció el que tenía que aparecer y la jugada murió sin remate." },
      // RECICLADO de La Fortaleza (avanzada del árbol viejo): la NEUTRALIZACIÓN del
      // sitio —la celda opp bloque|posesion vuelve a tablas (1.35 × 0.74 ≈ 1.0)— y la
      // FRUSTRACIÓN acumulada, que degrada el remate rival por cada ataque muerto.
      oppPoolMod: { vsFilo: "posesion", weights: { repliegue: 0.74 } },
      frustration: { perShot: 0.02, cap: 0.08,
        texto: "La frustración rival se palpa: cuanto más ataca sin premio, peor remata — la muralla come moral." },
    },
  },

  /* ---- Respuesta · sobrevivir al asedio (cuadrado, eje del área propia) ---- */
  {
    id: "dominio_aereo", filo: "bloque", rama: "respuesta", tier: "basic", icon: "🦅",
    nombre: "Dominio Aéreo",
    desc: "Todo lo que entra por el aire lo gana el equipo: centros, córners y pelotas divididas terminan siempre en una cabeza propia.",
    momento: "El central ganando el décimo cabezazo del partido.",
    req: { nivel: 1 }, pos: { x: 190, y: 395 },
    hooks: { aerialDef: { bonus: -0.05,
      texto: "Por arriba no se les gana: el cabezazo rival salió forzado, con la zaga encima." } },
  },
  {
    id: "atentos", filo: "bloque", rama: "respuesta", tier: "intermediate", icon: "👀",
    nombre: "Atentos",
    desc: "Tras cada atajada y cada bloqueo, la segunda pelota es del equipo: nadie mira la jugada, todos van al rechace.",
    momento: "El rechace del córner que ya es un pelotazo nuestro.",
    req: { nivel: 3, previo: "dominio_aereo" },
    pos: { x: 450, y: 380 },
    // RECICLADO doble — los DOS canales por los que se concede un rebote, que acá
    // dejan de concederse: el córner rival defendido (Dueños del Área) y el duelo
    // aéreo perdido (Segunda Jugada). En los dos casos la segunda pelota es MÍA.
    hooks: {
      chainOnDefendSp: { to: "pelotazo", p: 0.30, bonus: 0.03,
        intro: p => `¡Atentos al rechace! La segunda pelota es nuestra y ${p.name} ya tiene el pelotazo armado.` },
      chainOnDuelFail: { to: "pelotazo", p: 0.30, bonus: 0.02,
        intro: p => `¡Atentos! El rechace del duelo cae al pie y ${p.name} vuelve a la carga.` },
    },
  },
  {
    id: "pelotazo_fuera", filo: "bloque", rama: "respuesta", tier: "advanced", icon: "🚀",
    nombre: "Pelotazo",
    desc: "Desbloquea la jugada Reventar el Balón: cuando el peligro aprieta, la zaga la manda lejos y obliga al rival a empezar todo de nuevo desde atrás.",
    momento: "El pelotazo a la tribuna que apaga el incendio y hace bramar al estadio.",
    req: { nivel: 6, previo: "atentos" },
    pos: { x: 710, y: 360 },
    // LA JUGADA NUEVA (como el Retroceso de La Trampa o el Congelar de Fríos): una
    // tercera opción del acto de contención, que NO se sortea — la elige el DT. Mata
    // la jugada rival sin remate, y `p` es su precio: a veces el despeje sale al córner.
    hooks: { clearBall: { zone: [1, 3], p: 0.30,
      texto: "¡A REVENTARLA! La zaga la manda lejos del área y el rival tiene que armar todo otra vez desde atrás." } },
  },
  {
    id: "al_area", filo: "bloque", rama: "respuesta", tier: "advanced", icon: "🎪",
    nombre: "Al Área",
    desc: "Desbloquea la jugada Saque Largo al Área: los saques de banda en campo rival dejan de ser un trámite y se convierten en un envío al área.",
    momento: "El saque de banda que termina en un córner a favor.",
    req: { nivel: 6, previo: "atentos" },
    pos: { x: 710, y: 480 },
    // RECICLADO de Cabeza de Playa: el pelotazo que muere sin gol no se pierde — la
    // pelota sale por el lateral y el saque largo vuelve a poblar el área (balón
    // parado encadenado). El ciclo del Bloque: despeje → pelotazo → área → parado.
    hooks: { beachhead: { zone: [4, 5], p: 0.42,
      texto: "¡Saque largo AL ÁREA! La pelota salió por el lateral y el envío vuelve a llenar el área rival." } },
  },
  {
    id: "hombre_objetivo", filo: "bloque", rama: "respuesta", tier: "master", icon: "👑",
    nombre: "Hombre Objetivo",
    desc: "Desbloquea la jugada Pivoteo al Área: el nueve ya no solo cabecea, también la baja para el que llega de frente al arco.",
    momento: "El nueve aguantando de espaldas y la descarga que termina en gol.",
    // LA CONVERGENCIA O: cualquiera de las dos maneras de sacar la pelota del área
    // propia habilita al hombre objetivo del otro lado de la cancha.
    req: { nivel: 10, alguno: ["pelotazo_fuera", "al_area"] },
    pos: { x: 960, y: 420 },
    // La otra JUGADA NUEVA: tercera opción del duelo aéreo (tampoco se sortea). El
    // que gana por arriba no remata: descarga al mejor rematador, que llega de frente.
    hooks: { pivot: { zone: [4, 5], bonus: 0.08,
      texto: "El hombre objetivo la aguanta de espaldas y la BAJA: llega uno de frente al arco." } },
  },

  /* ---- Expansión · las armas del que defiende (triángulo, campo rival) ---- */
  {
    id: "especialistas", filo: "bloque", rama: "expansion", tier: "basic", icon: "📐",
    nombre: "Especialistas",
    desc: "El equipo tiene pateadores de verdad: cada centro de pelota quieta cae donde tiene que caer.",
    momento: "El córner que cae clavado en la cabeza del nueve.",
    req: { nivel: 1 }, pos: { x: 280, y: 600 },
    // RECICLADO de Pelota Parada Ensayada, partido en dos: acá vive la EJECUCIÓN
    // (poolMult 1 = no toca el pool), y el pool lo mueve Estrategia Ensayada.
    hooks: { setpieceRehearsed: { bonus: 0.06, poolMult: 1,
      texto: "Esto lo patea un especialista: la pelota quieta cae exactamente donde se ensayó." } },
  },
  {
    id: "estrategia_ensayada", filo: "bloque", rama: "expansion", tier: "intermediate", icon: "📋",
    nombre: "Estrategia Ensayada",
    desc: "La pizarra del balón parado se ensaya toda la semana: córners y tiros libres laterales terminan en remate mucho más seguido.",
    momento: "Tres córners seguidos que terminan los tres en remate.",
    req: { nivel: 3, previo: "especialistas" },
    pos: { x: 490, y: 600 },
    // El balón parado propio SALE más seguido: se apila sobre el ×1.3 incondicional
    // del Bloque (su arma declarada), no lo reemplaza.
    hooks: { poolMod: { weights: { balon_parado: 1.15 } } },
  },
  {
    id: "salida_vertical", filo: "bloque", rama: "expansion", tier: "advanced", icon: "📈",
    nombre: "Salida Vertical",
    desc: "Recuperada la pelota, el equipo no la esconde: la primera intención es siempre hacia adelante, y esos pases salen.",
    momento: "El pase vertical inmediato tras el robo, con el rival todavía volviendo.",
    req: { nivel: 6, previo: "estrategia_ensayada" },
    pos: { x: 720, y: 600 },
    hooks: { transitionPass: { bonus: 0.05,
      texto: "Salida vertical: la pelota sale limpia hacia adelante antes de que el rival vuelva a su sitio." } },
  },
  {
    id: "contragolpe_letal", filo: "bloque", rama: "expansion", tier: "master", icon: "👑",
    nombre: "Contragolpe Letal",
    desc: "Desbloquea la jugada Contraataque: cada pelota recuperada en campo propio puede lanzarse de inmediato, sin pasar por armar el ataque.",
    momento: "El robo en la puerta del área propia que termina en gol en la de enfrente.",
    req: { nivel: 10, previo: "salida_vertical" },
    pos: { x: 960, y: 600 },
    // RECICLADO de Tender la Trampa (Contragolpe): el repliegue contenido CONVIERTE
    // en transición mía — el patrón def→of, acá como premio de la Maestría.
    hooks: { chainOnContain: { to: "transicion", p: 0.30, bonus: 0.04,
      intro: p => `¡CONTRAATAQUE! Recuperaron en campo propio y ${p.name} sale disparado sin pedirle permiso a nadie.` } },
  },

  /* ================= ⚡ CONTRAGOLPE — el árbol REDISEÑADO =================
     16 rasgos (rediseño del PO, 30-jul-2026). El ÚLTIMO de los cuatro: con este,
     las 4 filosofías son grafos y la grilla histórica de 3×3 queda sin usuarios.
     Mismo criterio que los otros tres: los 9 viejos se retiran y sus hooks se
     mudan al nodo nuevo donde el concepto coincide (Tres Pases→Ataque Relámpago,
     Correr en Manada→Ataque al Espacio, Superioridad + A Campo Abierto→El
     Enjambre, La Trampa Cerrada→Ataque Relámpago (deepContra), La Invitación→El
     Anzuelo, Contragolpe Total→repartido entre Defensa Intencionada y Saque
     Rápido, Tender la Trampa→ya se había mudado al Bloque como su Maestría).

     La forma en la cancha: LAS TRES RAMAS SE BIFURCAN Y VUELVEN A JUNTARSE —
     es el único árbol donde las tres avanzadas piden DOS padres (convergencia Y).
       Firma      (arriba)  la contra misma: el primer pase abre en las dos maneras
                            de correrla (con el pase o con el desmarque), que se
                            juntan en el Ataque Relámpago y se bifurcan otra vez en
                            los dos desenlaces (el duelo o la avalancha).
       Respuesta  (centro)  el precio de correr: pulmón, y las dos maneras de
                            fabricarse la contra (despejar de cabeza o tender el
                            anzuelo con la pelota).
       Expansión  (abajo)   de dónde NACE la contra: aguantar, el balón aéreo y el
                            reinicio rápido, hasta la jugada de finalización.

     DECISIONES DE DISEÑO (PO, 30-jul-2026):
     1. DOS RENOMBRES para no duplicar nombres del juego: "Salida Vertical" (que ya
        es la avanzada de Expansión del Bloque) pasó a PRIMERA MARCHA, y "Pulmones
        de Acero" (que ya es la básica de Respuesta del Press) pasó a SEGUNDO AIRE.
     2. LOS DOS FÍSICOS SON ADYACENTES, Y ES DEUDA DECLARADA: correr una contra hoy
        no cuesta energía (el único gasto que el DT controla es el botón de presión),
        así que Anaeróbicos abarata ESE gasto y Segundo Aire sostiene al que corre
        fundido. ⚠️ El sprint de SITUACIONES DE JUEGO construye el costo físico de
        la contra: cuando exista, los dos rasgos se reescriben contra él.
     3. El nodo [Intermedia] que faltaba en la Expansión es SAQUE RÁPIDO (el tercer
        origen: aéreo · reinicio · aguante).
     4. "En Bloque Bajo" (Estóicos) = cuando el equipo se REPLIEGA, no la filosofía
        homónima ni la mentalidad: se expresa en el acto de contención. */

  /* ---- Firma · la contra misma (círculo, del robo al arco) ---- */
  {
    id: "primer_pase", filo: "contra", rama: "firma", tier: "basic", icon: "📡",
    nombre: "Primer Pase",
    desc: "El primer pase tras recuperar la pelota no se piensa: sale hacia adelante y sale bien. La contra nace ya lanzada.",
    momento: "El pase que sale en el mismo movimiento del robo.",
    req: { nivel: 1 }, pos: { x: 190, y: 150 },
    // `act: "first"` — solo el primer acto de la contra (el pase que la lanza). Los
    // transitionPass se APILAN: el motor suma los de todos los rasgos que los traigan.
    hooks: { transitionPass: { act: "first", bonus: 0.05,
      texto: "El primer pase salió al toque: la contra nace lanzada, sin escala de seguridad." } },
  },
  {
    id: "primera_marcha", filo: "contra", rama: "firma", tier: "intermediate", icon: "📈",
    nombre: "Primera Marcha",
    desc: "Ya en carrera, el equipo se entiende: los pases de la contra encuentran siempre al que va lanzado.",
    momento: "Tres pases a toda velocidad sin que la pelota toque el piso dos veces.",
    // RENOMBRADO (era "Salida Vertical" en el diseño): ese nombre ya es de la avanzada
    // de Expansión del Bloque bajo, y encima con este mismo hook.
    req: { nivel: 3, previo: "primer_pase" },
    pos: { x: 450, y: 125 },
    hooks: { transitionPass: { bonus: 0.05,
      texto: "Primera marcha metida: la contra circula a toda velocidad y ningún pase se cae." } },
  },
  {
    id: "ataque_espacio", filo: "contra", rama: "firma", tier: "intermediate", icon: "🏃",
    nombre: "Ataque al Espacio",
    desc: "Cuando uno arranca, arrancan tres: el que conduce siempre tiene a quién buscar en carrera.",
    momento: "Tres contra dos y definición cruzada.",
    req: { nivel: 3, previo: "primer_pase" },
    pos: { x: 450, y: 250 },
    // RECICLADO de Correr en Manada: el "buscar al mejor ubicado" de la contra encuentra
    // superioridad de verdad — acá el relato es el DESMARQUE, que es lo que lo produce.
    hooks: { finishSupport: { of: "transicion", bonus: 0.06,
      texto: "Los desmarques al espacio parten a la defensa: hay dos camisetas libres esperando el pase." } },
  },
  {
    id: "ataque_relampago", filo: "contra", rama: "firma", tier: "advanced", icon: "⚡",
    nombre: "Ataque Relámpago",
    desc: "Del robo al remate en el menor número de pases posible: la jugada se resuelve antes de que el rival vuelva a estar en su sitio.",
    momento: "Robo, pase, gol: ocho segundos.",
    // LA CONVERGENCIA Y: correr la contra bien es pase Y desmarque, las dos cosas.
    req: { nivel: 6, todos: ["primera_marcha", "ataque_espacio"] },
    pos: { x: 700, y: 190 },
    hooks: {
      // RECICLADO de Tres Pases o Nada: la contra puede nacer directamente en su desenlace.
      skipToFinish: { of: "transicion", p: 0.30, bonus: 0.05,
        intro: p => `¡Sin escalas! ${p.name} sale disparado: la contra se juega a UNA.` },
      // Y hereda deepContra de La Trampa Cerrada: LA MIGRACIÓN F2 del Contragolpe (el
      // primer tramo del contragolpe letal deja al rival AÚN más partido).
      deepContra: {},
    },
  },
  {
    id: "duelista", filo: "contra", rama: "firma", tier: "master", icon: "👑",
    nombre: "Duelista",
    desc: "En cada contra hay un jugador que se suelta solo: el equipo lo busca siempre, y el mano a mano es el desenlace natural.",
    momento: "El delantero solo contra el arquero, otra vez.",
    req: { nivel: 10, previo: "ataque_relampago" },
    pos: { x: 940, y: 130 },
    // RECICLADO de El Jaguar (Press): el desenlace de la contra se acelera y termina en
    // mano a mano. OJO en builds híbridas: es el mismo hook que El Jaguar y solo aplica
    // el de una filosofía (hookOf resuelve por familia y las dos son "transicion").
    hooks: { accelFinish: { of: "transicion", p: 0.30, bonus: 0.07,
      intro: p => `¡${p.name} se suelta de la marca y ya no lo agarra nadie: MANO A MANO con el arquero!` } },
  },
  {
    id: "el_enjambre", filo: "contra", rama: "firma", tier: "master", icon: "👑",
    nombre: "El Enjambre",
    desc: "La contra ya no la corren dos: la corren cinco. Cuando la pelota llega al área, la defensa rival no sabe a quién marcar.",
    momento: "Cuatro camisetas cruzando mediocampo a la vez.",
    req: { nivel: 10, previo: "ataque_relampago" },
    pos: { x: 940, y: 265 },
    hooks: {
      // RECICLADO de Superioridad Numérica: el pase elige al MEJOR ubicado de verdad…
      supportUpgrade: { bonus: 0.05,
        texto: "El enjambre llegó entero: el pase encuentra al mejor rematador completamente libre." },
      // …y de A Campo Abierto: toda la contra llega en oleada.
      avalancha: { bonus: 0.06,
        texto: "AVALANCHA a campo abierto: la contra llega en oleada y la defensa no sabe a quién marcar." },
    },
  },

  /* ---- Respuesta · el precio de correr, y cómo fabricarse la contra (cuadrado) ---- */
  {
    id: "anaerobicos", filo: "contra", rama: "respuesta", tier: "basic", icon: "🫁",
    nombre: "Anaeróbicos",
    desc: "El equipo está hecho para el esfuerzo explosivo: salir a apretar y volver a correr le cuesta menos que a cualquiera.",
    momento: "La cuarta ráfaga de presión del partido, corrida igual que la primera.",
    req: { nivel: 1 }, pos: { x: 190, y: 395 },
    // ⚠️ ADYACENTE POR AHORA (decisión PO): el diseño pide abaratar el desgaste de
    // CORRER LA CONTRA, y eso hoy no cuesta energía. Se abarata el único gasto que el
    // DT controla —el botón de presión— hasta que el sprint de situaciones construya
    // el costo físico del contraataque. Los pressStamina se apilan (multiplicativos).
    hooks: { pressStamina: { factor: 0.85 } },
  },
  {
    id: "defensa_intencionada", filo: "contra", rama: "respuesta", tier: "intermediate", icon: "🪖",
    nombre: "Defensa Intencionada",
    desc: "El despeje de cabeza deja de ser un manotazo de ahogado: el central cabecea buscando a un compañero, y ahí ya empezó la contra.",
    momento: "El cabezazo del central que termina en gol treinta metros más allá.",
    req: { nivel: 3, previo: "anaerobicos" },
    pos: { x: 430, y: 350 },
    // RECICLADO de Contragolpe Total (mitad): el córner rival defendido encadena contra.
    hooks: { chainOnDefendSp: { to: "transicion", p: 0.30, bonus: 0.04,
      intro: p => `¡El despeje fue un PASE! ${p.name} la baja de cabeza y el equipo sale de contra con el rival entero arriba.` } },
  },
  {
    id: "el_anzuelo", filo: "contra", rama: "respuesta", tier: "intermediate", icon: "🎣",
    nombre: "El Anzuelo",
    desc: "El equipo tiene la pelota en su propio campo y espera: el rival, aburrido de mirar, termina saliendo a buscarla — y eso es exactamente lo que se quería.",
    momento: "El rival dando dos pasos afuera de su bloque y el espacio a su espalda abierto de par en par.",
    req: { nivel: 3, previo: "anaerobicos" },
    pos: { x: 430, y: 455 },
    hooks: {
      // El cebo: el rival sale a presionar mi salida MÁS seguido — y sobrevivir esa
      // presión CONVIERTE la jugada en contra mía (el motor ya lo hace).
      oppPoolMod: { weights: { salida_fondo: 1.20 } },
      // RECICLADO de La Invitación: LA NEUTRALIZACIÓN del partido muerto — las celdas
      // contra|contra y contra|bloque vuelven a tablas (0.6 × 1.67 ≈ 1.0) y la
      // circulación-cebo puede CONVERTIR cuando el que esperaba da un paso al frente.
      // Baja de avanzada (4 PI) a intermedia (3 PI): acá es donde el concepto vive.
      poolMod: { vsFilo: ["contra", "bloque"], weights: { transicion: 1.67 } },
      baitConvert: { vsFilo: ["contra", "bloque"], p: 0.30, bonus: 0.05,
        texto: "¡Picaron el ANZUELO! El rival dio dos pasos afuera y el espacio a su espalda es una autopista." },
    },
  },
  {
    id: "segundo_aire", filo: "contra", rama: "respuesta", tier: "advanced", icon: "💨",
    nombre: "Segundo Aire",
    desc: "En el tramo final del partido, cuando todos arrastran las piernas, los que corren la contra encuentran un aire que el rival ya no tiene.",
    momento: "El minuto ochenta y cinco, y el que arranca la contra es el que más corrió.",
    // RENOMBRADO (era "Pulmones de Acero"): ese nombre ya es la básica de Respuesta
    // del High Press. LA CONVERGENCIA Y de la rama.
    req: { nivel: 6, todos: ["defensa_intencionada", "el_anzuelo"] },
    pos: { x: 680, y: 405 },
    // ⚠️ ADYACENTE POR AHORA (decisión PO): el diseño pide anular parte de la
    // penalización de VELOCIDAD por energía baja, que hoy es una curva global sin
    // excepciones por jugada. Se expresa donde SÍ se ve: conducir la contra con el
    // tanque vacío deja de ser una condena. Se reescribe en el sprint de situaciones.
    hooks: { tiredLegs: { under: 50, bonus: 0.08,
      texto: "Piernas fundidas y ahí va igual: el segundo aire aparece justo cuando el rival ya no tiene ninguno." } },
  },
  {
    id: "skiller", filo: "contra", rama: "respuesta", tier: "master", icon: "👑",
    nombre: "Skiller",
    desc: "Al que conduce la contra no lo frena nadie de pie: el rival tiene que elegir entre dejarlo pasar o cometerle la falta.",
    momento: "La falta desesperada al borde del área, y el tiro libre es nuestro.",
    req: { nivel: 10, previo: "segundo_aire" },
    pos: { x: 930, y: 405 },
    hooks: { counterFouls: { plus: 0.06,
      texto: "No lo pueden frenar limpio: al que corre la contra hay que hacerle falta." } },
  },

  /* ---- Expansión · de dónde NACE la contra (triángulo, campo propio) ---- */
  {
    id: "estoicos", filo: "contra", rama: "expansion", tier: "basic", icon: "🗿",
    nombre: "Estóicos",
    desc: "Replegado, el equipo aguanta lo que le tiren: cede terreno sin ceder el área, y espera su momento.",
    momento: "El rival estrellándose contra el bloque una y otra vez.",
    req: { nivel: 1 }, pos: { x: 280, y: 600 },
    hooks: { containBonus: { bonus: 0.05,
      texto: "El bloque aguanta estoico: cortan la jugada sin despeinarse." } },
  },
  {
    id: "balonazo", filo: "contra", rama: "expansion", tier: "intermediate", icon: "🌩️",
    nombre: "Balonazo",
    desc: "Una pelota que cruza el cielo del área propia es una contra en potencia: el equipo la disputa pensando ya en el arco de enfrente.",
    momento: "El rechace del duelo aéreo que cae al pie y ya son cuatro corriendo.",
    req: { nivel: 3, previo: "estoicos" },
    pos: { x: 500, y: 545 },
    // RECICLADO de Contragolpistas (Press): la segunda pelota de un duelo aéreo lanza contra.
    hooks: { chainOnDuelFail: { to: "transicion", p: 0.28, bonus: 0.04,
      intro: p => `¡La segunda pelota fue nuestra! ${p.name} la engancha y sale disparado con el rival mal parado.` } },
  },
  {
    id: "saque_rapido", filo: "contra", rama: "expansion", tier: "intermediate", icon: "⏱️",
    nombre: "Saque Rápido",
    desc: "Reventarla ya no es rendirse: el equipo reinicia antes de que el rival se acomode, y la jugada que parecía muerta sale corriendo para el otro lado.",
    momento: "El despeje que el rival mira caer mientras dos ya salieron corriendo.",
    // EL NODO QUE FALTABA en el diseño (decisión PO 30-jul): el tercer origen de la
    // contra — aéreo (Balonazo) · reinicio (este) · aguante (Estóicos).
    req: { nivel: 3, previo: "estoicos" },
    pos: { x: 500, y: 648 },
    // RECICLADO de Contragolpe Total (la otra mitad): hasta el despeje de la salida
    // asfixiada puede ser el inicio de una contra.
    hooks: { quickRestart: { p: 0.30, bonus: 0.04,
      intro: p => `¡SAQUE RÁPIDO! La reiniciaron antes de que el rival volviera: ${p.name} ya está corriendo.` } },
  },
  {
    id: "pase_atras", filo: "contra", rama: "expansion", tier: "advanced", icon: "🎯",
    nombre: "Pase Atrás",
    desc: "Desbloquea la jugada Pase Atrás: llegado al área, el que conduce no remata — la pisa y la devuelve para el que entra de frente al arco.",
    momento: "La pisada en el área chica y el compañero entrando solo a empujarla.",
    // LA CONVERGENCIA Y: la jugada de finalización pide las dos maneras de nacer.
    req: { nivel: 6, todos: ["balonazo", "saque_rapido"] },
    pos: { x: 720, y: 600 },
    // LA JUGADA NUEVA: tercera opción del desenlace, SOLO en la familia de la contra.
    // No se sortea: la elige el DT. Es un pase de verdad (se puede perder) a cambio de
    // que el remate llegue de frente y regalado.
    hooks: { squarePass: { bonus: 0.14,
      texto: "La pisa y la devuelve atrás: el que llega la empuja de frente al arco." } },
  },
  {
    id: "sin_escalas", filo: "contra", rama: "expansion", tier: "master", icon: "👑",
    nombre: "Sin Escalas",
    desc: "A veces no hay jugada: hay un pase y un jugador solo contra el arquero. El equipo entero juega esperando ese momento.",
    momento: "Un pase, cincuenta metros, y el nueve de cara al arquero.",
    req: { nivel: 10, previo: "pase_atras" },
    pos: { x: 940, y: 600 },
    // La contra puede NACER ya resuelta: se saltean los actos intermedios y el desenlace
    // es directamente el mano a mano. Poco probable a propósito (es el ideal platónico).
    hooks: { oneOnOne: { p: 0.14, bonus: 0.12,
      intro: p => `¡SIN ESCALAS! Un solo pase y ${p.name} quedó MANO A MANO con el arquero: no hubo jugada, hubo puñalada.` } },
  },

  /* ================= INTERMEDIATE (T2 "Las ramas") =================
     Gating: básico de la rama + Nivel 3 + Principio a 2 (AJENO en la
     rama Respuesta: cubrirse cuesta pureza de identidad) + 1 PI.
     Los marcados (migrado F2) absorben el efecto que Consolidada
     regalaba automático — ahora se compra. */

  /* ================= ADVANCED (T3 "La doctrina") =================
     Convergencia ASIMÉTRICA: Intermediate de la rama líder + Básico de la
     rama de apoyo + Nivel 6 + Principio a 4 (propio) o 3 (ajeno) + 1 PI.
     Los anti-matchup NEUTRALIZAN la matriz F2 — la llevan a tablas, JAMÁS
     la invierten (regla del arco). */

  /* ================= MASTER (T3 — el ideal platónico) =================
     Un Advanced cualquiera + los TRES básicos (presencia en las tres ramas)
     + Nivel 10 (Consolidada) + ambos Principios propios a 4 + 1 PI.
     Comprarlo dispara la CONSAGRACIÓN de prensa (game/traits).

     OJO: el rediseño de Press (25-jul-2026) usa otra regla — sus Masters son
     las HOJAS de cada rama (7 en total), piden el avanzado previo de SU rama
     en vez de converger las tres, y viven arriba en el bloque de Press. La
     consagración solo dispara con el PRIMERO de la filosofía. Las tres
     filosofías todavía sin rediseñar conservan la regla original de abajo. */
];

/** Un rasgo por id (o undefined). */
export const traitById = id => TRAITS.find(t => t.id === id);

/** Los rasgos de una filosofía, opcionalmente de un tier. */
export const traitsOf = (filoId, tier) =>
  TRAITS.filter(t => t.filo === filoId && (!tier || t.tier === tier));

/** Etiquetas de rama para la UI (regla Firma · Respuesta · Expansión). */
export const RAMA_LABELS = {
  firma: { label: "Firma", desc: "profundiza tu fútbol" },
  respuesta: { label: "Respuesta", desc: "cubre tu matchup débil" },
  expansion: { label: "Expansión", desc: "abre un fútbol lateral" },
};

/** El rasgo que PROFUNDIZA la avanzada de cada filosofía (la migración F2, T2):
 *  la vitrina y el diario apuntan acá donde antes prometían el regalo automático
 *  de Consolidada. Derivado de los hooks deep* exactos — no puede divergir. */
const DEEP_HOOKS = ["deepPress", "deepPosesion", "deepContra", "deepBloque"];
export const DEEP_TRAIT = Object.fromEntries(
  TRAITS.filter(t => DEEP_HOOKS.some(h => t.hooks[h])).map(t => [t.filo, t]));
