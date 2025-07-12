import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { UserService } from '../service/user.service';
import { User } from '../entities/user.entity';

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
      secretOrKey: process.env.JWT_SECRET || 'flashsport-secret-key',
    });
  }

  async validate(payload: JwtPayload): Promise<User> {
    return await this.userService.findById(payload.userId);
  }
}
