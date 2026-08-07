/* ============================================================
   game/oxidation — la regla de la OXIDACIÓN: el espejo de la banda verde.
   Un plantel que pasa días de preparación sin Entrenar ni
   Sesión Táctica se oxida — rinde menos en el próximo partido.

   La racha vive en `run.diasSinEntrenar` y se estampa como
   `p.oxid` (el multiplicador, match/powers.oxidMult) en TODO el
   plantel: así entra a effStat por el mismo caño que la energía,
   y el rival —que nunca tiene el campo— queda en ×1.

   Qué RESETEA: Entrenar, Sesión Táctica, el
   cambio de identidad (el día se va en reinstalar ideas: es
   trabajo táctico) y JUGAR ("jugar es ritmo" — flow la resetea
   al cierre del partido, DESPUÉS de que el partido se jugó con
   la racha acumulada: llegas oxidado, jugar te devuelve el
   ritmo). Nada más: ni Bonding ni Oportunidades.
   La curva y sus umbrales viven en match/powers (§CORE Energía).
   ============================================================ */
import { oxidMult, OXID_THRESHOLD } from "./match/powers.js";
import { addJournal } from "./journal.js";

/** Estampa el multiplicador vigente en todo el plantel (banco incluido: la racha es del equipo). */
function stamp(run) {
  const m = oxidMult(run.diasSinEntrenar);
  for (const p of run.squad) p.oxid = m;
}

/**
 * Registra el día para la racha de oxidación: `trabaja` (Entrenar/Táctica/cambio de
 * identidad) la resetea; cualquier otra acción del día suma un día sin entrenar.
 * La PRIMERA vez en la run que la racha cruza el umbral, el diario narra el episodio
 * (riesgo declarado del arco: el jugador nuevo tiene que entender por qué rinde menos).
 */
export function trackOxidacion(run, trabaja) {
  const prev = run.diasSinEntrenar || 0;
  run.diasSinEntrenar = trabaja ? 0 : prev + 1;
  stamp(run);
  if (!trabaja && prev < OXID_THRESHOLD && run.diasSinEntrenar >= OXID_THRESHOLD && !run.oxidNarrada) {
    run.oxidNarrada = true;
    addJournal(run, {
      icon: "⚙️", tone: "bad", title: "El plantel está pasado de descanso",
      desc: `${run.diasSinEntrenar} días sin entrenar ni trabajar táctica: el equipo pierde filo (−${Math.round((1 - oxidMult(run.diasSinEntrenar)) * 100)}% de rendimiento, y empeora si la racha sigue). Se recupera entrenando — o jugando: el partido devuelve el ritmo.`,
    });
  }
}

/** El partido devuelve el ritmo ("jugar es ritmo"): lo llama flow al cierre, cuando el partido ya se jugó oxidado. */
export function resetOxidacion(run) {
  run.diasSinEntrenar = 0;
  stamp(run);
}

/** Estado para la UI: racha, multiplicador y si el óxido ya muerde (hub, plantilla). */
export function oxidState(run) {
  const racha = run.diasSinEntrenar || 0;
  return { racha, mult: oxidMult(racha), oxidado: racha >= OXID_THRESHOLD };
}
