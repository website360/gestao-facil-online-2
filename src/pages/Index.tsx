import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate, useLocation } from 'react-router-dom';
import { useIsMobile } from '@/hooks/use-mobile';
import Dashboard from '../components/Dashboard';
import ClientManagement from '../components/ClientManagement';
import ProductManagement from '../components/ProductManagement';
import CategoryManagement from '../components/CategoryManagement';
import UserManagement from '../components/UserManagement';
import BudgetManagement from '../components/BudgetManagement';
import ClientWelcomeDashboard from '../components/ClientWelcomeDashboard';

import SalesManagement from '../components/SalesManagement';
import ConfigurationManagement from '../components/ConfigurationManagement';

import Reports from './Reports';
import Catalog from './Catalog';
import { Profile } from './Profile';
import { Toaster } from "@/components/ui/sonner";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Users, 
  Package, 
  Tag, 
  UserCheck,
  FileText,
  ShoppingCart,
  LayoutDashboard,
  LogOut,
  Settings,
  Menu,
  X,
  ShoppingBag,
  BarChart3,
  User,
  Copy,
  Check
} from "lucide-react";
import { mapRole, isVendorOrOldVendasRole, type OldRole } from '@/utils/roleMapper';

interface Profile {
  role: OldRole;
  email: string;
  name: string;
}

const Index = () => {
  const location = useLocation();
  const [activeModule, setActiveModule] = useState('sales'); // Começar nas vendas para roles restritas
  const [userProfile, setUserProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const isMobile = useIsMobile();
  const [sidebarOpen, setSidebarOpen] = useState(!isMobile); // Fechar sidebar por padrão no mobile
  const [copiedLink, setCopiedLink] = useState(false);
  const { user, signOut, isClient, clientData } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      fetchUserProfile();
    } else if (isClient) {
      // Para clientes, usar dados do clientData
      setUserProfile({
        role: 'vendedor_externo', // Dar role de vendedor externo para clientes conseguirem criar orçamentos
        email: clientData?.email || '',
        name: clientData?.name || 'Cliente'
      });
      setLoading(false);
      // Garantir que cliente vá para orçamentos
      setActiveModule('budgets');
    }
  }, [user, isClient, clientData]);

  // Definir módulo inicial baseado na role do usuário
  useEffect(() => {
    if (userProfile?.role) {
      const restrictedRoles = ['separacao', 'conferencia', 'nota_fiscal', 'entregador'];
      
      if (restrictedRoles.includes(userProfile.role)) {
        // Roles restritas sempre vão para vendas
        setActiveModule('sales');
      } else if (userProfile.role === 'admin' || userProfile.role === 'gerente' || isVendorOrOldVendasRole(userProfile.role)) {
        // Outras roles podem ir para dashboard se não foi especificado outro módulo
        if (activeModule === 'sales' && !location.search.includes('redirect=sales')) {
          setActiveModule('dashboard');
        }
      }
    }
  }, [userProfile, location.search]);

  // Check if we need to redirect to sales after budget conversion
  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    if (searchParams.get('redirect') === 'sales') {
      setActiveModule('sales');
      // Clean up the URL
      navigate('/', { replace: true });
    }
  }, [location.search, navigate]);

  const fetchUserProfile = async () => {
    try {
      console.log('Fetching user profile for user:', user?.id);
      
      // First, check if we have a valid session
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError || !session) {
        console.log('No valid session, refreshing...');
        const { error: refreshError } = await supabase.auth.refreshSession();
        if (refreshError) {
          console.error('Failed to refresh session:', refreshError);
          // If we can't refresh, sign out the user
          await signOut();
          return;
        }
      }

      const { data, error } = await supabase
        .from('profiles')
        .select('role, name, email')
        .eq('id', user?.id)
        .single();

      if (error) {
        console.error('Error fetching profile:', error);
        // If JWT is expired, try to refresh once more
        if (error.code === 'PGRST301') {
          console.log('JWT expired, attempting to refresh session and retry...');
          const { error: refreshError } = await supabase.auth.refreshSession();
          if (!refreshError) {
            // Retry the profile fetch after refresh
            const { data: retryData, error: retryError } = await supabase
              .from('profiles')
              .select('role, name, email')
              .eq('id', user?.id)
              .single();
            
            if (!retryError && retryData) {
              setUserProfile(retryData);
              return;
            }
          }
        }
        throw error;
      }
      
      console.log('Profile loaded successfully:', data);
      setUserProfile(data);
    } catch (error) {
      console.error('Erro ao buscar perfil do usuário:', error);
      // If all else fails, sign out the user to force re-authentication
      await signOut();
    } finally {
      setLoading(false);
    }
  };

  const getAvailableMenuItems = () => {
    const role = userProfile?.role;
    
    // Se é um cliente logado, mostrar apenas orçamentos e catálogo
    if (isClient) {
      return [
        { id: 'budgets', label: 'Meus Orçamentos', icon: FileText },
        { id: 'catalog', label: 'Catálogo', icon: ShoppingBag },
      ];
    }
    
    if (role === 'admin') {
      return [
        { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { id: 'clients', label: 'Clientes', icon: Users },
        { id: 'products', label: 'Produtos', icon: Package },
        { id: 'categories', label: 'Categorias', icon: Tag },
        { id: 'users', label: 'Usuários', icon: UserCheck },
        { id: 'budgets', label: 'Orçamentos', icon: FileText },
        { id: 'sales', label: 'Vendas', icon: ShoppingCart },
        { id: 'reports', label: 'Relatórios', icon: BarChart3 },
        { id: 'catalog', label: 'Catálogo', icon: ShoppingBag },
      ];
    }
    
    if (role === 'gerente') {
      return [
        { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { id: 'clients', label: 'Clientes', icon: Users },
        { id: 'products', label: 'Produtos', icon: Package },
        { id: 'categories', label: 'Categorias', icon: Tag },
        { id: 'budgets', label: 'Orçamentos', icon: FileText },
        { id: 'sales', label: 'Vendas', icon: ShoppingCart },
        { id: 'catalog', label: 'Catálogo', icon: ShoppingBag },
      ];
    }
    
    if (isVendorOrOldVendasRole(role)) {
      return [
        { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { id: 'clients', label: 'Clientes', icon: Users },
        { id: 'products', label: 'Produtos', icon: Package },
        { id: 'budgets', label: 'Orçamentos', icon: FileText },
        { id: 'sales', label: 'Vendas', icon: ShoppingCart },
        { id: 'catalog', label: 'Catálogo', icon: ShoppingBag },
      ];
    }

    if (role === 'cliente') {
      return [
        { id: 'budgets', label: 'Meus Orçamentos', icon: FileText },
        { id: 'catalog', label: 'Catálogo', icon: ShoppingBag },
      ];
    }

    if (role === 'entregador') {
      return [
        { id: 'sales', label: 'Entregas', icon: ShoppingCart },
      ];
    }
    
    return [
      { id: 'sales', label: 'Vendas', icon: ShoppingCart },
    ];
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'admin': return 'Administrador';
      case 'gerente': return 'Gerente';
      case 'vendas': return 'Vendas';
      case 'separacao': return 'Separação';
      case 'conferencia': return 'Conferência';
      case 'nota_fiscal': return 'Nota Fiscal';
      case 'cliente': return 'Cliente';
      case 'entregador': return 'Entregador';
      default: return role;
    }
  };

  const renderContent = () => {
    const restrictedRoles = ['separacao', 'conferencia', 'nota_fiscal', 'entregador'];
    
    // Se a role é restrita e está tentando acessar dashboard, redirecionar para vendas
    if (restrictedRoles.includes(userProfile?.role || '') && activeModule === 'dashboard') {
      setActiveModule('sales');
      return <SalesManagement />;
    }
    
    switch (activeModule) {
      case 'dashboard':
        // Só permitir dashboard para roles não restritas
        if (restrictedRoles.includes(userProfile?.role || '')) {
          return <SalesManagement />;
        }
        return <Dashboard setActiveModule={setActiveModule} />;
      case 'clients':
        return <ClientManagement />;
      case 'products':
        return <ProductManagement />;
      case 'categories':
        return <CategoryManagement />;
      case 'users':
        return <UserManagement />;
      case 'budgets':
        return isClient ? <ClientWelcomeDashboard /> : <BudgetManagement />;
      case 'sales':
        return <SalesManagement />;
      case 'reports':
        return <Reports />;
      case 'configurations':
        return <ConfigurationManagement />;
      case 'catalog':
        return <Catalog />;
      case 'profile':
        return <Profile />;
      default:
        // Para roles restritas, default é vendas; para outras, dashboard
        return restrictedRoles.includes(userProfile?.role || '') 
          ? <SalesManagement /> 
          : <Dashboard setActiveModule={setActiveModule} />;
    }
  };

  const handleSignOut = async () => {
    await signOut();
  };

  const handleConfigurationsClick = () => {
    setActiveModule('configurations');
  };

  const handleCopyLink = async () => {
    const catalogUrl = `${window.location.origin}/catalog`;
    try {
      await navigator.clipboard.writeText(catalogUrl);
      setCopiedLink(true);
      toast.success('Link do catálogo copiado!');
      setTimeout(() => setCopiedLink(false), 2000);
    } catch (error) {
      console.error('Erro ao copiar link:', error);
      toast.error('Erro ao copiar link');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center bg-decorative">
        <div className="flex flex-col items-center space-y-4">
          <div className="w-12 h-12 border-4 border-primary/30 border-t-primary rounded-full animate-spin"></div>
          <div className="text-muted-foreground font-medium">Carregando...</div>
        </div>
      </div>
    );
  }

  const menuItems = getAvailableMenuItems();

  return (
    <div className="h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex bg-decorative overflow-hidden p-2 md:p-4">
      {/* Mobile Backdrop */}
      {isMobile && sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 md:hidden" 
          onClick={() => setSidebarOpen(false)}
        />
      )}
      
      {/* Sidebar - Responsiva */}
      <div className={`${
        isMobile 
          ? sidebarOpen 
            ? 'fixed left-2 top-2 bottom-2 w-64 z-50' 
            : 'hidden'
          : sidebarOpen 
            ? 'w-64' 
            : 'w-16'
      } transition-all duration-300 glass flex-shrink-0 h-[calc(100vh-1rem)] md:h-[calc(100vh-2rem)] rounded-2xl flex flex-col`}>
        {/* Logo Header - Fixo */}
        <div className="flex h-16 items-center px-4 border-b border-gray-200/50 flex-shrink-0">
          {sidebarOpen ? (
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-white rounded-lg border border-gray-200/50 shadow-sm flex items-center justify-center p-1">
                <img src="/lovable-uploads/1f183d06-f80b-44da-9040-12f4a7ffc5bd.png" alt="Logo" className="w-full h-full object-contain" />
              </div>
              <h1 className="text-lg font-semibold text-gray-900">
                Irmãos Mantovani
              </h1>
            </div>
          ) : (
            <div className="w-8 h-8 bg-white rounded-lg border border-gray-200/50 shadow-sm flex items-center justify-center mx-auto p-1">
              <img src="/lovable-uploads/1f183d06-f80b-44da-9040-12f4a7ffc5bd.png" alt="Logo" className="w-full h-full object-contain" />
            </div>
          )}
        </div>
        
        {/* Menu de navegação - Área flexível que cresce */}
        <nav className="flex-1 mt-6 px-3 min-h-0">
          <ul className="space-y-1">
             {menuItems.map((item) => (
               <li key={item.id}>
                 <div className={`w-full group flex items-center rounded-xl text-sm font-medium transition-all ${
                   activeModule === item.id
                     ? 'gradient-bg text-white shadow-lg shadow-blue-500/25'
                     : 'text-gray-700 hover:bg-white/50 hover:text-gray-900'
                 }`}>
                   <button
                     onClick={() => setActiveModule(item.id)}
                     className="flex-1 flex items-center"
                   >
                     <div className={`flex items-center ${sidebarOpen ? 'px-3 py-2.5' : 'px-2 py-2.5 justify-center'}`}>
                       <item.icon className={`h-5 w-5 ${sidebarOpen ? 'mr-3' : ''}`} />
                       {sidebarOpen && (
                         <span className="truncate">{item.label}</span>
                       )}
                     </div>
                   </button>
                   
                   {/* Botão de copiar link só para o catálogo */}
                   {item.id === 'catalog' && sidebarOpen && (
                     <button
                       onClick={(e) => {
                         e.stopPropagation();
                         handleCopyLink();
                       }}
                       className={`mr-3 p-1.5 rounded-lg transition-all ${
                         activeModule === item.id
                           ? 'hover:bg-white/20 text-white'
                           : 'hover:bg-gray-200 text-gray-600'
                       }`}
                       title="Copiar link do catálogo"
                     >
                       {copiedLink ? (
                         <Check className="h-4 w-4" />
                       ) : (
                         <Copy className="h-4 w-4" />
                       )}
                     </button>
                   )}
                 </div>
               </li>
             ))}
          </ul>
        </nav>

        {/* User info - Fixo na parte inferior */}
        <div className="p-3 border-t border-gray-200/50 flex-shrink-0">
          {sidebarOpen ? (
            <div className="space-y-3">
              <div className="text-xs text-gray-600">Logado como:</div>
              {userProfile && (
                <Badge className="gradient-bg text-white border-0 shadow-lg shadow-blue-500/25 block w-fit">
                  {isClient ? 'Cliente' : getRoleLabel(userProfile.role)}
                </Badge>
              )}
              <div>
                <button
                  onClick={() => setActiveModule('profile')}
                  className="text-sm font-medium text-gray-900 truncate hover:text-blue-600 transition-colors text-left block"
                >
                  {isClient ? clientData?.email : (userProfile?.email || user?.email)}
                </button>
              </div>
              <Button
                onClick={handleSignOut}
                className="w-full btn-gradient rounded-xl h-11"
              >
                <LogOut className="mr-2 h-4 w-4" />
                Sair
              </Button>
            </div>
          ) : (
            <div className="space-y-3 flex flex-col items-center">
              <button
                onClick={() => setActiveModule('profile')}
                className="w-8 h-8 gradient-bg rounded-full flex items-center justify-center text-white font-bold text-xs shadow-lg shadow-blue-500/25 hover:opacity-80 transition-opacity"
              >
                {isClient ? clientData?.name?.charAt(0).toUpperCase() : user?.email?.charAt(0).toUpperCase()}
              </button>
              <Button
                onClick={handleSignOut}
                className="w-full btn-gradient rounded-xl px-2 h-10"
              >
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Main Content - Área que ocupa o resto da tela */}
      <div className={`flex-1 flex flex-col min-w-0 h-full ${isMobile ? '' : 'ml-4'}`}>
        {/* Header superior - Fixo */}
        <header className="glass h-14 md:h-16 flex items-center justify-between px-4 md:px-6 rounded-2xl flex-shrink-0">
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="hover:bg-white/50 rounded-xl"
            >
              {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>

          {/* Actions */}
          <div className="flex items-center space-x-2">
            <Button 
              variant="ghost" 
              size="sm" 
              className="hover:bg-white/50 rounded-xl"
              onClick={() => setActiveModule('profile')}
            >
              <User className="h-5 w-5" />
            </Button>
            
            {(userProfile?.role === 'admin' || userProfile?.role === 'gerente') && (
              <Button 
                variant="ghost" 
                size="sm" 
                className="hover:bg-white/50 rounded-xl"
                onClick={handleConfigurationsClick}
              >
                <Settings className="h-5 w-5" />
              </Button>
            )}
          </div>
        </header>

        {/* Content - Área scrollável que ocupa 100% da largura */}
        <main className="flex-1 overflow-auto min-h-0 mt-2 md:mt-4">
          <div className="w-full px-2 md:px-6">
            {renderContent()}
          </div>
        </main>
      </div>

      <Toaster />
    </div>
  );
};

export default Index;
