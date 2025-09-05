import React from 'react';
import { Package2 } from 'lucide-react';

interface EmptyStateProps {
  title: string;
  description: string;
  icon?: React.ComponentType<any>;
}

const EmptyState = ({ 
  title, 
  description, 
  icon: Icon = Package2 
}: EmptyStateProps) => {
  return (
    <div className="text-center py-12">
      <div className="flex justify-center mb-4">
        <Icon className="h-16 w-16 text-gray-300" />
      </div>
      <h3 className="text-lg font-medium text-gray-600 mb-2">
        {title}
      </h3>
      <p className="text-sm text-gray-500">
        {description}
      </p>
    </div>
  );
};

export default EmptyState;