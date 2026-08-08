# Tunisia (TUN) — Mundial 2026

> Investigación cruda para `data/teams.js`. **Auditable**: todo sale de las fuentes
> listadas al pie; nada acá está inventado. Lo que no se pudo confirmar va marcado
> `TODO: verificar`.

## Resultado en el torneo

- **Puesto final:** 47º de 48 — Eliminado en fase de grupos
- **Récord:** 0G 0E 3P · 2 goles a favor / 12 en contra
- **Grupo:** F

## Tunisia — 3 partidos con alineación extraída

**Kits usados en el torneo (hex del reporte de FIFA):**
- #FFFFFF arm:#FFFFFF short:#FFFFFF medias:#FFFFFF (tun26h) — 2 partido(s)
- #FF0000 arm:#FF0000 short:#FF0000 medias:#FF0000 (tun26a) — 1 partido(s)

| # | Pos | Rol | Jugador | Tit | Sup | Min | G⚽ | Caps | GolSel | Club |
|---|-----|-----|---------|-----|-----|-----|----|------|--------|------|
| 3 | DEF | CB | Montassar Talbi | 3 | 0 | 270 | 0 | 64 | 4 | FC Lorient |
| 2 | DEF | LWB | Ali Abdi | 3 | 0 | 270 | 0 | 46 | 7 | OGC Nice |
| 10 | MED | CM | Hannibal Mejbri | 3 | 0 | 270 | 0 | 45 | 1 | Burnley F.C. |
| 20 | DEF | RWB | Yan Valery | 3 | 0 | 252 | 0 | 22 | 0 | BSC Young Boys |
| 17 | MED | CM | Ellyes Skhiri | 3 | 0 | 252 | 0 | 83 | 4 | Eintracht Frankfurt |
| 25 | MED | CF | Anis Ben Slimane | 3 | 0 | 241 | 0 | 41 | 4 | Norwich City F.C. |
| 21 | DEF | LB | Mohamed Amine Ben Hamida | 2 | 1 | 201 | 0 | 13 | 0 | Espérance Sportive de Tunis |
| 4 | DEF | CB | Omar Rekik | 2 | 0 | 180 | 1 | 6 | 0 | NK Maribor |
| 16 | POR | GK | Aymen Dahmen | 2 | 0 | 180 | 0 | 37 | 0 | CS Sfaxien |
| 13 | MED | CM | Rani Khedira | 2 | 1 | 151 | 0 | 3 | 0 | 1. FC Union Berlin |
| 8 | DEL | CF | Elias Saad | 2 | 0 | 118 | 0 | 15 | 4 | Hannover 96 |
| 1 | POR | GK | Mouhib Chamakh | 1 | 0 | 90 | 0 | 3 | 0 | Club Africain |
| 9 | DEL | CF | Hazem Mastouri | 1 | 0 | 90 | 1 | 19 | 4 | FC Dynamo Makhachkala |
| 26 | MED | FW | Sebastian Tounekti | 1 | 2 | 82 | 0 | 12 | 1 | Celtic F.C. |
| 11 | MED | MF | Ismaël Gharbi | 1 | 1 | 81 | 0 | 17 | 2 | FC Augsburg |
| 19 | DEL | FW | Firas Chaouat | 0 | 3 | 47 | 0 | 30 | 6 | Club Africain |
| 6 | DEF | CB | Dylan Bronn | 1 | 0 | 46 | 0 | 52 | 2 | Servette FC |
| 11 | MED | MF | Ismael Gharbi | 0 | 1 | 44 | 0 | 17 | 2 | FC Augsburg |
| 7 | DEL | FW | Elias Achouri | 0 | 3 | 41 | 0 | 30 | 4 | F.C. Copenhagen |
| 15 | MED | MF | Mohamed Belhadj Mahmoud | 0 | 2 | 41 | 0 | 9 | 0 | FC Lugano |
| 12 | DEF | DF | Mortadha Ben Ouanes | 0 | 1 | 23 | 0 | 18 | 0 | Kasımpaşa S.K. |

**Convocados sin minutos:** 5 Adem Arous (DEF, 2 caps) · 14 Khalil Ayari (MED, 4 caps) · 18 Rayan Elloumi (DEL, 4 caps) · 22 Sabri Ben Hessen (POR, 2 caps) · 23 Moutaz Neffati (DEF, 5 caps) · 24 Raed Chikhaoui (DEF, 0 caps)

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

- **Ancla:** 72 (el `rating` que tenía como rival antes de la conversión).
- **Resultado:** `teamRating` = **69** → Δ-3, dentro de la banda ±3 acordada con el PO.
- Vara: nivel de club a jun-2026 (la misma que los 23 planteles que ya estaban), con el
  rendimiento del Mundial usado como modificador **dentro** del equipo — decide quién entra
  al 10 y quién queda de 11º, no infla la selección entera.

Notas (`naturalOverall`, sin momento y en su puesto):

- 71 — Hannibal Mejbri (MED, #10)
- 70 — Ellyes Skhiri (MED, #17)
- 69 — Elias Saad (DEL, #8)
- 68 — Montassar Talbi (DEF, #3)
- 67 — Hazem Mastouri (DEL, #9)
- 66 — Aymen Dahmen (POR, #16)
- 66 — Ali Abdi (DEF, #2)
- 66 — Anis Ben Slimane (MED, #25)
- 64 — Yan Valery (DEF, #20)
- 62 — Mouhib Chamakh (POR, #1)

### Kit

- **Campo:** `shirt: #FFFFFF` · `accent: #E70013`.
  `TODO: verificar` — vistió blanco en 2 de 3 partidos (`tun26h`) y rojo en 1. Se usó el blanco con acento rojo; el rojo `#E70013` quedó como tinte de UI.
- **Alternativa:** `shirt: #FF0000` · `accent: #FFFFFF`.
  Hex del kit alternativo que FIFA registró en el torneo.
  El motor la pone sola cuando la titular se confunde con la del rival
  (`ui/sprites.fieldKitVs`, umbral `CLASH_DIST` = 60 de distancia RGB). Se cambia
  siempre el rival, nunca la selección del jugador.
- **Arquero:** `shirt: #4D7C0F` · `accent: #F8FAFC`.
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
