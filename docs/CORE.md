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

Cada jugador tiene **5 stats en escala 1–99** (estilo EA FC). Hay dos juegos de stats según el rol:

| | Jugador de campo | Arquero (POR) |
|---|---|---|
| Ofensiva | **tiro**, **cabezazo** | — |
| Creación | **pase** | **pase** (juego con los pies) |
| Defensa | **defensa** | **atajadas**, **reflejos**, **salidas** |
| Intangible | **aura** | **aura** |

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

Pesos por posición (`OVR_WEIGHTS`):

| Posición | Pesos |
|---|---|
| **POR** | atajadas 0.40 · reflejos 0.25 · salidas 0.10 · pase 0.05 · aura 0.20 |
| **DEF** | defensa 0.50 · cabezazo 0.20 · pase 0.15 · aura 0.15 |
| **MED** | pase 0.40 · aura 0.25 · tiro 0.20 · defensa 0.15 |
| **DEL** | tiro 0.50 · aura 0.25 · cabezazo 0.15 · pase 0.10 |

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
- **factor forma = el MODO MUNDIAL del rival** (arco del Rebalance R2, 22-jul-2026): en
  eliminatorias el once rival llega **+3% por ronda KO** (16avos ×1.03 … final ×1.15,
  `opponents.tourneyFormaMult`), estampado como `p.forma` al generar su alineación — la
  asimetría espejo de `p.oxid`: solo el rival la lleva, y solo en MIS partidos (el mundo
  simulado no cambia). El perfil rival (`sequences.rivalProfile`) lee stats BASE a
  propósito: la escalada no cambia QUÉ fútbol te genera, cambia lo bien que lo ejecuta.
  Se narra: el informe del rival y la previa del Daily anuncian el modo Mundial.

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

---

## 6. El partido, minuto a minuto (`Match.tick`)

El partido avanza en **ticks de 5 minutos** (90 min = 18 ticks). Desde el **Sprint A1** (rework
del partido) la columna interactiva son las **Key Sequences** (Bible §7); lo demás se simula.
En cada tick, en orden:

1. **¿Arranca una secuencia?** (`sequences.maybeStartSequence`) — la capa interactiva.
2. **¿Penal a favor?** ~1.6% · **¿Último hombre?** ~5% (si hay un DEF mío) · **¿Penal en contra?** ~1%
3. **Ocasiones SIMULADAS** (no interactivas): un remate ambiente propio y otro rival, a
   `(0.12 + 0.22 × ratioMy) × 0.78` y `(0.09 + 0.24 × ratioOpp) × 0.55` — la parte "el resto se
   simula" del Bible. Producen gol o relato sin pedir nada al DT.
4. **¿Falta?** 10% · **¿Lesión?** 2.8% · si no, una línea de ambiente.

Penal y último hombre eran ramas internas de las viejas ocasiones (`myChance`/`oppChance`,
retiradas en A1); ahora asoman como **eventos independientes** a baja frecuencia, con su
resolución del Sprint 1 **intacta** (A1 no toca su matemática).

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
| 🦁 Recuperación alta | ofensiva | presionar (+0.10, mi iniciativa) · rematar — presión total roba menos pero en zona letal | High Press |
| 🌩️ Pelotazo largo | ofensiva | duelo aéreo (¡por fin juega el **Cabezazo**!) · rematar — choque = cabecea él; peinada = habilita a un lanzado | Bloque bajo |
| 🎯 Balón parado a favor | ofensiva | UNA decisión: centro al mejor cabeceador o jugada preparada | — |
| 🚨 Balón parado en contra | defensiva | zona (segura) o salir a despejar (mata la jugada o deja solo al cabeceador) | — |
| 🗼 Salida bajo presión | def→of | reventarla (gratis) o salir jugando: la pérdida regala un remate letal… o la jugada **SE CONVIERTE en transición mía** | — |
| 🧱 Repliegue defensivo | defensiva | contener · (último hombre o remate rival) | Bloque bajo |

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

**[MATRIZ DE COUNTERS] (F2, decisión PO #7 — regla 4: sin build ganadora).** Celdas
mía×rival sobre el pool (`MATRIX` + `applyFiloWeights`, extraída para que typeWeights no
sea sopa): mi Press vs Posesión → recuperación ×1.4 · mi Posesión vs Bloque → circulación
×0.65 y pelotazo ×1.3 (forzado) · mi Contra vs Press/Posesión → transición ×1.35, vs
Contra/Bloque → ×0.6 (partido muerto) · mi Bloque vs Posesión → repliegue ×1.35 (te
sitian). La firma rival sesga SU lado con SU nivel (press→salida_fondo ·
posesión→repliegue · bloque→balón parado ×1.3 + salida ×0.6). Los **costos de identidad**:
Press −6 de energía post-partido (`applyFiloCosts`) · Contra cede posesión (mineShare
−0.05) · Bloque cede volumen ofensivo (−0.08) · el rival que espera te la cede a ti
(contra +0.04 · bloque +0.06) · Posesión sin costo físico (su costo ES la matriz). El
Bloque además tiene su ARMA propia: balón parado ×1.3 (ajuste PO tras el primer gate —
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
que sale, no compra goles** (Bible §5 regla 3). La **progresión por ejecución** cierra el
círculo: cada acierto de acto en una secuencia firma (`noteFiloHit` — escalar es acertar, más
el gol que corona si el VAR no lo anula) suma `match.filoHits`, y `flow.postMatchUpdate` lo
convierte en arista vía `applyFiloExecution` (+0.25 por acierto, tope 2 por partido). Ritmos
medidos con decisiones al azar: Posesión ~1.5 aciertos/partido, Contragolpe ~1.1, Press ~0.7,
Bloque ~0.5 — la circulación multi-acto consolida más rápido; se vigila en F2. Desde M2 la
**avanzada también es firma**: sus aciertos cuentan igual (`noteFiloHit` mira `advFor`).

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

**Generación** (`sequences.seqPlan` + `maybeStartSequence`): **2-6 por partido**, objetivo modulado
por la **preparación** (ventaja atk+def sobre el rival) y la mentalidad. El favorito recibe más
secuencias y más ofensivas; el superado, menos y más defensivas — el pago visible de prepararse
(Bible §7). Se decide **sobre la marcha** (por tick, repartiendo las que faltan entre los ticks
restantes) para que el **Sprint A3** pueda meter contexto dinámico (marcador, minuto, fatiga,
expulsados) sin reescribir el generador.

**Ritmo** (`screens/match.js`, decisión PO "ráfaga"): entre secuencias la simulación **corre**
(~600 ms/tick — 22-jul: era 360 y asfixiaba; ~260 en Rápido) y **frena en seco** al llegar una secuencia; un
gol hace una pausa breve. El reloj se auto-agenda con `setTimeout` para variar el paso.

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

### La Acción Principal del Día (`DAY_ACTIONS`, `applyDayAction`)

Además del suceso que le toca, **cada día sin partido el DT elige exactamente UNA
acción** (Core Gameplay Bible §4.7: un día = una inversión, con opportunity cost).
El orden dentro del día es el del Bible: primero el evento cambia el contexto,
después el DT decide. No se puede pasar el día sin elegir. Las acciones
(`content/day-actions.js`):

| Acción | Efecto | Trade-off |
|---|---|---|
| 🎯/🛡️/🎩 **Entrenar** (foco ataque, defensa o pases) | +1 al buff de la stat elegida (`TRAIN_BUFF`) | **−5 de energía** a todo el plantel |
| 🧘 **Recuperar** | +10 de energía a todo el plantel | No mejora ninguna stat |
| 📋 **Sesión táctica** (reformada en F1) | **+1 a la arista del foco elegido** (`ARISTA_FOCUS`, 5 focos = las 5 aristas de `content/philosophies`) — construye la identidad, que sesga el pool de secuencias por nivel | **Sin retorno inmediato**: no recupera, no sube stats y el viejo buff atk/def MURIÓ (decisión PO, arco de Filosofía) |
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

**La muerte del buff táctico (arco de Filosofía F1, 22-jul-2026).** La Sesión Táctica era
la acción más fuerte como estrategia fija (41.7% de campeón con BRA vs 34.0% del mixto,
n=4000/1500) porque +0.1 a atk y def sin costo de energía pagaba todos los días. El PO
decidió que su valor ya no sea poder inmediato sino **identidad**: elige un FOCO entre las
5 aristas (como Entrenar elige stat) y suma +1 a esa arista (`run.aristas`; los focos con
las 2 aristas de tu filosofía se destacan en el hub). Medido en dos etapas (ley del arco):
la reforma AISLADA derivó el mixto a 31.5/31.8% (−2.3pp — el valor del buff muerto) y
solo-táctica cayó a 32.2% (ya no domina, pero no gastar energía la sostiene); con el
sesgo del pool enchufado el mixto volvió a 32.9/33.x% (dentro del gate ±2pp) — con focos
AL AZAR, que es el PISO: un DT que entrena SUS aristas rinde más. El cambio de filosofía
a mitad de run también pasa por acá: **cuesta la Acción del Día** (modal en el panel) y
las aristas persisten (demolición orgánica, decisión PO #1).

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
> costos**. El arreglo real exige rebalancear la economía de energía o su curva de impacto en
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
  bajo 65 castiga convexo. El que **descansó** recupera **+30**. Entre partidos hay **recuperación pasiva**:
  **+8 por día de preparación** y **+2 el día de partido** (`applyDailyRecovery`, en
  `advanceDay`), más la acción Recuperar y varios eventos. Sin la pasiva, el cansancio entra en espiral (no hay forma de
  reponer a un titular fijo) — medido: BRA se hunde a 5.9%; con la pasiva vuelve a 28.8%
  (decisión PO 18-jul: el cansancio se siente como dificultad extra). Alimenta el factor de
  `effStat` (§4), así que descuidar la energía castiga de verdad; obliga a **rotar y
  recuperar**. Los rivales siempre están al 100% (asimetría en contra del DT humano).
  Para poder decidir la rotación, la **Gestión de Plantilla muestra la energía de TODO el
  plantel** ordenada del más cansado al más entero (Sprint 3). Y la oportunidad rara
  **🛌 Plan de descanso a medida** (`descanso_dirigido`) recupera **+25 a UN jugador que
  elige el DT** — el PO la quiso como evento raro y no como Acción del Día, para que la
  rotación fina sea un premio ocasional y no una herramienta permanente (que habría
  inflado la ventaja de energía del humano).

  > **La víspera del partido también descansa** (Sprint 4, bug reportado por el PO). Hasta el
  > Sprint 3, `advanceDay` cobraba el descanso pasivo **solo en días de preparación**: al llegar
  > el día de partido se salía antes del `applyDailyRecovery`, así que se jugaba sin haber
  > repuesto nada de la noche anterior. Ahora **todo día nuevo recupera**, pero la víspera lo
  > hace a tasa reducida (`MATCHDAY_RECOVERY = 2` vs `DAILY_RECOVERY = 8`): viaje a la sede,
  > charla técnica y nervios no son una jornada de recuperación.
  >
  > **Ojo con este dial: es el más sensible del juego.** Medido en este sprint, `DAILY_RECOVERY`
  > mueve **~5pp de campeón por punto** (BRA n=1500: con 6 → 25.9%, con 7 → 30.7%), porque
  > rompe o restaura la espiral de fatiga en vez de sumar linealmente. Arreglar el bug con la
  > tasa completa (+8 el día de partido) valía **+6pp** — por eso el arreglo entró por una
  > constante propia y reducida, y no subiendo la recuperación de todos.
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

> **Cómo re-medir.** El script `tests/smoke.js` simula runs completas sin
> UI. `node tests/smoke.js --all` corre las 18 jugables (modo --smart pendiente de recrear). Es la herramienta para validar
> cualquier cambio de balance antes de darlo por bueno.

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
