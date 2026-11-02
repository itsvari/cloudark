import cloudflare from "@astrojs/cloudflare";
import { satteri } from "@astrojs/markdown-satteri";
import { defineConfig } from "astro/config";
import { searchForWorkspaceRoot } from "vite";

// the OS assigns separate debugger ports when both apps prerender concurrently.
const automaticInspectorPort = 0;

export default defineConfig({
  adapter: cloudflare({
    inspectorPort: automaticInspectorPort,
    imageService: "compile",
  }),
  output: "server",
  markdown: { processor: satteri({ features: { smartPunctuation: false } }) },
  session: false,
  site: "https://itsvari.com",
  vite: {
    define: {
      "process.env.CLOUDFLARE_ENV": JSON.stringify(process.env.CLOUDFLARE_ENV ?? ""),
    },
    server: {
      fs: {
        allow: [searchForWorkspaceRoot(process.cwd())],
      },
    },
  },
});
