# Scotland (SCO) — Mundial 2026

> Investigación cruda para `data/teams.js`. **Auditable**: todo sale de las fuentes
> listadas al pie; nada acá está inventado. Lo que no se pudo confirmar va marcado
> `TODO: verificar`.

## Resultado en el torneo

- **Puesto final:** 36º de 48 — Eliminado en fase de grupos
- **Récord:** 1G 0E 2P · 1 goles a favor / 4 en contra
- **Grupo:** C

## Scotland — 3 partidos con alineación extraída

**Kits usados en el torneo (hex del reporte de FIFA):**
- #000040 arm:#000040 short:#000040 medias:#000040 (sco26hA) — 2 partido(s)
- #fa4d4f arm:#fa4d4f short:#4C2882 medias:#fa4d4f (sco26aA) — 1 partido(s)

| # | Pos | Rol | Jugador | Tit | Sup | Min | G⚽ | Caps | GolSel | Club |
|---|-----|-----|---------|-----|-----|-----|----|------|--------|------|
| 1 | POR | GK | Angus Gunn | 3 | 0 | 270 | 0 | 22 | 0 | Nottingham Forest F.C. |
| 13 | DEF | CB | Jack Hendry | 3 | 0 | 270 | 0 | 38 | 3 | Al-Ettifaq Club |
| 4 | MED | CM | Scott McTominay | 3 | 0 | 270 | 0 | 70 | 15 | SSC Napoli |
| 19 | MED | CM | Lewis Ferguson | 3 | 0 | 270 | 0 | 24 | 1 | Bologna FC 1909 |
| 7 | MED | LM | John McGinn | 3 | 0 | 261 | 0 | 86 | 20 | Aston Villa F.C. |
| 3 | DEF | LB | Andy Robertson | 3 | 0 | 226 | 0 | 94 | 4 | Liverpool F.C. |
| 17 | DEL | RM | Ben Gannon-Doak | 2 | 1 | 186 | 0 | 14 | 1 | AFC Bournemouth |
| 22 | DEF | RB | Nathan Patterson | 2 | 1 | 185 | 0 | 26 | 1 | Everton F.C. |
| 5 | DEF | CB | Grant Hanley | 2 | 0 | 180 | 0 | 68 | 2 | Hibernian F.C. |
| 20 | DEL | CF | Lawrence Shankland | 2 | 0 | 172 | 0 | 20 | 7 | Heart of Midlothian F.C. |
| 10 | DEL | CF | Ché Adams | 2 | 1 | 146 | 0 | 47 | 13 | Torino FC |
| 23 | MED | MF | Kenny McLean | 1 | 2 | 116 | 0 | 58 | 3 | Norwich City F.C. |
| 6 | DEF | LM | Kieran Tierney | 1 | 1 | 104 | 0 | 56 | 2 | Celtic F.C. |
| 11 | MED | MF | Ryan Christie | 1 | 2 | 96 | 0 | 68 | 10 | AFC Bournemouth |
| 26 | DEF | CB | Scott McKenna | 1 | 0 | 90 | 0 | 50 | 1 | GNK Dinamo Zagreb |
| 2 | DEF | RB | Aaron Hickey | 1 | 0 | 75 | 0 | 21 | 0 | Brentford F.C. |
| 9 | DEL | FW | Lyndon Dykes | 0 | 2 | 34 | 0 | 51 | 10 | Charlton Athletic F.C. |
| 24 | DEF | DF | Anthony Ralston | 0 | 2 | 10 | 0 | 27 | 1 | Celtic F.C. |
| 25 | DEL | FW | Findlay Curtis | 0 | 2 | 8 | 0 | 3 | 1 | Kilmarnock F.C. |
| 14 | DEL | FW | Ross Stewart | 0 | 1 | 1 | 0 | 3 | 0 | Southampton F.C. |

**Convocados sin minutos:** 8 Tyler Fletcher (MED, 2 caps) · 12 Liam Kelly (POR, 3 caps) · 15 John Souttar (DEF, 24 caps) · 16 Dominic Hyam (DEF, 4 caps) · 18 George Hirst (DEL, 10 caps) · 21 Craig Gordon (POR, 84 caps)

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
- **Resultado:** `teamRating` = **75** → Δ+1, dentro de la banda ±3 acordada con el PO.
- Vara: nivel de club a jun-2026 (la misma que los 23 planteles que ya estaban), con el
  rendimiento del Mundial usado como modificador **dentro** del equipo — decide quién entra
  al 10 y quién queda de 11º, no infla la selección entera.

Notas (`naturalOverall`, sin momento y en su puesto):

- 76 — Scott McTominay (MED, #4)
- 76 — John McGinn (MED, #7)
- 75 — Andy Robertson (DEF, #3)
- 74 — Angus Gunn (POR, #1)
- 74 — Ché Adams (DEL, #10)
- 73 — Jack Hendry (DEF, #13)
- 72 — Lewis Ferguson (MED, #19)
- 72 — Lawrence Shankland (DEL, #20)
- 70 — Craig Gordon (POR, #21)
- 70 — Grant Hanley (DEF, #5)

### Kit

- **Campo:** `shirt: #003078` · `accent: #FFFFFF`.
  `TODO: verificar` — el hex del torneo es `000040`, un azul tan oscuro que en el sprite se lee como negro. Se usó el azul tradicional escocés `003078` (que además es el que ya tenía en el repo como rival) por legibilidad. El alternativo real era salmón `fa4d4f` con short violeta `4C2882`, y de ahí sale el kit de arquero.
- **Alternativa:** `shirt: #FA4D4F` · `accent: #FFFFFF`.
  Hex del kit alternativo que FIFA registró en el torneo.
  El motor la pone sola cuando la titular se confunde con la del rival
  (`ui/sprites.fieldKitVs`, umbral `CLASH_DIST` = 60 de distancia RGB). Se cambia
  siempre el rival, nunca la selección del jugador.
- **Arquero:** `shirt: #FA4D4F` · `accent: #4C2882`.
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
