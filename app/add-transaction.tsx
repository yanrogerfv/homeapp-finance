import {
  ScrollView,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from "react-native";
import { useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { useFinance } from "@/lib/finance-context";
import { useState, useEffect } from "react";
import { MaterialIcons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useThemeContext } from "@/lib/theme-provider";
import { SchemeColors } from "@/constants/theme";
import { fetchHousemates, addExpense } from "@/lib/api";

export default function AddTransactionScreen() {
  const router = useRouter();
  const { addTransaction } = useFinance();
  const { colorScheme } = useThemeContext();
  const colors = SchemeColors[colorScheme];

  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [dueDate, setDueDate] = useState(new Date().toISOString().split("T")[0]);
  const [category, setCategory] = useState("");
  const [responsible, setResponsible] = useState("");
  const [divisionType, setDivisionType] = useState<"equal" | "manual">("equal");
  
  const [housemates, setHousemates] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchHousemates().then(setHousemates).catch(console.error);
  }, []);

  const expenseCategories = [
    "Aluguel",
    "Água/Luz/Gás",
    "Internet",
    "Mercado",
    "Manutenção",
    "Faxina",
    "Outros",
  ];

  const handleSave = async () => {
    if (!amount || !description || !category || !responsible) {
      Alert.alert("Erro", "Por favor preencha todos os campos obrigatórios");
      return;
    }

    setLoading(true);
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      
      const expenseData = {
        type: "expense" as const,
        amount: parseFloat(amount),
        description,
        category,
        date: dueDate,
        dueDate,
        status: "pending" as const,
        responsible,
        divisionType,
        isPeriodic: false,
      };

      // Call API
      await addExpense(expenseData);
      
      // Update Context
      await addTransaction(expenseData);

      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.back();
    } catch (error) {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert("Erro", "Falha ao salvar despesa");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScreenContainer className="bg-background flex-1">
      <View className="flex-row items-center justify-between px-4 pt-4 pb-2 border-b border-border bg-background">
        <TouchableOpacity onPress={() => router.back()} className="p-2">
          <Text className="text-primary font-bold text-base">Cancelar</Text>
        </TouchableOpacity>
        <Text className="text-foreground font-bold text-lg">Nova Despesa</Text>
        <TouchableOpacity onPress={handleSave} disabled={loading} className="p-2">
          {loading ? (
            <ActivityIndicator size="small" color={colors.primary} />
          ) : (
            <Text className="text-primary font-bold text-base">Adicionar</Text>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={{ flexGrow: 1 }} className="px-4 py-4" keyboardShouldPersistTaps="handled">
        <View className="gap-6 pb-12">
          
          {/* Amount */}
          <View className="items-center py-4">
            <Text className="text-muted font-bold text-sm mb-2 uppercase tracking-wide">Valor da Despesa</Text>
            <View className="flex-row items-center justify-center">
              <Text className="text-foreground font-extrabold text-3xl mr-2">R$</Text>
              <TextInput
                placeholder="0.00"
                placeholderTextColor={colors.muted}
                value={amount}
                onChangeText={setAmount}
                keyboardType="decimal-pad"
                editable={!loading}
                className="text-foreground font-extrabold text-5xl text-center"
                style={{ minWidth: 120 }}
              />
            </View>
          </View>

          {/* Form Fields container */}
          <View className="bg-surface rounded-2xl border border-border shadow-sm overflow-hidden">
            
            {/* Description */}
            <View className="px-5 py-4 border-b border-border">
              <Text className="text-muted font-bold text-xs mb-1 uppercase tracking-wider">Título da Despesa</Text>
              <TextInput
                placeholder="Ex: Conta de Luz"
                placeholderTextColor={colors.muted}
                value={description}
                onChangeText={setDescription}
                editable={!loading}
                className="text-foreground font-bold text-lg"
              />
            </View>

            {/* Due Date */}
            <View className="px-5 py-4 border-b border-border">
              <Text className="text-muted font-bold text-xs mb-1 uppercase tracking-wider">Data de Vencimento</Text>
              <TextInput
                placeholder="YYYY-MM-DD"
                placeholderTextColor={colors.muted}
                value={dueDate}
                onChangeText={setDueDate}
                editable={!loading}
                className="text-foreground font-bold text-lg"
              />
            </View>

          </View>

          {/* Category */}
          <View>
            <Text className="text-foreground font-bold text-base mb-3 ml-1">Categoria</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} className="pl-1">
              {expenseCategories.map((cat) => (
                <TouchableOpacity
                  key={cat}
                  onPress={() => setCategory(cat)}
                  className={`px-4 py-2.5 rounded-xl mr-2 ${
                    category === cat
                      ? "bg-primary border border-primary"
                      : "bg-surface border border-border"
                  }`}
                >
                  <Text
                    className={`font-bold text-sm ${
                      category === cat ? "text-white" : "text-muted"
                    }`}
                  >
                    {cat}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          {/* Responsible Housemate */}
          <View>
            <Text className="text-foreground font-bold text-base mb-3 ml-1">Responsável pelo Pagamento</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} className="pl-1 pb-1">
              {housemates.map((person) => (
                <TouchableOpacity
                  key={person.id}
                  onPress={() => setResponsible(person.id)}
                  className={`flex-row items-center px-4 py-2 rounded-xl mr-3 ${
                    responsible === person.id
                      ? "bg-primary border border-primary"
                      : "bg-surface border border-border bg-opacity-50"
                  }`}
                >
                  <Text
                    className={`font-bold text-sm ${
                      responsible === person.id ? "text-white" : "text-foreground"
                    }`}
                  >
                    {person.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          {/* Division Type */}
          <View>
            <Text className="text-foreground font-bold text-base mb-3 ml-1">Divisão da Despesa</Text>
            <View className="flex-row gap-3">
              <TouchableOpacity
                onPress={() => setDivisionType("equal")}
                className={`flex-1 flex-row items-center justify-center py-4 rounded-xl border ${
                  divisionType === "equal" ? "bg-primary bg-opacity-10 border-primary" : "bg-surface border-border"
                }`}
              >
                <MaterialIcons name="group" size={20} color={divisionType === "equal" ? colors.primary : colors.muted} className="mr-2" />
                <Text className={`font-bold ${divisionType === "equal" ? "text-primary" : "text-muted"}`}>Igual para todos</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                onPress={() => setDivisionType("manual")}
                className={`flex-1 flex-row items-center justify-center py-4 rounded-xl border ${
                  divisionType === "manual" ? "bg-primary bg-opacity-10 border-primary" : "bg-surface border-border"
                }`}
              >
                <MaterialIcons name="edit-note" size={20} color={divisionType === "manual" ? colors.primary : colors.muted} className="mr-2" />
                <Text className={`font-bold ${divisionType === "manual" ? "text-primary" : "text-muted"}`}>Divisão Manual</Text>
              </TouchableOpacity>
            </View>
          </View>

        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
