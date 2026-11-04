import './App.css'
import GameLanding from './pages/GameLanding'

function App() {
  const pathname = window.location.pathname.replace(/\/+$/, '') || '/'
  const isHome = pathname === '/'
  const isHelloWorld = pathname === '/hello-world'
  const isTechnology = pathname === '/technology'

  if (isHome) return <main className="game-content"><GameLanding /></main>

  return (
    <div className="site">
      <header className="site-header">
        <nav className="navigation" aria-label="Main navigation">
          <a
            href="/technology"
            aria-current={isTechnology ? 'page' : undefined}
          >
            Technology
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
