/* eslint-disable no-param-reassign */
import React, {
  createContext,
  useState,
  useCallback,
  useContext,
  useEffect,
} from 'react';

import AsyncStorage from '@react-native-community/async-storage';

interface Product {
  id: string;
  title: string;
  image_url: string;
  price: number;
  quantity: number;
}

interface CartContext {
  products: Product[];
  addToCart(item: Omit<Product, 'quantity'>): void;
  increment(id: string): void;
  decrement(id: string): void;
  getTotalCart(): number;
  getTotalItemsInCart(): number;
}

const CartContext = createContext<CartContext | null>(null);

const CartProvider: React.FC = ({ children }) => {
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    async function loadProducts(): Promise<void> {
      const productsStorage = await AsyncStorage.getItem(
        '@GoMarketPlace:Products',
      );

      if (productsStorage) {
        setProducts([...JSON.parse(productsStorage)]);
      }
    }
    loadProducts();
  }, []);

  const addToCart = useCallback(
    async (product: Product) => {
      const existingProduct = products.find(prod => prod.id === product.id);

      if (existingProduct) {
        setProducts(
          products.map(productState =>
            productState.id === product.id
              ? { ...product, quantity: productState.quantity + 1 }
              : productState,
          ),
        );
      } else {
        setProducts([...products, { ...product, quantity: 1 }]);
      }
      await AsyncStorage.setItem(
        '@GoMarketPlace:Products',
        JSON.stringify(products),
      );
    },
    [products],
  );

  const increment = useCallback(
    async id => {
      const productsModified = products.map(product =>
        product.id === id
          ? { ...product, quantity: product.quantity + 1 }
          : product,
      );
      setProducts(productsModified);
      await AsyncStorage.setItem(
        '@GoMarketPlace:Products',
        JSON.stringify(products),
      );
    },
    [products],
  );
  const decrement = useCallback(
    async id => {
      const productsDecrement = products.map(product =>
        product.id === id
          ? { ...product, quantity: product.quantity - 1 }
          : product,
      );

      const newProducts = productsDecrement.filter(
        product => product.quantity > 0,
      );

      setProducts(newProducts);
      await AsyncStorage.setItem(
        '@GoMarketPlace:Products',
        JSON.stringify(products),
      );
    },
    [products],
  );
  const getTotalCart = useCallback(
    () =>
      products.reduce(
        (valor, product) => valor + product.price * product.quantity,
        0,
      ),
    [products],
  );
  const getTotalItemsInCart = useCallback(
    () => products.reduce((valor, product) => valor + product.quantity, 0),

    [products],
  );

  const value = React.useMemo(
    () => ({
      addToCart,
      increment,
      decrement,
      getTotalCart,
      getTotalItemsInCart,
      products,
    }),
    [
      addToCart,
      increment,
      decrement,
      getTotalCart,
      getTotalItemsInCart,
      products,
    ],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

function useCart(): CartContext {
  const context = useContext(CartContext);

  if (!context) {
    throw new Error(`useCart must be used within a CartProvider`);
  }

  return context;
}

export { CartProvider, useCart };
