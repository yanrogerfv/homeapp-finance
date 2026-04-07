import React, { createContext, useContext, useReducer, useEffect, ReactNode } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { v4 as uuidv4 } from "uuid";

export interface Transaction {
  id: string;
  type: "income" | "expense";
  amount: number;
  description: string;
  category: string;
  date: string; // ISO date string
  dueDate?: string; // Appears for expenses
  status?: "pending" | "paid";
  responsible?: string; // Resident user ID/name
  divisionType?: "equal" | "manual";
  isPeriodic: boolean;
  frequency?: "weekly" | "monthly" | "quarterly" | "yearly";
  endDate?: string; // ISO date string
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Category {
  id: string;
  name: string;
  type: "income" | "expense";
  isCustom: boolean;
  color?: string;
}

export interface FinanceState {
  transactions: Transaction[];
  categories: Category[];
  isLoading: boolean;
}

export type FinanceAction =
  | { type: "SET_TRANSACTIONS"; payload: Transaction[] }
  | { type: "ADD_TRANSACTION"; payload: Transaction }
  | { type: "UPDATE_TRANSACTION"; payload: Transaction }
  | { type: "DELETE_TRANSACTION"; payload: string }
  | { type: "SET_CATEGORIES"; payload: Category[] }
  | { type: "ADD_CATEGORY"; payload: Category }
  | { type: "DELETE_CATEGORY"; payload: string }
  | { type: "SET_LOADING"; payload: boolean };

interface FinanceContextType {
  state: FinanceState;
  addTransaction: (transaction: Omit<Transaction, "id" | "createdAt" | "updatedAt">) => Promise<void>;
  updateTransaction: (id: string, transaction: Partial<Transaction>) => Promise<void>;
  deleteTransaction: (id: string) => Promise<void>;
  getTransactions: () => Promise<void>;
  addCategory: (name: string, type: "income" | "expense") => Promise<void>;
  deleteCategory: (id: string) => Promise<void>;
  getCategories: () => Promise<void>;
  getTransactionsByMonth: (year: number, month: number) => Transaction[];
  getTotalIncome: (year?: number, month?: number) => number;
  getTotalExpense: (year?: number, month?: number) => number;
  getBalance: (year?: number, month?: number) => number;
}

const FinanceContext = createContext<FinanceContextType | undefined>(undefined);

const DEFAULT_CATEGORIES: Category[] = [
  // Income categories
  { id: "income-1", name: "Salary", type: "income", isCustom: false },
  { id: "income-2", name: "Bonus", type: "income", isCustom: false },
  { id: "income-3", name: "Freelance", type: "income", isCustom: false },
  { id: "income-4", name: "Investment", type: "income", isCustom: false },
  { id: "income-5", name: "Other Income", type: "income", isCustom: false },

  // Expense categories
  { id: "expense-1", name: "Rent", type: "expense", isCustom: false },
  { id: "expense-2", name: "Utilities", type: "expense", isCustom: false },
  { id: "expense-3", name: "Groceries", type: "expense", isCustom: false },
  { id: "expense-4", name: "Transportation", type: "expense", isCustom: false },
  { id: "expense-5", name: "Entertainment", type: "expense", isCustom: false },
  { id: "expense-6", name: "Healthcare", type: "expense", isCustom: false },
  { id: "expense-7", name: "Insurance", type: "expense", isCustom: false },
  { id: "expense-8", name: "Dining Out", type: "expense", isCustom: false },
  { id: "expense-9", name: "Shopping", type: "expense", isCustom: false },
  { id: "expense-10", name: "Other Expense", type: "expense", isCustom: false },
];

const initialState: FinanceState = {
  transactions: [],
  categories: DEFAULT_CATEGORIES,
  isLoading: true,
};

function financeReducer(state: FinanceState, action: FinanceAction): FinanceState {
  switch (action.type) {
    case "SET_TRANSACTIONS":
      return { ...state, transactions: action.payload, isLoading: false };
    case "ADD_TRANSACTION":
      return { ...state, transactions: [action.payload, ...state.transactions] };
    case "UPDATE_TRANSACTION":
      return {
        ...state,
        transactions: state.transactions.map((t) =>
          t.id === action.payload.id ? action.payload : t
        ),
      };
    case "DELETE_TRANSACTION":
      return {
        ...state,
        transactions: state.transactions.filter((t) => t.id !== action.payload),
      };
    case "SET_CATEGORIES":
      return { ...state, categories: action.payload };
    case "ADD_CATEGORY":
      return { ...state, categories: [...state.categories, action.payload] };
    case "DELETE_CATEGORY":
      return {
        ...state,
        categories: state.categories.filter((c) => c.id !== action.payload),
      };
    case "SET_LOADING":
      return { ...state, isLoading: action.payload };
    default:
      return state;
  }
}

export function FinanceProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(financeReducer, initialState);

  // Load data on mount
  useEffect(() => {
    const loadData = async () => {
      try {
        const transactionsJson = await AsyncStorage.getItem("transactions");
        const categoriesJson = await AsyncStorage.getItem("categories");

        if (transactionsJson) {
          dispatch({
            type: "SET_TRANSACTIONS",
            payload: JSON.parse(transactionsJson),
          });
        } else {
          dispatch({ type: "SET_LOADING", payload: false });
        }

        if (categoriesJson) {
          dispatch({
            type: "SET_CATEGORIES",
            payload: JSON.parse(categoriesJson),
          });
        } else {
          // Initialize with default categories
          await AsyncStorage.setItem(
            "categories",
            JSON.stringify(DEFAULT_CATEGORIES)
          );
        }
      } catch (error) {
        console.error("Error loading finance data:", error);
        dispatch({ type: "SET_LOADING", payload: false });
      }
    };

    loadData();
  }, []);

  const financeContext: FinanceContextType = {
    state,
    addTransaction: async (transactionData) => {
      try {
        const transaction: Transaction = {
          ...transactionData,
          id: uuidv4(),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        dispatch({ type: "ADD_TRANSACTION", payload: transaction });

        const updatedTransactions = [transaction, ...state.transactions];
        await AsyncStorage.setItem(
          "transactions",
          JSON.stringify(updatedTransactions)
        );

        // If periodic, generate future transactions
        if (transaction.isPeriodic && transaction.frequency) {
          await generatePeriodicTransactions(transaction, updatedTransactions);
        }
      } catch (error) {
        console.error("Error adding transaction:", error);
        throw error;
      }
    },

    updateTransaction: async (id, updates) => {
      try {
        const transaction = state.transactions.find((t) => t.id === id);
        if (!transaction) {
          throw new Error("Transaction not found");
        }

        const updatedTransaction: Transaction = {
          ...transaction,
          ...updates,
          id: transaction.id,
          createdAt: transaction.createdAt,
          updatedAt: new Date().toISOString(),
        };

        dispatch({ type: "UPDATE_TRANSACTION", payload: updatedTransaction });

        const updatedTransactions = state.transactions.map((t) =>
          t.id === id ? updatedTransaction : t
        );

        await AsyncStorage.setItem(
          "transactions",
          JSON.stringify(updatedTransactions)
        );
      } catch (error) {
        console.error("Error updating transaction:", error);
        throw error;
      }
    },

    deleteTransaction: async (id) => {
      try {
        dispatch({ type: "DELETE_TRANSACTION", payload: id });

        const updatedTransactions = state.transactions.filter((t) => t.id !== id);
        await AsyncStorage.setItem(
          "transactions",
          JSON.stringify(updatedTransactions)
        );
      } catch (error) {
        console.error("Error deleting transaction:", error);
        throw error;
      }
    },

    getTransactions: async () => {
      try {
        const transactionsJson = await AsyncStorage.getItem("transactions");
        if (transactionsJson) {
          dispatch({
            type: "SET_TRANSACTIONS",
            payload: JSON.parse(transactionsJson),
          });
        }
      } catch (error) {
        console.error("Error getting transactions:", error);
      }
    },

    addCategory: async (name, type) => {
      try {
        const category: Category = {
          id: uuidv4(),
          name,
          type,
          isCustom: true,
        };

        dispatch({ type: "ADD_CATEGORY", payload: category });

        const updatedCategories = [...state.categories, category];
        await AsyncStorage.setItem(
          "categories",
          JSON.stringify(updatedCategories)
        );
      } catch (error) {
        console.error("Error adding category:", error);
        throw error;
      }
    },

    deleteCategory: async (id) => {
      try {
        dispatch({ type: "DELETE_CATEGORY", payload: id });

        const updatedCategories = state.categories.filter((c) => c.id !== id);
        await AsyncStorage.setItem(
          "categories",
          JSON.stringify(updatedCategories)
        );
      } catch (error) {
        console.error("Error deleting category:", error);
        throw error;
      }
    },

    getCategories: async () => {
      try {
        const categoriesJson = await AsyncStorage.getItem("categories");
        if (categoriesJson) {
          dispatch({
            type: "SET_CATEGORIES",
            payload: JSON.parse(categoriesJson),
          });
        }
      } catch (error) {
        console.error("Error getting categories:", error);
      }
    },

    getTransactionsByMonth: (year, month) => {
      return state.transactions.filter((t) => {
        const date = new Date(t.date);
        return date.getFullYear() === year && date.getMonth() === month - 1;
      });
    },

    getTotalIncome: (year, month) => {
      const transactions = year && month
        ? state.transactions.filter((t) => {
            const date = new Date(t.date);
            return (
              t.type === "income" &&
              date.getFullYear() === year &&
              date.getMonth() === month - 1
            );
          })
        : state.transactions.filter((t) => t.type === "income");

      return transactions.reduce((sum, t) => sum + t.amount, 0);
    },

    getTotalExpense: (year, month) => {
      const transactions = year && month
        ? state.transactions.filter((t) => {
            const date = new Date(t.date);
            return (
              t.type === "expense" &&
              date.getFullYear() === year &&
              date.getMonth() === month - 1
            );
          })
        : state.transactions.filter((t) => t.type === "expense");

      return transactions.reduce((sum, t) => sum + t.amount, 0);
    },

    getBalance: (year, month) => {
      const income = financeContext.getTotalIncome(year, month);
      const expense = financeContext.getTotalExpense(year, month);
      return income - expense;
    },
  };

  const generatePeriodicTransactions = async (
    transaction: Transaction,
    currentTransactions: Transaction[]
  ) => {
    try {
      const startDate = new Date(transaction.date);
      const endDate = transaction.endDate ? new Date(transaction.endDate) : null;
      const generatedTransactions: Transaction[] = [];

      let currentDate = new Date(startDate);
      currentDate.setDate(currentDate.getDate() + 1); // Start from next occurrence

      while (!endDate || currentDate <= endDate) {
        // Generate up to 12 months ahead
        if (currentDate.getTime() - startDate.getTime() > 365 * 24 * 60 * 60 * 1000) {
          break;
        }

        const newTransaction: Transaction = {
          ...transaction,
          id: uuidv4(),
          date: currentDate.toISOString().split("T")[0],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        generatedTransactions.push(newTransaction);

        // Move to next occurrence
        switch (transaction.frequency) {
          case "weekly":
            currentDate.setDate(currentDate.getDate() + 7);
            break;
          case "monthly":
            currentDate.setMonth(currentDate.getMonth() + 1);
            break;
          case "quarterly":
            currentDate.setMonth(currentDate.getMonth() + 3);
            break;
          case "yearly":
            currentDate.setFullYear(currentDate.getFullYear() + 1);
            break;
        }
      }

      if (generatedTransactions.length > 0) {
        const updatedTransactions = [...generatedTransactions, ...currentTransactions];
        await AsyncStorage.setItem(
          "transactions",
          JSON.stringify(updatedTransactions)
        );

        generatedTransactions.forEach((t) => {
          dispatch({ type: "ADD_TRANSACTION", payload: t });
        });
      }
    } catch (error) {
      console.error("Error generating periodic transactions:", error);
    }
  };

  return (
    <FinanceContext.Provider value={financeContext}>
      {children}
    </FinanceContext.Provider>
  );
}

export function useFinance() {
  const context = useContext(FinanceContext);
  if (!context) {
    throw new Error("useFinance must be used within a FinanceProvider");
  }
  return context;
}
