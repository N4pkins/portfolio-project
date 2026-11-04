import './App.css'
import GameLanding from './pages/GameLanding'
import playerSheet from './assets/tanner-the-plumber.png'

function App() {
  const pathname = window.location.pathname.replace(/\/+$/, '') || '/'
  const isHome = pathname === '/'
  const isHelloWorld = pathname === '/hello-world'
  const isTechnology = pathname === '/technology'
  const isFoodAndWine = pathname === '/food-and-wine'

  if (isHome) return <main className="game-content"><GameLanding /></main>

  return (
    <div className="site">
      <header className="site-header">
        <nav className="navigation" aria-label="Main navigation">
          <a href="/" className="game-link" aria-label="Back to game" title="Back to game">
            <span className="nav-character" style={{ backgroundImage: `url(${playerSheet})` }} aria-hidden="true" />
          </a>
          <a
            href="/technology"
            aria-current={isTechnology ? 'page' : undefined}
          >
            Technology
          </a>
          <a
            href="/food-and-wine"
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
            <a href="/">Back to home</a>
          </>
        ) : isTechnology ? (
          <>
            <h1>Technology</h1>
            <p>More coming soon.</p>
            <a href="/">Back to home</a>
          </>
        ) : isFoodAndWine ? (
          <>
            <h1>Food &amp; Wine</h1>
            <p>More coming soon.</p>
            <a href="/">Back to home</a>
          </>
        ) : (
          <>
            <h1>Page not found</h1>
            <a href="/">Back to home</a>
          </>
        )}
      </main>
    </div>
  )
}

export default App
