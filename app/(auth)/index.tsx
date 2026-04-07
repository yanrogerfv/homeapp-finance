import { Redirect } from "expo-router";
import { useAuth } from "@/lib/auth-context";

export default function AuthIndex() {
  const { state } = useAuth();

  if (state.user && state.biometricEnabled && state.biometricAvailable) {
    return <Redirect href="./biometric" />;
  } else if (state.user) {
    return <Redirect href="/(tabs)" />;
  } else {
    return <Redirect href="./login" />;
  }
}
