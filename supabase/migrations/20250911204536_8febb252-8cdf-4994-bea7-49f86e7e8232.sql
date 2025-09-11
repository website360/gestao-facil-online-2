-- Create registration_requests table
CREATE TABLE public.registration_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  document TEXT NOT NULL,
  address TEXT NOT NULL,
  city TEXT NOT NULL,
  state TEXT NOT NULL,
  zip_code TEXT NOT NULL,
  company TEXT,
  message TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.registration_requests ENABLE ROW LEVEL SECURITY;

-- Create policy to allow anyone to insert (public registration)
CREATE POLICY "Anyone can create registration requests" 
ON public.registration_requests 
FOR INSERT 
WITH CHECK (true);

-- Create policy for admin users to view all requests
CREATE POLICY "Admin users can view all registration requests" 
ON public.registration_requests 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() 
    AND role = 'admin'
  )
);

-- Create policy for admin users to update requests
CREATE POLICY "Admin users can update registration requests" 
ON public.registration_requests 
FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() 
    AND role = 'admin'
  )
);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_registration_requests_updated_at
BEFORE UPDATE ON public.registration_requests
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Add index for better performance on email lookups
CREATE INDEX idx_registration_requests_email ON public.registration_requests(email);
CREATE INDEX idx_registration_requests_status ON public.registration_requests(status);
CREATE INDEX idx_registration_requests_created_at ON public.registration_requests(created_at DESC);