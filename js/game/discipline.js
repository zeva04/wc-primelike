/* ============================================================
   game/discipline — tarjetas acumuladas y sanciones del torneo.
   Las reglas están explicadas en docs/CORE.md §9.
   (Las faltas DENTRO del partido viven en match/incidents.js;
   aquí vive lo que trasciende un partido.)
   ============================================================ */
import { addJournal } from "./journal.js";

/**
 * Parte disciplinaria del cierre de partido para UN jugador.
 * Expulsión → suspendido el siguiente; el que ya cumplió, vuelve.
 * Amarillas: la amonestación del partido se acumula en el torneo; 2 acumuladas =
 * suspensión de 1 partido y el contador vuelve a cero (la doble amarilla en un
 * mismo partido cuenta como roja y NO suma al acumulado, como en la FIFA real).
 */
export function applyDisciplinePostMatch(run, p) {
  if (p.expulsado) {
    p.suspendido = true;
    addJournal(run, { icon: "🟥", tone: "bad", title: `${p.name} suspendido`, desc: "La expulsión le cuesta el próximo partido." });
  } else if (p.suspendido) {
    p.suspendido = false;
  } else if (p.amarillaPartido === 1) {
    p.amarillas = (p.amarillas || 0) + 1;
    if (p.amarillas >= 2) {
      p.amarillas = 0;
      p.suspendido = true;
      addJournal(run, { icon: "🟨", tone: "bad", title: `${p.name} suspendido por acumulación`, desc: "Segunda amarilla del torneo: se pierde el próximo partido." });
    }
  }
  p.expulsado = false;
  p.amarillaPartido = 0;
}

/**
 * Borra las amarillas ACUMULADAS de todo el plantel (regla FIFA adaptada: al terminar
 * la fase de grupos y al terminar los cuartos de final). Las suspensiones ya ganadas
 * NO se perdonan: la tarjeta se limpia, el castigo pendiente se cumple igual.
 * Devuelve cuántos jugadores limpiaron tarjeta.
 */
export function clearAmarillas(run, motivo) {
  const conTarjeta = run.squad.filter(p => p.amarillas > 0);
  for (const p of conTarjeta) p.amarillas = 0;
  if (conTarjeta.length) {
    addJournal(run, { icon: "🧽", tone: "good", title: "Borrón y cuenta nueva", desc: `${motivo}: se limpian las amarillas de ${conTarjeta.map(p => p.name).join(", ")}.` });
  }
  return conTarjeta.length;
}
