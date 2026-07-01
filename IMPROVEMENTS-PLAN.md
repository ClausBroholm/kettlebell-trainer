# Workout App — Improvements Plan

Investigation of the 5 backlog ideas. Effort estimates are rough (S = <30 min, M = ~1–2 h, L = bigger / needs your input).

**Status update (2026-07-01): #1, #2, #4, and #5 are all shipped.** Only #3 (Spotify ducking) remains open.

---

## 1. Auto-continue after pauses — no manual "next" button  ✅ Done

**Current flow:** `ready` → tap **Start Set** → `work` → tap **Done** → `rest` (auto countdown) →
auto-advance to next `ready` → **but then waits for another tap**.

So the rest timer already auto-runs; the friction is the **"Start Set" tap after every rest**.

**Plan:**
- After the rest countdown ends, don't stop at `ready` — automatically run a short **"Get ready… 3-2-1"** countdown (voice + beeps) and then enter `work` on its own.
- Keep a **"Done"** tap only for rep-based exercises (the app can't know when you've finished 10 reps). For *timed* exercises (Plank) it's already fully automatic.
- Optional upgrade: give each rep-based exercise an estimated work duration so it can auto-advance with a manual "Done early" override. **Recommendation:** start with auto-start-after-rest (removes most taps); decide on auto-timing reps later.

**Risk:** none technical. Just need to make sure the auto-countdown can't run while the app is backgrounded.

---

## 2. Better form images per exercise  ✅ Done

All 9 exercise GIFs wired and pushed.

---

## 3. Voice that doesn't pause Spotify (audio ducking)  ⚠️ Platform-limited · Effort: M + device testing

**The honest finding:** A web app has **very little control** over another app's audio (Spotify).
- The app uses the browser's `speechSynthesis`. On **iOS**, speaking generally grabs the audio session
  and **interrupts/pauses** background music — web pages cannot set the iOS audio session to "duck"
  (lower Spotify, talk over it, restore). That capability is native-only (AVAudioSession), not exposed to web JS.
- True "ducking" via the Web Audio API only works for audio **the page itself plays**, not Spotify.
- So: **real ducking of Spotify from a mobile web app is not reliably possible.** This needs to be verified
  on *your* actual phone/browser, but expect this constraint.

**Realistic options (pick one in the morning):**
- **A. Pre-recorded audio cues instead of live TTS** (ties into #5). Short MP3 clips may interrupt music
  *less* than the speech engine on some platforms — needs device testing, not guaranteed.
- **B. Reduce interruptions:** fewer/shorter voice cues, or a "beeps-only, no voice" toggle so music
  is never interrupted by long sentences.
- **C. Accept it for web; only a native/PWA wrapper could truly duck.** (Bigger project.)
- **D. Quick win:** add a setting — "Voice cues: Full / Minimal / Beeps only" — so you control the
  trade-off yourself.

**Recommendation:** Do **D** (cheap, gives you control) and test **A** on your phone before investing further.

**Update (2026-07-01):** Option A landed as a side effect of #5 — all fixed cues now play as pre-recorded
ElevenLabs clips instead of live `speechSynthesis`. Worth testing on your phone whether that alone reduces
Spotify interruptions before building **D**'s voice-mode toggle.

---

## 4. 50 randomized motivational phrases  ✅ Done

50 lines shipped in `MOTIVATION` in index.html, in Bertha's coaching tone, English, no-repeat-twice-in-a-row
picker. Spoken roughly every other completed set.

---

## 5. More human voice (better than default TTS)  ✅ Done

Went with option **B**: all 91 fixed cue strings (exercise cues, rest lines, transitions, the 50 motivational
lines) are pre-generated as ElevenLabs clips (voice `5l5f8iK3YPeGga21rQIX`, model `eleven_multilingual_v2`)
and committed to `audio/`, named by `clipId()` (djb2 hash of the cue text — kept in sync between
`index.html` and `tools/generate-audio.mjs`). `speak()` plays the matching clip when present and falls back
to browser `speechSynthesis` only if a clip is missing. Generation cost ~3,857 characters total, well inside
the ElevenLabs Starter plan's 30k/month credit budget — plenty of room to regenerate with a different voice
or add more cues later. To regenerate: `ELEVENLABS_API_KEY=... ELEVEN_VOICE_ID=... node tools/generate-audio.mjs`
(idempotent — only fills gaps unless `--force`).

---

## What's left

Only **#3 Spotify ducking** is still open. Test on your phone whether the switch to pre-recorded clips
(landed with #5) already reduces music interruptions — if not, next step is the "voice modes"
(Full / Minimal / Beeps only) toggle from option D.
