# Egypt (EGY) — Mundial 2026

> Investigación cruda para `data/teams.js`. **Auditable**: todo sale de las fuentes
> listadas al pie; nada acá está inventado. Lo que no se pudo confirmar va marcado
> `TODO: verificar`.

## Resultado en el torneo

- **Puesto final:** 15º de 48 — Eliminado en octavos de final
- **Récord:** 1G 3E 1P · 8 goles a favor / 7 en contra
- **Grupo:** G

## Egypt — 5 partidos con alineación extraída

**Kits usados en el torneo (hex del reporte de FIFA):**
- #FF0000 arm:#FF0000 short:#000000 medias:#000000 (egy26h) — 3 partido(s)
- #FFFFFF arm:#FFFFFF short:#FFFFFF medias:#FFFFFF (egy26a) — 1 partido(s)
- #FFFFFF arm:#FFFFFF short:#FFFFFF medias:#000000 (egy26h) — 1 partido(s)

| # | Pos | Rol | Jugador | Tit | Sup | Min | G⚽ | Caps | GolSel | Club |
|---|-----|-----|---------|-----|-----|-----|----|------|--------|------|
| 23 | POR | GK | Mostafa Shobeir | 5 | 0 | 480 | 0 | 9 | 0 | Al Ahly SC |
| 3 | DEF | RB | Mohamed Hany | 5 | 0 | 480 | 0 | 42 | 0 | Al Ahly SC |
| 2 | DEF | CB | Yasser Ibrahim | 4 | 1 | 466 | 1 | 17 | 1 | Al Ahly SC |
| 19 | MED | CM | Marwan Attia | 4 | 1 | 464 | 0 | 34 | 1 | Al Ahly SC |
| 10 | DEL | AM | Mohamed Salah | 5 | 0 | 427 | 1 | 116 | 67 | Liverpool F.C. |
| 11 | MED | RW | Mostafa Ziko | 5 | 0 | 375 | 2 | 2 | 2 | Pyramids FC |
| 5 | DEF | CB | Ramy Rabia | 3 | 2 | 368 | 0 | 44 | 5 | Al Ain FC |
| 17 | MED | CM | Mohanad Lasheen | 4 | 0 | 360 | 0 | 23 | 0 | Pyramids FC |
| 22 | DEL | CF | Omar Marmoush | 3 | 2 | 356 | 0 | 50 | 11 | Manchester City F.C. |
| 8 | MED | LW | Emam Ashour | 5 | 0 | 337 | 2 | 29 | 0 | Al Ahly SC |
| 14 | MED | CB | Hamdy Fathy | 3 | 1 | 270 | 0 | 63 | 3 | Al-Wakrah SC |
| 13 | DEF | LB | Ahmed Fatouh | 3 | 0 | 268 | 0 | 39 | 1 | Zamalek SC |
| 15 | DEF | LB | Karim Hafez | 2 | 1 | 202 | 0 | 9 | 0 | Pyramids FC |
| 7 | DEL | FW | Trézéguet | 1 | 3 | 161 | 0 | 96 | 23 | Al Ahly SC |
| 12 | DEL | RW | Haissem Hassan | 1 | 1 | 96 | 0 | 4 | 0 | Real Oviedo |
| 25 | DEL | FW | Zizo | 0 | 4 | 83 | 0 | 63 | 5 | Al Ahly SC |
| 21 | MED | CM | Mahmoud Saber | 1 | 1 | 46 | 1 | 15 | 1 | ZED FC |
| 9 | DEL | FW | Hamza Abdelkarim | 0 | 4 | 42 | 0 | 2 | 0 | FC Barcelona Atlètic |
| 4 | DEF | DF | Hossam Abdelmaguid | 0 | 2 | 29 | 0 | 13 | 0 | Zamalek SC |
| 6 | DEF | DF | Mohamed Abdelmonem | 1 | 1 | 14 | 0 | 36 | 3 | OGC Nice |
| 20 | DEL | FW | Ibrahim Adel | 0 | 1 | 2 | 0 | 24 | 3 | FC Nordsjælland |

**Convocados sin minutos:** 1 Mohamed El Shenawy (POR, 76 caps) · 16 El Mahdy Soliman (POR, 0 caps) · 18 Nabil Emad (MED, 12 caps) · 24 Tarek Alaa (DEF, 3 caps) · 26 Mohamed Alaa (POR, 0 caps)

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
- **Resultado:** `teamRating` = **76** → Δ+2, dentro de la banda ±3 acordada con el PO.
- Vara: nivel de club a jun-2026 (la misma que los 23 planteles que ya estaban), con el
  rendimiento del Mundial usado como modificador **dentro** del equipo — decide quién entra
  al 10 y quién queda de 11º, no infla la selección entera.

Notas (`naturalOverall`, sin momento y en su puesto):

- 82 — Mohamed Salah (DEL, #10)
- 77 — Omar Marmoush (DEL, #22)
- 75 — Emam Ashour (MED, #8)
- 74 — Mostafa Shobeir (POR, #23)
- 74 — Mostafa Ziko (MED, #11)
- 73 — Yasser Ibrahim (DEF, #2)
- 72 — Mohamed El Shenawy (POR, #1)
- 71 — Ramy Rabia (DEF, #5)
- 71 — Marwan Attia (MED, #19)
- 70 — Mohamed Hany (DEF, #3)

### Kit

- **Campo:** `shirt: #CE1126` · `accent: #000000`.
  `TODO: verificar` — FIFA reportó `FF0000` genérico (el mismo que Suiza y Austria). Se usó el rojo egipcio tradicional `#CE1126`, con el short y las medias negros que sí vistió.
- **Alternativa:** `shirt: #FFFFFF` · `accent: #000000`.
  Hex del kit alternativo que FIFA registró en el torneo.
  El motor la pone sola cuando la titular se confunde con la del rival
  (`ui/sprites.fieldKitVs`, umbral `CLASH_DIST` = 60 de distancia RGB). Se cambia
  siempre el rival, nunca la selección del jugador.
- **Arquero:** `shirt: #84CC16` · `accent: #0B0F19`.
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
