# Ghana (GHA) — Mundial 2026

> Investigación cruda para `data/teams.js`. **Auditable**: todo sale de las fuentes
> listadas al pie; nada acá está inventado. Lo que no se pudo confirmar va marcado
> `TODO: verificar`.

## Resultado en el torneo

- **Puesto final:** 24º de 48 — Eliminado en 16avos de final
- **Récord:** 1G 1E 2P · 2 goles a favor / 3 en contra
- **Grupo:** L

## Ghana — 4 partidos con alineación extraída

**Kits usados en el torneo (hex del reporte de FIFA):**
- #f8cd5c arm:#f8cd5c short:#f8cd5c medias:#f8cd5c (gha26a) — 2 partido(s)

| # | Pos | Rol | Jugador | Tit | Sup | Min | G⚽ | Caps | GolSel | Club |
|---|-----|-----|---------|-----|-----|-----|----|------|--------|------|
| 14 | DEF | LB | Gideon Mensah | 4 | 0 | 360 | 0 | 40 | 0 | AJ Auxerre |
| 11 | MED | LF | Antoine Semenyo | 4 | 0 | 360 | 0 | 34 | 3 | Manchester City F.C. |
| 9 | DEL | CF | Jordan Ayew | 4 | 0 | 303 | 0 | 120 | 34 | Leicester City F.C. |
| 26 | DEF | RB | Marvin Senaya | 4 | 0 | 280 | 0 | 2 | 0 | AJ Auxerre |
| 18 | DEF | CB | Jerome Opoku | 3 | 0 | 270 | 0 | 11 | 1 | İstanbul Başakşehir F.K. |
| 5 | MED | DM | Thomas Partey | 3 | 0 | 270 | 0 | 57 | 15 | Villarreal CF |
| 3 | MED | CM | Caleb Yirenkyi | 3 | 1 | 264 | 1 | 11 | 1 | FC Nordsjælland |
| 8 | MED | CM | Kwasi Sibo | 3 | 1 | 249 | 0 | 8 | 0 | Real Oviedo |
| 4 | DEF | CB | Jonas Adjetey | 3 | 0 | 226 | 0 | 10 | 0 | VfL Wolfsburg |
| 16 | POR | GK | Benjamin Asare | 2 | 1 | 224 | 0 | 11 | 0 | Accra Hearts of Oak S.C. |
| 23 | DEF | CB | Derrick Luckassen | 2 | 0 | 180 | 1 | 1 | 0 | Pafos FC |
| 15 | MED | DM | Elisha Owusu | 2 | 1 | 152 | 0 | 20 | 0 | AJ Auxerre |
| 1 | POR | GK | Lawrence Ati-Zigi | 2 | 0 | 136 | 0 | 29 | 0 | FC St. Gallen |
| 22 | DEL | CM | Kamaldeen Sulemana | 2 | 0 | 129 | 0 | 28 | 1 | Atalanta BC |
| 7 | DEL | MF | Abdul Fatawu | 0 | 4 | 128 | 0 | 28 | 3 | Leicester City F.C. |
| 19 | DEL | RM | Iñaki Williams | 2 | 0 | 128 | 0 | 26 | 2 | Athletic Bilbao |
| 24 | DEL | FW | Ernest Nuamah | 1 | 2 | 88 | 0 | 18 | 4 | Olympique Lyonnais |
| 2 | DEF | DF | Alidu Seidu | 0 | 1 | 77 | 0 | 24 | 1 | Stade Rennais FC |
| 10 | DEL | FW | Brandon Thomas-Asante | 0 | 2 | 51 | 0 | 8 | 1 | Coventry City F.C. |
| 21 | DEF | DF | Kojo Peprah Oppong | 0 | 2 | 47 | 0 | 4 | 0 | OGC Nice |
| 25 | DEL | FW | Prince Kwabena Adu | 0 | 2 | 27 | 0 | 5 | 0 | FC Viktoria Plzeň |
| 25 | DEL | FW | Prince Adu | 0 | 1 | 11 | 0 | 5 | 0 | FC Viktoria Plzeň |
| 17 | DEF | DF | Abdul Rahman Baba | 0 | 1 | 0 | 0 | 51 | 1 | PAOK FC |

**Convocados sin minutos:** 6 Abdul Mumin (DEF, 5 caps) · 12 Joseph Anang (POR, 1 caps) · 13 Christopher Bonsu Baah (DEL, 9 caps) · 20 Augustine Boakye (MED, 0 caps)

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

- **Ancla:** 73 (el `rating` que tenía como rival antes de la conversión).
- **Resultado:** `teamRating` = **72** → Δ-1, dentro de la banda ±3 acordada con el PO.
- Vara: nivel de club a jun-2026 (la misma que los 23 planteles que ya estaban), con el
  rendimiento del Mundial usado como modificador **dentro** del equipo — decide quién entra
  al 10 y quién queda de 11º, no infla la selección entera.

Notas (`naturalOverall`, sin momento y en su puesto):

- 74 — Antoine Semenyo (MED, #11)
- 73 — Thomas Partey (MED, #5)
- 73 — Iñaki Williams (DEL, #19)
- 71 — Jordan Ayew (DEL, #9)
- 68 — Benjamin Asare (POR, #16)
- 68 — Gideon Mensah (DEF, #14)
- 68 — Jerome Opoku (DEF, #18)
- 68 — Caleb Yirenkyi (MED, #3)
- 66 — Lawrence Ati-Zigi (POR, #1)
- 66 — Marvin Senaya (DEF, #26)

### Kit

- **Campo:** `shirt: #FFFFFF` · `accent: #CE1126`.
  `TODO: verificar` — de los 4 partidos solo se pudieron extraer 2, y en los dos vistió el kit ALTERNATIVO dorado (`gha26a`, `f8cd5c`). Como poner un alternativo en `kits.field` sería incorrecto, se usó el blanco tradicional de Ghana con acento rojo (el que ya tenía en el repo como rival).
- **Alternativa:** `shirt: #F8CD5C` · `accent: #CE1126`.
  Hex del kit alternativo que FIFA registró en el torneo.
  El motor la pone sola cuando la titular se confunde con la del rival
  (`ui/sprites.fieldKitVs`, umbral `CLASH_DIST` = 60 de distancia RGB). Se cambia
  siempre el rival, nunca la selección del jugador.
- **Arquero:** `shirt: #BE185D` · `accent: #0B0F19`.
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
