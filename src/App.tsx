import './App.css'

function App() {
  const pathname = window.location.pathname.replace(/\/+$/, '') || '/'
  const isHome = pathname === '/'
  const isTechnology = pathname === '/technology'

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
        {isHome ? (
          <h1>Hello World</h1>
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
