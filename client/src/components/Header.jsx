import { useState, useEffect, useRef } from 'react';
import { Link, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useCart } from '../context/CartContext.jsx';
import { useWishlist } from '../context/WishlistContext.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import AnnouncementBar from './AnnouncementBar.jsx';
import MegaMenu from './MegaMenu.jsx';
import { Search, User, Heart, Bag, Menu, Close, Plus, Minus } from './Icons.jsx';

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

// Quick-search shortcuts shown inside the search overlay — category chips,
// occasion edits, and a "trending" rail of prints that actually match seed
// product copy (so the linked /shop?search= queries return real results).
const SEARCH_QUICK_TAGS = [
  { label: 'Sarees', to: '/shop?category=saree' },
  { label: 'Suits', to: '/shop?category=suit' },
  { label: 'Blouses', to: '/shop?category=blouse' },
  { label: 'Dupattas', to: '/shop?category=dupatta' },
  { label: 'Potli Bags', to: '/shop?category=potli' },
];

const SEARCH_OCCASIONS = [
  { label: 'Wedding Edit', to: '/shop?occasion=Wedding', img: '/products/maroon-patola-ikat-1.jpg' },
  { label: 'Festive Drapes', to: '/shop?occasion=Festive', img: '/products/mustard-turquoise-set-2.jpg' },
  { label: 'The Party Edit', to: '/shop?occasion=Party', img: '/products/magenta-emerald-set-1.jpg' },
  { label: 'Everyday Wear', to: '/shop?occasion=Everyday', img: '/products/peach-leheriya-organza-4.jpg' },
];

const SEARCH_TRENDING = [
  { label: 'Kalamkari Prints', to: '/shop?search=Kalamkari', img: '/products/mauve-kalamkari-peacock-1.jpg' },
  { label: 'Leheriya Waves', to: '/shop?search=Leheriya', img: '/products/green-gold-leheriya-1.jpg' },
  { label: 'Patola Ikat', to: '/shop?search=Patola', img: '/products/maroon-patola-ikat-2.jpg' },
  { label: 'New Arrivals', to: '/shop?sort=newest', img: '/products/rose-emerald-suit-1.jpg' },
];

export default function Header() {
  const { count, setOpen } = useCart();
  const { count: wishCount } = useWishlist();
  const { user } = useAuth();
  const [floating, setFloating] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [openSection, setOpenSection] = useState('shop');
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
    setSearchOpen(false);
  }, [location.pathname, location.search]);

  // Lock background scroll while the mobile drawer or search overlay is open
  useEffect(() => {
    document.body.style.overflow = (menuOpen || searchOpen) ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [menuOpen, searchOpen]);

  const submitSearch = (e) => {
    e.preventDefault();
    const raw = q.trim();
    if (!raw) return;

    // Smart search: parse natural-language price queries.
    // "saree under 5k" -> search=saree, maxPrice=5000
    // "silk under 3000" -> search=silk, maxPrice=3000
    // "suit 2k to 5k"  -> search=suit, minPrice=2000, maxPrice=5000
    const params = new URLSearchParams();
    let text = raw;

    const priceK = (s) => { const n = parseFloat(s); return n < 200 ? n * 1000 : n; };
    const rangeMatch = text.match(/(\d+\.?\d*)\s*k?\s*(?:to|[-\u2013])\s*(\d+\.?\d*)\s*k?/i);
    const underMatch = text.match(/(?:under|below|less than|upto|up to|within|max)\s*(?:rs\.?|\u20b9|inr)?\s*(\d+\.?\d*)\s*k?/i);
    const aboveMatch = text.match(/(?:above|over|more than|min|from|starting)\s*(?:rs\.?|\u20b9|inr)?\s*(\d+\.?\d*)\s*k?/i);

    if (rangeMatch) {
      params.set('minPrice', String(priceK(rangeMatch[1])));
      params.set('maxPrice', String(priceK(rangeMatch[2])));
      text = text.replace(rangeMatch[0], '').trim();
    } else if (underMatch) {
      params.set('maxPrice', String(priceK(underMatch[1])));
      text = text.replace(underMatch[0], '').trim();
    } else if (aboveMatch) {
      params.set('minPrice', String(priceK(aboveMatch[1])));
      text = text.replace(aboveMatch[0], '').trim();
    }

    text = text.replace(/(?:rs\.?|\u20b9|inr|price|cost|range|budget)\s*/gi, '').replace(/\s+/g, ' ').trim();

    if (text) params.set('search', text);
    const qs = params.toString();
    navigate(qs ? `/shop?${qs}` : '/shop');
    setSearchOpen(false);
    setQ('');
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
          <span className="header__tagline">Rooted in Craft. Crafted for Today</span>
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
        <div className="search-overlay" onClick={() => setSearchOpen(false)}>
          <div className="search-panel" onClick={(e) => e.stopPropagation()}>
            <form onSubmit={submitSearch} className="search-panel__form">
              <button
                type="button"
                className="search-panel__back"
                aria-label="Close search"
                onClick={() => setSearchOpen(false)}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="19" y1="12" x2="5" y2="12" />
                  <polyline points="12 19 5 12 12 5" />
                </svg>
              </button>
              <input
                autoFocus
                className="search-panel__input"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search sarees, suits, blouses…"
              />
              <button type="submit" className="icon-btn" aria-label="Search">
                <Search />
              </button>
            </form>

            <div className="search-panel__body">
              <p className="search-panel__heading">You Might Want To Search</p>
              <div className="search-panel__tags">
                {SEARCH_QUICK_TAGS.map((t) => (
                  <Link key={t.label} to={t.to} className="search-tag" onClick={() => setSearchOpen(false)}>
                    {t.label}
                  </Link>
                ))}
              </div>

              <div className="search-panel__columns">
                <div>
                  <p className="search-panel__heading">Occasions</p>
                  <div className="search-panel__list">
                    {SEARCH_OCCASIONS.map((item, i) => (
                      <Link key={item.label} to={item.to} className="search-row" onClick={() => setSearchOpen(false)}>
                        <span className="search-row__num">{i + 1}</span>
                        <img src={item.img} alt="" />
                        <span>{item.label}</span>
                      </Link>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="search-panel__heading">Trending Now</p>
                  <div className="search-panel__list">
                    {SEARCH_TRENDING.map((item, i) => (
                      <Link key={item.label} to={item.to} className="search-row" onClick={() => setSearchOpen(false)}>
                        <span className="search-row__num">{i + 1}</span>
                        <img src={item.img} alt="" />
                        <span>{item.label}</span>
                      </Link>
                    ))}
                  </div>
                </div>
              </div>
            </div>
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

            <div className="mmenu__body">
              <div className={`mmenu__section ${openSection === 'shop' ? 'is-open' : ''}`}>
                <button
                  type="button"
                  className="mmenu__label mmenu__label--toggle"
                  onClick={() => setOpenSection(openSection === 'shop' ? null : 'shop')}
                >
                  Shop
                  {openSection === 'shop' ? <Minus /> : <Plus />}
                </button>
                <div className="mmenu__panel">
                  <nav onClick={() => setMenuOpen(false)}>
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
              </div>

              <div className={`mmenu__section ${openSection === 'discover' ? 'is-open' : ''}`}>
                <button
                  type="button"
                  className="mmenu__label mmenu__label--toggle"
                  onClick={() => setOpenSection(openSection === 'discover' ? null : 'discover')}
                >
                  Discover
                  {openSection === 'discover' ? <Minus /> : <Plus />}
                </button>
                <div className="mmenu__panel">
                  <nav onClick={() => setMenuOpen(false)}>
                    <Link to="/story">Sutaara Edits</Link>
                    <Link to="/diaries">Sutaara Diaries</Link>
                    <Link to="/studio">Visit the Studio</Link>
                    <Link to="/#care">Care &amp; Keeping</Link>
                  </nav>
                </div>
              </div>

              <div className={`mmenu__section ${openSection === 'help' ? 'is-open' : ''}`}>
                <button
                  type="button"
                  className="mmenu__label mmenu__label--toggle"
                  onClick={() => setOpenSection(openSection === 'help' ? null : 'help')}
                >
                  Help
                  {openSection === 'help' ? <Minus /> : <Plus />}
                </button>
                <div className="mmenu__panel">
                <div>
                  <nav onClick={() => setMenuOpen(false)}>
                    <Link to="/shipping-policy">Shipping &amp; Delivery</Link>
                    <Link to="/returns-policy">Returns &amp; Refunds</Link>
                    <Link to="/faq">FAQ's</Link>
                    <Link to="/contact">Contact us</Link>
                    <Link to="/account">Track order</Link>
                    <Link to="/studio">Studio Appointment</Link>
                  </nav>
                  <div className="mmenu__reachus">
                    <span className="mmenu__reachus-label">Reach Us</span>
                    <p>Lucknow, Uttar Pradesh</p>
                    <div className="mmenu__reachus-social">
                      <a className="footer__social-icon footer__social-icon--whatsapp" href="https://wa.me/919569659272" target="_blank" rel="noreferrer" aria-label="WhatsApp" title="WhatsApp">
                        <svg viewBox="0 0 24 24" width="17" height="17" fill="currentColor"><path d="M17.5 14.4c-.3-.1-1.7-.8-1.9-.9-.3-.1-.5-.1-.7.1-.2.3-.7.9-.9 1.1-.2.2-.3.2-.6.1-.3-.1-1.2-.5-2.3-1.4-.9-.8-1.4-1.7-1.6-2-.2-.3 0-.5.1-.6l.4-.5c.1-.2.2-.3.3-.5.1-.2 0-.4 0-.5 0-.1-.7-1.6-.9-2.2-.2-.6-.5-.5-.7-.5h-.6c-.2 0-.5.1-.8.4-.3.3-1 1-1 2.4s1.1 2.8 1.2 3c.1.2 2.1 3.2 5.1 4.5.7.3 1.3.5 1.7.6.7.2 1.4.2 1.9.1.6-.1 1.7-.7 2-1.4.2-.7.2-1.2.2-1.4-.1-.1-.3-.2-.6-.3zM12 2a10 10 0 00-8.5 15.3L2 22l4.8-1.3A10 10 0 1012 2z"/></svg>
                      </a>
                      <a className="footer__social-icon footer__social-icon--email" href="mailto:care@sutaara.com" aria-label="Email" title="Email">
                        <svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/></svg>
                      </a>
                      <a className="footer__social-icon footer__social-icon--instagram" href="https://instagram.com" target="_blank" rel="noreferrer" aria-label="Instagram" title="Instagram">
                        <svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none"/></svg>
                      </a>
                    </div>
                  </div>
                </div>
                </div>
              </div>

              <div className="mmenu__section mmenu__section--plain">
                <span className="mmenu__label">Account</span>
                <nav className="mmenu__iconlinks" onClick={() => setMenuOpen(false)}>
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