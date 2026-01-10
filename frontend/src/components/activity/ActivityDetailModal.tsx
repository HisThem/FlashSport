import React, { useState, useEffect } from 'react';
import { Activity, Enrollment, ActivityStatus } from '../../api/activity';
import activityAPI from '../../api/activity';
import userAPI from '../../api/user';
import { getFriendlyDate, getTimeLeft, isExpired } from '../../utils/date';
import { enrichActivityWithEnrollmentStatus, isRegistrationExpired, formatActivityLocation } from '../../utils/activity';
import Avatar from '../Avatar';
import ConfirmModal, { ConfirmModalConfig } from '../ConfirmModal';
import { useNavigate } from 'react-router-dom';

interface ActivityDetailModalProps {
  isOpen: boolean;
  activity: Activity | null;
  onClose: () => void;
  onEnroll?: (activityId: number) => void;
  onCancelEnrollment?: (activityId: number) => void;
  onEdit?: (activity: Activity) => void;
  onDelete?: (activity: Activity) => void;
}

const ActivityDetailModal: React.FC<ActivityDetailModalProps> = ({
  isOpen,
  activity,
  onClose,
  onEnroll,
  onCancelEnrollment,
  onEdit,
  onDelete
}) => {
  const navigate = useNavigate();
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [loading, setLoading] = useState(false);
  const [previewImages, setPreviewImages] = useState<string[]>([]);
  const [previewIndex, setPreviewIndex] = useState<number>(0);
  const [currentUser] = useState(userAPI.getCurrentUserFromStorage());
  const [confirmModal, setConfirmModal] = useState<ConfirmModalConfig>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
    onCancel: () => setConfirmModal(prev => ({ ...prev, isOpen: false })),
  });

  useEffect(() => {
    if (isOpen && activity) {
      loadActivityDetails();
    }
  }, [isOpen, activity]);

  const loadActivityDetails = async () => {
    if (!activity) return;
    
    setLoading(true);
    try {
      const enrollmentsData = await activityAPI.getActivityEnrollments(activity.id);
      setEnrollments(enrollmentsData);
    } catch (error) {
      console.error('加载活动详情失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const showEnrollConfirm = (activityId: number, activityName: string) => {
    setConfirmModal({
      isOpen: true,
      title: '确认报名',
      message: `确定要报名参加「${activityName}」吗？`,
      confirmText: '确认报名',
      cancelText: '取消',
      type: 'info',
      onConfirm: () => {
        onEnroll?.(activityId);
        setConfirmModal(prev => ({ ...prev, isOpen: false }));
      },
      onCancel: () => setConfirmModal(prev => ({ ...prev, isOpen: false })),
    });
  };

  const showDeleteActivityConfirm = (activityToDelete: Activity) => {
    setConfirmModal({
      isOpen: true,
      title: '确认删除',
      message: `删除后无法恢复，确定删除「${activityToDelete.name}」吗？`,
      confirmText: '确认删除',
      cancelText: '取消',
      type: 'danger',
      onConfirm: () => {
        onDelete?.(activityToDelete);
        setConfirmModal(prev => ({ ...prev, isOpen: false }));
      },
      onCancel: () => setConfirmModal(prev => ({ ...prev, isOpen: false })),
    });
  };

  const showCancelEnrollmentConfirm = (activityId: number, activityName: string) => {
    setConfirmModal({
      isOpen: true,
      title: '确认取消报名',
      message: `确定要取消报名「${activityName}」吗？`,
      confirmText: '确认取消',
      cancelText: '保留报名',
      type: 'warning',
      onConfirm: () => {
        onCancelEnrollment?.(activityId);
        setConfirmModal(prev => ({ ...prev, isOpen: false }));
      },
      onCancel: () => setConfirmModal(prev => ({ ...prev, isOpen: false })),
    });
  };

  if (!isOpen || !activity) return null;

  // 确保活动有正确的报名状态信息
  const enrichedActivity = enrichActivityWithEnrollmentStatus(activity);

  const galleryImages = [
    ...(enrichedActivity.cover_image_url ? [enrichedActivity.cover_image_url] : []),
    ...(enrichedActivity.images?.map(image => image.image_url) || [])
  ];

  const openPreview = (index: number) => {
    if (!galleryImages.length) return;
    setPreviewImages(galleryImages);
    setPreviewIndex(index);
  };

  const closePreview = () => {
    setPreviewImages([]);
    setPreviewIndex(0);
  };

  const showPrevImage = () => {
    setPreviewIndex(prev => (prev - 1 + previewImages.length) % previewImages.length);
  };

  const showNextImage = () => {
    setPreviewIndex(prev => (prev + 1) % previewImages.length);
  };

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
    const now = new Date();
    const startTime = new Date(activity.start_time);
    const endTime = new Date(activity.end_time);
    
    // 如果状态是报名中，但报名已过期，显示已过期
    if (status === ActivityStatus.RECRUITING && isRegistrationExpired(activity.registration_deadline)) {
      return '已过期';
    }
    
    switch (status) {
      case ActivityStatus.RECRUITING: return '报名中';
      case ActivityStatus.REGISTRATION_CLOSED: return '报名已截止';
      case ActivityStatus.ONGOING: return '进行中';
      case ActivityStatus.FINISHED: return '已结束';
      case ActivityStatus.CANCELLED: return '已取消';
      default:
        // 回退到基于时间的推断
        if (now > endTime) return '已结束';
        if (now >= startTime && now <= endTime) return '进行中';
        if (now > new Date(activity.registration_deadline) && now < startTime) return '报名已截止';
        if (now <= new Date(activity.registration_deadline)) return '报名中';
        return '报名中';
    }
  };

  const getFeeText = (feeAmount: number) => {
    return Number(feeAmount) === 0 ? '免费' : `￥${feeAmount}`;
  };

  return (
    <>
    <ConfirmModal {...confirmModal} />
    <div className="modal modal-open pt-20 z-40">
      <div className="modal-box modal-bounce relative w-11/12 max-w-4xl max-h-[90vh] overflow-y-auto">
        <button 
          className="btn btn-sm btn-circle btn-ghost absolute top-4 right-4 z-10"
          onClick={onClose}
        >
          ✕
        </button>
        <h3 className="font-bold text-lg mb-4">{enrichedActivity.name}</h3>

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
                <span className={`badge ${(() => {
                  if (enrichedActivity.status === ActivityStatus.RECRUITING) {
                    return isRegistrationExpired(enrichedActivity.registration_deadline) ? 'badge-warning' : 'badge-success';
                  }
                  if (enrichedActivity.status === ActivityStatus.REGISTRATION_CLOSED) return 'badge-secondary';
                  if (enrichedActivity.status === ActivityStatus.ONGOING) return 'badge-warning';
                  if (enrichedActivity.status === ActivityStatus.FINISHED) return 'badge-neutral';
                  if (enrichedActivity.status === ActivityStatus.CANCELLED) return 'badge-error';
                  return 'badge-ghost';
                })()}`}>
                  {getStatusText(enrichedActivity)}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <span className="font-medium">类别:</span>
                <span className="badge badge-primary">{enrichedActivity.category?.name}</span>
              </div>

              <div className="flex items-center gap-2">
                <span className="font-medium">地点:</span>
                <span>{formatActivityLocation(enrichedActivity)}</span>
              </div>

              <div className="flex items-center gap-2">
                <span className="font-medium">费用:</span>
                <span>{getFeeText(enrichedActivity.fee_amount)}</span>
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
                    userId={enrichedActivity.organizer.id}
                  />
                  <div>
                    <div
                      className="font-medium cursor-pointer hover:text-primary"
                      onClick={() => navigate(`/profile/${enrichedActivity.organizer?.id}`)}
                    >
                      {enrichedActivity.organizer.username}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* 操作按钮 */}
            <div className="space-y-3">
              {(canEnroll && onEnroll) || (canCancelEnrollment && onCancelEnrollment) ? (
                <div className="space-y-2">
                  {canEnroll && onEnroll && (
                    <button 
                      className="btn btn-primary w-full"
                      onClick={() => showEnrollConfirm(enrichedActivity.id, enrichedActivity.name)}
                    >
                      立即报名
                    </button>
                  )}
                  
                  {canCancelEnrollment && onCancelEnrollment && (
                    <button 
                      className="btn btn-error w-full"
                      onClick={() => showCancelEnrollmentConfirm(enrichedActivity.id, enrichedActivity.name)}
                    >
                      取消报名
                    </button>
                  )}
                </div>
              ) : null}

              {isOwner && onEdit && enrichedActivity.status === ActivityStatus.RECRUITING && (
                <div className={onDelete ? 'grid grid-cols-2 gap-2' : 'space-y-2'}>
                  <button 
                    className="btn btn-outline w-full"
                    onClick={() => onEdit(enrichedActivity)}
                  >
                    编辑活动
                  </button>
                  {onDelete && (
                    <button 
                      className="btn btn-error w-full"
                      onClick={() => showDeleteActivityConfirm(enrichedActivity)}
                    >
                      删除
                    </button>
                  )}
                </div>
              )}
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
                    onClick={() => openPreview(0)}
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
                    onClick={() => openPreview((enrichedActivity.cover_image_url ? 1 : 0) + index)}
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
                  userId={enrollment.user?.id}
                />
                <span className="text-sm truncate">{enrollment.user?.username}</span>
              </div>
            ))}
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
    {previewImages.length > 0 && (
      <div className="modal modal-open pt-20">
        <div className="modal-box modal-bounce max-w-4xl p-0 bg-transparent shadow-none">
          <div className="relative">
            <img 
              src={previewImages[previewIndex]} 
              alt="活动照片预览"
              className="w-full max-h-[80vh] object-contain rounded-lg"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.style.display = 'none';
              }}
            />
            <button 
              className="btn btn-circle btn-sm absolute top-2 right-2 bg-black/50 border-none text-white hover:bg-black/70"
              onClick={closePreview}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            {previewImages.length > 1 && (
              <>
                <button
                  className="btn btn-circle btn-sm absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 border-none text-white hover:bg-black/70"
                  onClick={showPrevImage}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <button
                  className="btn btn-circle btn-sm absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 border-none text-white hover:bg-black/70"
                  onClick={showNextImage}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </>
            )}
          </div>
        </div>
        <div className="modal-backdrop bg-black/50" onClick={closePreview}></div>
      </div>
    )}
    </>
  );
};

export default ActivityDetailModal;
