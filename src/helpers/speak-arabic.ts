export const speakText = (word: string) => {
  console.log({ word })
  const utterance = new SpeechSynthesisUtterance(word);
  utterance.lang = "ar-SA";

  speechSynthesis.speak(utterance);
}