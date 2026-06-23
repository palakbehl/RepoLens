import React from 'react';

export const LoadingSpinner = ({ size = 'medium', message = 'Loading...' }) => {
  const sizeClasses = {
    small: 'w-4 h-4 border-2',
    medium: 'w-8 h-8 border-2',
    large: 'w-12 h-12 border-3',
  };

  return (
    <div className="flex flex-col items-center justify-center p-8 space-y-3">
      <div
        className={`${sizeClasses[size]} border-gray-200 border-t-brand animate-spin rounded-full`}
        role="status"
        aria-label="loading"
      />
      {message && (
        <span className="text-sm font-medium text-gray-500">{message}</span>
      )}
    </div>
  );
};

export default LoadingSpinner;
