/* La descripción breve de cada selección para el menú. Vive acá y no en
   data/teams.js para no chocar con las ediciones manuales de la base.
   Agregar/editar una selección = una entrada `id: "texto"`. */
export const TEAM_DESC = {
  // CONMEBOL
  ARG: "Los actuales campeones del mundo. Talento, mística y una obsesión: repetir.",
  BRA: "El país del jogo bonito. Talento, creatividad y una tradición única en el fútbol mundial.",
  COL: "Alegría, gambeta y salsa. El poder cafetero que ilusiona a todo un país.",
  ECU: "Juventud, altura y una defensa de hierro. La \"Tri\" se hace presente.",
  PAR: "La Albirroja guaraní. Orden y sacrificio: un rival incómodo.",
  URU: "La garra charrúa. Un país entero que juega cada pelota como si fuera la última.",
  // UEFA
  ENG: "La cuna del fútbol y una generación para soñar. Hambre de gloria tras años de espera.",
  ESP: "Actual campéon de Europa. La \"Roja\" llega con una generación renovada liderada por la nueva joya del fútbol.",
  FRA: "Campeones y finalistas, una fábrica inagotable de cracks. Quizás el plantel más temible del planeta.",
  GER: "La Mannschaft: cuatro estrellas bordadas y una maquinaria que compite hasta el último minuto.",
  NED: "La Naranja Mecánica: herederos del fútbol total, talento y una tradición que disfruta jugar bonito.",
  NOR: "Generación dorada de Los Vikingos. La sorpresa nórdica que mete miedo.",
  POR: "Talento de sobra y una camada brillante. La búsqueda de la gloria más allá de una leyenda.",
  AUT: "Intensidad de escuela Red Bull: corren más que vos noventa minutos. Alaba y Arnautović cierran su ciclo.",
  BEL: "Los Diablos Rojos llegaron a cuartos con el cuarto mejor ataque del Mundial. De Bruyne todavía manda.",
  BIH: "Los Dragones: bloque cerrado y pelota parada. Džeko sigue siendo el faro a los cuarenta.",
  CRO: "Ajedrez a cuadros. Modrić capitaneó su quinto Mundial y les dejó el mando a Baturina y los Sučić.",
  CZE: "Orden centroeuropeo y juego aéreo. Un plantel criado en el Slavia y el Sparta que muerde de contra.",
  SCO: "La Tartan Army. Defienden como si les fuera la vida y viven de una pelota parada de McTominay.",
  SUI: "Llegaron a cuartos con once nombres que no se movieron nunca. Precisión suiza, literal.",
  SWE: "Dos nueves de elite mundial —Isak y Gyökeres— y un país entero rezando para que les llegue la pelota.",
  TUR: "Pasión de Estambul y la mejor camada turca en décadas: Güler, Yıldız y un Çalhanoğlu que reparte.",
  // CONCACAF
  CAN: "Una generación dorada e inédita, anfitriona del Mundial. Hambre de demostrar que llegó para quedarse.",
  MEX: "Pasión, historia y la afición más caliente del continente. El anfitrión del mundial quiere la copa en casa.",
  USA: "Juventud, energía y el envión de ser locales. Un proyecto de fútbol serio que crece a pasos agigantados.",
  CUW: "150.000 habitantes: el país más chico que se clasificó jamás. Once tipos criados en Holanda contra el mundo.",
  HAI: "Volvieron al Mundial 52 años después. Un país que no tiene nada y que igual llegó. Ganar acá sería un milagro.",
  PAN: "La Marea Roja. Tres Mundiales seguidos rozando el golpe: Panamá ya no viene a participar.",
  // CAF
  CPV: "Los Tiburones Azules: la isla que sueña en grande. Orgullo y entrega muy por encima de su tamaño.",
  MAR: "Los Leones del Atlas que llegaron a semis y cambiaron la historia. Solidez, corazón y jerarquía.",
  SEN: "Físico, talento y jerarquía de campeón de África. Los Leones de la Teranga pegan fuerte.",
  ALG: "Los Zorros del Desierto. Mahrez sigue inventando por derecha y atrás hay oficio europeo de sobra.",
  CIV: "Los Elefantes, campeones de África. Kessié en el medio es un país entero empujando.",
  COD: "Los Leopardos: dos metros de defensa y Wissa arriba. Nueve de cada diez pelotas terminan en él.",
  EGY: "Los Faraones. La segunda mejor africana del Mundial: cinco titulares del Al Ahly y Salah de faro.",
  GHA: "Las Estrellas Negras. Defienden como pocos; el problema siempre fue meterla.",
  RSA: "Bafana Bafana: cuatro goles en contra en todo el Mundial. Un bloque criado en el Sundowns.",
  TUN: "Las Águilas de Cartago vuelven tras el peor Mundial de su historia. Nadie espera nada: perfecto.",
  // AFC
  JPN: "Precisión, técnica y una generación sembrada en las mejores ligas. El proyecto más serio de Asia.",
  KOR: "Disciplina, velocidad y un motor que no se apaga nunca. La potencia asiática que jamás se rinde.",
  IRN: "Team Melli: la única selección que no perdió un partido y se fue igual. Bloque de hierro, gol escaso.",
  IRQ: "Los Leones de Mesopotamia. Volvieron al Mundial tras 40 años y les pasaron por encima. Ahora empieza de nuevo.",
  JOR: "Los Guerreros de Nashama en su primer Mundial. Once nombres que no se movieron y Al-Taamari por afuera.",
  KSA: "Los Halcones Verdes. Al-Dawsari sigue siendo el que se atreve cuando nadie más se anima.",
  QAT: "El granate de Al Sadd. Afif inventa, Khoukhi aguanta, y el resto es una apuesta de país entero.",
  UZB: "Primer Mundial de los Lobos Blancos. Khusanov atrás, Shomurodov arriba y una generación por escribir.",
  // OFC
  AUS: "Los Socceroos: puro pulmón y corazón. Nunca dan una pelota por perdida.",
  NZL: "Los All Whites: físico y entrega desde un confín del mundo. Quiere dejar su nombre en la historia.",
};

/** Descripción breve de una selección (o un texto neutro si falta). */
export function teamDesc(id) {
  return TEAM_DESC[id] || "Una selección con la ilusión de dar el golpe en el Mundial.";
}
