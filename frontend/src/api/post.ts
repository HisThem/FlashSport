import request from '../utils/request';
import { POST_MODULE } from './_prefix';

export interface Post {
  id: number;
  content: string;
  cover_image_url?: string;
  activity_id?: number;
  author_id: number;
  like_count: number;
  comment_count: number;
  created_at: string;
  updated_at: string;
  author: {
    id: number;
    username: string;
    avatar_url?: string;
  };
  activity?: {
    id: number;
    name: string;
    cover_image_url?: string;
  };
}

export interface CreatePostPayload {
  content: string;
  cover_image_url?: string;
  activity_id?: number;
}

export interface UpdatePostPayload {
  content?: string;
  cover_image_url?: string;
  activity_id?: number;
}

export interface PostResponse {
  items: Post[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

const postAPI = {
  // 创建帖子
  createPost: async (payload: CreatePostPayload): Promise<Post> => {
    const res = await request.post(`${POST_MODULE}`, payload);
    return res.data;
  },

  // 获取帖子列表
  getPosts: async (
    page: number = 1,
    limit: number = 10,
    activityId?: number,
  ): Promise<PostResponse> => {
    const params: any = { page, limit };
    if (activityId) {
      params.activity_id = activityId;
    }
    const res = await request.get(`${POST_MODULE}`, { params });
    return res.data;
  },

  // 获取单个帖子
  getPostById: async (id: number): Promise<Post> => {
    const res = await request.get(`${POST_MODULE}/${id}`);
    return res.data;
  },

  // 更新帖子
  updatePost: async (id: number, payload: UpdatePostPayload): Promise<Post> => {
    const res = await request.put(`${POST_MODULE}/${id}`, payload);
    return res.data;
  },

  // 删除帖子
  deletePost: async (id: number): Promise<void> => {
    await request.delete(`${POST_MODULE}/${id}`);
  },

  // 点赞帖子
  likePost: async (id: number): Promise<Post> => {
    const res = await request.post(`${POST_MODULE}/${id}/like`, {});
    return res.data;
  },

  // 取消点赞
  unlikePost: async (id: number): Promise<Post> => {
    const res = await request.delete(`${POST_MODULE}/${id}/like`);
    return res.data;
  },
};

export default postAPI;
