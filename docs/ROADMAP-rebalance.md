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

### R1 — "La oxidación" — ✅ CERRADO (22-jul-2026)
Decisiones del PO al arrancar: umbral **3** días sin Entrenar/Táctica · **el partido
RESETEA** ("jugar es ritmo" — la decisión que comprimió la curva: la racha máxima real
es la ventana de 4-5 días y la oxidación pasó de estado crónico a *cómo llegas al
partido*) · nada más resetea (Bonding y Oportunidades suman; el cambio de identidad SÍ
resetea: reinstalar ideas es trabajo táctico) · curva **convexa espejo de la banda**,
racha 3 ×0.983 · 4 ×0.933 · 5+ ×0.85 (`powers.oxidMult`, estampada como `p.oxid` — el
mismo caño que la energía) · **nerf C DIFERIDO** ("que el descanso se borre no es
realista", PO — se retoma solo si R2 lo pide, con variante realista) · UI: chip ⚙️ Ritmo
en hub + línea en plantilla (constante única `oxidCls`) + primer episodio narrado en el
Diario.

Medido (baseline fresco → post-oxidación, BRA): siempre-Recuperar **46.4 → 22.7/22.7**
(2×n=4000, clavado) · mixto 41.8 → 40.5/40.2 (−2pp máx ✓) · smart 50.5 → 50.7/49.6 (±2 ✓)
· entrenar 27.2 → 25.9 n=4000 (ruido; no pisa la mecánica) · KOR 32.3→32.9 · CPV 8.9→8.6.
Quirúrgica como se diseñó — pero el interés compuesto (−11% medio × 6 jugadores × 7
partidos) mordió el doble de lo estimado: **overshoot del gate original (~30-35)**.
**El PO re-pactó el gate a ~20-25 y CERRÓ**: 22.7 ya produce el orden final de la
escalera abajo (recuperar < entrenar-solo). Consecuencia asumida: R2 arranca con el
peldaño de abajo cerca de su meta final (10-15) — la escalada de rivales se dosifica
mirando ESO. Unitario: `tests/oxidation.test.js` (curva exacta + piso combinado
banda×óxido ×0.6375 + la regla de la racha sobre el motor real).

### R2 — "El Mundial de verdad" — ✅ CERRADO (22-jul-2026, con 1 pendiente → R3)
Decisiones del PO al arrancar: **forma de torneo +3%/ronda desde 16avos** (`p.forma`
×1.03…×1.15, estampada en el once rival — solo MIS partidos) + **identidad que madura**
(+1 nivel desde cuartos, tope Consolidada) · avanzadas rivales en RESERVA (contenido
nuevo, no un enchufe listo). Instrumento nuevo del smoke: **% de caída por ronda**
(dónde mueren las runs) — confirmó que la escalada vive en KO (grupos ~2.1% intactos).

Medido por etapas (gate 2×n=4000): forma sola → mixto 42.7→33.5 · smart 49.5→40.9 ·
recuperar 21.9→16.8; madurez → ~0pp (condimento narrativo, anticipado). El recuperador
a 16.6 violaba la tesis (10-15) → palanca quirúrgica: **piso del óxido 0.85→0.82** (solo
él la pisa) → **13.3/14.2 ✓ LA TESIS DEL ARCO SE CUMPLE**. Narración completa: informe
del rival (chip "🔥 Modo Mundial +X%" + idea madurada), previa del Daily. Deuda del
Contra: **PAGADA sin palanca** (34.4/41.3 n=2000, sobre el mixto — M2 ya la había
saldado). Deuda de dificultad: pagada (mixto 42.7→32.7, −10pp).

**El pendiente declarado → R3 (decisión PO):** mixto azar quedó en **32.6/32.9** vs meta
~25. El dial global NO llega: +4%/ronda hundiría a smart (40.6/41.0, clavado en meta) y
arriesgaría a CPV (5.9-7.2, gate ≥3). La brecha azar↔greedy (~8pp) se ensancha
castigando DECISIONES, no inflando rivales — esa palanca nueva es el sprint R3, con
diseño propio.

### R3 — "Improvisar se paga" — ✅ CERRADO (22-jul-2026, gate re-pactado a mixto 29-31)

**La meta:** el peldaño que R2 declaró pendiente — mixto azar **32.7 → ~25** con el resto
de la escalera intacta. **La restricción que define el diseño** (medida, no opinada): la
separación mixto↔smart vive 100% en la PREPARACIÓN — en el smoke ambos resuelven las
secuencias al azar, así que castigar decisiones de partido no movería la brecha un pp.
Lo que el mixto hace mal y el smart no: dispersa la Sesión Táctica entre 5 aristas
(llega a KO Aprendiendo, sin avanzada) y recupera al azar.

**La palanca (decisión PO): A — el Mundial castiga al sin idea.** En KO, si mi nivel de
identidad es MENOR que el del rival (ya madurado por R2), su modo Mundial se amplifica:
**+2% de poder por nivel de brecha** (`gap = max(0, nivelRival − miNivel)`, apilado
sobre `p.forma`; brecha 2 → +4%). Smart es INMUNE por construcción (Consolidada antes de
KO); el mixto disperso paga la improvisación. En grupos no existe (koRound 0). Canal de
PODER, no de pool — la lección de R2: los sesgos de pool miden ~0pp. DESCARTADA la
palanca B (sobre-descanso suma doble a la racha): protege la narrativa simple de R1
("días sin entrenar") y su arrastre al recuperador.

**El dial declarado:** si +2%/brecha deja al mixto sobre ~27, el ajuste es SUBIR LA
BRECHA (+3-4%) — no inventar otra palanca: smart sigue inmune a cualquier dosis, cosa
que el dial global de R2 nunca permitió. Tope del dial: CPV ≥3 (el azar débil también
lleva brecha).

**La válvula del recuperador (decisión PO): tolerancia hasta ~9** — arrastra brecha 2
siempre (nivel 0), y se acepta hasta ~9 de título SIN re-diales durante R3 (la tesis
10-15 se relee como "~10, no menos de 9").

**El sprint:** 1. baseline fresco (protocolo: 7 fotos + caídas por ronda; la referencia
es el cierre de R2). 2. Implementar A + unitario (tabla del gap, inmunidad con nivel
propio ≥ rival, grupos ×1). 3. Medir AISLADA; si falta dosis, el dial con ok del PO.
4. Narración: el informe nombra la brecha ("llega con más idea — te va a pasar por
encima") y la previa del Daily la anuncia. 5. **GATE R3 (2×n=4000):** mixto **23-27** ·
smart 38-42 · recuperador ≥9 · entrenar 15-20 · CPV ≥3 · KOR proporcional · fotos por
filo · bordes con 3ª corrida.

**CÓMO CERRÓ (decisiones PO en sesión):** +2%/brecha midió −1.3pp — la brecha no existía
en 16avos/octavos (rivales chicos nivel 0) justo donde mueren las runs. Ajustes
aprobados: **madurez adelantada a 16avos** (`FILO_MADURA_DESDE` 3→1, "en eliminatorias
nadie llega sin idea" — revisión de una decisión de R2) y **dial a +4%/brecha**. Ahí el
dial topó su techo estructural: duplicarlo movía al mixto −0.8pp y al recuperador −2.3pp
(nivel 0 SIEMPRE paga brecha completa; el mixto alcanza nivel 1 a mitad de KO y esquiva
la mitad) — no hay dosis que cierre mixto ~25 sin perforar el ≥9. **Gate re-pactado a
mixto 29-31 y CERRADO (bordes con 3ª):** mixto 30.1/29.5/29.6 · recuperar 10.8/11.6 ✓
10-15 · smart 41.4/42.3 ✓ inmune · entrenar 15.6/14.4 (~15.0, borde inferior aceptado:
entrenar stats sin idea apenas supera al que improvisa — opción anotada si molesta:
eximir del gap a quien entrena) · CPV 5.7 ✓ · filos 27.1-33.9 (posesión premium, contra
sano). **Escalera final del ARCO COMPLETO: 11.3 · 15.0 · 29.7 · 41.9** (pre-arco:
46.4 · 27.2 · 41.8 · 50.5). La narración quedó: chip rojo del informe suma forma+brecha
("+17% encendido — llega con más idea"), previa del Daily la nombra.

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
- **22-jul-2026 (bis)** — **R1 CERRADO** con gate re-pactado (recuperador ~20-25 en vez
  de ~30-35: overshoot quirúrgico aceptado por el PO). Nerf C diferido. La escalera hoy:
  recuperar 22.7 · entrenar ~26 · mixto ~40.3 · smart ~50 · CPV 8.6 — a R2 le queda
  comprimir la mitad de arriba (mixto→~25, smart→~40) SIN perforar el 10-15 de abajo.
- **22-jul-2026 (ter)** — **R2 CERRADO**: forma +3%/ronda + madurez desde cuartos +
  piso del óxido 0.82. **La tesis del arco se cumple: recuperar 13.3/14.2 ∈ 10-15.**
  Escalera final: recuperar ~13.7 · entrenar ~19.7 · mixto ~32.7 · smart ~40.8 · CPV
  ~6.5 · spread 34→26. Contra pagado, dificultad pagada. Pendiente ÚNICO → **R3**: el
  mixto (32.7 vs ~25) exige una palanca de DECISIONES, no de rivales — diseño al
  arrancar R3.
- **22-jul-2026 (quater)** — **R3 DISEÑADO** (decisiones PO en sesión): palanca única A
  "el Mundial castiga al sin idea" (+2% de poder rival por nivel de brecha de identidad,
  solo KO, canal de poder); B descartada; el dial es la brecha misma (smart inmune a
  cualquier dosis); tolerancia del recuperador hasta ~9 sin re-diales. Gate: mixto 23-27
  con la escalera intacta. Sin implementar.
- **22-jul-2026 (quinquies)** — **R3 CERRADO y ARCO DEL REBALANCE COMPLETO**: brecha
  +4% con madurez desde 16avos; el dial topó su techo estructural (recuperador nivel 0
  paga siempre la brecha completa) y el gate del mixto se re-pactó a 29-31 con ok del
  PO. Escalera final: **recuperar 11.3 · entrenar 15.0 · mixto 29.7 · smart 41.9** ·
  CPV 5.7 · KOR 22.5. La tesis del arco ("ganar sin jugar no tiene sentido") cumplida:
  46.4 → 11.3. Deudas del Meta: las 3 pagadas (dificultad 41.8→29.7, spread 34→24,
  Contra sano 28.4).
