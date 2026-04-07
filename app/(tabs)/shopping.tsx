import { ScrollView, View, Text, TouchableOpacity, TextInput, FlatList, Alert } from "react-native";
import { useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { useShopping } from "@/lib/shopping-context";
import { useState } from "react";
import { MaterialIcons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useThemeContext } from "@/lib/theme-provider";
import { SchemeColors } from "@/constants/theme";

export default function ShoppingListScreen() {
  const router = useRouter();
  const { state: shoppingState, addItem, toggleItem, deleteItem, clearPurchased } = useShopping();
  const { colorScheme } = useThemeContext();
  const colors = SchemeColors[colorScheme];

  const [newItemTitle, setNewItemTitle] = useState("");
  const [newItemQuantity, setNewItemQuantity] = useState("");
  const [newItemUnit, setNewItemUnit] = useState("un");

  const unpurchasedItems = shoppingState.items.filter((item) => !item.isPurchased);
  const purchasedItems = shoppingState.items.filter((item) => item.isPurchased);

  const handleAddItem = async () => {
    if (!newItemTitle.trim()) {
      Alert.alert("Erro", "Por favor digite o nome do item");
      return;
    }

    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      const quantity = newItemQuantity ? parseInt(newItemQuantity) : undefined;
      await addItem(newItemTitle, quantity, newItemUnit);
      setNewItemTitle("");
      setNewItemQuantity("");
      setNewItemUnit("un");
    } catch (error) {
      Alert.alert("Erro", "Falha ao adicionar o item");
    }
  };

  const handleToggleItem = async (id: string) => {
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      await toggleItem(id);
    } catch (error) {
      Alert.alert("Erro", "Falha ao atualizar o item");
    }
  };

  const handleDeleteItem = async (id: string) => {
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      await deleteItem(id);
    } catch (error) {
      Alert.alert("Erro", "Falha ao apagar o item");
    }
  };

  const handleClearPurchased = async () => {
    Alert.alert(
      "Limpar Comprados",
      "Tem certeza de que deseja remover todos os itens já comprados?",
      [
        { text: "Cancelar", onPress: () => {} },
        {
          text: "Limpar",
          onPress: async () => {
            try {
              await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              await clearPurchased();
            } catch (error) {
              Alert.alert("Erro", "Falha ao limpar itens");
            }
          },
        },
      ]
    );
  };

  const renderItem = ({ item }: { item: any }) => (
    <View
      className={`flex-row items-center justify-between p-4 rounded-2xl border border-border shadow-sm mb-3 ${
        item.isPurchased ? "bg-background opacity-60" : "bg-surface"
      }`}
    >
      <TouchableOpacity
        onPress={() => handleToggleItem(item.id)}
        className="flex-row items-center flex-1"
      >
        <View
          className={`w-7 h-7 rounded-full border-2 items-center justify-center mr-4 ${
            item.isPurchased ? "bg-success border-success" : "border-muted"
          }`}
        >
          {item.isPurchased && (
            <MaterialIcons name="check" size={16} color="#ffffff" />
          )}
        </View>

        <View className="flex-1 pr-2">
          <Text
            className={`font-bold text-base ${
              item.isPurchased ? "text-muted line-through" : "text-foreground"
            }`}
          >
            {item.title}
          </Text>
          {item.quantity && (
            <Text className="text-muted text-xs font-semibold mt-1 uppercase tracking-widest">
              {item.quantity} {item.unit || "un"}
            </Text>
          )}
        </View>
      </TouchableOpacity>

      <TouchableOpacity
        onPress={() => handleDeleteItem(item.id)}
        className="p-2 bg-error bg-opacity-10 rounded-full"
      >
        <MaterialIcons name="delete-outline" size={20} color={colors.error} />
      </TouchableOpacity>
    </View>
  );

  return (
    <ScreenContainer className="bg-background">
      <ScrollView contentContainerStyle={{ flexGrow: 1, paddingBottom: 100 }} className="px-4 py-6">
        <View className="gap-6">
          {/* Header */}
          <View>
            <Text className="text-3xl font-bold text-foreground mb-1">Compras</Text>
            <Text className="text-sm font-medium text-muted">
              {unpurchasedItems.length} itens a comprar
            </Text>
          </View>

          {/* Add Item Form */}
          <View className="bg-surface rounded-3xl p-5 shadow-sm border border-border">
            <Text className="text-foreground font-bold text-base mb-3">Adicionar à Lista</Text>
            
            <TextInput
              placeholder="Ex: Leite"
              placeholderTextColor={colors.muted}
              value={newItemTitle}
              onChangeText={setNewItemTitle}
              className="bg-background border border-border rounded-xl px-4 py-3 text-foreground font-semibold mb-3 shadow-sm"
            />

            <View className="flex-row gap-3">
              <View className="flex-1 flex-row bg-background border border-border rounded-xl shadow-sm">
                <TextInput
                  placeholder="Qtd"
                  placeholderTextColor={colors.muted}
                  value={newItemQuantity}
                  onChangeText={setNewItemQuantity}
                  keyboardType="number-pad"
                  className="flex-1 px-4 py-3 text-foreground font-semibold border-r border-border"
                />
                <TextInput
                  placeholder="UN"
                  placeholderTextColor={colors.muted}
                  value={newItemUnit}
                  onChangeText={setNewItemUnit}
                  defaultValue="un"
                  className="w-16 px-3 py-3 text-foreground font-semibold text-center uppercase text-sm"
                />
              </View>
              
              <TouchableOpacity
                onPress={handleAddItem}
                className="bg-primary rounded-xl px-5 items-center justify-center shadow-sm"
              >
                <MaterialIcons name="add" size={24} color="#ffffff" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Unpurchased Items */}
          {unpurchasedItems.length > 0 ? (
            <View>
              <Text className="text-lg font-bold text-foreground mb-3 px-1">Faltam Comprar</Text>
              <FlatList
                data={unpurchasedItems}
                renderItem={renderItem}
                keyExtractor={(item) => item.id}
                scrollEnabled={false}
              />
            </View>
          ) : (
            <View className="bg-success bg-opacity-10 rounded-3xl p-6 items-center border border-success border-opacity-20 shadow-sm mt-4">
              <MaterialIcons name="shopping-bag" size={48} color={colors.success} className="mb-3" />
              <Text className="text-success font-extrabold text-lg text-center">Tudo Comprado!</Text>
              <Text className="text-success text-center text-sm font-medium opacity-80 mt-1">Sua lista está zerada no momento.</Text>
            </View>
          )}

          {/* Purchased Items */}
          {purchasedItems.length > 0 && (
            <View className="mt-4">
              <View className="flex-row justify-between items-center mb-3 px-1">
                <Text className="text-lg font-bold text-foreground">Já Comprados</Text>
                <TouchableOpacity onPress={handleClearPurchased} className="bg-error bg-opacity-10 px-3 py-1.5 rounded-full">
                  <Text className="text-error font-bold text-xs uppercase tracking-wider">Limpar Tudo</Text>
                </TouchableOpacity>
              </View>
              <FlatList
                data={purchasedItems}
                renderItem={renderItem}
                keyExtractor={(item) => item.id}
                scrollEnabled={false}
              />
            </View>
          )}
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
