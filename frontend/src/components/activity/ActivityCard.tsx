import Avatar from '../Avatar';
import { Activity, ActivityStatus, FeeType } from '../../api/activity';
import { canUserCancelEnrollment, canUserEnroll, enrichActivityWithEnrollmentStatus } from '../../utils/activity';
import { formatDate, formatTime } from '../../utils/date';
import React from 'react';

interface ActivityCardProps {
  activity: Activity;
  onViewDetail: (activity: Activity) => void;
  onEnroll?: (activityId: number) => void;
  onCancelEnrollment?: (activityId: number) => void;
  onEdit?: (activity: Activity) => void;
  onCancelActivity?: (activity: Activity) => void;
  onUpdateActivityStatus?: (activity: Activity, newStatus: string) => void;
  showActions?: boolean;
  isOwner?: boolean;
  canEditActivity?: (activity: Activity) => boolean;
  canCancelActivity?: (activity: Activity) => boolean;
  canChangeStatus?: (activity: Activity) => boolean;
}

const ActivityCard: React.FC<ActivityCardProps> = ({
  activity,
  onViewDetail,
  onEnroll,
  onCancelEnrollment,
  onEdit,
  onCancelActivity,
  onUpdateActivityStatus,
  showActions = true,
  isOwner = false,
  canEditActivity,
  canCancelActivity,
  canChangeStatus
}) => {
  // 确保活动有正确的报名状态信息
  const enrichedActivity = enrichActivityWithEnrollmentStatus(activity);

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
      case ActivityStatus.PREPARING:
        return <div className="badge badge-info">筹备中</div>;
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
        // 默认为筹备中
        return <div className="badge badge-info">筹备中</div>;
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
            
            {isOwner && (onEdit || onCancelActivity || onUpdateActivityStatus) ? (
              <>
                {/* 管理按钮下拉菜单 */}
                <div className="dropdown dropdown-top dropdown-end">
                  <div tabIndex={0} role="button" className="btn btn-circle btn-sm btn-primary">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01" />
                    </svg>
                  </div>
                  <ul tabIndex={0} className="dropdown-content menu bg-base-100 rounded-box z-[1] w-52 p-2 shadow-lg border mb-2">
                    {/* 编辑活动 - 只有提供了 onEdit 回调才显示 */}
                    {onEdit && (
                      <li>
                        <button
                          onClick={() => onEdit(enrichedActivity)}
                          disabled={!canEditActivity || !canEditActivity(enrichedActivity)}
                          className={`flex items-center gap-2 ${!canEditActivity || !canEditActivity(enrichedActivity) ? 'text-base-content/50' : 'hover:bg-base-200'}`}
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                          编辑活动
                          {(!canEditActivity || !canEditActivity(enrichedActivity)) && <span className="text-xs opacity-60">(已截止)</span>}
                        </button>
                      </li>
                    )}
                    
                    {/* 取消活动 - 只有提供了 onCancelActivity 回调才显示 */}
                    {onCancelActivity && (
                      <li>
                        <button
                          onClick={() => onCancelActivity(enrichedActivity)}
                          disabled={!canCancelActivity || !canCancelActivity(enrichedActivity)}
                          className={`flex items-center gap-2 ${
                            !canCancelActivity || !canCancelActivity(enrichedActivity)
                              ? 'text-base-content/50' 
                              : 'text-error hover:bg-error/10'
                          }`}
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                          取消活动
                          {(!canCancelActivity || !canCancelActivity(enrichedActivity)) && <span className="text-xs opacity-60">(不可取消)</span>}
                        </button>
                      </li>
                    )}
                    
                    {/* 结束活动 - 只有提供了 onUpdateActivityStatus 回调且活动未结束才显示 */}
                    {onUpdateActivityStatus && enrichedActivity.status !== 'finished' && enrichedActivity.status !== 'cancelled' && (
                      <li>
                        <button
                          onClick={() => {
                            if (confirm('确定要结束这个活动吗？结束后无法撤回，活动将被标记为已完成状态。')) {
                              onUpdateActivityStatus(enrichedActivity, 'finished');
                            }
                          }}
                          className="flex items-center gap-2 text-warning hover:bg-warning/10"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          结束活动
                        </button>
                      </li>
                    )}
                    
                    {/* 更改状态 - 只有提供了 onUpdateActivityStatus 回调才显示 */}
                    {onUpdateActivityStatus && canChangeStatus && canChangeStatus(enrichedActivity) && (
                      <>
                        <li><hr className="my-1" /></li>
                        <li className="menu-title">
                          <span className="text-xs">更改状态</span>
                        </li>
                        {enrichedActivity.status !== 'preparing' && (
                          <li>
                            <button 
                              onClick={() => onUpdateActivityStatus(enrichedActivity, 'preparing')}
                              className="flex items-center gap-2 hover:bg-base-200"
                            >
                              <span className="badge badge-info badge-xs"></span>
                              筹备中
                            </button>
                          </li>
                        )}
                        {enrichedActivity.status !== 'recruiting' && (
                          <li>
                            <button 
                              onClick={() => onUpdateActivityStatus(enrichedActivity, 'recruiting')}
                              className="flex items-center gap-2 hover:bg-base-200"
                            >
                              <span className="badge badge-success badge-xs"></span>
                              报名中
                            </button>
                          </li>
                        )}
                        {enrichedActivity.status !== 'registration_closed' && (
                          <li>
                            <button 
                              onClick={() => onUpdateActivityStatus(enrichedActivity, 'registration_closed')}
                              className="flex items-center gap-2 hover:bg-base-200"
                            >
                              <span className="badge badge-secondary badge-xs"></span>
                              报名已截止
                            </button>
                          </li>
                        )}
                        {enrichedActivity.status !== 'ongoing' && (
                          <li>
                            <button 
                              onClick={() => onUpdateActivityStatus(enrichedActivity, 'ongoing')}
                              className="flex items-center gap-2 hover:bg-base-200"
                            >
                              <span className="badge badge-warning badge-xs"></span>
                              进行中
                            </button>
                          </li>
                        )}
                      </>
                    )}
                    
                    {/* 无操作提示 - 当没有任何可用操作时显示 */}
                    {(!onEdit || !canEditActivity || !canEditActivity(enrichedActivity)) && 
                     (!onUpdateActivityStatus || !canChangeStatus || !canChangeStatus(enrichedActivity)) && 
                     (!onCancelActivity || !canCancelActivity || !canCancelActivity(enrichedActivity)) && (
                      <>
                        <li><hr className="my-1" /></li>
                        <li>
                          <span className="text-base-content/60 text-sm">
                            {new Date() > new Date(enrichedActivity.end_time) 
                              ? '活动结束后不可管理'
                              : new Date() >= new Date(enrichedActivity.start_time)
                              ? '活动进行中不可编辑'
                              : '无可用操作'}
                          </span>
                        </li>
                      </>
                    )}
                  </ul>
                </div>
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
