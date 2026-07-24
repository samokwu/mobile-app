// Generates the "lockbox location" preview clip shown on the En Route screen.
//
// Uses the Gemini API's Veo image-to-video: the house photo is the first
// frame, and the prompt asks for a slow push-in that settles on the lockbox
// mounted left of the front door.
//
// Usage:
//   GEMINI_API_KEY=... node scripts/generate-lockbox-video.mjs
//
// Re-run any time you swap in a higher-resolution photo at
// assets/images/home-2847-alder-creek.jpg. Cost is roughly $0.60 per run on
// the fast tier (720p, 6 s); set VEO_MODEL to override the model.

import { GoogleGenAI } from '@google/genai';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const projectRoot = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const PHOTO_PATH = path.join(projectRoot, 'assets/images/home-2847-alder-creek.jpg');
const OUTPUT_PATH = path.join(projectRoot, 'assets/videos/lockbox-preview.mp4');
const MODEL = process.env.VEO_MODEL ?? 'veo-3.1-fast-generate-preview';

const PROMPT = [
  'Photorealistic cinematic flythrough of the exact backyard in the reference image:',
  'a single-story pale blue-gray home with a covered patio (white pergola roof, ceiling fans,',
  'white posts) and a raised deck with blue horizontal railings, blue deck boards, and white',
  'double French doors. Foreground is a large tan paver patio with a small rectangular',
  'in-ground pool and brick coping on the left, a plumeria tree overhanging the top-left,',
  'wood privacy fence, bright sunny Florida day, blue sky. Camera starts wide and low over',
  'the paver patio near the pool, then glides smoothly forward and rises slightly toward the',
  'covered deck, moving to the blue railing just to the left of the French doors. As it',
  'arrives, a realistic combination lockbox is clipped onto the top of the blue railing at',
  'that spot, and a clean glowing marker pin drops onto it with a soft green pulse ring.',
  'Camera settles into a steady close-up hold on the lockbox on the railing. Smooth',
  'stabilized drone-to-ground motion, sharp realistic detail, natural depth of field, clean',
  'modern tech look with a single green accent on the marker. 16:9 widescreen, ~8 seconds,',
  'no people, no text overlays.',
].join(' ');

const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
  console.error('Missing GEMINI_API_KEY environment variable.');
  console.error('Run: GEMINI_API_KEY=your-key node scripts/generate-lockbox-video.mjs');
  process.exit(1);
}

const ai = new GoogleGenAI({ apiKey });

console.log(`Model: ${MODEL}`);
console.log(`First frame: ${PHOTO_PATH}`);

let operation = await ai.models.generateVideos({
  model: MODEL,
  source: {
    prompt: PROMPT,
    image: {
      imageBytes: fs.readFileSync(PHOTO_PATH).toString('base64'),
      mimeType: 'image/jpeg',
    },
  },
  config: {
    numberOfVideos: 1,
    aspectRatio: '16:9',
    resolution: '720p',
    durationSeconds: 8,
  },
});

process.stdout.write('Generating (takes a minute or two) ');
while (!operation.done) {
  await new Promise((resolve) => setTimeout(resolve, 10_000));
  process.stdout.write('.');
  operation = await ai.operations.getVideosOperation({ operation });
}
process.stdout.write('\n');

if (operation.error) {
  console.error('Generation failed:', JSON.stringify(operation.error, null, 2));
  process.exit(1);
}

const video = operation.response?.generatedVideos?.[0]?.video;
if (!video) {
  console.error('No video in response:', JSON.stringify(operation.response, null, 2));
  process.exit(1);
}

fs.mkdirSync(path.dirname(OUTPUT_PATH), { recursive: true });
await ai.files.download({ file: video, downloadPath: OUTPUT_PATH });
console.log(`Saved ${OUTPUT_PATH} (${(fs.statSync(OUTPUT_PATH).size / 1e6).toFixed(1)} MB)`);
