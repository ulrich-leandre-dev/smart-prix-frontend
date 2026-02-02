'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { ScrapedProduct } from '../types';

interface CartContextType {
  cart: ScrapedProduct[];
  addToCart: (product: ScrapedProduct) => void;
  removeFromCart: (name: string) => void;
  clearCart: () => void;
  total: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [cart, setCart] = useState<ScrapedProduct[]>([]);

  const addToCart = (product: ScrapedProduct) => {
    setCart((prev) => [...prev, product]);
  };

  const removeFromCart = (name: string) => {
    setCart((prev) => prev.filter((item) => item.name !== name));
  };

  const clearCart = () => setCart([]);

  const total = cart.reduce((acc, item) => acc + item.price, 0);

  return (
    <CartContext.Provider value={{ cart, addToCart, removeFromCart, clearCart, total }}>
      {children}
    </CartContext.Provider>
  );
}

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) throw new Error('useCart must be used within a CartProvider');
  return context;
}
