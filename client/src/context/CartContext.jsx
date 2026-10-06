import { createContext, useContext, useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { api } from '../api/client.js';
import { useToast } from './ToastContext.jsx';

const CartContext = createContext(null);
export const useCart = () => useContext(CartContext);

const KEY = 'sutaara_cart';
const FREE_SHIP_ABOVE = 4999;
const SHIP_FLAT = 100;

function load() {
  try {
    return JSON.parse(localStorage.getItem(KEY)) || [];
  } catch {
    return [];
  }
}

export function CartProvider({ children }) {
  const [items, setItems] = useState(load);
  const [open, setOpen] = useState(false);
  const toast = useToast();

  // Latest items, readable from async code without re-creating callbacks.
  const itemsRef = useRef(items);
  itemsRef.current = items;

  useEffect(() => {
    localStorage.setItem(KEY, JSON.stringify(items));
  }, [items]);

  // Returns 'ok', 'capped' (added but hit the stock limit), or 'none' (already
  // at the limit, nothing added) so callers can toast the right message —
  // this cart previously had zero awareness of stock at all, so it was
  // possible to add e.g. 4 of something with only 1 unit in stock.
  const add = useCallback((product, qty = 1) => {
    const stock = product.stock ?? Infinity;
    let result = 'ok';
    setItems((cur) => {
      const found = cur.find((i) => i._id === product._id);
      const currentQty = found ? found.qty : 0;
      if (currentQty >= stock) {
        result = 'none';
        return cur;
      }
      const nextQty = Math.min(currentQty + qty, stock);
      if (nextQty < currentQty + qty) result = 'capped';
      if (found) {
        return cur.map((i) => (i._id === product._id ? { ...i, qty: nextQty, stock } : i));
      }
      return [
        ...cur,
        {
          _id: product._id,
          product: product._id,
          name: product.name,
          slug: product.slug,
          fabric: product.fabric,
          image: product.images?.[0] || '',
          price: product.price,
          qty: nextQty,
          stock,
          codAvailable: !!product.codAvailable,
        },
      ];
    });
    // Don't auto-open the cart drawer — just show the toast
    // setOpen(true);
    return result;
  }, []);

  // Going below 1 removes the line (like Amazon's bin button) — it used to be
  // clamped at 1, so pressing minus on a single item did nothing.
  const setQty = useCallback((id, qty) => {
    setItems((cur) =>
      qty < 1
        ? cur.filter((i) => i._id !== id)
        : cur.map((i) => (i._id === id ? { ...i, qty: Math.min(qty, i.stock ?? Infinity) } : i))
    );
  }, []);

  const remove = useCallback((id) => {
    setItems((cur) => cur.filter((i) => i._id !== id && i.product !== id));
  }, []);

  const clear = useCallback(() => setItems([]), []);

  // The cart lives in this browser (localStorage), so on its own it never
  // finds out that a product was deleted/archived, sold out, or repriced.
  // This checks every saved line against the live catalogue: lines whose
  // product is gone are dropped (with a note), and price / stock / name are
  // refreshed so nobody checks out with stale data.
  const sync = useCallback(async () => {
    const snapshot = itemsRef.current;
    if (snapshot.length === 0) return;
    let live;
    try {
      const res = await api.getProductsByIds(snapshot.map((i) => i._id));
      live = new Map((res.products || []).map((p) => [p._id, p]));
    } catch {
      return; // offline / server hiccup — keep the cart as it is
    }
    const dropped = [];
    const updates = new Map();
    for (const i of snapshot) {
      const p = live.get(i._id);
      if (!p) {
        dropped.push(i.name);
      } else if ((p.stock ?? 0) <= 0) {
        dropped.push(`${i.name} (sold out)`);
      } else {
        updates.set(i._id, {
          name: p.name,
          slug: p.slug,
          fabric: p.fabric,
          image: p.images?.[0] || i.image,
          price: p.price,
          stock: p.stock,
          codAvailable: !!p.codAvailable,
        });
      }
    }
    setItems((cur) =>
      cur
        .filter((i) => updates.has(i._id) || !snapshot.some((s) => s._id === i._id))
        .map((i) => {
          const u = updates.get(i._id);
          return u ? { ...i, ...u, qty: Math.min(i.qty, u.stock) } : i;
        })
    );
    if (dropped.length) {
      toast(
        dropped.length === 1
          ? `${dropped[0]} is no longer available and was removed from your bag`
          : `${dropped.length} items are no longer available and were removed from your bag`
      );
    }
  }, [toast]);

  // Check on first load, whenever the bag is opened, and when the tab regains focus.
  useEffect(() => {
    sync();
  }, [open, sync]);
  useEffect(() => {
    const onVisible = () => document.visibilityState === 'visible' && sync();
    document.addEventListener('visibilitychange', onVisible);
    return () => document.removeEventListener('visibilitychange', onVisible);
  }, [sync]);

  const totals = useMemo(() => {
    const count = items.reduce((n, i) => n + i.qty, 0);
    const subtotal = items.reduce((n, i) => n + i.price * i.qty, 0);
    const shipping = subtotal === 0 || subtotal >= FREE_SHIP_ABOVE ? 0 : SHIP_FLAT;
    return { count, subtotal, shipping, total: subtotal + shipping, freeShipAbove: FREE_SHIP_ABOVE };
  }, [items]);

  return (
    <CartContext.Provider
      value={{ items, open, setOpen, add, setQty, remove, clear, sync, ...totals }}
    >
      {children}
    </CartContext.Provider>
  );
}
