import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { UserService } from '../service/user.service';
import { User } from '../entities/user.entity';
import { jwtConfig } from '../configuration';

// 定义 JWT payload 类型
interface JwtPayload {
  userId: number;
  email: string;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private userService: UserService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: jwtConfig.secret,
    });
  }

  async validate(payload: JwtPayload): Promise<User | null> {
    if (!payload || !payload.userId) {
      return null; // 返回 null，让 Guard 处理
    }

    // 直接返回用户，如果用户不存在 findById 会抛出异常
    // Passport 会自动捕获这些异常并传递给 Guard
    return await this.userService.findById(payload.userId);
  }
}
