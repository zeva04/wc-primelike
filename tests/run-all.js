/* ============================================================
   Corre toda la batería de tests en orden y resume.
   Uso: node tests/run-all.js
   ============================================================ */
import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const DIR = path.dirname(fileURLToPath(import.meta.url));
// ui.validate necesita el flag de módulos de vm (parsea sin ejecutar): va con su bandera.
const FLAGS = { "ui.validate.js": ["--experimental-vm-modules", "--no-warnings"] };
const FILES = ["teams.validate.js", "events.validate.js", "ui.validate.js", "discipline.test.js", "medical.test.js", "lineup.test.js", "scouting.test.js", "sequences.test.js", "momentum.test.js", "morale.test.js", "scorers.test.js", "assists.test.js", "day-action.test.js", "philosophy.test.js", "traits.test.js", "powers.test.js", "oxidation.test.js", "press.test.js", "stats.test.js", "match-momentum.test.js", "field.test.js", "escalada.test.js", "goalkeeper.test.js", "smoke.js"];

let fails = 0;
for (const f of FILES) {
  console.log(`\n━━━ ${f} ━━━`);
  const r = spawnSync(process.execPath, [...(FLAGS[f] || []), path.join(DIR, f)], { stdio: "inherit" });
  if (r.status !== 0) fails++;
}
console.log(`\n${fails ? `❌ ${fails} suite(s) con fallos` : "✅ TODA la batería verde"}`);
process.exit(fails ? 1 : 0);
