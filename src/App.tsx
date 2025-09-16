
import React from 'react';
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from '@/hooks/useAuth';
import Auth from '@/pages/Auth';
import Index from "@/pages/Index";
import BudgetApproval from "@/pages/BudgetApproval";
import Catalog from "@/pages/Catalog";
import Register from "@/pages/Register";
import CatalogDesigner from "@/pages/CatalogDesigner";
import Reports from "@/pages/Reports";

const queryClient = new QueryClient();

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading, isClient } = useAuth();
  
  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Carregando...</div>;
  }
  
  // Permitir acesso se é usuário autenticado OU cliente logado
  if (!user && !isClient) {
    return <Navigate to="/auth" replace />;
  }
  
  return <>{children}</>;
};

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <BrowserRouter>
            <Routes>
              <Route path="/auth" element={<Auth />} />
              <Route path="/budget-approval/:budgetId" element={<BudgetApproval />} />
              <Route path="/catalog" element={<Catalog />} />
              <Route path="/cadastro" element={<Register />} />
              <Route path="/catalog-public" element={<Catalog />} />
              <Route path="/catalog-designer" element={<CatalogDesigner />} />
              <Route path="/reports" element={
                <ProtectedRoute>
                  <Reports />
                </ProtectedRoute>
              } />
              <Route
                path="/*"
                element={
                  <ProtectedRoute>
                    <Index />
                  </ProtectedRoute>
                }
              />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
