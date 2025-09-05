
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import EmptyState from '@/components/ui/empty-state';
import { AlertTriangle, XCircle, Info, Bell } from 'lucide-react';

interface AlertItem {
  id: string;
  type: 'warning' | 'error' | 'info';
  title: string;
  description: string;
}

interface AlertsPanelProps {
  alerts: AlertItem[];
  loading: boolean;
}

const AlertsPanel = ({ alerts, loading }: AlertsPanelProps) => {
  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'error':
        return XCircle;
      case 'warning':
        return AlertTriangle;
      default:
        return Info;
    }
  };

  const getAlertColors = (type: string) => {
    switch (type) {
      case 'error':
        return {
          bg: 'bg-red-50',
          border: 'border-red-200',
          icon: 'text-red-600',
          title: 'text-red-900',
          description: 'text-red-700'
        };
      case 'warning':
        return {
          bg: 'bg-orange-50',
          border: 'border-orange-200',
          icon: 'text-orange-600',
          title: 'text-orange-900',
          description: 'text-orange-700'
        };
      default:
        return {
          bg: 'bg-blue-50',
          border: 'border-blue-200',
          icon: 'text-blue-600',
          title: 'text-blue-900',
          description: 'text-blue-700'
        };
    }
  };

  if (loading) {
    return (
      <Card className="bg-white border border-gray-200 shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
          <CardTitle className="text-lg font-semibold text-gray-900 flex items-center">
            <Bell className="w-5 h-5 mr-2 text-gray-600" />
            Alertas
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-32 flex items-center justify-center">
            <div className="w-8 h-8 border-4 border-gray-200 border-t-blue-600 rounded-full animate-spin"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-white border border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-200">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
        <CardTitle className="text-lg font-semibold text-gray-900 flex items-center">
          <Bell className="w-5 h-5 mr-2 text-gray-600" />
          Alertas
          {alerts.length > 0 && (
            <span className="ml-2 bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
              {alerts.length}
            </span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        {alerts.length === 0 ? (
          <EmptyState
            title="Nenhum alerta no momento"
            description="Os alertas aparecerão aqui quando houver situações que precisam de atenção."
            icon={Info}
          />
        ) : (
          <ScrollArea className="h-160">
            <div className="space-y-3 p-6">
              {alerts.map((alert) => {
                const Icon = getAlertIcon(alert.type);
                const colors = getAlertColors(alert.type);
                return (
                  <div
                    key={alert.id}
                    className={`p-4 rounded-lg border ${colors.border} ${colors.bg} transition-all duration-200 hover:shadow-sm`}
                  >
                    <div className="flex items-start space-x-3">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${colors.bg}`}>
                        <Icon className={`h-5 w-5 ${colors.icon}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className={`text-sm font-semibold mb-1 ${colors.title}`}>
                          {alert.title}
                        </h4>
                        <p className={`text-sm ${colors.description}`}>
                          {alert.description}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
};

export default AlertsPanel;
