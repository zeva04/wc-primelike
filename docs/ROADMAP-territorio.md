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

Con 2-6 secuencias por partido, un mapa de calor alimentado solo por jugadas tendría 5 muestras.
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

1. **La densidad de jugadas** (deuda previa, intacta a propósito): hoy 2-6 por partido. El
   territorio abre una puerta natural —más momentos cuando el partido se juega en zonas
   calientes— pero subirla mueve ~+8pp hacia el favorito y exige su propio sprint.
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
