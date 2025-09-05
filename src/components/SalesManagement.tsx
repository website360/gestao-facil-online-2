import React, { useState } from 'react';
import BulkDeleteDialog from './common/BulkDeleteDialog';
import { useSalesManagement } from '@/hooks/useSalesManagement';
import { useBulkSelection } from '@/hooks/useBulkSelection';
import SalesManagementContent from './sales/SalesManagementContent';
import VolumeViewModal from './VolumeViewModal';
import SalesDeleteConfirmModal from './sales/SalesDeleteConfirmModal';
import SeparationModal from './SeparationModal';
import ConferenceModal from './ConferenceModal';
import SalesDetailModal from './SalesDetailModal';
import SalesEditModal from './SalesEditModal';
import SaleHistoryModal from './SaleHistoryModal';
import InvoiceNumberModal from './sales/InvoiceNumberModal';
import DeliveryConfirmModal from './sales/DeliveryConfirmModal';
import StatusChangeModal from './sales/StatusChangeModal';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

const SalesManagement = () => {
  const {
    sales,
    filteredSales,
    loading,
    userRole,
    searchTerm,
    setSearchTerm,
    statusFilter,
    setStatusFilter,
    currentPage,
    setCurrentPage,
    sortField,
    setSortField,
    sortDirection,
    setSortDirection,
    fetchSales,
    handleDelete,
    handleConfirmInvoice,
    handleReturnToSales,
    getStatusLabel,
    isDeleting
  } = useSalesManagement();

  // Modal states
  const [separationModalOpen, setSeparationModalOpen] = useState(false);
  const [conferenceModalOpen, setConferenceModalOpen] = useState(false);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [historyModalOpen, setHistoryModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [invoiceModalOpen, setInvoiceModalOpen] = useState(false);
  const [deliveryModalOpen, setDeliveryModalOpen] = useState(false);
  const [statusChangeModalOpen, setStatusChangeModalOpen] = useState(false);
  const [volumeViewModalOpen, setVolumeViewModalOpen] = useState(false);
  const [selectedSaleForDelivery, setSelectedSaleForDelivery] = useState<string | null>(null);
  const [selectedSaleId, setSelectedSaleId] = useState<string | null>(null);
  const [isConfirmingInvoice, setIsConfirmingInvoice] = useState(false);
  const [showBulkDeleteDialog, setShowBulkDeleteDialog] = useState(false);
  const [deletingBulk, setDeletingBulk] = useState(false);

  // Bulk selection hook
  const {
    selectedItems,
    isAllSelected,
    isPartiallySelected,
    toggleItem,
    toggleAll,
    clearSelection,
    selectedCount
  } = useBulkSelection(sales.map(sale => sale.id));

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'separacao': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'conferencia': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'nota_fiscal': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'aguardando_entrega': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'entrega_realizada': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const formatSaleId = (sale: any) => {
    // Encontrar o índice original na lista completa de vendas
    const originalIndex = sales.findIndex(s => s.id === sale.id);
    const startIndex = (currentPage - 1) * 20;
    const sequentialNumber = (startIndex + originalIndex + 1).toString().padStart(8, '0');
    return `#V${sequentialNumber}`;
  };

  const getCurrentResponsible = (sale: any) => {
    // Se a venda veio de um orçamento criado pelo próprio cliente, mostrar "-"
    if (sale.budget_id && sale.budgets?.created_by === sale.budgets?.client_id) {
      return '-';
    }
    
    // Caso contrário, mostrar o nome do criador da venda na coluna "Vendedor"
    return sale.created_by_profile?.name || 'Vendedor não encontrado';
  };

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const handleBulkDelete = async () => {
    setDeletingBulk(true);
    setTimeout(() => {
      clearSelection();
      setShowBulkDeleteDialog(false);
      setDeletingBulk(false);
      fetchSales();
      toast.success(`${selectedCount} venda(s) excluída(s) com sucesso!`);
    }, 1000);
  };

  const handleRefresh = () => {
    fetchSales();
    toast.success('Dados atualizados!');
  };

  // Action handlers
  const handleSeparationStart = (saleId: string) => {
    setSelectedSaleId(saleId);
    setSeparationModalOpen(true);
  };

  const handleConferenceStart = (saleId: string) => {
    setSelectedSaleId(saleId);
    setConferenceModalOpen(true);
  };

  const handleView = (saleId: string) => {
    setSelectedSaleId(saleId);
    setDetailModalOpen(true);
  };

  const handleEdit = (saleId: string) => {
    setSelectedSaleId(saleId);
    setEditModalOpen(true);
  };

  const handleHistory = (saleId: string) => {
    setSelectedSaleId(saleId);
    setHistoryModalOpen(true);
  };

  const handleDeleteClick = (saleId: string) => {
    setSelectedSaleId(saleId);
    setDeleteModalOpen(true);
  };


  const handleDeliveryStart = (saleId: string) => {
    setSelectedSaleForDelivery(saleId);
    setDeliveryModalOpen(true);
  };

  const handleDeliveryConfirmation = async () => {
    if (!selectedSaleForDelivery) return;

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast.error('Usuário não autenticado');
      return;
    }

    try {
      const { error } = await supabase
        .from('sales')
        .update({ 
          status: 'entrega_realizada',
          delivery_user_id: user.id,
          delivery_completed_at: new Date().toISOString()
        })
        .eq('id', selectedSaleForDelivery);

      if (error) throw error;
      
      toast.success('Entrega confirmada com sucesso!');
      setDeliveryModalOpen(false);
      setSelectedSaleForDelivery(null);
      fetchSales();
    } catch (error: any) {
      console.error('Erro ao confirmar entrega:', error);
      toast.error('Erro ao confirmar entrega');
    }
  };

  const handleConfirmInvoiceClick = (saleId: string) => {
    setSelectedSaleId(saleId);
    setInvoiceModalOpen(true);
  };

  const handleInvoiceConfirmation = async (invoiceNumber: string) => {
    if (selectedSaleId) {
      setIsConfirmingInvoice(true);
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          toast.error('Usuário não autenticado');
          return;
        }

        const { error } = await supabase
          .from('sales')
          .update({ 
            status: 'aguardando_entrega',
            invoice_user_id: user.id,
            invoice_completed_at: new Date().toISOString(),
            invoice_number: invoiceNumber
          })
          .eq('id', selectedSaleId);

        if (error) throw error;
        
        toast.success('Nota fiscal gerada! Aguardando entrega.');
        setInvoiceModalOpen(false);
        setSelectedSaleId(null);
        fetchSales(); // Atualizar a lista para remover do painel
      } catch (error) {
        console.error('Erro ao gerar nota fiscal:', error);
      } finally {
        setIsConfirmingInvoice(false);
      }
    }
  };

  const handleDeleteConfirm = async () => {
    if (selectedSaleId) {
      await handleDelete(selectedSaleId);
      setDeleteModalOpen(false);
      setSelectedSaleId(null);
    }
  };

  const handleStatusChange = (saleId: string) => {
    setSelectedSaleId(saleId);
    setStatusChangeModalOpen(true);
  };

  const handleViewVolumes = (saleId: string) => {
    setSelectedSaleId(saleId);
    setVolumeViewModalOpen(true);
  };

  const handleStatusChangeComplete = () => {
    fetchSales();
    setStatusChangeModalOpen(false);
    setSelectedSaleId(null);
  };

  const onSeparationComplete = () => {
    fetchSales();
  };

  const onConferenceComplete = () => {
    fetchSales();
  };

  // Get selected sale data for modals
  const selectedSale = selectedSaleId ? sales.find(sale => sale.id === selectedSaleId) : null;
  const selectedDeliverySale = selectedSaleForDelivery ? sales.find(sale => sale.id === selectedSaleForDelivery) : null;

  if (loading) {
    return (
      <div className="min-h-screen p-6 bg-transparent">
        <div className="bg-white shadow-sm rounded-lg p-6">
          <div className="text-center">Carregando vendas...</div>
        </div>
      </div>
    );
  }

  return (
    <>
      <SalesManagementContent
        sales={filteredSales}
        userRole={userRole}
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        statusFilter={statusFilter}
        setStatusFilter={setStatusFilter}
        currentPage={currentPage}
        setCurrentPage={setCurrentPage}
        sortField={sortField}
        sortDirection={sortDirection}
        onSort={handleSort}
        onRefresh={handleRefresh}
        onSeparationStart={handleSeparationStart}
        onConferenceStart={handleConferenceStart}
        onDelete={handleDeleteClick}
        onView={handleView}
        onEdit={handleEdit}
        onHistory={handleHistory}
        onReturnToSales={(saleId) => handleReturnToSales(saleId)}
        onConfirmInvoice={handleConfirmInvoiceClick}
        onDeliveryStart={handleDeliveryStart}
        onStatusChange={handleStatusChange}
        onViewVolumes={handleViewVolumes}
        getStatusColor={getStatusColor}
        getStatusLabel={getStatusLabel}
        formatSaleId={formatSaleId}
        getCurrentResponsible={getCurrentResponsible}
      />

      {/* Modals */}
      <SeparationModal
        isOpen={separationModalOpen}
        onClose={() => setSeparationModalOpen(false)}
        saleId={selectedSaleId}
        onSeparationComplete={onSeparationComplete}
      />

      <ConferenceModal
        isOpen={conferenceModalOpen}
        onClose={() => setConferenceModalOpen(false)}
        saleId={selectedSaleId}
        onConferenceComplete={onConferenceComplete}
      />

      <BulkDeleteDialog
        open={showBulkDeleteDialog}
        onOpenChange={setShowBulkDeleteDialog}
        onConfirm={handleBulkDelete}
        itemCount={selectedCount}
        itemType="venda"
        loading={deletingBulk}
      />

      <SalesDetailModal
        isOpen={detailModalOpen}
        onClose={() => setDetailModalOpen(false)}
        saleId={selectedSaleId}
      />

      <SalesEditModal
        isOpen={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        saleId={selectedSaleId}
        onSaleUpdated={fetchSales}
      />

      <SaleHistoryModal
        isOpen={historyModalOpen}
        onClose={() => setHistoryModalOpen(false)}
        saleId={selectedSaleId}
      />

      <SalesDeleteConfirmModal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        onConfirm={handleDeleteConfirm}
        saleId={selectedSale ? formatSaleId(selectedSale) : ''}
        clientName={selectedSale?.clients?.name || 'N/A'}
        isDeleting={isDeleting}
      />

      <InvoiceNumberModal
        open={invoiceModalOpen}
        onClose={() => setInvoiceModalOpen(false)}
        onConfirm={handleInvoiceConfirmation}
        loading={isConfirmingInvoice}
      />

      <DeliveryConfirmModal
        open={deliveryModalOpen}
        onOpenChange={setDeliveryModalOpen}
        onConfirm={handleDeliveryConfirmation}
        saleId={selectedDeliverySale ? formatSaleId(selectedDeliverySale) : ''}
      />

      {/* Modal de Alteração de Status */}
      <StatusChangeModal
        isOpen={statusChangeModalOpen}
        onClose={() => setStatusChangeModalOpen(false)}
        sale={selectedSaleId ? sales.find(s => s.id === selectedSaleId) : null}
        onStatusChanged={handleStatusChangeComplete}
      />

      {/* Modal de Visualização de Volumes */}
      <VolumeViewModal
        isOpen={volumeViewModalOpen}
        onClose={() => setVolumeViewModalOpen(false)}
        saleId={selectedSaleId || ''}
      />
    </>
  );
};

export default SalesManagement;
