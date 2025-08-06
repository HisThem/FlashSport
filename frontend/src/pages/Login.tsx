import React from 'react';
import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import userAPI, { LoginRequest } from '../api/user';
// import { useGuestGuard } from '../hooks/useAuth';

const Login: React.FC = () => {
  // 暂时注释掉访客守卫，以便调试
  // const isGuest = useGuestGuard();
  
  const [formData, setFormData] = useState<LoginRequest>({
    email: '',
    password: ''
  });
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [successMessage, setSuccessMessage] = useState<string>('');
  const navigate = useNavigate();
  const location = useLocation();

  // 检查是否有来自注册页面的成功消息
  useEffect(() => {
    // 暂时移除isGuest检查，直接处理消息
    if (location.state?.message) {
      setSuccessMessage(location.state.message);
      // 清除location state以防止刷新时重复显示
      navigate(location.pathname, { replace: true });
    }
  }, [location, navigate]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      // 使用userAPI进行登录
      const response = await userAPI.login(formData);
      
      if (response.success) {
        // 登录成功后跳转到首页
        // 触发一个自定义事件通知其他组件更新状态
        window.dispatchEvent(new CustomEvent('userLoggedIn'));
        navigate('/');
      } else {
        setError(response.message || '登录失败');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '登录失败，请检查您的邮箱和密码';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="hero min-h-screen bg-pattern-overlay">
      <div className="hero-content flex-col lg:flex-row-reverse max-w-6xl mx-auto px-4">
        <div className="text-center lg:text-left">
          <h1 className="text-5xl font-bold">立即登录</h1>
          <p className="py-6">
            欢迎回到FlashSport！登录您的账户，继续您的运动之旅。
          </p>
        </div>
        <div className="card bg-base-100 w-full max-w-sm shrink-0 shadow-2xl">
          <form className="card-body" onSubmit={handleSubmit}>
            <div className="form-control">
              <label className="label">
                <span className="label-text">邮箱</span>
              </label>
              <input
                type="email"
                name="email"
                placeholder="请输入邮箱"
                className="input input-bordered"
                value={formData.email}
                onChange={handleChange}
                required
              />
            </div>
            <div className="form-control">
              <label className="label">
                <span className="label-text">密码</span>
              </label>
              <input
                type="password"
                name="password"
                placeholder="请输入密码"
                className="input input-bordered"
                value={formData.password}
                onChange={handleChange}
                required
              />
              <label className="label">
                <a href="#" className="label-text-alt link link-hover">
                  忘记密码？
                </a>
              </label>
            </div>
            
            {successMessage && (
              <div className="alert alert-success">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-6 w-6 shrink-0 stroke-current"
                  fill="none"
                  viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>{successMessage}</span>
              </div>
            )}
            
            {error && (
              <div className="alert alert-error">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-6 w-6 shrink-0 stroke-current"
                  fill="none"
                  viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>{error}</span>
              </div>
            )}
            
            <div className="form-control mt-6">
              <button 
                className={`btn btn-primary ${isLoading ? 'loading' : ''}`}
                disabled={isLoading}
              >
                {isLoading ? '登录中...' : '登录'}
              </button>
            </div>
            
            <div className="text-center mt-4">
              <span className="text-sm">还没有账户？</span>
              <Link to="/register" className="link link-primary ml-1">
                立即注册
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Login;
