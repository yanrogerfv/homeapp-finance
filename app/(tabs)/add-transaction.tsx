import {
  ScrollView,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  Switch,
  ActivityIndicator,
  Modal,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { useFinance } from "@/lib/finance-context";
import { useState, useEffect } from "react";
import { MaterialIcons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useThemeContext } from "@/lib/theme-provider";
import { SchemeColors } from "@/constants/theme";
import { fetchHousemates } from "@/lib/api";

export default function AddTransactionScreen() {
  const router = useRouter();
  const { type: transactionType } = useLocalSearchParams();
  const { state: financeState, addTransaction } = useFinance();
  const { colorScheme } = useThemeContext();
  const colors = SchemeColors[colorScheme];

  const [type, setType] = useState<"income" | "expense">(
    (transactionType as "income" | "expense") || "expense"
  );

  const [amount, setAmount] = useState("");
  const [title, setTitle] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [date, setDate] = useState(() => {
    const d = new Date();
    return `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()}`;
  });

  // Periodic fields
  const [isPeriodic, setIsPeriodic] = useState(false);
  const [frequency, setFrequency] = useState<"weekly" | "monthly" | "quarterly" | "yearly">("monthly");
  const [endDate, setEndDate] = useState("");
  const [notes, setNotes] = useState("");

  // Expense/House fields
  const [responsible, setResponsible] = useState("");
  const [divisionType, setDivisionType] = useState<"equal" | "manual">("equal");

  const [housemates, setHousemates] = useState<any[]>([]);
  const [splitUsersIds, setsplitUsersIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);

  useEffect(() => {
    fetchHousemates().then(hm => {
      setHousemates(hm);
      setsplitUsersIds(hm.map((h: any) => h.id));
    }).catch(console.error);
  }, []);

  // Use categories from context
  const currentCategories = financeState.categories;

  // Whenever type changes, reset category if it doesn't fit
  useEffect(() => {
    setCategoryId("");
  }, [type]);

  const handleSave = async () => {
    if (!amount || !title || !categoryId) {
      Alert.alert("Erro", "Por favor preencha os campos obrigatórios (*)");
      return;
    }

    if (type === "expense" && !responsible) {
      Alert.alert("Erro", "Para despesas, selecione um responsável pelo pagamento");
      return;
    }

    setLoading(true);
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

      // Convert from DD/MM/YYYY to YYYY-MM-DD for backend
      const [day, month, year] = date.split("/");
      const formattedApiDate = `${year}-${month}-${day}`;

      let formattedEndDate;
      if (isPeriodic && endDate) {
        const [eDay, eMonth, eYear] = endDate.split("/");
        formattedEndDate = `${eYear}-${eMonth}-${eDay}`;
      }

      const numericAmount = parseFloat(amount.replace(/\./g, '').replace(',', '.'));

      const payload: any = {
        type,
        amount: numericAmount,
        title: title,
        categoryId: categoryId,
        dueDate: formattedApiDate,
        isPeriodic,
        frequency: isPeriodic ? frequency : undefined,
        endDate: formattedEndDate,
        notes: notes || undefined,
        splitUsersIds: splitUsersIds
      };

      if (type === "expense") {
        payload.responsibleId = responsible;
        payload.divisionType = divisionType;
        payload.status = "pending";
        // The addTransaction call below already POSTs to /expenses implicitly
      }

      await addTransaction(payload);
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

      // Limpar todos os campos
      setAmount("");
      setTitle("");
      setCategoryId("");
      const d = new Date();
      setDate(`${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()}`);
      setIsPeriodic(false);
      setFrequency("monthly");
      setEndDate("");
      setNotes("");
      setResponsible("");
      setDivisionType("equal");
      setsplitUsersIds(housemates.map((h: any) => h.id));

      router.back();
    } catch (error) {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert("Erro", "Falha ao salvar transação");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScreenContainer className="bg-background">
      <ScrollView contentContainerStyle={{ flexGrow: 1 }} className="px-4 py-6" keyboardShouldPersistTaps="handled">
        <View className="gap-6 pb-12">

          {/* Header & Type Toggle */}
          <View>
            <Text className="text-2xl font-bold text-foreground mb-4">
              Nova {type === "income" ? "Renda" : "Despesa"}
            </Text>
            <View className="flex-row gap-2">
              <TouchableOpacity
                onPress={() => setType("income")}
                className={`flex-1 py-3 rounded-xl flex-row justify-center items-center ${type === "income" ? "bg-success" : "bg-surface border border-border"
                  }`}
              >
                <MaterialIcons name="arrow-upward" size={18} color={type === "income" ? "#fff" : colors.foreground} style={{ marginRight: 6 }} />
                <Text className={`font-bold ${type === "income" ? "text-white" : "text-foreground"}`}>
                  Entrada
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setType("expense")}
                className={`flex-1 py-3 rounded-xl flex-row justify-center items-center ${type === "expense" ? "bg-error" : "bg-surface border border-border"
                  }`}
              >
                <MaterialIcons name="arrow-downward" size={18} color={type === "expense" ? "#fff" : colors.foreground} style={{ marginRight: 6 }} />
                <Text className={`font-bold ${type === "expense" ? "text-white" : "text-foreground"}`}>
                  Despesa (Gasto)
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Form Fields */}
          <View className="gap-5">

            {/* Amount */}
            <View>
              <Text className="text-sm font-bold text-foreground mb-2">Valor *</Text>
              <View className="flex-row items-center bg-surface border border-border rounded-xl px-4 py-3">
                <Text className="text-foreground font-extrabold text-xl">R$</Text>
                <TextInput
                  placeholder="0,00"
                  placeholderTextColor={colors.muted}
                  value={amount}
                  onChangeText={(text) => {
                    let cleaned = text.replace(/\D/g, '');
                    if (cleaned === '') {
                      setAmount('');
                      return;
                    }
                    let number = parseInt(cleaned, 10);
                    let formatted = (number / 100).toFixed(2).replace('.', ',');
                    formatted = formatted.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
                    setAmount(formatted);
                  }}
                  keyboardType="numeric"
                  editable={!loading}
                  className="flex-1 ml-3 text-foreground font-semibold text-lg"
                />
              </View>
            </View>

            {/* Description */}
            <View>
              <Text className="text-sm font-bold text-foreground mb-2">Descrição / Título *</Text>
              <TextInput
                placeholder="Ex: Conta de Luz, Salário..."
                placeholderTextColor={colors.muted}
                value={title}
                onChangeText={setTitle}
                editable={!loading}
                className="bg-surface border border-border rounded-xl px-4 py-3 text-foreground font-semibold"
              />
            </View>

            {/* Category Select Modal Trigger */}
            <View>
              <Text className="text-sm font-bold text-foreground mb-2">Categoria *</Text>
              <TouchableOpacity
                className="bg-surface border border-border rounded-xl px-4 py-3 flex-row justify-between items-center"
                onPress={() => setIsCategoryModalOpen(true)}
              >
                <Text className={`font-semibold ${categoryId ? "text-foreground" : "text-muted"}`}>
                  {categoryId ? currentCategories.find(c => c.id === categoryId)?.name : "Abra para selecionar..."}
                </Text>
                <MaterialIcons name="arrow-drop-down" size={24} color={colors.muted} />
              </TouchableOpacity>
            </View>

            {/* Date */}
            <View>
              <Text className="text-sm font-bold text-foreground mb-2">Data *</Text>
              <TextInput
                placeholder="DD/MM/YYYY"
                placeholderTextColor={colors.muted}
                value={date}
                onChangeText={(text) => {
                  let cleaned = text.replace(/\D/g, "");
                  let formatted = cleaned;
                  if (cleaned.length > 2) {
                    formatted = cleaned.slice(0, 2) + "/" + cleaned.slice(2);
                  }
                  if (cleaned.length > 4) {
                    formatted = formatted.slice(0, 5) + "/" + cleaned.slice(4, 8);
                  }
                  setDate(formatted);
                }}
                keyboardType="numeric"
                maxLength={10}
                editable={!loading}
                className="bg-surface border border-border rounded-xl px-4 py-3 text-foreground font-semibold"
              />
            </View>

            {/* EXPENSE ONLY FIELDS */}
            {type === "expense" && (
              <View className="bg-surface border border-border rounded-xl p-4 gap-4 bg-opacity-50">
                <Text className="text-foreground font-bold text-sm mb-1 uppercase tracking-wider opacity-80">Detalhes da Casa</Text>

                {/* Responsible Housemate */}
                <View>
                  <Text className="text-sm font-bold text-foreground mb-2">Responsável pelo Pagamento *</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} className="pl-1 pb-1">
                    {housemates.map((person) => (
                      <TouchableOpacity
                        key={`resp-${person.id}`}
                        onPress={() => setResponsible(person.id)}
                        className={`px-4 py-2 rounded-lg mr-2 border ${responsible === person.id
                          ? "bg-primary border-primary"
                          : "bg-background border-border"
                          }`}
                      >
                        <Text className={`font-bold text-xs ${responsible === person.id ? "text-white" : "text-foreground"}`}>
                          {person.displayName || person.name || person.firstName || person.email}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>

                {/* Split Between (Divisão) */}
                <View>
                  <Text className="text-sm font-bold text-foreground mb-2">Dividir com: *</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} className="pl-1 pb-1">
                    {housemates.map((person) => {
                      const isSelected = splitUsersIds.includes(person.id);
                      return (
                        <TouchableOpacity
                          key={`split-${person.id}`}
                          onPress={() => {
                            setsplitUsersIds(prev =>
                              isSelected
                                ? prev.filter(id => id !== person.id)
                                : [...prev, person.id]
                            );
                          }}
                          className={`px-4 py-2 rounded-lg mr-2 border ${isSelected
                            ? "bg-primary border-primary"
                            : "bg-background border-border"
                            }`}
                        >
                          <Text className={`font-bold text-xs ${isSelected ? "text-white" : "text-foreground"}`}>
                            {person.displayName || person.name || person.firstName || person.email}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </ScrollView>
                </View>

                {/* Division Type */}
                <View>
                  <Text className="text-sm font-bold text-foreground mb-2">Divisão da Despesa</Text>
                  <View className="flex-row gap-2">
                    <TouchableOpacity
                      onPress={() => setDivisionType("equal")}
                      className={`flex-1 flex-row items-center justify-center py-3 rounded-lg border ${divisionType === "equal" ? "bg-primary border-primary" : "bg-surface border-border"
                        }`}
                    >
                      <MaterialIcons name="group" size={16} color={divisionType === "equal" ? "#fff" : colors.muted} className="mr-2" />
                      <Text className={`font-bold text-xs ${divisionType === "equal" ? "text-white" : "text-muted"}`}>Igual</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => setDivisionType("manual")}
                      className={`flex-1 flex-row items-center justify-center py-3 rounded-lg border ${divisionType === "manual" ? "bg-primary border-primary" : "bg-surface border-border"
                        }`}
                    >
                      <MaterialIcons name="edit" size={16} color={divisionType === "manual" ? "#fff" : colors.muted} className="mr-2" />
                      <Text className={`font-bold text-xs ${divisionType === "manual" ? "text-white" : "text-muted"}`}>Manual</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            )}

            {/* Periodic Switch */}
            <View className="bg-surface rounded-xl p-4 flex-row justify-between items-center border border-border">
              <View className="flex-1">
                <Text className="text-foreground font-bold text-sm">Transação Recorrente</Text>
                <Text className="text-muted text-xs mt-1">Repetir esta transação automaticamente</Text>
              </View>
              <Switch
                value={isPeriodic}
                onValueChange={setIsPeriodic}
                disabled={loading}
                trackColor={{ false: colors.border, true: colors.primary }}
              />
            </View>

            {/* Periodic Details */}
            {isPeriodic && (
              <View className="p-4 bg-surface rounded-xl border border-border gap-4 bg-opacity-50">
                <View>
                  <Text className="text-sm font-bold text-foreground mb-2">Frequência</Text>
                  <View className="flex-row gap-2">
                    {(["weekly", "monthly", "quarterly", "yearly"] as const).map((freq) => {
                      const labels = { weekly: "Semanal", monthly: "Mensal", quarterly: "Trimestral", yearly: "Anual" };
                      return (
                        <TouchableOpacity
                          key={freq}
                          onPress={() => setFrequency(freq)}
                          className={`flex-1 py-3 rounded-lg items-center border ${frequency === freq
                            ? "bg-primary border-primary"
                            : "bg-background border-border"
                            }`}
                        >
                          <Text
                            className={`font-semibold text-xs ${frequency === freq ? "text-white" : "text-foreground"
                              }`}
                          >
                            {labels[freq]}
                          </Text>
                        </TouchableOpacity>
                      )
                    })}
                  </View>
                </View>

                <View>
                  <Text className="text-sm font-bold text-foreground mb-2">Data de Término (Opcional)</Text>
                  <TextInput
                    placeholder="DD/MM/YYYY"
                    placeholderTextColor={colors.muted}
                    value={endDate}
                    onChangeText={(text) => {
                      let cleaned = text.replace(/\D/g, "");
                      let formatted = cleaned;
                      if (cleaned.length > 2) {
                        formatted = cleaned.slice(0, 2) + "/" + cleaned.slice(2);
                      }
                      if (cleaned.length > 4) {
                        formatted = formatted.slice(0, 5) + "/" + cleaned.slice(4, 8);
                      }
                      setEndDate(formatted);
                    }}
                    keyboardType="numeric"
                    maxLength={10}
                    editable={!loading}
                    className="bg-background border border-border rounded-lg px-3 py-3 text-foreground"
                  />
                </View>
              </View>
            )}

            {/* Notes */}
            <View className="mb-4">
              <Text className="text-sm font-bold text-foreground mb-2">Observações Adicionais</Text>
              <TextInput
                placeholder="Insira detalhes..."
                placeholderTextColor={colors.muted}
                value={notes}
                onChangeText={setNotes}
                multiline
                numberOfLines={3}
                editable={!loading}
                className="bg-surface border border-border rounded-xl px-4 py-3 text-foreground font-semibold"
                style={{ minHeight: 80, textAlignVertical: "top" }}
              />
            </View>

            {/* Save Button */}
            <TouchableOpacity
              onPress={handleSave}
              disabled={loading}
              className="bg-primary rounded-xl py-4 items-center shadow-sm"
            >
              {loading ? (
                <ActivityIndicator color="#ffffff" />
              ) : (
                <Text className="text-white font-bold text-base uppercase tracking-widest">
                  Salvar
                </Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => router.back()}
              disabled={loading}
              className="py-4 items-center mt-2"
            >
              <Text className="text-muted font-bold text-sm">Cancelar</Text>
            </TouchableOpacity>

          </View>
        </View>
      </ScrollView>

      {/* Category Selection Modal */}
      <Modal
        visible={isCategoryModalOpen}
        transparent
        animationType="slide"
        onRequestClose={() => setIsCategoryModalOpen(false)}
      >
        <View className="flex-1 justify-end bg-black bg-opacity-60">
          <View className="bg-background rounded-t-3xl border-t border-border pt-4 pb-12 px-4 shadow-lg min-h-[50%]">
            <View className="flex-row items-center justify-between mb-4 px-2">
              <Text className="text-foreground font-bold text-xl">
                Categoria de {type === "income" ? "Renda" : "Despesa"}
              </Text>
              <TouchableOpacity onPress={() => setIsCategoryModalOpen(false)} className="p-2 bg-surface rounded-full">
                <MaterialIcons name="close" size={24} color={colors.foreground} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {currentCategories.map((cat) => (
                <TouchableOpacity
                  key={cat.id}
                  onPress={() => {
                    setCategoryId(cat.id);
                    setIsCategoryModalOpen(false);
                  }}
                  style={{ backgroundColor: categoryId === cat.id ? colors.primary + '1A' : 'transparent' }}
                  className={`flex-row items-center justify-between py-4 px-4 border-border ${categoryId === cat.id ? "py-5 rounded-xl mb-1 mt-1" : "border-b"
                    }`}
                >
                  <Text style={{ color: categoryId === cat.id ? colors.primary : colors.foreground }} className="font-bold text-base">
                    {cat.name}
                  </Text>
                  {categoryId === cat.id && <MaterialIcons name="check-circle" size={24} color={colors.primary} />}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

    </ScreenContainer>
  );
}
