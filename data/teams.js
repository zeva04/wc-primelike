// ============================================================
// WC 2026 Game — Base de datos de selecciones
// Módulo ES: exporta WC_DATA.
// NOTA: la distribución de posiciones por plantel es diseño libre del PO
// (mínimo 1 por posición); la ley ejecutable del esquema es tests/teams.validate.js.
//
// ESQUEMA DE CADA SELECCIÓN
//   id        código FIFA (3 letras)         iso    código bandera (data/flags/{iso}.png)
//   name      nombre en español              flag   emoji (solo respaldo, Windows no lo renderiza)
//   confed    UEFA|CONMEBOL|CONCACAF|CAF|AFC|OFC
//   qualified false = NO clasificó al Mundial 2026 (queda fuera del sorteo)
//
// SELECCIÓN JUGABLE (playable: true):
//   colors  { primary, secondary, text }  → tiñen la UI al elegirla
//   kits    { field: {shirt, accent}, gk: {shirt, accent} } → camisetas de los sprites
//   players 10 jugadores: 2 POR / 3 DEF / 3 MED / 2 DEL
//     num   dorsal 1-26 (el 1 es siempre de un arquero)
//     stats 1-99 · campo: tiro/defensa/cabezazo/pase/aura · POR: atajadas/reflejos/salidas/pase/aura
//           (base: EA FC 26 jun-2026 + ajustes de balance del PO)
//     look  sprite pixelado: { skin, hair, style: short|buzz|curly|long|bun|bald, beard }
//
// SELECCIÓN RIVAL (sin playable):
//   rating  media del equipo 1-99
//   kit     { shirt, accent } camiseta titular para sprites procedurales
//   figures 5 jugadores reales (≥1 por posición) usados como su alineación
// ============================================================

export const WC_DATA = {
  teams: [

    // ╔═════════════════════════════════════════════════════════════════╗
    // ║ 1. SELECCIONES JUGABLES (20) — orden confederación y alfabético ║
    // ╚═════════════════════════════════════════════════════════════════╝

    // ---------- AFC ----------
    {
      id: "KOR", name: "Corea del Sur", flag: "🇰🇷", iso: "kr", confed: "AFC", playable: true,
      colors: { primary: "#CD2E3A", secondary: "#0047A0", text: "#ffffff" },
      kits: { field: { shirt: "#CD2E3A", accent: "#000000" }, gk: { shirt: "#16A34A", accent: "#0B0F19" } },
      players: [
        { name: "Jo Hyeon-woo",        pos: "POR", num: 21, stats: { atajadas: 82, reflejos: 85, salidas: 74, pase: 68, aura: 76 }, look: { skin: "#F1C27D", hair: "#0E0C0A", style: "short", beard: false } },
        { name: "Kim Seung-gyu",       pos: "POR", num:  1, stats: { atajadas: 76, reflejos: 77, salidas: 72, pase: 70, aura: 72 }, look: { skin: "#F1C27D", hair: "#17130F", style: "short", beard: false } },
        { name: "Kim Min-jae",         pos: "DEF", num:  4, stats: { tiro: 52, defensa: 86, cabezazo: 82, pase: 76, aura: 80 }, look: { skin: "#F1C27D", hair: "#0E0C0A", style: "buzz", beard: false } },
        { name: "Kim Young-gwon",      pos: "DEF", num: 19, stats: { tiro: 46, defensa: 78, cabezazo: 74, pase: 72, aura: 72 }, look: { skin: "#F1C27D", hair: "#17130F", style: "short", beard: false } },
        { name: "Seol Young-woo",      pos: "DEF", num:  3, stats: { tiro: 60, defensa: 76, cabezazo: 66, pase: 76, aura: 70 }, look: { skin: "#F1C27D", hair: "#0E0C0A", style: "short", beard: false } },
        { name: "Lee Kang-in",         pos: "MED", num: 18, stats: { tiro: 80, defensa: 56, cabezazo: 58, pase: 88, aura: 82 }, look: { skin: "#F1C27D", hair: "#17130F", style: "long", beard: false } },
        { name: "Hwang In-beom",       pos: "MED", num:  6, stats: { tiro: 72, defensa: 74, cabezazo: 68, pase: 84, aura: 76 }, look: { skin: "#F1C27D", hair: "#17130F", style: "buzz", beard: false } },
        { name: "Paik Seung-ho",       pos: "MED", num:  8, stats: { tiro: 74, defensa: 70, cabezazo: 66, pase: 78, aura: 72 }, look: { skin: "#F1C27D", hair: "#2A1D12", style: "buzz", beard: false } },
        { name: "Son Heung-min",       pos: "DEL", num:  7, stats: { tiro: 88, defensa: 48, cabezazo: 68, pase: 84, aura: 92 }, look: { skin: "#F1C27D", hair: "#2A1D12", style: "short", beard: false } },
        { name: "Hwang Hee-chan",      pos: "DEL", num: 11, stats: { tiro: 82, defensa: 52, cabezazo: 66, pase: 74, aura: 78 }, look: { skin: "#F1C27D", hair: "#0E0C0A", style: "short", beard: true } },
      ],
    },
    {
      id: "JPN", name: "Japón", flag: "🇯🇵", iso: "jp", confed: "AFC", playable: true,
      colors: { primary: "#143C8C", secondary: "#DC0032", text: "#ffffff" },
      kits: { field: { shirt: "#143C8C", accent: "#FFFFFF" }, gk: { shirt: "#F59E0B", accent: "#143C8C" } },
      players: [
        { name: "Zion Suzuki",         pos: "POR", num: 23, stats: { atajadas: 82, reflejos: 84, salidas: 78, pase: 74, aura: 74 }, look: { skin: "#A0663A", hair: "#0E0C0A", style: "buzz", beard: false } },
        { name: "Keisuke Osako",       pos: "POR", num:  1, stats: { atajadas: 76, reflejos: 78, salidas: 72, pase: 70, aura: 70 }, look: { skin: "#F1C27D", hair: "#0E0C0A", style: "short", beard: false } },
        { name: "Tomiyasu",            pos: "DEF", num: 16, stats: { tiro: 50, defensa: 83, cabezazo: 76, pase: 78, aura: 74 }, look: { skin: "#F1C27D", hair: "#0E0C0A", style: "short", beard: false } },
        { name: "Itakura",             pos: "DEF", num:  4, stats: { tiro: 48, defensa: 81, cabezazo: 78, pase: 76, aura: 72 }, look: { skin: "#F1C27D", hair: "#17130F", style: "short", beard: false } },
        { name: "Sugawara",            pos: "DEF", num:  5, stats: { tiro: 62, defensa: 76, cabezazo: 66, pase: 80, aura: 70 }, look: { skin: "#F1C27D", hair: "#0E0C0A", style: "buzz", beard: false } },
        { name: "Wataru Endō",         pos: "MED", num:  6, stats: { tiro: 66, defensa: 82, cabezazo: 78, pase: 80, aura: 82 }, look: { skin: "#F1C27D", hair: "#0E0C0A", style: "buzz", beard: true } },
        { name: "Kamada",              pos: "MED", num: 15, stats: { tiro: 78, defensa: 68, cabezazo: 70, pase: 84, aura: 76 }, look: { skin: "#F1C27D", hair: "#17130F", style: "long", beard: false } },
        { name: "Take Kubo",           pos: "MED", num: 11, stats: { tiro: 82, defensa: 56, cabezazo: 58, pase: 86, aura: 82 }, look: { skin: "#F1C27D", hair: "#2A1D12", style: "short", beard: false } },
        { name: "Mitoma",              pos: "DEL", num:  7, stats: { tiro: 84, defensa: 48, cabezazo: 60, pase: 80, aura: 82 }, look: { skin: "#F1C27D", hair: "#17130F", style: "buzz", beard: false } },
        { name: "Ayase Ueda",          pos: "DEL", num:  9, stats: { tiro: 80, defensa: 44, cabezazo: 78, pase: 64, aura: 70 }, look: { skin: "#F1C27D", hair: "#2A1D12", style: "buzz", beard: false } },
      ],
    },
    // ---------- CAF ----------
    {
      // Modo "Campaña legendaria": el plantel más modesto del juego
      id: "CPV", name: "Cabo Verde", flag: "🇨🇻", iso: "cv", confed: "CAF", playable: true,
      colors: { primary: "#003893", secondary: "#CE1126", text: "#ffffff" },
      kits: { field: { shirt: "#003893", accent: "#FFFFFF" }, gk: { shirt: "#57534E", accent: "#F9E814" } },
      players: [
        { name: "Vozinha",             pos: "POR", num:  1, stats: { atajadas: 73, reflejos: 75, salidas: 60, pase: 52, aura: 80 }, look: { skin: "#6B4226", hair: "#0E0C0A", style: "bald", beard: true } },
        { name: "Josimar Dias",        pos: "POR", num: 12, stats: { atajadas: 60, reflejos: 62, salidas: 56, pase: 50, aura: 56 }, look: { skin: "#8D5524", hair: "#0E0C0A", style: "buzz", beard: false } },
        { name: "Logan Costa",         pos: "DEF", num:  4, stats: { tiro: 44, defensa: 70, cabezazo: 70, pase: 60, aura: 62 }, look: { skin: "#8D5524", hair: "#0E0C0A", style: "short", beard: true } },
        { name: "Roberto Lopes",       pos: "DEF", num:  3, stats: { tiro: 40, defensa: 70, cabezazo: 66, pase: 58, aura: 62 }, look: { skin: "#A0663A", hair: "#0E0C0A", style: "bald", beard: true } },
        { name: "Diney",               pos: "DEF", num:  2, stats: { tiro: 42, defensa: 64, cabezazo: 60, pase: 56, aura: 54 }, look: { skin: "#6B4226", hair: "#17130F", style: "buzz", beard: false } },
        { name: "Jamiro Monteiro",     pos: "MED", num:  8, stats: { tiro: 62, defensa: 58, cabezazo: 54, pase: 70, aura: 64 }, look: { skin: "#8D5524", hair: "#0E0C0A", style: "buzz", beard: true } },
        { name: "Kenny Rocha",         pos: "MED", num:  6, stats: { tiro: 58, defensa: 56, cabezazo: 52, pase: 66, aura: 58 }, look: { skin: "#8D5524", hair: "#17130F", style: "short", beard: false } },
        { name: "Deroy Duarte",        pos: "MED", num: 18, stats: { tiro: 60, defensa: 54, cabezazo: 50, pase: 68, aura: 56 }, look: { skin: "#A0663A", hair: "#0E0C0A", style: "curly", beard: false } },
        { name: "Ryan Mendes",         pos: "DEL", num: 10, stats: { tiro: 68, defensa: 42, cabezazo: 58, pase: 66, aura: 68 }, look: { skin: "#6B4226", hair: "#0E0C0A", style: "buzz", beard: false } },
        { name: "Bebé",                pos: "DEL", num: 11, stats: { tiro: 70, defensa: 38, cabezazo: 60, pase: 58, aura: 58 }, look: { skin: "#8D5524", hair: "#0E0C0A", style: "curly", beard: true } },
      ],
    },
    {
      id: "MAR", name: "Marruecos", flag: "🇲🇦", iso: "ma", confed: "CAF", playable: true,
      colors: { primary: "#C1272D", secondary: "#006233", text: "#ffffff" },
      kits: { field: { shirt: "#C1272D", accent: "#006233" }, gk: { shirt: "#FACC15", accent: "#0B0F19" } },
      players: [
        { name: "Bounou",              pos: "POR", num:  1, stats: { atajadas: 85, reflejos: 86, salidas: 80, pase: 72, aura: 84 }, look: { skin: "#E0AC69", hair: "#17130F", style: "short", beard: true } },
        { name: "Munir",               pos: "POR", num: 12, stats: { atajadas: 74, reflejos: 76, salidas: 70, pase: 66, aura: 68 }, look: { skin: "#C68642", hair: "#17130F", style: "short", beard: false } },
        { name: "Hakimi",              pos: "DEF", num:  2, stats: { tiro: 76, defensa: 88, cabezazo: 72, pase: 86, aura: 88 }, look: { skin: "#C68642", hair: "#17130F", style: "short", beard: true } },
        { name: "Aguerd",              pos: "DEF", num:  5, stats: { tiro: 48, defensa: 83, cabezazo: 80, pase: 72, aura: 76 }, look: { skin: "#C68642", hair: "#0E0C0A", style: "short", beard: true } },
        { name: "Mazraoui",            pos: "DEF", num:  3, stats: { tiro: 62, defensa: 80, cabezazo: 66, pase: 82, aura: 76 }, look: { skin: "#C68642", hair: "#17130F", style: "buzz", beard: true } },
        { name: "Amrabat",             pos: "MED", num:  4, stats: { tiro: 66, defensa: 80, cabezazo: 72, pase: 80, aura: 80 }, look: { skin: "#C68642", hair: "#0E0C0A", style: "bun", beard: true } },
        { name: "Brahim Díaz",         pos: "MED", num: 10, stats: { tiro: 82, defensa: 54, cabezazo: 58, pase: 86, aura: 80 }, look: { skin: "#E0AC69", hair: "#17130F", style: "short", beard: false } },
        { name: "Ounahi",              pos: "MED", num:  8, stats: { tiro: 74, defensa: 62, cabezazo: 60, pase: 84, aura: 74 }, look: { skin: "#C68642", hair: "#17130F", style: "short", beard: false } },
        { name: "En-Nesyri",           pos: "DEL", num: 19, stats: { tiro: 82, defensa: 44, cabezazo: 86, pase: 62, aura: 76 }, look: { skin: "#C68642", hair: "#0E0C0A", style: "buzz", beard: false } },
        { name: "Ezzalzouli",          pos: "DEL", num:  7, stats: { tiro: 78, defensa: 46, cabezazo: 58, pase: 76, aura: 72 }, look: { skin: "#C68642", hair: "#17130F", style: "curly", beard: false } },
      ],
    },
    {
      id: "SEN", name: "Senegal", flag: "🇸🇳", iso: "sn", confed: "CAF", playable: true,
      colors: { primary: "#00853F", secondary: "#FCD116", text: "#ffffff" },
      kits: { field: { shirt: "#FFFFFF", accent: "#00853F" }, gk: { shirt: "#F97316", accent: "#0B0F19" } },
      players: [
        { name: "Édouard Mendy",       pos: "POR", num: 16, stats: { atajadas: 82, reflejos: 83, salidas: 78, pase: 64, aura: 76 }, look: { skin: "#6B4226", hair: "#0E0C0A", style: "buzz", beard: false } },
        { name: "Mory Diaw",           pos: "POR", num:  1, stats: { atajadas: 74, reflejos: 76, salidas: 70, pase: 62, aura: 66 }, look: { skin: "#8D5524", hair: "#0E0C0A", style: "short", beard: false } },
        { name: "Koulibaly",           pos: "DEF", num:  3, stats: { tiro: 52, defensa: 83, cabezazo: 82, pase: 72, aura: 84 }, look: { skin: "#6B4226", hair: "#0E0C0A", style: "bald", beard: true } },
        { name: "Niakhaté",            pos: "DEF", num:  2, stats: { tiro: 46, defensa: 79, cabezazo: 76, pase: 70, aura: 72 }, look: { skin: "#8D5524", hair: "#0E0C0A", style: "buzz", beard: true } },
        { name: "Ismail Jakobs",       pos: "DEF", num: 21, stats: { tiro: 58, defensa: 74, cabezazo: 64, pase: 76, aura: 68 }, look: { skin: "#A0663A", hair: "#17130F", style: "curly", beard: false } },
        { name: "Pape Matar Sarr",     pos: "MED", num: 17, stats: { tiro: 74, defensa: 72, cabezazo: 66, pase: 84, aura: 78 }, look: { skin: "#8D5524", hair: "#0E0C0A", style: "buzz", beard: false } },
        { name: "Gana Gueye",          pos: "MED", num:  5, stats: { tiro: 70, defensa: 80, cabezazo: 68, pase: 78, aura: 80 }, look: { skin: "#6B4226", hair: "#0E0C0A", style: "buzz", beard: true } },
        { name: "Habib Diarra",        pos: "MED", num:  8, stats: { tiro: 72, defensa: 66, cabezazo: 64, pase: 78, aura: 70 }, look: { skin: "#8D5524", hair: "#17130F", style: "curly", beard: false } },
        { name: "Sadio Mané",          pos: "DEL", num: 10, stats: { tiro: 83, defensa: 50, cabezazo: 72, pase: 80, aura: 88 }, look: { skin: "#6B4226", hair: "#0E0C0A", style: "buzz", beard: false } },
        { name: "Nicolas Jackson",     pos: "DEL", num:  9, stats: { tiro: 82, defensa: 44, cabezazo: 70, pase: 70, aura: 74 }, look: { skin: "#8D5524", hair: "#0E0C0A", style: "curly", beard: false } },
      ],
    },
    // ---------- CONCACAF ----------
    {
      id: "CAN", name: "Canadá", flag: "🇨🇦", iso: "ca", confed: "CONCACAF", playable: true,
      colors: { primary: "#D80621", secondary: "#7A0416", text: "#ffffff" },
      kits: { field: { shirt: "#D80621", accent: "#FFFFFF" }, gk: { shirt: "#6D28D9", accent: "#111827" } },
      players: [
        { name: "Maxime Crépeau", pos: "POR", num: 16, stats: { atajadas: 84, reflejos: 86, salidas: 82, pase: 74, aura: 84 }, look: { skin: "#F1C27D", hair: "#4A331F", style: "short", beard: true } },
        { name: "Dayne St. Clair", pos: "POR", num: 1, stats: { atajadas: 80, reflejos: 82, salidas: 78, pase: 72, aura: 78 }, look: { skin: "#6B4226", hair: "#17130F", style: "short", beard: true } },
        { name: "Alistair Johnston", pos: "DEF", num: 2, stats: { tiro: 68, defensa: 86, cabezazo: 78, pase: 84, aura: 86 }, look: { skin: "#F1C27D", hair: "#6B4F2A", style: "short", beard: true } },
        { name: "Moïse Bombito", pos: "DEF", num: 15, stats: { tiro: 54, defensa: 85, cabezazo: 84, pase: 76, aura: 84 }, look: { skin: "#6B4226", hair: "#17130F", style: "short", beard: true } },
        { name: "Alphonso Davies", pos: "DEF", num: 19, stats: { tiro: 82, defensa: 84, cabezazo: 74, pase: 88, aura: 92 }, look: { skin: "#6B4226", hair: "#17130F", style: "short", beard: false } },
        { name: "Stephen Eustáquio", pos: "MED", num: 7, stats: { tiro: 76, defensa: 84, cabezazo: 72, pase: 88, aura: 88 }, look: { skin: "#E0AC69", hair: "#17130F", style: "short", beard: true } },
        { name: "Ismaël Koné", pos: "MED", num: 8, stats: { tiro: 80, defensa: 80, cabezazo: 74, pase: 84, aura: 86 }, look: { skin: "#6B4226", hair: "#17130F", style: "short", beard: false } },
        { name: "Tajon Buchanan", pos: "MED", num: 17, stats: { tiro: 84, defensa: 62, cabezazo: 70, pase: 84, aura: 87 }, look: { skin: "#8D5524", hair: "#17130F", style: "short", beard: false } },
        { name: "Jonathan David", pos: "DEL", num: 10, stats: { tiro: 91, defensa: 44, cabezazo: 80, pase: 82, aura: 92 }, look: { skin: "#6B4226", hair: "#17130F", style: "short", beard: true } },
        { name: "Tani Oluwaseyi", pos: "DEL", num: 12, stats: { tiro: 86, defensa: 44, cabezazo: 82, pase: 76, aura: 85 }, look: { skin: "#6B4226", hair: "#17130F", style: "short", beard: true } },
        // Jugador 11 {name: "Promise David", pos: "DEL", num: 24, stats: { tiro: 86, defensa: 42, cabezazo: 84, pase: 74, aura: 85 }, look: { skin: "#6B4226", hair: "#17130F", style: "short", beard: true } },
      ],
    },
    {
      id: "USA", name: "Estados Unidos", flag: "🇺🇸", iso: "us", confed: "CONCACAF", playable: true,
      colors: { primary: "#FFFFFF", secondary: "#3C3B6E", text: "#0f172a" },
      kits: { field: { shirt: "#FFFFFF", accent: "#B22234" }, gk: { shirt: "#EAB308", accent: "#12275E" } },
      players: [
        { name: "Matt Turner",         pos: "POR", num:  1, stats: { atajadas: 80, reflejos: 82, salidas: 74, pase: 62, aura: 74 }, look: { skin: "#F1C27D", hair: "#2A1D12", style: "short", beard: true } },
        { name: "Patrick Schulte",     pos: "POR", num: 24, stats: { atajadas: 74, reflejos: 76, salidas: 70, pase: 68, aura: 68 }, look: { skin: "#FFDBAC", hair: "#8A6B3F", style: "short", beard: false } },
        { name: "Chris Richards",      pos: "DEF", num:  3, stats: { tiro: 48, defensa: 80, cabezazo: 76, pase: 72, aura: 72 }, look: { skin: "#6B4226", hair: "#0E0C0A", style: "curly", beard: false } },
        { name: "Antonee Robinson",    pos: "DEF", num:  5, stats: { tiro: 58, defensa: 79, cabezazo: 68, pase: 80, aura: 74 }, look: { skin: "#A0663A", hair: "#0E0C0A", style: "buzz", beard: true } },
        { name: "Sergiño Dest",        pos: "DEF", num:  2, stats: { tiro: 64, defensa: 74, cabezazo: 60, pase: 80, aura: 70 }, look: { skin: "#C68642", hair: "#17130F", style: "curly", beard: false } },
        { name: "Tyler Adams",         pos: "MED", num:  4, stats: { tiro: 62, defensa: 80, cabezazo: 70, pase: 78, aura: 78 }, look: { skin: "#6B4226", hair: "#0E0C0A", style: "buzz", beard: true } },
        { name: "McKennie",            pos: "MED", num:  8, stats: { tiro: 72, defensa: 74, cabezazo: 76, pase: 78, aura: 78 }, look: { skin: "#6B4226", hair: "#17130F", style: "curly", beard: true } },
        { name: "Gio Reyna",           pos: "MED", num:  7, stats: { tiro: 76, defensa: 56, cabezazo: 58, pase: 84, aura: 70 }, look: { skin: "#E0AC69", hair: "#2A1D12", style: "short", beard: false } },
        { name: "Pulisic",             pos: "DEL", num: 10, stats: { tiro: 85, defensa: 50, cabezazo: 62, pase: 82, aura: 86 }, look: { skin: "#F1C27D", hair: "#6B4F2A", style: "short", beard: false } },
        { name: "Balogun",             pos: "DEL", num:  9, stats: { tiro: 80, defensa: 40, cabezazo: 68, pase: 64, aura: 70 }, look: { skin: "#6B4226", hair: "#0E0C0A", style: "buzz", beard: false } },
      ],
    },
    {
      id: "MEX", name: "México", flag: "🇲🇽", iso: "mx", confed: "CONCACAF", playable: true,
      colors: { primary: "#006847", secondary: "#0B4D33", text: "#ffffff" },
      kits: { field: { shirt: "#006847", accent: "#FFFFFF" }, gk: { shirt: "#7C3AED", accent: "#0B0F19" } },
      players: [
        { name: "Malagón",             pos: "POR", num:  1, stats: { atajadas: 80, reflejos: 82, salidas: 74, pase: 68, aura: 74 }, look: { skin: "#C68642", hair: "#17130F", style: "short", beard: false } },
        { name: "Tala Rangel",         pos: "POR", num: 13, stats: { atajadas: 74, reflejos: 76, salidas: 70, pase: 66, aura: 68 }, look: { skin: "#C68642", hair: "#0E0C0A", style: "short", beard: false } },
        { name: "César Montes",        pos: "DEF", num:  3, stats: { tiro: 50, defensa: 80, cabezazo: 78, pase: 70, aura: 74 }, look: { skin: "#C68642", hair: "#17130F", style: "short", beard: true } },
        { name: "Johan Vásquez",       pos: "DEF", num:  2, stats: { tiro: 48, defensa: 79, cabezazo: 74, pase: 72, aura: 72 }, look: { skin: "#A0663A", hair: "#0E0C0A", style: "short", beard: true } },
        { name: "Jorge Sánchez",       pos: "DEF", num: 22, stats: { tiro: 58, defensa: 72, cabezazo: 62, pase: 72, aura: 66 }, look: { skin: "#C68642", hair: "#17130F", style: "buzz", beard: false } },
        { name: "Edson Álvarez",       pos: "MED", num:  4, stats: { tiro: 62, defensa: 82, cabezazo: 78, pase: 78, aura: 80 }, look: { skin: "#C68642", hair: "#0E0C0A", style: "bun", beard: true } },
        { name: "Luis Chávez",         pos: "MED", num: 24, stats: { tiro: 78, defensa: 68, cabezazo: 64, pase: 80, aura: 72 }, look: { skin: "#A0663A", hair: "#17130F", style: "short", beard: false } },
        { name: "Gilberto Mora",       pos: "MED", num: 26, stats: { tiro: 72, defensa: 54, cabezazo: 52, pase: 82, aura: 74 }, look: { skin: "#C68642", hair: "#0E0C0A", style: "short", beard: false } },
        { name: "Santiago Giménez",    pos: "DEL", num: 20, stats: { tiro: 83, defensa: 42, cabezazo: 76, pase: 68, aura: 76 }, look: { skin: "#E0AC69", hair: "#17130F", style: "buzz", beard: true } },
        { name: "Raúl Jiménez",        pos: "DEL", num:  9, stats: { tiro: 80, defensa: 44, cabezazo: 78, pase: 72, aura: 78 }, look: { skin: "#C68642", hair: "#0E0C0A", style: "short", beard: true } },
      ],
    },
    // ---------- CONMEBOL ----------
    {
      id: "ARG", name: "Argentina", flag: "🇦🇷", iso: "ar", confed: "CONMEBOL", playable: true,
      colors: { primary: "#75AADB", secondary: "#1C2C5B", text: "#0f172a" },
      kits: { field: { shirt: "#75AADB", accent: "#FFFFFF" }, gk: { shirt: "#FF7F27", accent: "#1C2C5B" } },
      players: [
        { name: "Dibu Martínez",       pos: "POR", num: 23, stats: { atajadas: 84, reflejos: 86, salidas: 80, pase: 72, aura: 88 }, look: { skin: "#E0AC69", hair: "#2A1D12", style: "short", beard: false } },
        { name: "Rulli",               pos: "POR", num: 12, stats: { atajadas: 82, reflejos: 82, salidas: 78, pase: 76, aura: 74 }, look: { skin: "#E0AC69", hair: "#17130F", style: "short", beard: true } },
        { name: "Cuti Romero",         pos: "DEF", num: 13, stats: { tiro: 50, defensa: 86, cabezazo: 85, pase: 76, aura: 82 }, look: { skin: "#C68642", hair: "#17130F", style: "short", beard: true } },
        { name: "Lisandro Martínez",   pos: "DEF", num: 6, stats: { tiro: 52, defensa: 85, cabezazo: 78, pase: 84, aura: 80 }, look: { skin: "#E0AC69", hair: "#17130F", style: "buzz", beard: false } },
        { name: "Nahuel Molina",       pos: "DEF", num: 26, stats: { tiro: 62, defensa: 80, cabezazo: 68, pase: 82, aura: 76 }, look: { skin: "#E0AC69", hair: "#17130F", style: "buzz", beard: false } },
        { name: "Enzo Fernández",      pos: "MED", num: 24, stats: { tiro: 76, defensa: 78, cabezazo: 74, pase: 90, aura: 86 }, look: { skin: "#F1C27D", hair: "#2A1D12", style: "short", beard: false } },
        { name: "Mac Allister",        pos: "MED", num: 20, stats: { tiro: 78, defensa: 74, cabezazo: 72, pase: 89, aura: 86 }, look: { skin: "#F1C27D", hair: "#6B4F2A", style: "short", beard: true } },
        { name: "De Paul",             pos: "MED", num:  7, stats: { tiro: 72, defensa: 76, cabezazo: 70, pase: 85, aura: 76 }, look: { skin: "#E0AC69", hair: "#2A1D12", style: "long", beard: true } },
        { name: "Messi",               pos: "DEL", num: 10, stats: { tiro: 92, defensa: 32, cabezazo: 66, pase: 97, aura: 99 }, look: { skin: "#E0AC69", hair: "#2A1D12", style: "short", beard: true } },
        { name: "Lautaro Martínez",    pos: "DEL", num: 22, stats: { tiro: 87, defensa: 42, cabezazo: 85, pase: 77, aura: 82 }, look: { skin: "#C68642", hair: "#17130F", style: "short", beard: false } },
        // 11 player { name: "Julián Álvarez",      pos: "DEL", num: 9, stats: { tiro: 88, defensa: 56, cabezazo: 74, pase: 82, aura: 87 }, look: { skin: "#E0AC69", hair: "#2A1D12", style: "short", beard: false } },
      ],
    },
    {
      id: "BRA", name: "Brasil", flag: "🇧🇷", iso: "br", confed: "CONMEBOL", playable: true,
      colors: { primary: "#FFDF00", secondary: "#009C3B", text: "#0f172a" },
      kits: { field: { shirt: "#FFDF00", accent: "#009C3B" }, gk: { shirt: "#8A8F98", accent: "#1F2937" } },
      players: [
        { name: "Alisson", pos: "POR", num: 1, stats: { atajadas: 87, reflejos: 85, salidas: 85, pase: 78, aura: 83 }, look: { skin: "#E0AC69", hair: "#5B3A1E", style: "short", beard: true } },
        { name: "Ederson", pos: "POR", num: 23, stats: { atajadas: 83, reflejos: 82, salidas: 80, pase: 92, aura: 80 }, look: { skin: "#E0AC69", hair: "#1F1B16", style: "buzz", beard: true } },
        { name: "Marquinhos", pos: "DEF", num: 4, stats: { tiro: 55, defensa: 85, cabezazo: 85, pase: 80, aura: 90 }, look: { skin: "#C68642", hair: "#17130F", style: "short", beard: true } },
        { name: "Gabriel Magalhães", pos: "DEF", num: 3, stats: { tiro: 50, defensa: 87, cabezazo: 89, pase: 72, aura: 80 }, look: { skin: "#8D5524", hair: "#0E0C0A", style: "buzz", beard: true } },
        { name: "Casemiro", pos: "MED", num: 5, stats: { tiro: 74, defensa: 84, cabezazo: 80, pase: 80, aura: 89 }, look: { skin: "#C68642", hair: "#17130F", style: "buzz", beard: true } },
        { name: "Bruno Guimarães", pos: "MED", num: 8, stats: { tiro: 74, defensa: 76, cabezazo: 66, pase: 89, aura: 87 }, look: { skin: "#E0AC69", hair: "#2A1D12", style: "short", beard: true } },
        { name: "Lucas Paquetá", pos: "MED", num: 20, stats: { tiro: 76, defensa: 62, cabezazo: 70, pase: 85, aura: 78 }, look: { skin: "#E0AC69", hair: "#17130F", style: "short", beard: true } },
        { name: "Matheus Cunha", pos: "DEL", num: 9, stats: { tiro: 86, defensa: 48, cabezazo: 74, pase: 80, aura: 84 }, look: { skin: "#C68642", hair: "#17130F", style: "short", beard: true } },
        { name: "Vinícius Júnior", pos: "DEL", num: 7, stats: { tiro: 92, defensa: 35, cabezazo: 62, pase: 85, aura: 96 }, look: { skin: "#8D5524", hair: "#0E0C0A", style: "curly", beard: false } },
        { name: "Raphinha", pos: "DEL", num: 11, stats: { tiro: 89, defensa: 45, cabezazo: 70, pase: 87, aura: 88 }, look: { skin: "#C68642", hair: "#17130F", style: "short", beard: true } },
        // 11 player { name: "Neymar", pos: "MED", num: 10, stats: { tiro: 86, defensa: 40, cabezazo: 60, pase: 91, aura: 94 }, look: { skin: "#C68642", hair: "#17130F", style: "short", beard: true } },
      ],
    },
    {
      id: "COL", name: "Colombia", flag: "🇨🇴", iso: "co", confed: "CONMEBOL", playable: true,
      colors: { primary: "#FCD116", secondary: "#003893", text: "#0f172a" },
      kits: { field: { shirt: "#FCD116", accent: "#003893" }, gk: { shirt: "#15803D", accent: "#0B0F19" } },
      players: [
        { name: "Camilo Vargas",       pos: "POR", num: 12, stats: { atajadas: 82, reflejos: 83, salidas: 78, pase: 70, aura: 78 }, look: { skin: "#C68642", hair: "#17130F", style: "short", beard: false } },
        { name: "Ospina",              pos: "POR", num:  1, stats: { atajadas: 76, reflejos: 78, salidas: 72, pase: 68, aura: 78 }, look: { skin: "#E0AC69", hair: "#2A1D12", style: "short", beard: false } },
        { name: "Dávinson Sánchez",    pos: "DEF", num: 23, stats: { tiro: 50, defensa: 83, cabezazo: 80, pase: 72, aura: 76 }, look: { skin: "#6B4226", hair: "#0E0C0A", style: "buzz", beard: false } },
        { name: "Lucumí",              pos: "DEF", num:  2, stats: { tiro: 45, defensa: 82, cabezazo: 74, pase: 74, aura: 70 }, look: { skin: "#6B4226", hair: "#17130F", style: "short", beard: false } },
        { name: "Daniel Muñoz",        pos: "DEF", num: 17, stats: { tiro: 64, defensa: 78, cabezazo: 74, pase: 78, aura: 76 }, look: { skin: "#C68642", hair: "#17130F", style: "buzz", beard: true } },
        { name: "Richard Ríos",        pos: "MED", num: 16, stats: { tiro: 74, defensa: 74, cabezazo: 70, pase: 82, aura: 76 }, look: { skin: "#C68642", hair: "#17130F", style: "curly", beard: false } },
        { name: "Lerma",               pos: "MED", num:  6, stats: { tiro: 70, defensa: 80, cabezazo: 76, pase: 76, aura: 74 }, look: { skin: "#6B4226", hair: "#0E0C0A", style: "bun", beard: true } },
        { name: "James Rodríguez",     pos: "MED", num: 10, stats: { tiro: 83, defensa: 52, cabezazo: 64, pase: 87, aura: 90 }, look: { skin: "#E0AC69", hair: "#2A1D12", style: "short", beard: false } },
        { name: "Luis Díaz",           pos: "DEL", num:  7, stats: { tiro: 89, defensa: 50, cabezazo: 68, pase: 82, aura: 88 }, look: { skin: "#A0663A", hair: "#17130F", style: "curly", beard: true } },
        { name: "Luis Suárez",         pos: "DEL", num: 25, stats: { tiro: 84, defensa: 42, cabezazo: 76, pase: 70, aura: 80 }, look: { skin: "#C68642", hair: "#17130F", style: "short", beard: false } },
        // 11 player { name: "Jhon Córdoba", pos: "DEL", num: 9, stats: { tiro: 86, defensa: 42, cabezazo: 84, pase: 66, aura: 81 }, look: { skin: "#6B4226", hair: "#0E0C0A", style: "buzz", beard: true } },
      ],
    },
    {
      id: "ECU", name: "Ecuador", flag: "🇪🇨", iso: "ec", confed: "CONMEBOL", playable: true,
      colors: { primary: "#FCD116", secondary: "#002B5C", text: "#0f172a" },
      kits: { field: { shirt: "#FCD116", accent: "#002B5C" }, gk: { shirt: "#111827", accent: "#FCD116" } },
      players: [
        { name: "Hernán Galíndez", pos: "POR", num: 1, stats: { atajadas: 76, reflejos: 77, salidas: 72, pase: 66, aura: 74 }, look: { skin: "#C68642", hair: "#17130F", style: "short", beard: true } },
        { name: "Gonzalo Valle", pos: "POR", num: 22, stats: { atajadas: 71, reflejos: 73, salidas: 68, pase: 64, aura: 69 }, look: { skin: "#E0AC69", hair: "#17130F", style: "short", beard: false } },
        { name: "Willian Pacho", pos: "DEF", num: 6, stats: { tiro: 50, defensa: 86, cabezazo: 84, pase: 78, aura: 82 }, look: { skin: "#6B4226", hair: "#17130F", style: "short", beard: false } },
        { name: "Piero Hincapié", pos: "DEF", num: 3, stats: { tiro: 58, defensa: 84, cabezazo: 80, pase: 80, aura: 80 }, look: { skin: "#8D5524", hair: "#17130F", style: "short", beard: false } },
        { name: "Joel Ordóñez", pos: "DEF", num: 4, stats: { tiro: 45, defensa: 77, cabezazo: 75, pase: 72, aura: 72 }, look: { skin: "#6B4226", hair: "#17130F", style: "short", beard: false } },
        { name: "Moisés Caicedo", pos: "MED", num: 23, stats: { tiro: 76, defensa: 85, cabezazo: 76, pase: 88, aura: 88 }, look: { skin: "#6B4226", hair: "#17130F", style: "short", beard: false } },
        { name: "Pedro Vite", pos: "MED", num: 15, stats: { tiro: 70, defensa: 62, cabezazo: 62, pase: 78, aura: 72 }, look: { skin: "#C68642", hair: "#17130F", style: "short", beard: false } },
        { name: "John Yeboah", pos: "MED", num: 9, stats: { tiro: 72, defensa: 56, cabezazo: 62, pase: 76, aura: 70 }, look: { skin: "#6B4226", hair: "#17130F", style: "curly", beard: false } },
        { name: "Enner Valencia", pos: "DEL", num: 13, stats: { tiro: 76, defensa: 44, cabezazo: 76, pase: 70, aura: 82 }, look: { skin: "#6B4226", hair: "#17130F", style: "buzz", beard: true } },
        { name: "Gonzalo Plata", pos: "DEL", num: 19, stats: { tiro: 78, defensa: 46, cabezazo: 68, pase: 78, aura: 80 }, look: { skin: "#8D5524", hair: "#17130F", style: "short", beard: false } },
        // Jugador 11 { name: "Pervis Estupiñán", pos: "DEF", num: 7, stats: { tiro: 72, defensa: 82, cabezazo: 74, pase: 84, aura: 84 }, look: { skin: "#8D5524", hair: "#17130F", style: "short", beard: true } },
      ],
    },
    {
      id: "PAR", name: "Paraguay", flag: "🇵🇾", iso: "py", confed: "CONMEBOL", playable: true,
      colors: { primary: "#D52B1E", secondary: "#0038A8", text: "#0f172a" },
      kits: { field: { shirt: "#D52B1E", accent: "#FFFFFF" }, gk: { shirt: "#8ED8F8", accent: "#1E293B" } },
      players: [
        { name: "Orlando Gill", pos: "POR", num: 12, stats: { atajadas: 74, reflejos: 75, salidas: 70, pase: 64, aura: 72 }, look: { skin: "#C68642", hair: "#17130F", style: "short", beard: false } },
        { name: "Gatito Fernández", pos: "POR", num: 1, stats: { atajadas: 72, reflejos: 74, salidas: 70, pase: 66, aura: 73 }, look: { skin: "#C68642", hair: "#17130F", style: "short", beard: true } },
        { name: "Gustavo Gómez", pos: "DEF", num: 15, stats: { tiro: 54, defensa: 83, cabezazo: 84, pase: 72, aura: 80 }, look: { skin: "#C68642", hair: "#17130F", style: "short", beard: true } },
        { name: "Omar Alderete", pos: "DEF", num: 3, stats: { tiro: 52, defensa: 81, cabezazo: 81, pase: 72, aura: 76 }, look: { skin: "#C68642", hair: "#17130F", style: "short", beard: true } },
        { name: "Juan Cáceres", pos: "DEF", num: 4, stats: { tiro: 56, defensa: 72, cabezazo: 70, pase: 72, aura: 68 }, look: { skin: "#C68642", hair: "#17130F", style: "short", beard: false } },
        { name: "Diego Gómez", pos: "MED", num: 8, stats: { tiro: 71, defensa: 71, cabezazo: 66, pase: 79, aura: 73 }, look: { skin: "#C68642", hair: "#17130F", style: "short", beard: false } },
        { name: "Andrés Cubas", pos: "MED", num: 14, stats: { tiro: 66, defensa: 80, cabezazo: 70, pase: 78, aura: 74 }, look: { skin: "#C68642", hair: "#17130F", style: "short", beard: true } },
        { name: "Matías Galarza", pos: "MED", num: 16, stats: { tiro: 68, defensa: 72, cabezazo: 66, pase: 76, aura: 72 }, look: { skin: "#C68642", hair: "#17130F", style: "short", beard: false } },
        { name: "Miguel Almirón", pos: "DEL", num: 10, stats: { tiro: 78, defensa: 52, cabezazo: 68, pase: 83, aura: 83 }, look: { skin: "#C68642", hair: "#17130F", style: "short", beard: false } },
        { name: "Julio Enciso", pos: "DEL", num: 19, stats: { tiro: 77, defensa: 48, cabezazo: 64, pase: 83, aura: 79 }, look: { skin: "#C68642", hair: "#17130F", style: "curly", beard: false } },
        // Jugador 11 { name: "Ramón Sosa", pos: "DEL", num: 7, stats: { tiro: 84, defensa: 46, cabezazo: 68, pase: 82, aura: 84 }, look: { skin: "#C68642", hair: "#17130F", style: "short", beard: false } },
      ],
    },
    {
      id: "URU", name: "Uruguay", flag: "🇺🇾", iso: "uy", confed: "CONMEBOL", playable: true,
      colors: { primary: "#55B5E5", secondary: "#001489", text: "#0f172a" },
      kits: { field: { shirt: "#55B5E5", accent: "#FFFFFF" }, gk: { shirt: "#111827", accent: "#55B5E5" } },
      players: [
        { name: "Sergio Rochet", pos: "POR", num: 1, stats: { atajadas: 82, reflejos: 81, salidas: 82, pase: 74, aura: 80 }, look: { skin: "#E0AC69", hair: "#17130F", style: "short", beard: true } },
        { name: "Fernando Muslera", pos: "POR", num: 23, stats: { atajadas: 79, reflejos: 80, salidas: 76, pase: 71, aura: 80 }, look: { skin: "#E0AC69", hair: "#17130F", style: "short", beard: false } },
        { name: "Ronald Araújo", pos: "DEF", num: 4, stats: { tiro: 58, defensa: 82, cabezazo: 84, pase: 76, aura: 82 }, look: { skin: "#C68642", hair: "#17130F", style: "short", beard: false } },
        { name: "José María Giménez", pos: "DEF", num: 2, stats: { tiro: 56, defensa: 82, cabezazo: 82, pase: 72, aura: 80 }, look: { skin: "#E0AC69", hair: "#2A1D12", style: "short", beard: true } },
        { name: "Guillermo Varela", pos: "DEF", num: 13, stats: { tiro: 60, defensa: 79, cabezazo: 72, pase: 76, aura: 74 }, look: { skin: "#E0AC69", hair: "#17130F", style: "buzz", beard: true } },
        { name: "Federico Valverde", pos: "MED", num: 8, stats: { tiro: 88, defensa: 84, cabezazo: 76, pase: 83, aura: 90 }, look: { skin: "#E0AC69", hair: "#8A6B3F", style: "short", beard: false } },
        { name: "Manuel Ugarte", pos: "MED", num: 5, stats: { tiro: 70, defensa: 86, cabezazo: 72, pase: 82, aura: 84 }, look: { skin: "#E0AC69", hair: "#17130F", style: "short", beard: false } },
        { name: "Rodrigo Bentancur", pos: "MED", num: 6, stats: { tiro: 78, defensa: 78, cabezazo: 70, pase: 84, aura: 83 }, look: { skin: "#E0AC69", hair: "#4A331F", style: "short", beard: true } },
        { name: "Darwin Núñez", pos: "DEL", num: 9, stats: { tiro: 82, defensa: 42, cabezazo: 84, pase: 74, aura: 80 }, look: { skin: "#C68642", hair: "#17130F", style: "short", beard: false } },
        { name: "Facundo Pellistri", pos: "DEL", num: 11, stats: { tiro: 82, defensa: 50, cabezazo: 64, pase: 82, aura: 82 }, look: { skin: "#E0AC69", hair: "#8A6B3F", style: "short", beard: false } },
        // 11 player { name: "Maximiliano Araújo", pos: "DEL", num: 20, stats: { tiro: 84, defensa: 52, cabezazo: 70, pase: 80, aura: 84 }, look: { skin: "#E0AC69", hair: "#8A6B3F", style: "short", beard: false } },
      ],
    },
    // ---------- OFC ----------
    {
      id: "AUS", name: "Australia", flag: "🇦🇺", iso: "au", confed: "OFC", playable: true,
      colors: { primary: "#FFB81C", secondary: "#00843D", text: "#0f172a" },
      kits: { field: { shirt: "#FFB81C", accent: "#00843D" }, gk: { shirt: "#334155", accent: "#FFB81C" } },
      players: [
        { name: "Mat Ryan", pos: "POR", num: 1, stats: { atajadas: 78, reflejos: 80, salidas: 74, pase: 69, aura: 78 }, look: { skin: "#F1C27D", hair: "#2A1D12", style: "short", beard: false } },
        { name: "Joe Gauci", pos: "POR", num: 12, stats: { atajadas: 70, reflejos: 73, salidas: 66, pase: 61, aura: 64 }, look: { skin: "#F1C27D", hair: "#2A1D12", style: "short", beard: false } },
        { name: "Harry Souttar", pos: "DEF", num: 19, stats: { tiro: 42, defensa: 81, cabezazo: 86, pase: 61, aura: 74 }, look: { skin: "#FFDBAC", hair: "#8A6B3F", style: "short", beard: false } },
        { name: "Alessandro Circati", pos: "DEF", num: 3, stats: { tiro: 42, defensa: 79, cabezazo: 78, pase: 69, aura: 73 }, look: { skin: "#F1C27D", hair: "#8A6B3F", style: "short", beard: false } },
        { name: "Jordan Bos", pos: "DEF", num: 5, stats: { tiro: 61, defensa: 76, cabezazo: 67, pase: 76, aura: 73 }, look: { skin: "#F1C27D", hair: "#C89B6D", style: "short", beard: false } },
        { name: "Jackson Irvine", pos: "MED", num: 22, stats: { tiro: 68, defensa: 74, cabezazo: 74, pase: 79, aura: 82 }, look: { skin: "#F1C27D", hair: "#4A331F", style: "long", beard: true } },
        { name: "Connor Metcalfe", pos: "MED", num: 8, stats: { tiro: 73, defensa: 66, cabezazo: 60, pase: 79, aura: 72 }, look: { skin: "#F1C27D", hair: "#4A331F", style: "short", beard: false } },
        { name: "Aiden O'Neill", pos: "MED", num: 13, stats: { tiro: 67, defensa: 74, cabezazo: 68, pase: 79, aura: 74 }, look: { skin: "#F1C27D", hair: "#2A1D12", style: "short", beard: true } },
        { name: "Mohamed Touré", pos: "DEL", num: 9, stats: { tiro: 76, defensa: 42, cabezazo: 74, pase: 64, aura: 72 }, look: { skin: "#C68642", hair: "#17130F", style: "short", beard: false } },
        { name: "Nishan Velupillay", pos: "DEL", num: 23, stats: { tiro: 73, defensa: 43, cabezazo: 58, pase: 68, aura: 69 }, look: { skin: "#C68642", hair: "#17130F", style: "short", beard: false } },
        // 11 player { name: "Nestory Irankunda", pos: "DEL", num: 7, stats: { tiro: 79, defensa: 46, cabezazo: 66, pase: 73, aura: 78 }, look: { skin: "#6B4226", hair: "#17130F", style: "short", beard: false } },
      ],
    },
    {
      // Los All Whites: Chris Wood y un plantel humilde
      id: "NZL", name: "Nueva Zelanda", flag: "🇳🇿", iso: "nz", confed: "OFC", playable: true,
      colors: { primary: "#FFFFFF", secondary: "#000000", text: "#0f172a" },
      kits: { field: { shirt: "#FFFFFF", accent: "#000000" }, gk: { shirt: "#EAB308", accent: "#0B0F19" } },
      players: [
        { name: "Max Crocombe",        pos: "POR", num:  1, stats: { atajadas: 68, reflejos: 70, salidas: 64, pase: 56, aura: 62 }, look: { skin: "#F1C27D", hair: "#4A331F", style: "short", beard: true } },
        { name: "Alex Paulsen",        pos: "POR", num: 12, stats: { atajadas: 66, reflejos: 70, salidas: 58, pase: 54, aura: 56 }, look: { skin: "#FFDBAC", hair: "#8A6B3F", style: "short", beard: false } },
        { name: "Liberato Cacace",     pos: "DEF", num:  3, stats: { tiro: 50, defensa: 70, cabezazo: 60, pase: 70, aura: 62 }, look: { skin: "#E0AC69", hair: "#17130F", style: "short", beard: false } },
        { name: "Michael Boxall",      pos: "DEF", num:  5, stats: { tiro: 38, defensa: 70, cabezazo: 70, pase: 54, aura: 64 }, look: { skin: "#A0663A", hair: "#0E0C0A", style: "bald", beard: true } },
        { name: "Tyler Bindon",        pos: "DEF", num:  4, stats: { tiro: 36, defensa: 68, cabezazo: 64, pase: 56, aura: 58 }, look: { skin: "#F1C27D", hair: "#2A1D12", style: "short", beard: false } },
        { name: "Marko Stamenic",      pos: "MED", num:  8, stats: { tiro: 60, defensa: 64, cabezazo: 58, pase: 72, aura: 62 }, look: { skin: "#F1C27D", hair: "#2A1D12", style: "buzz", beard: false } },
        { name: "Sarpreet Singh",      pos: "MED", num: 10, stats: { tiro: 64, defensa: 50, cabezazo: 48, pase: 74, aura: 64 }, look: { skin: "#C68642", hair: "#0E0C0A", style: "short", beard: true } },
        { name: "Matt Garbett",        pos: "MED", num: 13, stats: { tiro: 60, defensa: 58, cabezazo: 54, pase: 68, aura: 60 }, look: { skin: "#FFDBAC", hair: "#6B4F2A", style: "curly", beard: false } },
        { name: "Chris Wood",          pos: "DEL", num:  9, stats: { tiro: 80, defensa: 42, cabezazo: 82, pase: 58, aura: 76 }, look: { skin: "#F1C27D", hair: "#4A331F", style: "buzz", beard: true } },
        { name: "Kosta Barbarouses",   pos: "DEL", num: 11, stats: { tiro: 66, defensa: 44, cabezazo: 56, pase: 62, aura: 64 }, look: { skin: "#E0AC69", hair: "#17130F", style: "short", beard: true } },
      ],
    },
    // ---------- UEFA ----------
    {
      id: "FRA", name: "Francia", flag: "🇫🇷", iso: "fr", confed: "UEFA", playable: true,
      colors: { primary: "#123274", secondary: "#EF4135", text: "#ffffff" },
      kits: { field: { shirt: "#123274", accent: "#FFFFFF" }, gk: { shirt: "#E8D820", accent: "#123274" } },
      players: [
        { name: "Maignan",             pos: "POR", num: 16, stats: { atajadas: 84, reflejos: 87, salidas: 84, pase: 70, aura: 84 }, look: { skin: "#6B4226", hair: "#0E0C0A", style: "buzz", beard: false } },
        { name: "Chevalier",           pos: "POR", num: 23, stats: { atajadas: 82, reflejos: 84, salidas: 78, pase: 72, aura: 74 }, look: { skin: "#F1C27D", hair: "#4A331F", style: "short", beard: false } },
        { name: "Saliba",              pos: "DEF", num: 17, stats: { tiro: 45, defensa: 89, cabezazo: 84, pase: 80, aura: 82 }, look: { skin: "#8D5524", hair: "#0E0C0A", style: "short", beard: false } },
        { name: "Upamecano",           pos: "DEF", num:  4, stats: { tiro: 48, defensa: 88, cabezazo: 85, pase: 76, aura: 78 }, look: { skin: "#6B4226", hair: "#0E0C0A", style: "buzz", beard: false } },
        { name: "Tchouaméni",          pos: "MED", num:  8, stats: { tiro: 68, defensa: 84, cabezazo: 78, pase: 84, aura: 80 }, look: { skin: "#8D5524", hair: "#17130F", style: "short", beard: false } },
        { name: "Manu Koné", pos: "MED", num: 6, stats: { tiro: 76, defensa: 82, cabezazo: 70, pase: 84, aura: 84 }, look: { skin: "#6B4226", hair: "#17130F", style: "short", beard: false } },
        { name: "Adrien Rabiot", pos: "MED", num: 14, stats: { tiro: 78, defensa: 78, cabezazo: 76, pase: 86, aura: 86 }, look: { skin: "#E0AC69", hair: "#4A331F", style: "short", beard: true } },
        { name: "Michael Olise",       pos: "MED", num:  11, stats: { tiro: 92, defensa: 56, cabezazo: 70, pase: 91, aura: 91 }, look: { skin: "#A0663A", hair: "#17130F", style: "short", beard: false } },
        { name: "Mbappé",              pos: "DEL", num: 10, stats: { tiro: 97, defensa: 36, cabezazo: 72, pase: 84, aura: 95 }, look: { skin: "#8D5524", hair: "#0E0C0A", style: "buzz", beard: false } },
        { name: "Dembélé",             pos: "DEL", num: 7, stats: { tiro: 94, defensa: 40, cabezazo: 60, pase: 87, aura: 92 }, look: { skin: "#8D5524", hair: "#17130F", style: "curly", beard: false } },
        // Jugador 11 { name: "Bradley Barcola", pos: "DEL", num: 12, stats: { tiro: 86, defensa: 44, cabezazo: 70, pase: 83, aura: 86 }, look: { skin: "#6B4226", hair: "#17130F", style: "short", beard: false } },
      ],
    },
    {
      id: "ENG", name: "Inglaterra", flag: "🏴󠁧󠁢󠁥󠁮󠁧󠁿", iso: "gb-eng", confed: "UEFA", playable: true,
      colors: { primary: "#FFFFFF", secondary: "#CE1124", text: "#0f172a" },
      kits: { field: { shirt: "#FFFFFF", accent: "#CE1124" }, gk: { shirt: "#7CB518", accent: "#0B0F19" } },
      players: [
        { name: "Pickford",            pos: "POR", num:  1, stats: { atajadas: 84, reflejos: 86, salidas: 80, pase: 76, aura: 82 }, look: { skin: "#F1C27D", hair: "#4A331F", style: "short", beard: true } },
        { name: "Dean Henderson",      pos: "POR", num: 13, stats: { atajadas: 78, reflejos: 80, salidas: 76, pase: 70, aura: 72 }, look: { skin: "#F1C27D", hair: "#2A1D12", style: "short", beard: false } },
        { name: "John Stones",              pos: "DEF", num:  5, stats: { tiro: 55, defensa: 85, cabezazo: 80, pase: 84, aura: 80 }, look: { skin: "#F1C27D", hair: "#6B4F2A", style: "short", beard: false } },
        { name: "Guéhi",               pos: "DEF", num:  6, stats: { tiro: 46, defensa: 85, cabezazo: 78, pase: 76, aura: 78 }, look: { skin: "#6B4226", hair: "#0E0C0A", style: "buzz", beard: false } },
        { name: "Declan Rice",         pos: "MED", num:  4, stats: { tiro: 78, defensa: 86, cabezazo: 76, pase: 88, aura: 84 }, look: { skin: "#F1C27D", hair: "#2A1D12", style: "short", beard: false } },
        { name: "Elliot Anderson", pos: "MED", num: 8, stats: { tiro: 76, defensa: 80, cabezazo: 70, pase: 84, aura: 84 }, look: { skin: "#F1C27D", hair: "#4A331F", style: "short", beard: false } },
        { name: "Bellingham",          pos: "MED", num: 10, stats: { tiro: 84, defensa: 76, cabezazo: 80, pase: 88, aura: 92 }, look: { skin: "#A0663A", hair: "#0E0C0A", style: "buzz", beard: false } },
        { name: "Anthony Gordon", pos: "DEL", num: 18, stats: { tiro: 86, defensa: 48, cabezazo: 68, pase: 82, aura: 86 }, look: { skin: "#E0AC69", hair: "#C69C6D", style: "short", beard: false } },
        { name: "Saka",                pos: "DEL", num:  7, stats: { tiro: 89, defensa: 55, cabezazo: 62, pase: 88, aura: 86 }, look: { skin: "#6B4226", hair: "#0E0C0A", style: "curly", beard: false } },
        { name: "Kane",                pos: "DEL", num:  9, stats: { tiro: 91, defensa: 48, cabezazo: 82, pase: 84, aura: 90 }, look: { skin: "#F1C27D", hair: "#6B4F2A", style: "short", beard: true } },
        // Jugador 11 { name: "Eberechi Eze", pos: "MED", num: 21, stats: { tiro: 84, defensa: 60, cabezazo: 70, pase: 88, aura: 86 }, look: { skin: "#6B4226", hair: "#17130F", style: "short", beard: true } },
      ],
    },
    {
      id: "NOR", name: "Noruega", flag: "🇳🇴", iso: "no", confed: "UEFA", playable: true,
      colors: { primary: "#EF2B2D", secondary: "#00205B", text: "#ffffff" },
      kits: { field: { shirt: "#EF2B2D", accent: "#FFFFFF" }, gk: { shirt: "#0E9F6E", accent: "#111827" } },
      players: [
        { name: "Ørjan Nyland",        pos: "POR", num:  1, stats: { atajadas: 76, reflejos: 74, salidas: 70, pase: 55, aura: 70 }, look: { skin: "#F1C27D", hair: "#6B4F2A", style: "buzz", beard: true } },
        { name: "Egil Selvik",         pos: "POR", num: 12, stats: { atajadas: 66, reflejos: 68, salidas: 60, pase: 48, aura: 55 }, look: { skin: "#FFDBAC", hair: "#8A6B3F", style: "short", beard: false } },
        { name: "Kristoffer Ajer",     pos: "DEF", num:  3, stats: { tiro: 42, defensa: 77, cabezazo: 74, pase: 62, aura: 62 }, look: { skin: "#FFDBAC", hair: "#E8C56A", style: "bun", beard: false } },
        { name: "Leo Østigård",        pos: "DEF", num: 15, stats: { tiro: 35, defensa: 76, cabezazo: 78, pase: 55, aura: 64 }, look: { skin: "#F1C27D", hair: "#6B4F2A", style: "short", beard: true } },
        { name: "Julian Ryerson",      pos: "DEF", num:  2, stats: { tiro: 52, defensa: 78, cabezazo: 64, pase: 70, aura: 66 }, look: { skin: "#F1C27D", hair: "#4A331F", style: "short", beard: true } },
        { name: "Martin Ødegaard",     pos: "MED", num: 10, stats: { tiro: 78, defensa: 55, cabezazo: 45, pase: 92, aura: 90 }, look: { skin: "#FFDBAC", hair: "#E8C56A", style: "short", beard: false } },
        { name: "Sander Berge",        pos: "MED", num:  8, stats: { tiro: 62, defensa: 72, cabezazo: 66, pase: 78, aura: 64 }, look: { skin: "#F1C27D", hair: "#2E2419", style: "bun", beard: true } },
        { name: "Patrick Berg",        pos: "MED", num:  6, stats: { tiro: 55, defensa: 64, cabezazo: 52, pase: 80, aura: 62 }, look: { skin: "#FFDBAC", hair: "#8A6B3F", style: "short", beard: false } },
        { name: "Erling Haaland",      pos: "DEL", num:  9, stats: { tiro: 97, defensa: 40, cabezazo: 93, pase: 66, aura: 95 }, look: { skin: "#FFDBAC", hair: "#F3D96B", style: "long", beard: false } },
        { name: "Alexander Sørloth",   pos: "DEL", num: 19, stats: { tiro: 84, defensa: 35, cabezazo: 88, pase: 58, aura: 72 }, look: { skin: "#F1C27D", hair: "#6B4F2A", style: "buzz", beard: true } },
      ],
    },
    {
      id: "POR", name: "Portugal", flag: "🇵🇹", iso: "pt", confed: "UEFA", playable: true,
      colors: { primary: "#C8102E", secondary: "#046A38", text: "#0f172a" },
      kits: { field: { shirt: "#C8102E", accent: "#046A38" }, gk: { shirt: "#F59E0B", accent: "#C8102E" } },
      players: [
        { name: "Diogo Costa", pos: "POR", num: 1, stats: { atajadas: 83, reflejos: 84, salidas: 84, pase: 82, aura: 85 }, look: { skin: "#E0AC69", hair: "#17130F", style: "short", beard: false } },
        { name: "José Sá", pos: "POR", num: 12, stats: { atajadas: 81, reflejos: 82, salidas: 78, pase: 74, aura: 74 }, look: { skin: "#E0AC69", hair: "#2A1D12", style: "short", beard: true } },
        { name: "Rúben Dias", pos: "DEF", num: 3, stats: { tiro: 58, defensa: 85, cabezazo: 85, pase: 80, aura: 85 }, look: { skin: "#E0AC69", hair: "#17130F", style: "short", beard: true } },
        { name: "Nuno Mendes", pos: "DEF", num: 19, stats: { tiro: 72, defensa: 88, cabezazo: 74, pase: 86, aura: 87 }, look: { skin: "#6B4226", hair: "#17130F", style: "short", beard: false } },
        { name: "João Cancelo", pos: "DEF", num: 20, stats: { tiro: 74, defensa: 82, cabezazo: 68, pase: 88, aura: 86 }, look: { skin: "#E0AC69", hair: "#2A1D12", style: "short", beard: true } },
        { name: "Vitinha", pos: "MED", num: 23, stats: { tiro: 82, defensa: 74, cabezazo: 64, pase: 92, aura: 87 }, look: { skin: "#E0AC69", hair: "#2A1D12", style: "short", beard: false } },
        { name: "Bruno Fernandes", pos: "MED", num: 8, stats: { tiro: 85, defensa: 66, cabezazo: 70, pase: 93, aura: 86 }, look: { skin: "#E0AC69", hair: "#2A1D12", style: "short", beard: true } },
        { name: "João Neves", pos: "MED", num: 15, stats: { tiro: 74, defensa: 82, cabezazo: 66, pase: 86, aura: 85 }, look: { skin: "#E0AC69", hair: "#4A331F", style: "short", beard: false } },
        { name: "Cristiano Ronaldo", pos: "DEL", num: 7, stats: { tiro: 85, defensa: 36, cabezazo: 82, pase: 70, aura: 99 }, look: { skin: "#E0AC69", hair: "#17130F", style: "short", beard: false } },
        { name: "Pedro Neto", pos: "DEL", num: 11, stats: { tiro: 86, defensa: 46, cabezazo: 68, pase: 84, aura: 85 }, look: { skin: "#C68642", hair: "#17130F", style: "short", beard: true } },
        // Jugador 11 { name: "Rafael Leão", pos: "DEL", num: 17, stats: { tiro: 84, defensa: 42, cabezazo: 74, pase: 82, aura: 85 }, look: { skin: "#6B4226", hair: "#17130F", style: "short", beard: true } },
      ],
    },

    // ╔════════════════════════════════════════════════════════════════════╗
    // ║ 2. RIVALES CLASIFICADOS NO JUGABLES AUN (28) — orden confederación ║
    // ║    y alfabético                                                    ║
    // ╚════════════════════════════════════════════════════════════════════╝

    // ---------- AFC ----------
    {
      id: "KSA", name: "Arabia Saudita", flag: "🇸🇦", iso: "sa", confed: "AFC", rating: 68,
      kit: { shirt: "#FFFFFF", accent: "#006C35" },
      figures: [
        { name: "Al-Dawsari", pos: "DEL" },
        { name: "Al-Buraikan", pos: "DEL" },
        { name: "Kanno", pos: "MED" },
        { name: "Al-Tambakti", pos: "DEF" },
        { name: "Al-Owais", pos: "POR" },
      ],
    },
    {
      id: "QAT", name: "Catar", flag: "🇶🇦", iso: "qa", confed: "AFC", rating: 67,
      kit: { shirt: "#8A1538", accent: "#FFFFFF" },
      figures: [
        { name: "Akram Afif", pos: "DEL" },
        { name: "Almoez Ali", pos: "DEL" },
        { name: "Boudiaf", pos: "MED" },
        { name: "Al-Rawi", pos: "DEF" },
        { name: "Barsham", pos: "POR" },
      ],
    },
    {
      // Clasificó por repechaje intercontinental: venció a Bolivia 2-1 (mar-2026). Primer mundial desde 1986
      id: "IRQ", name: "Irak", flag: "🇮🇶", iso: "iq", confed: "AFC", rating: 69,
      kit: { shirt: "#007A3D", accent: "#FFFFFF" },
      figures: [
        { name: "Aymen Hussein", pos: "DEL" },
        { name: "Al-Hamadi", pos: "DEL" },
        { name: "Zidane Iqbal", pos: "MED" },
        { name: "Merchas Doski", pos: "DEF" },
        { name: "Jalal Hassan", pos: "POR" },
      ],
    },
    {
      id: "IRN", name: "Irán", flag: "🇮🇷", iso: "ir", confed: "AFC", rating: 73,
      kit: { shirt: "#FFFFFF", accent: "#DA0000" },
      figures: [
        { name: "Taremi", pos: "DEL" },
        { name: "Azmoun", pos: "DEL" },
        { name: "Ezatolahi", pos: "MED" },
        { name: "Majid Hosseini", pos: "DEF" },
        { name: "Beiranvand", pos: "POR" },
      ],
    },
    {
      id: "JOR", name: "Jordania", flag: "🇯🇴", iso: "jo", confed: "AFC", rating: 66,
      kit: { shirt: "#CE1126", accent: "#FFFFFF" },
      figures: [
        { name: "Al-Taamari", pos: "DEL" },
        { name: "Al-Naimat", pos: "DEL" },
        { name: "Al-Rawabdeh", pos: "MED" },
        { name: "Abdallah Nasib", pos: "DEF" },
        { name: "Abulaila", pos: "POR" },
      ],
    },
    {
      id: "UZB", name: "Uzbekistán", flag: "🇺🇿", iso: "uz", confed: "AFC", rating: 68,
      kit: { shirt: "#FFFFFF", accent: "#0099B5" },
      figures: [
        { name: "Shomurodov", pos: "DEL" },
        { name: "Fayzullaev", pos: "MED" },
        { name: "Shukurov", pos: "MED" },
        { name: "Khusanov", pos: "DEF" },
        { name: "Yusupov", pos: "POR" },
      ],
    },
    // ---------- CAF ----------
    {
      id: "ALG", name: "Argelia", flag: "🇩🇿", iso: "dz", confed: "CAF", rating: 74,
      kit: { shirt: "#FFFFFF", accent: "#006233" },
      figures: [
        { name: "Mahrez", pos: "DEL" },
        { name: "Amine Gouiri", pos: "DEL" },
        { name: "Bennacer", pos: "MED" },
        { name: "Aïssa Mandi", pos: "DEF" },
        { name: "Luca Zidane", pos: "POR" },
      ],
    },
    {
      id: "CIV", name: "Costa de Marfil", flag: "🇨🇮", iso: "ci", confed: "CAF", rating: 74,
      kit: { shirt: "#FF8200", accent: "#FFFFFF" },
      figures: [
        { name: "Sébastien Haller", pos: "DEL" },
        { name: "Amad Diallo", pos: "DEL" },
        { name: "Franck Kessié", pos: "MED" },
        { name: "Evan Ndicka", pos: "DEF" },
        { name: "Yahia Fofana", pos: "POR" },
      ],
    },
    {
      id: "EGY", name: "Egipto", flag: "🇪🇬", iso: "eg", confed: "CAF", rating: 74,
      kit: { shirt: "#CE1126", accent: "#FFFFFF" },
      figures: [
        { name: "Salah", pos: "DEL" },
        { name: "Marmoush", pos: "DEL" },
        { name: "Elneny", pos: "MED" },
        { name: "Hegazy", pos: "DEF" },
        { name: "El Shenawy", pos: "POR" },
      ],
    },
    {
      id: "GHA", name: "Ghana", flag: "🇬🇭", iso: "gh", confed: "CAF", rating: 73,
      kit: { shirt: "#FFFFFF", accent: "#CE1126" },
      figures: [
        { name: "Kudus", pos: "MED" },
        { name: "Thomas Partey", pos: "MED" },
        { name: "Semenyo", pos: "DEL" },
        { name: "Djiku", pos: "DEF" },
        { name: "Ati-Zigi", pos: "POR" },
      ],
    },
    {
      id: "COD", name: "RD Congo", flag: "🇨🇩", iso: "cd", confed: "CAF", rating: 69,
      kit: { shirt: "#007FFF", accent: "#F7D618" },
      figures: [
        { name: "Bakambu", pos: "DEL" },
        { name: "Yoane Wissa", pos: "DEL" },
        { name: "Théo Bongonda", pos: "MED" },
        { name: "Chancel Mbemba", pos: "DEF" },
        { name: "Lionel Mpasi", pos: "POR" },
      ],
    },
    {
      id: "RSA", name: "Sudáfrica", flag: "🇿🇦", iso: "za", confed: "CAF", rating: 69,
      kit: { shirt: "#FFB612", accent: "#007A4D" },
      figures: [
        { name: "Percy Tau", pos: "DEL" },
        { name: "Teboho Mokoena", pos: "MED" },
        { name: "Themba Zwane", pos: "MED" },
        { name: "Aubrey Modiba", pos: "DEF" },
        { name: "Ronwen Williams", pos: "POR" },
      ],
    },
    {
      id: "TUN", name: "Túnez", flag: "🇹🇳", iso: "tn", confed: "CAF", rating: 72,
      kit: { shirt: "#E70013", accent: "#FFFFFF" },
      figures: [
        { name: "Hannibal Mejbri", pos: "MED" },
        { name: "Laïdouni", pos: "MED" },
        { name: "Msakni", pos: "DEL" },
        { name: "Montassar Talbi", pos: "DEF" },
        { name: "Aymen Dahmen", pos: "POR" },
      ],
    },
    // ---------- CONCACAF ----------
    {
      id: "CUW", name: "Curazao", flag: "🇨🇼", iso: "cw", confed: "CONCACAF", rating: 56,
      kit: { shirt: "#002B7F", accent: "#F9E814" },
      figures: [
        { name: "Leandro Bacuna", pos: "MED" },
        { name: "Juninho Bacuna", pos: "MED" },
        { name: "Locadia", pos: "DEL" },
        { name: "Cuco Martina", pos: "DEF" },
        { name: "Eloy Room", pos: "POR" },
      ],
    },
    {
      id: "HAI", name: "Haití", flag: "🇭🇹", iso: "ht", confed: "CONCACAF", rating: 61,
      kit: { shirt: "#00209F", accent: "#D21034" },
      figures: [
        { name: "Duckens Nazon", pos: "DEL" },
        { name: "Danley Jean Jacques", pos: "MED" },
        { name: "Josué Casimir", pos: "DEL" },
        { name: "Ricardo Adé", pos: "DEF" },
        { name: "Johnny Placide", pos: "POR" },
      ],
    },
    {
      id: "PAN", name: "Panamá", flag: "🇵🇦", iso: "pa", confed: "CONCACAF", rating: 68,
      kit: { shirt: "#D21034", accent: "#005293" },
      figures: [
        { name: "Carrasquilla", pos: "MED" },
        { name: "José Fajardo", pos: "DEL" },
        { name: "Ismael Díaz", pos: "DEL" },
        { name: "Amir Murillo", pos: "DEF" },
        { name: "Orlando Mosquera", pos: "POR" },
      ],
    },
    // ---------- UEFA ----------
    {
      id: "GER", name: "Alemania", flag: "🇩🇪", iso: "de", confed: "UEFA", rating: 86,
      kit: { shirt: "#FFFFFF", accent: "#000000" },
      figures: [
        { name: "Wirtz", pos: "MED" },
        { name: "Musiala", pos: "MED" },
        { name: "Havertz", pos: "DEL" },
        { name: "Rüdiger", pos: "DEF" },
        { name: "Ter Stegen", pos: "POR" },
      ],
    },
    {
      id: "AUT", name: "Austria", flag: "🇦🇹", iso: "at", confed: "UEFA", rating: 78,
      kit: { shirt: "#ED2939", accent: "#FFFFFF" },
      figures: [
        { name: "Alaba", pos: "DEF" },
        { name: "Sabitzer", pos: "MED" },
        { name: "Baumgartner", pos: "MED" },
        { name: "Arnautović", pos: "DEL" },
        { name: "Schlager", pos: "POR" },
      ],
    },
    {
      id: "BEL", name: "Bélgica", flag: "🇧🇪", iso: "be", confed: "UEFA", rating: 83,
      kit: { shirt: "#D71920", accent: "#FDB913" },
      figures: [
        { name: "De Bruyne", pos: "MED" },
        { name: "Lukaku", pos: "DEL" },
        { name: "Doku", pos: "DEL" },
        { name: "Theate", pos: "DEF" },
        { name: "Courtois", pos: "POR" },
      ],
    },
    {
      // Clasificó por repechaje UEFA: eliminó a Gales y a Italia (mar-2026)
      id: "BIH", name: "Bosnia y Herzegovina", flag: "🇧🇦", iso: "ba", confed: "UEFA", rating: 74,
      kit: { shirt: "#002F6C", accent: "#FCD116" },
      figures: [
        { name: "Džeko", pos: "DEL" },
        { name: "Demirović", pos: "DEL" },
        { name: "Tahirović", pos: "MED" },
        { name: "Amar Dedić", pos: "DEF" },
        { name: "Nikola Vasilj", pos: "POR" },
      ],
    },
    {
      // Clasificó por repechaje UEFA: eliminó a Irlanda y Dinamarca (mar-2026)
      id: "CZE", name: "Chequia", flag: "🇨🇿", iso: "cz", confed: "UEFA", rating: 77,
      kit: { shirt: "#D7141A", accent: "#11457E" },
      figures: [
        { name: "Schick", pos: "DEL" },
        { name: "Souček", pos: "MED" },
        { name: "Provod", pos: "MED" },
        { name: "Ladislav Krejčí", pos: "DEF" },
        { name: "Kinský", pos: "POR" },
      ],
    },
    {
      id: "CRO", name: "Croacia", flag: "🇭🇷", iso: "hr", confed: "UEFA", rating: 82,
      kit: { shirt: "#FFFFFF", accent: "#E63946" },
      figures: [
        { name: "Modrić", pos: "MED" },
        { name: "Kovačić", pos: "MED" },
        { name: "Kramarić", pos: "DEL" },
        { name: "Gvardiol", pos: "DEF" },
        { name: "Livaković", pos: "POR" },
      ],
    },
    {
      id: "SCO", name: "Escocia", flag: "🏴󠁧󠁢󠁳󠁣󠁴󠁿", iso: "gb-sct", confed: "UEFA", rating: 74,
      kit: { shirt: "#003078", accent: "#FFFFFF" },
      figures: [
        { name: "McTominay", pos: "MED" },
        { name: "McGinn", pos: "MED" },
        { name: "Che Adams", pos: "DEL" },
        { name: "Robertson", pos: "DEF" },
        { name: "Gunn", pos: "POR" },
      ],
    },
    {
      id: "ESP", name: "España", flag: "🇪🇸", iso: "es", confed: "UEFA", rating: 92,
      kit: { shirt: "#C60B1E", accent: "#FFC400" },
      figures: [
        { name: "Lamine Yamal", pos: "DEL" },
        { name: "Pedri", pos: "MED" },
        { name: "Rodri", pos: "MED" },
        { name: "Huijsen", pos: "DEF" },
        { name: "Unai Simón", pos: "POR" },
      ],
    },
    {
      id: "NED", name: "Países Bajos", flag: "🇳🇱", iso: "nl", confed: "UEFA", rating: 86,
      kit: { shirt: "#F36C21", accent: "#FFFFFF" },
      figures: [
        { name: "Gakpo", pos: "DEL" },
        { name: "Depay", pos: "DEL" },
        { name: "Frenkie de Jong", pos: "MED" },
        { name: "Van Dijk", pos: "DEF" },
        { name: "Verbruggen", pos: "POR" },
      ],
    },
    {
      // Clasificó por repechaje UEFA: venció a Ucrania y Polonia (mar-2026)
      id: "SWE", name: "Suecia", flag: "🇸🇪", iso: "se", confed: "UEFA", rating: 81,
      kit: { shirt: "#FFCD00", accent: "#0072CE" },
      figures: [
        { name: "Isak", pos: "DEL" },
        { name: "Gyökeres", pos: "DEL" },
        { name: "Kulusevski", pos: "MED" },
        { name: "Lindelöf", pos: "DEF" },
        { name: "Viktor Johansson", pos: "POR" },
      ],
    },
    {
      id: "SUI", name: "Suiza", flag: "🇨🇭", iso: "ch", confed: "UEFA", rating: 78,
      kit: { shirt: "#D52B1E", accent: "#FFFFFF" },
      figures: [
        { name: "Xhaka", pos: "MED" },
        { name: "Embolo", pos: "DEL" },
        { name: "Ndoye", pos: "DEL" },
        { name: "Akanji", pos: "DEF" },
        { name: "Sommer", pos: "POR" },
      ],
    },
    {
      id: "TUR", name: "Turquía", flag: "🇹🇷", iso: "tr", confed: "UEFA", rating: 79,
      kit: { shirt: "#E30A17", accent: "#FFFFFF" },
      figures: [
        { name: "Arda Güler", pos: "MED" },
        { name: "Çalhanoğlu", pos: "MED" },
        { name: "Kenan Yıldız", pos: "DEL" },
        { name: "Demiral", pos: "DEF" },
        { name: "Uğurcan Çakır", pos: "POR" },
      ],
    },

    // ╔══════════════════════════════════════════════════════════════════╗
    // ║ 3. NO CLASIFICADOS (4) — fuera del sorteo, para futuras features ║
    // ║    (qualified: false) — orden confederación y alfabético         ║
    // ╚══════════════════════════════════════════════════════════════════╝

    // ---------- CONMEBOL ----------
    {
      // No clasificó: perdió la final del repechaje intercontinental vs Irak (1-2, mar-2026)
      id: "BOL", name: "Bolivia", flag: "🇧🇴", iso: "bo", confed: "CONMEBOL", qualified: false, rating: 62,
      kit: { shirt: "#007A33", accent: "#FFFFFF" },
      figures: [
        { name: "Miguel Terceros", pos: "MED" },
        { name: "Ramiro Vaca", pos: "MED" },
        { name: "Enzo Monteiro", pos: "DEL" },
        { name: "Luis Haquin", pos: "DEF" },
        { name: "Carlos Lampe", pos: "POR" },
      ],
    },
    // ---------- UEFA ----------
    {
      // No clasificó: perdió la final del repechaje UEFA vs Chequia (penales, mar-2026)
      id: "DEN", name: "Dinamarca", flag: "🇩🇰", iso: "dk", confed: "UEFA", qualified: false, rating: 78,
      kit: { shirt: "#C8102E", accent: "#FFFFFF" },
      figures: [
        { name: "Højlund", pos: "DEL" },
        { name: "Eriksen", pos: "MED" },
        { name: "Hjulmand", pos: "MED" },
        { name: "Andersen", pos: "DEF" },
        { name: "Schmeichel", pos: "POR" },
      ],
    },
    {
      // No clasificó: perdió la final del repechaje UEFA vs Bosnia (penales, mar-2026)
      id: "ITA", name: "Italia", flag: "🇮🇹", iso: "it", confed: "UEFA", qualified: false, rating: 82,
      kit: { shirt: "#2A66B0", accent: "#FFFFFF" },
      figures: [
        { name: "Donnarumma", pos: "POR" },
        { name: "Barella", pos: "MED" },
        { name: "Tonali", pos: "MED" },
        { name: "Bastoni", pos: "DEF" },
        { name: "Retegui", pos: "DEL" },
      ],
    },
    {
      // No clasificó: perdió la final del repechaje UEFA vs Suecia (2-3, mar-2026)
      id: "POL", name: "Polonia", flag: "🇵🇱", iso: "pl", confed: "UEFA", qualified: false, rating: 74,
      kit: { shirt: "#FFFFFF", accent: "#DC143C" },
      figures: [
        { name: "Lewandowski", pos: "DEL" },
        { name: "Zieliński", pos: "MED" },
        { name: "Świderski", pos: "DEL" },
        { name: "Bednarek", pos: "DEF" },
        { name: "Szczęsny", pos: "POR" },
      ],
    },
  ]
};
