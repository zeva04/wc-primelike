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
| `buildOpponentReport(run, oppId)` | **scouting**: el Informe del Rival (Bible §4.6) — `{lineas: {ataque\|defensa\|arquero: {nivel, detalle}}, figura, forma, bajas, enEliminatorias}`. Niveles CUALITATIVOS (Alto/Medio/Bajo) comparando el cruce real (su ataque vs tu defensa, su defensa vs tu ataque, arquero vs arquero) con poderes esperados sin buffs; forma desde los resultados jugados por el mundo vivo (máx 3, reciente primero); bajas de `run.rivalBans`. PURO: no muta la run ni consume rng — mirar es gratis (los tests de pureza en `tests/scouting.test.js`). |

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
escribe world, limpia flow cuando lo cumplen ante mí).

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
| `effStat(p,key,buffs)` | Stat efectiva ~0–5 (stat÷20) con buffs y castigo por energía. |
| `gkQuality(por,buffs)` | Calidad global del arquero (atajadas 60% · reflejos 25% · salidas 15%). |
| `teamPowers(lineup,ment,buffs)` | Ataque y defensa (~0–5) de una alineación, con mentalidad, inferioridad numérica y el bonus parejo de `buffs.tactica` (Sesión táctica; solo llega por los buffs propios). |

### 8. Partido interactivo — clase `Match` (`js/game/match/Match.js` + `sequences.js` / `actions.js` / `chances.js` / `incidents.js` / `shootout.js`)
La UI la maneja así: `tick()` cada ~360 ms → si hay `decision`, muestra modal y llama al
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
| `actDribble(m,p)` | Regate: `{ok, foul}` — puede salir, ganar penal (`foul`) o perderse. |
| `actShot(m,p,{stat,bonus})` | Remate de definición: base más alta que el ambiente (`0.15 + q·0.09 + bonus`). `stat` permite el cabezazo. |
| `actContain(m,mine,{press,bonus})` | Corte defensivo; `press` corta más pero arriesga; `bonus` = mi iniciativa (la recuperación alta roba más que la contención de emergencia). |
| `actOppShot(m,shooter,mine,{stat,bonus})` | Remate rival ante mi arquero. `stat` cabezazo (córner en contra), `bonus` el perfil. `ok` = gol rival. |
| `actAerial(m,p,{handicap})` (A2) | Duelo aéreo: pesa el **Cabezazo** contra la zaga rival; `handicap` para la peinada al espacio. |

**`game/match/sequences.js` — el GENERADOR** (+ `content/sequences.js` = los tipos como datos):
| Función | Qué hace |
|---|---|
| `maybeStartSequence(m)` | ¿Arranca una secuencia este tick? Sobre la marcha, apuntando al objetivo del partido (2-6). El lado sale de `mineShare` (ventaja + mentalidad VIVA) y el tipo de `typeWeights`. |
| `seqPlan(m)` (interna) | Objetivo, ventaja y `rivalProfile`; cacheado en `m._seqPlan`. |
| `rivalProfile(m)` (interna, A2) | Perfil 0..1 del rival desde los promedios de su once (atk/def/pase/cab) — decisión #14, sin datos nuevos. |
| `typeWeights(m,side,prof)` (interna, A2) | Pesos por tipo desde el perfil rival y la mentalidad (leída AL GENERAR: palanca viva). |
| `startSequence(m,type)` | Elige protagonista(s) (por lado y `protWeight`; el córner rival usa su mejor cabeceador, la salida bajo presión a MI mejor pasador del fondo) y crea la decisión del acto 1. |
| `SEQ_MIN`/`SEQ_MAX`, `SEQUENCE_TYPES`, `sequenceType(id)` | Rango 2-6 y el catálogo A2 (8 tipos). |

**`game/match/sequence-acts.js` — los ACTOS** (extraído de sequences.js en A2, presupuesto §6):
| Función | Qué hace |
|---|---|
| `buildActDecision(m)` | Crea la decisión `sequence` del acto actual según su `kind` (build/carry/press/duel/setpiece/finish/contain/defend_sp/playout). |
| `resolveSequenceAct(m,key)` | Resuelve el acto: narra y **escala** o **cierra**. La construcción modula el `bonus` del remate, no cierra la jugada (si no, el scoring se derrumba — medido en A1 Y de nuevo en A2 con los tipos nuevos). El `playout` exitoso **convierte** la secuencia en transición mía (def→of). La contención rota rutea al **último hombre** (`LASTMAN_FROM_CONTAIN` 0.70, resolución del Sprint 1 intacta). |
| `maybeRebound(m,txt)` / `maybeCounter(m,txt)` (A2, regla 7) | El fallo que encadena, bidireccional: remate fallado → rebote (0.30, uno por secuencia) · pérdida ARRIESGADA → contra rival (0.28), que va TODA al mano a mano si hay DEF (`LASTMAN_FROM_COUNTER` 1.0). |

**Estado y consultas**
| Método | Qué hace |
|---|---|
| `constructor(my, oppTeam, knockout, oppBanned)` | Inicializa el partido (`my` = {team, lineup, bench, mentalidad, buffs}; `oppBanned` = suspendidos del rival por rojas del mundo vivo). |
| `log(kind,text)` | Agrega una línea al relato (kind define el estilo visual). |
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
| `_foulEvent()` | Falta → amarilla/roja o decisión de proteger a un amonestado. |
| `_injuryEvent()` | Lesión → golpe leve o cambio forzado. |
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
| `advanceDay(run)` | Pasa al día siguiente y resuelve lo que trae: `{type:"match"}` (llegó el partido), `{type:"evento",…, rareza}` (inevitable, ya aplicado; `effect` puede devolver un desc con protagonista) o `{type:"conflicto",…}` (dilema: la UI aplica la opción elegida). Todo día sin partido levanta además `run.actionPending`; si el evento trae `mod`, lo deja en `run.dayMod`; si el plan del día esconde una Oportunidad, la deja viva en `run.dayOpp` (ambos se limpian al empezar cada día: la oportunidad no tomada expira sin rastro). Las legendarias van al diario con tono dorado. |
| `applyDayAction(run,actionId,targetName?)` | **day-action**: aplica la Acción del Día elegida (`DAY_ACTIONS` o la Oportunidad viva hoy) escalada por el modificador del día — la Oportunidad NO se escala (decisión PO: premio externo) —, baja `actionPending`, escribe `lastAction` y anota el diario (la oportunidad con tono por rareza). Si la oportunidad trae `choose`, exige `targetName` válido entre sus candidatos (por nombre, §3.1); sin él no aplica NI consume el turno. Devuelve `{...accion, mult, desc}` (`desc` puede traer protagonista) o `null` si no había acción pendiente, el id no existe, la acción está bloqueada hoy o faltó el objetivo. |
| `actionMult(run,action)` | **day-action**: multiplicador de una acción HOY según `run.dayMod` (1 sin modificador; 0 = bloqueada). |
| `dayOpportunity(run)` | **day-action**: la Oportunidad viva HOY (fila completa de `content/opportunities`) o `null`. |
| `canjeableBuffs(run)` | **day-action**: stats cuyo buff para el próximo partido ya llega al umbral (`CANJE_THRESHOLD`): `[{key, buff, label, alcance}]` (`alcance` = jugadores del plantel con esa stat). Solo stats reales (`CANJEABLE_STATS`); tactica/penales/antiLesion nunca. Vacío si ninguna llegó. |
| `canjeBuff(run,key)` | **day-action** (Bible cap.6): canjea el buff de una stat por crecimiento PERMANENTE — descuenta `CANJE_THRESHOLD` del buff y suma `+CANJE_PERMANENT` (hoy +1) a esa stat en cada jugador que la tenga (clamp 1..99, nunca decrece). Gratis (no consume la Acción del Día) y anota el diario (tono gold). Devuelve `{key, label, permanent, alcance, jugadores}` o `null` si no llegaba al umbral / no es stat real. Escribe `squad[].stats` (ARQUITECTURA §3.1). |
| `buildDaily(run)` | **daily**: arma la edición del World Cup Daily — `{day, isMatchDay, items}` con 1-5 titulares `{icon, tag, text}` ordenados por prioridad (PORTADA/PLANTEL/GRUPO/RIVAL/MUNDIAL/HOY/COLOR, ver CORE §9); el primero es la nota de tapa. GRUPO marca al próximo rival si jugó anoche; RIVAL avisa sus suspendidos (`rivalBans`) y da el framing por paridad solo en la previa (≤2 días); MUNDIAL puntúa `run.lastNight` (batacazos por tier, goleadas, festivales, grandes, rojas); HOY es el `teaser` del evento/conflicto que trae el día (anticipa sin revelar). Solo lectura (el flavor consume rng). |
| `multLabel(mult)` | **day-action**: etiqueta corta para la UI ("×2", "×½"); `""` si es 1 o bloqueo. |
| `closeMatch(run,match)` | **flow**: cierra un partido del usuario — stats, diario, goles del rival a la tabla de goleadores (`assignScorers`) y sus asistidores (`assignAssists`), resultado al grupo/ronda, simulación del resto de la fecha y `postMatchUpdate`. Devuelve `{res, otherResults, advanced, momentum}` (`momentum` = resumen anímico por jugador para el análisis del post-partido). |
| `postMatchUpdate(run,match)` | **flow**: cierre físico/disciplinario/anímico por jugador (delega en `applyMedicalPostMatch` con los **minutos** de `match.minutesByName()`, `applyDisciplinePostMatch` y `applyMomentumPostMatch` — este ANTES de resetear flags: lee `p.sustituido`), cierra la moral (`applyMoralePostMatch`), limpia buffs y **re-agenda**. "Jugó" = está en el once final, entró del banco (`usado`) o **salió por un cambio** (`sustituido`). **Devuelve** `{momentum, morale}` (resúmenes para el análisis del post-partido). |
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
| `ui/screens/draw.js` | §6 (`start-run`) |
| `ui/screens/hub.js` | §7: hub, calendario, efectos, modales de evento/conflicto |
| `ui/screens/squad.js` | §7: Gestión de Plantilla (las reglas viven en `game/lineup`) |
| `ui/screens/worldcup.js` | §7: Estado del Mundial + tarjetas de posición reutilizables |
| `ui/screens/journal.js` | §7: Diario de Campaña |
| `ui/screens/match.js` | §8: partido en vivo, decisiones, cambios, reloj |
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
| `energyBar(en)` | Barra de energía coloreada. |
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

### 6. Sorteo de grupos — `ui/screens/draw.js`
| Función | Qué hace |
|---|---|
| `startRun(teamId)` | Crea la run, aplica colores y muestra el sorteo. |
| `renderDraw()` | Pantalla de sorteo con los 12 grupos. |

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
| `teamStateCard(v,discipline,fueraDePuesto,forma)` / `stateChip(...)` | Columna izquierda "Estado del equipo": formación, la cancha del once (solo lectura, clic → Gestión de Plantilla), chips de Moral y Energía, **los efectos para el próximo partido** (`buffChips`) con los botones de **canje** (`canjeableBuffs` → `showCanje`, disponibles también en día de partido), los avisos que importan (alineación inválida, fuera de puesto, sanciones, forma) y el botón a Gestión de Plantilla. La card llena su columna (`h-full flex flex-col`) y la cancha absorbe el alto sobrante (`flex-1`, piso `min-h-[22rem]`) — el arquero se ve completo y la columna nunca deja hueco. La cancha la monta `renderHub` con `mountPitch` tras pintar. |
| `actionCard()` | Panel de la **Acción del Día** (Bible §4.7): la Oportunidad del día arriba (si hay), los focos de Entrenar agrupados en una fila + una tarjeta-botón por acción suelta. Aplica vía `game/day-action`. Si hay `run.dayMod` muestra su banner y bloquea (`disabled` + gris) o etiqueta ("×2 hoy") las acciones afectadas. **Una vez elegida, el panel NO desaparece**: se queda con la acción elegida resaltada (✓ Elegida hoy, usando `run.lastAction.id`/`.group`) y las demás en gris no clickeables — así el bloque no cambia de tamaño (evita huecos en la columna) y queda claro qué se decidió y que no se puede elegir otra. |
| `oppCard()` | Card de la **Oportunidad del día** (Bible §4.5): borde y badge de su rareza + recordatorio "solo por hoy, ocupa tu Acción del Día". Click: aplica directo, o abre `showOppChooser` si trae `choose`. `""` si hoy no hay. |
| `showOppChooser(o)` | Modal selector de protagonista de una oportunidad con `choose`: candidatos con sprite/nombre/puesto/nota; elegir aplica (`applyDayAction` con el nombre) y consume el día; "decidir más tarde" cierra sin tocar nada. |
| `showDaily(daily,onClose)` | La **portada del Diario del Mundial** (papel crema, serifas, doble filete, nota de tapa grande + titulares secundarios con su sección en rojo). Se abre al llegar a un día nuevo, antes del evento; "Doblar el diario" dispara `onClose`, que encadena el modal de evento/conflicto o el toast de día de partido. |
| `renderCalendarCard(opp)` | Franja de la ventana COMPLETA (`windowStart..nextMatchDay`): días ya vividos en gris ("✓ vivido"), HOY resaltado, temática por día futuro, rival en el día de partido. Los días no se borran al avanzar. |
| `moraleRow()` | Fila de la Moral del equipo (banda + barra) embebida en el bloque de plantilla del hub. |
| `renderScorersCard()` / `wireScorersCard(rootEl)` (en `scorers.js`) | **Carrusel** top-5 del torneo para el hub con 2 pestañas — ⚽ **Goleadores** (`tournamentScorers`) / 🅰️ **Asistidores** (`tournamentAssists`) — que se togglean con los iconos del encabezado; llena su columna (`h-full flex flex-col`). El hub lo envuelve en un contenedor clickeable que va a la pantalla completa; `wireScorersCard` cablea el toggle **cortando la propagación** para no navegar al cambiar de pestaña. |
| `renderScorers()` (pantalla `scorers`) | Tabla completa del torneo con **toggle** Goleadores / Asistidores (mismo componente de fila, `col` = G/A): puesto, bandera, jugador, selección y el valor; mi equipo resaltado. |
| `buffChips()` | Chips con los efectos acumulados para el próximo partido (incluye el de `tactica` con su multiplicador de sesiones; usa `STAT_LABELS` de `content/day-actions`). Un buff de stat que ya llega a `CANJE_THRESHOLD` se resalta con ✨ y colores del equipo (es canjeable). |
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

### 8. Partido en vivo — `ui/screens/match.js`
| Función | Qué hace |
|---|---|
| `openSquadModal()` | **Gestión de plantilla en vivo**: la cancha de `ui/pitch.js` con el partido en pausa. Arrastrar titular sobre titular reubica (azul, gratis) — **salvo dos que jueguen el MISMO puesto** (enrocar dos defensas no cambia nada: se prohíbe, pedido del PO); traer a alguien del banco es un cambio (verde, gasta 1 de 3). **Nada toca el partido hasta Confirmar**: los cambios se arman como plan y se aplican juntos; "Salir sin guardar" lo descarta. Las reubicaciones sí mutan `posJugada` en el momento (es lo que la cancha lee para previsualizar), por eso se guarda el estado previo y se restaura al cancelar. Al confirmar se aplican **primero los cambios y después las posiciones finales**: si el DT reubicó a alguien DESPUÉS de meterlo, `makeSub` le pondría el puesto del que salió y el plan quedaría pisado. |
| `startMatch(oppId)` | Crea el `Match` y arranca el reloj. |
| `renderMatchScreen()` | Estructura fija: marcador, controles, relato, alineaciones. |
| `step()` / `startTimer()` / `stopTimer()` / `togglePause()` | Control del reloj. **Ritmo ráfaga (A1)**: el reloj se auto-agenda con `setTimeout` (no `setInterval`), corre rápido entre secuencias (`CRUISE` ~360 ms, o ~150 en modo Rápido) y **frena** en cada decisión; un gol hace una pausa breve (`GOAL_HOLD`). Cambiar la velocidad tiene efecto solo (el paso lee `CRUISE()`), sin reiniciar el timer. |
| `updateMatchUI()` | Refresca marcador, minuto, relato y panel "En cancha". |
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
  deriva de balance; `--all` tabula las 18 jugables. (Modo `--smart` pendiente de recrear.)
  **`--action=<id|grupo>`** fija la Acción del Día (`entrenar`, `recuperar`, `tactica`…) para
  **comparar estrategias** y auditar el "no dominant strategy" del Bible (con el flag no se
  toman oportunidades). `--nocanje` apaga el canje para aislar su efecto.
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
