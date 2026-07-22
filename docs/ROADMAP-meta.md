# ROADMAP — El arco del Meta (M1–M2): recuperar es seguro, mejorar es estrategia

**Creado el 22-jul-2026** tras cerrar el arco de Filosofía (master `b1a235d`). Diseñado en
sesión con el PO; las direcciones A, B y E están APROBADAS por él, C y D descartadas.

## La tesis del PO (ley de este arco)

> Recuperar no debe ser una estrategia en sí: es una **medida para que estar muy cansado
> no te penalice**. Solo descansar no mejora ni a los jugadores ni a la filosofía.
> **Lo más importante en una run es que el equipo MEJORE: progresar la filosofía.**

## El diagnóstico (medido, no opinado)

- La energía hoy es **poder lineal** en `effStat` (game/match/powers.js): cada punto
  multiplica todas las stats, siempre. Recuperar (+10 a todos, sin costo) = comprar
  rendimiento universal a diario.
- Números de referencia (BRA, cierre del arco de Filosofía): mixto **30.8** ·
  siempre-Recuperar **46.0-47.3** (dominante desde el Sprint 3) · siempre-táctica ~31-32 ·
  siempre-entrenar ~21-22. Por identidad fija (n=2000): Posesión 34.4 · Contra 30.9 ·
  Press 30.1 · Bloque 27.6. Spread BRA−CPV ~25.4pp (KOR ~23.7, CPV ~5.2).
- El smoke actual mide solo el PISO (azar). No existe medición del TECHO (jugador óptimo)
  — el `--smart` está "pendiente de recrear" desde hace sprints.

## Las direcciones

### A. La banda verde de energía (APROBADA — el arreglo estructural)
Sobre un umbral (~70, exacto = decisión PO al arrancar M1), la energía rinde IGUAL:
un plantel al 75% juega como al 100%. Bajo el umbral el castigo escala (hasta ~×0.75
fundido; piso exacto = decisión PO). Con esto, recuperar fresco es un día tirado:
recuperas para VOLVER a la banda, no para acumular ventaja. La recuperación pasiva
(+8/día, medical.js) hace el mantenimiento; Recuperar queda situacional (post-partido,
post-Press, evento físico). Cambio quirúrgico: UNA curva en `effStat`.

### B. Secuencias desbloqueables por nivel de filosofía (APROBADA — idea del PO, la zanahoria)
Cada filosofía gana su **secuencia avanzada** que solo entra al pool desde **En
desarrollo** (nivel 1) y se profundiza en Consolidada: más actos, mejor % de éxito y
desenlaces nuevos — gol, **penal ganado**, **tiro libre**, **córner ganado**, **amarilla
al rival** (el motor ya tiene `amarilla`/`expulsado` en oppLineup: el enchufe existe).
Quien no entrena la idea se queda en el fútbol básico, con menos profundidad y éxito.
Bocetos (diseño fino = AskUserQuestion en M2):
- **Press — "Cacería total"**: presión encadenada; el rival que la rompe con falta puede
  ver amarilla; robo en zona letal.
- **Posesión — "La sinfonía"**: circulación larga que desespera; puede terminar en penal
  o remate limpio de alta calidad.
- **Contra — "Contragolpe letal"**: doble conducción con el rival partido; la falta
  desesperada regala tiro libre/amarilla.
- **Bloque — "La fortaleza castiga"**: contención → pelotazo inmediato con el rival
  desarmado; o córner ganado.
Es Bible puro: la progresión desbloquea GENERACIÓN nueva (regla 3), se reconoce jugando
(regla 6). La pantalla de identidad las muestra 🔒/✅ y el relato las narra como conquista.

### C. Recuperar con rendimiento decreciente — DESCARTADA (redundante con A: si sobre el
umbral no hay premio, sobre-recuperar ya no paga; no tocar dos palancas iguales).
### D. Recuperar dirigido (elegir jugadores) — DESCARTADA para este arco (UI nueva, pisa
la Oportunidad del descanso a medida).

### E. El smoke `--smart` (APROBADO — el instrumento, PRIMERO)
Este arco cambia LA ESTRATEGIA ÓPTIMA; el azar no la ve. DT greedy: foco de la Sesión
Táctica en SUS aristas, Recuperar solo bajo el umbral de la banda, Entrenar/canje como ya
hace el greedy del canje, Bonding con moral baja (regla existente). Flags nuevos junto a
`--action`/`--filo` en tests/smoke.js.

## Los 2 sprints

### M1 — "El descanso justo" ✅ CERRADO (22-jul-2026, gate formal NO cumplido y ACEPTADO)
1. **Baseline FRESCO completo** antes de tocar código: mixto n=4000, fotos por acción
   (recuperar/tactica/entrenar n=1500), por identidad (`--filo` ×4, n=2000), spread
   (KOR/CPV n=1500).
2. **Construir `--smart`** y fotografiar el techo ACTUAL (el villano del sprint: va a
   mostrar a Recuperar dominando aún más).
3. **Banda verde** en `effStat` — umbral y piso por AskUserQuestion. Medir AISLADA:
   (a) solo la curva; (b) + lo que derive (re-mirar el costo del Press −6: dentro de la
   banda podría quedar gratis — vigilarlo explícitamente).
4. **GATE DE OBJETIVO (distinto a los ±2pp de siempre)**: éxito = `--action=recuperar`
   cae a ≤ mixto+3pp, sin derrumbar el mixto ni abrir el spread. Si Recuperar sigue
   reinando, M1 NO cierra. Confirmar bordes con segunda corrida n=4000 (ley del arco).

**Cierre de M1 — lo medido (BRA salvo nota, decisiones PO en sesión):**
- Baseline fresco reprodujo el cierre de F3 (mixto 30.5 ≈ 30.8; ojo: las referencias del
  arco son con `--team=BRA`, el "mixto azar" da ~21-23). Techo pre-banda con `--smart`
  nuevo: 41.5 — **perdía contra siempre-Recuperar (44.2)**: jugar bien era mala idea.
- **Banda verde final: umbral 65, piso ×0.75, CONVEXA** (`energyMult`). El camino quedó
  medido por etapas: (a) lineal-70 dejó el gap en ~12pp — la masa de titulares del mixto
  vive en 55-68 y ese castigo chico COMPONE (6 jugadores × 7 partidos × ~30 secuencias);
  (b1) pasiva 8→9 **revertida** (no discrimina: ~0.4pp de gap por punto, pura inflación);
  (b2) umbral 65 lineal: +1.5 al mixto; (b3) **convexa: gap 6.2-6.9pp** (dos corridas
  n=4000: mixto 39.3/40.8 · recuperar 45.5/47.7).
- **Gate formal (≤ mixto+3pp): NO cumplido — 6.5pp. Aceptado por el PO** sin más palancas
  (se ofreció abaratar la espiral de Entrenar, TRAIN_FATIGUE 5→3, y lo rechazó). El
  ESPÍRITU sí se cumplió: `--smart` le gana a siempre-Recuperar en ambas corridas
  (49.5/49.1 vs 45.5/47.7), siempre-Táctica lo empata (43.7), y el diag mostró que el
  resto del gap es el lastre del azar (3 filas de Entrenar —estrategia de 25.3%— en un
  pool de ~6), no la energía: llegada al pitazo del mixto 68.9 con castigo de centavos, y
  lesiones graves idénticas (0.25-0.29/run) en las tres políticas.
- **Press: SIN re-costeo.** Bajo la convexa el pelotón de filos se movió entero (n=2000:
  Posesión 44.9 · Contra 40.9 · Press 39.3-39.6 · Bloque 38.4) y el Press quedó EXACTO en
  su posición histórica vs mixto (−0.7). El susto del "+0.3" era vara ruidosa.
- **Deuda DECLARADA (decisión PO): el spread se abrió** — BRA−CPV ~25.0 pre-banda →
  ~30.8 (los favoritos liberan más poder al salir de la penalización; KOR 32.9, CPV 8.5).
  Se trata junto con la dificultad global al cerrar el arco (el mixto también subió:
  30.5 → ~40), NO en M1.
- Estructura que quedó: `energyMult` en powers.js (+ unitario `powers.test.js`), la UI de
  energía colorea con `ENERGY_OK` (una sola fuente, `components.energyCls`: verde = banda),
  `--smart` en el smoke (heurísticas acordadas, documentadas en FUNCIONES).

### M2 — "El fútbol que se gana" ✅ CERRADO (22-jul-2026, gate global CUMPLIDO)
1. Las 4 secuencias avanzadas como DATOS (content/sequences.js, gated por `filo.nivel`
   en el pool de typeWeights/applyFiloWeights) + desenlaces nuevos reusando mecánicas
   (myPenalty, balon_parado encadenado como hace playout, amarilla rival vía incidents).
2. Decisión de diseño al arrancar: ¿el rasgo de Consolidada se FUSIONA con la secuencia
   avanzada (Consolidada la profundiza) o siguen separados?
3. Relato + vitrina: se narran como conquista, la pantalla de identidad las lista 🔒/✅.
4. **Gate**: `--smart` entrenando filosofía debe SUPERAR a `--smart` recuperador — por
   primera vez mejorar al equipo le gana a descansarlo. El mixto debería recuperar parte
   de los 3.2pp del arco de Filosofía como poder GANADO. Spread vigilado (los grandes
   consolidan antes: riesgo de abrirla).

**Cierre de M2 — lo decidido y lo medido (todo n=4000 × 2 corridas, BRA):**
- **FUSIÓN aprobada**: la avanzada ES el rasgo (los 4 rasgos de F2 eran, temáticamente,
  las 4 avanzadas — se mudaron adentro como su profundización de Consolidada). Diseños
  finos aprobados uno a uno (cacería 3 actos con falta/amarilla · sinfonía con penal del
  desesperado · letal con geografía de la falta + ROJA al último hombre [idea PO en
  sesión] · fortaleza def→of con córner ganado).
- **Gate redefinido en sesión** (la letra del roadmap ya se cumplía desde M1): (1) margen
  smart−recuperar crece a ≥+5pp; (2) cada filo sube vs su techo smart pre-avanzadas
  (vara re-medida n=4000 en worktree del commit de M1); spread vigilado.
- **Gate 1 ✅: margen +5.8** (smart 51.8-52.0 vs recuperar 46.1; era +2.7 al cierre de
  M1). El poder es GANADO: el techo smart subió de ~49.2 a ~51.9 con las avanzadas.
- **Gate 2, por filo**: Press 48.8→51.6 (**+2.8 ✅**) · Bloque 45.5→51.05 (**+5.6 ✅**,
  el colista eterno curado por su fortaleza) · Posesión 52.5→52.1 (plana: su +1.0
  preliminar era en parte un bug — la sinfonía esquivaba la celda posesion|bloque) ·
  **Contra 50.4→48.45 (−1.95 ❌, ACEPTADO Y DOCUMENTADO** tras 6 palancas: split del
  pool, herencia de la matriz, sin contra-contra en el 2º tramo, carryBonus/passBonus,
  carryEase, falta desesperada 0.28/roja 0.40. Causa estructural: su transición base era
  el tipo más fuerte del juego — firma ×2.1 + matriz + 12% falta=penal — y la geografía
  de la falta, que es diseño querido, paga peaje contra ese listón).
- **Spread entre filos smart: 7.0 → 3.65** (se CERRÓ: ya no hay filo-lastre) · BRA−CPV
  29.9 (≤ la deuda declarada ~30.8, no creció) · mixto 39.6 (estable: el azar casi no
  alcanza nivel 1 — la zanahoria premia al que entrena, por diseño).
- **Aprendizajes de implementación** (quedaron en comentarios del código): el gating
  REPARTE el peso de la familia (sumar hundía a las identidades con riesgo −5pp) y va AL
  FINAL de applyFiloWeights (la avanzada hereda matriz y firmas: repartir antes la
  sobre-jugaba en sus peores cruces).

## Riesgos declarados

| Riesgo | Contención | Veredicto M1 |
|---|---|---|
| La banda verde abarata el Press (−6 dentro de la banda ≈ gratis) | Foto `--filo=press` antes/después en M1; re-costear si deriva | ✅ NO derivó: −0.7 vs mixto, su posición histórica exacta |
| Las secuencias avanzadas abren el spread favorito/underdog | Gate de M2 mira spread; son contenido: se recortan antes que el gate | ⚠️ La BANDA ya lo abrió (25.0→30.8, deuda declarada): M2 arranca con menos margen |
| typeWeights gana otra dimensión (gating por nivel) | La extracción ya tiene casa: `applyFiloWeights` | (M2) |
| El `--smart` mal calibrado da un techo falso | Sus heurísticas se acuerdan con el PO ANTES de medir con él | ✅ Acordadas en sesión; techo estable entre corridas (47-49) |
| Entrenar queda como nueva dominante al abaratarse su costo relativo | Fotos por acción en cada etapa; el gate de M1 mira TODAS | ✅ Al revés: 25.3, el sótano (su espiral de energía; el PO rechazó abaratarla) |

## Apéndice: estado del documento
- **22-jul-2026** — Creado con las direcciones aprobadas por el PO en sesión (A, B, E sí;
  C, D no). Se revisa al cerrar cada sprint.
- **22-jul-2026 (tarde)** — M1 cerrado: banda convexa 65/×0.75, `--smart` construido,
  pasiva revertida a 8, Press sin re-costeo. Gate formal no cumplido (6.5pp) y aceptado;
  deudas declaradas para el cierre del arco: spread abierto (~30.8) y dificultad global
  (mixto ~40). M2 hereda: el gate `--smart` filosófico > `--smart` recuperador debería
  además comerse parte del gap del piso (la zanahoria le da valor a los días que hoy el
  azar "malgasta").
- **22-jul-2026 (noche)** — M2 cerrado y **ARCO COMPLETO**. La tesis quedó comprobada
  con margen: mejorar al equipo (+filosofía) le gana a descansarlo por +5.8pp en el
  techo. **Deudas del arco para el próximo rebalance global**: (1) dificultad — mixto
  azar BRA ~39.6 vs ~30.8 pre-arco (la banda liberó poder y las avanzadas lo suman);
  (2) spread BRA−CPV ~29.9 vs ~25.0 pre-arco (se abrió en M1, M2 no lo agravó);
  (3) el Contra −1.95 bajo su techo pre-avanzadas (estructural, 6 palancas probadas).
  Ninguna se esconde: las tres se atacan JUNTAS cuando se recalibre la dificultad.
