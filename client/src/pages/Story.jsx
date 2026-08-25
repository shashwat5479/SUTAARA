import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import SareeStory from '../components/SareeStory.jsx';

// Full "A Saree's Story" experience on a dark, cinematic theme. Reached from
// the homepage "Discover the Story" button and the Stories menu.
export default function Story() {
  // Add a class to <body> so the dark theme can extend edge-to-edge behind
  // the header while this page is mounted; removed on unmount.
  useEffect(() => {
    document.body.classList.add('theme-dark-page');
    return () => document.body.classList.remove('theme-dark-page');
  }, []);

  return (
    <div className="story-page">
      {/* Cinematic dark hero */}
      <section className="story-hero">
        <div className="story-hero__bg" style={{ backgroundImage: 'url(/products/maroon-patola-ikat-1.jpg)' }} />
        <div className="story-hero__scrim" />
        <div className="container story-hero__inner">
          <span className="story-hero__kicker">A Saree's Story</span>
          <h1>Woven by hand,<br /><em>worn with meaning</em></h1>
          <p>
            Every Sutaara piece begins as a story, not a stock number. Scroll on to
            follow the thread — from the loom in Lucknow to the drape that becomes yours.
          </p>
          <a href="#story-begins" className="btn btn--gold">Begin the story</a>
        </div>
      </section>

      {/* The scroll-driven narrative, on dark */}
      <section className="story-body" id="story-begins">
        <div className="container">
          <SareeStory />
        </div>
      </section>

      <section className="story-outro">
        <div className="container">
          <h2>Find the piece that's yours</h2>
          <div className="story-outro__cta">
            <Link to="/shop" className="btn btn--gold">Shop the collection</Link>
            <Link to="/studio" className="btn btn--ghost-light">Visit the studio</Link>
          </div>
        </div>
      </section>
    </div>
  );
}
