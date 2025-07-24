import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  JoinColumn,
} from 'typeorm';
import { User } from './user.entity';
import { Activity } from './activity.entity';

@Entity('comments')
export class Comment {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  activity_id: number;

  @Column()
  user_id: number;

  @Column('int', { default: 5 })
  rating: number; // 1-5 星评分

  @Column('text')
  content: string;

  @CreateDateColumn()
  create_time: Date;

  // 关联关系
  @ManyToOne(() => Activity, (activity) => activity.comments)
  @JoinColumn({ name: 'activity_id' })
  activity: Activity;

  @ManyToOne(() => User, { eager: true })
  @JoinColumn({ name: 'user_id' })
  user: User;
}
