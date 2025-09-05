-- Atualizar o usuário caiolimafrancisco@hotmail.com para role admin
UPDATE public.profiles 
SET role = 'admin'
WHERE email = 'caiolimafrancisco@hotmail.com';