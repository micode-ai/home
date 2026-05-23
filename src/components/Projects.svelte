<script lang="ts">
  import { languageStore } from '../stores/languageStore';
  import { t } from '../services/i18n';
  import projectsData from '../data/projects.json';

  const sectionTitle = $derived(t('projects.title', $languageStore));

  interface Project {
    id: string;
    nameKey: string;
    descriptionKey: string;
    technologies?: string[];
    projects?: string[];
    features?: string[];
  }

  const projects: Project[] = projectsData;
</script>

<section class="projects scroll-reveal" aria-labelledby="projects-title">
  <div class="projects-container">
    <h2 id="projects-title" class="projects-title">{sectionTitle}</h2>

    <div class="projects-grid">
      {#each projects as project (project.id)}
        <article class="project-card">
          <h3 class="project-name">{t(project.nameKey, $languageStore)}</h3>
          <p class="project-description">{t(project.descriptionKey, $languageStore)}</p>

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
    background: var(--color-bg-secondary);
    padding: 5rem 0;
  }

  .projects-container {
    max-width: var(--max-width-xl);
    margin: 0 auto;
    padding: 0 2rem;
  }

  .projects-title {
    margin: 0 0 3rem 0;
    font-family: var(--font-heading);
    font-size: 2rem;
    font-weight: 700;
    color: var(--color-text-primary);
    text-align: center;
    line-height: 1.2;
  }

  .projects-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 2rem;
  }

  .project-card {
    background: var(--color-bg-primary);
    padding: 2rem;
    border-radius: var(--radius-xl);
    border: 1px solid var(--color-border);
    box-shadow: var(--shadow-card);
    transition: transform var(--transition-base), box-shadow var(--transition-base);
  }

  .project-card:hover {
    transform: translateY(-4px);
    box-shadow: var(--shadow-card-hover);
  }

  .project-name {
    margin: 0 0 1rem 0;
    font-family: var(--font-heading);
    font-size: 1.5rem;
    font-weight: 600;
    line-height: 1.3;
    color: var(--color-primary);
  }

  .project-description {
    margin: 0 0 1.5rem 0;
    font-size: 1rem;
    color: var(--color-text-secondary);
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
    font-size: 0.75rem;
    font-weight: 600;
    color: var(--color-text-tertiary);
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  .tech-tags {
    display: flex;
    flex-wrap: wrap;
    gap: 0.375rem;
  }

  .tech-tag {
    display: inline-block;
    padding: 0.25rem 0.625rem;
    background: var(--color-bg-tertiary);
    color: var(--color-primary);
    font-size: 0.8125rem;
    font-weight: 500;
    border-radius: var(--radius-full);
    line-height: 1.2;
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
    color: var(--color-text-secondary);
    line-height: 1.5;
  }

  .project-item:last-child,
  .feature-item:last-child {
    margin-bottom: 0;
  }

  @media (max-width: 767px) {
    .projects {
      padding: 3rem 0;
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
      gap: 1.25rem;
    }

    .project-card {
      padding: 1.5rem;
    }

    .project-name {
      font-size: 1.25rem;
    }

    .project-description {
      font-size: 0.9375rem;
    }

    .tech-tag {
      font-size: 0.75rem;
    }

    .project-item,
    .feature-item {
      font-size: 0.875rem;
    }
  }

  @media (min-width: 768px) and (max-width: 1024px) {
    .projects {
      padding: 4rem 0;
    }

    .projects-container {
      padding: 0 1.5rem;
    }

    .projects-title {
      font-size: 1.75rem;
    }
  }

  @media (prefers-color-scheme: dark) {
    .project-card {
      background: var(--color-bg-secondary);
      border-color: var(--color-border);
    }

    .project-card:hover {
      background: var(--color-bg-tertiary);
    }

    .tech-tag {
      background: var(--color-bg-tertiary);
      color: var(--color-primary);
    }
  }

  @media (prefers-contrast: high) {
    .project-card {
      border: 2px solid #000000;
      box-shadow: none;
    }

    .project-name {
      color: #000000;
      font-weight: 700;
    }

    .project-description,
    .project-item,
    .feature-item {
      color: #000000;
    }

    .tech-tag {
      border: 1px solid #000000;
      color: #000000;
    }
  }

  @media print {
    .projects {
      background: #ffffff;
      padding: 1rem 0;
    }

    .projects-grid {
      gap: 1rem;
    }

    .project-card {
      border: 1px solid #000000;
      box-shadow: none;
    }

    .project-card:hover {
      transform: none;
    }

    .project-name {
      color: #000000;
    }

    .project-description,
    .project-item,
    .feature-item {
      color: #000000;
    }

    .tech-tag {
      border: 1px solid #000000;
      color: #000000;
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .project-card {
      transition: none;
    }

    .project-card:hover {
      transform: none;
    }
  }
</style>
