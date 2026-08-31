# Porting Speaking Exercises to a React App

How speaking/pronunciation grading works in parallel-arabic, and how to rebuild it in a multi-language React app.

Target languages: **Spanish, French, Arabic (MSA/fusha), Egyptian Arabic, Levantine Arabic, Moroccan Arabic (Darija)** — two Latin-script languages and four Arabic-script variants.

## What it actually is

There's no acoustic or phoneme-level scoring. Three steps:

1. Record audio in the browser (`MediaRecorder` → webm blob).
2. Send it to a server route that calls Google Cloud Speech-to-Text v2 (`chirp_3`) and returns a transcript.
3. Compare the transcript to the expected string with normalized Levenshtein distance, render as a percentage.

The score answers *"did the recognizer hear the words you were supposed to say"* — not *"how native does this sound."* If you need true pronunciation assessment (per-phoneme accuracy, fluency, prosody), this design won't get you there; Azure Speech has a dedicated pronunciation-assessment API, Google STT does not.

## Source material

| Piece | Where it lives here |
|---|---|
| STT server route | `src/routes/api/speech-to-text/+server.ts` |
| Text normalization | `src/lib/utils/arabic-normalization.ts` |
| Cleanest client reference | `src/routes/alphabet-new/components/SpeakingExercise.svelte` |

The server route is the genuinely reusable part. The client is ~110 lines worth rewriting as a React hook rather than translating.

---

## 1. Language configuration

One table, shared by client and server. Everything language-specific hangs off it.

```ts
// lib/languages.ts
export type LanguageId =
  | 'spanish' | 'french'
  | 'fusha' | 'egyptian-arabic' | 'levantine' | 'darija';

export type LanguageConfig = {
  label: string;
  bcp47: string;          // what Google STT wants
  script: 'latin' | 'arabic';
  passThreshold: number;
};

export const LANGUAGES: Record<LanguageId, LanguageConfig> = {
  spanish:           { label: 'Spanish',          bcp47: 'es-ES', script: 'latin',  passThreshold: 70 },
  french:            { label: 'French',           bcp47: 'fr-FR', script: 'latin',  passThreshold: 70 },
  fusha:             { label: 'Arabic (MSA)',     bcp47: 'ar-SA', script: 'arabic', passThreshold: 70 },
  'egyptian-arabic': { label: 'Egyptian Arabic',  bcp47: 'ar-EG', script: 'arabic', passThreshold: 70 },
  levantine:         { label: 'Levantine Arabic', bcp47: 'ar-LB', script: 'arabic', passThreshold: 70 },
  darija:            { label: 'Moroccan Darija',  bcp47: 'ar-MA', script: 'arabic', passThreshold: 70 },
};
```

The BCP-47 codes are carried over from the existing route's `dialectToLanguageCode` map, which has `ar-EG`, `ar-LB`, `ar-SA`, `ar-MA` in production use. `es-ES` vs `es-MX` and `fr-FR` vs `fr-CA` are a product call — pick whichever accent your audio prompts use, since the recognizer's output spelling is otherwise identical.

Two caveats on the Arabic variants worth knowing before you promise per-dialect accuracy:

- **Darija (`ar-MA`) is the weak one.** Moroccan is far enough from MSA that recognition quality is noticeably lower, and heavy French/Berber code-switching gets transcribed unpredictably. Expect scores to skew low; consider a lower pass threshold for it once you have real data.
- **Fusha (`ar-SA`) transcripts come back without tashkeel** even when the prompt has full vowelling. The normalizer below handles this, but it's the single most common source of bogus 60% scores if you skip normalization.

---

## 2. Server: transcription endpoint

Port `src/routes/api/speech-to-text/+server.ts`. The only framework-specific parts are the `json()` helper and the `POST({ request })` signature — everything else is plain `fetch`/`FormData`, so it drops into a Next.js route handler, Express, or Hono with trivial edits.

**Contract**: `multipart/form-data` with `audio` (File) and `language` (a `LanguageId`) → `{ text, bcp47 }` or `{ error }`.

```ts
// app/api/speech-to-text/route.ts
import { GoogleAuth } from 'google-auth-library';
import { LANGUAGES, type LanguageId } from '@/lib/languages';

const PROJECT_ID = process.env.GOOGLE_CLOUD_PROJECT;
const REGION = 'us';

async function getAccessToken(): Promise<string> {
  const raw = process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON;
  if (!raw) throw new Error('GOOGLE_APPLICATION_CREDENTIALS_JSON not set');

  // Env stores mangle the newlines inside the PEM private key. Re-escape
  // before parsing, then unescape the key itself.
  const credentials = JSON.parse(raw.replace(/\\\\n/g, '\\n').replace(/\r?\n/g, '\\n'));
  credentials.private_key = credentials.private_key.replace(/\\n/g, '\n');

  const auth = new GoogleAuth({
    credentials,
    scopes: ['https://www.googleapis.com/auth/cloud-platform'],
  });
  const token = await (await auth.getClient()).getAccessToken();
  if (!token.token) throw new Error('Failed to get access token');
  return token.token;
}

export async function POST(request: Request) {
  const form = await request.formData();
  const file = form.get('audio') as File | null;
  const language = String(form.get('language') ?? '') as LanguageId;
  const config = LANGUAGES[language];

  if (!file) return Response.json({ error: 'No file uploaded' }, { status: 400 });
  if (!config) return Response.json({ error: 'Unsupported language' }, { status: 400 });

  const buffer = Buffer.from(await file.arrayBuffer());
  // Catches empty / failed recordings before spending an API call.
  if (buffer.byteLength < 1000)
    return Response.json({ error: 'Audio too short. Try recording again.' }, { status: 400 });

  const accessToken = await getAccessToken();
  const res = await fetch(
    `https://${REGION}-speech.googleapis.com/v2/projects/${PROJECT_ID}/locations/${REGION}/recognizers/_:recognize`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        config: {
          autoDecodingConfig: {},
          languageCodes: [config.bcp47],
          model: 'chirp_3',
        },
        content: buffer.toString('base64'),
      }),
    },
  );

  if (!res.ok) {
    console.error('STT error', res.status, await res.text());
    return Response.json({ error: 'Transcription failed' }, { status: 502 });
  }

  const data = await res.json();
  const text: string = (data.results ?? [])
    .map((r: any) => r.alternatives?.[0]?.transcript)
    .filter(Boolean)
    .join(' ')
    .trim();

  if (!text) return Response.json({ error: 'No speech detected' }, { status: 422 });
  return Response.json({ text, bcp47: config.bcp47 });
}
```

Load-bearing details carried over from the original:

- The region appears twice (hostname and URL path) and the two must match.
- `autoDecodingConfig: {}` lets Google sniff the container, so you never declare encoding, sample rate, or channel count. This is why `audio/webm` from Chrome and `audio/mp4` from Safari both work with no branching.
- `chirp_3` covers all six languages. Check [Google's language/model matrix](https://cloud.google.com/speech-to-text/v2/docs/speech-to-text-supported-languages) before adding a seventh — coverage varies by model *and* region.

Two things the original does that you shouldn't reproduce: it has **no auth and no rate limiting** (a paid API on an open endpoint), and it falls back to a hardcoded project ID when the env var is missing instead of failing loudly.

### Environment

| Var | Purpose |
|---|---|
| `GOOGLE_APPLICATION_CREDENTIALS_JSON` | Service-account key JSON, single-line |
| `GOOGLE_CLOUD_PROJECT` | GCP project ID |

In GCP: enable the Speech-to-Text API, create a service account with the Speech-to-Text User role, download a JSON key.

---

## 3. Scoring

Use **one** implementation. The current codebase has this formula copy-pasted across six components with subtly different normalization; that divergence is the main thing not to repeat.

```ts
// lib/pronunciation.ts
import levenshtein from 'fast-levenshtein';
import { LANGUAGES, type LanguageId } from './languages';

export function normalize(text: string, language: LanguageId): string {
  const { script, bcp47 } = LANGUAGES[language];

  let t = text
    .replace(/[\p{P}\p{S}]/gu, '')   // punctuation + symbols (incl. ، ؟ and .)
    .replace(/\s+/g, ' ')
    .trim();

  if (script === 'arabic') {
    t = t
      .replace(/[ً-ْٰ]/g, '')  // tashkeel / diacritics
      .replace(/ـ/g, '')                 // tatweel
      .replace(/[آأإ]/g, 'ا')  // آ أ إ → ا
      .replace(/ة/g, 'ه')           // ة → ه
      .replace(/[ئؤ]/g, 'ء')   // ئ ؤ → ء
      .replace(/ى/g, 'ي');          // ى → ي
  } else {
    t = t
      .normalize('NFD')
      .replace(/\p{M}/gu, '')                 // é → e, ñ → n, ç → c
      .toLocaleLowerCase(bcp47);
  }

  return t;
}

export function scorePronunciation(
  transcript: string,
  expected: string,
  language: LanguageId,
): number {
  const t = normalize(transcript, language);
  const e = normalize(expected, language);
  if (!t || !e) return 0;
  if (t === e) return 100;

  const distance = levenshtein.get(e, t);
  const maxLength = Math.max(e.length, t.length);
  return Math.max(0, Math.round((1 - distance / maxLength) * 100));
}
```

**Always normalize both sides.** This is the highest-value correction to carry over: four of the six existing call sites here skip normalization and only strip `.`, so learners lose points because the recognizer emitted different tashkeel than the lesson text. That's an orthography penalty dressed up as a pronunciation score.

The Arabic branch is ported from `normalizeArabicText` in `src/lib/utils/arabic-normalization.ts` and folds exactly the variants that STT output legitimately disagrees with lesson text on. The Latin branch strips accents, which is deliberately forgiving — `é`/`e` and `ñ`/`n` *are* real phonemic distinctions in French and Spanish, but the recognizer spells them deterministically, so stripping only ever buys leniency on the lesson-text side. If you later want French accents to count, gate it per language rather than adding a second scorer.

Two smaller notes: `toLocaleLowerCase` (not `toLowerCase`) is only meaningful if you ever add Turkish, but it costs nothing now; and `levenshtein.get` compares UTF-16 code units, which is fine for all six of these scripts since everything sits in the BMP.

### Feedback bands

Shared across every component here:

| Score | Label | Emoji |
|---|---|---|
| ≥ 90 | Excellent! | 🎉 |
| ≥ 75 | Great job! | 👏 |
| ≥ 60 | Good effort! | 👍 |
| ≥ 40 | Keep practicing! | 💪 |
| < 40 | Try again! | 🔄 |

Pass thresholds in this repo are inconsistent — 60 in the tutor, 75 in conjugation practice, none elsewhere. The config table above gives you one per language instead.

### Skip the word-level scorer

`src/routes/tutor/+page.svelte:574` has a second scorer that counts how many transcript words appear in the expected sentence. It's harsh — one wrong letter zeroes a whole word — and a comment at line 285 documents that it had to be abandoned for single-word prompts. Port the character-level version only.

---

## 4. React client

Put the recorder in a hook; keep components presentational.

```tsx
// hooks/useSpeakingExercise.ts
import { useCallback, useEffect, useRef, useState } from 'react';
import { scorePronunciation } from '@/lib/pronunciation';
import type { LanguageId } from '@/lib/languages';

type Status = 'idle' | 'recording' | 'transcribing' | 'done' | 'error';

export function useSpeakingExercise(expected: string, language: LanguageId) {
  const [status, setStatus] = useState<Status>('idle');
  const [transcript, setTranscript] = useState('');
  const [score, setScore] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const reset = useCallback(() => {
    setStatus('idle');
    setTranscript('');
    setScore(null);
    setError(null);
  }, []);

  const start = useCallback(async () => {
    reset();
    let stream: MediaStream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch {
      setStatus('error');
      setError('Microphone access is blocked. Enable it in your browser settings.');
      return;
    }

    chunksRef.current = [];
    const recorder = new MediaRecorder(stream);
    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunksRef.current.push(e.data);
    };
    recorder.onstop = async () => {
      // Always release the tracks, or the browser's recording indicator stays lit.
      stream.getTracks().forEach((t) => t.stop());
      setStatus('transcribing');
      try {
        const blob = new Blob(chunksRef.current, { type: recorder.mimeType });
        const form = new FormData();
        form.append('audio', new File([blob], 'recording.webm', { type: recorder.mimeType }));
        form.append('language', language);

        const res = await fetch('/api/speech-to-text', { method: 'POST', body: form });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? 'Transcription failed');

        setTranscript(data.text);
        setScore(scorePronunciation(data.text, expected, language));
        setStatus('done');
      } catch (e) {
        setStatus('error');
        setError(e instanceof Error ? e.message : 'Something went wrong.');
      }
    };

    recorder.start();
    recorderRef.current = recorder;
    setStatus('recording');
  }, [expected, language, reset]);

  const stop = useCallback(() => recorderRef.current?.stop(), []);

  // Stop a live recording if the component unmounts mid-take.
  useEffect(() => () => {
    const r = recorderRef.current;
    if (r && r.state !== 'inactive') r.stop();
  }, []);

  return { status, transcript, score, error, start, stop, reset };
}
```

Details that matter, most of them things the Svelte components here get wrong:

- **Release the mic tracks in `onstop`** — forgetting leaves the recording indicator lit.
- **Reset `score` and `transcript` when the prompt changes**, or a stale score renders against the new word. `key={promptId}` on the exercise component is the simplest guarantee.
- **Score once, in the handler.** Several components here compute it in a reactive effect keyed on the transcript, which fires on unrelated re-renders; the React equivalent (`useEffect` on `transcript`) has the same problem plus an extra render.
- **Surface mic-permission denial as UI state.** The alphabet component swallows it into `console.error` and the user just sees nothing happen.
- **Use `recorder.mimeType`** rather than hardcoding `audio/webm`; Safari gives `audio/mp4` and the server decodes either.
- **Guard against unmount mid-recording** — React's dev-mode double-mount surfaces this immediately.
- Render Arabic prompts with `dir="rtl"`, Spanish/French `dir="ltr"`. Drive it off `script` in the config rather than hardcoding per component.
- Render with `Math.round()`; the raw value is fractional.

---

## Port checklist

1. `npm i fast-levenshtein google-auth-library` + `-D @types/fast-levenshtein`.
2. Enable Speech-to-Text in GCP, create the service account, set both env vars.
3. Add `lib/languages.ts` with the six-language table.
4. Port the STT route; take a `LanguageId` from the client and resolve BCP-47 server-side; add auth + rate limiting; fail loudly on a missing project ID.
5. Write one `lib/pronunciation.ts` — `normalize`, `scorePronunciation`, `getFeedback` — and import it everywhere.
6. Build `useSpeakingExercise` against it.
7. Verify, per language:
   - identical text → 100
   - correct speech, prompt has tashkeel but transcript doesn't → 100 *(the test that catches a missing `normalize` call)*
   - correct Spanish/French speech with accents stripped from one side → 100
   - silence → an error state, not a 0%
   - record a real Darija sample early; if scores are systematically low, tune `passThreshold` for `darija` rather than loosening the scorer for everyone
