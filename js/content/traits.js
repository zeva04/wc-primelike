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
    req: { nivel: 3, previo: "presion_intensificada", principio: { id: "presion", min: 2 } },
    pos: { x: 450, y: 200 },
    // No es "+20% de presión": el partido GENERA más recuperaciones porque el
    // equipo vive en la zona donde se roba (la ley del arco — cambia el fútbol
    // que sale, no los números de los jugadores).
    hooks: { poolMod: { weights: { recuperacion: 1.22 } } },
  },
  {
    id: "angriffpressing", filo: "press", rama: "firma", tier: "advanced", icon: "🦁",
    nombre: "Angriffpressing",
    desc: "La presión se adelanta hasta el saque de meta rival: el error se fuerza en el último tercio, con el arco enfrente.",
    momento: "Robo al central y gol de vestuario.",
    req: { nivel: 6, previo: "mittelfeldpressing", principio: { id: "presion", min: 4 } },
    pos: { x: 710, y: 128 },
    hooks: { variantDeep: { of: "recuperacion", p: 0.35, bonus: 0.06,
      intro: p => `¡Presión sobre el SAQUE DE META rival! ${p.name} salta sobre el central que recibe.` } },
  },
  {
    id: "gegenpressing", filo: "press", rama: "firma", tier: "advanced", icon: "🐺",
    nombre: "Gegenpressing",
    desc: "Los cinco segundos siguientes a una pérdida son los más agresivos del partido: recuperar antes de reorganizarse.",
    momento: "La perdió y la cazó al toque.",
    req: { nivel: 6, previo: "mittelfeldpressing", principio: { id: "verticalidad", min: 4 } },
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
    req: { nivel: 10, alguno: ["angriffpressing", "gegenpressing"],
      principios: [{ id: "presion", min: 4 }, { id: "verticalidad", min: 4 }] },
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
    req: { nivel: 3, previo: "pulmones", principio: { id: "solidez", min: 2 } }, // AJENO: cubrirse cuesta
    pos: { x: 450, y: 390 },
    hooks: { breakawayGuard: { p: 0.40,
      texto: "El central LEYÓ el pelotazo a la espalda: paso adelante y corte de cabeza. La presión sigue viva." } },
  },
  {
    id: "repliegue", filo: "press", rama: "respuesta", tier: "advanced", icon: "🪃",
    nombre: "Repliegue",
    desc: "Cuando la presión se rompe, el equipo entero vuelve corriendo a plantarse: el contragolpe rival se encuentra con todos de vuelta. Cuesta piernas.",
    momento: "La contra rival muriendo contra once camisetas que llegaron antes.",
    req: { nivel: 6, previo: "vigilancia", principio: { id: "solidez", min: 3 } }, // AJENO
    pos: { x: 710, y: 390 },
    hooks: { oppShotMalus: { seq: "transicion", bonus: -0.06,
      texto: "El repliegue llegó primero: la contra rival remató desde donde no se hace gol." } },
  },
  {
    id: "elasticidad", filo: "press", rama: "respuesta", tier: "master", icon: "👑",
    nombre: "Elasticidad",
    desc: "Replegarse ya no es rendirse: el bloque se estira, aguanta, y en cuanto toca la pelota vuelve a salir a presionar como si nada.",
    momento: "Repliegue, corte, y el equipo entero otra vez arriba en diez segundos.",
    req: { nivel: 10, previo: "repliegue",
      principios: [{ id: "presion", min: 4 }, { id: "solidez", min: 4 }] },
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
    req: { nivel: 3, previo: "directo", principio: { id: "presion", min: 2 } },
    pos: { x: 400, y: 505 },
    hooks: { recycleBuild: { p: 0.35,
      texto: "La pelota es nuestra y se queda: el equipo la esconde, la jugada no muere." } },
  },
  {
    id: "contragolpistas", filo: "press", rama: "expansion", tier: "intermediate", icon: "🏇",
    nombre: "Contragolpistas",
    desc: "No hace falta robar arriba: cualquier pelota ganada en el medio o atrás también se convierte en carrera.",
    momento: "El rechace que cae al pie y ya son cuatro corriendo.",
    req: { nivel: 3, previo: "directo", principio: { id: "verticalidad", min: 2 } },
    pos: { x: 400, y: 615 },
    hooks: { chainOnDuelFail: { to: "transicion", p: 0.28, bonus: 0.03,
      intro: p => `¡La segunda pelota fue nuestra! ${p.name} la engancha y sale disparado con el rival mal parado.` } },
  },
  {
    id: "pacientes", filo: "press", rama: "expansion", tier: "advanced", icon: "♟️",
    nombre: "Pacientes",
    desc: "Con la pelota robada, el equipo elige bien: los pases posteriores a una presión exitosa se juegan con cabeza fría.",
    momento: "El pase de gol dado sin apuro, con el rival todavía desordenado.",
    req: { nivel: 6, previo: "egoistas", principio: { id: "presion", min: 4 } },
    pos: { x: 620, y: 505 },
    hooks: { supportUpgrade: { bonus: 0.05,
      texto: "Cabeza fría: el pase busca al mejor ubicado de verdad, y lo encuentra libre." } },
  },
  {
    id: "tres_toques", filo: "press", rama: "expansion", tier: "advanced", icon: "🗡️",
    nombre: "Tres Toques",
    desc: "Del robo al remate en el menor número de pases posible: la jugada se resuelve antes de que el rival vuelva a estar en su sitio.",
    momento: "Robo, pase, gol: ocho segundos.",
    req: { nivel: 6, previo: "contragolpistas", principio: { id: "verticalidad", min: 4 } },
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
    req: { nivel: 10, previo: "pacientes",
      principios: [{ id: "presion", min: 4 }, { id: "elaboracion", min: 4 }] }, // AJENO: congelar es elaborar
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
    req: { nivel: 10, previo: "pacientes",
      principios: [{ id: "presion", min: 4 }, { id: "verticalidad", min: 4 }] },
    pos: { x: 1040, y: 500 },
    hooks: { oppPoolMod: { weights: { repliegue: 1.28 } } },
  },
  {
    id: "carrilenos", filo: "press", rama: "expansion", tier: "master", icon: "👑",
    nombre: "Carrileños",
    desc: "Los laterales son los que más corren del equipo: en cada contra hay siempre una banda libre y un centro esperando.",
    momento: "El centro del lateral que llegó desde su propia área.",
    req: { nivel: 10, previo: "tres_toques",
      principios: [{ id: "verticalidad", min: 4 }, { id: "presion", min: 4 }] },
    pos: { x: 840, y: 615 },
    hooks: { deepFinish: { of: "transicion", bonus: 0.06,
      texto: "El carrilero llegó desde atrás y puso el centro exacto: la contra terminó como se dibuja." } },
  },
  {
    id: "el_jaguar", filo: "press", rama: "expansion", tier: "master", icon: "👑",
    nombre: "El Jaguar",
    desc: "En cada contra hay un jugador que sale solo: el equipo lo busca siempre, y el mano a mano es el desenlace natural.",
    momento: "El delantero solo contra el arquero, otra vez.",
    req: { nivel: 10, previo: "tres_toques",
      principios: [{ id: "verticalidad", min: 4 }, { id: "presion", min: 4 }] },
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
    req: { nivel: 3, previo: "buen_pie", principio: { id: "elaboracion", min: 2 } },
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
    req: { nivel: 6, previo: "tercer_hombre", principio: { id: "elaboracion", min: 4 } },
    pos: { x: 710, y: 128 },
    hooks: { supportUpgrade: { bonus: 0.05,
      texto: "Geometria pura: el triangulo encuentra al mejor ubicado de verdad, no al mas cercano." } },
  },
  {
    id: "osciladores", filo: "posesion", rama: "firma", tier: "advanced", icon: "\u{1F30A}",
    nombre: "Osciladores",
    desc: "El equipo mueve el balon de un lado al otro hasta que el bloque rival se parte: tras cada cambio de orientacion aparece un hombre sin marca.",
    momento: "El cambio de cuarenta metros y el bloque entero descolocado.",
    req: { nivel: 6, previo: "tercer_hombre", principio: { id: "directo", min: 3 } }, // AJENO: el cambio largo ES juego directo
    pos: { x: 710, y: 275 },
    // LA NEUTRALIZACION del matchup debil, heredada de Amplitud + Abrir la Lata en
    // un solo nodo: 0.65 x 1.54 ~ 1.00 (la circulacion vuelve a rendir contra el
    // bloque) y 1.30 x 0.77 ~ 1.00 (el pelotazo forzado desaparece). A TABLAS —
    // nunca invertido: sigue siendo el espejo exacto de La Fortaleza del Bloque.
    hooks: { poolMod: { vsFilo: "bloque", weights: { circulacion: 1.54, pelotazo: 0.77 } } },
  },
  {
    id: "maquina_colectiva", filo: "posesion", rama: "firma", tier: "master", icon: "\u{1F451}",
    nombre: "La Maquina Colectiva",
    desc: "Once jugadores moviendose como una sola pieza. El rival deja de disputar el partido: corre detras de una pelota que nunca le pertenece.",
    momento: "El gol a puerta vacia tras treinta pases, empujandola sin oposicion.",
    req: { nivel: 10, previo: "pitagoricos",
      principios: [{ id: "elaboracion", min: 4 }, { id: "presion", min: 4 }] },
    pos: { x: 960, y: 128 },
    hooks: {
      // Hereda el hook del viejo Master (La Pelota es Nuestra): el reparto de
      // iniciativa se inclina de raiz y el pool rival se estrangula por falta de balon.
      masterPosesion: { shareShift: 0.06 },
      // La circulación larga deja la pelota servida: el remate llega casi hecho.
      tapIn: { p: 0.30, bonus: 0.22, texto: "La máquina la dejó servida: solo hay que empujarla." },
    },
  },
  {
    id: "hombre_libre", filo: "posesion", rama: "firma", tier: "master", icon: "\u{1F451}",
    nombre: "Hombre Libre",
    desc: "Despues de tanto tejer, siempre termina apareciendo uno solo. El equipo lo encuentra, y lo que sigue es el delantero contra el arquero.",
    momento: "Veinte pases y el nueve de cara al arquero.",
    req: { nivel: 10, previo: "osciladores",
      principios: [{ id: "elaboracion", min: 4 }, { id: "presion", min: 4 }] },
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
      backPass: { bonus: 0.05, texto: "El equipo la devuelve atrás y vuelve a armar: el rival tiene que salir de su bloque." },
    },
  },
  {
    id: "salida_lavolpiana", filo: "posesion", rama: "respuesta", tier: "intermediate", icon: "\u{1F9E9}",
    nombre: "Salida Lavolpiana",
    desc: "Contra la presion alta, un mediocampista baja entre los centrales: de golpe hay un hombre mas para salir y la primera linea rival queda sobrando.",
    momento: "El cinco entre los centrales y la presion rival saltando al vacio.",
    req: { nivel: 3, previo: "la_trampa", principio: { id: "elaboracion", min: 2 } },
    pos: { x: 450, y: 390 },
    hooks: { variantSwitch: { of: "circulacion", vsFilo: "press", p: 0.30, bonus: 0.07,
      intro: p => `SALIDA LAVOLPIANA: ${p.name} se descuelga entre los centrales y la presion rival ya no alcanza.` } },
  },
  {
    id: "la_frontera", filo: "posesion", rama: "respuesta", tier: "advanced", icon: "\u{1F6A9}",
    nombre: "La Frontera",
    desc: "La linea sube y se sostiene: cuando la pierden arriba y el rival busca la espalda, el equipo levanta la mano en bloque.",
    momento: "El contragolpe rival muriendo en offside con toda la linea levantando el brazo.",
    req: { nivel: 6, previo: "salida_lavolpiana", principio: { id: "presion", min: 4 } },
    pos: { x: 710, y: 390 },
    hooks: {
      // El balon a la espalda es exactamente lo que la trampa del offside anula:
      // el pelotazo ambiente muere leido por la linea.
      breakawayGuard: { p: 0.40,
        texto: "La linea sube junta y lo deja en offside: la frontera aguanto y el contragolpe no existio." },
      offsideTrap: { p: 0.35, texto: "¡Trampa del offside! La línea sube junta, el brazo en alto y la contra queda anulada." },
    },
  },
  {
    id: "rest_defense", filo: "posesion", rama: "respuesta", tier: "master", icon: "\u{1F451}",
    nombre: "Rest Defense",
    desc: "Incluso volcado en campo rival el equipo deja el ataque preparado para defender: la transicion del rival se apaga antes de cruzar la mitad.",
    momento: "El rival recuperando la pelota y no pudiendo dar dos pases seguidos.",
    req: { nivel: 10, previo: "la_frontera",
      principios: [{ id: "elaboracion", min: 4 }, { id: "presion", min: 4 }] },
    pos: { x: 960, y: 390 },
    // Hereda el hook del Rest Defense que vivia en el Press: el concepto —tener el
    // ataque ordenado para defender— pertenece a la filosofia que ATACA con la pelota.
    hooks: { oppLoseActs: { p: 0.28,
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
    req: { nivel: 3, previo: "el_rondo", principio: { id: "elaboracion", min: 2 } },
    pos: { x: 450, y: 545 },
    hooks: { skipToFinish: { of: "circulacion", p: 0.26, bonus: 0.04,
      intro: p => `Se acabo la paciencia: ${p.name} la pincha al espacio y saltea todo el tramite.` } },
  },
  {
    id: "sorpresivos", filo: "posesion", rama: "expansion", tier: "advanced", icon: "\u{1FA82}",
    nombre: "Sorpresivos",
    desc: "El equipo que toca y toca de pronto la manda por arriba: nadie lo espera, y la linea rival queda partida por el aire.",
    momento: "El pelotazo aereo tras cuarenta toques, con la defensa adelantada.",
    req: { nivel: 6, previo: "profundos", principio: { id: "elaboracion", min: 4 } },
    pos: { x: 710, y: 505 },
    hooks: { variantDeep: { of: "circulacion", p: 0.30, bonus: 0.06,
      intro: p => `Sorpresa: tras tanto toque ${p.name} la manda por ARRIBA y la linea rival queda partida.` } },
  },
  {
    id: "desesperantes", filo: "posesion", rama: "expansion", tier: "advanced", icon: "\u{1F624}",
    nombre: "Desesperantes",
    desc: "Perseguir la pelota sin tocarla enloquece a cualquiera. El rival termina entrando mal, y eso se cobra en tiros libres y en tarjetas.",
    momento: "El penal en el minuto ochenta tras diez minutos de sitio.",
    req: { nivel: 6, previo: "profundos", principio: { id: "presion", min: 4 } },
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
    req: { nivel: 10, alguno: ["sorpresivos", "desesperantes"],
      principios: [{ id: "elaboracion", min: 4 }, { id: "presion", min: 4 }] },
    pos: { x: 960, y: 560 },
    // Hereda el hook del viejo Juego Posicional: siempre hay un pasillo y siempre
    // hay un pie — con todos jugando de todo, la posesion directamente no muere.
    hooks: { recycleUpgrade: { p: 0.60, max: 2,
      texto: "Todos juegan de todo: aparece un pasillo donde no habia nadie y la posesion no muere." } },
  },

  /* ---------------- ⚡ Contragolpe ---------------- */
  {
    id: "tres_pases", filo: "contra", rama: "firma", tier: "basic", icon: "🗡️",
    nombre: "Tres Pases o Nada",
    desc: "Las contras se resuelven con el mínimo de pases posible, priorizando velocidad sobre control.",
    momento: "Robo, pase, gol: ocho segundos.",
    req: { nivel: 1 },
    hooks: { skipToFinish: { of: "transicion", p: 0.30, bonus: 0.05,
      intro: p => `¡Sin escalas! ${p.name} sale disparado: la contra se juega a UNA.` } },
  },
  {
    id: "tender_trampa", filo: "contra", rama: "respuesta", tier: "basic", icon: "🪤",
    nombre: "Tender la Trampa",
    desc: "El equipo cede terreno deliberadamente para atacar el espacio que el rival deja a su espalda.",
    momento: "El rival estrellado y la cancha entera para correr.",
    req: { nivel: 1 },
    hooks: { chainOnContain: { to: "transicion", p: 0.30, bonus: 0.04,
      intro: p => `¡La trampa se cierra! El rival quedó estirado y ${p.name} arranca con la cancha entera por delante.` } },
  },
  {
    id: "manada", filo: "contra", rama: "expansion", tier: "basic", icon: "🐆",
    nombre: "Correr en Manada",
    desc: "Cada contraataque incorpora varios jugadores en carrera para generar superioridad.",
    momento: "Tres contra dos y definición cruzada.",
    req: { nivel: 1 },
    hooks: { finishSupport: { of: "transicion", bonus: 0.06,
      texto: "La manada llega en números: dos camisetas libres esperan el pase." } },
  },

  /* ---------------- 🧱 Bloque bajo ---------------- */
  {
    id: "jaula", filo: "bloque", rama: "firma", tier: "basic", icon: "🏰",
    nombre: "Jaula Central",
    desc: "El bloque cierra el carril central y dirige el ataque rival hacia las bandas.",
    momento: "El rival dando vueltas por afuera sin encontrar la puerta.",
    req: { nivel: 1 },
    hooks: { oppShotMalus: { seq: "repliegue", bonus: -0.05,
      texto: "La jaula hizo su trabajo: el remate llegó incómodo, forzado desde afuera." } },
  },
  {
    id: "oficio", filo: "bloque", rama: "respuesta", tier: "basic", icon: "⏳",
    nombre: "Oficio de Trinchera",
    desc: "El equipo corta el ritmo del partido para desgastar y frustrar al rival.",
    momento: "El rival frustrado pateando desde afuera.",
    req: { nivel: 1 },
    hooks: { oppLoseActs: { p: 0.25,
      texto: "El oficio corta el partido: falta táctica, protesta rival y el ataque muere en la nada." } },
  },
  {
    id: "segunda_jugada", filo: "bloque", rama: "expansion", tier: "basic", icon: "🪂",
    nombre: "Segunda Jugada",
    desc: "El equipo se organiza para disputar y ganar la segunda pelota tras cada balón largo.",
    momento: "La peinada que cae al diez y llegada.",
    req: { nivel: 1 },
    hooks: { chainOnDuelFail: { to: "pelotazo", p: 0.30, bonus: 0.02,
      intro: p => `¡La segunda pelota es nuestra! El rechace cae al pie y ${p.name} vuelve a la carga.` } },
  },

  /* ================= INTERMEDIATE (T2 "Las ramas") =================
     Gating: básico de la rama + Nivel 3 + Principio a 2 (AJENO en la
     rama Respuesta: cubrirse cuesta pureza de identidad) + 1 PI.
     Los marcados (migrado F2) absorben el efecto que Consolidada
     regalaba automático — ahora se compra. */

  /* ---------------- ⚡ Contragolpe ---------------- */
  {
    id: "primer_pase", filo: "contra", rama: "firma", tier: "intermediate", icon: "📡",
    nombre: "El Primer Pase",
    desc: "El primer pase tras el robo busca directamente romper la última línea.",
    momento: "El pase de cincuenta metros que deja el mano a mano.",
    req: { nivel: 3, previo: "tres_pases", principio: { id: "verticalidad", min: 2 } },
    hooks: { skipUpgrade: { bonus: 0.06,
      intro: p => `¡El PRIMER PASE rompe la última línea! ${p.name} queda lanzado con cincuenta metros por delante.` } },
  },
  {
    id: "trampa_cerrada", filo: "contra", rama: "respuesta", tier: "intermediate", icon: "⛓️",
    nombre: "La Trampa Cerrada",
    desc: "Cuando el rival se vuelca al ataque, el equipo multiplica las contras a campo abierto.",
    momento: "La segunda contra consecutiva con el rival regalado.",
    req: { nivel: 3, previo: "tender_trampa", principio: { id: "solidez", min: 2 } }, // AJENO: aguantar para cazar
    // Migración F2: el 1er tramo del Contragolpe letal deja al rival AÚN más partido
    // (deepBonus que antes regalaba Consolidada — filoRasgo contra).
    hooks: { deepContra: {} },
  },
  {
    id: "superioridad", filo: "contra", rama: "expansion", tier: "intermediate", icon: "🎯",
    nombre: "Superioridad Numérica",
    desc: "Los contraataques buscan sistemáticamente el dos contra uno en el último tercio.",
    momento: "El dos contra uno resuelto con pase al del área chica.",
    req: { nivel: 3, previo: "manada", principio: { id: "elaboracion", min: 2 } },
    hooks: { supportUpgrade: { bonus: 0.05, // el pase busca al MEJOR ubicado de verdad (max Tiro)
      texto: "SUPERIORIDAD numérica: el pase encuentra al mejor rematador completamente libre." } },
  },

  /* ---------------- 🧱 Bloque bajo ---------------- */
  {
    id: "duenos_area", filo: "bloque", rama: "firma", tier: "intermediate", icon: "🗿",
    nombre: "Dueños del Área",
    desc: "El equipo domina el juego aéreo defensivo dentro de su propia área.",
    momento: "El despeje número diez del central y la contra que nace de ahí.",
    req: { nivel: 3, previo: "jaula", principio: { id: "solidez", min: 2 } },
    // Migración F2: la fortaleza PROFUNDA (deepContain + convertDeep — filoRasgo bloque:
    // "la muralla contiene mejor y castiga casi siempre") + el córner rival defendido
    // puede encadenar pelotazo propio (comer centros → lanzar).
    hooks: { deepBloque: {}, chainOnDefendSp: { to: "pelotazo", p: 0.30, bonus: 0.03,
      intro: p => `¡El área es NUESTRA! Despeje limpio, y ${p.name} ya tiene el pelotazo armado.` } },
  },
  {
    id: "pelota_ensayada", filo: "bloque", rama: "respuesta", tier: "intermediate", icon: "📐",
    nombre: "Pelota Parada Ensayada",
    desc: "Cada tiro libre y córner ejecuta una jugada ensayada en el entrenamiento.",
    momento: "El córner ensayado que termina en gol del dos.",
    req: { nivel: 3, previo: "oficio", principio: { id: "elaboracion", min: 2 } }, // AJENO: ensayar es elaborar
    hooks: { setpieceRehearsed: { bonus: 0.06, poolMult: 1.25,
      texto: "Esto se ensayó mil veces: la pizarra del balón parado entra en acción." } },
  },
  {
    id: "plataforma", filo: "bloque", rama: "expansion", tier: "intermediate", icon: "🏗️",
    nombre: "Plataforma",
    desc: "Ganada la segunda pelota, el equipo la convierte en ataque organizado en campo rival.",
    momento: "Peinada, control del diez, llegada limpia.",
    req: { nivel: 3, previo: "segunda_jugada", principio: { id: "directo", min: 2 } },
    hooks: { secondBallUpgrade: { bonus: 0.06,
      intro: p => `¡Segunda pelota y POSICIÓN establecida! ${p.name} organiza el ataque en campo rival.` } },
  },

  /* ================= ADVANCED (T3 "La doctrina") =================
     Convergencia ASIMÉTRICA: Intermediate de la rama líder + Básico de la
     rama de apoyo + Nivel 6 + Principio a 4 (propio) o 3 (ajeno) + 1 PI.
     Los anti-matchup NEUTRALIZAN la matriz F2 — la llevan a tablas, JAMÁS
     la invierten (regla del arco). */

  /* ---------------- ⚡ Contragolpe ---------------- */
  {
    id: "invitacion", filo: "contra", rama: "respuesta", tier: "advanced", icon: "🎩",
    nombre: "La Invitación",
    desc: "Cuando el rival espera, el equipo mantiene el balón con paciencia para obligarlo a salir — y entonces ataca el espacio.",
    momento: "Diez minutos de toque paciente y la puñalada cuando el bloque dio dos pasos afuera.",
    req: { nivel: 6, todos: ["trampa_cerrada", "tres_pases"], principio: { id: "elaboracion", min: 3 } }, // el MÁS ajeno del pool
    // LA RESPUESTA AL PARTIDO MUERTO: neutraliza las celdas contra|contra y
    // contra|bloque (0.6×1.67 ≈ 1.0) y la circulación-cebo puede CONVERTIR en
    // transición cuando el rival que esperaba da un paso al frente.
    hooks: {
      poolMod: { vsFilo: ["contra", "bloque"], weights: { transicion: 1.67 } },
      baitConvert: { vsFilo: ["contra", "bloque"], p: 0.30, bonus: 0.05,
        texto: "¡LA INVITACIÓN funcionó! El rival dio dos pasos afuera y el espacio a su espalda es una autopista." },
    },
  },
  {
    id: "campo_abierto", filo: "contra", rama: "firma", tier: "advanced", icon: "🏇",
    nombre: "A Campo Abierto",
    desc: "Las contras combinan velocidad máxima y varios corredores: el robo se convierte en avalancha.",
    momento: "Cuatro camisetas cruzando mediocampo a la vez.",
    req: { nivel: 6, todos: ["primer_pase", "manada"], principio: { id: "verticalidad", min: 4 } },
    hooks: { avalancha: { bonus: 0.06,
      texto: "AVALANCHA a campo abierto: la contra llega en oleada y la defensa no sabe a quién marcar." } },
  },

  /* ---------------- 🧱 Bloque bajo ---------------- */
  {
    id: "la_fortaleza", filo: "bloque", rama: "firma", tier: "advanced", icon: "🏯",
    nombre: "La Fortaleza",
    desc: "El área propia se vuelve territorio prohibido: cada centro, cada córner, cada embestida muere en el muro.",
    momento: "El delantero rival discutiendo con sus compañeros tras la enésima llegada muerta.",
    req: { nivel: 6, todos: ["duenos_area", "oficio"], principio: { id: "solidez", min: 4 } },
    // LA NEUTRALIZACIÓN del sitio: la celda opp bloque|posesion vuelve a tablas
    // (1.35×0.74 ≈ 1.0) y la FRUSTRACIÓN acumulada degrada los remates rivales a
    // medida que fallan (por remate errado, con tope).
    hooks: {
      oppPoolMod: { vsFilo: "posesion", weights: { repliegue: 0.74 } },
      // perShot = por ataque rival MUERTO en la muralla (contador propio del Match:
      // el diseño pide ataques frustrados, no tiros — el corte sin remate también suma).
      frustration: { perShot: 0.02, cap: 0.08,
        texto: "La frustración rival se palpa: cuanto más ataca sin premio, peor remata — la muralla come moral." },
    },
  },
  {
    id: "cabeza_playa", filo: "bloque", rama: "expansion", tier: "advanced", icon: "⚓",
    nombre: "Cabeza de Playa",
    desc: "El equipo ya no despeja: cada balón largo establece posición en campo rival.",
    momento: "Tres córners seguidos fabricados desde pelotazos.",
    req: { nivel: 6, todos: ["plataforma", "jaula"], principio: { id: "directo", min: 4 } },
    // El pelotazo REACTIVO que muere sin gol puede fabricar córner (balón parado
    // encadenado): la escasez ofensiva del Bloque compensada por CALIDAD del ciclo
    // despeje → pelotazo → segunda → córner — cada llegada vale más.
    hooks: { beachhead: { p: 0.35,
      texto: "¡Cabeza de playa! El pelotazo no muere: la zaga rival, incómoda, la manda al córner." } },
  },

  /* ================= MASTER (T3 — el ideal platónico) =================
     Un Advanced cualquiera + los TRES básicos (presencia en las tres ramas)
     + Nivel 10 (Consolidada) + ambos Principios propios a 4 + 1 PI.
     Comprarlo dispara la CONSAGRACIÓN de prensa (game/traits).

     OJO: el rediseño de Press (25-jul-2026) usa otra regla — sus Masters son
     las HOJAS de cada rama (7 en total), piden el avanzado previo de SU rama
     en vez de converger las tres, y viven arriba en el bloque de Press. La
     consagración solo dispara con el PRIMERO de la filosofía. Las tres
     filosofías todavía sin rediseñar conservan la regla original de abajo. */
  {
    id: "contragolpe_total", filo: "contra", rama: "master", tier: "master", icon: "👑",
    nombre: "Contragolpe Total",
    desc: "Cualquier balón recuperado, en cualquier zona, en cualquier momento, es el inicio de una contra. El rival ataca con miedo.",
    momento: "La contra que nace de un córner rival.",
    req: { nivel: 10, alguno: ["invitacion", "campo_abierto"], todos: ["tres_pases", "tender_trampa", "manada"],
      principios: [{ id: "solidez", min: 4 }, { id: "verticalidad", min: 4 }] },
    // El córner rival defendido y la salida sobrevivida también encadenan contra;
    // y el MIEDO: el rival ataca con menos volumen (shareShift a mi favor).
    hooks: { masterContra: { p: 0.30, shareShift: 0.04, bonus: 0.04,
      intro: p => `¡CONTRAGOLPE TOTAL! Nadie en el estadio lo esperaba — ${p.name} ya está corriendo y el rival entero quedó a sus espaldas.` } },
  },
  {
    id: "uno_a_cero", filo: "bloque", rama: "master", tier: "master", icon: "👑",
    nombre: "Uno a Cero",
    desc: "Con ventaja en el marcador, el equipo convierte el partido en territorio propio: el uno a cero se defiende con oficio, muro y castigo hasta el final.",
    momento: "Los últimos veinte minutos defendiendo la ventaja sin conceder una sola llegada limpia.",
    req: { nivel: 10, alguno: ["la_fortaleza", "cabeza_playa"], todos: ["jaula", "segunda_jugada", "oficio"],
      principios: [{ id: "solidez", min: 4 }, { id: "directo", min: 4 }] },
    // Rasgo de ESTADO (el único del pool): SOLO con ventaja — la muralla se amplifica
    // y el castigo directo gana letalidad. Perdiendo no aporta NADA: pura identidad.
    hooks: { masterBloque: { oppMalus: -0.05, myBonus: 0.05,
      texto: "El uno a cero es un arte y este equipo lo pinta: muralla atrás, cuchillo adelante, reloj corriendo." } },
  },
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
