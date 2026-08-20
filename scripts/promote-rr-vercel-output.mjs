import { cpSync, existsSync, mkdirSync, rmSync } from "node:fs";

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
