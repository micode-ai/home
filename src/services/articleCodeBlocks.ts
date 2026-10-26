const FENCE = '```';

/**
 * Splits an article body into blank-line-separated chunks, except that a
 * fenced code block (```lang … ```) stays one chunk even when it contains blank lines. An
 * unclosed fence runs to the end of the body.
 */
export function splitArticleChunks(body: string): string[] {
  const chunks: string[] = [];
  let buf: string[] = [];
  let inFence = false;
  const flush = () => {
    if (buf.length > 0) chunks.push(buf.join('\n'));
    buf = [];
  };
  for (const line of body.split('\n')) {
    if (inFence) {
      buf.push(line);
      if (line.trim() === FENCE) {
        inFence = false;
        flush();
      }
    } else if (line.trimStart().startsWith(FENCE)) {
      flush();
      buf.push(line);
      inFence = true;
    } else if (line.trim() === '') {
      flush();
    } else {
      buf.push(line);
    }
  }
  flush();
  return chunks;
}

export function parseCodeFence(chunk: string): { lang: string; code: string } | null {
  const lines = chunk.trim().split('\n');
  if (!lines[0].startsWith(FENCE)) return null;
  const lang = lines[0].slice(FENCE.length).trim();
  const rest = lines.slice(1);
  if (rest.length > 0 && rest[rest.length - 1].trim() === FENCE) rest.pop();
  return { lang, code: rest.join('\n') };
}
