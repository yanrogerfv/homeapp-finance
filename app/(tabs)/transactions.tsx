import { ScrollView, View, Text, TouchableOpacity, TextInput, FlatList, Modal, ActivityIndicator } from "react-native";
import { useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { useFinance } from "@/lib/finance-context";
import { useAuth } from "@/lib/auth-context";
import { useState } from "react";
import { MaterialIcons } from "@expo/vector-icons";
import { useThemeContext } from "@/lib/theme-provider";
import { SchemeColors } from "@/constants/theme";

export default function TransactionsScreen() {
  const router = useRouter();
  const { state: financeState, getTransactions } = useFinance();
  const { state: authState } = useAuth();
  const { colorScheme } = useThemeContext();
  const colors = SchemeColors[colorScheme];

  const [searchText, setSearchText] = useState("");
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);

  // Filter states
  const [selectedStatus, setSelectedStatus] = useState<"all" | "pending" | "paid">("all");
  const [selectedMonth, setSelectedMonth] = useState<number | undefined>();
  const [selectedYear, setSelectedYear] = useState<number | undefined>();

  const applyFilters = async () => {
    setIsFilterModalOpen(false);
    // Fetch from backend the selected month/year, the local status filter applies automatically.
    await getTransactions(selectedMonth, selectedYear);
  };

  const clearFilters = async () => {
    setSelectedStatus("all");
    setSelectedMonth(undefined);
    setSelectedYear(undefined);
    setIsFilterModalOpen(false);
    await getTransactions();
  };

  const getTransactionStatus = (t: any) => {
    if (t.status?.toUpperCase() === "PAID") return "PAID";
    const mySplit = t.splits?.find((s: any) => s.userId === authState.user?.id);
    if (mySplit) return mySplit.status?.toUpperCase() || "PENDING";
    return t.status?.toUpperCase() || "PENDING";
  };

  const filteredTransactions = financeState.transactions.filter((t) => {
    const tStatus = getTransactionStatus(t);
    let matchesType = true;
    if (selectedStatus === "pending") matchesType = tStatus === "PENDING";
    if (selectedStatus === "paid") matchesType = tStatus === "PAID";

    const matchesSearch =
      t.description.toLowerCase().includes(searchText.toLowerCase()) ||
      t.category.toLowerCase().includes(searchText.toLowerCase()) ||
      t.title.toLowerCase().includes(searchText.toLowerCase());

    return matchesType && matchesSearch && t.type === "expense";
  });

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return "";
    return new Date(dateString).toLocaleDateString("pt-BR", { month: "short", day: "numeric", year: "numeric" });
  };

  const renderTransaction = ({ item }: { item: any }) => {
    const status = getTransactionStatus(item);
    return (
      <TouchableOpacity
        onPress={() => router.push(`/transaction/${item.id}`)}
        className="bg-surface rounded-2xl p-4 flex-row justify-between items-center mb-3 shadow-sm border border-border"
      >
        <View className="flex-row items-center gap-4 flex-1">
          <View className="w-12 h-12 rounded-xl items-center justify-center">
            <MaterialIcons name={status === "PENDING" ? "schedule" : "check"} size={24} color={status === "PENDING" ? colors.warning : colors.success} />
          </View>
          <View className="flex-1 pr-2">
            <Text className="font-semibold text-foreground" numberOfLines={1}>{item.title}</Text>
            <Text className="text-foreground font-bold text-base mb-1" numberOfLines={1}>{item.description}</Text>
            <Text className="text-muted text-[11px] font-medium" numberOfLines={1}>{item.category} • Vence: {formatDate(item.dueDate || item.date)}</Text>
          </View>
        </View>
        <View className="items-end pl-1">
          <Text className="font-bold text-base text-foreground">{formatCurrency(item.amount)}</Text>
          <Text className={`text-[10px] uppercase tracking-widest font-bold mt-1 ${status === 'PENDING' ? 'text-warning' : 'text-success'}`}>
            {status === 'PENDING' ? 'Pendente' : 'Pago'}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <ScreenContainer className="bg-background">
      <View className="flex-1 px-4 py-6" style={{ paddingBottom: 100 }}>
        <View className="mb-6">
          <Text className="text-3xl font-bold text-foreground mb-1">Despesas</Text>
          <Text className="text-sm font-medium text-muted mb-4">Gerencie os gastos da casa</Text>

          <View className="flex-row items-center gap-2 mb-2">
            <View className="flex-1 flex-row items-center bg-surface border border-border rounded-xl px-4 py-3 shadow-sm">
              <MaterialIcons name="search" size={24} color={colors.muted} />
              <TextInput
                placeholder="Buscar despesa..."
                placeholderTextColor={colors.muted}
                value={searchText}
                onChangeText={setSearchText}
                className="flex-1 ml-3 text-foreground text-base"
              />
            </View>
            <TouchableOpacity
              onPress={() => setIsFilterModalOpen(true)}
              className="w-[52px] h-[52px] bg-surface border border-border rounded-xl items-center justify-center shadow-sm"
            >
              <MaterialIcons name="filter-list" size={24} color={colors.primary} />
            </TouchableOpacity>
          </View>
        </View>

        {financeState.isLoading ? (
          <View className="flex-1 items-center justify-center">
            <ActivityIndicator size="large" color={colors.primary} />
            <Text className="text-muted mt-4 font-bold uppercase tracking-widest text-xs">Carregando transações...</Text>
          </View>
        ) : filteredTransactions.length > 0 ? (
          <FlatList
            data={filteredTransactions}
            renderItem={renderTransaction}
            keyExtractor={(item) => item.id}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 20 }}
          />
        ) : (
          <View className="flex-1 items-center justify-center">
            <MaterialIcons name="receipt-long" size={64} color={colors.muted} style={{ opacity: 0.5 }} />
            <Text className="text-foreground text-lg font-bold mt-4">Nenhuma despesa</Text>
            <Text className="text-muted text-sm text-center mt-2 px-6">Modifique os filtros ou crie uma nova despesa para a casa.</Text>
          </View>
        )}
      </View>

      {/* Filter Sidebar (Modal) */}
      <Modal visible={isFilterModalOpen} animationType="fade" transparent onRequestClose={() => setIsFilterModalOpen(false)}>
        <View className="flex-1 flex-row">
          <TouchableOpacity
            className="flex-1 bg-black"
            style={{ opacity: 0.5 }}
            activeOpacity={0.5}
            onPress={() => setIsFilterModalOpen(false)}
          />
          <View className="w-4/5 bg-background h-full p-6 shadow-xl border-l border-border">
            <View className="flex-row justify-between items-center mb-8 mt-8">
              <Text className="text-2xl font-bold text-foreground">Filtros</Text>
              <TouchableOpacity onPress={() => setIsFilterModalOpen(false)}>
                <MaterialIcons name="close" size={24} color={colors.foreground} />
              </TouchableOpacity>
            </View>

            <Text className="text-sm font-bold text-foreground mb-3">Status</Text>
            <View className="flex-row flex-wrap gap-2 mb-6">
              {(["all", "pending", "paid"] as const).map((type) => {
                const labels = { all: "Todas", pending: "Pendentes", paid: "Pagas" };
                const isActive = selectedStatus === type;
                return (
                  <TouchableOpacity
                    key={type}
                    onPress={() => setSelectedStatus(type)}
                    style={{ backgroundColor: isActive ? colors.primary : 'transparent' }}
                    className={`px-4 py-2.5 rounded-lg border items-center justify-center ${isActive ? "border-primary" : "border-border"}`}
                  >
                    <Text className={`font-bold text-xs ${isActive ? "text-white" : "text-foreground"}`}>
                      {labels[type]}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <Text className="text-sm font-bold text-foreground mb-3">Mês</Text>
            <View className="flex-row flex-wrap gap-2 mb-6">
              {Array.from({ length: 12 }).map((_, i) => {
                const m = i + 1;
                const isSelected = selectedMonth === m;
                return (
                  <TouchableOpacity
                    key={m}
                    onPress={() => setSelectedMonth(m)}
                    style={{ backgroundColor: isSelected ? colors.primary : 'transparent' }}
                    className={`w-[30%] py-3 rounded-lg border items-center justify-center ${isSelected ? "border-primary" : "border-border"}`}
                  >
                    <Text className={`font-bold text-xs ${isSelected ? "text-white" : "text-foreground"}`}>
                      {new Date(2000, i).toLocaleString('pt-BR', { month: 'short' }).toUpperCase()}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <Text className="text-sm font-bold text-foreground mb-3">Ano</Text>
            <View className="flex-row flex-wrap gap-2 mb-8">
              {[2024, 2025, 2026, 2027].map((y) => {
                const isSelected = selectedYear === y;
                return (
                  <TouchableOpacity
                    key={y}
                    onPress={() => setSelectedYear(y)}
                    style={{ backgroundColor: isSelected ? colors.primary : 'transparent' }}
                    className={`px-4 py-3 rounded-lg border items-center justify-center ${isSelected ? "border-primary" : "border-border"}`}
                  >
                    <Text className={`font-bold text-xs ${isSelected ? "text-white" : "text-foreground"}`}>
                      {y}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <View className="flex-1 justify-end pb-8 gap-3">
              <TouchableOpacity
                onPress={clearFilters}
                className="bg-surface border border-border py-4 rounded-xl items-center"
              >
                <Text className="text-foreground font-bold text-base uppercase tracking-widest">Limpar Tudo</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={applyFilters}
                className="bg-primary py-4 rounded-xl items-center shadow-md"
              >
                <Text className="text-white font-bold text-base uppercase tracking-widest">Aplicar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ScreenContainer>
  );
}
