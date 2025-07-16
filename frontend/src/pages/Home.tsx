import React from 'react';
import { Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import userAPI from '../api/user';

const Home: React.FC = () => {
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);

  // 检查用户登录状态
  useEffect(() => {
    const checkLoginStatus = () => {
      const loggedIn = userAPI.isLoggedIn();
      setIsLoggedIn(loggedIn);
    };

    // 初始检查
    checkLoginStatus();

    // 监听登录事件
    const handleUserLoggedIn = () => {
      checkLoginStatus();
    };

    window.addEventListener('userLoggedIn', handleUserLoggedIn);

    // 清理事件监听器
    return () => {
      window.removeEventListener('userLoggedIn', handleUserLoggedIn);
    };
  }, []);
  return (
    <div className="hero min-h-screen bg-gradient-to-br from-primary/10 to-secondary/10">
      <div className="hero-content text-center">
        <div className="max-w-md">
          <h1 className="text-5xl font-bold text-primary mb-6">
            ⚡ FlashSport
          </h1>
          <p className="text-lg mb-8 text-base-content/80">
            快速、便捷的体育运动平台，让运动更有趣，让比赛更精彩！
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            {!isLoggedIn && (
              <Link to="/register" className="btn btn-primary btn-lg">
                立即加入
              </Link>
            )}
            <Link to="/activities" className="btn btn-outline btn-lg">
              探索活动
            </Link>
          </div>
        </div>
      </div>
      
      {/* 特色功能展示 */}
      <div className="absolute bottom-10 left-1/2 transform -translate-x-1/2 w-full px-4">
        <div className="stats shadow mx-auto max-w-4xl">
          <div className="stat">
            <div className="stat-figure text-primary">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                className="inline-block h-8 w-8 stroke-current">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
              </svg>
            </div>
            <div className="stat-title">用户数量</div>
            <div className="stat-value text-primary">1.2K</div>
            <div className="stat-desc">持续增长中</div>
          </div>
          
          <div className="stat">
            <div className="stat-figure text-secondary">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                className="inline-block h-8 w-8 stroke-current">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4"></path>
              </svg>
            </div>
            <div className="stat-title">活跃赛事</div>
            <div className="stat-value text-secondary">46</div>
            <div className="stat-desc">本月新增 12 场</div>
          </div>
          
          <div className="stat">
            <div className="stat-figure text-accent">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                className="inline-block h-8 w-8 stroke-current">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M5 8h14M5 8a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2M5 8v10a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8m-9 4h4"></path>
              </svg>
            </div>
            <div className="stat-title">运动项目</div>
            <div className="stat-value text-accent">8</div>
            <div className="stat-desc">涵盖主流运动</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;
