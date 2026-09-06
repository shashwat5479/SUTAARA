import { useNavigate, useLocation } from "react-router-dom";

// Site-wide back button. Hidden on the homepage (nowhere to go back to).
// Uses browser history when possible, falls back to the homepage.
export default function BackNav() {
  const navigate = useNavigate();
  const { pathname } = useLocation();

  if (pathname === "/") return null;

  const goBack = () => {
    if (window.history.length > 1) navigate(-1);
    else navigate("/");
  };

  return (
    <div className="backnav">
      <div className="container">
        <button className="backnav__btn" onClick={goBack} aria-label="Go back">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="19" y1="12" x2="5" y2="12" />
            <polyline points="12 19 5 12 12 5" />
          </svg>
          <span>Back</span>
        </button>
      </div>
    </div>
  );
}
