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
//   kits    { field, alt, gk } cada uno {shirt, accent} → camisetas de los sprites
//           `alt` es la ALTERNATIVA REAL del Mundial 2026: el motor la usa sola cuando la
//           titular choca con la del rival (ui/sprites.fieldKitVs). Se cambia el rival,
//           nunca tu selección. Sin `alt`, el equipo no se cambia nunca.
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
    // ║ 1. SELECCIONES JUGABLES (48) — LAS 48 DEL MUNDIAL 2026          ║
    // ╚═════════════════════════════════════════════════════════════════╝

    // ---------- AFC ----------
    {
      id: "KOR", name: "Corea del Sur", flag: "🇰🇷", iso: "kr", confed: "AFC", playable: true,
      colors: { primary: "#CD2E3A", secondary: "#0047A0", text: "#ffffff" },
      kits: { field: { shirt: "#CD2E3A", accent: "#000000" }, alt: { shirt: "#000000", accent: "#CD2E3A" }, gk: { shirt: "#16A34A", accent: "#0B0F19" } },
      players: [
        { name: "Jo Hyeon-woo",        pos: "POR", num: 21, stats: { atajadas: 84, reflejos: 87, salidas: 76, pase_corto: 71, pase_largo: 70, velocidad: 52, aura: 76 }, look: { skin: "#F1C27D", hair: "#0E0C0A", style: "short", beard: false } },
        { name: "Kim Seung-gyu",       pos: "POR", num:  1, stats: { atajadas: 78, reflejos: 79, salidas: 74, pase_corto: 73, pase_largo: 72, velocidad: 48, aura: 72 }, look: { skin: "#F1C27D", hair: "#17130F", style: "short", beard: false } },
        
        { name: "Kim Min-jae",         pos: "DEF", num:  4, stats: { tiro: 52, defensa: 87, cabezazo: 83, pase_corto: 78, pase_largo: 75, velocidad: 76, aura: 80 }, look: { skin: "#F1C27D", hair: "#0E0C0A", style: "buzz", beard: false } },
        { name: "Kim Young-gwon",      pos: "DEF", num: 19, stats: { tiro: 46, defensa: 80, cabezazo: 76, pase_corto: 75, pase_largo: 71, velocidad: 62, aura: 72 }, look: { skin: "#F1C27D", hair: "#17130F", style: "short", beard: false } },
        { name: "Seol Young-woo",      pos: "DEF", num:  3, stats: { tiro: 60, defensa: 75, cabezazo: 65, pase_corto: 77, pase_largo: 71, velocidad: 78, aura: 70 }, look: { skin: "#F1C27D", hair: "#0E0C0A", style: "short", beard: false } },
        
        { name: "Lee Kang-in",         pos: "MED", num: 18, stats: { tiro: 82, defensa: 58, cabezazo: 58, pase_corto: 94, pase_largo: 87, velocidad: 70, aura: 82 }, look: { skin: "#F1C27D", hair: "#17130F", style: "long", beard: false } },
        { name: "Hwang In-beom",       pos: "MED", num:  6, stats: { tiro: 75, defensa: 77, cabezazo: 68, pase_corto: 86, pase_largo: 88, velocidad: 64, aura: 76 }, look: { skin: "#F1C27D", hair: "#17130F", style: "buzz", beard: false } },
        { name: "Paik Seung-ho",       pos: "MED", num:  8, stats: { tiro: 76, defensa: 72, cabezazo: 66, pase_corto: 83, pase_largo: 78, velocidad: 66, aura: 72 }, look: { skin: "#F1C27D", hair: "#2A1D12", style: "buzz", beard: false } },
        
        { name: "Son Heung-min",       pos: "DEL", num:  7, stats: { tiro: 85, defensa: 48, cabezazo: 68, pase_corto: 87, pase_largo: 78, velocidad: 86, aura: 88 }, look: { skin: "#F1C27D", hair: "#2A1D12", style: "short", beard: false } },
        { name: "Hwang Hee-chan",      pos: "DEL", num: 11, stats: { tiro: 81, defensa: 52, cabezazo: 65, pase_corto: 75, pase_largo: 65, velocidad: 84, aura: 78 }, look: { skin: "#F1C27D", hair: "#0E0C0A", style: "short", beard: true } },
        // Jugador 11 { name: "Lee Jae-sung",        pos: "MED", num: 10, stats: { tiro: 78, defensa: 65, cabezazo: 67, pase: 82, aura: 79 }, look: { skin: "#F1C27D", hair: "#17130F", style: "short", beard: false } },
      ],
    },
    {
      id: "JPN", name: "Japón", flag: "🇯🇵", iso: "jp", confed: "AFC", playable: true,
      colors: { primary: "#143C8C", secondary: "#DC0032", text: "#ffffff" },
      kits: { field: { shirt: "#143C8C", accent: "#FFFFFF" }, alt: { shirt: "#FFFFFF", accent: "#DC0032" }, gk: { shirt: "#F59E0B", accent: "#143C8C" } },
      players: [
        { name: "Zion Suzuki",     pos: "POR", num:  1, stats: { atajadas: 83, reflejos: 85, salidas: 79, pase_corto: 76, pase_largo: 75, velocidad: 54, aura: 74 }, look: { skin: "#A0663A", hair: "#0E0C0A", style: "buzz", beard: false } },
        { name: "Tomoki Hayakawa", pos: "POR", num: 23, stats: { atajadas: 78, reflejos: 80, salidas: 74, pase_corto: 73, pase_largo: 71, velocidad: 50, aura: 70 }, look: { skin: "#F1C27D", hair: "#0E0C0A", style: "short", beard: false } },

        { name: "Tomiyasu",         pos: "DEF", num: 16, stats: { tiro: 50, defensa: 84, cabezazo: 77, pase_corto: 80, pase_largo: 76, velocidad: 74, aura: 74 }, look: { skin: "#F1C27D", hair: "#0E0C0A", style: "short", beard: false } },
        { name: "Itakura",          pos: "DEF", num:  4, stats: { tiro: 48, defensa: 81, cabezazo: 78, pase_corto: 77, pase_largo: 74, velocidad: 76, aura: 72 }, look: { skin: "#F1C27D", hair: "#17130F", style: "short", beard: false } },
        { name: "Sugawara",         pos: "DEF", num:  2, stats: { tiro: 62, defensa: 76, cabezazo: 66, pase_corto: 82, pase_largo: 77, velocidad: 78, aura: 70 }, look: { skin: "#F1C27D", hair: "#0E0C0A", style: "buzz", beard: false } },

        { name: "Wataru Endō",      pos: "MED", num:  6, stats: { tiro: 71, defensa: 87, cabezazo: 78, pase_corto: 86, pase_largo: 84, velocidad: 58, aura: 82 }, look: { skin: "#F1C27D", hair: "#0E0C0A", style: "buzz", beard: true } },
        { name: "Kamada",           pos: "MED", num: 15, stats: { tiro: 78, defensa: 68, cabezazo: 70, pase_corto: 86, pase_largo: 82, velocidad: 72, aura: 76 }, look: { skin: "#F1C27D", hair: "#17130F", style: "long", beard: false } },
        { name: "Take Kubo",        pos: "MED", num:  8, stats: { tiro: 81, defensa: 55, cabezazo: 58, pase_corto: 89, pase_largo: 81, velocidad: 84, aura: 82 }, look: { skin: "#F1C27D", hair: "#2A1D12", style: "short", beard: false } },

        { name: "Daizen Maeda",     pos: "DEL", num: 11, stats: { tiro: 81, defensa: 48, cabezazo: 57, pase_corto: 79, pase_largo: 69, velocidad: 92, aura: 82 }, look: { skin: "#F1C27D", hair: "#17130F", style: "buzz", beard: false } },
        { name: "Ayase Ueda",       pos: "DEL", num: 18, stats: { tiro: 80, defensa: 44, cabezazo: 78, pase_corto: 65, pase_largo: 56, velocidad: 74, aura: 70 }, look: { skin: "#F1C27D", hair: "#2A1D12", style: "buzz", beard: false } },
        // Jugador 11 { name: "Ritsu Dōan",       pos: "DEL", num: 10, stats: { tiro: 81, defensa: 48, cabezazo: 60, pase: 78, aura: 76 }, look: { skin: "#F1C27D", hair: "#17130F", style: "short", beard: false } },
      ],
    },
    // ---------- CAF ----------
    {
      // Modo "Campaña legendaria". YA NO es el plantel más modesto: al entrar las 48 del
      // Mundial 2026 quedaron seis por debajo (Curazao 59 es el nuevo piso, y Haití, Jordania,
      // Catar, Uzbekistán e Irak andan entre 63 y 67). Y está bien que así sea: Cabo Verde
      // llegó a 16avos y su arquero entró al Equipo del Torneo, mientras que esos seis se
      // fueron en primera ronda. Sigue siendo LA campaña legendaria por narrativa —la isla
      // que sueña en grande— no por ser el más débil de la lista.
      id: "CPV", name: "Cabo Verde", flag: "🇨🇻", iso: "cv", confed: "CAF", playable: true,
      colors: { primary: "#003893", secondary: "#CE1126", text: "#ffffff" },
      kits: { field: { shirt: "#003893", accent: "#FFFFFF" }, alt: { shirt: "#FFFFFF", accent: "#003893" }, gk: { shirt: "#57534E", accent: "#F9E814" } },
      players: [
        { name: "Vozinha",             pos: "POR", num:  1, stats: { atajadas: 77, reflejos: 79, salidas: 64, pase_corto: 57, pase_largo: 56, velocidad: 50, aura: 80 }, look: { skin: "#6B4226", hair: "#0E0C0A", style: "curly", beard: true } },
        { name: "Márcio Rosa",         pos: "POR", num: 12, stats: { atajadas: 61, reflejos: 63, salidas: 57, pase_corto: 52, pase_largo: 50, velocidad: 48, aura: 56 }, look: { skin: "#8D5524", hair: "#0E0C0A", style: "buzz", beard: false } },

        { name: "Logan Costa",         pos: "DEF", num:  5, stats: { tiro: 44, defensa: 70, cabezazo: 70, pase_corto: 61, pase_largo: 57, velocidad: 62, aura: 62 }, look: { skin: "#8D5524", hair: "#0E0C0A", style: "short", beard: true } },
        { name: "Pico Lopes",       pos: "DEF", num:  4, stats: { tiro: 40, defensa: 71, cabezazo: 67, pase_corto: 60, pase_largo: 55, velocidad: 60, aura: 62 }, look: { skin: "#A0663A", hair: "#0E0C0A", style: "bald", beard: true } },
        { name: "Diney Borges",        pos: "DEF", num:  3, stats: { tiro: 42, defensa: 63, cabezazo: 59, pase_corto: 57, pase_largo: 51, velocidad: 72, aura: 54 }, look: { skin: "#6B4226", hair: "#17130F", style: "buzz", beard: false } },

        { name: "Jamiro Monteiro",     pos: "MED", num: 10, stats: { tiro: 59, defensa: 55, cabezazo: 54, pase_corto: 70, pase_largo: 65, velocidad: 72, aura: 64 }, look: { skin: "#8D5524", hair: "#0E0C0A", style: "buzz", beard: true } },
        { name: "Kenny Rocha",         pos: "MED", num:  6, stats: { tiro: 54, defensa: 52, cabezazo: 52, pase_corto: 65, pase_largo: 60, velocidad: 74, aura: 58 }, look: { skin: "#8D5524", hair: "#17130F", style: "short", beard: false } },
        { name: "Deroy Duarte",        pos: "MED", num: 14, stats: { tiro: 56, defensa: 50, cabezazo: 50, pase_corto: 66, pase_largo: 62, velocidad: 70, aura: 56 }, look: { skin: "#A0663A", hair: "#0E0C0A", style: "curly", beard: false } },

        { name: "Ryan Mendes",         pos: "DEL", num: 20, stats: { tiro: 65, defensa: 42, cabezazo: 55, pase_corto: 66, pase_largo: 58, velocidad: 74, aura: 68 }, look: { skin: "#6B4226", hair: "#0E0C0A", style: "buzz", beard: false } },
        { name: "Dailon Livramento",   pos: "DEL", num: 19, stats: { tiro: 64, defensa: 38, cabezazo: 54, pase_corto: 53, pase_largo: 44, velocidad: 82, aura: 58 }, look: { skin: "#8D5524", hair: "#0E0C0A", style: "short", beard: false } },
        // Jugador 11 { name: "Garry Rodrigues",     pos: "DEL", num: 11, stats: { tiro: 69, defensa: 40, cabezazo: 58, pase: 62, aura: 66 }, look: { skin: "#6B4226", hair: "#0E0C0A", style: "buzz", beard: true } },
      ],
    },
    {
      id: "MAR", name: "Marruecos", flag: "🇲🇦", iso: "ma", confed: "CAF", playable: true,
      colors: { primary: "#C1272D", secondary: "#006233", text: "#ffffff" },
      kits: { field: { shirt: "#C1272D", accent: "#006233" }, alt: { shirt: "#FFFFFF", accent: "#006233" }, gk: { shirt: "#FACC15", accent: "#0B0F19" } },
      players: [
          { name: "Bounou",              pos: "POR", num:  1, stats: { atajadas: 88, reflejos: 89, salidas: 83, pase_corto: 75, pase_largo: 75, velocidad: 50, aura: 84 }, look: { skin: "#E0AC69", hair: "#17130F", style: "short", beard: true } },
          { name: "Munir",               pos: "POR", num: 12, stats: { atajadas: 76, reflejos: 78, salidas: 72, pase_corto: 69, pase_largo: 68, velocidad: 48, aura: 68 }, look: { skin: "#C68642", hair: "#17130F", style: "short", beard: false } },

          { name: "Hakimi",              pos: "DEF", num:  2, stats: { tiro: 76, defensa: 88, cabezazo: 72, pase_corto: 88, pase_largo: 84, velocidad: 92, aura: 88 }, look: { skin: "#C68642", hair: "#17130F", style: "short", beard: true } },
          { name: "Aguerd",              pos: "DEF", num:  5, stats: { tiro: 48, defensa: 85, cabezazo: 82, pase_corto: 75, pase_largo: 71, velocidad: 72, aura: 76 }, look: { skin: "#C68642", hair: "#0E0C0A", style: "short", beard: true } },
          { name: "Mazraoui",            pos: "DEF", num:  3, stats: { tiro: 62, defensa: 80, cabezazo: 66, pase_corto: 84, pase_largo: 80, velocidad: 76, aura: 76 }, look: { skin: "#C68642", hair: "#17130F", style: "buzz", beard: true } },

          { name: "Amrabat",             pos: "MED", num:  4, stats: { tiro: 69, defensa: 83, cabezazo: 72, pase_corto: 84, pase_largo: 83, velocidad: 62, aura: 80 }, look: { skin: "#C68642", hair: "#0E0C0A", style: "bun", beard: true } },
          { name: "Brahim Díaz",         pos: "MED", num: 10, stats: { tiro: 81, defensa: 53, cabezazo: 58, pase_corto: 89, pase_largo: 81, velocidad: 82, aura: 80 }, look: { skin: "#E0AC69", hair: "#17130F", style: "short", beard: false } },
          { name: "Ounahi",              pos: "MED", num:  8, stats: { tiro: 75, defensa: 63, cabezazo: 60, pase_corto: 88, pase_largo: 83, velocidad: 64, aura: 74 }, look: { skin: "#C68642", hair: "#17130F", style: "short", beard: false } },

          { name: "Ayoub El Kaabi",      pos: "DEL", num:  9, stats: { tiro: 81, defensa: 44, cabezazo: 85, pase_corto: 62, pase_largo: 52, velocidad: 82, aura: 76 }, look: { skin: "#C68642", hair: "#0E0C0A", style: "buzz", beard: true } },
          { name: "Soufiane Rahimi",     pos: "DEL", num:  7, stats: { tiro: 74, defensa: 46, cabezazo: 54, pase_corto: 74, pase_largo: 65, velocidad: 85, aura: 72 }, look: { skin: "#C68642", hair: "#17130F", style: "short", beard: true } },
          //Jugador 11 { name: "Ismael Saibari", pos: "MED", num: 16, stats: { tiro: 78, defensa: 58, cabezazo: 58, pase: 82, aura: 74 }, look: { skin: "#C68642", hair: "#0E0C0A", style: "short", beard: false } },
      
        ],
    },
    {
      id: "SEN", name: "Senegal", flag: "🇸🇳", iso: "sn", confed: "CAF", playable: true,
      colors: { primary: "#00853F", secondary: "#FCD116", text: "#ffffff" },
      kits: { field: { shirt: "#FFFFFF", accent: "#00853F" }, alt: { shirt: "#00853F", accent: "#FCD116" }, gk: { shirt: "#F97316", accent: "#0B0F19" } },
      players: [
          { name: "Édouard Mendy",       pos: "POR", num: 16, stats: { atajadas: 84, reflejos: 85, salidas: 80, pase_corto: 66, pase_largo: 67, velocidad: 52, aura: 76 }, look: { skin: "#6B4226", hair: "#0E0C0A", style: "buzz", beard: false } },
          { name: "Yehvann Diouf",       pos: "POR", num:  1, stats: { atajadas: 75, reflejos: 77, salidas: 71, pase_corto: 64, pase_largo: 63, velocidad: 50, aura: 66 }, look: { skin: "#8D5524", hair: "#0E0C0A", style: "short", beard: false } },

          { name: "Koulibaly",           pos: "DEF", num:  3, stats: { tiro: 52, defensa: 84, cabezazo: 83, pase_corto: 74, pase_largo: 70, velocidad: 74, aura: 84 }, look: { skin: "#6B4226", hair: "#0E0C0A", style: "bald", beard: true } },
          { name: "Niakhaté",            pos: "DEF", num: 19, stats: { tiro: 46, defensa: 80, cabezazo: 77, pase_corto: 72, pase_largo: 67, velocidad: 68, aura: 72 }, look: { skin: "#8D5524", hair: "#0E0C0A", style: "buzz", beard: true } },
          { name: "Ismail Jakobs",       pos: "DEF", num: 14, stats: { tiro: 58, defensa: 70, cabezazo: 60, pase_corto: 74, pase_largo: 68, velocidad: 90, aura: 68 }, look: { skin: "#A0663A", hair: "#17130F", style: "curly", beard: false } },

          { name: "Pape Matar Sarr",     pos: "MED", num: 18, stats: { tiro: 76, defensa: 74, cabezazo: 66, pase_corto: 89, pase_largo: 84, velocidad: 68, aura: 78 }, look: { skin: "#8D5524", hair: "#0E0C0A", style: "buzz", beard: false } },
          { name: "Gana Gueye",          pos: "MED", num:  5, stats: { tiro: 74, defensa: 84, cabezazo: 68, pase_corto: 84, pase_largo: 81, velocidad: 60, aura: 80 }, look: { skin: "#6B4226", hair: "#0E0C0A", style: "buzz", beard: true } },
          { name: "Habib Diarra",        pos: "MED", num: 15, stats: { tiro: 72, defensa: 66, cabezazo: 64, pase_corto: 81, pase_largo: 75, velocidad: 70, aura: 70 }, look: { skin: "#8D5524", hair: "#17130F", style: "curly", beard: false } },

          { name: "Sadio Mané",          pos: "DEL", num: 10, stats: { tiro: 84, defensa: 50, cabezazo: 73, pase_corto: 84, pase_largo: 75, velocidad: 82, aura: 88 }, look: { skin: "#6B4226", hair: "#0E0C0A", style: "buzz", beard: false } },
          { name: "Nicolas Jackson",     pos: "DEL", num: 11, stats: { tiro: 80, defensa: 44, cabezazo: 68, pase_corto: 69, pase_largo: 59, velocidad: 82, aura: 74 }, look: { skin: "#8D5524", hair: "#0E0C0A", style: "curly", beard: false } },
          //Jugador 11 { name: "Ismaïla Sarr",        pos: "DEL", num: 17, stats: { tiro: 80, defensa: 46, cabezazo: 66, pase: 76, aura: 74 }, look: { skin: "#6B4226", hair: "#0E0C0A", style: "short", beard: false } },
      ],
    },
    // ---------- CONCACAF ----------
    {
      id: "CAN", name: "Canadá", flag: "🇨🇦", iso: "ca", confed: "CONCACAF", playable: true,
      colors: { primary: "#D80621", secondary: "#7A0416", text: "#ffffff" },
      kits: { field: { shirt: "#D80621", accent: "#FFFFFF" }, alt: { shirt: "#FFFFFF", accent: "#D80621" }, gk: { shirt: "#6D28D9", accent: "#111827" } },
      players: [
        { name: "Maxime Crépeau", pos: "POR", num: 16, stats: { atajadas: 81, reflejos: 83, salidas: 79, pase_corto: 76, pase_largo: 75, velocidad: 52, aura: 70 }, look: { skin: "#F1C27D", hair: "#4A331F", style: "short", beard: true } },
        { name: "Dayne St. Clair", pos: "POR", num: 1, stats: { atajadas: 74, reflejos: 78, salidas: 70, pase_corto: 86, pase_largo: 85, velocidad: 54, aura: 65 }, look: { skin: "#6B4226", hair: "#17130F", style: "short", beard: true } },
        { name: "Alistair Johnston", pos: "DEF", num: 2, stats: { tiro: 68, defensa: 77, cabezazo: 77, pase_corto: 75, pase_largo: 72, velocidad: 82, aura: 77 }, look: { skin: "#F1C27D", hair: "#6B4F2A", style: "short", beard: true } },
        { name: "Moïse Bombito", pos: "DEF", num: 15, stats: { tiro: 54, defensa: 79, cabezazo: 77, pase_corto: 75, pase_largo: 69, velocidad: 93, aura: 77 }, look: { skin: "#6B4226", hair: "#17130F", style: "short", beard: true } },
        { name: "Alphonso Davies", pos: "DEF", num: 19, stats: { tiro: 78, defensa: 83, cabezazo: 72, pase_corto: 88, pase_largo: 83, velocidad: 94, aura: 85 }, look: { skin: "#6B4226", hair: "#17130F", style: "short", beard: false } },
        { name: "Stephen Eustáquio", pos: "MED", num: 7, stats: { tiro: 79, defensa: 81, cabezazo: 72, pase_corto: 85, pase_largo: 83, velocidad: 66, aura: 78 }, look: { skin: "#E0AC69", hair: "#17130F", style: "short", beard: true } },
        { name: "Ismaël Koné", pos: "MED", num: 8, stats: { tiro: 77, defensa: 77, cabezazo: 74, pase_corto: 83, pase_largo: 78, velocidad: 78, aura: 78 }, look: { skin: "#6B4226", hair: "#17130F", style: "short", beard: false } },
        { name: "Tajon Buchanan", pos: "MED", num: 17, stats: { tiro: 74, defensa: 58, cabezazo: 70, pase_corto: 80, pase_largo: 72, velocidad: 90, aura: 74 }, look: { skin: "#8D5524", hair: "#17130F", style: "short", beard: false } },
        { name: "Jonathan David", pos: "DEL", num: 10, stats: { tiro: 81, defensa: 44, cabezazo: 79, pase_corto: 74, pase_largo: 65, velocidad: 81, aura: 75 }, look: { skin: "#6B4226", hair: "#17130F", style: "short", beard: true } },
        { name: "Tani Oluwaseyi", pos: "DEL", num: 12, stats: { tiro: 73, defensa: 43, cabezazo: 74, pase_corto: 65, pase_largo: 56, velocidad: 85, aura: 70 }, look: { skin: "#6B4226", hair: "#17130F", style: "short", beard: true } },
        // Jugador 11 {name: "Promise David", pos: "DEL", num: 24, stats: { tiro: 86, defensa: 42, cabezazo: 84, pase: 74, aura: 85 }, look: { skin: "#6B4226", hair: "#17130F", style: "short", beard: true } },
      ],
    },
    {
      id: "USA", name: "Estados Unidos", flag: "🇺🇸", iso: "us", confed: "CONCACAF", playable: true,
      colors: { primary: "#FFFFFF", secondary: "#3C3B6E", text: "#0f172a" },
      kits: { field: { shirt: "#FFFFFF", accent: "#B22234" }, alt: { shirt: "#090B02", accent: "#B22234" }, gk: { shirt: "#EAB308", accent: "#12275E" } },
      players: [
        { name: "Matt Freese",         pos: "POR", num: 24, stats: { atajadas: 80, reflejos: 77, salidas: 79, pase_corto: 70, pase_largo: 69, velocidad: 52, aura: 80 }, look: { skin: "#F1C27D", hair: "#6B4F2A", style: "short", beard: true } },
        { name: "Matt Turner",         pos: "POR", num: 1, stats: { atajadas: 77, reflejos: 72, salidas: 73, pase_corto: 75, pase_largo: 73, velocidad: 50, aura: 74 }, look: { skin: "#F1C27D", hair: "#2A1D12", style: "short", beard: true } },
        { name: "Chris Richards",      pos: "DEF", num:  3, stats: { tiro: 48, defensa: 80, cabezazo: 76, pase_corto: 73, pase_largo: 69, velocidad: 76, aura: 72 }, look: { skin: "#6B4226", hair: "#0E0C0A", style: "curly", beard: false } },
        { name: "Antonee Robinson",    pos: "DEF", num:  5, stats: { tiro: 58, defensa: 77, cabezazo: 66, pase_corto: 80, pase_largo: 74, velocidad: 88, aura: 74 }, look: { skin: "#A0663A", hair: "#0E0C0A", style: "buzz", beard: true } },
        { name: "Sergiño Dest",        pos: "DEF", num:  2, stats: { tiro: 69, defensa: 73, cabezazo: 68, pase_corto: 81, pase_largo: 75, velocidad: 87, aura: 74 }, look: { skin: "#C68642", hair: "#17130F", style: "curly", beard: false } },
        { name: "Tyler Adams",         pos: "MED", num:  4, stats: { tiro: 61, defensa: 79, cabezazo: 70, pase_corto: 80, pase_largo: 75, velocidad: 79, aura: 78 }, look: { skin: "#6B4226", hair: "#0E0C0A", style: "buzz", beard: true } },
        { name: "McKennie",            pos: "MED", num:  8, stats: { tiro: 74, defensa: 78, cabezazo: 76, pase_corto: 81, pase_largo: 78, velocidad: 77, aura: 78 }, look: { skin: "#6B4226", hair: "#17130F", style: "curly", beard: true } },
        { name: "Malik Tillman",       pos: "MED", num: 17, stats: { tiro: 78, defensa: 64, cabezazo: 72, pase_corto: 83, pase_largo: 76, velocidad: 84, aura: 80 }, look: { skin: "#8D5524", hair: "#17130F", style: "short", beard: false } },
        { name: "Pulisic",             pos: "DEL", num: 10, stats: { tiro: 85, defensa: 50, cabezazo: 62, pase_corto: 85, pase_largo: 77, velocidad: 88, aura: 86 }, look: { skin: "#F1C27D", hair: "#6B4F2A", style: "short", beard: false } },
        { name: "Balogun",             pos: "DEL", num:  9, stats: { tiro: 82, defensa: 40, cabezazo: 70, pase_corto: 64, pase_largo: 54, velocidad: 85, aura: 82 }, look: { skin: "#6B4226", hair: "#0E0C0A", style: "buzz", beard: false } },
        // Juagdor 11 { name: "Alex Freeman",        pos: "DEF", num: 16, stats: { tiro: 70, defensa: 82, cabezazo: 74, pase: 80, aura: 77 }, look: { skin: "#8D5524", hair: "#17130F", style: "short", beard: false } },

      ],
    },
    {
      id: "MEX", name: "México", flag: "🇲🇽", iso: "mx", confed: "CONCACAF", playable: true,
      colors: { primary: "#006847", secondary: "#0B4D33", text: "#ffffff" },
      kits: { field: { shirt: "#006847", accent: "#FFFFFF" }, alt: { shirt: "#FFFFFF", accent: "#006847" }, gk: { shirt: "#7C3AED", accent: "#0B0F19" } },
      players: [
        { name: "Malagón",             pos: "POR", num:  1, stats: { atajadas: 81, reflejos: 83, salidas: 75, pase_corto: 70, pase_largo: 69, velocidad: 52, aura: 74 }, look: { skin: "#C68642", hair: "#17130F", style: "short", beard: false } },
        { name: "Guillermo Ochoa",     pos: "POR", num: 13, stats: { atajadas: 76, reflejos: 78, salidas: 72, pase_corto: 69, pase_largo: 68, velocidad: 44, aura: 68 }, look: { skin: "#C68642", hair: "#0E0C0A", style: "short", beard: false } },

        { name: "César Montes",        pos: "DEF", num:  3, stats: { tiro: 50, defensa: 83, cabezazo: 81, pase_corto: 73, pase_largo: 70, velocidad: 60, aura: 74 }, look: { skin: "#C68642", hair: "#17130F", style: "short", beard: true } },
        { name: "Johan Vásquez",       pos: "DEF", num:  5, stats: { tiro: 48, defensa: 81, cabezazo: 76, pase_corto: 75, pase_largo: 71, velocidad: 61, aura: 72 }, look: { skin: "#A0663A", hair: "#0E0C0A", style: "short", beard: true } },
        { name: "Jorge Sánchez",       pos: "DEF", num:  2, stats: { tiro: 58, defensa: 70, cabezazo: 60, pase_corto: 72, pase_largo: 66, velocidad: 78, aura: 66 }, look: { skin: "#C68642", hair: "#17130F", style: "buzz", beard: false } },

        { name: "Edson Álvarez",       pos: "MED", num:  4, stats: { tiro: 65, defensa: 85, cabezazo: 78, pase_corto: 82, pase_largo: 80, velocidad: 65, aura: 80 }, look: { skin: "#C68642", hair: "#0E0C0A", style: "bun", beard: true } },
        { name: "Luis Chávez",         pos: "MED", num: 24, stats: { tiro: 80, defensa: 70, cabezazo: 64, pase_corto: 79, pase_largo: 85, velocidad: 66, aura: 72 }, look: { skin: "#A0663A", hair: "#17130F", style: "short", beard: false } },
        { name: "Gilberto Mora",       pos: "MED", num: 19, stats: { tiro: 70, defensa: 52, cabezazo: 52, pase_corto: 84, pase_largo: 77, velocidad: 80, aura: 74 }, look: { skin: "#C68642", hair: "#0E0C0A", style: "short", beard: false } },

        { name: "Julián Quiñones",     pos: "DEL", num: 16, stats: { tiro: 77, defensa: 46, cabezazo: 67, pase_corto: 72, pase_largo: 63, velocidad: 88, aura: 76 }, look: { skin: "#8D5524", hair: "#0E0C0A", style: "buzz", beard: true } },
        { name: "Raúl Jiménez",        pos: "DEL", num:  9, stats: { tiro: 86, defensa: 44, cabezazo: 84, pase_corto: 80, pase_largo: 73, velocidad: 57, aura: 78 }, look: { skin: "#C68642", hair: "#0E0C0A", style: "short", beard: true } },
        // Jugador 11 { name: "Alexis Vega",         pos: "DEL", num: 10, stats: { tiro: 81, defensa: 46, cabezazo: 66, pase: 78, aura: 78 }, look: { skin: "#C68642", hair: "#17130F", style: "short", beard: false } },
      ],
    },
    // ---------- CONMEBOL ----------
    {
      id: "ARG", name: "Argentina", flag: "🇦🇷", iso: "ar", confed: "CONMEBOL", playable: true,
      colors: { primary: "#75AADB", secondary: "#1C2C5B", text: "#0f172a" },
      kits: { field: { shirt: "#75AADB", accent: "#FFFFFF" }, alt: { shirt: "#000000", accent: "#FFFFFF" }, gk: { shirt: "#FF7F27", accent: "#1C2C5B" } },
      players: [
        { name: "Dibu Martínez",       pos: "POR", num: 23, stats: { atajadas: 87, reflejos: 89, salidas: 83, pase_corto: 75, pase_largo: 75, velocidad: 54, aura: 88 }, look: { skin: "#E0AC69", hair: "#2A1D12", style: "short", beard: false } },
        { name: "Rulli",               pos: "POR", num: 12, stats: { atajadas: 83, reflejos: 83, salidas: 79, pase_corto: 78, pase_largo: 77, velocidad: 52, aura: 74 }, look: { skin: "#E0AC69", hair: "#17130F", style: "short", beard: true } },
        { name: "Cuti Romero",         pos: "DEF", num: 13, stats: { tiro: 50, defensa: 89, cabezazo: 88, pase_corto: 80, pase_largo: 76, velocidad: 66, aura: 82 }, look: { skin: "#C68642", hair: "#17130F", style: "short", beard: true } },
        { name: "Lisandro Martínez",   pos: "DEF", num: 6, stats: { tiro: 52, defensa: 88, cabezazo: 81, pase_corto: 88, pase_largo: 86, velocidad: 67, aura: 80 }, look: { skin: "#E0AC69", hair: "#17130F", style: "buzz", beard: false } },
        { name: "Nahuel Molina",       pos: "DEF", num: 26, stats: { tiro: 62, defensa: 79, cabezazo: 67, pase_corto: 82, pase_largo: 78, velocidad: 82, aura: 76 }, look: { skin: "#E0AC69", hair: "#17130F", style: "buzz", beard: false } },
        { name: "Enzo Fernández",      pos: "MED", num: 24, stats: { tiro: 79, defensa: 81, cabezazo: 74, pase_corto: 94, pase_largo: 93, velocidad: 68, aura: 86 }, look: { skin: "#F1C27D", hair: "#2A1D12", style: "short", beard: false } },
        { name: "Mac Allister",        pos: "MED", num: 20, stats: { tiro: 82, defensa: 78, cabezazo: 72, pase_corto: 95, pase_largo: 91, velocidad: 66, aura: 86 }, look: { skin: "#F1C27D", hair: "#6B4F2A", style: "short", beard: true } },
        { name: "De Paul",             pos: "MED", num:  7, stats: { tiro: 72, defensa: 76, cabezazo: 70, pase_corto: 87, pase_largo: 83, velocidad: 75, aura: 76 }, look: { skin: "#E0AC69", hair: "#2A1D12", style: "long", beard: true } },
        { name: "Messi",               pos: "DEL", num: 10, stats: { tiro: 97, defensa: 32, cabezazo: 71, pase_corto: 99, pase_largo: 99, velocidad: 78, aura: 99 }, look: { skin: "#E0AC69", hair: "#2A1D12", style: "short", beard: true } },
        { name: "Lautaro Martínez",    pos: "DEL", num: 22, stats: { tiro: 87, defensa: 42, cabezazo: 85, pase_corto: 78, pase_largo: 69, velocidad: 81, aura: 82 }, look: { skin: "#C68642", hair: "#17130F", style: "short", beard: false } },
        // 11 player { name: "Julián Álvarez",      pos: "DEL", num: 9, stats: { tiro: 88, defensa: 56, cabezazo: 74, pase: 82, aura: 87 }, look: { skin: "#E0AC69", hair: "#2A1D12", style: "short", beard: false } },
      ],
    },
    {
      id: "BRA", name: "Brasil", flag: "🇧🇷", iso: "br", confed: "CONMEBOL", playable: true,
      colors: { primary: "#FFDF00", secondary: "#009C3B", text: "#0f172a" },
      kits: { field: { shirt: "#FFDF00", accent: "#009C3B" }, alt: { shirt: "#2A4A9F", accent: "#009C3B" }, gk: { shirt: "#8A8F98", accent: "#1F2937" } },
      players: [
        { name: "Alisson", pos: "POR", num: 1, stats: { atajadas: 89, reflejos: 87, salidas: 87, pase_corto: 79, pase_largo: 82, velocidad: 56, aura: 83 }, look: { skin: "#E0AC69", hair: "#5B3A1E", style: "short", beard: true } },
        { name: "Ederson", pos: "POR", num: 23, stats: { atajadas: 83, reflejos: 82, salidas: 80, pase_corto: 90, pase_largo: 94, velocidad: 64, aura: 80 }, look: { skin: "#E0AC69", hair: "#1F1B16", style: "buzz", beard: true } },
        { name: "Marquinhos", pos: "DEF", num: 4, stats: { tiro: 55, defensa: 86, cabezazo: 86, pase_corto: 83, pase_largo: 79, velocidad: 78, aura: 90 }, look: { skin: "#C68642", hair: "#17130F", style: "short", beard: true } },
        { name: "Gabriel Magalhães", pos: "DEF", num: 3, stats: { tiro: 50, defensa: 90, cabezazo: 92, pase_corto: 76, pase_largo: 72, velocidad: 64, aura: 80 }, look: { skin: "#8D5524", hair: "#0E0C0A", style: "buzz", beard: true } },
        
        { name: "Casemiro", pos: "MED", num: 5, stats: { tiro: 80, defensa: 90, cabezazo: 80, pase_corto: 87, pase_largo: 86, velocidad: 40, aura: 89 }, look: { skin: "#C68642", hair: "#17130F", style: "buzz", beard: true } },
        { name: "Bruno Guimarães", pos: "MED", num: 8, stats: { tiro: 78, defensa: 80, cabezazo: 66, pase_corto: 95, pase_largo: 92, velocidad: 68, aura: 87 }, look: { skin: "#E0AC69", hair: "#2A1D12", style: "short", beard: true } },
        { name: "Lucas Paquetá", pos: "MED", num: 20, stats: { tiro: 77, defensa: 63, cabezazo: 70, pase_corto: 90, pase_largo: 83, velocidad: 70, aura: 78 }, look: { skin: "#E0AC69", hair: "#17130F", style: "short", beard: true } },
        
        { name: "Matheus Cunha", pos: "DEL", num: 9, stats: { tiro: 88, defensa: 48, cabezazo: 76, pase_corto: 85, pase_largo: 76, velocidad: 78, aura: 84 }, look: { skin: "#C68642", hair: "#17130F", style: "short", beard: true } },
        { name: "Vinícius Júnior", pos: "DEL", num: 7, stats: { tiro: 90, defensa: 35, cabezazo: 61, pase_corto: 87, pase_largo: 76, velocidad: 95, aura: 93 }, look: { skin: "#8D5524", hair: "#0E0C0A", style: "curly", beard: false } },
        { name: "Raphinha", pos: "DEL", num: 11, stats: { tiro: 87, defensa: 45, cabezazo: 69, pase_corto: 90, pase_largo: 83, velocidad: 88, aura: 88 }, look: { skin: "#C68642", hair: "#17130F", style: "short", beard: true } },
        // 11 player { name: "Neymar", pos: "MED", num: 10, stats: { tiro: 86, defensa: 40, cabezazo: 60, pase: 91, aura: 94 }, look: { skin: "#C68642", hair: "#17130F", style: "short", beard: true } },
      ],
    },
    {
      id: "COL", name: "Colombia", flag: "🇨🇴", iso: "co", confed: "CONMEBOL", playable: true,
      colors: { primary: "#FCD116", secondary: "#003893", text: "#0f172a" },
      kits: { field: { shirt: "#FCD116", accent: "#003893" }, alt: { shirt: "#243561", accent: "#003893" }, gk: { shirt: "#15803D", accent: "#0B0F19" } },
      players: [
        { name: "Camilo Vargas",       pos: "POR", num: 12, stats: { atajadas: 84, reflejos: 85, salidas: 80, pase_corto: 73, pase_largo: 72, velocidad: 50, aura: 78 }, look: { skin: "#C68642", hair: "#17130F", style: "short", beard: false } },
        { name: "Ospina",              pos: "POR", num:  1, stats: { atajadas: 78, reflejos: 80, salidas: 74, pase_corto: 71, pase_largo: 70, velocidad: 48, aura: 78 }, look: { skin: "#E0AC69", hair: "#2A1D12", style: "short", beard: false } },
        { name: "Dávinson Sánchez",    pos: "DEF", num: 23, stats: { tiro: 50, defensa: 83, cabezazo: 80, pase_corto: 72, pase_largo: 68, velocidad: 82, aura: 76 }, look: { skin: "#6B4226", hair: "#0E0C0A", style: "buzz", beard: false } },
        { name: "Lucumí",              pos: "DEF", num:  2, stats: { tiro: 45, defensa: 83, cabezazo: 75, pase_corto: 76, pase_largo: 72, velocidad: 65, aura: 70 }, look: { skin: "#6B4226", hair: "#17130F", style: "short", beard: false } },
        { name: "Daniel Muñoz",        pos: "DEF", num: 17, stats: { tiro: 64, defensa: 78, cabezazo: 74, pase_corto: 79, pase_largo: 75, velocidad: 75, aura: 76 }, look: { skin: "#C68642", hair: "#17130F", style: "buzz", beard: true } },
        { name: "Richard Ríos",        pos: "MED", num: 16, stats: { tiro: 73, defensa: 73, cabezazo: 70, pase_corto: 83, pase_largo: 79, velocidad: 81, aura: 76 }, look: { skin: "#C68642", hair: "#17130F", style: "curly", beard: false } },
        { name: "Lerma",               pos: "MED", num:  6, stats: { tiro: 71, defensa: 81, cabezazo: 76, pase_corto: 79, pase_largo: 75, velocidad: 68, aura: 74 }, look: { skin: "#6B4226", hair: "#0E0C0A", style: "bun", beard: true } },
        { name: "James Rodríguez",     pos: "MED", num: 10, stats: { tiro: 89, defensa: 58, cabezazo: 64, pase_corto: 93, pase_largo: 93, velocidad: 58, aura: 90 }, look: { skin: "#E0AC69", hair: "#2A1D12", style: "short", beard: false } },
        { name: "Luis Díaz",           pos: "DEL", num:  7, stats: { tiro: 89, defensa: 50, cabezazo: 68, pase_corto: 85, pase_largo: 77, velocidad: 88, aura: 88 }, look: { skin: "#A0663A", hair: "#17130F", style: "curly", beard: true } },
        { name: "Luis Suárez",         pos: "DEL", num: 25, stats: { tiro: 83, defensa: 42, cabezazo: 75, pase_corto: 70, pase_largo: 61, velocidad: 83, aura: 80 }, look: { skin: "#C68642", hair: "#17130F", style: "short", beard: false } },
        // 11 player { name: "Jhon Córdoba", pos: "DEL", num: 9, stats: { tiro: 86, defensa: 42, cabezazo: 84, pase: 66, aura: 81 }, look: { skin: "#6B4226", hair: "#0E0C0A", style: "buzz", beard: true } },
      ],
    },
    {
      id: "ECU", name: "Ecuador", flag: "🇪🇨", iso: "ec", confed: "CONMEBOL", playable: true,
      colors: { primary: "#FCD116", secondary: "#002B5C", text: "#0f172a" },
      kits: { field: { shirt: "#FCD116", accent: "#002B5C" }, alt: { shirt: "#0D183B", accent: "#FCD116" }, gk: { shirt: "#111827", accent: "#FCD116" } },
      players: [
        { name: "Hernán Galíndez", pos: "POR", num: 1, stats: { atajadas: 78, reflejos: 79, salidas: 74, pase_corto: 69, pase_largo: 68, velocidad: 50, aura: 74 }, look: { skin: "#C68642", hair: "#17130F", style: "short", beard: true } },
        { name: "Gonzalo Valle", pos: "POR", num: 22, stats: { atajadas: 72, reflejos: 74, salidas: 69, pase_corto: 66, pase_largo: 64, velocidad: 48, aura: 69 }, look: { skin: "#E0AC69", hair: "#17130F", style: "short", beard: false } },
        { name: "Willian Pacho", pos: "DEF", num: 6, stats: { tiro: 50, defensa: 87, cabezazo: 85, pase_corto: 80, pase_largo: 76, velocidad: 80, aura: 82 }, look: { skin: "#6B4226", hair: "#17130F", style: "short", beard: false } },
        { name: "Piero Hincapié", pos: "DEF", num: 3, stats: { tiro: 58, defensa: 84, cabezazo: 80, pase_corto: 82, pase_largo: 79, velocidad: 84, aura: 80 }, look: { skin: "#8D5524", hair: "#17130F", style: "short", beard: false } },
        { name: "Joel Ordóñez", pos: "DEF", num: 4, stats: { tiro: 45, defensa: 77, cabezazo: 75, pase_corto: 72, pase_largo: 68, velocidad: 74, aura: 72 }, look: { skin: "#6B4226", hair: "#17130F", style: "short", beard: false } },
        { name: "Moisés Caicedo", pos: "MED", num: 23, stats: { tiro: 79, defensa: 88, cabezazo: 76, pase_corto: 93, pase_largo: 89, velocidad: 71, aura: 88 }, look: { skin: "#6B4226", hair: "#17130F", style: "short", beard: false } },
        { name: "Pedro Vite", pos: "MED", num: 15, stats: { tiro: 70, defensa: 62, cabezazo: 62, pase_corto: 81, pase_largo: 76, velocidad: 72, aura: 72 }, look: { skin: "#C68642", hair: "#17130F", style: "short", beard: false } },
        { name: "John Yeboah", pos: "MED", num: 9, stats: { tiro: 68, defensa: 52, cabezazo: 62, pase_corto: 73, pase_largo: 64, velocidad: 92, aura: 70 }, look: { skin: "#6B4226", hair: "#17130F", style: "curly", beard: false } },
        { name: "Enner Valencia", pos: "DEL", num: 13, stats: { tiro: 79, defensa: 44, cabezazo: 79, pase_corto: 74, pase_largo: 66, velocidad: 72, aura: 82 }, look: { skin: "#6B4226", hair: "#17130F", style: "buzz", beard: true } },
        { name: "Gonzalo Plata", pos: "DEL", num: 19, stats: { tiro: 76, defensa: 46, cabezazo: 66, pase_corto: 79, pase_largo: 71, velocidad: 84, aura: 80 }, look: { skin: "#8D5524", hair: "#17130F", style: "short", beard: false } },
        // Jugador 11 { name: "Pervis Estupiñán", pos: "DEF", num: 7, stats: { tiro: 72, defensa: 82, cabezazo: 74, pase: 84, aura: 84 }, look: { skin: "#8D5524", hair: "#17130F", style: "short", beard: true } },
      ],
    },
    {
      id: "PAR", name: "Paraguay", flag: "🇵🇾", iso: "py", confed: "CONMEBOL", playable: true,
      colors: { primary: "#D52B1E", secondary: "#0038A8", text: "#0f172a" },
      kits: { field: { shirt: "#D52B1E", accent: "#FFFFFF" }, alt: { shirt: "#000060", accent: "#FFFFFF" }, gk: { shirt: "#8ED8F8", accent: "#1E293B" } },
      players: [
        { name: "Orlando Gill", pos: "POR", num: 12, stats: { atajadas: 76, reflejos: 77, salidas: 72, pase_corto: 67, pase_largo: 66, velocidad: 52, aura: 72 }, look: { skin: "#C68642", hair: "#17130F", style: "short", beard: false } },
        { name: "Gatito Fernández", pos: "POR", num: 1, stats: { atajadas: 74, reflejos: 76, salidas: 72, pase_corto: 69, pase_largo: 67, velocidad: 46, aura: 73 }, look: { skin: "#C68642", hair: "#17130F", style: "short", beard: true } },
        { name: "Gustavo Gómez", pos: "DEF", num: 15, stats: { tiro: 54, defensa: 86, cabezazo: 87, pase_corto: 76, pase_largo: 72, velocidad: 64, aura: 80 }, look: { skin: "#C68642", hair: "#17130F", style: "short", beard: true } },
        { name: "Omar Alderete", pos: "DEF", num: 3, stats: { tiro: 52, defensa: 84, cabezazo: 84, pase_corto: 76, pase_largo: 72, velocidad: 60, aura: 76 }, look: { skin: "#C68642", hair: "#17130F", style: "short", beard: true } },
        { name: "Juan Cáceres", pos: "DEF", num: 4, stats: { tiro: 56, defensa: 72, cabezazo: 70, pase_corto: 73, pase_largo: 68, velocidad: 72, aura: 68 }, look: { skin: "#C68642", hair: "#17130F", style: "short", beard: false } },
        { name: "Diego Gómez", pos: "MED", num: 8, stats: { tiro: 71, defensa: 71, cabezazo: 66, pase_corto: 82, pase_largo: 77, velocidad: 69, aura: 73 }, look: { skin: "#C68642", hair: "#17130F", style: "short", beard: false } },
        { name: "Andrés Cubas", pos: "MED", num: 14, stats: { tiro: 67, defensa: 81, cabezazo: 70, pase_corto: 81, pase_largo: 77, velocidad: 69, aura: 74 }, look: { skin: "#C68642", hair: "#17130F", style: "short", beard: true } },
        { name: "Matías Galarza", pos: "MED", num: 16, stats: { tiro: 70, defensa: 74, cabezazo: 66, pase_corto: 81, pase_largo: 76, velocidad: 63, aura: 72 }, look: { skin: "#C68642", hair: "#17130F", style: "short", beard: false } },
        { name: "Miguel Almirón", pos: "DEL", num: 10, stats: { tiro: 76, defensa: 52, cabezazo: 66, pase_corto: 83, pase_largo: 76, velocidad: 87, aura: 83 }, look: { skin: "#C68642", hair: "#17130F", style: "short", beard: false } },
        { name: "Julio Enciso", pos: "DEL", num: 19, stats: { tiro: 78, defensa: 48, cabezazo: 65, pase_corto: 87, pase_largo: 78, velocidad: 74, aura: 79 }, look: { skin: "#C68642", hair: "#17130F", style: "curly", beard: false } },
        // Jugador 11 { name: "Ramón Sosa", pos: "DEL", num: 7, stats: { tiro: 84, defensa: 46, cabezazo: 68, pase: 82, aura: 84 }, look: { skin: "#C68642", hair: "#17130F", style: "short", beard: false } },
      ],
    },
    {
      id: "URU", name: "Uruguay", flag: "🇺🇾", iso: "uy", confed: "CONMEBOL", playable: true,
      colors: { primary: "#55B5E5", secondary: "#001489", text: "#0f172a" },
      kits: { field: { shirt: "#55B5E5", accent: "#FFFFFF" }, alt: { shirt: "#0A0216", accent: "#FFFFFF" }, gk: { shirt: "#111827", accent: "#55B5E5" } },
      players: [
        { name: "Sergio Rochet", pos: "POR", num: 1, stats: { atajadas: 84, reflejos: 83, salidas: 84, pase_corto: 77, pase_largo: 76, velocidad: 50, aura: 80 }, look: { skin: "#E0AC69", hair: "#17130F", style: "short", beard: true } },
        { name: "Fernando Muslera", pos: "POR", num: 23, stats: { atajadas: 82, reflejos: 83, salidas: 79, pase_corto: 74, pase_largo: 74, velocidad: 46, aura: 80 }, look: { skin: "#E0AC69", hair: "#17130F", style: "short", beard: false } },
        { name: "Ronald Araújo", pos: "DEF", num: 4, stats: { tiro: 58, defensa: 83, cabezazo: 85, pase_corto: 77, pase_largo: 73, velocidad: 80, aura: 82 }, look: { skin: "#C68642", hair: "#17130F", style: "short", beard: false } },
        { name: "José María Giménez", pos: "DEF", num: 2, stats: { tiro: 56, defensa: 83, cabezazo: 83, pase_corto: 73, pase_largo: 69, velocidad: 73, aura: 80 }, look: { skin: "#E0AC69", hair: "#2A1D12", style: "short", beard: true } },
        { name: "Guillermo Varela", pos: "DEF", num: 13, stats: { tiro: 60, defensa: 79, cabezazo: 72, pase_corto: 78, pase_largo: 73, velocidad: 76, aura: 74 }, look: { skin: "#E0AC69", hair: "#17130F", style: "buzz", beard: true } },
        { name: "Federico Valverde", pos: "MED", num: 8, stats: { tiro: 88, defensa: 84, cabezazo: 76, pase_corto: 84, pase_largo: 83, velocidad: 88, aura: 90 }, look: { skin: "#E0AC69", hair: "#8A6B3F", style: "short", beard: false } },
        { name: "Manuel Ugarte", pos: "MED", num: 5, stats: { tiro: 75, defensa: 91, cabezazo: 72, pase_corto: 90, pase_largo: 85, velocidad: 62, aura: 84 }, look: { skin: "#E0AC69", hair: "#17130F", style: "short", beard: false } },
        { name: "Rodrigo Bentancur", pos: "MED", num: 6, stats: { tiro: 82, defensa: 82, cabezazo: 70, pase_corto: 90, pase_largo: 87, velocidad: 64, aura: 83 }, look: { skin: "#E0AC69", hair: "#4A331F", style: "short", beard: true } },
        { name: "Darwin Núñez", pos: "DEL", num: 9, stats: { tiro: 80, defensa: 42, cabezazo: 82, pase_corto: 72, pase_largo: 63, velocidad: 88, aura: 80 }, look: { skin: "#C68642", hair: "#17130F", style: "short", beard: false } },
        { name: "Facundo Pellistri", pos: "DEL", num: 11, stats: { tiro: 81, defensa: 50, cabezazo: 63, pase_corto: 83, pase_largo: 75, velocidad: 82, aura: 82 }, look: { skin: "#E0AC69", hair: "#8A6B3F", style: "short", beard: false } },
        // 11 player { name: "Maximiliano Araújo", pos: "DEL", num: 20, stats: { tiro: 84, defensa: 52, cabezazo: 70, pase: 80, aura: 84 }, look: { skin: "#E0AC69", hair: "#8A6B3F", style: "short", beard: false } },
      ],
    },
    // ---------- OFC ----------
    {
      id: "AUS", name: "Australia", flag: "🇦🇺", iso: "au", confed: "OFC", playable: true,
      colors: { primary: "#FFB81C", secondary: "#00843D", text: "#0f172a" },
      kits: { field: { shirt: "#FFB81C", accent: "#00843D" }, alt: { shirt: "#FF6F61", accent: "#14532D" }, gk: { shirt: "#334155", accent: "#FFB81C" } },
      players: [
        { name: "Mat Ryan", pos: "POR", num: 1, stats: { atajadas: 80, reflejos: 82, salidas: 76, pase_corto: 72, pase_largo: 71, velocidad: 52, aura: 78 }, look: { skin: "#F1C27D", hair: "#2A1D12", style: "short", beard: false } },
        { name: "Joe Gauci", pos: "POR", num: 12, stats: { atajadas: 71, reflejos: 74, salidas: 67, pase_corto: 63, pase_largo: 61, velocidad: 50, aura: 64 }, look: { skin: "#F1C27D", hair: "#2A1D12", style: "short", beard: false } },
        { name: "Harry Souttar", pos: "DEF", num: 19, stats: { tiro: 42, defensa: 86, cabezazo: 91, pase_corto: 66, pase_largo: 63, velocidad: 46, aura: 74 }, look: { skin: "#FFDBAC", hair: "#8A6B3F", style: "short", beard: false } },
        { name: "Alessandro Circati", pos: "DEF", num: 3, stats: { tiro: 42, defensa: 81, cabezazo: 80, pase_corto: 72, pase_largo: 68, velocidad: 59, aura: 73 }, look: { skin: "#F1C27D", hair: "#8A6B3F", style: "short", beard: false } },
        { name: "Jordan Bos", pos: "DEF", num: 5, stats: { tiro: 61, defensa: 74, cabezazo: 65, pase_corto: 76, pase_largo: 71, velocidad: 87, aura: 73 }, look: { skin: "#F1C27D", hair: "#C89B6D", style: "short", beard: false } },
        { name: "Jackson Irvine", pos: "MED", num: 22, stats: { tiro: 71, defensa: 77, cabezazo: 74, pase_corto: 84, pase_largo: 81, velocidad: 67, aura: 82 }, look: { skin: "#F1C27D", hair: "#4A331F", style: "long", beard: true } },
        { name: "Connor Metcalfe", pos: "MED", num: 8, stats: { tiro: 72, defensa: 65, cabezazo: 60, pase_corto: 81, pase_largo: 76, velocidad: 72, aura: 72 }, look: { skin: "#F1C27D", hair: "#4A331F", style: "short", beard: false } },
        { name: "Aiden O'Neill", pos: "MED", num: 13, stats: { tiro: 67, defensa: 74, cabezazo: 68, pase_corto: 81, pase_largo: 77, velocidad: 76, aura: 74 }, look: { skin: "#F1C27D", hair: "#2A1D12", style: "short", beard: true } },
        { name: "Mohamed Touré", pos: "DEL", num: 9, stats: { tiro: 73, defensa: 42, cabezazo: 71, pase_corto: 62, pase_largo: 53, velocidad: 86, aura: 72 }, look: { skin: "#C68642", hair: "#17130F", style: "short", beard: false } },
        { name: "Nishan Velupillay", pos: "DEL", num: 23, stats: { tiro: 68, defensa: 43, cabezazo: 53, pase_corto: 64, pase_largo: 56, velocidad: 84, aura: 69 }, look: { skin: "#C68642", hair: "#17130F", style: "short", beard: false } },
        // 11 player { name: "Nestory Irankunda", pos: "DEL", num: 7, stats: { tiro: 79, defensa: 46, cabezazo: 66, pase: 73, aura: 78 }, look: { skin: "#6B4226", hair: "#17130F", style: "short", beard: false } },
      ],
    },
    {
      // Los All Whites: Chris Wood y un plantel humilde
      id: "NZL", name: "Nueva Zelanda", flag: "🇳🇿", iso: "nz", confed: "OFC", playable: true,
      colors: { primary: "#FFFFFF", secondary: "#000000", text: "#0f172a" },
      kits: { field: { shirt: "#FFFFFF", accent: "#000000" }, alt: { shirt: "#000000", accent: "#FFFFFF" }, gk: { shirt: "#EAB308", accent: "#0B0F19" } },
      players: [
        { name: "Max Crocombe",      pos: "POR", num:  1, stats: { atajadas: 69, reflejos: 71, salidas: 65, pase_corto: 58, pase_largo: 57, velocidad: 50, aura: 62 }, look: { skin: "#F1C27D", hair: "#4A331F", style: "short", beard: true } },
        { name: "Alex Paulsen",      pos: "POR", num: 12, stats: { atajadas: 67, reflejos: 71, salidas: 59, pase_corto: 56, pase_largo: 55, velocidad: 52, aura: 56 }, look: { skin: "#FFDBAC", hair: "#8A6B3F", style: "short", beard: false } },

        { name: "Liberato Cacace",   pos: "DEF", num: 13, stats: { tiro: 50, defensa: 69, cabezazo: 59, pase_corto: 71, pase_largo: 66, velocidad: 72, aura: 62 }, look: { skin: "#E0AC69", hair: "#17130F", style: "short", beard: false } },
        { name: "Tyler Bindon",      pos: "DEF", num:  4, stats: { tiro: 36, defensa: 69, cabezazo: 65, pase_corto: 58, pase_largo: 54, velocidad: 58, aura: 58 }, look: { skin: "#F1C27D", hair: "#2A1D12", style: "short", beard: false } },
        { name: "Tim Payne",         pos: "DEF", num:  2, stats: { tiro: 38, defensa: 70, cabezazo: 70, pase_corto: 55, pase_largo: 51, velocidad: 68, aura: 64 }, look: { skin: "#F1C27D", hair: "#4A331F", style: "short", beard: true } },

        { name: "Marko Stamenic",    pos: "MED", num:  8, stats: { tiro: 59, defensa: 63, cabezazo: 58, pase_corto: 73, pase_largo: 69, velocidad: 67, aura: 62 }, look: { skin: "#F1C27D", hair: "#2A1D12", style: "buzz", beard: false } },
        { name: "Sarpreet Singh",    pos: "MED", num: 10, stats: { tiro: 62, defensa: 48, cabezazo: 48, pase_corto: 76, pase_largo: 69, velocidad: 70, aura: 64 }, look: { skin: "#C68642", hair: "#0E0C0A", style: "short", beard: true } },
        { name: "Matt Garbett",      pos: "MED", num:  7, stats: { tiro: 57, defensa: 55, cabezazo: 54, pase_corto: 68, pase_largo: 63, velocidad: 68, aura: 60 }, look: { skin: "#FFDBAC", hair: "#6B4F2A", style: "curly", beard: false } },

        { name: "Chris Wood",        pos: "DEL", num:  9, stats: { tiro: 86, defensa: 42, cabezazo: 88, pase_corto: 65, pase_largo: 56, velocidad: 53, aura: 76 }, look: { skin: "#F1C27D", hair: "#4A331F", style: "buzz", beard: true } },
        { name: "Kosta Barbarouses", pos: "DEL", num: 17, stats: { tiro: 62, defensa: 44, cabezazo: 52, pase_corto: 60, pase_largo: 52, velocidad: 78, aura: 64 }, look: { skin: "#E0AC69", hair: "#17130F", style: "short", beard: true } },

        // Jugador 11 { name: "Joe Bell",          pos: "MED", num:  6, stats: { tiro: 60, defensa: 66, cabezazo: 58, pase: 74, aura: 64 }, look: { skin: "#F1C27D", hair: "#4A331F", style: "short", beard: false } },
      ],
    },
    // ---------- UEFA ----------
    {
      id: "ENG", name: "Inglaterra", flag: "🏴󠁧󠁢󠁥󠁮󠁧󠁿", iso: "gb-eng", confed: "UEFA", playable: true,
      colors: { primary: "#FFFFFF", secondary: "#CE1124", text: "#0f172a" },
      kits: { field: { shirt: "#FFFFFF", accent: "#CE1124" }, alt: { shirt: "#FE080A", accent: "#FFFFFF" }, gk: { shirt: "#7CB518", accent: "#0B0F19" } },
      players: [
        { name: "Jordan Pickford",      pos: "POR", num:  1, stats: { atajadas: 86, reflejos: 88, salidas: 82, pase_corto: 75, pase_largo: 78, velocidad: 52, aura: 83 }, look: { skin: "#F1C27D", hair: "#4A331F", style: "short", beard: true } },
        { name: "Dean Henderson",      pos: "POR", num: 13, stats: { atajadas: 83, reflejos: 84, salidas: 78, pase_corto: 76, pase_largo: 75, velocidad: 50, aura: 78 }, look: { skin: "#F1C27D", hair: "#2A1D12", style: "short", beard: false } },
        
        { name: "John Stones",         pos: "DEF", num:  5, stats: { tiro: 55, defensa: 88, cabezazo: 83, pase_corto: 88, pase_largo: 87, velocidad: 64, aura: 80 }, look: { skin: "#F1C27D", hair: "#6B4F2A", style: "short", beard: false } },
        { name: "Marc Guéhi",          pos: "DEF", num:  6, stats: { tiro: 46, defensa: 87, cabezazo: 80, pase_corto: 79, pase_largo: 75, velocidad: 69, aura: 78 }, look: { skin: "#6B4226", hair: "#0E0C0A", style: "buzz", beard: false } },
        
        { name: "Declan Rice",         pos: "MED", num:  4, stats: { tiro: 81, defensa: 89, cabezazo: 76, pase_corto: 92, pase_largo: 90, velocidad: 72, aura: 84 }, look: { skin: "#F1C27D", hair: "#2A1D12", style: "short", beard: false } },
        { name: "Elliot Anderson",     pos: "MED", num:  8, stats: { tiro: 79, defensa: 83, cabezazo: 70, pase_corto: 88, pase_largo: 86, velocidad: 71, aura: 84 }, look: { skin: "#F1C27D", hair: "#4A331F", style: "short", beard: false } },
        { name: "Jude Bellingham",     pos: "MED", num: 10, stats: { tiro: 85, defensa: 77, cabezazo: 80, pase_corto: 92, pase_largo: 87, velocidad: 80, aura: 92 }, look: { skin: "#A0663A", hair: "#0E0C0A", style: "buzz", beard: false } },
        
        { name: "Anthony Gordon",      pos: "DEL", num: 18, stats: { tiro: 84, defensa: 48, cabezazo: 66, pase_corto: 82, pase_largo: 74, velocidad: 91, aura: 86 }, look: { skin: "#E0AC69", hair: "#C69C6D", style: "short", beard: false } },
        { name: "Bukayo Saka",         pos: "DEL", num:  7, stats: { tiro: 89, defensa: 55, cabezazo: 62, pase_corto: 92, pase_largo: 84, velocidad: 84, aura: 86 }, look: { skin: "#6B4226", hair: "#0E0C0A", style: "curly", beard: false } },
        { name: "Harry Kane",          pos: "DEL", num:  9, stats: { tiro: 98, defensa: 52, cabezazo: 90, pase_corto: 81, pase_largo: 77, velocidad: 64, aura: 85 }, look: { skin: "#F1C27D", hair: "#6B4F2A", style: "short", beard: true } },
        // Jugador 11 { name: "Eberechi Eze", pos: "MED", num: 21, stats: { tiro: 84, defensa: 60, cabezazo: 70, pase: 88, aura: 86 }, look: { skin: "#6B4226", hair: "#17130F", style: "short", beard: true } },
      ],
    },
    {
      id: "ESP", name: "España", flag: "🇪🇸", iso: "es", confed: "UEFA", playable: true,
      colors: { primary: "#C60B1E", secondary: "#FFC400", text: "#FFFFFF" },
      kits: { field: { shirt: "#C60B1E", accent: "#FFC400" }, alt: { shirt: "#FFFFFF", accent: "#FFC400" }, gk: { shirt: "#6A1B9A", accent: "#FFC400" } },
      players: [
        { name: "Unai Simón",         pos: "POR", num: 23, stats: { atajadas: 87, reflejos: 90, salidas: 86, pase_corto: 86, pase_largo: 85, velocidad: 50, aura: 80 }, look: { skin: "#FFDBAC", hair: "#4A331F", style: "short", beard: false } },
        { name: "David Raya",         pos: "POR", num:  1, stats: { atajadas: 86, reflejos: 87, salidas: 85, pase_corto: 81, pase_largo: 81, velocidad: 54, aura: 77 }, look: { skin: "#FFDBAC", hair: "#4A331F", style: "short", beard: true } },

        { name: "Pau Cubarsí",        pos: "DEF", num: 22, stats: { tiro: 42, defensa: 87, cabezazo: 82, pase_corto: 90, pase_largo: 85, velocidad: 70, aura: 82 }, look: { skin: "#FFDBAC", hair: "#4A331F", style: "short", beard: false } },
        { name: "Marc Cucurella",     pos: "DEF", num: 24, stats: { tiro: 62, defensa: 87, cabezazo: 73, pase_corto: 87, pase_largo: 81, velocidad: 76, aura: 88 }, look: { skin: "#FFDBAC", hair: "#4A331F", style: "curly", beard: true } },
        { name: "Pedro Porro",        pos: "DEF", num: 12, stats: { tiro: 68, defensa: 84, cabezazo: 66, pase_corto: 82, pase_largo: 82, velocidad: 80, aura: 80 }, look: { skin: "#F1C27D", hair: "#4A331F", style: "short", beard: true } },

        { name: "Rodri",              pos: "MED", num: 16, stats: { tiro: 80, defensa: 91, cabezazo: 65, pase_corto: 99, pase_largo: 97, velocidad: 64, aura: 87 }, look: { skin: "#F1C27D", hair: "#4A331F", style: "short", beard: true } },
        { name: "Pedri",              pos: "MED", num: 20, stats: { tiro: 72, defensa: 74, cabezazo: 54, pase_corto: 98, pase_largo: 90, velocidad: 76, aura: 90 }, look: { skin: "#FFDBAC", hair: "#4A331F", style: "short", beard: false } },
        { name: "Fabián Ruiz",        pos: "MED", num:  8, stats: { tiro: 84, defensa: 86, cabezazo: 68, pase_corto: 95, pase_largo: 94, velocidad: 60, aura: 88 }, look: { skin: "#FFDBAC", hair: "#4A331F", style: "short", beard: true } },

        { name: "Mikel Oyarzabal",    pos: "DEL", num: 21, stats: { tiro: 85, defensa: 48, cabezazo: 81, pase_corto: 92, pase_largo: 83, velocidad: 76, aura: 86 }, look: { skin: "#FFDBAC", hair: "#4A331F", style: "short", beard: true } },
        { name: "Lamine Yamal",       pos: "DEL", num: 19, stats: { tiro: 91, defensa: 58, cabezazo: 76, pase_corto: 95, pase_largo: 86, velocidad: 86, aura: 92 }, look: { skin: "#6B4226", hair: "#0E0C0A", style: "curly", beard: false } },

        // Jugador 11 { name: "Ferran Torres",      pos: "DEL", num:  7, stats: { tiro: 86, defensa: 44, cabezazo: 74, pase: 80, aura: 86 }, look: { skin: "#FFDBAC", hair: "#4A331F", style: "short", beard: false } },
    ],
    },
    {
      id: "FRA", name: "Francia", flag: "🇫🇷", iso: "fr", confed: "UEFA", playable: true,
      colors: { primary: "#123274", secondary: "#EF4135", text: "#FFFFFF" },
      kits: { field: { shirt: "#123274", accent: "#FFFFFF" }, alt: { shirt: "#BDE4D7", accent: "#FFFFFF" }, gk: { shirt: "#E8D820", accent: "#123274" } },
      players: [
        { name: "Maignan",             pos: "POR", num: 16, stats: { atajadas: 86, reflejos: 89, salidas: 86, pase_corto: 72, pase_largo: 73, velocidad: 58, aura: 84 }, look: { skin: "#6B4226", hair: "#0E0C0A", style: "buzz", beard: false } },
        { name: "Brice Samba",         pos: "POR", num: 1, stats: { atajadas: 83, reflejos: 85, salidas: 79, pase_corto: 73, pase_largo: 73, velocidad: 52, aura: 74 }, look: { skin: "#F1C27D", hair: "#4A331F", style: "short", beard: false } },
        { name: "William Saliba",      pos: "DEF", num: 17, stats: { tiro: 45, defensa: 89, cabezazo: 84, pase_corto: 82, pase_largo: 78, velocidad: 84, aura: 82 }, look: { skin: "#8D5524", hair: "#0E0C0A", style: "short", beard: false } },
        { name: "Dayot Upamecano",     pos: "DEF", num:  4, stats: { tiro: 48, defensa: 88, cabezazo: 85, pase_corto: 77, pase_largo: 73, velocidad: 82, aura: 78 }, look: { skin: "#6B4226", hair: "#0E0C0A", style: "buzz", beard: false } },
       
        { name: "Aurélien Tchouaméni", pos: "MED", num:  8, stats: { tiro: 70, defensa: 86, cabezazo: 78, pase_corto: 87, pase_largo: 85, velocidad: 71, aura: 80 }, look: { skin: "#8D5524", hair: "#17130F", style: "short", beard: false } },
        { name: "Manu Koné",           pos: "MED", num: 6, stats: { tiro: 77, defensa: 83, cabezazo: 70, pase_corto: 88, pase_largo: 83, velocidad: 76, aura: 84 }, look: { skin: "#6B4226", hair: "#17130F", style: "short", beard: false } },
        { name: "Adrien Rabiot",       pos: "MED", num: 14, stats: { tiro: 79, defensa: 79, cabezazo: 76, pase_corto: 89, pase_largo: 85, velocidad: 78, aura: 86 }, look: { skin: "#E0AC69", hair: "#4A331F", style: "short", beard: true } },
        { name: "Michael Olise",       pos: "MED", num:  11, stats: { tiro: 94, defensa: 58, cabezazo: 70, pase_corto: 96, pase_largo: 90, velocidad: 78, aura: 91 }, look: { skin: "#A0663A", hair: "#17130F", style: "short", beard: false } },
        
        { name: "Kylian Mbappé",       pos: "DEL", num: 10, stats: { tiro: 95, defensa: 36, cabezazo: 70, pase_corto: 84, pase_largo: 76, velocidad: 97, aura: 95 }, look: { skin: "#8D5524", hair: "#0E0C0A", style: "buzz", beard: false } },
        { name: "Ousmane Dembélé",     pos: "DEL", num: 7, stats: { tiro: 94, defensa: 40, cabezazo: 60, pase_corto: 90, pase_largo: 82, velocidad: 91, aura: 92 }, look: { skin: "#8D5524", hair: "#17130F", style: "curly", beard: false } },
        // Jugador 11 { name: "Bradley Barcola", pos: "DEL", num: 12, stats: { tiro: 86, defensa: 44, cabezazo: 70, pase: 83, aura: 86 }, look: { skin: "#6B4226", hair: "#17130F", style: "short", beard: false } },
      ],
    },
    {
      id: "GER", name: "Alemania", flag: "🇩🇪", iso: "de", confed: "UEFA", playable: true,
      colors: { primary: "#FFFFFF", secondary: "#000000", text: "#0F172A" },
      kits: { field: { shirt: "#FFFFFF", accent: "#000000" }, alt: { shirt: "#DD42AA", accent: "#000000" }, gk: { shirt: "#1FA64A", accent: "#FFFFFF" } },
      players: [
        { name: "Manuel Neuer",       pos: "POR", num:  1, stats: { atajadas: 87, reflejos: 85, salidas: 86, pase_corto: 80, pase_largo: 84, velocidad: 58, aura: 86 }, look: { skin: "#FFDBAC", hair: "#C69C6D", style: "short", beard: false } },
        { name: "Oliver Baumann",     pos: "POR", num: 12, stats: { atajadas: 85, reflejos: 83, salidas: 84, pase_corto: 75, pase_largo: 74, velocidad: 50, aura: 78 }, look: { skin: "#FFDBAC", hair: "#6B4F2A", style: "short", beard: true } },

        { name: "Antonio Rüdiger",    pos: "DEF", num:  2, stats: { tiro: 58, defensa: 84, cabezazo: 87, pase_corto: 76, pase_largo: 72, velocidad: 79, aura: 86 }, look: { skin: "#6B4226", hair: "#0E0C0A", style: "short", beard: true } },
        { name: "Jonathan Tah",       pos: "DEF", num:  4, stats: { tiro: 52, defensa: 91, cabezazo: 91, pase_corto: 83, pase_largo: 79, velocidad: 63, aura: 80 }, look: { skin: "#6B4226", hair: "#0E0C0A", style: "buzz", beard: true } },
        { name: "Joshua Kimmich",     pos: "DEF", num:  6, stats: { tiro: 76, defensa: 89, cabezazo: 76, pase_corto: 92, pase_largo: 95, velocidad: 72, aura: 90 }, look: { skin: "#FFDBAC", hair: "#4A331F", style: "short", beard: false } },

        { name: "Jamal Musiala",      pos: "MED", num: 10, stats: { tiro: 89, defensa: 55, cabezazo: 60, pase_corto: 96, pase_largo: 87, velocidad: 80, aura: 88 }, look: { skin: "#C68642", hair: "#0E0C0A", style: "curly", beard: false } },
        { name: "Florian Wirtz",      pos: "MED", num: 17, stats: { tiro: 90, defensa: 58, cabezazo: 58, pase_corto: 96, pase_largo: 90, velocidad: 80, aura: 89 }, look: { skin: "#FFDBAC", hair: "#4A331F", style: "short", beard: false } },
        { name: "Felix Nmecha",       pos: "MED", num: 13, stats: { tiro: 77, defensa: 81, cabezazo: 77, pase_corto: 84, pase_largo: 79, velocidad: 82, aura: 80 }, look: { skin: "#6B4226", hair: "#0E0C0A", style: "short", beard: false } },

        { name: "Kai Havertz",        pos: "DEL", num:  7, stats: { tiro: 88, defensa: 51, cabezazo: 80, pase_corto: 94, pase_largo: 88, velocidad: 72, aura: 86 }, look: { skin: "#FFDBAC", hair: "#C69C6D", style: "short", beard: false } },
        { name: "Leroy Sané",         pos: "DEL", num: 19, stats: { tiro: 85, defensa: 57, cabezazo: 69, pase_corto: 87, pase_largo: 79, velocidad: 87, aura: 85 }, look: { skin: "#6B4226", hair: "#0E0C0A", style: "short", beard: false } },

        // Jugador 11 { name: "Deniz Undav",        pos: "DEL", num: 26, stats: { tiro: 87, defensa: 42, cabezazo: 76, pase: 76, aura: 82 }, look: { skin: "#FFDBAC", hair: "#4A331F", style: "short", beard: true } },
      ],
    },
    {
      id: "NED", name: "Países Bajos", flag: "🇳🇱", iso: "nl", confed: "UEFA", playable: true,
      colors: { primary: "#F36C21", secondary: "#FFFFFF", text: "#0f172a" },
      kits: { field: { shirt: "#F36C21", accent: "#FFFFFF" }, alt: { shirt: "#FFFFFF", accent: "#F36C21" }, gk: { shirt: "#1B2A41", accent: "#F97316" } },
      players: [
        { name: "Bart Verbruggen",    pos: "POR", num:  1, stats: { atajadas: 85, reflejos: 86, salidas: 82, pase_corto: 83, pase_largo: 82, velocidad: 54, aura: 82 }, look: { skin: "#FFDBAC", hair: "#4A331F", style: "short", beard: false } },
        { name: "Mark Flekken",       pos: "POR", num: 23, stats: { atajadas: 83, reflejos: 85, salidas: 81, pase_corto: 78, pase_largo: 79, velocidad: 50, aura: 78 }, look: { skin: "#FFDBAC", hair: "#6B4F2A", style: "short", beard: true } },

        { name: "Virgil van Dijk",    pos: "DEF", num:  4, stats: { tiro: 55, defensa: 87, cabezazo: 92, pase_corto: 82, pase_largo: 82, velocidad: 73, aura: 84 }, look: { skin: "#6B4226", hair: "#0E0C0A", style: "short", beard: true } },
        { name: "Nathan Aké",         pos: "DEF", num:  5, stats: { tiro: 54, defensa: 87, cabezazo: 82, pase_corto: 83, pase_largo: 79, velocidad: 72, aura: 83 }, look: { skin: "#6B4226", hair: "#0E0C0A", style: "short", beard: true } },
        { name: "Denzel Dumfries",    pos: "DEF", num: 22, stats: { tiro: 76, defensa: 82, cabezazo: 80, pase_corto: 82, pase_largo: 77, velocidad: 84, aura: 84 }, look: { skin: "#6B4226", hair: "#0E0C0A", style: "short", beard: true } },

        { name: "Frenkie de Jong",    pos: "MED", num: 21, stats: { tiro: 74, defensa: 78, cabezazo: 56, pase_corto: 94, pase_largo: 87, velocidad: 82, aura: 89 }, look: { skin: "#FFDBAC", hair: "#C69C6D", style: "short", beard: false } },
        { name: "Ryan Gravenberch",   pos: "MED", num:  8, stats: { tiro: 78, defensa: 76, cabezazo: 66, pase_corto: 89, pase_largo: 83, velocidad: 76, aura: 84 }, look: { skin: "#6B4226", hair: "#0E0C0A", style: "short", beard: false } },
        { name: "Tijjani Reijnders",  pos: "MED", num: 14, stats: { tiro: 83, defensa: 73, cabezazo: 62, pase_corto: 92, pase_largo: 87, velocidad: 79, aura: 86 }, look: { skin: "#FFDBAC", hair: "#4A331F", style: "short", beard: false } },

        { name: "Cody Gakpo",         pos: "DEL", num: 11, stats: { tiro: 84, defensa: 40, cabezazo: 75, pase_corto: 86, pase_largo: 78, velocidad: 83, aura: 85 }, look: { skin: "#6B4226", hair: "#0E0C0A", style: "short", beard: true } },
        { name: "Donyell Malen",      pos: "DEL", num: 18, stats: { tiro: 85, defensa: 38, cabezazo: 70, pase_corto: 79, pase_largo: 70, velocidad: 86, aura: 83 }, look: { skin: "#6B4226", hair: "#0E0C0A", style: "short", beard: false } },

        // Jugador 11 { name: "Memphis Depay",      pos: "DEL", num: 10, stats: { tiro: 82, defensa: 38, cabezazo: 76, pase: 82, aura: 90 }, look: { skin: "#6B4226", hair: "#0E0C0A", style: "short", beard: true } },
      ],
    },
    {
      id: "NOR", name: "Noruega", flag: "🇳🇴", iso: "no", confed: "UEFA", playable: true,
      colors: { primary: "#EF2B2D", secondary: "#00205B", text: "#ffffff" },
      kits: { field: { shirt: "#EF2B2D", accent: "#FFFFFF" }, alt: { shirt: "#FFFFFF", accent: "#EF2B2D" }, gk: { shirt: "#0E9F6E", accent: "#111827" } },
      players: [
        { name: "Ørjan Nyland",      pos: "POR", num:  1, stats: { atajadas: 78, reflejos: 76, salidas: 72, pase_corto: 57, pase_largo: 57, velocidad: 50, aura: 70 }, look: { skin: "#F1C27D", hair: "#6B4F2A", style: "buzz", beard: true } },
        { name: "Egil Selvik",       pos: "POR", num: 13, stats: { atajadas: 67, reflejos: 69, salidas: 61, pase_corto: 50, pase_largo: 49, velocidad: 48, aura: 55 }, look: { skin: "#FFDBAC", hair: "#8A6B3F", style: "short", beard: false } },

        { name: "Kristoffer Ajer",   pos: "DEF", num:  3, stats: { tiro: 42, defensa: 77, cabezazo: 74, pase_corto: 62, pase_largo: 59, velocidad: 70, aura: 62 }, look: { skin: "#FFDBAC", hair: "#C69C6D", style: "bun", beard: false } },
        { name: "Leo Østigård",      pos: "DEF", num:  4, stats: { tiro: 35, defensa: 77, cabezazo: 79, pase_corto: 56, pase_largo: 52, velocidad: 60, aura: 64 }, look: { skin: "#F1C27D", hair: "#6B4F2A", style: "short", beard: true } },
        { name: "Julian Ryerson",    pos: "DEF", num: 26, stats: { tiro: 52, defensa: 77, cabezazo: 63, pase_corto: 70, pase_largo: 66, velocidad: 76, aura: 66 }, look: { skin: "#F1C27D", hair: "#4A331F", style: "short", beard: true } },

        { name: "Martin Ødegaard",   pos: "MED", num: 10, stats: { tiro: 82, defensa: 59, cabezazo: 45, pase_corto: 96, pase_largo: 97, velocidad: 68, aura: 90 }, look: { skin: "#FFDBAC", hair: "#C69C6D", style: "short", beard: false } },
        { name: "Sander Berge",      pos: "MED", num:  8, stats: { tiro: 63, defensa: 73, cabezazo: 66, pase_corto: 80, pase_largo: 79, velocidad: 56, aura: 64 }, look: { skin: "#F1C27D", hair: "#2A1D12", style: "bun", beard: true } },
        { name: "Patrick Berg",      pos: "MED", num:  6, stats: { tiro: 52, defensa: 61, cabezazo: 52, pase_corto: 79, pase_largo: 76, velocidad: 72, aura: 62 }, look: { skin: "#FFDBAC", hair: "#8A6B3F", style: "short", beard: false } },

        { name: "Erling Haaland",    pos: "DEL", num:  9, stats: { tiro: 96, defensa: 40, cabezazo: 92, pase_corto: 53, pase_largo: 43, velocidad: 86, aura: 89 }, look: { skin: "#FFDBAC", hair: "#C69C6D", style: "long", beard: false } },
        { name: "Alexander Sørloth", pos: "DEL", num:  7, stats: { tiro: 84, defensa: 35, cabezazo: 88, pase_corto: 59, pase_largo: 50, velocidad: 76, aura: 72 }, look: { skin: "#F1C27D", hair: "#6B4F2A", style: "buzz", beard: true } },

        // Jugador 11 { name: "Andreas Schjelderup", pos: "DEL", num: 21, stats: { tiro: 80, defensa: 44, cabezazo: 58, pase: 78, aura: 76 }, look: { skin: "#FFDBAC", hair: "#C69C6D", style: "short", beard: false } },
    ],
    },
    {
      id: "POR", name: "Portugal", flag: "🇵🇹", iso: "pt", confed: "UEFA", playable: true,
      colors: { primary: "#C8102E", secondary: "#046A38", text: "#0f172a" },
      kits: { field: { shirt: "#C8102E", accent: "#046A38" }, alt: { shirt: "#FFFFFF", accent: "#046A38" }, gk: { shirt: "#F59E0B", accent: "#C8102E" } },
      players: [
        { name: "Diogo Costa", pos: "POR", num: 1, stats: { atajadas: 85, reflejos: 86, salidas: 86, pase_corto: 84, pase_largo: 84, velocidad: 52, aura: 85 }, look: { skin: "#E0AC69", hair: "#17130F", style: "short", beard: false } },
        { name: "José Sá", pos: "POR", num: 12, stats: { atajadas: 82, reflejos: 83, salidas: 79, pase_corto: 76, pase_largo: 75, velocidad: 48, aura: 74 }, look: { skin: "#E0AC69", hair: "#2A1D12", style: "short", beard: true } },
        
        { name: "Rúben Dias", pos: "DEF", num: 3, stats: { tiro: 58, defensa: 89, cabezazo: 89, pase_corto: 86, pase_largo: 83, velocidad: 59, aura: 85 }, look: { skin: "#E0AC69", hair: "#17130F", style: "short", beard: true } },
        { name: "Nuno Mendes", pos: "DEF", num: 19, stats: { tiro: 72, defensa: 87, cabezazo: 73, pase_corto: 87, pase_largo: 82, velocidad: 95, aura: 87 }, look: { skin: "#6B4226", hair: "#17130F", style: "short", beard: false } },
        { name: "João Cancelo", pos: "DEF", num: 20, stats: { tiro: 74, defensa: 82, cabezazo: 68, pase_corto: 87, pase_largo: 89, velocidad: 83, aura: 86 }, look: { skin: "#E0AC69", hair: "#2A1D12", style: "short", beard: true } },
        
        { name: "Vitinha", pos: "MED", num: 23, stats: { tiro: 85, defensa: 77, cabezazo: 64, pase_corto: 98, pase_largo: 93, velocidad: 72, aura: 87 }, look: { skin: "#E0AC69", hair: "#2A1D12", style: "short", beard: false } },
        { name: "Bruno Fernandes", pos: "MED", num: 8, stats: { tiro: 90, defensa: 71, cabezazo: 70, pase_corto: 97, pase_largo: 99, velocidad: 67, aura: 86 }, look: { skin: "#E0AC69", hair: "#2A1D12", style: "short", beard: true } },
        { name: "João Neves", pos: "MED", num: 15, stats: { tiro: 76, defensa: 84, cabezazo: 66, pase_corto: 91, pase_largo: 86, velocidad: 74, aura: 85 }, look: { skin: "#E0AC69", hair: "#4A331F", style: "short", beard: false } },
        
        { name: "Cristiano Ronaldo", pos: "DEL", num: 7, stats: { tiro: 91, defensa: 36, cabezazo: 88, pase_corto: 72, pase_largo: 64, velocidad: 76, aura: 99 }, look: { skin: "#E0AC69", hair: "#17130F", style: "short", beard: false } },
        { name: "Pedro Neto", pos: "DEL", num: 11, stats: { tiro: 84, defensa: 46, cabezazo: 66, pase_corto: 84, pase_largo: 76, velocidad: 91, aura: 85 }, look: { skin: "#C68642", hair: "#17130F", style: "short", beard: true } },
        
        // Jugador 11 { name: "Rafael Leão", pos: "DEL", num: 17, stats: { tiro: 84, defensa: 42, cabezazo: 74, pase: 82, aura: 85 }, look: { skin: "#6B4226", hair: "#17130F", style: "short", beard: true } },
      ],
    },
    // ---------- UEFA (agregadas: jugables desde el Mundial 2026) ----------
    {
      // Cuartos de final (6º de 48). 14 goles a favor: el 4º ataque del torneo.
      id: "BEL", name: "Bélgica", flag: "🇧🇪", iso: "be", confed: "UEFA", playable: true,
      colors: { primary: "#EE3137", secondary: "#FDB913", text: "#ffffff" },
      kits: { field: { shirt: "#EE3137", accent: "#000000" }, alt: { shirt: "#8FB8DE", accent: "#E8A0C0" }, gk: { shirt: "#22D3EE", accent: "#111827" } },
      players: [
        { name: "Thibaut Courtois",     pos: "POR", num:  1, stats: { atajadas: 89, reflejos: 88, salidas: 82, pase_corto: 76, pase_largo: 78, velocidad: 50, aura: 89 }, look: { skin: "#F1C27D", hair: "#4A331F", style: "short", beard: true } },
        { name: "Senne Lammens",        pos: "POR", num: 12, stats: { atajadas: 78, reflejos: 80, salidas: 74, pase_corto: 74, pase_largo: 71, velocidad: 52, aura: 66 }, look: { skin: "#FFDBAC", hair: "#6B4F2A", style: "short", beard: false } },

        { name: "Brandon Mechele",      pos: "DEF", num:  4, stats: { tiro: 44, defensa: 83, cabezazo: 83, pase_corto: 75, pase_largo: 70, velocidad: 62, aura: 76 }, look: { skin: "#F1C27D", hair: "#4A331F", style: "short", beard: true } },
        { name: "Timothy Castagne",     pos: "DEF", num: 21, stats: { tiro: 58, defensa: 79, cabezazo: 67, pase_corto: 79, pase_largo: 75, velocidad: 82, aura: 73 }, look: { skin: "#E0AC69", hair: "#17130F", style: "short", beard: true } },
        { name: "Maxim De Cuyper",      pos: "DEF", num:  5, stats: { tiro: 63, defensa: 78, cabezazo: 63, pase_corto: 84, pase_largo: 82, velocidad: 84, aura: 74 }, look: { skin: "#FFDBAC", hair: "#8A6B3F", style: "short", beard: false } },

        { name: "Kevin De Bruyne",      pos: "MED", num:  7, stats: { tiro: 87, defensa: 58, cabezazo: 60, pase_corto: 95, pase_largo: 96, velocidad: 70, aura: 93 }, look: { skin: "#FFDBAC", hair: "#C69C6D", style: "short", beard: false } },
        { name: "Youri Tielemans",      pos: "MED", num:  8, stats: { tiro: 82, defensa: 78, cabezazo: 68, pase_corto: 91, pase_largo: 90, velocidad: 68, aura: 86 }, look: { skin: "#F1C27D", hair: "#2A1D12", style: "short", beard: true } },
        { name: "Hans Vanaken",         pos: "MED", num: 20, stats: { tiro: 78, defensa: 70, cabezazo: 74, pase_corto: 85, pase_largo: 81, velocidad: 60, aura: 73 }, look: { skin: "#FFDBAC", hair: "#4A331F", style: "buzz", beard: false } },

        { name: "Leandro Trossard",     pos: "DEL", num: 10, stats: { tiro: 87, defensa: 48, cabezazo: 64, pase_corto: 88, pase_largo: 78, velocidad: 86, aura: 84 }, look: { skin: "#F1C27D", hair: "#6B4F2A", style: "short", beard: true } },
        { name: "Charles De Ketelaere", pos: "DEL", num: 17, stats: { tiro: 85, defensa: 46, cabezazo: 76, pase_corto: 84, pase_largo: 74, velocidad: 78, aura: 79 }, look: { skin: "#FFDBAC", hair: "#C69C6D", style: "long", beard: false } },
        // 11º jugador — desbloqueable a futuro.
        // Motivo: 311' en 4 partidos y ni un gol, así que el 10 se lo llevan Trossard y De Ketelaere
        // por producción. Aporta lo único que este ataque no tiene: velocidad pura de desborde (94).
        // { name: "Jérémy Doku",          pos: "DEL", num: 11, stats: { tiro: 78, defensa: 46, cabezazo: 52, pase_corto: 82, pase_largo: 66, velocidad: 96, aura: 82 }, look: { skin: "#6B4226", hair: "#0E0C0A", style: "buzz", beard: false } },
      ],
    },
    {
      // 16avos (20º). Modrić capitaneó su 5º Mundial a los 40 años.
      id: "CRO", name: "Croacia", flag: "🇭🇷", iso: "hr", confed: "UEFA", playable: true,
      colors: { primary: "#E63946", secondary: "#1B3A8C", text: "#ffffff" },
      kits: { field: { shirt: "#FFFFFF", accent: "#E63946" }, alt: { shirt: "#000081", accent: "#E63946" }, gk: { shirt: "#1D4ED8", accent: "#F8FAFC" } },
      players: [
        { name: "Dominik Livaković",    pos: "POR", num:  1, stats: { atajadas: 85, reflejos: 85, salidas: 77, pase_corto: 71, pase_largo: 71, velocidad: 50, aura: 81 }, look: { skin: "#F1C27D", hair: "#17130F", style: "short", beard: true } },
        { name: "Dominik Kotarski",     pos: "POR", num: 23, stats: { atajadas: 73, reflejos: 75, salidas: 69, pase_corto: 69, pase_largo: 67, velocidad: 50, aura: 63 }, look: { skin: "#FFDBAC", hair: "#4A331F", style: "short", beard: false } },

        { name: "Josip Šutalo",         pos: "DEF", num:  6, stats: { tiro: 44, defensa: 82, cabezazo: 80, pase_corto: 77, pase_largo: 72, velocidad: 75, aura: 71 }, look: { skin: "#F1C27D", hair: "#2A1D12", style: "short", beard: false } },
        { name: "Josip Stanišić",       pos: "DEF", num:  2, stats: { tiro: 52, defensa: 81, cabezazo: 73, pase_corto: 79, pase_largo: 74, velocidad: 83, aura: 73 }, look: { skin: "#F1C27D", hair: "#4A331F", style: "short", beard: true } },
        { name: "Marin Pongračić",      pos: "DEF", num:  3, stats: { tiro: 46, defensa: 79, cabezazo: 81, pase_corto: 72, pase_largo: 68, velocidad: 68, aura: 68 }, look: { skin: "#FFDBAC", hair: "#6B4F2A", style: "bun", beard: true } },

        { name: "Luka Modrić",          pos: "MED", num: 10, stats: { tiro: 81, defensa: 71, cabezazo: 50, pase_corto: 95, pase_largo: 95, velocidad: 63, aura: 96 }, look: { skin: "#F1C27D", hair: "#C69C6D", style: "long", beard: false } },
        { name: "Mateo Kovačić",        pos: "MED", num:  8, stats: { tiro: 77, defensa: 79, cabezazo: 62, pase_corto: 92, pase_largo: 87, velocidad: 73, aura: 81 }, look: { skin: "#F1C27D", hair: "#17130F", style: "short", beard: false } },
        { name: "Martin Baturina",      pos: "MED", num: 16, stats: { tiro: 80, defensa: 58, cabezazo: 55, pase_corto: 89, pase_largo: 83, velocidad: 79, aura: 75 }, look: { skin: "#FFDBAC", hair: "#2A1D12", style: "curly", beard: false } },

        { name: "Ivan Perišić",         pos: "DEL", num: 14, stats: { tiro: 81, defensa: 62, cabezazo: 76, pase_corto: 85, pase_largo: 79, velocidad: 73, aura: 86 }, look: { skin: "#F1C27D", hair: "#4A331F", style: "buzz", beard: true } },
        { name: "Petar Sučić",          pos: "DEL", num: 17, stats: { tiro: 80, defensa: 55, cabezazo: 58, pase_corto: 85, pase_largo: 77, velocidad: 82, aura: 73 }, look: { skin: "#FFDBAC", hair: "#8A6B3F", style: "short", beard: false } },
        // 11º jugador — desbloqueable a futuro.
        // Motivo: el mejor defensor de Croacia en el papel jugó 138' en cuatro partidos (dos de ellos
        // entrando desde el banco), así que el rendimiento del torneo lo dejó afuera del 10.
        // Desbloquearlo sube el techo de la línea de fondo de golpe: es el único DEF de nivel Champions.
        // { name: "Joško Gvardiol",       pos: "DEF", num:  4, stats: { tiro: 50, defensa: 86, cabezazo: 80, pase_corto: 84, pase_largo: 80, velocidad: 84, aura: 78 }, look: { skin: "#F1C27D", hair: "#2A1D12", style: "short", beard: false } },
      ],
    },
    {
      // 16avos (27º) pero con el peor golpe del torneo: 5-1 de Países Bajos y 3-0 de Francia.
      id: "SWE", name: "Suecia", flag: "🇸🇪", iso: "se", confed: "UEFA", playable: true,
      colors: { primary: "#FFF200", secondary: "#005B99", text: "#0f172a" },
      kits: { field: { shirt: "#FFF200", accent: "#000040" }, alt: { shirt: "#000040", accent: "#FFF200" }, gk: { shirt: "#DB2777", accent: "#0B0F19" } },
      players: [
        { name: "Kristoffer Nordfeldt", pos: "POR", num: 23, stats: { atajadas: 76, reflejos: 77, salidas: 71, pase_corto: 68, pase_largo: 67, velocidad: 48, aura: 68 }, look: { skin: "#FFDBAC", hair: "#8A6B3F", style: "short", beard: true } },
        { name: "Jacob Widell Zetterström", pos: "POR", num: 1, stats: { atajadas: 75, reflejos: 76, salidas: 72, pase_corto: 70, pase_largo: 68, velocidad: 50, aura: 64 }, look: { skin: "#FFDBAC", hair: "#C69C6D", style: "short", beard: false } },

        { name: "Victor Lindelöf",      pos: "DEF", num:  3, stats: { tiro: 46, defensa: 80, cabezazo: 75, pase_corto: 79, pase_largo: 76, velocidad: 66, aura: 78 }, look: { skin: "#FFDBAC", hair: "#8A6B3F", style: "short", beard: false } },
        { name: "Gustaf Lagerbielke",   pos: "DEF", num:  2, stats: { tiro: 48, defensa: 77, cabezazo: 78, pase_corto: 71, pase_largo: 67, velocidad: 70, aura: 66 }, look: { skin: "#FFDBAC", hair: "#C69C6D", style: "short", beard: true } },
        { name: "Gabriel Gudmundsson",  pos: "DEF", num:  5, stats: { tiro: 58, defensa: 74, cabezazo: 60, pase_corto: 79, pase_largo: 75, velocidad: 84, aura: 68 }, look: { skin: "#FFDBAC", hair: "#6B4F2A", style: "short", beard: false } },

        { name: "Yasin Ayari",          pos: "MED", num: 18, stats: { tiro: 77, defensa: 71, cabezazo: 58, pase_corto: 84, pase_largo: 79, velocidad: 74, aura: 74 }, look: { skin: "#A0663A", hair: "#0E0C0A", style: "curly", beard: false } },
        { name: "Lucas Bergvall",       pos: "MED", num:  7, stats: { tiro: 73, defensa: 67, cabezazo: 56, pase_corto: 85, pase_largo: 79, velocidad: 76, aura: 71 }, look: { skin: "#FFDBAC", hair: "#C69C6D", style: "curly", beard: false } },
        { name: "Jesper Karlström",     pos: "MED", num: 16, stats: { tiro: 66, defensa: 76, cabezazo: 62, pase_corto: 82, pase_largo: 79, velocidad: 62, aura: 66 }, look: { skin: "#F1C27D", hair: "#4A331F", style: "short", beard: true } },

        { name: "Alexander Isak",       pos: "DEL", num:  9, stats: { tiro: 88, defensa: 42, cabezazo: 74, pase_corto: 82, pase_largo: 72, velocidad: 88, aura: 85 }, look: { skin: "#8D5524", hair: "#0E0C0A", style: "buzz", beard: true } },
        { name: "Viktor Gyökeres",      pos: "DEL", num: 17, stats: { tiro: 87, defensa: 46, cabezazo: 82, pase_corto: 74, pase_largo: 64, velocidad: 85, aura: 82 }, look: { skin: "#F1C27D", hair: "#4A331F", style: "buzz", beard: true } },
        // 11º jugador — desbloqueable a futuro.
        // Motivo: 2 goles en 215' (los dos entrando), la mejor relación gol/minuto del plantel, pero
        // solo 2 titularidades. Si entra, Suecia deja de depender de que Isak o Gyökeres estén finos.
        // { name: "Anthony Elanga",       pos: "DEL", num: 11, stats: { tiro: 79, defensa: 44, cabezazo: 56, pase_corto: 78, pase_largo: 68, velocidad: 94, aura: 74 }, look: { skin: "#6B4226", hair: "#0E0C0A", style: "buzz", beard: false } },
      ],
    },
    {
      // Cuartos de final (8º) — la mejor campaña suiza desde 1954. Kobel, Akanji, Elvedi, Xhaka y
      // Freuler jugaron los 360' de los primeros cuatro partidos sin moverse.
      id: "SUI", name: "Suiza", flag: "🇨🇭", iso: "ch", confed: "UEFA", playable: true,
      // Kit: el `FF0000` del torneo se lo queda Suiza (lo vistió en 4 de 6 partidos) y
      // Austria pasa a su rojo tradicional, así dos equipos no salen con la MISMA camiseta.
      // El rojo suizo tradicional (#D52B1E) NO sirve acá: es exactamente el de Paraguay.
      colors: { primary: "#FF0000", secondary: "#FFFFFF", text: "#ffffff" },
      kits: { field: { shirt: "#FF0000", accent: "#FFFFFF" }, alt: { shirt: "#D6E6E5", accent: "#FF0000" }, gk: { shirt: "#A3E635", accent: "#0B0F19" } },
      players: [
        { name: "Gregor Kobel",         pos: "POR", num:  1, stats: { atajadas: 85, reflejos: 86, salidas: 78, pase_corto: 75, pase_largo: 74, velocidad: 52, aura: 79 }, look: { skin: "#FFDBAC", hair: "#4A331F", style: "short", beard: true } },
        { name: "Yvon Mvogo",           pos: "POR", num: 12, stats: { atajadas: 73, reflejos: 74, salidas: 70, pase_corto: 66, pase_largo: 65, velocidad: 50, aura: 62 }, look: { skin: "#6B4226", hair: "#0E0C0A", style: "buzz", beard: false } },

        { name: "Manuel Akanji",        pos: "DEF", num:  5, stats: { tiro: 48, defensa: 84, cabezazo: 78, pase_corto: 84, pase_largo: 80, velocidad: 78, aura: 79 }, look: { skin: "#8D5524", hair: "#0E0C0A", style: "buzz", beard: true } },
        { name: "Nico Elvedi",          pos: "DEF", num:  4, stats: { tiro: 42, defensa: 81, cabezazo: 80, pase_corto: 76, pase_largo: 72, velocidad: 74, aura: 72 }, look: { skin: "#FFDBAC", hair: "#8A6B3F", style: "short", beard: false } },
        { name: "Ricardo Rodriguez",    pos: "DEF", num: 13, stats: { tiro: 62, defensa: 77, cabezazo: 68, pase_corto: 80, pase_largo: 82, velocidad: 60, aura: 76 }, look: { skin: "#C68642", hair: "#17130F", style: "short", beard: true } },

        { name: "Granit Xhaka",         pos: "MED", num: 10, stats: { tiro: 79, defensa: 81, cabezazo: 68, pase_corto: 91, pase_largo: 92, velocidad: 58, aura: 89 }, look: { skin: "#F1C27D", hair: "#17130F", style: "buzz", beard: true } },
        { name: "Remo Freuler",         pos: "MED", num:  8, stats: { tiro: 74, defensa: 81, cabezazo: 68, pase_corto: 84, pase_largo: 80, velocidad: 64, aura: 76 }, look: { skin: "#F1C27D", hair: "#4A331F", style: "short", beard: false } },
        { name: "Johan Manzambi",       pos: "MED", num:  9, stats: { tiro: 82, defensa: 62, cabezazo: 58, pase_corto: 84, pase_largo: 76, velocidad: 84, aura: 76 }, look: { skin: "#6B4226", hair: "#0E0C0A", style: "curly", beard: false } },

        { name: "Breel Embolo",         pos: "DEL", num:  7, stats: { tiro: 83, defensa: 50, cabezazo: 79, pase_corto: 77, pase_largo: 68, velocidad: 80, aura: 79 }, look: { skin: "#6B4226", hair: "#0E0C0A", style: "buzz", beard: true } },
        { name: "Dan Ndoye",            pos: "DEL", num: 11, stats: { tiro: 80, defensa: 48, cabezazo: 60, pase_corto: 79, pase_largo: 70, velocidad: 88, aura: 75 }, look: { skin: "#8D5524", hair: "#17130F", style: "short", beard: false } },
        // 11º jugador — desbloqueable a futuro.
        // Motivo: 2 goles en 168' saliendo del banco, pero solo 2 titularidades: Embolo y Ndoye le
        // ganaron el puesto. Es el revulsivo de banda que le falta al 10 para cambiar un partido trabado.
        // { name: "Rubén Vargas",         pos: "DEL", num: 17, stats: { tiro: 80, defensa: 46, cabezazo: 58, pase_corto: 81, pase_largo: 72, velocidad: 86, aura: 74 }, look: { skin: "#E0AC69", hair: "#17130F", style: "short", beard: false } },
      ],
    },
    {
      // 16avos (28º). Alaba y Arnautović cerraron su ciclo; Wanner y Chukwuemeka son el recambio.
      id: "AUT", name: "Austria", flag: "🇦🇹", iso: "at", confed: "UEFA", playable: true,
      // Kit: mismo caso que Suiza — el `FF0000` de FIFA es genérico. Rojo austríaco
      // tradicional, con las mangas y el short negros que sí vistió en el torneo.
      colors: { primary: "#ED2939", secondary: "#FFFFFF", text: "#ffffff" },
      kits: { field: { shirt: "#ED2939", accent: "#000000" }, alt: { shirt: "#FFFFFF", accent: "#000000" }, gk: { shirt: "#06B6D4", accent: "#0B0F19" } },
      players: [
        { name: "Alexander Schlager",   pos: "POR", num:  1, stats: { atajadas: 80, reflejos: 81, salidas: 76, pase_corto: 72, pase_largo: 71, velocidad: 50, aura: 74 }, look: { skin: "#FFDBAC", hair: "#4A331F", style: "short", beard: true } },
        { name: "Patrick Pentz",        pos: "POR", num: 13, stats: { atajadas: 74, reflejos: 75, salidas: 70, pase_corto: 70, pase_largo: 68, velocidad: 50, aura: 64 }, look: { skin: "#FFDBAC", hair: "#8A6B3F", style: "short", beard: false } },

        { name: "David Alaba",          pos: "DEF", num:  8, stats: { tiro: 66, defensa: 80, cabezazo: 71, pase_corto: 85, pase_largo: 84, velocidad: 64, aura: 86 }, look: { skin: "#8D5524", hair: "#0E0C0A", style: "buzz", beard: true } },
        { name: "Stefan Posch",         pos: "DEF", num:  5, stats: { tiro: 56, defensa: 78, cabezazo: 76, pase_corto: 74, pase_largo: 71, velocidad: 72, aura: 70 }, look: { skin: "#FFDBAC", hair: "#6B4F2A", style: "short", beard: true } },
        { name: "Kevin Danso",          pos: "DEF", num:  3, stats: { tiro: 42, defensa: 80, cabezazo: 82, pase_corto: 70, pase_largo: 66, velocidad: 74, aura: 68 }, look: { skin: "#6B4226", hair: "#0E0C0A", style: "buzz", beard: false } },

        { name: "Marcel Sabitzer",      pos: "MED", num:  9, stats: { tiro: 84, defensa: 71, cabezazo: 66, pase_corto: 86, pase_largo: 83, velocidad: 72, aura: 82 }, look: { skin: "#FFDBAC", hair: "#4A331F", style: "short", beard: true } },
        { name: "Konrad Laimer",        pos: "MED", num: 20, stats: { tiro: 71, defensa: 81, cabezazo: 62, pase_corto: 81, pase_largo: 75, velocidad: 84, aura: 76 }, look: { skin: "#FFDBAC", hair: "#8A6B3F", style: "short", beard: false } },
        { name: "Nicolas Seiwald",      pos: "MED", num:  6, stats: { tiro: 64, defensa: 79, cabezazo: 58, pase_corto: 84, pase_largo: 78, velocidad: 72, aura: 70 }, look: { skin: "#FFDBAC", hair: "#C69C6D", style: "short", beard: false } },

        { name: "Marko Arnautović",     pos: "DEL", num:  7, stats: { tiro: 83, defensa: 44, cabezazo: 80, pase_corto: 76, pase_largo: 68, velocidad: 66, aura: 85 }, look: { skin: "#F1C27D", hair: "#17130F", style: "short", beard: true } },
        { name: "Michael Gregoritsch",  pos: "DEL", num: 11, stats: { tiro: 80, defensa: 42, cabezazo: 82, pase_corto: 72, pase_largo: 64, velocidad: 68, aura: 72 }, look: { skin: "#FFDBAC", hair: "#8A6B3F", style: "long", beard: true } },
        // 11º jugador — desbloqueable a futuro.
        // Motivo: 262' con 20 años y ni una titularidad fija; el 10 lo cierran los nombres hechos.
        // Es el único enganche puro del plantel: desbloquearlo cambia a Austria de correr a pensar.
        // { name: "Paul Wanner",          pos: "MED", num: 24, stats: { tiro: 78, defensa: 60, cabezazo: 54, pase_corto: 87, pase_largo: 81, velocidad: 78, aura: 72 }, look: { skin: "#FFDBAC", hair: "#C69C6D", style: "long", beard: false } },
      ],
    },
    {
      // Fase de grupos (39º): ni una victoria, 2 goles en 3 partidos. El plantel más ligado a la
      // liga local de todo el Mundial (11 de los 26 en el Slavia o el Sparta).
      id: "CZE", name: "Chequia", flag: "🇨🇿", iso: "cz", confed: "UEFA", playable: true,
      colors: { primary: "#F6090F", secondary: "#11457E", text: "#ffffff" },
      kits: { field: { shirt: "#F6090F", accent: "#0000EC" }, alt: { shirt: "#E9E9E9", accent: "#0000EC" }, gk: { shirt: "#FB923C", accent: "#0B0F19" } },
      players: [
        { name: "Matěj Kovář",          pos: "POR", num:  1, stats: { atajadas: 79, reflejos: 80, salidas: 74, pase_corto: 74, pase_largo: 72, velocidad: 50, aura: 70 }, look: { skin: "#FFDBAC", hair: "#8A6B3F", style: "short", beard: false } },
        { name: "Jindřich Staněk",      pos: "POR", num: 16, stats: { atajadas: 74, reflejos: 75, salidas: 70, pase_corto: 68, pase_largo: 66, velocidad: 48, aura: 64 }, look: { skin: "#FFDBAC", hair: "#4A331F", style: "short", beard: true } },

        { name: "Ladislav Krejčí",      pos: "DEF", num:  7, stats: { tiro: 58, defensa: 80, cabezazo: 76, pase_corto: 79, pase_largo: 76, velocidad: 72, aura: 74 }, look: { skin: "#FFDBAC", hair: "#6B4F2A", style: "short", beard: true } },
        { name: "Robin Hranáč",         pos: "DEF", num:  4, stats: { tiro: 44, defensa: 76, cabezazo: 74, pase_corto: 71, pase_largo: 68, velocidad: 68, aura: 64 }, look: { skin: "#FFDBAC", hair: "#4A331F", style: "short", beard: false } },
        { name: "Vladimír Coufal",      pos: "DEF", num:  5, stats: { tiro: 50, defensa: 75, cabezazo: 64, pase_corto: 74, pase_largo: 70, velocidad: 74, aura: 70 }, look: { skin: "#FFDBAC", hair: "#8A6B3F", style: "buzz", beard: true } },

        { name: "Tomáš Souček",         pos: "MED", num: 22, stats: { tiro: 76, defensa: 78, cabezazo: 86, pase_corto: 76, pase_largo: 72, velocidad: 56, aura: 78 }, look: { skin: "#FFDBAC", hair: "#C69C6D", style: "short", beard: false } },
        { name: "Michal Sadílek",       pos: "MED", num: 18, stats: { tiro: 70, defensa: 72, cabezazo: 58, pase_corto: 79, pase_largo: 74, velocidad: 70, aura: 66 }, look: { skin: "#FFDBAC", hair: "#6B4F2A", style: "short", beard: false } },
        { name: "Lukáš Červ",           pos: "MED", num: 12, stats: { tiro: 68, defensa: 71, cabezazo: 56, pase_corto: 78, pase_largo: 73, velocidad: 71, aura: 63 }, look: { skin: "#FFDBAC", hair: "#4A331F", style: "buzz", beard: false } },

        { name: "Patrik Schick",        pos: "DEL", num: 10, stats: { tiro: 86, defensa: 40, cabezazo: 82, pase_corto: 72, pase_largo: 62, velocidad: 74, aura: 78 }, look: { skin: "#FFDBAC", hair: "#4A331F", style: "short", beard: true } },
        { name: "Pavel Šulc",           pos: "DEL", num: 15, stats: { tiro: 79, defensa: 46, cabezazo: 58, pase_corto: 80, pase_largo: 71, velocidad: 80, aura: 70 }, look: { skin: "#FFDBAC", hair: "#8A6B3F", style: "short", beard: false } },
        // 11º jugador — desbloqueable a futuro.
        // Motivo: 158' repartidos y sin gol en el peor ataque del grupo; Schick y Šulc entraron por
        // jerarquía. Aporta el 9 alternativo que permite jugar con dos puntas sin perder movilidad.
        // { name: "Adam Hložek",          pos: "DEL", num:  9, stats: { tiro: 80, defensa: 44, cabezazo: 70, pase_corto: 76, pase_largo: 68, velocidad: 79, aura: 71 }, look: { skin: "#FFDBAC", hair: "#6B4F2A", style: "short", beard: false } },
      ],
    },
    {
      // Fase de grupos (35º) pese a ganarle 3-2 a Estados Unidos. Arda Güler jugó los 270'.
      // Kit: en el Mundial vistió BLANCO en 2 de 3 partidos; el rojo quedó de alternativa.
      id: "TUR", name: "Turquía", flag: "🇹🇷", iso: "tr", confed: "UEFA", playable: true,
      colors: { primary: "#E30A17", secondary: "#FFFFFF", text: "#ffffff" },
      kits: { field: { shirt: "#FFFFFF", accent: "#E30A17" }, alt: { shirt: "#FF0000", accent: "#FFFFFF" }, gk: { shirt: "#4338CA", accent: "#F8FAFC" } },
      players: [
        { name: "Uğurcan Çakır",        pos: "POR", num: 23, stats: { atajadas: 80, reflejos: 81, salidas: 75, pase_corto: 70, pase_largo: 69, velocidad: 50, aura: 75 }, look: { skin: "#E0AC69", hair: "#17130F", style: "short", beard: true } },
        { name: "Altay Bayındır",       pos: "POR", num: 12, stats: { atajadas: 75, reflejos: 76, salidas: 71, pase_corto: 69, pase_largo: 68, velocidad: 50, aura: 66 }, look: { skin: "#E0AC69", hair: "#0E0C0A", style: "short", beard: false } },

        { name: "Merih Demiral",        pos: "DEF", num:  3, stats: { tiro: 52, defensa: 79, cabezazo: 84, pase_corto: 69, pase_largo: 65, velocidad: 68, aura: 75 }, look: { skin: "#E0AC69", hair: "#17130F", style: "short", beard: true } },
        { name: "Abdülkerim Bardakcı",  pos: "DEF", num: 14, stats: { tiro: 48, defensa: 78, cabezazo: 76, pase_corto: 74, pase_largo: 71, velocidad: 66, aura: 68 }, look: { skin: "#C68642", hair: "#0E0C0A", style: "buzz", beard: true } },
        { name: "Ferdi Kadıoğlu",       pos: "DEF", num: 20, stats: { tiro: 60, defensa: 76, cabezazo: 60, pase_corto: 82, pase_largo: 76, velocidad: 84, aura: 72 }, look: { skin: "#E0AC69", hair: "#17130F", style: "curly", beard: false } },

        { name: "Hakan Çalhanoğlu",     pos: "MED", num: 10, stats: { tiro: 86, defensa: 73, cabezazo: 64, pase_corto: 90, pase_largo: 92, velocidad: 56, aura: 85 }, look: { skin: "#E0AC69", hair: "#2A1D12", style: "buzz", beard: true } },
        { name: "Orkun Kökçü",          pos: "MED", num:  6, stats: { tiro: 79, defensa: 70, cabezazo: 60, pase_corto: 85, pase_largo: 82, velocidad: 68, aura: 74 }, look: { skin: "#E0AC69", hair: "#0E0C0A", style: "short", beard: true } },
        { name: "İsmail Yüksek",        pos: "MED", num: 16, stats: { tiro: 66, defensa: 78, cabezazo: 66, pase_corto: 78, pase_largo: 74, velocidad: 66, aura: 66 }, look: { skin: "#C68642", hair: "#17130F", style: "buzz", beard: false } },

        { name: "Arda Güler",           pos: "DEL", num:  8, stats: { tiro: 83, defensa: 50, cabezazo: 52, pase_corto: 91, pase_largo: 87, velocidad: 75, aura: 84 }, look: { skin: "#E0AC69", hair: "#2A1D12", style: "short", beard: false } },
        { name: "Kenan Yıldız",         pos: "DEL", num: 11, stats: { tiro: 82, defensa: 48, cabezazo: 58, pase_corto: 86, pase_largo: 77, velocidad: 82, aura: 79 }, look: { skin: "#E0AC69", hair: "#17130F", style: "short", beard: false } },
        // 11º jugador — desbloqueable a futuro.
        // Motivo: 136' y el gol del 3-2 a Estados Unidos, pero Güler y Yıldız se llevaron la pelota.
        // Es el extremo de puro desborde que le da a Turquía una salida rápida cuando la achican.
        // { name: "Barış Alper Yılmaz",   pos: "DEL", num: 21, stats: { tiro: 79, defensa: 52, cabezazo: 62, pase_corto: 76, pase_largo: 70, velocidad: 90, aura: 74 }, look: { skin: "#C68642", hair: "#0E0C0A", style: "buzz", beard: true } },
      ],
    },
    {
      // Fase de grupos (36º) con UN gol en tres partidos, de McGinn. La defensa aguantó, el ataque no.
      id: "SCO", name: "Escocia", flag: "🏴󠁧󠁢󠁳󠁣󠁴󠁿", iso: "gb-sct", confed: "UEFA", playable: true,
      colors: { primary: "#003078", secondary: "#FFFFFF", text: "#ffffff" },
      kits: { field: { shirt: "#003078", accent: "#FFFFFF" }, alt: { shirt: "#FA4D4F", accent: "#FFFFFF" }, gk: { shirt: "#FA4D4F", accent: "#4C2882" } },
      players: [
        { name: "Angus Gunn",           pos: "POR", num:  1, stats: { atajadas: 77, reflejos: 78, salidas: 72, pase_corto: 69, pase_largo: 68, velocidad: 50, aura: 69 }, look: { skin: "#FFDBAC", hair: "#8A6B3F", style: "short", beard: false } },
        { name: "Craig Gordon",         pos: "POR", num: 21, stats: { atajadas: 72, reflejos: 73, salidas: 66, pase_corto: 63, pase_largo: 62, velocidad: 44, aura: 74 }, look: { skin: "#FFDBAC", hair: "#6B4F2A", style: "short", beard: false } },

        { name: "Andy Robertson",       pos: "DEF", num:  3, stats: { tiro: 57, defensa: 78, cabezazo: 61, pase_corto: 81, pase_largo: 79, velocidad: 73, aura: 82 }, look: { skin: "#FFDBAC", hair: "#4A331F", style: "short", beard: true } },
        { name: "Jack Hendry",          pos: "DEF", num: 13, stats: { tiro: 46, defensa: 76, cabezazo: 78, pase_corto: 70, pase_largo: 67, velocidad: 66, aura: 66 }, look: { skin: "#FFDBAC", hair: "#8A6B3F", style: "short", beard: true } },
        { name: "Grant Hanley",         pos: "DEF", num:  5, stats: { tiro: 40, defensa: 74, cabezazo: 78, pase_corto: 64, pase_largo: 60, velocidad: 58, aura: 68 }, look: { skin: "#FFDBAC", hair: "#6B4F2A", style: "buzz", beard: false } },

        { name: "Scott McTominay",      pos: "MED", num:  4, stats: { tiro: 83, defensa: 77, cabezazo: 82, pase_corto: 76, pase_largo: 72, velocidad: 68, aura: 81 }, look: { skin: "#FFDBAC", hair: "#2A1D12", style: "short", beard: true } },
        { name: "John McGinn",          pos: "MED", num:  7, stats: { tiro: 79, defensa: 75, cabezazo: 64, pase_corto: 78, pase_largo: 72, velocidad: 70, aura: 80 }, look: { skin: "#FFDBAC", hair: "#6B4F2A", style: "buzz", beard: true } },
        { name: "Lewis Ferguson",       pos: "MED", num: 19, stats: { tiro: 72, defensa: 73, cabezazo: 66, pase_corto: 78, pase_largo: 74, velocidad: 64, aura: 69 }, look: { skin: "#FFDBAC", hair: "#8A6B3F", style: "short", beard: false } },

        { name: "Lawrence Shankland",   pos: "DEL", num: 20, stats: { tiro: 76, defensa: 40, cabezazo: 74, pase_corto: 66, pase_largo: 58, velocidad: 68, aura: 68 }, look: { skin: "#FFDBAC", hair: "#4A331F", style: "buzz", beard: true } },
        { name: "Ché Adams",            pos: "DEL", num: 10, stats: { tiro: 78, defensa: 44, cabezazo: 66, pase_corto: 70, pase_largo: 62, velocidad: 76, aura: 70 }, look: { skin: "#6B4226", hair: "#0E0C0A", style: "buzz", beard: true } },
        // 11º jugador — desbloqueable a futuro.
        // Motivo: 186' con 20 años y sin gol, en un ataque que hizo uno en todo el Mundial. Entra
        // Shankland por área y Adams por movilidad; Doak es la apuesta de gambeta que Escocia no usó.
        // { name: "Ben Gannon-Doak",      pos: "DEL", num: 17, stats: { tiro: 74, defensa: 46, cabezazo: 50, pase_corto: 78, pase_largo: 68, velocidad: 90, aura: 68 }, look: { skin: "#FFDBAC", hair: "#4A331F", style: "short", beard: false } },
      ],
    },
    {
      // 16avos (29º) en su segundo Mundial. Džeko, a los 40, fue tres veces titular.
      id: "BIH", name: "Bosnia y Herzegovina", flag: "🇧🇦", iso: "ba", confed: "UEFA", playable: true,
      colors: { primary: "#001970", secondary: "#FFD700", text: "#ffffff" },
      kits: { field: { shirt: "#001970", accent: "#FFD700" }, alt: { shirt: "#FFFFFF", accent: "#FFD700" }, gk: { shirt: "#10B981", accent: "#0B0F19" } },
      players: [
        { name: "Nikola Vasilj",        pos: "POR", num:  1, stats: { atajadas: 78, reflejos: 79, salidas: 73, pase_corto: 70, pase_largo: 68, velocidad: 50, aura: 70 }, look: { skin: "#F1C27D", hair: "#4A331F", style: "short", beard: true } },
        { name: "Martin Zlomislić",     pos: "POR", num: 22, stats: { atajadas: 69, reflejos: 70, salidas: 65, pase_corto: 64, pase_largo: 62, velocidad: 48, aura: 58 }, look: { skin: "#FFDBAC", hair: "#17130F", style: "short", beard: false } },

        { name: "Sead Kolašinac",       pos: "DEF", num:  5, stats: { tiro: 52, defensa: 79, cabezazo: 72, pase_corto: 72, pase_largo: 68, velocidad: 66, aura: 76 }, look: { skin: "#F1C27D", hair: "#0E0C0A", style: "buzz", beard: true } },
        { name: "Amar Dedić",           pos: "DEF", num:  7, stats: { tiro: 56, defensa: 76, cabezazo: 62, pase_corto: 78, pase_largo: 73, velocidad: 82, aura: 68 }, look: { skin: "#F1C27D", hair: "#17130F", style: "short", beard: false } },
        { name: "Nikola Katić",         pos: "DEF", num: 18, stats: { tiro: 44, defensa: 76, cabezazo: 79, pase_corto: 66, pase_largo: 62, velocidad: 62, aura: 66 }, look: { skin: "#FFDBAC", hair: "#2A1D12", style: "short", beard: true } },

        { name: "Benjamin Tahirović",   pos: "MED", num:  6, stats: { tiro: 70, defensa: 74, cabezazo: 60, pase_corto: 82, pase_largo: 78, velocidad: 66, aura: 68 }, look: { skin: "#F1C27D", hair: "#2A1D12", style: "long", beard: false } },
        { name: "Ivan Šunjić",          pos: "MED", num: 14, stats: { tiro: 64, defensa: 76, cabezazo: 62, pase_corto: 76, pase_largo: 72, velocidad: 62, aura: 64 }, look: { skin: "#F1C27D", hair: "#4A331F", style: "buzz", beard: true } },
        { name: "Amar Memić",           pos: "MED", num: 15, stats: { tiro: 72, defensa: 62, cabezazo: 58, pase_corto: 79, pase_largo: 73, velocidad: 76, aura: 64 }, look: { skin: "#FFDBAC", hair: "#2A1D12", style: "curly", beard: false } },

        { name: "Ermedin Demirović",    pos: "DEL", num: 10, stats: { tiro: 80, defensa: 46, cabezazo: 73, pase_corto: 75, pase_largo: 65, velocidad: 76, aura: 73 }, look: { skin: "#F1C27D", hair: "#17130F", style: "short", beard: true } },
        { name: "Edin Džeko",           pos: "DEL", num: 11, stats: { tiro: 81, defensa: 40, cabezazo: 84, pase_corto: 77, pase_largo: 67, velocidad: 50, aura: 90 }, look: { skin: "#FFDBAC", hair: "#6B4F2A", style: "short", beard: false } },
        // 11º jugador — desbloqueable a futuro.
        // Motivo: 278' y el gol del empate, pero con 19 años entró al 10 detrás de dos delanteros
        // hechos. Es el extremo izquierdo que le da a Bosnia amplitud sin resignar el bloque.
        // { name: "Kerim Alajbegović",    pos: "DEL", num: 19, stats: { tiro: 76, defensa: 48, cabezazo: 56, pase_corto: 80, pase_largo: 71, velocidad: 84, aura: 68 }, look: { skin: "#FFDBAC", hair: "#4A331F", style: "short", beard: false } },
      ],
    },
    // ---------- CAF (agregadas: jugables desde el Mundial 2026) ----------
    {
      // 16avos (30º). Zidane hijo atajó tres partidos; Mahrez metió 2 en 263'.
      id: "ALG", name: "Argelia", flag: "🇩🇿", iso: "dz", confed: "CAF", playable: true,
      colors: { primary: "#006233", secondary: "#FFFFFF", text: "#ffffff" },
      kits: { field: { shirt: "#FFFFFF", accent: "#006233" }, alt: { shirt: "#1B4531", accent: "#FFFFFF" }, gk: { shirt: "#0EA5E9", accent: "#0B0F19" } },
      players: [
        { name: "Luca Zidane",          pos: "POR", num: 23, stats: { atajadas: 73, reflejos: 74, salidas: 68, pase_corto: 68, pase_largo: 66, velocidad: 47, aura: 72 }, look: { skin: "#F1C27D", hair: "#2A1D12", style: "short", beard: true } },
        { name: "Oussama Benbot",       pos: "POR", num: 16, stats: { atajadas: 68, reflejos: 69, salidas: 65, pase_corto: 61, pase_largo: 59, velocidad: 45, aura: 62 }, look: { skin: "#C68642", hair: "#0E0C0A", style: "short", beard: false } },

        { name: "Aïssa Mandi",          pos: "DEF", num:  2, stats: { tiro: 43, defensa: 76, cabezazo: 75, pase_corto: 71, pase_largo: 67, velocidad: 61, aura: 78 }, look: { skin: "#C68642", hair: "#17130F", style: "buzz", beard: true } },
        { name: "Ramy Bensebaini",      pos: "DEF", num: 21, stats: { tiro: 55, defensa: 75, cabezazo: 71, pase_corto: 71, pase_largo: 68, velocidad: 71, aura: 74 }, look: { skin: "#8D5524", hair: "#0E0C0A", style: "buzz", beard: true } },
        { name: "Rafik Belghali",       pos: "DEF", num: 17, stats: { tiro: 57, defensa: 69, cabezazo: 57, pase_corto: 71, pase_largo: 66, velocidad: 81, aura: 66 }, look: { skin: "#C68642", hair: "#17130F", style: "short", beard: false } },

        { name: "Farès Chaïbi",         pos: "MED", num: 10, stats: { tiro: 73, defensa: 59, cabezazo: 53, pase_corto: 79, pase_largo: 73, velocidad: 77, aura: 72 }, look: { skin: "#C68642", hair: "#0E0C0A", style: "curly", beard: false } },
        { name: "Ibrahim Maza",         pos: "MED", num: 22, stats: { tiro: 75, defensa: 57, cabezazo: 51, pase_corto: 81, pase_largo: 74, velocidad: 75, aura: 70 }, look: { skin: "#E0AC69", hair: "#17130F", style: "short", beard: false } },
        { name: "Nabil Bentaleb",       pos: "MED", num: 19, stats: { tiro: 67, defensa: 73, cabezazo: 59, pase_corto: 77, pase_largo: 73, velocidad: 59, aura: 70 }, look: { skin: "#8D5524", hair: "#0E0C0A", style: "short", beard: true } },

        { name: "Riyad Mahrez",         pos: "DEL", num:  7, stats: { tiro: 81, defensa: 41, cabezazo: 47, pase_corto: 85, pase_largo: 77, velocidad: 73, aura: 88 }, look: { skin: "#C68642", hair: "#17130F", style: "short", beard: true } },
        { name: "Amine Gouiri",         pos: "DEL", num:  9, stats: { tiro: 77, defensa: 41, cabezazo: 67, pase_corto: 73, pase_largo: 65, velocidad: 75, aura: 72 }, look: { skin: "#C68642", hair: "#2A1D12", style: "short", beard: true } },
        // 11º jugador — desbloqueable a futuro.
        // Motivo: 284' y tres titularidades, pero Belghali le ganó el lugar por regularidad (333' y gol).
        // Es el único lateral de nivel Champions del plantel: desbloquearlo sube el carril izquierdo entero.
        // { name: "Rayan Aït-Nouri",      pos: "DEF", num: 15, stats: { tiro: 55, defensa: 76, cabezazo: 57, pase_corto: 77, pase_largo: 71, velocidad: 84, aura: 74 }, look: { skin: "#8D5524", hair: "#0E0C0A", style: "short", beard: false } },
      ],
    },
    {
      // 16avos (19º), el mejor saldo de gol de la tanda (5-4). Kessié jugó 347' de 360.
      id: "CIV", name: "Costa de Marfil", flag: "🇨🇮", iso: "ci", confed: "CAF", playable: true,
      colors: { primary: "#FF7D1D", secondary: "#009E60", text: "#0f172a" },
      kits: { field: { shirt: "#FF7D1D", accent: "#FFFFFF" }, alt: { shirt: "#FFFFFF", accent: "#FF7D1D" }, gk: { shirt: "#0D9488", accent: "#0B0F19" } },
      players: [
        { name: "Yahia Fofana",         pos: "POR", num:  1, stats: { atajadas: 75, reflejos: 76, salidas: 70, pase_corto: 65, pase_largo: 64, velocidad: 47, aura: 72 }, look: { skin: "#6B4226", hair: "#0E0C0A", style: "buzz", beard: false } },
        { name: "Alban Lafont",         pos: "POR", num: 23, stats: { atajadas: 71, reflejos: 72, salidas: 68, pase_corto: 65, pase_largo: 63, velocidad: 47, aura: 66 }, look: { skin: "#8D5524", hair: "#17130F", style: "short", beard: true } },

        { name: "Odilon Kossounou",     pos: "DEF", num:  7, stats: { tiro: 41, defensa: 76, cabezazo: 75, pase_corto: 69, pase_largo: 65, velocidad: 77, aura: 70 }, look: { skin: "#6B4226", hair: "#0E0C0A", style: "buzz", beard: false } },
        { name: "Emmanuel Agbadou",     pos: "DEF", num: 20, stats: { tiro: 43, defensa: 75, cabezazo: 76, pase_corto: 65, pase_largo: 61, velocidad: 69, aura: 68 }, look: { skin: "#6B4226", hair: "#17130F", style: "short", beard: true } },
        { name: "Guéla Doué",           pos: "DEF", num: 17, stats: { tiro: 57, defensa: 72, cabezazo: 59, pase_corto: 74, pase_largo: 68, velocidad: 82, aura: 70 }, look: { skin: "#8D5524", hair: "#0E0C0A", style: "short", beard: false } },

        { name: "Franck Kessié",        pos: "MED", num:  8, stats: { tiro: 77, defensa: 79, cabezazo: 73, pase_corto: 80, pase_largo: 75, velocidad: 65, aura: 82 }, look: { skin: "#6B4226", hair: "#0E0C0A", style: "buzz", beard: true } },
        { name: "Ibrahim Sangaré",      pos: "MED", num: 18, stats: { tiro: 67, defensa: 78, cabezazo: 71, pase_corto: 75, pase_largo: 71, velocidad: 59, aura: 72 }, look: { skin: "#6B4226", hair: "#17130F", style: "buzz", beard: true } },
        { name: "Christ Inao Oulaï",    pos: "MED", num: 26, stats: { tiro: 65, defensa: 73, cabezazo: 63, pase_corto: 75, pase_largo: 69, velocidad: 71, aura: 66 }, look: { skin: "#8D5524", hair: "#0E0C0A", style: "curly", beard: false } },

        { name: "Yan Diomande",         pos: "DEL", num: 11, stats: { tiro: 76, defensa: 41, cabezazo: 51, pase_corto: 77, pase_largo: 66, velocidad: 88, aura: 72 }, look: { skin: "#6B4226", hair: "#0E0C0A", style: "short", beard: false } },
        { name: "Nicolas Pépé",         pos: "DEL", num: 19, stats: { tiro: 79, defensa: 39, cabezazo: 53, pase_corto: 79, pase_largo: 71, velocidad: 77, aura: 76 }, look: { skin: "#6B4226", hair: "#2A1D12", style: "curly", beard: true } },
        // 11º jugador — desbloqueable a futuro.
        // Motivo: 2 goles en 185' entrando casi siempre desde el banco — la mejor relación gol/minuto
        // del plantel, pero solo 2 titularidades. Es el extremo derecho que hoy no tiene reemplazo real.
        // { name: "Amad Diallo",          pos: "DEL", num: 15, stats: { tiro: 78, defensa: 43, cabezazo: 49, pase_corto: 81, pase_largo: 71, velocidad: 83, aura: 76 }, look: { skin: "#8D5524", hair: "#0E0C0A", style: "short", beard: false } },
      ],
    },
    {
      // Octavos (15º), la segunda mejor africana. Empató 3 de 5 y cayó con Argentina.
      // Nueve de los diez son de la liga local: el Al Ahly puso cinco titulares.
      id: "EGY", name: "Egipto", flag: "🇪🇬", iso: "eg", confed: "CAF", playable: true,
      colors: { primary: "#CE1126", secondary: "#000000", text: "#ffffff" },
      kits: { field: { shirt: "#CE1126", accent: "#000000" }, alt: { shirt: "#FFFFFF", accent: "#000000" }, gk: { shirt: "#84CC16", accent: "#0B0F19" } },
      players: [
        { name: "Mostafa Shobeir",      pos: "POR", num: 23, stats: { atajadas: 77, reflejos: 78, salidas: 72, pase_corto: 67, pase_largo: 65, velocidad: 49, aura: 72 }, look: { skin: "#C68642", hair: "#0E0C0A", style: "short", beard: true } },
        { name: "Mohamed El Shenawy",   pos: "POR", num:  1, stats: { atajadas: 75, reflejos: 75, salidas: 71, pase_corto: 65, pase_largo: 63, velocidad: 45, aura: 78 }, look: { skin: "#C68642", hair: "#17130F", style: "buzz", beard: true } },

        { name: "Yasser Ibrahim",       pos: "DEF", num:  2, stats: { tiro: 47, defensa: 76, cabezazo: 76, pase_corto: 68, pase_largo: 64, velocidad: 65, aura: 70 }, look: { skin: "#C68642", hair: "#0E0C0A", style: "short", beard: true } },
        { name: "Mohamed Hany",         pos: "DEF", num:  3, stats: { tiro: 49, defensa: 73, cabezazo: 63, pase_corto: 71, pase_largo: 67, velocidad: 75, aura: 66 }, look: { skin: "#C68642", hair: "#17130F", style: "short", beard: false } },
        { name: "Ramy Rabia",           pos: "DEF", num:  5, stats: { tiro: 43, defensa: 74, cabezazo: 74, pase_corto: 66, pase_largo: 62, velocidad: 63, aura: 68 }, look: { skin: "#8D5524", hair: "#0E0C0A", style: "buzz", beard: true } },

        { name: "Emam Ashour",          pos: "MED", num:  8, stats: { tiro: 78, defensa: 63, cabezazo: 57, pase_corto: 82, pase_largo: 74, velocidad: 75, aura: 74 }, look: { skin: "#C68642", hair: "#0E0C0A", style: "curly", beard: true } },
        { name: "Mostafa Ziko",         pos: "MED", num: 11, stats: { tiro: 77, defensa: 59, cabezazo: 55, pase_corto: 79, pase_largo: 71, velocidad: 82, aura: 70 }, look: { skin: "#E0AC69", hair: "#17130F", style: "short", beard: false } },
        { name: "Marwan Attia",         pos: "MED", num: 19, stats: { tiro: 67, defensa: 76, cabezazo: 63, pase_corto: 77, pase_largo: 72, velocidad: 65, aura: 68 }, look: { skin: "#C68642", hair: "#2A1D12", style: "buzz", beard: true } },

        { name: "Mohamed Salah",        pos: "DEL", num: 10, stats: { tiro: 85, defensa: 39, cabezazo: 63, pase_corto: 83, pase_largo: 73, velocidad: 81, aura: 96 }, look: { skin: "#C68642", hair: "#17130F", style: "curly", beard: true } },
        { name: "Omar Marmoush",        pos: "DEL", num: 22, stats: { tiro: 79, defensa: 41, cabezazo: 65, pase_corto: 77, pase_largo: 67, velocidad: 83, aura: 76 }, look: { skin: "#C68642", hair: "#0E0C0A", style: "short", beard: false } },
        // 11º jugador — desbloqueable a futuro.
        // Motivo: 360' repartidos en cuatro titularidades, pero sin un solo número que lo empuje
        // al 10. Es el segundo cinco puro: con él, Egipto puede doblar el mediocentro sin resignar salida.
        // { name: "Mohanad Lasheen",      pos: "MED", num: 17, stats: { tiro: 65, defensa: 73, cabezazo: 61, pase_corto: 77, pase_largo: 71, velocidad: 67, aura: 66 }, look: { skin: "#8D5524", hair: "#17130F", style: "short", beard: false } },
      ],
    },
    {
      // 16avos (24º) con DOS goles en cuatro partidos: la defensa aguantó, el ataque nunca apareció.
      id: "GHA", name: "Ghana", flag: "🇬🇭", iso: "gh", confed: "CAF", playable: true,
      colors: { primary: "#CE1126", secondary: "#FCD116", text: "#ffffff" },
      kits: { field: { shirt: "#FFFFFF", accent: "#CE1126" }, alt: { shirt: "#F8CD5C", accent: "#CE1126" }, gk: { shirt: "#BE185D", accent: "#0B0F19" } },
      players: [
        { name: "Benjamin Asare",       pos: "POR", num: 16, stats: { atajadas: 71, reflejos: 72, salidas: 66, pase_corto: 58, pase_largo: 57, velocidad: 46, aura: 68 }, look: { skin: "#6B4226", hair: "#0E0C0A", style: "buzz", beard: false } },
        { name: "Lawrence Ati-Zigi",    pos: "POR", num:  1, stats: { atajadas: 69, reflejos: 70, salidas: 65, pase_corto: 60, pase_largo: 59, velocidad: 46, aura: 66 }, look: { skin: "#8D5524", hair: "#0E0C0A", style: "short", beard: true } },

        { name: "Gideon Mensah",        pos: "DEF", num: 14, stats: { tiro: 48, defensa: 71, cabezazo: 58, pase_corto: 69, pase_largo: 65, velocidad: 74, aura: 66 }, look: { skin: "#6B4226", hair: "#0E0C0A", style: "short", beard: false } },
        { name: "Jerome Opoku",         pos: "DEF", num: 18, stats: { tiro: 38, defensa: 71, cabezazo: 72, pase_corto: 62, pase_largo: 58, velocidad: 64, aura: 64 }, look: { skin: "#6B4226", hair: "#17130F", style: "buzz", beard: true } },
        { name: "Marvin Senaya",        pos: "DEF", num: 26, stats: { tiro: 46, defensa: 68, cabezazo: 58, pase_corto: 67, pase_largo: 62, velocidad: 76, aura: 60 }, look: { skin: "#8D5524", hair: "#0E0C0A", style: "curly", beard: false } },

        { name: "Antoine Semenyo",      pos: "MED", num: 11, stats: { tiro: 78, defensa: 60, cabezazo: 62, pase_corto: 76, pase_largo: 68, velocidad: 82, aura: 76 }, look: { skin: "#6B4226", hair: "#0E0C0A", style: "short", beard: true } },
        { name: "Thomas Partey",        pos: "MED", num:  5, stats: { tiro: 72, defensa: 78, cabezazo: 66, pase_corto: 78, pase_largo: 74, velocidad: 60, aura: 78 }, look: { skin: "#6B4226", hair: "#2A1D12", style: "short", beard: true } },
        { name: "Caleb Yirenkyi",       pos: "MED", num:  3, stats: { tiro: 66, defensa: 68, cabezazo: 58, pase_corto: 72, pase_largo: 66, velocidad: 70, aura: 64 }, look: { skin: "#8D5524", hair: "#0E0C0A", style: "buzz", beard: false } },

        { name: "Jordan Ayew",          pos: "DEL", num:  9, stats: { tiro: 74, defensa: 42, cabezazo: 62, pase_corto: 74, pase_largo: 66, velocidad: 64, aura: 80 }, look: { skin: "#6B4226", hair: "#17130F", style: "short", beard: true } },
        { name: "Iñaki Williams",       pos: "DEL", num: 19, stats: { tiro: 73, defensa: 40, cabezazo: 58, pase_corto: 70, pase_largo: 61, velocidad: 84, aura: 74 }, look: { skin: "#6B4226", hair: "#0E0C0A", style: "curly", beard: false } },
        // 11º jugador — desbloqueable a futuro.
        // Motivo: 129' en dos titularidades y sin gol, en el ataque más flojo del torneo africano.
        // Es el uno contra uno por izquierda que Ghana no llegó a usar: entra y aparece el desborde.
        // { name: "Kamaldeen Sulemana", pos: "DEL", num: 22, stats: { tiro: 72, defensa: 40, cabezazo: 46, pase_corto: 74, pase_largo: 64, velocidad: 86, aura: 70 }, look: { skin: "#8D5524", hair: "#17130F", style: "short", beard: false } },
      ],
    },
    {
      // 16avos (23º). Wissa jugó los 360' y metió 3 de los 5 goles del equipo.
      id: "COD", name: "RD Congo", flag: "🇨🇩", iso: "cd", confed: "CAF", playable: true,
      colors: { primary: "#00B7EF", secondary: "#F7D618", text: "#0f172a" },
      kits: { field: { shirt: "#00B7EF", accent: "#F7D618" }, alt: { shirt: "#FF0000", accent: "#F7D618" }, gk: { shirt: "#B91C1C", accent: "#F8FAFC" } },
      players: [
        { name: "Lionel Mpasi",         pos: "POR", num:  1, stats: { atajadas: 70, reflejos: 71, salidas: 65, pase_corto: 61, pase_largo: 59, velocidad: 45, aura: 68 }, look: { skin: "#6B4226", hair: "#0E0C0A", style: "buzz", beard: true } },
        { name: "Timothy Fayulu",       pos: "POR", num: 16, stats: { atajadas: 64, reflejos: 65, salidas: 61, pase_corto: 58, pase_largo: 56, velocidad: 43, aura: 60 }, look: { skin: "#8D5524", hair: "#0E0C0A", style: "short", beard: false } },

        { name: "Chancel Mbemba",       pos: "DEF", num: 22, stats: { tiro: 41, defensa: 75, cabezazo: 73, pase_corto: 66, pase_largo: 62, velocidad: 65, aura: 78 }, look: { skin: "#6B4226", hair: "#0E0C0A", style: "buzz", beard: true } },
        { name: "Aaron Wan-Bissaka",    pos: "DEF", num:  2, stats: { tiro: 39, defensa: 74, cabezazo: 53, pase_corto: 65, pase_largo: 58, velocidad: 79, aura: 68 }, look: { skin: "#6B4226", hair: "#17130F", style: "short", beard: true } },
        { name: "Axel Tuanzebe",        pos: "DEF", num:  4, stats: { tiro: 35, defensa: 69, cabezazo: 67, pase_corto: 61, pase_largo: 57, velocidad: 65, aura: 64 }, look: { skin: "#6B4226", hair: "#0E0C0A", style: "short", beard: false } },

        { name: "Samuel Moutoussamy",   pos: "MED", num:  8, stats: { tiro: 63, defensa: 69, cabezazo: 57, pase_corto: 73, pase_largo: 67, velocidad: 63, aura: 66 }, look: { skin: "#8D5524", hair: "#0E0C0A", style: "curly", beard: false } },
        { name: "Noah Sadiki",          pos: "MED", num: 14, stats: { tiro: 63, defensa: 71, cabezazo: 53, pase_corto: 74, pase_largo: 67, velocidad: 71, aura: 66 }, look: { skin: "#6B4226", hair: "#17130F", style: "buzz", beard: false } },
        { name: "Ngal'ayel Mukau",      pos: "MED", num:  6, stats: { tiro: 65, defensa: 63, cabezazo: 53, pase_corto: 72, pase_largo: 66, velocidad: 67, aura: 64 }, look: { skin: "#8D5524", hair: "#0E0C0A", style: "short", beard: true } },

        { name: "Yoane Wissa",          pos: "DEL", num: 20, stats: { tiro: 77, defensa: 39, cabezazo: 59, pase_corto: 71, pase_largo: 61, velocidad: 77, aura: 78 }, look: { skin: "#6B4226", hair: "#0E0C0A", style: "short", beard: true } },
        { name: "Cédric Bakambu",       pos: "DEL", num: 17, stats: { tiro: 71, defensa: 35, cabezazo: 65, pase_corto: 65, pase_largo: 55, velocidad: 61, aura: 74 }, look: { skin: "#6B4226", hair: "#17130F", style: "buzz", beard: true } },
        // 11º jugador — desbloqueable a futuro.
        // Motivo: 317' de carrilero izquierdo, pero el 10 se cierra con tres centrales de más nota.
        // Desbloquearlo da amplitud real por izquierda sin sacar a nadie de la última línea.
        // { name: "Arthur Masuaku",       pos: "DEF", num: 26, stats: { tiro: 51, defensa: 68, cabezazo: 53, pase_corto: 71, pase_largo: 66, velocidad: 75, aura: 68 }, look: { skin: "#8D5524", hair: "#17130F", style: "short", beard: false } },
      ],
    },
    {
      // 16avos (25º) con la defensa más barata del torneo africano: 4 goles en contra en 4 partidos.
      // Cinco de los diez juegan en el Mamelodi Sundowns.
      id: "RSA", name: "Sudáfrica", flag: "🇿🇦", iso: "za", confed: "CAF", playable: true,
      colors: { primary: "#FCE53D", secondary: "#007A4D", text: "#0f172a" },
      kits: { field: { shirt: "#FCE53D", accent: "#007A4D" }, alt: { shirt: "#007A4D", accent: "#FCE53D" }, gk: { shirt: "#312E81", accent: "#F8FAFC" } },
      players: [
        { name: "Ronwen Williams",      pos: "POR", num:  1, stats: { atajadas: 76, reflejos: 77, salidas: 70, pase_corto: 62, pase_largo: 61, velocidad: 46, aura: 80 }, look: { skin: "#8D5524", hair: "#0E0C0A", style: "buzz", beard: true } },
        { name: "Ricardo Goss",         pos: "POR", num: 22, stats: { atajadas: 65, reflejos: 66, salidas: 62, pase_corto: 58, pase_largo: 56, velocidad: 44, aura: 60 }, look: { skin: "#C68642", hair: "#17130F", style: "short", beard: false } },

        { name: "Ime Okon",             pos: "DEF", num: 21, stats: { tiro: 40, defensa: 72, cabezazo: 70, pase_corto: 64, pase_largo: 60, velocidad: 66, aura: 64 }, look: { skin: "#6B4226", hair: "#0E0C0A", style: "buzz", beard: false } },
        { name: "Mbekezeli Mbokazi",    pos: "DEF", num: 14, stats: { tiro: 38, defensa: 71, cabezazo: 69, pase_corto: 63, pase_largo: 59, velocidad: 68, aura: 62 }, look: { skin: "#6B4226", hair: "#17130F", style: "short", beard: false } },
        { name: "Khuliso Mudau",        pos: "DEF", num: 20, stats: { tiro: 46, defensa: 69, cabezazo: 56, pase_corto: 67, pase_largo: 62, velocidad: 76, aura: 64 }, look: { skin: "#8D5524", hair: "#0E0C0A", style: "short", beard: true } },

        { name: "Teboho Mokoena",       pos: "MED", num:  4, stats: { tiro: 72, defensa: 70, cabezazo: 56, pase_corto: 75, pase_largo: 72, velocidad: 64, aura: 72 }, look: { skin: "#6B4226", hair: "#0E0C0A", style: "short", beard: true } },
        { name: "Sphephelo Sithole",    pos: "MED", num: 13, stats: { tiro: 60, defensa: 70, cabezazo: 54, pase_corto: 72, pase_largo: 66, velocidad: 64, aura: 62 }, look: { skin: "#8D5524", hair: "#0E0C0A", style: "buzz", beard: false } },
        { name: "Thalente Mbatha",      pos: "MED", num:  5, stats: { tiro: 64, defensa: 66, cabezazo: 52, pase_corto: 73, pase_largo: 66, velocidad: 68, aura: 62 }, look: { skin: "#6B4226", hair: "#17130F", style: "curly", beard: false } },

        { name: "Thapelo Maseko",       pos: "DEL", num: 12, stats: { tiro: 72, defensa: 38, cabezazo: 48, pase_corto: 70, pase_largo: 60, velocidad: 83, aura: 66 }, look: { skin: "#6B4226", hair: "#0E0C0A", style: "short", beard: false } },
        { name: "Oswin Appollis",       pos: "DEL", num:  7, stats: { tiro: 71, defensa: 40, cabezazo: 46, pase_corto: 74, pase_largo: 64, velocidad: 80, aura: 68 }, look: { skin: "#8D5524", hair: "#0E0C0A", style: "curly", beard: false } },
        // 11º jugador — desbloqueable a futuro.
        // Motivo: 346' de lateral izquierdo, a nada de entrar; el 10 lo cierran los tres de arriba.
        // Es el único que sube y centra de verdad: desbloquearlo le da a Sudáfrica un ataque por afuera.
        // { name: "Aubrey Modiba",        pos: "DEF", num:  6, stats: { tiro: 54, defensa: 67, cabezazo: 52, pase_corto: 71, pase_largo: 66, velocidad: 75, aura: 68 }, look: { skin: "#6B4226", hair: "#17130F", style: "buzz", beard: true } },
      ],
    },
    {
      // Fase de grupos y ÚLTIMO de los 48 (47º): tres derrotas, 12 goles en contra, ni un punto.
      id: "TUN", name: "Túnez", flag: "🇹🇳", iso: "tn", confed: "CAF", playable: true,
      colors: { primary: "#E70013", secondary: "#FFFFFF", text: "#ffffff" },
      kits: { field: { shirt: "#FFFFFF", accent: "#E70013" }, alt: { shirt: "#FF0000", accent: "#FFFFFF" }, gk: { shirt: "#4D7C0F", accent: "#F8FAFC" } },
      players: [
        { name: "Aymen Dahmen",         pos: "POR", num: 16, stats: { atajadas: 69, reflejos: 70, salidas: 64, pase_corto: 60, pase_largo: 58, velocidad: 46, aura: 66 }, look: { skin: "#C68642", hair: "#0E0C0A", style: "short", beard: true } },
        { name: "Mouhib Chamakh",       pos: "POR", num:  1, stats: { atajadas: 64, reflejos: 65, salidas: 60, pase_corto: 58, pase_largo: 56, velocidad: 44, aura: 58 }, look: { skin: "#E0AC69", hair: "#17130F", style: "short", beard: false } },

        { name: "Montassar Talbi",      pos: "DEF", num:  3, stats: { tiro: 42, defensa: 71, cabezazo: 72, pase_corto: 63, pase_largo: 59, velocidad: 62, aura: 68 }, look: { skin: "#C68642", hair: "#0E0C0A", style: "buzz", beard: true } },
        { name: "Ali Abdi",             pos: "DEF", num:  2, stats: { tiro: 52, defensa: 68, cabezazo: 56, pase_corto: 70, pase_largo: 66, velocidad: 72, aura: 66 }, look: { skin: "#C68642", hair: "#17130F", style: "short", beard: false } },
        { name: "Yan Valery",           pos: "DEF", num: 20, stats: { tiro: 48, defensa: 66, cabezazo: 56, pase_corto: 67, pase_largo: 62, velocidad: 70, aura: 62 }, look: { skin: "#8D5524", hair: "#0E0C0A", style: "short", beard: true } },

        { name: "Ellyes Skhiri",        pos: "MED", num: 17, stats: { tiro: 66, defensa: 74, cabezazo: 64, pase_corto: 76, pase_largo: 71, velocidad: 60, aura: 72 }, look: { skin: "#C68642", hair: "#2A1D12", style: "long", beard: false } },
        { name: "Hannibal Mejbri",      pos: "MED", num: 10, stats: { tiro: 70, defensa: 62, cabezazo: 52, pase_corto: 76, pase_largo: 70, velocidad: 70, aura: 72 }, look: { skin: "#C68642", hair: "#0E0C0A", style: "curly", beard: false } },
        { name: "Anis Ben Slimane",     pos: "MED", num: 25, stats: { tiro: 66, defensa: 64, cabezazo: 58, pase_corto: 70, pase_largo: 64, velocidad: 68, aura: 62 }, look: { skin: "#E0AC69", hair: "#0E0C0A", style: "buzz", beard: true } },

        { name: "Elias Saad",           pos: "DEL", num:  8, stats: { tiro: 70, defensa: 38, cabezazo: 48, pase_corto: 72, pase_largo: 61, velocidad: 80, aura: 64 }, look: { skin: "#8D5524", hair: "#17130F", style: "short", beard: false } },
        { name: "Hazem Mastouri",       pos: "DEL", num:  9, stats: { tiro: 70, defensa: 36, cabezazo: 64, pase_corto: 64, pase_largo: 56, velocidad: 68, aura: 62 }, look: { skin: "#C68642", hair: "#0E0C0A", style: "short", beard: true } },
        // 11º jugador — desbloqueable a futuro.
        // Motivo: metió uno de los dos goles de Túnez en el torneo, pero desde central y en 180'.
        // Es el tercer central que le permite a Túnez cerrarse con línea de tres sin perder salida.
        // { name: "Omar Rekik",           pos: "DEF", num:  4, stats: { tiro: 42, defensa: 69, cabezazo: 68, pase_corto: 66, pase_largo: 62, velocidad: 64, aura: 62 }, look: { skin: "#E0AC69", hair: "#17130F", style: "buzz", beard: false } },
      ],
    },
    // ---------- AFC (agregadas: jugables desde el Mundial 2026) ----------
    {
      // Fase de grupos (33º) SIN PERDER: tres empates, 3-3. La mejor asiática del Mundial
      // y la defensa más barata de la tanda. El problema fue meterla.
      id: "IRN", name: "Irán", flag: "🇮🇷", iso: "ir", confed: "AFC", playable: true,
      colors: { primary: "#DA0000", secondary: "#239F40", text: "#ffffff" },
      kits: { field: { shirt: "#FFFFFF", accent: "#DA0000" }, alt: { shirt: "#DA0000", accent: "#FFFFFF" }, gk: { shirt: "#9333EA", accent: "#0B0F19" } },
      players: [
        { name: "Alireza Beiranvand",   pos: "POR", num:  1, stats: { atajadas: 78, reflejos: 78, salidas: 74, pase_corto: 62, pase_largo: 66, velocidad: 50, aura: 76 }, look: { skin: "#E0AC69", hair: "#0E0C0A", style: "short", beard: true } },
        { name: "Payam Niazmand",       pos: "POR", num: 12, stats: { atajadas: 71, reflejos: 72, salidas: 68, pase_corto: 62, pase_largo: 62, velocidad: 48, aura: 62 }, look: { skin: "#E0AC69", hair: "#17130F", style: "short", beard: false } },

        { name: "Ramin Rezaeian",       pos: "DEF", num: 23, stats: { tiro: 62, defensa: 72, cabezazo: 62, pase_corto: 72, pase_largo: 68, velocidad: 76, aura: 72 }, look: { skin: "#E0AC69", hair: "#17130F", style: "short", beard: true } },
        { name: "Shojae Khalilzadeh",   pos: "DEF", num:  4, stats: { tiro: 44, defensa: 76, cabezazo: 77, pase_corto: 64, pase_largo: 60, velocidad: 58, aura: 70 }, look: { skin: "#C68642", hair: "#0E0C0A", style: "buzz", beard: true } },
        { name: "Ali Nemati",           pos: "DEF", num: 19, stats: { tiro: 42, defensa: 73, cabezazo: 72, pase_corto: 63, pase_largo: 59, velocidad: 66, aura: 62 }, look: { skin: "#E0AC69", hair: "#0E0C0A", style: "short", beard: false } },

        { name: "Saeid Ezatolahi",      pos: "MED", num:  6, stats: { tiro: 64, defensa: 78, cabezazo: 68, pase_corto: 74, pase_largo: 70, velocidad: 58, aura: 70 }, look: { skin: "#C68642", hair: "#17130F", style: "buzz", beard: true } },
        { name: "Mohammad Mohebi",      pos: "MED", num:  8, stats: { tiro: 74, defensa: 60, cabezazo: 56, pase_corto: 76, pase_largo: 70, velocidad: 80, aura: 68 }, look: { skin: "#E0AC69", hair: "#17130F", style: "short", beard: false } },
        { name: "Saman Ghoddos",        pos: "MED", num: 14, stats: { tiro: 70, defensa: 64, cabezazo: 56, pase_corto: 78, pase_largo: 72, velocidad: 68, aura: 68 }, look: { skin: "#E0AC69", hair: "#2A1D12", style: "curly", beard: true } },

        { name: "Mehdi Taremi",         pos: "DEL", num:  9, stats: { tiro: 82, defensa: 46, cabezazo: 78, pase_corto: 78, pase_largo: 70, velocidad: 70, aura: 84 }, look: { skin: "#C68642", hair: "#0E0C0A", style: "short", beard: true } },
        { name: "Shahriyar Moghanlou",  pos: "DEL", num: 20, stats: { tiro: 72, defensa: 40, cabezazo: 68, pase_corto: 64, pase_largo: 56, velocidad: 68, aura: 60 }, look: { skin: "#E0AC69", hair: "#2A1D12", style: "buzz", beard: true } },
        // 11º jugador — desbloqueable a futuro.
        // Motivo: 204' de lateral izquierdo, pero los tres de atrás jugaron los 270' completos.
        // Es el único que sube por izquierda: desbloquearlo le da a Irán el ancho que no tuvo.
        // { name: "Milad Mohammadi",      pos: "DEF", num:  5, stats: { tiro: 54, defensa: 71, cabezazo: 60, pase_corto: 70, pase_largo: 66, velocidad: 74, aura: 66 }, look: { skin: "#C68642", hair: "#0E0C0A", style: "short", beard: true } },
      ],
    },
    {
      // Fase de grupos (38º): dos empates y una derrota, un gol a favor. Vistió VERDE de titular
      // por primera vez en un Mundial.
      id: "KSA", name: "Arabia Saudita", flag: "🇸🇦", iso: "sa", confed: "AFC", playable: true,
      colors: { primary: "#006C35", secondary: "#FFFFFF", text: "#ffffff" },
      kits: { field: { shirt: "#43B88B", accent: "#FFFFFF" }, alt: { shirt: "#FFFFFF", accent: "#43B88B" }, gk: { shirt: "#B45309", accent: "#F8FAFC" } },
      players: [
        { name: "Mohammed Al-Owais",    pos: "POR", num: 21, stats: { atajadas: 71, reflejos: 72, salidas: 66, pase_corto: 58, pase_largo: 58, velocidad: 44, aura: 72 }, look: { skin: "#C68642", hair: "#0E0C0A", style: "short", beard: true } },
        { name: "Nawaf Al-Aqidi",       pos: "POR", num:  1, stats: { atajadas: 65, reflejos: 66, salidas: 62, pase_corto: 57, pase_largo: 56, velocidad: 44, aura: 62 }, look: { skin: "#C68642", hair: "#17130F", style: "short", beard: false } },

        { name: "Saud Abdulhamid",      pos: "DEF", num: 12, stats: { tiro: 48, defensa: 66, cabezazo: 54, pase_corto: 67, pase_largo: 62, velocidad: 76, aura: 64 }, look: { skin: "#C68642", hair: "#0E0C0A", style: "short", beard: true } },
        { name: "Abdulelah Al-Amri",    pos: "DEF", num:  4, stats: { tiro: 42, defensa: 69, cabezazo: 70, pase_corto: 60, pase_largo: 56, velocidad: 60, aura: 66 }, look: { skin: "#C68642", hair: "#17130F", style: "buzz", beard: true } },
        { name: "Hassan Al-Tambakti",   pos: "DEF", num:  5, stats: { tiro: 40, defensa: 68, cabezazo: 66, pase_corto: 62, pase_largo: 58, velocidad: 66, aura: 64 }, look: { skin: "#E0AC69", hair: "#0E0C0A", style: "short", beard: false } },

        { name: "Mohamed Kanno",        pos: "MED", num: 23, stats: { tiro: 64, defensa: 68, cabezazo: 58, pase_corto: 72, pase_largo: 67, velocidad: 58, aura: 68 }, look: { skin: "#C68642", hair: "#17130F", style: "short", beard: true } },
        { name: "Nasser Al-Dawsari",    pos: "MED", num:  6, stats: { tiro: 64, defensa: 64, cabezazo: 52, pase_corto: 70, pase_largo: 64, velocidad: 68, aura: 64 }, look: { skin: "#8D5524", hair: "#0E0C0A", style: "short", beard: false } },
        { name: "Abdullah Al-Khaibari", pos: "MED", num: 15, stats: { tiro: 58, defensa: 67, cabezazo: 54, pase_corto: 68, pase_largo: 63, velocidad: 62, aura: 60 }, look: { skin: "#C68642", hair: "#0E0C0A", style: "buzz", beard: false } },

        { name: "Salem Al-Dawsari",     pos: "DEL", num: 10, stats: { tiro: 74, defensa: 38, cabezazo: 48, pase_corto: 75, pase_largo: 66, velocidad: 74, aura: 82 }, look: { skin: "#C68642", hair: "#2A1D12", style: "curly", beard: true } },
        { name: "Firas Al-Buraikan",    pos: "DEL", num:  9, stats: { tiro: 71, defensa: 36, cabezazo: 66, pase_corto: 64, pase_largo: 56, velocidad: 70, aura: 68 }, look: { skin: "#C68642", hair: "#2A1D12", style: "short", beard: true } },
        // 11º jugador — desbloqueable a futuro.
        // Motivo: 188' de lateral izquierdo con dos titularidades; el 10 lo cierran tres defensores
        // con más rodaje. Es el carrilero que le permite a Arabia atacar sin abrir la línea de fondo.
        // { name: "Moteb Al-Harbi",       pos: "DEF", num: 24, stats: { tiro: 46, defensa: 65, cabezazo: 52, pase_corto: 66, pase_largo: 61, velocidad: 73, aura: 60 }, look: { skin: "#8D5524", hair: "#17130F", style: "short", beard: false } },
      ],
    },
    {
      // Fase de grupos (41º) con 10 goles en contra. Afif y Khoukhi sostuvieron lo que quedaba.
      id: "QAT", name: "Catar", flag: "🇶🇦", iso: "qa", confed: "AFC", playable: true,
      colors: { primary: "#8A1538", secondary: "#FFFFFF", text: "#ffffff" },
      kits: { field: { shirt: "#7C202B", accent: "#FFFFFF" }, alt: { shirt: "#FFFFFF", accent: "#7C202B" }, gk: { shirt: "#22C55E", accent: "#0B0F19" } },
      players: [
        { name: "Mahmud Abunada",       pos: "POR", num:  1, stats: { atajadas: 65, reflejos: 66, salidas: 60, pase_corto: 56, pase_largo: 54, velocidad: 44, aura: 62 }, look: { skin: "#C68642", hair: "#0E0C0A", style: "short", beard: false } },
        { name: "Meshaal Barsham",      pos: "POR", num: 22, stats: { atajadas: 64, reflejos: 65, salidas: 61, pase_corto: 57, pase_largo: 55, velocidad: 42, aura: 66 }, look: { skin: "#C68642", hair: "#17130F", style: "short", beard: true } },

        { name: "Boualem Khoukhi",      pos: "DEF", num: 16, stats: { tiro: 50, defensa: 67, cabezazo: 69, pase_corto: 60, pase_largo: 56, velocidad: 50, aura: 72 }, look: { skin: "#C68642", hair: "#17130F", style: "short", beard: true } },
        { name: "Pedro Miguel",         pos: "DEF", num:  2, stats: { tiro: 38, defensa: 65, cabezazo: 62, pase_corto: 62, pase_largo: 57, velocidad: 58, aura: 68 }, look: { skin: "#8D5524", hair: "#0E0C0A", style: "buzz", beard: true } },
        { name: "Issa Laye",            pos: "DEF", num:  4, stats: { tiro: 40, defensa: 63, cabezazo: 60, pase_corto: 62, pase_largo: 57, velocidad: 64, aura: 58 }, look: { skin: "#6B4226", hair: "#0E0C0A", style: "short", beard: false } },

        { name: "Assim Madibo",         pos: "MED", num: 23, stats: { tiro: 54, defensa: 66, cabezazo: 48, pase_corto: 68, pase_largo: 62, velocidad: 62, aura: 62 }, look: { skin: "#6B4226", hair: "#0E0C0A", style: "buzz", beard: false } },
        { name: "Ahmed Fathy",          pos: "MED", num: 20, stats: { tiro: 58, defensa: 62, cabezazo: 50, pase_corto: 66, pase_largo: 61, velocidad: 62, aura: 60 }, look: { skin: "#C68642", hair: "#17130F", style: "curly", beard: false } },
        { name: "Karim Boudiaf",        pos: "MED", num: 12, stats: { tiro: 54, defensa: 66, cabezazo: 58, pase_corto: 64, pase_largo: 60, velocidad: 50, aura: 68 }, look: { skin: "#C68642", hair: "#0E0C0A", style: "short", beard: true } },

        { name: "Akram Afif",           pos: "DEL", num: 11, stats: { tiro: 72, defensa: 36, cabezazo: 44, pase_corto: 74, pase_largo: 64, velocidad: 72, aura: 82 }, look: { skin: "#C68642", hair: "#2A1D12", style: "curly", beard: true } },
        { name: "Edmilson Junior",      pos: "DEL", num:  8, stats: { tiro: 68, defensa: 36, cabezazo: 50, pase_corto: 68, pase_largo: 60, velocidad: 70, aura: 64 }, look: { skin: "#6B4226", hair: "#17130F", style: "curly", beard: false } },
        // 11º jugador — desbloqueable a futuro.
        // Motivo: 186 partidos con Catar y el ÚNICO gol del equipo en el Mundial, pero lo hizo en
        // 57 minutos. Es el capitán histórico: entra por aura y por pelota parada, no por rodaje.
        // { name: "Hassan Al-Haydos",     pos: "DEL", num: 10, stats: { tiro: 68, defensa: 38, cabezazo: 52, pase_corto: 70, pase_largo: 62, velocidad: 54, aura: 84 }, look: { skin: "#C68642", hair: "#0E0C0A", style: "short", beard: true } },
      ],
    },
    {
      // Fase de grupos y ÚLTIMO de los 48 (48º): tres derrotas, 1 gol a favor y 12 en contra.
      // El peor registro del Mundial 2026.
      id: "IRQ", name: "Irak", flag: "🇮🇶", iso: "iq", confed: "AFC", playable: true,
      colors: { primary: "#007A3D", secondary: "#CE1126", text: "#ffffff" },
      kits: { field: { shirt: "#FFFFFF", accent: "#007A3D" }, alt: { shirt: "#228A59", accent: "#FFFFFF" }, gk: { shirt: "#C2410C", accent: "#0B0F19" } },
      players: [
        { name: "Ahmed Basil",          pos: "POR", num: 22, stats: { atajadas: 66, reflejos: 67, salidas: 62, pase_corto: 58, pase_largo: 56, velocidad: 47, aura: 60 }, look: { skin: "#C68642", hair: "#0E0C0A", style: "short", beard: false } },
        { name: "Jalal Hassan",         pos: "POR", num: 12, stats: { atajadas: 66, reflejos: 66, salidas: 63, pase_corto: 57, pase_largo: 56, velocidad: 43, aura: 68 }, look: { skin: "#C68642", hair: "#17130F", style: "short", beard: true } },

        { name: "Merchas Doski",        pos: "DEF", num: 23, stats: { tiro: 47, defensa: 68, cabezazo: 59, pase_corto: 67, pase_largo: 63, velocidad: 71, aura: 62 }, look: { skin: "#E0AC69", hair: "#17130F", style: "short", beard: true } },
        { name: "Akam Hashim",          pos: "DEF", num:  5, stats: { tiro: 41, defensa: 67, cabezazo: 67, pase_corto: 59, pase_largo: 55, velocidad: 59, aura: 60 }, look: { skin: "#C68642", hair: "#0E0C0A", style: "buzz", beard: true } },
        { name: "Hussein Ali",          pos: "DEF", num:  3, stats: { tiro: 45, defensa: 65, cabezazo: 57, pase_corto: 65, pase_largo: 60, velocidad: 71, aura: 58 }, look: { skin: "#C68642", hair: "#17130F", style: "short", beard: false } },

        { name: "Amir Al-Ammari",       pos: "MED", num: 16, stats: { tiro: 65, defensa: 67, cabezazo: 55, pase_corto: 71, pase_largo: 67, velocidad: 63, aura: 64 }, look: { skin: "#E0AC69", hair: "#2A1D12", style: "short", beard: true } },
        { name: "Ibrahim Bayesh",       pos: "MED", num:  8, stats: { tiro: 65, defensa: 59, cabezazo: 51, pase_corto: 69, pase_largo: 63, velocidad: 71, aura: 62 }, look: { skin: "#C68642", hair: "#0E0C0A", style: "curly", beard: false } },
        { name: "Zidane Iqbal",         pos: "MED", num: 14, stats: { tiro: 65, defensa: 59, cabezazo: 51, pase_corto: 73, pase_largo: 67, velocidad: 65, aura: 62 }, look: { skin: "#C68642", hair: "#0E0C0A", style: "short", beard: false } },

        { name: "Ali Al-Hamadi",        pos: "DEL", num:  9, stats: { tiro: 71, defensa: 37, cabezazo: 61, pase_corto: 63, pase_largo: 55, velocidad: 71, aura: 64 }, look: { skin: "#C68642", hair: "#17130F", style: "short", beard: true } },
        { name: "Ali Jasim",            pos: "DEL", num: 17, stats: { tiro: 68, defensa: 39, cabezazo: 47, pase_corto: 69, pase_largo: 60, velocidad: 75, aura: 60 }, look: { skin: "#E0AC69", hair: "#0E0C0A", style: "short", beard: false } },
        // 11º jugador — desbloqueable a futuro.
        // Motivo: metió el ÚNICO gol de Irak en el Mundial, pero en 116' y sin titularidad fija.
        // Es el 9 de área pura (33 goles con la selección) que le falta a este ataque de 1 gol en 3.
        // { name: "Aymen Hussein",        pos: "DEL", num: 18, stats: { tiro: 71, defensa: 35, cabezazo: 69, pase_corto: 59, pase_largo: 51, velocidad: 59, aura: 70 }, look: { skin: "#C68642", hair: "#0E0C0A", style: "buzz", beard: true } },
      ],
    },
    {
      // Fase de grupos (44º) en su primer Mundial: tres derrotas, pero 3 goles a favor.
      // El once fue el mismo los tres partidos: casi nadie se movió.
      id: "JOR", name: "Jordania", flag: "🇯🇴", iso: "jo", confed: "AFC", playable: true,
      colors: { primary: "#CE1126", secondary: "#007A3D", text: "#ffffff" },
      kits: { field: { shirt: "#FFFFFF", accent: "#CE1126" }, alt: { shirt: "#FF0000", accent: "#CE1126" }, gk: { shirt: "#0369A1", accent: "#F8FAFC" } },
      players: [
        { name: "Yazeed Abulaila",      pos: "POR", num:  1, stats: { atajadas: 65, reflejos: 66, salidas: 61, pase_corto: 55, pase_largo: 54, velocidad: 42, aura: 68 }, look: { skin: "#C68642", hair: "#0E0C0A", style: "short", beard: true } },
        { name: "Abdallah Al-Fakhouri", pos: "POR", num: 22, stats: { atajadas: 60, reflejos: 61, salidas: 57, pase_corto: 53, pase_largo: 52, velocidad: 40, aura: 58 }, look: { skin: "#C68642", hair: "#17130F", style: "short", beard: false } },

        { name: "Yazan Al-Arab",        pos: "DEF", num:  5, stats: { tiro: 40, defensa: 66, cabezazo: 65, pase_corto: 58, pase_largo: 54, velocidad: 56, aura: 66 }, look: { skin: "#C68642", hair: "#0E0C0A", style: "buzz", beard: true } },
        { name: "Abdallah Nasib",       pos: "DEF", num:  3, stats: { tiro: 38, defensa: 64, cabezazo: 63, pase_corto: 57, pase_largo: 53, velocidad: 58, aura: 62 }, look: { skin: "#C68642", hair: "#17130F", style: "short", beard: true } },
        { name: "Ihsan Haddad",         pos: "DEF", num: 23, stats: { tiro: 46, defensa: 62, cabezazo: 52, pase_corto: 64, pase_largo: 59, velocidad: 68, aura: 64 }, look: { skin: "#E0AC69", hair: "#0E0C0A", style: "short", beard: false } },

        { name: "Noor Al-Rawabdeh",     pos: "MED", num:  8, stats: { tiro: 60, defensa: 65, cabezazo: 52, pase_corto: 68, pase_largo: 63, velocidad: 60, aura: 64 }, look: { skin: "#C68642", hair: "#17130F", style: "buzz", beard: true } },
        { name: "Nizar Al-Rashdan",     pos: "MED", num: 21, stats: { tiro: 64, defensa: 60, cabezazo: 50, pase_corto: 68, pase_largo: 62, velocidad: 62, aura: 64 }, look: { skin: "#C68642", hair: "#0E0C0A", style: "short", beard: false } },
        { name: "Mohannad Abu Taha",    pos: "MED", num: 20, stats: { tiro: 58, defensa: 60, cabezazo: 48, pase_corto: 66, pase_largo: 60, velocidad: 66, aura: 58 }, look: { skin: "#E0AC69", hair: "#17130F", style: "curly", beard: false } },

        { name: "Musa Al-Taamari",      pos: "DEL", num: 10, stats: { tiro: 70, defensa: 36, cabezazo: 42, pase_corto: 72, pase_largo: 62, velocidad: 78, aura: 76 }, look: { skin: "#C68642", hair: "#17130F", style: "short", beard: false } },
        { name: "Ali Olwan",            pos: "DEL", num:  9, stats: { tiro: 69, defensa: 32, cabezazo: 60, pase_corto: 60, pase_largo: 52, velocidad: 66, aura: 70 }, look: { skin: "#C68642", hair: "#0E0C0A", style: "short", beard: true } },
        // 11º jugador — desbloqueable a futuro.
        // Motivo: 180' de central, pero los tres de atrás jugaron prácticamente todo.
        // Es el cuarto central: desbloquearlo habilita la línea de tres sin tocar el mediocampo.
        // { name: "Husam Abu Dahab",      pos: "DEF", num:  4, stats: { tiro: 36, defensa: 63, cabezazo: 62, pase_corto: 56, pase_largo: 52, velocidad: 58, aura: 58 }, look: { skin: "#8D5524", hair: "#0E0C0A", style: "short", beard: false } },
      ],
    },
    {
      // Fase de grupos (46º) en su primer Mundial: tres derrotas y 11 goles en contra.
      // Khusanov, del Manchester City, jugó los 270'.
      id: "UZB", name: "Uzbekistán", flag: "🇺🇿", iso: "uz", confed: "AFC", playable: true,
      colors: { primary: "#0099B5", secondary: "#FFFFFF", text: "#ffffff" },
      kits: { field: { shirt: "#0099B5", accent: "#FFFFFF" }, alt: { shirt: "#FFFFFF", accent: "#0099B5" }, gk: { shirt: "#EA580C", accent: "#0B0F19" } },
      players: [
        { name: "Abduvohid Nematov",    pos: "POR", num: 12, stats: { atajadas: 62, reflejos: 63, salidas: 58, pase_corto: 54, pase_largo: 52, velocidad: 43, aura: 60 }, look: { skin: "#E0AC69", hair: "#17130F", style: "short", beard: false } },
        { name: "Utkir Yusupov",        pos: "POR", num:  1, stats: { atajadas: 61, reflejos: 62, salidas: 58, pase_corto: 53, pase_largo: 52, velocidad: 41, aura: 62 }, look: { skin: "#F1C27D", hair: "#0E0C0A", style: "short", beard: true } },

        { name: "Abdukodir Khusanov",   pos: "DEF", num:  2, stats: { tiro: 35, defensa: 71, cabezazo: 65, pase_corto: 61, pase_largo: 56, velocidad: 77, aura: 68 }, look: { skin: "#E0AC69", hair: "#0E0C0A", style: "buzz", beard: false } },
        { name: "Rustam Ashurmatov",    pos: "DEF", num:  5, stats: { tiro: 35, defensa: 63, cabezazo: 62, pase_corto: 55, pase_largo: 51, velocidad: 55, aura: 60 }, look: { skin: "#F1C27D", hair: "#17130F", style: "short", beard: false } },
        { name: "Sherzod Nasrullaev",   pos: "DEF", num: 13, stats: { tiro: 43, defensa: 60, cabezazo: 49, pase_corto: 61, pase_largo: 56, velocidad: 67, aura: 58 }, look: { skin: "#E0AC69", hair: "#0E0C0A", style: "short", beard: true } },

        { name: "Otabek Shukurov",      pos: "MED", num:  7, stats: { tiro: 59, defensa: 63, cabezazo: 51, pase_corto: 67, pase_largo: 62, velocidad: 55, aura: 64 }, look: { skin: "#F1C27D", hair: "#0E0C0A", style: "short", beard: false } },
        { name: "Abbosbek Fayzullaev",  pos: "MED", num: 22, stats: { tiro: 65, defensa: 51, cabezazo: 45, pase_corto: 71, pase_largo: 63, velocidad: 69, aura: 68 }, look: { skin: "#E0AC69", hair: "#17130F", style: "short", beard: false } },
        { name: "Akmal Mozgovoy",       pos: "MED", num:  6, stats: { tiro: 55, defensa: 61, cabezazo: 49, pase_corto: 64, pase_largo: 59, velocidad: 59, aura: 58 }, look: { skin: "#F1C27D", hair: "#2A1D12", style: "buzz", beard: false } },

        { name: "Eldor Shomurodov",     pos: "DEL", num: 14, stats: { tiro: 71, defensa: 33, cabezazo: 65, pase_corto: 63, pase_largo: 55, velocidad: 69, aura: 76 }, look: { skin: "#E0AC69", hair: "#2A1D12", style: "buzz", beard: true } },
        { name: "Igor Sergeev",         pos: "DEL", num: 21, stats: { tiro: 65, defensa: 31, cabezazo: 59, pase_corto: 57, pase_largo: 49, velocidad: 57, aura: 66 }, look: { skin: "#F1C27D", hair: "#6B4F2A", style: "short", beard: false } },
        // 11º jugador — desbloqueable a futuro.
        // Motivo: 180' de central en dos titularidades, justo detrás de los tres que entraron.
        // Es el tercer central puro: sin él, Uzbekistán no puede cerrarse cuando va perdiendo.
        // { name: "Abdulla Abdullaev",    pos: "DEF", num: 18, stats: { tiro: 33, defensa: 61, cabezazo: 60, pase_corto: 54, pase_largo: 50, velocidad: 56, aura: 56 }, look: { skin: "#E0AC69", hair: "#0E0C0A", style: "curly", beard: false } },
      ],
    },
    // ---------- CONCACAF (agregadas: jugables desde el Mundial 2026) ----------
    {
      // Fase de grupos (42º) en su PRIMER Mundial: la isla más chica que se clasificó nunca.
      // Un empate y dos derrotas, 1-9. El once fue casi el mismo los tres partidos.
      id: "CUW", name: "Curazao", flag: "🇨🇼", iso: "cw", confed: "CONCACAF", playable: true,
      colors: { primary: "#344FC0", secondary: "#F9E814", text: "#ffffff" },
      kits: { field: { shirt: "#344FC0", accent: "#F9E814" }, alt: { shirt: "#FFE45C", accent: "#E5397F" }, gk: { shirt: "#DC2626", accent: "#0B0F19" } },
      players: [
        { name: "Eloy Room",            pos: "POR", num:  1, stats: { atajadas: 60, reflejos: 61, salidas: 56, pase_corto: 51, pase_largo: 49, velocidad: 46, aura: 68 }, look: { skin: "#8D5524", hair: "#0E0C0A", style: "buzz", beard: true } },
        { name: "Tyrick Bodak",         pos: "POR", num: 25, stats: { atajadas: 52, reflejos: 53, salidas: 49, pase_corto: 47, pase_largo: 45, velocidad: 44, aura: 56 }, look: { skin: "#A0663A", hair: "#17130F", style: "short", beard: false } },

        { name: "Armando Obispo",       pos: "DEF", num: 18, stats: { tiro: 31, defensa: 60, cabezazo: 58, pase_corto: 55, pase_largo: 50, velocidad: 55, aura: 60 }, look: { skin: "#8D5524", hair: "#0E0C0A", style: "short", beard: false } },
        { name: "Sherel Floranus",      pos: "DEF", num:  5, stats: { tiro: 37, defensa: 57, cabezazo: 47, pase_corto: 57, pase_largo: 52, velocidad: 65, aura: 58 }, look: { skin: "#A0663A", hair: "#17130F", style: "curly", beard: false } },
        { name: "Deveron Fonville",     pos: "DEF", num: 24, stats: { tiro: 35, defensa: 55, cabezazo: 44, pase_corto: 56, pase_largo: 51, velocidad: 63, aura: 54 }, look: { skin: "#6B4226", hair: "#0E0C0A", style: "buzz", beard: false } },

        { name: "Leandro Bacuna",       pos: "MED", num: 10, stats: { tiro: 59, defensa: 55, cabezazo: 47, pase_corto: 63, pase_largo: 59, velocidad: 51, aura: 70 }, look: { skin: "#8D5524", hair: "#0E0C0A", style: "bald", beard: true } },
        { name: "Tahith Chong",         pos: "MED", num: 21, stats: { tiro: 59, defensa: 47, cabezazo: 41, pase_corto: 65, pase_largo: 58, velocidad: 65, aura: 64 }, look: { skin: "#A0663A", hair: "#0E0C0A", style: "bun", beard: false } },
        { name: "Livano Comenencia",    pos: "MED", num:  8, stats: { tiro: 57, defensa: 53, cabezazo: 43, pase_corto: 62, pase_largo: 56, velocidad: 59, aura: 60 }, look: { skin: "#6B4226", hair: "#17130F", style: "short", beard: false } },

        { name: "Juninho Bacuna",       pos: "DEL", num:  7, stats: { tiro: 61, defensa: 41, cabezazo: 41, pase_corto: 63, pase_largo: 57, velocidad: 63, aura: 66 }, look: { skin: "#8D5524", hair: "#0E0C0A", style: "curly", beard: true } },
        { name: "Jürgen Locadia",       pos: "DEL", num:  9, stats: { tiro: 60, defensa: 27, cabezazo: 55, pase_corto: 53, pase_largo: 45, velocidad: 57, aura: 62 }, look: { skin: "#6B4226", hair: "#0E0C0A", style: "short", beard: true } },
        // 11º jugador — desbloqueable a futuro.
        // Motivo: 180' de lateral derecho puro, justo detrás de los tres que jugaron todo.
        // Es el único que sube por derecha sin dejar el costado abierto: da amplitud gratis.
        // { name: "Joshua Brenet",        pos: "DEF", num: 20, stats: { tiro: 37, defensa: 56, cabezazo: 45, pase_corto: 56, pase_largo: 51, velocidad: 67, aura: 58 }, look: { skin: "#8D5524", hair: "#17130F", style: "buzz", beard: true } },
      ],
    },
    {
      // Fase de grupos (45º) en su segundo Mundial, 52 años después del primero.
      // Tres derrotas, pero solo 8 en contra: el bloque aguantó, el ataque hizo dos.
      id: "HAI", name: "Haití", flag: "🇭🇹", iso: "ht", confed: "CONCACAF", playable: true,
      colors: { primary: "#00209F", secondary: "#D21034", text: "#ffffff" },
      kits: { field: { shirt: "#00209F", accent: "#D21034" }, alt: { shirt: "#FFFFFF", accent: "#D21034" }, gk: { shirt: "#65A30D", accent: "#0B0F19" } },
      players: [
        { name: "Johny Placide",        pos: "POR", num:  1, stats: { atajadas: 65, reflejos: 66, salidas: 61, pase_corto: 53, pase_largo: 52, velocidad: 46, aura: 70 }, look: { skin: "#6B4226", hair: "#0E0C0A", style: "buzz", beard: true } },
        { name: "Alexandre Pierre",     pos: "POR", num: 12, stats: { atajadas: 58, reflejos: 59, salidas: 55, pase_corto: 51, pase_largo: 50, velocidad: 44, aura: 58 }, look: { skin: "#8D5524", hair: "#17130F", style: "short", beard: false } },

        { name: "Ricardo Adé",          pos: "DEF", num:  4, stats: { tiro: 37, defensa: 65, cabezazo: 66, pase_corto: 55, pase_largo: 51, velocidad: 55, aura: 66 }, look: { skin: "#6B4226", hair: "#0E0C0A", style: "bald", beard: true } },
        { name: "Hannes Delcroix",      pos: "DEF", num:  5, stats: { tiro: 35, defensa: 64, cabezazo: 61, pase_corto: 59, pase_largo: 54, velocidad: 61, aura: 60 }, look: { skin: "#A0663A", hair: "#17130F", style: "short", beard: false } },
        { name: "Martin Expérience",    pos: "DEF", num:  8, stats: { tiro: 39, defensa: 61, cabezazo: 51, pase_corto: 59, pase_largo: 54, velocidad: 65, aura: 56 }, look: { skin: "#6B4226", hair: "#0E0C0A", style: "curly", beard: false } },

        { name: "Jean-Ricner Bellegarde", pos: "MED", num: 10, stats: { tiro: 65, defensa: 57, cabezazo: 47, pase_corto: 70, pase_largo: 63, velocidad: 67, aura: 66 }, look: { skin: "#8D5524", hair: "#0E0C0A", style: "short", beard: true } },
        { name: "Danley Jean Jacques", pos: "MED", num: 17, stats: { tiro: 61, defensa: 63, cabezazo: 51, pase_corto: 65, pase_largo: 60, velocidad: 59, aura: 62 }, look: { skin: "#6B4226", hair: "#17130F", style: "buzz", beard: false } },
        { name: "Dominique Simon",      pos: "MED", num: 25, stats: { tiro: 55, defensa: 55, cabezazo: 45, pase_corto: 61, pase_largo: 56, velocidad: 61, aura: 54 }, look: { skin: "#A0663A", hair: "#0E0C0A", style: "short", beard: false } },

        { name: "Ruben Providence",     pos: "DEL", num: 15, stats: { tiro: 64, defensa: 37, cabezazo: 43, pase_corto: 65, pase_largo: 56, velocidad: 75, aura: 62 }, look: { skin: "#6B4226", hair: "#17130F", style: "long", beard: false } },
        { name: "Wilson Isidor",        pos: "DEL", num: 18, stats: { tiro: 66, defensa: 31, cabezazo: 57, pase_corto: 59, pase_largo: 51, velocidad: 69, aura: 62 }, look: { skin: "#8D5524", hair: "#0E0C0A", style: "buzz", beard: true } },
        // 11º jugador — desbloqueable a futuro.
        // Motivo: 34 goles con Haití y ni uno en el Mundial, en 143' repartidos. Isidor le ganó
        // el puesto en el torneo. Desbloquearlo devuelve el 9 de área que este ataque no tuvo.
        // { name: "Frantzdy Pierrot",     pos: "DEL", num: 20, stats: { tiro: 67, defensa: 29, cabezazo: 65, pase_corto: 55, pase_largo: 47, velocidad: 57, aura: 66 }, look: { skin: "#6B4226", hair: "#17130F", style: "short", beard: true } },
      ],
    },
    {
      // Fase de grupos (43º): tres derrotas SIN MARCAR ni un gol. Cristian Martínez metió los
      // tres que aparecen en las estadísticas, todos en el repechaje previo, no en el torneo.
      id: "PAN", name: "Panamá", flag: "🇵🇦", iso: "pa", confed: "CONCACAF", playable: true,
      colors: { primary: "#D21034", secondary: "#005293", text: "#ffffff" },
      kits: { field: { shirt: "#FF0000", accent: "#005293" }, alt: { shirt: "#FFFFFF", accent: "#D21034" }, gk: { shirt: "#7E22CE", accent: "#F8FAFC" } },
      players: [
        { name: "Orlando Mosquera",     pos: "POR", num: 22, stats: { atajadas: 73, reflejos: 74, salidas: 69, pase_corto: 63, pase_largo: 61, velocidad: 48, aura: 68 }, look: { skin: "#8D5524", hair: "#0E0C0A", style: "short", beard: true } },
        { name: "Luis Mejía",           pos: "POR", num:  1, stats: { atajadas: 68, reflejos: 69, salidas: 65, pase_corto: 60, pase_largo: 59, velocidad: 44, aura: 64 }, look: { skin: "#A0663A", hair: "#17130F", style: "short", beard: false } },

        { name: "José Córdoba",         pos: "DEF", num:  3, stats: { tiro: 44, defensa: 74, cabezazo: 73, pase_corto: 65, pase_largo: 61, velocidad: 68, aura: 64 }, look: { skin: "#6B4226", hair: "#0E0C0A", style: "buzz", beard: false } },
        { name: "Andrés Andrade",       pos: "DEF", num: 16, stats: { tiro: 44, defensa: 71, cabezazo: 70, pase_corto: 64, pase_largo: 60, velocidad: 62, aura: 62 }, look: { skin: "#A0663A", hair: "#17130F", style: "short", beard: true } },
        { name: "Michael Amir Murillo", pos: "DEF", num: 23, stats: { tiro: 54, defensa: 70, cabezazo: 58, pase_corto: 70, pase_largo: 65, velocidad: 80, aura: 68 }, look: { skin: "#6B4226", hair: "#0E0C0A", style: "curly", beard: true } },

        { name: "Cristian Martínez",    pos: "MED", num:  6, stats: { tiro: 72, defensa: 64, cabezazo: 54, pase_corto: 74, pase_largo: 68, velocidad: 72, aura: 64 }, look: { skin: "#A0663A", hair: "#0E0C0A", style: "short", beard: false } },
        { name: "Yoel Bárcenas",        pos: "MED", num: 11, stats: { tiro: 70, defensa: 62, cabezazo: 54, pase_corto: 74, pase_largo: 68, velocidad: 68, aura: 68 }, look: { skin: "#8D5524", hair: "#17130F", style: "short", beard: true } },
        { name: "Carlos Harvey",        pos: "MED", num: 14, stats: { tiro: 66, defensa: 70, cabezazo: 58, pase_corto: 71, pase_largo: 66, velocidad: 70, aura: 60 }, look: { skin: "#6B4226", hair: "#0E0C0A", style: "buzz", beard: true } },

        { name: "José Luis Rodríguez",  pos: "DEL", num:  7, stats: { tiro: 70, defensa: 46, cabezazo: 50, pase_corto: 73, pase_largo: 65, velocidad: 82, aura: 64 }, look: { skin: "#A0663A", hair: "#17130F", style: "bun", beard: false } },
        { name: "José Fajardo",         pos: "DEL", num: 17, stats: { tiro: 72, defensa: 38, cabezazo: 66, pase_corto: 64, pase_largo: 56, velocidad: 68, aura: 64 }, look: { skin: "#8D5524", hair: "#0E0C0A", style: "short", beard: true } },
        // 11º jugador — desbloqueable a futuro.
        // Motivo: 17 goles con Panamá y 154' en el torneo sin ser titular fijo; Fajardo y el
        // Puma Rodríguez se llevaron el ataque. Es el 9 de referencia para jugar con dos puntas.
        // { name: "Cecilio Waterman",     pos: "DEL", num: 18, stats: { tiro: 71, defensa: 36, cabezazo: 64, pase_corto: 62, pase_largo: 55, velocidad: 70, aura: 66 }, look: { skin: "#6B4226", hair: "#17130F", style: "buzz", beard: true } },
      ],
    },





    // ╔══════════════════════════════════════════════════════════════════╗
    // ║ 2. NO CLASIFICADOS (4) — fuera del sorteo, para futuras features ║
    // ║    (qualified: false) — orden confederación y alfabético         ║
    // ╚══════════════════════════════════════════════════════════════════╝
    // Son los ÚNICOS que quedan con el esquema de rival (rating + kit + figures):
    // las 48 clasificadas pasaron a jugables con plantel completo.

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
