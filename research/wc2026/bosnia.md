# Bosnia and Herzegovina (BIH) — Mundial 2026

> Investigación cruda para `data/teams.js`. **Auditable**: todo sale de las fuentes
> listadas al pie; nada acá está inventado. Lo que no se pudo confirmar va marcado
> `TODO: verificar`.

## Resultado en el torneo

- **Puesto final:** 29º de 48 — Eliminado en 16avos de final
- **Récord:** 1G 1E 2P · 5 goles a favor / 8 en contra
- **Grupo:** B

## Bosnia and Herzegovina — 4 partidos con alineación extraída

**Kits usados en el torneo (hex del reporte de FIFA):**
- #FFFFFF arm:#FFFFFF short:#FFFFFF medias:#FFFFFF (bih26a) — 2 partido(s)
- #001970 arm:#001970 short:#001970 medias:#001970 (bih26h) — 1 partido(s)

| # | Pos | Rol | Jugador | Tit | Sup | Min | G⚽ | Caps | GolSel | Club |
|---|-----|-----|---------|-----|-----|-----|----|------|--------|------|
| 1 | POR | GK | Nikola Vasilj | 4 | 0 | 360 | 0 | 26 | 0 | FC St. Pauli |
| 10 | DEL | CF | Ermedin Demirović | 4 | 0 | 355 | 0 | 40 | 4 | VfB Stuttgart |
| 5 | DEF | LB | Sead Kolašinac | 4 | 0 | 338 | 0 | 65 | 0 | Atalanta BC |
| 18 | DEF | CB | Nikola Katić | 4 | 0 | 318 | 0 | 17 | 2 | FC Schalke 04 |
| 19 | DEL | LM | Kerim Alajbegović | 3 | 1 | 278 | 1 | 10 | 1 | FC Red Bull Salzburg |
| 7 | DEF | RB | Amar Dedić | 3 | 0 | 270 | 0 | 28 | 1 | S.L. Benfica |
| 4 | DEF | CB | Tarik Muharemović | 3 | 0 | 270 | 0 | 14 | 1 | US Sassuolo Calcio |
| 6 | MED | CM | Benjamin Tahirović | 2 | 2 | 236 | 0 | 28 | 2 | Brøndby IF |
| 20 | DEL | RM | Esmir Bajraktarević | 2 | 2 | 230 | 0 | 16 | 1 | PSV Eindhoven |
| 15 | MED | MF | Amar Memić | 2 | 2 | 223 | 0 | 13 | 1 | FC Viktoria Plzeň |
| 14 | MED | CM | Ivan Šunjić | 3 | 1 | 198 | 0 | 11 | 0 | Pafos FC |
| 21 | DEF | CB | Stjepan Radeljić | 2 | 0 | 180 | 0 | 5 | 0 | HNK Rijeka |
| 13 | MED | CM | Ivan Bašić | 2 | 1 | 179 | 0 | 17 | 0 | FC Astana |
| 11 | DEL | CF | Edin Džeko | 3 | 0 | 177 | 0 | 148 | 73 | FC Schalke 04 |
| 8 | MED | MF | Armin Gigović | 1 | 1 | 79 | 0 | 20 | 1 | BSC Young Boys |
| 25 | DEL | CF | Jovo Lukić | 1 | 1 | 67 | 1 | 3 | 0 | FC Universitatea Cluj |
| 26 | MED | MF | Ermin Mahmić | 0 | 3 | 66 | 2 | 2 | 0 | FC Slovan Liberec |
| 24 | DEF | RB | Arjan Malić | 1 | 0 | 46 | 0 | 8 | 0 | SK Sturm Graz |
| 9 | DEL | FW | Samed Baždar | 0 | 1 | 28 | 0 | 13 | 1 | Jagiellonia Białystok |
| 3 | DEF | DF | Dennis Hadžikadunić | 0 | 1 | 27 | 0 | 32 | 0 | UC Sampdoria |
| 17 | MED | MF | Dženis Burnić | 0 | 2 | 15 | 0 | 20 | 0 | Karlsruher SC |
| 23 | DEL | FW | Haris Tabaković | 0 | 1 | 15 | 0 | 10 | 4 | Borussia Mönchengladbach |
| 16 | MED | MF | Amir Hadžiahmetović | 0 | 1 | 5 | 0 | 36 | 0 | Hull City A.F.C. |

**Convocados sin minutos:** 2 Nihad Mujakić (DEF, 12 caps) · 12 Mladen Jurkas (POR, 0 caps) · 22 Martin Zlomislić (POR, 3 caps)

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
- **Resultado:** `teamRating` = **75** → Δ+1, dentro de la banda ±3 acordada con el PO.
- Vara: nivel de club a jun-2026 (la misma que los 23 planteles que ya estaban), con el
  rendimiento del Mundial usado como modificador **dentro** del equipo — decide quién entra
  al 10 y quién queda de 11º, no infla la selección entera.

Notas (`naturalOverall`, sin momento y en su puesto):

- 77 — Ermedin Demirović (DEL, #10)
- 75 — Nikola Vasilj (POR, #1)
- 75 — Sead Kolašinac (DEF, #5)
- 75 — Edin Džeko (DEL, #11)
- 74 — Benjamin Tahirović (MED, #6)
- 73 — Amar Dedić (DEF, #7)
- 72 — Nikola Katić (DEF, #18)
- 72 — Amar Memić (MED, #15)
- 70 — Ivan Šunjić (MED, #14)
- 66 — Martin Zlomislić (POR, #22)

### Kit

- **Campo:** `shirt: #001970` · `accent: #FFD700`.
  Hex exacto del torneo: azul `001970`. El acento dorado sale del escudo y la bandera.
- **Alternativa:** `shirt: #FFFFFF` · `accent: #FFD700`.
  Hex del kit alternativo que FIFA registró en el torneo.
  El motor la pone sola cuando la titular se confunde con la del rival
  (`ui/sprites.fieldKitVs`, umbral `CLASH_DIST` = 60 de distancia RGB). Se cambia
  siempre el rival, nunca la selección del jugador.
- **Arquero:** `shirt: #10B981` · `accent: #0B0F19`.
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
