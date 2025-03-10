

import { json } from "@sveltejs/kit";
import fs from "fs";
import path from "path";
import { ElevenLabsClient } from "elevenlabs";
import { env } from '$env/dynamic/private';

const ELEVENLABS_API_KEY = env.ELEVENLABS_API_KEY;

if (!ELEVENLABS_API_KEY) {
	throw new Error('Missing ELEVENLABS_API_KEY in environment variables');
}

export async function POST({ request }) {
  const formData = await request.formData();
  const file = formData.get("audio") as File;

  if (!file) {
    return json({ error: "No file uploaded" }, { status: 400 });
  }

  // Save the file to a temporary location
  const uploadsDir = path.join(process.cwd(), "static/uploads");
  if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

  const filePath = path.join(uploadsDir, file.name);
  const buffer = Buffer.from(await file.arrayBuffer());
  fs.writeFileSync(filePath, buffer);

  console.log(`File saved: ${filePath}`);

  // Send the file to ElevenLabs for transcription
  const client = new ElevenLabsClient({ apiKey: ELEVENLABS_API_KEY });

  const response = await fetch(
    "https://storage.googleapis.com/eleven-public-cdn/audio/marketing/nicole.mp3"
  );

  const _formData = new FormData();
  _formData.append("file", new Blob([buffer], { type: file.type }));
  _formData.append("model_id", "scribe_v1");
  _formData.append("language_code", "ar");
  try {
    const apiResponse = await fetch("https://api.elevenlabs.io/v1/speech-to-text", {
      method: "POST",
      headers: {
        "xi-api-key": ELEVENLABS_API_KEY
      },
      body: _formData,
    });

    const _data = await apiResponse.json();
    console.log({ apiResponse, _data })

    return json({ text: _data.text });
  } catch (error) {
    console.error("Transcription error:", error);
    return json({ error: "Failed to transcribe" }, { status: 500 });
  }
}
