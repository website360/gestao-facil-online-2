import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Update user email function called');

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Get the authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    // Verify the user is authenticated and get their role
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser(token);

    if (userError || !user) {
      console.error('Authentication error:', userError);
      throw new Error('Invalid authentication');
    }

    // Check if the user has admin role
    const { data: profile, error: profileError } = await supabaseClient
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profileError || !['admin', 'gerente'].includes(profile?.role)) {
      console.error('Authorization error:', profileError);
      throw new Error('Only admins and managers can update user emails');
    }

    // Parse request body
    const { userId, newEmail } = await req.json();

    if (!userId || !newEmail) {
      throw new Error('userId and newEmail are required');
    }

    console.log('Updating email for user:', userId, 'to:', newEmail);

    // Update user email in auth.users using the admin client
    const { error: updateError } = await supabaseClient.auth.admin.updateUserById(
      userId,
      { email: newEmail }
    );

    if (updateError) {
      console.error('Error updating email in auth:', updateError);
      throw new Error(`Failed to update email in auth: ${updateError.message}`);
    }

    // Update email in profiles table
    const { error: profileUpdateError } = await supabaseClient
      .from('profiles')
      .update({ email: newEmail })
      .eq('id', userId);

    if (profileUpdateError) {
      console.error('Error updating email in profiles:', profileUpdateError);
      throw new Error(`Failed to update email in profiles: ${profileUpdateError.message}`);
    }

    console.log('Email updated successfully');

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Email updated successfully'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error) {
    console.error('Error in update-user-email function:', error);
    return new Response(
      JSON.stringify({
        error: error.message
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    );
  }
});