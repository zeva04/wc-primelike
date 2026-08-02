# ⚙️ CORE — Cómo funciona el juego y sus matemáticas

Este documento explica **cómo piensa el motor**: de dónde salen los números, cómo se
convierte una stat en una probabilidad de gol y por qué el balance queda donde queda.
Es la referencia para discutir diseño y ajustar la dificultad. Para saber qué hace cada
función una por una, ver [FUNCIONES.md](FUNCIONES.md).

El motor vive en **módulos por sistema** (`js/core·data·game·content`, ver
[ARQUITECTURA.md](ARQUITECTURA.md)) y es **lógica pura sin DOM**: recibe datos, devuelve
resultados y estados. Eso permite simular miles de partidas sin navegador
(`tests/smoke.js`) y garantiza que la interfaz nunca "inventa" reglas: cada pantalla de
`js/ui/screens/` importa directamente el sistema que necesita.

---

## 1. Las stats: escala 1–99

Cada jugador tiene **7 stats en escala 1–99** (estilo EA FC). Hay dos juegos según el rol:

| | Jugador de campo | Arquero (POR) |
|---|---|---|
| Ofensiva | **tiro**, **cabezazo** | — |
| Creación | **pase corto**, **pase largo** | **pase corto**, **pase largo** (juego con los pies y saque) |
| Físico | **velocidad** | **velocidad** |
| Defensa | **defensa** | **atajadas**, **reflejos**, **salidas** |
| Intangible | **aura** | **aura** |

**LA ODISEA (sprint 1, 29-jul-2026).** Nacieron con la remodelación pedida por el PO: el
viejo `pase` se partió en **corto** (circulación, el toque que sostiene la posesión) y
**largo** (el envío que rompe líneas y el pelotazo), y entró la **velocidad** como
dimensión propia. Los 230 jugadores de las 23 selecciones jugables se recargaron con datos
reales —velocidad desde las páginas oficiales de EA SPORTS FC 26 (columna PAC), el reparto
corto/largo por perfil futbolístico— y el resto de sus stats se recalculó para que **la
media de cada jugador no cambiara** (ver §2).

**Aura** es la stat temática del juego: mezcla carisma, liderazgo y "sangre fría".
Pesa en los penales, en las jugadas individuales y en la solidez general del equipo.

> **Por qué 1–99 y no 1–5.** La escala original 1–5 comprimía demasiado: era imposible
> distinguir a España de Croacia. Con 1–99 la diferencia entre un 92 y un 82 se siente en
> la cancha. Las estrellas siguen existiendo, pero solo como decoración visual (§3).

---

## 2. La nota del jugador (`playerOverall`)

La nota 1–99 de un jugador **no es el promedio simple** de sus 5 stats: es un promedio
**ponderado por posición**. A un delantero le pesa el tiro; a un arquero, las atajadas.

```
nota = Σ (stat_k × peso_k)     // redondeado
```

Pesos por posición (`OVR_WEIGHTS`) — **reescritos por la Odisea**:

| Posición | Pesos |
|---|---|
| **POR** | atajadas 0.40 · reflejos 0.25 · salidas 0.10 · pase corto 0.05 · pase largo 0.05 · velocidad 0.05 · aura 0.10 |
| **DEF** | defensa 0.45 · cabezazo 0.18 · velocidad 0.12 · pase corto 0.09 · pase largo 0.06 · aura 0.10 |
| **MED** | pase corto 0.26 · velocidad 0.18 · tiro 0.18 · pase largo 0.14 · defensa 0.14 · aura 0.10 |
| **DEL** | tiro 0.45 · velocidad 0.22 · cabezazo 0.13 · pase corto 0.06 · pase largo 0.04 · aura 0.10 |

**Las dos decisiones del PO detrás de estos pesos.** (1) El **aura pesa 10% parejo** en los
cuatro puestos: antes valía 25% en MED/DEL y era la stat que más media compraba. (2) La
**velocidad entra como protagonista** (22% en un delantero): un extremo rápido y un central
lento se separan de verdad.

**Cómo se preservó la media.** Bajar el aura y meter velocidad cambia la nota de todos, así
que por cada jugador se resolvió la ecuación al revés: fijados velocidad (dato investigado)
y el reparto corto/largo, **el resto de sus stats se movió lo justo para que su media
quedara idéntica**, con tope de ±4 (±6 en los que no cerraban) y repartido en proporción al
peso del puesto. Resultado: **225 de 230 jugadores conservan su media exacta**. Lo que se
mueve es el retrato: un líder lento con aura alta necesita ser mejor en todo lo demás para
seguir valiendo lo mismo, y un extremo veloz de aura baja ya no la necesita.

> **Los 5 que no cerraron** (colisión estructural, no error): con la velocidad pesando 18-22%,
> un jugador muy lento no puede sostener su media aunque el resto se vaya al tope.
> Casemiro 82→**78** (velocidad 40), Chris Wood 77→76, Harry Kane 87→86, James Rodríguez
> 82→81, Dailon Livramento 64→65. Diales si el PO los quiere intactos: subirles la velocidad
> o bajar su peso en `OVR_WEIGHTS` (y recalcular los 230).

**La costura, CERRADA (29-jul-2026).** Ya no existe "un número de pase": `PASE_MIX` murió y
cada sitio del motor declara cuál de los dos mide y por qué.

| Mide `pase_corto` | Mide `pase_largo` |
|---|---|
| circulación (`actPass` simple) | pase **filtrado**, el que rompe líneas (`actPass hard`) |
| **atk del MEDIO** (`teamPowers`): atacar desde el medio es sostener y hacer circular | centro **alto** al área (`actCross`) |
| **precisión del panel** (`stats.passRate`): la inmensa mayoría de los ~500 pases de un partido son cortos | el pelotazo |
| **perfil del rival** (`sequences.rivalProfile`): "querer la pelota" es saber tocarla — el que vive del pase largo es justo el que NO la quiere | pase atrás rasante → NO (ese es corto: es un toque) |

La capacidad de **lanzar en largo** del rival deliberadamente NO entra al perfil: sería una
dimensión nueva, y la lección de `prof.vel` —un dial calculado que nadie leía durante todo
un sprint— es que no se agrega un número sin un consumidor.

Medido al cerrar: BRA `--smart --focus` **47.9%** (n=2000) contra 47.3% de baseline, MAR
**44.1%** (n=1500) contra 41.8%. El cambio no movió el balance.

> **Por qué ponderar.** Con un promedio plano, Haaland (defensa 40) daría una nota
> mediocre pese a tener tiro 97. La ponderación hace que cada jugador se mida por lo que
> importa en su puesto — Haaland queda ~93, como debe ser.

**Rating del equipo** (`teamRating`): promedio de las notas de sus **5 mejores jugadores**
(el once ideal). Así un plantel con banca floja no se ve penalizado de más.

---

## 2b. Jugar fuera de puesto (`outOfPosPenalty`)

El DT puede parar a cualquiera en cualquier puesto de campo. Si no es el suyo, **duele dos
veces** — y esa doble caída es intencional:

1. **Se lo mide con los pesos del puesto nuevo** (§2). A Vinícius de defensa le pesa la
   defensa (0.50), que es justo su peor stat: cae de 88 a 57 sin ninguna regla extra.
2. **Encima se le castigan las stats**, proporcional a la distancia del puesto.

**La línea del fútbol** — la distancia es el número de pasos entre dos puestos:

```
POR ── DEF ── MED ── DEL
        └─ DEF→MED = 1 · MED→DEL = 1 · DEF→DEL = 2
```

```
castigo_por_stat = 6 × distancia        // escala 1–99, piso en 1
```

- **6 por paso** (`OUT_OF_POS_STEP`) = castigo "suave", decisión del PO (15-jul-2026):
  improvisar se nota pero un crack fuera de puesto sigue siendo una opción defendible.
- **El aura NO se castiga**: es carisma y sangre fría, no depende de dónde lo paren.
- El castigo entra al partido por `effectiveStat`, del que parte `effStat` (§4) — la ficha
  del DT y la cancha leen exactamente el mismo número.

| Vinícius (DEL 88) juega de… | Distancia | Castigo | Nota |
|---|---|---|---|
| DEL (su puesto) | 0 | — | **88** |
| MED | 1 | −6 | **77** |
| DEF | 2 | −12 | **47** |

> **El arco es exclusivo de los arqueros** (y ellos no salen de él). No es una regla de
> balance sino del modelo de datos: los dos juegos de stats son **disjuntos** (§1). Un
> delantero no tiene `atajadas` ni un arquero tiene `defensa`, así que cruzarlos no sería
> un castigo sino una división por la nada. Lo impone `lineup.canPlayAt`.

> **Ojo al ordenar el plantel**: `playerOverall` es la nota de HOY (donde esté parado y
> con su Momento, §2c), y `naturalOverall` la de su puesto SIN el Momento — talento, no
> circunstancia. `autoLineup` debe usar la segunda: con la primera, al crack que venías
> usando fuera de puesto lo compara castigado contra suplentes intactos y lo manda al
> banco (y además el once automático perseguiría al que está en racha).

---

## 2c. El Momento del jugador (`game/momentum.js`)

La mitad **dinámica** de la progresión (Bible cap. 6): una stat temporal **1..7 por
jugador** (nace en 4 = neutro) que refleja su forma actual. En la UI se lee **cualitativo,
no numérico** (decisión PO 18-jul): los 7 niveles son Paupérrimo · Apagado · Malo · Normal ·
Bueno · Encendido · Inspirado (`MOMENTO_LABELS`, en la ficha). Sobre la ficha en cancha lo
marca un icono por nivel — el color codifica la distancia al neutro (amarillo = 1 paso,
verde = 2) y abajo amarillo (3) → celeste (2); la forma da la dirección: **7 🔥 · 6 ▲verde ·
5 ▲amarillo · 4 nada · 3 ▼amarillo · 2 ▼celeste · 1 ❄️**.

**Efecto mecánico** (decisión PO 17-jul-2026):

```
pct = clamp((momento − 4) × 2, −3, +3)      // % sobre TODAS las stats (aura incluida)
stat_final = round(stat_castigada × (1 + pct/100))
```

- **±2% por paso, tope ±3%**: los niveles 1 y 7 rinden casi igual que 2 y 6 — son estados
  narrativos más profundos, no más poder. El tope bajó de 4 a 3 en el **Sprint 4**, como
  contrapeso de que el titular dejó de decaer (ver el bloque de balance más abajo).
- Entra por `ratings.statAt`, la fuente única: la ficha, la cancha y el partido ven el
  mismo número. Un jugador SIN el campo `momento` (todos los rivales) multiplica por 1:
  **la asimetría vive en los datos, no en caminos de código separados**.
- **Excepciones (recortes de balance, medidos el 17-jul-2026)**: la definición de
  **penales y tandas** va sin el %, y `naturalOverall` (el orden de `autoLineup`) lo
  ignora. Con el efecto pleno BRA derivaba **+5.0pp** de campeón; con la banda 3..5 de
  abajo quedó en +2.1pp; con estos dos recortes, **+1.4pp residual** (n=8000 vs HEAD
  n=4000) — dentro del gate de ±2pp. Precedente FEAT-003: si vuelve a derivar, se
  recorta más (el siguiente dial es el % por paso), no se relaja el gate.

**Cómo se mueve** (en `postMatchUpdate`, jugador por jugador; la suma **sube hasta +1 y
baja hasta −2** por partido, `MOMENTO_RISE_MAX`/`MOMENTO_FALL_MAX`). El Momento es
**individual**: el resultado del equipo **NO** lo mueve (decisión PO 18-jul — eso va a la
**Moral**, §9).

| Señal (individual) | Efecto |
|---|---|
| Gol propio | +1 por gol (máx +2) |
| **Asistencia** (gol de jugada con pase) | **+1 por asistencia** — la vía de los **MED** (Sprint 1) |
| **Corte de último hombre** (barrerse/anticipar exitoso) | **+1** — la vía de los **DEF** (Sprint 1) |
| Penal fallado (juego o tanda) | −1 por fallo |
| **Tarjeta o penal como último hombre** | **−1** — el error del central cuesta forma |
| Arquero: valla invicta / 3+ goles / penal atajado | +1 / −1 / +1 |
| **Lesión** que lo deja de baja | **vuelve al neutro (4)**: la lesión corta la forma |
| Jugó sin señal individual | **no se mueve**: jugar ya alimenta la forma (Sprint 4) |
| **No sumó minutos** | **decae 1 paso hacia el neutro (4)**: la forma se enfría en el banco |

**Sprint 1 — Momento para todo el plantel** (decisión PO 20-jul): antes solo los goleadores y
el arquero movían el Momento, así que DEF y MED vivían en *Normal*. Ahora las **asistencias**
(atribuidas al convertir un gol de jugada con pase, §Asistidores) llegan a los MED, y los
**cortes de último hombre** (§Match — decisión del central) a los DEF. El tope +1/partido acota
la **suma** de señales: gol + asistencia + corte no dan más de +1. Balance: sumar fuentes de
Momento + la ventaja defensiva del último hombre es poder asimétrico → se calibró la eficacia
del último hombre para que, jugado al azar, quede **neutro en goles** (BRA 28.6% n=4000, =
baseline; el residual real lo pone el humano que decide bien). Dial pactado si deriva al alza:
`MOMENTO_PCT_STEP`; si el problema es el último hombre, su frecuencia/eficacia (no el gate).

**Subir cuesta más que caer** (decisión PO 18-jul): aunque un jugador haga méritos de
sobra (doblete → +2 en crudo), su Momento **sube como mucho +1 por partido**; una mala
actuación sí puede restarle hasta −2. Como el resultado ya no sostiene la forma, **mantener
6-7 exige rendir partido a partido**: el que no marca/ataja decae hacia el neutro. El
efecto sigue siendo asimétrico (los rivales no tienen Momento) pero mucho más contenido que
antes — quitarle el empuje del resultado bajó el % de campeón (BRA 32.2→31.0% n=4000, dentro
del gate). El post-partido devuelve el **resumen por jugador** (`{before, after, delta,
reasons}`) para el "Análisis del cuerpo técnico".

El cierre de cada partido devuelve el **resumen anímico por jugador** (`{before, after,
delta, reasons}`) que alimenta el **"Análisis del cuerpo técnico"** del post-partido: quién
subió o bajó y por qué (goles, penales, valla o enfriamiento por no jugar) — el motor,
dueño de la regla, también narra el motivo.

### Sprint 4 — el titular ya no decae (decisión PO 21-jul-2026)

Hasta el Sprint 3, **todo** el plantel decaía un paso hacia el neutro tras cada partido si no
tenía señal individual. Dos problemas: (a) el que jugaba 90' sin marcar era castigado igual que
el que miró desde el banco, y (b) el análisis del post-partido escupía una fila por jugador
—casi todo el plantel— y enterraba los movimientos que sí importaban. **Regla nueva: solo decae
quien NO sumó minutos** (el sustituido cuenta como que jugó). Mantener la forma alta pasa a
exigir **jugar**, y rotar tiene ahora un costo anímico además del deportivo.

**Balance (la lección del sprint).** Ese solo cambio valía **+3.0pp** de campeón para BRA
(n=4000): sin decaimiento, la forma alta deja de enfriarse y el plantel se estaciona arriba —
poder asimétrico puro, los rivales no tienen Momento. Se aplicó el precedente FEAT-003: se
recorta el efecto, no el gate. **Dial usado: `MOMENTO_PCT_CAP` 4 → 3**, elegido en vez del
`MOMENTO_PCT_STEP` porque el tope castiga justo la parte que se infló (los niveles 6-7) y deja
intacta la sensación de los niveles intermedios. Resultado del sprint completo: **28.9% n=4000
vs 27.3% de baseline = +1.6pp**, dentro del gate ±2pp (mismo orden que el residual aceptado del
canje de entrenamiento).

---

## 3. Estrellas (`starsFromRating`)

Las estrellas son **solo visuales**. Se derivan del rating con una curva "futbolera"
que reserva las 5★ para las potencias reales:

| Rating | ⭐ |
|---|---|
| 85+ | ★★★★★ |
| 82–84 | ★★★★½ |
| 79–81 | ★★★★ |
| 76–78 | ★★★½ |
| 73–75 | ★★★ |
| 70–72 | ★★½ |
| 67–69 | ★★ |
| 64–66 | ★½ |
| 61–63 | ★ |
| <61 | ½ |

> **Por qué una curva y no rating÷20.** Dividir por 20 daba 4.5★ a España (92). La curva
> actual concentra el tope: solo los verdaderamente grandes (Argentina, Brasil, Francia,
> España…) llegan a 5★, y hay media estrella en todo el rango.

---

## 4. La stat efectiva en partido (`effStat`)

Dentro de un partido las stats 1–99 se **normalizan a una escala ~0–5** para las fórmulas
de probabilidad, y se les aplica el desgaste físico:

```
effStat = (stat + buff) / 20  ×  energyMult(energía)  ×  oxidMult(racha)  ×  forma
energyMult = 1                                  si energía ≥ 65   (la banda verde)
           = 1 − 0.25 × ((65−energía)/60)²      bajo el umbral    (convexa hasta ×0.75)
oxidMult   = 1                                  si racha < 3      (días sin entrenar)
           = 1 − 0.18 × ((racha−2)/3)²          racha 3-5         (convexa hasta ×0.82)
forma      = 1 + 0.03 × ronda_KO                SOLO el once rival (modo Mundial: ×1.03…×1.15)
```

- **÷20** lleva 1–99 al rango ~0–5 donde están calibradas todas las fórmulas.
- **buff**: bonus temporal (entrenamiento, evento) en la misma escala 1–99.
- **factor energía = la BANDA VERDE** (arco del Meta M1, 22-jul-2026): con energía ≥ **65**
  (`ENERGY_OK`) el multiplicador es **×1.0** — un plantel al 75% juega exactamente como al
  100%. Bajo el umbral cae **convexo** (cuadrático) hasta **×0.75** en el piso (energía 5):
  rozar la banda es casi gratis (60 → ×0.998), estar fundido de verdad duele (30 → ×0.91).
  Nunca cae a cero — un crack cansado sigue siendo peligroso. El verde de la UI de energía
  ES la banda (`components.energyCls`, misma constante).
- **factor oxidación = el ESPEJO de la banda** (arco del Rebalance R1, 22-jul-2026): una
  racha de **3+ días de preparación sin Entrenar ni Sesión Táctica** enciende un
  multiplicador convexo que cae hasta **×0.82** en racha 5+ (nació ×0.85 en R1; R2 lo
  profundizó — es la palanca quirúrgica del recuperador, ver el blockquote de R2).
  **Jugar también resetea** ("jugar es ritmo", decisión PO), así que la curva entera vive
  comprimida en racha 3→5: la ventana de preparación es de 4-5 días y la oxidación no es
  un estado crónico — es **cómo llegas al partido** (racha 3 ×0.98 · 4 ×0.92 · 5+ ×0.82).
  También resetea el cambio de identidad (reinstalar ideas es trabajo táctico); Bonding y
  Oportunidades NO. La racha vive en `run.diasSinEntrenar` (`game/oxidation`) y se
  estampa como `p.oxid` en el plantel — entra a effStat por el mismo caño que la energía,
  y el rival, que nunca lleva el campo, queda en ×1. Piso combinado banda×óxido:
  **×0.615**, fijado en unitario (`tests/oxidation.test.js`). En la UI el color ES la
  mecánica (`components.oxidCls`): gris bajo umbral · ámbar racha 3-4 · rojo 5+.
- **factor forma = el MODO MUNDIAL del rival** (arco del Rebalance R2, 22-jul-2026; curva
  rehecha en el sprint de la Escalada, 31-jul-2026): en eliminatorias el once rival llega
  más encendido con cada ronda, por una curva **CONVEXA** declarada en `opponents.TOURNEY_FORM`
  — 16avos ×1.03 · 8vos ×1.10 · 4tos ×1.19 · semis ×1.31 · **final ×1.45**. Nació lineal
  (+3%/ronda, final ×1.15) y perdía la carrera contra el jugador: ver §La Escalada.
  Se estampa como `p.forma` al generar su alineación — la
  asimetría espejo de `p.oxid`: solo el rival la lleva, y solo en MIS partidos (el mundo
  simulado no cambia). El perfil rival (`sequences.rivalProfile`) lee stats BASE a
  propósito: la escalada no cambia QUÉ fútbol te genera, cambia lo bien que lo ejecuta.
  Se narra: el informe del rival y la previa del Daily anuncian el modo Mundial.
  Sobre `p.forma` se apilan además (R2/R3): la identidad rival que MADURA (+1 nivel desde
  16avos, tope Consolidada — `philosophy.FILO_MADURA_DESDE`; nació "desde cuartos" y R3 la
  adelantó) y la **BRECHA DE IDENTIDAD** (`philosophy.identityGapMult`): si mi nivel de
  identidad < el del rival madurado, su modo Mundial suma **+4% por nivel de brecha**
  (`IDENTITY_GAP_PCT`; brecha 2 → +8%) — improvisar se paga; consolidar la identidad antes
  de KO es la vacuna. Y desde el **29-jul-2026** la moneda tiene su otra cara: **AL FAVORITO
  LE JUEGAN LA FINAL** (`IDENTITY_LEAD_PCT` = **+16% por nivel de ventaja**) — al que llega
  con la idea armada le sale enfrente el mejor partido del torneo rival. Nadie le juega de
  igual a igual al que ya tiene todo resuelto. Ninguna existe en grupos, y el partido parejo
  es el único sin condimento (×1).

  **Las dos mitades usan escalas distintas, a propósito.** El castigo se mide en ETAPAS
  (0-2, la escala del rival); la ventaja, en NIVELES (0-9, la escala fina de la Progresión),
  contra el primer nivel de la etapa rival (`NIVEL_DE_ETAPA`, derivado de `FILO_LEVELS`).
  Por qué: Consolidada exige nivel 10 y el DT óptimo promedia ~7.9, así que **en etapas está
  empatado con medio mundo** y la ventaja no se encendería nunca (medido: +10%/etapa movió
  el techo −0.4pp). En niveles, 7.9 contra 5.7 sí se distingue — y es justo lo que separa al
  que invierte del que improvisa. De paso: la "inmunidad por construcción" del DT Consolidado
  que R3 daba por sentada **ya no existe** desde el arco de Progresión, porque llegar a
  Consolidada dejó de ser rutinario.

### La Escalada: por qué el torneo no se endurecía (31-jul-2026)

**La métrica que faltaba: la CURVA CONDICIONAL.** No "cuántas runs terminan campeonas" sino
**de los que LLEGAN a cada ronda, cuántos la ganan**. El % de campeón cae de 100 a ~28 solo
porque hay que ganar cinco veces seguidas, y eso da la ilusión de dificultad creciente donde
no la hay. Medido antes del sprint, con decisiones al azar: 81.4 · 79.3 · 77.1 · 76.4 ·
**75.7** — la final se ganaba casi tan seguido como los 16avos. Jugando bien era peor todavía
(87.5 → **84.4**, un salto de 3.1pp). El smoke la imprime ahora en cada corrida.

**El diagnóstico.** La escalada aislada SÍ mordía: en el banco de plantel fijo, subir solo
`koRound` de 0 a 5 costaba **−10.9pp** de win% (79.2 → 68.3). Pero en runs reales la caída
observada era de 5.7pp. **La progresión del DT se comía la mitad de la escalada — y más
cuanto mejor jugaba.** El motivo es estructural: `tourneyFormaMult` era **lineal y ciega**
(+3%/ronda, fija), y la progresión del jugador es **compuesta** (nivel de filosofía × rasgos
× canje permanente × DT × Momento). Una compuesta le gana siempre a una lineal.

**Los dos cambios (decisión PO).**

1. **Curva CONVEXA hasta ×1.45** (`opponents.TOURNEY_FORM = [0, .03, .10, .19, .31, .45]`,
   generada por `0.45·(ronda/5)^1.7` y declarada entera porque cada escalón es un número de
   balance que hay que poder mover de a uno). Los 16avos quedan exactamente donde estaban
   (×1.03): el salto se concentra donde el jugador ya es fuerte. `tests/escalada.test` fija
   la FORMA, no los valores — un escalón plano en el medio devuelve el problema original.
2. **El mundo simulado selecciona, pero solo en KO** (`sim.SPREAD_KO` 0.85 vs
   `SPREAD_GROUPS` 0.55). Antes el rating pesaba igual en todo el torneo y el mundo apenas
   filtraba: el rating medio del finalista subía de 76.1 a 80.3 en cinco rondas y **el 6% de
   las finales se jugaban contra un rival ≤69**. Ahora la final es contra élite el **87%** de
   las veces y contra un flojo el **2%**. Los grupos conservan su caos a propósito: la
   cenicienta y el batacazo son el combustible del World Cup Daily, y es la única fase donde
   una sorpresa no le arruina el bracket a nadie. La prórroga y la tanda tampoco escalan —
   si el grande llegó empatado hasta ahí ya falló, y una tanda es una moneda.

**Por qué esto es mejor que subir el multiplicador a secas:** la mitad del cambio es
**visible**. Llegar a la final y encontrarse a Bélgica comunica dificultad en el escudo del
rival, no en un número escondido dentro de `p.forma`.

**Y el Modo Mundial pasó a decirse en PALABRAS.** El informe mostraba "🔥 llega un +18%
encendido" — el único porcentaje de `game/scouting`, que declara en su cabecera ser
CUALITATIVO. Con la curva nueva ese número habría llegado a +45%, que convierte una amenaza
en una planilla. Cada ronda tiene ahora su voz ("Se acabaron los ensayos" → "Es LA FINAL")
y la card sube de temperatura visual con la ronda. `tests/escalada.test` prohíbe que vuelva
a salir cualquier magnitud numérica por esa puerta.

**Gate (n=4000 piso / n=2000 techo).** El gate del arco **NO es el % de campeón** —moverlo
era el objetivo— sino la forma de la curva:

| | 16avos | 8vos | 4tos | semis | FINAL | salto |
|---|---|---|---|---|---|---|
| piso (azar) | 80.7 | 76.9 | 73.0 | 68.6 | **62.1%** | **18.6pp** (era 5.7) |
| techo (`--smart`) | 88.1 | 84.4 | 82.3 | 74.1 | **69.6%** | **18.5pp** (era 3.1) |

Campeón, que ahora se **reporta** y no se gatea: **19.0% piso · 31.4% techo** (eran 28.4 y
44.9). Los planteles legendarios sobreviven — NZL 2.2%, CPV 2.4% — y su curva también
escala: la banda "campaña legendaria 0-3%" de §10 se respeta. La franja media es la que más
pagó (MEX 19.3% → 10.1%), que es lo correcto: era la que menos merecía la copa.

> **Esto rompe el trinquete del gate.** Todos los sprints anteriores se gatearon contra "±2pp
> del sprint anterior", sin ancla absoluta: quince sprints de +1.3pp cada uno son +20pp y
> ningún gate se enciende nunca. Por eso §10 declaraba "favorito 12-17%" mientras el juego
> medía 44.9%. La curva condicional es un ancla de FORMA, no de nivel, y no se puede
> derivar sin que se note.

> **Rebalance del 20-jul-2026 (decisión PO).** El factor de energía pesaba **35%**
> (`0.65 + 0.35`) y bajó a **20%**, acoplado a subir el cansancio del partido de −10 a
> **−14 cada 30'** (`medical.FATIGUE_PER_30`). Los dos cambios van JUNTOS y se compensan:
> el partido vacía más rápido (rotar sigue importando, incluso más) pero estar cansado ya
> no te deja inservible. Motivo: con la energía al 35% era la palanca dominante del juego y
> **Entrenar era una opción muerta** — costaba −5 de energía a los 10 jugadores para ganar
> +1 en una stat, un cambio pésimo. Efecto medido (BRA n=1500, estrategias fijas): Entrenar
> pasó de **12.0% → 21.5%** de campeón (de −16.9pp a −6.4pp respecto del juego mixto), sin
> mover la dificultad (BRA 27.3% n=4000 vs 28.9% de baseline) ni derivar el resto de las
> selecciones (**−0.36pp de media sobre las 20 jugables**). Residual conocido: "siempre
> Recuperar" sigue siendo la estrategia más fuerte (+13.2pp) — descansar cuando estás
> cansado ES lo correcto, así que se acepta; lo que se eliminó fue la opción que NUNCA
> convenía, que es lo que prohíbe el Bible.

> **La banda verde (arco del Meta M1, 22-jul-2026, decisión PO).** El residual anterior
> ("siempre Recuperar" +13.2pp) resultó ser estructural: con la energía como poder LINEAL,
> Recuperar era comprar rendimiento universal a diario (46-47% vs mixto 30.8, BRA n=4000).
> La tesis del arco — *Recuperar no es estrategia: es el seguro para que estar fundido no
> penalice; lo importante es que el equipo MEJORE* — se implementó como la banda: sobre 65
> plano, bajo 65 convexo. La forma se midió en etapas: lineal con umbral 70 dejó el gap en
> ~12pp (la masa de titulares del juego mixto vive en 55-68, y ese castigo "chico" compone
> 6 jugadores × 7 partidos × ~30 secuencias); la convexa lo bajó a **~6.5pp** (mixto
> 39.3/40.8, recuperar 45.5/47.7, dos corridas n=4000). El gate formal del sprint
> (recuperar ≤ mixto+3pp) quedó **NO cumplido y aceptado** (decisión PO): el espíritu sí se
> cumplió — el DT greedy del smoke (`--smart`) le gana a siempre-Recuperar en ambas
> corridas (49.5/49.1) y hasta siempre-Táctica lo empata (43.7). El resto del gap es el
> lastre del azar (el pool tiene 3 filas de Entrenar, estrategia de 25.3%), no la energía.
> Deuda declarada: el spread BRA−CPV se abrió de ~25.0 a ~30.8 (los favoritos liberan más
> poder al salir de la penalización) — se trata con la dificultad global al cerrar el arco.
> También se probó y REVIRTIÓ subir la pasiva 8→9: no discrimina (cerró ~0.4pp/punto e
> infló todo). El Press mantuvo su costo relativo exacto (−0.7 vs mixto, igual que
> pre-arco): sin re-costeo.

> **La oxidación (arco del Rebalance R1, 22-jul-2026, decisión PO).** La tesis del arco:
> *si puedes ganar sin jugar, el juego no tiene sentido* — y el diagnóstico medido en el
> Meta: el 46% del siempre-recuperador no vivía en el botón de Recuperar (su edge real
> sobre el mixto era ~+6pp post-banda) sino en que **no construir era casi gratis**. En
> vez de nerfear la acción se hizo letal no trabajar: el espejo de la banda. Umbral 3,
> curva convexa comprimida a racha 3→5 porque el PO decidió que **el partido resetea**
> (jugar es ritmo) y la racha máxima real ES la ventana (4-5 días de preparación). La
> mecánica es quirúrgica por diseño y así midió: siempre-Recuperar **46.4 → 22.7** (dos
> corridas n=4000 clavadas en 22.7) mientras el mixto azar apenas paga (41.8 → 40.5/40.2,
> P(racha≥3 al partido) ≈ 0.8%) y `--smart` ni se entera (50.5 → 50.7/49.6): entrenar ~50%
> de los días te hace inmune. El gate original del sprint (~30-35) quedó **re-pactado a
> ~20-25 por el PO** al ver el overshoot: 22.7 ya produce el ORDEN final de la escalera
> (recuperar < entrenar-solo 25.9) y se aceptó a sabiendas de que R2 (escalada de rivales)
> arranca con el peldaño de abajo cerca de su meta final (10-15). El nerf C (Recuperar no
> sube sobre la banda) quedó **DIFERIDO**: "que el descanso se borre" no es realista
> (PO) — se retoma solo si los números de R2 lo piden, con una variante realista.

> **La escalada de rivales (arco del Rebalance R2, 22-jul-2026, decisión PO).** "El
> Mundial de verdad se juega en 5 finales": en KO el rival llega en **modo Mundial** —
> forma de torneo **+3%/ronda** (`p.forma`, ×1.03…×1.15) + identidad que **madura**
> (+1 nivel desde cuartos, tope Consolidada). Medido por etapas (todo el gate 2×n=4000,
> BRA): la forma sola movió la escalera entera −5..−9pp con los grupos INTACTOS (el
> instrumento por ronda del smoke lo confirma: la muerte extra vive en KO); la madurez
> midió ~0pp (condimento narrativo, como se anticipó). Con la escalada, el recuperador
> quedó en 16.6 y **la tesis manda 10-15**: su palanca quirúrgica fue el piso del óxido
> (0.85→**0.82** — solo él la pisa, medido) → **13.3/14.2 ✓ la tesis del arco se
> cumple**. Escalera final R2: recuperar ~13.7 · entrenar ~19.7 · mixto ~32.7 · smart
> ~40.8 · KOR ~28 · CPV ~6.5 · spread BRA−CPV 34→26. La **deuda del Contra** (−1.95 del
> Meta) quedó PAGADA sin palanca dirigida: post-escalada mide 34.4/41.3 (n=2000), sobre
> el mixto — las avanzadas de M2 la habían pagado ya. **Pendiente declarado → R3**: el
> mixto azar (32.7 vs meta ~25) NO se persigue con el dial global — subirlo hundiría a
> smart (clavado en 40) y arriesgaría a CPV (gate ≥3); la brecha azar↔greedy se ensancha
> castigando DECISIONES, y esa palanca nueva es el arco siguiente (decisión PO).

> **La brecha de identidad (arco del Rebalance R3 "Improvisar se paga", 22-jul-2026,
> decisión PO).** El peldaño pendiente de R2 (mixto 32.7, meta ~25) se atacó con la única
> palanca preparación-side que deja a smart intacto: en KO, el rival con más idea que yo
> amplifica su modo Mundial. Medido por etapas: +2%/brecha con madurez desde cuartos →
> −1.3pp (la brecha no existía en 16avos/octavos, donde mueren las runs); madurez
> adelantada a 16avos + dial a +4% → mixto ~29.7. El dial NO converge más abajo: el
> recuperador (nivel 0 SIEMPRE) paga brecha completa mientras el mixto llega a nivel 1 a
> mitad de KO — +8% habría perforado el ≥9 pactado. **Gate R3 re-pactado y CERRADO
> (3×n=4000 en los bordes):** mixto **30.1/29.5/29.6** (~29.7 ∈ 29-31) · recuperar
> 10.8/11.6 ✓ 10-15 · smart 41.4/42.3 ✓ inmune por construcción · entrenar 15.6/14.4
> (~15.0, el borde inferior de 15-20: entrenar stats sin construir idea apenas supera al
> que no hace nada — coherente con la tesis) · CPV 5.7 ≥3 ✓ · filos 27-34 (posesión
> premium, contra sano). La escalera final del arco COMPLETO: **11.3 · 15.0 · 29.7 ·
> 41.9** — del 46% pre-arco a un tercio, con el techo intacto.

> **AL FAVORITO LE JUEGAN LA FINAL (29-jul-2026, decisión PO "ataca los 6pp").** Los arcos
> de Rasgos, Progresión y la Odisea derivaron el TECHO: BRA `--smart` **48.5%** (n=4000)
> contra los 41.9 con que cerró R3, con el piso mixto **28.9** clavado en su 29.7. O sea:
> derivó el premio al que invierte, no la dificultad general.
>
> **Tres diales medidos, dos descartados** (todo BRA, n=4000, techo `--smart` / piso mixto):
>
> | Dial | Techo | Piso | Ratio |
> |---|---|---|---|
> | Afeitar los hooks del árbol −30% (el dial que dejó escrito el arco de Rasgos) | 46.6 (−1.9) | 26.8 (−2.1) | 0.9:1 ❌ |
> | Forma de torneo +3% → +4%/ronda (el dial que R3 midió en 40.6-41.0) | 45.2 (−3.3) | 25.2 (−3.7) | 0.9:1 ❌ |
> | Vara alta por ETAPA, +10% | 48.1 (−0.4) | 27.6 (−1.3) | 0.3:1 ❌ |
> | **Vara alta por NIVEL, +16%** | **42.05** (−6.5) | **27.55** (−1.4) | **4.6:1 ✓** |
>
> **LA LEY QUE SALIÓ DE ACÁ: ningún dial GLOBAL puede bajar el techo.** Los dos primeros
> hunden más el piso que el techo, y no por casualidad — el mismo % de poder rival le
> cuesta más win-rate al que ya venía peor, porque está en la parte empinada de su curva.
> Para mover el techo solo, la palanca tiene que **encenderse porque estoy fuerte**. Es la
> misma lección del "techo estructural del dial" de R3, vista desde el otro lado.
>
> **Escalera al 29-jul-2026** (n=4000, 2 corridas en los dos peldaños de arriba):
> recuperar **16.0** · entrenar **18.1** · mixto **27.8/27.3** · smart **42.2/41.9** ·
> CPV 4.1 ≥3 ✓ · KOR 19.9. Con `--focus`: BRA 47.9 → **41.4**, MAR 44.1 → **35.5**.
> El mixto en ~27.5 **paga la deuda declarada de R3**, cuyo gate original era ~25 y se
> re-pactó a 29-31 solo porque el dial de entonces no llegaba.
>
> ⚠️ **Deuda abierta, NO causada por este dial**: el recuperador está en **16.0** contra la
> tesis del Rebalance (10-15). Medido con la palanca apagada da **17.0** — o sea que la
> derivaron los arcos de Rasgos/Progresión y esta recalibración lo empuja *hacia* la banda,
> no fuera. Cerrarlo es su propio sprint.
>
> ✅ **CERRADA el 1-ago-2026, sin gastar el sprint: la pagó la Escalada.** Re-medida la
> escalera completa sobre el árbol post-Escalada (BRA, n=4000 por peldaño), el recuperador
> cayó de **16.0 a 10.0** — dentro de la banda 10-15 y pegado a su borde inferior. La
> escalera entera bajó ~6-11pp y **los números de arriba quedaron obsoletos**: la vigente
> está en §10. El riesgo se dio vuelta y hay que anotarlo: el peldaño de abajo ya no
> amenaza con salirse por arriba sino **por abajo**, así que cualquier dial futuro que
> endurezca el torneo tiene que verificar de qué lado muerde (la LEY de R4, otra vez).

> Este es el único punto donde se mezcla "escala 1–99" (datos) con "escala 0–5" (fórmulas).
> Todo lo demás del partido razona en 0–5.

---

## 5. Poder del equipo (`teamPowers`)

Cada equipo en cancha se resume en dos números, **ataque** y **defensa** (~0–5):

```
atk = prom(tiro de DEL+MED) × 0.40
    + prom(pase de MED)     × 0.30
    + prom(cabezazo)        × 0.12
    + aura_equipo           × 0.18

def = prom(defensa de DEF)  × 0.52
    + calidadArquero        × 0.32
    + aura_equipo           × 0.16
```

Donde `calidadArquero = atajadas×0.6 + reflejos×0.25 + salidas×0.15`.

Ajustes finales:
- **Mentalidad**: defensiva (−0.5 atk / +0.6 def), normal (0/0), ofensiva (+0.6 atk / −0.5 def).
- **Inferioridad numérica**: por cada jugador expulsado/lesionado sin reemplazo, atk ×(1−0.18) y def ×(1−0.15).

> **Por qué el arquero pesa 32% de la defensa.** Antes el POR entraba al promedio como un
> defensa más y daba casi lo mismo tener a Alisson o a un arquero flojo. Ahora un gran
> arquero sostiene defensas mediocres, como en el fútbol real.

> ### EL DIAL DE FORMACIÓN (bug encontrado y ARREGLADO el 28-jul-2026)
> **El bug.** Cada línea entraba solo **promediada**, así que agregarle un hombre solo podía
> BAJAR su promedio (el que entra es peor, o juega fuera de puesto y cobra
> `outOfPosPenalty`) y quitarlo lo SUBÍA, porque quedaba el mejor solo. Medido entonces
> sobre 6 planteles: el dibujo **más defensivo daba el mayor `def` en 0 de 6** y el **más
> ofensivo el mayor `atk` en 0 de 6** — en 4 de 6 el que más atacaba era el 3-1-1. Los
> `hint` de `FORMATIONS` decían lo contrario de lo que pasaba. No era nuevo
> (`swapAssignments` siempre funcionó así); lo destapó el selector de formación en partido.
>
> **El arreglo: la fuerza de una línea es CALIDAD × BOCAS.** La calidad sigue siendo el
> promedio de siempre, con los mismos pesos; las bocas entran con **rendimiento
> decreciente** (`LINE_POW = 0.5`: el tercer defensa suma, pero menos que el segundo). Y el
> mediocampista cuenta en las dos direcciones — **0.35 hacia adelante** (`MED_ATK_SHARE`) y
> **0.45 hacia atrás** (`MED_DEF_SHARE`)—, porque tres medios tapan de verdad y sin eso los
> tres dibujos de un solo defensa daban exactamente la misma defensa. El término de pase
> escala flojo con el número de medios (`MED_POW = 0.15`): el pase es calidad, no cantidad.
>
> **El 2-1-2 es la REFERENCIA**: con la "Equilibrada" los tres factores valen exactamente 1
> y el poder es idéntico al de la fórmula vieja (fijado en `powers.test.js`). Lo que cambió
> es cómo se desvían los otros cinco, no el nivel general del juego.
>
> Resultado medido sobre 10 planteles (medias):
>
> | | 1-1-3 | 1-2-2 | 1-3-1 | 2-1-2 | 2-2-1 | 3-1-1 |
> |---|---|---|---|---|---|---|
> | **atk** | **4.15** | 4.04 | 3.83 | 3.95 | 3.76 | 3.46 |
> | **def** | 3.60 | 3.84 | 4.05 | 4.02 | 4.20 | **4.24** |
>
> El 1-1-3 es el de más ataque **10/10** y el de menos defensa **10/10**; el 3-1-1 está
> entre los dos que más defienden **10/10** y supera a todo dibujo de un defensa **9/10**;
> **ningún dibujo queda dominado** (peor atk Y peor def que otro), que sería una opción
> trampa. Los diales salieron de barrer 60 combinaciones contra esos cuatro criterios.
>
> Que el **2-2-1 le gane la defensa al 3-1-1 en 4 de 10 planteles no es un error**: sin un
> tercer central de verdad, poner tres atrás sale peor que dos con dos medios tapando.
>
> **Balance: 24.1% n=2000**, sin movimiento (baseline 24.3-24.6). El arreglo salió gratis
> porque el smoke juega con el dibujo automático y ambos lados se desplazan igual.

---

## 6. El partido, minuto a minuto (`Match.tick`)

**EL RELOJ CONTINUO (PO 27-jul-2026).** El partido avanza en **ticks de 1 minuto** y el minuto
**se ve correr** (~2 s por minuto; ver §Ritmo). Antes eran ticks de 5' (18 por partido) y el
marcador saltaba de a cinco. Toda la calibración del juego sigue expresada **por cada 5
minutos** —la unidad histórica de balance— y se reescala en un único lugar, `Match._roll(p5)`:
los diales de abajo no cambian de significado, cambia cuántas veces se los pregunta. El
congelado en las decisiones no necesita nada nuevo: `tick()` corta con decisión pendiente y el
reloj de la UI no se reagenda hasta resolverla.

**EL DESCUENTO (misma decisión).** Cada tiempo termina en su minuto **nominal** (45 · 90 · 105 ·
120) y sigue hasta `nominal + added`, con `added` calculado UNA vez en el nominal por
`Match._stoppage()` y **tope duro de 6'**:

- **más momentos → más tiempo**: pesa todo lo generado en el tramo (el mismo `_flow` de
  posesión/momentum: secuencia 3 · penal 2 · ambiente 1) más las **paradas largas** (goles y
  tarjetas, que frenan el reloj de verdad);
- el tiempo que **cierra** cada fase (90' / 120') arranca de una base mayor (los cambios, la
  pérdida de tiempo) y **se estira +1.2 si el partido está empatado o a un gol**;
- los tiempos de 15' de la prórroga escalan por su largo (nunca cobran un descuento de 45').

El reloj se **canta como en la tele** (`Match.clock()` → `"90+3"`) y todo el relato lo usa;
`m.min` sigue siendo el número crudo (91, 92…) para la matemática. Al empezar un tiempo nuevo
(`_startHalf`) el reloj **vuelve al nominal**: el descuento no se acumula —el segundo tiempo
empieza 45'— así los minutos jugados, la energía y las ventanas de contexto (`min >= 75`)
siguen valiendo exactamente lo mismo.

Desde el **Sprint A1** (rework del partido) la columna interactiva son las **Key Sequences**
(Bible §7); lo demás se simula. En cada tick, en orden (probabilidades **por cada 5 minutos**):

0. **El TERRITORIO** (`field.tickField`, sprint del Territorio 30-jul-2026): la deriva del
   minuto —de quién es la pelota y en qué zona— y su calor. Va **antes** que todo lo demás
   porque las jugadas que nacen abajo LEEN la zona resultante. No consume `rnd()`.
1. **¿Arranca una secuencia?** (`sequences.maybeStartSequence`) — la capa interactiva.
2. **¿Penal a favor?** ~1.6% · **¿Último hombre?** ~5% × `field.backlineRisk` (el espacio a la
   espalda que regala MI altura de bloque) · **¿Penal en contra?** ~1%
3. **Ocasiones SIMULADAS** (no interactivas): un remate ambiente propio y otro rival, a
   `(0.12 + 0.22 × ratioMy) × 0.78` y `(0.09 + 0.24 × ratioOpp) × 0.55` — la parte "el resto se
   simula" del Bible. Producen gol o relato sin pedir nada al DT.
4. **¿Falta?** 10% · **¿Lesión?** 2.8% · si no, una línea de ambiente.

Penal y último hombre eran ramas internas de las viejas ocasiones (`myChance`/`oppChance`,
retiradas en A1); ahora asoman como **eventos independientes** a baja frecuencia, con su
resolución del Sprint 1 **intacta** (A1 no toca su matemática).

### Estadísticas del partido (`game/match/stats.js`) — PO 28-jul-2026

El panel derecho del partido pasó de mostrar las dos alineaciones a mostrar **Posesión ·
Tiros · % Pases con éxito · Córners** (la barra de posesión se mudó ahí desde el marcador,
con el chip de momentum ▲▼ al lado del título). Dos ya existían y **no se tocaron**: la
posesión la deriva `Match.flow()` de lo generado (A3, #11) y los tiros son
`stats.misTiros/oppTiros` (punto único en `actShot`/`actOppShot`).

**Pases y córners no existían.** Se resuelven con la misma licencia que los remates
ambiente del Bible §7 ("el resto se simula"): un 6v6 no juega 400 pases a mano, así que el
VOLUMEN se simula por minuto desde la posesión y el `pase` promedio de cada once (vía
`effStat`, así que la energía y la forma también pesan), y **lo que sí es una jugada real
se suma encima**: cada `actPass` que el DT eligió en una secuencia, el balón parado en
contra (que ES un córner) y el córner que gana la Fortaleza.

> **El volumen simulado de pases es DETERMINISTA a propósito: no consume `rnd()`.** El % de
> pase de un equipo es genuinamente estable partido a partido (lo que varía es de quién es
> la pelota, y eso ya lo modula la posesión), y así el panel **no le mueve ni un dial al
> balance calibrado** — el flujo del RNG queda intacto. La varianza visible la ponen los
> pases reales de las secuencias. Los córners sí sortean (2 tiradas por minuto).
> Verificado: campeón 24.6% n=2000, idéntico al de antes del panel.

### Match Momentum (`game/match/match-momentum.js`) — PO 28-jul-2026

El gráfico de barras de las transmisiones, debajo del relato: **quién está ejerciendo más
peligro AHORA**. No es posesión, no son tiros, no es xG — es la respuesta continua a "¿quién
tiene más probabilidad de convertir en este momento?".

> ⚠️ **No confundir con `game/momentum.js`** (sin `match-`), que es el **Momento del jugador**
> (§2c: su racha 1..7, que sí escala stats). Son dos sistemas distintos que no se tocan.

**El modelo.** Una variable `now` en **[-100, +100]** (+ = mi equipo). Nunca se escribe a
mano: cada acción del simulador la empuja según `MM_W` (pase seguro **0** · pase progresivo 3
· romper líneas 6 · conducción 2 · duelo 4 · presión 3 · córner 4 · **remate 8** · atajada 6 ·
contra 8 · penal 12 · **gol 25** · roja 10), con el signo del lado que la ejecutó. Los
enganches viven donde vive el fútbol: las seis Football Actions de `actions.js`, los remates
ambiente y goles de `chances.js`, el córner y la contra de `sequences`/`sequence-acts`, y las
tarjetas de `incidents.js`.

**Valor de posesión, sin código aparte.** Diez pases laterales no suman nada (el pase seguro
pesa 0); la escalera *pase progresivo → romper líneas → conducción → remate* acumula sola
porque cada acto suma. La cadena de actos del Bible §7 **ya es** la cadena de valor.

**Ventana móvil = decaimiento.** Cada minuto `now *= 0.78`, lo que deja la ventana efectiva en
~5 minutos (0.78⁵ ≈ 0.29): un cambio táctico se ve enseguida y nadie domina eternamente por
una sola jugada. Al cerrar el minuto se guarda una barra con el **promedio** de la variable
durante ese minuto (no su último valor) más sus **marcas** (⚽ 🟨 🟥 🔄 🚑 🔥 ⚙️), que se
deduplican dentro del minuto para no apilar iconos sobre una barra de 3 píxeles.

`MM_DISPLAY = 50` es la escala del DIBUJO, no del modelo: medido en 400 partidos, el pico
máximo de un partido tiene mediana 29 y tope 60, así que dividir por 100 dejaba el gráfico
planchado contra el cero.

**El asistente técnico** (`assistantLine`) lee la tendencia de los últimos 5 minutos y la
traduce a fútbol — "Nos están encerrando desde hace varios minutos", "Estamos dominando pero
no conseguimos finalizar" — **nunca un número**, con un silencio mínimo de 12' entre frases.

> ### 🔒 LA REGLA DE ORO: el Match Momentum es una SALIDA, no una regla
> - **No consume `rnd()`.** Ni una tirada — verificado en `match-momentum.test.js` contando
>   `Math.random` (el único origen de azar del juego, §1.1). Si consumiera azar correría el
>   flujo del RNG y le movería los diales al balance calibrado.
> - **No escribe nada que el simulador lea**: vive entero en `m.mm`. El test fotografía
>   marcador/stats/feed/decision/seq/press/flow antes y después y exige que no cambien.
> - **No sube porque el DT apretó un botón.** Presionar y cambiar la mentalidad dejan una
>   **marca** en el gráfico, jamás puntos: el momentum sube solo si esa decisión produjo
>   mejores secuencias. También verificado en el test.
>
> Medido: campeón 24.3% n=2000, sin cambio respecto de antes de la feature.

### Key Sequences (`game/match/sequences.js` + `content/sequences.js` + `actions.js`)

Una secuencia es una **historia en miniatura de 1 a 3 actos** (decisión PO): cada acto es una
decisión (`id: "sequence"`, contrato §3.2) que se resuelve con **Football Actions** — los bloques
reutilizables de `actions.js` (pase, regate, remate, contención…). Al acertar, la jugada **escala**
al acto siguiente; al fallar, **cierra**. La escalera multi-acto funciona sola en la UI y el smoke:
resolver un acto puede dejar la decisión del acto siguiente, y tick() corta con decisión pendiente.

**Los actos de construcción NO son compuertas de supervivencia**: modulan la CALIDAD del remate
(un `bonus`), no si la jugada muere. El camino seguro siempre llega al desenlace; solo la opción
arriesgada (pase filtrado, conducción) puede perder la pelota. El **gate de gol es el remate final**,
como en las ocasiones que reemplaza — si cada acto fuera pass/fail, tres actos multiplicarían el
fallo y el scoring se derrumbaría (medido en A1: bajaba a ~7%).

**Catálogo A2** (completo — los 6 del roadmap + el repliegue de A1 + la cara defensiva del córner;
los actos viven en `sequence-acts.js`, extraído de la máquina por presupuesto de líneas §6):

| Tipo | Lado | Forma | Mapea a (Filosofía) |
|---|---|---|---|
| 🎼 Circulación posicional | ofensiva | construir · construir · rematar (pesa el Pase) | Posesión |
| ⚡ Transición rápida | ofensiva | conducir · rematar (vertical, mejor perfil) | Contragolpe |
| 🏃 **Desborde por la banda** | ofensiva | correr la banda · centrar · rematar — **la jugada de la velocidad** (ver abajo) | Contragolpe |
| 🦁 Recuperación alta | ofensiva | presionar (+0.10, mi iniciativa) · rematar — presión total roba menos pero en zona letal | High Press |
| 🌩️ Pelotazo largo | ofensiva | duelo aéreo (¡por fin juega el **Cabezazo**!) · rematar — choque = cabecea él; peinada = habilita a un lanzado | Bloque bajo |
| 🎯 Balón parado a favor | ofensiva | UNA decisión: centro al mejor cabeceador o jugada preparada | — |
| 🚨 Balón parado en contra | defensiva | zona (segura) o salir a despejar (mata la jugada o deja solo al cabeceador) | — |
| 🗼 Salida bajo presión | def→of | reventarla (gratis) o salir jugando: la pérdida regala un remate letal… o la jugada **SE CONVIERTE en transición mía** | — |
| 🧱 Repliegue defensivo | defensiva | contener · (último hombre o remate rival) | Bloque bajo |

### 🏃 El desborde por la banda (Odisea, 2ª mitad — decisión PO 29-jul-2026)

La jugada que el motor no tenía: el fútbol por afuera. Es la primera secuencia cuya
**primera pregunta es "¿tenés piernas?"** en vez de "¿tenés pase?".

**Quién la corre.** El tipo declara `protStat: "velocidad"` y `sequences.protStatW` pondera
el sorteo del protagonista de forma **cuadrática sobre 70** (vel 95 pesa ×1.8, vel 55 ×0.6):
la banda la encara el extremo rápido, no el central que quedó suelto — sin volverlo
determinista (medido: Vinícius y Raphinha se reparten el 70% de los desbordes de Brasil, y
el resto sigue apareciendo).

**Acto 1 — `wing`, tres fútbols distintos:**

| Opción | Qué mide | Trade |
|---|---|---|
| 🏁 **Ir a la línea de fondo** | `actSprint`: MI velocidad contra la del lateral rival más rápido, con handicap 0.10 | Si llega, la zaga queda de espaldas: **+0.07 al centro** y +0.04 al remate. Si no, la jugada muere (sin contra: perderla en la banda no parte al equipo) |
| 📡 **Centrar de primera** | nada: no hay duelo | Llega **siempre**, pero la defensa se acomoda: **−0.05 al centro** |
| ✂️ **Cortar hacia adentro** | `actDribble` (aura + velocidad) | **Saltea el centro** y va directo al remate con el pie cambiado (+0.06, stat Tiro). Perderla encarando al medio abre contra |

**Acto 2 — `cross`, donde el split de pase decide QUÉ jugada se juega:**

| Opción | Stat | Desenlace |
|---|---|---|
| 📡 **Centro al área** | `pase_largo` | Cambia de protagonista al **mejor cabezazo que ataca el área** (los centrales no entran: en juego abierto no están ahí) y el remate es de **cabeza** |
| 🎯 **Pase atrás rasante** | `pase_corto` | Al **mejor Tiro** que llega de frente al arco: remate normal con **+0.05** de perfil |

El que centra queda como **asistidor** si el remate entra. En el pool pesa
`1.5 + 1.5·prof.def`: el desborde es la respuesta clásica al rival que se encierra;
cansado casi no sale (×0.7 — el sprint es lo primero que se pierde) y perdiendo tarde se
busca más (×1.4). Medido en 120 partidos: **7.5% de los actos de secuencia**.

### La velocidad, ya en la cancha (Odisea, 2ª mitad)

Hasta acá la stat solo pesaba en la media. Ahora decide en cuatro sitios más, elegidos
porque el fútbol los pide:

| Dónde | Qué cambia |
|---|---|
| **Conducción** (`actDribble`) | Era solo aura (carisma). Ahora aura ×0.048 + velocidad ×0.028 — **mismo valor esperado en un jugador promedio**, otro perfil: el extremo veloz conduce mejor que el 10 lento, que antes iban iguales |
| **Último hombre** (`chances.resolveLastMan`) | Anticipar es leer **y llegar**: ±0.05 por punto de diferencia de velocidad entre el central y el delantero. Es la jugada donde el central lento se desnuda |
| **Contención del repliegue** (`actContain`) | `chase` = velocidad media de MI línea de fondo; ±0.035 por punto sobre la media. Replegar es llegar |
| **Desborde por la banda** | La jugada entera (arriba) |

> **Balance:** medido con `--smart --focus` n=600, BRA **47.3%** de campeón contra **46.5%**
> antes de esta mitad, y MAR **41.8%** contra 43.5% — todo dentro del ruido. La velocidad
> entró sin mover el gate porque **la media de cada jugador no cambió** (§2): lo que se
> redistribuyó fue quién es bueno en qué, no cuánto vale nadie.

### El fallo que encadena (A2, regla 7 del Bible) — bidireccional a propósito

- **Rebote** (`REBOUND_CHANCE` 0.30): mi remate fallado deja la pelota viva y alguien la caza
  (remate sucio, bonus −0.03, sin asistidor; **un solo rebote por secuencia**).
- **Contra** (`COUNTER_CHANCE` 0.28): mi pérdida **ARRIESGADA** (filtrado interceptado, conducción
  perdida, presión rota, pase de asistencia fallado) abre un contragolpe rival — elegir el riesgo
  tiene que poder doler. La opción segura nunca lo dispara.

La bidireccionalidad es la clave del balance: el rebote suma goles míos, la contra se los da al
rival — medido, casi se cancelan (GF +0.05, GA +0.02 por partido).

### Absorción del último hombre (A2, decisión PO #7) + el canal plano

El último hombre ya no asoma como evento suelto arbitrario: **nace del fútbol** — una contención
rota (`LASTMAN_FROM_CONTAIN` 0.70) o **toda contra con el equipo partido** (`LASTMAN_FROM_COUNTER`
1.0) terminan en el mano a mano, con la resolución del Sprint 1 **intacta** (anticipar-fail 0.68,
roja 0.12, penal barrerse 0.28 — `resolveLastMan` no se tocó). Exposición resultante ~0.77/partido
(histórico ~0.9).

> ⚠️ **La lección del canal plano (A2).** Al absorber el último hombre, los equipos DÉBILES dejaron
> de generarle sustos al favorito: sus secuencias contra ti son pocas y sus remates flojos, mientras
> que el viejo canal suelto era **PLANO** — hasta Cabo Verde te generaba escapadas, y el peligro del
> mano a mano no depende de la calidad del que se escapa (anticipar-fail concede 0.68 sea quien sea).
> Sin él, BRA derivó **+3.7pp**. Se restauró un canal ambiente CHICO (`BREAKAWAY_TICK` 0.018, el
> pelotazo a la espalda que no nace de ninguna pérdida) — deliberadamente plano: **es el arma del
> underdog**. Es un dial fino: 0 → +3.7pp · 0.035 → −3.4pp.

### Identidad del rival y mentalidad (A2, decisiones #3 y #14)

`rivalProfile` deriva de los promedios del once rival (sin datos nuevos, 0..1): **atk** (su peligro
directo) · **def** (su solidez/intensidad, proxy de cuánto te presiona) · **pase** (su vocación de
pelota) · **cab** (su juego aéreo). `typeWeights` convierte ese perfil + la **mentalidad** (palanca
VIVA: se lee al generar, cambiarla a mitad de partido cambia el fútbol que sale) en pesos por tipo:
un rival que ataca te deja contras; un bloque invita al pelotazo; uno que quiere la pelota, a
presionarle la salida; su intensidad te presiona a ti (salida_fondo) y su juego aéreo vive del
córner. Desde F2 el proxy es la BASE y la **filosofía real del rival** multiplica encima
(`rivalFilo`: curada para los 16 del roadmap — `content/team-philosophies`, con formación
acorde vía `bestSixShaped` — y derivada determinista para el resto: débiles → bloque ·
mediocampo con jerarquía → posesión · resto → contra; el Press no se infiere, solo curado.
Nivel por jerarquía: r≥84 Consolidada · r≥78 En desarrollo · resto Aprendiendo).

**[EL CICLO DE COUNTERS] (sprint del Rival que Decide, decisión PO 1-ago-2026 — reemplaza
la matriz ad hoc de F2).** La LEY vive en **`content/philosophies.COUNTER_CYCLE`**, y el
array ES el ciclo: `["press","posesion","bloque","contra"]`, cada uno le gana al siguiente
y da la vuelta. Los **neutros** (Press↔Bloque y Posesión↔Contra) caen solos como los que
quedan a distancia 2 — no se declaran, así que no pueden divergir. De ahí salen `PRESA_DE`,
`CAZADOR_DE` y `counterEdge(mío, suyo) → +1/0/−1`, la única primitiva que decide quién le
gana a quién: la consumen el pool, el reparto de pelota, el informe del ojeador y el DT
contra-elector del smoke.

> ⚠️ **LA LECCIÓN MÁS CARA DEL SPRINT, y vale para cualquier mecánica futura: EL POOL NO
> MUEVE EL RESULTADO.** F2 había construido la matriz entera sobre pesos de tipo. Medido en
> banco de plantel fijo (BRA vs GER, n=2000/celda, nivel 10), descomponiendo el win% en
> fila + columna + interacción: **el residuo de interacción máximo era 0.65pp contra un
> error estándar de 1.02pp — la interacción del matchup no existía.** Y no era que la matriz
> estuviera apagada: movía el share de tipos **hasta ×2** (mi Contra pasaba de 27.4% de
> transiciones contra Press a 13.5% contra otro Contra) con el resultado quieto. El propio
> R3 ya lo había escrito —*"la lección de R2 es que los sesgos de pool miden ~0pp"*— y la
> matriz seguía viviendo ahí. **Tipo de cambio de los tres canales, medido:** poder
> (`p.forma`) −0.33 a −0.52pp de win% por 1% · posesión (`mineShare`) ~0.75-1.05pp por 0.01
> de share · **pool 0.00pp**. Corolario incómodo: consolidar la identidad de nivel 1 a 10
> vale **+0.6pp de win% en el partido** — el valor de la progresión está en los rasgos que
> desbloquea, no en el ×1.35→×2.10.

Así que el ciclo vive en **dos capas**:

- **EL DIENTE — `filoShareShift` (`CICLO_SHARE` = 0.05).** ±0.05 de reparto según
  `counterEdge`, apilado sobre los costos de identidad de F2. Es de **suma cero** por
  construcción (`mineShare` es un solo número), así que el ciclo no infla el partido: decide
  de quién es. Y es **visible** sin una línea de UI — la posesión se ve en las estadísticas
  y se siente en cuántas jugadas propone cada uno. Medido en runs reales (piso, n=4000):
  **gano el cruce 74.2% · neutro 73.1% · pierdo 70.6%**, y los cruces con elección al azar
  salen **24.8/50.1/25.1**, que es por qué el piso no se mueve.
- **EL NARRADOR — `MATRIX` sobre el pool.** Las 4 aristas contadas desde las dos sillas
  (8 celdas + el espejo `contra|contra`), patrón único: la firma del que gana ×1.35/1.40, la
  del que pierde ×0.72 ≈ 1/1.35. Cambia **qué fútbol sale**, que es lo que el Bible §5 le
  pide a una filosofía; no pretende decidir el partido.

**EL CANDADO QUE FALTABA.** `philosophy.test` verifica que la matriz **no pueda contradecir
al ciclo**: celda por celda que la firma se mueva en la dirección de `counterEdge`, que las
4 aristas estén contadas desde las dos sillas, y que los cruces neutros **no** lleven celda.
Es justo el agujero por el que F2 llegó a **9 de 16 cruces vacíos** y a un cruce
**LOSE-LOSE** (Posesión↔Bloque penalizado en las DOS sillas, con la prosa de `bloque`
contradiciéndose a sí misma) sin que nadie lo notara durante cuatro arcos.

**La curación también es balance.** Los 16 curados son los 16 de más rating, o sea **los que
llegan al final del cuadro**: con 7 posesión contra 1 bloque, la final se jugaba contra
Posesión el **52%** de las veces y contra Bloque el **3.8%** — sobre un campo así un ciclo no
es un ciclo (~2.2pp de campeón entre el mejor y el peor pick). Se verificó primero que la
DERIVACIÓN no alcanzaba (cambiarla movía la final de 52.0% a 52.3%: nada, porque trabaja
sobre los 36 que la selectividad KO elimina). El reparto pasó a **5·4·4·4** con ITA entrando
curado, y un test fija que ninguna identidad pueda volver a duplicar a otra.

La firma rival sesga SU lado con SU nivel (press→salida_fondo ·
posesión→repliegue · bloque→balón parado ×1.3 + salida ×0.6). Los **costos de identidad**:
Press −6 de energía post-partido (`applyFiloCosts`) · Bloque cede volumen ofensivo
(mineShare −0.08) · el rival que espera te la cede a ti (contra +0.04 · bloque +0.06) ·
Posesión sin costo físico.

> 🆕 **LA FILA DE CONTRA (sprint del Rival que Decide, hallazgo post-cierre): se retiró su
> costo de identidad.** El −0.05 de "Contra cede posesión" nació en F2 para compensar que el
> counter vivía en el pool. Con el pool degradado a narrador (0.0pp, ver arriba) ese costo
> quedó huérfano y se apilaba con el diente nuevo en el MISMO canal: en el cruce que Contra
> gana (vs Press), −0.05 + diente (+0.05) = 0.00 — el diente se anulaba a sí mismo. Posesión
> y Press no pagan costo de identidad, así que se quedaban con el diente entero en su propio
> cruce favorable. Medido (banco BRA vs GER, n=2500/celda): Contra rendía −2.5pp de share
> neto medio contra los 4 rivales (Press y Posesión +2.5pp), y terminaba siendo la peor
> identidad de las cuatro pese a que Bloque paga MÁS costo en papel — su formación defensiva
> 3-1-1 lo compensa; la 2-2-1 de Contra no tiene ese colchón. Retirado el costo, Contra juega
> el ciclo en pie de igualdad con Press y Posesión.

El Bloque además tiene su ARMA propia: balón parado ×1.3 (ajuste PO tras el primer gate —
medía −5.5pp de piso con puros palos; el córner es el gol del bloque). Los **rasgos de
Consolidada de F2 se FUSIONARON en las secuencias avanzadas** (M2, decisión PO): ya no
bufean los tipos base — profundizan la avanzada de cada identidad (ver [SECUENCIAS
AVANZADAS] abajo). Verificado en diag (250 partidos/celda, nivel 2): cada celda de la
matriz mueve el share en su dirección sin tocar los goles (~1.4-1.8) — el caso extremo es
Contra consolidado vs press rival: 58% de transiciones (vigilar si el relato se vuelve
monotemático).

**[FILOSOFÍA → POOL] (arco F1, decisión PO #6).** MI filosofía multiplica su **tipo firma**
en `typeWeights`: **×1.35 / ×1.7 / ×2.1** según el nivel (Aprendiendo / En desarrollo /
Consolidada — `FILO_LEVELS` en `content/philosophies`). Llega por `matchCtx.filo = {id, nivel}`
(la frontera run→Match, como la moral: el Match no conoce la run; lo arman `screens/match.js`
y el smoke). Sesga UN tipo, no el reparto — medido (diag, 400 partidos/celda): la firma sube
~+5-7pp de share en Consolidada (contra 17→24% transición, bloque 8→14% pelotazo), el resto
del contexto dinámico de A3 sigue visible y los goles no se mueven (~1.7): **cambia el fútbol
que sale, no compra goles** (Bible §5 regla 3). La **progresión** cierra el círculo y desde el
arco de Progresión (28-jul-2026) ES la única fuente de nivel: ver §La progresión más abajo.
Desde M2 la **avanzada también es firma**: sus aciertos cuentan igual (`noteFiloHit` mira
`advFor`).

**[SECUENCIAS AVANZADAS] (arco del Meta M2, diseños PO 22-jul).** Cada filosofía tiene su
**fútbol superior** (`content/sequences` con `advFor`, números en `adv`): entra al pool desde
**En desarrollo** (nivel 1) y Consolidada lo **profundiza** (la fusión: el rasgo de F2 vive
adentro). El gating REPARTE el peso de la familia (nivel 1: 60% avanzada / 40% base; nivel 2:
90/10) y va **al final** de `applyFiloWeights`: la avanzada hereda TODO lo que la matriz y
las firmas le hicieron a su tipo base — medido: sumar en vez de repartir hundía a las
identidades con jugadas de riesgo (Contra −5pp), y repartir antes de la matriz dejaba al
letal sobre-jugado en sus peores cruces. Las 4:
- 🦁 **Cacería total** (Press): `press→press→finish` — la trampa se cierra sobre el reseteo
  (2º robo en zona letal, `trapBonus`); la rotura es falta el 35% (50% profunda): 🟨 amarilla
  real (la 2ª expulsa — `teamPowers` ya castiga la inferioridad rival) + tiro libre encadenado.
- 🎼 **La sinfonía** (Posesión): `build×3→finish` (×4 profunda, plan propio como el viejo
  rasgo); con todos los compases, 22-30% de PENAL (el rival mareado te baja en el área); si
  no, remate limpio (finishBonus 0.16).
- ⚡ **Contragolpe letal** (Contra): `carry→carry→finish` con **geografía de la falta**: 1º
  tramo = amarilla + tiro libre (freekickBonus 0.08); 2º tramo (rival desesperado) = 22% de
  los fallos son falta: 30% ROJA por último hombre + tiro libre al borde (0.12), resto
  amarilla + PENAL. El 2º tramo se conduce más fácil (`carryEase` +0.15 al dribble: la cancha
  está ROTA) y perderla limpia ahí NO abre contra-contra (nadie quedó parado). Definición
  regalada (0.21) y `carryBonus` [0.10, 0.14].
- 🧱 **La fortaleza castiga** (Bloque, la única DEFENSIVA): nace del repliegue; la contención
  exitosa CONVIERTE 55-75% en pelotazo mío con el rival desarmado (def→of, el patrón de la
  salida bajo presión) y el duelo perdido muere 35% en córner ganado encadenado. El rasgo
  viejo (+0.05 contención) vive en su versión profunda.
La **conquista se narra** (`noteFiloMilestones`, llamada en los dos beats donde crecen las
aristas: acción del día y post-partido): nivel 1 = "¡Conquista! ya es nuestro fútbol", nivel
2 = "la idea es LEY". La vitrina la lista 🔒/✅ y el sorteo la vende desde la elección. Las
tarjetas al rival de estos desenlaces son LOCALES al partido (rivalBans sigue siendo cosa
del mundo vivo, como las lesiones rivales).

**Generación** (`sequences.seqPlan` + `maybeStartSequence`): **5-9 por partido** (sprint de la
Densidad, 31-jul-2026 — nació 2-6 con ticks de 5'), objetivo modulado por la **preparación**
(ventaja atk+def sobre el rival) y la mentalidad. El favorito recibe más secuencias y más
ofensivas; el superado, menos y más defensivas — el pago visible de prepararse (Bible §7).
La base subió 4 → 7 y la **pendiente del `edge` NO se tocó** (0.32): el aumento es parejo, +3
jugadas para todos. Medido en el banco de partidos: 4.66→7.68 con el favorito claro y
3.33→6.33 con el underdog, exactamente +3.0 en los cinco duelos.

**CUÁNDO sale cada una (`seqSlots`, fix del PO 28-jul-2026).** Antes se sorteaba tick a tick con
una probabilidad **sin memoria** (`faltan / ticksQuedan`). El número por partido salía perfecto,
pero los huecos eran **exponenciales**: medido en 300 partidos KOR vs ESP, mediana de **15'** sin
una sola jugada, **p90 de 42'** y máximos de **77'**. Con ticks de 5' no se notaba (17 minutos
eran ~2 s de reloj de pared); con el reloj continuo son 34 s mirando correr el minutero, y el PO
lo reportó como bug. Ahora los minutos se **sortean una vez por fase**: una **ventana** por
secuencia y un minuto al azar dentro de ella (con margen en los bordes). Resultado medido: p90
42'→**31'**, máximo 77'→**50'**, campeón 23.9%→24.6% n=2000 (ruido). La prórroga recibe sus
propios momentos a prorrata de sus 30'. Lo que decide **QUÉ** secuencia sale (lado, tipo,
protagonista, contexto A3/F2/T1/presión) sigue pasando **al dispararla** — el Sprint A3 no se
tocó; solo se reemplazó el "¿ahora?" del sorteo.

**LA VENTANA TERRITORIAL (sprint de la Densidad).** Cada secuencia dejó de tener un *minuto* y
pasó a tener una **ventana** (`abre`…`cierra`, con `ANTICIPO` = 0.40 del tramo): dentro de ella
la jugada **espera a que haya fútbol** —la pelota fuera del mediocampo, `zonaViva`— y sale ahí;
si el partido se queda trabado en el medio toda la ventana, sale igual al vencer. Medido: **73%
de las jugadas las dispara el territorio** y 27% el vencimiento. El **número** de jugadas sigue
sin depender de la zona (la ley del sprint del Territorio: la geografía decide QUÉ jugada, nunca
CUÁNTAS) — lo único que decide es *cuál* de los minutos de la ventana se usa. El jitter de
`seqSlots` ([0.30, 0.85] del tramo) deja 0.45·L de separación mínima entre vencimientos, o sea
**más que el `ANTICIPO`**: dos ventanas nunca se solapan (`sequences.test` lo fija).

> **Deuda SALDADA — la DENSIDAD** (31-jul-2026). Repartir arregló la cola, no la media: con 2-6
> secuencias en 90' el hueco medio era ~24' pase lo que pase, y el reloj continuo había diluido
> la interactividad de ~2/3 del reloj de pared a ~1/9. Resuelto subiendo el objetivo a **5-9**.
> Medido en 20.000 partidos del banco: hueco **mediana 16-21' → 11-13'**, **p90 25-35' → 16-19'**
> y **máximo 51' → 29'**. El bug original del PO ("17 minutos sin ninguna jugada") ya no puede
> volver a ocurrir. Los dos contrapesos que costó, abajo.

#### Los dos contrapesos de la densidad (y por qué el banco por sí solo mentía)

Subir la densidad a secas movía **campeón 25.5% → 39.5%** (n=1200), casi el doble del +8pp que
se había estimado. El banco de partidos, en cambio, decía que la BRECHA favorito−underdog casi
no se movía (30.1 → 31.2pp). Las dos mediciones eran ciertas y medían cosas distintas:

1. **La conversión del favorito (el grueso, ~11pp).** Más jugadas → **+27% de goles** → los
   **empates se derrumban** (BRA vs POL: 14.5% → 9.8%) → el favorito convierte su superioridad
   con más fiabilidad. Un +6.7pp de win% por partido parece poco, pero una run son ~6 partidos
   encadenados: `(85.7/79.0)^6 = 1.62`, y `25.5% × 1.62 ≈ 41%`. **Lección de método: en este
   juego un efecto de partido chico se eleva a la sexta potencia en el KPI.** El banco no
   miente, pero hay que componerlo a mano antes de compararlo con el smoke.
   **Contrapeso (decisión PO): bajar los remates AMBIENTE** — más jugadas interactivas
   REEMPLAZAN simulación, no se suman a ella. `AMBIENT_MINE` **0.85 → 0.28** y `AMBIENT_OPP`
   **0.70 → 0.40**. La asimetría está medida y es deliberada: con densidad plena mi ataque
   creció +27% y el rival solo +14% (mis jugadas las decido yo y las convierto mejor), así que
   restaurar el marcador de los dos lados exige cortar más de mi lado. Resultado: GF
   2.69/2.33/2.07/1.45/1.29 vs 2.67/2.33/2.03/1.50/1.29 de base, GC 0.37/0.54/0.56/0.86/0.86 vs
   0.40/0.57/0.57/0.85/0.86.
2. **La velocidad de la progresión (~2.7pp).** La XP de identidad se gana **por secuencia**
   (`noteFiloIntent` 70% + `noteFiloHit` 30%), así que la densidad es de hecho el dial de
   velocidad de TODO el arco de Progresión: sin tocar nada más, la filosofía tope pasaba de
   **6.0 a 8.2/10**, el DT de 12.4 a 17.6/20, los rasgos de 11.3 a 16.5 y el Master del 0.0% al
   4.7%. El propio arco declara su banda ("una run promedio deja a la principal en **6-8**"), o
   sea que la densidad la rompía por arriba.
   **Contrapeso: devolver el presupuesto de XP por partido a su nivel calibrado**, escalando los
   dos diales por la razón de densidad medida (0.58): `XP_INTENCION` **125 → 73** y `XP_ACIERTO`
   **55 → 32**. La relación "más jugadas enseñan más" queda intacta (un partido de 9 sigue
   enseñando más que uno de 5); lo que se restaura es el ritmo absoluto. Verificado: filo **6.0**,
   DT **12.7**, rasgos **11.5**, Master **0.1%** — la banda del arco, clavada.

**Gate del sprint** (BRA, n=4000): campeón **28.4% vs 27.1%** de base = **+1.3pp, dentro de
±2pp**. Techo `--smart` **44.9% vs 40.0%** y `--smart --focus` **46.1% vs 39.9%** con Master
**21.9% vs 19.8%**: ningún dial global bajó el techo (LEY del arco del Rebalance) — al contrario,
la brecha piso→techo se ensanchó de 14.5 a 16.5pp, que es lo que se espera de un partido con más
fútbol interactivo: **hay más decisiones donde el DT humano puede sacar diferencia**.

**Ritmo** (`screens/match.js`, decisión PO "ráfaga" + reloj continuo 27-jul): un tick **es un
minuto** y se ve correr — **2000 ms/minuto** en normal (un partido son ~3'30" de reloj de pared
más lo que el DT tarde en decidir), **800 ms** en Rápido. Frena en seco al llegar una secuencia;
un gol hace una pausa de 2,6 s. El reloj se auto-agenda con `setTimeout` para variar el paso.
Con el partido durando 15× más en tiempo real, el **relato de ambiente** subió de 0.35 a 0.55
por cada 5' (`AMBIENT_LINE`): es narración pura, no toca el balance, pero sin eso el relato
quedaba muerto entre jugada y jugada.

> **La ventaja del DT humano.** El favorito recibe más y mejores secuencias, pero **ejecutarlas**
> es del jugador: elegir bien el riesgo de cada acto rinde por encima del rating puro. El smoke,
> que decide al azar, mide el piso; el humano que decide bien saca la diferencia.

### El partido vivo (A3, decisiones #9, #10, #11 y #15)

**Contexto dinámico en la generación** — todo se lee **EN VIVO** al generar (seqPlan cachea
target/edge/perfil; el partido no se cachea):

- **Marcador+minuto (umbral 75')**: perder tarde vuelca el reparto (+0.07 al `mineShare`) y el
  fútbol se hace directo (transición/pelotazo ×1.5); ganar tarde entrega iniciativa (−0.05) y
  crecen los repliegues (×1.4).
- **Expulsados**: cada roja inclina la cancha (±0.06 por diferencia de expulsados).
- **Fatiga** (energía media de los míos <55): solo sesga TIPOS — el equipo fundido no presiona
  (recuperación ×0.6), revienta (pelotazo ×1.4) y el rival le asfixia la salida (salida_fondo
  ×1.4). No toca la cantidad, para limitar el refuerzo a la palanca de energía.
- **Memoria**: nunca sale el mismo tipo dos veces seguidas (`m._lastSeqType` → peso 0).

**`[MORAL → OCASIONES]`** (por fin retirado el hook comentado de `Match.tick`): la Moral sesga el
**TIPO, nunca el número**, y llega por `matchCtx` (el Match no conoce la run; se arma en
`screens/match.js` Y en el smoke). Extremos fuertes + leves: nubes → valientes ×1.5
(recuperación/transición), alta ×1.2; suelo → pelotazo ×1.5 y recuperación ×0.6, baja la versión
leve; estable neutra.

**Momento → protagonista** (`protMomentum`): el encendido (7) pide la pelota (~1.36×), el apagado
(1) se esconde (~0.64×) — factor `1 + 0.12·(momento−4)` sobre `protWeight`, también en la
conversión def→of. **Nunca toca una probabilidad de éxito** (el Momento ya escala stats).

**Posesión y momentum DERIVADOS** (`Match.flow()`): todo lo generado se acumula en `m._flow`
(secuencia peso 3 · penal/mano a mano 2 · remate ambiente 1). Posesión = % mío con prior neutral
(arranca 50/50); momentum = neto de los últimos 15'. La UI los pinta bajo el marcador (barra +
chip ▲▲/▲/·/▼/▼▼); el Match solo deriva.

**Relato ambiente contextual** (`content/ambient.js`): ~19 líneas con predicado sobre un ctx que
arma `Match._ambientLine` (marcador tardío, rojas, fatiga, momentum, bandas de Moral); las
contextuales pesan 2-3× sobre las genéricas cuando aplican. El ambiente anticipa en el relato lo
que el contexto ya hace en el motor.

### ⚠️ Balance del Sprint A3

Baseline fresco **33.2% n=4000**. Por etapas: contexto dinámico **~35.0** (+1.8, dos corridas
35.2/34.7) → moral+momento **34.3** (+1.1, no acumula) → integrado final **35.7/36.0 (+2.5,
FUERA del gate)**: el contexto favorece al que mejor explota las secuencias extra — el favorito.
Recorte con el dial pactado más fino: **`BREAKAWAY_TICK` 0.018 → 0.025** (el canal plano es el
arma del underdog; sensibilidad A2 ~−0.2pp por +0.001) → **34.0% n=4000 = +0.8, dentro del
gate**. Exposición del último hombre 0.86/partido (histórico ~0.9). Siempre-Recuperar: 47.3 →
48.3 n=1500 (+1.0 = ruido; el refuerzo temido de la fatiga→generación no apareció con fuerza —
vigilado, reportado, no arreglado: es de otro sprint).

### ⚠️ Balance del Sprint A2

Baseline (con los planteles nuevos del PO: +ESP/GER/NED): **33.8% n=4000**. Medido POR ETAPAS
(lección del Sprint 4): catálogo+identidad **34.1** (+0.3, tras calibrar recuperación/pelotazo —
la primera pasada dio 27.1: los tipos nuevos con compuerta rendían la mitad que circulación, misma
lección de A1: el éxito de la compuerta debe pagar mejor) → encadenamiento **33.0** (−0.8, el diseño
bidireccional se auto-compensa) → absorción **37.5 (¡+3.7, fuera del gate!)** → con `BREAKAWAY_TICK`
0.018 → **34.1-35.0 n=4000 = +0.3..+1.2pp, dentro del gate**. Diales de A2: `AMBIENT_*`,
`finishBonus`, `actAerial`/`actContain(bonus)`, `BREAKAWAY_TICK` (el más fino), pesos de
`typeWeights`. Y de nuevo: **n=1500 mintió dos veces** (32.7 → 30.4 real; el gate SIEMPRE a n=4000).

### ⚠️ Balance del Sprint A1 (leer antes de tocar el partido)

Baseline HEAD **29.1% n=4000**. El cambio de "muchas decisiones cortas" a "2-6 secuencias largas"
es el gate grande del arco. Primera pasada: **6.7%** (derrumbe) — la causa fue el fallo-por-acto
multiplicándose (arriba). Con la construcción como modulador de calidad (no compuerta) y el remate
de definición calibrado al de la ocasión vieja, quedó en **30.8% n=4000 = +1.7pp, dentro del gate**
(consistente entre n=1500 y n=4000). Diales pactados si deriva, EN ORDEN: (1) número de secuencias,
(2) prob. de gol por acto (`AMBIENT_MINE`/`finishBonus`/`actShot`), (3) reparto ofensivo/defensivo.
La calibración del último hombre y de los penales **no se tocó**.

Las **Football Actions** están ancladas a las fórmulas de las ocasiones que reemplazan (la intención
es "menos momentos y más largos", no otra matemática de gol). El remate de definición usa base más
alta que el ambiente (`0.15 + q·0.09`, espejo del viejo "shoot" interactivo).

---

## 7. Penales

Hay dos contextos y ambos son interactivos.

**Penal a favor** — eliges pateador:
```
P(gol) = clamp(0.52 + (tiro+aura)/2 × 0.07 + bonusPráctica,  0.50,  0.93)
```

**Penal en contra / tanda** — eliges hacia dónde se lanza tu arquero. Solo si **adivinas
el lado** tienes chance real de atajar:
```
si adivinas:  P(atajar) = clamp(0.35 + calidadPortero × 0.09,  0.35,  0.85)
si no:        el rival marca casi siempre (a veces la tira afuera)
```
Donde `calidadPortero = reflejos×0.6 + aura×0.4`. Aquí **reflejos y aura mandan**, no las
atajadas: un penal es reacción pura y temple.

La tanda sigue las reglas FIFA: 5 rondas, cierre por definición matemática (si un equipo ya
no puede ser alcanzado, termina) y muerte súbita después.

---

## 8. Simulación rápida (`quickSim`)

Los partidos que el usuario **no** juega (el resto de su grupo, las otras llaves) se
resuelven con un modelo de **Poisson**, estándar en modelización de fútbol:

```
λ_A = clamp(1.35 + 0.55 × (ratingA − ratingB)/20,  0.2,  3.8)
golesA ~ Poisson(λ_A)
```

λ es el promedio de goles esperado: un equipo muy superior tiene λ alto (marca más), pero
como es Poisson **siempre puede haber una sorpresa**. En eliminatorias, si hay empate se
resuelve prórroga y penales con una moneda sesgada por el rating.

> **Por qué Poisson.** Modela bien "eventos raros e independientes" como los goles. Da
> distribuciones de resultados realistas (muchos 1-0 y 2-1, pocos 6-0) sin tablas ad hoc.

---

## 9. Economía de la run: calendario, energía, buffs y eventos

Una run son ~7 partidos repartidos en un **calendario por días** (día 1 = 11 de junio
de 2026, arranque real del Mundial; las fechas son ambientación). Los partidos caen
cada **5-6 días** (`ri(5,6)` en `scheduleNextMatch`) y cada día intermedio trae
exactamente un suceso, pre-sorteado al agendar el partido:

> **La ventana de preparación no se borra al avanzar.** `scheduleNextMatch` guarda
> `run.windowStart` (hoy en el arranque, o el día siguiente al último partido) y el
> calendario del hub muestra `windowStart..nextMatchDay` completo: los días ya vividos
> quedan **en gris** ("✓ vivido") en vez de desaparecer, HOY se resalta y los futuros
> anticipan su temática. Da sensación de avance dentro de la ventana.


- **evento inevitable** (`PREP_EVENTS`, 30, sorteado por **rareza**): buff o debuff
  que se aplica solo, o un **modificador del día** (ver más abajo).
- **conflicto con decisión** (`RANDOM_EVENTS`, 6): dilema con dos opciones y
  trade-offs (sponsors, peleas, virus, localía, prensa, médicos). Su probabilidad
  (base **25%**) la modula la **Moral del equipo** — ver §Moral: vestuario feliz =
  semana tranquila, vestuario hundido = más incendios.

### Rareza de los eventos (`RARITIES`)

El evento del día se sortea en dos pasos: primero el **nivel de rareza** (ponderado,
renormalizando entre los niveles con eventos sin usar en la ventana) y después un
evento de ese nivel. A mayor rareza, menor probabilidad y **mayor impacto**:

| Rareza | Peso | Pool | Magnitud típica |
|---|---|---|---|
| Común | 55% | 10 | ±5 de stat, ±10/20 de energía (los originales) |
| Infrecuente | 27% | 11 | ±8 de stat, ±12 de energía, o un modificador del día |
| Rara | 13% | 8 | ±10-12, combos de dos stats, lesión en la práctica, +25 energía |
| Legendaria | 5% | 5 | Campaña-defining: +5 a TODAS las stats, +3 PERMANENTE al mejor delantero, brote de gripe (−25), todas las acciones ×2 |

Con ~19 eventos por run completa, una legendaria aparece ~1 vez por run: es un
momento, no una rutina. El diario marca las legendarias con tono dorado.

### Eventos como modificadores del día (`run.dayMod`)

Algunos eventos no tocan números: **cambian el problema de hoy** (Bible §4.5). Su campo
`mod` queda en `run.dayMod` (dura exactamente un día) y multiplica el rendimiento de las
Acciones del Día: `entrenar ×2` (doble turno), `entrenar 0` (cancha anegada: bloqueada),
`recuperar ×2` (spa), `recuperar ×0.5` (ola de calor y **jet lag**, Sprint 4), `tactica 0` (alineación filtrada),
todas ×2 (legendaria "El día que todo sale"). El multiplicador escala la **recompensa**;
el costo de energía de entrenar no se escala. La UI muestra el modificador como banner
en el panel de acción y bloquea/etiqueta los botones afectados.

> **Asimetría deliberada**: los modificadores-premio solo pagan si ELIGES la acción
> potenciada (habilidad de lectura); los castigos aplican solos. Con decisiones al azar
> el smoke pierde ~1-3 pp de campeón respecto a la versión sin rarezas — un DT humano
> que aprovecha los ×2 recupera esa diferencia. Es la "ventaja del DT humano" (§6).

### Eventos-problema (Sprint 4)

Bible §4.5: **los eventos deben generar problemas, no repartir premios**. Hasta el Sprint 3
casi todo el contenido movía aura o energía en una sola dirección. El Sprint 4 sumó tres
sucesos cuyo rasgo común es que **las dos (o tres) ramas cobran algo**:

| Suceso | Tipo | El problema que plantea |
|---|---|---|
| 🥱 **Jet lag** | Evento (infrecuente) | Modificador del día: **Recuperar rinde la mitad**. Rompe el plan del DT justo en la palanca más sensible del juego, sin tocar un número del plantel |
| 🏋️ **El preparador físico pide más** | Conflicto | Cargar la pierna (−18 de energía a todos, +0.15 de táctica) **o** bajar la carga (+8 de energía, −5 de Aura). No hay rama gratis |
| 🕳️ **Fuga en el vestuario** | Conflicto (3 opciones) | Apartar al filtrador (−10 de Moral, +5 de Aura, su Momento cae) · taparlo (45% no pasa nada, si no **−14 de Moral**) · hablar de frente (−10 de energía a todos). Cada rama paga en una moneda distinta: Moral, riesgo o energía |

El pool de conflictos pasó de 6 a **8**; el de eventos inevitables, de 33 a **34**.

### Interacciones cruzadas (Sprint 4)

Profundidad barata: reglas que conectan dos sistemas que ya existen, sin sumar sustantivos
nuevos al dominio. Ambas son **castigos sin premio espejo**, a propósito.

| Cruce | Regla | Dónde vive |
|---|---|---|
| **Energía → Lesión** | Un golpe en juego es más probable que resulte GRAVE cuanto más vacío está el jugador: multiplicador **1.0 → 1.8** lineal desde energía 50 hacia el piso (5). Escala la *gravedad*, no la *frecuencia* de golpes: el cansancio no provoca más choques, hace que terminen peor | `medical.fatigueInjuryMult`, aplicado en `match/incidents.injuryEvent` |
| **Momento → Moral** | Si al cerrar el partido hay **4+ jugadores en momento ≤2** (Paupérrimo/Apagado), la Moral pierde **−5 extra**, con su línea propia en el análisis. Castigo **plano**: no escala con la cantidad, para que sea un dial y no una espiral | `morale.applyMoralePostMatch` (corre después del cierre de Momento de todo el plantel) |

El cruce Energía→Lesión refuerza la rotación del Sprint 3 con una consecuencia que se siente.
Costo medido: le quita ~1pp a la estrategia "siempre Entrenar" (que ya paga energía) — se
acepta porque es exactamente el trade-off que la regla quiere expresar.

Dentro de una ventana no se repite el mismo suceso (se sortea sin reposición).
El calendario del hub muestra de antemano **solo la temática** de cada día
(Entrenamiento · Estado físico · Vestuario · Entorno, siempre con el mismo icono y
color): sabes *de qué* vendrá el golpe o el regalo, no *cuál* es — información
aproximada, como pide el Game Vision.

### El World Cup Daily (`buildDaily`)

Cada día nuevo arranca con **la portada del Diario del Mundial** (Bible §4.4): 1-5
titulares generados desde el estado real de la run, ANTES del evento del día — primero
informar, después transformar. La jerarquía es la del Bible y el orden de armado ES la
prioridad (el primer titular es la nota de tapa):

| Prio | Sección | Fuentes |
|---|---|---|
| P0 | PORTADA | Día de partido: la tapa es el partido, nada compite con el clímax |
| P1 | PLANTEL | Reacción de la prensa al partido de ayer (por resultado) · parte médico · suspendidos · en capilla · goleador con ≥2 goles · energía media <60 · posición en el grupo |
| P1.5 | GRUPO | Anoche en MI grupo (rivales directos), señalando al **próximo rival** si jugó |
| P2 | RIVAL | Suspendidos del próximo rival (`run.rivalBans` — scouting accionable, se repite hasta que la cumpla) · framing por paridad de medias, **solo en la previa** (≤2 días): repetirlo toda la ventana era ruido |
| P3 | MUNDIAL | Hasta 2 titulares puntuados de `run.lastNight`, ver abajo |
| P3.5 | HOY | El `teaser` del evento/conflicto que trae el día (Bible §4.4: el Daily anticipa — "se esperan lluvias" — y el evento materializa). Insinúa el tema sin revelar magnitud ni rareza |
| P4 | COLOR | `DAILY_FLAVOR`, solo si hay <3 titulares y máximo 1 |

Es **solo lectura** (no muta la run; el pick del flavor consume rng). La densidad
variable es deliberada: los días tranquilos hacen que los días grandes se sientan
grandes.

### El mundo se mueve entre partidos (`tournament/world.js`)

Ley 7 del Game Vision: el Mundial continúa sin el jugador. Los partidos ajenos de la
fecha/ronda actual ya NO se simulan de golpe al cerrar mi partido: **se reparten por
los días del calendario**. Cada mañana, `advanceDay` llama a `playWorldDay`, que
simula `ceil(pendientes / días_restantes)` partidos (~5 por noche en grupos) y los
deja en `run.lastNight` — la materia prima del Daily. No hay plan almacenado: lo
pendiente se deriva del estado (resultados por par en grupos, `run.koPlayed` en
eliminatorias), y `finishGroupMatchday`/`finishKnockoutRound` cierran lo que falte
cuando yo juego. Efecto colateral buscado: las tablas del hub y de "Estado del
Mundial" **evolucionan entre mis partidos** (PJ dispares a mitad de ventana) y los
cruces ajenos ya resueltos muestran su marcador.

**Puntaje de los titulares del MUNDIAL** (por partido de anoche): batacazo por tier
(un "Sorpresa/Leyenda" venciendo a un "Favorito", +100) o por gap de media ≥12 (+60 —
umbral alto a propósito: un batacazo diario devalúa la palabra) · favorito eliminado
en KO (+50) · goleada margen ≥3 (+25) · festival 5+ goles (+20) · cruce KO (+15) ·
media del ganador ≥85 (+12) · roja (+8). Entran los 2 mejores con puntaje ≥12; una
roja de un partido que no llegó a titular puede entrar como "escándalo" aparte.

### Rojas ajenas con consecuencia real (`run.rivalBans`)

La roja de un partido ajeno (9% por partido, cae más en el perdedor) **suspende de
verdad** a esa figura para el próximo partido de su equipo. Si ese partido es contra
mí: el diario lo avisa cada mañana ("Buena noticia: Wirtz está suspendido…") y su
alineación se genera sin él. Para que la baja DUELA, los rivales no jugables ahora
tienen **plantel de 10** (`genOpponentSquad`): sus 5 figuras + 5 genéricos
"Jugador6..Jugador10" que cubren todas las líneas (incluido un arquero suplente) con
un malus de −4 sobre el rating (−6 derivaba el % de campeón: el 6º titular por
defecto ya es un genérico). Si su próximo partido es contra otro simulado, la
suspensión se cumple sin efecto en el marcador — quickSim no modela planteles.

### Plantel diezmado: el partido se juega igual (`maxLineupSize`)

Descubierto por el smoke (~1 cada 5.000 runs): con 4+ bajas de campo simultáneas un
plantel de 10 no puede formar 6 (el 2º arquero no juega en cancha) y la run moría en
softlock. Regla nueva: si no llegas a 6, **presentas a los que queden en pie** —
`validateLineup` lo acepta (`short: true`), el hub lo avisa (🆘) y el motor aplica la
misma pena de inferioridad numérica que una roja (§5). Perder por diezmado es una
historia; un botón bloqueado no.

> 🐛 **El DOBLE castigo del plantel sin arquero (arreglado el 1-ago-2026).** La regla de
> arriba dice que jugar corto se paga **una** vez, con la pena de inferioridad. Se pagaba
> dos. Cadena: sin ningún POR disponible el once se arma con **5 de campo**;
> `formationLabel` cuenta solo DEF/MED/DEL y **da por sentado el arquero**, así que devuelve
> etiquetas como `"1-1-3"` que suman 5 y **coinciden con una formación real de 6**;
> `currentLineup` la adoptaba y `orderBySlots` pedía entonces 6 slots para un pool de 5. Sin
> nadie de `pos === "POR"`, su `findIndex` fallaba y caía en `pool[0]` — el slot del arquero
> se comía a un defensor y **todos los demás se corrían una línea hacia atrás**: DEF→POR,
> MED→DEF, DEL→MED, **tres castigos de −6** encima de jugar en inferioridad.
>
> **Arreglo**: el label solo identifica una formación si el once la cubre entera
> (`lineup.length === 6`). Con `id = null`, `orderBySlots` no toca nada y cada uno juega en su
> puesto natural. **La etiqueta de formación es ambigua por construcción** — describe cuatro
> líneas con tres números — y esa ambigüedad solo aparece cuando falta el arquero.
>
> **Cómo se encontró, que es la lección**: lo cazaba `smoke.js:115` ~1 vez cada 4.000 runs y
> **sin decir quién ni por qué** (el `assert` no llevaba contexto). Un barrido de balance a
> n=4000 lo hizo saltar; reproducirlo pidió atacar `currentLineup` de frente con planteles
> diezmados sintéticos (82.800 combinaciones → 6 firmas, todas `POR:0` + 5 de campo). Mismo
> criterio que la ley de `powers.test`: **un invariante raro del smoke no es un test** — mide
> la frecuencia, no la causa.

### La Acción Principal del Día (`DAY_ACTIONS`, `applyDayAction`)

Además del suceso que le toca, **cada día sin partido el DT elige exactamente UNA
acción** (Core Gameplay Bible §4.7: un día = una inversión, con opportunity cost).
El orden dentro del día es el del Bible: primero el evento cambia el contexto,
después el DT decide. No se puede pasar el día sin elegir. Las acciones
(`content/day-actions.js`):

| Acción | Efecto | Trade-off |
|---|---|---|
| 🎯/🛡️/🎩/🏹/💨 **Entrenar** (5 focos: ataque, defensa, pase corto, pase largo, velocidad) | +1 al buff de la stat elegida (`TRAIN_BUFF`) | **−5 de energía** a todo el plantel · el foco de **velocidad cansa −8** (`VELOCIDAD_FATIGUE_EXTRA`: son piques, no un rondo) |
| 🧘 **Recuperar** | +15 de energía a todo el plantel (`RECOVER_ENERGY`, subido de 10 el 2-ago-2026: desde que se retiró el descanso pasivo diario es la ÚNICA fuente de energía fuera del banco — ver §Energía) | No mejora ninguna stat |
| 📋 **Plan de partido** (arco de Progresión) | **Declara la identidad del próximo partido** (4 focos = las 4 filosofías): pasa a ser la activa (sesga el pool) y su XP de ese partido rinde **×1.5** (`PLAN_XP_MULT`) | **No otorga NADA por sí mismo**: ni stats ni experiencia — el GDD prohíbe subir filosofías desde el menú. Se cobra jugando |
| 🤝 **Team Bonding** (Sprint 3) | +10 a la **Moral del equipo** (`BONDING_MORAL`) | **−5 de energía** a todo el plantel (`BONDING_FATIGUE`) |

**Team Bonding** (decisión PO 20-jul-2026) es la palanca para gestionar la Moral a voluntad,
ahora que la Moral **muerde** (Sprint 2: modula los conflictos de vestuario). Es
**situacional a propósito**: solo conviene con el vestuario caldeado — con la moral arriba
es un día tirado, y el hub avisa cuándo hace falta ("🎭 Vestuario caldeado"). El contenido
muta `run.moral` con primitivas + clamp, sin importar `game/` (ARQUITECTURA §4).

Calibración: el foco de entrenamiento es **+1 y no +4** (el PO lo bajó el 17-jul: con +4
el buff dominaba la preparación y el canje —ver abajo— se conseguía en un solo día).
Un +1 mueve el poder del equipo apenas ~+0.02 (§5), pero es **elegible** (siempre apunta
a la stat que quieres), mientras que los eventos de ±5 caen donde caen — a igual magnitud,
elegible gana.

**De Sesión Táctica a PLAN DE PARTIDO (arco de Progresión, 28-jul-2026).** La acción
nació como buff (+0.1 atk/def) y F1 la convirtió en el motor de la identidad (+1 a una arista).
El GDD del arco de Progresión prohíbe lo segundo —"las Filosofías ya no pueden mejorarse desde
el menú de preparación"— así que la acción cambió de trabajo por tercera vez y ahora **no
otorga nada**: declara qué fútbol va a jugar el equipo. Elegir un plan (1) fija `run.filoId` (la
identidad activa, que sesga el pool de secuencias) y (2) deja `run.planFilo`, que multiplica
**×1.5** toda la XP que ese partido le deje a esa idea. El día invertido no compra puntos:
compra INTENCIÓN, que es exactamente el 70% del GDD. El cambio de identidad a mitad de run
(modal desde la pantalla de la pizarra) hace lo mismo y cuesta lo mismo: la Acción del Día.

> ✅ **RESUELTO (20-jul-2026) — Entrenar estaba dominado; se arregló con el rebalance del
> factor de energía (§4).** Se deja abajo el diagnóstico completo porque la metodología es
> reutilizable: así se audita una acción sospechosa de estar muerta. Tras el arreglo,
> Entrenar rinde 21.5% como estrategia fija (−6.4pp vs el mixto, antes −16.9pp).
>
> ⚠️ **DIAGNÓSTICO ORIGINAL: Entrenar estaba dominado.** El smoke
> gana un flag `--action=<id|grupo>` para comparar ESTRATEGIAS FIJAS y auditar el "no
> dominant strategy" del Bible. Medido con BRA (n=1500, canje activo):
>
> | Estrategia fija | Campeón |
> |---|---|
> | Siempre Recuperar | 39.5% |
> | Siempre Sesión táctica | 36.1% |
> | Siempre Entrenar (foco único) | **12.0%** |
>
> No es que Entrenar "no domine": **nunca conviene**. Causa medida: el −5 de energía a los
> 10 jugadores cada día se acumula, y la energía es la palanca más fuerte del juego (entra
> como factor multiplicativo en `effStat`, §4). Con `TRAIN_FATIGUE = 0` la misma estrategia
> rinde **36.3%** — el costo explica el 100% del problema, no el premio.
>
> **Ningún dial barato lo arregla** (todo medido): bajar la fatiga a 3 sube Entrenar a 18.9%
> pero dispara el juego mixto a 33.0% (fuera del gate ±2pp); subir `TRAIN_BUFF` a 2-3 casi no
> mueve Entrenar (12→14%) y sí infla el mixto; bajar `CANJE_THRESHOLD` a 3 tampoco (12→12.9%);
> y recortar `RECOVER_ENERGY` de 10 a 6 **no toca** a "siempre Recuperar" (39.5→39.1%) porque
> esa estrategia ya vive con la energía al tope — lo que gana no es el +10, es **no pagar
> costos**. *(Comprobado en la dirección contraria el 1-ago-2026: subirlo a 15/20/25 tampoco lo
> mueve — 10.0/10.9/9.8/10.4. La constante es inerte en las dos puntas para quien la usa a
> diario; el barrido completo y por qué se descartó están en §10.)* El arreglo real exige
> rebalancear la economía de energía o su curva de impacto en
> `effStat`, que cambia la dificultad del juego entero. **El PO eligió exactamente eso**
> (20-jul-2026) sobre las otras dos alternativas medidas: un "piso de energía" al entrenar
> (arreglaba poco — 15.7%) y abaratar Entrenar subiendo el cansancio del partido (que
> derrumbaba la Sesión táctica, 36→29%: cambiaba una acción rota por otra). Las constantes
> de `day-actions.js` quedaron intactas — el arreglo vive en el factor de energía de §4.

#### El canje de entrenamiento (`canjeBuff`, Bible cap.6 "Permanent Growth")

Los buffs de stat son temporales (se limpian al terminar el partido). El **canje** deja
convertir ese trabajo en crecimiento **permanente**: cuando el buff de una stat real llega
a **+4** (`CANJE_THRESHOLD`) en "Efectos próximo partido", el DT puede canjearlo por **+1
permanente** (`CANJE_PERMANENT`) a esa stat para **todo el plantel** que la tenga (atajadas
solo alcanza a los arqueros, etc.). El canje **descuenta 4 del buff** (renuncias al boost
del próximo partido) y es **gratis** —no consume la Acción del Día: el costo ya se pagó
acumulando el +4—. El crecimiento nunca decrece y respeta el techo de 99; como toda mejora
de la run, no se traslada a otras runs (Bible cap.6). Escribe `squad[].stats` desde
`game/day-action.js` (si la progresión crece —equipo, cuerpo técnico— se mudará a
`game/progression.js`).

**Balance — poder asimétrico (precedente FEAT-003 / Momento).** Los rivales no canjean:
es ventaja del DT humano, vigilada por el smoke. Como el modelo lee `run.buffs` de
**cualquier fuente**, en la práctica las **oportunidades** (que vuelcan +5/+7/+10 a una
stat) son las que más habilitan el canje. Con +2 permanente el techo (smoke greedy, BRA
n=4000) saltaba a **35.5% (+4.4pp** sobre el baseline 31.1%): fuera del gate ±2pp → se
recortó el efecto **+2 → +1** (decisión del PO 18-jul, no se relaja el gate). Con +1:
**32.8% (+1.7pp)**, dentro del gate — costo aceptado y documentado, igual que el residual
del Momento. Próximos diales si vuelve a derivar: bajar el reward, subir el umbral o contar
solo lo entrenado (excluir oportunidades).

Medido tras introducirla (1500 runs, decisiones al azar): BRA 34.9%→35.8%, CAN
37.6%→37.0%, CPV 9.9%→10.1% de campeón — dentro del ruido; el diario crece de ~40 a
~70 entradas por run (una por acción). Tras sumar rarezas y modificadores (16-jul-2026):
BRA 32.1%, CAN 35.8%, CPV 8.9% — la baja leve es la asimetría deliberada descrita arriba.

Las palancas de la economía:

- **Energía** (0–100): **jugar CANSA** — cada partido resta **−14 cada 30' disputados**
  (`matchFatigue`: un titular de 90' pierde −42; un suplente que entra a los 30' del final,
  −14). Subió de −10 a −14 en el rebalance del 20-jul-2026, acoplado a bajar el peso de la
  energía en el rendimiento — hoy ese peso es la **banda verde** (§4): sobre 65 no pesa,
  bajo 65 castiga convexo. El que **descansó** (no jugó ese partido) recupera **+30**
  (`REST_RECOVERY`) — rotar sigue siendo una estrategia real. Alimenta el factor de
  `effStat` (§4), así que descuidar la energía castiga de verdad. Los rivales siempre están
  al 100% (asimetría en contra del DT humano). Para poder decidir la rotación, la
  **Gestión de Plantilla muestra la energía de TODO el plantel** ordenada del más cansado
  al más entero (Sprint 3). Y la oportunidad rara **🛌 Plan de descanso a medida**
  (`descanso_dirigido`) recupera **+25 a UN jugador que elige el DT**.

  > ⛔ **SE ELIMINÓ EL DESCANSO PASIVO DIARIO (decisión PO, 2-ago-2026).** Hasta acá,
  > `applyDailyRecovery` (en `advanceDay`) devolvía **+8 energía por día de preparación y
  > +2 el día de partido** a TODO el plantel, jugara o no — pasar un día ya recuperaba solo.
  > Se retiró por completo: la **ÚNICA** fuente de energía que queda fuera del banco
  > (`REST_RECOVERY`, arriba) es la acción **🧘 Recuperar**. El objetivo del PO: que
  > gestionar energía sea una decisión real y no un colchón que corre solo.
  >
  > **El impacto medido confirmó por qué este dial estaba marcado como el más sensible del
  > juego** (ver el párrafo histórico más abajo: ~5pp de campeón por punto). Sin compensar
  > nada más, BRA n=4000: piso **19.2% → 6.3%** · techo `--smart` **30.7% → 13.3%**. Se
  > compensó subiendo `RECOVER_ENERGY` (la acción Recuperar) de **10 a 15** — el barrido
  > viejo de esta constante (ver más abajo) la había declarado INERTE, pero esa medición es
  > de cuando el pasivo todavía vivía: sin él, el botón pasó a ser la única palanca y
  > respondió fuerte. Con 15, BRA n=4000: piso **8.3%** · techo **27.1%**.
  >
  > **✅ NUEVOS ANCLAJES (reemplazan al piso ~19% / techo ~30% de §10): piso ~8% · techo
  > ~27%.** El techo casi no se movió (−3.6pp: el DT que ya gestionaba energía a propósito
  > absorbe el golpe); **el piso sí, y a propósito**: el que decide al azar ahora paga caro
  > por no gestionar. Efecto de método, para la escalera de estrategias (§La escalera de
  > estrategias más abajo): con el botón en 15, **Siempre Recuperar (11.0%) le gana al piso
  > mixto (8.3%)** por primera vez — hoy administrar energía a rajatabla vale más que jugar
  > "normal", aunque sigue muy lejos de `--smart` (27.1%).

  > **Lo que sigue histórico, sin cambios de código:** hasta el 2-ago-2026, "la víspera del
  > partido también descansa" arreglaba un bug donde el día de partido salía de `advanceDay`
  > antes de cobrar el pasivo — ya no aplica, porque el pasivo entero se retiró. Y el barrido
  > de `DAILY_RECOVERY`/`RECOVER_ENERGY` de abajo describe la economía ANTES del cambio:
  > queda como referencia del método, no como valores vigentes.
- **Ritmo / Oxidación** (R1, 22-jul-2026): la contracara de descansar. Cada día de
  preparación sin **Entrenar / Sesión Táctica / cambio de identidad** suma a
  `run.diasSinEntrenar`; al 3º el plantel se **oxida** y rinde menos en el próximo
  partido (§4, `oxidMult`: racha 3 −2% · 4 −8% · 5+ −18%). **Jugar devuelve el ritmo**
  (el reset vive en `flow.postMatchUpdate` — el partido se juega con la racha que traías).
  Visible en el hub (chip ⚙️ Ritmo + aviso si está oxidado), en la Gestión de Plantilla
  (línea en la card de energía) y narrado en el Diario la primera vez que se enciende
  (`game/oxidation`). Hace que "solo recuperar" deje de ser gratis sin tocarle un número
  a Recuperar: el seguro sigue siendo seguro — lo letal es no construir.
- **Buffs de stat** (±5 por evento): se **acumulan** día a día hasta el próximo
  partido y se limpian al terminarlo. Son ±5 y no ±10 porque con 4-5 días de eventos
  por ventana el apilamiento esperado equivale al antiguo evento único de ±10.
- **Efectos permanentes**: algunos conflictos tocan el aura base del plantel (±5) o
  la energía; esos no se limpian.

> **Por qué días de partido sin eventos.** El día de partido es el clímax: nada debe
> competirle. Además separa limpiamente "preparar" (días) de "ejecutar" (partido).

### Disciplina: amarillas acumuladas y suspensiones

Cada amarilla que un jugador recibe en un partido (sin llegar a la roja) se **acumula
en el torneo** (`p.amarillas`, en `postMatchUpdate`). Las reglas:

- **2 amarillas acumuladas → suspendido el próximo partido** y el contador vuelve a 0.
- **Doble amarilla en un mismo partido = roja**: suspende el próximo partido pero NO
  suma al acumulado (igual que en la FIFA real).
- Con 1 amarilla el jugador queda **apercibido**: se marca 🟨 en el hub y en Gestión
  de Plantilla, y el relato del partido avisa si vuelve a ser amonestado.
- **Limpieza** (`clearAmarillas`): los contadores se borran al **terminar la fase de
  grupos** y al **terminar los cuartos de final** (regla del PO, calcada de la FIFA).
  Las suspensiones ya ganadas NO se perdonan: la tarjeta se limpia, el castigo se cumple.

Medido en smoke (400 runs, decisiones al azar): ~0.03 suspensiones por acumulación y
~0.08 por roja por run. La acumulación es rara — es el techo de drama, no rutina.

### Moral del equipo (`run.moral`, `game/morale.js`)

Estado anímico **colectivo 1..100** (nace en 50), con 5 bandas: Por el suelo (1-20),
Baja (21-40), Estable (41-60), Alta (61-80), Por las nubes (81-100). Reacciona a los
resultados y a **cómo** se dan (en `postMatchUpdate` + `advanceStage`):

| Qué pasó | Δ moral |
|---|---|
| Victoria / derrota / empate | +10 / −10 / 0 |
| Gol agónico (≥85') que decide: triunfo por la mínima / nos ganan al final | +5 / −5 |
| Empatarlo al final / que te lo empaten al final | +4 / −4 |
| Ganar / perder la tanda de penales (extra) | +3 / −3 |
| **Vestuario apagado**: 4+ jugadores en momento ≤2 (Sprint 4) | **−5** (plano) |
| Pasar de ronda (clasificar de grupos o avanzar en KO) | +5 |

Visible en el hub (fila dentro del bloque de plantilla, con banda y barra), en la
Gestión de Plantilla (a la izquierda de la media) y en el Daily cuando es noticia (por
las nubes, baja o por el suelo). Cruzar de banda escribe en el Diario de Campaña;
moverse dentro de una banda es silencioso. Los eventos de `content/` pueden mutarla
directo (`r.moral = clamp(...)`, p. ej. `pais_ilusionado` +8, `critica_demoledora` −8).

**Efecto mecánico — la turbulencia del vestuario (Sprint 2, decisión PO 20-jul-2026).** La
Moral modula la **frecuencia de conflictos de vestuario** de la ventana entre partidos
(`game/calendar.conflictChanceFor`, simétrica alrededor del 0.25 base):

| Banda | Chance de conflicto por día |
|---|---|
| Por las nubes | 0.12 |
| Alta | 0.18 |
| Estable | **0.25** (base) |
| Baja | 0.34 |
| Por el suelo | 0.42 |

Se lee `run.moral` al **agendar** la ventana (en `postMatchUpdate`, cuando la moral ya trae
el resultado), así que toda la semana refleja el ánimo con que saliste del último partido:
una mala racha llena el vestuario de dilemas, una buena lo serena. Es el efecto
**auto-correctivo** que eligió el PO — muerde cuando ya vas mal, sin premiar al favorito con
más poder (a diferencia de acoplar la Moral al Momento o a la energía, que habrían inflado el
boost asimétrico). El hub avisa el clima ("🎭 Vestuario caldeado / en paz") y el Daily lo
telegrafía. **Balance neutral**: BRA 28.5% n=4000 = baseline (los conflictos son de EV mixto
—algunos regalan buffs permanentes, otros son riesgo puro—, así que modular su frecuencia no
mueve sistemáticamente el % de campeón). Diales si deriva: `CONFLICT_CHANCE_BY_BAND`.

> **El efecto EN-PARTIDO llega en el Sprint A3** (ya hay capa de secuencias, §6): la Moral sesgará
> el **TIPO** de secuencia (no el número — decisión PO), enchufándose en `sequences.js`; requerirá
> pasar la moral por `matchCtx` porque el motor del partido no conoce la run.

### Goleadores del torneo (`run.scorers`, `game/scorers.js`)

El motor solo produce marcadores (`quickSim`: gA-gB), no autores. La tabla de goleadores
le pone nombre a cada gol repartiéndolo entre las **figuras del equipo, ponderando por
posición** (`POS_GOAL_WEIGHT` DEL 3 · MED 2 · DEF 1 · POR 0.05): coherente aunque no sea
un simulador de goleadores real (un delantero anota mucho más seguido que un defensa).

- Los goles de **equipos ajenos** (partidos simulados del mundo vivo y el rival de MIS
  partidos) se acumulan en `run.scorers` (`"teamId|name" → {teamId, name, goles}`), vía
  `assignScorers` desde `tournament/world.simWorldMatch` y `flow.closeMatch`.
- Los goles de **mi equipo** NO entran ahí: ya son exactos en `run.squad[].goles`
  (fuente de la ficha, el Daily y el cierre). `tournamentScorers(run)` combina ambos al
  vuelo, ordena por goles (desempate alfabético) y asigna **ranking de competición**
  (mismos goles → misma posición: 1·2·2·4…). Así no hay doble conteo.
- La tanda de penales **no** cuenta como goles (solo el marcador de juego).

Visible como card top-5 en el hub (clic → pantalla con la tabla completa). No afecta el
balance: solo consume rng al asignar autores (desplaza la secuencia, sin cambiar el
modelo — verificado, BRA campeón sin deriva).

### Asistidores del torneo (`run.assists`, `game/assists.js`) — Sprint 1

Espejo exacto de los goleadores, otra estadística. El motor no modela pases, así que a una
**fracción de los goles** (`ASSIST_CHANCE` = **70%**; penales y jugadas individuales no llevan
asistencia) se le atribuye asistidor, repartido entre las figuras ponderando **pro-MED**
(`POS_ASSIST_WEIGHT` MED 3 · DEL 2 · DEF 1 · POR 0 — el arquero **nunca** asiste). Es lo que
hace que el sistema alimente sobre todo a los **mediocampistas**.

- Asistencias de **equipos ajenos** → `run.assists` (`"teamId|name" → {teamId, name,
  asistencias}`), vía `assignAssists` desde `world.simWorldMatch` y `flow.closeMatch`.
- **Mis** asistencias son EXACTAS: las atribuye el **partido interactivo** al convertir
  (`chances.goalMine` → `run.squad[].asistencias`) — la jugada de "pase" firma al pasador,
  el remate de jugada abierta sortea un compañero pro-MED, y el VAR que anula el gol también
  revierte la asistencia. Mi equipo NO entra en `run.assists` (sin doble conteo).
- `tournamentAssists(run)` combina ambos, ordena y da ranking de competición (1·2·2·4).

En el hub, la card de goleadores es un **carrusel** de 2 pestañas (⚽ Goleadores / 🅰️
Asistidores); la pantalla completa tiene el mismo toggle. Igual que los goleadores, solo
consume rng (desplaza la secuencia, sin cambiar el modelo).

### Decisión de "último hombre" (`game/match/chances.js`) — Sprint 1

Nueva decisión de partido (id `last_man`, contrato §3.2): el **25%** de las ocasiones
peligrosas del rival (si hay un DEF mío en cancha) se convierte en una elección para ese
central — **anticipar · barrerse · esperar** — ponderada por su `defensa` vs el ataque rival
(el `aura` da temple al anticipar).

| Opción | Si sale | Si falla | Momento |
|---|---|---|---|
| **Anticipar** (paso al frente) | corte limpio | el delantero queda de cara al arco → **gol muy probable** (sin tarjeta) | **+1** al cortar |
| **Barrerse** (barrida) | corte limpio | falta → **PENAL** en el área, o tarjeta (amarilla, a veces **roja** de último hombre) | **+1** al cortar; **−1** por tarjeta/penal |
| **Esperar** (contener) | baja la peligrosidad → remate normal a atajar | — | **nunca** da Momento |

El error se paga con su **consecuencia natural** (gol/penal/tarjeta); el −Momento llega
**solo** por tarjeta o penal (no por el gol de un anticipe fallado). Barrerse es más arriesgado
que anticipar en tarjetas. Ayuda a **defender** y da Momento a los **DEF** — poder asimétrico
(los rivales no deciden), así que su eficacia se **calibró para quedar neutra en goles jugada al
azar** (baseline preservado); el humano que decide bien saca la ventaja. Diales si deriva:
frecuencia (`LAST_MAN_CHANCE`) y probabilidades de corte/gol/penal/roja — **no el gate**.

### Diario de Campaña (`run.journal`)

La memoria narrativa de la run (Game Vision: "el calendario es la memoria"). Cada
entrada lleva `{day, icon, title, desc, tone}` y la escriben el motor
(`addJournal`: sorteo, eventos del día, lesiones, suspensiones, limpiezas de
amarillas) y la UI (conflictos con la opción elegida, partidos, hitos de
clasificación, desenlace). Se lee agrupado por día en la pantalla **Diario de
Campaña**, accesible desde el hub y desde el desenlace ("Revivir la campaña").
Promedio medido: ~35 entradas por run. Vive solo en la run (no se persiste en
`wc26_history`).

---

## 9b. LA PROGRESIÓN: Filosofías, Director Técnico y Puntos de Identidad

> Arco de Progresión (28-jul-2026, GDD del PO). Reemplaza el modelo de F1/T1 donde el
> nivel de identidad salía de sumar dos **aristas** entrenadas en el menú. Las aristas
> murieron como mecánica; sobreviven solo como sabor (los 2 principios que describen a
> cada filosofía en la vitrina). **La identidad ya no se asigna: se aprende jugando.**

### El modelo, en una frase

Se aprende el fútbol que se juega (Skyrim): cada jugada de un tipo le da XP a la
filosofía dueña de ese fútbol → la filosofía sube de nivel → cada nivel paga XP al
Director Técnico → cada nivel del DT imprime 1 Punto de Identidad → los PI compran
rasgos en el árbol.

### 1. Las 4 filosofías progresan por separado

`run.filoXp = {press, posesion, contra, bloque}`, nivel 1..10 cada una (`FILO_LEVELS`,
`content/philosophies`). Todas nacen en 1, sea cual sea la elegida. La escalera es de
**XP acumulada** con costos crecientes `250·300·360·430·510·600·700·810·930` (nivel 10 a
las **4.890 XP**). `mult` (×1.35→×2.10) y `etapa` (0-2) no se tocaron: el sesgo del pool,
la brecha R3 y el rival siguen midiendo en ETAPAS, exactamente como antes.

`run.filoId` es la que **se juega** (sesga el pool); `run.filoInicial` es la **escuela**
del DT: se fija al empezar y no cambia nunca.

### 2. La XP del partido: 70% intención / 30% efectividad

| Fuente | Constante | Cuándo |
|---|---|---|
| **Intención** | `XP_INTENCION` = 73 | cada secuencia de ese fútbol que ARRANCA (`noteFiloIntent` en `startSequence`) |
| **Efectividad** | `XP_ACIERTO` = 32 | cada acto que sale bien + el gol que corona (`noteFiloHit`) |

Con ~2-3 jugadas y ~2-3 aciertos por partido de un mismo tipo el reparto queda ~70/30,
que es la distribución objetivo del GDD.

> Nacieron en **125/55**, calibrados contra una densidad de **2-6 jugadas por partido**. El
> sprint de la Densidad (31-jul-2026) los bajó a **73/32** ×0.58 —la razón de densidad medida—
> para que el presupuesto de XP POR PARTIDO no se moviera al pasar el objetivo a 5-9. Es el
> mismo cuidado que la lección de calibración del arco: **la escalera está calibrada contra un
> número de jugadas, así que cualquier sprint que toque la densidad tiene que tocar esto**.
> Verificado tras el cambio: filosofía tope 6.0/10 y DT 12.7/20, idénticos a antes del sprint.

Qué filosofía aprende cada tipo de secuencia (`FILO_BY_TIPO`; las avanzadas mandan con
su `advFor`):

| Tipo | Enseña | Por qué |
|---|---|---|
| `recuperacion` · `caceria` | Press | recuperar en campo rival |
| `circulacion` · `sinfonia` | Posesión | cadenas de pases, romper líneas |
| `transicion` · `contra_letal` | Contragolpe | robar y atacar el espacio |
| `pelotazo` | Bloque bajo | el duelo directo |
| `repliegue` · `fortaleza` | Bloque bajo | defender organizado y neutralizar |
| `balon_parado`, `salida_fondo` | — | no son identidad de nadie |

`repliegue` y `fortaleza` son `side: "opp"` y aun así enseñan: aguantar el bloque ES el
fútbol del Bloque bajo (`DEF_XP_TYPES` en `match/sequences`).

### 3. Afinidad: la escuela decide la velocidad

La filosofía **inicial** multiplica toda la XP de la run (`AFINIDAD`). Eje proactivo
(Press · Posesión) contra eje reactivo (Contra · Bloque):

| Escuela | ×2 | ×1.25 afín | ×1 neutral | ×0.6 opuesta |
|---|---|---|---|---|
| Press | Press | Posesión | Contra | Bloque |
| Posesión | Posesión | Press | Contra | Bloque |
| Contra | Contra | Bloque | Press | Posesión |
| Bloque | Bloque | Contra | Posesión | Press |

Encima se aplica el **Plan de Partido** (`PLAN_XP_MULT` = ×1.5). Los dos viajan al Match
en `matchCtx.filo.mult` **ya calculados**, así la barra que crece en vivo y la que se
acredita al cerrar son el mismo número.

Los eventos y oportunidades del calendario también enseñan (lo autoriza el GDD): un
"punto" de evento vale `EVENT_XP` = 80 XP, con la afinidad aplicada
(`addFiloProgress`, que es lo que ya llamaba todo `content/`).

### 4. El Director Técnico (`game/coach.js`)

No gana XP directa: **solo la pagan las subidas de filosofía**, según el nivel alcanzado
(tabla exacta del GDD, `FILO_LEVEL_REWARD`):

| Nivel alcanzado | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 |
|---|---|---|---|---|---|---|---|---|---|
| XP de DT | 200 | 220 | 250 | 290 | 340 | 400 | 470 | 550 | 650 |

Llevar UNA idea de 1 a 10 paga 3.370. La curva del DT (`DT_STEP` = 100 + 20·(n−1)) pide
**5.320** para el nivel 20 — a propósito: una sola filosofía al tope NO alcanza, hay que
abrir una segunda idea. Cada nivel del DT = **+1 PI**. El PI inicial no sale de acá: lo
paga elegir filosofía (que ES el nivel 1) y el flujo de inicio **obliga** a gastarlo en
uno de los 3 rasgos básicos de la escuela elegida.

### 5. Rasgos: dos requisitos y la forma del árbol

Los "Principios mínimos" se borraron de los 51 rasgos del catálogo. Queda lo que pide el
GDD —**nivel de la filosofía DEL RASGO** (básico 1 · intermedio 3 · avanzado 6 · maestro
10) y **1 PI**— más el recorrido de la rama (`previo` / `todos` / `alguno`), que es lo
que hace que el árbol sea un árbol y no una lista (decisión PO).

**Sin latencia (decisión PO 28-jul):** todos los rasgos comprados están activos a la vez,
de cualquier filosofía. `run.rasgos` sigue siendo `{filoId: [ids]}` para saber de qué
árbol es cada uno, pero `activeTraitIds` los devuelve todos. Es lo que hace real la build
híbrida del GDD.

### 6. Lo que se ve

- **En el partido**: una fila por idea con la XP que va ganando y su barra al próximo
  nivel (panel derecho), y el **skill-up en vivo** en el relato: *"🦁 min 63' — ¡HIGH
  PRESS NIVEL 4!"* (feed tipo `filo`, dorado).
- **En el post-partido**: una línea por filosofía (XP, jugadas, aciertos, multiplicador,
  y "→ ¡NIVEL n!" si cruzó) + lo que eso le pagó al DT y los PI que imprimió.
- **En el hub**: el panel del Plan de Partido con las 4 ideas, su nivel y su barra; y la
  card de identidad con la barra de la filosofía activa **y** la del DT (nivel n/20).
- **En la pizarra** (`screens/philosophy`): la franja de cabecera dejó de listar los 5
  principios y ahora lista las **4 filosofías con su nivel** — y es el selector: se
  navegan los 4 árboles. En ONBOARDING no se navega (el PI inicial va sí o sí a la
  escuela elegida) y el botón "Al sorteo" no deja pasar hasta gastarlo.

### ⚠️ Balance del arco (medido, smoke `--smart` n=400)

| | BRA | MAR |
|---|---|---|
| HEAD (sistema viejo) | 54.3% campeón · **master 86.3%** | 47.0% · master 87.3% |
| Arco de Progresión | **44.0%** campeón · master 5.0% | **40.3%** · master 6.7% |

**El juego se puso más difícil: −10.3pp en BRA y −6.7pp en MAR.** No es un efecto
lateral: es el sistema. En el modelo viejo la Sesión Táctica garantizaba +1 de arista
por día, así que el nivel 10 y el Master llegaban en el 86% de las runs; ahora el nivel
depende de cuántas jugadas de TU fútbol genere el partido, y el Master es el premio de
la run casi perfecta. Progresión medida con el greedy: filosofía tope ~7.8/10 y **DT
~14.6/20** de media (campeones: ~8.5 y **~16.2**), con el DT 20 alcanzado. Eso cae justo
en los objetivos del GDD (run promedio 12-15 · muy buena 16-18 · perfecta 20).

**¿Y el Master? La tasa del smoke medía al comprador ESPARCIDO.** Con el flag `--focus`
(el DT compra en el árbol de su escuela, siempre el nodo más profundo) el Master sale en el
**21.7%** de las runs al dial actual, no en el 5%. Respuesta del sistema al dial, medida
(BRA `--smart --focus` n=600):

Tabla medida con la densidad VIEJA (2-6 jugadas) y el dial en 125/55; tras el sprint de la
Densidad el dial es 73/32 con 5-9 jugadas, que da el mismo punto de trabajo (Master 21.9%,
filosofía tope 8.0, DT 15.4 con `--smart --focus`). Las **pendientes** de la tabla siguen
valiendo: lo que se lee acá es cuánto responde el sistema a mover el dial, no su valor absoluto.

| dial | Master | filosofía tope | DT medio | campeón |
|---|---|---|---|---|
| **125/55 (con densidad 2-6)** | 21.7% | 7.9 | **14.8** | 44.7% |
| +20% (150/66) | 34.8% | 8.5 | 16.4 | 44.2% |
| +40% (175/77) | 45.7% | 8.8 | 17.4 | 48.0% |
| +60% (200/88) | 57.2% | 9.2 | 18.3 | 44.3% |
| +100% (250/110) | 67.7% | 9.6 | 19.2 | 45.8% |

Cada +20% del dial vale ~+12pp de Master, casi lineal. **El campeón NO se mueve** (44-48%,
todo ruido): más rasgos no son más victorias — es la ley del arco de Rasgos verificada de
nuevo. Lo que sí se rompe es la **escala del GDD**: a +20% el DT medio se va a 16.4 (la run
promedio pasa a leerse como "muy buena") y a +60% a 18.3. Alternativa que NO toca la escala:
bajar el gate de los 12 Masters de nivel 10 a **9** → Master 34.0% con el DT clavado en 14.9.

**Los diales del arco, por orden de mordida:** `XP_INTENCION`/`XP_ACIERTO` (velocidad de
todo), `FILO_XP_STEPS` (la escalera), `PLAN_XP_MULT` y `AFINIDAD` (cuánto premia
especializar), `DT_STEP` (cuántos PI reparte la run). Subir los dos primeros ~25% mueve
el DT medio ~+1.5 niveles y el campeón ~+1pp (medido: 105/45 → 125/55 dio 13.2→14.6 de
DT y 45.8→44.0% de campeón, dentro del ruido a n=400).


## 10. Balance actual (medido)

Simulando **100 runs completas por equipo con decisiones "inteligentes"** (un proxy de
jugador humano competente), el % de veces que cada selección sale campeona:

| Nivel | Equipos | Campeón aprox. |
|---|---|---|
| Favorito (85+) | Argentina, Brasil, Francia, Inglaterra | 12–17% |
| Aspirante (78–84) | Colombia, Marruecos, Corea, Noruega, Senegal, Japón, USA, México | 6–12% |
| Sorpresa (68–77) | Canadá, Australia | 3–5% |
| Campaña legendaria (<68) | Nueva Zelanda, Cabo Verde | 0–3% |

Con 48 equipos en el torneo, incluso un favorito ganando ~15% de las veces es coherente:
nadie tiene la copa asegurada, que es exactamente el espíritu roguelike.

> ⚠️ **ESTA TABLA ES HISTÓRICA — el objetivo de una época con otro juego.** Se midió hace
> muchos arcos, con 18 jugables (hoy son 23) y antes de que existiera `--smart`. Su banda de
> favorito (12-17%) se fijó con "decisiones inteligentes", o sea con el equivalente del
> **techo** actual, así que **no es comparable con el techo de hoy**: contra el piso (~19) la
> distancia es mucho menor de lo que parece. Se conserva por su reparto entre niveles —
> favorito > aspirante > sorpresa > legendaria, que sí sigue vigente y se cumple (NZL 2.2%,
> CPV 2.4%).

> ✅ **EL ANCLA (decisión PO 1-ago-2026, RE-ANCLADA 2-ago-2026 tras retirar el descanso
> pasivo): piso ~8% · techo ~27% para un favorito.** Había tres números contradictorios y
> ninguno mandaba — el 12-17 de la tabla de arriba, el **~42 del arco del Rebalance** y lo
> que medía el juego. **Se resuelve así:**
>
> | | ancla (1-ago) | **ancla vigente (2-ago)** |
> |---|---|---|
> | **piso** (BRA, decisiones al azar) | ~19% | **~8%** |
> | **techo** (BRA, `--smart`) | ~30% | **~27%** |
>
> El **~42 pasa a ser historia**: era una medición pre-Escalada, nunca un objetivo. Y el
> 12-17 se jubila como ancla por lo dicho arriba (se fijó contra un techo, con otro juego).
> El ancla es de **dos números, no uno**: declarar solo el techo fue justamente lo que dejó
> quince sprints derivando sin gate (ver el trinquete en §La Escalada). **Un dial que mueva
> cualquiera de los dos más de ~2pp necesita ok del PO.**
>
> **El re-anclaje del 2-ago**: eliminar el descanso pasivo diario (`applyDailyRecovery`, ver
> §Energía) y compensar subiendo `RECOVER_ENERGY` 10→15 movió los dos números — el piso
> **~2.4×** más que el techo (piso 19.2→8.3 = −11pp · techo 30.7→27.1 = −3.6pp), porque el DT
> que ya gestionaba energía a propósito absorbe casi todo el golpe y el que decide al azar,
> no. **Es el efecto buscado por el PO**, no una deuda: gestionar energía pasa a discriminar
> de verdad entre jugar bien y jugar a ciegas.
>
> 🆕 **UN TERCER NÚMERO, Y NO ROMPE EL TRINQUETE** (sprint del Rival que Decide): `--counter`
> — el mismo DT greedy, pero que lee la identidad del rival en el informe y declara el Plan
> que la caza. **No reemplaza al techo: lo acompaña.** Medía 33.8% antes de este re-anclaje;
> re-medido tras retirar el pasivo, **30.5%** — el +3.4pp de ventaja sobre `--smart` (27.1%)
> se mantiene casi intacto.

### La escalera de estrategias, y el PISO PLANO (decisión PO 1-ago-2026, RE-MEDIDA 2-ago-2026)

Medición vigente sobre el árbol post-Escalada (BRA, n=4000 por peldaño). **La columna del
1-ago se midió CON el descanso pasivo diario vivo; la del 2-ago es DESPUÉS de retirarlo y
subir `RECOVER_ENERGY` 10→15** (ver §Energía) — el economía completa cambió, así que se
re-corrió la escalera entera, no solo el número que se tocó:

| estrategia fija | 29-jul (pre-Escalada) | 1-ago (con pasivo) | **2-ago (sin pasivo, vigente)** |
|---|---|---|---|
| siempre Recuperar | 16.0 | 10.0 | **9.9** |
| siempre Entrenar | 18.1 | 10.7 | **4.5** |
| mixto (azar = "el piso") | 27.8 / 27.3 | 18.8 | **8.3** |
| smart (techo) | 42.2 / 41.9 | 30.6 | **27.1** |
| smart + contra-elección (`--counter`) | — | — | **30.5** |

> ⚠️ **LA LEY DEL PISO PLANO SE ROMPIÓ, y es una consecuencia directa y esperada del cambio
> del 2-ago, no una regresión escondida.** Recuperar (9.9) y Entrenar (4.5) ya NO están
> empatados: **5.4pp de gap**, muy por fuera del ruido (±0.9pp a n=4000). La razón es
> mecánica: sin el pasivo, Entrenar sigue pagando su costo de energía (`TRAIN_FATIGUE`) SIN
> nada que lo repare — cada día de Entrenar puro es un día que solo gasta. Recuperar, en
> cambio, ahora es la única fuente de energía que existe fuera del banco, así que una
> estrategia que SOLO recupera deja de ser "el descuidado que no gestiona" y pasa a ser "el
> único que no se funde". **El objetivo declarado el 1-ago —ninguna estrategia de un solo
> botón debe acercarse a la copa— sigue vigente y se sigue cumpliendo** (9.9 y 4.5 están los
> dos muy lejos del smart, 27.1): lo que cambió es que ya no son *iguales* entre sí. Se deja
> como **deuda abierta** para el próximo pase de balance del arco de energía — no se
> compensa acá porque tocar `TRAIN_FATIGUE` o `TRAIN_BUFF` para volver a emparejarlas es un
> dial nuevo que hay que medir aparte, y el PO priorizó cerrar el re-anclaje del piso/techo
> primero.
>
> **Qué se gatea de ahora en más:** que Recuperar y Entrenar se queden **bien por debajo del
> mixto** (hoy 8.3) y muy por debajo del smart (27.1) — eso sigue intacto. La distancia que
> importa, **piso → smart, hoy ~19pp** (era ~12pp con el pasivo vivo): se ENSANCHÓ, que es la
> dirección correcta de la LEY del Rebalance (R4): la brecha entre jugar mal y jugar bien
> tiene que crecer, no achicarse.

> 🗑️ **El barrido de `RECOVER_ENERGY` del 1-ago (10/15/20/25, que declaraba la constante
> "casi inerte" y la dejaba fija en 10) quedó OBSOLETO por completo.** Se midió con el
> pasivo diario todavía vivo, así que "inerte" describía un mundo donde el pasivo ya
> mantenía a todos cerca del tope y el botón sobraba. Sin el pasivo el botón es la única
> palanca que queda, y por eso ahora **si** responde — de 10 a 15 el piso subió de 6.3% a
> 8.3% y el techo de 13.3% a 27.1% (medido en el re-anclaje de §Energía). Cualquier barrido
> futuro de este dial tiene que correrse contra la economía SIN pasivo: la vieja tabla no
> sirve ni de referencia.

> **Cómo re-medir.** `tests/smoke.js` simula runs completas sin UI. `node tests/smoke.js --all`
> corre las 23 jugables; `--smart` mide el techo de un DT competente y `--focus` el del árbol
> de rasgos. **Mirá la línea CURVA antes que el % de campeón**: la probabilidad condicional
> por ronda es lo único que dice si el torneo se endurece (ver §La Escalada).

---

## Resumen de una jugada de gol, de punta a punta

1. `Match.tick()` decide que arranca una **secuencia** ofensiva mía (§6, `maybeStartSequence`).
2. Se elige al protagonista según el tipo (circulación pesa al MED, transición al DEL).
3. La UI muestra el primer acto (construir/conducir); eliges seguro vs arriesgado — cada opción
   modula el `bonus` del remate (o arriesga perder la pelota).
4. La jugada **escala** al acto de definición; eliges rematar o buscar al mejor ubicado.
5. `actShot` (en `actions.js`) usa `effStat` (stats 1–99 → calidad 0–5, con energía §4) + el bonus
   acumulado; se compara con la defensa rival, sale `P(gol)` y se tira el dado.
6. Si es gol, `goalMine` lo anota con su asistidor y el VAR puede revisarlo (12% / 30% de anulación;
   los penales no se anulan por offside).
7. La secuencia cierra, el relato se actualiza y el partido vuelve al ritmo de crucero (§6).


## Botón de presión (25-jul-2026)

La primera palanca que el DT acciona **durante** el juego: hasta ahora el partido solo
ofrecía decisiones puntuales dentro de una secuencia; esto es un ESTADO que se enciende
y corre solo. Vive en `js/game/match/press.js`.

| Dial | Valor | Qué es |
|---|---|---|
| `PRESS_DURATION` | 10' | lo que dura una ráfaga (2 ticks) |
| `PRESS_COOLDOWN` | 10' | recarga desde que se apaga (2 ticks) |
| `PRESS_MAX_USES` | 5 | tope duro por partido |
| `PRESS_MOD` | atk +0.30 · def −0.20 | mismo caño que la mentalidad |
| `PRESS_POOL` | recuperación ×1.8 · pelotazo ×0.7 | el pool que genera el partido |

**El trato**: mientras corre, el equipo roba mucho más arriba y ataca mejor, y se expone
atrás. Y **los minutos presionados cuestan el doble de energía** — se cobran una vez como
minutos jugados y otra vez como sobrecosto (`medical.applyMedicalPostMatch(…, presionados)`).
La factura no la paga este partido: la paga el siguiente. Con el ciclo de 20', un partido
de 90' da **4-5 ráfagas**; presionarlas todas son 50' al doble ≈ **+23 de energía** encima
de los 42 que ya cuesta jugar los 90.

**Se mide en minutos de partido, no en segundos de reloj** — el ritmo del relato no es
uniforme (un tick de crucero dura ~600 ms pero una secuencia lo congela mientras el DT
lee y decide). Con un temporizador de pared, la ráfaga se consumiría detrás de un modal
abierto o se recargaría gratis mientras el jugador piensa. La barra de la UI anima el
ancho para que igual SE LEA como una recarga en tiempo real.

**Por qué no es un buff plano prohibido**: la ley del arco de Rasgos prohíbe que un RASGO
sea una mejora estadística. Esto no es un rasgo: es una orden del DT con costo explícito,
exactamente la misma moneda que salir a mentalidad ofensiva (`powers.MENT_MOD`) — y
deliberadamente más chica (ofensiva vale +0.6/−0.5).

**Pulmones de Acero** (rasgo básico de la rama Respuesta del Press) abarata SOLO este
sobrecosto, jamás la fatiga general del partido.

**Sin medir a propósito**: el botón es poder nuevo en manos del humano y el smoke NO lo
usa (juega sin presionar nunca), así que el win-rate del smoke no lo refleja. Va al
próximo gate de dificultad, junto con el rediseño de árboles.

## Fatiga del rival (26-jul-2026)

Hasta hoy el once rival nacía al 100% de energía y **jamás bajaba**: mi plantel llegaba
con lo que arrastra del torneo (55-70 en un titular fijo) y enfrente siempre había once
tipos frescos. La asimetría era deliberada pero apuntaba al lado equivocado — el rival
no pagaba nada por jugar.

Ahora **el rival se cansa dentro del partido** (`medical.drainOppEnergy`, llamado por
`Match.tick`). No lleva energía al partido siguiente —se genera nuevo cada vez— así que
el único sitio donde su costo puede morder es el partido en curso. Con el mismo dial que
mi equipo (`FATIGUE_PER_30`), llega al 90' cerca de 58. Lectura buscada: **al rival
fresco hay que aguantarlo; si llegás descansado, lo pasás por arriba en el tramo final.**

### Dos curvas de energía distintas, a propósito

| energía | mi curva (banda verde) | curva del rival |
|---|---|---|
| 100 | ×1.000 | ×1.000 |
| 80 | ×1.000 | ×0.960 |
| 65 | ×1.000 | ×0.930 |
| 58 | ×0.997 | ×0.916 |
| 40 | ×0.957 | ×0.880 |
| 5 | ×0.750 | ×0.810 |

La banda verde (`energyMult`, M1) existe para arreglar **mi** economía: sin ella,
Recuperar era comprar rendimiento universal a diario y dominaba como estrategia. Pero el
rival no tiene acciones del día, ni recuperación pasiva, ni plantel que rotar. Aplicarle
la misma curva indulgente resultó ser un error de categoría, y se midió: con la banda
compartida su fatiga valía **×0.9966 — o sea nada**, y la mecánica no se sentía (mixto
30.3 → 30.9, puro ruido). Con curva propia y lineal (`oppEnergyMult`) sí muerde.

La asimetría vive en los DATOS: `p.rival` marca al once generado, igual que `p.oxid` y
`p.forma`. `effStat` elige la curva por ese campo.

### El costo en dificultad, y su compensación

Quitarle al rival una ventaja que tenía gratis ablandó el juego ~4pp y sacó al mixto del
gate 29-31 del arco del Rebalance. Compensado (decisión PO) por el mismo canal:
**`DAILY_RECOVERY` 8 → 7** — ahora se cansan los dos.

| estrategia | antes | final | gate |
|---|---|---|---|
| siempre Recuperar | 11.4% | **14.1%** | 10-15 ✓ |
| siempre Entrenar | 16.2% | **15.5%** | ~15 ✓ |
| mixto (azar) | 30.3% | **31.0 / 31.1%** | 29-31 ✓ (borde superior, 2 mediciones) |
| smart (techo) | 45.0% | **49.4%** | — |
| CPV (colista) | ~5.7% | **6.3%** | ≥3 ✓ |

**A vigilar**: la compensación favorece levemente al recuperador (repone activamente, así
que la pasiva le importa menos). La brecha Recuperar↔Entrenar se comprimió de 4.8pp a
1.4pp. La tesis del arco se sostiene —Recuperar sigue siendo el piso— pero con menos
margen que antes.

> 📌 **Los números de esta tabla son HISTÓRICOS (pre-Escalada) — no los uses como gate.** La
> Escalada bajó la escalera entera ~6-11pp; la vigente está en §10. Y el "a vigilar" de arriba
> **dejó de ser una alerta**: la brecha siguió comprimiéndose de 1.4pp a 0.7pp y el PO la
> adoptó como objetivo (la LEY DEL PISO PLANO, §10). Lo que hoy se vigila no es esa brecha,
> sino que las dos puntas del piso no despeguen de ~10.


## El Territorio (sprint del Territorio, 30-jul-2026)

El partido pasa a saber **dónde** se juega. Hasta acá el motor sabía qué jugada salía y qué tan
buena quedaba (el canal `bonus`), pero no existía el concepto de posición: un penal y una
circulación nacían del mismo sitio, que era ninguno. Todo esto vive en `game/match/field.js`.

### El marco

**Absoluto y anclado a MI arco**, siempre, sin importar de quién sea la pelota:

| Altura (`v`) | 1 | 2 | 3 | 4 | 5 |
|---|---|---|---|---|---|
| | mi área | mi salida | mediocampo | tres cuartos | área rival |

| Carril (`h`) | 1 | 2 | 3 |
|---|---|---|---|
| | banda izquierda | centro | banda derecha |

Cuando el rival ataca, la pelota **baja por el mismo eje**. Una sola verdad: el mapa de calor se
lee como una transmisión y las jugadas rivales no necesitan traducirse a otro marco.

**El jugador NUNCA ve un número de zona.** Todo esto se comunica por el mapa de calor, el
momentum, la narración y qué jugadas aparecen.

### La deriva ambiente (y por qué NO consume azar)

Con 5-9 secuencias por partido (2-6 cuando nació el sprint del Territorio), un mapa de calor
alimentado solo por jugadas tendría un puñado de muestras.
El relleno de los ~90 minutos sale **determinista** de la posesión ya derivada del juego
(`Match.flow`), los poderes y las dos alturas de bloque — misma ley que `stats.js` y
`match-momentum.js`: el sistema territorial puede existir **sin correr el flujo del RNG ni
moverle un dial al balance calibrado**. El azar se gasta donde hay fútbol de verdad.

- **De quién es la pelota**: Bresenham sobre la posesión, en bloques de 3 minutos (con 1 la
  posesión alternaba cada minuto y el balón quedaba clavado en el mediocampo: el mapa salía una
  mancha central en todos los partidos).
- **Hacia dónde tira**: `3 + 0.55·(miAltura−3) + 3·ventajaAtaque − 0.25·(suAltura−3)`, con paso
  máximo de 0.8 alturas por minuto y un tirón extra de 0.7 en el minuto del robo. El espejo
  exacto para su posesión.
- **El carril**: un ciclo fijo (~50% centro, 25% cada banda) desfasado por partido.

### El mapa de calor

Cada minuto suma **1** a la celda donde está la pelota, del lado de quien la tiene; cada acto de
una jugada real suma **3** (es fútbol, no relleno). **Cada tiempo tiene su propio mapa** y se
reinicia al empezar el siguiente; los anteriores se conservan para el post-partido. La UI lo
recibe normalizado 0..1 contra la celda más caliente de ese mapa (`heatCells`).

### La altura del bloque (1..5)

La orden estructural del DT. Vive en `matchCtx.altura` (como la mentalidad) y por defecto en
`run.altura`. Gratis antes del partido y en cualquier entretiempo; **con el partido en juego
consume una VENTANA TÁCTICA** — recurso nuevo, 3 por partido, que no toca los 3 cambios.

Con el **bloque medio todos los multiplicadores valen ×1**: la línea base medida del juego no se
mueve por el hecho de que la palanca exista.

| Canal | Efecto por escalón sobre el bloque medio |
|---|---|
| Territorio | ±0.55 alturas de deriva |
| Pool propio | recuperación ×(1+0.28·a) · pelotazo ×(1−0.20·a) · circulación ×(1+0.06·a) · transición ×(1−0.10·a) |
| Reparto de iniciativa | +0.045 por escalón (−0.02 por escalón del rival) |
| Espacio a la espalda | `backlineRisk` = 1 + 0.30·a hacia arriba, 1 + 0.12·a hacia abajo (**asimétrico**: con la pendiente simétrica, el bloque muy bajo salía la mejor estrategia del juego para un favorito) |
| Piernas | +0.10 minutos equivalentes de fatiga por minuto y escalón, solo hacia arriba |

**La IA rival juega con las mismas reglas**: su altura sale de su identidad (Press y Posesión 4 ·
Contra y Bloque 2), la radicaliza si está consolidada y la mueve el marcador igual que a mí.

**Y se scoutea antes de jugar** (`field.baseHeight`, pura): el Informe del Rival dice con qué
altura se va a parar el que viene y qué camino deja abierto, y ofrece ahí mismo el selector de la
altura propia. Una decisión de pizarra sin información previa era una moneda al aire.

### La geografía de las jugadas

Cada tipo declara `zone.from` (desde qué alturas nace) y el generador lo pondera por distancia
(×0.55 por cada altura de lejanía). Como el sorteo normaliza dentro de cada lado, esto cambia la
**mezcla** de jugadas y **nunca cuántas hay** (la densidad no se toca en este sprint: medido
4.23 vs 4.28 jugadas/partido). La jugada planta la pelota en su cuna al arrancar.

Cada acto la mueve (tabla `ADVANCE`): pase seguro +1 · filtrado +2 · retroceso −1 · conducción
+1 · pelotazo +2 (el envío **vuela**: el duelo se disputa arriba) · peinada +2 · centro y línea
de fondo → área · contención rota −1 (el rival progresa).

**La geografía de la falta**: el penal deja de nacer en el mediocampo. Se cobra donde derribaron
al jugador — dentro del área es penal; al borde, tiro libre peligroso; lejos, uno modesto (los
dos siguen como balón parado encadenado, así que la jugada no muere: cambia de forma).

### Los rasgos con geografía

Un hook puede declarar `zone: [min,max]` (dónde existe su fútbol) o `minHeight: n` (qué altura
de bloque exige). Solo se gatea lo que el fútbol pide y **se le compensa la frecuencia**: el
rasgo cambia de carácter, no de valor. Gateados hoy: Retroceso de posesión (3-5) · Reventar el
balón (1-3) · Angriffpressing (bloque alto) · La Frontera (bloque alto) · Pivotear al área (4-5)
· Cabeza de Playa (4-5) · Rest Defense (2-5) · La Máquina Colectiva (4-5).

### Balance medido (n=4000, BRA)

| Medición | Antes | Después |
|---|---|---|
| BRA campeón (piso, juego al azar) | 27.5% | **27.7%** |
| BRA campeón (techo, `--smart`, n=1500) | 42.3% | **42.6%** |
| Jugadas por partido | 4.28 | **4.23** |

Barrido de alturas (n=1500, BRA): 26.3 · 25.9 · 27.2 · 28.1 · 27.7 — **ninguna altura domina**
(el criterio de "ningún dibujo dominado" aplicado a esta palanca).


## El Eje Horizontal (30-jul-2026)

El Territorio dejó los carriles alimentando el mapa de calor y poco más. Este arco los
convierte en una dimensión táctica: **el ancho de la cancha se ocupa o no se ocupa**, y eso
depende del dibujo.

### La amplitud (una línea de tres ocupa los tres carriles)

`field.lineCover(n)` = 0 con una línea de 1 · 0.5 con 2 · 1 con 3. De ahí salen dos lecturas
en escala **−1..+1 centrada en la línea de DOS** (el punto neutro exacto: con un 2-2-1 todo
vale ×1 y la línea base medida no se mueve):

- `attackWidth` = la línea más ancha de MED/DEL — para atacar la banda alcanza con que
  alguien la ocupe.
- `defenseWidth` = la zaga manda y el mediocampo ayuda (×0.7: bajar a tapar no es lo mismo
  que estar parado ahí).

Con cinco jugadores de campo **nunca puede haber dos líneas de tres**: cada dibujo tiene ancho
arriba, ancho atrás, o ninguno.

| Canal | Efecto |
|---|---|
| Pool propio | desborde ×(1+0.35·a) · cambio de frente ×(1+0.60·a) · y **rota**: circulación ×(1−0.12·a), pelotazo ×(1−0.10·a), espalda ×(1−0.10·a) |
| Centro al área | +0.04·a (con tres arriba el área se llena de verdad) |
| Sprint por afuera | +0.03·a |
| Contención POR AFUERA | +0.10·d (solo con la pelota en una banda) |
| Remate rival desde una banda | −0.09·d en el desenlace del repliegue · −0.06·d en el remate ambiente |

**Por qué el pool ROTA y no solo sube** (medido): subir una familia sin bajar otra diluye a
todas las demás y termina castigando al dibujo que se quería premiar — el 1-3-1 perdía −2.6pp
por "premiarlo". El que no tiene a nadie por afuera **ataca por dentro**.

**Y la amplitud defensiva no toca el pool rival**: bajarle peso al repliegue le subía la cuota
a la salida asfixiada y al córner en contra, que son peores para mí (−3.6pp al 3-1-1, el
dibujo al que venía a premiar). Se expresa solo donde está el fútbol: cortando por afuera y en
el remate que nace de una banda cubierta.

### El cambio de frente

Jugada nueva de 3 actos (`cambio_frente`), nace con la pelota atascada en una banda y contra
un bloque junto. Su acto propio ofrece **diagonal larga** (pase largo de riesgo: si llega, el
que recibe centra con la defensa desarmada — `crossBonus` +0.10) o **circular por dentro**
(siempre llega, sin ventaja). Solo la juega de verdad un equipo con amplitud.

### Los centros dependen de DÓNDE se centra

- Desde la **línea de fondo** (v5): centro al área **o pase atrás rasante** — para pisarla y
  devolverla hay que haber llegado hasta el fondo.
- Sin desbordar (v4): centro al área con la zaga ya parada, **o envío al segundo palo** — más
  difícil (−0.06) pero lo ataca **el que llega lanzado** (lo elige la velocidad, no el mejor
  cabeceador parado), y por eso remata mejor (+0.07 contra el +0.02 del centro normal).

### El balón parado tiene carril

El tipo `balon_parado` ya no nace forzado al centro: nace **donde quedó la pelota**, y eso
decide qué jugada es.

| Desde | Es | Opciones |
|---|---|---|
| Banda (h1/h3) | **Córner** | Centro al área (**+0.03**: es su sitio natural) · Jugada preparada |
| Centro (h2) | **Tiro libre frontal** | **Tiro libre directo** (+0.13 desde el borde del área, +0.07 más lejos) · Centro al área (**−0.05**: de frente sale peor) · Jugada preparada |

El córner encadenado (Cabeza de Playa, el que gana la Fortaleza) nace en una banda; el que
nace de una falta se cobra donde se cometió.

### Balance medido

Banco de PARTIDOS con plantel fijo (3.000 partidos ARG vs KOR por celda: el % de campeón tiene
±1.3pp de ruido a n=2500 y no sirve para calibrar un efecto táctico):

| Dibujo | Goles a favor | En contra | Antes (en contra) |
|---|---|---|---|
| 1-3-1 (ancho arriba) | 1.948 | 0.276 | 0.290 |
| 2-2-1 (neutro) | 1.929 | 0.277 | 0.285 |
| 3-1-1 (ancho atrás) | 1.798 | **0.209** | 0.251 |

El 3-1-1 concede **17% menos** y ataca menos por afuera (desborde 2.3% de las jugadas contra
3.9% del 1-3-1; cambio de frente 1.1% contra 3.5%). Gate de campaña: BRA **26.1% vs 27.2%**
(n=4000, dentro de ±2pp).
