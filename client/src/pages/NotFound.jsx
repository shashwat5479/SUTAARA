import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <section className="section">
      <div className="container">
        <div className="empty" style={{ padding: '90px 20px' }}>
          <span className="eyebrow">404</span>
          <h3 style={{ fontSize: '2.4rem', marginTop: 8 }}>This thread got lost</h3>
          <p>The page you’re looking for isn’t here.</p>
          <Link to="/" className="btn btn--primary">Back home</Link>
        </div>
      </div>
    </section>
  );
}
