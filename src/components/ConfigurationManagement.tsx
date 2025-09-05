
import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Building2, CreditCard, DollarSign, Truck, FileText, Mail, Percent } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useState, useEffect } from 'react';
import SupplierManagementTab from './configuration/SupplierManagementTab';
import PaymentMethodsTab from './configuration/PaymentMethodsTab';
import PaymentTypesTab from './configuration/PaymentTypesTab';
import ShippingOptionsTab from './configuration/ShippingOptionsTab';
import PDFConfigurationTab from './configuration/PDFConfigurationTab';
import CorreiosConfigurationTab from './configuration/CorreiosConfigurationTab';
import DiscountConfigurationTab from './configuration/DiscountConfigurationTab';

const ConfigurationManagement = () => {
  const { user } = useAuth();
  const [userRole, setUserRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUserRole();
  }, [user]);

  const fetchUserRole = async () => {
    try {
      if (!user?.id) return;
      
      const { data, error } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

      if (error) throw error;
      setUserRole(data.role);
    } catch (error) {
      console.error('Erro ao buscar role do usuário:', error);
    } finally {
      setLoading(false);
    }
  };

  const getAvailableTabs = () => {
    // Abas para gerente (restritas)
    if (userRole === 'gerente') {
      return [
        { value: 'suppliers', label: 'Fornecedores', icon: Building2, component: <SupplierManagementTab /> },
        { value: 'payment-methods', label: 'Meios de Pagamento', icon: CreditCard, component: <PaymentMethodsTab /> },
        { value: 'payment-types', label: 'Tipos de Pagamento', icon: DollarSign, component: <PaymentTypesTab /> },
        { value: 'shipping', label: 'Frete', icon: Truck, component: <ShippingOptionsTab /> },
      ];
    }

    // Abas para admin (sem PDF)
    return [
      { value: 'suppliers', label: 'Fornecedores', icon: Building2, component: <SupplierManagementTab /> },
      { value: 'payment-methods', label: 'Meios de Pagamento', icon: CreditCard, component: <PaymentMethodsTab /> },
      { value: 'payment-types', label: 'Tipos de Pagamento', icon: DollarSign, component: <PaymentTypesTab /> },
      { value: 'shipping', label: 'Frete', icon: Truck, component: <ShippingOptionsTab /> },
      { value: 'correios', label: 'Correios', icon: Mail, component: <CorreiosConfigurationTab /> },
      { value: 'discount', label: 'Desconto', icon: Percent, component: <DiscountConfigurationTab /> },
    ];
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">Configurações do Sistema</h1>
        </div>
        <div className="flex items-center justify-center p-6">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  const availableTabs = getAvailableTabs();

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Configurações do Sistema</h1>
      </div>

      <Tabs defaultValue={availableTabs[0]?.value} className="w-full">
        <TabsList className={`grid w-full ${availableTabs.length === 4 ? 'grid-cols-4' : 'grid-cols-6'}`}>
          {availableTabs.map((tab) => (
            <TabsTrigger key={tab.value} value={tab.value} className="flex items-center gap-2">
              <tab.icon className="h-4 w-4" />
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>

        {availableTabs.map((tab) => (
          <TabsContent key={tab.value} value={tab.value}>
            {tab.component}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
};

export default ConfigurationManagement;
