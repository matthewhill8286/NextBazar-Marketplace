import type { Config } from "@react-router/dev/config";
import { vercelPreset } from "@vercel/react-router/vite";

/** Repo-root config so Vercel detects React Router instead of Next.js. */
export default {
  appDirectory: "web/app",
  ssr: true,
  presets: [vercelPreset()],
  future: {
    v8_middleware: true,
  },
} satisfies Config;
