import React, { useState, useEffect } from 'react';
import { Activity, Category, GetActivitiesRequest } from '../api/activity';
import activityAPI from '../api/activity';
import userAPI from '../api/user';
import ActivityCard from '../components/activity/ActivityCard';
import ActivityDetailModal from '../components/activity/ActivityDetailModal';
import { useToast } from '../components/Toast';
import { enrichActivitiesWithEnrollmentStatus } from '../utils/activity';

const Activities: React.FC = () => {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [activitiesLoading, setActivitiesLoading] = useState(false);
  const [selectedActivity, setSelectedActivity] = useState<Activity | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const toast = useToast();
  const [currentUser] = useState(userAPI.getCurrentUserFromStorage());
  
  // 搜索和筛选状态
  const [searchParams, setSearchParams] = useState<GetActivitiesRequest>({
    page: 1,
    limit: 12,
    category_id: undefined,
    keyword: '',
    status: undefined,
    sort: 'newest'
  });
  
  const [totalPages, setTotalPages] = useState(1);
  const [searchKeyword, setSearchKeyword] = useState('');

  useEffect(() => {
    loadCategories();
    loadActivities(true); // 首次加载
  }, []);

  // 监听搜索参数变化，但不包括首次加载
  useEffect(() => {
    if (!loading) { // 跳过首次加载
      loadActivities(false); // 后续加载不显示全局loading
    }
  }, [searchParams]);

  const loadCategories = async () => {
    try {
      const categoriesData = await activityAPI.getCategories();
      setCategories(categoriesData);
    } catch (error) {
      console.error('加载分类失败:', error);
      toast.error('加载分类失败');
    }
  };

  const loadActivities = async (isInitialLoad = false) => {
    if (isInitialLoad) {
      setLoading(true);
    } else {
      setActivitiesLoading(true);
    }
    
    try {
      const response = await activityAPI.getActivities(searchParams);
      // 为活动列表添加报名状态信息
      const enrichedActivities = enrichActivitiesWithEnrollmentStatus(response.items);
      setActivities(enrichedActivities);
      setTotalPages(response.totalPages);
    } catch (error) {
      console.error('加载活动失败:', error);
      toast.error('加载活动失败');
    } finally {
      if (isInitialLoad) {
        setLoading(false);
      } else {
        setActivitiesLoading(false);
      }
    }
  };

  const handleCategoryFilter = (categoryId?: number) => {
    setSearchParams(prev => ({
      ...prev,
      category_id: categoryId,
      page: 1
    }));
  };

  const handleSearch = () => {
    setSearchParams(prev => ({
      ...prev,
      keyword: searchKeyword,
      page: 1
    }));
  };

  // 添加防抖搜索
  const handleSearchInputChange = (value: string) => {
    setSearchKeyword(value);
    // 如果输入为空，立即搜索
    if (value === '') {
      setSearchParams(prev => ({
        ...prev,
        keyword: '',
        page: 1
      }));
    }
  };

  const handleSortChange = (sort: string) => {
    setSearchParams(prev => ({
      ...prev,
      sort: sort as any,
      page: 1
    }));
  };

  const handlePageChange = (page: number) => {
    setSearchParams(prev => ({ ...prev, page }));
  };

  const handleViewDetail = (activity: Activity) => {
    setSelectedActivity(activity);
    setIsDetailModalOpen(true);
  };

  const updateActivityData = async (activityId: number) => {
    try {
      const updatedActivity = await activityAPI.getActivityById(activityId);
      const enrichedActivities = await enrichActivitiesWithEnrollmentStatus([updatedActivity]);
      const enrichedActivity = enrichedActivities[0];
      
      setActivities(prevActivities => 
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

  const handleEnroll = async (activityId: number) => {
    if (!currentUser) {
      toast.error('请先登录');
      return;
    }

    try {
      await activityAPI.enrollActivity(activityId);
      await updateActivityData(activityId);
      toast.success('报名成功');
    } catch (error: any) {
      toast.error(error.message || '报名失败');
    }
  };

  const handleCancelEnrollment = async (activityId: number) => {
    try {
      await activityAPI.cancelEnrollment(activityId);
      await updateActivityData(activityId);
      toast.success('取消报名成功');
    } catch (error: any) {
      toast.error(error.message || '取消报名失败');
    }
  };

  return (
    <div className="min-h-screen bg-pattern-overlay pt-20">
      <div className="container mx-auto px-4 py-8">
        {/* 页面标题 */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-primary mb-4">
            活动项目
          </h1>
          <p className="text-lg text-base-content/80 max-w-2xl mx-auto">
            探索丰富多彩的体育活动，找到最适合您的运动项目，享受运动带来的乐趣！
          </p>
        </div>

        {/* 搜索和筛选区域 */}
        <div className="mb-8 space-y-4">
          {/* 搜索框 */}
          <div className="flex gap-2 max-w-md mx-auto">
            <input
              type="text"
              placeholder="搜索活动名称或描述..."
              className="input input-bordered flex-1"
              value={searchKeyword}
              onChange={(e) => handleSearchInputChange(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
            />
            <button 
              className="btn btn-primary"
              onClick={handleSearch}
              disabled={activitiesLoading}
            >
              搜索
            </button>
          </div>

          {/* 分类筛选 */}
          <div className="flex flex-wrap justify-center gap-2">
            <button 
              className={`btn btn-sm ${!searchParams.category_id ? 'btn-primary' : 'btn-outline'}`}
              onClick={() => handleCategoryFilter(undefined)}
              disabled={activitiesLoading}
            >
              全部活动
            </button>
            {categories.map(category => (
              <button
                key={category.id}
                className={`btn btn-sm ${searchParams.category_id === category.id ? 'btn-primary' : 'btn-outline'}`}
                onClick={() => handleCategoryFilter(category.id)}
                disabled={activitiesLoading}
              >
                {category.name}
              </button>
            ))}
          </div>

          {/* 排序 */}
          <div className="flex justify-start items-center">
            <select
              className="select select-bordered select-sm"
              value={searchParams.sort}
              onChange={(e) => handleSortChange(e.target.value)}
              disabled={activitiesLoading}
            >
              <option value="newest">最新发布</option>
              <option value="oldest">最早发布</option>
              <option value="start_time">按开始时间</option>
              <option value="participants">按参与人数</option>
            </select>
          </div>
        </div>

        {/* 活动列表 */}
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <div className="loading loading-spinner loading-lg"></div>
          </div>
        ) : (
          <div className="relative">
            {/* 局部加载遮罩 */}
            {activitiesLoading && (
              <div className="absolute inset-0 bg-base-100/50 backdrop-blur-sm z-10 flex items-center justify-center">
                <div className="loading loading-spinner loading-lg"></div>
              </div>
            )}
            
            {activities.length > 0 ? (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                  {activities.map(activity => (
                    <ActivityCard
                      key={activity.id}
                      activity={activity}
                      onViewDetail={handleViewDetail}
                      onEnroll={handleEnroll}
                      onCancelEnrollment={handleCancelEnrollment}
                      isOwner={currentUser?.id === activity.organizer_id}
                    />
                  ))}
                </div>

                {/* 分页 */}
                {totalPages > 1 && (
                  <div className="flex justify-center">
                    <div className="join">
                      <button 
                        className="join-item btn"
                        disabled={searchParams.page === 1 || activitiesLoading}
                        onClick={() => handlePageChange((searchParams.page || 1) - 1)}
                      >
                        «
                      </button>
                      
                      {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                        const page = i + 1;
                        return (
                          <button
                            key={page}
                            className={`join-item btn ${searchParams.page === page ? 'btn-active' : ''}`}
                            disabled={activitiesLoading}
                            onClick={() => handlePageChange(page)}
                          >
                            {page}
                          </button>
                        );
                      })}
                      
                      <button 
                        className="join-item btn"
                        disabled={searchParams.page === totalPages || activitiesLoading}
                        onClick={() => handlePageChange((searchParams.page || 1) + 1)}
                      >
                        »
                      </button>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-12">
                <div className="text-6xl mb-4">🏃‍♂️</div>
                <h3 className="text-xl font-semibold text-base-content/80 mb-2">
                  暂无活动
                </h3>
                <p className="text-base-content/60 mb-4">
                  {searchParams.keyword || searchParams.category_id 
                    ? '没有找到符合条件的活动' 
                    : '目前还没有发布任何活动'}
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* 活动详情弹窗 */}
      <ActivityDetailModal
        isOpen={isDetailModalOpen}
        activity={selectedActivity}
        onClose={() => {
          setIsDetailModalOpen(false);
          setSelectedActivity(null);
        }}
        onEnroll={handleEnroll}
        onCancelEnrollment={handleCancelEnrollment}
      />

    </div>
  );
};

export default Activities;
