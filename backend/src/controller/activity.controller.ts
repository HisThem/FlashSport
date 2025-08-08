import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
  ParseIntPipe,
  ForbiddenException,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ActivityService } from '../service/activity.service';
import { CommentService } from '../service/comment.service';
import {
  CreateActivityDto,
  UpdateActivityDto,
  ActivityQueryDto,
} from '../dto/activity.dto';
import { CreateCommentDto } from '../dto/comment.dto';
import { ApiResponse } from '../dto/response.dto';
import { ActivityStatus } from '../entities/activity.entity';

interface AuthenticatedRequest extends Request {
  user: {
    id: number;
    username: string;
    role?: string;
  };
}

@Controller('api/activity')
export class ActivityController {
  constructor(
    private readonly activityService: ActivityService,
    private readonly commentService: CommentService,
  ) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  async createActivity(
    @Request() req: AuthenticatedRequest,
    @Body() createActivityDto: CreateActivityDto,
  ): Promise<ApiResponse> {
    const activity = await this.activityService.createActivity(
      req.user.id,
      createActivityDto,
    );
    return {
      success: true,
      message: '活动创建成功',
      data: activity,
    };
  }

  @Get()
  async getActivities(
    @Query() queryDto: ActivityQueryDto,
  ): Promise<ApiResponse> {
    const result = await this.activityService.getActivities(queryDto);
    return {
      success: true,
      message: '获取活动列表成功',
      data: result,
    };
  }

  @Get('categories')
  async getCategories(): Promise<ApiResponse> {
    const categories = await this.activityService.getCategories();
    return {
      success: true,
      message: '获取活动分类成功',
      data: categories,
    };
  }

  @Get('my')
  @UseGuards(JwtAuthGuard)
  async getMyActivities(
    @Request() req: AuthenticatedRequest,
    @Query() queryDto: ActivityQueryDto,
  ): Promise<ApiResponse> {
    const result = await this.activityService.getMyActivities(
      req.user.id,
      queryDto,
    );
    return {
      success: true,
      message: '获取我的活动成功',
      data: result,
    };
  }

  @Get('enrolled')
  @UseGuards(JwtAuthGuard)
  async getMyEnrolledActivities(
    @Request() req: AuthenticatedRequest,
    @Query() queryDto: ActivityQueryDto,
  ): Promise<ApiResponse> {
    const result = await this.activityService.getMyEnrolledActivities(
      req.user.id,
      queryDto,
    );
    return {
      success: true,
      message: '获取我的报名活动成功',
      data: result,
    };
  }

  @Get(':id')
  async getActivity(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<ApiResponse> {
    const activity = await this.activityService.getActivityById(id);
    return {
      success: true,
      message: '获取活动详情成功',
      data: activity,
    };
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard)
  async updateActivity(
    @Param('id', ParseIntPipe) id: number,
    @Request() req: AuthenticatedRequest,
    @Body() updateActivityDto: UpdateActivityDto,
  ): Promise<ApiResponse> {
    const activity = await this.activityService.updateActivity(
      id,
      req.user.id,
      updateActivityDto,
    );
    return {
      success: true,
      message: '活动更新成功',
      data: activity,
    };
  }

  @Post(':id/enroll')
  @UseGuards(JwtAuthGuard)
  async enrollActivity(
    @Param('id', ParseIntPipe) id: number,
    @Request() req: AuthenticatedRequest,
  ): Promise<ApiResponse> {
    const enrollment = await this.activityService.enrollActivity(
      id,
      req.user.id,
    );
    return {
      success: true,
      message: '报名成功',
      data: enrollment,
    };
  }

  @Post(':id/cancel-enrollment')
  @UseGuards(JwtAuthGuard)
  async cancelEnrollment(
    @Param('id', ParseIntPipe) id: number,
    @Request() req: AuthenticatedRequest,
  ): Promise<ApiResponse> {
    await this.activityService.cancelEnrollment(id, req.user.id);
    return {
      success: true,
      message: '取消报名成功',
    };
  }

  @Get(':id/enrollments')
  async getActivityEnrollments(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<ApiResponse> {
    const enrollments = await this.activityService.getActivityEnrollments(id);
    return {
      success: true,
      message: '获取报名列表成功',
      data: enrollments,
    };
  }

  @Get(':id/comments')
  async getActivityComments(
    @Param('id', ParseIntPipe) id: number,
    @Query('page') pageStr: string = '1',
    @Query('limit') limitStr: string = '10',
  ): Promise<ApiResponse> {
    try {
      const page = parseInt(pageStr) || 1;
      const limit = parseInt(limitStr) || 10;

      const queryDto = {
        activity_id: id,
        page,
        limit,
      };
      const result = await this.commentService.getCommentsByActivity(queryDto);
      return {
        success: true,
        message: '获取评论列表成功',
        data: result.comments,
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : '获取评论列表失败';
      return {
        success: false,
        message: errorMessage,
      };
    }
  }

  @Post(':id/comments')
  @UseGuards(JwtAuthGuard)
  async createActivityComment(
    @Param('id', ParseIntPipe) activityId: number,
    @Request() req: AuthenticatedRequest,
    @Body() createCommentDto: Omit<CreateCommentDto, 'activity_id'>,
  ): Promise<ApiResponse> {
    try {
      const commentData: CreateCommentDto = {
        ...createCommentDto,
        activity_id: activityId,
      };
      const comment = await this.commentService.createComment(
        req.user.id,
        commentData,
      );
      return {
        success: true,
        message: '评论创建成功',
        data: comment,
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : '创建评论失败';
      return {
        success: false,
        message: errorMessage,
      };
    }
  }

  @Delete(':id/enroll')
  @UseGuards(JwtAuthGuard)
  async cancelEnrollmentDelete(
    @Param('id', ParseIntPipe) id: number,
    @Request() req: AuthenticatedRequest,
  ): Promise<ApiResponse> {
    await this.activityService.cancelEnrollment(id, req.user.id);
    return {
      success: true,
      message: '取消报名成功',
    };
  }

  @Post(':id/cancel')
  @UseGuards(JwtAuthGuard)
  async cancelActivity(
    @Param('id', ParseIntPipe) id: number,
    @Request() req: AuthenticatedRequest,
  ): Promise<ApiResponse> {
    await this.activityService.cancelActivity(id, req.user.id);
    return {
      success: true,
      message: '活动已取消',
    };
  }

  @Post(':id/status')
  @UseGuards(JwtAuthGuard)
  async updateActivityStatus(
    @Param('id', ParseIntPipe) id: number,
    @Request() req: AuthenticatedRequest,
    @Body() body: { status: string },
  ): Promise<ApiResponse> {
    await this.activityService.updateActivityStatus(
      id,
      req.user.id,
      body.status,
    );
    return {
      success: true,
      message: '活动状态更新成功',
    };
  }

  // 管理员接口
  @Get('admin/all')
  @UseGuards(JwtAuthGuard)
  async getAllActivitiesForAdmin(
    @Request() req: AuthenticatedRequest,
    @Query() queryDto: ActivityQueryDto,
  ): Promise<ApiResponse> {
    // 验证管理员权限
    if (req.user.role !== 'admin') {
      throw new ForbiddenException('只有管理员可以访问此接口');
    }

    const result =
      await this.activityService.getAllActivitiesForAdmin(queryDto);
    return {
      success: true,
      message: '获取所有活动成功',
      data: result,
    };
  }

  @Delete('admin/:id')
  @UseGuards(JwtAuthGuard)
  async deleteActivityAsAdmin(
    @Param('id', ParseIntPipe) id: number,
    @Request() req: AuthenticatedRequest,
  ): Promise<ApiResponse> {
    // 验证管理员权限
    if (req.user.role !== 'admin') {
      throw new ForbiddenException('只有管理员可以删除活动');
    }

    await this.activityService.deleteActivity(id);
    return {
      success: true,
      message: '活动删除成功',
    };
  }

  @Post('admin/:id/cancel')
  @UseGuards(JwtAuthGuard)
  async cancelActivityAsAdmin(
    @Param('id', ParseIntPipe) id: number,
    @Request() req: AuthenticatedRequest,
  ): Promise<ApiResponse> {
    // 验证管理员权限
    if (req.user.role !== 'admin') {
      throw new ForbiddenException('只有管理员可以取消活动');
    }

    await this.activityService.cancelActivityAsAdmin(id);
    return {
      success: true,
      message: '活动已取消',
    };
  }

  @Put('admin/:id')
  @UseGuards(JwtAuthGuard)
  async updateActivityAsAdmin(
    @Param('id', ParseIntPipe) id: number,
    @Request() req: AuthenticatedRequest,
    @Body() updateActivityDto: UpdateActivityDto,
  ): Promise<ApiResponse> {
    // 验证管理员权限
    if (req.user.role !== 'admin') {
      throw new ForbiddenException('只有管理员可以更新活动');
    }

    const activity = await this.activityService.updateActivityAsAdmin(
      id,
      updateActivityDto,
    );
    return {
      success: true,
      message: '活动更新成功',
      data: activity,
    };
  }

  @Post('admin/:id/status')
  @UseGuards(JwtAuthGuard)
  async updateActivityStatusAsAdmin(
    @Param('id', ParseIntPipe) id: number,
    @Request() req: AuthenticatedRequest,
    @Body() body: { status: ActivityStatus },
  ): Promise<ApiResponse> {
    // 验证管理员权限
    if (req.user.role !== 'admin') {
      throw new ForbiddenException('只有管理员可以更新活动状态');
    }

    await this.activityService.updateActivityStatusAsAdmin(id, body.status);
    return {
      success: true,
      message: '活动状态更新成功',
    };
  }
}
