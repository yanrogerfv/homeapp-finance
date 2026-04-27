import { ScrollView, View, Text, TouchableOpacity, TextInput, FlatList } from "react-native";
import { useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { useFinance } from "@/lib/finance-context";
import { useState } from "react";
import { MaterialIcons } from "@expo/vector-icons";
import { useThemeContext } from "@/lib/theme-provider";
import { SchemeColors } from "@/constants/theme";

export default function TransactionsScreen() {
  const router = useRouter();
  const { state: financeState } = useFinance();
  const { colorScheme } = useThemeContext();
  const colors = SchemeColors[colorScheme];

  const [filterType, setFilterType] = useState<"all" | "pending" | "paid">("all");
  const [searchText, setSearchText] = useState("");

  const filteredTransactions = financeState.transactions.filter((t) => {
    const tStatus = (t as any).status || "PAID";
    let matchesType = true;
    if (filterType === "pending") matchesType = tStatus === "PENDING";
    if (filterType === "paid") matchesType = tStatus === "PAID";

    const matchesSearch =
      t.description.toLowerCase().includes(searchText.toLowerCase()) ||
      t.category.toLowerCase().includes(searchText.toLowerCase());

    return matchesType && matchesSearch && t.type === "expense";
  });

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("pt-BR", { month: "short", day: "numeric", year: "numeric" });
  };

  const renderTransaction = ({ item }: { item: any }) => (
    <TouchableOpacity
      onPress={() => router.push(`/transaction/${item.id}`)}
      className="bg-surface rounded-2xl p-4 flex-row justify-between items-center mb-3 shadow-sm border border-border"
    >
      <View className="flex-row items-center gap-4 flex-1">
        <View className={`w-12 h-12 rounded-xl items-center justify-center`}>
          <MaterialIcons name={item.status === "PENDING" ? "schedule" : "check"} size={24} color={item.status === "PENDING" ? colors.warning : colors.success} />
        </View>
        <View>
          <Text className="font-semibold">{item.title}</Text>
          <View className="flex-1">
            <Text className="text-foreground font-bold text-base mb-1">{item.description}</Text>
            <Text className="text-muted text-xs font-medium">{item.category} • Vence: {formatDate(item.dueDate || item.date)}</Text>
          </View>
        </View>
      </View>
      <View className="items-end">
        <Text className="font-bold text-base text-foreground">{formatCurrency(item.amount)}</Text>
        <Text className={`text-xs font-bold mt-1 ${item.status === 'PENDING' ? 'text-warning' : 'text-success'}`}>
          {item.status === 'PENDING' ? 'Pendente' : 'Pago'}
        </Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <ScreenContainer className="bg-background">
      <View className="flex-1 px-4 py-6" style={{ paddingBottom: 100 }}>
        <View className="mb-6">
          <Text className="text-3xl font-bold text-foreground mb-1">Despesas</Text>
          <Text className="text-sm font-medium text-muted mb-4">Gerencie os gastos da casa</Text>

          <View className="flex-row items-center bg-surface border border-border rounded-xl px-4 py-3 mb-4 shadow-sm">
            <MaterialIcons name="search" size={24} color={colors.muted} />
            <TextInput
              placeholder="Buscar despesa..."
              placeholderTextColor={colors.muted}
              value={searchText}
              onChangeText={setSearchText}
              className="flex-1 ml-3 text-foreground text-base"
            />
          </View>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-row gap-2">
            {(["all", "pending", "paid"] as const).map((type) => {
              const labels = { all: "Todas", pending: "Pendentes", paid: "Pagas" };
              const isActive = filterType === type;
              return (
                <TouchableOpacity
                  key={type}
                  onPress={() => setFilterType(type)}
                  className={`px-5 py-2.5 rounded-xl mr-2 ${isActive ? "bg-primary" : "bg-surface border border-border"}`}
                >
                  <Text className={`font-bold text-sm ${isActive ? "text-white" : "text-muted"}`}>{labels[type]}</Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {filteredTransactions.length > 0 ? (
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
            <Text className="text-muted text-sm text-center mt-2 px-6">Use o botão central "+" para criar uma nova despesa para a casa.</Text>
          </View>
        )}
      </View>
    </ScreenContainer>
  );
}
