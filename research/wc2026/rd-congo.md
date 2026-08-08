# DR Congo (COD) — Mundial 2026

> Investigación cruda para `data/teams.js`. **Auditable**: todo sale de las fuentes
> listadas al pie; nada acá está inventado. Lo que no se pudo confirmar va marcado
> `TODO: verificar`.

## Resultado en el torneo

- **Puesto final:** 23º de 48 — Eliminado en 16avos de final
- **Récord:** 1G 1E 2P · 5 goles a favor / 5 en contra
- **Grupo:** K

## DR Congo — 4 partidos con alineación extraída

**Kits usados en el torneo (hex del reporte de FIFA):**
- #00b7ef arm:#00b7ef short:#00b7ef medias:#00b7ef (cod2526h) — 3 partido(s)
- #FF0000 arm:#FF0000 short:#FF0000 medias:#FF0000 (cod2526t) — 1 partido(s)

| # | Pos | Rol | Jugador | Tit | Sup | Min | G⚽ | Caps | GolSel | Club |
|---|-----|-----|---------|-----|-----|-----|----|------|--------|------|
| 1 | POR | GK | Lionel Mpasi | 4 | 0 | 360 | 0 | 29 | 0 | Le Havre AC |
| 22 | DEF | CB | Chancel Mbemba | 4 | 0 | 360 | 0 | 109 | 7 | Lille OSC |
| 4 | DEF | CB | Axel Tuanzebe | 4 | 0 | 360 | 0 | 14 | 1 | Burnley F.C. |
| 20 | DEL | CF | Yoane Wissa | 4 | 0 | 360 | 3 | 38 | 9 | Newcastle United F.C. |
| 2 | DEF | RWB | Aaron Wan-Bissaka | 4 | 0 | 355 | 0 | 12 | 0 | West Ham United F.C. |
| 8 | MED | CM | Samuel Moutoussamy | 4 | 0 | 333 | 0 | 58 | 0 | Atromitos F.C. |
| 26 | DEF | LWB | Arthur Masuaku | 4 | 0 | 317 | 0 | 45 | 4 | RC Lens |
| 14 | MED | MF | Noah Sadiki | 2 | 2 | 257 | 0 | 20 | 0 | Sunderland A.F.C. |
| 6 | MED | CM | Ngal'ayel Mukau | 3 | 1 | 197 | 0 | 14 | 0 | Lille OSC |
| 17 | DEL | CF | Cédric Bakambu | 3 | 0 | 193 | 0 | 70 | 21 | Real Betis |
| 3 | DEF | CB | Steve Kapuadi | 2 | 0 | 180 | 0 | 4 | 0 | Widzew Łódź |
| 25 | MED | CM | Edo Kayembe | 2 | 1 | 159 | 0 | 43 | 2 | Watford F.C. |
| 9 | DEL | RM | Brian Cipenga | 2 | 0 | 148 | 1 | 8 | 0 | CD Castellón |
| 7 | MED | MF | Nathanaël Mbuku | 2 | 1 | 144 | 0 | 19 | 2 | Montpellier HSC |
| 13 | DEL | FW | Meschak Elia | 0 | 2 | 44 | 0 | 69 | 12 | Alanyaspor |
| 12 | DEF | DF | Joris Kayembe | 0 | 4 | 43 | 0 | 26 | 1 | KRC Genk |
| 19 | DEL | FW | Fiston Mayele | 0 | 2 | 40 | 1 | 37 | 6 | Pyramids FC |
| 23 | DEL | FW | Simon Banza | 0 | 2 | 38 | 0 | 15 | 2 | Al Jazira Club |
| 18 | MED | MF | Charles Pickel | 0 | 2 | 35 | 0 | 34 | 1 | RCD Espanyol |
| 10 | MED | MF | Théo Bongonda | 0 | 2 | 32 | 0 | 38 | 7 | FC Spartak Moscow |
| 24 | DEF | DF | Gédéon Kalulu | 0 | 1 | 5 | 0 | 28 | 0 | Aris Limassol FC |

**Convocados sin minutos:** 5 Dylan Batubinsika (DEF, 14 caps) · 11 Gaël Kakuta (DEL, 31 caps) · 15 Aaron Tshibola (MED, 17 caps) · 16 Timothy Fayulu (POR, 3 caps) · 21 Matthieu Epolo (POR, 1 caps)

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

- **Ancla:** 69 (el `rating` que tenía como rival antes de la conversión).
- **Resultado:** `teamRating` = **70** → Δ+1, dentro de la banda ±3 acordada con el PO.
- Vara: nivel de club a jun-2026 (la misma que los 23 planteles que ya estaban), con el
  rendimiento del Mundial usado como modificador **dentro** del equipo — decide quién entra
  al 10 y quién queda de 11º, no infla la selección entera.

Notas (`naturalOverall`, sin momento y en su puesto):

- 74 — Yoane Wissa (DEL, #20)
- 72 — Chancel Mbemba (DEF, #22)
- 69 — Noah Sadiki (MED, #14)
- 68 — Aaron Wan-Bissaka (DEF, #2)
- 67 — Lionel Mpasi (POR, #1)
- 67 — Samuel Moutoussamy (MED, #8)
- 67 — Ngal'ayel Mukau (MED, #6)
- 67 — Cédric Bakambu (DEL, #17)
- 66 — Axel Tuanzebe (DEF, #4)
- 62 — Timothy Fayulu (POR, #16)

### Kit

- **Campo:** `shirt: #00B7EF` · `accent: #F7D618`.
  Hex exacto del torneo: celeste `00b7ef` en 3 de 4 partidos. Es el kit más distintivo de toda la tanda — no choca con ninguno del juego.
- **Alternativa:** `shirt: #FF0000` · `accent: #F7D618`.
  Hex del kit alternativo que FIFA registró en el torneo.
  El motor la pone sola cuando la titular se confunde con la del rival
  (`ui/sprites.fieldKitVs`, umbral `CLASH_DIST` = 60 de distancia RGB). Se cambia
  siempre el rival, nunca la selección del jugador.
- **Arquero:** `shirt: #B91C1C` · `accent: #F8FAFC`.
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
