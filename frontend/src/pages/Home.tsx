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
    <div className="hero min-h-screen">
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
    </div>
  );
};

export default Home;
