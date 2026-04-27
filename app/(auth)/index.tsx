import { Redirect } from "expo-router";
import { useAuth } from "@/lib/auth-context";
import { View, ActivityIndicator } from "react-native";

export default function AuthIndex() {
  const { state } = useAuth();

  if (state.isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#151718" }}>
        <ActivityIndicator size="large" color="#0a7ea4" />
      </View>
    );
  }

  if (state.user && state.biometricEnabled && state.biometricAvailable) {
    return <Redirect href="./biometric" />;
  } else if (state.user) {
    return <Redirect href="/(tabs)" />;
  } else {
    return <Redirect href="./login" />;
  }
}
