<script lang="ts">
  import { languageStore, type Language } from '../stores/languageStore';
  import { t } from '../services/i18n';
  import LazyImage from './LazyImage.svelte';
  import OptimizedImage from './OptimizedImage.svelte';

  // Subscribe to the language store
  let currentLanguage: Language;
  languageStore.subscribe(value => {
    currentLanguage = value;
  });

  // Reactive translations
  $: sectionTitle = t('founder.title', currentLanguage);
  $: founderName = t('founder.name', currentLanguage);
  $: experienceLabel = t('founder.experience', currentLanguage);
  $: experienceValue = t('founder.experienceValue', currentLanguage);
  $: careerHighlightsLabel = t('founder.careerHighlights', currentLanguage);

  // Career highlights interface
  interface CareerHighlight {
    id: string;
    company: string;
    duration: string;
    description: string;
    technologies: string[];
  }

  // Load career highlights from translations
  $: highlights = [
    {
      id: 'nokia',
      company: t('founder.highlights.nokia.company', currentLanguage),
      duration: t('founder.highlights.nokia.duration', currentLanguage),
      description: t('founder.highlights.nokia.description', currentLanguage),
      technologies: ['ReactJS', 'Java']
    },
    {
      id: 'enterprise',
      company: t('founder.highlights.enterprise.company', currentLanguage),
      duration: t('founder.highlights.enterprise.duration', currentLanguage),
      description: t('founder.highlights.enterprise.description', currentLanguage),
      technologies: ['Java', 'Oracle ADF', 'Spring', 'Angular']
    },
    {
      id: 'scm',
      company: t('founder.highlights.scm.company', currentLanguage),
      duration: t('founder.highlights.scm.duration', currentLanguage),
      description: t('founder.highlights.scm.description', currentLanguage),
      technologies: ['Spring Boot 3.x', 'Java 17+', 'Oracle Database', 'Angular 17', 'TypeScript', 'PrimeNG']
    },
    {
      id: 'community',
      company: t('founder.highlights.community.company', currentLanguage),
      duration: t('founder.highlights.community.duration', currentLanguage),
      description: t('founder.highlights.community.description', currentLanguage),
      technologies: ['Oracle ADF', 'Java EE', 'Blogging']
    }
  ];
</script>

<section class="founder-profile scroll-reveal" aria-labelledby="founder-title">
  <div class="founder-container">
    <h2 id="founder-title" class="founder-title">{sectionTitle}</h2>
    
    <div class="founder-header">
      <h3 class="founder-name">{founderName}</h3>
      <div class="founder-experience">
        <span class="experience-icon" aria-hidden="true">💼</span>
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
    background: var(--gradient-section-light);
    padding: 4rem 0;
  }

  .founder-container {
    max-width: 1200px;
    margin: 0 auto;
    padding: 0 2rem;
  }

  .founder-title {
    margin: 0 0 2.5rem 0;
    font-size: 2rem;
    font-weight: 700;
    color: #2c3e50;
    text-align: center;
    line-height: 1.2;
  }

  .founder-header {
    background: var(--glass-bg);
    backdrop-filter: blur(var(--glass-blur-strong));
    -webkit-backdrop-filter: blur(var(--glass-blur-strong));
    padding: 2rem 2.5rem;
    border-radius: var(--radius-glass-lg);
    border: var(--glass-border-strong);
    box-shadow: var(--glass-shadow-elevated);
    margin-bottom: 3rem;
    text-align: center;
    position: relative;
    overflow: hidden;
  }

  .founder-header::before {
    content: '';
    position: absolute;
    inset: 0;
    background: linear-gradient(135deg, rgba(102, 126, 234, 0.3) 0%, rgba(118, 75, 162, 0.3) 100%);
    z-index: 0;
  }

  .founder-name {
    margin: 0 0 1rem 0;
    font-size: 2rem;
    font-weight: 700;
    color: #ffffff;
    line-height: 1.3;
    position: relative;
    z-index: 1;
  }

  .founder-experience {
    display: inline-flex;
    align-items: center;
    gap: 0.75rem;
    background-color: rgba(255, 255, 255, 0.2);
    padding: 0.75rem 1.5rem;
    border-radius: 50px;
    backdrop-filter: blur(10px);
    position: relative;
    z-index: 1;
  }

  .experience-icon {
    font-size: 1.5rem;
    line-height: 1;
  }

  .experience-text {
    font-size: 1.125rem;
    font-weight: 600;
    color: #ffffff;
    line-height: 1;
  }

  .career-section {
    margin-top: 3rem;
  }

  .career-title {
    margin: 0 0 2rem 0;
    font-size: 1.5rem;
    font-weight: 600;
    color: #2c3e50;
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
    background: linear-gradient(to bottom, #3498db, #2ecc71);
  }

  .timeline-item {
    position: relative;
    margin-bottom: 2.5rem;
    padding-left: 2rem;
  }

  .timeline-item:last-child {
    margin-bottom: 0;
  }

  .timeline-marker {
    position: absolute;
    left: -2rem;
    top: 0;
    transform: translateX(-50%);
    width: 20px;
    height: 20px;
    background: linear-gradient(135deg, #3498db 0%, #2ecc71 100%);
    border: 4px solid #ffffff;
    border-radius: 50%;
    box-shadow: 
      0 0 0 4px rgba(52, 152, 219, 0.15),
      0 4px 8px rgba(52, 152, 219, 0.3),
      inset 0 2px 4px rgba(255, 255, 255, 0.3);
    transition: all 0.3s ease;
    z-index: 2;
  }

  .timeline-marker::before {
    content: '';
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: 8px;
    height: 8px;
    background: rgba(255, 255, 255, 0.9);
    border-radius: 50%;
    opacity: 0;
    transition: opacity 0.3s ease;
  }

  .timeline-item:hover .timeline-marker {
    transform: translateX(-50%) scale(1.2);
    box-shadow: 
      0 0 0 6px rgba(52, 152, 219, 0.2),
      0 6px 12px rgba(52, 152, 219, 0.4),
      inset 0 2px 4px rgba(255, 255, 255, 0.4);
  }

  .timeline-item:hover .timeline-marker::before {
    opacity: 1;
  }

  .timeline-content {
    background: var(--glass-bg-medium);
    backdrop-filter: blur(var(--glass-blur));
    -webkit-backdrop-filter: blur(var(--glass-blur));
    padding: 1.5rem;
    border-radius: var(--radius-glass);
    border: var(--glass-border);
    box-shadow: var(--glass-shadow);
    transition: transform 0.2s ease, box-shadow 0.2s ease;
  }

  .timeline-content:hover {
    transform: translateX(4px);
    box-shadow: var(--glass-shadow-hover);
    background: var(--glass-bg-strong);
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
    font-size: 1.25rem;
    font-weight: 600;
    color: #2c3e50;
    line-height: 1.3;
  }

  .timeline-duration {
    font-size: 0.875rem;
    font-weight: 500;
    color: #7f8c8d;
    white-space: nowrap;
  }

  .timeline-description {
    margin: 0 0 1rem 0;
    font-size: 1rem;
    color: #4a5568;
    line-height: 1.6;
  }

  .technologies {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
  }

  .tech-badge {
    display: inline-block;
    padding: 0.375rem 0.75rem;
    background: rgba(102, 126, 234, 0.12);
    color: #4a6cf7;
    font-size: 0.875rem;
    font-weight: 500;
    border-radius: 16px;
    line-height: 1;
    border: 1px solid rgba(102, 126, 234, 0.2);
  }

  /* Mobile styles (< 768px) */
  @media (max-width: 767px) {
    .founder-profile {
      padding: 2.5rem 0;
    }

    .founder-container {
      padding: 0 1rem;
    }

    .founder-title {
      font-size: 1.5rem;
      margin-bottom: 2rem;
    }

    .founder-header {
      padding: 1.5rem;
      margin-bottom: 2rem;
      position: relative;
      overflow: hidden;
    }

    .founder-name {
      font-size: 1.5rem;
      margin-bottom: 0.875rem;
    }

    .founder-experience {
      gap: 0.5rem;
      padding: 0.625rem 1.25rem;
    }

    .experience-icon {
      font-size: 1.25rem;
    }

    .experience-text {
      font-size: 1rem;
    }

    .career-section {
      margin-top: 2rem;
    }

    .career-title {
      font-size: 1.25rem;
      margin-bottom: 1.5rem;
    }

    .timeline {
      padding-left: 1.5rem;
    }

    .timeline-item {
      margin-bottom: 2rem;
      padding-left: 1.5rem;
    }

    .timeline-marker {
      left: -1.5rem;
      top: 0;
      transform: translateX(-50%);
      width: 16px;
      height: 16px;
      border-width: 3px;
      box-shadow: 
        0 0 0 3px rgba(52, 152, 219, 0.15),
        0 3px 6px rgba(52, 152, 219, 0.3),
        inset 0 1px 3px rgba(255, 255, 255, 0.3);
    }

    .timeline-marker::before {
      width: 6px;
      height: 6px;
    }

    .timeline-item:hover .timeline-marker {
      transform: translateX(-50%) scale(1.2);
      box-shadow: 
        0 0 0 5px rgba(52, 152, 219, 0.2),
        0 5px 10px rgba(52, 152, 219, 0.4),
        inset 0 1px 3px rgba(255, 255, 255, 0.4);
    }

    .timeline-content {
      padding: 1.25rem;
    }

    .timeline-header {
      flex-direction: column;
      align-items: flex-start;
      gap: 0.25rem;
    }

    .timeline-company {
      font-size: 1.125rem;
    }

    .timeline-duration {
      font-size: 0.8125rem;
    }

    .timeline-description {
      font-size: 0.9375rem;
      margin-bottom: 0.875rem;
    }

    .tech-badge {
      font-size: 0.8125rem;
      padding: 0.3125rem 0.625rem;
    }
  }

  /* Tablet styles (768px - 1024px) */
  @media (min-width: 768px) and (max-width: 1024px) {
    .founder-profile {
      padding: 3rem 0;
    }

    .founder-container {
      padding: 0 1.5rem;
    }

    .founder-title {
      font-size: 1.75rem;
      margin-bottom: 2.25rem;
    }

    .founder-header {
      padding: 1.75rem 2rem;
      margin-bottom: 2.5rem;
      position: relative;
      overflow: hidden;
    }

    .founder-name {
      font-size: 1.75rem;
      margin-bottom: 0.9375rem;
    }

    .founder-experience {
      gap: 0.625rem;
      padding: 0.6875rem 1.375rem;
    }

    .experience-icon {
      font-size: 1.375rem;
    }

    .experience-text {
      font-size: 1.0625rem;
    }

    .career-section {
      margin-top: 2.5rem;
    }

    .career-title {
      font-size: 1.375rem;
      margin-bottom: 1.75rem;
    }

    .timeline {
      padding-left: 1.75rem;
    }

    .timeline-item {
      margin-bottom: 2.25rem;
      padding-left: 1.75rem;
    }

    .timeline-marker {
      left: -1.75rem;
      top: 0;
      transform: translateX(-50%);
      width: 18px;
      height: 18px;
      box-shadow: 
        0 0 0 3.5px rgba(52, 152, 219, 0.15),
        0 3.5px 7px rgba(52, 152, 219, 0.3),
        inset 0 1.5px 3.5px rgba(255, 255, 255, 0.3);
    }

    .timeline-marker::before {
      width: 7px;
      height: 7px;
    }

    .timeline-item:hover .timeline-marker {
      transform: translateX(-50%) scale(1.2);
      box-shadow: 
        0 0 0 5.5px rgba(52, 152, 219, 0.2),
        0 5.5px 11px rgba(52, 152, 219, 0.4),
        inset 0 1.5px 3.5px rgba(255, 255, 255, 0.4);
    }

    .timeline-content {
      padding: 1.375rem;
    }

    .timeline-company {
      font-size: 1.1875rem;
    }

    .timeline-duration {
      font-size: 0.85rem;
    }

    .timeline-description {
      font-size: 0.96875rem;
    }

    .tech-badge {
      font-size: 0.85rem;
      padding: 0.34375rem 0.6875rem;
    }
  }

  /* Desktop styles (> 1024px) */
  @media (min-width: 1025px) {
    .founder-profile {
      padding: 4rem 0;
    }

    .founder-container {
      padding: 0 2rem;
    }

    .founder-title {
      font-size: 2rem;
      margin-bottom: 2.5rem;
    }

    .founder-header {
      padding: 2rem;
      margin-bottom: 3rem;
    }

    .founder-name {
      font-size: 1.75rem;
      margin-bottom: 1.5rem;
    }

    .founder-details {
      gap: 1.25rem;
    }

    .detail-item {
      padding: 1rem;
    }

    .detail-label {
      font-size: 0.875rem;
    }

    .detail-value {
      font-size: 1rem;
    }

    .experience-highlight {
      font-size: 1.125rem;
    }

    .career-section {
      margin-top: 3rem;
    }

    .career-title {
      font-size: 1.5rem;
      margin-bottom: 2rem;
    }

    .timeline {
      padding-left: 2rem;
    }

    .timeline-item {
      margin-bottom: 2.5rem;
      padding-left: 2rem;
    }

    .timeline-marker {
      left: -2rem;
      top: 0;
      transform: translateX(-50%);
      width: 20px;
      height: 20px;
      box-shadow: 
        0 0 0 4px rgba(52, 152, 219, 0.15),
        0 4px 8px rgba(52, 152, 219, 0.3),
        inset 0 2px 4px rgba(255, 255, 255, 0.3);
    }

    .timeline-marker::before {
      width: 8px;
      height: 8px;
    }

    .timeline-item:hover .timeline-marker {
      transform: translateX(-50%) scale(1.2);
      box-shadow: 
        0 0 0 6px rgba(52, 152, 219, 0.2),
        0 6px 12px rgba(52, 152, 219, 0.4),
        inset 0 2px 4px rgba(255, 255, 255, 0.4);
    }

    .timeline-content {
      padding: 1.5rem;
    }

    .timeline-company {
      font-size: 1.25rem;
    }

    .timeline-duration {
      font-size: 0.875rem;
    }

    .timeline-description {
      font-size: 1rem;
    }

    .tech-badge {
      font-size: 0.875rem;
      padding: 0.375rem 0.75rem;
    }
  }

  /* Dark mode support */
  @media (prefers-color-scheme: dark) {
    .founder-profile {
      background: var(--gradient-section-light);
    }

    .founder-title {
      color: #ffffff;
    }

    .founder-header {
      background: var(--glass-bg);
      backdrop-filter: blur(var(--glass-blur-strong));
      -webkit-backdrop-filter: blur(var(--glass-blur-strong));
      border: var(--glass-border-strong);
      box-shadow: var(--glass-shadow-elevated);
    }

    .founder-header::before {
      background: linear-gradient(135deg, rgba(102, 126, 234, 0.2) 0%, rgba(118, 75, 162, 0.2) 100%);
    }

    .founder-experience {
      background-color: rgba(255, 255, 255, 0.15);
    }

    .career-title {
      color: #ffffff;
    }

    .timeline::before {
      background: linear-gradient(to bottom, #5dade2, #52c77a);
    }

    .timeline-marker {
      background: linear-gradient(135deg, #5dade2 0%, #52c77a 100%);
      border-color: #2c2c2c;
      box-shadow:
        0 0 0 4px rgba(93, 173, 226, 0.15),
        0 4px 8px rgba(93, 173, 226, 0.3),
        inset 0 2px 4px rgba(255, 255, 255, 0.2);
    }

    .timeline-item:hover .timeline-marker {
      box-shadow:
        0 0 0 6px rgba(93, 173, 226, 0.2),
        0 6px 12px rgba(93, 173, 226, 0.4),
        inset 0 2px 4px rgba(255, 255, 255, 0.3);
    }

    .timeline-content {
      background: var(--glass-bg);
      border: var(--glass-border);
      box-shadow: var(--glass-shadow);
    }

    .timeline-content:hover {
      box-shadow: var(--glass-shadow-hover);
      background: var(--glass-bg-strong);
    }

    .timeline-company {
      color: #ffffff;
    }

    .timeline-duration {
      color: rgba(255, 255, 255, 0.5);
    }

    .timeline-description {
      color: rgba(255, 255, 255, 0.7);
    }

    .tech-badge {
      background: rgba(102, 126, 234, 0.15);
      color: #93b5f5;
      border-color: rgba(102, 126, 234, 0.25);
    }
  }

  /* High contrast mode */
  @media (prefers-contrast: high) {
    .founder-profile {
      background-color: #ffffff;
    }

    .founder-title {
      color: #000000;
      font-weight: 800;
    }

    .founder-header {
      background: #000000;
      border: 2px solid #000000;
      box-shadow: none;
    }

    .founder-name {
      color: #ffffff;
      font-weight: 800;
    }

    .founder-experience {
      background-color: rgba(255, 255, 255, 0.3);
      border: 2px solid #ffffff;
    }

    .experience-text {
      color: #ffffff;
      font-weight: 700;
    }

    .career-title {
      color: #000000;
      font-weight: 700;
    }

    .timeline::before {
      background: #000000;
    }

    .timeline-marker {
      background: #000000;
      border-color: #ffffff;
      border-width: 3px;
      box-shadow: 
        0 0 0 2px #000000,
        0 0 0 4px #ffffff;
    }

    .timeline-marker::before {
      background: #ffffff;
      opacity: 1;
    }

    .timeline-item:hover .timeline-marker {
      transform: translateY(-50%) scale(1.15);
      box-shadow: 
        0 0 0 3px #000000,
        0 0 0 6px #ffffff;
    }

    .timeline-content {
      background-color: #ffffff;
      border: 2px solid #000000;
      box-shadow: none;
    }

    .timeline-company {
      color: #000000;
      font-weight: 700;
    }

    .timeline-duration {
      color: #000000;
      font-weight: 600;
    }

    .timeline-description {
      color: #000000;
      font-weight: 600;
    }

    .tech-badge {
      background-color: #ffffff;
      color: #000000;
      border: 1px solid #000000;
      font-weight: 600;
    }
  }

  /* Print styles */
  @media print {
    .founder-profile {
      background-color: #ffffff;
      padding: 1rem 0;
      page-break-inside: avoid;
    }

    .founder-title {
      color: #000000;
      font-size: 1.5rem;
      margin-bottom: 1rem;
    }

    .founder-header {
      background: #f0f0f0;
      border: 1px solid #000000;
      box-shadow: none;
      padding: 1rem;
      margin-bottom: 1.5rem;
      page-break-inside: avoid;
    }

    .founder-name {
      color: #000000;
      font-size: 1.25rem;
      margin-bottom: 0.5rem;
    }

    .founder-experience {
      background-color: transparent;
      border: 1px solid #000000;
      padding: 0.5rem 1rem;
    }

    .experience-icon {
      display: none;
    }

    .experience-text {
      color: #000000;
      font-size: 1rem;
    }

    .career-section {
      margin-top: 1.5rem;
    }

    .career-title {
      color: #000000;
      font-size: 1.25rem;
      margin-bottom: 1rem;
    }

    .timeline {
      padding-left: 1.5rem;
    }

    .timeline::before {
      background: #000000;
    }

    .timeline-item {
      margin-bottom: 1rem;
      padding-left: 1.5rem;
      page-break-inside: avoid;
    }

    .timeline-marker {
      background: #000000;
      border-color: #ffffff;
      border-width: 2px;
      box-shadow: none;
      width: 14px;
      height: 14px;
    }

    .timeline-marker::before {
      display: none;
    }

    .timeline-content {
      background-color: #ffffff;
      border: 1px solid #000000;
      box-shadow: none;
      padding: 0.75rem;
    }

    .timeline-content:hover {
      transform: none;
      box-shadow: none;
    }

    .timeline-company {
      color: #000000;
      font-size: 1rem;
    }

    .timeline-duration {
      color: #000000;
      font-size: 0.75rem;
    }

    .timeline-description {
      color: #000000;
      font-size: 0.875rem;
      margin-bottom: 0.5rem;
    }

    .tech-badge {
      background-color: #ffffff;
      color: #000000;
      border: 1px solid #000000;
      font-size: 0.75rem;
      padding: 0.25rem 0.5rem;
    }
  }

  /* Reduced motion support */
  @media (prefers-reduced-motion: reduce) {
    .timeline-content {
      transition: none;
    }

    .timeline-content:hover {
      transform: none;
    }

    .timeline-marker {
      transition: none;
    }

    .timeline-item:hover .timeline-marker {
      transform: translateX(-50%);
    }

    .timeline-marker::before {
      transition: none;
    }
  }
</style>
