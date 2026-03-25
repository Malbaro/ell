import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useAuth } from './AuthContext';

const CartContext = createContext(null);

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export const CartProvider = ({ children }) => {
  const [cart, setCart] = useState({ items: [], total: 0 });
  const [loading, setLoading] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const { isAuthenticated } = useAuth();

  const fetchCart = useCallback(async () => {
    if (!isAuthenticated) {
      setCart({ items: [], total: 0 });
      return;
    }
    try {
      setLoading(true);
      const response = await axios.get(`${API}/cart`);
      setCart(response.data);
    } catch (error) {
      console.error('Failed to fetch cart:', error);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    fetchCart();
  }, [fetchCart]);

  const addToCart = async (productId, quantity = 1) => {
    try {
      await axios.post(`${API}/cart/add`, { product_id: productId, quantity });
      await fetchCart();
      setIsCartOpen(true);
    } catch (error) {
      console.error('Failed to add to cart:', error);
      throw error;
    }
  };

  const updateQuantity = async (productId, quantity) => {
    try {
      await axios.put(`${API}/cart/update`, { product_id: productId, quantity });
      await fetchCart();
    } catch (error) {
      console.error('Failed to update cart:', error);
      throw error;
    }
  };

  const removeFromCart = async (productId) => {
    try {
      await axios.delete(`${API}/cart/remove/${productId}`);
      await fetchCart();
    } catch (error) {
      console.error('Failed to remove from cart:', error);
      throw error;
    }
  };

  const clearCart = async () => {
    try {
      await axios.delete(`${API}/cart/clear`);
      setCart({ items: [], total: 0 });
    } catch (error) {
      console.error('Failed to clear cart:', error);
      throw error;
    }
  };

  const itemCount = cart.items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <CartContext.Provider value={{
      cart,
      loading,
      isCartOpen,
      setIsCartOpen,
      addToCart,
      updateQuantity,
      removeFromCart,
      clearCart,
      fetchCart,
      itemCount
    }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};
