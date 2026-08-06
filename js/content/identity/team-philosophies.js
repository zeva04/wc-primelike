/* La curación de los 16: filosofía asignada A MANO según su fútbol real, con la
   formación que le corresponde. Vive en content/ y no en data/teams.js — la
   curación es contenido de juego, la base de datos es la base de datos.

   El resto de los 48 deriva su filosofía de sus datos
   (game/philosophy.derivePhilosophy) y conserva su formación. */

// Formación por filosofía (id de game/lineup.FORMATIONS).
export const FILO_FORMATION = { press: "1-2-2", posesion: "1-3-1", contra: "2-2-1", bloque: "3-1-1" };

/* El fútbol real detrás de cada una: ESP toca (De la Fuente) · ARG controla y
   presiona tras pérdida (Scaloni) · POR la pelota es suya (Martínez) · NED
   posesión ordenada (Koeman) · COL el toque de James (Lorenzo) · GER presión alta
   (Nagelsmann) · URU presiona porque Bielsa · ECU línea alta (Beccacece) · ENG el
   Tuchel que ganó una Champions presionando · BRA el Ancelotti de orden y puñalada
   (Vini/Raphinha al espacio) · FRA Deschamps espera y mata (Mbappé) · BEL
   transición con Doku · KOR Son y Lee saliendo al espacio · CRO se ordena atrás
   sobre un Modrić de 40 · MAR el bloque bajo de la semi de Regragui · ITA el
   arquetipo del bloque.

   El REPARTO importa tanto como cada elección: los curados son los 16 de más
   rating, así que son los que llegan al final del cuadro. Si una identidad domina
   la punta, el ciclo de counters deja de ser un ciclo (con 7 posesión · 1 bloque,
   la final se jugaba contra Posesión el 52% de las veces). Hoy: 5 posesión ·
   4 press · 4 contra · 4 bloque — mantenerlo parejo al editar. */
export const TEAM_PHILOSOPHIES = {
  ESP: "posesion", ARG: "posesion", POR: "posesion", NED: "posesion", COL: "posesion",
  GER: "press", URU: "press", ECU: "press", ENG: "press",
  BRA: "contra", FRA: "contra", BEL: "contra", KOR: "contra",
  SWE: "bloque", CRO: "bloque", MAR: "bloque", ITA: "bloque",
};
