# ⚽ ROADMAP — El rework del partido (la capa de secuencias)

**Fecha:** 21-jul-2026 · **Base:** commit `cc2ed6b` (Sprint 4 de la Concentración, cerrado y pusheado).
**Propósito:** construir el sistema que la **Filosofía** necesita para existir como el Bible la define.
Este documento organiza el arco por sprints; el detalle fino de cada uno se decide con el PO vía
**AskUserQuestion** al arrancarlo — mismo método que funcionó en [ROADMAP-concentracion.md](ROADMAP-concentracion.md).

> **Este arco NO entrega Filosofía.** Entrega el motor sobre el que Filosofía se enchufa después.
> Ver "Por qué el orden es este" más abajo.

---

## Por qué el orden es este (decidido con el PO, 21-jul-2026)

El Bible §5 define Filosofía como **generador de secuencias**, y lo fija como regla permanente:

> "Philosophy **primarily changes the type of sequences** generated during matches **instead of
> acting as a hidden statistical modifier**." (§5, regla 3)

`Match.tick` hoy tira un dado plano para "¿ocasión mía?" (`0.12 + 0.22 × ratioMy`) y `myChance`
elige protagonista por puesto y resuelve remate/pase/individual. **No existe el concepto de cómo
empezó la jugada.** No hay pool de secuencias que Filosofía pueda sesgar. Sobre este motor, los
únicos ganchos disponibles son `powers.js` y esas probabilidades planas — o sea, exactamente el
modificador escondido que la regla prohíbe. Por eso el motor va primero.

---

## Protocolo del proyecto (aplica a TODOS los sprints de este arco)

Es el de siempre, con las lecciones acumuladas. Lo repito porque este arco toca el módulo más
sensible al balance de todo el proyecto.

- **Baseline FRESCO antes de tocar código.** Y en este arco, **siempre a n=4000** contra un HEAD
  medido a n=4000 en `git worktree`. Lección del Sprint 4: la MISMA versión midió **28.3% (n=1500)
  y 31.6% (n=4000)** — n=1500 habría dado el gate por aprobado con el sprint roto.
- **Gate: BRA dentro de ±2pp.** Si falla, se **recorta el efecto, no el gate** (precedente FEAT-003).
- **`DAILY_RECOVERY` mueve ~5pp de campeón POR PUNTO** y no es lineal (rompe o restaura la espiral
  de fatiga). Nada de la economía de energía se toca "de paso".
- **"Mover ≠ mejorar" es sagrado acá.** La migración F5 ya lo marcó para este módulo: un commit
  mueve código tal cual, o cambia lógica, jamás las dos cosas.
- `run-all` verde siempre; test propio para lo nuevo (registrado en `tests/run-all.js` y el módulo
  en `tests/load-engine.js`). El smoke tiene `--action=<id|grupo>`, `--all` y `--nocanje`.
- Verificación en navegador (preview 8347; inyectar estado con `javascript_tool` importando los
  módulos ES y **recargar** tras editar; móvil 375 sin scroll H; consola limpia).
- **Contrato de decisiones §3.2**: agregar una decisión son SIEMPRE 3 pasos (creador, resolver,
  ruteo en `screens/match.js`) + actualizar la tabla en `Match.js`.
- **NO** tocar `data/teams.js` sin OK del PO. Docs al día. **ARQUITECTURA se actualiza PRIMERO** si
  una feature contradice una regla. Commits solo cuando el PO pida. Español siempre.

### Números de referencia (medidos 21-jul, re-medir igual)

| Métrica | Valor |
|---|---|
| BRA campeón, juego mixto | **28.9% (n=4000)** |
| siempre-Recuperar | 42.1% (n=1500) |
| siempre-Táctica | 33.3% (n=1500) |
| siempre-Entrenar | ~20% (n=1500) |
| siempre-Bonding | 27.9% (n=1500) |

**Táctica es la que más se va a mover cuando llegue Filosofía**: es su gancho de progresión según
el Bible §5. Dejar esta foto tomada es parte del valor de este arco.

---

## Diagnóstico: el hueco entre el Bible §7 y el motor actual

| Lo que pide el Bible cap. 7 | Lo que hay hoy | Dónde se cierra |
|---|---|---|
| Key Sequences como "historias en miniatura" multi-acto (Situación→Decisión→Acción→Reacción→Clímax) | Una decisión y se resuelve | **A1** |
| Football Actions modulares y reutilizables (pase, regate, presión, tackle, cabezazo, remate, atajada) | `shoot`/`pass`/`solo` hardcodeados dentro de la ocasión | **A1** |
| 2-6 secuencias por partido, el resto simulado | Bastantes más momentos interactivos, todos cortos | **A1** |
| Ritmo observación ↔ intervención | Tick fijo de 5' a 1s, sin frenos ni aceleración | **A1** |
| Pool de tipos de secuencia con origen futbolístico | No existe | **A2** |
| El fallo genera un problema nuevo, no corta (regla 7) | El fallo cierra la ocasión | **A2** |
| Identidad del rival como factor de generación | Los rivales no tienen mentalidad ni identidad | **A2** |
| Generación sensible al contexto (marcador, minuto, fatiga, rojas, secuencias previas) | Nada de eso entra en la generación | **A3** |
| Posesión y momentum visibles en la simulación | Solo tiros y marcador | **A3** |
| `[MORAL → OCASIONES]` (hook comentado en `Match.tick` desde el 17-jul) | Sin efecto mecánico | **A3** |
| Efecto en-partido del Momento (más allá de escalar stats) | Solo escala stats vía `statAt` | **A3** |

---

## Decisiones de diseño ya tomadas (PO, 21-jul-2026)

Estas están cerradas y no se re-discuten al arrancar cada sprint.

| # | Decisión | Elegido |
|---|---|---|
| 1 | Volumen de momentos interactivos | **Pocas y profundas**: 2-6 secuencias largas, el resto simulado |
| 2 | Profundidad de la secuencia | **1 a 3 actos, variable** (el jugador no sabe qué tipo empieza) |
| 3 | Qué sesga la generación mientras no hay Filosofía | **La mentalidad de partido** (palanca explícita que el DT ya elige) |
| 4 | El fallo, ¿encadena? | **Sí, con probabilidad** (rebote, pelota suelta, emergencia) |
| 5 | Tamaño del catálogo | **6 tipos** (4 mapeados a filosofías + balón parado + salida desde el fondo) |
| 6 | Arquitectura de las secuencias | **Acciones modulares en el motor + secuencias como DATOS** en `content/` |
| 7 | Decisiones actuales | **Se absorben como actos**; los penales siguen siendo decisión propia (pueden ser clímax) |
| 8 | Secuencias defensivas | **De primera clase**, y la preparación mueve el ratio ofensivas/defensivas |
| 9 | Contexto dinámico | **Los cuatro**: marcador+minuto, fatiga, expulsados, secuencias previas |
| 10 | Moral en el partido | **El TIPO, no el número** (más seguro de balancear que tocar el volumen) |
| 11 | UI | **Posesión y momentum DERIVADOS** de las secuencias, no inventados como adorno |
| 12 | Partición | **Motor → Catálogo → Partido vivo** (riesgo de balance concentrado en A1) |
| 13 | Ritmo | **La simulación acelera y frena en seco** al llegar una secuencia |
| 14 | Identidad del rival | **Derivada de sus stats** (no toca `data/teams.js`) |
| 15 | Momento en la secuencia | **Manda el protagonista**: el encendido aparece más, el apagado se esconde. Sin tocar probabilidades |

---

## SPRINT A1 — El motor de secuencias ✅ **CERRADO (21-jul-2026)**

**Objetivo:** reemplazar las ocasiones sueltas por una máquina de secuencias multi-acto, con un
catálogo mínimo, y **pagar el gate del cambio de volumen** con la menor cantidad de contenido
encima posible. Al terminar, el juego es 100% jugable y el partido ya se siente distinto.

### Lo entregado (decisiones del PO #1-7, #13)

- **NUEVOS** `game/match/actions.js` (Football Actions ancladas a las fórmulas viejas),
  `game/match/sequences.js` (la máquina) y `content/sequences.js` (los tipos como datos).
- **3 tipos**: 🎼 circulación posicional · ⚡ transición rápida · 🧱 repliegue defensivo
  (2 ofensivos + 1 defensivo, mapean a Posesión/Contragolpe/Bloque bajo para A2).
- **Generación 2-6/partido** modulada por preparación + mentalidad, **sobre la marcha**.
- **Ritmo ráfaga**: `screens/match.js` pasó a `setTimeout` auto-agendado (crucero ~360 ms, freno
  en la secuencia, pausa breve tras un gol).
- **Contrato §3.2**: id `sequence` (multi-acto sin id por acto — los loops lo reprocesan solos).
- **`last_man` y los penales INTACTOS**: se lift-earon a eventos independientes reutilizando su
  resolución del Sprint 1, sin tocar su matemática. Las ocasiones viejas (`myChance`/`oppChance`/
  `resolveChance`) se retiraron; los remates no interactivos pasaron a `chances.ambientShot*`.
- Tests: NUEVO `tests/sequences.test.js` (71 checks, en run-all + load-engine).

### La lección de balance de A1

Baseline HEAD **29.1% n=4000**. **Primera pasada: 6.7% (derrumbe).** Causa: hice cada acto una
compuerta pass/fail, y 3 actos multiplican el fallo → una circulación marcaba ~4% vs el ~35% de la
ocasión que reemplaza. **Arreglo (dentro de A1, no es "fallo encadena"):** los actos de construcción
modulan la CALIDAD del remate (un `bonus`), no si la jugada muere; el camino seguro siempre llega al
remate y el **gate de gol es el remate final**, como antes. Solo la opción arriesgada pierde la
pelota. Tras calibrar el scoring del remate al de la ocasión vieja: **30.8% n=4000 = +1.7pp, dentro
del gate**, consistente entre n=1500 y n=4000. Diales usados (en orden): `AMBIENT_MINE`, `finishBonus`,
base de `actShot`. La brecha favorito/underdog quedó sana (BRA/FRA ~33, CPV/NZL ~4-5).

**Para A2/A3:** el residual es +1.7pp (como el canje y el Sprint 4). No queda mucho margen antes del
+2pp, así que A2 (el fallo que encadena → más goles) tendrá que recortar la prob. de gol por acto
para compensar, y medir el encadenamiento por separado de la absorción del último hombre.
Verificado en navegador: partido completo a victoria, 3 tipos aparecen, ráfaga (5'→10' en segundos)
y freno en la secuencia, penales/último hombre vivos, móvil 375 sin scroll H, consola limpia.

### Alcance

- **NUEVO `game/match/actions.js`** — las Football Actions como bloques reutilizables (pase, regate,
  presión, tackle, cabezazo, remate, atajada), cada una con su fórmula de resolución sobre `effStat`.
  Es el único lugar donde vive la matemática de un acto.
- **NUEVO `game/match/sequences.js`** — la máquina: generar una secuencia, avanzar de acto, decidir
  si escala o cierra, producir el desenlace. Opera sobre la instancia de `Match`, como sus hermanos.
- **NUEVO `content/sequences.js`** — la tabla de tipos: cada uno con su origen, sus actos posibles y
  su flavor. Agregar una secuencia debe ser agregar una fila, igual que agregar un evento.
- **Catálogo mínimo (3 tipos)**: 2 ofensivos + 1 defensivo, solo para validar la máquina. El
  catálogo completo es A2 — acá lo que se valida es el sistema, no el contenido.
- **Volumen**: el generador produce 2-6 secuencias por partido y **reemplaza** las ocasiones
  interactivas de `myChance`/`oppChance`. Las ocasiones automáticas (no interactivas) pasan a relato.
- **Ritmo**: `screens/match.js` acelera entre secuencias y frena en seco al llegar una.
- **Contrato §3.2**: id nuevo `sequence` (creador en `sequences.js`, resolver `resolveSequenceAct`,
  ruteo en `screens/match.js`) + fila nueva en la tabla de `Match.js`.

### Lo que A1 NO toca (a propósito, para aislar el riesgo)

`last_man` y los penales quedan **intactos**. El último hombre se calibró con esfuerzo en el Sprint 1
y su absorción es A2: no se mezcla con el gate del volumen.

### ⚠️ Balance de A1 (leer antes de codear)

**Este es el gate grande de todo el arco.** Bajar de "bastantes decisiones cortas" a "2-6 secuencias"
cambia **cuántas decisiones toma el humano por partido**, y la ventaja del DT humano es justamente
lo que el smoke (que decide al azar) no captura. Hipótesis: **BRA baja**, porque el azar resuelve peor
secuencias largas que ocasiones simples — el mismo fenómeno que el "último hombre" del Sprint 1, que
jugado al azar era un lastre de −1.9pp.

Diales pactados si deriva, en este orden: (1) el **número** de secuencias por partido, (2) la
probabilidad de gol por acto, (3) el reparto ofensivas/defensivas. **No** se toca la economía de
energía ni el Momento para compensar.

### Preguntas de diseño para el PO (AskUserQuestion al arrancar)

Qué 3 tipos exactamente; cómo se calcula el número de secuencias del partido (¿fijo por preparación,
o sorteado en un rango?); si las secuencias se pre-generan al inicio o se sortean sobre la marcha;
qué pasa con el cooldown actual (`_interactiveChanceCooldown`); cuánto acelera la simulación.

### Verificación (A1)

Partido completo jugado en navegador con 2-6 secuencias multi-acto; el reloj acelera y frena;
penales y último hombre siguen funcionando igual; el feed narra el origen de cada secuencia; móvil
375 sin scroll H; consola limpia.

---

## SPRINT A2 — El catálogo ✅ **CERRADO (22-jul-2026)**

**Objetivo:** que el partido tenga variedad futbolística real y que el fallo deje de ser un muro.

### Lo entregado (decisiones del PO vía AskUserQuestion al arrancar)

- **Catálogo completo: 8 tipos** (los 6 del roadmap + repliegue + la cara defensiva del córner).
  Elegido "los 6 + repliegue continúa": recuperación alta (High Press), pelotazo/duelo largo
  (Bloque bajo, estrena el Cabezazo), balón parado ×2 caras, y 🗼 **salida bajo presión** — la
  def→of: sobrevivir la presión rival CONVIERTE la jugada en transición mía.
- **Fallo que encadena bidireccional moderado**: rebote 0.30 (un solo rebote/secuencia) + contra
  0.28 sobre pérdidas ARRIESGADAS (la opción segura nunca la dispara). Se auto-compensa.
- **Identidad del rival por pesos continuos** (`rivalProfile` de sus promedios, sin datos nuevos)
  + la mentalidad como palanca VIVA que sesga el pool al momento de generar.
- **Último hombre absorbido** (calibración del Sprint 1 intacta): contención rota 0.70 y TODA
  contra 1.0 rutean al mano a mano. Exposición ~0.77/partido.
- Deuda §6 saldada al vuelo: `sequences.js` (460 líneas) se partió en generador (143) +
  `sequence-acts.js` (339) — mudanza pura, gate re-verificado.
- Además: kits de GER/NED corregidos (`kit:` → `kits:`, PO OK), descripciones de ESP/GER/NED,
  y `lineup.test` des-hardcodeado de los stats de Vinícius (deriva de datos, como discipline §8).

### ⚖️ Las dos lecciones de balance de A2

1. **La lección de A1 se repite en cada tipo nuevo**: recuperación y pelotazo nacieron con
   compuertas (ganar la presión / el duelo) y EV de gol a la mitad de circulación → BRA 27.1
   (−6.7pp). El arreglo no es quitar la compuerta (ES la identidad del tipo) sino pagar mejor el
   éxito (`actContain(bonus)`, `actAerial` 0.42, finishBonus). Medido por tipo con un diag de
   EV/secuencia: quedaron todos en banda 0.27-0.45.
2. **El canal plano era el arma del underdog.** Absorbido el último hombre en secuencias, los
   débiles no le generaban NINGÚN susto al favorito (sus secuencias son pocas y flojas, y el mano
   a mano es peligro PLANO — no depende del que se escapa) → BRA +3.7pp. Se restauró un canal
   ambiente chico (`BREAKAWAY_TICK` 0.018 ≈ 0.32/partido, "pelotazo a la espalda") que es un dial
   FINÍSIMO: 0 → +3.7 · 0.035 → −3.4. **Gate final: 34.1-35.0% n=4000 vs 33.8 = dentro de ±2pp.**
   Y n=1500 volvió a mentir dos veces — el gate del arco es SIEMPRE n=4000.

### Alcance

- **Los 6 tipos completos**: recuperación alta · circulación posicional · transición rápida ·
  pelotazo/duelo largo · balón parado · salida desde el fondo. Con sus variantes ofensiva y defensiva
  (los 4 primeros mapean a High Press, Posesión, Contragolpe y Bloque bajo — esa es la deuda que
  Filosofía va a cobrar después).
- **Absorber `last_man`** como acto de secuencia defensiva. **Cuidado**: su eficacia está calibrada
  (anticipar-fail 0.68, roja 0.12, penal barrerse 0.28) y esos números deben sobrevivir la mudanza.
- **El fallo encadena** (regla 7): remate atajado → rebote, tackle fallado → emergencia, pase
  interceptado → transición rival.
- **Identidad del rival derivada de sus stats**: un equipo con mucho ataque presiona alto, uno flojo
  se repliega. Sin tocar `data/teams.js`.
- **La mentalidad sesga el pool** de forma perceptible (decisión #3, ahora con catálogo para sesgar).

### ⚠️ Balance de A2

**El fallo que encadena genera más remates por secuencia → más goles.** Es el cambio de balance de
este sprint y es unidireccional. Casi seguro haya que recortar la probabilidad base de gol por acto
para compensar. Medir por separado el encadenamiento y la absorción del último hombre: si el gate
falla con los dos juntos, no vas a poder atribuir cuál fue (lección del Sprint 4).

### Preguntas de diseño para el PO

Los 6 tipos con su origen y sus actos; con qué probabilidad encadena cada tipo de fallo; qué actos
comparte cada tipo; cómo se deriva la identidad del rival de sus stats.

---

## SPRINT A3 — El partido vivo

**Objetivo:** que la generación respire con lo que pasa en el partido, y saldar los dos pendientes
que llevan meses esperando este rework.

### Alcance

- **Contexto dinámico en la generación** (los cuatro): marcador+minuto (perder a los 80' genera
  ofensivas desesperadas), fatiga del plantel, expulsados propios y rivales, y memoria de secuencias
  previas (no repetir tipo dos veces seguidas).
- **`[MORAL → OCASIONES]`**: la Moral sesga el **tipo** de secuencia, no el número. Se retira el hook
  comentado de `Match.tick`. Requiere pasar la moral por `matchCtx` — **el Match no conoce la run**,
  y esa frontera se respeta.
- **Momento → protagonista**: el jugador encendido aparece más seguido como protagonista, el apagado
  se esconde. **No toca ninguna probabilidad** (el Momento ya escala stats por `statAt`; modularlo
  otra vez sería contarlo dos veces).
- **Posesión y momentum en la UI**, derivados de las secuencias generadas (quién generó más y de qué
  tipo). Son una lectura honesta del partido, no un adorno.
- Pase de relato: el feed narra el origen y la escalada de cada secuencia.

### ⚠️ Balance de A3

**La fatiga entrando en la generación refuerza la energía**, que ya es la palanca más fuerte del
juego. Puede fortalecer todavía más a "siempre Recuperar". **Vigilarlo y reportarlo, no arreglarlo
acá** — el rebalance de la Acción del Día es su propio sprint, después de que este arco asiente el piso.

### Preguntas de diseño para el PO

Magnitudes de cada factor de contexto; qué bandas de Moral sesgan hacia qué; cómo se calcula la
posesión a partir de las secuencias; cuánto del relato ambiente se reescribe.

---

## Después de este arco: el sprint de Filosofía

Con A1-A3 cerrados, Filosofía deja de ser un sistema a inventar y pasa a ser **contenido enchufado**:
`game/philosophy.js` (progresión, alimentada por la Sesión Táctica según el Bible §5) +
`content/philosophies.js` (cada filosofía = un sesgo del pool de secuencias + sus fortalezas y
vulnerabilidades) + `screens/philosophy.js` + el chip en el estado del equipo que el PO ya pidió con
la imagen de referencia. Los hooks en `flow` y `hub` ya están identificados en ARQUITECTURA §7.

**Lo que hay que recordar cuando llegue:** Filosofía se alimenta de la **Sesión Táctica**, no de
Entrenar (Bible §5: "Tactical Sessions, specific events, coaching staff development, match
experience"). Entrenar es progresión individual (cap. 6), otro sistema. Por eso el pendiente de
"Entrenar dominado" **no lo arregla Filosofía** y hay que tratarlo aparte.

---

## Lo que este arco NO toca

Los tres pendientes de balance de la Acción del Día quedan congelados hasta que el arco cierre y el
piso se asiente:

1. **"Siempre Recuperar" sigue siendo la más fuerte** (42.1% vs 28.9% del mixto). Ojo: el Bible dice
   que High Press aumenta la fatiga, así que este arco puede **empeorarlo**. Vigilar y reportar.
2. **Entrenar en ~20%** (−9pp vs el mixto). No lo arregla Filosofía; necesita su propio sprint.
3. **La brecha favorito/underdog se comprimió** en el rebalance del núcleo.

---

## Riesgos del arco (y su contención)

| Riesgo | Contención |
|---|---|
| **A1 rompe el balance y no se sabe por qué** | Catálogo mínimo de 3 tipos y `last_man`/penales intactos: el gate mide UNA cosa (el volumen) |
| **La calibración del último hombre se pierde en la mudanza a A2** | Sus constantes viajan tal cual y `momentum.test`/`smoke` las custodian; medir la absorción por separado del encadenamiento |
| **`Match.js` y sus hermanos se vuelven el nuevo monolito** | Presupuesto de §6: >300 líneas = luz amarilla, >500 = prohibido. `sequences.js` y `actions.js` nacen separados por eso |
| **`content/sequences.js` acumula lógica** | Regla de ARQUITECTURA: si un efecto no cabe en ~5 líneas y necesita más que `core/`, nació un sistema y va al motor |
| **El arco se estira y Filosofía nunca llega** | Cada sprint termina con el juego jugable y su gate pasado. Si A1 se pasa de alcance, se recorta el catálogo, nunca el gate |
| **Se mezcla rework de motor con rework visual** | La UI entra recién en A3, y solo lo que se DERIVA del motor |

---

## Apéndice: estado del documento

- **21-jul-2026** — Creado tras 15 decisiones de diseño del PO (AskUserQuestion, 4 rondas). El PO
  aceptó partir el arco en 3 sprints tras el diagnóstico de que el cap. 7 no entra en uno solo.
- Se revisa al cerrar cada sprint y cada vez que una decisión contradiga lo escrito acá (gana el
  que tenga mejor argumento, pero queda registrado).
