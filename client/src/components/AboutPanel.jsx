import { useEffect } from 'react';

const STORY = [
  {
    type: 'lead',
    text: 'Sutaara started as a simple conversation between two sisters who wanted to build something of their own.',
    sub: 'That was three years ago.',
  },
  {
    type: 'body',
    text: "We didn't have to look far for what that \u201csomething\u201d should be. Growing up, we watched our mother get ready \u2014 and it was never just wearing a saree for her, it was styling it. The same six yards draped a different way for a Tuesday than for a wedding, an old dupatta paired with something nobody else would think to pair, jewellery chosen like it was the last piece of a puzzle. Getting dressed, for her, was never routine. It was joy. We asked her to be part of it, and Sutaara became a family thing before it became a brand.",
  },
  {
    type: 'quote',
    text: 'The name comes from Sutara \u2014 holy star. We believe every woman carries her own quiet kind of light, and what she wears should feel like an extension of that.',
  },
  {
    type: 'body',
    text: 'Most of what we curate \u2014 sarees, unstitched suits, blouses, dupattas \u2014 is handwoven and hand-finished by artisans, in techniques that take time we are happy to give. Nothing here is rushed, and nothing is made to be worn once.',
  },
  {
    type: 'body',
    text: "Our pieces aren\u2019t picked because they\u2019re \u201cin\u201d this season. They\u2019re picked because they\u2019ll still feel right on you when the season\u2019s long gone.",
  },
  {
    type: 'closing',
    text: 'This is Sutaara. Rooted in craft, curated for today.',
  },
];

export default function AboutPanel({ open, onClose }) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  return (
    <>
      <div
        className={`ap-scrim${open ? ' ap-scrim--on' : ''}`}
        onClick={onClose}
        aria-hidden="true"
      />

      <div
        className={`ap${open ? ' ap--open' : ''}`}
        role="dialog"
        aria-modal="true"
        aria-label="About Sutaara"
      >
        <div className="ap__bar" />

        <button className="ap__close" onClick={onClose} aria-label="Close about panel">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
            <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>

        <div className="ap__body">
          <div className="ap__star" aria-hidden="true">✦</div>
          <span className="ap__kicker">Our Story</span>
          <h2 className="ap__heading">Two sisters,<br /><em>one conversation.</em></h2>
          <hr className="ap__rule" />

          <div className="ap__story">
            {STORY.map((p, i) => (
              <div key={i} className={`ap__para ap__para--${p.type}`} style={{ '--d': `${0.2 + i * 0.09}s` }}>
                {p.type === 'lead' && (
                  <>
                    <p className="ap__lead">{p.text}</p>
                    <p className="ap__sub">{p.sub}</p>
                  </>
                )}
                {p.type === 'quote' && <blockquote className="ap__quote">{p.text}</blockquote>}
                {p.type === 'body' && <p>{p.text}</p>}
                {p.type === 'closing' && <p className="ap__closing">{p.text}</p>}
              </div>
            ))}
          </div>

          <div className="ap__ornament" aria-hidden="true">✦ ✦ ✦</div>
        </div>
      </div>
    </>
  );
}