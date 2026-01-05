import Avatar from '../Avatar';
import { Activity, ActivityStatus, FeeType } from '../../api/activity';
import { canUserCancelEnrollment, canUserEnroll, enrichActivityWithEnrollmentStatus, formatActivityLocation } from '../../utils/activity';
import { formatDate, formatTime } from '../../utils/date';
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import ConfirmModal, { ConfirmModalConfig } from '../ConfirmModal';

interface ActivityCardProps {
  activity: Activity;
  onViewDetail: (activity: Activity) => void;
  onEnroll?: (activityId: number) => void;
  onCancelEnrollment?: (activityId: number) => void;
  onEdit?: (activity: Activity) => void;
  onCancelActivity?: (activity: Activity) => void;
  showActions?: boolean;
  isOwner?: boolean;
  canEditActivity?: (activity: Activity) => boolean;
  canCancelActivity?: (activity: Activity) => boolean;
  renderActions?: (activity: Activity) => React.ReactNode;
  _showActivityFinishedButton?: boolean;
}

const ActivityCard: React.FC<ActivityCardProps> = ({
  activity,
  onViewDetail,
  onEnroll,
  onCancelEnrollment,
  onEdit,
  onCancelActivity,
  showActions = true,
  isOwner = false,
  canEditActivity,
  canCancelActivity,
  renderActions,
  _showActivityFinishedButton = false
}) => {
  // 确保活动有正确的报名状态信息
  const enrichedActivity = enrichActivityWithEnrollmentStatus(activity);
  const navigate = useNavigate();

  // Local state for optimistic updates
  const [isEnrolled, setIsEnrolled] = useState(enrichedActivity.is_enrolled || false);
  const [enrollmentCount, setEnrollmentCount] = useState(enrichedActivity.enrollment_count || 0);
  const [isEnrolling, setIsEnrolling] = useState(false);

  const [confirmModal, setConfirmModal] = useState<ConfirmModalConfig>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
    onCancel: () => setConfirmModal(prev => ({ ...prev, isOpen: false })),
  });

  // Update local state when props change
  useEffect(() => {
    setIsEnrolled(enrichedActivity.is_enrolled || false);
    setEnrollmentCount(enrichedActivity.enrollment_count || 0);
  }, [enrichedActivity.is_enrolled, enrichedActivity.enrollment_count]);

  // 获取状态显示文本和样式
  const getStatusBadge = (activity: Activity) => {
    const now = new Date();
    const registrationDeadline = new Date(activity.registration_deadline);
    const startTime = new Date(activity.start_time);
    const endTime = new Date(activity.end_time);
    
    // 优先根据活动的 status 字段判断
    switch (activity.status) {
      case ActivityStatus.CANCELLED:
        return <div className="badge badge-error">已取消</div>;
      case ActivityStatus.FINISHED:
        return <div className="badge badge-neutral">已结束</div>;
      case ActivityStatus.ONGOING:
        return <div className="badge badge-warning">进行中</div>;
      case ActivityStatus.REGISTRATION_CLOSED:
        return <div className="badge badge-secondary">报名已截止</div>;
      case ActivityStatus.RECRUITING:
        return <div className="badge badge-success">报名中</div>;
      default:
        // 如果 status 未定义或不匹配，回退到时间基础判断
        if (now > endTime) {
          return <div className="badge badge-neutral">已结束</div>;
        }
        if (now >= startTime && now <= endTime) {
          return <div className="badge badge-warning">进行中</div>;
        }
        if (now > registrationDeadline && now < startTime) {
          return <div className="badge badge-secondary">报名已截止</div>;
        }
        if (now <= registrationDeadline) {
          return <div className="badge badge-success">报名中</div>;
        }
        // 默认为报名中
        return <div className="badge badge-success">报名中</div>;
    }
  };

  // 获取费用显示文本
  const getFeeText = (feeType: FeeType, feeAmount: number) => {
    switch (feeType) {
      case FeeType.FREE:
        return '免费';
      case FeeType.AA:
        return 'AA制';
      case FeeType.PREPAID_ALL:
        return `￥${feeAmount}`;
      case FeeType.PREPAID_REFUNDABLE:
        return `￥${feeAmount}(多退少补)`;
      default:
        return '费用待定';
    }
  };

  // 检查是否可以报名
  const canEnroll = () => {
    return canUserEnroll(enrichedActivity);
  };

  // 检查是否可以取消报名
  const canCancelEnrollment = () => {
    return canUserCancelEnrollment(enrichedActivity);
  };

  const handleCardClick = () => {
    onViewDetail(enrichedActivity);
  };

  const handleCardKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onViewDetail(enrichedActivity);
    }
  };

  const showEnrollConfirm = (e: React.MouseEvent) => {
    e.stopPropagation();
    setConfirmModal({
      isOpen: true,
      title: '确认报名',
      message: `确定要报名参加「${enrichedActivity.name}」吗？`,
      confirmText: '确认报名',
      cancelText: '取消',
      type: 'info',
      onConfirm: async () => {
        if (isEnrolling) return;

        setIsEnrolling(true);
        const previousIsEnrolled = isEnrolled;
        const previousEnrollmentCount = enrollmentCount;

        // Optimistic update
        setIsEnrolled(true);
        setEnrollmentCount(enrollmentCount + 1);
        setConfirmModal(prev => ({ ...prev, isOpen: false }));

        try {
          if (onEnroll) {
            await onEnroll(enrichedActivity.id);
          }
        } catch (error) {
          // Rollback on error
          setIsEnrolled(previousIsEnrolled);
          setEnrollmentCount(previousEnrollmentCount);
        } finally {
          setIsEnrolling(false);
        }
      },
      onCancel: () => setConfirmModal(prev => ({ ...prev, isOpen: false })),
    });
  };

  const showCancelEnrollmentConfirm = (e: React.MouseEvent) => {
    e.stopPropagation();
    setConfirmModal({
      isOpen: true,
      title: '确认取消报名',
      message: `确定要取消报名「${enrichedActivity.name}」吗？`,
      confirmText: '确认取消',
      cancelText: '保留报名',
      type: 'warning',
      onConfirm: async () => {
        if (isEnrolling) return;

        setIsEnrolling(true);
        const previousIsEnrolled = isEnrolled;
        const previousEnrollmentCount = enrollmentCount;

        // Optimistic update
        setIsEnrolled(false);
        setEnrollmentCount(Math.max(0, enrollmentCount - 1));
        setConfirmModal(prev => ({ ...prev, isOpen: false }));

        try {
          if (onCancelEnrollment) {
            await onCancelEnrollment(enrichedActivity.id);
          }
        } catch (error) {
          // Rollback on error
          setIsEnrolled(previousIsEnrolled);
          setEnrollmentCount(previousEnrollmentCount);
        } finally {
          setIsEnrolling(false);
        }
      },
      onCancel: () => setConfirmModal(prev => ({ ...prev, isOpen: false })),
    });
  };

  const showEditConfirm = () => {
    onEdit?.(enrichedActivity);
  };

  const showCancelActivityConfirm = () => {
    setConfirmModal({
      isOpen: true,
      title: '确认取消活动',
      message: `确定要取消「${enrichedActivity.name}」吗？此操作不可撤销。`,
      confirmText: '确认取消',
      cancelText: '保留活动',
      type: 'danger',
      onConfirm: () => {
        onCancelActivity?.(enrichedActivity);
        setConfirmModal(prev => ({ ...prev, isOpen: false }));
      },
      onCancel: () => setConfirmModal(prev => ({ ...prev, isOpen: false })),
    });
  };

  return (
    <>
      <ConfirmModal {...confirmModal} />
      <div
        className="card bg-base-100 rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 h-full flex flex-col cursor-pointer"
        onClick={handleCardClick}
        onKeyDown={handleCardKeyDown}
        role="button"
        tabIndex={0}
      >
        <figure className="relative flex-shrink-0">
        <img 
          src={enrichedActivity.cover_image_url || 'https://via.placeholder.com/400x200?text=活动图片'} 
          alt={enrichedActivity.name}
          className="h-48 w-full object-cover rounded-t-2xl"
        />
        <div className="absolute top-2 right-2">
          {getStatusBadge(enrichedActivity)}
        </div>
        <div className="absolute top-2 left-2">
          <div className="badge badge-primary">{enrichedActivity.category?.name}</div>
        </div>
      </figure>
      
      <div className="card-body flex-1 flex flex-col">
        <h2 className="card-title">
          {enrichedActivity.name}
          {isEnrolled && (
            <div className="badge badge-secondary">已报名</div>
          )}
        </h2>
        
        <p className="text-sm text-base-content/70 mb-4 overflow-hidden" style={{
          display: '-webkit-box',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical',
          lineHeight: '1.25rem',
          maxHeight: '2.5rem'
        }}>
          {enrichedActivity.description}
        </p>
        
        <div className="space-y-2 text-sm flex-1">
          <div className="flex items-center gap-2">
            <svg className="w-4 h-4 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <span className="text-base-content/80">{formatActivityLocation(enrichedActivity)}</span>
          </div>
          
          <div className="flex items-center gap-2">
            <svg className="w-4 h-4 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <span className="text-base-content/80">
              {formatDate(enrichedActivity.start_time)} {formatTime(enrichedActivity.start_time)}
            </span>
          </div>
          
          <div className="flex items-center gap-2">
            <svg className="w-4 h-4 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.856-1.487M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 0a3 3 0 11-6 0 3 3 0 016 0zM7 20H2v-2a3 3 0 015.856-1.487M15 21H3v-1a6 6 0 0112 0v1z" />
            </svg>
            <span className="text-base-content/80">
              {enrollmentCount}/{enrichedActivity.max_participants}人
            </span>
          </div>
          
          <div className="flex items-center gap-2">
            <svg className="w-4 h-4 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
            </svg>
            <span className="text-base-content/80">
              {getFeeText(enrichedActivity.fee_type, enrichedActivity.fee_amount)}
            </span>
          </div>
          
          {enrichedActivity.organizer && (
            <div className="flex items-center gap-2 pt-2">
              <Avatar
                username={enrichedActivity.organizer.username}
                avatarUrl={enrichedActivity.organizer.avatar_url}
                size="tiny"
                userId={enrichedActivity.organizer.id}
              />
              <span
                className="text-base-content/80 cursor-pointer hover:text-primary"
                onClick={(e) => {
                  e.stopPropagation();
                  if (enrichedActivity.organizer) {
                    navigate(`/profile/${enrichedActivity.organizer.id}`);
                  }
                }}
              >
                {enrichedActivity.organizer?.username}
              </span>
            </div>
          )}
        </div>
        
        {showActions && (
          <div
            className="card-actions justify-end mt-auto pt-4 gap-2 flex-wrap"
            onClick={(e) => e.stopPropagation()}
          >
            {renderActions ? (
              renderActions(enrichedActivity)
            ) : isOwner && (onEdit || onCancelActivity) ? (
              <>
                {/* 编辑活动按钮 */}
                {onEdit && (
                  <button
                    onClick={() => showEditConfirm()}
                    disabled={!canEditActivity || !canEditActivity(enrichedActivity)}
                    className={`btn btn-sm ${!canEditActivity || !canEditActivity(enrichedActivity) ? 'btn-disabled' : 'btn-outline'}`}
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                    编辑
                  </button>
                )}
                
                {/* 取消活动按钮 */}
                {onCancelActivity && (
                  <button
                    onClick={() => showCancelActivityConfirm()}
                    disabled={!canCancelActivity || !canCancelActivity(enrichedActivity)}
                    className={`btn btn-sm ${!canCancelActivity || !canCancelActivity(enrichedActivity) ? 'btn-disabled' : 'btn-error'}`}
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                    取消活动
                  </button>
                )}
              </>
            ) : (
              <>
                {/* 报名已截止按钮 */}
                {enrichedActivity.status === ActivityStatus.REGISTRATION_CLOSED ? (
                  <button 
                    className="btn btn-sm btn-disabled w-full sm:w-auto"
                    disabled
                  >
                    报名已截止
                  </button>
                ) : enrichedActivity.status === ActivityStatus.FINISHED ? (
                  /* 活动已结束按钮 */
                  <button 
                    className="btn btn-sm btn-disabled w-full sm:w-auto"
                    disabled
                  >
                    已结束
                  </button>
                ) : (
                  <>
                    {canEnroll() && onEnroll && (
                      <button 
                        className="btn btn-primary btn-sm flex-1 sm:flex-none"
                        onClick={showEnrollConfirm}
                      >
                        立即报名
                      </button>
                    )}
                    
                    {canCancelEnrollment() && onCancelEnrollment && (
                      <button 
                        className="btn btn-error btn-sm flex-1 sm:flex-none"
                        onClick={showCancelEnrollmentConfirm}
                      >
                        取消报名
                      </button>
                    )}
                  </>
                )}
              </>
            )}
          </div>
        )}
      </div>
      </div>
    </>
  );
};

export default ActivityCard;
