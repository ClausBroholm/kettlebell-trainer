# CLAUDE.md — Kettlebell / Stretch Trainer

> This file is auto-loaded at session start. Read it first to orient, then check
> **Status & Next** at the bottom for where we left off. Keep it updated at the
> end of each feature so context can be cleared safely between features.

## What this is

A personal workout web app. A voice-guided trainer that runs you through a
routine — announces each exercise, counts you down, plays motivational lines,
shows a form GIF. Two programs: **Kettlebell Circuit** (⚡ strength, all 9
exercises as one continuous round × 3) and **Daily Back Stretch** (mobility).

- **Single file:** everything is in `index.html` (~1300 lines) — vanilla
  HTML/CSS/JS, **no build step, no framework**. This simplicity is deliberate;
  keep it unless there's a strong reason (e.g. saved history via a backend, PWA
  install). Assets live in `images/` and `audio/`.
- **Deploy:** GitHub Pages serves `main`. Push to `main` = live.

## Architecture (all in `index.html`)

- **`PROGRAMS`** object is the source of truth for content. Each program has
  `exercises`, plus `logo/name/blurb/intro/done/doneNote`, and flags
  `motivation`, `defaultRest`, `defaultMode`. Adding a routine = add a
  `PROGRAMS` entry; the engine doesn't change. `program` / `EXERCISES` globals
  point at the active one.
- **Exercise object:** `{ name, detail, sets, reps, timed, unit?, icon, image?,
  tip, voiceReady, voiceDone }`. `timed:true` → `reps` is seconds (a hold).
  `image` omitted → the `icon` emoji is shown as a placeholder.
- **Engine = a step-list.** `buildPlan(mode)` expands the program into an ordered
  `plan` of steps (`straight` or `superset`). `stepIdx` walks it. Phases:
  `ready` (get-ready countdown) → `work` → `rest`. There's no user-facing mode
  toggle anymore — `mode` is set from `program.defaultMode` (falls back to
  `'straight'`) when a program is selected. Circuit always runs as one big
  `superset` pack (`supersetPairs: [[0..8]]`); Stretch always runs `straight`.
- **Get-ready / skip rule (agreed with Claus):** a natural rest expiry goes
  **straight into the next set** (the rest's final 3-2-1 beeps are the warning).
  A *deliberate* skip ("Skip Rest — Go Now", the Skip button, first set) gets a
  **5 s get-ready**. Implemented via `advanceStep(immediate)`.
- **Countdown beeps:** one shared `AudioContext` (`audioCtx`), unlocked on the
  Start tap via `initAudio()`. Do **not** create a context per beep — iOS caps
  them at ~4 and starts them suspended, which silently kills the beeps.
- **Voice = clips + fallback.** `speak(text)` queues cues (sequential, never
  overlapping) and plays `audio/<clipId>.mp3` if present, else falls back to the
  browser `speechSynthesis` voice. `clipId()` is a djb2 hash — **kept identical**
  in `index.html` and `tools/generate-audio.mjs`.
- **`allPhrases()`** returns every cue string the app can speak (all programs).
  It is the single source of truth for clip generation → dumped to
  `phrases.json`. Any spoken string MUST be producible by `allPhrases()` or it
  falls back to the browser voice. **After changing any cue text, re-dump
  `phrases.json`** (see below) and regenerate audio.

## File map

- `index.html` — the whole app.
- `images/<slug>.gif|png` — form visuals per exercise (`object-fit: contain`).
- `audio/<clipId>.mp3` — ElevenLabs voice clips (~118, some now orphaned by
  the Wednesday Kettlebell removal — harmless, not pruned). Missing = browser
  fallback, so partial is fine.
- `phrases.json` — all cue strings, dumped from `allPhrases()`.
- `tools/generate-audio.mjs` — reads `phrases.json`, synthesizes clips via the
  ElevenLabs API. Voice `5l5f8iK3YPeGga21rQIX`, model `eleven_multilingual_v2`.
  Idempotent (only fills gaps unless `--force`). Run:
  `ELEVENLABS_API_KEY=... ELEVEN_VOICE_ID=... node tools/generate-audio.mjs`
- `IMPROVEMENTS-PLAN.md` — original 5-item backlog investigation (mostly done).

## Conventions

- **Git:** develop on branch `claude/kettlebell-trainer-improvements-ii3r8h`,
  keep it in sync with `main`. Workflow each feature: commit to branch → push →
  `git checkout main && git merge --ff-only <branch> && git push` → back to
  branch. Claus tests on `main`. Retry pushes on network errors.
- **Sandbox limits:** the cloud sandbox blocks most external hosts — **ElevenLabs
  and Instagram are blocked**, so audio must be generated on Claus's machine (or
  via an MCP connector) and GIFs uploaded by him.
- **The Supabase "Bertha" project** (task table) is Claus's cross-project
  backlog; workout ideas sometimes get filed there too.

## Common tasks

- **Add an exercise:** add to the program's `exercises` array (include
  `voiceReady`/`voiceDone`), add `image: "images/<slug>.gif"` when the GIF
  exists, re-dump `phrases.json`, regenerate audio.
- **Add a program:** new `PROGRAMS` entry + a picker button on the start screen.
- **Re-dump `phrases.json`** (headless): load `index.html`, call `allPhrases()`,
  write the JSON. (In this sandbox: Playwright at
  `/opt/node22/lib/node_modules/playwright`, Chromium at
  `/opt/pw-browsers/chromium`.)
- **Verify a change:** render `index.html` headless, drive the engine, assert
  phase transitions / screenshot. There's no unit-test suite; visual + trace
  checks are the norm.

## Status & Next

**Done:** auto-continue; get-ready/skip rule; 50 motivational lines
(kettlebell + circuit); all 9 kettlebell GIFs; ElevenLabs premium voice
(kettlebell cues); mobile countdown-beep fix; multi-program support;
**removed Wednesday Kettlebell** (Claus never used straight sets) — the
picker is now just two programs, **Kettlebell Circuit** (⚡ all 9 as one
continuous round × 3) and **Daily Back Stretch**; the Straight/Superset mode
toggle is gone too (no longer needed with one kettlebell program).

**Open / next:**
1. **Stretch + Circuit GIFs** — no images yet (emoji placeholders). Stretch
   needs 6 files in `images/`: `cat-cow.gif`, `thoracic-foam-roll.gif`,
   `thread-the-needle.gif`, `puppy-pose.gif`, `cobra.gif`, `childs-pose.gif`.
   Circuit reuses several kettlebell moves but has its own names (e.g. Swing,
   Goblet Squat + Curl, Russian Twist) — decide whether to add its own GIFs.
2. **Stretch + Circuit voice clips** — regenerate audio so the new cues use the
   premium voice, not fallback. `phrases.json` is now **117** cues total.
3. **More kettlebell exercises** (biggest-bang-for-buck variety) — top pick is
   the **Kettlebell Swing** (already in Circuit); maybe Clean & Press, Turkish
   Get-Up. Not a big list.
4. **#3 Spotify ducking** — platform-limited (see IMPROVEMENTS-PLAN.md). If
   pre-recorded clips don't reduce interruptions enough, add a
   Full / Minimal / Beeps-only voice-mode toggle.
5. **Prune orphaned audio clips** — `audio/` still has mp3s for
   Wednesday-Kettlebell-only cues that are no longer referenced. Harmless but
   could be cleaned up (diff `phrases.json` clip ids against filenames in
   `audio/`).
