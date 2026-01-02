import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { Post } from '../entities/post.entity';
import { Activity } from '../entities/activity.entity';
import { User } from '../entities/user.entity';
import { CreatePostDto, UpdatePostDto, PostQueryDto } from '../dto/post.dto';

@Injectable()
export class PostService {
  constructor(
    @InjectRepository(Post)
    private postRepository: Repository<Post>,
    @InjectRepository(Activity)
    private activityRepository: Repository<Activity>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  async createPost(
    authorId: number,
    createPostDto: CreatePostDto,
  ): Promise<Post> {
    const { activity_id } = createPostDto;

    // 验证内容不为空
    if (!createPostDto.content || createPostDto.content.trim() === '') {
      throw new BadRequestException('帖子内容不能为空');
    }

    // 如果指定了活动，验证活动是否存在
    if (activity_id) {
      const activity = await this.activityRepository.findOne({
        where: { id: activity_id },
      });
      if (!activity) {
        throw new NotFoundException('关联的活动不存在');
      }
    }

    const post = this.postRepository.create();
    post.content = createPostDto.content;
    post.cover_image_url = createPostDto.cover_image_url;
    post.author_id = authorId;
    post.activity_id = activity_id || null;

    const savedPost = await this.postRepository.save(post);
    return await this.getPostById(savedPost.id);
  }

  async getPosts(queryDto: PostQueryDto): Promise<{
    items: Post[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const { page = 1, limit = 10, activity_id } = queryDto;
    const skip = (page - 1) * limit;

    let query = this.postRepository
      .createQueryBuilder('post')
      .leftJoinAndSelect('post.author', 'author')
      .leftJoinAndSelect('post.activity', 'activity');

    if (activity_id) {
      query = query.where('post.activity_id = :activity_id', { activity_id });
    }

    // 按创建时间倒序排列
    query = query.orderBy('post.created_at', 'DESC');

    const [items, total] = await query.skip(skip).take(limit).getManyAndCount();

    const missingAuthorPosts = items.filter((post) => !post.author);
    if (missingAuthorPosts.length > 0) {
      const authorIds = Array.from(
        new Set(missingAuthorPosts.map((post) => post.author_id)),
      );
      const authors = await this.userRepository.find({
        where: { id: In(authorIds) },
      });
      const authorMap = new Map(authors.map((user) => [user.id, user]));
      missingAuthorPosts.forEach((post) => {
        const author = authorMap.get(post.author_id);
        if (author) {
          post.author = author;
        }
      });
    }

    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async getPostById(id: number): Promise<Post> {
    const post = await this.postRepository.findOne({
      where: { id },
      relations: {
        author: true,
        activity: true,
      },
    });

    if (!post) {
      throw new NotFoundException(`帖子 ID ${id} 不存在`);
    }

    if (!post.author) {
      const author = await this.userRepository.findOne({
        where: { id: post.author_id },
      });
      if (author) {
        post.author = author;
      }
    }

    return post;
  }

  async updatePost(
    id: number,
    authorId: number,
    updatePostDto: UpdatePostDto,
  ): Promise<Post> {
    const post = await this.getPostById(id);

    // 验证是否为帖子作者
    if (post.author_id !== authorId) {
      throw new ForbiddenException('只能编辑自己的帖子');
    }

    // 验证内容
    if (updatePostDto.content && updatePostDto.content.trim() === '') {
      throw new BadRequestException('帖子内容不能为空');
    }

    // 如果更新活动关联，验证活动是否存在
    if (updatePostDto.activity_id) {
      const activity = await this.activityRepository.findOne({
        where: { id: updatePostDto.activity_id },
      });
      if (!activity) {
        throw new NotFoundException('关联的活动不存在');
      }
    }

    Object.assign(post, updatePostDto);
    const savedPost = await this.postRepository.save(post);
    return await this.getPostById(savedPost.id);
  }

  async deletePost(id: number, authorId: number): Promise<void> {
    const post = await this.getPostById(id);

    // 验证是否为帖子作者
    if (post.author_id !== authorId) {
      throw new ForbiddenException('只能删除自己的帖子');
    }

    await this.postRepository.delete(id);
  }

  async incrementLikeCount(id: number): Promise<Post> {
    const post = await this.getPostById(id);
    post.like_count = (post.like_count || 0) + 1;
    return await this.postRepository.save(post);
  }

  async decrementLikeCount(id: number): Promise<Post> {
    const post = await this.getPostById(id);
    post.like_count = Math.max(0, (post.like_count || 0) - 1);
    return await this.postRepository.save(post);
  }
}
