import { copyFile, mkdir, writeFile } from 'node:fs/promises'

// Pages has no SPA rewrite setting. Give each public route a real entry file
// so direct visits and refreshes return 200 instead of relying on a 404 hack.
for (const route of ['hello-world', 'technology', 'food-and-wine']) {
  await mkdir(`dist/${route}`, { recursive: true })
  await copyFile('dist/index.html', `dist/${route}/index.html`)
}

await copyFile('dist/index.html', 'dist/404.html')
await writeFile('dist/.nojekyll', '')
await mkdir('dist/licenses', { recursive: true })
await copyFile('src/assets/fonts/OFL.txt', 'dist/licenses/press-start-2p-OFL.txt')
