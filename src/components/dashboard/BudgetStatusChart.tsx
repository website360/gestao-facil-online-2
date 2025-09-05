
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';

interface BudgetStatusData {
  status: string;
  count: number;
}

interface BudgetStatusChartProps {
  data: BudgetStatusData[];
  loading: boolean;
}

const COLORS = ['#3b82f6', '#10b981', '#f59e0b'];

const chartConfig = {
  aguardando: {
    label: "Aguardando",
    color: "#3b82f6",
  },
  enviado: {
    label: "Enviado",
    color: "#10b981",
  },
  convertido: {
    label: "Convertido",
    color: "#f59e0b",
  },
};

const BudgetStatusChart = ({ data, loading }: BudgetStatusChartProps) => {
  if (loading) {
    return (
      <Card className="bg-white border border-gray-200 shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-gray-900">Status dos Orçamentos</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64 flex items-center justify-center">
            <div className="w-8 h-8 border-4 border-gray-200 border-t-blue-600 rounded-full animate-spin"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-white border border-gray-200 shadow-sm">
      <CardHeader>
        <CardTitle className="text-lg font-semibold text-gray-900">Status dos Orçamentos</CardTitle>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                outerRadius={80}
                dataKey="count"
                label={({ status, count }) => `${status}: ${count}`}
              >
                {data.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <ChartTooltip content={<ChartTooltipContent />} />
            </PieChart>
          </ResponsiveContainer>
        </ChartContainer>
      </CardContent>
    </Card>
  );
};

export default BudgetStatusChart;
