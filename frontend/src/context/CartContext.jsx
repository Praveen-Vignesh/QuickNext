import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../api/client';
import { useAuth } from './AuthContext';

const CartContext = createContext(null);

const EMPTY = { items: [], subtotal: 0, hasIssues: false };

/**
 * The basket lives in MongoDB, not in this component.
 *
 * State here is a cache of the server's cart; every mutation PUTs the whole
 * array and adopts whatever comes back. That's what makes the basket survive a
 * refresh and follow the user to another device — and the response carries live
 * stock, so the cart also shows when something sold out while it sat there.
 */
export function CartProvider({ children }) {
  const { user } = useAuth();
  const [cart, setCart] = useState(EMPTY);
  const [busy, setBusy] = useState(false);

  const refresh = useCallback(async () => {
    if (!user) {
      setCart(EMPTY);
      return;
    }
    try {
      const { data } = await api.get('/api/cart');
      setCart(data);
    } catch {
      // A failed refresh shouldn't blow away what's on screen.
    }
  }, [user]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  // Send the whole basket; the server merges duplicates and validates.
  const save = useCallback(async (items) => {
    setBusy(true);
    try {
      const { data } = await api.put('/api/cart', { items });
      setCart(data);
      return data;
    } finally {
      setBusy(false);
    }
  }, []);

  const toLines = (items) => items.map((i) => ({ productId: i.productId, quantity: i.quantity }));

  const addItem = useCallback(
    async (productId, quantity = 1) => {
      const lines = toLines(cart.items);
      const existing = lines.find((l) => l.productId === productId);
      if (existing) existing.quantity += quantity;
      else lines.push({ productId, quantity });
      return save(lines);
    },
    [cart.items, save]
  );

  const setQuantity = useCallback(
    async (productId, quantity) => {
      const lines = toLines(cart.items)
        .map((l) => (l.productId === productId ? { ...l, quantity } : l))
        .filter((l) => l.quantity > 0); // quantity 0 removes the line
      return save(lines);
    },
    [cart.items, save]
  );

  const removeItem = useCallback((productId) => setQuantity(productId, 0), [setQuantity]);

  const clear = useCallback(async () => {
    const { data } = await api.delete('/api/cart');
    setCart(data);
  }, []);

  const count = cart.items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <CartContext.Provider
      value={{ cart, count, busy, refresh, addItem, setQuantity, removeItem, clear }}
    >
      {children}
    </CartContext.Provider>
  );
}

export const useCart = () => useContext(CartContext);
