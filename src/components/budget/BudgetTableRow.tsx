
import React, { useState } from 'react';
import { TableCell, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { 
  Edit, 
  Trash2, 
  MessageCircle,
  ShoppingCart,
  CheckCircle,
  User,
  UserCheck,
  Eye,
  Send
} from 'lucide-react';
import { useBudgetCalculations } from '@/hooks/useBudgetCalculations';
import BudgetPDFGenerator from './BudgetPDFGenerator';
import BudgetApprovalDialog from './BudgetApprovalDialog';
import type { LocalBudget } from '@/hooks/useBudgetManagement';

interface BudgetTableRowProps {
  budget: LocalBudget;
  index: number;
  onEdit: (budget: LocalBudget) => void;
  onDelete: (id: string) => void;
  onView: (budget: LocalBudget, index: number) => void;
  onConvert: (budget: LocalBudget) => void;
  onSend: (budget: LocalBudget) => void;
  onSendForApproval?: (id: string) => void;
  onApprove?: (id: string) => void;
  isAdmin?: boolean;
  isClient?: boolean;
  selectedItems?: Set<string>;
  onItemSelect?: (itemId: string) => void;
  showBulkActions?: boolean;
}

const BudgetTableRow = ({
  budget,
  index,
  onEdit,
  onDelete,
  onView,
  onConvert,
  onSend,
  onSendForApproval,
  onApprove,
  isAdmin = false,
  isClient = false,
  selectedItems,
  onItemSelect,
  showBulkActions = false
}: BudgetTableRowProps) => {
  const { calculateBudgetTotal } = useBudgetCalculations();
  const [showApprovalDialog, setShowApprovalDialog] = useState(false);

  const formatBudgetId = (id: string, index: number) => {
    const sequentialNumber = (index + 1).toString().padStart(8, '0');
    return `#O${sequentialNumber}`;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'processando':
        return 'bg-orange-100 text-orange-800';
      case 'aguardando_aprovacao':
        return 'bg-yellow-100 text-yellow-800';
      case 'aprovado':
        return 'bg-blue-100 text-blue-800';
      case 'convertido':
        return 'bg-green-100 text-green-800';
      case 'rejeitado':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string, isClient?: boolean) => {
    switch (status) {
      case 'processando':
        return 'Processando';
      case 'aguardando_aprovacao':
        return 'Aguardando Aprovação';
      case 'aprovado':
        return 'Aprovado';
      case 'convertido':
        return 'Aprovado';
      case 'rejeitado':
        return 'Rejeitado';
      default:
        return status;
    }
  };

  const handleApprovalConfirm = () => {
    if (onSendForApproval) {
      onSendForApproval(budget.id);
    }
    setShowApprovalDialog(false);
  };

  const openWhatsApp = (phone: string) => {
    if (!phone) {
      console.log('No phone number available');
      return;
    }
    
    // Clean phone number - remove all non-digits
    const cleanPhone = phone.replace(/\D/g, '');
    
    // Ensure it starts with country code (55 for Brazil)
    const phoneWithCountryCode = cleanPhone.startsWith('55') ? cleanPhone : `55${cleanPhone}`;
    
    // Open WhatsApp Web
    const whatsappUrl = `https://web.whatsapp.com/send?phone=${phoneWithCountryCode}`;
    window.open(whatsappUrl, '_blank');
  };

  // Função para determinar se o orçamento foi criado por cliente ou vendedor
  const getCreatorIcon = () => {
    // Se o created_by é o mesmo que o client_id, foi criado pelo próprio cliente
    if (budget.created_by === budget.client_id) {
      return (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger>
              <UserCheck className="h-4 w-4 text-blue-600" />
            </TooltipTrigger>
            <TooltipContent>
              <p>Criado pelo cliente</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      );
    }
    // Caso contrário, foi criado por um vendedor/funcionário
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger>
            <User className="h-4 w-4 text-green-600" />
          </TooltipTrigger>
          <TooltipContent>
            <p>Criado por vendedor</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  };

  // CALCULAR SEMPRE O TOTAL EM TEMPO REAL - NUNCA USAR O VALOR DO BANCO
  const realTimeTotal = calculateBudgetTotal(budget);
  
  // DEBUG: Status e permissões dos botões
  console.log('=== BUDGET BUTTONS DEBUG ===');
  console.log('Budget ID:', budget.id);
  console.log('Budget Status:', budget.status);
  console.log('isAdmin:', isAdmin);
  console.log('onApprove exists:', !!onApprove);
  console.log('onConvert exists:', !!onConvert);
  console.log('Can show approve button:', budget.status === 'aguardando_aprovacao' && onApprove && isAdmin);
  console.log('Can show convert button:', budget.status === 'aprovado' && onConvert && isAdmin);
  console.log('=== END BUDGET BUTTONS DEBUG ===');

  return (
    <TableRow className="hover:bg-gray-50">
      {showBulkActions && selectedItems && onItemSelect && (
        <TableCell>
          <Checkbox
            checked={selectedItems.has(budget.id)}
            onCheckedChange={() => onItemSelect(budget.id)}
            aria-label={`Selecionar orçamento ${budget.id}`}
          />
        </TableCell>
      )}
      <TableCell className="text-center font-medium">
        <div className="flex items-center gap-2 justify-center">
          {isAdmin && getCreatorIcon()}
          {formatBudgetId(budget.id, index)}
        </div>
      </TableCell>
      <TableCell>
        <div>
          <div className="font-medium">{budget.clients?.name}</div>
          <div className="text-sm text-gray-500">{budget.clients?.email}</div>
        </div>
      </TableCell>
      <TableCell className="text-center">
        <div className="flex flex-col gap-1 items-center">
          <Badge className={getStatusColor(budget.status)}>
            {getStatusText(budget.status, isClient)}
          </Badge>
          {/* Mostrar avisos de estoque para administradores quando há problemas */}
          {budget.stock_warnings && Array.isArray(budget.stock_warnings) && budget.stock_warnings.length > 0 && isAdmin && (
            <div className="text-xs text-red-600 bg-red-50 px-2 py-1 rounded text-center">
              ⚠️ {budget.stock_warnings.length} item(ns) sem estoque
            </div>
          )}
        </div>
      </TableCell>
      <TableCell className="text-center">
        {new Date(budget.created_at).toLocaleDateString('pt-BR')}
      </TableCell>
      <TableCell className="text-right font-medium">
        R$ {realTimeTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
      </TableCell>
      {isAdmin && (
        <TableCell>
          {/* Só mostrar vendedor se o orçamento não foi criado pelo próprio cliente */}
          {budget.created_by !== budget.client_id ? (
            <div className="text-sm">
              <div className="font-medium">{budget.creator_profile?.name || 'N/A'}</div>
              <div className="text-gray-500">{budget.creator_profile?.email || ''}</div>
            </div>
          ) : (
            <div className="text-sm text-gray-400 italic">
              -
            </div>
          )}
        </TableCell>
      )}
      <TableCell>
        <div className="flex gap-1 justify-end">
          {/* Botão de visualização - sempre visível */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onView(budget, index)}
            className="h-8 w-8 p-0 text-blue-600 hover:text-blue-700"
            title="Visualizar orçamento"
          >
            <Eye className="h-4 w-4" />
          </Button>
          
          {/* Botão de edição - oculto quando aguardando aprovação ou aprovado para não-admins */}
          {!((budget.status === 'aguardando_aprovacao' || budget.status === 'aprovado') && !isAdmin) && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onEdit(budget)}
              className="h-8 w-8 p-0"
              title="Editar orçamento"
            >
              <Edit className="h-4 w-4" />
            </Button>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => openWhatsApp(budget.clients?.phone || '')}
            className="h-8 w-8 p-0 text-green-600 hover:text-green-700"
            title="Abrir WhatsApp"
          >
            <MessageCircle className="h-4 w-4" />
          </Button>
          <BudgetPDFGenerator budget={budget} className="h-8 w-8 p-0" />
          
          {/* Botão enviar para aprovação - para orçamentos com status "processando" */}
          {budget.status === 'processando' && onSendForApproval && !isAdmin && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onSendForApproval(budget.id)}
              className="h-8 w-8 p-0 text-blue-600 hover:text-blue-700"
              title="Enviar para aprovação"
            >
              <Send className="h-4 w-4" />
            </Button>
          )}
          
          {/* Botão aprovar orçamento - apenas para orçamentos enviados para aprovação */}
          {(budget.status === 'aguardando_aprovacao') && onApprove && isAdmin && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onApprove(budget.id)}
              className="h-8 w-8 p-0 text-emerald-600 hover:text-emerald-700"
              title="Aprovar orçamento"
            >
              <CheckCircle className="h-4 w-4" />
            </Button>
          )}
          
          {/* Ícone de aprovação desabilitado para orçamentos que ainda não foram enviados */}
          {budget.status === 'processando' && isAdmin && (
            <Button
              variant="ghost"
              size="sm"
              disabled
              className="h-8 w-8 p-0 text-gray-400 cursor-not-allowed"
              title="Orçamento precisa ser enviado para aprovação primeiro"
            >
              <CheckCircle className="h-4 w-4" />
            </Button>
          )}
          
          {/* Botão converter em venda - lógica baseada em quem criou e roles */}
          {onConvert && isAdmin && (
            <>
              {/* Se foi criado por admin/gerente (verificando role do criador), sempre mostrar */}
              {(budget.creator_profile?.role === 'admin' || budget.creator_profile?.role === 'gerente') ? (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onConvert(budget)}
                  className="h-8 w-8 p-0 text-yellow-600 hover:text-yellow-700"
                  title="Converter em Venda"
                >
                  <ShoppingCart className="h-4 w-4" />
                </Button>
              ) : (
                /* Se foi criado por vendedor/cliente, só mostrar após aprovação */
                budget.status === 'aprovado' && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onConvert(budget)}
                    className="h-8 w-8 p-0 text-yellow-600 hover:text-yellow-700"
                    title="Converter em Venda"
                  >
                    <ShoppingCart className="h-4 w-4" />
                  </Button>
                )
              )}
            </>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onDelete(budget.id)}
            className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
            title="Excluir orçamento"
            disabled={(budget.status === 'aguardando_aprovacao' || budget.status === 'aprovado') && !isAdmin}
            style={{ 
              display: (budget.status === 'aguardando_aprovacao' || budget.status === 'aprovado') && !isAdmin ? 'none' : 'flex'
            }}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>

        <BudgetApprovalDialog
          open={showApprovalDialog}
          onOpenChange={setShowApprovalDialog}
          onConfirm={handleApprovalConfirm}
        />
      </TableCell>
    </TableRow>
  );
};

export default BudgetTableRow;
