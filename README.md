# Fathom

Fathom is a bioluminescent deep-sea maze chase for the browser. Graze glowing plankton to grow your light, map the trench with sonar, and evade three predators that hunt by light, sound, and flare. The Kindle dive remembers explored ground, but only shows it inside the circular window you carry through the dark.

## Run locally

```sh
npm ci
npm run dev
```

Open the local URL printed by Vite. Create the static production build with `npm run build`; the deployable site is written to `dist/` and works at a host root or sub-path.

## Controls

- Arrow keys or WASD — swim
- Space — sonar pulse / confirm menu item
- Shift — release ink
- Escape or P — pause; Escape also goes back
- Enter — confirm menu item
- M — mute

Touch controls are supplied automatically on touch devices. Menus also support pointer and touch selection.
