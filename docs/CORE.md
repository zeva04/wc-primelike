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
effStat = (stat + buff) / 20  ×  (0.65 + 0.35 × energía/100)
```

- **÷20** lleva 1–99 al rango ~0–5 donde están calibradas todas las fórmulas.
- **buff**: bonus temporal (entrenamiento, evento) en la misma escala 1–99.
- **factor energía**: un jugador a 100 de energía rinde al 100%; a 0 de energía rinde al
  **65%**. Nunca cae a cero — un crack cansado sigue siendo peligroso.

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

- **75% evento inevitable** (`PREP_EVENTS`, 10): buff o debuff que se aplica solo.
- **25% conflicto con decisión** (`RANDOM_EVENTS`, 6): dilema con dos opciones y
  trade-offs (sponsors, peleas, virus, localía, prensa, médicos).

Dentro de una ventana no se repite el mismo suceso (se sortea sin reposición).
El calendario del hub muestra de antemano **solo la temática** de cada día
(Entrenamiento · Estado físico · Vestuario · Entorno, siempre con el mismo icono y
color): sabes *de qué* vendrá el golpe o el regalo, no *cuál* es — información
aproximada, como pide el Game Vision.

Las palancas de la economía:

- **Energía** (0–100): baja en cancha, se recupera al cerrar cada partido (+15 si
  jugó, +30 si descansó) y la mueven varios eventos. Alimenta el factor de `effStat` (§4).
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
