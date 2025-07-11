import React from 'react';
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import userAPI, { RegisterRequest } from '../api/user';

const Register: React.FC = () => {
  const [formData, setFormData] = useState<RegisterRequest>({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    agreeTerms: false
  });
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const navigate = useNavigate();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    });
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    // 表单验证
    if (!formData.agreeTerms) {
      setError('请同意服务条款和隐私政策');
      setIsLoading(false);
      return;
    }

    try {
      // 使用userAPI进行注册
      const response = await userAPI.register(formData);
      
      if (response.success) {
        // 注册成功后跳转到登录页面
        navigate('/login', { 
          state: { 
            message: '注册成功！请使用您的邮箱和密码登录。' 
          }
        });
      } else {
        setError(response.message || '注册失败');
      }
    } catch (error: any) {
      setError(error.message || '注册失败，请稍后重试');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="hero min-h-screen bg-base-200">
      <div className="hero-content flex-col lg:flex-row max-w-6xl mx-auto px-4">
        <div className="text-center lg:text-left">
          <h1 className="text-5xl font-bold">加入我们</h1>
          <p className="py-6">
            创建您的FlashSport账户，开启精彩的运动体验之旅！
          </p>
          <div className="stats stats-vertical lg:stats-horizontal shadow">
            <div className="stat">
              <div className="stat-title">活跃用户</div>
              <div className="stat-value text-primary">1.2K+</div>
            </div>
            <div className="stat">
              <div className="stat-title">运动项目</div>
              <div className="stat-value text-secondary">8+</div>
            </div>
            <div className="stat">
              <div className="stat-title">满意度</div>
              <div className="stat-value text-accent">98%</div>
            </div>
          </div>
        </div>
        
        <div className="card bg-base-100 w-full max-w-sm shrink-0 shadow-2xl">
          <form className="card-body" onSubmit={handleSubmit}>
            <div className="form-control">
              <label className="label">
                <span className="label-text">用户名</span>
              </label>
              <input
                type="text"
                name="username"
                placeholder="请输入用户名"
                className="input input-bordered"
                value={formData.username}
                onChange={handleChange}
                required
              />
            </div>
            
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
                placeholder="请输入密码（至少6位）"
                className="input input-bordered"
                value={formData.password}
                onChange={handleChange}
                required
              />
            </div>
            
            <div className="form-control">
              <label className="label">
                <span className="label-text">确认密码</span>
              </label>
              <input
                type="password"
                name="confirmPassword"
                placeholder="请再次输入密码"
                className="input input-bordered"
                value={formData.confirmPassword}
                onChange={handleChange}
                required
              />
            </div>
            
            <div className="form-control">
              <label className="label cursor-pointer">
                <span className="label-text">
                  我同意
                  <a href="#" className="link link-primary mx-1">服务条款</a>
                  和
                  <a href="#" className="link link-primary mx-1">隐私政策</a>
                </span>
                <input
                  type="checkbox"
                  name="agreeTerms"
                  className="checkbox checkbox-primary"
                  checked={formData.agreeTerms}
                  onChange={handleChange}
                />
              </label>
            </div>
            
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
                {isLoading ? '注册中...' : '注册'}
              </button>
            </div>
            
            <div className="text-center mt-4">
              <span className="text-sm">已有账户？</span>
              <Link to="/login" className="link link-primary ml-1">
                立即登录
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Register;
