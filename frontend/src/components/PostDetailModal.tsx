import React, { useEffect, useMemo, useState } from 'react';
import postAPI, { Post, Comment } from '../api/post';
import Avatar from './Avatar';
import { formatDate } from '../utils/date';
import userAPI from '../api/user';

interface PostDetailModalProps {
  post: Post | null;
  isOpen: boolean;
  onClose: () => void;
  onLikeChange?: (postId: number, isLiked: boolean) => void;
  expandCommentOnOpen?: boolean;
  onViewActivity?: (activityId: number) => void;
}

const PostDetailModal: React.FC<PostDetailModalProps> = ({
  post,
  isOpen,
  onClose,
  onLikeChange,
  expandCommentOnOpen,
  onViewActivity,
}) => {
  const [comments, setComments] = useState<Comment[]>([]);
  const [isLoadingComments, setIsLoadingComments] = useState(false);
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [isCommentExpanded, setIsCommentExpanded] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const [likeCount, setLikeCount] = useState<number>(post?.like_count || 0);
  const [commentCount, setCommentCount] = useState<number>(post?.comment_count || 0);
  const currentUser = userAPI.getCurrentUserFromStorage();

  useEffect(() => {
    if (isOpen && post) {
      setLikeCount(post.like_count || 0);
      setCommentCount(post.comment_count || 0);
      loadComments();
      setIsCommentExpanded(!!expandCommentOnOpen);
    } else {
      setIsCommentExpanded(false);
      setCommentText('');
    }
  }, [isOpen, post?.id, expandCommentOnOpen]);

  const placeholderImage = useMemo(
    () => 'https://via.placeholder.com/600x600?text=Post+Image',
    [],
  );

  const loadComments = async () => {
    if (!post) return;
    setIsLoadingComments(true);
    try {
      const data = await postAPI.getComments(post.id);
      setComments(data);
      setCommentCount(data.length);
    } catch (error) {
      console.error('加载评论失败', error);
    } finally {
      setIsLoadingComments(false);
    }
  };

  const handleSubmitComment = async () => {
    if (!post || !currentUser) return;
    if (!commentText.trim()) return;
    setIsSubmittingComment(true);
    try {
      const comment = await postAPI.createComment(post.id, commentText.trim());
      setComments((prev) => [comment, ...prev]);
      setCommentText('');
      setCommentCount((prev) => prev + 1);
      setIsCommentExpanded(false);
    } catch (error) {
      console.error('发表评论失败', error);
    } finally {
      setIsSubmittingComment(false);
    }
  };

  const handleDeleteComment = async (commentId: number) => {
    if (!post || !currentUser) return;
    try {
      await postAPI.deleteComment(commentId);
      setComments((prev) => prev.filter((c) => c.id !== commentId));
      setCommentCount((prev) => Math.max(0, prev - 1));
    } catch (error) {
      console.error('删除评论失败', error);
    }
  };

  const handleLike = async () => {
    if (!post || !currentUser) return;
    const nextLiked = !isLiked;
    setIsLiked(nextLiked);
    setLikeCount((prev) => (nextLiked ? prev + 1 : Math.max(0, prev - 1)));
    try {
      if (nextLiked) {
        await postAPI.likePost(post.id);
      } else {
        await postAPI.unlikePost(post.id);
      }
      onLikeChange?.(post.id, nextLiked);
    } catch (error) {
      console.error('点赞操作失败', error);
    }
  };

  if (!isOpen || !post) return null;

  return (
    <div className="modal modal-open pt-20 z-30">
      <div className="modal-box modal-bounce relative w-11/12 max-w-6xl h-[90vh] max-h-[90vh] p-0 overflow-hidden bg-base-100">
        <button
          className="btn btn-sm btn-circle btn-ghost absolute top-4 right-4 z-10"
          onClick={onClose}
        >
          ✕
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-2 h-full">
          {/* Left: Image */}
          <div className="bg-base-200 h-full min-h-[320px] flex items-center justify-center overflow-hidden p-4">
            <img
              src={post.cover_image_url || placeholderImage}
              alt="Post"
              className="max-w-full max-h-full object-contain"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.src = placeholderImage;
              }}
            />
          </div>

          {/* Right: Content & Comments */}
          <div className="p-6 flex flex-col h-full gap-4 overflow-hidden">
            {/* Author at top */}
            <div className="flex items-center gap-3">
              <Avatar
                username={post.author?.username || ''}
                avatarUrl={post.author?.avatar_url}
                size="small"
                userId={post.author?.id}
              />
              <div className="flex-col">
                <span className="font-semibold text-base">{post.author?.username || '用户'}</span>
                <span className="text-sm text-base-content/60">发布于 {formatDate(new Date(post.created_at))}</span>
              </div>
            </div>

            {/* Content */}
            <div className="space-y-2">
              <div className="text-base-content whitespace-pre-wrap break-words leading-relaxed text-lg">
                {post.content}
              </div>
            </div>

            {/* Associated Activity */}
            {post.activity && (
              <div
                className="p-3 bg-base-200 rounded-lg cursor-pointer hover:bg-base-300 transition-colors"
                onClick={() => onViewActivity?.(post.activity!.id)}
              >
                <div className="flex items-start gap-2">
                  {post.activity.cover_image_url && (
                    <img
                      src={post.activity.cover_image_url}
                      alt={post.activity.name}
                      className="w-12 h-12 rounded object-cover flex-shrink-0"
                    />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-base-content/60">相关活动</p>
                    <p className="font-semibold text-sm truncate">{post.activity.name}</p>
                  </div>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    className="w-4 h-4 stroke-current flex-shrink-0 mt-1"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </div>
            )}

            <div className="flex-1 min-h-0 flex flex-col gap-4">
              {/* Comments */}
              <div className="border-t pt-4 flex-1 min-h-0 overflow-y-auto">
                <div className="flex items-center gap-2 mb-3 text-sm text-base-content/70">
                  <span className="font-semibold">评论</span>
                  <span className="badge badge-ghost badge-sm">{commentCount}</span>
                </div>
                {isLoadingComments ? (
                  <div className="flex justify-center py-6">
                    <span className="loading loading-spinner" />
                  </div>
                ) : comments.length === 0 ? (
                  <div className="flex justify-center py-6">
                    <span className="text-base-content/60 text-sm">暂无评论</span>
                  </div>
                ) : (
                  <div className="space-y-3 pr-1">
                    {comments.map((comment) => (
                      <div key={comment.id} className="p-3 bg-base-200 rounded-lg">
                        <div className="flex items-start gap-3">
                          <Avatar
                            username={comment.user?.username || '?'}
                            avatarUrl={comment.user?.avatar_url}
                            size="tiny"
                            userId={comment.user?.id}
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

              {/* Footer actions pinned to bottom */}
              <div className="border-t pt-4 flex flex-col gap-3 flex-shrink-0">
                {isCommentExpanded ? (
                  <>
                    <textarea
                      className="textarea textarea-bordered w-full"
                      placeholder={currentUser ? '写下你的评论...' : '登录后可评论'}
                      value={commentText}
                      onChange={(e) => setCommentText(e.target.value)}
                      rows={4}
                      autoFocus
                      disabled={!currentUser}
                    />
                    <div className="flex items-center justify-end gap-3">
                      <button
                        className="btn btn-ghost btn-sm"
                        onClick={() => {
                          setIsCommentExpanded(false);
                          setCommentText('');
                        }}
                      >
                        取消
                      </button>
                      <button
                        className="btn btn-primary btn-sm"
                        onClick={handleSubmitComment}
                        disabled={!currentUser || isSubmittingComment || !commentText.trim()}
                      >
                        {isSubmittingComment ? '发送中...' : '发送'}
                      </button>
                    </div>
                  </>
                ) : (
                  <div className="flex items-center gap-4">
                    <textarea
                      className="textarea textarea-bordered w-full min-h-[44px]"
                      placeholder={currentUser ? '说点什么...' : '登录后可评论'}
                      value={commentText}
                      onChange={(e) => setCommentText(e.target.value)}
                      rows={1}
                      disabled={!currentUser}
                      onFocus={() => currentUser && setIsCommentExpanded(true)}
                    />
                    <div className="flex items-center gap-3 whitespace-nowrap">
                      {currentUser && (
                        <button
                          className={`btn btn-ghost btn-sm gap-1 ${isLiked ? 'text-error' : ''}`}
                          onClick={handleLike}
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            fill={isLiked ? 'currentColor' : 'none'}
                            viewBox="0 0 24 24"
                            className="w-5 h-5 stroke-current"
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
                      <button
                        className="flex items-center gap-1 text-base-content/70 text-sm btn btn-ghost btn-sm px-2"
                        onClick={() => setIsCommentExpanded(true)}
                        type="button"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                          className="w-5 h-5 stroke-current"
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
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="modal-backdrop" onClick={onClose}></div>
    </div>
  );
};

export default PostDetailModal;
