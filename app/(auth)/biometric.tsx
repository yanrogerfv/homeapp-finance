import React, { useEffect, useState } from "react";
import { View, Text, TouchableOpacity, ActivityIndicator, Alert } from "react-native";
import { useRouter, useRootNavigationState } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { useAuth } from "@/lib/auth-context";
import * as Haptics from "expo-haptics";
import { MaterialIcons } from "@expo/vector-icons";

export default function BiometricScreen() {
  const router = useRouter();
  const { signInWithBiometric, state } = useAuth();
  const [loading, setLoading] = useState(false);
  const [attemptingBiometric, setAttemptingBiometric] = useState(true);
  const rootNavigationState = useRootNavigationState();

  useEffect(() => {
    if (!rootNavigationState?.key) return;

    const attemptBiometric = async () => {
      if (!state.biometricAvailable) {
        setAttemptingBiometric(false);
        return;
      }

      try {
        await signInWithBiometric();
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        router.replace("/(tabs)");
      } catch (error) {
        setAttemptingBiometric(false);
      }
    };

    attemptBiometric();
  }, [state.biometricAvailable, rootNavigationState?.key]);

  const handleRetry = async () => {
    setLoading(true);
    try {
      await signInWithBiometric();
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.replace("/(tabs)");
    } catch (error) {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert("Authentication Failed", "Please try again or use password");
    } finally {
      setLoading(false);
    }
  };

  const handleUsePassword = () => {
    router.replace("./login");
  };

  if (attemptingBiometric) {
    return (
      <ScreenContainer className="bg-background">
        <View className="flex-1 justify-center items-center gap-4">
          <ActivityIndicator size="large" color="#0a7ea4" />
          <Text className="text-muted">Authenticating...</Text>
        </View>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer className="bg-background">
      <View className="flex-1 justify-center items-center px-6 gap-8">
        {/* Icon */}
        <View className="w-24 h-24 bg-primary rounded-full items-center justify-center">
          <MaterialIcons name="fingerprint" size={48} color="#ffffff" />
        </View>

        {/* Text */}
        <View className="items-center gap-2">
          <Text className="text-3xl font-bold text-foreground text-center">
            Unlock Your Finances
          </Text>
          <Text className="text-base text-muted text-center">
            Use your biometric to access your account
          </Text>
        </View>

        {/* Retry Button */}
        <TouchableOpacity
          onPress={handleRetry}
          disabled={loading}
          style={[{ opacity: loading ? 0.7 : 1 }]}
          className="w-full bg-primary rounded-lg py-4 items-center"
        >
          {loading ? (
            <ActivityIndicator color="#ffffff" />
          ) : (
            <Text className="text-white font-semibold text-base">Try Again</Text>
          )}
        </TouchableOpacity>

        {/* Use Password Button */}
        <TouchableOpacity
          onPress={handleUsePassword}
          disabled={loading}
          className="w-full bg-surface border border-border rounded-lg py-4 items-center"
        >
          <Text className="text-foreground font-semibold text-base">Use Password</Text>
        </TouchableOpacity>
      </View>
    </ScreenContainer>
  );
}
