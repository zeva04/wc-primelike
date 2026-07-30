# Catálogo de Rasgos — el árbol de identidad completo

Documento de referencia del arco de Rasgos (T1–T3, cerrado 23-jul-2026). Lista los
rasgos vivos con su efecto mecánico ("buff"), su costo/tradeoff real, y el árbol de
dependencias para desbloquear cada uno. Diseño narrativo completo en
[ROADMAP-rasgos.md](ROADMAP-rasgos.md); datos fuente en
[content/traits.js](../js/content/traits.js).

> ⚠️ **Deuda de documentación.** Las cuatro filosofías se REDISEÑARON después de cerrar
> el arco y este documento está al día en dos: **Bloque bajo** y **Contragolpe**
> (30-jul-2026). **High Press** (18 rasgos, 25-jul) y **Posesión** (15 rasgos, 26-jul)
> siguen listados con su árbol viejo de 9, y todo lo que este documento dice sobre
> **"Principios mínimos"** murió con las aristas en el arco de Progresión: los requisitos
> vivos son **nivel de la filosofía del rasgo + 1 PI**. La fuente de verdad es siempre
> [content/traits.js](../js/content/traits.js).

## Cómo leer esto

- **Precio uniforme**: todo rasgo cuesta **1 Punto de Identidad (PI)**, sin excepción.
  Lo que cambia entre tiers no es el precio — son los **requisitos** para que el candado
  se abra.
- **PI se gana** subiendo de nivel la filosofía **activa** (1 PI por nivel, 10 niveles
  posibles). Cambiar de filosofía **no** imprime PI de la herencia (anti-farming): solo
  jugar la identidad que tienes puesta paga.
- **Los 4 tiers y sus 4 candados** (GDD §5): rasgo previo en la rama · Principio(s)
  mínimo(s) · nivel de Filosofía · 1 PI.
- **El tradeoff real no es un "debuff"**: por regla de diseño, ningún rasgo resta
  estadísticas. El costo verdadero es **de oportunidad**:
  - **Principio AJENO**: varios rasgos piden entrenar un Principio que NO es de tu
    filosofía. Como el nivel de identidad se calcula sumando **solo tus 2 Principios
    propios**, entrenar el ajeno no te da PI ni sube tu nivel — es tiempo de juego
    invertido en algo que solo sirve para abrir ESE candado.
  - **Rasgos de ESTADO**: alguno de los Master (Uno a Cero) solo funciona bajo una
    condición del partido (ir ganando) — fuera de ella, no aporta nada.
  - **Neutralizar, no invertir**: los Advanced/algunos que responden a un matchup débil
    llevan la cuota de esa jugada de vuelta a la referencia neutra — nunca la superan.

## Los 5 Principios (para ubicar qué es "propio" y qué es "ajeno")

| Icono | Principio | Filosofías que lo tienen propio |
|---|---|---|
| 🦁 | Presión | High Press, Posesión |
| 🎼 | Elaboración | Posesión |
| ⚡ | Verticalidad | High Press, Contragolpe |
| 🧱 | Solidez | Contragolpe, Bloque bajo |
| 🌩️ | Juego directo | Bloque bajo |

---

## 🦁 High Press — *"Cazar arriba y atacar el espacio antes de que el rival respire."*

**Fuerte:** brilla contra el que quiere la pelota (Posesión) · **Advertencia:** correr 90'
cansa físicamente, y el pelotazo por arriba sobre la presión te parte.

| Rama | Tier | Rasgo | Buff (qué cambia en el partido) | Tradeoff / costo real |
|---|---|---|---|---|
| Firma | Basic | 🐺 Morder Tras Pérdida | 30% de encadenar una recuperación reactiva tras perder el balón (no cuenta contra el cupo de secuencias del partido). | Ninguno — solo PI + nivel 1. |
| Respuesta | Basic | 🕸️ Trampa en la Banda | 30% de convertir el acto de presión directamente en transición (ataque inmediato). | Ninguno — solo PI + nivel 1. |
| Expansión | Basic | 🦁 Asfixia en Salida | 35% de que la recuperación nazca en su variante profunda (robo sobre el saque de meta rival). | Ninguno — solo PI + nivel 1. |
| Firma | Intermediate | 🩸 Cacería Letal | Migración F2: sube el % de que la Cacería total rota deje falta (amarilla + tiro libre) en vez de simplemente morir. | Exige Presión 🦁 2 — **propia**: entrena tu propio nivel igual. |
| Respuesta | Intermediate | 🛡️ Anticipar la Espalda | 40% de cortar el pelotazo ambiente a la espalda ANTES de que se vuelva mano a mano. | Exige Solidez 🧱 2 — **AJENA**: no suma a tu nivel de Press. |
| Expansión | Intermediate | 🎯 Arco a la Vista | El desenlace de la variante profunda de la recuperación llega a quemarropa (+bonus de definición). | Exige Verticalidad ⚡ 2 — **propia**. |
| Firma | Advanced | 🌪️ Asfixia Total | Bozal a la firma del rival (×0.6 a su mult de identidad): el rival deja de jugar SU fútbol, no ataca menos. | Exige Presión 4, Cacería Letal + Asfixia en Salida, nivel 6. |
| Respuesta | Advanced | 📦 Cancha Chica | Las secuencias rivales pierden continuidad (mueren antes del remate) — el achique corta el partido. | Exige Solidez 🧱 3 — **AJENA**. |
| Master | Master | 👑 El Robo es el Pase | Toda la familia de la recuperación define mejor (+bonus) y la mordida caza más seguido (chainPlus +0.15). Dispara consagración de prensa. | Exige un Advanced (Asfixia Total o Cancha Chica) + los 3 básicos + nivel 10 + Presión 4 **y** Verticalidad 4 — la doctrina completa. |

---

## 🎼 Posesión — *"Tener la pelota es atacar y defender a la vez; si se pierde, se caza al toque."*

**Fuerte:** domina los partidos (más circulación, contrapressing) · **Advertencia:** se
estrella contra un bloque bajo bien plantado.

| Rama | Tier | Rasgo | Buff (qué cambia en el partido) | Tradeoff / costo real |
|---|---|---|---|---|
| Firma | Basic | 🔑 Buscar al Hombre Libre | 40% de reciclar la posesión cuando el pase filtrado se intercepta (la jugada no muere). | Ninguno. |
| Respuesta | Basic | ↔️ Amplitud Máxima | Suaviza (no invierte) la celda floja vs Bloque: circulación ×1.25 contra esa identidad. | Ninguno. |
| Expansión | Basic | 🎼 Pausa | 30% de que el desenlace de la circulación llegue con aceleración súbita (mejor perfil de gol). | Ninguno. |
| Firma | Intermediate | 🔺 El Tercer Hombre | 40% de rescatar la salida bajo presión rival cuando el pase falla (sin regalar remate). | Exige Elaboración 🎼 2 — **propia**. |
| Respuesta | Intermediate | 🌊 Cambio de Frente | Variante de circulación condicional (solo vs Bloque): 30% de arrancar ya con el bloque descolocado. | Exige Juego directo 🌩️ 2 — **AJENA**. |
| Expansión | Intermediate | 🏟️ Sitio al Área | Migración F2: la sinfonía gana su 4º compás y el % de penal profundo. | Exige Presión 🦁 2 — **propia**. |
| Firma | Advanced | ♟️ Juego Posicional | El reciclaje de Hombre Libre se vuelve estructural: hasta 2 veces por jugada, al 60%. | Exige Elaboración 4, Tercer Hombre + Pausa, nivel 6. |
| Respuesta | Advanced | 🥫 Abrir la Lata | **Neutralización real**: circulación ×1.23 + pelotazo ×0.77 vs Bloque — la celda floja vuelve EXACTO a tablas (medido: no la supera). | Exige Juego directo 🌩️ 3 — **AJENA**. |
| Master | Master | 👑 La Pelota es Nuestra | El reparto de iniciativa se inclina de raíz (+0.06 a mi favor): el rival se estrangula por falta de balón. El costo de siempre permanece (perderla sigue doliendo). | Exige un Advanced (Juego Posicional o Abrir la Lata) + los 3 básicos + nivel 10 + Elaboración 4 **y** Presión 4. |

---

## ⚡ Contragolpe — *"Orden atrás, y a la que pierden la pelota: puñalada al espacio."* — **REDISEÑADO 30-jul-2026**

**Fuerte:** vive del rival que ataca (cada avance suyo es una contra en potencia) ·
**Advertencia:** cede la iniciativa — contra otro que también espera, el partido se muere.

Árbol de **16 rasgos** en grafo. Es el más caro del juego: **las tres avanzadas piden
DOS padres** (convergencia Y), así que cada rama cuesta 5 PI hasta su Maestría.

| Rama | Tier | Rasgo | Buff (qué cambia en el partido) | Requisitos |
|---|---|---|---|---|
| Firma | Basic | 📡 Primer Pase | El acto que LANZA la contra sale +0.05. Los tres rasgos del pase de la contra se apilan. | Nivel 1. |
| Firma | Intermediate | 📈 Primera Marcha | Todos los actos de la contra salen +0.05 (ya en carrera, el equipo se entiende). | Nivel 3 + Primer Pase. |
| Firma | Intermediate | 🏃 Ataque al Espacio | El "buscar al mejor ubicado" del desenlace de la contra gana +0.06: los desmarques parten a la defensa. | Nivel 3 + Primer Pase. |
| Firma | Advanced | ⚡ Ataque Relámpago | 30% de saltar directo al desenlace (la contra a una) + **migración F2**: profundiza el 1er tramo del Contragolpe letal. | Nivel 6 + Primera Marcha **y** Ataque al Espacio. |
| Firma | Master | 👑 Duelista | 30% de que el desenlace de la contra se acelere hasta el mano a mano con el arquero (+0.07). | Nivel 10 + Ataque Relámpago. |
| Firma | Master | 👑 El Enjambre | El pase encuentra al MEJOR rematador real (+0.05) **y** toda la contra llega en oleada (+0.06). | Nivel 10 + Ataque Relámpago. |
| Respuesta | Basic | 🫁 Anaeróbicos | El botón de presión cuesta 15% menos energía (se apila con Pulmones de Acero del Press). ⚠️ *Adyacente: ver deuda abajo.* | Nivel 1. |
| Respuesta | Intermediate | 🪖 Defensa Intencionada | 30% de que el córner rival defendido de cabeza encadene contra mía. | Nivel 3 + Anaeróbicos. |
| Respuesta | Intermediate | 🎣 El Anzuelo | El rival sale a presionar mi salida más seguido (×1.20) — y sobrevivirla ES una contra + **neutralización** del partido muerto (transición ×1.67 vs Contra y Bloque ≈ tablas) + 30% de convertir la circulación-cebo. | Nivel 3 + Anaeróbicos. |
| Respuesta | Advanced | 💨 Segundo Aire | Conducir la contra con menos de 50 de energía gana +0.08. ⚠️ *Adyacente: ver deuda abajo.* | Nivel 6 + Defensa Intencionada **y** El Anzuelo. |
| Respuesta | Master | 👑 Skiller | Al que conduce la contra le hacen falta más seguido (+0.06 de ventana): más penales y tiros libres. | Nivel 10 + Segundo Aire. |
| Expansión | Basic | 🗿 Estóicos | Replegado, el equipo corta más: +0.05 al acto de contención. | Nivel 1. |
| Expansión | Intermediate | 🌩️ Balonazo | 28% de que la segunda pelota de un duelo aéreo perdido lance la contra. | Nivel 3 + Estóicos. |
| Expansión | Intermediate | ⏱️ Saque Rápido | 30% de que el despeje de la salida asfixiada reinicie rápido y se vuelva contra mía. | Nivel 3 + Estóicos. |
| Expansión | Advanced | 🎯 Pase Atrás | **Jugada nueva**: opción del desenlace de la contra. La pisa y la devuelve al que entra de frente (+0.14). Es un pase de verdad: perderlo abre contra rival. | Nivel 6 + Balonazo **y** Saque Rápido. |
| Expansión | Master | 👑 Sin Escalas | 14% de que la contra NAZCA resuelta: se saltean los actos intermedios y el desenlace es el mano a mano (+0.12). | Nivel 10 + Pase Atrás. |

> ⚠️ **Deuda declarada (sprint de SITUACIONES DE JUEGO).** Anaeróbicos y Segundo Aire
> apuntan a un sustrato que todavía no existe: **correr una contra no cuesta energía**
> (el único gasto que el DT controla es el botón de presión) y la penalización por
> energía es una curva global sin excepciones por jugada. Los dos están implementados
> con el efecto adyacente más cercano y **se reescriben cuando ese sprint construya el
> costo físico del contraataque**.

---

## 🧱 Bloque bajo — *"Muralla atrás y pelotazo al duelo: fútbol de trinchera."* — **REDISEÑADO 30-jul-2026**

**Fuerte:** dificilísimo de romper (invita al rival y lo seca) · **Advertencia:** sufre al
que elabora con paciencia y renuncia a generar volumen ofensivo.

Árbol de **15 rasgos** en grafo (como Press y Posesión). Único del juego con una
convergencia **Y**: la Firma abre con DOS básicos que se compran juntos. Los requisitos
son solo **nivel de la filosofía + 1 PI** (los Principios murieron con las aristas).

| Rama | Tier | Rasgo | Buff (qué cambia en el partido) | Requisitos |
|---|---|---|---|---|
| Firma | Basic | 🏰 Compactación | El remate rival del repliegue llega incómodo (−0.05): cerrado el centro, se remata desde afuera. | Nivel 1. |
| Firma | Basic | 🕸️ Sobrepoblado | 25% de que el avance rival multi-acto muera interceptado antes del remate. | Nivel 1. |
| Firma | Intermediate | 🗿 Área Blindada | **Migración F2 del Bloque**: la fortaleza contiene mejor y castiga más (convert 0.55→0.75) + el remate rival dentro del área sale a destiempo (−0.05). | Nivel 3 + Compactación **y** Sobrepoblado. |
| Firma | Advanced | 🪜 Defensa Escalonada | La PRIMERA ocasión rival del partido llega −0.06. Se consume una vez por partido. | Nivel 6 + Área Blindada. |
| Firma | Advanced | 🧱 Muralla | **Rasgo de ESTADO**: mientras el marcador esté empatado o a favor, el remate rival llega −0.05. Perdiendo no aporta nada. | Nivel 6 + Área Blindada. |
| Firma | Master | 👑 Fortaleza Inexpugnable | 25% de que la **ocasión clara** rival (mano a mano · contra tras mi pérdida) directamente no ocurra + **neutralización** del sitio (repliegue ×0.74 vs Posesión: la celda vuelve a tablas) + frustración acumulada hasta −0.08. | Nivel 10 + Defensa Escalonada **o** Muralla. |
| Respuesta | Basic | 🦅 Dominio Aéreo | El cabezazo rival del córner en contra llega forzado (−0.05). | Nivel 1. |
| Respuesta | Intermediate | 👀 Atentos | La segunda pelota es mía por los dos canales: 30% tras córner defendido y 30% tras duelo aéreo perdido — las dos encadenan pelotazo propio. | Nivel 3 + Dominio Aéreo. |
| Respuesta | Advanced | 🚀 Pelotazo | **Jugada nueva "Reventar el Balón"**: tercera opción del acto de contención. Mata el ataque rival sin remate; el precio es resignar la conversión de la fortaleza y 30% de córner concedido. | Nivel 6 + Atentos. |
| Respuesta | Advanced | 🎪 Al Área | 35% de que el pelotazo sin gol termine en saque largo al área (balón parado encadenado) en vez de morir. | Nivel 6 + Atentos. |
| Respuesta | Master | 👑 Hombre Objetivo | **Jugada nueva "Pivoteo al Área"**: tercera opción del duelo aéreo. El que gana por arriba la baja al mejor rematador, que define de frente (+0.07). | Nivel 10 + Pelotazo **o** Al Área. |
| Expansión | Basic | 📐 Especialistas | El balón parado propio se ejecuta mejor (+0.06). | Nivel 1. |
| Expansión | Intermediate | 📋 Estrategia Ensayada | El balón parado propio SALE más seguido (×1.15 en el pool, apilado sobre el ×1.3 incondicional del Bloque). | Nivel 3 + Especialistas. |
| Expansión | Advanced | 📈 Salida Vertical | Los actos de la familia de la transición salen +0.05: recuperada la pelota, el pase hacia adelante llega. | Nivel 6 + Estrategia Ensayada. |
| Expansión | Master | 👑 Contragolpe Letal | **Jugada nueva "Contraataque"**: 30% de que el repliegue contenido convierta en transición mía. | Nivel 10 + Salida Vertical. |

---

## El árbol de dependencias

Cada filosofía es un árbol independiente de 9 rasgos. Las 3 ramas (Firma · Respuesta ·
Expansión) nacen del sorteo del nivel 1; el Master converge las tres arriba de todo.

```mermaid
flowchart TD
  subgraph PRESS["🦁 High Press"]
    direction TB
    P1["🐺 Morder Tras Pérdida\nBasic · Nv1"]
    P2["🕸️ Trampa en la Banda\nBasic · Nv1"]
    P3["🦁 Asfixia en Salida\nBasic · Nv1"]
    P4["🩸 Cacería Letal\nInt · Nv3 · Presión2"]
    P5["🛡️ Anticipar la Espalda\nInt · Nv3 · Solidez2 (ajena)"]
    P6["🎯 Arco a la Vista\nInt · Nv3 · Vertical2"]
    P7["🌪️ Asfixia Total\nAdv · Nv6 · Presión4"]
    P8["📦 Cancha Chica\nAdv · Nv6 · Solidez3 (ajena)"]
    P9["👑 El Robo es el Pase\nMaster · Nv10 · Presión4+Vert4"]
    P1 --> P4 --> P7
    P3 --> P7
    P2 --> P5 --> P8
    P1 --> P8
    P3 --> P6
    P7 --> P9
    P8 -.->|"alguno"| P9
    P1 --> P9
    P2 --> P9
    P3 --> P9
  end
```

```mermaid
flowchart TD
  subgraph POS["🎼 Posesión"]
    direction TB
    O1["🔑 Hombre Libre\nBasic · Nv1"]
    O2["↔️ Amplitud Máxima\nBasic · Nv1"]
    O3["🎼 Pausa\nBasic · Nv1"]
    O4["🔺 Tercer Hombre\nInt · Nv3 · Elab2"]
    O5["🌊 Cambio de Frente\nInt · Nv3 · Directo2 (ajena)"]
    O6["🏟️ Sitio al Área\nInt · Nv3 · Presión2"]
    O7["♟️ Juego Posicional\nAdv · Nv6 · Elab4"]
    O8["🥫 Abrir la Lata\nAdv · Nv6 · Directo3 (ajena)"]
    O9["👑 La Pelota es Nuestra\nMaster · Nv10 · Elab4+Pres4"]
    O1 --> O4 --> O7
    O3 --> O7
    O2 --> O5 --> O8
    O1 --> O8
    O3 --> O6
    O7 --> O9
    O8 -.->|"alguno"| O9
    O1 --> O9
    O2 --> O9
    O3 --> O9
  end
```

```mermaid
flowchart TD
  subgraph CON["⚡ Contragolpe"]
    direction TB
    C1["📡 Primer Pase\nBasic · Nv1"]
    C2["📈 Primera Marcha\nInt · Nv3"]
    C3["🏃 Ataque al Espacio\nInt · Nv3"]
    C4["⚡ Ataque Relámpago\nAdv · Nv6 · deepContra"]
    C5["👑 Duelista\nMaster · Nv10"]
    C6["👑 El Enjambre\nMaster · Nv10"]
    C7["🫁 Anaeróbicos\nBasic · Nv1"]
    C8["🪖 Defensa Intencionada\nInt · Nv3"]
    C9["🎣 El Anzuelo\nInt · Nv3 · neutraliza"]
    C10["💨 Segundo Aire\nAdv · Nv6"]
    C11["👑 Skiller\nMaster · Nv10"]
    C12["🗿 Estóicos\nBasic · Nv1"]
    C13["🌩️ Balonazo\nInt · Nv3"]
    C14["⏱️ Saque Rápido\nInt · Nv3"]
    C15["🎯 Pase Atrás — jugada nueva\nAdv · Nv6"]
    C16["👑 Sin Escalas\nMaster · Nv10"]
    C1 --> C2
    C1 --> C3
    C2 ==>|"todos (Y)"| C4
    C3 ==>|"todos (Y)"| C4
    C4 --> C5
    C4 --> C6
    C7 --> C8
    C7 --> C9
    C8 ==>|"todos (Y)"| C10
    C9 ==>|"todos (Y)"| C10
    C10 --> C11
    C12 --> C13
    C12 --> C14
    C13 ==>|"todos (Y)"| C15
    C14 ==>|"todos (Y)"| C15
    C15 --> C16
  end
```

```mermaid
flowchart TD
  subgraph BLQ["🧱 Bloque bajo"]
    direction TB
    B1["🏰 Compactación\nBasic · Nv1"]
    B2["🕸️ Sobrepoblado\nBasic · Nv1"]
    B3["🗿 Área Blindada\nInt · Nv3 · deepBloque"]
    B4["🪜 Defensa Escalonada\nAdv · Nv6"]
    B5["🧱 Muralla (ESTADO)\nAdv · Nv6"]
    B6["👑 Fortaleza Inexpugnable\nMaster · Nv10"]
    B7["🦅 Dominio Aéreo\nBasic · Nv1"]
    B8["👀 Atentos\nInt · Nv3"]
    B9["🚀 Pelotazo — Reventar el Balón\nAdv · Nv6"]
    B10["🎪 Al Área — Saque Largo\nAdv · Nv6"]
    B11["👑 Hombre Objetivo — Pivoteo\nMaster · Nv10"]
    B12["📐 Especialistas\nBasic · Nv1"]
    B13["📋 Estrategia Ensayada\nInt · Nv3"]
    B14["📈 Salida Vertical\nAdv · Nv6"]
    B15["👑 Contragolpe Letal — Contraataque\nMaster · Nv10"]
    B1 ==>|"todos (Y)"| B3
    B2 ==>|"todos (Y)"| B3
    B3 --> B4
    B3 --> B5
    B4 -.->|"alguno"| B6
    B5 -.->|"alguno"| B6
    B7 --> B8 --> B9
    B8 --> B10
    B9 -.->|"alguno"| B11
    B10 -.->|"alguno"| B11
    B12 --> B13 --> B14 --> B15
  end
```

*(la flecha punteada `-.->` marca el requisito "alguno de los dos" del Master; el resto
son flechas sólidas de "todos" obligatorios.)*

---

## Costo acumulado de PI (camino mínimo)

Todo rasgo cuesta 1 PI. La tabla suma el camino **más barato** desde cero hasta cada
nodo — comprando solo lo estrictamente necesario para ese objetivo, en cualquier
filosofía (la estructura es simétrica en las 4).

| Objetivo | PI acumulados | Qué se compró en el camino |
|---|---|---|
| 1 Basic cualquiera | **1 PI** | Ese básico. |
| Los 3 Basic de la rama | **3 PI** | Los tres básicos (abren las tres ramas). |
| 1 Intermediate | **2 PI** | Su básico previo + él mismo. |
| 1 Advanced | **4 PI** | Básico(A) → Intermediate(A) → Basic(B, apoyo) → Advanced. |
| **1 Master** (camino completo) | **6 PI** | Los 3 Basic + 1 Intermediate (de la rama que alimenta al Advanced elegido) + 1 Advanced + el Master. |

**El Master exige además nivel 10 de Filosofía (Consolidada)** — 9 puntos entre tus 2
Principios propios — y ambos Principios propios a 4 (que ya cuentan para esos 9 puntos:
4+4=8, más 1 punto en cualquiera de los dos para llegar a 9). En una run real esto
significa: toda la Sesión Táctica de la run apuntando a un solo lado, sin desviarse a
principios ajenos salvo lo estrictamente necesario para el Advanced elegido en el camino
(que si es "Respuesta", pide 3-4 en un principio ajeno — un costo de tiempo extra que NO
suma a los 9 puntos de nivel).

**Medido en el gate del arco**: el DT que juega al azar alcanza el Master en ~2.7% de las
runs; el DT que invierte con criterio (heurística `--smart`, entrena siempre su Principio
propio más bajo) lo alcanza en ~99.8%. Es, literalmente, el rasgo que separa "jugué una
run" de "construí una doctrina".
