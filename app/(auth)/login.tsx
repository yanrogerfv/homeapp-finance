import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
} from "react-native";
import { useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { useAuth } from "@/lib/auth-context";
import * as Haptics from "expo-haptics";
import { apiClient } from "@/lib/apiClient";

export default function LoginScreen() {
  const router = useRouter();
  const { signIn, state } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert("Error", "Please fill in all fields");
      return;
    }

    setLoading(true);
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      await signIn(email, password);
      
      try {
        await apiClient.get('/house/my-house');
        router.replace("/(tabs)");
      } catch (err: any) {
        if (err.response?.status === 404 || err.response?.status === 401) {
          router.replace("/(auth)/house-setup");
        } else {
          router.replace("/(tabs)");
        }
      }
    } catch (error) {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert("Login Failed", error instanceof Error ? error.message : "Invalid credentials");
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = () => {
    router.push("./signup");
  };

  return (
    <ScreenContainer className="bg-background">
      <ScrollView contentContainerStyle={{ flexGrow: 1 }} className="px-6 py-8">
        <View className="flex-1 justify-center gap-8">
          {/* Header */}
          <View className="items-center gap-2">
            <Text className="text-4xl font-bold text-foreground">Finance</Text>
            <Text className="text-base text-muted">Manage your household finances</Text>
          </View>

          {/* Form */}
          <View className="gap-4">
            <View>
              <Text className="text-sm font-semibold text-foreground mb-2">Email</Text>
              <TextInput
                placeholder="your@email.com"
                placeholderTextColor="#687076"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                editable={!loading}
                className="bg-surface border border-border rounded-lg px-4 py-3 text-foreground"
              />
            </View>

            <View>
              <Text className="text-sm font-semibold text-foreground mb-2">Password</Text>
              <TextInput
                placeholder="••••••••"
                placeholderTextColor="#687076"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                editable={!loading}
                className="bg-surface border border-border rounded-lg px-4 py-3 text-foreground"
              />
            </View>
          </View>

          {/* Login Button */}
          <TouchableOpacity
            onPress={handleLogin}
            disabled={loading}
            style={[{ opacity: loading ? 0.7 : 1 }]}
            className="bg-primary rounded-lg py-4 items-center"
          >
            {loading ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <Text className="text-white font-semibold text-base">Sign In</Text>
            )}
          </TouchableOpacity>

          {/* Sign Up Link */}
          <View className="flex-row justify-center gap-2">
            <Text className="text-muted">Don't have an account?</Text>
            <TouchableOpacity onPress={handleSignUp} disabled={loading}>
              <Text className="text-primary font-semibold">Sign Up</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
