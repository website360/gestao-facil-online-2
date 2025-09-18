
import React from 'react';
import { TableCell, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Package, Trash2, CheckCircle, Percent, Eye, Edit, History, ArrowLeft, FileText, Truck, Settings, Scale, PackageCheck } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import SaleAttachmentsDropdown from './SaleAttachmentsDropdown';
import SalePDFGenerator from './SalePDFGenerator';

interface Sale {
  id: string;
  client_id: string;
  status: 'separacao' | 'conferencia' | 'nota_fiscal' | 'aguardando_entrega' | 'entrega_realizada' | 'atencao' | 'finalizada';
  total_amount: number;
  notes: string;
  created_at: string;
  created_by: string;
  clients: { name: string } | null;
  created_by_profile: { name: string } | null;
  separation_user_id?: string | null;
  conference_user_id?: string | null;
  invoice_user_id?: string | null;
  separation_user_profile?: { name: string } | null;
  conference_user_profile?: { name: string } | null;
  invoice_user_profile?: { name: string } | null;
  conference_complete?: boolean;
  conference_percentage?: number;
  separation_complete?: boolean;
  separation_percentage?: number;
  sale_items?: any[];
  tracking_code?: string;
  budget_id?: string;
  invoice_number?: string;
  total_volumes?: number;
  total_weight_kg?: number;
  shipping_option_name?: string | null;
  shipping_option_visible?: boolean;
}

interface SalesTableRowProps {
  sale: Sale;
  index: number;
  startIndex: number;
  userRole: string;
  onSeparationStart: (saleId: string) => void;
  onConferenceStart: (saleId: string) => void;
  onDelete: (saleId: string) => void;
  onView: (saleId: string) => void;
  onEdit: (saleId: string) => void;
  onHistory: (saleId: string) => void;
  onReturnToSales: (saleId: string) => void;
  onConfirmInvoice: (saleId: string) => void;
  onDeliveryStart: (saleId: string) => void;
  onStatusChange: (saleId: string) => void;
  onViewVolumes: (saleId: string) => void;
  onConfirmDelivery: (saleId: string) => void;
  onViewDeliveryNotes: (saleId: string) => void;
  onFinalizeSale: (saleId: string) => void;
  getStatusColor: (status: string) => string;
  getStatusLabel: (status: string) => string;
  formatSaleId: (sale: Sale) => string;
  getCurrentResponsible: (sale: Sale) => string;
  selectedItems?: Set<string>;
  onItemSelect?: (itemId: string) => void;
  showBulkActions?: boolean;
}

const SalesTableRow = ({ 
  sale, 
  index, 
  startIndex, 
  userRole, 
  onSeparationStart, 
  onConferenceStart,
  onDelete,
  onView,
  onEdit,
  onHistory,
  onReturnToSales,
  onConfirmInvoice,
  onDeliveryStart,
  onStatusChange,
  onViewVolumes,
  onConfirmDelivery,
  onViewDeliveryNotes,
  onFinalizeSale,
  getStatusColor,
  getStatusLabel,
  formatSaleId,
  getCurrentResponsible,
  selectedItems,
  onItemSelect,
  showBulkActions = false
}: SalesTableRowProps) => {
  const openTrackingPage = (trackingCode: string) => {
    const url = `https://www2.correios.com.br/sistemas/rastreamento/resultado.cfm?objeto=${trackingCode}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };
  // Role: Separação
  if (userRole === 'separacao') {
    return (
      <TableRow key={sale.id} className="hover:bg-gray-50 transition-colors border-b border-gray-100">
        <TableCell className="font-mono text-sm font-bold text-gray-900 py-4 px-6">
          {formatSaleId(sale)}
        </TableCell>
        <TableCell className="font-medium text-gray-800 py-4 px-6">{sale.clients?.name}</TableCell>
        <TableCell className="py-4 px-6">
          <Badge className={getStatusColor(sale.status)}>
            {getStatusLabel(sale.status)}
          </Badge>
        </TableCell>
        <TableCell className="py-4 px-6">
          {sale.status === 'separacao' && !sale.separation_complete ? (
            <div className="space-y-2 min-w-[120px]">
              <div className="flex items-center gap-2">
                <Progress 
                  value={sale.separation_percentage || 0} 
                  className="flex-1 h-2"
                />
                <span className="text-sm font-medium text-gray-600 flex items-center gap-1">
                  <Percent className="h-3 w-3" />
                  {sale.separation_percentage || 0}%
                </span>
              </div>
            </div>
          ) : sale.separation_complete ? (
            <Badge className="bg-green-100 text-green-800">
              <CheckCircle className="mr-1 h-3 w-3" />
              Finalizada
            </Badge>
          ) : (
            <span className="text-gray-400 text-sm">-</span>
          )}
        </TableCell>
        <TableCell className="text-gray-600 py-4 px-6">
          {new Date(sale.created_at).toLocaleDateString('pt-BR')}
        </TableCell>
        <TableCell className="text-gray-600 py-4 px-6">{getCurrentResponsible(sale)}</TableCell>
        <TableCell className="py-4 px-6">
          <div className="flex gap-1 justify-center">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => onSeparationStart(sale.id)}
                  className="h-8 w-8 p-0 text-yellow-600 hover:text-yellow-700"
                >
                  <Package className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Iniciar Separação</p>
              </TooltipContent>
            </Tooltip>
          </div>
        </TableCell>
      </TableRow>
    );
  }

  // Role: Conferência
  if (userRole === 'conferencia') {
    return (
      <TableRow key={sale.id} className="hover:bg-gray-50 transition-colors border-b border-gray-100">
        <TableCell className="font-mono text-sm font-bold text-gray-900 py-4 px-6">
          {formatSaleId(sale)}
        </TableCell>
        <TableCell className="font-medium text-gray-800 py-4 px-6">{sale.clients?.name}</TableCell>
        <TableCell className="py-4 px-6">
          <Badge className={getStatusColor(sale.status)}>
            {getStatusLabel(sale.status)}
          </Badge>
        </TableCell>
        <TableCell className="py-4 px-6">
          {sale.status === 'conferencia' && !sale.conference_complete ? (
            <div className="space-y-2 min-w-[120px]">
              <div className="flex items-center gap-2">
                <Progress 
                  value={sale.conference_percentage || 0} 
                  className="flex-1 h-2"
                />
                <span className="text-sm font-medium text-gray-600 flex items-center gap-1">
                  <Percent className="h-3 w-3" />
                  {sale.conference_percentage || 0}%
                </span>
              </div>
            </div>
          ) : sale.conference_complete ? (
            <Badge className="bg-green-100 text-green-800">
              <CheckCircle className="mr-1 h-3 w-3" />
              Finalizada
            </Badge>
          ) : (
            <span className="text-gray-400 text-sm">-</span>
          )}
        </TableCell>
        <TableCell className="text-gray-600 py-4 px-6">
          {new Date(sale.created_at).toLocaleDateString('pt-BR')}
        </TableCell>
        <TableCell className="text-gray-600 py-4 px-6">{getCurrentResponsible(sale)}</TableCell>
        <TableCell className="py-4 px-6">
          <div className="flex gap-1">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => onConferenceStart(sale.id)}
                  className="h-8 w-8 p-0 text-yellow-600 hover:text-yellow-700"
                >
                  <Package className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Iniciar Conferência</p>
              </TooltipContent>
            </Tooltip>

            {/* Botão para visualizar volumes - só aparece se houver volumes registrados */}
            {sale.total_volumes && sale.total_volumes > 0 && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => onViewVolumes(sale.id)}
                    className="h-8 w-8 p-0 text-indigo-600 hover:text-indigo-700"
                  >
                    <Scale className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Ver Volumes ({sale.total_volumes})</p>
                </TooltipContent>
              </Tooltip>
            )}
          </div>
        </TableCell>
      </TableRow>
    );
  }

  // Role: Entregador  
  if (userRole === 'entregador') {
    return (
      <TableRow key={sale.id} className="hover:bg-gray-50 transition-colors border-b border-gray-100">
        <TableCell className="font-mono text-sm font-bold text-gray-900 py-4 px-6">
          {formatSaleId(sale)}
        </TableCell>
        <TableCell className="font-medium text-gray-800 py-4 px-6">{sale.clients?.name}</TableCell>
        <TableCell className="py-4 px-6">
          <Badge className={getStatusColor(sale.status)}>
            {getStatusLabel(sale.status)}
          </Badge>
        </TableCell>
        <TableCell className="text-gray-600 py-4 px-6">
          {new Date(sale.created_at).toLocaleDateString('pt-BR')}
        </TableCell>
        <TableCell className="font-semibold text-green-600 py-4 px-6">{formatCurrency(sale.total_amount)}</TableCell>
        <TableCell className="text-gray-600 py-4 px-6">
          {sale.invoice_number || '-'}
        </TableCell>
        <TableCell className="text-gray-600 py-4 px-6">
          {sale.shipping_option_name || '-'}
        </TableCell>
        <TableCell className="text-gray-600 py-4 px-6">{getCurrentResponsible(sale)}</TableCell>
        <TableCell className="py-4 px-6">
          <div className="flex gap-1 justify-center">
            {sale.status === 'aguardando_entrega' && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => onDeliveryStart(sale.id)}
                    className="h-8 w-8 p-0 text-green-600 hover:text-green-700"
                  >
                    <Truck className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Confirmar Entrega</p>
                </TooltipContent>
              </Tooltip>
            )}

            {/* Botão para visualizar volumes - só aparece se houver volumes registrados */}
            {sale.total_volumes && sale.total_volumes > 0 && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => onViewVolumes(sale.id)}
                    className="h-8 w-8 p-0 text-indigo-600 hover:text-indigo-700"
                  >
                    <Scale className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Ver Volumes ({sale.total_volumes})</p>
                </TooltipContent>
              </Tooltip>
            )}
          </div>
        </TableCell>
      </TableRow>
    );
  }

  // Role: Nota Fiscal
  if (userRole === 'nota_fiscal') {
    return (
      <TableRow key={sale.id} className="hover:bg-gray-50 transition-colors border-b border-gray-100">
        <TableCell className="font-mono text-sm font-bold text-gray-900 py-4 px-6">
          {formatSaleId(sale)}
        </TableCell>
        <TableCell className="font-medium text-gray-800 py-4 px-6">{sale.clients?.name}</TableCell>
        <TableCell className="py-4 px-6">
          <Badge className={getStatusColor(sale.status)}>
            {getStatusLabel(sale.status)}
          </Badge>
        </TableCell>
        <TableCell className="text-gray-600 py-4 px-6">
          {new Date(sale.created_at).toLocaleDateString('pt-BR')}
        </TableCell>
        <TableCell className="font-semibold text-green-600 py-4 px-6">{formatCurrency(sale.total_amount)}</TableCell>
        <TableCell className="text-gray-600 py-4 px-6">
          {sale.invoice_number ? (
            <Badge variant="outline" className="font-mono text-xs">
              {sale.invoice_number}
            </Badge>
          ) : (
            <span className="text-gray-400 text-sm">-</span>
          )}
        </TableCell>
        <TableCell className="text-gray-600 py-4 px-6">{getCurrentResponsible(sale)}</TableCell>
        <TableCell className="py-4 px-6">
           <div className="flex gap-1 justify-end">
            {/* Botão de visualizar - sempre disponível exceto para vendas finalizadas */}
            {sale.status !== 'finalizada' && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => onView(sale.id)}
                    className="h-8 w-8 p-0 text-gray-600 hover:text-gray-700"
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Visualizar</p>
                </TooltipContent>
              </Tooltip>
            )}

          {sale.status === 'nota_fiscal' && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => onConfirmInvoice(sale.id)}
                  className="h-8 w-8 p-0 text-yellow-600 hover:text-yellow-700"
                >
                  <FileText className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Confirmar Geração de Nota Fiscal</p>
              </TooltipContent>
            </Tooltip>
          )}

          {/* Ícone de anexos - disponível para nota fiscal */}
          <SaleAttachmentsDropdown saleId={sale.id} className="h-8 w-8 p-0" saleStatus={sale.status} />
        </div>
        </TableCell>
      </TableRow>
    );
  }

  // Layout para admin e vendas
  return (
    <TableRow key={sale.id} className="hover:bg-gray-50 transition-colors border-b border-gray-100">
      <TableCell className="font-mono text-sm font-bold text-gray-900 py-4 px-6">
        {formatSaleId(sale)}
      </TableCell>
      <TableCell className="font-medium text-gray-800 py-4 px-6">{sale.clients?.name}</TableCell>
      <TableCell className="py-4 px-6">
        <Badge className={getStatusColor(sale.status)}>
          {getStatusLabel(sale.status)}
        </Badge>
      </TableCell>
      <TableCell className="text-gray-600 py-4 px-6">
        {new Date(sale.created_at).toLocaleDateString('pt-BR')}
      </TableCell>
      <TableCell className="font-semibold text-green-600 py-4 px-6">{formatCurrency(sale.total_amount)}</TableCell>
      <TableCell className="text-gray-600 py-4 px-6">
        {sale.invoice_number ? (
          <Badge variant="outline" className="font-mono text-xs">
            {sale.invoice_number}
          </Badge>
        ) : (
          <span className="text-gray-400 text-sm">-</span>
        )}
      </TableCell>
      <TableCell className="text-gray-600 py-4 px-6">{getCurrentResponsible(sale)}</TableCell>
      <TableCell className="py-4 px-6">
        <div className="flex gap-1 justify-end">
          {/* Botão de visualizar - sempre disponível exceto para vendas finalizadas */}
          {sale.status !== 'finalizada' && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => onView(sale.id)}
                  className="h-8 w-8 p-0 text-gray-600 hover:text-gray-700"
                >
                  <Eye className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Visualizar</p>
              </TooltipContent>
            </Tooltip>
          )}

          {/* Botão de editar - não disponível para vendas finalizadas e gerente não pode editar */}
          {sale.status !== 'entrega_realizada' && sale.status !== 'finalizada' && userRole !== 'gerente' && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => onEdit(sale.id)}
                  className="h-8 w-8 p-0"
                >
                  <Edit className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Editar</p>
              </TooltipContent>
            </Tooltip>
          )}

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => onHistory(sale.id)}
                className="h-8 w-8 p-0 text-blue-600 hover:text-blue-700"
              >
                <History className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Histórico</p>
            </TooltipContent>
          </Tooltip>

          {/* Botão para baixar PDF da venda */}
          <SalePDFGenerator sale={sale} />

          {/* Ícone de rastreio - só aparece se o tracking_code estiver preenchido */}
          {sale.tracking_code && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => openTrackingPage(sale.tracking_code!)}
                  className="h-8 w-8 p-0 text-orange-600 hover:text-orange-700"
                >
                  <Truck className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Rastrear Entrega</p>
              </TooltipContent>
            </Tooltip>
          )}

          {/* Mostrar botão de confirmar nota fiscal pentru admin quando o status for nota_fiscal */}
          {userRole === 'admin' && sale.status === 'nota_fiscal' && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => onConfirmInvoice(sale.id)}
                  className="h-8 w-8 p-0 text-yellow-600 hover:text-yellow-700"
                >
                  <FileText className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Confirmar Geração de Nota Fiscal</p>
              </TooltipContent>
            </Tooltip>
          )}

          {/* Botão de confirmar entrega para admin/gerente quando frete não vai para entregador */}
          {(userRole === 'admin' || userRole === 'gerente') && 
           sale.status === 'aguardando_entrega' && 
           sale.shipping_option_visible === false && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => onConfirmDelivery(sale.id)}
                  className="h-8 w-8 p-0 text-green-600 hover:text-green-700"
                >
                  <PackageCheck className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Confirmar Entrega</p>
              </TooltipContent>
            </Tooltip>
          )}

          {/* Botão para visualizar detalhes da entrega realizada */}
          {(userRole === 'admin' || userRole === 'gerente') && 
           sale.status === 'entrega_realizada' && 
           sale.shipping_option_visible === false && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => onViewDeliveryNotes(sale.id)}
                  className="h-8 w-8 p-0 text-green-600 hover:text-green-700"
                >
                  <PackageCheck className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Ver Detalhes da Entrega</p>
              </TooltipContent>
            </Tooltip>
          )}

          {/* Botão de alteração de status para admins - não aparece se entrega realizada, finalizada ou se é gerente */}
          {userRole === 'admin' && sale.status !== 'entrega_realizada' && sale.status !== 'finalizada' && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => onStatusChange(sale.id)}
                  className="h-8 w-8 p-0 text-purple-600 hover:text-purple-700"
                >
                  <Settings className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Alterar Status</p>
              </TooltipContent>
            </Tooltip>
          )}

          {/* Botão para visualizar volumes - aparece se houver volumes (inclui finalizada) */}
          {sale.total_volumes && sale.total_volumes > 0 && sale.status !== 'entrega_realizada' && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => onViewVolumes(sale.id)}
                  className="h-8 w-8 p-0 text-indigo-600 hover:text-indigo-700"
                >
                  <Scale className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Ver Volumes ({sale.total_volumes})</p>
              </TooltipContent>
            </Tooltip>
          )}

          {/* Botão de finalizar venda - apenas para admin nos status Nota Fiscal ou Entrega Realizada */}
          {userRole === 'admin' && (sale.status === 'nota_fiscal' || sale.status === 'entrega_realizada') && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => onFinalizeSale(sale.id)}
                  className="h-8 w-8 p-0 text-gray-600 hover:text-gray-700"
                >
                  <CheckCircle className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Finalizar Venda</p>
              </TooltipContent>
            </Tooltip>
          )}

          {/* Comprovantes de pagamento - apenas para admin e gerente */}
          {(userRole === 'admin' || userRole === 'gerente') && sale.budget_id && (
            <SaleAttachmentsDropdown saleId={sale.id} saleStatus={sale.status} />
          )}

          {/* Botão de excluir - não aparece se entrega realizada, finalizada ou se é gerente */}
          {sale.status !== 'entrega_realizada' && sale.status !== 'finalizada' && userRole !== 'gerente' && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => onDelete(sale.id)}
                  className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Excluir</p>
              </TooltipContent>
            </Tooltip>
          )}
        </div>
      </TableCell>
    </TableRow>
  );
};

export default SalesTableRow;
