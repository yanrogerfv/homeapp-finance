import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, Alert, ActivityIndicator } from "react-native";
import { useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import * as Haptics from "expo-haptics";
import { apiClient } from "@/lib/apiClient";

export default function HouseSetupScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const [inviteCode, setInviteCode] = useState("");
  const [houseName, setHouseName] = useState("");

  const handleJoinHouse = async () => {
    if (!inviteCode.trim()) {
      Alert.alert("Error", "Please enter an invite code");
      return;
    }

    setLoading(true);
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

      await apiClient.post(`/house/join?inviteCode=${inviteCode}`);

      router.replace("/(tabs)");
    } catch (error: any) {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert("Join Failed", error.response?.data?.message || error.message || "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateHouse = async () => {
    if (!houseName.trim()) {
      Alert.alert("Error", "Please enter a house name");
      return;
    }

    setLoading(true);
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

      await apiClient.post('/house/create', { name: houseName });

      router.replace("/(tabs)");
    } catch (error: any) {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert("Create Failed", error.response?.data?.message || error.message || "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScreenContainer className="bg-background">
      <View className="flex-1 justify-center px-6 gap-12">
        <View className="items-center gap-2">
          <Text className="text-3xl font-bold text-foreground">Welcome to HomeApp</Text>
          <Text className="text-base text-muted text-center">To get started, join an existing house or create a new one.</Text>
        </View>

        <View className="gap-6">
          <View className="p-6 bg-surface rounded-2xl border border-border gap-4">
            <Text className="text-lg font-semibold text-foreground">Join a House</Text>
            <View>
              <TextInput
                placeholder="Enter Invite Code"
                placeholderTextColor="#687076"
                value={inviteCode}
                onChangeText={setInviteCode}
                editable={!loading}
                className="bg-background border border-border rounded-lg px-4 py-3 text-foreground"
              />
            </View>
            <TouchableOpacity
              onPress={handleJoinHouse}
              disabled={loading || !inviteCode}
              style={[{ opacity: loading || !inviteCode ? 0.7 : 1 }]}
              className="bg-primary rounded-lg py-3 items-center"
            >
              {loading ? <ActivityIndicator color="#ffffff" /> : <Text className="text-white font-semibold">Join House</Text>}
            </TouchableOpacity>
          </View>

          <View className="items-center">
            <Text className="text-muted">OR</Text>
          </View>

          <View className="p-6 bg-surface rounded-2xl border border-border gap-4">
            <Text className="text-lg font-semibold text-foreground">Create a New House</Text>
            <View>
              <TextInput
                placeholder="My Awesome House"
                placeholderTextColor="#687076"
                value={houseName}
                onChangeText={setHouseName}
                editable={!loading}
                className="bg-background border border-border rounded-lg px-4 py-3 text-foreground"
              />
            </View>
            <TouchableOpacity
              onPress={handleCreateHouse}
              disabled={loading || !houseName}
              style={[{ opacity: loading || !houseName ? 0.7 : 1 }]}
              className="border-2 border-primary rounded-lg py-3 items-center"
            >
              {loading ? <ActivityIndicator color="#6366f1" /> : <Text className="text-primary font-semibold">Create House</Text>}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </ScreenContainer>
  );
}
