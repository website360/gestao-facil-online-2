-- Add new budget status values
ALTER TYPE budget_status ADD VALUE 'aguardando_aprovacao';
ALTER TYPE budget_status ADD VALUE 'aprovado';
ALTER TYPE budget_status ADD VALUE 'negado';