import { defineConfig } from "vite";
import { svelte } from "@sveltejs/vite-plugin-svelte";
import { resolve } from "path";

// https://vite.dev/config/
export default defineConfig({
    base: "/",
    plugins: [
        svelte({ hot: !process.env.VITEST }),
        {
            // Dev-only: serve locale-prefixed routes from their source entry.
            // Strips /en/ or /ru/ prefix so Vite finds the actual file/page.
            // Covers:  /ru/products/x/          → /products/x/
            //          /en/products/x/main.ts   → /products/x/main.ts
            //          /ru/blog/x/              → /blog/x/
            //          /en/blog/                → /blog/           (listing page)
            //          /en/blog/main.ts         → /blog/main.ts
            //          /en/privacy-policy/      → /privacy-policy/
            // Note the trailing `.*` (not `.+`): the bare listing route
            // `/en/blog/` has nothing after the slash, so `.+` would miss it
            // and Vite's SPA fallback would serve the root index.html instead.
            name: "locale-fallback",
            configureServer(server) {
                server.middlewares.use((req, _res, next) => {
                    const url = req.url ?? "";
                    const m = url.match(/^\/(en|ru)(\/(?:products|blog|privacy-policy)\/.*)/);
                    if (m) {
                        req.url = m[2];
                    }
                    next();
                });
            },
        },
    ],
    build: {
        rollupOptions: {
            input: {
                main: resolve(__dirname, "index.html"),
                notFound: resolve(__dirname, "404.html"),
                accountingAi: resolve(__dirname, "products/accounting-ai/index.html"),
                emarketingAi: resolve(__dirname, "products/emarketing-ai/index.html"),
                budgetAssistant: resolve(__dirname, "products/budget-assistant/index.html"),
                ngxChat: resolve(__dirname, "products/ngx-chat/index.html"),
                testingAi: resolve(__dirname, "products/testing-ai/index.html"),
                legalkaKb: resolve(__dirname, "products/legalka-kb/index.html"),
                privacyPolicy: resolve(__dirname, "privacy-policy/index.html"),
                blog: resolve(__dirname, "blog/index.html"),
                scmArticle: resolve(__dirname, "blog/scm-ai-agents-supply-chain/index.html"),
                ngxChatArticle: resolve(__dirname, "blog/ngx-open-web-ui-chat-tutorial/index.html"),
                accountingAiArticle: resolve(__dirname, "blog/accounting-ai-polish-tax-automation/index.html"),
                emarketingAiArticle: resolve(__dirname, "blog/emarketing-ai-content-automation/index.html"),
                budgetAssistantArticle: resolve(__dirname, "blog/ai-budget-assistant-receipt-ocr-gpt4/index.html"),
                testingAiArticle: resolve(__dirname, "blog/testing-ai-agent-orchestration/index.html"),
                legalkaKbArticle: resolve(__dirname, "blog/legalka-kb-ai-architecture/index.html"),
                accountingAiArchitectureArticle: resolve(__dirname, "blog/accounting-ai-agent-architecture/index.html"),
                budgetAiArchitectureArticle: resolve(__dirname, "blog/ai-budget-assistant-ai-architecture/index.html"),
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
