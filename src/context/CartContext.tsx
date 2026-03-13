
'use client';

import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import type { Ad } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from './AuthContext';

export type CartItem = Ad & { quantity: number };

interface CartContextType {
  cart: CartItem[];
  addToCart: (product: Ad) => void;
  removeFromCart: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

const translations = {
    ar: {
        cartConflictTitle: "لا يمكن إضافة المنتج",
        cartConflictDesc: "سلة المشتريات تحتوي على منتجات من متجر آخر. الرجاء إكمال عملية الشراء الحالية أولاً.",
        itemAdded: "تمت إضافة المنتج إلى السلة!",
        loginRequiredTitle: "مطلوب تسجيل الدخول",
        loginRequiredDesc: "الرجاء تسجيل الدخول أو إنشاء حساب لإضافة منتجات إلى السلة.",
    }
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [cart, setCart] = useState<CartItem[]>([]);
  const { user, getUserById } = useAuth();
  const { toast } = useToast();
  const t = translations.ar;
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    const hydrateCart = async () => {
      try {
        const savedCartJson = localStorage.getItem('shoppingCart');
        if (savedCartJson) {
          const parsedCart: CartItem[] = JSON.parse(savedCartJson);
          if (Array.isArray(parsedCart) && parsedCart.length > 0) {
            // Re-fetch user data for each item to ensure it's up-to-date
            const hydratedCart = await Promise.all(
              parsedCart.map(async (item) => {
                if (item.userId) {
                  const sellerProfile = await getUserById(item.userId);
                  if (sellerProfile) {
                    return { ...item, user: sellerProfile };
                  }
                }
                return item; // Return item as is if user fetch fails
              })
            );
            setCart(hydratedCart);
          } else {
            setCart([]);
          }
        }
      } catch (error) {
        console.error("فشل تحميل أو تحليل السلة من التخزين المحلي", error);
        localStorage.removeItem('shoppingCart');
      } finally {
        setIsHydrated(true);
      }
    };
    hydrateCart();
  }, [getUserById]);


  useEffect(() => {
    if (isHydrated) {
        try {
            localStorage.setItem('shoppingCart', JSON.stringify(cart));
        } catch (error) {
            console.error("فشل حفظ السلة في التخزين المحلي", error);
        }
    }
  }, [cart, isHydrated]);


  const addToCart = useCallback(async (product: Ad) => {
    if (!user) {
        toast({
            title: t.loginRequiredTitle,
            description: t.loginRequiredDesc,
            variant: "destructive",
        });
        return;
    }

    if (cart.length > 0 && cart[0].userId !== product.userId) {
      toast({
        title: t.cartConflictTitle,
        description: t.cartConflictDesc,
        variant: "destructive",
      });
      return;
    }

    let productToAdd = { ...product };
    // Always ensure the latest user data is attached
    if (product.userId) {
        const sellerProfile = await getUserById(product.userId);
        if (sellerProfile) {
            productToAdd.user = sellerProfile;
        }
    }
    
    setCart((prevCart) => {
      const existingItemIndex = prevCart.findIndex((item) => item.id === product.id);

      if (existingItemIndex > -1) {
        const updatedCart = [...prevCart];
        const existingItem = updatedCart[existingItemIndex];
        updatedCart[existingItemIndex] = {
          ...existingItem,
          ...productToAdd, // Overwrite with fresh product data including user
          quantity: existingItem.quantity + 1,
        };
        return updatedCart;
      } else {
        return [...prevCart, { ...productToAdd, quantity: 1 }];
      }
    });
    
    toast({
        title: t.itemAdded,
    });
  }, [cart, toast, t, getUserById, user]);


  const removeFromCart = useCallback((productId: string) => {
    setCart((prevCart) => prevCart.filter((item) => item.id !== productId));
  }, []);

  const updateQuantity = useCallback((productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }
    setCart((prevCart) =>
      prevCart.map((item) =>
        item.id === productId ? { ...item, quantity } : item
      )
    );
  }, [removeFromCart]);

  const clearCart = useCallback(() => {
    setCart([]);
  }, []);

  const value = {
    cart,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}
