import React, { useState, useEffect } from 'react';
import { Activity, Comment, Enrollment, ActivityStatus, FeeType } from '../../api/activity';
import activityAPI from '../../api/activity';
import userAPI from '../../api/user';
import { formatDate, getFriendlyDate, getTimeLeft, isExpired } from '../../utils/date';

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

  const isOwner = currentUser?.id === activity.organizer_id;
  const canEnroll = activity.status === ActivityStatus.RECRUITING && 
                   !isExpired(activity.registration_deadline) && 
                   enrollments.length < activity.max_participants &&
                   !activity.is_enrolled;
  const canCancelEnrollment = activity.is_enrolled && 
                             activity.status === ActivityStatus.RECRUITING && 
                             !isExpired(activity.registration_deadline);

  const getStatusText = (status: ActivityStatus) => {
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
    <div className="modal modal-open">
      <div className="modal-box w-11/12 max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-bold text-lg">{activity.name}</h3>
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
            src={activity.cover_image_url || 'https://via.placeholder.com/800x300?text=活动图片'} 
            alt={activity.name}
            className="w-full h-64 object-cover rounded-lg"
          />
        </div>

        {/* 活动基本信息 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <div className="space-y-4">
            <div>
              <h4 className="font-semibold text-lg mb-2">活动详情</h4>
              <p className="text-base-content/80">{activity.description}</p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="font-medium">状态:</span>
                <span className={`badge ${
                  activity.status === ActivityStatus.RECRUITING ? 'badge-success' :
                  activity.status === ActivityStatus.PREPARING ? 'badge-info' :
                  activity.status === ActivityStatus.FINISHED ? 'badge-neutral' :
                  'badge-error'
                }`}>
                  {getStatusText(activity.status)}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <span className="font-medium">类别:</span>
                <span className="badge badge-primary">{activity.category?.name}</span>
              </div>

              <div className="flex items-center gap-2">
                <span className="font-medium">地点:</span>
                <span>{activity.location}</span>
              </div>

              <div className="flex items-center gap-2">
                <span className="font-medium">开始时间:</span>
                <span>{getFriendlyDate(activity.start_time)}</span>
              </div>

              <div className="flex items-center gap-2">
                <span className="font-medium">结束时间:</span>
                <span>{getFriendlyDate(activity.end_time)}</span>
              </div>

              <div className="flex items-center gap-2">
                <span className="font-medium">报名截止:</span>
                <span>{getFriendlyDate(activity.registration_deadline)}</span>
                {!isExpired(activity.registration_deadline) && (
                  <span className="text-sm text-warning">
                    ({getTimeLeft(activity.registration_deadline)})
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2">
                <span className="font-medium">费用:</span>
                <span>{getFeeText(activity.fee_type, activity.fee_amount)}</span>
              </div>

              <div className="flex items-center gap-2">
                <span className="font-medium">参与人数:</span>
                <span>{enrollments.length}/{activity.max_participants}人</span>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            {/* 发起人信息 */}
            {activity.organizer && (
              <div>
                <h4 className="font-semibold text-lg mb-2">发起人</h4>
                <div className="flex items-center gap-3 p-3 bg-base-200 rounded-lg">
                  <div className="avatar">
                    <div className="w-12 h-12 rounded-full">
                      <img 
                        src={activity.organizer.avatar_url || 'https://via.placeholder.com/48?text=头像'} 
                        alt={activity.organizer.username}
                      />
                    </div>
                  </div>
                  <div>
                    <div className="font-medium">{activity.organizer.username}</div>
                  </div>
                </div>
              </div>
            )}

            {/* 操作按钮 */}
            <div className="space-y-2">
              {isOwner ? (
                <>
                  {activity.status === ActivityStatus.RECRUITING && (
                    <button 
                      className="btn btn-primary w-full"
                      onClick={() => onEdit && onEdit(activity)}
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
                      onClick={() => onEnroll(activity.id)}
                    >
                      立即报名
                    </button>
                  )}
                  
                  {canCancelEnrollment && onCancelEnrollment && (
                    <button 
                      className="btn btn-error w-full"
                      onClick={() => onCancelEnrollment(activity.id)}
                    >
                      取消报名
                    </button>
                  )}
                </>
              )}
            </div>
          </div>
        </div>

        {/* 参与者列表 */}
        <div className="mb-6">
          <h4 className="font-semibold text-lg mb-3">参与者 ({enrollments.length}人)</h4>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {enrollments.map((enrollment) => (
              <div key={enrollment.id} className="flex items-center gap-2 p-2 bg-base-200 rounded-lg">
                <div className="avatar">
                  <div className="w-8 h-8 rounded-full">
                    <img 
                      src={enrollment.user?.avatar_url || 'https://via.placeholder.com/32?text=头像'} 
                      alt={enrollment.user?.username}
                    />
                  </div>
                </div>
                <span className="text-sm truncate">{enrollment.user?.username}</span>
              </div>
            ))}
          </div>
        </div>

        {/* 评论区 */}
        <div>
          <h4 className="font-semibold text-lg mb-3">评论 ({comments.length}条)</h4>
          
          {/* 发表评论 */}
          {currentUser && activity.status === ActivityStatus.FINISHED && activity.is_enrolled && (
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
                  <div className="avatar">
                    <div className="w-10 h-10 rounded-full">
                      <img 
                        src={comment.user?.avatar_url || 'https://via.placeholder.com/40?text=头像'} 
                        alt={comment.user?.username}
                      />
                    </div>
                  </div>
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
  );
};

export default ActivityDetailModal;
