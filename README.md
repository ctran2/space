# Space Invaders

A classic Space Invaders clone in plain HTML, CSS and JavaScript. It works on desktop and mobile, can be installed as an app (PWA), and plays offline.

Shoot down the alien swarm before it reaches you. Each cleared wave starts a faster, more aggressive level. Hide behind the shields, which wear down as they take hits. You have 3 lives.

## Play online

**https://ctran2.github.io/space/**

On a phone, you can install it as an app. In Safari, tap Share and choose "Add to Home Screen". In Chrome, open the menu and choose "Install app".

## How to play

| Action | Keyboard | Touch |
| --- | --- | --- |
| Start / restart | Enter | Tap the game |
| Move | Left/Right or A/D | Arrow buttons |
| Shoot | Space | FIRE button |
| Pause | P | Pause button |
| Mute | M | Mute button |

Points per alien: top row 30, middle rows 20, bottom rows 10.

## Run locally

Open `index.html` in a browser. Offline and install support need the game to be served over HTTP, for example:

```
python -m http.server
```
