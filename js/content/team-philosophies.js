/* ============================================================
   content/team-philosophies — la curación de los 16 (arco de
   Filosofía F2, decisión PO #4): filosofía asignada A MANO según
   su fútbol REAL 2025-26 + formación acorde (el PO autorizó
   cambiarles la formación). Vive en content/ y NO en
   data/teams.js (decisión PO: la curación es contenido de juego,
   la base de datos es la base de datos).

   Los 7 Favoritos + 9 Aspirantes del roadmap. El RESTO de los 48
   deriva su filosofía de sus datos (game/philosophy.derivePhilosophy);
   su formación no se toca (bestSix de siempre).

   La formación es una de las 6 de game/lineup.FORMATIONS y es
   UNIFORME por filosofía (el fútbol dicta la forma):
     press → 1-2-2 (cazar arriba con gente)
     posesion → 1-3-1 (dueños del medio)
     contra → 2-2-1 (orden y salida)
     bloque → 3-1-1 (la muralla)
   ============================================================ */

// Formación por filosofía (id de game/lineup.FORMATIONS).
export const FILO_FORMATION = { press: "1-2-2", posesion: "1-3-1", contra: "2-2-1", bloque: "3-1-1" };

/* Por qué cada uno (la curación se defiende o no vale):
   ESP toca (De la Fuente) · ARG controla y presiona tras pérdida (Scaloni) ·
   ENG posesión estructurada (Tuchel) · POR la pelota es suya (Martínez) ·
   NED posesión ordenada (Koeman) · CRO el medio de Modrić · COL el toque de
   James (Lorenzo) · GER presión alta (Nagelsmann) · URU presiona porque
   Bielsa (obvio) · ECU línea alta e intensidad (Beccacece) · KOR la energía
   de siempre, ahora organizada · BRA el de Ancelotti: orden y puñalada
   (Vini/Raphinha al espacio) · FRA Deschamps espera y mata (Mbappé) ·
   MAR el bloque-contra del 2022 (Regragui) · BEL transición con Doku ·
   SWE 4-4-2 directo a los torres (Isak/Gyökeres). */
export const TEAM_PHILOSOPHIES = {
  ESP: "posesion", ARG: "posesion", ENG: "posesion", POR: "posesion",
  NED: "posesion", CRO: "posesion", COL: "posesion",
  GER: "press", URU: "press", ECU: "press", KOR: "press",
  BRA: "contra", FRA: "contra", MAR: "contra", BEL: "contra",
  SWE: "bloque",
};
