# 🏗️ ARQUITECTURA — Diseño modular de WC Prime

**Estado**: ✅ **migración ejecutada**. El árbol de §2.2 es el que existe hoy en el repo: el monolito `engine.js` + `ui.js` ya no existe, y las reglas viven en `js/game/`, el contenido editable en `js/content/` y las pantallas en `js/ui/screens/`.

**Base técnica**: ES Modules nativos + servidor local (`npx http-server -p 8347`). El doble clic a `index.html` (`file://`) no está soportado.

Este documento es la referencia para: **dónde vive cada cosa**, **qué puede depender de qué** (§4, las reglas de dependencia) y **dónde va una feature nueva** (§7). Complementa a [CORE.md](CORE.md) (matemáticas) y [FUNCIONES.md](FUNCIONES.md) (referencia función por función).

> El §1 (Diagnóstico) describe el monolito del que se partió y **está escrito en presente
> por ser el registro de esa decisión**: es el "por qué" de la estructura actual, no una
> descripción del código de hoy.

---

## 1. Diagnóstico

### 1.1 Lo que está BIEN y la migración debe preservar

No partimos de un desastre; partimos de un monolito ordenado. Hay cinco activos que la nueva arquitectura debe proteger, porque son la razón de que el proyecto siga siendo sano a las ~3.400 líneas:

1. **El motor no toca el DOM.** `engine.js` es lógica pura; `ui.js` consulta y pinta. La frontera existe y se respeta — el problema es que *dentro* de cada lado todo vive junto.
2. **Un único punto de azar** (`rnd()` en engine §1). Todo el random del juego pasa por ahí. Esto habilita runs con semilla (seeds de roguelike) en el futuro; ningún módulo nuevo debe llamar `Math.random()` directo.
3. **Contenido como datos** (`PREP_EVENTS`, `RANDOM_EVENTS`, `INJURY_TYPES`): agregar un evento es agregar una entrada a una tabla, no tocar lógica. Este patrón se formaliza en la carpeta `content/`.
4. **El Diario (`run.journal`)** ya funciona como log de auditoría de la run: cualquier sistema nuevo que haga algo relevante lo anota ahí.
5. **Docs vivas** (CORE, FUNCIONES) y validadores (smoke test, validate-teams).

### 1.2 Problemas reales (con evidencia)

**P1 — Sistemas implícitos enterrados en `engine.js` (1.190 líneas).** Las "10 secciones numeradas" son, en realidad, ~9 sistemas de juego distintos conviviendo en un archivo: ratings, generación de rivales, run/sorteo, simulación IA, grupos, eliminatorias, partido interactivo (clase `Match`, ~500 líneas ella sola), calendario/eventos, disciplina/médico/diario. Hoy se navegan por número de sección; con 2-3 features más (Filosofía, mundo vivo) el archivo pasa de 1.200 a 2.000+ líneas y el índice deja de ayudar.

**P2 — Reglas de juego viviendo en la UI.** Esto es lo más grave, porque rompe la única frontera que tenemos:
- `autoLineup()` / `validateLineup()` / `formationLabel()` (ui.js §7): las reglas de alineación 6v6 son REGLAS, no presentación. Evidencia del daño: **cada smoke test ha tenido que duplicar `autoLineup` a mano** (pasó en v8 y de nuevo en v9) porque el motor no la expone.
- `advanceTournament()` (ui.js §10): la progresión del torneo — cerrar grupos, `clearAmarillas`, armar la siguiente ronda, decidir si la run sigue — es la máquina de estados central del juego y vive en un handler de UI.
- `nextOpponentId()` (ui.js §7): consulta pura de torneo.
- `difficultyOf()` (ui.js §4): los umbrales 85/78/68 son una regla de juego, no estilo.

**P3 — Orquestación mezclada con reglas.** `postMatchUpdate()` (engine) hace 5 cosas de 4 sistemas distintos: energía, disciplina, diario, buffs, re-agendado. `finishMatch()` (ui) mezcla: cerrar stats, escribir diario, empujar resultados al grupo, simular la ronda rival y decidir pantalla. Cuando un bug de disciplina aparezca, hay que leer ambos.

**P4 — Persistencia dentro de la UI.** `getHistory()`/`saveHistoryEntry()` (localStorage) viven en ui.js §5. El día que exista "guardar run a mitad" (roguelike lo pedirá), no hay ningún lugar natural donde ponerlo.

**P5 — Contrato implícito Match↔UI.** Las decisiones de partido son objetos `{id: "chance"|"penalty_mine"|..., options}` que la UI enruta con un switch en `handleDecision()`. Agregar un tipo de decisión exige tocar 2 archivos coordinadamente y nada te avisa si olvidas uno. No es un bug, es una trampa para colaboradores futuros (humanos o IA).

**P6 — Acceso global a datos.** `getTeam()` lee `window.WC_DATA` desde dentro del motor; la UI filtra `playable`/`qualified` por su cuenta. No existe una capa de consulta de datos: cada quien scrapea el JSON global.

**P7 — Tests efímeros.** Los smoke tests viven en el scratchpad de cada sesión de desarrollo y **se han recreado desde cero al menos 3 veces** (v6, v8, v9). El activo de verificación más valioso del proyecto no está en el repo.

**P8 — Código muerto y estado zombi.** `PREP_ACTIONS`/`applyPrep` (sin uso en UI desde v7), y campos de `run` que nadie lee: `lineup`, `extraPos`, `mentalidad` (a nivel run), `lastResults`, `eliminated`, `bracket`, `prepDone`. Además `run.koMatches` y `run.lastWinners` **nacen en la UI** (no en `newRun`), o sea que la forma del estado depende de qué pantalla se ejecutó. Y el conflicto "pelea" guarda `run._peleaA/_peleaB` como canal lateral.

**P9 — (Consciente, aceptado)** Los textos del relato viven dentro de la lógica del motor. Es una decisión razonable — el relato ES contenido de gameplay — pero si algún día hay i18n, será trabajo. No se ataca en esta arquitectura.

### 1.3 Riesgos de no hacer nada

- Cada feature nueva agranda 2 archivos que ya requieren paginación para leerse (los agentes IA ya no pueden leer ui.js en una pasada — hecho medido en esta misma sesión).
- La Filosofía (la feature grande pendiente del Game Vision) toca partido + calendario + hub + contenido: hoy eso significa editar los 2 monolitos en ~6 puntos sin frontera que te proteja.
- El patrón "regla nueva → la pongo donde estoy parado" (P2) se acelera: es exactamente como se degradan los proyectos.

### ⚖️ Autocrítica del diagnóstico

- **¿Es urgente?** Honestamente: no es un incendio. El corte motor/UI existe y el juego tiene tests (aunque efímeros). Es una **mudanza preventiva** — y ese es el mejor momento para hacerla: el costo de migrar crece con cada feature, y Filosofía está en el horizonte.
- **¿El tamaño es el problema?** No. 1.190 líneas bien indexadas se leen. El problema real es P2/P3/P5: responsabilidades cruzando la frontera. Por eso el plan de migración prioriza mover reglas por sobre partir archivos.

---

## 2. Arquitectura propuesta

### 2.1 Principio organizador

**Carpetas por sistema de juego, no por tipo de archivo.** El árbol debe leerse como el índice del Game Vision: quien busca "amarillas" encuentra `discipline`, quien busca "eventos del día" encuentra `calendar` + `content/`.

### 2.2 Árbol completo

```
index.html                     ← 1 solo <script type="module" src="js/main.js">
data/
  teams.js                     ← la DB (misma ubicación: el PO la edita a mano)
  flags/                       ← PNG de banderas (asset, no código)
js/
  main.js                      ← arranque: valida datos, monta el menú (~30 líneas)
  core/                        ── infraestructura SIN conocimiento del juego ──
    rng.js                     ← rnd, ri, pick, shuffle, poisson  (~30)
    math.js                    ← clamp, truncHalf                 (~15)
  data/
    teams-repo.js              ← getTeam, playables(), qualified() (~40)
  game/                        ── sistemas de la campaña ──
    run.js                     ← newRun: sorteo, plantel, forma canónica del estado (~100)
    flow.js                    ← orquestador: post-partido y avance de fase (~130)
    ratings.js                 ← playerOverall, teamRating, estrellas, statLine, difficultyOf (~90)
    lineup.js                  ← autoLineup, validateLineup, formationLabel (~70)
    opponents.js               ← genOpponentLineup, POS_MODS (~55)
    calendar.js                ← dayLabel, scheduleNextMatch, advanceDay (~80)
    discipline.js              ← amarillas acumuladas, suspensiones, clearAmarillas (~60)
    medical.js                 ← rollInjury, recuperación de energía post-partido (~50)
    journal.js                 ← addJournal + taxonomía de tonos (~25)
    tournament/
      groups.js                ← computeTable, simMatchday, myNextGroupRival, qualifyRound32 (~95)
      knockout.js              ← STAGE_ORDER/LABEL, simKnockoutRound, pairNextRound, nextOpponentId (~55)
      sim.js                   ← quickSim (Poisson IA) (~35)
    match/
      Match.js                 ← clase: estado, tick, fases, cambios, resultado (~200)
      field.js                 ← EL TERRITORIO: zona de la pelota, alturas de bloque, deriva, mapa de calor (~400)
      powers.js                ← effStat, gkQuality, teamPowers, MENT_MOD (~55)
      actions.js               ← Football Actions: pase, regate, remate, duelo aéreo, contención (Bible §7) (~95)
      sequences.js             ← GENERADOR de Key Sequences: perfil rival, pesos, arranque (~145)
      sequence-acts.js         ← EL CONTRATO §3.2 y los dos despachadores: qué se pregunta y quién resuelve (~70)
      acts/                    ── los actos, por FAMILIA de fútbol ──
        build.js               ← construir: circular, salir del área, cambiar el frente, conducir, presionar (~360)
        attack.js              ← llegar y definir: espalda, duelo aéreo, banda, centro, desenlace (~390)
        setpiece.js            ← el balón parado, sus dos caras (~125)
        defense.js             ← defender: salida asfixiada, contención y el remate rival (~200)
        chains.js              ← los desenlaces transversales: rebote, contra, encadenados, cierres (~215)
        block.js               ← lo que el árbol del Bloque le hace al remate rival (~80)
        common.js              ← los helpers compartidos por todas las familias (~60)
      chances.js               ← penales en juego, último hombre, remate ambiente, VAR (~200)
      incidents.js             ← faltas, tarjetas, lesiones en juego (~120)
      shootout.js              ← tanda de penales (~90)
  content/                     ── tablas que el PO edita; datos + flavor, cero reglas ──
    traits/                    ── el árbol de identidad, UN ARCHIVO POR FILOSOFÍA ──
      index.js                 ← arma TRAITS + los DIALES de balance (TRAIT_COST, TRAIT_LEVEL) (~60)
      press.js · posesion.js · contra.js · bloque.js   ← los 64 rasgos (~170 c/u)
    identity/                  ── quién es cada uno y cómo juega ──
      philosophies.js          ← las 4 escuelas, aristas, niveles, afinidad y el ciclo de counters (~225)
      team-philosophies.js     ← la curación: qué filosofía juega cada uno de los 16 (~30)
      team-flavor.js           ← TEAM_DESC: la descripción de cada selección para el menú (~40)
    match/                     ── lo que consume el partido ──
      sequences.js             ← SEQUENCE_TYPES: los tipos de Key Sequence como datos (~350)
      ambient.js               ← AMBIENT_LINES: el relato ambiente (~45)
      injuries.js              ← INJURY_TYPES (28 lesiones con pesos) (~45)
    daily/                     ── el día a día de la Concentración ──
      day-actions.js           ← DAY_ACTIONS + los diales de cada acción (~120)
      prep-events.js           ← PREP_EVENTS (los eventos inevitables) (~210)
      conflicts.js             ← RANDOM_EVENTS (conflictos con decisión) (~115)
      opportunities.js         ← OPPORTUNITIES (las que compiten con la Acción del Día) (~150)
      rarities.js              ← RARITIES: los 4 niveles y su peso de sorteo (~15)
      themes.js                ← EVENT_THEMES (4 temáticas) (~10)
      daily-flavor.js          ← DAILY_FLAVOR: los titulares de color (~20)
  ui/
    session.js                 ← estado de sesión: run, slot, match, matchCtx, selectedLineup (~30)
    save.js                    ← la ranura de la sesión: autoguardar, cargarRanura, borrarRanura (~70)
    components.js              ← starsHtml, energyBar, posBadge, flagImg, pxFlag, numTag, toast, modal, screenShell (~120)
    sprites.js                 ← spriteSvg, rivalLook, nameHash, pools (~95)
    theme.js                   ← applyTeamColors, TROPHY_SVG, BALL_SVG (~45)
    screens/                   ── una pantalla = un archivo ──
      saves.js                 ← LA PORTADA: el título y las 3 ranuras de partida guardada (~330)
      menu.js                  ← carrusel + dificultad (~120)
      history.js               ← historial de runs (~45)
      draw.js                  ← sorteo de grupos (~50)
      hub/                     ── la Concentración, partida por responsabilidad ──
        index.js               ← la composición de la pantalla y el paso del día (~320)
        complex.js             ← el complejo isométrico: las 5 parcelas y el plano (~480)
        hud.js                 ← las franjas de arriba, la columna derecha y la barra de acción (~355)
        panels.js              ← lo que abre un edificio que pide otra elección (focos, plan) (~120)
        confirm.js             ← la hoja de confirmación: qué va a pasar, y qué pasó (~245)
        rival.js               ← el rival: su card, el Informe (Bible §4.6) y la Oportunidad (~190)
        team.js                ← mi equipo: el canje y la altura del bloque (~80)
        day.js                 ← el día: la portada del Daily y los modales del calendario (~125)
      squad.js                 ← Gestión de Plantilla (~120)
      worldcup.js              ← Estado del Mundial (~60)
      journal.js               ← Diario de Campaña (~60)
      match/                   ── la pantalla más grande del juego, partida por responsabilidad ──
        index.js               ← la pantalla: estructura, reloj del relato y ruteo de decisiones (~350)
        panels.js              ← la columna de lectura: stats, XP de identidad, momentum, mapa de calor (~200)
        tactics.js             ← las palancas del DT: botón de presión y pizarra de la altura (~135)
        squad.js               ← la Gestión de plantilla en vivo (~290)
      shootout.js              ← UI de la tanda (~90)
      post-match.js            ← resultado + otros marcadores (~80)
      end.js                   ← desenlace + estadísticas (~95)
  storage/
    history.js                 ← localStorage wc26_history (~30)
    saves.js                   ← localStorage wc26_saves: las 3 ranuras (~90)
tests/                         ── EN EL REPO, se acabó el scratchpad ──
  smoke.js                     ← runs completas sin UI (--smart, --all)
  teams.validate.js            ← esquema, dorsales, sprites duplicados
  discipline.test.js           ← acumulación/limpieza de amarillas
tools/
  regen-teams.js               ← scripts de mantenimiento de la DB (hoy recreados ad-hoc)
docs/
  CORE.md · FUNCIONES.md · ARQUITECTURA.md
```

~36 archivos de código, promedio ~90 líneas, el mayor ~260. Total ≈ las mismas ~3.400 líneas de hoy: **esto es una mudanza, no una reescritura**.

### 2.3 Capas y regla de oro

```
                ┌─────────────────────────────┐
                │  ui/  (screens, components) │  pinta y captura clics
                └──────────────┬──────────────┘
                       │       │       │
              ┌────────▼──┐ ┌──▼─────┐ ┌▼─────────┐
              │  game/    │ │storage/│ │ data/    │
              │ (+match,  │ └────────┘ │teams-repo│
              │tournament)│◄───────────┴──────────┘
              └─────┬─────┘
                    │ lee tablas          efectos reciben `run`
              ┌─────▼─────┐            ┌──────────┐
              │ content/  │            │  core/   │◄── todos
              └───────────┘            └──────────┘
```

**Regla de oro**: las flechas apuntan siempre hacia abajo. `ui/` conoce a todos; nadie conoce a `ui/`. `core/` no conoce a nadie.

### ⚖️ Decisiones cuestionadas y alternativas descartadas

- **¿Por qué no `/engine` + `/systems` + `/ui` (la clásica)?** Porque "engine" es una categoría técnica, no de dominio. Cuando quieras tocar amarillas, `game/discipline.js` responde solo; `engine/systems/rules/...` obliga a adivinar. La única concesión técnica es `core/` (y es cerrada: rng y math, punto).
- **¿Por qué NO un event bus** (el reflejo AAA para "sistemas desacoplados")? Porque con 1 escritor de orquestación (`flow.js`) y pocos sistemas, las llamadas explícitas y ordenadas son más fáciles de depurar que suscripciones invisibles — "Fácil debugging" es requisito. **Condición de activación futura**: cuando existan ≥2 sistemas puramente observadores (logros + noticias + historias reaccionando a los mismos momentos), se introduce `core/events.js` con pub/sub de ~20 líneas. Antes, no.
- **¿Por qué no un store reactivo / framework de render?** La UI actual repinta pantallas completas y funciona perfecto a esta escala. Introducir reactividad es sobreingeniería hoy. El costo aceptado: `updateMatchUI()` seguirá refrescando a mano el marcador — está localizado en 1 archivo.
- **¿Por qué no TypeScript?** Rompe la restricción "cero tooling". A cambio, la forma canónica de `run` se documenta con un `@typedef` JSDoc en `game/run.js` — los editores e IAs lo aprovechan sin build.
- **¿Match dividido en 5 archivos, no es fragmentar?** Es el archivo con más presión de crecimiento (Game Vision pide MÁS skill moments). `chances.js`/`incidents.js`/`shootout.js` son funciones que reciben el match — la clase queda como máquina de estados pequeña. Alternativa considerada (1 solo `Match.js` de 500+) descartada: es exactamente el archivo gigante que juramos no repetir.
- **Costo real de ESM asumido**: se pierde el doble clic. Mitigación: el README pasa a documentar `npx http-server -p 8347` como LA forma de jugar (ya es la del Browser pane).

---

## 3. Responsabilidad de cada módulo

Formato: **propósito · contiene · NUNCA debe contener**.

| Módulo | Propósito | Contiene | NUNCA debe contener |
|---|---|---|---|
| `core/rng.js` | Azar único del juego | rnd, ri, pick, shuffle, poisson | Reglas, contenido, `Math.random()` fuera de `rnd` |
| `core/math.js` | Numérica genérica | clamp, truncHalf | Cualquier cosa con nombre futbolero |
| `data/teams.js` | La base de datos | 52 selecciones (esquema en su cabecera) | Funciones, lógica, derivados calculables |
| `data/teams-repo.js` | Consultas a la DB | getTeam, playables(), qualified() | Mutaciones de la DB, reglas de juego |
| `game/run.js` | Nacimiento y forma del estado | newRun, sorteo de grupos, `@typedef Run` | Lógica de partido, render |
| `game/flow.js` | **Orquestador**: transiciones | postMatch (llama a medical→discipline→journal→calendar), advanceStage (cierra grupos/rondas, dispara clearAmarillas), endRun-estado | Reglas propias (solo coordina), DOM |
| `game/ratings.js` | Notas y dificultad | playerOverall, teamRating, stars*, statLine, currentAura, difficultyOf | Render de estrellas (eso es `ui/components`) |
| `game/lineup.js` | Reglas de alineación 6v6 | autoLineup, validateLineup, formationLabel | HTML, estado de selección de la UI |
| `game/opponents.js` | Rivales efectivos | genOpponentLineup, POS_MODS | Datos de equipos (vienen del repo) |
| `game/calendar.js` | El tiempo de la run | dayLabel, scheduleNextMatch, advanceDay | Efectos de eventos (viven en content), render |
| `game/discipline.js` | Tarjetas y sanciones | acumulación, suspensiones, clearAmarillas | Faltas EN partido (eso es `match/incidents`) |
| `game/medical.js` | Cuerpo y energía | rollInjury, recuperación post-partido | Tabla de lesiones (content/match/injuries) |
| `game/coach.js` | El Director Técnico (nivel 1..20) | FILO_LEVEL_REWARD, DT_STEP/DT_LEVELS, dtLevelOf, dtProgress, addCoachXp (imprime PI) | Qué se compra con los PI (eso es game/traits), XP de filosofía (game/philosophy) |
| `game/momentum.js` | El Momento del jugador (forma 1..7) | momentoPct/momentoMult, momentoLabel/MOMENTO_LABELS, applyMomentumPostMatch (devuelve el resumen anímico) | Render de chips/flechas (ui/components), reglas de moral |
| `game/morale.js` | La Moral del equipo (1..100) | MORAL_BANDS, moraleBand, bumpMorale, applyMoralePostMatch | Efecto en partido (v1 no tiene; el hook vive comentado en Match.tick) |
| `game/scorers.js` | Goleadores del torneo | addTournamentGoal, assignScorers, tournamentScorers | Resultados de partido (solo pone autor a goles ya decididos) |
| `game/assists.js` | Asistidores del torneo (espejo de scorers) | addTournamentAssist, assignAssists, tournamentAssists | Resultados de partido (reparte asistidor a una fracción de los goles ajenos) |
| `game/journal.js` | Memoria de la run | addJournal, tonos válidos | Render del diario, decisiones de qué anotar (cada sistema anota lo suyo) |
| `game/tournament/*` | La copa alrededor tuyo | tablas, fechas, clasificación, brackets, quickSim, nextOpponentId | Nada del partido interactivo |
| `game/match/Match.js` | Máquina de estados del partido | constructor, tick, fases, subs, result | Resolución de ocasiones/faltas (delegada), textos de UI de pantalla |
| `game/match/field.js` | **El territorio**: dónde está la pelota (marco absoluto anclado a mi arco), las dos alturas de bloque, **la amplitud del dibujo** (qué carriles ocupa cada línea), la deriva ambiente SIN azar, el mapa de calor por tiempo y las ventanas tácticas | zona/carril, `myHeight`/`oppHeight`, `setHeight`, `backlineRisk`, `attackWidth`/`defenseWidth`/`widthHint`, `zoneWeight`/`originOf`, `ADVANCE`, `heatCells` | Elegir QUÉ jugada sale (eso es sequences), narrar una jugada, consumir `rnd()` en la deriva |
| `game/match/powers.js` | Fórmulas de poder | effStat, gkQuality, teamPowers | Estado, azar de eventos |
| `game/match/actions.js` | Football Actions (Bible §7) | actPass/actDribble/actShot/actContain/actOppShot — gestos que devuelven resultado estructurado | Narración, mutar el marcador, hilo de la secuencia |
| `game/match/sequences.js` | Generador de Key Sequences | objetivo 2-6/partido, rivalProfile, typeWeights (mentalidad viva), startSequence | Fórmulas de gesto (actions), datos de tipo (content), resolución de actos (sequence-acts) |
| `game/match/sequence-acts.js` | **El contrato §3.2 y el despacho**: qué se le pregunta al DT y quién resuelve lo que eligió | buildActDecision, resolveSequenceAct, las dos tablas (BUILDERS/RESOLVERS) | Cualquier regla de un acto (eso es `acts/`), generación (sequences) |
| `game/match/acts/*` | **Un archivo por FAMILIA de fútbol**: cada uno trae SUS constructores de decisión y SUS resolvers — agregar un acto es tocar un solo archivo | build · attack · setpiece · defense · chains (desenlaces transversales) · block (lo que el Bloque le hace al remate rival) · common (helpers) | Generación (qué/cuándo sale), fórmulas de gesto (actions) |
| `game/match/chances.js` | Penales, último hombre, remate simulado | penales en juego, lastManChance, ambientShot*, goles, VAR | Tarjetas/lesiones, secuencias interactivas |
| `game/match/incidents.js` | Incidencias | faltas, tarjetas, lesiones en juego | Fórmulas de gol |
| `game/match/shootout.js` | Tanda de penales | start/shoot/check-end | Nada fuera de la tanda |
| `content/*` | **Lo que el PO edita**: tablas de contenido | datos + flavor + `effect(run)` que solo usa core | Reglas de sistemas, imports de game/ui, DOM |
| `ui/session.js` | Estado de sesión de la UI | refs a run/match/matchCtx/selectedLineup/timer + `slot` (la ranura de esa run) | Reglas de juego, persistencia |
| `ui/save.js` | **Quién guarda y cuándo**: el puente sesión↔ranura que la regla §4.2 obliga a poner del lado de la UI | autoguardar (al cerrar el día), cargarRanura (rehidrata `S`), usar/soltar/borrarRanura | Formato del almacén (eso es storage/saves), reglas de juego |
| `ui/components.js` | Piezas visuales reutilizables | stars, energía, banderas, toast, modal, shell | Conocimiento de pantallas específicas |
| `ui/sprites.js` | Arte procedural | spriteSvg, rivalLook, hash, pools | Reglas (p.ej. quién es "figura") |
| `ui/theme.js` | Identidad visual | applyTeamColors, SVG de trofeo/balón | Layout de pantallas |
| `ui/screens/*` | Una pantalla cada uno | render de SU pantalla + sus handlers | Reglas de juego, localStorage directo, cálculo de probabilidades |
| `storage/history.js` | Persistencia del historial | get/save historial | Formateo visual, reglas |
| `storage/saves.js` | Persistencia de la PARTIDA | getSlots/readSlot/writeSlot/clearSlot sobre `wc26_saves`, versionado del formato | Cuándo guardar (lo decide `ui/save.js`), formateo visual, reglas |
| `main.js` | Composición | valida WC_DATA importada, monta menú | Todo lo demás |

### 3.1 Mapa de propiedad del estado `run` (quién escribe qué)

Este mapa es ley: si un módulo escribe un campo que no le pertenece, es un bug de arquitectura.

| Campo de `run` | Dueño (escribe) | Lectores típicos |
|---|---|---|
| `teamId`, `groups`, `myGroupIdx`, `rounds` | `run.js` (nacen) · `tournament/groups` (results) | todos |
| `squad[].stats/energia` | `medical`, efectos de `content/`, `day-action` (canje → crecimiento permanente, Bible cap.6) | match, ui |
| `squad[].amarillas/suspendido/expulsado` | `discipline` (post-partido) · `match/incidents` (en juego) | lineup, ui |
| `squad[].lesionado*` | `match/incidents` · `medical` | lineup, ui |
| `squad[].momento` | `momentum.js` (post-partido) · efectos de `content/` (mutación directa 1..7) | ratings (statAt), ui, daily |
| `squad[].goles/asistencias` | `match/chances` (en juego: `goalMine` pone gol y asistidor) | scorers/assists (tabla), ui, daily |
| `moral` | `morale.js` (post-partido y pasar de ronda) · efectos de `content/` (clamp 1..100) | ui/hub, ui/squad, daily, **calendar** (frecuencia de conflictos, Sprint 2) |
| `scorers` | `scorers.js` (goles ajenos: world sim + rival de mis partidos) | ui/scorers, ui/hub |
| `assists` | `assists.js` (asistencias ajenas: world sim + rival de mis partidos) | ui/scorers, ui/hub |
| `windowStart` | `calendar.js` (al agendar) | ui/hub (calendario) |
| `stage`, `matchday`, `koMatches`, `lastWinners` | `flow.js` (única pluma) | tournament, ui |
| `groups[].results` | `run.js` (nacen) · `tournament/world` (sim ajenos) · `flow` (mi resultado) | tournament/groups, ui |
| `koPlayed`, `lastNight` | `tournament/world` (resetea `flow` por ronda) | daily, ui/worldcup |
| `rivalBans` | `tournament/world` (limpia `flow` cuando cumplen ante mí) | daily, opponents, ui/match |
| `day`, `nextMatchDay`, `dayPlan`, `actionPending`, `dayMod` | `calendar.js` (`actionPending` la baja day-action) | ui/hub, day-action |
| `lastAction` | `day-action.js` | ui/hub |
| `filoId`, `planFilo` | `philosophy.js` (elección/cambio) · `content/daily/day-actions` (Plan de Partido) · `flow` (limpia `planFilo` al cerrar) | match (matchCtx.filo), ui/hub, ui/philosophy |
| `filoInicial` | `philosophy.js` (`choosePhilosophy`, una sola vez) | philosophy (afinidad), ui |
| `filoXp` | `philosophy.js` (`applyFiloXp`, post-partido) · `content/identity/philosophies.addFiloProgress` (eventos) | philosophy (nivel), traits (gates), ui |
| `dtXp`, `dtNivel` | `coach.js` (`addCoachXp`, solo desde subidas de filosofía) | ui/hub, ui/philosophy |
| `identityPoints` | `coach.js` (+1 por nivel de DT) · `philosophy.js` (el PI inicial) · `traits.js` (los gasta) | ui/philosophy, ui/hub |
| `rasgos` | `traits.js` (`buyTrait`, {filoId: [ids]} — todos activos a la vez) | match (vía matchCtx.filo.rasgos), ui |
| `altura` | `ui/hub` (la orden permanente del DT, 1..5) | match (vía `matchCtx.altura`), ui |
| `buffs` | efectos de `content/` (+), `flow` (reset) | match/powers, ui |
| `peleaEntre`, `filtrador` | efectos de `content/daily/conflicts` (NOMBRES, no referencias — regla de serialización) | el propio conflicto al aplicar la opción elegida |
| `journal` | `journal.js` (todos anotan vía addJournal) | ui/journal |
| `stats`, `champion` | `flow.js` | ui/end |
| `misResultados` | `flow.js` (`closeMatch` empuja el marcador de cada partido propio) | ui/screens/saves (los "últimos" de la ranura) |

✅ Los campos muertos (`lineup`, `extraPos`, `mentalidad`, `lastResults`, `eliminated`, `bracket`, `prepDone`) ya no existen, y `koMatches`/`lastWinners` nacen en `newRun` como `null`: la forma del estado es estable.

**Regla de serialización**: `run` contiene solo datos planos (JSON-izable). Prohibido guardar funciones, nodos DOM o referencias circulares. ✅ **DEUDA SALDADA (Sprint 4, 21-jul-2026)**: el hack `_peleaA/_peleaB` del conflicto "pelea" —que guardaba **referencias a objetos del squad** dentro de `run`— quedó reemplazado por `run.peleaEntre = [nombreA, nombreB]`, resuelto contra `run.squad` en el momento de aplicar el efecto (helper `peleadores(r)` en `content/daily/conflicts.js`). El conflicto nuevo `fuga_vestuario` nace ya con el patrón correcto (`run.filtrador` = nombre). Verificado en navegador: `JSON.stringify(run)` no explota y los campos viejos ya no existen. Esto deja gratis el futuro "guardar run a medias". Excepción documentada: la instancia `Match` NO es serializable a mitad de partido — limitación aceptada.

### 3.2 El contrato de decisiones Match ↔ UI

Las decisiones siguen siendo `{id, title, text, options[{label, hint, key, risk?}]}` con ids
string. `risk` (1..5, opcional) es **dato de diseño** —lo autora a mano quien escribe el acto,
no sale de la matemática— y dice cuánto se está apostando en esa opción; la escala vive
documentada en `game/match/sequence-acts.js`. Una opción sin `risk` (elegir pateador, elegir
quién sale) no dibuja la barra: ahí no hay apuesta, hay un nombre. El contrato pasa a estar documentado en `Match.js` con esta tabla, y la regla es: **agregar una decisión = 3 pasos siempre** (creador en `match/*`, resolver en `match/*`, entrada de ruteo en `screens/match.js`). El checklist vive como comentario encima del router de la UI.

| id | La crea | La resuelve |
|---|---|---|
| `sequence` | sequences.js | resolveSequenceAct |
| `penalty_mine` / `penalty_opp` | chances.js | resolvePenaltyMine/Opp |
| `last_man` | chances.js | resolveLastMan |
| `protect` / `forced_sub` / `gk_red` | incidents.js | ruteo UI → makeSub |

`sequence` es **multi-acto**: resolver un acto puede dejar OTRA decisión `sequence` (el acto
siguiente). Los loops de UI y smoke la reprocesan solos porque `tick()` corta con decisión
pendiente — no hace falta un id por acto. (En A1 se retiró `chance`: las ocasiones interactivas
se volvieron secuencias.)

### ⚖️ Autocrítica de la sección

- **Riesgo: `flow.js` Dios.** El orquestador podría engordar hasta ser el nuevo monolito. Contención: flow solo puede *llamar* sistemas y *escribir* los campos que posee (`stage`, `stats`); si un `if` de flow compara stats de jugadores, esa regla pertenece a un sistema.
- **Riesgo: `content/` con lógica creciente.** Los `effect(run)` ya contienen mini-lógica (el virus con 40% de contagio). Aceptado mientras un efecto quepa en ~5 líneas y solo use core; si un efecto necesita más, es señal de que nació un sistema.
- **¿`session.js` es un store encubierto?** Es solo el reemplazo honesto de las variables de módulo que ya existen en ui.js §1. Sin suscripciones, sin magia.

---

## 4. Reglas de dependencias

### Permitido

| Quién | Puede importar |
|---|---|
| `main.js` | todo |
| `ui/**` | `game/**`, `content/*` (para pintar tablas), `data/*`, `storage/*`, `core/*`, otros `ui/*` |
| `game/**` | `core/*`, `data/teams-repo`, `content/*`, otros `game/**` (sin ciclos) |
| `content/*` | **solo** `core/*` |
| `storage/*` | `core/*` |
| `data/teams-repo` | `data/teams` |
| `core/*` | nada |

### Prohibido (y por qué)

1. **Nada importa `ui/`** — el motor renderizable en Node es el activo #1 (tests).
2. **`game/**` no importa `storage/`** — el motor no decide cuándo persistir; lo decide quien orquesta la sesión (UI/main).
3. **`content/` no importa `game/`** — el contenido recibe `run` y lo muta con primitivas; si necesita un sistema, la regla va al sistema y el contenido la invoca por datos (p.ej. `{ tipo: "lesion", partidos: 2 }`), no por import.
4. **Nadie fuera de `core/rng` llama `Math.random()`** — protege las semillas futuras.
5. **Nadie fuera de `data/` y `main.js` toca `window.*`** — hoy `getTeam` lee el global; tras F2 los datos entran por import.
6. **Ciclos: prohibidos siempre.** Si A necesita B y B necesita A, la pieza compartida baja de capa.

### Verificación mecánica (sin tooling)

Chequeos grep que cualquier sesión (humana o IA) puede correr y que la Fase 7 deja anotados en el README de tests:

```
grep -rn "from ['\"].*ui/"        js/game js/content js/core js/storage   → debe dar 0
grep -rn "Math.random"            js --include=*.js | grep -v core/rng.js → debe dar 0
grep -rn "window\."               js/game js/content js/core              → debe dar 0
grep -rn "localStorage"           js --include=*.js | grep -v storage/    → debe dar 0
```

### ⚖️ Autocrítica

¿Es demasiado rígido prohibir `game → storage`? Caso límite: auto-guardar la run al final de cada día. Solución sin romper la regla: `flow.advanceDay` retorna y la UI (o main) persiste. La regla aguanta; si algún día duele de verdad, se relaja **documentándolo aquí primero**.

---

## 5. Plan de migración

**Principios**: (1) el juego funciona al final de CADA fase; (2) **mover ≠ mejorar** — un commit mueve código tal cual, o mejora lógica, jamás ambas cosas; (3) cada fase tiene un gate de verificación que debe estar verde antes de seguir; (4) el smoke test es el árbitro: % de campeón por equipo sin drift fuera del ruido.

| Fase | Qué se hace | Gate para cerrar | Tamaño |
|---|---|---|---|
| **F0 — Red de seguridad** | `tests/` en el repo (smoke, validate-teams, discipline) corriendo contra los archivos ACTUALES con el shim de eval de hoy. `tools/` para scripts de DB. Cero cambios al juego. | 3 tests verdes en Node | S (~20-30k tokens) |
| **F1 — Salto a ESM (en bloque, sin partir nada)** | `index.html` → `<script type="module" src="js/main.js">`. `teams.js` exporta `TEAMS` (mantiene `window.WC_DATA` como shim temporal). `engine.js` → `export const Engine`; `ui.js` importa; nace `main.js`. Tests pasan de eval a `import`. | Juego idéntico en navegador + smoke verde | S-M (~30k) |
| **F2 — Hojas del motor** | Extraer `core/rng`, `core/math`, `data/teams-repo` (muere la lectura de `window.WC_DATA` en el motor). `engine.js` queda como **fachada** que re-exporta: la UI no se entera. | smoke verde + greps de §4 | S (~20k) |
| **F3 — Sistemas de campaña** | Extraer `ratings`, `calendar`, `journal`, `discipline`, `medical`, `content/*` y crear `flow.js` (absorbe `postMatchUpdate` + `clearAmarillas` como orquestación). Fachada intacta. | smoke verde, diffs = cut/paste | M (~40-60k) |
| **F4 — Torneo y run** | `tournament/{groups,knockout,sim}`, `run.js`, `opponents.js`. | smoke verde | M (~40k) |
| **F5 — Partido** | Partir `Match` en `Match/powers/chances/incidents/shootout`. Es la lógica más sensible al balance: aquí "mover ≠ mejorar" es sagrado. | smoke 1.500+ runs, % campeón sin drift | M-L (~60k) |
| **F6 — UI** | `storage/history`, `session`, `components`, `sprites`, `theme`, y `screens/*` por tandas (menú+historial+sorteo → hub+squad+worldcup+journal → match+shootout+post → end). Muere `ui.js`. | Recorrido manual completo en navegador por tanda | L (~80-100k) |
| **F7 — Cruce de frontera y limpieza** | Mover a `game/`: `autoLineup`, `validateLineup`, `formationLabel`, `nextOpponentId`, `difficultyOf`, y la progresión de `advanceTournament` → `flow.advanceStage`. Borrar código muerto (P8). Retirar la fachada `engine.js`: imports directos. Actualizar README + FUNCIONES + CORE. | smoke + navegador + greps §4 en 0 + docs al día | M (~50k) |

Notas:
- **Orden justificado**: tests primero (F0) porque son el seguro de todo lo demás; ESM antes de partir (F1) porque partir bajo `<script>` globales obligaría a mantener el orden de carga a mano ~30 veces.
- **La fachada es andamio, no arquitectura**: existe de F2 a F6 para no tocar la UI mientras se opera el motor. F7 la retira; si sobrevive, la migración quedó a medias (ese es el riesgo #1 del plan).
- Cada fase cabe en una sesión de trabajo. Entre fases el juego es 100% jugable, así que el desarrollo de features puede intercalarse (con la regla obvia: la feature nueva ya nace en su módulo si el módulo existe).

### ⚖️ Autocrítica del plan

- **¿Por qué no big-bang?** Porque el requisito es "nunca romper el juego" y no hay CI: la verificación es smoke + manual. Fases pequeñas = superficie de bug pequeña.
- **¿Por qué la UI al final?** Porque tiene menos riesgo de romper balance (no toca números) pero más superficie visual: conviene migrarla cuando ya hay costumbre con el proceso. Contra-argumento válido: es el archivo que más molesta al leer. Si duele antes, F6 puede adelantarse a F4 sin dependencias.

---

## 6. Convenciones (ley para el futuro)

**Archivos**: kebab-case (`post-match.js`); clases en PascalCase (`Match.js`). Un archivo = un sistema o una pantalla. Un sistema nace como archivo único y se convierte en carpeta cuando acumula 2+ archivos propios.

**Presupuesto de líneas**: >300 = luz amarilla (buscar qué extraer), >500 = prohibido sin discusión en este doc. Una tabla de contenido con >~12 entradas se muda a su propio archivo en `content/`.

**Nombres de funciones**: motor usa verbos `apply* / resolve* / sim* / roll* / compute* / schedule* / clear*`; UI usa `render* / show* / open*` (pantallas y modales). Tablas de contenido en `UPPER_SNAKE`. Ids de contenido y decisiones: strings en minúscula (`"pelea"`, `"penalty_mine"`).

**Idioma**: se mantiene la mezcla actual — dominio futbolero en español (`amarillas`, `apercibido`, `clearAmarillas` está bien), infraestructura en inglés. No se renombra lo existente por estética.

**Documentación**: toda función exportada lleva su comentario `/** */` de 1-3 líneas (estilo actual). Feature nueva = actualizar FUNCIONES.md (tabla del módulo) y, si toca números, CORE.md. Cambio de arquitectura = actualizar ESTE doc primero.

**Tests**: cambio en `game/**` o `content/**` ⇒ correr `node tests/smoke.js` antes de dar por cerrado. Sistema nuevo ⇒ test propio en `tests/`. Cambio de balance ⇒ smoke `--smart` y comparar % campeón contra la tabla de CORE.md §10.

**Azar**: todo por `core/rng`. **Estado**: `run` solo datos planos; jugadores se referencian por `name` cuando cruzan una frontera serializable.

**¿Módulo nuevo o existente?** Regla del sustantivo: si la feature agrega un SUSTANTIVO nuevo al dominio (filosofía, noticias, logros, sonido) → módulo nuevo en `game/` (+ tabla en `content/` si tiene contenido editable + pantalla en `screens/` si tiene UI). Si agrega un verbo/regla sobre un sustantivo existente (nueva regla de tarjetas, nuevo tipo de lesión) → módulo existente. En la duda: empieza en el existente; extraer después es barato porque los imports son explícitos.

**Prohibiciones permanentes**: no crear `utils.js`/`helpers.js`/`constants.js` genéricos (core/ es cerrado; las constantes viven con su sistema). No acceder a `window.*` fuera de `main.js`. No duplicar una regla del motor en la UI "porque era corta" — se importa.

---

## 7. Criterio para futuras implementaciones

La prueba de fuego de esta arquitectura: **¿sé de inmediato qué leer, qué tocar y qué no tocar?** Tabla de casos reales (incluye el backlog conocido):

| Quiero... | Leer | Modificar | NO tocar |
|---|---|---|---|
| Nuevo evento inevitable | content/daily/prep-events | content/daily/prep-events (1 entrada) | calendar, hub |
| Nuevo conflicto (aun multi-opción) | content/daily/conflicts | content/daily/conflicts | calendar, hub |
| Nuevo tipo de lesión | content/match/injuries | content/match/injuries | medical, match |
| Cambiar regla de amarillas (p.ej. 3 en vez de 2) | game/discipline + CORE.md | game/discipline | match/incidents (solo detecta faltas), ui |
| Nuevo tipo de secuencia | content/sequences (datos, **incluida su `zone.from`: desde qué alturas nace**) + sequences.js (su peso en el pool) + actions.js (si el gesto no existe) + **la familia de `match/acts/` que corresponda** (su constructor y su resolver, que debe MOVER la pelota) | esos archivos | Match.js (tick), `sequence-acts.js` salvo para sumar el acto a las tablas, powers, screens |
| Que un rasgo dependa del territorio | match/field (el marco) + match/trait-hooks (`zoneOk`) | `content/traits/`: `zone: [min,max]` o `minHeight: n` en el hook **y compensarle la frecuencia** | el motor (el gate ya existe: es un dato del rasgo) |
| Nuevo skill moment suelto (no secuencia) | match/chances + contrato §3.2 | match/chances (creador+resolver) + screens/match (ruteo) | Match.js (tick), powers |
| Nueva pantalla | screens/ vecinas + components | screens/nueva.js + navegación en la pantalla origen | game/** |
| **Sistema de Filosofía** | Bible §5 + sequences.js + flow | NUEVOS: game/philosophy.js, content/identity/philosophies.js, screens/philosophy.js + hooks: **sequences.js (sesga el pool de secuencias — es un GENERADOR, no un modificador de powers)**, flow (progresión, la alimenta el PARTIDO vía applyFiloXp), game/coach.js (el DT y los PI), hub (card) | tournament, discipline, storage, powers (Filosofía NO es un modificador estadístico escondido) |
| **Mundo vivo / noticias** | tournament/*, calendar | NUEVOS: game/news.js, content/headlines.js + hook en flow.postMatch + card en hub | match/**, discipline |
| **Conflictos en cadena** | calendar, content/daily/conflicts | calendar (dayPlan multi-acto), content/daily/conflicts (formato cadena), run.js (estado de cadenas) | match/**, tournament |
| Logros | journal (ya es el log de momentos) | NUEVOS: game/achievements.js, content/achievements.js + hook en flow.endRun + sección en end.js | resto |
| Sonido | screens que emiten momentos | NUEVO: ui/audio.js + llamadas desde screens | game/** (el motor no suena) |
| ~~Guardar run a mitad~~ ✅ **HECHO** (12-ago-2026) | storage/saves, ui/save, screens/saves | — | game/** (la run ya era serializable por §3.1, y el sprint lo DEMOSTRÓ con `tests/saves.test.js`) |

**Regla de 3 pasos para cualquier feature**: (1) ¿es contenido? → `content/`, listo. (2) ¿es regla de un sistema existente? → ese archivo de `game/`. (3) ¿es un sustantivo nuevo? → módulo nuevo + hook en `flow.js` + (opcional) content + screen. Si una feature necesita tocar más de 4 archivos, detente y revisa este documento: o la feature está mal partida, o la arquitectura tiene un hueco — y se corrige el doc primero.

---

## Apéndice: estado del documento

- Decisión ESM: tomada por el PO el 14-jul-2026.
- **15-jul-2026 — MIGRACIÓN DEL MOTOR EJECUTADA** (orden del PO: "la prioridad es modularizar engine.js"):
  - **F0 ✓** `tests/` en el repo: run-all, smoke (con línea base de balance), teams.validate, discipline (24 checks).
  - **F1 ✓** ES Modules: `index.html` carga solo `js/main.js`; muere el doble clic (file://); `data/teams.js` exporta `WC_DATA` y mantiene `window.WC_DATA` como shim para la UI.
  - **F2–F5 (lado motor) ✓** engine.js (1.190 líneas) partido en 23 módulos: `core/`, `data/teams-repo`, `game/` (run, flow, ratings, opponents, calendar, discipline, medical, journal), `game/tournament/` (groups, knockout, sim), `game/match/` (Match + powers, chances, incidents, shootout) y `content/` (themes, prep-events, conflicts, injuries). `js/engine.js` quedó como **fachada** con la API idéntica — ui.js no se tocó salvo el import.
  - **Gates cumplidos**: batería completa verde · BRA campeón 35,0% → 34,5% (n=1500, sin deriva) · tabla de 18 jugables sin deriva sistemática (Δ dentro de ±2σ a n=150) · partido completo jugado en navegador (decisión de penal incluida) con consola limpia.
  - **Regla de datos fijada por el PO (15-jul)**: la distribución de posiciones de los planteles es **diseño libre** (mínimo 1 por posición); las huellas de sprite duplicadas son advertencia, no error; `data/teams.js` no se edita sin su OK. El validador es la ley ejecutable del esquema (la cabecera de teams.js quedó subordinada a él).
  - `PREP_ACTIONS`/`applyPrep` (muertos desde v7) quedaron parqueados como LEGACY en `content/daily/prep-events.js` y `game/flow.js` — borrarlos en F7 con OK del PO (no hay git para recuperarlos).
- **15-jul-2026 — F6 EJECUTADA** (orden del PO, con pase estético incluido):
  - ui.js (1.442 líneas) → `ui/` (nav, session, components, sprites, theme) + `ui/screens/` (11 pantallas, la mayor: hub 273 líneas) + `storage/history.js`. `js/main.js` compone; ui.js eliminado.
  - **Patrón de navegación**: las pantallas se registran en `ui/nav.js` y navegan con `go(nombre, ...args)` — cero imports circulares entre screens (cumple §4). Enmienda a §2: este registro reemplaza a los "imports directos entre pantallas" del diseño original, que habrían formado ciclos (hub↔squad, match↔post-match↔hub).
  - Shim `window.WC_DATA` **retirado** (adelantado de F7): la UI consulta `data/teams-repo`. `window.*` en `js/`: 0. `Math.random` del menú → `E.pick` (azar único cumplido).
  - **Pase estético (pedido del PO: matar bloques que crecen solo por ocupar espacio)**: card de efectos vacía → línea slim; tarjeta de eliminación directa → compacta con la ronda como protagonista; días del calendario → `flex-1` (reparten todo el ancho); post-partido en eliminatorias → columna única centrada (antes el grid dejaba una celda vacía); hub rebalanceado (izq: posición+efectos · der: plantilla+diario+CTA) con `md:items-start`.
  - Gates: batería verde · recorrido completo en navegador (menú→sorteo→hub→plantilla→mundial→diario→días→partido con decisiones y entretiempo→post-partido→abandono→desenlace→diario→historial) · consola limpia · greps §4 en 0 real.
- **15-jul-2026 — F7 EJECUTADA · MIGRACIÓN COMPLETA** 🏁:
  - Reglas de UI mudadas al motor: `game/lineup.js` (autoLineup/validateLineup/formationLabel — el smoke ya no duplica nada), `ratings.difficultyOf` (devuelve `tier`; la UI solo mapea colores), `knockout.nextOpponentId`.
  - La orquestación que vivía en post-match.js pasó a `flow.closeMatch(run, match)` y `flow.advanceStage(run, advanced)` → la pantalla solo pinta y rutea por `{type}`. El smoke usa el flujo REAL del motor de punta a punta.
  - Refino de flow cumplido: `postMatchUpdate` delega en `medical.applyMedicalPostMatch` y `discipline.applyDisciplinePostMatch` (validado por los 24 checks de discipline.test).
  - **Fachada `js/engine.js` ELIMINADA**: cada pantalla importa sus sistemas; `tests/load-engine.js` agrega los módulos solo por comodidad de los tests.
  - Limpieza: campos muertos de `run` fuera (`bracket`, `lineup`, `extraPos`, `mentalidad`, `lastResults`, `eliminated`, `prepDone`); `koMatches`/`lastWinners` nacen en `newRun` (forma estable, §3.1 documentado en el propio run.js); LEGACY `PREP_ACTIONS`/`applyPrep` borrados; shim `window.WC_DATA` retirado.
  - Gates: batería verde · BRA campeón 34,7% (n=1500, vs 35,0% base — sin deriva) · recorrido completo en navegador (menú aleatorio→run→plantilla→mundial→diario→días→partido a x2 con decisiones→post-partido→hub→abandono→desenlace→diario→historial) · consola limpia · 0 referencias a la fachada.
  - La migración F0→F7 está **cerrada**. Las secciones §2–§7 de este documento describen ahora el estado real del código, con una enmienda: la navegación entre pantallas usa el registro `ui/nav.js` (ver entrada F6).
- ✅ **Control de versiones**: el proyecto está en git (remoto `wc-primelike`). La migración se hizo sin él, a punta de tests y backups manuales; desde entonces cada arco se commitea.
- Este documento se revisa al cerrar cada fase y cada vez que una feature contradiga una regla (gana el que tenga mejor argumento, pero queda escrito).
- **30-jul-2026 — SPRINT DEL TERRITORIO** (T1-T5, decisiones PO al arrancar): el partido pasa a
  saber DÓNDE se juega. Nace `game/match/field.js` (el único módulo nuevo del sprint) con el
  marco absoluto anclado a mi arco, la deriva ambiente **sin consumir `rnd()`** (misma ley que
  `stats`/`match-momentum`: así una capa de estado nueva puede existir sin moverle un dial al
  balance calibrado), el mapa de calor por tiempo y la altura de bloque como palanca del DT.
  - **Enmienda a §3.2**: el sprint NO agrega ids de decisión. Los dos actos nuevos (`buildout`,
    `throughball`) viajan por la decisión `sequence`, que ya era multi-acto — el contrato de 3
    pasos no se toca. Un acto nuevo son 2 pasos: constructor + resolver, hoy en su familia
    de `match/acts/` (más su entrada en las dos tablas del despachador).
  - **Ventanas tácticas**: recurso nuevo del partido (3), independiente de los 3 cambios. Vive
    en `field.windows` y solo lo gasta `setHeight` con el partido en juego.
  - ~~**Deuda registrada**: `ui/screens/match.js` quedó en 881 líneas~~ — ✅ **SALDADA
    (30-jul-2026)**: la pantalla pasó a ser la CARPETA `ui/screens/match/` con cuatro módulos
    (index · panels · tactics · squad), aplicando la regla de §6 ("un sistema se convierte en
    carpeta cuando acumula 2+ archivos propios"). Fue una **mudanza pura**: cero cambios de
    regla, la batería y el % de campeón intactos por construcción. Lo único que se movió de
    sitio fue el CABLEADO — cada módulo engancha sus propios controles (`wireCarousel`,
    `wireTactics`), porque el estado de la vista (`slide`, `heatSide`) no puede cruzar la
    frontera a mano. `tactics.js` y `squad.js` importan `updateMatchUI`/`startTimer` de
    `index.js`: es un ciclo **benigno de runtime**, el mismo patrón que ya usa `game/match`
    entre `sequences` y `sequence-acts`.
- **30-jul-2026 — `sequence-acts.js` PARTIDO POR FAMILIAS**: el archivo más grande del motor
  (1.283 líneas contra un presupuesto de 500) pasó a ser `sequence-acts.js` (el contrato §3.2 y
  los dos despachadores, 68 líneas) + la carpeta `game/match/acts/` con siete módulos. El corte
  es por FAMILIA DE FÚTBOL, no por tipo de código: construir · llegar y definir · balón parado ·
  defender · los desenlaces transversales · lo que el Bloque le hace al remate rival · los
  helpers compartidos. Cada familia trae SUS constructores de decisión y SUS resolvers, así que
  **agregar un acto es tocar un solo archivo**.
  - **Mudanza pura, y esta vez DEMOSTRADA**: es el módulo más sensible al balance del proyecto,
    así que además de la batería se comparó el original contra la suma de los módulos nuevos
    línea por línea (sin comentarios ni imports, normalizando indentación). Las ÚNICAS líneas
    que difieren son las cuatro transformaciones declaradas: `if (kind === "x") {` →
    `export function resolveX(m, s, key, f) {`, `x: () => …` → `x: (m, s) => …`, los helpers
    privados que ganaron `export` al cruzar una frontera, y el diccionario `{…}[kind]()` que
    pasó a ser las dos tablas del despachador. **Cero líneas de lógica de juego cambiadas.**
  - Ciclos benignos de runtime (documentados en cada cabecera): las familias ↔ la entrada
    (`buildActDecision` para reconstruir la decisión, `resolveSequenceAct` para las opciones que
    caen a la básica) y las familias ↔ `chains` (escalar y cerrar). Nada se usa en la evaluación
    del módulo, solo dentro de las funciones.
- **30-jul-2026 — `hub.js` PARTIDO** (última deuda de tamaño del proyecto): 889 líneas → la
  carpeta `ui/screens/hub/` con cuatro módulos — `index` (la composición de la pantalla y el
  paso del día), `rival` (su card, el Informe y la Oportunidad), `team` (estado, identidad,
  efectos y la altura del bloque) y `day` (calendario, Acción del Día y sus modales).
  - **Mudanza pura, demostrada igual que la de `acts/`**: 684 líneas de código antes y 684
    después, y las ÚNICAS diferencias son los 20 `export` que ganaron las funciones al cruzar
    una frontera de módulo. Ni una línea más.
  - Ciclo benigno de runtime: las tres hojas importan `renderHub` de `index` para repintar tras
    aplicar algo (canjear un buff, elegir una Oportunidad, cerrar un evento del día).
  - **Trampa de la mudanza, anotada para la próxima**: al bajar los archivos un nivel, TODAS las
    rutas relativas necesitan un `../` más — y `ui.validate` no lo detecta (solo parsea). Los
    404 aparecen recién al cargar la pantalla en el navegador; el paso de verificación real de
    una mudanza de UI es abrirla, no que la batería esté verde.

- **12-ago-2026 — SPRINT DE LA MEMORIA DE PARTIDA** (la deuda "Guardar run a mitad" de §7,
  saldada). El juego deja de arrancar en el menú de equipos: la raíz pasa a ser LA PORTADA
  (`ui/screens/saves.js`), con el título y tres ranuras. Elegir equipo es ahora el segundo
  paso, dentro de una ranura.
  - **La pregunta del PO era "¿JSON o .js?" y no era de gusto**: un `.js` no se puede
    escribir desde la página (`data/teams.js` es un módulo que el navegador IMPORTA y que
    edita el PO a mano). Lo que genera el jugador va a `localStorage`, que guarda strings →
    **JSON serializado**, mismo camino que `storage/history.js`. Un archivo en disco pediría
    descargar y subir a mano cada partida: eso es "exportar", no "guardar".
  - **La regla §4.2 decidió el diseño**: `game/**` no puede importar `storage/`, así que el
    motor no sabe que existe el guardado. El puente vive en `ui/save.js` y son TRES llamadas
    en todo el juego — `draw` (nace la ranura), `hub/pasarDia` (cada día que cierra) y
    `end` (el desenlace). El PO eligió esa cadencia: al terminar cada día y en ningún otro
    momento. Consecuencia declarada y aceptada: lo que pase DENTRO de un día no está
    guardado hasta que el día termina.
  - **La instancia `Match` sigue sin ser serializable** (§3.1). Como el último guardado de un
    día de partido es el instante ANTES de salir a la cancha, cerrar la pestaña al minuto 67
    devuelve al hub con el once puesto: se re-juega, no se retoma. Es la única salida
    honesta y ahora está escrita.
  - **Campo nuevo en `run`**: `misResultados` (dueño: `flow.closeMatch`). Existe porque la
    ranura muestra los últimos marcadores y hasta hoy esos números solo vivían como TEXTO
    dentro del título de una entrada del diario.
  - **La barra de progreso mide la RUTA, no los días** (decisión PO). El diseño traía "Día 14
    de 26" y ese total no existe: una run dura 41-48 días según lo que sortee cada ventana.
    El único total fijo son los 8 partidos de la copa (`knockout.RUTA_PARTIDOS`), y son
    además lo que uno quiere saber mirando una ranura.
  - **`tests/saves.test.js`** ejerce por primera vez la promesa de §3.1 de punta a punta: una
    run real va a localStorage y vuelve idéntica campo por campo. Una función o un ciclo
    metidos en `run` no rompen ningún test de motor — rompen el guardado, y se habrían
    descubierto con la partida perdida.
  - `pxFlag` se mudó de `hub/hud.js` a `ui/components.js`: la portada también la necesita y
    una pantalla no importa de otra (queda un re-export en hud para no romper a nadie).

  Con esto **ninguna PANTALLA pasa el presupuesto de §6** (la mayor es `screens/squad.js`, 463).
  Queda un archivo sobre 500, con su motivo:
  - `game/match/sequences.js` (606) es el GENERADOR: pesos del pool, filosofía, altura,
    amplitud y XP de identidad. Su corte natural sería separar el sesgo del pool
    (`typeWeights` + las matrices) del arranque de secuencia (`startSequence`). No urge.
