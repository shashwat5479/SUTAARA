import { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';

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
        },
      ];
    });
    // Don't auto-open the cart drawer — just show the toast
    // setOpen(true);
    return result;
  }, []);

  const setQty = useCallback((id, qty) => {
    setItems((cur) =>
      cur
        .map((i) => (i._id === id ? { ...i, qty: Math.max(1, Math.min(qty, i.stock ?? Infinity)) } : i))
        .filter((i) => i.qty > 0)
    );
  }, []);

  const remove = useCallback((id) => {
    setItems((cur) => cur.filter((i) => i._id !== id));
  }, []);

  const clear = useCallback(() => setItems([]), []);

  const totals = useMemo(() => {
    const count = items.reduce((n, i) => n + i.qty, 0);
    const subtotal = items.reduce((n, i) => n + i.price * i.qty, 0);
    const shipping = subtotal === 0 || subtotal >= FREE_SHIP_ABOVE ? 0 : SHIP_FLAT;
    return { count, subtotal, shipping, total: subtotal + shipping, freeShipAbove: FREE_SHIP_ABOVE };
  }, [items]);

  return (
    <CartContext.Provider
      value={{ items, open, setOpen, add, setQty, remove, clear, ...totals }}
    >
      {children}
    </CartContext.Provider>
  );
}
