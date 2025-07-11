import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';

const Navbar: React.FC = () => {
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false); // 这里可以后续集成真实的认证状态
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const navigate = useNavigate();

  // 初始化主题
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') as 'light' | 'dark' || 'light';
    setTheme(savedTheme);
    document.documentElement.setAttribute('data-theme', savedTheme);
  }, []);

  // 切换主题
  const toggleTheme = (): void => {
    const newTheme: 'light' | 'dark' = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
    document.documentElement.setAttribute('data-theme', newTheme);
  };

  const handleLogout = (): void => {
    // 这里可以添加登出逻辑
    setIsLoggedIn(false);
    navigate('/');
  };

  return (
    <div className="navbar bg-base-100/90 backdrop-blur-md shadow-lg fixed top-0 left-0 right-0 z-50">
      <div className="navbar-start">
        <div className="dropdown">
          <div tabIndex={0} role="button" className="btn btn-ghost lg:hidden">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M4 6h16M4 12h8m-8 6h16" />
            </svg>
          </div>
          <ul
            tabIndex={0}
            className="menu menu-sm dropdown-content bg-base-100 rounded-box z-[1] mt-3 w-52 p-2 shadow">
            <li><Link to="/">首页</Link></li>
            <li><Link to="/sports">运动项目</Link></li>
            <li><Link to="/events">赛事</Link></li>
            <li><Link to="/about">关于我们</Link></li>
          </ul>
        </div>
        <Link to="/" className="btn btn-ghost text-xl font-bold text-primary">
          ⚡ FlashSport
        </Link>
      </div>
      
      <div className="navbar-center hidden lg:flex">
        <ul className="menu menu-horizontal px-1">
          <li><Link to="/" className="btn btn-ghost">首页</Link></li>
          <li><Link to="/sports" className="btn btn-ghost">运动项目</Link></li>
          <li><Link to="/events" className="btn btn-ghost">赛事</Link></li>
          <li><Link to="/about" className="btn btn-ghost">关于我们</Link></li>
        </ul>
      </div>
      
      <div className="navbar-end">
        {/* 主题切换按钮 */}
        <div className="flex items-center gap-2 mr-4">
          <button 
            onClick={toggleTheme}
            className="btn btn-ghost btn-circle"
            title={theme === 'light' ? '切换到暗色模式' : '切换到浅色模式'}
          >
            {theme === 'light' ? (
              // 月亮图标 (暗色模式)
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" clipRule="evenodd" />
              </svg>
            ) : (
              // 太阳图标 (浅色模式)
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" clipRule="evenodd" />
              </svg>
            )}
          </button>
        </div>
        
        {isLoggedIn ? (
          <div className="dropdown dropdown-end">
            <div tabIndex={0} role="button" className="btn btn-ghost btn-circle avatar">
              <div className="w-10 rounded-full">
                <img
                  alt="用户头像"
                  src="https://img.daisyui.com/images/stock/photo-1534528741775-53994a69daeb.webp" />
              </div>
            </div>
            <ul
              tabIndex={0}
              className="menu menu-sm dropdown-content bg-base-100 rounded-box z-[1] mt-3 w-52 p-2 shadow">
              <li>
                <a className="justify-between">
                  个人资料
                  <span className="badge">新功能</span>
                </a>
              </li>
              <li><a>设置</a></li>
              <li><a onClick={handleLogout}>登出</a></li>
            </ul>
          </div>
        ) : (
          <div className="flex gap-2">
            <Link to="/login" className="btn btn-ghost">登录</Link>
            <Link to="/register" className="btn btn-primary">注册</Link>
          </div>
        )}
      </div>
    </div>
  );
};

export default Navbar;
