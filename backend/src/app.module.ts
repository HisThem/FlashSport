import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { UserModule } from './modules/user.module';
import { ActivityModule } from './modules/activity.module';
import { CommentModule } from './modules/comment.module';
import { databaseConfig } from './config/database.config';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    TypeOrmModule.forRoot(databaseConfig),
    UserModule,
    ActivityModule,
    CommentModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
