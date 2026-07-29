# 🧬 ROADMAP — La Odisea: remodelación de las stats del jugador

> Arco pedido por el PO el 29-jul-2026. **Sprint 1, primera mitad: CERRADA.**
> Mecánica y tablas en `docs/CORE.md §1-2`.

## El pedido

1. Partir `pase` en **pase corto** y **pase largo**; agregar **velocidad**.
2. Cargarlas de forma realista (búsqueda) en todas las plantillas jugables, **sin que
   cambie la media actual de ningún jugador** — lo que obliga a mover el resto.
3. El **aura** pasa a valer un **10% parejo** de la media en los cuatro puestos.
4. Actualizar la configuración de las selecciones **no jugables**.
5. Agregar al entrenamiento del día los focos **pase corto**, **pase largo** y **velocidad**.
6. *(Segunda mitad del sprint)* Integrar las stats nuevas al partido.

## Las 4 decisiones del PO (AskUserQuestion)

| # | Pregunta | Decisión |
|---|---|---|
| 1 | Fuente de los datos | **Búsqueda por plantel**: páginas oficiales de EA SPORTS FC 26 (`ea.com/.../nations-ratings/<país>/<id>`), columna PAC por jugador, + perfil futbolístico para el reparto corto/largo. |
| 2 | Peso de la velocidad | **Protagonista**: DEL 22% · MED 18% · DEF 12% · POR 5%. |
| 3 | Cómo se preserva la media | **Automático ponderado**: velocidad y aura quedan fijas y el resto se mueve lo justo, proporcional al peso del puesto, con tope ±4 (±6 en los que no cierran). |
| 4 | Efecto del aura al 10% | **Aceptado**: el líder lento sube en todo lo demás; el veloz de aura baja ya no la necesita. |

## Lo que se hizo

**Datos** — `data/teams.js`: los **230 jugadores** de las 23 selecciones jugables reescritos
con las 7 stats. Velocidad investigada jugador por jugador (EA FC 26); el reparto
corto/largo **nunca infla** el pase compuesto (si el perfil sumaba, se le resta la media:
repartir, no regalar). Arqueros: la columna PAC de una carta GK es *diving*, no velocidad —
la suya se estimó por perfil, y su peso es 5%.

**Rivales no jugables** — `game/opponents.POS_MODS` extendido: el lateral/extremo corre, el
central es lento, el arquero no corre, el volante reparte corto mejor que largo.

**Motor** — `ratings.OVR_WEIGHTS` reescrito; `STAT_KEYS`/`GK_STAT_KEYS` y `statLine` con las
7. `actions.actPass` ya distingue de verdad: el pase **filtrado** mide `pase_largo`, el de
circulación `pase_corto`. El resto de los sitios que necesitan UN número de pase usan
`ratings.PASE_MIX` (60/40) — **la costura declarada** que reemplaza la segunda mitad.

**Acción del día** — Entrenar pasa de 3 focos a **5**: ataque · defensa · pase corto · pase
largo · **velocidad**, que cansa `TRAIN_FATIGUE + VELOCIDAD_FATIGUE_EXTRA` (−8) porque son
piques, no un rondo. `STAT_LABELS` y `CANJEABLE_STATS` incluyen las tres nuevas (el canje de
entrenamiento funciona con ellas sin tocar su regla).

**Contenido** — los eventos que repartían `pase` ahora dicen cuál (`pase_corto` casi todos;
el evento del genio da Pase corto permanente). Las **aristas** de las filosofías apuntan a
la stat que trabajan: Elaboración → pase corto · Juego directo → **pase largo** ·
Verticalidad → **velocidad**.

## Resultado medido

- **225 de 230 jugadores conservan su media exacta.**
- Los 5 que no: Casemiro 82→**78** (velocidad 40 con peso 18% no da), Chris Wood 77→76,
  Harry Kane 87→86, James Rodríguez 82→81, Dailon Livramento 64→65. Es una colisión
  estructural entre "la velocidad pesa mucho" y "la media no cambia": los diales son
  subirles la velocidad o bajar su peso (y recalcular los 230).
- **Balance sin deriva**: BRA `--smart --focus` **43.8-46.5%** de campeón (n=400-600) contra
  **44.7%** antes de la remodelación — dentro del ruido. Preservar la media funcionó.
- 4 stats quedaron en el techo de 99 (Messi corto/largo, Rodri corto, Bruno Fernandes) —
  son los mejores pasadores del mundo, se acepta.

## Bug arreglado de paso

La cabecera de Gestión de Plantilla apilaba energía + moral + media en un flex sin
`flex-wrap`: ~398px de contenido que a 375 se salían de la pantalla. Ahora envuelve.

## Segunda mitad del sprint — CERRADA (29-jul-2026)

**Las 3 decisiones del PO:** el desborde entra como **jugada nueva completa** (tipo de
secuencia propio, no opciones sueltas) · **enseña Contragolpe** · y la velocidad se mete
en los actos existentes **donde el fútbol la pide**, no en todo el motor.

### 🏃 La jugada nueva
`banda` = `wing → cross → finish`, con `protStat: "velocidad"` (la corre el rápido).
Detalle completo de opciones, stats y trades en `docs/CORE.md §Key Sequences`. Dos Football
Actions nuevas: **`actSprint`** (velocidad vs velocidad, el primer duelo así del motor) y
**`actCross`** (alto = `pase_largo` → cabezazo · rasante = `pase_corto` → remate de frente).

### La velocidad, en la cancha
- **Conducción**: era 100% aura; ahora aura + velocidad **al mismo valor esperado** (cambia
  el perfil, no el ritmo de gol).
- **Último hombre**: anticipar pesa la diferencia de velocidad entre el central y el 9.
- **Contención del repliegue**: la velocidad media de mi zaga entra al corte.

### Balance
BRA **47.3%** (era 46.5%) · MAR **41.8%** (era 43.5%), `--smart --focus` n=600/400: dentro
del ruido. La jugada nueva se lleva el **7.5%** de los actos de secuencia (medido en 120
partidos) sin desplazar a ninguna: entró por el reparto del pool, no por encima.

### Tests
18 checks nuevos en `sequences.test.js` (455 en total): el catálogo del tipo, que el rápido
la corre más que el lento sin ser determinista, los tres caminos del acto de banda, que
cortar hacia adentro **saltea el centro**, que el centro en juego abierto no lo cabecea un
central, y la monotonía de las cuatro stats en sus duelos (sprint propio y del perseguidor,
centro alto vs rasante, conducción, contención).

## Lo que queda para más adelante

- `PASE_MIX` sigue vivo en tres sitios que necesitan UN número de pase: `powers.teamPowers`
  (el atk del medio), `stats.passRate` (la precisión del panel) y `sequences.rivalProfile`.
  Tocarlos mueve el poder de equipo, así que es su propio sprint con su propia medición.
- La velocidad todavía no juega en: la persecución tras robo, el desmarque del desenlace ni
  el duelo del pelotazo (ahí manda el cabezazo, que es lo correcto).
- `rivalProfile` ya calcula `prof.vel` pero **nadie lo lee**: el pool podría sesgarse contra
  una zaga rival lenta (más desborde) — dial listo, sin usar.
