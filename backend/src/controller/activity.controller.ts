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
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ActivityService } from '../service/activity.service';
import {
  CreateActivityDto,
  UpdateActivityDto,
  ActivityQueryDto,
  CreateCommentDto,
} from '../dto/activity.dto';
import { ApiResponse } from '../dto/response.dto';

@Controller('api/activity')
export class ActivityController {
  constructor(private readonly activityService: ActivityService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  async createActivity(
    @Request() req: any,
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
  async getActivities(@Query() queryDto: ActivityQueryDto): Promise<ApiResponse> {
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
    @Request() req: any,
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
    @Request() req: any,
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
  async getActivity(@Param('id', ParseIntPipe) id: number): Promise<ApiResponse> {
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
    @Request() req: any,
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
    @Request() req: any,
  ): Promise<ApiResponse> {
    await this.activityService.enrollActivity(id, req.user.id);
    return {
      success: true,
      message: '报名成功',
    };
  }

  @Post(':id/cancel-enrollment')
  @UseGuards(JwtAuthGuard)
  async cancelEnrollment(
    @Param('id', ParseIntPipe) id: number,
    @Request() req: any,
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
  ): Promise<ApiResponse> {
    const comments = await this.activityService.getActivityComments(id);
    return {
      success: true,
      message: '获取评论列表成功',
      data: comments,
    };
  }

  @Delete(':id/enroll')
  @UseGuards(JwtAuthGuard)
  async cancelEnrollmentDelete(
    @Param('id', ParseIntPipe) id: number,
    @Request() req: any,
  ): Promise<ApiResponse> {
    await this.activityService.cancelEnrollment(id, req.user.id);
    return {
      success: true,
      message: '取消报名成功',
    };
  }
}
