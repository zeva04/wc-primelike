# Algeria (ALG) — Mundial 2026

> Investigación cruda para `data/teams.js`. **Auditable**: todo sale de las fuentes
> listadas al pie; nada acá está inventado. Lo que no se pudo confirmar va marcado
> `TODO: verificar`.

## Resultado en el torneo

- **Puesto final:** 30º de 48 — Eliminado en 16avos de final
- **Récord:** 1G 1E 2P · 5 goles a favor / 9 en contra
- **Grupo:** J

## Algeria — 4 partidos con alineación extraída

**Kits usados en el torneo (hex del reporte de FIFA):**
- #FFFFFF arm:#FFFFFF short:#FFFFFF medias:#F3F3F3 (alg26hA) — 3 partido(s)
- #1b4531 arm:#1b4531 short:#FFFFFF medias:#005441 (alg26aA) — 1 partido(s)

| # | Pos | Rol | Jugador | Tit | Sup | Min | G⚽ | Caps | GolSel | Club |
|---|-----|-----|---------|-----|-----|-----|----|------|--------|------|
| 2 | DEF | CB | Aïssa Mandi | 4 | 0 | 360 | 0 | 119 | 8 | Lille OSC |
| 21 | DEF | CB | Ramy Bensebaini | 4 | 0 | 360 | 0 | 82 | 9 | Borussia Dortmund |
| 10 | MED | LF | Farès Chaïbi | 4 | 0 | 360 | 0 | 31 | 3 | Eintracht Frankfurt |
| 22 | MED | AM | Ibrahim Maza | 4 | 0 | 352 | 0 | 17 | 2 | Bayer 04 Leverkusen |
| 17 | DEF | RB | Rafik Belghali | 4 | 0 | 333 | 1 | 13 | 1 | Hellas Verona FC |
| 19 | MED | CM | Nabil Bentaleb | 3 | 1 | 288 | 0 | 60 | 6 | Lille OSC |
| 15 | DEF | LB | Rayan Aït-Nouri | 3 | 1 | 284 | 0 | 30 | 0 | Manchester City F.C. |
| 23 | POR | GK | Luca Zidane | 3 | 0 | 270 | 0 | 7 | 0 | Granada CF |
| 7 | DEL | RF | Riyad Mahrez | 3 | 1 | 263 | 2 | 116 | 38 | Al-Ahli Saudi FC |
| 9 | DEL | CF | Amine Gouiri | 3 | 1 | 253 | 1 | 23 | 10 | Olympique de Marseille |
| 8 | MED | MF | Houssem Aouar | 2 | 1 | 174 | 0 | 22 | 6 | Al-Ittihad Club (Jeddah) |
| 14 | MED | CM | Hicham Boudaoui | 2 | 1 | 128 | 0 | 34 | 0 | OGC Nice |
| 6 | MED | CM | Ramiz Zerrouki | 2 | 1 | 111 | 0 | 53 | 3 | FC Twente |
| 13 | DEF | DF | Jaouen Hadjam | 1 | 2 | 108 | 0 | 18 | 3 | BSC Young Boys |
| 11 | DEL | FW | Anis Hadj Moussa | 1 | 2 | 97 | 0 | 15 | 2 | Feyenoord |
| 16 | POR | GK | Oussama Benbot | 1 | 0 | 90 | 0 | 5 | 0 | USM Alger |
| 12 | DEL | FW | Nadhir Benbouali | 0 | 1 | 45 | 1 | 4 | 1 | Győri ETO FC |
| 18 | DEL | FW | Mohamed Amoura | 0 | 1 | 26 | 0 | 47 | 19 | VfL Wolfsburg |
| 5 | DEF | DF | Zineddine Belaïd | 0 | 2 | 23 | 0 | 18 | 1 | JS Kabylie |
| 26 | DEF | DF | Samir Chergui | 0 | 1 | 19 | 0 | 5 | 0 | Paris FC |
| 20 | DEL | FW | Adil Boulbina | 0 | 2 | 16 | 0 | 12 | 6 | Al Duhail SC |
| 25 | DEL | FW | Farès Ghedjemis | 0 | 1 | 0 | 0 | 1 | 1 | Frosinone Calcio |

**Convocados sin minutos:** 1 Melvin Mastil (POR, 2 caps) · 3 Achref Abada (DEF, 9 caps) · 4 Mohamed Amine Tougai (DEF, 30 caps) · 24 Yacine Titraoui (MED, 5 caps)

## Fuentes

- Nómina y dorsales: [2026 FIFA World Cup squads](https://en.wikipedia.org/wiki/2026_FIFA_World_Cup_squads) (wikitext crudo vía API de MediaWiki)
- Alineaciones, minutos, cambios y colores de camiseta: artículos de fase de grupos
  y eliminatorias del Mundial 2026 en Wikipedia, que transcriben los
  *Tactical Line-up* PDF oficiales de FIFA
  (`fdp.fifa.org/assetspublic/…/TacticalLineup-English.pdf`)
- Goleadores: [2026 FIFA World Cup § Goalscorers](https://en.wikipedia.org/wiki/2026_FIFA_World_Cup#Goalscorers),
  citando [FIFA Player Statistics](https://www.fifa.com/en/tournaments/mens/worldcup/canadamexicousa2026/statistics/player-statistics)
- Tabla final: [FIFA — Competition summary (PDF)](https://fdp.fifa.org/assetspublic/ce281/pdf/CompetitionSummary-English.pdf)

## Notas de método

- **Minutos**: calculados a partir de titularidad y minuto de cambio de cada partido
  (titular sin cambio = 90; con prórroga = 120). Son minutos *reconstruidos*, no el
  dato oficial de FIFA: sirven para rankear relevancia, no como estadística exacta.
- **Goles**: de la lista oficial de goleadores. Los autogoles NO se cuentan al jugador.
- **Kit de arquero**: los reportes de FIFA solo publican el kit de jugador de campo.
  Ver la sección de kit para cómo se resolvió.
## Decisiones tomadas

### Calibración

- **Ancla:** 74 (el `rating` que tenía como rival antes de la conversión).
- **Resultado:** `teamRating` = **74** → Δ+0, dentro de la banda ±3 acordada con el PO.
- Vara: nivel de club a jun-2026 (la misma que los 23 planteles que ya estaban), con el
  rendimiento del Mundial usado como modificador **dentro** del equipo — decide quién entra
  al 10 y quién queda de 11º, no infla la selección entera.

Notas (`naturalOverall`, sin momento y en su puesto):

- 76 — Riyad Mahrez (DEL, #7)
- 74 — Amine Gouiri (DEL, #9)
- 73 — Aïssa Mandi (DEF, #2)
- 73 — Ramy Bensebaini (DEF, #21)
- 73 — Farès Chaïbi (MED, #10)
- 73 — Ibrahim Maza (MED, #22)
- 71 — Luca Zidane (POR, #23)
- 70 — Nabil Bentaleb (MED, #19)
- 68 — Rafik Belghali (DEF, #17)
- 65 — Oussama Benbot (POR, #16)

### Kit

- **Campo:** `shirt: #FFFFFF` · `accent: #006233`.
  Hex exacto del torneo: vistió **blanco** en 3 de 4 partidos (`alg26hA`), con el verde argelino de acento. El alternativo real era verde oscuro `1b4531`.
- **Alternativa:** `shirt: #1B4531` · `accent: #FFFFFF`.
  Hex del kit alternativo que FIFA registró en el torneo.
  El motor la pone sola cuando la titular se confunde con la del rival
  (`ui/sprites.fieldKitVs`, umbral `CLASH_DIST` = 60 de distancia RGB). Se cambia
  siempre el rival, nunca la selección del jugador.
- **Arquero:** `shirt: #0EA5E9` · `accent: #0B0F19`.
  `TODO: verificar` — **decisión de diseño, no un dato**. FIFA solo publica el kit del
  jugador de campo en los reportes tácticos, y las camisetas de arquero 2026 no están
  documentadas en fuente abierta para esta selección. El color se eligió por contraste
  contra su propio kit de campo y contra los que ya había en el juego.
- El esquema del repo guarda dos colores por kit (`shirt` + `accent`); el short y las
  medias que sí están en el dato de FIFA quedan arriba, en la sección de kits, pero no
  entran al código porque no hay campo donde ponerlos.

### Qué NO se pudo confirmar

- Minutos oficiales de FIFA por jugador (los de este archivo están reconstruidos).
- Asistencias por jugador: la lista oficial de FIFA que cita Wikipedia solo desglosa
  goles; las asistencias figuran únicamente para los premios individuales.
- Kit de arquero (ver arriba).
