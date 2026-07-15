/* ============================================================
   game/opponents — alineación efectiva de un equipo no jugable.
   ============================================================ */
import { rnd } from "../core/rng.js";
import { clamp } from "../core/math.js";
import { STAT_KEYS, GK_STAT_KEYS, playerOverall, teamRating } from "./ratings.js";

// Desvíos por posición al derivar stats desde el rating del equipo
export const POS_MODS = {
  POR: { atajadas: +8, reflejos: +5, salidas: -3, pase: -15, aura: 0 },
  DEF: { tiro: -30, defensa: +10, cabezazo: +10, pase: -10, aura: 0 },
  MED: { tiro: -10, defensa: -10, cabezazo: -10, pase: +10, aura: 0 },
  DEL: { tiro: +10, defensa: -40, cabezazo: +10, pase: -10, aura: +10 },
};

/**
 * Alineación de 6 titulares del rival (Game Vision: formato 6v6).
 * Jugables usan sus mejores 6; el resto se deriva del rating de sus 5 figuras
 * más un "Jugador6" genérico que duplica los rasgos y stats de una de ellas.
 */
export function genOpponentLineup(team) {
  // Equipo jugable como rival (ej: Noruega cuando juegas con Brasil): usa sus mejores 6
  if (team.players) {
    const byStars = (a, b) => playerOverall(b) - playerOverall(a);
    const por = team.players.filter(p => p.pos === "POR").sort(byStars)[0];
    const field = team.players.filter(p => p.pos !== "POR").sort(byStars);
    const lineup = por ? [por] : [];
    for (const pos of ["DEF", "MED", "DEL"]) {
      const best = field.find(p => p.pos === pos && !lineup.includes(p));
      if (best) lineup.push(best);
    }
    for (const p of field) { if (lineup.length >= 6) break; if (!lineup.includes(p)) lineup.push(p); }
    return lineup.map(p => ({ name: p.name, pos: p.pos, num: p.num, stats: { ...p.stats }, look: p.look, energia: 100, amarilla: false, expulsado: false, lesionado: false }));
  }
  const r = teamRating(team);
  const players = team.figures.map(f => {
    const stats = {};
    const keys = f.pos === "POR" ? GK_STAT_KEYS : STAT_KEYS;
    for (const k of keys) {
      const mod = POS_MODS[f.pos][k];
      stats[k] = clamp(Math.round(r + mod + (rnd() - 0.5) * 12), 1, 99);
    }
    return { name: f.name, pos: f.pos, stats, energia: 100, amarilla: false, expulsado: false, lesionado: false };
  });
  // Los rivales tienen 5 figuras: se agrega temporalmente un sexto genérico con
  // los mismos rasgos y stats que su último jugador de campo.
  if (players.length < 6) {
    const base = [...players].reverse().find(p => p.pos !== "POR") || players[players.length - 1];
    players.push({ ...base, name: "Jugador6", stats: { ...base.stats } });
  }
  return players;
}
