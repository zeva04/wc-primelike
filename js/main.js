/* ============================================================
   Punto de entrada del juego (composición, nada más).

   Cada pantalla se registra en ui/nav al importarse; aquí solo
   se validan los datos y se abre el menú. Los <script
   type="module"> corren con el DOM ya parseado: sin
   DOMContentLoaded.
   ============================================================ */
import { WC_DATA } from "../data/teams.js";
import { go } from "./ui/nav.js";
// Pantallas: el import las registra en nav (orden irrelevante)
import "./ui/screens/menu.js";
import "./ui/screens/history.js";
import "./ui/screens/draw.js";
import "./ui/screens/hub.js";
import "./ui/screens/squad.js";
import "./ui/screens/worldcup.js";
import "./ui/screens/journal.js";
import "./ui/screens/match.js";
import "./ui/screens/shootout.js";
import "./ui/screens/post-match.js";
import "./ui/screens/end.js";

if (!WC_DATA || !WC_DATA.teams || !WC_DATA.teams.length) {
  document.getElementById("app").innerHTML =
    `<div class="text-center mt-20 text-red-400">❌ No se pudieron cargar los datos de las selecciones (data/teams.js).</div>`;
} else {
  go("menu");
}
