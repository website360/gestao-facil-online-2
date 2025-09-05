import { useState } from 'react';

export const useConfigurationManager = () => {
  const [loading, setLoading] = useState(false);

  return {
    loading
  };
};