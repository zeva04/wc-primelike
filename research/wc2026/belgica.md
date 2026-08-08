# Belgium (BEL) — Mundial 2026

> Investigación cruda para `data/teams.js`. **Auditable**: todo sale de las fuentes
> listadas al pie; nada acá está inventado. Lo que no se pudo confirmar va marcado
> `TODO: verificar`.

## Resultado en el torneo

- **Puesto final:** 6º de 48 — Eliminado en cuartos de final
- **Récord:** 3G 2E 1P · 14 goles a favor / 7 en contra
- **Grupo:** G

## Belgium — 6 partidos con alineación extraída

**Kits usados en el torneo (hex del reporte de FIFA):**
- #ee3137 arm:#ee3137 short:#000000 medias:#000000 (bel26h) — 2 partido(s)
- #ee3137 arm:#ee3137 short:#000000 medias:#000000 (bel26hA) — 1 partido(s)

| # | Pos | Rol | Jugador | Tit | Sup | Min | G⚽ | Caps | GolSel | Club |
|---|-----|-----|---------|-----|-----|-----|----|------|--------|------|
| 4 | DEF | CB | Brandon Mechele | 6 | 0 | 540 | 0 | 9 | 1 | Club Brugge KV |
| 1 | POR | GK | Thibaut Courtois | 6 | 0 | 521 | 0 | 109 | 0 | Real Madrid CF |
| 10 | DEL | RW | Leandro Trossard | 6 | 0 | 510 | 2 | 51 | 12 | Arsenal F.C. |
| 21 | DEF | RB | Timothy Castagne | 5 | 1 | 448 | 0 | 63 | 2 | Fulham F.C. |
| 8 | MED | CM | Youri Tielemans | 5 | 0 | 445 | 2 | 85 | 13 | Aston Villa F.C. |
| 5 | DEF | LB | Maxim De Cuyper | 5 | 1 | 442 | 0 | 19 | 4 | Brighton & Hove Albion F.C. |
| 7 | MED | AM | Kevin De Bruyne | 5 | 0 | 387 | 1 | 119 | 37 | SSC Napoli |
| 25 | DEF | CB | Nathan Ngoy | 4 | 0 | 360 | 0 | 4 | 0 | Lille OSC |
| 17 | DEL | CF | Charles De Ketelaere | 5 | 0 | 354 | 3 | 30 | 6 | Atalanta BC |
| 20 | MED | MF | Hans Vanaken | 3 | 3 | 318 | 1 | 34 | 7 | Club Brugge KV |
| 11 | DEL | LW | Jérémy Doku | 4 | 1 | 311 | 0 | 43 | 7 | Manchester City F.C. |
| 23 | MED | MF | Nicolas Raskin | 3 | 3 | 310 | 0 | 13 | 2 | Rangers F.C. |
| 9 | DEL | FW | Romelu Lukaku | 1 | 5 | 199 | 3 | 126 | 90 | SSC Napoli |
| 3 | DEF | CB | Arthur Theate | 2 | 1 | 197 | 0 | 33 | 1 | Eintracht Frankfurt |
| 15 | DEF | RB | Thomas Meunier | 2 | 1 | 160 | 0 | 80 | 10 | Lille OSC |
| 14 | DEL | FW | Dodi Lukébakio | 1 | 2 | 133 | 0 | 30 | 6 | S.L. Benfica |
| 24 | MED | CM | Amadou Onana | 2 | 2 | 95 | 0 | 29 | 1 | Aston Villa F.C. |
| 22 | MED | MF | Alexis Saelemaekers | 1 | 3 | 81 | 1 | 24 | 2 | AC Milan |
| 26 | DEL | FW | Matias Fernandez-Pardo | 0 | 3 | 41 | 0 | 2 | 0 | Lille OSC |
| 6 | MED | MF | Axel Witsel | 0 | 2 | 31 | 0 | 138 | 12 | Girona FC |
| 18 | DEF | DF | Joaquin Seys | 0 | 1 | 30 | 0 | 5 | 0 | Club Brugge KV |
| 19 | MED | MF | Diego Moreira | 0 | 1 | 27 | 0 | 3 | 0 | RC Strasbourg Alsace |
| 12 | POR | GK | Senne Lammens | 0 | 1 | 19 | 0 | 2 | 0 | Manchester United F.C. |

**Convocados sin minutos:** 2 Zeno Debast (DEF, 26 caps) · 13 Mike Penders (POR, 0 caps) · 16 Koni De Winter (DEF, 8 caps)

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

- **Ancla:** 83 (el `rating` que tenía como rival antes de la conversión).
- **Resultado:** `teamRating` = **83** → Δ+0, dentro de la banda ±3 acordada con el PO.
- Vara: nivel de club a jun-2026 (la misma que los 23 planteles que ya estaban), con el
  rendimiento del Mundial usado como modificador **dentro** del equipo — decide quién entra
  al 10 y quién queda de 11º, no infla la selección entera.

Notas (`naturalOverall`, sin momento y en su puesto):

- 85 — Thibaut Courtois (POR, #1)
- 84 — Kevin De Bruyne (MED, #7)
- 83 — Youri Tielemans (MED, #8)
- 83 — Leandro Trossard (DEL, #10)
- 81 — Charles De Ketelaere (DEL, #17)
- 78 — Brandon Mechele (DEF, #4)
- 76 — Timothy Castagne (DEF, #21)
- 76 — Maxim De Cuyper (DEF, #5)
- 75 — Senne Lammens (POR, #12)
- 75 — Hans Vanaken (MED, #20)

### Kit

- **Campo:** `shirt: #EE3137` · `accent: #000000`.
  Es el hex exacto que vistió en el torneo (rojo `ee3137`, short y medias negros).
- **Alternativa:** `shirt: #8FB8DE` · `accent: #E8A0C0`.
  `TODO: verificar` — no está en los reportes de FIFA. away 2026: celeste ('Frozen Blue') con acentos blanco y rosa claro, homenaje a Magritte y al surrealismo belga. El hex EXACTO no está confirmado.
  El motor la pone sola cuando la titular se confunde con la del rival
  (`ui/sprites.fieldKitVs`, umbral `CLASH_DIST` = 60 de distancia RGB). Se cambia
  siempre el rival, nunca la selección del jugador.
- **Arquero:** `shirt: #22D3EE` · `accent: #111827`.
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
