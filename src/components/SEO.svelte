<script lang="ts">
  import { onMount } from 'svelte';
  import { languageStore, type Language } from '../stores/languageStore';

  // Meta content for supported languages
  const metaContent: Record<Language, { title: string; description: string; ogTitle: string; ogDescription: string }> = {
    pl: {
      title: 'MiСode Sp. z o.o. - Profesjonalne rozwiązania IT | Gdańsk',
      description: 'MiСode - tworzenie aplikacji mobilnych, oprogramowania na zamówienie i rozwiązań chmurowych. 18+ lat doświadczenia. Gdańsk, Polska.',
      ogTitle: 'MiСode Sp. z o.o. - Profesjonalne rozwiązania IT',
      ogDescription: 'Tworzenie aplikacji mobilnych i systemów enterprise. 18+ lat doświadczenia w branży IT.',
    },
    en: {
      title: 'MiСode Sp. z o.o. - Professional IT Solutions | Gdańsk',
      description: 'MiСode - mobile app development, custom software, and cloud solutions. 18+ years of experience. Gdańsk, Poland.',
      ogTitle: 'MiСode Sp. z o.o. - Professional IT Solutions',
      ogDescription: 'Mobile app and enterprise system development. 18+ years of experience in IT industry.',
    },
    ru: {
      title: 'MiСode Sp. z o.o. - Профессиональные IT-решения | Гданьск',
      description: 'MiСode — разработка мобильных приложений, ПО на заказ и облачных решений. 18+ лет опыта. Гданьск, Польша.',
      ogTitle: 'MiСode Sp. z o.o. - Профессиональные IT-решения',
      ogDescription: 'Разработка мобильных приложений и enterprise-систем. 18+ лет опыта в IT-индустрии.',
    }
  };

  const ogLocaleMap: Record<Language, string> = {
    pl: 'pl_PL',
    en: 'en_US',
    ru: 'ru_RU'
  };

  // Structured data (JSON-LD) for organization
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "MiСode Sp. z o.o.",
    "url": "https://micode-ai.github.io/home",
    "foundingDate": "2024",
    "address": {
      "@type": "PostalAddress",
      "streetAddress": "Jana Heweliusza 11 lok. 811",
      "addressLocality": "Gdańsk",
      "postalCode": "80-890",
      "addressCountry": "PL"
    },
    "contactPoint": {
      "@type": "ContactPoint",
      "contactType": "customer service",
      "email": "perevertkinma@gmail.com"
    },
    "founder": {
      "@type": "Person",
      "name": "Michał Peraviortkin",
      "jobTitle": "Founder & CEO",
      "alumniOf": {
        "@type": "EducationalOrganization",
        "name": "Brest State Technical University"
      }
    },
    "description": "IT services company specializing in mobile application development, custom software development, IT systems integration, data analysis, and cloud solutions implementation.",
    "knowsAbout": [
      "Mobile Application Development",
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

  $effect(() => {
    if (typeof document !== 'undefined') {
      updateMetaTags($languageStore);
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
    updateMetaTag('property', 'og:locale', ogLocaleMap[lang]);
    
    // Update html lang attribute
    document.documentElement.lang = lang;
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

  function addStructuredData() {
    // Check if structured data script already exists
    let script = document.querySelector('script[type="application/ld+json"]');
    if (!script) {
      script = document.createElement('script');
      script.setAttribute('type', 'application/ld+json');
      document.head.appendChild(script);
    }
    script.textContent = JSON.stringify(structuredData);
  }

  onMount(() => {
    addStructuredData();
  });
</script>
