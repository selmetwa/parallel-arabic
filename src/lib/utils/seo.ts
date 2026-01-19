export interface PageMeta {
  title: string;
  description: string;
  image?: string;
  url?: string;
  type?: 'website' | 'article';
}

const baseUrl = 'https://www.parallel-arabic.com';
const defaultImage = `${baseUrl}/images/banner.png`;

export function getPageMeta(page: string, data?: any): PageMeta {
  const pages: Record<string, PageMeta> = {
    home: {
      title: 'Parallel Arabic - Learn Arabic Dialects Online',
      description: 'Learn Egyptian Arabic, Levantine, Moroccan Darija, and Modern Standard Arabic through interactive lessons, stories, and spaced repetition. Master Arabic dialects with AI-powered conversation practice.',
      url: baseUrl,
      type: 'website'
    },
    about: {
      title: 'About Parallel Arabic - Learn Arabic Dialects',
      description: 'Learn about Parallel Arabic, the comprehensive platform for learning Arabic dialects through interactive lessons, stories, and vocabulary practice.',
      url: `${baseUrl}/about`,
      type: 'website'
    },
    lessons: {
      title: data?.dialect 
        ? `Arabic Lessons - ${formatDialectName(data.dialect)} | Parallel Arabic`
        : 'Arabic Lessons - All Dialects | Parallel Arabic',
      description: data?.dialect
        ? `Interactive Arabic lessons for ${formatDialectName(data.dialect)}. Practice vocabulary, grammar, and conversation with our comprehensive lesson system.`
        : 'Interactive Arabic lessons for all dialects. Practice vocabulary, grammar, and conversation with Egyptian, Levantine, Moroccan, and Modern Standard Arabic.',
      url: `${baseUrl}/lessons${data?.dialect ? `/${data.dialect}` : ''}`,
      type: 'website'
    },
    lesson: {
      title: data?.title 
        ? `${data.title} - Arabic Lesson | Parallel Arabic`
        : 'Arabic Lesson | Parallel Arabic',
      description: data?.description || 'Learn Arabic through interactive lessons with vocabulary, grammar, and conversation practice.',
      url: data?.id ? `${baseUrl}/lessons/${data.id}` : `${baseUrl}/lessons`,
      type: 'article'
    },
    review: {
      title: 'Review Vocabulary - Arabic Spaced Repetition | Parallel Arabic',
      description: 'Review and practice Arabic vocabulary with spaced repetition. Master words through active recall and improve your Arabic vocabulary retention.',
      url: `${baseUrl}/review`,
      type: 'website'
    },
    stories: {
      title: data?.dialect
        ? `Arabic Stories - ${formatDialectName(data.dialect)} | Parallel Arabic`
        : 'Arabic Stories - Read and Learn | Parallel Arabic',
      description: data?.dialect
        ? `Read Arabic stories in ${formatDialectName(data.dialect)}. Improve your reading comprehension and vocabulary through engaging narratives.`
        : 'Read Arabic stories in different dialects. Improve your reading comprehension and vocabulary through engaging narratives in Egyptian, Levantine, Moroccan, and Modern Standard Arabic.',
      url: `${baseUrl}/stories${data?.dialect ? `/${data.dialect}` : ''}`,
      type: 'website'
    },
    story: {
      title: data?.title
        ? `${data.title} - Arabic Story | Parallel Arabic`
        : 'Arabic Story | Parallel Arabic',
      description: data?.description || 'Read an Arabic story to improve your reading comprehension and vocabulary.',
      url: data?.id ? `${baseUrl}/stories/${data.id}` : `${baseUrl}/stories`,
      type: 'article'
    },
    tutor: {
      title: 'Arabic Conversation Practice - AI Tutor | Parallel Arabic',
      description: 'Practice Arabic conversation with our AI tutor. Improve your speaking skills in Egyptian, Levantine, Moroccan, and Modern Standard Arabic through interactive dialogue.',
      url: `${baseUrl}/tutor`,
      type: 'website'
    },
    alphabet: {
      title: 'Learn Arabic Alphabet - Interactive Guide | Parallel Arabic',
      description: 'Learn the Arabic alphabet through interactive lessons. Master letter recognition, pronunciation, and writing with our comprehensive alphabet learning system.',
      url: `${baseUrl}/alphabet/learn`,
      type: 'website'
    },
    videos: {
      title: 'Arabic Learning Videos | Parallel Arabic',
      description: 'Watch Arabic learning videos in different dialects. Improve your listening comprehension and learn from native speakers.',
      url: `${baseUrl}/videos`,
      type: 'website'
    },
    import: {
      title: 'Import Vocabulary - Add Words to Review Deck | Parallel Arabic',
      description: 'Import Arabic vocabulary words to your review deck. Add words from categories or upload CSV/TXT files to expand your vocabulary.',
      url: `${baseUrl}/review/import`,
      type: 'website'
    },
    faq: {
      title: 'Frequently Asked Questions - Parallel Arabic',
      description: 'Find answers to common questions about Parallel Arabic, including why to learn Arabic dialects, how the platform works, subscription details, and learning tips.',
      url: `${baseUrl}/faq`,
      type: 'website'
    },
    vocabulary: {
      title: 'Arabic Vocabulary Explorer - 20,000+ Words | Parallel Arabic',
      description: 'Browse and learn from our comprehensive Arabic vocabulary database with over 20,000 words across Egyptian, Levantine, Moroccan Darija, and Modern Standard Arabic. Search, filter, and save words to your review deck.',
      url: `${baseUrl}/vocabulary`,
      type: 'website'
    }
  };

  const meta = pages[page] || {
    title: 'Parallel Arabic - Learn Arabic Dialects',
    description: 'Master Arabic dialects through interactive lessons, stories, and vocabulary practice.',
    url: baseUrl,
    type: 'website'
  };

  return {
    ...meta,
    image: meta.image || defaultImage
  };
}

function formatDialectName(dialect: string): string {
  const dialectMap: Record<string, string> = {
    'egyptian-arabic': 'Egyptian Arabic',
    'levantine': 'Levantine Arabic',
    'darija': 'Moroccan Darija',
    'fusha': 'Modern Standard Arabic'
  };
  return dialectMap[dialect] || dialect;
}

export function generateStructuredData(page: string, data?: any) {
  const baseStructuredData = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    "name": "Parallel Arabic",
    "description": "Learn Arabic dialects through interactive lessons, stories, and vocabulary practice",
    "url": baseUrl,
    "applicationCategory": "EducationalApplication",
    "operatingSystem": "Web",
    "offers": {
      "@type": "Offer",
      "price": "0",
      "priceCurrency": "USD"
    },
    "featureList": [
      "Interactive Arabic lessons",
      "Vocabulary spaced repetition",
      "Arabic stories",
      "AI conversation tutor",
      "Multiple dialects support"
    ],
    "browserRequirements": "Requires JavaScript. Requires HTML5.",
    "softwareVersion": "1.0"
  };

  // Organization schema for brand identity
  const organizationSchema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "Parallel Arabic",
    "url": baseUrl,
    "logo": `${baseUrl}/icons/icon.png`,
    "description": "Learn Arabic dialects through interactive lessons, stories, and AI-powered conversation practice",
    "foundingDate": "2024",
    "sameAs": [
      "https://twitter.com/parallelarabic",
      "https://instagram.com/parallelarabic"
    ]
  };

  // FAQ schema for rich snippets
  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": [
      {
        "@type": "Question",
        "name": "What Arabic dialects can I learn on Parallel Arabic?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Parallel Arabic supports Egyptian Arabic, Levantine Arabic (Syrian/Lebanese), Moroccan Darija, and Modern Standard Arabic (MSA/Fusha). Each dialect has dedicated lessons, stories, and vocabulary."
        }
      },
      {
        "@type": "Question",
        "name": "Is Parallel Arabic free to use?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Parallel Arabic offers a free tier with access to basic lessons, stories, and vocabulary practice. Premium features like AI tutoring and unlimited content are available with a subscription."
        }
      },
      {
        "@type": "Question",
        "name": "How does the AI Arabic tutor work?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Our AI tutor provides conversational practice in your chosen Arabic dialect. It remembers your learning progress, corrects grammar mistakes, and adapts to your skill level for personalized practice."
        }
      },
      {
        "@type": "Question",
        "name": "Can I practice Arabic pronunciation?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Yes! The Speak feature uses speech recognition to evaluate your Arabic pronunciation. You'll get instant feedback comparing your speech to native pronunciation."
        }
      }
    ]
  };

  // Home page returns multiple schemas for rich results
  if (page === 'home') {
    return [baseStructuredData, organizationSchema, faqSchema];
  }

  // Add page-specific structured data
  if (page === 'lesson' && data?.title) {
    return {
      "@context": "https://schema.org",
      "@type": "Course",
      "name": data.title,
      "description": data.description || "Arabic lesson",
      "provider": {
        "@type": "Organization",
        "name": "Parallel Arabic",
        "url": baseUrl
      },
      "educationalLevel": data.level || "Beginner",
      "inLanguage": "ar"
    };
  }

  if (page === 'story' && data?.title) {
    return {
      "@context": "https://schema.org",
      "@type": "Article",
      "headline": data.title,
      "description": data.description || "Arabic story",
      "author": {
        "@type": "Organization",
        "name": "Parallel Arabic"
      },
      "publisher": {
        "@type": "Organization",
        "name": "Parallel Arabic",
        "url": baseUrl
      },
      "inLanguage": "ar"
    };
  }

  // FAQ page gets dedicated FAQ schema
  if (page === 'faq') {
    return faqSchema;
  }

  return baseStructuredData;
}

