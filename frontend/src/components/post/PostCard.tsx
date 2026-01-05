import React, { useEffect, useState, useRef } from 'react';
import { Post } from '../../api/post';
import { formatDate } from '../../utils/date';
import Avatar from '../Avatar';
import { useNavigate } from 'react-router-dom';
import userAPI from '../../api/user';

interface PostCardProps {
  post: Post;
  onViewActivity?: (activityId: number) => void;
  onLikeChange?: (postId: number, isLiked: boolean) => void;
  onOpenDetail?: (post: Post, expandComment?: boolean) => void;
  onEdit?: (post: Post) => void;
  onDelete?: (post: Post) => void;
  showEngagement?: boolean;
}

const PostCard: React.FC<PostCardProps> = ({
  post,
  onViewActivity,
  onLikeChange,
  onOpenDetail,
  onEdit,
  onDelete,
  showEngagement = true,
}) => {
  const navigate = useNavigate();
  const currentUser = userAPI.getCurrentUserFromStorage();
  const author = post.author;
  const authorName = author?.username || '';
  const displayName = author?.username || '匿名用户';
  const activity = post.activity;

  // Use ref to track post ID changes
  const prevPostIdRef = useRef(post.id);

  // Initialize state from post
  const [isLiked, setIsLiked] = useState(post.is_liked || false);
  const [likeCount, setLikeCount] = useState(post.like_count || 0);
  const [commentCount, setCommentCount] = useState(post.comment_count || 0);
  const [isLiking, setIsLiking] = useState(false);

  const showOwnerActions = !!(onEdit || onDelete);

  // Sync with post data when post changes
  useEffect(() => {
    // Only reset like state when it's a different post
    if (prevPostIdRef.current !== post.id) {
      setIsLiked(post.is_liked || false);
      setLikeCount(post.like_count || 0);
      prevPostIdRef.current = post.id;
    }
    // Always update comment count
    setCommentCount(post.comment_count || 0);
  }, [post.id, post.comment_count]);

  const handleLike = async () => {
    if (!currentUser || isLiking) return;

    setIsLiking(true);
    const newIsLiked = !isLiked;
    const previousLikeCount = likeCount;
    const previousIsLiked = isLiked;

    // Optimistic update
    setIsLiked(newIsLiked);
    setLikeCount(newIsLiked ? likeCount + 1 : Math.max(0, likeCount - 1));

    try {
      if (onLikeChange) {
        await onLikeChange(post.id, newIsLiked);
      }
    } catch (error) {
      // Rollback on error
      setIsLiked(previousIsLiked);
      setLikeCount(previousLikeCount);
    } finally {
      setIsLiking(false);
    }
  };


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

        {/* 内容 */}
        <p className="text-sm text-base-content whitespace-pre-wrap break-words line-clamp-5">
          {post.content}
        </p>

        {/* 相关活动 */}
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
                <p className="text-xs text-base-content/60">相关活动</p>
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
              userId={author?.id}
            />
             <div className="flex flex-col leading-tight min-w-0">
               <span
                 className="font-medium text-base-content/80 text-sm truncate cursor-pointer hover:text-primary"
                 onClick={(e) => {
                   e.stopPropagation();
                   if (author?.id) navigate(`/profile/${author.id}`);
                 }}
               >
                 {displayName}
               </span>
               <span className="whitespace-nowrap text-xs text-base-content/60">{formatDate(post.created_at)}</span>
             </div>
          </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              {showOwnerActions ? (
                <>
                  {onEdit && (
                    <button
                      className="btn btn-outline btn-xs"
                      onClick={(e) => {
                        e.stopPropagation();
                        onEdit(post);
                      }}
                    >
                      编辑
                    </button>
                  )}
                  {onDelete && (
                    <button
                      className="btn btn-error btn-xs"
                      onClick={(e) => {
                        e.stopPropagation();
                        onDelete(post);
                      }}
                    >
                      删除
                    </button>
                  )}
                </>
              ) : (
                showEngagement && (
                  <>
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
                        disabled={isLiking}
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
                        <span>{likeCount}</span>
                      </button>
                    )}
                  </>
                )
              )}
            </div>
        </div>
      </div>
    </div>
  );
};

export default PostCard;
