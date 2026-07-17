# 🏆 Rumbo al Mundial 2026 — Roguelike

Juego roguelike de navegador con temática del Mundial 2026. Cada partida (run) es única: eliges tu selección, sobrevives al sorteo aleatorio y tomas decisiones antes y durante los partidos para llegar a la final. Si te eliminan, la run termina.

## Cómo jugar

El juego usa módulos ES, así que necesita un servidor estático local (el doble clic a `index.html` ya no funciona):

```
npx http-server -p 8347 -c-1
```

y abre `http://localhost:8347`. Requiere internet para cargar Tailwind CSS. Todo se juega con el mouse.

## Documentación técnica

- **[docs/CORE.md](docs/CORE.md)** — cómo funciona el juego y sus matemáticas: de dónde salen los números, cómo una stat se convierte en probabilidad de gol, la curva de estrellas, el modelo de Poisson y el balance medido. Léelo para discutir diseño.
- **[docs/FUNCIONES.md](docs/FUNCIONES.md)** — referencia de cada función, clase y estructura de datos, archivo por archivo. Léelo para tocar código.
- **[docs/ARQUITECTURA.md](docs/ARQUITECTURA.md)** — diagnóstico del monolito actual, arquitectura modular objetivo (por sistemas de juego), reglas de dependencias, plan de migración por fases y convenciones. Léelo antes de crear módulos o features nuevas.

## Estilo visual

Tema basado en la identidad del Mundial 2026: paleta negro/blanco/dorado del emblema oficial con acentos del tricolor de los anfitriones (rojo Canadá, verde México, azul EE.UU.). El menú muestra un trofeo y un balón estilo Trionda dibujados en SVG propio (sin assets oficiales de FIFA, que tienen derechos). Las banderas de las 48 selecciones son PNG locales en `data/flags/` (fuente: flagcdn.com, dominio público) porque los emoji de banderas no se renderizan en Windows. Al elegir selección, la interfaz adopta sus colores de camiseta (`colors` en `data/teams.js`, aplicados como variables CSS `--team-primary/secondary/text`).

## Estructura

```
index.html            → página principal (carga js/main.js como módulo ES)
js/main.js            → punto de entrada (composición, nada más)
js/core/              → rng.js (ÚNICO punto de azar) · math.js
js/data/teams-repo.js → consultas a la base de selecciones
js/game/              → sistemas de campaña: run, flow (orquestador: closeMatch,
                        postMatchUpdate, advanceStage), ratings, lineup, opponents,
                        calendar, daily (portada del día), day-action, discipline,
                        medical, journal
js/game/tournament/   → groups, knockout, sim (IA por Poisson), world (los partidos
                        ajenos repartidos día a día)
js/game/match/        → Match (máquina de estados) + powers, chances, incidents, shootout
js/content/           → tablas que se editan para agregar contenido:
                        prep-events, day-actions, conflicts, injuries, themes,
                        rarities, daily-flavor
js/ui/                → interfaz: nav (registro de pantallas), session (estado),
                        components, sprites, theme
js/ui/screens/        → una pantalla = un archivo: menu, history, draw, hub, squad,
                        worldcup, journal, match, shootout, post-match, end
js/storage/history.js → persistencia del historial (único módulo que toca localStorage)
data/teams.js         → base de datos de 52 selecciones (módulo ES)
data/flags/           → banderas PNG locales (una por selección)
tests/                → run-all, smoke (árbitro de balance), teams.validate,
                        events.validate (esquema y efectos del contenido), discipline
docs/                 → CORE.md (matemáticas) · FUNCIONES.md (referencia) · ARQUITECTURA.md
```

## Reglas del juego

- **Formato Mundial 2026 real**: 12 grupos de 4, clasifican los 2 primeros + los 8 mejores terceros → 16avos → octavos → cuartos → semis → final.
- **Selecciones jugables (16)**: Brasil, Noruega, Francia, Argentina, Inglaterra, Colombia, Marruecos, Corea del Sur, Senegal, Japón, Estados Unidos, México, Canadá, Australia, Nueva Zelanda y Cabo Verde — cada una con sus 10 figuras reales, stats individuales, colores de camiseta que tiñen la UI y dificultad temática (Favorito / Aspirante / Caballo negro / Campaña legendaria). El menú es un carrusel estilo FIFA: eliges continente y navegas con flechas entre sus selecciones, con panel de detalle del plantel completo (dorsales reales 1-26 incluidos) y sus **sprites pixelados** generados por código — busto con piel/pelo/barba del jugador real y la equipación del equipo; el arquero usa su equipación propia). Los rivales también tienen sprites: camiseta titular real (`kit` en los datos) y apariencia procedural determinista generada por hash del nombre — visibles en el hub (figuras) y en el panel "Rival en cancha" del partido. Los rivales son los **48 clasificados reales** al Mundial 2026 (verificados post-repechajes de marzo 2026: entraron Bosnia, Suecia, Chequia e Irak). La base de datos también guarda selecciones NO clasificadas (Italia, Dinamarca, Polonia, Bolivia) con `qualified: false` — no salen en el sorteo, quedan para features futuras.
- **Equipo**: formato **6v6** (Game Vision) — 6 titulares (POR + DEF + MED + DEL + 2 extras flexibles que definen la formación) y 4 suplentes, gestionados desde la pantalla de Gestión de Plantilla. Antes de cada partido ocurre un **Evento del día** inevitable (1 de 10) que buffea o nerfea al equipo. Stats en escala **1–99** (basadas en EA FC 26 para los planteles jugables). Jugadores de campo: tiro, defensa, cabezazo, pase y aura. Arqueros: **atajadas, reflejos, salidas, pase y aura** (atajadas = calidad base ante remates; reflejos = penales y mano a mano; salidas = dominio del área). La nota de cada jugador se pondera por posición; las estrellas son solo visualización (nota ÷ 20). El rating de un equipo jugable es el promedio de sus 5 mejores notas.
- **Calendario por días**: la run avanza día a día sobre las fechas reales del Mundial (11 jun – 19 jul 2026). Los partidos se juegan cada 5-6 días (aleatorio); cada día sin partido trae un **evento inevitable** o un **conflicto con decisión** (sponsors, peleas, virus, localía…). Los 30 eventos se sortean por **rareza** (Común 55% · Infrecuente 27% · Rara 13% · Legendaria 5%): a mayor rareza, mayor impacto — desde ±5 de una stat hasta mejoras permanentes de un jugador o un brote de gripe (~1 legendaria por run). Algunos eventos son **modificadores del día**: bloquean, reducen o duplican las acciones de hoy (cancha anegada → no se entrena; spa → recuperar ×2). El calendario del hub anticipa solo la **temática** de cada día (🏋️ Entrenamiento · 🧑‍⚕️ Estado físico · 🎭 Vestuario · 📣 Entorno) — el detalle y la rareza se descubren al vivirlo. Los efectos se acumulan hasta el próximo partido; en los días de partido no hay eventos.
- **Acción Principal del Día**: en cada día sin partido, después del evento, el DT elige **una** inversión (no se puede pasar el día sin elegir): 🏋️ Entrenar (foco ataque/defensa/pases: +4 a esa stat, pero −5 de energía al plantel), 🧘 Recuperar (+15 de energía) o 📋 Sesión táctica (el equipo llega mejor plantado al próximo partido). Elegir es renunciar: cada opción sacrifica las otras.
- **El Diario del Mundial**: cada día nuevo arranca con la **portada de un diario** (papel crema, serifas, nota de tapa) que responde "¿qué cambió desde ayer?" antes de decidir: reacción de la prensa al último partido, parte médico y sanciones, racha del goleador, posición en el grupo, framing del próximo rival (solo en la previa), lo de anoche en tu grupo y en el resto del torneo, y — solo en días tranquilos — una nota de color. 1 a 5 titulares: los días con poco que contar son deliberados, para que los grandes se sientan grandes. La portada informa; el evento del día (que llega después) transforma.
- **El mundo se mueve entre tus partidos**: los partidos de los otros grupos y cruces se juegan **repartidos por los días del calendario** (~5 por noche), no de golpe: cada mañana hay resultados frescos, las tablas de "Estado del Mundial" evolucionan a mitad de ventana y el diario prioriza a tus rivales directos (marcando a tu próximo rival si jugó anoche), los batacazos de verdad (una cenicienta venciendo a un Favorito), goleadas, festivales de goles, los resultados de los grandes y las expulsiones ajenas.
- **El diario tiene dientes**: la portada además **anticipa el evento de hoy** con un titular ambiguo ("se esperan lluvias…") que el evento materializa después, y las **rojas ajenas suspenden de verdad** — si la figura expulsada te enfrenta en su próximo partido, no forma en su alineación y el diario te lo avisa. Para que la baja duela, los rivales tienen plantel de 10 (5 figuras + genéricos que cubren todas las líneas). Y si TU plantel queda diezmado (4+ bajas de campo), el partido se juega igual: presentas a los que estén en pie, con la pena de inferioridad numérica.
- **Durante el partido**: relato en vivo con decisiones (ocasiones de gol, penales interactivos, cambios, mentalidad táctica, amonestados, lesiones, VAR). Reglas de cambio reales: 3 por partido, el sustituido no puede reingresar (queda en gris en la banca) y el arquero suplente solo puede entrar por el arquero.
- **Fin de la run**: pantalla de estadísticas; el historial se guarda en localStorage.

## Desarrollo

- **Tests en el repo** (correr antes de dar por bueno cualquier cambio del motor):
  - `node tests/run-all.js` — batería completa (datos + disciplina + smoke).
  - `node tests/smoke.js --team=BRA --runs=1500` — runs completas sin UI; el % de campeón es el árbitro de deriva de balance.
  - `node tests/teams.validate.js` — la LEY del esquema de datos (la distribución de posiciones por plantel es libre, mínimo 1 por posición; los sprites duplicados son advertencia).
- Escalabilidad: agregar una selección jugable = agregar su entrada en `data/teams.js` con `playable: true`. Agregar un evento/conflicto/lesión = una fila en `js/content/`.
- Dónde vive cada cosa y dónde va lo nuevo: [docs/ARQUITECTURA.md](docs/ARQUITECTURA.md) §7.
