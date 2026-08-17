/* ============================================================
   ui/traiticons — los 48 ICONOS DE RASGO, dibujados píxel a píxel.

   Mismo motor que ui/pixicons.js (una grilla de caracteres → un <rect> por
   píxel) pero con su propio archivo y su propia paleta, por una razón de
   tamaño: los iconos de interfaz son doce y estos son cuarenta y ocho —
   mezclarlos convertiría pixicons en un cajón de sastre de 600 líneas.

   POR QUÉ DEJAN DE SER EMOJI. Un emoji del sistema en la pizarra es una
   calcomanía: trae antialias, degradados y una métrica que no es la de la
   grilla, y encima CAMBIA DE DIBUJO según el sistema operativo — el mismo rasgo
   se ve distinto en Windows y en Android. Los 48 conceptos salen de la columna
   "Ícono" del catálogo v2: cada uno es una figura futbolística nombrable (la
   mordida, el anzuelo, la muralla), no una letra decorada.

   EL EMOJI NO MUERE: `trait.icon` sigue existiendo y sigue siendo el que se lee
   en el RELATO del partido y en el diario, que son texto plano y no admiten un
   SVG. El icono dibujado es para las superficies que sí dibujan: la pizarra
   (ui/board) y la ficha del riel (screens/philosophy).

   Cada icono es un array de filas de 16 caracteres; cada letra, una entrada de
   PAL. El punto es transparente. Las filas pueden ser menos de 16: se dibujan
   desde arriba, así que un icono corto queda pegado al techo — por eso casi
   todos van centrados a mano en 12-14 filas.
   ============================================================ */

/* LA REGLA DE COLOR, que costó una pasada de correcciones: **ningún icono puede
   pintarse del color de marcador de su propia filosofía**. El nodo de la pizarra ya
   está trazado y lavado con ese color (board.PRINCIPLE_COLORS), así que un icono azul
   dentro de un nodo azul desaparece — El Rondo y Desesperantes se leían como una
   mancha. Los cuerpos van UN ESCALÓN MÁS OSCURO que su marcador (azul profundo dentro
   del celeste, violeta dentro del púrpura, naranja dentro del ámbar): se separan por
   valor, no por matiz, que es lo único que aguanta a 26 píxeles. El rojo es la
   excepción y va al revés — el marcador del Press ya es oscuro, así que sus iconos
   aclaran. */
const PAL = {
  K: "#0B0B0E",   // el contorno: TODO icono lo lleva, es lo que lo despega del pizarrón
  W: "#f4f4f0",   // blanco
  X: "#8b8b98",   // gris medio
  Y: "#4a4a56",   // gris oscuro
  R: "#fca5a5",   // rojo claro — los cuerpos del 🦁 Press, MÁS claros que su marcador
  S: "#dc2626",   // rojo fuerte
  A: "#f97316",   // naranja quemado — los cuerpos del ⚡ Contra, fuera del ámbar del nodo
  L: "#fde68a",   // ámbar claro (solo reflejos)
  O: "#fb923c",   // naranja
  B: "#2563eb",   // azul profundo — los cuerpos de la 🎼 Posesión, fuera del celeste del nodo
  D: "#1d4ed8",   // azul aún más profundo
  C: "#a5f3fc",   // hielo (solo reflejos)
  E: "#34d399",   // verde
  G: "#D4AF37",   // oro
  N: "#8B6914",   // marrón
  P: "#7c3aed",   // violeta profundo — los cuerpos del 🧱 Bloque, fuera del púrpura del nodo
  M: "#f472b6",   // rosa
};

/* Las grillas, agrupadas por filosofía y en el orden del árbol
   (raíz · firma · respuesta · expansión · convergencia). */
const GRIDS = {

  /* ═══ 🦁 HIGH PRESS ═══ */

  // Raíz · Incomodar: el "!" que sale del balón, con las marcas de interferencia
  incomodar: [
    "................",
    "..K.........K...",
    "...K..KRRK..K...",
    "......KRRK......",
    ".K....KRRK....K.",
    "..KK..KRRK..KK..",
    ".K....KRRK....K.",
    "......KRRK......",
    "......KKKK......",
    "...K..........K.",
    "..K...KRRK...K..",
    "......KKKK......",
    "................",
  ],
  // Firma B · Presión Intensificada: la lupa de cristal afilado
  presion_intensificada: [
    "....KKKKKK......",
    "...KWWWWWWK.....",
    "..KWWKKKKWWK....",
    "..KWKRRRRKWK....",
    "..KWKRRRRKWK....",
    "..KWWKKKKWWK....",
    "...KWWWWWWK.....",
    "....KKKKKK......",
    "......KKKK......",
    ".......KYYK.....",
    "........KYYK....",
    ".........KYYK...",
    "..........KKK...",
  ],
  // Firma I · Gegenpressing: la mordida cerrándose sobre el balón
  gegenpressing: [
    "KK............KK",
    "KYK..........KYK",
    "KWWK........KWWK",
    ".KWWK......KWWK.",
    "..KWWK....KWWK..",
    "...KKK.KK.KKK...",
    ".....KWWWWK.....",
    "....KWWKKWWK....",
    ".....KWWWWK.....",
    "...KKK.KK.KKK...",
    "..KWWK....KWWK..",
    ".KWWK......KWWK.",
    "KWWK........KWWK",
    "KYK..........KYK",
    "KK............KK",
  ],
  // Firma A · Angriffpressing: la flecha que sube hasta la línea del arco rival
  angriffpressing: [
    "..KKKKKKKKKKKK..",
    "..KWKWKWKWKWKK..",
    "..KKKKKKKKKKKK..",
    "................",
    ".......KK.......",
    "......KRRK......",
    ".....KRRRRK.....",
    "....KRRRRRRK....",
    "...KRRKRRKRRK...",
    "..KKK.KRRK.KKK..",
    "......KRRK......",
    "......KRRK......",
    "......KRRK......",
    "......KKKK......",
  ],
  // Firma M · Pressingfalle: el cepo, las dos mandíbulas dentadas
  pressingfalle: [
    "................",
    "KKKKKKKKKKKKKKKK",
    "KXKXKXKXKXKXKXKK",
    "KXXXXXXXXXXXXXXK",
    "KKXXXXXXXXXXXXKK",
    "..KXXXXXXXXXXK..",
    "....KKKKKKKK....",
    "....KKKKKKKK....",
    "..KXXXXXXXXXXK..",
    "KKXXXXXXXXXXXXKK",
    "KXXXXXXXXXXXXXXK",
    "KXKXKXKXKXKXKXKK",
    "KKKKKKKKKKKKKKKK",
  ],
  // Respuesta B · Pulmones de Acero: el fuelle de forja
  pulmones: [
    ".......KK.......",
    ".......KK.......",
    "....KKKKKKKK....",
    "..KKRRK..KRRKK..",
    ".KRRRRK..KRRRRK.",
    ".KRRRRRKKRRRRRK.",
    ".KRRRRRRRRRRRRK.",
    ".KRRRRRRRRRRRRK.",
    ".KRRRRRRRRRRRRK.",
    "..KRRRRRRRRRRK..",
    "..KKRRRRRRRRKK..",
    "....KKRRRRKK....",
    "......KKKK......",
  ],
  // Respuesta I · Vigilancia Defensiva: el ojo dentro del escudo
  vigilancia: [
    "..KKKKKKKKKKKK..",
    "..KBBBBBBBBBBK..",
    "..KBBBBBBBBBBK..",
    "..KBKKKKKKKKBK..",
    "..KBKWWWWWWKBK..",
    "..KBKWKKKKWKBK..",
    "..KBKWKWWKWKBK..",
    "..KBKWKKKKWKBK..",
    "..KBKWWWWWWKBK..",
    "..KBKKKKKKKKBK..",
    "..KBBBBBBBBBBK..",
    "...KBBBBBBBBK...",
    ".....KBBBBK.....",
    ".......KK.......",
  ],
  // Respuesta A · Falta Táctica: la tarjeta amarilla cortando en seco una flecha lanzada
  falta_tactica: [
    "................",
    "....KKKKKKKK....",
    "....KLLLLLLK....",
    "KKK.KLLLLLLK....",
    "KRRKKLLLLLLK....",
    "KRRKKLLLLLLK.KK.",
    "KKKKKLLLLLLK.KK.",
    "..KKKLLLLLLKKK..",
    "KRRKKLLLLLLK.KK.",
    "KRRKKLLLLLLK.KK.",
    "KKK.KLLLLLLK....",
    "....KLLLLLLK....",
    "....KKKKKKKK....",
  ],
  // Expansión B · Directo: la flecha recta y gruesa desde el punto de impacto
  directo: [
    "................",
    "................",
    "..........KK....",
    "..........KAK...",
    "KKK.......KAAK..",
    "KAKKKKKKKKKAAAK.",
    "KAAAAAAAAAAAAAAK",
    "KAKKKKKKKKKAAAK.",
    "KKK.......KAAK..",
    "..........KAK...",
    "..........KK....",
    "................",
  ],
  // Expansión I · El Zarpazo: la huella de zarpa con las uñas afuera
  el_zarpazo: [
    "................",
    "..KK...KK...KK..",
    ".KRRK.KRRK.KRRK.",
    ".KRRK.KRRK.KRRK.",
    "..KK...KK...KK..",
    "................",
    "....KKKKKKKK....",
    "..KKRRRRRRRRKK..",
    ".KRRRRRRRRRRRRK.",
    ".KRRRRRRRRRRRRK.",
    ".KRRRRRRRRRRRRK.",
    "..KRRRRRRRRRRK..",
    "...KKRRRRRRKK...",
    ".....KKKKKK.....",
  ],
  // Expansión A · Pacientes: dos siluetas, y el pase elige a la de la derecha
  pacientes: [
    "................",
    "...KK.......KK..",
    "..KRRK.....KWWK.",
    "..KRRK.....KWWK.",
    "...KK.......KK..",
    "..KKKK.....KKKK.",
    ".KRRRRK...KWWWWK",
    ".KRRRRK...KWWWWK",
    ".KKRRKK...KKWWKK",
    "..KRK.......KWK.",
    "..KRK.......KWK.",
    "..KKK.......KKK.",
    "................",
    "....KKKKKKKKKK..",
    "....KRRRRRRRRK..",
  ],
  // Convergencia M · Mordedura Fatal: la cabeza triangular de la serpiente
  mordedura_fatal: [
    "................",
    "..KKK...........",
    "..KEEKK.........",
    "..KEEEEKK.......",
    "..KEEEEEEKK.....",
    "..KEKKEEEEEKK...",
    "..KEKWKEEEEEEKK.",
    "..KEEEKEEEEEEEEK",
    "..KEEEEEEEEEEEK.",
    "..KKEEEEEEEEKK..",
    "....KKKKKKKK....",
    "....KWK..KWK....",
    "....KWK..KWK....",
    ".....K....K.....",
  ],

  /* ═══ 🎼 POSESIÓN ═══ */

  // Raíz · El Rondo: el círculo de puntos con la flecha girando adentro
  el_rondo: [
    "....KKK..KKK....",
    "...KBBK..KBBK...",
    "....KKK..KKK....",
    "KKK....KK....KKK",
    "KBBK..KKKK..KBBK",
    "KKK..KKWWKK..KKK",
    ".....KWKKWK.....",
    ".....KWKKWK.....",
    "KKK..KKWWKK..KKK",
    "KBBK..KKKK..KBBK",
    "KKK....KK....KKK",
    "....KKK..KKK....",
    "...KBBK..KBBK...",
    "....KKK..KKK....",
  ],
  // Firma B · Buen Pie: la bota de perfil con el balón al empeine
  buen_pie: [
    "................",
    "..KKK...........",
    "..KBBK..........",
    "..KBBK..........",
    "..KBBK..KKK.....",
    "..KBBKKKWWWK....",
    "..KBBBBKWKWK....",
    "..KBBBBBKWWK....",
    "..KBBBBBBKKK....",
    "..KBBBBBBBBK....",
    "..KKBBBBBBBK....",
    "...KKKKKKKKK....",
    "................",
  ],
  // Firma I · El Tercer Hombre: el triángulo que saltea el punto del medio
  tercer_hombre: [
    "................",
    ".......KK.......",
    "......KBBK......",
    ".......KK.......",
    "....KK....KK....",
    "...K........K...",
    "..K...KKKK...K..",
    ".KKK..KYYK..KKK.",
    "KBBBK.KKKK.KBBBK",
    "KBBBKKKKKKKKBBBK",
    ".KKKKBBBBBBKKKK.",
    "......KKKK......",
    "................",
  ],
  // Firma A · Osciladores: la onda que cruza de lado a lado
  osciladores: [
    "................",
    "................",
    "...KKK.....KKK..",
    "..KBBBK...KBBBK.",
    ".KBBKKBK.KBKKBBK",
    ".KBK..KBKBK..KBK",
    "KBK...KBKBK...KB",
    "KK.....KKK.....K",
    "................",
    "KK.....KKK.....K",
    "KBK...KBKBK...KB",
    ".KBK..KBKBK..KBK",
    ".KBBKKBK.KBKKBBK",
    "..KBBBK...KBBBK.",
    "...KKK.....KKK..",
  ],
  // Firma M · La Máquina Colectiva: el engranaje hecho de siluetas
  maquina_colectiva: [
    ".....K....K.....",
    "....KBK..KBK....",
    "..KKKBKKKKBKKK..",
    "..KBBBBBBBBBBK..",
    "KKKBBBBBBBBBBKKK",
    "KBBBBKKKKKKBBBBK",
    "KBBBKWWWWWWKBBBK",
    "KBBBKWKKKKWKBBBK",
    "KBBBKWWWWWWKBBBK",
    "KBBBBKKKKKKBBBBK",
    "KKKBBBBBBBBBBKKK",
    "..KBBBBBBBBBBK..",
    "..KKKBKKKKBKKK..",
    "....KBK..KBK....",
    ".....K....K.....",
  ],
  // Respuesta B · Cabeza Fría: el cubo de hielo con la línea de pase limpia
  cabeza_fria: [
    "................",
    "...KKKKKKKKKK...",
    "..KKCCCCCCCCKK..",
    ".KCCCCCCCCCCCCK.",
    ".KCCKKKKKKKKCCK.",
    "KKKKKKKKKKKKKKKK",
    "KWWWWWWWWWWWWWWK",
    "KKKKKKKKKKKKKKKK",
    ".KCCKKKKKKKKCCK.",
    ".KCCCCCCCCCCCCK.",
    "..KKCCCCCCCCKK..",
    "...KKKKKKKKKK...",
    "................",
  ],
  // Respuesta I · La Trampa: la flecha que avanza y de golpe se dobla 180°
  la_trampa: [
    "................",
    "................",
    "KKKKKKKKKKKK....",
    "KBBBBBBBBBBBKK..",
    "KKKKKKKKKKBBBBK.",
    "..........KBBBBK",
    "...........KBBBK",
    "..........KBBBBK",
    "KKKKKKKKKKBBBBK.",
    "KBBBBBBBBBBBKK..",
    "KKKKKKKKKKKK....",
    "................",
    "KKK.............",
    "KBBKKK..........",
    "KKKKKK..........",
  ],
  // Respuesta A · La Frontera: la línea con la bandera de offside clavada
  la_frontera: [
    ".......KKKKKK...",
    ".......KAAAAAK..",
    ".......KAAAAAK..",
    ".......KAAAAK...",
    ".......KAAK.....",
    ".......KK.......",
    ".......KYK......",
    ".......KYK......",
    ".......KYK......",
    "KKKKKKKKYKKKKKKK",
    "KWWWWWWWYWWWWWWK",
    "KKKKKKKKKKKKKKKK",
    "................",
  ],
  // Expansión B · Pase de Riesgo: la recta que cruza las líneas punteadas
  pase_riesgo: [
    "..K...K...K...K.",
    "..K...K...K...K.",
    "..K...K...K..KK.",
    "..K...K...KKKAK.",
    "..K...K.KKAKKAK.",
    "..K.KKKAK.K..KK.",
    "KKKAKK.K......K.",
    "KAAK..K...K...K.",
    "KKK...K...K...K.",
    "..K...K...K...K.",
    "..K...K...K...K.",
  ],
  // Expansión I · Desesperantes: el reloj de arena
  desesperantes: [
    "KKKKKKKKKKKKKK..",
    "KWWWWWWWWWWWWK..",
    "KKBBBBBBBBBBKK..",
    ".KKBBBBBBBBKK...",
    "..KKBBBBBBKK....",
    "...KKBBBBKK.....",
    "....KKBBKK......",
    "....KKBBKK......",
    "...KKBBBBKK.....",
    "..KKBBBBBBKK....",
    ".KKBBBBBBBBKK...",
    "KKBBBBBBBBBBKK..",
    "KWWWWWWWWWWWWK..",
    "KKKKKKKKKKKKKK..",
  ],
  // Expansión A · Fríos: el copo de nieve sobre el cronómetro detenido
  frios: [
    ".......K........",
    "..K..KKCKK..K...",
    "...K.KCCCK.K....",
    "....KKCCCKK.....",
    "KKKCCCCCCCCCKKK.",
    "....KKCCCKK.....",
    "...K.KCCCK.K....",
    "..K..KKCKK..K...",
    ".......K........",
    "....KKKKKK......",
    "...KWWKWWWK.....",
    "...KWWKWWWK.....",
    "...KWWWWWWK.....",
    "....KKKKKK......",
  ],
  // Convergencia M · El Carrusel: el carrusel visto desde arriba
  el_carrusel: [
    ".......KK.......",
    "......KGGK......",
    "...KKKKGGKKKK...",
    "..KGGGGGGGGGGK..",
    "..KKKKKKKKKKKK..",
    "...K.K.KK.K.K...",
    "...K.K.KK.K.K...",
    "..KKKKKKKKKKKK..",
    "..KBBKKBBKKBBK..",
    "..KBBKKBBKKBBK..",
    "..KKKKKKKKKKKK..",
    "...K.K.KK.K.K...",
    "..KKKKKKKKKKKK..",
    "..KGGGGGGGGGGK..",
    "..KKKKKKKKKKKK..",
  ],

  /* ═══ ⚡ CONTRAGOLPE ═══ */

  // Raíz · Punta de Velocidad: el rayo bifurcado desde un punto
  punta_velocidad: [
    "................",
    ".........KKKK...",
    "........KAAAK...",
    ".......KAAAK....",
    "......KAAAK.....",
    ".....KAAAK......",
    "....KAAKKKKKK...",
    "...KAAAAAAAAK...",
    "....KKKKKAAK....",
    "........KAAK....",
    ".......KAAK.....",
    "......KAAK......",
    ".....KAAK.......",
    "......KK........",
  ],
  // Firma B · Primer Pase: la antena con una sola onda saliendo disparada
  primer_pase: [
    "................",
    ".......KK.......",
    "......KAAK...KK.",
    "......KAAK..KAK.",
    "......KAAK.KAK..",
    "...KKKKAAKKAK...",
    "..KAAAAAAAKAK...",
    "...KKKKAAKKAK...",
    "......KAAK.KAK..",
    "......KAAK..KAK.",
    "....KKKAAKKK.KK.",
    "...KAAAAAAAAK...",
    "...KKKKKKKKKK...",
  ],
  // Firma I · Ataque Relámpago: el rayo partiendo el cronómetro
  ataque_relampago: [
    "....KKKKKKKK....",
    "...KWWWWWWWWK...",
    "..KWWWWKKWWWWK..",
    ".KWWWWKAAKWWWWK.",
    ".KWWWKAAKWWWWWK.",
    ".KWWKAAKWWWWWWK.",
    ".KWKAAAAAAKWWWK.",
    ".KWWWKKAAKWWWWK.",
    ".KWWWWWKAAKWWWK.",
    ".KWWWWWKAKWWWWK.",
    "..KWWWWKKWWWWK..",
    "...KWWWWWWWWK...",
    "....KKKKKKKK....",
  ],
  // Firma A · Duelista: la silueta que se desprende y deja atrás a la otra
  duelista: [
    "................",
    "..KKK.....KKK...",
    "..KYK....KAAAK..",
    "..KKK....KAAAK..",
    ".KKKKK....KKK...",
    ".KKYKK..KKKKKKK.",
    "...K....KAAAAAK.",
    "...K.....KKAKK..",
    "..KKK......KAK..",
    "..K.K.....KAKAK.",
    "..K.K....KAK.KAK",
    "..KKK....KKK.KKK",
    "................",
  ],
  // Firma M · El Enjambre: las siluetas triangulares en formación de cuña
  el_enjambre: [
    ".......KK.......",
    "......KAAK......",
    ".....KAAAAK.....",
    "......KKKK......",
    "................",
    "..KK........KK..",
    ".KAAK......KAAK.",
    "KAAAAK....KAAAAK",
    ".KKKK......KKKK.",
    "................",
    "KK....KK....KK..",
    "KAK..KAAK..KAK..",
    "KKK.KAAAAK.KKK..",
    ".....KKKK.......",
  ],
  // Respuesta B · Estóicos: el moai inamovible con el impacto rebotando
  estoicos: [
    "................",
    "...KKKKKKKK.....",
    "..KXXXXXXXXK....",
    "..KXKKXXKKXK....",
    "..KXKYXXYKXK....",
    "..KXXXXXXXXK.KK.",
    "..KXXXKKXXXK.KK.",
    "..KXXXXXXXXK..K.",
    "..KKXXXXXXKK....",
    "...KXXXXXXK..KK.",
    "..KXXXXXXXXK.KK.",
    "..KXXXXXXXXK....",
    "..KKKKKKKKKK....",
  ],
  // Respuesta I · El Anzuelo: el anzuelo con el balón de carnada
  el_anzuelo: [
    ".....KK.........",
    ".....KXK........",
    ".....KXK........",
    ".....KXK........",
    ".....KXK........",
    ".....KXK........",
    ".KKK.KXK........",
    "KWWWKKXK........",
    "KWKWKXXK........",
    "KWWWKXK.........",
    ".KKKKK..........",
    "..KKK...........",
    "................",
  ],
  // Respuesta A · Salir de Contra: el muro que se abre y deja salir a la flecha
  salir_de_contra: [
    "KKKKKKK.........",
    "KXXXXXK.........",
    "KXKKKXK.........",
    "KXK.KXK....KK...",
    "KXK.KXK.....KK..",
    "KXK.KXKKKKKKKAK.",
    "KXK.KAAAAAAAAAAK",
    "KXK.KXKKKKKKKAK.",
    "KXK.KXK.....KK..",
    "KXKKKXK....KK...",
    "KXXXXXK.........",
    "KKKKKKK.........",
  ],
  // Expansión I · La Pausa: la mano abierta que frena, y la flecha que se detiene en ella
  la_pausa: [
    "................",
    "....KK.KK.KK....",
    "...KAAKAAKAAK...",
    "...KAAKAAKAAK...",
    "KK.KAAAAAAAAK...",
    "KKKKAAAAAAAAK...",
    "KKKKAAAAAAAAAK..",
    "KKKKAAAAAAAAAK..",
    "KK.KAAAAAAAAAK..",
    "...KAAAAAAAAK...",
    "....KAAAAAAK....",
    ".....KAAAAK.....",
    "......KKKK......",
  ],
  // Expansión I · Saque Rápido: el cronómetro que arranca antes, con estela
  saque_rapido: [
    "................",
    "KK...KKKKKKKK...",
    "KKK.KWWWWWWWWK..",
    "...KWWWWKWWWWWK.",
    "KKKKWWWWKWWWWWK.",
    "KKKKWWWWKKKWWWK.",
    "...KWWWWWWWWWWK.",
    "KKKKWWWWWWWWWWK.",
    "KKK.KWWWWWWWWK..",
    "KK...KKKKKKKK...",
    "................",
  ],
  // Expansión A · Pase Atrás: la pierna que frena y la flecha que sale hacia atrás
  pase_atras: [
    "................",
    "..........KKK...",
    "..........KAAK..",
    "..........KAAK..",
    "..........KAAK..",
    "....KKKKKKKAAK..",
    "..KKAAAAAAAAAK..",
    ".KAAK.KKKKKKKK..",
    ".KAAK...........",
    "..KKAAK.........",
    "....KKAAKKK.....",
    "......KKKKK.....",
    "................",
  ],
  // Convergencia M · Sin Escalas: la recta única entre dos puntos, sin quiebres
  sin_escalas: [
    "................",
    "................",
    "..KKK......KKK..",
    ".KAAAK....KAAAK.",
    ".KAAAKKKKKKAAAK.",
    ".KAAAKAAAAKAAAK.",
    ".KAAAKKKKKKAAAK.",
    ".KAAAK....KAAAK.",
    "..KKK......KKK..",
    "................",
    "................",
  ],

  /* ═══ 🧱 BLOQUE BAJO ═══ */

  // Raíz · Marca Zonal: la grilla de casilleros, con alguien en cada uno
  marca_zonal: [
    "KKKKKKKKKKKKKKKK",
    "K..K..K..K..K..K",
    "K.PK.PK.PK.PK..K",
    "KPPKPPKPPKPPK..K",
    "KKKKKKKKKKKKKKKK",
    "K..K..K..K..K..K",
    "K.PK.PK.PK.PK..K",
    "KPPKPPKPPKPPK..K",
    "KKKKKKKKKKKKKKKK",
    "K..K..K..K..K..K",
    "K.PK.PK.PK.PK..K",
    "KPPKPPKPPKPPK..K",
    "KKKKKKKKKKKKKKKK",
  ],
  // Firma B · Compactación: el castillo visto de arriba, cerrándose al centro
  compactacion: [
    "KKKKKKKKKKKKKKKK",
    "KPPKPPKPPKPPKPPK",
    "KPPPPPPPPPPPPPPK",
    "KPKKKKKKKKKKKKPK",
    "KPK..........KPK",
    "KPK..KKKKKK..KPK",
    "KPK..KPPPPK..KPK",
    "KPK..KPPPPK..KPK",
    "KPK..KKKKKK..KPK",
    "KPK..........KPK",
    "KPKKKKKKKKKKKKPK",
    "KPPPPPPPPPPPPPPK",
    "KPPKPPKPPKPPKPPK",
    "KKKKKKKKKKKKKKKK",
  ],
  // Firma I · Área Blindada: las placas metálicas remachadas
  area_blindada: [
    "KKKKKKKKKKKKKKKK",
    "KXKXXXXKXXXXKXXK",
    "KXXXXXXKXXXXXXXK",
    "KXXKXXXKXXXKXXXK",
    "KKKKKKKKKKKKKKKK",
    "KXXXXKXXXXXXKXXK",
    "KXXXXKXXXXXXXXXK",
    "KXKXXKXXXKXXXXXK",
    "KKKKKKKKKKKKKKKK",
    "KXXKXXXXKXXXXXXK",
    "KXXXXXXXKXXXKXXK",
    "KXXXXKXXKXXXXXXK",
    "KKKKKKKKKKKKKKKK",
  ],
  // Firma A · Muralla: el muro de ladrillos con la pelota rebotando
  muralla: [
    "KKKKKKKKKKK.....",
    "KPPPKPPPKPPK.KK.",
    "KKKKKKKKKKK.KWK.",
    "KPKPPPKPPPKK.KK.",
    "KKKKKKKKKKKK....",
    "KPPPKPPPKPPK..KK",
    "KKKKKKKKKKK..KWK",
    "KPKPPPKPPPKK..KK",
    "KKKKKKKKKKKK....",
    "KPPPKPPPKPPK.KK.",
    "KKKKKKKKKKK.KWK.",
    "KPKPPPKPPPKK.KK.",
    "KKKKKKKKKKKK....",
  ],
  // Firma M · Fortaleza Inexpugnable: la fortaleza con foso y puente levantado
  fortaleza_inexpugnable: [
    "KKK.KKK.KKK.KKK.",
    "KGK.KGK.KGK.KGK.",
    "KKKKKKKKKKKKKKK.",
    "KGGGGGGGGGGGGGK.",
    "KGGKKKKKKKKKGGK.",
    "KGGKNNNNNNNKGGK.",
    "KGGKNKKKKKNKGGK.",
    "KGGKNKGGGKNKGGK.",
    "KGGKNKGGGKNKGGK.",
    "KGGKNNNNNNNKGGK.",
    "KGGGGGGGGGGGGGK.",
    "KKKKKKKKKKKKKKK.",
    "KBBBBBBBBBBBBBK.",
    "KKKKKKKKKKKKKKK.",
  ],
  // Respuesta B · Dominio Aéreo: el águila en picado sobre el balón
  dominio_aereo: [
    "................",
    "KKK........KKK..",
    "KYYKK....KKYYK..",
    "KYYYYKKKKYYYYK..",
    ".KYYYYYYYYYYYK..",
    "..KKYYKKKYYKK...",
    "....KYYYYYK.....",
    "....KKYYYKK.....",
    "......KKK.......",
    "....KKKKKK......",
    "...KWWKKWWK.....",
    "...KWKKKKWK.....",
    "...KWWKKWWK.....",
    "....KKKKKK......",
  ],
  // Respuesta I · Atentos: los dos ojos alerta
  atentos: [
    "................",
    "................",
    "..KKKK...KKKK...",
    ".KWWWWK.KWWWWK..",
    "KWWKKWWKWWKKWWK.",
    "KWKPPKWKWKPPKWK.",
    "KWKPPKWKWKPPKWK.",
    "KWWKKWWKWWKKWWK.",
    ".KWWWWK.KWWWWK..",
    "..KKKK...KKKK...",
    "................",
    "..K..........K..",
    "...K........K...",
  ],
  // Respuesta A · Pelotazo: el cohete con la estela larga
  pelotazo_fuera: [
    "..........KKK...",
    ".........KWWWK..",
    "........KWWWWWK.",
    "KK.....KWWKKWWK.",
    ".KK...KWWWKKWWWK",
    "..KK.KWWWWWWWWK.",
    "KKKKKKWWWWWWWK..",
    ".KKKKKKWWWWWK...",
    "..KKKKKKWWWK....",
    "...KKKKKKWK.....",
    "....KKKKKK......",
    ".....KKKK.......",
  ],
  // Expansión B · Especialistas: la escuadra con la trayectoria que cae en la X
  especialistas: [
    "................",
    "...........KK...",
    "........KKKWWK..",
    "......KKK.KKKK..",
    ".....KK.........",
    "....KK..........",
    "KKKKKKKKKKKK....",
    "KPPPPPPPPPPK....",
    "KPPKKKKKKKKK....",
    "KPPPK...........",
    "KPPPPK...KK..KK.",
    "KPPPPPK...KKKK..",
    "KKKKKKKK...KK...",
    "..........KKKK..",
    ".........KK..KK.",
  ],
  // Expansión I · Estrategia Ensayada: la pizarra con las jugadas a tiza
  estrategia_ensayada: [
    "KKKKKKKKKKKKKK..",
    "KNNNNNNNNNNNNK..",
    "KNKKKKKKKKKKNK..",
    "KNKWK.....WKNK..",
    "KNKWWK...WWKNK..",
    "KNKW.WKKKW.KNK..",
    "KNKW..KWK..KNK..",
    "KNKW.KWKWK.KNK..",
    "KNKWKWK.KWKKNK..",
    "KNKWWK...KWWKK..",
    "KNKKKKKKKKKKNK..",
    "KNNNNNNNNNNNNK..",
    "KKKKKKKKKKKKKK..",
    "..KK......KK....",
  ],
  // Expansión A · La Segunda Ola: el balón que rebota y las dos olas que vuelven por él
  segunda_ola: [
    "................",
    ".....KKKKKK.....",
    "...KKWWWWWWKK...",
    "..KWWKKWWKKWWK..",
    "..KWKWWWWWWKWK..",
    "..KWWKKWWKKWWK..",
    "...KKWWWWWWKK...",
    ".....KKKKKK.....",
    "................",
    "KK...KK...KK...K",
    "KPPKKPPKKKPPKKPP",
    "KPPPPPPPPPPPPPPP",
    "KK.KKKK.KKKK.KKK",
    "KPPKKPPKKKPPKKPP",
    "KPPPPPPPPPPPPPPP",
  ],
  // Convergencia M · Hombre Objetivo: la diana con la silueta de espaldas al centro
  hombre_objetivo: [
    "....KKKKKKKK....",
    "..KKSSSSSSSSKK..",
    ".KSSWWWWWWWWSSK.",
    ".KSWWKKKKKKWWSK.",
    "KSWWKSSSSSSKWWSK",
    "KSWKSSKKKKSSKWSK",
    "KSWKSKPPPPKSKWSK",
    "KSWKSKPPPPKSKWSK",
    "KSWKSSKKKKSSKWSK",
    "KSWWKSSSSSSKWWSK",
    ".KSWWKKKKKKWWSK.",
    ".KSSWWWWWWWWSSK.",
    "..KKSSSSSSSSKK..",
    "....KKKKKKKK....",
  ],
};

/* Los <rect> de cada icono se calculan UNA vez (48 iconos × ~120 píxeles pintados es
   demasiado para rehacerlo en cada render de la pizarra, que dibuja doce a la vez).

   Y con ellos su CAJA REAL (`BOX`). Ese es el truco que hace que los cuarenta y ocho
   se vean del mismo tamaño sin dibujarlos todos del mismo tamaño: la grilla es de
   16×16 pero el dibujo casi nunca la llena — el anzuelo ocupa nueve columnas y la
   muralla las dieciséis. Escalando la GRILLA, el anzuelo salía diminuto y la muralla
   se desbordaba del nodo; escalando la CAJA, los dos ocupan el mismo hueco óptico.
   Además deja el arte futuro a salvo: un icono nuevo se centra solo, sin que nadie
   tenga que contar columnas a mano. */
const RECTS = {}, BOX = {};
for (const name in GRIDS) {
  const r = [];
  let x0 = 16, y0 = 16, x1 = -1, y1 = -1;
  GRIDS[name].forEach((row, y) => {
    for (let x = 0; x < row.length; x++) {
      const c = row[x];
      if (c === ".") continue;
      r.push(`<rect x="${x}" y="${y}" width="1" height="1" fill="${PAL[c] || "#ff00ff"}"/>`);
      if (x < x0) x0 = x; if (x > x1) x1 = x;
      if (y < y0) y0 = y; if (y > y1) y1 = y;
    }
  });
  RECTS[name] = r.join("");
  BOX[name] = { x0, y0, w: x1 - x0 + 1, h: y1 - y0 + 1 };
}

/** Los ids que tienen icono dibujado (lo usan los tests para que ninguno falte). */
export const TRAIT_ICON_IDS = Object.keys(GRIDS);

/** El lado del cuadrado que encierra el dibujo, y la esquina desde donde encuadrarlo. */
function frame(id) {
  const b = BOX[id];
  const side = Math.max(b.w, b.h);
  return { side, vx: b.x0 - (side - b.w) / 2, vy: b.y0 - (side - b.h) / 2 };
}

/**
 * El icono de un rasgo como SVG suelto, para incrustar en HTML. `px` es el lado en
 * píxeles de pantalla. El viewBox se recorta a la caja del dibujo, así que dos iconos
 * pedidos al mismo `px` se ven del mismo tamaño aunque uno llene la grilla y el otro no.
 * Devuelve "" si el rasgo no tiene dibujo: quien lo pide cae al emoji.
 */
export function traitIcon(id, px = 32) {
  if (!RECTS[id]) return "";
  const { side, vx, vy } = frame(id);
  return `<svg viewBox="${vx} ${vy} ${side} ${side}" width="${px}" height="${px}" shape-rendering="crispEdges"
    style="image-rendering:pixelated;display:block;flex-shrink:0">${RECTS[id]}</svg>`;
}

/**
 * El mismo icono como GRUPO SVG ya posicionado, para la pizarra — que es un SVG y no
 * puede anidar un `<svg>` con width/height sin pelearse con su propio viewBox. Se
 * dibuja CENTRADO EN SU CAJA sobre (x, y), ocupando `size` unidades del viewBox del
 * tablero: quien llama solo tiene que saber cuánto hueco le deja la silueta del nodo.
 */
export function traitIconG(id, x, y, size, opacity = 1) {
  if (!RECTS[id]) return "";
  const { side, vx, vy } = frame(id);
  const s = size / side;
  const tx = x - (vx + side / 2) * s, ty = y - (vy + side / 2) * s;
  return `<g transform="translate(${tx.toFixed(2)},${ty.toFixed(2)}) scale(${s.toFixed(4)})"
    opacity="${opacity}" shape-rendering="crispEdges">${RECTS[id]}</g>`;
}
