<script lang="ts">
  interface FAQItem {
    question: string;
    answer: string | string[];
    id: string;
  }

  const faqs: FAQItem[] = [
    {
      id: 'why-choose-parallel-arabic',
      question: 'Why Choose Parallel Arabic?',
      answer: [
        'Parallel Arabic offers a comprehensive learning experience with multiple features designed to help you master Arabic dialects:',
        '📖 Stories: Read engaging Arabic stories in different dialects to improve your reading comprehension and vocabulary.',
        '🎥 Videos: Watch Arabic learning videos with interactive sentence breakdowns and vocabulary practice.',
        '💬 Sentence Generation: Generate unlimited practice sentences using your saved vocabulary words for personalized learning.',
        '📚 Guided Lessons: Follow structured learning paths with step-by-step lessons tailored to your chosen dialect and level.',
        '🎯 Context-Based Learning: Our AI uses your saved words to generate unlimited personalized learning materials - lessons, stories, and practice exercises - all tailored to the vocabulary you\'re actively learning. This means every piece of content reinforces the words you\'ve already saved, making your learning more efficient and effective.'
      ]
    },
    {
      id: 'why-egyptian-arabic',
      question: 'Why Learn Egyptian Arabic?',
      answer: [
        'Learning Egyptian Arabic has many benefits. Primarily, it is the most widely spoken Arabic dialect, making it a crucial tool for communication across Arabic-speaking nations. Its widespread understanding throughout the Middle East and North Africa is largely due to Egypt\'s influential media, including films, television shows, and music.',
        'Furthermore, mastering Egyptian Arabic can serve as an entry point to other Arabic dialects, given its broad recognition and its similarities to Modern Standard Arabic. For travelers, expatriates, and those interested in Middle Eastern studies, Egyptian Arabic is exceptionally practical. It enhances cultural experiences, improves social interactions, and deepens understanding of the region\'s history and current affairs. Ultimately, the advantages of learning Egyptian Arabic go beyond language skills, providing a strong foundation for deeper engagement with the Arab world.'
      ]
    },
    {
      id: 'why-pay',
      question: 'Why Pay for Parallel Arabic?',
      answer: [
        'To cover server costs, AI credits, and the creation of learning materials from professional Arabic teachers, including conversations and sentence-by-sentence audio.',
        'You are paying to support an independent designer & developer who is passionate about this project. 100% of your subscription dues goes towards the active development of Parallel Arabic.',
        'If you really want to use the platform but cannot afford it at this time, just email me at selmetwa@gmail.com'
      ]
    },
    {
      id: 'how-to-use',
      question: 'How to Get the Most Out of Parallel Arabic?',
      answer: [
        'The materials on Parallel Arabic are not going to make you fluent in Arabic by themselves. They are meant to be a supplement to your learning. The best way to use Parallel Arabic is to use it in conjunction with a course or a tutor.',
        'Learning Arabic as an English speaker is challenging, and there is no silver bullet other than consistent study. I recommend the following to make consistent progress:',
        '• Weekly Lessons on Italki, while saving vocab and reviewing via Anki',
        '• Working through the materials on Parallel Arabic outside of class (Reading, writing, verb conjugations, listening comprehension)',
        '• Utilizing other Anki Decks',
        '• Watching Arabic movies or TV shows on Netflix or Shahid'
      ]
    },
    {
      id: 'what-dialects',
      question: 'What Arabic Dialects Does Parallel Arabic Support?',
      answer: 'Parallel Arabic supports four major Arabic dialects: Egyptian Arabic (the most widely understood), Levantine Arabic (spoken in Syria, Lebanon, Palestine, and Jordan), Moroccan Darija (Moroccan Arabic), and Modern Standard Arabic (Fusha). Each dialect has its own lessons, stories, vocabulary, and practice materials.'
    },
    {
      id: 'how-it-works',
      question: 'How Does Parallel Arabic Work?',
      answer: 'Parallel Arabic uses spaced repetition for vocabulary review, interactive lessons with audio, AI-powered conversation practice, and engaging stories. You can import vocabulary, practice writing, review words, and learn through structured lessons tailored to your chosen dialect.'
    },
    {
      id: 'subscription',
      question: 'What Does a Subscription Include?',
      answer: 'A subscription gives you full access to all lessons, stories, vocabulary practice, AI tutor conversations, and premium features. You can learn any of the supported dialects, import your own vocabulary, and track your progress across all learning activities.'
    },
    {
      id: 'beginner-friendly',
      question: 'Is Parallel Arabic Suitable for Beginners?',
      answer: 'Yes! Parallel Arabic is designed for learners at all levels, from complete beginners to advanced students. We offer structured learning paths, alphabet lessons, and beginner-friendly content. You can start with the basics and progress at your own pace.'
    },
    {
      id: 'offline',
      question: 'Can I Use Parallel Arabic Offline?',
      answer: 'Parallel Arabic is a web application that requires an internet connection. However, once loaded, many features work offline thanks to Progressive Web App (PWA) capabilities. For the best experience, we recommend using it with an internet connection to access all features including AI-powered content.'
    }
  ];

  let openItems = $state<Set<string>>(new Set());

  function toggleItem(id: string) {
    if (openItems.has(id)) {
      openItems.delete(id);
    } else {
      openItems.add(id);
    }
    openItems = new Set(openItems); // Trigger reactivity
  }

  // Generate FAQ schema for SEO
  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": faqs.map(faq => ({
      "@type": "Question",
      "name": faq.question,
      "acceptedAnswer": {
        "@type": "Answer",
        "text": Array.isArray(faq.answer) ? faq.answer.join(' ') : faq.answer
      }
    }))
  };
</script>

<svelte:head>
  <title>Frequently Asked Questions - Parallel Arabic</title>
  <meta name="description" content="Find answers to common questions about Parallel Arabic, including why to learn Arabic dialects, how the platform works, subscription details, and learning tips." />
  
  <!-- FAQ Schema -->
  {@html `<script type="application/ld+json">${JSON.stringify(faqSchema)}</script>`}
</svelte:head>

<div class="min-h-screen bg-tile-200 py-8 px-4 sm:px-8">
  <div class="max-w-4xl mx-auto">
    <!-- Header -->
    <header class="text-center mb-12">
      <h1 class="text-4xl sm:text-5xl font-bold text-text-300 mb-4">Frequently Asked Questions</h1>
      <p class="text-text-200 text-lg">Everything you need to know about Parallel Arabic</p>
    </header>

    <!-- FAQ Accordion -->
    <div class="space-y-4">
      {#each faqs as faq (faq.id)}
        <div class="bg-tile-300 border-2 border-tile-500 rounded-xl overflow-hidden shadow-lg hover:shadow-xl transition-shadow">
          <button
            onclick={() => toggleItem(faq.id)}
            class="w-full px-6 py-5 text-left flex items-center justify-between gap-4 hover:bg-tile-400 transition-colors focus:outline-none focus:ring-2 focus:ring-tile-500 focus:ring-inset"
            aria-expanded={openItems.has(faq.id)}
            aria-controls={`faq-answer-${faq.id}`}
          >
            <h2 class="text-xl sm:text-2xl font-bold text-text-300 flex-1 pr-4">
              {faq.question}
            </h2>
            <div class="flex-shrink-0">
              <svg
                class={`w-6 h-6 text-text-300 transition-transform duration-300 ${openItems.has(faq.id) ? 'rotate-180' : ''}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </button>
          
          {#if openItems.has(faq.id)}
            <div
              id={`faq-answer-${faq.id}`}
              class="px-6 pb-5 pt-0 border-t border-tile-500"
              role="region"
            >
              <div class="pt-4 space-y-3 text-text-200 text-base leading-relaxed">
                {#if Array.isArray(faq.answer)}
                  {#each faq.answer as paragraph}
                    {#if paragraph.startsWith('•')}
                      <p class="ml-4">{paragraph}</p>
                    {:else if paragraph.match(/^[📖🎥💬📚🎯]/)}
                      <p class="font-medium text-text-300">{paragraph}</p>
                    {:else}
                      <p>{paragraph}</p>
                    {/if}
                  {/each}
                {:else}
                  <p>{faq.answer}</p>
                {/if}
              </div>
            </div>
          {/if}
        </div>
      {/each}
    </div>

    <!-- Contact Section -->
    <div class="mt-12 bg-tile-400 border-2 border-tile-600 rounded-xl p-8 text-center">
      <h2 class="text-2xl font-bold text-text-300 mb-4">Still Have Questions?</h2>
      <p class="text-text-200 mb-6">
        Can't find the answer you're looking for? Feel free to reach out to us.
      </p>
      <a
        href="mailto:selmetwa@gmail.com"
        class="inline-block px-6 py-3 bg-tile-600 hover:bg-tile-500 text-text-100 font-semibold rounded-lg transition-colors"
      >
        Contact Us
      </a>
    </div>
  </div>
</div>
