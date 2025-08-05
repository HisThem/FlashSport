import React, { useState, useEffect } from 'react';
import { Activity } from '../api/activity';
import activityAPI from '../api/activity';
import userAPI from '../api/user';
import ActivityCard from '../components/activity/ActivityCard';
import ActivityDetailModal from '../components/activity/ActivityDetailModal';
import ActivityFormModal from '../components/activity/ActivityFormModal';
import SimpleToast from '../components/SimpleToast';
import { enrichActivitiesWithEnrollmentStatus } from '../utils/activity';

const MyActivities: React.FC = () => {
  const [myActivities, setMyActivities] = useState<Activity[]>([]);
  const [enrolledActivities, setEnrolledActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'published' | 'enrolled'>('published');
  const [selectedActivity, setSelectedActivity] = useState<Activity | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingActivity, setEditingActivity] = useState<Activity | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [currentUser] = useState(userAPI.getCurrentUserFromStorage());

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
      showToast('加载活动失败', 'error');
    } finally {
      setLoading(false);
    }
  };

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
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
    loadAllData();
    showToast(editingActivity ? '活动更新成功' : '活动发布成功', 'success');
  };

  const handleCancelActivity = async (activity: Activity) => {
    // 检查是否可以取消活动
    const now = new Date();
    const startTime = new Date(activity.start_time);
    
    if (now >= startTime) {
      showToast('活动开始后不能取消活动', 'error');
      return;
    }

    if (activity.status === 'cancelled') {
      showToast('活动已经取消了', 'error');
      return;
    }

    if (activity.status === 'finished') {
      showToast('已结束的活动不能取消', 'error');
      return;
    }

    if (!confirm('确定要取消这个活动吗？取消后无法恢复，所有已报名用户的报名也会被取消。')) {
      return;
    }

    try {
      await activityAPI.cancelActivity(activity.id);
      loadAllData();
      showToast('活动已取消', 'success');
    } catch (error: any) {
      showToast(error.message || '取消活动失败', 'error');
    }
  };

  const handleUpdateActivityStatus = async (activity: Activity, newStatus: string) => {
    // 检查是否可以更改状态
    const now = new Date();
    const endTime = new Date(activity.end_time);
    
    if (now > endTime) {
      showToast('活动结束后不能更改活动状态', 'error');
      return;
    }

    if (activity.status === 'cancelled') {
      showToast('已取消的活动不能更改状态', 'error');
      return;
    }

    try {
      await activityAPI.updateActivityStatus(activity.id, newStatus as any);
      loadAllData();
      showToast('活动状态更新成功', 'success');
    } catch (error: any) {
      showToast(error.message || '更新活动状态失败', 'error');
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

  const canCancelActivity = (activity: Activity) => {
    const now = new Date();
    const startTime = new Date(activity.start_time);
    
    // 活动开始后不能取消
    if (now >= startTime) {
      return false;
    }
    
    // 只有筹备中、报名中或报名已截止的活动可以取消
    return activity.status === 'preparing' || 
           activity.status === 'recruiting' || 
           activity.status === 'registration_closed';
  };

  const canChangeStatus = (activity: Activity) => {
    const now = new Date();
    const endTime = new Date(activity.end_time);
    
    // 活动结束后不能更改状态
    if (now > endTime) {
      return false;
    }
    
    // 已取消的活动不能更改状态
    return activity.status !== 'cancelled';
  };

  const handleCancelEnrollment = async (activityId: number) => {
    try {
      await activityAPI.cancelEnrollment(activityId);
      loadAllData();
      showToast('取消报名成功', 'success');
    } catch (error: any) {
      showToast(error.message || '取消报名失败', 'error');
    }
  };

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-base-100 pt-20">
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

  const currentActivities = activeTab === 'published' ? myActivities : enrolledActivities;

  return (
    <div className="min-h-screen bg-base-100 pt-20">
      <div className="container mx-auto px-4 py-8">
        {/* 页面标题 */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-primary mb-4">
            我的活动
          </h1>
          <p className="text-lg text-base-content/80 max-w-2xl mx-auto">
            管理您发布的活动和参与的活动
          </p>
        </div>

        {/* 标签页 */}
        <div className="tabs tabs-boxed justify-center mb-8">
          <button 
            className={`tab tab-lg ${activeTab === 'published' ? 'tab-active' : ''}`}
            onClick={() => setActiveTab('published')}
          >
            我发布的活动 ({myActivities.length})
          </button>
          <button 
            className={`tab tab-lg ${activeTab === 'enrolled' ? 'tab-active' : ''}`}
            onClick={() => setActiveTab('enrolled')}
          >
            我参与的活动 ({enrolledActivities.length})
          </button>
        </div>

        {/* 发布活动按钮 */}
        {activeTab === 'published' && (
          <div className="flex justify-end mb-6">
            <button 
              className="btn btn-primary"
              onClick={handleCreateActivity}
            >
              发布新活动
            </button>
          </div>
        )}

        {/* 活动列表 */}
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <div className="loading loading-spinner loading-lg"></div>
          </div>
        ) : currentActivities.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {currentActivities.map(activity => (
              <div key={activity.id}>
                <ActivityCard
                  activity={activity}
                  onViewDetail={handleViewDetail}
                  onEdit={activeTab === 'published' ? handleEditActivity : undefined}
                  onCancelEnrollment={activeTab === 'enrolled' ? handleCancelEnrollment : undefined}
                  onCancelActivity={activeTab === 'published' ? handleCancelActivity : undefined}
                  onUpdateActivityStatus={activeTab === 'published' ? handleUpdateActivityStatus : undefined}
                  isOwner={activeTab === 'published'}
                  showActions={true}
                  canEditActivity={canEditActivity}
                  canCancelActivity={canCancelActivity}
                  canChangeStatus={canChangeStatus}
                />
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">
              {activeTab === 'published' ? '📝' : '🏃‍♂️'}
            </div>
            <h3 className="text-xl font-semibold text-base-content/80 mb-2">
              {activeTab === 'published' ? '还没有发布任何活动' : '还没有参与任何活动'}
            </h3>
            <p className="text-base-content/60 mb-4">
              {activeTab === 'published' 
                ? '发布您的第一个活动，开始组织精彩的体育活动吧！' 
                : '去活动页面找找感兴趣的活动参与吧！'}
            </p>
            {activeTab === 'published' ? (
              <button 
                className="btn btn-primary"
                onClick={handleCreateActivity}
              >
                发布第一个活动
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

        {/* 统计信息 */}
        <div className="mt-16">
          <div className="stats stats-vertical lg:stats-horizontal shadow w-full">
            <div className="stat">
              <div className="stat-figure text-primary">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  className="inline-block h-8 w-8 stroke-current">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                </svg>
              </div>
              <div className="stat-title">发布的活动</div>
              <div className="stat-value text-primary">{myActivities.length}</div>
              <div className="stat-desc">您组织的活动数量</div>
            </div>

            <div className="stat">
              <div className="stat-figure text-secondary">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  className="inline-block h-8 w-8 stroke-current">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M13 10V3L4 14h7v7l9-11h-7z"></path>
                </svg>
              </div>
              <div className="stat-title">参与的活动</div>
              <div className="stat-value text-secondary">{enrolledActivities.length}</div>
              <div className="stat-desc">您报名的活动数量</div>
            </div>

            <div className="stat">
              <div className="stat-figure text-accent">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  className="inline-block h-8 w-8 stroke-current">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4"></path>
                </svg>
              </div>
              <div className="stat-title">活动状态</div>
              <div className="stat-value text-accent">{activeTab === 'published' ? '组织者' : '参与者'}</div>
              <div className="stat-desc">当前查看的角色</div>
            </div>

            <div className="stat">
              <div className="stat-figure text-info">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  className="inline-block h-8 w-8 stroke-current">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
                </svg>
              </div>
              <div className="stat-title">用户</div>
              <div className="stat-value text-info">{currentUser.username}</div>
              <div className="stat-desc">当前登录用户</div>
            </div>
          </div>
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
        onEdit={activeTab === 'published' ? handleEditActivity : undefined}
        onCancelEnrollment={activeTab === 'enrolled' ? handleCancelEnrollment : undefined}
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

      {/* Toast 提示 */}
      {toast && (
        <SimpleToast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
};

export default MyActivities;
