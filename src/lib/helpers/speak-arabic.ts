export const speakArabic = async (text: string) => {
  const res = await fetch('/api/text-to-speech', {
    method: 'POST',
    headers: { accept: 'audio/mpeg' },
    body: JSON.stringify({
      text: text
    })
  });

  const blob = await res.blob();

  const audioUrl = URL.createObjectURL(blob);

  // Optionally, play the audio
  const audio = new Audio(audioUrl);
  audio.play();
  // return blob;
}