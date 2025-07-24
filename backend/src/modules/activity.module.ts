import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { ActivityController } from '../controller/activity.controller';
import { ActivityService } from '../service/activity.service';
import { DatabaseInitService } from '../service/database-init.service';
import { Activity } from '../entities/activity.entity';
import { Category } from '../entities/category.entity';
import { Enrollment } from '../entities/enrollment.entity';
import { Comment } from '../entities/comment.entity';
import { ActivityImage } from '../entities/activity-image.entity';
import { UserModule } from './user.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Activity,
      Category,
      Enrollment,
      Comment,
      ActivityImage,
    ]),
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'fallback-secret-key',
      signOptions: { expiresIn: '7d' },
    }),
    UserModule, // 导入UserModule以使用UserService
  ],
  controllers: [ActivityController],
  providers: [ActivityService, DatabaseInitService],
  exports: [ActivityService],
})
export class ActivityModule {}
