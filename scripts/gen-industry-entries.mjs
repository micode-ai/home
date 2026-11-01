// Generates for/<id>/index.html + main.ts for every entry in src/data/industries.json.
// Re-run after adding an industry; then add its vite.config.ts input.
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const industries = JSON.parse(readFileSync(join(root, 'src/data/industries.json'), 'utf8'));
const esc = (s) => s.replace(/&/g, '&amp;').replace(/"/g, '&quot;');

for (const i of industries) {
  const title = esc(i.metaTitle.pl);
  const desc = esc(i.metaDescription.pl);
  const url = `https://mi-code.pl/for/${i.id}/`;
  const html = `<!doctype html>
<html lang="pl">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/mi_code_logo_mark.svg" />
    <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
    <link rel="icon" href="/favicon.ico" sizes="any" />
    <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link
      rel="preload"
      as="style"
      href="https://fonts.googleapis.com/css2?family=Open+Sans:wght@300;400;500;600;700&family=Poppins:wght@400;500;600;700&display=swap"
      onload="this.onload=null;this.rel='stylesheet'"
    />
    <noscript>
      <link href="https://fonts.googleapis.com/css2?family=Open+Sans:wght@300;400;500;600;700&family=Poppins:wght@400;500;600;700&display=swap" rel="stylesheet" />
    </noscript>

    <title>${title}</title>
    <meta name="description" content="${desc}" />
    <link rel="canonical" href="${url}" />

    <meta property="og:title" content="${title}" />
    <meta property="og:description" content="${desc}" />
    <meta property="og:type" content="website" />
    <meta property="og:url" content="${url}" />
    <meta property="og:image" content="https://mi-code.pl/og-image.png" />
    <meta property="og:site_name" content="MiCode Sp. z o.o." />

    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${title}" />
    <meta name="twitter:description" content="${desc}" />
    <meta name="twitter:image" content="https://mi-code.pl/og-image.png" />
    <!-- JSON-LD (WebPage, BreadcrumbList, FAQPage) is emitted per locale by IndustryPage.svelte -->
  </head>
  <body>
    <div id="app"></div>
    <script type="module" src="./main.ts"></script>
  </body>
</html>
`;
  const main = `import { hydrate } from 'svelte';
import IndustryApp from '../../src/IndustryApp.svelte';
import '../../src/app.css';

hydrate(IndustryApp, {
  target: document.getElementById('app')!,
  props: { industryId: '${i.id}' },
});
`;
  const dir = join(root, 'for', i.id);
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, 'index.html'), html);
  writeFileSync(join(dir, 'main.ts'), main);
  console.log('wrote for/' + i.id);
}
