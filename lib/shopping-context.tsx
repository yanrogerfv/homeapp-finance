import React, { createContext, useContext, useReducer, useEffect, ReactNode } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { v4 as uuidv4 } from "uuid";

export interface ShoppingItem {
  id: string;
  title: string;
  quantity?: number;
  unit?: string;
  isPurchased: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ShoppingState {
  items: ShoppingItem[];
  isLoading: boolean;
}

export type ShoppingAction =
  | { type: "SET_ITEMS"; payload: ShoppingItem[] }
  | { type: "ADD_ITEM"; payload: ShoppingItem }
  | { type: "UPDATE_ITEM"; payload: ShoppingItem }
  | { type: "DELETE_ITEM"; payload: string }
  | { type: "TOGGLE_ITEM"; payload: string }
  | { type: "SET_LOADING"; payload: boolean };

interface ShoppingContextType {
  state: ShoppingState;
  addItem: (title: string, quantity?: number, unit?: string) => Promise<void>;
  updateItem: (id: string, updates: Partial<ShoppingItem>) => Promise<void>;
  deleteItem: (id: string) => Promise<void>;
  toggleItem: (id: string) => Promise<void>;
  getItems: () => Promise<void>;
  clearPurchased: () => Promise<void>;
}

const ShoppingContext = createContext<ShoppingContextType | undefined>(undefined);

const initialState: ShoppingState = {
  items: [],
  isLoading: true,
};

function shoppingReducer(state: ShoppingState, action: ShoppingAction): ShoppingState {
  switch (action.type) {
    case "SET_ITEMS":
      return { ...state, items: action.payload, isLoading: false };
    case "ADD_ITEM":
      return { ...state, items: [action.payload, ...state.items] };
    case "UPDATE_ITEM":
      return {
        ...state,
        items: state.items.map((item) =>
          item.id === action.payload.id ? action.payload : item
        ),
      };
    case "DELETE_ITEM":
      return {
        ...state,
        items: state.items.filter((item) => item.id !== action.payload),
      };
    case "TOGGLE_ITEM":
      return {
        ...state,
        items: state.items.map((item) =>
          item.id === action.payload
            ? { ...item, isPurchased: !item.isPurchased }
            : item
        ),
      };
    case "SET_LOADING":
      return { ...state, isLoading: action.payload };
    default:
      return state;
  }
}

export function ShoppingProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(shoppingReducer, initialState);

  // Load data on mount
  useEffect(() => {
    const loadData = async () => {
      try {
        const itemsJson = await AsyncStorage.getItem("shopping_items");
        if (itemsJson) {
          dispatch({
            type: "SET_ITEMS",
            payload: JSON.parse(itemsJson),
          });
        } else {
          dispatch({ type: "SET_LOADING", payload: false });
        }
      } catch (error) {
        console.error("Error loading shopping items:", error);
        dispatch({ type: "SET_LOADING", payload: false });
      }
    };

    loadData();
  }, []);

  const shoppingContext: ShoppingContextType = {
    state,
    addItem: async (title, quantity, unit) => {
      try {
        const item: ShoppingItem = {
          id: uuidv4(),
          title,
          quantity,
          unit,
          isPurchased: false,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        dispatch({ type: "ADD_ITEM", payload: item });

        const updatedItems = [item, ...state.items];
        await AsyncStorage.setItem("shopping_items", JSON.stringify(updatedItems));
      } catch (error) {
        console.error("Error adding shopping item:", error);
        throw error;
      }
    },

    updateItem: async (id, updates) => {
      try {
        const item = state.items.find((i) => i.id === id);
        if (!item) {
          throw new Error("Item not found");
        }

        const updatedItem: ShoppingItem = {
          ...item,
          ...updates,
          id: item.id,
          createdAt: item.createdAt,
          updatedAt: new Date().toISOString(),
        };

        dispatch({ type: "UPDATE_ITEM", payload: updatedItem });

        const updatedItems = state.items.map((i) =>
          i.id === id ? updatedItem : i
        );

        await AsyncStorage.setItem("shopping_items", JSON.stringify(updatedItems));
      } catch (error) {
        console.error("Error updating shopping item:", error);
        throw error;
      }
    },

    deleteItem: async (id) => {
      try {
        dispatch({ type: "DELETE_ITEM", payload: id });

        const updatedItems = state.items.filter((item) => item.id !== id);
        await AsyncStorage.setItem(
          "shopping_items",
          JSON.stringify(updatedItems)
        );
      } catch (error) {
        console.error("Error deleting shopping item:", error);
        throw error;
      }
    },

    toggleItem: async (id) => {
      try {
        dispatch({ type: "TOGGLE_ITEM", payload: id });

        const updatedItems = state.items.map((item) =>
          item.id === id
            ? { ...item, isPurchased: !item.isPurchased, updatedAt: new Date().toISOString() }
            : item
        );

        await AsyncStorage.setItem(
          "shopping_items",
          JSON.stringify(updatedItems)
        );
      } catch (error) {
        console.error("Error toggling shopping item:", error);
        throw error;
      }
    },

    getItems: async () => {
      try {
        const itemsJson = await AsyncStorage.getItem("shopping_items");
        if (itemsJson) {
          dispatch({
            type: "SET_ITEMS",
            payload: JSON.parse(itemsJson),
          });
        }
      } catch (error) {
        console.error("Error getting shopping items:", error);
      }
    },

    clearPurchased: async () => {
      try {
        const unpurchasedItems = state.items.filter((item) => !item.isPurchased);
        dispatch({
          type: "SET_ITEMS",
          payload: unpurchasedItems,
        });

        await AsyncStorage.setItem(
          "shopping_items",
          JSON.stringify(unpurchasedItems)
        );
      } catch (error) {
        console.error("Error clearing purchased items:", error);
        throw error;
      }
    },
  };

  return (
    <ShoppingContext.Provider value={shoppingContext}>
      {children}
    </ShoppingContext.Provider>
  );
}

export function useShopping() {
  const context = useContext(ShoppingContext);
  if (!context) {
    throw new Error("useShopping must be used within a ShoppingProvider");
  }
  return context;
}
