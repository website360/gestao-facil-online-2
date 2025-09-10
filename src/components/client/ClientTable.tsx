
import React from 'react';
import { Table, TableBody, TableHead, TableHeader, TableRow, TableCell } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent } from '@/components/ui/card';
import { Edit, Trash2, MessageCircle, User, FileText, Phone } from 'lucide-react';
import { Client } from './types';
import { useIsMobile } from '@/hooks/use-mobile';
import { toast } from 'sonner';

interface ClientTableProps {
  clients: Client[];
  onEdit: (client: Client) => void;
  onDelete: (client: Client) => void;
  selectedItems: Set<string>;
  onItemSelect: (itemId: string) => void;
  onSelectAll: () => void;
  isAllSelected: boolean;
  isPartiallySelected: boolean;
}

export const ClientTable = ({ 
  clients, 
  onEdit, 
  onDelete, 
  selectedItems, 
  onItemSelect, 
  onSelectAll, 
  isAllSelected, 
  isPartiallySelected 
}: ClientTableProps) => {
  const isMobile = useIsMobile();
  
  const formatPhoneForWhatsApp = (phone: string) => {
    // Remove todos os caracteres não numéricos
    const cleanPhone = phone.replace(/\D/g, '');
    
    // Se não começar com 55, adiciona o código do país
    if (!cleanPhone.startsWith('55')) {
      return `55${cleanPhone}`;
    }
    
    return cleanPhone;
  };

  const openWhatsApp = (phone: string) => {
    const formattedPhone = formatPhoneForWhatsApp(phone);
    window.open(`https://wa.me/${formattedPhone}`, '_blank');
  };

  if (isMobile) {
    return (
      <div className="space-y-3">
        <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
          <Checkbox
            checked={isAllSelected}
            onCheckedChange={onSelectAll}
            aria-label="Selecionar todos"
            {...(isPartiallySelected ? { 'data-state': 'indeterminate' } : {})}
          />
          <span className="text-sm text-gray-600">Selecionar todos</span>
        </div>
        {clients.map((client) => (
          <Card key={client.id} className="border border-gray-200 shadow-sm">
            <CardContent className="p-4">
              <div className="space-y-4">
                {/* Header com checkbox e nome */}
                <div className="flex items-start gap-3">
                  <Checkbox
                    checked={selectedItems.has(client.id)}
                    onCheckedChange={() => onItemSelect(client.id)}
                    aria-label={`Selecionar ${client.name}`}
                    className="mt-1 flex-shrink-0"
                  />
                  <div className="flex-1 min-w-0 space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <User className="h-4 w-4 text-gray-400 flex-shrink-0" />
                          <span className="text-xs text-gray-500">Nome:</span>
                        </div>
                        <h3 className="font-medium text-gray-900 break-words leading-tight">{client.name}</h3>
                      </div>
                      <Badge className={`flex-shrink-0 ${client.client_type === 'fisica' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'}`}>
                        {client.client_type === 'fisica' ? 'PF' : 'PJ'}
                      </Badge>
                    </div>
                    
                    {/* Email */}
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs text-gray-500">Email:</span>
                      </div>
                      <p className="text-sm text-gray-700 break-all">{client.email}</p>
                    </div>
                  </div>
                </div>

                {/* Documento */}
                <div className="border-t border-gray-100 pt-3">
                  <div className="flex items-center gap-2 mb-1">
                    <FileText className="h-4 w-4 text-gray-400" />
                    <span className="text-xs text-gray-500">
                      {client.client_type === 'fisica' ? 'CPF:' : 'CNPJ:'}
                    </span>
                  </div>
                  <span className="text-sm font-mono text-gray-900 break-all">
                    {client.client_type === 'fisica' ? client.cpf : client.cnpj}
                  </span>
                </div>

                {/* Telefone com WhatsApp */}
                {client.phone && (
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <Phone className="h-4 w-4 text-gray-400" />
                      <span className="text-xs text-gray-500">Telefone:</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-900">{client.phone}</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openWhatsApp(client.phone)}
                        className="h-7 w-7 p-0 text-green-600 hover:text-green-700 hover:bg-green-50 flex-shrink-0"
                        title="Abrir WhatsApp Web"
                      >
                        <MessageCircle className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}

                {/* Data de criação */}
                <div>
                  <span className="text-xs text-gray-500">Criado em:</span>
                  <span className="text-sm ml-2 text-gray-700">{new Date(client.created_at).toLocaleDateString('pt-BR')}</span>
                </div>

                {/* Ações */}
                <div className="flex gap-2 pt-3 border-t border-gray-100">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onEdit(client)}
                    className="flex-1"
                  >
                    <Edit className="h-4 w-4 mr-2" />
                    Editar
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onDelete(client)}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50 px-3"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }


  return (
    <div className="border rounded-lg overflow-hidden overflow-x-auto">
      <div className="min-w-[800px]">
        <Table>
          <TableHeader>
            <TableRow className="bg-gray-50">
              <TableHead className="w-12 min-w-[48px]">
                <Checkbox
                  checked={isAllSelected}
                  onCheckedChange={onSelectAll}
                  aria-label="Selecionar todos"
                  {...(isPartiallySelected ? { 'data-state': 'indeterminate' } : {})}
                />
              </TableHead>
              <TableHead className="min-w-[150px]">Cliente</TableHead>
              <TableHead className="min-w-[100px]">Tipo</TableHead>
              <TableHead className="min-w-[120px]">Documento</TableHead>
              <TableHead className="min-w-[140px]">Telefone</TableHead>
              <TableHead className="min-w-[100px]">Data</TableHead>
              <TableHead className="w-40 min-w-[160px]">Ações</TableHead>
            </TableRow>
          </TableHeader>
        <TableBody>
          {clients.map((client) => (
            <TableRow key={client.id} className="hover:bg-gray-50">
              <TableCell>
                <Checkbox
                  checked={selectedItems.has(client.id)}
                  onCheckedChange={() => onItemSelect(client.id)}
                  aria-label={`Selecionar ${client.name}`}
                />
              </TableCell>
              <TableCell>
                <div>
                  <div className="font-medium">{client.name}</div>
                  <div className="text-sm text-gray-500">{client.email}</div>
                </div>
              </TableCell>
              <TableCell>
                <Badge className={client.client_type === 'fisica' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'}>
                  {client.client_type === 'fisica' ? 'Pessoa Física' : 'Pessoa Jurídica'}
                </Badge>
              </TableCell>
              <TableCell className="text-sm">
                {client.client_type === 'fisica' ? client.cpf : client.cnpj}
              </TableCell>
               <TableCell className="text-sm">
                 <div className="flex items-center gap-2">
                   <span>{client.phone}</span>
                   {client.phone && (
                     <Button
                       variant="ghost"
                       size="sm"
                       onClick={() => openWhatsApp(client.phone)}
                       className="h-6 w-6 p-0 text-green-600 hover:text-green-700 hover:bg-green-50"
                       title="Abrir WhatsApp Web"
                     >
                       <MessageCircle className="h-4 w-4" />
                     </Button>
                   )}
                 </div>
               </TableCell>
               <TableCell>
                 {new Date(client.created_at).toLocaleDateString('pt-BR')}
               </TableCell>
              <TableCell>
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onEdit(client)}
                    className="h-8 w-8 p-0"
                    title="Editar cliente"
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onDelete(client)}
                    className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                    title="Excluir cliente"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      </div>
    </div>
  );
};
