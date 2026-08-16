# CLAUDE.md — Kettlebell / Stretch Trainer

> This file is auto-loaded at session start. Read it first to orient, then check
> **Status & Next** at the bottom for where we left off. Keep it updated at the
> end of each feature so context can be cleared safely between features.

## What this is

A personal workout web app. A voice-guided trainer that runs you through a
routine — announces each exercise, counts you down, plays motivational lines,
shows a form GIF. Two programs: **Kettlebell Circuit** (⚡ strength, all 10
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
  tip, voiceReady, voiceDone, estSeconds?, weightKg? }`. `timed:true` → `reps`
  is seconds (a hold). `image` omitted → the `icon` emoji is shown as a
  placeholder. `estSeconds` (rep-based exercises only) is a rough guess at
  how long the set takes, used by **Auto-Timed Mode** (see below). `weightKg`
  is Claus's suggested kettlebell weight for that exercise — shown as a badge
  on the start-screen summary list and on the workout screen (via `dEx`, so
  during rest/switch it already shows the *upcoming* exercise's weight —
  exactly when Claus needs to know which bell to grab next). Omit the field
  for bodyweight exercises (e.g. Plank) — the badge just doesn't render.
- **Auto-Timed Mode** (`autoTimeMode`, start-screen toggle, persisted in
  `localStorage['ktAutoTimeMode']`): when on, rep-based exercises auto-advance
  after `ex.estSeconds` instead of waiting for a manual tap — same mechanic as
  a real `timed:true` exercise. `isTimedNow(ex)` = `ex.timed ||
  (autoTimeMode && ex.estSeconds != null)` is the single source of truth for
  "is this exercise running on a countdown right now" — `beginWork()` and
  `updateUI()` both branch on it instead of raw `ex.timed`. `estSeconds`
  values are rough guesses (~1.3-3s/rep depending on tempo) that Claus should
  test and tune per exercise.
- **Engine = a step-list.** `buildPlan(mode)` expands the program into an ordered
  `plan` of steps (`straight` or `superset`). `stepIdx` walks it. Phases:
  `ready` (get-ready countdown) → `work` → `rest`. There's no user-facing mode
  toggle anymore — `mode` is set from `program.defaultMode` (falls back to
  `'straight'`) when a program is selected. Circuit always runs as one big
  `superset` pack (`supersetPairs: [[0..9]]`); Stretch always runs `straight`.
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

**Latest (2026-08-10, reconciled after a two-session collision):** the Circuit
is now **10 exercises** — Swing, Goblet Squat, Reverse Lunge, Single Arm Row,
Single Arm Press, **Kettlebell Curl**, **Push-Ups**, **Hip Thrust**, Russian
Twist, Plank. The +Curl combos were **split** into plain Goblet Squat / Reverse
Lunge + a standalone Curl; **Farmer's Carry and Floor Press were dropped**
(space / redundant with Push-Ups). All `weightKg: 8` bumped to **12**. Bigger
exercise-name / timer / rep **fonts** (read the phone from across the room).
`allPhrases()` now enumerates a program's `defaultMode` (circuit has no
`supersets` flag) so its superset cues get generated. `phrases.json` = **123**.
Curl / Push-Ups have **no GIFs yet** (emoji); Hip Thrust reuses `hip-thrust.gif`.
The Circuit's voice clips still need **regeneration** to stop falling back to the
browser voice (that's the "silent circuit").

**Done:** auto-continue; get-ready/skip rule; 50 motivational lines
(kettlebell + circuit); all kettlebell GIFs; ElevenLabs premium voice
(kettlebell cues); mobile countdown-beep fix; multi-program support.

**Done earlier session (2026-08-09):**
- **Removed Wednesday Kettlebell** (Claus never used straight sets) — the
  picker is now just two programs, **Kettlebell Circuit** (⚡ all 9 as one
  continuous round × 3) and **Daily Back Stretch**; the Straight/Superset
  mode toggle is gone too (no longer needed with one kettlebell program).
- **Fixed a real bug:** `mode` didn't sync to the default program on page
  load (the initial `programId="circuit"` assignment bypassed
  `selectProgram()`, which is what normally sets `mode` from
  `program.defaultMode`). Circuit was silently running as 3 straight sets of
  the same exercise back-to-back (with a generic 30s rest) instead of
  cycling all 9 exercises per round. `mode` is now initialized from
  `program.defaultMode` at declaration time.
- **Removed the Skip button** — "Done — Start Rest" / "Skip Rest — Go Now"
  already cover exiting a set or rest early.
- **Rest/switch screen now previews the next exercise, not the last one:**
  the main area (name, gif/icon, tip) shows the *upcoming* exercise during
  rest so Claus can see its form before it starts; the small "Next" box is
  hidden during rest (redundant now) but still shows during ready/work. The
  12s between-exercise pause now visually reads "QUICK SWITCH" (matching the
  "Quick switch." voice cue) instead of "REST" — only the 45s round-end rest
  says "REST".
- **Fixed Goblet Squat + Curl cue order** — squat first, then curl on the way
  up (tip/voice text had it backwards).
- **Fixed a stale-placeholder flash on Start** — `startWorkout()` switched to
  the workout screen before calling `updateUI()`, so the static HTML
  placeholder ("Goblet Squat", a Wednesday-Kettlebell leftover) briefly
  showed before the real first exercise appeared ~1.6s later. `updateUI()`
  now runs immediately when the plan is built.
- **Added all 4 remaining Circuit GIFs**: `kettlebell-swing.gif`,
  `goblet-squat-curl.gif`, `russian-twist.gif`, `reverse-lunge-curl.gif` are
  all wired up — **Circuit now has GIFs for all 9 exercises**. Note
  `kettlebell-swing.gif` is 7.3MB — much larger than every other GIF in the
  app (1.4-5.1MB range); left as-is for now, revisit if it loads slowly on
  Claus's phone.
- **Fixed the work-phase button text** — it said "Done — Start Rest" even
  going into a 12s quick-switch (no real rest). Now reads "Next Exercise" for
  transition steps, "Done — Start Rest" only when a real rest follows, "Done
  Early" for timed exercises.
- **Added Auto-Timed Mode** — a start-screen toggle (Manual / ⏱️ Auto-Timed,
  persisted in `localStorage`) that makes rep-based exercises auto-advance
  after an estimated duration (`ex.estSeconds`) instead of waiting for a
  manual tap, so Claus doesn't have to touch the phone mid-set. Added
  `estSeconds` guesses to all 8 rep-based Circuit exercises and Stretch's 2
  non-timed ones (Cat-Cow, Thread the Needle) — see architecture note above.
  **These are rough estimates and need real-world testing/tuning** (item 1
  below).
- **Added per-exercise kettlebell weight suggestions** — `weightKg` field on
  each Circuit exercise (Claus is a 47yo male beginner, "normal strength,"
  goal = solidly fatigued by the last rep of set 3): Kettlebell Swing 16kg,
  Goblet Squat + Curl 12kg, Single Arm Row 12kg, Reverse Lunge + Curl 8kg,
  Single Arm Press 8kg, Russian Twist 8kg, Floor Press 12kg, Farmer's Carry
  16kg, Plank bodyweight (no field). Shown as a badge on the start-screen
  summary list and on the workout screen (via `dEx`, so it previews the
  *upcoming* exercise's weight during rest/switch). Went with the simple
  static-field approach (not an in-app editor) since Claus edits by asking —
  matches how `estSeconds` tuning already works.

**Open / next:**
1. **Tune `estSeconds` and `weightKg` values** — Claus should run Circuit and
   report back what felt off for each exercise; both are rough guesses meant
   to be adjusted after real-world testing. Current `estSeconds` (seconds):
   Kettlebell Swing 20, Goblet Squat + Curl 30, Single Arm Row 40, Reverse
   Lunge + Curl 60, Single Arm Press 40, Russian Twist 30, Floor Press 30,
   Farmer's Carry 25, Cat-Cow 32, Thread the Needle 48. Current `weightKg`:
   see architecture note above (8/12/16kg per exercise).
2. **Stretch GIFs** — still needs all 6 files in `images/`: `cat-cow.gif`,
   `thoracic-foam-roll.gif`, `thread-the-needle.gif`, `puppy-pose.gif`,
   `cobra.gif`, `childs-pose.gif`. Circuit is fully done. Claus to upload to
   `images/` in a future session.
3. **Stretch + Circuit voice clips** — regenerate audio so the new/changed
   cues use the premium voice, not fallback. `phrases.json` is **117** cues
   total, **56 currently missing** audio (browser-voice fallback). Doable
   directly in a Project-Cockpit session (not the blocked cloud sandbox) if
   Claus supplies `ELEVENLABS_API_KEY` (+ `ELEVEN_VOICE_ID` if not the
   default).
4. **More kettlebell exercises** (biggest-bang-for-buck variety) — top pick
   was the **Kettlebell Swing** (now in Circuit); maybe Clean & Press,
   Turkish Get-Up. Not a big list.
5. **#3 Spotify ducking** — platform-limited (see IMPROVEMENTS-PLAN.md). If
   pre-recorded clips don't reduce interruptions enough, add a
   Full / Minimal / Beeps-only voice-mode toggle.
6. **Prune orphaned audio clips** — `audio/` still has mp3s for
   Wednesday-Kettlebell-only and old-text cues that are no longer referenced.
   Harmless but could be cleaned up (diff `phrases.json` clip ids against
   filenames in `audio/`).
