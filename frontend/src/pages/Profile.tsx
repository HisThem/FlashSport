import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import userAPI, { User } from '../api/user';
import { useAuthGuard } from '../hooks/useAuth';
import { useToast } from '../components/Toast';
import Avatar from '../components/Avatar';
import { PROVINCES, getCitiesByProvince } from '../utils/chinaRegions';

const Profile: React.FC = () => {
  const navigate = useNavigate();
  const toast = useToast(); // 添加Toast
  const isLoggedIn = useAuthGuard(); // 使用认证守卫
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [isChangingPassword, setIsChangingPassword] = useState<boolean>(false);

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

  // 当用户通过认证检查后，加载用户资料
  useEffect(() => {
    if (!isLoggedIn) {
      return; // 如果未登录，useAuthGuard会处理重定向
    }

    const loadUserProfile = async () => {
      try {
        setIsLoading(true);
        
        // 先从本地存储获取用户信息并立即显示
        const localUser = userAPI.getCurrentUserFromStorage();
        if (localUser) {
          setUser(localUser);
          setProfileForm({
            username: localUser.username,
            avatar_url: localUser.avatar_url || '',
            province: localUser.province || '',
            city: localUser.city || ''
          });
          setAvailableCities(
            localUser.province ? getCitiesByProvince(localUser.province) : []
          );
        }

        // 然后尝试从服务器获取最新用户信息
        try {
          const userData = await userAPI.getCurrentUser();
          setUser(userData);
          setProfileForm({
            username: userData.username,
            avatar_url: userData.avatar_url || '',
            province: userData.province || '',
            city: userData.city || ''
          });
          setAvailableCities(
            userData.province ? getCitiesByProvince(userData.province) : []
          );
        } catch (error) {
          // 如果服务器请求失败但有本地用户信息，继续使用本地信息
          if (!localUser) {
            console.error('加载用户资料时出错:', error);
            toast.error('获取用户信息失败，请稍后重试');
            return;
          }
          // 401错误会被全局错误处理器处理，这里不需要特殊处理
        }
        
      } catch (error) {
        console.error('加载用户资料时出错:', error);
        // 401错误会被全局处理，其他错误显示给用户
        const errorMessage = error instanceof Error ? error.message : '获取用户信息失败';
        toast.error('获取用户信息失败: ' + errorMessage);
      } finally {
        setIsLoading(false);
      }
    };

    loadUserProfile();
  }, [isLoggedIn]);

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

  // 保存个人资料
  const handleSaveProfile = async () => {
    try {
      const updatedUser = await userAPI.updateProfile(profileForm);
      setUser(updatedUser);
      setIsEditing(false);
      toast.success('个人资料更新成功！');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '更新个人资料失败';
      toast.error(errorMessage);
    }
  };

  // 修改密码
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // 先验证token是否有效
      const isValid = await userAPI.verifyToken();
      if (!isValid) {
        toast.error('登录状态已失效，请重新登录');
        return;
      }
      
      await userAPI.changePassword(passwordForm);
      setPasswordForm({
        oldPassword: '',
        newPassword: '',
        confirmNewPassword: ''
      });
      setIsChangingPassword(false);
      toast.success('密码修改成功！');
    } catch (error) {
      console.error('修改密码失败:', error);
      
      // 401错误会被全局错误处理器处理，其他错误显示给用户
      const errorMessage = error instanceof Error ? error.message : '修改密码失败';
      toast.error(errorMessage);
    }
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
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">未找到用户信息</h2>
          <button onClick={() => navigate('/login')} className="btn btn-primary">
            返回登录
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-pattern-overlay pt-20 pb-10">
      <div className="container mx-auto px-4 max-w-4xl">
        <div className="card bg-base-100 shadow-xl">
          <div className="card-body">
            <h1 className="card-title text-3xl mb-6">个人资料</h1>

            <div className="grid md:grid-cols-2 gap-8">
              {/* 用户头像和基本信息 */}
              <div className="text-center">
                <div className="mb-4">
                  <Avatar 
                    username={user.username}
                    avatarUrl={user.avatar_url}
                    size="large"
                  />
                </div>
                <h2 className="text-2xl font-bold">{user.username}</h2>
                <p className="text-base-content/70">{user.email}</p>
                <div className="badge badge-outline mt-2">
                  {user.role === 'admin' ? '管理员' : '普通用户'}
                </div>
                <div className="mt-4 text-sm text-base-content/60">
                  <p>注册时间: {user.created_at ? new Date(user.created_at).toLocaleDateString('zh-CN') : '未知'}</p>
                </div>
              </div>

              {/* 个人信息编辑 */}
              <div>
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-xl font-semibold">个人信息</h3>
                  {!isEditing && (
                    <button
                      onClick={() => setIsEditing(true)}
                      className="btn btn-outline btn-sm"
                    >
                      编辑
                    </button>
                  )}
                </div>

                {isEditing ? (
                  <div className="space-y-4">
                    <div className="form-control">
                      <label className="label">
                        <span className="label-text">用户名</span>
                      </label>
                      <input
                        type="text"
                        name="username"
                        value={profileForm.username}
                        onChange={handleProfileChange}
                        className="input input-bordered"
                        placeholder="请输入用户名"
                      />
                    </div>

                    <div className="form-control">
                      <label className="label">
                        <span className="label-text">头像URL</span>
                      </label>
                      <input
                        type="url"
                        name="avatar_url"
                        value={profileForm.avatar_url}
                        onChange={handleProfileChange}
                        className="input input-bordered"
                        placeholder="请输入头像URL"
                      />
                    </div>

                    <div className="form-control">
                      <label className="label">
                        <span className="label-text">所在省份</span>
                      </label>
                      <select
                        name="province"
                        className="select select-bordered"
                        value={profileForm.province}
                        onChange={(e) => handleProvinceChange(e.target.value)}
                      >
                        <option value="">未设置</option>
                        {PROVINCES.map((province) => (
                          <option key={province.name} value={province.name}>
                            {province.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="form-control">
                      <label className="label">
                        <span className="label-text">所在城市</span>
                      </label>
                      <select
                        name="city"
                        className="select select-bordered"
                        value={profileForm.city}
                        onChange={handleProfileChange}
                        disabled={!profileForm.province}
                      >
                        <option value="">未设置</option>
                        {availableCities.map((city) => (
                          <option key={city} value={city}>
                            {city}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={handleSaveProfile}
                        className="btn btn-primary"
                      >
                        保存
                      </button>
                      <button
                        onClick={() => {
                          setIsEditing(false);
                          setProfileForm({
                            username: user.username,
                            avatar_url: user.avatar_url || '',
                            province: user.province || '',
                            city: user.city || ''
                          });
                          setAvailableCities(
                            user.province ? getCitiesByProvince(user.province) : []
                          );
                        }}
                        className="btn btn-outline"
                      >
                        取消
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm text-base-content/70">用户名</label>
                      <p className="text-lg">{user.username}</p>
                    </div>
                    <div>
                      <label className="text-sm text-base-content/70">邮箱</label>
                      <p className="text-lg">{user.email}</p>
                    </div>
                    <div>
                      <label className="text-sm text-base-content/70">所在省份</label>
                      <p className="text-lg">{user.province || '未设置'}</p>
                    </div>
                    <div>
                      <label className="text-sm text-base-content/70">所在城市</label>
                      <p className="text-lg">{user.city || '未设置'}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* 密码修改区域 */}
            <div className="divider mt-8"></div>
            
            <div className="mt-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-semibold">安全设置</h3>
                {!isChangingPassword && (
                  <button
                    onClick={() => setIsChangingPassword(true)}
                    className="btn btn-outline btn-sm"
                  >
                    修改密码
                  </button>
                )}
              </div>

              {isChangingPassword && (
                <form onSubmit={handleChangePassword} className="space-y-4 max-w-md">
                  <div className="form-control">
                    <label className="label">
                      <span className="label-text">当前密码</span>
                    </label>
                    <input
                      type="password"
                      name="oldPassword"
                      value={passwordForm.oldPassword}
                      onChange={handlePasswordChange}
                      className="input input-bordered"
                      placeholder="请输入当前密码"
                      required
                    />
                  </div>

                  <div className="form-control">
                    <label className="label">
                      <span className="label-text">新密码</span>
                    </label>
                    <input
                      type="password"
                      name="newPassword"
                      value={passwordForm.newPassword}
                      onChange={handlePasswordChange}
                      className="input input-bordered"
                      placeholder="请输入新密码（至少6位）"
                      required
                      minLength={6}
                    />
                  </div>

                  <div className="form-control">
                    <label className="label">
                      <span className="label-text">确认新密码</span>
                    </label>
                    <input
                      type="password"
                      name="confirmNewPassword"
                      value={passwordForm.confirmNewPassword}
                      onChange={handlePasswordChange}
                      className="input input-bordered"
                      placeholder="请再次输入新密码"
                      required
                    />
                  </div>

                  <div className="flex gap-2">
                    <button type="submit" className="btn btn-primary">
                      确认修改
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setIsChangingPassword(false);
                        setPasswordForm({
                          oldPassword: '',
                          newPassword: '',
                          confirmNewPassword: ''
                        });
                      }}
                      className="btn btn-outline"
                    >
                      取消
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
