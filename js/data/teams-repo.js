/* ============================================================
   data/teams-repo — capa de consulta de la base de selecciones.
   Único módulo del motor que conoce de dónde salen los datos.
   ============================================================ */
import { WC_DATA } from "../../data/teams.js";

/** Busca un equipo por su código FIFA. */
export function getTeam(id) { return WC_DATA.teams.find(t => t.id === id); }

/** Todas las selecciones de la base (incluye no clasificadas). */
export function allTeams() { return WC_DATA.teams; }
