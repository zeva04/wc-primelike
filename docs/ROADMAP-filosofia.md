# ROADMAP — El arco de Filosofía (F1–F3)

**Creado el 22-jul-2026** tras 8 decisiones de diseño del PO (AskUserQuestion, 2 rondas).
Base: master `31cf983` (arco del partido A1-A3 cerrado). Ley de diseño: **Bible §5** —
sus 7 reglas mandan, en especial: *la Filosofía es un GENERADOR de secuencias, no un
modificador estadístico escondido* (regla 3) · *toda filosofía tiene fortalezas y
vulnerabilidades visibles* (regla 4) · *se reconoce jugando, no leyendo números* (regla 6).

**Por qué ahora es barato:** el arco A1-A3 dejó el enchufe listo. `typeWeights` ya es EL
punto donde todo sesga la generación (mentalidad, marcador, fatiga, moral); la Filosofía
es un multiplicador más ahí — con niveles. Es el core del proyecto llegando a un motor
que ya habla su idioma.

---

## La mecánica (las 8 decisiones del PO)

### 1. Identidad y elección
Se elige **tras el sorteo, antes del día 1** (ves tu grupo y decides quién quieres ser).
Cambiar a mitad de run está permitido pero cuesta la **Acción del Día**, y la demolición
es **ORGÁNICA**: no se resetea nada — las aristas entrenadas persisten, pero la nueva
filosofía combina otras aristas, así que tu inversión probablemente no le sirve
(costo hundido real, sin castigo arbitrario).

### 2. Las 5 aristas (decisión PO: la filosofía se COMPONE de aristas)
El equipo entrena **aristas** transversales; cada filosofía es la **combinación de 2**:

| Arista | | Filosofías que la usan |
|---|---|---|
| 🦁 Presión | cazar arriba | High Press · Posesión |
| 🎼 Elaboración | tener y circular | Posesión |
| ⚡ Verticalidad | atacar el espacio | High Press · Contragolpe |
| 🧱 Solidez | orden y bloque | Contragolpe · Bloque bajo |
| 🌩️ Juego directo | el pelotazo y el duelo | Bloque bajo |

**Combinaciones**: High Press = Presión+Verticalidad · Posesión = Elaboración+Presión
(contrapressing) · Contragolpe = Solidez+Verticalidad · Bloque bajo = Solidez+Directo.
Los solapamientos son el mapa de transición: Press→Posesión conserva la Presión;
Press→Bloque es empezar casi de cero.

### 3. Progresión (dos patas, Bible: "más lenta que la individual")
- **Sesión Táctica reformada**: elige un FOCO de arista (como Entrenar elige stat) →
  +1 a esa arista. **El buff atk/def del próximo partido MUERE** (decisión PO — el
  rebalance de la Acción del Día entra al arco, ver riesgos). Los modificadores del día
  (×2, ×0.5, bloqueo) aplican igual que siempre.
- **Ejecución exitosa** (Bible: "successful execution"): ACERTAR actos del tipo firma en
  partido suma progreso chico a la arista asociada (con tope por partido). Jugar tu
  fútbol y que salga te consolida; el nivel no es solo un contador de días invertidos.

### 4. Niveles y sesgo del pool
**Nivel = f(suma de las 2 aristas propias)**: Aprendiendo → En desarrollo → Consolidada
(umbrales exactos = balance del sprint). Sesgo al tipo firma en `typeWeights`:
**×1.35 / ×1.7 / ×2.1** — perceptible desde el día 1 (comparable a la mentalidad ×1.5-1.6,
que sigue siendo el ajuste táctico de corto plazo, Bible regla 5). En **Consolidada** se
desbloquea UN **rasgo de identidad** por filosofía (High Press: la presión roba en zona
más letal · Posesión: +1 acto de circulación · Contragolpe: transiciones con mejor
perfil · Bloque: el repliegue contiene mejor).

### 5. El rival (decisión PO: curado por cómo juegan EN LA VIDA REAL)
- **16 selecciones curadas** (los 7 Favoritos: ARG BRA ENG ESP FRA GER POR + los 9
  Aspirantes: KOR MAR COL ECU URU NED BEL CRO SWE): filosofía asignada a mano según su
  fútbol real **+ formación acorde** (el PO autorizó tocar su formación). Vive en
  `content/` (NO en data/teams.js).
- **El resto deriva de sus stats** (el `rivalProfile` de A2 se mapea a la filosofía más
  cercana, nivel según su media) — escalable y gratis para los 48.
- La filosofía rival sesga el lado `opp` del pool, activa la matriz de counters y el
  **scouting la cuenta** ("España quiere la pelota: presiónala o enciérrate").

### 6. Counters y costos (regla 4: sin build ganadora)
- **Matriz en el pool** (filosofía mía × rival): mi Press brilla contra Posesión (más
  recuperaciones) · mi Posesión se estrella contra Bloque (circulación rinde menos, más
  pelotazo forzado) · mi Contra vive del rival que ataca y muere contra otro Bloque ·
  mi Bloque sufre al que elabora con paciencia. Celdas exactas = diseño de F2.
- **UN costo físico por identidad**: Press → −energía extra post-partido (Bible lo
  exige) · Contra → cede posesión/momentum · Bloque → −1 al objetivo de secuencias
  ofensivas · Posesión → sin costo físico (su costo ES la matriz).

---

## Los 3 sprints

### F1 — "La identidad" (mi filosofía en el motor) ✅ CERRADO 22-jul-2026

**Entregado completo** (todo lo de abajo) con las 4 decisiones de balance del PO: umbrales
**4/9** (Desarrollo/Consolidada) · ejecución **+0.25 por acierto, tope +0.5/partido** ·
elección en **4 cards** dentro del sorteo · Sesión Táctica con **los 5 focos, los 2 propios
destacados**. El cambio de filosofía vive como modal en el panel táctico (cuesta la Acción
del Día; las aristas persisten).

**Medición (gate en dos etapas, BRA n=4000 por corrida):**
- Baseline fresco pre-F1: mixto **34.0%** · táctica 41.7% · recuperar 46.4% · entrenar 20.8%.
- **(a) reforma aislada** (buff muerto, sin pool): mixto **31.5/31.8%** (−2.3pp, fuera del
  gate por 0.3pp) — la deriva es 100% el buff (recuperar/entrenar no se movieron); solo-táctica
  cayó a 32.2% (ya no domina; no gastar energía la sostiene). PO eligió seguir sin compensar.
- **(b) pool + ejecución**: mixto **31.6%** (media de 4 corridas, n=16000: 32.9/30.0/31.5/32.1).
  El sesgo NO devuelve win-rate **por diseño** (regla 3: cambia el fútbol, no compra goles) —
  diag: la firma sube +5-7pp de share en Consolidada, goles planos (~1.7), contexto A3 visible.
  **Decisión PO: RE-BASEAR en 31.6%** — F1 es infraestructura; la mordida llega en F2 (matriz
  + rasgos), que se mide contra 31.6 con el spread y siempre-Recuperar (46.5%, más dominante
  en relativo) bajo vigilancia obligada.
- Ritmos de ejecución (decisiones al azar): Posesión ~1.5 aciertos/partido · Contra ~1.1 ·
  Press ~0.7 · Bloque ~0.5 — la circulación multi-acto consolida más rápido; se vigila en F2.

- `game/philosophy.js` (aristas en la run, nivel, progresión) + `content/philosophies.js`
  (las 4 como DATOS: aristas, tipo firma, rasgo consolidado, flavor).
- **Sesión Táctica reformada** (focos de arista; muere el buff — `TACTICS_BONUS` se retira
  de day-actions y de powers) + elección post-sorteo (modal/pantalla mínima en el flujo
  del sorteo; la pantalla completa es F3) + cambio con costo.
- Enchufe en `typeWeights` (multiplicador por nivel, leído EN VIVO vía `matchCtx.filo` —
  el Match no conoce la run, misma frontera que la moral) + progresión por ejecución en
  `sequence-acts` (acierto del tipo firma).
- Smoke: elige filosofía al azar al armar la run y focos de arista al azar; foto por
  estrategia (`--action=tactica`) antes/después.
- **Gate en DOS etapas medidas por separado**: (a) Sesión Táctica nueva SIN sesgo del
  pool → mide SOLO el rebalance de acciones (va a moverse: la táctica era la acción más
  fuerte, 33.3% del mixto); (b) + sesgo del pool → mide la filosofía. NO mezclar.

### F2 — "El espejo" (el rival tiene identidad y la mecánica muerde) ✅ CERRADO 22-jul-2026

**Entregado completo** con las 4 decisiones del PO (matriz tal cual la propuesta · costos
planos −6/−0.05/−0.08 · rasgos míos mecánicos + rival narrativo · los 16 curados
aprobados). La curación vive en `content/team-philosophies.js` (BRA quedó Contragolpe: el
de Ancelotti, no el del mito); la derivación es determinista (débiles→bloque · medio con
jerarquía→posesión · resto→contra; el Press no se infiere) y el nivel va por jerarquía
(r≥84 Consolidada). Formación acorde SOLO curados (`bestSixShaped`). El informe nombra la
identidad rival y su nivel, con lectura táctica accionable.

**Medición (gate vs 31.6 ±2pp):**
- Primer gate: 28.8/29.1/30.9 → **29.6** (n=12000), clavado EN el límite. Con `--filo`
  (flag nuevo del smoke) se aisló el lastre: **Bloque 26.1%** (−5.5pp) vs Posesión 34.4 ·
  Contra 30.9 · Press 30.1 — el Bloque tenía puros palos (cesión −0.10, firma de peor EV,
  su celda de matriz es su debilidad, rasgo recién en Consolidada) y ninguna fortaleza
  mecánica propia.
- **Ajuste PO**: su arma que faltaba — balón parado ×1.3 (el córner ES el gol del bloque,
  el scouting ya lo decía) + cesión −0.10→−0.08.
- **Gate final: 30.9/30.3 → 30.6 (n=8000), ADENTRO con holgura** (deriva −1.0pp). Bloque
  27.6 (+1.5). Vigilancias obligadas: siempre-Recuperar 46.0 (estable) · spread BRA−CPV
  25.4pp (baseline 25.6: la curación NO abrió la brecha) · KOR 23.7 (estable).
- Diag de matriz (250 partidos/celda, nivel 2): cada celda mueve el share en su dirección
  con goles estables — Press vs ESP dispara recuperaciones 21→39% · la circulación se seca
  contra SWE (31→28%, pelotazo forzado 15%) · Contra vs GER 58% de transiciones (el caso
  extremo del riesgo "×2.1 ahoga el contexto": vigilar en F3 si el relato monotematiza) ·
  Bloque cede posesión real (45-49% mías).

- `content/team-philosophies.js`: los 16 curados (filosofía + formación real) +
  `derivePhilosophy(team)` para el resto (reemplaza el rol del proxy en el lado opp;
  `rivalProfile` puede quedar como insumo de la derivación).
- Matriz de counters (celdas concretas, AskUserQuestion con propuesta) + los 4 costos
  de identidad + rasgo consolidado del rival si su nivel lo amerita (los grandes llegan
  consolidados; los chicos, aprendiendo).
- Scouting/Daily: el informe nombra la filosofía rival y su nivel.
- Gate n=4000 + vigilancia OBLIGADA de siempre-Recuperar (el costo del Press pisa la
  palanca de energía) y del spread favorito/underdog (los 16 curados son los tier altos:
  si la curación los infla, la brecha se abre).

### F3 — "La vitrina" (se ve, se narra, se siente) ✅ CERRADO 22-jul-2026 — ARCO COMPLETO

**Entregado** con las 4 decisiones del PO (card compacta clickeable · mi fila de la matriz
en cualitativo · los 4 eventos tal cual · lluvia + ola de calor):
- `screens/philosophy.js` (nivel con barra, 5 aristas con la jugada que genera cada una,
  firma con su ×mult, rasgo 🔒/✅, counters) + `filoCard()` en el hub.
- Relato: la firma narra con identidad (`firmaIntros`, 3 voces por filosofía — "el pressing
  que entrenamos toda la semana"), la transición ganó 3 voces (herencia del 58% de F2), el
  ambiente lee filo/nivel (7 líneas) y el post-partido reporta ejecución + costo del Press
  (bug pescado en navegador: `closeMatch` soltaba `filoCost` en el destructure).
- El Daily de la previa nombra la identidad rival (la deuda de F2).
- Eventos: visita_maestro (rara) · prensa_bautiza · ensayo_firma (infrecuentes) + conflicto
  referente_cuestiona; pool 34→37 (ley del validador actualizada). Interacciones: la lluvia
  castiga al Press (−5 extra) y le corta el toque a la Posesión (−3 Pase); la ola de calor
  castiga al Press (−5 extra). `filoPointsOf/filoLevelOf` se movieron a content (el
  contenido lee el nivel; game delega — una sola fuente del umbral).
- **Verificación final del arco: 30.8%** (F2 cerró en 30.6 — F3 no tocó el balance, como
  debía). Batería verde completa; verificado en navegador (pantalla, card, relato firma en
  el feed real, ambos branches del bloque Identidad, móvil 375, consola limpia).
- `screens/philosophy.js`: pantalla de identidad y progreso de aristas + **chip en el
  estado del equipo del hub** (la imagen de referencia que el PO ya mandó).
- Relato: las secuencias del tipo firma narran CON identidad ("el pressing que
  entrenamos toda la semana..."), el ambiente lee la filosofía, el post-partido reporta
  el progreso por ejecución.
- Eventos de filosofía en el pool del calendario (3-4, content) + interacción evento ×
  filosofía donde sea barata (Bible: la lluvia castiga distinto al Press que a la
  Posesión).
- Sin gate (no toca balance) salvo verificación final del arco.

---

## Riesgos del arco (y su contención)

| Riesgo | Contención |
|---|---|
| **La muerte del buff táctico revienta el meta de acciones** | F1 lo mide AISLADO (etapa a, antes de enchufar el pool); fotos por estrategia; los 3 pendientes congelados del arco anterior se re-fotografían |
| **El costo físico del Press refuerza a siempre-Recuperar** | Es la palanca más fuerte del juego: foto `--action=recuperar` antes/después en F2, reportar sin arreglar si deriva |
| **La curación de 16 rivales infla a los tier altos** | Gate de F2 mira el spread, no solo BRA; la curación es contenido: se recorta antes que el gate |
| **El sesgo ×2.1 ahoga el contexto dinámico de A3** | El multiplicador es sobre UN tipo, no sobre el reparto; verificar en diag que marcador/fatiga/moral siguen visibles en la distribución |
| **`typeWeights` se vuelve una sopa de multiplicadores** | Ya lleva mentalidad+contexto+moral; si con filosofía pierde legibilidad, extraer a `weightFactors()` documentada — refactor chico ANTES de que duela |
| **El smoke decide focos al azar y subestima la filosofía** | Igual que el arco pasado: el smoke mide el PISO; el techo se verifica jugando. No calibrar el techo con el azar |

---

## Apéndice: estado del documento
- **22-jul-2026 (noche, 3ª entrada)** — **F3 cerrado: EL ARCO DE FILOSOFÍA ESTÁ COMPLETO.**
  El core del proyecto quedó en el juego: identidad que se elige mirando el grupo, se
  entrena por aristas, se ejecuta en la cancha, se countea contra el rival, se paga con su
  costo y se VE (pantalla, chip, relato, post-partido, eventos). Deudas menores que quedan
  para futuros sprints de contenido: el ritmo de ejecución asimétrico entre filosofías
  (Posesión ~3× Bloque, medido en F1) y más interacciones evento×filosofía si el clima
  crece. Balance del arco completo: 34.0 (pre-arco) → 30.8 (con el buff táctico muerto y
  la identidad viva) — el re-baseline de F1 fue decisión PO con datos.
- **22-jul-2026** — Creado tras las 8 decisiones del PO (2 rondas). Se revisa al cerrar
  cada sprint; si una decisión contradice lo escrito, gana el mejor argumento y queda
  registrado.
- **22-jul-2026 (noche, 2ª entrada)** — **F2 cerrado.** La matriz, los costos, los rasgos
  míos, los 16 curados y la derivación entraron según las 4 decisiones del PO; el único
  ajuste post-medición fue la zanahoria del Bloque (balón parado ×1.3 + cesión −0.08),
  aprobada tras aislarlo con `--filo`. Gate final 30.6 vs 31.6 (adentro). Pendientes que
  hereda F3: el relato monotemático del Contra consolidado vs press (58% transiciones) ·
  el ritmo asimétrico de ejecución (de F1) · narrar la matriz y los costos (el jugador
  aún los siente sin que nadie se los cuente).
- **22-jul-2026 (noche)** — **F1 cerrado.** Ajuste al plan: el tipo firma del Bloque bajo
  es el **pelotazo** (arista Juego directo), no el repliegue — las 4 firmas son del lado
  `mine` para que la progresión por ejecución dependa de MI fútbol y no de cuánto ataque
  el rival; la identidad defensiva del Bloque llega como rasgo consolidado (F2/F3).
  Nuevo baseline del arco: **31.6%** (decisión PO tras medir que el sesgo del pool no
  compra goles por diseño). Pendientes que hereda F2: la mordida (matriz + rasgos) se mide
  vs 31.6 · siempre-Recuperar 46.5% · ritmo de ejecución asimétrico entre filosofías.
