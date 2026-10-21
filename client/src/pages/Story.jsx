import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import SareeStory from '../components/SareeStory.jsx';
import { api } from '../api/client.js';
import { editPath } from '../utils/format.js';
import { useSiteText, Rich } from '../utils/siteText.jsx';
import { cdn } from '../utils/cdn.js';

// Full "A Saree's Story" experience on a dark, cinematic theme. Reached from
// the homepage "Discover the Story" button and the Stories menu.
export default function Story() {
  const [edits, setEdits] = useState([]);
  const text = useSiteText();
  const hero = text.edits_hero;

  // Add a class to <body> so the dark theme can extend edge-to-edge behind
  // the header while this page is mounted; removed on unmount.
  useEffect(() => {
    document.body.classList.add('theme-dark-page');
    return () => document.body.classList.remove('theme-dark-page');
  }, []);

  useEffect(() => {
    api.getCuratedEdits().then(setEdits).catch(() => {});
  }, []);

  return (
    <div className="story-page">
      {/* Cinematic dark hero */}
      <section className="story-hero">
        <div className="story-hero__bg" style={{ backgroundImage: 'url(/products/maroon-patola-ikat-1.jpg)' }} />
        <div className="story-hero__scrim" />
        <div className="container story-hero__inner">
          <span className="story-hero__kicker">{hero.kicker}</span>
          <h1><Rich text={hero.title} /></h1>
          <p>{hero.body}</p>
          <a href="#story-begins" className="btn btn--gold">{hero.button}</a>
        </div>
      </section>

      {/* Curated edits — admin-editable panels */}
      {edits.length > 0 && (
        <section className="story-edits" id="edits">
          <div className="container">
            <div className="story-edits__head">
              <span className="story-edits__kicker">Curated for you</span>
              <h2>Explore the edits</h2>
            </div>
            <div className="story-edits__grid">
              {edits.map((edit) => (
                <Link key={edit._id} to={editPath(edit)} className="edit-card">
                  {edit.products?.length > 0 ? (
                    <div className="edit-card__products">
                      {edit.products.slice(0, 4).map((p) => (
                        <div key={p._id || p.id} className="edit-card__product" style={{ backgroundImage: `url(${cdn(p.images?.[0] || edit.image, 800)})` }} />
                      ))}
                    </div>
                  ) : edit.image && (
                    <div className="edit-card__img" style={{ backgroundImage: `url(${cdn(edit.image, 1000)})` }} />
                  )}
                  <div className="edit-card__body">
                    <h3>{edit.title}</h3>
                    <p>{edit.description}</p>
                    <span className="edit-card__arrow">
                      Explore →
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* The scroll-driven narrative, on dark */}
      <section className="story-body" id="story-begins">
        <div className="container">
          <SareeStory />
        </div>
      </section>

      {/* Care & keeping — "Read the guide" links on the homepage land here */}
      <section className="story-care" id="care">
        <div className="container">
          <div className="story-care__head">
            <span className="story-care__kicker">Chapter IV — Keeping the Story</span>
            <h2>Care &amp; keeping</h2>
            <p>A handloom saree can last generations. A little care goes a long way.</p>
          </div>

          <div className="story-care__grid">
            <article className="story-care__card" id="care-fabric">
              <span className="story-care__eyebrow">Fabric care</span>
              <h3>How to keep your saree new</h3>
              <ul>
                <li><strong>Store with space.</strong> Keep sarees folded along the grain, wrapped in soft cotton or muslin — never plastic. Store jewellery and sarees apart so zari and stones don't snag the weave.</li>
                <li><strong>Refold every few months.</strong> Changing the fold lines stops permanent creases and weak spots from forming, especially on silk and zari borders.</li>
                <li><strong>Let it breathe.</strong> Air each saree in the shade every few months. Neem leaves or lavender sachets are gentler than mothballs.</li>
                <li><strong>Wash with care.</strong> Dry-clean silk, tissue, organza and anything with heavy zari. Cotton, linen and modal can be hand-washed cold with a mild detergent — don't wring, and dry in the shade.</li>
                <li><strong>Iron gently.</strong> Iron on the reverse, at low to medium heat, with a thin cloth between iron and fabric. Never press directly on zari.</li>
                <li><strong>Perfume first.</strong> Spray perfume before you dress, not after — sprays and sweat can stain delicate fabrics.</li>
              </ul>
            </article>

            <article className="story-care__card" id="care-styling">
              <span className="story-care__eyebrow">Styling</span>
              <h3>One saree, three ways to drape</h3>
              <ol>
                <li>
                  <strong>The classic Nivi.</strong> Tuck the plain end into your petticoat, wrap once around, then gather pleats and tuck them at the navel. Take the pallu over your left shoulder and let it fall behind.
                </li>
                <li>
                  <strong>The modern pant-drape.</strong> Pair the saree with tailored trousers instead of a petticoat. Tuck the pleats into the waistband, drape the pallu over the shoulder and pin it for an easy, polished look.
                </li>
                <li>
                  <strong>Seedha pallu.</strong> Bring the pallu around from the back to the front over your right shoulder and spread it across the chest to show off the border and weave.
                </li>
              </ol>
              <p className="story-care__note">Small changes in drape, blouse and jewellery can make the same saree feel entirely new.</p>
            </article>
          </div>
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
