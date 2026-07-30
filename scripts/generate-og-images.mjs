import { readFileSync, writeFileSync, mkdirSync } from 'fs';
import { fileURLToPath, pathToFileURL } from 'url';
import { dirname, join } from 'path';
import satori from 'satori';
import { Resvg } from '@resvg/resvg-js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');

const blogPosts = JSON.parse(readFileSync(join(root, 'src/data/blog-posts.json'), 'utf8'));

const WIDTH = 1200;
const HEIGHT = 630;
const LOCALES = ['pl', 'en', 'ru'];
const TITLE_KEY = { pl: 'titlePl', en: 'titleEn', ru: 'titleRu' };

// Brand tokens, kept in sync with src/app.css (--color-bg-hero / --color-accent).
const COLOR_BG_HERO = '#0F172A';
const COLOR_ACCENT = '#F97316';
const COLOR_TEXT_MUTED = '#94A3B8';

const fonts = [
  {
    name: 'Open Sans',
    data: readFileSync(join(__dirname, 'og-fonts/OpenSans-Regular.ttf')),
    weight: 400,
    style: 'normal',
  },
  {
    name: 'Open Sans',
    data: readFileSync(join(__dirname, 'og-fonts/OpenSans-Bold.ttf')),
    weight: 700,
    style: 'normal',
  },
  {
    name: 'Poppins',
    data: readFileSync(join(__dirname, 'og-fonts/Poppins-Bold.ttf')),
    weight: 700,
    style: 'normal',
  },
];

const logoSvg = readFileSync(join(root, 'public/mi_code_logo_white.svg'), 'utf8');
const logoDataUri = `data:image/svg+xml;base64,${Buffer.from(logoSvg).toString('base64')}`;

// Font size tiers by title character length — satori/resvg have no automatic
// "shrink to fit" for text, so pick a smaller size for longer titles and rely
// on the outer container's overflow:hidden as a clean clip for the rare title
// that still doesn't fit at the smallest tier.
export function fontSizeFor(title) {
  const len = title.length;
  if (len <= 50) return 58;
  if (len <= 75) return 48;
  if (len <= 100) return 40;
  return 34;
}

function buildTree({ title, tags }) {
  const tagLabel = tags.slice(0, 2).join(' · ');

  return {
    type: 'div',
    props: {
      style: {
        width: `${WIDTH}px`,
        height: `${HEIGHT}px`,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        overflow: 'hidden',
        backgroundColor: COLOR_BG_HERO,
        backgroundImage: `radial-gradient(circle at 85% 15%, #1E3A8A 0%, ${COLOR_BG_HERO} 55%)`,
        padding: '64px 72px',
        fontFamily: 'Open Sans',
      },
      children: [
        {
          type: 'div',
          props: {
            style: { display: 'flex', alignItems: 'center' },
            children: [
              {
                type: 'img',
                props: { src: logoDataUri, width: 64, height: 64, style: { marginRight: '20px' } },
              },
              {
                type: 'div',
                props: {
                  style: {
                    display: 'flex',
                    fontFamily: 'Poppins',
                    fontSize: '30px',
                    fontWeight: 700,
                    color: '#ffffff',
                    letterSpacing: '2px',
                  },
                  children: 'MICODE',
                },
              },
            ],
          },
        },
        {
          type: 'div',
          props: {
            style: {
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'flex-start',
              maxWidth: '980px',
            },
            children: [
              {
                type: 'div',
                props: {
                  style: {
                    display: 'flex',
                    fontFamily: 'Poppins',
                    fontSize: '22px',
                    fontWeight: 700,
                    color: COLOR_BG_HERO,
                    backgroundColor: COLOR_ACCENT,
                    padding: '8px 20px',
                    borderRadius: '999px',
                    letterSpacing: '1px',
                    marginBottom: '28px',
                  },
                  children: tagLabel.toUpperCase(),
                },
              },
              {
                type: 'div',
                props: {
                  style: {
                    display: 'flex',
                    fontFamily: 'Open Sans',
                    fontSize: `${fontSizeFor(title)}px`,
                    fontWeight: 700,
                    lineHeight: 1.25,
                    color: '#ffffff',
                  },
                  children: title,
                },
              },
            ],
          },
        },
        {
          type: 'div',
          props: {
            style: {
              display: 'flex',
              fontFamily: 'Open Sans',
              fontSize: '24px',
              color: COLOR_TEXT_MUTED,
              alignSelf: 'flex-end',
            },
            children: 'mi-code.pl',
          },
        },
      ],
    },
  };
}

async function renderOgImage({ title, tags }) {
  const svg = await satori(buildTree({ title, tags }), { width: WIDTH, height: HEIGHT, fonts });
  const resvg = new Resvg(svg, { fitTo: { mode: 'width', value: WIDTH } });
  return resvg.render().asPng();
}

async function run() {
  const outDir = join(root, 'public/og');
  mkdirSync(outDir, { recursive: true });

  let written = 0;
  let failed = 0;

  for (const post of blogPosts) {
    for (const lang of LOCALES) {
      const title = post[TITLE_KEY[lang]];
      try {
        const png = await renderOgImage({ title, tags: post.tags });
        writeFileSync(join(outDir, `${post.slug}-${lang}.png`), png);
        written += 1;
      } catch (err) {
        failed += 1;
        console.warn(`  ! failed to generate OG image for ${post.slug} (${lang}): ${err.message}`);
      }
    }
  }

  console.log(`Generated ${written} OG images${failed ? `, ${failed} failed (will fall back to shared og-image.png)` : ''}.`);
}

// Only run the (slow, satori/resvg-dependent) generation pipeline when this file is executed
// directly (`node scripts/generate-og-images.mjs`) — not when imported, e.g. by its unit test.
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  run().catch((err) => {
    console.error('OG image generation failed:', err);
    process.exit(1);
  });
}
