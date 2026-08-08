# Jordan (JOR) — Mundial 2026

> Investigación cruda para `data/teams.js`. **Auditable**: todo sale de las fuentes
> listadas al pie; nada acá está inventado. Lo que no se pudo confirmar va marcado
> `TODO: verificar`.

## Resultado en el torneo

- **Puesto final:** 44º de 48 — Eliminado en fase de grupos
- **Récord:** 0G 0E 3P · 3 goles a favor / 8 en contra
- **Grupo:** J

## Jordan — 3 partidos con alineación extraída

**Kits usados en el torneo (hex del reporte de FIFA):**
- #FFFFFF arm:#FFFFFF short:#FFFFFF medias:#FFFFFF (jor26h) — 2 partido(s)
- #FF0000 arm:#FF0000 short:#FF0000 medias:#FF0000 (jor26a) — 1 partido(s)

| # | Pos | Rol | Jugador | Tit | Sup | Min | G⚽ | Caps | GolSel | Club |
|---|-----|-----|---------|-----|-----|-----|----|------|--------|------|
| 1 | POR | GK | Yazeed Abulaila | 3 | 0 | 270 | 0 | 76 | 0 | Al-Hussein SC (Irbid) |
| 5 | DEF | CB | Yazan Al-Arab | 3 | 0 | 270 | 0 | 80 | 3 | FC Seoul |
| 8 | MED | CM | Noor Al-Rawabdeh | 3 | 0 | 270 | 0 | 68 | 3 | Selangor F.C. |
| 9 | DEL | CF | Ali Olwan | 3 | 0 | 270 | 1 | 66 | 29 | Al-Sailiya SC |
| 20 | MED | LM | Mohannad Abu Taha | 3 | 0 | 265 | 0 | 29 | 1 | Al-Quwa Al-Jawiya |
| 23 | DEF | RM | Ihsan Haddad | 3 | 0 | 262 | 0 | 92 | 2 | Al-Hussein SC (Irbid) |
| 3 | DEF | CB | Abdallah Nasib | 3 | 0 | 261 | 0 | 65 | 3 | Al-Zawraa SC |
| 21 | MED | CM | Nizar Al-Rashdan | 3 | 0 | 256 | 1 | 47 | 4 | Qatar SC |
| 10 | DEL | RF | Musa Al-Taamari | 2 | 1 | 216 | 1 | 92 | 24 | Stade Rennais FC |
| 4 | DEF | CB | Husam Abu Dahab | 2 | 0 | 180 | 0 | 18 | 0 | Al-Faisaly SC |
| 11 | DEL | LF | Odeh Al-Fakhouri | 2 | 1 | 149 | 0 | 10 | 1 | Pyramids FC |
| 13 | DEL | FW | Mahmoud Al-Mardi | 1 | 2 | 128 | 0 | 89 | 9 | Al-Hussein SC (Irbid) |
| 16 | DEF | CB | Mo Abualnadi | 1 | 0 | 72 | 0 | 18 | 0 | Selangor F.C. |
| 24 | DEL | FW | Ali Azaizeh | 1 | 2 | 53 | 0 | 4 | 0 | Al Shabab Club |
| 17 | DEF | DF | Salim Obaid | 0 | 3 | 18 | 0 | 11 | 0 | Al-Hussein SC (Irbid) |
| 6 | MED | MF | Amer Jamous | 0 | 1 | 14 | 0 | 19 | 1 | Al-Zawraa SC |
| 19 | DEF | DF | Saed Al-Rosan | 0 | 1 | 9 | 0 | 21 | 2 | Al-Hussein SC (Irbid) |
| 2 | DEF | MF | Mohammad Abu Hashish | 0 | 1 | 5 | 0 | 56 | 1 | Al-Karma SC |
| 25 | MED | MF | Mohammad Al-Dawoud | 0 | 1 | 2 | 0 | 13 | 1 | Al-Wehdat SC |
| 7 | DEL | FW | Mohammad Abu Zrayq | 0 | 2 | 0 | 0 | 41 | 5 | Raja CA |

**Convocados sin minutos:** 12 Nour Bani Attiah (POR, 5 caps) · 14 Rajaei Ayed (MED, 72 caps) · 15 Ibrahim Sadeh (MED, 57 caps) · 18 Mohammad Taha (MED, 2 caps) · 22 Abdallah Al-Fakhouri (POR, 11 caps) · 26 Anas Badawi (DEF, 1 caps)

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

- **Ancla:** 66 (el `rating` que tenía como rival antes de la conversión).
- **Resultado:** `teamRating` = **65** → Δ-1, dentro de la banda ±3 acordada con el PO.
- Vara: nivel de club a jun-2026 (la misma que los 23 planteles que ya estaban), con el
  rendimiento del Mundial usado como modificador **dentro** del equipo — decide quién entra
  al 10 y quién queda de 11º, no infla la selección entera.

Notas (`naturalOverall`, sin momento y en su puesto):

- 69 — Musa Al-Taamari (DEL, #10)
- 66 — Ali Olwan (DEL, #9)
- 64 — Noor Al-Rawabdeh (MED, #8)
- 64 — Nizar Al-Rashdan (MED, #21)
- 63 — Yazeed Abulaila (POR, #1)
- 63 — Yazan Al-Arab (DEF, #5)
- 62 — Abdallah Nasib (DEF, #3)
- 62 — Mohannad Abu Taha (MED, #20)
- 61 — Ihsan Haddad (DEF, #23)
- 58 — Abdallah Al-Fakhouri (POR, #22)

### Kit

- **Campo:** `shirt: #FFFFFF` · `accent: #CE1126`.
  Hex exacto del torneo: blanco `FFFFFF` en 2 de 3 (`jor26h`). El alternativo real era rojo `FF0000`.
- **Alternativa:** `shirt: #FF0000` · `accent: #CE1126`.
  Hex del kit alternativo que FIFA registró en el torneo.
  El motor la pone sola cuando la titular se confunde con la del rival
  (`ui/sprites.fieldKitVs`, umbral `CLASH_DIST` = 60 de distancia RGB). Se cambia
  siempre el rival, nunca la selección del jugador.
- **Arquero:** `shirt: #0369A1` · `accent: #F8FAFC`.
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
