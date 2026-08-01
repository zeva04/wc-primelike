# 🗺️ ROADMAP — El sprint de la ESCALADA

**Fecha:** 31-jul-2026 · **Base:** commit `4bac5eb` (sprint de la Densidad, batería verde).
**Estado:** ✅ **CERRADO**.

**Objetivo (pedido del PO):** *"quiero que el juego se sienta difícil, sobre todo contra
selecciones más grandes. A medida que el jugador progresa se va haciendo más OP, el rival
también tiene que sentirse más difícil en fases posteriores."*

---

## 1. La métrica que faltaba

El proyecto medía dificultad con el **% de campeón**, y ese número **no dice si el torneo se
endurece**. Cae de 100% a ~28% solo porque hay que ganar cinco veces seguidas: la ilusión de
una rampa donde hay una meseta.

La métrica correcta es **condicional**: *de los que LLEGAN a cada ronda, ¿cuántos la ganan?*

| antes del sprint | 16avos | 8vos | 4tos | semis | FINAL | salto |
|---|---|---|---|---|---|---|
| piso (decisiones al azar) | 81.4 | 79.3 | 77.1 | 76.4 | **75.7%** | **5.7pp** |
| techo (`--smart`) | 87.5 | 86.3 | 84.9 | 84.5 | **84.4%** | **3.1pp** |

**La final era prácticamente igual de difícil que la primera eliminatoria** — y para un DT
competente, idéntica. Se deriva de las "caídas" que el smoke ya imprimía: no hacía falta
medir nada nuevo, hacía falta leerlo bien. Ahora el smoke la imprime en cada corrida.

## 2. El diagnóstico: lineal contra compuesto

La escalada **sí mordía**. Medido en el banco de plantel fijo (mismo once, mismo rival,
subiendo solo `koRound`):

| | forma rival | gano |
|---|---|---|
| grupos | ×1.00 | 79.2% |
| 16avos | ×1.03 | 76.1% |
| 4tos | ×1.09 | 71.0% |
| final | ×1.15 | **68.3%** |

**−10.9pp aislada. −5.7pp observada en runs reales.** La progresión del DT se comía la mitad
de la escalada — y **dos tercios si el DT jugaba bien** (−3.1pp).

La causa es estructural y vale como ley para el futuro:

> **`tourneyFormaMult` era LINEAL y CIEGA (+3% por ronda, fija). La progresión del jugador es
> COMPUESTA (nivel de filosofía × rasgos × canje permanente × DT × Momento). Una progresión
> compuesta siempre le gana a un contrapeso lineal — y le gana MÁS al jugador que mejor
> juega, que es exactamente al revés de lo que uno quiere.**

Segundo hallazgo, independiente: **contra quién se juega la final casi no mejoraba**. Medido
en 3.000 brackets, el rating medio del finalista subía de 76.1 a 80.3 en cinco rondas, y
**el 6% de las finales se jugaban contra un rival de rating ≤69**. `quickSim` pesaba el
rating igual en grupos que en eliminatorias.

## 3. Las cuatro decisiones del PO

| # | Decisión | Elegida |
|---|---|---|
| D1 | Dureza de la final | **Convexa hasta ×1.45** (la más agresiva de las ofrecidas) |
| D2 | Selectividad del mundo | **Solo en KO, moderada** — los grupos conservan su caos |
| D3 | Ancla del gate | **Manda la CURVA**; el % de campeón se reporta, no se gatea |
| D4 | Comunicación | **Solo palabras, sin número** |

## 4. Lo que se construyó

- **`opponents.TOURNEY_FORM = [0, .03, .10, .19, .31, .45]`** — la curva convexa, declarada
  entera (la generó `0.45·(ronda/5)^1.7`). Los 16avos quedan **exactamente** donde estaban
  (×1.03): el salto se concentra donde el jugador ya es fuerte. Reemplaza a
  `TOURNEY_FORM_PER_ROUND`.
- **`sim.SPREAD_KO = 0.85` vs `SPREAD_GROUPS = 0.55`** — el mundo simulado se vuelve
  implacable **solo en eliminatorias**. La prórroga y la tanda no escalan: si el grande llegó
  empatado hasta ahí ya falló, y una tanda es una moneda — ese es justo el agujero por donde
  tiene que colarse la cenicienta que sobrevivió.
- **El Modo Mundial, en palabras** (`scouting.MODO_MUNDIAL` + `BRECHA_SCOUT`): cinco textos
  de ojeador, uno por ronda ("Se acabaron los ensayos" → "Es LA FINAL"), y la card del
  informe sube de **temperatura visual** con la ronda (`rival.MODO_TONO`: ámbar en 16avos,
  rojo pleno en la final). El titular del Daily cita el mismo título — una sola fuente.
- **La CURVA en el smoke**: una línea nueva por equipo con la probabilidad condicional por
  ronda y el salto 16avos→FINAL. Es el gate del arco y ya no se mide a mano.
- **`tests/escalada.test.js`** (78 checks).

## 5. Lo que enseñó medir

**1. Una mitad de la dificultad tiene que ser VISIBLE.** Subir `p.forma` es un buff escondido:
el jugador siente que le cuesta más y no sabe por qué. Hacer selectivo el mundo cambia
*contra quién* jugás, y eso se lee en el escudo del rival. Es dificultad que se comunica sola,
sin una línea de UI. La final pasó a ser contra élite el **87%** de las veces (era 79%) y
contra un rival flojo el **2%** (era 6%).

**2. El caos tiene que vivir en algún lado.** Endurecer también los grupos habría sido más
"coherente", pero los grupos son la única fase donde un batacazo no le arruina el bracket a
nadie — y son el combustible del World Cup Daily. Se dejaron intactos a propósito: BEL le
gana a IRQ el 55% en grupos y el 77.5% en KO.

**3. Quitar el número mejoró el informe, no lo empeoró.** `game/scouting` declara en su
cabecera que es CUALITATIVO ("nunca porcentajes") y el Modo Mundial era su única excepción.
Con la curva nueva ese "+18%" habría pasado a "+45%": un número que convierte una amenaza en
una planilla de cálculo. La información sigue siendo accionable —el texto dice qué esperar y
qué hacer— pero se lee como un ojeador.

**4. Un defecto de redacción que solo se ve pintado.** Las frases de `madura` y de `brecha`
empezaban las dos con "Y", y juntas en el DOM quedaban "…Y a esta altura… Y llegan con más
idea…". No lo agarra ningún test: lo agarró abrir el informe en el navegador. Vale la pena
seguir mirando la pantalla aunque la batería esté verde.

## 6. Gate

**El gate NO es el % de campeón** — moverlo era el objetivo. Es la forma de la curva:

| | 16avos | 8vos | 4tos | semis | FINAL | salto |
|---|---|---|---|---|---|---|
| piso, n=4000 | 80.7 | 76.9 | 73.0 | 68.6 | **62.1%** | **18.6pp** (era 5.7) |
| techo `--smart`, n=2000 | 88.1 | 84.4 | 82.3 | 74.1 | **69.6%** | **18.5pp** (era 3.1) |

Objetivo declarado al abrir: final ≤~62% en el piso y salto ≥15pp. **Cumplido en las dos
puntas.**

Se reporta (no se gatea): campeón **19.0% piso · 31.4% techo** (eran 28.4 y 44.9). Los
planteles legendarios sobreviven —**NZL 2.2%, CPV 2.4%**— y su curva también escala (NZL
56.6% → 39.3%): la banda "campaña legendaria 0-3%" de CORE §10 se respeta. La franja media es
la que más pagó (MEX 19.3% → 10.1%).

Batería completa (`node tests/run-all.js`) verde. Verificado en el navegador: el informe
pintado en las cinco rondas, sin un solo porcentaje en pantalla y con el tono escalando.

## 7. Puntos abiertos

1. ~~**El trinquete del gate quedó roto, pero el ancla de NIVEL sigue sin decidirse.**~~ Este
   sprint introdujo un ancla de FORMA (la curva) que no se puede derivar sin que se note.
   Pero **CORE §10 sigue declarando "favorito 12-17%" y el arco del Rebalance declaró "techo
   ~42%"**, y hoy el techo mide 31.4%. Son tres números y ninguno manda. **Decisión de PO
   abierta**; §10 quedó marcada con la advertencia.

   > ✅ **DECIDIDO (PO, 1-ago-2026): el ancla es de DOS números — piso ~19% y techo ~30%.**
   > El **~42 pasa a historia** (era medición pre-Escalada, nunca objetivo) y el **12-17 se
   > jubila** como ancla: se fijó con 18 jugables y antes de `--smart`, o sea contra el
   > equivalente del techo de hoy, así que no era comparable — contra el piso la distancia
   > siempre fue chica. De la tabla vieja sobrevive su **reparto entre niveles**, que sí se
   > cumple. Se declaran dos números y no uno justamente por el trinquete: anclar solo el
   > techo fue lo que dejó quince sprints derivando. Mover cualquiera >~2pp pide ok del PO.
2. **La progresión rinde menos porque las runs mueren antes** (filo tope 6.0 → 5.9, DT 12.7 →
   12.4, rasgos 11.5 → 11.2). Es consecuencia esperada, no un bug — pero si el PO quiere que
   la progresión se sienta igual de generosa en un torneo más duro, el dial es `DT_STEP` o la
   escalera `FILO_XP_STEPS`, no la XP por secuencia.

   > ✅ **Medido el 1-ago-2026 y CERRADO como punto abierto.** La Escalada no solo acortó las
   > runs: bajó **la escalera de estrategias entera** ~6-11pp (recuperar 16.0→10.0, entrenar
   > 18.1→10.7, mixto 27.8→18.8, smart 42.2→30.6; el mixto y el smart cuadran con el 19.0/31.4
   > que declara §6, o sea que el banco mide lo mismo). Dos consecuencias, las dos buenas:
   > **(a)** la deuda del recuperador que el arco del Rebalance dejó abierta (16.0 contra la
   > tesis 10-15) **se pagó sola**, sin gastar el sprint que CORE le reservaba; **(b)** el piso
   > quedó plano —recuperar 10.0 ≈ entrenar 10.7, dentro del ruido— y **el PO lo adoptó como
   > ley de diseño** en vez de como deuda: ninguna estrategia de un solo botón debe acercarse a
   > la copa. Ver CORE §10, *La escalera de estrategias y el PISO PLANO*.
   >
   > Se descartó `RECOVER_ENERGY` como dial compensador (barrido 10/15/20/25): es inerte para
   > quien descansa a diario y solo **abarata el error** del que descansa al azar — comprime el
   > premio por jugar bien un 30% y rompe esta CURVA. El dial para el punto 2 sigue siendo
   > `DT_STEP` / `FILO_XP_STEPS`, como decía el párrafo de arriba.
3. **El desgaste acumulado sigue sin existir** (era la idea #3 del diagnóstico). Un roguelike
   se endurece por **depleción de recursos**, no solo por rivales mejores: hoy llegar a la
   final casi no cuesta cuerpo, y la gestión de plantel es casi gratis. Es el siguiente
   sprint natural de este arco y el único que endurecería la fase final **sin tocar ninguna
   probabilidad del partido**.
4. ~~**El rival sigue sin decidir.**~~ La asimetría más grande no son las stats: el DT elige y el
   rival no. Un rival de semis/final que "elija bien" cambiaría la sensación más que cualquier
   multiplicador. Es lo más caro y lo más difícil de calibrar — se dejó para después de ver
   qué daban estos dos cambios.

   > ✅ **RESUELTO por el [sprint del Rival que Decide](ROADMAP-rival.md) (1-ago-2026)**, y con
   > una vuelta de tuerca del PO: el rival **no contra-elige antes del partido** —su idea y su
   > formación son su esencia— sino que **reacciona durante**. Es mejor diseño de lo que este
   > punto proponía, porque una identidad elegida a último momento habría hecho imposible el
   > gate del informe ("si no lo veo venir es un impuesto"): el ojeador tendría que adivinar una
   > decisión que todavía no ocurrió. Lo que decide el rival ahora es su POSTURA (sube el bloque
   > si el partido se le escapa, se atrinchera si administra, se reordena ante una roja), y eso
   > el DT lo ve pasar en la cancha. En el camino se descubrió que la matriz de counters de F2
   > medía **0.0pp de interacción** porque vivía en el canal del pool — ver la advertencia en
   > CORE §4.
