import { cpSync, existsSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
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
writeFileSync(join("build", "package.json"), typeModule);
writeFileSync(join("web", "build", "package.json"), typeModule);
