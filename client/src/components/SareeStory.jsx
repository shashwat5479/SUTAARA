import { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';

// Scroll-driven "A Saree's Story" sequence, styled after the reference video:
// a "Discover / Our Story" split card, then alternating chapters that slide in
// from opposite sides as they scroll into view. Everything is Sutaara's own
// palette, copy and pieces — no restaurant/menu content.

const STORY = {
  intro: {
    kicker: 'Discover',
    title: 'Our Story',
    body:
      'Sutaara began in a small Lucknow studio with a single belief — that a ' +
      'saree should carry the mark of the hand that made it. Every piece is ' +
      'painted, woven or embroidered in small batches by artisans we know by ' +
      'name, so what you drape is never mass-produced, and never quite like ' +
      'anyone else\u2019s.',
    image: '/products/maroon-patola-ikat-1.jpg',
    link: { to: '/shop', label: 'More about us' },
  },
  chapters: [
    {
      kicker: 'The Cloth',
      title: 'Barish & Dhoop',
      body:
        'Our signature red mul cotton was born of two seasons at once — light ' +
        'as monsoon air, warm as afternoon sun. Woven to move with you, and to ' +
        'last long enough to be handed down.',
      image: '/products/green-gold-leheriya-1.jpg',
      link: { to: '/product/maroon-patola-ikat', label: 'Discover the piece' },
    },
    {
      kicker: 'The Hand',
      title: 'Painted, not printed',
      body:
        'Kalamkari and madhubani motifs are drawn by hand, one line at a time. ' +
        'No two peacocks turn their head the same way — the small differences ' +
        'are the signature of a real maker, not a machine.',
      image: '/products/mauve-kalamkari-peacock-1.jpg',
      link: { to: '/shop?category=saree', label: 'See the sarees' },
    },
    {
      kicker: 'The Wardrobe',
      title: 'Made to be worn',
      body:
        'Chikankari suits, one-of-a-kind blouses and festive sets — pieces meant ' +
        'for the everyday and the once-in-a-lifetime alike. Kept in small ' +
        'batches so each finds the person it was made for.',
      image: '/products/magenta-emerald-set-1.jpg',
      link: { to: '/shop', label: 'Explore the collection' },
    },
  ],
};

function useReveal() {
  const ref = useRef(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return undefined;
    if (typeof IntersectionObserver === 'undefined') {
      el.classList.add('in-view');
      return undefined;
    }
    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add('in-view');
            obs.unobserve(e.target);
          }
        });
      },
      { threshold: 0.25, rootMargin: '0px 0px -60px 0px' }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  return ref;
}

function Chapter({ data, flip }) {
  const ref = useReveal();
  return (
    <div ref={ref} className={`saree-chapter ${flip ? 'saree-chapter--flip' : ''}`}>
      <div className="saree-chapter__media">
        <img src={data.image} alt={data.title} loading="lazy" />
      </div>
      <div className="saree-chapter__body">
        <span className="saree-chapter__kicker">{data.kicker}</span>
        <h3>{data.title}</h3>
        <p>{data.body}</p>
        {data.link && (
          <Link to={data.link.to} className="saree-chapter__link">
            {data.link.label} <span aria-hidden="true">→</span>
          </Link>
        )}
      </div>
    </div>
  );
}

export default function SareeStory() {
  const introRef = useReveal();
  const { intro, chapters } = STORY;

  return (
    <div className="saree-story">
      {/* Discover / Our Story split card */}
      <div ref={introRef} className="saree-intro">
        <div className="saree-intro__media">
          <img src={intro.image} alt="Sutaara story" loading="lazy" />
        </div>
        <div className="saree-intro__card">
          <span className="saree-intro__kicker">{intro.kicker}</span>
          <h2>{intro.title}</h2>
          <p>{intro.body}</p>
          {intro.link && (
            <Link to={intro.link.to} className="saree-chapter__link">
              {intro.link.label} <span aria-hidden="true">→</span>
            </Link>
          )}
        </div>
      </div>

      {chapters.map((ch, i) => (
        <Chapter key={ch.title} data={ch} flip={i % 2 === 1} />
      ))}
    </div>
  );
}
