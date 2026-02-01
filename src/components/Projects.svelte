<script lang="ts">
  import { languageStore, type Language } from '../stores/languageStore';
  import { t } from '../services/i18n';
  import projectsData from '../data/projects.json';

  // Subscribe to the language store
  let currentLanguage: Language;
  languageStore.subscribe(value => {
    currentLanguage = value;
  });

  // Reactive section title
  $: sectionTitle = t('projects.title', currentLanguage);

  // Project interface
  interface Project {
    id: string;
    nameKey: string;
    descriptionKey: string;
    technologies?: string[];
    projects?: string[];
    features?: string[];
  }

  // Load projects
  const projects: Project[] = projectsData;
</script>

<section class="projects" aria-labelledby="projects-title">
  <div class="projects-container">
    <h2 id="projects-title" class="projects-title">{sectionTitle}</h2>
    
    <div class="projects-grid">
      {#each projects as project (project.id)}
        <article class="project-card">
          <h3 class="project-name">{t(project.nameKey, currentLanguage)}</h3>
          <p class="project-description">{t(project.descriptionKey, currentLanguage)}</p>
          
          {#if project.technologies && project.technologies.length > 0}
            <div class="technologies">
              <h4 class="technologies-label">Technologies:</h4>
              <div class="tech-tags">
                {#each project.technologies as tech}
                  <span class="tech-tag">{tech}</span>
                {/each}
              </div>
            </div>
          {/if}
          
          {#if project.projects && project.projects.length > 0}
            <div class="project-list">
              <h4 class="project-list-label">Projects:</h4>
              <ul class="project-items">
                {#each project.projects as item}
                  <li class="project-item">{item}</li>
                {/each}
              </ul>
            </div>
          {/if}
          
          {#if project.features && project.features.length > 0}
            <div class="features">
              <h4 class="features-label">Features:</h4>
              <ul class="feature-list">
                {#each project.features as feature}
                  <li class="feature-item">{feature}</li>
                {/each}
              </ul>
            </div>
          {/if}
        </article>
      {/each}
    </div>
  </div>
</section>

<style>
  .projects {
    background: var(--gradient-section-alt);
    padding: 4rem 0;
    position: relative;
  }

  .projects-container {
    max-width: 1200px;
    margin: 0 auto;
    padding: 0 2rem;
  }

  .projects-title {
    margin: 0 0 3rem 0;
    font-size: 2rem;
    font-weight: 700;
    color: #2c3e50;
    text-align: center;
    line-height: 1.2;
  }

  .projects-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 2rem;
  }

  .project-card {
    background: var(--glass-bg-medium);
    backdrop-filter: blur(var(--glass-blur));
    -webkit-backdrop-filter: blur(var(--glass-blur));
    padding: 2rem;
    border-radius: var(--radius-glass);
    border: var(--glass-border);
    box-shadow: var(--glass-shadow);
    transition: transform 0.3s ease, box-shadow 0.3s ease;
  }

  .project-card:hover {
    transform: translateY(-4px) scale(1.01);
    box-shadow: var(--glass-shadow-hover);
    background: var(--glass-bg-strong);
  }

  .project-name {
    margin: 0 0 1rem 0;
    font-size: 1.5rem;
    font-weight: 600;
    line-height: 1.3;
    background: var(--gradient-accent);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }

  .project-description {
    margin: 0 0 1.5rem 0;
    font-size: 1rem;
    color: #4a5568;
    line-height: 1.6;
  }

  .technologies,
  .project-list,
  .features {
    margin-top: 1.5rem;
  }

  .technologies-label,
  .project-list-label,
  .features-label {
    margin: 0 0 0.75rem 0;
    font-size: 0.875rem;
    font-weight: 600;
    color: #7f8c8d;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  .tech-tags {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
  }

  .tech-tag {
    display: inline-block;
    padding: 0.5rem 1rem;
    background: rgba(102, 126, 234, 0.12);
    color: #4a6cf7;
    font-size: 0.875rem;
    font-weight: 500;
    border-radius: 20px;
    line-height: 1;
    border: 1px solid rgba(102, 126, 234, 0.2);
  }

  .project-items,
  .feature-list {
    margin: 0;
    padding-left: 1.5rem;
    list-style-type: disc;
  }

  .project-item,
  .feature-item {
    margin-bottom: 0.5rem;
    font-size: 0.9375rem;
    color: #4a5568;
    line-height: 1.5;
  }

  .project-item:last-child,
  .feature-item:last-child {
    margin-bottom: 0;
  }

  /* Mobile styles (< 768px) */
  @media (max-width: 767px) {
    .projects {
      padding: 2.5rem 0;
    }

    .projects-container {
      padding: 0 1rem;
    }

    .projects-title {
      font-size: 1.5rem;
      margin-bottom: 2rem;
    }

    .projects-grid {
      grid-template-columns: 1fr;
      gap: 1.5rem;
    }

    .project-card {
      padding: 1.5rem;
    }

    .project-name {
      font-size: 1.25rem;
      margin-bottom: 0.875rem;
    }

    .project-description {
      font-size: 0.9375rem;
      margin-bottom: 1.25rem;
    }

    .technologies,
    .project-list,
    .features {
      margin-top: 1.25rem;
    }

    .technologies-label,
    .project-list-label,
    .features-label {
      font-size: 0.8125rem;
      margin-bottom: 0.625rem;
    }

    .tech-tag {
      font-size: 0.8125rem;
      padding: 0.4375rem 0.875rem;
    }

    .project-items,
    .feature-list {
      padding-left: 1.25rem;
    }

    .project-item,
    .feature-item {
      font-size: 0.875rem;
      margin-bottom: 0.4375rem;
    }
  }

  /* Tablet styles (768px - 1024px) */
  @media (min-width: 768px) and (max-width: 1024px) {
    .projects {
      padding: 3rem 0;
    }

    .projects-container {
      padding: 0 1.5rem;
    }

    .projects-title {
      font-size: 1.75rem;
      margin-bottom: 2.5rem;
    }

    .projects-grid {
      gap: 1.75rem;
    }

    .project-card {
      padding: 1.75rem;
    }

    .project-name {
      font-size: 1.375rem;
      margin-bottom: 0.9375rem;
    }

    .project-description {
      font-size: 0.96875rem;
      margin-bottom: 1.375rem;
    }

    .technologies,
    .project-list,
    .features {
      margin-top: 1.375rem;
    }

    .technologies-label,
    .project-list-label,
    .features-label {
      font-size: 0.85rem;
      margin-bottom: 0.6875rem;
    }

    .tech-tag {
      font-size: 0.85rem;
      padding: 0.46875rem 0.9375rem;
    }

    .project-items,
    .feature-list {
      padding-left: 1.375rem;
    }

    .project-item,
    .feature-item {
      font-size: 0.90625rem;
      margin-bottom: 0.46875rem;
    }
  }

  /* Desktop styles (> 1024px) */
  @media (min-width: 1025px) {
    .projects {
      padding: 4rem 0;
    }

    .projects-container {
      padding: 0 2rem;
    }

    .projects-title {
      font-size: 2rem;
      margin-bottom: 3rem;
    }

    .projects-grid {
      gap: 2rem;
    }

    .project-card {
      padding: 2rem;
    }

    .project-name {
      font-size: 1.5rem;
      margin-bottom: 1rem;
    }

    .project-description {
      font-size: 1rem;
      margin-bottom: 1.5rem;
    }

    .technologies,
    .project-list,
    .features {
      margin-top: 1.5rem;
    }

    .technologies-label,
    .project-list-label,
    .features-label {
      font-size: 0.875rem;
      margin-bottom: 0.75rem;
    }

    .tech-tag {
      font-size: 0.875rem;
      padding: 0.5rem 1rem;
    }

    .project-items,
    .feature-list {
      padding-left: 1.5rem;
    }

    .project-item,
    .feature-item {
      font-size: 0.9375rem;
      margin-bottom: 0.5rem;
    }
  }

  /* Dark mode support */
  @media (prefers-color-scheme: dark) {
    .projects {
      background: var(--gradient-section-alt);
    }

    .projects-title {
      color: #ffffff;
    }

    .project-card {
      background: var(--glass-bg);
      border: var(--glass-border);
      box-shadow: var(--glass-shadow);
    }

    .project-card:hover {
      box-shadow: var(--glass-shadow-hover);
      background: var(--glass-bg-medium);
    }

    .project-name {
      background: linear-gradient(135deg, #93b5f5 0%, #c4a0e8 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
    }

    .project-description {
      color: rgba(255, 255, 255, 0.7);
    }

    .technologies-label,
    .project-list-label,
    .features-label {
      color: rgba(255, 255, 255, 0.5);
    }

    .tech-tag {
      background: rgba(102, 126, 234, 0.15);
      color: #93b5f5;
      border-color: rgba(102, 126, 234, 0.25);
    }

    .project-item,
    .feature-item {
      color: rgba(255, 255, 255, 0.7);
    }
  }

  /* High contrast mode */
  @media (prefers-contrast: high) {
    .projects {
      background-color: #ffffff;
    }

    .projects-title {
      color: #000000;
      font-weight: 800;
    }

    .project-card {
      background-color: #ffffff;
      border: 2px solid #000000;
      box-shadow: none;
    }

    .project-name {
      color: #000000;
      font-weight: 700;
    }

    .project-description {
      color: #000000;
      font-weight: 600;
    }

    .technologies-label,
    .project-list-label,
    .features-label {
      color: #000000;
      font-weight: 700;
    }

    .tech-tag {
      background-color: #ffffff;
      color: #000000;
      border: 1px solid #000000;
      font-weight: 600;
    }

    .project-item,
    .feature-item {
      color: #000000;
      font-weight: 600;
    }
  }

  /* Print styles */
  @media print {
    .projects {
      background-color: #ffffff;
      padding: 1rem 0;
      page-break-inside: avoid;
    }

    .projects-title {
      color: #000000;
      font-size: 1.5rem;
      margin-bottom: 1rem;
    }

    .projects-grid {
      gap: 1rem;
    }

    .project-card {
      background-color: #ffffff;
      border: 1px solid #000000;
      box-shadow: none;
      padding: 1rem;
      page-break-inside: avoid;
    }

    .project-card:hover {
      transform: none;
      box-shadow: none;
    }

    .project-name {
      color: #000000;
      font-size: 1.25rem;
      margin-bottom: 0.5rem;
    }

    .project-description {
      color: #000000;
      font-size: 0.875rem;
      margin-bottom: 0.75rem;
    }

    .technologies,
    .project-list,
    .features {
      margin-top: 0.75rem;
    }

    .technologies-label,
    .project-list-label,
    .features-label {
      color: #000000;
      font-size: 0.75rem;
      margin-bottom: 0.375rem;
    }

    .tech-tag {
      background-color: #ffffff;
      color: #000000;
      border: 1px solid #000000;
      font-size: 0.75rem;
      padding: 0.25rem 0.5rem;
    }

    .project-items,
    .feature-list {
      padding-left: 1rem;
    }

    .project-item,
    .feature-item {
      color: #000000;
      font-size: 0.8125rem;
      margin-bottom: 0.25rem;
    }
  }

  /* Reduced motion support */
  @media (prefers-reduced-motion: reduce) {
    .project-card {
      transition: none;
    }

    .project-card:hover {
      transform: none;
    }
  }
</style>
