/* ============================================================
   ui/session — estado mutable de la sesión de juego en la UI.
   Un único objeto compartido (S) que las pantallas leen y
   escriben. Aquí NO hay reglas: solo referencias vivas.
   ============================================================ */

export const S = {
  run: null,            // estado de la run actual (Engine.newRun)
  match: null,          // partido interactivo en curso (Engine.Match)
  matchCtx: null,       // contexto del partido: {team, lineup, bench, mentalidad, buffs}
  selectedLineup: [],   // titulares elegidos (refs al plantel), ORDENADOS por los slots de la formación
  formation: null,      // id de la formación elegida (ej. "2-1-2"); define el puesto de cada slot
  timer: null,          // setInterval del relato del partido
  paused: false,        // pausa manual del usuario
  speed: 1,             // ritmo del relato: 1 = crucero (ráfaga entre secuencias) · 2 = más rápido
  feedRendered: 0,      // nº de líneas del relato ya pintadas
};
