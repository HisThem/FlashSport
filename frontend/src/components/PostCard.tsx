import React, { useEffect, useState } from 'react';
import postAPI, { Post, Comment } from '../api/post';
import { formatDate } from '../utils/date';
import Avatar from './Avatar';
import userAPI from '../api/user';
import { useToast } from './Toast';

interface PostCardProps {
  post: Post;
  onDelete?: (postId: number) => void;
  onEdit?: (post: Post) => void;
  onViewActivity?: (activityId: number) => void;
  onLikeChange?: (postId: number, isLiked: boolean) => void;
}

const PostCard: React.FC<PostCardProps> = ({
  post,
  onDelete,
  onEdit,
  onViewActivity,
  onLikeChange,
}) => {
  const [isLiked, setIsLiked] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState<Comment[]>([]);
  const [commentText, setCommentText] = useState('');
  const [isLoadingComments, setIsLoadingComments] = useState(false);
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [commentCount, setCommentCount] = useState(post.comment_count || 0);
  const currentUser = userAPI.getCurrentUserFromStorage();
  const toast = useToast();
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

  const loadComments = async () => {
    setIsLoadingComments(true);
    try {
      const data = await postAPI.getComments(post.id);
      setComments(data);
      setCommentCount(data.length);
    } catch (error: any) {
      toast.error(error?.response?.data?.message || '加载评论失败');
    } finally {
      setIsLoadingComments(false);
    }
  };

  const handleToggleComments = async () => {
    const next = !showComments;
    setShowComments(next);
    if (next && comments.length === 0) {
      await loadComments();
    }
  };

  const handleSubmitComment = async () => {
    if (!currentUser) {
      toast.error('请先登录');
      return;
    }
    if (!commentText.trim()) return;

    setIsSubmittingComment(true);
    try {
      const comment = await postAPI.createComment(post.id, commentText.trim());
      setComments([comment, ...comments]);
      setCommentText('');
      setCommentCount((prev) => prev + 1);
    } catch (error: any) {
      toast.error(error?.response?.data?.message || '发表评论失败');
    } finally {
      setIsSubmittingComment(false);
    }
  };

  const handleDeleteComment = async (commentId: number) => {
    if (!currentUser) return;
    try {
      await postAPI.deleteComment(commentId);
      setComments((prev) => prev.filter((c) => c.id !== commentId));
      setCommentCount((prev) => Math.max(0, prev - 1));
    } catch (error: any) {
      toast.error(error?.response?.data?.message || '删除评论失败');
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
          className="rounded-t-2xl w-full max-h-80 object-cover"
        />
      )}

      <div className="card-body pt-4">
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
        <p className="text-sm text-base-content whitespace-pre-wrap break-words">
          {post.content}
        </p>

        {/* 关联活动 */}
        {activity && (
          <div
            className="mt-3 p-3 bg-base-200 rounded-lg cursor-pointer hover:bg-base-300 transition-colors"
            onClick={() => onViewActivity?.(activity.id)}
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
          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              className="btn btn-ghost btn-xs gap-1 flex-shrink-0"
              onClick={handleToggleComments}
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
                  d="M7 8h10M7 12h6m-9 1v3.586A1.5 1.5 0 005.5 18H19l-3.5-3.5H5.5A1.5 1.5 0 014 13.5v-8A1.5 1.5 0 015.5 4h13A1.5 1.5 0 0120 5.5v8"
                />
              </svg>
              <span>{commentCount}</span>
            </button>
            {currentUser && (
              <button
                className={`btn btn-ghost btn-xs gap-1 flex-shrink-0 ${
                  isLiked ? 'text-error' : ''
                }`}
                onClick={handleLike}
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

        {showComments && (
          <div className="mt-4 border-t pt-4 space-y-3">
            {currentUser ? (
              <div className="space-y-2">
                <textarea
                  className="textarea textarea-bordered w-full"
                  placeholder="写下你的想法..."
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  rows={3}
                />
                <div className="flex justify-end">
                  <button
                    className="btn btn-primary btn-sm"
                    onClick={handleSubmitComment}
                    disabled={isSubmittingComment || !commentText.trim()}
                  >
                    {isSubmittingComment ? '发布中...' : '发布评论'}
                  </button>
                </div>
              </div>
            ) : (
              <div className="alert alert-info text-sm">
                登录后可发表评论
              </div>
            )}

            {isLoadingComments ? (
              <div className="flex justify-center py-4">
                <span className="loading loading-spinner" />
              </div>
            ) : comments.length === 0 ? (
              <div className="text-center py-4 text-base-content/60 text-sm">
                暂无评论
              </div>
            ) : (
              <div className="space-y-3">
                {comments.map((comment) => (
                  <div key={comment.id} className="p-3 bg-base-200 rounded-lg">
                    <div className="flex items-start gap-3">
                      <Avatar
                        username={comment.user?.username || '?'}
                        avatarUrl={comment.user?.avatar_url}
                        size="tiny"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 text-sm">
                          <span className="font-medium text-base-content/80">
                            {comment.user?.username || '用户'}
                          </span>
                          <span className="text-base-content/60">
                            {formatDate(new Date(comment.create_time))}
                          </span>
                        </div>
                        <p className="mt-1 text-base-content/80 whitespace-pre-wrap break-words">
                          {comment.content}
                        </p>
                      </div>
                      {(currentUser?.id === comment.user_id || currentUser?.role === 'admin') && (
                        <button
                          className="btn btn-ghost btn-xs text-error"
                          onClick={() => handleDeleteComment(comment.id)}
                        >
                          删除
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default PostCard;
