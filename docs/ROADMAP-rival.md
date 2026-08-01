# 🗺️ ROADMAP — El sprint del RIVAL QUE DECIDE

**Fecha:** 1-ago-2026 · **Base:** commit `07e240c` (sprint de la Escalada, batería verde).
**Estado:** ✅ **CERRADO**.

**Objetivo (pedido del PO):** *"hoy elegir identidad da igual contra medio cuadro y el rival
nunca decide nada. Quiero que (a) cada estilo sea FUERTE contra uno, DÉBIL contra otro e
INDIFERENTE con el tercero, y (b) que el rival ELIJA, de modo que cruzarte con uno que juega
a tu debilidad se SIENTA."*

Es el punto abierto #4 de [ROADMAP-escalada](ROADMAP-escalada.md): *"El rival sigue sin
decidir. La asimetría más grande no son las stats: el DT elige y el rival no."*

---

## 1. Baseline fresco (antes de tocar nada)

`node tests/smoke.js --runs=4000 --team=BRA` → campeón **19.2%** · curva 81.5 · 77.5 · 73.6 ·
67.0 · **62.8%**, salto **18.7pp**. `--smart` n=4000 → **30.7%**. Los dos anclajes de CORE §10
(piso ~19% · techo ~30%) donde el sprint de la Escalada los dejó.

## 2. El diagnóstico: la matriz vivía en un canal que no muerde

Banco de plantel fijo, BRA vs GER (85 vs 85, para que el win% tenga recorrido), nivel 10,
grupos, **n=2000 por celda**. Descomponiendo el win% en fila + columna + interacción:

> **El residuo de interacción máximo era 0.65pp contra un error estándar de 1.02pp.**
> La interacción del matchup no rendía poco: **no existía**.

Y no era que la matriz estuviera apagada. Midiendo el share del tipo firma:

| mi filo | tipo | vs press | vs posesion | vs contra | vs bloque |
|---|---|---|---|---|---|
| contra | transición | **27.4%** / 66.4w | 25.9% / 67.2w | **13.5%** / 71.4w | 10.7% / 69.0w |
| press | recuperación | 5.7% / 66.8w | 6.7% / 67.6w | 16.5% / 72.0w | 16.6% / 73.4w |

**El share se movía al doble y el resultado se movía al revés.** Contra ganaba MÁS en la celda
donde le cortaban las transiciones a ×0.6.

Toda la variación de matchup que existía salía de dos canales que la matriz no toca:

1. **`filoShareShift`** (posesión). Su tabla predecía el win% medido casi punto por punto.
2. **La formación del rival.** GER como press tiene atk **4.685**; como bloque, **3.878**. La
   identidad rival le cambiaba el once y con él su poder real.

**Tipo de cambio de cada canal, medido** (n=3000):

| canal | rinde |
|---|---|
| **poder** (`p.forma`) | −0.33 a −0.52pp de win% por 1% |
| **posesión** (`mineShare`) | ~0.75–1.05pp por 0.01 de share |
| **pool** (la MATRIZ) | **0.00pp** |

El proyecto ya lo sabía y estaba escrito en `philosophy.js`: *"la lección de R2 es que los
sesgos de pool miden ~0pp"*. **La matriz de counters estaba construida entera sobre ese canal.**

Corolario: consolidar la identidad de nivel 1 a 10 vale **+0.6pp de win% en el partido**
(69.5 → 70.1). El valor de la progresión está en los rasgos que desbloquea, no en el
×1.35→×2.10.

### La forma de la matriz vieja

7 celdas de 16, **9 cruces vacíos**. Contra era la única fila completa. Y el cruce
Posesión↔Bloque era **LOSE-LOSE**: `posesion|bloque` me castigaba (circulación ×0.65) y
`bloque|posesion` también (repliegue rival ×1.35). La prosa se contradecía a sí misma —
`bloque.fuerte` decía *"invita al rival y lo seca en el bloque"* y tres líneas abajo
`counters.sufre` decía que el que elabora te sitia.

## 3. El campo sobre el que se apoya el ciclo

4.000 brackets con fase de grupos real + `SPREAD_KO`:

| ronda | press | posesión | contra | bloque |
|---|---|---|---|---|
| los 52 | 7.7% | 32.7% | 32.7% | 26.9% |
| 16avos | 9.3% | 38.3% | 33.7% | 18.7% |
| **final** | **14.5%** | **52.0%** | **29.8%** | **3.8%** |

Un ciclo solo es justo sobre un campo uniforme, y este no lo es: **52% Posesión en la final**.
Bajo *Press > Posesión > Bloque > Contra > Press* eso vale ~**2.2pp de campeón** entre el mejor
pick (Press: caza al 52%) y el peor (Bloque: lo caza el 52%) — justo en el límite de ±2pp.

La raíz: **`derivePhilosophy` deriva identidad de RATING** (r≤70 → bloque, r≥78 con 2 MED →
posesión, resto → contra; press nunca se deriva). O sea la identidad ES la fuerza, y la
selectividad KO de la Escalada funciona además como filtro de identidad.

## 4. Las decisiones del PO (1-ago-2026)

| # | Decisión | Elegida |
|---|---|---|
| D1 | El ciclo | **Press > Posesión > Bloque > Contra > Press**, neutros Press↔Bloque y Posesión↔Contra |
| D2 | El canal | **Posesión + pool**: los dientes en `filoShareShift`, el pool como NARRADOR |
| D3 | El rival que decide | **Esencia FIJA** (idea y formación). No contra-elige antes del partido: **reacciona DURANTE** — postura (altura + pelota) cuando el partido se le escapa, y se readapta ante las rojas |
| D4 | El campo | **Derivar la identidad por PERFIL de stats, no por rating** |
| D5 | El instrumento | **Flag nuevo `--counter`**; `--smart` queda intacto y el techo se sigue midiendo con la misma vara |

**Por qué D3 es mejor de lo que se había propuesto.** Con contra-elección pre-partido, el gate
del propio PO —*"que el informe lo anticipe SIEMPRE: si no lo veo venir es un impuesto"*— era
irresoluble: el ojeador tendría que predecir una decisión que todavía no ocurrió. **Con esencia
fija el informe es verdadero por construcción.** Y saca el poder del medio: si el rival elegía,
elegía el counter *y* la forma más fuerte, y no se podría atribuir cuál mordió.

## 5. Lo que se construyó

- **`content/philosophies.COUNTER_CYCLE`** — el array ES el ciclo (`["press","posesion",
  "bloque","contra"]`: cada uno le gana al siguiente). Los neutros caen solos como los que
  quedan a distancia 2, así que no pueden divergir. De ahí salen `PRESA_DE`, `CAZADOR_DE` y
  `counterEdge(mio, suyo) → +1/0/−1`, que es la única primitiva que decide quién le gana a quién.
- **La matriz de pool reescrita como narrador**: las 4 aristas contadas desde las dos sillas
  (8 celdas + el espejo `contra|contra`), con el patrón único *la firma del que gana ×1.35/1.40,
  la del que pierde ×0.72 ≈ 1/1.35*. Se dio vuelta `posesion|bloque` y se borró
  `contra|posesion` (que contradecía el neutro declarado).
- **El diente en `filoShareShift`** (`CICLO_SHARE` = 0.05): de suma cero por construcción
  —`mineShare` es un solo número— así que el ciclo no infla el partido, solo decide de quién es.
- **El candado que faltaba en F2** (`philosophy.test`): la matriz **no puede contradecir al
  ciclo**. Se verifica celda por celda que la firma se mueva en la dirección de `counterEdge`,
  que las 4 aristas estén contadas desde las dos sillas, y que los neutros NO lleven celda.
  Era exactamente el agujero por el que se coló el cruce LOSE-LOSE sin que nadie lo notara.
- **Osciladores re-apuntado**: su presa vieja (el Bloque) dejó de ser una amenaza cuando el
  ciclo dio vuelta esa celda, así que ahora neutraliza al depredador nuevo, el High Press
  (0.72 × 1.39 ≈ 1.00). El concepto no se forzó: cambiar de orientación ES la respuesta clásica
  a un pressing orientado. **La Fortaleza Inexpugnable NO se tocó** — el ciclo mantiene la
  dirección de `bloque|posesion`, así que su neutralización sigue válida. El Anzuelo tampoco.
- **`--counter`** en el smoke: el mismo DT greedy, pero lee la identidad del próximo rival
  (información que el informe ya da gratis) y declara el Plan que la caza. `--counter=huir`
  solo cambia para escapar de un cruce perdido. Y el smoke imprime dos líneas nuevas: con qué
  frecuencia se juega cada tipo de cruce y **el win% de cada uno** — sin eso no se puede
  distinguir "el ciclo no paga" de "el DT no llega a usarlo", que piden diales distintos.
- **EL RIVAL QUE REACCIONA** (`field.oppReaction`): −1 se atrinchera · 0 sigue con su plan ·
  +1 sale a buscarlo. Lo que había era un escalón de ±1 desde el minuto 70 mirando solo el
  marcador; ahora el marcador **pesa progresivamente** con el reloj, el **dominio**
  (`momentumTrend`) adelanta la reacción antes de que el gol llegue —que es literalmente
  *"si el partido se le empieza a escapar"*— y **las rojas mandan sobre todo**: con uno menos
  se mete atrás aunque pierda, con uno más sale aunque gane. Hasta hoy una roja solo restaba
  poder y el rival no se reordenaba nunca.
  Se expresa en la **altura del bloque** y no en un canal nuevo por dos razones: la altura ya
  arrastra territorio Y pelota (`heightShareShift` descuenta 0.02 por escalón rival, o sea que
  subir el bloque YA es salir a buscarla), y es lo único **visible** — el informe anuncia la
  altura de esencia antes del partido, así que cuando el bloque se mueve el DT lo reconoce.
- **EL CRUCE, EN EL INFORME** (`scouting.filosofia.cruce` + la card del hub): el gate del PO
  era *"que el informe lo anticipe SIEMPRE"*, y con 4.9pp de win% por partido en juego callarlo
  habría sido exactamente el impuesto que prohibió. Tres estados con semáforo propio
  (✅/⚖️/⚠️ — paleta distinta a la del Modo Mundial a propósito: aquella escala con la ronda y
  siempre es amenaza, esta puede ser buena noticia), cualitativo y **sin un solo número**, como
  declara la cabecera del módulo. El texto del cruce malo nombra la salida: cambiar el plan
  cuesta un día. Verificado pintado en Chrome, los tres estados.

## 6. La calibración del instrumento (n=4000, BRA)

Antes de tocar el diseño, `--counter` tenía que medir lo mismo que `--smart`:

| antes del sprint | campeón | filo tope | DT | rasgos | Master |
|---|---|---|---|---|---|
| `--smart` | **30.7%** | 7.7 | 14.8 | 13.6 | **3.9%** |
| `--smart --counter` | **30.4%** | 6.9 | 14.2 | 13.0 | **1.3%** |

**−0.3pp con SE de 0.72pp: cero**, como predecía la interacción-cero del banco. Y de paso quedó
medido el **precio** de contra-elegir, que el sistema ya cobraba solo: el Master cae a un tercio
y la filosofía tope pierde 0.8 niveles, porque cambiar de plan reparte la XP entre varias ideas
en vez de consolidar una. **El sprint no tuvo que inventar el trade-off: ya estaba.**

## 7. D4 no se pudo hacer por derivación — se hizo por curación

La decisión D4 era *"derivar la identidad por perfil de stats, no por rating"*. Se implementó y
se midió: **la final pasó de 52.0% a 52.3% de Posesión. Nada.**

La causa es estructural y vale como ley: **los curados son los 16 de más rating, o sea LOS QUE
LLEGAN AL FINAL DEL CUADRO.** Cualquier derivación trabaja sobre los otros 36, que son
justamente los que la selectividad KO de la Escalada va eliminando. Se revirtió la derivación
—dejar código que no cumple su objetivo es peor que no tenerlo— y se atacó donde sí llega.

El reparto curado pasó de **7·4·4·1** a **5·4·4·4** con cinco cambios, cada uno defendible por
fútbol antes que por balance (ENG→press por Tuchel · CRO→bloque por la edad de Modrić ·
MAR→bloque porque su propia justificación decía "el bloque-contra del 2022" · KOR→contra ·
ITA entra curado como bloque, el arquetipo). Medido:

| en la final | press | posesión | contra | bloque | spread mejor−peor pick |
|---|---|---|---|---|---|
| antes | 14.5% | **52.0%** | 29.8% | **3.8%** | ±22.2pp ≈ 2.2pp de campeón |
| después | 16.8% | 40.6% | 30.3% | 12.3% | **±10.3pp ≈ 1.1pp** |

Y `philosophy.test` fija que ninguna identidad pueda volver a duplicar a otra en la curación.

## 8. Gate del sprint (n=4000)

| | pre-sprint | post-sprint |
|---|---|---|
| piso BRA | 19.2% | **19.1%** (media de 3) |
| techo `--smart` | 30.7% | **31.3%** |
| techo `--counter` | 30.4% | **33.8%** |
| curva final (piso) | 62.8% | **62.1%** (media de 3) |
| salto (piso) | 18.7pp | **18.8pp** (media de 3) |

La curva salió en el BORDE en la segunda corrida (final 64.4%, salto 16.8pp) y el protocolo
pidió una tercera. Las tres: final **62.0 · 64.4 · 59.8** y salto **19.1 · 16.8 · 20.4**. El
objetivo declarado por la Escalada —final ≤~62% y salto ≥15pp— se cumple en la media y el salto
en las tres. **Vale como recordatorio de método: el win% de la final se calcula sobre los ~1.200
que llegan, no sobre los 4.000, así que su error estándar es ~1.4pp y una sola corrida no alcanza
para declarar una regresión.**

**El diente, medido en runs reales** (piso): gano el cruce **74.4%** · neutro **73.0%** · pierdo
**71.2%**. Y los cruces con elección al azar salen **24.9 / 50.1 / 25.0**: suma cero exacta, que
es por qué el piso no se movió.

Verificado en un **segundo equipo** (MAR, que este sprint convirtió en Bloque): campeón 19.4%,
diente 73.5/72.1/69.4 y cruces 25.0/50.0/25.0 — el ciclo se comporta igual desde otra identidad
y otra banda de rating.

Los dos anclajes de CORE §10 se respetan (piso ~19% · techo ~30%) y **el premio se fue entero al
DT que lee el informe**: `--counter` +3.4pp sobre `--smart`. Antes del sprint ese mismo DT medía
−0.3pp, o sea que pagaba el precio de contra-elegir y no recibía nada.

### Lo que enseñó medir

**1. Un canal puede estar vivo y ser inerte a la vez.** La matriz movía el share ×2 y el
resultado 0.0pp. Ninguna revisión de código lo iba a encontrar: la tabla se leía perfecta. Solo
lo agarró descomponer el win% en fila + columna + interacción, que es una medición que el
proyecto no había hecho nunca. **Antes de diseñar sobre un canal, medir cuánto vale un punto de
ese canal** — la tabla de tipos de cambio de CORE §4 existe para eso.

**2. El instrumento primero, y calibrado contra un cero conocido.** `--counter` se construyó
ANTES de tocar el diseño y midió −0.3pp, exactamente el cero que predecía el banco. Sin ese paso,
el +3.4pp final no se podría distinguir de un instrumento nuevo que mide distinto.

**3. Los datos también son balance.** El ciclo estaba bien construido y aun así no pagaba, porque
el campo sobre el que se apoyaba era 52% de una sola identidad. Se probó primero la palanca
barata (la derivación) y se midió que no llegaba, antes de tocar la curación.

## 9. Puntos abiertos

1. **La fila plana de Contra.** Medida antes del sprint: −3.1pp contra TODOS los rivales, sin que
   ningún cruce lo explique. Es una elección dominada preexistente (Bible §7) y este sprint la
   heredó: el ciclo la arregla *entre* cruces, no el promedio de la fila.
2. **Press sigue sin derivarse** (4 de 52 = 7.7% del campo), por la regla de F2 de que presionar
   90' no se infiere de stats. En la final sube a 16.8% porque 4 de 17 curados son press, pero en
   grupos la presa de Contra es escasa. Si molesta, la palanca es curar más equipos, no derivar.
