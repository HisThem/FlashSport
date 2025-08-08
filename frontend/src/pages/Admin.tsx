import React, { useState, useEffect } from 'react';
import PageLayout from '../components/PageLayout';
import { useToast } from '../components/Toast';
import ActivityFormModal from '../components/activity/ActivityFormModal';
import activityAPI, { Activity, ActivityStatus, GetActivitiesRequest, Category } from '../api/activity';
import { useCurrentUser } from '../hooks/useAuth';

const Admin: React.FC = () => {
  const { user: currentUser } = useCurrentUser();
  const toast = useToast();
  const [activities, setActivities] = useState<Activity[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  
  // 分页和筛选状态
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filters, setFilters] = useState<GetActivitiesRequest>({
    page: 1,
    limit: 10,
    sort: 'newest'
  });

  // 模态框状态
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingActivity, setEditingActivity] = useState<Activity | null>(null);

  // 检查管理员权限
  useEffect(() => {
    if (!currentUser || currentUser.role !== 'admin') {
      window.location.href = '/';
      return;
    }
  }, [currentUser]);

  // 获取活动列表
  const fetchActivities = async () => {
    try {
      setLoading(true);
      const response = await activityAPI.getAllActivitiesForAdmin(filters);
      setActivities(response.items);
      setTotalPages(response.totalPages);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : '获取活动列表失败');
    } finally {
      setLoading(false);
    }
  };

  // 获取分类列表
  const fetchCategories = async () => {
    try {
      const response = await activityAPI.getCategories();
      setCategories(response);
    } catch (error) {
      console.error('获取分类失败:', error);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    fetchActivities();
  }, [filters]);

  // 处理筛选变化
  const handleFilterChange = (newFilters: Partial<GetActivitiesRequest>) => {
    setFilters(prev => ({
      ...prev,
      ...newFilters,
      page: 1
    }));
    setCurrentPage(1);
  };

  // 处理分页变化
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    setFilters(prev => ({ ...prev, page }));
  };

  // 编辑活动
  const handleEditActivity = (activity: Activity) => {
    setEditingActivity(activity);
    setShowEditModal(true);
  };

  // 删除活动
  const handleDeleteActivity = async (id: number) => {
    if (!confirm('确定要删除这个活动吗？此操作不可撤销。')) {
      return;
    }

    try {
      await activityAPI.deleteActivityAsAdmin(id);
      toast.success('活动删除成功');
      fetchActivities();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : '删除活动失败');
    }
  };

  // 取消活动
  const handleCancelActivity = async (id: number) => {
    if (!confirm('确定要取消这个活动吗？')) {
      return;
    }

    try {
      await activityAPI.cancelActivityAsAdmin(id);
      toast.success('活动已取消');
      fetchActivities();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : '取消活动失败');
    }
  };

  // 更新活动状态
  const handleStatusChange = async (id: number, status: ActivityStatus) => {
    try {
      await activityAPI.updateActivityStatusAsAdmin(id, status);
      toast.success('活动状态更新成功');
      fetchActivities();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : '更新活动状态失败');
    }
  };

  // 处理编辑成功
  const handleEditSuccess = () => {
    toast.success('活动更新成功');
    setShowEditModal(false);
    setEditingActivity(null);
    fetchActivities();
  };

  // 获取状态显示文本
  const getStatusText = (status: ActivityStatus) => {
    const statusMap = {
      [ActivityStatus.PREPARING]: '筹备中',
      [ActivityStatus.RECRUITING]: '报名中',
      [ActivityStatus.REGISTRATION_CLOSED]: '报名已截止',
      [ActivityStatus.ONGOING]: '进行中',
      [ActivityStatus.FINISHED]: '已结束',
      [ActivityStatus.CANCELLED]: '已取消'
    };
    return statusMap[status] || status;
  };

  // 获取状态样式
  const getStatusStyle = (status: ActivityStatus) => {
    switch (status) {
      case ActivityStatus.PREPARING:
        return 'badge-info';
      case ActivityStatus.RECRUITING:
        return 'badge-success';
      case ActivityStatus.REGISTRATION_CLOSED:
        return 'badge-warning';
      case ActivityStatus.ONGOING:
        return 'badge-primary';
      case ActivityStatus.FINISHED:
        return 'badge-neutral';
      case ActivityStatus.CANCELLED:
        return 'badge-error';
      default:
        return 'badge-ghost';
    }
  };

  if (!currentUser || currentUser.role !== 'admin') {
    return <div>无权限访问</div>;
  }

  return (
    <PageLayout>
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">活动管理</h1>
        </div>

        {/* 筛选器 */}
        <div className="bg-base-100 p-4 rounded-lg shadow mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* 搜索 */}
            <div className="form-control">
              <label className="label">
                <span className="label-text">搜索活动</span>
              </label>
              <input
                type="text"
                className="input input-bordered"
                placeholder="输入关键词..."
                value={filters.keyword || ''}
                onChange={(e) => handleFilterChange({ keyword: e.target.value })}
              />
            </div>

            {/* 分类筛选 */}
            <div className="form-control">
              <label className="label">
                <span className="label-text">分类</span>
              </label>
              <select
                className="select select-bordered"
                value={filters.category_id || ''}
                onChange={(e) => handleFilterChange({ 
                  category_id: e.target.value ? parseInt(e.target.value) : undefined 
                })}
              >
                <option value="">全部分类</option>
                {categories.map(category => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>

            {/* 状态筛选 */}
            <div className="form-control">
              <label className="label">
                <span className="label-text">状态</span>
              </label>
              <select
                className="select select-bordered"
                value={filters.status || ''}
                onChange={(e) => handleFilterChange({ 
                  status: e.target.value as ActivityStatus || undefined 
                })}
              >
                <option value="">全部状态</option>
                <option value={ActivityStatus.PREPARING}>筹备中</option>
                <option value={ActivityStatus.RECRUITING}>报名中</option>
                <option value={ActivityStatus.REGISTRATION_CLOSED}>报名已截止</option>
                <option value={ActivityStatus.ONGOING}>进行中</option>
                <option value={ActivityStatus.FINISHED}>已结束</option>
                <option value={ActivityStatus.CANCELLED}>已取消</option>
              </select>
            </div>

            {/* 排序 */}
            <div className="form-control">
              <label className="label">
                <span className="label-text">排序</span>
              </label>
              <select
                className="select select-bordered"
                value={filters.sort || 'newest'}
                onChange={(e) => handleFilterChange({ 
                  sort: e.target.value as 'newest' | 'oldest' | 'start_time' | 'participants'
                })}
              >
                <option value="newest">最新发布</option>
                <option value="oldest">最早发布</option>
                <option value="start_time">按开始时间</option>
                <option value="participants">按参与人数</option>
              </select>
            </div>
          </div>
        </div>

        {/* 活动列表 */}
        {loading ? (
          <div className="flex justify-center py-8">
            <span className="loading loading-spinner loading-lg"></span>
          </div>
        ) : (
          <div className="bg-base-100 rounded-lg shadow overflow-hidden">
            <div className="overflow-x-auto">
              <table className="table table-zebra w-full">
                <thead>
                  <tr>
                    <th>活动名称</th>
                    <th>组织者</th>
                    <th>分类</th>
                    <th>状态</th>
                    <th>开始时间</th>
                    <th>参与人数</th>
                    <th>操作</th>
                  </tr>
                </thead>
                <tbody>
                  {activities.map(activity => (
                    <tr key={activity.id}>
                      <td>
                        <div className="flex items-center space-x-3">
                          {activity.cover_image_url && (
                            <div className="avatar">
                              <div className="mask mask-squircle w-12 h-12">
                                <img src={activity.cover_image_url} alt={activity.name} />
                              </div>
                            </div>
                          )}
                          <div>
                            <div className="font-bold">{activity.name}</div>
                            <div className="text-sm opacity-50">{activity.location}</div>
                          </div>
                        </div>
                      </td>
                      <td>
                        <div className="flex items-center space-x-2">
                          {activity.organizer?.avatar_url && (
                            <div className="avatar">
                              <div className="w-8 h-8 rounded-full">
                                <img src={activity.organizer.avatar_url} alt={activity.organizer.username} />
                              </div>
                            </div>
                          )}
                          <span>{activity.organizer?.username}</span>
                        </div>
                      </td>
                      <td>{activity.category?.name}</td>
                      <td>
                        <div className="dropdown dropdown-end">
                          <label tabIndex={0} className={`badge cursor-pointer ${getStatusStyle(activity.status)}`}>
                            {getStatusText(activity.status)}
                          </label>
                          <ul tabIndex={0} className="dropdown-content menu p-2 shadow bg-base-100 rounded-box w-52">
                            {Object.values(ActivityStatus).map(status => (
                              <li key={status}>
                                <a onClick={() => handleStatusChange(activity.id, status)}>
                                  {getStatusText(status)}
                                </a>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </td>
                      <td>{new Date(activity.start_time).toLocaleString()}</td>
                      <td>
                        {activity.enrollment_count || 0} / {activity.max_participants}
                      </td>
                      <td>
                        <div className="flex space-x-2">
                          <button
                            className="btn btn-sm btn-primary"
                            onClick={() => handleEditActivity(activity)}
                          >
                            编辑
                          </button>
                          {activity.status !== ActivityStatus.FINISHED && (
                            <button
                              className="btn btn-sm btn-warning"
                              onClick={() => handleCancelActivity(activity.id)}
                            >
                              取消
                            </button>
                          )}
                          <button
                            className="btn btn-sm btn-error"
                            onClick={() => handleDeleteActivity(activity.id)}
                          >
                            删除
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* 分页 */}
            {totalPages > 1 && (
              <div className="flex justify-center py-4">
                <div className="join">
                  <button
                    className="join-item btn"
                    disabled={currentPage === 1}
                    onClick={() => handlePageChange(currentPage - 1)}
                  >
                    «
                  </button>
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                    <button
                      key={page}
                      className={`join-item btn ${currentPage === page ? 'btn-active' : ''}`}
                      onClick={() => handlePageChange(page)}
                    >
                      {page}
                    </button>
                  ))}
                  <button
                    className="join-item btn"
                    disabled={currentPage === totalPages}
                    onClick={() => handlePageChange(currentPage + 1)}
                  >
                    »
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* 编辑活动模态框 */}
        {showEditModal && editingActivity && (
          <ActivityFormModal
            isOpen={showEditModal}
            activity={editingActivity}
            isAdminMode={true}
            onClose={() => {
              setShowEditModal(false);
              setEditingActivity(null);
            }}
            onSuccess={handleEditSuccess}
          />
        )}
      </div>
    </PageLayout>
  );
};

export default Admin;
