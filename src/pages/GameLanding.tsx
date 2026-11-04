import { useEffect, useRef, useState } from 'react'
import type { KeyboardEvent, PointerEvent } from 'react'
import type { Controls } from '../game/createGame'
import './GameLanding.css'

const keyActions: Record<string, keyof Controls> = {
  ArrowLeft: 'left', ArrowRight: 'right',
  Space: 'jump', ArrowUp: 'jump', ArrowDown: 'enter',
  ShiftLeft: 'run', ShiftRight: 'run',
}

type PortfolioGame = ReturnType<typeof import('../game/createGame').createGame>

function GameLanding() {
  const host = useRef<HTMLDivElement>(null)
  const gameRef = useRef<PortfolioGame | null>(null)
  const menu = useRef<HTMLDialogElement>(null)
  const [menuOpen, setMenuOpen] = useState(false)
  const [ready, setReady] = useState(false)
  const controls = useRef<Controls>({ left: false, right: false, jump: false, enter: false, run: false })
  const heldKeys = useRef(new Set<string>())
  const heldPointers = useRef(new Map<number, keyof Controls>())
  const [status, setStatus] = useState('Loading the world…')

  useEffect(() => {
    let cancelled = false
    let game: PortfolioGame | undefined
    const reset = () => {
      heldKeys.current.clear()
      heldPointers.current.clear()
      Object.assign(controls.current, { left: false, right: false, jump: false, enter: false, run: false })
    }
    const escape = (event: globalThis.KeyboardEvent) => {
      if (event.code !== 'Escape') return
      event.preventDefault()
      if (event.repeat) return
      reset()
      setMenuOpen((open) => !open)
    }
    window.addEventListener('keydown', escape)
    window.addEventListener('blur', reset)
    document.addEventListener('visibilitychange', reset)

    import('../game/createGame').then(({ createGame }) => {
      if (cancelled || !host.current) return
      game = createGame(host.current, controls.current, () => {
        if (!cancelled) {
          setReady(true)
          setStatus('Arrow keys to move, Up or Space to jump, Shift to run, Down to enter a pipe. Escape opens the menu.')
          host.current?.focus({ preventScroll: true })
        }
      }, () => setMenuOpen(true))
      gameRef.current = game
    }).catch(() => {
      if (!cancelled) setStatus('The game could not load. Open the menu to go to Hello World.')
    })

    return () => {
      cancelled = true
      reset()
      window.removeEventListener('keydown', escape)
      window.removeEventListener('blur', reset)
      document.removeEventListener('visibilitychange', reset)
      gameRef.current = null
      game?.destroy(true)
    }
  }, [])

  useEffect(() => {
    heldKeys.current.clear()
    heldPointers.current.clear()
    Object.assign(controls.current, { left: false, right: false, jump: false, enter: false, run: false })
    for (const scene of gameRef.current?.scene.getScenes(false) ?? []) {
      if (menuOpen) gameRef.current?.scene.pause(scene)
      else if (scene.sys.isPaused()) gameRef.current?.scene.resume(scene)
    }
    if (menuOpen) {
      if (!menu.current?.open) menu.current?.showModal()
    } else {
      menu.current?.close()
      if (ready) host.current?.focus({ preventScroll: true })
    }
  }, [menuOpen, ready])

  const syncControls = () => {
    for (const action of ['left', 'right', 'jump', 'enter', 'run'] as const) {
      controls.current[action] = [...heldKeys.current].some((key) =>
        keyActions[key] === action || key === `button:${action}`,
      ) || [...heldPointers.current.values()].includes(action)
    }
  }

  const handleKey = (event: KeyboardEvent<HTMLDivElement>, pressed: boolean) => {
    const action = keyActions[event.code]
    if (!action || menuOpen) return
    event.preventDefault()
    if (pressed) heldKeys.current.add(event.code)
    else heldKeys.current.delete(event.code)
    syncControls()
  }

  const release = (event: PointerEvent<HTMLButtonElement>) => {
    heldPointers.current.delete(event.pointerId)
    syncControls()
  }
  const press = (event: PointerEvent<HTMLButtonElement>, action: keyof Controls) => {
    if (menuOpen) return
    event.preventDefault()
    event.currentTarget.setPointerCapture(event.pointerId)
    heldPointers.current.set(event.pointerId, action)
    syncControls()
  }

  return (
    <section className="game-landing" aria-label="Portfolio game">
      <div className="game-shell">
        <div
          className="game-stage"
          ref={host}
          tabIndex={0}
          role="group"
          aria-label="Interactive portfolio platform game"
          aria-describedby="game-instructions game-status"
          onPointerDown={() => host.current?.focus({ preventScroll: true })}
          onKeyDown={(event) => handleKey(event, true)}
          onKeyUp={(event) => handleKey(event, false)}
          onBlur={() => {
            heldKeys.current.clear()
            syncControls()
          }}
        />
        <button type="button" className={`menu-trigger${ready ? '' : ' menu-trigger-loading'}`} onClick={() => setMenuOpen(true)} aria-label="Open game menu" aria-haspopup="dialog"><span className={ready ? 'sr-only' : undefined}>Esc · Menu</span></button>
        <p id="game-instructions" className="sr-only"><strong>← →</strong> move · <strong>↑ / Space</strong> jump · <strong>↓</strong> enter pipe · <strong>Shift</strong> run · <strong>Esc</strong> menu</p>
        <div className="touch-controls" aria-label="Game controls">
          {(['left', 'right', 'run', 'jump', 'enter'] as const).map((action) => (
            <button
              key={action}
              type="button"
              aria-label={action === 'enter' ? 'Enter pipe' : action}
              onPointerDown={(event) => press(event, action)}
              onPointerUp={release}
              onPointerCancel={release}
              onLostPointerCapture={release}
              onKeyDown={(event) => {
                if (event.code === 'Space' || event.code === 'Enter') {
                  event.preventDefault()
                  heldKeys.current.add(`button:${action}`)
                  syncControls()
                }
              }}
              onKeyUp={(event) => {
                if (event.code !== 'Space' && event.code !== 'Enter') return
                heldKeys.current.delete(`button:${action}`)
                syncControls()
              }}
              onBlur={() => {
                heldKeys.current.delete(`button:${action}`)
                syncControls()
              }}
            >
              {{ left: '←', right: '→', run: 'Run', jump: 'Jump', enter: 'Enter ↓' }[action]}
            </button>
          ))}
        </div>
        <p id="game-status" className={ready ? 'sr-only' : 'game-status'} role="status">{status}</p>
      </div>

      <dialog
        ref={menu}
        className="pause-menu"
        aria-labelledby="menu-title"
        onCancel={(event) => { event.preventDefault(); setMenuOpen(false) }}
      >
        <h1 id="menu-title">Game paused</h1>
        <button type="button" autoFocus onClick={() => setMenuOpen(false)}>Resume</button>
        <a href="/hello-world">Quit Game</a>
        <p>Esc to resume</p>
      </dialog>
    </section>
  )
}

export default GameLanding
