import {
  Controller,
  Post,
  Get,
  Put,
  Body,
  UseGuards,
  Request,
  Query,
} from '@nestjs/common';
import { UserService } from '../service/user.service';
import { DatabaseService } from '../service/database.service';
import { User } from '../entities/user.entity';
import {
  LoginDto,
  RegisterDto,
  UpdateProfileDto,
  ChangePasswordDto,
} from '../dto/user.dto';
import {
  ApiResponse,
  LoginResponse,
  RegisterResponse,
} from '../dto/response.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

// 定义认证请求的类型
interface AuthenticatedRequest extends Request {
  user: User;
}

@Controller('api')
export class UserController {
  constructor(
    private readonly userService: UserService,
    private readonly databaseService: DatabaseService,
  ) {}

  // 认证相关路由
  @Post('auth/register')
  async register(@Body() registerDto: RegisterDto): Promise<RegisterResponse> {
    try {
      const user = await this.userService.register(registerDto);
      return {
        success: true,
        message: '注册成功',
        data: { user },
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '注册失败';
      return {
        success: false,
        message: errorMessage,
      };
    }
  }

  @Post('auth/login')
  async login(@Body() loginDto: LoginDto): Promise<LoginResponse> {
    try {
      const result = await this.userService.login(loginDto);
      return {
        success: true,
        message: '登录成功',
        data: result,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '登录失败';
      return {
        success: false,
        message: errorMessage,
        data: { user: null, token: '' },
      };
    }
  }

  @Post('auth/logout')
  @UseGuards(JwtAuthGuard)
  logout(): ApiResponse {
    // JWT是无状态的，前端删除token即可实现登出
    return ApiResponse.success(null, '登出成功');
  }

  @Get('auth/check-email')
  async checkEmailExists(
    @Query('email') email: string,
  ): Promise<ApiResponse<{ exists: boolean }>> {
    const exists = await this.userService.checkEmailExists(email);
    return ApiResponse.success({ exists });
  }

  @Get('auth/check-username')
  async checkUsernameExists(
    @Query('username') username: string,
  ): Promise<ApiResponse<{ exists: boolean }>> {
    const exists = await this.userService.checkUsernameExists(username);
    return ApiResponse.success({ exists });
  }

  // 用户相关路由
  @Get('user/profile')
  @UseGuards(JwtAuthGuard)
  getCurrentUser(@Request() req: AuthenticatedRequest): ApiResponse {
    try {
      const user: User = req.user;
      return ApiResponse.success(user, '获取用户信息成功');
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : '获取用户信息失败';
      return ApiResponse.error(errorMessage);
    }
  }

  @Put('user/profile')
  @UseGuards(JwtAuthGuard)
  async updateProfile(
    @Request() req: AuthenticatedRequest,
    @Body() updateProfileDto: UpdateProfileDto,
  ): Promise<ApiResponse> {
    try {
      const userId: number = req.user.id;
      const user = await this.userService.updateProfile(
        userId,
        updateProfileDto,
      );
      return ApiResponse.success(user, '更新用户信息成功');
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : '更新用户信息失败';
      return ApiResponse.error(errorMessage);
    }
  }

  @Put('user/change-password')
  @UseGuards(JwtAuthGuard)
  async changePassword(
    @Request() req: AuthenticatedRequest,
    @Body() changePasswordDto: ChangePasswordDto,
  ): Promise<ApiResponse> {
    try {
      const userId: number = req.user.id;
      await this.userService.changePassword(userId, changePasswordDto);
      return ApiResponse.success(null, '密码修改成功');
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : '密码修改失败';
      return ApiResponse.error(errorMessage);
    }
  }

  @Get('database/info')
  getDatabaseInfo(): ApiResponse {
    const stats = this.databaseService.getDatabaseStats();
    return ApiResponse.success(stats, '获取数据库信息成功');
  }
}
