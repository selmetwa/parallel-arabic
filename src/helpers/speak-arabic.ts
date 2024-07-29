export const speakText = (word: string) => {
  const utterance = new SpeechSynthesisUtterance(word);
  utterance.rate = .5;
  utterance.lang = "ar-001";
  
  utterance.onstart = () => console.log("Speech started");
  utterance.onend = () => console.log("Speech ended");
  utterance.onerror = (event) => console.error("Speech synthesis error", event);
  
  const speak = () => {
    const voices = window.speechSynthesis.getVoices();
    const arabicVoice = voices.find(voice => voice.lang === "ar-SA") || voices.find(voice => voice.lang === "ar-001");

    console.log({ arabicVoice });
    if (arabicVoice) {
      utterance.voice = arabicVoice;
    } else {
      console.warn("Arabic voice not found.");
    }

    // Add a slight delay before speaking to ensure cancellation is processed
    setTimeout(() => {
      window.speechSynthesis.cancel();
      speechSynthesis.speak(utterance);
    }, 100);
  };
  
  // Attach the event listener for voiceschanged to handle when voices are loaded
  window.speechSynthesis.onvoiceschanged = () => {
    speak();
  };

  // If voices are already loaded, speak immediately
  if (window.speechSynthesis.getVoices().length > 0) {
    speak();
  }
};
