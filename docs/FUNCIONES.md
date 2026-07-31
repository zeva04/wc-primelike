# 📚 FUNCIONES — Referencia del código

Referencia de cada función, clase y estructura de datos del juego, archivo por archivo.
Para entender **por qué** el motor calcula como calcula (las matemáticas y el balance),
ver [CORE.md](CORE.md).

Arquitectura en una línea: **`data/teams.js`** (datos) → **módulos del motor** en `js/core·data·game·content` (reglas, sin DOM) → **`js/ui/screens/`** (una pantalla por archivo; navegan entre sí vía `ui/nav`) → **`js/main.js`** (los une). La UI nunca implementa reglas: importa cada sistema del motor. El mapa completo está en [ARQUITECTURA.md](ARQUITECTURA.md).

---

## `data/teams.js` — Base de datos

Módulo ES que exporta `WC_DATA = { teams: [...] }`; el único consumidor de código es
`js/data/teams-repo.js`. Está ordenado en tres secciones:

1. **Selecciones jugables** (18) — orden alfabético.
2. **Rivales clasificados** (32) — agrupados por confederación.
3. **No clasificados** — con `qualified: false`,
   quedan fuera del sorteo pero disponibles para futuras features.

### Esquema de una selección jugable
```js
{
  id: "ARG", name: "Argentina", flag: "🇦🇷", iso: "ar", confed: "CONMEBOL",
  playable: true,
  colors: { primary, secondary, text },        // tiñen la UI al elegirla
  kits:   { field: {shirt, accent}, gk: {shirt, accent} },  // camisetas de los sprites
  players: [ /* plantel: distribución LIBRE (diseño del PO), mínimo 1 por posición */ ]
}
```

### Esquema de un jugador
```js
{
  name: "Messi", pos: "DEL", num: 10,
  stats: { tiro, defensa, cabezazo, pase, aura },   // POR: atajadas, reflejos, salidas, pase, aura
  look:  { skin, hair, style, beard }               // apariencia del sprite pixelado
}
```
- `num`: dorsal 1–26 (el **1** siempre es de un arquero, regla FIFA).
- `look.style`: uno de `short · buzz · curly · long · bun · bald`.

### Esquema de un rival (no jugable)
```js
{
  id: "ESP", name: "España", flag, iso, confed, rating: 92,
  kit: { shirt, accent },                    // camiseta para sprites procedurales
  figures: [ { name, pos } ]                 // 5 figuras reales (≥1 por posición)
}
```
Un rival no tiene plantel completo: `rating` es su media directa y `figures` son las 5
caras que se muestran y que forman su alineación al enfrentarlo.

---

## El motor — módulos por sistema (lógica pura)

El motor vive en módulos ES por sistema de juego (ARQUITECTURA.md §2). **No existe
fachada** (retirada en F7): cada consumidor importa el módulo que necesita; los tests
agregan todos los módulos en `tests/load-engine.js` solo por comodidad. Mapa de módulos:

| Módulo | Contiene |
|---|---|
| `js/core/rng.js` · `js/core/math.js` | §1 Utilidades (azar único / numérica) |
| `js/data/teams-repo.js` | `getTeam`, `allTeams` (consultas a la base) |
| `js/game/ratings.js` | §2 Ratings, estrellas y `difficultyOf` |
| `js/game/lineup.js` | §2b Reglas de alineación 6v6: `FORMATIONS`, `autoLineup`, `validateLineup`, `formationLabel` |
| `js/game/opponents.js` | §3 Rivales |
| `js/game/run.js` | §4 La run (`newRun`) |
| `js/game/tournament/sim.js` | §5 Simulación IA (`quickSim`) |
| `js/game/tournament/groups.js` | §6 Grupos |
| `js/game/tournament/knockout.js` | §7 Eliminatorias |
| `js/game/match/powers.js` | §8 Funciones de poder |
| `js/game/match/Match.js` (+ `chances.js`, `incidents.js`, `shootout.js`) | §8 Clase `Match` (máquina de estados + módulos de jugadas) |
| `js/game/calendar.js` · `daily.js` · `day-action.js` · `flow.js` · `discipline.js` · `medical.js` · `journal.js` | §9 Entre partidos |
| `js/content/` (themes, prep-events, day-actions, opportunities, conflicts, injuries, daily-flavor) | Tablas de contenido editable |

Las secciones siguientes documentan las mismas funciones, ahora indicando su módulo.

### 1. Utilidades — `js/core/rng.js` y `js/core/math.js`
| Función | Qué hace |
|---|---|
| `rnd()` | Azar uniforme [0,1). Único punto de aleatoriedad del motor. |
| `ri(a,b)` | Entero aleatorio en [a,b] inclusive. |
| `pick(arr)` | Elemento aleatorio de un array. |
| `shuffle(arr)` | Copia barajada (Fisher-Yates); no muta el original. |
| `clamp(x,lo,hi)` | Acota x al rango [lo,hi]. |
| `truncHalf(x)` | Trunca a pasos de 0.5. |
| `poisson(λ)` | Muestra de una distribución de Poisson (goles de un partido simulado). |

### 2. Ratings y estrellas — `js/game/ratings.js`
| Función | Qué hace |
|---|---|
| `playerOverall(p)` | Nota 1–99 del jugador, promedio ponderado por posición (`OVR_WEIGHTS`). |
| `teamFigure(team)` | La **figura** del equipo: mejor `playerOverall`, **incluido el arquero** (antes el menú excluía a los POR y erraba en Cabo Verde, cuya mejor media es Vozinha). Desempate por **mayor aura** (decisión PO 21-jul). La usan el menú y el scout del rival. |
| `playerStars(p)` | Estrellas visuales del jugador. |
| `teamRating(team)` | Media 1–99 del equipo (promedio de sus 5 mejores notas). |
| `teamStars(team)` | Estrellas visuales del equipo. |
| `lineupRating(selected)` | Media del once elegido (promedio de los 6). Baja si el DT alinea suplentes; `teamRating` es el techo del plantel. |
| `playedPos(p)` | Puesto que juega hoy (`posJugada`, lo escribe `lineup.assignPositions`) o el natural. El arco es exclusivo de los POR, así que `playedPos(p)==="POR"` ⟺ `p.pos==="POR"`. |
| `posDistance(a,b)` / `penaltyAt(p,pos)` | Pasos entre dos puestos en la línea POR–DEF–MED–DEL / castigo que sufriría ahí (6 por paso). |
| `outOfPosPenalty(p)` | Castigo que sufre hoy cada stat técnica (0 si juega en su puesto). |
| `effectiveStat(p,key)` | Stat ya castigada y escalada por el Momento (`momentoMult`, CORE §2c). **Única fuente de verdad**: la leen `playerOverall` (la ficha) y `match/powers.effStat` (la cancha), así la UI no puede mentir. El aura nunca se castiga por posición (por Momento sí se escala). |
| `baseStatAt(p,key)` | Stat BASE en el puesto que juega, **sin** el % del Momento (base sobre la que el Momento suma/resta; la ficha pinta la barra base y el boost/nerf por separado). Incluye el castigo por fuera de puesto y el crecimiento permanente del canje. |
| `statPenalties(p)` | `[{key, base, real, delta}]` de lo que le baja por POSICIÓN — `base` va con su Momento actual para aislar el castigo posicional del % de forma. Es lo que pinta la ficha. |
| `overallAt(p,pos,conMomento=true)` | Nota que tendría parado en `pos` (pesos de ese puesto + castigo); `conMomento:false` la da sin la forma del día. |
| `naturalOverall(p)` | Nota EN SU PUESTO y SIN Momento: talento, no circunstancia. **La que ordena el plantel** (`autoLineup`): con `playerOverall` el auto manda al banco al crack que estabas usando fuera de puesto (y perseguiría al que está en racha — recorte de balance 17-jul). |
| `starsFromRating(r)` | Convierte un rating 1–99 en estrellas 0.5–5 con la curva futbolera. |
| `statLine(p)` | Resumen de stats para tooltips ("T90 D35…" / "AT90 RF88…"). |
| `difficultyOf(team)` | Dificultad temática (umbrales 85/78/68): `{tier, label, desc}`; la UI mapea `tier`→colores. |
| `getTeam(id)` | Busca un equipo por su código FIFA (vive en `js/data/teams-repo.js`, junto a `allTeams()`). |

### 2b. Alineación 6v6 — `js/game/lineup.js`
| Función | Qué hace |
|---|---|
| `FORMATIONS` | Las 6 formaciones (1 POR + DEF-MED-DEL, mínimo 1 por línea): `1-1-3`, `1-2-2`, `1-3-1`, `2-1-2`, `2-2-1`, `3-1-1`. **No son cosméticas**: `teamPowers` arma la defensa con los DEF y el ataque con MED+DEL. |
| `getFormation(id)` | Formación de la tabla por id, o `null` si no es una de las 6. |
| `formationSlots(id)` | Los 6 puestos en orden POR→DEF→MED→DEL. **El once se guarda en ese orden**: el titular del índice i juega `slots[i]`. Mover a alguien = mover su índice. |
| `canPlayAt(player, slotPos)` | ¿Puede pararse ahí? Todo vale entre DEF/MED/DEL; el arco es solo para arqueros y ellos no salen de él (stats disjuntas, CORE.md §2b). |
| `assignPositions(squad, lineup, id)` | **Única pluma de `posJugada`**: se lo fija a los 6 titulares según los slots y se lo borra al resto. De aquí sale el castigo. Llamarla en CADA cambio del once. |
| `swapAssignments(a, b)` | Reubicación táctica: dos titulares intercambian el puesto. No gasta cambio; `false` si alguno no puede ocupar el del otro (el arco). La usa el PARTIDO, donde no hay formación de la que rederivar y `posJugada` es la única verdad (en Gestión de Plantilla se mueve el índice y `assignPositions` rederiva). |
| `currentLineup(squad, prev, id)` | **Puerta de entrada de las pantallas** (hub y squad): devuelve `{lineup, formationId}` ya ordenado por slots y con los puestos asignados; rearma el once si una baja lo invalidó. El smoke la usa también. |
| `fillFormation(available, id, keep)` | Mejor once para esa formación, o `null` si el plantel no la cubre. `keep` manda sobre la nota: cambiar de formación no borra las elecciones del DT. |
| `canUseFormation(available, id)` | ¿El plantel alcanza para esa formación? (Brasil no puede `3-1-1`: tiene 2 DEF.) |
| `autoLineup(available, formationId?, keep?)` | Mejor once de 6. Con `formationId` respeta esa formación; sin él usa el algoritmo histórico — **ojo: es la línea base del balance**, ver nota abajo. |
| `validateLineup(available, selected)` | Valida la alineación (6, 1 arquero, líneas cubiertas si hay jugadores). **Regla de emergencia**: si el plantel diezmado no llega a 6 (`maxLineupSize`: los de campo + 1 arquero — el 2º POR no puede jugar en cancha), acepta presentar a todos los que queden en pie y devuelve `short: true` para que la UI avise; el motor ya castiga la inferioridad (match/powers). Sin esta válvula la run moría en softlock con 4+ bajas de campo simultáneas. |
| `maxLineupSize(available)` | Cuántos titulares puede presentar HOY el plantel (6, salvo emergencia). |
| `formationLabel(selected)` | Etiqueta de formación del once (ej. `2-1-2`). |

⚠️ **Por qué `autoLineup()` sin formación no se toca a la ligera**: elige la misma nota TOTAL que
un barrido por las 6 formaciones, pero desempata distinto, y el desempate mueve el reparto
DEF/MED — que `teamPowers` convierte en poder real. Cambiarlo por "el mejor de las 6 formaciones"
subió a BRA de ~34,7% a 36,3% de campeón (n=1500) sin que ningún once fuera mejor: solo empates
resueltos hacia el ataque. Si se toca, recalcular la línea base de CORE.md §10.

### 3. Rivales — `js/game/opponents.js`
| Función | Qué hace |
|---|---|
| `genOpponentSquad(team)` | Plantel de 10 de un rival no jugable: sus 5 figuras (stats derivadas del `rating` con `POS_MODS`) + 5 genéricos "Jugador6..Jugador10" que cubren todas las líneas — incluido un POR suplente — con `GENERIC_MALUS` (−4: perder una figura por suspensión duele; con −6 el % de campeón derivaba arriba). |
| `genOpponentLineup(team, banned)` | Alineación de 6 titulares del rival (formato 6v6), excluyendo a los suspendidos de `run.rivalBans`. Jugables usan sus mejores 6 disponibles; el resto arma su mejor seis del plantel de 10 (mejor POR + mejor por línea + relleno por nota). |
| `expectedOpponentLineup(team, banned)` | La misma regla `bestSix` pero con stats SIN ruido (no consume rng): la alineación ESPERADA del rival, para el Informe (`game/scouting`). |
| `bestSix(pool)` | (export) Mejor seis de un pool: mejor POR + mejor por línea + relleno por nota. Lo comparten el once rival y el "mi lado" del Informe. |
| `buildOpponentReport(run, oppId)` | **scouting**: el Informe del Rival (Bible §4.6) — `{lineas: {ataque\|defensa\|arquero: {nivel, detalle}}, figura, forma, bajas, enEliminatorias}`. Niveles CUALITATIVOS (Alto/Medio/Bajo) comparando el cruce real (su ataque vs tu defensa, su defensa vs tu ataque, arquero vs arquero) con poderes esperados sin buffs; forma desde los resultados jugados por el mundo vivo (máx 3, reciente primero); bajas de `run.rivalBans`. **`bloque` (sprint del Territorio)**: con qué altura se va a parar el rival (`field.baseHeight` — la MISMA fuente que usará el partido) y qué camino deja abierto, en palabras: es lo que le faltaba a la decisión de altura del DT, que hasta entonces se tomaba a ciegas. PURO: no muta la run ni consume rng — mirar es gratis (los tests de pureza en `tests/scouting.test.js`). |

### 4. La run — `js/game/run.js`
| Función | Qué hace |
|---|---|
| `newRun(myTeamId)` | Crea la run: sortea 12 grupos (solo `qualified !== false`), clona el plantel con estado y devuelve el objeto `run` completo. |

El objeto `run` guarda: `teamId`, `squad`, `groups`, `stage` (`groups→r32→r16→qf→sf→final`),
`matchday`, `koMatches`, `buffs`, `stats` acumuladas, y el calendario: `day` (día actual,
1 = 11-jun-2026), `nextMatchDay` (día del próximo partido), `dayPlan` (evento pre-sorteado
de cada día intermedio: `{kind, id, tema}`), `actionPending` (Acción del Día por elegir),
`lastAction` (`{day, icon, title}` de la última acción aplicada), `dayMod` (modificador
de las acciones de HOY: `{icon, title, desc, mods}`, dura exactamente un día),
`lastNight` (partidos ajenos "de anoche", escribe `tournament/world`), `koPlayed`
(`{idx: resultado}` de cruces ajenos ya jugados; resetea flow al armar cada ronda) y
`rivalBans` (`{teamId: [nombres]}` suspendidos por roja ajena para SU próximo partido;
escribe world, limpia flow cuando lo cumplen ante mí). Desde F1: `filoId` (filosofía
elegida tras el sorteo, escribe `game/philosophy`) y `aristas` (`{presion: 3, ...}` —
progreso por arista, PERSISTE al cambiar de filosofía; mutan `content/day-actions`,
`game/philosophy` y el contenido vía `addFiloProgress`).

### 5. Simulación IA — `js/game/tournament/sim.js`
| Función | Qué hace |
|---|---|
| `quickSim(idA,idB,knockout)` | Simula por Poisson un partido que el usuario no juega; en eliminatoria resuelve prórroga y penales. |

### 6. Grupos — `js/game/tournament/groups.js`
| Función | Qué hace |
|---|---|
| `computeTable(group)` | Tabla de posiciones (pts, DG, GF; empates al azar). |
| `myNextGroupRival(run)` | Rival del usuario en la fecha actual. |
| `qualifyRound32(run)` | Cierra los grupos: 12 primeros + 12 segundos + 8 mejores terceros → bracket de 16avos. |

### 7. Eliminatorias — `js/game/tournament/knockout.js`
| Función | Qué hace |
|---|---|
| `pairNextRound(winners)` | Empareja ganadores para la ronda siguiente. |
| `nextOpponentId(run)` | Id del próximo rival del usuario (fecha de grupo o cruce de eliminatoria). |

### 7b. El mundo vivo — `js/game/tournament/world.js`
Los partidos ajenos se reparten por los días del calendario (Ley 7: el Mundial sigue
sin ti). Sin plan almacenado: lo pendiente se deriva del estado, así el reparto
sobrevive a cualquier re-agendado.
| Función | Qué hace |
|---|---|
| `playWorldDay(run)` | La tanda "de anoche": simula `ceil(pendientes/días restantes)` partidos ajenos de la fecha/ronda actual y llena `run.lastNight` (entradas `{a,b,gA,gB,stage,groupName?,myGroup?,pens?,win?,red?}`). Las rojas (9%, más en el perdedor) SUSPENDEN de verdad: quedan en `run.rivalBans[teamId]` y se cumplen en el próximo partido del equipo — contra mí, esa figura no forma (genOpponentLineup); contra otro simulado se cumple sin efecto en el marcador (quickSim no modela planteles). La llama `advanceDay`. |
| `finishGroupMatchday(run)` | Al jugarse mi partido: simula lo que el mundo no alcanzó y devuelve los otros resultados de MI grupo en la fecha (para post-partido). La llama `flow.closeMatch`. |
| `finishKnockoutRound(run)` | Ídem en eliminatorias: cierra los cruces pendientes y devuelve `{winners, results}` alineados con `koMatches` (mi posición en null; la completa flow). |

### 8. Partido interactivo — funciones de poder (`js/game/match/powers.js`)
| Función | Qué hace |
|---|---|
| `energyMult(en)` | La **banda verde** (M1): ×1.0 con energía ≥`ENERGY_OK` (65); bajo el umbral cae convexo (cuadrático) hasta `ENERGY_FLOOR_MULT` (×0.75) en el piso (5). La UI colorea con la misma constante (`components.energyCls`). |
| `oxidMult(racha)` | La **oxidación** (R1): ×1.0 con racha <`OXID_THRESHOLD` (3 días sin Entrenar/Táctica); convexa hasta `OXID_FLOOR_MULT` (×0.82 — nació 0.85, R2 la profundizó para la tesis 10-15) en racha `OXID_FLOOR_AT` (5). El espejo de la banda, comprimido a 3→5 porque jugar resetea. La UI colorea con la misma constante (`components.oxidCls`). |
| `effStat(p,key,buffs)` | Stat efectiva ~0–5 (stat÷20) con buffs, castigada por energía vía `energyMult`, por oxidación vía `p.oxid` (lo estampa `game/oxidation`) y potenciada por la forma de torneo vía `p.forma` (solo el once rival en KO, `opponents.tourneyFormaMult`). Las asimetrías viven en los DATOS: mi plantel nunca lleva `forma`, el rival nunca lleva `oxid`/`energia`. |
| `gkQuality(por,buffs)` | Calidad global del arquero (atajadas 60% · reflejos 25% · salidas 15%). |
| `teamPowers(lineup,ment,buffs)` | Ataque y defensa (~0–5) de una alineación, con mentalidad e inferioridad numérica. El bonus de `buffs.tactica` MURIÓ en F1 (la táctica ya no compra poder: construye identidad). |

### 8b. El TERRITORIO — `js/game/match/field.js` (sprint del Territorio, 30-jul-2026)
Dónde está la pelota, cómo están paradas las dos líneas y dónde se jugó cada tiempo. **Marco
absoluto anclado a mi arco** (`v1` = mi área … `v5` = área rival · `h1..h3` = izquierda, centro,
derecha) y **cero `rnd()`**: la deriva ambiente es determinista a propósito (misma ley que
`stats.js` y `match-momentum.js` — el sistema no le mueve un dial al balance calibrado).

| Función | Qué hace |
|---|---|
| `newField(oppTeam,koRound,laneSeed)` | El estado territorial que cuelga del Match: pelota, identidad rival cacheada (para su altura), mapas de calor y ventanas tácticas gastadas. |
| `tickField(m,mine,opp)` | **Un minuto de territorio, sin azar**: de quién es la pelota (Bresenham por bloques de 3'), hacia dónde tira (alturas + poderes), el carril, el calor del minuto y el sobrecosto físico del bloque adelantado. Lo llama `Match.tick` **antes** que las jugadas. |
| `ballZone(m)` / `setBall(m,{h,v,side})` / `moveBall(m,dv,dh)` | Leer y mover la pelota. Mover deja calor de jugada real (`HEAT_ACT` = 3 vs `HEAT_TICK` = 1). |
| `myHeight(m)` / `oppHeight(m)` | La altura de bloque 1..5. La mía es una orden del DT y vive en `matchCtx.altura` (se lee en vivo); la del rival sale de su identidad, se radicaliza si está consolidada y la mueve el marcador. |
| `setHeight(m,n)` / `canChangeHeight(m,n)` / `heightFree(m)` | Mover el bloque. Gratis antes del partido y en el entretiempo; en juego consume una de las `TACTIC_WINDOWS` (3). Narra la orden — el jugador se entera por el relato, nunca por un número. |
| `backlineRisk(m)` | Cuánto multiplica MI altura el pelotazo a la espalda (`Match.BREAKAWAY_TICK`). ×1 con bloque medio; **asimétrico** hacia abajo (ver CORE §Territorio). |
| `lineCover(n)` / `attackWidth(m)` / `defenseWidth(m)` / `widthHint(def,med,del)` | **La amplitud** (Eje Horizontal): una línea de tres ocupa los tres carriles, una de uno solo el centro. Escala −1..+1 centrada en la línea de DOS (punto neutro exacto). `widthHint` es la lectura para la UI, en palabras y sin números — la usan el selector de dibujo y la pizarra del partido. |
| `otherLane(m)` / `wingLane(m)` / `inWing(m)` | El carril opuesto (el cambio de frente), un carril de banda alternando sin gastar azar, y si la pelota está por afuera. |
| `zoneWeight(type,v,h)` / `originOf(m,type)` | La geografía de las jugadas: cuánto pesa un tipo desde donde está la pelota (×0.55 por altura de lejanía) y dónde la planta al arrancar. |
| `ADVANCE` / `inOppBox(m)` | Cuánto avanza la pelota cada gesto, y si estamos dentro del área (lo pregunta la falta: solo ahí hay penal). |
| `startHalfField(m,nominal)` | Mapa de calor limpio y pelota al medio: cada tiempo tiene el suyo. |
| `heatCells(m,side,mapIdx)` / `heatHalves(m)` / `fieldState(m)` | Salidas para la UI, ya masticadas: celdas normalizadas 0..1, los tiempos etiquetados y la altura con nombre, icono, explicación, ventanas y **la lectura del rival en palabras**. |

### 8. Partido interactivo — clase `Match` (`js/game/match/Match.js` + `sequences.js` / `actions.js` / `chances.js` / `incidents.js` / `shootout.js`)
La UI la maneja así: `tick()` cada ~600 ms → si hay `decision`, muestra modal y llama al
`resolve*` correspondiente → en `"pens"` gestiona la tanda → al final `result()`.

**Sprint A1 — la capa de secuencias.** La columna interactiva del partido son las **Key Sequences**
(Bible §7): `Match.tick` ya no dispara las viejas ocasiones (`myChance`/`oppChance`/`resolveChance`
**retiradas**), sino que llama a `sequences.maybeStartSequence`. Penal y último hombre quedaron como
eventos independientes de baja frecuencia (`chances.myPenaltyChance`/`lastManChance`/`oppPenaltyChance`),
con su resolución **intacta**; los remates no interactivos pasaron a `chances.ambientShot*`.

**`game/match/actions.js` — Football Actions** (bloques reutilizables, devuelven resultado estructurado, no narran):
| Función | Qué hace |
|---|---|
| `actPass(m,from,{hard})` | Pase; `hard` = filtrado (menos probable, deja mejor perfil). Monótona en el Pase. |
| `actDribble(m,p,{bonus})` | Regate: `{ok, foul}` — puede salir, ganar penal (`foul`) o perderse. `bonus` (M2): conducir con la cancha rota es más fácil — lo usa el 2º tramo del Contragolpe letal (`adv.carryEase`). |
| `actShot(m,p,{stat,bonus})` | Remate de definición: base más alta que el ambiente (`0.15 + q·0.09 + bonus`). `stat` permite el cabezazo. |
| `actContain(m,mine,{press,bonus})` | Corte defensivo; `press` corta más pero arriesga; `bonus` = mi iniciativa (la recuperación alta roba más que la contención de emergencia). |
| `actOppShot(m,shooter,mine,{stat,bonus})` | Remate rival ante mi arquero. `stat` cabezazo (córner en contra), `bonus` el perfil. `ok` = gol rival. |
| `actAerial(m,p,{handicap})` (A2) | Duelo aéreo: pesa el **Cabezazo** contra la zaga rival; `handicap` para la peinada al espacio. |

**`game/match/sequences.js` — el GENERADOR** (+ `content/sequences.js` = los tipos como datos):
| Función | Qué hace |
|---|---|
| `maybeStartSequence(m)` | ¿Arranca una secuencia este tick? Sobre la marcha, apuntando al objetivo del partido (2-6). El lado sale de `mineShare` (ventaja + mentalidad VIVA **+ contexto A3**: marcador tardío ±0.07/−0.05 desde el 75' y rojas ±0.06 por expulsado, leídos EN VIVO). |
| `seqPlan(m)` (interna) | Objetivo, ventaja y `rivalProfile`; cacheado en `m._seqPlan` (el contexto de partido NUNCA se cachea acá). |
| `rivalProfile(m)` (interna, A2) | Perfil 0..1 del rival desde los promedios de su once (atk/def/pase/cab) — decisión #14, sin datos nuevos. |
| `typeWeights(m,side,prof)` (interna, A2+A3) | Pesos por tipo desde el perfil rival, la mentalidad y el **contexto A3** (todo leído AL GENERAR): perder tarde → directo ×1.5 · ganar tarde → repliegue ×1.4 · fatiga <55 → recuperación ×0.6, pelotazo/salida_fondo ×1.4 · **Moral** (decisión #10, por `matchCtx.moral`): nubes/alta → valientes ×1.5/×1.2, suelo/baja → pelotazo ×1.5/×1.2 y recuperación ×0.6/×0.8 · el último tipo generado pesa 0 (no repetir). |
| `startSequence(m,type)` | Elige protagonista(s) (por lado y `protWeight` **× `protMomentum` A3**; el córner rival usa su mejor cabeceador, la salida bajo presión a MI mejor pasador del fondo), registra `m._lastSeqType` y `m._flow`, y crea la decisión del acto 1. |
| `protMomentum(p)` (A3, decisión #15) | Factor de presencia por Momento: `1 + 0.12·(momento−4)` (7→1.36×, 1→0.64×). Pondera QUIÉN protagoniza (también en la conversión def→of), nunca el éxito. |
| `SEQ_MIN`/`SEQ_MAX`, `SEQUENCE_TYPES`, `sequenceType(id)` | Rango 2-6 y el catálogo: 8 tipos base (A2) + las 4 **SECUENCIAS AVANZADAS** (M2, `advFor` = filosofía dueña, números de desenlace en `adv`, texto de vitrina en `vitrina`). |
| `ADVANCED_BY_FILO` | **content/sequences** (M2): la avanzada de cada filosofía (`{press: fila, …}`), derivado de los datos. La leen el gating del pool, la vitrina, el sorteo y la conquista narrada. |

**`game/match/sequence-acts.js` — EL CONTRATO Y EL DESPACHO** (68 líneas): `buildActDecision`
monta la decisión del acto en curso desde la tabla `BUILDERS` y `resolveSequenceAct` la resuelve
desde `RESOLVERS`. Los actos viven en **`game/match/acts/`**, un archivo por familia de fútbol —
cada uno con SUS constructores y SUS resolvers, así que agregar un acto es tocar un solo archivo:

| Módulo | Actos | Qué más trae |
|---|---|---|
| `acts/build.js` | build · buildout · switch · carry · press | los actos que hacen AVANZAR la jugada |
| `acts/attack.js` | throughball · duel · wing · cross · finish | llegar y definir |
| `acts/setpiece.js` | setpiece · defend_sp | el balón parado, sus dos caras |
| `acts/defense.js` | playout · contain · clear | defender (y `clear`, el único acto que se resuelve solo) |
| `acts/chains.js` | — | los desenlaces transversales: `escalate`, rebote, contragolpe, encadenados, la geografía de la falta y los dos cierres |
| `acts/block.js` | — | lo que el árbol del Bloque le hace al remate rival (`oppShotBlockMalus` y su familia) |
| `acts/common.js` | — | los helpers compartidos: `planOf`, `passTo`, `dtOk`/`dtFail`, `wingChaser`, `canFreeze` |

Lo que sigue documenta los actos por dentro (dónde vive cada uno se lee en la tabla de arriba):
| Función | Qué hace |
|---|---|
| `buildActDecision(m)` | Crea la decisión `sequence` del acto actual según su `kind` (build/carry/press/duel/setpiece/finish/contain/defend_sp/playout). |
| `resolveSequenceAct(m,key)` | Resuelve el acto: narra y **escala** o **cierra**. **El que pasa SE DESPRENDE** (22-jul, `passTo`): tras cualquier pase (seguro/filtrado/al pie) la recibe un compañero que pasa a protagonizar, y el pasador queda de asistidor potencial. **Feedback del DT** (22-jul, `dtOk`/`dtFail`): solo las opciones con RIESGO real generan comentario en el feed — acierto celebrado, fallo cobrado; la segura no opina. La construcción modula el `bonus` del remate, no cierra la jugada (si no, el scoring se derrumba — medido en A1 Y de nuevo en A2 con los tipos nuevos). El `playout` exitoso **convierte** la secuencia en transición mía (def→of). La contención rota rutea al **último hombre** (`LASTMAN_FROM_CONTAIN` 0.70, resolución del Sprint 1 intacta). |
| `maybeRebound(m,txt)` / `maybeCounter(m,txt)` (A2, regla 7) | El fallo que encadena, bidireccional: remate fallado → rebote (0.30, uno por secuencia) · pérdida ARRIESGADA → contra rival (0.28), que va TODA al mano a mano si hay DEF (`LASTMAN_FROM_COUNTER` 1.0). |

**Estado y consultas**
| Método | Qué hace |
|---|---|
| `constructor(my, oppTeam, knockout, oppBanned)` | Inicializa el partido (`my` = {team, lineup, bench, mentalidad, buffs, **moral** (A3)}; `oppBanned` = suspendidos del rival por rojas del mundo vivo). |
| `log(kind,text)` | Agrega una línea al relato (kind define el estilo visual). |
| `flow()` (A3, decisión #11) | Posesión % mía y momentum (neto de los últimos 15') DERIVADOS de `m._flow` (todo lo generado: secuencia 3 · penal/mano a mano 2 · ambiente 1, con prior neutral). La UI pinta; acá solo se deriva. |
| `_ambientLine()` (A3) | Arma el ctx del partido (marcador, rojas, fatiga, banda de Moral, momentum) y elige del pool `content/ambient.js` (contextuales pesan 2-3×). |
| `activeMine()` | Mis jugadores en cancha (sin expulsados ni lesionados). |
| `availableBench()` | Suplentes que aún pueden entrar. |
| `eligibleFor(out)` | Suplentes elegibles para reemplazar a `out`. Regla **simétrica** vía `lineup.canPlayAt`: el arco solo lo cubre un arquero **y** un arquero no sale a la cancha. Antes solo se vigilaba una dirección y se podía mandar a un jugador de campo al arco: el equipo quedaba sin arquero y con 6 de campo. |
| `powers()` | Poderes actuales de ambos equipos (se recalculan cada tick). |

**Simulación por tick**
| Método | Qué hace |
|---|---|
| `tick()` | Avanza ~5 min. Devuelve `false` \| `true` (decisión) \| `"halftime"` \| `"pens"` \| `"end"`. |

**Decisiones del partido** (los `resolve*` los llama la UI vía `handleDecision`)
| Método | Qué hace |
|---|---|
| `resolveSequenceAct(key)` | Resuelve el acto actual de la secuencia en curso (delega en `sequences.js`). |
| `resolvePenaltyMine(name)` | Penal a favor: ejecuta con el pateador elegido. Lo dispara `chances.myPenaltyChance` desde el tick. |
| `resolvePenaltyOpp(key)` | Penal en contra: el usuario eligió el lado del arquero. Lo dispara `chances.oppPenaltyChance`. |
| `resolveLastMan(key)` | Decisión de **último hombre** de MI central: `anticipar` (corte limpio +Momento, o el delantero queda de cara al arco → gol muy probable), `barrerse` (corta, o falta → PENAL en el área / tarjeta, a veces roja → −Momento), `esperar` (contiene, remate normal a atajar, **nunca** da Momento). Marca `lastManStops` (+1) / `lastManFouls` (−1). |

**Faltas, lesiones y cambios**
| Método | Qué hace |
|---|---|
| `_foulEvent()` | Falta → amarilla/roja. La amarilla solo NARRA (22-jul: el popup de "protegerlo" se eliminó — cambiar al amonestado es decisión libre del DT en la Gestión en vivo). |
| `_injuryEvent()` | Lesión → golpe leve, o decisión `injury_sub` (22-jul): la UI abre la **Gestión de plantilla en vivo** con el caído marcado — reemplazo MANUAL, sin lista de recomendados. |
| `makeSub(out,inName,force)` | Sustitución. Reglas: máx 3, el sustituido no reingresa, y el que entra debe poder ocupar el puesto del que sale (`canPlayAt`). El que entra hereda `posJugada` del que sale — si salía un improvisado de defensa, el recambio también juega ahí. `force` es la excepción de la roja al arquero: el POR suplente entra por un jugador de campo y se va **al arco**, no a su puesto. También **cierra los minutos** del que sale y arranca los del que entra (para el cansancio). |
| `minutesByName()` | Minutos jugados por jugador (por nombre), para el cansancio de `medical`: titulares desde el 0, los cambios cortan/arrancan el conteo, y los que siguen en cancha se cierran al minuto final (90/120). No muta estado. |

**Goles, cierre y penales**
| Método | Qué hace |
|---|---|
| `_goalMine(p,flavor,assist,varOffside)` / `_goalOpp(p)` | Anota gol (con posible revisión de VAR; `varOffside=false` la salta — los goles de **penal** no pueden anularse por posición adelantada, bug del PO 21-jul-2026). `assist` atribuye asistidor a MIS goles de jugada: un jugador = pasador explícito (jugada de "pase"); `"open"` = jugada abierta, `ASSIST_CHANCE` (70%) a un compañero ponderado pro-MED; `undefined` = sin asistencia (penal, individual). Sube `asistencias` del asistidor y `match.assists`; el VAR revierte ambos. |
| `_finishRegular()` | Al minuto final: en eliminatoria, empate → prórroga → penales. |
| `_weightedPick(arr,weights)` | Elección aleatoria ponderada (protagonistas de ocasiones). |
| `startShootout()` / `shootoutStatus()` | Inicia y consulta la tanda. |
| `shootMyPen(name,dir)` / `shootOppPen(guess)` | Ejecuta un penal de la tanda. |
| `_checkShootoutEnd()` | Cierra la tanda por definición matemática o muerte súbita. |
| `result()` | Resultado final: marcador, ganador y detalle de penales. |

### 9. Entre partidos — `js/game/calendar.js`, `day-action.js`, `flow.js`, `discipline.js`, `momentum.js`, `morale.js`, `scorers.js`, `assists.js`, `journal.js` y `js/content/`
| Función | Qué hace |
|---|---|
| `dayLabel(day)` | Fecha real del día de la run ("Jue 11 jun"; día 1 = 11-jun-2026). |
| `scheduleNextMatch(run)` | Agenda el próximo partido a 5-6 días y pre-sortea el evento de cada día intermedio (evento inevitable — nivel de rareza ponderado por `RARITIES.weight` y luego un evento del nivel — o **conflicto** con probabilidad `conflictChanceFor(run.moral)`, sin repetir dentro de la ventana). Además, a lo sumo UN día libre esconde una Oportunidad (`dayPlan[d].opp`): cada día tira 20% y el primero que acierta corta. Llena `run.nextMatchDay`, `run.dayPlan` y `run.windowStart` (primer día de la ventana: hoy en el arranque, día siguiente al partido tras jugar — el calendario mantiene a la vista los días ya vividos). |
| `conflictChanceFor(moral)` / `CONFLICT_CHANCE_BY_BAND` | **calendar** (Sprint 2): probabilidad de que un día traiga conflicto según la banda de moral — nubes 0.12 · alta 0.18 · estable **0.25** (base) · baja 0.34 · suelo 0.42 (simétrica: vestuario feliz = semana tranquila, hundido = más incendios). La fija `scheduleNextMatch` para TODA la ventana leyendo `run.moral` post-partido. Sin tocar el motor del partido. |
| `addTournamentGoal(run,teamId,name)` / `assignScorers(run,teamId,n)` | **scorers**: suma un gol a un jugador / reparte `n` goles de un equipo entre sus figuras ponderando por puesto (DEL 3 · MED 2 · DEF 1 · POR 0.05). Alimentan `run.scorers` (solo equipos ajenos). |
| `tournamentScorers(run,limit?)` | **scorers**: tabla de goleadores del torneo combinando mi equipo (`run.squad[].goles`) con `run.scorers`, ordenada por goles con ranking de competición (`rank`). Sin doble conteo. |
| `addTournamentAssist(run,teamId,name)` / `assignAssists(run,teamId,n)` | **assists** (espejo de scorers): suma una asistencia / reparte los asistidores de `n` goles ajenos — cada gol con `ASSIST_CHANCE` (70%) de llevar asistencia, atribuida a una figura ponderada **pro-MED** (MED 3 · DEL 2 · DEF 1 · POR 0). Alimentan `run.assists` (solo ajenos). Consumen rng. |
| `tournamentAssists(run,limit?)` | **assists**: tabla de asistidores del torneo combinando mi equipo (`run.squad[].asistencias`, que atribuye el partido) con `run.assists`, ordenada con ranking de competición. Sin doble conteo. |
| `advanceDay(run)` | Pasa al día siguiente y resuelve lo que trae: `{type:"match"}` (llegó el partido), `{type:"evento",…, rareza}` (inevitable, ya aplicado; `effect` puede devolver un desc con protagonista), `{type:"conflicto",…}` (dilema: la UI aplica la opción elegida) o `{type:"tranquilo"}` (22-jul: el día de la Oportunidad NO trae evento — un solo estímulo por día; el calendario lo pinta 🧘). Todo día sin partido levanta además `run.actionPending`; si el evento trae `mod`, lo deja en `run.dayMod`; si el plan del día esconde una Oportunidad, la deja viva en `run.dayOpp` (ambos se limpian al empezar cada día: la oportunidad no tomada expira sin rastro). Las legendarias van al diario con tono dorado. |
| `applyDayAction(run,actionId,targetName?)` | **day-action**: aplica la Acción del Día elegida (`DAY_ACTIONS` o la Oportunidad viva hoy) escalada por el modificador del día — la Oportunidad NO se escala (decisión PO: premio externo) —, baja `actionPending`, escribe `lastAction` y anota el diario (la oportunidad con tono por rareza). Si la oportunidad trae `choose`, exige `targetName` válido entre sus candidatos (por nombre, §3.1); sin él no aplica NI consume el turno. Devuelve `{...accion, mult, desc}` (`desc` puede traer protagonista) o `null` si no había acción pendiente, el id no existe, la acción está bloqueada hoy o faltó el objetivo. |
| `actionMult(run,action)` | **day-action**: multiplicador de una acción HOY según `run.dayMod` (1 sin modificador; 0 = bloqueada). |
| `dayOpportunity(run)` | **day-action**: la Oportunidad viva HOY (fila completa de `content/opportunities`) o `null`. |
| `canjeableBuffs(run)` | **day-action**: stats cuyo buff para el próximo partido ya llega al umbral (`CANJE_THRESHOLD`): `[{key, buff, label, alcance}]` (`alcance` = jugadores del plantel con esa stat). Solo stats reales (`CANJEABLE_STATS`); penales/antiLesion nunca. Vacío si ninguna llegó. |
| `canjeBuff(run,key)` | **day-action** (Bible cap.6): canjea el buff de una stat por crecimiento PERMANENTE — descuenta `CANJE_THRESHOLD` del buff y suma `+CANJE_PERMANENT` (hoy +1) a esa stat en cada jugador que la tenga (clamp 1..99, nunca decrece). Gratis (no consume la Acción del Día) y anota el diario (tono gold). Devuelve `{key, label, permanent, alcance, jugadores}` o `null` si no llegaba al umbral / no es stat real. Escribe `squad[].stats` (ARQUITECTURA §3.1). |
| `choosePhilosophy(run,filoId)` | **philosophy**: elección post-sorteo, gratis (antes del día 1). Escribe `run.filoId`, `run.filoInicial` (la ESCUELA, fija toda la run: decide la afinidad de XP), el diario y **el PI inicial** (elegir ES el nivel 1 del DT; el flujo de inicio obliga a gastarlo en un rasgo básico). Devuelve la filosofía o `null`. |
| `changePhilosophy(run,filoId)` | **philosophy**: cambio a mitad de run — CUESTA la Acción del Día y vale como **Plan de Partido** (`run.planFilo`). Cada filosofía guarda su propio nivel: nada se hereda ni se pierde, y los rasgos comprados siguen activos. Devuelve la nueva o `null` (sin acción pendiente / id inválido / la actual). |
| `filoPoints(run,filoId?)` / `filoLevel(run,filoId?)` / `filoEtapa(run,filoId?)` / `filoCtx(run)` | **philosophy**: XP acumulada / índice de nivel 0..9 / etapa 0..2 de una filosofía (la activa por defecto — cada una lleva la suya) · `filoCtx` = `{id, nivel, etapa, rasgos, xp, mult, plan}` que viaja en `matchCtx.filo` (frontera run→Match): `rasgos` son TODOS los comprados y `xp`/`mult` son lo que el Match necesita para anunciar el skill-up en vivo. `null` sin filosofía. |
| `applyFiloXp(run,match)` | **philosophy** (arco de Progresión, el corazón del sistema): acredita `match.filoXp` (ya multiplicado por afinidad y Plan) en cada `run.filoXp`, resuelve las subidas de nivel, las convierte en XP del DT (`coach.filoLevelReward`) y deja que el DT imprima PI. La llama `flow.postMatchUpdate`; devuelve `{filos:[{id,name,icon,xp,mult,antes,ahora,intentos,aciertos}], dt, dtXp}` o `null` si el partido no dejó una sola jugada de identidad. |
| `filoXpMults(run)` / `PLAN_XP_MULT` | **philosophy**: multiplicadores de XP por filosofía = afinidad de la ESCUELA × ×1.5 si esa idea es el Plan de Partido declarado. Viajan al Match en `filoCtx.mult`. |
| `addCoachXp(run,xp,motivo)` / `dtLevelOf(xp)` / `dtProgress(run)` | **coach** (arco de Progresión): suma XP al Director Técnico, resuelve sus subidas de nivel (tope 20), imprime **1 PI por nivel** y narra el diario. Devuelve `{xp, niveles, pi, nivel}` o `null`. `dtLevelOf` mapea XP→nivel con `DT_LEVELS` (curva `DT_STEP` = 100+20·(n−1), 5.320 XP para el 20); `dtProgress` da `{curr, need, pct}` para las barras. |
| `FILO_LEVEL_REWARD` / `filoLevelReward(nivel)` | **coach**: lo que paga cada subida de filosofía SEGÚN EL NIVEL ALCANZADO (tabla exacta del GDD: 200·220·250·290·340·400·470·550·650). Es lo que hace que ESPECIALIZAR rinda más que repartirse. |
| `noteFiloIntent(m,type)` / `noteFiloHit(m)` | **match/sequences**: las dos mitades del 70/30 — la INTENCIÓN (cada secuencia que arranca, la llama `startSequence`) y la EFECTIVIDAD (cada acto que sale bien + el gol que corona). Acumulan en `m.filoXp` YA multiplicado por `filo.mult`, cuentan `m.filoIntentos`/`m.filoAciertos` y **anuncian la subida de nivel en el feed** (skill-up en vivo). El Match sigue sin conocer la run. |
| `activeTraitIds(run)` / `activeTraits(run)` | **traits**: TODOS los rasgos comprados, de cualquier filosofía (sin latencia desde el arco de Progresión: si lo compraste, juega). Viajan al Match en `filoCtx.rasgos`. |
| `traitReqs(run,t)` / `buyTrait(run,traitId)` / `traitTree(run,filoId?)` | **traits**: los requisitos vivos son el recorrido de la rama (`previo`/`todos`/`alguno`), el **nivel de la filosofía DEL RASGO** (1·3·6·10) y 1 PI — los Principios mínimos murieron con las aristas. `buyTrait` compra de CUALQUIER árbol y guarda en `run.rasgos[t.filo]`; `traitTree` arma el árbol pedido (la pizarra navega los 4). |
| `planPayoff(run,filoId)` | **traits**: lo que muestra la pizarra del hub al pasar por un Plan — `{propia, lvl, xp, nextAt, unlocks}`: dónde está esa idea, cuánta XP pide el próximo nivel y qué nodo del árbol abre. Puro. |
| `noteFiloMilestones(run)` | **philosophy** (M2, la CONQUISTA narrada): si el nivel cruzó un umbral desde la última narración (`run.filoNarrado`), el diario lo celebra — nivel 1 desbloquea la secuencia avanzada, nivel 2 la profundiza. La llaman `applyDayAction` y `flow.postMatchUpdate` (los beats donde crecen aristas); `choosePhilosophy` arranca la base en 0 y `changePhilosophy` la fija en el nivel heredado (lo heredado no se festeja). |
| `PHILOSOPHIES` / `ARISTAS` / `FILO_LEVELS` / `FIRMA_TYPE` / `addFiloProgress(r,pts)` | **content/philosophies**: las 4 filosofías (sus 2 principios de sabor, firma, lema, fuerte/advertencia) · las 5 aristas (ya SIN mecánica: describen y mapean tipo↔fútbol) · los 10 niveles por **XP acumulada** con su multiplicador (×1.35→×2.10) y su etapa · tipo firma por filosofía (derivado) · progreso desde contenido: `EVENT_XP` (80) por punto de evento a la filosofía activa, con afinidad — devuelve `{id,label,icon,xp,stat}`. |
| `FILO_BY_TIPO` / `filoOfType(type)` / `xpLevelOf(xp)` / `AFINIDAD` / `afinidadMult(ini,target)` / `XP_INTENCION` / `XP_ACIERTO` | **content/philosophies** (arco de Progresión): qué filosofía enseña cada tipo de secuencia (las avanzadas mandan con su `advFor`) · el nivel que corresponde a una XP (lo usan el Match y la run: una sola escalera) · la matriz de afinidad de la escuela (×2 propia · ×1.25 afín · ×1 neutral · ×0.6 opuesta) · los dos diales del 70/30. |
| `TEAM_PHILOSOPHIES` / `FILO_FORMATION` | **content/team-philosophies** (F2, decisión PO #4): los 16 curados por su fútbol REAL (7 Favoritos + 9 Aspirantes; cada asignación se defiende en el comentario) y la formación uniforme por filosofía (press 1-2-2 · posesión 1-3-1 · contra 2-2-1 · bloque 3-1-1). Vive en content/, NO en data/teams.js. |
| `derivePhilosophy(team)` / `rivalFiloLevel(team)` / `rivalFilo(team)` | **philosophy** (F2): identidad del rival — curada para los 16, DERIVADA determinista para el resto (r≤70 → bloque · r≥78 con 2+ MED → posesión · resto → contra; el Press no se deriva: solo curado). Nivel por jerarquía (r≥84 Consolidada · r≥78 En desarrollo · resto Aprendiendo). `rivalFilo` = `{id, nivel, curated}` para el Match (lo cachea `seqPlan`) y el scouting. |
| `applyFiloCosts(run,match)` / `PRESS_FATIGUE` | **philosophy** (F2, decisión PO #7): el costo físico del Press — −6 de energía extra post-partido a los que jugaron. La llama `flow.postMatchUpdate` ANTES de su loop (usa los flags `usado/sustituido` que ese loop resetea). Contra/Bloque pagan EN el partido (`filoShareShift`); Posesión no paga costo físico. Devuelve `{press, jugadores}` o `null`. |
| `filoShareShift(myFilo,oppFilo)` / `filoRasgo(m,filoId)` | **match/sequences** (F2): cuánto inclina la filosofía el reparto de iniciativa (mi Contra −0.05 · mi Bloque −0.08 · rival contra +0.04 · rival bloque +0.06, puro, se suma al mineShare; el Bloque además lleva balón parado ×1.3 como arma propia — ajuste PO post-gate) / ¿estoy Consolidado? (nivel 2). Desde M2 `filoRasgo` es el check de PROFUNDIDAD de la avanzada: los rasgos de F2 se fusionaron en ellas (trapBonus/foulBreakDeep de la Cacería · 4º compás y más penal de la sinfonía · deepBonus del letal · deepContain/convertDeep de la fortaleza). |
| `applyFiloWeights(m,side,w,oppFilo)` + `ADV_SOURCE`/`ADV_SHARE` | **match/sequences** (F1+F2+M2, TODO el sesgo de filosofía sobre el pool en un lugar): firma ×nivel → matriz de counters → arma del bloque → firma rival → y AL FINAL el gating de la AVANZADA (M2): desde nivel 1 REPARTE el peso de su tipo base (60/40; Consolidada 90/10) heredando todo lo anterior — medido: sumar en vez de repartir hundía a las identidades con riesgo (−5pp), y repartir antes de la matriz sobre-jugaba al letal en sus peores cruces. |
| `bestSixShaped(pool,formation)` | **opponents** (F2): mejor seis CON FORMA — mejor POR + los mejores por línea que pide la formación curada; línea corta se completa por nota. La usan `genOpponentLineup` y `expectedOpponentLineup` (el informe estima el once real) SOLO para los 16 curados. |
| `filoPointsOf(r,filoId?)` / `filoLevelOf(r,filoId?)` / `addFirmaProgress(r,pts)` | **content/philosophies** (F3): puntos/nivel PUROS sobre datos del propio archivo (el contenido los necesita — "La prensa bautiza tu estilo" lee el nivel — y content/ no importa game/; `game/philosophy.filoPoints/filoLevel` DELEGAN acá: una sola fuente del umbral) / progreso DIRECTO a la arista firma (eventos "Visita del maestro", "Ensayo de la firma", conflicto del referente). Cada filosofía trae además `counters` (mi fila de la matriz, cualitativa) y `firmaIntros` (las voces del relato con identidad); cada arista, la `stat` que trabaja. |
| `actSprint(m,p,{chaser,handicap,bonus})` | **match/actions** (Odisea 2ª mitad): la carrera por la banda — MI velocidad contra la del perseguidor (0.50 + Δvel·0.10). El primer duelo del motor que enfrenta velocidad contra velocidad. |
| `actCross(m,from,{rasante,bonus})` | **match/actions** (Odisea 2ª mitad): el envío desde la banda. Alto = `pase_largo` (termina en duelo aéreo); rasante = `pase_corto` (termina en remate de frente). Cuenta el pase en el panel y marca `centro` en el Match Momentum. |
| `protStatW(type,p)` | **match/sequences** (Odisea 2ª mitad): peso extra del protagonista por la STAT que la jugada pide (`type.protStat`), cuadrático sobre 70. Hoy solo lo usa el desborde (`velocidad`); es el gancho para cualquier jugada futura que pida un perfil. |
| ~~`PASE_MIX` / `paseMix(p)`~~ | **BORRADAS** (29-jul-2026, cierre de la Odisea). No hay "un número de pase": cada sitio declara cuál mide — circulación, atk del medio, precisión del panel y perfil del rival son `pase_corto`; filtrado, centro alto y pelotazo son `pase_largo`. Si aparece un caso nuevo, elige uno; no vuelvas a mezclar. Ver `docs/CORE.md §2`. |
| `buildDaily(run)` | **daily**: arma la edición del World Cup Daily — `{day, isMatchDay, items}` con 1-5 titulares `{icon, tag, text}` ordenados por prioridad (PORTADA/PLANTEL/GRUPO/RIVAL/MUNDIAL/HOY/COLOR, ver CORE §9); el primero es la nota de tapa. GRUPO marca al próximo rival si jugó anoche; RIVAL avisa sus suspendidos (`rivalBans`) y da el framing por paridad solo en la previa (≤2 días); MUNDIAL puntúa `run.lastNight` (batacazos por tier, goleadas, festivales, grandes, rojas); HOY es el `teaser` del evento/conflicto que trae el día (anticipa sin revelar). **Sin repetirse en la semana** (22-jul): un titular con el MISMO texto que ya salió en los últimos 7 días se suprime (`run._dailySeen`, texto → último día; la PORTADA no se toca; re-armar la edición del mismo día es idempotente). Solo lectura salvo `_dailySeen` y el rng del flavor. |
| `multLabel(mult)` | **day-action**: etiqueta corta para la UI ("×2", "×½"); `""` si es 1 o bloqueo. |
| `trackOxidacion(run,trabaja)` | **oxidation** (R1): registra el día para la racha — `trabaja` (Entrenar/Táctica desde `applyDayAction`, o el cambio de identidad desde `changePhilosophy`) la resetea; lo demás suma `run.diasSinEntrenar` y estampa `p.oxid` (=`oxidMult(racha)`) en TODO el plantel. La 1ª vez que cruza el umbral en la run, narra el episodio en el diario (`run.oxidNarrada`). |
| `resetOxidacion(run)` | **oxidation**: "jugar es ritmo" — resetea racha y estampado; lo llama `flow.postMatchUpdate` al cierre (el partido ya se jugó con la racha que traía el plantel). |
| `oxidState(run)` | **oxidation**: `{racha, mult, oxidado}` para la UI (chip del hub, línea de plantilla). |
| `koRoundOf(stage)` | **tournament/knockout** (R2): profundidad KO — 0 en grupos, 1 (16avos) … 5 (final). El eje de la escalada de rivales; viaja al Match como `matchCtx.koRound`. |
| `tourneyFormaMult(koRound)` | **opponents** (R2): la FORMA DE TORNEO — ×(1 + `TOURNEY_FORM_PER_ROUND`·ronda) = ×1.03…×1.15. `genOpponentLineup(team, banned, koRound)` la estampa como `p.forma` en el once rival; solo MIS partidos (el mundo simulado no cambia). |
| `rivalFiloLevel(team, koRound)` | **philosophy** (F2+R2/R3): nivel de identidad rival por jerarquía (≥84 Consolidada · 78-83 En desarrollo · resto Aprendiendo) — y en TODO KO (`FILO_MADURA_DESDE`=1, R3; nació 3=cuartos) +1 nivel, tope 2: nadie llega a eliminatorias sin idea. `rivalFilo(team, koRound)` lo empaqueta para Match/scouting. |
| `identityGapMult(oppTeam, myEtapa, koRound, myNivel)` | **philosophy** (R3 + el dial del techo 29-jul-2026): el multiplicador de identidad del rival en KO, **simétrico**. Si llego con menos idea, la BRECHA me castiga (×`IDENTITY_GAP_PCT`·brecha, +4%/etapa, brecha = etapa rival madurada − mi etapa). Si llego con más, la VARA ALTA (`IDENTITY_LEAD_PCT`, +16%/nivel, ventaja = mi nivel 0-9 − el primer nivel de la etapa rival vía `NIVEL_DE_ETAPA`): al favorito le juegan la final. Las dos con piso 0 y excluyentes entre sí; ×1 en grupos y ×1 en el partido parejo. Se apila sobre `p.forma`. El informe narra el total y de qué lado está (`modoMundial.brechaPct` / `.lead`). **`myNivel` es opcional: sin él solo se evalúa el castigo** — pasarlo es obligatorio en cualquier caller nuevo. |
| `closeMatch(run,match)` | **flow**: cierra un partido del usuario — stats, diario, goles del rival a la tabla de goleadores (`assignScorers`) y sus asistidores (`assignAssists`), resultado al grupo/ronda, simulación del resto de la fecha y `postMatchUpdate`. Devuelve `{res, otherResults, advanced, momentum, filoExec}` (`momentum` = resumen anímico por jugador; `filoExec` = progreso por ejecución de F1, para narrarlo en F3). |
| `postMatchUpdate(run,match)` | **flow**: cierre físico/disciplinario/anímico por jugador (delega en `applyMedicalPostMatch` con los **minutos** de `match.minutesByName()`, `applyDisciplinePostMatch` y `applyMomentumPostMatch` — este ANTES de resetear flags: lee `p.sustituido`), cierra la moral (`applyMoralePostMatch`), aplica la **progresión por ejecución** de la filosofía (`applyFiloExecution`, F1), limpia buffs y **re-agenda**. "Jugó" = está en el once final, entró del banco (`usado`) o **salió por un cambio** (`sustituido`). **Devuelve** `{momentum, morale, filoExec}`. |
| `advanceStage(run,advanced)` | **flow**: avanza el torneo y devuelve `{type: "next-matchday"\|"qualified"\|"eliminated"\|"next-round"\|"champion"}`; dispara `clearAmarillas` al cerrar grupos y tras 4tos, y `bumpMorale(+5)` al pasar de ronda. La UI solo rutea. |
| `applyMedicalPostMatch(run,p,played,minutos)` / `matchFatigue(minutos)` / `applyDailyRecovery(run,esDiaDePartido)` | **medical**: energía — jugar **cansa** (`matchFatigue`: −14 cada 30' disputados), descansar recupera +30; **recuperación pasiva** en TODO día nuevo (`applyDailyRecovery`, la llama `calendar.advanceDay`): `DAILY_RECOVERY`=+8 en día de preparación, `MATCHDAY_RECOVERY`=+2 la víspera del partido (Sprint 4: antes el día de partido no cobraba nada). Además descuenta la baja por lesión y anota el diario. `minutos` los calcula `Match.minutesByName`. |
| `fatigueInjuryMult(energia)` | **medical** (Sprint 4, cruce Energía→Lesión): multiplicador de **gravedad** de lesión según la energía — 1.0 desde `FATIGUE_INJURY_FROM` (50) hacia arriba, creciendo lineal hasta `FATIGUE_INJURY_MAX` (1.8) en el piso de energía. Lo aplica `match/incidents.injuryEvent` sobre la probabilidad de que el golpe sea grave. Sin campo `energia` devuelve 1 (la asimetría vive en los datos). |
| `applyDisciplinePostMatch(run,p)` | **discipline**: roja→suspensión; **acumulación de amarillas** (2 en el torneo = 1 partido fuera, contador a 0; doble amarilla = roja y NO acumula). |
| `momentoPct(p)` / `momentoMult(p)` | **momentum**: efecto % del Momento 1..7 sobre las stats (±2% por paso desde el neutro 4, tope ±4%; CORE §2c). Sin campo `momento` (rivales) → 0 / ×1: la asimetría vive en los datos. |
| `momentoLabel(p)` / `MOMENTO_LABELS` | **momentum**: etiqueta cualitativa del nivel (Paupérrimo/Apagado/Malo/Normal/Bueno/Encendido/Inspirado). La UI muestra la palabra, no el número. |
| `applyMomentumPostMatch(run,p,played,match)` | **momentum**: mueve `p.momento` con señales **individuales** (goles, **asistencias**, **cortes de último hombre**, penales fallados, **tarjeta/penal de último hombre**, arquero) — el **resultado NO lo toca** (eso es Moral) — acotado a +`MOMENTO_RISE_MAX` (=1) / −`MOMENTO_FALL_MAX` (=2); una **lesión** (`lesionadoPartidos>0`) lo **resetea al neutro**; sin señal, decae 1 paso hacia el neutro **solo si NO sumó minutos** (Sprint 4: el titular que jugó conserva su forma; el sustituido cuenta como que jugó). Lee `match.scorers`, `match.assists`, `match.lastManStops`, `match.lastManFouls`, `match.pensFallados`, `match.pensAtajadosPor`, `p.sustituido`, `p.lesionadoPartidos`. **Devuelve** `{name, pos, before, after, delta, reasons:[{tone,text}]}` para el análisis del cuerpo técnico. |
| `moraleBand(v)` / `MORAL_BANDS` | **morale**: banda anímica de un valor 1..100 (5 bandas, CORE §9). |
| `bumpMorale(run,delta,motivo)` | **morale**: mueve `run.moral` con clamp 1..100; cruzar de banda escribe el `motivo` en el diario. |
| `applyMoralePostMatch(run,match)` | **morale**: la moral del **resultado** (base ±10) y de CÓMO se dio — goles agónicos ≥85' que deciden (±4/±5, lee `match.oppGoalMins`), tanda ±3, y el cruce **vestuario apagado** (Sprint 4: `FRIOS_UMBRAL`=4 jugadores en momento ≤`FRIOS_MOMENTO`=2 restan `FRIOS_MORAL`=5, castigo plano; corre después del cierre de Momento de todo el plantel). **Devuelve** `{before, after, delta, bandBefore, bandAfter, reasons:[texto]}` para el análisis del post-partido. **Efecto mecánico** (Sprint 2): la moral modula la frecuencia de conflictos de la ventana (`calendar.conflictChanceFor`). El efecto EN-PARTIDO (hook `[MORAL → OCASIONES]` en `Match.tick`) sigue diferido al rework del partido. |
| `addJournal(run,entry)` | Agrega una entrada `{day,icon,title,desc,tone}` al Diario de Campaña (`run.journal`). El día se toma de `run.day` salvo override. |
| `clearAmarillas(run,motivo)` | Borra las amarillas acumuladas de todo el plantel y lo anota en el diario. Se llama al cerrar la fase de grupos y tras los cuartos. Las suspensiones pendientes NO se perdonan. |

Constantes de datos: `EVENT_THEMES` (4 temáticas con icono/color fijos: entrenamiento,
físico, vestuario, entorno), `RARITIES` (4 niveles con peso de sorteo y colores:
común 55 · infrecuente 27 · rara 13 · legendaria 5), `PREP_EVENTS` (33 eventos
inevitables con `rareza` — 10/10/8/5 por nivel, magnitud creciente; 3 interactúan con
Forma y Ánimo mutando `p.momento`/`r.moral` con primitivas + clamp, sin importar
`game/` — y `mod` opcional
que modifica las Acciones del Día vía `run.dayMod`), `RANDOM_EVENTS` (6 conflictos con
decisión, también con `tema`) y `DAY_ACTIONS` (6 Acciones del Día en
`content/day-actions.js`: 3 focos de entrenamiento con `group:"entrenar"`, recuperación,
sesión táctica y **Team Bonding** (+Moral, −energía; muta `run.moral` con clamp sin importar
`game/`); los `effect(run, mult)` escalan su recompensa — no el costo — por el
modificador; exporta también `TRAIN_BUFF` (+1), `TRAIN_FATIGUE`, `BONDING_MORAL`,
`BONDING_FATIGUE`, `TACTICS_BONUS` y las
constantes del canje `CANJE_THRESHOLD` (+4), `CANJE_PERMANENT` (+1), `CANJEABLE_STATS` y
`STAT_LABELS`).
También `DAILY_FLAVOR` (12 titulares de color `{icon, text}` para el World Cup Daily,
máximo 1 por edición y solo en días tranquilos) y `OPPORTUNITIES`
(`content/opportunities.js`: 19 Eventos de Oportunidad — Bible §4.5 — que compiten con
la Acción del Día, distribución 5/7/5/2 por rareza elegida por el PO; con `rareza` pero
SIN `tema` ni `teaser` porque ni el calendario ni el Daily las anticipan; máx 1 por
ventana, el modificador del día no las toca, y la que no se toma expira sin rastro.
Las de calidad permanente llevan `choose: {label, candidates(run)}`: el DT elige al
jugador protagonista y `effect(run, jugador)` lo recibe).
El esquema de todo este contenido es LEY en `tests/events.validate.js`, que además
aplica cada efecto contra una run fresca (energías en rango, buffs finitos, stats 1-99,
momento 1..7 y moral 1..100).

### 10. API pública
No existe fachada (F7): la superficie pública del motor es la suma de los exports de sus
módulos, y cada pantalla importa exactamente lo que usa. Para los tests, `tests/load-engine.js`
agrega todos los módulos en un objeto `Engine` de conveniencia.

---

## La interfaz — `js/ui/` (DOM, una pantalla por archivo)

La UI vive en módulos: `js/ui/` (infraestructura visual) y `js/ui/screens/` (una
pantalla = un archivo). Cada pantalla importa directamente los módulos del motor que
necesita y se REGISTRA en `ui/nav.js` al cargarse; la navegación
entre pantallas es `go("nombre", ...args)` — así no hay imports circulares (§4).
`js/main.js` importa todas las pantallas y abre el menú.

| Módulo | Contiene |
|---|---|
| `ui/nav.js` | registro de pantallas: `register(name, fn)` / `go(name, ...args)` |
| `ui/session.js` | `S`: run, match, matchCtx, selectedLineup, timer, paused, speed, feedRendered |
| `ui/components.js` | §2-3: stars, energía, banderas, dorsales, toast, modal, screenShell, `$`, `app` |
| `ui/pitch.js` | La cancha 8-bit reutilizable (§6b): césped, fichas del once, banco y arrastre. La comparten Gestión de Plantilla y el partido |
| `ui/sprites.js` | §2: spriteSvg, rivalLook, nameHash |
| `ui/theme.js` | §2: applyTeamColors, trofeo y balón SVG |
| `ui/screens/menu.js` | §4: carrusel (la regla de dificultad vive en `game/ratings`) |
| `storage/history.js` + `ui/screens/history.js` | §5: persistencia / pantalla |
| `ui/screens/identity.js` | §6 (`start-run`) |
| `ui/screens/draw.js` | §6 (`draw`) |
| `ui/screens/hub.js` | §7: hub, calendario, efectos, modales de evento/conflicto |
| `ui/screens/squad.js` | §7: Gestión de Plantilla (las reglas viven en `game/lineup`) |
| `ui/screens/worldcup.js` | §7: Estado del Mundial + tarjetas de posición reutilizables |
| `ui/screens/journal.js` | §7: Diario de Campaña |
| `ui/screens/match/` | §8: partido en vivo — `index` (pantalla, reloj, decisiones) · `panels` (columna de lectura) · `tactics` (palancas del DT) · `squad` (plantilla en vivo) |
| `ui/screens/shootout.js` | §9: tanda de penales |
| `ui/screens/post-match.js` | §10: pinta resultados y rutea según `flow.advanceStage` |
| `ui/screens/end.js` | §11: desenlace |

Las secciones siguientes documentan las mismas funciones, ahora indicando su módulo.

### 1. Estado global — `ui/session.js` y `ui/nav.js`
El objeto `S` (session) guarda: `run`, `match`, `matchCtx`, `timer`, `paused`, `speed`,
`feedRendered`, `selectedLineup`. `nav.js` registra y resuelve la navegación por nombre.
Los helpers `app()` y `$()` viven en `ui/components.js`.

### 2. Componentes visuales — `ui/components.js`, `ui/sprites.js`, `ui/theme.js`
| Función | Qué hace |
|---|---|
| `starsHtml(rating,size)` | Fila de 5 estrellas con relleno parcial. |
| `energyBar(en)` | Barra de energía coloreada (verde = dentro de la banda, `ENERGY_OK`). |
| `energyCls(en)` | Clase de color del texto de energía: verde = EN la banda verde (M1, ≥`ENERGY_OK`), ámbar = paga peaje, rojo = fundido (≤35). Una sola fuente con el motor. |
| `posBadge(pos)` | Etiqueta de posición con color. |
| `flagImg(team,cls)` | Bandera como `<img>` local (los emoji no renderizan en Windows). |
| `applyTeamColors(team)` | Vuelca los colores del equipo a variables CSS `--team-*`. |
| `teamChip(team)` | Bandera + nombre en línea. |
| `numTag(p)` | Dorsal como mini-placa. |
| `momentoChip(p)` | Icono del Momento sobre la ficha por nivel 1..7: 7 🔥 · 6 ▲verde · 5 ▲amarillo · 4 nada · 3 ▼amarillo · 2 ▼celeste · 1 ❄️ (color = intensidad, forma = dirección). `""` si no tiene `momento`. |
| `nameHash(s)` | Hash FNV-1a → entero estable (sprites deterministas). |
| `rivalLook(name,team)` | Apariencia procedural de un rival sin `look` propio. |
| `spriteSvg(player,team)` | Sprite pixelado 12×14 dibujado píxel a píxel en SVG. |
| `TROPHY_SVG` / `BALL_SVG` | Trofeo y balón Trionda como SVG propios. |

### 3. Helpers de pantalla — `ui/components.js`
| Función | Qué hace |
|---|---|
| `toast(msg)` | Notificación flotante que desaparece sola. |
| `modal(html)` | Abre un modal centrado; devuelve el nodo para enganchar handlers. |
| `closeModal()` / `modalOpen()` | Cierra el modal activo · dice si hay uno abierto (lo usa `pasarDia` como guarda anti doble-día). |
| `screenShell(inner, maxW?)` | Reemplaza la pantalla completa. `maxW` por defecto `max-w-5xl`; Gestión de Plantilla usa `max-w-6xl` (cancha + panel). |

### 4. Menú principal — `ui/screens/menu.js`
| Función | Qué hace |
|---|---|
| `difficultyOf(team)` | Etiqueta de dificultad según la media (label, colores, descripción). |
| `renderMenu()` | Pinta el menú: héroe, pestañas de continente, carrusel y plantel. Debajo del equipo muestra su **descripción** (`content/team-flavor.teamDesc`, ya no el texto de dificultad — el chip de tier sí queda) y su **figura** (`teamFigure`). |

Estado del menú: `menuSel` (equipo activo), `menuConfed` (pestaña). El botón 🎲 sortea un
equipo y posiciona el carrusel sin iniciar la partida.

### 5. Historial — `storage/history.js` + `ui/screens/history.js`
| Función | Qué hace |
|---|---|
| `getHistory()` / `saveHistoryEntry(e)` | Leen/escriben el historial en `localStorage`. |
| `renderHistory()` | Pantalla con las runs pasadas. |

### 6. Inicio de run y sorteo de grupos — `ui/screens/identity.js`, `ui/screens/draw.js`
| Función | Qué hace |
|---|---|
| `startRun(teamId)` (identity.js, `start-run`) | Crea la run, aplica colores y muestra la elección de identidad. |
| `renderChooseIdentity()` (identity.js) | Pantalla previa al sorteo (F1, decisión PO #1: se elige apenas confirmado el equipo, ANTES de ver el grupo): confirma equipo o vuelve a `menu`, y 4 cards de identidad en grilla 2×2 con aristas, lema, fortaleza, advertencia de counter y el rasgo de Consolidada. "Confirmar" queda deshabilitado hasta elegir; aplica con `choosePhilosophy` y sigue a `draw`. |
| `renderDraw()` (draw.js, `draw`) | Pantalla de sorteo con los 12 grupos (la identidad ya quedó fijada). "Comenzar la aventura" lleva a `hub`. |

### 6b. La cancha reutilizable — `ui/pitch.js`
| Función | Qué hace |
|---|---|
| `mountPitch(cfg)` | Pinta (o repinta) el césped, el once y el banco, y engancha el arrastre. **No conoce reglas**: quien la monta pasa `canSwap(a,b)` → `null` \| `{tone}` y `onSwap(a,b)`. En Gestión de Plantilla un arrastre mueve jugadores; en el partido es una reubicación (azul, gratis) o un cambio (verde, gasta 1 de 3). |
| `POS_NAME` | `POR→Arquero`, `DEF→Defensa`, `MED→Mediocampista`, `DEL→Delantero`. |

Dos detalles que NO son estéticos y no conviene "arreglar":
- Las filas salen de **`playedPos(p)`, no del índice del slot**: así cae bien el arquero que entra por una roja, que ocupa el índice del jugador de campo que salió pero juega en el arco.
- El resalte de destinos válidos va **por clases, sin repintar**: repintar en `dragstart` destruye el nodo que el mouse arrastra y cancela el drag.

### 7. Hub y sus pantallas satélite — `ui/screens/hub.js` · `squad.js` · `worldcup.js` · `scorers.js` · `journal.js`
| Función | Qué hace |
|---|---|
| `nextOpponentId()` | Id del próximo rival (grupo o cruce). |
| `renderHub(opts)` / `pasarDia()` | Pantalla central (layout calcado de la referencia del PO): cabecera con iconos de Diario 📖 y Estado del Mundial 🏆; banda VS a lo ancho; cuerpo en **3 columnas de igual alto** (`items-stretch` — IZQ estado del equipo con la cancha y los efectos · CENTRO acción del día · DER grupo + goleadores). En cada columna un bloque crece (`flex-1`) para no dejar hueco. A lo ancho abajo, el calendario y el botón del día. En móvil apila. Contenedor `max-w-7xl`. `pasarDia()` avanza al día siguiente (advanceDay + portada del Daily + evento); lo usan el botón "Pasar al día" y, vía `opts.autoAdvance`, la **vuelta del partido** — el partido consume su día, así que al volver al hub arranca el día siguiente, no el del partido. **Guarda anti doble-día** (Sprint 4): `pasarDia` corta si hay un modal abierto (`modalOpen()`) — todo camino legítimo llega sin modal, así que un modal abierto significa que la cadena Daily→evento de este día ya está en curso (doble clic). |
| `alturaPicker()` / `wireAlturaPicker()` | **La altura del bloque** (Territorio): los 5 botones y la explicación de la elegida, escribiendo `run.altura`. Vive en DOS sitios —la card del día de partido y el **Informe del Rival**— porque la decisión se toma LEYENDO al rival; por eso el markup y el cableado se comparten en vez de copiarse. `wireAlturaPicker` cablea y repinta TODOS los pickers del documento a la vez: el que quedó detrás del modal no puede mentir. |
| `teamStateCard(v,discipline,fueraDePuesto,forma)` / `stateChip(...)` | Columna izquierda "Estado del equipo": formación, la cancha del once (solo lectura, clic → Gestión de Plantilla), chips de Moral y Energía, **los efectos para el próximo partido** (`buffChips`) con los botones de **canje** (`canjeableBuffs` → `showCanje`, disponibles también en día de partido), los avisos que importan (alineación inválida, fuera de puesto, sanciones, forma) y el botón a Gestión de Plantilla. La card llena su columna (`h-full flex flex-col`) y la cancha absorbe el alto sobrante (`flex-1`, piso `min-h-[22rem]`) — el arquero se ve completo y la columna nunca deja hueco. La cancha la monta `renderHub` con `mountPitch` tras pintar. |
| `actionCard()` | Panel de la **Acción del Día** (Bible §4.7): la Oportunidad del día arriba (si hay), los focos de Entrenar agrupados en una fila + una tarjeta-botón por acción suelta. Aplica vía `game/day-action`. Si hay `run.dayMod` muestra su banner y bloquea (`disabled` + gris) o etiqueta ("×2 hoy") las acciones afectadas. **Una vez elegida, el panel NO desaparece**: se queda con la acción elegida resaltada (✓ Elegida hoy, usando `run.lastAction.id`/`.group`) y las demás en gris no clickeables — así el bloque no cambia de tamaño (evita huecos en la columna) y queda claro qué se decidió y que no se puede elegir otra. |
| `oppCard()` | Card de la **Oportunidad del día** (Bible §4.5): borde y badge de su rareza + recordatorio "solo por hoy, ocupa tu Acción del Día". Click: aplica directo, o abre `showOppChooser` si trae `choose`. `""` si hoy no hay. |
| `showOppChooser(o)` | Modal selector de protagonista de una oportunidad con `choose`: candidatos con sprite/nombre/puesto/nota; elegir aplica (`applyDayAction` con el nombre) y consume el día; "decidir más tarde" cierra sin tocar nada. |
| `showDaily(daily,onClose)` | La **portada del Diario del Mundial** (papel crema, serifas, doble filete, nota de tapa grande + titulares secundarios con su sección en rojo). Se abre al llegar a un día nuevo, antes del evento; "Doblar el diario" dispara `onClose`, que encadena el modal de evento/conflicto o el toast de día de partido. |
| `renderCalendarCard(opp)` | Franja de la ventana COMPLETA (`windowStart..nextMatchDay`): días ya vividos en gris ("✓ vivido"), HOY resaltado, temática por día futuro, rival en el día de partido. Los días no se borran al avanzar. |
| `moraleRow()` | Fila de la Moral del equipo (banda + barra) embebida en el bloque de plantilla del hub. |
| `renderScorersCard()` / `wireScorersCard(rootEl)` (en `scorers.js`) | **Carrusel** top-5 del torneo para el hub con 2 pestañas — ⚽ **Goleadores** (`tournamentScorers`) / 🅰️ **Asistidores** (`tournamentAssists`) — que se togglean con los iconos del encabezado; llena su columna (`h-full flex flex-col`). El hub lo envuelve en un contenedor clickeable que va a la pantalla completa; `wireScorersCard` cablea el toggle **cortando la propagación** para no navegar al cambiar de pestaña. |
| `renderScorers()` (pantalla `scorers`) | Tabla completa del torneo con **toggle** Goleadores / Asistidores (mismo componente de fila, `col` = G/A): puesto, bandera, jugador, selección y el valor; mi equipo resaltado. |
| `buffChips()` | Chips con los efectos acumulados para el próximo partido (usa `STAT_LABELS` de `content/day-actions`; el chip de `tactica` murió con el buff en F1). Un buff de stat que ya llega a `CANJE_THRESHOLD` se resalta con ✨ y colores del equipo (es canjeable). |
| `filoCard()` (hub) / `renderPhilosophy()` (pantalla `philosophy`) | **F3 "La vitrina"** (+M2): la card compacta de identidad del hub (filosofía, nivel, barra al próximo umbral; clic → pantalla) / la pantalla completa: nivel con barra, las 5 aristas (propias destacadas, cada una con el tipo de jugada que genera), la firma con su ×mult, la **SECUENCIA AVANZADA** (M2: 🔒 hasta En desarrollo → "✅ Fútbol superior desbloqueado", con su profundización de Consolidada 🔒/✅ — el rasgo fusionado) y MI fila de la matriz en cualitativo (regla 4). El sorteo (draw) vende la avanzada desde la elección ("🔓 En desarrollo: tu fútbol superior"). Solo lectura: el cambio sigue en el hub. |
| `filoBlock(filo)` (post-match) | **F3**: el bloque 🧭 Identidad del análisis del cuerpo técnico — la progresión por ejecución (`filoExec`: "+0.25 de Presión, 2 aciertos de tu firma" o "la firma no salió hoy") y el costo del Press (`filoCost`: "−6 de energía extra a los N que corrieron"). Silencio si no hay nada que contar. |
| `showFiloChange()` | Modal del **cambio de filosofía** (F1, decisión PO #1): las otras 3 con sus aristas, cuántos puntos tuyos le sirven a cada una ("arranca con N pts" — el costo hundido a la vista) y su advertencia; confirma con `changePhilosophy` (cuesta la Acción del Día) y re-renderiza. El botón vive en el panel de la Sesión Táctica, solo con acción pendiente. |
| `showCanje(key)` | Modal de confirmación del **canje de entrenamiento** (Bible cap.6): explica que renuncias a +`CANJE_THRESHOLD` del boost por +`CANJE_PERMANENT` PERMANENTE a esa stat para todos los que la tienen; confirma con `canjeBuff` y re-renderiza. |
| `themeHeader(tema)` | Cabecera de temática (icono/color fijos) de los modales de evento/conflicto. |
| `showDayEvent(ev)` | Modal del evento inevitable del día (ya aplicado por el motor), con su badge de rareza coloreado (`RARITIES`). |
| `renderJournal(back)` | Pantalla del **Diario de Campaña**: entradas agrupadas por día, coloreadas por `tone`; `back` define a dónde vuelve (hub o desenlace). |
| `renderGroupTableCard()` / `renderKoInfoCard()` | Tarjetas de tabla / info de eliminatoria. |
| `renderSquadScreen()` / `moraleBadge()` | **Gestión de Plantilla**: cancha con el once, selector de formación, ficha del jugador y los 4 suplentes; el encabezado muestra la barra de Moral (`moraleBadge`) a la izquierda de la media. Las reglas son de `game/lineup`; aquí solo viven las coordenadas (`ROW_Y`, `spreadX`), que son presentación. |
| `renderPitch()` / `pitchToken(p,…)` | Dibuja el once sobre el césped. Las filas salen del once REAL, no de la formación elegida: así una alineación improvisada también se pinta bien. |
| `renderFormationPicker(available)` | Selector con las 6 formaciones y su diagrama de puntos; desactiva las que el plantel no cubre (Brasil no puede 3-1-1: tiene 2 DEF). |
| `renderEnergyPanel()` | **Vista de energía del plantel** (Sprint 3): todas las barras de un vistazo, ordenadas del más cansado al más entero — el insumo para decidir la rotación. Negrita = titular del once actual; atenuados = suspendidos/lesionados; clic en una fila abre esa ficha. |
| `renderPlayerCard()` / `renderBench()` / `statRow(p,key)` | Ficha del seleccionado y las 4 fichas del banco. Cada `statRow` pinta la **barra del stat base** (`baseStatAt`, colores de siempre) y aparte el **boost/nerf del Momento** (dorado si suma, celeste si resta). La fila del Momento muestra la **etiqueta cualitativa** (`momentoLabel`) + su icono, sin el número 1..7. |
| `partnersFor(p)` / `onPick(name)` | Recambios válidos (solo misma posición: la posición ES la formación) y clic sobre una ficha: permuta si es recambio, si no abre su ficha. |
| `showRandomEvent(ev)` | Modal de un conflicto con decisión y aplicación del efecto elegido. |

### 8. Partido en vivo — `ui/screens/match/` (carpeta desde el 30-jul-2026)

La pantalla más grande del juego, partida en cuatro módulos que operan sobre el MISMO DOM
(mudanza pura: ninguna regla cambió). Quién hace qué:

| Módulo | Responsabilidad | Exporta hacia afuera |
|---|---|---|
| `index.js` | La pantalla: estructura fija (marcador, controles, relato), el **reloj del relato** y el **ruteo de decisiones**. Registra `start-match`. | `stopTimer`, `startTimer`, `updateMatchUI` |
| `panels.js` | La **columna de lectura**: estadísticas, XP de identidad en vivo, Match Momentum, mapa de calor y el carrusel que alterna los dos últimos. Es PINTURA pura: el motor sirve los datos masticados. | `paintStats`, `paintFiloXp`, `paintMomentum`, `paintHeat`, `wireCarousel`, `resetCarousel` |
| `tactics.js` | Las **palancas del DT** en juego: botón de presión y pizarra de la altura del bloque. Las reglas viven en `game/match/press` y `game/match/field`. | `wireTactics`, `paintTactics` |
| `squad.js` | La **Gestión de plantilla en vivo**: cancha, dibujo, plan de cambios. | `openSquadModal` |

**Dos reglas de la frontera**: (1) cada módulo cablea SUS controles —el estado de la vista
(`slide`, `heatSide`) no cruza a mano—; (2) `tactics` y `squad` importan `updateMatchUI` /
`startTimer` de `index`: ciclo **benigno de runtime**, igual que `sequences` ↔ `sequence-acts`.
| Función | Qué hace |
|---|---|
| `openSquadModal()` | **Gestión de plantilla en vivo**: la cancha de `ui/pitch.js` con el partido en pausa. Arrastrar titular sobre titular reubica (azul, gratis) — **salvo dos que jueguen el MISMO puesto** (enrocar dos defensas no cambia nada: se prohíbe, pedido del PO); traer a alguien del banco es un cambio (verde, gasta 1 de 3). **Nada toca el partido hasta Confirmar**: los cambios se arman como plan y se aplican juntos; "Salir sin guardar" lo descarta. Las reubicaciones sí mutan `posJugada` en el momento (es lo que la cancha lee para previsualizar), por eso se guarda el estado previo y se restaura al cancelar. Al confirmar se aplican **primero los cambios y después las posiciones finales**: si el DT reubicó a alguien DESPUÉS de meterlo, `makeSub` le pondría el puesto del que salió y el plan quedaría pisado. |
| `startMatch(oppId)` | Crea el `Match` y arranca el reloj. |
| `renderMatchScreen()` | Estructura fija: marcador, controles, relato, alineaciones. |
| `step()` / `startTimer()` / `stopTimer()` / `togglePause()` | Control del reloj. **Ritmo ráfaga (A1, recalibrado 22-jul)**: el reloj se auto-agenda con `setTimeout` (no `setInterval`), corre entre secuencias (`CRUISE` ~600 ms, ~260 en Rápido) y **frena** en cada decisión; un gol pausa `GOAL_HOLD` 1600 ms. **Aire entre actos**: la intro de una secuencia respira `SEQ_INTRO_HOLD` (900) antes del primer modal, cada acto resuelto respira `ACT_HOLD` (1300) antes del siguiente, y el desenlace `SEQ_END_HOLD` (900) antes de que el reloj retome — todo vía `presentDecision`, que además rutea `injury_sub` a la Gestión en vivo en lugar del modal genérico. |
| `updateMatchUI()` | Refresca marcador, minuto, relato, estadísticas, momentum, mapa de calor y el botón del bloque. |
| `paintCarousel()` / `moveCarousel(d)` / `paintHeat(match)` | **El carrusel de lectura** (Territorio): Match Momentum ↔ Mapa de calor en el mismo sitio, con toggle mío/rival. El mapa se repinta una vez por minuto (15 nodos con desenfoque), no en cada refresco. |
| `openHeightModal()` | **La pizarra de la altura**: las 5 alturas con su explicación y el costo a la vista (gratis / consume ventana táctica). El motor manda (`fieldState` dice qué se puede elegir); acá solo se pinta y se rutea. Muestra cómo está parado el rival **con palabras**. |
| `showDecision()` / `handleDecision(d,key)` | Muestran y enrutan las decisiones al motor. `sequence` → `resolveSequenceAct`; penales y último hombre como antes. |
| `showHalftime()` | Pausa de entretiempo. |
| `openSubsModal()` | Modal de cambios con reglas (sustituido en gris, POR solo por POR). |

### 9. Tanda de penales — `ui/screens/shootout.js`
| Función | Qué hace |
|---|---|
| `startShootoutUI()` | Inicia la tanda. |
| `pensTally()` | Marcador con secuencias 🟢/🔴. |
| `shootoutTurn()` | Un turno: pateador+dirección (mío) o lado del arquero (rival). |
| `showPenResult(text,pos)` | Resultado de un penal y encadena el siguiente. |

### 10. Fin de partido y avance — `ui/screens/post-match.js`
| Función | Qué hace |
|---|---|
| `finishMatch()` | Cierra el partido en el motor (`closeMatch`) y pinta el post-partido (o rutea directo al desenlace tras la final). |
| `renderPostMatch(res,advanced,momentum,morale)` / `analisisCard(momentum,morale)` | Pantalla post-partido: marcador, goleadores y el **"🧠 Análisis del cuerpo técnico"** (reemplaza a los otros marcadores) — arriba la **Moral del equipo** (banda antes → después + razones del resultado) y debajo el **Momento** de cada jugador que se movió (nivel antes → después + `reasons`). **Anti-spam** (Sprint 4, `friosBlock`): se detallan solo los **movimientos reales**; los enfriamientos por no sumar minutos se colapsan en UNA línea desplegable (`<details>`, cero JS) — el criterio de corte es la razón (`esDecaimiento`), no el signo del delta. En grupos va a 2 columnas (tabla del grupo + análisis); en KO, una columna centrada. Al continuar, `routeAdvance` vuelve al hub **con el día ya avanzado** (`go("hub",{autoAdvance})`); `finishMatch` y `routeAdvance` llevan **guardas de un solo disparo** (`cerrando`/`avanzando`) porque son alcanzables por varios caminos y un doble disparo avanzaba dos días de una (bug del doble evento). |
| `advanceTournament(advanced)` | Decide qué sigue (fecha, clasificación, ronda o fin). Anota los hitos en el diario y llama a `clearAmarillas` al cerrar grupos y tras cuartos. |
| `showQualifiedModal()` | Celebración al clasificar a eliminatorias. |

### 11. Fin de la run — `ui/screens/end.js`
| Función | Qué hace |
|---|---|
| `endRun(champion,abandoned)` | Cierra la run: entrada final del diario, guarda historial y delega en `renderEndScreen`. |
| `renderEndScreen(...)` | Pantalla de desenlace con estadísticas y botón "📖 Revivir la campaña" (separada de `endRun` para volver desde el diario sin re-guardar). |

### 12. Init — `js/main.js`
| Función | Qué hace |
|---|---|
| (cuerpo del módulo) | Importa todas las pantallas (se auto-registran en nav), valida `WC_DATA` y abre el menú con `go("menu")`. Los módulos corren con el DOM listo: sin `DOMContentLoaded`. |

---

## `tests/` — Verificación (EN el repo desde el 15-jul-2026)

- **`run-all.js`** — corre toda la batería en orden y resume (`node tests/run-all.js`).
- **`smoke.js`** — simula runs completas sin UI con decisiones al azar y verifica invariantes
  (disciplina, diario, energía, límites de loop). `--team=BRA --runs=1500` es el árbitro de
  deriva de balance; `--all` tabula las 18 jugables.
  **`--smart`** (M1): el **DT greedy que mide el TECHO** (el azar mide el piso). Heurísticas
  acordadas con el PO: Recuperar SOLO si la energía media del once proyectado cae bajo
  `ENERGY_OK`; Bonding con moral ≤40; **Plan de Partido** a su escuela mientras esa idea no
  esté en el techo (y a la siguiente más afín si lo está); después Entrenar (defensa: 2 stats/día). Nunca cambia de filosofía y NO
  toma Oportunidades (comparable con `--action`). Excluye `--action`; compone con
  `--team`/`--filo`. Nació para el arco del Meta: el arco cambia la estrategia óptima y el
  azar no la ve.
  **`--focus`** (arco de Progresión): el DT compra rasgos **con intención** — solo en el árbol
  de su escuela y siempre el más profundo disponible, en vez de al azar entre los 4 árboles.
  Es el techo REAL del árbol: sin él la tasa de Master del smoke mide a un DT que esparce sus
  PI, no al sistema (medido a igual dial: 5.3% al azar vs **21.7%** con intención).
  **`--action=<id|grupo>`** fija la Acción del Día (`entrenar`, `recuperar`, `tactica`…) para
  **comparar estrategias** y auditar el "no dominant strategy" del Bible (con el flag no se
  toman oportunidades). `--nocanje` apaga el canje para aislar su efecto.
  Desde F1 elige la **filosofía al azar** al nacer la run y el foco de la Sesión Táctica
  también al azar — mide el **PISO** de la mecánica, no el techo. Los 5 focos se **colapsan a
  uno por día** en el sorteo de acciones: si entraran los 5, la táctica pasaría de ~1/5 a ~5/9
  de los días y la comparación con los baselines quedaría envenenada.
  **`--filo=<id>`** (F2) fija la filosofía de todas las runs (`press|posesion|contra|bloque`)
  para fotografiar cada identidad por separado — así se aisló al Bloque como lastre del
  primer gate de F2 (26.1% vs 34.4% de Posesión) antes de darle su arma.
  OJO — el smoke **decide como decidiría alguien**, no al bulto: el **Team Bonding** solo entra
  al menú con la moral ≤40 (vestuario caldeado). Ofrecerlo siempre modelaba a un DT que quema
  días subiendo moral que ya estaba bien y hundía la medición −2.5pp aun siendo gratis (mismo
  criterio que el canje greedy: si el árbitro no juega como una persona, miente).
- **`teams.validate.js`** — LA LEY del esquema de datos: ids/banderas/48 clasificados,
  stats 1–99, dorsales únicos (el 1 solo POR), look válido, ≥1 por posición (distribución
  libre por decisión del PO); sprites duplicados = advertencia.
- **`discipline.test.js`** — 24 checks deterministas de amarillas acumuladas, suspensiones,
  limpiezas, lesiones y energía post-partido.
- **`medical.test.js`** — cuerpo médico y economía de energía: el cruce **Energía→Lesión**
  (`fatigueInjuryMult`: umbral, tope, monotonía, y que ni con las piernas vacías el golpe sea
  lesión garantizada), el descanso pasivo de día de preparación vs **víspera de partido**
  (incluida una run real llevada hasta el día del partido) y `matchFatigue`. Los valores se
  **derivan de las constantes**, no se hardcodean: un rebalance futuro no rompe el test.
- **`powers.test.js`** (M1) — la **banda verde** de energía en unitario (ley del sprint: la
  curva no se testea solo por smoke): plana sobre `ENERGY_OK`, convexa bajo el umbral (a
  mitad de rampa, un cuarto del castigo), piso exacto `ENERGY_FLOOR_MULT`, monotonía sin
  saltos, sin castigo para el rival duck-typed, la banda avisa antes que el riesgo de
  lesión (`ENERGY_OK > FATIGUE_INJURY_FROM`), y `effStat` monta la banda (75 juega como 100).
- **`oxidation.test.js`** (R1) — la **oxidación** en unitario (ley del arco): la curva
  comprimida racha 3→5 (tabla exacta ×0.983/×0.933/×0.85, convexidad, monotonía, clamp),
  el **piso combinado** banda×óxido sobre `effStat` (×0.6375 exacto, el riesgo declarado
  de apilar dos multiplicadores), y la regla de la racha sobre el motor real: Recuperar y
  Bonding suman, Entrenar/Táctica/cambio de identidad resetean, el cierre de partido
  resetea, el primer episodio se narra UNA vez por run y `oxidState` cumple su contrato.
- **`sequences.test.js`** (Sprints A1-A2) — la capa de secuencias: el catálogo (8 tipos, esquema,
  sides, los 6 del roadmap presentes), las Football Actions (bien formadas y **monótonas** en la stat
  que las rige; contener corta más que presionar), y la máquina sobre un Match real: arranca, avanza
  multi-acto y **cierra sin loops**, respeta el objetivo 2-6, TODOS los tipos aparecen jugando, el
  último hombre sigue asomando (absorción + pelotazo a la espalda), la **salida bajo presión
  convierte en transición** (y también castiga), y reventarla es siempre segura.
- **`momentum.test.js`** — el Momento 1..7: mapa nivel→% con tope (derivado de `MOMENTO_PCT_STEP`
  /`MOMENTO_PCT_CAP`, más la forma de la curva: simétrica y topada), asimetría (rival sin
  campo = sin efecto), integración con ratings (ficha/naturalOverall/statPenalties) y las
  reglas post-partido (señales individuales incl. **asistencia/último hombre**, tope +1 que
  acota la suma de señales, **decaimiento solo para quien no jugó**, clamps).
- **`morale.test.js`** — la Moral 1..100: bandas, clamps, diario solo al cruzar de banda,
  el cierre post-partido (base V/E/D, goles agónicos que deciden, extra de la tanda) y el
  **efecto mecánico Sprint 2** (`conflictChanceFor` monótona por banda + comprobación
  estadística de que la moral baja agenda más conflictos que la alta), más el cruce
  **Momento→Moral** del Sprint 4 (umbral exacto, castigo plano, "Malo" no cuenta como
  apagado, y fallback si la run llega sin `squad`).
- **`scorers.test.js`** — la tabla de goleadores: `assignScorers` reparte n goles ponderados
  por puesto, `tournamentScorers` combina mi equipo con el resto sin doble conteo y con
  ranking de competición.
- **`assists.test.js`** — la tabla de asistidores (espejo de scorers): `assignAssists`
  reparte ~`ASSIST_CHANCE`·n asistencias ponderadas **pro-MED** (el arquero nunca asiste),
  `tournamentAssists` combina mi equipo con el resto sin doble conteo y con ranking.
- **`load-engine.js`** — loader compartido (import del motor real, sin eval).
