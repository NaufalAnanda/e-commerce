import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';
import { cartAPI } from '../services/api';
import { useAuth } from './AuthContext';
import toast from 'react-hot-toast';

interface CartItem {
  _id: string;
  product: {
    _id: string;
    name: string;
    images: Array<{ url: string; alt?: string }>;
    price: number;
  };
  variant?: {
    name: string;
    options: Array<{ name: string; value: string }>;
  };
  quantity: number;
  price: number;
  addedAt: string;
}

interface Coupon {
  code: string;
  discount: number;
  type: 'percentage' | 'fixed';
  appliedAt?: string;
  expiresAt?: string;
}

interface Cart {
  _id: string;
  user: string;
  items: CartItem[];
  coupon: Coupon;
  shippingMethod: string;
  shippingCost: number;
  tax: {
    amount: number;
    rate: number;
  };
  expiresAt: string;
  subtotal: number;
  total: number;
  itemCount: number;
}

interface CartState {
  cart: Cart | null;
  isLoading: boolean;
  isUpdating: boolean;
}

type CartAction =
  | { type: 'CART_START' }
  | { type: 'CART_SUCCESS'; payload: Cart }
  | { type: 'CART_FAILURE' }
  | { type: 'CART_UPDATE_START' }
  | { type: 'CART_UPDATE_SUCCESS'; payload: Cart }
  | { type: 'CART_UPDATE_FAILURE' }
  | { type: 'CART_CLEAR' };

interface CartContextType extends CartState {
  addToCart: (productId: string, quantity?: number, variant?: any) => Promise<boolean>;
  updateCartItem: (itemId: string, quantity: number) => Promise<boolean>;
  removeFromCart: (itemId: string) => Promise<boolean>;
  clearCart: () => Promise<boolean>;
  applyCoupon: (code: string) => Promise<boolean>;
  removeCoupon: () => Promise<boolean>;
  refreshCart: () => Promise<void>;
}

const initialState: CartState = {
  cart: null,
  isLoading: false,
  isUpdating: false,
};

const cartReducer = (state: CartState, action: CartAction): CartState => {
  switch (action.type) {
    case 'CART_START':
      return {
        ...state,
        isLoading: true,
      };
    case 'CART_SUCCESS':
      return {
        ...state,
        cart: action.payload,
        isLoading: false,
      };
    case 'CART_FAILURE':
      return {
        ...state,
        cart: null,
        isLoading: false,
      };
    case 'CART_UPDATE_START':
      return {
        ...state,
        isUpdating: true,
      };
    case 'CART_UPDATE_SUCCESS':
      return {
        ...state,
        cart: action.payload,
        isUpdating: false,
      };
    case 'CART_UPDATE_FAILURE':
      return {
        ...state,
        isUpdating: false,
      };
    case 'CART_CLEAR':
      return {
        ...state,
        cart: null,
        isLoading: false,
        isUpdating: false,
      };
    default:
      return state;
  }
};

const CartContext = createContext<CartContextType | undefined>(undefined);

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};

interface CartProviderProps {
  children: ReactNode;
}

export const CartProvider: React.FC<CartProviderProps> = ({ children }) => {
  const [state, dispatch] = useReducer(cartReducer, initialState);
  const { isAuthenticated } = useAuth();

  // Load cart when user is authenticated
  useEffect(() => {
    if (isAuthenticated) {
      refreshCart();
    } else {
      dispatch({ type: 'CART_CLEAR' });
    }
  }, [isAuthenticated]);

  const refreshCart = async (): Promise<void> => {
    if (!isAuthenticated) return;

    try {
      dispatch({ type: 'CART_START' });
      const response = await cartAPI.getCart();
      
      if (response.data.success) {
        dispatch({ type: 'CART_SUCCESS', payload: response.data.data.cart });
      } else {
        throw new Error('Failed to load cart');
      }
    } catch (error) {
      dispatch({ type: 'CART_FAILURE' });
      console.error('Failed to load cart:', error);
    }
  };

  const addToCart = async (productId: string, quantity: number = 1, variant?: any): Promise<boolean> => {
    if (!isAuthenticated) {
      toast.error('Please login to add items to cart');
      return false;
    }

    try {
      dispatch({ type: 'CART_UPDATE_START' });
      
      const response = await cartAPI.addToCart({
        productId,
        quantity,
        variant,
      });
      
      if (response.data.success) {
        dispatch({ type: 'CART_UPDATE_SUCCESS', payload: response.data.data.cart });
        toast.success('Item added to cart');
        return true;
      } else {
        throw new Error(response.data.message || 'Failed to add to cart');
      }
    } catch (error: any) {
      dispatch({ type: 'CART_UPDATE_FAILURE' });
      toast.error(error.response?.data?.message || 'Failed to add to cart');
      return false;
    }
  };

  const updateCartItem = async (itemId: string, quantity: number): Promise<boolean> => {
    if (!isAuthenticated) return false;

    try {
      dispatch({ type: 'CART_UPDATE_START' });
      
      const response = await cartAPI.updateCartItem(itemId, { quantity });
      
      if (response.data.success) {
        dispatch({ type: 'CART_UPDATE_SUCCESS', payload: response.data.data.cart });
        
        if (quantity === 0) {
          toast.success('Item removed from cart');
        } else {
          toast.success('Cart updated');
        }
        return true;
      } else {
        throw new Error(response.data.message || 'Failed to update cart');
      }
    } catch (error: any) {
      dispatch({ type: 'CART_UPDATE_FAILURE' });
      toast.error(error.response?.data?.message || 'Failed to update cart');
      return false;
    }
  };

  const removeFromCart = async (itemId: string): Promise<boolean> => {
    if (!isAuthenticated) return false;

    try {
      dispatch({ type: 'CART_UPDATE_START' });
      
      const response = await cartAPI.removeFromCart(itemId);
      
      if (response.data.success) {
        dispatch({ type: 'CART_UPDATE_SUCCESS', payload: response.data.data.cart });
        toast.success('Item removed from cart');
        return true;
      } else {
        throw new Error(response.data.message || 'Failed to remove from cart');
      }
    } catch (error: any) {
      dispatch({ type: 'CART_UPDATE_FAILURE' });
      toast.error(error.response?.data?.message || 'Failed to remove from cart');
      return false;
    }
  };

  const clearCart = async (): Promise<boolean> => {
    if (!isAuthenticated) return false;

    try {
      dispatch({ type: 'CART_UPDATE_START' });
      
      const response = await cartAPI.clearCart();
      
      if (response.data.success) {
        dispatch({ type: 'CART_UPDATE_SUCCESS', payload: response.data.data.cart });
        toast.success('Cart cleared');
        return true;
      } else {
        throw new Error(response.data.message || 'Failed to clear cart');
      }
    } catch (error: any) {
      dispatch({ type: 'CART_UPDATE_FAILURE' });
      toast.error(error.response?.data?.message || 'Failed to clear cart');
      return false;
    }
  };

  const applyCoupon = async (code: string): Promise<boolean> => {
    if (!isAuthenticated) return false;

    try {
      dispatch({ type: 'CART_UPDATE_START' });
      
      const response = await cartAPI.applyCoupon({ code });
      
      if (response.data.success) {
        dispatch({ type: 'CART_UPDATE_SUCCESS', payload: response.data.data.cart });
        toast.success('Coupon applied successfully');
        return true;
      } else {
        throw new Error(response.data.message || 'Failed to apply coupon');
      }
    } catch (error: any) {
      dispatch({ type: 'CART_UPDATE_FAILURE' });
      toast.error(error.response?.data?.message || 'Failed to apply coupon');
      return false;
    }
  };

  const removeCoupon = async (): Promise<boolean> => {
    if (!isAuthenticated) return false;

    try {
      dispatch({ type: 'CART_UPDATE_START' });
      
      const response = await cartAPI.removeCoupon();
      
      if (response.data.success) {
        dispatch({ type: 'CART_UPDATE_SUCCESS', payload: response.data.data.cart });
        toast.success('Coupon removed');
        return true;
      } else {
        throw new Error(response.data.message || 'Failed to remove coupon');
      }
    } catch (error: any) {
      dispatch({ type: 'CART_UPDATE_FAILURE' });
      toast.error(error.response?.data?.message || 'Failed to remove coupon');
      return false;
    }
  };

  const value: CartContextType = {
    ...state,
    addToCart,
    updateCartItem,
    removeFromCart,
    clearCart,
    applyCoupon,
    removeCoupon,
    refreshCart,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};
