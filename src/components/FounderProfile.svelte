<script lang="ts">
  import { languageStore } from '../stores/languageStore';
  import { t } from '../services/i18n';

  const sectionTitle = $derived(t('founder.title', $languageStore));
  const founderName = $derived(t('founder.name', $languageStore));
  const experienceValue = $derived(t('founder.experienceValue', $languageStore));
  const careerHighlightsLabel = $derived(t('founder.careerHighlights', $languageStore));

  const highlights = $derived([
    {
      id: 'nokia',
      company: t('founder.highlights.nokia.company', $languageStore),
      duration: t('founder.highlights.nokia.duration', $languageStore),
      description: t('founder.highlights.nokia.description', $languageStore),
      technologies: ['ReactJS', 'Java']
    },
    {
      id: 'enterprise',
      company: t('founder.highlights.enterprise.company', $languageStore),
      duration: t('founder.highlights.enterprise.duration', $languageStore),
      description: t('founder.highlights.enterprise.description', $languageStore),
      technologies: ['Java', 'Oracle ADF', 'Spring', 'Angular']
    },
    {
      id: 'scm',
      company: t('founder.highlights.scm.company', $languageStore),
      duration: t('founder.highlights.scm.duration', $languageStore),
      description: t('founder.highlights.scm.description', $languageStore),
      technologies: ['Spring Boot 3.x', 'Java 17+', 'Oracle Database', 'Angular 17', 'TypeScript', 'PrimeNG']
    },
    {
      id: 'community',
      company: t('founder.highlights.community.company', $languageStore),
      duration: t('founder.highlights.community.duration', $languageStore),
      description: t('founder.highlights.community.description', $languageStore),
      technologies: ['Oracle ADF', 'Java EE', 'Blogging']
    }
  ]);
</script>

<section class="founder-profile scroll-reveal" aria-labelledby="founder-title">
  <div class="founder-container">
    <h2 id="founder-title" class="founder-title">{sectionTitle}</h2>

    <div class="founder-header">
      <h3 class="founder-name">{founderName}</h3>
      <div class="founder-experience">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <rect width="20" height="14" x="2" y="7" rx="2" ry="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/>
        </svg>
        <span class="experience-text">{experienceValue}</span>
      </div>
    </div>

    <div class="career-section">
      <h3 class="career-title">{careerHighlightsLabel}</h3>

      <div class="timeline">
        {#each highlights as highlight (highlight.id)}
          <article class="timeline-item">
            <div class="timeline-marker" aria-hidden="true"></div>
            <div class="timeline-content">
              <div class="timeline-header">
                <h4 class="timeline-company">{highlight.company}</h4>
                <span class="timeline-duration">{highlight.duration}</span>
              </div>
              <p class="timeline-description">{highlight.description}</p>
              <div class="technologies">
                {#each highlight.technologies as tech}
                  <span class="tech-badge">{tech}</span>
                {/each}
              </div>
            </div>
          </article>
        {/each}
      </div>
    </div>
  </div>
</section>

<style>
  .founder-profile {
    background: var(--color-bg-secondary);
    padding: 5rem 0;
  }

  .founder-container {
    max-width: var(--max-width-xl);
    margin: 0 auto;
    padding: 0 2rem;
  }

  .founder-title {
    margin: 0 0 2.5rem 0;
    font-family: var(--font-heading);
    font-size: 2rem;
    font-weight: 700;
    color: var(--color-text-primary);
    text-align: center;
    line-height: 1.2;
  }

  .founder-header {
    background: var(--color-primary);
    padding: 2rem 2.5rem;
    border-radius: var(--radius-2xl);
    margin-bottom: 3rem;
    text-align: center;
    color: #ffffff;
  }

  .founder-name {
    margin: 0 0 1rem 0;
    font-family: var(--font-heading);
    font-size: 1.75rem;
    font-weight: 700;
    line-height: 1.3;
    color: #ffffff;
  }

  .founder-experience {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    background: rgba(255, 255, 255, 0.15);
    padding: 0.625rem 1.25rem;
    border-radius: var(--radius-full);
  }

  .experience-text {
    font-size: 1rem;
    font-weight: 600;
    color: #ffffff;
    line-height: 1;
  }

  .career-section {
    margin-top: 2rem;
  }

  .career-title {
    margin: 0 0 2rem 0;
    font-family: var(--font-heading);
    font-size: 1.5rem;
    font-weight: 600;
    color: var(--color-text-primary);
    text-align: center;
    line-height: 1.3;
  }

  .timeline {
    position: relative;
    padding-left: 2rem;
  }

  .timeline::before {
    content: '';
    position: absolute;
    left: 0;
    top: 0;
    bottom: 0;
    width: 2px;
    background: linear-gradient(to bottom, var(--color-primary), var(--color-accent));
  }

  .timeline-item {
    position: relative;
    margin-bottom: 2rem;
    padding-left: 2rem;
  }

  .timeline-item:last-child {
    margin-bottom: 0;
  }

  .timeline-marker {
    position: absolute;
    left: -2rem;
    top: 0.25rem;
    transform: translateX(-50%);
    width: 14px;
    height: 14px;
    background: var(--color-primary);
    border: 3px solid var(--color-bg-secondary);
    border-radius: 50%;
    box-shadow: 0 0 0 3px var(--color-primary-light);
    z-index: 2;
  }

  .timeline-content {
    background: var(--color-bg-primary);
    padding: 1.5rem;
    border-radius: var(--radius-xl);
    border: 1px solid var(--color-border);
    box-shadow: var(--shadow-card);
    transition: box-shadow var(--transition-base);
  }

  .timeline-content:hover {
    box-shadow: var(--shadow-card-hover);
  }

  .timeline-header {
    display: flex;
    justify-content: space-between;
    align-items: baseline;
    margin-bottom: 0.75rem;
    flex-wrap: wrap;
    gap: 0.5rem;
  }

  .timeline-company {
    margin: 0;
    font-family: var(--font-heading);
    font-size: 1.125rem;
    font-weight: 600;
    color: var(--color-text-primary);
    line-height: 1.3;
  }

  .timeline-duration {
    font-size: 0.8125rem;
    font-weight: 500;
    color: var(--color-text-tertiary);
    white-space: nowrap;
  }

  .timeline-description {
    margin: 0 0 1rem 0;
    font-size: 0.9375rem;
    color: var(--color-text-secondary);
    line-height: 1.6;
  }

  .technologies {
    display: flex;
    flex-wrap: wrap;
    gap: 0.375rem;
  }

  .tech-badge {
    display: inline-block;
    padding: 0.25rem 0.625rem;
    background: var(--color-bg-tertiary);
    color: var(--color-primary);
    font-size: 0.8125rem;
    font-weight: 500;
    border-radius: var(--radius-full);
    line-height: 1.2;
  }

  @media (max-width: 767px) {
    .founder-profile {
      padding: 3rem 0;
    }

    .founder-container {
      padding: 0 1rem;
    }

    .founder-title {
      font-size: 1.5rem;
    }

    .founder-header {
      padding: 1.5rem;
    }

    .founder-name {
      font-size: 1.375rem;
    }

    .career-title {
      font-size: 1.25rem;
    }

    .timeline {
      padding-left: 1.5rem;
    }

    .timeline-item {
      padding-left: 1.5rem;
    }

    .timeline-marker {
      left: -1.5rem;
      width: 12px;
      height: 12px;
    }

    .timeline-content {
      padding: 1.25rem;
    }

    .timeline-header {
      flex-direction: column;
      gap: 0.25rem;
    }
  }

  @media (min-width: 768px) and (max-width: 1024px) {
    .founder-profile {
      padding: 4rem 0;
    }

    .founder-container {
      padding: 0 1.5rem;
    }
  }

  @media (prefers-color-scheme: dark) {
    .founder-header {
      background: var(--color-primary-dark);
    }

    .timeline-marker {
      border-color: var(--color-bg-primary);
    }

    .timeline-content {
      background: var(--color-bg-secondary);
      border-color: var(--color-border);
    }

    .tech-badge {
      background: var(--color-bg-tertiary);
      color: var(--color-primary);
    }
  }

  @media (prefers-contrast: high) {
    .founder-header {
      background: #000000;
      border: 2px solid #000000;
    }

    .timeline-content {
      border: 2px solid #000000;
      box-shadow: none;
    }

    .tech-badge {
      border: 1px solid #000000;
    }
  }

  @media print {
    .founder-profile {
      background: #ffffff;
      padding: 1rem 0;
    }

    .founder-header {
      background: #f0f0f0;
      border: 1px solid #000000;
      color: #000000;
    }

    .founder-name {
      color: #000000;
    }

    .experience-text {
      color: #000000;
    }

    .timeline-content {
      border: 1px solid #000000;
      box-shadow: none;
    }

    .timeline-content:hover {
      box-shadow: none;
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .timeline-content {
      transition: none;
    }
  }
</style>
