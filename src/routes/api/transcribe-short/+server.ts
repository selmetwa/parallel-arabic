import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { env } from '$env/dynamic/private';
import { GoogleGenAI } from '@google/genai';
import { generateContentWithRetry } from '$lib/utils/gemini-api-retry';
import ytdl from '@distube/ytdl-core';
import ffmpeg from 'fluent-ffmpeg';
import fs from 'fs';
import path from 'path';
import { Readable } from 'stream';

interface VocabWord {
  arabic: string;
  english: string;
  transliteration: string;
  partOfSpeech: string;
}

interface TranscriptResult {
  lines: Array<{
    arabic: string;
    english: string;
    transliteration: string;
  }>;
  vocabulary: VocabWord[];
  hasTranscript: boolean;
  source: 'speech-to-text' | 'youtube-captions';
  rawTranscript?: string;
}

// Map dialects to Chirp 3 language codes
const dialectToLanguageCode: Record<string, string> = {
  'egyptian-arabic': 'ar-EG',
  'levantine': 'ar-LB',
  'fusha': 'ar-SA',
  'darija': 'ar-MA',
  'khaleeji': 'ar-AE',
};

const PROJECT_ID = env.GOOGLE_CLOUD_PROJECT || 'gen-lang-client-0898024045';
const REGION = 'us';

// Get access token for Chirp 3
async function getAccessToken(): Promise<string> {
  const credentialsJson = env.GOOGLE_APPLICATION_CREDENTIALS_JSON;
  if (!credentialsJson) {
    throw new Error('GOOGLE_APPLICATION_CREDENTIALS_JSON not set');
  }
  
  let credentials;
  
  // Try multiple parsing strategies
  const strategies = [
    // Strategy 1: Parse as-is
    () => JSON.parse(credentialsJson),
    
    // Strategy 2: Replace actual newlines with \n escape sequence first
    () => JSON.parse(credentialsJson.replace(/\r?\n/g, '\\n')),
    
    // Strategy 3: Handle double-escaped newlines
    () => JSON.parse(credentialsJson.replace(/\\\\n/g, '\\n').replace(/\r?\n/g, '\\n')),
    
    // Strategy 4: The env var might have real newlines that need escaping
    () => {
      // Find the private_key value and properly escape newlines within it
      const fixed = credentialsJson.replace(
        /(-----BEGIN[^"]*-----)([\s\S]*?)(-----END[^"]*-----)/g,
        (match, begin, middle, end) => {
          return begin + middle.replace(/\n/g, '\\n') + end;
        }
      );
      return JSON.parse(fixed);
    },
    
    // Strategy 5: Base64 decode if the whole thing is base64 encoded
    () => {
      if (/^[A-Za-z0-9+/=]+$/.test(credentialsJson.trim())) {
        const decoded = Buffer.from(credentialsJson, 'base64').toString('utf-8');
        return JSON.parse(decoded);
      }
      throw new Error('Not base64');
    }
  ];
  
  let lastError: Error | null = null;
  
  for (let i = 0; i < strategies.length; i++) {
    try {
      credentials = strategies[i]();
      console.log(`[transcribe-short] Parsed credentials using strategy ${i + 1}`);
      break;
    } catch (e) {
      lastError = e instanceof Error ? e : new Error(String(e));
      // Continue to next strategy
    }
  }
  
  if (!credentials) {
    console.error('[transcribe-short] All parsing strategies failed');
    console.error('[transcribe-short] Last error:', lastError?.message);
    console.error('[transcribe-short] Chars around position 174:', credentialsJson.substring(170, 180));
    throw new Error(`Failed to parse Google credentials: ${lastError?.message || 'Unknown error'}`);
  }
  
  // Fix the private_key if it has escaped newlines stored as text
  if (credentials.private_key && typeof credentials.private_key === 'string') {
    credentials.private_key = credentials.private_key.replace(/\\n/g, '\n');
  }
  
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

// Download and convert audio from YouTube
async function downloadAndConvertAudio(videoId: string, outputPath: string): Promise<void> {
  const videoUrl = `https://www.youtube.com/watch?v=${videoId}`;
  
  console.log(`[transcribe-short] Downloading audio for ${videoId}...`);
  
  // Check if video is available
  const info = await ytdl.getInfo(videoUrl);
  console.log(`[transcribe-short] Video title: ${info.videoDetails.title}`);
  console.log(`[transcribe-short] Duration: ${info.videoDetails.lengthSeconds}s`);
  
  // Get audio stream
  const audioStream = ytdl(videoUrl, {
    filter: 'audioonly',
    quality: 'lowestaudio', // Smaller file, faster processing
  });
  
  // Convert to FLAC format required by Chirp 3
  return new Promise<void>((resolve, reject) => {
    ffmpeg(audioStream)
      .outputOptions([
        '-f flac',     // FLAC format
        '-ac 1',       // Mono audio
        '-ar 16000'    // 16 kHz sample rate
      ])
      .on('start', (cmd) => {
        console.log(`[transcribe-short] FFmpeg started: ${cmd.substring(0, 100)}...`);
      })
      .on('progress', (progress) => {
        if (progress.percent) {
          console.log(`[transcribe-short] Converting: ${Math.round(progress.percent)}%`);
        }
      })
      .on('end', () => {
        console.log(`[transcribe-short] Audio conversion complete`);
        resolve();
      })
      .on('error', (err) => {
        console.error(`[transcribe-short] FFmpeg error:`, err);
        reject(err);
      })
      .save(outputPath);
  });
}

// Transcribe audio using Google Chirp 3 with multi-language support
async function transcribeWithChirp3(audioPath: string, primaryLanguageCode: string): Promise<{ transcript: string; detectedLanguage: string }> {
  console.log(`[transcribe-short] Transcribing with Chirp 3 (primary: ${primaryLanguageCode})...`);
  
  const audioBuffer = fs.readFileSync(audioPath);
  const audioContent = audioBuffer.toString('base64');
  
  console.log(`[transcribe-short] Audio size: ${(audioBuffer.length / 1024).toFixed(1)} KB`);
  
  const accessToken = await getAccessToken();
  
  const apiUrl = `https://${REGION}-speech.googleapis.com/v2/projects/${PROJECT_ID}/locations/${REGION}/recognizers/_:recognize`;
  
  // Enable multi-language detection: Arabic dialect + English
  // This handles videos where narrator speaks English but teaches Arabic
  const languageCodes = [primaryLanguageCode, 'en-US'];
  
  const requestBody = {
    config: {
      autoDecodingConfig: {},
      languageCodes: languageCodes,
      model: 'chirp_3',
      features: {
        enableWordTimeOffsets: true,
        enableAutomaticPunctuation: true,
      },
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
    console.error(`[transcribe-short] Chirp 3 error: ${response.status}`, errorText);
    throw new Error(`Chirp 3 API error: ${response.status} - ${errorText}`);
  }
  
  const data = await response.json();
  
  // Extract full transcript and detected language
  let detectedLanguage = 'unknown';
  const transcript = data.results
    ?.map((result: { alternatives?: Array<{ transcript?: string }>; languageCode?: string }) => {
      // Track the detected language
      if (result.languageCode) {
        detectedLanguage = result.languageCode;
      }
      return result.alternatives?.[0]?.transcript;
    })
    .filter(Boolean)
    .join(' ')
    .trim() || '';
  
  console.log(`[transcribe-short] Transcript (${detectedLanguage}): ${transcript.substring(0, 100)}...`);
  
  return { transcript, detectedLanguage };
}

// Format transcript with Gemini (extract Arabic vocabulary from any language content)
async function formatWithGemini(
  transcript: string,
  detectedLanguage: string,
  ai: GoogleGenAI
): Promise<{ lines: TranscriptResult['lines']; vocabulary: VocabWord[] }> {
  console.log(`[transcribe-short] Formatting with Gemini (detected language: ${detectedLanguage})...`);
  
  // Different prompts based on whether content is Arabic or English (educational)
  const isEnglishContent = detectedLanguage.startsWith('en') || 
    /\b(learn|arabic|word|words|phrase|phrases|vocabulary|how to say|means)\b/i.test(transcript);
  
  let systemPrompt: string;
  
  if (isEnglishContent) {
    // English educational content - extract Arabic vocabulary being taught
    systemPrompt = `You are an Arabic language expert analyzing an ENGLISH language learning video transcript.

TRANSCRIPT:
${transcript}

This appears to be a video where someone is TEACHING Arabic vocabulary in English.

Your task:
1. Identify ALL Arabic words/phrases being taught in this video
2. For each Arabic word mentioned (even if spoken in transliterated form like "Sa'a", "Shukran", etc.):
   - arabic: The word in Arabic script (e.g., "ساعة", "شكرا")
   - english: What the word means
   - transliteration: How to pronounce it

3. Create "lines" that show what's being taught:
   - For each vocabulary item taught, create a line entry

4. Create a vocabulary list with ALL Arabic words/phrases taught:
   - arabic: Arabic script
   - english: English meaning
   - transliteration: Pronunciation guide
   - partOfSpeech: "noun", "verb", "adjective", "phrase", "expression", or "greeting"

Return JSON:
{
  "lines": [
    { "arabic": "ساعة", "english": "hour / watch / clock", "transliteration": "sa'a" }
  ],
  "vocabulary": [
    { "arabic": "ساعة", "english": "hour / watch / clock", "transliteration": "sa'a", "partOfSpeech": "noun" }
  ]
}

IMPORTANT: 
- Convert transliterated words (like "Sa'a") to proper Arabic script (ساعة)
- Include ALL Arabic words mentioned, even if repeated
- Focus on Egyptian Arabic style
- If no Arabic vocabulary is found, return empty arrays`;
  } else {
    // Arabic content - format for learners
    systemPrompt = `You are an Arabic language expert. Format this transcribed Arabic text for language learners.

TRANSCRIPT:
${transcript}

Your task:
1. Break the transcript into logical sentences/phrases
2. For each line, provide:
   - arabic: The Arabic text
   - english: English translation
   - transliteration: Latin letter pronunciation

3. Extract 5-10 key vocabulary words that would be useful for learners:
   - arabic: The word in Arabic
   - english: English meaning
   - transliteration: Pronunciation
   - partOfSpeech: "noun", "verb", "adjective", "adverb", "phrase", or "expression"

Return JSON:
{
  "lines": [
    { "arabic": "مرحبا", "english": "Hello", "transliteration": "marhaba" }
  ],
  "vocabulary": [
    { "arabic": "كلمة", "english": "word", "transliteration": "kelma", "partOfSpeech": "noun" }
  ]
}

Keep translations natural and conversational. Focus on Egyptian/colloquial Arabic style.`;
  }

  const response = await generateContentWithRetry(ai, {
    model: 'gemini-2.0-flash',
    contents: systemPrompt,
    // @ts-expect-error - generationConfig types may be outdated
    generationConfig: {
      temperature: 0.3,
      maxOutputTokens: 3000,
      responseMimeType: 'application/json'
    }
  });

  const result = response.text;
  if (!result) {
    throw new Error('No response from Gemini');
  }

  try {
    const parsed = JSON.parse(result);
    return {
      lines: parsed.lines || [],
      vocabulary: parsed.vocabulary || []
    };
  } catch (e) {
    console.error('[transcribe-short] Failed to parse Gemini response:', e);
    // Return raw transcript as single line
    return {
      lines: [{ arabic: transcript, english: '', transliteration: '' }],
      vocabulary: []
    };
  }
}

// Cleanup temp files
function cleanup(...paths: string[]) {
  for (const p of paths) {
    if (p && fs.existsSync(p)) {
      try {
        fs.unlinkSync(p);
      } catch (e) {
        console.error(`[transcribe-short] Cleanup error for ${p}:`, e);
      }
    }
  }
}

export const GET: RequestHandler = async ({ url }) => {
  const videoId = url.searchParams.get('videoId');
  const dialect = url.searchParams.get('dialect') || 'egyptian-arabic';

  if (!videoId) {
    return json({ error: 'Video ID is required' }, { status: 400 });
  }

  // Validate video ID format
  if (!/^[a-zA-Z0-9_-]{11}$/.test(videoId)) {
    return json({ error: 'Invalid YouTube video ID format' }, { status: 400 });
  }

  const tempAudioPath = path.join(process.cwd(), `temp_short_${videoId}_${Date.now()}.flac`);

  try {
    const apiKey = env['GEMINI_API_KEY'];
    if (!apiKey) {
      return json({ error: 'GEMINI_API_KEY not configured' }, { status: 500 });
    }

    const languageCode = dialectToLanguageCode[dialect] || 'ar-EG';

    // 1. Download and convert audio
    await downloadAndConvertAudio(videoId, tempAudioPath);

    // 2. Transcribe with Chirp 3 (multi-language: Arabic + English)
    const { transcript: rawTranscript, detectedLanguage } = await transcribeWithChirp3(tempAudioPath, languageCode);

    if (!rawTranscript || rawTranscript.length === 0) {
      cleanup(tempAudioPath);
      return json({
        lines: [],
        vocabulary: [],
        hasTranscript: false,
        source: 'speech-to-text',
        error: 'No speech detected in video'
      });
    }

    // 3. Format with Gemini (handles both Arabic content and English educational content)
    const ai = new GoogleGenAI({ apiKey });
    const formatted = await formatWithGemini(rawTranscript, detectedLanguage, ai);

    cleanup(tempAudioPath);

    const result: TranscriptResult = {
      lines: formatted.lines,
      vocabulary: formatted.vocabulary,
      hasTranscript: true,
      source: 'speech-to-text',
      rawTranscript
    };

    return json(result);

  } catch (error) {
    cleanup(tempAudioPath);
    console.error('[transcribe-short] Error:', error);
    
    const message = error instanceof Error ? error.message : 'Unknown error';
    
    return json({
      error: `Transcription failed: ${message}`,
      hasTranscript: false,
      source: 'speech-to-text'
    }, { status: 500 });
  }
};

