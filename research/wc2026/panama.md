# Panama (PAN) — Mundial 2026

> Investigación cruda para `data/teams.js`. **Auditable**: todo sale de las fuentes
> listadas al pie; nada acá está inventado. Lo que no se pudo confirmar va marcado
> `TODO: verificar`.

## Resultado en el torneo

- **Puesto final:** 43º de 48 — Eliminado en fase de grupos
- **Récord:** 0G 0E 3P · 0 goles a favor / 4 en contra
- **Grupo:** L

## Panama — 3 partidos con alineación extraída

**Kits usados en el torneo (hex del reporte de FIFA):**
- #FF0000 arm:#FF0000 short:#FF0000 medias:#FF0000 (pan26h) — 1 partido(s)
- #000080 arm:#000080 short:#000080 medias:#000080 (pan26t) — 1 partido(s)
- #FFFFFF arm:#FFFFFF short:#FFFFFF medias:#FFFFFF (pan26a) — 1 partido(s)

| # | Pos | Rol | Jugador | Tit | Sup | Min | G⚽ | Caps | GolSel | Club |
|---|-----|-----|---------|-----|-----|-----|----|------|--------|------|
| 22 | POR | GK | Orlando Mosquera | 3 | 0 | 270 | 0 | 48 | 0 | Al-Fayha Club |
| 3 | DEF | CB | José Córdoba | 3 | 0 | 270 | 0 | 32 | 1 | Norwich City F.C. |
| 16 | DEF | CB | Andrés Andrade | 3 | 0 | 270 | 0 | 50 | 1 | LASK |
| 23 | DEF | RM | Michael Amir Murillo | 3 | 0 | 270 | 0 | 94 | 9 | Beşiktaş J.K. |
| 14 | DEF | CM | Carlos Harvey | 3 | 0 | 268 | 0 | 28 | 3 | Minnesota United FC |
| 11 | MED | CM | Yoel Bárcenas | 3 | 0 | 251 | 0 | 104 | 10 | Mazatlán F.C. |
| 6 | MED | RF | Cristian Martínez | 3 | 0 | 243 | 3 | 66 | 2 | Hapoel Ironi Kiryat Shmona F.C. |
| 7 | MED | LF | José Luis Rodríguez | 3 | 0 | 235 | 0 | 70 | 8 | FC Juárez |
| 2 | DEF | LM | César Blackman | 2 | 0 | 180 | 0 | 40 | 3 | ŠK Slovan Bratislava |
| 13 | DEF | CB | Jiovany Ramos | 2 | 0 | 167 | 1 | 23 | 2 | Academia Puerto Cabello |
| 17 | DEL | FW | José Fajardo | 1 | 2 | 154 | 0 | 68 | 17 | C.D. Universidad Católica (Ecuador) |
| 4 | DEF | CB | Fidel Escobar | 1 | 0 | 90 | 0 | 99 | 4 | Deportivo Saprissa |
| 26 | DEF | LM | Jorge Gutiérrez | 1 | 0 | 88 | 0 | 18 | 0 | Deportivo La Guaira F.C. |
| 18 | DEL | CF | Cecilio Waterman | 1 | 1 | 76 | 0 | 55 | 15 | C.D. Universidad de Concepción |
| 24 | DEL | FW | Azarias Londoño | 0 | 3 | 53 | 0 | 11 | 0 | C.D. Universidad Católica (Ecuador) |
| 9 | DEL | FW | Tomás Rodríguez | 1 | 1 | 46 | 0 | 13 | 4 | Deportivo Saprissa |
| 10 | MED | MF | Ismael Díaz | 0 | 2 | 35 | 1 | 57 | 17 | Club León |
| 15 | DEF | DF | Eric Davis | 0 | 2 | 2 | 0 | 107 | 9 | C.D. Plaza Amador |
| 19 | MED | MF | Alberto Quintero | 0 | 1 | 2 | 0 | 141 | 7 | C.D. Plaza Amador |
| 20 | MED | MF | Aníbal Godoy | 0 | 1 | 0 | 0 | 159 | 4 | San Diego FC |

**Convocados sin minutos:** 1 Luis Mejía (POR, 56 caps) · 5 Edgardo Fariña (DEF, 18 caps) · 8 Adalberto Carrasquilla (MED, 73 caps) · 12 César Samudio (POR, 5 caps) · 21 César Yanis (MED, 56 caps) · 25 Roderick Miller (DEF, 50 caps)

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
- **Resultado:** `teamRating` = **70** → Δ+2, dentro de la banda ±3 acordada con el PO.
- Vara: nivel de club a jun-2026 (la misma que los 23 planteles que ya estaban), con el
  rendimiento del Mundial usado como modificador **dentro** del equipo — decide quién entra
  al 10 y quién queda de 11º, no infla la selección entera.

Notas (`naturalOverall`, sin momento y en su puesto):

- 71 — José Córdoba (DEF, #3)
- 70 — Orlando Mosquera (POR, #22)
- 70 — Cristian Martínez (MED, #6)
- 69 — Michael Amir Murillo (DEF, #23)
- 69 — Yoel Bárcenas (MED, #11)
- 69 — José Luis Rodríguez (DEL, #7)
- 68 — Andrés Andrade (DEF, #16)
- 68 — Carlos Harvey (MED, #14)
- 68 — José Fajardo (DEL, #17)
- 66 — Luis Mejía (POR, #1)

### Kit

- **Campo:** `shirt: #FF0000` · `accent: #005293`.
  Titular: hex exacto del torneo, rojo `FF0000`. Coincide con el de Suiza, pero ya NO importa: el motor cambia al alternativo cuando chocan. Alternativo: hex exacto del torneo, blanco `FFFFFF`. El tercer kit real (azul marino `000080`) no entra: el esquema guarda dos.
- **Alternativa:** `shirt: #FFFFFF` · `accent: #D21034`.
  Hex del kit alternativo que FIFA registró en el torneo.
  El motor la pone sola cuando la titular se confunde con la del rival
  (`ui/sprites.fieldKitVs`, umbral `CLASH_DIST` = 60 de distancia RGB). Se cambia
  siempre el rival, nunca la selección del jugador.
- **Arquero:** `shirt: #7E22CE` · `accent: #F8FAFC`.
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
