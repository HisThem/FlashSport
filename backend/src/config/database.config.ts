import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { User } from '../entities/user.entity';
import { Activity } from '../entities/activity.entity';
import { Category } from '../entities/category.entity';
import { Enrollment } from '../entities/enrollment.entity';
import { Comment } from '../entities/comment.entity';
import { ActivityImage } from '../entities/activity-image.entity';
import * as path from 'path';

export const databaseConfig: TypeOrmModuleOptions = {
  type: 'better-sqlite3',
  database:
    process.env.DB_PATH || path.join(process.cwd(), 'data', 'flashsport.db'),
  entities: [User, Activity, Category, Enrollment, Comment, ActivityImage],
  synchronize: process.env.NODE_ENV !== 'production', // 生产环境中应该设置为false
  logging: process.env.NODE_ENV === 'development',
  // SQLite 特定配置
  enableWAL: true, // 启用 WAL 模式以提高并发性能
  cache: {
    type: 'database',
    options: {
      type: 'better-sqlite3',
    },
  },
};
