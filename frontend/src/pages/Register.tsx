import React from 'react';
import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import userAPI, { RegisterRequest } from '../api/user';
import { useGuestGuard } from '../hooks/useAuth';

const Register: React.FC = () => {
  // 使用访客守卫，已登录用户重定向到首页
  useGuestGuard();
  
  const [formData, setFormData] = useState<RegisterRequest>({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    agreeTerms: false
  });
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [validationErrors, setValidationErrors] = useState<{
    username?: string;
    email?: string;
    password?: string;
    confirmPassword?: string;
  }>({});
  const [checkingAvailability, setCheckingAvailability] = useState<{
    username: boolean;
    email: boolean;
  }>({ username: false, email: false });
  const navigate = useNavigate();

  // 防抖用于API调用
  useEffect(() => {
    const timer = setTimeout(() => {
      if (formData.username && formData.username.length >= 3) {
        checkUsernameAvailability();
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [formData.username]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (formData.email && validateEmail(formData.email)) {
        checkEmailAvailability();
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [formData.email]);

  // 验证邮箱格式
  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  // 检查用户名可用性
  const checkUsernameAvailability = async () => {
    if (!formData.username || formData.username.length < 3) return;

    setCheckingAvailability(prev => ({ ...prev, username: true }));
    try {
      const exists = await userAPI.checkUsernameExists(formData.username);
      setValidationErrors(prev => ({
        ...prev,
        username: exists ? '用户名已被占用' : undefined
      }));
    } catch (error) {
      console.error('检查用户名失败:', error);
    } finally {
      setCheckingAvailability(prev => ({ ...prev, username: false }));
    }
  };

  // 检查邮箱可用性
  const checkEmailAvailability = async () => {
    if (!formData.email || !validateEmail(formData.email)) return;

    setCheckingAvailability(prev => ({ ...prev, email: true }));
    try {
      const exists = await userAPI.checkEmailExists(formData.email);
      setValidationErrors(prev => ({
        ...prev,
        email: exists ? '邮箱已被注册' : undefined
      }));
    } catch (error) {
      console.error('检查邮箱失败:', error);
    } finally {
      setCheckingAvailability(prev => ({ ...prev, email: false }));
    }
  };

  // 验证密码
  const validatePassword = (password: string): string | undefined => {
    if (password.length < 6) {
      return '密码长度至少为6位';
    }
    return undefined;
  };

  // 验证确认密码
  const validateConfirmPassword = (password: string, confirmPassword: string): string | undefined => {
    if (confirmPassword && password !== confirmPassword) {
      return '两次输入的密码不一致';
    }
    return undefined;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    });

    // 实时验证
    if (name === 'username') {
      if (value.length < 3 && value.length > 0) {
        setValidationErrors(prev => ({
          ...prev,
          username: '用户名至少需要3个字符'
        }));
      } else {
        setValidationErrors(prev => ({
          ...prev,
          username: undefined
        }));
      }
    }

    if (name === 'email') {
      if (value && !validateEmail(value)) {
        setValidationErrors(prev => ({
          ...prev,
          email: '请输入有效的邮箱地址'
        }));
      } else {
        setValidationErrors(prev => ({
          ...prev,
          email: undefined
        }));
      }
    }

    if (name === 'password') {
      const passwordError = validatePassword(value);
      setValidationErrors(prev => ({
        ...prev,
        password: passwordError,
        confirmPassword: validateConfirmPassword(value, formData.confirmPassword)
      }));
    }

    if (name === 'confirmPassword') {
      const confirmPasswordError = validateConfirmPassword(formData.password, value);
      setValidationErrors(prev => ({
        ...prev,
        confirmPassword: confirmPasswordError
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    // 检查是否有验证错误
    const hasValidationErrors = Object.values(validationErrors).some(error => error !== undefined);
    if (hasValidationErrors) {
      setError('请修正表单中的错误');
      setIsLoading(false);
      return;
    }

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
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '注册失败，请稍后重试';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="hero min-h-screen bg-pattern-overlay">
      <div className="hero-content flex-col lg:flex-row max-w-6xl mx-auto px-4">
        <div className="text-center lg:text-left">
          <h1 className="text-5xl font-bold">加入我们</h1>
          <p className="py-6">
            创建您的FlashSport账户，开启精彩的运动体验之旅！
          </p>
        </div>
        
        <div className="card bg-base-100 w-full max-w-sm shrink-0 shadow-2xl">
          <form className="card-body" onSubmit={handleSubmit}>
            <div className="form-control">
              <label className="label">
                <span className="label-text">用户名</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  name="username"
                  placeholder="请输入用户名（至少3个字符）"
                  className={`input input-bordered w-full ${
                    validationErrors.username ? 'input-error' : 
                    formData.username && !validationErrors.username && !checkingAvailability.username ? 'input-success' : ''
                  }`}
                  value={formData.username}
                  onChange={handleChange}
                  required
                />
                {checkingAvailability.username && (
                  <span className="absolute right-3 top-1/2 transform -translate-y-1/2">
                    <span className="loading loading-spinner loading-xs"></span>
                  </span>
                )}
                {formData.username && !validationErrors.username && !checkingAvailability.username && (
                  <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-success">
                    ✓
                  </span>
                )}
              </div>
              {validationErrors.username && (
                <label className="label">
                  <span className="label-text-alt text-error">{validationErrors.username}</span>
                </label>
              )}
            </div>
            
            <div className="form-control">
              <label className="label">
                <span className="label-text">邮箱</span>
              </label>
              <div className="relative">
                <input
                  type="email"
                  name="email"
                  placeholder="请输入邮箱"
                  className={`input input-bordered w-full ${
                    validationErrors.email ? 'input-error' : 
                    formData.email && !validationErrors.email && !checkingAvailability.email ? 'input-success' : ''
                  }`}
                  value={formData.email}
                  onChange={handleChange}
                  required
                />
                {checkingAvailability.email && (
                  <span className="absolute right-3 top-1/2 transform -translate-y-1/2">
                    <span className="loading loading-spinner loading-xs"></span>
                  </span>
                )}
                {formData.email && !validationErrors.email && !checkingAvailability.email && (
                  <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-success">
                    ✓
                  </span>
                )}
              </div>
              {validationErrors.email && (
                <label className="label">
                  <span className="label-text-alt text-error">{validationErrors.email}</span>
                </label>
              )}
            </div>
            
            <div className="form-control">
              <label className="label">
                <span className="label-text">密码</span>
              </label>
              <input
                type="password"
                name="password"
                placeholder="请输入密码（至少6位）"
                className={`input input-bordered ${
                  validationErrors.password ? 'input-error' : 
                  formData.password && !validationErrors.password ? 'input-success' : ''
                }`}
                value={formData.password}
                onChange={handleChange}
                required
              />
              {validationErrors.password && (
                <label className="label">
                  <span className="label-text-alt text-error">{validationErrors.password}</span>
                </label>
              )}
            </div>
            
            <div className="form-control">
              <label className="label">
                <span className="label-text">确认密码</span>
              </label>
              <input
                type="password"
                name="confirmPassword"
                placeholder="请再次输入密码"
                className={`input input-bordered ${
                  validationErrors.confirmPassword ? 'input-error' : 
                  formData.confirmPassword && !validationErrors.confirmPassword ? 'input-success' : ''
                }`}
                value={formData.confirmPassword}
                onChange={handleChange}
                required
              />
              {validationErrors.confirmPassword && (
                <label className="label">
                  <span className="label-text-alt text-error">{validationErrors.confirmPassword}</span>
                </label>
              )}
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
