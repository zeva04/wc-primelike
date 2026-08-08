# South Africa (RSA) — Mundial 2026

> Investigación cruda para `data/teams.js`. **Auditable**: todo sale de las fuentes
> listadas al pie; nada acá está inventado. Lo que no se pudo confirmar va marcado
> `TODO: verificar`.

## Resultado en el torneo

- **Puesto final:** 26º de 48 — Eliminado en 16avos de final
- **Récord:** 1G 1E 2P · 2 goles a favor / 4 en contra
- **Grupo:** A

## South Africa — 4 partidos con alineación extraída

**Kits usados en el torneo (hex del reporte de FIFA):**
- #fce53d arm:#fce53d short:#fce53d medias:#FFF000 (rsa26h) — 2 partido(s)
- #fce53d arm:#fce53d short:#21835d medias:#FFF000 (rsa26h) — 1 partido(s)

| # | Pos | Rol | Jugador | Tit | Sup | Min | G⚽ | Caps | GolSel | Club |
|---|-----|-----|---------|-----|-----|-----|----|------|--------|------|
| 1 | POR | GK | Ronwen Williams | 4 | 0 | 360 | 0 | 62 | 0 | Mamelodi Sundowns F.C. |
| 21 | DEF | CB | Ime Okon | 4 | 0 | 360 | 0 | 8 | 1 | Hannover 96 |
| 14 | DEF | CB | Mbekezeli Mbokazi | 4 | 0 | 360 | 0 | 10 | 1 | Chicago Fire FC |
| 20 | DEF | RB | Khuliso Mudau | 4 | 0 | 360 | 0 | 32 | 1 | Mamelodi Sundowns F.C. |
| 6 | DEF | LB | Aubrey Modiba | 4 | 0 | 346 | 0 | 44 | 3 | Mamelodi Sundowns F.C. |
| 13 | MED | CM | Sphephelo Sithole | 3 | 0 | 270 | 0 | 28 | 1 | C.D. Tondela |
| 4 | MED | CM | Teboho Mokoena | 3 | 0 | 270 | 1 | 51 | 9 | Mamelodi Sundowns F.C. |
| 5 | MED | MF | Thalente Mbatha | 2 | 2 | 258 | 0 | 15 | 3 | Orlando Pirates F.C. |
| 7 | DEL | LW | Oswin Appollis | 3 | 1 | 256 | 0 | 26 | 8 | Orlando Pirates F.C. |
| 12 | DEL | RW | Thapelo Maseko | 3 | 0 | 245 | 1 | 10 | 1 | AEL Limassol |
| 17 | DEL | FW | Evidence Makgopa | 2 | 2 | 214 | 0 | 26 | 6 | Orlando Pirates F.C. |
| 10 | DEL | AM | Relebohile Mofokeng | 2 | 1 | 170 | 0 | 13 | 0 | Orlando Pirates F.C. |
| 15 | DEL | CF | Iqraam Rayners | 2 | 2 | 161 | 0 | 14 | 4 | Mamelodi Sundowns F.C. |
| 23 | MED | CM | Jayden Adams | 2 | 1 | 117 | 0 | 9 | 1 | Mamelodi Sundowns F.C. |
| 19 | DEF | CB | Nkosinathi Sibisi | 1 | 0 | 90 | 0 | 20 | 0 | Orlando Pirates F.C. |
| 9 | DEL | CF | Lyle Foster | 1 | 0 | 56 | 0 | 27 | 10 | Burnley F.C. |
| 8 | DEL | FW | Tshepang Moremi | 0 | 2 | 32 | 0 | 10 | 1 | Orlando Pirates F.C. |
| 11 | MED | MF | Themba Zwane | 0 | 1 | 29 | 0 | 54 | 12 | Mamelodi Sundowns F.C. |
| 25 | DEL | DF | Kamogelo Sebelebele | 0 | 1 | 6 | 0 | 3 | 0 | Orlando Pirates F.C. |

**Convocados sin minutos:** 2 Thabang Matuludi (DEF, 3 caps) · 3 Khulumani Ndamane (DEF, 5 caps) · 16 Sipho Chaine (POR, 4 caps) · 18 Samukele Kabini (DEF, 6 caps) · 22 Ricardo Goss (POR, 5 caps) · 24 Olwethu Makhanya (DEF, 1 caps) · 26 Bradley Cross (DEF, 1 caps)

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

- **Ancla:** 69 (el `rating` que tenía como rival antes de la conversión).
- **Resultado:** `teamRating` = **70** → Δ+1, dentro de la banda ±3 acordada con el PO.
- Vara: nivel de club a jun-2026 (la misma que los 23 planteles que ya estaban), con el
  rendimiento del Mundial usado como modificador **dentro** del equipo — decide quién entra
  al 10 y quién queda de 11º, no infla la selección entera.

Notas (`naturalOverall`, sin momento y en su puesto):

- 73 — Ronwen Williams (POR, #1)
- 71 — Teboho Mokoena (MED, #4)
- 70 — Thapelo Maseko (DEL, #12)
- 69 — Ime Okon (DEF, #21)
- 69 — Oswin Appollis (DEL, #7)
- 68 — Mbekezeli Mbokazi (DEF, #14)
- 67 — Thalente Mbatha (MED, #5)
- 66 — Khuliso Mudau (DEF, #20)
- 66 — Sphephelo Sithole (MED, #13)
- 63 — Ricardo Goss (POR, #22)

### Kit

- **Campo:** `shirt: #FCE53D` · `accent: #007A4D`.
  Hex exacto del torneo: amarillo `fce53d` con el verde sudafricano de acento (que en un partido fue también el short).
- **Alternativa:** `shirt: #007A4D` · `accent: #FCE53D`.
  `TODO: verificar` — no está en los reportes de FIFA. away 2026: la titular invertida — el verde tradicional de primario, con acentos de verde claro y amarillo. El hex EXACTO no está confirmado.
  El motor la pone sola cuando la titular se confunde con la del rival
  (`ui/sprites.fieldKitVs`, umbral `CLASH_DIST` = 60 de distancia RGB). Se cambia
  siempre el rival, nunca la selección del jugador.
- **Arquero:** `shirt: #312E81` · `accent: #F8FAFC`.
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
