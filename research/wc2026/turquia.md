# Turkey (TUR) — Mundial 2026

> Investigación cruda para `data/teams.js`. **Auditable**: todo sale de las fuentes
> listadas al pie; nada acá está inventado. Lo que no se pudo confirmar va marcado
> `TODO: verificar`.

## Resultado en el torneo

- **Puesto final:** 35º de 48 — Eliminado en fase de grupos
- **Récord:** 1G 0E 2P · 3 goles a favor / 5 en contra
- **Grupo:** D

## Turkey — 3 partidos con alineación extraída

**Kits usados en el torneo (hex del reporte de FIFA):**
- #FFFFFF arm:#FFFFFF short:#FFFFFF medias:#FFFFFF (tur26h) — 2 partido(s)
- #FF0000 arm:#FF0000 short:#FF0000 medias:#FF0000 (tur26a) — 1 partido(s)

| # | Pos | Rol | Jugador | Tit | Sup | Min | G⚽ | Caps | GolSel | Club |
|---|-----|-----|---------|-----|-----|-----|----|------|--------|------|
| 23 | POR | GK | Uğurcan Çakır | 3 | 0 | 270 | 0 | 39 | 0 | Galatasaray S.K. (football) |
| 8 | DEL | RW | Arda Güler | 3 | 0 | 270 | 1 | 29 | 6 | Real Madrid CF |
| 14 | DEF | CB | Abdülkerim Bardakcı | 3 | 0 | 266 | 0 | 27 | 2 | Galatasaray S.K. (football) |
| 11 | DEL | FW | Kenan Yıldız | 2 | 1 | 218 | 0 | 28 | 5 | Juventus FC |
| 3 | DEF | CB | Merih Demiral | 2 | 0 | 180 | 0 | 62 | 6 | Al-Ahli Saudi FC |
| 10 | MED | CM | Hakan Çalhanoğlu | 2 | 0 | 180 | 0 | 105 | 22 | Inter Milan |
| 2 | DEF | RB | Zeki Çelik | 2 | 0 | 164 | 0 | 61 | 3 | AS Roma |
| 20 | DEF | LB | Ferdi Kadıoğlu | 2 | 0 | 160 | 0 | 30 | 2 | Brighton & Hove Albion F.C. |
| 6 | MED | AM | Orkun Kökçü | 2 | 1 | 154 | 0 | 50 | 4 | Beşiktaş J.K. |
| 16 | MED | CM | İsmail Yüksek | 2 | 0 | 140 | 0 | 32 | 1 | Fenerbahçe S.K. (football) |
| 21 | DEL | LW | Barış Alper Yılmaz | 2 | 0 | 136 | 1 | 35 | 4 | Galatasaray S.K. (football) |
| 7 | DEL | CF | Kerem Aktürkoğlu | 2 | 0 | 131 | 0 | 52 | 15 | Fenerbahçe S.K. (football) |
| 13 | DEF | DF | Eren Elmalı | 1 | 1 | 110 | 0 | 23 | 0 | Galatasaray S.K. (football) |
| 5 | MED | MF | Salih Özcan | 1 | 1 | 100 | 0 | 30 | 1 | Borussia Dortmund |
| 18 | DEF | DF | Mert Müldür | 1 | 2 | 100 | 0 | 45 | 3 | Fenerbahçe S.K. (football) |
| 15 | DEF | CB | Ozan Kabak | 1 | 0 | 90 | 0 | 30 | 2 | TSG 1899 Hoffenheim |
| 24 | DEL | RM | Oğuz Aydın | 1 | 0 | 90 | 0 | 11 | 0 | Fenerbahçe S.K. (football) |
| 19 | DEL | FW | Yunus Akgün | 1 | 1 | 88 | 0 | 19 | 4 | Galatasaray S.K. (football) |
| 21 | DEL | FW | Barış Yılmaz | 0 | 1 | 44 | 1 | 35 | 4 | Galatasaray S.K. (football) |
| 26 | DEL | FW | Can Uzun | 0 | 2 | 36 | 0 | 6 | 1 | Eintracht Frankfurt |
| 9 | DEL | FW | Deniz Gül | 0 | 2 | 35 | 0 | 8 | 2 | FC Porto |
| 4 | DEF | DF | Çağlar Söyüncü | 0 | 1 | 6 | 0 | 60 | 2 | Fenerbahçe S.K. (football) |
| 22 | MED | DF | Kaan Ayhan | 0 | 1 | 2 | 1 | 73 | 5 | Galatasaray S.K. (football) |
| 17 | DEL | MF | İrfan Can Kahveci | 0 | 1 | 0 | 0 | 47 | 6 | Kasımpaşa S.K. |

**Convocados sin minutos:** 1 Mert Günok (POR, 37 caps) · 12 Altay Bayındır (POR, 12 caps) · 25 Samet Akaydin (DEF, 19 caps)

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

- **Ancla:** 79 (el `rating` que tenía como rival antes de la conversión).
- **Resultado:** `teamRating` = **78** → Δ-1, dentro de la banda ±3 acordada con el PO.
- Vara: nivel de club a jun-2026 (la misma que los 23 planteles que ya estaban), con el
  rendimiento del Mundial usado como modificador **dentro** del equipo — decide quién entra
  al 10 y quién queda de 11º, no infla la selección entera.

Notas (`naturalOverall`, sin momento y en su puesto):

- 81 — Hakan Çalhanoğlu (MED, #10)
- 79 — Kenan Yıldız (DEL, #11)
- 78 — Arda Güler (DEL, #8)
- 77 — Uğurcan Çakır (POR, #23)
- 77 — Orkun Kökçü (MED, #6)
- 76 — Merih Demiral (DEF, #3)
- 74 — Abdülkerim Bardakcı (DEF, #14)
- 74 — Ferdi Kadıoğlu (DEF, #20)
- 72 — Altay Bayındır (POR, #12)
- 72 — İsmail Yüksek (MED, #16)

### Kit

- **Campo:** `shirt: #FFFFFF` · `accent: #E30A17`.
  `TODO: verificar` — en el Mundial vistió **blanco** en 2 de 3 partidos y rojo en 1. Los archivos de kit de Wikipedia etiquetan el blanco como titular (`_tur26h`), pero el titular histórico de Turquía es rojo. Se usó el blanco (lo que más vistió) para el kit y el rojo para el tinte de UI (`colors.primary`), que es la identidad nacional.
- **Alternativa:** `shirt: #FF0000` · `accent: #FFFFFF`.
  Hex del kit alternativo que FIFA registró en el torneo.
  El motor la pone sola cuando la titular se confunde con la del rival
  (`ui/sprites.fieldKitVs`, umbral `CLASH_DIST` = 60 de distancia RGB). Se cambia
  siempre el rival, nunca la selección del jugador.
- **Arquero:** `shirt: #4338CA` · `accent: #F8FAFC`.
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
