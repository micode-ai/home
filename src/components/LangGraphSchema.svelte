<script lang="ts">
  import { darkModeStore } from '../stores/darkModeStore';

  let { definition, label = 'LangGraph workflow diagram' }: {
    definition: string;
    label?: string;
  } = $props();

  let svg = $state('');
  let failed = $state(false);

  // mermaid is loaded lazily so it stays out of the main bundle and only
  // ships on product pages that actually render a schema.
  let mermaidApi: { initialize: (c: unknown) => void; render: (id: string, def: string) => Promise<{ svg: string }> } | null = null;
  let renderSeq = 0;

  // Re-render whenever the definition or the dark-mode theme changes.
  $effect(() => {
    const dark = $darkModeStore;
    const def = definition;
    if (!def) {
      svg = '';
      return;
    }

    let cancelled = false;
    const id = `langgraph-schema-${++renderSeq}`;

    (async () => {
      try {
        if (!mermaidApi) {
          mermaidApi = (await import('mermaid')).default as unknown as typeof mermaidApi;
        }
        mermaidApi!.initialize({
          startOnLoad: false,
          securityLevel: 'strict',
          theme: dark ? 'dark' : 'default',
          flowchart: { useMaxWidth: true, htmlLabels: false, curve: 'basis' },
        });
        const out = await mermaidApi!.render(id, def);
        if (!cancelled) {
          svg = out.svg;
          failed = false;
        }
      } catch {
        if (!cancelled) {
          svg = '';
          failed = true;
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  });
</script>

<div class="langgraph-schema" role="img" aria-label={label}>
  {#if svg}
    <!-- eslint-disable-next-line svelte/no-at-html-tags — definitions are static, trusted, and rendered by mermaid with securityLevel: 'strict' -->
    {@html svg}
  {:else if failed}
    <pre class="langgraph-fallback" aria-hidden="true">{definition}</pre>
  {:else}
    <div class="langgraph-loading" aria-hidden="true">Loading diagram…</div>
  {/if}
</div>

<style>
  .langgraph-schema {
    width: 100%;
    overflow-x: auto;
    padding: 1.25rem;
    background: var(--color-bg-secondary, #f8fafc);
    border: 1px solid var(--color-border, #e2e8f0);
    border-radius: var(--radius-lg, 12px);
  }

  .langgraph-schema :global(svg) {
    max-width: 100%;
    height: auto;
    display: block;
    margin: 0 auto;
  }

  .langgraph-loading {
    text-align: center;
    color: var(--color-text-tertiary, #64748b);
    font-size: 0.875rem;
    padding: 2rem 0;
  }

  .langgraph-fallback {
    margin: 0;
    font-size: 0.8125rem;
    line-height: 1.5;
    white-space: pre-wrap;
    color: var(--color-text-secondary, #475569);
  }

  :global(html.dark-mode-active) .langgraph-schema {
    background: var(--color-bg-secondary);
    border-color: var(--color-border);
  }
</style>
