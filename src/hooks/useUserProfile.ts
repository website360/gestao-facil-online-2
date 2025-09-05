
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export const useUserProfile = () => {
  const { user } = useAuth();
  const [userProfile, setUserProfile] = useState<{ id: string; role: string; name: string; email: string } | null>(null);
  const [profileLoading, setProfileLoading] = useState(true);

  useEffect(() => {
    const fetchUserProfile = async () => {
      if (user) {
        try {
          const { data, error } = await supabase
            .from('profiles')
            .select('id, role, name, email')
            .eq('id', user.id)
            .single();

          if (error) {
            console.error('Error fetching user profile:', error);
            return;
          }

          setUserProfile(data);
        } catch (error) {
          console.error('Unexpected error fetching user profile:', error);
        } finally {
          setProfileLoading(false);
        }
      }
    };

    fetchUserProfile();
  }, [user]);

  const isAdmin = userProfile?.role === 'admin' || userProfile?.role === 'gerente';

  return {
    userProfile,
    profileLoading,
    isAdmin
  };
};
