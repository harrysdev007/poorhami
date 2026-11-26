import React, { useState, useCallback, useRef, useEffect } from 'react'
import { Canvas } from '@react-three/fiber'
import { useProgress } from '@react-three/drei'
import {
  MousePointerClick,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
  X,
  Sparkles,
  Download,
  Shuffle,
  Check,
  RotateCw,
} from 'lucide-react'
import * as THREE from 'three'
import Scene from './scene/Scene.jsx'
import GalleryScene from './scene/GalleryScene.jsx'
import { MEME_ITEMS } from './scene/HologramGallery.jsx'
import PfpStudioScene, { PFP_BACKDROPS } from './scene/PfpStudioScene.jsx'

const HAMSTER_LINES = [
  "Wallet's empty, bro...",
  'Bought the top again...',
  'Not a single coin left.',
  '$PUMPHAMI to the moon?',
  'Still waiting for payday...',
]

const HAT_OPTIONS = [
  { id: 'none', label: 'None' },
  { id: 'crown', label: 'Crown' },
  { id: 'mcd', label: 'McD Cap' },
  { id: 'wizard', label: 'Wizard' },
  { id: 'halo', label: 'Halo' },
]

const GLASSES_OPTIONS = [
  { id: 'none', label: 'None' },
  { id: 'shades', label: 'Shades' },
  { id: 'lasers', label: 'Lasers' },
  { id: 'visor', label: 'Visor' },
]

const AURA_OPTIONS = [
  { id: 'none', label: 'None' },
  { id: 'coins', label: 'Coins' },
  { id: 'candles', label: 'Red Candles' },
  { id: 'sparkles', label: 'Neon Cubes' },
]

function LoadingScreen() {
  const { active, progress } = useProgress()
  if (!active && progress >= 100) return null
  return (
    <div className="loader-overlay">
      <div className="loader-cube" />
      <div style={{ fontSize: 13, color: '#bae6fd', letterSpacing: '0.06em' }}>
        LOADING $PUMPHAMI WORLD... {Math.round(progress)}%
      </div>
    </div>
  )
}

export default function App() {
  const [page, setPage] = useState('home') // 'home' | 'gallery' | 'pfp'
  const [transitioning, setTransitioning] = useState(false)
  const [freeCamera, setFreeCamera] = useState(false)
  const [toast, setToast] = useState(null)
  const [selectedMeme, setSelectedMeme] = useState(null)

  // PFP Studio state
  const [pfpBackdrop, setPfpBackdrop] = useState('cyber')
  const [pfpHat, setPfpHat] = useState('crown')
  const [pfpGlasses, setPfpGlasses] = useState('shades')
  const [pfpAura, setPfpAura] = useState('coins')
  const [pfpSpin, setPfpSpin] = useState(false)
  const [pfpBadge, setPfpBadge] = useState(true)
  const [downloaded, setDownloaded] = useState(false)

  const canvasElRef = useRef(null)
  const lineIndexRef = useRef(0)
  const timerRef = useRef(null)

  const navigateTo = useCallback(
    (targetPage) => {
      if (targetPage === page || transitioning) return
      setTransitioning(true)
      setToast(null)
      setSelectedMeme(null)
      setTimeout(() => {
        setPage(targetPage)
        setFreeCamera(false)
        setTimeout(() => setTransitioning(false), 180)
      }, 280)
    },
    [page, transitioning]
  )

  const handlePokeHamster = useCallback(() => {
    const line = HAMSTER_LINES[lineIndexRef.current % HAMSTER_LINES.length]
    lineIndexRef.current += 1
    setToast(line)
    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => setToast(null), 2600)
  }, [])

  const randomizePfp = useCallback(() => {
    const bKeys = Object.keys(PFP_BACKDROPS)
    setPfpBackdrop(bKeys[Math.floor(Math.random() * bKeys.length)])
    setPfpHat(HAT_OPTIONS[Math.floor(Math.random() * HAT_OPTIONS.length)].id)
    setPfpGlasses(
      GLASSES_OPTIONS[Math.floor(Math.random() * GLASSES_OPTIONS.length)].id
    )
    setPfpAura(
      AURA_OPTIONS[Math.floor(Math.random() * AURA_OPTIONS.length)].id
    )
  }, [])

  const downloadPfp = useCallback(() => {
    const srcCanvas = canvasElRef.current
    if (!srcCanvas) return

    const outSize = 1024
    const out = document.createElement('canvas')
    out.width = outSize
    out.height = outSize
    const ctx = out.getContext('2d')

    // Crop square centered on the hamster (upper-center on mobile portrait, dead-center on desktop)
    const sw = srcCanvas.width
    const sh = srcCanvas.height
    const crop = Math.min(sw, sh)
    const sx = (sw - crop) / 2
    const sy = sw < sh ? Math.max(0, sh * 0.34 - crop / 2) : (sh - crop) / 2

    ctx.drawImage(srcCanvas, sx, sy, crop, crop, 0, 0, outSize, outSize)

    // Optional crisp $POORHAMI badge stamp in bottom-right
    if (pfpBadge) {
      ctx.save()
      ctx.fillStyle = 'rgba(6, 14, 58, 0.72)'
      ctx.strokeStyle = 'rgba(103, 232, 249, 0.85)'
      ctx.lineWidth = 3
      const bw = 248
      const bh = 54
      const bx = outSize - bw - 32
      const by = outSize - bh - 32
      ctx.beginPath()
      ctx.roundRect(bx, by, bw, bh, 27)
      ctx.fill()
      ctx.stroke()

      ctx.fillStyle = '#ffffff'
      ctx.font = 'bold 24px monospace'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText('$PUMPHAMI', bx + bw / 2, by + bh / 2 + 1)
      ctx.restore()
    }

    const link = document.createElement('a')
    link.download = `pumphami-pfp-${Date.now()}.png`
    link.href = out.toDataURL('image/png')
    link.click()

    setDownloaded(true)
    setTimeout(() => setDownloaded(false), 2000)
  }, [pfpBadge])

  // Keyboard navigation for meme lightbox (Esc, Left, Right)
  useEffect(() => {
    if (!selectedMeme) return
    const onKeyDown = (e) => {
      if (e.key === 'Escape') setSelectedMeme(null)
      if (e.key === 'ArrowRight') {
        const idx = MEME_ITEMS.findIndex((m) => m.id === selectedMeme.id)
        setSelectedMeme(MEME_ITEMS[(idx + 1) % MEME_ITEMS.length])
      }
      if (e.key === 'ArrowLeft') {
        const idx = MEME_ITEMS.findIndex((m) => m.id === selectedMeme.id)
        setSelectedMeme(
          MEME_ITEMS[(idx - 1 + MEME_ITEMS.length) % MEME_ITEMS.length]
        )
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [selectedMeme])

  const stepMeme = (dir) => {
    if (!selectedMeme) return
    const idx = MEME_ITEMS.findIndex((m) => m.id === selectedMeme.id)
    setSelectedMeme(
      MEME_ITEMS[(idx + dir + MEME_ITEMS.length) % MEME_ITEMS.length]
    )
  }

  const cameraConfig =
    page === 'home'
      ? { position: [0.15, 0.55, 5.4], fov: 44 }
      : page === 'gallery'
        ? { position: [0, 0.72, 5.55], fov: 44 }
        : { position: [0, 0.25, 4.15], fov: 42 }

  return (
    <div className="app-root">
      {/* Fullscreen interactive 3D Canvas */}
      <div className={`canvas-layer ${transitioning ? 'fade-out' : ''}`}>
        <Canvas
          key={page}
          shadows
          dpr={[1, 2]}
          camera={{ ...cameraConfig, near: 0.1, far: 100 }}
          gl={{
            antialias: true,
            preserveDrawingBuffer: true,
            toneMapping: THREE.ACESFilmicToneMapping,
            toneMappingExposure: 1.08,
          }}
          onCreated={({ gl }) => {
            canvasElRef.current = gl.domElement
          }}
        >
          {page === 'home' && (
            <Scene
              freeCamera={freeCamera}
              windStrength={1.0}
              onPokeHamster={handlePokeHamster}
            />
          )}
          {page === 'gallery' && (
            <GalleryScene
              freeCamera={freeCamera}
              onSelectMeme={setSelectedMeme}
            />
          )}
          {page === 'pfp' && (
            <PfpStudioScene
              backdrop={pfpBackdrop}
              hat={pfpHat}
              glasses={pfpGlasses}
              aura={pfpAura}
              spin={pfpSpin}
            />
          )}
        </Canvas>
      </div>

      {/* Subtle 1:1 PFP square frame guide on PFP Studio */}
      {page === 'pfp' && <div className="pfp-crop-guide" />}

      {/* Speech bubble when clicking the hamster on Home */}
      {page === 'home' && toast && <div className="hamster-toast">🐹 {toast}</div>}

      {/* Minimalist floating UI overlay */}
      <div className="ui-layer">
        <header className="top-nav">
          <button
            type="button"
            className="brand-pill"
            onClick={() => navigateTo('home')}
            style={{ cursor: 'pointer' }}
          >
            <span className="brand-dot" />
            <span className="brand-name">$PUMPHAMI</span>
          </button>

          {page !== 'home' && (
            <button
              type="button"
              className="portal-btn portal-btn-up"
              onClick={() => navigateTo('home')}
            >
              <ChevronUp size={18} className="bounce-up" />
              <span>BACK TO HOME</span>
            </button>
          )}

          <div className="nav-controls">
            {page === 'pfp' && (
              <button
                type="button"
                className={`glass-btn ${pfpSpin ? 'active' : ''}`}
                onClick={() => setPfpSpin((v) => !v)}
              >
                <RotateCw size={15} />
                <span>{pfpSpin ? 'Spinning' : 'Auto-Spin'}</span>
              </button>
            )}

            {page !== 'pfp' && (
              <a
                href="https://x.com/pumphami_sol"
                target="_blank"
                rel="noopener noreferrer"
                className="x-pill"
                title="Follow @pumphami_sol on X"
              >
                <svg
                  width="15"
                  height="15"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  aria-hidden="true"
                >
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                </svg>
                <span>@pumphami_sol</span>
              </a>
            )}
          </div>
        </header>

        {/* PFP Studio Customizer Panel on the left */}
        {page === 'pfp' && (
          <aside className="pfp-panel">
            <div className="pfp-panel-title">PFP STUDIO</div>

            <div className="pfp-group">
              <div className="pfp-label">BACKDROP</div>
              <div className="pfp-chips">
                {Object.entries(PFP_BACKDROPS).map(([id, b]) => (
                  <button
                    key={id}
                    type="button"
                    className={`pfp-chip ${pfpBackdrop === id ? 'active' : ''}`}
                    onClick={() => setPfpBackdrop(id)}
                  >
                    <span
                      className="pfp-swatch"
                      style={{ background: b.bottom }}
                    />
                    {b.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="pfp-group">
              <div className="pfp-label">HAT</div>
              <div className="pfp-chips">
                {HAT_OPTIONS.map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    className={`pfp-chip ${pfpHat === opt.id ? 'active' : ''}`}
                    onClick={() => setPfpHat(opt.id)}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="pfp-group">
              <div className="pfp-label">EYES</div>
              <div className="pfp-chips">
                {GLASSES_OPTIONS.map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    className={`pfp-chip ${pfpGlasses === opt.id ? 'active' : ''}`}
                    onClick={() => setPfpGlasses(opt.id)}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="pfp-group">
              <div className="pfp-label">AURA</div>
              <div className="pfp-chips">
                {AURA_OPTIONS.map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    className={`pfp-chip ${pfpAura === opt.id ? 'active' : ''}`}
                    onClick={() => setPfpAura(opt.id)}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            <label className="pfp-toggle-row">
              <input
                type="checkbox"
                checked={pfpBadge}
                onChange={(e) => setPfpBadge(e.target.checked)}
              />
              <span>Include $PUMPHAMI badge</span>
            </label>

            <div className="pfp-actions">
              <button
                type="button"
                className="pfp-rand-btn"
                onClick={randomizePfp}
              >
                <Shuffle size={16} />
                <span>RANDOM</span>
              </button>
              <button
                type="button"
                className="pfp-dl-btn"
                onClick={downloadPfp}
              >
                {downloaded ? <Check size={16} /> : <Download size={16} />}
                <span>{downloaded ? 'SAVED!' : 'DOWNLOAD PFP'}</span>
              </button>
            </div>
          </aside>
        )}

        <footer className="footer-bar">
          {page === 'home' && (
            <div className="portal-group">
              <button
                type="button"
                className="portal-btn portal-btn-down"
                onClick={() => navigateTo('gallery')}
              >
                <span>MEME GALLERY</span>
                <ChevronDown size={22} className="bounce-down" />
              </button>

              <button
                type="button"
                className="portal-btn portal-btn-pfp"
                onClick={() => navigateTo('pfp')}
              >
                <Sparkles size={19} />
                <span>PFP GENERATOR</span>
              </button>
            </div>
          )}

          {page === 'gallery' && (
            <div className="gallery-tag">HOLOGRAPHIC MEME GALLERY</div>
          )}

          {page === 'pfp' && (
            <div className="gallery-tag">
              DRAG TO ROTATE · SCROLL TO ZOOM · 1024×1024 PNG
            </div>
          )}

          <div className="hint-pill">
            <MousePointerClick size={14} color="#86efac" />
            <span>
              {page === 'pfp'
                ? 'Rotate hamster & click Download PFP'
                : freeCamera
                  ? 'Drag to orbit · Scroll to zoom'
                  : page === 'home'
                    ? 'Move mouse for parallax · Click the hamster'
                    : 'Hover holograms · Click any meme to expand'}
            </span>
          </div>
        </footer>
      </div>

      {/* Fullscreen Holographic Meme Lightbox */}
      {selectedMeme && (
        <div
          className="holo-modal-backdrop"
          onClick={() => setSelectedMeme(null)}
        >
          <div
            className="holo-modal-card"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              className="holo-close-btn"
              onClick={() => setSelectedMeme(null)}
              aria-label="Close"
            >
              <X size={18} />
            </button>

            <button
              type="button"
              className="holo-nav-btn holo-prev"
              onClick={() => stepMeme(-1)}
              aria-label="Previous meme"
            >
              <ChevronLeft size={22} />
            </button>

            <img
              src={selectedMeme.src}
              alt={selectedMeme.title}
              className="holo-modal-img"
            />

            <button
              type="button"
              className="holo-nav-btn holo-next"
              onClick={() => stepMeme(1)}
              aria-label="Next meme"
            >
              <ChevronRight size={22} />
            </button>

            <div className="holo-modal-info">
              <div className="holo-modal-title">{selectedMeme.title}</div>
              <div className="holo-modal-caption">{selectedMeme.caption}</div>
            </div>
          </div>
        </div>
      )}

      <LoadingScreen />
    </div>
  )
}
