import React, { useState, useEffect } from 'react';
import { Activity, Comment, Enrollment, ActivityStatus, FeeType } from '../../api/activity';
import activityAPI from '../../api/activity';
import userAPI from '../../api/user';
import { formatDate, getFriendlyDate, getTimeLeft, isExpired } from '../../utils/date';
import { enrichActivityWithEnrollmentStatus, isRegistrationExpired } from '../../utils/activity';
import Avatar from '../Avatar';

interface ActivityDetailModalProps {
  isOpen: boolean;
  activity: Activity | null;
  onClose: () => void;
  onEnroll?: (activityId: number) => void;
  onCancelEnrollment?: (activityId: number) => void;
  onEdit?: (activity: Activity) => void;
}

const ActivityDetailModal: React.FC<ActivityDetailModalProps> = ({
  isOpen,
  activity,
  onClose,
  onEnroll,
  onCancelEnrollment,
  onEdit
}) => {
  const [comments, setComments] = useState<Comment[]>([]);
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [loading, setLoading] = useState(false);
  const [commentLoading, setCommentLoading] = useState(false);
  const [newComment, setNewComment] = useState({ rating: 5, content: '' });
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [currentUser] = useState(userAPI.getCurrentUserFromStorage());

  useEffect(() => {
    if (isOpen && activity) {
      loadActivityDetails();
    }
  }, [isOpen, activity]);

  const loadActivityDetails = async () => {
    if (!activity) return;
    
    setLoading(true);
    try {
      const [commentsData, enrollmentsData] = await Promise.all([
        activityAPI.getActivityComments(activity.id),
        activityAPI.getActivityEnrollments(activity.id)
      ]);
      setComments(commentsData);
      setEnrollments(enrollmentsData);
    } catch (error) {
      console.error('加载活动详情失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitComment = async () => {
    if (!activity || !newComment.content.trim()) return;

    setCommentLoading(true);
    try {
      const comment = await activityAPI.createComment(activity.id, newComment);
      setComments([comment, ...comments]);
      setNewComment({ rating: 5, content: '' });
    } catch (error) {
      console.error('发表评论失败:', error);
    } finally {
      setCommentLoading(false);
    }
  };

  if (!isOpen || !activity) return null;

  // 确保活动有正确的报名状态信息
  const enrichedActivity = enrichActivityWithEnrollmentStatus(activity);

  const isOwner = currentUser?.id === enrichedActivity.organizer_id;
  const canEnroll = enrichedActivity.status === ActivityStatus.RECRUITING && 
                   !isExpired(enrichedActivity.registration_deadline) && 
                   (enrichedActivity.enrollment_count || 0) < enrichedActivity.max_participants &&
                   !(enrichedActivity.is_enrolled || false);
  const canCancelEnrollment = (enrichedActivity.is_enrolled || false) && 
                             enrichedActivity.status === ActivityStatus.RECRUITING && 
                             !isExpired(enrichedActivity.registration_deadline);

  const getStatusText = (activity: Activity) => {
    const status = activity.status;
    
    // 如果状态是报名中，但报名已过期，显示已过期
    if (status === ActivityStatus.RECRUITING && isRegistrationExpired(activity.registration_deadline)) {
      return '已过期';
    }
    
    switch (status) {
      case ActivityStatus.PREPARING: return '筹备中';
      case ActivityStatus.RECRUITING: return '报名中';
      case ActivityStatus.FINISHED: return '已结束';
      case ActivityStatus.CANCELLED: return '已取消';
      default: return '未知状态';
    }
  };

  const getFeeText = (feeType: FeeType, feeAmount: number) => {
    switch (feeType) {
      case FeeType.FREE: return '免费';
      case FeeType.AA: return 'AA制';
      case FeeType.PREPAID_ALL: return `预付 ￥${feeAmount}`;
      case FeeType.PREPAID_REFUNDABLE: return `预付 ￥${feeAmount} (多退少补)`;
      default: return '费用待定';
    }
  };

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, index) => (
      <span 
        key={index} 
        className={`text-lg ${index < rating ? 'text-yellow-400' : 'text-gray-300'}`}
      >
        ★
      </span>
    ));
  };

  return (
    <>
    <div className="modal modal-open">
      <div className="modal-box w-11/12 max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-bold text-lg">{enrichedActivity.name}</h3>
          <button 
            className="btn btn-sm btn-circle btn-ghost"
            onClick={onClose}
          >
            ✕
          </button>
        </div>

        {/* 活动封面图片 */}
        <div className="mb-6">
          <img 
            src={enrichedActivity.cover_image_url || 'https://via.placeholder.com/800x300?text=活动图片'} 
            alt={enrichedActivity.name}
            className="w-full h-64 object-cover rounded-lg"
          />
        </div>

        {/* 活动基本信息 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <div className="space-y-4">
            <div>
              <h4 className="font-semibold text-lg mb-2">活动详情</h4>
              <p className="text-base-content/80">{enrichedActivity.description}</p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="font-medium">状态:</span>
                <span className={`badge ${
                  enrichedActivity.status === ActivityStatus.RECRUITING && isRegistrationExpired(enrichedActivity.registration_deadline) ? 'badge-warning' :
                  enrichedActivity.status === ActivityStatus.RECRUITING ? 'badge-success' :
                  enrichedActivity.status === ActivityStatus.PREPARING ? 'badge-info' :
                  enrichedActivity.status === ActivityStatus.FINISHED ? 'badge-neutral' :
                  'badge-error'
                }`}>
                  {getStatusText(enrichedActivity)}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <span className="font-medium">类别:</span>
                <span className="badge badge-primary">{enrichedActivity.category?.name}</span>
              </div>

              <div className="flex items-center gap-2">
                <span className="font-medium">地点:</span>
                <span>{enrichedActivity.location}</span>
              </div>

              <div className="flex items-center gap-2">
                <span className="font-medium">开始时间:</span>
                <span>{getFriendlyDate(enrichedActivity.start_time)}</span>
              </div>

              <div className="flex items-center gap-2">
                <span className="font-medium">结束时间:</span>
                <span>{getFriendlyDate(enrichedActivity.end_time)}</span>
              </div>

              <div className="flex items-center gap-2">
                <span className="font-medium">报名截止:</span>
                <span>{getFriendlyDate(enrichedActivity.registration_deadline)}</span>
                {!isExpired(enrichedActivity.registration_deadline) && (
                  <span className="text-sm text-warning">
                    ({getTimeLeft(enrichedActivity.registration_deadline)})
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2">
                <span className="font-medium">费用:</span>
                <span>{getFeeText(enrichedActivity.fee_type, enrichedActivity.fee_amount)}</span>
              </div>

              <div className="flex items-center gap-2">
                <span className="font-medium">参与人数:</span>
                <span>{enrollments.length}/{enrichedActivity.max_participants}人</span>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            {/* 发起人信息 */}
            {enrichedActivity.organizer && (
              <div>
                <h4 className="font-semibold text-lg mb-2">发起人</h4>
                <div className="flex items-center gap-3 p-3 bg-base-200 rounded-lg">
                  <Avatar 
                    username={enrichedActivity.organizer.username}
                    avatarUrl={enrichedActivity.organizer.avatar_url}
                    size="small"
                  />
                  <div>
                    <div className="font-medium">{enrichedActivity.organizer.username}</div>
                  </div>
                </div>
              </div>
            )}

            {/* 操作按钮 */}
            <div className="space-y-2">
              {isOwner ? (
                <>
                  {enrichedActivity.status === ActivityStatus.RECRUITING && (
                    <button 
                      className="btn btn-primary w-full"
                      onClick={() => onEdit && onEdit(enrichedActivity)}
                    >
                      编辑活动
                    </button>
                  )}
                </>
              ) : (
                <>
                  {canEnroll && onEnroll && (
                    <button 
                      className="btn btn-primary w-full"
                      onClick={() => onEnroll(enrichedActivity.id)}
                    >
                      立即报名
                    </button>
                  )}
                  
                  {canCancelEnrollment && onCancelEnrollment && (
                    <button 
                      className="btn btn-error w-full"
                      onClick={() => onCancelEnrollment(enrichedActivity.id)}
                    >
                      取消报名
                    </button>
                  )}
                </>
              )}
            </div>
          </div>
        </div>

        {/* 活动照片 */}
        {(enrichedActivity.cover_image_url || (enrichedActivity.images && enrichedActivity.images.length > 0)) && (
          <div className="mb-6">
            <h4 className="font-semibold text-lg mb-3">活动照片</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {/* 封面图片 */}
              {enrichedActivity.cover_image_url && (
                <div className="relative cursor-pointer overflow-hidden rounded-lg">
                  <img 
                    src={enrichedActivity.cover_image_url} 
                    alt="活动封面"
                    className="w-full h-48 object-cover shadow-md hover:shadow-lg hover:scale-105 transition-all duration-300"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.style.display = 'none';
                    }}
                    onClick={() => setPreviewImage(enrichedActivity.cover_image_url || '')}
                  />
                  <div className="absolute top-2 left-2 bg-primary text-primary-content text-xs px-2 py-1 rounded">
                    封面
                  </div>
                </div>
              )}
              
              {/* 其他活动图片 */}
              {enrichedActivity.images?.map((image, index) => (
                <div key={image.id} className="relative cursor-pointer overflow-hidden rounded-lg">
                  <img 
                    src={image.image_url} 
                    alt={`活动照片 ${index + 1}`}
                    className="w-full h-48 object-cover shadow-md hover:shadow-lg hover:scale-105 transition-all duration-300"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.style.display = 'none';
                    }}
                    onClick={() => setPreviewImage(image.image_url)}
                  />
                </div>
              ))}
            </div>
            
            {/* 没有照片时的提示 */}
            {!enrichedActivity.cover_image_url && (!enrichedActivity.images || enrichedActivity.images.length === 0) && (
              <div className="text-center py-8 text-base-content/60">
                <svg className="w-16 h-16 mx-auto mb-2 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <p>暂无活动照片</p>
              </div>
            )}
          </div>
        )}

        {/* 参与者列表 */}
        <div className="mb-6">
          <h4 className="font-semibold text-lg mb-3">参与者 ({enrollments.length}人)</h4>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
            {enrollments.map((enrollment) => (
              <div key={enrollment.id} className="flex flex-col items-center gap-2 p-2 bg-base-200 rounded-lg">
                <Avatar 
                  username={enrollment.user?.username || '?'}
                  avatarUrl={enrollment.user?.avatar_url}
                  size="tiny"
                />
                <span className="text-sm truncate">{enrollment.user?.username}</span>
              </div>
            ))}
          </div>
        </div>

        {/* 评论区 */}
        <div>
          <h4 className="font-semibold text-lg mb-3">评论 ({comments.length}条)</h4>
          
          {/* 发表评论 */}
          {currentUser && enrichedActivity.status === ActivityStatus.FINISHED && (enrichedActivity.is_enrolled || false) && (
            <div className="mb-4 p-4 bg-base-200 rounded-lg">
              <h5 className="font-medium mb-2">发表评论</h5>
              <div className="flex items-center gap-2 mb-2">
                <span>评分:</span>
                <div className="rating rating-sm">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <input
                      key={star}
                      type="radio"
                      name="rating"
                      className="mask mask-star-2 bg-orange-400"
                      checked={newComment.rating === star}
                      onChange={() => setNewComment({ ...newComment, rating: star })}
                    />
                  ))}
                </div>
              </div>
              <textarea
                className="textarea textarea-bordered w-full mb-2"
                placeholder="分享您的活动体验..."
                value={newComment.content}
                onChange={(e) => setNewComment({ ...newComment, content: e.target.value })}
                rows={3}
              />
              <button
                className="btn btn-primary btn-sm"
                onClick={handleSubmitComment}
                disabled={commentLoading || !newComment.content.trim()}
              >
                {commentLoading ? '发布中...' : '发布评论'}
              </button>
            </div>
          )}

          {/* 评论列表 */}
          <div className="space-y-3">
            {comments.map((comment) => (
              <div key={comment.id} className="p-3 bg-base-100 border rounded-lg">
                <div className="flex items-start gap-3">
                  <Avatar 
                    username={comment.user?.username || '?'}
                    avatarUrl={comment.user?.avatar_url}
                    size="tiny"
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium">{comment.user?.username}</span>
                      <div className="flex">{renderStars(comment.rating)}</div>
                      <span className="text-sm text-base-content/60">
                        {formatDate(comment.create_time)}
                      </span>
                    </div>
                    <p className="text-base-content/80">{comment.content}</p>
                  </div>
                </div>
              </div>
            ))}
            
            {comments.length === 0 && (
              <div className="text-center py-8 text-base-content/60">
                暂无评论
              </div>
            )}
          </div>
        </div>

        {loading && (
          <div className="flex justify-center py-8">
            <span className="loading loading-spinner loading-lg"></span>
          </div>
        )}
      </div>
      <div className="modal-backdrop" onClick={onClose}></div>
    </div>

    {/* 图片预览模态框 */}
    {previewImage && (
      <div className="modal modal-open">
        <div className="modal-box max-w-4xl p-0 bg-transparent shadow-none">
          <div className="relative">
            <img 
              src={previewImage} 
              alt="活动照片预览"
              className="w-full max-h-[80vh] object-contain rounded-lg"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.style.display = 'none';
              }}
            />
            <button 
              className="btn btn-circle btn-sm absolute top-2 right-2 bg-black/50 border-none text-white hover:bg-black/70"
              onClick={() => setPreviewImage(null)}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
        <div className="modal-backdrop bg-black/80" onClick={() => setPreviewImage(null)}></div>
      </div>
    )}
    </>
  );
};

export default ActivityDetailModal;
