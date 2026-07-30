# 🧬 ROADMAP — La Odisea: remodelación de las stats del jugador

> Arco pedido por el PO el 29-jul-2026. **Sprint 1, primera mitad: CERRADA.**
> Mecánica y tablas en `docs/CORE.md §1-2`.

## El pedido

1. Partir `pase` en **pase corto** y **pase largo**; agregar **velocidad**.
2. Cargarlas de forma realista (búsqueda) en todas las plantillas jugables, **sin que
   cambie la media actual de ningún jugador** — lo que obliga a mover el resto.
3. El **aura** pasa a valer un **10% parejo** de la media en los cuatro puestos.
4. Actualizar la configuración de las selecciones **no jugables**.
5. Agregar al entrenamiento del día los focos **pase corto**, **pase largo** y **velocidad**.
6. *(Segunda mitad del sprint)* Integrar las stats nuevas al partido.

## Las 4 decisiones del PO (AskUserQuestion)

| # | Pregunta | Decisión |
|---|---|---|
| 1 | Fuente de los datos | **Búsqueda por plantel**: páginas oficiales de EA SPORTS FC 26 (`ea.com/.../nations-ratings/<país>/<id>`), columna PAC por jugador, + perfil futbolístico para el reparto corto/largo. |
| 2 | Peso de la velocidad | **Protagonista**: DEL 22% · MED 18% · DEF 12% · POR 5%. |
| 3 | Cómo se preserva la media | **Automático ponderado**: velocidad y aura quedan fijas y el resto se mueve lo justo, proporcional al peso del puesto, con tope ±4 (±6 en los que no cierran). |
| 4 | Efecto del aura al 10% | **Aceptado**: el líder lento sube en todo lo demás; el veloz de aura baja ya no la necesita. |

## Lo que se hizo

**Datos** — `data/teams.js`: los **230 jugadores** de las 23 selecciones jugables reescritos
con las 7 stats. Velocidad investigada jugador por jugador (EA FC 26); el reparto
corto/largo **nunca infla** el pase compuesto (si el perfil sumaba, se le resta la media:
repartir, no regalar). Arqueros: la columna PAC de una carta GK es *diving*, no velocidad —
la suya se estimó por perfil, y su peso es 5%.

**Rivales no jugables** — `game/opponents.POS_MODS` extendido: el lateral/extremo corre, el
central es lento, el arquero no corre, el volante reparte corto mejor que largo.

**Motor** — `ratings.OVR_WEIGHTS` reescrito; `STAT_KEYS`/`GK_STAT_KEYS` y `statLine` con las
7. `actions.actPass` ya distingue de verdad: el pase **filtrado** mide `pase_largo`, el de
circulación `pase_corto`. El resto de los sitios que necesitan UN número de pase usan
`ratings.PASE_MIX` (60/40) — **la costura declarada** que reemplaza la segunda mitad.

**Acción del día** — Entrenar pasa de 3 focos a **5**: ataque · defensa · pase corto · pase
largo · **velocidad**, que cansa `TRAIN_FATIGUE + VELOCIDAD_FATIGUE_EXTRA` (−8) porque son
piques, no un rondo. `STAT_LABELS` y `CANJEABLE_STATS` incluyen las tres nuevas (el canje de
entrenamiento funciona con ellas sin tocar su regla).

**Contenido** — los eventos que repartían `pase` ahora dicen cuál (`pase_corto` casi todos;
el evento del genio da Pase corto permanente). Las **aristas** de las filosofías apuntan a
la stat que trabajan: Elaboración → pase corto · Juego directo → **pase largo** ·
Verticalidad → **velocidad**.

## Resultado medido

- **225 de 230 jugadores conservan su media exacta.**
- Los 5 que no: Casemiro 82→**78** (velocidad 40 con peso 18% no da), Chris Wood 77→76,
  Harry Kane 87→86, James Rodríguez 82→81, Dailon Livramento 64→65. Es una colisión
  estructural entre "la velocidad pesa mucho" y "la media no cambia": los diales son
  subirles la velocidad o bajar su peso (y recalcular los 230).
- **Balance sin deriva**: BRA `--smart --focus` **43.8-46.5%** de campeón (n=400-600) contra
  **44.7%** antes de la remodelación — dentro del ruido. Preservar la media funcionó.
- 4 stats quedaron en el techo de 99 (Messi corto/largo, Rodri corto, Bruno Fernandes) —
  son los mejores pasadores del mundo, se acepta.

## Bug arreglado de paso

La cabecera de Gestión de Plantilla apilaba energía + moral + media en un flex sin
`flex-wrap`: ~398px de contenido que a 375 se salían de la pantalla. Ahora envuelve.

## Segunda mitad del sprint — CERRADA (29-jul-2026)

**Las 3 decisiones del PO:** el desborde entra como **jugada nueva completa** (tipo de
secuencia propio, no opciones sueltas) · **enseña Contragolpe** · y la velocidad se mete
en los actos existentes **donde el fútbol la pide**, no en todo el motor.

### 🏃 La jugada nueva
`banda` = `wing → cross → finish`, con `protStat: "velocidad"` (la corre el rápido).
Detalle completo de opciones, stats y trades en `docs/CORE.md §Key Sequences`. Dos Football
Actions nuevas: **`actSprint`** (velocidad vs velocidad, el primer duelo así del motor) y
**`actCross`** (alto = `pase_largo` → cabezazo · rasante = `pase_corto` → remate de frente).

### La velocidad, en la cancha
- **Conducción**: era 100% aura; ahora aura + velocidad **al mismo valor esperado** (cambia
  el perfil, no el ritmo de gol).
- **Último hombre**: anticipar pesa la diferencia de velocidad entre el central y el 9.
- **Contención del repliegue**: la velocidad media de mi zaga entra al corte.

### Balance
BRA **47.3%** (era 46.5%) · MAR **41.8%** (era 43.5%), `--smart --focus` n=600/400: dentro
del ruido. La jugada nueva se lleva el **7.5%** de los actos de secuencia (medido en 120
partidos) sin desplazar a ninguna: entró por el reparto del pool, no por encima.

### Tests
18 checks nuevos en `sequences.test.js` (455 en total): el catálogo del tipo, que el rápido
la corre más que el lento sin ser determinista, los tres caminos del acto de banda, que
cortar hacia adentro **saltea el centro**, que el centro en juego abierto no lo cabecea un
central, y la monotonía de las cuatro stats en sus duelos (sprint propio y del perseguidor,
centro alto vs rasante, conducción, contención).

## Tercera mitad: LA COSTURA CERRADA — CERRADA (29-jul-2026)

**Las 4 decisiones del PO:** recalibrar la dificultad **después** de medir A1 · los 5 jugadores
descuadrados quedan **como están** · el Maestro **sigue en nivel 10** (no se baja el gate) ·
la **densidad** de jugadas sigue esperando su propio sprint.

### A1 — muere PASE_MIX

Los tres sitios que mezclaban 60/40 pasaron a declarar **cuál** pase miden, con criterio
futbolístico (tabla completa en `docs/CORE.md §2`):

| Sitio | Ahora mide | Por qué |
|---|---|---|
| `powers.teamPowers` (atk del medio) | `pase_corto` | atacar desde el medio es **circular**; el envío que rompe líneas ya tiene su sitio propio (`actPass` filtrado, `actCross` alto) |
| `stats.passRate` (panel) | `pase_corto` | la inmensa mayoría de los ~500 pases de un partido son de circulación |
| `sequences.rivalProfile` | `pase_corto` | "querer la pelota" es saber **tocarla** — el que vive del pase largo es justo el que NO la quiere |

`ratings.PASE_MIX` y `paseMix` **borradas**. La capacidad de lanzar en largo del rival NO se
agregó como dimensión propia: no tenía consumidor, y la lección de `prof.vel` es no crear
diales dormidos.

### A2 — `prof.vel` despierta

El desborde va a buscar la **espalda lenta**. El término entró **centrado**
(`1.0 + 1.5·def + 1.0·(1−vel)` en vez de `1.5 + 1.5·def`): promedia exactamente el peso
viejo, así la jugada no aparece más seguido — aprende **contra quién** aparecer. Medido:
+35% de desborde contra una zaga rival lenta respecto de una rápida.

### A3 — la velocidad en los dos sitios que faltaban

- **El desmarque del desenlace**: sin Superioridad Numérica, el que recibe el pase de gol ya
  no es un corredor cualquiera — la velocidad pondera el sorteo (mismo cuadrático sobre 70
  que `protStatW`). A igual tiro, el rápido recibe más; el lento sigue apareciendo.
- **La persecución tras robo**: vive en `chances.resolveLastMan`, opción **"esperar"** —
  contener ES aguantar mientras los demás vuelven corriendo ("le da tiempo a la zaga", dice
  el propio relato). Término centrado contra la velocidad del que se escapó.
  > **Hallazgo**: el primer intento fue en `maybeCounter`, y resultó **rama muerta** —
  > `LASTMAN_FROM_COUNTER = 1.0`, así que TODA contra con un defensor en pie va al mano a
  > mano. Ese remate directo solo corre sin defensores en cancha. Queda anotado en el código.

El duelo del pelotazo **no se tocó**: ahí manda el cabezazo y así está bien.

### Balance

| | baseline | después | n |
|---|---|---|---|
| BRA `--smart --focus` | 47.3% | **47.9%** | 2000 |
| MAR `--smart --focus` | 41.8% | **44.1%** | 1500 |

**El sprint no movió el balance.** Centrar los términos nuevos funcionó.
⚠️ A n=600 la primera lectura dio BRA 44.3% y pareció una caída de −3pp: era **ruido**
(σ ≈ 2pp a ese n). Para leer un cambio de ±2pp hace falta n≥1500, no 600.

### Tests

7 checks nuevos en `sequences.test.js`: que `PASE_MIX` ya no existe; que el perfil del rival
NO se mueve al subirle el pase largo y SÍ al subirle el corto; que el desborde sale más
contra una zaga lenta **y** que el dial reparte alrededor del peso viejo (no lo sube); que
el rápido recibe más el pase de gol sin ser determinista; y que una zaga que no vuelve paga
las contras más caras.

Un check se **relajó**, con motivo: `powers.test` exigía que el 1-1-3 fuera el de más ataque
en los 10 planteles. NZL tiene **un solo delantero real** (Chris Wood), así que su 1-1-3
llena el ataque con gente fuera de puesto y el 1-2-2 lo empata (3.4789 vs 3.4757, 0.09%).
No se pueden amontonar delanteros que no existen — es el espejo exacto de la tolerancia que
el mismo bloque ya tenía del lado defensivo. "Ningún dibujo dominado" sigue pasando.

### Limpieza

`board.js` importaba `ARISTAS` sin usarlo · `hub.js` importaba `showFiloChange` y cableaba
`#btn-filo-change`, un botón que ya no existe · el comentario de `philosophy.changePhilosophy`
seguía describiendo la "demolición orgánica" y `run.aristas`, muertos desde la Progresión.

### C1 — la verificación móvil, resuelta: `tools/mobile.html`

**Por qué no servía achicar la ventana**: la ventana tiene barras y scrollbars propios, así
que el ancho de CSS que ve el juego no es el que uno cree. Además el proyecto tiene **una
sola media query** (`max-width: 700px`): lo que se rompe en móvil es flex-wrap y desborde,
no breakpoints — y eso solo se ve con el ancho exacto.

El banco monta el juego en un **iframe**, cuyo ancho ES el viewport CSS del documento
embebido, **calibrado** para descontar su propia barra de scroll (pedir 375 daba 367; ahora
da 375 clavados con la ventana en 1280). Y **audita**: lista qué se sale y por cuántos px,
**filtrando lo que un ancestro recorta** — sin ese filtro reportaba el riel cerrado de la
pizarra (`translateX(101%)` bajo un `overflow:hidden`) y habría gritado lobo en cada
pantalla con un panel deslizante. Se re-audita solo, porque el juego es un SPA.

**Dos bugs reales encontrados y arreglados** (invisibles hasta ahora):

1. **Pizarra de identidad**: la banda del DT es un flex `nowrap` de ~515px dentro de 343 —
   la página se iba a **567px** con scroll horizontal. Mismo bug y mismo arreglo que la
   cabecera de Squad: `flex-wrap` (+ `max-w-full` en la barra de XP).
2. **Hub**: la card "Estado del equipo" heredaba el piso `min-width:auto` de item de grilla
   y no podía achicarse — se plantaba en 379 y empujaba la página a **394px**. `min-w-0`
   (sus hermanas de la grilla ya lo tenían; a esta se le había escapado).

Verificado a 375px sin desbordes: menú · identidad · **pizarra** · sorteo · **hub** (día
normal y día de partido) · modal de evento de vestuario · **partido** en vivo con el panel
de plantilla abierto.

## Lo que queda para más adelante

- ~~**DIFICULTAD**~~ — **CERRADA el 29-jul-2026** por orden del PO ("ataca los 6 pp"). Se
  midió el comparable real (`--smart` sin `--focus`, que es como se fijó el objetivo de
  41.9 en R3): **48.5%** a n=4000. Volvió a **41.9-42.2** con una palanca nueva, y de paso
  salió una ley: ningún dial global puede bajar el techo. Todo el detalle en
  `docs/ROADMAP-rebalance.md` §R4.
- **DENSIDAD**: sigue en 2-6 jugadas (`SEQ_MIN`/`SEQ_MAX`). Subirla a 4-10 arregla los huecos
  del reloj pero mueve +8pp de campeón: su propio sprint, con su propia recalibración.
- Backlog del arco anterior: títulos del DT en el hub · bautismo del híbrido.
