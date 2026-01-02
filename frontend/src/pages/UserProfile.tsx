import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import userAPI, { User } from '../api/user';
import Avatar from '../components/Avatar';
import PostCard from '../components/PostCard';
import ActivityCard from '../components/activity/ActivityCard';
import { useToast } from '../components/Toast';

type TabType = 'posts' | 'created' | 'enrolled';

const UserProfile: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const currentUser = userAPI.getCurrentUserFromStorage();

  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>('posts');

  // Data states
  const [posts, setPosts] = useState<any[]>([]);
  const [createdActivities, setCreatedActivities] = useState<any[]>([]);
  const [enrolledActivities, setEnrolledActivities] = useState<any[]>([]);

  // Pagination states
  const [postsPage, setPostsPage] = useState(1);
  const [createdPage, setCreatedPage] = useState(1);
  const [enrolledPage, setEnrolledPage] = useState(1);

  // Loading more states
  const [postsHasMore, setPostsHasMore] = useState(false);
  const [createdHasMore, setCreatedHasMore] = useState(false);
  const [enrolledHasMore, setEnrolledHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);

  const userId = Number(id);
  const isOwnProfile = currentUser?.id === userId;

  // Load user info
  useEffect(() => {
    loadUserInfo();
  }, [id]);

  // Load tab data when tab changes or user is loaded
  useEffect(() => {
    if (user) {
      loadTabData();
    }
  }, [activeTab, user]);

  const loadUserInfo = async () => {
    if (!id || isNaN(userId)) {
      setError('无效的用户ID');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const userData = await userAPI.getUserById(userId);
      setUser(userData);
      setError(null);
    } catch (err) {
      console.error('Failed to load user info:', err);
      setError(err instanceof Error ? err.message : '用户不存在');
      showToast(err instanceof Error ? err.message : '加载用户资料失败', 'error');
    } finally {
      setLoading(false);
    }
  };

  const loadTabData = async () => {
    if (!user) return;

    try {
      setLoadingMore(false);
      if (activeTab === 'posts') {
        await loadPosts(1);
      } else if (activeTab === 'created') {
        await loadCreatedActivities(1);
      } else if (activeTab === 'enrolled') {
        await loadEnrolledActivities(1);
      }
    } catch (err) {
      console.error('Failed to load tab data:', err);
      showToast('加载数据失败', 'error');
    }
  };

  const loadPosts = async (page: number) => {
    try {
      const data = await userAPI.getUserPosts(userId, page, 10);
      if (page === 1) {
        setPosts(data.items || []);
      } else {
        setPosts(prev => [...prev, ...(data.items || [])]);
      }
      setPostsPage(page);
      setPostsHasMore(page < (data.totalPages || 0));
    } catch (err) {
      console.error('Failed to load posts:', err);
    }
  };

  const loadCreatedActivities = async (page: number) => {
    try {
      const data = await userAPI.getUserCreatedActivities(userId, page, 10);
      if (page === 1) {
        setCreatedActivities(data.items || []);
      } else {
        setCreatedActivities(prev => [...prev, ...(data.items || [])]);
      }
      setCreatedPage(page);
      setCreatedHasMore(page < (data.totalPages || 0));
    } catch (err) {
      console.error('Failed to load created activities:', err);
    }
  };

  const loadEnrolledActivities = async (page: number) => {
    try {
      const data = await userAPI.getUserEnrolledActivities(userId, page, 10);
      if (page === 1) {
        setEnrolledActivities(data.items || []);
      } else {
        setEnrolledActivities(prev => [...prev, ...(data.items || [])]);
      }
      setEnrolledPage(page);
      setEnrolledHasMore(page < (data.totalPages || 0));
    } catch (err) {
      console.error('Failed to load enrolled activities:', err);
    }
  };

  const loadMore = async () => {
    setLoadingMore(true);
    try {
      if (activeTab === 'posts' && postsHasMore) {
        await loadPosts(postsPage + 1);
      } else if (activeTab === 'created' && createdHasMore) {
        await loadCreatedActivities(createdPage + 1);
      } else if (activeTab === 'enrolled' && enrolledHasMore) {
        await loadEnrolledActivities(enrolledPage + 1);
      }
    } finally {
      setLoadingMore(false);
    }
  };

  const handleTabChange = (tab: TabType) => {
    setActiveTab(tab);
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-center items-center min-h-[400px]">
          <span className="loading loading-spinner loading-lg"></span>
        </div>
      </div>
    );
  }

  if (error || !user) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="alert alert-error">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="stroke-current shrink-0 h-6 w-6"
            fill="none"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <span>{error || '用户不存在'}</span>
        </div>
        <button
          onClick={() => navigate(-1)}
          className="btn btn-primary mt-4"
        >
          返回
        </button>
      </div>
    );
  }

  const hasMore =
    (activeTab === 'posts' && postsHasMore) ||
    (activeTab === 'created' && createdHasMore) ||
    (activeTab === 'enrolled' && enrolledHasMore);

  return (
    <div className="container mx-auto px-4 pt-24 pb-8">
      {/* User Info Card */}
      <div className="card bg-base-200 shadow-xl mb-6">
        <div className="card-body">
          <div className="flex flex-col md:flex-row items-center gap-6">
            <Avatar
              username={user.username}
              avatarUrl={user.avatar_url}
              size="large"
              clickable={false}
            />
            <div className="flex-1 text-center md:text-left">
              <h2 className="card-title text-3xl mb-2">{user.username}</h2>
              <div className="text-sm opacity-70 space-y-1">
                {(user.province || user.city) && (
                  <p>
                    所在地：{user.province} {user.city}
                  </p>
                )}
                {user.created_at && (
                  <p>加入时间：{formatDate(user.created_at)}</p>
                )}
              </div>
              {isOwnProfile && (
                <button
                  onClick={() => navigate('/profile')}
                  className="btn btn-primary btn-sm mt-4"
                >
                  编辑资料
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="tabs tabs-boxed mb-6 bg-base-200">
        <a
          className={`tab ${activeTab === 'posts' ? 'tab-active' : ''}`}
          onClick={() => handleTabChange('posts')}
        >
          帖子
        </a>
        <a
          className={`tab ${activeTab === 'created' ? 'tab-active' : ''}`}
          onClick={() => handleTabChange('created')}
        >
          创建的活动
        </a>
        <a
          className={`tab ${activeTab === 'enrolled' ? 'tab-active' : ''}`}
          onClick={() => handleTabChange('enrolled')}
        >
          参与的活动
        </a>
      </div>

      {/* Tab Content */}
      <div className="min-h-[400px]">
        {activeTab === 'posts' && (
          <div className="space-y-4">
            {posts.length === 0 ? (
              <div className="text-center py-12 text-base-content/60">
                <p>暂无帖子</p>
              </div>
            ) : (
              posts.map((post) => (
                <PostCard key={post.id} post={post} />
              ))
            )}
          </div>
        )}

        {activeTab === 'created' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {createdActivities.length === 0 ? (
              <div className="col-span-full text-center py-12 text-base-content/60">
                <p>暂无创建的活动</p>
              </div>
            ) : (
              createdActivities.map((activity) => (
                <ActivityCard key={activity.id} activity={activity} />
              ))
            )}
          </div>
        )}

        {activeTab === 'enrolled' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {enrolledActivities.length === 0 ? (
              <div className="col-span-full text-center py-12 text-base-content/60">
                <p>暂无参与的活动</p>
              </div>
            ) : (
              enrolledActivities.map((activity) => (
                <ActivityCard key={activity.id} activity={activity} />
              ))
            )}
          </div>
        )}

        {/* Load More Button */}
        {hasMore && (
          <div className="flex justify-center mt-8">
            <button
              onClick={loadMore}
              disabled={loadingMore}
              className="btn btn-primary"
            >
              {loadingMore ? (
                <span className="loading loading-spinner"></span>
              ) : (
                '加载更多'
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default UserProfile;
