import * as React from "react";
import { Area, AreaChart, CartesianGrid, XAxis } from "recharts";

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
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface MonthlySpending {
  month: string;
  expenses: number;
  income: number;
  label?: string;
}

interface Props {
  data?: MonthlySpending[];
  loading?: boolean;
}

const chartConfig = {
  visitors: {
    label: "Visitors",
  },
  desktop: {
    label: "Entradas",
    color: "var(--chart-2)",
  },
  mobile: {
    label: "Saídas",
    color: "var(--chart-1-purple)",
  },
} satisfies ChartConfig;

// Mock data for fallback
const mockData = [
  { month: "Jan", expenses: 2200, income: 3500 },
  { month: "Feb", expenses: 1800, income: 3500 },
  { month: "Mar", expenses: 2400, income: 3500 },
  { month: "Apr", expenses: 2000, income: 3500 },
  { month: "May", expenses: 2600, income: 3500 },
  { month: "Jun", expenses: 2100, income: 3500 },
];

export const InteractiveAreaChartWithAPI: React.FC<Props> = ({
  data,
  loading,
}) => {
  const [timeRange, setTimeRange] = React.useState("90d");

  // Process API data or use mock data
  const chartData = React.useMemo(() => {
    if (data && data.length > 0) {
      return data.map((item) => ({
        date: item.month, // Keep full date for filtering
        desktop: Math.abs(item.income), // Desktop = Income (Entradas)
        mobile: Math.abs(item.expenses), // Mobile = Expenses (Saídas)
        label:
          item.label ||
          new Date(item.month).toLocaleDateString("pt-BR", { month: "short" }),
      }));
    }
    return mockData.map((item) => ({
      date: `2025-${String(mockData.indexOf(item) + 1).padStart(2, "0")}-01`,
      desktop: item.income,
      mobile: item.expenses,
      label: item.month,
    }));
  }, [data]);

  // Filter data based on time range
  const filteredData = React.useMemo(() => {
    if (!chartData.length) return chartData;

    let monthsToShow = 3;
    if (timeRange === "30d") {
      monthsToShow = 1;
    } else if (timeRange === "7d") {
      monthsToShow = 1;
    }

    return chartData.slice(-monthsToShow);
  }, [chartData, timeRange]);

  if (loading) {
    return (
      <Card
        style={{
          backgroundColor: "#292929",
          borderColor: "#1e1e1e",
          boxShadow: "0 4px 12px rgba(0, 0, 0, 0.3)",
        }}
      >
        <CardHeader className="flex items-center gap-2 space-y-0 py-5 sm:flex-row">
          <div className="grid flex-1 gap-1 text-center sm:text-left">
            <CardTitle className="text-[#ffff]">Faturas por mês</CardTitle>
            <CardDescription style={{ color: "#cccccc" }}>
              Carregando dados...
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="px-2 pt-4 sm:px-6 sm:pt-6">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card
      style={{
        backgroundColor: "#292929",
        borderColor: "#1e1e1e",
        boxShadow: "0 4px 12px rgba(0, 0, 0, 0.3)",
      }}
    >
      <CardHeader className="flex items-center justify-between gap-2 space-y-0 py-5 sm:flex-row w-full">
        <div className="grid flex-1 gap-1 text-center sm:text-left">
          <CardTitle className="text-[#ffff]">Faturas por mês</CardTitle>
          <CardDescription style={{ color: "#cccccc" }}>
            Mostra os valores das entradas e saídas nos últimos meses.
          </CardDescription>
        </div>
        <Select value={timeRange} onValueChange={setTimeRange}>
          <SelectTrigger
            className="w-[160px] rounded-lg"
            aria-label="Select a value"
            style={{ color: "#fff", marginLeft: "auto" }}
          >
            <SelectValue placeholder="Últimos 3 meses" />
          </SelectTrigger>
          <SelectContent className="rounded-xl" style={{ color: "#fff" }}>
            <SelectItem value="90d" className="rounded-lg hover:bg-gray-700">
              Últimos 3 meses
            </SelectItem>
            <SelectItem value="30d" className="rounded-lg hover:bg-gray-700">
              Últimos 30 dias
            </SelectItem>
            <SelectItem value="7d" className="rounded-lg hover:bg-gray-700">
              Últimos 7 dias
            </SelectItem>
          </SelectContent>
        </Select>
      </CardHeader>
      <CardContent className="px-2 pt-4 sm:px-6 sm:pt-6">
        <ChartContainer
          config={chartConfig}
          className="aspect-auto h-[250px] w-full"
        >
          <AreaChart data={filteredData}>
            <defs>
              <linearGradient id="fillDesktop" x1="0" y1="0" x2="0" y2="1">
                <stop
                  offset="5%"
                  stopColor="var(--color-desktop)"
                  stopOpacity={0.8}
                />
                <stop
                  offset="95%"
                  stopColor="var(--color-desktop)"
                  stopOpacity={0.1}
                />
              </linearGradient>
              <linearGradient id="fillMobile" x1="0" y1="0" x2="0" y2="1">
                <stop
                  offset="5%"
                  stopColor="var(--color-mobile)"
                  stopOpacity={0.8}
                />
                <stop
                  offset="95%"
                  stopColor="var(--color-mobile)"
                  stopOpacity={0.1}
                />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="date"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              minTickGap={32}
              tickFormatter={(value) => {
                const date = new Date(value);
                return date.toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                });
              }}
            />
            <ChartTooltip
              cursor={false}
              content={
                <ChartTooltipContent
                  labelFormatter={(value) => {
                    return new Date(value).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                    });
                  }}
                  indicator="dot"
                />
              }
            />
            <Area
              dataKey="mobile"
              type="natural"
              fill="url(#fillMobile)"
              stroke="var(--color-mobile)"
              stackId="a"
            />
            <Area
              dataKey="desktop"
              type="natural"
              fill="url(#fillDesktop)"
              stroke="var(--color-desktop)"
              stackId="a"
            />
            <ChartLegend content={<ChartLegendContent />} />
          </AreaChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
};
