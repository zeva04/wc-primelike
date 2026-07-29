# 🧠 ROADMAP — Arco de la Progresión (Filosofías + Director Técnico)

> Documento vivo del arco. GDD del PO del **28-jul-2026**: trasladar el crecimiento del
> entrenador desde la fase de preparación al terreno de juego, inspirado en el sistema de
> habilidades de Skyrim. **CERRADO EN UN SPRINT** (28-jul-2026).

## La tesis

> La identidad futbolística deja de construirse asignando puntos en un menú y pasa a
> desarrollarse a través del rendimiento durante los partidos.

Antes: la Sesión Táctica daba +1 de arista por día, el nivel salía de sumar 2 aristas y
cada nivel imprimía 1 PI. El DT no existía. Medido: el Master del árbol se conseguía en
el **86%** de las runs — la progresión era una cinta transportadora, no una consecuencia.

Ahora: se aprende el fútbol que se juega. Ver `docs/CORE.md §9b` para la mecánica
completa y las tablas.

## Las 4 decisiones del PO (AskUserQuestion, 28-jul-2026)

| # | Pregunta | Decisión |
|---|---|---|
| 1 | ¿Qué pasa con la Sesión Táctica y las 5 aristas? | **Pasa a ser Plan de Partido.** Los Principios mueren como mecánica; la acción declara qué fútbol se va a ejecutar (sesga el pool) y multiplica ×1.5 la XP de esa idea. Respeta la regla del GDD ("no se mejora desde el menú") y le da cuerpo al 70% de intención. |
| 2 | ¿El árbol conserva su forma? | **Árbol sí, Principios no.** Se borran los "Principios mínimos" de los 51 rasgos; queda nivel de la filosofía + 1 PI + el recorrido de la rama (previo/convergencias). Sin eso el árbol sería una lista y las convergencias de T3 se perderían. |
| 3 | ¿Qué rasgos están activos con builds híbridas? | **Todos los comprados.** Se acaba la latencia: si lo compraste, juega. Es lo que hace real la build híbrida del GDD. Riesgo de balance asumido y medido. |
| 4 | Extras | **Skill-up en vivo**: el partido anuncia la subida de nivel en el relato y el panel muestra las barras de XP llenándose. (Descartados por ahora: títulos del DT, bautismo del híbrido → backlog.) |

Decisiones tomadas por mí, declaradas: la **matriz de afinidad** (×2 propia · ×1.25 afín ·
×1 neutral · ×0.6 opuesta, sobre el eje proactivo/reactivo — reproduce exactamente el
ejemplo del GDD) y **toda la calibración numérica**, que es dial abierto.

## Lo que se tocó

**Motor**
- `content/philosophies.js` — `FILO_LEVELS` pasa a XP acumulada (250·300·…·930), + `XP_INTENCION`/`XP_ACIERTO`, `FILO_BY_TIPO`/`filoOfType`, `AFINIDAD`/`afinidadMult`, `xpLevelOf`, `EVENT_XP`; `filoPointsOf`/`filoLevelOf`/`filoEtapaOf` aceptan filoId; `addFiloProgress` reparte XP (y `addFirmaProgress` es su alias).
- `game/coach.js` — **NUEVO**: el Director Técnico (1..20), `FILO_LEVEL_REWARD` (tabla del GDD), `DT_STEP`/`DT_LEVELS`, `dtLevelOf`, `dtProgress`, `addCoachXp` (imprime PI).
- `game/philosophy.js` — `applyFiloXp` reemplaza a `applyFiloExecution`; `filoCtx` viaja con `xp`/`mult`/`plan`; `choosePhilosophy` fija la escuela y el PI inicial; `changePhilosophy` ya no hereda nada y vale como Plan; `filoXpMults`.
- `game/traits.js` — mueren `syncIdentityPI`/`creditInheritedPI` (los PI los imprime el DT) y el requisito de Principios; `activeTraitIds` devuelve TODO; `buyTrait` compra de cualquier árbol; `traitTree(run, filoId)`; `focusPayoff` → `planPayoff`.
- `game/match/sequences.js` — `noteFiloIntent` (70%) + `noteFiloHit` (30%) acumulan `m.filoXp` ya multiplicado y **anuncian el nivel en el feed**.
- `content/day-actions.js` — los 5 focos de arista → los 4 **planes de partido**.
- `content/traits.js` — fuera los `principio`/`principios` de los 51 rasgos.
- `game/run.js` — estado nuevo: `filoInicial`, `filoXp`, `planFilo`, `dtXp`, `dtNivel` (y muere `aristas`/`piCredited`).
- `game/flow.js`, `game/day-action.js` — cableado de los beats.

**UI**
- `ui/screens/hub.js` — panel del Plan de Partido (4 ideas con nivel y barra + payoff al hover); la card de identidad suma la barra del DT.
- `ui/screens/philosophy.js` — la pizarra **navega los 4 árboles**; banda con el DT, los PI y la afinidad de la idea mirada; el onboarding no deja pasar sin gastar el PI.
- `ui/board.js` — la franja de cabecera pasa de 5 principios a **4 filosofías con su nivel** (y es el selector).
- `ui/screens/match.js` — barras de XP en vivo + estilo del feed `filo`.
- `ui/screens/post-match.js` — el parte de identidad: XP por idea, jugadas/aciertos, subidas y lo que cobró el DT.
- `ui/filo-change.js` — el modal habla de niveles propios, no de aristas.

**Tests** — `philosophy.test` (335 checks) y `traits.test` (719) reescritos en sus secciones
de progresión; `coach` registrado en `load-engine`; el smoke declara Planes con su escuela
y audita `filoXp`/`dtNivel`, más telemetría de progresión en el resumen.

## Balance (smoke `--smart`, n=400)

| | BRA | MAR |
|---|---|---|
| HEAD (sistema viejo) | 54.3% campeón · master 86.3% | 47.0% · master 87.3% |
| Arco de Progresión | **44.0%** · master 5.0% | **40.3%** · master 6.7% |

Progresión medida (BRA): filosofía tope ~7.8/10 · **DT ~14.6/20** de media, campeones
~8.5 y **~16.2**, con el 20 alcanzado. Cae en la banda del GDD (promedio 12-15 · muy
buena 16-18 · perfecta 20).

**El juego quedó ~7-10pp más difícil en el techo.** Es el sistema, no un efecto lateral:
la cinta transportadora se apagó. Va a decisión del PO — recordar que al cerrar el arco de
Rasgos quedó anotado que el techo de BRA (47.2%) estaba **+5.3pp por encima** del objetivo
de 41.9%, así que este arco lo empuja hacia donde el PO quería.

## Backlog del arco

- **Títulos del DT** (Debutante → Leyenda) visibles en el hub — propuesto, no elegido.
- **Bautismo del híbrido**: la prensa nombra el estilo mixto cuando dos ideas llegan alto.
- **Vigilar el poder acumulado de la build híbrida**: sin latencia, un DT con 12 rasgos de
  3 árboles es más fuerte que antes; hoy lo compensa que los PI son más caros, pero si el
  techo vuelve a derivar el dial es `DT_STEP`.
- **¿El Master más accesible?** Medido (ver CORE §9b): al dial actual sale en el **21.7%**
  de las runs de un DT que compra con intención (el 5% inicial medía al que esparce PI
  entre los 4 árboles). Cada +20% de `XP_INTENCION`/`XP_ACIERTO` vale ~+12pp de Master
  pero **corre la escala del GDD** (el DT medio se va de 14.8 a 16.4). Si el PO lo quiere
  más común sin tocar la escala, el dial correcto es el gate de los 12 Masters: nivel
  10 → **9** da 34.0% con el DT clavado en 14.9. Decisión abierta.
