# WC Prime — notas para trabajar en este repo

Roguelike de navegador del Mundial 2026. **ES Modules nativos, sin build, sin dependencias
de npm.** El servidor local es `npx http-server -p 8347` (ver `.claude/launch.json`); abrir
`index.html` por `file://` no está soportado.

Documentación viva en [docs/](docs/): [ARQUITECTURA](docs/ARQUITECTURA.md) (dónde vive cada
cosa y qué puede depender de qué) · [CORE](docs/CORE.md) (matemáticas) ·
[FUNCIONES](docs/FUNCIONES.md) · los `ROADMAP-*.md` (por qué cada sistema es como es).

## Antes de dar por cerrado un cambio

```bash
node tests/run-all.js
```

Toda la batería tiene que quedar verde, incluido el `smoke` de 300 runs.

---

## Ver la UI de verdad (la parte que siempre se rompía)

### La regla corta

**Navegá a un deep-link y sacá la captura. No inyectes JavaScript para montar el estado.**

```
http://localhost:8347/?dev=philosophy&team=BRA&filo=contra&nivel=10&pi=12&node=el_anzuelo
```

```
http://localhost:8347/?dev=hub&team=ARG&filo=press&nivel=4&node=campo
```

```
http://localhost:8347/?dev=partido&team=ARG&filo=contra&nivel=3&min=67&dec=1
```

```
http://localhost:8347/?dev=saves&team=ARG&filo=contra&nivel=3&demo=1
```

Los parámetros están documentados en [js/dev/deeplink.js](js/dev/deeplink.js): `dev` `team`
`filo` `view` `nivel` `pi` `traits` `node` `onb` `anim` `dia` `min` `dec` `en` `moral` `oxid`
`demo`.
`node` abre lo que esa pantalla pueda abrir — la ficha de un rasgo en la pizarra, un edificio
en el hub. `dia=partido` salta al día del partido. Solo funciona servido en local; en cualquier
otro origen el módulo ni se descarga.

**`en` / `moral` / `oxid` mueven el ESTADO DEL EQUIPO** (energía de todo el plantel, Moral y
días sin entrenar). Sin ellos, una run recién montada está al 100% de energía, con la moral en
50 y sin óxido — o sea, en el único punto donde media pantalla del hub no tiene nada que
mostrar: la hoja de confirmación de Recuperar promete "+15" sobre un tanque lleno y no dibuja
ni una barra. Si vas a mirar algo que dependa del estado, montalo cansado.

**`demo`** es solo de `dev=saves` (la portada de ranuras) y existe por el mismo motivo:
esa pantalla no se puede verificar vacía —sus tarjetas de "en curso", "terminada" y "libre"
necesitan partidas adentro— y sembrarlas en `localStorage` **borraría las del jugador**. Con
`demo=1` (dos copas en curso) o `demo=fin` (campeón y eliminado) las ranuras viven en
memoria y el disco no se toca.

**`dev=partido`** no es una pantalla de `ui/nav` (el partido necesita un once y un rival: el
deep-link los deriva como el hub). Recién montado está 0-0 al minuto 0 y con el relato, el
momentum y el mapa de calor VACÍOS, o sea que no se parece a nada de lo que hay que verificar
— para eso están `min` (adelanta el reloj de golpe, resolviendo por el camino cada decisión
con su primera opción), `min=ht` (frena en el entretiempo) y `dec=1` (sigue hasta que se abra
una decisión). Son los tres estados de la pantalla.

El deep-link **congela las animaciones** por defecto: el riel del pizarrón se desliza en
420ms y la cámara del tablero hace zoom en 500ms, así que una captura disparada a destiempo
sale con el panel a mitad de camino y parece un bug que no existe. Con `&anim=1` se dejan
correr.

Cuando termina de montar marca `<html data-dev-ready="<pantalla>">`. **Esperá ese atributo**
en vez de dormir un rato fijo. Si algo sale mal marca `data-dev-error` y lo escribe en
pantalla, así que un deep-link roto se ve, no se adivina.

### Por qué esta regla existe

El arranque son **~98 peticiones de módulo, ~650ms**, y el patrón viejo era: inyectar JS →
`location.reload()` para recoger los cambios de archivo → volver a inyectar. Eso rompe la
automatización de navegador de una forma que **no se recupera sola**:

- `location.reload()` (o cualquier navegación) disparada *desde* `javascript_tool` destruye
  el contexto de ejecución **mientras la llamada está en vuelo**: la respuesta se pierde y la
  herramienta expira. El error que se ve es `did not respond in time` o `Detached while
  handling command`.
- Peor: el content script de la extensión queda **desenganchado de esa pestaña para
  siempre**. Todo lo que se pida después en ese `tabId` —incluso un `screenshot`— falla con
  `Script injection timed out after 5000ms`.
- **Reintentar en la misma pestaña no la revive nunca.** Diagnóstico verificado el
  6-ago-2026: con la pestaña vieja muerta y sin tocar nada más, una **pestaña nueva** navegó
  al instante y capturó a la primera.

### Si igual se traba

1. `tabs_create_mcp` → pestaña nueva. **No reintentes en la pestaña muerta**, no revive.
2. Navegá con la herramienta `navigate`, nunca con `location.href`/`reload()` desde dentro.
3. Cerrá la pestaña muerta (`tabs_close_mcp`) para no volver a agarrarla por error.

### Qué superficie usar

- **Capturas → Chrome real** (`mcp__claude-in-chrome__*`). El panel Browser interno suele
  estar oculto en la app del usuario y ahí `screenshot` falla con *"the Browser pane is not
  displayed, so the page is not compositing frames"* — eso es de la app, no del juego.
- **Aserciones de DOM y geometría → el panel interno** (`mcp__Claude_Browser__*`). Funciona
  aunque esté oculto, y es el más estable para medir (`scrollHeight`, `getComputedStyle`).
  Ideal para barrer muchos estados: los 64 rasgos de un tirón, midiendo desborde.
- **Móvil → [tools/mobile.html](tools/mobile.html)**. Achicar la ventana **no sirve**: la
  ventana tiene barras y scrollbars propios, así que el ancho de CSS que ve el juego no es el
  que uno cree. El banco monta el juego en un iframe calibrado y audita qué se sale.

---

---

## La partida se guarda sola, y solo al cerrar el día

El juego arranca en **la portada** (`js/ui/screens/saves.js`): el título y tres ranuras. El
menú de selección de equipo dejó de ser la raíz — es el segundo paso, dentro de una ranura
nueva.

El guardado va a `localStorage` como JSON (`js/storage/saves.js`), porque un `.js` no se
puede escribir desde la página. La regla §4.2 de ARQUITECTURA prohíbe que `game/**` importe
`storage/`, así que **el motor no sabe que existe el guardado**: el puente es
[js/ui/save.js](js/ui/save.js) y son tres llamadas en todo el juego — `draw` (nace la
ranura), `hub/pasarDia` (cada día que cierra) y `end` (el desenlace).

Dos consecuencias que conviene tener presentes antes de tocar nada:

- **Lo que pasa DENTRO de un día no está guardado hasta que el día termina.** Es la cadencia
  que eligió el PO. Si algún día molesta, la palanca es agregar llamadas a `autoguardar()`,
  no cambiar el formato.
- **La instancia `Match` no es serializable** (deuda declarada en ARQUITECTURA §3.1). Como
  el último guardado de un día de partido es el instante *antes* de salir a la cancha,
  cerrar la pestaña al minuto 67 devuelve al hub con el once puesto: se re-juega, no se
  retoma. No es un bug pendiente, es el contrato.

---

## Tres pantallas van por su cuenta: la portada, el hub y el partido

La portada (`js/ui/screens/saves.js`), la Concentración Mundialista
(`js/ui/screens/hub/`) y el partido en vivo (`js/ui/screens/match/`) no siguen las reglas
del resto de la UI, y es a propósito (rediseños del 6, el 7 y el 12-ago-2026, adaptados de
diseños de Claude Design):

- **Lienzo FIJO de 1440×900**, escalado entero con `transform` (`screenStage` en
  `ui/components.js`). No reflowea: es pixel art y un layout elástico obligaría a escalar en
  fracciones. En ventanas angostas quedan bandas negras; el móvil pediría un layout propio,
  que hoy **no existe**.
- **Kit propio**, todas las clases `px-*` en `index.html`: bordes duros de 2px, sombras
  sólidas sin blur, grilla de 8px, Silkscreen solo en mayúsculas. No mezclar con las cards
  redondeadas de Tailwind que usa el resto del juego.
- **Todo el arte se dibuja**, no se carga: los seis edificios isométricos
  (`hub/complex.js`) y los iconos de 16×16 (`ui/pixicons.js`) son SVG generados. El repo
  sigue sin assets binarios más allá de la fuente.
- **En el partido, el mando es una COLUMNA y la decisión vive DENTRO del relato**: no hay
  modal que tape el partido mientras se decide. El modal quedó solo para las decisiones que
  son una lista de jugadores (más de 3 opciones). La altura del bloque son cinco escalones
  clickeables en la columna, no una pizarra que se abre.
- **Geometría con presupuesto**: el complejo tiene su propio sistema de coordenadas de
  1440×`PLANO_H` anclado abajo, y la columna del HUD arranca en x=1056. `tests/hub.test.js`
  verifica que ninguna parcela se salga ni se solape — es lo que una captura no chequea.

## Deuda técnica que conviene tener presente

`index.html` carga **Tailwind desde `cdn.tailwindcss.com`**. El README dice "sin
dependencias" y hay un comentario en el CSS que dice que el juego funciona offline: las dos
cosas son falsas hoy para los estilos. Sin red, la UI queda sin maquetar. Cambiarlo pide un
paso de build, que es justo lo que el proyecto decidió no tener — está declarado acá para que
la decisión sea consciente y no una sorpresa. (La fuente Silkscreen del hub **sí** va
auto-hospedada en `assets/fonts/`, así que esa parte no depende de la red.)
