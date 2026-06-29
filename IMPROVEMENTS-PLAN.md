# Workout App — Improvements Plan

Investigation of the 5 backlog ideas. **Planning only — nothing here is implemented yet.**
Status as of the morning review. Effort estimates are rough (S = <30 min, M = ~1–2 h, L = bigger / needs your input).

---

## 1. Auto-continue after pauses — no manual "next" button  ✅ Feasible · Effort: S–M

**Current flow:** `ready` → tap **Start Set** → `work` → tap **Done** → `rest` (auto countdown) →
auto-advance to next `ready` → **but then waits for another tap**.

So the rest timer already auto-runs; the friction is the **"Start Set" tap after every rest**.

**Plan:**
- After the rest countdown ends, don't stop at `ready` — automatically run a short **"Get ready… 3-2-1"** countdown (voice + beeps) and then enter `work` on its own.
- Keep a **"Done"** tap only for rep-based exercises (the app can't know when you've finished 10 reps). For *timed* exercises (Plank) it's already fully automatic.
- Optional upgrade: give each rep-based exercise an estimated work duration so it can auto-advance with a manual "Done early" override. **Recommendation:** start with auto-start-after-rest (removes most taps); decide on auto-timing reps later.

**Risk:** none technical. Just need to make sure the auto-countdown can't run while the app is backgrounded.

---

## 2. Better form images per exercise  🔄 In progress · Effort: M (mostly your image gen)

Already built the image system (Goblet Squat + Single Arm Press done). Remaining: generate the other
7 in the same Start/End style and I wire + push them. **No investigation needed — just finish the set.**

7 left: Reverse Lunge, Single Arm Row, Hip Thrust, Floor Press, Superman, Plank, Farmer's Carry.

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

---

## 4. 50 randomized motivational phrases  ✅ Feasible · Effort: S

Trivial technically. Add an array of ~50 short lines and speak a random one at sensible moments
(e.g. mid-set, on set completion, start of last set) — without repeating the same one twice in a row.

**Decisions for the morning:**
- **Language:** Danish, English, or mix? (Current cues are English.)
- **Tone:** match the "Bertha" coaching style from your CLAUDE.md — *firm but warm, celebrate small wins,
  no drill-sergeant.* I can draft all 50 in that voice for your approval.
- **Frequency:** every set is a lot; maybe ~every 2nd–3rd set so it stays special.
- Interacts with #3 — more talking = more Spotify interruptions. The "Minimal" voice mode should dial these down.

**Recommendation:** I draft 50 lines in Bertha's tone (your chosen language) for you to edit, then wire in.

---

## 5. More human voice (better than default TTS)  ✅ Feasible · Effort: M–L depending on approach

The app already tries to pick a decent system voice (`en-GB Daniel`, etc.), but built-in voices still
sound robotic. Two real paths:

- **A. Better *system* voices (free, offline, easy).** On iOS you can download **Enhanced/Premium**
  English voices (Settings → Accessibility → Spoken Content → Voices). The app can prefer those. Cheapest
  upgrade, zero cost, but quality is capped at "decent."

- **B. Pre-generated high-quality TTS clips (best quality, recommended).** Most of the app's speech is a
  **fixed set of strings** (exercise cues, rest lines, the 50 motivational phrases). I can generate them
  once with a premium TTS (ElevenLabs / OpenAI / Google) and bundle them as audio files. Result: a fully
  natural, consistent voice with **no runtime cost, no API key in the app, works offline.** Only truly
  dynamic bits (rep counts) would still need fallback TTS or a small set of number clips.
  - Trade-off: needs a TTS account/key **at build time** (not shipped), and adds audio files to the repo.

- **C. Live cloud TTS at runtime.** Best flexibility but requires a backend or an exposed API key
  (insecure for a static page) + network during the workout. **Not recommended** for this app.

**Recommendation:** **B** — pre-generate clips for the fixed cues + 50 phrases with a premium voice.
This *also* helps #3 (pre-recorded audio may interrupt Spotify less). Fallback to **A**'s enhanced
system voice for dynamic numbers. Needs one decision from you: which TTS provider/voice, and whether
you're OK adding ~1–3 MB of audio to the repo.

---

## Suggested order for the morning

1. **Finish #2** (send the 7 images) — already in motion, visible payoff.
2. **#1 auto-continue** — small, high daily-friction win.
3. **#4 motivational phrases** — fun, easy; I draft 50 in Bertha's tone.
4. **#5 voice quality (option B)** — the big perceived-quality jump; needs your provider choice.
5. **#3 Spotify ducking** — set expectations (platform-limited); do the cheap "voice modes" toggle and
   test pre-recorded clips on your phone before deciding how far to go.

**Open questions I'll need answered:** language for phrases (DA/EN), TTS provider/voice for #5,
and whether bundling audio files into the repo is OK.
