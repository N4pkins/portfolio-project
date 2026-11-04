# Portfolio

A React + TypeScript portfolio built with Vite, with a playable Phaser landing page.

- `/`: Game-only landing page with pipes leading to portfolio pages.
- `/hello-world`: Original Hello World page.
- `/technology`: Technology placeholder with a link back home.
- `/food-and-wine`: Food & Wine placeholder, reached through the right-hand pipe.

Content pages share a left-aligned navigation bar: the character's first sprite frame links back to the game, followed by Technology and Food & Wine.

The game loads only when visiting the landing page. The character uses the bundled sprite sheet at `src/assets/tanner-the-plumber.png`; scenery is drawn in code. The landing page shows only the game, with its original aspect ratio preserved and dark letterboxing when needed. Escape opens a pause menu; Quit Game links directly to Hello World.

The scenery in `src/game/scenery.ts` uses a two-pixel grid: blue sky, stepped clouds, bushes, masonry ground, and shaded green pipes of equal height. A compact, semi-transparent pixel-art controls guide (`src/assets/controls-guide.svg`) sits in the top-left corner at 75% scale, with six keycaps arranged in two columns of three. Its Esc keycap opens the menu. No additional sprite sheets are needed for scenery.

## Game controls

- **Left/Right arrows:** move horizontally.
- **Shift:** hold while moving to run.
- **Space or Up arrow:** jump; hold for more height or tap for a shorter jump.
- **Down arrow:** enter a pipe while standing on it.
- **Escape:** pause and open the menu; press again or select Resume to continue. Quit Game goes to `/hello-world`.
- **Up/Down in the menu:** change selection, wrapping between Resume and Quit Game. Enter or Space activates the selected option; Tab also works.

On touch devices, controls overlay the game for movement, Run, Jump, and Enter. Hold a direction and Run together to run; add Jump to jump while running. The Menu button inside the game also opens the pause menu.

Movement approximates the original platformer feel with acceleration, braking, coasting, air momentum, and stronger gravity when falling or releasing jump. It is not a cycle-exact emulator.

The warp-zone greeting, pipe labels, and black pause menu share the locally bundled Press Start 2P font (`src/assets/fonts/`), licensed under the included SIL Open Font License. The game waits for the font before drawing canvas text. The ground has no helper text.

## Local development

Use Node.js 20.19+ or 22.12+ and npm. This project was scaffolded with Node.js 24.

```sh
npm install
npm run dev
```

Open the local URL printed by Vite.

## Validation and production build

```sh
npm run lint
npm run build
npm run preview
```

Linting uses Oxlint. The build checks TypeScript and writes production files to `dist/`; preview serves that build locally.

## Editing and hosting

Routes and navigation live in `src/App.tsx`. The React game page is `src/pages/GameLanding.tsx`, and the Phaser game module is `src/game/createGame.ts`. Shared styles live in `src/App.css` and `src/index.css`.

The character sheet is a single 96 × 16 pixel row of six 16 × 16 frames: frames 0–3 form the walk cycle, frame 4 is the skid pose, and frame 5 is the jump pose. Frame 0 is also used while idle. Frame indices and movement tuning live in `src/game/createGame.ts`.

Navigation uses ordinary links, with the URL pathname selecting the page. When deploying `dist/` to a static host, configure an `index.html` fallback so direct visits to `/hello-world`, `/technology`, and `/food-and-wine` work. No backend is required.
