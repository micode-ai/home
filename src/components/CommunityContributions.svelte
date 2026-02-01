<script lang="ts">
  import { languageStore, type Language } from '../stores/languageStore';
  import { t } from '../services/i18n';

  // Subscribe to the language store
  let currentLanguage: Language;
  languageStore.subscribe(value => {
    currentLanguage = value;
  });

  // Reactive section title
  $: sectionTitle = t('community.title', currentLanguage);
  $: blogTitle = t('community.blog.title', currentLanguage);
  $: blogDescription = t('community.blog.description', currentLanguage);
  $: opensourceTitle = t('community.opensource.title', currentLanguage);
  $: opensourceDescription = t('community.opensource.description', currentLanguage);

  // Contribution data
  const contributions = [
    {
      id: 'blog',
      icon: '📝',
      titleKey: 'community.blog.title',
      descriptionKey: 'community.blog.description',
      stats: '400,000+',
      link: null
    },
    {
      id: 'opensource',
      icon: '💻',
      titleKey: 'community.opensource.title',
      descriptionKey: 'community.opensource.description',
      stats: null,
      link: 'https://www.npmjs.com/package/ngx-open-web-ui-chat'
    }
  ];
</script>

<section class="community scroll-reveal" aria-labelledby="community-title">
  <div class="community-container">
    <h2 id="community-title" class="community-title">{sectionTitle}</h2>
    
    <div class="contributions-grid">
      {#each contributions as contribution (contribution.id)}
        <article class="contribution-card">
          <div class="contribution-icon" aria-hidden="true">{contribution.icon}</div>
          <h3 class="contribution-title">{t(contribution.titleKey, currentLanguage)}</h3>
          {#if contribution.stats}
            <div class="contribution-stats">{contribution.stats}</div>
          {/if}
          <p class="contribution-description">{t(contribution.descriptionKey, currentLanguage)}</p>
          {#if contribution.link}
            <a 
              href={contribution.link} 
              class="contribution-link" 
              target="_blank" 
              rel="noopener noreferrer"
              aria-label="View {t(contribution.titleKey, currentLanguage)} on npm"
            >
              View on npm →
            </a>
          {/if}
        </article>
      {/each}
    </div>
  </div>
</section>

<style>
  .community {
    background: var(--gradient-section-alt);
    padding: 4rem 0;
    position: relative;
  }

  .community-container {
    max-width: 1200px;
    margin: 0 auto;
    padding: 0 2rem;
  }

  .community-title {
    margin: 0 0 3rem 0;
    font-size: 2rem;
    font-weight: 700;
    color: #2c3e50;
    text-align: center;
    line-height: 1.2;
  }

  .contributions-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 2rem;
    max-width: 900px;
    margin: 0 auto;
  }

  .contribution-card {
    background: var(--glass-bg-medium);
    backdrop-filter: blur(var(--glass-blur));
    -webkit-backdrop-filter: blur(var(--glass-blur));
    padding: 2rem;
    border-radius: var(--radius-glass);
    border: var(--glass-border);
    box-shadow: var(--glass-shadow);
    transition: transform 0.3s ease, box-shadow 0.3s ease, background 0.3s ease;
    text-align: center;
    display: flex;
    flex-direction: column;
    align-items: center;
  }

  .contribution-card:hover {
    transform: translateY(-4px) scale(1.01);
    box-shadow: var(--glass-shadow-hover);
    background: var(--glass-bg-strong);
  }

  .contribution-icon {
    font-size: 3rem;
    margin-bottom: 1rem;
    line-height: 1;
  }

  .contribution-title {
    margin: 0 0 0.5rem 0;
    font-size: 1.25rem;
    font-weight: 600;
    color: #2c3e50;
    line-height: 1.3;
  }

  .contribution-stats {
    margin: 0 0 1rem 0;
    font-size: 1.5rem;
    font-weight: 700;
    line-height: 1;
    background: linear-gradient(135deg, #667eea 0%, #e040fb 50%, #764ba2 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }

  .contribution-description {
    margin: 0 0 1.5rem 0;
    font-size: 1rem;
    color: #4a5568;
    line-height: 1.6;
    flex-grow: 1;
  }

  .contribution-link {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.75rem 1.5rem;
    background: var(--gradient-accent);
    color: #ffffff;
    text-decoration: none;
    border-radius: 50px;
    font-weight: 600;
    font-size: 0.9375rem;
    border: 1px solid rgba(255, 255, 255, 0.2);
    transition: all 0.3s ease;
    box-shadow: 0 4px 15px rgba(102, 126, 234, 0.3);
  }

  .contribution-link:hover {
    background: var(--gradient-accent-hover);
    transform: translateX(4px);
    box-shadow: 0 6px 20px rgba(102, 126, 234, 0.4);
  }

  .contribution-link:focus {
    outline: 2px solid rgba(102, 126, 234, 0.6);
    outline-offset: 2px;
  }

  /* Mobile styles (< 768px) - 1 column */
  @media (max-width: 767px) {
    .community {
      padding: 2.5rem 0;
    }

    .community-container {
      padding: 0 1rem;
    }

    .community-title {
      font-size: 1.5rem;
      margin-bottom: 2rem;
    }

    .contributions-grid {
      grid-template-columns: 1fr;
      gap: 1.5rem;
    }

    .contribution-card {
      padding: 1.5rem;
    }

    .contribution-icon {
      font-size: 2.5rem;
      margin-bottom: 0.75rem;
    }

    .contribution-title {
      font-size: 1.125rem;
      margin-bottom: 0.5rem;
    }

    .contribution-stats {
      font-size: 1.25rem;
      margin-bottom: 0.75rem;
    }

    .contribution-description {
      font-size: 0.9375rem;
      margin-bottom: 1rem;
    }

    .contribution-link {
      padding: 0.625rem 1.25rem;
      font-size: 0.875rem;
    }
  }

  /* Tablet styles (768px - 1024px) - 2 columns */
  @media (min-width: 768px) and (max-width: 1024px) {
    .community {
      padding: 3rem 0;
    }

    .community-container {
      padding: 0 1.5rem;
    }

    .community-title {
      font-size: 1.75rem;
      margin-bottom: 2.5rem;
    }

    .contributions-grid {
      grid-template-columns: repeat(2, 1fr);
      gap: 1.75rem;
    }

    .contribution-card {
      padding: 1.75rem;
    }

    .contribution-icon {
      font-size: 2.75rem;
      margin-bottom: 0.875rem;
    }

    .contribution-title {
      font-size: 1.1875rem;
      margin-bottom: 0.5rem;
    }

    .contribution-stats {
      font-size: 1.375rem;
      margin-bottom: 0.875rem;
    }

    .contribution-description {
      font-size: 0.96875rem;
      margin-bottom: 1.25rem;
    }

    .contribution-link {
      padding: 0.6875rem 1.375rem;
      font-size: 0.90625rem;
    }
  }

  /* Desktop styles (> 1024px) - 2 columns */
  @media (min-width: 1025px) {
    .community {
      padding: 4rem 0;
    }

    .community-container {
      padding: 0 2rem;
    }

    .community-title {
      font-size: 2rem;
      margin-bottom: 3rem;
    }

    .contributions-grid {
      grid-template-columns: repeat(2, 1fr);
      gap: 2rem;
    }

    .contribution-card {
      padding: 2rem;
    }

    .contribution-icon {
      font-size: 3rem;
      margin-bottom: 1rem;
    }

    .contribution-title {
      font-size: 1.25rem;
      margin-bottom: 0.5rem;
    }

    .contribution-stats {
      font-size: 1.5rem;
      margin-bottom: 1rem;
    }

    .contribution-description {
      font-size: 1rem;
      margin-bottom: 1.5rem;
    }

    .contribution-link {
      padding: 0.75rem 1.5rem;
      font-size: 0.9375rem;
    }
  }

  /* Dark mode support */
  @media (prefers-color-scheme: dark) {
    .community {
      background: var(--gradient-section-alt);
    }

    .community-title {
      color: #ffffff;
    }

    .contribution-card {
      background: var(--glass-bg);
      border: var(--glass-border);
      box-shadow: var(--glass-shadow);
    }

    .contribution-card:hover {
      box-shadow: var(--glass-shadow-hover);
      background: var(--glass-bg-medium);
    }

    .contribution-title {
      color: #ffffff;
    }

    .contribution-stats {
      background: linear-gradient(135deg, #93b5f5 0%, #c4a0e8 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
    }

    .contribution-description {
      color: rgba(255, 255, 255, 0.7);
    }
  }

  /* High contrast mode */
  @media (prefers-contrast: high) {
    .community {
      background-color: #ffffff;
    }

    .community-title {
      color: #000000;
      font-weight: 800;
    }

    .contribution-card {
      background-color: #ffffff;
      border: 2px solid #000000;
      box-shadow: none;
    }

    .contribution-title {
      color: #000000;
      font-weight: 700;
    }

    .contribution-stats {
      color: #000000;
      font-weight: 800;
    }

    .contribution-description {
      color: #000000;
      font-weight: 600;
    }

    .contribution-link {
      background-color: #000000;
      color: #ffffff;
      border: 2px solid #000000;
    }

    .contribution-link:hover {
      background-color: #ffffff;
      color: #000000;
    }
  }

  /* Print styles */
  @media print {
    .community {
      background-color: #ffffff;
      padding: 1rem 0;
      page-break-inside: avoid;
    }

    .community-title {
      color: #000000;
      font-size: 1.5rem;
      margin-bottom: 1rem;
    }

    .contributions-grid {
      grid-template-columns: repeat(2, 1fr);
      gap: 1rem;
    }

    .contribution-card {
      background-color: #ffffff;
      border: 1px solid #000000;
      box-shadow: none;
      padding: 1rem;
      page-break-inside: avoid;
    }

    .contribution-card:hover {
      transform: none;
      box-shadow: none;
    }

    .contribution-icon {
      font-size: 2rem;
      margin-bottom: 0.5rem;
    }

    .contribution-title {
      color: #000000;
      font-size: 1rem;
      margin-bottom: 0.25rem;
    }

    .contribution-stats {
      color: #000000;
      font-size: 1.125rem;
      margin-bottom: 0.5rem;
    }

    .contribution-description {
      color: #000000;
      font-size: 0.875rem;
      margin-bottom: 0.5rem;
    }

    .contribution-link {
      display: inline-block;
      background-color: #ffffff;
      color: #000000;
      border: 1px solid #000000;
      padding: 0.5rem 1rem;
      font-size: 0.875rem;
    }

    .contribution-link:hover {
      transform: none;
    }
  }

  /* Reduced motion support */
  @media (prefers-reduced-motion: reduce) {
    .contribution-card {
      transition: none;
    }

    .contribution-card:hover {
      transform: none;
    }

    .contribution-link {
      transition: none;
    }

    .contribution-link:hover {
      transform: none;
    }
  }
</style>
