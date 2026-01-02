import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CommentController } from '../controller/comment.controller';
import { CommentService } from '../service/comment.service';
import { Comment } from '../entities/comment.entity';
import { Post } from '../entities/post.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Comment, Post])],
  controllers: [CommentController],
  providers: [CommentService],
  exports: [CommentService],
})
export class CommentModule {}
