/* ============================================================
   dev/deeplink — MONTAR UN ESTADO DEL JUEGO DESDE LA URL.

   Existe por una razón concreta: verificar la UI a ojo. Hasta ahora, para ver
   una pantalla concreta había que inyectar JavaScript en la página desde fuera
   (importar los módulos, armar la run a mano, `location.reload()` para recoger
   los cambios de archivo). Ese camino es FRÁGIL con cualquier automatización de
   navegador:

     · `location.reload()` destruye el contexto de ejecución MIENTRAS la llamada
       está en vuelo, así que la respuesta se pierde y la herramienta expira;
     · después del reload la extensión tarda en re-inyectarse, y todo lo que se
       pida en esa ventana también expira;
     · reintentar dentro de esa ventana la alarga en vez de arreglarla.

   Con un deep-link la verificación vuelve a ser lo que debería: NAVEGAR a una
   URL y sacar la captura. Dos pasos, sin inyección, sin reload, sin carrera.

   Solo se activa SERVIDO EN LOCAL (localhost / 127.0.0.1 / file://): en cualquier
   otro origen el import ni siquiera ocurre (ver main.js), así que no hay forma de
   montar estados arbitrarios en una partida publicada.

   ── Cómo se usa ──────────────────────────────────────────────────────────────
     ?dev=philosophy&team=BRA&filo=press&nivel=10&pi=12&node=angriffpressing
     ?dev=hub&team=ARG&filo=bloque
     ?dev=philosophy&filo=contra&view=posesion&traits=buen_pie,tercer_hombre
     ?dev=partido&team=ARG&filo=contra&nivel=3&min=67

   | parámetro | qué hace                                                        |
   |-----------|-----------------------------------------------------------------|
   | `dev`     | pantalla a abrir (nombre de ui/nav). Obligatorio.                |
   | `team`    | código FIFA de 3 letras. Por defecto BRA.                        |
   | `filo`    | identidad elegida (press · posesion · contra · bloque).          |
   | `view`    | en `philosophy`, qué ÁRBOL mirar (puede no ser el que jugás).     |
   | `nivel`   | 1..10 de la filosofía activa — se traduce a la XP de ese piso.   |
   | `pi`      | Puntos de Identidad disponibles.                                 |
   | `traits`  | ids de rasgos ya comprados, separados por coma.                  |
   | `node`    | en `philosophy`, abre la ficha de ese rasgo en el riel.          |
   | `onb`     | `1` para el modo ONBOARDING de la pizarra.                       |
   | `anim`    | `1` para NO congelar las animaciones (por defecto se congelan).   |
   | `dia`     | `partido` salta al día del partido (el hub cambia de cara ahí).   |
   | `min`     | en `partido`, adelanta el reloj hasta ese minuto — o `ht`.       |
   | `dec`     | en `partido`, sigue hasta que se abra una DECISIÓN (máx. 20' más). |

   ── `dev=partido` ────────────────────────────────────────────────────────────
   No es una pantalla de `ui/nav`: el partido necesita un once y un rival, así que
   el deep-link los deriva igual que el hub (currentLineup + nextOpponentId) y
   arranca `start-match`. Recién montado, ese partido está 0-0 al minuto 0 y el
   relato, el momentum y el mapa de calor están VACÍOS — o sea, no se parece a
   nada de lo que hay que verificar. Para eso está `min`: adelanta el reloj de
   golpe (sin esperar los 2s por minuto) resolviendo por el camino cada decisión
   con su PRIMERA opción —siempre la misma, para que dos capturas del mismo link
   se parezcan— y frena en el minuto pedido. Con `dec=1` sigue un poco más, hasta
   que se abra una decisión: son los dos estados de la pantalla, el minuto
   corriendo y la decisión abierta. `min=ht` frena en el entretiempo, que es el
   tercer estado y no tiene número propio (cae en el 45 más lo que sortee el
   descuento).

   ── La señal de listo ────────────────────────────────────────────────────────
   Al terminar marca `<html data-dev-ready="philosophy">` y `window.__devReady`.
   Quien automatice debe ESPERAR ese atributo en vez de dormir un rato fijo: es
   la diferencia entre una captura determinista y una carrera. Si algo falla,
   marca `data-dev-error` con el motivo, y el motivo se ve en pantalla.
   ============================================================ */
import { newRun } from "../game/run.js";
import { getTeam } from "../data/teams-repo.js";
import { applyTeamColors } from "../ui/theme.js";
import { choosePhilosophy } from "../game/philosophy.js";
import { currentLineup } from "../game/lineup.js";
import { nextOpponentId } from "../game/tournament/knockout.js";
import { FILO_LEVELS } from "../content/identity/philosophies.js";
import { traitById } from "../content/traits/index.js";
import { S } from "../ui/session.js";
import { go } from "../ui/nav.js";
import { devFastForward } from "../ui/screens/match/index.js";

const q = new URLSearchParams(location.search);

/**
 * CONGELA las transiciones. Un deep-link se abre para mirar un ESTADO FINAL, y
 * media pantalla de esta UI entra animada: el riel del pizarrón se desliza en
 * 420ms, la cámara del tablero hace zoom en 500ms, los nodos laten en bucle. Una
 * captura disparada en ese medio segundo sale con el panel a mitad de camino y
 * parece un bug de maquetación que no existe. Con `&anim=1` se deja correr.
 */
function freezeAnimations() {
  const css = document.createElement("style");
  css.textContent = `*, *::before, *::after {
    transition: none !important; animation: none !important;
    scroll-behavior: auto !important;
  }`;
  document.head.appendChild(css);
}

/** Deja la señal que espera la automatización (y la deja VISIBLE si es un error). */
function signal(ok, detail) {
  document.documentElement.setAttribute(ok ? "data-dev-ready" : "data-dev-error", detail);
  window.__devReady = ok;
  if (!ok) console.error(`[deeplink] ${detail}`);
}

export function bootDeepLink() {
  const screen = q.get("dev");
  if (!screen) return false;              // sin ?dev el juego arranca normal

  try {
    if (q.get("anim") !== "1") freezeAnimations();
    const run = (S.run = newRun((q.get("team") || "BRA").toUpperCase()));
    // Los colores del equipo son variables CSS que setea el flujo de inicio. Sin esto
    // el deep-link pinta TODO con el oro por defecto y la captura miente sobre el color
    // real de la pantalla (`--team-primary` es lo que marca "esto lo elegiste vos").
    applyTeamColors(getTeam(run.teamId));

    const filo = q.get("filo");
    if (filo) {
      if (!choosePhilosophy(run, filo)) throw new Error(`filosofía desconocida "${filo}"`);
      // choosePhilosophy regala el PI inicial; si el link pide un número, manda el link.
      const nivel = +q.get("nivel");
      if (nivel >= 1 && nivel <= 10) run.filoXp = { ...run.filoXp, [filo]: FILO_LEVELS[nivel - 1].min };
    }

    if (q.has("pi")) run.identityPoints = Math.max(0, +q.get("pi") || 0);

    const traits = (q.get("traits") || "").split(",").filter(Boolean);
    for (const id of traits) {
      const t = traitById(id);
      if (!t) throw new Error(`rasgo desconocido "${id}"`);
      // Se INYECTAN sin pasar por buyTrait: el deep-link monta un estado para mirarlo,
      // no simula la compra (si no, no se podría montar un árbol que la run no permite).
      run.rasgos = { ...run.rasgos, [t.filo]: [...(run.rasgos?.[t.filo] || []), id] };
    }

    // Saltar al día del partido: se mueve el CALENDARIO, no un flag de UI, para que la
    // pantalla derive su estado igual que en una partida real (isMatchDay sale de ahí).
    if (q.get("dia") === "partido" || screen === "partido") run.day = run.nextMatchDay;

    // EL PARTIDO no es una pantalla de nav: necesita un once y un rival. Se derivan
    // igual que en el hub —mismas funciones, mismo camino— y recién ahí se arranca.
    if (screen === "partido") {
      ({ lineup: S.selectedLineup, formationId: S.formation } = currentLineup(run.squad, S.selectedLineup, S.formation));
      go("start-match", nextOpponentId(run));
      const min = q.get("min") === "ht" ? "ht" : +q.get("min");
      if (min === "ht" || min > 0) devFastForward(min, q.get("dec") === "1");
      signal(true, screen);
      return true;
    }

    const opts = {};
    if (q.get("view")) opts.view = q.get("view");
    if (q.get("onb") === "1") opts.onboarding = true;
    const node = q.get("node");
    go(screen, opts, node || null);

    // `node` abre "lo que se pueda abrir" en esa pantalla, y cada una lo hace a su
    // manera: la pizarra lo recibe como argumento del render, y el hub abre su
    // edificio con un clic real (así se ejerce el mismo camino que el jugador). Si
    // ninguna de las dos enganchó, lo decimos en vez de fingir que salió.
    if (node && !document.querySelector(".tb-rail.open")) {
      const plot = document.querySelector(`[data-plot="${node}"]`);
      if (plot) plot.click();
      else throw new Error(`la pantalla "${screen}" no abrió "${node}"`);
    }
    signal(true, screen);
  } catch (e) {
    signal(false, e.message);
    document.getElementById("app").innerHTML =
      `<div class="text-center mt-20 text-red-400 font-mono text-sm">
        ❌ deep-link inválido<br><span class="text-red-300">${e.message}</span>
        <div class="text-slate-500 mt-4 text-xs">Ver js/dev/deeplink.js para los parámetros.</div>
      </div>`;
  }
  return true;
}
