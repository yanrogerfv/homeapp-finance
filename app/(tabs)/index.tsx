import { ScrollView, View, Text, TouchableOpacity, RefreshControl, Image } from "react-native";
import { useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { useFinance } from "@/lib/finance-context";
import { useState, useEffect } from "react";
import * as Haptics from "expo-haptics";
import { MaterialIcons } from "@expo/vector-icons";
import { useThemeContext } from "@/lib/theme-provider";
import { SchemeColors } from "@/constants/theme";
import { fetchHousemates, fetchHouseBalance, fetchPendingTotal, fetchPaidTotal, fetchUpcomingDueDates } from "@/lib/api";

export default function DashboardScreen() {
  const router = useRouter();
  const { state: financeState } = useFinance();
  const { colorScheme } = useThemeContext();
  const colors = SchemeColors[colorScheme];

  const [refreshing, setRefreshing] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date());

  // Data state
  const [housemates, setHousemates] = useState<any[]>([]);
  const [houseBalance, setHouseBalance] = useState(0);
  const [pendingTotal, setPendingTotal] = useState(0);
  const [paidTotal, setPaidTotal] = useState(0);
  const [upcomingDates, setUpcomingDates] = useState<any[]>([]);

  const loadData = async () => {
    try {
      const [_hm, _balance, _pending, _paid, _upcoming] = await Promise.all([
        fetchHousemates(),
        fetchHouseBalance(),
        fetchPendingTotal(),
        fetchPaidTotal(),
        fetchUpcomingDueDates()
      ]);
      setHousemates(_hm);
      setHouseBalance(_balance.total);
      setPendingTotal(_pending.total);
      setPaidTotal(_paid.total);
      setUpcomingDates(_upcoming);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await loadData();
    setRefreshing(false);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("pt-BR", { month: "short", day: "numeric" });
  };

  return (
    <ScreenContainer className="bg-background">
      <ScrollView
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
        contentContainerStyle={{ flexGrow: 1, paddingBottom: 100 }}
        className="px-4 py-6" scrollEnabled={false}
      >
        <View className="gap-6">
          {/* Header */}
          <View className="flex-row justify-between items-center mb-2">
            <View>
              <Text className="text-3xl font-bold text-foreground">Início</Text>
              <Text className="text-sm font-medium text-muted">Acompanhe as finanças da sua casa</Text>
            </View>
            <TouchableOpacity
              onPress={() => router.push("/settings")}
              className="w-12 h-12 bg-surface rounded-full items-center justify-center shadow-sm"
              style={{ elevation: 2, shadowColor: "#000", shadowOpacity: 0.1, shadowRadius: 5 }}
            >
              <MaterialIcons name="person" size={24} color={colors.primary} />
            </TouchableOpacity>
          </View>

          {/* Balance Cards */}
          <View className="gap-4">
            {/* Saldo da Casa */}
            <View
              style={{ backgroundColor: colors.primary, borderRadius: 24, overflow: 'hidden', padding: 24, elevation: 6, shadowColor: colors.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 10 }}
            >
              <View className="flex-row justify-between items-center mb-4">
                <Text className="text-white opacity-90 font-medium text-base">Saldo da Casa</Text>
                <MaterialIcons name="account-balance-wallet" size={24} color="#ffffff" />
              </View>
              <Text className="text-white text-4xl font-extrabold tracking-tight">
                {formatCurrency(houseBalance)}
              </Text>
            </View>

            {/* Pendente & Pago */}
            <View className="flex-row gap-4">
              <View className="flex-1 bg-surface rounded-2xl p-5 border border-border shadow-sm">
                <View className="w-10 h-10 rounded-full bg-warning bg-opacity-20 items-center justify-center mb-3">
                  <MaterialIcons name="schedule" size={20} color={colors.warning} />
                </View>
                <Text className="text-muted text-xs font-semibold uppercase tracking-wider mb-1">Total Pendente</Text>
                <Text className="text-foreground text-xl font-bold">
                  {formatCurrency(pendingTotal)}
                </Text>
              </View>

              <View className="flex-1 bg-surface rounded-2xl p-5 border border-border shadow-sm">
                <View className="w-10 h-10 rounded-full bg-success bg-opacity-20 items-center justify-center mb-3">
                  <MaterialIcons name="check-circle-outline" size={20} color={colors.success} />
                </View>
                <Text className="text-muted text-xs font-semibold uppercase tracking-wider mb-1">Total Pago (Mês)</Text>
                <Text className="text-foreground text-xl font-bold">
                  {formatCurrency(paidTotal)}
                </Text>
              </View>
            </View>
          </View>

          {/* Moradores */}
          <View className="mt-2">
            <Text className="text-lg font-bold text-foreground mb-3">Moradores</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} className="gap-4">
              {housemates.map((person) => (
                <View key={person.id} className="items-center mr-4">
                  <Image source={{ uri: person.avatar }} className="w-16 h-16 rounded-full border-2 border-surface mb-2 shadow-sm" />
                  <Text className="text-foreground font-semibold text-sm">{person.name}</Text>
                </View>
              ))}
              {/* Add New Housemate Button */}
              <TouchableOpacity className="items-center">
                <View className="w-16 h-16 rounded-full bg-surface border-2 border-dashed border-muted items-center justify-center mb-2">
                  <MaterialIcons name="add" size={24} color={colors.muted} />
                </View>
                <Text className="text-muted font-semibold text-sm">Adicionar</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>

          {/* Próximos Vencimentos */}
          <View className="mt-2">
            <View className="flex-row justify-between items-center mb-4">
              <Text className="text-lg font-bold text-foreground">Próximos Vencimentos</Text>
              <TouchableOpacity onPress={() => router.push("/transactions")}>
                <Text className="text-primary font-bold text-sm">Ver Tudo</Text>
              </TouchableOpacity>
            </View>

            {upcomingDates.length > 0 ? (
              <View className="gap-3">
                {upcomingDates.map((item) => (
                  <View
                    key={item.id}
                    className="bg-surface rounded-2xl p-4 flex-row items-center border border-border shadow-sm"
                  >
                    <View className="w-12 h-12 rounded-xl bg-error bg-opacity-10 items-center justify-center mr-4">
                      <MaterialIcons name="event" size={24} color={colors.error} />
                    </View>
                    <View className="flex-1">
                      <Text className="text-foreground font-bold text-base mb-1">
                        {item.title}
                      </Text>
                      <Text className="text-muted text-sm font-medium">
                        Vence em: {formatDate(item.date)}
                      </Text>
                    </View>
                    <Text className="font-bold text-error text-lg">
                      {formatCurrency(item.amount)}
                    </Text>
                  </View>
                ))}
              </View>
            ) : (
              <View className="bg-surface rounded-2xl p-8 items-center border border-border shadow-sm">
                <MaterialIcons name="check-circle" size={40} color={colors.success} />
                <Text className="text-muted text-base font-medium mt-3">Nenhuma despesa próxima</Text>
              </View>
            )}
          </View>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
