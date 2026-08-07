/* ============================================================
   game/match/sequence-acts — los ACTOS de las Key Sequences:
   constructores de decisión, resolución, escalada y el fallo que
   encadena (rebote / contra / mano a mano). Extraído de
   sequences.js en A2 por presupuesto de líneas — mudanza
   pura, cero cambios de lógica.

   La GENERACIÓN (qué secuencia sale y cuándo) vive en
   sequences.js; acá vive CÓMO se juega una vez que arrancó.
   Contrato §3.2: la decisión `sequence` se crea acá
   (buildActDecision) y se resuelve acá (resolveSequenceAct).
   ── LA CARPETA `acts/` ───────────────────────────
   Este archivo llegó a 1.283 líneas (presupuesto §6: 500) y se
   partió por FAMILIAS DE ACTO, sin tocar una sola regla:
     acts/build.js     construir: circular, salir del área, cambiar
                       el frente, conducir, presionar
     acts/attack.js    llegar y definir: espalda, duelo aéreo,
                       banda, centro, desenlace
     acts/setpiece.js  el balón parado, sus dos caras
     acts/defense.js   defender: salida asfixiada, contención, el
                       remate rival
     acts/chains.js    los desenlaces transversales (rebote, contra,
                       encadenados, cierres)
     acts/block.js     lo que el árbol del Bloque le hace al remate
                       rival
     acts/common.js    los helpers compartidos
   Acá quedan el CONTRATO y los dos despachadores: qué se le
   pregunta al DT y quién resuelve lo que eligió.
   ============================================================ */
import { planOf } from "./acts/common.js";
import * as Build from "./acts/build.js";
import * as Attack from "./acts/attack.js";
import * as Setpiece from "./acts/setpiece.js";
import * as Defense from "./acts/defense.js";

/** Todos los constructores de decisión, por `kind`: cada familia trae los suyos. */
const BUILDERS = { ...Build.BUILDERS, ...Attack.BUILDERS, ...Setpiece.BUILDERS, ...Defense.BUILDERS };

/** Y todos los resolvers, por `kind`. `clear` es el único que no nace de una decisión. */
const RESOLVERS = {
  build: Build.resolveBuild, buildout: Build.resolveBuildout, switch: Build.resolveSwitch,
  carry: Build.resolveCarry, press: Build.resolvePress,
  throughball: Attack.resolveThroughball, duel: Attack.resolveDuel, wing: Attack.resolveWing,
  cross: Attack.resolveCross, finish: Attack.resolveFinish,
  setpiece: Setpiece.resolveSetpiece, defend_sp: Setpiece.resolveDefendSp,
  playout: Defense.resolvePlayout, contain: Defense.resolveContain, clear: Defense.resolveClear,
};

/** Crea la decisión del acto actual según su `kind`. Las opciones son reglas (mapean a
 *  Football Actions); el flavor viene del tipo. */
export function buildActDecision(m) {
  const s = m.seq, kind = planOf(s)[s.actIdx];
  m.decision = { id: "sequence", ...BUILDERS[kind](m, s) };
}

/**
 * Resuelve el acto actual con la opción elegida. Narra, y ESCALA (deja la decisión del acto
 * siguiente) o CIERRA la secuencia (desenlace: gol, erra, corte). Devuelve false (el tick
 * sigue) — como los otros resolvers.
 */
export function resolveSequenceAct(m, key) {
  const s = m.seq;
  m.decision = null;
  const kind = planOf(s)[s.actIdx];
  const f = s.type.flavor;
  return RESOLVERS[kind](m, s, key, f);
}
