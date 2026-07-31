# 🗺️ ROADMAP — El sprint del Territorio

**Fecha:** 30-jul-2026 · **Base:** commit `1b7bea3` (rediseño del Contragolpe + catálogo de
jugadas, con la batería verde).
**Estado:** ✅ **ARCO COMPLETO** (T1–T5).

**Objetivo:** que el partido deje de ser una sucesión de secuencias y pase a ser un sistema
**territorial**, donde el backend sabe en todo momento dónde está la pelota, cómo están paradas
las dos líneas y qué jugadas tienen sentido en ese contexto — **sin que el jugador vea jamás un
número de zona**.

---

## Las 8 decisiones del PO (tomadas al arrancar)

| # | Decisión | Elegida | Por qué importó |
|---|---|---|---|
| 1 | Marco vertical | **Absoluto anclado a mi arco** (v1 mi área … v5 área rival) | Una sola verdad: el mapa de calor se lee como una transmisión y las jugadas rivales no necesitan traducirse. |
| 2 | Mapa de calor | **El mío, con toggle al del rival** | La lectura útil es "dónde ataco yo / dónde me atacan". El backend lleva los dos. |
| 3 | Altura en vivo | **Ventana táctica nueva (3 por partido)** | Concepto de fútbol real; no toca los 3 cambios y deja la mentalidad gratis (actitud vs estructura). |
| 4 | Base del sprint | **Commitear lo pendiente primero** | 1.259 líneas sin commitear del rediseño del Contra: cualquier deriva habría quedado mezclada. |
| 5 | Contenido nuevo | **2 jugadas nuevas, bien elegidas** | Geografía sobre las 13 existentes + las dos que SOLO existen con territorio. Sin inflar el catálogo. |
| 6 | Rasgos | **Gatear por zona y compensar la frecuencia** | El árbol recién calibrado no se mueve: el rasgo cambia de carácter, no de valor. |
| 7 | Densidad de jugadas | **NO se toca en este sprint** | Así toda deriva de balance es atribuible al territorio y no a un dial de volumen. La deuda sigue abierta. |
| 8 | Gate | **n=1500 por arco + n=4000 al cierre** | Detectar roturas rápido y medir en serio una vez, sobre el sistema completo. |

---

## Los 5 arcos

| Arco | Qué entregó | Gate cumplido |
|---|---|---|
| **T1 — El campo** | `game/match/field.js`: marco absoluto, deriva ambiente por minuto **sin `rnd()`**, mapa de calor por tiempo, altura de bloque de ambos equipos. | Balance intacto por construcción · `field.test` 29 checks |
| **T2 — El mapa de calor** | Carrusel Momentum ↔ Mapa de calor en el partido (toggle mío/rival) y los mapas por tiempo en el post-partido. | Salida pura, cero impacto en motor · navegador |
| **T3 — La altura del bloque** | La palanca del DT: pre-partido (hub), entretiempo y en vivo con ventana táctica. Sesga pool, iniciativa, riesgo a la espalda y piernas. | **Ninguna altura domina**: 26.3 / 25.9 / 27.2 / 28.1 / 27.7 (n=1500) · bloque medio = ×1 |
| **T4 — Las jugadas dependen del territorio** | `zone.from` por tipo, peso por distancia, actos que mueven la pelota, geografía de la falta, 2 jugadas nuevas, 8 rasgos con geografía, IA rival simétrica. | BRA **27.7% vs 27.5%** (n=4000) · techo 42.6% vs 42.3% · densidad 4.23 vs 4.28 |
| **T5 — Cierre** | ARQUITECTURA (módulo, propiedad de estado, criterio), CORE (§Territorio), FUNCIONES (§8b), JUGADAS y RASGOS al día, este documento. | Docs consistentes con el código |

---

## Las tres decisiones de arquitectura que sostienen el sprint

### 1. La deriva ambiente NO consume azar

Con 5-9 secuencias por partido (2-6 cuando nació el sprint del Territorio), un mapa de calor
alimentado solo por jugadas tendría un puñado de muestras.
El relleno de los ~90 minutos sale **determinista** de la posesión ya derivada del juego, los
poderes y las dos alturas — la misma ley que ya cumplían `stats.js` y `match-momentum.js`.

Es lo que permitió que una capa de estado nueva, que además **alimenta la generación**, pudiera
nacer sin correr el flujo del RNG ni moverle un dial al balance calibrado. El azar se gasta
donde hay fútbol de verdad: las secuencias y sus actos.

### 2. El bloque medio es el punto neutro exacto

Todos los multiplicadores territoriales de MI altura valen **×1** con el bloque medio, que es
como juega la línea base medida. Consecuencia práctica: el smoke sigue midiendo lo mismo que
antes del sprint, y lo que se mide aparte es que **ninguna altura domine** — el mismo criterio
que se usó con las formaciones ("ningún dibujo dominado").

### 3. Los actos mueven la pelota desde una tabla, no desde el catálogo

`field.ADVANCE` concentra cuánto avanza cada gesto. Los 14 tipos no repiten esos números y un
tipo nuevo hereda el fútbol sin declarar nada.

---

## Lo que se midió (y lo que se corrigió por medirlo)

| Hallazgo | Corrección |
|---|---|
| La altura RIVAL **encogía** el pool en vez de rotarlo: con mi bloque medio, el favorito perdía −2.8pp sin que el DT tocara nada. | Contra un bloque rival bajo, lo que pierde la contra lo ganan **circulación y banda** — las dos respuestas clásicas al bloque bajo. |
| Con pendiente simétrica, el **bloque muy bajo** era la mejor estrategia del juego para un favorito (27.8% vs 24.1% del medio): meterse atrás salía gratis. | `backlineRisk` **asimétrico** (−0.12 por escalón hacia abajo, +0.30 hacia arriba): replegarse reduce el espacio a la espalda, no lo elimina. |
| Adelantar la pelota **antes** de juzgar la falta metía media conducción de más dentro del área: los penales SUBÍAN (0.30 → 0.35), lo contrario de lo buscado. | La falta se cobra **donde lo bajaron**: bajarlo es justamente impedir que avance. |
| La jugada a la espalda era la mejor ocasión del juego (bonus 0.12 + 0.14 sobre un mano a mano). | 0.08 + 0.10. Sigue siendo la mejor ocasión individual, pero tras una **doble** exigencia (envío + carrera). |

---

## Puntos abiertos

1. ~~**La densidad de jugadas**~~ — ✅ **RESUELTA (31-jul-2026)**: sprint propio, abajo.
2. ~~**La tercera jugada territorial**: el cambio de frente~~ — ✅ **RESUELTO (30-jul-2026,
   arco del Eje Horizontal)**: `cambio_frente` entró al catálogo con su acto propio, y con él
   la amplitud del dibujo, los centros que dependen de dónde se centra y el balón parado que
   se cobra distinto desde la banda que de frente. Ver CORE §El Eje Horizontal.
3. ~~**`ui/screens/match.js` en 881 líneas**~~ — ✅ **SALDADA (30-jul-2026)**: la pantalla es
   ahora la carpeta `ui/screens/match/` (index · panels · tactics · squad). Mudanza pura: cero
   cambios de regla. Ver ARQUITECTURA §2.2 y FUNCIONES §8.
4. ~~**El eje horizontal está subutilizado en la generación**~~ — ✅ **RESUELTO**: los tipos
   pesan por carril (`zoneWeight` con `lane`), el dibujo decide cuánto fútbol por afuera
   existe y la amplitud defensiva se cobra en la contención y en el remate rival que nace de
   una banda. Queda abierto lo natural que sigue: un **rasgo** que compre juego por dentro o
   por fuera — hoy ningún rasgo lee el carril.
5. ~~**La altura no se comunicaba como scouting previo**~~ — ✅ **RESUELTO (30-jul-2026)**: el
   Informe del Rival dice con qué altura se va a parar el que viene (`field.baseHeight`, la misma
   fuente que usa el partido) y qué camino deja abierto, y ofrece **ahí mismo** el selector de la
   altura propia — el picker es el mismo componente que la card del día de partido y los dos se
   repintan juntos. El loop queda cerrado: leer al rival → elegir el bloque → jugar.

---

# 🗺️ Sprint de la DENSIDAD (31-jul-2026)

**Base:** commit `1781828` ("El hub pasa a ser una carpeta"), BRA campeón **27.1%** a n=4000.
**Estado:** ✅ **CERRADO**.

**El problema:** el reloj continuo (27-jul) hizo que un partido durara ~3'30" de reloj de pared
en vez de ~15 segundos. Con 2-6 jugadas en 90', el hueco entre una y otra tenía **mediana 16-21'
y máximos de 51'** — medio minuto largo de reloj real mirando correr el minutero sin decidir
nada. `seqSlots` (28-jul) había arreglado la COLA repartiendo los momentos, pero la MEDIA solo
la arregla el número. Deuda pospuesta a propósito en todo el arco del Territorio para no mezclar
causas de deriva de balance.

## Las cuatro decisiones del PO

| # | Decisión | Elegida |
|---|---|---|
| D1 | Cuánto sube el objetivo | **5-9** (base 4 → 7, media ~4.2 → ~7.2) |
| D2 | Parejo o ponderado por preparación | **Parejo**: la pendiente del `edge` NO se toca (0.32) |
| D3 | ¿La zona decide cuántas jugadas hay? | **No**: número fijo, pero el **momento** lo decide el territorio |
| D4 | Contrapeso del desvío de balance | **Bajar los remates AMBIENTE** |

## Lo que se construyó

- **`SEQ_MIN`/`SEQ_MAX` 2-6 → 5-9** y la base del objetivo 4 → 7 (`sequences.seqPlan`).
- **La ventana territorial** (`seqSlots` devuelve `{abre, cierra}` en vez de un minuto): la
  jugada espera dentro de su ventana a que la pelota salga del mediocampo (`zonaViva`, medido:
  pasa el 35% de los minutos) y sale ahí; al vencer sale igual. El jitter de `seqSlots` se
  ajustó a [0.30, 0.85] del tramo para que la separación mínima entre vencimientos (0.45·L)
  supere al `ANTICIPO` (0.40·L) y dos ventanas nunca se solapen.
- **`AMBIENT_MINE` 0.85 → 0.28** y **`AMBIENT_OPP` 0.70 → 0.40** (`Match.js`).
- **`XP_INTENCION` 125 → 73** y **`XP_ACIERTO` 55 → 32** (`content/philosophies.js`).
- **`tools/bench-partidos.js`**: el banco de partidos con plantel fijo, que hasta ahora vivía
  en el scratchpad y se perdía cada sprint. Ahora es del repo.
- **`tests/sequences.test`**: bloque nuevo de la ventana territorial (el partido llega EXACTO a
  su objetivo · las ventanas no se solapan · la mayoría de las jugadas las dispara el
  territorio · el vencimiento sigue siendo la red) y la cota de sequía apretada de 55' a 40'.

## Lo que enseñó medir

**1. El banco de partidos y el smoke NO miden lo mismo, y hay que componerlos a mano.**
La densidad sola movía la BRECHA favorito−underdog apenas **+1.1pp por partido** — parecía
inocua. En el KPI de run movía **+12.4pp** (25.5% → 39.5%). No es contradicción: un +6.7pp de
win% por partido se eleva a la sexta potencia en una run de 6 partidos encadenados
(`(85.7/79.0)^6 = 1.62`; `25.5% × 1.62 ≈ 41%`, y ahí está). **Regla nueva: un efecto de partido
chico NO es un efecto chico. Antes de creerle al banco, componerlo.**

**2. El mecanismo era el empate, no la fuerza.** Más jugadas → +27% de goles → los empates se
derrumban (BRA vs POL: 14.5% → 9.8%). Un partido con más goles tiene menos varianza de
resultado, y menos varianza favorece SIEMPRE al mejor. Por eso el contrapeso correcto era
justamente el que el PO había elegido: restaurar los goles restaura los empates.

**3. La densidad de jugadas ES el dial de velocidad de toda la progresión** — y nadie lo había
declarado. La XP de identidad se gana POR SECUENCIA, así que subir la densidad un 70% subía la
XP un 70%: filosofía tope 6.0 → 8.2/10, DT 12.4 → 17.6/20, rasgos 11.3 → 16.5, Master 0.0% →
4.7%. El arco de Progresión declara su banda ("una run promedio deja a la principal en 6-8") y
la densidad la rompía por arriba. **Cualquier sprint futuro que toque la densidad tiene que
tocar `XP_INTENCION`/`XP_ACIERTO` en la misma proporción, o recalibra el juego entero sin
querer.**

**4. El contrapeso del ambiente tuvo que ser asimétrico, y eso también se midió.** Con densidad
plena mi ataque creció +27% y el del rival solo +14% — mis jugadas las decido yo y las convierto
mejor. Restaurar el marcador de LOS DOS lados exigió cortar mucho más de mi lado (−67%) que del
suyo (−43%). Un recorte parejo dejaba los goles en contra 13% bajos.

## Gate

| medida | base | sprint | |
|---|---|---|---|
| **campeón BRA n=4000** | 27.1% | **28.4%** | ✅ +1.3pp (banda ±2pp) |
| techo `--smart` n=2000 | 40.0% | 44.9% | ✅ el techo sube |
| techo `--smart --focus` n=800 | 39.9% | 46.1% | ✅ |
| Master `--smart --focus` | 19.8% | 21.9% | ✅ el gate del árbol no baja |
| filosofía tope / DT / rasgos | 6.0 / 12.4 / 11.3 | 6.0 / 12.7 / 11.5 | ✅ progresión clavada |
| jugadas por partido | 3.33-4.66 | 6.33-7.68 | ✅ +3.0 exactas en los 5 duelos |
| hueco mediana / p90 / **máx** | 16-21' / 25-35' / **51'** | 11-13' / 16-19' / **29'** | ✅ |
| goles (GF/GC, 5 duelos) | 2.67…1.29 / 0.40…0.86 | 2.69…1.29 / 0.37…0.86 | ✅ restaurados |

Batería completa (`node tests/run-all.js`) verde.

## Puntos abiertos

1. **La brecha piso→techo se ensanchó** de 14.5 a 16.5pp (25.5→40.0 vs 28.4→44.9). Es coherente
   con el sprint —más jugadas interactivas = más lugares donde el DT humano saca diferencia— y
   yo lo leo como una mejora, pero es un cambio de forma del juego que el PO no pidió
   explícitamente. Si se quiere volver a comprimir, el dial es `BREAKAWAY_TICK` (el canal plano
   del underdog, sensibilidad ~−0.2pp por +0.001).
2. **El techo absoluto subió a 44.9%** (era 40.0). El arco del Rebalance había fijado el techo
   en ~41.9 con `--smart` y volvió a subir. No lo bajé porque la LEY del arco prohíbe que un
   dial global baje el techo, no que suba — pero si el objetivo declarado sigue siendo ~42,
   este sprint dejó 3pp de deuda ahí.
3. **La capa simulada quedó chica**: los remates ambiente bajaron a ~⅓. Es temáticamente
   correcto (las jugadas interactivas reemplazaron a la simulación) pero el partido tiene ahora
   menos "ruido de fondo" de remates. Si se siente vacío, `AMBIENT_LINE` (relato puro, no toca
   el balance) es el dial gratis para compensarlo.
