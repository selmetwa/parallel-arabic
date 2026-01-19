import { json } from "@sveltejs/kit";
import { env } from '$env/dynamic/private';
import fs from "fs";
import path from "path";
import ffmpeg from "fluent-ffmpeg";

// Map your dialects to Chirp 3 language codes
const dialectToLanguageCode: Record<string, string> = {
  'egyptian-arabic': 'ar-EG',
  'levantine': 'ar-LB',
  'fusha': 'ar-SA',
  'darija': 'ar-MA',
  'khaleeji': 'ar-AE',
  'ar': 'ar-EG', // Default Arabic to Egyptian
  'en': 'en-US'
};

const PROJECT_ID = env.GOOGLE_CLOUD_PROJECT || 'gen-lang-client-0898024045';
const REGION = 'us'; // Chirp 3 is available in us, eu, asia-northeast1, asia-southeast1

// Get access token from service account credentials
async function getAccessToken(): Promise<string> {
  const credentialsJson = env.GOOGLE_APPLICATION_CREDENTIALS_JSON;
  
  if (!credentialsJson) {
    throw new Error('GOOGLE_APPLICATION_CREDENTIALS_JSON not set');
  }
  
  let credentials;
  try {
    // Handle different ways the JSON might be stored in env vars:
    // 1. Some platforms escape newlines as literal \n in the string
    // 2. Some preserve actual newlines which break JSON parsing
    // Replace literal escaped newlines in private_key with actual newlines
    const fixedJson = credentialsJson
      .replace(/\\\\n/g, '\\n') // Handle double-escaped newlines
      .replace(/\r?\n/g, '\\n'); // Handle actual newlines in the string
    
    credentials = JSON.parse(fixedJson);
    
    // Also fix the private_key if it has escaped newlines stored as text
    if (credentials.private_key && typeof credentials.private_key === 'string') {
      credentials.private_key = credentials.private_key.replace(/\\n/g, '\n');
    }
  } catch (parseError) {
    console.error('Failed to parse GOOGLE_APPLICATION_CREDENTIALS_JSON:', parseError);
    console.error('First 100 chars of JSON:', credentialsJson.substring(0, 100));
    throw new Error(`Failed to parse Google credentials: ${parseError instanceof Error ? parseError.message : 'Unknown error'}`);
  }
  
  // Create JWT for service account authentication
  const { GoogleAuth } = await import('google-auth-library');
  const auth = new GoogleAuth({
    credentials,
    scopes: ['https://www.googleapis.com/auth/cloud-platform'],
  });
  
  const client = await auth.getClient();
  const tokenResponse = await client.getAccessToken();
  
  if (!tokenResponse.token) {
    throw new Error('Failed to get access token');
  }
  
  return tokenResponse.token;
}

export async function POST({ request }) {
  const formData = await request.formData();
  const file = formData.get("audio") as File;
  const language = formData.get("language") as string | null; // "ar" or "en"
  const dialect = formData.get("dialect") as string | null; // e.g., "egyptian-arabic"

  if (!file) {
    return json({ error: "No file uploaded" }, { status: 400 });
  }

  // Determine language code - prefer dialect, fall back to language param
  let languageCode = 'ar-EG'; // Default to Egyptian Arabic
  if (dialect && dialectToLanguageCode[dialect]) {
    languageCode = dialectToLanguageCode[dialect];
  } else if (language && dialectToLanguageCode[language]) {
    languageCode = dialectToLanguageCode[language];
  }

  // Validate audio file size (minimum 1KB to avoid empty files)
  const arrayBuffer = await file.arrayBuffer();
  if (arrayBuffer.byteLength < 1000) {
    return json({ error: "Audio file is too small. Please ensure you recorded audio." }, { status: 400 });
  }

  // Use /tmp directory for Vercel compatibility
  const tmpDir = fs.existsSync('/tmp') ? '/tmp' : path.join(process.cwd(), "tmp");
  if (!fs.existsSync(tmpDir)) {
    fs.mkdirSync(tmpDir, { recursive: true });
  }

  const filePath = path.join(tmpDir, `audio_${Date.now()}_${file.name}`);
  const buffer = Buffer.from(arrayBuffer);
  fs.writeFileSync(filePath, new Uint8Array(arrayBuffer));

  console.log(`File saved: ${filePath}, transcribing in ${languageCode} using Chirp 3`);

  return await processAudioWithChirp3(filePath, buffer, file.type, file.name, languageCode, tmpDir);
}

async function processAudioWithChirp3(
  filePath: string,
  buffer: Buffer,
  originalMimeType: string,
  originalFileName: string,
  languageCode: string,
  tmpDir: string
) {
  let audioBuffer = buffer;
  let tempConvertedPath: string | null = null;
  const tempOriginalPath: string | null = filePath;

  try {
    // Convert WebM to FLAC for better quality with Chirp 3
    if (originalMimeType === 'audio/webm' || originalFileName.endsWith('.webm')) {
      console.log('Converting WebM to FLAC for Chirp 3...');
      const convertedPath = path.join(tmpDir, `converted_${Date.now()}.flac`);
      tempConvertedPath = convertedPath;
      
      try {
        await new Promise<void>((resolve, reject) => {
          ffmpeg(filePath)
            .toFormat('flac')
            .audioChannels(1) // Mono for speech
            .audioFrequency(16000) // 16kHz is optimal for speech
            .on('end', () => {
              console.log('WebM to FLAC conversion completed');
              audioBuffer = fs.readFileSync(convertedPath);
              resolve();
            })
            .on('error', (err) => {
              console.error('FFmpeg conversion error:', err);
              reject(err);
            })
            .save(convertedPath);
        });
      } catch (ffmpegError) {
        console.error('FFmpeg conversion failed, trying with original format:', ffmpegError);
        // Continue with original buffer
      }
    }

    // Get access token for Google Cloud API
    const accessToken = await getAccessToken();
    
    // Prepare the audio content as base64
    const audioContent = audioBuffer.toString('base64');

    console.log(`Transcribing with Chirp 3: language=${languageCode}, size=${audioBuffer.length} bytes`);

    // Use Speech-to-Text V2 REST API with Chirp 3
    const apiUrl = `https://${REGION}-speech.googleapis.com/v2/projects/${PROJECT_ID}/locations/${REGION}/recognizers/_:recognize`;
    
    const requestBody = {
      config: {
        autoDecodingConfig: {},
        languageCodes: [languageCode],
        model: 'chirp_3',
      },
      content: audioContent,
    };

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Chirp 3 API error:', response.status, errorText);
      throw new Error(`Chirp 3 API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();

    // Extract transcript
    const transcript = data.results
      ?.map((result: { alternatives?: Array<{ transcript?: string }> }) => 
        result.alternatives?.[0]?.transcript
      )
      .filter(Boolean)
      .join(' ')
      .trim() || '';

    // Log response for debugging
    console.log('Chirp 3 transcription result:', {
      hasText: !!transcript,
      textLength: transcript.length,
      text: transcript.substring(0, 100) + (transcript.length > 100 ? '...' : '')
    });

    if (transcript && transcript.length > 0) {
      // Clean up temporary files
      cleanupFiles(tempOriginalPath, tempConvertedPath);
      
      return json({ 
        text: transcript,
        languageCode: languageCode
      });
    } else {
      throw new Error("No speech detected in audio. Please ensure the audio contains clear speech and try again.");
    }

  } catch (error) {
    console.error(`Chirp 3 transcription error:`, error);
    console.error('Error details:', {
      errorType: error instanceof Error ? error.constructor.name : typeof error,
      errorMessage: error instanceof Error ? error.message : String(error),
      languageCode,
      audioFileName: originalFileName,
      audioSize: buffer.length
    });
    
    // Clean up temporary files on error
    cleanupFiles(tempOriginalPath, tempConvertedPath);
    
    const errorMessage = error instanceof Error ? error.message : "Failed to transcribe";
    return json({ error: errorMessage }, { status: 500 });
  }
}

function cleanupFiles(originalPath: string | null, convertedPath: string | null) {
  if (originalPath && fs.existsSync(originalPath)) {
    try {
      fs.unlinkSync(originalPath);
    } catch (cleanupError) {
      console.error('Error cleaning up original file:', cleanupError);
    }
  }
  
  if (convertedPath && fs.existsSync(convertedPath)) {
    try {
      fs.unlinkSync(convertedPath);
    } catch (cleanupError) {
      console.error('Error cleaning up converted file:', cleanupError);
    }
  }
}
