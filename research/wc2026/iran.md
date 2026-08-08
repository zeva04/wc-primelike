# Iran (IRN) — Mundial 2026

> Investigación cruda para `data/teams.js`. **Auditable**: todo sale de las fuentes
> listadas al pie; nada acá está inventado. Lo que no se pudo confirmar va marcado
> `TODO: verificar`.

## Resultado en el torneo

- **Puesto final:** 33º de 48 — Eliminado en fase de grupos
- **Récord:** 0G 3E 0P · 3 goles a favor / 3 en contra
- **Grupo:** G

## Iran — 3 partidos con alineación extraída

**Kits usados en el torneo (hex del reporte de FIFA):**
- #FFFFFF arm:#FFFFFF short:#FFFFFF medias:#FFFFFF (irn26h) — 3 partido(s)

| # | Pos | Rol | Jugador | Tit | Sup | Min | G⚽ | Caps | GolSel | Club |
|---|-----|-----|---------|-----|-----|-----|----|------|--------|------|
| 1 | POR | GK | Alireza Beiranvand | 3 | 0 | 270 | 0 | 86 | 0 | Tractor S.C. |
| 23 | DEF | RB | Ramin Rezaeian | 3 | 0 | 270 | 2 | 74 | 8 | Foolad F.C. |
| 4 | DEF | CB | Shojae Khalilzadeh | 3 | 0 | 270 | 0 | 58 | 2 | Tractor S.C. |
| 19 | DEF | CB | Ali Nemati | 3 | 0 | 270 | 0 | 18 | 0 | Foolad F.C. |
| 6 | MED | CM | Saeid Ezatolahi | 3 | 0 | 265 | 0 | 83 | 2 | Shabab Al Ahli Club |
| 9 | DEL | CF | Mehdi Taremi | 3 | 0 | 260 | 0 | 105 | 60 | Olympiacos F.C. |
| 8 | MED | RF | Mohammad Mohebi | 3 | 0 | 246 | 1 | 37 | 14 | FC Rostov |
| 14 | MED | CM | Saman Ghoddos | 3 | 0 | 211 | 0 | 68 | 3 | Kalba FC |
| 5 | DEF | LB | Milad Mohammadi | 2 | 1 | 204 | 0 | 76 | 1 | Persepolis F.C. |
| 13 | DEF | CB | Hossein Kanaanizadegan | 2 | 0 | 136 | 0 | 65 | 6 | Persepolis F.C. |
| 3 | DEF | DF | Ehsan Hajsafi | 1 | 1 | 91 | 0 | 146 | 7 | Sepahan S.C. |
| 2 | DEF | RWB | Saleh Hardani | 1 | 1 | 90 | 0 | 18 | 1 | Esteghlal F.C. |
| 21 | MED | CM | Mohammad Ghorbani | 1 | 0 | 90 | 0 | 16 | 0 | Al Wahda FC |
| 20 | DEL | FW | Shahriyar Moghanlou | 1 | 2 | 87 | 0 | 21 | 2 | Kalba FC |
| 17 | DEF | LF | Arya Yousefi | 1 | 0 | 45 | 0 | 14 | 1 | Sepahan S.C. |
| 10 | DEL | FW | Mehdi Ghayedi | 0 | 1 | 45 | 0 | 30 | 10 | Al-Nasr SC (Dubai) |
| 7 | MED | MF | Alireza Jahanbakhsh | 0 | 2 | 44 | 0 | 99 | 17 | FCV Dender EH |
| 11 | DEL | FW | Ali Alipour | 0 | 1 | 37 | 0 | 14 | 1 | Persepolis F.C. |
| 16 | MED | MF | Mahdi Torabi | 0 | 1 | 24 | 0 | 52 | 7 | Tractor S.C. |
| 18 | DEL | FW | Amirhossein Hosseinzadeh | 0 | 2 | 15 | 0 | 18 | 5 | Tractor S.C. |

**Convocados sin minutos:** 12 Payam Niazmand (POR, 15 caps) · 15 Rouzbeh Cheshmi (MED, 40 caps) · 22 Hossein Hosseini (POR, 13 caps) · 24 Dennis Eckert (DEL, 0 caps) · 25 Danial Eiri (DEF, 0 caps) · 26 Amirmohammad Razzaghinia (MED, 4 caps)

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

- **Ancla:** 73 (el `rating` que tenía como rival antes de la conversión).
- **Resultado:** `teamRating` = **73** → Δ+0, dentro de la banda ±3 acordada con el PO.
- Vara: nivel de club a jun-2026 (la misma que los 23 planteles que ya estaban), con el
  rendimiento del Mundial usado como modificador **dentro** del equipo — decide quién entra
  al 10 y quién queda de 11º, no infla la selección entera.

Notas (`naturalOverall`, sin momento y en su puesto):

- 78 — Mehdi Taremi (DEL, #9)
- 75 — Alireza Beiranvand (POR, #1)
- 72 — Mohammad Mohebi (MED, #8)
- 71 — Shojae Khalilzadeh (DEF, #4)
- 71 — Saman Ghoddos (MED, #14)
- 70 — Ramin Rezaeian (DEF, #23)
- 69 — Ali Nemati (DEF, #19)
- 69 — Saeid Ezatolahi (MED, #6)
- 68 — Payam Niazmand (POR, #12)
- 68 — Shahriyar Moghanlou (DEL, #20)

### Kit

- **Campo:** `shirt: #FFFFFF` · `accent: #DA0000`.
  Hex exacto del torneo: blanco `FFFFFF` en los 3 partidos (`irn26h`). El rojo iraní queda de acento y de tinte de UI.
- **Alternativa:** `shirt: #DA0000` · `accent: #FFFFFF`.
  `TODO: verificar` — no está en los reportes de FIFA. away 2026 Majid: mismo diseño que la titular pero en rojo, con el patrón del guepardo asiático más oscuro. El hex EXACTO no está confirmado.
  El motor la pone sola cuando la titular se confunde con la del rival
  (`ui/sprites.fieldKitVs`, umbral `CLASH_DIST` = 60 de distancia RGB). Se cambia
  siempre el rival, nunca la selección del jugador.
- **Arquero:** `shirt: #9333EA` · `accent: #0B0F19`.
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
