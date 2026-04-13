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

export default function SignUpScreen() {
  const router = useRouter();
  const { signUp } = useAuth();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleSignUp = async () => {
    if (!firstName || !lastName || !displayName || !email || !password || !confirmPassword) {
      Alert.alert("Error", "Please fill in all fields");
      return;
    }

    if (!validateEmail(email)) {
      Alert.alert("Error", "Please enter a valid email address");
      return;
    }

    if (password.length < 6) {
      Alert.alert("Error", "Password must be at least 6 characters");
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert("Error", "Passwords do not match");
      return;
    }

    setLoading(true);
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      await signUp(email, password, firstName, lastName, displayName);
      Alert.alert(
        "Cadastro Realizado!",
        "Por favor, verifique seu e-mail para confirmar seu cadastro.",
        [{ text: "OK", onPress: () => router.replace("/(auth)/house-setup") }]
      );
    } catch (error) {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert("Sign Up Failed", error instanceof Error ? error.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = () => {
    router.back();
  };

  return (
    <ScreenContainer className="bg-background">
      <ScrollView contentContainerStyle={{ flexGrow: 1 }} className="px-6 py-8">
        <View className="flex-1 justify-center gap-8">
          {/* Header */}
          <View className="items-center gap-2">
            <Text className="text-4xl font-bold text-foreground">Create Account</Text>
            <Text className="text-base text-muted">Start managing your finances</Text>
          </View>

          {/* Form */}
          <View className="gap-4">
            <View>
              <Text className="text-sm font-semibold text-foreground mb-2">First Name</Text>
              <TextInput
                placeholder="John"
                placeholderTextColor="#687076"
                value={firstName}
                onChangeText={setFirstName}
                editable={!loading}
                className="bg-surface border border-border rounded-lg px-4 py-3 text-foreground"
              />
            </View>

            <View>
              <Text className="text-sm font-semibold text-foreground mb-2">Last Name</Text>
              <TextInput
                placeholder="Doe"
                placeholderTextColor="#687076"
                value={lastName}
                onChangeText={setLastName}
                editable={!loading}
                className="bg-surface border border-border rounded-lg px-4 py-3 text-foreground"
              />
            </View>

            <View>
              <Text className="text-sm font-semibold text-foreground mb-2">Display Name</Text>
              <TextInput
                placeholder="Johnny"
                placeholderTextColor="#687076"
                value={displayName}
                onChangeText={setDisplayName}
                editable={!loading}
                className="bg-surface border border-border rounded-lg px-4 py-3 text-foreground"
              />
            </View>

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
              <Text className="text-xs text-muted mt-1">At least 6 characters</Text>
            </View>

            <View>
              <Text className="text-sm font-semibold text-foreground mb-2">Confirm Password</Text>
              <TextInput
                placeholder="••••••••"
                placeholderTextColor="#687076"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry
                editable={!loading}
                className="bg-surface border border-border rounded-lg px-4 py-3 text-foreground"
              />
            </View>
          </View>

          {/* Sign Up Button */}
          <TouchableOpacity
            onPress={handleSignUp}
            disabled={loading}
            style={[{ opacity: loading ? 0.7 : 1 }]}
            className="bg-primary rounded-lg py-4 items-center"
          >
            {loading ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <Text className="text-white font-semibold text-base">Create Account</Text>
            )}
          </TouchableOpacity>

          {/* Login Link */}
          <View className="flex-row justify-center gap-2">
            <Text className="text-muted">Already have an account?</Text>
            <TouchableOpacity onPress={handleLogin} disabled={loading}>
              <Text className="text-primary font-semibold">Sign In</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
