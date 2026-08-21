import {
  cpSync,
  existsSync,
  mkdirSync,
  readdirSync,
  rmSync,
  statSync,
  writeFileSync,
} from "node:fs";
import { join } from "node:path";

const result = "web/.vercel/react-router-build-result.json";
if (!existsSync(result)) {
  throw new Error(
    `${result} missing — react-router build did not emit Vercel metadata`,
  );
}

mkdirSync(".vercel", { recursive: true });
cpSync(result, ".vercel/react-router-build-result.json");
rmSync("build", { recursive: true, force: true });
cpSync("web/build", "build", { recursive: true });

const typeModule = `${JSON.stringify({ type: "module" }, null, 2)}\n`;

function writeTypeModule(dir) {
  writeFileSync(join(dir, "package.json"), typeModule);
}

writeTypeModule("build");
writeTypeModule(join("web", "build"));

for (const base of ["build/server", "web/build/server"]) {
  if (!existsSync(base)) continue;
  for (const name of readdirSync(base)) {
    const dir = join(base, name);
    if (statSync(dir).isDirectory()) writeTypeModule(dir);
  }
}
