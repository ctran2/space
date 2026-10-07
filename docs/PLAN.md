# Plan: Spoken English Words for Kids

## Goal

Make the game more exciting for kids aged 4-7, and teach them simple English words. The game says words out loud and shows them on screen.

## Decisions (confirmed)

- **Trigger**: words are spoken at game events, with a variety of learning words.
- **Voice**: the browser's built-in Web Speech API (`speechSynthesis`). It needs no audio files and works offline on most devices.
- **Audience**: ages 4-7, so the words are very simple, slow and clear.

## What the player experiences

1. **Cheers on alien hits.** About 1 in 4 hits says a cheer ("Nice shot!", "Boom!", "Got it!") and shows it floating up. (Themed learning words were tried and removed: they were distracting and did not match the aliens.)
2. **Event shout-outs.** A random pick from a short pool for each event:
   - Level start: "Level two!"
   - Level cleared: "Great job!", "Well done!", "Super!"
   - Player hit: "Oh no!", "Watch out!"
   - Game over: "Game over. Good try!"
3. **The Mute button and M key** silence speech as well as sound effects.

## Rules to keep it pleasant

- **No backlog.** A new learning word is skipped if the game is still speaking, so words never pile up behind each other.
- **Important events win.** Level, hit and game-over shout-outs cancel whatever is being spoken and play right away.
- **Kid-friendly voice settings**: an English voice (`lang: "en-US"`), rate about 0.85, pitch about 1.2.
- **Pausing** or switching away from the app cancels speech.
- **Silent fallback.** If `speechSynthesis` is missing, the game runs as before with no errors, and words are still shown on screen.

## Code changes (small, following existing patterns)

| File | Change |
|------|--------|
| `words.js` (new) | Shout-out pools. Data only. |
| `sound.js` | Add `Sound.say(text, { interrupt })`, using the existing `muted` flag. `init()` also unlocks speech on iOS by speaking an empty utterance once. |
| `game.js` | On alien kill: pick a word, call `Sound.say`, and add a floating text item. On level start, level clear, player hit and game over: call the shout-outs. Draw and age the floating words in `update`/`draw`. Cancel speech on pause. |
| `index.html` | Load `words.js` before `game.js`. |
| `sw.js` | Add `words.js` to the cache list and bump `CACHE` to `v2` so installed copies update. |
| `README.md` | One line about the spoken words. |

There are no new dependencies and no build step, matching the current plain-JS setup.

## Build steps (incremental, testable one at a time)

1. Add `Sound.say` and call it on level start only. Check it speaks, and that Mute silences it.
2. Add `words.js` and speak a learning word on alien hits, with the no-backlog rule.
3. Add the floating on-screen words.
4. Add the remaining shout-outs (level clear, player hit, game over).
5. Update `index.html`, `sw.js` and `README.md`. Test desktop Chrome, then a phone (iOS Safari is the riskiest for speech).

## Open questions for review

- Should the start screen also say "Space Invaders! Tap to start!"? It can only play after the first tap, because of browser autoplay rules.
