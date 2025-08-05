import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Comment } from '../entities/comment.entity';
import { Activity } from '../entities/activity.entity';
import { Enrollment } from '../entities/enrollment.entity';
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
    @InjectRepository(Activity)
    private activityRepository: Repository<Activity>,
    @InjectRepository(Enrollment)
    private enrollmentRepository: Repository<Enrollment>,
  ) {}

  // 创建评论
  async createComment(
    userId: number,
    createCommentDto: CreateCommentDto,
  ): Promise<Comment> {
    const { activity_id, rating, content } = createCommentDto;

    // 检查活动是否存在
    const activity = await this.activityRepository.findOne({
      where: { id: activity_id },
    });
    if (!activity) {
      throw new NotFoundException('活动不存在');
    }

    // 检查用户是否参加了该活动
    const enrollment = await this.enrollmentRepository.findOne({
      where: {
        activity_id: activity_id,
        user_id: userId,
      },
    });
    if (!enrollment) {
      throw new ForbiddenException('只有参加过活动的用户才能评论');
    }

    // 创建评论
    const comment = this.commentRepository.create({
      activity_id,
      user_id: userId,
      rating,
      content,
    });

    const savedComment = await this.commentRepository.save(comment);

    // 重新查询评论以获取完整的用户信息
    const commentWithUser = await this.commentRepository.findOne({
      where: { id: savedComment.id },
      relations: ['user'],
    });

    if (!commentWithUser) {
      throw new NotFoundException('评论创建失败');
    }

    return commentWithUser;
  }

  // 获取活动的评论列表
  async getCommentsByActivity(queryDto: CommentQueryDto): Promise<{
    comments: Comment[];
    total: number;
    page: number;
    limit: number;
    average_rating: number;
  }> {
    const { activity_id, page = 1, limit = 10 } = queryDto;

    // 检查活动是否存在
    const activity = await this.activityRepository.findOne({
      where: { id: activity_id },
    });
    if (!activity) {
      throw new NotFoundException('活动不存在');
    }

    // 获取评论列表
    const [comments, total] = await this.commentRepository.findAndCount({
      where: { activity_id },
      order: { create_time: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
      relations: ['user'],
    });

    // 计算平均评分
    const avgResult: { average?: string } =
      (await this.commentRepository
        .createQueryBuilder('comment')
        .select('AVG(comment.rating)', 'average')
        .where('comment.activity_id = :activity_id', { activity_id })
        .getRawOne()) || {};

    const average_rating = avgResult.average
      ? parseFloat(avgResult.average)
      : 0;

    return {
      comments,
      total,
      page,
      limit,
      average_rating: Math.round(average_rating * 10) / 10, // 保留一位小数
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
      relations: ['activity', 'user'],
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
      relations: ['user', 'activity'],
    });

    if (!comment) {
      throw new NotFoundException('评论不存在');
    }

    return comment;
  }
}
