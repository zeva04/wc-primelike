# Catálogo de jugadas del partido

Inventario de **todo lo que puede ocurrir dentro de un partido hoy**, con sus
resoluciones. Sin números: qué se juega, qué decide el DT y en qué puede terminar.

Documento de referencia para el sprint de **situaciones de juego**. Fuente:
[content/match/sequences.js](../js/content/match/sequences.js) (los tipos),
[sequence-acts.js](../js/game/match/sequence-acts.js) (los actos y sus desenlaces),
[chances.js](../js/game/match/chances.js) (ocasiones sueltas y goles),
[incidents.js](../js/game/match/incidents.js) (faltas y lesiones),
[Match.js](../js/game/match/Match.js) (el tick).

## El territorio manda (sprint del Territorio, 30-jul-2026)

Desde este sprint, **todo lo que sigue depende de dónde está la pelota**. La cancha se lee en
cinco alturas —área propia · salida · mediocampo · tres cuartos · área rival— y tres carriles.
Cada jugada declara desde qué alturas **nace**, y cuanto más lejos está la pelota de esa cuna,
menos probable es que esa jugada aparezca. Cada acto **mueve** la pelota.

El jugador nunca ve ese número: lo lee en el **mapa de calor**, en el momentum, en la narración
y en qué jugadas le van saliendo.

## Las tres capas

1. **Secuencias** — la columna interactiva. Un tipo de jugada que se despliega en
   uno a cuatro **actos**; cada acto es una decisión del DT.
2. **Eventos sueltos** — jugadas que nacen del tick, fuera de secuencia. Algunas
   piden decisión (penal, último hombre) y otras se narran solas.
3. **Desenlaces transversales** — lo que puede pasarle a *cualquier* jugada al
   terminar: rebote, contra, córner, VAR.

Los actos marcados con 🔓 solo existen si el DT compró el rasgo que los desbloquea.

---

# 1. Las secuencias

Dieciséis tipos. `mine` = yo ataco · `opp` = yo defiendo. Las cuatro **avanzadas** son
el fútbol superior de cada filosofía y solo salen cuando esa identidad está
desarrollada.

| Tipo | Lado | Nace en | Actos que la componen |
|---|---|---|---|
| 🎼 Circulación posicional | mine | salida → tres cuartos | Construcción → Construcción → Definición |
| 🎼 **La sinfonía** *(avanzada · Posesión)* | mine | salida → tres cuartos | Construcción ×3 (×4 con Desesperantes) → Definición |
| ⚡ Transición rápida | mine | salida → tres cuartos | Conducción → Definición |
| ⚡ **Contragolpe letal** *(avanzada · Contragolpe)* | mine | salida → tres cuartos | Conducción → Conducción → Definición |
| 🏃 Desborde por la banda | mine | tres cuartos, **por afuera** | Banda → Centro → Definición |
| 🦁 Recuperación alta | mine | **campo rival** | Presión → Definición |
| 🦁 **Cacería total** *(avanzada · High Press)* | mine | **campo rival** | Presión → Presión → Definición |
| 🌩️ Pelotazo largo | mine | mi campo (y el envío **vuela**) | Duelo aéreo → Definición |
| 🎯 Balón parado a favor | mine | cerca del área rival | Balón parado (acto único) |
| 🧱 Repliegue defensivo | opp | mi campo | Contención → Remate rival |
| 🧱 **La fortaleza castiga** *(avanzada · Bloque bajo)* | opp | mi campo | Contención → Remate rival |
| 🚨 Balón parado en contra | opp | **mi área** | Córner defendido (acto único) |
| 🗼 Salida bajo presión | opp | **mi área / mi salida** | Salida (acto único) |
| 🧤 **Salida desde el área** *(Territorio)* | mine | **mi área / mi salida** | Salida propia → Construcción → Definición |
| 🏹 **Pelota a la espalda** *(Territorio)* | mine | mediocampo → tres cuartos | Pase a la espalda → Definición |
| 🔀 **Cambio de frente** *(Eje Horizontal)* | mine | tres cuartos, **por afuera** | Cambio de frente → Centro → Definición |

---

# 2. Los actos, uno por uno

## ⚡ Construcción — *"¿Cómo la hacen circular?"*
*(Circulación · La sinfonía)*

| Opción | Resolución |
|---|---|
| 🎩 **Pase seguro** | Siempre progresa. La pelota cambia de pies y la jugada escala al acto siguiente. |
| 🔑 **Pase filtrado** | Si llega: la jugada escala con mejor perfil de remate. Si lo interceptan: la jugada muere — y como es una pérdida arriesgada, puede abrir un contragolpe rival. |
| 🔙 **Retroceso de posesión** 🔓 | El pase se juega de verdad. Si llega: el ataque queda mejor perfilado y **el mismo acto se vuelve a jugar** (la jugada no avanza). Si lo roban: el equipo está adelantado y el contragolpe rival es inmediato. Una sola vez por jugada. |

**Además, al acertar la construcción:** contra un rival que espera, la circulación
puede resultar un cebo y **convertirse en transición** cuando el rival da un paso al
frente. 🔓

## ⚡ Conducción — *"La defensa rival viene a la carrera, ¿qué hace?"*
*(Transición · Contragolpe letal)*

| Opción | Resolución |
|---|---|
| 🏃 **Conducir al espacio** | Si se va: gana metros y escala. Si lo derriban: **falta a favor, cobrada donde lo bajaron** (ver abajo). Si la pierde: contragolpe rival. |
| 🎯 **Pase al pie** | Seguro: siempre progresa. La pelota cambia de pies. |

**La falta tiene GEOGRAFÍA (Territorio).** Se cobra donde derribaron al jugador: dentro del
área es **penal**; al borde del área, **tiro libre peligroso**; lejos, uno modesto. Los dos
tiros libres siguen como balón parado a favor — la jugada no muere, cambia de forma. (Antes,
una falta en el mediocampo cobraba penal: era el agujero más grande que dejaba el motor sin
territorio.)

**En el Contragolpe letal la falta tiene además su propia escala:** derribarlo lejos del área es
**amarilla al rival + tiro libre encadenado**; derribarlo en zona letal es **penal**.
Y en el segundo tramo, un rival desesperado puede cometer la falta de último hombre:
**roja directa + tiro libre al borde del área**.

## 🦁 Presión — *"¿Cómo cazan la pelota?"*
*(Recuperación alta · Cacería total)*

| Opción | Resolución |
|---|---|
| 🔥 **Presión total** | Si roban: la pelota es suya en zona letal y el remate que sigue llega inmejorable. Si la rompen: pérdida arriesgada — contragolpe rival. |
| 🕸️ **Cerrar líneas de pase** | Roba más seguido, pero en posición más discreta. |

**En la Cacería total:** el rival que rompe la presión puede romperla **con falta** —
amarilla (la segunda lo expulsa) y tiro libre encadenado. El segundo robo de la
cacería es en zona letal.
**Tras el robo:** puede **convertirse en ataque inmediato** en vez de escalar. 🔓

## 🌩️ Duelo aéreo — *"Pelotazo: ¿cómo lo juega?"*
*(Pelotazo largo)*

| Opción | Resolución |
|---|---|
| 🤜 **Ir al choque** | Si gana por arriba: remata **él de cabeza**. |
| 🪶 **Peinarla al espacio** | Más difícil de ganar. Si gana: la prolonga a un compañero lanzado, que define — y el que peinó queda como asistidor. |
| 🎯 **Pivotear al área** 🔓 | Si gana: la aguanta de espaldas y **la baja al mejor rematador**, que define de frente al arco. |

**Si pierde el duelo:** la jugada muere… salvo que la **segunda pelota** sea nuestra
y el equipo vuelva a lanzar 🔓, o que la zaga rival, incómoda, la mande al **córner**
(solo en La fortaleza castiga).

## 🏃 Banda — *"El pasillo de afuera está abierto, ¿qué hace?"*
*(Desborde por la banda)*

| Opción | Resolución |
|---|---|
| 🏁 **Ir a la línea de fondo** | Carrera contra el lateral más rápido del rival. Si llega: la zaga queda de espaldas y el centro que sigue es el mejor del juego. Si no: puede abrir contragolpe rival. |
| 📡 **Centrar de primera** | No arriesga el desborde, pero la defensa llega acomodada y el centro sale peor. |
| ✂️ **Cortar hacia adentro** | Se perfila y **se saltea el centro**: va directo a rematar él. Si lo cruzan entrando al área: **penal**. Si la pierde: contragolpe rival. |

## 🔀 Cambio de frente — *"El otro carril está vacío"*
*(Cambio de frente — jugada del Eje Horizontal: solo la propone de verdad un equipo con
amplitud, y casi siempre contra un rival amontonado de un lado)*

| Opción | Resolución |
|---|---|
| 🔀 **Diagonal larga al otro carril** | Pase de riesgo. Si cruza: el que recibe queda solo y **el centro que sigue sale con la defensa desarmada**. Si se va al lateral: contragolpe rival. |
| 🎯 **Circular por dentro** | Llega siempre al otro carril, pero el bloque rival se corre a tiempo: el centro sale contra la defensa acomodada. |

## 📡 Centro — *"¿Qué manda desde el costado?"*
*(Desborde por la banda · Cambio de frente)*

**El menú depende de DÓNDE se centra** (Eje Horizontal):

| Opción | Desde | Resolución |
|---|---|---|
| 📡 **Centro al área** | siempre | Busca la cabeza del mejor cabeceador del equipo, que pasa a ser el rematador. Con una línea de tres arriba, el área se llena y el envío encuentra a alguien. |
| 🎯 **Pase atrás rasante** | solo desde la **línea de fondo** | Busca al mejor rematador, que entra **de frente al arco**. Para pisarla y devolverla hay que haber llegado hasta el fondo. |
| 🌙 **Al espacio, segundo palo** | solo **sin haber desbordado** | Más difícil (hay que pasar a toda la zaga), pero lo ataca **el que llega lanzado** — lo elige la velocidad, no el mejor cabeceador parado — y remata mejor que un centro normal. |

Si el envío no llega, la jugada muere ahí.

## 🧤 Salida propia — *"El rival espera arriba, ¿cómo la sacan?"*
*(Salida desde el área — jugada del Territorio: solo existe con la pelota en el fondo propio)*

| Opción | Resolución |
|---|---|
| 💎 **Salir jugando en corto** | Si el pase rompe la primera línea: el equipo sale del embudo **dos zonas de golpe** y la jugada sigue construyendo. Si la pierde: regalo en la puerta del área — el rival remata casi solo. |
| 🌩️ **Buscar al punta** | La jugada **se convierte en un pelotazo**: duelo aéreo arriba. |
| 🚀 **Afuera y a respirar** | Se cede la pelota sin arriesgar nada. La jugada muere ahí. |

## 🏹 Pase a la espalda — *"La zaga rival está adelantadísima"*
*(Pelota a la espalda — jugada del Territorio: contra un bloque rival metido atrás casi no
aparece, porque no hay espalda que atacar)*

| Opción | Resolución |
|---|---|
| 🏹 **Pelota a la espalda** | Doble exigencia: el envío **y** la carrera contra el defensor que vuelve. Si gana las dos: queda **solo dentro del área**. Si el central le gana el metro, la pelota muere en el arquero; si el envío se corta, contragolpe rival. |
| 🎯 **Entre líneas al pie** | Llega más seguido, pero sin ventaja de campo: la jugada escala normal. |

## 🎯 Definición — *"¡Momento de definir!"*
*(el último acto de toda jugada ofensiva)*

| Opción | Resolución |
|---|---|
| 💥 **Rematar** | **Gol**, o el remate se pierde/lo atajan — y entonces puede quedar **rebote** vivo en el área. |
| 🤝 **Buscar al mejor ubicado** | Un pase más. Si no encuentra a nadie: contragolpe rival. Si llega: remata el compañero, con el pasador como asistidor. |
| 🎯 **Pase Atrás** 🔓 | La pisa y la devuelve al que entra de frente. Si el pase se corta: contragolpe rival. Si llega: remate servido de frente al arco. |
| 🧊 **Congelar el partido** 🔓 | Se renuncia al remate: la pelota vuelve al área propia, corre el reloj y **el rival pierde su próxima llegada**. Solo en el tramo final y sin ir perdiendo. |

**Cosas que pueden pasar antes de definir:**
- **La sinfonía**, si sonaron todos sus compases, puede terminar con el rival mareado
  derribando dentro del área: **penal**.
- La pelota puede quedar **servida** (solo hay que empujarla) 🔓.
- El delantero puede **soltarse solo**: mano a mano con el arquero 🔓.

## 🎯 Balón parado a favor — *"¿Qué ensayaron en la semana?"*

**El carril decide qué balón parado es** (Eje Horizontal): desde la banda es un **córner** y
desde el centro, un **tiro libre frontal**. La jugada se nombra distinto y las opciones cambian.

| Opción | Dónde | Resolución |
|---|---|---|
| 🎯 **Tiro libre directo al arco** | solo **de frente** | La opción más peligrosa del sitio, y más aún cuanto más cerca se cobra. Gol, o rebote/atajada. Desde el córner no existe: no hay ángulo. |
| 📡 **Centro al área** | siempre | Cabezazo del mejor cabeceador. **Más peligroso desde el costado** (el córner es su sitio natural) y peor de frente, con la barrera y la zaga mirando la pelota. |
| 🎭 **Jugada preparada** | siempre | Descarga corta y remate del lanzador. Gol, o rebote/atajada. |

## 🧱 Contención — *"¡Encara! ¿Cómo lo frena la zaga?"*
*(Repliegue · La fortaleza castiga)*

| Opción | Resolución |
|---|---|
| 🧍 **Contener y esperar** | Seguro. Si corta: el ataque rival muere ahí. |
| 🏃 **Salir a presionar** | Corta más… pero si falla, el rival queda mejor perfilado para rematar. |
| 🚀 **Reventar el balón** 🔓 | Mata la jugada rival **sin remate**: el rival tiene que armar de nuevo desde atrás. A veces el despeje apurado sale al **córner** en contra. |

**Si la zaga corta**, la jugada puede además:
- **Convertirse en pelotazo propio** con el rival desarmado (solo en La fortaleza castiga).
- **Encadenar un contraataque** 🔓.

**Si la zaga no corta**, la jugada puede:
- Morir igual, cortada por oficio (falta táctica, ritmo roto) 🔓.
- Convertirse en el **mano a mano del último hombre** (ver §3).
- Escalar al remate rival.

## 🧱 Remate rival *(automático, sin decisión)*
*(cierra el Repliegue y La fortaleza castiga)*

El rival remata contra mi arquero: **gol rival**, o atajada/desviado/bloqueo de la
zaga. Es el único acto que se resuelve solo, sin preguntarle nada al DT.

## 🚨 Córner defendido — *"El área se llena de camisetas rivales"*
*(Balón parado en contra)*

| Opción | Resolución |
|---|---|
| 🧲 **Defensa en zona** | Cada uno cuida su espacio: el cabezazo rival llega con el área poblada. Gol rival, o se salva. |
| 🥊 **Salir a despejar** | Si la zaga llega: despeje limpio, jugada muerta. Si falla: **el cabeceador rival remata solo**. |

**Tras despejar el córner**, la jugada puede encadenar un **pelotazo propio** o un
**contraataque** 🔓.

## 🗼 Salida bajo presión — *"¿Cómo salen del fondo?"*
*(Salida bajo presión)*

| Opción | Resolución |
|---|---|
| 💎 **Salir jugando** | Si el pase rompe la presión: **la jugada se convierte en transición mía** con el rival partido. Si la pierde: regalo en zona letal — el rival remata casi solo. (Un tercer hombre puede aparecer y salvar la salida sin sangre 🔓.) |
| 🚀 **Reventarla** | Se pierde la posesión, no pasa nada. Puede reiniciarse rápido y **volverse contraataque** 🔓. |

---

# 3. Eventos fuera de secuencia

## Con decisión del DT

| Jugada | Decisión | Resolución |
|---|---|---|
| 🎯 **Penal a favor** | Elegir pateador entre los once | Gol, o lo ataja / se va afuera / al palo. Un penal convertido no lo anula el VAR. |
| 🧤 **Penal en contra** | Elegir hacia dónde se lanza el arquero | Si adivina el palo puede **atajarlo**; si no, gol (a veces el rival la manda afuera). |
| 🛡️ **Último hombre** — un rival se escapa solo y mi central es el último | **🏃 Anticipar**: corte magistral, o le gana la espalda y queda de cara al arco. **🧹 Barrerse**: saca la pelota al córner, o llega tarde → **penal**, **amarilla** o **roja de último hombre**. **🧍 Esperar**: contiene, la zaga vuelve corriendo y el rival remata sin ángulo. |
| 🚑 **Lesión grave de un titular** | Reemplazarlo en la Gestión de plantilla | El lesionado sale y pierde partidos. Sin cambios disponibles, se juega con uno menos. |
| 🧤 **Roja al arquero** | Elegir qué jugador de campo sale para meter al suplente | Si no hay arquero en la banca, un jugador de campo se pone los guantes. |
| ⏸️ **Entretiempo** | Ajustar equipo, mentalidad y cambios | — |

## Sin decisión (se narran solos)

- **Remate ambiente mío** — una llegada que no se juega acto por acto: gol o se pierde.
- **Remate ambiente rival** — su equivalente en contra.
- **Falta** — a favor (a veces amarilla al rival) o en contra: puede quedar en nada,
  ser **amarilla** (la segunda expulsa) o **roja directa**.
- **Golpe / lesión leve** — el jugador sigue tocado, con menos energía.
- **Balón largo a la espalda** — el pelotazo rival que puede terminar en el mano a mano
  del último hombre… o morir leído por el central 🔓 o en fuera de juego 🔓.
- **Descuento** — el cuarto árbitro levanta el cartel y se sigue jugando.
- **Córners y pases de transmisión** — el panel de estadísticas del partido.
- **Relato ambiente y consejos del asistente** — leen el partido y comentan.

---

# 4. Desenlaces transversales

Le pueden pasar a cualquier jugada, sin importar de dónde venga:

| Desenlace | Cuándo |
|---|---|
| ⚽ **Gol** — con o sin asistidor | Cualquier remate que entra. |
| 📺 **Revisión del VAR** | Cualquier gol de jugada, mío o rival: puede anularse por posición adelantada. Los penales convertidos no se revisan. |
| 🔄 **Rebote** | Mi remate atajado o desviado puede dejar la pelota viva en el área: alguien la caza y remata otra vez, sucio y a quemarropa. Uno por jugada. |
| 🔙 **Contragolpe rival** | Solo tras una pérdida **arriesgada** mía: pase filtrado interceptado, conducción perdida, presión rota, pase de gol errado. Casi siempre desemboca en el mano a mano del último hombre. |
| 🎯 **Tiro libre encadenado** | La falta que corta la Cacería total o el Contragolpe letal: la jugada no muere, sigue como balón parado a favor. |
| 🚩 **Córner encadenado** | El pelotazo que muere en la zaga rival puede fabricar un córner a favor. |
| 🟨🟥 **Expulsión rival** | La segunda amarilla de un mismo rival lo echa: el equipo rival juega con uno menos el resto del partido. |
| 🎰 **Tanda de penales** | Ver §6. |

---

# 5. Jugadas y cadenas que abren los rasgos

Nada de esto existe hasta que el DT lo compra en la pizarra.

## Jugadas nuevas (opciones nuevas en un acto)

| Jugada | Dónde aparece |
|---|---|
| 🔙 **Retroceso de posesión** | Acto de construcción, **con el equipo ya adelantado** |
| 🧊 **Congelar el partido** | Definición, tramo final, sin ir perdiendo |
| 🚀 **Reventar el balón** | Acto de contención, **defendiendo en campo propio** |
| 🎯 **Pivoteo al área** | Duelo aéreo, **cerca del área rival** |
| 🎯 **Pase Atrás** | Definición de un contraataque |

## Cadenas reactivas (una jugada que nace del resultado de otra)

| Cadena | Nace de |
|---|---|
| **Mordida tras pérdida** → recuperación mía | Mi ataque muere en pérdida |
| **La trampa se cierra** → contraataque mío | Repliegue contenido |
| **Contraataque** → transición mía | Repliegue contenido |
| **Segunda pelota** → pelotazo o contra | Duelo aéreo perdido |
| **Despeje que es pase** → pelotazo o contra | Córner rival defendido |
| **Saque rápido** → contra | Despeje de la salida asfixiada |
| **Cabeza de playa / saque al área** → balón parado a favor | Pelotazo que muere sin gol |
| **Robo que ya es ataque** → transición mía | Acto de presión acertado |
| **El anzuelo** → transición mía | Construcción acertada contra un rival que espera |

## Variantes de arranque

Una jugada puede **nacer distinta**: la recuperación que nace sobre el saque de meta
rival (solo **con la línea adelantada**), la circulación que arranca con un mediocampista descolgado entre los centrales,
la circulación que de pronto se va por arriba, el contraataque que se juega a un solo
pase, o el contraataque que **nace ya resuelto en mano a mano**.

---

# 6. Tanda de penales

Cinco rondas y muerte súbita. Se cierra apenas hay definición matemática.

| Turno | Decisión | Resolución |
|---|---|---|
| **Penal mío** | Elegir pateador **y** dirección (a un palo o al centro) | Gol o fallo. Al centro es más arriesgado: el arquero a veces se queda. En tandas largas puede tener que patear hasta el arquero. |
| **Penal rival** | Elegir hacia dónde se lanza mi arquero | Si adivina, puede atajarlo; si no, gol — aunque a veces la tiran afuera. |

---

# 7. Palancas del DT durante el partido

No son jugadas, pero cambian lo que ocurre en ellas:

- 🔥 **Botón de presión** — ráfagas de presión alta: el equipo roba más arriba y ataca
  mejor, se expone atrás, y esos minutos cuestan el doble de energía.
- 🔁 **Gestión de plantilla en vivo** — cambios, incluidos los forzados por lesión.
- 🎚️ **Mentalidad** — ofensiva / normal / defensiva: inclina cuántas jugadas propone
  el equipo y cuántas sufre.
- 📐 **El dibujo** (Eje Horizontal) — una línea de **tres** ocupa los tres carriles: arriba
  significa llegar a las dos bandas (más desborde, más cambio de frente, centros que
  encuentran gente); atrás significa cubrirlas (el ataque rival por afuera duele mucho menos).
  Un dibujo sin líneas de tres ataca y defiende por el medio. Con cinco de campo nunca se
  pueden tener las dos cosas.
- 🧱 **Altura del bloque** (Territorio) — muy bajo · bajo · medio · alto · muy alto. Decide
  **dónde vive el equipo**, y con eso qué jugadas aparecen: arriba se roba arriba y no se
  revienta la pelota; abajo se revienta, se sale de contra y aparece la salida desde el área.
  Jugar alto regala espacio a la espalda y cuesta piernas. Gratis antes del partido y en el
  entretiempo; **en juego consume una de las 3 ventanas tácticas**.
