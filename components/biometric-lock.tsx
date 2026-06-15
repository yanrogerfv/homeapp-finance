import React, { useRef, useState, useEffect } from "react";
import { AppState, View, Text, TouchableOpacity, ActivityIndicator, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { MaterialIcons } from "@expo/vector-icons";
import { useAuth } from "@/lib/auth-context";

export function BiometricLock({ children }: { children: React.ReactNode }) {
  const { state, signInWithBiometric, signOut } = useAuth();
  const router = useRouter();
  const appStateRef = useRef(AppState.currentState);
  const [isLocked, setIsLocked] = useState(false);
  const [isAuthenticating, setIsAuthenticating] = useState(false);

  useEffect(() => {
    const subscription = AppState.addEventListener("change", (nextState) => {
      const prev = appStateRef.current;
      appStateRef.current = nextState;

      if (
        (prev === "inactive" || prev === "background") &&
        nextState === "active" &&
        state.user &&
        state.biometricEnabled &&
        state.biometricAvailable
      ) {
        setIsLocked(true);
      }
    });
    return () => subscription.remove();
  }, [state.user, state.biometricEnabled, state.biometricAvailable]);

  useEffect(() => {
    if (isLocked) {
      triggerBiometric();
    }
  }, [isLocked]);

  const triggerBiometric = async () => {
    if (isAuthenticating) return;
    setIsAuthenticating(true);
    try {
      await signInWithBiometric();
      setIsLocked(false);
    } catch {
      // stay locked — user sees the retry UI
    } finally {
      setIsAuthenticating(false);
    }
  };

  const handleUsePassword = async () => {
    await signOut();
    setIsLocked(false);
    router.replace("/(auth)" as any);
  };

  return (
    <View style={{ flex: 1 }}>
      {children}
      {isLocked && (
        <View style={StyleSheet.absoluteFill} pointerEvents="auto">
          <View style={styles.overlay}>
            <View style={styles.iconWrapper}>
              <MaterialIcons name="fingerprint" size={52} color="#fff" />
            </View>

            <Text style={styles.title}>Autenticação Necessária</Text>
            <Text style={styles.subtitle}>
              Confirme sua identidade para continuar
            </Text>

            {isAuthenticating ? (
              <ActivityIndicator size="large" color="#0a7ea4" style={{ marginTop: 32 }} />
            ) : (
              <TouchableOpacity onPress={triggerBiometric} style={styles.primaryButton}>
                <Text style={styles.primaryButtonText}>Tentar Novamente</Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              onPress={handleUsePassword}
              disabled={isAuthenticating}
              style={styles.secondaryButton}
            >
              <Text style={styles.secondaryButtonText}>Usar Senha</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "#0d1117",
    alignItems: "center",
    justifyContent: "center",
    padding: 32,
  },
  iconWrapper: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: "#0a7ea4",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 28,
  },
  title: {
    color: "#fff",
    fontSize: 24,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 8,
  },
  subtitle: {
    color: "#888",
    fontSize: 15,
    textAlign: "center",
    marginBottom: 40,
  },
  primaryButton: {
    backgroundColor: "#0a7ea4",
    borderRadius: 14,
    paddingVertical: 16,
    width: "100%",
    alignItems: "center",
    marginBottom: 12,
  },
  primaryButtonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
  },
  secondaryButton: {
    paddingVertical: 12,
    width: "100%",
    alignItems: "center",
  },
  secondaryButtonText: {
    color: "#888",
    fontSize: 14,
    fontWeight: "600",
  },
});
