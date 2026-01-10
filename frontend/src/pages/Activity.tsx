import React, { useState, useEffect } from 'react';
import { Activity, Category, GetActivitiesRequest } from '../api/activity';
import activityAPI from '../api/activity';
import userAPI from '../api/user';
import ActivityCard from '../components/activity/ActivityCard';
import ActivityCardSkeleton from '../components/activity/ActivityCardSkeleton';
import ActivityDetailModal from '../components/activity/ActivityDetailModal';
import ActivityFormModal from '../components/activity/ActivityFormModal';
import FloatingActionButton from '../components/FloatingActionButton';
import { useToast } from '../components/Toast';
import { enrichActivitiesWithEnrollmentStatus } from '../utils/activity';
import { PROVINCES, getCitiesByProvince } from '../utils/chinaRegions';

const Activities: React.FC = () => {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [activitiesLoading, setActivitiesLoading] = useState(false);
  const [selectedActivity, setSelectedActivity] = useState<Activity | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isActivityFormOpen, setIsActivityFormOpen] = useState(false);
  const toast = useToast();
  const [currentUser] = useState(userAPI.getCurrentUserFromStorage());
  const defaultProvince = currentUser?.province || undefined;
  const defaultCity = defaultProvince && currentUser?.city
    && getCitiesByProvince(defaultProvince).includes(currentUser.city)
    ? currentUser.city
    : undefined;
  
  // 搜索和筛选状态
  const [searchParams, setSearchParams] = useState<GetActivitiesRequest>({
    page: 1,
    limit: 12,
    category_id: undefined,
    keyword: '',
    status: undefined,
    sort: 'newest',
    province: defaultProvince,
    city: defaultCity,
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
      // 为活动列表添加报名状态信息，并在前端进行排序
      const enrichedActivities = enrichActivitiesWithEnrollmentStatus(response.items);

      const statusPriority: Record<string, number> = {
        [ 'recruiting' ]: 0,
        [ 'registration_closed' ]: 1,
        [ 'ongoing' ]: 2,
        [ 'finished' ]: 3,
        [ 'cancelled' ]: 4,
      };

      const sortedActivities = [...enrichedActivities].sort((a, b) => {
        const sa = statusPriority[a.status] ?? 99;
        const sb = statusPriority[b.status] ?? 99;
        if (sa !== sb) return sa - sb;

        switch (searchParams.sort) {
          case 'start_time':
            return new Date(a.start_time).getTime() - new Date(b.start_time).getTime();
          case 'participants':
            return (b.enrollment_count || 0) - (a.enrollment_count || 0);
          case 'newest':
          default:
            return new Date(b.created_at || b.start_time).getTime() - new Date(a.created_at || a.start_time).getTime();
        }
      });

      setActivities(sortedActivities);
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

  const handleProvinceChange = (provinceValue: string) => {
    const province = provinceValue || undefined;
    setSearchParams(prev => ({
      ...prev,
      province,
      city: undefined,
      page: 1,
    }));
  };

  const handleCityChange = (cityValue: string) => {
    const city = cityValue || undefined;
    setSearchParams(prev => ({
      ...prev,
      city,
      page: 1,
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
      throw error; // Re-throw for optimistic update rollback
    }
  };

  const handleCancelEnrollment = async (activityId: number) => {
    try {
      await activityAPI.cancelEnrollment(activityId);
      await updateActivityData(activityId);
      toast.success('取消报名成功');
    } catch (error: any) {
      toast.error(error.message || '取消报名失败');
      throw error; // Re-throw for optimistic update rollback
    }
  };

  return (
    <div className="min-h-screen bg-pattern-overlay pt-20">
      <div className="container mx-auto px-4 py-8">
        {/* 页面标题 */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-primary mb-4">
            活动广场
          </h1>
        </div>

        {/* 搜索和筛选区域 */}
        <div className="mb-8">
          {/* 分类筛选 */}
          <div className="flex justify-center mb-6">
            <div className="bg-base-100/40 backdrop-blur-sm border border-base-200/30 rounded-full px-2 py-2 flex flex-wrap items-center gap-2">
              <button 
                className={`btn btn-sm rounded-full ${!searchParams.category_id ? 'btn-primary' : 'btn-outline'}`}
                onClick={() => handleCategoryFilter(undefined)}
                disabled={activitiesLoading}
              >
                全部活动
              </button>
              {categories.map(category => (
                <button
                  key={category.id}
                  className={`btn btn-sm rounded-full ${searchParams.category_id === category.id ? 'btn-primary' : 'btn-outline'}`}
                  onClick={() => handleCategoryFilter(category.id)}
                  disabled={activitiesLoading}
                >
                  {category.name}
                </button>
              ))}
            </div>
          </div>

          {/* 筛选和搜索 - 左排序+省市，右搜索框 */}
          <div className="flex gap-3 mb-6 items-center justify-between">
            {/* 左侧：排序和省市筛选 */}
            <div className="flex gap-3 items-center">
              <select
                className="select select-bordered select-sm w-36"
                value={searchParams.sort}
                onChange={(e) => handleSortChange(e.target.value)}
                disabled={activitiesLoading}
              >
                <option value="newest">最新发布</option>
                <option value="start_time">最早开始</option>
                <option value="participants">报名热度</option>
              </select>
              <select
                className="select select-bordered select-sm w-36"
                value={searchParams.province || ''}
                onChange={(e) => handleProvinceChange(e.target.value)}
                disabled={activitiesLoading}
              >
                <option value="">全部省份</option>
                {PROVINCES.map(p => (
                  <option key={p.name} value={p.name}>{p.name}</option>
                ))}
              </select>
              <select
                className="select select-bordered select-sm w-36"
                value={searchParams.city || ''}
                onChange={(e) => handleCityChange(e.target.value)}
                disabled={activitiesLoading}
              >
                <option value="">全部城市</option>
                {(searchParams.province ? getCitiesByProvince(searchParams.province) : []).map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            {/* 右侧：搜索框 */}
            <div className="flex gap-2 items-center">
              <input
                type="text"
                placeholder="搜索活动名称或描述..."
                className="input input-bordered input-sm w-48"
                value={searchKeyword}
                onChange={(e) => handleSearchInputChange(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              />
              <button 
                className="btn btn-primary btn-sm"
                onClick={handleSearch}
                disabled={activitiesLoading}
              >
                搜索
              </button>
            </div>
          </div>
        </div>
        

        {/* 活动列表 */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            {Array.from({ length: 6 }).map((_, index) => (
              <div key={index}>
                <ActivityCardSkeleton />
              </div>
            ))}
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
                  {activities.map((activity, index) => (
                    <div
                      key={activity.id}
                      className="activity-fade-up"
                      style={{ animationDelay: `${index * 80}ms` }}
                    >
                      <ActivityCard
                        activity={activity}
                        onViewDetail={handleViewDetail}
                        onEnroll={handleEnroll}
                        onCancelEnrollment={handleCancelEnrollment}
                        isOwner={currentUser?.id === activity.organizer_id}
                      />
                    </div>
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

      {/* 发布活动表单Modal */}
      <ActivityFormModal
        isOpen={isActivityFormOpen}
        activity={null}
        onClose={() => setIsActivityFormOpen(false)}
        onSuccess={() => {
          setIsActivityFormOpen(false);
          toast.success('活动发布成功');
          loadActivities(false);
        }}
      />

      {/* 悬浮发布按钮 */}
      {currentUser && (
        <FloatingActionButton
          onClick={() => setIsActivityFormOpen(true)}
          label="发布活动"
        />
      )}

    </div>
  );
};

export default Activities;
