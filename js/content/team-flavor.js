/* ============================================================
   content/team-flavor — la breve descripción de cada selección
   para el menú de selección (reemplaza al texto de dificultad).
   Datos + flavor, cero reglas (ARQUITECTURA §3): vive acá y no en
   data/teams.js para no chocar con las ediciones manuales del PO.

   Agregar/editar una selección = una entrada `id: "texto"`.
   ============================================================ */
export const TEAM_DESC = {
  // CONMEBOL
  ARG: "Los campeones del mundo. Talento, mística y una obsesión: que la gloria no sea de una sola vez.",
  BRA: "El país del jogo bonito. Talento, creatividad y una tradición única en el fútbol mundial.",
  COL: "Alegría, gambeta y una camada que vuelve a ilusionar a todo un país. El poder cafetero está de regreso.",
  ECU: "Juventud, altura y una defensa de fierro. La Tri que incomoda a los grandes.",
  PAR: "Garra guaraní, orden y sacrificio. Un rival incómodo para cualquiera.",
  URU: "La garra charrúa hecha selección. Un país entero que juega cada pelota como si fuera la última.",
  // UEFA
  ENG: "La cuna del fútbol y una generación para soñar. Hambre de gloria tras años de espera.",
  FRA: "Campeones y finalistas, una fábrica inagotable de cracks. Quizás el plantel más temible del planeta.",
  NOR: "Haaland, Ødegaard y una generación irrepetible. La sorpresa nórdica que mete miedo.",
  POR: "Talento de sobra y una camada brillante. La búsqueda de la gloria más allá de una leyenda.",
  // CONCACAF
  CAN: "Una generación dorada e inédita, anfitriona del Mundial. Hambre de demostrar que llegó para quedarse.",
  MEX: "Pasión, historia y la afición más caliente del continente. El gigante de Concacaf va por el quinto partido.",
  USA: "Juventud, energía y el envión de jugar en casa. Un fútbol que crece a pasos agigantados.",
  // CAF
  CPV: "Los Tiburones Azules: la isla que sueña en grande. Orgullo y entrega muy por encima de su tamaño.",
  MAR: "Los Leones del Atlas que llegaron a semis y cambiaron la historia. Solidez, corazón y jerarquía.",
  SEN: "Físico, talento y jerarquía de campeón de África. Los Leones de la Teranga pegan fuerte.",
  // AFC
  JPN: "Precisión, técnica y una generación criada en las mejores ligas. El proyecto más serio de Asia.",
  KOR: "Disciplina, velocidad y un motor que no se apaga nunca. La potencia asiática que jamás se rinde.",
  // OFC
  AUS: "Los Socceroos: puro pulmón y corazón. Nunca dan una pelota por perdida.",
  NZL: "Los All Whites: físico y entrega desde el fin del mundo. La cenicienta de Oceanía.",
};

/** Descripción breve de una selección (o un texto neutro si falta). */
export function teamDesc(id) {
  return TEAM_DESC[id] || "Una selección con la ilusión de dar el golpe en el Mundial.";
}
