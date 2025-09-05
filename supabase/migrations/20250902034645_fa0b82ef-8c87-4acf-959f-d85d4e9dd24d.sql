-- Add entregador role to the user_role enum
ALTER TYPE user_role ADD VALUE 'entregador';

-- Add delivery_visible column to shipping_options table
ALTER TABLE shipping_options ADD COLUMN delivery_visible boolean DEFAULT false;