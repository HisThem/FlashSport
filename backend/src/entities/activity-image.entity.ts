import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Activity } from './activity.entity';

@Entity('activity_images')
export class ActivityImage {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  activity_id: number;

  @Column()
  image_url: string;

  // 关联关系
  @ManyToOne(() => Activity, (activity) => activity.images)
  @JoinColumn({ name: 'activity_id' })
  activity: Activity;
}
