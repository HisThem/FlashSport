import React from 'react';
import { Activity, ActivityStatus, FeeType } from '../../api/activity';
import { formatDate, formatTime, isExpired } from '../../utils/date';

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
  // 获取状态显示文本和样式
  const getStatusBadge = (status: ActivityStatus) => {
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
    return activity.status === ActivityStatus.RECRUITING && 
           !isExpired(activity.registration_deadline) && 
           (activity.enrollment_count || 0) < activity.max_participants &&
           !activity.is_enrolled;
  };

  // 检查是否可以取消报名
  const canCancelEnrollment = () => {
    return activity.is_enrolled && 
           activity.status === ActivityStatus.RECRUITING && 
           !isExpired(activity.registration_deadline);
  };

  return (
    <div className="card bg-base-100 shadow-xl hover:shadow-2xl transition-all duration-300">
      <figure className="relative">
        <img 
          src={activity.cover_image_url || 'https://via.placeholder.com/400x200?text=活动图片'} 
          alt={activity.name}
          className="h-48 w-full object-cover"
        />
        <div className="absolute top-2 right-2">
          {getStatusBadge(activity.status)}
        </div>
        <div className="absolute top-2 left-2">
          <div className="badge badge-primary">{activity.category?.name}</div>
        </div>
      </figure>
      
      <div className="card-body">
        <h2 className="card-title">
          {activity.name}
          {activity.is_enrolled && (
            <div className="badge badge-secondary">已报名</div>
          )}
        </h2>
        
        <p className="text-sm text-base-content/70 line-clamp-2">
          {activity.description}
        </p>
        
        <div className="space-y-2 text-sm">
          <div className="flex items-center gap-2">
            <svg className="w-4 h-4 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <span className="text-base-content/80">{activity.location}</span>
          </div>
          
          <div className="flex items-center gap-2">
            <svg className="w-4 h-4 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <span className="text-base-content/80">
              {formatDate(activity.start_time)} {formatTime(activity.start_time)}
            </span>
          </div>
          
          <div className="flex items-center gap-2">
            <svg className="w-4 h-4 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
            </svg>
            <span className="text-base-content/80">
              {activity.enrollment_count || 0}/{activity.max_participants}人
            </span>
          </div>
          
          <div className="flex items-center gap-2">
            <svg className="w-4 h-4 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
            </svg>
            <span className="text-base-content/80">
              {getFeeText(activity.fee_type, activity.fee_amount)}
            </span>
          </div>
          
          {activity.organizer && (
            <div className="flex items-center gap-2">
              <div className="avatar">
                <div className="w-6 h-6 rounded-full">
                  <img 
                    src={activity.organizer.avatar_url || 'https://via.placeholder.com/40?text=头像'} 
                    alt={activity.organizer.username}
                  />
                </div>
              </div>
              <span className="text-base-content/80">发起人: {activity.organizer.username}</span>
            </div>
          )}
        </div>
        
        {showActions && (
          <div className="card-actions justify-end mt-4">
            <button 
              className="btn btn-outline btn-sm"
              onClick={() => onViewDetail(activity)}
            >
              查看详情
            </button>
            
            {isOwner ? (
              <>
                {activity.status === ActivityStatus.RECRUITING && (
                  <button 
                    className="btn btn-primary btn-sm"
                    onClick={() => onEdit && onEdit(activity)}
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
                    onClick={() => onEnroll(activity.id)}
                  >
                    立即报名
                  </button>
                )}
                
                {canCancelEnrollment() && onCancelEnrollment && (
                  <button 
                    className="btn btn-error btn-sm"
                    onClick={() => onCancelEnrollment(activity.id)}
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
