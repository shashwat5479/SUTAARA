import { useState, useEffect, useRef } from 'react';
import { Link, NavLink, useNavigate, useLocation } from 'react-router-dom';
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
      flyout: [
        {
          label: 'Sarees',
          to: '/shop?category=saree',
          panelTitle: 'Sarees by fabric',
          sub: [
            { label: 'Cotton', to: '/shop?category=saree&fabric=Cotton' },
            { label: 'Chanderi', to: '/shop?category=saree&fabric=Chanderi' },
            { label: 'Chiffon', to: '/shop?category=saree&fabric=Chiffon' },
            { label: 'Crepe Georgette', to: '/shop?category=saree&fabric=Crepe%20Georgette' },
            { label: 'Silk', to: '/shop?category=saree&fabric=Silk' },
            { label: 'Linen', to: '/shop?category=saree&fabric=Linen' },
            { label: 'Tissue', to: '/shop?category=saree&fabric=Tissue' },
            { label: 'Organza', to: '/shop?category=saree&fabric=Organza' },
            { label: 'Maheshwari', to: '/shop?category=saree&fabric=Maheshwari' },
            { label: 'Kota', to: '/shop?category=saree&fabric=Kota' },
            { label: 'Modal', to: '/shop?category=saree&fabric=Modal' },
          ],
        },
        {
          label: 'Suits',
          to: '/shop?category=suit',
          panelTitle: 'Suits by fabric',
          sub: [
            { label: 'Cotton', to: '/shop?category=suit&fabric=Cotton' },
            { label: 'Chanderi', to: '/shop?category=suit&fabric=Chanderi' },
            { label: 'Corduroy', to: '/shop?category=suit&fabric=Corduroy' },
            { label: 'Crepe', to: '/shop?category=suit&fabric=Crepe' },
            { label: 'Silk', to: '/shop?category=suit&fabric=Silk' },
            { label: 'Linen', to: '/shop?category=suit&fabric=Linen' },
            { label: 'Modal', to: '/shop?category=suit&fabric=Modal' },
            { label: 'Maheshwari', to: '/shop?category=suit&fabric=Maheshwari' },
            { label: 'Kota', to: '/shop?category=suit&fabric=Kota' },
            { label: 'Velvet', to: '/shop?category=suit&fabric=Velvet' },
            { label: 'Woollen', to: '/shop?category=suit&fabric=Woollen' },
          ],
        },
        { label: 'Blouses', to: '/shop?category=blouse', sub: [] },
        { label: 'Dupattas', to: '/shop?category=dupatta', sub: [] },
        { label: 'Potlis & Bags', to: '/shop?category=potli', sub: [] },
        { label: 'All pieces', to: '/shop', sub: [] },
        { label: 'New arrivals', to: '/shop?sort=newest', sub: [] },
      ],
      featured: [
        { label: 'New Season', img: '/products/maroon-patola-ikat-1.jpg', to: '/shop?category=saree' },
        { label: 'The Gifting Edit', img: '/products/mustard-turquoise-set-2.jpg', to: '/shop?category=potli' },
      ],
    },
  },
  {
    key: 'collection',
    label: 'Collection',
    to: '/shop',
    mega: {
      columns: [
        {
          title: 'By category',
          links: [
            { label: 'Sarees', to: '/shop?category=saree' },
            { label: 'Suit Sets', to: '/shop?category=suit' },
            { label: 'Blouses', to: '/shop?category=blouse' },
            { label: 'Dupattas', to: '/shop?category=dupatta' },
            { label: 'Potli Bags', to: '/shop?category=potli' },
          ],
        },
        {
          title: 'By occasion',
          links: [
            { label: 'Wedding', to: '/shop?occasion=Wedding' },
            { label: 'Festive', to: '/shop?occasion=Festive' },
            { label: 'Party', to: '/shop?occasion=Party' },
            { label: 'Everyday', to: '/shop?occasion=Everyday' },
          ],
        },
      ],
      featured: [
        { label: 'New Season', img: '/products/maroon-patola-ikat-1.jpg', to: '/shop?category=saree' },
        { label: 'Everyday Drape', img: '/products/peach-leheriya-organza-1.jpg', to: '/shop?category=saree&occasion=Everyday' },
      ],
    },
  },
];

const NAV_RIGHT = [
  {
    key: 'stories',
    label: 'Sutaara Edits',
    to: '/#our-craft',
    mega: {
      columns: [
        {
          title: 'From the journal',
          links: [
            { label: "Sutaara Edits", to: '/story' },
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
  const location = useLocation();
  const closeTimer = useRef(null);
  const suppressHover = useRef(false);

  useEffect(() => {
    const onScroll = () => setFloating(window.scrollY > 8);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Whenever the route changes, close the mega menu and mobile drawer — this
  // guarantees the hover slider goes away once a page actually opens.
  useEffect(() => {
    setActiveMega(null);
    setMenuOpen(false);
  }, [location.pathname, location.search]);

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
    // After a nav click, the cursor is still over the item — don't let hover
    // immediately re-open the slider we just closed by navigating.
    if (suppressHover.current) return;
    if (closeTimer.current) clearTimeout(closeTimer.current);
    setActiveMega(key);
  };
  const scheduleClose = () => {
    closeTimer.current = setTimeout(() => setActiveMega(null), 160);
  };

  // Called on any nav/mega link click: close the slider and block hover from
  // reopening it until the cursor has had a chance to leave.
  const closeMegaOnNav = () => {
    setActiveMega(null);
    suppressHover.current = true;
    setTimeout(() => { suppressHover.current = false; }, 500);
  };

  const NavItem = ({ item }) => (
    <span
      className={`nav__trigger ${activeMega === item.key ? 'is-active' : ''}`}
      onMouseEnter={() => openMega(item.key)}
    >
      <NavLink to={item.to} onClick={closeMegaOnNav}>{item.label}</NavLink>
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
          <span className="header__tagline">Handcrafted in Lucknow, worn everywhere</span>
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
            onLinkClick={closeMegaOnNav}
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
                  <Link to="/shop?category=saree"><strong>Sarees</strong></Link>
                  <Link to="/shop?category=saree&fabric=Cotton" className="mmenu__sub">Cotton</Link>
                  <Link to="/shop?category=saree&fabric=Chanderi" className="mmenu__sub">Chanderi</Link>
                  <Link to="/shop?category=saree&fabric=Silk" className="mmenu__sub">Silk</Link>
                  <Link to="/shop?category=saree&fabric=Organza" className="mmenu__sub">Organza</Link>
                  <Link to="/shop?category=saree&fabric=Chiffon" className="mmenu__sub">Chiffon</Link>
                  <Link to="/shop?category=saree" className="mmenu__sub mmenu__sub--all">All sarees →</Link>
                  <Link to="/shop?category=suit"><strong>Suits</strong></Link>
                  <Link to="/shop?category=suit&fabric=Cotton" className="mmenu__sub">Cotton</Link>
                  <Link to="/shop?category=suit&fabric=Silk" className="mmenu__sub">Silk</Link>
                  <Link to="/shop?category=suit&fabric=Velvet" className="mmenu__sub">Velvet</Link>
                  <Link to="/shop?category=suit" className="mmenu__sub mmenu__sub--all">All suits →</Link>
                  <Link to="/shop?category=blouse">Blouses</Link>
                  <Link to="/shop?category=dupatta">Dupattas</Link>
                  <Link to="/shop?category=potli">Potlis &amp; Bags</Link>
                  <Link to="/studio">Book a Studio Appointment</Link>
                </nav>
              </div>

              <div className="mmenu__section">
                <span className="mmenu__label">Discover</span>
                <nav>
                  <Link to="/story">Sutaara Edits</Link>
                  <Link to="/diaries">Sutaara Diaries</Link>
                  <Link to="/studio">Visit the Studio</Link>
                  <Link to="/#care">Care &amp; Keeping</Link>
                </nav>
              </div>

              <div className="mmenu__section">
                <span className="mmenu__label">Account</span>
                <nav className="mmenu__iconlinks">
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); setMenuOpen(false); setSearchOpen(true); }}
                  >
                    <Search /> Search
                  </button>
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