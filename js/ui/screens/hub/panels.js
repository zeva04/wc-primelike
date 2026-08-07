/* ============================================================
   ui/screens/hub/panels — LO QUE ABRE UN EDIFICIO.

   Dos edificios no ejecutan su acción al tocarlos: piden una elección más.
     · el CAMPO DE ENTRENAMIENTO → cuál de los 5 focos
     · la SALA DE VIDEO         → cuál de las 4 filosofías (el Plan de partido)
   Los otros cuatro son una sola decisión y se resuelven en el clic.

   Estos paneles entran SOBRE el mapa, no navegan a otra pantalla: la Acción del
   Día se decide sin salir del complejo. El resto (informe del rival, plantilla,
   diario) sí navega, porque no es una decisión del día — es información.

   La regla de balance no vive acá: los multiplicadores del día, qué está
   disponible y qué cuesta salen de game/day-action y content/daily. Este archivo
   solo los viste.
   ============================================================ */
import { DAY_ACTIONS, PLAN_XP_MULT } from "../../../content/daily/day-actions.js";
import { actionMult, multLabel } from "../../../game/day-action.js";
import { getPhilosophy, FILO_LEVELS } from "../../../content/identity/philosophies.js";
import { filoPoints, filoLevel, filoXpMults } from "../../../game/philosophy.js";
import { planPayoff } from "../../../game/traits.js";
import { markerColor } from "../../board.js";
import { S } from "../../session.js";
import { pxIcon } from "../../pixicons.js";

/** El icono pixel de cada foco de entrenamiento (el emoji del contenido no entra acá). */
const ICONO_FOCO = {
  entrenar_ataque: "diana", entrenar_defensa: "escudo", entrenar_pase_corto: "balon",
  entrenar_pase_largo: "flecha", entrenar_velocidad: "energia",
};

/** Cabecera común: icono, título, consigna y la × que cierra. */
const cabecera = (ico, titulo, consigna) => `<div class="px-sheet-head">
  ${pxIcon(ico, 16)}
  <span class="px" style="font-size:11px;letter-spacing:.1em;color:var(--wc-gold-light)">${titulo}</span>
  <span class="px-body" style="font-size:13.5px;letter-spacing:.08em;text-transform:uppercase;color:var(--px-dim)">${consigna}</span>
  <div id="px-sheet-x" class="px-x ml-auto">×</div>
</div>`;

/**
 * EL CAMPO: los cinco focos, uno al lado del otro. Cada uno dice qué stat sube,
 * y el pie repite el precio — que es el mismo para los cinco y por eso se escribe
 * una sola vez en vez de cinco.
 */
export function panelFocos() {
  const focos = DAY_ACTIONS.filter(a => a.group === "entrenar");
  const m = actionMult(S.run, focos[0]);
  if (m === 0) return "";      // el día lo bloqueó: el edificio ya sale con candado
  return `<div class="px-sheet">
    ${cabecera("silbato", "Campo de entrenamiento", "Elegí el foco de la sesión")}
    <div class="flex gap-3 p-4">
      ${focos.map(f => `<div class="px-opt da-opt" data-action="${f.id}" style="flex:1">
        ${pxIcon(ICONO_FOCO[f.id] || "diana", 32)}
        <span class="px text-center" style="font-size:9px;color:var(--px-ink)">${f.label}</span>
        <span class="px-body text-center" style="font-size:12.5px;color:var(--px-dim)">${f.title}</span>
      </div>`).join("")}
    </div>
    <div class="px-body" style="padding:8px 12px;background:var(--px-panel-lo);border-top:2px solid var(--wc-black);font-size:13.5px;color:#a8a8b4">
      ${focos[0].desc}${m !== 1 ? ` · <b style="color:var(--wc-gold-light)">${multLabel(m)} hoy</b>` : ""}
    </div>
  </div>`;
}

/**
 * LA SALA DE VIDEO: la pizarra del Plan de partido. Una fila por filosofía con su
 * nivel, su barra de XP y lo que ese partido rendiría si declarás esa idea.
 *
 * OJO con lo que este panel NO es: acá no se compran rasgos ni se sube nada. Se
 * DECLARA qué fútbol se va a intentar, y eso multiplica la XP que la idea gane
 * jugando. La pizarra de rasgos (que no gasta el día) se abre desde la barra de
 * abajo — decisión PO del 6-ago-2026, para no mezclar lo que cuesta el día con lo
 * que es gratis.
 */
export function panelPlan() {
  const run = S.run;
  const planes = DAY_ACTIONS.filter(a => a.group === "tactica");
  const m = actionMult(run, planes[0]);
  if (m === 0) return "";
  const mults = filoXpMults(run);
  return `<div class="px-sheet" style="background:#0f3320;border-color:var(--wc-black)">
    <div class="px-sheet-head" style="background:#0a2417;border-bottom-color:#17482f">
      ${pxIcon("escudo", 16)}
      <span class="px" style="font-size:11px;letter-spacing:.1em;color:#dff0e5">Pizarra táctica · plan de partido</span>
      <span class="px-body" style="font-size:13.5px;letter-spacing:.06em;text-transform:uppercase;color:rgba(223,240,229,.55)">Declará qué fútbol vamos a jugar</span>
      <div id="px-sheet-x" class="px-x ml-auto" style="background:#0a2417;border-color:#17482f;color:#dff0e5">×</div>
    </div>
    <div style="padding:14px 16px 16px">
      ${planes.map(a => {
        const k = a.id.replace("plan_", "");
        const f = getPhilosophy(k);
        const p = planPayoff(run, k);
        const lvl = filoLevel(run, k);
        const nivel = FILO_LEVELS[lvl], next = FILO_LEVELS[lvl + 1] || null;
        const pts = filoPoints(run, k);
        const pct = next ? Math.min(100, (100 * (pts - nivel.min)) / (next.min - nivel.min)) : 100;
        const rinde = +(mults[k] * (run.planFilo === k ? 1 : PLAN_XP_MULT)).toFixed(2);
        return `<div class="da-opt flex items-center gap-3 cursor-pointer" data-action="${a.id}"
            style="padding:9px 10px;margin-bottom:8px;background:${p.propia ? "rgba(223,240,229,.07)" : "rgba(10,36,23,.45)"};border:2px solid ${p.propia ? "#dff0e5" : "#17482f"}">
          <span style="color:${markerColor(f)};font-size:20px;line-height:1">${f.icon}</span>
          <div style="width:190px">
            <div class="px" style="font-size:11px;letter-spacing:.06em;color:#dff0e5">${f.name}</div>
            <div class="px-body" style="font-size:12.5px;color:rgba(223,240,229,.55);margin-top:2px">${f.lema}</div>
          </div>
          <div class="px" style="font-size:12px;color:var(--wc-gold-light);width:52px">Nv ${lvl + 1}</div>
          <div style="flex:1;height:10px;background:#0a2417;border:2px solid #17482f">
            <div style="width:${pct}%;height:100%;background:#dff0e5"></div>
          </div>
          <div class="px-body text-right" style="width:78px;font-size:12.5px;color:rgba(223,240,229,.6)">${next ? `${pts}/${next.min} XP` : "ya es ley"}</div>
          <div class="px text-right" style="width:44px;font-size:10px;color:var(--wc-gold-light)">×${rinde}</div>
          ${p.propia ? `<span class="px" style="font-size:7px;letter-spacing:.08em;color:#0a2417;background:#dff0e5;padding:3px 5px;border:2px solid #0a2417">Tu escuela</span>` : ""}
        </div>`;
      }).join("")}
      <div class="px-body" style="margin-top:10px;font-size:13.5px;color:rgba(223,240,229,.6)">
        La idea declarada sale más seguido y rinde ×${PLAN_XP_MULT} de experiencia en el próximo partido. Se aprende jugando, no eligiendo.
      </div>
    </div>
  </div>`;
}
