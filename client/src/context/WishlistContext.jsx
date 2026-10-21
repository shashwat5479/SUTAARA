import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { trackProductEvent } from '../utils/track.js';

const WishlistContext = createContext(null);
export const useWishlist = () => useContext(WishlistContext);

const KEY = 'sutaara_wishlist';

function load() {
  try {
    return JSON.parse(localStorage.getItem(KEY)) || [];
  } catch {
    return [];
  }
}

export function WishlistProvider({ children }) {
  const [items, setItems] = useState(load);
  const itemsRef = useRef(items);
  itemsRef.current = items;

  useEffect(() => {
    localStorage.setItem(KEY, JSON.stringify(items));
  }, [items]);

  const has = useCallback((id) => items.some((i) => i._id === id), [items]);

  const toggle = useCallback((product) => {
    // Count the heart as a "like" when saved, an "unlike" when removed.
    trackProductEvent(product._id, itemsRef.current.some((i) => i._id === product._id) ? 'wishlist_remove' : 'wishlist_add');
    setItems((cur) => {
      if (cur.some((i) => i._id === product._id)) {
        return cur.filter((i) => i._id !== product._id);
      }
      return [
        ...cur,
        {
          _id: product._id,
          name: product.name,
          slug: product.slug,
          fabric: product.fabric,
          price: product.price,
          mrp: product.mrp,
          images: product.images,
        },
      ];
    });
  }, []);

  const remove = useCallback((id) => setItems((cur) => cur.filter((i) => i._id !== id)), []);

  return (
    <WishlistContext.Provider value={{ items, has, toggle, remove, count: items.length }}>
      {children}
    </WishlistContext.Provider>
  );
}
