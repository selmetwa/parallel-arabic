export const speakText = (word: string) => {
  const utterance = new SpeechSynthesisUtterance(word);
  utterance.lang = "ar-SA";
  window.speechSynthesis.cancel();
  speechSynthesis.speak(utterance);
}