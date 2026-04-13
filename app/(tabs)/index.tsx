import { ScrollView, View, Text, TouchableOpacity, RefreshControl, Image } from "react-native";
import { useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { useFinance } from "@/lib/finance-context";
import { useState, useEffect } from "react";
import * as Haptics from "expo-haptics";
import { MaterialIcons } from "@expo/vector-icons";
import { useThemeContext } from "@/lib/theme-provider";
import { SchemeColors } from "@/constants/theme";
import { fetchHouseBalance, fetchPendingTotal, fetchPaidTotal, fetchUpcomingDueDates } from "@/lib/api";
import { apiClient } from "@/lib/apiClient";
import { useAuth } from "@/lib/auth-context";

export default function DashboardScreen() {
  const router = useRouter();
  const { state: authState } = useAuth();
  const { state: financeState } = useFinance();
  const { colorScheme } = useThemeContext();
  const colors = SchemeColors[colorScheme];

  const [refreshing, setRefreshing] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date());

  // Data state
  const [houseDetails, setHouseDetails] = useState<any>(null);
  const [houseBalance, setHouseBalance] = useState(0);
  const [pendingTotal, setPendingTotal] = useState(0);
  const [paidTotal, setPaidTotal] = useState(0);
  const [upcomingDates, setUpcomingDates] = useState<any[]>([]);

  const loadData = async () => {
    try {
      const [_houseRes, _balance, _pending, _paid, _upcoming] = await Promise.all([
        apiClient.get('/house/my-house'),
        fetchHouseBalance(),
        fetchPendingTotal(),
        fetchPaidTotal(),
        fetchUpcomingDueDates()
      ]);
      setHouseDetails(_houseRes.data);
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
          <View className="flex-row justify-between items-center mb-4">
            <View>
              <Text className="text-muted text-xs font-bold uppercase tracking-widest mb-1">
                {houseDetails ? houseDetails.name : "SUA CASA"}
              </Text>
              <Text className="text-3xl font-extrabold text-foreground">Início</Text>
            </View>
            <TouchableOpacity
              onPress={() => router.push("/settings")}
              className="w-12 h-12 rounded-full items-center justify-center bg-surface border border-border shadow-sm"
              style={{ elevation: 2 }}
            >
              <MaterialIcons name="grid-view" size={24} color={colors.primary} />
            </TouchableOpacity>
          </View>

          {/* Balance Cards */}
          <View className="gap-5">
            {/* Saldo da Casa */}
            <View className="bg-primary rounded-3xl p-6 shadow-md" style={{ elevation: 4 }}>
              <View className="flex-row justify-between items-center mb-6">
                <View className="bg-white bg-opacity-20 px-3 py-1 rounded-full">
                  <Text className="text-white font-bold text-xs">SALDO DA CASA</Text>
                </View>
                <MaterialIcons name="account-balance-wallet" size={24} color="#ffffff" />
              </View>
              <Text className="text-white text-5xl font-black tracking-tighter">
                {formatCurrency(houseBalance)}
              </Text>
            </View>

            {/* Pendente & Pago */}
            <View className="flex-row gap-4">
              <View className="flex-1 bg-surface rounded-3xl p-5 border border-border shadow-sm items-center justify-center relative overflow-hidden">
                <View className="absolute -top-4 -right-4 w-16 h-16 rounded-full bg-warning opacity-10" />
                <View className="w-12 h-12 rounded-full bg-warning bg-opacity-20 items-center justify-center mb-3">
                  <MaterialIcons name="schedule" size={24} color={colors.warning} />
                </View>
                <Text className="text-muted text-[10px] font-bold uppercase tracking-widest mb-1">Total Pendente</Text>
                <Text className="text-foreground text-xl font-black">
                  {formatCurrency(pendingTotal)}
                </Text>
              </View>

              <View className="flex-1 bg-surface rounded-3xl p-5 border border-border shadow-sm items-center justify-center relative overflow-hidden">
                <View className="absolute -bottom-4 -left-4 w-16 h-16 rounded-full bg-success opacity-10" />
                <View className="w-12 h-12 rounded-full bg-success bg-opacity-20 items-center justify-center mb-3">
                  <MaterialIcons name="check-circle" size={24} color={colors.success} />
                </View>
                <Text className="text-muted text-[10px] font-bold uppercase tracking-widest mb-1">Total Pago</Text>
                <Text className="text-foreground text-xl font-black">
                  {formatCurrency(paidTotal)}
                </Text>
              </View>
            </View>
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
                    className="bg-surface rounded-3xl p-5 flex-row items-center border border-border shadow-sm"
                  >
                    <View className="w-[46px] h-[46px] rounded-2xl bg-error bg-opacity-10 items-center justify-center mr-4">
                      <MaterialIcons name="event" size={22} color={colors.error} />
                    </View>
                    <View className="flex-1">
                      <Text className="text-foreground font-bold text-base mb-1" numberOfLines={1}>
                        {item.title}
                      </Text>
                      <Text className="text-muted text-[11px] font-bold uppercase tracking-wider">
                        Vence em: {formatDate(item.date)}
                      </Text>
                    </View>
                    <Text className="font-extrabold text-error text-lg ml-2">
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
