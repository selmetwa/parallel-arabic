

import { json } from "@sveltejs/kit";
import fs from "fs";
import path from "path";
import { env } from '$env/dynamic/private';
import ffmpeg from "fluent-ffmpeg";

const ELEVENLABS_API_KEY = env.ELEVENLABS_API_KEY;

if (!ELEVENLABS_API_KEY) {
	throw new Error('Missing ELEVENLABS_API_KEY in environment variables');
}

export async function POST({ request }) {
  const formData = await request.formData();
  const file = formData.get("audio") as File;
  const language = formData.get("language") as string | null; // "ar" or "en"

  if (!file) {
    return json({ error: "No file uploaded" }, { status: 400 });
  }

  // Default to Arabic if no language specified (for backward compatibility)
  const languageCode = language === "en" ? "en" : "ar";

  // Save the file to a temporary location
  const uploadsDir = path.join(process.cwd(), "static/uploads");
  if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

  const filePath = path.join(uploadsDir, file.name);
  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  fs.writeFileSync(filePath, new Uint8Array(arrayBuffer));

  console.log(`File saved: ${filePath}, transcribing in ${languageCode}`);

  // Convert WebM to MP3 if needed (ElevenLabs may not support WebM)
  let audioBuffer = buffer;
  let audioMimeType = file.type;
  let audioFileName = file.name;
  let tempConvertedPath: string | null = null;

  try {

    if (file.type === 'audio/webm' || file.name.endsWith('.webm')) {
      console.log('Converting WebM to MP3 for ElevenLabs compatibility...');
      const convertedPath = path.join(uploadsDir, `converted_${Date.now()}.mp3`);
      tempConvertedPath = convertedPath;
      
      await new Promise<void>((resolve, reject) => {
        ffmpeg(filePath)
          .toFormat('mp3')
          .audioCodec('libmp3lame')
          .audioBitrate(128)
          .on('end', () => {
            console.log('WebM to MP3 conversion completed');
            audioBuffer = fs.readFileSync(convertedPath);
            audioMimeType = 'audio/mpeg';
            audioFileName = convertedPath.split(path.sep).pop() || 'converted.mp3';
            resolve();
          })
          .on('error', (err) => {
            console.error('FFmpeg conversion error:', err);
            reject(err);
          })
          .save(convertedPath);
      });
    }

    const _formData = new FormData();
    _formData.append("file", new Blob([new Uint8Array(audioBuffer)], { type: audioMimeType }), audioFileName);
    _formData.append("model_id", "scribe_v1");
    _formData.append("language_code", languageCode);
    
    const apiResponse = await fetch("https://api.elevenlabs.io/v1/speech-to-text", {
      method: "POST",
      headers: {
        "xi-api-key": ELEVENLABS_API_KEY
      },
      body: _formData,
    });

    if (!apiResponse.ok) {
      const errorText = await apiResponse.text();
      let errorMessage = `Transcription failed: ${apiResponse.statusText}`;
      try {
        const errorJson = JSON.parse(errorText);
        errorMessage = `Transcription failed: ${errorJson.detail?.message || errorJson.message || errorJson.detail || apiResponse.statusText}`;
      } catch {
        errorMessage = `Transcription failed: ${apiResponse.statusText} - ${errorText}`;
      }
      console.error('ElevenLabs API error:', {
        status: apiResponse.status,
        statusText: apiResponse.statusText,
        errorBody: errorText
      });
      throw new Error(errorMessage);
    }

    const _data = await apiResponse.json();
    const transcribedText = _data.text?.trim();
    
    if (transcribedText && transcribedText.length > 0) {
      console.log(`Transcription successful with language: ${languageCode}`, { text: transcribedText });
      
      // Clean up converted file if it exists
      if (tempConvertedPath && fs.existsSync(tempConvertedPath)) {
        fs.unlinkSync(tempConvertedPath);
      }
      
      return json({ text: transcribedText });
    } else {
      throw new Error("Empty transcription result");
    }
  } catch (error) {
    console.error(`Transcription error with ${languageCode}:`, error);
    
    // Clean up converted file on error
    if (tempConvertedPath && fs.existsSync(tempConvertedPath)) {
      try {
        fs.unlinkSync(tempConvertedPath);
      } catch (cleanupError) {
        console.error('Error cleaning up converted file:', cleanupError);
      }
    }
    
    return json({ error: "Failed to transcribe" }, { status: 500 });
  }
}
