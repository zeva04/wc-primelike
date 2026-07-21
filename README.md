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
                        calendar, daily (portada del día), day-action, scouting
                        (informe del rival), discipline, medical, momentum (forma
                        del jugador), morale (ánimo del equipo), scorers (goleadores
                        del torneo), assists (asistidores del torneo), journal
js/game/tournament/   → groups, knockout, sim (IA por Poisson), world (los partidos
                        ajenos repartidos día a día)
js/game/match/        → Match (máquina de estados) + powers, chances, incidents, shootout
js/content/           → tablas que se editan para agregar contenido:
                        prep-events, day-actions, opportunities, conflicts,
                        injuries, themes, rarities, daily-flavor
js/ui/                → interfaz: nav (registro de pantallas), session (estado),
                        components, sprites, theme
js/ui/screens/        → una pantalla = un archivo: menu, history, draw, hub, squad,
                        worldcup, scorers, journal, match, shootout, post-match, end
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
- **Calendario por días**: la run avanza día a día sobre las fechas reales del Mundial (11 jun – 19 jul 2026). Los partidos se juegan cada 5-6 días (aleatorio); cada día sin partido trae un **evento inevitable** o un **conflicto con decisión** (sponsors, peleas, virus, localía…). Los 33 eventos se sortean por **rareza** (Común 55% · Infrecuente 27% · Rara 13% · Legendaria 5%): a mayor rareza, mayor impacto — desde ±5 de una stat hasta mejoras permanentes de un jugador o un brote de gripe (~1 legendaria por run). Algunos eventos son **modificadores del día**: bloquean, reducen o duplican las acciones de hoy (cancha anegada → no se entrena; spa → recuperar ×2). El calendario del hub anticipa solo la **temática** de cada día (🏋️ Entrenamiento · 🧑‍⚕️ Estado físico · 🎭 Vestuario · 📣 Entorno) — el detalle y la rareza se descubren al vivirlo. Los efectos se acumulan hasta el próximo partido; en los días de partido no hay eventos.
- **Acción Principal del Día**: en cada día sin partido, después del evento, el DT elige **una** inversión (no se puede pasar el día sin elegir): 🏋️ Entrenar (foco ataque/defensa/pases: +1 a esa stat para el próximo partido, pero −5 de energía al plantel), 🧘 Recuperar (+10 de energía) o 📋 Sesión táctica (el equipo llega mejor plantado al próximo partido). Elegir es renunciar: cada opción sacrifica las otras.
- **Canje de entrenamiento**: los efectos para el próximo partido son temporales, pero cuando el buff de una stat llega a **+4** puedes **canjearlo por +1 permanente a esa stat para todo el plantel** (crecimiento que dura el resto de la run, Bible cap.6). Renuncias al boost de ese partido a cambio de una mejora que ya no se borra — y es **gratis**: no gasta tu Acción del Día, porque el costo ya lo pagaste acumulando el +4. El canje aparece en "Efectos próximo partido" del Estado del Equipo apenas una stat alcanza el umbral. Es ventaja del DT humano (los rivales no crecen así), vigilada por el smoke test.
- **Eventos de Oportunidad**: a lo sumo **una vez por ventana** entre partidos (~2 de cada 3 ventanas), un día trae además una **oferta única** que compite con la Acción del Día: tomarla consume tu día, dejarla pasar la pierde para siempre — sin aviso previo (el calendario no la anticipa) y sin rastro si la rechazas. Son 19, sorteadas por la misma escala de rareza que los eventos: de una clínica de definición a la visita de un campeón del mundo o el Doctor Milagro. Las de mejora **permanente** te hacen elegir al jugador protagonista. El modificador del día no las toca: son premios externos, no acciones del club. Al final de la run, la pantalla de cierre te cuenta cuántas aprovechaste… y cuántas dejaste pasar.
- **El Informe del Rival**: la card del cruce en el hub abre el informe del cuerpo técnico — su ataque, su defensa y su arquero en niveles **Alto / Medio / Bajo relativos a TU equipo** (comparando el cruce real: su ataque contra tu defensa), la figura que duele, su forma reciente (los resultados que de verdad jugó en el torneo) y sus bajas confirmadas por rojas. Consultarlo es **gratis e ilimitado**: mirar nunca gasta el día. La Sesión Táctica ahora se prepara "vs {rival}", y en la previa el diario cita un dato del informe — el punto débil si lo hay.
- **El Diario del Mundial**: cada día nuevo arranca con la **portada de un diario** (papel crema, serifas, nota de tapa) que responde "¿qué cambió desde ayer?" antes de decidir: reacción de la prensa al último partido, parte médico y sanciones, racha del goleador, posición en el grupo, framing del próximo rival (solo en la previa), lo de anoche en tu grupo y en el resto del torneo, y — solo en días tranquilos — una nota de color. 1 a 5 titulares: los días con poco que contar son deliberados, para que los grandes se sientan grandes. La portada informa; el evento del día (que llega después) transforma.
- **El mundo se mueve entre tus partidos**: los partidos de los otros grupos y cruces se juegan **repartidos por los días del calendario** (~5 por noche), no de golpe: cada mañana hay resultados frescos, las tablas de "Estado del Mundial" evolucionan a mitad de ventana y el diario prioriza a tus rivales directos (marcando a tu próximo rival si jugó anoche), los batacazos de verdad (una cenicienta venciendo a un Favorito), goleadas, festivales de goles, los resultados de los grandes y las expulsiones ajenas. El **calendario** de la concentración muestra la ventana de preparación completa: los días que ya pasaron quedan en gris (no se borran) y hoy queda resaltado, para que se sienta el avance.
- **Tablas de goleadores y asistidores del torneo**: el hub muestra un **carrusel** con el top 5 de artilleros ⚽ y de asistidores 🅰️ del Mundial (clic → tabla completa con el mismo toggle). Tus goles y asistencias son los reales de tu plantel; los de los demás equipos se reparten entre sus figuras según posición cada vez que el mundo simula un partido — los goles pesan al delantero, las asistencias al mediocampista (el arquero nunca asiste). Solo los goles de jugada llevan asistencia (los penales no) — así la tabla se llena de nombres de todas las selecciones a medida que avanza el torneo.
- **El diario tiene dientes**: la portada además **anticipa el evento de hoy** con un titular ambiguo ("se esperan lluvias…") que el evento materializa después, y las **rojas ajenas suspenden de verdad** — si la figura expulsada te enfrenta en su próximo partido, no forma en su alineación y el diario te lo avisa. Para que la baja duela, los rivales tienen plantel de 10 (5 figuras + genéricos que cubren todas las líneas). Y si TU plantel queda diezmado (4+ bajas de campo), el partido se juega igual: presentas a los que estén en pie, con la pena de inferioridad numérica.
- **Momento del jugador**: cada jugador tuyo lleva una **forma** de 7 niveles cualitativos — Paupérrimo · Apagado · Malo · **Normal** (el punto de partida) · Bueno · Encendido · Inspirado — que sube y baja con su rendimiento **individual** (goles, **asistencias**, **cortes de último hombre**, penales fallados o atajados, vallas invictas) y decae sola si no se alimenta. Con las asistencias y el último hombre, la forma ya no es solo de goleadores: los **mediocampistas** la ganan habilitando y los **defensas** cortando goles rivales. El **resultado del equipo NO mueve el Momento** (eso va a la Moral): mantener la forma alta exige rendir partido a partido. Una **lesión resetea** la forma al neutro. **Subir cuesta más que caer**: la forma sube como mucho un nivel por partido, pero una mala actuación puede bajarla hasta dos. Afecta **todas sus stats en ±2% por nivel (tope ±4%)**: en la ficha se lee con la palabra, con la barra del stat **base** y el boost/nerf del Momento aparte (dorado si suma, celeste si resta); sobre la ficha en la cancha lo marca un icono por nivel (🔥 Inspirado, flechas según cuán arriba/abajo esté, ❄️ Paupérrimo). Al terminar cada partido, el **"Análisis del cuerpo técnico"** resume quién subió o bajó y por qué. Los rivales **no** tienen Momento: ventaja del DT humano vigilada por el smoke test.
- **Moral del equipo**: el ánimo colectivo (1..100, 5 bandas de "Por el suelo" a "Por las nubes") reacciona al **resultado** (victoria +10 / derrota −10 / empate 0) y a **cómo** se da: un gol agónico del triunfo enciende más que ganar de trámite, que te empaten al final duele, pasar de ronda celebra. El cambio de Moral por el partido se muestra en el **"Análisis del cuerpo técnico"** del post-partido, junto al Momento de cada jugador. Visible también en el hub y el diario; algunos eventos del calendario la mueven. Por ahora su efecto es narrativo — el impacto en el partido (tipo y número de ocasiones) llega en una próxima iteración.
- **Durante el partido**: relato en vivo con decisiones (ocasiones de gol, penales interactivos, **último hombre**, cambios, mentalidad táctica, amonestados, lesiones, VAR). En jugadas peligrosas del rival, tu **defensa central** elige cómo frenar al que se escapa — **anticipar** (todo o nada: corte limpio o el delantero queda de cara al arco), **barrerse** (puede cortar, pero arriesga tarjeta o penal) o **esperar** (seguro, baja la peligrosidad). Cortar el gol enciende su Momento; el error se paga en la cancha. Reglas de cambio reales: 3 por partido, el sustituido no puede reingresar (queda en gris en la banca) y el arquero suplente solo puede entrar por el arquero. **Jugar cansa**: cada partido resta energía en proporción a los minutos disputados (−10 cada 30'), así que al terminar cambias de día y toca **gestionar la energía** — rotar, dar descanso y recuperar. Entre partidos el plantel repone algo de energía cada día; los rivales, en cambio, siempre llegan al 100%.
- **Fin de la run**: pantalla de estadísticas; el historial se guarda en localStorage.

## Desarrollo

- **Tests en el repo** (correr antes de dar por bueno cualquier cambio del motor):
  - `node tests/run-all.js` — batería completa (datos + disciplina + smoke).
  - `node tests/smoke.js --team=BRA --runs=1500` — runs completas sin UI; el % de campeón es el árbitro de deriva de balance.
  - `node tests/teams.validate.js` — la LEY del esquema de datos (la distribución de posiciones por plantel es libre, mínimo 1 por posición; los sprites duplicados son advertencia).
- Escalabilidad: agregar una selección jugable = agregar su entrada en `data/teams.js` con `playable: true`. Agregar un evento/conflicto/lesión = una fila en `js/content/`.
- Dónde vive cada cosa y dónde va lo nuevo: [docs/ARQUITECTURA.md](docs/ARQUITECTURA.md) §7.
