// Intrinsic sizes of images embedded in blog articles.
// Referenced from a post body via a block line `[[image:/blog/<dir>/<file>.webp|caption]]`
// (see ArticlePage.svelte). The caption lives in the body, so each language writes its own;
// only the pixel size lives here, once per file, so the page can reserve the image's box
// before it loads (no layout shift) without repeating `WxH` in three bodies.
//
// Keys are root-relative paths under `public/`. An image missing from this map still renders,
// just without width/height attributes — add its entry when you add the file.
//
// Convention: WebP at quality ~80, ~900 px wide for 9:16 sheets, < 250 KB each.

export type ArticleImage = { width: number; height: number };

export const articleImages: Record<string, ArticleImage> = {
  '/blog/ai-budget-pencil-films/ink-vs-pencil.webp': { width: 900, height: 799 },
  '/blog/ai-budget-pencil-films/hero-evolution.webp': { width: 940, height: 320 },
  '/blog/ai-budget-pencil-films/michal-likeness.webp': { width: 900, height: 1600 },
  '/blog/ai-budget-pencil-films/kasia-likeness.webp': { width: 900, height: 1600 },
  '/blog/ai-budget-pencil-films/pencil-themes.webp': { width: 900, height: 1173 },
  '/blog/ai-budget-pencil-films/pencil-handwriting.webp': { width: 900, height: 1600 },
  '/blog/ai-budget-pencil-films/pencil-repaid.webp': { width: 720, height: 1280 },
};
