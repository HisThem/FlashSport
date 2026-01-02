import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Comment } from '../entities/comment.entity';
import { Post } from '../entities/post.entity';
import {
  CreateCommentDto,
  UpdateCommentDto,
  CommentQueryDto,
} from '../dto/comment.dto';

@Injectable()
export class CommentService {
  constructor(
    @InjectRepository(Comment)
    private commentRepository: Repository<Comment>,
    @InjectRepository(Post)
    private postRepository: Repository<Post>,
  ) {}

  // 创建评论
  async createComment(
    userId: number,
    createCommentDto: CreateCommentDto,
  ): Promise<Comment> {
    const { post_id, content } = createCommentDto;

    const post = await this.postRepository.findOne({ where: { id: post_id } });
    if (!post) {
      throw new NotFoundException('帖子不存在');
    }

    const comment = this.commentRepository.create({
      post_id,
      user_id: userId,
      content,
    });

    const savedComment = await this.commentRepository.save(comment);
    await this.postRepository.increment({ id: post_id }, 'comment_count', 1);

    const commentWithUser = await this.commentRepository.findOne({
      where: { id: savedComment.id },
      relations: ['user'],
    });

    if (!commentWithUser) {
      throw new NotFoundException('评论创建失败');
    }

    return commentWithUser;
  }

  // 获取帖子的评论列表
  async getCommentsByPost(queryDto: CommentQueryDto): Promise<{
    comments: Comment[];
    total: number;
    page: number;
    limit: number;
  }> {
    const { post_id, page = 1, limit = 10 } = queryDto;

    const post = await this.postRepository.findOne({ where: { id: post_id } });
    if (!post) {
      throw new NotFoundException('帖子不存在');
    }

    const [comments, total] = await this.commentRepository.findAndCount({
      where: { post_id },
      order: { create_time: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
      relations: ['user'],
    });

    return {
      comments,
      total,
      page,
      limit,
    };
  }

  // 更新评论
  async updateComment(
    userId: number,
    commentId: number,
    updateCommentDto: UpdateCommentDto,
  ): Promise<Comment> {
    const comment = await this.commentRepository.findOne({
      where: { id: commentId },
      relations: ['user'],
    });

    if (!comment) {
      throw new NotFoundException('评论不存在');
    }

    // 检查是否是评论作者
    if (comment.user_id !== userId) {
      throw new ForbiddenException('只能修改自己的评论');
    }

    // 更新评论
    Object.assign(comment, updateCommentDto);
    return await this.commentRepository.save(comment);
  }

  // 删除评论
  async deleteComment(userId: number, commentId: number): Promise<void> {
    const comment = await this.commentRepository.findOne({
      where: { id: commentId },
      relations: ['user'],
    });

    if (!comment) {
      throw new NotFoundException('评论不存在');
    }

    // 检查是否是评论作者或管理员
    if (comment.user_id !== userId) {
      throw new ForbiddenException('只能删除自己的评论');
    }

    await this.postRepository.decrement({ id: comment.post_id }, 'comment_count', 1);
    await this.commentRepository.remove(comment);
  }

  // 管理员删除评论
  async deleteCommentAsAdmin(commentId: number): Promise<void> {
    const comment = await this.commentRepository.findOne({
      where: { id: commentId },
    });

    if (!comment) {
      throw new NotFoundException('评论不存在');
    }

    await this.postRepository.decrement({ id: comment.post_id }, 'comment_count', 1);
    await this.commentRepository.remove(comment);
  }

  // 获取用户的评论
  async getUserComments(
    userId: number,
    page: number = 1,
    limit: number = 10,
  ): Promise<{
    comments: Comment[];
    total: number;
    page: number;
    limit: number;
  }> {
    const [comments, total] = await this.commentRepository.findAndCount({
      where: { user_id: userId },
      order: { create_time: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
      relations: ['post', 'user'],
    });

    return {
      comments,
      total,
      page,
      limit,
    };
  }

  // 获取单个评论详情
  async getCommentById(commentId: number): Promise<Comment> {
    const comment = await this.commentRepository.findOne({
      where: { id: commentId },
      relations: ['user', 'post'],
    });

    if (!comment) {
      throw new NotFoundException('评论不存在');
    }

    return comment;
  }
}
