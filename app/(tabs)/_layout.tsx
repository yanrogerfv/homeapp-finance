import { Tabs, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { View, Platform } from "react-native";
import { HapticTab } from "@/components/haptic-tab";
import { MaterialIcons } from "@expo/vector-icons";
import { useThemeContext } from "@/lib/theme-provider";
import { SchemeColors } from "@/constants/theme";

export default function TabLayout() {
  const { colorScheme } = useThemeContext();
  const colors = SchemeColors[colorScheme];
  const insets = useSafeAreaInsets();
  const bottomPadding = Platform.OS === "web" ? 12 : Math.max(insets.bottom, 8);
  const tabBarHeight = 64 + bottomPadding;
  const router = useRouter();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.muted,
        headerShown: false,
        tabBarButton: HapticTab,
        tabBarStyle: {
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          paddingTop: 8,
          paddingBottom: bottomPadding,
          height: tabBarHeight,
          backgroundColor: colors.background,
          borderTopColor: colors.border,
          borderTopWidth: 1,
          borderTopLeftRadius: 24,
          borderTopRightRadius: 24,
          elevation: 10,
          shadowColor: "#000",
          shadowOffset: { width: 0, height: -4 },
          shadowOpacity: 0.1,
          shadowRadius: 10,
        },
        tabBarShowLabel: true,
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: "600",
          marginTop: 4,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Início",
          tabBarIcon: ({ color }) => <MaterialIcons name="dashboard" size={26} color={color} />,
        }}
      />
      <Tabs.Screen
        name="transactions"
        options={{
          title: "Despesas",
          tabBarIcon: ({ color }) => <MaterialIcons name="receipt-long" size={26} color={color} />,
        }}
      />
      <Tabs.Screen
        name="add"
        options={{
          title: "",
          tabBarIcon: () => (
            <View
              style={{
                width: 56,
                height: 56,
                borderRadius: 28,
                backgroundColor: colors.primary,
                alignItems: "center",
                justifyContent: "center",
                marginBottom: 24,
                shadowColor: colors.primary,
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.4,
                shadowRadius: 8,
                elevation: 5,
              }}
            >
              <MaterialIcons name="add" size={32} color="#fff" />
            </View>
          ),
        }}
        listeners={() => ({
          tabPress: (e) => {
            e.preventDefault();
            router.push("/add-transaction");
          },
        })}
      />
      <Tabs.Screen
        // name="shopping"
        name="reports"
        options={{
          // title: "Compras",
          // tabBarIcon: ({ color }) => <MaterialIcons name="shopping-cart" size={26} color={color} />,
          title: "Relatórios",
          tabBarIcon: ({ color }) => <MaterialIcons name="bar-chart" size={26} color={color} />,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: "Ajustes",
          tabBarIcon: ({ color }) => <MaterialIcons name="settings" size={26} color={color} />,
        }}
      />

      {/* Hide the old routes from the bottom tab bar */}
      <Tabs.Screen
        name="shopping"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="add-transaction"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="transaction/[id]"
        options={{
          href: null,
        }}
      />
    </Tabs>
  );
}
