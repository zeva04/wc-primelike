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
   ============================================================ */

export const TRAITS = [
  /* ---------------- 🦁 High Press ---------------- */
  {
    id: "morder", filo: "press", rama: "firma", tier: "basic", icon: "🐺",
    nombre: "Morder Tras Pérdida",
    desc: "Tras perder el balón, el equipo intenta recuperarlo inmediatamente antes de reorganizarse.",
    momento: "La perdió y la cazó al toque.",
    req: { nivel: 1 },
    hooks: { chainOnMineFail: { to: "recuperacion", p: 0.30, bonus: 0.03,
      intro: p => `¡MORDIDA tras pérdida! ${p.name} salta sobre la pelota antes de que el rival respire.` } },
  },
  {
    id: "trampa_banda", filo: "press", rama: "respuesta", tier: "basic", icon: "🕸️",
    nombre: "Trampa en la Banda",
    desc: "La presión dirige la salida rival hacia las bandas, donde el equipo cierra el espacio para robar.",
    momento: "Robo en la raya y ataque inmediato.",
    req: { nivel: 1 },
    hooks: { convertOnPress: { to: "transicion", p: 0.30, bonus: 0.04,
      texto: "¡La trampa de la banda funciona! El robo en la raya ya es ataque." } },
  },
  {
    id: "asfixia_salida", filo: "press", rama: "expansion", tier: "basic", icon: "🦁",
    nombre: "Asfixia en Salida",
    desc: "El equipo presiona la salida rival desde el saque de meta, buscando robos en campo contrario.",
    momento: "Robo al central y gol de vestuario.",
    req: { nivel: 1 },
    hooks: { variantDeep: { of: "recuperacion", p: 0.35, bonus: 0.06,
      intro: p => `¡Presión sobre el SAQUE DE META rival! ${p.name} salta sobre el central que recibe.` } },
  },

  /* ---------------- 🎼 Posesión ---------------- */
  {
    id: "hombre_libre", filo: "posesion", rama: "firma", tier: "basic", icon: "🔑",
    nombre: "Buscar al Hombre Libre",
    desc: "La circulación prioriza encontrar al jugador desmarcado entre líneas.",
    momento: "La pared que rompe líneas.",
    req: { nivel: 1 },
    hooks: { recycleBuild: { p: 0.40,
      texto: "El hombre libre aparece de la nada y la posesión se recicla: la jugada sigue viva." } },
  },
  {
    id: "amplitud", filo: "posesion", rama: "respuesta", tier: "basic", icon: "↔️",
    nombre: "Amplitud Máxima",
    desc: "Los extremos mantienen la máxima amplitud para estirar al bloque defensivo rival.",
    momento: "El cambio de frente que descoloca al bloque entero.",
    req: { nivel: 1 },
    // Suaviza (NO neutraliza — eso es de Advanced) la celda posesion|bloque de la
    // matriz F2: circulación 0.65 → 0.65×1.25 ≈ 0.81 contra el bloque cerrado.
    hooks: { poolMod: { vsFilo: "bloque", weights: { circulacion: 1.25 } } },
  },
  {
    id: "pausa", filo: "posesion", rama: "expansion", tier: "basic", icon: "🎼",
    nombre: "Pausa",
    desc: "El equipo controla el ritmo del partido, alternando posesiones largas con aceleraciones súbitas.",
    momento: "Veinte pases y puñal.",
    req: { nivel: 1 },
    hooks: { accelFinish: { of: "circulacion", p: 0.30, bonus: 0.06,
      intro: p => `La pausa era una trampa: ¡${p.name} acelera de golpe y el rival no llega!` } },
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

  /* ---------------- 🦁 High Press ---------------- */
  {
    id: "caceria_letal", filo: "press", rama: "firma", tier: "intermediate", icon: "🩸",
    nombre: "Cacería Letal",
    desc: "La presión tras pérdida se vuelve tan intensa que al rival solo le queda frenarla con falta.",
    momento: "La amarilla al cinco rival antes del minuto veinte.",
    req: { nivel: 3, previo: "morder", principio: { id: "presion", min: 2 } },
    // Migración F2: la Cacería total rota deja falta (amarilla + tiro libre) MÁS
    // seguido — el foulBreakDeep que antes regalaba Consolidada (filoRasgo press).
    hooks: { deepPress: {} },
  },
  {
    id: "anticipar", filo: "press", rama: "respuesta", tier: "intermediate", icon: "🛡️",
    nombre: "Anticipar la Espalda",
    desc: "Los centrales se adelantan para cortar el balón largo que busca superar la presión.",
    momento: "El central cortando de cabeza el pelotazo que iba a partir al equipo.",
    req: { nivel: 3, previo: "trampa_banda", principio: { id: "solidez", min: 2 } }, // AJENO: cubrirse cuesta
    hooks: { breakawayGuard: { p: 0.40,
      texto: "El central LEYÓ el pelotazo a la espalda: paso adelante y corte de cabeza. La presión sigue viva." } },
  },
  {
    id: "arco_vista", filo: "press", rama: "expansion", tier: "intermediate", icon: "🎯",
    nombre: "Arco a la Vista",
    desc: "Los robos en campo rival se convierten inmediatamente en ocasiones de gol.",
    momento: "Robo y gol en dos toques.",
    req: { nivel: 3, previo: "asfixia_salida", principio: { id: "verticalidad", min: 2 } },
    hooks: { deepFinish: { of: "recuperacion", bonus: 0.08,
      texto: "El robo fue tan arriba que el arco ya está a la vista: definición a quemarropa." } },
  },

  /* ---------------- 🎼 Posesión ---------------- */
  {
    id: "tercer_hombre", filo: "posesion", rama: "firma", tier: "intermediate", icon: "🔺",
    nombre: "El Tercer Hombre",
    desc: "Las combinaciones de tres jugadores rompen líneas y aseguran la salida bajo presión.",
    momento: "La pared que deja atrás a toda la primera línea de presión.",
    req: { nivel: 3, previo: "hombre_libre", principio: { id: "elaboracion", min: 2 } },
    // Mitiga el festín del Press rival: la salida jugada que falla puede rescatarse.
    hooks: { playoutRescue: { p: 0.40,
      texto: "¡El tercer hombre salva la salida! El pase interceptado encuentra al desmarcado y el regalo no existe." } },
  },
  {
    id: "cambio_frente", filo: "posesion", rama: "respuesta", tier: "intermediate", icon: "🌊",
    nombre: "Cambio de Frente",
    desc: "El equipo mueve el balón de banda a banda para desorganizar al bloque rival.",
    momento: "El cambio de cuarenta metros y centro atrás con el bloque descolocado.",
    req: { nivel: 3, previo: "amplitud", principio: { id: "directo", min: 2 } }, // AJENO: el cambio largo ES juego directo
    hooks: { variantSwitch: { of: "circulacion", vsFilo: "bloque", p: 0.30, bonus: 0.07,
      intro: p => `¡CAMBIO DE FRENTE de ${p.name}! Cuarenta metros de vuelo y el bloque entero descolocado.` } },
  },
  {
    id: "sitio_area", filo: "posesion", rama: "expansion", tier: "intermediate", icon: "🏟️",
    nombre: "Sitio al Área",
    desc: "Las posesiones prolongadas acorralan al rival en su área y fuerzan errores.",
    momento: "El penal en el minuto ochenta tras diez minutos de sitio.",
    req: { nivel: 3, previo: "pausa", principio: { id: "presion", min: 2 } },
    // Migración F2: el 4º compás de la sinfonía + el penal profundo (filoRasgo posesion).
    hooks: { deepPosesion: {} },
  },

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

  /* ---------------- 🦁 High Press ---------------- */
  {
    id: "asfixia_total", filo: "press", rama: "firma", tier: "advanced", icon: "🌪️",
    nombre: "Asfixia Total",
    desc: "El equipo presiona en todas las fases: la salida, el medio, la pérdida. Al rival no le queda fútbol para jugar.",
    momento: "El rival reventando pelotazos porque no puede salir jugando.",
    req: { nivel: 6, todos: ["caceria_letal", "asfixia_salida"], principio: { id: "presion", min: 4 } },
    // El bozal a la firma RIVAL: su identidad se expresa mucho menos (el mult de su
    // firma en el pool se reduce) — no ataca menos: renuncia a SU fútbol.
    hooks: { muzzleOppFirma: { factor: 0.6,
      texto: "El rival ya no intenta jugar SU fútbol: la asfixia lo obligó a renunciar a la idea." } },
  },
  {
    id: "cancha_chica", filo: "press", rama: "respuesta", tier: "advanced", icon: "📦",
    nombre: "Cancha Chica",
    desc: "El equipo achica el campo hasta que el rival no encuentra dónde jugar.",
    momento: "El rival encerrado en su propio tercio durante minutos enteros.",
    req: { nivel: 6, todos: ["anticipar", "morder"], principio: { id: "solidez", min: 3 } }, // AJENO
    // Las secuencias rivales pierden continuidad (mueren antes del remate): el mismo
    // corte del Oficio, pero por achique — la cancha mide cuarenta metros.
    hooks: { oppLoseActs: { p: 0.25,
      texto: "¡No hay cancha! El achique ahoga el avance rival antes de que llegue a ser peligro." } },
  },

  /* ---------------- 🎼 Posesión ---------------- */
  {
    id: "juego_posicional", filo: "posesion", rama: "firma", tier: "advanced", icon: "♟️",
    nombre: "Juego Posicional",
    desc: "Cada jugador ocupa su altura y su pasillo: el balón siempre encuentra tres opciones de pase.",
    momento: "El rival corriendo detrás de la pelota sin alcanzarla nunca.",
    req: { nivel: 6, todos: ["tercer_hombre", "pausa"], principio: { id: "elaboracion", min: 4 } },
    // El reciclaje del Hombre Libre se vuelve estructura: más seguido y hasta dos veces
    // por jugada — los fallos de circulación casi nunca son pérdida seca.
    hooks: { recycleUpgrade: { p: 0.60, max: 2,
      texto: "Juego posicional puro: siempre hay un pasillo, siempre hay un pie — la posesión no muere." } },
  },
  {
    id: "abrir_lata", filo: "posesion", rama: "respuesta", tier: "advanced", icon: "🥫",
    nombre: "Abrir la Lata",
    desc: "Contra bloques cerrados, el equipo combina amplitud, cambios de frente y llegada desde segunda línea.",
    momento: "El gol de media distancia tras quince pases contra el muro.",
    req: { nivel: 6, todos: ["cambio_frente", "hombre_libre"], principio: { id: "directo", min: 3 } }, // AJENO
    // LA NEUTRALIZACIÓN: con Amplitud (×1.25) apilada, la celda posesion|bloque vuelve
    // a tablas EXACTAS (0.65×1.25×1.23 ≈ 1.0) y el pelotazo forzado desaparece
    // (1.3×0.77 ≈ 1.0). Empareja el matchup — no lo invierte (regla del arco).
    hooks: { poolMod: { vsFilo: "bloque", weights: { circulacion: 1.23, pelotazo: 0.77 } } },
  },

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
     Comprarlo dispara la CONSAGRACIÓN de prensa (game/traits). */
  {
    id: "robo_es_pase", filo: "press", rama: "master", tier: "master", icon: "👑",
    nombre: "El Robo es el Pase",
    desc: "El equipo ya no distingue entre defender y atacar: cada recuperación es el primer pase del gol.",
    momento: "Un gol nacido de robo en cada partido — el rival lo sabe y no puede evitarlo.",
    req: { nivel: 10, alguno: ["asfixia_total", "cancha_chica"], todos: ["morder", "trampa_banda", "asfixia_salida"],
      principios: [{ id: "presion", min: 4 }, { id: "verticalidad", min: 4 }] },
    // Toda la familia de la recuperación define mejor (el robo ES creación) y la
    // mordida caza más seguido (chainPlus sobre la p de Morder).
    hooks: { masterPress: { bonus: 0.08, chainPlus: 0.15,
      texto: "No hay creador de juego mejor que una buena recuperación: el robo YA es el pase del gol." } },
  },
  {
    id: "pelota_nuestra", filo: "posesion", rama: "master", tier: "master", icon: "👑",
    nombre: "La Pelota es Nuestra",
    desc: "El partido se juega con una sola pelota — y es nuestra. El rival defiende, espera, y casi nunca la ve.",
    momento: "El rival tocando el balón tres veces en diez minutos.",
    req: { nivel: 10, alguno: ["juego_posicional", "abrir_lata"], todos: ["hombre_libre", "amplitud", "pausa"],
      principios: [{ id: "elaboracion", min: 4 }, { id: "presion", min: 4 }] },
    // El reparto de iniciativa se inclina de raíz (+share): el pool rival se
    // ESTRANGULA por falta de balón. El costo permanece: perderla sigue doliendo.
    hooks: { masterPosesion: { shareShift: 0.06 } },
  },
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
