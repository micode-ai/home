// Tabular content embedded in blog articles.
// Referenced from a post body via the `[[table:<id>]]` marker (see ArticlePage.svelte).
// Keyed by a stable id, then by language — same convention as article-diagrams.ts.

type Lang = 'ru' | 'en' | 'pl';

export type ArticleTable = {
  headers: string[];
  rows: string[][];
};

export const articleTables: Record<string, Record<Lang, ArticleTable>> = {};
