<script lang="ts">
  import { languageStore, type Language } from '../stores/languageStore';
  import { t } from '../services/i18n';
  import productsData from '../data/products.json';
  import homeMeta from '../data/seo-home.json';
  import type { Product } from '../types/products';

  // Meta content for supported languages — shared with scripts/prerender.mjs
  // (single source of truth in src/data/seo-home.json)
  const metaContent = homeMeta as Record<
    Language,
    { title: string; description: string; ogTitle: string; ogDescription: string }
  >;

  const ogLocaleMap: Record<Language, string> = {
    pl: 'pl_PL',
    en: 'en_US',
    ru: 'ru_RU'
  };

  const SITE_URL = 'https://mi-code.pl/';
  const OG_IMAGE = 'https://mi-code.pl/og-image.png';

  // Structured data (JSON-LD) for organization
  // Combined Organization + ProfessionalService node (mirrors the static node in root index.html)
  const structuredData = {
    "@context": "https://schema.org",
    "@type": ["Organization", "ProfessionalService"],
    "name": "MiCode Sp. z o.o.",
    "url": "https://mi-code.pl/",
    "foundingDate": "2024",
    "logo": {
      "@type": "ImageObject",
      "url": "https://mi-code.pl/mi_code_logo_mark.svg",
      "width": 512,
      "height": 512
    },
    "image": "https://mi-code.pl/og-image.png",
    "address": {
      "@type": "PostalAddress",
      "streetAddress": "Jana Heweliusza 11 lok. 811",
      "addressLocality": "Gdańsk",
      "postalCode": "80-890",
      "addressCountry": "PL"
    },
    "geo": {
      "@type": "GeoCoordinates",
      "latitude": 54.3565,
      "longitude": 18.6487
    },
    "areaServed": ["PL", "EU"],
    "contactPoint": {
      "@type": "ContactPoint",
      "contactType": "customer service",
      "email": "development@mi-code.pl"
    },
    "founder": {
      "@type": "Person",
      "name": "Michał Peraviortkin",
      "alternateName": "Mikhail Peraviortkin",
      "jobTitle": "Founder & CEO",
      "image": "https://mi-code.pl/founder.jpg",
      "description": "Software engineer and founder of MiCode with 18+ years of experience building enterprise systems (Java, Oracle, Spring, Angular) and AI-powered products (RAG, Text2SQL).",
      "worksFor": {
        "@type": "Organization",
        "name": "MiCode Sp. z o.o."
      },
      "sameAs": [
        "https://www.linkedin.com/in/mikhailperaviortkin/",
        "https://www.upwork.com/freelancers/~0111066307e26807ec"
      ],
      "alumniOf": {
        "@type": "EducationalOrganization",
        "name": "Brest State Technical University"
      }
    },
    "description": "IT services company specializing in enterprise software development, AI integrations, custom software development, IT systems integration, data analysis, and cloud solutions implementation.",
    "sameAs": [
      "https://www.linkedin.com/in/mikhailperaviortkin/",
      "https://github.com/micode-ai",
      "https://www.npmjs.com/~perevertkinma"
    ],
    "knowsAbout": [
      "Custom Software Development",
      "IT Systems Integration",
      "Data Analysis",
      "Cloud Solutions",
      "Java",
      "Spring Boot",
      "Angular",
      "ReactJS",
      "TypeScript"
    ]
  };

  const websiteData = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "name": "MiCode Sp. z o.o.",
    "url": "https://mi-code.pl/",
    "inLanguage": ["pl", "en", "ru"],
    "publisher": {
      "@type": "Organization",
      "name": "MiCode Sp. z o.o."
    }
  };

  const serviceSchemas = [
    {
      "@context": "https://schema.org",
      "@type": "Service",
      "name": "Custom Software Development",
      "provider": { "@type": "Organization", "name": "MiCode Sp. z o.o." },
      "areaServed": ["PL", "EU"],
      "description": "Dedicated software solutions adapted to specific business requirements."
    },
    {
      "@context": "https://schema.org",
      "@type": "Service",
      "name": "IT Systems Integration",
      "provider": { "@type": "Organization", "name": "MiCode Sp. z o.o." },
      "areaServed": ["PL", "EU"],
      "description": "Connecting disparate IT systems into a unified, coherent architecture."
    },
    {
      "@context": "https://schema.org",
      "@type": "Service",
      "name": "Data Analysis",
      "provider": { "@type": "Organization", "name": "MiCode Sp. z o.o." },
      "areaServed": ["PL", "EU"],
      "description": "Transforming raw data into actionable business insights."
    },
    {
      "@context": "https://schema.org",
      "@type": "Service",
      "name": "Cloud Solutions Implementation",
      "provider": { "@type": "Organization", "name": "MiCode Sp. z o.o." },
      "areaServed": ["PL", "EU"],
      "description": "Cloud migration, infrastructure optimisation, and managed cloud services."
    }
  ];

  // Per-product Schema.org metadata (category + platform) keyed by product id
  const productSchemaMeta: Record<string, { applicationCategory: string; operatingSystem: string }> = {
    'budget-assistant': { applicationCategory: 'FinanceApplication', operatingSystem: 'Android' },
    'ngx-chat': { applicationCategory: 'DeveloperApplication', operatingSystem: 'Cross-platform' },
    'accounting-ai': { applicationCategory: 'BusinessApplication', operatingSystem: 'Web' },
    'emarketing-ai': { applicationCategory: 'BusinessApplication', operatingSystem: 'Web' },
    'testing-ai': { applicationCategory: 'BusinessApplication', operatingSystem: 'Web' }
  };

  function buildProductSchemas(lang: Language) {
    return (productsData as Product[]).map((product) => {
      const meta = productSchemaMeta[product.id] ?? {
        applicationCategory: 'BusinessApplication',
        operatingSystem: 'Web'
      };
      const playStore = product.links?.find((l) => l.type === 'playStore')?.url;
      const url = product.website ?? product.links?.[0]?.url;

      const schema: Record<string, unknown> = {
        "@context": "https://schema.org",
        "@type": "SoftwareApplication",
        "name": t(product.nameKey, lang),
        "description": t(product.descriptionKey, lang),
        "applicationCategory": meta.applicationCategory,
        "operatingSystem": meta.operatingSystem,
        "offers": {
          "@type": "Offer",
          "price": "0",
          "priceCurrency": "PLN"
        },
        "publisher": {
          "@type": "Organization",
          "name": "MiCode Sp. z o.o.",
          "url": "https://mi-code.pl/"
        }
      };
      if (url) schema.url = url;
      if (playStore) schema.downloadUrl = playStore;
      return schema;
    });
  }

  $effect(() => {
    if (typeof document !== 'undefined') {
      updateMetaTags($languageStore);
      addStructuredData($languageStore);
    }
  });

  function updateMetaTags(lang: Language) {
    const content = metaContent[lang];
    
    // Update title
    document.title = content.title;
    
    // Update or create meta description
    updateMetaTag('name', 'description', content.description);
    
    // Update Open Graph tags
    updateMetaTag('property', 'og:title', content.ogTitle);
    updateMetaTag('property', 'og:description', content.ogDescription);
    updateMetaTag('property', 'og:type', 'website');
    updateMetaTag('property', 'og:site_name', 'MiCode Sp. z o.o.');
    updateMetaTag('property', 'og:url', SITE_URL);
    updateMetaTag('property', 'og:image', OG_IMAGE);
    updateMetaTag('property', 'og:locale', ogLocaleMap[lang]);

    // Update Twitter Card tags
    updateMetaTag('name', 'twitter:card', 'summary_large_image');
    updateMetaTag('name', 'twitter:title', content.ogTitle);
    updateMetaTag('name', 'twitter:description', content.ogDescription);
    updateMetaTag('name', 'twitter:image', OG_IMAGE);

    // Update canonical link
    updateCanonical(SITE_URL);

    // Update html lang attribute
    document.documentElement.lang = lang;
  }

  function updateCanonical(href: string) {
    let link = document.querySelector('link[rel="canonical"]');
    if (!link) {
      link = document.createElement('link');
      link.setAttribute('rel', 'canonical');
      document.head.appendChild(link);
    }
    link.setAttribute('href', href);
  }

  function updateMetaTag(attribute: string, attributeValue: string, content: string) {
    let meta = document.querySelector(`meta[${attribute}="${attributeValue}"]`);
    if (!meta) {
      meta = document.createElement('meta');
      meta.setAttribute(attribute, attributeValue);
      document.head.appendChild(meta);
    }
    meta.setAttribute('content', content);
  }

  function addStructuredData(lang: Language) {
    // Check if structured data script already exists
    let script = document.querySelector('script[type="application/ld+json"]');
    if (!script) {
      script = document.createElement('script');
      script.setAttribute('type', 'application/ld+json');
      document.head.appendChild(script);
    }
    script.textContent = JSON.stringify([
      structuredData,
      websiteData,
      ...serviceSchemas,
      ...buildProductSchemas(lang)
    ]);
  }
</script>
