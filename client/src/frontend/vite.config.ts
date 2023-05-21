import { defineConfig } from "vite";
import { svelte } from "@sveltejs/vite-plugin-svelte";
import { nodePolyfills } from "@bangjelkoski/vite-plugin-node-polyfills";

export default defineConfig({
  plugins: [svelte(), nodePolyfills({ protocolImports: true }) as any],
  resolve: {
    preserveSymlinks: true,
  },
});
