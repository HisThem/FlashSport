import {
  ConflictException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { User } from '../entities/user.entity';
import {
  ChangePasswordDto,
  LoginDto,
  RegisterDto,
  UpdateProfileDto,
} from '../dto/user.dto';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private jwtService: JwtService,
  ) {}

  async register(registerDto: RegisterDto): Promise<User> {
    const { username, email, password } = registerDto;

    // 检查邮箱是否已存在
    const existingUserByEmail = await this.userRepository.findOne({
      where: { email },
    });
    if (existingUserByEmail) {
      throw new ConflictException('邮箱已被注册');
    }

    // 检查用户名是否已存在
    const existingUserByUsername = await this.userRepository.findOne({
      where: { username },
    });
    if (existingUserByUsername) {
      throw new ConflictException('用户名已被占用');
    }

    // 加密密码
    const hashedPassword = await bcrypt.hash(password, 12);

    // 创建用户
    const user = this.userRepository.create({
      username,
      email,
      password: hashedPassword,
    });

    return await this.userRepository.save(user);
  }

  async login(loginDto: LoginDto): Promise<{ user: User; token: string }> {
    const { email, password } = loginDto;

    // 查找用户
    const user = await this.userRepository.findOne({ where: { email } });
    if (!user) {
      throw new UnauthorizedException('邮箱或密码错误');
    }

    // 验证密码
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('邮箱或密码错误');
    }

    // 生成JWT token
    const payload = { userId: user.id, email: user.email };
    const token = this.jwtService.sign(payload);

    return { user, token };
  }

  async findById(id: number): Promise<User> {
    if (!id || isNaN(id)) {
      throw new NotFoundException('无效的用户ID');
    }
    
    const user = await this.userRepository.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException('用户不存在');
    }
    
    // 创建一个新对象，不包含密码字段
    const { password, ...userWithoutPassword } = user;
    return userWithoutPassword as User;
  }

  async updateProfile(
    userId: number,
    updateProfileDto: UpdateProfileDto,
  ): Promise<User> {
    // 直接从数据库获取用户（包含所有字段）
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('用户不存在');
    }

    // 如果更新用户名，检查是否已存在
    if (
      updateProfileDto.username &&
      updateProfileDto.username !== user.username
    ) {
      const existingUser = await this.userRepository.findOne({
        where: { username: updateProfileDto.username },
      });
      if (existingUser) {
        throw new ConflictException('用户名已被占用');
      }
    }

    Object.assign(user, updateProfileDto);
    const savedUser = await this.userRepository.save(user);
    
    // 返回时移除密码字段
    const { password, ...userWithoutPassword } = savedUser;
    return userWithoutPassword as User;
  }

  async changePassword(
    userId: number,
    changePasswordDto: ChangePasswordDto,
  ): Promise<void> {
    const { oldPassword, newPassword } = changePasswordDto;
    
    // 直接从数据库获取用户（包含密码字段）
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('用户不存在');
    }

    // 验证旧密码
    const isOldPasswordValid = await bcrypt.compare(oldPassword, user.password);
    if (!isOldPasswordValid) {
      throw new UnauthorizedException('旧密码错误');
    }

    // 加密新密码
    user.password = await bcrypt.hash(newPassword, 12);

    await this.userRepository.save(user);
  }

  async checkEmailExists(email: string): Promise<boolean> {
    const user = await this.userRepository.findOne({ where: { email } });
    return !!user;
  }

  async checkUsernameExists(username: string): Promise<boolean> {
    const user = await this.userRepository.findOne({ where: { username } });
    return !!user;
  }

  async validateUser(email: string, password: string): Promise<User | null> {
    const user = await this.userRepository.findOne({ where: { email } });
    if (user && (await bcrypt.compare(password, user.password))) {
      return user;
    }
    return null;
  }
}
