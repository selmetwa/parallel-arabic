import { Howl } from 'howler';

export const speakArabic = async (text: string, dialect: string = 'egyptian-arabic') => {
	const res = await fetch('/api/text-to-speech', {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json'
		},
		body: JSON.stringify({ text, dialect })
	});

	// Get playback rate from response headers
	const playbackRate = parseFloat(res.headers.get('X-Playback-Rate') || '1.0');

	// Convert response to a blob
	const audioBlob = await res.blob();

	// Create a URL for the audio blob
	const audioUrl = URL.createObjectURL(audioBlob);

	// Create a Howl instance to play the audio
	const sound = new Howl({
		src: [audioUrl],
		autoplay: true,
		rate: playbackRate,
    html5: true,
		format: ['mp3'] // or 'wav', based on the format of the returned blob
	});

	// Play the audio
	sound.play();
};
