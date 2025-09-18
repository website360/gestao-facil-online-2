
import React, { useState } from 'react';
import {
  ShoppingCart,
  FileText,
  TrendingUp,
  DollarSign,
  RefreshCw,
  Package,
  CheckSquare,
  Receipt,
  CheckCircle,
  Clock,
  CheckCircle2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useDashboardData } from '@/hooks/useDashboardData';
import { useUserProfile } from '@/hooks/useUserProfile';
import KPICard from './dashboard/KPICard';
import AlertsPanel from './dashboard/AlertsPanel';
import DateRangeFilter from './dashboard/DateRangeFilter';

interface DashboardProps {
  setActiveModule: (module: string) => void;
}

const Dashboard = ({ setActiveModule }: DashboardProps) => {
  const { userProfile } = useUserProfile();
  const [startDate, setStartDate] = useState<Date | undefined>();
  const [endDate, setEndDate] = useState<Date | undefined>();
  const [appliedDateRange, setAppliedDateRange] = useState<{startDate?: Date; endDate?: Date}>({});
  
  const { kpis, alerts, loading, refetch } = useDashboardData(appliedDateRange);
  
  // Verificar se é usuário de vendas para filtrar dados
  const isVendasUser = userProfile?.role === 'vendedor_externo' || userProfile?.role === 'vendedor_interno';

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const handleApplyDateFilter = () => {
    setAppliedDateRange({ startDate, endDate });
  };

  const handleClearDateFilter = () => {
    setStartDate(undefined);
    setEndDate(undefined);
    setAppliedDateRange({});
  };

  const handleRefresh = () => {
    refetch();
  };

  return (
    <div className="min-h-screen w-full">
      <div className="w-full px-2 md:px-6 py-4 md:py-6">
        {/* Header */}
        <div className="mb-6 md:mb-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between mb-4 md:mb-6 gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">Dashboard</h1>
              <p className="text-gray-600 text-sm md:text-base">
                {isVendasUser ? 'Seus dados de vendas' : 'Visão geral dos seus negócios'}
              </p>
            </div>
            <Button
              onClick={handleRefresh}
              variant="outline"
              className="flex items-center space-x-2 bg-white hover:bg-gray-50 border-gray-300"
              disabled={loading}
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              <span>Atualizar</span>
            </Button>
          </div>
        </div>

        {/* Date Range Filter */}
        <div className="mb-6 md:mb-8">
          <DateRangeFilter
            startDate={startDate}
            endDate={endDate}
            onStartDateChange={setStartDate}
            onEndDateChange={setEndDate}
            onApply={handleApplyDateFilter}
            onClear={handleClearDateFilter}
            loading={loading}
          />
        </div>

        {/* KPI Cards para Vendas - Foco em orçamentos e vendas */}
        {isVendasUser ? (
          <>
            {/* KPI Cards - Primeira linha - Foco em orçamentos */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 mb-4 md:mb-6">
              <KPICard
                title="Orçamentos Pendentes"
                value={kpis.pendingBudgets}
                subtitle="Aguardando criação"
                icon={FileText}
                color="orange"
              />
              <KPICard
                title="Aguardando Aprovação"
                value={kpis.awaitingApprovalBudgets}
                subtitle="Orçamentos para aprovar"
                icon={Clock}
                color="red"
              />
            </div>

            {/* KPI Cards - Segunda linha - Vendas */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 mb-4 md:mb-6">
              <KPICard
                title="Vendas do Período"
                value={kpis.monthlySales}
                subtitle={appliedDateRange.startDate || appliedDateRange.endDate ? "Período personalizado" : "Este mês"}
                icon={TrendingUp}
                color="green"
              />
              <KPICard
                title="Receita do Período"
                value={formatCurrency(kpis.monthlyRevenue)}
                subtitle={appliedDateRange.startDate || appliedDateRange.endDate ? "Faturamento no período" : "Faturamento do mês"}
                icon={DollarSign}
                color="purple"
              />
            </div>

            {/* KPI Cards - Terceira linha - Vendas por Status */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-6 md:mb-8">
              <KPICard
                title="Em Separação"
                value={kpis.salesSeparacao}
                subtitle="Vendas aguardando separação"
                icon={Package}
                color="orange"
              />
              <KPICard
                title="Em Conferência"
                value={kpis.salesConferencia}
                subtitle="Vendas em conferência"
                icon={CheckSquare}
                color="blue"
              />
              <KPICard
                title="Nota Fiscal"
                value={kpis.salesNotaFiscal}
                subtitle="Vendas aguardando nota fiscal"
                icon={Receipt}
                color="purple"
              />
              <KPICard
                title="Finalizadas"
                value={kpis.salesFinalizado}
                subtitle="Vendas concluídas"
                icon={CheckCircle}
                color="green"
              />
            </div>
          </>
        ) : (
          <>
            {/* KPI Cards - Primeira linha - Dashboard completo para admin/gerente */}
            <div className={`grid grid-cols-1 md:grid-cols-2 ${userProfile?.role !== 'gerente' ? 'lg:grid-cols-3' : ''} gap-4 md:gap-6 mb-4 md:mb-6`}>
              <KPICard
                title="Total de Vendas"
                value={kpis.totalSales}
                subtitle={appliedDateRange.startDate || appliedDateRange.endDate ? "No período selecionado" : "Todas as vendas"}
                icon={ShoppingCart}
                color="blue"
              />
              <KPICard
                title="Vendas do Período"
                value={kpis.monthlySales}
                subtitle={appliedDateRange.startDate || appliedDateRange.endDate ? "Período personalizado" : "Este mês"}
                icon={TrendingUp}
                color="green"
              />
              {userProfile?.role !== 'gerente' && (
                <KPICard
                  title="Receita do Período"
                  value={formatCurrency(kpis.monthlyRevenue)}
                  subtitle={appliedDateRange.startDate || appliedDateRange.endDate ? "Faturamento no período" : "Faturamento do mês"}
                  icon={DollarSign}
                  color="purple"
                />
              )}
            </div>

            {/* KPI Cards - Segunda linha - Orçamentos */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 mb-4 md:mb-6">
              <KPICard
                title="Orçamentos Pendentes"
                value={kpis.pendingBudgets}
                subtitle="Aguardando criação"
                icon={FileText}
                color="orange"
              />
              <KPICard
                title="Aguardando Aprovação"
                value={kpis.awaitingApprovalBudgets}
                subtitle="Orçamentos para aprovar"
                icon={Clock}
                color="red"
              />
            </div>

            {/* KPI Cards - Quarta linha - Vendas por Status */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-6 md:mb-8">
              <KPICard
                title="Em Separação"
                value={kpis.salesSeparacao}
                subtitle="Vendas aguardando separação"
                icon={Package}
                color="orange"
              />
              <KPICard
                title="Em Conferência"
                value={kpis.salesConferencia}
                subtitle="Vendas em conferência"
                icon={CheckSquare}
                color="blue"
              />
              <KPICard
                title="Nota Fiscal"
                value={kpis.salesNotaFiscal}
                subtitle="Vendas aguardando nota fiscal"
                icon={Receipt}
                color="purple"
              />
              <KPICard
                title="Finalizadas"
                value={kpis.salesFinalizado}
                subtitle="Vendas concluídas"
                icon={CheckCircle}
                color="green"
              />
            </div>

            {/* Alerts Section - Apenas para admin/gerente */}
            <div className="w-full">
              <AlertsPanel alerts={alerts} loading={loading} />
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
