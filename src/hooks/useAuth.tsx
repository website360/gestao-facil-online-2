
import React, { useState, useEffect, createContext, useContext } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  isClient: boolean;
  clientData: any;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signInAsClient: (email: string, password: string) => Promise<{ error: any; client?: any }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [isClient, setIsClient] = useState(false);
  const [clientData, setClientData] = useState<any>(null);

  useEffect(() => {
    // Verificar se há dados de cliente salvos no localStorage
    const savedClientData = localStorage.getItem('clientData');
    if (savedClientData) {
      try {
        const clientData = JSON.parse(savedClientData);
        setIsClient(true);
        setClientData(clientData);
        setLoading(false);
        return;
      } catch (error) {
        console.error('Erro ao carregar dados do cliente:', error);
        localStorage.removeItem('clientData');
      }
    }

    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
        
        // Se não é cliente, limpar dados de cliente
        if (!isClient) {
          setIsClient(false);
          setClientData(null);
        }
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { error };
  };

  const signInAsClient = async (email: string, password: string) => {
    try {
      console.log('Tentando login de cliente com:', { email, password });
      
      // Usar edge function para login de cliente
      const { data, error } = await supabase.functions.invoke('client-login', {
        body: { email, password }
      });

      console.log('Resultado da edge function:', { data, error });

      if (error || !data?.client) {
        console.log('Cliente não encontrado ou erro:', error);
        return { error: { message: data?.error || 'Email ou senha incorretos' } };
      }

      console.log('Cliente encontrado, fazendo login:', data.client);
      
      // Simular autenticação de cliente e salvar no localStorage
      setIsClient(true);
      setClientData(data.client);
      setLoading(false);
      
      // Salvar dados do cliente no localStorage para persistência
      localStorage.setItem('clientData', JSON.stringify(data.client));

      return { error: null, client: data.client };
    } catch (error: any) {
      console.error('Erro no login de cliente:', error);
      return { error: { message: 'Erro ao fazer login' } };
    }
  };

  const signOut = async () => {
    if (isClient) {
      // Logout de cliente - limpar localStorage
      setIsClient(false);
      setClientData(null);
      localStorage.removeItem('clientData');
    } else {
      // Logout de usuário normal
      await supabase.auth.signOut();
    }
  };

  return (
    <AuthContext.Provider value={{
      user,
      session,
      loading,
      isClient,
      clientData,
      signIn,
      signInAsClient,
      signOut,
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
