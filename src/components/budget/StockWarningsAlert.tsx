import React from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle, Package } from 'lucide-react';

interface StockWarningsAlertProps {
  stockWarnings: Array<{
    product_id: string;
    product_name: string;
    product_code?: string;
    requested_quantity: number;
    available_stock: number;
    shortage: number;
  }>;
}

const StockWarningsAlert = ({ stockWarnings }: StockWarningsAlertProps) => {
  if (!stockWarnings || stockWarnings.length === 0) {
    return null;
  }

  return (
    <Alert className="border-amber-200 bg-amber-50">
      <AlertTriangle className="h-4 w-4 text-amber-600" />
      <AlertDescription>
        <div className="space-y-2">
          <p className="font-medium text-amber-800">
            Atenção: {stockWarnings.length} produto(s) com estoque insuficiente:
          </p>
          <div className="space-y-1">
            {stockWarnings.map((warning, index) => (
              <div key={index} className="flex items-center gap-2 text-sm">
                <Package className="h-3 w-3 text-amber-600" />
                <span className="font-medium">{warning.product_name}</span>
                {warning.product_code && (
                  <span className="text-gray-600">({warning.product_code})</span>
                )}
                <span className="text-amber-700">
                  - Solicitado: {warning.requested_quantity}, 
                  Disponível: {warning.available_stock}, 
                  Faltam: {warning.shortage}
                </span>
              </div>
            ))}
          </div>
        </div>
      </AlertDescription>
    </Alert>
  );
};

export default StockWarningsAlert;