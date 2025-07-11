import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

function Register() {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    agreeTerms: false
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    // 表单验证
    if (formData.password !== formData.confirmPassword) {
      setError('两次输入的密码不一致');
      setIsLoading(false);
      return;
    }

    if (formData.password.length < 6) {
      setError('密码长度至少为6位');
      setIsLoading(false);
      return;
    }

    if (!formData.agreeTerms) {
      setError('请同意服务条款和隐私政策');
      setIsLoading(false);
      return;
    }

    try {
      // 这里添加实际的注册逻辑
      console.log('注册数据:', formData);
      
      // 模拟API调用
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // 注册成功后跳转到登录页面
      navigate('/login');
    } catch (err) {
      setError('注册失败，请稍后重试');
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
            
            <div className="divider">或</div>
            
            <div className="form-control">
              <button type="button" className="btn btn-outline">
                <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                  <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                使用 Google 注册
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
}

export default Register;
