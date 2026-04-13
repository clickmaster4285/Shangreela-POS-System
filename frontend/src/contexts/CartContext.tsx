import { createContext, useContext, useState, type ReactNode } from 'react';
import { type CartItem } from '@/data/mockData';

interface CartContextType {
  cart: CartItem[];
  setCart: React.Dispatch<React.SetStateAction<CartItem[]>>;
  showDiscardPopup: boolean;
  setShowDiscardPopup: React.Dispatch<React.SetStateAction<boolean>>;
  pendingNavigation: string | null;
  setPendingNavigation: React.Dispatch<React.SetStateAction<string | null>>;
}

const CartContext = createContext<CartContextType | null>(null);

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

export const CartProvider = ({ children }: CartProviderProps) => {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [showDiscardPopup, setShowDiscardPopup] = useState(false);
  const [pendingNavigation, setPendingNavigation] = useState<string | null>(null);

  return (
    <CartContext.Provider
      value={{
        cart,
        setCart,
        showDiscardPopup,
        setShowDiscardPopup,
        pendingNavigation,
        setPendingNavigation,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};