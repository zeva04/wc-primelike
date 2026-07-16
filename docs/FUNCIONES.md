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
| `js/game/calendar.js` · `flow.js` · `discipline.js` · `medical.js` · `journal.js` | §9 Entre partidos |
| `js/content/` (themes, prep-events, conflicts, injuries) | Tablas de contenido editable |

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
| `playerStars(p)` | Estrellas visuales del jugador. |
| `teamRating(team)` | Media 1–99 del equipo (promedio de sus 5 mejores notas). |
| `teamStars(team)` | Estrellas visuales del equipo. |
| `lineupRating(selected)` | Media del once elegido (promedio de los 6). Baja si el DT alinea suplentes; `teamRating` es el techo del plantel. |
| `playedPos(p)` | Puesto que juega hoy (`posJugada`, lo escribe `lineup.assignPositions`) o el natural. El arco es exclusivo de los POR, así que `playedPos(p)==="POR"` ⟺ `p.pos==="POR"`. |
| `posDistance(a,b)` / `penaltyAt(p,pos)` | Pasos entre dos puestos en la línea POR–DEF–MED–DEL / castigo que sufriría ahí (6 por paso). |
| `outOfPosPenalty(p)` | Castigo que sufre hoy cada stat técnica (0 si juega en su puesto). |
| `effectiveStat(p,key)` | Stat ya castigada. **Única fuente de verdad**: la leen `playerOverall` (la ficha) y `match/powers.effStat` (la cancha), así la UI no puede mentir. El aura nunca se castiga. |
| `statPenalties(p)` | `[{key, base, real, delta}]` de lo que le bajó — es lo que pinta la ficha. |
| `overallAt(p,pos)` | Nota que tendría parado en `pos` (pesos de ese puesto + castigo). |
| `naturalOverall(p)` | Nota EN SU PUESTO, ignore dónde esté parado. **La que ordena el plantel** (`autoLineup`): con `playerOverall` el auto manda al banco al crack que estabas usando fuera de puesto. |
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
| `validateLineup(available, selected)` | Valida la alineación (6, 1 arquero, líneas cubiertas si hay jugadores). |
| `formationLabel(selected)` | Etiqueta de formación del once (ej. `2-1-2`). |

⚠️ **Por qué `autoLineup()` sin formación no se toca a la ligera**: elige la misma nota TOTAL que
un barrido por las 6 formaciones, pero desempata distinto, y el desempate mueve el reparto
DEF/MED — que `teamPowers` convierte en poder real. Cambiarlo por "el mejor de las 6 formaciones"
subió a BRA de ~34,7% a 36,3% de campeón (n=1500) sin que ningún once fuera mejor: solo empates
resueltos hacia el ataque. Si se toca, recalcular la línea base de CORE.md §10.

### 3. Rivales — `js/game/opponents.js`
| Función | Qué hace |
|---|---|
| `genOpponentLineup(team)` | Alineación de 6 titulares del rival (formato 6v6). Un jugable usa sus mejores 6; un rival normal deriva stats desde su `rating` con `POS_MODS` y suma un "Jugador6" genérico que clona a su último jugador de campo. |

### 4. La run — `js/game/run.js`
| Función | Qué hace |
|---|---|
| `newRun(myTeamId)` | Crea la run: sortea 12 grupos (solo `qualified !== false`), clona el plantel con estado y devuelve el objeto `run` completo. |

El objeto `run` guarda: `teamId`, `squad`, `groups`, `stage` (`groups→r32→r16→qf→sf→final`),
`matchday`, `koMatches`, `buffs`, `stats` acumuladas, y el calendario: `day` (día actual,
1 = 11-jun-2026), `nextMatchDay` (día del próximo partido) y `dayPlan` (evento pre-sorteado
de cada día intermedio: `{kind, id, tema}`).

### 5. Simulación IA — `js/game/tournament/sim.js`
| Función | Qué hace |
|---|---|
| `quickSim(idA,idB,knockout)` | Simula por Poisson un partido que el usuario no juega; en eliminatoria resuelve prórroga y penales. |

### 6. Grupos — `js/game/tournament/groups.js`
| Función | Qué hace |
|---|---|
| `computeTable(group)` | Tabla de posiciones (pts, DG, GF; empates al azar). |
| `simMatchday(run,md)` | Simula la fecha `md` de todos los grupos, saltando mi partido. |
| `myNextGroupRival(run)` | Rival del usuario en la fecha actual. |
| `qualifyRound32(run)` | Cierra los grupos: 12 primeros + 12 segundos + 8 mejores terceros → bracket de 16avos. |

### 7. Eliminatorias — `js/game/tournament/knockout.js`
| Función | Qué hace |
|---|---|
| `simKnockoutRound(matches,myId)` | Simula una ronda entera salvo mi partido; devuelve ganadores. |
| `pairNextRound(winners)` | Empareja ganadores para la ronda siguiente. |
| `nextOpponentId(run)` | Id del próximo rival del usuario (fecha de grupo o cruce de eliminatoria). |

### 8. Partido interactivo — funciones de poder (`js/game/match/powers.js`)
| Función | Qué hace |
|---|---|
| `effStat(p,key,buffs)` | Stat efectiva ~0–5 (stat÷20) con buffs y castigo por energía. |
| `gkQuality(por,buffs)` | Calidad global del arquero (atajadas 60% · reflejos 25% · salidas 15%). |
| `teamPowers(lineup,ment,buffs)` | Ataque y defensa (~0–5) de una alineación, con mentalidad e inferioridad numérica. |

### 8. Partido interactivo — clase `Match` (`js/game/match/Match.js` + `chances.js` / `incidents.js` / `shootout.js`)
La UI la maneja así: `tick()` cada ~1s → si hay `decision`, muestra modal y llama al
`resolve*` correspondiente → en `"pens"` gestiona la tanda → al final `result()`.

**Estado y consultas**
| Método | Qué hace |
|---|---|
| `constructor(my, oppTeam, knockout)` | Inicializa el partido (`my` = {team, lineup, bench, mentalidad, buffs}). |
| `log(kind,text)` | Agrega una línea al relato (kind define el estilo visual). |
| `activeMine()` | Mis jugadores en cancha (sin expulsados ni lesionados). |
| `availableBench()` | Suplentes que aún pueden entrar. |
| `eligibleFor(out)` | Suplentes elegibles para reemplazar a `out`. Regla **simétrica** vía `lineup.canPlayAt`: el arco solo lo cubre un arquero **y** un arquero no sale a la cancha. Antes solo se vigilaba una dirección y se podía mandar a un jugador de campo al arco: el equipo quedaba sin arquero y con 6 de campo. |
| `powers()` | Poderes actuales de ambos equipos (se recalculan cada tick). |

**Simulación por tick**
| Método | Qué hace |
|---|---|
| `tick()` | Avanza ~5 min. Devuelve `false` \| `true` (decisión) \| `"halftime"` \| `"pens"` \| `"end"`. |

**Ocasiones y decisiones** (privados con `_`; los `resolve*` los llama la UI)
| Método | Qué hace |
|---|---|
| `_myChance(opp)` | Ocasión mía: penal, decisión interactiva (55%) o remate automático. |
| `resolveChance(key)` | Resuelve "chance": `shoot` / `pass` / `solo`. |
| `_myPenalty()` / `resolvePenaltyMine(name)` | Penal a favor: pide pateador y lo ejecuta. |
| `_oppChance(mine)` | Ocasión rival: penal en contra (6%) o remate. |
| `resolvePenaltyOpp(key)` | Penal en contra: el usuario eligió el lado del arquero. |

**Faltas, lesiones y cambios**
| Método | Qué hace |
|---|---|
| `_foulEvent()` | Falta → amarilla/roja o decisión de proteger a un amonestado. |
| `_injuryEvent()` | Lesión → golpe leve o cambio forzado. |
| `makeSub(out,inName,force)` | Sustitución. Reglas: máx 3, el sustituido no reingresa, y el que entra debe poder ocupar el puesto del que sale (`canPlayAt`). El que entra hereda `posJugada` del que sale — si salía un improvisado de defensa, el recambio también juega ahí. `force` es la excepción de la roja al arquero: el POR suplente entra por un jugador de campo y se va **al arco**, no a su puesto. No hay excepción a la inversa. |

**Goles, cierre y penales**
| Método | Qué hace |
|---|---|
| `_goalMine(p,flavor)` / `_goalOpp(p)` | Anota gol (con posible revisión de VAR). |
| `_finishRegular()` | Al minuto final: en eliminatoria, empate → prórroga → penales. |
| `_weightedPick(arr,weights)` | Elección aleatoria ponderada (protagonistas de ocasiones). |
| `startShootout()` / `shootoutStatus()` | Inicia y consulta la tanda. |
| `shootMyPen(name,dir)` / `shootOppPen(guess)` | Ejecuta un penal de la tanda. |
| `_checkShootoutEnd()` | Cierra la tanda por definición matemática o muerte súbita. |
| `result()` | Resultado final: marcador, ganador y detalle de penales. |

### 9. Entre partidos — `js/game/calendar.js`, `flow.js`, `discipline.js`, `journal.js` y `js/content/`
| Función | Qué hace |
|---|---|
| `dayLabel(day)` | Fecha real del día de la run ("Jue 11 jun"; día 1 = 11-jun-2026). |
| `scheduleNextMatch(run)` | Agenda el próximo partido a 5-6 días y pre-sortea el evento de cada día intermedio (75% evento / 25% conflicto, sin repetir dentro de la ventana). Llena `run.nextMatchDay` y `run.dayPlan`. |
| `advanceDay(run)` | Pasa al día siguiente y resuelve lo que trae: `{type:"match"}` (llegó el partido), `{type:"evento",…}` (inevitable, ya aplicado) o `{type:"conflicto",…}` (dilema: la UI aplica la opción elegida). |
| `closeMatch(run,match)` | **flow**: cierra un partido del usuario — stats, diario, resultado al grupo/ronda, simulación del resto de la fecha y `postMatchUpdate`. Devuelve `{res, otherResults, advanced}`. |
| `postMatchUpdate(run,match)` | **flow**: cierre físico/disciplinario por jugador (delega en `applyMedicalPostMatch` y `applyDisciplinePostMatch`), limpia buffs y **re-agenda**. |
| `advanceStage(run,advanced)` | **flow**: avanza el torneo y devuelve `{type: "next-matchday"\|"qualified"\|"eliminated"\|"next-round"\|"champion"}`; dispara `clearAmarillas` al cerrar grupos y tras 4tos. La UI solo rutea. |
| `applyMedicalPostMatch(run,p,played)` | **medical**: energía (+15/+30), descuento de baja y diario de lesión. |
| `applyDisciplinePostMatch(run,p)` | **discipline**: roja→suspensión; **acumulación de amarillas** (2 en el torneo = 1 partido fuera, contador a 0; doble amarilla = roja y NO acumula). |
| `addJournal(run,entry)` | Agrega una entrada `{day,icon,title,desc,tone}` al Diario de Campaña (`run.journal`). El día se toma de `run.day` salvo override. |
| `clearAmarillas(run,motivo)` | Borra las amarillas acumuladas de todo el plantel y lo anota en el diario. Se llama al cerrar la fase de grupos y tras los cuartos. Las suspensiones pendientes NO se perdonan. |

Constantes de datos: `EVENT_THEMES` (4 temáticas con icono/color fijos: entrenamiento,
físico, vestuario, entorno), `PREP_EVENTS` (10 eventos inevitables ±5), `RANDOM_EVENTS`
(6 conflictos con decisión, también con `tema`).

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
| `nameHash(s)` | Hash FNV-1a → entero estable (sprites deterministas). |
| `rivalLook(name,team)` | Apariencia procedural de un rival sin `look` propio. |
| `spriteSvg(player,team)` | Sprite pixelado 12×14 dibujado píxel a píxel en SVG. |
| `TROPHY_SVG` / `BALL_SVG` | Trofeo y balón Trionda como SVG propios. |

### 3. Helpers de pantalla — `ui/components.js`
| Función | Qué hace |
|---|---|
| `toast(msg)` | Notificación flotante que desaparece sola. |
| `modal(html)` | Abre un modal centrado; devuelve el nodo para enganchar handlers. |
| `closeModal()` | Cierra el modal activo. |
| `screenShell(inner, maxW?)` | Reemplaza la pantalla completa. `maxW` por defecto `max-w-5xl`; Gestión de Plantilla usa `max-w-6xl` (cancha + panel). |

### 4. Menú principal — `ui/screens/menu.js`
| Función | Qué hace |
|---|---|
| `difficultyOf(team)` | Etiqueta de dificultad según la media (label, colores, descripción). |
| `renderMenu()` | Pinta el menú: héroe, pestañas de continente, carrusel y plantel. |

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

### 7. Hub y sus pantallas satélite — `ui/screens/hub.js` · `squad.js` · `worldcup.js` · `journal.js`
| Función | Qué hace |
|---|---|
| `nextOpponentId()` | Id del próximo rival (grupo o cruce). |
| `renderHub()` | Pantalla central: rival, calendario, alineación; el botón principal pasa el día o juega el partido según toque. |
| `renderCalendarCard(opp)` | Franja de días hasta el próximo partido: hoy resaltado, temática por día, rival en el día de partido. |
| `buffChips()` | Chips con los efectos acumulados para el próximo partido. |
| `themeHeader(tema)` | Cabecera de temática (icono/color fijos) de los modales de evento/conflicto. |
| `showDayEvent(ev)` | Modal del evento inevitable del día (ya aplicado por el motor). |
| `renderJournal(back)` | Pantalla del **Diario de Campaña**: entradas agrupadas por día, coloreadas por `tone`; `back` define a dónde vuelve (hub o desenlace). |
| `renderGroupTableCard()` / `renderKoInfoCard()` | Tarjetas de tabla / info de eliminatoria. |
| `renderSquadScreen()` | **Gestión de Plantilla**: cancha con el once, selector de formación, ficha del jugador y los 4 suplentes. Las reglas son de `game/lineup`; aquí solo viven las coordenadas (`ROW_Y`, `spreadX`), que son presentación. |
| `renderPitch()` / `pitchToken(p,…)` | Dibuja el once sobre el césped. Las filas salen del once REAL, no de la formación elegida: así una alineación improvisada también se pinta bien. |
| `renderFormationPicker(available)` | Selector con las 6 formaciones y su diagrama de puntos; desactiva las que el plantel no cubre (Brasil no puede 3-1-1: tiene 2 DEF). |
| `renderPlayerCard()` / `renderBench()` | Ficha del seleccionado (stats reales del motor) y las 4 fichas del banco. |
| `partnersFor(p)` / `onPick(name)` | Recambios válidos (solo misma posición: la posición ES la formación) y clic sobre una ficha: permuta si es recambio, si no abre su ficha. |
| `showRandomEvent(ev)` | Modal de un conflicto con decisión y aplicación del efecto elegido. |

### 8. Partido en vivo — `ui/screens/match.js`
| Función | Qué hace |
|---|---|
| `openSquadModal()` | **Gestión de plantilla en vivo**: la cancha de `ui/pitch.js` con el partido en pausa. Arrastrar titular sobre titular reubica (azul, gratis); traer a alguien del banco es un cambio (verde, gasta 1 de 3). **Nada toca el partido hasta Confirmar**: los cambios se arman como plan y se aplican juntos; "Salir sin guardar" lo descarta. Las reubicaciones sí mutan `posJugada` en el momento (es lo que la cancha lee para previsualizar), por eso se guarda el estado previo y se restaura al cancelar. Al confirmar se aplican **primero los cambios y después las posiciones finales**: si el DT reubicó a alguien DESPUÉS de meterlo, `makeSub` le pondría el puesto del que salió y el plan quedaría pisado. |
| `startMatch(oppId)` | Crea el `Match` y arranca el reloj. |
| `renderMatchScreen()` | Estructura fija: marcador, controles, relato, alineaciones. |
| `startTimer()` / `stopTimer()` / `togglePause()` | Control del reloj de ticks. |
| `updateMatchUI()` | Refresca marcador, minuto, relato y panel "En cancha". |
| `showDecision()` / `handleDecision(d,key)` | Muestran y enrutan las decisiones al motor. |
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
| `finishMatch()` | Acumula stats, anota el partido en el diario y simula el resto de la ronda. |
| `renderPostMatch(...)` | Pantalla post-partido. |
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
- **`teams.validate.js`** — LA LEY del esquema de datos: ids/banderas/48 clasificados,
  stats 1–99, dorsales únicos (el 1 solo POR), look válido, ≥1 por posición (distribución
  libre por decisión del PO); sprites duplicados = advertencia.
- **`discipline.test.js`** — 24 checks deterministas de amarillas acumuladas, suspensiones,
  limpiezas, lesiones y energía post-partido.
- **`load-engine.js`** — loader compartido (import del motor real, sin eval).
