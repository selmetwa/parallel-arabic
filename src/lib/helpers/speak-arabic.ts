import EasySpeech from 'easy-speech';

// export const speakArabic = async (text: string) => {
//   const res = await fetch('/api/text-to-speech', {
//     method: 'POST',
//     headers: { accept: 'audio/mpeg' },
//     body: JSON.stringify({
//       text: text
//     })
//   });

//   const blob = await res.blob();

//   const audioUrl = URL.createObjectURL(blob);

//   // Optionally, play the audio
//   const audio = new Audio(audioUrl);
//   audio.play();
//   // return blob;
// }

export const speakArabic = async (text: string) => {
	const a = EasySpeech.detect();

	EasySpeech.init({ maxTimeout: 5000, interval: 250 })
		.then(() => console.debug('load complete'))
		.catch((e) => console.error(e));

	const voices = EasySpeech.voices();
	const arabicVoices = voices.filter((voice) => voice.lang.includes('ar'));

	await EasySpeech.speak({
		text: text,
		voice: arabicVoices[0], // optional, will use a default or fallback
		pitch: 1,
		rate: 0.75,
		volume: 1,
		// there are more events, see the API for supported events
		boundary: (e) => console.debug('boundary reached')
	});
};
