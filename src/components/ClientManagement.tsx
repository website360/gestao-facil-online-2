
import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Edit, Trash2, MessageCircle, History, TrashIcon, Users, Info } from 'lucide-react';
import { ClientTable } from './client/ClientTable';
import { ClientFilters } from './client/ClientFilters';
import ClientPagination from './client/ClientPagination';
import { useClientManagement } from './client/useClientManagement';
import { useClientExcel } from '@/hooks/useClientExcel';
import { useBulkSelection } from '@/hooks/useBulkSelection';
import { ClientManagementHeader } from './client/ClientManagementHeader';
import { Client } from './client/types';
import ClientFormDialog from './ClientFormDialog';
import ClientDeleteDialog from './ClientDeleteDialog';
import ClientHistoryModal from './ClientHistoryModal';
import ClientImportConflictDialog from './client/ClientImportConflictDialog';
import ClientImportProgressModal from './client/ClientImportProgressModal';
import ClientImportSuccessModal from './client/ClientImportSuccessModal';
import BulkDeleteDialog from './common/BulkDeleteDialog';
import EmptyState from '@/components/ui/empty-state';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

const ClientManagement = () => {
  const [historyClient, setHistoryClient] = useState<Client | null>(null);
  const [showBulkDeleteDialog, setShowBulkDeleteDialog] = useState(false);
  const [deletingBulk, setDeletingBulk] = useState(false);
  
  const {
    filteredClients,
    paginatedClients,
    loading,
    showForm,
    editingClient,
    clientToDelete,
    searchTerm,
    typeFilter,
    itemsPerPage,
    currentPage,
    totalPages,
    totalItems,
    setSearchTerm,
    setTypeFilter,
    setItemsPerPage,
    setCurrentPage,
    setClientToDelete,
    handleNewClient,
    handleEdit,
    handleDelete,
    handleFormClose,
    handleFormSuccess,
    handleDeleteConfirm,
  } = useClientManagement();

  const {
    selectedItems,
    isAllSelected,
    isPartiallySelected,
    toggleItem,
    toggleAll,
    clearSelection,
    selectedCount
  } = useBulkSelection(paginatedClients.map(c => c.id));

  const { 
    exportToExcel, 
    processImportFile, 
    conflicts,
    showConflictDialog,
    setShowConflictDialog,
    resolveConflicts,
    isProcessing,
    importProgress,
    importStatus,
    showProgressModal,
    showSuccessModal,
    setShowSuccessModal,
    totalImported
  } = useClientExcel();

  const handleExportExcel = () => {
    exportToExcel(filteredClients);
  };

  const handleImportExcel = (file: File) => {
    processImportFile(file);
  };

  const handleHistory = (client: Client) => {
    setHistoryClient(client);
  };

  const formatPhoneForWhatsApp = (phone: string) => {
    // Remove todos os caracteres não numéricos
    const cleanPhone = phone.replace(/\D/g, '');
    
    // Se não começar com 55, adiciona o código do país
    if (!cleanPhone.startsWith('55')) {
      return `55${cleanPhone}`;
    }
    
    return cleanPhone;
  };

  const handleBulkDelete = async () => {
    setDeletingBulk(true);
    
    try {
      const selectedIds = Array.from(selectedItems);
      
      // Executar exclusão em paralelo para melhor performance
      const deletePromises = selectedIds.map(async (clientId) => {
        const { error } = await supabase
          .from('clients')
          .delete()
          .eq('id', clientId);
          
        if (error) {
          // Se for erro de constraint (cliente tem vendas), incluir na lista de falhas
          if (error.code === '23503' && error.message.includes('sales_client_id_fkey')) {
            return { clientId, error: 'Cliente possui vendas associadas' };
          }
          return { clientId, error: error.message };
        }
        
        return { clientId, success: true };
      });
      
      const results = await Promise.all(deletePromises);
      const successful = results.filter(r => r.success);
      const failed = results.filter(r => r.error);
      
      if (successful.length > 0) {
        toast.success(`${successful.length} cliente(s) excluído(s) com sucesso!`);
      }
      
      if (failed.length > 0) {
        const constraintErrors = failed.filter(f => f.error?.includes('vendas associadas'));
        const otherErrors = failed.filter(f => !f.error?.includes('vendas associadas'));
        
        if (constraintErrors.length > 0) {
          toast.error(`${constraintErrors.length} cliente(s) não puderam ser excluídos pois possuem vendas associadas.`);
        }
        
        if (otherErrors.length > 0) {
          toast.error(`${otherErrors.length} cliente(s) falharam na exclusão por outros motivos.`);
        }
      }
      
      clearSelection();
      setShowBulkDeleteDialog(false);
      handleFormSuccess(); // Atualizar a lista
      
    } catch (error) {
      console.error('Erro na exclusão em massa:', error);
      toast.error('Erro inesperado na exclusão em massa');
    } finally {
      setDeletingBulk(false);
    }
  };

  const openWhatsApp = (phone: string) => {
    const formattedPhone = formatPhoneForWhatsApp(phone);
    window.open(`https://wa.me/${formattedPhone}`, '_blank');
  };


  if (loading) {
    return (
      <div className="min-h-screen p-6 bg-transparent">
        <Card className="bg-white shadow-sm">
          <CardContent className="p-6">
            <div className="text-center">Carregando clientes...</div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6 bg-transparent">
      <Card className="bg-white shadow-sm">
        <CardContent className="p-6 space-y-6">
          <ClientManagementHeader 
            onNewClient={handleNewClient}
            onExportExcel={handleExportExcel}
            onImportExcel={handleImportExcel}
          />

          <ClientFilters
            searchTerm={searchTerm}
            typeFilter={typeFilter}
            filteredClientsCount={filteredClients.length}
            onSearchChange={setSearchTerm}
            onTypeFilterChange={setTypeFilter}
          />

          {isProcessing && (
            <Alert className="border-blue-200 bg-blue-50">
              <Info className="h-4 w-4" />
              <AlertDescription>
                <strong>Importação em andamento:</strong> Planilhas com muitas linhas podem levar alguns minutos para processar. 
                Por favor, aguarde e não feche a página.
              </AlertDescription>
            </Alert>
          )}

          {selectedCount > 0 && (
            <div className="flex items-center justify-between bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-blue-900">
                  {selectedCount} cliente(s) selecionado(s)
                </span>
              </div>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => setShowBulkDeleteDialog(true)}
                className="h-8"
              >
                <TrashIcon className="h-4 w-4 mr-2" />
                Excluir Selecionados
              </Button>
            </div>
          )}

          {paginatedClients.length === 0 ? (
            <EmptyState
              title="Nenhum cliente encontrado"
              description="Os clientes aparecerão aqui quando forem cadastrados."
              icon={Users}
            />
          ) : (
            <div>
              <ClientTable
                clients={paginatedClients}
                onEdit={handleEdit}
                onDelete={handleDelete}
                selectedItems={selectedItems}
                onItemSelect={toggleItem}
                onSelectAll={toggleAll}
                isAllSelected={isAllSelected}
                isPartiallySelected={isPartiallySelected}
              />
              <ClientPagination
                currentPage={currentPage}
                totalPages={totalPages}
                totalItems={totalItems}
                itemsPerPage={itemsPerPage}
                onPageChange={setCurrentPage}
                onItemsPerPageChange={setItemsPerPage}
              />
            </div>
          )}
        </CardContent>
      </Card>

      <ClientFormDialog
        showForm={showForm}
        editingClient={editingClient}
        onClose={handleFormClose}
        onSuccess={handleFormSuccess}
      />

      <ClientDeleteDialog
        clientToDelete={clientToDelete}
        onClose={() => setClientToDelete(null)}
        onConfirm={handleDeleteConfirm}
      />

      {historyClient && (
        <ClientHistoryModal
          clientId={historyClient.id}
          clientName={historyClient.name}
          isOpen={!!historyClient}
          onClose={() => setHistoryClient(null)}
        />
      )}

      {/* Modais de Importação */}

      <BulkDeleteDialog
        open={showBulkDeleteDialog}
        onOpenChange={setShowBulkDeleteDialog}
        onConfirm={handleBulkDelete}
        itemCount={selectedCount}
        itemType="cliente"
        loading={deletingBulk}
      />

      <ClientImportConflictDialog
        open={showConflictDialog}
        onOpenChange={setShowConflictDialog}
        conflicts={conflicts}
        onResolve={resolveConflicts}
        isProcessing={isProcessing}
      />

      <ClientImportProgressModal
        open={showProgressModal}
        progress={importProgress}
        status={importStatus}
      />

      <ClientImportSuccessModal
        open={showSuccessModal}
        onClose={() => setShowSuccessModal(false)}
        totalImported={totalImported}
      />
    </div>
  );
};

export default ClientManagement;
