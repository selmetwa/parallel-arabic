import { json } from '@sveltejs/kit';
import type { RequestHandler } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';
import OpenAI from 'openai';
import fs from 'fs';
import path from 'path';

const OPENAI_API_KEY = env.OPEN_API_KEY;

interface TranscriptSentence {
  arabic: string;
  english: string;
  transliteration: string;
}

interface EnhancedTranscriptResponse {
  transcript: string;
  sentences: TranscriptSentence[];
  transcriptSource: string;
  originalFileName: string;
  fileSize: number;
  fileType: string;
}

async function aiSentenceSegmentation(arabicText: string, openai: OpenAI): Promise<string[]> {
  try {
    console.log('Starting AI-powered sentence segmentation...');
    
    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: `You are an expert Arabic linguist. Your task is to split Arabic transcripts into natural, well-formed sentences. 

IMPORTANT GUIDELINES:
- Consider natural speech pauses and breathing points
- Respect Arabic grammar and semantic meaning
- Aim for sentences between 20-150 characters each
- Split at logical thought boundaries
- Handle run-on sentences by finding natural break points
- Preserve the original meaning and context
- Remove any incomplete fragments or filler words

Return your response as a JSON object with a "sentences" array containing the segmented sentences.`
        },
        {
          role: 'user',
          content: `Please segment this Arabic transcript into natural sentences:

"${arabicText}"

Format as: {"sentences": ["sentence1", "sentence2", ...]}`
        }
      ],
      response_format: { type: 'json_object' },
      temperature: 0.2,
      max_tokens: 3000
    });

    const content = response.choices[0].message.content;
    if (content) {
      const result = JSON.parse(content);
      const sentences = result.sentences || [];
      
      // Filter and clean sentences
      const cleanedSentences = sentences
        .map((s: string) => s.trim());
      
      console.log(`AI segmentation completed: ${cleanedSentences.length} sentences from original text`);
      return cleanedSentences;
    }
    
    throw new Error('No content in AI response');
  } catch (error) {
    console.error('AI segmentation failed, falling back to regex:', error);
    
    // Fallback to enhanced regex if AI fails
    return enhancedRegexSegmentation(arabicText);
  }
}

function enhancedRegexSegmentation(arabicText: string): string[] {
  // Enhanced fallback with better punctuation handling
  const sentences = arabicText
    .split(/[.!?؟۔،؛]/) // Include more Arabic punctuation
    .map(s => s.trim())
  
  // Handle overly long sentences by splitting on conjunctions
  const finalSentences: string[] = [];
  const maxLength = 180;
  
  for (const sentence of sentences) {
    if (sentence.length <= maxLength) {
      finalSentences.push(sentence);
    } else {
      // Split long sentences on Arabic connectors
      const parts = sentence
        .split(/\s+(و|لكن|ولكن|ثم|فإن|لذلك|بعد ذلك|أيضا|كذلك|من ناحية أخرى)\s+/)
        .filter(s => s.length > 5);
      finalSentences.push(...parts);
    }
  }
  
  return finalSentences;
}

async function translateAndTransliterate(arabicText: string): Promise<TranscriptSentence[]> {
  const openai = new OpenAI({ apiKey: OPENAI_API_KEY });
  
  try {
    // Use AI-powered sentence segmentation instead of simple regex
    const sentences = await aiSentenceSegmentation(arabicText, openai);
    
    const results: TranscriptSentence[] = [];
    
    // Process sentences in batches to avoid overwhelming the API
    const batchSize = 3;
    for (let i = 0; i < sentences.length; i += batchSize) {
      const batch = sentences.slice(i, i + batchSize);
      
      const prompt = `Please translate and transliterate the following Arabic sentences. For each sentence, provide:
1. The original Arabic text
2. English translation
3. Transliteration (Arabic phonetic pronunciation in Latin letters)

Format your response as JSON array with objects containing "arabic", "english", and "transliteration" fields.

Arabic sentences:
${batch.map((s, idx) => `${idx + 1}. ${s}`).join('\n')}`;

      const response = await openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content: 'You are an expert Arabic translator and linguist. Provide accurate translations and transliterations for Arabic text. Always respond with valid JSON.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.3,
        max_tokens: 2000
      });

      const content = response.choices[0].message.content;
      if (content) {
        try {
          // Extract JSON from the response
          const jsonMatch = content.match(/\[[\s\S]*\]/);
          if (jsonMatch) {
            const batchResults = JSON.parse(jsonMatch[0]) as TranscriptSentence[];
            results.push(...batchResults);
          } else {
            // Fallback: create simple structure if JSON parsing fails
            batch.forEach(sentence => {
              results.push({
                arabic: sentence,
                english: '[Translation unavailable]',
                transliteration: '[Transliteration unavailable]'
              });
            });
          }
        } catch (parseError) {
          console.error('Error parsing translation response:', parseError);
          // Fallback for this batch
          batch.forEach(sentence => {
            results.push({
              arabic: sentence,
              english: '[Translation error]',
              transliteration: '[Transliteration error]'
            });
          });
        }
      }
      
      // Small delay between batches to respect rate limits
      if (i + batchSize < sentences.length) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
    
    return results;
  } catch (error) {
    console.error('Error in translation/transliteration:', error);
    // Return basic structure if translation fails - using enhanced regex fallback
    const sentences = enhancedRegexSegmentation(arabicText);
      
    return sentences.map(sentence => ({
      arabic: sentence,
      english: '[Translation service unavailable]',
      transliteration: '[Transliteration service unavailable]'
    }));
  }
}

export const POST: RequestHandler = async ({ request }) => {
  try {
    if (!OPENAI_API_KEY) {
      return json({ error: 'OpenAI API key not configured' }, { status: 500 });
    }

    const formData = await request.formData();
    const audioFile = formData.get('audio') as File;

    if (!audioFile) {
      return json({ error: 'No audio file uploaded' }, { status: 400 });
    }

    // Check file size (limit to 25MB as per OpenAI's limit)
    const maxSize = 25 * 1024 * 1024; // 25MB
    if (audioFile.size > maxSize) {
      return json({ 
        error: 'File too large. Maximum size is 25MB.',
        fileSize: audioFile.size,
        maxSize 
      }, { status: 400 });
    }

    // Check file type
    const allowedTypes = [
      'audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/flac', 
      'audio/m4a', 'audio/mp4', 'audio/webm', 'audio/ogg'
    ];
    
    if (!allowedTypes.includes(audioFile.type)) {
      return json({ 
        error: 'Unsupported file type. Supported formats: MP3, WAV, FLAC, M4A, MP4, WebM, OGG',
        receivedType: audioFile.type 
      }, { status: 400 });
    }

    console.log('Processing audio file:', {
      name: audioFile.name,
      type: audioFile.type,
      size: audioFile.size
    });

    // Create temporary directory
    const tempDir = path.join(process.cwd(), 'static/temp');
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }

    // Save file temporarily
    const timestamp = Date.now();
    const fileExtension = path.extname(audioFile.name) || '.tmp';
    const tempFilePath = path.join(tempDir, `upload_${timestamp}${fileExtension}`);
    
    const buffer = await audioFile.arrayBuffer();
    fs.writeFileSync(tempFilePath, new Uint8Array(buffer));

    console.log('Audio file saved temporarily:', tempFilePath);

    try {
      // Transcribe with OpenAI Whisper
      const openai = new OpenAI({ apiKey: OPENAI_API_KEY });
      
      const transcription = await openai.audio.transcriptions.create({
        file: fs.createReadStream(tempFilePath),
        model: 'whisper-1',
        language: 'ar', // Arabic
        response_format: 'text'
      });

      console.log('Transcription completed successfully');
      
      const transcriptText = typeof transcription === 'string' ? transcription : transcription.text;
      
      // Translate and transliterate the transcript
      console.log('Starting translation and transliteration...');
      const sentences = await translateAndTransliterate(transcriptText);
      
      console.log('Translation and transliteration completed');

      // Clean up temporary file
      if (fs.existsSync(tempFilePath)) {
        fs.unlinkSync(tempFilePath);
      }

      const response: EnhancedTranscriptResponse = {
        transcript: transcriptText,
        sentences,
        transcriptSource: 'whisper',
        originalFileName: audioFile.name,
        fileSize: audioFile.size,
        fileType: audioFile.type
      };

      return json(response);

    } catch (transcriptionError) {
      // Clean up temporary file on error
      if (fs.existsSync(tempFilePath)) {
        fs.unlinkSync(tempFilePath);
      }
      
      console.error('Transcription error:', transcriptionError);
      
      if (transcriptionError instanceof Error) {
        if (transcriptionError.message.includes('file format')) {
          return json({ 
            error: 'Audio file format not supported or corrupted',
            details: transcriptionError.message 
          }, { status: 400 });
        } else if (transcriptionError.message.includes('too long')) {
          return json({ 
            error: 'Audio file is too long. Maximum duration is typically 30 minutes.',
            details: transcriptionError.message 
          }, { status: 400 });
        }
      }
      
      return json({ 
        error: 'Failed to transcribe audio file',
        details: transcriptionError instanceof Error ? transcriptionError.message : 'Unknown error'
      }, { status: 500 });
    }

  } catch (error) {
    console.error('Audio transcription error:', error);
    return json({ 
      error: 'Failed to process audio file',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}; 