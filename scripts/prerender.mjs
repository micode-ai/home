import { readFileSync, writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');

const products = JSON.parse(readFileSync(join(root, 'src/data/products.json'), 'utf8'));
const blogPosts = JSON.parse(readFileSync(join(root, 'src/data/blog-posts.json'), 'utf8'));

function injectIntoFile(distPath, html) {
  const filePath = join(root, distPath);
  const source = readFileSync(filePath, 'utf8');
  const marker = '<div id="app"></div>';
  if (!source.includes(marker)) {
    throw new Error(`Could not find ${marker} in ${distPath}`);
  }
  writeFileSync(filePath, source.replace(marker, `<div id="app">${html}</div>`));
  console.log(`  Prerendered ${distPath} (${html.length} chars)`);
}

async function run() {
  const { renderPage: renderHome } = await import('../dist-ssr/home.js');
  const { renderPage: renderProduct } = await import('../dist-ssr/product.js');
  const { renderPage: renderBlog } = await import('../dist-ssr/blog.js');
  const { renderPage: renderArticle } = await import('../dist-ssr/article.js');

  console.log('Prerendering home page...');
  injectIntoFile('dist/index.html', renderHome().html);

  console.log('Prerendering product pages...');
  for (const product of products) {
    injectIntoFile(`dist/products/${product.id}/index.html`, renderProduct(product.id).html);
  }

  console.log('Prerendering blog index...');
  injectIntoFile('dist/blog/index.html', renderBlog().html);

  console.log('Prerendering blog articles...');
  for (const post of blogPosts) {
    injectIntoFile(`dist/blog/${post.slug}/index.html`, renderArticle(post.slug).html);
  }

  console.log('Prerendering complete.');
}

run().catch((err) => {
  console.error('Prerendering failed:', err);
  process.exit(1);
});
