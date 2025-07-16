import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import userAPI from '../api/user';

/**
 * 认证守卫Hook - 检查用户是否已登录
 * 如果用户未登录，将重定向到登录页面
 * @param redirectTo 未登录时重定向的路径，默认为 '/login'
 * @returns 用户是否已登录
 */
export const useAuthGuard = (redirectTo: string = '/login'): boolean => {
  const navigate = useNavigate();
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
  const [isChecking, setIsChecking] = useState<boolean>(true);

  useEffect(() => {
    // 检查登录状态（包含服务器验证）
    const checkAuthStatus = async () => {
      try {
        // 先进行基本检查
        const basicCheck = userAPI.isLoggedIn();
        if (!basicCheck) {
          setIsLoggedIn(false);
          setIsChecking(false);
          navigate(redirectTo, {
            state: { message: '请先登录后再访问该页面' }
          });
          return;
        }

        // 进行服务器token验证
        const isValid = await userAPI.verifyToken();
        setIsLoggedIn(isValid);
        setIsChecking(false);
        
        if (!isValid) {
          // Token无效，清除本地存储并跳转
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          navigate(redirectTo, {
            state: { message: '登录已过期，请重新登录' }
          });
        }
      } catch (error) {
        console.error('认证检查失败:', error);
        setIsLoggedIn(false);
        setIsChecking(false);
        navigate(redirectTo, {
          state: { message: '认证检查失败，请重新登录' }
        });
      }
    };

    // 初始检查
    checkAuthStatus();

    // 监听登录状态变化
    const handleStorageChange = () => {
      checkAuthStatus();
    };

    const handleUserLoggedIn = () => {
      checkAuthStatus();
    };

    const handleUserLoggedOut = () => {
      setIsLoggedIn(false);
      setIsChecking(false);
    };

    // 监听 localStorage 变化
    window.addEventListener('storage', handleStorageChange);
    // 监听自定义登录事件
    window.addEventListener('userLoggedIn', handleUserLoggedIn);
    // 监听自定义登出事件
    window.addEventListener('userLoggedOut', handleUserLoggedOut);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('userLoggedIn', handleUserLoggedIn);
      window.removeEventListener('userLoggedOut', handleUserLoggedOut);
    };
  }, [navigate, redirectTo]);

  return isLoggedIn && !isChecking;
};

/**
 * 访客守卫Hook - 检查用户是否未登录
 * 如果用户已登录，将重定向到指定页面
 * @param redirectTo 已登录时重定向的路径，默认为 '/'
 * @returns 用户是否未登录
 */
export const useGuestGuard = (redirectTo: string = '/'): boolean => {
  const navigate = useNavigate();
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(userAPI.isLoggedIn());

  useEffect(() => {
    // 检查登录状态
    const checkAuthStatus = () => {
      const loggedIn = userAPI.isLoggedIn();
      setIsLoggedIn(loggedIn);
      
      if (loggedIn) {
        navigate(redirectTo);
      }
    };

    // 初始检查
    checkAuthStatus();

    // 监听登录状态变化
    const handleStorageChange = () => {
      checkAuthStatus();
    };

    const handleUserLoggedIn = () => {
      checkAuthStatus();
    };

    const handleUserLoggedOut = () => {
      checkAuthStatus();
    };

    // 监听 localStorage 变化
    window.addEventListener('storage', handleStorageChange);
    // 监听自定义登录事件
    window.addEventListener('userLoggedIn', handleUserLoggedIn);
    // 监听自定义登出事件
    window.addEventListener('userLoggedOut', handleUserLoggedOut);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('userLoggedIn', handleUserLoggedIn);
      window.removeEventListener('userLoggedOut', handleUserLoggedOut);
    };
  }, [navigate, redirectTo]);

  return !isLoggedIn;
};

/**
 * 用户信息Hook - 获取当前登录用户信息
 * @returns 用户信息和相关状态
 */
export const useCurrentUser = () => {
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(userAPI.isLoggedIn());
  const [user, setUser] = useState(userAPI.getCurrentUserFromStorage());
  const [token, setToken] = useState(userAPI.getToken());

  useEffect(() => {
    // 更新用户状态
    const updateUserState = () => {
      const loggedIn = userAPI.isLoggedIn();
      const currentUser = userAPI.getCurrentUserFromStorage();
      const currentToken = userAPI.getToken();

      setIsLoggedIn(loggedIn);
      setUser(currentUser);
      setToken(currentToken);
    };

    // 初始更新
    updateUserState();

    // 监听状态变化
    const handleStorageChange = () => {
      updateUserState();
    };

    const handleUserLoggedIn = () => {
      updateUserState();
    };

    const handleUserLoggedOut = () => {
      updateUserState();
    };

    // 监听 localStorage 变化
    window.addEventListener('storage', handleStorageChange);
    // 监听自定义登录事件
    window.addEventListener('userLoggedIn', handleUserLoggedIn);
    // 监听自定义登出事件
    window.addEventListener('userLoggedOut', handleUserLoggedOut);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('userLoggedIn', handleUserLoggedIn);
      window.removeEventListener('userLoggedOut', handleUserLoggedOut);
    };
  }, []);

  return {
    isLoggedIn,
    user,
    token
  };
};
