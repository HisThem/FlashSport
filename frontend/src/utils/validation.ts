/**
 * API错误处理工具
 */

export interface ApiError {
  message: string;
  status?: number;
  code?: string;
}

/**
 * 处理API错误，返回用户友好的错误消息
 * @param error 错误对象
 * @returns 处理后的错误信息
 */
export const handleApiError = (error: unknown): ApiError => {
  // 如果是自定义的API错误
  if (error && typeof error === 'object' && 'response' in error) {
    const axiosError = error as any;
    const { status, data } = axiosError.response || {};
    
    return {
      message: data?.message || getDefaultErrorMessage(status),
      status,
      code: data?.code
    };
  }
  
  // 网络错误或请求配置错误
  if (error && typeof error === 'object' && 'request' in error) {
    return {
      message: '网络连接失败，请检查网络设置',
      status: 0
    };
  }
  
  // 其他错误
  const message = error instanceof Error ? error.message : '未知错误';
  return {
    message,
  };
};

/**
 * 根据HTTP状态码返回默认错误消息
 * @param status HTTP状态码
 * @returns 错误消息
 */
const getDefaultErrorMessage = (status: number): string => {
  switch (status) {
    case 400:
      return '请求参数错误';
    case 401:
      return '未授权，请重新登录';
    case 403:
      return '没有权限执行此操作';
    case 404:
      return '请求的资源不存在';
    case 409:
      return '资源冲突，可能已存在';
    case 422:
      return '请求数据验证失败';
    case 429:
      return '请求过于频繁，请稍后再试';
    case 500:
      return '服务器内部错误';
    case 502:
      return '网关错误';
    case 503:
      return '服务暂时不可用';
    default:
      return '请求失败';
  }
};

/**
 * 验证器函数类型
 */
export type ValidatorFunction = (value: string) => string | undefined;

/**
 * 表单验证工具
 */
export class FormValidator {
  /**
   * 验证邮箱格式
   */
  static email: ValidatorFunction = (email: string) => {
    if (!email) return '邮箱不能为空';
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) return '请输入有效的邮箱地址';
    return undefined;
  };

  /**
   * 验证用户名
   */
  static username: ValidatorFunction = (username: string) => {
    if (!username) return '用户名不能为空';
    if (username.length < 3) return '用户名至少需要3个字符';
    if (username.length > 20) return '用户名不能超过20个字符';
    if (!/^[a-zA-Z0-9_\u4e00-\u9fa5]+$/.test(username)) {
      return '用户名只能包含字母、数字、下划线和中文';
    }
    return undefined;
  };

  /**
   * 验证密码
   */
  static password: ValidatorFunction = (password: string) => {
    if (!password) return '密码不能为空';
    if (password.length < 6) return '密码长度至少为6位';
    if (password.length > 128) return '密码长度不能超过128位';
    return undefined;
  };

  /**
   * 验证确认密码
   */
  static confirmPassword = (password: string): ValidatorFunction => {
    return (confirmPassword: string) => {
      if (!confirmPassword) return '请确认密码';
      if (password !== confirmPassword) return '两次输入的密码不一致';
      return undefined;
    };
  };

  /**
   * 验证手机号
   */
  static phone: ValidatorFunction = (phone: string) => {
    if (!phone) return undefined; // 手机号是可选的
    const phoneRegex = /^1[3-9]\d{9}$/;
    if (!phoneRegex.test(phone)) return '请输入有效的手机号码';
    return undefined;
  };

  /**
   * 验证URL
   */
  static url: ValidatorFunction = (url: string) => {
    if (!url) return undefined; // URL是可选的
    try {
      new URL(url);
      return undefined;
    } catch {
      return '请输入有效的URL地址';
    }
  };
}

/**
 * 基础验证函数
 */

/**
 * 验证必填字段
 * @param value 值
 * @returns 是否通过验证
 */
export const validateRequired = (value: any): boolean => {
  if (value === null || value === undefined) return false;
  if (typeof value === 'string') return value.trim() !== '';
  if (typeof value === 'number') return !isNaN(value);
  return true;
};

/**
 * 验证数字
 * @param value 值
 * @param min 最小值（可选）
 * @param max 最大值（可选）
 * @returns 是否通过验证
 */
export const validateNumber = (value: number, min?: number, max?: number): boolean => {
  if (isNaN(value)) return false;
  if (min !== undefined && value < min) return false;
  if (max !== undefined && value > max) return false;
  return true;
};

/**
 * 验证日期
 * @param value 日期字符串
 * @returns 是否通过验证
 */
export const validateDate = (value: string): boolean => {
  if (!value) return false;
  const date = new Date(value);
  return !isNaN(date.getTime());
};

/**
 * 防抖函数
 * @param func 要防抖的函数
 * @param delay 延迟时间（毫秒）
 * @returns 防抖后的函数
 */
export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  delay: number
): ((...args: Parameters<T>) => void) => {
  let timeoutId: number;
  
  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = window.setTimeout(() => func(...args), delay);
  };
};
