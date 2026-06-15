import React, { createContext, useContext, useReducer, useEffect, ReactNode } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as LocalAuthentication from "expo-local-authentication";
import { apiClient, getSecureToken, setSecureToken, removeSecureToken } from "@/lib/apiClient";

export interface User {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  displayName?: string;
  role?: string;
  biometricEnabled: boolean;
}

export interface AuthState {
  isLoading: boolean;
  isSignout: boolean;
  user: User | null;
  biometricAvailable: boolean;
  biometricEnabled: boolean;
}

export type AuthAction =
  | { type: "RESTORE_TOKEN"; payload: { user: User; biometricEnabled: boolean } }
  | { type: "SIGN_IN"; payload: User }
  | { type: "SIGN_OUT" }
  | { type: "SET_BIOMETRIC_AVAILABLE"; payload: boolean }
  | { type: "RESTORE_FAILED" }
  | { type: "UPDATE_USER"; payload: User };

interface AuthContextType {
  state: AuthState;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, firstName: string, lastName: string, displayName: string) => Promise<void>;
  signOut: () => Promise<void>;
  signInWithBiometric: () => Promise<void>;
  enableBiometric: () => Promise<void>;
  disableBiometric: () => Promise<void>;
  restoreToken: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const initialState: AuthState = {
  isLoading: true,
  isSignout: false,
  user: null,
  biometricAvailable: false,
  biometricEnabled: false,
};

function authReducer(state: AuthState, action: AuthAction): AuthState {
  switch (action.type) {
    case "RESTORE_TOKEN":
      return {
        ...state,
        isLoading: false,
        user: action.payload.user,
        biometricEnabled: action.payload.biometricEnabled,
      };
    case "SIGN_IN":
      return {
        ...state,
        isSignout: false,
        user: action.payload,
      };
    case "SIGN_OUT":
      return {
        ...state,
        isSignout: true,
        user: null,
        biometricEnabled: false,
      };
    case "SET_BIOMETRIC_AVAILABLE":
      return {
        ...state,
        biometricAvailable: action.payload,
      };
    case "RESTORE_FAILED":
      return {
        ...state,
        isLoading: false,
      };
    case "UPDATE_USER":
      return {
        ...state,
        user: action.payload,
      };
    default:
      return state;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(authReducer, initialState);

  useEffect(() => {
    const checkBiometric = async () => {
      try {
        const compatible = await LocalAuthentication.hasHardwareAsync();
        const enrolled = await LocalAuthentication.isEnrolledAsync();
        dispatch({
          type: "SET_BIOMETRIC_AVAILABLE",
          payload: compatible && enrolled,
        });
      } catch (error) {
        console.error("Error checking biometric:", error);
      }
    };

    checkBiometric();
  }, []);

  useEffect(() => {
    const bootstrapAsync = async () => {
      try {
        const token = await getSecureToken("user_token");
        if (token) {
          const res = await apiClient.get('/user/me');
          let user: User = res.data;

          const savedEmail = await getSecureToken("user_email");

          if (!user.email && savedEmail) {
            user.email = savedEmail;
          }

          dispatch({
            type: "RESTORE_TOKEN",
            payload: {
              user,
              biometricEnabled: user.biometricEnabled ?? false,
            },
          });
        } else {
          dispatch({ type: "RESTORE_FAILED" });
        }
      } catch (error) {
        console.error("Error restoring token:", error);
        await removeSecureToken("user_token");
        dispatch({ type: "RESTORE_FAILED" });
      }
    };

    bootstrapAsync();
  }, []);

  const authContext: AuthContextType = {
    state,
    signIn: async (email: string, password: string) => {
      try {
        const res = await apiClient.post('/public/auth/login', { email, password });
        const { access_token } = res.data;
        
        await setSecureToken("user_token", access_token);
        await setSecureToken("user_email", email);
        
        // Fetch User Info
        const userRes = await apiClient.get('/user/me');
        let user: User = userRes.data;
        if (!user.email) {
          user.email = email;
        }

        dispatch({ type: "SIGN_IN", payload: user });
      } catch (error: any) {
        throw new Error(error.response?.data?.message || "Invalid credentials");
      }
    },

    signUp: async (email: string, password: string, firstName: string, lastName: string, displayName: string) => {
      try {
        await apiClient.post('/public/auth/register', {
          firstName,
          lastName,
          displayName,
          email,
          password
        });
        
        // Auto sign-in after registration
        await authContext.signIn(email, password);
      } catch (error: any) {
        throw new Error(error.response?.data?.message || "Registration failed");
      }
    },

    signOut: async () => {
      try {
        await removeSecureToken("user_token");
        await removeSecureToken("biometric_enabled");
        dispatch({ type: "SIGN_OUT" });
      } catch (error) {
        console.error("Error signing out:", error);
        throw error;
      }
    },

    signInWithBiometric: async () => {
      try {
        const result = await LocalAuthentication.authenticateAsync({
          disableDeviceFallback: false,
        });

        if (result.success) {
          const token = await getSecureToken("user_token");
          if (token) {
            if (!state.user) {
              const res = await apiClient.get('/user/me');
              let user: User = res.data;
              const savedEmail = await getSecureToken("user_email");
              if (!user.email && savedEmail) {
                user.email = savedEmail;
              }
              dispatch({ type: "SIGN_IN", payload: user });
            }
          } else {
            throw new Error("No token found. Please login normally first.");
          }
        } else {
          throw new Error("Biometric authentication failed");
        }
      } catch (error: any) {
        throw new Error(error.message || "Biometric authentication failed");
      }
    },

    enableBiometric: async () => {
      try {
        await apiClient.patch('/user/biometric/status', { biometricEnabled: true });
      } catch (error: any) {
        throw new Error(error.response?.data?.message || "Falha ao ativar biometria");
      }
      await setSecureToken("biometric_enabled", "true");
      if (state.user) {
        dispatch({ type: "UPDATE_USER", payload: { ...state.user, biometricEnabled: true } });
      }
    },

    disableBiometric: async () => {
      try {
        await apiClient.patch('/user/biometric/status', { biometricEnabled: false });
      } catch (error: any) {
        throw new Error(error.response?.data?.message || "Falha ao desativar biometria");
      }
      await setSecureToken("biometric_enabled", "false");
      if (state.user) {
        dispatch({ type: "UPDATE_USER", payload: { ...state.user, biometricEnabled: false } });
      }
    },

    restoreToken: async () => {
      try {
        const token = await getSecureToken("user_token");
        if (token) {
          const res = await apiClient.get('/user/me');
          let user: User = res.data;
          const savedEmail = await getSecureToken("user_email");

          if (!user.email && savedEmail) {
            user.email = savedEmail;
          }

          dispatch({
            type: "RESTORE_TOKEN",
            payload: {
              user,
              biometricEnabled: user.biometricEnabled ?? false,
            },
          });
        } else {
          dispatch({ type: "RESTORE_FAILED" });
        }
      } catch (error) {
        dispatch({ type: "RESTORE_FAILED" });
      }
    },
  };

  return (
    <AuthContext.Provider value={authContext}>{children}</AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
