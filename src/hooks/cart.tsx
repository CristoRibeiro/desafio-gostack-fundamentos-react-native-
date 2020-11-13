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
        setProducts(JSON.parse(productsStorage));
      }
    }
    loadProducts();
  }, []);

  useEffect(() => {
    async function saveProducts(): Promise<void> {
      await AsyncStorage.setItem(
        '@GoMarketPlace:Products',
        JSON.stringify(products),
      );
    }
    saveProducts();
  }, [products]);

  const addToCart = useCallback(
    async (product: Product) => {
      const productsModified = products.map(productState => {
        if (productState.id === product.id) {
          productState.quantity += 1;
        }
        return productState;
      });

      const productFind = productsModified.find(
        productState => productState.id === product.id,
      );

      if (!productFind) {
        product.quantity = 1;
        productsModified.push(product);
      }
      setProducts(productsModified);
    },
    [products],
  );

  const increment = useCallback(
    async id => {
      const productsModified = products.map(product => {
        if (product.id === id) {
          product.quantity++;
        }

        return product;
      });
      setProducts(productsModified);
    },
    [products],
  );
  const decrement = useCallback(
    async id => {
      const productsDecrement = products.map(product => {
        if (product.id === id) {
          product.quantity--;
        }
        return product;
      });

      const newProducts = productsDecrement.filter(
        product => product.quantity > 0,
      );

      setProducts(newProducts);
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
