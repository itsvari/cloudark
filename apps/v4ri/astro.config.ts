import cloudflare from "@astrojs/cloudflare";
import { defineConfig } from "astro/config";
import { searchForWorkspaceRoot } from "vite";

export default defineConfig({
  adapter: cloudflare({
    imageService: "compile",
  }),
  output: "server",
  session: false,
  site: "https://v4ri.wav",
  vite: {
    server: {
      fs: {
        allow: [searchForWorkspaceRoot(process.cwd())],
      },
    },
  },
});
