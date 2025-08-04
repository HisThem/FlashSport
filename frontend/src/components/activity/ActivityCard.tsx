import Avatar from '../Avatar';
import { Activity, ActivityStatus, FeeType } from '../../api/activity';
import { canUserCancelEnrollment, canUserEnroll, enrichActivityWithEnrollmentStatus, isRegistrationExpired } from '../../utils/activity';
import { formatDate, formatTime } from '../../utils/date';
import React from 'react';

interface ActivityCardProps {
  activity: Activity;
  onViewDetail: (activity: Activity) => void;
  onEnroll?: (activityId: number) => void;
  onCancelEnrollment?: (activityId: number) => void;
  onEdit?: (activity: Activity) => void;
  showActions?: boolean;
  isOwner?: boolean;
}

const ActivityCard: React.FC<ActivityCardProps> = ({
  activity,
  onViewDetail,
  onEnroll,
  onCancelEnrollment,
  onEdit,
  showActions = true,
  isOwner = false
}) => {
  // 确保活动有正确的报名状态信息
  const enrichedActivity = enrichActivityWithEnrollmentStatus(activity);

  // 获取状态显示文本和样式
  const getStatusBadge = (activity: Activity) => {
    const status = activity.status;
    
    // 如果状态是报名中，但报名已过期，显示已过期
    if (status === ActivityStatus.RECRUITING && isRegistrationExpired(activity.registration_deadline)) {
      return <div className="badge badge-warning">已过期</div>;
    }
    
    switch (status) {
      case ActivityStatus.PREPARING:
        return <div className="badge badge-info">筹备中</div>;
      case ActivityStatus.RECRUITING:
        return <div className="badge badge-success">报名中</div>;
      case ActivityStatus.FINISHED:
        return <div className="badge badge-neutral">已结束</div>;
      case ActivityStatus.CANCELLED:
        return <div className="badge badge-error">已取消</div>;
      default:
        return <div className="badge badge-ghost">未知</div>;
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

  return (
    <div className="card bg-base-100 shadow-xl hover:shadow-2xl transition-all duration-300">
      <figure className="relative">
        <img 
          src={enrichedActivity.cover_image_url || 'https://via.placeholder.com/400x200?text=活动图片'} 
          alt={enrichedActivity.name}
          className="h-48 w-full object-cover"
        />
        <div className="absolute top-2 right-2">
          {getStatusBadge(enrichedActivity)}
        </div>
        <div className="absolute top-2 left-2">
          <div className="badge badge-primary">{enrichedActivity.category?.name}</div>
        </div>
      </figure>
      
      <div className="card-body">
        <h2 className="card-title">
          {enrichedActivity.name}
          {(enrichedActivity.is_enrolled || false) && (
            <div className="badge badge-secondary">已报名</div>
          )}
        </h2>
        
        <p className="text-sm text-base-content/70 line-clamp-2">
          {enrichedActivity.description}
        </p>
        
        <div className="space-y-2 text-sm">
          <div className="flex items-center gap-2">
            <svg className="w-4 h-4 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <span className="text-base-content/80">{enrichedActivity.location}</span>
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
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
            </svg>
            <span className="text-base-content/80">
              {enrichedActivity.enrollment_count || 0}/{enrichedActivity.max_participants}人
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
              />
              <span className="text-base-content/80">{enrichedActivity.organizer.username}</span>
            </div>
          )}
        </div>
        
        {showActions && (
          <div className="card-actions justify-end mt-4">
            <button 
              className="btn btn-outline btn-sm"
              onClick={() => onViewDetail(enrichedActivity)}
            >
              查看详情
            </button>
            
            {isOwner ? (
              <>
                {enrichedActivity.status === ActivityStatus.RECRUITING && (
                  <button 
                    className="btn btn-primary btn-sm"
                    onClick={() => onEdit && onEdit(enrichedActivity)}
                  >
                    编辑活动
                  </button>
                )}
              </>
            ) : (
              <>
                {canEnroll() && onEnroll && (
                  <button 
                    className="btn btn-primary btn-sm"
                    onClick={() => onEnroll(enrichedActivity.id)}
                  >
                    立即报名
                  </button>
                )}
                
                {canCancelEnrollment() && onCancelEnrollment && (
                  <button 
                    className="btn btn-error btn-sm"
                    onClick={() => onCancelEnrollment(enrichedActivity.id)}
                  >
                    取消报名
                  </button>
                )}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ActivityCard;
