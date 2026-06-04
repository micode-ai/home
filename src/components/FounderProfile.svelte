<script lang="ts">
  import { languageStore } from '../stores/languageStore';
  import { t } from '../services/i18n';

  const sectionTitle = $derived(t('founder.title', $languageStore));
  const founderName = $derived(t('founder.name', $languageStore));
  const experienceValue = $derived(t('founder.experienceValue', $languageStore));
  const careerHighlightsLabel = $derived(t('founder.careerHighlights', $languageStore));

  const linkedinUrl = 'https://www.linkedin.com/in/mikhailperaviortkin/';
  const upworkUrl = 'https://www.upwork.com/freelancers/~0111066307e26807ec?mp_source=share';

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

      <div class="founder-links">
        <a
          class="founder-link"
          href={linkedinUrl}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="LinkedIn — Mikhail Peraviortkin"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
          <span>LinkedIn</span>
        </a>
        <a
          class="founder-link"
          href={upworkUrl}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Upwork — Mikhail Peraviortkin"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M18.561 13.158c-1.102 0-2.135-.467-3.074-1.227l.228-1.076.008-.042c.207-1.143.849-3.06 2.839-3.06 1.492 0 2.703 1.212 2.703 2.703-.001 1.489-1.212 2.702-2.704 2.702zm0-8.14c-2.539 0-4.51 1.649-5.31 4.366-1.22-1.834-2.148-4.036-2.687-5.892H7.828v7.112c-.002 1.406-1.141 2.546-2.547 2.548-1.405-.002-2.543-1.143-2.545-2.548V3.492H0v7.112c0 2.914 2.37 5.303 5.281 5.303 2.913 0 5.283-2.389 5.283-5.303v-1.19c.529 1.107 1.182 2.229 1.974 3.221l-1.673 7.873h2.797l1.213-5.71c1.063.679 2.285 1.109 3.686 1.109 3 0 5.439-2.452 5.439-5.45 0-3-2.439-5.439-5.439-5.439z"/></svg>
          <span>Upwork</span>
        </a>
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

  .founder-links {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    gap: 0.75rem;
    margin-top: 1.5rem;
  }

  .founder-link {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.625rem 1.25rem;
    border-radius: var(--radius-full);
    background: #ffffff;
    color: var(--color-primary);
    text-decoration: none;
    font-size: 0.9375rem;
    font-weight: 600;
    line-height: 1;
    border: 1px solid transparent;
    transition: background 0.15s, color 0.15s, transform 0.15s, box-shadow 0.15s;
  }

  .founder-link:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 16px rgba(0, 0, 0, 0.18);
  }

  .founder-link:focus-visible {
    outline: 2px solid #ffffff;
    outline-offset: 3px;
  }

  .founder-link svg {
    flex-shrink: 0;
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

    .founder-link {
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

    .founder-link {
      border: 1px solid #000000;
      color: #000000;
      box-shadow: none;
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

    .founder-link {
      transition: none;
    }

    .founder-link:hover {
      transform: none;
    }
  }
</style>
