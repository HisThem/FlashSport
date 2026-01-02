import React, { useEffect, useState } from 'react';
import { Post } from '../api/post';
import { formatDate } from '../utils/date';
import Avatar from './Avatar';
import userAPI from '../api/user';

interface PostCardProps {
  post: Post;
  onDelete?: (postId: number) => void;
  onEdit?: (post: Post) => void;
  onViewActivity?: (activityId: number) => void;
  onLikeChange?: (postId: number, isLiked: boolean) => void;
  onOpenDetail?: (post: Post, expandComment?: boolean) => void;
}

const PostCard: React.FC<PostCardProps> = ({
  post,
  onDelete,
  onEdit,
  onViewActivity,
  onLikeChange,
  onOpenDetail,
}) => {
  const [isLiked, setIsLiked] = useState(false);
  const [commentCount, setCommentCount] = useState(post.comment_count || 0);
  const currentUser = userAPI.getCurrentUserFromStorage();
  const author = post.author;
  const authorName = author?.username || '';
  const displayName = author?.username || '匿名用户';
  const activity = post.activity;

  useEffect(() => {
    setCommentCount(post.comment_count || 0);
  }, [post.comment_count]);

  const handleLike = async () => {
    if (!currentUser) return;
    setIsLiked(!isLiked);
    if (onLikeChange) {
      onLikeChange(post.id, !isLiked);
    }
  };

  const isOwner = currentUser && currentUser.id === post.author_id;

  return (
    <div className="card bg-base-100 rounded-2xl shadow-md border border-base-200 hover:shadow-lg transition-shadow break-inside-avoid">
      {/* 配图 */}
      {post.cover_image_url && (
        <img
          src={post.cover_image_url}
          alt="Post cover"
          className="rounded-t-2xl w-full max-h-80 object-cover cursor-pointer"
          onClick={() => onOpenDetail?.(post, false)}
        />
      )}

      <div className="card-body pt-4 cursor-pointer" onClick={() => onOpenDetail?.(post, false)}>
        {isOwner && (
          <div className="flex justify-end">
            <div className="dropdown dropdown-end">
              <button className="btn btn-ghost btn-xs">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  className="w-4 h-4 stroke-current"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z"
                  />
                </svg>
              </button>
              <ul className="dropdown-content z-[1] menu p-2 shadow bg-base-100 rounded-box w-52">
                <li>
                  <a onClick={() => onEdit?.(post)}>编辑</a>
                </li>
                <li>
                  <a onClick={() => onDelete?.(post.id)} className="text-error">
                    删除
                  </a>
                </li>
              </ul>
            </div>
          </div>
        )}

        {/* 内容 */}
        <p className="text-sm text-base-content whitespace-pre-wrap break-words line-clamp-5">
          {post.content}
        </p>

        {/* 关联活动 */}
        {activity && (
          <div
            className="mt-3 p-3 bg-base-200 rounded-lg cursor-pointer hover:bg-base-300 transition-colors"
            onClick={(e) => {
              e.stopPropagation();
              onViewActivity?.(activity.id);
            }}
          >
            <div className="flex items-start gap-2">
              {activity.cover_image_url && (
                <img
                  src={activity.cover_image_url}
                  alt={activity.name}
                  className="w-12 h-12 rounded object-cover flex-shrink-0"
                />
              )}
              <div className="flex-1 min-w-0">
                <p className="text-xs text-base-content/60">关联活动</p>
                <p className="font-semibold text-sm truncate">
                  {activity.name}
                </p>
              </div>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                className="w-4 h-4 stroke-current flex-shrink-0 mt-1"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </div>
          </div>
        )}

        {/* 作者信息 */}
        <div className="mt-4 flex items-center justify-between text-xs text-base-content/60 gap-2">
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <Avatar
              username={authorName}
              avatarUrl={author?.avatar_url}
              size="tiny"
            />
            <span className="font-medium text-base-content/80 text-sm truncate">
              {displayName}
            </span>
            <span className="whitespace-nowrap">· {formatDate(new Date(post.created_at))}</span>
          </div>
          <div className="flex items-center gap-3 flex-shrink-0">
            <button
              className="flex items-center gap-1 text-base-content/80 btn btn-ghost btn-xs px-2"
              onClick={(e) => {
                e.stopPropagation();
                onOpenDetail?.(post, true);
              }}
              type="button"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                className="w-4 h-4 stroke-current"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"
                />
              </svg>
              <span>{commentCount}</span>
            </button>
            {currentUser && (
              <button
                className={`btn btn-ghost btn-xs gap-1 flex-shrink-0 ${
                  isLiked ? 'text-error' : ''
                }`}
                onClick={(e) => {
                  e.stopPropagation();
                  handleLike();
                }}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill={isLiked ? 'currentColor' : 'none'}
                  viewBox="0 0 24 24"
                  className="w-4 h-4 stroke-current"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                  />
                </svg>
                <span>{post.like_count}</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PostCard;
