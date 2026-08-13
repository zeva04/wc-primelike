/* ============================================================
   ui/session — estado mutable de la sesión de juego en la UI.
   Un único objeto compartido (S) que las pantallas leen y
   escriben. Aquí NO hay reglas: solo referencias vivas.
   ============================================================ */

export const S = {
  run: null,            // estado de la run actual (Engine.newRun)
  slot: null,           // ranura de guardado a la que pertenece esa run (0..2) o null si no hay ninguna
                        // (deep-link de desarrollo). La escribe ui/save.js; nadie más la toca.
  match: null,          // partido interactivo en curso (Engine.Match)
  matchCtx: null,       // contexto del partido: {team, lineup, bench, mentalidad, buffs}
  selectedLineup: [],   // titulares elegidos (refs al plantel), ORDENADOS por los slots de la formación
  formation: null,      // id de la formación elegida (ej. "2-1-2"); define el puesto de cada slot
  timer: null,          // setInterval del relato del partido
  paused: false,        // pausa manual del usuario
  // EL ENTRETIEMPO (bug fix,): también deja `timer` en null (stopTimer), y
  // eso es indistinguible de una pausa manual para quien solo mira `!S.timer` — la
  // pizarra de la altura (screens/match/tactics.js) lo hacía y reanudaba el partido
  // solo al cerrar, dejando el botón "Continuar el partido" del entretiempo vivo pero
  // mintiendo sobre el estado real. Esta bandera es la única fuente de "estamos en el
  // entretiempo, y el ÚNICO botón que reanuda es el dedicado".
  halftime: false,
  speed: 1,             // ritmo del relato: 1 = crucero (ráfaga entre secuencias) · 2 = más rápido
  feedRendered: 0,      // nº de líneas del relato ya pintadas
};
