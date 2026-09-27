import { useCallback, useEffect, useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'

/**
 * Rotating black-and-white background behind the home hero.
 *
 * IMAGE SLOTS: 4 photos of Yale students on campus wearing Yale gear live in
 * `frontend/public/hero/` as 1.jpg..4.jpg, shown in black & white. Each lasts
 * 15 seconds and advances automatically, looping. Prev/next arrows and dots let
 * the user move manually; a manual move resets the 15-second timer.
 *
 * The media layer and the controls are returned as siblings of the hero content
 * (via a fragment) so the arrows/dots sit above the text layer and are clickable.
 */
const SLIDES = ['/hero/1.jpg', '/hero/2.jpg', '/hero/3.jpg', '/hero/4.jpg']
const INTERVAL_MS = 15000

export default function HeroCarousel() {
  const [index, setIndex] = useState(0)
  const [available, setAvailable] = useState<boolean[]>(() => SLIDES.map(() => true))

  const go = useCallback((dir: number) => {
    setIndex((i) => (i + dir + SLIDES.length) % SLIDES.length)
  }, [])

  // Auto-advance every 15s. Re-runs whenever `index` changes, so any manual
  // navigation resets the timer to a full 15 seconds.
  useEffect(() => {
    const id = setTimeout(() => go(1), INTERVAL_MS)
    return () => clearTimeout(id)
  }, [index, go])

  return (
    <>
      <div className="hero-media" aria-hidden="true">
        {SLIDES.map((src, i) =>
          available[i] ? (
            <img
              key={src}
              src={src}
              alt=""
              className={`hero-slide ${i === index ? 'active' : ''}`}
              onError={() => setAvailable((a) => a.map((v, j) => (j === i ? false : v)))}
            />
          ) : null,
        )}
      </div>

      <button type="button" className="hero-nav prev" onClick={() => go(-1)} aria-label="Previous image">
        <ChevronLeft size={28} />
      </button>
      <button type="button" className="hero-nav next" onClick={() => go(1)} aria-label="Next image">
        <ChevronRight size={28} />
      </button>

      <div className="hero-dots" role="tablist" aria-label="Choose hero image">
        {SLIDES.map((_, i) => (
          <button
            key={i}
            type="button"
            className={`hero-dot ${i === index ? 'active' : ''}`}
            aria-label={`Go to image ${i + 1}`}
            aria-selected={i === index}
            role="tab"
            onClick={() => setIndex(i)}
          />
        ))}
      </div>
    </>
  )
}
