import React from 'react';

const LoaderSpinner: React.FC = () => {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gold-500"></div>
    </div>
  );
};

export default LoaderSpinner;