import React, { useState, useEffect } from 'react';
import { Activity } from '../api/activity';
import activityAPI from '../api/activity';
import userAPI from '../api/user';
import ActivityDetailModal from '../components/activity/ActivityDetailModal';
import ActivityFormModal from '../components/activity/ActivityFormModal';
import ActivityTimeline from '../components/activity/ActivityTimeline';
import ConfirmModal, { ConfirmModalConfig } from '../components/ConfirmModal';
import { useToast } from '../components/Toast';
import { enrichActivitiesWithEnrollmentStatus } from '../utils/activity';

const MyActivities: React.FC = () => {
  const [myActivities, setMyActivities] = useState<Activity[]>([]);
  const [enrolledActivities, setEnrolledActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'all' | 'published' | 'enrolled'>('all');
  const [selectedActivity, setSelectedActivity] = useState<Activity | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingActivity, setEditingActivity] = useState<Activity | null>(null);
  const [currentUser] = useState(userAPI.getCurrentUserFromStorage());
  const [confirmModal, setConfirmModal] = useState<ConfirmModalConfig>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
    onCancel: () => setConfirmModal(prev => ({ ...prev, isOpen: false })),
  });
  const toast = useToast();

  useEffect(() => {
    if (currentUser) {
      loadAllData();
    }
  }, [currentUser]);

  const loadAllData = async () => {
    if (!currentUser) return;
    
    setLoading(true);
    try {
      // 同时加载两种类型的活动数据
      const [myActivitiesResponse, enrolledActivitiesResponse] = await Promise.all([
        activityAPI.getMyActivities(),
        activityAPI.getMyEnrolledActivities()
      ]);

      // 为我发布的活动添加报名状态信息
      const enrichedMyActivities = enrichActivitiesWithEnrollmentStatus(myActivitiesResponse.items);
      setMyActivities(enrichedMyActivities);

      // 为我参与的活动添加报名状态信息
      const enrichedEnrolledActivities = enrichActivitiesWithEnrollmentStatus(enrolledActivitiesResponse.items);
      setEnrolledActivities(enrichedEnrolledActivities);
    } catch (error) {
      console.error('加载活动失败:', error);
      toast.error('加载活动失败');
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetail = (activity: Activity) => {
    setSelectedActivity(activity);
    setIsDetailModalOpen(true);
  };

  const handleCreateActivity = () => {
    setEditingActivity(null);
    setIsFormModalOpen(true);
  };

  const handleEditActivity = (activity: Activity) => {
    setEditingActivity(activity);
    setIsFormModalOpen(true);
  };

  const handleFormSuccess = () => {
    if (editingActivity) {
      // 如果是编辑现有活动，只更新单个活动数据
      updateSingleActivityData(editingActivity.id);
      toast.success('活动更新成功');
    } else {
      // 如果是新增活动，需要重新加载所有数据
      loadAllData();
      toast.success('活动发布成功');
    }
  };

  const canEditActivity = (activity: Activity) => {
    const now = new Date();
    const startTime = new Date(activity.start_time);
    
    // 活动开始后不能编辑
    if (now >= startTime) {
      return false;
    }
    
    // 已取消或已结束的活动不能编辑
    if (activity.status === 'cancelled' || activity.status === 'finished') {
      return false;
    }
    
    return true;
  };

  const handleCancelActivity = async (activity: Activity) => {
    const currentTime = new Date();
    const activityStartTime = new Date(activity.start_time);

    if (currentTime > activityStartTime) {
      toast.error('活动开始后不能取消活动');
      return;
    }

    if (activity.status === 'cancelled') {
      toast.error('活动已经取消了');
      return;
    }

    if (activity.status === 'finished') {
      toast.error('已结束的活动不能取消');
      return;
    }

    setConfirmModal({
      isOpen: true,
      title: '确认取消',
      message: '确定要取消这个活动吗？取消后无法恢复，所有已报名用户的报名也会被取消。',
      confirmText: '确认取消',
      cancelText: '保留活动',
      type: 'danger',
      onConfirm: async () => {
        try {
          await activityAPI.cancelActivity(activity.id);
          await updateSingleActivityData(activity.id);
          toast.success('活动已取消');
        } catch (error: any) {
          toast.error(error.message || '取消活动失败');
        }
        setConfirmModal(prev => ({ ...prev, isOpen: false }));
      },
      onCancel: () => setConfirmModal(prev => ({ ...prev, isOpen: false })),
    });
  };

  const handleDeleteActivity = (activity: Activity) => {
    setConfirmModal({
      isOpen: true,
      title: '确认删除',
      message: '删除后无法恢复，确定要删除吗？',
      confirmText: '删除',
      cancelText: '取消',
      type: 'danger',
      onConfirm: async () => {
        try {
          await activityAPI.deleteActivity(activity.id);
          setMyActivities(prev => prev.filter(a => a.id !== activity.id));
          setEnrolledActivities(prev => prev.filter(a => a.id !== activity.id));
          if (selectedActivity?.id === activity.id) {
            setSelectedActivity(null);
            setIsDetailModalOpen(false);
          }
          toast.success('活动已删除');
        } catch (error: any) {
          toast.error(error.message || '删除活动失败');
        }
        setConfirmModal(prev => ({ ...prev, isOpen: false }));
      },
      onCancel: () => setConfirmModal(prev => ({ ...prev, isOpen: false })),
    });
  };

  const canCancelActivity = (activity: Activity) => {
    const now = new Date();
    const startTime = new Date(activity.start_time);
    
    // 活动开始后不能取消
    if (now >= startTime) {
      return false;
    }
    
    // 只有报名中或报名已截止的活动可以取消
    return activity.status === 'recruiting' || 
           activity.status === 'registration_closed';
  };

  const updateSingleActivityData = async (activityId: number) => {
    try {
      const updatedActivity = await activityAPI.getActivityById(activityId);
      const enrichedActivities = await enrichActivitiesWithEnrollmentStatus([updatedActivity]);
      const enrichedActivity = enrichedActivities[0];
      
      // 更新"我发布的活动"列表中的数据
      setMyActivities(prevActivities => 
        prevActivities.map(activity => 
          activity.id === activityId ? enrichedActivity : activity
        )
      );
      
      // 更新"我参与的活动"列表中的数据
      setEnrolledActivities(prevActivities => 
        prevActivities.map(activity => 
          activity.id === activityId ? enrichedActivity : activity
        )
      );
      
      // 如果详情模态框正在显示这个活动，也更新它
      if (selectedActivity && selectedActivity.id === activityId) {
        setSelectedActivity(enrichedActivity);
      }
    } catch (error) {
      console.error('更新活动数据失败:', error);
    }
  };

  const handleCancelEnrollment = async (activityId: number) => {
    try {
      await activityAPI.cancelEnrollment(activityId);
      await updateSingleActivityData(activityId);
      toast.success('取消报名成功');
    } catch (error: any) {
      toast.error(error.message || '取消报名失败');
    }
  };

  const handleEnroll = async (activityId: number) => {
    if (!currentUser) {
      toast.error('请先登录');
      return;
    }

    try {
      await activityAPI.enrollActivity(activityId);
      await updateSingleActivityData(activityId);
      toast.success('报名成功');
    } catch (error: any) {
      toast.error(error.message || '报名失败');
    }
  };

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-pattern-overlay pt-20">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center py-12">
            <div className="text-6xl mb-4">🔐</div>
            <h3 className="text-xl font-semibold text-base-content/80 mb-2">
              请先登录
            </h3>
            <p className="text-base-content/60 mb-4">
              您需要登录后才能查看和管理您的活动
            </p>
            <button 
              className="btn btn-primary"
              onClick={() => window.location.href = '/login'}
            >
              前往登录
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 获取当前活动列表（根据选中的标签页）
  const currentActivities = activeTab === 'all' 
    ? [...myActivities, ...enrolledActivities.filter(e => !myActivities.some(m => m.id === e.id))]
    : activeTab === 'published' 
    ? myActivities 
    : enrolledActivities;

  // 计算所有活动的总数
  const allActivitiesCount = myActivities.length + enrolledActivities.filter(e => !myActivities.some(m => m.id === e.id)).length;

  return (
    <div className="h-screen overflow-hidden bg-pattern-overlay pt-20 flex flex-col">
      <ConfirmModal {...confirmModal} />
      <div className="container mx-auto px-4 py-8 flex-1 flex flex-col overflow-hidden">
        {/* 页面标题 */}
        <div className="text-center mb-8 flex-shrink-0">
          <h1 className="text-4xl font-bold text-primary mb-4">
            我的活动
          </h1>
          {/* <p className="text-lg text-base-content/80 max-w-2xl mx-auto">
            管理您发布的活动和参与的活动
          </p> */}
        </div>

        {/* 标签页 */}
        <div className="flex justify-center mb-8 flex-shrink-0">
          <div className="bg-base-100/40 backdrop-blur-sm border border-base-200/30 rounded-full px-2 py-2 flex flex-wrap items-center gap-2">
            <button 
              className={`btn btn-sm rounded-full ${activeTab === 'all' ? 'btn-primary' : 'btn-outline'}`}
              onClick={() => setActiveTab('all')}
            >
              所有活动 ({allActivitiesCount})
            </button>
            <button 
              className={`btn btn-sm rounded-full ${activeTab === 'published' ? 'btn-primary' : 'btn-outline'}`}
              onClick={() => setActiveTab('published')}
            >
              我发布的活动 ({myActivities.length})
            </button>
            <button 
              className={`btn btn-sm rounded-full ${activeTab === 'enrolled' ? 'btn-primary' : 'btn-outline'}`}
              onClick={() => setActiveTab('enrolled')}
            >
              我参与的活动 ({enrolledActivities.length})
            </button>
          </div>
        </div>

        {/* 活动列表 */}
        <div className="flex-1 min-h-0 overflow-hidden">
          {loading ? (
            <div className="flex justify-center items-center py-12">
              <div className="loading loading-spinner loading-lg"></div>
            </div>
          ) : currentActivities.length > 0 ? (
            <ActivityTimeline
              activities={currentActivities}
              onViewDetail={handleViewDetail}
              onEdit={handleEditActivity}
              onCancelEnrollment={handleCancelEnrollment}
              onCancelActivity={handleCancelActivity}
              canEditActivity={canEditActivity}
              canCancelActivity={canCancelActivity}
              myActivities={myActivities}
              enrolledActivities={enrolledActivities}
            />
          ) : (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">
                {activeTab === 'all' ? '🎯' : activeTab === 'published' ? '📝' : '🏃‍♂️'}
              </div>
              <h3 className="text-xl font-semibold text-base-content/80 mb-2">
                {activeTab === 'all' ? '还没有任何活动' : activeTab === 'published' ? '还没有发布任何活动' : '还没有参与任何活动'}
              </h3>
              <p className="text-base-content/60 mb-4">
                {activeTab === 'all'
                  ? '发布您的第一个活动或参与已有活动，开始精彩的体育之旅吧！'
                  : activeTab === 'published' 
                  ? '发布您的第一个活动，开始组织精彩的体育活动吧！' 
                  : '去活动页面找找感兴趣的活动参与吧！'}
              </p>
              {activeTab === 'all' || activeTab === 'published' ? (
                <button 
                  className="btn btn-primary"
                  onClick={handleCreateActivity}
                >
                  {activeTab === 'all' ? '发布活动' : '发布第一个活动'}
                </button>
              ) : (
                <button 
                  className="btn btn-primary"
                  onClick={() => window.location.href = '/activity'}
                >
                  浏览活动
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* 活动详情弹窗 */}
      <ActivityDetailModal
        isOpen={isDetailModalOpen}
        activity={selectedActivity}
        onClose={() => {
          setIsDetailModalOpen(false);
          setSelectedActivity(null);
        }}
        onEdit={activeTab === 'published' || (activeTab === 'all' && selectedActivity && myActivities.some(a => a.id === selectedActivity.id)) ? handleEditActivity : undefined}
        onEnroll={handleEnroll}
        onCancelEnrollment={handleCancelEnrollment}
        onDelete={activeTab === 'published' || (activeTab === 'all' && selectedActivity && myActivities.some(a => a.id === selectedActivity.id)) ? handleDeleteActivity : undefined}
      />

      {/* 活动表单弹窗 */}
      <ActivityFormModal
        isOpen={isFormModalOpen}
        activity={editingActivity}
        onClose={() => {
          setIsFormModalOpen(false);
          setEditingActivity(null);
        }}
        onSuccess={handleFormSuccess}
      />

    </div>
  );
};

export default MyActivities;
