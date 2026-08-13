/* ============================================================
   ui/screens/saves — LA PORTADA DEL JUEGO: el título y las tres ranuras.

   Adaptada del diseño "Selección de Partida" (Claude Design). Es la primera
   pantalla que se ve al abrir el juego y la que decide qué partida se juega, así
   que reemplaza al menú de selección de equipo como raíz: el menú pasó a ser el
   segundo paso ("elegí la selección de esta ranura nueva").

   ── Por qué el KIT PIXEL y no las cards del resto del juego ──────────────────
   Misma regla que el hub y el partido (CLAUDE.md): LIENZO FIJO de 1440×900
   escalado entero con `screenStage`, clases `px-*`, bordes duros de 2px, sombras
   sólidas sin blur, Silkscreen solo en mayúsculas. Esta pantalla y el hub son la
   misma casa — el jugador entra por acá y sigue ahí adentro.

   ── Las dos pantallas de este archivo ────────────────────────────────────────
   `title` es un velo a pantalla completa sobre las ranuras (no otra pantalla de
   nav): al hacer clic se levanta y ya están abajo, sin recargar nada. El botón
   "Volver al título" lo baja de nuevo.

   ── La barra de progreso: LA RUTA, no los días ───────────────────────────────
   El diseño traía "Día 14 de 26" con una casilla por día. Ese total no existe: una
   run dura 41-48 días según lo que sortee cada ventana de preparación, y no se sabe
   de antemano. Lo que sí es fijo son los OCHO PARTIDOS de la copa — 3 de grupos y 5
   de eliminatoria — así que la barra mide eso (decisión PO): total real, y responde
   lo que uno pregunta mirando una ranura, que es cuánto le falta a esa campaña. El
   día sigue escrito al lado, como número suelto.
   ============================================================ */
import { getTeam } from "../../data/teams-repo.js";
import { computeTable } from "../../game/tournament/groups.js";
import { nextOpponentId, STAGE_LABEL, STAGE_ORDER, FECHAS_GRUPO, RUTA_PARTIDOS } from "../../game/tournament/knockout.js";
import { getPhilosophy } from "../../content/identity/philosophies.js";
import { filoLevel } from "../../game/philosophy.js";
import { getSlots } from "../../storage/saves.js";
import { register, go } from "../nav.js";
import { S } from "../session.js";
import { screenStage, $, pxFlag, toast } from "../components.js";
import { pxIcon } from "../pixicons.js";
import { applyTeamColors } from "../theme.js";
import { usarRanura, cargarRanura, borrarRanura, soltarRanura } from "../save.js";
import { stopTimer } from "./match/index.js";

/* Estado de la vista. Vive fuera del render porque un re-pintado (abrir una hoja,
   borrar una ranura) no debe devolver al jugador al título. */
let pantalla = "title";        // title | slots
let hoja = null;               // null | opciones | borrar
let ranuraSel = 0;

/**
 * RANURAS SINTÉTICAS del deep-link de desarrollo (`?dev=saves&demo=1`), o null para
 * usar las de verdad. Existe porque esta pantalla no se puede verificar vacía: sus
 * tres estados de tarjeta —en curso, terminada y libre— solo aparecen con partidas
 * adentro, y sembrarlas en localStorage BORRARÍA las del jugador. En modo demo nada
 * de lo que se toque acá llega al disco: se lee de este array y se muta este array.
 */
let demo = null;

/** Las ranuras que esta pantalla está mostrando: las sintéticas si las hay, si no las reales. */
const ranuras = () => demo || getSlots();

/**
 * LA RUTA DE LA COPA como casillas: las 3 fechas de grupos y una por ronda KO. Se
 * DERIVA del torneo (`game/tournament/knockout`) en vez de escribirse a mano — si
 * algún día cambia el formato, la barra cambia con él y no queda mintiendo.
 */
const RUTA = [
  ...Array.from({ length: FECHAS_GRUPO }, (_, i) => `${STAGE_LABEL.groups} · Fecha ${i + 1}`),
  ...STAGE_ORDER.map(s => STAGE_LABEL[s]),
];

/* ── Lecturas del run: todo derivado, nada guardado aparte ───────────────────── */

/** Etapa en la que quedó la partida, en una línea. */
function etapaTxt(run) {
  return run.stage === "groups"
    ? `${STAGE_LABEL.groups} · Fecha ${Math.min((run.matchday ?? 0) + 1, FECHAS_GRUPO)}`
    : STAGE_LABEL[run.stage] || "En curso";
}

/** El contexto de esa etapa: la posición del grupo, o el balance en eliminatorias. */
function contextoTxt(run) {
  if (run.stage === "groups") {
    const g = run.groups?.[run.myGroupIdx];
    if (!g) return "";
    const tabla = computeTable(g);
    const pos = tabla.findIndex(r => r.id === run.teamId) + 1;
    const pts = tabla.find(r => r.id === run.teamId)?.pts ?? 0;
    return `Grupo ${g.name} · ${pos}º · ${pts} pt${pts === 1 ? "" : "s"}`;
  }
  const s = run.stats || {};
  return `${s.pg || 0}G ${s.pe || 0}E ${s.pp || 0}P · ${s.gf || 0}:${s.gc || 0}`;
}

/**
 * El próximo rival, o null si no hay. Va blindado a propósito: `nextOpponentId`
 * consulta `run.rounds[matchday]` o `run.koMatches`, y una partida terminada (o
 * eliminada) no tiene ninguno de los dos — reventar acá voltearía las tres ranuras
 * por culpa de una.
 */
function proximoRival(run) {
  try {
    const id = nextOpponentId(run);
    return id ? getTeam(id) : null;
  } catch { return null; }
}

/** Cuándo se escribió la ranura, en el idioma en que uno lo diría. */
function cuandoTxt(ms) {
  if (!ms) return "Sin fecha";
  const d = new Date(ms), hoy = new Date();
  const mismoDia = (a, b) => a.toDateString() === b.toDateString();
  const ayer = new Date(hoy); ayer.setDate(ayer.getDate() - 1);
  const hhmm = `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
  if (mismoDia(d, hoy)) return `Guardado hoy ${hhmm}`;
  if (mismoDia(d, ayer)) return `Guardado ayer ${hhmm}`;
  return `Guardado ${d.toLocaleDateString("es-CL", { day: "numeric", month: "short" })}`;
}

/** Cómo se llama un desenlace guardado. */
function finTxt(fin) {
  if (fin.champion) return "🏆 Campeón del mundo";
  return `${fin.abandoned ? "Abandonada" : "Eliminados"} · ${fin.stageLabel || "—"}`;
}

/* ── Piezas de la tarjeta ────────────────────────────────────────────────────── */

/**
 * La barra de la ruta: una casilla por partido, con aire entre los grupos y la
 * eliminatoria.
 *
 * El gris de "ya jugado" (#544c68) es más claro que el del diseño original, y la
 * razón es que cambió lo que la barra mide: allá eran 26 casillas de un día cada
 * una y el ojo leía el LARGO del tramo lleno; acá son 8 estaciones con nombre, cada
 * una una ronda, y lo que hay que poder contar de un vistazo es cuántas sobrevivió
 * esta copa. Con el #3a3548 de origen, jugado y pendiente se confundían.
 */
function rutaBar(run, terminada) {
  const jugados = run.stats?.pj ?? 0;
  return RUTA.map((label, i) => {
    const bg = i < jugados ? "#544c68" : (!terminada && i === jugados) ? "var(--wc-gold)" : "#241f30";
    // El aire antes de la primera ronda KO parte la barra en sus dos mitades reales:
    // sobrevivir al grupo y sobrevivir al mata-mata no son la misma clase de avance.
    return `<i title="${label}" style="flex:1;height:10px;display:block;border:1px solid var(--px-shadow);background:${bg}${i === FECHAS_GRUPO ? ";margin-left:12px" : ""}"></i>`;
  }).join("");
}

/** Los últimos marcadores propios (máx. 3), coloreados por lo que pasó de verdad. */
function ultimosChips(run) {
  const rs = (run.misResultados || []).slice(-3);
  if (!rs.length) return "";
  const chip = (r) => {
    // El desenlace real incluye la tanda: un 1-1 ganado por penales es una victoria,
    // y pintarlo de ámbar mentiría sobre cómo siguió la copa.
    const dif = r.pens ? r.pens.gf - r.pens.gc : r.gf - r.gc;
    const [bg, col] = dif > 0 ? ["#0d2019", "var(--px-ok)"] : dif < 0 ? ["#2a0f13", "var(--px-bad)"] : ["#221a08", "var(--px-warn)"];
    const opp = getTeam(r.oppId);
    const tip = `${r.gf}-${r.gc}${r.pens ? ` (${r.pens.gf}-${r.pens.gc} en penales)` : ""}${opp ? ` vs ${opp.name}` : ""}`;
    return `<div class="px flex items-center justify-center" title="${tip}"
      style="width:34px;height:22px;border:2px solid var(--wc-black);background:${bg};color:${col};font-size:9px">${r.gf}-${r.gc}</div>`;
  };
  return `<div class="flex items-center gap-1.5">
    <div class="px" style="font-size:9px;letter-spacing:.1em;color:var(--px-faint)">Últimos</div>
    ${rs.map(chip).join("")}
  </div>`;
}

/** La doctrina con la que se venía jugando: identidad + nivel, y el nivel del DT. */
function doctrinaTxt(run) {
  const f = getPhilosophy(run.filoId);
  return `<div class="flex items-center gap-1.5" style="margin-left:auto">
    ${pxIcon("escudo", 16)}
    <span class="px" style="font-size:10px;letter-spacing:.06em;color:var(--wc-gold-light)">${f ? `${f.name} Nv${filoLevel(run) + 1}` : "Sin identidad"}</span>
    <span class="px" style="font-size:10px;color:#3a3a46">·</span>
    <span class="px" style="font-size:10px;letter-spacing:.06em;color:var(--px-dim)">DT Nv${run.dtNivel || 1}</span>
  </div>`;
}

/** La columna izquierda de una ranura ocupada: número, bandera y país. */
function identidad(n, team) {
  return `<div class="flex flex-col items-center justify-center gap-2.5" style="width:190px;padding:0 12px;background:var(--px-panel-lo);border-right:2px solid var(--wc-black)">
    <div class="px" style="font-size:9px;letter-spacing:.14em;color:var(--px-faint)">Ranura ${n}</div>
    ${pxFlag(team, 88, 60)}
    <div class="px text-center" style="font-size:13px;letter-spacing:.06em;color:var(--px-ink)">${team ? team.name : "—"}</div>
  </div>`;
}

/** La columna derecha: el botón grande de la ranura. */
function accion(label, ayuda, primaria = true) {
  const btn = primaria
    ? `<div class="px flex items-center justify-center" style="width:156px;height:46px;background:var(--wc-gold);color:var(--wc-black);border:2px solid var(--wc-black);box-shadow:inset 2px 2px 0 var(--wc-gold-light), inset -2px -2px 0 var(--wc-gold-dark), 4px 4px 0 var(--px-shadow);font-size:12px;letter-spacing:.1em">${label}</div>`
    : `<div class="px flex items-center justify-center" style="width:156px;height:46px;background:var(--px-panel-hi);border:2px solid var(--px-line);box-shadow:2px 2px 0 var(--px-shadow);font-size:11px;letter-spacing:.1em;color:var(--wc-gold-light)">${label}</div>`;
  return `<div class="flex flex-col items-center justify-center gap-2 shrink-0" style="width:196px;border-left:2px solid var(--wc-black);background:var(--px-panel-lo)">
    ${btn}
    <div class="px-body text-center" style="font-size:12px;letter-spacing:.08em;text-transform:uppercase;color:var(--px-faint)">${ayuda}</div>
  </div>`;
}

/** Una ranura con partida adentro (en curso o terminada). */
function tarjetaOcupada(i, rec) {
  const run = rec.run;
  const n = String(i + 1).padStart(2, "0");
  const me = getTeam(run.teamId);
  const fin = rec.fin || null;
  const opp = fin ? null : proximoRival(run);
  const franja = me?.colors?.primary || "var(--wc-gold)";
  const enKo = run.stage !== "groups";
  // El chip DORADO es del campeón y de la eliminatoria: marca lo conseguido. Un
  // desenlace que no es el título —eliminado, abandonado— se pinta apagado, o la
  // ranura felicitaría al jugador por haberse quedado afuera en la fase de grupos.
  const tag = fin
    ? fin.champion
      ? `<div class="px-tag px-tag-gold" style="font-size:9px;padding:4px 8px">${finTxt(fin)}</div>`
      : `<div class="px-tag" style="font-size:9px;padding:4px 8px;background:#2a0f13;color:var(--px-bad);border-color:var(--px-bad)">${finTxt(fin)}</div>`
    : enKo
      ? `<div class="px-tag px-tag-gold" style="font-size:9px;padding:4px 8px">${etapaTxt(run)}</div>`
      : `<div class="px-tag" style="font-size:9px;padding:4px 8px;background:var(--px-panel-hi);color:#d4cee0;border-color:var(--px-line)">${etapaTxt(run)}</div>`;

  return `<div data-slot="${i}" class="flex items-stretch cursor-pointer"
      style="flex:1;min-height:0;background:var(--px-panel);border:2px solid var(--px-line);box-shadow:3px 3px 0 var(--px-shadow)">
    <div style="width:8px;background:${franja}"></div>
    ${identidad(n, me)}
    <div class="flex flex-col justify-center gap-3" style="flex:1;min-width:0;padding:12px 18px">

      <div class="flex items-center gap-2.5">
        ${tag}
        <div class="px-body truncate" style="font-size:14px;letter-spacing:.08em;text-transform:uppercase;color:var(--px-dim)">${contextoTxt(run)}</div>
        <div class="px shrink-0" style="margin-left:auto;font-size:9px;letter-spacing:.08em;color:var(--px-faint)">${cuandoTxt(rec.savedAt)}</div>
      </div>

      <div class="flex items-center gap-3.5">
        ${opp ? `<div class="flex items-center gap-2" style="padding:6px 10px;background:var(--px-panel-hi);border:2px solid var(--px-line)">
          ${pxIcon("balon", 16)}
          <div class="px-body" style="font-size:14px;letter-spacing:.06em;text-transform:uppercase;color:#d4cee0">Próximo</div>
          ${pxFlag(opp, 28, 19)}
          <div class="px truncate" style="font-size:11px;letter-spacing:.06em;color:var(--wc-gold-light)">${opp.name}</div>
        </div>` : ""}
        ${ultimosChips(run)}
        ${doctrinaTxt(run)}
      </div>

      <div class="flex items-center gap-2.5">
        <div class="px shrink-0" style="width:150px;font-size:9px;letter-spacing:.1em;color:var(--px-dim)">Día ${run.day} · ${fin ? `${run.stats?.pj ?? 0} partidos` : `Partido ${Math.min((run.stats?.pj ?? 0) + 1, RUTA_PARTIDOS)} de ${RUTA_PARTIDOS}`}</div>
        <div class="flex" style="flex:1;gap:2px">${rutaBar(run, !!fin)}</div>
      </div>

    </div>
    ${fin
      ? accion("Nueva copa acá", "Clic para abrir opciones", false)
      : accion("Continuar →", "Clic para abrir opciones", true)}
  </div>`;
}

/** Una ranura vacía: la invitación a empezar. */
function tarjetaLibre(i) {
  const n = String(i + 1).padStart(2, "0");
  return `<div data-slot="${i}" class="flex items-stretch cursor-pointer"
      style="flex:1;min-height:0;background:rgba(28,25,36,.6);border:2px dashed var(--px-line-off)">
    <div class="flex flex-col items-center justify-center gap-2.5" style="width:190px;padding:0 12px;border-right:2px solid var(--px-bg)">
      <div class="px" style="font-size:9px;letter-spacing:.14em;color:var(--px-faint)">Ranura ${n}</div>
      <div class="px flex items-center justify-center" style="width:88px;height:60px;border:2px solid var(--px-line-off);background:rgba(20,17,28,.7);font-size:20px;color:#3a3a46">?</div>
      <div class="px" style="font-size:11px;letter-spacing:.06em;color:var(--px-faint)">Vacía</div>
    </div>
    <div class="flex flex-col justify-center gap-2" style="flex:1;padding:12px 22px">
      <div class="px" style="font-size:15px;letter-spacing:.1em;color:var(--px-dim)">Ranura libre</div>
      <div class="px-body" style="font-size:15px;letter-spacing:.04em;color:#8f889f;max-width:620px;text-wrap:pretty">Empezá una copa nueva. Elegís la selección en la pantalla siguiente y el sorteo arma tu grupo.</div>
    </div>
    <div class="flex flex-col items-center justify-center gap-2 shrink-0" style="width:196px;border-left:2px solid var(--px-bg)">
      <div class="px flex items-center justify-center" style="width:156px;height:46px;background:var(--px-panel-hi);border:2px solid var(--px-line);box-shadow:2px 2px 0 var(--px-shadow);font-size:11px;letter-spacing:.1em;color:var(--wc-gold-light)">Nueva partida</div>
    </div>
  </div>`;
}

/**
 * Una ranura escrita por otra versión del juego. No se intenta interpretar: se dice
 * lo que hay y se ofrece lo único honesto, que es liberarla.
 */
function tarjetaIncompatible(i, rec) {
  const n = String(i + 1).padStart(2, "0");
  return `<div data-slot="${i}" class="flex items-stretch cursor-pointer"
      style="flex:1;min-height:0;background:rgba(28,25,36,.6);border:2px dashed var(--px-bad)">
    <div class="flex flex-col items-center justify-center gap-2.5" style="width:190px;padding:0 12px;border-right:2px solid var(--px-bg)">
      <div class="px" style="font-size:9px;letter-spacing:.14em;color:var(--px-faint)">Ranura ${n}</div>
      <div class="px flex items-center justify-center" style="width:88px;height:60px;border:2px solid var(--px-line-off);background:rgba(20,17,28,.7);font-size:20px;color:var(--px-bad)">!</div>
      <div class="px" style="font-size:11px;letter-spacing:.06em;color:var(--px-bad)">Ilegible</div>
    </div>
    <div class="flex flex-col justify-center gap-2" style="flex:1;padding:12px 22px">
      <div class="px" style="font-size:15px;letter-spacing:.1em;color:var(--px-bad)">Partida de otra versión</div>
      <div class="px-body" style="font-size:15px;letter-spacing:.04em;color:#8f889f;max-width:620px;text-wrap:pretty">Se guardó con un formato que este juego ya no sabe leer${rec.savedAt ? ` (${cuandoTxt(rec.savedAt).toLowerCase()})` : ""}. Abrirla mostraría una copa rota, así que solo se puede liberar la ranura.</div>
    </div>
    <div class="flex flex-col items-center justify-center gap-2 shrink-0" style="width:196px;border-left:2px solid var(--px-bg)">
      <div class="px flex items-center justify-center" style="width:156px;height:46px;background:var(--px-panel-hi);border:2px solid var(--px-bad);box-shadow:2px 2px 0 var(--px-shadow);font-size:11px;letter-spacing:.1em;color:var(--px-bad)">Liberar ranura</div>
    </div>
  </div>`;
}

/* ── Las dos hojas ───────────────────────────────────────────────────────────── */

/** Qué dice la hoja de una ranura: país y etapa, aunque esté terminada o ilegible. */
function resumenHoja(rec) {
  if (!rec || rec.incompatible) return { team: null, pais: "Partida ilegible", etapa: "Formato de otra versión" };
  const team = getTeam(rec.run.teamId);
  return {
    team,
    pais: team ? team.name : rec.run.teamId,
    etapa: rec.fin ? finTxt(rec.fin) : etapaTxt(rec.run),
  };
}

function hojaOpciones(i, rec) {
  const { team, pais, etapa } = resumenHoja(rec);
  const terminada = !!(rec && rec.fin);
  const ilegible = !rec || rec.incompatible;
  return `<div class="px-scrim"></div>
  <div style="position:absolute;left:0;right:0;top:0;bottom:0;margin:auto;width:468px;height:fit-content;z-index:60;background:rgba(38,34,48,.98);border:2px solid var(--wc-gold);box-shadow:6px 6px 0 var(--px-shadow)">
    <div class="flex items-center gap-2.5" style="padding:9px 12px;background:#2e2415;border-bottom:2px solid var(--wc-black)">
      ${pxIcon("diana", 16)}
      <div class="px" style="font-size:11px;letter-spacing:.1em;color:var(--wc-gold-light)">Ranura ${String(i + 1).padStart(2, "0")}</div>
      <div id="sv-x" class="px-x" style="margin-left:auto">X</div>
    </div>
    <div class="flex items-center gap-3" style="padding:16px 16px 12px">
      ${pxFlag(team, 64, 44)}
      <div style="min-width:0">
        <div class="px truncate" style="font-size:15px;letter-spacing:.06em;color:var(--px-ink)">${pais}</div>
        <div class="px-body" style="font-size:13.5px;letter-spacing:.08em;text-transform:uppercase;color:var(--px-dim);margin-top:4px">${etapa}</div>
      </div>
    </div>
    <div class="flex flex-col gap-2.5" style="padding:0 16px 16px">
      ${ilegible ? "" : terminada
        ? `<div id="sv-nueva" class="px px-btn" style="height:52px;font-size:13px;letter-spacing:.1em;cursor:pointer">Empezar otra copa acá →</div>`
        : `<div id="sv-continuar" class="px px-btn" style="height:52px;font-size:13px;letter-spacing:.1em;cursor:pointer">Continuar la copa →</div>`}
      <div id="sv-borrar" class="px flex items-center justify-center" style="height:44px;background:var(--px-panel-hi);border:2px solid var(--px-line);box-shadow:2px 2px 0 var(--px-shadow);font-size:11px;letter-spacing:.1em;color:var(--px-bad);cursor:pointer">${ilegible ? "Liberar la ranura" : "Borrar la partida"}</div>
      <div id="sv-cancel" class="px-body text-center" style="font-size:13px;letter-spacing:.06em;text-transform:uppercase;color:var(--px-faint);cursor:pointer">Cancelar</div>
    </div>
  </div>`;
}

function hojaBorrar(i, rec) {
  const { pais, etapa } = resumenHoja(rec);
  const ilegible = !rec || rec.incompatible;
  return `<div class="px-scrim"></div>
  <div style="position:absolute;left:0;right:0;top:0;bottom:0;margin:auto;width:468px;height:fit-content;z-index:60;background:rgba(38,34,48,.98);border:2px solid var(--px-bad);box-shadow:6px 6px 0 var(--px-shadow)">
    <div class="flex items-center gap-2.5" style="padding:9px 12px;background:#2a0f13;border-bottom:2px solid var(--wc-black);animation:pxBlinkBad 1.1s steps(2,end) infinite">
      ${pxIcon("roja", 16)}
      <div class="px" style="font-size:11px;letter-spacing:.1em;color:var(--px-bad)">Borrar ranura ${String(i + 1).padStart(2, "0")}</div>
    </div>
    <div style="padding:16px">
      <div class="px-body" style="font-size:15px;line-height:1.5;color:#f0d5d5;text-wrap:pretty">${ilegible
        ? "Se libera la ranura y lo que había adentro se pierde. No hay vuelta atrás."
        : `Se pierde la copa de <b>${pais}</b> en ${etapa}: el plantel, la identidad del DT y el diario de campaña. No hay vuelta atrás.`}</div>
      <div class="flex gap-2.5" style="margin-top:18px">
        <div id="sv-no" class="px flex items-center justify-center" style="flex:1;height:46px;background:var(--px-panel-hi);border:2px solid var(--px-line);box-shadow:2px 2px 0 var(--px-shadow);font-size:11px;letter-spacing:.1em;color:#d4cee0;cursor:pointer">Cancelar</div>
        <div id="sv-si" class="px flex items-center justify-center" style="flex:1;height:46px;background:var(--px-bad);border:2px solid var(--wc-black);box-shadow:inset 2px 2px 0 #fca5a5, inset -2px -2px 0 #b91c1c, 4px 4px 0 var(--px-shadow);font-size:11px;letter-spacing:.1em;color:#2a0f13;cursor:pointer">Sí, borrar</div>
      </div>
    </div>
  </div>`;
}

/* ── El título ───────────────────────────────────────────────────────────────── */

const velaTitulo = () => `<div id="sv-title" class="flex flex-col items-center justify-center cursor-pointer"
    style="position:absolute;inset:0;z-index:70;background:inherit">
  <div style="width:96px;height:96px;animation:pxFloat 3.2s ease-in-out infinite">${pxIcon("trofeo", 96)}</div>
  <div class="px" style="font-size:76px;line-height:1;letter-spacing:.14em;color:var(--wc-gold-light);text-shadow:6px 6px 0 #05050a;margin-top:26px">WC Prime</div>
  <div class="flex" style="width:520px;height:6px;margin-top:22px;border:2px solid var(--wc-black)">
    <div style="flex:1;background:var(--wc-red)"></div>
    <div style="flex:1;background:var(--wc-green)"></div>
    <div style="flex:1;background:var(--wc-blue)"></div>
  </div>
  <div class="px-body" style="font-size:15px;letter-spacing:.34em;text-transform:uppercase;color:var(--px-dim);margin-top:20px">Estados Unidos · México · Canadá</div>
  <div class="px" style="font-size:14px;letter-spacing:.12em;color:var(--wc-gold);margin-top:96px;animation:pxBlinkText 1.4s steps(2,end) infinite">Clic en cualquier parte para continuar</div>
</div>`;

/* ── La pantalla ─────────────────────────────────────────────────────────────── */

/**
 * Pinta el título y/o las ranuras. `opts.view = "ranuras"` entra directo a las
 * ranuras (lo usa el deep-link de desarrollo, y también el "Volver" de otras
 * pantallas: quien ya estaba jugando no quiere volver a ver la portada).
 */
function renderSaves(opts = {}) {
  // Se llega acá desde cualquier lado, incluido un partido en curso: cortar el
  // reloj del relato es obligatorio o el intervalo sigue latiendo sobre una
  // pantalla que ya no existe (mismo motivo que en el menú).
  stopTimer();
  if (opts.view === "ranuras") pantalla = "slots";
  if (opts.demo) { demo = opts.demo; pantalla = "slots"; }
  applyTeamColors(null);   // fuera del hub no hay equipo elegido: el oro por defecto
  const slots = ranuras();

  const fit = screenStage(`
    <div class="shrink-0 flex items-center gap-3.5" style="height:56px;padding:0 16px;background:var(--px-panel);border-bottom:2px solid var(--wc-black)">
      <div style="width:26px;height:36px">${pxIcon("trofeo", 26)}</div>
      <div class="px" style="font-size:16px;letter-spacing:.12em;color:var(--px-ink)">Seleccioná tu partida</div>
      <div class="px-body" style="font-size:12.5px;letter-spacing:.1em;text-transform:uppercase;color:var(--px-dim)">${slots.length} ranuras · una copa por ranura</div>
      <div class="flex items-center gap-2" style="margin-left:auto">
        <div class="px-tag px-tag-gold">Mundial 2026</div>
        <div id="sv-history" class="flex items-center justify-center cursor-pointer" title="Historial de partidas"
          style="width:28px;height:28px;background:var(--px-panel);border:2px solid #22222c">${pxIcon("engranaje", 16)}</div>
      </div>
    </div>

    <div class="shrink-0 flex" style="height:4px">
      <div style="flex:1;background:var(--wc-red)"></div>
      <div style="flex:1;background:var(--wc-green)"></div>
      <div style="flex:1;background:var(--wc-blue)"></div>
    </div>

    <div class="flex flex-col gap-4" style="flex:1;min-height:0;padding:24px 24px 8px">
      ${slots.map((rec, i) => !rec ? tarjetaLibre(i) : rec.incompatible ? tarjetaIncompatible(i, rec) : tarjetaOcupada(i, rec)).join("")}
    </div>

    <div class="shrink-0 flex items-center gap-4" style="height:72px;padding:0 24px;background:var(--px-panel);border-top:2px solid var(--wc-black)">
      <div id="sv-back" class="px flex items-center justify-center cursor-pointer"
        style="width:200px;height:44px;background:var(--px-panel-hi);border:2px solid var(--px-line);box-shadow:2px 2px 0 var(--px-shadow);font-size:11px;letter-spacing:.1em;color:var(--px-dim)">← Volver al título</div>
      <div class="px-body" style="font-size:13.5px;letter-spacing:.04em;color:#8f889f">Una partida guardada se conserva sola: el juego escribe la ranura al terminar cada día.</div>
    </div>

    ${hoja === "opciones" ? hojaOpciones(ranuraSel, slots[ranuraSel]) : hoja === "borrar" ? hojaBorrar(ranuraSel, slots[ranuraSel]) : ""}
    ${pantalla === "title" ? velaTitulo() : ""}

    <div class="px-scan"></div>
    <div class="px-vig"></div>
  `);
  window.onresize = fit;

  /* ── Cableado ──────────────────────────────────────────────────────────────── */
  const on = (sel, fn) => { const el = $(sel); if (el) el.onclick = fn; };

  on("#sv-title", () => { pantalla = "slots"; renderSaves(); });
  on("#sv-back", () => { pantalla = "title"; hoja = null; soltarRanura(); renderSaves(); });
  on("#sv-history", () => go("history", "saves"));

  // Una ranura VACÍA no abre hoja: no hay nada que decidir, arranca la partida nueva.
  // Las demás abren opciones — incluso la ilegible, que ahí solo podrá liberarse.
  document.querySelectorAll("[data-slot]").forEach(el => el.onclick = () => {
    const i = +el.dataset.slot;
    if (!slots[i]) { empezarEn(i); return; }
    ranuraSel = i; hoja = "opciones"; renderSaves();
  });

  on("#sv-x", cerrarHoja);
  on("#sv-cancel", cerrarHoja);
  on("#sv-no", () => { hoja = "opciones"; renderSaves(); });
  on("#sv-borrar", () => { hoja = "borrar"; renderSaves(); });
  on("#sv-nueva", () => empezarEn(ranuraSel));
  on("#sv-si", () => {
    if (demo) demo[ranuraSel] = null; else borrarRanura(ranuraSel);
    hoja = null;
    renderSaves();
  });
  on("#sv-continuar", () => {
    hoja = null;
    // En demo la run ya está en memoria y la sesión NO se ata a ninguna ranura
    // (`S.slot` sigue null), así que jugar desde acá no puede pisar nada guardado.
    if (demo) { S.run = demo[ranuraSel].run; applyTeamColors(getTeam(S.run.teamId)); go("hub"); return; }
    if (!cargarRanura(ranuraSel)) { toast("No se pudo abrir esa partida."); renderSaves(); return; }
    go("hub");
  });

  function cerrarHoja() { hoja = null; renderSaves(); }

  /** Ata la sesión a esa ranura y manda a elegir selección. Todavía no se escribe nada:
   *  la ranura se pisa recién al confirmar el sorteo (ui/screens/draw). */
  function empezarEn(i) {
    usarRanura(i);
    hoja = null;
    go("menu");
  }
}

register("saves", renderSaves);
