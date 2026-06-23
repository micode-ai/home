import { defineConfig } from "vite";
import { svelte } from "@sveltejs/vite-plugin-svelte";
import { resolve } from "path";

// https://vite.dev/config/
export default defineConfig({
    base: "/",
    plugins: [svelte({ hot: !process.env.VITEST })],
    build: {
        rollupOptions: {
            input: {
                main: resolve(__dirname, "index.html"),
                accountingAi: resolve(__dirname, "products/accounting-ai/index.html"),
                emarketingAi: resolve(__dirname, "products/emarketing-ai/index.html"),
                budgetAssistant: resolve(__dirname, "products/budget-assistant/index.html"),
                ngxChat: resolve(__dirname, "products/ngx-chat/index.html"),
                testingAi: resolve(__dirname, "products/testing-ai/index.html"),
                blog: resolve(__dirname, "blog/index.html"),
                scmArticle: resolve(__dirname, "blog/scm-ai-agents-supply-chain/index.html"),
                ngxChatArticle: resolve(__dirname, "blog/ngx-open-web-ui-chat-tutorial/index.html"),
            },
        },
    },
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
