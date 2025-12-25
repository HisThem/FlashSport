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
import { PostService } from '../service/post.service';
import { CreatePostDto, UpdatePostDto, PostQueryDto } from '../dto/post.dto';
import { ApiResponse } from '../dto/response.dto';

interface AuthenticatedRequest extends Request {
  user: {
    id: number;
    username: string;
    role?: string;
  };
}

@Controller('api/post')
export class PostController {
  constructor(private readonly postService: PostService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  async createPost(
    @Request() req: AuthenticatedRequest,
    @Body() createPostDto: CreatePostDto,
  ): Promise<ApiResponse> {
    const post = await this.postService.createPost(req.user.id, createPostDto);
    return {
      success: true,
      message: '帖子发布成功',
      data: post,
    };
  }

  @Get()
  async getPosts(@Query() queryDto: PostQueryDto): Promise<ApiResponse> {
    const result = await this.postService.getPosts(queryDto);
    return {
      success: true,
      message: '获取帖子列表成功',
      data: result,
    };
  }

  @Get(':id')
  async getPostById(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<ApiResponse> {
    const post = await this.postService.getPostById(id);
    return {
      success: true,
      message: '获取帖子成功',
      data: post,
    };
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard)
  async updatePost(
    @Param('id', ParseIntPipe) id: number,
    @Request() req: AuthenticatedRequest,
    @Body() updatePostDto: UpdatePostDto,
  ): Promise<ApiResponse> {
    const post = await this.postService.updatePost(
      id,
      req.user.id,
      updatePostDto,
    );
    return {
      success: true,
      message: '帖子更新成功',
      data: post,
    };
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  async deletePost(
    @Param('id', ParseIntPipe) id: number,
    @Request() req: AuthenticatedRequest,
  ): Promise<ApiResponse> {
    await this.postService.deletePost(id, req.user.id);
    return {
      success: true,
      message: '帖子删除成功',
      data: null,
    };
  }

  @Post(':id/like')
  @UseGuards(JwtAuthGuard)
  async likePost(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<ApiResponse> {
    const post = await this.postService.incrementLikeCount(id);
    return {
      success: true,
      message: '点赞成功',
      data: post,
    };
  }

  @Delete(':id/like')
  @UseGuards(JwtAuthGuard)
  async unlikePost(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<ApiResponse> {
    const post = await this.postService.decrementLikeCount(id);
    return {
      success: true,
      message: '取消点赞成功',
      data: post,
    };
  }
}
