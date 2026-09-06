import { useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search } from './Icons.jsx';

const CHIPS = [
  { label: 'Sarees', to: '/shop?category=saree' },
  { label: 'Suits 🔥', to: '/shop?category=suit' },
  { label: 'Blouses 🔥', to: '/shop?category=blouse' },
  { label: 'Dupattas', to: '/shop?category=dupatta' },
  { label: 'Potlis', to: '/shop?category=potli' },
];

const OCCASIONS = [
  { rank: 1, label: 'Wedding', img: '/products/maroon-patola-ikat-1.jpg', to: '/shop?occasion=Wedding' },
  { rank: 2, label: 'Festive', img: '/products/green-gold-leheriya-1.jpg', to: '/shop?occasion=Festive' },
  { rank: 3, label: 'The Party Edit', img: '/products/magenta-emerald-set-1.jpg', to: '/shop?occasion=Party' },
  { rank: 4, label: 'Everyday', img: '/products/peach-leheriya-organza-1.jpg', to: '/shop?occasion=Everyday' },
];

const TRENDING = [
  { rank: 1, label: 'Classic Ikat', img: '/products/maroon-patola-ikat-1.jpg', to: '/shop?category=saree' },
  { rank: 2, label: 'Matching Sets', img: '/products/magenta-emerald-set-2.jpg', to: '/shop?category=suit' },
  { rank: 3, label: 'Kalamkari', img: '/products/mauve-kalamkari-peacock-1.jpg', to: '/shop?category=saree' },
  { rank: 4, label: 'Leheriya', img: '/products/peach-leheriya-organza-3.jpg', to: '/shop?category=saree' },
];

function RankedList({ title, items, onPick }) {
  return (
    <div className="search-page__col">
      <h3>{title}</h3>
      <ol>
        {items.map((item) => (
          <li key={item.label}>
            <Link to={item.to} onClick={onPick}>
              <span className={`search-page__rank ${item.rank <= 3 ? 'is-hot' : ''}`}>{item.rank}</span>
              <img src={item.img} alt="" />
              <span className="search-page__name">{item.label}</span>
            </Link>
          </li>
        ))}
      </ol>
    </div>
  );
}

export default function SearchOverlay({ q, setQ, onClose, onSubmit }) {
  const navigate = useNavigate();
  const inputRef = useRef(null);
  const fileRef = useRef(null);

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const t = setTimeout(() => inputRef.current?.focus(), 280);
    const onKey = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = prev;
      clearTimeout(t);
      window.removeEventListener('keydown', onKey);
    };
  }, [onClose]);

  const pick = () => onClose();

  const onVisual = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    onClose();
    navigate('/shop');
  };

  return (
    <div className="search-page" role="dialog" aria-modal="true" aria-label="Search">
      <div className="search-page__bar">
        <button type="button" className="search-page__back" aria-label="Close search" onClick={onClose}>
          ‹
        </button>
        <form className="search-page__form" onSubmit={onSubmit}>
          <input
            ref={inputRef}
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Sarees 🔥"
            aria-label="Search"
          />
          <button
            type="button"
            className="search-page__cam"
            aria-label="Search with a photo"
            onClick={() => fileRef.current?.click()}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 8h3l1.5-2h7L17 8h3a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2v-8a2 2 0 0 1 2-2z" />
              <circle cx="12" cy="14" r="3.2" />
            </svg>
          </button>
          <input ref={fileRef} type="file" accept="image/*" hidden onChange={onVisual} />
        </form>
        <button type="button" className="search-page__go" aria-label="Search" onClick={onSubmit}>
          <Search width="20" height="20" />
        </button>
      </div>

      <div className="search-page__body">
        <section className="search-page__suggest">
          <h2>You Might Want To Search</h2>
          <div className="search-page__chips">
            {CHIPS.map((chip) => (
              <Link key={chip.label} to={chip.to} className="search-page__chip" onClick={pick}>
                {chip.label}
              </Link>
            ))}
          </div>
        </section>

        <div className="search-page__cols">
          <RankedList title="Occasions" items={OCCASIONS} onPick={pick} />
          <RankedList title="Trending Now" items={TRENDING} onPick={pick} />
        </div>
      </div>
    </div>
  );
}
