import { ScrollView, View, Text, TouchableOpacity, Dimensions, Alert, ActivityIndicator } from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { MaterialIcons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useThemeContext } from "@/lib/theme-provider";
import { SchemeColors } from "@/constants/theme";
import { LineChart, PieChart } from "react-native-chart-kit";
import { useState, useCallback } from "react";
import { useFocusEffect } from "expo-router";
import { fetchExpenseReport, ExpensesReportResponse } from "@/lib/api";

const screenWidth = Dimensions.get("window").width;

export default function ReportsScreen() {
  const { colorScheme } = useThemeContext();
  const colors = SchemeColors[colorScheme];

  const [loading, setLoading] = useState(true);
  const [reportData, setReportData] = useState<ExpensesReportResponse | null>(null);

  useFocusEffect(
    useCallback(() => {
      loadReport();
    }, [])
  );

  const loadReport = async () => {
    try {
      setLoading(true);
      const data = await fetchExpenseReport();
      setReportData(data);
    } catch (e) {
      console.log(e);
      Alert.alert("Erro", "Não foi possível carregar os relatórios.");
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async () => {
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      Alert.alert(
        "Sucesso",
        "Relatório exportado e salvo nos seus arquivos!"
      );
    } catch (e) {
      console.log(e);
    }
  };

  const chartConfig = {
    backgroundGradientFrom: colors.surface,
    backgroundGradientTo: colors.surface,
    backgroundGradientFromOpacity: 0,
    backgroundGradientToOpacity: 0,
    color: (opacity = 1) => colors.primary,
    labelColor: (opacity = 1) => colors.muted,
    strokeWidth: 3,
    barPercentage: 0.5,
    useShadowColorFromDataset: false,
  };

  const formatCurrency = (val: number) =>
    `R$ ${val.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  if (loading || !reportData) {
    return (
      <ScreenContainer className="bg-background">
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color={colors.primary} />
          <Text className="text-muted font-bold mt-4">Gerando relatórios...</Text>
        </View>
      </ScreenContainer>
    );
  }

  // Formatting Line Chart Data
  const lineLabels = reportData.monthlyExpenses.length > 0
    ? reportData.monthlyExpenses.map(m => m.month)
    : ["-"];
  const lineValues = reportData.monthlyExpenses.length > 0
    ? reportData.monthlyExpenses.map(m => m.totalExpense)
    : [0];

  // Formatting Pie Chart Data
  const pieChartColors = [
    colors.primary,
    colors.success,
    "#F59E0B", // amber
    colors.muted,
    "#EC4899", // pink
    "#14B8A6", // teal
    "#8B5CF6"  // purple
  ];
  const pieData = reportData.categoryExpenses.length > 0
    ? reportData.categoryExpenses.map((c, idx) => ({
      name: c.category,
      population: c.totalAmount,
      color: pieChartColors[idx % pieChartColors.length],
      legendFontColor: colors.foreground,
      legendFontSize: 12,
    }))
    : [
      {
        name: "Sem dados",
        population: 1,
        color: colors.muted,
        legendFontColor: colors.foreground,
        legendFontSize: 12,
      }
    ];

  const resume = reportData.monthExpensesResume;

  return (
    <ScreenContainer className="bg-background">
      <ScrollView
        contentContainerStyle={{ flexGrow: 1, paddingBottom: 100 }}
        className="px-4 py-6"
        showsVerticalScrollIndicator={false}
      >
        <View className="gap-6">
          {/* Header */}
          <View className="flex-row justify-between items-center mb-4">
            <View>
              <Text className="text-muted text-xs font-bold uppercase tracking-widest mb-1">
                Análise Financeira
              </Text>
              <Text className="text-3xl font-extrabold text-foreground">Relatórios</Text>
            </View>
            <View
              className="w-12 h-12 rounded-full items-center justify-center bg-surface border border-border shadow-sm"
              style={{ elevation: 2 }}
            >
              <MaterialIcons name="bar-chart" size={24} color={colors.primary} />
            </View>
          </View>

          {/* Quick Stats */}
          <View className="flex-row gap-4 mb-2">
            <View className="flex-1 bg-surface rounded-3xl p-5 border border-border shadow-sm" style={{ elevation: 2 }}>
              <View
                className="w-10 h-10 rounded-full items-center justify-center mb-3"
                style={{ backgroundColor: colors.primary + "1A" }}
              >
                <MaterialIcons name="trending-up" size={20} color={colors.primary} />
              </View>
              <Text className="text-muted text-[10px] font-bold uppercase tracking-widest mb-1" numberOfLines={1}>Gasto Mensal</Text>
              <Text className="text-foreground text-lg font-black">{formatCurrency(resume.monthTotalExpenses)}</Text>
            </View>
            <View className="flex-1 bg-surface rounded-3xl p-5 border border-border shadow-sm" style={{ elevation: 2 }}>
              <View
                className="w-10 h-10 rounded-full items-center justify-center mb-3"
                style={{ backgroundColor: colors.error + "1A" }}
              >
                <MaterialIcons name="warning" size={20} color={colors.error} />
              </View>
              <Text className="text-muted text-[10px] font-bold uppercase tracking-widest mb-1" numberOfLines={1}>Maior Despesa</Text>
              <Text className="text-foreground text-lg font-black" numberOfLines={1}>{resume.biggestExpenseTitle || "Nenhuma"}</Text>
            </View>
          </View>

          {/* Line Chart */}
          <View className="bg-surface rounded-3xl p-5 border border-border shadow-sm overflow-hidden items-center" style={{ elevation: 2 }}>
            <View className="w-full flex-row justify-between items-center mb-4">
              <Text className="text-foreground font-extrabold text-sm uppercase tracking-widest">Histórico</Text>
              <Text className="text-muted text-xs font-bold">Evolução Mensal</Text>
            </View>
            <LineChart
              data={{
                labels: lineLabels,
                datasets: [
                  {
                    data: lineValues,
                  },
                ],
              }}
              width={screenWidth - 80}
              height={220}
              chartConfig={chartConfig}
              bezier
              style={{
                marginVertical: 8,
                borderRadius: 16,
                marginLeft: -10,
              }}
              withInnerLines={false}
              withOuterLines={false}
              withShadow={false}
            />
          </View>

          {/* Pie Chart */}
          <View className="bg-surface rounded-3xl p-5 border border-border shadow-sm overflow-hidden items-center" style={{ elevation: 2 }}>
            <View className="w-full flex-row justify-between items-center mb-4">
              <Text className="text-foreground font-extrabold text-sm uppercase tracking-widest">Categorias</Text>
              <Text className="text-muted text-xs font-bold">Mês Atual</Text>
            </View>
            <PieChart
              data={pieData}
              width={screenWidth - 72}
              height={180}
              chartConfig={chartConfig}
              accessor={"population"}
              backgroundColor={"transparent"}
              paddingLeft={"0"}
              absolute
            />
          </View>

          {/* Export Button */}
          {/* <TouchableOpacity
            onPress={handleExport}
            className="mt-4 bg-primary rounded-2xl flex-row items-center justify-center p-4 shadow-md"
            style={{ elevation: 4 }}
          >
            <MaterialIcons name="file-download" size={24} color="#ffffff" className="mr-2" />
            <Text className="text-white font-bold text-base ml-2">Exportar Relatório (PDF)</Text>
          </TouchableOpacity> */}
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
