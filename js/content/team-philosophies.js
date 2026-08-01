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
   POR la pelota es suya (Martínez) · NED posesión ordenada (Koeman) ·
   COL el toque de James (Lorenzo) · GER presión alta (Nagelsmann) · URU
   presiona porque Bielsa (obvio) · ECU línea alta e intensidad (Beccacece) ·
   BRA el de Ancelotti: orden y puñalada (Vini/Raphinha al espacio) · FRA
   Deschamps espera y mata (Mbappé) · BEL transición con Doku · SWE 4-4-2
   directo a los torres (Isak/Gyökeres).

   REBALANCE DE LA CURACIÓN (sprint del Rival que Decide, 1-ago-2026). F2 había
   dejado el reparto en 7 posesión · 4 press · 4 contra · 1 bloque, y el ciclo de
   counters lo convirtió en un problema medible: los curados SON los 16 de más
   rating, así que son los que llegan al final del cuadro, y la final se jugaba
   contra Posesión el 52% de las veces contra un 3.8% de Bloque. Sobre un campo
   así un ciclo no es un ciclo: Press caza a medio mundo y Bloque es cazado por
   medio mundo (~2.2pp de campeón entre el mejor y el peor pick). Se verificó
   primero que la DERIVACIÓN no alcanzaba —cambiarla movía la final de 52.0% a
   52.3%, nada— porque la punta del cuadro es curada.

   Los cinco cambios, cada uno con su fútbol (ninguno se hizo para cuadrar un
   número; los cinco eran defendibles antes de que hiciera falta):
   · ENG posesión → PRESS. Tuchel ganó una Champions presionando y su Bayern
     igual. Inglaterra con él es un equipo de presión, no un equipo de Guardiola.
   · CRO posesión → BLOQUE. Una Croacia de 2026 construida sobre un Modrić de 40
     no domina 90 minutos: se ordena atrás, vive del oficio y del balón parado.
   · MAR contra → BLOQUE. Lo decía la justificación original con todas las letras
     ("el bloque-contra del 2022"): la semifinal de Regragui fue un bloque bajo.
   · KOR press → CONTRA. "La energía de siempre" describe igual de bien a Son y
     Lee saliendo al espacio que a una presión alta sostenida. Es el más discutible
     de los cinco y el primero que hay que revisar si el PO lo veta.
   · ITA entra a la curación como BLOQUE. Es el no-curado más fuerte (82) y el
     arquetipo mismo del bloque; sin él no había un cuarto Bloque defendible entre
     los 16, y el Bloque se quedaba sin representación en la punta del cuadro.

   Reparto resultante: 5 posesión · 4 press · 4 contra · 4 bloque. */
export const TEAM_PHILOSOPHIES = {
  ESP: "posesion", ARG: "posesion", POR: "posesion", NED: "posesion", COL: "posesion",
  GER: "press", URU: "press", ECU: "press", ENG: "press",
  BRA: "contra", FRA: "contra", BEL: "contra", KOR: "contra",
  SWE: "bloque", CRO: "bloque", MAR: "bloque", ITA: "bloque",
};
