import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Post } from '../entities/post.entity';
import { Activity } from '../entities/activity.entity';
import { User } from '../entities/user.entity';
import { PostService } from '../service/post.service';
import { PostController } from '../controller/post.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Post, Activity, User])],
  providers: [PostService],
  controllers: [PostController],
  exports: [PostService],
})
export class PostModule {}
