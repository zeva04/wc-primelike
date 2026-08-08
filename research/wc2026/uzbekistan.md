# Uzbekistan (UZB) — Mundial 2026

> Investigación cruda para `data/teams.js`. **Auditable**: todo sale de las fuentes
> listadas al pie; nada acá está inventado. Lo que no se pudo confirmar va marcado
> `TODO: verificar`.

## Resultado en el torneo

- **Puesto final:** 46º de 48 — Eliminado en fase de grupos
- **Récord:** 0G 0E 3P · 2 goles a favor / 11 en contra
- **Grupo:** K

## Uzbekistan — 3 partidos con alineación extraída

**Kits usados en el torneo (hex del reporte de FIFA):**

| # | Pos | Rol | Jugador | Tit | Sup | Min | G⚽ | Caps | GolSel | Club |
|---|-----|-----|---------|-----|-----|-----|----|------|--------|------|
| 2 | DEF | CB | Abdukodir Khusanov | 3 | 0 | 270 | 0 | 27 | 0 | Manchester City F.C. |
| 14 | DEL | CF | Eldor Shomurodov | 3 | 0 | 270 | 1 | 92 | 44 | İstanbul Başakşehir F.K. |
| 5 | DEF | CB | Rustam Ashurmatov | 3 | 0 | 257 | 0 | 49 | 1 | Esteghlal F.C. |
| 7 | MED | CM | Otabek Shukurov | 3 | 0 | 238 | 0 | 84 | 9 | Baniyas Club |
| 22 | MED | RF | Abbosbek Fayzullaev | 3 | 0 | 223 | 1 | 32 | 9 | İstanbul Başakşehir F.K. |
| 6 | MED | CM | Akmal Mozgovoy | 2 | 1 | 216 | 0 | 25 | 1 | Pakhtakor FC |
| 13 | DEF | LM | Sherzod Nasrullaev | 3 | 0 | 182 | 0 | 31 | 2 | FC Nasaf |
| 18 | DEF | CB | Abdulla Abdullaev | 2 | 0 | 180 | 0 | 17 | 0 | Dibba FC |
| 24 | DEF | RM | Bekhruz Karimov | 2 | 0 | 180 | 0 | 2 | 0 | FC Surkhon |
| 12 | POR | GK | Abduvohid Nematov | 2 | 0 | 180 | 0 | 8 | 0 | FC Nasaf |
| 3 | DEF | DF | Khojiakbar Alijonov | 1 | 1 | 134 | 0 | 40 | 2 | Pakhtakor FC |
| 19 | MED | RF | Azizjon Ganiev | 1 | 1 | 122 | 0 | 19 | 0 | Al Bataeh Club |
| 17 | MED | MF | Dostonbek Khamdamov | 1 | 1 | 102 | 0 | 34 | 5 | Pakhtakor FC |
| 26 | DEF | DF | Jakhongir Urozov | 1 | 1 | 95 | 0 | 4 | 0 | FC Dinamo Samarqand |
| 1 | POR | GK | Utkir Yusupov | 1 | 0 | 90 | 0 | 40 | 0 | PFC Navbahor Namangan |
| 9 | MED | CM | Odiljon Hamrobekov | 1 | 1 | 78 | 0 | 72 | 1 | Tractor S.C. |
| 11 | MED | LF | Oston Urunov | 1 | 1 | 63 | 0 | 42 | 10 | Persepolis F.C. |
| 4 | DEF | DF | Farrukh Sayfiev | 0 | 1 | 44 | 0 | 46 | 1 | FC Neftchi Fergana |
| 21 | DEL | FW | Igor Sergeev | 0 | 3 | 25 | 0 | 83 | 25 | Persepolis F.C. |
| 20 | DEL | FW | Azizbek Amonov | 0 | 1 | 13 | 0 | 12 | 2 | FC Dinamo Samarqand |
| 8 | MED | MF | Jamshid Iskanderov | 0 | 1 | 8 | 0 | 38 | 4 | FC Neftchi Fergana |
| 10 | MED | FW | Ruslanbek Jiyanov | 0 | 1 | 0 | 0 | 5 | 0 | PFC Navbahor Namangan |
| 23 | MED | MF | Sherzod Esanov | 0 | 1 | 0 | 0 | 1 | 0 | FC Bukhara |

**Convocados sin minutos:** 15 Umar Eshmurodov (DEF, 29 caps) · 16 Botirali Ergashev (POR, 2 caps) · 25 Avazbek Ulmasaliev (DEF, 0 caps)

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
- **Resultado:** `teamRating` = **65** → Δ-3, dentro de la banda ±3 acordada con el PO.
- Vara: nivel de club a jun-2026 (la misma que los 23 planteles que ya estaban), con el
  rendimiento del Mundial usado como modificador **dentro** del equipo — decide quién entra
  al 10 y quién queda de 11º, no infla la selección entera.

Notas (`naturalOverall`, sin momento y en su puesto):

- 69 — Abdukodir Khusanov (DEF, #2)
- 69 — Eldor Shomurodov (DEL, #14)
- 65 — Abbosbek Fayzullaev (MED, #22)
- 62 — Otabek Shukurov (MED, #7)
- 61 — Igor Sergeev (DEL, #21)
- 60 — Abduvohid Nematov (POR, #12)
- 60 — Rustam Ashurmatov (DEF, #5)
- 60 — Akmal Mozgovoy (MED, #6)
- 59 — Utkir Yusupov (POR, #1)
- 59 — Sherzod Nasrullaev (DEF, #13)

### Kit

- **Campo:** `shirt: #0099B5` · `accent: #FFFFFF`.
  `TODO: verificar` — es la ÚNICA selección de la que no se pudo extraer ni un hex de los reportes de FIFA. Se usó el azul tradicional uzbeko `#0099B5` (el que ya tenía en el repo como acento), respaldado por la nota de prensa del kit 2026 de 7Saber, que lo describe como *traditional primary blue*. El hex exacto NO está confirmado.
- **Alternativa:** `shirt: #FFFFFF` · `accent: #0099B5`.
  `TODO: verificar` — no está en los reportes de FIFA. away 2026 7Saber: la nota de prensa describe el mosaico y los acentos del cuello, pero NO el color de la away. Blanco es la alternativa histórica de Uzbekistán sobre su azul titular. El hex EXACTO no está confirmado.
  El motor la pone sola cuando la titular se confunde con la del rival
  (`ui/sprites.fieldKitVs`, umbral `CLASH_DIST` = 60 de distancia RGB). Se cambia
  siempre el rival, nunca la selección del jugador.
- **Arquero:** `shirt: #EA580C` · `accent: #0B0F19`.
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
