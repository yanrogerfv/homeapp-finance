import React, { createContext, useContext, useReducer, useEffect, ReactNode } from "react";
import { apiClient } from "@/lib/apiClient";
import { useAuth } from "@/lib/auth-context";

export interface Split {
  id: string;
  userId: string;
  userName: string;
  status: string;
  amount: number;
}

export interface Transaction {
  id: string;
  type: "income" | "expense";
  amount: number;
  title: string;
  description: string;
  category: string;
  categoryName?: string;
  date: string;
  dueDate?: string;
  status?: "PENDING" | "PAID" | "pending" | "paid";
  responsible?: string;
  splits?: Split[];
  // Legacy mock fields to prevent UI errors
  divisionType?: "equal" | "manual";
  isPeriodic?: boolean;
  frequency?: string;
  endDate?: string;
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Category {
  id: string;
  name: string;
  type?: "income" | "expense";
  isCustom?: boolean;
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
  addTransaction: (transaction: any) => Promise<void>;
  updateTransaction: (id: string, updates: Partial<Transaction>) => Promise<void>;
  deleteTransaction: (id: string) => Promise<void>;
  getTransactions: (month?: number, year?: number, responsibleId?: string) => Promise<void>;
  addCategory: (name: string, type: "income" | "expense") => Promise<void>;
  deleteCategory: (id: string) => Promise<void>;
  getCategories: () => Promise<void>;
  getTransactionsByMonth: (year: number, month: number) => Transaction[];
  getTotalIncome: (year?: number, month?: number) => number;
  getTotalExpense: (year?: number, month?: number) => number;
  getBalance: (year?: number, month?: number) => number;
}

const FinanceContext = createContext<FinanceContextType | undefined>(undefined);

const initialState: FinanceState = {
  transactions: [],
  categories: [],
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
  const { state: authState } = useAuth();

  const mapApiTransaction = (apiItem: any): Transaction => {
    return {
      id: apiItem.id,
      title: apiItem.title || apiItem.description || "Expense",
      description: apiItem.description || "",
      amount: apiItem.amount,
      type: "expense", // The backend seems to deal purely with expenses in this schema
      status: apiItem.status,
      date: apiItem.dueDate || new Date().toISOString(),
      dueDate: apiItem.dueDate,
      category: apiItem.categoryName || "Unknown",
      categoryName: apiItem.categoryName,
      responsible: apiItem.responsible?.displayName || apiItem.responsible?.id,
      splits: apiItem.splits || [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  };

  const getTransactionsAction = async (month?: number, year?: number, responsibleId?: string) => {
    try {
      const currentMonth = month || new Date().getMonth() + 1;
      const currentYear = year || new Date().getFullYear();

      let urlPending = `/expenses?status=PENDING&month=${currentMonth}&year=${currentYear}`;
      let urlPaid = `/expenses?status=PAID&month=${currentMonth}&year=${currentYear}`;
      if (responsibleId && responsibleId !== "all") {
        urlPending += `&responsibleId=${responsibleId}`;
        urlPaid += `&responsibleId=${responsibleId}`;
      }

      const pendingRes = await apiClient.get(urlPending);
      const paidRes = await apiClient.get(urlPaid);

      const allApiItems = [...(pendingRes.data || []), ...(paidRes.data || [])];

      dispatch({
        type: "SET_TRANSACTIONS",
        payload: allApiItems.map(mapApiTransaction),
      });
    } catch (error) {
      console.error("Error getting transactions:", error);
      dispatch({ type: "SET_LOADING", payload: false });
    }
  };

  const getCategoriesAction = async () => {
    try {
      const res = await apiClient.get("/expenses/categories");
      const mapped = res.data.map((c: any) => ({
        id: c.id,
        name: c.name,
        type: "expense",
        isCustom: false,
      }));
      dispatch({ type: "SET_CATEGORIES", payload: mapped });
    } catch (error) {
      console.error("Error getting categories:", error);
    }
  };

  useEffect(() => {
    const initData = async () => {
      if (authState.user) {
        await getCategoriesAction();
        await getTransactionsAction();
      }
    };
    initData();
  }, [authState.user]);

  const financeContext: FinanceContextType = {
    state,
    getTransactions: getTransactionsAction,
    getCategories: getCategoriesAction,

    addTransaction: async (txData) => {
      try {
        const payload = {
          title: txData.title || txData.description?.substring(0, 20) || "Expense",
          description: txData.description || "",
          amount: txData.amount,
          categoryId: txData.categoryId || state.categories[0]?.id || "",
          dueDate: txData.dueDate || new Date().toISOString().split("T")[0],
          responsibleId: txData.responsibleId || "",
          splitUsersIds: txData.splitUsersIds || [],
        };

        const res = await apiClient.post("/expenses", payload);
        dispatch({ type: "ADD_TRANSACTION", payload: mapApiTransaction(res.data) });
      } catch (error) {
        console.error("Error adding transaction:", error);
        throw error;
      }
    },

    updateTransaction: async (id, updates) => {
      try {
        if (updates.status) {
          const res = await apiClient.patch(`/expenses/${id}/status`, { status: updates.status.toUpperCase() });
          dispatch({ type: "UPDATE_TRANSACTION", payload: mapApiTransaction(res.data) });
        } else {
          // If the backend had a full PUT /expenses/{id}, we'd call it here.
          // Fallback to local update if just patching visual details
          const existing = state.transactions.find((t) => t.id === id);
          if (existing) {
            dispatch({ type: "UPDATE_TRANSACTION", payload: { ...existing, ...updates } });
          }
        }
      } catch (error) {
        console.error("Error updating transaction:", error);
        throw error;
      }
    },

    deleteTransaction: async (id) => {
      try {
        await apiClient.delete(`/expenses/${id}`);
        dispatch({ type: "DELETE_TRANSACTION", payload: id });
      } catch (error) {
        console.error("Error deleting transaction:", error);
        throw error;
      }
    },

    addCategory: async (name, type) => {
      // Backend does not expose a POST /expenses/categories
      console.warn("Adding custom categories not supported via backend yet.");
    },

    deleteCategory: async (id) => {
      console.warn("Deleting categories not supported via backend yet.");
    },

    getTransactionsByMonth: (year, month) => {
      return state.transactions.filter((t) => {
        const date = new Date(t.date);
        return date.getFullYear() === year && date.getMonth() === month - 1;
      });
    },

    getTotalIncome: (year, month) => {
      // API primarily handles expenses right now.
      return 0;
    },

    getTotalExpense: (year, month) => {
      const txs = year && month
        ? financeContext.getTransactionsByMonth(year, month)
        : state.transactions;
      return txs.reduce((sum, t) => sum + (t.type === "expense" ? t.amount : 0), 0);
    },

    getBalance: (year, month) => {
      const income = financeContext.getTotalIncome(year, month);
      const expense = financeContext.getTotalExpense(year, month);
      return income - expense;
    },
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
