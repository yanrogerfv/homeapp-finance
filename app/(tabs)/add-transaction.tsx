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
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";

const MONTH_NAMES = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
];

const parseDateString = (str: string): Date | null => {
  if (!str) return null;
  const parts = str.split("/");
  if (parts.length !== 3) return null;
  const day = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10) - 1; // 0-indexed
  const year = parseInt(parts[2], 10);
  if (isNaN(day) || isNaN(month) || isNaN(year)) return null;
  return new Date(year, month, day);
};

const formatDateString = (d: Date): string => {
  return `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()}`;
};

export default function AddTransactionScreen() {
  const router = useRouter();
  const { type: transactionType } = useLocalSearchParams();
  const { state: financeState, addTransaction } = useFinance();
  const { colorScheme } = useThemeContext();
  const colors = SchemeColors[colorScheme];

  const tabBarHeight = useBottomTabBarHeight();
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

  // Date Picker Modal States
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
  const [pickerField, setPickerField] = useState<"date" | "endDate">("date");
  const [pickerDate, setPickerDate] = useState(() => new Date());

  // Expense/House fields
  const [responsible, setResponsible] = useState("");
  const [divisionType, setDivisionType] = useState<"equal" | "manual">("equal");

  const [housemates, setHousemates] = useState<any[]>([]);
  const [splitUsersIds, setsplitUsersIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);

  const handleDaySelect = (day: number) => {
    const selected = new Date(pickerDate.getFullYear(), pickerDate.getMonth(), day);
    const formatted = formatDateString(selected);

    if (pickerField === "date") {
      setDate(formatted);
    } else {
      setEndDate(formatted);
    }

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(console.error);
    setIsDatePickerOpen(false);
  };

  const handlePrevMonth = () => {
    setPickerDate(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(console.error);
  };

  const handleNextMonth = () => {
    setPickerDate(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(console.error);
  };

  const handleSelectToday = () => {
    const today = new Date();
    const formatted = formatDateString(today);

    if (pickerField === "date") {
      setDate(formatted);
    } else {
      setEndDate(formatted);
    }

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(console.error);
    setIsDatePickerOpen(false);
  };

  const handleClearDate = () => {
    if (pickerField === "endDate") {
      setEndDate("");
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(console.error);
    setIsDatePickerOpen(false);
  };

  const pickerYear = pickerDate.getFullYear();
  const pickerMonth = pickerDate.getMonth();

  const daysInMonth = new Date(pickerYear, pickerMonth + 1, 0).getDate();
  const firstDayIndex = new Date(pickerYear, pickerMonth, 1).getDay(); // 0 = Sunday, 1 = Monday...

  const daysArray = [];
  for (let i = 0; i < firstDayIndex; i++) {
    daysArray.push(null);
  }
  for (let i = 1; i <= daysInMonth; i++) {
    daysArray.push(i);
  }

  const currentVal = pickerField === "date" ? date : endDate;
  const parsedCurrent = parseDateString(currentVal);

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
      <ScrollView contentContainerStyle={{ flexGrow: 1, paddingBottom: tabBarHeight + 16 }} className="px-4 py-6" keyboardShouldPersistTaps="handled">
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
              <TouchableOpacity
                onPress={() => {
                  setPickerField("date");
                  const parsed = parseDateString(date) || new Date();
                  setPickerDate(parsed);
                  setIsDatePickerOpen(true);
                }}
                disabled={loading}
                className="bg-surface border border-border rounded-xl px-4 py-3 flex-row justify-between items-center"
              >
                <Text className="text-foreground font-semibold text-base">
                  {date}
                </Text>
                <MaterialIcons name="event" size={20} color={colors.muted} />
              </TouchableOpacity>
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
                  <TouchableOpacity
                    onPress={() => {
                      setPickerField("endDate");
                      const parsed = parseDateString(endDate) || new Date();
                      setPickerDate(parsed);
                      setIsDatePickerOpen(true);
                    }}
                    disabled={loading}
                    className="bg-background border border-border rounded-lg px-3 py-3 flex-row justify-between items-center"
                  >
                    <Text className={`font-semibold text-base ${endDate ? "text-foreground" : "text-muted"}`}>
                      {endDate || "DD/MM/YYYY"}
                    </Text>
                    <MaterialIcons name="event" size={18} color={colors.muted} />
                  </TouchableOpacity>
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

      {/* Date Selection Modal */}
      <Modal
        visible={isDatePickerOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setIsDatePickerOpen(false)}
      >
        <View className="flex-1 justify-end bg-black bg-opacity-60">
          <View className="bg-background rounded-t-3xl border-t border-border pt-5 pb-10 px-5 shadow-2xl">
            {/* Header: Title & Close */}
            <View className="flex-row items-center justify-between mb-4 px-2">
              <Text className="text-foreground font-bold text-xl">
                {pickerField === "date" ? "Selecionar Data" : "Selecionar Data de Término"}
              </Text>
              <TouchableOpacity onPress={() => setIsDatePickerOpen(false)} className="p-2 bg-surface rounded-full">
                <MaterialIcons name="close" size={24} color={colors.foreground} />
              </TouchableOpacity>
            </View>

            {/* Month & Year Navigation */}
            <View className="flex-row items-center justify-between px-2 mb-4 bg-surface rounded-xl py-2 border border-border">
              <TouchableOpacity onPress={handlePrevMonth} className="p-2">
                <MaterialIcons name="chevron-left" size={28} color={colors.foreground} />
              </TouchableOpacity>

              <Text className="text-foreground font-bold text-base">
                {MONTH_NAMES[pickerMonth]} de {pickerYear}
              </Text>

              <TouchableOpacity onPress={handleNextMonth} className="p-2">
                <MaterialIcons name="chevron-right" size={28} color={colors.foreground} />
              </TouchableOpacity>
            </View>

            {/* Weekdays Row */}
            <View className="flex-row mb-2">
              {["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"].map((dayName) => (
                <View key={dayName} style={{ width: "14.28%" }} className="items-center py-1">
                  <Text className="text-muted font-bold text-xs uppercase">{dayName}</Text>
                </View>
              ))}
            </View>

            {/* Days Grid */}
            <View className="flex-row flex-wrap mb-6">
              {daysArray.map((day, idx) => {
                if (day === null) {
                  return <View key={`empty-${idx}`} style={{ width: "14.28%", aspectRatio: 1 }} />;
                }

                const isSelected = parsedCurrent &&
                  parsedCurrent.getDate() === day &&
                  parsedCurrent.getMonth() === pickerMonth &&
                  parsedCurrent.getFullYear() === pickerYear;

                return (
                  <TouchableOpacity
                    key={`day-${day}`}
                    onPress={() => handleDaySelect(day)}
                    style={{ width: "14.28%", aspectRatio: 1 }}
                    className="justify-center items-center"
                  >
                    <View
                      className={`w-9 h-9 rounded-full justify-center items-center ${isSelected ? "bg-primary" : ""
                        }`}
                    >
                      <Text
                        className={`font-semibold text-sm ${isSelected ? "text-white" : "text-foreground"
                          }`}
                      >
                        {day}
                      </Text>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Bottom Actions */}
            <View className="flex-row gap-4 px-2">
              <TouchableOpacity
                onPress={handleSelectToday}
                className="flex-1 bg-surface border border-border rounded-xl py-3.5 items-center justify-center"
              >
                <Text className="text-foreground font-bold text-sm">Hoje</Text>
              </TouchableOpacity>

              {pickerField === "endDate" && endDate ? (
                <TouchableOpacity
                  onPress={handleClearDate}
                  className="flex-1 bg-error bg-opacity-10 border border-error rounded-xl py-3.5 items-center justify-center"
                >
                  <Text className="text-error font-bold text-sm">Limpar</Text>
                </TouchableOpacity>
              ) : null}
            </View>
          </View>
        </View>
      </Modal>

    </ScreenContainer>
  );
}
