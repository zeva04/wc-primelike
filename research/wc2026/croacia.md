# Croatia (CRO) — Mundial 2026

> Investigación cruda para `data/teams.js`. **Auditable**: todo sale de las fuentes
> listadas al pie; nada acá está inventado. Lo que no se pudo confirmar va marcado
> `TODO: verificar`.

## Resultado en el torneo

- **Puesto final:** 20º de 48 — Eliminado en 16avos de final
- **Récord:** 2G 0E 2P · 6 goles a favor / 7 en contra
- **Grupo:** L

## Croatia — 4 partidos con alineación extraída

**Kits usados en el torneo (hex del reporte de FIFA):**
- #000081 arm:#000081 short:#000081 medias:#0033F5 (cro26a) — 2 partido(s)
- #FFFFFF arm:#FFFFFF short:#FFFFFF medias:#FFFFFF (cro26h) — 2 partido(s)

| # | Pos | Rol | Jugador | Tit | Sup | Min | G⚽ | Caps | GolSel | Club |
|---|-----|-----|---------|-----|-----|-----|----|------|--------|------|
| 1 | POR | GK | Dominik Livaković | 4 | 0 | 360 | 0 | 75 | 0 | GNK Dinamo Zagreb |
| 6 | DEF | CB | Josip Šutalo | 4 | 0 | 360 | 0 | 33 | 0 | AFC Ajax |
| 2 | DEF | RB | Josip Stanišić | 4 | 0 | 360 | 0 | 31 | 0 | FC Bayern Munich |
| 14 | DEL | LB | Ivan Perišić | 4 | 0 | 360 | 1 | 154 | 38 | PSV Eindhoven |
| 16 | MED | LW | Martin Baturina | 4 | 0 | 324 | 1 | 19 | 1 | Como 1907 |
| 10 | MED | CM | Luka Modrić | 4 | 0 | 319 | 0 | 198 | 29 | AC Milan |
| 17 | MED | RF | Petar Sučić | 3 | 1 | 288 | 1 | 17 | 1 | Inter Milan |
| 8 | MED | CM | Mateo Kovačić | 3 | 1 | 272 | 0 | 113 | 5 | Manchester City F.C. |
| 3 | DEF | CB | Marin Pongračić | 3 | 0 | 270 | 0 | 20 | 0 | ACF Fiorentina |
| 13 | MED | MF | Nikola Vlašić | 2 | 1 | 190 | 1 | 63 | 10 | Torino FC |
| 11 | DEL | CF | Ante Budimir | 2 | 1 | 156 | 1 | 38 | 6 | CA Osasuna |
| 4 | DEF | DF | Joško Gvardiol | 2 | 2 | 138 | 0 | 48 | 4 | Manchester City F.C. |
| 15 | MED | MF | Mario Pašalić | 1 | 3 | 121 | 0 | 85 | 12 | Atalanta BC |
| 26 | DEL | CF | Petar Musa | 2 | 0 | 112 | 1 | 11 | 1 | FC Dallas |
| 24 | DEL | FW | Marco Pašalić | 1 | 2 | 98 | 0 | 15 | 1 | Orlando City SC |
| 20 | DEL | FW | Igor Matanović | 0 | 3 | 92 | 0 | 9 | 2 | SC Freiburg |
| 22 | DEF | CB | Luka Vušković | 1 | 0 | 66 | 0 | 5 | 1 | Hamburger SV |
| 9 | DEL | FW | Andrej Kramarić | 0 | 3 | 56 | 0 | 116 | 36 | TSG 1899 Hoffenheim |
| 21 | MED | MF | Luka Sučić | 0 | 1 | 18 | 1 | 21 | 1 | Real Sociedad |

**Convocados sin minutos:** 5 Duje Ćaleta-Car (DEF, 38 caps) · 7 Nikola Moro (MED, 10 caps) · 12 Ivor Pandur (POR, 0 caps) · 18 Kristijan Jakić (DEF, 17 caps) · 19 Toni Fruk (MED, 7 caps) · 23 Dominik Kotarski (POR, 4 caps) · 25 Martin Erlić (DEF, 13 caps)

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

- **Ancla:** 82 (el `rating` que tenía como rival antes de la conversión).
- **Resultado:** `teamRating` = **81** → Δ-1, dentro de la banda ±3 acordada con el PO.
- Vara: nivel de club a jun-2026 (la misma que los 23 planteles que ya estaban), con el
  rendimiento del Mundial usado como modificador **dentro** del equipo — decide quién entra
  al 10 y quién queda de 11º, no infla la selección entera.

Notas (`naturalOverall`, sin momento y en su puesto):

- 83 — Luka Modrić (MED, #10)
- 82 — Mateo Kovačić (MED, #8)
- 81 — Dominik Livaković (POR, #1)
- 79 — Josip Šutalo (DEF, #6)
- 79 — Martin Baturina (MED, #16)
- 79 — Ivan Perišić (DEL, #14)
- 78 — Josip Stanišić (DEF, #2)
- 77 — Petar Sučić (DEL, #17)
- 76 — Marin Pongračić (DEF, #3)
- 70 — Dominik Kotarski (POR, #23)

### Kit

- **Campo:** `shirt: #FFFFFF` · `accent: #E63946`.
  El damero rojiblanco no se puede representar con dos colores planos: el sprite usa base blanca con detalle rojo, que es como se lee el kit a distancia. El hex de FIFA para el kit titular es `FFFFFF` y el alternativo `000081`.
- **Alternativa:** `shirt: #000081` · `accent: #E63946`.
  Hex del kit alternativo que FIFA registró en el torneo.
  El motor la pone sola cuando la titular se confunde con la del rival
  (`ui/sprites.fieldKitVs`, umbral `CLASH_DIST` = 60 de distancia RGB). Se cambia
  siempre el rival, nunca la selección del jugador.
- **Arquero:** `shirt: #1D4ED8` · `accent: #F8FAFC`.
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
