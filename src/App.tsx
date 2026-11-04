import './App.css'
import GameLanding from './pages/GameLanding'
import playerSheet from './assets/tanner-the-plumber.png'
import { currentPagePath, sitePath } from './sitePaths'

function App() {
  const pathname = currentPagePath()
  const isHome = pathname === '/'
  const isHelloWorld = pathname === '/hello-world'
  const isTechnology = pathname === '/technology'
  const isFoodAndWine = pathname === '/food-and-wine'

  if (isHome) return <main className="game-content"><GameLanding /></main>

  return (
    <div className="site">
      <header className="site-header">
        <nav className="navigation" aria-label="Main navigation">
          <a href={sitePath('/')} className="game-link" aria-label="Back to game" title="Back to game">
            <span className="nav-character" style={{ backgroundImage: `url(${playerSheet})` }} aria-hidden="true" />
          </a>
          <a
            href={sitePath('/technology')}
            aria-current={isTechnology ? 'page' : undefined}
          >
            Technology
          </a>
          <a
            href={sitePath('/food-and-wine')}
            aria-current={isFoodAndWine ? 'page' : undefined}
          >
            Food &amp; Wine
          </a>
        </nav>
      </header>

      <main className="page-content">
        {isHelloWorld ? (
          <>
            <h1>Hello World</h1>
            <a href={sitePath('/')}>Back to home</a>
          </>
        ) : isTechnology ? (
          <>
            <h1>Technology</h1>
            <p>More coming soon.</p>
            <a href={sitePath('/')}>Back to home</a>
          </>
        ) : isFoodAndWine ? (
          <>
            <h1>Food &amp; Wine</h1>
            <p>More coming soon.</p>
            <a href={sitePath('/')}>Back to home</a>
          </>
        ) : (
          <>
            <h1>Page not found</h1>
            <a href={sitePath('/')}>Back to home</a>
          </>
        )}
      </main>
    </div>
  )
}

export default App
