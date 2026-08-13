/* ============================================================
   ui/save — LA RANURA DE ESTA SESIÓN: quién guarda, cuándo y dónde.

   `storage/saves.js` sabe escribir una ranura; `ui/session.js` sabe cuál es la run
   viva. Falta el pegamento, y va acá porque la regla §4 de ARQUITECTURA lo obliga:
   **`game/**` no puede importar `storage/`** — el motor no decide cuándo persistir,
   lo decide quien orquesta la sesión. Este archivo es ese "quien".

   ── CUÁNDO se guarda (decisión PO) ───────────────────────────────────────────
   Al TERMINAR CADA DÍA, y en ningún otro momento. Son tres llamadas en todo el
   juego:

     · screens/draw    "Comenzar la aventura →"  ← nace la ranura con el día 1
     · hub/index       pasarDia()                ← el día que se cierra, se escribe
     · screens/end     endRun()                  ← el desenlace queda en la ranura

   La consecuencia hay que tenerla clara y es aceptada: lo que pase DENTRO de un día
   (comprar rasgos, canjear un buff, jugar el partido) no está guardado hasta que ese
   día termina. Por eso cerrar la pestaña al minuto 67 devuelve al hub del día del
   partido — que además es lo único posible, porque la instancia `Match` no es
   serializable (ARQUITECTURA §3.1).

   Sin ranura activa (`S.slot === null`) todo esto es un no-op silencioso: es el caso
   del deep-link de desarrollo, que monta estados arbitrarios y no debe pisar las
   partidas de nadie.
   ============================================================ */
import { getTeam } from "../data/teams-repo.js";
import { readSlot, writeSlot, clearSlot } from "../storage/saves.js";
import { S } from "./session.js";
import { applyTeamColors } from "./theme.js";

/** Ata la sesión a una ranura: lo que se juegue a partir de ahora se escribe ahí. */
export function usarRanura(i) { S.slot = i; }

/** Suelta la ranura (volver al título / al menú principal): deja de autoguardarse. */
export function soltarRanura() { S.slot = null; }

/**
 * Escribe la run viva en su ranura. `fin` la marca como terminada.
 * Devuelve false si no había ranura o el navegador rechazó la escritura — quien
 * llama decide si eso merece un aviso (el fin de run sí; un día cualquiera no).
 */
export function autoguardar(fin = null) {
  if (S.slot == null || !S.run) return false;
  return writeSlot(S.slot, S.run, fin);
}

/**
 * Carga una ranura en la sesión y la deja lista para `go("hub")`.
 *
 * El reseteo de `selectedLineup`/`formation` NO es higiene: `S.selectedLineup`
 * guarda REFERENCIAS a objetos de `run.squad`, y el run que sale de localStorage es
 * un árbol de objetos NUEVO (JSON.parse). Conservar las referencias viejas dejaría
 * un once apuntando a jugadores de la partida anterior. Vacío, el hub lo rearma solo
 * con `currentLineup`.
 *
 * Devuelve la ranura leída, o null si estaba vacía / era de otra versión.
 */
export function cargarRanura(i) {
  const rec = readSlot(i);
  if (!rec || rec.incompatible) return null;
  S.run = rec.run;
  S.slot = i;
  S.match = null;
  S.matchCtx = null;
  S.selectedLineup = [];
  S.formation = null;
  S.paused = false;
  S.halftime = false;
  S.feedRendered = 0;
  applyTeamColors(getTeam(rec.run.teamId));
  return rec;
}

/** Borra una ranura y, si era la que se estaba jugando, corta el vínculo. */
export function borrarRanura(i) {
  const ok = clearSlot(i);
  if (S.slot === i) soltarRanura();
  return ok;
}
