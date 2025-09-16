
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, FileText, Users, Package, ShoppingCart } from 'lucide-react';

interface QuickActionsProps {
  onAction: (action: string) => void;
  userRole: string;
}

const QuickActions = ({ onAction, userRole }: QuickActionsProps) => {
  const getQuickActions = () => {
    const actions = [
      {
        id: 'new-sale',
        label: 'Nova Venda',
        icon: ShoppingCart,
        color: 'bg-green-600 hover:bg-green-700 text-white',
        action: 'sales'
      },
      {
        id: 'new-budget',
        label: 'Novo Orçamento',
        icon: FileText,
        color: 'bg-blue-600 hover:bg-blue-700 text-white',
        action: 'budgets'
      }
    ];

    if (userRole === 'admin' || userRole === 'vendedor_externo' || userRole === 'vendedor_interno') {
      actions.push(
        {
          id: 'new-client',
          label: 'Novo Cliente',
          icon: Users,
          color: 'bg-purple-600 hover:bg-purple-700 text-white',
          action: 'clients'
        },
        {
          id: 'new-product',
          label: 'Novo Produto',
          icon: Package,
          color: 'bg-orange-600 hover:bg-orange-700 text-white',
          action: 'products'
        }
      );
    }

    return actions;
  };

  const actions = getQuickActions();

  return (
    <Card className="bg-white border border-gray-200 shadow-sm">
      <CardHeader>
        <CardTitle className="text-lg font-semibold text-gray-900">Ações Rápidas</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 gap-3">
          {actions.map((action) => (
            <Button
              key={action.id}
              onClick={() => onAction(action.action)}
              className={`${action.color} p-4 h-auto flex items-center space-x-3 rounded-lg shadow-sm hover:shadow-md transition-all duration-200`}
            >
              <action.icon className="w-5 h-5" />
              <span className="font-medium">{action.label}</span>
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default QuickActions;
