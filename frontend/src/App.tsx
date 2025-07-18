import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ToastProvider } from './components/Toast';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Profile from './pages/Profile';
import Activities from './pages/Activity';
import MyActivities from './pages/MyActivities';
import userAPI from './api/user';

const App: React.FC = () => {
  // 应用启动时验证token
  useEffect(() => {
    const verifyTokenOnStartup = async () => {
      const token = localStorage.getItem('token');
      if (token) {
        try {
          const isValid = await userAPI.verifyToken();
          if (!isValid) {
            // Token无效，清除本地存储
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            console.log('启动时发现无效token，已清除');
          }
        } catch (error) {
          // 验证失败，清除本地存储
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          console.log('启动时token验证失败，已清除');
        }
      }
    };

    verifyTokenOnStartup();
  }, []);

  return (
    <ToastProvider>
      <Router>
        <div className="min-h-screen bg-base-100">
          <Navbar />
          <main>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/activities" element={<Activities />} />
              <Route path="/my-activities" element={<MyActivities />} />
            </Routes>
          </main>
        </div>
      </Router>
    </ToastProvider>
  );
};

export default App;
