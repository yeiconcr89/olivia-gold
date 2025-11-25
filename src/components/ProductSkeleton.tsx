import React from 'react';

const ProductSkeleton: React.FC = () => {
  return (
    <div className="bg-white rounded-xl shadow-elegant overflow-hidden animate-pulse">
      {/* Image Skeleton */}
      <div className="aspect-square bg-elegant-200"></div>
      
      {/* Content Skeleton */}
      <div className="p-6 space-y-4">
        {/* Title */}
        <div className="space-y-2">
          <div className="h-5 bg-elegant-200 rounded w-3/4"></div>
          <div className="h-4 bg-elegant-200 rounded w-1/2"></div>
        </div>
        
        {/* Rating */}
        <div className="flex items-center space-x-2">
          <div className="flex space-x-1">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-4 w-4 bg-elegant-200 rounded"></div>
            ))}
          </div>
          <div className="h-4 bg-elegant-200 rounded w-12"></div>
        </div>
        
        {/* Price */}
        <div className="space-y-2">
          <div className="h-6 bg-elegant-200 rounded w-24"></div>
          <div className="h-4 bg-elegant-200 rounded w-20"></div>
        </div>
        
        {/* Button */}
        <div className="h-12 bg-elegant-200 rounded-lg"></div>
      </div>
    </div>
  );
};

export default ProductSkeleton;