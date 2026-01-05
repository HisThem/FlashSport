import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import PostCard from '../components/post/PostCard';
import PostFormModal from '../components/post/PostFormModal';
import PostDetailModal from '../components/post/PostDetailModal';
import ManagePostsModal from '../components/post/PostManageModal';
import ActivityDetailModal from '../components/activity/ActivityDetailModal';
import ConfirmModal, { ConfirmModalConfig } from '../components/ConfirmModal';
import postAPI, { Post, CreatePostPayload } from '../api/post';
import activityAPI, { Activity } from '../api/activity';
import userAPI from '../api/user';
import { useToast } from '../components/Toast';

const Community: React.FC = () => {
  const navigate = useNavigate();
  const toast = useToast();
  const [posts, setPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showPostForm, setShowPostForm] = useState(false);
  const [editingPost, setEditingPost] = useState<Post | null>(null);
  const [selectedActivity, setSelectedActivity] = useState<Activity | null>(
    null,
  );
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [expandCommentOnOpen, setExpandCommentOnOpen] = useState(false);
  const [showManagePosts, setShowManagePosts] = useState(false);
  const [confirmModal, setConfirmModal] = useState<ConfirmModalConfig>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
    onCancel: () => setConfirmModal(prev => ({ ...prev, isOpen: false })),
  });
  const currentUser = userAPI.getCurrentUserFromStorage();

  // 加载帖子列表
  const loadPosts = async (pageNum: number = 1) => {
    setIsLoading(true);
    try {
      const result = await postAPI.getPosts(pageNum, 10);
      setPosts(result.items);
      setPage(pageNum);
      setTotalPages(result.totalPages);
    } catch (error) {
      console.error('加载帖子失败:', error);
      toast.error('加载帖子失败，请重试');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadPosts(1);
  }, []);

  // 创建或更新帖子
  const handleSubmitPost = async (payload: CreatePostPayload) => {
    setIsLoading(true);
    try {
      if (editingPost) {
        // 更新帖子
        const updated = await postAPI.updatePost(editingPost.id, payload);
        setPosts(posts.map((p) => (p.id === updated.id ? updated : p)));
        toast.success('帖子更新成功');
      } else {
        // 创建新帖子
        const newPost = await postAPI.createPost(payload);
        setPosts([newPost, ...posts]);
        toast.success('帖子发布成功');
      }
      setEditingPost(null);
    } catch (error: any) {
      console.error('提交帖子失败:', error);
      toast.error(
        error?.response?.data?.message || '提交帖子失败，请重试',
      );
    } finally {
      setIsLoading(false);
    }
  };

  // 删除帖子
  const handleDeletePost = async (postId: number) => {
    setConfirmModal({
      isOpen: true,
      title: '确认删除',
      message: '确定要删除这条帖子吗？',
      confirmText: '确认删除',
      cancelText: '取消',
      type: 'danger',
      onConfirm: async () => {
        setIsLoading(true);
        try {
          await postAPI.deletePost(postId);
          setPosts(posts.filter((p) => p.id !== postId));
          toast.success('帖子删除成功');
        } catch (error: any) {
          console.error('删除帖子失败:', error);
          toast.error(
            error?.response?.data?.message || '删除帖子失败，请重试',
          );
        } finally {
          setIsLoading(false);
        }
        setConfirmModal(prev => ({ ...prev, isOpen: false }));
      },
      onCancel: () => setConfirmModal(prev => ({ ...prev, isOpen: false })),
    });
  };

  // 直接删除帖子（用于管理模态框中，已经有确认了）
  const handleDeletePostDirect = async (postId: number) => {
    setIsLoading(true);
    try {
      await postAPI.deletePost(postId);
      setPosts(posts.filter((p) => p.id !== postId));
      toast.success('帖子删除成功');
    } catch (error: any) {
      console.error('删除帖子失败:', error);
      toast.error(
        error?.response?.data?.message || '删除帖子失败，请重试',
      );
    } finally {
      setIsLoading(false);
    }
  };

  // 编辑帖子
  const handleEditPost = (post: Post) => {
    setEditingPost(post);
    setShowPostForm(true);
  };

  // 点赞
  const handleLikeChange = async (postId: number, isLiked: boolean) => {
    try {
      if (isLiked) {
        await postAPI.likePost(postId);
      } else {
        await postAPI.unlikePost(postId);
      }
      // 重新加载帖子以获取最新的点赞数
      loadPosts(page);
    } catch (error: any) {
      console.error('操作失败:', error);
    }
  };

  // 查看活动详情
  const handleViewActivity = async (activityId: number) => {
    try {
      const activity = await activityAPI.getActivityById(activityId);
      setSelectedActivity(activity);
    } catch (error) {
      console.error('加载活动详情失败:', error);
      toast.error('加载活动详情失败，请稍后重试');
    }
  };

  // 关闭发帖表单时重置编辑状态
  const handleClosePostForm = () => {
    setShowPostForm(false);
    setEditingPost(null);
  };

  const handleOpenPostDetail = (post: Post, expandComment: boolean = false) => {
    setSelectedPost(post);
    setExpandCommentOnOpen(expandComment);
  };

  const handleClosePostDetail = () => {
    setSelectedPost(null);
    setExpandCommentOnOpen(false);
  };

  const myPosts = currentUser ? posts.filter((p) => p.author_id === currentUser.id) : [];

  return (
    <div className="min-h-screen bg-pattern-overlay pt-20">
      <div className="container mx-auto px-4 py-8">
        {/* 顶部标题 */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-primary mb-4">社区</h1>
          <p className="text-lg text-base-content/80 max-w-2xl mx-auto">
            分享你的运动体验，发现志同道合的朋友
          </p>
        </div>

        {/* 发帖入口 */}
        {currentUser && (
          <div className="flex justify-end gap-3 mb-8">
            <button
              className="btn btn-outline"
              onClick={() => setShowManagePosts(true)}
            >
              管理我的帖子
            </button>
            <button
              className="btn btn-primary"
              onClick={() => setShowPostForm(true)}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              发布帖子
            </button>
          </div>
        )}

        {!currentUser && (
          <div className="alert alert-info mb-8">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              className="w-6 h-6 stroke-current"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <span>
              请
              <button
                className="btn btn-link btn-sm p-0 h-auto"
                onClick={() => navigate('/login')}
              >
                登录
              </button>
              后发表帖子
            </span>
          </div>
        )}

        {/* 帖子列表 */}
        <div>
          {isLoading && posts.length === 0 ? (
            <div className="text-center py-12">
              <span className="loading loading-spinner"></span>
              <p className="mt-2 text-base-content/60">加载中...</p>
            </div>
          ) : posts.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-base-content/60 mb-4">
                还没有人发布帖子，成为第一个吧！
              </p>
              {currentUser && (
                <button
                  className="btn btn-primary"
                  onClick={() => setShowPostForm(true)}
                >
                  发布第一条帖子
                </button>
              )}
            </div>
          ) : (
            <>
              <div className="columns-1 sm:columns-2 lg:columns-3 xl:columns-4 [column-gap:1.5rem]">
                {posts.map((post, index) => (
                  <div
                    key={post.id}
                    className="mb-6 activity-fade-up"
                    style={{ animationDelay: `${index * 80}ms` }}
                  >
                    <PostCard
                      post={post}
                      onDelete={handleDeletePost}
                      onEdit={handleEditPost}
                      onViewActivity={handleViewActivity}
                      onLikeChange={handleLikeChange}
                      onOpenDetail={handleOpenPostDetail}
                    />
                  </div>
                ))}
              </div>

              {/* 分页 */}
              {totalPages > 1 && (
                <div className="flex justify-center gap-2 mt-8">
                  <button
                    className="btn btn-outline"
                    disabled={page === 1 || isLoading}
                    onClick={() => loadPosts(page - 1)}
                  >
                    上一页
                  </button>
                  <div className="flex items-center gap-2">
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                      (p) => (
                        <button
                          key={p}
                          className={`btn btn-sm ${
                            p === page ? 'btn-primary' : 'btn-ghost'
                          }`}
                          onClick={() => loadPosts(p)}
                          disabled={isLoading}
                        >
                          {p}
                        </button>
                      ),
                    )}
                  </div>
                  <button
                    className="btn btn-outline"
                    disabled={page === totalPages || isLoading}
                    onClick={() => loadPosts(page + 1)}
                  >
                    下一页
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {showManagePosts && (
        <ManagePostsModal
          isOpen={showManagePosts}
          posts={myPosts}
          onClose={() => setShowManagePosts(false)}
          onEdit={(post) => {
            setEditingPost(post);
            setShowPostForm(true);
          }}
          onDelete={handleDeletePostDirect}
          onViewDetail={(post) => {
            setSelectedPost(post);
            setExpandCommentOnOpen(false);
          }}
        />
      )}

      {/* 发帖表单Modal */}
      <PostFormModal
        isOpen={showPostForm}
        onClose={handleClosePostForm}
        onSubmit={handleSubmitPost}
        editingPost={editingPost}
        isLoading={isLoading}
      />

      {/* 活动详情Modal */}
      {selectedActivity && (
        <ActivityDetailModal
          isOpen={true}
          activity={selectedActivity}
          onClose={() => setSelectedActivity(null)}
          onEnroll={() => {}}
          onCancelEnrollment={() => {}}
        />
      )}

      {selectedPost && (
        <PostDetailModal
          isOpen={true}
          post={selectedPost}
          onClose={handleClosePostDetail}
          onLikeChange={handleLikeChange}
          onViewActivity={handleViewActivity}
          expandCommentOnOpen={expandCommentOnOpen}
        />
      )}
    </div>
  );
};

export default Community;
