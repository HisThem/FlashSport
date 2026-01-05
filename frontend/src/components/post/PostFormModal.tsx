import React, { useState, useEffect } from 'react';
import { Post, CreatePostPayload } from '../../api/post';
import activityAPI, { Activity } from '../../api/activity';
import ConfirmModal, { ConfirmModalConfig } from '../ConfirmModal';

interface PostFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (payload: CreatePostPayload) => Promise<void>;
  editingPost?: Post | null;
  isLoading?: boolean;
}

type ImagePreviewStatus = 'idle' | 'loading' | 'loaded' | 'error';

const PostFormModal: React.FC<PostFormModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  editingPost,
  isLoading = false,
}) => {
  const [content, setContent] = useState('');
  const [coverImageUrl, setCoverImageUrl] = useState('');
  const [selectedActivityId, setSelectedActivityId] = useState<number | null>(
    null,
  );
  const [enrolledActivities, setEnrolledActivities] = useState<Activity[]>([]);
  const [searchResults, setSearchResults] = useState<Activity[]>([]);
  const [showActivitySearch, setShowActivitySearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [isLoadingEnrolled, setIsLoadingEnrolled] = useState(false);
  const [imagePreviewStatus, setImagePreviewStatus] = useState<ImagePreviewStatus>('idle');
  const [confirmModal, setConfirmModal] = useState<ConfirmModalConfig>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
    onCancel: () => setConfirmModal(prev => ({ ...prev, isOpen: false })),
  });

  useEffect(() => {
    if (isOpen) {
      loadEnrolledActivities();
      if (editingPost) {
        setContent(editingPost.content);
        setCoverImageUrl(editingPost.cover_image_url || '');
        setSelectedActivityId(editingPost.activity_id || null);
      } else {
        resetForm();
      }
    }
  }, [editingPost, isOpen]);

  // 监听配图URL变化，执行预览状态检查
  useEffect(() => {
    const url = coverImageUrl;
    if (!url) {
      setImagePreviewStatus('idle');
      return;
    }

    setImagePreviewStatus('loading');
    let cancelled = false;
    const img = new Image();
    img.onload = () => {
      if (!cancelled) setImagePreviewStatus('loaded');
    };
    img.onerror = () => {
      if (!cancelled) setImagePreviewStatus('error');
    };
    img.src = url;

    return () => {
      cancelled = true;
    };
  }, [coverImageUrl]);

  // 搜索活动 - 防抖搜索
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const result = await activityAPI.getActivities({
          keyword: searchQuery,
          page: 1,
          limit: 20,
        });
        // 筛选掉已经在已参加活动中的活动
        const filtered = result.items.filter(
          (item) => !enrolledActivities.some((enrolled) => enrolled.id === item.id),
        );
        setSearchResults(filtered);
      } catch (error) {
        console.error('搜索活动失败:', error);
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 500); // 500ms 防抖

    return () => clearTimeout(timer);
  }, [searchQuery, enrolledActivities]);

  const resetForm = () => {
    setContent('');
    setCoverImageUrl('');
    setSelectedActivityId(null);
    setSearchQuery('');
    setShowActivitySearch(false);
    setSearchResults([]);
    setImagePreviewStatus('idle');
  };

  const loadEnrolledActivities = async () => {
    setIsLoadingEnrolled(true);
    try {
      const result = await activityAPI.getMyEnrolledActivities({
        page: 1,
        limit: 20,
      });
      setEnrolledActivities(result.items);
    } catch (error) {
      console.error('加载已参加活动失败:', error);
      setEnrolledActivities([]);
    } finally {
      setIsLoadingEnrolled(false);
    }
  };

  const handleSelectActivity = (activity: Activity) => {
    setSelectedActivityId(activity.id);
    setShowActivitySearch(false);
    // 不清空 searchQuery，这样 searchResults 不会被清空，selectedActivity 可以继续找到活动信息
  };

  const handleRemoveActivity = () => {
    setSelectedActivityId(null);
    setSearchQuery('');
    setShowActivitySearch(false);
    setSearchResults([]);
  };

  const handleCloseWithConfirm = () => {
    // 检查是否有未保存的内容
    // 对于编辑模式，比较当前内容是否与原始内容不同
    // 对于新建模式，检查是否有任何输入
    const isEditMode = !!editingPost;
    
    let hasChanges = false;
    
    if (isEditMode && editingPost) {
      // 编辑模式：检查是否有修改
      hasChanges = (
        content !== editingPost.content ||
        coverImageUrl !== (editingPost.cover_image_url || '') ||
        selectedActivityId !== (editingPost.activity_id || null)
      );
    } else {
      // 新建模式：检查是否有任何内容
      hasChanges = content.trim() !== '' || coverImageUrl.trim() !== '' || selectedActivityId !== null;
    }

    if (hasChanges) {
      setConfirmModal({
        isOpen: true,
        title: '确认关闭',
        message: editingPost 
          ? '取消后修改的内容将不被保存。确定要关闭吗？'
          : '取消后输入的内容将不被保存。确定要关闭吗？',
        confirmText: '确认关闭',
        cancelText: '继续编辑',
        type: 'warning',
        onConfirm: () => {
          resetForm();
          onClose();
          setConfirmModal(prev => ({ ...prev, isOpen: false }));
        },
        onCancel: () => setConfirmModal(prev => ({ ...prev, isOpen: false })),
      });
    } else {
      resetForm();
      onClose();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!content.trim()) {
      alert('请输入帖子内容');
      return;
    }

    if (imagePreviewStatus === 'error') {
      alert('配图加载失败，请检查图片URL');
      return;
    }

    // 显示确认对话框
    const message = editingPost
      ? '确定要保存对帖子的修改吗？'
      : '确定要发布这条新帖子吗？';

    setConfirmModal({
      isOpen: true,
      title: editingPost ? '确认保存' : '确认发布',
      message,
      confirmText: editingPost ? '确认保存' : '确认发布',
      cancelText: '取消',
      type: 'info',
      onConfirm: async () => {
        await executeSubmit();
        setConfirmModal(prev => ({ ...prev, isOpen: false }));
      },
      onCancel: () => setConfirmModal(prev => ({ ...prev, isOpen: false })),
    });
  };

  const executeSubmit = async () => {
    try {
      await onSubmit({
        content,
        cover_image_url: coverImageUrl || undefined,
        activity_id: selectedActivityId || undefined,
      });

      resetForm();
      onClose();
    } catch (error) {
      console.error('提交帖子失败:', error);
    }
  };

  if (!isOpen) return null;

  const selectedActivity =
    enrolledActivities.find((a) => a.id === selectedActivityId) ||
    searchResults.find((a) => a.id === selectedActivityId);

  return (
    <div className="modal modal-open pt-[5rem] z-50">
      <div className="modal-box modal-bounce w-full max-w-5xl max-h-[90vh] overflow-y-auto p-0">
        <ConfirmModal {...confirmModal} />
        
        {/* Header */}
        <div className="sticky top-0 bg-base-100 border-b border-base-200 p-6 flex justify-between items-center z-10">
          <div>
            <h3 className="font-bold text-2xl">
              {editingPost ? '编辑帖子' : '分享新的体验'}
            </h3>
            <p className="text-sm text-base-content/60 mt-1">
              {editingPost ? '修改你的帖子内容' : '分享你的运动体验、建议或故事'}
            </p>
          </div>
          <button
            className="btn btn-sm btn-circle btn-ghost"
            onClick={handleCloseWithConfirm}
            disabled={isLoading}
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6 p-6">
          {/* 内容输入 */}
          <div className="form-control w-full max-w-2xl mx-auto">
            <div className="flex justify-between items-center mb-2">
              <label className="label p-0">
                <span className="label-text font-semibold text-base-content text-lg">内容 *</span>
              </label>
              <span className="text-sm text-gray-400">{content.length} / 5000</span>
            </div>
            <textarea
              className="textarea textarea-bordered h-40 resize-none focus:textarea-primary w-full text-base"
              placeholder="分享你的运动体验、建议或故事..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              disabled={isLoading}
            />
          </div>

          {/* 配图上传 */}
          <div className="form-control max-w-2xl mx-auto w-full">
            <label className="label">
              <span className="label-text font-semibold text-base-content text-lg">配图（可选）</span>
            </label>
            <div className="relative">
              <input
                type="url"
                className={`input input-bordered w-full focus:input-primary ${
                  imagePreviewStatus === 'error' ? 'input-error' : ''
                } ${(imagePreviewStatus === 'loaded' || imagePreviewStatus === 'error') ? 'pr-10' : ''}`}
                placeholder="https://example.com/image.jpg"
                value={coverImageUrl}
                onChange={(e) => setCoverImageUrl(e.target.value)}
                disabled={isLoading}
              />
              {imagePreviewStatus === 'loaded' && (
                <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-success" aria-label="配图已加载">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.707a1 1 0 00-1.414-1.414L9 10.172 7.707 8.879A1 1 0 106.293 10.293l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                </span>
              )}
              {imagePreviewStatus === 'error' && (
                <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-error" aria-label="配图加载失败">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm2.28-10.28a.75.75 0 10-1.06-1.06L10 8.94 8.78 7.72a.75.75 0 10-1.06 1.06L8.94 10l-1.22 1.22a.75.75 0 101.06 1.06L10 11.06l1.22 1.22a.75.75 0 101.06-1.06L11.06 10l1.22-1.22z" clipRule="evenodd" />
                  </svg>
                </span>
              )}
            </div>
            
            {/* 配图预览 */}
            {coverImageUrl && imagePreviewStatus !== 'error' && (
              <div className="mt-4">
                <div className="relative bg-base-200 rounded-lg overflow-hidden aspect-video flex items-center justify-center w-full max-w-md">
                  {imagePreviewStatus === 'loading' && (
                    <div className="flex flex-col items-center gap-2">
                      <span className="loading loading-spinner"></span>
                      <p className="text-sm text-base-content/60">加载中...</p>
                    </div>
                  )}
                  {imagePreviewStatus === 'loaded' && (
                    <img
                      src={coverImageUrl}
                      alt="预览"
                      className="w-full h-full object-cover"
                    />
                  )}
                </div>
              </div>
            )}
            
            {imagePreviewStatus === 'error' && (
              <div className="text-error text-sm mt-2">图片预览加载失败，请检查图片 URL 是否正确</div>
            )}
          </div>

          {/* 相关活动选择 */}
          <div className="form-control max-w-2xl mx-auto w-full">
            <label className="label">
              <span className="label-text font-semibold text-base-content text-lg">添加相关活动（可选）</span>
            </label>

            {selectedActivityId && selectedActivity ? (
              <div className="card bg-base-200 border border-base-300">
                <div className="card-body p-4 flex-row items-center gap-4">
                  {selectedActivity.cover_image_url && (
                    <div className="w-20 h-20 flex-shrink-0 rounded-lg overflow-hidden bg-base-300">
                      <img
                        src={selectedActivity.cover_image_url}
                        alt={selectedActivity.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold truncate">
                      {selectedActivity.name}
                    </h4>
                    <p className="text-sm text-base-content/60 mt-1">
                      {selectedActivity.city} {selectedActivity.address}
                    </p>
                  </div>
                  <button
                    type="button"
                    className="btn btn-ghost btn-sm btn-circle"
                    onClick={handleRemoveActivity}
                    disabled={isLoading}
                  >
                    ✕
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {/* 搜索活动 */}
                <div className="space-y-2">
                  <p className="text-sm font-medium">
                    搜索活动...
                  </p>
                  <div className="relative">
                    <input
                      type="text"
                      className="input input-bordered w-full focus:input-primary"
                      placeholder="搜索活动名称..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      onFocus={() => setShowActivitySearch(true)}
                      disabled={isLoading}
                    />

                    {showActivitySearch && searchResults.length > 0 && (
                      <div className="absolute top-full left-0 right-0 mt-2 bg-base-100 border border-base-200 rounded-lg shadow-lg z-50 max-h-60 overflow-y-auto">
                        {searchResults.map((activity) => (
                          <button
                            key={activity.id}
                            type="button"
                            className="w-full text-left p-3 hover:bg-base-200 transition-colors border-b border-base-200 last:border-0"
                            onClick={() => handleSelectActivity(activity)}
                            disabled={isLoading}
                          >
                            <p className="font-semibold text-sm">{activity.name}</p>
                            <p className="text-xs text-base-content/60">
                              {activity.city} • {activity.address}
                            </p>
                          </button>
                        ))}
                      </div>
                    )}

                    {showActivitySearch && searchQuery.trim() && searchResults.length === 0 && !isSearching && (
                      <div className="absolute top-full left-0 right-0 mt-2 bg-base-100 border border-base-200 rounded-lg p-3 text-center text-sm text-base-content/60 z-50">
                        未找到相关活动
                      </div>
                    )}
                  </div>
                </div>

                {/* 已参加的活动 */}
                {isLoadingEnrolled ? (
                  <div className="text-center py-6">
                    <span className="loading loading-spinner"></span>
                  </div>
                ) : enrolledActivities.length > 0 ? (
                  <div>
                    <p className="text-sm text-base-content/50 mb-3 font-medium">
                      或选择您已参加的活动：
                    </p>
                    <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                      {enrolledActivities.map((activity) => (
                        <button
                          key={activity.id}
                          type="button"
                          onClick={() => handleSelectActivity(activity)}
                          className="card bg-base-100 border border-base-300 hover:border-primary hover:shadow-md transition-all overflow-hidden"
                          disabled={isLoading}
                        >
                          <figure className="relative w-full aspect-video bg-base-200">
                            {activity.cover_image_url ? (
                              <img
                                src={activity.cover_image_url}
                                alt={activity.name}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="flex items-center justify-center w-full h-full">
                                <svg className="w-8 h-8 text-base-300" fill="currentColor" viewBox="0 0 20 20">
                                  <path d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4.5-4.5 3 3 5-5 3.5 3.5z" />
                                </svg>
                              </div>
                            )}
                          </figure>
                          <div className="card-body p-2">
                            <h3 className="text-xs font-semibold line-clamp-2">
                              {activity.name}
                            </h3>
                            <p className="text-xs text-base-content/60">
                              {activity.city}
                            </p>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                ) : null}
              </div>
            )}
          </div>

          {/* 提交按钮 */}
          <div className="max-w-2xl mx-auto w-full flex justify-end gap-3 pt-4">
            <button
              type="button"
              className="btn btn-ghost"
              onClick={handleCloseWithConfirm}
              disabled={isLoading}
            >
              取消
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={isLoading || !content.trim()}
            >
              {isLoading ? (
                <>
                  <span className="loading loading-spinner loading-sm"></span>
                  提交中...
                </>
              ) : editingPost ? (
                '更新帖子'
              ) : (
                '发布帖子'
              )}
            </button>
          </div>
        </form>
      </div>

      <div className="modal-backdrop" onClick={handleCloseWithConfirm}></div>
    </div>
  );
};

export default PostFormModal;
