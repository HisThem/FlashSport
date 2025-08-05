import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CommentController } from '../controller/comment.controller';
import { CommentService } from '../service/comment.service';
import { Comment } from '../entities/comment.entity';
import { Activity } from '../entities/activity.entity';
import { Enrollment } from '../entities/enrollment.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Comment, Activity, Enrollment])],
  controllers: [CommentController],
  providers: [CommentService],
  exports: [CommentService],
})
export class CommentModule {}
