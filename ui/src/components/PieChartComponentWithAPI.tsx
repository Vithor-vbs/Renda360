import * as React from "react";
import { Label, Pie, PieChart } from "recharts";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";

interface SpendingByCategory {
  category: string;
  amount: number;
}

interface Props {
  data?: SpendingByCategory[];
  loading?: boolean;
}

// Mock data for fallback - matching the reference component structure
const mockData = [
  { browser: "Utilidade", visitors: 275, fill: "#008236" },
  { browser: "Alimentação", visitors: 200, fill: "#6E11B0" },
  { browser: "Transporte", visitors: 287, fill: "#7BF1A8" },
  { browser: "Aluguel", visitors: 173, fill: "#5EF72D" },
  { browser: "Outros", visitors: 190, fill: "#AD46FF" },
];

const chartConfig = {
  visitors: {
    label: "Visitors",
  },
  chrome: {
    label: "Chrome",
    color: "hsl(var(--chart-1))",
  },
  safari: {
    label: "Safari",
    color: "hsl(var(--chart-2))",
  },
  firefox: {
    label: "Firefox",
    color: "hsl(var(--chart-3))",
  },
  edge: {
    label: "Edge",
    color: "hsl(var(--chart-4))",
  },
  other: {
    label: "Other",
    color: "hsl(var(--chart-5))",
  },
} satisfies ChartConfig;

// Color palette for dynamic categories - expanded for more variety
const colors = [
  "#008236", // Green
  "#6E11B0", // Purple
  "#7BF1A8", // Light Green
  "#5EF72D", // Bright Green
  "#AD46FF", // Light Purple
  "#FF6B6B", // Red
  "#4ECDC4", // Teal
  "#45B7D1", // Blue
  "#FFA07A", // Orange
  "#98D8C8", // Mint
  "#FF9F43", // Orange
  "#70A1FF", // Light Blue
];

// Category name mapping for better display - matches PDF extractor TransactionCategory enum
const categoryNames: Record<string, string> = {
  food_delivery: "Delivery de Comida",
  restaurants: "Restaurantes",
  groceries: "Supermercado",
  transport: "Transporte",
  fuel: "Combustível",
  shopping_online: "Compras Online",
  shopping_physical: "Compras Físicas",
  entertainment: "Entretenimento",
  subscriptions: "Assinaturas",
  utilities: "Utilidades",
  health: "Saúde",
  education: "Educação",
  financial_services: "Serviços Financeiros",
  others: "Outros",
  // Legacy mappings for backward compatibility
  food: "Alimentação",
};

export const PieChartComponentWithAPI: React.FC<Props> = ({
  data,
  loading,
}) => {
  // Process API data or use mock data
  const chartData = React.useMemo(() => {
    if (data && data.length > 0) {
      return data.map((item, index) => ({
        browser: categoryNames[item.category] || item.category, // Use friendly name or fallback to original
        visitors: Math.abs(item.amount), // Ensure positive values
        fill: colors[index % colors.length],
      }));
    }
    return mockData;
  }, [data]);

  const totalVisitors = React.useMemo(() => {
    return chartData.reduce((acc, curr) => acc + curr.visitors, 0);
  }, [chartData]);

  if (loading) {
    return (
      <Card
        className="flex flex-col mt-8"
        style={{
          backgroundColor: "#292929",
          borderColor: "#292929",
          boxShadow: "0 4px 12px rgba(0, 0, 0, 0.3)",
          maxWidth: "20vw",
        }}
      >
        <CardHeader className="items-center pb-0">
          <CardTitle className="text-[#ffff]">Gráfico Categorias</CardTitle>
          <CardDescription style={{ color: "#cccccc" }}>
            Carregando dados...
          </CardDescription>
        </CardHeader>
        <CardContent className="flex-1 pb-0">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card
      className="flex flex-col mt-8"
      style={{
        backgroundColor: "#292929",
        borderColor: "#292929",
        boxShadow: "0 4px 12px rgba(0, 0, 0, 0.3)",
        maxWidth: "20vw",
      }}
    >
      <CardHeader className="items-center pb-0">
        <CardTitle className="text-[#ffff]">Gráfico Categorias</CardTitle>
        <CardDescription style={{ color: "#cccccc" }}>
          {data && data.length > 0
            ? "Mostra os gastos por categoria nos ultimos 30 dias."
            : "Mostra os gastos por categoria nos ultimos 30 dias."}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex-1 pb-0">
        <ChartContainer
          config={chartConfig}
          className="mx-auto aspect-square max-h-[250px]"
        >
          <PieChart>
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent hideLabel />}
            />
            <Pie
              data={chartData}
              dataKey="visitors"
              nameKey="browser"
              innerRadius={60}
              strokeWidth={5}
            >
              <Label
                content={({ viewBox }) => {
                  if (viewBox && "cx" in viewBox && "cy" in viewBox) {
                    return (
                      <text
                        x={viewBox.cx}
                        y={viewBox.cy}
                        textAnchor="middle"
                        dominantBaseline="middle"
                      >
                        <tspan
                          x={viewBox.cx}
                          y={viewBox.cy}
                          className="fill-[#fff] text-3xl font-bold"
                        >
                          {totalVisitors.toLocaleString()}
                        </tspan>
                        <tspan
                          x={viewBox.cx}
                          y={(viewBox.cy || 0) + 24}
                          className="fill-muted-foreground"
                          style={{ fill: "darkgrey" }}
                        >
                          Gasto
                        </tspan>
                      </text>
                    );
                  }
                }}
              />
            </Pie>
          </PieChart>
        </ChartContainer>

        {/* Legend - Category colors */}
        <div className="flex flex-wrap gap-3 justify-center mt-4 px-4">
          {chartData.map((item) => (
            <div key={item.browser} className="flex items-center gap-2">
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: item.fill }}
              />
              <span className="text-sm" style={{ color: "#cccccc" }}>
                {item.browser}
              </span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
