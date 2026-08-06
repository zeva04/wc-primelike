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
  // CONCACAF
  CAN: "Una generación dorada e inédita, anfitriona del Mundial. Hambre de demostrar que llegó para quedarse.",
  MEX: "Pasión, historia y la afición más caliente del continente. El anfitrión del mundial quiere la copa en casa.",
  USA: "Juventud, energía y el envión de ser locales. Un proyecto de fútbol serio que crece a pasos agigantados.",
  // CAF
  CPV: "Los Tiburones Azules: la isla que sueña en grande. Orgullo y entrega muy por encima de su tamaño.",
  MAR: "Los Leones del Atlas que llegaron a semis y cambiaron la historia. Solidez, corazón y jerarquía.",
  SEN: "Físico, talento y jerarquía de campeón de África. Los Leones de la Teranga pegan fuerte.",
  // AFC
  JPN: "Precisión, técnica y una generación sembrada en las mejores ligas. El proyecto más serio de Asia.",
  KOR: "Disciplina, velocidad y un motor que no se apaga nunca. La potencia asiática que jamás se rinde.",
  // OFC
  AUS: "Los Socceroos: puro pulmón y corazón. Nunca dan una pelota por perdida.",
  NZL: "Los All Whites: físico y entrega desde un confín del mundo. Quiere dejar su nombre en la historia.",
};

/** Descripción breve de una selección (o un texto neutro si falta). */
export function teamDesc(id) {
  return TEAM_DESC[id] || "Una selección con la ilusión de dar el golpe en el Mundial.";
}
