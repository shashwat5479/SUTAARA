import { useEffect, useState } from 'react';
import Slideshow from './Slideshow.jsx';

// Different sarees from the homepage hero, so the sign-in/sign-up page
// doesn't feel like a repeat of the page the person just came from.
const AUTH_SLIDES = [
  '/products/mustard-turquoise-set-1.jpg',
  '/products/peach-leheriya-organza-1.jpg',
  '/products/lavender-bird-chiffon-1.jpg',
  '/products/magenta-emerald-set-1.jpg',
];

export default function AuthShowcase({ children }) {
  const [opened, setOpened] = useState(false);

  useEffect(() => {
    // Hold on the wrapped box a moment so the unwrap reads as a real reveal.
    const t = setTimeout(() => setOpened(true), 900);
    return () => clearTimeout(t);
  }, []);

  return (
    <section className="auth-page">
      <div className="auth-page__bg">
        <Slideshow images={AUTH_SLIDES} interval={5000} />
      </div>
      <div className="auth-page__scrim" />

      <div className="auth-page__stage">
        <div className={`gift-box ${opened ? 'gift-box--open' : ''}`}>
          <div className="gift-box__ribbon-v" />
          <div className="gift-box__ribbon-h" />
          <div className="gift-box__lid" />
          <div className="gift-box__bow">✦</div>

          <div className="gift-box__card">{children}</div>

          {opened && (
            <div className="gift-box__sparkles" aria-hidden="true">
              {Array.from({ length: 10 }).map((_, i) => (
                <span key={i} className={`spark spark-${i}`} />
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
