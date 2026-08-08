# Haiti (HAI) — Mundial 2026

> Investigación cruda para `data/teams.js`. **Auditable**: todo sale de las fuentes
> listadas al pie; nada acá está inventado. Lo que no se pudo confirmar va marcado
> `TODO: verificar`.

## Resultado en el torneo

- **Puesto final:** 45º de 48 — Eliminado en fase de grupos
- **Récord:** 0G 0E 3P · 2 goles a favor / 8 en contra
- **Grupo:** C

## Haiti — 3 partidos con alineación extraída

**Kits usados en el torneo (hex del reporte de FIFA):**
- #FFFFFF arm:#FFFFFF short:#FFFFFF medias:#FFFFFF (hai26A1) — 2 partido(s)
- #0000FF arm:#0000FF short:#0000FF medias:#0000FF (hai26H1) — 1 partido(s)

| # | Pos | Rol | Jugador | Tit | Sup | Min | G⚽ | Caps | GolSel | Club |
|---|-----|-----|---------|-----|-----|-----|----|------|--------|------|
| 1 | POR | GK | Johny Placide | 3 | 0 | 270 | 0 | 82 | 0 | SC Bastia |
| 4 | DEF | CB | Ricardo Adé | 3 | 0 | 270 | 0 | 59 | 2 | LDU Quito |
| 5 | DEF | CB | Hannes Delcroix | 3 | 0 | 270 | 0 | 7 | 0 | FC Lugano |
| 8 | DEF | LB | Martin Expérience | 3 | 0 | 270 | 0 | 21 | 0 | AS Nancy Lorraine |
| 10 | MED | CM | Jean-Ricner Bellegarde | 3 | 0 | 261 | 0 | 10 | 0 | Wolverhampton Wanderers F.C. |
| 17 | MED | CM | Danley Jean Jacques | 3 | 0 | 260 | 0 | 31 | 6 | Philadelphia Union |
| 15 | DEL | LM | Ruben Providence | 3 | 0 | 223 | 0 | 15 | 3 | Almere City FC |
| 18 | DEL | CF | Wilson Isidor | 2 | 1 | 186 | 1 | 4 | 2 | Sunderland A.F.C. |
| 21 | DEL | RM | Josué Casimir | 2 | 1 | 182 | 0 | 7 | 0 | AJ Auxerre |
| 22 | DEF | CB | Jean-Kévin Duverne | 2 | 0 | 170 | 0 | 17 | 1 | KAA Gent |
| 2 | DEF | RB | Carlens Arcus | 2 | 1 | 146 | 0 | 56 | 1 | Angers SCO |
| 20 | DEL | CF | Frantzdy Pierrot | 2 | 1 | 143 | 0 | 51 | 34 | Çaykur Rizespor |
| 16 | DEL | FW | Lenny Joseph | 1 | 2 | 117 | 0 | 2 | 1 | Ferencvárosi TC |
| 11 | DEL | FW | Louicius Deedson | 1 | 2 | 111 | 0 | 32 | 10 | FC Dallas |
| 25 | MED | MF | Dominique Simon | 0 | 2 | 54 | 0 | 2 | 0 | 1. FC Tatran Prešov |
| 9 | DEL | FW | Duckens Nazon | 0 | 1 | 23 | 0 | 82 | 44 | Esteghlal F.C. |
| 7 | DEL | FW | Derrick Etienne Jr. | 0 | 1 | 9 | 0 | 51 | 8 | Toronto FC |
| 19 | DEL | FW | Yassin Fortuné | 0 | 1 | 5 | 0 | 4 | 0 | F.C. Vizela |

**Convocados sin minutos:** 3 Keeto Thermoncy (DEF, 1 caps) · 6 Carl Sainté (MED, 26 caps) · 12 Alexandre Pierre (POR, 16 caps) · 13 Duke Lacroix (DEF, 16 caps) · 14 Garven Metusala (DEF, 16 caps) · 23 Josué Duverger (POR, 7 caps) · 24 Wilguens Paugain (DEF, 8 caps) · 26 Woodensky Pierre (MED, 1 caps)

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

- **Ancla:** 61 (el `rating` que tenía como rival antes de la conversión).
- **Resultado:** `teamRating` = **63** → Δ+2, dentro de la banda ±3 acordada con el PO.
- Vara: nivel de club a jun-2026 (la misma que los 23 planteles que ya estaban), con el
  rendimiento del Mundial usado como modificador **dentro** del equipo — decide quién entra
  al 10 y quién queda de 11º, no infla la selección entera.

Notas (`naturalOverall`, sin momento y en su puesto):

- 65 — Jean-Ricner Bellegarde (MED, #10)
- 64 — Wilson Isidor (DEL, #18)
- 63 — Johny Placide (POR, #1)
- 63 — Ruben Providence (DEL, #15)
- 62 — Ricardo Adé (DEF, #4)
- 62 — Hannes Delcroix (DEF, #5)
- 62 — Danley Jean Jacques (MED, #17)
- 59 — Martin Expérience (DEF, #8)
- 58 — Dominique Simon (MED, #25)
- 57 — Alexandre Pierre (POR, #12)

### Kit

- **Campo:** `shirt: #00209F` · `accent: #D21034`.
  Titular `TODO: verificar` — FIFA reportó un `0000FF` genérico; se usó el azul de la bandera haitiana `#00209F` (el que ya tenía en el repo). Alternativo: hex exacto del torneo, blanco `FFFFFF` (2 de 3 partidos).
- **Alternativa:** `shirt: #FFFFFF` · `accent: #D21034`.
  Hex del kit alternativo que FIFA registró en el torneo.
  El motor la pone sola cuando la titular se confunde con la del rival
  (`ui/sprites.fieldKitVs`, umbral `CLASH_DIST` = 60 de distancia RGB). Se cambia
  siempre el rival, nunca la selección del jugador.
- **Arquero:** `shirt: #65A30D` · `accent: #0B0F19`.
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
