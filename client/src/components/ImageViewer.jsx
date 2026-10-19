import { useCallback, useEffect, useRef, useState } from 'react';
import { Close } from './Icons.jsx';

/*
 * Fullscreen product photo viewer (Myntra-style).
 *   • swipe left / right  → next / previous photo
 *   • pinch               → zoom in / out
 *   • double-tap          → zoom to 2.5× at that spot, again to reset
 *   • drag when zoomed    → pan around the photo
 *   • swipe down          → close
 * Desktop: arrow keys / buttons, mouse wheel and double-click to zoom, Esc to close.
 */
const MAX_SCALE = 4;
const DOUBLE_SCALE = 2.5;

const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));
const dist = (a, b) => Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY);

export default function ImageViewer({ images = [], index = 0, alt = '', onChange, onClose }) {
  const n = images.length;
  const [i, setI] = useState(clamp(index, 0, Math.max(0, n - 1)));
  const [t, setT] = useState({ s: 1, x: 0, y: 0 });
  const [drag, setDrag] = useState({ x: 0, y: 0 });
  const [animate, setAnimate] = useState(true);

  const box = useRef(null);
  const tRef = useRef(t);
  const g = useRef({
    mode: null, axis: null, sx: 0, sy: 0, ox: 0, oy: 0,
    d0: 0, s0: 1, cx0: 0, cy0: 0, moved: false, lastTap: 0, touchedAt: 0,
  });

  const apply = useCallback((next) => { tRef.current = next; setT(next); }, []);

  const rect = () => box.current.getBoundingClientRect();

  // keep the pan inside the photo's edges for the current zoom level
  const limit = useCallback((s, x, y) => {
    const r = rect();
    const mx = ((s - 1) * r.width) / 2;
    const my = ((s - 1) * r.height) / 2;
    return { s, x: clamp(x, -mx, mx), y: clamp(y, -my, my) };
  }, []);

  const goTo = useCallback((next) => {
    if (next < 0 || next >= n) return;
    setAnimate(true);
    setDrag({ x: 0, y: 0 });
    apply({ s: 1, x: 0, y: 0 });
    setI(next);
    onChange && onChange(next);
  }, [n, apply, onChange]);

  // keyboard + scroll lock
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') onClose();
      else if (e.key === 'ArrowRight') goTo(i + 1);
      else if (e.key === 'ArrowLeft') goTo(i - 1);
    };
    window.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [i, goTo, onClose]);

  // warm the neighbours so swiping feels instant
  useEffect(() => {
    [i - 1, i + 1].forEach((k) => { if (images[k]) new Image().src = images[k]; });
  }, [i, images]);

  const toggleZoom = (clientX, clientY) => {
    setAnimate(true);
    const cur = tRef.current;
    if (cur.s > 1.05) { apply({ s: 1, x: 0, y: 0 }); return; }
    const r = rect();
    const px = clientX - (r.left + r.width / 2);
    const py = clientY - (r.top + r.height / 2);
    apply(limit(DOUBLE_SCALE, -px * (DOUBLE_SCALE - 1), -py * (DOUBLE_SCALE - 1)));
  };

  /* ---------------- touch ---------------- */
  const onTouchStart = (e) => {
    const s = g.current;
    s.touchedAt = Date.now();
    setAnimate(false);
    if (e.touches.length === 2) {
      const [a, b] = e.touches;
      const r = rect();
      s.mode = 'pinch';
      s.d0 = dist(a, b);
      s.s0 = tRef.current.s;
      s.ox = tRef.current.x;
      s.oy = tRef.current.y;
      s.cx0 = (a.clientX + b.clientX) / 2 - (r.left + r.width / 2);
      s.cy0 = (a.clientY + b.clientY) / 2 - (r.top + r.height / 2);
      s.moved = true;
    } else if (e.touches.length === 1) {
      const p = e.touches[0];
      s.mode = tRef.current.s > 1.05 ? 'pan' : 'swipe';
      s.axis = null;
      s.sx = p.clientX;
      s.sy = p.clientY;
      s.ox = tRef.current.x;
      s.oy = tRef.current.y;
      s.moved = false;
    }
  };

  const onTouchMove = (e) => {
    const s = g.current;
    if (s.mode === 'pinch' && e.touches.length === 2) {
      const [a, b] = e.touches;
      const r = rect();
      const ns = clamp((s.s0 * dist(a, b)) / s.d0, 1, MAX_SCALE);
      const cx = (a.clientX + b.clientX) / 2 - (r.left + r.width / 2);
      const cy = (a.clientY + b.clientY) / 2 - (r.top + r.height / 2);
      const k = ns / s.s0;
      apply(limit(ns, cx - k * (s.cx0 - s.ox), cy - k * (s.cy0 - s.oy)));
      return;
    }
    if (e.touches.length !== 1) return;
    const p = e.touches[0];
    const dx = p.clientX - s.sx;
    const dy = p.clientY - s.sy;
    if (Math.abs(dx) > 8 || Math.abs(dy) > 8) s.moved = true;

    if (s.mode === 'pan') {
      apply(limit(tRef.current.s, s.ox + dx, s.oy + dy));
    } else if (s.mode === 'swipe') {
      if (!s.axis && (Math.abs(dx) > 8 || Math.abs(dy) > 8)) s.axis = Math.abs(dx) > Math.abs(dy) ? 'x' : 'y';
      if (s.axis === 'x') {
        // rubber-band at the first / last photo
        const atEdge = (dx > 0 && i === 0) || (dx < 0 && i === n - 1);
        setDrag({ x: atEdge ? dx * 0.25 : dx, y: 0 });
      } else if (s.axis === 'y') {
        setDrag({ x: 0, y: Math.max(0, dy) });
      }
    }
  };

  const onTouchEnd = (e) => {
    const s = g.current;
    const left = e.touches.length;

    if (s.mode === 'pinch') {
      if (tRef.current.s < 1.05) { setAnimate(true); apply({ s: 1, x: 0, y: 0 }); }
      if (left === 1) { // lifted one finger — carry on panning with the other
        const p = e.touches[0];
        s.mode = 'pan';
        s.sx = p.clientX;
        s.sy = p.clientY;
        s.ox = tRef.current.x;
        s.oy = tRef.current.y;
      } else if (left === 0) {
        s.mode = null;
      }
      return;
    }
    if (left > 0) return;

    const p = e.changedTouches[0];
    const dx = p.clientX - s.sx;
    const dy = p.clientY - s.sy;
    setAnimate(true);

    if (!s.moved) {
      const now = Date.now();
      if (now - s.lastTap < 300) { s.lastTap = 0; toggleZoom(p.clientX, p.clientY); }
      else s.lastTap = now;
    } else if (s.mode === 'swipe') {
      if (s.axis === 'x' && Math.abs(dx) > 60) goTo(dx < 0 ? i + 1 : i - 1);
      else if (s.axis === 'y' && dy > 110) { onClose(); return; }
    }
    setDrag({ x: 0, y: 0 });
    s.mode = null;
  };

  /* ---------------- desktop ---------------- */
  const onWheel = (e) => {
    setAnimate(false);
    const cur = tRef.current;
    const ns = clamp(cur.s * (e.deltaY < 0 ? 1.15 : 1 / 1.15), 1, MAX_SCALE);
    apply(ns === 1 ? { s: 1, x: 0, y: 0 } : limit(ns, cur.x, cur.y));
  };
  const onDoubleClick = (e) => {
    if (Date.now() - g.current.touchedAt < 600) return; // touch already handled it
    toggleZoom(e.clientX, e.clientY);
  };

  if (!n) return null;
  const zoomed = t.s > 1.05;
  const fade = 1 - Math.min(drag.y / 400, 0.6);

  return (
    <div className="imgviewer" role="dialog" aria-modal="true" aria-label="Product photos" style={{ background: `rgba(20,14,12,${0.96 * fade})` }}>
      <div className="imgviewer__bar">
        <span className="imgviewer__count">{i + 1} / {n}</span>
        <button type="button" className="imgviewer__close" aria-label="Close" onClick={onClose}>
          <Close width="26" height="26" />
        </button>
      </div>

      <div
        ref={box}
        className={`imgviewer__stage ${zoomed ? 'is-zoomed' : ''}`}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
        onTouchCancel={onTouchEnd}
        onWheel={onWheel}
        onDoubleClick={onDoubleClick}
      >
        <img
          key={images[i]}
          src={images[i]}
          alt={alt}
          draggable="false"
          className="imgviewer__img"
          style={{
            transform: `translate3d(${t.x + drag.x}px, ${t.y + drag.y}px, 0) scale(${t.s})`,
            transition: animate ? 'transform 0.28s cubic-bezier(.2,.8,.2,1)' : 'none',
          }}
        />
      </div>

      {n > 1 && (
        <>
          {i > 0 && <button type="button" className="imgviewer__nav imgviewer__nav--prev" aria-label="Previous photo" onClick={() => goTo(i - 1)}>‹</button>}
          {i < n - 1 && <button type="button" className="imgviewer__nav imgviewer__nav--next" aria-label="Next photo" onClick={() => goTo(i + 1)}>›</button>}
          <div className="imgviewer__dots">
            {images.map((src, k) => (
              <button key={src} type="button" aria-label={`Photo ${k + 1}`} className={k === i ? 'is-active' : ''} onClick={() => goTo(k)} />
            ))}
          </div>
        </>
      )}
      <p className="imgviewer__hint">{zoomed ? 'Drag to move · double-tap to reset' : 'Pinch or double-tap to zoom'}</p>
    </div>
  );
}
