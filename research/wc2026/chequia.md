# Czech Republic (CZE) — Mundial 2026

> Investigación cruda para `data/teams.js`. **Auditable**: todo sale de las fuentes
> listadas al pie; nada acá está inventado. Lo que no se pudo confirmar va marcado
> `TODO: verificar`.

## Resultado en el torneo

- **Puesto final:** 39º de 48 — Eliminado en fase de grupos
- **Récord:** 0G 1E 2P · 2 goles a favor / 6 en contra
- **Grupo:** A

## Czech Republic — 3 partidos con alineación extraída

**Kits usados en el torneo (hex del reporte de FIFA):**
- #F6090F arm:#F6090F short:#0000EC medias:#000000 (cze26h) — 2 partido(s)
- #e9e9e9 arm:#e9e9e9 short:#FFFFFF medias:#FFFFFF (cze26a) — 1 partido(s)

| # | Pos | Rol | Jugador | Tit | Sup | Min | G⚽ | Caps | GolSel | Club |
|---|-----|-----|---------|-----|-----|-----|----|------|--------|------|
| 1 | POR | GK | Matěj Kovář | 3 | 0 | 270 | 0 | 20 | 0 | PSV Eindhoven |
| 4 | DEF | CB | Robin Hranáč | 3 | 0 | 270 | 0 | 14 | 1 | TSG 1899 Hoffenheim |
| 7 | DEF | CB | Ladislav Krejčí | 3 | 0 | 270 | 1 | 27 | 5 | Wolverhampton Wanderers F.C. |
| 5 | DEF | RWB | Vladimír Coufal | 3 | 0 | 270 | 0 | 62 | 2 | TSG 1899 Hoffenheim |
| 15 | DEL | LF | Pavel Šulc | 2 | 1 | 188 | 0 | 21 | 5 | Olympique Lyonnais |
| 18 | MED | CM | Michal Sadílek | 2 | 1 | 184 | 1 | 35 | 1 | SK Slavia Prague |
| 10 | DEL | CF | Patrik Schick | 2 | 1 | 179 | 0 | 53 | 26 | Bayer 04 Leverkusen |
| 12 | MED | CM | Lukáš Červ | 2 | 0 | 165 | 0 | 17 | 2 | FC Viktoria Plzeň |
| 9 | DEL | CF | Adam Hložek | 2 | 1 | 158 | 0 | 43 | 5 | TSG 1899 Hoffenheim |
| 3 | DEF | CB | Tomáš Holeš | 2 | 0 | 154 | 0 | 41 | 2 | SK Slavia Prague |
| 24 | MED | RF | Alexandr Sojka | 2 | 1 | 142 | 0 | 2 | 0 | FC Viktoria Plzeň |
| 22 | MED | MF | Tomáš Souček | 1 | 2 | 139 | 0 | 90 | 17 | West Ham United F.C. |
| 20 | DEF | LWB | Jaroslav Zelený | 1 | 1 | 125 | 0 | 23 | 0 | AC Sparta Prague |
| 17 | MED | MF | Lukáš Provod | 1 | 2 | 120 | 0 | 38 | 3 | SK Slavia Prague |
| 6 | DEF | CB | Štěpán Chaloupek | 1 | 0 | 90 | 0 | 5 | 0 | SK Slavia Prague |
| 21 | DEF | LWB | David Douděra | 1 | 0 | 90 | 0 | 17 | 2 | SK Slavia Prague |
| 26 | DEL | RF | Denis Višinský | 1 | 0 | 56 | 0 | 2 | 1 | FC Viktoria Plzeň |
| 8 | MED | CM | Vladimír Darida | 1 | 0 | 55 | 0 | 79 | 8 | FC Hradec Králové |
| 19 | DEL | FW | Tomáš Chorý | 0 | 2 | 30 | 0 | 22 | 7 | SK Slavia Prague |
| 2 | DEF | DF | David Zima | 0 | 1 | 12 | 0 | 25 | 1 | SK Slavia Prague |
| 13 | DEL | FW | Mojmír Chytil | 0 | 1 | 6 | 0 | 22 | 6 | SK Slavia Prague |

**Convocados sin minutos:** 11 Jan Kuchta (DEL, 31 caps) · 14 David Jurásek (DEF, 18 caps) · 16 Jindřich Staněk (POR, 14 caps) · 23 Lukáš Horníček (POR, 1 caps) · 25 Hugo Sochůrek (MED, 1 caps)

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

- **Ancla:** 77 (el `rating` que tenía como rival antes de la conversión).
- **Resultado:** `teamRating` = **76** → Δ-1, dentro de la banda ±3 acordada con el PO.
- Vara: nivel de club a jun-2026 (la misma que los 23 planteles que ya estaban), con el
  rendimiento del Mundial usado como modificador **dentro** del equipo — decide quién entra
  al 10 y quién queda de 11º, no infla la selección entera.

Notas (`naturalOverall`, sin momento y en su puesto):

- 80 — Patrik Schick (DEL, #10)
- 77 — Ladislav Krejčí (DEF, #7)
- 76 — Matěj Kovář (POR, #1)
- 75 — Pavel Šulc (DEL, #15)
- 73 — Robin Hranáč (DEF, #4)
- 73 — Michal Sadílek (MED, #18)
- 72 — Vladimír Coufal (DEF, #5)
- 72 — Tomáš Souček (MED, #22)
- 72 — Lukáš Červ (MED, #12)
- 71 — Jindřich Staněk (POR, #16)

### Kit

- **Campo:** `shirt: #F6090F` · `accent: #0000EC`.
  Hex exacto del torneo: rojo `F6090F` con short azul `0000EC`.
- **Alternativa:** `shirt: #E9E9E9` · `accent: #0000EC`.
  Hex del kit alternativo que FIFA registró en el torneo.
  El motor la pone sola cuando la titular se confunde con la del rival
  (`ui/sprites.fieldKitVs`, umbral `CLASH_DIST` = 60 de distancia RGB). Se cambia
  siempre el rival, nunca la selección del jugador.
- **Arquero:** `shirt: #FB923C` · `accent: #0B0F19`.
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
