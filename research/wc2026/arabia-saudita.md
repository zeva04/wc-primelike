# Saudi Arabia (KSA) — Mundial 2026

> Investigación cruda para `data/teams.js`. **Auditable**: todo sale de las fuentes
> listadas al pie; nada acá está inventado. Lo que no se pudo confirmar va marcado
> `TODO: verificar`.

## Resultado en el torneo

- **Puesto final:** 38º de 48 — Eliminado en fase de grupos
- **Récord:** 0G 2E 1P · 1 goles a favor / 5 en contra
- **Grupo:** H

## Saudi Arabia — 3 partidos con alineación extraída

**Kits usados en el torneo (hex del reporte de FIFA):**
- #FFFFFF arm:#FFFFFF short:#FFFFFF medias:#FFFFFF (ksa26a) — 2 partido(s)
- #43b88b arm:#43b88b short:#43b88b medias:#004B49 (ksa26hA) — 1 partido(s)

| # | Pos | Rol | Jugador | Tit | Sup | Min | G⚽ | Caps | GolSel | Club |
|---|-----|-----|---------|-----|-----|-----|----|------|--------|------|
| 21 | POR | GK | Mohammed Al-Owais | 3 | 0 | 270 | 0 | 65 | 0 | Al-Ula FC |
| 12 | DEF | RB | Saud Abdulhamid | 3 | 0 | 270 | 0 | 55 | 1 | RC Lens |
| 10 | DEL | LM | Salem Al-Dawsari | 3 | 0 | 245 | 0 | 111 | 27 | Al Hilal SFC |
| 4 | DEF | CB | Abdulelah Al-Amri | 3 | 0 | 240 | 1 | 44 | 1 | Al-Nassr FC |
| 9 | DEL | CF | Firas Al-Buraikan | 3 | 0 | 240 | 0 | 72 | 16 | Al-Ahli Saudi FC |
| 23 | MED | CM | Mohamed Kanno | 2 | 1 | 224 | 0 | 79 | 8 | Al Hilal SFC |
| 5 | DEF | CB | Hassan Al-Tambakti | 3 | 0 | 213 | 0 | 54 | 1 | Al Hilal SFC |
| 6 | MED | CM | Nasser Al-Dawsari | 2 | 1 | 207 | 0 | 47 | 1 | Al Hilal SFC |
| 24 | DEF | LB | Moteb Al-Harbi | 2 | 1 | 188 | 0 | 13 | 0 | Al Hilal SFC |
| 15 | MED | CM | Abdullah Al-Khaibari | 3 | 0 | 182 | 0 | 42 | 0 | Al-Nassr FC |
| 7 | MED | CF | Musab Al-Juwayr | 2 | 1 | 153 | 0 | 37 | 6 | Al Qadsiah FC |
| 3 | DEF | DF | Ali Lajami | 1 | 2 | 147 | 0 | 24 | 1 | Al Hilal SFC |
| 26 | DEF | DF | Mohammed Abu Al-Shamat | 1 | 2 | 136 | 0 | 8 | 0 | Al Qadsiah FC |
| 13 | DEF | DF | Nawaf Boushal | 1 | 1 | 91 | 0 | 27 | 0 | Al-Nassr FC |
| 19 | DEL | FW | Abdullah Al-Hamdan | 0 | 3 | 69 | 0 | 52 | 13 | Al-Nassr FC |
| 20 | DEL | RM | Sultan Mandash | 1 | 0 | 65 | 0 | 7 | 2 | Al Hilal SFC |
| 18 | MED | MF | Alaa Al-Hejji | 0 | 2 | 30 | 0 | 3 | 0 | Neom SC |
| 17 | DEL | FW | Khalid Al-Ghannam | 0 | 1 | 0 | 0 | 7 | 0 | Al-Ettifaq Club |

**Convocados sin minutos:** 1 Nawaf Al-Aqidi (POR, 24 caps) · 2 Ali Majrashi (DEF, 21 caps) · 8 Ayman Yahya (DEL, 26 caps) · 11 Saleh Al-Shehri (DEL, 59 caps) · 14 Hassan Kadesh (DEF, 21 caps) · 16 Ziyad Al-Johani (MED, 12 caps) · 22 Ahmed Al-Kassar (POR, 9 caps) · 25 Jehad Thakri (DEF, 8 caps)

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

- **Ancla:** 68 (el `rating` que tenía como rival antes de la conversión).
- **Resultado:** `teamRating` = **68** → Δ+0, dentro de la banda ±3 acordada con el PO.
- Vara: nivel de club a jun-2026 (la misma que los 23 planteles que ya estaban), con el
  rendimiento del Mundial usado como modificador **dentro** del equipo — decide quién entra
  al 10 y quién queda de 11º, no infla la selección entera.

Notas (`naturalOverall`, sin momento y en su puesto):

- 71 — Salem Al-Dawsari (DEL, #10)
- 69 — Firas Al-Buraikan (DEL, #9)
- 68 — Mohammed Al-Owais (POR, #21)
- 66 — Abdulelah Al-Amri (DEF, #4)
- 66 — Hassan Al-Tambakti (DEF, #5)
- 66 — Mohamed Kanno (MED, #23)
- 66 — Nasser Al-Dawsari (MED, #6)
- 65 — Saud Abdulhamid (DEF, #12)
- 63 — Nawaf Al-Aqidi (POR, #1)
- 63 — Abdullah Al-Khaibari (MED, #15)

### Kit

- **Campo:** `shirt: #43B88B` · `accent: #FFFFFF`.
  Hex exacto del torneo: **verde** `43b88b` (`ksa26hA`, el titular). Vistió blanco en 2 de 3 partidos como visitante. Es el kit más distintivo de la tanda.
- **Alternativa:** `shirt: #FFFFFF` · `accent: #43B88B`.
  Hex del kit alternativo que FIFA registró en el torneo.
  El motor la pone sola cuando la titular se confunde con la del rival
  (`ui/sprites.fieldKitVs`, umbral `CLASH_DIST` = 60 de distancia RGB). Se cambia
  siempre el rival, nunca la selección del jugador.
- **Arquero:** `shirt: #B45309` · `accent: #F8FAFC`.
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
