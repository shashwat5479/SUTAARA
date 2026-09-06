import { useState } from 'react';
import { Link } from 'react-router-dom';

export default function MegaMenu({ menu, onLinkClick }) {
  if (!menu) return null;

  // Flyout mode: a vertical list of categories on the left; hovering one
  // reveals its sub-options (e.g. fabrics) on the right.
  if (menu.flyout) {
    return <FlyoutMenu menu={menu} onLinkClick={onLinkClick} />;
  }

  // Default columns mode
  return (
    <div className="mega" onClick={onLinkClick}>
      <div className="container mega__grid">
        <div className="mega__columns">
          {menu.columns.map((col) => (
            <div key={col.title} className="mega__col">
              {col.headerTo ? (
                <h4><Link to={col.headerTo} className="mega__col-head">{col.title}</Link></h4>
              ) : (
                <h4>{col.title}</h4>
              )}
              <ul>
                {col.links.map((link) => (
                  <li key={link.label}>
                    <Link to={link.to}>{link.label}</Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        {menu.featured?.length > 0 && (
          <div className="mega__featured">
            {menu.featured.map((f) => (
              <Link key={f.label} to={f.to} className="mega__featured-card">
                <img src={f.img} alt={f.label} />
                <span>{f.label}</span>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function FlyoutMenu({ menu, onLinkClick }) {
  // Which category is currently hovered — default to the first one.
  const [active, setActive] = useState(0);
  const cats = menu.flyout;
  const current = cats[active] || cats[0];

  return (
    <div className="mega mega--flyout" onClick={onLinkClick}>
      <div className="container mega__flyout">
        {/* Left: category list */}
        <ul className="mega__cats">
          {cats.map((cat, i) => (
            <li
              key={cat.label}
              className={`mega__cat ${i === active ? 'is-active' : ''}`}
              onMouseEnter={() => setActive(i)}
            >
              <Link to={cat.to}>
                {cat.label}
                {cat.sub?.length > 0 && <span className="mega__cat-arrow">›</span>}
              </Link>
            </li>
          ))}
        </ul>

        {/* Right: the hovered category's sub-options */}
        <div className="mega__panel">
          {current?.sub?.length > 0 ? (
            <>
              <h4>
                <Link to={current.to} className="mega__col-head">{current.panelTitle || current.label}</Link>
              </h4>
              <ul className="mega__fabrics">
                {current.sub.map((s) => (
                  <li key={s.label}>
                    <Link to={s.to}>{s.label}</Link>
                  </li>
                ))}
              </ul>
            </>
          ) : (
            <div className="mega__panel-empty">
              <Link to={current.to} className="mega__col-head">Shop all {current.label}</Link>
            </div>
          )}
        </div>

        {/* Featured image(s) */}
        {menu.featured?.length > 0 && (
          <div className="mega__featured">
            {menu.featured.map((f) => (
              <Link key={f.label} to={f.to} className="mega__featured-card">
                <img src={f.img} alt={f.label} />
                <span>{f.label}</span>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
