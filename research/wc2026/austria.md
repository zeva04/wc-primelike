# Austria (AUT) — Mundial 2026

> Investigación cruda para `data/teams.js`. **Auditable**: todo sale de las fuentes
> listadas al pie; nada acá está inventado. Lo que no se pudo confirmar va marcado
> `TODO: verificar`.

## Resultado en el torneo

- **Puesto final:** 28º de 48 — Eliminado en 16avos de final
- **Récord:** 1G 1E 2P · 6 goles a favor / 9 en contra
- **Grupo:** J

## Austria — 4 partidos con alineación extraída

**Kits usados en el torneo (hex del reporte de FIFA):**
- #FF0000 arm:#000000 short:#000000 medias:#FF0000 (aut26h) — 2 partido(s)
- #FF0000 arm:#000000 short:#FFFFFF medias:#FF0000 (aut26h) — 1 partido(s)
- #FFFFFF arm:#FFFFFF short:#FFFFFF medias:#FFFFFF (aut26a) — 1 partido(s)

| # | Pos | Rol | Jugador | Tit | Sup | Min | G⚽ | Caps | GolSel | Club |
|---|-----|-----|---------|-----|-----|-----|----|------|--------|------|
| 1 | POR | GK | Alexander Schlager | 4 | 0 | 390 | 0 | 26 | 0 | FC Red Bull Salzburg |
| 20 | MED | LB | Konrad Laimer | 4 | 0 | 390 | 0 | 57 | 7 | FC Bayern Munich |
| 9 | MED | LW | Marcel Sabitzer | 4 | 0 | 390 | 1 | 98 | 26 | Borussia Dortmund |
| 5 | DEF | RB | Stefan Posch | 4 | 0 | 332 | 0 | 52 | 5 | 1. FSV Mainz 05 |
| 6 | MED | CM | Nicolas Seiwald | 4 | 0 | 316 | 0 | 47 | 1 | RB Leipzig |
| 8 | DEF | CB | David Alaba | 4 | 0 | 308 | 0 | 113 | 15 | Real Madrid CF |
| 3 | DEF | DF | Kevin Danso | 2 | 2 | 269 | 0 | 32 | 0 | Tottenham Hotspur F.C. |
| 18 | MED | RW | Romano Schmid | 4 | 0 | 267 | 1 | 34 | 3 | SV Werder Bremen |
| 24 | MED | MF | Paul Wanner | 2 | 2 | 262 | 0 | 3 | 0 | PSV Eindhoven |
| 4 | MED | CM | Xaver Schlager | 4 | 0 | 241 | 0 | 51 | 4 | RB Leipzig |
| 11 | DEL | CF | Michael Gregoritsch | 2 | 1 | 189 | 0 | 75 | 24 | FC Augsburg |
| 15 | DEF | CB | Philipp Lienhart | 2 | 0 | 180 | 0 | 41 | 3 | SC Freiburg |
| 7 | DEL | FW | Marko Arnautović | 1 | 3 | 173 | 2 | 133 | 47 | Red Star Belgrade |
| 16 | DEF | LB | Phillipp Mwene | 2 | 0 | 149 | 0 | 30 | 0 | 1. FSV Mainz 05 |
| 10 | MED | MF | Florian Grillitsch | 0 | 2 | 118 | 0 | 58 | 1 | S.C. Braga |
| 17 | MED | MF | Carney Chukwuemeka | 0 | 3 | 110 | 0 | 3 | 1 | Borussia Dortmund |
| 14 | DEL | FW | Saša Kalajdžić | 1 | 2 | 106 | 1 | 22 | 4 | LASK |
| 22 | MED | DF | Alexander Prass | 0 | 2 | 58 | 0 | 19 | 0 | TSG 1899 Hoffenheim |
| 23 | DEF | DF | Marco Friedl | 0 | 1 | 23 | 0 | 11 | 0 | SV Werder Bremen |
| 21 | DEL | FW | Patrick Wimmer | 0 | 2 | 19 | 0 | 30 | 1 | VfL Wolfsburg |

**Convocados sin minutos:** 2 David Affengruber (DEF, 1 caps) · 12 Florian Wiegele (POR, 1 caps) · 13 Patrick Pentz (POR, 18 caps) · 19 Dejan Ljubičić (MED, 9 caps) · 25 Michael Svoboda (DEF, 4 caps) · 26 Alessandro Schöpf (MED, 35 caps)

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

- **Ancla:** 78 (el `rating` que tenía como rival antes de la conversión).
- **Resultado:** `teamRating` = **78** → Δ+0, dentro de la banda ±3 acordada con el PO.
- Vara: nivel de club a jun-2026 (la misma que los 23 planteles que ya estaban), con el
  rendimiento del Mundial usado como modificador **dentro** del equipo — decide quién entra
  al 10 y quién queda de 11º, no infla la selección entera.

Notas (`naturalOverall`, sin momento y en su puesto):

- 80 — Marcel Sabitzer (MED, #9)
- 78 — David Alaba (DEF, #8)
- 78 — Konrad Laimer (MED, #20)
- 78 — Marko Arnautović (DEL, #7)
- 77 — Alexander Schlager (POR, #1)
- 77 — Kevin Danso (DEF, #3)
- 76 — Michael Gregoritsch (DEL, #11)
- 75 — Stefan Posch (DEF, #5)
- 75 — Nicolas Seiwald (MED, #6)
- 71 — Patrick Pentz (POR, #13)

### Kit

- **Campo:** `shirt: #ED2939` · `accent: #000000`.
  `TODO: verificar` — FIFA reportó un `FF0000` genérico, el mismo que Suiza. Se usó el rojo austríaco tradicional `#ED2939`, conservando las mangas y el short negros que sí vistió en el torneo.
- **Alternativa:** `shirt: #FFFFFF` · `accent: #000000`.
  Hex del kit alternativo que FIFA registró en el torneo.
  El motor la pone sola cuando la titular se confunde con la del rival
  (`ui/sprites.fieldKitVs`, umbral `CLASH_DIST` = 60 de distancia RGB). Se cambia
  siempre el rival, nunca la selección del jugador.
- **Arquero:** `shirt: #06B6D4` · `accent: #0B0F19`.
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
