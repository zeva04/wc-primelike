/* ============================================================
   content/ambient — el pool de relato ambiente del partido (A3).
   Cada línea es DATOS: cuándo aplica (`when` sobre el ctx que arma
   Match._ambientLine — nunca sobre la run), cuánto pesa frente a
   las genéricas (`w`, las contextuales dominan cuando aplican) y
   su texto. El ambiente LEE el partido: anticipa en el relato lo
   que el contexto dinámico ya hace en el generador (perder tarde
   vuelca al ataque, el cansancio pesa, la moral se nota).

   ctx: { min, late (>=75'), diff (gMy−gOpp), myReds, oppReds,
          tired (energía media <55), band (banda de Moral),
          net (momentum últimos 15': mío − rival),
          filo (id de mi filosofía o null), filoLvl (0..2) — F3 }

   Agregar una línea = agregar una fila (cero lógica de sistema).
   ============================================================ */
export const AMBIENT_LINES = [
  // --- genéricas (siempre aplican, peso base) ---
  { when: () => true, w: 1, text: () => "El partido se juega en el mediocampo." },
  { when: () => true, w: 1, text: () => "La hinchada alienta sin parar." },
  { when: () => true, w: 1, text: () => "Pelota dividida, nadie cede." },
  // --- momentum (derivado de lo generado) ---
  { when: c => c.net < 0, w: 1, text: m => `${m.oppTeam.name} mueve la pelota con paciencia.` },
  { when: c => c.net > 0, w: 1, text: () => "Tu equipo presiona la salida rival." },
  { when: c => c.net > 3, w: 2, text: () => "Tu equipo huele sangre: el rival no sale de su campo." },
  { when: c => c.net < -3, w: 2, text: m => `${m.oppTeam.name} te tiene contra las cuerdas.` },
  // --- guion del partido: minuto y marcador ---
  { when: c => c.min <= 20, w: 2, text: () => "Tanteo inicial: los dos equipos se estudian." },
  { when: c => c.late && c.diff < 0, w: 3, text: () => "Tu equipo se vuelca al ataque: quedan espacios atrás." },
  { when: c => c.late && c.diff < 0, w: 3, text: () => "Todos arriba: es ahora o nunca." },
  { when: c => c.late && c.diff > 0, w: 3, text: () => "Tu equipo hace circular la pelota; el reloj también juega." },
  { when: c => c.late && c.diff > 0, w: 3, text: m => `${m.oppTeam.name} empuja con más corazón que ideas.` },
  { when: c => c.late && c.diff === 0, w: 3, text: () => "Minutos finales a puro nervio: el que pestañea, pierde." },
  // --- expulsados ---
  { when: c => c.oppReds > 0, w: 2, text: m => `Con uno menos, ${m.oppTeam.name} se encierra atrás.` },
  { when: c => c.myReds > 0, w: 2, text: () => "Con uno menos, tu equipo corre el doble para tapar los huecos." },
  // --- fatiga ---
  { when: c => c.tired, w: 2, text: () => "Las piernas pesan: el equipo baja el ritmo." },
  { when: c => c.tired, w: 2, text: () => "Se ven gestos de cansancio; el partido se hace largo." },
  // --- moral (los extremos se notan hasta en el trote) ---
  { when: c => c.band === "nubes", w: 2, text: () => "Se nota la confianza: la pelota corre sola." },
  { when: c => c.band === "suelo", w: 2, text: () => "Hay nervios en tu equipo: los pases no llegan al pie." },
  // --- filosofía (F3): el ambiente lee la identidad — ctx.filo/filoLvl vía matchCtx ---
  { when: c => c.filo === "press", w: 2, text: () => "Tu equipo achica en bloque: el rival no puede armar dos pases seguidos." },
  { when: c => c.filo === "press" && c.tired, w: 3, text: () => "La presión pide piernas que ya no están: el bloque achica cada vez más abajo." },
  { when: c => c.filo === "posesion", w: 2, text: () => "La pelota es tuya y el rival lo sabe: corre detrás de tu sombra." },
  { when: c => c.filo === "contra", w: 2, text: () => "Tu equipo espera ordenado: cada pelota recuperada huele a contra." },
  { when: c => c.filo === "bloque", w: 2, text: m => `${m.oppTeam.name} estrella olas contra tu área: la muralla aguanta.` },
  { when: c => c.filoLvl === 2, w: 2, text: () => "El estilo ya es identidad: se nota en cada pelota dividida." },
  { when: c => c.filoLvl === 0 && c.filo, w: 1, text: () => "La idea nueva todavía se piensa: al equipo le falta que salga sola." },
];
