
import React, { useState, useEffect, createContext, useContext } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

const CLIENT_DATA_KEY = 'clientData';
const CLIENT_TOKEN_KEY = 'clientSessionToken';

/**
 * A edge function client-login antiga devolvia a linha inteira do cliente -
 * senha do portal inclusive - e ela ficava em texto puro no localStorage.
 * Removemos o campo tanto do que e salvo agora quanto do que ja estava salvo.
 */
const sanitizeClientData = (data: any) => {
  if (!data || typeof data !== 'object') return data;
  if (!('system_password' in data)) return data;
  const { system_password: _omitted, ...safe } = data;
  return safe;
};

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  isClient: boolean;
  clientData: any;
  /** Token da sessao do portal do cliente; identifica o cliente nas RPCs client_portal_* */
  clientToken: string | null;
  userProfile: any;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signInAsClient: (email: string, password: string) => Promise<{ error: any; client?: any }>;
  signOut: () => Promise<void>;
}

const defaultAuthContext: AuthContextType = {
  user: null,
  session: null,
  loading: true,
  isClient: false,
  clientData: null,
  clientToken: null,
  userProfile: null,
  signIn: async () => ({ error: null }),
  signInAsClient: async () => ({ error: null }),
  signOut: async () => {}
};

const AuthContext = createContext<AuthContextType>(defaultAuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [isClient, setIsClient] = useState(false);
  const [clientData, setClientData] = useState<any>(null);
  const [clientToken, setClientToken] = useState<string | null>(null);
  const [userProfile, setUserProfile] = useState<any>(null);

  useEffect(() => {
    // Verificar se há dados de cliente salvos no localStorage
    const savedClientData = localStorage.getItem(CLIENT_DATA_KEY);
    if (savedClientData) {
      try {
        const parsed = JSON.parse(savedClientData);
        const safeClientData = sanitizeClientData(parsed);

        // Limpa a senha de sessões que já estavam salvas antes desta mudança
        if (safeClientData !== parsed) {
          localStorage.setItem(CLIENT_DATA_KEY, JSON.stringify(safeClientData));
        }

        setIsClient(true);
        setClientData(safeClientData);
        setClientToken(localStorage.getItem(CLIENT_TOKEN_KEY));
        setLoading(false);
        return;
      } catch (error) {
        console.error('Erro ao carregar dados do cliente:', error);
        localStorage.removeItem(CLIENT_DATA_KEY);
        localStorage.removeItem(CLIENT_TOKEN_KEY);
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

        // Fetch user profile if authenticated
        if (session?.user) {
          fetchUserProfile(session.user.id);
        } else {
          setUserProfile(null);
        }
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
      
      // Fetch user profile if authenticated
      if (session?.user) {
        fetchUserProfile(session.user.id);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchUserProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('role, name, email')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('Error fetching profile:', error);
        return;
      }
      
      setUserProfile(data);
    } catch (error) {
      console.error('Error fetching user profile:', error);
    }
  };

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

      const safeClient = sanitizeClientData(data.client);

      // Simular autenticação de cliente e salvar no localStorage
      setIsClient(true);
      setClientData(safeClient);
      setLoading(false);

      // Salvar dados do cliente no localStorage para persistência
      localStorage.setItem(CLIENT_DATA_KEY, JSON.stringify(safeClient));

      // Token da sessão do portal. Ausente quando a edge function ainda não
      // foi atualizada - nesse caso o painel usa o caminho antigo de consulta.
      if (data.token) {
        setClientToken(data.token);
        localStorage.setItem(CLIENT_TOKEN_KEY, data.token);
      } else {
        setClientToken(null);
        localStorage.removeItem(CLIENT_TOKEN_KEY);
      }

      return { error: null, client: safeClient };
    } catch (error: any) {
      console.error('Erro no login de cliente:', error);
      return { error: { message: 'Erro ao fazer login' } };
    }
  };

  const signOut = async () => {
    if (isClient) {
      // Logout de cliente - encerrar a sessão no banco e limpar localStorage
      const token = clientToken || localStorage.getItem(CLIENT_TOKEN_KEY);

      if (token) {
        try {
          await supabase.rpc('client_portal_logout', { p_token: token });
        } catch (error) {
          // Sessão expira sozinha; não travar o logout do navegador por isso
          console.error('Erro ao encerrar sessão do portal:', error);
        }
      }

      setIsClient(false);
      setClientData(null);
      setClientToken(null);
      localStorage.removeItem(CLIENT_DATA_KEY);
      localStorage.removeItem(CLIENT_TOKEN_KEY);
    } else {
      // Logout de usuário normal
      // scope: 'local' encerra apenas a sessao deste dispositivo.
      // Sem isso o padrao e 'global', que revoga os tokens em TODOS os dispositivos.
      await supabase.auth.signOut({ scope: 'local' });
    }
  };

  return (
    <AuthContext.Provider value={{
      user,
      session,
      loading,
      isClient,
      clientData,
      clientToken,
      userProfile,
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
