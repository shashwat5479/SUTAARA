import { useState, useEffect, useRef } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext.jsx';
import { useWishlist } from '../context/WishlistContext.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import AnnouncementBar from './AnnouncementBar.jsx';
import MegaMenu from './MegaMenu.jsx';
import { Search, User, Heart, Bag, Menu, Close } from './Icons.jsx';

function Brand() {
  return (
    <Link to="/" className="brand" aria-label="Sutaara home">
      <span className="brand__name">SUTAARA</span>
      <span className="brand__tag">Handcrafted</span>
    </Link>
  );
}

// Every link here points at a real, working filter, page, or on-page section —
// nothing decorative. Each top-level nav item now opens its own mega menu on
// hover, so the interaction is consistent across every item, not just "Shop All".
const NAV_LEFT = [
  {
    key: 'shop',
    label: 'Shop All',
    to: '/shop',
    mega: {
      columns: [
        {
          title: 'Shop by category',
          links: [
            { label: 'Sarees', to: '/shop?category=saree' },
            { label: 'Suit Sets', to: '/shop?category=suit' },
            { label: 'Blouses', to: '/shop?category=blouse' },
            { label: 'Dupattas', to: '/shop?category=dupatta' },
            { label: 'Potli Bags', to: '/shop?category=potli' },
            { label: 'Book a Studio Appointment', to: '/studio' },
          ],
        },
        {
          title: 'Shop by occasion',
          links: [
            { label: 'Wedding', to: '/shop?occasion=Wedding' },
            { label: 'Festive', to: '/shop?occasion=Festive' },
            { label: 'Everyday', to: '/shop?occasion=Everyday' },
            { label: 'Party', to: '/shop?occasion=Party' },
          ],
        },
      ],
      featured: [
        { label: 'New Season', img: '/products/maroon-patola-ikat-1.jpg', to: '/shop?category=saree' },
        { label: 'The Gifting Edit', img: '/products/mustard-turquoise-set-2.jpg', to: '/shop?category=potli' },
      ],
    },
  },
  {
    key: 'saree',
    label: 'Sarees',
    to: '/shop?category=saree',
    mega: {
      columns: [
        {
          title: 'By fabric',
          links: [
            { label: 'Banarasi Silk', to: '/shop?category=saree&fabric=Banarasi%20Silk' },
            { label: 'Organza', to: '/shop?category=saree&fabric=Organza' },
            { label: 'Chiffon', to: '/shop?category=saree&fabric=Chiffon' },
            { label: 'Mul Cotton', to: '/shop?category=saree&fabric=Mul%20Cotton' },
          ],
        },
        {
          title: 'By occasion',
          links: [
            { label: 'Wedding', to: '/shop?category=saree&occasion=Wedding' },
            { label: 'Festive', to: '/shop?category=saree&occasion=Festive' },
            { label: 'Party', to: '/shop?category=saree&occasion=Party' },
            { label: 'Everyday', to: '/shop?category=saree&occasion=Everyday' },
          ],
        },
      ],
      featured: [
        { label: 'New Season', img: '/products/maroon-patola-ikat-1.jpg', to: '/shop?category=saree' },
        { label: 'Everyday Drape', img: '/products/peach-leheriya-organza-1.jpg', to: '/shop?category=saree&occasion=Everyday' },
      ],
    },
  },
  {
    key: 'dupatta',
    label: 'Dupattas',
    to: '/shop?category=dupatta',
    mega: {
      columns: [
        {
          title: 'By fabric',
          links: [
            { label: 'Net', to: '/shop?category=dupatta&fabric=Net' },
            { label: 'Georgette', to: '/shop?category=dupatta&fabric=Georgette' },
            { label: 'Chiffon', to: '/shop?category=dupatta&fabric=Chiffon' },
            { label: 'Kota', to: '/shop?category=dupatta&fabric=Kota' },
            { label: 'Silk', to: '/shop?category=dupatta&fabric=Silk' },
          ],
        },
        {
          title: 'By occasion',
          links: [
            { label: 'Wedding', to: '/shop?category=dupatta&occasion=Wedding' },
            { label: 'Festive', to: '/shop?category=dupatta&occasion=Festive' },
            { label: 'Everyday', to: '/shop?category=dupatta&occasion=Everyday' },
          ],
        },
      ],
      featured: [
        { label: 'Bridal Drape', img: '/products/peach-leheriya-organza-3.jpg', to: '/shop?category=dupatta&occasion=Wedding' },
        { label: 'Everyday Bandhani', img: '/products/peach-madhubani-2.jpg', to: '/shop?category=dupatta&fabric=Kota' },
      ],
    },
  },
];

const NAV_RIGHT = [
  {
    key: 'stories',
    label: 'Stories',
    to: '/#our-craft',
    mega: {
      columns: [
        {
          title: 'From the journal',
          links: [
            { label: "A Saree's Story", to: '/#our-craft' },
            { label: 'Care & keeping', to: '/#care' },
            { label: 'New arrivals', to: '/shop?sort=newest' },
          ],
        },
      ],
      featured: [
        { label: 'The Palette', img: '/products/magenta-emerald-set-1.jpg', to: '/shop?category=saree' },
        { label: 'The Print', img: '/products/red-ajrakh-suit-1.jpg', to: '/shop?category=saree&fabric=Ajrakh%20Cotton' },
      ],
    },
  },
  {
    key: 'about',
    label: 'About Us',
    to: '/#our-craft',
    mega: {
      columns: [
        {
          title: 'Sutaara',
          links: [
            { label: 'Our story', to: '/#our-craft' },
            { label: 'Care & keeping', to: '/#care' },
          ],
        },
        {
          title: 'Your account',
          links: [
            { label: 'Sign in', to: '/login' },
            { label: 'Create account', to: '/register' },
            { label: 'Wishlist', to: '/wishlist' },
          ],
        },
      ],
      featured: [
        { label: 'Meet Sutaara', img: '/products/maroon-patola-ikat-1.jpg', to: '/#our-craft' },
        { label: 'The Weave', img: '/products/mustard-elephant-chanderi-1.jpg', to: '/shop?category=saree&fabric=Tissue' },
      ],
    },
  },
  {
    key: 'craft',
    label: 'Our Craft',
    to: '/#our-craft',
    mega: {
      columns: [
        {
          title: 'The craft',
          links: [
            { label: 'Banarasi Weave', to: '/shop?fabric=Banarasi%20Silk' },
            { label: 'Chikankari', to: '/shop?fabric=Cotton%20Chikankari' },
            { label: 'Ajrakh Print', to: '/shop?fabric=Ajrakh%20Cotton' },
            { label: 'Zari & Tissue', to: '/shop?fabric=Tissue' },
          ],
        },
        {
          title: 'Read',
          links: [
            { label: 'Our story', to: '/#our-craft' },
            { label: 'Care & keeping', to: '/#care' },
          ],
        },
      ],
      featured: [
        { label: 'The Weave', img: '/products/green-gold-leheriya-1.jpg', to: '/shop?fabric=Banarasi%20Silk' },
        { label: 'The Suit Sets', img: '/products/rose-emerald-suit-1.jpg', to: '/shop?category=suit' },
      ],
    },
  },
];

export default function Header() {
  const { count, setOpen } = useCart();
  const { count: wishCount } = useWishlist();
  const { user } = useAuth();
  const [floating, setFloating] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [activeMega, setActiveMega] = useState(null);
  const [q, setQ] = useState('');
  const navigate = useNavigate();
  const closeTimer = useRef(null);

  useEffect(() => {
    const onScroll = () => setFloating(window.scrollY > 8);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Lock background scroll while the mobile drawer is open
  useEffect(() => {
    document.body.style.overflow = menuOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [menuOpen]);

  const submitSearch = (e) => {
    e.preventDefault();
    if (q.trim()) {
      navigate(`/shop?search=${encodeURIComponent(q.trim())}`);
      setSearchOpen(false);
      setQ('');
    }
  };

  // Small delay on close so moving the cursor from the trigger link down into
  // the panel doesn't snap it shut in the gap between them.
  const openMega = (key) => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    setActiveMega(key);
  };
  const scheduleClose = () => {
    closeTimer.current = setTimeout(() => setActiveMega(null), 160);
  };

  const NavItem = ({ item }) => (
    <span
      className={`nav__trigger ${activeMega === item.key ? 'is-active' : ''}`}
      onMouseEnter={() => openMega(item.key)}
    >
      <NavLink to={item.to}>{item.label}</NavLink>
    </span>
  );

  return (
    <>
      <AnnouncementBar />

      <header
        className={`header ${floating ? 'header--floating' : ''}`}
        onMouseLeave={scheduleClose}
      >
        {/* utility row — quiet tagline on the left, actions on the right.
            Entering this row closes any open mega menu immediately: without
            this, moving the cursor from a nav item up to Search/Wishlist/Bag
            never fires the header's onMouseLeave (still inside the header),
            so the menu would hang open until the cursor left the whole
            header — including the icons. */}
        <div
          className="container header__utility"
          onMouseEnter={() => setActiveMega(null)}
        >
          <span className="header__tagline">Rooted in craft, Curated for today</span>
          <div className="header__actions">
            <button className="icon-btn" aria-label="Search" onClick={() => setSearchOpen(true)}>
              <Search />
            </button>
            <Link className="icon-btn" to={user ? '/account' : '/login'} aria-label="Account">
              <User />
              <span className="header__actions-label">{user ? 'Account' : 'Sign in'}</span>
            </Link>
            <Link className="icon-btn" to="/wishlist" aria-label="Wishlist">
              <Heart />
              <span className="header__actions-label">Wishlist</span>
              {wishCount > 0 && <span className="badge">{wishCount}</span>}
            </Link>
            <button className="icon-btn" aria-label="Bag" onClick={() => setOpen(true)}>
              <Bag />
              <span className="header__actions-label">Bag</span>
              {count > 0 && <span className="badge">{count}</span>}
            </button>
          </div>
        </div>

        {/* nav row — every item now opens the same hover mega menu */}
        <div className="container header__row">
          <button className="icon-btn hamburger" aria-label="Open menu" onClick={() => setMenuOpen(true)}>
            <Menu />
          </button>

          <nav className="nav nav--left">
            {NAV_LEFT.map((item) => (
              <NavItem key={item.key} item={item} />
            ))}
          </nav>

          <span
            onMouseEnter={() => setActiveMega(null)}
            style={{ display: 'contents' }}
          >
            <Brand />
          </span>

          <nav className="nav nav--right">
            {NAV_RIGHT.map((item) => (
              <NavItem key={item.key} item={item} />
            ))}
          </nav>
        </div>

        <div
          className={`mega-wrap ${activeMega ? 'mega-wrap--open' : ''}`}
          onMouseEnter={() => { if (closeTimer.current) clearTimeout(closeTimer.current); }}
          onMouseLeave={scheduleClose}
        >
          <MegaMenu
            menu={activeMega ? [...NAV_LEFT, ...NAV_RIGHT].find((i) => i.key === activeMega)?.mega : null}
            onLinkClick={() => setActiveMega(null)}
          />
        </div>
      </header>

      <div
        className={`page-scrim ${activeMega ? 'page-scrim--visible' : ''}`}
        onMouseEnter={scheduleClose}
        aria-hidden="true"
      />

      {searchOpen && (
        <div className="drawer-overlay" onClick={() => setSearchOpen(false)}>
          <div
            className="container"
            style={{ paddingTop: '18vh' }}
            onClick={(e) => e.stopPropagation()}
          >
            <form onSubmit={submitSearch} style={{ maxWidth: 620, margin: '0 auto' }}>
              <input
                autoFocus
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search sarees, suits, blouses…"
                style={{
                  width: '100%',
                  fontFamily: 'var(--display)',
                  fontSize: '1.8rem',
                  padding: '16px 4px',
                  background: 'transparent',
                  border: 'none',
                  borderBottom: '1px solid var(--gold)',
                  color: 'var(--paper)',
                }}
              />
            </form>
          </div>
        </div>
      )}

      {menuOpen && (
        <>
          <div className="mmenu-scrim" onClick={() => setMenuOpen(false)} />
          <div className="mmenu">
            <div className="mmenu__head">
              <Brand />
              <button className="icon-btn" aria-label="Close menu" onClick={() => setMenuOpen(false)}>
                <Close />
              </button>
            </div>

            {user && (
              <div className="mmenu__greeting">
                Signed in as <strong>{user.name.split(' ')[0]}</strong>
              </div>
            )}

            <div className="mmenu__body" onClick={() => setMenuOpen(false)}>
              <div className="mmenu__section">
                <span className="mmenu__label">Shop</span>
                <nav>
                  <Link to="/shop">Shop All</Link>
                  <Link to="/shop?category=saree">Sarees</Link>
                  <Link to="/shop?category=suit">Suits</Link>
                  <Link to="/shop?category=blouse">Blouses</Link>
                  <Link to="/shop?category=dupatta">Dupattas</Link>
                  <Link to="/shop?category=potli">Potli Bags</Link>
                  <Link to="/studio">Book a Studio Appointment</Link>
                </nav>
              </div>

              <div className="mmenu__section">
                <span className="mmenu__label">Discover</span>
                <nav>
                  <Link to="/#our-craft">Our Craft &amp; Stories</Link>
                </nav>
              </div>

              <div className="mmenu__section">
                <span className="mmenu__label">Account</span>
                <nav className="mmenu__iconlinks">
                  <Link to="/wishlist">
                    <Heart /> Wishlist
                    {wishCount > 0 && <span className="badge">{wishCount}</span>}
                  </Link>
                  <Link to={user ? '/account' : '/login'}>
                    <User /> {user ? 'My Account' : 'Sign in'}
                  </Link>
                </nav>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
}