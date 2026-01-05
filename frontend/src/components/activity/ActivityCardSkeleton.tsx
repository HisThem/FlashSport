import React from 'react';

/**
 * ActivityCard Skeleton Component
 * Loading placeholder for activity cards in grid layout
 */
const ActivityCardSkeleton: React.FC = () => {
  return (
    <div className="card bg-base-100 rounded-2xl shadow-xl h-full flex flex-col">
      {/* Cover Image Skeleton */}
      <div className="skeleton h-48 w-full rounded-t-2xl flex-shrink-0"></div>

      <div className="card-body flex-1 flex flex-col">
        {/* Title Skeleton */}
        <div className="skeleton h-6 w-3/4 mb-2"></div>

        {/* Description Skeleton */}
        <div className="space-y-2 mb-4">
          <div className="skeleton h-4 w-full"></div>
          <div className="skeleton h-4 w-5/6"></div>
        </div>

        {/* Info Items Skeleton */}
        <div className="space-y-2 flex-1">
          <div className="flex items-center gap-2">
            <div className="skeleton w-4 h-4 rounded-full"></div>
            <div className="skeleton h-4 w-32"></div>
          </div>
          <div className="flex items-center gap-2">
            <div className="skeleton w-4 h-4 rounded-full"></div>
            <div className="skeleton h-4 w-40"></div>
          </div>
          <div className="flex items-center gap-2">
            <div className="skeleton w-4 h-4 rounded-full"></div>
            <div className="skeleton h-4 w-24"></div>
          </div>
          <div className="flex items-center gap-2">
            <div className="skeleton w-4 h-4 rounded-full"></div>
            <div className="skeleton h-4 w-20"></div>
          </div>

          {/* Organizer Skeleton */}
          <div className="flex items-center gap-2 pt-2">
            <div className="skeleton w-8 h-8 rounded-full"></div>
            <div className="skeleton h-4 w-24"></div>
          </div>
        </div>

        {/* Action Button Skeleton */}
        <div className="card-actions justify-end mt-auto pt-4">
          <div className="skeleton h-8 w-24 rounded-lg"></div>
        </div>
      </div>
    </div>
  );
};

export default ActivityCardSkeleton;
