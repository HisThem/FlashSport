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

    // 批量更新活动状态
    await Promise.all(
      activities.map((activity) => this.updateActivityStatusByTime(activity)),
    );

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

    // 自动更新活动状态
    await this.updateActivityStatusByTime(activity);

    return activity;
  }

  /**
   * 根据时间自动更新活动状态
   */
  private async updateActivityStatusByTime(activity: Activity): Promise<void> {
    // 如果活动已取消，不更新状态
    if (activity.status === ActivityStatus.CANCELLED) {
      return;
    }

    const now = new Date();
    const registrationDeadline = new Date(activity.registration_deadline);
    const startTime = new Date(activity.start_time);
    const endTime = new Date(activity.end_time);

    let newStatus: ActivityStatus | null = null;

    // 根据时间判断状态
    if (now > endTime) {
      // 活动结束后
      newStatus = ActivityStatus.FINISHED;
    } else if (now >= startTime && now <= endTime) {
      // 活动进行中
      newStatus = ActivityStatus.ONGOING;
    } else if (now > registrationDeadline && now < startTime) {
      // 报名截止后，活动开始前
      newStatus = ActivityStatus.REGISTRATION_CLOSED;
    } else if (
      now <= registrationDeadline &&
      activity.status === ActivityStatus.PREPARING
    ) {
      // 报名期间，如果当前是筹备中，可能需要手动设置为报名中
      // 这里不自动设置，保持手动控制
    }

    // 如果需要更新状态且状态不同，则更新
    if (newStatus && newStatus !== activity.status) {
      activity.status = newStatus;
      await this.activityRepository.save(activity);
    }
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

    // 检查活动状态：只有筹备中、报名中或报名已截止的活动可以修改
    if (
      activity.status === ActivityStatus.FINISHED ||
      activity.status === ActivityStatus.CANCELLED ||
      activity.status === ActivityStatus.ONGOING
    ) {
      throw new ForbiddenException('进行中、已结束或已取消的活动不能修改');
    }

    // 检查活动开始时间：活动开始后不能修改活动内容
    if (new Date() >= activity.start_time) {
      throw new ForbiddenException('活动开始后不能修改活动内容');
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

  async enrollActivity(
    activityId: number,
    userId: number,
  ): Promise<Enrollment> {
    const activity = await this.getActivityById(activityId);

    // 检查活动状态
    if (activity.status !== ActivityStatus.RECRUITING) {
      throw new BadRequestException('该活动当前不接受报名');
    }

    // 检查报名截止时间
    if (new Date() > activity.registration_deadline) {
      throw new BadRequestException('报名时间已截止');
    }

    // 检查是否已报名（活跃状态）
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

    // 检查是否有已取消的报名记录
    const cancelledEnrollment = await this.enrollmentRepository.findOne({
      where: {
        activity_id: activityId,
        user_id: userId,
        status: EnrollmentStatus.CANCELLED,
      },
    });

    let enrollment: Enrollment;

    if (cancelledEnrollment) {
      // 如果有已取消的记录，重新激活它
      cancelledEnrollment.status = EnrollmentStatus.ENROLLED;
      enrollment = await this.enrollmentRepository.save(cancelledEnrollment);
    } else {
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

      // 创建新的报名记录
      const newEnrollment = this.enrollmentRepository.create({
        activity_id: activityId,
        user_id: userId,
      });
      enrollment = await this.enrollmentRepository.save(newEnrollment);
    }

    // 返回包含用户信息的报名记录
    const enrollmentWithUser = await this.enrollmentRepository.findOne({
      where: { id: enrollment.id },
      relations: ['user'],
    });

    if (!enrollmentWithUser) {
      throw new Error('报名记录创建失败');
    }

    return enrollmentWithUser;
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

  async cancelActivity(activityId: number, userId: number): Promise<void> {
    const activity = await this.getActivityById(activityId);

    // 检查权限：只有活动组织者可以取消
    if (activity.organizer_id !== userId) {
      throw new ForbiddenException('只有活动组织者可以取消活动');
    }

    // 检查活动状态：只有筹备中、报名中或报名已截止的活动可以取消
    if (
      activity.status === ActivityStatus.FINISHED ||
      activity.status === ActivityStatus.CANCELLED ||
      activity.status === ActivityStatus.ONGOING
    ) {
      throw new BadRequestException('进行中、已结束或已取消的活动无法取消');
    }

    // 检查活动开始时间：活动开始后不能取消活动
    if (new Date() >= activity.start_time) {
      throw new ForbiddenException('活动开始后不能取消活动');
    }

    // 更新活动状态为已取消
    activity.status = ActivityStatus.CANCELLED;
    await this.activityRepository.save(activity);

    // 取消所有已报名用户的报名
    await this.enrollmentRepository.update(
      {
        activity_id: activityId,
        status: EnrollmentStatus.ENROLLED,
      },
      {
        status: EnrollmentStatus.CANCELLED,
      },
    );
  }

  async updateActivityStatus(
    activityId: number,
    userId: number,
    status: string,
  ): Promise<void> {
    const activity = await this.getActivityById(activityId);

    // 检查权限：只有活动组织者可以更改状态
    if (activity.organizer_id !== userId) {
      throw new ForbiddenException('只有活动组织者可以更改活动状态');
    }

    // 验证状态值
    if (!Object.values(ActivityStatus).includes(status as ActivityStatus)) {
      throw new BadRequestException('无效的活动状态');
    }

    // 检查活动结束时间：活动结束后不能更改状态
    if (new Date() > activity.end_time) {
      throw new ForbiddenException('活动结束后不能更改活动状态');
    }

    // 状态转换逻辑检查
    const currentStatus = activity.status;
    const newStatus = status as ActivityStatus;

    // 已取消的活动不能改变状态
    if (currentStatus === ActivityStatus.CANCELLED) {
      throw new BadRequestException('已取消的活动不能更改状态');
    }

    // 更新状态
    activity.status = newStatus;
    await this.activityRepository.save(activity);
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

  // 管理员方法
  async getAllActivitiesForAdmin(queryDto: ActivityQueryDto): Promise<{
    items: Activity[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const {
      page = 1,
      limit = 10,
      keyword,
      category_id,
      status,
      sort = 'newest',
    } = queryDto;

    let query = this.activityRepository
      .createQueryBuilder('activity')
      .leftJoinAndSelect('activity.category', 'category')
      .leftJoinAndSelect('activity.organizer', 'organizer')
      .leftJoinAndSelect('activity.images', 'images');

    // 搜索条件
    if (keyword) {
      query = query.where(
        'activity.title LIKE :keyword OR activity.description LIKE :keyword',
        { keyword: `%${keyword}%` },
      );
    }

    // 分类筛选
    if (category_id) {
      query = query.andWhere('activity.category_id = :category_id', {
        category_id,
      });
    }

    // 状态筛选
    if (status) {
      query = query.andWhere('activity.status = :status', { status });
    }

    // 排序
    if (sort === 'newest') {
      query = query.orderBy('activity.created_at', 'DESC');
    } else if (sort === 'oldest') {
      query = query.orderBy('activity.created_at', 'ASC');
    } else if (sort === 'start_time') {
      query = query.orderBy('activity.start_time', 'ASC');
    } else if (sort === 'participants') {
      // 这里需要添加子查询来计算参与者数量
      query = query
        .leftJoin(
          'enrollments',
          'enrollment',
          'enrollment.activity_id = activity.id AND enrollment.status = :enrolledStatus',
          { enrolledStatus: 'enrolled' },
        )
        .addSelect('COUNT(enrollment.id)', 'participant_count')
        .groupBy('activity.id')
        .orderBy('participant_count', 'DESC');
    }

    // 分页
    const total = await query.getCount();
    const activities = await query
      .skip((page - 1) * limit)
      .take(limit)
      .getMany();

    const totalPages = Math.ceil(total / limit);

    return {
      items: activities,
      total,
      page,
      limit,
      totalPages,
    };
  }

  async deleteActivity(activityId: number): Promise<void> {
    // 验证管理员权限（这里假设已在控制器层验证）
    const activity = await this.activityRepository.findOne({
      where: { id: activityId },
    });

    if (!activity) {
      throw new NotFoundException('活动不存在');
    }

    // 删除相关的报名记录
    await this.enrollmentRepository.delete({ activity_id: activityId });

    // 删除相关的评论
    await this.commentRepository.delete({ activity_id: activityId });

    // 删除相关的图片记录
    await this.activityImageRepository.delete({ activity_id: activityId });

    // 删除活动
    await this.activityRepository.delete(activityId);
  }

  async updateActivityStatusAsAdmin(
    activityId: number,
    status: ActivityStatus,
  ): Promise<void> {
    const activity = await this.activityRepository.findOne({
      where: { id: activityId },
    });

    if (!activity) {
      throw new NotFoundException('活动不存在');
    }

    activity.status = status;
    await this.activityRepository.save(activity);
  }

  async cancelActivityAsAdmin(activityId: number): Promise<void> {
    const activity = await this.activityRepository.findOne({
      where: { id: activityId },
    });

    if (!activity) {
      throw new NotFoundException('活动不存在');
    }

    if (activity.status === ActivityStatus.FINISHED) {
      throw new BadRequestException('已结束的活动无法取消');
    }

    activity.status = ActivityStatus.CANCELLED;
    await this.activityRepository.save(activity);

    // 取消所有相关的报名
    await this.enrollmentRepository.update(
      { activity_id: activityId, status: EnrollmentStatus.ENROLLED },
      { status: EnrollmentStatus.CANCELLED },
    );
  }
}
