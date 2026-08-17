# Catálogo de Rasgos v2 — el árbol de identidad completo

Documento de referencia del árbol de identidad. Lista los **48 rasgos vivos** con su
efecto, sus requisitos y los hooks que consume cada uno del motor. Diseño narrativo en
[ROADMAP-rasgos.md](ROADMAP-rasgos.md); la fuente de verdad son siempre los datos, en
[content/traits/](../js/content/traits/).

> ✅ **Al día con el código al 13-ago-2026** — rediseño v2: de 64 rasgos asimétricos a
> **48 en una forma única**, 12 por filosofía. Las tablas de abajo se regeneran desde
> `content/traits/`.

## La forma, y por qué las cuatro son iguales

Antes cada filosofía tenía entre 15 y 18 rasgos repartidos sin regla: Press llegó a
tener cinco Masters y Bloque cuatro básicos. La pizarra no se podía leer de un vistazo
y comparar dos árboles era imposible. Ahora las cuatro comparten la misma silueta:

```
                     RAÍZ  (1 nodo, sin rama, sin requisito)
                       │
        ┌──────────────┼──────────────┐
      FIRMA        RESPUESTA      EXPANSIÓN
     Básico          Básico         Básico
   Intermedio      Intermedio     Intermedio
     Avanzado        Avanzado       Avanzado
        │                └──────┬──────┘
    MASTER propio         MASTER de convergencia
                        (`alguno` de los dos avanzados)
```

**1 + 9 + 2 = 12 por filosofía × 4 = 48.** El camino mínimo a cualquiera de los dos
Masters cuesta **5 PI** y son siempre cinco escalones — no hay un árbol más barato que
otro, que es lo que el reparto viejo no garantizaba.

### La raíz es el primer gasto obligado

Decisión del PO: la raíz es la **declaración de identidad**, y los tres básicos cuelgan
de ella. Consecuencia asumida: el onboarding **deja de ser un 1-de-3** — el PI inicial
se gasta sí o sí en la raíz, y la primera elección de verdad se corre al segundo PI, ya
dentro de la run. A cambio, cada árbol tiene una sola entrada y la pizarra se lee.

## La escala numérica cerrada

| Tipo de efecto | Valores permitidos |
|---|---|
| Probabilidad de disparo (`p`) | 20% · 25% · 30% · 40% · 50% |
| Bonus de acierto | +5% · +10% · +15% · +20% |
| Multiplicador de pool | ×1.25 · ×1.5 · ×0.75 |

El tamaño del bonus sale del **peso del momento futbolístico**, no del tier del nodo:
acto repetido (pases de circulación, duelos sueltos) **+5%** · acto decisivo (el pase
que rompe líneas, contener, el balón parado) **+10%** · desenlace (el remate, el mano a
mano) **+15%** · regalo (el gol ya servido) **+20%**.
`tests/traits.test.js` verifica la escala rasgo por rasgo.

### La excepción: los multiplicadores derivados

Tres pesos **no entran en la escala y no deben redondearse** — `osciladores` (×1.39),
`el_anzuelo` (×1.67) y `fortaleza_inexpugnable` (×0.75). No se eligen: se **calculan**
como `1 / celda` de la matriz de counters, para dejar ese cruce en tablas. Redondear
Osciladores a ×1.5 lleva la celda a 1.08, o sea que la Posesión pasa a **ganar** el
cruce contra el Press en vez de emparejarlo — que es exactamente lo que la ley del arco
prohíbe. El test lee la celda real del motor, así que si la matriz cambia, avisa.

## Los íconos

Cada rasgo tiene **dos**: el emoji de `trait.icon`, que es lo que se lee en el relato
del partido y en el diario (texto plano, no admiten SVG), y el **ícono pixel dibujado**
de [ui/traiticons.js](../js/ui/traiticons.js), que es lo que se ve en la pizarra y en la
ficha del riel. La regla de color que hay que respetar al agregar arte nuevo: **ningún
ícono se pinta del color de marcador de su propia filosofía** — el nodo ya está trazado
con ese color y el dibujo desaparece adentro. Los cuerpos van un escalón más oscuro.

## Las tablas

### 🦁 High Press

| Tier | Rama | Rasgo | Requiere | Efecto | Hooks |
|---|---|---|---|---|---|
| — | Raíz | **Incomodar** | — | **×0.75** menos jugada FIRMA del rival en su sorteo: no ataca menos, renuncia a lo suyo | `muzzleOppFirma` |
| B | Firma | **Presión Intensificada** | Incomodar | **+10%** de acierto cada vez que el equipo sale a PRESIONAR | `pressBonus` |
| I | Firma | **Gegenpressing** | Presión Intensificada | **30%** de encadenar una recuperación mía justo al perder la pelota (+10% de acierto)<br>**PROFUNDA** la jugada firma del Press gana su tramo extra | `chainOnMineFail` `deepPress` |
| A | Firma | **Angriffpressing** | Gegenpressing | **50%** de que la recuperación nazca en su versión PROFUNDA: robo sobre el saque de meta rival (+10% de acierto)<br>⚠ Solo con BLOQUE ALTO o MUY ALTO: no se salta sobre el saque de meta desde el propio área. | `variantDeep` |
| M | Firma | **Pressingfalle** | Angriffpressing | **+10%** de acierto en toda la familia de la RECUPERACIÓN<br>**+10%** de que enganche la mordida tras pérdida (sobre el 30% de Gegenpressing) | `masterPress` |
| B | Respuesta | **Pulmones de Acero** | Incomodar | **−20%** de energía por cada botón de PRESIÓN que aprietes en el partido | `pressStamina` |
| I | Respuesta | **Vigilancia Defensiva** | Pulmones de Acero | **40%** de cortar el pelotazo a tu espalda ANTES de que se vuelva mano a mano | `breakawayGuard` |
| A | Respuesta | **Falta Táctica** | Vigilancia Defensiva | **NUEVA** desbloquea CORTARLA CON FALTA en la contención: mata el ataque rival sin remate, y no falla nunca<br>**🟨** amarilla segura, UNA vez por partido — y la segunda del mismo jugador te deja con diez | `tacticalFoul` |
| B | Expansión | **Directo** | Incomodar | **30%** de que la recuperación saltee los actos intermedios y vaya directo al desenlace (+10% de acierto) | `skipToFinish` |
| I | Expansión | **El Zarpazo** | Directo | **NUEVA** desbloquea REMATAR DE PRIMERA en el desenlace del robo alto: sin control, en el mismo movimiento<br>**+20%** de acierto si la agarra bien, porque el arquero no llegó a acomodarse — pero un 30% de las veces se va a la tribuna sin remate | `firstTime` |
| A | Expansión | **Pacientes** | El Zarpazo | **+10%** de acierto: tras el ROBO ALTO el pase encuentra al MEJOR rematador, no al más cercano | `supportUpgrade` |
| M | Resp+Exp | **Mordedura Fatal** | Falta Táctica **o** Pacientes | **50%** de que la recuperación nazca YA en el desenlace, sin actos intermedios | `skipToFinish` |

### 🎼 Posesión

| Tier | Rama | Rasgo | Requiere | Efecto | Hooks |
|---|---|---|---|---|---|
| — | Raíz | **El Rondo** | — | **×1.25** más CIRCULACIÓN en el sorteo de jugadas del partido<br>**+10%** de desgaste de energía del RIVAL: el que corre detrás de la pelota es él | `poolMod` `oppStamina` |
| B | Firma | **Buen Pie** | El Rondo | **+5%** de perfil de remate por cada PASE SEGURO completado: circular deja de ser trámite | `safePass` |
| I | Firma | **El Tercer Hombre** | Buen Pie | **40%** de rescatar la SALIDA bajo presión cuando el pase falla, sin regalarle el remate al rival | `playoutRescue` |
| A | Firma | **Osciladores** | El Tercer Hombre | **+10%** de acierto en la DIAGONAL LARGA al carril vacío, el cambio de frente<br>**×1.39** más CIRCULACIÓN en tu sorteo, pero solo frente a 🦁 High Press: neutraliza esa celda, no la invierte | `switchPass` `poolMod` |
| M | Firma | **La Máquina Colectiva** | Osciladores | **+5%** de INICIATIVA: el reparto de jugadas del partido se inclina a tu favor de raíz<br>**40%** de «pelota servida» una vez que la circulación llegó a ZONA DE REMATE (+20%: el gol a puerta vacía) | `masterPosesion` `tapIn` |
| B | Respuesta | **Cabeza Fría** | El Rondo | **+10%** de acierto al SALIR JUGANDO cuando el rival te asfixia la salida | `playoutBonus` |
| I | Respuesta | **La Trampa** | Cabeza Fría | **NUEVA** desbloquea DEVOLVERLA ATRÁS: sacar al rival de su bloque y rearmar (+10% de acierto)<br>**−5%** de acierto en el remate del rival cuando te recupera la pelota: recupera lejos<br>⚠ Devolverla atrás solo existe con el equipo YA ADELANTADO, de mediocampo en adelante: retroceder desde tu propia salida no saca a nadie de su bloque. | `oppShotMalus` `backPass` |
| A | Respuesta | **La Frontera** | La Trampa | **40%** de cortar el pelotazo a tu espalda antes de que se vuelva mano a mano<br>**50%** de anular la contra rival por OFFSIDE<br>⚠ La trampa del offside pide BLOQUE ALTO o MUY ALTO: sin línea adelantada no hay trampa que tender (el corte del pelotazo sí aplica siempre). | `breakawayGuard` `offsideTrap` |
| B | Expansión | **Pase de Riesgo** | El Rondo | **+10%** de acierto en el PASE FILTRADO, el que rompe líneas | `riskPass` |
| I | Expansión | **Desesperantes** | Pase de Riesgo | **PROFUNDA** la jugada firma de Posesión gana su 4º compás y abre el penal por desesperación | `deepPosesion` |
| A | Expansión | **Fríos** | Desesperantes | **NUEVA** desbloquea CONGELAR en el desenlace: devolverla al área propia y comer reloj<br>**−1** llegada rival descontada del partido por cada congelada — el precio es resignar TU ocasión<br>⚠ Rasgo de ESTADO: solo desde el minuto setenta y sin ir perdiendo. Fuera de ahí no aporta nada. | `iceGame` |
| M | Resp+Exp | **El Carrusel** | La Frontera **o** Fríos | **−1** de energía del RIVAL por cada pase que completás: la circulación es el desgaste | `passDrain` |

### ⚡ Contragolpe

| Tier | Rama | Rasgo | Requiere | Efecto | Hooks |
|---|---|---|---|---|---|
| — | Raíz | **Punta de Velocidad** | — | **+5%** de acierto al CONDUCIR la contra: el arranque al espacio se gana | `carryBonus` |
| B | Firma | **Primer Pase** | Punta de Velocidad | **+10%** de acierto en el PRIMER pase de la contra, el que la lanza | `transitionPass` |
| I | Firma | **Ataque Relámpago** | Primer Pase | **30%** de que la contra saltee los actos intermedios y se juegue a UNA (+10% de acierto)<br>**PROFUNDA** la jugada firma del Contragolpe gana su tramo extra | `skipToFinish` `deepContra` |
| A | Firma | **Duelista** | Ataque Relámpago | **30%** de que la contra YA LANZADA se salte su último pase: encara, gana el duelo y define él (+15%) | `accelFinish` |
| M | Firma | **El Enjambre** | Duelista | **+10%** de acierto cuando la contra llega en oleada a campo abierto<br>**+5%** de que le hagan FALTA al que conduce la contra: más tiros libres y más penales | `avalancha` `counterFouls` |
| B | Respuesta | **Estóicos** | Punta de Velocidad | **+10%** de acierto en el acto de CONTENER el ataque rival cuando estás replegado | `containBonus` |
| I | Respuesta | **El Anzuelo** | Estóicos | **×1.25** el rival sale a presionar tu salida más seguido: sobrevivirla YA es una contra<br>**×1.67** más TRANSICIONES en tu sorteo, solo contra ⚡ Contragolpe y 🧱 Bloque bajo (el partido muerto)<br>**30%** de convertir la circulación-cebo en contra mía (+10% de acierto) | `oppPoolMod` `poolMod` `baitConvert` |
| A | Respuesta | **Salir de Contra** | El Anzuelo | **30%** de que CONTENER el ataque rival encadene contra mía sin pasar por armar (+10% de acierto) | `chainOnContain` |
| B | Expansión | **Saque Rápido** | Punta de Velocidad | **30%** de que el despeje de una salida asfixiada reinicie rápido y sea CONTRA mía (+10% de acierto) | `quickRestart` |
| I | Expansión | **La Pausa** | Saque Rápido | **NUEVA** desbloquea LA PAUSA al conducir la contra: frenar para que lleguen los de atrás (+15% de acierto)<br>**25%** de que la defensa se acomode mientras esperás y la contra se apague: frenar se paga | `pauseCounter` |
| A | Expansión | **Pase Atrás** | La Pausa | **NUEVA** desbloquea PASE ATRÁS como opción del desenlace de la contra<br>**+15%** de acierto respecto de rematar — pero es un pase de verdad: perderlo abre contra rival | `squarePass` |
| M | Resp+Exp | **Sin Escalas** | Salir de Contra **o** Pase Atrás | **20%** de que la contra NO EXISTA como jugada: un solo pase y arranca YA de cara al arquero (+15%) | `oneOnOne` |

### 🧱 Bloque bajo

| Tier | Rama | Rasgo | Requiere | Efecto | Hooks |
|---|---|---|---|---|---|
| — | Raíz | **Marca Zonal** | — | **20%** de que el avance rival muera interceptado ANTES de llegar al remate | `oppLoseActs` |
| B | Firma | **Compactación** | Marca Zonal | **−5%** de acierto en el remate rival del REPLIEGUE: con el centro cerrado, remata desde afuera | `oppShotMalus` |
| I | Firma | **Área Blindada** | Compactación | **PROFUNDA** la fortaleza contiene mejor y castiga más al rival que se estrella contra ella<br>**−10%** de acierto en el remate rival DENTRO del área | `deepBloque` `boxShield` |
| A | Firma | **Muralla** | Área Blindada | **−15%** de acierto en TODO remate rival<br>⚠ Rasgo de ESTADO: solo con el marcador empatado o a favor. Yendo perdiendo no aporta nada. | `wall` |
| M | Firma | **Fortaleza Inexpugnable** | Muralla | **25%** de que la OCASIÓN CLARA rival (mano a mano, contra tras tu pérdida) directamente no ocurra<br>**×0.75** menos asedio del rival de 🎼 Posesión: neutraliza la celda que te castiga, no la invierte<br>**−10%** de acierto rival como tope: cada remate que fallan les suma frustración | `clearChanceGuard` `oppPoolMod` `frustration` |
| B | Respuesta | **Dominio Aéreo** | Marca Zonal | **−5%** de acierto en el cabezazo rival del córner en contra | `aerialDef` |
| I | Respuesta | **Atentos** | Dominio Aéreo | **30%** de que el córner rival defendido encadene PELOTAZO mío (+5% de acierto)<br>**30%** de que el rechace de un duelo aéreo perdido encadene PELOTAZO mío (+5% de acierto) | `chainOnDefendSp` `chainOnDuelFail` |
| A | Respuesta | **Pelotazo** | Atentos | **NUEVA** desbloquea REVENTAR EL BALÓN defendiendo en campo propio: mata el ataque rival sin remate<br>**30%** de córner concedido — y resignás la conversión de la fortaleza: es un canje, no un regalo | `clearBall` |
| B | Expansión | **Especialistas** | Marca Zonal | **+10%** de acierto en la ejecución de TU balón parado | `setpieceRehearsed` |
| I | Expansión | **Estrategia Ensayada** | Especialistas | **×1.25** más BALÓN PARADO en tu sorteo, apilado sobre el que el Bloque ya tiene de fábrica<br>**30%** de que ese balón parado nazca ENSAYADO: se ve antes de elegir y suma +10% de acierto | `poolMod` `setpieceVariant` |
| A | Expansión | **La Segunda Ola** | Estrategia Ensayada | **40%** de que el rechace de TU balón parado vuelva a caer en el área: hay segundo remate (+10% de acierto) | `secondWave` |
| M | Resp+Exp | **Hombre Objetivo** | Pelotazo **o** La Segunda Ola | **NUEVA** desbloquea PIVOTEO AL ÁREA rival como tercera opción del duelo aéreo<br>**+10%** de acierto: la baja al mejor rematador, que define de frente al arco | `pivot` |

## Deuda que dejó el rediseño

Cortar 16 rasgos dejó varios hooks del motor sin dueño. La **pasada de revisión del
13-ago** (ver más abajo) reenchufó tres —`chainOnContain` en Salir de Contra,
`counterFouls` en El Enjambre, `tiredLegs` en cambio se apagó— y quedan estos, vivos y
sin quien los encienda: `convertOnPress`, `supportUpgrade`, `finishSupport`,
`variantSwitch`, `recycleUpgrade`, `deepFinish`, `firstChanceGuard`, `secondBallUpgrade`
y `tiredLegs`. El código sigue ahí y funciona: son los ganchos donde engancharía
contenido futuro sin tocar el motor — o los que habría que borrar si esas ideas no vuelven.

## La pasada de revisión (13-ago-2026)

Con los 48 ya en el juego se midió el catálogo en tres ejes —**agencia** (¿el jugador
decide algo nuevo?), **voz** (¿el motor lo narra?) y **carga de lectura** (líneas de
efecto + gate)— y salieron dos desequilibrios que el rediseño no había visto:

- **El 🦁 Press tenía CERO jugadas nuevas.** Doce nodos de porcentajes en la filosofía
  que da nombre al género y que más gente elige primero. Lo arregló **Falta Táctica**,
  que además es el parche que el Press se fabrica contra su propio riesgo: cortar con
  falta no falla nunca, cuesta una amarilla y solo se puede una vez por partido.
- **Riqueza y legibilidad estaban invertidas**: el árbol más rico (🧱 Bloque, 3 jugadas
  nuevas) es también el más denso de leer (8 de 12 nodos con dos líneas o gate), y el
  más simple era el más pobre.

Los otros cuatro cambios atacan rasgos que existían pero no se sentían: **Salir de
Contra** reemplazó a Segundo Aire (que pedía un estado de partido entero en vez de un
momento), **El Enjambre** dejó de ser el único Master de una sola línea, **El Rondo**
por fin narra el desgaste que ya provocaba, **Osciladores** dejó de ser inerte en 3 de
cada 4 cruces al engancharse al cambio de frente, y **Estrategia Ensayada** cambió un
multiplicador mudo por una variante que se ve ANTES de elegir.

Una segunda vuelta atacó la REPETICIÓN y el peso de lectura:

- **Pacientes** reemplazó a Tres Toques. La rama Expansión del Press eran tres
  versiones del mismo mecanismo (Directo abre el atajo, Tres Toques lo afilaba,
  Mordedura Fatal lo agranda); ahora cuenta cuatro ideas — voy directo · me la quedo ·
  elijo bien a quién · la mato. Para eso `supportUpgrade` dejó de estar clavado a la
  familia de la contra y pasó a resolverse por familia, como sus hermanos.
- **Duelista y Sin Escalas** producían los dos la misma imagen (el mano a mano). Eran
  dos momentos futbolísticos distintos mal contados: ahora Duelista es *encarar al
  último y llevárselo puesto DENTRO de una contra en marcha* y Sin Escalas es *no hubo
  jugada: un pase de área a área*.
- **Cuatro gates borrados** (La Máquina Colectiva, Pelotazo, Al Área, Hombre Objetivo).
  No se ocultó nada: el sitio se absorbió en la línea del efecto, que ya lo nombraba.
  El test cambió con ellos — antes exigía el campo `gate`, ahora exige que el rasgo DIGA
  dónde funciona, en el gate o en el efecto. Lo que no se puede es callarlo.

Una tercera vuelta emparejó el REPARTO de jugadas nuevas, que había quedado en Bloque 3 ·
Posesión 2 · Press 1 · Contra 1. Antes de elegir se midió, sobre 400 partidos, cuántas
veces SE VE cada rasgo del Contragolpe (visibilidad en el relato, no actividad: algunos
hooks se narran con freno). El resultado contradijo la hipótesis de partida —Saque Rápido,
que parecía el eslabón débil por lo estrecho de su disparador, se veía el 18% de los
partidos— y señaló al verdadero: **Segunda Pelota, 6.3%**, y encima el único básico del
juego que no era un número simple sino una cadena probabilística.

Así que la rama Expansión se corrió entera: murió Segunda Pelota, Saque Rápido bajó al
básico y el Intermedio lo tomó **La Pausa** — frenar la contra para que lleguen los de
atrás. Es la única jugada del catálogo que le enseña a un árbol a hacer lo CONTRARIO de su
fantasía, y su precio no es territorio sino riesgo: mientras esperás, un 25% de las veces
la defensa termina de acomodarse y la contra se apaga sin remate.

**La medición de después cierra el argumento de todo el arco**: La Pausa se ve en el
**47.3%** de los partidos y Pase Atrás en el 46.8% — las dos jugadas nuevas son lo segundo
y tercero más visible del árbol, solo detrás de un Master. Una jugada nueva vale por tres
bonus.

Una cuarta vuelta hizo lo mismo con el 🦁 Press, y el instrumento volvió a mandar: el nodo
muerto era **Egoístas (2.8%)**, cuyo efecto —reciclar un pase filtrado interceptado— solo
existe en la CIRCULACIÓN, un fútbol que este árbol casi nunca sortea. Estaba escrito para
una filosofía que no era la suya. Ese slot lo tomó **El Zarpazo**: rematar de primera en el
desenlace del robo alto, sin controlar. Es todo o nada — un 30% de las veces se va a la
tribuna sin siquiera un remate, y cuando la agarra bien vale un regalo (+20%) porque el
arquero no llegó a acomodarse. Pasó de 2.8% a **27%** de visibilidad.

La misma medición destapó que **Directo caía a 0%** en cuanto se compraba Mordedura Fatal:
el desempate por probabilidad del atajo hacía ganar al Master ENTERO, así que el básico
quedaba como un Punto de Identidad gastado en nada. Corregido: la FRECUENCIA la manda el
mejor, la CALIDAD se suma. Su voz sigue siendo una sola —los dos narran el mismo instante—
y eso es correcto; lo que cambia es que ahora su número cuenta.

⚠ **El instrumento mide VOZ, no efecto.** Un 0% en esa tabla puede ser un rasgo muerto o un
rasgo que aporta en silencio porque otro narra su momento. Vale para orientar, no para
condenar un nodo sin mirar el código.

### La quinta vuelta: el Bloque, y una etiqueta que mentía

Al medir el 🧱 Bloque apareció que **Al Área no era una jugada**: `beachhead` no le pone
ninguna opción en la mano al jugador — es una cadena automática, como Atentos o Saque
Rápido — pero se anunciaba con la placa `NUEVA`. O sea que el reparto real de decisiones
ya era parejo (2 por filosofía) y lo que sobraba era la etiqueta.

Se reemplazó igual, porque además era el nodo más invisible del árbol (9.4%): su gate lo
ataba a la zona del área rival, donde un equipo de Bloque casi nunca está. En su lugar
entró **La Segunda Ola** — en tu balón parado el área sigue llena cuando la despejan, así
que el rechace vuelve a caer adentro y hay segundo remate.

**Y el trabajo defensivo dejó de ser mudo.** Área Blindada, Muralla y Dominio Aéreo traían
su texto escrito en el catálogo desde siempre y **nadie lo imprimía nunca**: `oppShotBlockMalus`
sumaba el malus y se iba en silencio. Los tres marcaban 0.0%. Ahora hablan cuando el remate
rival falla —el instante en que su trabajo se cobra— y habla **uno solo, sorteado** entre
los activos: la primera versión los ordenaba por especificidad y la Muralla seguía en 0%
porque siempre ganaba el mismo micrófono.

**El error de método que esto destapó, y que vale para el futuro:** en la vuelta anterior le
quité a Estrategia Ensayada su `×1.25` al sorteo por considerarlo mudo. Medido después: un
equipo de Bloque juega **0.34 balones parados por partido**, y ese multiplicador era lo
único que le daba materia prima a los TRES nodos de esa rama. Restaurado (0.48/partido).
La lección no es que los multiplicadores se sientan — no se sienten — sino que **son lo que
hace existir el fútbol donde los rasgos visibles ocurren. Se mide la frecuencia ANTES de
quitar uno.**

### El techo de opciones de un acto

El árbol AGREGA opciones a los actos, así que el ancho de una decisión ya no lo decide el
motor: lo decide la build del DT. Hoy la contención llega a **cuatro** con una build 🦁+🧱
(contener · presionar · reventar el balón · cortarla con falta) y el desenlace también,
porque Pase Atrás y El Zarpazo son excluyentes por familia. Dos defensas: la tabla de
teclas de la pantalla tiene letras de sobra, y `tests/traits.test.js` fija el techo — si un
rasgo futuro empuja un acto más allá, salta ahí y no en una captura.

**La ley que sale de todo esto**, y que conviene respetar al agregar un rasgo: un efecto
que el relato no puede narrar no se siente, por mucho que se mida. Los multiplicadores de
sorteo son el caso crónico — si un rasgo nuevo solo mueve pesos, necesita una segunda
pata visible o no merece un nodo.

Las partidas guardadas de antes del rediseño **no se migran**: `SAVE_VERSION` subió a 2
y una ranura vieja se marca incompatible y solo se puede borrar (decisión PO). El motivo
no es solo que dieciséis ids desaparecieron — es que un árbol guardado sin su RAÍZ deja
los candados nombrando un nodo que esa run ya no puede comprar.
