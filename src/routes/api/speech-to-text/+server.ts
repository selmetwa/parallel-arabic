

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

  // Validate audio file size (minimum 1KB to avoid empty files)
  const arrayBuffer = await file.arrayBuffer();
  if (arrayBuffer.byteLength < 1000) {
    return json({ error: "Audio file is too small. Please ensure you recorded audio." }, { status: 400 });
  }

  // Use /tmp directory for Vercel compatibility (writable in serverless environments)
  const tmpDir = '/tmp';
  if (!fs.existsSync(tmpDir)) {
    // Fallback to process.cwd()/tmp for local development
    const fallbackTmpDir = path.join(process.cwd(), "tmp");
    if (!fs.existsSync(fallbackTmpDir)) {
      fs.mkdirSync(fallbackTmpDir, { recursive: true });
    }
    const filePath = path.join(fallbackTmpDir, `audio_${Date.now()}_${file.name}`);
    const buffer = Buffer.from(arrayBuffer);
    fs.writeFileSync(filePath, new Uint8Array(arrayBuffer));
    
    return await processAudio(filePath, buffer, file.type, file.name, languageCode, fallbackTmpDir);
  }

  const filePath = path.join(tmpDir, `audio_${Date.now()}_${file.name}`);
  const buffer = Buffer.from(arrayBuffer);
  fs.writeFileSync(filePath, new Uint8Array(arrayBuffer));

  console.log(`File saved: ${filePath}, transcribing in ${languageCode}`);

  return await processAudio(filePath, buffer, file.type, file.name, languageCode, tmpDir);
}

async function processAudio(
  filePath: string,
  buffer: Buffer,
  originalMimeType: string,
  originalFileName: string,
  languageCode: string,
  tmpDir: string
) {
  // Convert WebM to MP3 if needed (ElevenLabs may not support WebM)
  let audioBuffer = buffer;
  let audioMimeType = originalMimeType;
  let audioFileName = originalFileName;
  let tempConvertedPath: string | null = null;
  const tempOriginalPath: string | null = filePath;

  try {
    if (originalMimeType === 'audio/webm' || originalFileName.endsWith('.webm')) {
      console.log('Converting WebM to MP3 for ElevenLabs compatibility...');
      const convertedPath = path.join(tmpDir, `converted_${Date.now()}.mp3`);
      tempConvertedPath = convertedPath;
      
      try {
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
      } catch (ffmpegError) {
        console.error('FFmpeg conversion failed, trying to send WebM directly:', ffmpegError);
        // If FFmpeg fails, try sending WebM directly - ElevenLabs might support it now
        audioBuffer = buffer;
        audioMimeType = originalMimeType;
        audioFileName = originalFileName;
      }
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
    
    // Log the full response for debugging
    console.log('ElevenLabs API response:', {
      hasText: !!_data.text,
      textLength: _data.text?.length || 0,
      responseKeys: Object.keys(_data),
      fullResponse: JSON.stringify(_data)
    });
    
    const transcribedText = _data.text?.trim();
    
    if (transcribedText && transcribedText.length > 0) {
      console.log(`Transcription successful with language: ${languageCode}`, { text: transcribedText });
      
      // Clean up temporary files
      cleanupFiles(tempOriginalPath, tempConvertedPath);
      
      return json({ text: transcribedText });
    } else {
      // Provide more helpful error message
      const errorDetails = {
        responseReceived: !!_data,
        responseKeys: _data ? Object.keys(_data) : [],
        rawText: _data?.text,
        languageCode,
        audioFileName: audioFileName,
        audioSize: audioBuffer.length
      };
      
      console.error('Empty transcription result:', errorDetails);
      
      // Check if audio might be too short or silent
      if (audioBuffer.length < 1000) {
        throw new Error("Audio file is too short or empty. Please record at least 1 second of audio.");
      }
      
      throw new Error("No speech detected in audio. Please ensure the audio contains clear speech and try again.");
    }
  } catch (error) {
    console.error(`Transcription error with ${languageCode}:`, error);
    console.error('Error details:', {
      errorType: error instanceof Error ? error.constructor.name : typeof error,
      errorMessage: error instanceof Error ? error.message : String(error),
      languageCode,
      audioFileName: originalFileName,
      audioSize: buffer.length
    });
    
    // Clean up temporary files on error
    cleanupFiles(tempOriginalPath, tempConvertedPath);
    
    // Return more detailed error message
    const errorMessage = error instanceof Error ? error.message : "Failed to transcribe";
    return json({ error: errorMessage }, { status: 500 });
  }
}

function cleanupFiles(originalPath: string | null, convertedPath: string | null) {
  // Clean up original file
  if (originalPath && fs.existsSync(originalPath)) {
    try {
      fs.unlinkSync(originalPath);
    } catch (cleanupError) {
      console.error('Error cleaning up original file:', cleanupError);
    }
  }
  
  // Clean up converted file if it exists
  if (convertedPath && fs.existsSync(convertedPath)) {
    try {
      fs.unlinkSync(convertedPath);
    } catch (cleanupError) {
      console.error('Error cleaning up converted file:', cleanupError);
    }
  }
}
