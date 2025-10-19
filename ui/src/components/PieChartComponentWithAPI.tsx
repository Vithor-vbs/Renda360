"use client"

import * as React from "react"
import { Label, Pie, PieChart, Cell, Sector } from "recharts"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { type ChartConfig, ChartContainer, ChartTooltip } from "@/components/ui/chart"
import "./PieChartComponentWithAPI.css"

interface SpendingByCategory {
  category: string
  amount: number
}

interface Props {
  data?: SpendingByCategory[]
  loading?: boolean
}

// Mock data for fallback
const mockData = [
  { browser: "Utilidade", visitors: 275, fill: "#008236" },
  { browser: "Alimentação", visitors: 200, fill: "#6E11B0" },
  { browser: "Transporte", visitors: 287, fill: "#7BF1A8" },
  { browser: "Aluguel", visitors: 173, fill: "#5EF72D" },
  { browser: "Outros", visitors: 190, fill: "#AD46FF" },
]

const chartConfig = {
  visitors: {
    label: "Visitors",
  },
} satisfies ChartConfig

// Color palette for dynamic categories
const colors = [
  "#008236",
  "#6E11B0",
  "#7BF1A8",
  "#5EF72D",
  "#AD46FF",
  "#FF6B6B",
  "#4ECDC4",
  "#45B7D1",
  "#FFA07A",
  "#98D8C8",
  "#FF9F43",
  "#70A1FF",
]

// Category name mapping
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
  food: "Alimentação",
}

// Custom active shape for hover effect
const renderActiveShape = (props: any) => {
  const { cx, cy, innerRadius, outerRadius, startAngle, endAngle, fill } = props

  return (
    <g>
      <Sector
        cx={cx}
        cy={cy}
        innerRadius={innerRadius}
        outerRadius={outerRadius + 8}
        startAngle={startAngle}
        endAngle={endAngle}
        fill={fill}
        style={{
          filter: `drop-shadow(0 0 12px ${fill})`,
          transition: "all 0.3s ease",
        }}
      />
    </g>
  )
}

export const PieChartComponentWithAPI: React.FC<Props> = ({ data, loading }) => {

  const [activeIndex, setActiveIndex] = React.useState<number | null>(null)
  const [hoveredCategory, setHoveredCategory] = React.useState<string | null>(null)

  // Process API data or use mock data
  const chartData = React.useMemo(() => {
    if (data && data.length > 0) {
      return data.map((item, index) => ({
        browser: categoryNames[item.category] || item.category,
        visitors: Math.abs(item.amount),
        fill: colors[index % colors.length],
      }))
    }
    return mockData
  }, [data])

  const totalVisitors = React.useMemo(() => {
    return chartData.reduce((acc, curr) => acc + curr.visitors, 0)
  }, [chartData])

  const getPercentage = (value: number) => {
    return ((value / totalVisitors) * 100).toFixed(1)
  }

  if (loading) {
    return (
      <Card
        className="flex flex-col mt-8 border-0"
        style={{
          backgroundColor: "#292929",
          boxShadow: "0 8px 32px rgba(0, 0, 0, 0.4)",
          maxWidth: "20vw",
        }}
      >
        <CardHeader className="items-center pb-0">
          <CardTitle className="text-white text-xl font-semibold">Gráfico Categorias</CardTitle>
          <CardDescription className="text-gray-400">Carregando dados...</CardDescription>
        </CardHeader>
        <CardContent className="flex-1 pb-0">
          <div className="flex items-center justify-center h-64">
            <div className="relative">
              <div className="animate-spin rounded-full h-12 w-12 border-4 border-gray-700 border-t-purple-500"></div>
              <div className="absolute inset-0 rounded-full blur-xl bg-purple-500/20 animate-pulse"></div>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card
      className="flex flex-col mt-8 border-0 overflow-hidden"
      style={{
        backgroundColor: "#292929",
        boxShadow: "0 8px 32px rgba(0, 0, 0, 0.4)",
        maxWidth: "20vw",
        minHeight: "620px",
      }}
    >
      {/* Gradient overlay at top */}
      <div
        className="absolute top-0 left-0 right-0 h-32 opacity-30 pointer-events-none"
        style={{
          background: "linear-gradient(180deg, rgba(110, 17, 176, 0.2) 0%, transparent 100%)",
        }}
      />

      <CardHeader className="items-center pb-4 relative z-10">
        <CardTitle className="text-white text-xl font-semibold">Gráfico Categorias</CardTitle>
        <CardDescription className="text-gray-400 text-left">
          {data && data.length > 0
            ? "Mostra os gastos por categoria nos últimos 30 dias."
            : "Mostra os gastos por categoria nos últimos 30 dias."}
        </CardDescription>
      </CardHeader>

      <CardContent className="flex-1 pb-8 relative z-10">
        <ChartContainer config={chartConfig} className="mx-auto aspect-square max-h-[300px] relative">
          <PieChart>
            <ChartTooltip
              cursor={false}
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const data = payload[0]
                  const value = typeof data.value === "number" ? data.value : 0
                  return (
                    <div
                      className="rounded-lg border-0 px-4 py-3 shadow-2xl"
                      style={{
                        backgroundColor: "rgba(26, 26, 26, 0.95)",
                        backdropFilter: "blur(12px)",
                        boxShadow: `0 8px 32px ${data.payload.fill}40`,
                      }}
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{
                            backgroundColor: data.payload.fill,
                            boxShadow: `0 0 8px ${data.payload.fill}`,
                          }}
                        />
                        <p className="text-white font-semibold text-sm">{data.name}</p>
                      </div>
                      <p className="text-2xl font-bold text-white mb-1">R$ {value.toLocaleString("pt-BR")}</p>
                      <p className="text-gray-400 text-xs">{getPercentage(value)}% do total</p>
                    </div>
                  )
                }
                return null
              }}
            />
            <Pie
              data={chartData}
              dataKey="visitors"
              nameKey="browser"
              innerRadius={70}
              outerRadius={100}
              strokeWidth={0}
              activeIndex={activeIndex ?? undefined}
              activeShape={renderActiveShape}
              onMouseEnter={(_, index) => setActiveIndex(index)}
              onMouseLeave={() => setActiveIndex(null)}
              animationBegin={0}
              animationDuration={800}
              animationEasing="ease-out"
            >
              {chartData.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={entry.fill}
                  style={{
                    filter: activeIndex === index ? `drop-shadow(0 0 12px ${entry.fill})` : "none",
                    transition: "all 0.3s ease",
                  }}
                />
              ))}
              {/* Removed radialGradient from the center */}
              <Label
                content={({ viewBox }) => {
                  if (viewBox && "cx" in viewBox && "cy" in viewBox) {
                    return (
                      <text x={viewBox.cx} y={viewBox.cy} textAnchor="middle" dominantBaseline="middle">
                        <tspan
                          x={viewBox.cx}
                          y={(viewBox.cy || 0) - 8}
                          className="fill-white text-3xl font-bold"
                          style={{ letterSpacing: "-0.5px" }}
                        >
                          R$ {(totalVisitors / 1000).toFixed(1)}k
                        </tspan>
                        <tspan x={viewBox.cx} y={(viewBox.cy || 0) + 20} className="fill-gray-400 text-sm font-medium">
                          Total Gasto
                        </tspan>
                      </text>
                    )
                  }
                }}
              />
            </Pie>
          </PieChart>
        </ChartContainer>

        {/* Adjusted legend to not use truncate and fit better */}
        <div
          className="pie-chart-legend mt-10 px-2 space-y-2"
          style={{
            maxHeight: "475px",
            overflowY: "auto",
            overflowX: "hidden",
            paddingRight: "8px",
          }}
        >
          {chartData.map((item, index) => (
            <div
              key={item.browser}
              className="flex items-center justify-between p-3 rounded-lg transition-all duration-300 cursor-pointer gap-3"
              style={{
                backgroundColor: hoveredCategory === item.browser ? "rgba(255, 255, 255, 0.05)" : "transparent",
                border: `1px solid ${hoveredCategory === item.browser ? item.fill + "40" : "transparent"}`,
              }}
              onMouseEnter={() => {
                setHoveredCategory(item.browser)
                setActiveIndex(index)
              }}
              onMouseLeave={() => {
                setHoveredCategory(null)
                setActiveIndex(null)
              }}
            >
              <div className="flex items-center gap-3 flex-1 min-w-0 max-w-[120px]">
                <div
                  className="w-4 h-4 rounded-full transition-all duration-300 flex-shrink-0"
                  style={{
                    backgroundColor: item.fill,
                    boxShadow: hoveredCategory === item.browser ? `0 0 12px ${item.fill}` : "none",
                  }}
                />
                <span 
                  className="text-xs font-medium text-gray-300 truncate" 
                  style={{ lineHeight: "1.2" }}
                  title={item.browser}
                >
                  {item.browser}
                </span>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <span className="text-xs font-semibold text-white whitespace-nowrap">
                  R$ {item.visitors.toLocaleString("pt-BR")}
                </span>
                <span
                  className="text-xs font-medium px-2 py-1 rounded-full whitespace-nowrap"
                  style={{
                    backgroundColor: item.fill + "20",
                    color: item.fill,
                  }}
                >
                  {getPercentage(item.visitors)}%
                </span>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
