# ROADMAP — El arco de Rasgos (T1–T3)

**Creado el 23-jul-2026** tras 2 rondas de decisiones de diseño del PO (AskUserQuestion +
conversación). Base: master `7c7d698` (GDD Bible v2.0 — el capítulo 5 introduce Principios,
Niveles, Puntos de Identidad y Rasgos). Ley de diseño: **Bible §5 v2.0** + las *Philosophy
Trait Design Rules* del PO, en especial:

> **"¿Esto hace que mi equipo juegue un fútbol diferente?"** — si la respuesta es NO,
> el rasgo no pertenece al sistema.

- Los Rasgos **NO son mejoras estadísticas** (nada de +10% presión, +15 ataque).
- Modifican prioridades, decisiones, posicionamiento, generación de secuencias, IA.
- Niveles de rasgo = complejidad táctica, **NO poder**.
- El jugador debe pensar *"quiero que mi equipo juegue así"*, no *"quiero este bono"*.

**Por qué ahora es barato:** el arco F dejó el 70% construido. Las 5 **aristas** SON los
5 Principios del GDD v2.0 (rename). `FILO_LEVELS`, el sesgo del pool (`applyFiloWeights`),
la progresión por ejecución y la matriz de counters ya existen. Lo nuevo de verdad:
la escalera de 10 niveles, los Puntos de Identidad y el árbol de 36 rasgos.

---

## Mapa conceptual: GDD v2.0 → código existente

| Concepto GDD v2.0 | Código | Acción |
|---|---|---|
| Principios (Pressure, Build-up, Verticality, Solidity, Direct Play) | `ARISTAS` (presión, elaboración, verticalidad, solidez, directo) | Rename de cara al jugador; ids internos quedan |
| Filosofía + 2 Principios preferidos | `PHILOSOPHIES.aristas` | Sin cambio |
| Nivel de Filosofía | `FILO_LEVELS` (3 niveles, 0/4/9) | Se estira a 10 (ver escalera) |
| Puntos de Identidad (PI) | — | **Nuevo** |
| Rasgos (árbol 4 tiers) | Un `rasgo` automático por filosofía (F2) | Migra al árbol como Intermediate |

---

## Las decisiones del PO (23-jul-2026)

1. **Escalera de 10 niveles, SIN testear aún**: dividir proporcionalmente los boosts ya
   aprobados en F1 (×1.35 → ×2.1 sobre 0→9 puntos). El dial es barato de mover.
2. **El rasgo consolidado de F2 migra al árbol** como Intermediate de una rama concreta.
   Consolidada ya no regala nada automático: da su PI y listo. Una sola contabilidad.
3. **Cambio de filosofía → rasgos LATENTES**: se apagan pero no se pierden; si vuelves a
   esa filosofía, reviven. Coherente con la demolición orgánica de las aristas.
4. **Cada básico abre su rama**: 3 ramas conceptuales por filosofía. Advanced converge.
5. **Regla Firma · Respuesta · Expansión** (aprobada): las 3 ramas de cada filosofía son
   siempre: profundizar lo propio · cubrir el matchup débil · abrir un fútbol lateral.
6. **Tono sobrio** en las descripciones al jugador (ej. aprobado: *"Tras perder el balón,
   el equipo intenta recuperarlo inmediatamente antes de reorganizarse."*).
7. **Gating por tier** aprobado (ver tabla de estructura).
8. **Master = presencia en las tres ramas** + Consolidada. Los 4 rasgos míticos del juego.
9. **Consagración de prensa**: desbloquear un Master dispara el evento de prensa
   (reutiliza el enchufe de "La prensa bautiza tu estilo" de F3).

### Reglas de diseño propias del arco (adiciones a las Trait Design Rules)

- **Momento nombrable**: todo rasgo debe generar una situación reconocible en el partido
  + su relato. Si no tiene su momento *"¡eso lo compré yo!"*, no entra al pool.
  (Motivo: la lección del arco del Meta — los sesgos de pool miden ~0pp de win-rate;
  perfecto para "no te hace más fuerte", pero un rasgo que solo mueve pesos NO SE SIENTE.)
- **Principio ajeno en la rama Respuesta**: los Intermediate de Respuesta exigen un
  Principio FUERA de los 2 preferidos. Cubrir tu debilidad cuesta pureza de identidad
  (entrenar el ajeno no progresa tu filosofía) — costo de oportunidad real, no peaje.
  ⚠️ Necesita UI clara: el jugador debe entender POR QUÉ su filosofía sube lenta.
- **Neutralizar, no invertir**: los Advanced que responden matchups (Abrir la Lata,
  La Fortaleza) EMPAREJAN la matriz de F2, nunca la dan vuelta. La matriz estática se
  vuelve *conquistable*, no falsa.

---

## La escalera de 10 niveles (SIN testear — dial abierto)

Nivel = f(suma de las 2 aristas propias), igual que hoy. Mult interpolado linealmente
entre los valores aprobados en F1. **Cada subida de nivel otorga 1 PI** (nivel 1 incluido:
elegir filosofía → 1 PI inmediato → elegir 1 de 3 básicos).

| Nivel | Puntos | Mult firma | Etapa |
|---|---|---|---|
| 1 | 0 | ×1.35 | Aprendiendo |
| 2 | 1 | ×1.43 | Aprendiendo |
| 3 | 2 | ×1.52 | Aprendiendo |
| 4 | 3 | ×1.60 | Aprendiendo |
| 5 | 4 | ×1.68 | **En desarrollo** (ancla F1: 4 pts) |
| 6 | 5 | ×1.77 | En desarrollo |
| 7 | 6 | ×1.85 | En desarrollo |
| 8 | 7 | ×1.93 | En desarrollo |
| 9 | 8 | ×2.02 | En desarrollo |
| 10 | 9 | ×2.10 | **Consolidada** (ancla F1: 9 pts) |

**Nivel vs Etapa (decisión técnica clave):** el *nivel* (1-10) es la escalera de PI; la
*etapa* (Aprendiendo/Desarrollo/Consolidada, 0-2) se conserva como capa narrativa Y
técnica. `rivalFiloLevel` y `identityGapMult` (Rebalance R3) operan etapa vs etapa —
**la brecha de identidad NO se recalibra**. Dos vistas del mismo dato. Los hitos viejos
no se mueven: secuencia avanzada a 4 pts, Consolidada a 9.

**Economía resultante:** ~6-8 PI en una run real, 10 en una perfecta. Árbol de 9 rasgos
por filosofía → nunca se compra completo. La escasez del Bible ("intentionally scarce")
sobrevive, aunque es menos brutal que los 3 PI de la escalera vieja. **Deuda declarada:
testear el ritmo de PI cuando el sistema esté jugable.**

---

## Estructura del árbol

3 ramas por filosofía (Firma · Respuesta · Expansión). Cada rasgo cuesta **1 PI** siempre;
el gating es por requisitos, no por precio.

| Tier | Cantidad | Requisitos |
|---|---|---|
| Basic | 12 (3×filo) | Nivel 1 · 1 PI |
| Intermediate | 12 | Básico de su rama · Nivel 3 · Principio a 2 (ajeno en Respuesta) |
| Advanced | 8 (2×filo) | Intermediate de rama líder + Básico de rama de apoyo · Nivel 6 · Principio a 4 (propio) o 3 (ajeno) |
| Master | 4 (1×filo) | Un Advanced + los 3 Básicos · Nivel 10 · ambos Principios propios a 4 |

Convergencia Advanced **asimétrica** (Int. líder + Básico apoyo) a propósito: exigir dos
Intermediate haría todos los caminos iguales; la asimétrica da rutas distintas al mismo
Advanced. Camino mínimo al Master: 6 PI + Consolidada.

**Flujo de inicio:** elegir filosofía tras el sorteo → pantalla de progresión → 1 PI →
elegir 1 de los 3 básicos. La elección inicial YA diferencia runs desde el día 0
(¿profundizo mi firma, me cubro, o me ensancho?).

---

## El pool completo (36 rasgos)

Formato: **Nombre** · descripción sobria (jugador) · backlog (diseño, nunca visible) ·
momento nombrable. Los marcados *(migrado F2)* absorben el rasgo consolidado viejo.

### 🦁 High Press

**Ramas:** Firma = Morder Tras Pérdida · Respuesta = Trampa en la Banda (vs el pelotazo
que salta la presión) · Expansión = Asfixia en Salida.

#### Basic
| Rasgo | Descripción | Backlog | Momento |
|---|---|---|---|
| **Morder Tras Pérdida** | Tras perder el balón, el equipo intenta recuperarlo inmediatamente antes de reorganizarse. | Tras secuencia ofensiva mía fallida, probabilidad de encadenar una `recuperacion` reactiva en campo rival (fuera del pool normal). El pool post-pérdida sesga recuperación. | "La perdió y la cazó al toque." |
| **Trampa en la Banda** | La presión dirige la salida rival hacia las bandas, donde el equipo cierra el espacio para robar. | Recuperaciones se resuelven en zona de banda; robo en banda genera transición con variante centro/segundo palo. Actos de salida rival por banda pierden continuidad. | Robo en la raya → ataque inmediato. |
| **Asfixia en Salida** | El equipo presiona la salida rival desde el saque de meta, buscando robos en campo contrario. | Variante de `recuperacion` en tercio rival contra la salida: secuencia corta, robo a 30m, remate rápido. Rivales de Elaboración alta sufren más (matriz). | Robo al central y gol de vestuario. |

#### Intermediate
| Rasgo | Rama | Req. Principio | Descripción | Backlog | Momento |
|---|---|---|---|---|---|
| **Cacería Letal** *(migrado F2)* | Firma | Presión 2 | La presión tras pérdida se vuelve tan intensa que al rival solo le queda frenarla con falta. | Mecánica F2: fallos rivales bajo presión → faltas → tiros libres a favor + amarillas rivales. Recuperaciones reactivas más efectivas. | La amarilla al 5 rival antes del minuto 20. |
| **Anticipar la Espalda** | Respuesta | **Solidez 2** | Los centrales se adelantan para cortar el balón largo que busca superar la presión. | Degrada variantes de `pelotazo` rival cuando presiono. Solo contra el balón largo — no es bono defensivo genérico. | El central cortando de cabeza el pelotazo. |
| **Arco a la Vista** | Expansión | Verticalidad 2 | Los robos en campo rival se convierten inmediatamente en ocasiones de gol. | La secuencia post-robo de Asfixia gana un acto de definición de alta calidad. | Robo y gol en dos toques. |

#### Advanced
| Rasgo | Converge | Requisitos | Descripción | Backlog | Momento |
|---|---|---|---|---|---|
| **Asfixia Total** | Firma+Exp | Cacería Letal + Asfixia en Salida · N6 · Presión 4 | El equipo presiona en todas las fases: la salida, el medio, la pérdida. Al rival no le queda fútbol para jugar. | El pool rival colapsa hacia pelotazo/contra: casi no genera elaboración limpia. Cambia el partido DEL RIVAL, no mis números. | El rival reventando pelotazos al 60' porque no puede salir jugando. |
| **Cancha Chica** | Resp+Firma | Anticipar la Espalda + Morder · N6 · Solidez 3 | El equipo achica el campo hasta que el rival no encuentra dónde jugar. | Dirección (banda) + reacción (mordida): las secuencias rivales pierden actos, mueren antes. Con el pelotazo ya degradado, el rival juega en 40 metros. | El rival encerrado en su tercio durante minutos. |

#### Master
**El Robo es el Pase** — *"No hay creador de juego mejor que una buena recuperación."*
- **Desc:** El equipo ya no distingue entre defender y atacar: cada recuperación es el primer pase del gol.
- **Backlog:** TODAS las variantes de recuperación (reactiva, banda, salida) pueden encadenar directamente en llegada. El canal principal de creación pasa a ser el robo mismo. La presión no decae con marcador ni reloj.
- **Momento:** un gol nacido de robo en cada partido.

### 🎼 Posesión

**Ramas:** Firma = Buscar al Hombre Libre · Respuesta = Amplitud Máxima (vs Bloque bajo,
el peor matchup medido en F2) · Expansión = Pausa.

#### Basic
| Rasgo | Descripción | Backlog | Momento |
|---|---|---|---|
| **Buscar al Hombre Libre** | La circulación prioriza encontrar al jugador desmarcado entre líneas. | Actos de pase en `circulacion` ganan opción de continuidad extra (fallo → chance de reciclar). Más llegadas limpias. | La pared que rompe líneas. |
| **Amplitud Máxima** | Los extremos mantienen la máxima amplitud para estirar al bloque defensivo rival. | Variante de circulación por banda con cambio de frente; **reduce la ventaja estructural del Bloque rival** (la respuesta comprable al matchup F2). | El cambio de frente que descoloca al bloque. |
| **Pausa** | El equipo controla el ritmo del partido, alternando posesiones largas con aceleraciones súbitas. | Circulaciones más largas; momentum rival decae en posesiones largas; acto de aceleración → llegada súbita. | Veinte pases y puñal. |

#### Intermediate
| Rasgo | Rama | Req. Principio | Descripción | Backlog | Momento |
|---|---|---|---|---|---|
| **El Tercer Hombre** | Firma | Elaboración 2 | Las combinaciones de tres jugadores rompen líneas y aseguran la salida bajo presión. | Progresión doble por acto (salta una línea); menos pérdidas en salida contra press rival — mitiga el festín del Press. | La pared que deja atrás a toda la primera línea de presión. |
| **Cambio de Frente** | Respuesta | **Directo 2** | El equipo mueve el balón de banda a banda para desorganizar al bloque rival. | Variante: cambio largo → llegada por el lado débil del bloque. Profundiza el anti-Bloque de Amplitud. | El cambio de 40 metros y centro atrás. |
| **Sitio al Área** *(migrado F2)* | Expansión | Presión 2 | Las posesiones prolongadas acorralan al rival en su área y fuerzan errores. | Mecánica F2: desesperación acumulada → penales. Decaimiento de momentum rival acelerado. | El penal al 80' tras diez minutos de sitio. |

#### Advanced
| Rasgo | Converge | Requisitos | Descripción | Backlog | Momento |
|---|---|---|---|---|---|
| **Juego Posicional** | Firma+Exp | El Tercer Hombre + Pausa · N6 · Elaboración 4 | Cada jugador ocupa su altura y su pasillo: el balón siempre encuentra tres opciones de pase. | Los fallos de circulación se convierten en reciclaje (la posesión se sostiene). Llegadas de superioridad posicional. El partido se juega en campo rival. | El rival corriendo detrás de la pelota sin alcanzarla. |
| **Abrir la Lata** | Resp+Firma | Cambio de Frente + Hombre Libre · N6 · Directo 3 | Contra bloques cerrados, el equipo combina amplitud, cambios de frente y llegada desde segunda línea. | Variante de llegada vs bloque: media distancia / centro atrás. **Neutraliza** la degradación del Bloque a Posesión — empareja, no invierte. | El gol de media distancia tras quince pases contra el muro. |

#### Master
**La Pelota es Nuestra** — *el ideal: que el rival no toque el balón.*
- **Desc:** El partido se juega con una sola pelota — y es nuestra. El rival defiende, espera, y casi nunca la ve.
- **Backlog:** el pool rival se ESTRANGULA por falta de balón (espejo de Asfixia Total, conquistado vía posesión). Su momentum casi no crece. Llegadas propias de superioridad sostenida. El costo permanece: pérdida en salida sigue siendo letal — el rasgo domina, no protege.
- **Momento:** el rival tocando el balón tres veces en diez minutos.

### ⚡ Contragolpe

**Ramas:** Firma = Tres Pases o Nada · Respuesta = Tender la Trampa · Expansión = Correr
en Manada. ⚠️ La debilidad real del Contra (*"vs otro que espera, el partido se muere"*)
NO se responde en Basic — la paga **La Invitación** (Advanced), a propósito: resolver tu
peor escenario debe doler.

#### Basic
| Rasgo | Descripción | Backlog | Momento |
|---|---|---|---|
| **Tres Pases o Nada** | Las contras se resuelven con el mínimo de pases posible, priorizando velocidad sobre control. | `transicion` con menos actos y resolución rápida: mayor riesgo/recompensa, la defensa rival no se reorganiza. | Robo-pase-gol en ocho segundos. |
| **Tender la Trampa** | El equipo cede terreno deliberadamente para atacar el espacio que el rival deja a su espalda. | El `repliegue` exitoso puede encadenar transición inmediata (reactiva); cuanto más ataca el rival, más contras alimenta el pool. | El rival estrellado y la cancha entera para correr. |
| **Correr en Manada** | Cada contraataque incorpora varios jugadores en carrera para generar superioridad. | Actos finales de transición con segunda figura (pase alternativo en la definición); contras culminadas reparten momento entre dos. | Tres contra dos y definición cruzada. |

#### Intermediate
| Rasgo | Rama | Req. Principio | Descripción | Backlog | Momento |
|---|---|---|---|---|---|
| **El Primer Pase** | Firma | Verticalidad 2 | El primer pase tras el robo busca directamente romper la última línea. | La transición puede saltar actos intermedios: robo → acto final directo. Mayor riesgo, llegada de máxima calidad. | El pase de 50 metros que deja el mano a mano. |
| **La Trampa Cerrada** *(migrado F2)* | Respuesta | **Solidez 2** | Cuando el rival se vuelca al ataque, el equipo multiplica las contras a campo abierto. | Mecánica F2: el primer tramo deja al rival aún más partido, el segundo llega lanzado. Repliegues exitosos alimentan más el pool de transición. | La segunda contra consecutiva con el rival regalado. |
| **Superioridad Numérica** | Expansión | Elaboración 2 | Los contraataques buscan sistemáticamente el dos contra uno en el último tercio. | El acto final elige al mejor posicionado (opción de pase con mejor stat); reparte momento. | El 2v1 resuelto con pase al del área chica. |

#### Advanced
| Rasgo | Converge | Requisitos | Descripción | Backlog | Momento |
|---|---|---|---|---|---|
| **La Invitación** | Resp+Firma | La Trampa Cerrada + Tres Pases o Nada · N6 · Elaboración 3 | Cuando el rival espera, el equipo mantiene el balón con paciencia para obligarlo a salir — y entonces ataca el espacio. | **La respuesta al partido muerto**: vs rivales que esperan (Contra/Bloque), el pool gana secuencias de posesión-cebo que convierten en transición cuando el rival sale. El espejo Contra vs Contra deja de morirse. El Contra aprende a TENER la pelota sin dejar de ser Contra — por eso pide Elaboración, el principio más anti-doctrina del pool. | Diez minutos de toque paciente y la puñalada cuando el bloque dio dos pasos afuera. |
| **A Campo Abierto** | Firma+Exp | El Primer Pase + Correr en Manada · N6 · Verticalidad 4 | Las contras combinan velocidad máxima y varios corredores: el robo se convierte en avalancha. | Transición-avalancha: llegada múltiple, calidad máxima, momento repartido entre 2-3. El rival adelantado casi nunca se recompone. | Cuatro camisetas cruzando mediocampo a la vez. |

#### Master
**Contragolpe Total** — *el rival ataca con miedo.*
- **Desc:** Cualquier balón recuperado, en cualquier zona, en cualquier momento, es el inicio de una contra. El rival lo sabe — y ataca con menos hombres.
- **Backlog:** toda secuencia defensiva/neutra puede convertir en transición (repliegues, despejes, balón parado rival). La transición mantiene calidad desde campo propio. Efecto miedo: el pool ofensivo rival se degrada — ataca con menos volumen. El único Master que modifica al rival por *disuasión*.
- **Momento:** la contra que nace de un córner rival.

### 🧱 Bloque bajo

**Ramas:** Firma = Jaula Central · Respuesta = Oficio de Trinchera (vs el sitio de
Posesión) · Expansión = Segunda Jugada.

#### Basic
| Rasgo | Descripción | Backlog | Momento |
|---|---|---|---|
| **Jaula Central** | El bloque cierra el carril central y dirige el ataque rival hacia las bandas. | Secuencias rivales por el centro se degradan/desvían a variantes de banda (llegadas de menor calidad); el repliegue defiende mejor los actos centrales. | El rival dando vueltas por afuera sin encontrar la puerta. |
| **Segunda Jugada** | El equipo se organiza para disputar y ganar la segunda pelota tras cada balón largo. | Tras `pelotazo` con duelo perdido, probabilidad de retener la segunda bola y generar nueva secuencia. El pelotazo deja de ser todo-o-nada. | La peinada que cae al 10 y llegada. |
| **Oficio de Trinchera** | El equipo corta el ritmo del partido para desgastar y frustrar al rival. | El momentum rival acumulado decae más rápido; secuencias rivales largas pierden continuidad (el partido se corta). | El rival frustrado pateando desde afuera. |

#### Intermediate
| Rasgo | Rama | Req. Principio | Descripción | Backlog | Momento |
|---|---|---|---|---|---|
| **Dueños del Área** *(migrado F2)* | Firma | Solidez 2 | El equipo domina el juego aéreo defensivo dentro de su propia área. | **Corrección T2**: el rasgo F2 real del Bloque era la fortaleza profunda (deepContain + convertDeep) — migra ACÁ ("el despeje limpio inicia pelotazo" ES el convert). Además: el córner defendido puede encadenar pelotazo propio. Cadena: forzar banda → comer centros → lanzar. | El despeje número diez del central y la contra que nace de ahí. |
| **Pelota Parada Ensayada** | Respuesta | **Elaboración 2** | Cada tiro libre y córner ejecuta una jugada ensayada en el entrenamiento. | **Corrección T2**: el ×1.3 del balón parado NO era rasgo de Consolidada (es arma incondicional del Bloque desde el gate F2 — se queda). Este rasgo lo APILA: balón parado con mejor jugada (bonus) y más frecuente en el pool (×1.25). | El córner ensayado que termina en gol del 2. |
| **Plataforma** | Expansión | Directo 2 | Ganada la segunda pelota, el equipo la convierte en ataque organizado en campo rival. | La secuencia post-segunda-bola sube de calidad: de duelo suelto a llegada estructurada. Pelotazo con segunda ganada ≈ posesión avanzada. | Peinada, control del 10, llegada limpia. |

#### Advanced
| Rasgo | Converge | Requisitos | Descripción | Backlog | Momento |
|---|---|---|---|---|---|
| **La Fortaleza** | Firma+Resp | Dueños del Área + Oficio · N6 · Solidez 4 | El área propia se vuelve territorio prohibido: cada centro, cada córner, cada embestida muere en el muro. | El rival que sitia acumula frustración: momentum decae y sus llegadas pierden calidad progresivamente durante el sitio. El arma de Posesión se le vuelve en contra. **Neutraliza** el peor matchup del Bloque — empareja, no invierte. | El delantero rival discutiendo con sus compañeros. |
| **Cabeza de Playa** | Exp+Firma | Plataforma + Jaula Central · N6 · Directo 4 | El equipo ya no despeja: cada balón largo establece posición en campo rival. | Cierra el ciclo: despeje → pelotazo → segunda ganada → posición → falta/córner. La escasez ofensiva del Bloque se compensa por calidad, no volumen. | Tres córners seguidos fabricados desde pelotazos. |

#### Master
**Uno a Cero** — *el resultado mínimo, defendido como obra de arte.*
- **Desc:** Con ventaja en el marcador, el equipo convierte el partido en territorio propio: el 1-0 se defiende con oficio, muro y castigo hasta el final.
- **Backlog:** rasgo de ESTADO (se activa con ventaja): la fortaleza se amplifica, el momentum rival decae acelerado al final, y pelotazos/balones parados propios ganan letalidad con la desesperación rival. Contracara de pura identidad: perdiendo, no aporta NADA.
- **Momento:** los últimos veinte minutos defendiendo el 1-0 sin conceder una llegada limpia.

---

## Simetrías del pool (la matriz se vuelve conquistable)

- **Abrir la Lata** (Posesión anula su debilidad vs Bloque) ↔ **La Fortaleza** (Bloque
  anula la suya vs Posesión). Si ambos DTs los tienen: tablas — la matriz F2 no se rompe.
- **Asfixia Total** (Press colapsa la elaboración rival) ↔ **El Tercer Hombre** (Posesión
  mitiga el festín del Press).
- **La Invitación** paga la deuda del Contra pidiendo Elaboración (anti-doctrina).
- Consecuencia gratis: **el scouting rival gana una dimensión futura** — "¿qué rasgos
  trae?" (los rivales NO compran rasgos en este arco; queda como expansión).

---

## El enchufe técnico

- `run.identityPoints` (nuevo) + `run.rasgos` (ids comprados, **por filosofía** — la
  latencia es gratis: `run.rasgos[filoId] = [...]`; al cambiar filosofía se leen los de
  la activa).
- `FILO_LEVELS` → 10 entradas (mult interpolado). `filoLevelOf` sigue devolviendo el
  índice; nace `filoEtapaOf` (0-2) para todo lo que hoy consume 0-2 (rival, brecha R3,
  hitos narrativos, `ADVANCED_BY_FILO`).
- La frontera run→Match crece: `matchCtx.filo = {id, nivel, etapa, rasgos: [ids]}`
  (se arma en screens/match.js Y tests/smoke.js, como siempre).
- Los rasgos viven en content/ como DATOS (`content/traits.js`): id, filo, rama, tier,
  nombre, desc, requisitos `{previo, principio: {id, min}, nivel}`, y hooks declarativos
  que el Match interpreta. Las reglas (comprar, validar, latencia) en `game/traits.js`.
- **Capacidad de motor nueva y transversal: SECUENCIAS REACTIVAS** (encadenar una
  secuencia disparada por el resultado de otra: Morder, Tender la Trampa, La Invitación,
  El Robo es el Pase, Contragolpe Total). Es EL trabajo de motor del arco — diseñarla
  genérica en T1, porque 5+ rasgos la consumen.
- Degradación del pool rival (Asfixia Total, La Pelota es Nuestra, Contragolpe Total):
  ya existe precedente en `filoShareShift` y `applyFiloWeights` — extender, no inventar.
- Estado de marcador para Uno a Cero: el Match ya conoce el marcador (mentalidad por
  marcador, A2) — enchufar ahí.

---

## Los sprints

### T1 — "La moneda" (economía + pantalla + básicos) — ✅ CERRADO (23-jul-2026)
- Escalera de 10 niveles (mult interpolado) + `filoEtapaOf` + regresión: la brecha R3 y
  el rival NO cambian (verificar con `--filo`).
- PI: ganancia por nivel + el inicial. Pantalla de progresión (árbol, 3 ramas visibles,
  candados con requisitos legibles) + flujo de inicio (elección → pantalla → 1 de 3).
- Motor de secuencias reactivas (genérico) + los 12 Basic funcionando.
- Gate: los 12 momentos nombrables SE VEN en partidos reales (verificación cualitativa
  en navegador) + win-rate estable (los rasgos no son poder: esperado ~0pp).

**Resultados del cierre:**
- Escalera 10 niveles balance-neutral (20.7 baseline vs 21.0 post, n=8000 — ruido).
  Vista dual nivel/etapa: la brecha R3, el rival y los hitos narrativos INTACTOS
  (verificado por asserts: mults de etapa exactos, anclas 4/9).
- **Decisión de diseño nueva — anti-farming de PI**: los PI solo se ganan subiendo
  niveles de la filosofía ACTIVA; los heredados al cambiar se acreditan SIN premio
  (la arista compartida cuenta para dos filosofías: premiarla dos veces imprimía PI).
  Precedente: filoNarrado. Vive en `game/traits.syncIdentityPI/creditInheritedPI`.
- Motor reactivo: `match/trait-hooks.js` — chainMine() generaliza el patrón def→of;
  MAX_CHAINS=3 por partido; hooks cacheados en la instancia. Los 12 Basic integrados
  en 8 puntos de sequences/sequence-acts.
- **Hallazgo del gate — matcheo por FAMILIA**: en Consolidada la avanzada desplaza a
  su tipo base (share 0.9) y los hooks por type.id se APAGABAN justo al madurar la
  identidad (trampa_banda 0%/partido). Arreglo: `familyOf` (cacería ES recuperación) para
  los hooks no-canibalizantes; la conversión de Trampa solo en acto 0 (jamás aborta la
  trampa final de la cacería); el salto de Tres Pases va a acto 1 (en el letal conserva
  un tramo). Regla para T2/T3: **todo hook nuevo se piensa por familia, no por tipo**.
- Gate cualitativo: los 12 momentos visibles en AMBAS etapas (0.04–0.28/partido;
  los más tímidos: hombre_libre ~5% y jaula ~6% de los partidos — dial de p abierto).
- Gate cuantitativo: 22.1% vs 20.7 baseline (n=8000, **+1.4pp, ~2.2σ**) — los básicos
  añaden EV chico pero probablemente real. Por filosofía (n=3000): press 21.8 ·
  posesión 23.0 · contra 23.9 · bloque 21.4 (spread 2.5pp, ninguna identidad rota).
  **Pendiente PO**: aceptar +1.4pp o afeitar p's; el pase de balance declarado del
  arco es T3.
- Deudas menores: cadencia del diario con PI (~8 entradas más por run — dial
  narrativo) · visibilidad de hombre_libre/jaula · smoke compra al azar (el piso;
  el techo --smart no elige rasgos aún — heurística para T2).

### T2 — "Las ramas" (Intermediate + migración F2) — ✅ CERRADO (23-jul-2026)
- Los 12 Intermediate. Migración de los 4 rasgos F2 al árbol (Consolidada deja de
  regalar; `noteFiloMilestones` se actualiza).
- Regla del principio ajeno en Respuesta + su UI (por qué mi filosofía sube lenta).
- Gate: matriz F2 estable (los Intermediate no la rompen) + migración sin regresión.

**Resultados del cierre:**
- Los 12 Intermediate con hooks nuevos: breakawayGuard (Anticipar corta el pelotazo
  ambiente ANTES del mano a mano — calibración del último hombre intacta) · deepFinish ·
  playoutRescue · variantSwitch (condicional al rival) · skipUpgrade · supportUpgrade ·
  chainOnDefendSp · setpieceRehearsed (bonus + pool ×1.25) · secondBallUpgrade.
- **Migración F2 completada**: filoRasgo() MURIÓ — el gate es hasTrait(). caceria
  foulBreakDeep→Cacería Letal · sinfonia 4º compás + penal profundo→Sitio al Área ·
  contra_letal deepBonus→La Trampa Cerrada · fortaleza deepContain/convertDeep→Dueños
  del Área. **Corrección al diseño**: el ×1.3 del balón parado NO era el rasgo F2 del
  Bloque (es su arma incondicional y se queda); el rasgo real era la fortaleza profunda.
- **Hallazgo de diseño — la excepción del Contra**: su Respuesta (Trampa Cerrada) pide
  Solidez, que ES suya (aguantar para cazar); su principio AJENO (Elaboración) vive en
  la Expansión (Superioridad 2) y abre el camino que La Invitación (T3, Elaboración 3)
  continúa: el Contra aprende a tener la pelota POR ETAPAS. Codificado en tests.
- Gate cualitativo: los 20 momentos narrados SE VEN (0.05–0.37/partido en Consolidada;
  las 3 migraciones de tasa sin texto propio se verifican por plumbing en traits.test).
- Gate cuantitativo: **22.6% vs 22.1 de T1 (n=8000 — ruido): los Intermediate + la
  migración son neto neutros.** Por filosofía: press 21.4 · posesión 23.4 · contra 22.8 ·
  bloque 22.0 (spread 2.0pp) — el Bloque NO cayó al perder su regalo de Consolidada.
- Deudas: smoke ~2× más lento (18ms/run — más fútbol real por las cadenas; profiling
  si molesta) · --smart sigue sin comprar rasgos (T3: el techo con árbol) · la deuda
  del +1.4pp de T1 sigue abierta para el pase de balance de T3.

### T3 — "La doctrina" (Advanced + Master + consagración) — ✅ CERRADO (23-jul-2026)
- Los 8 Advanced (convergencias, neutralización de matchups) + los 4 Master.
- Consagración de prensa al Master (enchufe F3) + relato de rasgos en el post-partido.
- Balance del arco: testear el ritmo de PI (la deuda declarada de la escalera),
  medir que las neutralizaciones EMPAREJAN (no invierten) la matriz.
- Gate: win-rate global estable vs baseline · las neutralizaciones mueven el matchup
  hacia tablas y no más allá · una run profunda alcanza Master solo con inversión total.

**Resultados del cierre (ARCO COMPLETO — 36 rasgos vivos):**
- Requisitos extendidos (`todos`/`alguno`/`principios`) + consagración de prensa al
  comprar un Master (doble entrada de diario). Camino mínimo al Master: 6 PI +
  Consolidada + ambos principios propios a 4 (verificado por test).
- **Neutralización con el instrumento CORRECTO** (lección del Meta, reaprendida: el
  win-rate de un matchup no mide sesgos de pool): la cuota de circulación de Posesión
  vs Bloque pasa de 28.9% → 40.1% con el stack (referencia neutra: 38.7%) — recupera
  la cuota perdida y SE QUEDA en la referencia. El win-rate no se invierte (sanity ✓).
- **Master: piso vs techo** — el azar alcanza Master en 2.7% de las runs; el greedy
  (--smart, que desde T3 entrena la arista propia MÁS BAJA para juntar ambos
  principios) en 99.8%. "Solo con inversión total" ✓.
- Los 32 momentos narrados SE VEN (la_fortaleza y cabeza_playa exigieron rediseño:
  frustración por ataques MUERTOS —contador propio, stats.oppTiros solo cuenta
  ambiente, deuda aparte— y beachhead ampliado a todo pelotazo).
- **BALANCE FINAL DEL ARCO**: piso 22.7% vs 20.7 pre-arco (+2.0pp) · por filo
  21.2–24.4 (spread 3.2pp) · techo BRA 47.2% vs 41.9 pre-arco (**+5.3pp: el premio
  del árbol completo al DT óptimo**). Decisión PO pendiente al cierre: aceptar el
  premio como recompensa diseñada del arco o afeitar bonus/p's de hooks (~30%).
- Deudas del arco: ritmo de PI generoso (~10/run al techo — dial: no todos los
  niveles premian) · sub-conteo de tiros en stats (task aparte) · rivales sin árbol
  (expansión futura del scouting) · smoke 2× más lento (fútbol real de cadenas).

---

## Riesgos declarados

1. **La escalera de 10 niveles no está testeada** (decisión PO explícita): el ritmo de
   PI puede resultar generoso. Dial barato: qué niveles otorgan PI.
2. **Percepción**: la lección del Meta (sesgos de pool ≈ 0pp) corre en ambos sentidos —
   el gate de T1 es cualitativo a propósito (los momentos SE VEN o el rasgo no sirve).
3. **Secuencias reactivas**: capacidad de motor nueva; si se diseña ad-hoc por rasgo,
   deuda técnica inmediata. Genérica en T1 o dolor en T3.
4. **UI del principio ajeno**: si el jugador no entiende por qué su filosofía sube lenta,
   la decisión más rica del sistema se percibe como bug.
5. **Rivales sin rasgos**: la asimetría DT-con-árbol vs rival-sin-árbol es aceptable en
   este arco (el rival ya tiene nivel + matriz + rasgo F2 narrativo), pero queda anotada
   como expansión futura del scouting.

---

## Rediseño de árboles por filosofía (25-jul-2026) — iteración 1: HIGH PRESS

El PO abrió una fase NUEVA, posterior al arco T1-T3: rediseñar el árbol de cada
filosofía de a una. **Fase de construcción, sin gate de balance** (decisión
explícita: "no testees si aumentan la victoria"). Fuente: `Rasgos_Presion_Alta.xlsx`.

**Press pasa de 9 a 19 rasgos.** El árbol viejo se retira entero; donde el concepto
coincidía se reciclaron los hooks ya construidos, para no tirar motor:

| Rasgo viejo | Dónde vive ahora |
|---|---|
| Morder Tras Pérdida (`chainOnMineFail`) | **Gegenpressing** (avanzado Firma) |
| Asfixia en Salida (`variantDeep`) | **Angriffpressing** (avanzado Firma) |
| Anticipar la Espalda (`breakawayGuard`) | **Vigilancia Defensiva** (int. Respuesta) |
| Cacería Letal (`deepPress`, migración F2) | **Gegenpressing** (segundo hook) |
| El Robo es el Pase (`masterPress`) | **Pressingfalle** (master Firma) |
| Cancha Chica (`oppLoseActs`) | **Rest Defense** (master Firma) |
| Trampa en la Banda · Arco a la Vista · Asfixia Total | retirados |

**Tres decisiones estructurales** (tomadas al construir, con ok del PO):

1. **Los nodos de nivel 4 son Master** — Press tiene 7 (las hojas de cada rama).
   Piden el avanzado previo de SU rama, no convergencia de las tres. La
   consagración de prensa se narra UNA vez por filosofía, no una por Master
   (`buyTrait` mide el primer Master antes de sumarlo).
2. **La pizarra pasa a modo GRAFO.** Un árbol rediseñado declara la `pos` de cada
   nodo en el catálogo y las aristas salen de los propios `req.previo`; los que no
   declaran `pos` siguen con la grilla histórica de 3 carriles × 3 tiers. Así cada
   filosofía puede dibujarse como la táctica que es: la presión alta ocupa la
   cancha de una manera y el bloque bajo de otra.
3. **La rama Expansión se bifurca desde el básico** (`Directo` → `Egoístas` /
   `Contragolpistas`): dos ideas opuestas sobre qué hacer con la pelota robada,
   quedársela o salir disparado. Es la única lectura que respeta la semántica de
   los nodos del Excel.

**Correcciones de diseño aplicadas al Excel** (la ley del arco manda sobre el
número): *Presión Intensificada* y *Mittelfeldpressing* venían como buffs planos
("+15% efectividad de presión") — se reescribieron como cambios de comportamiento
con momento nombrable (convertir el acto de presión en recuperación · inclinar el
pool hacia recuperaciones). Ningún rasgo del árbol es una mejora estadística.

### DEUDA que deja esta iteración

- ~~`pressStamina` (Pulmones de Acero)~~ **PAGADA el 25-jul** con el botón de presión:
  el rasgo abarata el sobrecosto de los minutos presionados (`press.pressExtraMinutes`)
  y nada más. Ver docs/CORE.md §Botón de presión.
- **`iceGame`** (Fríos): rasgo de ESTADO (segundo del catálogo, tras Uno a Cero) que
  habilita una DECISIÓN NUEVA en partido — devolver la pelota al área propia para
  comer reloj con ventaja. Es la pieza de motor más cara del rediseño.
- **`docs/RASGOS-catalogo.md` quedó desactualizado** para Press (describe los 9 viejos).
- **Balance sin medir, a propósito**: 19 nodos contra 9 de las otras tres filosofías.
  El techo de Press no se comparó con nada. Va cuando estén las cuatro rediseñadas.
- Scroll horizontal de 39px en la pantalla de Identidad a 375px — **preexistente**
  (verificado contra `master` con el árbol de 9), viene de la banda de cabecera.

### Rediseño de espacio de la pizarra (26-jul-2026)

Con 19 rasgos el tablero se saturó. Diagnóstico medido antes de tocar nada: la
**columna izquierda se llevaba 196px de 1200 (16% del ancho)** entre la regla de
principios y el post-it de 164×174, mientras el árbol vivía comprimido entre
x=340 y x=1036. Cuatro decisiones del PO:

1. **Los 5 principios pasan de columna lateral a franja de cabecera** — cinco
   fichas apaisadas sobre la línea de cal (icono + nombre + valor + barra de 46px).
   Se pierde la lectura fina del progreso (la barra era de 160px); se gana la
   cancha entera. `principlesRail` → `principlesBand`.
2. **El post-it se vuelve chincheta 📌** de 34px y sus notas se leen en EL RIEL,
   el mismo panel donde ya se leen las fichas de rasgos (cero mecanismo nuevo).
   `board.notesBlocks()` expone el texto; `philosophy.notesCard()` lo pinta.
   La chincheta NO hace zoom de cámara: no hay nada que leer en el papel.
3. **El espacio recuperado va a SEPARAR los nodos, no a agrandarlos** — lo que
   satura no es el tamaño de cada rasgo sino la cercanía entre ramas.
4. **Las etiquetas no se tocan**: los 19 nombres siguen visibles siempre. El árbol
   se despeja por geometría, no escondiendo información.

Resultado medido en navegador: `PITCH` de 950×550 a **1120×588**, viewBox de
1200×640 a **1200×700**, el ancho que ocupan los nodos de ~700px a **938px**, y
**cero solapes** entre las 19 cajas (nodo + etiqueta) con nada fuera del tablero.
La grilla de las 3 filosofías sin rediseñar se reencuadró sobre la cancha nueva
(9 nodos, cero solapes).

Queda anotado: en móvil (375) el tablero mide 343×200 y 19 nodos ahí no se leen —
la respuesta sigue siendo el zoom al tocar, como ya era con 9. Y el scroll
horizontal de 39px de la pantalla es **preexistente** (viene de la banda de
cabecera, verificado contra `master`).

---

## Rediseño de árboles · iteración 2: POSESIÓN (26-jul-2026)

Fuente: catálogo del PO (15 rasgos, 6 Firma + 4 Respuesta + 5 Expansión). Misma
fase de construcción que Press: **sin gate de balance**.

### La decisión de diseño grande

La rama Respuesta que trajo el PO responde a la **presión alta** (La Trampa,
Salida Lavolpiana). Pero el matchup débil declarado de Posesión es el **bloque
bajo** (`philosophies.advertencia`), y la neutralización de esa celda vivía justo
ahí: Amplitud ×1.25 → Cambio de Frente → Abrir la Lata ×1.23, el espejo exacto de
La Fortaleza del Bloque (arco T3). Aplicar el árbol tal cual dejaba a Posesión sin
respuesta a su propia debilidad y la celda `posesion|bloque` inconquistable.

**Resuelto (decisión PO): el anti-bloque migra a la Firma.** `Osciladores` ES el
cambio de frente, y carga la neutralización COMPLETA en un solo nodo:

| | circulación | pelotazo |
|---|---|---|
| celda cruda `posesion\|bloque` | 0.65 | 1.30 |
| stack viejo (3 nodos, 3 PI) | ×1.25 ×1.23 → **1.00** | ×0.77 → **1.00** |
| Osciladores (1 nodo, mismos 3 PI de camino) | ×1.54 → **1.00** | ×0.77 → **1.00** |

Mismo resultado, mismo costo, un nodo. Empareja el matchup; nunca lo invierte
(fijado por test). La Respuesta queda libre para lo que el PO quiso: aguantar la
presión rival.

### Las otras tres decisiones

2. **Polivalentes converge con `alguno`**: basta Sorpresivos **o** Desesperantes —
   las dos maneras de romper una línea (por abajo o por arriba) vuelven a juntarse.
3. **"Rest Defense" se queda en Posesión y desaparece del Press.** El PO eligió
   cuál de los dos Masters del Press sobrevivía y **ganó Pressingfalle**: es el
   ideal platónico de la presión alta (no perseguís el error, lo diseñás), su
   nombre completa la escuela alemana de la rama, y su hook premia a los DOS
   caminos de la bifurcación — `bonus` mejora la definición de toda la familia de
   la recuperación (lo que construye Angriffpressing) y `chainPlus` afila la
   mordida (lo de Gegenpressing). Por eso ahora **converge**: se llega desde
   cualquiera de los dos. El hook `oppLoseActs` no se perdió: se fue con el nombre
   a Posesión, donde el concepto encaja mejor. **Press: 19 → 18 rasgos.**
4. **El ajeno de Posesión lo paga Osciladores** (Juego directo 3): el cambio de
   orientación largo ES juego directo, la misma justificación que usaba Cambio de
   Frente. Posesión paga su pureza en la FIRMA, no en la Respuesta — segunda
   excepción documentada del arco, junto al Contra.

### Reescrituras por la ley del arco

Tres rasgos venían como buffs planos y se reescribieron como comportamiento:
*Buen Pie* ("+15% precisión" → el pase seguro que se corta no mata la jugada),
*Pitagóricos* ("+20% precisión" → la triangulación encuentra al mejor ubicado de
verdad) y *El Rondo* (el pool se inclina a la circulación: no es un buff, es otro
partido).

### Regla afinada: el Master con principio ajeno

El test genérico nuevo destapó una inconsistencia propia: en Press, *Elasticidad*
pedía Solidez 4 y *Fríos* Elaboración **3**. Se normalizó a **4**: un Master pide
sus dos principios a 4, al menos uno propio, y el ajeno se paga entero — en la
cima no hay descuento. La regla T3 original ("ambos propios a 4") sigue vigente
para las filosofías sin rediseñar.

### Hooks reciclados vs. deuda

**Reciclados (funcionan hoy)**: El Tercer Hombre conserva id, nombre, tier y hook
íntegros · Osciladores ← Amplitud+Abrir la Lata · Hombre Libre ← Pausa
(`accelFinish`) · La Máquina Colectiva ← La Pelota es Nuestra (`masterPosesion`) ·
Polivalentes ← Juego Posicional (`recycleUpgrade`) · Rest Defense ← el del Press
(`oppLoseActs`) · Desesperantes ← Sitio al Área (`deepPosesion`, la migración F2) ·
La Frontera reusa `breakawayGuard` · Salida Lavolpiana reusa `variantSwitch` ·
Profundos `skipToFinish` · Sorpresivos `variantDeep` · Pitagóricos `supportUpgrade` ·
Buen Pie `recycleBuild` · La Trampa `oppShotMalus`.

**Deuda declarada (NO fingida, el Match no las lee)**: `tapIn` (Empujar el balón) ·
`backPass` (Retroceso de posesión) · `offsideTrap` (Trampa del fuera de juego) ·
`oppStamina` (El Rondo — hoy el rival nace con energía 100 y nunca baja).

### Verificación

Batería verde (traits pasó a 727+ checks, con una sección genérica que corre sobre
**las dos** filosofías rediseñadas). En navegador a 1440×900: Posesión 15 nodos /
14 flechas y Press 18 / 17 — cero solapes, nada fuera del tablero, 3 básicos
abiertos al arranque en ambos, las dos convergencias dibujan sus dos flechas,
Polivalentes se compra tanto por Sorpresivos como por Desesperantes, la
consagración se narra una sola vez, el candado de Osciladores nombra el ajeno
("🌩️ Juego directo 3"), sin scroll vertical, consola limpia.

**Estado del rediseño: 2 de 4 filosofías (Press 18 · Posesión 15). Faltan Contra y
Bloque, que siguen con la grilla 3×3 del arco T1-T3.**
