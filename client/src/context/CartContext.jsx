import { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';

const CartContext = createContext(null);
export const useCart = () => useContext(CartContext);

const KEY = 'sutaara_cart';
const FREE_SHIP_ABOVE = 2999;
const SHIP_FLAT = 99;

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

  const add = useCallback((product, qty = 1) => {
    setItems((cur) => {
      const found = cur.find((i) => i._id === product._id);
      if (found) {
        return cur.map((i) => (i._id === product._id ? { ...i, qty: i.qty + qty } : i));
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
          qty,
        },
      ];
    });
    setOpen(true);
  }, []);

  const setQty = useCallback((id, qty) => {
    setItems((cur) =>
      cur
        .map((i) => (i._id === id ? { ...i, qty: Math.max(1, qty) } : i))
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
