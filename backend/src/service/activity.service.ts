import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Activity, ActivityStatus } from '../entities/activity.entity';
import { Category } from '../entities/category.entity';
import { Enrollment, EnrollmentStatus } from '../entities/enrollment.entity';
import { Comment } from '../entities/comment.entity';
import { ActivityImage } from '../entities/activity-image.entity';
import {
  CreateActivityDto,
  UpdateActivityDto,
  ActivityQueryDto,
  CreateCommentDto,
} from '../dto/activity.dto';

@Injectable()
export class ActivityService {
  constructor(
    @InjectRepository(Activity)
    private activityRepository: Repository<Activity>,
    @InjectRepository(Category)
    private categoryRepository: Repository<Category>,
    @InjectRepository(Enrollment)
    private enrollmentRepository: Repository<Enrollment>,
    @InjectRepository(Comment)
    private commentRepository: Repository<Comment>,
    @InjectRepository(ActivityImage)
    private activityImageRepository: Repository<ActivityImage>,
  ) {}

  async createActivity(
    organizerId: number,
    createActivityDto: CreateActivityDto,
  ): Promise<Activity> {
    const { image_urls, ...activityData } = createActivityDto;

    // 验证分类是否存在
    const category = await this.categoryRepository.findOne({
      where: { id: createActivityDto.category_id },
    });
    if (!category) {
      throw new NotFoundException('活动分类不存在');
    }

    // 验证时间逻辑
    const startTime = new Date(createActivityDto.start_time);
    const endTime = new Date(createActivityDto.end_time);
    const registrationDeadline = new Date(
      createActivityDto.registration_deadline,
    );

    if (endTime <= startTime) {
      throw new BadRequestException('活动结束时间必须晚于开始时间');
    }

    if (registrationDeadline >= startTime) {
      throw new BadRequestException('报名截止时间必须早于活动开始时间');
    }

    if (registrationDeadline <= new Date()) {
      throw new BadRequestException('报名截止时间不能早于当前时间');
    }

    // 创建活动
    const activity = this.activityRepository.create({
      ...activityData,
      organizer_id: organizerId,
      start_time: startTime,
      end_time: endTime,
      registration_deadline: registrationDeadline,
    });

    const savedActivity = await this.activityRepository.save(activity);

    // 保存活动图片
    if (image_urls && image_urls.length > 0) {
      const images = image_urls.map((url) =>
        this.activityImageRepository.create({
          activity_id: savedActivity.id,
          image_url: url,
        }),
      );
      await this.activityImageRepository.save(images);
    }

    return this.getActivityById(savedActivity.id);
  }

  async getActivities(queryDto: ActivityQueryDto): Promise<{
    items: Activity[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const {
      page = 1,
      limit = 10,
      category_id,
      keyword,
      status,
      fee_type,
      sort = 'newest',
    } = queryDto;
    const skip = (page - 1) * limit;

    const queryBuilder = this.activityRepository
      .createQueryBuilder('activity')
      .leftJoinAndSelect('activity.organizer', 'organizer')
      .leftJoinAndSelect('activity.category', 'category')
      .leftJoinAndSelect('activity.images', 'images')
      .leftJoinAndSelect(
        'activity.enrollments',
        'enrollments',
        'enrollments.status = :enrolledStatus',
        {
          enrolledStatus: EnrollmentStatus.ENROLLED,
        },
      )
      .leftJoinAndSelect('enrollments.user', 'enrollmentUser');

    if (category_id) {
      queryBuilder.andWhere('activity.category_id = :category_id', {
        category_id,
      });
    }

    if (status) {
      queryBuilder.andWhere('activity.status = :status', { status });
    }

    if (fee_type) {
      queryBuilder.andWhere('activity.fee_type = :fee_type', { fee_type });
    }

    if (keyword) {
      queryBuilder.andWhere(
        '(activity.name LIKE :keyword OR activity.description LIKE :keyword OR activity.location LIKE :keyword)',
        { keyword: `%${keyword}%` },
      );
    }

    // 添加排序逻辑
    switch (sort) {
      case 'newest':
        queryBuilder.orderBy('activity.created_at', 'DESC');
        break;
      case 'oldest':
        queryBuilder.orderBy('activity.created_at', 'ASC');
        break;
      case 'start_time':
        queryBuilder.orderBy('activity.start_time', 'ASC');
        break;
      case 'participants':
        queryBuilder
          .addSelect('COUNT(enrollments.id)', 'enrollment_count')
          .groupBy('activity.id')
          .addGroupBy('organizer.id')
          .addGroupBy('category.id')
          .orderBy('enrollment_count', 'DESC');
        break;
      default:
        queryBuilder.orderBy('activity.created_at', 'DESC');
    }

    queryBuilder.skip(skip).take(limit);

    const [activities, total] = await queryBuilder.getManyAndCount();
    const totalPages = Math.ceil(total / limit);

    return {
      items: activities,
      total,
      page,
      limit,
      totalPages,
    };
  }

  async getActivityById(id: number): Promise<Activity> {
    const activity = await this.activityRepository
      .createQueryBuilder('activity')
      .leftJoinAndSelect('activity.organizer', 'organizer')
      .leftJoinAndSelect('activity.category', 'category')
      .leftJoinAndSelect('activity.images', 'images')
      .leftJoinAndSelect('activity.enrollments', 'enrollments')
      .leftJoinAndSelect('enrollments.user', 'enrollmentUser')
      .leftJoinAndSelect('activity.comments', 'comments')
      .leftJoinAndSelect('comments.user', 'commentUser')
      .where('activity.id = :id', { id })
      .orderBy('comments.create_time', 'DESC')
      .getOne();

    if (!activity) {
      throw new NotFoundException('活动不存在');
    }

    return activity;
  }

  async updateActivity(
    id: number,
    userId: number,
    updateActivityDto: UpdateActivityDto,
  ): Promise<Activity> {
    const activity = await this.getActivityById(id);

    // 检查权限：只有活动组织者可以修改
    if (activity.organizer_id !== userId) {
      throw new ForbiddenException('只有活动组织者可以修改活动');
    }

    // 检查活动状态：只有筹备中或报名中的活动可以修改
    if (
      activity.status === ActivityStatus.FINISHED ||
      activity.status === ActivityStatus.CANCELLED
    ) {
      throw new ForbiddenException('已结束或已取消的活动不能修改');
    }

    const { image_urls, ...updateData } = updateActivityDto;

    // 验证时间逻辑（如果有更新时间）
    if (
      updateData.start_time ||
      updateData.end_time ||
      updateData.registration_deadline
    ) {
      const startTime = updateData.start_time
        ? new Date(updateData.start_time)
        : activity.start_time;
      const endTime = updateData.end_time
        ? new Date(updateData.end_time)
        : activity.end_time;
      const registrationDeadline = updateData.registration_deadline
        ? new Date(updateData.registration_deadline)
        : activity.registration_deadline;

      if (endTime <= startTime) {
        throw new BadRequestException('活动结束时间必须晚于开始时间');
      }

      if (registrationDeadline >= startTime) {
        throw new BadRequestException('报名截止时间必须早于活动开始时间');
      }
    }

    // 验证分类是否存在（如果有更新分类）
    if (updateData.category_id) {
      const category = await this.categoryRepository.findOne({
        where: { id: updateData.category_id },
      });
      if (!category) {
        throw new NotFoundException('活动分类不存在');
      }
    }

    // 更新活动信息
    Object.assign(activity, updateData);
    if (updateData.start_time)
      activity.start_time = new Date(updateData.start_time);
    if (updateData.end_time) activity.end_time = new Date(updateData.end_time);
    if (updateData.registration_deadline)
      activity.registration_deadline = new Date(
        updateData.registration_deadline,
      );

    await this.activityRepository.save(activity);

    // 更新活动图片
    if (image_urls !== undefined) {
      // 删除旧图片
      await this.activityImageRepository.delete({ activity_id: id });

      // 添加新图片
      if (image_urls.length > 0) {
        const images = image_urls.map((url) =>
          this.activityImageRepository.create({
            activity_id: id,
            image_url: url,
          }),
        );
        await this.activityImageRepository.save(images);
      }
    }

    return this.getActivityById(id);
  }

  async enrollActivity(activityId: number, userId: number): Promise<void> {
    const activity = await this.getActivityById(activityId);

    // 检查活动状态
    if (activity.status !== ActivityStatus.RECRUITING) {
      throw new BadRequestException('该活动当前不接受报名');
    }

    // 检查报名截止时间
    if (new Date() > activity.registration_deadline) {
      throw new BadRequestException('报名时间已截止');
    }

    // 检查是否已报名
    const existingEnrollment = await this.enrollmentRepository.findOne({
      where: {
        activity_id: activityId,
        user_id: userId,
        status: EnrollmentStatus.ENROLLED,
      },
    });

    if (existingEnrollment) {
      throw new ConflictException('您已报名该活动');
    }

    // 检查人数限制
    const enrolledCount = await this.enrollmentRepository.count({
      where: {
        activity_id: activityId,
        status: EnrollmentStatus.ENROLLED,
      },
    });

    if (enrolledCount >= activity.max_participants) {
      throw new BadRequestException('活动人数已满');
    }

    // 创建报名记录
    const enrollment = this.enrollmentRepository.create({
      activity_id: activityId,
      user_id: userId,
    });

    await this.enrollmentRepository.save(enrollment);
  }

  async cancelEnrollment(activityId: number, userId: number): Promise<void> {
    const enrollment = await this.enrollmentRepository.findOne({
      where: {
        activity_id: activityId,
        user_id: userId,
        status: EnrollmentStatus.ENROLLED,
      },
    });

    if (!enrollment) {
      throw new NotFoundException('未找到报名记录');
    }

    enrollment.status = EnrollmentStatus.CANCELLED;
    await this.enrollmentRepository.save(enrollment);
  }

  async addComment(
    activityId: number,
    userId: number,
    createCommentDto: CreateCommentDto,
  ): Promise<Comment> {
    // 检查活动是否存在
    await this.getActivityById(activityId);

    const comment = this.commentRepository.create({
      activity_id: activityId,
      user_id: userId,
      ...createCommentDto,
    });

    return await this.commentRepository.save(comment);
  }

  async getCategories(): Promise<Category[]> {
    return await this.categoryRepository.find();
  }

  async initializeCategories(): Promise<void> {
    const categories = ['生活', '健身', '乒乓球', '篮球', '足球'];

    for (const categoryName of categories) {
      const existingCategory = await this.categoryRepository.findOne({
        where: { name: categoryName },
      });

      if (!existingCategory) {
        const category = this.categoryRepository.create({ name: categoryName });
        await this.categoryRepository.save(category);
      }
    }
  }

  async getMyActivities(
    userId: number,
    queryDto: ActivityQueryDto,
  ): Promise<{
    items: Activity[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const { page = 1, limit = 10, status } = queryDto;
    const skip = (page - 1) * limit;

    const queryBuilder = this.activityRepository
      .createQueryBuilder('activity')
      .leftJoinAndSelect('activity.organizer', 'organizer')
      .leftJoinAndSelect('activity.category', 'category')
      .leftJoinAndSelect('activity.images', 'images')
      .leftJoinAndSelect(
        'activity.enrollments',
        'enrollments',
        'enrollments.status = :enrolledStatus',
        {
          enrolledStatus: EnrollmentStatus.ENROLLED,
        },
      )
      .leftJoinAndSelect('enrollments.user', 'enrollmentUser')
      .where('activity.organizer_id = :userId', { userId });

    if (status) {
      queryBuilder.andWhere('activity.status = :status', { status });
    }

    queryBuilder.orderBy('activity.created_at', 'DESC').skip(skip).take(limit);

    const [activities, total] = await queryBuilder.getManyAndCount();
    const totalPages = Math.ceil(total / limit);

    return {
      items: activities,
      total,
      page,
      limit,
      totalPages,
    };
  }

  async getMyEnrolledActivities(
    userId: number,
    queryDto: ActivityQueryDto,
  ): Promise<{
    items: Activity[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const { page = 1, limit = 10, status } = queryDto;
    const skip = (page - 1) * limit;

    const queryBuilder = this.activityRepository
      .createQueryBuilder('activity')
      .leftJoinAndSelect('activity.organizer', 'organizer')
      .leftJoinAndSelect('activity.category', 'category')
      .leftJoinAndSelect('activity.images', 'images')
      .leftJoinAndSelect(
        'activity.enrollments',
        'enrollments',
        'enrollments.status = :enrolledStatus',
        {
          enrolledStatus: EnrollmentStatus.ENROLLED,
        },
      )
      .leftJoinAndSelect('enrollments.user', 'enrollmentUser')
      .innerJoin(
        'activity.enrollments',
        'myEnrollment',
        'myEnrollment.user_id = :userId AND myEnrollment.status = :enrolledStatus',
        {
          userId,
          enrolledStatus: EnrollmentStatus.ENROLLED,
        },
      );

    if (status) {
      queryBuilder.andWhere('activity.status = :status', { status });
    }

    queryBuilder.orderBy('activity.created_at', 'DESC').skip(skip).take(limit);

    const [activities, total] = await queryBuilder.getManyAndCount();
    const totalPages = Math.ceil(total / limit);

    return {
      items: activities,
      total,
      page,
      limit,
      totalPages,
    };
  }

  async getActivityEnrollments(activityId: number): Promise<any[]> {
    return this.enrollmentRepository.find({
      where: {
        activity_id: activityId,
        status: EnrollmentStatus.ENROLLED,
      },
      relations: ['user'],
      order: { enroll_time: 'ASC' },
    });
  }

  async getActivityComments(activityId: number): Promise<Comment[]> {
    return this.commentRepository.find({
      where: { activity_id: activityId },
      relations: ['user'],
      order: { create_time: 'DESC' },
    });
  }
}
