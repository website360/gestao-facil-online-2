
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import type { LocalBudget } from '@/hooks/useBudgetManagement';

interface BudgetFormData {
  client_id: string;
  notes: string;
  discount_percentage: number;
  invoice_percentage: number;
  taxes_amount: number;
  payment_method_id: string;
  payment_type_id: string;
  shipping_option_id: string;
  shipping_cost: number;
  local_delivery_info: string;
  installments: number;
  check_installments: number;
  check_due_dates: number[];
  boleto_installments: number;
  boleto_due_dates: number[];
  items: Array<{
    product_id: string;
    quantity: number;
    unit_price: number;
    discount_percentage: number;
    product_code?: string;
  }>;
  status: 'processando' | 'aguardando_aprovacao' | 'aprovado';
}

export class BudgetService {
  // Função para comparar se apenas preços/descontos foram alterados
  private static isOnlyPriceOrDiscountChange(
    formData: BudgetFormData, 
    originalBudget: LocalBudget
  ): boolean {
    console.log('=== CHECKING IF ONLY PRICE/DISCOUNT CHANGES ===');
    console.log('Form data items:', formData.items);
    console.log('Original budget items:', originalBudget.budget_items);
    
    // Verificar se desconto geral mudou
    const generalDiscountChanged = formData.discount_percentage !== (originalBudget.discount_percentage || 0);
    console.log('General discount changed:', generalDiscountChanged);
    
    // Verificar mudanças nos itens
    const originalItems = originalBudget.budget_items || [];
    const formItems = formData.items.filter(item => item.product_id && item.product_id.trim() !== '' && item.quantity > 0);
    
    // Se quantidade de itens mudou, não é apenas preço/desconto
    if (originalItems.length !== formItems.length) {
      console.log('Different number of items - not only price/discount change');
      return false;
    }
    
    // Verificar cada item
    for (let i = 0; i < formItems.length; i++) {
      const formItem = formItems[i];
      const originalItem = originalItems.find(orig => orig.product_id === formItem.product_id);
      
      if (!originalItem) {
        console.log('New product found - not only price/discount change');
        return false;
      }
      
      // Verificar se algo além de preço e desconto mudou
      if (
        formItem.product_id !== originalItem.product_id ||
        formItem.quantity !== originalItem.quantity
      ) {
        console.log('Product or quantity changed - not only price/discount change');
        return false;
      }
      
      // Verificar se preço ou desconto do item mudou
      const priceChanged = formItem.unit_price !== originalItem.unit_price;
      const itemDiscountChanged = formItem.discount_percentage !== (originalItem.discount_percentage || 0);
      
      console.log(`Item ${i}: price changed: ${priceChanged}, discount changed: ${itemDiscountChanged}`);
    }
    
    // Verificar se outras propriedades importantes mudaram
    const otherFieldsChanged = (
      formData.client_id !== originalBudget.client_id ||
      formData.notes !== (originalBudget.notes || '') ||
      formData.invoice_percentage !== (originalBudget.invoice_percentage || 0) ||
      formData.payment_method_id !== (originalBudget.payment_method_id || '') ||
      formData.payment_type_id !== (originalBudget.payment_type_id || '') ||
      formData.shipping_option_id !== (originalBudget.shipping_option_id || '') ||
      formData.shipping_cost !== (originalBudget.shipping_cost || 0) ||
      formData.local_delivery_info !== (originalBudget.local_delivery_info || '') ||
      formData.installments !== (originalBudget.installments || 1) ||
      formData.check_installments !== (originalBudget.check_installments || 1) ||
      JSON.stringify(formData.check_due_dates) !== JSON.stringify(originalBudget.check_due_dates || []) ||
      formData.boleto_installments !== (originalBudget.boleto_installments || 1) ||
      JSON.stringify(formData.boleto_due_dates) !== JSON.stringify(originalBudget.boleto_due_dates || [])
    );
    
    console.log('Other fields changed:', otherFieldsChanged);
    
    // É apenas mudança de preço/desconto se:
    // 1. Mudou desconto geral OU preços/descontos de itens
    // 2. E NÃO mudou nenhum outro campo importante
    const isPriceOrDiscountOnly = !otherFieldsChanged;
    
    console.log('Is only price/discount change:', isPriceOrDiscountOnly);
    console.log('=== END CHECKING PRICE/DISCOUNT CHANGES ===');
    
    return isPriceOrDiscountOnly;
  }
  static validateFormData(formData: BudgetFormData): boolean {
    console.log('=== VALIDATING FORM DATA ===');
    console.log('Form data received:', formData);
    console.log('Client ID:', formData.client_id);
    console.log('Items:', formData.items);
    
    if (!formData.client_id || formData.client_id.trim() === '') {
      console.error('Validation failed: No client selected');
      console.error('Client ID value:', formData.client_id);
      toast.error('Selecione um cliente');
      return false;
    }

    if (!formData.items || formData.items.length === 0) {
      console.error('Validation failed: No items found');
      toast.error('Adicione pelo menos um item válido');
      return false;
    }

    const validItems = formData.items.filter(item => 
      item.product_id && 
      item.product_id.trim() !== '' && 
      item.quantity > 0
    );

    console.log('Valid items count:', validItems.length);
    console.log('Valid items:', validItems);

    if (validItems.length === 0) {
      console.error('Validation failed: No valid items found');
      console.error('All items:', formData.items);
      toast.error('Adicione pelo menos um item válido com produto selecionado');
      return false;
    }

    console.log('Form data validation passed');
    console.log('=== END VALIDATION ===');
    return true;
  }

  static async validateStock(formData: BudgetFormData, isClient: boolean = false, userRole?: string): Promise<boolean> {
    console.log('=== VALIDATING STOCK ===');
    console.log('Is client user:', isClient);
    console.log('User role:', userRole);
    
    // Clientes e vendedores não têm validação de estoque - apenas admin e gerente
    if (isClient || (userRole && userRole !== 'admin' && userRole !== 'gerente')) {
      console.log('Skipping stock validation for client or non-admin/gerente user');
      console.log('=== END STOCK VALIDATION ===');
      return true;
    }
    
    for (const item of formData.items) {
      if (!item.product_id || item.quantity <= 0) continue;
      
      const { data: product, error } = await supabase
        .from('products')
        .select('stock, name')
        .eq('id', item.product_id)
        .single();

      if (error) {
        console.error('Error fetching product stock:', error);
        toast.error('Erro ao verificar estoque dos produtos');
        return false;
      }

      if (product.stock < item.quantity) {
        toast.error(`Estoque insuficiente para ${product.name}. Disponível: ${product.stock}, Solicitado: ${item.quantity}`);
        return false;
      }
    }

    console.log('Stock validation passed');
    console.log('=== END STOCK VALIDATION ===');
    return true;
  }

  // Calcular total APENAS com produtos e frete, SEM incluir nota fiscal
  static calculateTotalAmount(formData: BudgetFormData): number {
    const itemsTotal = formData.items.reduce((sum, item) => {
      if (!item.product_id || item.quantity <= 0) return sum;
      
      const itemTotal = item.quantity * item.unit_price;
      const itemDiscount = itemTotal * (item.discount_percentage / 100);
      return sum + (itemTotal - itemDiscount);
    }, 0);

    // Total final = produtos + frete (SEM nota fiscal)
    const finalTotal = itemsTotal + formData.shipping_cost;
    console.log('Calculated total amount (WITHOUT invoice):', finalTotal, 'from items total:', itemsTotal, 'plus shipping:', formData.shipping_cost);
    return finalTotal;
  }

  static async createBudget(formData: BudgetFormData, userId: string, isClient: boolean = false, userRole?: string): Promise<void> {
    console.log('=== CREATING BUDGET ===');
    console.log('Form data for creation:', formData);
    console.log('User ID:', userId);
    console.log('Is client:', isClient);
    console.log('User role:', userRole);
    
    try {
      // Validar Nota Fiscal apenas para admin/gerente (não clientes)
      const requireInvoice = !isClient && (userRole === 'admin' || userRole === 'gerente');
      if (requireInvoice && (formData.invoice_percentage === 0 || formData.invoice_percentage === null || formData.invoice_percentage === undefined)) {
        console.error('Invoice percentage validation failed (admin/gerente required):', formData.invoice_percentage);
        toast.error('O campo "Nota Fiscal (%) - Apenas Informativo" é obrigatório para administradores e gerentes');
        throw new Error('Campo Nota Fiscal é obrigatório para admin/gerente');
      }
      
      // Validate stock before creating budget
      console.log('Starting stock validation...');
      if (!(await this.validateStock(formData, isClient, userRole))) {
        console.error('Stock validation failed');
        return;
      }
      
      console.log('Calculating total amount...');
      const totalAmount = this.calculateTotalAmount(formData);
      console.log('Total amount calculated:', totalAmount);

      const budgetPayload = {
        client_id: formData.client_id,
        created_by: userId,
        notes: formData.notes,
        status: 'processando' as const,
        total_amount: totalAmount,
        discount_percentage: formData.discount_percentage,
        invoice_percentage: formData.invoice_percentage,
        payment_method_id: formData.payment_method_id || null,
        payment_type_id: formData.payment_type_id || null,
        shipping_option_id: formData.shipping_option_id || null,
        shipping_cost: formData.shipping_cost,
        local_delivery_info: formData.local_delivery_info || null,
        installments: formData.installments,
        check_installments: formData.check_installments,
        check_due_dates: formData.check_due_dates,
        boleto_installments: formData.boleto_installments,
        boleto_due_dates: formData.boleto_due_dates
      };

      console.log('Budget payload to insert:', budgetPayload);

      const { data: budgetData, error: budgetError } = await supabase
        .from('budgets')
        .insert(budgetPayload)
        .select()
        .single();

      if (budgetError) {
        console.error('Error creating budget:', budgetError);
        throw budgetError;
      }

      console.log('Budget created successfully:', budgetData);

      // Filtrar e DEDUPLICAR itens válidos por product_id para respeitar a unique constraint
      const validItems = formData.items
        .filter(item => item.product_id && item.product_id.trim() !== '' && item.quantity > 0);

      // Agrupar por product_id somando quantidades e total_price (preserva valor final mesmo com descontos diferentes)
      const dedupMap = new Map<string, {
        budget_id: string;
        product_id: string;
        quantity: number;
        unit_price: number;
        discount_percentage: number;
        total_price: number;
      }>();

      for (const item of validItems) {
        const key = item.product_id;
        const lineTotal = item.quantity * item.unit_price * (1 - item.discount_percentage / 100);
        if (dedupMap.has(key)) {
          const existing = dedupMap.get(key)!;
          existing.quantity += item.quantity;
          existing.total_price += lineTotal; // preserva o total calculado de cada linha
          // manter o maior desconto como representativo
          existing.discount_percentage = Math.max(existing.discount_percentage, item.discount_percentage || 0);
          // manter o último unit_price informado
          existing.unit_price = item.unit_price;
        } else {
          dedupMap.set(key, {
            budget_id: budgetData.id,
            product_id: item.product_id,
            quantity: item.quantity,
            unit_price: item.unit_price,
            discount_percentage: item.discount_percentage || 0,
            total_price: lineTotal,
          });
        }
      }

      const budgetItems = Array.from(dedupMap.values());

      console.log('Budget items to insert (deduplicated):', budgetItems);

      if (budgetItems.length > 0) {
        const { error: itemsError } = await supabase
          .from('budget_items')
          .insert(budgetItems);

        if (itemsError) {
          console.error('Error inserting budget items:', itemsError);
          throw itemsError;
        }
      }

      console.log('Budget items created successfully');
      console.log('=== END CREATING BUDGET ===');
      toast.success('Orçamento criado com sucesso!');
    } catch (error) {
      console.error('Error in createBudget:', error);
      toast.error('Erro ao criar orçamento: ' + (error instanceof Error ? error.message : 'Erro desconhecido'));
      throw error;
    }
  }

  static async updateBudget(formData: BudgetFormData, editingBudget: LocalBudget, isClient: boolean = false, userRole?: string): Promise<void> {
    console.log('=== UPDATING BUDGET ===');
    console.log('Form data for update:', formData);
    console.log('Editing budget:', editingBudget);
    console.log('Is client:', isClient);
    console.log('User role:', userRole);
    
    try {
      // Validar Nota Fiscal apenas para admin/gerente (não clientes)
      const requireInvoice = !isClient && (userRole === 'admin' || userRole === 'gerente');
      if (requireInvoice && (formData.invoice_percentage === 0 || formData.invoice_percentage === null || formData.invoice_percentage === undefined)) {
        console.error('Invoice percentage validation failed (admin/gerente required):', formData.invoice_percentage);
        toast.error('O campo "Nota Fiscal (%) - Apenas Informativo" é obrigatório para administradores e gerentes');
        throw new Error('Campo Nota Fiscal é obrigatório para admin/gerente');
      }
      
      // Validate stock before updating budget
      console.log('Starting stock validation...');
      if (!(await this.validateStock(formData, isClient, userRole))) {
        console.error('Stock validation failed');
        return;
      }
      
      console.log('Calculating total amount...');
      const totalAmount = this.calculateTotalAmount(formData);
      console.log('Total amount calculated:', totalAmount);
      
      // Determinar o status baseado na lógica de negócio
      let newStatus = formData.status;
      
      // Se for admin/gerente editando orçamento que estava aguardando aprovação
      const isAdminOrManager = !isClient && (userRole === 'admin' || userRole === 'gerente');
      const wasAwaitingApproval = editingBudget.status === 'aguardando_aprovacao';
      
      if (isAdminOrManager && wasAwaitingApproval) {
        // Verificar se são apenas alterações de preço/desconto
        const isOnlyPriceOrDiscountChange = this.isOnlyPriceOrDiscountChange(formData, editingBudget);
        
        if (isOnlyPriceOrDiscountChange) {
          // Admin/gerente pode manter o status aguardando_aprovacao para aprovar diretamente
          newStatus = 'aguardando_aprovacao';
          console.log('Only price/discount changes detected - keeping status as aguardando_aprovacao for direct approval');
        } else {
          // Outras alterações fazem voltar para processando
          newStatus = 'processando';
          console.log('Other changes detected - returning to processando status');
        }
      } else if (isClient && wasAwaitingApproval) {
        // Cliente sempre volta para processando quando edita
        newStatus = 'processando';
        console.log('Client editing - returning to processando status');
      } else {
        // Outros casos mantêm status processando ou status atual do form
        newStatus = formData.status || 'processando';
        console.log('Using form status or default processando:', newStatus);
      }

      const budgetPayload = {
        client_id: formData.client_id,
        notes: formData.notes,
        status: newStatus,
        total_amount: totalAmount,
        discount_percentage: formData.discount_percentage,
        invoice_percentage: formData.invoice_percentage,
        payment_method_id: formData.payment_method_id || null,
        payment_type_id: formData.payment_type_id || null,
        shipping_option_id: formData.shipping_option_id || null,
        shipping_cost: formData.shipping_cost,
        local_delivery_info: formData.local_delivery_info || null,
        installments: formData.installments,
        check_installments: formData.check_installments,
        check_due_dates: formData.check_due_dates,
        boleto_installments: formData.boleto_installments,
        boleto_due_dates: formData.boleto_due_dates,
        updated_at: new Date().toISOString()
      };

      console.log('Budget update payload:', budgetPayload);

      // Update existing budget
      const { error: budgetError } = await supabase
        .from('budgets')
        .update(budgetPayload)
        .eq('id', editingBudget.id);

      if (budgetError) {
        console.error('Error updating budget:', budgetError);
        throw budgetError;
      }

      console.log('Budget updated successfully');

      // Delete existing budget items
      const { error: deleteError } = await supabase
        .from('budget_items')
        .delete()
        .eq('budget_id', editingBudget.id);

      if (deleteError) {
        console.error('Error deleting existing items:', deleteError);
        throw deleteError;
      }

      console.log('Existing budget items deleted');

      // Filtrar e DEDUPLICAR itens válidos por product_id para respeitar a unique constraint
      const validItems = formData.items
        .filter(item => item.product_id && item.product_id.trim() !== '' && item.quantity > 0);

      const dedupMap = new Map<string, {
        budget_id: string;
        product_id: string;
        quantity: number;
        unit_price: number;
        discount_percentage: number;
        total_price: number;
      }>();

      for (const item of validItems) {
        const key = item.product_id;
        const lineTotal = item.quantity * item.unit_price * (1 - item.discount_percentage / 100);
        if (dedupMap.has(key)) {
          const existing = dedupMap.get(key)!;
          existing.quantity += item.quantity;
          existing.total_price += lineTotal;
          existing.discount_percentage = Math.max(existing.discount_percentage, item.discount_percentage || 0);
          existing.unit_price = item.unit_price;
        } else {
          dedupMap.set(key, {
            budget_id: editingBudget.id,
            product_id: item.product_id,
            quantity: item.quantity,
            unit_price: item.unit_price,
            discount_percentage: item.discount_percentage || 0,
            total_price: lineTotal,
          });
        }
      }

      const budgetItems = Array.from(dedupMap.values());

      console.log('New budget items to insert (deduplicated):', budgetItems);

      if (budgetItems.length > 0) {
        const { error: itemsError } = await supabase
          .from('budget_items')
          .insert(budgetItems);

        if (itemsError) {
          console.error('Error inserting budget items:', itemsError);
          throw itemsError;
        }
      }

      console.log('New budget items inserted successfully');
      
      // Mostrar mensagem diferente baseada no status final
      if (isAdminOrManager && wasAwaitingApproval && newStatus === 'aguardando_aprovacao') {
        toast.success('Orçamento atualizado com sucesso! Apenas preços/descontos alterados - pronto para aprovação.');
      } else {
        toast.success('Orçamento atualizado com sucesso!');
      }
      
      console.log('=== END UPDATING BUDGET ===');
    } catch (error) {
      console.error('Error in updateBudget:', error);
      toast.error('Erro ao atualizar orçamento: ' + (error instanceof Error ? error.message : 'Erro desconhecido'));
      throw error;
    }
  }
}
