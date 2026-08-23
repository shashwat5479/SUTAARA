import { Link } from 'react-router-dom';

export default function MegaMenu({ menu, onLinkClick }) {
  if (!menu) return null;
  return (
    <div className="mega" onClick={onLinkClick}>
      <div className="container mega__grid">
        <div className="mega__columns">
          {menu.columns.map((col) => (
            <div key={col.title} className="mega__col">
              <h4>{col.title}</h4>
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
