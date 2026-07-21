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
pct = clamp((momento − 4) × 2, −4, +4)      // % sobre TODAS las stats (aura incluida)
stat_final = round(stat_castigada × (1 + pct/100))
```

- **±2% por paso, tope ±4%**: los niveles 1 y 7 rinden igual que 2 y 6 — son estados
  narrativos más profundos, no más poder.
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
| Sin señal individual o sin jugar | **decae 1 paso hacia el neutro (4)** |

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
subió o bajó y por qué (goles, penales, valla, resultado o simple decaimiento) — el motor,
dueño de la regla, también narra el motivo.

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
effStat = (stat + buff) / 20  ×  (0.80 + 0.20 × energía/100)
```

- **÷20** lleva 1–99 al rango ~0–5 donde están calibradas todas las fórmulas.
- **buff**: bonus temporal (entrenamiento, evento) en la misma escala 1–99.
- **factor energía**: un jugador a 100 de energía rinde al 100%; a 0 de energía rinde al
  **80%**. Nunca cae a cero — un crack cansado sigue siendo peligroso.

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

El partido avanza en **ticks de 5 minutos** (90 min = 18 ticks). En cada tick se tiran
dados en este orden:

1. **¿Ocasión mía?** con probabilidad `0.12 + 0.22 × atk/(atk+def_rival)`
2. **¿Ocasión rival?** con probabilidad `0.09 + 0.24 × atk_rival/(atk_rival+def)`
3. **¿Falta?** 10% · **¿Lesión?** 2.8%
4. Si no pasó nada, una línea de relato de ambiente.

> **La ventaja del DT humano.** Los coeficientes de *mi* ocasión (0.12 / 0.22) son
> levemente más altos que los del rival (0.09 / 0.24 pero sobre una base menor). Es
> deliberado: las decisiones del jugador deben poder torcer un partido. Un humano que
> elige bien rinde por encima de lo que diría el rating puro.

### Resolución de una ocasión propia

El 55% de mis ocasiones son **interactivas** (aparece un dilema); el resto se resuelven solas.
La probabilidad de gol de un remate es:

```
P(gol) = clamp(0.11 + calidadRemate × 0.08 − ratingRival/20 × 0.035,  0.06,  0.55)
```

En las decisiones interactivas cada opción cambia la fórmula:

| Opción | Cómo se calcula | Cuándo conviene |
|---|---|---|
| 🎯 **Rematar** | tiro del protagonista + pequeño bonus | Tienes a un killer con tiro alto |
| 🤝 **Pasar** | primero pasa (según su pase), luego remata el compañero con bonus | El compañero define mejor que quien tiene la pelota |
| 😤 **Individual** | según **aura**; puede terminar en golazo, en penal ganado o en nada | Jugadores con aura muy alta (Messi, Mbappé) |

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
| Infrecuente | 27% | 8 | ±8 de stat, ±12 de energía, o un modificador del día |
| Rara | 13% | 7 | ±10-12, combos de dos stats, lesión en la práctica, +25 energía |
| Legendaria | 5% | 5 | Campaña-defining: +5 a TODAS las stats, +3 PERMANENTE al mejor delantero, brote de gripe (−25), todas las acciones ×2 |

Con ~19 eventos por run completa, una legendaria aparece ~1 vez por run: es un
momento, no una rutina. El diario marca las legendarias con tono dorado.

### Eventos como modificadores del día (`run.dayMod`)

Algunos eventos no tocan números: **cambian el problema de hoy** (Bible §4.5). Su campo
`mod` queda en `run.dayMod` (dura exactamente un día) y multiplica el rendimiento de las
Acciones del Día: `entrenar ×2` (doble turno), `entrenar 0` (cancha anegada: bloqueada),
`recuperar ×2` (spa), `recuperar ×0.5` (ola de calor), `tactica 0` (alineación filtrada),
todas ×2 (legendaria "El día que todo sale"). El multiplicador escala la **recompensa**;
el costo de energía de entrenar no se escala. La UI muestra el modificador como banner
en el panel de acción y bloquea/etiqueta los botones afectados.

> **Asimetría deliberada**: los modificadores-premio solo pagan si ELIGES la acción
> potenciada (habilidad de lectura); los castigos aplican solos. Con decisiones al azar
> el smoke pierde ~1-3 pp de campeón respecto a la versión sin rarezas — un DT humano
> que aprovecha los ×2 recupera esa diferencia. Es la "ventaja del DT humano" (§6).

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
después el DT decide. No se puede pasar el día sin elegir. Las 6 acciones
(`content/day-actions.js`):

| Acción | Efecto | Trade-off |
|---|---|---|
| 🎯/🛡️/🎩 **Entrenar** (foco ataque, defensa o pases) | +1 al buff de la stat elegida (`TRAIN_BUFF`) | **−5 de energía** a todo el plantel |
| 🧘 **Recuperar** | +10 de energía a todo el plantel | No mejora ninguna stat |
| 📋 **Sesión táctica** | +0.1 a **atk y def** (escala de poder §5) para el próximo partido, vía `buffs.tactica` | No recupera ni sube stats individuales |
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
elegible gana. La sesión táctica (+0.1 en ambas fases, sin costo de energía) pesa más por
partido pero no apunta a una stat concreta: ninguna acción domina, como pide el Bible. El
bonus táctico solo alcanza al equipo del usuario (el rival calcula sus poderes con
`buffs = {}`) y se limpia con el resto de los buffs al terminar el partido. La sesión
táctica es además el gancho donde se enchufará la **Filosofía**.

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
  energía en el rendimiento (§4): el partido vacía más rápido, pero cada punto pesa menos. El que **descansó** recupera **+30**. Entre partidos hay **recuperación pasiva**:
  **+8 por día de preparación** (`applyDailyRecovery`, en `advanceDay`), más la acción
  Recuperar y varios eventos. Sin la pasiva, el cansancio entra en espiral (no hay forma de
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

> **El efecto EN-PARTIDO sigue diferido** (va con el rework del partido): la Moral modulará el
> **tipo y número de ocasiones** que el equipo genera — hook `[MORAL → OCASIONES]` comentado
> en `Match.tick`; requerirá pasar la moral por `matchCtx` porque el motor no conoce la run.

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

1. `Match.tick()` decide que hay ocasión mía (§6).
2. Se elige al protagonista (ponderado: los delanteros aparecen más).
3. Si es interactiva, la UI muestra el dilema; eliges rematar/pasar/individual.
4. La opción define la fórmula; `effStat` convierte las stats 1–99 en calidad 0–5
   aplicando energía (§4).
5. Se compara contra la defensa rival y sale `P(gol)`; se tira el dado.
6. Si es gol, el VAR puede revisarlo (12% de revisión, 30% de anulación).
7. El relato se actualiza y el partido sigue.
