#!/usr/bin/env node
/*
 * Generate ElevenLabs voice clips for the Kettlebell Trainer.
 *
 * The app speaks a fixed set of cues. This script reads that exact list from
 * phrases.json (produced by the app) and creates one MP3 per cue in ../audio/,
 * named by the same clipId() the app uses to look them up. Missing files just
 * fall back to the browser voice, so partial runs are fine and re-runs only
 * fill gaps.
 *
 * Usage:
 *   ELEVENLABS_API_KEY=sk_xxx ELEVEN_VOICE_ID=<voiceId> node tools/generate-audio.mjs
 *
 * Options:
 *   --sample        Only generate the first 3 clips (quick voice audition).
 *   --force         Re-generate even if the mp3 already exists.
 *
 * Find your voice ID at elevenlabs.io → Voices → (your voice) → "ID" (copy).
 * Get an API key at elevenlabs.io → profile → API Keys.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const AUDIO_DIR = path.join(ROOT, 'audio');
const PHRASES = path.join(ROOT, 'phrases.json');

const API_KEY = process.env.ELEVENLABS_API_KEY;
const VOICE_ID = process.env.ELEVEN_VOICE_ID;
const MODEL = process.env.ELEVEN_MODEL || 'eleven_multilingual_v2';
const SAMPLE = process.argv.includes('--sample');
const FORCE = process.argv.includes('--force');

if (!API_KEY || !VOICE_ID) {
  console.error('Missing config. Set ELEVENLABS_API_KEY and ELEVEN_VOICE_ID.\n' +
    'Example:\n  ELEVENLABS_API_KEY=sk_xxx ELEVEN_VOICE_ID=abc123 node tools/generate-audio.mjs');
  process.exit(1);
}

// Must stay identical to clipId() in index.html.
function clipId(text) {
  let h = 5381;
  for (let i = 0; i < text.length; i++) h = ((h << 5) + h + text.charCodeAt(i)) >>> 0;
  return 'c' + h.toString(16);
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function tts(text) {
  const url = `https://api.elevenlabs.io/v1/text-to-speech/${VOICE_ID}?output_format=mp3_44100_128`;
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'xi-api-key': API_KEY,
      'content-type': 'application/json',
      accept: 'audio/mpeg',
    },
    body: JSON.stringify({
      text,
      model_id: MODEL,
      voice_settings: { stability: 0.5, similarity_boost: 0.75, style: 0.0, use_speaker_boost: true },
    }),
  });
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`HTTP ${res.status} ${res.statusText} — ${body.slice(0, 300)}`);
  }
  return Buffer.from(await res.arrayBuffer());
}

async function main() {
  let phrases = JSON.parse(fs.readFileSync(PHRASES, 'utf8'));
  if (SAMPLE) phrases = phrases.slice(0, 3);
  fs.mkdirSync(AUDIO_DIR, { recursive: true });

  console.log(`Voice: ${VOICE_ID}  Model: ${MODEL}`);
  console.log(`Generating ${phrases.length} clip(s) into ${AUDIO_DIR}${SAMPLE ? '  [SAMPLE]' : ''}\n`);

  let made = 0, skipped = 0, failed = 0;
  for (let i = 0; i < phrases.length; i++) {
    const text = phrases[i];
    const out = path.join(AUDIO_DIR, `${clipId(text)}.mp3`);
    const tag = `[${i + 1}/${phrases.length}]`;
    if (!FORCE && fs.existsSync(out)) { skipped++; console.log(`${tag} skip  ${path.basename(out)}`); continue; }
    try {
      const buf = await tts(text);
      fs.writeFileSync(out, buf);
      made++;
      console.log(`${tag} ok    ${path.basename(out)}  "${text.slice(0, 48)}${text.length > 48 ? '…' : ''}"`);
      await sleep(350); // be gentle with rate limits
    } catch (e) {
      failed++;
      console.error(`${tag} FAIL  "${text.slice(0, 48)}" — ${e.message}`);
      if (String(e.message).startsWith('HTTP 401')) {
        console.error('\n401 = bad API key. Stopping.'); process.exit(1);
      }
      await sleep(1000);
    }
  }
  console.log(`\nDone. made=${made} skipped=${skipped} failed=${failed}`);
  console.log('Now upload the audio/ folder to the repo (same as the images).');
}

main();
