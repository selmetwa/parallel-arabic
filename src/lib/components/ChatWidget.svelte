<script lang="ts">
  let isOpen = $state(false);
  let messages = $state<Array<{ role: 'user' | 'assistant'; content: string; timestamp: Date }>>([]);
  let currentMessage = $state('');
  let isLoading = $state(false);
  let chatContainer: HTMLDivElement;

  // Welcome message
  if (messages.length === 0) {
    messages = [{
      role: 'assistant',
      content: 'Hi! I\'m here to help with your Arabic learning questions. Ask me anything about grammar, vocabulary, pronunciation, or culture!',
      timestamp: new Date()
    }];
  }

  function toggleChat() {
    isOpen = !isOpen;
    if (isOpen && chatContainer) {
      // Scroll to bottom when opening
      setTimeout(() => {
        chatContainer.scrollTop = chatContainer.scrollHeight;
      }, 100);
    }
  }

  async function sendMessage() {
    if (!currentMessage.trim() || isLoading) return;

    const userMessage = {
      role: 'user' as const,
      content: currentMessage.trim(),
      timestamp: new Date()
    };

    messages = [...messages, userMessage];
    const messageToSend = currentMessage;
    currentMessage = '';
    isLoading = true;

    // Scroll to bottom
    setTimeout(() => {
      if (chatContainer) {
        chatContainer.scrollTop = chatContainer.scrollHeight;
      }
    }, 10);

    try {
      const response = await fetch('/api/chat-support', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          message: messageToSend,
          conversation: messages.slice(-10) // Send last 10 messages for context
        })
      });

      if (!response.ok) {
        throw new Error('Failed to get response');
      }

      const data = await response.json();
      
      const assistantMessage = {
        role: 'assistant' as const,
        content: data.message,
        timestamp: new Date()
      };

      messages = [...messages, assistantMessage];

      // Scroll to bottom
      setTimeout(() => {
        if (chatContainer) {
          chatContainer.scrollTop = chatContainer.scrollHeight;
        }
      }, 10);

    } catch (error) {
      console.error('Chat error:', error);
      const errorMessage = {
        role: 'assistant' as const,
        content: 'Sorry, I\'m having trouble responding right now. Please try again in a moment.',
        timestamp: new Date()
      };
      messages = [...messages, errorMessage];
    } finally {
      isLoading = false;
    }
  }

  function handleKeyPress(event: KeyboardEvent) {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      sendMessage();
    }
  }

  function formatTime(date: Date) {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }
</script>

<!-- Only show on desktop (hidden on mobile/tablet) -->
<div class="fixed bottom-4 right-4 z-50 hidden lg:block">
  <!-- Chat Button -->
  {#if !isOpen}
    <button
      onclick={toggleChat}
      class="bg-tile-500 hover:bg-tile-400 text-text-300 rounded-full p-4 shadow-lg transition-all duration-300 transform hover:scale-105"
      aria-label="Open chat support"
    >
      <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
      </svg>
    </button>
  {/if}

  <!-- Chat Window -->
  {#if isOpen}
    <div class="bg-tile-400 border-2 border-tile-600 rounded-lg shadow-xl w-80 h-96 flex flex-col">
      <!-- Header -->
      <div class="bg-tile-500 px-4 py-3 rounded-t-lg flex items-center justify-between">
        <div class="flex items-center space-x-2">
          <div class="w-2 h-2 bg-tile-600 rounded-full"></div>
          <h3 class="text-text-300 font-semibold text-sm">Arabic Learning Assistant</h3>
        </div>
        <button
          onclick={toggleChat}
          class="text-text-200 hover:text-text-300 transition-colors"
          aria-label="Close chat"
        >
          <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <!-- Messages -->
      <div 
        bind:this={chatContainer}
        class="flex-1 overflow-y-auto p-3 space-y-3 bg-tile-300"
      >
        {#each messages as message}
          <div class="flex {message.role === 'user' ? 'justify-end' : 'justify-start'}">
            <div class="max-w-[80%]">
              <div class="
                {message.role === 'user' 
                  ? 'bg-tile-500 text-text-300 rounded-l-lg rounded-tr-lg' 
                  : 'bg-tile-200 text-text-300 rounded-r-lg rounded-tl-lg'
                } 
                px-3 py-2 text-sm leading-relaxed
              ">
                {message.content}
              </div>
              <div class="text-xs text-text-200 mt-1 {message.role === 'user' ? 'text-right' : 'text-left'}">
                {formatTime(message.timestamp)}
              </div>
            </div>
          </div>
        {/each}
        
        {#if isLoading}
          <div class="flex justify-start">
            <div class="bg-tile-200 text-text-300 rounded-r-lg rounded-tl-lg px-3 py-2 text-sm">
              <div class="flex items-center space-x-1">
                <div class="flex space-x-1">
                  <div class="w-1 h-1 bg-text-200 rounded-full animate-pulse"></div>
                  <div class="w-1 h-1 bg-text-200 rounded-full animate-pulse" style="animation-delay: 0.2s"></div>
                  <div class="w-1 h-1 bg-text-200 rounded-full animate-pulse" style="animation-delay: 0.4s"></div>
                </div>
                <span class="text-text-200 text-xs ml-2">Typing...</span>
              </div>
            </div>
          </div>
        {/if}
      </div>

      <!-- Input -->
      <div class="p-3 border-t border-tile-600 bg-tile-400 rounded-b-lg">
        <div class="flex space-x-2">
          <textarea
            bind:value={currentMessage}
            onkeypress={handleKeyPress}
            placeholder="Ask me anything about Arabic..."
            class="flex-1 resize-none bg-tile-200 border border-tile-600 rounded px-3 py-2 text-sm text-text-300 placeholder-text-200 focus:outline-none focus:border-tile-500"
            rows="1"
            disabled={isLoading}
          ></textarea>
          <button
            onclick={sendMessage}
            disabled={!currentMessage.trim() || isLoading}
            class="bg-tile-500 hover:bg-tile-400 disabled:bg-tile-600 disabled:cursor-not-allowed text-text-300 rounded px-3 py-2 transition-colors text-sm font-medium"
          >
            Send
          </button>
        </div>
        <div class="text-xs text-text-200 mt-2 text-center">
          Press Enter to send
        </div>
      </div>
    </div>
  {/if}
</div>

<style>
  @keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.5; }
  }
  
  .animate-pulse {
    animation: pulse 1.5s infinite;
  }
</style> 