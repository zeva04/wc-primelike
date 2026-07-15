/* ============================================================
   ui/session — estado mutable de la sesión de juego en la UI.
   Un único objeto compartido (S) que las pantallas leen y
   escriben. Aquí NO hay reglas: solo referencias vivas.
   ============================================================ */

export const S = {
  run: null,            // estado de la run actual (Engine.newRun)
  match: null,          // partido interactivo en curso (Engine.Match)
  matchCtx: null,       // contexto del partido: {team, lineup, bench, mentalidad, buffs}
  selectedLineup: [],   // titulares elegidos en el hub (refs al plantel)
  timer: null,          // setInterval del relato del partido
  paused: false,        // pausa manual del usuario
  speed: 1,             // velocidad del relato (x1 / x2)
  feedRendered: 0,      // nº de líneas del relato ya pintadas
};
