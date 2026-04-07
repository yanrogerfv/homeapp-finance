import React, { createContext, useContext, useReducer, useEffect, ReactNode } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as SecureStore from "expo-secure-store";
import * as LocalAuthentication from "expo-local-authentication";
import bcryptjs from "bcryptjs";

export interface User {
  id: string;
  email: string;
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
  | { type: "RESTORE_FAILED" };

interface AuthContextType {
  state: AuthState;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  signInWithBiometric: () => Promise<void>;
  enableBiometric: (password: string) => Promise<void>;
  disableBiometric: (password: string) => Promise<void>;
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
    default:
      return state;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // Check biometric availability on mount
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

  // Restore token on app launch
  useEffect(() => {
    const bootstrapAsync = async () => {
      try {
        const userJson = await AsyncStorage.getItem("user");
        if (userJson) {
          const user = JSON.parse(userJson);
          const biometricEnabled = await SecureStore.getItemAsync(
            "biometric_enabled"
          );
          dispatch({
            type: "RESTORE_TOKEN",
            payload: {
              user,
              biometricEnabled: biometricEnabled === "true",
            },
          });
        } else {
          dispatch({ type: "RESTORE_FAILED" });
        }
      } catch (error) {
        console.error("Error restoring token:", error);
        dispatch({ type: "RESTORE_FAILED" });
      }
    };

    bootstrapAsync();
  }, []);

  const authContext: AuthContextType = {
    state,
    signIn: async (email: string, password: string) => {
      try {
        // Get stored user data
        const userJson = await AsyncStorage.getItem("user");
        if (!userJson) {
          throw new Error("User not found");
        }

        const userData = JSON.parse(userJson);
        const passwordHash = await SecureStore.getItemAsync("password_hash");

        if (!passwordHash) {
          throw new Error("Password not set");
        }

        // Verify password
        const isPasswordValid = await bcryptjs.compare(password, passwordHash);
        if (!isPasswordValid) {
          throw new Error("Invalid password");
        }

        const user: User = {
          id: userData.id,
          email: userData.email,
          biometricEnabled: userData.biometricEnabled || false,
        };

        dispatch({ type: "SIGN_IN", payload: user });
      } catch (error) {
        throw error;
      }
    },

    signUp: async (email: string, password: string) => {
      try {
        // Check if user already exists
        const existingUser = await AsyncStorage.getItem("user");
        if (existingUser) {
          throw new Error("User already exists");
        }

        // Hash password
        const salt = await bcryptjs.genSalt(10);
        const passwordHash = await bcryptjs.hash(password, salt);

        // Create user
        const user: User = {
          id: Math.random().toString(36).substr(2, 9),
          email,
          biometricEnabled: false,
        };

        // Store user and password hash
        await AsyncStorage.setItem("user", JSON.stringify(user));
        await SecureStore.setItemAsync("password_hash", passwordHash);
        await SecureStore.setItemAsync("biometric_enabled", "false");

        dispatch({ type: "SIGN_IN", payload: user });
      } catch (error) {
        throw error;
      }
    },

    signOut: async () => {
      try {
        await AsyncStorage.removeItem("user");
        await SecureStore.deleteItemAsync("biometric_enabled");
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
          const userJson = await AsyncStorage.getItem("user");
          if (userJson) {
            const user = JSON.parse(userJson);
            dispatch({ type: "SIGN_IN", payload: user });
          }
        } else {
          throw new Error("Biometric authentication failed");
        }
      } catch (error) {
        throw error;
      }
    },

    enableBiometric: async (password: string) => {
      try {
        // Verify password first
        const passwordHash = await SecureStore.getItemAsync("password_hash");
        if (!passwordHash) {
          throw new Error("Password not set");
        }

        const isPasswordValid = await bcryptjs.compare(password, passwordHash);
        if (!isPasswordValid) {
          throw new Error("Invalid password");
        }

        // Enable biometric
        await SecureStore.setItemAsync("biometric_enabled", "true");

        if (state.user) {
          const updatedUser = { ...state.user, biometricEnabled: true };
          await AsyncStorage.setItem("user", JSON.stringify(updatedUser));
          dispatch({ type: "SIGN_IN", payload: updatedUser });
        }
      } catch (error) {
        throw error;
      }
    },

    disableBiometric: async (password: string) => {
      try {
        // Verify password first
        const passwordHash = await SecureStore.getItemAsync("password_hash");
        if (!passwordHash) {
          throw new Error("Password not set");
        }

        const isPasswordValid = await bcryptjs.compare(password, passwordHash);
        if (!isPasswordValid) {
          throw new Error("Invalid password");
        }

        // Disable biometric
        await SecureStore.setItemAsync("biometric_enabled", "false");

        if (state.user) {
          const updatedUser = { ...state.user, biometricEnabled: false };
          await AsyncStorage.setItem("user", JSON.stringify(updatedUser));
          dispatch({ type: "SIGN_IN", payload: updatedUser });
        }
      } catch (error) {
        throw error;
      }
    },

    restoreToken: async () => {
      try {
        const userJson = await AsyncStorage.getItem("user");
        if (userJson) {
          const user = JSON.parse(userJson);
          const biometricEnabled = await SecureStore.getItemAsync(
            "biometric_enabled"
          );
          dispatch({
            type: "RESTORE_TOKEN",
            payload: {
              user,
              biometricEnabled: biometricEnabled === "true",
            },
          });
        } else {
          dispatch({ type: "RESTORE_FAILED" });
        }
      } catch (error) {
        console.error("Error restoring token:", error);
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
