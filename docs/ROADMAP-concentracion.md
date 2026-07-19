# 🗺️ ROADMAP — Pulido de la Concentración (pre-Filosofía)

**Fecha:** 19-jul-2026 · **Base:** commit `7715732` (Forma y Ánimo v2 cerrado y pusheado).
**Propósito:** antes de los dos sprints grandes —**Filosofía** y **rework del partido**— pulir la
Concentración para que los sistemas reactivos que ya existen (Momento, Moral, Energía) se sientan y
sean coherentes. Este doc organiza las mejoras por sprint; el detalle fino de cada uno se decide con
el PO vía **AskUserQuestion** al arrancarlo.

> **Protocolo del proyecto (recordatorio, aplica a TODOS los sprints):**
> - **Baseline PRIMERO**: `node tests/smoke.js --team=BRA --runs=1500` ANTES de tocar código (el PO
>   edita `data/teams.js` a mano entre sesiones — nunca confiar en un número histórico). Gate: BRA
>   dentro de ±2pp. Si un gate falla, re-medir HEAD en un git worktree con n=4000 antes de buscar bugs.
> - **Momento es poder ASIMÉTRICO** (los rivales no lo tienen): precedente FEAT-003 — si el balance
>   deriva, se **recorta el efecto**, no se relaja el gate.
> - `node tests/run-all.js` verde siempre; test propio para lo nuevo (registrar en `tests/run-all.js` y
>   el módulo en `tests/load-engine.js`).
> - Verificación en navegador: preview server `wc26` (8347); inyectar estado vía `javascript_tool`
>   (`import("/js/ui/session.js")` etc., módulos ES singletons por URL) y **RECARGAR** tras editar
>   (queda cacheado); screenshot se cuelga en esta máquina → usar `read_page`/`javascript_tool`;
>   móvil 375 sin scroll H y consola limpia; si se toca el fin de run, stubbear `Storage.prototype.setItem`.
> - **NO** tocar `data/teams.js` sin OK del PO. Docs al día (README, FUNCIONES, CORE si cambia matemática,
>   ARQUITECTURA si cambia estructura). Commits solo cuando el PO pida. Español siempre. Opinión sin
>   complacencia; las decisiones de diseño son del PO vía AskUserQuestion.

## Diagnóstico (19-jul-2026)

| Sistema | Estado | Gap | Dónde se cierra |
|---|---|---|---|
| **Momento** | Reworkeado a individual (goles/penales/arquero), cualitativo, +1/partido, reset por lesión | Solo goleadores/arquero lo mueven → **DEF/MED no tienen vía de subir**; casi todo el plantel vive en *Normal* | **Sprint 1** |
| **Moral** | Reacciona al resultado, visible en hub/Daily/análisis | **Sin efecto mecánico** (el README lo admite) — tablero inerte | Sprint 2 |
| **Energía** | Cansancio −10/30' + pasiva +8/día | Falta herramienta de rotación/descanso dirigido; el cansancio probablemente rompió el equilibrio de la Acción del Día (Entrenar quedó dominado) | Sprint 3 |
| Análisis / Eventos / Cruces | Funcionales | Análisis spammea decaimientos; eventos poco variados y sin diálogo con los sistemas nuevos; falta profundidad cruzada | Sprint 4 |

---

## SPRINT 1 — Momento para todo el plantel ← **EMPEZAMOS ACÁ**

**Objetivo:** que defensas centrales y mediocampistas tengan forma de **ganar** Momento, no solo los
que hacen goles. Dos mecánicas + una tabla nueva.

### 1A · Las asistencias suben el Momento (todos) + tabla de asistidores del torneo

**Regla nueva de Momento:** dar una **asistencia** sube el Momento +1 (misma escala que un gol, sujeta
al tope de +1/partido). Ayuda sobre todo a los **MED**.

**Implementación (motor):**
- **El partido debe trackear asistencias.** Hoy `match.scorers = [{name, min}]` y el motor elige al
  goleador (`Match._weightedPick` en `chances.js`), pero **no hay concepto de asistencia**. Al convertir
  un gol de jugada (no penal, no de otro tipo sin pase), atribuir —con cierta probabilidad— una
  asistencia a un compañero en cancha, ponderando por puesto/pase (MED y DEL pesan; el propio goleador
  no se autoasiste). Guardar en `match.assists = [{name, min}]` (o `assist` dentro del scorer).
- **Momento:** en `game/momentum.js` `applyMomentumPostMatch`, sumar la señal "asistencia" (+1, tono
  up, texto "Dio una asistencia") leyendo `match.assists`. Respeta `MOMENTO_RISE_MAX`.
- **Tabla de asistidores del torneo** (espejo de `game/scorers.js`):
  - Nuevo `run.assists` para los equipos AJENOS (el mundo vivo solo simula marcadores → repartir
    asistencias entre las figuras ponderando por puesto, como `assignScorers` reparte goles; considerar
    peso pro-MED). Función `assignAssists(run, teamId, nGoles)` llamada desde `world.simWorldMatch` y
    desde el gol del rival en MIS partidos (`flow.closeMatch`).
  - **MIS** asistencias: campo nuevo `squad[].asistencias`, incrementado en `flow.closeMatch` desde
    `match.assists` (mi equipo NO entra en `run.assists`, igual que sus goles no entran en `run.scorers`).
  - `tournamentAssists(run, limit?)` combina ambas y ordena (ranking 1·2·2·4 como goleadores).
- **Cuidado con el rng:** `assignAssists` consume rng → desplaza la secuencia del smoke (no cambia el
  modelo pero sí las muestras); documentarlo, es aceptable.

**UI:**
- **Carrusel en el hub:** hoy `renderScorersCard()` (en `ui/screens/scorers.js`) pinta el top-5 de
  goleadores en la columna derecha. Convertirlo en un **carrusel de 2 pestañas** (⚽ Goleadores /
  🅰️ Asistidores) con flechas o dots, sin romper la altura de columna (`h-full flex flex-col`). El clic
  sigue llevando a la pantalla completa.
- La **pantalla completa** de goleadores (`renderScorers`) gana el mismo toggle Goleadores/Asistidores.

**Tests:** extender `scorers.test.js` (o `assists.test.js` nuevo, registrado) — asistidores válidos, mi
equipo nunca en `run.assists`, tabla ordenada; `smoke` audita `run.assists` sano y `squad[].asistencias`.

**Preguntas de diseño para el PO (AskUserQuestion al arrancar):**
- ¿Qué % de los goles de jugada llevan asistencia? (p.ej. ~60-70%; los penales y algunos goles no)
- ¿Ponderación del asistidor por puesto? (MED alto, DEL medio, DEF bajo, POR ~0)
- ¿Un jugador que hace gol **y** asiste en el mismo partido suma ambas señales? (da igual: el tope +1
  las acota — confirmar que está OK)

### 1B · Decisiones de "último hombre" para los defensas centrales (en partido)

**Mecánica nueva (una decisión de partido, NO el rework del partido):** en ciertas ocasiones peligrosas
del rival (contragolpe / pelota filtrada), el DT decide qué hace su **defensa central**:
**barrerse · esperar · anticipar**. Si la jugada de gol se **corta**, el central involucrado sube el
Momento +1.

**Implementación (motor):**
- Nueva decisión `last_man` (respetar el **contrato de decisiones §3.2**: creador en `match/chances.js`
  o `incidents.js`, resolver en el módulo, ruteo en `ui/screens/match.js` — SIEMPRE 3 pasos; actualizar
  la tabla del contrato en `Match.js`).
- **Disparo:** una fracción de las ocasiones del rival (`Match._oppChance`) se convierte en `last_man`
  en vez de resolverse normal. Elegir un **DEF** en cancha como protagonista.
- **Opciones y resolución** (ponderar por la `defensa` del central vs el ataque rival; `aura` puede
  aportar temple):
  - **Anticipar** (paso al frente / interceptar): alto riesgo–alta recompensa. Si sale, corte limpio
    (Momento +1, corta la jugada); si falla, el delantero queda de cara al arco (gol muy probable).
  - **Barrerse** (barrida): intermedio. Puede cortar, pero mal timing = falta → riesgo de tarjeta o
    **penal** si es en el área.
  - **Esperar** (contener): seguro. Demora y baja la peligrosidad (la ocasión se resuelve como remate
    normal a atajar), pero rara vez "corta" heroicamente → menos chance de Momento.
- **Crédito de Momento:** marcar el corte exitoso (p.ej. `match.lastManStops = [name]`); en
  `applyMomentumPostMatch`, +1 con tono up ("Cortó un gol como último hombre"). El error queda como su
  consecuencia (gol/penal/tarjeta), no como −Momento explícito (a menos que el PO quiera penalizar).

**UI:** el modal de decisión del partido con las 3 opciones + su `hint` (riesgo). Relato en el feed.

**Balance:** esto ayuda a DEFENDER (poder asimétrico a favor del humano) → **gatear con smoke**. Además
suma Momento a los DEF → más jugadores en forma.

**Preguntas de diseño para el PO:** frecuencia de la decisión; perfiles de éxito exactos de cada opción;
¿anticipar-fallado = gol seguro?; ¿riesgo de tarjeta/penal en barrerse?; ¿esperar puede igual dar
Momento si el remate se ataja?

### ⚠️ Balance del Sprint 1 (leer antes de codear)

Sumar fuentes de Momento (asistencias + cortes de último hombre) significa **más jugadores en forma** =
el **boost asimétrico del Momento CRECE**, justo lo que el sprint anterior había reducido a propósito.
Además 1B da una ventaja defensiva directa. **Re-medir BRA con smoke**; si deriva >±2pp del baseline:
recortar el **% por paso del Momento** (`MOMENTO_PCT_STEP` en `momentum.js`, hoy 2) — es el dial pactado
— y/o la frecuencia/eficacia del último hombre. **No relajar el gate** (FEAT-003).

### Verificación en navegador (Sprint 1)
Asistencia sube Momento y aparece en el análisis del cuerpo técnico; carrusel Goleadores↔Asistidores en
el hub y en la pantalla completa; decisión de último hombre (las 3 opciones, corte→Momento, fallo→
consecuencia); móvil 375 sin scroll H; consola limpia.

---

## SPRINT 2 — Moral con mordida (lado Concentración)

**Objetivo:** que la Moral deje de ser un tablero inerte, **sin tocar el motor del partido** (el efecto
en-partido [MORAL→OCASIONES] queda para el rework del partido). Opciones a discutir con el PO:
- Moral alta **frena el decaimiento** del Momento / moral baja lo acelera.
- Moral modula la **recuperación de energía** (alta recupera más).
- Moral baja **sube la probabilidad/severidad de conflictos** de vestuario.

Elegir 1-2 efectos que cierren el loop *resultado → moral → consecuencia* del lado Concentración. Gate
con smoke (la moral reacciona al resultado, así que puede correlacionar con el rendimiento).

---

## SPRINT 3 — Gestión de energía y rotación

**Objetivo:** dar herramientas para gestionar el cansancio (que ya pesa) y re-equilibrar la Acción del Día.
- **Vista de energía del plantel** de un vistazo en Gestión (barras de todos, para decidir rotación).
- **Descanso dirigido** (descansar a un titular puntual) y/o revisar que **Entrenar** siga siendo una
  decisión viva (con el cansancio, *Recuperar/Táctica* pueden dominar — Bible: no dominant strategy).
- Posible acción nueva (Team Bonding → Moral) para variar el menú del día.
- Re-mirar el balance de `DAY_ACTIONS` con la energía como recurso escaso.

---

## SPRINT 4 — Pulido y profundidad cruzada

- **Anti-spam del "Análisis del cuerpo técnico":** agrupar/colapsar los decaimientos (tras cada partido
  casi todo el plantel decae a *Normal*); destacar solo los movimientos reales.
- **Eventos-problema** (Bible §4.5: los eventos deben generar problemas, no repartir premios) que usen
  Momento/Energía/Moral; más variedad de consecuencia (hoy casi todo mueve aura/energía).
- **Interacciones cruzadas** (baratas, dan profundidad sin sistemas nuevos): fatiga alta ↑ riesgo de
  lesión; muchos jugadores fríos ↓ moral; etc.
- **Deuda técnica:** migrar el side-channel `run._peleaA/_peleaB` del conflicto "pelea" a nombres
  (ARQUITECTURA §3.1 regla de serialización); `ui/screens/squad.js` en luz amarilla (>300 líneas) —
  extracción si crece.

---

## Diferido — con los dos sprints grandes (NO en esta tanda)

- **Filosofía** (Bible cap. 5): cambia el TIPO de fútbol, no un modificador escondido — toca
  `flow`/`powers`/`hub` + `game/philosophy.js` + `content/philosophies.js` + `screens/philosophy.js`.
- **Rework del partido.**
- **Efecto EN-PARTIDO de la Moral** (`[MORAL → OCASIONES]`, hook ya comentado en `Match.tick`: modular
  tipo y número de ocasiones según la banda; requiere pasar la moral por `matchCtx`) y de la Moral/Momento
  colectivos sobre el juego. Va con el rework del partido.
