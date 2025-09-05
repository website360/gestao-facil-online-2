
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';

const BudgetManagementLoading = () => {
  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <Card className="bg-white shadow-sm">
        <CardContent className="p-6">
          <div className="text-center">Carregando orçamentos...</div>
        </CardContent>
      </Card>
    </div>
  );
};

export default BudgetManagementLoading;
