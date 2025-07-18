import {
  Injectable,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  canActivate(context: ExecutionContext) {
    return super.canActivate(context);
  }

  handleRequest(err: any, user: any, info: any) {
    // 如果有错误或者用户不存在，抛出未授权异常
    if (err || !user) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
      const errorMessage = err?.message || info?.message || 'token验证失败';
      throw new UnauthorizedException(errorMessage);
    }
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    return user;
  }
}
