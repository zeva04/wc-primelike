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

Los parámetros están documentados en [js/dev/deeplink.js](js/dev/deeplink.js). Solo funciona
servido en local; en cualquier otro origen el módulo ni se descarga.

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

## Deuda técnica que conviene tener presente

`index.html` carga **Tailwind desde `cdn.tailwindcss.com`**. El README dice "sin
dependencias" y hay un comentario en el CSS que dice que el juego funciona offline: las dos
cosas son falsas hoy para los estilos. Sin red, la UI queda sin maquetar. Cambiarlo pide un
paso de build, que es justo lo que el proyecto decidió no tener — está declarado acá para que
la decisión sea consciente y no una sorpresa.
