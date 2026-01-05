// "管理我的帖子" 功能
import React, { useState } from 'react';
import { Post } from '../../api/post';
import { formatDate } from '../../utils/date';
import ConfirmModal, { ConfirmModalConfig } from '../ConfirmModal';

interface ManagePostsModalProps {
  isOpen: boolean;
  posts: Post[];
  onClose: () => void;
  onEdit: (post: Post) => void;
  onDelete: (postId: number) => void;
  onViewDetail?: (post: Post) => void;
}

const ManagePostsModal: React.FC<ManagePostsModalProps> = ({
  isOpen,
  posts,
  onClose,
  onEdit,
  onDelete,
  onViewDetail,
}) => {
  const [confirmModal, setConfirmModal] = useState<ConfirmModalConfig>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
    onCancel: () => setConfirmModal(prev => ({ ...prev, isOpen: false })),
  });

  const showDeleteConfirm = (postId: number, e: React.MouseEvent) => {
    e.stopPropagation();
    setConfirmModal({
      isOpen: true,
      title: '确认删除',
      message: '确定要删除这条帖子吗？此操作不可撤销。',
      confirmText: '确认删除',
      cancelText: '取消',
      type: 'danger',
      onConfirm: () => {
        onDelete(postId);
        setConfirmModal(prev => ({ ...prev, isOpen: false }));
      },
      onCancel: () => setConfirmModal(prev => ({ ...prev, isOpen: false })),
    });
  };

  if (!isOpen) return null;

  return (
    <>
    <ConfirmModal {...confirmModal} />
    <div className="modal modal-open pt-20 z-20">
      <div className="modal-box modal-bounce relative w-11/12 max-w-4xl h-[80vh] max-h-[80vh] p-0 overflow-hidden flex flex-col bg-base-100">
        {/* Header */}
        <div className="flex items-center justify-between p-6 flex-shrink-0 border-b border-base-200">
          <h3 className="font-bold text-lg">管理我的帖子</h3>
          <button className="btn btn-sm btn-circle btn-ghost" onClick={onClose}>
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {posts.length === 0 ? (
            <div className="flex items-center justify-center h-full text-base-content/60">
              你还没有发布帖子。
            </div>
          ) : (
            <div className="space-y-4">
              {posts.map((post) => (
                <div
                  key={post.id}
                  className="p-4 bg-base-200 rounded-lg hover:bg-base-300 transition-colors cursor-pointer"
                  onClick={() => onViewDetail?.(post)}
                >
                  <div className="flex gap-4">
                    {/* Left: Cover Image */}
                    {post.cover_image_url && (
                      <div className="flex-shrink-0">
                        <img
                          src={post.cover_image_url}
                          alt="Post cover"
                          className="w-24 h-24 object-cover rounded-lg"
                        />
                      </div>
                    )}

                    {/* Middle: Content & Info */}
                    <div className="flex-1 min-w-0 max-w-md">
                      <h4 className="font-semibold text-base line-clamp-2 text-base-content">
                        {post.content.substring(0, 30)}
                        {post.content.length > 30 ? '...' : ''}
                      </h4>
                      <div className="text-xs text-base-content/60 mt-2">
                        发布于 {formatDate(post.created_at)}
                      </div>
                      <div className="flex gap-4 mt-2 text-xs text-base-content/70">
                        <div className="flex items-center gap-1">
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
                          <span>{post.comment_count || 0}</span>
                        </div>
                        <div className="flex items-center gap-1">
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
                              d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                            />
                          </svg>
                          <span>{post.like_count || 0}</span>
                        </div>
                      </div>
                    </div>

                    {/* Right: Actions */}
                    <div className="ml-auto flex flex-col gap-2 flex-shrink-0 justify-center">
                      <button
                        className="btn btn-ghost btn-sm gap-1 whitespace-nowrap"
                        onClick={(e) => {
                          e.stopPropagation();
                          onEdit(post);
                        }}
                        title="编辑"
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
                            d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                          />
                        </svg>
                        编辑
                      </button>
                      <button
                        className="btn btn-ghost btn-sm gap-1 text-error whitespace-nowrap"
                        onClick={(e) => showDeleteConfirm(post.id, e)}
                        title="删除"
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
                            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                          />
                        </svg>
                        删除
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      <div className="modal-backdrop" onClick={onClose}></div>
    </div>
    </>
  );
};

export default ManagePostsModal;
