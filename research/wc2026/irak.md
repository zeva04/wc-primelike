# Iraq (IRQ) — Mundial 2026

> Investigación cruda para `data/teams.js`. **Auditable**: todo sale de las fuentes
> listadas al pie; nada acá está inventado. Lo que no se pudo confirmar va marcado
> `TODO: verificar`.

## Resultado en el torneo

- **Puesto final:** 48º de 48 — Eliminado en fase de grupos
- **Récord:** 0G 0E 3P · 1 goles a favor / 12 en contra
- **Grupo:** I

## Iraq — 3 partidos con alineación extraída

**Kits usados en el torneo (hex del reporte de FIFA):**
- #FFFFFF arm:#FFFFFF short:#FFFFFF medias:#FFFFFF (iraq26h) — 2 partido(s)
- #228a59 arm:#228a59 short:#228a59 medias:#228a59 (iraq26a) — 1 partido(s)

| # | Pos | Rol | Jugador | Tit | Sup | Min | G⚽ | Caps | GolSel | Club |
|---|-----|-----|---------|-----|-----|-----|----|------|--------|------|
| 5 | DEF | CB | Akam Hashim | 3 | 0 | 270 | 0 | 14 | 1 | Al-Zawraa SC |
| 23 | DEF | LB | Merchas Doski | 3 | 0 | 270 | 0 | 31 | 1 | FC Viktoria Plzeň |
| 16 | MED | CM | Amir Al-Ammari | 3 | 0 | 248 | 0 | 51 | 3 | KS Cracovia |
| 8 | MED | RM | Ibrahim Bayesh | 3 | 0 | 236 | 0 | 76 | 8 | Al Dhafra FC |
| 14 | MED | MF | Zidane Iqbal | 2 | 1 | 188 | 0 | 25 | 2 | FC Utrecht |
| 9 | DEL | CF | Ali Al-Hamadi | 2 | 1 | 180 | 0 | 20 | 5 | Luton Town F.C. |
| 3 | DEF | RB | Hussein Ali | 2 | 0 | 163 | 0 | 27 | 1 | Pogoń Szczecin |
| 4 | DEF | CB | Zaid Tahseen | 2 | 0 | 150 | 0 | 28 | 1 | Pakhtakor FC |
| 22 | POR | GK | Ahmed Basil | 2 | 0 | 136 | 0 | 16 | 0 | Al-Shorta SC |
| 12 | POR | GK | Jalal Hassan | 1 | 1 | 134 | 0 | 102 | 0 | Al-Zawraa SC |
| 17 | DEL | LM | Ali Jasim | 2 | 0 | 130 | 0 | 36 | 2 | Al-Najma SC (Saudi Arabia) |
| 11 | DEL | MF | Ahmed Qasem | 2 | 1 | 123 | 0 | 3 | 0 | Nashville SC |
| 2 | DEF | DF | Rebin Sulaka | 1 | 1 | 120 | 0 | 56 | 1 | Port F.C. |
| 24 | MED | CM | Zaid Ismail | 2 | 0 | 119 | 0 | 6 | 0 | Al-Talaba SC |
| 18 | DEL | CF | Aymen Hussein | 2 | 0 | 116 | 1 | 95 | 33 | Al-Karma SC |
| 26 | DEF | RB | Frans Putros | 1 | 0 | 90 | 0 | 28 | 0 | Persib Bandung |
| 6 | DEF | DF | Manaf Younis | 0 | 1 | 74 | 0 | 34 | 1 | Al-Shorta SC |
| 21 | DEL | MF | Marko Farji | 0 | 2 | 53 | 0 | 12 | 0 | Venezia FC |
| 15 | DEF | DF | Ahmed Maknzi | 0 | 1 | 33 | 0 | 7 | 0 | Al-Karma SC |
| 13 | DEL | FW | Ali Yousif | 0 | 1 | 33 | 0 | 7 | 1 | Al-Talaba SC |
| 7 | MED | MF | Youssef Amyn | 0 | 1 | 30 | 0 | 27 | 2 | AEK Larnaca FC |
| 19 | MED | MF | Kevin Yakob | 0 | 1 | 23 | 0 | 9 | 0 | Aarhus Gymnastikforening |
| 20 | MED | MF | Aimar Sher | 0 | 1 | 22 | 0 | 7 | 0 | Sarpsborg 08 FF |
| 25 | DEF | DF | Mustafa Saadoon | 0 | 1 | 17 | 0 | 17 | 0 | Al-Shorta SC |
| 10 | DEL | FW | Mohanad Ali | 0 | 1 | 12 | 0 | 72 | 27 | Dibba FC |

**Convocados sin minutos:** 1 Fahad Talib (POR, 21 caps)

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
- **Resultado:** `teamRating` = **67** → Δ-2, dentro de la banda ±3 acordada con el PO.
- Vara: nivel de club a jun-2026 (la misma que los 23 planteles que ya estaban), con el
  rendimiento del Mundial usado como modificador **dentro** del equipo — decide quién entra
  al 10 y quién queda de 11º, no infla la selección entera.

Notas (`naturalOverall`, sin momento y en su puesto):

- 68 — Ali Al-Hamadi (DEL, #9)
- 67 — Amir Al-Ammari (MED, #16)
- 66 — Merchas Doski (DEF, #23)
- 66 — Ibrahim Bayesh (MED, #8)
- 66 — Zidane Iqbal (MED, #14)
- 66 — Ali Jasim (DEL, #17)
- 64 — Jalal Hassan (POR, #12)
- 64 — Akam Hashim (DEF, #5)
- 63 — Ahmed Basil (POR, #22)
- 63 — Hussein Ali (DEF, #3)

### Kit

- **Campo:** `shirt: #FFFFFF` · `accent: #007A3D`.
  Hex exacto del torneo: blanco `FFFFFF` en 2 de 3 (`iraq26h`). El alternativo real era verde `228a59`.
- **Alternativa:** `shirt: #228A59` · `accent: #FFFFFF`.
  Hex del kit alternativo que FIFA registró en el torneo.
  El motor la pone sola cuando la titular se confunde con la del rival
  (`ui/sprites.fieldKitVs`, umbral `CLASH_DIST` = 60 de distancia RGB). Se cambia
  siempre el rival, nunca la selección del jugador.
- **Arquero:** `shirt: #C2410C` · `accent: #0B0F19`.
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
