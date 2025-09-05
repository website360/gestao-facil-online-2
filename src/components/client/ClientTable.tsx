
import React from 'react';
import { Table, TableBody, TableHead, TableHeader, TableRow, TableCell } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Edit, Trash2, MessageCircle } from 'lucide-react';
import { Client } from './types';
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


  return (
    <div className="border rounded-lg overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="bg-gray-50">
            <TableHead className="w-12">
              <Checkbox
                checked={isAllSelected}
                onCheckedChange={onSelectAll}
                aria-label="Selecionar todos"
                {...(isPartiallySelected ? { 'data-state': 'indeterminate' } : {})}
              />
            </TableHead>
            <TableHead>Cliente</TableHead>
            <TableHead>Tipo</TableHead>
            <TableHead>Documento</TableHead>
            <TableHead>Telefone</TableHead>
            <TableHead>Data</TableHead>
            <TableHead className="w-40">Ações</TableHead>
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
  );
};
