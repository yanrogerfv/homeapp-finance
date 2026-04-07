import { ScrollView, View, Text, TouchableOpacity, Alert, Switch, Image } from "react-native";
import { useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { useAuth } from "@/lib/auth-context";
import { useState, useEffect } from "react";
import { MaterialIcons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useThemeContext } from "@/lib/theme-provider";
import { SchemeColors } from "@/constants/theme";
import { fetchHousemates, leaveHouse } from "@/lib/api";

export default function SettingsScreen() {
  const router = useRouter();
  const { state: authState, signOut, enableBiometric, disableBiometric } = useAuth();
  const { colorScheme, setColorScheme } = useThemeContext();
  const colors = SchemeColors[colorScheme];

  const [biometricEnabled, setBiometricEnabled] = useState(
    authState.user?.biometricEnabled || false
  );
  const [housemates, setHousemates] = useState<any[]>([]);

  useEffect(() => {
    fetchHousemates().then(setHousemates).catch(console.error);
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

    Alert.prompt(
      biometricEnabled ? "Desativar Biometria" : "Ativar Biometria",
      "Confirme sua senha para continuar",
      [
        { text: "Cancelar", onPress: () => { } },
        {
          text: "Confirmar",
          onPress: async (password: string | undefined) => {
            if (!password) {
              Alert.alert("Erro", "Senha obrigatória");
              return;
            }

            try {
              await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              if (biometricEnabled) {
                await disableBiometric(password);
                setBiometricEnabled(false);
                Alert.alert("Sucesso", "Autenticação biométrica desativada");
              } else {
                await enableBiometric(password);
                setBiometricEnabled(true);
                Alert.alert("Sucesso", "Autenticação biométrica ativada");
              }
            } catch (error) {
              await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
              Alert.alert("Erro", error instanceof Error ? error.message : "Falha ao atualizar");
            }
          },
        },
      ],
      "secure-text"
    );
  };

  const handleLeaveHouse = () => {
    Alert.alert(
      "Sair da Casa",
      "ATENÇÃO: Você perderá o acesso às finanças desta casa. Deseja mesmo sair?",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Sair",
          style: "destructive",
          onPress: async () => {
            try {
              await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
              // In a real app we pass the house ID and user ID
              await leaveHouse("current_house", authState.user?.email || "");
              Alert.alert("Sucesso", "Você saiu da casa. Redirecionando...");
              // Typically logic to clean context and go back to a 'Choose House' screen goes here
            } catch (error) {
              Alert.alert("Erro", "Não foi possível sair no momento.");
            }
          },
        },
      ]
    );
  };

  const handleLogout = () => {
    Alert.alert("Terminar Sessão", "Tem certeza que deseja sair da sua conta?", [
      { text: "Cancelar", onPress: () => { } },
      {
        text: "Sair",
        style: "destructive",
        onPress: async () => {
          try {
            await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            await signOut();
            const authPath: any = "/(auth)";
            router.replace(authPath);
          } catch (error) {
            Alert.alert("Erro", "Falha ao terminar sessão");
          }
        },
      },
    ]);
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
        <View className="w-10 h-10 rounded-xl bg-primary bg-opacity-10 items-center justify-center">
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
              subtitle="2.0.0"
              rightElement={<Text className="text-muted font-bold">Mais sobre</Text>}
            />
          </View>

          {/* House Settings Section */}
          <View className="border border-border rounded-2xl">
            <Text className=" font-bold text-lg p-4 border-b border-border">Participantes da Casa</Text>

            <View className="p-6">
              <Text className="text-sm text-gray-500 mb-4">Membros da Casa ({housemates.length})</Text>
              {housemates.map((member) => (

                <View key={member.id} className="flex-row items-center gap-3 mb-3 px-1">
                  <Image source={{ uri: member.avatar }} className="w-10 h-10 rounded-full border border-border" />
                  <View>
                    <Text className="font-medium text-text">{member.name} {member.id === authState.user?.id && '(Você)'}</Text>
                    <Text className="text-xs text-text">{member.email}</Text>
                  </View>
                  {/* {member.id !== user?.id && (
                    <button 
                      onClick={() => handleRemoveMember(member.id, member.name)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="Remover morador"
                    >
                      <UserMinus size={20} />
                    </button>
                  )} */}
                </View>

                // <View key={person.id} className="flex-row items-center gap-3 mb-3 px-1">
                //   <Image source={{ uri: person.avatar }} className="w-10 h-10 rounded-full border border-border" />
                //   <Text className="text-foreground font-semibold text-sm flex-1">{person.name}</Text>
                // </View>
              ))}
            </View>
          </View>

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
    </ScreenContainer>
  );
}
