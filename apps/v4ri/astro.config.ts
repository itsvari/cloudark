import cloudflare from "@astrojs/cloudflare";
import { defineConfig } from "astro/config";
import { searchForWorkspaceRoot } from "vite";

export default defineConfig({
  adapter: cloudflare(),
  output: "server",
  site: "https://v4ri.wav",
  vite: {
    server: {
      fs: {
        allow: [searchForWorkspaceRoot(process.cwd())],
      },
    },
  },
});
