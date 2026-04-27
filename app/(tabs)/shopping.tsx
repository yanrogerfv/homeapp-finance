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
        { text: "Cancelar", onPress: () => { } },
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
      className={`flex-row items-center justify-between p-5 rounded-3xl border border-border shadow-sm mb-4 ${item.isPurchased ? "bg-background opacity-60" : "bg-surface"
        }`}
    >
      <TouchableOpacity
        onPress={() => handleToggleItem(item.id)}
        className="flex-row items-center flex-1"
      >
        <View
          className={`w-[46px] h-[46px] rounded-2xl items-center justify-center mr-4 shadow-sm border ${item.isPurchased ? "border-success bg-success" : "border-border bg-background"
            }`}
        >
          {item.isPurchased ? (
            <MaterialIcons name="check" size={22} color="#ffffff" />
          ) : (
            <MaterialIcons name="radio-button-unchecked" size={22} color={colors.muted} />
          )}
        </View>

        <View className="flex-1 pr-2">
          <Text
            className={`font-bold text-base ${item.isPurchased ? "text-muted line-through" : "text-foreground"
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
        className="p-3 rounded-2xl"
        style={{ backgroundColor: colors.error + '1A' }} // 1A = 10% opacity in hex
      >
        <MaterialIcons name="delete-outline" size={22} color={colors.error} />
      </TouchableOpacity>
    </View>
  );

  return (
    <ScreenContainer className="bg-background">
      <ScrollView contentContainerStyle={{ flexGrow: 1, paddingBottom: 100 }} className="px-4 py-6">
        <View className="gap-6">
          {/* Header */}
          <View className="flex-row justify-between items-center mb-4">
            <View>
              <Text className="text-muted text-xs font-bold uppercase tracking-widest mb-1">
                Sua Casa
              </Text>
              <Text className="text-3xl font-extrabold text-foreground">Compras</Text>
            </View>
            <View
              className="w-12 h-12 rounded-full items-center justify-center bg-surface border border-border shadow-sm"
              style={{ elevation: 2 }}
            >
              <MaterialIcons name="local-grocery-store" size={24} color={colors.primary} />
            </View>
          </View>

          <View className="flex-row justify-between items-end mb-2 px-1">
            <Text className="text-sm font-bold text-muted uppercase tracking-widest">
              {unpurchasedItems.length} itens a comprar
            </Text>
          </View>

          {/* Add Item Form */}
          <View className="bg-surface rounded-3xl p-6 shadow-sm border border-border mb-2" style={{ elevation: 2 }}>
            <Text className="text-foreground font-extrabold text-xs mb-4 uppercase tracking-widest">Adicionar à Lista</Text>

            <TextInput
              placeholder="Ex: Leite"
              placeholderTextColor={colors.muted}
              value={newItemTitle}
              onChangeText={setNewItemTitle}
              className="bg-background border border-border rounded-xl px-5 py-4 text-foreground font-bold mb-4 shadow-sm"
            />

            <View className="flex-row gap-3">
              <View className="flex-1 flex-row bg-background border border-border rounded-xl shadow-sm overflow-hidden">
                <TextInput
                  placeholder="Qtd"
                  placeholderTextColor={colors.muted}
                  value={newItemQuantity}
                  onChangeText={setNewItemQuantity}
                  keyboardType="number-pad"
                  className="flex-1 px-5 py-4 text-foreground font-bold border-r border-border"
                />
                <TextInput
                  placeholder="UN"
                  placeholderTextColor={colors.muted}
                  value={newItemUnit}
                  onChangeText={setNewItemUnit}
                  defaultValue="un"
                  className="w-16 px-3 py-4 text-foreground font-bold text-center uppercase text-sm"
                />
              </View>

              <TouchableOpacity
                onPress={handleAddItem}
                className="bg-primary rounded-xl px-6 items-center justify-center shadow-sm"
              >
                <MaterialIcons name="add" size={28} color="#ffffff" />
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
            <View
              className="rounded-3xl p-8 items-center border shadow-sm mt-4"
              style={{
                backgroundColor: colors.success + '1A',
                borderColor: colors.success + '33'
              }}
            >
              <MaterialIcons name="shopping-bag" size={48} color={colors.success} className="mb-3" />
              <Text className="font-black text-xl text-center" style={{ color: colors.success }}>Tudo Comprado!</Text>
              <Text className="text-center text-sm font-bold opacity-80 mt-1" style={{ color: colors.success }}>Sua lista está zerada no momento.</Text>
            </View>
          )}

          {/* Purchased Items */}
          {purchasedItems.length > 0 && (
            <View className="mt-4">
              <View className="flex-row justify-between items-center mb-4 px-1">
                <Text className="text-lg font-bold text-foreground">Já Comprados</Text>
                <TouchableOpacity
                  onPress={handleClearPurchased}
                  className="px-4 py-2 rounded-full"
                  style={{ backgroundColor: colors.error + '1A' }}
                >
                  <Text className="font-bold text-[10px] uppercase tracking-widest" style={{ color: colors.error }}>Limpar Tudo</Text>
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
