import axios, { AxiosInstance, AxiosResponse, AxiosError } from 'axios';

// 创建axios实例
const request: AxiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 请求拦截器
request.interceptors.request.use(
  (config) => {
    // 从localStorage获取token
    const token = localStorage.getItem('token');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error: AxiosError) => {
    return Promise.reject(error);
  }
);

// 响应拦截器
request.interceptors.response.use(
  (response: AxiosResponse) => {
    return response.data;
  },
  (error: AxiosError) => {
    // 处理响应错误
    if (error.response) {
      const { status, data } = error.response;
      
      switch (status) {
        case 401:
          // 未授权，清除token并触发登出事件
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          
          // 触发全局登出事件，让所有组件知道用户已登出
          window.dispatchEvent(new CustomEvent('userLoggedOut'));
          
          // 如果当前不在登录页面，则跳转到登录页面
          if (!window.location.pathname.includes('/login')) {
            window.location.href = '/login?message=' + encodeURIComponent('登录已过期，请重新登录');
          }
          break;
        case 403:
          // 禁止访问
          console.error('无权限访问');
          break;
        case 404:
          console.error('请求的资源不存在');
          break;
        case 500:
          console.error('服务器内部错误');
          break;
        default:
          console.error('请求失败：', (data as any)?.message || error.message);
      }
    } else if (error.request) {
      console.error('网络错误，请检查网络连接');
    } else {
      console.error('请求配置错误：', error.message);
    }
    
    return Promise.reject(error);
  }
);

export default request;
