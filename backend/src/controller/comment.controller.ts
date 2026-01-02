import {
  Controller,
  Post,
  Get,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
  ParseIntPipe,
} from '@nestjs/common';
import { CommentService } from '../service/comment.service';
import {
  CreateCommentDto,
  UpdateCommentDto,
  CommentQueryDto,
} from '../dto/comment.dto';
import { ApiResponse } from '../dto/response.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { User } from '../entities/user.entity';

// 定义认证请求的类型
interface AuthenticatedRequest extends Request {
  user: User;
}

@Controller('api/comments')
export class CommentController {
  constructor(private readonly commentService: CommentService) {}

  @Get('post/:postId')
  async getCommentsByPost(
    @Param('postId', ParseIntPipe) postId: number,
    @Query('page') pageStr: string = '1',
    @Query('limit') limitStr: string = '10',
  ): Promise<ApiResponse> {
    try {
      const page = parseInt(pageStr) || 1;
      const limit = parseInt(limitStr) || 10;

      const queryDto: CommentQueryDto = {
        post_id: postId,
        page,
        limit,
      };
      const result = await this.commentService.getCommentsByPost(queryDto);
      return ApiResponse.success(result.comments, '获取评论列表成功');
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : '获取评论列表失败';
      return ApiResponse.error(errorMessage);
    }
  }

  @Post('post/:postId')
  @UseGuards(JwtAuthGuard)
  async createPostComment(
    @Param('postId', ParseIntPipe) postId: number,
    @Request() req: AuthenticatedRequest,
    @Body() createCommentDto: Omit<CreateCommentDto, 'post_id'>,
  ): Promise<ApiResponse> {
    try {
      const commentData: CreateCommentDto = {
        ...createCommentDto,
        post_id: postId,
      };
      const comment = await this.commentService.createComment(
        req.user.id,
        commentData,
      );
      return ApiResponse.success(comment, '评论创建成功');
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : '创建评论失败';
      return ApiResponse.error(errorMessage);
    }
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard)
  async updateComment(
    @Request() req: AuthenticatedRequest,
    @Param('id', ParseIntPipe) commentId: number,
    @Body() updateCommentDto: UpdateCommentDto,
  ): Promise<ApiResponse> {
    try {
      const userId = req.user.id;
      const comment = await this.commentService.updateComment(
        userId,
        commentId,
        updateCommentDto,
      );
      return ApiResponse.success(comment, '评论更新成功');
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : '更新评论失败';
      return ApiResponse.error(errorMessage);
    }
  }

  @Get('user/my')
  @UseGuards(JwtAuthGuard)
  async getMyComments(
    @Request() req: AuthenticatedRequest,
    @Query('page') pageStr: string = '1',
    @Query('limit') limitStr: string = '10',
  ): Promise<ApiResponse> {
    try {
      const userId = req.user.id;
      const page = parseInt(pageStr) || 1;
      const limit = parseInt(limitStr) || 10;

      const result = await this.commentService.getUserComments(
        userId,
        page,
        limit,
      );
      return ApiResponse.success(result, '获取我的评论成功');
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : '获取我的评论失败';
      return ApiResponse.error(errorMessage);
    }
  }

  @Get(':id')
  async getCommentById(
    @Param('id', ParseIntPipe) commentId: number,
  ): Promise<ApiResponse> {
    try {
      const comment = await this.commentService.getCommentById(commentId);
      return ApiResponse.success(comment, '获取评论详情成功');
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : '获取评论详情失败';
      return ApiResponse.error(errorMessage);
    }
  }

  @Delete('admin/:id')
  @UseGuards(JwtAuthGuard)
  async deleteCommentAsAdmin(
    @Request() req: AuthenticatedRequest,
    @Param('id', ParseIntPipe) commentId: number,
  ): Promise<ApiResponse> {
    try {
      if (req.user.role !== 'admin') {
        return ApiResponse.error('权限不足');
      }

      await this.commentService.deleteCommentAsAdmin(commentId);
      return ApiResponse.success(null, '评论删除成功');
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : '删除评论失败';
      return ApiResponse.error(errorMessage);
    }
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  async deleteComment(
    @Request() req: AuthenticatedRequest,
    @Param('id', ParseIntPipe) commentId: number,
  ): Promise<ApiResponse> {
    try {
      const userId = req.user.id;
      await this.commentService.deleteComment(userId, commentId);
      return ApiResponse.success(null, '评论删除成功');
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : '删除评论失败';
      return ApiResponse.error(errorMessage);
    }
  }
}
