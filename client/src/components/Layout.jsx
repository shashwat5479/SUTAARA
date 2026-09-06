import { useEffect } from 'react';
import { Outlet, useLocation, Navigate } from 'react-router-dom';
import Header from './Header.jsx';
import Footer from './Footer.jsx';
import BackNav from './BackNav.jsx';
import CartDrawer from './CartDrawer.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import useScrollReveal from '../hooks/useScrollReveal.js';

export function ScrollToTop() {
  const { pathname, hash } = useLocation();
  useEffect(() => {
    // A link like "/#our-craft" should scroll to that section instead of the
    // top — this is also what fixes the full-page-reload problem: previously
    // an actual <a href="/#our-craft"> was used for that link, which forces a
    // real browser navigation instead of client-side routing. Now every
    // internal link goes through React Router's <Link>, and this effect
    // handles the scroll-to-section behavior that a plain anchor used to.
    if (hash) {
      const el = document.querySelector(hash);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        return;
      }
    }
    window.scrollTo(0, 0);
  }, [pathname, hash]);
  return null;
}

export default function Layout() {
  useScrollReveal();
  return (
    <>
      <ScrollToTop />
      <Header />
      <BackNav />
      <main>
        <Outlet />
      </main>
      <Footer />
      <CartDrawer />
    </>
  );
}

export function ProtectedRoute({ children, adminOnly = false }) {
  const { user, loading, isAdmin } = useAuth();
  const location = useLocation();
  if (loading) {
    return (
      <div className="loader">
        <div className="spinner" />
      </div>
    );
  }
  if (!user) return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  if (adminOnly && !isAdmin) return <Navigate to="/" replace />;
  return children;
}
