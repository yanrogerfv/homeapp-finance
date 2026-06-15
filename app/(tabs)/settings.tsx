import { ScrollView, View, Text, TouchableOpacity, Alert, Switch, Image, Platform, Modal, TextInput } from "react-native";
import { useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { useAuth } from "@/lib/auth-context";
import { useState, useEffect } from "react";
import { MaterialIcons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useThemeContext } from "@/lib/theme-provider";
import { SchemeColors } from "@/constants/theme";
import { leaveHouse, removeHouseMember, updateHouseBalance } from "@/lib/api";
import { apiClient } from "@/lib/apiClient";
import * as LocalAuthentication from "expo-local-authentication";

export default function SettingsScreen() {
  const router = useRouter();
  const { state: authState, signOut, enableBiometric, disableBiometric } = useAuth();
  const { colorScheme, setColorScheme } = useThemeContext();
  const colors = SchemeColors[colorScheme];

  const [biometricEnabled, setBiometricEnabled] = useState(
    authState.user?.biometricEnabled || false
  );
  const [houseDetails, setHouseDetails] = useState<any>(null);
  const [balanceModalVisible, setBalanceModalVisible] = useState(false);
  const [balanceInput, setBalanceInput] = useState("");

  const fetchHouse = async () => {
    try {
      const res = await apiClient.get('/house/my-house');
      setHouseDetails(res.data);
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    fetchHouse();
  }, []);

  const handleToggleTheme = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setColorScheme(colorScheme === "light" ? "dark" : "light");
  };

  const handleToggleBiometric = async () => {
    if (!biometricEnabled && !authState.biometricAvailable) {
      Alert.alert("Erro", "Autenticação biométrica não disponível neste dispositivo");
      return;
    }

    try {
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: biometricEnabled ? "Confirme para desativar" : "Confirme para ativar",
        cancelLabel: "Cancelar",
        disableDeviceFallback: false,
      });

      if (result.success) {
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        if (biometricEnabled) {
          await disableBiometric();
          setBiometricEnabled(false);
          Alert.alert("Sucesso", "Autenticação biométrica desativada");
        } else {
          await enableBiometric();
          setBiometricEnabled(true);
          Alert.alert("Sucesso", "Autenticação biométrica ativada");
        }
      }
    } catch (error: any) {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert("Erro", error.message || "Falha na autenticação");
    }
  };

  const handleLeaveHouse = () => {
    const executeLeave = async () => {
      try {
        if (Platform.OS !== 'web') {
          await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
        }
        await leaveHouse();
        
        if (Platform.OS === 'web') {
          window.alert("Você saiu da casa.");
          router.replace("/(auth)/house-setup");
        } else {
          Alert.alert("Sucesso", "Você saiu da casa.", [
            {
              text: "OK",
              onPress: () => {
                router.replace("/(auth)/house-setup");
              }
            }
          ]);
        }
      } catch (error) {
        if (Platform.OS === 'web') {
          window.alert("Não foi possível sair no momento.");
        } else {
          Alert.alert("Erro", "Não foi possível sair no momento.");
        }
      }
    };

    if (Platform.OS === 'web') {
      const confirmed = window.confirm("ATENÇÃO: Você perderá o acesso às finanças desta casa. Deseja mesmo sair?");
      if (confirmed) {
        executeLeave();
      }
    } else {
      Alert.alert(
        "Sair da Casa",
        "ATENÇÃO: Você perderá o acesso às finanças desta casa. Deseja mesmo sair?",
        [
          { text: "Cancelar", style: "cancel" },
          {
            text: "Sair",
            style: "destructive",
            onPress: executeLeave,
          },
        ]
      );
    }
  };

  const handleLogout = () => {
    const executeLogout = async () => {
      try {
        if (Platform.OS !== 'web') {
          await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        }
        await signOut();
        const authPath: any = "/(auth)";
        router.replace(authPath);
      } catch (error) {
        if (Platform.OS === 'web') {
          window.alert("Falha ao terminar sessão");
        } else {
          Alert.alert("Erro", "Falha ao terminar sessão");
        }
      }
    };

    if (Platform.OS === 'web') {
      const confirmed = window.confirm("Tem certeza que deseja sair da sua conta?");
      if (confirmed) {
        executeLogout();
      }
    } else {
      Alert.alert("Terminar Sessão", "Tem certeza que deseja sair da sua conta?", [
        { text: "Cancelar", onPress: () => { } },
        {
          text: "Sair",
          style: "destructive",
          onPress: executeLogout,
        },
      ]);
    }
  };

  const executeBalanceUpdate = async (rawValue: string) => {
    const parsed = parseFloat(rawValue.replace(",", "."));
    if (isNaN(parsed) || parsed === 0) {
      Alert.alert("Erro", "Informe um valor válido diferente de zero.");
      return;
    }
    try {
      if (Platform.OS !== "web") {
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
      const valueToAdd = parsed > 0 ? parsed : 0;
      const valueToSubtract = parsed < 0 ? Math.abs(parsed) : 0;
      await updateHouseBalance(valueToAdd, valueToSubtract);
      await fetchHouse();
      if (Platform.OS === "web") {
        window.alert("Saldo da casa atualizado com sucesso.");
      } else {
        Alert.alert("Sucesso", "Saldo da casa atualizado com sucesso.");
      }
    } catch (error: any) {
      if (Platform.OS !== "web") {
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }
      if (Platform.OS === "web") {
        window.alert("Não foi possível atualizar o saldo.");
      } else {
        Alert.alert("Erro", error?.response?.data?.message || "Não foi possível atualizar o saldo.");
      }
    }
  };

  const handleAdjustBalance = () => {
    if (Platform.OS === "ios") {
      Alert.prompt(
        "Ajustar Saldo",
        "Insira o valor a adicionar (positivo) ou subtrair (negativo) do saldo da casa.",
        [
          { text: "Cancelar", style: "cancel" },
          {
            text: "Confirmar",
            onPress: (value) => {
              if (value !== undefined) {
                executeBalanceUpdate(value);
              }
            },
          },
        ],
        "plain-text",
        "",
        "numeric"
      );
    } else if (Platform.OS === "web") {
      const value = window.prompt("Insira o valor a adicionar (positivo) ou subtrair (negativo) do saldo da casa:");
      if (value !== null && value.trim() !== "") {
        executeBalanceUpdate(value);
      }
    } else {
      setBalanceInput("");
      setBalanceModalVisible(true);
    }
  };

  const SettingRow = ({
    icon,
    title,
    subtitle,
    onPress,
    rightElement,
  }: {
    icon: string;
    title: string;
    subtitle?: string;
    onPress?: () => void;
    rightElement?: React.ReactNode;
  }) => (
    <TouchableOpacity
      onPress={onPress}
      disabled={!onPress}
      className={`flex-row items-center justify-between p-4 mb-3 rounded-2xl bg-surface border border-border`}
    >
      <View className="flex-row items-center gap-4 flex-1">
        <View className="w-10 h-10 rounded-xl items-center justify-center">
          <MaterialIcons name={icon as any} size={22} color={colors.primary} />
        </View>
        <View className="flex-1">
          <Text className="text-foreground font-bold text-base">{title}</Text>
          {subtitle && <Text className="text-muted text-xs font-medium mt-0.5">{subtitle}</Text>}
        </View>
      </View>
      {rightElement}
    </TouchableOpacity>
  );

  const isOwner = houseDetails?.owner?.id === authState.user?.id;
  const members = houseDetails?.members || [];
  const hasOtherMembers = members.length > 1;

  return (
    <ScreenContainer className="bg-background">
      <ScrollView contentContainerStyle={{ flexGrow: 1, paddingBottom: 100 }} className="px-4 py-6">
        <View className="gap-6">

          {/* Header */}
          <View className="mb-2">
            <Text className="text-3xl font-bold text-foreground mb-1">Ajustes</Text>
            <Text className="text-sm font-medium text-muted">Gerencie sua conta e as opções da casa</Text>
          </View>

          {/* Profile Card */}
          <View className="bg-surface rounded-3xl p-5 flex-row items-center gap-4 shadow-sm border border-border">
            <View className="w-16 h-16 bg-primary rounded-full items-center justify-center border-4 border-background shadow-sm">
              <Text className="text-white font-extrabold text-2xl uppercase">
                {authState.user?.email?.[0] || "U"}
              </Text>
            </View>
            <View className="flex-1">
              <Text className="text-foreground font-bold text-lg leading-tight">
                {authState.user?.email || "Usuário"}
              </Text>
              <View className="bg-success px-2 py-1 rounded-md self-start mt-1">
                <Text className="text-white text-xs font-bold uppercase tracking-wider">Conta Ativa</Text>
              </View>
            </View>
          </View>

          {/* App Settings Section */}
          <View>
            <Text className="text-muted font-bold text-xs uppercase tracking-widest mb-3 ml-2">App & Segurança</Text>

            <SettingRow
              icon="dark-mode"
              title="Modo Noturno"
              subtitle={colorScheme === "dark" ? "Ativado" : "Desativado"}
              rightElement={
                <Switch
                  value={colorScheme === "dark"}
                  onValueChange={handleToggleTheme}
                  trackColor={{ false: colors.border, true: colors.primary }}
                  thumbColor="#ffffff"
                />
              }
            />

            <SettingRow
              icon="fingerprint"
              title="Biometria"
              subtitle={biometricEnabled ? "Usar Face ID ou Digital" : "Entrar com senha"}
              onPress={handleToggleBiometric}
              rightElement={
                <Switch
                  value={biometricEnabled}
                  onValueChange={handleToggleBiometric}
                  disabled={!authState.biometricAvailable}
                  trackColor={{ false: colors.border, true: colors.primary }}
                  thumbColor="#ffffff"
                />
              }
            />

            <SettingRow
              icon="info-outline"
              title="Versão do App"
              subtitle="0.1.0"
              rightElement={<Text className="text-muted font-bold">Mais sobre</Text>}
            />
          </View>

          {/* House Settings Section */}
          {houseDetails && (
            <View className="border border-border rounded-2xl overflow-hidden">
              <View className="p-4 border-b border-border bg-surface flex-row justify-between items-center">
                <Text className="font-bold text-lg text-foreground">Minha Casa</Text>
              </View>

              <View className="p-5">
                <Text className="text-foreground font-bold text-base mb-1">{houseDetails.name}</Text>

                {isOwner && (
                  <View className="mt-3 bg-primary bg-opacity-10 border border-primary p-4 rounded-xl items-center">
                    <Text className="text-muted text-xs font-bold uppercase tracking-widest mb-1">Código de Convite</Text>
                    <Text className="text-primary font-extrabold text-2xl tracking-widest">{houseDetails.code}</Text>
                    <Text className="text-muted text-xs mt-2 text-center">Compartilhe este código para convidar outros moradores!</Text>
                  </View>
                )}

                {isOwner && (
                  <SettingRow
                    icon="account-balance-wallet"
                    title="Ajustar Saldo da Casa"
                    subtitle="Adicionar ou subtrair do saldo atual"
                    onPress={handleAdjustBalance}
                    rightElement={<MaterialIcons name="chevron-right" size={22} color={colors.muted} />}
                  />
                )}

                <View className="mt-6">
                  <Text className="text-sm text-foreground font-bold mb-4 uppercase tracking-widest">
                    Membros da Casa ({members.length})
                  </Text>
                  {members.map((member: any) => (
                    <View key={member.id} className="flex-row items-center gap-3 mb-3 p-3 bg-surface border border-border rounded-xl">
                      <View className="w-10 h-10 rounded-2xl border border-gray-600 items-center justify-center">
                        <Text className="text-primary font-bold text-lg">{member.name ? member.name[0] : member.displayName ? member.displayName[0] : 'U'}</Text>
                      </View>
                      <View className="flex-1">
                        <Text className="font-bold text-foreground">
                          {member.name || member.displayName} {member.id === authState.user?.id && '(Você)'}
                        </Text>
                        {member.id === houseDetails.owner?.id && (
                          <Text className="text-xs text-primary font-bold">Proprietário(a)</Text>
                        )}
                      </View>
                      {isOwner && member.id !== authState.user?.id && (
                        <TouchableOpacity
                          onPress={async () => {
                            Alert.alert(
                              "Remover Morador",
                              "Tem certeza que deseja remover este morador da casa?",
                              [
                                { text: "Cancelar", style: "cancel" },
                                {
                                  text: "Remover",
                                  style: "destructive",
                                  onPress: async () => {
                                    try {
                                      await removeHouseMember(member.id);
                                      fetchHouse();
                                      Alert.alert("Sucesso", "Morador removido.");
                                    } catch (e) {
                                      Alert.alert("Erro", "Não foi possível remover.");
                                    }
                                  }
                                }
                              ]
                            );
                          }}
                          className="p-2"
                        >
                          <MaterialIcons name="person-remove" size={22} color={colors.error} />
                        </TouchableOpacity>
                      )}
                    </View>
                  ))}
                </View>
              </View>
            </View>
          )}

          <TouchableOpacity
            onPress={handleLeaveHouse}
            className="bg-error rounded-2xl p-4 flex-row items-center justify-between mt-2"
          >
            <Text className="font-bold text-base ml-2 text-white">Sair desta casa</Text>
            <MaterialIcons name="exit-to-app" size={24} color="#ffffff" />
          </TouchableOpacity>

          {/* Danger Zone */}
          <View className="mt-2 text-center items-center">
            <TouchableOpacity onPress={handleLogout} className="py-4 px-8 items-center">
              <Text className="text-muted font-bold text-sm uppercase underline tracking-widest">Terminar Sessão (Logout)</Text>
            </TouchableOpacity>
          </View>

        </View>
      </ScrollView>
      <Modal
        visible={balanceModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setBalanceModalVisible(false)}
      >
        <View className="flex-1 bg-black/60 justify-center px-6">
          <View className="bg-surface border border-border rounded-2xl p-6">
            <Text className="text-foreground font-bold text-lg mb-1">Ajustar Saldo da Casa</Text>
            <Text className="text-muted text-sm mb-4">Insira o valor a adicionar (positivo) ou subtrair (negativo) do saldo da casa.</Text>
            <TextInput
              value={balanceInput}
              onChangeText={setBalanceInput}
              keyboardType="numeric"
              placeholder="Ex: 100 ou -50"
              placeholderTextColor={colors.muted}
              className="bg-background border border-border rounded-xl px-4 py-3 text-foreground text-base mb-5"
              autoFocus
            />
            <View className="flex-row gap-3">
              <TouchableOpacity
                onPress={() => setBalanceModalVisible(false)}
                className="flex-1 border border-border rounded-xl py-3 items-center"
              >
                <Text className="text-foreground font-bold">Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => {
                  setBalanceModalVisible(false);
                  executeBalanceUpdate(balanceInput);
                }}
                className="flex-1 bg-primary rounded-xl py-3 items-center"
              >
                <Text className="text-white font-bold">Confirmar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ScreenContainer>
  );
}
