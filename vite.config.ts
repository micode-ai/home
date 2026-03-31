import { defineConfig } from "vite";
import { svelte } from "@sveltejs/vite-plugin-svelte";

// https://vite.dev/config/
export default defineConfig({
    base: "/",
    plugins: [svelte({ hot: !process.env.VITEST })],
    test: {
        globals: true,
        environment: "jsdom",
        setupFiles: ["./src/setupTests.js"],
    },
    resolve: process.env.VITEST
        ? {
              conditions: ["browser"],
          }
        : undefined,
});
