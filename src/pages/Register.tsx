import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { supabase } from '@/integrations/supabase/client';
import { ArrowLeft, User, Mail, Phone, MapPin, Building, FileText } from 'lucide-react';
import { Link } from 'react-router-dom';

const Register = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    document: '',
    address: '',
    city: '',
    state: '',
    zipCode: '',
    company: '',
    message: ''
  });
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Inserir no banco de dados como um lead/solicitação de cadastro
      const { error } = await supabase
        .from('registration_requests')
        .insert([{
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          document: formData.document,
          address: formData.address,
          city: formData.city,
          state: formData.state,
          zip_code: formData.zipCode,
          company: formData.company,
          message: formData.message,
          status: 'pending',
          created_at: new Date().toISOString()
        }]);

      if (error) throw error;

      toast.success('Solicitação de cadastro enviada com sucesso! Entraremos em contato em breve.');
      
      // Limpar formulário
      setFormData({
        name: '',
        email: '',
        phone: '',
        document: '',
        address: '',
        city: '',
        state: '',
        zipCode: '',
        company: '',
        message: ''
      });

    } catch (error) {
      console.error('Erro ao enviar solicitação:', error);
      toast.error('Erro ao enviar solicitação. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-secondary/20 p-4">
      <div className="container mx-auto max-w-2xl py-8">
        {/* Header */}
        <div className="mb-8">
          <Link 
            to="/catalog" 
            className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Voltar ao Catálogo
          </Link>
          
          <div className="text-center">
            <h1 className="text-3xl font-bold text-foreground mb-2">
              Solicitar Cadastro
            </h1>
            <p className="text-muted-foreground">
              Preencha os dados abaixo para solicitar seu cadastro em nosso sistema
            </p>
          </div>
        </div>

        {/* Form */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="w-5 h-5" />
              Dados para Cadastro
            </CardTitle>
            <CardDescription>
              Após o envio, nossa equipe entrará em contato para confirmar seu cadastro
            </CardDescription>
          </CardHeader>
          
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Dados Pessoais */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name" className="flex items-center gap-2">
                    <User className="w-4 h-4" />
                    Nome Completo *
                  </Label>
                  <Input
                    id="name"
                    name="name"
                    type="text"
                    required
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="Seu nome completo"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email" className="flex items-center gap-2">
                    <Mail className="w-4 h-4" />
                    E-mail *
                  </Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    required
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="seu@email.com"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone" className="flex items-center gap-2">
                    <Phone className="w-4 h-4" />
                    Telefone *
                  </Label>
                  <Input
                    id="phone"
                    name="phone"
                    type="tel"
                    required
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder="(11) 99999-9999"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="document" className="flex items-center gap-2">
                    <FileText className="w-4 h-4" />
                    CPF/CNPJ *
                  </Label>
                  <Input
                    id="document"
                    name="document"
                    type="text"
                    required
                    value={formData.document}
                    onChange={handleChange}
                    placeholder="000.000.000-00"
                  />
                </div>
              </div>

              {/* Empresa */}
              <div className="space-y-2">
                <Label htmlFor="company" className="flex items-center gap-2">
                  <Building className="w-4 h-4" />
                  Empresa (opcional)
                </Label>
                <Input
                  id="company"
                  name="company"
                  type="text"
                  value={formData.company}
                  onChange={handleChange}
                  placeholder="Nome da empresa"
                />
              </div>

              {/* Endereço */}
              <div className="space-y-4">
                <Label className="flex items-center gap-2 text-base font-medium">
                  <MapPin className="w-4 h-4" />
                  Endereço
                </Label>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2 space-y-2">
                    <Label htmlFor="address">Endereço Completo *</Label>
                    <Input
                      id="address"
                      name="address"
                      type="text"
                      required
                      value={formData.address}
                      onChange={handleChange}
                      placeholder="Rua, número, complemento"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="city">Cidade *</Label>
                    <Input
                      id="city"
                      name="city"
                      type="text"
                      required
                      value={formData.city}
                      onChange={handleChange}
                      placeholder="Sua cidade"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="state">Estado *</Label>
                    <Input
                      id="state"
                      name="state"
                      type="text"
                      required
                      value={formData.state}
                      onChange={handleChange}
                      placeholder="SP"
                      maxLength={2}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="zipCode">CEP *</Label>
                    <Input
                      id="zipCode"
                      name="zipCode"
                      type="text"
                      required
                      value={formData.zipCode}
                      onChange={handleChange}
                      placeholder="00000-000"
                    />
                  </div>
                </div>
              </div>

              {/* Mensagem */}
              <div className="space-y-2">
                <Label htmlFor="message">Mensagem (opcional)</Label>
                <textarea
                  id="message"
                  name="message"
                  value={formData.message}
                  onChange={handleChange}
                  placeholder="Conte-nos mais sobre sua necessidade ou deixe uma mensagem"
                  rows={4}
                  className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                />
              </div>

              {/* Submit Button */}
              <Button 
                type="submit" 
                disabled={loading}
                className="w-full"
                size="lg"
              >
                {loading ? 'Enviando...' : 'Enviar Solicitação de Cadastro'}
              </Button>

              <p className="text-sm text-muted-foreground text-center">
                * Campos obrigatórios
              </p>
            </form>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center mt-8 text-muted-foreground">
          <p>
            Já possui cadastro? Entre em contato conosco para obter suas credenciais de acesso.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;