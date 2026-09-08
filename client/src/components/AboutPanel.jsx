import { useEffect, useRef } from 'react';

const STORY_PARAGRAPHS = [
  {
    type: 'opening',
    text: 'Sutaara started as a simple conversation between two sisters who wanted to build something of their own.',
    sub: 'That was three years ago.',
  },
  {
    type: 'body',
    text: "We didn't have to look far for what that something should be. Growing up, we watched our mother get ready — and it was never just wearing a saree for her, it was styling it. The same six yards draped a different way for a Tuesday than for a wedding, an old dupatta paired with something nobody else would think to pair, jewellery chosen like it was the last piece of a puzzle. Getting dressed, for her, was never routine. It was joy. We asked her to be part of it, and Sutaara became a family thing before it became a brand.",
  },
  {
    type: 'name',
    text: 'The name comes from Sutara — holy star. We believe every woman carries her own quiet kind of light, and what she wears should feel like an extension of that.',
  },
  {
    type: 'craft',
    text: 'Most of what we curate — sarees, unstitched suits, blouses, dupattas — is handwoven and hand-finished by artisans, in techniques that take time we are happy to give. Nothing here is rushed, and nothing is made to be worn once.',
  },
  {
    type: 'philosophy',
    text: "Our pieces aren't picked because they're "in" this season. They're picked because they'll still feel right on you when the season's long gone.",
  },
  {
    type: 'closing',
    text: 'This is Sutaara. Rooted in craft, curated for today.',
  },
];

export default function AboutPanel({ open, onClose }) {
  const panelRef = useRef(null);

  // Trap focus & ESC close
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  // Lock scroll
  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  return (
    <>
      {/* Scrim */}
      <div
        className={`about-scrim ${open ? 'about-scrim--visible' : ''}`}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Panel */}
      <div
        ref={panelRef}
        className={`about-panel ${open ? 'about-panel--open' : ''}`}
        role="dialog"
        aria-modal="true"
        aria-label="About Sutaara"
      >
        {/* Decorative ink bleed bar at top */}
        <div className="about-panel__ink-bar" />

        {/* Close */}
        <button className="about-panel__close" onClick={onClose} aria-label="Close">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>

        <div className="about-panel__inner">
          {/* Floating star ornament */}
          <div className="about-panel__star" aria-hidden="true">✦</div>

          {/* Kicker */}
          <span className="about-panel__kicker">Our Story</span>

          {/* Headline */}
          <h2 className="about-panel__headline">
            Two sisters,<br />
            <em>one conversation.</em>
          </h2>

          <hr className="about-panel__rule" />

          {/* Story paragraphs */}
          <div className="about-panel__story">
            {STORY_PARAGRAPHS.map((p, i) => (
              <div
                key={i}
                className={`about-panel__para about-panel__para--${p.type}`}
                style={{ '--delay': `${0.18 + i * 0.09}s` }}
              >
                {p.type === 'opening' ? (
                  <>
                    <p className="about-panel__lead">{p.text}</p>
                    <p className="about-panel__sub">{p.sub}</p>
                  </>
                ) : p.type === 'name' ? (
                  <blockquote className="about-panel__quote">{p.text}</blockquote>
                ) : p.type === 'closing' ? (
                  <p className="about-panel__closing">{p.text}</p>
                ) : (
                  <p>{p.text}</p>
                )}
              </div>
            ))}
          </div>

          {/* Bottom ornament */}
          <div className="about-panel__ornament" aria-hidden="true">✦ ✦ ✦</div>
        </div>

        {/* Decorative side weave pattern */}
        <div className="about-panel__weave" aria-hidden="true">
          {Array.from({ length: 18 }).map((_, i) => (
            <div key={i} className="about-panel__weave-thread" style={{ '--n': i }} />
          ))}
        </div>
      </div>
    </>
  );
}