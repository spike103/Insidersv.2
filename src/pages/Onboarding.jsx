import React, { useState } from 'react'
import { useApp } from '../contexts/AppContext.jsx'
import Icon from '../components/Icon.jsx'

const SLIDES = [
  {
    verb: 'FOLLOW',
    rest: 'every match with advanced insights',
    body: 'Tu as accès aux scores en direct, aux stats les plus avancées, à des analyses ultra-détaillées et plus encore.',
    image: '/illustrations/tennis-court.png',
  },
  {
    verb: 'ADD',
    rest: 'your bets & keep track of your results',
    body: "Sur la page Mes paris, ajoute une photo de ton pari et boom — le résultat sera enregistré et tu pourras suivre ton évolution.",
    image: '/illustrations/illus-bets.png',
  },
  {
    verb: 'DISCOVER',
    rest: 'the best tennis community',
    body: "Sur la page d'accueil, clique sur communauté et découvre un espace pour ajouter tes amis, suivre tes tipsters favoris et publier tes analyses.",
    image: '/illustrations/illus-community.png',
  },
]

export default function Onboarding() {
  const { setOnboardingDone } = useApp()
  const [slide, setSlide] = useState(0)
  const next = () => {
    if (slide < SLIDES.length - 1) setSlide(slide + 1)
    else setOnboardingDone()
  }
  const skip = () => setOnboardingDone()
  const current = SLIDES[slide]

  return (
    <div className="min-h-screen court-bg flex flex-col safe-top safe-bottom">
      {/* Top bar */}
      <div className="flex items-center justify-between px-5 pt-4 h-14">
        <button
          onClick={() => slide > 0 && setSlide(slide - 1)}
          className="w-9 h-9 rounded-full flex items-center justify-center"
          style={{ background: 'var(--ink-800)', opacity: slide > 0 ? 1 : 0, pointerEvents: slide > 0 ? 'auto' : 'none' }}
        >
          <Icon name="chevron_left" size={18} />
        </button>
        <span className="micro text-fg-1" style={{ fontWeight: 700 }}>{slide + 1}/{SLIDES.length}</span>
      </div>

      <div className="flex-1 flex flex-col px-6 pt-8">
        <h1 className="display" style={{ fontSize: 30, lineHeight: 1.1, marginBottom: 14 }}>
          <span className="accent-word">{current.verb}</span>{' '}
          <span style={{ color: 'white', fontStyle: 'italic' }}>{current.rest}</span>
        </h1>
        <p className="body" style={{ color: 'var(--fg-2)', marginBottom: 28 }}>
          {current.body}
        </p>

        <div
          className="rounded-2xl overflow-hidden mx-auto w-full"
          style={{ maxWidth: 320, aspectRatio: '1', border: '1px solid var(--ink-600)' }}
        >
          <img
            src={current.image}
            alt=""
            style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
          />
        </div>
      </div>

      <div className="px-6 pb-8 pt-6 space-y-3">
        <div className="flex items-center justify-center gap-2 mb-2">
          {SLIDES.map((_, i) => (
            <div
              key={i}
              className="rounded-full transition-all"
              style={{
                width: i === slide ? 28 : 8, height: 6,
                background: i === slide ? 'var(--blue-500)' : 'rgba(255,255,255,0.2)',
              }}
            />
          ))}
        </div>
        <button onClick={next} className="btn-primary">
          {slide === SLIDES.length - 1 ? 'Commencer' : 'Continuer'}
        </button>
        {slide < SLIDES.length - 1 && (
          <div className="text-center">
            <button onClick={skip} className="btn-skip">skip</button>
          </div>
        )}
      </div>
    </div>
  )
}
