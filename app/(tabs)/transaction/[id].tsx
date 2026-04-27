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

export default function TransactionDetailScreen() {
    const router = useRouter();
    const { id } = useLocalSearchParams();
    const { state: financeState, deleteTransaction } = useFinance();
    const [loading, setLoading] = useState(false);

    const transaction = financeState.transactions.find((t) => t.id === id);

    if (!transaction) {
        return (
            <ScreenContainer className="bg-background">
                <View className="flex-1 items-center justify-center">
                    <MaterialIcons name="error-outline" size={48} color="#687076" />
                    <Text className="text-muted text-base mt-4">Transaction not found</Text>
                    <TouchableOpacity
                        onPress={() => router.back()}
                        className="mt-6 bg-primary rounded-lg px-6 py-3"
                    >
                        <Text className="text-white font-semibold">Go Back</Text>
                    </TouchableOpacity>
                </View>
            </ScreenContainer>
        );
    }

    const handleDelete = () => {
        Alert.alert(
            "Delete Transaction",
            "Are you sure you want to delete this transaction?",
            [
                { text: "Cancel", onPress: () => { } },
                {
                    text: "Delete",
                    onPress: async () => {
                        setLoading(true);
                        try {
                            await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                            await deleteTransaction(transaction.id);
                            await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                            router.back();
                        } catch (error) {
                            await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
                            Alert.alert("Error", "Failed to delete transaction");
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

    const frequencyLabel: Record<string, string> = {
        weekly: "Every week",
        monthly: "Every month",
        quarterly: "Every quarter",
        yearly: "Every year",
    };

    return (
        <ScreenContainer className="bg-background">
            <ScrollView contentContainerStyle={{ flexGrow: 1 }} className="px-4 py-6">
                <View className="gap-6">
                    {/* Header */}
                    <View className="flex-row justify-between items-start">
                        <View>
                            <Text className="text-2xl font-bold text-foreground mb-2">
                                {transaction.description}
                            </Text>
                            <Text className="text-sm text-muted">{transaction.category}</Text>
                        </View>
                        <TouchableOpacity
                            onPress={() => router.back()}
                            className="p-2"
                        >
                            <MaterialIcons name="close" size={24} color="#687076" />
                        </TouchableOpacity>
                    </View>

                    {/* Amount Card */}
                    <View
                        className={`rounded-2xl p-6 items-center ${transaction.type === "income" ? "bg-success" : "bg-error"
                            }`}
                    >
                        <Text className="text-white text-sm font-semibold mb-2">
                            {transaction.type === "income" ? "Income" : "Expense"}
                        </Text>
                        <Text className="text-white text-4xl font-bold">
                            {transaction.type === "income" ? "+" : "-"}
                            {formatCurrency(transaction.amount)}
                        </Text>
                    </View>

                    {/* Details */}
                    <View className="gap-3">
                        <DetailRow
                            icon="calendar-today"
                            label="Date"
                            value={formatDate(transaction.date)}
                        />
                        <DetailRow
                            icon="label"
                            label="Category"
                            value={transaction.category}
                        />
                        {transaction.notes && (
                            <DetailRow
                                icon="note"
                                label="Notes"
                                value={transaction.notes}
                            />
                        )}
                    </View>

                    {/* Periodic Info */}
                    {transaction.isPeriodic && transaction.frequency && (
                        <View className="bg-warning bg-opacity-10 rounded-lg p-4 border border-warning">
                            <View className="flex-row items-start gap-3">
                                <MaterialIcons name="repeat" size={20} color="#F59E0B" />
                                <View className="flex-1">
                                    <Text className="text-warning font-semibold">Recurring Transaction</Text>
                                    <Text className="text-warning text-sm mt-1">
                                        {frequencyLabel[transaction.frequency]}
                                    </Text>
                                    {transaction.endDate && (
                                        <Text className="text-warning text-xs mt-1">
                                            Until {formatDate(transaction.endDate)}
                                        </Text>
                                    )}
                                </View>
                            </View>
                        </View>
                    )}

                    {/* Timestamps */}
                    <View className="bg-surface rounded-lg p-4 gap-2">
                        <Text className="text-xs text-muted">
                            Created {transaction.createdAt ? new Date(transaction.createdAt).toLocaleDateString("pt-BR") : "N/A"}
                        </Text>
                        <Text className="text-xs text-muted">
                            Updated {transaction.updatedAt ? new Date(transaction.updatedAt).toLocaleDateString("pt-BR") : "N/A"}
                        </Text>
                    </View>

                    {/* Delete Button */}
                    <TouchableOpacity
                        onPress={handleDelete}
                        disabled={loading}
                        style={[{ opacity: loading ? 0.7 : 1 }]}
                        className="bg-error bg-opacity-10 border border-error rounded-lg py-4 items-center"
                    >
                        {loading ? (
                            <ActivityIndicator color="#EF4444" />
                        ) : (
                            <Text className="text-text font-semibold text-base">Delete Transaction</Text>
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
}: {
    icon: string;
    label: string;
    value: string;
}) {
    return (
        <View className="bg-surface rounded-lg p-4 flex-row items-center gap-3">
            <MaterialIcons name={icon as any} size={20} color="#0a7ea4" />
            <View className="flex-1">
                <Text className="text-muted text-xs mb-1">{label}</Text>
                <Text className="text-foreground font-semibold">{value}</Text>
            </View>
        </View>
    );
}
