# ROADMAP — El arco del Rebalance (R1–R2): ganar sin jugar no tiene sentido

Diseñado el 22-jul-2026 (base master `91c185d`, arco del Meta completo). Documento vivo:
se revisa al cerrar cada sprint. Sucede al arco del Meta (`ROADMAP-meta.md`) y cobra sus
3 deudas declaradas + la meta nueva del PO.

## La tesis del PO (ley de este arco)

> Si puedo ganar sin jugar, el juego no tiene mucho sentido. El que SOLO recupera con
> Brasil debe ganar un **10-15%** — no un 46%.

Y el diagnóstico que la acompaña (medido en el arco del Meta): el 46% del recuperador NO
vive en el botón de Recuperar — vive en que **no hacer nada es casi gratis**. Con la
banda verde su edge real sobre el mixto es ~+6pp; el resto es el poder base de BRA
llegando entero a cada partido contra rivales que no crecen. Nerfear la acción no llega
a la meta: hay que hacer que **no construir sea letal**.

## La escalera (la meta explícita del arco — TODOS los peldaños, no uno)

| Estrategia (BRA, azar salvo nota) | Hoy (cierre Meta) | Meta del arco |
|---|---|---|
| Siempre-Recuperar | ~46 | **10-15** |
| Siempre-Entrenar | ~25 | ~15-20 |
| Mixto azar (el PISO) | ~40 | **~25** |
| `--smart` (el TECHO) | ~52 | **~40** |

El título se gana en el techo, no en el piso. La escalera completa es el gate final —
mover un peldaño derrumbando otro no cierra el arco. Spread vigilado: CPV no puede morir
a 0 (piso ~3-5%) ni KOR desacoplarse de su proporción actual.

## Las direcciones

### A. La OXIDACIÓN (APROBADA — la mecánica nueva, R1)
El espejo de la banda verde: un plantel que no entrena se oxida. Una racha de días sin
Entrenar ni Sesión Táctica (umbral ~3-4 días, exacto = AskUserQuestion en R1) enciende
un multiplicador de rendimiento < 1 que escala con la racha (forma de la curva y piso =
AskUserQuestion; la lección de M1: la forma importa tanto como el número). Quirúrgica
por diseño: el recuperador puro vive oxidado crónico, el mixto azar casi no la pisa
(entrena ~50% de los días), el smart jamás. Narrable ("el plantel está pasado de
descanso") y visible en la UI como la banda (una sola constante, el color lo cuenta).

### B. La ESCALADA DE RIVALES en eliminatorias (APROBADA — la palanca grande, R2)
Hoy el rival de octavos es tan fuerte como el de la fecha 1. El Mundial de verdad se
juega en 5 finales: los rivales SUBEN en KO. Mecanismo exacto = decisión de diseño al
arrancar R2, candidatos (combinables):
- **Forma de torneo**: multiplicador suave por ronda a los rivales vivos.
- **La identidad rival madura**: su `nivel` de filosofía sube ronda a ronda (el enchufe
  `rivalFilo` ya existe; los grandes llegan consolidados ANTES).
- **Las avanzadas rivales**: los 16 curados juegan SU secuencia superior en KO (el
  enchufe de M2 está listo — `ADVANCED_BY_FILO` + `applyFiloWeights` del lado opp).
Esta palanca paga a la vez la deuda de dificultad del arco del Meta (mixto ~40 → ~25).

### C. Nerfs de coherencia al botón (APROBADOS — condimento, no plato, R1)
- **Recuperar solo te devuelve a la banda**: la acción no sube energía por encima de
  ~ENERGY_OK+algo (tope exacto = AskUserQuestion R1). El seguro asegura; no invierte.
- Vigilar (no implementar de entrada): Recuperar y el Momento (el plantel que solo
  descansa enfría a sus encendidos — ya casi es así por rotación de minutos).
DESCARTADOS: rendimiento decreciente del stack (redundante con la banda, ya descartado
en el arco del Meta) · costo/prima a Recuperar (un seguro caro no es seguro — rompería
la tesis de M1).

## Los 2 sprints

### R1 — "La oxidación"
1. Baseline FRESCO (protocolo del arco anterior: mixto n=4000, acciones n=1500-4000,
   `--smart` n=4000, filos n=2000, KOR/CPV n=1500 — el cierre del Meta es la referencia
   pero se re-corre: código nuevo, vara nueva).
2. AskUserQuestion de arranque: umbral de la racha (¿3-4 días?) · qué resetea (¿entrenar
   y táctica; bonding?) · curva y piso (¿convexa como la banda? ¿×0.85?) · el tope del
   nerf C (¿Recuperar no sube sobre 70-75?) · cómo se VE (hub/plantilla).
3. Implementar oxidación + nerf C, medir AISLADO por etapas (primero oxidación sola).
4. **Gate R1**: siempre-Recuperar cae a ~**30-35** · mixto azar casi intacto (tolerancia
   −2pp) · `--smart` intacto (±2pp) · unitario de la curva de oxidación (no solo smoke).
   Todo 2×n=4000. Si la oxidación sola no muerde, se presenta ANTES de compensar.

### R2 — "El Mundial de verdad"
1. Decisión de diseño al arrancar: el mecanismo de escalada (forma / identidad que
   madura / avanzadas rivales — o combinación y en qué dosis).
2. Implementar y medir por RONDA (nuevo instrumento posible: % de caída por ronda del
   smoke — dónde mueren las runs; la escalada debe sentirse en KO, no en grupos).
3. Relato: la escalada se narra (el Daily y el informe del rival anuncian que el rival
   llega "en modo Mundial"; la vitrina rival muestra su nivel de torneo).
4. **GATE FINAL DEL ARCO — la escalera completa (2×n=4000)**: recuperador **10-15** ·
   entrenar-solo ~15-20 · mixto ~25 · smart ~40 · CPV ≥3 · spread proporcional al
   actual. Revisita del Contra (−1.95, deuda del Meta): los cruces cambian con rivales
   que suben — foto por filo obligatoria; si sigue hundido, UNA palanca dirigida con ok
   del PO. La dificultad global queda recalibrada como parte del gate, no como daño
   colateral.

## Riesgos declarados

| Riesgo | Contención |
|---|---|
| La oxidación castiga al jugador nuevo que no entiende por qué rinde mal | UI explícita (color + texto en hub/plantilla) y narración del primer episodio; umbral generoso (3-4 días, no 2) |
| Oxidación + banda apilan dos multiplicadores < 1 sobre el mismo once | El unitario fija el producto mínimo (piso combinado); las fotos por acción lo vigilan |
| La escalada de rivales re-abre el spread (CPV muere en grupos ante curados escalados) | La escalada vive en KO, no en grupos; gate del arco exige CPV ≥3 |
| El mixto azar cae más de la cuenta (la escalera se comprime abajo) | La escalera COMPLETA es el gate: cada peldaño tiene su rango |
| Las avanzadas rivales explotan el costo de secuencia defensiva del jugador | Se dosifican (solo 16 curados, solo KO, share bajo) y se miden aisladas |
| Otra vez el ruido: metas separadas por ~5pp exigen instrumentos finos | TODO gate 2×n=4000; n=2000 solo para exploración; bordes con 3ª corrida |

## Apéndice: estado del documento
- **22-jul-2026** — Creado con las direcciones aprobadas por el PO en sesión (A oxidación,
  B escalada en KO, C nerfs de coherencia; escalera completa como gate final). Los
  números finos de cada mecánica = AskUserQuestion al arrancar su sprint.
