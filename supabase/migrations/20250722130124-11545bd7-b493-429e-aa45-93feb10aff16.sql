-- Add new status to budget_status enum
ALTER TYPE budget_status ADD VALUE 'aguardando_aprovacao';

-- Update budgets table to support approval workflow
ALTER TABLE budgets 
ADD COLUMN approved_by uuid REFERENCES auth.users(id),
ADD COLUMN approved_at timestamp with time zone,
ADD COLUMN approval_notes text;