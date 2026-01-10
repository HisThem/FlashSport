import React, { useEffect, useMemo, useRef } from 'react';
import { Activity, ActivityStatus } from '../../api/activity';

interface ActivityTimelineProps {
  activities: Activity[];
  onViewDetail: (activity: Activity) => void;
  onEdit?: (activity: Activity) => void;
  onCancelEnrollment?: (activityId: number) => void;
  onCancelActivity?: (activity: Activity) => void;
  canEditActivity: (activity: Activity) => boolean;
  canCancelActivity: (activity: Activity) => boolean;
  myActivities: Activity[];
  enrolledActivities: Activity[];
}

interface TimelineGroup {
  monthName: string;
  month: number;
  year: number;
  activities: Activity[];
}

const ActivityTimeline: React.FC<ActivityTimelineProps> = ({
  activities,
  onViewDetail,
  myActivities,
  enrolledActivities,
}) => {
  const timelineRef = useRef<HTMLDivElement>(null);
  const nearestFutureRef = useRef<HTMLDivElement>(null);

  // 按开始时间排序活动（从新到旧）
  const sortedActivities = useMemo(
    () =>
      [...activities].sort(
        (a, b) =>
          new Date(b.start_time).getTime() - new Date(a.start_time).getTime(),
      ),
    [activities],
  );

  // 找到最近的未来活动 ID，用于滚动标记
  const nearestFutureId = useMemo(() => {
    const now = Date.now();
    let nearest: { id: number; diff: number } | null = null;

    sortedActivities.forEach((activity) => {
      const start = new Date(activity.start_time).getTime();
      if (start >= now) {
        const diff = start - now;
        if (!nearest || diff < nearest.diff) {
          nearest = { id: activity.id, diff };
        }
      }
    });

    return nearest?.id ?? null;
  }, [sortedActivities]);

  // 按月份分组活动
  const groupedActivities: TimelineGroup[] = [];
  sortedActivities.forEach(activity => {
    const date = new Date(activity.start_time);
    const year = date.getFullYear();
    const month = date.getMonth() + 1; // 月份从1开始

    let group = groupedActivities.find(g => g.year === year && g.month === month);
    if (!group) {
      const monthNames = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'];
      group = {
        monthName: monthNames[month - 1],
        month,
        year,
        activities: []
      };
      groupedActivities.push(group);
    }
    group.activities.push(activity);
  });

  // 找到最近的未来活动并滚动到视口
  useEffect(() => {
    if (nearestFutureRef.current && timelineRef.current) {
      setTimeout(() => {
        nearestFutureRef.current?.scrollIntoView({
          behavior: 'smooth',
          block: 'start',
        });
      }, 100);
    }
  }, [nearestFutureId]);

  const now = new Date();

  // 检查活动是否是我发布的
  const isMyActivity = (activity: Activity) => 
    myActivities.some(a => a.id === activity.id);

  // 检查活动是否是我参与的（但不是我发布的）
  const isEnrolledActivity = (activity: Activity) => 
    enrolledActivities.some(a => a.id === activity.id) && !isMyActivity(activity);

  // 获取状态显示
  const getStatusBadge = (activity: Activity) => {
    switch (activity.status) {
      case ActivityStatus.CANCELLED:
        return <div className="badge badge-error badge-sm">已取消</div>;
      case ActivityStatus.FINISHED:
        return <div className="badge badge-neutral badge-sm">已结束</div>;
      case ActivityStatus.ONGOING:
        return <div className="badge badge-warning badge-sm">进行中</div>;
      case ActivityStatus.REGISTRATION_CLOSED:
        return <div className="badge badge-secondary badge-sm">报名已截止</div>;
      case ActivityStatus.RECRUITING:
        return <div className="badge badge-success badge-sm">报名中</div>;
      default:
        return <div className="badge badge-success badge-sm">报名中</div>;
    }
  };

  return (
    <div 
      ref={timelineRef}
      className="relative h-full overflow-y-auto px-6 py-8 rounded-lg bg-base-100/20 backdrop-blur-sm border border-base-200/30"
      style={{
        scrollbarWidth: 'thin',
        scrollbarColor: 'hsl(var(--p) / 0.3) transparent'
      }}
    >
      {/* 居中容器 */}
      <div className="max-w-4xl mx-auto relative">
        {/* 中央垂直时间线 */}
        <div className="absolute left-[180px] top-8 bottom-8 w-0.5 bg-gradient-to-b from-primary/30 via-primary/50 to-primary/30"></div>

        {/* 所有活动列表 */}
        <div className="space-y-8">
        {sortedActivities.map((activity, index) => {
          const activityDate = new Date(activity.start_time);
          const activityEndDate = new Date(activity.end_time);
          const isFuture = activityDate >= now;
          const isFinished = activityEndDate < now;
          const isNearestFuture = activity.id === nearestFutureId;
          
          const isOwner = isMyActivity(activity);
          const isEnrolled = isEnrolledActivity(activity);

          // 检查是否需要显示年份分隔线
          const currentYear = activityDate.getFullYear();
          const prevYear = index > 0 ? new Date(sortedActivities[index - 1].start_time).getFullYear() : null;
          const showYearDivider = prevYear !== null && currentYear !== prevYear;

          return (
            <React.Fragment key={activity.id}>
              {/* 年份分隔线 */}
              {showYearDivider && (
                <div className="flex items-center gap-4 my-12">
                  <div className="w-[180px] flex-shrink-0 text-right pr-8">
                    <span className="text-lg font-bold text-primary">{currentYear} 年</span>
                  </div>
                  <div className="flex-1 border-t-2 border-dashed border-primary/30"></div>
                </div>
              )}

              {/* 第一个活动前显示年份 */}
              {index === 0 && (
                <div className="flex items-center gap-4 mb-12">
                  <div className="w-[180px] flex-shrink-0 text-right pr-8">
                    <span className="text-lg font-bold text-primary">{currentYear} 年</span>
                  </div>
                  <div className="flex-1 border-t-2 border-dashed border-primary/30"></div>
                </div>
              )}

              <div 
                ref={isNearestFuture ? nearestFutureRef : null}
                className="flex items-center group relative"
              >
                {/* 左侧：日期时间 */}
                <div className="w-[180px] flex-shrink-0 text-right pr-8">
                  <div className={`text-lg font-bold ${
                    isFuture ? 'text-primary' : 'text-base-content/60'
                  }`}>
                    {activityDate.getMonth() + 1}月{activityDate.getDate()}日
                  </div>
                  <div className="text-sm text-base-content/50 mt-1">
                    {activityDate.toLocaleTimeString('zh-CN', { 
                      hour: '2-digit', 
                      minute: '2-digit' 
                    })}
                  </div>
                </div>

              {/* 中间：时间点 */}
              <div className="relative z-10 flex-shrink-0">
                <div className={`w-4 h-4 rounded-full ${
                  isNearestFuture 
                    ? 'bg-primary ring-4 ring-primary/20 shadow-lg shadow-primary/50' 
                    : isFuture 
                    ? 'bg-primary/60 ring-4 ring-primary/15 shadow-lg shadow-primary/30' 
                    : 'bg-base-content/40 ring-2 ring-base-content/10'
                } ${isNearestFuture ? 'animate-pulse' : ''}`}>
                  {isNearestFuture && (
                    <>
                      <div className="absolute -inset-2 rounded-full bg-primary/30 animate-ping"></div>
                      <div className="absolute -inset-1 rounded-full bg-primary/20 animate-pulse"></div>
                    </>
                  )}
                </div>
              </div>

              {/* 右侧：活动卡片 */}
              <div className="flex-1 min-w-0 max-w-2xl pl-8">
                <div className="relative">
                  <div 
                    onClick={() => onViewDetail(activity)}
                    className={`
                      flex items-center gap-4 p-4 rounded-xl cursor-pointer
                      transition-all duration-300
                      shadow-md
                      ${isFuture 
                        ? 'bg-base-100 hover:bg-base-100 border-2 border-primary/30 hover:border-primary/50 hover:shadow-xl shadow-primary/10' 
                        : 'bg-base-100 hover:bg-base-100 border border-base-content/10 hover:border-base-content/20 hover:shadow-lg'
                      }
                      hover:scale-[1.01]
                    `}
                  >
                    {/* 左侧：封面图片 */}
                    <div className="w-24 h-24 flex-shrink-0">
                      <img 
                        src={activity.cover_image_url || '/placeholder-activity.jpg'} 
                        alt={activity.name}
                        className="w-full h-full object-cover rounded-lg shadow-md"
                        onError={(e) => {
                          e.currentTarget.src = 'https://placehold.co/200x200/e2e8f0/64748b?text=活动';
                        }}
                      />
                    </div>

                    {/* 右侧：文字信息 */}
                    <div className="flex-1 min-w-0">
                      {/* 状态和标签 */}
                      <div className="flex items-center gap-2 mb-2 flex-wrap">
                        {getStatusBadge(activity)}
                        {isOwner && (
                          <div className="badge badge-primary badge-sm">📝 我发布</div>
                        )}
                        {isEnrolled && (
                          <div className="badge badge-info badge-sm">🏃 我参与</div>
                        )}
                        {isNearestFuture && (
                          <div className="badge badge-warning badge-sm animate-pulse">⭐ 即将开始</div>
                        )}
                      </div>

                      {/* 活动标题 */}
                      <h3 className={`font-bold text-lg line-clamp-1 mb-2 ${
                        isFuture ? 'text-base-content' : 'text-base-content/70'
                      }`}>
                        {activity.name}
                      </h3>

                      {/* 详细信息 */}
                      <div className="space-y-2 text-sm text-base-content/70">
                        {/* 地址信息 */}
                        <div className="flex items-center gap-2">
                          <svg className="w-4 h-4 text-primary flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                          <span>{activity.city} {activity.address}</span>
                        </div>
                        
                        {/* 时间信息 */}
                        <div className="flex items-center gap-2">
                          <svg className="w-4 h-4 text-primary flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          <span>
                            {new Date(activity.start_time).toLocaleString('zh-CN', { hour: '2-digit', minute: '2-digit' })} 
                            ~ 
                            {new Date(activity.end_time).toLocaleString('zh-CN', { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* 右侧箭头指示 */}
                    <div className="flex-shrink-0 text-base-content/30 group-hover:text-primary transition-colors">
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </div>
                  
                  {/* 已结束活动的半透明遮罩 */}
                  {isFinished && (
                    <div className="absolute inset-0 bg-white/50 rounded-xl pointer-events-none"></div>
                  )}
                </div>
              </div>
            </div>
            </React.Fragment>
          );
        })}
      </div>
      </div>

      {activities.length === 0 && (
        <div className="text-center py-16">
          <div className="text-7xl mb-6">📅</div>
          <div className="text-lg text-base-content/60 font-medium">时间轴上暂无活动</div>
          <div className="text-sm text-base-content/40 mt-2">发布或参与活动后，这里将展示时间轴</div>
        </div>
      )}
    </div>
  );
};

export default ActivityTimeline;
