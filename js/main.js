/* ============================================================
   Punto de entrada del juego (composición, nada más).

   Cada pantalla se registra en ui/nav al importarse; aquí solo
   se validan los datos y se abre la PORTADA (el título y las
   tres ranuras de partida guardada; el menú de selección de
   equipo pasó a ser el segundo paso, dentro de una ranura
   nueva). Los <script type="module"> corren con el DOM ya
   parseado: sin DOMContentLoaded.
   ============================================================ */
import { WC_DATA } from "../data/teams.js";
import { go } from "./ui/nav.js";
// Pantallas: el import las registra en nav (orden irrelevante)
import "./ui/screens/saves.js";
import "./ui/screens/menu.js";
import "./ui/screens/history.js";
import "./ui/screens/identity.js";
import "./ui/screens/draw.js";
import "./ui/screens/hub/index.js";
import "./ui/screens/philosophy.js";
import "./ui/screens/squad.js";
import "./ui/screens/worldcup.js";
import "./ui/screens/scorers.js";
import "./ui/screens/journal.js";
import "./ui/screens/match/index.js";
import "./ui/screens/shootout.js";
import "./ui/screens/post-match.js";
import "./ui/screens/end.js";

/** ¿Estamos en la máquina de desarrollo? Es la única llave que abre el deep-link. */
const LOCAL = ["localhost", "127.0.0.1", "[::1]", ""].includes(location.hostname);

if (!WC_DATA || !WC_DATA.teams || !WC_DATA.teams.length) {
  document.getElementById("app").innerHTML =
    `<div class="text-center mt-20 text-red-400">❌ No se pudieron cargar los datos de las selecciones (data/teams.js).</div>`;
} else if (LOCAL && location.search.includes("dev=")) {
  // DEEP-LINK DE DESARROLLO (?dev=philosophy&…): monta un estado y abre esa pantalla,
  // para poder verificar la UI navegando a una URL en vez de inyectando scripts. El
  // import es DINÁMICO y va detrás de dos llaves —origen local y el parámetro— así que
  // en cualquier otro sitio el archivo ni se descarga. Ver js/dev/deeplink.js.
  const { bootDeepLink } = await import("./dev/deeplink.js");
  if (!bootDeepLink()) go("saves");
} else {
  go("saves");
}
