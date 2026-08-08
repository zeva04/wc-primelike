# Qatar (QAT) — Mundial 2026

> Investigación cruda para `data/teams.js`. **Auditable**: todo sale de las fuentes
> listadas al pie; nada acá está inventado. Lo que no se pudo confirmar va marcado
> `TODO: verificar`.

## Resultado en el torneo

- **Puesto final:** 41º de 48 — Eliminado en fase de grupos
- **Récord:** 0G 1E 2P · 2 goles a favor / 10 en contra
- **Grupo:** B

## Qatar — 3 partidos con alineación extraída

**Kits usados en el torneo (hex del reporte de FIFA):**
- #7c202b arm:#7c202b short:#7c202b medias:#7c202b (qat26hA) — 1 partido(s)
- #FFFFFF arm:#FFFFFF short:#FFFFFF medias:#7c202b (qat26a) — 1 partido(s)
- #FFFFFF arm:#FFFFFF short:#FFFFFF medias:#FFFFFF (qat26a) — 1 partido(s)

| # | Pos | Rol | Jugador | Tit | Sup | Min | G⚽ | Caps | GolSel | Club |
|---|-----|-----|---------|-----|-----|-----|----|------|--------|------|
| 1 | POR | GK | Mahmud Abunada | 3 | 0 | 270 | 0 | 6 | 0 | Al-Rayyan SC |
| 2 | DEF | CB | Pedro Miguel | 3 | 0 | 270 | 0 | 105 | 3 | Al Sadd SC |
| 16 | DEF | CB | Boualem Khoukhi | 3 | 0 | 270 | 0 | 116 | 20 | Al Sadd SC |
| 4 | DEF | CM | Issa Laye | 3 | 0 | 270 | 0 | 4 | 0 | Al-Arabi SC (Qatar) |
| 11 | DEL | LW | Akram Afif | 3 | 0 | 239 | 0 | 125 | 39 | Al Sadd SC |
| 8 | DEL | RF | Edmilson Junior | 3 | 0 | 213 | 0 | 16 | 0 | Al Duhail SC |
| 14 | DEF | LB | Homam Ahmed | 2 | 0 | 180 | 0 | 68 | 3 | Cultural y Deportiva Leonesa |
| 23 | MED | AM | Assim Madibo | 2 | 0 | 169 | 0 | 51 | 0 | Al-Wakrah SC |
| 20 | MED | MF | Ahmed Fathy | 1 | 2 | 153 | 0 | 48 | 0 | Al-Arabi SC (Qatar) |
| 5 | DEF | CM | Jassem Gaber | 3 | 0 | 152 | 0 | 32 | 1 | Al-Rayyan SC |
| 13 | DEF | RB | Ayoub Al-Oui | 2 | 0 | 150 | 0 | 6 | 0 | Al-Gharafa SC |
| 18 | DEF | DF | Sultan Al-Brake | 1 | 1 | 140 | 0 | 17 | 0 | Al Duhail SC |
| 12 | MED | MF | Karim Boudiaf | 1 | 1 | 102 | 0 | 118 | 5 | Al Duhail SC |
| 15 | DEL | CF | Yusuf Abdurisag | 2 | 0 | 100 | 0 | 39 | 3 | Al-Wakrah SC |
| 26 | DEL | MF | Mohamed Manai | 0 | 3 | 66 | 0 | 10 | 0 | Al-Shamal SC |
| 10 | DEL | FW | Hassan Al-Haydos | 1 | 1 | 57 | 1 | 186 | 41 | Al Sadd SC |
| 6 | MED | MF | Abdulaziz Hatem | 0 | 1 | 44 | 0 | 119 | 11 | Al-Rayyan SC |
| 7 | DEL | FW | Ahmed Alaaeldin | 0 | 2 | 41 | 0 | 68 | 9 | Al-Rayyan SC |
| 17 | MED | FW | Ahmed Al-Ganehi | 0 | 1 | 35 | 0 | 13 | 1 | Al-Gharafa SC |
| 25 | DEF | DF | Al-Hashmi Al-Hussain | 0 | 1 | 31 | 0 | 8 | 0 | Al-Arabi SC (Qatar) |
| 19 | DEL | FW | Almoez Ali | 0 | 1 | 18 | 0 | 115 | 55 | Al Duhail SC |
| 3 | DEF | DF | Lucas Mendes | 0 | 1 | 3 | 1 | 25 | 1 | Al-Wakrah SC |

**Convocados sin minutos:** 9 Mohammed Muntari (DEL, 67 caps) · 21 Salah Zakaria (POR, 8 caps) · 22 Meshaal Barsham (POR, 52 caps) · 24 Tahsin Jamshid (DEL, 3 caps)

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

- **Ancla:** 67 (el `rating` que tenía como rival antes de la conversión).
- **Resultado:** `teamRating` = **65** → Δ-2, dentro de la banda ±3 acordada con el PO.
- Vara: nivel de club a jun-2026 (la misma que los 23 planteles que ya estaban), con el
  rendimiento del Mundial usado como modificador **dentro** del equipo — decide quién entra
  al 10 y quién queda de 11º, no infla la selección entera.

Notas (`naturalOverall`, sin momento y en su puesto):

- 69 — Akram Afif (DEL, #11)
- 65 — Boualem Khoukhi (DEF, #16)
- 65 — Edmilson Junior (DEL, #8)
- 63 — Pedro Miguel (DEF, #2)
- 63 — Assim Madibo (MED, #23)
- 62 — Mahmud Abunada (POR, #1)
- 62 — Meshaal Barsham (POR, #22)
- 62 — Issa Laye (DEF, #4)
- 62 — Ahmed Fathy (MED, #20)
- 60 — Karim Boudiaf (MED, #12)

### Kit

- **Campo:** `shirt: #7C202B` · `accent: #FFFFFF`.
  Hex exacto del torneo: **granate** `7c202b` (`qat26hA`, el titular). Vistió blanco en 2 de 3 como visitante.
- **Alternativa:** `shirt: #FFFFFF` · `accent: #7C202B`.
  Hex del kit alternativo que FIFA registró en el torneo.
  El motor la pone sola cuando la titular se confunde con la del rival
  (`ui/sprites.fieldKitVs`, umbral `CLASH_DIST` = 60 de distancia RGB). Se cambia
  siempre el rival, nunca la selección del jugador.
- **Arquero:** `shirt: #22C55E` · `accent: #0B0F19`.
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
