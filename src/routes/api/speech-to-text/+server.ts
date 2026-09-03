import { json } from "@sveltejs/kit";
import { env } from '$env/dynamic/private';
import { consumeRateLimit } from '$lib/server/redis';

/**
 * Transcription is billed per call and this endpoint is reachable from
 * prerendered vocabulary pages that we actively ask Google to index, so it is
 * open to anyone who finds the URL.
 *
 * Two limits, doing different jobs:
 * - the cookie is the UX allowance, mirroring ANON_TTS_LIMIT in
 *   /api/text-to-speech: a signed-out visitor gets a full practice round before
 *   being asked to sign up.
 * - the IP window is the actual cost ceiling, since a cookie stops nobody with
 *   a script.
 */
const ANON_SPEECH_LIMIT = 8;
const ANON_SPEECH_COOKIE = 'anon_speech_attempts';
const IP_SPEECH_LIMIT = 60;
const IP_SPEECH_WINDOW_SECONDS = 3600;

const dialectToLanguageCode: Record<string, string> = {
  'egyptian-arabic': 'ar-EG',
  'levantine': 'ar-LB',
  'fusha': 'ar-SA',
  'darija': 'ar-MA',
  'khaleeji': 'ar-AE',
  'ar': 'ar-EG',
  'en': 'en-US'
};

const PROJECT_ID = env.GOOGLE_CLOUD_PROJECT || 'gen-lang-client-0898024045';
const REGION = 'us';

async function getAccessToken(): Promise<string> {
  const credentialsJson = env.GOOGLE_APPLICATION_CREDENTIALS_JSON;
  
  if (!credentialsJson) {
    throw new Error('GOOGLE_APPLICATION_CREDENTIALS_JSON not set');
  }
  
  let credentials;
  try {
    const fixedJson = credentialsJson
      .replace(/\\\\n/g, '\\n')
      .replace(/\r?\n/g, '\\n');
    
    credentials = JSON.parse(fixedJson);
    
    if (credentials.private_key && typeof credentials.private_key === 'string') {
      credentials.private_key = credentials.private_key.replace(/\\n/g, '\n');
    }
  } catch (parseError) {
    console.error('Failed to parse GOOGLE_APPLICATION_CREDENTIALS_JSON:', parseError);
    console.error('First 100 chars of JSON:', credentialsJson.substring(0, 100));
    throw new Error(`Failed to parse Google credentials: ${parseError instanceof Error ? parseError.message : 'Unknown error'}`);
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

export async function POST({ request, locals, cookies, getClientAddress }) {
  // The project has no App.Locals declaration, so `locals` is untyped here and
  // in every other endpoint that reads it. Narrowed locally rather than adding
  // another `Property 'user' does not exist on type 'Locals'` to the pile.
  const { user } = locals as { user?: { id: string } | null };
  const isSignedIn = !!user;

  const ip = getClientAddress();
  const { allowed } = await consumeRateLimit(
    `speech-to-text:ip:${ip}`,
    IP_SPEECH_LIMIT,
    IP_SPEECH_WINDOW_SECONDS
  );

  if (!allowed) {
    return json({ error: 'Too many requests. Please try again later.' }, { status: 429 });
  }

  let anonAttempts = 0;
  if (!isSignedIn) {
    anonAttempts = Number(cookies.get(ANON_SPEECH_COOKIE)) || 0;

    if (anonAttempts >= ANON_SPEECH_LIMIT) {
      return json({
        error: 'Subscription required',
        message: `You've used your ${ANON_SPEECH_LIMIT} free speaking attempts. Sign up to keep practicing.`,
        requiresSubscription: true
      }, { status: 403 });
    }
  }

  const formData = await request.formData();
  const file = formData.get("audio") as File;
  const language = formData.get("language") as string | null;
  const dialect = formData.get("dialect") as string | null;

  if (!file) {
    return json({ error: "No file uploaded" }, { status: 400 });
  }

  let languageCode = 'ar-EG';
  if (dialect && dialectToLanguageCode[dialect]) {
    languageCode = dialectToLanguageCode[dialect];
  } else if (language && dialectToLanguageCode[language]) {
    languageCode = dialectToLanguageCode[language];
  }

  const arrayBuffer = await file.arrayBuffer();
  if (arrayBuffer.byteLength < 1000) {
    return json({ error: "Audio file is too small. Please ensure you recorded audio." }, { status: 400 });
  }

  const buffer = Buffer.from(arrayBuffer);

  try {
    const accessToken = await getAccessToken();
    const audioContent = buffer.toString('base64');

    console.log(`Transcribing with Chirp 3: language=${languageCode}, size=${buffer.length} bytes`);

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

    const transcript = data.results
      ?.map((result: { alternatives?: Array<{ transcript?: string }> }) => 
        result.alternatives?.[0]?.transcript
      )
      .filter(Boolean)
      .join(' ')
      .trim() || '';

    console.log('Chirp 3 transcription result:', {
      hasText: !!transcript,
      textLength: transcript.length,
      text: transcript.substring(0, 100) + (transcript.length > 100 ? '...' : '')
    });

    if (transcript && transcript.length > 0) {
      // Only a successful transcription costs an attempt — a recording that
      // picked up nothing but room noise shouldn't burn the allowance.
      if (!isSignedIn) {
        cookies.set(ANON_SPEECH_COOKIE, String(anonAttempts + 1), {
          path: '/',
          httpOnly: true,
          sameSite: 'lax',
          maxAge: 60 * 60 * 24 * 30
        });
      }

      return json({ text: transcript, languageCode });
    } else {
      throw new Error("No speech detected in audio. Please ensure the audio contains clear speech and try again.");
    }
  } catch (error) {
    console.error('Chirp 3 transcription error:', error);
    console.error('Error details:', {
      errorType: error instanceof Error ? error.constructor.name : typeof error,
      errorMessage: error instanceof Error ? error.message : String(error),
      languageCode,
      audioSize: buffer.length
    });
    
    const errorMessage = error instanceof Error ? error.message : "Failed to transcribe";
    return json({ error: errorMessage }, { status: 500 });
  }
}
