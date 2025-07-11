import request from '../utils/request';

// 用户相关的类型定义
export interface User {
  id: number;
  username: string;
  email: string;
  avatar_url?: string;
  role: 'admin' | 'user';
  created_at?: string;
  updated_at?: string;
}

// 登录请求参数
export interface LoginRequest {
  email: string;
  password: string;
}

// 注册请求参数
export interface RegisterRequest {
  username: string;
  email: string;
  password: string;
  confirmPassword: string;
  agreeTerms?: boolean; // 前端表单用，不会发送到后端
}

// 登录响应
export interface LoginResponse {
  success: boolean;
  message: string;
  data: {
    user: User;
    token: string;
  };
}

// 注册响应
export interface RegisterResponse {
  success: boolean;
  message: string;
  data?: {
    user: User;
  };
}

// API响应基础结构
export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
}

// 用户API类
class UserAPI {
  /**
   * 用户登录
   * @param loginData 登录数据
   * @returns Promise<LoginResponse>
   */
  async login(loginData: LoginRequest): Promise<LoginResponse> {
    try {
      const response: LoginResponse = await request.post('/auth/login', loginData);
      
      // 登录成功后保存用户信息和token到localStorage
      if (response.success && response.data) {
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('user', JSON.stringify(response.data.user));
      }
      
      return response;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || '登录失败');
    }
  }

  /**
   * 用户注册
   * @param registerData 注册数据
   * @returns Promise<RegisterResponse>
   */
  async register(registerData: RegisterRequest): Promise<RegisterResponse> {
    try {
      // 前端验证
      if (registerData.password !== registerData.confirmPassword) {
        throw new Error('两次输入的密码不一致');
      }

      if (registerData.password.length < 6) {
        throw new Error('密码长度至少为6位');
      }

      if (!registerData.agreeTerms) {
        throw new Error('请同意服务条款和隐私政策');
      }

      // 发送注册请求，不包含confirmPassword和agreeTerms字段
      const { confirmPassword: _confirmPassword, agreeTerms: _agreeTerms, ...requestData } = registerData;
      const response: RegisterResponse = await request.post('/auth/register', requestData);
      
      return response;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || error.message || '注册失败');
    }
  }

  /**
   * 用户登出
   */
  async logout(): Promise<void> {
    try {
      await request.post('/auth/logout');
    } catch (error) {
      console.error('登出请求失败:', error);
    } finally {
      // 无论请求是否成功，都清除本地存储
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    }
  }

  /**
   * 获取当前用户信息
   * @returns Promise<User>
   */
  async getCurrentUser(): Promise<User> {
    try {
      const response: ApiResponse<User> = await request.get('/user/profile');
      
      if (response.success && response.data) {
        // 更新本地存储的用户信息
        localStorage.setItem('user', JSON.stringify(response.data));
        return response.data;
      }
      
      throw new Error(response.message || '获取用户信息失败');
    } catch (error: any) {
      throw new Error(error.response?.data?.message || '获取用户信息失败');
    }
  }

  /**
   * 更新用户信息
   * @param userData 要更新的用户数据
   * @returns Promise<User>
   */
  async updateProfile(userData: Partial<Pick<User, 'username' | 'avatar_url'>>): Promise<User> {
    try {
      const response: ApiResponse<User> = await request.put('/user/profile', userData);
      
      if (response.success && response.data) {
        // 更新本地存储的用户信息
        localStorage.setItem('user', JSON.stringify(response.data));
        return response.data;
      }
      
      throw new Error(response.message || '更新用户信息失败');
    } catch (error: any) {
      throw new Error(error.response?.data?.message || '更新用户信息失败');
    }
  }

  /**
   * 修改密码
   * @param passwordData 密码数据
   * @returns Promise<ApiResponse>
   */
  async changePassword(passwordData: {
    oldPassword: string;
    newPassword: string;
    confirmNewPassword: string;
  }): Promise<ApiResponse> {
    try {
      if (passwordData.newPassword !== passwordData.confirmNewPassword) {
        throw new Error('两次输入的新密码不一致');
      }

      if (passwordData.newPassword.length < 6) {
        throw new Error('新密码长度至少为6位');
      }

      const { confirmNewPassword: _confirmNewPassword, ...requestData } = passwordData;
      const response: ApiResponse = await request.put('/user/change-password', requestData);
      
      return response;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || error.message || '修改密码失败');
    }
  }

  /**
   * 检查邮箱是否已存在
   * @param email 邮箱地址
   * @returns Promise<boolean>
   */
  async checkEmailExists(email: string): Promise<boolean> {
    try {
      const response: ApiResponse<{ exists: boolean }> = await request.get(`/auth/check-email?email=${encodeURIComponent(email)}`);
      return response.data?.exists || false;
    } catch (error) {
      console.error('检查邮箱失败:', error);
      return false;
    }
  }

  /**
   * 检查用户名是否已存在
   * @param username 用户名
   * @returns Promise<boolean>
   */
  async checkUsernameExists(username: string): Promise<boolean> {
    try {
      const response: ApiResponse<{ exists: boolean }> = await request.get(`/auth/check-username?username=${encodeURIComponent(username)}`);
      return response.data?.exists || false;
    } catch (error) {
      console.error('检查用户名失败:', error);
      return false;
    }
  }

  /**
   * 从本地存储获取当前用户信息
   * @returns User | null
   */
  getCurrentUserFromStorage(): User | null {
    try {
      const userStr = localStorage.getItem('user');
      return userStr ? JSON.parse(userStr) : null;
    } catch (error) {
      console.error('解析用户信息失败:', error);
      return null;
    }
  }

  /**
   * 检查用户是否已登录
   * @returns boolean
   */
  isLoggedIn(): boolean {
    const token = localStorage.getItem('token');
    const user = this.getCurrentUserFromStorage();
    return !!(token && user);
  }

  /**
   * 获取存储的token
   * @returns string | null
   */
  getToken(): string | null {
    return localStorage.getItem('token');
  }
}

// 创建并导出用户API实例
const userAPI = new UserAPI();
export default userAPI;

