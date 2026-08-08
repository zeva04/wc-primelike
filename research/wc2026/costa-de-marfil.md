# Ivory Coast (CIV) — Mundial 2026

> Investigación cruda para `data/teams.js`. **Auditable**: todo sale de las fuentes
> listadas al pie; nada acá está inventado. Lo que no se pudo confirmar va marcado
> `TODO: verificar`.

## Resultado en el torneo

- **Puesto final:** 19º de 48 — Eliminado en 16avos de final
- **Récord:** 2G 0E 2P · 5 goles a favor / 4 en contra
- **Grupo:** E

## Ivory Coast — 4 partidos con alineación extraída

**Kits usados en el torneo (hex del reporte de FIFA):**
- #ff7d1d arm:#ff7d1d short:#ff7d1d medias:#ff7d1d (civ26h) — 4 partido(s)

| # | Pos | Rol | Jugador | Tit | Sup | Min | G⚽ | Caps | GolSel | Club |
|---|-----|-----|---------|-----|-----|-----|----|------|--------|------|
| 1 | POR | GK | Yahia Fofana | 4 | 0 | 360 | 0 | 35 | 0 | Çaykur Rizespor |
| 8 | MED | CM | Franck Kessié | 4 | 0 | 347 | 1 | 102 | 15 | Al-Ahli Saudi FC |
| 11 | DEL | LF | Yan Diomande | 4 | 0 | 332 | 0 | 10 | 3 | RB Leipzig |
| 17 | DEF | RB | Guéla Doué | 3 | 1 | 277 | 1 | 20 | 3 | RC Strasbourg Alsace |
| 7 | DEF | CB | Odilon Kossounou | 3 | 1 | 271 | 0 | 36 | 0 | Atalanta BC |
| 20 | DEF | CB | Emmanuel Agbadou | 3 | 0 | 270 | 0 | 20 | 2 | Beşiktaş J.K. |
| 3 | DEF | LB | Ghislain Konan | 3 | 0 | 270 | 0 | 54 | 0 | Gil Vicente F.C. |
| 18 | MED | DM | Ibrahim Sangaré | 3 | 1 | 268 | 0 | 57 | 12 | Nottingham Forest F.C. |
| 19 | DEL | CF | Nicolas Pépé | 3 | 1 | 236 | 2 | 56 | 12 | Villarreal CF |
| 9 | DEL | CF | Ange-Yoan Bonny | 3 | 1 | 236 | 0 | 1 | 0 | Inter Milan |
| 26 | MED | MF | Christ Inao Oulaï | 2 | 2 | 207 | 0 | 9 | 0 | Trabzonspor |
| 15 | DEL | FW | Amad Diallo | 2 | 2 | 185 | 2 | 19 | 6 | Manchester United F.C. |
| 5 | DEF | CB | Wilfried Singo | 2 | 0 | 172 | 0 | 34 | 1 | Galatasaray S.K. (football) |
| 12 | DEL | FW | Elye Wahi | 1 | 2 | 109 | 0 | 2 | 0 | OGC Nice |
| 6 | MED | CM | Seko Fofana | 1 | 1 | 92 | 0 | 33 | 7 | FC Porto |
| 2 | DEF | CB | Ousmane Diomande | 1 | 0 | 90 | 0 | 15 | 1 | Sporting CP |
| 13 | DEF | LB | Christopher Opéri | 1 | 0 | 90 | 0 | 12 | 0 | İstanbul Başakşehir F.K. |
| 24 | DEL | FW | Bazoumana Touré | 1 | 2 | 79 | 0 | 6 | 2 | TSG 1899 Hoffenheim |
| 14 | DEL | FW | Oumar Diakité | 0 | 2 | 26 | 0 | 30 | 6 | Cercle Brugge KSV |
| 10 | DEL | FW | Simon Adingra | 0 | 1 | 15 | 0 | 29 | 5 | AS Monaco FC |
| 22 | DEL | FW | Evann Guessand | 0 | 2 | 15 | 0 | 21 | 4 | Crystal Palace F.C. |
| 4 | MED | MF | Jean Michaël Seri | 0 | 1 | 13 | 0 | 65 | 4 | NK Maribor |

**Convocados sin minutos:** 16 Mohamed Koné (POR, 0 caps) · 21 Evan Ndicka (DEF, 28 caps) · 23 Alban Lafont (POR, 4 caps) · 25 Parfait Guiagon (MED, 5 caps)

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
- **Resultado:** `teamRating` = **74** → Δ+0, dentro de la banda ±3 acordada con el PO.
- Vara: nivel de club a jun-2026 (la misma que los 23 planteles que ya estaban), con el
  rendimiento del Mundial usado como modificador **dentro** del equipo — decide quién entra
  al 10 y quién queda de 11º, no infla la selección entera.

Notas (`naturalOverall`, sin momento y en su puesto):

- 76 — Franck Kessié (MED, #8)
- 75 — Yan Diomande (DEL, #11)
- 75 — Nicolas Pépé (DEL, #19)
- 74 — Odilon Kossounou (DEF, #7)
- 72 — Yahia Fofana (POR, #1)
- 72 — Emmanuel Agbadou (DEF, #20)
- 71 — Guéla Doué (DEF, #17)
- 70 — Ibrahim Sangaré (MED, #18)
- 70 — Christ Inao Oulaï (MED, #26)
- 69 — Alban Lafont (POR, #23)

### Kit

- **Campo:** `shirt: #FF7D1D` · `accent: #FFFFFF`.
  Hex exacto del torneo: naranja `ff7d1d`, el ÚNICO kit que usó en los 4 partidos. `TODO: verificar` el contraste — queda a distancia 21 del naranja de Países Bajos (`#F36C21`), que es el choque más cerrado de todo el juego.
- **Alternativa:** `shirt: #FFFFFF` · `accent: #FF7D1D`.
  `TODO: verificar` — no está en los reportes de FIFA. away 2026: base blanca limpia con patrón tonal, enmarcada en naranja y verde. El hex EXACTO no está confirmado.
  El motor la pone sola cuando la titular se confunde con la del rival
  (`ui/sprites.fieldKitVs`, umbral `CLASH_DIST` = 60 de distancia RGB). Se cambia
  siempre el rival, nunca la selección del jugador.
- **Arquero:** `shirt: #0D9488` · `accent: #0B0F19`.
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
