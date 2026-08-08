# Curaçao (CUW) — Mundial 2026

> Investigación cruda para `data/teams.js`. **Auditable**: todo sale de las fuentes
> listadas al pie; nada acá está inventado. Lo que no se pudo confirmar va marcado
> `TODO: verificar`.

## Resultado en el torneo

- **Puesto final:** 42º de 48 — Eliminado en fase de grupos
- **Récord:** 0G 1E 2P · 1 goles a favor / 9 en contra
- **Grupo:** E

## Curaçao — 3 partidos con alineación extraída

**Kits usados en el torneo (hex del reporte de FIFA):**
- #344fc0 arm:#344fc0 short:#344fc0 medias:#344fc0 (cur26hA) — 2 partido(s)
- #344fc0 arm:#344fc0 short:#FFFF00 medias:#344fc0 (cur26hA) — 1 partido(s)

| # | Pos | Rol | Jugador | Tit | Sup | Min | G⚽ | Caps | GolSel | Club |
|---|-----|-----|---------|-----|-----|-----|----|------|--------|------|
| 1 | POR | GK | Eloy Room | 3 | 0 | 270 | 0 | 71 | 0 | Miami FC |
| 5 | DEF | RB | Sherel Floranus | 3 | 0 | 270 | 0 | 28 | 0 | PEC Zwolle |
| 18 | DEF | CB | Armando Obispo | 3 | 0 | 270 | 0 | 6 | 0 | PSV Eindhoven |
| 10 | MED | CM | Leandro Bacuna | 3 | 0 | 270 | 0 | 72 | 16 | Iğdır F.K. |
| 7 | MED | LF | Juninho Bacuna | 3 | 0 | 255 | 0 | 49 | 15 | FC Volendam |
| 21 | MED | CM | Tahith Chong | 3 | 0 | 247 | 0 | 6 | 3 | Sheffield United F.C. |
| 24 | DEF | LB | Deveron Fonville | 3 | 0 | 242 | 0 | 2 | 0 | NEC Nijmegen |
| 9 | DEL | CF | Jürgen Locadia | 3 | 0 | 238 | 0 | 13 | 1 | Miami FC |
| 8 | MED | CM | Livano Comenencia | 3 | 0 | 234 | 1 | 20 | 2 | FC Zürich |
| 20 | DEF | RWB | Joshua Brenet | 2 | 0 | 180 | 0 | 18 | 2 | Kayserispor |
| 3 | DEF | CB | Juriën Gaari | 2 | 0 | 167 | 0 | 60 | 1 | Abha Club |
| 23 | DEF | CB | Riechedly Bazoer | 1 | 0 | 90 | 0 | 5 | 0 | Konyaspor |
| 11 | DEL | FW | Jeremy Antonisse | 0 | 2 | 73 | 0 | 27 | 4 | A.E. Kifisia F.C. |
| 12 | DEL | RF | Sontje Hansen | 1 | 0 | 46 | 0 | 6 | 1 | Middlesbrough F.C. |
| 16 | DEL | FW | Jearl Margaritha | 0 | 2 | 40 | 0 | 22 | 5 | SK Beveren |
| 19 | DEL | FW | Gervane Kastaneer | 0 | 3 | 28 | 0 | 29 | 9 | Terengganu FC |
| 4 | DEF | DF | Roshon van Eijma | 0 | 1 | 15 | 0 | 28 | 1 | RKC Waalwijk |
| 14 | DEL | FW | Kenji Gorré | 0 | 1 | 15 | 0 | 38 | 6 | Maccabi Haifa F.C. |
| 13 | DEL | MF | Tyrese Noslin | 0 | 1 | 13 | 0 | 7 | 1 | SC Telstar |
| 6 | MED | MF | Godfried Roemeratoe | 0 | 1 | 7 | 0 | 28 | 1 | RKC Waalwijk |
| 2 | DEF | DF | Shurandy Sambo | 0 | 1 | 0 | 0 | 8 | 0 | Sparta Rotterdam |
| 17 | DEL | FW | Brandley Kuwas | 0 | 1 | 0 | 0 | 35 | 2 | FC Volendam |

**Convocados sin minutos:** 15 Ar'jany Martha (MED, 9 caps) · 22 Kevin Felida (MED, 19 caps) · 25 Tyrick Bodak (POR, 4 caps) · 26 Trevor Doornbusch (POR, 8 caps)

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

- **Ancla:** 56 (el `rating` que tenía como rival antes de la conversión).
- **Resultado:** `teamRating` = **59** → Δ+3, dentro de la banda ±3 acordada con el PO.
- Vara: nivel de club a jun-2026 (la misma que los 23 planteles que ya estaban), con el
  rendimiento del Mundial usado como modificador **dentro** del equipo — decide quién entra
  al 10 y quién queda de 11º, no infla la selección entera.

Notas (`naturalOverall`, sin momento y en su puesto):

- 60 — Tahith Chong (MED, #21)
- 59 — Eloy Room (POR, #1)
- 59 — Leandro Bacuna (MED, #10)
- 59 — Juninho Bacuna (DEL, #7)
- 58 — Armando Obispo (DEF, #18)
- 58 — Livano Comenencia (MED, #8)
- 58 — Jürgen Locadia (DEL, #9)
- 56 — Sherel Floranus (DEF, #5)
- 54 — Deveron Fonville (DEF, #24)
- 51 — Tyrick Bodak (POR, #25)

### Kit

- **Campo:** `shirt: #344FC0` · `accent: #F9E814`.
  Titular: hex exacto del torneo, azul `344FC0` (los 3 partidos). Alternativo `TODO: verificar` — no se pudo extraer ninguno de FIFA; el hex sale de la descripción oficial del kit (base amarillo pastel con franjas rosa, turquesa y naranja, homenaje a Willemstad) más el amarillo `FFFF00` que FIFA sí registró en su short. El hex EXACTO no está confirmado.
- **Alternativa:** `shirt: #FFE45C` · `accent: #E5397F`.
  Hex del kit alternativo que FIFA registró en el torneo.
  El motor la pone sola cuando la titular se confunde con la del rival
  (`ui/sprites.fieldKitVs`, umbral `CLASH_DIST` = 60 de distancia RGB). Se cambia
  siempre el rival, nunca la selección del jugador.
- **Arquero:** `shirt: #DC2626` · `accent: #0B0F19`.
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
