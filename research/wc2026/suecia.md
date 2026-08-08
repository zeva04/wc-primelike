# Sweden (SWE) — Mundial 2026

> Investigación cruda para `data/teams.js`. **Auditable**: todo sale de las fuentes
> listadas al pie; nada acá está inventado. Lo que no se pudo confirmar va marcado
> `TODO: verificar`.

## Resultado en el torneo

- **Puesto final:** 27º de 48 — Eliminado en 16avos de final
- **Récord:** 1G 1E 2P · 7 goles a favor / 10 en contra
- **Grupo:** F

## Sweden — 4 partidos con alineación extraída

**Kits usados en el torneo (hex del reporte de FIFA):**
- #FFF200 arm:#FFF200 short:#000040 medias:#FFF200 (swe26hA) — 2 partido(s)
- #000040 arm:#000040 short:#000040 medias:#000040 (swe26a) — 1 partido(s)

| # | Pos | Rol | Jugador | Tit | Sup | Min | G⚽ | Caps | GolSel | Club |
|---|-----|-----|---------|-----|-----|-----|----|------|--------|------|
| 2 | DEF | CB | Gustaf Lagerbielke | 4 | 0 | 360 | 0 | 11 | 2 | S.C. Braga |
| 17 | DEL | CF | Viktor Gyökeres | 4 | 0 | 360 | 1 | 33 | 20 | Arsenal F.C. |
| 9 | DEL | CF | Alexander Isak | 4 | 0 | 359 | 1 | 58 | 17 | Liverpool F.C. |
| 3 | DEF | CB | Victor Lindelöf | 4 | 0 | 357 | 0 | 76 | 3 | Aston Villa F.C. |
| 18 | MED | CM | Yasin Ayari | 4 | 0 | 341 | 2 | 21 | 3 | Brighton & Hove Albion F.C. |
| 5 | DEF | LM | Gabriel Gudmundsson | 4 | 0 | 332 | 0 | 24 | 0 | Leeds United F.C. |
| 21 | DEF | RM | Alexander Bernhardsson | 3 | 0 | 220 | 0 | 11 | 0 | Holstein Kiel |
| 4 | DEF | CB | Isak Hien | 3 | 0 | 217 | 0 | 29 | 0 | Atalanta BC |
| 11 | DEL | FW | Anthony Elanga | 2 | 2 | 215 | 2 | 30 | 6 | Newcastle United F.C. |
| 23 | POR | GK | Kristoffer Nordfeldt | 2 | 0 | 180 | 0 | 21 | 0 | AIK Fotboll |
| 1 | POR | GK | Jacob Widell Zetterström | 2 | 0 | 180 | 0 | 3 | 0 | Derby County F.C. |
| 7 | MED | MF | Lucas Bergvall | 1 | 3 | 179 | 0 | 10 | 0 | Tottenham Hotspur F.C. |
| 24 | DEF | DF | Elliot Stroud | 2 | 2 | 166 | 0 | 1 | 0 | Mjällby AIF |
| 16 | MED | CM | Jesper Karlström | 2 | 0 | 139 | 0 | 25 | 0 | Udinese Calcio |
| 10 | MED | MF | Benjamin Nygren | 2 | 2 | 131 | 0 | 11 | 3 | Celtic F.C. |
| 8 | DEF | DF | Daniel Svensson | 1 | 2 | 97 | 0 | 13 | 0 | Borussia Dortmund |
| 22 | MED | MF | Besfort Zeneli | 0 | 2 | 59 | 0 | 8 | 0 | Royale Union Saint-Gilloise |
| 26 | DEL | FW | Taha Ali | 0 | 2 | 35 | 0 | 2 | 0 | Malmö FF |
| 13 | MED | MF | Ken Sema | 0 | 1 | 15 | 0 | 33 | 5 | Pafos FC |
| 19 | MED | MF | Mattias Svanberg | 0 | 2 | 14 | 1 | 41 | 2 | VfL Wolfsburg |
| 15 | DEF | DF | Carl Starfelt | 0 | 1 | 3 | 0 | 18 | 0 | RC Celta de Vigo |
| 25 | DEL | FW | Gustaf Nilsson | 0 | 1 | 1 | 0 | 10 | 4 | Club Brugge KV |

**Convocados sin minutos:** 6 Herman Johansson (DEF, 3 caps) · 12 Viktor Johansson (POR, 12 caps) · 14 Hjalmar Ekdal (DEF, 13 caps) · 20 Eric Smith (DEF, 2 caps)

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

- **Ancla:** 81 (el `rating` que tenía como rival antes de la conversión).
- **Resultado:** `teamRating` = **80** → Δ-1, dentro de la banda ±3 acordada con el PO.
- Vara: nivel de club a jun-2026 (la misma que los 23 planteles que ya estaban), con el
  rendimiento del Mundial usado como modificador **dentro** del equipo — decide quién entra
  al 10 y quién queda de 11º, no infla la selección entera.

Notas (`naturalOverall`, sin momento y en su puesto):

- 85 — Alexander Isak (DEL, #9)
- 84 — Viktor Gyökeres (DEL, #17)
- 77 — Victor Lindelöf (DEF, #3)
- 77 — Yasin Ayari (MED, #18)
- 76 — Lucas Bergvall (MED, #7)
- 74 — Gustaf Lagerbielke (DEF, #2)
- 73 — Kristoffer Nordfeldt (POR, #23)
- 73 — Gabriel Gudmundsson (DEF, #5)
- 73 — Jesper Karlström (MED, #16)
- 72 — Jacob Widell Zetterström (POR, #1)

### Kit

- **Campo:** `shirt: #FFF200` · `accent: #000040`.
  Hex exacto del torneo: amarillo `FFF200` con short azul marino `000040`.
- **Alternativa:** `shirt: #000040` · `accent: #FFF200`.
  Hex del kit alternativo que FIFA registró en el torneo.
  El motor la pone sola cuando la titular se confunde con la del rival
  (`ui/sprites.fieldKitVs`, umbral `CLASH_DIST` = 60 de distancia RGB). Se cambia
  siempre el rival, nunca la selección del jugador.
- **Arquero:** `shirt: #DB2777` · `accent: #0B0F19`.
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
