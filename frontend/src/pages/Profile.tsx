import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import userAPI, { User } from '../api/user';
import activityAPI, { Activity } from '../api/activity';
import { Post } from '../api/post';
import { useAuthGuard } from '../hooks/useAuth';
import { useToast } from '../components/Toast';
import Avatar from '../components/Avatar';
import PostCard from '../components/post/PostCard';
import ActivityCard from '../components/activity/ActivityCard';
import PostDetailModal from '../components/post/PostDetailModal';
import ActivityDetailModal from '../components/activity/ActivityDetailModal';
import { PROVINCES, getCitiesByProvince } from '../utils/chinaRegions';

const Profile: React.FC = () => {
  const navigate = useNavigate();
  const { id: viewedId } = useParams<{ id?: string }>();
  const targetUserId = viewedId ? Number(viewedId) : undefined;
  const toast = useToast(); // 添加Toast
  const isLoggedIn = useAuthGuard(); // 使用认证守卫
  const [user, setUser] = useState<User | null>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [userPosts, setUserPosts] = useState<Post[]>([]);
  const [createdActivities, setCreatedActivities] = useState<Activity[]>([]);
  const [enrolledActivities, setEnrolledActivities] = useState<Activity[]>([]);
  const [contentLoading, setContentLoading] = useState({
    posts: false,
    created: false,
    enrolled: false
  });
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [expandCommentOnOpen, setExpandCommentOnOpen] = useState(false);
  const [selectedActivity, setSelectedActivity] = useState<Activity | null>(null);
  const [isFetchingActivityDetail, setIsFetchingActivityDetail] = useState(false);
  const [contentFilter, setContentFilter] = useState<'posts' | 'created' | 'enrolled'>('posts');

  // 表单数据
  const [profileForm, setProfileForm] = useState({
    username: '',
    avatar_url: '',
    province: '',
    city: ''
  });
  const [availableCities, setAvailableCities] = useState<string[]>([]);

  const [passwordForm, setPasswordForm] = useState({
    oldPassword: '',
    newPassword: '',
    confirmNewPassword: ''
  });

  const extractItems = <T,>(response: any): T[] => {
    if (Array.isArray(response)) return response as T[];
    if (response && Array.isArray(response.items)) return response.items as T[];
    return [];
  };

  // 当用户通过认证检查后，加载用户资料
  useEffect(() => {
    if (!isLoggedIn) {
      return; // 如果未登录，useAuthGuard会处理重定向
    }

    const loadUserProfile = async () => {
      try {
        setIsLoading(true);

        // 本地当前用户
        const localUser = userAPI.getCurrentUserFromStorage();
        if (localUser) {
          setCurrentUser(localUser);
        }

        // 拉取当前用户
        let selfUser: User | null = null;
        try {
          selfUser = await userAPI.getCurrentUser();
          setCurrentUser(selfUser);
        } catch (error) {
          if (!localUser) {
            console.error('加载当前用户失败:', error);
            toast.error('获取用户信息失败，请稍后重试');
            return;
          }
        }

        // 目标用户 ID，若未指定则为当前用户
        const resolvedTargetId = targetUserId || selfUser?.id || localUser?.id;
        if (!resolvedTargetId) {
          toast.error('未找到用户信息');
          return;
        }

        // 若查看自己可直接用 selfUser，否则请求目标用户
        if (selfUser && resolvedTargetId === selfUser.id) {
          setUser(selfUser);
          setProfileForm({
            username: selfUser.username,
            avatar_url: selfUser.avatar_url || '',
            province: selfUser.province || '',
            city: selfUser.city || ''
          });
          setAvailableCities(
            selfUser.province ? getCitiesByProvince(selfUser.province) : []
          );
        } else {
          const target = await userAPI.getUserById(resolvedTargetId);
          setUser(target);
          setProfileForm({
            username: target.username,
            avatar_url: target.avatar_url || '',
            province: target.province || '',
            city: target.city || ''
          });
          setAvailableCities(
            target.province ? getCitiesByProvince(target.province) : []
          );
        }
      } catch (error) {
        console.error('加载用户资料时出错:', error);
        const errorMessage = error instanceof Error ? error.message : '获取用户信息失败';
        toast.error('获取用户信息失败: ' + errorMessage);
      } finally {
        setIsLoading(false);
      }
    };

    loadUserProfile();
  }, [isLoggedIn, targetUserId]);

  useEffect(() => {
    if (!user?.id) return;

    const loadUserPosts = async (userId: number) => {
      setContentLoading(prev => ({ ...prev, posts: true }));
      try {
        const response = await userAPI.getUserPosts(userId, 1, 6);
        setUserPosts(extractItems<Post>(response));
      } catch (error) {
        console.error('加载用户帖子时出错:', error);
        toast.error('获取帖子失败');
      } finally {
        setContentLoading(prev => ({ ...prev, posts: false }));
      }
    };

    const loadCreatedActivities = async (userId: number) => {
      setContentLoading(prev => ({ ...prev, created: true }));
      try {
        const response = await userAPI.getUserCreatedActivities(userId, 1, 6);
        setCreatedActivities(extractItems<Activity>(response));
      } catch (error) {
        console.error('加载用户创建的活动时出错:', error);
        toast.error('获取创建的活动失败');
      } finally {
        setContentLoading(prev => ({ ...prev, created: false }));
      }
    };

    const loadEnrolledActivities = async (userId: number) => {
      setContentLoading(prev => ({ ...prev, enrolled: true }));
      try {
        const response = await userAPI.getUserEnrolledActivities(userId, 1, 6);
        setEnrolledActivities(extractItems<Activity>(response));
      } catch (error) {
        console.error('加载用户参与的活动时出错:', error);
        toast.error('获取参与的活动失败');
      } finally {
        setContentLoading(prev => ({ ...prev, enrolled: false }));
      }
    };

    loadUserPosts(user.id);
    loadCreatedActivities(user.id);
    loadEnrolledActivities(user.id);
  }, [user?.id]);

  // 处理个人资料表单变化
  const handleProfileChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    setProfileForm({
      ...profileForm,
      [e.target.name]: e.target.value
    });
  };

  const handleProvinceChange = (provinceValue: string) => {
    const cities = provinceValue ? getCitiesByProvince(provinceValue) : [];
    setAvailableCities(cities);
    setProfileForm(prev => ({
      ...prev,
      province: provinceValue,
      city: cities.includes(prev.city) ? prev.city : ''
    }));
  };

  // 处理密码表单变化
  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPasswordForm({
      ...passwordForm,
      [e.target.name]: e.target.value
    });
  };

  // 保存个人资料（可选同时修改密码）
  const handleSaveProfile = async () => {
    if (!isViewingSelf) {
      toast.error('只能修改自己的资料');
      return;
    }

    const { oldPassword, newPassword, confirmNewPassword } = passwordForm;
    const wantsPasswordChange = oldPassword || newPassword || confirmNewPassword;

    if (wantsPasswordChange) {
      if (!oldPassword || !newPassword || !confirmNewPassword) {
        toast.error('请完整填写当前密码和新密码');
        return;
      }
      if (newPassword !== confirmNewPassword) {
        toast.error('两次输入的新密码不一致');
        return;
      }
    }

    try {
      const updatedUser = await userAPI.updateProfile(profileForm);
      setUser(updatedUser);

      if (wantsPasswordChange) {
        const isValid = await userAPI.verifyToken();
        if (!isValid) {
          toast.error('登录状态已失效，请重新登录');
          return;
        }
        await userAPI.changePassword(passwordForm);
        toast.success('密码修改成功！');
      }

      setPasswordForm({ oldPassword: '', newPassword: '', confirmNewPassword: '' });
      setIsEditing(false);
      toast.success('个人资料更新成功！');
    } catch (error) {
      console.error('保存资料或修改密码失败:', error);
      const errorMessage = error instanceof Error ? error.message : '更新个人资料失败';
      toast.error(errorMessage);
    }
  };

  const handleOpenPostDetail = (post: Post, expandComment?: boolean) => {
    setSelectedPost(post);
    setExpandCommentOnOpen(!!expandComment);
  };

  const handleClosePostDetail = () => {
    setSelectedPost(null);
    setExpandCommentOnOpen(false);
  };

  const handlePostLikeChange = (postId: number, isLiked: boolean) => {
    setUserPosts(prev =>
      prev.map(post =>
        post.id === postId
          ? {
              ...post,
              like_count: Math.max(
                0,
                (post.like_count || 0) + (isLiked ? 1 : -1)
              )
            }
          : post
      )
    );
  };

  const handleOpenActivityDetail = (activity: Activity) => {
    setSelectedActivity(activity);
  };

  const handleViewActivityById = async (activityId: number) => {
    try {
      setIsFetchingActivityDetail(true);
      const detail = await activityAPI.getActivityById(activityId);
      setSelectedActivity(detail);
    } catch (error) {
      console.error('获取活动详情失败:', error);
      toast.error('获取活动详情失败');
    } finally {
      setIsFetchingActivityDetail(false);
    }
  };

  const handleCloseActivityDetail = () => setSelectedActivity(null);

  const contentConfig = {
    posts: {
      items: userPosts,
      loading: contentLoading.posts,
      emptyText: '还没有发布过帖子',
      actionText: '前往社区',
      actionPath: '/community',
      subtitle: '记录你的想法与动态'
    },
    created: {
      items: createdActivities,
      loading: contentLoading.created,
      emptyText: '还没有创建过活动',
      actionText: '管理活动',
      actionPath: '/my-activities',
      subtitle: '回顾你发起的每一次运动号召'
    },
    enrolled: {
      items: enrolledActivities,
      loading: contentLoading.enrolled,
      emptyText: '还没有参加过活动',
      actionText: '去发现更多',
      actionPath: '/activities',
      subtitle: '看看你参与过的精彩活动'
    }
  } as const;

  const currentContent = contentConfig[contentFilter];
  const isViewingSelf = currentUser && user && currentUser.id === user.id;

  const renderContentGrid = () => {
    if (contentFilter === 'posts') {
      const posts = currentContent.items as Post[];
      if (!posts.length) {
        return (
          <div className="rounded-xl border border-dashed border-base-300 bg-base-200/50 p-6 text-center text-base-content/70">
            {currentContent.emptyText}
          </div>
        );
      }

      return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {posts.map((post, index) => (
            <div
              key={post.id}
              className="activity-fade-up"
              style={{ animationDelay: `${index * 80}ms` }}
            >
              <PostCard
                post={post}
                onOpenDetail={handleOpenPostDetail}
                onViewActivity={(activityId) => handleViewActivityById(activityId)}
                onLikeChange={handlePostLikeChange}
              />
            </div>
          ))}
        </div>
      );
    }

    const activities = currentContent.items as Activity[];
    if (!activities.length) {
      return (
        <div className="rounded-xl border border-dashed border-base-300 bg-base-200/50 p-6 text-center text-base-content/70">
          {currentContent.emptyText}
        </div>
      );
    }

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {activities.map((activity, index) => (
          <div
            key={activity.id}
            className="activity-fade-up"
            style={{ animationDelay: `${index * 80}ms` }}
          >
            <ActivityCard
              activity={activity}
              onViewDetail={handleOpenActivityDetail}
              showActions={false}
              isOwner={contentFilter === 'created'}
            />
          </div>
        ))}
      </div>
    );
  };

  if (isLoading || !isLoggedIn) {
    return (
      <div className="min-h-screen bg-pattern-overlay flex items-center justify-center">
        <div className="loading loading-spinner loading-lg"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-pattern-overlay flex items-center justify-center">
        <div className="text-center space-y-3">
          <p className="text-xl font-semibold">未找到用户信息</p>
          <button onClick={() => navigate('/login')} className="btn btn-primary btn-sm">
            返回登录
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-pattern-overlay pt-32 pb-12">
      <div className="container mx-auto px-4 max-w-6xl space-y-8">
        {/* 顶部身份卡片 */}
        <div className="bg-base-100/80 backdrop-blur-sm border border-base-200 shadow-xl rounded-3xl p-6 md:p-8 flex flex-col gap-6">
          <div className="flex flex-col md:flex-row gap-6 md:items-center">
            <div className="flex items-center gap-4">
              <Avatar username={user.username} avatarUrl={user.avatar_url} size="large" />
              <div className="space-y-1">
                <div className="flex items-center gap-3">
                  <span className="text-2xl font-bold">{user.username}</span>
                  <span className="badge badge-outline">{user.role === 'admin' ? '管理员' : '用户'}</span>
                </div>
                <p className="text-base-content/70 text-sm">{user.email}</p>
                <div className="text-sm text-base-content/60 flex flex-wrap gap-3">
                  <span>注册: {user.created_at ? new Date(user.created_at).toLocaleDateString('zh-CN') : '未知'}</span>
                  <span>地区: {user.province || '未设置'} {user.city || ''}</span>
                </div>
              </div>
            </div>

            {isViewingSelf && (
              <div className="md:ml-auto">
                <button
                  className="btn btn-sm btn-outline"
                  onClick={() => setIsEditing((v) => !v)}
                >
                  修改个人信息
                </button>
              </div>
            )}
          </div>

          {isEditing && isViewingSelf && (
            <div className="rounded-2xl border border-base-200/60 bg-base-100/60 p-4 md:p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 items-start">
                <div className="form-control">
                  <label className="label"><span className="label-text text-sm font-semibold">用户名</span></label>
                  <input
                    type="text"
                    name="username"
                    value={profileForm.username}
                    onChange={handleProfileChange}
                    className="input input-bordered w-full"
                    placeholder="请输入用户名"
                  />
                </div>
                <div className="form-control">
                  <label className="label"><span className="label-text text-sm font-semibold">头像 URL</span></label>
                  <input
                    type="url"
                    name="avatar_url"
                    value={profileForm.avatar_url}
                    onChange={handleProfileChange}
                    className="input input-bordered w-full"
                    placeholder="请输入头像 URL"
                  />
                </div>
                <div className="form-control">
                  <label className="label"><span className="label-text text-sm font-semibold">所在省份</span></label>
                  <select
                    name="province"
                    className="select select-bordered w-full"
                    value={profileForm.province}
                    onChange={(e) => handleProvinceChange(e.target.value)}
                  >
                    <option value="">未设置</option>
                    {PROVINCES.map((province) => (
                      <option key={province.name} value={province.name}>{province.name}</option>
                    ))}
                  </select>
                </div>
                <div className="form-control">
                  <label className="label"><span className="label-text text-sm font-semibold">所在城市</span></label>
                  <select
                    name="city"
                    className="select select-bordered w-full"
                    value={profileForm.city}
                    onChange={handleProfileChange}
                    disabled={!profileForm.province}
                  >
                    <option value="">未设置</option>
                    {availableCities.map((city) => (
                      <option key={city} value={city}>{city}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="h-px bg-base-200"></div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
                <div className="md:col-span-3 flex items-center justify-between">
                  <span className="text-sm font-semibold text-base-content/80">修改密码（可选）</span>
                  <span className="text-xs text-base-content/60">留空则不修改密码</span>
                </div>
                <div className="form-control">
                  <label className="label"><span className="label-text">当前密码</span></label>
                  <input
                    type="password"
                    name="oldPassword"
                    value={passwordForm.oldPassword}
                    onChange={handlePasswordChange}
                    className="input input-bordered"
                    placeholder="如不修改可留空"
                  />
                </div>
                <div className="form-control">
                  <label className="label"><span className="label-text">新密码</span></label>
                  <input
                    type="password"
                    name="newPassword"
                    value={passwordForm.newPassword}
                    onChange={handlePasswordChange}
                    className="input input-bordered"
                    minLength={6}
                    placeholder="至少 6 位"
                  />
                </div>
                <div className="form-control">
                  <label className="label"><span className="label-text">确认新密码</span></label>
                  <input
                    type="password"
                    name="confirmNewPassword"
                    value={passwordForm.confirmNewPassword}
                    onChange={handlePasswordChange}
                    className="input input-bordered"
                    placeholder="再次输入新密码"
                  />
                </div>
                <div className="md:col-span-3 flex flex-wrap justify-end gap-3">
                  <button onClick={handleSaveProfile} className="btn btn-primary">保存修改</button>
                  <button
                    onClick={() => {
                      setIsEditing(false);
                      setProfileForm({
                        username: user.username,
                        avatar_url: user.avatar_url || '',
                        province: user.province || '',
                        city: user.city || ''
                      });
                      setAvailableCities(user.province ? getCitiesByProvince(user.province) : []);
                      setPasswordForm({ oldPassword: '', newPassword: '', confirmNewPassword: '' });
                    }}
                    className="btn btn-ghost"
                  >
                    取消
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* 内容选择 & 列表 */}
        <div className="space-y-6">
          <div className="flex justify-center">
            <div className="bg-base-100/40 backdrop-blur-sm border border-base-200/30 rounded-full px-2 py-2 flex flex-wrap items-center gap-2">
              {(['posts','created','enrolled'] as const).map((key) => (
                <button
                  key={key}
                  className={`btn btn-sm rounded-full ${contentFilter === key ? 'btn-primary' : 'btn-ghost'}`}
                  onClick={() => setContentFilter(key)}
                >
                  {key === 'posts' && '帖子'}
                  {key === 'created' && '创建的活动'}
                  {key === 'enrolled' && '参与的活动'}
                </button>
              ))}
            </div>
          </div>

          <div className="relative min-h-[200px]">
            {currentContent.loading && (
              <div className="absolute inset-0 z-10 flex items-center justify-center bg-base-100/70 backdrop-blur-sm">
                <span className="loading loading-spinner loading-lg"></span>
              </div>
            )}
            <div key={contentFilter}>
              {renderContentGrid()}
            </div>
          </div>
        </div>
      </div>

      <PostDetailModal
        post={selectedPost}
        isOpen={!!selectedPost}
        onClose={handleClosePostDetail}
        expandCommentOnOpen={expandCommentOnOpen}
        onLikeChange={handlePostLikeChange}
        onViewActivity={handleViewActivityById}
      />
      <ActivityDetailModal
        activity={selectedActivity}
        isOpen={!!selectedActivity}
        onClose={handleCloseActivityDetail}
      />
      {isFetchingActivityDetail && (
        <div className="fixed inset-0 z-30 flex items-center justify-center bg-base-100/60">
          <span className="loading loading-spinner loading-lg"></span>
        </div>
      )}
    </div>
  );
};

export default Profile;
