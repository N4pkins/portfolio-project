# Portfolio

A minimal React + TypeScript website built with Vite.

- `/`: Hello World landing page.
- `/technology`: Technology placeholder with a link back home.
- The top navigation contains a single Technology link.

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

Page content and navigation live in `src/App.tsx`. Styles live in `src/App.css` and `src/index.css`.

Navigation uses ordinary links, with the URL pathname selecting the page. When deploying `dist/` to a static host, configure an `index.html` fallback so direct visits to `/technology` work. No backend or game engine is included.
