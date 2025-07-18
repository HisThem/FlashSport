/**
 * 日期格式化工具函数
 */

/**
 * 格式化日期为 YYYY-MM-DD 格式
 * @param dateString 日期字符串
 * @returns 格式化后的日期字符串
 */
export const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).replace(/\//g, '-');
};

/**
 * 格式化时间为 HH:MM 格式
 * @param dateString 日期字符串
 * @returns 格式化后的时间字符串
 */
export const formatTime = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleTimeString('zh-CN', {
    hour: '2-digit',
    minute: '2-digit'
  });
};

/**
 * 格式化日期时间为 YYYY-MM-DD HH:MM 格式
 * @param dateString 日期字符串
 * @returns 格式化后的日期时间字符串
 */
export const formatDateTime = (dateString: string): string => {
  return `${formatDate(dateString)} ${formatTime(dateString)}`;
};

/**
 * 检查日期是否已过期
 * @param dateString 日期字符串
 * @returns 是否已过期
 */
export const isExpired = (dateString: string): boolean => {
  const date = new Date(dateString);
  const now = new Date();
  return date < now;
};

/**
 * 获取相对时间描述
 * @param dateString 日期字符串
 * @returns 相对时间描述
 */
export const getRelativeTime = (dateString: string): string => {
  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) {
    return '刚刚';
  }

  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) {
    return `${diffInMinutes}分钟前`;
  }

  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) {
    return `${diffInHours}小时前`;
  }

  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 30) {
    return `${diffInDays}天前`;
  }

  const diffInMonths = Math.floor(diffInDays / 30);
  if (diffInMonths < 12) {
    return `${diffInMonths}个月前`;
  }

  const diffInYears = Math.floor(diffInMonths / 12);
  return `${diffInYears}年前`;
};

/**
 * 获取剩余时间描述
 * @param dateString 日期字符串
 * @returns 剩余时间描述
 */
export const getTimeLeft = (dateString: string): string => {
  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((date.getTime() - now.getTime()) / 1000);

  if (diffInSeconds <= 0) {
    return '已截止';
  }

  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) {
    return `${diffInMinutes}分钟后截止`;
  }

  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) {
    return `${diffInHours}小时后截止`;
  }

  const diffInDays = Math.floor(diffInHours / 24);
  return `${diffInDays}天后截止`;
};

/**
 * 检查日期是否在今天
 * @param dateString 日期字符串
 * @returns 是否在今天
 */
export const isToday = (dateString: string): boolean => {
  const date = new Date(dateString);
  const today = new Date();
  return date.toDateString() === today.toDateString();
};

/**
 * 检查日期是否在明天
 * @param dateString 日期字符串
 * @returns 是否在明天
 */
export const isTomorrow = (dateString: string): boolean => {
  const date = new Date(dateString);
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  return date.toDateString() === tomorrow.toDateString();
};

/**
 * 获取友好的日期显示
 * @param dateString 日期字符串
 * @returns 友好的日期显示
 */
export const getFriendlyDate = (dateString: string): string => {
  if (isToday(dateString)) {
    return `今天 ${formatTime(dateString)}`;
  }
  
  if (isTomorrow(dateString)) {
    return `明天 ${formatTime(dateString)}`;
  }
  
  return formatDateTime(dateString);
};

/**
 * 将本地日期时间转换为ISO字符串
 * @param dateString 本地日期字符串 (YYYY-MM-DDTHH:MM)
 * @returns ISO日期字符串
 */
export const toISOString = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toISOString();
};

/**
 * 将ISO日期字符串转换为本地日期时间格式
 * @param isoString ISO日期字符串
 * @returns 本地日期时间字符串 (YYYY-MM-DDTHH:MM)
 */
export const fromISOString = (isoString: string): string => {
  const date = new Date(isoString);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  
  return `${year}-${month}-${day}T${hours}:${minutes}`;
};
