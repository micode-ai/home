import { defineConfig } from "vite";
import { svelte } from "@sveltejs/vite-plugin-svelte";
import { resolve } from "path";

// Separate SSR build used only by scripts/prerender.mjs to render static
// HTML for crawlers. Not used by `npm run dev` or the client build.
export default defineConfig({
    plugins: [svelte()],
    build: {
        ssr: true,
        outDir: "dist-ssr",
        emptyOutDir: true,
        rollupOptions: {
            input: {
                home: resolve(__dirname, "prerender/entries/home.ts"),
                product: resolve(__dirname, "prerender/entries/product.ts"),
                blog: resolve(__dirname, "prerender/entries/blog.ts"),
                article: resolve(__dirname, "prerender/entries/article.ts"),
                privacyPolicy: resolve(__dirname, "prerender/entries/privacy-policy.ts"),
                glossary: resolve(__dirname, "prerender/entries/glossary.ts"),
            },
            output: {
                entryFileNames: "[name].js",
                format: "es",
            },
        },
    },
});
