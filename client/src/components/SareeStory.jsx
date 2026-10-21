import { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useSiteText, Rich } from '../utils/siteText.jsx';
import { cdn } from '../utils/cdn.js';

// Scroll-driven "A Saree's Story" sequence, styled after the reference video:
// a "Discover / Our Story" split card, then alternating chapters that slide in
// from opposite sides as they scroll into view. Everything is Sutaara's own
// palette, copy and pieces — no restaurant/menu content.

// Images stay here; all wording (kickers, headings, paragraphs, links) is
// editable from Admin → Site Text (see utils/siteText.jsx for the defaults).
const IMAGES = {
  intro: '/products/maroon-patola-ikat-1.jpg',
  chapters: [
    '/products/green-gold-leheriya-1.jpg',
    '/products/mauve-kalamkari-peacock-1.jpg',
    '/products/magenta-emerald-set-1.jpg',
  ],
};
const CHAPTER_KEYS = ['story_cloth', 'story_hand', 'story_wardrobe'];

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
        <img src={cdn(data.image, 1200)} alt={String(data.title).replace(/\*/g, '')} loading="lazy" />
      </div>
      <div className="saree-chapter__body">
        <span className="saree-chapter__kicker">{data.kicker}</span>
        <h3><Rich text={data.title} /></h3>
        <p>{data.body}</p>
        {data.link && data.link.label && (
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
  const text = useSiteText();
  const toCard = (s) => ({ kicker: s.kicker, title: s.title, body: s.body, link: { to: s.link, label: s.linkLabel } });
  const intro = { ...toCard(text.story_intro), image: IMAGES.intro };
  const chapters = CHAPTER_KEYS.map((k, i) => ({ ...toCard(text[k]), image: IMAGES.chapters[i] }));

  return (
    <div className="saree-story">
      {/* Discover / Our Story split card */}
      <div ref={introRef} className="saree-intro">
        <div className="saree-intro__media">
          <img src={cdn(intro.image, 1200)} alt="Sutaara story" loading="lazy" />
        </div>
        <div className="saree-intro__card">
          <span className="saree-intro__kicker">{intro.kicker}</span>
          <h2><Rich text={intro.title} /></h2>
          <p>{intro.body}</p>
          {intro.link && intro.link.label && (
            <Link to={intro.link.to} className="saree-chapter__link">
              {intro.link.label} <span aria-hidden="true">→</span>
            </Link>
          )}
        </div>
      </div>

      {chapters.map((ch, i) => (
        <Chapter key={CHAPTER_KEYS[i]} data={ch} flip={i % 2 === 1} />
      ))}
    </div>
  );
}
