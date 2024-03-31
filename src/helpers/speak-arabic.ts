export const speakText = (word: string) => {
  const utterance = new SpeechSynthesisUtterance(word);
  utterance.lang = "ar-SA";

  speechSynthesis.speak(utterance);
}