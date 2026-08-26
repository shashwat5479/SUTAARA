import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api/client.js';
import DiaryBook from '../components/DiaryBook.jsx';

// Full-page "Sutaara Diaries" experience — the same open-book animation on a
// dark saree backdrop, with a ✕ to return.
export default function Diaries() {
  const [diaries, setDiaries] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    document.body.classList.add('theme-dark-page');
    api.getDiaries().then(setDiaries).catch(() => {}).finally(() => setLoading(false));
    return () => document.body.classList.remove('theme-dark-page');
  }, []);

  const close = () => {
    if (window.history.length > 1) navigate(-1);
    else navigate('/');
  };

  return (
    <div className="diaries-page">
      <div className="diaries-page__bg" />
      <div className="diaries-page__scrim" />

      <button className="diaries-page__close" aria-label="Close diary" onClick={close}>×</button>

      <div className="container diaries-page__inner">
        <div className="section-head section-head--light">
          <span className="eyebrow" style={{ color: 'var(--gold-soft)' }}>Sutaara Diaries</span>
          <h1>Stories our customers wrote</h1>
          <hr className="zari zari--short" />
        </div>

        {loading ? (
          <div className="loader"><div className="spinner" /></div>
        ) : (
          <DiaryBook reviews={diaries} auto interval={6000} />
        )}
      </div>
    </div>
  );
}
