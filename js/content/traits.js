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
