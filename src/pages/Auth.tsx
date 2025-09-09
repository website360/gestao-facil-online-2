
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from '@/components/ui/sonner';
import { LogIn, ShoppingBag, Users, Building } from 'lucide-react';

const Auth = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { signIn, signInAsClient, user, isClient } = useAuth();
  const navigate = useNavigate();

  // Redirect se já estiver logado
  useEffect(() => {
    if (user || isClient) {
      navigate('/', { replace: true });
    }
  }, [user, isClient, navigate]);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await signIn(email, password);
    if (error) {
      toast.error('Erro ao fazer login: ' + error.message);
    } else {
      toast.success('Login realizado com sucesso!');
      navigate('/');
    }
    setLoading(false);
  };

  const handleClientSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await signInAsClient(email, password);
    if (error) {
      toast.error('Erro ao fazer login: ' + error.message);
    } else {
      toast.success('Login de cliente realizado com sucesso!');
      navigate('/');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden" style={{ backgroundColor: '#F2F8FF' }}>
      {/* Background decorative elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-blue-400/20 to-purple-400/20 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-br from-purple-400/20 to-pink-400/20 rounded-full blur-3xl"></div>
        <div className="absolute top-1/4 right-1/4 w-32 h-32 bg-gradient-to-br from-yellow-400/10 to-orange-400/10 rounded-full blur-2xl"></div>
      </div>

      <div className="relative z-10 w-full max-w-md">
          <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="w-48 h-28 flex items-center justify-center">
              <img src="/lovable-uploads/a16e0c44-3fe5-4408-861e-2b328ba401ea.png" alt="Irmãos Mantovani Têxtil" className="w-full h-full object-contain" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Sistema de Gestão</h1>
          <p className="text-gray-600">Acesse sua conta para gerenciar suas vendas</p>
        </div>

        <Card className="glass">
          <CardHeader className="text-center pb-4">
            <CardTitle className="text-2xl font-bold text-gray-900">Login</CardTitle>
            <CardDescription className="text-gray-600 text-center">
              Entre com suas credenciais para acessar o sistema
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="staff" className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-6">
                <TabsTrigger value="staff" className="flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  Funcionário
                </TabsTrigger>
                <TabsTrigger value="client" className="flex items-center gap-2">
                  <Building className="w-4 h-4" />
                  Cliente
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="staff">
                <form onSubmit={handleSignIn} className="space-y-5">
                  <div className="space-y-2">
                    <Label htmlFor="staff-email" className="text-sm font-medium text-gray-700">Email</Label>
                    <Input 
                      id="staff-email" 
                      type="email" 
                      value={email} 
                      onChange={e => setEmail(e.target.value)} 
                      className="h-11 rounded-xl border-gray-200 focus:border-blue-500 focus:ring-blue-500/20 transition-all" 
                      placeholder="seu@email.com" 
                      required 
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="staff-password" className="text-sm font-medium text-gray-700">Senha</Label>
                    <Input 
                      id="staff-password" 
                      type="password" 
                      value={password} 
                      onChange={e => setPassword(e.target.value)} 
                      className="h-11 rounded-xl border-gray-200 focus:border-blue-500 focus:ring-blue-500/20 transition-all" 
                      placeholder="••••••••" 
                      required 
                    />
                  </div>
                  <Button 
                    type="submit" 
                    className="w-full btn-gradient rounded-xl h-11"
                    disabled={loading}
                  >
                    {loading ? (
                      <div className="flex items-center">
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2"></div>
                        Entrando...
                      </div>
                    ) : (
                      <div className="flex items-center">
                        <LogIn className="w-4 h-4 mr-2" />
                        Entrar como Funcionário
                      </div>
                    )}
                  </Button>
                </form>
              </TabsContent>
              
              <TabsContent value="client">
                <form onSubmit={handleClientSignIn} className="space-y-5">
                  <div className="space-y-2">
                    <Label htmlFor="client-email" className="text-sm font-medium text-gray-700">Email</Label>
                    <Input 
                      id="client-email" 
                      type="email" 
                      value={email} 
                      onChange={e => setEmail(e.target.value)} 
                      className="h-11 rounded-xl border-gray-200 focus:border-blue-500 focus:ring-blue-500/20 transition-all" 
                      placeholder="seu@email.com" 
                      required 
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="client-password" className="text-sm font-medium text-gray-700">Senha de Acesso</Label>
                    <Input 
                      id="client-password" 
                      type="password" 
                      value={password} 
                      onChange={e => setPassword(e.target.value)} 
                      className="h-11 rounded-xl border-gray-200 focus:border-blue-500 focus:ring-blue-500/20 transition-all" 
                      placeholder="••••••••" 
                      required 
                    />
                  </div>
                  <Button 
                    type="submit" 
                    className="w-full btn-gradient rounded-xl h-11"
                    disabled={loading}
                  >
                    {loading ? (
                      <div className="flex items-center">
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2"></div>
                        Entrando...
                      </div>
                    ) : (
                      <div className="flex items-center">
                        <LogIn className="w-4 h-4 mr-2" />
                        Entrar como Cliente
                      </div>
                    )}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Auth;
