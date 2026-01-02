import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { User } from '../entities/user.entity';
import { UserController } from '../controller/user.controller';
import { UserService } from '../service/user.service';
import { DatabaseService } from '../service/database.service';
import { JwtStrategy } from '../auth/jwt.strategy';
import { jwtConfig } from '../configuration';
import { PostModule } from './post.module';
import { ActivityModule } from './activity.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([User]),
    PassportModule,
    JwtModule.register({
      secret: jwtConfig.secret,
      signOptions: { expiresIn: jwtConfig.expiresIn },
    }),
    PostModule,
    forwardRef(() => ActivityModule),
  ],
  controllers: [UserController],
  providers: [UserService, DatabaseService, JwtStrategy],
  exports: [UserService, DatabaseService],
})
export class UserModule {}
