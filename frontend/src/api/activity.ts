import request from '../utils/request';
import { ACTIVITY_MODULE } from './_prefix';

// 活动状态枚举
export enum ActivityStatus {
  PREPARING = 'preparing',          // 筹备中
  RECRUITING = 'recruiting',        // 报名中
  REGISTRATION_CLOSED = 'registration_closed', // 报名已截止
  ONGOING = 'ongoing',              // 进行中
  FINISHED = 'finished',            // 已结束
  CANCELLED = 'cancelled'           // 已取消
}

// 费用类型枚举
export enum FeeType {
  FREE = 'free',                // 免费
  AA = 'aa',                   // AA制
  PREPAID_ALL = 'prepaid_all',  // 预付全部费用
  PREPAID_REFUNDABLE = 'prepaid_refundable'  // 预付多退少补
}

// 报名状态枚举
export enum EnrollmentStatus {
  ENROLLED = 'enrolled',        // 已报名
  CANCELLED = 'cancelled'       // 已取消
}

// 活动类别接口
export interface Category {
  id: number;
  name: string;
}

// 活动图片接口
export interface ActivityImage {
  id: number;
  activity_id: number;
  image_url: string;
}

// 活动接口
export interface Activity {
  id: number;
  name: string;
  description: string;
  cover_image_url?: string;
  location: string;
  start_time: string;
  end_time: string;
  registration_deadline: string;
  max_participants: number;
  status: ActivityStatus;
  fee_type: FeeType;
  fee_amount: number;
  organizer_id: number;
  category_id: number;
  created_at?: string;
  updated_at?: string;
  // 关联数据
  organizer?: {
    id: number;
    username: string;
    avatar_url?: string;
  };
  category?: Category;
  images?: ActivityImage[];
  enrollments?: Enrollment[];
  enrollment_count?: number;
  is_enrolled?: boolean;
}

// 报名信息接口
export interface Enrollment {
  id: number;
  activity_id: number;
  user_id: number;
  status: EnrollmentStatus;
  enroll_time: string;
  user?: {
    id: number;
    username: string;
    avatar_url?: string;
  };
}

// 评论接口
export interface Comment {
  id: number;
  activity_id: number;
  user_id: number;
  rating: number;
  content: string;
  create_time: string;
  user?: {
    id: number;
    username: string;
    avatar_url?: string;
  };
}

// 创建活动请求参数
export interface CreateActivityRequest {
  name: string;
  description: string;
  cover_image_url?: string;
  location: string;
  start_time: string;
  end_time: string;
  registration_deadline: string;
  max_participants: number;
  fee_type: FeeType;
  fee_amount: number;
  category_id: number;
  image_urls?: string[];
}

// 更新活动请求参数
export interface UpdateActivityRequest {
  name?: string;
  description?: string;
  cover_image_url?: string;
  location?: string;
  start_time?: string;
  end_time?: string;
  registration_deadline?: string;
  max_participants?: number;
  fee_type?: FeeType;
  fee_amount?: number;
  category_id?: number;
  status?: ActivityStatus;
  image_urls?: string[];
}

// 获取活动列表请求参数
export interface GetActivitiesRequest {
  page?: number;
  limit?: number;
  category_id?: number;
  keyword?: string;
  status?: ActivityStatus;
  sort?: 'newest' | 'oldest' | 'start_time' | 'participants';
}

// 创建评论请求参数
export interface CreateCommentRequest {
  rating: number;
  content: string;
}

// API响应基础结构
export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
}

// 分页响应结构
export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// 活动API类
class ActivityAPI {
  /**
   * 获取活动列表
   * @param params 查询参数
   * @returns Promise<PaginatedResponse<Activity>>
   */
  async getActivities(params: GetActivitiesRequest = {}): Promise<PaginatedResponse<Activity>> {
    const queryParams = new URLSearchParams();
    
    if (params.page) queryParams.append('page', params.page.toString());
    if (params.limit) queryParams.append('limit', params.limit.toString());
    if (params.category_id) queryParams.append('category_id', params.category_id.toString());
    if (params.keyword) queryParams.append('keyword', params.keyword);
    if (params.status) queryParams.append('status', params.status);
    if (params.sort) queryParams.append('sort', params.sort);

    const queryString = queryParams.toString();
    const url = queryString ? `${ACTIVITY_MODULE}?${queryString}` : ACTIVITY_MODULE;
    
    const response: ApiResponse<PaginatedResponse<Activity>> = await request.get(url);
    
    if (response.success && response.data) {
      return response.data;
    }
    
    throw new Error(response.message || '获取活动列表失败');
  }

  /**
   * 获取活动详情
   * @param id 活动ID
   * @returns Promise<Activity>
   */
  async getActivityById(id: number): Promise<Activity> {
    const response: ApiResponse<Activity> = await request.get(`${ACTIVITY_MODULE}/${id}`);
    
    if (response.success && response.data) {
      return response.data;
    }
    
    throw new Error(response.message || '获取活动详情失败');
  }

  /**
   * 创建活动
   * @param activityData 活动数据
   * @returns Promise<Activity>
   */
  async createActivity(activityData: CreateActivityRequest): Promise<Activity> {
    const response: ApiResponse<Activity> = await request.post(ACTIVITY_MODULE, activityData);
    
    if (response.success && response.data) {
      return response.data;
    }
    
    throw new Error(response.message || '创建活动失败');
  }

  /**
   * 更新活动
   * @param id 活动ID
   * @param activityData 活动数据
   * @returns Promise<Activity>
   */
  async updateActivity(id: number, activityData: UpdateActivityRequest): Promise<Activity> {
    const response: ApiResponse<Activity> = await request.put(`${ACTIVITY_MODULE}/${id}`, activityData);
    
    if (response.success && response.data) {
      return response.data;
    }
    
    throw new Error(response.message || '更新活动失败');
  }

  /**
   * 取消活动
   * @param id 活动ID
   * @returns Promise<void>
   */
  async cancelActivity(id: number): Promise<void> {
    const response: ApiResponse = await request.post(`${ACTIVITY_MODULE}/${id}/cancel`);
    
    if (!response.success) {
      throw new Error(response.message || '取消活动失败');
    }
  }

  /**
   * 报名参加活动
   * @param activityId 活动ID
   * @returns Promise<Enrollment>
   */
  async enrollActivity(activityId: number): Promise<Enrollment> {
    const response: ApiResponse<Enrollment> = await request.post(`${ACTIVITY_MODULE}/${activityId}/enroll`);
    
    if (response.success && response.data) {
      return response.data;
    }
    
    throw new Error(response.message || '报名失败');
  }

  /**
   * 取消报名
   * @param activityId 活动ID
   * @returns Promise<void>
   */
  async cancelEnrollment(activityId: number): Promise<void> {
    const response: ApiResponse = await request.delete(`${ACTIVITY_MODULE}/${activityId}/enroll`);
    
    if (!response.success) {
      throw new Error(response.message || '取消报名失败');
    }
  }

  /**
   * 更新活动状态
   * @param activityId 活动ID
   * @param status 新状态
   * @returns Promise<void>
   */
  async updateActivityStatus(activityId: number, status: ActivityStatus): Promise<void> {
    const response: ApiResponse = await request.post(`${ACTIVITY_MODULE}/${activityId}/status`, { status });
    
    if (!response.success) {
      throw new Error(response.message || '更新活动状态失败');
    }
  }

  /**
   * 获取活动报名列表
   * @param activityId 活动ID
   * @returns Promise<Enrollment[]>
   */
  async getActivityEnrollments(activityId: number): Promise<Enrollment[]> {
    const response: ApiResponse<Enrollment[]> = await request.get(`${ACTIVITY_MODULE}/${activityId}/enrollments`);
    
    if (response.success && response.data) {
      return response.data;
    }
    
    throw new Error(response.message || '获取报名列表失败');
  }

  /**
   * 获取活动评论
   * @param activityId 活动ID
   * @returns Promise<Comment[]>
   */
  async getActivityComments(activityId: number): Promise<Comment[]> {
    const response: ApiResponse<Comment[]> = await request.get(`${ACTIVITY_MODULE}/${activityId}/comments`);
    
    if (response.success && response.data) {
      return response.data;
    }
    
    throw new Error(response.message || '获取评论失败');
  }

  /**
   * 创建评论
   * @param activityId 活动ID
   * @param commentData 评论数据
   * @returns Promise<Comment>
   */
  async createComment(activityId: number, commentData: CreateCommentRequest): Promise<Comment> {
    const response: ApiResponse<Comment> = await request.post(`${ACTIVITY_MODULE}/${activityId}/comments`, commentData);
    
    if (response.success && response.data) {
      return response.data;
    }
    
    throw new Error(response.message || '发表评论失败');
  }

  /**
   * 获取活动类别列表
   * @returns Promise<Category[]>
   */
  async getCategories(): Promise<Category[]> {
    const response: ApiResponse<Category[]> = await request.get(`${ACTIVITY_MODULE}/categories`);
    
    if (response.success && response.data) {
      return response.data;
    }
    
    throw new Error(response.message || '获取活动类别失败');
  }

  /**
   * 获取我发布的活动
   * @param params 查询参数
   * @returns Promise<PaginatedResponse<Activity>>
   */
  async getMyActivities(params: GetActivitiesRequest = {}): Promise<PaginatedResponse<Activity>> {
    const queryParams = new URLSearchParams();
    
    if (params.page) queryParams.append('page', params.page.toString());
    if (params.limit) queryParams.append('limit', params.limit.toString());
    if (params.status) queryParams.append('status', params.status);
    if (params.sort) queryParams.append('sort', params.sort);

    const queryString = queryParams.toString();
    const url = queryString ? `${ACTIVITY_MODULE}/my?${queryString}` : `${ACTIVITY_MODULE}/my`;
    
    const response: ApiResponse<PaginatedResponse<Activity>> = await request.get(url);
    
    if (response.success && response.data) {
      return response.data;
    }
    
    throw new Error(response.message || '获取我的活动失败');
  }

  /**
   * 获取我报名的活动
   * @param params 查询参数
   * @returns Promise<PaginatedResponse<Activity>>
   */
  async getMyEnrolledActivities(params: GetActivitiesRequest = {}): Promise<PaginatedResponse<Activity>> {
    const queryParams = new URLSearchParams();
    
    if (params.page) queryParams.append('page', params.page.toString());
    if (params.limit) queryParams.append('limit', params.limit.toString());
    if (params.status) queryParams.append('status', params.status);
    if (params.sort) queryParams.append('sort', params.sort);

    const queryString = queryParams.toString();
    const url = queryString ? `${ACTIVITY_MODULE}/enrolled?${queryString}` : `${ACTIVITY_MODULE}/enrolled`;
    
    const response: ApiResponse<PaginatedResponse<Activity>> = await request.get(url);
    
    if (response.success && response.data) {
      return response.data;
    }
    
    throw new Error(response.message || '获取我的报名活动失败');
  }

  /**
   * 删除活动 (管理员权限)
   * @param activityId 活动ID
   */
  async deleteActivity(activityId: number): Promise<void> {
    const response: ApiResponse = await request.delete(`${ACTIVITY_MODULE}/${activityId}`);
    
    if (!response.success) {
      throw new Error(response.message || '删除活动失败');
    }
  }

  /**
   * 管理员获取所有活动（包含已删除等状态）
   * @param params 查询参数
   */
  async getAllActivitiesForAdmin(params: GetActivitiesRequest = {}): Promise<PaginatedResponse<Activity>> {
    const queryParams = new URLSearchParams();
    if (params.page) queryParams.append('page', params.page.toString());
    if (params.limit) queryParams.append('limit', params.limit.toString());
    if (params.category_id) queryParams.append('category_id', params.category_id.toString());
    if (params.keyword) queryParams.append('keyword', params.keyword);
    if (params.status) queryParams.append('status', params.status);
    if (params.sort) queryParams.append('sort', params.sort);

    const queryString = queryParams.toString();
    const url = queryString ? `${ACTIVITY_MODULE}/admin/all?${queryString}` : `${ACTIVITY_MODULE}/admin/all`;
    
    const response: ApiResponse<PaginatedResponse<Activity>> = await request.get(url);
    
    if (response.success && response.data) {
      return response.data;
    }
    
    throw new Error(response.message || '获取活动列表失败');
  }

  /**
   * 管理员删除活动
   * @param id 活动ID
   */
  async deleteActivityAsAdmin(id: number): Promise<void> {
    const response: ApiResponse = await request.delete(`${ACTIVITY_MODULE}/admin/${id}`);
    
    if (!response.success) {
      throw new Error(response.message || '删除活动失败');
    }
  }

  /**
   * 管理员取消活动
   * @param id 活动ID
   */
  async cancelActivityAsAdmin(id: number): Promise<void> {
    const response: ApiResponse = await request.post(`${ACTIVITY_MODULE}/admin/${id}/cancel`);
    
    if (!response.success) {
      throw new Error(response.message || '取消活动失败');
    }
  }

  /**
   * 管理员更新活动状态
   * @param id 活动ID
   * @param status 新状态
   */
  async updateActivityStatusAsAdmin(id: number, status: ActivityStatus): Promise<void> {
    const response: ApiResponse = await request.post(`${ACTIVITY_MODULE}/admin/${id}/status`, {
      status
    });
    
    if (!response.success) {
      throw new Error(response.message || '更新活动状态失败');
    }
  }
}

// 创建并导出活动API实例
const activityAPI = new ActivityAPI();
export default activityAPI;
