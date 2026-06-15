import {
    ScrollView,
    View,
    Text,
    TouchableOpacity,
    Alert,
    ActivityIndicator,
    Platform,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { useFinance } from "@/lib/finance-context";
import { useAuth } from "@/lib/auth-context";
import { apiClient } from "@/lib/apiClient";
import { useState } from "react";
import { MaterialIcons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useThemeContext } from "@/lib/theme-provider";
import { SchemeColors } from "@/constants/theme";

export default function TransactionDetailScreen() {
    const router = useRouter();
    const { id } = useLocalSearchParams();
    const { state: financeState, deleteTransaction, getTransactions } = useFinance();
    const { state: authState } = useAuth();
    const { colorScheme } = useThemeContext();
    const colors = SchemeColors[colorScheme];

    const [loading, setLoading] = useState(false);
    const [statusLoading, setStatusLoading] = useState(false);

    const transaction = financeState.transactions.find((t) => t.id === id);

    if (!transaction) {
        return (
            <ScreenContainer className="bg-background">
                <View className="flex-1 items-center justify-center px-6 text-center">
                    <MaterialIcons name="error-outline" size={48} color={colors.muted} />
                    <Text className="text-muted text-lg mt-4 font-bold text-center">Transação não encontrada</Text>
                    <TouchableOpacity
                        onPress={() => router.back()}
                        className="mt-6 bg-primary rounded-2xl px-8 py-4 shadow-sm"
                    >
                        <Text className="text-white font-bold tracking-widest uppercase">Voltar</Text>
                    </TouchableOpacity>
                </View>
            </ScreenContainer>
        );
    }

    const mySplit = transaction.splits?.find(s => s.userId === authState.user?.id);
    const isPending = transaction.status?.toUpperCase() === "PENDING" && (!mySplit || mySplit.status?.toUpperCase() === "PENDING");

    const handleMarkAsPaid = async () => {
        const executePayment = async () => {
            setStatusLoading(true);
            try {
                if (Platform.OS !== 'web') {
                    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                }

                // Se houver um split para o usuário atual, atualiza o split dele.
                // Caso contrário, ou se for uma despesa geral, atualiza a despesa inteira.
                if (mySplit && mySplit.status?.toUpperCase() === "PENDING") {
                    await apiClient.patch(`/expenses/split/${mySplit.id}/status`, { status: "PAID" });
                } else {
                    await apiClient.patch(`/expenses/${transaction.id}/status`, { status: "PAID" });
                }

                // Recarrega as transações do backend para ter a certeza do estado atualizado
                await getTransactions();

                if (Platform.OS !== 'web') {
                    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                }

                Alert.alert("Sucesso", "A despesa foi marcada como paga!");
                router.back(); // Volta pra tela anterior pra refletir os dados pagos
            } catch (error) {
                console.error("Erro ao pagar:", error);
                if (Platform.OS !== 'web') {
                    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
                }
                Alert.alert("Erro", "Não foi possível atualizar o status. Tente novamente.");
            } finally {
                setStatusLoading(false);
            }
        };

        if (Platform.OS === 'web') {
            const confirmed = window.confirm("Deseja confirmar o pagamento desta despesa?");
            if (confirmed) {
                executePayment();
            }
        } else {
            Alert.alert(
                "Marcar como Pago",
                "Deseja confirmar o pagamento desta despesa?",
                [
                    { text: "Cancelar", style: "cancel" },
                    { text: "Confirmar", onPress: executePayment },
                ]
            );
        }
    };

    const handleDelete = async () => {
        const executeDelete = async () => {
            setLoading(true);
            try {
                if (Platform.OS !== 'web') {
                    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
                }
                
                await deleteTransaction(transaction.id);
                
                if (Platform.OS !== 'web') {
                    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                }
                
                router.back();
            } catch (error) {
                console.error("Erro ao apagar:", error);
                if (Platform.OS !== 'web') {
                    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
                }
                Alert.alert("Erro", "Falha ao apagar transação. Tente novamente.");
            } finally {
                setLoading(false);
            }
        };

        if (Platform.OS === 'web') {
            const confirmed = window.confirm("Tem certeza de que deseja apagar esta transação? Esta ação não pode ser desfeita.");
            if (confirmed) {
                executeDelete();
            }
        } else {
            Alert.alert(
                "Apagar Transação",
                "Tem certeza de que deseja apagar esta transação? Esta ação não pode ser desfeita.",
                [
                    { text: "Cancelar", style: "cancel" },
                    { text: "Apagar", style: "destructive", onPress: executeDelete },
                ]
            );
        }
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
        weekly: "Toda semana",
        monthly: "Todo mês",
        quarterly: "A cada trimestre",
        yearly: "Anualmente",
    };

    return (
        <ScreenContainer className="bg-background">
            <ScrollView contentContainerStyle={{ flexGrow: 1 }} className="px-4 py-6">
                <View className="gap-6 pb-12">
                    {/* Header */}
                    <View className="flex-row justify-between items-start">
                        <View className="flex-1 pr-4">
                            <Text className="text-muted text-xs font-bold uppercase tracking-widest mb-1">
                                Detalhes da {transaction.type === "income" ? "Renda" : "Despesa"}
                            </Text>
                            <Text className="text-3xl font-extrabold text-foreground mb-1 leading-tight">
                                {transaction.title || transaction.description}
                            </Text>
                            <View className="flex-row items-center mt-1">
                                <View className={`px-2 py-1 rounded-md ${isPending ? "bg-warning" : "bg-success"} mr-2`}>
                                    <Text className="text-white text-[10px] font-bold uppercase tracking-widest">
                                        {isPending ? "Pendente" : "Pago"}
                                    </Text>
                                </View>
                                <Text className="text-sm font-semibold text-muted">{transaction.category || transaction.categoryName}</Text>
                            </View>
                        </View>
                        <TouchableOpacity
                            onPress={() => router.back()}
                            className="w-10 h-10 rounded-full bg-surface items-center justify-center border border-border shadow-sm"
                        >
                            <MaterialIcons name="close" size={20} color={colors.foreground} />
                        </TouchableOpacity>
                    </View>

                    {/* Amount Card */}
                    <View
                        className={`rounded-3xl p-8 items-center shadow-md relative overflow-hidden ${transaction.type === "income" ? "bg-success" : "bg-error"}`}
                        style={{ elevation: 4 }}
                    >
                        <View className="absolute -top-6 -right-6 w-32 h-32 rounded-full bg-white opacity-10" />
                        <View className="absolute -bottom-8 -left-8 w-40 h-40 rounded-full bg-black opacity-10" />

                        <View className="bg-white bg-opacity-20 px-3 py-1 rounded-full mb-4">
                            <Text className="text-white text-xs font-bold uppercase tracking-widest">
                                Valor {transaction.type === "income" ? "Recebido" : "da Despesa"}
                            </Text>
                        </View>

                        <Text className="text-white text-5xl font-black tracking-tighter">
                            {formatCurrency(transaction.amount)}
                        </Text>
                    </View>

                    {/* Actions */}
                    {isPending && (
                        <TouchableOpacity
                            onPress={handleMarkAsPaid}
                            disabled={statusLoading}
                            className="bg-primary rounded-2xl p-4 flex-row justify-center items-center shadow-sm"
                        >
                            {statusLoading ? (
                                <ActivityIndicator color="#ffffff" />
                            ) : (
                                <>
                                    <MaterialIcons name="check-circle" size={24} color="#ffffff" className="mr-2" />
                                    <Text className="text-white font-bold text-base uppercase tracking-widest ml-2">Marcar como Pago</Text>
                                </>
                            )}
                        </TouchableOpacity>
                    )}

                    {/* Details section */}
                    <View className="bg-surface rounded-3xl border border-border overflow-hidden shadow-sm">
                        <DetailRow
                            icon="event"
                            label="Data de Vencimento"
                            value={formatDate(transaction.dueDate || transaction.date)}
                            color={colors.primary}
                        />
                        <View className="h-[1px] bg-border mx-4" />
                        <DetailRow
                            icon="category"
                            label="Categoria"
                            value={transaction.category || transaction.categoryName || "Geral"}
                            color={colors.primary}
                        />

                        {transaction.responsible && (
                            <>
                                <View className="h-[1px] bg-border mx-4" />
                                <DetailRow
                                    icon="person"
                                    label="Responsável"
                                    value={transaction.responsible}
                                    color={colors.primary}
                                />
                            </>
                        )}

                        {transaction.description && transaction.description !== transaction.title && (
                            <>
                                <View className="h-[1px] bg-border mx-4" />
                                <DetailRow
                                    icon="notes"
                                    label="Descrição"
                                    value={transaction.description}
                                    color={colors.primary}
                                />
                            </>
                        )}

                        {transaction.notes && (
                            <>
                                <View className="h-[1px] bg-border mx-4" />
                                <View className="p-5 flex-row items-start gap-4">
                                    <View className="w-10 h-10 rounded-xl bg-background border border-border items-center justify-center mt-1">
                                        <MaterialIcons name="subject" size={20} color={colors.primary} />
                                    </View>
                                    <View className="flex-1">
                                        <Text className="text-muted text-[11px] font-bold uppercase tracking-widest mb-1">Anotações Adicionais</Text>
                                        <Text className="text-foreground font-medium text-sm leading-relaxed">{transaction.notes}</Text>
                                    </View>
                                </View>
                            </>
                        )}
                    </View>

                    {/* Periodic Info */}
                    {transaction.isPeriodic && transaction.frequency && (
                        <View className="bg-warning bg-opacity-10 rounded-2xl p-5 border border-warning flex-row items-start gap-4">
                            <View className="w-10 h-10 rounded-xl bg-warning bg-opacity-20 items-center justify-center">
                                <MaterialIcons name="autorenew" size={24} color={colors.warning} />
                            </View>
                            <View className="flex-1">
                                <Text className="text-warning font-bold text-base mb-1">Despesa Recorrente</Text>
                                <Text className="text-warning font-medium text-sm">
                                    {frequencyLabel[transaction.frequency]}
                                </Text>
                                {transaction.endDate && (
                                    <Text className="text-warning font-medium text-xs mt-1 opacity-80">
                                        Até {formatDate(transaction.endDate)}
                                    </Text>
                                )}
                            </View>
                        </View>
                    )}

                    {/* Timestamps */}
                    <View className="flex-row justify-between px-2">
                        <Text className="text-[10px] text-muted font-bold uppercase tracking-widest">
                            Criado em: {transaction.createdAt ? new Date(transaction.createdAt).toLocaleDateString("pt-BR") : "N/A"}
                        </Text>
                        <Text className="text-[10px] text-muted font-bold uppercase tracking-widest">
                            Atualizado em: {transaction.updatedAt ? new Date(transaction.updatedAt).toLocaleDateString("pt-BR") : "N/A"}
                        </Text>
                    </View>

                    {/* Delete Button */}
                    <TouchableOpacity
                        onPress={handleDelete}
                        disabled={loading}
                        className="bg-background border border-error rounded-2xl p-4 flex-row items-center justify-center shadow-sm mt-2"
                    >
                        {loading ? (
                            <ActivityIndicator color={colors.error} />
                        ) : (
                            <>
                                <MaterialIcons name="delete-outline" size={22} color={colors.error} className="mr-2" />
                                <Text className="font-bold text-base ml-2" style={{ color: colors.error }}>Apagar Transação</Text>
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
    color
}: {
    icon: string;
    label: string;
    value: string;
    color: string;
}) {
    return (
        <View className="p-5 flex-row items-center gap-4">
            <View className="w-10 h-10 rounded-xl bg-background border border-border items-center justify-center">
                <MaterialIcons name={icon as any} size={20} color={color} />
            </View>
            <View className="flex-1">
                <Text className="text-muted text-[11px] font-bold uppercase tracking-widest mb-1">{label}</Text>
                <Text className="text-foreground font-bold text-base">{value}</Text>
            </View>
        </View>
    );
}
