import React from 'react';

/**
 * PostCard Skeleton Component
 * Loading placeholder for post cards in masonry layout
 */
const PostCardSkeleton: React.FC = () => {
  return (
    <div className="card bg-base-100 rounded-2xl shadow-md border border-base-200 break-inside-avoid">
      {/* Cover Image Skeleton */}
      <div className="skeleton rounded-t-2xl w-full h-64"></div>

      <div className="card-body pt-4">
        {/* Content Skeleton - Multiple lines */}
        <div className="space-y-2">
          <div className="skeleton h-4 w-full"></div>
          <div className="skeleton h-4 w-5/6"></div>
          <div className="skeleton h-4 w-4/6"></div>
        </div>

        {/* Related Activity Skeleton */}
        <div className="mt-3 p-3 bg-base-200 rounded-lg">
          <div className="flex items-start gap-2">
            <div className="skeleton w-12 h-12 rounded flex-shrink-0"></div>
            <div className="flex-1 space-y-2">
              <div className="skeleton h-3 w-16"></div>
              <div className="skeleton h-4 w-32"></div>
            </div>
          </div>
        </div>

        {/* Author Info Skeleton */}
        <div className="mt-4 flex items-center justify-between">
          <div className="flex items-center gap-2 flex-1">
            <div className="skeleton w-8 h-8 rounded-full flex-shrink-0"></div>
            <div className="space-y-1 flex-1">
              <div className="skeleton h-3 w-20"></div>
              <div className="skeleton h-3 w-24"></div>
            </div>
          </div>
          <div className="flex items-center gap-3 flex-shrink-0">
            <div className="skeleton h-6 w-12 rounded"></div>
            <div className="skeleton h-6 w-12 rounded"></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PostCardSkeleton;
