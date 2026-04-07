import {
  ScrollView,
  View,
  Text,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { useFinance } from "@/lib/finance-context";
import { useState } from "react";
import { MaterialIcons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useThemeContext } from "@/lib/theme-provider";
import { SchemeColors } from "@/constants/theme";

export default function TransactionDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const { state: financeState, deleteTransaction } = useFinance();
  const { colorScheme } = useThemeContext();
  const colors = SchemeColors[colorScheme];
  const [loading, setLoading] = useState(false);

  const transaction = financeState.transactions.find((t) => t.id === id);

  if (!transaction) {
    return (
      <ScreenContainer className="bg-background">
        <View className="flex-1 items-center justify-center">
          <MaterialIcons name="error-outline" size={48} color={colors.muted} />
          <Text className="text-muted text-base mt-4 font-bold">Despesa não encontrada</Text>
          <TouchableOpacity
            onPress={() => router.back()}
            className="mt-6 bg-primary rounded-xl px-8 py-3"
          >
            <Text className="text-white font-bold">Voltar</Text>
          </TouchableOpacity>
        </View>
      </ScreenContainer>
    );
  }

  const handleDelete = () => {
    Alert.alert(
      "Apagar Despesa",
      "Tem certeza de que deseja apagar esta despesa permanentemente?",
      [
        { text: "Cancelar", onPress: () => { } },
        {
          text: "Apagar",
          style: "destructive",
          onPress: async () => {
            setLoading(true);
            try {
              await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              await deleteTransaction(transaction.id);
              await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              router.back();
            } catch (error) {
              await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
              Alert.alert("Erro", "Falha ao apagar despesa");
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("pt-BR", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  return (
    <ScreenContainer className="bg-background">
      <View className="flex-row items-center justify-between px-4 pt-4 pb-2 border-b border-border bg-background">
        <TouchableOpacity onPress={() => router.back()} className="p-2">
          <MaterialIcons name="arrow-back-ios" size={20} color={colors.primary} />
        </TouchableOpacity>
        <Text className="text-foreground font-bold text-lg">Detalhes</Text>
        <View className="w-8"></View>
      </View>

      <ScrollView contentContainerStyle={{ flexGrow: 1 }} className="px-4 py-6">
        <View className="gap-6 pb-8">

          {/* Header */}
          <View className="items-center mb-2">
            <View className={`w-16 h-16 rounded-2xl items-center justify-center mb-4 ${(transaction as any).status === "pending" ? "bg-warning bg-opacity-20" : "bg-success bg-opacity-20"
              }`}>
              <MaterialIcons
                name={(transaction as any).status === "pending" ? "schedule" : "check"}
                size={32}
                color={(transaction as any).status === "pending" ? colors.warning : colors.success}
              />
            </View>
            <Text className="text-2xl font-bold text-foreground mb-1 text-center">
              {transaction.description}
            </Text>
            <Text className="text-sm font-bold text-muted uppercase tracking-widest">{transaction.category}</Text>
          </View>

          {/* Amount Card */}
          <View
            className={`rounded-3xl p-6 items-center shadow-sm border border-border bg-surface`}
          >
            <Text className="text-muted font-bold text-xs mb-2 uppercase tracking-widest">
              Valor da Despesa
            </Text>
            <Text className="text-foreground text-4xl font-extrabold tracking-tight">
              {formatCurrency(transaction.amount)}
            </Text>
            <View className={`mt-3 px-3 py-1 rounded-full ${(transaction as any).status === 'pending' ? 'bg-warning bg-opacity-20' : 'bg-success bg-opacity-20'
              }`}>
              <Text className={`text-xs font-bold uppercase tracking-wider ${(transaction as any).status === 'pending' ? 'text-warning' : 'text-success'
                }`}>
                {(transaction as any).status === 'pending' ? 'Pendente' : 'Pago'}
              </Text>
            </View>
          </View>

          {/* Details */}
          <View className="bg-surface rounded-3xl p-5 border border-border shadow-sm gap-4">
            <DetailRow
              icon="calendar-today"
              label="Data de Vencimento"
              value={formatDate((transaction as unknown as any).dueDate || transaction.date)}
              colors={colors}
            />
            {transaction.notes && (
              <DetailRow
                icon="note"
                label="Observações"
                value={transaction.notes}
                colors={colors}
              />
            )}
            {(transaction as any).responsible && (
              <DetailRow
                icon="person"
                label="Responsável Pagamento"
                value={(transaction as any).responsible}
                colors={colors}
              />
            )}
            {(transaction as any).divisionType && (
              <DetailRow
                icon="pie-chart"
                label="Tipo de Divisão"
                value={(transaction as any).divisionType === 'equal' ? 'Igual entre todos' : 'Manual / Customizada'}
                colors={colors}
              />
            )}
          </View>

          {/* Timestamps */}
          <View className="items-center gap-1 opacity-50 mt-4">
            <Text className="text-xs text-muted font-semibold">
              Criado em {new Date(transaction.createdAt).toLocaleDateString("pt-BR")}
            </Text>
          </View>

          {/* Delete Button */}
          <TouchableOpacity
            onPress={handleDelete}
            disabled={loading}
            className="mt-4 bg-error rounded-2xl p-4 flex-row justify-center items-center gap-2"
          >
            {loading ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <>
                <MaterialIcons name="delete-outline" size={22} color="#ffffff" />
                <Text className="font-bold text-base">Apagar Despesa</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}

function DetailRow({
  icon,
  label,
  value,
  colors
}: {
  icon: string;
  label: string;
  value: string;
  colors: any;
}) {
  return (
    <View className="flex-row items-center gap-4">
      <View className="w-10 h-10 rounded-xl bg-primary bg-opacity-10 items-center justify-center">
        <MaterialIcons name={icon as any} size={20} color={colors.primary} />
      </View>
      <View className="flex-1">
        <Text className="text-muted text-xs font-bold uppercase tracking-wider mb-0.5">{label}</Text>
        <Text className="text-foreground font-bold text-base">{value}</Text>
      </View>
    </View>
  );
}
