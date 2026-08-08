# Switzerland (SUI) — Mundial 2026

> Investigación cruda para `data/teams.js`. **Auditable**: todo sale de las fuentes
> listadas al pie; nada acá está inventado. Lo que no se pudo confirmar va marcado
> `TODO: verificar`.

## Resultado en el torneo

- **Puesto final:** 8º de 48 — Eliminado en cuartos de final
- **Récord:** 3G 2E 1P · 10 goles a favor / 6 en contra
- **Grupo:** B

## Switzerland — 5 partidos con alineación extraída

**Kits usados en el torneo (hex del reporte de FIFA):**
- #FF0000 arm:#FF0000 short:#FF0000 medias:#FF0000 (sui26h) — 4 partido(s)
- #d6e6e5 arm:#d6e6e5 short:#d6e6e5 medias:#d6e6e5 (sui26a) — 1 partido(s)

| # | Pos | Rol | Jugador | Tit | Sup | Min | G⚽ | Caps | GolSel | Club |
|---|-----|-----|---------|-----|-----|-----|----|------|--------|------|
| 1 | POR | GK | Gregor Kobel | 5 | 0 | 450 | 0 | 21 | 0 | Borussia Dortmund |
| 5 | DEF | CB | Manuel Akanji | 5 | 0 | 450 | 0 | 81 | 4 | Inter Milan |
| 4 | DEF | CB | Nico Elvedi | 5 | 0 | 450 | 0 | 67 | 3 | Borussia Mönchengladbach |
| 10 | MED | CM | Granit Xhaka | 5 | 0 | 450 | 1 | 146 | 17 | Sunderland A.F.C. |
| 8 | MED | CM | Remo Freuler | 5 | 0 | 449 | 0 | 88 | 11 | Bologna FC 1909 |
| 7 | DEL | CF | Breel Embolo | 5 | 0 | 433 | 2 | 86 | 24 | Stade Rennais FC |
| 13 | DEF | LB | Ricardo Rodriguez | 5 | 0 | 430 | 0 | 138 | 9 | Real Betis |
| 11 | DEL | RF | Dan Ndoye | 4 | 1 | 325 | 2 | 31 | 8 | Nottingham Forest F.C. |
| 6 | MED | RB | Denis Zakaria | 3 | 0 | 264 | 0 | 65 | 3 | AS Monaco FC |
| 17 | DEL | FW | Rubén Vargas | 3 | 2 | 247 | 2 | 61 | 11 | Sevilla FC |
| 22 | MED | MF | Fabian Rieder | 2 | 2 | 219 | 0 | 28 | 1 | FC Augsburg |
| 9 | MED | MF | Johan Manzambi | 2 | 2 | 197 | 3 | 12 | 3 | SC Freiburg |
| 20 | MED | CM | Michel Aebischer | 2 | 2 | 157 | 0 | 40 | 2 | Pisa SC |
| 15 | MED | MF | Djibril Sow | 1 | 2 | 136 | 0 | 52 | 0 | Sevilla FC |
| 3 | DEF | DF | Silvan Widmer | 1 | 3 | 108 | 0 | 60 | 5 | 1. FSV Mainz 05 |
| 25 | DEF | DF | Luca Jaquez | 1 | 1 | 78 | 0 | 3 | 0 | VfB Stuttgart |
| 14 | MED | MF | Ardon Jashari | 1 | 1 | 47 | 0 | 8 | 0 | AC Milan |
| 2 | DEF | DF | Miro Muheim | 0 | 2 | 20 | 0 | 10 | 0 | Hamburger SV |
| 19 | DEL | FW | Noah Okafor | 0 | 1 | 20 | 0 | 25 | 2 | Leeds United F.C. |
| 23 | DEL | FW | Zeki Amdouni | 0 | 3 | 19 | 0 | 29 | 11 | Burnley F.C. |
| 26 | DEL | FW | Cedric Itten | 0 | 3 | 9 | 0 | 15 | 5 | Fortuna Düsseldorf |
| 16 | DEL | MF | Christian Fassnacht | 0 | 1 | 5 | 0 | 23 | 5 | BSC Young Boys |

**Convocados sin minutos:** 12 Yvon Mvogo (POR, 13 caps) · 18 Eray Cömert (DEF, 22 caps) · 21 Marvin Keller (POR, 1 caps) · 24 Aurèle Amenda (DEF, 7 caps)

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
- **Resultado:** `teamRating` = **80** → Δ+2, dentro de la banda ±3 acordada con el PO.
- Vara: nivel de club a jun-2026 (la misma que los 23 planteles que ya estaban), con el
  rendimiento del Mundial usado como modificador **dentro** del equipo — decide quién entra
  al 10 y quién queda de 11º, no infla la selección entera.

Notas (`naturalOverall`, sin momento y en su puesto):

- 81 — Gregor Kobel (POR, #1)
- 81 — Manuel Akanji (DEF, #5)
- 81 — Granit Xhaka (MED, #10)
- 80 — Breel Embolo (DEL, #7)
- 79 — Johan Manzambi (MED, #9)
- 78 — Nico Elvedi (DEF, #4)
- 78 — Dan Ndoye (DEL, #11)
- 77 — Remo Freuler (MED, #8)
- 74 — Ricardo Rodriguez (DEF, #13)
- 70 — Yvon Mvogo (POR, #12)

### Kit

- **Campo:** `shirt: #FF0000` · `accent: #FFFFFF`.
  Hex exacto del torneo: rojo `FF0000` (4 de 6 partidos). FIFA reportó ese mismo `FF0000` genérico para Austria, así que el desempate fue: Suiza se queda el hex real (lo vistió más veces) y Austria pasa a su rojo tradicional. OJO: el rojo suizo tradicional (`#D52B1E`) NO servía, es exactamente el de Paraguay.
- **Alternativa:** `shirt: #D6E6E5` · `accent: #FF0000`.
  Hex del kit alternativo que FIFA registró en el torneo.
  El motor la pone sola cuando la titular se confunde con la del rival
  (`ui/sprites.fieldKitVs`, umbral `CLASH_DIST` = 60 de distancia RGB). Se cambia
  siempre el rival, nunca la selección del jugador.
- **Arquero:** `shirt: #A3E635` · `accent: #0B0F19`.
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
