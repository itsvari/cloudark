import cloudflare from "@astrojs/cloudflare";
import { defineConfig } from "astro/config";
import { searchForWorkspaceRoot } from "vite";

export default defineConfig({
  adapter: cloudflare(),
  output: "server",
  site: "https://itsvari.com",
  vite: {
    server: {
      fs: {
        allow: [searchForWorkspaceRoot(process.cwd())],
      },
    },
  },
});
